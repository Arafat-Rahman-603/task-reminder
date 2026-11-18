"use client";

import { useState } from "react";
import { ShieldAlert, Lock, Eye, EyeOff, X, Fingerprint, Loader2 } from "lucide-react";
import { updateVaultSecuritySettings, resetVaultPassword, sendVaultResetOTP } from "@/actions/vault.auth";
import { useAppLockOptional } from "@/context/AppLockContext";
import { useRouter } from "next/navigation";
import { shouldAutoFocus } from "@/lib/device";

export interface VaultSettingsData {
  maxFailedAttempts?: number;
  lockoutDurationSeconds?: number;
  selfDestructAttempts?: number;
  isInitialized?: boolean;
  [key: string]: unknown;
}

export default function VaultSettings({ vaultSettings }: { vaultSettings?: VaultSettingsData | null }) {
  const router = useRouter();
  const { isBiometricEnrolled, biometricSettings, updateBiometrics } = useAppLockOptional();

  const [loading, setLoading] = useState(false);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(vaultSettings?.maxFailedAttempts ?? 3);
  const [lockoutDurationSeconds, setLockoutDurationSeconds] = useState(vaultSettings?.lockoutDurationSeconds ?? 30);
  const [selfDestructAttempts, setSelfDestructAttempts] = useState(vaultSettings?.selfDestructAttempts ?? 0);
  const [prevVaultSettings, setPrevVaultSettings] = useState(vaultSettings);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  // Sync local state when server props refresh
  if (vaultSettings !== prevVaultSettings) {
    setPrevVaultSettings(vaultSettings);
    setMaxFailedAttempts(vaultSettings?.maxFailedAttempts ?? 3);
    setLockoutDurationSeconds(vaultSettings?.lockoutDurationSeconds ?? 30);
    setSelfDestructAttempts(vaultSettings?.selfDestructAttempts ?? 0);
  }

  // Password confirmation modal state for saving Vault security settings
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [savePasswordInput, setSavePasswordInput] = useState("");
  const [showSavePassword, setShowSavePassword] = useState(false);
  const [saveModalError, setSaveModalError] = useState("");
  const [biometricUpdating, setBiometricUpdating] = useState(false);
  
  // Reset Vault Password State
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [otpCode, setOtpCode] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [newVaultPassword, setNewVaultPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleOpenSaveConfirm = () => {
    setMessage("");
    setMessageIsError(false);
    setSavePasswordInput("");
    setSaveModalError("");
    setShowSavePassword(false);
    setShowSaveConfirmModal(true);
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savePasswordInput) {
      setSaveModalError("Password is required to save changes.");
      return;
    }

    setLoading(true);
    setSaveModalError("");
    try {
      const res = await updateVaultSecuritySettings({
        maxFailedAttempts: Number(maxFailedAttempts),
        lockoutDurationSeconds: Number(lockoutDurationSeconds),
        selfDestructAttempts: Number(selfDestructAttempts),
        password: savePasswordInput,
      });
      if (res.success) {
        setShowSaveConfirmModal(false);
        setSavePasswordInput("");
        setMessage("Vault settings saved securely.");
        setMessageIsError(false);
        router.refresh();
      } else {
        setSaveModalError(res.error || "Incorrect password. Settings were not saved.");
      }
    } catch {
      setSaveModalError("An unexpected error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoPromptVault = async (enabled: boolean) => {
    setBiometricUpdating(true);
    setMessage("");
    setMessageIsError(false);
    try {
      const res = await updateBiometrics({ autoPromptVault: enabled });
      if (res.success) {
        setMessage("Vault biometric auto-prompt preference updated.");
        router.refresh();
      } else {
        setMessage(res.error || "Failed to update biometric preference.");
        setMessageIsError(true);
      }
    } finally {
      setBiometricUpdating(false);
    }
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResetMessage("");
    try {
      const res = await sendVaultResetOTP();
      if (res.success) {
        setResetStep(2);
        setResetMessage(res.message || "A 6-digit verification code has been sent to your email.");
      } else {
        setResetMessage(res.error || "Failed to send verification code.");
      }
    } catch {
      setResetMessage("Network error. Could not send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage("");
    if (!otpCode.trim()) {
      setResetMessage("Please enter the verification code sent to your email.");
      return;
    }
    if (!accountPassword) {
      setResetMessage("Website account password is required.");
      return;
    }
    if (!newVaultPassword) {
      setResetMessage("New vault password is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetVaultPassword(otpCode.trim(), accountPassword, newVaultPassword);
      if (res.success) {
        setResetMessage("Vault password reset successfully!");
        setResetStep(1);
        setIsResetting(false);
        setOtpCode("");
        setAccountPassword("");
        setNewVaultPassword("");
      } else {
        setResetMessage(res.error || "Failed to reset password.");
      }
    } catch {
      setResetMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Vault Security</h2>
          <p className="text-sm text-on-surface-variant mt-1">Configure security lockouts for your encrypted vault.</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-surface-variant/30 flex items-center justify-center text-on-surface-variant">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-5">
        <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-variant/40 space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-on-surface">Maximum Failed Attempts</label>
            <p className="text-xs text-on-surface-variant">Number of incorrect password entries before lockout.</p>
            <input 
              type="number" 
              min={1} 
              max={10} 
              value={maxFailedAttempts} 
              onChange={e => setMaxFailedAttempts(Number(e.target.value))}
              className="mt-2 w-full max-w-[200px] px-3 py-2 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary" 
            />
          </div>

          <div className="space-y-1.5 pt-4 border-t border-surface-variant/30">
            <label className="text-sm font-semibold text-on-surface">Lockout Duration (Seconds)</label>
            <p className="text-xs text-on-surface-variant">How long the vault will remain locked after reaching max attempts.</p>
            <input 
              type="number" 
              min={10} 
              max={3600} 
              value={lockoutDurationSeconds} 
              onChange={e => setLockoutDurationSeconds(Number(e.target.value))}
              className="mt-2 w-full max-w-[200px] px-3 py-2 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary" 
            />
          </div>

          <div className="space-y-1.5 pt-4 border-t border-error/20">
            <label className="text-sm font-semibold text-error flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> Self Destruct</label>
            <p className="text-xs text-on-surface-variant">Number of incorrect passwords before the specific secret is permanently deleted. Set to 0 to disable.</p>
            <input 
              type="number" 
              min={0} 
              max={20} 
              value={selfDestructAttempts} 
              onChange={e => setSelfDestructAttempts(Number(e.target.value))}
              className="mt-2 w-full max-w-[200px] px-3 py-2 bg-surface-container border border-error/50 rounded-xl text-sm focus:outline-none focus:border-error text-error font-bold" 
            />
          </div>
          
          {isBiometricEnrolled && (
            <div className="space-y-1.5 pt-4 border-t border-surface-variant/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={biometricUpdating}
                  checked={biometricSettings.autoPromptVault ?? true}
                  onChange={(e) => void handleToggleAutoPromptVault(e.target.checked)}
                  className="w-4 h-4 rounded text-stitch-primary accent-stitch-primary cursor-pointer shrink-0 mt-0.5 disabled:opacity-50"
                />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Auto-open Biometrics / Phone Lock on Vault Item Click</span>
                  </span>
                  <p className="text-xs text-on-surface-variant">
                    Automatically trigger biometric or device screen lock authentication as soon as you click any encrypted secret.
                  </p>
                </div>
              </label>
            </div>
          )}
          
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-4">
        <button 
          type="button"
          onClick={handleOpenSaveConfirm} 
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-bold text-sm hover:bg-primary-fixed transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
        {message && (
          <span className={`text-sm ${messageIsError ? "text-error" : "text-stitch-primary"}`}>
            {message}
          </span>
        )}
      </div>

      {/* Password Confirmation Modal for Saving Vault Settings */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-hidden">
          <div className="w-full sm:max-w-sm max-w-full bg-surface border-t sm:border border-surface-variant rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 relative pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6">
            <button
              type="button"
              onClick={() => {
                if (!loading) {
                  setShowSaveConfirmModal(false);
                  setSavePasswordInput("");
                  setSaveModalError("");
                }
              }}
              className="absolute right-4 top-4 p-1.5 text-on-surface-variant hover:text-on-surface rounded-xl touch-manipulation"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-5 mt-1 sm:mt-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-stitch-primary/10 text-stitch-primary mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-on-surface">Verify Password to Save</h2>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {vaultSettings?.isInitialized
                  ? "Enter your Master Vault Password to confirm saving Vault security settings."
                  : "Enter your Manageo account password to confirm saving Vault security settings."}
              </p>
            </div>

            <form onSubmit={handleConfirmSave} className="space-y-4" autoComplete="off">
              {saveModalError && (
                <div className="text-xs text-error bg-error/10 border border-error/25 p-2.5 rounded-lg leading-tight">
                  {saveModalError}
                </div>
              )}

              <div className="relative">
                <input
                  autoFocus={shouldAutoFocus()}
                  required
                  type={showSavePassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={vaultSettings?.isInitialized ? "Enter Vault Password" : "Enter Account Password"}
                  disabled={loading}
                  value={savePasswordInput}
                  onChange={(e) => setSavePasswordInput(e.target.value)}
                  className="w-full px-4 py-3 pr-11 bg-surface-container-low border border-surface-variant/60 rounded-xl text-base sm:text-sm focus:border-stitch-primary focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowSavePassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                  title={showSavePassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showSavePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setShowSaveConfirmModal(false);
                    setSavePasswordInput("");
                    setSaveModalError("");
                  }}
                  className="flex-1 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-variant/20 rounded-xl transition-colors touch-manipulation disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !savePasswordInput}
                  className="flex-1 py-3 bg-stitch-primary text-on-primary font-bold rounded-xl text-sm hover:bg-primary-fixed active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify &amp; Save</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-surface-variant/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Reset Vault Password</h3>
            <p className="text-sm text-on-surface-variant mt-1">If you want to change your master vault password, you must verify your identity via Email OTP and your website account password.</p>
          </div>
        </div>
        
        {!isResetting ? (
          <button onClick={() => setIsResetting(true)} className="px-5 py-2.5 rounded-xl bg-surface-container border border-warning/50 text-warning font-bold text-sm hover:bg-warning/10 transition-colors">
            Reset Vault Password
          </button>
        ) : (
          <div className="p-5 rounded-2xl bg-surface-container-low border border-warning/30 max-w-md">
            {resetStep === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-4" method="POST">
                <p className="text-sm text-on-surface-variant">We will send a real 6-digit verification code to your registered email address.</p>
                {resetMessage && <div className="text-xs text-error bg-error/10 p-2 rounded-lg">{resetMessage}</div>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsResetting(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-variant/20 rounded-xl font-semibold">Cancel</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-warning text-warning-on font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 text-black">
                    {loading ? "Sending Code..." : "Send OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4" method="POST">
                {resetMessage && <div className="text-xs text-on-surface bg-surface-container p-2.5 rounded-lg border border-surface-variant/40">{resetMessage}</div>}
                <div className="p-2.5 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 text-[11px] text-slate-300">
                  📬 Code sent! If not in your inbox, <strong>please check your Spam/Junk folder</strong>.
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Email Verification Code</label>
                    <button 
                      type="button" 
                      onClick={() => handleSendOTP()} 
                      disabled={loading} 
                      className="text-[11px] text-stitch-primary hover:underline font-medium"
                    >
                      Resend Code
                    </button>
                  </div>
                  <input required type="text" maxLength={6} placeholder="Enter 6-digit code" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:border-warning focus:outline-none tracking-widest font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Website Login Password</label>
                  <input required type="password" placeholder="Account Password" value={accountPassword} onChange={e => setAccountPassword(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:border-warning focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">New Vault Password</label>
                  <input required type="password" placeholder="New Vault Password" value={newVaultPassword} onChange={e => setNewVaultPassword(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:border-warning focus:outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setIsResetting(false); setResetStep(1); }} className="px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-variant/20 rounded-xl font-semibold">Cancel</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-warning text-warning-on font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 text-black">
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
