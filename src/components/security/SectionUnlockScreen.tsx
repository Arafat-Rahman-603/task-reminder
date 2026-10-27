"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, KeyRound, Fingerprint } from "lucide-react";
import { useSectionSecurity } from "@/context/SectionSecurityContext";
import { SectionSecurityResetModal } from "./SectionSecurityResetModal";
import { shouldAutoFocus } from "@/lib/device";

interface SectionUnlockScreenProps {
  sectionId: string;
  sectionName?: string;
}

export function SectionUnlockScreen({ sectionId, sectionName = "Section" }: SectionUnlockScreenProps) {
  const { unlockSection, unlockSectionWithBiometricsAction, userEmail, markUnlocked, isBiometricAvailable: _isBiometricAvailable } = useSectionSecurity();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on desktop / laptop PC only
  useEffect(() => {
    if (shouldAutoFocus()) {
      const t = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setError("");
    setLoading(true);
    try {
      const res = await unlockSection(sectionId, password);
      if (!res.success) {
        setError(res.error || "Incorrect password. Please try again.");
      }
    } catch (err: unknown) { const error = err as Error;
      setError(error.message || "Failed to unlock section");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setError("");
    setBiometricLoading(true);
    try {
      const res = await unlockSectionWithBiometricsAction(sectionId);
      if (!res.success) {
        setError(res.error || "Biometric unlock failed");
      }
    } catch (err: unknown) { const error = err as Error;
      setError(error.message || "Biometric authentication failed");
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl sm:rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 sm:p-8 border border-surface-container-high shadow-2xl text-center">
        {/* Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-stitch-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-tertiary/10 blur-3xl pointer-events-none" />

        {/* Lock Badge Icon */}
        <div className="relative mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-surface-container-high flex items-center justify-center border border-stitch-primary/30 shadow-inner group shrink-0 aspect-square">
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-stitch-primary/10 animate-ping opacity-25 pointer-events-none" />
          <Lock className="w-8 h-8 sm:w-9 sm:h-9 text-stitch-primary transition-transform group-hover:scale-110 shrink-0" />
        </div>

        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-bold font-headline text-on-surface tracking-tight">
          {sectionName} is Protected
        </h2>
        <p className="text-xs text-on-surface-variant max-w-xs mx-auto mt-2 leading-relaxed">
          This area is locked with security controls. Authenticate with device biometrics or enter your section password.
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-error/15 border border-error/25 text-error text-xs text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Biometric Quick Unlock Option */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleBiometricUnlock}
            disabled={biometricLoading || loading}
            className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high border border-stitch-primary/30 text-stitch-primary font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {biometricLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-stitch-primary" />
            ) : (
              <>
                <Fingerprint className="w-4 h-4 text-stitch-primary" />
                <span>Unlock with Device Biometrics</span>
              </>
            )}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-surface-container-highest"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Or use password
            </span>
            <div className="flex-grow border-t border-surface-container-highest"></div>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="mt-2 space-y-4">
          <div className="relative">
            <input
              ref={passwordInputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter section password"
              className="w-full h-11 px-4 pr-11 rounded-xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-stitch-primary transition-all text-center"
              autoFocus={shouldAutoFocus()}
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
            className="w-full h-11 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm hover:bg-primary-fixed-dim active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-stitch-primary/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Unlock with Password</span>
              </>
            )}
          </button>
        </form>

        {/* Action Options */}
        <div className="mt-6 pt-5 border-t border-surface-container-high/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <Link
            href="/dashboard"
            className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-stitch-primary hover:underline flex items-center gap-1 font-medium transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Forgot Password? Reset via OTP</span>
          </button>
        </div>
      </div>

      <SectionSecurityResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        userEmail={userEmail}
        onSuccess={() => {
          markUnlocked(sectionId);
        }}
      />
    </div>
  );
}
