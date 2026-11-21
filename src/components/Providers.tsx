"use client";

import "@/lib/init-env";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider, type ThemeMode } from "@/context/ThemeContext";
import { FirebaseProvider } from "./notifications/FirebaseProvider";

export function Providers({
  children,
  defaultLanguage = "en",
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultLanguage?: "es" | "en";
  defaultTheme?: ThemeMode;
}) {
  useEffect(() => {
    // Prevent iOS Safari pinch zoom gestures
    const preventZoom = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", preventZoom, { passive: false });
    document.addEventListener("gesturechange", preventZoom, { passive: false });
    document.addEventListener("gestureend", preventZoom, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventZoom);
      document.removeEventListener("gesturechange", preventZoom);
      document.removeEventListener("gestureend", preventZoom);
    };
  }, []);

  return (
    <SessionProvider basePath="/api/auth">
      <ThemeProvider defaultTheme={defaultTheme}>
        <LanguageProvider defaultLanguage={defaultLanguage}>
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
