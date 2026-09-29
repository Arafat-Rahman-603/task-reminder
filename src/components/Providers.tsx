"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/context/LanguageContext";

export function Providers({ children, defaultLanguage = "es" }: { children: React.ReactNode, defaultLanguage?: "es" | "en" }) {
  return (
    <LanguageProvider defaultLanguage={defaultLanguage}>
      <SessionProvider>{children}</SessionProvider>
    </LanguageProvider>
  );
}
