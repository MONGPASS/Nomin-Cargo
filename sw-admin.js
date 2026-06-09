const CACHE_NAME = 'nomin-admin-v6';
const ASSETS_TO_CACHE = [
  '/admin',
  '/admin-orders',
  '/admin-banners',
  '/admin-notifications',
  '/admin-order-detail',
  '/admin-branches',
  '/admin-login',
  '/admin-auth.js',
  '/popup-admin.js',
  '/styles.css',
  '/images/admin-icon-192.png',
  '/images/admin-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('Cache addAll failed, skipping:', err);
        self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = event.request.url;
  if (!url.startsWith('http')) return;

  // NEVER cache API calls - always go to network
  if (url.includes('/api/')) return;

  // For navigation requests, always go to network first (avoid redirect issues)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other resources (CSS, images, etc.), use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clonedResponse = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
