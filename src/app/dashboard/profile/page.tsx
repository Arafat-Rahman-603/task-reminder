"use client";
import { formatDateLong } from "@/lib/dateUtils";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { User as UserIcon, Mail, Calendar, ShieldCheck, Edit3, X, Check, Lock, Eye, EyeOff, LogOut, Loader2, ArrowRight, Clock, Coins, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PWAInstallButton from "@/components/pwa/PWAInstallButton";
import { ImageUpload } from "@/components/ui/ImageUpload";

const SUPPORTED_CURRENCIES = [
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QR" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
];

function getTimezoneOptions(): string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    try {
      const list = Intl.supportedValuesOf("timeZone");
      if (list && list.length > 0) return list;
    } catch {
      // fallback
    }
  }
  return [
    "UTC",
    "Asia/Dhaka",
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Riyadh",
    "Asia/Singapore",
    "Asia/Bangkok",
    "Asia/Tokyo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];
}

function ProTierCrownSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M3.5 15.5h13M4.5 13l2-6.5 3.5 4 3.5-4 2 6.5h-11z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.5" cy="5" r="1.2" fill="currentColor" />
      <circle cx="10" cy="9" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function formatSubscriptionValidity(sub?: { plan?: string; status?: string; currentPeriodEnd?: string | Date }) {
  const plan = sub?.plan || "free";
  if (plan === "free") return "Lifetime Access (Free Tier)";
  if (!sub?.currentPeriodEnd) return "Active • Monthly Auto-Renewal";
  const endDate = new Date(sub.currentPeriodEnd);
  if (isNaN(endDate.getTime())) return "Active • Monthly Cycle";
  const diffDays = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const dateStr = formatDateLong(endDate);
  if (diffDays <= 0) return `Expired on ${dateStr}`;
  return `Active until ${dateStr} (${diffDays} days remaining)`;
}

interface PlanItem {
  id?: string;
  slug?: string;
  name?: string;
  price?: number | string;
  period?: string;
  description?: string;
  featureLabels?: string[];
  maxCustomSections?: number;
  maxMembers?: number;
  maxStorageMB?: number;
  isPopular?: boolean;
  [key: string]: unknown;
}

interface CustomizerConfig {
  basePrice: number;
  baseIncludedSections: number;
  pricePerSection: number;
  baseIncludedMembers: number;
  pricePerMember: number;
  baseIncludedStorageGB: number;
  pricePerGBStorage: number;
  [key: string]: unknown;
}

