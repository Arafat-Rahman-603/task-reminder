import { getToken, Messaging } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";

// BroadcastChannel for cross-tab notification sync
const NOTIFICATION_CHANNEL = typeof window !== 'undefined' ? new BroadcastChannel('manageo-notifications') : null;

// Broadcast notification refresh to all tabs
export const broadcastNotificationRefresh = () => {
  if (NOTIFICATION_CHANNEL) {
    NOTIFICATION_CHANNEL.postMessage({ type: 'notification-refresh' });
  }
};

export const syncSubscriptionToBackend = async (fcmToken: string) => {
  try {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    console.log('[Firebase] Syncing FCM token to backend');
    await fetch('/api/notifications/sync-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcmToken, userAgent, platform }),
    });
  } catch (err) {
    console.error('[Firebase] Failed to sync FCM token to backend:', err);
  }
};

export const initFirebasePush = async (userId?: string) => {
  if (typeof window === 'undefined') return;

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    if (Notification.permission === 'granted') {
      await registerFirebaseToken(messaging);
    }
  } catch (error) {
    console.error('[Firebase] Error initializing Firebase Push:', error);
  }
};

export const requestPushPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = await getFirebaseMessaging();
      if (messaging) {
        await registerFirebaseToken(messaging);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error requesting push permission:', error);
    return false;
  }
};

const registerFirebaseToken = async (messaging: Messaging) => {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    // Get the service worker registration
    let registration = await navigator.serviceWorker.getRegistration('/sw.js');
    
    // If no registration exists, wait for it to be registered
    if (!registration) {
      console.warn('[Firebase] No service worker registration found for FCM. Waiting for registration...');
      // Wait up to 5 seconds for service worker to be registered
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        registration = await navigator.serviceWorker.getRegistration('/sw.js');
        if (registration) break;
      }
      
      if (!registration) {
        console.error('[Firebase] Service worker registration still not found after waiting');
        return;
      }
    }

    // Wait for service worker to be active
    if (registration.installing) {
      console.log('[Firebase] Service worker is installing, waiting for activation...');
      await new Promise<void>((resolve) => {
        if (registration!.active) {
          resolve();
        } else {
          registration!.addEventListener('controllerchange', () => resolve());
          setTimeout(resolve, 5000); // Fallback timeout
        }
      });
    }

    const currentToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('[Firebase] Got FCM token:', currentToken.substring(0, 15) + '...');
      await syncSubscriptionToBackend(currentToken);
    } else {
      console.log('[Firebase] No registration token available. Request permission to generate one.');
    }
  } catch (err) {
    console.log('[Firebase] An error occurred while retrieving token. ', err);
  }
};

export const checkPushPermission = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Notification.permission === 'granted';
};

// Listen for foreground messages
if (typeof window !== 'undefined') {
  getFirebaseMessaging().then((messaging) => {
    if (!messaging) return;

    import('firebase/messaging').then(({ onMessage }) => {
      onMessage(messaging, async (payload) => {
        console.log('[Firebase] Message received in foreground. ', payload);

        // Extract notification data from payload
        const notification = payload.notification || {};
        const data = payload.data || {};

        const title = notification.title || data.title || 'New Notification';
        const body = notification.body || data.body || '';
        const type = data.type || 'SYSTEM';
        const entityId = data.entityId;
        const notificationId = data.notificationId;
        const url = data.url || '/dashboard';

        // 1. Persist notification to database
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              body,
              type,
              entityId,
              notificationId,
              url,
            }),
          });
          console.log('[Firebase] Notification persisted to database');
        } catch (err) {
          console.error('[Firebase] Failed to persist notification:', err);
        }

        // 2. Show browser/system notification popup
        if (Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: '/icon-192x192.png',
              data: { url },
            });
            console.log('[Firebase] Browser notification shown');
          } catch (err) {
            console.error('[Firebase] Failed to show browser notification:', err);
          }
        }

        // 3. Refresh notification panel and broadcast to other tabs
        broadcastNotificationRefresh();

        if (typeof window !== 'undefined' && (window as any).refreshNotifications) {
          (window as any).refreshNotifications();
        }
      });
    });
  }).catch(console.error);
}
