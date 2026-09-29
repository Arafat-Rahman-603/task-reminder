"use client";

import { useState, useEffect } from "react";
import { Download, MonitorSmartphone, X } from "lucide-react";

export default function PWAInstallButton({ variant = "default" }: { variant?: "default" | "card" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if the app is already installed/running in standalone mode
    const isAppStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                           (window.navigator as any).standalone === true;
    setIsStandalone(isAppStandalone);

    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsStandalone(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (process.env.NODE_ENV === "development") {
      alert("PWA Installation is simulated in development mode because the Service Worker is disabled for better performance. It will work perfectly in production!");
      return;
    }

    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // If already installed, don't show anything
  if (isStandalone && !showIOSPrompt) return null;
  // If it's not iOS and we don't have the prompt yet (AND not in dev), we can't install, so don't show the button
  if (process.env.NODE_ENV !== "development" && !isIOS && !deferredPrompt) return null;

  if (variant === "card") {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
              <MonitorSmartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Install Manageo App</h3>
              <p className="text-sm text-on-surface-variant">Get the full experience on your device for faster access.</p>
            </div>
          </div>
          
          <button 
            onClick={handleInstallClick}
            className="shrink-0 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4" /> Install App
          </button>
        </div>

        {showIOSPrompt && (
          <div className="mt-4 p-4 bg-surface-container-high rounded-xl border border-surface-variant text-sm relative">
            <button onClick={() => setShowIOSPrompt(false)} className="absolute top-2 right-2 p-1 text-on-surface-variant hover:text-on-surface"><X className="w-4 h-4" /></button>
            <p className="font-semibold text-on-surface mb-2">To install on iOS:</p>
            <ol className="list-decimal pl-5 space-y-1 text-on-surface-variant">
              <li>Tap the <strong>Share</strong> button <span className="inline-block p-1 bg-surface-container rounded-md mx-1 border border-surface-variant text-[10px]">↗</span> at the bottom.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
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
