import { ui } from './ui-language.js?v=43-map-first-fix49';
const KEY = 'imakoko-saved-views-v1';
const TILE_CACHE = 'imakoko-saved-maps-v1';
const validPoint = point => point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 85.051129 && Math.abs(point.longitude) <= 180;
export function readSavedViews() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(items) ? items.filter(item => item?.version === 1 && validPoint(item.state?.location) && validPoint(item.state?.mapCenter) && Number.isFinite(item.savedAt) && typeof item.name === 'string' && Array.isArray(item.state.shelters) && Array.isArray(item.state.risks)) : [];
  } catch { return []; }
}
export function writeSavedView(item) {
  const items = readSavedViews();
  if (items.length >= 20) throw new Error(ui('保存は20件までです。使わない保存を削除してから保存してください。'));
  localStorage.setItem(KEY, JSON.stringify([item, ...items]));
}
export function removeSavedView(id) {
  localStorage.setItem(KEY, JSON.stringify(readSavedViews().filter(item => item.id !== id)));
}
export async function cacheSavedTiles(urls) {
  if (!('caches' in window) || !window.isSecureContext) return {total:urls.length, saved:0, supported:false};
  const cache = await caches.open(TILE_CACHE);
  let saved = 0;
  const queue = [...new Set(urls)];
  const total = queue.length;
  await Promise.all(Array.from({length:Math.min(4,total)}, async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        const request = new Request(url, {mode:'no-cors',credentials:'omit'});
        let response = await caches.match(request);
        if (!response) response = await fetch(request, {signal:AbortSignal.timeout(12000)});
        if (response.ok || response.type === 'opaque') { await cache.put(request, response.clone()); saved++; }
      } catch { /* Report missing tiles without losing the saved locations. */ }
    }
  }));
  return {total,saved,supported:true};
}
export async function offlineAppReady() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return false;
  try {
    const registration = await Promise.race([navigator.serviceWorker.ready, new Promise((_,reject) => setTimeout(() => reject(new Error('timeout')),6000))]);
    return Boolean(registration.active);
  } catch { return false; }
}
