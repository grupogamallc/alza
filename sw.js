// ALZA service worker — network-first (siempre carga lo mas nuevo; cache solo de respaldo offline)
const C = "alza-v2-2";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then((c) => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== C).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // fonts, supabase, youtube -> red directo
  e.respondWith((async () => {
    try {
      const net = await fetch(req);
      const cache = await caches.open(C);
      cache.put(req, net.clone()).catch(() => {});
      return net;
    } catch (_) {
      const cached = await caches.match(req);
      return cached || (await caches.match("./index.html"));
    }
  })());
});
