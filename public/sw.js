const CACHE_NAME = 'rodeo-ai-cache-v3';
const AI_MODEL_CACHE = 'rodeo-ai-models-v3';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== AI_MODEL_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname === 'huggingface.co' || url.pathname.includes('onnx') || url.pathname.includes('transformers')) {
    console.log('[SW] Caching AI model:', url.pathname);
    event.respondWith(
      caches.open(AI_MODEL_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            console.log('[SW] Serving AI model from cache:', url.pathname);
            return response;
          }

          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              console.log('[SW] Caching new AI model file:', url.pathname);
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          return response;
        }
        return caches.match(event.request).then(cached => cached || response);
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_AI_CACHE') {
    console.log('[SW] Clearing AI cache...');
    event.waitUntil(
      caches.delete(AI_MODEL_CACHE).then(() => {
        console.log('[SW] AI cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
