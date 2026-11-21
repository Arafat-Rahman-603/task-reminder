"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  getSectionSecurityStatus,
  verifySectionLockPassword,
  toggleSectionLock as serverToggleLock,
  setupSectionLockPassword as serverSetupPassword,
  unlockSectionWithBiometrics as serverUnlockBiometrics,
  updateSectionLockConfig as serverUpdateSectionLockConfig,
  SectionLockConfig,
} from "@/actions/sectionLock.actions";
import { getBiometricAuthChallenge } from "@/actions/biometric.actions";
import { authenticateWithBiometrics, detectBiometricCapabilities } from "@/lib/biometric-bridge";
import { useAppLockOptional } from "./AppLockContext";

export type { SectionLockConfig };

export const DEFAULT_SECTION_CONFIG: SectionLockConfig = {
  biometricEnabled: true,
  autoPromptBiometric: false,
  lockOnBackground: false,
  timeoutMinutes: 0,
};

interface SectionSecurityContextType {
  isInitialized: boolean;
  lockedSections: string[];
  lockedSectionsSet: ReadonlySet<string>;
  unlockedSections: Set<string>;
  loading: boolean;
  userEmail?: string;
  isBiometricAvailable: boolean;
  strictSharedDeviceProtection: boolean;
  sectionConfigs: Record<string, SectionLockConfig>;
  getSectionConfig: (sectionId: string) => SectionLockConfig;
  updateSectionConfig: (
    sectionId: string,
    config: Partial<SectionLockConfig>,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  isSectionLocked: (sectionId: string) => boolean;
  unlockSection: (sectionId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  unlockSectionWithBiometricsAction: (
    sectionId: string
  ) => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  lockSection: (sectionId: string) => void;
  toggleLock: (sectionId: string, shouldLock: boolean, password: string) => Promise<{ success: boolean; error?: string }>;
  setupPassword: (password: string, accountPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshStatus: () => Promise<void>;
  markUnlocked: (sectionId: string) => void;
}

const SectionSecurityContext = createContext<SectionSecurityContextType | null>(null);

const STORAGE_KEY = "manageo_unlocked_sections";
const STORAGE_TIMESTAMPS_KEY = "manageo_unlocked_section_times";

function saveUnlockedStorage(sections: Set<string>, timestamps: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(sections)));
    sessionStorage.setItem(STORAGE_TIMESTAMPS_KEY, JSON.stringify(timestamps));
  } catch {
    // ignore storage errors
  }
}

