"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { deriveVaultKey } from "@/lib/vault-key";

export type VaultAuthResult = { success: true; vaultKey: string } | { success: false; error: string };

export async function setupVaultPassword(password: string) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    
    const userId = session.user.id;
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
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

export async function unlockVault(password: string): Promise<VaultAuthResult> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    
    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user || !user.preferences?.vaultSettings?.vaultPasswordHash) {
      return { success: false, error: "Vault not setup" };
    }

    const settings = user.preferences.vaultSettings;
    const now = new Date();

    // Check if user is locked out on the server
    if (settings.lockedUntil && new Date(settings.lockedUntil) > now) {
      const remainingSeconds = Math.ceil((new Date(settings.lockedUntil).getTime() - now.getTime()) / 1000);
      return { success: false, error: `Account locked. Please wait ${remainingSeconds}s.` };
    }

    const isValid = await bcrypt.compare(password, settings.vaultPasswordHash);
    if (!isValid) {
      const currentFailed = (settings.failedAttempts || 0) + 1;
      const maxAttempts = settings.maxFailedAttempts || 3;
      const lockoutSeconds = settings.lockoutDurationSeconds || 30;

      if (currentFailed >= maxAttempts) {
        const lockedUntil = new Date(Date.now() + lockoutSeconds * 1000);
        await User.updateOne(
          { _id: userId },
          { 
            $set: { 
              "preferences.vaultSettings.failedAttempts": 0,
              "preferences.vaultSettings.lockedUntil": lockedUntil 
            } 
          }
        );
        return { success: false, error: `Too many failed attempts. Vault locked for ${lockoutSeconds} seconds.` };
      } else {
        await User.updateOne(
          { _id: userId },
          { $set: { "preferences.vaultSettings.failedAttempts": currentFailed } }
        );
        return { success: false, error: `Incorrect password. ${maxAttempts - currentFailed} attempts remaining.` };
      }
    }

    // Success: Reset failed attempts & lockout
    if (settings.failedAttempts || settings.lockedUntil) {
      await User.updateOne(
        { _id: userId },
        { 
          $set: { 
            "preferences.vaultSettings.failedAttempts": 0,
            "preferences.vaultSettings.lockedUntil": null 
          } 
        }
      );
    }

    // Generate deterministic vault key
    const vaultKey = deriveVaultKey(userId);

    return { success: true, vaultKey };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

export async function verifyCustomPassword(itemId: string, customPassword: string): Promise<VaultAuthResult> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    
    const userId = session.user.id;
    const user = await User.findById(userId);
    const settings = user?.preferences?.vaultSettings;
    const now = new Date();

    if (settings?.lockedUntil && new Date(settings.lockedUntil) > now) {
      const remainingSeconds = Math.ceil((new Date(settings.lockedUntil).getTime() - now.getTime()) / 1000);
      return { success: false, error: `Account locked. Please wait ${remainingSeconds}s.` };
    }

    const { default: VaultItem } = await import("@/models/VaultItem");
    const item = await VaultItem.findOne({ _id: itemId, userId });
    
    if (!item || !item.customPasswordHash) {
      return { success: false, error: "Invalid item or not a custom password item" };
    }

    const isValid = await bcrypt.compare(customPassword, item.customPasswordHash);
    if (!isValid) {
      const currentFailed = (settings?.failedAttempts || 0) + 1;
      const maxAttempts = settings?.maxFailedAttempts || 3;
      const lockoutSeconds = settings?.lockoutDurationSeconds || 30;

      if (currentFailed >= maxAttempts) {
        const lockedUntil = new Date(Date.now() + lockoutSeconds * 1000);
        await User.updateOne(
          { _id: userId },
          { 
            $set: { 
              "preferences.vaultSettings.failedAttempts": 0,
              "preferences.vaultSettings.lockedUntil": lockedUntil 
            } 
          }
        );
        return { success: false, error: `Too many failed attempts. Vault locked for ${lockoutSeconds} seconds.` };
      } else {
        await User.updateOne(
          { _id: userId },
          { $set: { "preferences.vaultSettings.failedAttempts": currentFailed } }
        );
        return { success: false, error: `Incorrect custom password. ${maxAttempts - currentFailed} attempts remaining.` };
      }
    }

    // Success: Reset failed attempts & lockout
    if (settings?.failedAttempts || settings?.lockedUntil) {
      await User.updateOne(
        { _id: userId },
        { 
          $set: { 
            "preferences.vaultSettings.failedAttempts": 0,
            "preferences.vaultSettings.lockedUntil": null 
          } 
        }
      );
    }

    const vaultKey = deriveVaultKey(userId);

    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/settings");
    return { success: true, vaultKey };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

