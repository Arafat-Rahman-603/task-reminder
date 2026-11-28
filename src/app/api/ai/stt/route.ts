import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PlatformAiConfig from "@/models/PlatformAiConfig";
import User from "@/models/User";
import { decryptServerSecret } from "@/lib/server-crypto";
import { createGeminiClient } from "@/lib/ai/gemini-client";

export const dynamic = "force-dynamic";

type SttProvider = "groq" | "openai" | "gemini";

interface SttCredential {
  provider: SttProvider;
  apiKey: string;
}

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function safeDecrypt(payload?: string | null): string {
  if (!payload) return "";
  try {
    return decryptServerSecret(payload).trim();
  } catch {
    return "";
  }
}

async function resolveSttCredential(userId: string): Promise<SttCredential | null> {
  await dbConnect();
  const [user, platformCfg] = await Promise.all([
    User.findById(userId).select("preferences.aiSettings").lean(),
    PlatformAiConfig.findOne({ key: "default" })
      .select("encryptedGroqApiKey encryptedOpenaiApiKey encryptedGeminiApiKey")
      .lean(),
  ]);

  const userAi = (user?.preferences?.aiSettings || {}) as {
    useCustomProvider?: boolean;
    customProvider?: string;
    encryptedCustomApiKey?: string | null;
    encryptedGeminiApiKey?: string | null;
  };

  // User's explicit Groq/OpenAI/Gemini custom keys first
  const userCustomKey = userAi.useCustomProvider ? safeDecrypt(userAi.encryptedCustomApiKey) : "";
  if (userAi.customProvider === "groq" && userCustomKey) {
    return { provider: "groq", apiKey: userCustomKey };
  }
  if (userAi.customProvider === "openai" && userCustomKey && !userCustomKey.startsWith("sk-or-")) {
    return { provider: "openai", apiKey: userCustomKey };
  }
  if (userAi.customProvider === "gemini" && userCustomKey) {
    return { provider: "gemini", apiKey: userCustomKey };
  }

  // Platform / user saved keys & env secrets
  const groqKey = safeDecrypt(platformCfg?.encryptedGroqApiKey) || (process.env.GROQ_API_KEY || "").trim();
  if (groqKey) return { provider: "groq", apiKey: groqKey };

  const openAiKey =
    safeDecrypt(platformCfg?.encryptedOpenaiApiKey) || (process.env.OPENAI_API_KEY || "").trim();
  if (openAiKey && !openAiKey.startsWith("sk-or-")) {
    return { provider: "openai", apiKey: openAiKey };
  }

  const geminiKey =
    safeDecrypt(userAi.encryptedGeminiApiKey) ||
    safeDecrypt(platformCfg?.encryptedGeminiApiKey) ||
    (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (geminiKey) return { provider: "gemini", apiKey: geminiKey };

  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cred = await resolveSttCredential(session.user.id);
    return NextResponse.json({
      available: Boolean(cred),
      provider: cred?.provider || null,
    });
  } catch (err) {
    console.error("[AI STT Availability Error]:", err);
    return NextResponse.json({ available: false, provider: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cred = await resolveSttCredential(session.user.id);
    if (!cred) {
      return NextResponse.json(
        { error: "Server speech transcription provider is not configured." },
        { status: 400 }
      );
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
    }

    const audio = formData.get("audio");
    const rawLang = String(formData.get("lang") || "en-US");
    const isoLang = rawLang.startsWith("bn") ? "bn" : "en";

    if (!audio || typeof (audio as Blob).arrayBuffer !== "function") {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const audioBlob = audio as Blob;
    if (audioBlob.size === 0 || audioBlob.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Invalid audio clip size" }, { status: 400 });
    }

    if (cred.provider === "groq" || cred.provider === "openai") {
      const endpoint =
        cred.provider === "groq"
          ? "https://api.groq.com/openai/v1/audio/transcriptions"
          : "https://api.openai.com/v1/audio/transcriptions";
      const model = cred.provider === "groq" ? "whisper-large-v3-turbo" : "whisper-1";

      const upstreamForm = new FormData();
      upstreamForm.append("file", audioBlob, "voice.webm");
      upstreamForm.append("model", model);
      upstreamForm.append("language", isoLang);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cred.apiKey}`,
        },
        body: upstreamForm,
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: "Speech transcription failed upstream" },
          { status: 502 }
        );
      }

      const data = (await res.json().catch(() => ({}))) as { text?: string };
      return NextResponse.json({ text: (data.text || "").trim() });
    }

    // Gemini multimodal transcription
    const ai = createGeminiClient(cred.apiKey);
    const bytes = Buffer.from(await audioBlob.arrayBuffer()).toString("base64");
    const mimeType = audioBlob.type || "audio/webm";
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: bytes, mimeType } },
            {
              text: `Transcribe this spoken user command verbatim (expected language: ${
                isoLang === "bn" ? "Bengali or English" : "English or Bengali"
              }). Return only the exact transcript text, or an empty string if silent.`,
            },
          ],
        },
      ],
    });

    const text = (result.text || "").trim();
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[AI STT Route Error]:", err);
    return NextResponse.json({ error: "Speech transcription failed" }, { status: 500 });
  }
}
