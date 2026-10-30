"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export interface SectionSecurityStatus {
  success: boolean;
  isInitialized: boolean;
  lockedSections: string[];
  userEmail?: string;
  error?: string;
}

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export async function getSectionSecurityStatus(): Promise<SectionSecurityStatus> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, isInitialized: false, lockedSections: [], error: "Unauthorized" };
    }

    const userId = session.user.id;
    const user = await User.findById(userId).select("email preferences.sectionSecurity").lean();

    if (!user) {
      return { success: false, isInitialized: false, lockedSections: [], error: "User not found" };
    }

    const sec = (user as unknown as { preferences?: { sectionSecurity?: { isInitialized?: boolean; passwordHash?: string; lockedSections?: string[] } } }).preferences?.sectionSecurity;
    return {
      success: true,
      isInitialized: !!(sec?.isInitialized || sec?.passwordHash),
      lockedSections: Array.isArray(sec?.lockedSections) ? sec.lockedSections : [],
      userEmail: user.email ? maskEmail(user.email) : undefined,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("getSectionSecurityStatus error:", err);
    return { success: false, isInitialized: false, lockedSections: [], error: error.message };
  }
}

export async function setupSectionLockPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!password || password.length < 4) {
      return { success: false, error: "Password must be at least 4 characters long" };
    }

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          "preferences.sectionSecurity.isInitialized": true,
          "preferences.sectionSecurity.passwordHash": hash,
        },
      }
    );

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

