"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/context/LanguageContext";
import { FirebaseProvider } from "./notifications/FirebaseProvider";

export function Providers({ children, defaultLanguage = "es" }: { children: React.ReactNode, defaultLanguage?: "es" | "en" }) {
  return (
    <SessionProvider>
      <LanguageProvider defaultLanguage={defaultLanguage}>
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
