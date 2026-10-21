import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { isActualIOS, isStandalonePWA } from "@/lib/device";

export type NotificationHealthStatus = 
  | "UNKNOWN_ERROR"
  | "BROWSER_UNSUPPORTED"
  | "IOS_PWA_REQUIRED"
  | "PERMISSION_DENIED"
  | "PERMISSION_REQUIRED"
  | "SERVICE_WORKER_MISSING"
  | "SERVICE_WORKER_NOT_READY"
  | "NOT_SUBSCRIBED"
  | "SUBSCRIPTION_PENDING"
  | "IDENTITY_MISMATCH"
  | "DISABLED"
  | "SERVER_SYNC_PROBLEM"
  | "SYNC_STALE"
  | "HEALTHY";

export interface NotificationHealth {
  status: NotificationHealthStatus;
  canRequestPermission: boolean;
  canReconnect: boolean;
  needsManualSettings: boolean;
  isPWA: boolean;
  isIOS: boolean;
  isIOSStandalone: boolean;
  message: string;
  details: {
    permission: string;
    hasSubscription: boolean;
    isOptedIn: boolean;
    hasExternalId: boolean;
    externalIdMatches: boolean;
    hasServiceWorker: boolean;
    serviceWorkerReady: boolean;
    browserSupport: boolean;
    serverStatus?: string;
    serverSubscribed?: boolean;
    serverIdentitySynced?: boolean;
    serverSyncStale?: boolean;
  };
}

let cachedHealth: NotificationHealth | null = null;

export function useNotificationHealth() {
  const { data: session } = useSession();
  const [health, setHealth] = useState<NotificationHealth>(() => {
    if (cachedHealth) {
      return cachedHealth;
    }
    const isBrowser = typeof window !== "undefined" && "Notification" in window;
    const isGranted = isBrowser && Notification.permission === "granted";

    return {
      status: isGranted ? "HEALTHY" : "UNKNOWN_ERROR",
      canRequestPermission: isBrowser && Notification.permission === "default",
      canReconnect: false,
      needsManualSettings: isBrowser && Notification.permission === "denied",
      isPWA: false,
      isIOS: false,
      isIOSStandalone: false,
      message: isGranted ? "Notifications are enabled and working" : "Checking notification status...",
      details: {
        permission: isBrowser ? Notification.permission : "unsupported",
        hasSubscription: isGranted,
        isOptedIn: isGranted,
        hasExternalId: true,
        externalIdMatches: true,
        hasServiceWorker: false,
        serviceWorkerReady: false,
        browserSupport: isBrowser,
      },
    };
  });

  const [isChecking, setIsChecking] = useState<boolean>(() => !cachedHealth);

  const checkHealth = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const isIOS = isActualIOS();
      const isPWA = isStandalonePWA();
      const isIOSStandalone = isIOS && isPWA;
      const browserSupport = "Notification" in window;

      // On iOS Safari browser tabs, background push is blocked by Apple unless added to Home Screen (iOS 16.4+)
      // Only require iOS PWA if this is a genuine iOS device without PWA install and without native Notification support
      if (isIOS && !isPWA && !browserSupport) {
        setHealth({
          status: "IOS_PWA_REQUIRED",
          canRequestPermission: false,
          canReconnect: false,
          needsManualSettings: false,
          isPWA: false,
          isIOS: true,
          isIOSStandalone: false,
          message: "On iPhone/iPad, add Manageo to Home Screen to receive notifications when closed",
          details: {
            permission: "unsupported_in_tab",
            hasSubscription: false,
            isOptedIn: false,
            hasExternalId: true,
            externalIdMatches: true,
            hasServiceWorker: false,
            serviceWorkerReady: false,
            browserSupport: false,
          },
        });
        return;
      }
      if (!browserSupport) {
        setHealth(h => ({
          ...h,
          status: "BROWSER_UNSUPPORTED",
          isIOS,
          isIOSStandalone,
          message: isIOS
            ? "Requires iOS 16.4+ and Add to Home Screen to receive notifications"
            : "Notifications are not supported in this browser"
        }));
        return;
      }

      const permission = Notification.permission;

      let hasServiceWorker = false;
      let serviceWorkerReady = false;
      if ("serviceWorker" in navigator) {
        try {
          let registrations = await navigator.serviceWorker.getRegistrations();
          if (registrations.length === 0) {
            try {
              await navigator.serviceWorker.register("/sw.js", { scope: "/" });
              registrations = await navigator.serviceWorker.getRegistrations();
            } catch (err) {
              console.warn("Auto SW registration attempt:", err);
            }
          }
          hasServiceWorker = registrations.length > 0;
          if (hasServiceWorker) {
            await Promise.race([
              navigator.serviceWorker.ready,
              new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500))
            ]);
            serviceWorkerReady = true;
          }
        } catch (e) {
          console.warn("SW check failed:", e);
        }
      }

      // Server health
      let serverStatus: string | undefined;
      let serverSubscribed: boolean | undefined;

      try {
        const healthRes = await fetch("/api/notifications/health");
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          serverStatus = healthData.status;
          serverSubscribed = healthData.subscribed;
        }
      } catch (e) {
        console.warn("Server health check failed:", e);
      }

      let status: NotificationHealthStatus;
      let message: string;

      if (permission === "denied") {
        status = "PERMISSION_DENIED";
        message = "Your browser is blocking Manageo notifications";
      } else if (permission === "default") {
        status = "PERMISSION_REQUIRED";
        message = "Allow notifications so Manageo can send your reminders";
      } else if (!hasServiceWorker) {
        status = "SERVICE_WORKER_MISSING";
        message = "Manageo's background notification service is not available";
      } else if (!serviceWorkerReady) {
        status = "SERVICE_WORKER_NOT_READY";
        message = "Manageo's background notification service is not ready";
      } else if (serverStatus === "DISABLED") {
        status = "DISABLED";
        message = "Push notifications are disabled in settings";
      } else if (!serverSubscribed) {
        status = "NOT_SUBSCRIBED";
        message = "This device is not subscribed to Manageo notifications";
      } else if (permission === "granted" && serverStatus === "HEALTHY") {
        status = "HEALTHY";
        message = "Notifications are enabled and working";
      } else {
        status = "UNKNOWN_ERROR";
        message = "Unable to determine notification status";
      }

      const computedHealth: NotificationHealth = {
        status,
        canRequestPermission: permission === "default",
        canReconnect: permission === "granted" && !serverSubscribed,
        needsManualSettings: permission === "denied",
        isPWA,
        isIOS,
        isIOSStandalone,
        message,
        details: {
          permission,
          hasSubscription: serverSubscribed || false,
          isOptedIn: permission === "granted",
          hasExternalId: true,
          externalIdMatches: true,
          hasServiceWorker,
          serviceWorkerReady,
          browserSupport,
          serverStatus,
          serverSubscribed,
        },
      };

      cachedHealth = computedHealth;
      setHealth(computedHealth);
      setIsChecking(false);
    } catch (error) {
      console.error("Error checking notification health:", error);
      setIsChecking(false);
    }
  }, [session]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth, session]);

  return { health, isChecking, checkHealth, refresh: checkHealth };
}
