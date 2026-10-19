"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getSectionSecurityStatus,
  verifySectionLockPassword,
  toggleSectionLock as serverToggleLock,
  setupSectionLockPassword as serverSetupPassword,
} from "@/actions/sectionLock.actions";

interface SectionSecurityContextType {
  isInitialized: boolean;
  lockedSections: string[];
  unlockedSections: Set<string>;
  loading: boolean;
  userEmail?: string;
  isSectionLocked: (sectionId: string) => boolean;
  unlockSection: (sectionId: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  const [unlockedSections, setUnlockedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  // Restore unlocked sections from sessionStorage on client load
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setUnlockedSections(new Set(parsed));
          }
        }
      } catch {
        // ignore
      }
    }
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
    refreshStatus();
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
        isSectionLocked,
        unlockSection,
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
