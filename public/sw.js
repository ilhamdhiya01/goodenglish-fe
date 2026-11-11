// GoodEnglish service worker: makes the app installable (PWA) and serves the
// hashed static files from cache. Deliberately nothing else — pages, the API
// (/api/v1, including Tanya AI's streamed answers) and the session cookie
// always go to the network, so a learner never sees stale progress or a
// stale login. No offline mode.

const CACHE = "ge-static-v1";
// Each deploy brings new hashed chunks; keep the cache from growing forever.
const MAX_ENTRIES = 300;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Content-hashed (/_next/static) or versioned-by-name (/icons) files: once
// fetched, never different.
const isImmutable = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/"));

const trim = async (cache) => {
  const keys = await cache.keys();
  // Oldest first (insertion order).
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((k) =>
      cache.delete(k),
    ),
  );
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!isImmutable(url)) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request);
      if (hit) return hit;
      const res = await fetch(request);
      if (res.ok) {
        await cache.put(request, res.clone());
        void trim(cache);
      }
      return res;
    }),
  );
});
