/**
 * Manageo Client Notification Events & Real-time Synchronization
 *
 * Provides a unified real-time event bus connecting:
 * - Local React components (Sidebar NotificationsButton, MobileNav NotificationsButton, NotificationsPageClient)
 * - BroadcastChannel (cross-tab synchronization)
 * - Firebase foreground messaging (FCM onMessage)
 * - Service Worker messages (background push deliveries)
 * - Tab focus and document visibility revalidation
 */

export const NOTIFICATION_EVENT_NAME = 'manageo:notification-update';
export const BROADCAST_CHANNEL_NAME = 'manageo-notifications';

let broadcastChannelInstance: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!('BroadcastChannel' in window)) return null;

  if (!broadcastChannelInstance) {
    try {
      broadcastChannelInstance = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch (e) {
      console.warn('[NotificationEvents] BroadcastChannel not supported:', e);
    }
  }
  return broadcastChannelInstance;
}

/**
 * Trigger an immediate notification refresh across:
 * 1. Current tab components (via CustomEvent)
 * 2. Other open browser tabs (via BroadcastChannel)
 */
export function notifyNotificationsChanged() {
  if (typeof window === 'undefined') return;

  // 1. Dispatch custom event for all components in the current execution context
  try {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT_NAME, { detail: { timestamp: Date.now() } }));
  } catch (e) {
    console.error('[NotificationEvents] Error dispatching local event:', e);
  }

  // 2. Broadcast to other tabs
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ type: 'notification-refresh', timestamp: Date.now() });
    } catch (e) {
      console.warn('[NotificationEvents] Error broadcasting message:', e);
    }
  }
}

/**
 * Subscribe a component to real-time notification updates.
 * Fires the callback on:
 * - Local notification change events
 * - Cross-tab BroadcastChannel messages
 * - Service Worker background push messages
 * - Window focus
 * - Visibility change to visible
 */
export function subscribeToNotificationUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // 1. Local event listener
  const handleLocalEvent = () => {
    callback();
  };
  window.addEventListener(NOTIFICATION_EVENT_NAME, handleLocalEvent);

  // 2. Cross-tab BroadcastChannel listener
  const channel = getBroadcastChannel();
  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data?.type === 'notification-refresh' || event.data?.type === 'notification-changed') {
      callback();
    }
  };
  if (channel) {
    channel.addEventListener('message', handleBroadcastMessage);
  }

  // 3. Service Worker message listener (for background push received)
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data?.type === 'notification-refresh' || event.data?.type === 'notification-changed') {
      callback();
    }
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
  }

  // 4. Window focus listener
  const handleFocus = () => {
    callback();
  };
  window.addEventListener('focus', handleFocus);

  // 5. Visibility change listener (revalidate when tab becomes active)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      callback();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Cleanup all listeners
  return () => {
    window.removeEventListener(NOTIFICATION_EVENT_NAME, handleLocalEvent);
    if (channel) {
      channel.removeEventListener('message', handleBroadcastMessage);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    }
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

// Bind to window for external/legacy trigger compatibility
if (typeof window !== 'undefined') {
  (window as any).refreshNotifications = notifyNotificationsChanged;
}
