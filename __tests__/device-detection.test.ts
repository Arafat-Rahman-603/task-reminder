import { isActualIOS, isStandalonePWA } from "@/lib/device";

describe("Device and Platform Detection Utilities", () => {
  const originalNavigator = (global as any).navigator;
  const originalWindow = (global as any).window;

  beforeEach(() => {
    (global as any).window = {
      matchMedia: (query: string) => ({
        matches: query === "(display-mode: standalone)",
      }),
      navigator: {},
      location: { search: "" },
    };
  });

  afterEach(() => {
    (global as any).navigator = originalNavigator;
    (global as any).window = originalWindow;
  });

  const mockNavigator = (userAgent: string, platform: string, maxTouchPoints: number = 0) => {
    const nav = {
      userAgent,
      platform,
      maxTouchPoints,
    };
    (global as any).navigator = nav;
    if ((global as any).window) {
      (global as any).window.navigator = nav;
    }
  };

  describe("isActualIOS", () => {
    test("returns false for Windows 10/11 Desktop PC Chrome", () => {
      mockNavigator(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Win32",
        0
      );
      expect(isActualIOS()).toBe(false);
    });

    test("returns false for Windows Edge browser", () => {
      mockNavigator(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
        "Win32",
        0
      );
      expect(isActualIOS()).toBe(false);
    });

    test("returns false for Windows laptop with touch screen", () => {
      mockNavigator(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Win32",
        10
      );
      expect(isActualIOS()).toBe(false);
    });

    test("returns false for Android Samsung / Pixel phone", () => {
      mockNavigator(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Linux armv8l",
        5
      );
      expect(isActualIOS()).toBe(false);
    });

    test("returns false for macOS MacBook / iMac desktop (MacIntel without touch points)", () => {
      mockNavigator(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "MacIntel",
        0
      );
      expect(isActualIOS()).toBe(false);
    });

    test("returns false for Linux desktop", () => {
      mockNavigator(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Linux x86_64",
        0
      );
      expect(isActualIOS()).toBe(false);
    });

    test("returns true for real iPhone (Safari mobile)", () => {
      mockNavigator(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "iPhone",
        5
      );
      expect(isActualIOS()).toBe(true);
    });

    test("returns true for real iPad with legacy iOS UserAgent", () => {
      mockNavigator(
        "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "iPad",
        5
      );
      expect(isActualIOS()).toBe(true);
    });

    test("returns true for modern iPadOS reporting MacIntel with multi-touch", () => {
      mockNavigator(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "MacIntel",
        5
      );
      expect(isActualIOS()).toBe(true);
    });
  });

  describe("isStandalonePWA", () => {
    test("detects standalone display-mode", () => {
      (global as any).window = {
        matchMedia: (query: string) => ({
          matches: query === "(display-mode: standalone)",
        }),
        navigator: {},
        location: { search: "" },
      };

      expect(isStandalonePWA()).toBe(true);
    });

    test("returns false for regular browser tab", () => {
      (global as any).window = {
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false },
        location: { search: "" },
      };

      expect(isStandalonePWA()).toBe(false);
    });
  });
});
