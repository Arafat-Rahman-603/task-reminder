"use client";

import "@/lib/init-env";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/context/LanguageContext";
import { FirebaseProvider } from "./notifications/FirebaseProvider";

export function Providers({ children, defaultLanguage = "en" }: { children: React.ReactNode, defaultLanguage?: "es" | "en" }) {
  return (
    <SessionProvider basePath="/api/auth">
      <LanguageProvider defaultLanguage={defaultLanguage}>
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
