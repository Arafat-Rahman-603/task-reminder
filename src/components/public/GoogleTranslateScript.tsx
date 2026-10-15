"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
    googleTranslateElementInit?: () => void;
    __googleTranslateGuardApplied?: boolean;
    __manageoTranslateInitialized?: boolean;
  }
}

// 1. RUNTIME DOM RECONCILIATION GUARD
// Overrides Node removal/insertion methods to protect React 19 from virtual DOM mismatches during translation.
// Eliminates "removeChild on Node" and "insertBefore on Node" errors permanently.
if (typeof window !== "undefined" && !window.__googleTranslateGuardApplied) {
  window.__googleTranslateGuardApplied = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      if (process.env.NODE_ENV === "development") {
        console.warn("DOM reconciliation guard: avoided removeChild on detached node", child, this);
      }
      return child;
    }
    try {
      return originalRemoveChild.call(this, child) as T;
    } catch {
      return child;
    }
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (process.env.NODE_ENV === "development") {
        console.warn("DOM reconciliation guard: avoided insertBefore mismatch", referenceNode, this);
      }
      try {
        return originalInsertBefore.call(this, newNode, null) as T;
      } catch {
        return newNode;
      }
    }
    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch {
      return originalInsertBefore.call(this, newNode, null) as T;
    }
  };
}

export function GoogleTranslateScript() {
  useEffect(() => {
    // 2. DEFINE INITIALIZATION CALLBACK FOR GOOGLE TRANSLATE
    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,tl",
              autoDisplay: false,
              layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE,
            },
            "google_translate_element"
          );
          window.__manageoTranslateInitialized = true;
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Google Translate initialization error:", err);
        }
      }
    };

    // 3. MUTATION OBSERVER TO ENFORCE CLEAN LAYOUT & REMOVE GOOGLE BANNERS
    // Permanently suppresses default Google Translate top toolbar and 40px layout shift.
    const enforceCleanLayout = () => {
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.top = "0px";
      }
      if (document.documentElement.style.top && document.documentElement.style.top !== "0px") {
        document.documentElement.style.top = "0px";
      }
      const banners = document.querySelectorAll(
        ".goog-te-banner-frame, iframe.goog-te-banner-frame, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .VIpgJd-ZVi9od-aZ2wEe-OiiCO"
      );
      banners.forEach((el) => {
        (el as HTMLElement).style.display = "none";
        (el as HTMLElement).style.visibility = "hidden";
        (el as HTMLElement).style.height = "0";
      });
    };

    enforceCleanLayout();
    const observer = new MutationObserver(() => {
      enforceCleanLayout();
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });

    // 4. COUNTRY / TIMEZONE AUTO-DETECTION
    // If the user visits for the first time without an explicit choice, auto-detect location:
    // If accessing from Philippines (Asia/Manila or Filipino locale), default to Filipino (TL).
    try {
      const savedPref = localStorage.getItem("user_language_preference");
      const hasCookie = document.cookie.includes("googtrans=");

      if (!savedPref && !hasCookie) {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        const browserLanguages = navigator.languages ? Array.from(navigator.languages) : [navigator.language || ""];

        const isPhilippines =
          timeZone.toLowerCase().includes("manila") ||
          timeZone.toLowerCase().includes("philippines") ||
          browserLanguages.some(
            (l) => l.toLowerCase().startsWith("tl") || l.toLowerCase().startsWith("fil")
          );

        if (isPhilippines) {
          const cookieValue = "/en/tl";
          const domain = window.location.hostname;
          document.cookie = `googtrans=${cookieValue}; path=/;`;
          document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain};`;
          if (domain.includes(".")) {
            const parts = domain.split(".");
            if (parts.length > 1) {
              const rootDomain = "." + parts.slice(-2).join(".");
              document.cookie = `googtrans=${cookieValue}; path=/; domain=${rootDomain};`;
            }
          }
          localStorage.setItem("user_language_preference", "tl");
          localStorage.setItem("googtrans_lang", "tl");
          window.dispatchEvent(
            new CustomEvent("manageo-language-updated", { detail: { lang: "tl" } })
          );
        }
      }
    } catch {
      // Ignore security restriction if storage is blocked
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Headless Google Translate element container */}
      <div
        id="google_translate_element"
        style={{ display: "none", position: "absolute", left: "-9999px", top: "-9999px" }}
        aria-hidden="true"
      />
      <Script
        id="google-translate-script"
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
