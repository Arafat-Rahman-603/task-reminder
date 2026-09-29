import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { headers } from "next/headers";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import StartupLoader from "@/components/StartupLoader";

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
  const lang = (reqHeaders.get("x-language") || "es") as "es" | "en";
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
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const lang = (reqHeaders.get("x-language") || "es") as "es" | "en";

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      // Inline style applied before ANY CSS loads — prevents white flash
      // (next-themes adds class="dark" after hydration; this covers the gap)
      style={{ backgroundColor: "#09090b" }}
      suppressHydrationWarning
    >
      <head>
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
        {/* Startup loader — SSR-rendered, fades out after hydration */}
        <StartupLoader />
        <ServiceWorkerRegistration />
        <Providers defaultLanguage={lang}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
