"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PlatformAiConfig, { PlatformAiProviderId } from "@/models/PlatformAiConfig";
import McpApiKey, { IMcpKeyScopes } from "@/models/McpApiKey";
import { OAuthClient } from "@/models/OAuthClient";
import { OAuthAccessToken } from "@/models/OAuthAccessToken";
import { OAuthAuthCode } from "@/models/OAuthAuthCode";
import "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import { encryptServerSecret, generateMcpToken, hashMcpToken } from "@/lib/server-crypto";
import {
  DEFAULT_OAUTH_SCOPE,
  generateOpaqueToken,
  isValidOAuthRedirectUri,
} from "@/lib/oauth-mcp";
import { sanitizePreferencesForClient } from "@/lib/sanitize-preferences";
import {
  generateAgentTurn,
  ProviderCandidate,
  resolveEffectiveAiTargets,
  validateLlmBaseUrl,
} from "@/lib/ai/llm-providers";
import { z } from "zod";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

const UpdateAiSettingsSchema = z.object({
  useCustomProvider: z.boolean().optional(),
  customProvider: z
    .enum(["openrouter", "gemini", "openai", "groq", "ollama", "lmstudio", "custom"])
    .optional(),
  customModel: z.string().max(160).optional(),
  customBaseUrl: z.string().max(300).optional(),
  customApiKey: z.string().optional(),
  clearCustomApiKey: z.boolean().optional(),
  // Legacy compatibility field
  geminiApiKey: z.string().optional(),
  clearGeminiApiKey: z.boolean().optional(),
  preferredModel: z.string().max(160).optional(),
  permissionMode: z.enum(["review", "default_approved", "turbo"]).optional(),
  voiceAutoSpeak: z.boolean().optional(),
  voiceGender: z.enum(["female", "male"]).optional(),
  voiceTone: z.enum(["friendly", "professional", "calm", "energetic"]).optional(),
  voiceSpeed: z.enum(["slow", "normal", "fast"]).optional(),
  voiceLang: z.enum(["en-US", "bn-BD"]).optional(),
});

const UpdatePlatformAiSchema = z.object({
  activeProvider: z.enum(["openrouter", "gemini", "openai", "groq", "custom"]),
  openrouterModel: z.string().trim().min(1).max(160),
  openrouterFallbackModels: z.array(z.string().trim().min(1)).max(5),
  openrouterApiKey: z.string().optional(),
  clearOpenrouterApiKey: z.boolean().optional(),
  geminiModel: z.string().trim().min(1).max(160),
  geminiFallbackModels: z.array(z.string().trim().min(1)).max(5),
  geminiApiKey: z.string().optional(),
  clearGeminiApiKey: z.boolean().optional(),
  openaiModel: z.string().trim().min(1).max(160).optional(),
  openaiApiKey: z.string().optional(),
  clearOpenaiApiKey: z.boolean().optional(),
  groqModel: z.string().trim().min(1).max(160).optional(),
  groqApiKey: z.string().optional(),
  clearGroqApiKey: z.boolean().optional(),
  customBaseUrl: z.string().trim().max(300).optional(),
  customModel: z.string().trim().max(160).optional(),
  customApiKey: z.string().optional(),
  clearCustomApiKey: z.boolean().optional(),
});

const CreateMcpKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  workspaceId: z.string().min(1),
  scopes: z.object({
    read: z.boolean(),
    write: z.boolean(),
    delete: z.boolean(),
    finance: z.boolean(),
  }),
});

export interface SafeMcpKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  workspaceId: string;
  workspaceName: string;
  scopes: IMcpKeyScopes;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface SafeOAuthClientInfo {
  id: string;
  clientId: string;
  clientName: string;
  redirectUris: string[];
  tokenEndpointAuthMethod: string;
  hasSecret: boolean;
  clientSecretPrefix: string | null;
  createdAt: string;
}

