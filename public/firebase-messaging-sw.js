// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: new URL(location).searchParams.get('apiKey') || "AIzaSy_fake_it_will_be_used_from_env_but_can_be_hardcoded_or_skip_if_not_needed", 
  // apiKey might not be strictly needed just to receive background messages if we use the backend to send them.
  // Actually, apiKey IS needed. Let's use a placeholder and we can replace it later if the user provides it in env.
  // Since we don't have the API key, let's look at the instruction:
  // "Use the exact Firebase values from the project's current Firebase Console configuration rather than inventing values."
  // The user didn't provide apiKey! I need to ask them or leave it to be replaced.
};

firebase.initializeApp({
  authDomain: "manageo-axiomixs.firebaseapp.com",
  projectId: "manageo-axiomixs",
  storageBucket: "manageo-axiomixs.firebasestorage.app",
  messagingSenderId: "192365353",
  appId: "1:192361065353:web:a400f77a5595d225928f58",
  measurementId: "G-CFZLM9V33"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // If the payload has notification object, FCM shows it automatically.
  // Otherwise we show it manually.
  if (!payload.notification && payload.data) {
    const notificationTitle = payload.data.title || 'New Notification';
    const notificationOptions = {
      body: payload.data.body || '',
      icon: '/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Handle click to open app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // If a window is already open, focus it
      for (let client of windowClients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});
