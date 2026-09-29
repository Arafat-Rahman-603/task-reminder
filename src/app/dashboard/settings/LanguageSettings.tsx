"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Check } from "lucide-react";

export default function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "es", name: "Español (Spanish)", flag: "🇪🇸" },
    { code: "de", name: "Deutsch (German)", flag: "🇩🇪" },
    { code: "fr", name: "Français (French)", flag: "🇫🇷" },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-on-surface mb-1">{t("language_preferences")}</h3>
        <p className="text-sm text-on-surface-variant">
          {t("language_desc")}
        </p>
      </div>

      <div className="grid gap-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              language === lang.code
                ? "bg-primary/10 border-stitch-primary shadow-[0_0_12px_rgba(125,211,252,0.15)]"
                : "bg-surface-container/50 border-surface-variant/30 hover:border-surface-variant/80 hover:bg-surface-container"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{lang.flag}</span>
              <span className={`font-medium ${language === lang.code ? "text-stitch-primary" : "text-on-surface"}`}>
                {lang.name}
              </span>
            </div>
            {language === lang.code && (
              <div className="w-6 h-6 rounded-full bg-stitch-primary flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-on-primary font-bold" />
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-8 p-4 rounded-xl bg-surface-container border border-surface-variant/50">
        <p className="text-sm text-on-surface-variant">
          {t("language_note")}
        </p>
      </div>
    </div>
  );
}
