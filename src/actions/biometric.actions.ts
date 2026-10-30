"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { deriveVaultKey } from "@/lib/vault-key";
import {
  parseAttestationObject,
  verifyWebAuthnSignature,
  signAuthGrant,
  } from "@/lib/webauthn";

export interface BiometricStatus {
  isBiometricEnrolled: boolean;
  biometricSettings?: {
    isEnabled: boolean;
    credentials?: Array<{
      credentialId: string;
      deviceName?: string;
      enrolledAt: string | Date;
    }>;
    requireForVault: boolean;
    requireForSections: boolean;
    requireForAppLock: boolean;
    allowPasswordFallback: boolean;
    strictSharedDeviceProtection: boolean;
    enrolledAt?: Date;
  };
  appLockSettings?: {
    isEnabled: boolean;
    authMethod: "password" | "biometric" | "both";
    timeoutMinutes: number;
    lockOnBackground: boolean;
    requireBiometricWithoutFallback?: boolean;
    strictSharedDeviceMode?: boolean;
    hasCustomPin?: boolean;
  };
}

export async function getAppLockAndBiometricStatus(): Promise<{ success: boolean; status?: BiometricStatus; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;

    const user = await User.findById(userId).select("preferences.biometricSettings preferences.appLockSettings").lean();
    if (!user) return { success: false, error: "User not found" };

    interface StoredBioCred {
      credentialId: string;
      publicKey: string;
      deviceName?: string;
      counter?: number;
      enrolledAt: Date;
    }
    const uPrefs = user as unknown as {
      preferences?: {
        biometricSettings?: BiometricStatus["biometricSettings"] & { 
          publicKey?: string; 
          credentialId?: string;
          credentials?: StoredBioCred[];
        };
        appLockSettings?: BiometricStatus["appLockSettings"];
      };
    };
    const bio = uPrefs?.preferences?.biometricSettings;
    const lock = uPrefs?.preferences?.appLockSettings;

    const deviceList = (bio?.credentials && bio.credentials.length > 0)
      ? bio.credentials.map((c) => ({
          credentialId: c.credentialId,
          deviceName: c.deviceName || "Registered Device",
          enrolledAt: c.enrolledAt || new Date(),
        }))
      : (bio?.credentialId ? [{
          credentialId: bio.credentialId,
          deviceName: "Primary Device",
          enrolledAt: new Date(),
        }] : []);

    const isBiometricEnrolled = Boolean(
      (bio?.credentials && bio.credentials.length > 0) ||
      (bio?.publicKey && bio?.credentialId)
    );

    return {
      success: true,
      status: {
        isBiometricEnrolled,
        biometricSettings: {
          isEnabled: bio?.isEnabled ?? isBiometricEnrolled,
          credentials: deviceList,
          requireForVault: bio?.requireForVault ?? true,
          requireForSections: bio?.requireForSections ?? true,
          requireForAppLock: bio?.requireForAppLock ?? true,
          allowPasswordFallback: bio?.allowPasswordFallback ?? true,
          strictSharedDeviceProtection: bio?.strictSharedDeviceProtection ?? false,
        },
        appLockSettings: {
          isEnabled: lock?.isEnabled ?? false,
          authMethod: lock?.authMethod || "password",
          timeoutMinutes: lock?.timeoutMinutes ?? 5,
          lockOnBackground: lock?.lockOnBackground ?? true,
          requireBiometricWithoutFallback: lock?.requireBiometricWithoutFallback ?? false,
          strictSharedDeviceMode: lock?.strictSharedDeviceMode ?? false,
          hasCustomPin: !!(lock as Record<string, unknown>)?.appLockPinHash,
        },
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * 1. Generate WebAuthn Registration Challenge
 */
export async function getBiometricRegistrationChallenge(): Promise<{
  success: boolean;
  challenge?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  error?: string;
}> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user || !user.email) return { success: false, error: "User not found" };

    const challenge = crypto.randomBytes(32).toString("base64url");
    const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Delete existing registration challenge
    await VerificationToken.deleteMany({
      email: user.email.toLowerCase().trim(),
      type: "webauthn_register_challenge" ,
    });

    await VerificationToken.create({
      email: user.email.toLowerCase().trim(),
      token: challenge,
      type: "webauthn_register_challenge" ,
      expires,
    });

    return {
      success: true,
      challenge,
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name || "Manageo User",
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * 2. Verify and enroll WebAuthn credential on server
 */
export async function verifyAndEnrollBiometrics(data: {
  credentialId: string;
  attestationObject: string;
  clientDataJSON: string;
  deviceName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.credentialId || !data.attestationObject || !data.clientDataJSON) {
      return { success: false, error: "Incomplete WebAuthn response data" };
    }

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user || !user.email) return { success: false, error: "User not found" };

    // Verify challenge
    const tokenRecord = await VerificationToken.findOne({
      email: user.email.toLowerCase().trim(),
      type: "webauthn_register_challenge" ,
      expires: { $gt: new Date() },
    });

    if (!tokenRecord) {
      return { success: false, error: "Registration session expired. Please try again." };
    }

    const clientDataStr = Buffer.from(data.clientDataJSON, "base64").toString("utf8");
    const clientData = JSON.parse(clientDataStr);

    if (clientData.type !== "webauthn.create") {
      return { success: false, error: "Invalid clientData type" };
    }

    if (clientData.challenge !== tokenRecord.token) {
      return { success: false, error: "Challenge mismatch during registration" };
    }

    // Parse attestation object and extract public key
    const attestationBuf = Buffer.from(data.attestationObject, "base64");
    const { publicKeyJwk, counter } = parseAttestationObject(attestationBuf);
    const pubKeyStr = JSON.stringify(publicKeyJwk);

    const existingCreds = user.preferences?.biometricSettings?.credentials || [];
    const credIndex = existingCreds.findIndex((c: { credentialId: string }) => c.credentialId === data.credentialId);
    
    const newCred = {
      credentialId: data.credentialId,
      publicKey: pubKeyStr,
      deviceName: data.deviceName || "Personal Device",
      counter: counter || 0,
      enrolledAt: new Date(),
    };

    const updatedCreds = [...existingCreds];
    if (credIndex >= 0) {
      updatedCreds[credIndex] = newCred;
    } else {
      updatedCreds.push(newCred);
    }

    // Save to User (supports both credentials array and legacy single fields)
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          "preferences.biometricSettings.isEnabled": true,
          "preferences.biometricSettings.credentialId": data.credentialId,
          "preferences.biometricSettings.publicKey": pubKeyStr,
          "preferences.biometricSettings.counter": counter || 0,
          "preferences.biometricSettings.enrolledAt": new Date(),
          "preferences.biometricSettings.credentials": updatedCreds,
          "preferences.biometricSettings.requireForVault": true,
          "preferences.biometricSettings.requireForSections": true,
          "preferences.biometricSettings.requireForAppLock": true,
          "preferences.biometricSettings.allowPasswordFallback": true,
        },
      }
    );

    // Clean up consumed token
    await VerificationToken.deleteOne({ _id: tokenRecord._id });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("verifyAndEnrollBiometrics error:", err);
    return { success: false, error: error.message || "Failed to enroll biometrics" };
  }
}

