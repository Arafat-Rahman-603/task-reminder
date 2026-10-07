"use client";

import { useState } from "react";
import { Bell, CheckCircle, AlertTriangle, Info, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { useNotificationHealth, NotificationHealthStatus } from "@/hooks/useNotificationHealth";
import { requestPushPermission, initFirebasePush } from "@/lib/notifications/firebase-client";
import { useSession } from "next-auth/react";

interface NotificationHealthCardProps {
  compact?: boolean;
}

export function NotificationHealthCard({ compact = false }: NotificationHealthCardProps) {
  const { health, refresh } = useNotificationHealth();
  const { data: session } = useSession();
  const [actionLoading, setActionLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleEnableNotifications = async () => {
    setActionLoading(true);
    setTestResult(null);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (session?.user as any)?.id;
      
      // Initialize Firebase Push and request permission
      await initFirebasePush(userId);
      const granted = await requestPushPermission();
      
      if (granted) {
        // Wait a moment for subscription to be created
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refresh();
        setTestResult({ success: true, message: "Notifications enabled successfully" });
      } else {
        setTestResult({ success: false, message: "Permission was denied" });
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
      setTestResult({ success: false, message: "Failed to enable notifications" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconnect = async () => {
    setActionLoading(true);
    setTestResult(null);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (session?.user as any)?.id;
      
      // Re-initialize OneSignal with current user
      await initFirebasePush(userId);
      
      // Wait for subscription sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refresh();
      setTestResult({ success: true, message: "Notifications reconnected" });
    } catch (error) {
      console.error("Failed to reconnect notifications:", error);
      setTestResult({ success: false, message: "Failed to reconnect notifications" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepairServiceWorker = async () => {
    setActionLoading(true);
    setTestResult(null);
    
    try {
      // Reload the page to re-register service worker
      window.location.reload();
    } catch (error) {
      console.error("Failed to repair service worker:", error);
      setTestResult({ success: false, message: "Failed to repair service worker" });
      setActionLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setActionLoading(true);
    setTestResult(null);
    
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to send notification");
      }
      
      setTestResult({ success: true, message: "Test notification sent" });
    } catch (error: any) {
      console.error("Failed to send test notification:", error);
      setTestResult({ success: false, message: error.message || "Failed to send test notification" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSettings = () => {
    // Try to open browser settings if possible
    // For most browsers, we need to show instructions
    setShowHelp(true);
  };

  const getStatusIcon = () => {
    switch (health.status) {
      case "HEALTHY":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "PERMISSION_DENIED":
      case "SERVICE_WORKER_MISSING":
      case "SERVICE_WORKER_NOT_READY":
      case "IDENTITY_MISMATCH":
        return <AlertTriangle className="w-5 h-5 text-error" />;
      case "BROWSER_UNSUPPORTED":
        return <Info className="w-5 h-5 text-on-surface-variant" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusTitle = () => {
    switch (health.status) {
      case "HEALTHY":
        return "Notifications Enabled";
      case "PERMISSION_REQUIRED":
        return "Notifications Not Enabled";
      case "PERMISSION_DENIED":
        return "Notifications Blocked";
      case "NOT_SUBSCRIBED":
        return "Subscription Needs Attention";
      case "SUBSCRIPTION_PENDING":
        return "Setting Up Notifications";
      case "SERVICE_WORKER_MISSING":
      case "SERVICE_WORKER_NOT_READY":
        return "Service Needs Attention";
      case "IDENTITY_MISMATCH":
        return "Account Connection Needs Attention";
      case "SERVER_SYNC_PROBLEM":
        return "Notification Connection Needs Attention";
      case "SYNC_STALE":
        return "Connection Needs Refresh";
      case "DISABLED":
        return "Notifications Disabled";
      case "BROWSER_UNSUPPORTED":
        return "Notifications Not Supported";
      default:
        return "Notification Status Unknown";
    }
  };

  const renderActionButtons = () => {
    if (actionLoading) {
      return (
        <button disabled className="px-4 py-2 rounded-xl bg-surface-variant/50 text-on-surface-variant text-sm font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </button>
      );
    }

    switch (health.status) {
      case "HEALTHY":
        return (
          <button
            onClick={handleTestNotification}
            className="px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-sm font-medium hover:bg-primary-fixed-dim transition-colors"
          >
            Send Test Notification
          </button>
        );
      case "PERMISSION_REQUIRED":
        return (
          <button
            onClick={handleEnableNotifications}
            className="px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-sm font-medium hover:bg-primary-fixed-dim transition-colors"
          >
            Enable Notifications
          </button>
        );
      case "PERMISSION_DENIED":
        return (
          <div className="flex gap-2">
            <button
              onClick={handleOpenSettings}
              className="px-4 py-2 rounded-xl bg-surface-variant/50 text-on-surface text-sm font-medium hover:bg-surface-variant transition-colors"
            >
              Fix Notification Settings
            </button>
            <button
              onClick={handleOpenSettings}
              className="px-4 py-2 rounded-xl border border-surface-variant/50 text-on-surface-variant text-sm font-medium hover:bg-surface-container transition-colors"
            >
              How to Fix
            </button>
          </div>
        );
      case "NOT_SUBSCRIBED":
      case "SUBSCRIPTION_PENDING":
      case "IDENTITY_MISMATCH":
      case "SERVER_SYNC_PROBLEM":
      case "SYNC_STALE":
        return (
          <button
            onClick={handleReconnect}
            className="px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-sm font-medium hover:bg-primary-fixed-dim transition-colors"
          >
            Reconnect Notifications
          </button>
        );
      case "SERVICE_WORKER_MISSING":
      case "SERVICE_WORKER_NOT_READY":
        return (
          <button
            onClick={handleRepairServiceWorker}
            className="px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-sm font-medium hover:bg-primary-fixed-dim transition-colors"
          >
            Repair Notifications
          </button>
        );
      case "DISABLED":
        return (
          <button
            onClick={() => window.location.href = "/dashboard/settings/notifications"}
            className="px-4 py-2 rounded-xl bg-surface-variant/50 text-on-surface text-sm font-medium hover:bg-surface-variant transition-colors"
          >
            Enable in Settings
          </button>
        );
      case "BROWSER_UNSUPPORTED":
        return null;
      default:
        return (
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-surface-variant/50 text-on-surface text-sm font-medium hover:bg-surface-variant transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check Again
          </button>
        );
    }
  };

  if (compact) {
    return (
      <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-semibold text-on-surface">{getStatusTitle()}</p>
              <p className="text-xs text-on-surface-variant">{health.message}</p>
            </div>
          </div>
          {renderActionButtons()}
        </div>
        {testResult && (
          <div className={`mt-3 p-2 rounded-lg text-xs ${testResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
            {testResult.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 shadow-md">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-stitch-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              {getStatusTitle()}
              {getStatusIcon()}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">{health.message}</p>
          </div>
        </div>




        {health.status === "SERVER_SYNC_PROBLEM" && (
          <div className="mt-4 p-3 rounded-xl bg-warning/10 space-y-1">
            <p className="text-xs text-warning font-medium">Manageo could not confirm a valid notification connection for this account.</p>
            <p className="text-xs text-on-surface-variant">This may happen if you recently cleared browser data or reinstalled the app.</p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          {renderActionButtons()}
          {health.status !== "HEALTHY" && health.status !== "BROWSER_UNSUPPORTED" && (
            <button
              onClick={refresh}
              className="px-4 py-2 rounded-xl border border-surface-variant/50 text-on-surface-variant text-sm font-medium hover:bg-surface-container transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Check Again
            </button>
          )}
        </div>

        {testResult && (
          <div className={`mt-3 p-3 rounded-xl text-xs ${testResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
            {testResult.message}
          </div>
        )}
      </div>

      {showHelp && <NotificationHelpModal onClose={() => setShowHelp(false)} />}
    </>
  );
}

function NotificationHelpModal({ onClose }: { onClose: () => void }) {
  const userAgent = typeof window !== "undefined" ? navigator.userAgent : "";
  const isAndroid = /Android/i.test(userAgent);
  const isChrome = /Chrome/i.test(userAgent) && !/Edge/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-on-surface">How to Enable Notifications</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/80">
            ✕
          </button>
        </div>

        {isAndroid && isChrome && (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">For Android Chrome:</p>
            <ol className="text-sm text-on-surface space-y-2 list-decimal ml-4">
              <li>Open manageo.axiomixs.com in Chrome</li>
              <li>Tap the site information icon (🔒 or ⓘ)</li>
              <li>Tap Permissions</li>
              <li>Tap Notifications</li>
              <li>Select Allow</li>
              <li>Return to Manageo</li>
              <li>Tap "Check Again"</li>
            </ol>
          </div>
        )}

        {isSafari && (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">For Safari:</p>
            <ol className="text-sm text-on-surface space-y-2 list-decimal ml-4">
              <li>Open Safari settings</li>
              <li>Go to Websites → Notifications</li>
              <li>Find manageo.axiomixs.com</li>
              <li>Change setting to Allow</li>
              <li>Return to Manageo</li>
              <li>Tap "Check Again"</li>
            </ol>
          </div>
        )}

        {!isAndroid && !isSafari && (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">To enable notifications:</p>
            <ol className="text-sm text-on-surface space-y-2 list-decimal ml-4">
              <li>Open your browser settings</li>
              <li>Find site permissions or notifications</li>
              <li>Locate manageo.axiomixs.com</li>
              <li>Allow notifications</li>
              <li>Return to Manageo</li>
              <li>Tap "Check Again"</li>
            </ol>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-sm font-medium hover:bg-primary-fixed-dim transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