export async function sendVaultResetOTP(): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };

    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user || !user.email) return { success: false, error: "User email not found" };

    // Generate cryptographically random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const { default: VerificationToken } = await import("@/models/VerificationToken");
    const { sendEmail } = await import("@/lib/email/resend");

    // Anti-spam / flood protection: 60-second cooldown
    const existingRecentToken = await VerificationToken.findOne({
      email: user.email.toLowerCase().trim(),
      type: "vault_reset",
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });
    if (existingRecentToken) {
      return { success: false, error: "Please wait 60 seconds before requesting another verification code." };
    }

    // Remove any previous unconsumed vault_reset tokens for this email
    await VerificationToken.deleteMany({ email: user.email.toLowerCase().trim(), type: "vault_reset" });

    // Store new token
    await VerificationToken.create({
      email: user.email.toLowerCase().trim(),
      token: otp,
      type: "vault_reset",
      expires,
      attempts: 0
    });

    // Send email to user
    const emailSent = await sendEmail({
      to: user.email,
      subject: "Manageo — Vault Security Verification Code",
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0b0f19; color: #f1f5f9; padding: 36px; border-radius: 20px; border: 1px solid rgba(56, 189, 248, 0.2);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; color: #38bdf8; font-size: 22px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Manageo</div>
            <div style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Vault Security Services</div>
          </div>
          <h2 style="text-align: center; color: #f8fafc; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Vault Password Reset</h2>
          <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 28px; line-height: 1.5;">
            Use the following 6-digit verification code to confirm your identity and reset your vault security credentials.
          </p>
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${otp}</div>
            <p style="color: #64748b; font-size: 12px; margin-top: 10px; font-weight: 500;">Valid for 15 minutes</p>
          </div>
          <div style="background-color: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; text-align: left;">
            <p style="color: #38bdf8; font-size: 12px; font-weight: 700; margin: 0 0 4px 0;">📬 Important Security Tip</p>
            <p style="color: #94a3b8; font-size: 11px; line-height: 1.45; margin: 0;">
              If this security email was delivered to your <strong>Spam or Junk folder</strong>, please move it to your Inbox and mark as <em>&quot;Not Spam&quot;</em> so emergency codes arrive without delay.
            </p>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
            If you did not request a vault password reset, please log into your Manageo account immediately and verify your security settings.
          </p>
        </div>
      `,
    });

    if (!emailSent) {
      return { success: false, error: "Failed to deliver OTP to your email. Please try again later." };
    }

    return { success: true, message: `Verification code sent to ${user.email}` };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("sendVaultResetOTP error:", err);
    return { success: false, error: error.message };
  }
}

export async function resetCustomPassword(itemId: string, otp: string, accountPassword: string, newCustomPassword: string): Promise<VaultAuthResult> {
  try {
    if (!otp || typeof otp !== "string") return { success: false, error: "OTP code is required" };

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    
    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user || !user.email) return { success: false, error: "User not found" };
    if (!user.passwordHash) return { success: false, error: "Website account password not set" };

    // Validate real OTP against VerificationToken
    const { default: VerificationToken } = await import("@/models/VerificationToken");
    const tokenRecord = await VerificationToken.findOne({
      email: user.email.toLowerCase().trim(),
      type: "vault_reset",
      expires: { $gt: new Date() },
    });

    if (!tokenRecord) {
      return { success: false, error: "Invalid or expired OTP code. Please request a new code." };
    }

    if (tokenRecord.token !== otp.trim()) {
      const attempts = (tokenRecord.attempts || 0) + 1;
      if (attempts >= 5) {
        await VerificationToken.deleteOne({ _id: tokenRecord._id });
        return { success: false, error: "Too many incorrect OTP attempts. Code has been invalidated." };
      }
      await VerificationToken.updateOne({ _id: tokenRecord._id }, { $set: { attempts } });
      return { success: false, error: `Invalid OTP code. ${5 - attempts} attempts remaining.` };
    }

    const isAccountValid = await bcrypt.compare(accountPassword, user.passwordHash);
    if (!isAccountValid) return { success: false, error: "Incorrect website account password" };

    const { default: VaultItem } = await import("@/models/VaultItem");
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newCustomPassword, salt);
    
    await VaultItem.findOneAndUpdate(
      { _id: itemId, userId },
      { $set: { customPasswordHash: hash } },
      { returnDocument: "after" }
    );

    // Consume the token after successful reset
    await VerificationToken.deleteMany({ email: user.email.toLowerCase().trim(), type: "vault_reset" });

    const vaultKey = deriveVaultKey(userId);

    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/settings");
    return { success: true, vaultKey };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

export async function resetVaultPassword(otp: string, accountPassword: string, newVaultPassword: string): Promise<VaultAuthResult> {
  try {
    if (!otp || typeof otp !== "string") return { success: false, error: "OTP code is required" };

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    
    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user || !user.email) return { success: false, error: "User not found" };
    if (!user.passwordHash) return { success: false, error: "Website account password not set" };

    // Validate real OTP against VerificationToken
    const { default: VerificationToken } = await import("@/models/VerificationToken");
    const tokenRecord = await VerificationToken.findOne({
      email: user.email.toLowerCase().trim(),
      type: "vault_reset",
      expires: { $gt: new Date() },
    });

    if (!tokenRecord) {
      return { success: false, error: "Invalid or expired OTP code. Please request a new code." };
    }

    if (tokenRecord.token !== otp.trim()) {
      const attempts = (tokenRecord.attempts || 0) + 1;
      if (attempts >= 5) {
        await VerificationToken.deleteOne({ _id: tokenRecord._id });
        return { success: false, error: "Too many incorrect OTP attempts. Code has been invalidated." };
      }
      await VerificationToken.updateOne({ _id: tokenRecord._id }, { $set: { attempts } });
      return { success: false, error: `Invalid OTP code. ${5 - attempts} attempts remaining.` };
    }

    const isAccountValid = await bcrypt.compare(accountPassword, user.passwordHash);
    if (!isAccountValid) return { success: false, error: "Incorrect website account password" };
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newVaultPassword, salt);
    
    await User.updateOne(
      { _id: userId },
      { $set: { "preferences.vaultSettings.vaultPasswordHash": hash, "preferences.vaultSettings.failedAttempts": 0, "preferences.vaultSettings.lockedUntil": null } }
    );

    // Consume the token after successful reset
    await VerificationToken.deleteMany({ email: user.email.toLowerCase().trim(), type: "vault_reset" });

    const vaultKey = deriveVaultKey(userId);

    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/settings");
    return { success: true, vaultKey };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}


export async function unlockVaultWithBiometrics(data: {
  authData: string;
  clientDataJSON: string;
  signature: string;
  itemId?: string;
}): Promise<VaultAuthResult> {
  try {
    const { verifyBiometricAssertion } = await import("@/actions/biometric.actions");
    const result = await verifyBiometricAssertion({
      authData: data.authData,
      clientDataJSON: data.clientDataJSON,
      signature: data.signature,
      scope: "vault",
      targetId: data.itemId,
    });

    if (!result.success || !result.vaultKey) {
      return { success: false, error: result.error || "Biometric authentication failed" };
    }

    return { success: true, vaultKey: result.vaultKey };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}
