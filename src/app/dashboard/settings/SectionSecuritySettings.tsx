"use client";

import { useState } from "react";
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Database,
  Mail,
  ChevronRight,
} from "lucide-react";
import { useSectionSecurity } from "@/context/SectionSecurityContext";
import { SYSTEM_MODULES } from "@/config/modules";
import { changeSectionLockPassword } from "@/actions/sectionLock.actions";
import { SectionSecurityResetModal } from "@/components/security/SectionSecurityResetModal";
import { SectionPasswordConfirmModal } from "@/components/security/SectionPasswordConfirmModal";

export default function SectionSecuritySettings({ customSections = [] }: { customSections?: any[] }) {
  const {
    isInitialized,
    lockedSections,
    toggleLock,
    setupPassword,
    refreshStatus,
    userEmail,
  } = useSectionSecurity();

  // Setup password state
  const [showSetup, setShowSetup] = useState(false);
  const [initPassword, setInitPassword] = useState("");
  const [confirmInitPassword, setConfirmInitPassword] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  // Reset OTP modal state
  const [showResetModal, setShowResetModal] = useState(false);

  // Password confirmation modal state for lock/unlock
  const [confirmTarget, setConfirmTarget] = useState<{
    sectionId: string;
    sectionName: string;
    isLocking: boolean;
  } | null>(null);

  // UI state
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initPassword.length < 4) {
      showToast("Password must be at least 4 characters long", "error");
      return;
    }
    if (initPassword !== confirmInitPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setSetupLoading(true);
    try {
      const res = await setupPassword(initPassword);
      if (res.success) {
        showToast("Section security password created successfully!");
        setShowSetup(false);
        setInitPassword("");
        setConfirmInitPassword("");
      } else {
        showToast(res.error || "Failed to setup password", "error");
      }
    } finally {
      setSetupLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      showToast("New password must be at least 4 characters long", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    setChangeLoading(true);
    try {
      const res = await changeSectionLockPassword(currentPassword, newPassword);
      if (res.success) {
        showToast("Section security password changed successfully!");
        setShowChangePassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        showToast(res.error || "Failed to change password", "error");
      }
    } finally {
      setChangeLoading(false);
    }
  };

  const initiateToggle = (sectionId: string, sectionName: string, currentlyLocked: boolean) => {
    if (!isInitialized) {
      setShowSetup(true);
      showToast("Please set up your security password first before locking sections.", "error");
      return;
    }
    setConfirmTarget({
      sectionId,
      sectionName,
      isLocking: !currentlyLocked,
    });
  };

  const handleConfirmPassword = async (password: string) => {
    if (!confirmTarget) return { success: false };
    setPendingSectionId(confirmTarget.sectionId);
    try {
      const res = await toggleLock(confirmTarget.sectionId, confirmTarget.isLocking, password);
      if (res.success) {
        showToast(
          confirmTarget.isLocking
            ? `"${confirmTarget.sectionName}" locked with password protection!`
            : `"${confirmTarget.sectionName}" unlocked (Protection removed)`
        );
        return { success: true };
      }
      return { success: false, error: res.error || "Incorrect password. Verification failed." };
    } finally {
      setPendingSectionId(null);
    }
  };

  // Modules available to lock
  const modulesList = Object.values(SYSTEM_MODULES).filter(
    (m: any) => m.implemented && m.id !== "custom" && m.id !== "vault"
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            toastMsg.type === "success"
              ? "bg-success/20 text-success border border-success/30"
              : "bg-error/20 text-error border border-error/30"
          }`}
        >
          {toastMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-surface-container-low/70 backdrop-blur-2xl p-5 sm:p-6 border border-surface-container-high shadow-xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-stitch-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stitch-primary/20 to-stitch-primary/5 flex items-center justify-center text-stitch-primary border border-stitch-primary/30 shadow-lg shadow-stitch-primary/10 shrink-0 mt-0.5">
              <Shield className="w-6 h-6 shrink-0" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-bold font-headline text-white leading-tight">
                  Section Security &amp; Password Lock
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    isInitialized
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {isInitialized ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Not Initialized</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Lock sensitive modules and custom sections with password protection. Requires entering your password to view.
              </p>
            </div>
          </div>

          {/* Action Buttons (Stacked Vertically) */}
          <div className="flex flex-col gap-2.5 w-full md:w-56 shrink-0">
            {!isInitialized ? (
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="w-full px-4 py-2.5 rounded-xl bg-stitch-primary hover:bg-sky-300 text-slate-950 text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>Set Security Password</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  className="group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-container-highest hover:border-stitch-primary/40 text-xs font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-stitch-primary/10 flex items-center justify-center text-stitch-primary shrink-0 group-hover:scale-105 transition-transform">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate text-white">Change Password</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-stitch-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-container-highest hover:border-stitch-secondary/40 text-xs font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-stitch-secondary/10 flex items-center justify-center text-stitch-secondary shrink-0 group-hover:scale-105 transition-transform">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate text-white">Reset via Email OTP</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-stitch-secondary group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Setup Password Form */}
      {showSetup && (
        <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 border border-stitch-primary/30 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
            <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Lock className="w-4 h-4 text-stitch-primary" />
              <span>Initialize Section Security Password</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowSetup(false)}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleInitialSetup} className="space-y-3 max-w-md">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Enter Security Password (min 4 characters)
              </label>
              <input
                type={showPasswordText ? "text" : "password"}
                value={initPassword}
                onChange={(e) => setInitPassword(e.target.value)}
                placeholder="New section password"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Confirm Password
              </label>
              <input
                type={showPasswordText ? "text" : "password"}
                value={confirmInitPassword}
                onChange={(e) => setConfirmInitPassword(e.target.value)}
                placeholder="Re-type password"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary"
                required
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="text-xs text-on-surface-variant hover:text-stitch-primary flex items-center gap-1"
              >
                {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswordText ? "Hide characters" : "Show characters"}</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSetup(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setupLoading}
                  className="px-4 py-1.5 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {setupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Password</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Form */}
      {showChangePassword && (
        <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 border border-surface-container-high shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
            <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-stitch-primary" />
              <span>Change Section Password</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowChangePassword(false)}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Current Section Password
              </label>
              <input
                type={showPasswordText ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                New Section Password
              </label>
              <input
                type={showPasswordText ? "text" : "password"}
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
                type={showPasswordText ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary"
                required
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="text-xs text-on-surface-variant hover:text-stitch-primary flex items-center gap-1"
              >
                {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswordText ? "Hide characters" : "Show characters"}</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changeLoading}
                  className="px-4 py-1.5 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {changeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* System Modules Switchboard */}
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-stitch-primary">
            Standard Application Modules
          </h4>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Toggle password protection for each module. When enabled, a password prompt is required upon entry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modulesList.map((mod: any) => {
            const isLocked = lockedSections.includes(mod.id);
            const isBusy = pendingSectionId === mod.id;
            const IconCmp = mod.icon;

            return (
              <div
                key={mod.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLocked
                    ? "bg-surface-container-high/80 border-stitch-primary/40 shadow-sm"
                    : "bg-surface-container/40 border-surface-container-high hover:bg-surface-container/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 aspect-square transition-colors ${
                      isLocked
                        ? "bg-stitch-primary/20 text-stitch-primary border border-stitch-primary/30"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {IconCmp ? <IconCmp className="w-4 h-4 shrink-0" /> : <Shield className="w-4 h-4 shrink-0" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-on-surface truncate">{mod.label}</span>
                      {isLocked && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-stitch-primary/20 text-stitch-primary shrink-0">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">{mod.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => initiateToggle(mod.id, mod.label, isLocked)}
                  disabled={isBusy}
                  className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap self-end sm:self-auto ${
                    isLocked
                      ? "bg-stitch-primary text-on-primary hover:bg-primary-fixed-dim shadow-sm"
                      : "bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-surface-container-highest"
                  }`}
                  title={isLocked ? "Remove password lock" : "Lock with password"}
                >
                  {isBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Protected</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Lock</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Sections Switchboard */}
      {customSections && customSections.length > 0 && (
        <div className="space-y-3 pt-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stitch-secondary">
              Custom Database Sections
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Secure your user-created databases with the same section password.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customSections.map((section: any) => {
              const isLocked = lockedSections.includes(section.slug);
              const isBusy = pendingSectionId === section.slug;

              return (
                <div
                  key={section._id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLocked
                      ? "bg-surface-container-high/80 border-stitch-secondary/40 shadow-sm"
                      : "bg-surface-container/40 border-surface-container-high hover:bg-surface-container/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 aspect-square transition-colors text-base ${
                        isLocked
                          ? "bg-stitch-secondary/20 border border-stitch-secondary/30"
                          : "bg-surface-container-high"
                      }`}
                    >
                      {section.icon || <Database className="w-4 h-4 text-on-surface-variant shrink-0" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-on-surface truncate">{section.name}</span>
                        {isLocked && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-stitch-secondary/20 text-stitch-secondary shrink-0">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant truncate">/{section.slug}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => initiateToggle(section.slug, section.name, isLocked)}
                    disabled={isBusy}
                    className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap self-end sm:self-auto ${
                      isLocked
                        ? "bg-stitch-secondary text-on-secondary shadow-sm"
                        : "bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-surface-container-highest"
                    }`}
                    title={isLocked ? "Remove password lock" : "Lock with password"}
                  >
                    {isBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Protected</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Lock</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      <SectionSecurityResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        userEmail={userEmail}
        onSuccess={() => {
          refreshStatus();
          showToast("Password reset successfully via email verification!");
        }}
      />

      {/* Password Confirmation Modal for Lock/Unlock */}
      <SectionPasswordConfirmModal
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        sectionName={confirmTarget?.sectionName || ""}
        isLocking={confirmTarget?.isLocking ?? true}
        onConfirm={handleConfirmPassword}
      />
    </div>
  );
}
