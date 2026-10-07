export const FALLBACK_LOCATION = { latitude: 35.681236, longitude: 139.767125 };
export function getCurrentLocation(options = {}) {
  if (!('geolocation' in navigator)) return Promise.reject({ code: 'UNSUPPORTED' });
  if (location.protocol === 'file:' || (!window.isSecureContext && location.hostname !== 'localhost')) return Promise.reject({ code: 'INSECURE' });
  const attempt = settings => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
    ({ coords, timestamp }) => resolve({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
      capturedAt: timestamp || Date.now()
    }),
    error => reject({ code: error.code === 1 ? 'DENIED' : error.code === 3 ? 'TIMEOUT' : 'UNAVAILABLE' }),
    settings
  ));
  return attempt({ enableHighAccuracy: true, timeout: 9000, maximumAge: 30000, ...options })
    .catch(error => error.code === 'DENIED'
      ? Promise.reject(error)
      : attempt({ enableHighAccuracy: false, timeout: 10000, maximumAge: 120000, ...options }));
}
export const formatCoordinate = (value) => Number.isFinite(value) ? value.toFixed(5) : '—';
