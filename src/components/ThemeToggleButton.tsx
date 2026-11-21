"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleButtonProps {
  variant?: "icon" | "row";
  className?: string;
  onToggle?: () => void;
}

export function ThemeToggleButton({
  variant = "icon",
  className,
  onToggle,
}: ThemeToggleButtonProps) {
  const { resolvedTheme, theme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  const handleClick = () => {
    toggleTheme();
    onToggle?.();
  };

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={nextLabel}
        title={nextLabel}
        suppressHydrationWarning
        className={cn(
          "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-surface-container/70 hover:text-on-surface bg-transparent",
          className
        )}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {isDark ? (
            <Sun className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 shrink-0 text-stitch-primary" aria-hidden="true" />
          )}
          <span className="truncate" suppressHydrationWarning>
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
        </span>
        <span
          suppressHydrationWarning
          className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant/40 shrink-0"
        >
          {theme === "system" ? "Auto" : theme}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={nextLabel}
      title={nextLabel}
      suppressHydrationWarning
      className={cn(
        "relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container/70 transition-colors",
        className
      )}
    >
      {isDark ? (
        <Sun className="w-[18px] h-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="w-[18px] h-[18px]" aria-hidden="true" />
      )}
      <span className="sr-only" suppressHydrationWarning>
        {nextLabel}
      </span>
    </button>
  );
}
