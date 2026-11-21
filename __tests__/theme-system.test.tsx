import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { POST as updatePreferences } from "@/app/api/user/preferences/route";
import { LanguageProvider } from "@/context/LanguageContext";
import {
  ThemeProvider,
  THEME_STORAGE_KEY,
  applyThemeToDom,
  computeToggledTheme,
  getSystemThemeSnapshot,
  readInitialTheme,
  resolveTheme,
  subscribeSystemTheme,
} from "@/context/ThemeContext";
import ThemeSettings from "@/app/dashboard/settings/ThemeSettings";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

jest.mock("next-auth/react", () => ({
  SessionContext: React.createContext(undefined),
  useSession: () => ({ data: null, status: "unauthenticated", update: jest.fn() }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe("Stitch Light, Dark & System Theme System", () => {
  const rootDir = path.resolve(__dirname, "..");

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).document;
    jest.restoreAllMocks();
  });

  test("globals.css implements standards-compliant color-scheme tokens and dynamic Stitch Light/Dark variables", () => {
    const css = fs.readFileSync(path.join(rootDir, "src", "app", "globals.css"), "utf-8");

    expect(css).toContain("@custom-variant dark");
    expect(css).toContain("color-scheme: light dark;");
    expect(css).toContain('--color-stitch-background: var(--stitch-background);');
    expect(css).toContain('--color-on-surface: var(--on-surface);');
    expect(css).toContain('--color-stitch-primary: var(--stitch-primary);');
    expect(css).toContain(':root:has(> head > meta[name="color-scheme"][content="dark"])');
    expect(css).toContain(':root:has(> head > meta[name="color-scheme"][content="light"])');
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain("@supports (color: light-dark(white, black))");
    expect(css).toContain(".force-dark-scheme");
    expect(css).toContain("color-scheme: only dark;");
    expect(css).toContain("scrollbar-color: var(--stitch-outline) transparent;");
    expect(css).toContain("@supports not (scrollbar-color: auto)");
    expect(css).toContain(".stitch-logo-img");
  });

  test("RootLayout embeds color-scheme meta, synchronous FOUC script, and PublicLayout preserves force-dark-scheme", () => {
    const rootLayout = fs.readFileSync(path.join(rootDir, "src", "app", "layout.tsx"), "utf-8");
    const publicLayout = fs.readFileSync(
      path.join(rootDir, "src", "app", "(public)", "layout.tsx"),
      "utf-8"
    );

    expect(rootLayout).toContain('<meta name="color-scheme" content={ssrMetaColorScheme} />');
    expect(rootLayout).toContain('localStorage.getItem("color-scheme")');
    expect(rootLayout).toContain("THEME_INIT_SCRIPT");
    expect(rootLayout).toContain('color: "#f4f7fb"');
    expect(rootLayout).toContain('color: "#0a0e1a"');
    expect(rootLayout).toContain("defaultTheme={defaultTheme}");
    expect(publicLayout).toContain("force-dark-scheme");
  });

  test("readInitialTheme respects localStorage override and falls back cleanly when absent", () => {
    const storageMap = new Map<string, string>();
    (globalThis as Record<string, unknown>).window = {
      localStorage: {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => void storageMap.set(k, v),
        removeItem: (k: string) => void storageMap.delete(k),
      },
    };

    expect(readInitialTheme("system")).toBe("system");

    storageMap.set(THEME_STORAGE_KEY, "light");
    expect(readInitialTheme("system")).toBe("light");

    storageMap.set(THEME_STORAGE_KEY, "dark");
    expect(readInitialTheme("light")).toBe("dark");
  });

  test("applyThemeToDom updates html classes, data-theme, meta color-scheme, and unqualified theme-color", () => {
    const classes = new Set<string>(["dark"]);
    const dataset: Record<string, string> = {};
    let colorSchemeContent = "light dark";
    let unqualifiedThemeColor = "#0a0e1a";
    let mediaThemeColor = "#f4f7fb";

    const colorSchemeMeta = {
      getAttribute: (name: string) => (name === "content" ? colorSchemeContent : null),
      setAttribute: (_name: string, val: string) => {
        colorSchemeContent = val;
      },
    };
    const mediaMetaNode = {
      getAttribute: (name: string) =>
        name === "media" ? "(prefers-color-scheme: light)" : name === "content" ? mediaThemeColor : null,
      setAttribute: (_name: string, val: string) => {
        mediaThemeColor = val;
      },
    };
    const dynamicThemeMetaNode = {
      getAttribute: (name: string) => (name === "content" ? unqualifiedThemeColor : null),
      setAttribute: (_name: string, val: string) => {
        unqualifiedThemeColor = val;
      },
    };

    (globalThis as Record<string, unknown>).document = {
      documentElement: {
        dataset,
        classList: {
          toggle: (token: string, force?: boolean) => {
            if (force) classes.add(token);
            else classes.delete(token);
            return classes.has(token);
          },
        },
      },
      querySelector: (selector: string) =>
        selector === 'meta[name="color-scheme"]' ? colorSchemeMeta : null,
      querySelectorAll: (selector: string) =>
        selector === 'meta[name="theme-color"]' ? [mediaMetaNode, dynamicThemeMetaNode] : [],
    };

    applyThemeToDom("light", "light");
    expect(dataset.theme).toBe("light");
    expect(classes.has("light")).toBe(true);
    expect(classes.has("dark")).toBe(false);
    expect(colorSchemeContent).toBe("light");
    expect(unqualifiedThemeColor).toBe("#f4f7fb");
    expect(mediaThemeColor).toBe("#f4f7fb");

    applyThemeToDom("system", "dark");
    expect(dataset.theme).toBe("system");
    expect(classes.has("dark")).toBe(true);
    expect(classes.has("light")).toBe(false);
    expect(colorSchemeContent).toBe("light dark");
    expect(unqualifiedThemeColor).toBe("#0a0e1a");
  });

  test("computeToggledTheme reverts to system only when toggled target matches current systemTheme", () => {
    expect(resolveTheme("system", "light")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");

    // Currently viewing dark while OS is light -> toggling aims for light (matches OS) -> revert to "system"
    expect(computeToggledTheme("dark", "light")).toBe("system");
    // Currently viewing light while OS is light -> toggling aims for dark (differs from OS) -> pin "dark"
    expect(computeToggledTheme("light", "light")).toBe("dark");
    // Currently viewing dark while OS is dark -> toggling aims for light (differs from OS) -> pin "light"
    expect(computeToggledTheme("dark", "dark")).toBe("light");
    // Currently viewing light while OS is dark -> toggling aims for dark (matches OS) -> revert to "system"
    expect(computeToggledTheme("light", "dark")).toBe("system");
  });

  test("subscribeSystemTheme handles matchMedia change events without removing stored localStorage overrides", () => {
    let darkMatches = false;
    let changeHandler: (() => void) | undefined;
    const storageMap = new Map<string, string>([[THEME_STORAGE_KEY, "light"]]);

    (globalThis as Record<string, unknown>).window = {
      localStorage: {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => void storageMap.set(k, v),
        removeItem: jest.fn((k: string) => storageMap.delete(k)),
      },
      matchMedia: () => ({
        get matches() {
          return darkMatches;
        },
        addEventListener: (_ev: string, cb: () => void) => {
          changeHandler = cb;
        },
        removeEventListener: jest.fn(),
      }),
    };

    expect(getSystemThemeSnapshot()).toBe("light");
    const listener = jest.fn();
    const unsubscribe = subscribeSystemTheme(listener);

    darkMatches = true;
    changeHandler?.();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getSystemThemeSnapshot()).toBe("dark");
    expect(storageMap.get(THEME_STORAGE_KEY)).toBe("light");
    unsubscribe();
  });

  test("ThemeSettings and ThemeToggleButton render all modes with accessible labels and active states", () => {
    const systemHtml = renderToStaticMarkup(
      <ThemeProvider defaultTheme="system">
        <LanguageProvider defaultLanguage="en">
          <ThemeSettings />
          <ThemeToggleButton variant="row" />
        </LanguageProvider>
      </ThemeProvider>
    );

    expect(systemHtml).toContain("Stitch Light");
    expect(systemHtml).toContain("Stitch Dark");
    expect(systemHtml).toContain("System (Currently dark)");
    expect(systemHtml).toContain('role="radiogroup"');
    expect(systemHtml).toContain("Active");
    expect(systemHtml).toContain("Switch to light theme");

    const lightHtml = renderToStaticMarkup(
      <ThemeProvider defaultTheme="light">
        <LanguageProvider defaultLanguage="en">
          <ThemeSettings />
          <ThemeToggleButton variant="icon" />
        </LanguageProvider>
      </ThemeProvider>
    );

    expect(lightHtml).toContain("Reset to System");
    expect(lightHtml).toContain("Pinned to Stitch Light mode");
    expect(lightHtml).toContain("Switch to dark theme");
  });

  test("POST /api/user/preferences validates and persists theme preference in MongoDB", async () => {
    await dbConnect();
    const user = await User.create({
      name: "Theme Tester",
      email: `theme-${Date.now()}@example.com`,
      passwordHash: "hash",
      preferences: { theme: "system" },
    });

    mockGetServerSession.mockResolvedValue({
      user: { id: (user._id as mongoose.Types.ObjectId).toString(), email: user.email },
    });

    const invalidRes = await updatePreferences(
      new Request("http://localhost:3000/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: "invalid-theme" }),
      })
    );
    expect(invalidRes.status).toBe(400);

    const lightRes = await updatePreferences(
      new Request("http://localhost:3000/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: "light" }),
      })
    );
    expect(lightRes.status).toBe(200);
    const body = await lightRes.json();
    expect(body.preferences.theme).toBe("light");

    const updatedUser = await User.findById(user._id).lean();
    expect(updatedUser?.preferences?.theme).toBe("light");
  });
});
