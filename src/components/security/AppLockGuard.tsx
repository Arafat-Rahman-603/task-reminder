"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Lock, Eye, EyeOff, Loader2, Fingerprint, ShieldCheck, LogOut } from "lucide-react";
import { useAppLock } from "@/context/AppLockContext";
import { signOut } from "next-auth/react";
import { shouldAutoFocus } from "@/lib/device";

export function AppLockGuard({ children }: { children: React.ReactNode }) {
  const {
    isLocked,
    isInitialized,
    appLockSettings,
    biometricSettings,
    isBiometricEnrolled,
    unlockWithBiometrics,
    unlockWithPassword,
  } = useAppLock();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState("");
  const hasAutoPromptedRef = useRef(false);

  const isOnlyPassword = appLockSettings.authMethod === "password";

  const showBiometricOption =
    !isOnlyPassword &&
    isBiometricEnrolled &&
    biometricSettings.isEnabled !== false &&
    biometricSettings.requireForAppLock !== false &&
    (appLockSettings.authMethod === "biometric" || appLockSettings.authMethod === "both");

  const showPasswordOption =
    isOnlyPassword ||
    !appLockSettings.requireBiometricWithoutFallback ||
    !isBiometricEnrolled;

  const handleBiometricUnlock = useCallback(async (isAutoPrompt = false) => {
    setError("");
    setBiometricLoading(true);
    try {
      const res = await unlockWithBiometrics();
      if (!res.success) {
        const isCancelled = res.cancelled || /cancel|notallowederror/i.test(res.error || "");
        if (!(isAutoPrompt && isCancelled)) {
          setError(res.error || "Biometric authentication failed");
        }
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      const msg = errObj.message || "Failed to verify biometrics";
      if (!(isAutoPrompt && /cancel|notallowederror/i.test(msg))) {
        setError(msg);
      }
    } finally {
      setBiometricLoading(false);
    }
  }, [unlockWithBiometrics]);

  useEffect(() => {
    if (!isLocked) {
      hasAutoPromptedRef.current = false;
      return;
    }

    if (
      !isInitialized ||
      !appLockSettings.isEnabled ||
      !showBiometricOption ||
      biometricSettings.autoPromptAppLock === false
    ) {
      return;
    }

    const tryAutoPrompt = () => {
      if (hasAutoPromptedRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        hasAutoPromptedRef.current = true;
        void handleBiometricUnlock(true);
      }
    };

    const timeoutId = setTimeout(tryAutoPrompt, 50);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tryAutoPrompt();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    isLocked,
    isInitialized,
    appLockSettings.isEnabled,
    showBiometricOption,
    biometricSettings.autoPromptAppLock,
    handleBiometricUnlock,
  ]);

  // 1. If App Lock is disabled, immediately render children without delay
  if (!appLockSettings.isEnabled) {
    return <>{children}</>;
  }

  // 2. If App Lock is enabled but not initialized, show security loading screen (NEVER expose children!)
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stitch-background text-on-surface">
        <div className="relative w-full max-w-sm rounded-3xl bg-surface-container-low border border-surface-container-high p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center border border-stitch-primary/30 shadow-inner shrink-0">
            <Lock className="w-8 h-8 text-stitch-primary animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-headline text-on-surface tracking-tight">
              Manageo Security
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Verifying session security...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. If App Lock is enabled and not locked (already unlocked in this session), render children
  if (!isLocked) {
    return <>{children}</>;
  }

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError("");
    setLoading(true);
    try {
      const res = await unlockWithPassword(password);
      if (!res.success) {
        setError(res.error || "Incorrect account password");
      } else {
        setPassword("");
      }
    } catch (err: unknown) { const error = err as Error;
      setError(error.message || "Failed to unlock application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stitch-background text-on-surface">
      <div className="relative w-full max-w-sm rounded-3xl bg-surface-container-low border border-surface-container-high p-6 sm:p-8 shadow-2xl text-center space-y-5">
        {/* Lock Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center border border-stitch-primary/30 shadow-inner group shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-stitch-primary/10 animate-ping opacity-20 pointer-events-none" />
          <Lock className="w-8 h-8 text-stitch-primary" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-headline text-on-surface tracking-tight">
            Manageo is Locked
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Authentication is required to access your workspace.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-error/15 border border-error/25 text-error text-xs text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Biometric Unlock Action */}
        {showBiometricOption && (
          <button
            type="button"
            onClick={() => void handleBiometricUnlock(false)}
            disabled={biometricLoading || loading}
            className="w-full h-11 rounded-xl bg-stitch-primary text-on-primary font-semibold text-xs hover:bg-primary-fixed-dim transition-all flex items-center justify-center gap-2 shadow-lg shadow-stitch-primary/20 active:scale-95 disabled:opacity-50"
          >
            {biometricLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
            ) : (
              <>
                <Fingerprint className="w-4 h-4 text-on-primary" />
                <span>Unlock with Biometrics / Device Lock</span>
              </>
            )}
          </button>
        )}

        {/* Divider if both are shown */}
        {showBiometricOption && showPasswordOption && (
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-surface-container-highest"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Or use password
            </span>
            <div className="flex-grow border-t border-surface-container-highest"></div>
          </div>
        )}

        {/* Password Form */}
        {showPasswordOption && (
          <form onSubmit={handlePasswordUnlock} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={appLockSettings.hasCustomPin ? "Enter App passcode or account password" : "Enter Manageo account password"}
                className="w-full h-11 px-4 pr-11 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-stitch-primary text-center"
                autoFocus={!showBiometricOption && shouldAutoFocus()}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-stitch-primary p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className={`w-full h-11 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 ${
                showBiometricOption
                  ? "bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-container-high"
                  : "bg-stitch-primary text-on-primary hover:bg-primary-fixed-dim"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{appLockSettings.hasCustomPin ? "Unlock with Passcode" : "Unlock with Account Password"}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Strict Biometric Note when password fallback is disabled */}
        {appLockSettings.requireBiometricWithoutFallback && (
          <p className="text-[11px] text-on-surface-variant italic">
            Strict biometric-only mode is active. Password fallback is disabled by security policy.
          </p>
        )}

        {/* Bottom Options */}
        <div className="pt-3 border-t border-surface-container-high/60 flex items-center justify-center">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-error transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch or Log Out Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
