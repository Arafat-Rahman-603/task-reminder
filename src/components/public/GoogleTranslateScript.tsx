"use client";

import { useEffect } from "react";
import Script from "next/script";
import {
  clearGoogTransCookies,
  readGoogTransTargetLanguage,
  readActiveClientLanguage,
  applyClientLanguage,
} from "@/lib/client-language";

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
    // Permanently suppresses default Google Translate top toolbar and 40px layout shift without CPU churn.
    let isEnforcing = false;
    const enforceCleanLayout = () => {
      if (isEnforcing) return;
      isEnforcing = true;
      try {
        if (document.body.style.top && document.body.style.top !== "0px") {
          document.body.style.setProperty("top", "0px", "important");
        }
        if (document.documentElement.style.top && document.documentElement.style.top !== "0px") {
          document.documentElement.style.setProperty("top", "0px", "important");
        }
        if (document.body.style.position && document.body.style.position !== "static") {
          document.body.style.setProperty("position", "static", "important");
        }

        // Hide only the Google top banner frame and hover tooltip without destroying the translate engine
        const bannerElements = document.querySelectorAll(
          "iframe.goog-te-banner-frame, .goog-te-banner-frame, #goog-gt-tt, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .VIpgJd-ZVi9od-OR9Gae-vS7LJd"
        );

        bannerElements.forEach((el) => {
          try {
            (el as HTMLElement).style.setProperty("display", "none", "important");
            (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
            (el as HTMLElement).style.setProperty("height", "0", "important");
            (el as HTMLElement).style.setProperty("width", "0", "important");
            if (el.classList.contains("goog-te-banner-frame")) {
              el.remove();
            }
          } catch {
            // Ignore
          }
        });
      } finally {
        isEnforcing = false;
      }
    };

    enforceCleanLayout();

    // Observe body for injected toolbar iframe or style changes, filtering to avoid self-triggering loops
    const observer = new MutationObserver((mutations) => {
      if (isEnforcing) return;
      const hasRelevantMutation = mutations.some((m) => {
        if (m.type === "childList") {
          for (let i = 0; i < m.addedNodes.length; i++) {
            const node = m.addedNodes[i];
            if (node instanceof HTMLElement) {
              const tag = node.tagName.toLowerCase();
              if (tag === "iframe" || node.className?.toString().includes("goog") || node.id?.includes("goog")) {
                return true;
              }
            }
          }
        } else if (m.type === "attributes" && m.attributeName === "style") {
          const target = m.target as HTMLElement;
          if (target === document.body || target === document.documentElement) {
            return target.style.top && target.style.top !== "0px";
          }
        }
        return false;
      });

      if (hasRelevantMutation) {
        enforceCleanLayout();
      }
    });

    observer.observe(document.body, { 
      childList: true, 
      attributes: true, 
      attributeFilter: ["style"] 
    });
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ["style"] 
    });

    const timeoutId = setTimeout(enforceCleanLayout, 1500);

    // 4. RESPECT EXPLICIT USER LANGUAGE PREFERENCE WITHOUT AUTO-FORCING REGIONAL TRANSLATIONS
    // Never overwrite English with Bengali/regional translations automatically based on timezone.
    try {
      const activeLang = readActiveClientLanguage("en");
      document.documentElement.lang = activeLang;
      const cookieLang = readGoogTransTargetLanguage();
      if (activeLang === "en" && cookieLang && cookieLang !== "en") {
        clearGoogTransCookies();
        applyClientLanguage("en", { reloadIfTranslatedToEnglish: false, silent: true });
      }
    } catch {
      // Ignore security restriction if storage is blocked
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Headless Google Translate element container */}
      <div
        id="google_translate_element"
        style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", opacity: 0, pointerEvents: "none", overflow: "hidden" }}
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
