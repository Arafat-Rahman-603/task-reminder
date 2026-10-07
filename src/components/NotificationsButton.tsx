"use client";
import { formatDate, formatDateTime, formatTime } from "@/lib/dateUtils";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock, CalendarDays, X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  link: string | null;
  date: string;
  read: boolean;
}

// BroadcastChannel for cross-tab synchronization
const NOTIFICATION_CHANNEL = typeof window !== 'undefined' ? new BroadcastChannel('manageo-notifications') : null;

export function NotificationsButton({ align = "right" }: { align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Expose fetchNotifications globally for external refresh triggers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshNotifications = fetchNotifications;
    }
  }, [fetchNotifications]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
    
    // Poll every 5 minutes as fallback
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for OneSignal notification events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupOneSignalListener = async () => {
      try {
        const OneSignal = (await import('react-onesignal')).default;
        
        // Listen for foreground notification display events
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (OneSignal.Notifications as any).addEventListener('foregroundWillDisplay', (event: any) => {
          console.log('[Notifications] OneSignal notification received, refreshing notifications');
          fetchNotifications();
        });
      } catch (e) {
        // OneSignal not available
        console.warn('[Notifications] OneSignal not available for event listening');
      }
    };

    setupOneSignalListener();
  }, [fetchNotifications]);

  // Listen for cross-tab notification changes
  useEffect(() => {
    if (!NOTIFICATION_CHANNEL) return;

    const handleMessage = (event: MessageEvent) => {
      console.log('[Notifications] Cross-tab notification update received');
      fetchNotifications();
    };

    NOTIFICATION_CHANNEL.addEventListener('message', handleMessage);
    return () => NOTIFICATION_CHANNEL?.removeEventListener('message', handleMessage);
  }, [fetchNotifications]);

  // Broadcast notification changes to other tabs
  const broadcastChange = () => {
    if (NOTIFICATION_CHANNEL) {
      NOTIFICATION_CHANNEL.postMessage({ type: 'notification-changed' });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpen = () => {
    setOpen(!open);
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      broadcastChange();
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const toggleRead = async (id: string, currentReadState: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !currentReadState } : n));
    broadcastChange();
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: !currentReadState })
      });
    } catch (err) {
      console.error("Failed to toggle read state", err);
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    let fetchPromise = Promise.resolve();
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      broadcastChange();
      fetchPromise = fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id, read: true })
      }).catch(err => console.error("Failed to mark read on click", err)) as Promise<any>;
    }
    
    if (notif.link) {
      setOpen(false);
      await fetchPromise; // Wait for the fetch to complete so navigation doesn't cancel it
      window.location.href = notif.link;
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    broadcastChange();
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete notification", err);
      fetchNotifications();
    }
  };

  const clearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    setNotifications([]);
    setOpen(false);
    broadcastChange();
    try {
      await fetch("/api/notifications?action=deleteAll", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear all notifications", err);
      fetchNotifications();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={handleOpen}
        aria-label="Notifications" 
        className="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-stitch-primary transition-colors"
      >
        <Bell className="w-[22px] h-[22px]" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-4 h-4 text-[10px] font-bold rounded-full bg-error text-white ring-2 ring-stitch-surface flex items-center justify-center">
             {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          "fixed md:absolute top-16 md:top-12 left-4 right-4 md:left-auto md:w-80 md:max-w-[calc(100vw-32px)] bg-stitch-surface border border-surface-variant/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] z-50 overflow-hidden flex flex-col max-h-[400px]",
          align === "right" ? "md:right-0" : "md:left-0"
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-variant/30 bg-surface-container-low/50 backdrop-blur">
            <h3 className="font-bold text-on-surface">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-xs font-semibold bg-surface-variant/50 text-on-surface-variant px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin w-5 h-5 border-2 border-stitch-primary border-t-transparent rounded-full"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-on-surface-variant opacity-70">
                <Check className="w-8 h-8 mb-2 text-success/50" />
                <p className="text-sm font-medium">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-surface-variant/20">
                {notifications.map((notif) => (
                  <div key={notif.id} className={cn("p-4 hover:bg-surface-variant/10 transition-colors group relative", (notif.link || !notif.read) ? "cursor-pointer" : "", !notif.read ? "bg-stitch-primary/5" : "")} onClick={() => handleNotificationClick(notif)}>
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'task_reminder' ? (
                          notif.priority === 'high' ? 
                            <Clock className="w-4 h-4 text-error" /> : 
                            <CalendarDays className="w-4 h-4 text-stitch-primary" />
                        ) : notif.type === 'routine_reminder' ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : notif.type === 'custom_reminder' ? (
                          <Bell className="w-4 h-4 text-stitch-primary" />
                        ) : (
                          <Bell className="w-4 h-4 text-warning" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 pr-6">
                        <p className={cn("text-sm font-semibold", notif.priority === 'high' ? "text-error" : "text-on-surface")}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-on-surface-variant line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-on-surface-variant/60 mt-1 uppercase tracking-wide">
                          {new Date(notif.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                      <button onClick={(e) => deleteNotification(notif.id, e)} className="p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors" title="Delete">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => toggleRead(notif.id, notif.read, e)} className="p-1 rounded-full text-on-surface-variant hover:text-stitch-primary hover:bg-stitch-primary/10 transition-colors" title={notif.read ? "Mark as unread" : "Mark as read"}>
                        {notif.read ? <Circle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-2 border-t border-surface-variant/30 bg-surface-container-low/50 flex divide-x divide-surface-variant/30">
               <button 
                  onClick={markAllRead}
                  className="flex-1 text-xs font-semibold text-stitch-primary hover:text-primary-fixed transition-colors py-1.5"
               >
                 Mark all as read
               </button>
               <button 
                  onClick={clearAll}
                  className="flex-1 text-xs font-semibold text-error/80 hover:text-error transition-colors py-1.5"
               >
                 Clear all
               </button>
            </div>
          )}
          <div className="p-2 border-t border-surface-variant/30 bg-surface-container-low/50 flex divide-x divide-surface-variant/30">
            <a 
              href="/dashboard/notifications"
              className="flex-1 text-center text-xs font-semibold text-on-surface hover:text-stitch-primary transition-colors py-1.5"
            >
              View All
            </a>
          </div>
        </div>
      )}
    </div>
  );
}