export async function changeSectionLockPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: "New password must be at least 4 characters long" };
    }

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const user = await User.findById(userId).select("preferences.sectionSecurity.passwordHash");
    if (!user || !user.preferences?.sectionSecurity?.passwordHash) {
      return { success: false, error: "Security password not initialized yet" };
    }

    const isValid = await bcrypt.compare(currentPassword, user.preferences.sectionSecurity.passwordHash);
    if (!isValid) {
      return { success: false, error: "Current section password is incorrect" };
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await User.updateOne(
      { _id: userId },
      { $set: { "preferences.sectionSecurity.passwordHash": hash } }
    );

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

export async function toggleSectionLock(
  sectionId: string,
  shouldLock: boolean,
  password?: string
): Promise<{ success: boolean; lockedSections?: string[]; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const user = await User.findById(userId).select("preferences.sectionSecurity");
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const sec = user.preferences?.sectionSecurity;
    if (!sec?.isInitialized || !sec?.passwordHash) {
      return { success: false, error: "Please set up a section security password first before locking sections." };
    }

    // Must supply valid password to lock or unlock
    if (!password) {
      return { success: false, error: "Password is required to lock or unlock sections." };
    }

    const isValid = await bcrypt.compare(password, sec.passwordHash);
    if (!isValid) {
      return { success: false, error: "Incorrect section password. Verification failed." };
    }

    if (shouldLock) {
      await User.updateOne(
        { _id: userId },
        { $addToSet: { "preferences.sectionSecurity.lockedSections": sectionId } }
      );
    } else {
      await User.updateOne(
        { _id: userId },
        { $pull: { "preferences.sectionSecurity.lockedSections": sectionId } }
      );
    }

    const updatedUser = await User.findById(userId).select("preferences.sectionSecurity.lockedSections").lean();
    const updatedLocked = (updatedUser as unknown as { preferences?: { sectionSecurity?: { lockedSections?: string[] } } })?.preferences?.sectionSecurity?.lockedSections || [];

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true, lockedSections: updatedLocked };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

export async function verifySectionLockPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const user = await User.findById(userId).select("preferences.sectionSecurity.passwordHash").lean();
    const userSec = user as unknown as { preferences?: { sectionSecurity?: { passwordHash?: string } } };
    if (!user || !userSec.preferences?.sectionSecurity?.passwordHash) {
      return { success: false, error: "Section security not configured" };
    }

    const isValid = await bcrypt.compare(password, userSec.preferences!.sectionSecurity!.passwordHash!);
    if (!isValid) {
      return { success: false, error: "Incorrect password. Access denied." };
    }

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

export async function sendSectionLockResetOTP(): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user || !user.email) {
      return { success: false, error: "User email not found" };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const { default: VerificationToken } = await import("@/models/VerificationToken");
    const { sendEmail } = await import("@/lib/email/resend");

    // Remove any previous unconsumed section_lock_reset tokens for this email
    await VerificationToken.deleteMany({ email: user.email.toLowerCase().trim(), type: "section_lock_reset" });

    await VerificationToken.create({
      email: user.email.toLowerCase().trim(),
      token: otp,
      type: "section_lock_reset",
      expires,
    });

    const emailSent = await sendEmail({
      to: user.email,
      subject: "Manageo — Section Security Verification Code",
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0b0f19; color: #f1f5f9; padding: 36px; border-radius: 20px; border: 1px solid rgba(56, 189, 248, 0.2);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; color: #38bdf8; font-size: 22px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Manageo</div>
            <div style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Section Lock Security</div>
          </div>
          <h2 style="text-align: center; color: #f8fafc; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Section Password Reset</h2>
          <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 28px; line-height: 1.5;">
            Use the following 6-digit verification code to confirm your identity and reset your protected section security password.
          </p>
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${otp}</div>
            <p style="color: #64748b; font-size: 12px; margin-top: 10px; font-weight: 500;">Valid for 15 minutes</p>
          </div>
          <div style="background-color: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; text-align: left;">
            <p style="color: #38bdf8; font-size: 12px; font-weight: 700; margin: 0 0 4px 0;">📬 Important Security Tip</p>
            <p style="color: #94a3b8; font-size: 11px; line-height: 1.45; margin: 0;">
              If this security email was delivered to your <strong>Spam or Junk folder</strong>, please move it to your Inbox and mark as <em>&quot;Not Spam&quot;</em> so security codes arrive without delay.
            </p>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
            If you did not request to reset your section password, please log into your account and verify your security settings immediately.
          </p>
        </div>
      `,
    });

    if (!emailSent) {
      return { success: false, error: "Failed to send verification code. Please check your Brevo email configuration." };
    }

    return { success: true, message: `Verification code sent to ${maskEmail(user.email)}` };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("sendSectionLockResetOTP error:", err);
    return { success: false, error: error.message };
  }
}

export async function resetSectionLockPassword(
  otp: string,
  accountPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!otp || typeof otp !== "string") return { success: false, error: "Verification code is required" };
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: "New password must be at least 4 characters long" };
    }

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };

    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user || !user.email) return { success: false, error: "User not found" };
    if (!user.passwordHash) return { success: false, error: "Website account password is not set" };

    const { default: VerificationToken } = await import("@/models/VerificationToken");
    const tokenRecord = await VerificationToken.findOne({
      email: user.email.toLowerCase().trim(),
      token: otp.trim(),
      type: "section_lock_reset",
      expires: { $gt: new Date() },
    });

    if (!tokenRecord) {
      return { success: false, error: "Invalid or expired verification code. Please request a new one." };
    }

    const isAccountValid = await bcrypt.compare(accountPassword, user.passwordHash);
    if (!isAccountValid) {
      return { success: false, error: "Incorrect account login password" };
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          "preferences.sectionSecurity.isInitialized": true,
          "preferences.sectionSecurity.passwordHash": hash,
        },
      }
    );

    await VerificationToken.deleteMany({ email: user.email.toLowerCase().trim(), type: "section_lock_reset" });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}


export async function unlockSectionWithBiometrics(sectionId: string, data: {
  authData: string;
  clientDataJSON: string;
  signature: string;
  credentialId?: string;
}): Promise<{ success: boolean; grantToken?: string; error?: string }> {
  try {
    const { verifyBiometricAssertion } = await import("@/actions/biometric.actions");
    const result = await verifyBiometricAssertion({
      authData: data.authData,
      clientDataJSON: data.clientDataJSON,
      signature: data.signature,
      scope: "section",
      targetId: sectionId,
      credentialId: data.credentialId,
    });

    if (!result.success) {
      return { success: false, error: result.error || "Biometric authentication failed" };
    }

    return { success: true, grantToken: result.grantToken };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}
