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

  const ua = (navigator.userAgent || "").toLowerCase();

  // Actual iOS or Android devices
  if (isActualIOS() || /android|iphone|ipad|ipod|mobile/i.test(ua)) {
    return true;
  }

  // Touch screen devices with small/medium viewport (tablets/phones)
  const isTouch = 
    "ontouchstart" in window || 
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);

  if (isTouch && window.innerWidth <= 1024) {
    return true;
  }

  return window.innerWidth <= 768;
}

/**
 * Returns true if autoFocus should be enabled (only on Desktop / Laptop PC).
 * Disabled on mobile devices and small screens to prevent the on-screen virtual keyboard from popping up automatically.
 */
export function shouldAutoFocus(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return !isMobileDevice();
}

