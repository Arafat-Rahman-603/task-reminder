"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { updateUserPreferences } from "@/actions/user.actions";
import { resetVaultPassword } from "@/actions/vault.auth";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VaultSettings({ vaultSettings }: { vaultSettings?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(vaultSettings?.maxFailedAttempts || 3);
  const [lockoutDurationSeconds, setLockoutDurationSeconds] = useState(vaultSettings?.lockoutDurationSeconds || 30);
  const [selfDestructAttempts, setSelfDestructAttempts] = useState(vaultSettings?.selfDestructAttempts || 0);
  const [message, setMessage] = useState("");
  
  // Reset Vault Password State
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [otpCode, setOtpCode] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [newVaultPassword, setNewVaultPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await updateUserPreferences({
        vaultSettings: {
          maxFailedAttempts,
          lockoutDurationSeconds,
          selfDestructAttempts
        }
      });
      if (res.success) {
        setMessage("Vault settings saved securely.");
        router.refresh();
      } else {
        setMessage("Failed to save settings.");
      }
    } catch (err) {
      setMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage("");
    // Simulate sending OTP
    setTimeout(() => {
      setLoading(false);
      setResetStep(2);
    }, 1000);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage("");
    if (otpCode !== "123456") {
      setResetMessage("Invalid OTP Code. (Hint: use 123456)");
      return;
    }
    if (!accountPassword) {
      setResetMessage("Website account password is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetVaultPassword(otpCode, accountPassword, newVaultPassword);
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
    } catch (err) {
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
          
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-bold text-sm hover:bg-primary-fixed transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
        {message && <span className="text-sm text-stitch-primary">{message}</span>}
      </div>

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
              <form onSubmit={handleSendOTP} className="space-y-4">
                <p className="text-sm text-on-surface-variant">We will send a verification code to your registered email address.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsResetting(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-variant/20 rounded-xl font-semibold">Cancel</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-warning text-warning-on font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 text-black">Send OTP</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                {resetMessage && <div className="text-xs text-error bg-error/10 p-2 rounded-lg">{resetMessage}</div>}
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Email OTP</label>
                  <input required type="text" placeholder="123456" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:border-warning focus:outline-none" />
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
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-warning text-warning-on font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 text-black">Reset Password</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