export default function ProfilePage() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    createdAt: string;
    preferences?: { currency?: string; timezone?: string };
    emailVerified?: string;
    avatarUrl?: string;
    avatarPublicId?: string;
    subscription?: {
      plan?: string;
      status?: string;
      currentPeriodEnd?: string | Date;
    };
    accountType?: string;
  } | null>(null);
  const { update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgType, setSaveMsgType] = useState<"success" | "error">("success");

  // Currency editing state
  const [editingCurrency, setEditingCurrency] = useState(false);
  const [newCurrency, setNewCurrency] = useState("BDT");
  const [savingCurrency, setSavingCurrency] = useState(false);

  // Timezone & Local Time editing state
  const [editingTimezone, setEditingTimezone] = useState(false);
  const [newTimezone, setNewTimezone] = useState("UTC");
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  // Upgrade & Plans state
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PlanItem | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [company, setCompany] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [_alreadyRequested, setAlreadyRequested] = useState(false);

  // Custom Plan Builder State
  const [showCustomizer, setShowCustomizer] = useState(true);
  const [customSectionsCount, setCustomSectionsCount] = useState(15);
  const [customMembersCount, setCustomMembersCount] = useState(10);
  const [customStorageGB, setCustomStorageGB] = useState(10);
  const [customNotes, setCustomNotes] = useState("");
  const [customizerConfig, setCustomizerConfig] = useState<CustomizerConfig>({
    basePrice: 4.99,
    baseIncludedSections: 3,
    pricePerSection: 0.40,
    baseIncludedMembers: 1,
    pricePerMember: 1.50,
    baseIncludedStorageGB: 1,
    pricePerGBStorage: 0.25,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        setAlreadyRequested(localStorage.getItem("upgrade_request_sent") === "true");
      }, 0);
    }
    
    Promise.all([
      fetch("/api/user/profile").then((r) => r.json()),
      fetch("/api/plans").then((r) => r.json()).catch(() => ({ plans: [] })),
    ])
      .then(([profileData, plansData]) => {
        if (profileData.user) {
          setUser(profileData.user);
          setNewName(profileData.user.name);
          setNewCurrency(profileData.user.preferences?.currency || "BDT");
          setNewTimezone(profileData.user.preferences?.timezone || "UTC");
        }
        if (plansData.plans && plansData.plans.length > 0) {
          setPlans(plansData.plans);
        }
        if (plansData.customizerConfig) {
          setCustomizerConfig(plansData.customizerConfig);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Update live clock preview for the chosen timezone
  useEffect(() => {
    const updateClock = () => {
      const activeTz = editingTimezone ? newTimezone : (user?.preferences?.timezone || "UTC");
      try {
        const str = new Intl.DateTimeFormat("en-US", {
          timeZone: activeTz,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(new Date());
        setCurrentTimeStr(str);
      } catch {
        setCurrentTimeStr("");
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [user?.preferences?.timezone, editingTimezone, newTimezone]);

  const showMessage = (msg: string, type: "success" | "error" = "success") => {
    setSaveMsg(msg);
    setSaveMsgType(type);
    setTimeout(() => setSaveMsg(""), 3500);
  };

  const handleSaveCurrency = async (curr?: string) => {
    const val = (curr || newCurrency || "BDT").toUpperCase();
    setSavingCurrency(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: val }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(u => u ? { ...u, preferences: { ...u.preferences, currency: val } } : null);
        setNewCurrency(val);
        setEditingCurrency(false);
        showMessage("Currency preference saved permanently");
      } else {
        showMessage(data.error || "Failed to update currency", "error");
      }
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleSaveTimezone = async (tz?: string) => {
    const val = tz || newTimezone || "UTC";
    setSavingTimezone(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: val }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(u => u ? { ...u, preferences: { ...u.preferences, timezone: val } } : null);
        setNewTimezone(val);
        setEditingTimezone(false);
        showMessage("Local time & timezone saved permanently");
      } else {
        showMessage(data.error || "Failed to update timezone", "error");
      }
    } finally {
      setSavingTimezone(false);
    }
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
        if (updateSession) {
          updateSession({ name: newName.trim() }).catch(() => {});
        }
        showMessage("Name updated successfully");
      } else {
        showMessage(data.error || "Failed to update name", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (url: string, publicId: string) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url, avatarPublicId: publicId }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(u => u ? { ...u, avatarUrl: url, avatarPublicId: publicId } : null);
        if (updateSession) {
          updateSession({ image: url }).catch(() => {});
        }
        showMessage("Profile picture updated");
      } else {
        showMessage(data.error || "Failed to update profile picture", "error");
      }
    } catch {
      showMessage("Error updating profile picture", "error");
    }
  };

  const _handleAvatarRemove = async () => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null, avatarPublicId: null }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(u => u ? { ...u, avatarUrl: undefined, avatarPublicId: undefined } : null);
        showMessage("Profile picture removed");
      } else {
        showMessage(data.error || "Failed to remove profile picture", "error");
      }
    } catch {
      showMessage("Error removing profile picture", "error");
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
      const basePrice = Number(customizerConfig?.basePrice) || 4.99;
      const baseSections = Number(customizerConfig?.baseIncludedSections) || 3;
      const pricePerSec = Number(customizerConfig?.pricePerSection) || 0.40;
      const baseMembers = Number(customizerConfig?.baseIncludedMembers) || 1;
      const pricePerMem = Number(customizerConfig?.pricePerMember) || 1.50;
      const baseStorage = Number(customizerConfig?.baseIncludedStorageGB) || 1;
      const pricePerGB = Number(customizerConfig?.pricePerGBStorage) || 0.25;

      const customSectionsPrice = Math.max(0, customSectionsCount - baseSections) * pricePerSec;
      const customMembersPrice = Math.max(0, customMembersCount - baseMembers) * pricePerMem;
      const customStoragePrice = Math.max(0, customStorageGB - baseStorage) * pricePerGB;

      const currentCustomizerPrice = (
        basePrice +
        customSectionsPrice +
        customMembersPrice +
        customStoragePrice
      ).toFixed(2);

      const planName = selectedPlanForUpgrade?.name || (showCustomizer ? `Custom Tailored (${customSectionsCount} Sections, ${customMembersCount} Members, ${customStorageGB}GB)` : "Professional");
      const planPrice = selectedPlanForUpgrade?.price || (showCustomizer ? `$${currentCustomizerPrice}` : "$3.69");
      const planPriceNum = parseFloat(String(planPrice).replace(/[^0-9.]/g, '')) || 0;

      const customPayload = showCustomizer
        ? {
            customSections: customSectionsCount,
            members: customMembersCount,
            storageGB: customStorageGB,
            notes: customNotes,
            estimatedPrice: currentCustomizerPrice,
          }
        : undefined;

      const res = await fetch("/api/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          company,
          plan: planName,
          price: planPrice,
          priceNum: planPriceNum,
          customDetails: customPayload,
        }),
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
    } catch (err: unknown) {
      setUpgradeError(err instanceof Error ? err.message : "Failed to send request");
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
    <div className="w-full min-h-full max-w-5xl mx-auto px-2 sm:px-4 space-y-6 pb-12">
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
        <div className="relative z-10 shrink-0 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-surface-container-high shadow-inner flex items-center justify-center border-2 border-stitch-primary/30 overflow-hidden relative group">
            {user.avatarPublicId || user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarPublicId ? `/api/assets/${user.avatarPublicId}?resourceType=image` : user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl sm:text-4xl font-bold text-stitch-primary tracking-tight">
                {user.name?.trim().split(/\s+/).filter(Boolean).map((p: string) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 z-20">
            <ImageUpload
              folder="manageo/avatars"
              onUploadSuccess={handleAvatarUpload}
              variant="icon"
              label="Update profile picture"
            />
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

        {/* Currency Item */}
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0 mt-0.5">
            <Coins className="w-4 h-4 text-stitch-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Currency</p>
              {!editingCurrency && (
                <button
                  type="button"
                  onClick={() => {
                    setNewCurrency(user.preferences?.currency || "BDT");
                    setEditingCurrency(true);
                  }}
                  className="px-2 py-0.5 rounded-lg text-xs font-medium text-stitch-primary hover:bg-stitch-primary/10 transition-colors flex items-center gap-1"
                  title="Change currency"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              )}
            </div>

            {editingCurrency ? (
              <div className="space-y-2 mt-1.5">
                <div className="flex items-center gap-2">
                  <select
                    value={newCurrency}
                    onChange={e => setNewCurrency(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-xl bg-surface-container-high text-on-surface text-sm border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-stitch-primary cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </option>
                    ))}
                    {!SUPPORTED_CURRENCIES.some(c => c.code === newCurrency) && (
                      <option value={newCurrency}>{newCurrency}</option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSaveCurrency()}
                    disabled={savingCurrency}
                    className="w-9 h-9 rounded-xl bg-stitch-primary text-on-primary flex items-center justify-center hover:bg-primary-fixed-dim transition-colors shrink-0 disabled:opacity-50"
                    title="Save currency"
                  >
                    {savingCurrency ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCurrency(false);
                      setNewCurrency(user.preferences?.currency || "BDT");
                    }}
                    className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:text-on-surface transition-colors shrink-0"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Select your default currency. It will stay selected unless you change it here.
                </p>
              </div>
            ) : (
              <div className="mt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-on-surface">
                    {user.preferences?.currency || "BDT"}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {SUPPORTED_CURRENCIES.find(c => c.code === (user.preferences?.currency || "BDT"))?.name 
                      ? `(${SUPPORTED_CURRENCIES.find(c => c.code === (user.preferences?.currency || "BDT"))?.name} - ${SUPPORTED_CURRENCIES.find(c => c.code === (user.preferences?.currency || "BDT"))?.symbol})`
                      : ""}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-0.5">
                  Default currency for financial balances, invoices & accounts.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-surface-container-high"></div>

        {/* Local Time & Timezone Item */}
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0 mt-0.5">
            <Clock className="w-4 h-4 text-stitch-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Local Time & Timezone</p>
              {!editingTimezone && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTimezone(user.preferences?.timezone || "UTC");
                    setEditingTimezone(true);
                  }}
                  className="px-2 py-0.5 rounded-lg text-xs font-medium text-stitch-primary hover:bg-stitch-primary/10 transition-colors flex items-center gap-1"
                  title="Change timezone"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              )}
            </div>

            {editingTimezone ? (
              <div className="space-y-2 mt-1.5">
                <div className="flex items-center gap-2">
                  <select
                    value={newTimezone}
                    onChange={e => setNewTimezone(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-xl bg-surface-container-high text-on-surface text-sm border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-stitch-primary cursor-pointer"
                  >
                    {getTimezoneOptions().map(tz => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSaveTimezone()}
                    disabled={savingTimezone}
                    className="w-9 h-9 rounded-xl bg-stitch-primary text-on-primary flex items-center justify-center hover:bg-primary-fixed-dim transition-colors shrink-0 disabled:opacity-50"
                    title="Save timezone"
                  >
                    {savingTimezone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTimezone(false);
                      setNewTimezone(user.preferences?.timezone || "UTC");
                    }}
                    className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:text-on-surface transition-colors shrink-0"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {currentTimeStr && (
                  <p className="text-xs text-stitch-primary font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Live clock in chosen zone:</span>
                    <span className="font-mono font-bold bg-surface-container-high px-2 py-0.5 rounded-md text-on-surface">{currentTimeStr}</span>
                  </p>
                )}
                <p className="text-[11px] text-on-surface-variant">
                  Select your city/timezone. It will stay selected unless you change it here.
                </p>
              </div>
            ) : (
              <div className="mt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-on-surface">
                    {user.preferences?.timezone || "UTC"}
                  </span>
                  {currentTimeStr && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container-high font-mono text-stitch-primary font-semibold border border-stitch-primary/20">
                      {currentTimeStr}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-0.5">
                  Controls your dashboard greetings, daily summaries & schedule calculations.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-surface-container-high"></div>

        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Member Since</p>
            <p className="text-sm font-medium text-on-surface" suppressHydrationWarning>
              {user.createdAt ? formatDateLong(user.createdAt) : "N/A"}
            </p>
          </div>
        </div>

        <div className="h-px bg-surface-container-high"></div>

        {/* Subscription & Active Period */}
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary shrink-0 mt-0.5">
            <Crown className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Current Subscription
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-stitch-primary/20 text-stitch-primary border border-stitch-primary/30">
                {user.subscription?.plan || "free"}
              </span>
            </div>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-white">
                Status: <strong className="text-emerald-400 capitalize">{user.subscription?.status || "active"}</strong>
              </span>
              <span className="font-mono text-stitch-primary font-medium">
                {formatSubscriptionValidity(user.subscription)}
              </span>
            </div>
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

      {/* Subscription Plans & Pricing Section */}
      <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 shadow-lg border border-surface-container-high space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container-high pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-stitch-primary flex items-center gap-2">
              <ProTierCrownSvg className="w-4 h-4 text-stitch-primary" />
              <span>Available Subscription Plans</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Choose or customize the ideal plan for your individual productivity or team workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stitch-primary/40 bg-stitch-primary/10 text-stitch-primary hover:bg-stitch-primary/20 transition-all self-start sm:self-auto"
          >
            {showCustomizer ? "Hide Custom Plan Builder" : "⚙️ Customize Tailored Plan"}
          </button>
        </div>

        {/* Custom Plan Builder Accordion */}
        {showCustomizer && (() => {
          const basePrice = Number(customizerConfig.basePrice) || 4.99;
          const baseSections = Number(customizerConfig.baseIncludedSections) || 3;
          const pricePerSec = Number(customizerConfig.pricePerSection) || 0.40;
          const baseMembers = Number(customizerConfig.baseIncludedMembers) || 1;
          const pricePerMem = Number(customizerConfig.pricePerMember) || 1.50;
          const baseStorage = Number(customizerConfig.baseIncludedStorageGB) || 1;
          const pricePerGB = Number(customizerConfig.pricePerGBStorage) || 0.25;

          const customSectionsPrice = Math.max(0, customSectionsCount - baseSections) * pricePerSec;
          const customMembersPrice = Math.max(0, customMembersCount - baseMembers) * pricePerMem;
          const customStoragePrice = Math.max(0, customStorageGB - baseStorage) * pricePerGB;

          const estimatedMonthlyPrice = (
            basePrice +
            customSectionsPrice +
            customMembersPrice +
            customStoragePrice
          ).toFixed(2);

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-high/60 border border-stitch-primary/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Custom Tailored Workspace Plan</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stitch-primary/20 text-stitch-primary uppercase font-bold">
                      Customizer
                    </span>
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Configure custom resource limits specifically tailored for your organization.
                  </p>
                </div>

                {/* Real-Time Dynamic Pricing Pill */}
                <div className="px-4 py-2 rounded-xl bg-stitch-primary/15 border border-stitch-primary/30 self-start sm:self-auto text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Cost</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-stitch-primary">${estimatedMonthlyPrice}</span>
                    <span className="text-xs text-slate-300">/month</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium flex justify-between">
                    <span>Custom Sections:</span>
                    <strong className="text-white font-mono">{customSectionsCount}</strong>
                  </label>
                  <input
                    type="range"
                    min={baseSections}
                    max={100}
                    step={1}
                    value={customSectionsCount}
                    onChange={(e) => setCustomSectionsCount(Number(e.target.value))}
                    className="w-full accent-stitch-primary cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Base {baseSections} included (+${customSectionsPrice.toFixed(2)}) • ${pricePerSec.toFixed(2)}/extra
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium flex justify-between">
                    <span>Team Members:</span>
                    <strong className="text-white font-mono">{customMembersCount}</strong>
                  </label>
                  <input
                    type="range"
                    min={baseMembers}
                    max={150}
                    step={1}
                    value={customMembersCount}
                    onChange={(e) => setCustomMembersCount(Number(e.target.value))}
                    className="w-full accent-stitch-primary cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Base {baseMembers} included (+${customMembersPrice.toFixed(2)}) • ${pricePerMem.toFixed(2)}/extra
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium flex justify-between">
                    <span>Cloud Storage:</span>
                    <strong className="text-white font-mono">{customStorageGB} GB</strong>
                  </label>
                  <input
                    type="range"
                    min={baseStorage}
                    max={100}
                    step={1}
                    value={customStorageGB}
                    onChange={(e) => setCustomStorageGB(Number(e.target.value))}
                    className="w-full accent-stitch-primary cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Base {baseStorage} GB included (+${customStoragePrice.toFixed(2)}) • ${pricePerGB.toFixed(2)}/extra GB
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                  Special Requirements / Organization Notes
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Mention any custom integrations, SSO, or workflow needs..."
                  className="w-full p-2.5 rounded-xl bg-surface-container border border-surface-variant text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-white">Pricing Breakdown:</span> Base ${basePrice.toFixed(2)} + extra sections (${pricePerSec.toFixed(2)}/ea), members (${pricePerMem.toFixed(2)}/ea) & storage (${pricePerGB.toFixed(2)}/GB).
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanForUpgrade({
                      name: `Custom Tailored (${customSectionsCount} Sections, ${customMembersCount} Members, ${customStorageGB}GB)`,
                      price: `$${estimatedMonthlyPrice}`,
                      period: "/month",
                      description: `Custom quota: ${customSectionsCount} Custom Sections, ${customMembersCount} Team Members, ${customStorageGB} GB Storage`,
                    });
                    setShowUpgradeModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all"
                >
                  <span>Request Custom Plan (${estimatedMonthlyPrice}/mo)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* All Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(plans.length > 0 ? plans : [
            {
              slug: "free",
              name: "Starter",
              price: "$0",
              period: "/month",
              description: "Complete Manageo for individuals organizing daily life and tasks.",
              maxCustomSections: 3,
              maxMembers: 5,
              maxStorageMB: 100,
              featureLabels: ["3 Custom Database Sections", "Up to 5 Collaborators", "100 MB Cloud Storage"],
            },
            {
              slug: "pro",
              name: "Professional",
              price: "$3.69",
              period: "/month",
              description: "Designed for team owners and power users who need advanced workflows.",
              maxCustomSections: 10,
              maxMembers: 10,
              maxStorageMB: 5120,
              featureLabels: ["10 Custom Database Sections", "Up to 10 Team Members", "5 GB Cloud Storage", "Priority Support"],
            },
            {
              slug: "enterprise",
              name: "Enterprise",
              price: "Custom",
              period: "",
              description: "High-scale workspace governance, custom limits, and SLA.",
              maxCustomSections: 100,
              maxMembers: 99999,
              maxStorageMB: 51200,
              featureLabels: ["100 Custom Sections", "Unlimited Members", "50 GB Cloud Storage", "Dedicated SLA"],
            },
          ]).map((plan: PlanItem) => {
            const currentPlanSlug = user?.subscription?.plan || "free";
            const isCurrentPlan = currentPlanSlug.toLowerCase() === (plan.slug || "").toLowerCase();

            // Safe period formatting
            const cleanPeriod = (() => {
              if (!plan.period) return plan.price === "Custom" ? "" : "/month";
              const p = plan.period.trim().toLowerCase();
              if (p === "/for" || p.startsWith("/for")) return "/month";
              if (p === "/mo" || p === "/month") return "/month";
              if (p.startsWith("/")) return p;
              return `/${p}`;
            })();

            return (
              <div
                key={plan.slug || plan.name}
                className={`rounded-xl p-4 flex flex-col justify-between transition-all ${
                  isCurrentPlan
                    ? "bg-stitch-primary/10 border-2 border-stitch-primary shadow-[0_0_15px_rgba(125,211,252,0.15)]"
                    : "bg-surface-container-high/40 border border-surface-variant/40 hover:border-surface-variant hover:bg-surface-container-high/60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-on-surface">{plan.name}</h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                        {plan.description}
                      </p>
                    </div>
                    {isCurrentPlan && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                    {cleanPeriod && (
                      <span className="text-xs text-on-surface-variant font-medium">{cleanPeriod}</span>
                    )}
                  </div>

                  {/* Limits Badges */}
                  <div className="space-y-1.5 pt-2 border-t border-surface-variant/30 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-stitch-primary shrink-0" />
                      <span>{plan.maxCustomSections} Custom Sections</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-stitch-primary shrink-0" />
                      <span>{(plan.maxMembers ?? 0) > 1000 ? "Unlimited" : `Up to ${plan.maxMembers ?? 0}`} Members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-stitch-primary shrink-0" />
                      <span>
                        {(plan.maxStorageMB ?? 0) >= 1024
                          ? `${Math.round((plan.maxStorageMB ?? 0) / 1024)} GB Storage`
                          : `${plan.maxStorageMB ?? 0} MB Storage`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-surface-variant/30 space-y-2">
                  {isCurrentPlan ? (
                    <div className="space-y-2">
                      <div className="w-full py-2 text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        ✓ Current Active Plan
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-container/80 border border-surface-variant/50 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-stitch-primary shrink-0" />
                          <span className="font-semibold uppercase tracking-wider text-[10px]">Validity Period</span>
                        </div>
                        <div className="font-mono text-emerald-300 font-semibold text-xs leading-relaxed break-words pl-5">
                          {formatSubscriptionValidity(user.subscription)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanForUpgrade(plan);
                        setShowUpgradeModal(true);
                      }}
                      className="w-full py-2 rounded-lg text-xs font-bold bg-stitch-primary text-black hover:bg-white transition-all shadow-[0_0_10px_rgba(125,211,252,0.2)]"
                    >
                      Upgrade to {plan.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
                    We have received your request for the <strong>{selectedPlanForUpgrade?.name || "selected"}</strong> tier. Our administration team has been notified. You can submit another request or adjust specs whenever needed.
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
                        <ProTierCrownSvg className="w-5 h-5 text-primary" />
                        Upgrade to {selectedPlanForUpgrade?.name || "Professional"}
                      </h3>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {selectedPlanForUpgrade?.description || "Unlock higher limits and custom workflows."}
                      </p>
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
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Selected Plan:</span>
                      <span className="font-bold text-stitch-primary">
                        {selectedPlanForUpgrade?.name || "Professional"} ({selectedPlanForUpgrade?.price || "$3.69"}{selectedPlanForUpgrade?.period || ""})
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wider">Company / Team (Optional)</label>
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
                      disabled={upgradeLoading}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {upgradeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Submit Request (${selectedPlanForUpgrade?.price || "$3.69"})`}
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