export interface SafeOAuthSessionInfo {
  id: string;
  clientId: string;
  clientName: string;
  workspaceId: string;
  workspaceName: string;
  scopes: IMcpKeyScopes;
  lastUsedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

const CreateUserOAuthClientSchema = z.object({
  clientName: z.string().trim().min(1).max(120),
  redirectUris: z.array(z.string().trim().min(1)).min(1).max(10),
  useClientSecret: z.boolean().optional(),
});

export async function getAiAndMcpSettings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  await dbConnect();
  const [user, platformCfg] = await Promise.all([
    User.findById(session.user.id).select("preferences isPlatformAdmin").lean(),
    PlatformAiConfig.findOne({ key: "default" }).lean(),
  ]);
  if (!user) return { error: "User not found" };

  const safePrefs = sanitizePreferencesForClient(user.preferences);
  const rawAi = (safePrefs.aiSettings as Record<string, unknown>) || {};
  const aiSettings = {
    useCustomProvider: Boolean(rawAi.useCustomProvider),
    customProvider: (rawAi.customProvider as string) || "ollama",
    customModel: (rawAi.customModel as string) || "",
    customBaseUrl: (rawAi.customBaseUrl as string) || "http://localhost:11434/v1",
    hasCustomApiKey: Boolean(rawAi.hasCustomApiKey),
    preferredModel: (rawAi.preferredModel as string) || "nvidia/nemotron-3.5-lightning:free",
    permissionMode: (rawAi.permissionMode as string) || "default_approved",
    voiceAutoSpeak: rawAi.voiceAutoSpeak !== false,
    voiceGender: (rawAi.voiceGender === "male" ? "male" : "female") as "female" | "male",
    voiceTone:
      rawAi.voiceTone === "professional" ||
      rawAi.voiceTone === "calm" ||
      rawAi.voiceTone === "energetic"
        ? (rawAi.voiceTone as "professional" | "calm" | "energetic")
        : "friendly",
    voiceSpeed:
      rawAi.voiceSpeed === "slow" || rawAi.voiceSpeed === "fast"
        ? (rawAi.voiceSpeed as "slow" | "fast")
        : "normal",
    voiceLang: (rawAi.voiceLang === "bn-BD" ? "bn-BD" : "en-US") as "en-US" | "bn-BD",
  };

  const hasPlatformEnvKey = Boolean(
    process.env.OPENROUTER_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY ||
      platformCfg?.encryptedOpenrouterApiKey ||
      platformCfg?.encryptedGeminiApiKey ||
      platformCfg?.encryptedOpenaiApiKey ||
      platformCfg?.encryptedGroqApiKey
  );

  const platformActiveProvider: PlatformAiProviderId =
    (platformCfg?.activeProvider as PlatformAiProviderId) ||
    (process.env.AI_DEFAULT_PROVIDER as PlatformAiProviderId) ||
    "openrouter";

  const memberships = await WorkspaceMembership.find({
    userId: new mongoose.Types.ObjectId(session.user.id),
    status: { $ne: "suspended" },
  })
    .populate("workspaceId")
    .lean();

