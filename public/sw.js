// Manageo Service Worker - v2.0

// PWA CACHING
const CACHE_VERSION = "manageo-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
  "/",
  "/?pwa=true",
  "/offline",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-icon.png",
  "/favicon-32x32.png",
  "/monochrome-icon.png",
  "/logo.png",
];

const NEVER_CACHE = [
  /\/api\//,
  /\/dashboard/,
  /_next\/webpack-hmr/,
  /\/__nextjs/,
  /\/socket\.io/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn("[SW] Some static assets failed to cache:", err);
        });
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  const shouldSkip = NEVER_CACHE.some((pattern) => pattern.test(url.pathname));
  if (shouldSkip) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches
            .match(request)
            .then((cached) => cached || caches.match("/offline"));
        }),
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|otf)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log("[SW] Push payload:", payload);

    // Broadcast refresh to any open windows/tabs
    const clientsPromise = clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (let client of windowClients) {
          client.postMessage({ type: "notification-refresh" });
        }
      })
      .catch(() => {});

    // FCM wraps data in a `data` property
    const data = payload.data || {};
    
    // If it's a notification message, the system handles it automatically
    if (payload.notification || payload.webpush?.notification) {
      console.log("[SW] System handling notification natively");
      event.waitUntil(clientsPromise);
      return;
    }

    const title = data.title || "New Notification";
    const options = {
      body: data.body || "",
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/monochrome-icon.png",
      tag: data.notificationId || data.entityId || "manageo-notification",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/dashboard" },
    };

    const notificationPromise = self.registration.showNotification(title, options);
    event.waitUntil(Promise.all([notificationPromise, clientsPromise]));
  } catch (err) {
    console.error("[SW] Push event error:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
