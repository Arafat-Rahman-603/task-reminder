import "@/lib/init-env";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { headers } from "next/headers";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
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
  const lang = (reqHeaders.get("x-language") || "en") as "en" | "es";
  // Root layout metadata is just a fallback, specific pages should override it.
  return getLocalizedMetadata({ lang, path: "/" });
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#09090b" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // CRITICAL: enables safe-area-inset-* CSS env vars
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const lang = (reqHeaders.get("x-language") || "en") as "en" | "es";

  return (
    <html
      lang={lang}
      // dark class applied server-side — CSS dark variables active from first byte
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
      style={{ backgroundColor: "#09090b" }}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#09090b" />
        <meta name="msapplication-navbutton-color" content="#09090b" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        {/* iOS PWA: allow content to extend under status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Manageo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        {/* Immediate zero-delay standalone detector to prevent safe-area flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                                   window.matchMedia('(display-mode: fullscreen)').matches ||
                                   window.matchMedia('(display-mode: minimal-ui)').matches ||
                                   navigator.standalone === true ||
                                   location.search.indexOf('pwa=true') !== -1;
                if (isStandalone) {
                  document.documentElement.classList.add('pwa-standalone');
                }
              } catch(e){}
            })();`,
          }}
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-background text-foreground" suppressHydrationWarning>
        {/* Headless Google Translate + DOM Reconciliation Guard */}
        <GoogleTranslateScript />
        {/* Startup loader — SSR-rendered, fades out after hydration */}
        <StartupLoader />
        <SafeAreaManager />
        <ServiceWorkerRegistration />
        <Providers defaultLanguage={lang}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
