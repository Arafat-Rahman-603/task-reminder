import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import dbConnect from "@/lib/db";
import PlatformAiConfig from "@/models/PlatformAiConfig";
import User from "@/models/User";
import { decryptServerSecret } from "@/lib/server-crypto";
import { createGeminiClient } from "@/lib/ai/gemini-client";
import {
  detectSpeechLang,
  getVoiceToneStyleTag,
  splitTextForSpeech,
  stripMarkdownForSpeech,
  VOICE_SPEED_MULTIPLIER,
  type VoiceGender,
  type VoiceSpeed,
  type VoiceTone,
} from "@/lib/ai/voice-utils";

export const dynamic = "force-dynamic";

const TtsRequestSchema = z.object({
  text: z.string().min(1).max(4000),
  lang: z.enum(["en-US", "bn-BD"]).optional(),
  gender: z.enum(["female", "male"]).optional(),
  tone: z.enum(["friendly", "professional", "calm", "energetic"]).optional(),
  speed: z.enum(["slow", "normal", "fast"]).optional(),
});

function safeDecrypt(payload?: string | null): string {
  if (!payload) return "";
  try {
    return decryptServerSecret(payload).trim();
  } catch {
    return "";
  }
}

async function resolveTtsCredentials(userId: string): Promise<{
  geminiKey: string;
  openAiKey: string;
}> {
  let dbGeminiKey = "";
  let dbOpenAiKey = "";

  try {
    await dbConnect();
    const [user, cfg] = await Promise.all([
      User.findById(userId).select("preferences.aiSettings").lean(),
      PlatformAiConfig.findOne({ key: "default" })
        .select("encryptedOpenaiApiKey encryptedGeminiApiKey")
        .lean(),
    ]);

    const userAi = (user?.preferences?.aiSettings || {}) as {
      useCustomProvider?: boolean;
      customProvider?: string;
      encryptedCustomApiKey?: string | null;
      encryptedGeminiApiKey?: string | null;
    };

    const userCustomKey = userAi.useCustomProvider ? safeDecrypt(userAi.encryptedCustomApiKey) : "";
    if (userAi.customProvider === "gemini" && userCustomKey) {
      dbGeminiKey = userCustomKey;
    } else if (userAi.customProvider === "openai" && userCustomKey && !userCustomKey.startsWith("sk-or-")) {
      dbOpenAiKey = userCustomKey;
    }

    if (!dbGeminiKey) {
      dbGeminiKey =
        safeDecrypt(userAi.encryptedGeminiApiKey) || safeDecrypt(cfg?.encryptedGeminiApiKey);
    }
    if (!dbOpenAiKey) {
      const platOpenAi = safeDecrypt(cfg?.encryptedOpenaiApiKey);
      if (platOpenAi && !platOpenAi.startsWith("sk-or-")) {
        dbOpenAiKey = platOpenAi;
      }
    }
  } catch {
    // ignore DB lookup failure and fall back to env / zero-key providers
  }

  const envGemini = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  const envOpenAi = (process.env.OPENAI_API_KEY || "").trim();

  return {
    geminiKey: dbGeminiKey || envGemini,
    openAiKey: dbOpenAiKey || (envOpenAi && !envOpenAi.startsWith("sk-or-") ? envOpenAi : ""),
  };
}

function resolveEdgeVoice(lang: "en-US" | "bn-BD", gender: VoiceGender): string {
  if (lang === "bn-BD") {
    return gender === "male" ? "bn-BD-PradeepNeural" : "bn-BD-NabanitaNeural";
  }
  return gender === "male" ? "en-US-AndrewNeural" : "en-US-AvaNeural";
}

function resolveEdgeProsody(tone: VoiceTone, speed: VoiceSpeed): { rate: string; pitch: string } {
  const baseSpeedPct = speed === "slow" ? -10 : speed === "fast" ? 15 : 0;
  const toneSpeedDelta =
    tone === "energetic" ? 6 : tone === "calm" ? -5 : tone === "friendly" ? 2 : 0;
  const totalRate = Math.max(-25, Math.min(35, baseSpeedPct + toneSpeedDelta));

  const pitchHz =
    tone === "energetic" ? 6 : tone === "calm" ? -6 : tone === "professional" ? -2 : 2;

  return {
    rate: `${totalRate >= 0 ? "+" : ""}${totalRate}%`,
    pitch: `${pitchHz >= 0 ? "+" : ""}${pitchHz}Hz`,
  };
}

