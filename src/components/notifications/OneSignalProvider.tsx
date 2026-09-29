"use client";

import { useEffect, useRef } from "react";
import { initOneSignal, logoutOneSignal } from "@/lib/notifications/onesignal-client";
// Assuming there's a useAuth or similar to get current user id, 
// let's check what auth library is used. It's next-auth.
import { useSession } from "next-auth/react";

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const initAttempted = useRef(false);

  useEffect(() => {
    // Only run if session is loaded (either authenticated or unauthenticated)
    if (status === "loading") return;

    if (!initAttempted.current) {
      initAttempted.current = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (session?.user as any)?.id;
      initOneSignal(userId).catch(console.error);
    }
  }, [session, status]);

  // Handle logout: if session becomes null but was previously there, 
  // we might want to logoutOneSignal. 
  // However, next-auth unmounts or redirects on logout, so this might be handled 
  // in the actual logout button. We can also watch session changes:
  useEffect(() => {
    if (status === "unauthenticated" && initAttempted.current) {
      logoutOneSignal().catch(console.error);
    }
  }, [status]);

  return <>{children}</>;
}
