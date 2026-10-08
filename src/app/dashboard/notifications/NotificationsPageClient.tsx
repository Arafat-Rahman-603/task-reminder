"use client";
import { useEffect, useState } from "react";
import { Bell, Check, Clock, CalendarDays, X, Circle, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  subscribeToNotificationUpdates,
  notifyNotificationsChanged,
} from "@/lib/notifications/notification-events";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  date: string;
  priority?: string;
};

export default function NotificationsPageClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const incoming: Notification[] = data.notifications || [];
        const unique = Array.from(
          new Map(incoming.map((n) => [n.id, n])).values()
        );
        setNotifications(unique);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const unsubscribe = subscribeToNotificationUpdates(() => {
      fetchNotifications();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notifyNotificationsChanged();
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
    } catch (e) {
      console.error(e);
      fetchNotifications();
    }
  };

  const clearAll = async () => {
    if (!confirm("Clear all notifications?")) return;
    setNotifications([]);
    notifyNotificationsChanged();
    try {
      await fetch("/api/notifications?action=deleteAll", { method: "DELETE" });
    } catch (e) {
      console.error(e);
      fetchNotifications();
    }
  };

  const toggleRead = async (id: string, currentReadState: boolean) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !currentReadState } : n))
    );
    notifyNotificationsChanged();
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: !currentReadState }),
      });
    } catch (err) {
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    notifyNotificationsChanged();
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    } catch (err) {
      fetchNotifications();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-on-surface">Notifications</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your task and routine alerts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-primary-container text-on-primary-container rounded-xl font-bold text-sm hover:bg-stitch-primary hover:text-on-primary transition-colors"
          >
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-error/10 text-error rounded-xl font-bold text-sm hover:bg-error hover:text-white transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="bg-surface border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-stitch-primary border-t-transparent rounded-full"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-on-surface-variant flex flex-col items-center">
            <Check className="w-12 h-12 mb-4 text-success/50" />
            <p className="font-semibold text-lg">You&apos;re all caught up!</p>
            <p className="text-sm opacity-80 mt-1">No new notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-variant/20">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 hover:bg-surface-container/50 transition-colors",
                  !notif.read ? "bg-stitch-primary/5" : ""
                )}
              >
                <div className="flex gap-4 flex-1">
                  <div className="mt-1 shrink-0">
                    {notif.type === "task_reminder" ? (
                      notif.priority === "high" ? (
                        <Clock className="w-6 h-6 text-error" />
                      ) : (
                        <CalendarDays className="w-6 h-6 text-stitch-primary" />
                      )
                    ) : notif.type === "routine_reminder" ? (
                      <Check className="w-6 h-6 text-success" />
                    ) : notif.type === "daily_summary" ? (
                      <Moon className="w-6 h-6 text-indigo-400" />
                    ) : notif.type === "morning_summary" ? (
                      <Sun className="w-6 h-6 text-amber-400" />
                    ) : (
                      <Bell className="w-6 h-6 text-warning" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-base font-bold",
                        notif.priority === "high" ? "text-error" : "text-on-surface"
                      )}
                    >
                      {notif.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-on-surface-variant/70 mt-2 uppercase tracking-wider font-semibold">
                      {new Date(notif.date).toLocaleString()}
                    </p>
                    {notif.link && (
                      <a
                        href={notif.link}
                        className="inline-block mt-3 text-sm font-semibold text-stitch-primary hover:underline"
                      >
                        View Details →
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 mt-4 sm:mt-0 justify-end sm:justify-start">
                  <button
                    onClick={() => toggleRead(notif.id, notif.read)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-stitch-primary hover:bg-primary/10 transition-colors"
                  >
                    {notif.read ? (
                      <>
                        <Circle className="w-4 h-4" /> Mark Unread
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Mark Read
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-error/80 hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <X className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