/**
 * 3. Generate WebAuthn Authentication Challenge for specific scope
 */
export async function getBiometricAuthChallenge(
  scope: "app_lock" | "vault" | "section" = "app_lock",
  _targetId?: string
): Promise<{
  success: boolean;
  challenge?: string;
  credentialId?: string;
  credentialIds?: string[];
  error?: string;
}> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;
    const user = await User.findById(userId).select("email preferences.biometricSettings");
    if (!user || !user.email) return { success: false, error: "User not found" };

    const bio = user.preferences?.biometricSettings;
    const credIds: string[] = (bio?.credentials && bio.credentials.length > 0)
      ? bio.credentials.map((c: { credentialId: string }) => c.credentialId)
      : (bio?.credentialId ? [bio.credentialId] : []);

    if (credIds.length === 0) {
      return { success: false, error: "Biometric authentication is not enrolled on this account" };
    }

    const challenge = crypto.randomBytes(32).toString("base64url");
    const expires = new Date(Date.now() + 2 * 60 * 1000);

    // Save challenge with scope
    await VerificationToken.deleteMany({
      email: `${user.email.toLowerCase().trim()}:${scope}`,
      type: "webauthn_auth_challenge" ,
    });

    await VerificationToken.create({
      email: `${user.email.toLowerCase().trim()}:${scope}`,
      token: challenge,
      type: "webauthn_auth_challenge" ,
      expires,
    });

    return {
      success: true,
      challenge,
      credentialId: credIds[0] || bio.credentialId,
      credentialIds: credIds,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * 4. Verify Biometric Assertion cryptographically on server
 */
export async function verifyBiometricAssertion(data: {
  authData: string;
  clientDataJSON: string;
  signature: string;
  scope: "app_lock" | "vault" | "section";
  targetId?: string; // e.g. sectionId or vaultItemId
  credentialId?: string;
}): Promise<{
  success: boolean;
  grantToken?: string;
  vaultKey?: string;
  error?: string;
}> {
  try {
    if (!data.authData || !data.clientDataJSON || !data.signature || !data.scope) {
      return { success: false, error: "Missing cryptographic assertion data" };
    }

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user || !user.email) return { success: false, error: "User not found" };

    const bio = user.preferences?.biometricSettings;
    const creds: Array<{ credentialId: string; publicKey: string; counter?: number }> = 
      (bio?.credentials && bio.credentials.length > 0)
        ? bio.credentials
        : (bio?.publicKey && bio?.credentialId ? [{ credentialId: bio.credentialId, publicKey: bio.publicKey, counter: bio.counter }] : []);

    if (creds.length === 0) {
      return { success: false, error: "No biometric public key enrolled" };
    }

    // Enforce feature-level biometric permissions
    if (data.scope === "vault" && bio.requireForVault === false) {
      return { success: false, error: "Biometric authentication is disabled for Vault in settings" };
    }
    if (data.scope === "app_lock" && bio.requireForAppLock === false) {
      return { success: false, error: "Biometric authentication is disabled for App Lock in settings" };
    }
    if (data.scope.startsWith("section") && bio.requireForSections === false) {
      return { success: false, error: "Biometric authentication is disabled for Sections in settings" };
    }

    // Vault server-side lockout check
    if (data.scope === "vault") {
      const vSettings = user.preferences?.vaultSettings;
      const now = new Date();
      if (vSettings?.lockedUntil && new Date(vSettings.lockedUntil) > now) {
        const remaining = Math.ceil((new Date(vSettings.lockedUntil).getTime() - now.getTime()) / 1000);
        return { success: false, error: `Vault account locked. Please wait ${remaining}s.` };
      }
    }

    // Target item ownership validation if scope is vault item
    if (data.scope === "vault" && data.targetId) {
      const { default: VaultItem } = await import("@/models/VaultItem");
      const vItem = await VaultItem.findOne({ _id: data.targetId, userId });
      if (!vItem) {
        return { success: false, error: "Vault item not found or access denied" };
      }
    }

    // Verify challenge
    const tokenRecord = await VerificationToken.findOne({
      email: `${user.email.toLowerCase().trim()}:${data.scope}`,
      type: "webauthn_auth_challenge" ,
      expires: { $gt: new Date() },
    });

    if (!tokenRecord) {
      return { success: false, error: "Authentication challenge expired or not found. Please try again." };
    }

    const clientDataStr = Buffer.from(data.clientDataJSON, "base64").toString("utf8");
    const clientData = JSON.parse(clientDataStr);

    if (clientData.type !== "webauthn.get") {
      return { success: false, error: "Invalid clientData type for authentication" };
    }

    if (clientData.challenge !== tokenRecord.token) {
      return { success: false, error: "Cryptographic challenge mismatch" };
    }

    const authDataBuf = Buffer.from(data.authData, "base64");
    const signatureBuf = Buffer.from(data.signature, "base64");

    // Origin validation
    if (process.env.NEXTAUTH_URL && clientData.origin) {
      try {
        const expectedHost = new URL(process.env.NEXTAUTH_URL).host;
        const clientHost = new URL(clientData.origin).host;
        if (expectedHost && clientHost && expectedHost !== clientHost) {
          return { success: false, error: "WebAuthn origin mismatch" };
        }
      } catch {
        // ignore malformed test URLs
      }
    }

    // AuthenticatorData flags verification (User Present: bit 0, User Verified: bit 2)
    // Note: The User Verified (UV) flag (bit 2) indicates that the platform authenticator verified
    // the user (via device biometric or platform PIN/passcode). Standard WebAuthn Level 2/3 does not
    // disclose whether the user used fingerprint, face, or device PIN. True suppression of device PIN
    // requires a native keystore bridge (window.ManageoNativeBiometrics) with BIOMETRIC_STRONG.
    const flags = authDataBuf[32];
    const userPresent = (flags & 0x01) !== 0;
    const userVerified = (flags & 0x04) !== 0;
    if (!userPresent) {
      return { success: false, error: "User presence verification failed" };
    }
    if (user.preferences?.appLockSettings?.requireBiometricWithoutFallback && !userVerified) {
      return { success: false, error: "User verification required. Authenticator only provided user presence." };
    }

    // Verify ECDSA signature against enrolled credentials
    let matchedCred = data.credentialId ? creds.find(c => c.credentialId === data.credentialId) : null;
    let isValid = false;

    if (matchedCred) {
      try {
        const pkJwk = JSON.parse(matchedCred.publicKey);
        isValid = verifyWebAuthnSignature(pkJwk, clientDataStr, authDataBuf, signatureBuf);
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      for (const c of creds) {
        try {
          const pkJwk = JSON.parse(c.publicKey);
          if (verifyWebAuthnSignature(pkJwk, clientDataStr, authDataBuf, signatureBuf)) {
            isValid = true;
            matchedCred = c;
            break;
          }
        } catch {
          // Continue searching
        }
      }
    }

    if (!isValid || !matchedCred) {
      return { success: false, error: "Biometric cryptographic signature verification failed" };
    }

    // Anti-replay signature counter verification
    const signCount = authDataBuf.readUInt32BE(33);
    const storedCounter = matchedCred.counter || 0;
    if (signCount > 0 && storedCounter > 0 && signCount <= storedCounter) {
      console.warn("Potential authenticator clone / replay detected. Counter did not advance.");
    }
    if (signCount > storedCounter) {
      await User.updateOne(
        { _id: userId, "preferences.biometricSettings.credentials.credentialId": matchedCred.credentialId },
        { 
          $set: { 
            "preferences.biometricSettings.credentials.$.counter": signCount,
            "preferences.biometricSettings.counter": signCount 
          } 
        }
      );
    }

    // Clean up consumed challenge
    await VerificationToken.deleteOne({ _id: tokenRecord._id });

    // Generate short-lived scoped grant token
    const fullScope = data.targetId ? `${data.scope}:${data.targetId}` : data.scope;
    const grantToken = signAuthGrant(userId, fullScope);

    // If scope is vault: return the deterministic vaultKey so client can decrypt in-memory
    let vaultKey: string | undefined;
    if (data.scope === "vault") {
      vaultKey = deriveVaultKey(userId);
    }

    return {
      success: true,
      grantToken,
      vaultKey,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("verifyBiometricAssertion error:", err);
    return { success: false, error: error.message || "Failed to verify biometrics" };
  }
}

/**
 * 5. Verify Account Password for App Lock fallback
 */
export async function verifyAccountPasswordForAppLock(password: string): Promise<{
  success: boolean;
  grantToken?: string;
  error?: string;
}> {
  try {
    if (!password) return { success: false, error: "Password is required" };

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;
    const user = await User.findById(userId).select("passwordHash preferences.appLockSettings");
    if (!user) {
      return { success: false, error: "Account not found" };
    }

    // Strict biometric check: if user configured strict biometric without password fallback
    if (user.preferences?.appLockSettings?.requireBiometricWithoutFallback) {
      return { success: false, error: "Account policy strictly requires biometric verification." };
    }

    const pinHash = (user.preferences?.appLockSettings as Record<string, unknown>)?.appLockPinHash as string | undefined;
    let isValid = false;

    // Check custom App Lock PIN if configured
    if (pinHash) {
      isValid = await bcrypt.compare(password, pinHash);
    }

    // Also verify against main account password
    if (!isValid && user.passwordHash) {
      isValid = await bcrypt.compare(password, user.passwordHash);
    }

    if (!isValid) {
      return { 
        success: false, 
        error: pinHash ? "Incorrect App passcode or account password." : "Incorrect Manageo account password." 
      };
    }

    const grantToken = signAuthGrant(userId, "app_lock");
    return { success: true, grantToken };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * 6. Remove Specific Biometric Credential for a device
 */
export async function removeSpecificBiometricCredential(credentialId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found" };

    interface BioCredItem { credentialId: string; publicKey: string; counter?: number; deviceName?: string; enrolledAt: Date; }
    const existingCreds: BioCredItem[] = user.preferences?.biometricSettings?.credentials || [];
    const remaining = existingCreds.filter(c => c.credentialId !== credentialId);
    const isStillEnabled = remaining.length > 0;
    const topCred = remaining[0] || null;

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          "preferences.biometricSettings.credentials": remaining,
          "preferences.biometricSettings.isEnabled": isStillEnabled,
          "preferences.biometricSettings.credentialId": topCred ? topCred.credentialId : null,
          "preferences.biometricSettings.publicKey": topCred ? topCred.publicKey : null,
          "preferences.biometricSettings.counter": topCred ? (topCred.counter || 0) : 0,
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

/**
 * 7. Remove All Biometric Credentials
 */
export async function removeBiometricCredential(): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    const userId = session.user.id;

    await User.updateOne(
      { _id: userId },
      {
        $unset: {
          "preferences.biometricSettings.publicKey": 1,
          "preferences.biometricSettings.credentialId": 1,
          "preferences.biometricSettings.counter": 1,
          "preferences.biometricSettings.enrolledAt": 1,
          "preferences.biometricSettings.credentials": 1,
        },
        $set: {
          "preferences.biometricSettings.isEnabled": false,
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

/**
 * 7. Update Biometric Configuration Settings
 */
export async function updateBiometricSettings(settings: {
  isEnabled?: boolean;
  requireForVault?: boolean;
  requireForSections?: boolean;
  requireForAppLock?: boolean;
  allowPasswordFallback?: boolean;
  strictSharedDeviceProtection?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    const userId = session.user.id;

    const updateObj: Record<string, unknown> = {};
    if (settings.isEnabled !== undefined) updateObj["preferences.biometricSettings.isEnabled"] = settings.isEnabled;
    if (settings.requireForVault !== undefined) updateObj["preferences.biometricSettings.requireForVault"] = settings.requireForVault;
    if (settings.requireForSections !== undefined) updateObj["preferences.biometricSettings.requireForSections"] = settings.requireForSections;
    if (settings.requireForAppLock !== undefined) updateObj["preferences.biometricSettings.requireForAppLock"] = settings.requireForAppLock;
    if (settings.allowPasswordFallback !== undefined) updateObj["preferences.biometricSettings.allowPasswordFallback"] = settings.allowPasswordFallback;
    if (settings.strictSharedDeviceProtection !== undefined) updateObj["preferences.biometricSettings.strictSharedDeviceProtection"] = settings.strictSharedDeviceProtection;

    await User.updateOne({ _id: userId }, { $set: updateObj });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * 8. Update App Lock Configuration Settings
 */
export async function updateAppLockSettings(settings: {
  isEnabled?: boolean;
  authMethod?: "password" | "biometric" | "both";
  timeoutMinutes?: number;
  lockOnBackground?: boolean;
  requireBiometricWithoutFallback?: boolean;
  strictSharedDeviceMode?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    const userId = session.user.id;

    const updateObj: Record<string, unknown> = {};
    if (settings.isEnabled !== undefined) updateObj["preferences.appLockSettings.isEnabled"] = settings.isEnabled;
    if (settings.authMethod !== undefined) updateObj["preferences.appLockSettings.authMethod"] = settings.authMethod;
    if (settings.timeoutMinutes !== undefined) updateObj["preferences.appLockSettings.timeoutMinutes"] = settings.timeoutMinutes;
    if (settings.lockOnBackground !== undefined) updateObj["preferences.appLockSettings.lockOnBackground"] = settings.lockOnBackground;
    if (settings.requireBiometricWithoutFallback !== undefined) updateObj["preferences.appLockSettings.requireBiometricWithoutFallback"] = settings.requireBiometricWithoutFallback;
    if (settings.strictSharedDeviceMode !== undefined) updateObj["preferences.appLockSettings.strictSharedDeviceMode"] = settings.strictSharedDeviceMode;

    await User.updateOne({ _id: userId }, { $set: updateObj });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * 9. Set Dedicated App Lock Passcode / PIN
 */
export async function setAppLockPin(pin: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!pin || pin.trim().length < 4) {
      return { success: false, error: "App Lock passcode must be at least 4 characters" };
    }

    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    const userId = session.user.id;

    const hash = await bcrypt.hash(pin.trim(), 10);
    await User.updateOne(
      { _id: userId },
      { $set: { "preferences.appLockSettings.appLockPinHash": hash } }
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * 10. Remove Dedicated App Lock Passcode / PIN (reverts to account password)
 */
export async function removeAppLockPin(): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };
    const userId = session.user.id;

    await User.updateOne(
      { _id: userId },
      { $set: { "preferences.appLockSettings.appLockPinHash": null } }
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}
