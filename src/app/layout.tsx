import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { headers } from "next/headers";
import { getLocalizedMetadata } from "@/lib/seo/metadata";

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
  themeColor: "#000000",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const lang = (reqHeaders.get("x-language") || "es") as "es" | "en";

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Manageo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#38bdf8" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <Providers defaultLanguage={lang}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
