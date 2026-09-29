"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // Always check for SW updates
        });

        // Check for updates every time app comes back into focus
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New SW is ready — activate immediately
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        console.log("[PWA] Service Worker registered:", registration.scope);
      } catch (err) {
        console.error("[PWA] Service Worker registration failed:", err);
      }
    };

    // Register after page load to not block rendering
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }
  }, []);

  return null;
}
