import net from "net";
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PlatformAiConfig from "@/models/PlatformAiConfig";
import { decryptServerSecret } from "@/lib/server-crypto";
import { MissingAiKeyError } from "@/lib/ai/gemini-client";
import { toGeminiFunctionTools, toOpenAiFunctionTools } from "@/lib/ai/tools";
import type { PermissionMode } from "@/lib/ai/tools";

export type AiProviderId =
  | "openrouter"
  | "gemini"
  | "openai"
  | "groq"
  | "ollama"
  | "lmstudio"
  | "custom";

export interface ProviderCandidate {
  provider: AiProviderId;
  model: string;
  apiKey: string;
  baseUrl?: string;
  isLocal?: boolean;
  source: "platform" | "user";
}

export interface AgentMessageTurn {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  toolCallId?: string;
  toolName?: string;
}

export interface AgentTurnResponse {
  text: string;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  providerUsed: AiProviderId;
  modelUsed: string;
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
  ollama: "http://localhost:11434/v1",
  lmstudio: "http://localhost:1234/v1",
};

const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-3.5-lightning:free";
const DEFAULT_OPENROUTER_FALLBACKS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "inclusionai/ling-3.2-flash:free",
  "openrouter/free",
];
const DEFAULT_GEMINI_MODEL = "gemini-4-argon";
const DEFAULT_GEMINI_FALLBACKS = ["gemini-4-hydrogen", "gemini-3.5-flash-lite"];

/**
 * Redacts API keys and URLs before logging AI provider errors on the server.
 */
export function redactSecretTokens(text: string): string {
  return (text || "")
    .replace(/\bsk-[A-Za-z0-9_*-]+/gi, "[redacted-key]")
    .replace(/\bAIza[A-Za-z0-9_-]+/gi, "[redacted-key]")
    .replace(/\bgsk_[A-Za-z0-9_-]+/gi, "[redacted-key]")
    .replace(/https?:\/\/\S+/gi, "[redacted-url]");
}

/**
 * Maps internal/upstream AI failures into safe, friendly messages suitable for end users.
 * Never leaks partial keys, account URLs, provider endpoints, or raw HTTP payloads.
 */
export function sanitizeAiErrorForClient(
  err: unknown,
  options?: { isCustomUserProvider?: boolean }
): string {
  const raw = err instanceof Error ? err.message : String(err || "");
  const lower = raw.toLowerCase();

  if (err instanceof MissingAiKeyError || lower.includes("missing_api_key") || lower.includes("not configured")) {
    return options?.isCustomUserProvider
      ? "Please verify your custom AI settings in Settings."
      : "AI assistant is temporarily unavailable. Please try again later.";
  }

  if (
    lower.includes("incorrect api key") ||
    lower.includes("invalid api key") ||
    lower.includes("unauthorized") ||
    lower.includes("authentication") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return options?.isCustomUserProvider
      ? "Could not connect to your custom AI model. Please check your Settings."
      : "AI assistant is temporarily unavailable. Please try again later.";
  }

  if (
    lower.includes("429") ||
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("504") ||
    lower.includes("rate limit") ||
    lower.includes("high demand") ||
    lower.includes("busy") ||
    lower.includes("timeout")
  ) {
    return "AI assistant is busy right now. Please tap Retry in a moment.";
  }

  return "Unable to complete your request right now. Please tap Retry.";
}

function tryDecrypt(payload?: string | null): string {
  if (!payload) return "";
  try {
    return decryptServerSecret(payload).trim();
  } catch {
    return "";
  }
}

function isBlockedMetadataIp(hostname: string): boolean {
  const clean = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    clean === "169.254.169.254" ||
    clean === "metadata.google.internal" ||
    clean.startsWith("169.254.") ||
    clean === "0.0.0.0"
  ) {
    return true;
  }
  if (net.isIPv4(clean) && clean.startsWith("169.254.")) return true;
  return false;
}

/**
 * Validates custom / local LLM base URLs against SSRF to cloud metadata endpoints
 * while allowing localhost / LAN endpoints for Ollama, LM Studio, and vLLM.
 */
