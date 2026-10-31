"use client";

import { useState, useEffect } from "react";
import { Lock, Fingerprint, AlertTriangle, Loader2, CheckCircle2, Info, Smartphone, Laptop, Plus, Trash2, Check, X } from "lucide-react";
import { useAppLock } from "@/context/AppLockContext";
import { 
  getBiometricRegistrationChallenge, 
  verifyAndEnrollBiometrics, 
  removeBiometricCredential,
  removeSpecificBiometricCredential,
  setAppLockPin,
  removeAppLockPin
} from "@/actions/biometric.actions";
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

  // App Lock Passcode state
  const [showPasscodeForm, setShowPasscodeForm] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSaving, setPinSaving] = useState(false);
  const [pinError, setPinError] = useState("");

  // Dismissible notice state
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  useEffect(() => {
    detectBiometricCapabilities().then((cap) => {
      setCapabilities(cap);
    });
    if (typeof window !== "undefined") {
      setNoticeDismissed(localStorage.getItem("manageo_dismiss_shared_device_notice") === "true");
    }
  }, []);

  const handleDismissNotice = () => {
    setNoticeDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("manageo_dismiss_shared_device_notice", "true");
    }
  };

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

  const handleSelectAuthMethod = async (method: "password" | "both") => {
    const res = await updateAppLock({ authMethod: method });
    if (res.success) {
      showToast(method === "both" ? "Biometrics & Password mode enabled." : "Password-only unlock mode enabled.");
    } else {
      showToast(res.error || "Failed to update unlock method.", "error");
    }
  };

  const handleChangeTimeout = async (minutes: number) => {
    const res = await updateAppLock({ timeoutMinutes: minutes });
    if (res.success) {
      showToast(`Auto-lock timeout updated to ${minutes === 0 ? "immediately" : minutes + " min"}.`);
    } else {
      showToast(res.error || "Failed to update timeout.", "error");
    }
  };

  const handleToggleBackgroundLock = async (enabled: boolean) => {
    const res = await updateAppLock({ lockOnBackground: enabled });
    if (res.success) {
      showToast(enabled ? "Lock on background enabled." : "Lock on background disabled.");
    } else {
      showToast(res.error || "Failed to update background lock.", "error");
    }
  };

  const handleToggleScope = async (key: "requireForAppLock" | "requireForVault" | "requireForSections", value: boolean) => {
    try {
      const res = await updateBiometrics({ [key]: value });
      if (res.success) {
        showToast("Biometric protection scope updated.");
      } else {
        showToast(res.error || "Failed to update scope.", "error");
      }
    } catch {
      showToast("Failed to update scope.", "error");
    }
  };

  const handleToggleStrictSharedDevice = async (enabled: boolean) => {
    try {
      const res = await updateBiometrics({ strictSharedDeviceProtection: enabled });
      if (res.success) {
        showToast(
          enabled
            ? "Strict Shared Device Mode enabled: Password required for protected sections."
            : "Strict Shared Device Mode disabled."
        );
      } else {
        showToast(res.error || "Failed to update setting.", "error");
      }
    } catch {
      showToast("Failed to update setting.", "error");
    }
  };

  const handleSavePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinError("Passcode must be at least 4 characters/digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("Passcodes do not match.");
      return;
    }
    setPinSaving(true);
    setPinError("");
    try {
      const res = await setAppLockPin(newPin);
      if (res.success) {
        await refreshLockStatus();
        setShowPasscodeForm(false);
        setNewPin("");
        setConfirmPin("");
        showToast("App Lock passcode saved successfully!");
      } else {
        setPinError(res.error || "Failed to set passcode.");
      }
    } finally {
      setPinSaving(false);
    }
  };

  const handleRemovePasscode = async () => {
    if (!confirm("Remove custom App Lock passcode and use account login password instead?")) return;
    setPinSaving(true);
    try {
      const res = await removeAppLockPin();
      if (res.success) {
        await refreshLockStatus();
        showToast("Reverted to account login password.");
      } else {
        showToast(res.error || "Failed to remove passcode.", "error");
      }
    } finally {
      setPinSaving(false);
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
        deviceName: clientRes.deviceName,
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

  const handleRemoveSpecificDevice = async (credentialId: string) => {
    if (!confirm("Remove this device passkey from your account?")) return;
    setEnrollLoading(true);
    try {
      const res = await removeSpecificBiometricCredential(credentialId);
      if (res.success) {
        await refreshLockStatus();
        showToast("Device passkey removed.");
      } else {
        showToast(res.error || "Failed to remove device passkey.", "error");
      }
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleRemoveBiometrics = async () => {
    if (!confirm("Remove all registered biometric credentials and passkeys from this account?")) return;
    setEnrollLoading(true);
    try {
      const res = await removeBiometricCredential();
      if (res.success) {
        await refreshLockStatus();
        showToast("Biometric credentials removed from this account.");
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { 
                    id: "password", 
                    title: "Only Password / Passcode", 
                    desc: "Unlock Manageo using your passcode or account password only (no biometrics)" 
                  },
                  { 
                    id: "both", 
                    title: "Biometrics & Password", 
                    desc: "Unlock using device biometrics (fingerprint/face) or passcode" 
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectAuthMethod(opt.id as "password" | "both")}
                    className={`p-3 rounded-xl border text-xs text-left transition-all flex flex-col gap-1 touch-manipulation ${
                      appLockSettings.authMethod === opt.id
                        ? "bg-stitch-primary/15 border-stitch-primary text-stitch-primary font-semibold"
                        : "bg-surface-container hover:bg-surface-container-high border-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    <span className="font-bold text-on-surface">{opt.title}</span>
                    <span className="text-[11px] opacity-80 leading-relaxed">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dedicated Passcode Setup Card */}
            <div className="p-4 rounded-xl bg-surface-container border border-surface-container-highest space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">Dedicated App Passcode</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                      appLockSettings.hasCustomPin
                        ? "bg-success/10 border-success/30 text-success"
                        : "bg-surface-container-high border-surface-container-highest text-on-surface-variant"
                    }`}>
                      {appLockSettings.hasCustomPin ? "Custom Passcode Active" : "Using Account Password"}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                    Set a quick 4-8 digit PIN or custom password to open Manageo instead of typing your full account password.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setShowPasscodeForm(!showPasscodeForm); setPinError(""); }}
                    className="px-3 py-1.5 rounded-lg bg-stitch-primary/15 hover:bg-stitch-primary/25 text-stitch-primary text-xs font-semibold transition-colors touch-manipulation"
                  >
                    {showPasscodeForm ? "Close" : appLockSettings.hasCustomPin ? "Change Passcode" : "Set Custom Passcode"}
                  </button>
                  {appLockSettings.hasCustomPin && (
                    <button
                      type="button"
                      onClick={handleRemovePasscode}
                      disabled={pinSaving}
                      className="px-2.5 py-1.5 rounded-lg text-error hover:bg-error/10 text-xs font-medium transition-colors touch-manipulation"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {showPasscodeForm && (
                <form onSubmit={handleSavePasscode} className="pt-3 border-t border-surface-container-high/60 space-y-3 animate-in fade-in">
                  {pinError && (
                    <div className="p-2.5 text-xs text-error bg-error/10 rounded-lg">{pinError}</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-on-surface-variant block mb-1">New Passcode (min 4 characters/digits)</label>
                      <input
                        type="password"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="e.g. 1234 or custom pass"
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-stitch-primary border border-surface-container-highest"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-on-surface-variant block mb-1">Confirm Passcode</label>
                      <input
                        type="password"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="Re-enter passcode"
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-stitch-primary border border-surface-container-highest"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPasscodeForm(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-lg touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pinSaving || !newPin}
                      className="px-4 py-2 bg-stitch-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-fixed-dim transition-all shadow-sm disabled:opacity-50 touch-manipulation flex items-center gap-1.5"
                    >
                      {pinSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Save Passcode</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Inactivity Timeout & Lock on Background */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Auto-Lock Inactivity Timeout</label>
                <select
                  value={appLockSettings.timeoutMinutes}
                  onChange={(e) => handleChangeTimeout(parseInt(e.target.value, 10))}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container border border-surface-container-highest text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-stitch-primary cursor-pointer"
                >
                  <option value={0}>Immediately on background / blur</option>
                  <option value={1}>After 1 minute of inactivity</option>
                  <option value={5}>After 5 minutes of inactivity</option>
                  <option value={15}>After 15 minutes of inactivity</option>
                  <option value={30}>After 30 minutes of inactivity</option>
                </select>
              </div>

              {/* Lock on Background Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleToggleBackgroundLock(!appLockSettings.lockOnBackground)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleBackgroundLock(!appLockSettings.lockOnBackground);
                  }
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-surface-container-highest cursor-pointer hover:bg-surface-container-high/60 transition-colors"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-medium text-on-surface">Lock when backgrounded</span>
                  <p className="text-[11px] text-on-surface-variant">Lock when switching tabs or apps</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                    appLockSettings.lockOnBackground
                      ? "bg-stitch-primary border-stitch-primary text-black"
                      : "border-surface-variant/60 bg-surface-container-high"
                  }`}
                >
                  {appLockSettings.lockOnBackground && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
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

        {/* Enrolled Devices List */}
        {isBiometricEnrolled && biometricSettings.credentials && biometricSettings.credentials.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-on-surface">Registered Devices & Passkeys ({biometricSettings.credentials.length})</span>
              <span className="text-[11px] text-on-surface-variant">Multi-device sync</span>
            </div>
            <div className="space-y-2">
              {biometricSettings.credentials.map((dev) => {
                const nameLower = (dev.deviceName || "").toLowerCase();
                const isDesktop = nameLower.includes("pc") || nameLower.includes("mac") || nameLower.includes("linux") || nameLower.includes("windows");
                return (
                  <div key={dev.credentialId} className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-surface-container-highest">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-surface-container-highest flex items-center justify-center text-stitch-primary shrink-0">
                        {isDesktop ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{dev.deviceName || "Personal Device"}</p>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          Enrolled {dev.enrolledAt ? new Date(dev.enrolledAt).toLocaleDateString() : "Active"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={enrollLoading}
                      onClick={() => handleRemoveSpecificDevice(dev.credentialId)}
                      className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors shrink-0"
                      title="Remove this device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
            ) : isBiometricEnrolled ? (
              <Plus className="w-4 h-4" />
            ) : (
              <Fingerprint className="w-4 h-4" />
            )}
            <span>{isBiometricEnrolled ? "Add / Register This Device" : "Register Device Biometrics"}</span>
          </button>

          {isBiometricEnrolled && (
            <button
              type="button"
              disabled={enrollLoading}
              onClick={handleRemoveBiometrics}
              className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-error/15 text-on-surface-variant hover:text-error border border-surface-container-high text-xs font-medium transition-colors"
            >
              Remove All Passkeys
            </button>
          )}
        </div>

        {/* Biometric Policies & Shared-Device Protection */}
        {isBiometricEnrolled && (
          <div className="pt-4 border-t border-surface-container-high/60 space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Biometric Protection Scopes
            </h5>

            {/* Clickable Scope Cards with instant toast and active state */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "requireForAppLock", label: "App-Level Lock" },
                { key: "requireForVault", label: "Vault Item Revealing" },
                { key: "requireForSections", label: "Protected Sections (Finance, etc.)" },
              ].map((scope) => {
                const isChecked = Boolean(biometricSettings[scope.key as keyof typeof biometricSettings]);
                return (
                  <div
                    key={scope.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggleScope(scope.key as "requireForAppLock" | "requireForVault" | "requireForSections", !isChecked)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggleScope(scope.key as "requireForAppLock" | "requireForVault" | "requireForSections", !isChecked);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-stitch-primary/10 border-stitch-primary/40 text-on-surface"
                        : "bg-surface-container border-surface-container-highest text-on-surface-variant hover:bg-surface-container-high/50"
                    }`}
                  >
                    <span className="text-xs font-medium">{scope.label}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked
                          ? "bg-stitch-primary border-stitch-primary text-black"
                          : "border-surface-variant/60 bg-surface-container-high"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shared Device Security Notice & Controls */}
            <div className="p-4 sm:p-5 rounded-2xl bg-warning/10 border border-warning/25 space-y-3.5">
              {!noticeDismissed && (
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-warning/20">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-warning">Shared Device Protection Notice</span>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        Standard web biometric APIs verify any fingerprint or face enrolled on this physical device. If another person&apos;s fingerprint is enrolled on your phone or computer, standard platform APIs cannot differentiate between individual fingers.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDismissNotice}
                    className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-warning/20 transition-colors shrink-0"
                    title="Dismiss notice banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Fully Interactive Strict Shared Device Mode Card with Responsive Slider Switch */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleToggleStrictSharedDevice(!biometricSettings.strictSharedDeviceProtection)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleStrictSharedDevice(!biometricSettings.strictSharedDeviceProtection);
                  }
                }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-container border border-surface-container-highest cursor-pointer hover:bg-surface-container-high/60 transition-all focus:outline-none focus:ring-1 focus:ring-stitch-primary"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-on-surface">Strict Shared Device Mode</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                        biometricSettings.strictSharedDeviceProtection
                          ? "bg-warning/15 border-warning/40 text-warning"
                          : "bg-surface-container-high border-surface-container-highest text-on-surface-variant"
                      }`}
                    >
                      {biometricSettings.strictSharedDeviceProtection ? "Enforced (Password Required)" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Require Manageo account/section password for high-risk section operations (Vault, Finance) instead of device biometrics.
                  </p>
                </div>

                {/* Animated Toggle Switch */}
                <div
                  className={`w-11 h-6 rounded-full relative transition-colors shrink-0 self-end sm:self-auto cursor-pointer ${
                    biometricSettings.strictSharedDeviceProtection ? "bg-stitch-primary" : "bg-surface-container-highest"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      biometricSettings.strictSharedDeviceProtection ? "translate-x-5.5 left-0" : "translate-x-0.5 left-0"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