function buildAudioResponse(bytes: Uint8Array, contentType: string, engineTag: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new NextResponse(copy, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "X-TTS-Engine": engineTag,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = TtsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid TTS request" }, { status: 400 });
    }

    const cleaned = stripMarkdownForSpeech(parsed.data.text);
    if (!cleaned) {
      return NextResponse.json({ error: "No speakable text found" }, { status: 400 });
    }

    const targetLang = detectSpeechLang(cleaned, parsed.data.lang || "en-US");
    const gender: VoiceGender = parsed.data.gender || "female";
    const tone: VoiceTone = parsed.data.tone || "friendly";
    const speed: VoiceSpeed = parsed.data.speed || "normal";

    const { geminiKey, openAiKey } = await resolveTtsCredentials(session.user.id);

    // Tier 1: Gemini 3.8 Flash-Lite TTS (if Gemini API key is configured)
    if (geminiKey) {
      try {
        const ai = createGeminiClient(geminiKey, "v1beta");
        const voiceName =
          gender === "male"
            ? tone === "professional" || tone === "calm"
              ? "Charon"
              : "Puck"
            : tone === "professional"
            ? "Kore"
            : "Aoede";

        const stylePrompt =
          speed === "fast"
            ? `${getVoiceToneStyleTag(tone)}, speaking briskly`
            : speed === "slow"
            ? `${getVoiceToneStyleTag(tone)}, speaking slowly and clearly`
            : getVoiceToneStyleTag(tone);

        const interactionPromise = ai.interactions.create({
          model: "gemini-3.8-flash-lite-tts",
          input: [
            {
              type: "user_input",
              content: [
                {
                  type: "text",
                  text: cleaned.slice(0, 1500),
                  annotations: [{ type: "speech_metadata", style: stylePrompt }],
                },
              ],
            },
          ],
          response_format: { type: "audio" },
          generation_config: {
            speech_config: [{ voice: voiceName }],
          },
        });

        const interaction = await Promise.race([
          interactionPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 9000)),
        ]);

        const b64 = interaction?.output_audio?.data;
        if (b64) {
          const wavBytes = Buffer.from(b64, "base64");
          if (wavBytes.byteLength > 0) {
            return buildAudioResponse(
              wavBytes,
              interaction?.output_audio?.mime_type || "audio/wav",
              "gemini-3.8-tts"
            );
          }
        }
      } catch {
        // Fall through cleanly to Tier 2 / Tier 3 / Tier 4
      }
    }

    // Tier 2: OpenAI Neural TTS (if genuine OpenAI API key is configured)
    if (openAiKey) {
      try {
        const openAiVoice =
          gender === "male"
            ? tone === "calm" || tone === "friendly"
              ? "echo"
              : "onyx"
            : tone === "calm" || tone === "professional"
            ? "shimmer"
            : "nova";

        const openAiRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            voice: openAiVoice,
            input: cleaned.slice(0, 1500),
            speed: VOICE_SPEED_MULTIPLIER[speed],
            response_format: "mp3",
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (openAiRes.ok) {
          const audioBytes = new Uint8Array(await openAiRes.arrayBuffer());
          if (audioBytes.byteLength > 0) {
            return buildAudioResponse(audioBytes, "audio/mpeg", "openai-tts");
          }
        }
      } catch {
        // Fall through cleanly to zero-key Neural Edge TTS
      }
    }

    // Tier 3: Zero-key Microsoft Edge Neural TTS (real Male/Female EN & BN neural voices + prosody)
    try {
      const { EdgeTTS } = await import("@andresaya/edge-tts");
      const tts = new EdgeTTS();
      const edgeVoice = resolveEdgeVoice(targetLang, gender);
      const { rate, pitch } = resolveEdgeProsody(tone, speed);

      const result = await tts.generate(cleaned.slice(0, 1500), edgeVoice, {
        rate,
        pitch,
        timeout: 5500,
      });

      if (result?.audio && result.audio.byteLength > 0) {
        return buildAudioResponse(result.audio, "audio/mpeg", "edge-neural");
      }
    } catch {
      // Fall through cleanly to Tier 4 universal cloud TTS
    }

    // Tier 4: Zero-key Universal Cloud TTS (EN & BN multi-chunk MP3 fallback)
    const tl = targetLang === "bn-BD" ? "bn" : "en";
    const chunks = splitTextForSpeech(cleaned, 175).slice(0, 8);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No speakable chunks" }, { status: 400 });
    }

    const chunkBuffers = await Promise.all(
      chunks.map(async (chunk) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(
          chunk
        )}`;
        const ttsRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: AbortSignal.timeout(8000),
        });
        if (!ttsRes.ok) {
          throw new Error(`Upstream TTS HTTP ${ttsRes.status}`);
        }
        return Buffer.from(await ttsRes.arrayBuffer());
      })
    );

    const combined = Buffer.concat(chunkBuffers);
    if (combined.byteLength === 0) {
      return NextResponse.json({ error: "TTS synthesis unavailable" }, { status: 502 });
    }

    return buildAudioResponse(combined, "audio/mpeg", "google-fallback");
  } catch (err) {
    console.warn("[AI TTS Route] Falling back to client speech:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "TTS synthesis unavailable" }, { status: 502 });
  }
}
