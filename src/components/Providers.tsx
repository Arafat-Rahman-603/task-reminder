"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";

import { LanguageProvider } from "@/context/LanguageContext";

export function Providers({ children, defaultLanguage = "es" }: { children: React.ReactNode, defaultLanguage?: "es" | "en" }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
      <LanguageProvider defaultLanguage={defaultLanguage}>
        <SessionProvider>{children}</SessionProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
