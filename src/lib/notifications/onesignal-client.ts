import OneSignal from 'react-onesignal';

let isInitialized = false;
let subscriptionChangeListener: ((event: any) => void) | null = null;
let notificationListener: ((event: any) => void) | null = null;
let clickListener: ((event: any) => void) | null = null;

// BroadcastChannel for cross-tab notification sync
const NOTIFICATION_CHANNEL = typeof window !== 'undefined' ? new BroadcastChannel('manageo-notifications') : null;

// Broadcast notification refresh to all tabs
const broadcastNotificationRefresh = () => {
  if (NOTIFICATION_CHANNEL) {
    NOTIFICATION_CHANNEL.postMessage({ type: 'notification-refresh' });
  }
};

// Sync subscription to backend
const syncSubscriptionToBackend = async (userId: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionId = (OneSignal.User.PushSubscription as any).id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const externalId = (OneSignal.User as any).externalId;
    
    if (subscriptionId) {
      console.log('[OneSignal] Syncing subscription to backend:', { userId, subscriptionId, externalId });
      await fetch('/api/notifications/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, externalId }),
      });
    }
  } catch (err) {
    console.error('[OneSignal] Failed to sync subscription to backend:', err);
  }
};

export const initOneSignal = async (userId?: string) => {
  if (typeof window === 'undefined') return;

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) {
    console.warn('OneSignal App ID is missing.');
    return;
  }

  try {
    if (!isInitialized) {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerParam: { scope: "/" },
        serviceWorkerPath: "/sw.js",
      });
      isInitialized = true;
      console.log('[OneSignal] Initialized successfully');
    }

    // Set up subscription change listener
    if (!subscriptionChangeListener) {
      subscriptionChangeListener = async (event: any) => {
        console.log('[OneSignal] Subscription changed:', {
          previous: event.previous,
          current: event.current,
        });

        // If user is logged in, ensure external_id is set on the new subscription
        if (userId && event.current?.token && !event.previous?.token) {
          console.log('[OneSignal] New subscription detected, re-logging in user:', userId);
          try {
            await OneSignal.login(userId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const externalId = (OneSignal.User as any).externalId;
            console.log('[OneSignal] External ID after re-login:', externalId);
            
            // Sync the new subscription to backend
            await syncSubscriptionToBackend(userId);
          } catch (err) {
            console.error('[OneSignal] Failed to re-login after subscription change:', err);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (OneSignal.User.PushSubscription as any).addEventListener('change', subscriptionChangeListener);
    }

    // Set up notification event listener for real-time updates
    if (!notificationListener) {
      notificationListener = (event: any) => {
        console.log('[OneSignal] Notification received in foreground:', event);
        // Trigger notification refresh across all tabs
        broadcastNotificationRefresh();
        
        // Call the global refresh function if available
        if (typeof window !== 'undefined' && (window as any).refreshNotifications) {
          (window as any).refreshNotifications();
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (OneSignal.Notifications as any).addEventListener('foregroundWillDisplay', notificationListener);
    }

    if (!clickListener) {
      clickListener = async (event: any) => {
        console.log('[OneSignal] Notification clicked:', event);
        const collapseId = event?.notification?.additionalData?.entityId || event?.notification?.additionalData?.collapse_id;
        
        if (collapseId) {
          try {
            await fetch("/api/notifications", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: collapseId, read: true })
            });
            broadcastNotificationRefresh();
          } catch (e) {
            console.error('[OneSignal] Failed to mark notification as read on click:', e);
          }
        }
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (OneSignal.Notifications as any).addEventListener('click', clickListener);
    }

    if (userId) {
      console.log('[OneSignal] Logging in user:', userId);
      await OneSignal.login(userId);
      
      // Verify external_id was set
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const externalId = (OneSignal.User as any).externalId;
      console.log('[OneSignal] External ID after login:', externalId);
      
      if (externalId !== userId) {
        console.warn('[OneSignal] External ID mismatch. Expected:', userId, 'Got:', externalId);
      } else {
        // Sync subscription to backend if they have an active token
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isSubscribed = (OneSignal.User.PushSubscription as any).optedIn;
        if (isSubscribed) {
          await syncSubscriptionToBackend(userId);
        }
      }
    }
  } catch (error: any) {
    if (error?.message?.includes("already initialized") || String(error).includes("already initialized") || error?.message?.includes("already initialized")) {
      isInitialized = true;
      console.log('[OneSignal] Already initialized');
    } else {
      console.error('[OneSignal] Error initializing OneSignal:', error);
    }
  }
};

export const logoutOneSignal = async () => {
  if (typeof window === 'undefined') return;
  if (!isInitialized) return;

  try {
    await OneSignal.logout();
  } catch (error) {
    console.error('Error logging out from OneSignal:', error);
  }
};

export const requestPushPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (!isInitialized) {
    console.warn('OneSignal not initialized yet.');
    return false;
  }

  try {
    // OneSignal.Slidedown.promptPush() triggers the browser prompt if not already granted.
    // If the browser natively blocks it, it throws or returns false.
    // However, react-onesignal v3 syntax uses OneSignal.Notifications.requestPermission()
    if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
      const permission = await OneSignal.Notifications.requestPermission();
      // returns true if granted, false if not
      return permission;
    } else {
      // Fallback for older react-onesignal versions if needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (OneSignal as any).showSlidedownPrompt();
      // Check current status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isSubscribed = await (OneSignal as any).isPushNotificationsEnabled();
      return isSubscribed;
    }
  } catch (error) {
    console.error('Error requesting push permission:', error);
    return false;
  }
};

export const checkPushPermission = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!isInitialized) return false;
  
  if (OneSignal.Notifications && typeof OneSignal.Notifications.permission === 'boolean') {
    return OneSignal.Notifications.permission;
  }
  return false;
};
