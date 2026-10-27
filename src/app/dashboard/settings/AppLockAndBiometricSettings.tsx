"use client";

import { useState, useEffect } from "react";
import { Lock, Fingerprint, AlertTriangle, Loader2, CheckCircle2, Info, Smartphone } from "lucide-react";
import { useAppLock } from "@/context/AppLockContext";
import { getBiometricRegistrationChallenge, verifyAndEnrollBiometrics, removeBiometricCredential } from "@/actions/biometric.actions";
import { registerBiometricCredential, detectBiometricCapabilities, BiometricCapabilities } from "@/lib/biometric-bridge";

export default function AppLockAndBiometricSettings() {
  const {
    appLockSettings,
    biometricSettings,
    isBiometricEnrolled,
    updateAppLock,
    updateBiometrics,
    refreshLockStatus,
  } = useAppLock();

  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    supported: false,
    isNative: false,
    biometryType: "Detecting...",
    canEnforceStrictBiometricWithoutPIN: false,
    authenticatorName: "Detecting...",
  });

  const [loading, setLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    detectBiometricCapabilities().then((cap) => {
      setCapabilities(cap);
    });
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleToggleAppLock = async (enabled: boolean) => {
    setLoading(true);
    try {
      const res = await updateAppLock({ isEnabled: enabled });
      if (res.success) {
        showToast(enabled ? "App Lock enabled." : "App Lock disabled.");
      } else {
        showToast(res.error || "Failed to update App Lock.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollBiometrics = async () => {
    setEnrollLoading(true);
    try {
      const challengeRes = await getBiometricRegistrationChallenge();
      if (!challengeRes.success || !challengeRes.challenge) {
        showToast(challengeRes.error || "Failed to initiate biometric enrollment.", "error");
        return;
      }

      const clientRes = await registerBiometricCredential({
        challenge: challengeRes.challenge,
        userId: challengeRes.userId || "",
        userEmail: challengeRes.userEmail || "",
        userName: challengeRes.userName || "",
      });

      if (!clientRes.success || !clientRes.credentialId || !clientRes.attestationObject) {
        showToast(clientRes.error || "Biometric registration was cancelled.", "error");
        return;
      }

      const verifyRes = await verifyAndEnrollBiometrics({
        credentialId: clientRes.credentialId,
        attestationObject: clientRes.attestationObject,
        clientDataJSON: clientRes.clientDataJSON || "",
      });

      if (verifyRes.success) {
        await refreshLockStatus();
        showToast("Device biometrics registered successfully!");
      } else {
        showToast(verifyRes.error || "Failed to verify biometric credential.", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to register biometrics.", "error");
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleRemoveBiometrics = async () => {
    setEnrollLoading(true);
    try {
      const res = await removeBiometricCredential();
      if (res.success) {
        await refreshLockStatus();
        showToast("Biometric credential removed from this account.");
      } else {
        showToast(res.error || "Failed to remove biometrics.", "error");
      }
    } finally {
      setEnrollLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-3">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border ${
              toast.type === "success"
                ? "bg-stitch-primary/10 border-stitch-primary/30 text-stitch-primary backdrop-blur-xl"
                : "bg-error/15 border-error/30 text-error backdrop-blur-xl"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* 1. App-Level Lock Section */}
      <div className="rounded-2xl bg-surface-container/50 border border-surface-container-high p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">Require authentication to open Manageo</h4>
              <p className="text-xs text-on-surface-variant mt-0.5 max-w-md leading-relaxed">
                When enabled, Manageo prompts for authentication on cold launch, returning from background, or after inactivity.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-auto">
            <input
              type="checkbox"
              checked={appLockSettings.isEnabled}
              onChange={(e) => handleToggleAppLock(e.target.checked)}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stitch-primary"></div>
          </label>
        </div>

        {appLockSettings.isEnabled && (
          <div className="pt-4 border-t border-surface-container-high/60 space-y-4 animate-in fade-in">
            {/* Auth Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Supported Unlock Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "password", label: "Account Password" },
                  { id: "biometric", label: "Device Biometrics" },
                  { id: "both", label: "Biometrics or Password" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateAppLock({ authMethod: opt.id as "password" | "biometric" | "both" })}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      appLockSettings.authMethod === opt.id
                        ? "bg-stitch-primary/15 border-stitch-primary text-stitch-primary font-semibold"
                        : "bg-surface-container hover:bg-surface-container-high border-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inactivity Timeout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Auto-Lock Inactivity Timeout</label>
                <select
                  value={appLockSettings.timeoutMinutes}
                  onChange={(e) => updateAppLock({ timeoutMinutes: parseInt(e.target.value, 10) })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container border border-surface-container-highest text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-stitch-primary"
                >
                  <option value={0}>Immediately on background / blur</option>
                  <option value={1}>After 1 minute of inactivity</option>
                  <option value={5}>After 5 minutes of inactivity</option>
                  <option value={15}>After 15 minutes of inactivity</option>
                  <option value={30}>After 30 minutes of inactivity</option>
                </select>
              </div>

              {/* Lock on Background */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-surface-container-highest">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-medium text-on-surface">Lock when backgrounded</span>
                  <p className="text-[11px] text-on-surface-variant">Lock when switching tabs or apps</p>
                </div>
                <input
                  type="checkbox"
                  checked={appLockSettings.lockOnBackground}
                  onChange={(e) => updateAppLock({ lockOnBackground: e.target.checked })}
                  className="w-4 h-4 rounded text-stitch-primary accent-stitch-primary cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Device Biometrics Section */}
      <div className="rounded-2xl bg-surface-container/50 border border-surface-container-high p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
              <h4 className="text-sm font-bold text-on-surface">Device Biometric Authentication</h4>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border w-fit shrink-0 ${
                isBiometricEnrolled
                  ? "bg-stitch-primary/10 border-stitch-primary/30 text-stitch-primary"
                  : "bg-surface-container border-surface-container-highest text-on-surface-variant"
              }`}>
                {isBiometricEnrolled ? "Enrolled" : "Not Enrolled"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Use your device&apos;s built-in Touch ID, Face ID, Windows Hello, or Android Biometric sensor for quick and secure unlocking.
            </p>
          </div>
        </div>

        {/* Detected Capabilities Banner */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container border border-surface-container-highest flex items-start gap-3 text-xs">
          <Smartphone className="w-4 h-4 text-stitch-primary shrink-0 mt-0.5" />
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-on-surface shrink-0">Platform Authenticator:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container-high border border-surface-container-highest text-stitch-primary font-mono text-[11px] w-fit">
                {capabilities.authenticatorName}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Hardware verification is backed by WebAuthn public-key cryptography. Raw biometric scans remain in your device&apos;s secure enclave and are never transmitted over the network.
            </p>
          </div>
        </div>

        {/* Enrollment Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            disabled={enrollLoading}
            onClick={handleEnrollBiometrics}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-all shadow-sm disabled:opacity-50"
          >
            {enrollLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
            ) : (
              <Fingerprint className="w-4 h-4" />
            )}
            <span>{isBiometricEnrolled ? "Re-register Device Biometrics" : "Register Device Biometrics"}</span>
          </button>

          {isBiometricEnrolled && (
            <button
              type="button"
              disabled={enrollLoading}
              onClick={handleRemoveBiometrics}
              className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-error/15 text-on-surface-variant hover:text-error border border-surface-container-high text-xs font-medium transition-colors"
            >
              Remove Biometrics
            </button>
          )}
        </div>

        {/* Biometric Policies & Shared-Device Protection */}
        {isBiometricEnrolled && (
          <div className="pt-4 border-t border-surface-container-high/60 space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Biometric Protection Scopes
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "requireForAppLock", label: "App-Level Lock" },
                { key: "requireForVault", label: "Vault Item Revealing" },
                { key: "requireForSections", label: "Protected Sections (Finance, etc.)" },
              ].map((scope) => (
                <label
                  key={scope.key}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container border border-surface-container-highest cursor-pointer hover:bg-surface-container-high/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(biometricSettings[scope.key as keyof typeof biometricSettings])}
                    onChange={(e) => updateBiometrics({ [scope.key]: e.target.checked })}
                    className="w-4 h-4 rounded text-stitch-primary accent-stitch-primary cursor-pointer"
                  />
                  <span className="text-xs text-on-surface font-medium">{scope.label}</span>
                </label>
              ))}
            </div>

            {/* Shared Device Security Notice & Controls */}
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/25 space-y-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-warning">Shared Device Protection Notice</span>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Standard web biometric APIs verify any fingerprint or face enrolled on this physical device. If another person&apos;s fingerprint is enrolled on your phone or computer, standard platform APIs cannot differentiate between individual fingers.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometricSettings.strictSharedDeviceProtection}
                  onChange={(e) => updateBiometrics({ strictSharedDeviceProtection: e.target.checked })}
                  className="w-4 h-4 rounded text-stitch-primary accent-stitch-primary cursor-pointer shrink-0 mt-0.5"
                />
                <span className="text-xs font-semibold text-on-surface">
                  Strict Shared Device Mode: Require Manageo password for high-risk section operations
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
