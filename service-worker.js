const APP_CACHE = 'practice24-imakoko-app-v44-walk46';
const DATA_CACHE = 'imakoko-data-v42';
const APP_SHELL = [
  './tutorial-demo.html?v=practice24', './js/tutorial-demo.js?v=practice24',
  './css/tutorial.css?v=practice24', './js/tutorial.js?v=practice24',
  './js/walker-sprite-pack.js?v=44-walk46',
  './js/walker-sprites.js?v=44-walk46', './assets/walker-sprites/standing.png?v=44-walk46',
  './js/map-follow.js?v=44-walk46',
  './js/walker-3d.js?v=44-walk46',
  './js/walker.js?v=44-walk46',
  './js/walking.js?v=44-walk46-practice24', './js/walk-core.js?v=44-walk46', './js/walk-hazards.js?v=44-walk46', './css/walking.css?v=44-walk46',
  './js/transit.js?v=44-walk46',
  './js/map-png.js?v=44-walk46', './js/saved-views.js?v=44-walk46', './css/map-first.css?v=44-walk46', './', './index.html', './css/style.css?v=44-walk46', './css/accessibility.css?v=44-walk46', './css/search.css?v=44-walk46',
  './js/context-layers.js?v=44-walk46', './js/boot.js?v=44-walk46', './js/app.js?v=44-walk46-practice24', './js/geo.js?v=44-walk46', './js/hazard.js?v=44-walk46', './js/i18n.js?v=44-walk46', './js/ruby.js?v=44-walk46', './js/ui-language.js?v=44-walk46',
  './js/location.js?v=44-walk46', './js/offline.js?v=44-walk46', './js/search.js?v=44-walk46',
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
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![APP_CACHE, DATA_CACHE, 'imakoko-saved-maps-v1', 'imakoko-png-tiles-v1'].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    const pageKey = url.pathname.endsWith('/tutorial-demo.html') ? './tutorial-demo.html?v=practice24' : './index.html';
    event.respondWith(fetch(request).then(response => {
      caches.open(APP_CACHE).then(cache => cache.put(pageKey, response.clone()));
      return response;
    }).catch(() => caches.match(pageKey)));
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
    if (cached && !(request.mode === 'cors' && cached.type === 'opaque')) { event.waitUntil(update.catch(() => {})); return cached; }
    return update;
  }).catch(() => new Response('', { status: 503, statusText: 'Offline' })));
});
