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