export function SectionSecurityProvider({
  children,
  initialLockedSections = [],
  initialIsInitialized = false,
  initialSectionConfigs = {},
  initialUserEmail,
  initialStrictSharedDeviceProtection = false,
  skipInitialFetch = false,
}: {
  children: React.ReactNode;
  initialLockedSections?: string[];
  initialIsInitialized?: boolean;
  initialSectionConfigs?: Record<string, SectionLockConfig>;
  initialUserEmail?: string;
  initialStrictSharedDeviceProtection?: boolean;
  skipInitialFetch?: boolean;
}) {
  const { isBiometricEnrolled, biometricSettings } = useAppLockOptional();

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
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [userEmail, setUserEmail] = useState<string | undefined>(initialUserEmail);
  const [isDeviceBiometricSupported, setIsDeviceBiometricSupported] = useState(false);
  const [strictSharedDeviceProtection, setStrictSharedDeviceProtection] = useState(initialStrictSharedDeviceProtection);
  const [sectionConfigs, setSectionConfigs] = useState<Record<string, SectionLockConfig>>(initialSectionConfigs);

  const unlockedTimestampsRef = useRef<Record<string, number>>({});
  const isAuthenticatingRef = useRef(false);

  const lockedSectionsSet = useMemo(() => new Set(lockedSections), [lockedSections]);

  // Detect client biometric availability
  useEffect(() => {
    detectBiometricCapabilities()
      .then((cap) => {
        setIsDeviceBiometricSupported(cap.supported);
      })
      .catch(() => {
        setIsDeviceBiometricSupported(false);
      });
  }, []);

  // Hydrate persisted unlock timestamps & immediately expire stale timed sections on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === "undefined") return;
      try {
        const rawTimes = sessionStorage.getItem(STORAGE_TIMESTAMPS_KEY);
        const parsedTimes = rawTimes ? (JSON.parse(rawTimes) as Record<string, number>) : {};
        unlockedTimestampsRef.current = parsedTimes && typeof parsedTimes === "object" ? parsedTimes : {};

        setUnlockedSections((prev) => {
          if (prev.size === 0) return prev;
          const now = Date.now();
          const next = new Set(prev);
          let changed = false;
          for (const secId of Array.from(prev)) {
            const cfg = sectionConfigs[secId] || DEFAULT_SECTION_CONFIG;
            const lastTs = unlockedTimestampsRef.current[secId];
            if (cfg.timeoutMinutes > 0 && lastTs && now - lastTs >= cfg.timeoutMinutes * 60_000) {
              next.delete(secId);
              delete unlockedTimestampsRef.current[secId];
              changed = true;
            } else if (!lastTs) {
              unlockedTimestampsRef.current[secId] = now;
            }
          }
          if (changed) {
            saveUnlockedStorage(next, unlockedTimestampsRef.current);
            return next;
          }
          return prev;
        });
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [sectionConfigs]);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await getSectionSecurityStatus();
      if (res.success) {
        setIsInitialized(res.isInitialized);
        setLockedSections(res.lockedSections);
        if (res.sectionConfigs) {
          setSectionConfigs(res.sectionConfigs);
        }
        setUserEmail(res.userEmail);
        setStrictSharedDeviceProtection(Boolean(res.strictSharedDeviceProtection));
      }
    } catch (err) {
      console.error("Failed to load section security status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSectionConfig = useCallback(
    (sectionId: string): SectionLockConfig => {
      return {
        ...DEFAULT_SECTION_CONFIG,
        ...(sectionConfigs[sectionId] || {}),
      };
    },
    [sectionConfigs]
  );

  const updateSectionConfig = useCallback(
    async (sectionId: string, config: Partial<SectionLockConfig>, password: string) => {
      const res = await serverUpdateSectionLockConfig(sectionId, config, password);
      if (res.success) {
        setSectionConfigs((prev) => ({
          ...prev,
          [sectionId]: {
            ...(prev[sectionId] || DEFAULT_SECTION_CONFIG),
            ...config,
          },
        }));
        return { success: true };
      }
      return { success: false, error: res.error };
    },
    []
  );

  // Activity tracking & inactivity auto-relock for sections with timeoutMinutes > 0
  useEffect(() => {
    if (unlockedSections.size === 0) return;

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const recordActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        const now = Date.now();
        let updated = false;
        for (const secId of Array.from(unlockedSections)) {
          const cfg = sectionConfigs[secId] || DEFAULT_SECTION_CONFIG;
          if (cfg.timeoutMinutes > 0) {
            unlockedTimestampsRef.current[secId] = now;
            updated = true;
          }
        }
        if (updated) {
          saveUnlockedStorage(unlockedSections, unlockedTimestampsRef.current);
        }
        throttleTimer = null;
      }, 3000);
    };

    window.addEventListener("pointerdown", recordActivity);
    window.addEventListener("keydown", recordActivity);
    window.addEventListener("touchstart", recordActivity);

    const checkInterval = setInterval(() => {
      if (isAuthenticatingRef.current) return;
      const now = Date.now();
      setUnlockedSections((prev) => {
        if (prev.size === 0) return prev;
        const next = new Set(prev);
        let modified = false;
        for (const secId of Array.from(prev)) {
          const cfg = sectionConfigs[secId] || DEFAULT_SECTION_CONFIG;
          if (cfg.timeoutMinutes > 0) {
            const lastTs = unlockedTimestampsRef.current[secId] || now;
            if (now - lastTs >= cfg.timeoutMinutes * 60_000) {
              next.delete(secId);
              delete unlockedTimestampsRef.current[secId];
              modified = true;
            }
          }
        }
        if (modified) {
          saveUnlockedStorage(next, unlockedTimestampsRef.current);
          return next;
        }
        return prev;
      });
    }, 15000);

    return () => {
      window.removeEventListener("pointerdown", recordActivity);
      window.removeEventListener("keydown", recordActivity);
      window.removeEventListener("touchstart", recordActivity);
      clearInterval(checkInterval);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [unlockedSections, sectionConfigs]);

  // Background / visibility change listener to re-lock modules that have lockOnBackground enabled
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isAuthenticatingRef.current) return;
      if (document.visibilityState === "hidden") {
        setUnlockedSections((prev) => {
          let modified = false;
          const next = new Set(prev);
          for (const secId of Array.from(prev)) {
            const cfg = sectionConfigs[secId] || DEFAULT_SECTION_CONFIG;
            if (cfg.lockOnBackground) {
              next.delete(secId);
              delete unlockedTimestampsRef.current[secId];
              modified = true;
            }
          }
          if (modified) {
            saveUnlockedStorage(next, unlockedTimestampsRef.current);
            return next;
          }
          return prev;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sectionConfigs]);

  useEffect(() => {
    if (skipInitialFetch) return;
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
  }, [skipInitialFetch, refreshStatus]);

  const markUnlocked = useCallback((sectionId: string) => {
    unlockedTimestampsRef.current[sectionId] = Date.now();
    setUnlockedSections((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      saveUnlockedStorage(next, unlockedTimestampsRef.current);
      return next;
    });
  }, []);

  const isSectionLocked = useCallback(
    (sectionId: string) => {
      if (!isInitialized) return false;
      if (!lockedSectionsSet.has(sectionId)) return false;
      return !unlockedSections.has(sectionId);
    },
    [isInitialized, lockedSectionsSet, unlockedSections]
  );

  const unlockSection = async (sectionId: string, password: string) => {
    const res = await verifySectionLockPassword(password);
    if (res.success) {
      markUnlocked(sectionId);
      return { success: true };
    }
    return { success: false, error: res.error || "Incorrect password" };
  };

  const unlockSectionWithBiometricsAction = useCallback(
    async (sectionId: string): Promise<{ success: boolean; cancelled?: boolean; error?: string }> => {
      isAuthenticatingRef.current = true;
      try {
        if (strictSharedDeviceProtection) {
          return {
            success: false,
            error: "Strict Shared Device Mode is active: Please use your password to unlock this section.",
          };
        }

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
          return {
            success: false,
            cancelled: clientAssertion.cancelled,
            error: clientAssertion.error || "Biometric authentication cancelled",
          };
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
      } finally {
        setTimeout(() => {
          isAuthenticatingRef.current = false;
        }, 500);
      }
    },
    [strictSharedDeviceProtection, markUnlocked]
  );

  const lockSection = useCallback((sectionId: string) => {
    delete unlockedTimestampsRef.current[sectionId];
    setUnlockedSections((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      saveUnlockedStorage(next, unlockedTimestampsRef.current);
      return next;
    });
  }, []);

  const toggleLock = async (sectionId: string, shouldLock: boolean, password: string) => {
    const res = await serverToggleLock(sectionId, shouldLock, password);
    if (res.success && res.lockedSections) {
      setLockedSections(res.lockedSections);
      lockSection(sectionId);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const setupPassword = async (password: string, accountPassword: string) => {
    const res = await serverSetupPassword(password, accountPassword);
    if (res.success) {
      setIsInitialized(true);
      await refreshStatus();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const effectiveBiometricAvailable =
    isDeviceBiometricSupported &&
    isBiometricEnrolled &&
    biometricSettings.isEnabled !== false &&
    biometricSettings.requireForSections !== false &&
    !strictSharedDeviceProtection;

  return (
    <SectionSecurityContext.Provider
      value={{
        isInitialized,
        lockedSections,
        lockedSectionsSet,
        unlockedSections,
        loading,
        userEmail,
        isBiometricAvailable: effectiveBiometricAvailable,
        strictSharedDeviceProtection,
        sectionConfigs,
        getSectionConfig,
        updateSectionConfig,
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
