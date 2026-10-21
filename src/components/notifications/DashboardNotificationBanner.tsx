"use client";

import { useState } from "react";
import {
  BellRing,
  ArrowRight,
  Loader2,
  Share,
  PlusSquare,
  Smartphone,
  AlertCircle,
  HelpCircle,
  X,
} from "lucide-react";
import { useNotificationHealth } from "@/hooks/useNotificationHealth";
import { initFirebasePush } from "@/lib/notifications/firebase-client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function DashboardNotificationBanner() {
  const router = useRouter();
  const { health, refresh } = useNotificationHealth();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDeniedModal, setShowDeniedModal] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id;

  // Do NOT show if notifications are healthy
  if (health.status === "HEALTHY") {
    return null;
  }

  // Handle direct enable for standard browsers / PWA
  const handleTurnOn = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          // Immediately update user preferences on server
          await fetch("/api/notifications/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pushEnabled: true }),
          }).catch(console.error);

          // Safely attempt Firebase sync with 3.5s maximum timeout
          if (userId) {
            await Promise.race([
              initFirebasePush(userId),
              new Promise((resolve) => setTimeout(resolve, 3500)),
            ]).catch(console.error);
          }

          await refresh();
          return;
        } else if (perm === "denied") {
          await refresh();
          setShowDeniedModal(true);
          return;
        }
      }

      router.push("/dashboard/settings/notifications");
    } catch (e) {
      console.error("Failed to enable notifications from banner:", e);
      router.push("/dashboard/settings/notifications");
    } finally {
      setLoading(false);
    }
  };

  // State 1: iOS Safari - Add to Home Screen required for Web Push
  if (health.status === "IOS_PWA_REQUIRED" || (health.isIOS && !health.isPWA)) {
    return (
      <>
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-surface-container to-surface-container-high border border-amber-500/30 p-4 sm:p-5 mb-2 shadow-lg transition-all">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-on-surface">
                    iPhone / iPad-এ ব্যাকগ্রাউন্ড নোটিফিকেশন সেটআপ
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                    iOS 16.4+
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Apple-এর সিকিউরিটি পলিসি অনুসারে সাফারি ব্রাউজার বন্ধ থাকা অবস্থায় পুশ রিসিভ করতে Manageo-কে হোম স্ক্রিনে যুক্ত (PWA) করতে হবে।
                </p>

                {/* Step badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container border border-surface-variant/30 text-xs text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      ট্যাপ করুন <Share className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Share
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container border border-surface-variant/30 text-xs text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      <PlusSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Add to Home Screen
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container border border-surface-variant/30 text-xs text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <span className="truncate">হোম অ্যাপ থেকে Allow করুন</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full lg:w-auto self-end lg:self-center shrink-0 pt-2 lg:pt-0">
              <button
                onClick={() => setShowIOSModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-bold transition-all shadow-md min-h-[40px] whitespace-nowrap"
              >
                <span>সহজ গাইড দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal for detailed iOS installation steps */}
        {showIOSModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
            onClick={() => setShowIOSModal(false)}
          >
            <div
              className="bg-stitch-surface border border-surface-variant/40 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-variant/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">iPhone-এ নোটিফিকেশন চালু করার নিয়ম</h3>
                    <p className="text-xs text-on-surface-variant">Apple Web Push Setup Guide</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-on-surface">
                <div className="p-3.5 rounded-xl bg-surface-container border border-surface-variant/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>কেন এই ধাপটি প্রয়োজন?</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    অ্যাপলের সিকিউরিটি আর্কিটেকচার অনুযায়ী, সাফারি ব্রাউজারের সাধারণ ট্যাব বন্ধ থাকলে পুশ ডেলিভারি বন্ধ হয়ে যায়। কিন্তু ম্যানেজিওকে হোম স্ক্রিনে অ্যাড করলে এটি একটি পূর্ণাঙ্গ নেটিভ অ্যাপ (PWA) হিসেবে কাজ করে এবং ব্রাউজার পুরোপুরি বন্ধ থাকলেও পুশ অ্যালার্ট পাঠাতে পারে।
                  </p>
                </div>

                <ol className="space-y-3 pl-1">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="block text-on-surface">সাফারির Share বাটনে চাপুন</strong>
                      <span className="text-xs text-on-surface-variant">সাফারি ব্রাউজারের নিচে থাকা শেয়ার আইকন <Share className="w-3.5 h-3.5 inline mx-1 text-amber-400" /> চাপুন।</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="block text-on-surface">&quot;Add to Home Screen&quot; নির্বাচন করুন</strong>
                      <span className="text-xs text-on-surface-variant">মেনু স্ক্রোল করে <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-amber-400" /> <strong>Add to Home Screen</strong> এ ক্লিক করে উপরে ডানপাশে <strong>Add</strong> চাপুন।</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="block text-on-surface">হোম স্ক্রিন থেকে Manageo ওপেন করুন</strong>
                      <span className="text-xs text-on-surface-variant">আপনার ফোনের হোম স্ক্রিনে ম্যানেজিওর আইকন দেখতে পাবেন। সেটি ওপেন করে নোটিফিকেশন পারমিশন &quot;Allow&quot; দিন।</span>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="pt-3 border-t border-surface-variant/30 flex justify-end">
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="px-4 py-2 rounded-xl bg-stitch-primary hover:bg-primary-fixed-dim text-on-primary text-xs font-semibold transition-colors"
                >
                  বুঝেছি (Got it)
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // State 2: Permission Blocked in Browser Settings
  if (health.status === "PERMISSION_DENIED") {
    return (
      <>
        <div className="relative w-full overflow-hidden rounded-2xl bg-error/10 border border-error/25 p-4 sm:p-5 mb-2 shadow-lg transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="p-2.5 rounded-xl bg-error/20 text-error shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                  নোটিফিকেশন পারমিশন ব্লক করা আছে (Notifications Blocked)
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 leading-relaxed">
                  আপনার ব্রাউজার থেকে ম্যানেজিওর নোটিফিকেশন ব্লক করা রয়েছে। রিমাইন্ডার ও আপডেট পেতে ব্রাউজার সেটিংসে গিয়ে পারমিশন চালু করুন।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto self-end sm:self-center shrink-0">
              <button
                onClick={() => setShowDeniedModal(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container border border-surface-variant hover:bg-surface-variant text-on-surface text-xs sm:text-sm font-semibold transition-all min-h-[40px] whitespace-nowrap"
              >
                <span>কীভাবে আনব্লক করবেন</span>
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              </button>
              <button
                onClick={refresh}
                className="p-2.5 rounded-xl bg-surface-container border border-surface-variant text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
                title="পুনরায় যাচাই করুন"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal for Unblocking Notifications */}
        {showDeniedModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
            onClick={() => setShowDeniedModal(false)}
          >
            <div
              className="bg-stitch-surface border border-surface-variant/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-variant/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-error" />
                  <h3 className="text-base font-bold text-on-surface">নোটিফিকেশন আনব্লক করার নিয়ম</h3>
                </div>
                <button
                  onClick={() => setShowDeniedModal(false)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-on-surface">
                <div className="p-3 rounded-xl bg-surface-container border border-surface-variant/30 space-y-2">
                  <p className="font-semibold text-on-surface">Google Chrome / Edge:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-on-surface-variant text-xs">
                    <li>অ্যাড্রেস বারের শুরুতে থাকা লক (🔒) বা টিউন আইকনে ক্লিক করুন।</li>
                    <li><strong>Permissions</strong> বা <strong>Notifications</strong> অপশনে যান।</li>
                    <li>সেটিকে <strong>Allow</strong> সিলেক্ট করুন।</li>
                    <li>পেজটি রিলোড দিন।</li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl bg-surface-container border border-surface-variant/30 space-y-2">
                  <p className="font-semibold text-on-surface">Android Phone:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-on-surface-variant text-xs">
                    <li>ক্রোমের ৩-ডট মেনু → <strong>Settings</strong> এ যান।</li>
                    <li><strong>Site settings</strong> → <strong>Notifications</strong> সিলেক্ট করুন।</li>
                    <li>ম্যানেজিও সাইটটি আনব্লক করে Allow করুন।</li>
                  </ol>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-variant/30 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDeniedModal(false);
                    refresh();
                  }}
                  className="px-4 py-2 rounded-xl bg-stitch-primary hover:bg-primary-fixed-dim text-on-primary text-xs font-semibold transition-colors"
                >
                  ঠিক করা হয়েছে (Check Again)
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // State 3: Standard Turn On Prompt (Desktop, Android, PWA, or default permission)
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 sm:p-5 mb-2 shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
              নোটিফিকেশন পারমিশন চালু করুন (Enable Notifications)
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 leading-relaxed">
              টাস্কের সময়সীমা, রুটিন এবং ডেইলি রিমাইন্ডার ব্যাকগ্রাউন্ডে বা অ্যাপ বন্ধ থাকা অবস্থায় পেতে নোটিফিকেশন অন করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto self-end sm:self-center shrink-0">
          <button
            onClick={handleTurnOn}
            disabled={loading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-bold transition-all shadow-md disabled:opacity-75 min-h-[40px] whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>চালু করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>নোটিফিকেশন অন করুন</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
