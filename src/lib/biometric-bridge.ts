"use client";

export function getDeviceName(): string {
  if (typeof navigator === "undefined") return "Personal Device";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android Device";
  if (/iPad|iPhone|iPod/.test(ua)) return "iPhone / iPad";
  if (/Macintosh|Mac OS X/.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux PC";
  return "Personal Device";
}

/**
 * Biometric Bridge Interface for Manageo.
 * Supports both WebAuthn Level 2/3 Platform Authenticators (Touch ID, Face ID, Windows Hello, Android Biometrics)
 * and optional Native Application Biometric Bridges (Capacitor / Android BiometricPrompt BIOMETRIC_STRONG / iOS LocalAuthentication).
 */

declare global {
  interface Window {
    ManageoNativeBiometrics?: {
      isAvailable: () => Promise<{ available: boolean; biometryType: string; strictBiometricOnly: boolean }>;
      authenticate: (options: { reason: string; allowDeviceCredential: boolean }) => Promise<{ success: boolean; signature?: string; error?: string }>;
      enroll: () => Promise<{ success: boolean; publicKey: string; credentialId: string }>;
    };
  }
}

export interface BiometricCapabilities {
  supported: boolean;
  isNative: boolean;
  biometryType: string;
  canEnforceStrictBiometricWithoutPIN: boolean;
  authenticatorName: string;
}

/**
 * Detect client biometric capabilities honestly without false claims.
 */
export async function detectBiometricCapabilities(): Promise<BiometricCapabilities> {
  if (typeof window === "undefined") {
    return {
      supported: false,
      isNative: false,
      biometryType: "none",
      canEnforceStrictBiometricWithoutPIN: false,
      authenticatorName: "None",
    };
  }

  // 1. Check Native Bridge if running inside installed native wrapper
  if (window.ManageoNativeBiometrics && typeof window.ManageoNativeBiometrics.isAvailable === "function") {
    try {
      const nativeInfo = await window.ManageoNativeBiometrics.isAvailable();
      if (nativeInfo.available) {
        return {
          supported: true,
          isNative: true,
          biometryType: nativeInfo.biometryType || "Biometrics",
          canEnforceStrictBiometricWithoutPIN: !!nativeInfo.strictBiometricOnly,
          authenticatorName: "Native Hardware Keystore",
        };
      }
    } catch (e) {
      console.warn("Native biometric detection error, falling back to WebAuthn", e);
    }
  }

  // 2. Check Standard WebAuthn Platform Authenticator
  if (
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
  ) {
    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return {
        supported: available,
        isNative: false,
        biometryType: "Platform Authenticator (Touch ID, Face ID, Windows Hello, Android)",
        // In standard WebAuthn, OS may fall back to device passcode/PIN unless native wrapper enforces BIOMETRIC_STRONG
        canEnforceStrictBiometricWithoutPIN: false,
        authenticatorName: "WebAuthn Platform Authenticator",
      };
    } catch {
      return {
        supported: false,
        isNative: false,
        biometryType: "none",
        canEnforceStrictBiometricWithoutPIN: false,
        authenticatorName: "Unsupported",
      };
    }
  }

  return {
    supported: false,
    isNative: false,
    biometryType: "none",
    canEnforceStrictBiometricWithoutPIN: false,
    authenticatorName: "Not Supported",
  };
}

/**
 * Decode a base64 or base64url string (with optional missing padding) into a Uint8Array<ArrayBuffer>.
 */
