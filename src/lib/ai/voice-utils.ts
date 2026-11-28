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

/**
 * Selects the highest-quality SpeechSynthesisVoice matching `targetLang`.
 * Prefers Neural/Natural/Online and Google voices before OS fallbacks.
 */
export function selectBestSpeechVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: "en-US" | "bn-BD"
): SpeechSynthesisVoice | undefined {
  if (!Array.isArray(voices) || voices.length === 0) return undefined;

  const targetLower = targetLang.toLowerCase();
  const baseLang = targetLower.split("-")[0];

  let bestVoice: SpeechSynthesisVoice | undefined;
  let bestScore = -1;

  for (const voice of voices) {
    const langLower = (voice.lang || "").toLowerCase();
    const exactMatch = langLower === targetLower || langLower.startsWith(`${targetLower}-`) || langLower.startsWith(targetLower);
    const baseMatch = langLower === baseLang || langLower.startsWith(`${baseLang}-`) || langLower.startsWith(baseLang);

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

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestScore >= 0 ? bestVoice : undefined;
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

let cueAudioCtx: AudioContext | null = null;

/**
 * Plays subtle, short Web Audio tactile chimes for voice session lifecycle events.
 */
export function playVoiceCue(kind: "open" | "capture" | "close", muted = false): void {
  if (muted || typeof window === "undefined") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;

    if (!cueAudioCtx || cueAudioCtx.state === "closed") {
      cueAudioCtx = new Ctx();
    }
    const ctx = cueAudioCtx;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }

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
