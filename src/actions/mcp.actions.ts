"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import McpApiKey, { IMcpKeyScopes } from "@/models/McpApiKey";
import "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import { encryptServerSecret, generateMcpToken } from "@/lib/server-crypto";
import { sanitizePreferencesForClient } from "@/lib/sanitize-preferences";
import { z } from "zod";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

const UpdateAiSettingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  clearGeminiApiKey: z.boolean().optional(),
  preferredModel: z
    .enum(["gemini-4-hydrogen", "gemini-4-argon", "gemini-3.5-flash-lite"])
    .optional(),
  permissionMode: z.enum(["review", "default_approved", "turbo"]).optional(),
  voiceAutoSpeak: z.boolean().optional(),
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

export async function getAiAndMcpSettings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select("preferences").lean();
  if (!user) return { error: "User not found" };

  const safePrefs = sanitizePreferencesForClient(user.preferences);
  const aiSettings = (safePrefs.aiSettings as Record<string, unknown>) || {
    hasCustomApiKey: false,
    preferredModel: "gemini-4-hydrogen",
    permissionMode: "default_approved",
    voiceAutoSpeak: true,
  };

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

  const rawKeys = await McpApiKey.find({
    userId: new mongoose.Types.ObjectId(session.user.id),
  })
    .sort({ createdAt: -1 })
    .lean();

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

  return {
    aiSettings,
    hasServerEnvKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    workspaces,
    keys,
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

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) return { success: false, error: "User not found" };

  if (!user.preferences) user.preferences = {};
  if (!user.preferences.aiSettings) {
    user.preferences.aiSettings = {
      preferredModel: "gemini-4-hydrogen",
      permissionMode: "default_approved",
      voiceAutoSpeak: true,
      hasCustomApiKey: false,
    };
  }

  const ai = user.preferences.aiSettings;

  if (parsed.data.clearGeminiApiKey) {
    ai.encryptedGeminiApiKey = undefined;
    ai.hasCustomApiKey = false;
  } else if (parsed.data.geminiApiKey && parsed.data.geminiApiKey.trim().length > 0) {
    ai.encryptedGeminiApiKey = encryptServerSecret(parsed.data.geminiApiKey.trim());
    ai.hasCustomApiKey = true;
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

  user.markModified("preferences.aiSettings");
  await user.save();
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  const safePrefs = sanitizePreferencesForClient(user.preferences);
  return { success: true, aiSettings: safePrefs.aiSettings };
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
