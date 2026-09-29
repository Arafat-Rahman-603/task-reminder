// Manageo Service Worker — v1.0
// A proper PWA service worker: offline support, caching, background sync

const CACHE_VERSION = 'manageo-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Assets to pre-cache on install
const STATIC_ASSETS = [
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

// ────────────────────────────────────────────────
// INSTALL — pre-cache static assets
// ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ────────────────────────────────────────────────
// ACTIVATE — clean up old caches
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// FETCH — network-first for most things, offline fallback
// ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Never cache sensitive routes
  const shouldSkip = NEVER_CACHE.some((pattern) => pattern.test(url.pathname));
  if (shouldSkip) return;

  // For navigation requests (HTML pages) — network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a copy of successful navigation responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Try the cache first, then fallback to offline page
          return caches.match(request)
            .then((cached) => cached || caches.match('/offline'));
        })
    );
    return;
  }

  // For static assets (_next/static, images, fonts) — cache first
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

  // For everything else — network first, silently fall through
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ────────────────────────────────────────────────
// PUSH NOTIFICATIONS (ready for future use)
// ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'Manageo', {
    body: data.body || '',
    icon: '/icon-192x192.png',
    badge: '/favicon-32x32.png',
    data: { url: data.url || '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
