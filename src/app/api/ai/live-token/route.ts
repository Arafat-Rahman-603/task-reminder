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
import { getVoiceToneInstruction, type VoiceTone } from "@/lib/ai/voice-utils";

export const dynamic = "force-dynamic";

const ALLOWED_LIVE_VOICES = ["Aoede", "Puck", "Charon", "Kore", "Fenrir"] as const;
type LiveVoiceName = (typeof ALLOWED_LIVE_VOICES)[number];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      workspaceId?: string;
      voiceName?: string;
      voiceGender?: "female" | "male";
      voiceTone?: VoiceTone;
      language?: string;
    };

    const gender = body.voiceGender === "male" ? "male" : "female";
    const tone: VoiceTone =
      body.voiceTone === "professional" ||
      body.voiceTone === "calm" ||
      body.voiceTone === "energetic"
        ? body.voiceTone
        : "friendly";

    const defaultVoiceForPref: LiveVoiceName =
      gender === "male"
        ? tone === "professional" || tone === "calm"
          ? "Charon"
          : "Puck"
        : tone === "professional"
        ? "Kore"
        : "Aoede";

    const requestedVoice = typeof body.voiceName === "string" ? body.voiceName.trim() : "";
    const voiceName: LiveVoiceName = ALLOWED_LIVE_VOICES.includes(requestedVoice as LiveVoiceName)
      ? (requestedVoice as LiveVoiceName)
      : defaultVoiceForPref;
    const preferredLang = body.language === "bn-BD" ? "Bengali (or Banglish/English as spoken)" : "English or Bengali matching the user";

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
      apiVersion: "v1beta",
      model: "gemini-3.8-live",
      voiceName,
      permissionMode: resolved.permissionMode,
      voiceAutoSpeak: resolved.voiceAutoSpeak,
      workspaceId: workspaceId || null,
      tools: toLiveFunctionDeclarations(),
      systemInstruction: `You are Manageo Live Voice Assistant for ${resolved.userName} inside workspace ${workspaceId || "personal"}. ${getVoiceToneInstruction(tone)} Speak naturally and concisely in 1-3 short spoken sentences—never read raw IDs, URLs, backticks, or markdown aloud. Language preference: ${preferredLang}. Always match the user's spoken language seamlessly. Call the real Manageo function tools whenever the user asks about or modifies tasks, notes, ideas, routines, custom sections, or finances. Vault secrets remain strictly locked and excluded.`,
    });
  } catch (err: unknown) {
    console.error("[AI Live Token Route] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to create live voice token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
