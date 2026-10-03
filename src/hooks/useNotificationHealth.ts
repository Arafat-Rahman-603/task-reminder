"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export type NotificationHealthStatus =
  | "HEALTHY"
  | "PERMISSION_REQUIRED"
  | "PERMISSION_DENIED"
  | "NOT_SUBSCRIBED"
  | "SUBSCRIPTION_PENDING"
  | "SERVICE_WORKER_MISSING"
  | "SERVICE_WORKER_NOT_READY"
  | "IDENTITY_MISMATCH"
  | "BROWSER_UNSUPPORTED"
  | "UNKNOWN_ERROR";

export interface NotificationHealth {
  status: NotificationHealthStatus;
  canRequestPermission: boolean;
  canReconnect: boolean;
  needsManualSettings: boolean;
  isPWA: boolean;
  message: string;
  details: {
    permission: NotificationPermission | "unsupported";
    hasSubscription: boolean;
    isOptedIn: boolean;
    hasExternalId: boolean;
    externalIdMatches: boolean;
    hasServiceWorker: boolean;
    serviceWorkerReady: boolean;
    browserSupport: boolean;
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
      // Check browser support
      const browserSupport = "Notification" in window;
      if (!browserSupport) {
        setHealth({
          status: "BROWSER_UNSUPPORTED",
          canRequestPermission: false,
          canReconnect: false,
          needsManualSettings: false,
          isPWA: false,
          message: "Notifications are not supported in this browser",
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
        return;
      }

      // Check PWA status
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      // Check permission
      const permission = Notification.permission;

      // Check Service Worker
      let hasServiceWorker = false;
      let serviceWorkerReady = false;
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        hasServiceWorker = registrations.length > 0;
        if (hasServiceWorker) {
          await navigator.serviceWorker.ready;
          serviceWorkerReady = true;
        }
      } catch (e) {
        // Service worker not available
      }

      // Check OneSignal subscription
      let hasSubscription = false;
      let isOptedIn = false;
      let hasExternalId = false;
      let externalIdMatches = false;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const OneSignal = (await import("react-onesignal")).default;
        
        // Check subscription status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (OneSignal.User && OneSignal.User.PushSubscription) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sub = OneSignal.User.PushSubscription as any;
          hasSubscription = !!sub.id;
          isOptedIn = sub.optedIn === true;
          
          // Check external ID
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const externalId = (OneSignal.User as any).externalId;
          hasExternalId = !!externalId;
          
          // Check if external ID matches current user
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userId = (session?.user as any)?.id;
          externalIdMatches = externalId === userId;
        }
      } catch (e) {
        // OneSignal not initialized or not available
        console.warn("OneSignal check failed:", e);
      }

      // Determine status based on actual state
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
      } else if (!hasSubscription) {
        status = "NOT_SUBSCRIBED";
        message = "This device is not subscribed to Manageo notifications";
      } else if (!isOptedIn) {
        status = "SUBSCRIPTION_PENDING";
        message = "Notification subscription is being set up";
      } else if (hasExternalId && !externalIdMatches) {
        status = "IDENTITY_MISMATCH";
        message = "Your notification device is not connected to your Manageo account";
      } else if (hasSubscription && isOptedIn && externalIdMatches) {
        status = "HEALTHY";
        message = "Notifications are enabled and working";
      } else {
        status = "UNKNOWN_ERROR";
        message = "Unable to determine notification status";
      }

      setHealth({
        status,
        canRequestPermission: permission === "default",
        canReconnect: permission === "granted" && (!hasSubscription || !isOptedIn || !externalIdMatches),
        needsManualSettings: permission === "denied",
        isPWA,
        message,
        details: {
          permission,
          hasSubscription,
          isOptedIn,
          hasExternalId,
          externalIdMatches,
          hasServiceWorker,
          serviceWorkerReady,
          browserSupport,
        },
      });
    } catch (error) {
      console.error("Error checking notification health:", error);
      setHealth({
        status: "UNKNOWN_ERROR",
        canRequestPermission: false,
        canReconnect: false,
        needsManualSettings: false,
        isPWA: false,
        message: "Unable to check notification status",
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
    }
  }, [session]);

  useEffect(() => {
    // Initial check
    checkHealth();

    // Re-check when session changes
    if (session) {
      checkHealth();
    }
  }, [checkHealth, session]);

  // Listen for permission changes
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const handlePermissionChange = () => {
      checkHealth();
    };

    // Note: Notification.onpermissionchange is not widely supported
    // We'll rely on manual refresh after actions
  }, [checkHealth]);

  return { health, checkHealth, refresh: checkHealth };
}
