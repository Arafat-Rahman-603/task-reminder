"use client";

import { Check, Monitor, Moon, Palette, RotateCcw, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

interface ThemeOptionConfig {
  id: ThemeMode;
  title: string;
  description: string;
  badgeText: string;
  icon: typeof Sun;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  previewBorder: string;
}

const THEME_OPTIONS: ThemeOptionConfig[] = [
  {
    id: "light",
    title: "Stitch Light",
    description: "Crisp high-contrast daylight surfaces with sky-blue Stitch accents.",
    badgeText: "Light",
    icon: Sun,
    previewBg: "#f4f7fb",
    previewCard: "#ffffff",
    previewAccent: "#0369a1",
    previewBorder: "#cbd5e1",
  },
  {
    id: "dark",
    title: "Stitch Dark",
    description: "Deep midnight workspace engineered for low-light focus.",
    badgeText: "Dark",
    icon: Moon,
    previewBg: "#0a0e1a",
    previewCard: "#141c2e",
    previewAccent: "#7dd3fc",
    previewBorder: "#2a3a48",
  },
  {
    id: "system",
    title: "System Default",
    description: "Automatically follows your operating system appearance preference.",
    badgeText: "Auto",
    icon: Monitor,
    previewBg: "linear-gradient(135deg, #f4f7fb 50%, #0a0e1a 50%)",
    previewCard: "linear-gradient(135deg, #ffffff 50%, #141c2e 50%)",
    previewAccent: "#0284c7",
    previewBorder: "#64748b",
  },
];

export default function ThemeSettings() {
  const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  const isOverridden = theme !== "system";

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-on-surface tracking-tight">
              {t("appearance", "Appearance & Theme")}
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stitch-primary/15 text-stitch-primary border border-stitch-primary/30">
              <Palette className="w-3 h-3" aria-hidden="true" />
              <span suppressHydrationWarning>
                {resolvedTheme === "light" ? "Light Active" : "Dark Active"}
              </span>
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Choose Stitch Light, Stitch Dark, or follow your device&apos;s system color scheme.
          </p>
        </div>

        {isOverridden && (
          <button
            type="button"
            onClick={() => setTheme("system")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface hover:border-stitch-primary hover:text-stitch-primary transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset to System</span>
          </button>
        )}
      </div>

      {/* Theme Mode Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5" role="radiogroup" aria-label="Color theme mode">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;
          const displayTitle =
            opt.id === "system"
              ? `System (Currently ${systemTheme})`
              : opt.title;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.id)}
              className={`group relative flex flex-col justify-between p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-stitch-primary/10 border-stitch-primary shadow-md"
                  : "bg-surface-container/60 border-outline-variant hover:border-stitch-outline hover:bg-surface-container"
              }`}
            >
              {/* Visual Preview Thumbnail */}
              <div
                className="w-full h-20 rounded-xl p-2.5 mb-3.5 border flex flex-col justify-between overflow-hidden"
                style={{
                  background: opt.previewBg,
                  borderColor: opt.previewBorder,
                }}
                aria-hidden="true"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-8 h-2 rounded-full"
                    style={{ backgroundColor: opt.previewAccent }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full border"
                    style={{
                      backgroundColor: isSelected ? opt.previewAccent : "transparent",
                      borderColor: opt.previewAccent,
                    }}
                  />
                </div>
                <div
                  className="w-full h-8 rounded-lg border p-1.5 flex items-center gap-1.5"
                  style={{
                    background: opt.previewCard,
                    borderColor: opt.previewBorder,
                  }}
                >
                  <span
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: opt.previewAccent }}
                  />
                  <span
                    className="flex-1 h-1.5 rounded-full opacity-50"
                    style={{ backgroundColor: opt.previewBorder }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-stitch-primary" : "text-on-surface-variant"
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      suppressHydrationWarning
                      className={`text-sm font-bold truncate ${
                        isSelected ? "text-stitch-primary" : "text-on-surface"
                      }`}
                    >
                      {displayTitle}
                    </span>
                  </div>

                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stitch-primary text-on-primary shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant shrink-0">
                      {opt.badgeText}
                    </span>
                  )}
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Status Info Banner */}
      <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/60 flex items-start gap-3">
        {resolvedTheme === "light" ? (
          <Sun className="w-4 h-4 text-stitch-primary shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <Moon className="w-4 h-4 text-stitch-primary shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="text-xs text-on-surface-variant space-y-1">
          <p className="font-semibold text-on-surface" suppressHydrationWarning>
            {theme === "system"
              ? `Following OS preference (Currently ${systemTheme} mode)`
              : `Pinned to ${theme === "light" ? "Stitch Light" : "Stitch Dark"} mode`}
          </p>
          <p>
            Your appearance preference syncs across browser tabs and is saved to your Manageo account profile. Public marketing pages stay in their dark studio aesthetic.
          </p>
        </div>
      </div>
    </div>
  );
}
