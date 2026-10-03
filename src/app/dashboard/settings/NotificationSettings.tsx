"use client";

import { useState, useEffect } from "react";
import { Bell, SwitchCamera } from "lucide-react";
import { requestPushPermission, checkPushPermission } from "@/lib/notifications/onesignal-client";
import { useSession } from "next-auth/react";
import { NotificationHealthCard } from "@/components/notifications/NotificationHealthCard";

export default function NotificationSettings() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState({
    pushEnabled: false,
    taskReminders: true,
    routineReminders: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<"granted" | "denied" | "default" | "unsupported">("default");

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Failed to load notification preferences", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check initial push status
    if (typeof window !== "undefined") {
      const getStatus = () => {
        if (!("Notification" in window)) {
          return "unsupported";
        }
        return Notification.permission as "granted" | "denied" | "default";
      };
      setPushStatus(getStatus());
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchPreferences();
    }
  }, [session]);

  const updatePreference = async (key: string, value: boolean | string) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const updateQuietHours = async (key: string, value: boolean | string) => {
    const newPrefs = { ...preferences, quietHours: { ...preferences.quietHours, [key]: value } };
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savePreferences = async (newPrefs: any) => {
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
    } catch (error) {
      console.error("Failed to save preferences", error);
    }
  };

  const enablePush = async () => {
    try {
      const granted = await requestPushPermission();
      if (granted) {
        setPushStatus("granted");
        updatePreference("pushEnabled", true);
      } else {
        setPushStatus("denied");
      }
    } catch (error) {
      console.error("Failed to request push permission", error);
    }
  };

  const [testStatus, setTestStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', message?: string }>({ status: 'idle' });
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const sendTestNotification = async () => {
    try {
      setTestStatus({ status: 'loading' });
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to send notification");
      }
      
      setTestStatus({ status: 'success', message: 'Test notification sent successfully!' });
      setTimeout(() => setTestStatus({ status: 'idle' }), 5000);
    } catch (error: any) {
      console.error("Failed to send test notification", error);
      setTestStatus({ status: 'error', message: error.message || "An unexpected error occurred." });
    }
  };

  const fetchDebugInfo = async () => {
    try {
      const res = await fetch("/api/notifications/debug");
      const data = await res.json();
      setDebugInfo(data);
      setShowDebug(true);
    } catch (error) {
      console.error("Failed to fetch debug info", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant">Loading preferences...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-on-surface mb-2 flex items-center gap-2">
          <Bell className="w-5 h-5 text-stitch-primary" />
          Notification Preferences
        </h2>
        <p className="text-sm text-on-surface-variant max-w-2xl">
          Manage how and when Manageo sends you alerts, reminders, and summaries.
        </p>
      </div>

      <div className="space-y-6">
        <NotificationHealthCard />
        
        {/* Push Enable Section */}
        <div className="bg-surface-container rounded-2xl p-6 border border-surface-variant/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-semibold text-on-surface mb-1">Push Notifications</h3>
            <p className="text-sm text-on-surface-variant">
              Receive alerts directly on this device, even when the app is closed.
            </p>
            {pushStatus === "denied" && (
              <p className="text-xs text-red-500 mt-2 font-medium">
                Push notifications are blocked by your browser. You must allow them in your browser settings.
              </p>
            )}
            {pushStatus === "unsupported" && (
              <p className="text-xs text-orange-400 mt-2 font-medium">
                Web push is not supported on this browser or device. On iOS, add this app to your Home Screen to enable push.
              </p>
            )}
          </div>
          <div>
            {pushStatus === "granted" && preferences.pushEnabled ? (
              <button
                onClick={() => updatePreference("pushEnabled", false)}
                className="px-4 py-2 rounded-xl bg-surface-variant/50 text-on-surface text-sm font-medium hover:bg-surface-variant transition-colors"
              >
                Disable Push
              </button>
            ) : (
              <button
                onClick={enablePush}
                disabled={pushStatus === "unsupported"}
                className="px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-sm font-semibold hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
              >
                Enable Notifications
              </button>
            )}
          </div>
        </div>

        {/* Channels Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Alert Types</h3>
          
          <label className="flex items-center justify-between p-4 bg-surface-container/50 rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
            <span className="text-sm font-medium text-on-surface">Task Reminders</span>
            <input type="checkbox" checked={preferences.taskReminders} onChange={(e) => updatePreference("taskReminders", e.target.checked)} className="rounded border-surface-variant/50 bg-transparent text-stitch-primary focus:ring-stitch-primary/30" />
          </label>
          <label className="flex items-center justify-between p-4 bg-surface-container/50 rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
            <span className="text-sm font-medium text-on-surface">Routine Reminders</span>
            <input type="checkbox" checked={preferences.routineReminders} onChange={(e) => updatePreference("routineReminders", e.target.checked)} className="rounded border-surface-variant/50 bg-transparent text-stitch-primary focus:ring-stitch-primary/30" />
          </label>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4 pt-4 border-t border-surface-variant/20">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Quiet Hours</h3>
          <p className="text-xs text-on-surface-variant">During quiet hours, reminders will be delayed or suppressed.</p>
          
          <div className="bg-surface-container/50 rounded-xl p-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={preferences.quietHours.enabled} onChange={(e) => updateQuietHours("enabled", e.target.checked)} className="rounded border-surface-variant/50 bg-transparent text-stitch-primary focus:ring-stitch-primary/30" />
              <span className="text-sm font-medium text-on-surface">Enable Quiet Hours</span>
            </label>
            
            {preferences.quietHours.enabled && (
              <div className="flex items-center gap-4 pt-2">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Start Time</label>
                  <input type="time" value={preferences.quietHours.start} onChange={(e) => updateQuietHours("start", e.target.value)} className="bg-surface-variant/30 border border-surface-variant/50 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-stitch-primary" />
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">End Time</label>
                  <input type="time" value={preferences.quietHours.end} onChange={(e) => updateQuietHours("end", e.target.value)} className="bg-surface-variant/30 border border-surface-variant/50 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-stitch-primary" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-4 pt-4 border-t border-surface-variant/20">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Timezone</h3>
          <p className="text-xs text-on-surface-variant">Your current timezone for notifications and quiet hours.</p>
          
          <div className="bg-surface-container/50 rounded-xl p-4">
            <label className="block text-xs text-on-surface-variant mb-1">Notification Timezone</label>
            <select 
              value={preferences.timezone}
              onChange={(e) => updatePreference("timezone", e.target.value)}
              className="bg-surface-variant/30 border border-surface-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-stitch-primary w-full max-w-xs"
            >
              {typeof Intl !== 'undefined' && Intl.supportedValuesOf ? (
                Intl.supportedValuesOf('timeZone').map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))
              ) : (
                <option value={preferences.timezone}>{preferences.timezone}</option>
              )}
            </select>
          </div>
        </div>
        
        {/* Testing */}
        <div className="space-y-4 pt-4 border-t border-surface-variant/20">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Verification</h3>
          <div className="flex flex-col items-start gap-3">
            <button 
              onClick={sendTestNotification}
              disabled={!preferences.pushEnabled || pushStatus !== "granted" || testStatus.status === 'loading'}
              className="px-4 py-2 rounded-xl border border-surface-variant/50 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              {testStatus.status === 'loading' ? "Sending..." : "Send Test Notification"}
            </button>
            {testStatus.status === 'error' && (
              <p className="text-sm text-red-500 font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20 max-w-full overflow-hidden text-ellipsis">
                Error: {testStatus.message}
              </p>
            )}
            {testStatus.status === 'success' && (
              <p className="text-sm text-green-500 font-medium">
                {testStatus.message}
              </p>
            )}
            <button
              onClick={fetchDebugInfo}
              className="px-4 py-2 rounded-xl border border-surface-variant/30 text-on-surface-variant text-xs font-medium hover:bg-surface-container transition-colors"
            >
              View Debug Info
            </button>
            {showDebug && debugInfo && (
              <div className="w-full bg-surface-variant/20 rounded-lg p-3 text-xs font-mono text-on-surface-variant overflow-x-auto">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