  const workspaceMap = new Map<string, string>();
  const workspaces: Array<{ id: string; name: string; type: string; role: string }> = [];
  for (const m of memberships) {
    const ws = m.workspaceId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      type: string;
      isArchived?: boolean;
    } | null;
    if (ws && !ws.isArchived) {
      const id = ws._id.toString();
      workspaceMap.set(id, ws.name);
      workspaces.push({ id, name: ws.name, type: ws.type, role: m.role });
    }
  }

  const userObjId = new mongoose.Types.ObjectId(session.user.id);
  const [rawKeys, rawOAuthClients, rawOAuthSessions] = await Promise.all([
    McpApiKey.find({ userId: userObjId }).sort({ createdAt: -1 }).lean(),
    OAuthClient.find({ createdByUserId: userObjId }).sort({ createdAt: -1 }).lean(),
    OAuthAccessToken.find({
      userId: userObjId,
      revokedAt: null,
      refreshExpiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const referencedClientIds = Array.from(
    new Set(rawOAuthSessions.map((tok) => tok.clientId))
  );
  const referencedClients =
    referencedClientIds.length > 0
      ? await OAuthClient.find({ clientId: { $in: referencedClientIds } })
          .select("clientId clientName")
          .lean()
      : [];
  const clientNameMap = new Map<string, string>();
  for (const c of referencedClients) {
    clientNameMap.set(c.clientId, c.clientName);
  }

  const keys: SafeMcpKeyInfo[] = rawKeys.map((k) => ({
    id: k._id.toString(),
    name: k.name,
    keyPrefix: k.keyPrefix,
    workspaceId: k.workspaceId.toString(),
    workspaceName: workspaceMap.get(k.workspaceId.toString()) || "Workspace",
    scopes: {
      read: k.scopes?.read !== false,
      write: k.scopes?.write !== false,
      delete: Boolean(k.scopes?.delete),
      finance: k.scopes?.finance !== false,
    },
    isActive: k.isActive !== false,
    lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
    createdAt: k.createdAt ? new Date(k.createdAt).toISOString() : new Date().toISOString(),
  }));

  const oauthClients: SafeOAuthClientInfo[] = rawOAuthClients.map((c) => ({
    id: c._id.toString(),
    clientId: c.clientId,
    clientName: c.clientName,
    redirectUris: Array.isArray(c.redirectUris) ? c.redirectUris : [],
    tokenEndpointAuthMethod: c.tokenEndpointAuthMethod || "none",
    hasSecret: Boolean(c.clientSecretHash),
    clientSecretPrefix: c.clientSecretPrefix || null,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
  }));

  const oauthSessions: SafeOAuthSessionInfo[] = rawOAuthSessions.map((tok) => {
    let fallbackName = "MCP OAuth App";
    if (tok.clientId.startsWith("https://")) {
      try {
        fallbackName = new URL(tok.clientId).hostname;
      } catch {
        // ignore
      }
    }
    return {
      id: tok._id.toString(),
      clientId: tok.clientId,
      clientName: clientNameMap.get(tok.clientId) || fallbackName,
      workspaceId: tok.workspaceId.toString(),
      workspaceName: workspaceMap.get(tok.workspaceId.toString()) || "Workspace",
      scopes: {
        read: tok.scopes?.read !== false,
        write: tok.scopes?.write !== false,
        delete: Boolean(tok.scopes?.delete),
        finance: Boolean(tok.scopes?.finance),
      },
      lastUsedAt: tok.lastUsedAt ? new Date(tok.lastUsedAt).toISOString() : null,
      expiresAt: tok.expiresAt ? new Date(tok.expiresAt).toISOString() : new Date().toISOString(),
      createdAt: tok.createdAt ? new Date(tok.createdAt).toISOString() : new Date().toISOString(),
    };
  });

  return {
    aiSettings,
    isPlatformAdmin: Boolean(user.isPlatformAdmin),
    hasPlatformEnvKey,
    hasServerEnvKey: hasPlatformEnvKey,
    platformSummary: {
      activeProvider: platformActiveProvider,
      defaultModel:
        platformActiveProvider === "gemini"
          ? platformCfg?.geminiModel || process.env.GEMINI_DEFAULT_MODEL || "gemini-4-argon"
          : platformActiveProvider === "openai"
          ? platformCfg?.openaiModel || "gpt-4o-mini"
          : platformActiveProvider === "groq"
          ? platformCfg?.groqModel || "llama-3.3-70b-versatile"
          : platformCfg?.openrouterModel ||
            process.env.OPENROUTER_DEFAULT_MODEL ||
            "nvidia/nemotron-3.5-lightning:free",
    },
    workspaces,
    keys,
    oauthClients,
    oauthSessions,
  };
}

export async function updateAiSettings(input: z.infer<typeof UpdateAiSettingsSchema>) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = UpdateAiSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid AI settings payload" };
  }

  if (parsed.data.customBaseUrl && parsed.data.customBaseUrl.trim()) {
    try {
      validateLlmBaseUrl(parsed.data.customBaseUrl);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Invalid Base URL",
      };
    }
  }

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) return { success: false, error: "User not found" };

  if (!user.preferences) user.preferences = {};
  if (!user.preferences.aiSettings) {
    user.preferences.aiSettings = {
      useCustomProvider: false,
      customProvider: "ollama",
      customModel: "",
      customBaseUrl: "http://localhost:11434/v1",
      preferredModel: "openai/gpt-4o-mini",
      permissionMode: "default_approved",
      voiceAutoSpeak: true,
      voiceGender: "female",
      voiceTone: "friendly",
      voiceSpeed: "normal",
      voiceLang: "en-US",
      hasCustomApiKey: false,
    };
  }

  const ai = user.preferences.aiSettings;

  if (typeof parsed.data.useCustomProvider === "boolean") {
    ai.useCustomProvider = parsed.data.useCustomProvider;
  }
  if (parsed.data.customProvider) {
    ai.customProvider = parsed.data.customProvider;
  }
  if (parsed.data.customModel !== undefined) {
    ai.customModel = parsed.data.customModel.trim();
  }
  if (parsed.data.customBaseUrl !== undefined) {
    ai.customBaseUrl = parsed.data.customBaseUrl.trim();
  }

  if (parsed.data.clearCustomApiKey || parsed.data.clearGeminiApiKey) {
    ai.encryptedCustomApiKey = undefined;
    ai.encryptedGeminiApiKey = undefined;
    ai.hasCustomApiKey = false;
  } else {
    const rawKey = (parsed.data.customApiKey || parsed.data.geminiApiKey || "").trim();
    if (rawKey.length > 0) {
      const enc = encryptServerSecret(rawKey);
      ai.encryptedCustomApiKey = enc;
      if (ai.customProvider === "gemini" || parsed.data.geminiApiKey) {
        ai.encryptedGeminiApiKey = enc;
      }
      ai.hasCustomApiKey = true;
    }
  }

  if (parsed.data.preferredModel) {
    ai.preferredModel = parsed.data.preferredModel;
  }
  if (parsed.data.permissionMode) {
    ai.permissionMode = parsed.data.permissionMode;
  }
  if (typeof parsed.data.voiceAutoSpeak === "boolean") {
    ai.voiceAutoSpeak = parsed.data.voiceAutoSpeak;
  }
  if (parsed.data.voiceGender) {
    ai.voiceGender = parsed.data.voiceGender;
  }
  if (parsed.data.voiceTone) {
    ai.voiceTone = parsed.data.voiceTone;
  }
  if (parsed.data.voiceSpeed) {
    ai.voiceSpeed = parsed.data.voiceSpeed;
  }
  if (parsed.data.voiceLang) {
    ai.voiceLang = parsed.data.voiceLang;
  }

  user.markModified("preferences.aiSettings");
  await user.save();
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  const safePrefs = sanitizePreferencesForClient(user.preferences);
  return { success: true, aiSettings: safePrefs.aiSettings };
}

