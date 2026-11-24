import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import AiConversation from "@/models/AiConversation";
import AiMessage from "@/models/AiMessage";

export const dynamic = "force-dynamic";

const PatchConversationSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  isPinned: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    await dbConnect();
    const userObjId = new mongoose.Types.ObjectId(session.user.id);
    const conv = await AiConversation.findOne({ _id: id, userId: userObjId }).lean();
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const messages = await AiMessage.find({
      conversationId: conv._id,
      userId: userObjId,
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      conversation: {
        id: conv._id.toString(),
        title: conv.title,
        messageCount: conv.messageCount || messages.length,
        lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt).toISOString() : null,
        isPinned: Boolean(conv.isPinned),
        workspaceId: conv.workspaceId.toString(),
      },
      messages: messages.map((m) => ({
        id: m._id.toString(),
        role: m.role,
        content: m.content || "",
        executedActions: m.executedActions || [],
        pendingCalls: m.pendingCalls || [],
        resolved: m.resolved !== false,
        provider: m.provider,
        model: m.model,
        ragSources: m.ragSources || [],
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
      })),
    });
  } catch (err: unknown) {
    console.error("[AI Conversation Detail GET] Error:", err);
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = PatchConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await dbConnect();
    const updates: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.isPinned !== undefined) updates.isPinned = parsed.data.isPinned;

    const updated = await AiConversation.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(session.user.id) },
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({
      conversation: {
        id: updated._id.toString(),
        title: updated.title,
        isPinned: Boolean(updated.isPinned),
      },
    });
  } catch (err: unknown) {
    console.error("[AI Conversation Detail PATCH] Error:", err);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    await dbConnect();
    const userObjId = new mongoose.Types.ObjectId(session.user.id);
    const deleted = await AiConversation.findOneAndDelete({
      _id: id,
      userId: userObjId,
    }).lean();

    if (!deleted) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await AiMessage.deleteMany({ conversationId: deleted._id, userId: userObjId });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[AI Conversation Detail DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
