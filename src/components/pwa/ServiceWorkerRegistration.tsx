"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const setupSW = async () => {
      try {
        // Only register if not already registering elsewhere or simply rely on it.
        // We register it to ensure PWA works even if OneSignal is delayed,
        // but we do it safely and wait for ready state before messaging.
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Lifecycle-safe: Wait for the service worker to be fully ready
        const readyRegistration = await navigator.serviceWorker.ready;
        console.log("[PWA] Service Worker ready:", readyRegistration.scope);

        // Handle updates safely
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Ensure we only post messages to a valid waiting/active registration
              navigator.serviceWorker.ready.then((reg) => {
                if (reg.waiting) {
                  reg.waiting.postMessage({ type: "SKIP_WAITING" });
                } else if (reg.active) {
                  reg.active.postMessage({ type: "SKIP_WAITING" });
                }
              }).catch(console.error);
            }
          });
        });
      } catch (err) {
        console.error("[PWA] Service Worker registration failed:", err);
      }
    };

    if (document.readyState === "complete") {
      setupSW();
    } else {
      window.addEventListener("load", setupSW);
    }
  }, []);

  return null;
}