export async function getPlatformAiConfig() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  await dbConnect();
  const user = await User.findById(session.user.id).select("isPlatformAdmin").lean();
  if (!user?.isPlatformAdmin) return { error: "Forbidden: Platform Admin access required" };

  const cfg = await PlatformAiConfig.findOne({ key: "default" }).lean();
  return {
    config: {
      activeProvider: (cfg?.activeProvider as PlatformAiProviderId) || "openrouter",
      openrouterModel:
        cfg?.openrouterModel ||
        process.env.OPENROUTER_DEFAULT_MODEL ||
        "nvidia/nemotron-3.5-lightning:free",
      openrouterFallbackModels: cfg?.openrouterFallbackModels?.length
        ? cfg.openrouterFallbackModels
        : [
            "google/gemma-4-26b-a4b-it:free",
            "google/gemma-4-31b-it:free",
            "inclusionai/ling-3.2-flash:free",
            "openrouter/free",
          ],
      hasOpenrouterDbKey: Boolean(cfg?.encryptedOpenrouterApiKey),
      hasOpenrouterEnvKey: Boolean(process.env.OPENROUTER_API_KEY),
      geminiModel: cfg?.geminiModel || process.env.GEMINI_DEFAULT_MODEL || "gemini-4-argon",
      geminiFallbackModels: cfg?.geminiFallbackModels?.length
        ? cfg.geminiFallbackModels
        : ["gemini-4-hydrogen", "gemini-3.5-flash-lite"],
      hasGeminiDbKey: Boolean(cfg?.encryptedGeminiApiKey),
      hasGeminiEnvKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      openaiModel: cfg?.openaiModel || "gpt-4o-mini",
      hasOpenaiDbKey: Boolean(cfg?.encryptedOpenaiApiKey),
      hasOpenaiEnvKey: Boolean(process.env.OPENAI_API_KEY),
      groqModel: cfg?.groqModel || "llama-3.3-70b-versatile",
      hasGroqDbKey: Boolean(cfg?.encryptedGroqApiKey),
      hasGroqEnvKey: Boolean(process.env.GROQ_API_KEY),
      customBaseUrl: cfg?.customBaseUrl || "",
      customModel: cfg?.customModel || "",
      hasCustomDbKey: Boolean(cfg?.encryptedCustomApiKey),
    },
  };
}

