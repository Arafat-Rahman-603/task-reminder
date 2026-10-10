"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export function ForceLogout() {
  useEffect(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-stitch-background text-on-surface">
      <div className="animate-spin h-8 w-8 border-4 border-stitch-primary border-t-transparent rounded-full mb-4"></div>
      <p className="text-sm font-medium">Session expired. Redirecting...</p>
    </div>
  );
}
