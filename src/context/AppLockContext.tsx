"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import {
  getAppLockAndBiometricStatus,
  getBiometricAuthChallenge,
  verifyBiometricAssertion,
  verifyAccountPasswordForAppLock,
  updateAppLockSettings as serverUpdateAppLockSettings,
  updateBiometricSettings as serverUpdateBiometricSettings,
} from "@/actions/biometric.actions";
import { authenticateWithBiometrics, detectBiometricCapabilities } from "@/lib/biometric-bridge";

export interface AppLockSettings {
  isEnabled: boolean;
  authMethod: "password" | "biometric" | "both";
  timeoutMinutes: number;
  lockOnBackground: boolean;
  requireBiometricWithoutFallback?: boolean;
  strictSharedDeviceMode?: boolean;
}

export interface BiometricConfig {
  isEnabled: boolean;
  requireForVault: boolean;
  requireForSections: boolean;
  requireForAppLock: boolean;
  allowPasswordFallback: boolean;
  strictSharedDeviceProtection: boolean;
}

interface AppLockContextType {
  isLocked: boolean;
  isInitialized: boolean;
  isAuthenticating: boolean;
  appLockSettings: AppLockSettings;
  biometricSettings: BiometricConfig;
  isBiometricEnrolled: boolean;
  isDeviceBiometricSupported: boolean;
  lockApp: () => void;
  unlockWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  unlockWithPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateAppLock: (settings: Partial<AppLockSettings>) => Promise<{ success: boolean; error?: string }>;
  updateBiometrics: (settings: Partial<BiometricConfig>) => Promise<{ success: boolean; error?: string }>;
  refreshLockStatus: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType | null>(null);

const SESSION_UNLOCKED_KEY = "manageo_app_unlocked_time";

export function AppLockProvider({
  children,
  initialSettings,
  initialBiometric,
  initialIsEnrolled = false,
}: {
  children: React.ReactNode;
  initialSettings?: AppLockSettings;
  initialBiometric?: BiometricConfig;
  initialIsEnrolled?: boolean;
}) {
  const [appLockSettings, setAppLockSettings] = useState<AppLockSettings>(
    initialSettings || {
      isEnabled: false,
      authMethod: "password",
      timeoutMinutes: 5,
      lockOnBackground: true,
      requireBiometricWithoutFallback: false,
      strictSharedDeviceMode: false,
    }
  );

  const [biometricSettings, setBiometricSettings] = useState<BiometricConfig>(
    initialBiometric || {
      isEnabled: false,
      requireForVault: true,
      requireForSections: true,
      requireForAppLock: true,
      allowPasswordFallback: true,
      strictSharedDeviceProtection: false,
    }
  );

  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(initialIsEnrolled);
  const [isDeviceBiometricSupported, setIsDeviceBiometricSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Critical flag to prevent WebAuthn OS prompt from triggering window blur re-lock loops
  const isAuthenticatingRef = useRef(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const lastActiveRef = useRef<number>(0);
  const backgroundTimeRef = useRef<number | null>(null);

  // Detect platform biometric capability
  useEffect(() => {
    detectBiometricCapabilities().then((cap) => {
      setIsDeviceBiometricSupported(cap.supported);
    }).catch(() => {
      setIsDeviceBiometricSupported(false);
    });
  }, []);

  // Sync settings on mount
  const refreshLockStatus = useCallback(async () => {
    try {
      const res = await getAppLockAndBiometricStatus();
      if (res.success && res.status) {
        setIsBiometricEnrolled(res.status.isBiometricEnrolled);
        if (res.status.appLockSettings) {
          setAppLockSettings(res.status.appLockSettings);
        }
        if (res.status.biometricSettings) {
          setBiometricSettings(res.status.biometricSettings);
        }

        // Evaluate lock on cold load if enabled
        if (res.status.appLockSettings?.isEnabled) {
          const lastUnlock = sessionStorage.getItem(SESSION_UNLOCKED_KEY);
          if (!lastUnlock) {
            setIsLocked(true);
          } else {
            const timeSinceUnlock = Date.now() - parseInt(lastUnlock, 10);
            const maxIdleMs = (res.status.appLockSettings.timeoutMinutes || 5) * 60 * 1000;
            if (res.status.appLockSettings.timeoutMinutes === 0 || timeSinceUnlock > maxIdleMs) {
              setIsLocked(true);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch lock status:", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      if (!ignore) {
        void refreshLockStatus();
      }
    }, 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [refreshLockStatus]);

  const lockApp = useCallback(() => {
    if (!appLockSettings.isEnabled) return;
    setIsLocked(true);
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
  }, [appLockSettings.isEnabled]);

  // Activity tracker for inactivity timeout
  useEffect(() => {
    if (!appLockSettings.isEnabled || isLocked) return;

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const handleActivity = () => {
      const now = Date.now();
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          lastActiveRef.current = now;
          sessionStorage.setItem(SESSION_UNLOCKED_KEY, now.toString());
          throttleTimer = null;
        }, 3000);
      }
    };

    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Inactivity interval check
    const checkInterval = setInterval(() => {
      if (isAuthenticatingRef.current || isLocked) return;
      if (appLockSettings.timeoutMinutes > 0) {
        const idleMs = Date.now() - lastActiveRef.current;
        const maxMs = appLockSettings.timeoutMinutes * 60 * 1000;
        if (idleMs >= maxMs) {
          setIsLocked(true);
          sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearInterval(checkInterval);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [appLockSettings.isEnabled, appLockSettings.timeoutMinutes, isLocked]);

  // Background / Visibility change listener
  useEffect(() => {
    if (!appLockSettings.isEnabled) return;

    const handleVisibilityChange = () => {
      if (isAuthenticatingRef.current) return;

      if (document.visibilityState === "hidden") {
        backgroundTimeRef.current = Date.now();
        if (appLockSettings.lockOnBackground || appLockSettings.timeoutMinutes === 0) {
          setIsLocked(true);
          sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
        }
      } else if (document.visibilityState === "visible") {
        if (backgroundTimeRef.current) {
          const elapsed = Date.now() - backgroundTimeRef.current;
          const maxMs = (appLockSettings.timeoutMinutes || 5) * 60 * 1000;
          if (appLockSettings.lockOnBackground || elapsed >= maxMs) {
            setIsLocked(true);
            sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
          }
          backgroundTimeRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [appLockSettings.isEnabled, appLockSettings.lockOnBackground, appLockSettings.timeoutMinutes]);

  const unlockWithBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    isAuthenticatingRef.current = true;
    setIsAuthenticating(true);
    try {
      const challengeRes = await getBiometricAuthChallenge("app_lock");
      if (!challengeRes.success || !challengeRes.challenge) {
        return { success: false, error: challengeRes.error || "Biometrics not enrolled" };
      }

      const clientAssertion = await authenticateWithBiometrics({
        challenge: challengeRes.challenge,
        credentialId: challengeRes.credentialId,
      });

      if (!clientAssertion.success || !clientAssertion.authData || !clientAssertion.signature) {
        return { success: false, error: clientAssertion.error || "Biometric authentication cancelled" };
      }

      const serverRes = await verifyBiometricAssertion({
        authData: clientAssertion.authData,
        clientDataJSON: clientAssertion.clientDataJSON || "",
        signature: clientAssertion.signature,
        scope: "app_lock",
      });

      if (serverRes.success) {
        const now = Date.now();
        lastActiveRef.current = now;
        sessionStorage.setItem(SESSION_UNLOCKED_KEY, now.toString());
        setIsLocked(false);
        return { success: true };
      }

      return { success: false, error: serverRes.error || "Biometric verification failed" };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Biometric unlock failed" };
    } finally {
      // Small timeout to let OS window focus settle before clearing isAuthenticating
      setTimeout(() => {
        isAuthenticatingRef.current = false;
        setIsAuthenticating(false);
      }, 500);
    }
  };

  const unlockWithPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await verifyAccountPasswordForAppLock(password);
      if (res.success) {
        const now = Date.now();
        lastActiveRef.current = now;
        sessionStorage.setItem(SESSION_UNLOCKED_KEY, now.toString());
        setIsLocked(false);
        return { success: true };
      }
      return { success: false, error: res.error || "Incorrect password" };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to verify password" };
    }
  };

  const updateAppLock = async (settings: Partial<AppLockSettings>) => {
    const res = await serverUpdateAppLockSettings(settings);
    if (res.success) {
      setAppLockSettings((prev) => ({ ...prev, ...settings }));
      if (settings.isEnabled === false) {
        setIsLocked(false);
      }
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const updateBiometrics = async (settings: Partial<BiometricConfig>) => {
    const res = await serverUpdateBiometricSettings(settings);
    if (res.success) {
      setBiometricSettings((prev) => ({ ...prev, ...settings }));
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  return (
    <AppLockContext.Provider
      value={{
        isLocked,
        isInitialized,
        isAuthenticating,
        appLockSettings,
        biometricSettings,
        isBiometricEnrolled,
        isDeviceBiometricSupported,
        lockApp,
        unlockWithBiometrics,
        unlockWithPassword,
        updateAppLock,
        updateBiometrics,
        refreshLockStatus,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) {
    throw new Error("useAppLock must be used within an AppLockProvider");
  }
  return ctx;
}
