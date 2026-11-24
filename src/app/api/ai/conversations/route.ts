import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import AiConversation from "@/models/AiConversation";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";

export const dynamic = "force-dynamic";

const CreateConversationSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  workspaceId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    let workspaceId = searchParams.get("workspaceId") || undefined;
    const query = searchParams.get("q")?.trim() || "";

    if (!workspaceId) {
      const wsInfo = await getActiveWorkspaceInfo();
      workspaceId = wsInfo?.activeWorkspace?._id;
    }

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(session.user.id),
    };
    if (workspaceId && mongoose.Types.ObjectId.isValid(workspaceId)) {
      filter.workspaceId = new mongoose.Types.ObjectId(workspaceId);
    }
    if (query) {
      filter.title = {
        $regex: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      };
    }

    const conversations = await AiConversation.find(filter)
      .select("title messageCount lastMessageAt isPinned workspaceId createdAt")
      .sort({ isPinned: -1, lastMessageAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        messageCount: c.messageCount || 0,
        lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : null,
        isPinned: Boolean(c.isPinned),
        workspaceId: c.workspaceId.toString(),
      })),
    });
  } catch (err: unknown) {
    console.error("[AI Conversations GET] Error:", err);
    return NextResponse.json({ error: "Failed to load chat history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = CreateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await dbConnect();
    let workspaceId = parsed.data.workspaceId;
    if (!workspaceId) {
      const wsInfo = await getActiveWorkspaceInfo();
      workspaceId = wsInfo?.activeWorkspace?._id;
    }
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return NextResponse.json({ error: "Valid workspaceId required" }, { status: 400 });
    }

    const created = await AiConversation.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      title: parsed.data.title || "New Chat",
      lastMessageAt: new Date(),
    });

    return NextResponse.json({
      conversation: {
        id: created._id.toString(),
        title: created.title,
        messageCount: 0,
        lastMessageAt: created.lastMessageAt.toISOString(),
        isPinned: false,
        workspaceId: created.workspaceId.toString(),
      },
    });
  } catch (err: unknown) {
    console.error("[AI Conversations POST] Error:", err);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
