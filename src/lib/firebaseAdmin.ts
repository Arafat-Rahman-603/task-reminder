import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
  App
} from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";

let adminApp: App | null = null;

const getAdminApp = (): App | null => {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      console.log("Firebase Admin initialized successfully.");
    } else {
      console.warn("Firebase Admin missing credentials. Push notifications may not work.");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error", error);
  }

  return adminApp;
};

export const getAdminMessaging = (): Messaging | null => {
  const app = getAdminApp();
  if (!app) return null;
  return getMessaging(app);
};

export { getAdminApp };
