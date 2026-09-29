import OneSignal from 'react-onesignal';

let isInitialized = false;

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
    }

    if (userId) {
      await OneSignal.login(userId);
    }
  } catch (error) {
    console.error('Error initializing OneSignal:', error);
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
