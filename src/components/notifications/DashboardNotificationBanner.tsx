"use client";

import { useState, useEffect } from "react";
import { BellOff, X, ArrowRight, Loader2 } from "lucide-react";
import { useNotificationHealth } from "@/hooks/useNotificationHealth";
import { requestPushPermission, initFirebasePush } from "@/lib/notifications/firebase-client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function DashboardNotificationBanner() {
  const router = useRouter();
  const { health, refresh } = useNotificationHealth();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      const isDismissed = sessionStorage.getItem(`manageo_notif_banner_dismissed_${userId}`);
      if (isDismissed === "true") {
        setDismissed(true);
      }
    }
  }, [userId]);

  // Do NOT show if notifications are healthy, status still unknown, or user dismissed for this session
  if (health.status === "HEALTHY" || health.status === "UNKNOWN_ERROR" || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined" && userId) {
      sessionStorage.setItem(`manageo_notif_banner_dismissed_${userId}`, "true");
    }
  };

  const handleTurnOn = async () => {
    setLoading(true);
    try {
      if (health.canRequestPermission) {
        const granted = await requestPushPermission();
        if (granted) {
          if (userId) {
            await initFirebasePush(userId);
          }
          await fetch("/api/notifications/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pushEnabled: true }),
          });
          await refresh();
          return;
        }
      } else if (health.details.permission === "granted") {
        if (userId) {
          await initFirebasePush(userId);
        }
        await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pushEnabled: true }),
        });
        await refresh();
        return;
      }

      // If permission is denied or manual settings required, navigate to settings
      router.push("/dashboard/settings");
    } catch (e) {
      console.error("Failed to enable notifications from banner:", e);
      router.push("/dashboard/settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-md p-4 sm:p-5 mb-2 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
            <BellOff className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
              Notifications are turned off
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 leading-relaxed">
              Turn on notifications to receive task, routine, and daily reminder alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto self-end sm:self-center">
          <button
            onClick={handleTurnOn}
            disabled={loading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Turn On Notifications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20 transition-colors"
            title="Dismiss for now"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
