"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";

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
  shortLabel: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
    flag: "🇺🇸",
  },
  {
    code: "tl",
    label: "Filipino (Tagalog)",
    shortLabel: "FIL",
    flag: "🇵🇭",
  },
  {
    code: "es",
    label: "Español (Spanish)",
    shortLabel: "ES",
    flag: "🇪🇸",
  },
  {
    code: "de",
    label: "Deutsch (German)",
    shortLabel: "DE",
    flag: "🇩🇪",
  },
  {
    code: "fr",
    label: "Français (French)",
    shortLabel: "FR",
    flag: "🇫🇷",
  },
  {
    code: "bn",
    label: "বাংলা (Bengali)",
    shortLabel: "BN",
    flag: "🇧🇩",
  },
  {
    code: "ar",
    label: "العربية (Arabic)",
    shortLabel: "AR",
    flag: "🇸🇦",
  },
  {
    code: "id",
    label: "Bahasa Indonesia",
    shortLabel: "ID",
    flag: "🇮🇩",
  },
  {
    code: "ja",
    label: "日本語 (Japanese)",
    shortLabel: "JA",
    flag: "🇯🇵",
  },
  {
    code: "pt",
    label: "Português (Portuguese)",
    shortLabel: "PT",
    flag: "🇧🇷",
  },
  {
    code: "hi",
    label: "हिन्दी (Hindi)",
    shortLabel: "HI",
    flag: "🇮🇳",
  },
  {
    code: "it",
    label: "Italiano (Italian)",
    shortLabel: "IT",
    flag: "🇮🇹",
  },
];

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("en");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state with cookie / localStorage on mount and listen to custom events
  useEffect(() => {
    const detectCurrentLanguage = (): SupportedLanguage => {
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
        // Fallback default
      }
      return "en";
    };

    setCurrentLang(detectCurrentLanguage());

    const handleLanguageUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: SupportedLanguage }>;
      if (customEvent.detail?.lang) {
        setCurrentLang(customEvent.detail.lang);
      }
    };

    window.addEventListener("manageo-language-updated", handleLanguageUpdate);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("manageo-language-updated", handleLanguageUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const switchLanguage = (targetLang: SupportedLanguage) => {
    setIsOpen(false);
    if (targetLang === currentLang) return;

    setCurrentLang(targetLang);

    try {
      const cookieValue = targetLang === "en" ? "/en/en" : `/en/${targetLang}`;

      // Set cookie on root path only to avoid multiple conflicting domain cookies
      document.cookie = `googtrans=${cookieValue}; path=/;`;

      // Save persistent preference in localStorage
      localStorage.setItem("user_language_preference", targetLang);
      localStorage.setItem("googtrans_lang", targetLang);

      // Notify in-page listeners
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
          }
        }, 80);
      }
    } catch (e) {
      console.error("Language switch error:", e);
    }
  };

  const activeOption = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Sleek rectangular button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Select language. Currently ${activeOption.label}`}
        className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-200 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-400/50 shadow-xs"
      >
        <Globe className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform duration-200 shrink-0" />
        <span className="text-xs font-medium text-slate-200">
          {activeOption.label.split(" ")[0]}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dark Glassmorphic Dropdown Menu with Smooth Scroll */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-xl bg-[#0c101a]/95 border border-white/10 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.06] mb-1 sticky top-0 bg-[#0c101a]/95 backdrop-blur-md z-10 flex items-center justify-between">
            <span>Select Language</span>
            <span className="text-[9px] text-sky-400 font-mono font-medium">{LANGUAGES.length} Languages</span>
          </div>
          <div className="space-y-0.5">
            {LANGUAGES.map((option) => {
              const isSelected = option.code === currentLang;
              return (
                <button
                  key={option.code}
                  role="menuitem"
                  type="button"
                  onClick={() => switchLanguage(option.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isSelected
                      ? "bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/20"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{option.flag}</span>
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
