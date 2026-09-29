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
    if (status === "loading") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session?.user as any)?.id;

    if (!initAttempted.current) {
      initAttempted.current = true;
      initOneSignal(userId).catch(console.error);
    } else if (userId) {
      // If already initialized but session just loaded, login the user
      initOneSignal(userId).catch(console.error);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === "unauthenticated" && initAttempted.current) {
      logoutOneSignal().catch(console.error);
    }
  }, [status]);

  return <>{children}</>;
}
