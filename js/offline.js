const STORAGE_PREFIX = 'kokokara-bosai-v15';

function storageKey(kind, location, hazard = '') {
  const lat = Number(location.latitude).toFixed(3);
  const lon = Number(location.longitude).toFixed(3);
  return `${STORAGE_PREFIX}:${kind}:${lat}:${lon}:${hazard}`;
}

function safeWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

function safeRead(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
}

export function saveData(kind, location, value, hazard = '') {
  safeWrite(storageKey(kind, location, hazard), { savedAt: Date.now(), location, value });
}

export function loadData(kind, location, hazard = '') {
  const cached = safeRead(storageKey(kind, location, hazard));
  if (!cached?.value || !cached.location || !Number.isFinite(cached.savedAt)) return null;
  const ageLimit = kind === 'shelters' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const age = Date.now() - cached.savedAt;
  const latMeters = (Number(location.latitude) - Number(cached.location.latitude)) * 111320;
  const lonMeters = (Number(location.longitude) - Number(cached.location.longitude)) * 111320 * Math.cos(Number(location.latitude) * Math.PI / 180);
  const separation = Math.hypot(latMeters, lonMeters);
  return age >= 0 && age <= ageLimit && separation <= 50 ? cached : null;
}

export function saveLastLocation(location, source) {
  safeWrite(`${STORAGE_PREFIX}:last-location`, { savedAt: Date.now(), location, source });
}

export function loadLastLocation() {
  return safeRead(`${STORAGE_PREFIX}:last-location`);
}

export function isOnline() {
  return navigator.onLine;
}

export function watchConnection(callback) {
  const notify = () => callback(navigator.onLine);
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);
  notify();
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('./service-worker.js?v=42-mobile-fix4').catch(() => {});
}
