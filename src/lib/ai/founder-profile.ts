/**
 * Canonical founder & creator profile knowledge for Manageo AI agents,
 * Instant Support, and public About pages.
 */

export const FOUNDER_NAME = "Arafat Rahman";
export const FOUNDER_ROLE =
  "Founder, Creator & Lead Software Engineer of Manageo";
export const FOUNDER_AVATAR_URL = "/api/founder-avatar";
export const FOUNDER_AVATAR_MARKDOWN =
  "![Arafat Rahman — Founder & Creator of Manageo](/api/founder-avatar)";
export const FOUNDER_FALLBACK_PUBLIC_ID = "manageo/avatars/twixpv0sjezju7j1neon";

const CREATOR_QUESTION_RE =
  /\b(who\s+(made|built|created|developed|designed|founded|owns|is\s+behind)|founder(\s+of)?|creator(\s+of)?|developer(\s+of)?|owner(\s+of)?|made\s+manageo|built\s+manageo|made\s+this\s+app|built\s+this\s+app|ke\s+(baniyeche|banice|banaise|banayse|toiri\s+koreche|korce|koreche))\b|(কে\s*(বানিয়েছে|বানিয়েছে|তৈরি করেছে|বানাল))/i;

const ARAFAT_MENTION_RE =
  /\barafat(\s+rahman)?\b|আরাফাত(\s*রহমান)?/i;

export function isFounderOrCreatorQuery(text: string): boolean {
  const q = (text || "").trim();
  if (!q) return false;
  return CREATOR_QUESTION_RE.test(q) || ARAFAT_MENTION_RE.test(q);
}

export function buildFounderKnowledgePrompt(voiceMode = false): string {
  if (voiceMode) {
    return `CREATOR IDENTITY: Manageo was founded, designed, and engineered by ${FOUNDER_NAME} (${FOUNDER_ROLE}). When asked who made Manageo or asked about ${FOUNDER_NAME}, answer warmly and concisely in 1-2 sentences crediting ${FOUNDER_NAME} without reading out URLs or markdown syntax.`;
  }

  return `CREATOR & FOUNDER IDENTITY:
- Manageo was founded, designed, and built by **${FOUNDER_NAME}** (${FOUNDER_ROLE}).
- Whenever a user asks who made, created, built, founded, or owns Manageo, OR asks about **${FOUNDER_NAME}** (including asking for his photo/pic/picture), ALWAYS credit **${FOUNDER_NAME}** clearly and include his portrait image markdown verbatim on its own line:
  ${FOUNDER_AVATAR_MARKDOWN}
- Reply strictly in the same language the user wrote in (English if English, Bengali if Bengali/Banglish).`;
}

export function ensureFounderImageInReply(
  reply: string,
  userMessage: string,
  voiceMode = false
): string {
  if (voiceMode || !isFounderOrCreatorQuery(userMessage)) {
    return reply;
  }
  if (reply.includes(FOUNDER_AVATAR_URL)) {
    return reply;
  }
  const hasName = /arafat/i.test(reply);
  const creditLine = hasName ? "" : `\n\nManageo was created and engineered by **${FOUNDER_NAME}**.`;
  return `${reply.trim()}${creditLine}\n\n${FOUNDER_AVATAR_MARKDOWN}`;
}
