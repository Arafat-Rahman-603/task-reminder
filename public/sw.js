// Manageo Service Worker - v2.0

// PWA CACHING
const CACHE_VERSION = 'manageo-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
  '/',
  '/?pwa=true',
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-icon.png',
  '/favicon-32x32.png',
  '/logo.png',
];

const NEVER_CACHE = [
  /\/api\//,
  /\/dashboard/,
  /_next\/webpack-hmr/,
  /\/__nextjs/,
  /\/socket\.io/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  const shouldSkip = NEVER_CACHE.some((pattern) => pattern.test(url.pathname));
  if (shouldSkip) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cached) => cached || caches.match('/offline'));
        })
    );
    return;
  }

  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|otf)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// FIREBASE MESSAGING BACKGROUND HANDLER
importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js");

// Extract API key from URL query params if available
const apiKey = new URL(location).searchParams.get('apiKey');

// Initialize Firebase with config (API key from URL or placeholder)
firebase.initializeApp({
  apiKey: apiKey || "AIzaSy_fake_placeholder",
  authDomain: "manageo-axiomixs.firebaseapp.com",
  projectId: "manageo-axiomixs",
  storageBucket: "manageo-axiomixs.firebasestorage.app",
  messagingSenderId: "192365353",
  appId: "1:192361065353:web:a400f77a5595d225928f58",
  measurementId: "G-CFZLM9V33"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message ', payload);
  
  // Handle both notification and data payloads
  const notificationTitle = payload.data?.title || payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || '',
    icon: '/icon-192x192.png',
    data: { url: payload.data?.url || '/dashboard' }
  };
  
  // Show notification manually for data payloads
  // For notification payloads, browser may auto-display, but we ensure it's shown
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
