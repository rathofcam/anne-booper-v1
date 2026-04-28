// Anne Booper Service Worker

const CACHE_NAME = "anne-booper-v1";

// Files to cache (add more if needed later)
const FILES_TO_CACHE = [
  "./index.html",
  "./Anne.png"
];

// Install → cache core files
self.addEventListener("install", event => {
  console.log("[SW] Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("[SW] Caching files");
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(err => console.error("[SW] Cache failed:", err))
  );

  self.skipWaiting();
});

// Activate → clean old caches
self.addEventListener("activate", event => {
  console.log("[SW] Activating...");

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(oldKey => {
            console.log("[SW] Deleting old cache:", oldKey);
            return caches.delete(oldKey);
          })
      );
    })
  );

  self.clients.claim();
});

// Fetch → cache-first, then network fallback
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then(response => {
          // Clone and store new files dynamically
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback (basic)
          if (event.request.destination === "document") {
            return caches.match("./index.html");
          }
        });
    })
  );
});