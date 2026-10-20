"use client";

import { useState } from "react";
import { X, KeyRound, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { sendSectionLockResetOTP, resetSectionLockPassword } from "@/actions/sectionLock.actions";

interface SectionSecurityResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onSuccess: () => void;
}

export function SectionSecurityResetModal({
  isOpen,
  onClose,
  userEmail,
  onSuccess,
}: SectionSecurityResetModalProps) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [otp, setOtp] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSendOTP = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await sendSectionLockResetOTP();
      if (res.success) {
        setSuccessMsg(res.message || "Verification code sent to your email.");
        setStep("verify");
      } else {
        setError(res.error || "Failed to send verification code");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    if (!accountPassword) {
      setError("Please enter your current account login password");
      return;
    }
    if (newPassword.length < 4) {
      setError("New section password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await resetSectionLockPassword(otp.trim(), accountPassword, newPassword);
      if (res.success) {
        setSuccessMsg("Section password has been reset successfully!");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setError(res.error || "Failed to reset section password");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-surface-container-low border border-surface-container-high p-6 shadow-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-stitch-primary/15 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stitch-primary/10 flex items-center justify-center text-stitch-primary shrink-0 aspect-square">
              <KeyRound className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-base font-bold font-headline text-on-surface">Reset Section Password</h3>
              <p className="text-[11px] text-on-surface-variant">Security recovery via verified email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === "request" ? (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              We will send a 6-digit one-time verification code (OTP) to your registered email address
              {userEmail ? <span className="font-semibold text-on-surface"> ({userEmail})</span> : ""}.
            </p>

            <div className="p-3.5 rounded-2xl bg-surface-container/50 border border-surface-container-high flex items-center gap-3">
              <Mail className="w-5 h-5 text-stitch-primary shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-on-surface">Two-Factor Recovery</p>
                <p className="text-on-surface-variant text-[11px]">Valid for 15 minutes upon delivery</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification Code"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-4 space-y-3.5">
            <div className="p-3 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 text-[11px] text-slate-300">
              📬 Verification code dispatched! If you cannot find it in your inbox, <strong>please check your Spam or Junk folder</strong>.
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full h-10 px-3 text-center tracking-[0.3em] font-mono text-base rounded-xl bg-surface-container-high border border-surface-container-highest text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Current Account Password
              </label>
              <input
                type="password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="Your main login password"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-on-surface-variant">
                  New Section Security Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-on-surface-variant hover:text-stitch-primary flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 4 characters"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="text-xs text-stitch-primary hover:underline disabled:opacity-50"
              >
                Resend Code
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Unlock"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
