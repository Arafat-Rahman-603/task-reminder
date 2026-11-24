import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createGeminiClient,
  MissingAiKeyError,
  resolveUserAiConfig,
} from "@/lib/ai/gemini-client";
import { toLiveFunctionDeclarations } from "@/lib/ai/tools";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { workspaceId?: string };

    let resolved;
    try {
      resolved = await resolveUserAiConfig(session.user.id);
    } catch (err) {
      if (err instanceof MissingAiKeyError) {
        return NextResponse.json(
          { error: err.message, code: "MISSING_API_KEY" },
          { status: 400 }
        );
      }
      throw err;
    }

    let workspaceId = body.workspaceId;
    if (!workspaceId) {
      const wsInfo = await getActiveWorkspaceInfo();
      workspaceId = wsInfo?.activeWorkspace?._id;
    }

    const ai = createGeminiClient(resolved.apiKey, "v1beta");
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
      },
    });

    if (!token?.name) {
      return NextResponse.json(
        { error: "Failed to mint Gemini Live ephemeral token" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      token: token.name,
      model: "gemini-3.8-live",
      permissionMode: resolved.permissionMode,
      voiceAutoSpeak: resolved.voiceAutoSpeak,
      workspaceId: workspaceId || null,
      tools: toLiveFunctionDeclarations(),
      systemInstruction: `You are Manageo Voice Assistant for ${resolved.userName}. You help create, query, update, and manage tasks, notes, ideas, routines, custom sections, and personal finances inside active workspace ${workspaceId || "personal"}. Vault items are strictly locked and excluded. Speak concisely and naturally.`,
    });
  } catch (err: unknown) {
    console.error("[AI Live Token Route] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to create live voice token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
