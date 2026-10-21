// Einfacher Offline-Cache: App-Dateien bleiben verfügbar, Daten kommen aus dem lokalen Speicher.
const CACHE = 'studium-shell-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(r).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(r, c)); return res; })
      .catch(() => caches.match(r).then((m) => m || caches.match('/')))
  );
});
