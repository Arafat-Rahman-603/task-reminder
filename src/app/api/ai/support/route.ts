import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import SupportTicket from "@/models/SupportTicket";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";
import {
  generateAgentTurn,
  redactSecretTokens,
  resolveEffectiveAiTargets,
  type AgentMessageTurn,
} from "@/lib/ai/llm-providers";
import {
  buildFallbackSupportReply,
  buildSupportSystemPrompt,
  parseSupportModelOutput,
  type SupportUserDiagnosticContext,
} from "@/lib/ai/support-knowledge";

export const dynamic = "force-dynamic";

const SupportChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .min(1)
    .max(16),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = SupportChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid support question." },
        { status: 400 }
      );
    }

    await dbConnect();
    const userId = session.user.id;
    const userObjId = new mongoose.Types.ObjectId(userId);

    const [userDoc, openTicketsCount, wsInfo] = await Promise.all([
      User.findById(userObjId)
        .select("name preferences subscription")
        .lean(),
      SupportTicket.countDocuments({
        userId: userObjId,
        status: { $ne: "resolved" },
      }),
      getActiveWorkspaceInfo().catch(() => null),
    ]);

    const rawPrefs = (userDoc?.preferences || {}) as Record<string, unknown>;
    const rawModules = (rawPrefs.modules || {}) as Record<string, boolean>;
    const disabledModules = Object.entries(rawModules)
      .filter(([, enabled]) => enabled === false)
      .map(([name]) => name);

    const rawAi = (rawPrefs.aiSettings || {}) as Record<string, unknown>;
    const rawSub = (userDoc?.subscription || {}) as Record<string, unknown>;

    const diag: SupportUserDiagnosticContext = {
      userName: userDoc?.name || session.user.name || undefined,
      plan: typeof rawSub.plan === "string" ? rawSub.plan : "free",
      disabledModules,
      activeWorkspaceName: wsInfo?.activeWorkspace?.name || "Personal",
      activeWorkspaceType:
        wsInfo?.activeWorkspace?.type === "team" ? "team" : "personal",
      activeWorkspaceRole: wsInfo?.activeWorkspace?.role || "owner",
      useCustomAiProvider: Boolean(rawAi.useCustomProvider),
      openTicketsCount,
    };

    const incomingMessages = parsed.data.messages;
    const latestUserMessage =
      [...incomingMessages].reverse().find((m) => m.role === "user")?.content ||
      incomingMessages[incomingMessages.length - 1].content;

    try {
      const { candidates } = await resolveEffectiveAiTargets(userId);
      const systemPrompt = buildSupportSystemPrompt(diag);
      const turns: AgentMessageTurn[] = incomingMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const llmRes = await generateAgentTurn(candidates, systemPrompt, turns, {
        enableTools: false,
      });

      if (llmRes.text && llmRes.text.trim()) {
        const result = parseSupportModelOutput(llmRes.text, latestUserMessage);
        return NextResponse.json({
          ...result,
          source: "ai" as const,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        "[Instant Support AI Fallback]",
        redactSecretTokens(msg)
      );
    }

    const fallback = buildFallbackSupportReply(latestUserMessage, diag);
    return NextResponse.json({
      ...fallback,
      source: "fallback" as const,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Support request failed";
    console.error("[Instant Support API Error]", redactSecretTokens(msg));
    return NextResponse.json(
      { error: "Unable to process support request right now." },
      { status: 500 }
    );
  }
}
