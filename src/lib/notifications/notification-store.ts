"use client";

import { create } from "zustand";
import {
  subscribeToNotificationUpdates,
  notifyNotificationsChanged,
} from "./notification-events";

export interface AppNotification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  link: string | null;
  date: string;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  timezone: string;
  loading: boolean;
  isInitialized: boolean;
  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  toggleRead: (id: string, currentReadState: boolean) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

let inFlightPromise: Promise<void> | null = null;
let isSubscriberAttached = false;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  timezone: "UTC",
  loading: false,
  isInitialized: false,

  fetchNotifications: async () => {
    // If a request is already in-flight, reuse it
    if (inFlightPromise) {
      return inFlightPromise;
    }

    // Attach singleton real-time subscriber if not already active
    if (typeof window !== "undefined" && !isSubscriberAttached) {
      isSubscriberAttached = true;
      subscribeToNotificationUpdates(() => {
        get().fetchNotifications();
      });
    }

    if (!get().isInitialized) {
      set({ loading: true });
    }

    inFlightPromise = (async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          const incoming: AppNotification[] = data.notifications || [];
          const unique = Array.from(
            new Map(incoming.map((n) => [n.id, n])).values()
          );
          set({
            notifications: unique,
            timezone: data.timezone || "UTC",
            isInitialized: true,
            loading: false,
          });
        }
      } catch (err) {
        console.error("[NotificationStore] Error fetching notifications:", err);
        set({ loading: false });
      } finally {
        inFlightPromise = null;
      }
    })();

    return inFlightPromise;
  },

  markAllRead: async () => {
    const prev = get().notifications;
    set({ notifications: prev.map((n) => ({ ...n, read: true })) });
    notifyNotificationsChanged();

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
    } catch (e) {
      console.error("[NotificationStore] Failed to mark all as read:", e);
      set({ notifications: prev });
    }
  },

  toggleRead: async (id: string, currentReadState: boolean) => {
    const prev = get().notifications;
    set({
      notifications: prev.map((n) =>
        n.id === id ? { ...n, read: !currentReadState } : n
      ),
    });
    notifyNotificationsChanged();

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: !currentReadState }),
      });
    } catch (err) {
      console.error("[NotificationStore] Failed to toggle read:", err);
      set({ notifications: prev });
    }
  },

  deleteNotification: async (id: string) => {
    const prev = get().notifications;
    set({ notifications: prev.filter((n) => n.id !== id) });
    notifyNotificationsChanged();

    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("[NotificationStore] Failed to delete notification:", err);
      set({ notifications: prev });
    }
  },

  clearAll: async () => {
    const prev = get().notifications;
    set({ notifications: [] });
    notifyNotificationsChanged();

    try {
      await fetch("/api/notifications?action=deleteAll", { method: "DELETE" });
    } catch (err) {
      console.error("[NotificationStore] Failed to clear all notifications:", err);
      set({ notifications: prev });
    }
  },
}));
