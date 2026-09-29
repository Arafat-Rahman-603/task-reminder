"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/context/LanguageContext";
import { OneSignalProvider } from "./notifications/OneSignalProvider";

export function Providers({ children, defaultLanguage = "es" }: { children: React.ReactNode, defaultLanguage?: "es" | "en" }) {
  return (
    <SessionProvider>
      <LanguageProvider defaultLanguage={defaultLanguage}>
        <OneSignalProvider>
          {children}
        </OneSignalProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
