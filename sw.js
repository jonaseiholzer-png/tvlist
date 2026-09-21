// Offline-Hülle: App-Dateien laden zuerst über das Netz (damit Updates ankommen), sonst aus dem Cache.
const APP = 'watchlist-app-v1';
const IMG = 'watchlist-img-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== APP && k !== IMG).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(APP).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(m => m || caches.match('index.html')))
    );
  } else if (url.hostname === 'image.tmdb.org') {
    e.respondWith(
      caches.open(IMG).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; })))
    );
  }
});
