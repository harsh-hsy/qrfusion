const CACHE_NAME = "qr-fusion-v53";
const APP_SHELL = [
  "/",
  "/index.html",
  "/generator.html",
  "/css/landing.css",
  "/css/style.css",
  "/css/about.css",
  "/js/core/app.js",
  "/js/features/ui-features.js",
  "/js/pages/landing.js",
  "/js/data/dark-bg-data.js",
  "/js/data/light-bg-data.js",
  "/js/data/logo-data.js",
  "/assets/favicon/site.webmanifest",
  "/assets/favicon/favicon-96x96.png",
];
const EXTERNAL_LIBRARIES = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await Promise.allSettled(EXTERNAL_LIBRARIES.map((url) => cache.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          const landingPaths = ["/", "/index.html"];
          return caches.match(
            landingPaths.includes(requestUrl.pathname) ? "/index.html" : "/generator.html"
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok || response.type === "opaque") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
    )
  );
});
