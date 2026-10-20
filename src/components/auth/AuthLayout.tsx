import React from "react";
import { Logo } from "@/components/Logo";

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-surface p-8 rounded-2xl shadow-xl shadow-black/5 border border-border">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo variant="auth" href="/" priority />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
