"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export type VaultAuthResult = { success: true; vaultKey: string } | { success: false; error: string };

export async function setupVaultPassword(password: string) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return { success: false, error: "Unauthorized" };
    
    const userId = (session.user as any).id;
    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found" };

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await User.updateOne(
      { _id: userId },
      { 
        $set: { 
          "preferences.vaultSettings.isInitialized": true,
          "preferences.vaultSettings.vaultPasswordHash": hash 
        } 
      }
    );

    revalidatePath("/dashboard/vault");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function unlockVault(password: string): Promise<VaultAuthResult> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return { success: false, error: "Unauthorized" };
    
    const userId = (session.user as any).id;
    const user = await User.findById(userId);
    if (!user || !user.preferences?.vaultSettings?.vaultPasswordHash) {
      return { success: false, error: "Vault not setup" };
    }

    const isValid = await bcrypt.compare(password, user.preferences.vaultSettings.vaultPasswordHash);
    if (!isValid) return { success: false, error: "Incorrect password" };

    // Generate deterministic vault key
    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-key-do-not-use-in-prod";
    const vaultKey = crypto.createHash('sha256').update(userId + secret).digest('hex');

    return { success: true, vaultKey };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function verifyCustomPassword(itemId: string, customPassword: string): Promise<VaultAuthResult> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return { success: false, error: "Unauthorized" };
    
    const userId = (session.user as any).id;
    const { default: VaultItem } = await import("@/models/VaultItem");
    const item = await VaultItem.findOne({ _id: itemId, userId });
    
    if (!item || !item.customPasswordHash) {
      return { success: false, error: "Invalid item or not a custom password item" };
    }

    const isValid = await bcrypt.compare(customPassword, item.customPasswordHash);
    if (!isValid) return { success: false, error: "Incorrect custom password" };

    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-key-do-not-use-in-prod";
    const vaultKey = crypto.createHash('sha256').update(userId + secret).digest('hex');

    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/settings");
    return { success: true, vaultKey };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resetCustomPassword(itemId: string, otp: string, accountPassword: string, newCustomPassword: string): Promise<VaultAuthResult> {
  try {
    if (otp !== "123456") return { success: false, error: "Invalid OTP Code" };

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return { success: false, error: "Unauthorized" };
    
    const userId = (session.user as any).id;
    const user = await User.findById(userId);
    if (!user || !user.passwordHash) return { success: false, error: "Website account password not found" };

    const isAccountValid = await bcrypt.compare(accountPassword, user.passwordHash);
    if (!isAccountValid) return { success: false, error: "Incorrect website account password" };

    const { default: VaultItem } = await import("@/models/VaultItem");
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newCustomPassword, salt);
    
    await VaultItem.findOneAndUpdate(
      { _id: itemId, userId },
      { $set: { customPasswordHash: hash } }
    );

    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-key-do-not-use-in-prod";
    const vaultKey = crypto.createHash('sha256').update(userId + secret).digest('hex');

    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/settings");
    return { success: true, vaultKey };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resetVaultPassword(otp: string, accountPassword: string, newVaultPassword: string): Promise<VaultAuthResult> {
  try {
    if (otp !== "123456") return { success: false, error: "Invalid OTP Code" };

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return { success: false, error: "Unauthorized" };
    
    const userId = (session.user as any).id;
    const user = await User.findById(userId);
    if (!user || !user.passwordHash) return { success: false, error: "Website account password not found" };

    const isAccountValid = await bcrypt.compare(accountPassword, user.passwordHash);
    if (!isAccountValid) return { success: false, error: "Incorrect website account password" };
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newVaultPassword, salt);
    
    await User.updateOne(
      { _id: userId },
      { $set: { "preferences.vaultSettings.vaultPasswordHash": hash } }
    );

    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-key-do-not-use-in-prod";
    const vaultKey = crypto.createHash('sha256').update(userId + secret).digest('hex');

    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/settings");
    return { success: true, vaultKey };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
