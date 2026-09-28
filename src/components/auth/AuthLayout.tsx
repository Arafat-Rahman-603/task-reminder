import Link from "next/link";
import React from "react";

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-surface p-8 rounded-2xl shadow-xl shadow-black/5 border border-border">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tight text-primary">Personal OS</span>
          </Link>
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
