import fs from "fs";
import path from "path";

describe("Safe Area & PWA Notch Resilience", () => {
  const rootDir = path.resolve(__dirname, "..");

  test("manifest.json defines standalone display with window-controls-overlay and dark theme", () => {
    const manifestPath = path.join(rootDir, "public", "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifest.display).toBe("standalone");
    expect(manifest.display_override).toContain("standalone");
    expect(manifest.display_override).toContain("window-controls-overlay");
    expect(manifest.theme_color).toBe("#09090b");
    expect(manifest.background_color).toBe("#09090b");
  });

  test("globals.css defines cross-device safe-area tokens and PWA standalone notch fallback", () => {
    const cssPath = path.join(rootDir, "src", "app", "globals.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    // Root tokens
    expect(css).toContain("--safe-area-top: env(safe-area-inset-top, 0px)");
    expect(css).toContain("--safe-area-bottom: env(safe-area-inset-bottom, 0px)");

    // PWA standalone fallback media query
    expect(css).toContain("(display-mode: standalone)");
    expect(css).toContain("--safe-area-top: env(safe-area-inset-top, 0px)");
    expect(css).toContain("max(env(safe-area-inset-bottom, 0px), 16px)");

    // .pwa-standalone class
    expect(css).toContain("html.pwa-standalone");

    // Utilities
    expect(css).toContain(".pt-safe");
    expect(css).toContain("var(--safe-area-top");
    expect(css).toContain("var(--safe-area-bottom");
  });

  test("RootLayout includes viewport-fit=cover, theme-color, and mounts SafeAreaManager", () => {
    const layoutPath = path.join(rootDir, "src", "app", "layout.tsx");
    const layout = fs.readFileSync(layoutPath, "utf-8");

    expect(layout).toContain('viewportFit: "cover"');
    expect(layout).toContain('viewport-fit=cover');
    expect(layout).toContain('name="theme-color"');
    expect(layout).toContain("SafeAreaManager");
    expect(layout).toContain("<SafeAreaManager />");
  });

  test("MobileNav and DashboardLayout utilize dynamic safe-area tokens", () => {
    const mobileNavPath = path.join(rootDir, "src", "components", "MobileNav.tsx");
    const mobileNav = fs.readFileSync(mobileNavPath, "utf-8");

    expect(mobileNav).toContain("var(--safe-area-top, env(safe-area-inset-top, 0px))");
    expect(mobileNav).toContain("var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))");

    const dashLayoutPath = path.join(rootDir, "src", "app", "dashboard", "layout.tsx");
    const dashLayout = fs.readFileSync(dashLayoutPath, "utf-8");

    expect(dashLayout).toContain("var(--safe-area-top, env(safe-area-inset-top, 0px))");
    expect(dashLayout).toContain("var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))");
  });
});
