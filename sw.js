/* ============================================================
   دعوت‌نامه‌ساز | سرویس‌ورکر آفلاین
   ناوبری: شبکه اول (تا نسخه تازه بیاید)، دارایی‌ها: کش اول
   ============================================================ */
const CACHE = 'invitation-studio-v3';

const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'i18n.js',
  'script.js',
  'icon.svg',
  'manifest.webmanifest',
  'default-image-yektanet.jpg',
  'assets/fonts/Vazirmatn-Regular.woff2',
  'assets/fonts/Vazirmatn-Bold.woff2',
  'assets/fonts/lalezar-arabic-400-normal.woff2',
  'assets/fonts/aref-ruqaa-arabic-400-normal.woff2',
  'assets/fonts/markazi-text-arabic-400-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate' || /\/(index\.html|styles\.css|script\.js|i18n\.js|manifest\.webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('index.html'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) {
        fetch(request)
          .then((response) => caches.open(CACHE).then((cache) => cache.put(request, response)))
          .catch(() => {});
        return hit;
      }
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
