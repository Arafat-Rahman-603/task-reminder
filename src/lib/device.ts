/**
 * Device and Platform Detection Utilities
 * Accurately detects actual Apple iOS devices (iPhone, iPad, iPod)
 * while ensuring desktop PCs (Windows, Mac, Linux) and Android
 * are never misidentified as iOS.
 */

export function isActualIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const nav = (typeof window !== "undefined" && window.navigator) ? window.navigator : (typeof navigator !== "undefined" ? navigator : null);
  if (!nav) return false;

  const ua = nav.userAgent || "";
  const platform = (nav.platform || "").toLowerCase();

  // If user-agent or platform indicates Windows, Android, Linux, ChromeOS, it is NOT iOS
  if (
    /windows|win32|win64|android|cros|linux|x11/i.test(ua) ||
    platform.startsWith("win") ||
    platform.startsWith("android") ||
    platform.startsWith("linux")
  ) {
    return false;
  }

  // Real iPhone / iPod
  const isIPhoneOrIPod = /iphone|ipod/i.test(ua);

  // Real iPad (older iOS or modern iPadOS reporting MacIntel with touch points)
  const isIPad =
    /ipad/i.test(ua) ||
    (platform === "macintel" && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1);

  return isIPhoneOrIPod || isIPad;
}

export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    (typeof window.location !== "undefined" && window.location.search.includes("pwa=true"))
  );
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth <= 768 || isActualIOS() || /android/i.test(navigator.userAgent || "");
}
