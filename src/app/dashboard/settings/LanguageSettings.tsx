"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Check, Globe, RefreshCw, Search } from "lucide-react";

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

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  shortLabel: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English (US)",
    shortLabel: "EN",
    flag: "🇺🇸",
  },
  {
    code: "tl",
    label: "Filipino (Tagalog)",
    nativeLabel: "Wikang Filipino",
    shortLabel: "FIL",
    flag: "🇵🇭",
  },
  {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    shortLabel: "ES",
    flag: "🇪🇸",
  },
  {
    code: "de",
    label: "German",
    nativeLabel: "Deutsch",
    shortLabel: "DE",
    flag: "🇩🇪",
  },
  {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    shortLabel: "FR",
    flag: "🇫🇷",
  },
  {
    code: "bn",
    label: "Bengali",
    nativeLabel: "বাংলা",
    shortLabel: "BN",
    flag: "🇧🇩",
  },
  {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    shortLabel: "AR",
    flag: "🇸🇦",
  },
  {
    code: "id",
    label: "Indonesian",
    nativeLabel: "Bahasa Indonesia",
    shortLabel: "ID",
    flag: "🇮🇩",
  },
  {
    code: "ja",
    label: "Japanese",
    nativeLabel: "日本語",
    shortLabel: "JA",
    flag: "🇯🇵",
  },
  {
    code: "pt",
    label: "Portuguese",
    nativeLabel: "Português",
    shortLabel: "PT",
    flag: "🇧🇷",
  },
  {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    shortLabel: "HI",
    flag: "🇮🇳",
  },
  {
    code: "it",
    label: "Italian",
    nativeLabel: "Italiano",
    shortLabel: "IT",
    flag: "🇮🇹",
  },
];

function getInitialLanguage(fallback: string): SupportedLanguage {
  if (typeof window === "undefined") return (fallback as SupportedLanguage) || "en";
  try {
    const saved = localStorage.getItem("user_language_preference") as SupportedLanguage;
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;

    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const trimmed = c.trim();
      if (trimmed.startsWith("googtrans=")) {
        const val = trimmed.split("=")[1];
        const match = LANGUAGES.find((l) => val.endsWith("/" + l.code));
        if (match) return match.code;
      }
    }
  } catch {
    // fallback
  }
  return (fallback as SupportedLanguage) || "en";
}

function setClientCookie(name: string, value: string, maxAge?: number, domain?: string) {
  if (typeof document === "undefined") return;
  let cookieStr = `${name}=${value}; path=/;`;
  if (maxAge) cookieStr += ` max-age=${maxAge};`;
  if (domain && domain !== "localhost" && !domain.startsWith("127.")) {
    cookieStr += ` domain=.${domain};`;
  }
  document.cookie = cookieStr;
}

