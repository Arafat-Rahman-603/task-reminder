"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, CalendarDays, X, Circle, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/dateUtils";
import { useNotificationStore, type AppNotification } from "@/lib/notifications/notification-store";

export function NotificationsButton({ align = "right" }: { align?: "left" | "right" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const {
    notifications,
    timezone,
    loading,
    fetchNotifications,
    markAllRead,
    toggleRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = () => {
    const nextState = !open;
    setOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      toggleRead(notif.id, false);
    }

    if (notif.link) {
      setOpen(false);
      if (notif.link.startsWith("/")) {
        router.push(notif.link);
      } else {
        window.location.assign(notif.link);
      }
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
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "fixed md:absolute left-4 right-4 md:left-auto md:w-80 md:max-w-[calc(100vw-32px)] bg-stitch-surface border border-surface-variant/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] z-50 overflow-hidden flex flex-col max-h-[400px]",
            align === "right" ? "md:right-0 md:top-12" : "md:left-0 md:top-12"
          )}
          style={{
            top: "calc(3.5rem + var(--safe-area-top, env(safe-area-inset-top, 0px)) + 0.5rem)",
          }}
        >
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
                  <div
                    key={notif.id}
                    className={cn(
                      "p-4 hover:bg-surface-variant/10 transition-colors group relative",
                      notif.link || !notif.read ? "cursor-pointer" : "",
                      !notif.read ? "bg-stitch-primary/5" : ""
                    )}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {notif.type === "task_reminder" ? (
                          notif.priority === "high" ? (
                            <Clock className="w-4 h-4 text-error" />
                          ) : (
                            <CalendarDays className="w-4 h-4 text-stitch-primary" />
                          )
                        ) : notif.type === "routine_reminder" ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : notif.type === "daily_summary" ? (
                          <Moon className="w-4 h-4 text-indigo-400" />
                        ) : notif.type === "morning_summary" ? (
                          <Sun className="w-4 h-4 text-amber-400" />
                        ) : notif.type === "custom_reminder" ? (
                          <Bell className="w-4 h-4 text-stitch-primary" />
                        ) : (
                          <Bell className="w-4 h-4 text-warning" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 pr-6">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            notif.priority === "high" ? "text-error" : "text-on-surface"
                          )}
                        >
                          {notif.title}
                        </p>
                        <p className="text-xs text-on-surface-variant line-clamp-2">
                          {notif.message}
                        </p>
                        <p suppressHydrationWarning className="text-[10px] text-on-surface-variant/60 mt-1 uppercase tracking-wide">
                          {formatDateTime(notif.date, timezone)}
                        </p>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                        title="Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRead(notif.id, notif.read);
                        }}
                        className="p-1 rounded-full text-on-surface-variant hover:text-stitch-primary hover:bg-stitch-primary/10 transition-colors"
                        title={notif.read ? "Mark as unread" : "Mark as read"}
                      >
                        {notif.read ? <Circle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-2 border-t border-surface-variant/30 bg-surface-container-low/50 flex divide-x divide-surface-variant/30">
            {notifications.length > 0 && (
              <>
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
              </>
            )}
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
