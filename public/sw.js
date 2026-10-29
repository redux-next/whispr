const CACHE_NAME = "whispr-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache API requests or Firebase/network responses.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }
});
