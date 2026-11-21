"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { SessionContext } from "next-auth/react";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "color-scheme";
export const THEME_COOKIE_NAME = "manageo_theme";

const LIGHT_THEME_COLOR = "#f4f7fb";
const DARK_THEME_COLOR = "#0a0e1a";

export interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function isExplicitTheme(value: unknown): value is ResolvedTheme {
  return value === "light" || value === "dark";
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveTheme(mode: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme {
  return mode === "system" ? systemTheme : mode;
}

export function computeToggledTheme(
  currentResolved: ResolvedTheme,
  systemTheme: ResolvedTheme
): ThemeMode {
  const target: ResolvedTheme = currentResolved === "dark" ? "light" : "dark";
  return target === systemTheme ? "system" : target;
}

export function subscribeSystemTheme(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }
  if (typeof mql.addListener === "function") {
    mql.addListener(callback);
    return () => mql.removeListener(callback);
  }
  return () => {};
}

export function getSystemThemeSnapshot(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getSystemThemeServerSnapshot(): ResolvedTheme {
  return "dark";
}

export function readInitialTheme(defaultTheme: ThemeMode): ThemeMode {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isExplicitTheme(stored)) {
        return stored;
      }
    } catch {
      // Ignore storage access restrictions
    }
  }
  return isThemeMode(defaultTheme) ? defaultTheme : "system";
}

export function applyThemeToDom(mode: ThemeMode, resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");

  const metaContent = mode === "system" ? "light dark" : mode;
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta) {
    if (colorSchemeMeta.getAttribute("content") !== metaContent) {
      colorSchemeMeta.setAttribute("content", metaContent);
    }
  }

  const themeColor = resolved === "light" ? LIGHT_THEME_COLOR : DARK_THEME_COLOR;
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  themeColorMetas.forEach((meta) => {
    if (!meta.getAttribute("media") && meta.getAttribute("content") !== themeColor) {
      meta.setAttribute("content", themeColor);
    }
  });
}

function writeThemeCookie(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE_NAME}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}) {
  const sessionCtx = useContext(SessionContext);
  const isAuthenticated = sessionCtx?.status === "authenticated";

  const [theme, setThemeState] = useState<ThemeMode>(() => readInitialTheme(defaultTheme));
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  const resolvedTheme: ResolvedTheme = resolveTheme(theme, systemTheme);

  useEffect(() => {
    applyThemeToDom(theme, resolvedTheme);
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
      const next: ThemeMode = isExplicitTheme(event.newValue) ? event.newValue : "system";
      setThemeState(next);
      writeThemeCookie(next);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      if (!isThemeMode(next)) return;

      if (typeof window !== "undefined") {
        try {
          if (next === "system") {
            window.localStorage.removeItem(THEME_STORAGE_KEY);
          } else {
            window.localStorage.setItem(THEME_STORAGE_KEY, next);
          }
        } catch {
          // Ignore storage write failure; state still updates
        }
      }

      writeThemeCookie(next);
      setThemeState(next);
      applyThemeToDom(next, resolveTheme(next, systemTheme));

      if (isAuthenticated && typeof fetch === "function") {
        fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: next }),
        }).catch(() => {
          // Non-blocking preference persistence
        });
      }
    },
    [isAuthenticated, systemTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(computeToggledTheme(resolvedTheme, systemTheme));
  }, [resolvedTheme, setTheme, systemTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, systemTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

export function useThemeOptional(): ThemeContextValue | undefined {
  return useContext(ThemeContext);
}
