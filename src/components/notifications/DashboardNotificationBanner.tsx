"use client";

import { useEffect, useState } from "react";
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
import { readActiveClientLanguage } from "@/lib/client-language";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function DashboardNotificationBanner() {
  const router = useRouter();
  const { health, isChecking, refresh } = useNotificationHealth();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDeniedModal, setShowDeniedModal] = useState(false);
  const [isBengali, setIsBengali] = useState(() =>
    typeof window !== "undefined" ? readActiveClientLanguage("en") === "bn" : false
  );

  useEffect(() => {
    const sync = () => setIsBengali(readActiveClientLanguage("en") === "bn");
    const onLangUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<{ lang?: string }>).detail;
      if (detail?.lang) setIsBengali(detail.lang === "bn");
    };
    const timer = setTimeout(sync, 0);
    window.addEventListener("manageo-language-updated", onLangUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("manageo-language-updated", onLangUpdate);
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id;

  // Do NOT show if still checking, or if notifications are healthy, or unknown initial status
  if (isChecking || health.status === "HEALTHY" || health.status === "UNKNOWN_ERROR") {
    return null;
  }

  // If the browser already has notification permission granted, never prompt to enable
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    return null;
  }

  // Handle direct enable for standard browsers / PWA
  const handleTurnOn = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          await fetch("/api/notifications/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pushEnabled: true }),
          }).catch(console.error);

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
  if (health.status === "IOS_PWA_REQUIRED") {
    return (
      <>
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-surface-container to-surface-container-high border border-amber-500/30 p-4 sm:p-5 mb-2 shadow-lg transition-all">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-on-surface">
                    {isBengali
                      ? "iPhone / iPad-এ ব্যাকগ্রাউন্ড নোটিফিকেশন সেটআপ"
                      : "Background Notification Setup on iPhone / iPad"}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                    iOS 16.4+
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {isBengali
                    ? "Apple-এর সিকিউরিটি পলিসি অনুসারে সাফারি ব্রাউজার বন্ধ থাকা অবস্থায় পুশ রিসিভ করতে Manageo-কে হোম স্ক্রিনে যুক্ত (PWA) করতে হবে।"
                    : "Due to Apple Safari security rules, add Manageo to your Home Screen (PWA) to receive push alerts when Safari is closed."}
                </p>

                {/* Step badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      {isBengali ? "ট্যাপ করুন" : "Tap"}{" "}
                      <Share className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" /> Share
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      <PlusSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" /> Add to Home Screen
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <span className="truncate">
                      {isBengali ? "হোম অ্যাপ থেকে Allow করুন" : "Open Home app & tap Allow"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full lg:w-auto self-end lg:self-center shrink-0 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => setShowIOSModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-bold transition-all shadow-md min-h-[40px] whitespace-nowrap"
              >
                <span>{isBengali ? "সহজ গাইড দেখুন" : "View Setup Guide"}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
              className="bg-surface-container border border-surface-container-high rounded-2xl p-6 max-w-lg w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Smartphone className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">
                      {isBengali ? "iPhone-এ নোটিফিকেশন চালু করার নিয়ম" : "Enable Notifications on iPhone"}
                    </h3>
                    <p className="text-xs text-on-surface-variant">Apple Web Push Setup Guide</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  aria-label="Close guide"
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-on-surface">
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                    <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{isBengali ? "কেন এই ধাপটি প্রয়োজন?" : "Why is this step needed?"}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {isBengali
                      ? "অ্যাপলের সিকিউরিটি আর্কিটেকচার অনুযায়ী, সাফারি ব্রাউজারের সাধারণ ট্যাব বন্ধ থাকলে পুশ ডেলিভারি বন্ধ হয়ে যায়। কিন্তু ম্যানেজিওকে হোম স্ক্রিনে অ্যাড করলে এটি একটি পূর্ণাঙ্গ নেটিভ অ্যাপ (PWA) হিসেবে কাজ করে এবং ব্রাউজার পুরোপুরি বন্ধ থাকলেও পুশ অ্যালার্ট পাঠাতে পারে।"
                      : "On iOS, regular browser tabs cannot receive background push notifications once closed. Adding Manageo to your Home Screen turns it into an installed web app (PWA) so alerts arrive reliably."}
                  </p>
                </div>

                <ol className="space-y-3 pl-1">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="block text-on-surface">
                        {isBengali ? "সাফারির Share বাটনে চাপুন" : "Tap Safari's Share button"}
                      </strong>
                      <span className="text-xs text-on-surface-variant">
                        {isBengali ? (
                          <>সাফারি ব্রাউজারের নিচে থাকা শেয়ার আইকন <Share className="w-3.5 h-3.5 inline mx-1 text-amber-600 dark:text-amber-400" aria-hidden="true" /> চাপুন।</>
                        ) : (
                          <>Tap the Share icon <Share className="w-3.5 h-3.5 inline mx-1 text-amber-600 dark:text-amber-400" aria-hidden="true" /> in the Safari toolbar.</>
                        )}
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="block text-on-surface">
                        {isBengali ? '"Add to Home Screen" নির্বাচন করুন' : 'Select "Add to Home Screen"'}
                      </strong>
                      <span className="text-xs text-on-surface-variant">
                        {isBengali ? (
                          <>মেনু স্ক্রোল করে <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-amber-600 dark:text-amber-400" aria-hidden="true" /> <strong>Add to Home Screen</strong> এ ক্লিক করে উপরে ডানপাশে <strong>Add</strong> চাপুন।</>
                        ) : (
                          <>Scroll and choose <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-amber-600 dark:text-amber-400" aria-hidden="true" /> <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</>
                        )}
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="block text-on-surface">
                        {isBengali ? "হোম স্ক্রিন থেকে Manageo ওপেন করুন" : "Open Manageo from your Home Screen"}
                      </strong>
                      <span className="text-xs text-on-surface-variant">
                        {isBengali
                          ? 'আপনার ফোনের হোম স্ক্রিনে ম্যানেজিওর আইকন দেখতে পাবেন। সেটি ওপেন করে নোটিফিকেশন পারমিশন "Allow" দিন।'
                          : 'Launch the Manageo icon from your Home Screen and tap "Allow" when prompted for notifications.'}
                      </span>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="pt-3 border-t border-surface-container-high flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:brightness-105 transition-colors"
                >
                  {isBengali ? "বুঝেছি (Got it)" : "Got it"}
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
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                  {isBengali ? "নোটিফিকেশন পারমিশন ব্লক করা আছে (Notifications Blocked)" : "Notifications Blocked"}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 leading-relaxed">
                  {isBengali
                    ? "আপনার ব্রাউজার থেকে ম্যানেজিওর নোটিফিকেশন ব্লক করা রয়েছে। রিমাইন্ডার ও আপডেট পেতে ব্রাউজার সেটিংসে গিয়ে পারমিশন চালু করুন।"
                    : "Browser notifications are blocked for Manageo. Allow notification permissions in your browser site settings to receive task and routine reminders."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setShowDeniedModal(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold transition-all min-h-[40px] whitespace-nowrap"
              >
                <span>{isBengali ? "কীভাবে আনব্লক করবেন" : "How to Unblock"}</span>
                <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={refresh}
                aria-label={isBengali ? "পুনরায় যাচাই করুন" : "Check notification permission again"}
                className="p-2.5 rounded-xl bg-surface-container border border-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                title={isBengali ? "পুনরায় যাচাই করুন" : "Check again"}
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
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
              className="bg-surface-container border border-surface-container-high rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-error" aria-hidden="true" />
                  <h3 className="text-base font-bold text-on-surface">
                    {isBengali ? "নোটিফিকেশন আনব্লক করার নিয়ম" : "How to Unblock Notifications"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeniedModal(false)}
                  aria-label="Close modal"
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-on-surface">
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
                  <p className="font-semibold text-on-surface">Google Chrome / Edge:</p>
                  {isBengali ? (
                    <ol className="list-decimal pl-4 space-y-1 text-on-surface-variant text-xs">
                      <li>অ্যাড্রেস বারের শুরুতে থাকা লক বা টিউন আইকনে ক্লিক করুন।</li>
                      <li><strong>Permissions</strong> বা <strong>Notifications</strong> অপশনে যান।</li>
                      <li>সেটিকে <strong>Allow</strong> সিলেক্ট করুন।</li>
                      <li>পেজটি রিলোড দিন।</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal pl-4 space-y-1 text-on-surface-variant text-xs">
                      <li>Click the lock or tune icon at the left of the address bar.</li>
                      <li>Open <strong>Permissions</strong> or <strong>Notifications</strong>.</li>
                      <li>Switch it to <strong>Allow</strong> and reload this page.</li>
                    </ol>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
                  <p className="font-semibold text-on-surface">Android Phone:</p>
                  {isBengali ? (
                    <ol className="list-decimal pl-4 space-y-1 text-on-surface-variant text-xs">
                      <li>ক্রোমের ৩-ডট মেনু → <strong>Settings</strong> এ যান।</li>
                      <li><strong>Site settings</strong> → <strong>Notifications</strong> সিলেক্ট করুন।</li>
                      <li>ম্যানেজিও সাইটটি আনব্লক করে Allow করুন।</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal pl-4 space-y-1 text-on-surface-variant text-xs">
                      <li>Open Chrome 3-dot menu → <strong>Settings</strong>.</li>
                      <li>Go to <strong>Site settings</strong> → <strong>Notifications</strong>.</li>
                      <li>Select Manageo and allow notifications.</li>
                    </ol>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-container-high flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeniedModal(false);
                    refresh();
                  }}
                  className="px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:brightness-105 transition-colors"
                >
                  {isBengali ? "ঠিক করা হয়েছে (Check Again)" : "Check Again"}
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
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <BellRing className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
              {isBengali ? "নোটিফিকেশন পারমিশন চালু করুন (Enable Notifications)" : "Enable Notifications"}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 leading-relaxed">
              {isBengali
                ? "টাস্কের সময়সীমা, রুটিন এবং ডেইলি রিমাইন্ডার ব্যাকগ্রাউন্ডে বা অ্যাপ বন্ধ থাকা অবস্থায় পেতে নোটিফিকেশন অন করুন।"
                : "Turn on notifications to receive task deadlines, routine alerts, and daily reminders even when Manageo is running in the background."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleTurnOn}
            disabled={loading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-bold transition-all shadow-md disabled:opacity-75 min-h-[40px] whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                <span>{isBengali ? "চালু করা হচ্ছে..." : "Enabling..."}</span>
              </>
            ) : (
              <>
                <span>{isBengali ? "নোটিফিকেশন অন করুন" : "Enable Notifications"}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
