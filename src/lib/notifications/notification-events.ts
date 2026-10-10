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
let eventSourceInstance: EventSource | null = null;
let sseReconnectTimer: NodeJS.Timeout | null = null;
let sseReconnectAttempts = 0;

/**
 * Initialize or reuse the singleton SSE connection for real-time notification updates.
 * Guarantees exactly ONE SSE connection across components and handles React StrictMode cleanly.
 */
export function initNotificationSSE() {
  if (typeof window === 'undefined' || !('EventSource' in window)) return;

  // If already connecting or open, don't create duplicate
  if (
    eventSourceInstance &&
    (eventSourceInstance.readyState === EventSource.OPEN ||
      eventSourceInstance.readyState === EventSource.CONNECTING)
  ) {
    return;
  }

  if (sseReconnectTimer) {
    clearTimeout(sseReconnectTimer);
    sseReconnectTimer = null;
  }

  try {
    console.log('[SSE Client] Connecting to /api/notifications/sse');
    const es = new EventSource('/api/notifications/sse');
    eventSourceInstance = es;

    es.onopen = () => {
      console.log('[SSE Client] Connection established');
      sseReconnectAttempts = 0;
    };

    es.addEventListener('notification', (event) => {
      console.log('[SSE Client] Real-time notification received via SSE:', event.data);
      notifyNotificationsChanged();
    });

    es.addEventListener('message', (event) => {
      console.log('[SSE Client] Message received via SSE:', event.data);
      notifyNotificationsChanged();
    });

    es.onerror = (err) => {
      console.warn('[SSE Client] Connection lost or error:', err);
      es.close();
      eventSourceInstance = null;

      // Reconnect with exponential backoff (2s, 4s, 8s, up to 30s)
      const delay = Math.min(2000 * Math.pow(1.5, sseReconnectAttempts), 30000);
      sseReconnectAttempts++;
      sseReconnectTimer = setTimeout(() => {
        initNotificationSSE();
      }, delay);
    };
  } catch (e) {
    console.error('[SSE Client] Failed to initialize EventSource:', e);
  }
}

/**
 * Close active SSE connection (e.g. on logout)
 */
export function closeNotificationSSE() {
  if (sseReconnectTimer) {
    clearTimeout(sseReconnectTimer);
    sseReconnectTimer = null;
  }
  if (eventSourceInstance) {
    eventSourceInstance.close();
    eventSourceInstance = null;
    console.log('[SSE Client] Connection closed');
  }
}

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

  // Debounce the callback to prevent duplicate immediate triggers
  let timeoutId: NodeJS.Timeout | null = null;
  const debouncedCallback = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback();
      timeoutId = null;
    }, 1000); // 1s debounce to prevent request floods
  };

  // Ensure singleton SSE connection is running
  initNotificationSSE();

  // 1. Local event listener
  const handleLocalEvent = () => debouncedCallback();
  window.addEventListener(NOTIFICATION_EVENT_NAME, handleLocalEvent);

  // 2. Cross-tab BroadcastChannel listener
  const channel = getBroadcastChannel();
  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data?.type === 'notification-refresh' || event.data?.type === 'notification-changed') {
      debouncedCallback();
    }
  };
  if (channel) {
    channel.addEventListener('message', handleBroadcastMessage);
  }

  // 3. Service Worker message listener (for background push received)
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data?.type === 'notification-refresh' || event.data?.type === 'notification-changed') {
      debouncedCallback();
    }
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
  }

  // 4. Visibility change listener (revalidate when tab becomes active)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      debouncedCallback();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Cleanup all listeners
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    window.removeEventListener(NOTIFICATION_EVENT_NAME, handleLocalEvent);
    if (channel) {
      channel.removeEventListener('message', handleBroadcastMessage);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

// Bind to window for external/legacy trigger compatibility
if (typeof window !== 'undefined') {
  (window as any).refreshNotifications = notifyNotificationsChanged;
}