export async function updatePlatformAiConfig(input: z.infer<typeof UpdatePlatformAiSchema>) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  await dbConnect();
  const user = await User.findById(session.user.id).select("isPlatformAdmin").lean();
  if (!user?.isPlatformAdmin) {
    return { success: false, error: "Forbidden: Platform Admin access required" };
  }

  const parsed = UpdatePlatformAiSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid platform AI config" };
  }

  if (parsed.data.customBaseUrl && parsed.data.customBaseUrl.trim()) {
    try {
      validateLlmBaseUrl(parsed.data.customBaseUrl);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Invalid Custom URL" };
    }
  }

  let cfg = await PlatformAiConfig.findOne({ key: "default" });
  if (!cfg) {
    cfg = new PlatformAiConfig({ key: "default" });
  }

  cfg.activeProvider = parsed.data.activeProvider;
  cfg.openrouterModel = parsed.data.openrouterModel;
  cfg.openrouterFallbackModels = parsed.data.openrouterFallbackModels;
  if (parsed.data.clearOpenrouterApiKey) cfg.encryptedOpenrouterApiKey = null;
  else if (parsed.data.openrouterApiKey?.trim()) {
    cfg.encryptedOpenrouterApiKey = encryptServerSecret(parsed.data.openrouterApiKey.trim());
  }

  cfg.geminiModel = parsed.data.geminiModel;
  cfg.geminiFallbackModels = parsed.data.geminiFallbackModels;
  if (parsed.data.clearGeminiApiKey) cfg.encryptedGeminiApiKey = null;
  else if (parsed.data.geminiApiKey?.trim()) {
    cfg.encryptedGeminiApiKey = encryptServerSecret(parsed.data.geminiApiKey.trim());
  }

  if (parsed.data.openaiModel) cfg.openaiModel = parsed.data.openaiModel;
  if (parsed.data.clearOpenaiApiKey) cfg.encryptedOpenaiApiKey = null;
  else if (parsed.data.openaiApiKey?.trim()) {
    cfg.encryptedOpenaiApiKey = encryptServerSecret(parsed.data.openaiApiKey.trim());
  }

  if (parsed.data.groqModel) cfg.groqModel = parsed.data.groqModel;
  if (parsed.data.clearGroqApiKey) cfg.encryptedGroqApiKey = null;
  else if (parsed.data.groqApiKey?.trim()) {
    cfg.encryptedGroqApiKey = encryptServerSecret(parsed.data.groqApiKey.trim());
  }

  if (parsed.data.customBaseUrl !== undefined) cfg.customBaseUrl = parsed.data.customBaseUrl;
  if (parsed.data.customModel !== undefined) cfg.customModel = parsed.data.customModel;
  if (parsed.data.clearCustomApiKey) cfg.encryptedCustomApiKey = null;
  else if (parsed.data.customApiKey?.trim()) {
    cfg.encryptedCustomApiKey = encryptServerSecret(parsed.data.customApiKey.trim());
  }

  cfg.updatedBy = new mongoose.Types.ObjectId(session.user.id);
  await cfg.save();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/admin");

  return { success: true };
}

