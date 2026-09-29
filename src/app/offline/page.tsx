"use client";

import { Wifi, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface p-6">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-surface-container-low flex items-center justify-center shadow-xl border border-surface-variant/30">
          <Wifi className="w-12 h-12 text-on-surface-variant opacity-40" strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-error flex items-center justify-center shadow-md">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-on-surface mb-2 text-center">
        You&apos;re Offline
      </h1>
      <p className="text-on-surface-variant text-center max-w-sm mb-8">
        It looks like you lost your internet connection. Check your network and try again.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>

      <p className="mt-8 text-xs text-on-surface-variant/50 text-center">
        Manageo · Offline Mode
      </p>
    </div>
  );
}
