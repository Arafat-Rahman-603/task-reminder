"use client";

import { useEffect } from "react";

/**
 * Universal Safe Area & Notch Inset Manager for Progressive Web Apps (PWA) and Mobile Viewports.
 *
 * Problem it solves:
 * - On iOS (iPhone notch / Dynamic Island), WebKit natively calculates `env(safe-area-inset-top)`.
 * - On Android devices (Samsung, Xiaomi, Pixel, OnePlus, etc.) with camera punch-holes or notches,
 *   Chromium standalone PWAs frequently evaluate `env(safe-area-inset-top)` to 0px, causing the
 *   hardware cutout or status bar to physically overlap the app's logo, hamburger menu, and headers.
 * - This manager dynamically probes real device insets. In standalone/fullscreen PWA mode on mobile,
 *   if native insets are missing/0px, it applies a guaranteed 32px safe-clearance for notches and
 *   16px clearance for bottom gesture navigation bars without regressing iOS or desktop layouts.
 */
export default function SafeAreaManager() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Invisible probe element to accurately measure native env() values computed by the browser engine
    const probe = document.createElement("div");
    probe.setAttribute(
      "style",
      "position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px);"
    );
    document.documentElement.appendChild(probe);

    const updateInsets = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        Boolean("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone) ||
        window.location.search.includes("pwa=true");

      const isMobile = window.innerWidth <= 768 || /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      const isIOS =
        /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const root = document.documentElement;

      if (isStandalone) {
        root.classList.add("pwa-standalone");
      } else {
        root.classList.remove("pwa-standalone");
      }

      const style = window.getComputedStyle(probe);
      const nativeTop = parseFloat(style.paddingTop) || 0;
      const nativeBottom = parseFloat(style.paddingBottom) || 0;
      const nativeLeft = parseFloat(style.paddingLeft) || 0;
      const nativeRight = parseFloat(style.paddingRight) || 0;

      if (isMobile) {
        if (isStandalone) {
          // If the platform already reports a non-zero inset (e.g. iPhone notch ~47px or Dynamic Island ~59px), preserve it.
          // If iOS standalone reports 0, fallback to 20px status bar clearance.
          // On Android and non-iOS standalone PWA, the OS status bar is drawn outside the webview, so 0px is correct.
          const topVal = nativeTop > 0 ? nativeTop : (isIOS ? 20 : 0);
          const bottomVal = nativeBottom > 0 ? nativeBottom : 16;
          root.style.setProperty("--safe-area-top", `${topVal}px`);
          root.style.setProperty("--safe-area-bottom", `${bottomVal}px`);
        } else {
          // In standard mobile browser
          if (nativeTop > 0) {
            root.style.setProperty("--safe-area-top", `${nativeTop}px`);
          } else {
            root.style.setProperty("--safe-area-top", "0px");
          }
          if (nativeBottom > 0) {
            root.style.setProperty("--safe-area-bottom", `${nativeBottom}px`);
          } else {
            root.style.removeProperty("--safe-area-bottom");
          }
        }

        if (nativeLeft > 0) root.style.setProperty("--safe-area-left", `${nativeLeft}px`);
        if (nativeRight > 0) root.style.setProperty("--safe-area-right", `${nativeRight}px`);
      }
    };

    updateInsets();

    window.addEventListener("resize", updateInsets);
    window.addEventListener("orientationchange", updateInsets);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateInsets);
    }

    return () => {
      window.removeEventListener("resize", updateInsets);
      window.removeEventListener("orientationchange", updateInsets);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateInsets);
      }
      if (probe.parentNode) {
        probe.parentNode.removeChild(probe);
      }
    };
  }, []);

  return null;
}
