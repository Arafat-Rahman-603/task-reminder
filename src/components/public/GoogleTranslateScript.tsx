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
              includedLanguages: "en,tl,es,de,fr,bn,ar,id,ja,pt,hi,it",
              autoDisplay: false,
              multilanguagePage: true,
              layout: window.google.translate.TranslateElement.InlineLayout?.HORIZONTAL,
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

    // 3. AGGRESSIVE LAYOUT ENFORCEMENT & REMOVAL OF GOOGLE BANNERS
    // Permanently suppresses default Google Translate top toolbar and 40px layout shift.
    const enforceCleanLayout = () => {
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.setProperty("top", "0px", "important");
      }
      if (document.documentElement.style.top && document.documentElement.style.top !== "0px") {
        document.documentElement.style.setProperty("top", "0px", "important");
      }
      if (document.body.style.position && document.body.style.position !== "static") {
        document.body.style.setProperty("position", "static", "important");
      }

      // Query all Google toolbar iframes, banners, and skiptranslate divs
      const elements = document.querySelectorAll(
        "iframe.skiptranslate, iframe.goog-te-banner-frame, iframe[id*=':1.'], iframe[id*=':2.'], iframe[class*='goog-te'], iframe[src*='translate.google'], body > .skiptranslate, body > iframe, .goog-te-banner-frame, #goog-gt-tt, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .VIpgJd-ZVi9od-OR9Gae-vS7LJd"
      );

      elements.forEach((el) => {
        try {
          (el as HTMLElement).style.setProperty("display", "none", "important");
          (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
          (el as HTMLElement).style.setProperty("height", "0", "important");
          (el as HTMLElement).style.setProperty("width", "0", "important");
          // Remove banner iframes from the DOM so they never render
          if (
            el.tagName.toLowerCase() === "iframe" ||
            el.classList.contains("goog-te-banner-frame") ||
            el.parentElement === document.body
          ) {
            el.remove();
          }
        } catch {
          // Ignore
        }
      });
    };

    enforceCleanLayout();

    // Observe body and documentElement continuously for any injected toolbar iframe or style changes
    const observer = new MutationObserver(() => {
      enforceCleanLayout();
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ["style", "class"] 
    });
    observer.observe(document.documentElement, { 
      childList: true, 
      attributes: true, 
      attributeFilter: ["style", "class"] 
    });

    // Run periodic cleanups during initial hydration to catch async Google injections
    const intervalId = setInterval(enforceCleanLayout, 100);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 5000);

    // 4. COUNTRY / TIMEZONE AUTO-DETECTION
    // If the user visits for the first time without an explicit choice, auto-detect location:
    try {
      const savedPref = localStorage.getItem("user_language_preference");
      const hasCookie = document.cookie.includes("googtrans=");

      if (!savedPref && !hasCookie) {
        const timeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
        const browserLanguages = navigator.languages ? Array.from(navigator.languages).map(l => l.toLowerCase()) : [(navigator.language || "").toLowerCase()];

        let detectedLang = "";

        if (timeZone.includes("manila") || timeZone.includes("philippines") || browserLanguages.some(l => l.startsWith("tl") || l.startsWith("fil"))) {
          detectedLang = "tl";
        } else if (timeZone.includes("dhaka") || browserLanguages.some(l => l.startsWith("bn"))) {
          detectedLang = "bn";
        } else if (browserLanguages.some(l => l.startsWith("es"))) {
          detectedLang = "es";
        } else if (browserLanguages.some(l => l.startsWith("de"))) {
          detectedLang = "de";
        } else if (browserLanguages.some(l => l.startsWith("fr"))) {
          detectedLang = "fr";
        } else if (browserLanguages.some(l => l.startsWith("id"))) {
          detectedLang = "id";
        } else if (browserLanguages.some(l => l.startsWith("ar"))) {
          detectedLang = "ar";
        }

        if (detectedLang && detectedLang !== "en") {
          const cookieValue = `/en/${detectedLang}`;
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
          localStorage.setItem("user_language_preference", detectedLang);
          localStorage.setItem("googtrans_lang", detectedLang);
          window.dispatchEvent(
            new CustomEvent("manageo-language-updated", { detail: { lang: detectedLang } })
          );
        }
      }
    } catch {
      // Ignore security restriction if storage is blocked
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
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
