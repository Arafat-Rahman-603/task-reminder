/**
 * Client-side language state & Google Translate cookie synchronization utilities.
 * Ensures switching to English or logging in with an English account cleanly clears
 * any lingering Google Translate domain cookies and avoids forced Bengali bleed.
 */

export type SupportedLanguage =
  | "en"
  | "tl"
  | "es"
  | "de"
  | "fr"
  | "bn"
  | "ar"
  | "id"
  | "ja"
  | "pt"
  | "hi"
  | "it";

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  "en",
  "tl",
  "es",
  "de",
  "fr",
  "bn",
  "ar",
  "id",
  "ja",
  "pt",
  "hi",
  "it",
];

export function isSupportedLanguage(val: unknown): val is SupportedLanguage {
  return (
    typeof val === "string" &&
    SUPPORTED_LANGUAGES.includes(val as SupportedLanguage)
  );
}

function expireCookieEverywhere(name: string) {
  if (typeof document === "undefined") return;
  const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
  const base = `${name}=; path=/; max-age=0; expires=${expired}`;
  document.cookie = base;

  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    return;
  }

  document.cookie = `${base}; domain=${hostname}`;
  document.cookie = `${base}; domain=.${hostname}`;

  const parts = hostname.split(".");
  if (parts.length > 2) {
    const rootDomain = parts.slice(-2).join(".");
    document.cookie = `${base}; domain=.${rootDomain}`;
    document.cookie = `${base}; domain=${rootDomain}`;
  }
}

export function clearGoogTransCookies() {
  expireCookieEverywhere("googtrans");
}

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length);
    }
  }
  return null;
}

export function isPageCurrentlyTranslated(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  if (
    root.classList.contains("translated-ltr") ||
    root.classList.contains("translated-rtl")
  ) {
    return true;
  }
  return Boolean(document.querySelector("font[style*='vertical-align']"));
}

export function readGoogTransTargetLanguage(): SupportedLanguage | null {
  const val = readCookieValue("googtrans");
  if (!val) return null;
  const segments = val.split("/").filter(Boolean);
  const candidate = segments[segments.length - 1];
  return isSupportedLanguage(candidate) ? candidate : null;
}

export function readActiveClientLanguage(
  fallback: SupportedLanguage = "en"
): SupportedLanguage {
  if (typeof window === "undefined") return fallback;
  try {
    const pref = localStorage.getItem("user_language_preference");
    if (isSupportedLanguage(pref)) return pref;

    const appLang = localStorage.getItem("app_language");
    if (isSupportedLanguage(appLang)) return appLang;

    const nextLocale = readCookieValue("NEXT_LOCALE");
    if (isSupportedLanguage(nextLocale)) return nextLocale;

    const goog = readGoogTransTargetLanguage();
    if (goog) return goog;
  } catch {
    // ignore storage access issues
  }
  return fallback;
}

export function applyClientLanguage(
  targetLang: SupportedLanguage,
  options?: { reloadIfTranslatedToEnglish?: boolean; silent?: boolean }
) {
  if (typeof window === "undefined") return;

  try {
    clearGoogTransCookies();

    if (targetLang === "en") {
      document.cookie = "googtrans=/en/en; path=/; sameSite=lax";
    } else {
      document.cookie = `googtrans=/en/${targetLang}; path=/; sameSite=lax`;
    }

    document.cookie = `NEXT_LOCALE=${targetLang}; path=/; max-age=31536000; sameSite=lax`;
    localStorage.setItem("user_language_preference", targetLang);
    localStorage.setItem("googtrans_lang", targetLang);
    localStorage.setItem("app_language", targetLang);
    document.documentElement.lang = targetLang;

    if (!options?.silent) {
      window.dispatchEvent(
        new CustomEvent("manageo-language-updated", {
          detail: { lang: targetLang },
        })
      );
    }

    const triggerTranslate = () => {
      const select = document.querySelector(
        ".goog-te-combo"
      ) as HTMLSelectElement | null;
      if (select) {
        select.value = targetLang;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    };

    const appliedImmediately = triggerTranslate();
    if (!appliedImmediately && targetLang !== "en") {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts += 1;
        if (triggerTranslate() || attempts >= 10) {
          clearInterval(interval);
        }
      }, 80);
    }

    if (
      targetLang === "en" &&
      options?.reloadIfTranslatedToEnglish &&
      isPageCurrentlyTranslated()
    ) {
      try {
        const lastReset = Number(
          sessionStorage.getItem("manageo_gt_reset_ts") || "0"
        );
        if (Date.now() - lastReset > 5000) {
          sessionStorage.setItem("manageo_gt_reset_ts", String(Date.now()));
          window.location.reload();
        }
      } catch {
        // ignore sessionStorage error
      }
    }
  } catch {
    // ignore storage / cookie errors
  }
}
