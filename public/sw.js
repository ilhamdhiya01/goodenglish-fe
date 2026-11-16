// GoodEnglish service worker: makes the app installable (PWA) and serves the
// hashed static files from cache. Deliberately nothing else — pages, the API
// (/api/v1, including Tanya AI's streamed answers) and the session cookie
// always go to the network, so a learner never sees stale progress or a
// stale login. No offline mode; the only other cached files are the logo
// and Jalak in /brand, so the offline message on /access has its picture.

// v2: drops the old /icons files from v1.
const CACHE = "ge-static-v2";
// Each deploy brings new hashed chunks; keep the cache from growing forever.
const MAX_ENTRIES = 300;

// Fetched up front: Jalak "sedih" is only shown offline, when it can no
// longer be downloaded.
const BRAND = [
  "logo-mark",
  "jalak-biasa",
  "jalak-senang",
  "jalak-bangga",
  "jalak-sedih",
  "jalak-berpikir",
  "jalak-bicara",
].map((f) => `/brand/${f}.svg`);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(BRAND))
      // A failed download must not stop the worker from installing.
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

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

// Content-hashed (/_next/static) files: once fetched, never different.
const isImmutable = (url) =>
  url.origin === self.location.origin &&
  url.pathname.startsWith("/_next/static/");

// The logo and Jalak (/brand): from cache at once, so they show offline too,
// and refreshed in the background so a new design still arrives.
const isBrand = (url) =>
  url.origin === self.location.origin && url.pathname.startsWith("/brand/");

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
  if (isBrand(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        const fresh = fetch(request)
          .then(async (res) => {
            if (res.ok) await cache.put(request, res.clone());
            return res;
          })
          .catch(() => hit);
        if (hit) {
          event.waitUntil(fresh);
          return hit;
        }
        return fresh;
      }),
    );
    return;
  }
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
