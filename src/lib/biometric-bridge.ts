"use client";

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
 * Register device biometric authenticator using WebAuthn create or native bridge
 */
export async function registerBiometricCredential(options: {
  challenge: string;
  userId: string;
  userEmail: string;
  userName: string;
}): Promise<{
  success: boolean;
  credentialId?: string;
  attestationObject?: string;
  clientDataJSON?: string;
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
    const challengeBuf = Uint8Array.from(atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
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
    const attestationObject = btoa(String.fromCharCode(...new Uint8Array(rawResponse.attestationObject)));
    const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(rawResponse.clientDataJSON)));

    return {
      success: true,
      credentialId: credential.id,
      attestationObject,
      clientDataJSON,
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
 * Authenticate with biometric authenticator using WebAuthn get
 */
export async function authenticateWithBiometrics(options: {
  challenge: string;
  credentialId?: string;
}): Promise<{
  success: boolean;
  authData?: string;
  clientDataJSON?: string;
  signature?: string;
  error?: string;
}> {
  if (typeof window === "undefined") return { success: false, error: "Window undefined" };

  try {
    const challengeBuf = Uint8Array.from(
      atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (options.credentialId) {
      try {
        const idBuf = Uint8Array.from(
          atob(options.credentialId.replace(/-/g, "+").replace(/_/g, "/")),
          (c) => c.charCodeAt(0)
        );
        allowCredentials.push({
          id: idBuf,
          type: "public-key",
          transports: ["internal"],
        });
      } catch {
        // Continue with empty allowCredentials
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
    const authData = btoa(String.fromCharCode(...new Uint8Array(rawResp.authenticatorData)));
    const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(rawResp.clientDataJSON)));
    const signature = btoa(String.fromCharCode(...new Uint8Array(rawResp.signature)));

    return {
      success: true,
      authData,
      clientDataJSON,
      signature,
    };
  } catch (err: unknown) {
    const error = err as Error;
    if (error?.name === "NotAllowedError") {
      return { success: false, error: "Biometric authentication was cancelled." };
    }
    return { success: false, error: error?.message || "Biometric verification failed." };
  }
}
