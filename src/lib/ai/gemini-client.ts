import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { decryptServerSecret } from "@/lib/server-crypto";
import type { PermissionMode } from "@/lib/ai/tools";

export type GeminiTextModel =
  | "gemini-4-hydrogen"
  | "gemini-4-argon"
  | "gemini-3.5-flash-lite";

export class MissingAiKeyError extends Error {
  code = "MISSING_API_KEY" as const;
  constructor(
    message = "Gemini API key is not configured. Add your Gemini API key in Settings → AI & MCP Connector or right here."
  ) {
    super(message);
    this.name = "MissingAiKeyError";
  }
}

export interface ResolvedAiConfig {
  apiKey: string;
  preferredModel: GeminiTextModel;
  permissionMode: PermissionMode;
  voiceAutoSpeak: boolean;
  userName: string;
}

export async function resolveUserAiConfig(userId: string): Promise<ResolvedAiConfig> {
  await dbConnect();
  const user = await User.findById(userId)
    .select("name email preferences.aiSettings")
    .lean();

  if (!user) {
    throw new Error("User not found");
  }

  const ai = (user.preferences?.aiSettings || {}) as {
    encryptedGeminiApiKey?: string;
    preferredModel?: string;
    permissionMode?: string;
    voiceAutoSpeak?: boolean;
  };

  let apiKey = "";
  if (ai.encryptedGeminiApiKey) {
    try {
      apiKey = decryptServerSecret(ai.encryptedGeminiApiKey);
    } catch {
      apiKey = "";
    }
  }
  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  }
  if (!apiKey.trim()) {
    throw new MissingAiKeyError();
  }

  const validModels: GeminiTextModel[] = [
    "gemini-4-hydrogen",
    "gemini-4-argon",
    "gemini-3.5-flash-lite",
  ];
  const preferredModel = validModels.includes(ai.preferredModel as GeminiTextModel)
    ? (ai.preferredModel as GeminiTextModel)
    : "gemini-4-hydrogen";

  const validModes: PermissionMode[] = ["review", "default_approved", "turbo"];
  const permissionMode = validModes.includes(ai.permissionMode as PermissionMode)
    ? (ai.permissionMode as PermissionMode)
    : "default_approved";

  return {
    apiKey: apiKey.trim(),
    preferredModel,
    permissionMode,
    voiceAutoSpeak: ai.voiceAutoSpeak !== false,
    userName: user.name || user.email || "Manageo User",
  };
}

export function createGeminiClient(apiKey: string, apiVersion?: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { httpOptions: { apiVersion } } : {}),
  });
}
