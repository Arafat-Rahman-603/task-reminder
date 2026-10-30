"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getSectionSecurityStatus,
  verifySectionLockPassword,
  toggleSectionLock as serverToggleLock,
  setupSectionLockPassword as serverSetupPassword,
  unlockSectionWithBiometrics as serverUnlockBiometrics,
} from "@/actions/sectionLock.actions";
import { getBiometricAuthChallenge } from "@/actions/biometric.actions";
import { authenticateWithBiometrics, detectBiometricCapabilities } from "@/lib/biometric-bridge";

interface SectionSecurityContextType {
  isInitialized: boolean;
  lockedSections: string[];
  unlockedSections: Set<string>;
  loading: boolean;
  userEmail?: string;
  isBiometricAvailable: boolean;
  isSectionLocked: (sectionId: string) => boolean;
  unlockSection: (sectionId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  unlockSectionWithBiometricsAction: (sectionId: string) => Promise<{ success: boolean; error?: string }>;
  lockSection: (sectionId: string) => void;
  toggleLock: (sectionId: string, shouldLock: boolean, password: string) => Promise<{ success: boolean; error?: string }>;
  setupPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  refreshStatus: () => Promise<void>;
  markUnlocked: (sectionId: string) => void;
}

const SectionSecurityContext = createContext<SectionSecurityContextType | null>(null);

const STORAGE_KEY = "manageo_unlocked_sections";

export function SectionSecurityProvider({
  children,
  initialLockedSections = [],
  initialIsInitialized = false,
}: {
  children: React.ReactNode;
  initialLockedSections?: string[];
  initialIsInitialized?: boolean;
}) {
  const [isInitialized, setIsInitialized] = useState(initialIsInitialized);
  const [lockedSections, setLockedSections] = useState<string[]>(initialLockedSections);
  const [unlockedSections, setUnlockedSections] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return new Set(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
    return new Set();
  });
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  // Detect client biometric availability
  useEffect(() => {
    detectBiometricCapabilities().then((cap) => {
      setIsBiometricAvailable(cap.supported);
    }).catch(() => {
      setIsBiometricAvailable(false);
    });
  }, []);



  const refreshStatus = useCallback(async () => {
    try {
      const res = await getSectionSecurityStatus();
      if (res.success) {
        setIsInitialized(res.isInitialized);
        setLockedSections(res.lockedSections);
        setUserEmail(res.userEmail);
      }
    } catch (err) {
      console.error("Failed to load section security status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      if (!ignore) {
        void refreshStatus();
      }
    }, 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [refreshStatus]);

  const markUnlocked = useCallback((sectionId: string) => {
    setUnlockedSections((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const isSectionLocked = useCallback(
    (sectionId: string) => {
      if (!isInitialized) return false;
      if (!lockedSections.includes(sectionId)) return false;
      return !unlockedSections.has(sectionId);
    },
    [isInitialized, lockedSections, unlockedSections]
  );

  const unlockSection = async (sectionId: string, password: string) => {
    const res = await verifySectionLockPassword(password);
    if (res.success) {
      markUnlocked(sectionId);
      return { success: true };
    }
    return { success: false, error: res.error || "Incorrect password" };
  };

  const unlockSectionWithBiometricsAction = async (sectionId: string) => {
    try {
      const challengeRes = await getBiometricAuthChallenge("section", sectionId);
      if (!challengeRes.success || !challengeRes.challenge) {
        return { success: false, error: challengeRes.error || "Biometrics not enrolled" };
      }

      const clientAssertion = await authenticateWithBiometrics({
        challenge: challengeRes.challenge,
        credentialId: challengeRes.credentialId,
        credentialIds: challengeRes.credentialIds,
      });

      if (!clientAssertion.success || !clientAssertion.authData || !clientAssertion.signature) {
        return { success: false, error: clientAssertion.error || "Biometric authentication cancelled" };
      }

      const serverRes = await serverUnlockBiometrics(sectionId, {
        authData: clientAssertion.authData,
        clientDataJSON: clientAssertion.clientDataJSON || "",
        signature: clientAssertion.signature,
        credentialId: clientAssertion.credentialId,
      });

      if (serverRes.success) {
        markUnlocked(sectionId);
        return { success: true };
      }

      return { success: false, error: serverRes.error || "Biometric unlock failed" };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Biometric unlock failed" };
    }
  };

  const lockSection = useCallback((sectionId: string) => {
    setUnlockedSections((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const toggleLock = async (sectionId: string, shouldLock: boolean, password: string) => {
    const res = await serverToggleLock(sectionId, shouldLock, password);
    if (res.success && res.lockedSections) {
      setLockedSections(res.lockedSections);
      // Immediately clear unlocked state from session and memory
      lockSection(sectionId);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const setupPassword = async (password: string) => {
    const res = await serverSetupPassword(password);
    if (res.success) {
      setIsInitialized(true);
      await refreshStatus();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  return (
    <SectionSecurityContext.Provider
      value={{
        isInitialized,
        lockedSections,
        unlockedSections,
        loading,
        userEmail,
        isBiometricAvailable,
        isSectionLocked,
        unlockSection,
        unlockSectionWithBiometricsAction,
        lockSection,
        toggleLock,
        setupPassword,
        refreshStatus,
        markUnlocked,
      }}
    >
      {children}
    </SectionSecurityContext.Provider>
  );
}

export function useSectionSecurity() {
  const ctx = useContext(SectionSecurityContext);
  if (!ctx) {
    throw new Error("useSectionSecurity must be used within a SectionSecurityProvider");
  }
  return ctx;
}