export default function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage();
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => getInitialLanguage(language));
  const [searchQuery, setSearchQuery] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  // Sync state with cookie / localStorage on mount and listen to custom events
  useEffect(() => {
    const handleLanguageUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: SupportedLanguage }>;
      if (customEvent.detail?.lang) {
        setCurrentLang(customEvent.detail.lang);
      }
    };

    window.addEventListener("manageo-language-updated", handleLanguageUpdate);

    return () => {
      window.removeEventListener("manageo-language-updated", handleLanguageUpdate);
    };
  }, []);

  const switchLanguage = (targetLang: SupportedLanguage) => {
    if (targetLang === currentLang && !isTranslating) return;

    setCurrentLang(targetLang);
    setIsTranslating(true);

    try {
      const cookieValue = targetLang === "en" ? "/en/en" : `/en/${targetLang}`;

      // Set cookie on root path and domain to ensure immediate whole-site coverage
      setClientCookie("googtrans", cookieValue);
      const domain = typeof window !== "undefined" ? window.location.hostname : "";
      if (domain) {
        setClientCookie("googtrans", cookieValue, undefined, domain);
      }

      // Save persistent preferences in localStorage
      localStorage.setItem("user_language_preference", targetLang);
      localStorage.setItem("googtrans_lang", targetLang);
      localStorage.setItem("app_language", targetLang);

      // Also sync next-locale cookie
      setClientCookie("NEXT_LOCALE", targetLang, 31536000);

      // Update internal context if supported
      if (["en", "es", "de", "fr"].includes(targetLang)) {
        setLanguage(targetLang as any);
      }

      // Notify all in-page components (e.g., PublicHeader, Sidebar, footer)
      window.dispatchEvent(
        new CustomEvent("manageo-language-updated", { detail: { lang: targetLang } })
      );

      // Trigger Google Translate in-place DOM update without page reload
      const triggerTranslate = () => {
        const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
        if (select) {
          select.value = targetLang;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        return false;
      };

      if (!triggerTranslate()) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (triggerTranslate() || attempts >= 10) {
            clearInterval(interval);
            setIsTranslating(false);
          }
        }, 80);
      } else {
        setTimeout(() => setIsTranslating(false), 300);
      }
    } catch (e) {
      console.error("Language switch error in Settings:", e);
      setIsTranslating(false);
    }
  };

  const filteredLanguages = LANGUAGES.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.label.toLowerCase().includes(q) ||
      l.nativeLabel.toLowerCase().includes(q) ||
      l.shortLabel.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const activeLangObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-on-surface">{t("language_preferences", "Language Preferences")}</h3>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-stitch-primary animate-pulse" /> Live In-Place Translation
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {t("language_desc", "Select your preferred language. Translations are applied immediately across the entire workspace.")}
          </p>
        </div>

        {/* Current Active Indicator Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container border border-surface-variant/40 shrink-0 self-start sm:self-auto">
          <Globe className="w-4 h-4 text-stitch-primary" />
          <span className="text-base leading-none">{activeLangObj.flag}</span>
          <span className="text-xs font-semibold text-on-surface">{activeLangObj.nativeLabel}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-variant text-on-surface-variant font-bold">
            {activeLangObj.shortLabel}
          </span>
        </div>
      </div>

      {/* Search Input for Quick Finding */}
      <div className="relative">
        <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search languages by name (e.g. Bengali, Filipino, Español, 日本語)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container/70 border border-surface-variant/40 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-stitch-primary focus:ring-1 focus:ring-stitch-primary/30 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface"
          >
            Clear
          </button>
        )}
      </div>

      {/* Language Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredLanguages.map((lang) => {
          const isSelected = currentLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => switchLanguage(lang.code)}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-primary/10 border-stitch-primary shadow-[0_0_16px_rgba(125,211,252,0.18)]"
                  : "bg-surface-container/40 border-surface-variant/30 hover:border-surface-variant hover:bg-surface-container/80"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0 leading-none">{lang.flag}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold truncate ${isSelected ? "text-stitch-primary" : "text-on-surface"}`}>
                      {lang.nativeLabel}
                    </span>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-surface-variant/50 text-on-surface-variant">
                      {lang.shortLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    {lang.label}
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-stitch-primary flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 text-on-primary stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-surface-variant/60 hover:border-stitch-primary/50 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredLanguages.length === 0 && (
        <div className="py-8 text-center rounded-xl bg-surface-container/30 border border-dashed border-surface-variant/40">
          <p className="text-xs text-on-surface-variant">No language found matching &quot;{searchQuery}&quot;</p>
        </div>
      )}
      
      {/* Helpful note card */}
      <div className="p-4 rounded-xl bg-surface-container/50 border border-surface-variant/40 flex items-start gap-3">
        <RefreshCw className="w-4 h-4 text-stitch-primary shrink-0 mt-0.5" />
        <div className="text-xs text-on-surface-variant space-y-1">
          <p className="font-semibold text-on-surface">Whole-Site Synchronization</p>
          <p>
            Your chosen language is saved to your account and browser profile. It instantly updates navigation menus, dashboards, public landing pages, modals, and tables in real time without annoying page flicker or intrusive Google toolbars.
          </p>
        </div>
      </div>
    </div>
  );
}
