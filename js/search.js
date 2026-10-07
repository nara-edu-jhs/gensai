const ENDPOINT = 'https://msearch.gsi.go.jp/address-search/AddressSearch';

export async function searchPlaces(query, { signal } = {}) {
  const normalized = String(query || '').trim();
  if (!normalized) return [];
  const response = await fetch(`${ENDPOINT}?q=${encodeURIComponent(normalized)}`, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Place search failed: ${response.status}`);
  const body = await response.json();
  const features = Array.isArray(body) ? body : Array.isArray(body?.features) ? body.features : [];
  return features.map(feature => {
    const coordinates = feature?.geometry?.coordinates;
    return { name: String(feature?.properties?.title || feature?.properties?.name || '').trim(), latitude: Number(coordinates?.[1]), longitude: Number(coordinates?.[0]) };
  }).filter(place => place.name && Number.isFinite(place.latitude) && Number.isFinite(place.longitude)
    && place.latitude >= 20 && place.latitude <= 46 && place.longitude >= 122 && place.longitude <= 154).slice(0, 6);
}
