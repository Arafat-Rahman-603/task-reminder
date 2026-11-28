/**
 * Voice & Text-to-Speech helpers for Manageo AI Assistant.
 */

const MONGO_ID_BRACKET_RE = /\[[a-f0-9]{24}\]/gi;
const FENCED_CODE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`([^`]*)`/g;
const MD_LINK_RE = /\[([^\]]+)\]\([^)]+\)/g;
const URL_RE = /https?:\/\/\S+/gi;
const BENGALI_CHAR_RE = /[\u0980-\u09FF]/;

/**
 * Strips markdown formatting, code blocks, URLs, and MongoDB ObjectIDs
 * so Text-to-Speech reads AI replies naturally aloud.
 */
export function stripMarkdownForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(FENCED_CODE_RE, " code snippet ")
    .replace(MD_LINK_RE, "$1")
    .replace(URL_RE, "")
    .replace(MONGO_ID_BRACKET_RE, "")
    .replace(INLINE_CODE_RE, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~>|]/g, " ")
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}

/**
 * Detects whether a response should be spoken in Bengali (`bn-BD`) or English (`en-US`).
 */
export function detectSpeechLang(
  text: string,
  fallback: "en-US" | "bn-BD" = "en-US"
): "en-US" | "bn-BD" {
  if (BENGALI_CHAR_RE.test(text || "")) return "bn-BD";
  if (/[A-Za-z]/.test(text || "")) return "en-US";
  return fallback;
}

/**
 * Splits cleaned speech text along sentence boundaries into short chunks
 * so browser `speechSynthesis` speaks reliably without Chrome long-utterance stalls.
 */
export function splitTextForSpeech(text: string, maxLen = 190): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const rawSentences = clean.split(/(?<=[.!?।])\s+/);
  const chunks: string[] = [];
  let current = "";

  const pushPiece = (piece: string) => {
    const trimmed = piece.trim();
    if (!trimmed) return;
    if (trimmed.length <= maxLen) {
      chunks.push(trimmed);
      return;
    }
    const words = trimmed.split(/\s+/);
    let buf = "";
    for (const w of words) {
      if (buf && buf.length + 1 + w.length > maxLen) {
        chunks.push(buf);
        buf = w;
      } else {
        buf = buf ? `${buf} ${w}` : w;
      }
    }
    if (buf) chunks.push(buf);
  };

  for (const s of rawSentences) {
    if (!s.trim()) continue;
    if (current && current.length + 1 + s.length > maxLen) {
      pushPiece(current);
      current = s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  if (current) pushPiece(current);

  return chunks;
}

export type VoiceGender = "female" | "male";
export type VoiceTone = "friendly" | "professional" | "calm" | "energetic";
export type VoiceSpeed = "slow" | "normal" | "fast";

export const VOICE_SPEED_MULTIPLIER: Record<VoiceSpeed, number> = {
  slow: 0.9,
  normal: 1.0,
  fast: 1.15,
};

/**
 * Returns natural speaking instruction for LLMs and Gemini Live in Voice Mode.
 */
export function getVoiceToneInstruction(tone: VoiceTone = "friendly"): string {
  switch (tone) {
    case "professional":
      return "Tone style: Crisp, composed, formal, and directly to the point.";
    case "calm":
      return "Tone style: Gentle, calm, unhurried, and reassuring.";
    case "energetic":
      return "Tone style: Upbeat, energetic, warm, and encouraging.";
    case "friendly":
    default:
      return "Tone style: Warm, natural, approachable conversational friend.";
  }
}

/**
 * Returns Gemini 3.8 TTS `speech_metadata.style` directive for the chosen tone.
 */
export function getVoiceToneStyleTag(tone: VoiceTone = "friendly"): string {
  switch (tone) {
    case "professional":
      return "clear, composed, and professional";
    case "calm":
      return "calm, gentle, and reassuring";
    case "energetic":
      return "upbeat, lively, and energetic";
    case "friendly":
    default:
      return "warm and friendly";
  }
}

const MALE_VOICE_NAME_RE =
  /\b(guy|andrew|christopher|eric|roger|steffan|david|mark|daniel|george|ryan|arthur|rishi|pradeep|bhashkar|tanmay|male|man|puck|charon|fenrir|orus)\b/i;
const FEMALE_VOICE_NAME_RE =
  /\b(ava|aria|jenny|michelle|emma|zira|samantha|victoria|karen|susan|hazel|nabanita|tanishaa|kalpana|heera|female|woman|aoede|kore|leda)\b/i;

/**
 * Selects the highest-quality SpeechSynthesisVoice matching `targetLang` and `gender`.
 * Prefers Neural/Natural/Online and Google voices before OS fallbacks.
 */
export function selectBestSpeechVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: "en-US" | "bn-BD",
  gender: VoiceGender = "female"
): SpeechSynthesisVoice | undefined {
  if (!Array.isArray(voices) || voices.length === 0) return undefined;

  const targetLower = targetLang.toLowerCase();
  const baseLang = targetLower.split("-")[0];

  let bestVoice: SpeechSynthesisVoice | undefined;
  let bestScore = -1000;

  for (const voice of voices) {
    const langLower = (voice.lang || "").toLowerCase();
    const exactMatch =
      langLower === targetLower ||
      langLower.startsWith(`${targetLower}-`) ||
      langLower.startsWith(targetLower);
    const baseMatch =
      langLower === baseLang ||
      langLower.startsWith(`${baseLang}-`) ||
      langLower.startsWith(baseLang);

    if (!exactMatch && !baseMatch) continue;

    let score = exactMatch ? 15 : 5;
    const name = voice.name || "";
    if (/online|natural|neural/i.test(name)) {
      score += 40;
    } else if (/google/i.test(name)) {
      score += 30;
    } else if (/samantha|siri|karen|daniel|enhanced|premium/i.test(name)) {
      score += 20;
    }

    if (gender === "male") {
      if (MALE_VOICE_NAME_RE.test(name)) score += 28;
      else if (FEMALE_VOICE_NAME_RE.test(name)) score -= 18;
    } else {
      if (FEMALE_VOICE_NAME_RE.test(name)) score += 28;
      else if (MALE_VOICE_NAME_RE.test(name)) score -= 18;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

/**
 * Cleanly merges incremental streaming transcript fragments (e.g. from Gemini Live)
 * without duplicating cumulative prefixes or losing natural spacing around punctuation.
 */
export function mergeStreamingTranscript(current: string, incomingChunk: string): string {
  if (!incomingChunk) return current;
  if (!current) return incomingChunk.trimStart();
  if (incomingChunk.startsWith(current)) return incomingChunk;
  if (current.endsWith(incomingChunk)) return current;

  const needsSpace =
    !/\s$/.test(current) &&
    !/^\s/.test(incomingChunk) &&
    !/^[,.;:!?।'"\])]/.test(incomingChunk);

  return needsSpace ? `${current} ${incomingChunk}` : `${current}${incomingChunk}`;
}

let sharedVoiceAudioCtx: AudioContext | null = null;

/**
 * Returns a persistent shared AudioContext (never closed once created) so audio
 * unlocked by a user gesture remains playable across async Voice Mode turns.
 */
export function getSharedVoiceAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;

    if (!sharedVoiceAudioCtx || sharedVoiceAudioCtx.state === "closed") {
      sharedVoiceAudioCtx = new Ctx();
    }
    if (sharedVoiceAudioCtx.state === "suspended") {
      void sharedVoiceAudioCtx.resume().catch(() => {});
    }
    return sharedVoiceAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Unlocks Web Audio and warms browser SpeechSynthesis voices synchronously inside
 * a user click/tap handler so subsequent async TTS responses always play aloud.
 */
export function unlockVoiceAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getSharedVoiceAudioContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        void ctx.resume().catch(() => {});
      }
      const silentBuf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = silentBuf;
      src.connect(ctx.destination);
      src.start(0);
    }
  } catch {
    // ignore Web Audio unlock failures
  }

  try {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices?.();
    }
  } catch {
    // ignore
  }
}

/**
 * Plays subtle, short Web Audio tactile chimes for voice session lifecycle events.
 */
export function playVoiceCue(kind: "open" | "capture" | "close", muted = false): void {
  if (muted || typeof window === "undefined") return;
  try {
    const ctx = getSharedVoiceAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const playTone = (freq: number, startOffset: number, duration: number, peakGain: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.01);
    };

    if (kind === "open") {
      playTone(523.25, 0, 0.08, 0.045);
      playTone(659.25, 0.075, 0.095, 0.05);
    } else if (kind === "capture") {
      playTone(587.33, 0, 0.09, 0.04);
    } else {
      playTone(523.25, 0, 0.075, 0.04);
      playTone(392.0, 0.07, 0.09, 0.035);
    }
  } catch {
    // ignore Web Audio autoplay restrictions or cleanup races
  }
}