export function validateLlmBaseUrl(rawUrl: string): string {
  const trimmed = (rawUrl || "").trim().replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Invalid LLM Base URL format");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("LLM Base URL must use http:// or https://");
  }
  if (isBlockedMetadataIp(parsed.hostname)) {
    throw new Error("Blocked metadata address in LLM Base URL");
  }
  return trimmed;
}

export async function resolveEffectiveAiTargets(userId: string): Promise<{
  candidates: ProviderCandidate[];
  permissionMode: PermissionMode;
  voiceAutoSpeak: boolean;
  userName: string;
  isUsingCustomUserProvider: boolean;
}> {
  await dbConnect();
  const [user, platformCfg] = await Promise.all([
    User.findById(userId).select("name email preferences.aiSettings").lean(),
    PlatformAiConfig.findOne({ key: "default" }).lean(),
  ]);

  if (!user) throw new Error("User not found");

  const userAi = (user.preferences?.aiSettings || {}) as {
    useCustomProvider?: boolean;
    customProvider?: AiProviderId;
    customModel?: string;
    customBaseUrl?: string;
    encryptedCustomApiKey?: string | null;
    encryptedGeminiApiKey?: string | null;
    permissionMode?: string;
    voiceAutoSpeak?: boolean;
  };

  const validModes: PermissionMode[] = ["review", "default_approved", "turbo"];
  const permissionMode = validModes.includes(userAi.permissionMode as PermissionMode)
    ? (userAi.permissionMode as PermissionMode)
    : "default_approved";

  const userName = user.name || user.email || "Manageo User";
  const voiceAutoSpeak = userAi.voiceAutoSpeak !== false;

  // Path A: User explicitly configured a custom / local model in Settings
  if (userAi.useCustomProvider) {
    let provider: AiProviderId = userAi.customProvider || "ollama";
    const key =
      tryDecrypt(userAi.encryptedCustomApiKey) || tryDecrypt(userAi.encryptedGeminiApiKey);

    // Auto-route OpenRouter sk-or- keys mistakenly saved under OpenAI to OpenRouter
    let autoCorrectedFromOpenAi = false;
    if (provider === "openai" && key.startsWith("sk-or-")) {
      provider = "openrouter";
      autoCorrectedFromOpenAi = true;
    }

    const isLocal = provider === "ollama" || provider === "lmstudio";

    if (!isLocal && provider !== "custom" && !key) {
      throw new MissingAiKeyError(
        `Your custom ${provider} API key is missing in Settings → AI & MCP Connector.`
      );
    }

    const defaultModelForCustom =
      provider === "openrouter"
        ? DEFAULT_OPENROUTER_MODEL
        : provider === "gemini"
        ? DEFAULT_GEMINI_MODEL
        : provider === "openai"
        ? "gpt-4o-mini"
        : provider === "groq"
        ? "llama-3.3-70b-versatile"
        : provider === "ollama"
        ? "llama3.1"
        : "local-model";

    const rawModel = (userAi.customModel || "").trim();
    const model =
      autoCorrectedFromOpenAi && (!rawModel || rawModel === "gpt-4o-mini")
        ? DEFAULT_OPENROUTER_MODEL
        : rawModel || defaultModelForCustom;
    const rawBaseUrl = autoCorrectedFromOpenAi
      ? DEFAULT_BASE_URLS.openrouter
      : (userAi.customBaseUrl || "").trim() || DEFAULT_BASE_URLS[provider] || "";
    const baseUrl =
      provider === "gemini"
        ? undefined
        : validateLlmBaseUrl(rawBaseUrl || "http://localhost:11434/v1");

    const candidates: ProviderCandidate[] = [
      {
        provider,
        model,
        apiKey: key || "local-no-key-required",
        baseUrl,
        isLocal: isLocal || provider === "custom",
        source: "user",
      },
    ];

    // If user enabled custom OpenRouter/Gemini with a fallback list when busy
    if (provider === "openrouter") {
      for (const fb of DEFAULT_OPENROUTER_FALLBACKS) {
        if (fb !== model) {
          candidates.push({ provider: "openrouter", model: fb, apiKey: key, baseUrl, source: "user" });
        }
      }
    } else if (provider === "gemini") {
      for (const fb of DEFAULT_GEMINI_FALLBACKS) {
        if (fb !== model) {
          candidates.push({ provider: "gemini", model: fb, apiKey: key, source: "user" });
        }
      }
    }

    return {
      candidates,
      permissionMode,
      voiceAutoSpeak,
      userName,
      isUsingCustomUserProvider: true,
    };
  }

  // Path B: Manageo Platform-Managed Providers (OpenRouter default + multi-provider fallback)
  let openrouterKey =
    tryDecrypt(platformCfg?.encryptedOpenrouterApiKey) ||
    (process.env.OPENROUTER_API_KEY || "").trim();
  const geminiKey =
    tryDecrypt(platformCfg?.encryptedGeminiApiKey) ||
    tryDecrypt(userAi.encryptedGeminiApiKey) ||
    (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  let openaiKey =
    tryDecrypt(platformCfg?.encryptedOpenaiApiKey) || (process.env.OPENAI_API_KEY || "").trim();
  // Prevent OpenRouter sk-or- keys stored under OpenAI from hitting api.openai.com
  if (openaiKey.startsWith("sk-or-")) {
    if (!openrouterKey) openrouterKey = openaiKey;
    openaiKey = "";
  }
  const groqKey =
    tryDecrypt(platformCfg?.encryptedGroqApiKey) || (process.env.GROQ_API_KEY || "").trim();
  const customPlatformKey = tryDecrypt(platformCfg?.encryptedCustomApiKey);

  const openrouterPrimary =
    platformCfg?.openrouterModel ||
    process.env.OPENROUTER_DEFAULT_MODEL ||
    DEFAULT_OPENROUTER_MODEL;
  const openrouterFallbacks =
    platformCfg?.openrouterFallbackModels?.length
      ? platformCfg.openrouterFallbackModels
      : process.env.OPENROUTER_FALLBACK_MODELS
      ? process.env.OPENROUTER_FALLBACK_MODELS.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : DEFAULT_OPENROUTER_FALLBACKS;

  const geminiPrimary =
    platformCfg?.geminiModel || process.env.GEMINI_DEFAULT_MODEL || DEFAULT_GEMINI_MODEL;
  const geminiFallbacks =
    platformCfg?.geminiFallbackModels?.length
      ? platformCfg.geminiFallbackModels
      : DEFAULT_GEMINI_FALLBACKS;

  const openaiPrimary = platformCfg?.openaiModel || "gpt-4o-mini";
  const groqPrimary = platformCfg?.groqModel || "llama-3.3-70b-versatile";

  const providerBuckets: Record<AiProviderId, ProviderCandidate[]> = {
    openrouter: openrouterKey
      ? [openrouterPrimary, ...openrouterFallbacks]
          .filter((v, idx, arr) => v && arr.indexOf(v) === idx)
          .map((m) => ({
            provider: "openrouter",
            model: m,
            apiKey: openrouterKey,
            baseUrl: DEFAULT_BASE_URLS.openrouter,
            source: "platform" as const,
          }))
      : [],
    gemini: geminiKey
      ? [geminiPrimary, ...geminiFallbacks]
          .filter((v, idx, arr) => v && arr.indexOf(v) === idx)
          .map((m) => ({
            provider: "gemini",
            model: m,
            apiKey: geminiKey,
            source: "platform" as const,
          }))
      : [],
    openai: openaiKey
      ? [
          {
            provider: "openai",
            model: openaiPrimary,
            apiKey: openaiKey,
            baseUrl: DEFAULT_BASE_URLS.openai,
            source: "platform" as const,
          },
        ]
      : [],
    groq: groqKey
      ? [
          {
            provider: "groq",
            model: groqPrimary,
            apiKey: groqKey,
            baseUrl: DEFAULT_BASE_URLS.groq,
            source: "platform" as const,
          },
        ]
      : [],
    ollama: [],
    lmstudio: [],
    custom:
      platformCfg?.customBaseUrl && platformCfg?.customModel
        ? [
            {
              provider: "custom",
              model: platformCfg.customModel,
              apiKey: customPlatformKey || "custom-key",
              baseUrl: validateLlmBaseUrl(platformCfg.customBaseUrl),
              source: "platform" as const,
            },
          ]
        : [],
  };

  const preferredOrderRaw =
    platformCfg?.activeProvider ||
    (process.env.AI_DEFAULT_PROVIDER as AiProviderId | undefined) ||
    "openrouter";

  const orderedProviders: AiProviderId[] = [
    preferredOrderRaw,
    "openrouter",
    "gemini",
    "openai",
    "groq",
    "custom",
  ].filter((p, i, arr): p is AiProviderId => arr.indexOf(p) === i);

  const candidates = orderedProviders.flatMap((p) => providerBuckets[p] || []);

  if (candidates.length === 0) {
    throw new MissingAiKeyError(
      "Platform AI key is not configured yet. Admin can set OPENROUTER_API_KEY in .env.local or configure a provider in Admin / Settings."
    );
  }

  return {
    candidates,
    permissionMode,
    voiceAutoSpeak,
    userName,
    isUsingCustomUserProvider: false,
  };
}

class TransientProviderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callOpenAiCompatibleProvider(
  candidate: ProviderCandidate,
  systemPrompt: string,
  history: AgentMessageTurn[],
  options?: { enableTools?: boolean }
): Promise<AgentTurnResponse> {
  const baseUrl = candidate.baseUrl || DEFAULT_BASE_URLS[candidate.provider];
  if (!baseUrl) {
    throw new Error(`Missing base URL for provider ${candidate.provider}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: "system", content: systemPrompt }];
  for (const turn of history) {
    if (turn.role === "user") {
      messages.push({ role: "user", content: turn.content });
    } else if (turn.role === "assistant") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg: Record<string, any> = {
        role: "assistant",
        content: turn.content || null,
      };
      if (turn.toolCalls && turn.toolCalls.length > 0) {
        msg.tool_calls = turn.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments || {}),
          },
        }));
      }
      messages.push(msg);
    } else if (turn.role === "tool") {
      messages.push({
        role: "tool",
        tool_call_id: turn.toolCallId,
        name: turn.toolName,
        content: turn.content,
      });
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (candidate.apiKey && candidate.apiKey !== "local-no-key-required") {
    headers.Authorization = `Bearer ${candidate.apiKey}`;
  }
  if (candidate.provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXTAUTH_URL || "https://manageo.app";
    headers["X-Title"] = "Manageo AI Assistant";
  }

  const enableTools = options?.enableTools !== false;
  const payloadBody: Record<string, unknown> = {
    model: candidate.model,
    messages,
    temperature: 0.25,
  };
  if (enableTools) {
    payloadBody.tools = toOpenAiFunctionTools();
    payloadBody.tool_choice = "auto";
  }

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(35_000),
    body: JSON.stringify(payloadBody),
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "");
    let parsedMsg = `Provider HTTP ${resp.status}`;
    try {
      const jsonErr = JSON.parse(errBody);
      parsedMsg = jsonErr?.error?.message || jsonErr?.message || parsedMsg;
    } catch {
      if (errBody) parsedMsg = errBody.slice(0, 200);
    }
    if ([404, 408, 429, 500, 502, 503, 504].includes(resp.status)) {
      throw new TransientProviderError(resp.status, parsedMsg);
    }
    throw new Error(parsedMsg);
  }

  const json = await resp.json();
  const choice = json?.choices?.[0]?.message;
  const rawContent = typeof choice?.content === "string" ? choice.content.trim() : "";

  const rawToolCalls = Array.isArray(choice?.tool_calls) ? choice.tool_calls : [];
  const toolCalls = rawToolCalls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((tc: any) => tc?.function?.name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((tc: any, idx: number) => {
      let args: Record<string, unknown> = {};
      if (typeof tc.function.arguments === "string") {
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          args = {};
        }
      } else if (tc.function.arguments && typeof tc.function.arguments === "object") {
        args = tc.function.arguments;
      }
      return {
        id: String(tc.id || `call_${Date.now()}_${idx}`),
        name: String(tc.function.name),
        arguments: args,
      };
    });

  return {
    text: rawContent,
    toolCalls,
    providerUsed: candidate.provider,
    modelUsed: candidate.model,
  };
}

async function callGeminiProvider(
  candidate: ProviderCandidate,
  systemPrompt: string,
  history: AgentMessageTurn[],
  options?: { enableTools?: boolean }
): Promise<AgentTurnResponse> {
  const ai = new GoogleGenAI({ apiKey: candidate.apiKey });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steps: any[] = [];
  for (const turn of history) {
    if (turn.role === "user") {
      steps.push({ type: "user_input", content: [{ type: "text", text: turn.content }] });
    } else if (turn.role === "assistant") {
      if (turn.content) {
        steps.push({ type: "model_output", content: [{ type: "text", text: turn.content }] });
      }
      if (turn.toolCalls) {
        for (const tc of turn.toolCalls) {
          steps.push({
            type: "function_call",
            id: tc.id,
            name: tc.name,
            arguments: tc.arguments,
          });
        }
      }
    } else if (turn.role === "tool") {
      steps.push({
        type: "function_result",
        call_id: turn.toolCallId,
        name: turn.toolName,
        result: turn.content,
      });
    }
  }

  const enableTools = options?.enableTools !== false;

  try {
    const interaction = await ai.interactions.create({
      model: candidate.model,
      system_instruction: systemPrompt,
      ...(enableTools ? { tools: toGeminiFunctionTools() } : {}),
      store: false,
      input: steps,
    });

    const returnedSteps = Array.isArray(interaction.steps) ? interaction.steps : [];
    const newSteps =
      returnedSteps.length > steps.length && returnedSteps[0]?.type === steps[0]?.type
        ? returnedSteps.slice(steps.length)
        : returnedSteps;

    const toolCalls: AgentTurnResponse["toolCalls"] = [];
    const textBlocks: string[] = [];

    for (const s of newSteps) {
      if (s?.type === "function_call" && typeof s.name === "string") {
        toolCalls.push({
          id: String(s.id || `call_${Date.now()}`),
          name: s.name,
          arguments:
            s.arguments && typeof s.arguments === "object"
              ? (s.arguments as Record<string, unknown>)
              : {},
        });
      } else if (s?.type === "model_output" && Array.isArray(s.content)) {
        for (const blk of s.content) {
          if (blk?.type === "text" && typeof blk.text === "string" && blk.text.trim()) {
            textBlocks.push(blk.text.trim());
          }
        }
      }
    }

    const text =
      (interaction.output_text && interaction.output_text.trim()) ||
      textBlocks.join("\n\n").trim();

    return {
      text,
      toolCalls,
      providerUsed: "gemini",
      modelUsed: candidate.model,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();
    if (
      lower.includes("503") ||
      lower.includes("429") ||
      lower.includes("502") ||
      lower.includes("504") ||
      lower.includes("high demand") ||
      lower.includes("unavailable") ||
      lower.includes("resource_exhausted")
    ) {
      throw new TransientProviderError(503, msg);
    }
    throw err;
  }
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof TransientProviderError) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      err.name === "TimeoutError" ||
      err.name === "AbortError" ||
      msg.includes("503") ||
      msg.includes("429") ||
      msg.includes("502") ||
      msg.includes("504") ||
      msg.includes("high demand") ||
      msg.includes("rate limit")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Executes a single LLM turn across ordered candidates with automatic retry
 * and multi-provider/model failover on transient 429/502/503/504 errors.
 */
export async function generateAgentTurn(
  candidates: ProviderCandidate[],
  systemPrompt: string,
  history: AgentMessageTurn[],
  options?: { enableTools?: boolean }
): Promise<AgentTurnResponse> {
  let lastError: unknown = null;

  for (const candidate of candidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (candidate.provider === "gemini") {
          return await callGeminiProvider(candidate, systemPrompt, history, options);
        }
        return await callOpenAiCompatibleProvider(candidate, systemPrompt, history, options);
      } catch (err) {
        lastError = err;
        if (!isRetryableError(err)) {
          // Non-transient error on this candidate — try next candidate if more exist
          break;
        }
        // Jump immediately to next fallback model on rate-limit (429) or retired free slug (404)
        if (err instanceof TransientProviderError && (err.status === 429 || err.status === 404)) {
          break;
        }
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }
  }

  const rawMsg = lastError instanceof Error ? lastError.message : "AI providers unavailable";
  console.error("[AI Provider Failover Exhausted]", redactSecretTokens(rawMsg));
  throw new Error(sanitizeAiErrorForClient(lastError));
}
