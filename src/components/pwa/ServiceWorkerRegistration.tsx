"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // OneSignal's init() handles SW registration via serviceWorkerPath: "/sw.js".
    // We do NOT register the SW here — doing so creates a duplicate registration
    // that causes "[WM] No SW registration for postMessage" errors because
    // OneSignal's SessionManager can't find the registration it created.
    //
    // Instead, we passively watch for SW updates and trigger skipWaiting when
    // a new version installs, so users get the latest without a manual refresh.
    const watchForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log("[PWA] Service Worker ready:", registration.scope);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New SW installed — activate it immediately
              if (registration.waiting) {
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
              }
            }
          });
        });
      } catch (err) {
        console.warn("[PWA] Service Worker watch failed:", err);
      }
    };

    if (document.readyState === "complete") {
      watchForUpdates();
    } else {
      window.addEventListener("load", watchForUpdates);
      return () => window.removeEventListener("load", watchForUpdates);
    }
  }, []);

  return null;
}
