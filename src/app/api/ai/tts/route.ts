import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import dbConnect from "@/lib/db";
import PlatformAiConfig from "@/models/PlatformAiConfig";
import { decryptServerSecret } from "@/lib/server-crypto";
import {
  detectSpeechLang,
  splitTextForSpeech,
  stripMarkdownForSpeech,
} from "@/lib/ai/voice-utils";

export const dynamic = "force-dynamic";

const TtsRequestSchema = z.object({
  text: z.string().min(1).max(4000),
  lang: z.enum(["en-US", "bn-BD"]).optional(),
});

function safeDecrypt(payload?: string | null): string {
  if (!payload) return "";
  try {
    return decryptServerSecret(payload).trim();
  } catch {
    return "";
  }
}

async function resolveOpenAiTtsKey(): Promise<string> {
  try {
    await dbConnect();
    const cfg = await PlatformAiConfig.findOne({ key: "default" })
      .select("encryptedOpenaiApiKey")
      .lean();
    const dbKey = safeDecrypt(cfg?.encryptedOpenaiApiKey);
    if (dbKey && !dbKey.startsWith("sk-or-")) return dbKey;
  } catch {
    // ignore DB lookup failure and check env
  }
  const envKey = (process.env.OPENAI_API_KEY || "").trim();
  return envKey && !envKey.startsWith("sk-or-") ? envKey : "";
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
    const tl = targetLang === "bn-BD" ? "bn" : "en";

    // Tier 1: High-clarity OpenAI Neural TTS if a genuine OpenAI API key is configured
    const openAiKey = await resolveOpenAiTtsKey();
    if (openAiKey) {
      try {
        const openAiRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            voice: "nova",
            input: cleaned.slice(0, 1500),
            response_format: "mp3",
          }),
          signal: AbortSignal.timeout(12000),
        });

        if (openAiRes.ok) {
          const audioBytes = new Uint8Array(await openAiRes.arrayBuffer());
          if (audioBytes.byteLength > 0) {
            return new NextResponse(audioBytes, {
              status: 200,
              headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
              },
            });
          }
        }
      } catch {
        // Fall through cleanly to universal cloud neural TTS
      }
    }

    // Tier 2: Universal cloud neural TTS (works across OpenRouter, Ollama, and zero-key setups in EN & BN)
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

    return new NextResponse(new Uint8Array(combined), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.warn("[AI TTS Route] Falling back to client speech:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "TTS synthesis unavailable" }, { status: 502 });
  }
}
