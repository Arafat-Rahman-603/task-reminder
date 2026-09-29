"use client";

import { useState, useEffect } from "react";
import { Download, MonitorSmartphone, X, Share } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PWAInstallButton({ variant = "default" }: { variant?: "default" | "card" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false); // start false to avoid hydration mismatch
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already running in standalone (installed PWA) mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS Safari
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }
  };

  // Don't render until client-side mounted (prevents hydration mismatch)
  if (!mounted) return null;
  // Already installed as PWA — don't show button
  if (isStandalone) return null;
  // On non-iOS desktop/Android: only show if browser gave us the install prompt
  if (!isIOS && !deferredPrompt) return null;

  if (variant === "card") {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
              <MonitorSmartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Install Manageo App</h3>
              <p className="text-sm text-on-surface-variant">
                {isIOS ? "Add to Home Screen for the full app experience." : "Install for offline access & faster loading."}
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="shrink-0 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            {isIOS ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {isIOS ? "How to Install" : "Install App"}
          </button>
        </div>

        {showIOSPrompt && (
          <div className="mt-4 p-4 bg-surface-container-high rounded-xl border border-surface-variant text-sm relative">
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="absolute top-2 right-2 p-1 text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="font-semibold text-on-surface mb-2">To install on iOS:</p>
            <ol className="list-decimal pl-5 space-y-1 text-on-surface-variant">
              <li>Tap the <strong>Share</strong> button <span className="inline-block px-1.5 py-0.5 bg-surface-container rounded-md border border-surface-variant text-[11px]">↗</span> at the bottom of Safari.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in the top right.</li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center justify-center gap-2 w-full py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-all"
    >
      <Download className="w-4 h-4" />
      Install App
    </button>
  );
}