export async function testAiProviderConnection(override?: {
  provider?: "openrouter" | "gemini" | "openai" | "groq" | "ollama" | "lmstudio" | "custom";
  model?: string;
  baseUrl?: string;
  apiKey?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const start = Date.now();
    let candidates: ProviderCandidate[] = [];

    if (override?.provider) {
      const baseUrl =
        override.provider === "gemini"
          ? undefined
          : validateLlmBaseUrl(
              override.baseUrl?.trim() ||
                (override.provider === "openrouter"
                  ? "https://openrouter.ai/api/v1"
                  : override.provider === "openai"
                  ? "https://api.openai.com/v1"
                  : override.provider === "groq"
                  ? "https://api.groq.com/openai/v1"
                  : override.provider === "lmstudio"
                  ? "http://localhost:1234/v1"
                  : "http://localhost:11434/v1")
            );
      candidates = [
        {
          provider: override.provider,
          model: override.model?.trim() || "nvidia/nemotron-3.5-lightning:free",
          apiKey: override.apiKey?.trim() || "local-no-key-required",
          baseUrl,
          isLocal: override.provider === "ollama" || override.provider === "lmstudio",
          source: "user",
        },
      ];
    } else {
      const resolved = await resolveEffectiveAiTargets(session.user.id);
      candidates = resolved.candidates;
    }

    const res = await generateAgentTurn(
      candidates,
      "Reply with exactly: OK",
      [{ role: "user", content: "Health check. Reply OK." }]
    );

    return {
      success: true,
      provider: res.providerUsed,
      model: res.modelUsed,
      latencyMs: Date.now() - start,
      reply: res.text.slice(0, 80),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection test failed",
    };
  }
}

export async function createMcpApiKey(input: z.infer<typeof CreateMcpKeySchema>) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = CreateMcpKeySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid MCP key configuration" };
  }

  await dbConnect();
  const membership = await WorkspaceMembership.findOne({
    userId: new mongoose.Types.ObjectId(session.user.id),
    workspaceId: new mongoose.Types.ObjectId(parsed.data.workspaceId),
    status: { $ne: "suspended" },
  }).lean();

  if (!membership) {
    return { success: false, error: "You do not belong to that workspace" };
  }

  const { rawToken, keyPrefix, keyHash } = generateMcpToken();
  const created = await McpApiKey.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    workspaceId: new mongoose.Types.ObjectId(parsed.data.workspaceId),
    name: parsed.data.name,
    keyPrefix,
    keyHash,
    scopes: parsed.data.scopes,
    isActive: true,
  });

  revalidatePath("/dashboard/settings");

  return {
    success: true,
    rawToken,
    key: {
      id: created._id.toString(),
      name: created.name,
      keyPrefix: created.keyPrefix,
      workspaceId: created.workspaceId.toString(),
      scopes: parsed.data.scopes,
      isActive: true,
    },
  };
}

export async function toggleMcpApiKeyStatus(keyId: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!mongoose.Types.ObjectId.isValid(keyId)) return { success: false, error: "Invalid key ID" };

  await dbConnect();
  const updated = await McpApiKey.findOneAndUpdate(
    { _id: keyId, userId: new mongoose.Types.ObjectId(session.user.id) },
    { $set: { isActive } },
    { new: true }
  ).lean();

  if (!updated) return { success: false, error: "MCP API key not found" };
  revalidatePath("/dashboard/settings");
  return { success: true, isActive: updated.isActive };
}

export async function updateMcpApiKeyScopes(keyId: string, scopes: IMcpKeyScopes) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!mongoose.Types.ObjectId.isValid(keyId)) return { success: false, error: "Invalid key ID" };

  await dbConnect();
  const updated = await McpApiKey.findOneAndUpdate(
    { _id: keyId, userId: new mongoose.Types.ObjectId(session.user.id) },
    {
      $set: {
        scopes: {
          read: Boolean(scopes.read),
          write: Boolean(scopes.write),
          delete: Boolean(scopes.delete),
          finance: Boolean(scopes.finance),
        },
      },
    },
    { new: true }
  ).lean();

  if (!updated) return { success: false, error: "MCP API key not found" };
  revalidatePath("/dashboard/settings");
  return { success: true, scopes: updated.scopes };
}

