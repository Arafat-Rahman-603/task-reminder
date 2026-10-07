import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export type NotificationHealthStatus = 
  | "UNKNOWN_ERROR"
  | "BROWSER_UNSUPPORTED"
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

export function useNotificationHealth() {
  const { data: session } = useSession();
  const [health, setHealth] = useState<NotificationHealth>({
    status: "UNKNOWN_ERROR",
    canRequestPermission: false,
    canReconnect: false,
    needsManualSettings: false,
    isPWA: false,
    message: "Checking notification status...",
    details: {
      permission: "unsupported",
      hasSubscription: false,
      isOptedIn: false,
      hasExternalId: false,
      externalIdMatches: false,
      hasServiceWorker: false,
      serviceWorkerReady: false,
      browserSupport: false,
    },
  });

  const checkHealth = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const browserSupport = "Notification" in window;
      if (!browserSupport) {
        setHealth(h => ({
          ...h,
          status: "BROWSER_UNSUPPORTED",
          message: "Notifications are not supported in this browser"
        }));
        return;
      }

      const isPWA = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
      const permission = Notification.permission;

      let hasServiceWorker = false;
      let serviceWorkerReady = false;
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        hasServiceWorker = registrations.length > 0;
        if (hasServiceWorker) {
          await navigator.serviceWorker.ready;
          serviceWorkerReady = true;
        }
      } catch (e) {}

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

      setHealth({
        status,
        canRequestPermission: permission === "default",
        canReconnect: permission === "granted" && !serverSubscribed,
        needsManualSettings: permission === "denied",
        isPWA,
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
      });
    } catch (error) {
      console.error("Error checking notification health:", error);
    }
  }, [session]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth, session]);

  return { health, checkHealth, refresh: checkHealth };
}
