const ENDPOINT = 'https://msearch.gsi.go.jp/address-search/AddressSearch';
const STATIONS = 'https://express.heartrails.com/api/json';
const normalize = value => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const compact = value => normalize(value).replace(/\s/g, '').toLowerCase();
const stationName = value => normalize(value).replace(/^JR\s*/i, '').replace(/駅$/, '').trim();
const valid = place => place.name && Number.isFinite(place.latitude) && Number.isFinite(place.longitude)
  && place.latitude >= 20 && place.latitude <= 46 && place.longitude >= 122 && place.longitude <= 154;
async function request(url, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 6000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Place search failed: ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
async function addressSearch(query, signal) {
  const body = await request(`${ENDPOINT}?q=${encodeURIComponent(query)}`, signal);
  const features = Array.isArray(body) ? body : Array.isArray(body?.features) ? body.features : [];
  return features.map(feature => ({
    name: normalize(feature?.properties?.title || feature?.properties?.name),
    latitude: Number(feature?.geometry?.coordinates?.[1]), longitude: Number(feature?.geometry?.coordinates?.[0]),
    station: String(feature?.properties?.dataSource) === '1', source: '国土地理院'
  })).filter(valid);
}
async function railwaySearch(query, signal) {
  const body = await request(`${STATIONS}?method=getStations&name=${encodeURIComponent(stationName(query))}`, signal);
  const stations = body?.response?.station || [];
  return stations.filter(s => !/^JR/i.test(query) || /^JR/i.test(s.line)).map(s => ({
    name: `${s.name}駅`, latitude: Number(s.y), longitude: Number(s.x), station: true,
    description: `${s.prefecture}・${s.line}`, line: s.line, source: 'HeartRails Express'
  })).filter(valid);
}
export async function searchPlaces(query, { signal } = {}) {
  const normalized = normalize(query);
  if (!normalized) return [];
  const short = stationName(normalized);
  const stationIntent = /駅$/.test(normalized) || /^JR/i.test(normalized);
  const variants = [...new Set([normalized, ...(/^JR\s*/i.test(normalized) ? [normalized.replace(/^JR\s*/i, '')] : [])])];
  const jobs = variants.map(q => addressSearch(q, signal));
  if (stationIntent || (normalized.length <= 12 && !/[0-9都道府県市区町村丁目番地]/.test(normalized))) jobs.unshift(railwaySearch(normalized, signal));
  const results = await Promise.allSettled(jobs);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const successes = results.filter(r => r.status === 'fulfilled');
  if (!successes.length) throw results[0].reason;
  const score = place => {
    const name = compact(place.name), target = compact(short + '駅');
    let value = name === target ? 100 : compact(stationName(place.name)) === compact(short) ? 90 : name.includes(compact(short)) ? 30 : 0;
    if (place.station) value += stationIntent ? 45 : 5;
    if (place.line && /^JR/i.test(normalized)) value += 20;
    if (name === compact(normalized)) value += 30;
    return value;
  };
  const ranked = successes.flatMap(r => r.value).sort((a,b) => score(b)-score(a));
  const unique = [];
  for (const place of ranked) {
    const existing = unique.find(p => compact(p.name) === compact(place.name) && Math.abs(p.latitude-place.latitude)<.0015 && Math.abs(p.longitude-place.longitude)<.0015);
    if (existing) {
      if (place.description && !existing.description?.includes(place.line)) existing.description = [existing.description, place.description].filter(Boolean).join(' ／ ');
    } else unique.push({...place});
  }
  return unique.slice(0, 8).map(place => {
    if (!place.description) return place;
    const lines = place.description.split(' ／ ');
    return {...place, description: lines.slice(0, 3).join(' ／ ') + (lines.length > 3 ? ` ／ +${lines.length - 3}` : '')};
  });
}
