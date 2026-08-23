const STATIC_CACHE = "jobdd-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for static assets (JS/CSS chunks, images, icons) only.
// Pages and data requests always go to the network so job listings and
// admin data are never served stale.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon") || /\.(png|jpg|jpeg|svg|webp)$/.test(url.pathname));

  if (!isStaticAsset) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          })
      )
    )
  );
});
