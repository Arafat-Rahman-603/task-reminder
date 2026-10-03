// Manageo Service Worker — v2.0
// OneSignal MUST be imported first and be the only push/notificationclick handler.
// The OneSignal SDK takes full ownership of push events in the service worker.
// Do NOT add your own 'push' or 'notificationclick' listeners here — they will
// conflict and break background notifications.

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// ────────────────────────────────────────────────────────────────────
// PWA CACHING — runs alongside OneSignal with no conflict
// ────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'manageo-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Assets to pre-cache on install
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

// Never cache these patterns
const NEVER_CACHE = [
  /\/api\//,
  /\/dashboard/,
  /_next\/webpack-hmr/,
  /\/__nextjs/,
  /\/socket\.io/,
];

// ── INSTALL ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────
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

// ── FETCH ─────────────────────────────────────────────────────────────
// NOTE: OneSignal's importScripts adds its own fetch listener for its own
// CDN requests. This listener only handles app requests.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests (chrome-extension, onesignal internal, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Skip OneSignal CDN requests — let OneSignal handle those
  if (url.hostname.includes('onesignal.com')) return;

  // Never cache sensitive routes
  const shouldSkip = NEVER_CACHE.some((pattern) => pattern.test(url.pathname));
  if (shouldSkip) return;

  // Navigation requests — network first, offline fallback
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

  // Static assets — cache first
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

  // Everything else — network first, cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── PUSH & NOTIFICATIONCLICK ──────────────────────────────────────────
// These are intentionally NOT defined here.
// OneSignalSDK.sw.js (imported above) handles all push delivery and
// notification click routing. Adding your own listeners would create a
// conflict that breaks delivery in both foreground AND background.
