// 中身を更新したら VERSION の数字を上げる → iPhone側も新しい版に入れ替わる
const VERSION = 'kumo-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 自分のファイルとフォントだけ保存。同期（Google）の通信には手を出さない
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  const mine = u.origin === location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (e.request.method !== 'GET' || !(mine || font)) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || (mine ? caches.match('./index.html') : undefined)))
  );
});
