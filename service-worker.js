const APP_CACHE = 'imakoko-app-v42-mobile-fix4';
const DATA_CACHE = 'imakoko-data-v42';
const APP_SHELL = [
  './', './index.html', './css/style.css?v=42-mobile-fix4', './css/accessibility.css?v=42-mobile-fix4', './css/search.css?v=42-mobile-fix4',
  './js/boot.js?v=42-mobile-fix4', './js/app.js?v=42-mobile-fix4', './js/geo.js?v=42-mobile-fix4', './js/hazard.js?v=42-mobile-fix4', './js/i18n.js?v=42-mobile-fix4', './js/ruby.js?v=42-mobile-fix4',
  './js/location.js?v=42-mobile-fix4', './js/offline.js?v=42-mobile-fix4', './js/search.js?v=42-mobile-fix4',
  './assets/pictograms/emergency-evacuation-place.png',
  './assets/pictograms/evacuation-area-jis-hd.jpg',
  './assets/pictograms/fire.jpg', './assets/pictograms/flood.jpg',
  './assets/pictograms/landslide.jpg', './assets/pictograms/storm-surge.jpg',
  './assets/pictograms/tsunami-warning.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![APP_CACHE, DATA_CACHE].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      caches.open(APP_CACHE).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      caches.open(APP_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }

  event.respondWith(caches.match(request).then(cached => {
    const update = fetch(request).then(response => {
      if (response.ok || response.type === 'opaque') caches.open(DATA_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    });
    return cached || update;
  }).catch(() => new Response('', { status: 503, statusText: 'Offline' })));
});
