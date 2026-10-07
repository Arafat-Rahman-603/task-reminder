"use client";
import { formatDate, formatDateTime, formatTime } from "@/lib/dateUtils";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { User as UserIcon, Mail, Calendar, ShieldCheck, Edit3, X, Check, Lock, Eye, EyeOff, LogOut, Loader2, Globe, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PWAInstallButton from "@/components/pwa/PWAInstallButton";

export default function ProfilePage() {
  const [user, setUser] = useState<{ name: string; email: string; createdAt: string; preferences?: { currency?: string }; emailVerified?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgType, setSaveMsgType] = useState<"success" | "error">("success");

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  // Upgrade state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [company, setCompany] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAlreadyRequested(localStorage.getItem("upgrade_request_sent") === "true");
    }
    
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          setNewName(d.user.name);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const showMessage = (msg: string, type: "success" | "error" = "success") => {
    setSaveMsg(msg);
    setSaveMsgType(type);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(u => u ? { ...u, name: newName.trim() } : null);
        setEditingName(false);
        showMessage("Name updated successfully");
      } else {
        showMessage(data.error || "Failed to update name", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showMessage("Password changed successfully");
      } else {
        showMessage(data.error || "Failed to change password", "error");
      }
    } finally {
      setPwdSaving(false);
    }
  };

  const handleUpgradeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpgradeLoading(true);
    setUpgradeError("");
    
    try {
      const res = await fetch("/api/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.name, email: user.email, company, plan: "Professional" })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send request");
      }
      
      setUpgradeSuccess(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("upgrade_request_sent", "true");
        setAlreadyRequested(true);
      }
    } catch (err: any) {
      setUpgradeError(err.message);
    } finally {
      setUpgradeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-stitch-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-2xl space-y-5 pb-10">
      {/* Success/Error message */}
      {saveMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium text-center ${saveMsgType === "success" ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}>
          {saveMsg}
        </div>
      )}

      {/* PWA Install Promo */}
      <PWAInstallButton variant="card" />

      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-container-low/70 backdrop-blur-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-stitch-primary/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-tertiary/10 blur-3xl pointer-events-none"></div>

        {/* Avatar */}
        <div className="relative z-10 shrink-0">
          <div className="w-20 h-20 rounded-full bg-surface-container-high shadow-inner flex items-center justify-center border-2 border-stitch-primary/30">
            <span className="text-3xl font-bold text-stitch-primary">{user.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        </div>

        {/* Name & Edit */}
        <div className="relative z-10 flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg bg-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-stitch-primary"
                autoFocus
              />
              <button onClick={handleSaveName} disabled={saving} className="w-9 h-9 rounded-lg bg-stitch-primary text-on-primary flex items-center justify-center hover:bg-primary-fixed-dim transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => { setEditingName(false); setNewName(user.name); }} className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:text-on-surface transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center sm:justify-start overflow-hidden">
              <h1 className="text-xl font-bold text-on-surface tracking-tight truncate min-w-0" title={user.name}>{user.name}</h1>
              <button onClick={() => setEditingName(true)} className="shrink-0 p-1.5 rounded-lg text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container-high transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            App Member
          </p>
        </div>
      </div>

      {/* Account Details */}
      <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 shadow-lg border border-surface-container-high space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stitch-primary">Account Details</h2>

        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Full Name</p>
            <p className="text-sm font-medium text-on-surface truncate">{user.name}</p>
          </div>
        </div>

        <div className="h-px bg-surface-container-high"></div>

        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Email Address</p>
            <p className="text-sm font-medium text-on-surface truncate">{user.email}</p>
          </div>
        </div>

        <div className="h-px bg-surface-container-high"></div>

        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Currency</p>
            <p className="text-sm font-medium text-on-surface">{user.preferences?.currency || "BDT"}</p>
          </div>
        </div>

        <div className="h-px bg-surface-container-high"></div>

        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Member Since</p>
            <p className="text-sm font-medium text-on-surface">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 shadow-lg border border-surface-container-high space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stitch-primary">Security</h2>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-high/60 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">Change Password</p>
              <p className="text-xs text-on-surface-variant">Update your account password</p>
            </div>
            <Edit3 className="w-4 h-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3" method="POST">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Current Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Your current password"
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-stitch-primary transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface-variant">New Password</label>
              <input
                type={showPwd ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Confirm New Password</label>
              <input
                type={showPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter new password"
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={pwdSaving}
                className="flex-1 h-10 rounded-xl bg-stitch-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
              >
                {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
              </button>
              <button
                type="button"
                onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                className="h-10 px-4 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-medium hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Subscription Plan Section */}
      <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 shadow-lg border border-surface-container-high space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stitch-primary">Current Plan</h2>
        
        <div className="bg-surface-container-high/50 rounded-xl p-4 border border-surface-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-on-surface">Starter (Free)</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-success/20 text-success rounded-full">Active</span>
            </div>
            <p className="text-sm text-on-surface-variant">Basic modules with up to 3 custom sections.</p>
          </div>
          
          <button 
            onClick={() => setShowUpgradeModal(true)}
            disabled={alreadyRequested}
            className={`shrink-0 px-4 py-2 border rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              alreadyRequested 
                ? "bg-surface-variant text-on-surface-variant border-transparent cursor-not-allowed" 
                : "bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {alreadyRequested ? "Request Pending" : (
              <>
                <Sparkles className="w-4 h-4" /> Upgrade to Pro
              </>
            )}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl bg-error-container/10 p-5 border border-error/20 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-error">Account Actions</h2>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-error/10 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center text-error shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">Sign Out</p>
            <p className="text-xs text-on-surface-variant">Sign out of this account</p>
          </div>
        </button>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-high border border-surface-variant rounded-2xl p-6 w-full max-w-md shadow-2xl relative z-50 overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 to-primary"></div>
              
              {upgradeSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Request Sent!</h3>
                  <p className="text-on-surface-variant mb-6 text-sm">
                    We have received your request to upgrade to the Professional tier. Our team will contact you shortly with the next steps.
                  </p>
                  <button 
                    onClick={() => { setShowUpgradeModal(false); setUpgradeSuccess(false); }}
                    className="w-full py-2.5 bg-surface-container text-on-surface rounded-xl font-medium hover:bg-surface-variant transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpgradeRequest} className="space-y-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Upgrade to Pro
                      </h3>
                      <p className="text-sm text-on-surface-variant mt-1">Unlock unlimited custom sections and advanced tracking.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowUpgradeModal(false)}
                      className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {upgradeError && (
                    <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
                      {upgradeError}
                    </div>
                  )}

                  <div className="space-y-3 bg-surface-container/30 p-4 rounded-xl border border-surface-variant/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Name:</span>
                      <span className="font-medium text-on-surface">{user.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Email:</span>
                      <span className="font-medium text-on-surface">{user.email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wider">Company (Optional)</label>
                    <input 
                      type="text" 
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      className="w-full h-10 px-3.5 bg-surface-container border border-surface-variant rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" 
                      placeholder="Acme Inc"
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={upgradeLoading || alreadyRequested}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      {upgradeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request ($3.69/mo)"}
                      {!upgradeLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