function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const normalized = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(paddingLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Chunk-safe conversion from Uint8Array to standard base64 string.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Register device biometric authenticator using WebAuthn create or native bridge
 */
export async function registerBiometricCredential(options: {
  challenge: string;
  userId: string;
  userEmail: string;
  userName: string;
  deviceName?: string;
}): Promise<{
  success: boolean;
  credentialId?: string;
  attestationObject?: string;
  clientDataJSON?: string;
  deviceName?: string;
  error?: string;
}> {
  if (typeof window === "undefined") return { success: false, error: "Window undefined" };

  // Native bridge check
  if (window.ManageoNativeBiometrics?.enroll) {
    try {
      const res = await window.ManageoNativeBiometrics.enroll();
      return {
        success: res.success,
        credentialId: res.credentialId,
      };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : "Enrollment failed" };
    }
  }

  // Standard WebAuthn creation
  try {
    const challengeBuf = base64UrlToUint8Array(options.challenge);
    const userIdBuf = new TextEncoder().encode(options.userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challengeBuf,
        rp: {
          name: "Manageo Security",
          id: window.location.hostname,
        },
        user: {
          id: userIdBuf,
          name: options.userEmail,
          displayName: options.userName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential;

    if (!credential) return { success: false, error: "No credential returned" };

    const rawResponse = credential.response as AuthenticatorAttestationResponse;
    const attestationObject = uint8ArrayToBase64(new Uint8Array(rawResponse.attestationObject));
    const clientDataJSON = uint8ArrayToBase64(new Uint8Array(rawResponse.clientDataJSON));

    return {
      success: true,
      credentialId: credential.id,
      attestationObject,
      clientDataJSON,
      deviceName: options.deviceName || getDeviceName(),
    };
  } catch (err: unknown) {
    const error = err as Error;
    if (error?.name === "NotAllowedError") {
      return { success: false, error: "Biometric registration was cancelled or timed out." };
    }
    return { success: false, error: error?.message || "Failed to register biometrics." };
  }
}

/**
 * Authenticate with biometric authenticator (or OS phone screen-lock fallback) using WebAuthn get
 */
export async function authenticateWithBiometrics(options: {
  challenge: string;
  credentialId?: string;
  credentialIds?: string[];
}): Promise<{
  success: boolean;
  cancelled?: boolean;
  credentialId?: string;
  authData?: string;
  clientDataJSON?: string;
  signature?: string;
  error?: string;
}> {
  if (typeof window === "undefined") return { success: false, error: "Window undefined" };

  if (window.ManageoNativeBiometrics?.authenticate) {
    try {
      const nativeRes = await window.ManageoNativeBiometrics.authenticate({
        reason: "Authenticate to unlock Manageo",
        allowDeviceCredential: true,
      });
      if (!nativeRes.success) {
        const msg = nativeRes.error || "Biometric authentication failed.";
        return {
          success: false,
          cancelled: msg.toLowerCase().includes("cancel"),
          error: msg,
        };
      }
      if (nativeRes.signature) {
        return {
          success: true,
          signature: nativeRes.signature,
        };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Biometric verification failed.";
      return {
        success: false,
        cancelled: msg.toLowerCase().includes("cancel"),
        error: msg,
      };
    }
  }

  try {
    const challengeBuf = base64UrlToUint8Array(options.challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    const credList = options.credentialIds && options.credentialIds.length > 0
      ? options.credentialIds
      : (options.credentialId ? [options.credentialId] : []);

    for (const cId of credList) {
      try {
        const idBuf = base64UrlToUint8Array(cId);
        allowCredentials.push({
          id: idBuf,
          type: "public-key",
        });
      } catch {
        // Skip invalid credential ID format
      }
    }

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: challengeBuf,
        rpId: window.location.hostname,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: "required",
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (!assertion) return { success: false, error: "Authentication failed" };

    const rawResp = assertion.response as AuthenticatorAssertionResponse;
    const authData = uint8ArrayToBase64(new Uint8Array(rawResp.authenticatorData));
    const clientDataJSON = uint8ArrayToBase64(new Uint8Array(rawResp.clientDataJSON));
    const signature = uint8ArrayToBase64(new Uint8Array(rawResp.signature));

    return {
      success: true,
      credentialId: assertion.id,
      authData,
      clientDataJSON,
      signature,
    };
  } catch (err: unknown) {
    const error = err as Error;
    if (error?.name === "NotAllowedError" || error?.name === "AbortError") {
      return { success: false, cancelled: true, error: "Biometric authentication was cancelled." };
    }
    return { success: false, error: error?.message || "Biometric verification failed." };
  }
}
