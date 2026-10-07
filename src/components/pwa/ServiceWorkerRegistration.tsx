"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const swUrl = apiKey ? `/sw.js?apiKey=${apiKey}` : '/sw.js';

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(swUrl, { scope: "/" });
        console.log("[PWA] Service Worker registered:", registration.scope);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New SW installed - activate it immediately
              if (registration.waiting) {
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
              }
            }
          });
        });
      } catch (err) {
        console.warn("[PWA] Service Worker registration failed:", err);
      }
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);
      return () => window.removeEventListener("load", registerServiceWorker);
    }
  }, []);

  return null;
}