export async function revokeMcpApiKey(keyId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!mongoose.Types.ObjectId.isValid(keyId)) return { success: false, error: "Invalid key ID" };

  await dbConnect();
  const deleted = await McpApiKey.findOneAndDelete({
    _id: keyId,
    userId: new mongoose.Types.ObjectId(session.user.id),
  }).lean();

  if (!deleted) return { success: false, error: "MCP API key not found" };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function createUserOAuthClient(
  input: z.infer<typeof CreateUserOAuthClientSchema>
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = CreateUserOAuthClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Provide a client name and at least one valid Redirect URI.",
    };
  }

  const uniqueUris = Array.from(
    new Set(parsed.data.redirectUris.map((u) => u.trim()).filter(Boolean))
  );
  if (uniqueUris.length === 0) {
    return { success: false, error: "At least one Redirect URI is required." };
  }

  for (const uri of uniqueUris) {
    if (!isValidOAuthRedirectUri(uri)) {
      return {
        success: false,
        error: `Invalid Redirect URI "${uri}". Redirect URIs must use HTTPS (or localhost HTTP) with no # fragments.`,
      };
    }
  }

  const useSecret = parsed.data.useClientSecret !== false;
  const clientId = generateOpaqueToken("mgo_client_", 18);
  const rawSecret = useSecret ? generateOpaqueToken("mgo_cs_", 24) : undefined;
  const clientSecretHash = rawSecret ? hashMcpToken(rawSecret) : null;
  const clientSecretPrefix = rawSecret ? `${rawSecret.slice(0, 12)}...` : null;
  const tokenEndpointAuthMethod = useSecret ? "client_secret_post" : "none";

  await dbConnect();
  const created = await OAuthClient.create({
    clientId,
    clientSecretHash,
    clientSecretPrefix,
    createdByUserId: new mongoose.Types.ObjectId(session.user.id),
    clientName: parsed.data.clientName,
    redirectUris: uniqueUris,
    grantTypes: ["authorization_code", "refresh_token"],
    responseTypes: ["code"],
    tokenEndpointAuthMethod,
    scope: DEFAULT_OAUTH_SCOPE,
  });

  revalidatePath("/dashboard/settings");

  return {
    success: true,
    clientId: created.clientId,
    clientSecret: rawSecret,
    client: {
      id: created._id.toString(),
      clientId: created.clientId,
      clientName: created.clientName,
      redirectUris: created.redirectUris,
      tokenEndpointAuthMethod: created.tokenEndpointAuthMethod,
      hasSecret: Boolean(rawSecret),
      clientSecretPrefix,
      createdAt: created.createdAt
        ? new Date(created.createdAt).toISOString()
        : new Date().toISOString(),
    } satisfies SafeOAuthClientInfo,
  };
}

export async function deleteUserOAuthClient(clientRecordId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!mongoose.Types.ObjectId.isValid(clientRecordId)) {
    return { success: false, error: "Invalid OAuth client ID" };
  }

  await dbConnect();
  const userObjId = new mongoose.Types.ObjectId(session.user.id);
  const deleted = await OAuthClient.findOneAndDelete({
    _id: clientRecordId,
    createdByUserId: userObjId,
  }).lean();

  if (!deleted) {
    return { success: false, error: "OAuth client not found" };
  }

  await Promise.all([
    OAuthAccessToken.updateMany(
      { clientId: deleted.clientId, userId: userObjId },
      { $set: { revokedAt: new Date() }, $unset: { refreshTokenHash: 1 } }
    ),
    OAuthAuthCode.deleteMany({ clientId: deleted.clientId, userId: userObjId }),
  ]);

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function revokeUserOAuthSession(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return { success: false, error: "Invalid OAuth session ID" };
  }

  await dbConnect();
  const updated = await OAuthAccessToken.findOneAndUpdate(
    {
      _id: sessionId,
      userId: new mongoose.Types.ObjectId(session.user.id),
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
      $unset: { refreshTokenHash: 1 },
    },
    { returnDocument: "after" }
  ).lean();

  if (!updated) {
    return { success: false, error: "Active OAuth connection not found" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
