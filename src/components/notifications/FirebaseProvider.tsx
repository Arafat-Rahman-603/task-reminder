"use client";

import { useEffect, useRef } from "react";
import { initFirebasePush } from "@/lib/notifications/firebase-client";
import { useSession } from "next-auth/react";

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const initAttempted = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session?.user as any)?.id;

    if (!initAttempted.current) {
      initAttempted.current = true;
      initFirebasePush(userId).catch(console.warn);
    } else if (userId) {
      // Re-initialize if user session is loaded
      initFirebasePush(userId).catch(console.warn);
    }
  }, [session, status]);

  return <>{children}</>;
}
