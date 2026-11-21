import "@/lib/init-env";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { headers, cookies } from "next/headers";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { DEFAULT_LANGUAGE } from "@/lib/seo/site";
import type { ThemeMode } from "@/context/ThemeContext";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import SafeAreaManager from "@/components/pwa/SafeAreaManager";
import StartupLoader from "@/components/StartupLoader";
import { GoogleTranslateScript } from "@/components/public/GoogleTranslateScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const reqHeaders = await headers();
  const lang = (reqHeaders.get("x-language") || DEFAULT_LANGUAGE) as "en" | "es";
  // Root layout metadata is just a fallback, specific pages should override it.
  return getLocalizedMetadata({ lang, path: "/" });
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // CRITICAL: enables safe-area-inset-* CSS env vars
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("color-scheme");var m=document.querySelector('meta[name="color-scheme"]');var tc=document.querySelector('meta[name="theme-color"]:not([media])');var r=document.documentElement;var mode=(s==="light"||s==="dark")?s:((r.dataset.theme==="light"||r.dataset.theme==="dark")?r.dataset.theme:"system");if(s==="light"||s==="dark"){if(m)m.setAttribute("content",s);r.dataset.theme=s;}else{if(m&&!m.getAttribute("content"))m.setAttribute("content","light dark");}var resolved=(mode==="light"||mode==="dark")?mode:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");if(resolved==="dark"){r.classList.add("dark");r.classList.remove("light");if(tc)tc.setAttribute("content","#0a0e1a");}else{r.classList.add("light");r.classList.remove("dark");if(tc)tc.setAttribute("content","#f4f7fb");}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [reqHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const lang = (reqHeaders.get("x-language") || DEFAULT_LANGUAGE) as "en" | "es";
  const rawThemeCookie = cookieStore.get("manageo_theme")?.value;
  const defaultTheme: ThemeMode =
    rawThemeCookie === "light" || rawThemeCookie === "dark" || rawThemeCookie === "system"
      ? rawThemeCookie
      : "system";
  const ssrMetaColorScheme = defaultTheme === "system" ? "light dark" : defaultTheme;
  const ssrThemeClass = defaultTheme === "system" ? "" : ` ${defaultTheme}`;
  const ssrThemeColor = defaultTheme === "light" ? "#f4f7fb" : "#0a0e1a";

  return (
    <html
      lang={lang}
      data-theme={defaultTheme}
      className={`${geistSans.variable} ${geistMono.variable}${ssrThemeClass} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content={ssrMetaColorScheme} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content={ssrThemeColor} />
        <meta name="msapplication-navbutton-color" content={ssrThemeColor} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        {/* iOS PWA: allow content to extend under status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Manageo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
      </head>
      <body className="min-h-dvh flex flex-col bg-background text-foreground" suppressHydrationWarning>
        {/* Headless Google Translate + DOM Reconciliation Guard */}
        <GoogleTranslateScript />
        {/* Startup loader — SSR-rendered, fades out after hydration */}
        <StartupLoader />
        <SafeAreaManager />
        <ServiceWorkerRegistration />
        <Providers defaultLanguage={lang} defaultTheme={defaultTheme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
