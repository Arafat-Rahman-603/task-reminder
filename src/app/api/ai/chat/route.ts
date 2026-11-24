import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import AiConversation, { IPendingApprovalState } from "@/models/AiConversation";
import AiMessage from "@/models/AiMessage";
import { MissingAiKeyError } from "@/lib/ai/gemini-client";
import { runManageoAgentGraph } from "@/lib/ai/agent-graph";
import {
  redactSecretTokens,
  sanitizeAiErrorForClient,
  type AgentMessageTurn,
} from "@/lib/ai/llm-providers";
import User from "@/models/User";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";

export const dynamic = "force-dynamic";

const PendingApprovalDecisionSchema = z.object({
  callId: z.string().min(1),
  name: z.string().min(1),
  args: z.record(z.string(), z.unknown()).default({}),
  decision: z.enum(["approve", "reject"]),
});

const ChatRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
  workspaceId: z.string().optional(),
  permissionMode: z.enum(["review", "default_approved", "turbo"]).optional(),
  pendingApprovals: z.array(PendingApprovalDecisionSchema).optional(),
});

function deriveConversationTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New Chat";
  return cleaned.length > 52 ? `${cleaned.slice(0, 49)}...` : cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid chat request payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();
    const userId = session.user.id;
    const userObjId = new mongoose.Types.ObjectId(userId);

    let workspaceId = parsed.data.workspaceId;
    if (!workspaceId) {
      const wsInfo = await getActiveWorkspaceInfo();
      workspaceId = wsInfo?.activeWorkspace?._id;
    }
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return NextResponse.json({ error: "No active workspace found" }, { status: 400 });
    }
    const wsObjId = new mongoose.Types.ObjectId(workspaceId);

    // 1. Load or create DB conversation thread
    let conversation =
      parsed.data.conversationId && mongoose.Types.ObjectId.isValid(parsed.data.conversationId)
        ? await AiConversation.findOne({ _id: parsed.data.conversationId, userId: userObjId })
        : null;

    const latestIncomingText =
      parsed.data.message?.trim() ||
      (parsed.data.messages && parsed.data.messages.length > 0
        ? parsed.data.messages[parsed.data.messages.length - 1].content.trim()
        : "");

    if (!conversation) {
      conversation = await AiConversation.create({
        userId: userObjId,
        workspaceId: wsObjId,
        title: deriveConversationTitle(latestIncomingText),
        lastMessageAt: new Date(),
      });
    } else if (
      (conversation.title === "New Chat" || !conversation.title) &&
      latestIncomingText
    ) {
      conversation.title = deriveConversationTitle(latestIncomingText);
    }

    // 2. Persist incoming user turn if this is not purely an approval-resolution call
    if (latestIncomingText && !(parsed.data.pendingApprovals && parsed.data.pendingApprovals.length > 0)) {
      await AiMessage.create({
        conversationId: conversation._id,
        userId: userObjId,
        workspaceId: wsObjId,
        role: "user",
        content: latestIncomingText,
        resolved: true,
      });
    }

    // 3. Build graph history from either pending approval state or DB messages
    let graphHistory: AgentMessageTurn[] = [];
    const pendingApprovals = parsed.data.pendingApprovals;

    if (pendingApprovals && pendingApprovals.length > 0) {
      const savedPending = conversation.pendingApprovalState as IPendingApprovalState | null;
      if (savedPending?.messageId && mongoose.Types.ObjectId.isValid(savedPending.messageId)) {
        await AiMessage.updateOne(
          { _id: savedPending.messageId, userId: userObjId },
          { $set: { resolved: true } }
        );
      }
      if (savedPending?.historySnapshot && Array.isArray(savedPending.historySnapshot)) {
        graphHistory = savedPending.historySnapshot as unknown as AgentMessageTurn[];
      }
    }

    if (graphHistory.length === 0) {
      const recentMsgs = await AiMessage.find({
        conversationId: conversation._id,
        userId: userObjId,
      })
        .sort({ createdAt: -1 })
        .limit(22)
        .lean();

      recentMsgs.reverse();
      graphHistory = recentMsgs
        .filter((m) => (m.content || "").trim().length > 0)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content || "",
        }));

      if (graphHistory.length === 0 && parsed.data.messages && parsed.data.messages.length > 0) {
        graphHistory = parsed.data.messages
          .filter((m) => m.content.trim().length > 0)
          .map((m) => ({ role: m.role, content: m.content }));
      }
    }

    const latestQueryForRag =
      latestIncomingText ||
      [...graphHistory].reverse().find((m) => m.role === "user")?.content ||
      "workspace overview";

    // 4. Execute Stateful Hybrid RAG + Multi-Provider Failover Agent Graph
    let graphResult;
    try {
      graphResult = await runManageoAgentGraph({
        userId,
        workspaceId,
        history: graphHistory,
        latestUserMessage: latestQueryForRag,
        conversationSummary: conversation.summary || "",
        permissionModeOverride: parsed.data.permissionMode,
        pendingApprovals,
      });
    } catch (err) {
      if (err instanceof MissingAiKeyError) {
        return NextResponse.json(
          { error: sanitizeAiErrorForClient(err), code: "MISSING_API_KEY" },
          { status: 400 }
        );
      }
      throw err;
    }

    // 5. Persist Assistant Message & Conversation Metadata
    const savedAssistantMsg = await AiMessage.create({
      conversationId: conversation._id,
      userId: userObjId,
      workspaceId: wsObjId,
      role: "assistant",
      content: graphResult.reply,
      executedActions: graphResult.executedActions,
      pendingCalls: graphResult.pendingCalls || [],
      resolved: graphResult.status !== "requires_approval",
      provider: graphResult.providerUsed,
      model: graphResult.modelUsed,
      ragSources: graphResult.ragSources,
    });

    const totalCount = await AiMessage.countDocuments({
      conversationId: conversation._id,
      userId: userObjId,
    });

    conversation.messageCount = totalCount;
    conversation.lastMessageAt = new Date();
    if (graphResult.status === "requires_approval" && graphResult.pendingCalls) {
      conversation.pendingApprovalState = {
        messageId: savedAssistantMsg._id.toString(),
        pendingCalls: graphResult.pendingCalls,
        historySnapshot: (graphResult.historySnapshot || []) as unknown as Array<
          Record<string, unknown>
        >,
      };
    } else {
      conversation.pendingApprovalState = null;
    }
    await conversation.save();

    return NextResponse.json({
      status: graphResult.status,
      conversationId: conversation._id.toString(),
      conversationTitle: conversation.title,
      messageId: savedAssistantMsg._id.toString(),
      reply: graphResult.reply,
      executedActions: graphResult.executedActions,
      pendingCalls: graphResult.pendingCalls || [],
      ragSources: graphResult.ragSources,
      mutated: graphResult.mutated,
      provider: graphResult.providerUsed,
      model: graphResult.modelUsed,
    });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    console.error("[AI Chat Route] Error:", redactSecretTokens(rawMsg));
    let isCustomUserProvider = false;
    try {
      const s = await getServerSession(authOptions);
      if (s?.user?.id) {
        const u = await User.findById(s.user.id)
          .select("preferences.aiSettings.useCustomProvider")
          .lean();
        isCustomUserProvider = Boolean(
          (u?.preferences as { aiSettings?: { useCustomProvider?: boolean } } | undefined)
            ?.aiSettings?.useCustomProvider
        );
      }
    } catch {
      // ignore lookup error
    }
    const safeMessage = sanitizeAiErrorForClient(err, { isCustomUserProvider });
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
