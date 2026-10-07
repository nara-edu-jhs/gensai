import { getCurrentLocation, FALLBACK_LOCATION, formatCoordinate } from './location.js?v=42';
import { getShelters, renderBaseMap, renderHazardOverlay, renderMarkers, positionCurrentMarker, panMapCenter, gsiMapUrl } from './geo.js?v=42';
import { analyzeHazards, choosePriority } from './hazard.js?v=42';
import { getText, translate } from './i18n.js?v=42';
import { isOnline, loadData, loadLastLocation, registerServiceWorker, saveData, saveLastLocation, watchConnection } from './offline.js?v=42';
import { searchPlaces } from './search.js?v=42';
import { startRubySupport } from './ruby.js?v=42';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let state = { language: 'ja', location: null, mapCenter: null, mapZoom: 15, mapHazard: 0, source: '', placeName: '', hazard: 4, risks: [], shelters: [], mobility: false, overlayStatus: 'off' };
let overlayRevision = 0;
let searchController = null;
const text = () => getText(state.language);
const hazardIcons = { 1: 'flood.jpg', 2: 'landslide.jpg', 3: 'storm-surge.jpg', 4: 'evacuation-area-jis-hd.jpg', 5: 'tsunami-warning.jpg', 6: 'fire.jpg', 7: 'flood.jpg' };
const waterLegendColors = ['#f7f5a9', '#ffd8c0', '#ffb7b7', '#ff9191', '#f285c9', '#dc7adc'];
const landslideLegendColors = ['#fff33b', '#e60012'];
function setLanguage(language) {
  state.language = ['ja', 'en', 'zh', 'ko'].includes(language) ? language : 'ja';
  translate(state.language);
  updateConnectionStatus();
  if (!state.location) return;
  $('#location-source').textContent = state.placeName || text()[state.source];
  $('#action-location-source').textContent = state.placeName || text()[state.source];
  if (state.risks.length) renderRisks();
  renderLocationQuality();
  renderImmediateActions();
  renderShelters();
  updateSelectedHazard();
  showOverlayStatus(state.overlayStatus);
}

function enterApp(language) {
  $('#language').value = language;
  setLanguage(language);
  $('#language-gate').hidden = true;
  $('#language-control').hidden = false;
  $('#location-panel').hidden = false;
  $('#location-title').focus();
}

async function useLocation(location, source, placeName = '') {
  const normalizedLocation = { ...location, capturedAt: location.capturedAt || Date.now() };
  state = { ...state, location: normalizedLocation, mapCenter: normalizedLocation, mapZoom: 15, mapHazard: 0, source, placeName, hazard: 4, risks: [], shelters: [] };
  $('#location-panel').hidden = true;
  $('#dashboard').hidden = true;
  $('#action-panel').hidden = false;
  $('#show-results').disabled = false;
  $('#action-status').textContent = text().riskLoading;
  const coordinates = `${formatCoordinate(normalizedLocation.latitude)}, ${formatCoordinate(normalizedLocation.longitude)}`;
  $('#coordinate-label').textContent = coordinates;
  $('#action-coordinate-label').textContent = coordinates;
  $('#location-source').textContent = placeName || text()[source];
  $('#action-location-source').textContent = placeName || text()[source];
  renderLocationQuality();
  renderImmediateActions();
  saveLastLocation(normalizedLocation, source);
  $('#map-error').hidden = true;
  renderBaseMap($('#map-layer'), normalizedLocation, () => { $('#map-error').hidden = false; }, state.mapZoom);
  positionCurrentMarker($('#map-layer'), normalizedLocation, normalizedLocation, state.mapZoom);
  updateLinks();
  updateSelectedHazard();
  void checkRisks().catch(() => {}).finally(() => { $('#action-status').textContent = ''; });
  $('#action-now-title').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function findPlace(event) {
  event.preventDefault();
  const query = $('#place-query').value.trim();
  const status = $('#place-search-status');
  const results = $('#place-search-results');
  const fallback = $('#official-place-search');
  if (!query) { status.textContent = text().searchEmpty; return; }
  if (!isOnline()) { status.textContent = text().searchOffline; fallback.hidden = false; return; }
  searchController?.abort();
  const controller = new AbortController();
  searchController = controller;
  $('#place-search-button').disabled = true;
  status.textContent = text().searchLoading;
  fallback.hidden = true;
  results.replaceChildren();
  try {
    const places = await searchPlaces(query, { signal: controller.signal });
    if (!places.length) { status.textContent = text().searchNoResults; fallback.hidden = false; return; }
    status.textContent = text().searchChoose;
    results.replaceChildren(...places.map(place => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
    const name = document.createElement('b');
    name.dataset.noRuby = '';
      name.textContent = place.name;
      const hint = document.createElement('span');
      hint.textContent = text().choosePlace;
      button.append(name, hint);
      button.addEventListener('click', () => useLocation({ latitude: place.latitude, longitude: place.longitude, accuracy: null, capturedAt: Date.now() }, 'searchSource', place.name));
      item.append(button);
      return item;
    }));
  } catch (error) {
    if (error?.name !== 'AbortError') { status.textContent = text().searchFailed; fallback.hidden = false; }
  } finally {
    if (searchController === controller) $('#place-search-button').disabled = false;
  }
}

async function locate() {
  const button = $('#use-gps');
  button.disabled = true;
  button.querySelector('b').textContent = text().gpsLoading;
  $('#location-error').textContent = '';
  try { await useLocation(await getCurrentLocation(), 'gpsSource'); }
  catch (error) { $('#location-error').textContent = error?.code === 'INSECURE' ? text().gpsSecureError : text().gpsError; }
  finally { button.disabled = false; button.querySelector('b').textContent = text().useGps; }
}

function useManual() {
  const latitude = Number($('#manual-lat').value), longitude = Number($('#manual-lon').value);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    $('#location-error').textContent = text().manualError;
    return;
  }
  useLocation({ latitude, longitude, accuracy: null, capturedAt: Date.now() }, 'manualSource');
}

function renderLocationQuality() {
  const targets = $$('[data-location-quality]');
  if (!targets.length || !state.location) return;
  const accuracy = Number(state.location.accuracy);
  const time = formatSavedTime(state.location.capturedAt || Date.now());
  const value = Number.isFinite(accuracy)
    ? text().locationAccuracy.replace('{meters}', Math.round(accuracy)).replace('{time}', time)
    : text().locationAccuracyUnknown.replace('{time}', time);
  targets.forEach(target => {
    target.className = `location-quality${Number.isFinite(accuracy) && accuracy > 100 ? ' uncertain' : ''}`;
    target.textContent = value;
  });
}

function renderImmediateActions() {
  const list = $('#immediate-actions');
  if (!list) return;
  const actions = text().checks?.[state.hazard] || text().checks?.[4] || [];
  list.replaceChildren(...actions.slice(0, 3).map(action => {
    const item = document.createElement('li');
    const sentence = document.createElement('span');
    sentence.className = 'action-sentence';
    sentence.textContent = action;
    item.append(sentence);
    return item;
  }));
}

async function checkRisks() {
  $('#risk-status').textContent = text().riskLoading;
  $('#risk-cards').replaceChildren(makeLoadingCard());
  try {
    const cached = loadData('risks', state.location);
    if (!isOnline() && cached) {
      state.risks = cached.value;
      showCachedData(cached.savedAt);
    } else {
      const fresh = await analyzeHazards(state.location);
      const verified = fresh.some(risk => ![4, 6].includes(risk.type) && risk.status !== 'unknown');
      if (verified) {
        state.risks = fresh;
        saveData('risks', state.location, fresh);
        hideCachedData();
      } else if (cached) {
        state.risks = cached.value;
        showCachedData(cached.savedAt);
      } else state.risks = fresh;
    }
    state.hazard = choosePriority(state.risks);
    state.mapHazard = [1, 2, 3, 5, 7].includes(state.hazard) ? state.hazard : 0;
    $('#risk-status').textContent = text().riskReady;
    renderRisks();
    updateSelectedHazard();
    updateLinks();
    await loadShelters();
  } catch {
    state.risks = [{ type: 4, status: 'always' }, { type: 6, status: 'realtime' }];
    state.hazard = 4;
    state.mapHazard = 0;
    $('#risk-status').textContent = text().riskFailed;
    renderRisks();
    updateSelectedHazard();
    updateLinks();
    await loadShelters();
  }
}

function makeLoadingCard() {
  const card = document.createElement('div');
  card.className = 'risk-card';
  card.textContent = text().riskLoading;
  return card;
}

function renderRisks() {
  const rank = { inside: 0, nearby: 1, always: 2, realtime: 3, unknown: 4, notDetected: 5 };
  const risks = [...state.risks].sort((a, b) => rank[a.status] - rank[b.status]);
  const cards = risks.map((risk, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `risk-card${index === 0 ? ' rank-first' : ''}${risk.type === state.hazard ? ' selected' : ''}`;
    button.setAttribute('aria-pressed', String(risk.type === state.hazard));
    const icon = document.createElement(hazardIcons[risk.type] ? 'img' : 'span');
    icon.className = `risk-icon${risk.type === 4 ? ' official-evacuation-icon' : ''}`;
    icon.setAttribute('aria-hidden', 'true');
    if (hazardIcons[risk.type]) icon.src = `assets/pictograms/${hazardIcons[risk.type]}`;
    else icon.textContent = text().riskNames[risk.type].slice(0, 1);
    const level = document.createElement('span');
    level.className = 'risk-level';
    level.textContent = text().riskStates[risk.status][0];
    const title = document.createElement('h3');
    title.innerHTML = text().riskNamesRich?.[risk.type] || escapeHtml(text().riskNames[risk.type]);
    const detail = document.createElement('p');
    detail.textContent = text().riskStates[risk.status][1];
    const body = document.createElement('span');
    body.className = 'risk-body';
    body.append(level, title, detail);
    button.append(icon, body);
    button.addEventListener('click', () => selectHazard(risk.type));
    return button;
  });
  if (!cards.length) return $('#risk-cards').replaceChildren();
  const more = document.createElement('details');
  more.className = 'other-risks';
  const summary = document.createElement('summary');
  summary.innerHTML = text().otherHazardsRich || escapeHtml(text().otherHazards);
  const list = document.createElement('div');
  list.className = 'other-risk-list';
  list.append(...cards.slice(1));
  more.append(summary, list);
  $('#risk-cards').replaceChildren(cards[0], more);
}

function selectHazard(type) {
  state.hazard = Number(type);
  if ([1, 2, 3, 5, 7].includes(state.hazard)) state.mapHazard = state.hazard;
  renderRisks();
  updateSelectedHazard();
  updateLinks();
  loadShelters();
  $('.content-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateSelectedHazard() {
  const hazardName = text().riskNamesRich?.[state.hazard] || escapeHtml(text().riskNames[state.hazard]);
  $('#selected-hazard').innerHTML = `${escapeHtml(text().showingFor)}: ${hazardName}`;
  renderImmediateActions();
  updateHazardOverlay();
}

function updateHazardOverlay() {
  if (!state.location) return;
  const choice = $(`input[name="overlay-layer"][value="${state.mapHazard}"]`);
  if (choice) choice.checked = true;
  renderHazardLegend();
  const revision = ++overlayRevision;
  renderHazardOverlay($('#map-layer'), state.mapCenter || state.location, state.mapHazard, state.mapHazard !== 0, status => {
    if (revision === overlayRevision) showOverlayStatus(status);
  }, state.mapZoom);
}

function renderHazardLegend() {
  const legend = $('#hazard-legend');
  const overlayType = state.mapHazard;
  const isWater = [1, 3, 5, 7].includes(overlayType);
  const isLandslide = overlayType === 2;
  legend.hidden = overlayType === 0 || (!isWater && !isLandslide);
  if (legend.hidden) return;
  const labels = isWater ? (overlayType === 7 ? text().inlandLegend : text().waterLegend) : text().landslideLegend;
  const colors = isWater ? waterLegendColors : landslideLegendColors;
  $('#legend-intro').textContent = isWater ? text().waterLegendIntro : text().landslideLegendIntro;
  $('#legend-items').replaceChildren(...labels.map((label, index) => {
    const item = document.createElement('li');
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.style.backgroundColor = colors[index];
    swatch.setAttribute('aria-hidden', 'true');
    const caption = document.createElement('span');
    caption.textContent = label;
    item.append(swatch, caption);
    return item;
  }));
  $('#legend-source').href = isWater
    ? 'https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/faq/integration-shinsui-legend-20240801.pdf'
    : 'https://disaportaldata.gsi.go.jp/hazardmap/copyright/opendata.html';
}

function showOverlayStatus(status) {
  state.overlayStatus = status;
  if (status === 'visible') {
    const hazardName = text().riskNames[state.mapHazard];
    $('#overlay-status').textContent = text().overlayNamedVisible.replace('{hazard}', hazardName);
    return;
  }
  const key = { unsupported: 'overlayUnsupported', failed: 'overlayFailed', off: 'overlayOff' }[status] || 'overlayFailed';
  $('#overlay-status').textContent = text()[key];
}

function selectMapHazard(value) {
  const type = Number(value);
  state.mapHazard = [1, 2, 3, 5, 7].includes(type) ? type : 0;
  updateHazardOverlay();
  updateLinks();
}

function updateLinks() {
  const { latitude, longitude } = state.location;
  $('#gsi-link').href = gsiMapUrl(state.location, state.hazard);
  const showLandslide = state.mapHazard === 2;
  $('#hazard-link').href = `https://disaportal.gsi.go.jp/maps/index.html?base=pale&ll=${latitude},${longitude}&z=15${showLandslide ? '&layerset=dosya' : ''}`;
}

async function loadShelters() {
  const hazard = state.hazard;
  $('#data-status').textContent = text().loading;
  $('#shelter-list').replaceChildren();
  try {
    const cached = loadData('shelters', state.location, hazard);
    let results;
    if (!isOnline() && cached) {
      results = cached.value;
      showCachedData(cached.savedAt);
    } else {
      const fresh = await getShelters(state.location, hazard);
      if (fresh.length) {
        results = fresh;
        saveData('shelters', state.location, fresh, hazard);
      } else if (cached) {
        results = cached.value;
        showCachedData(cached.savedAt);
      } else results = fresh;
    }
    if (hazard !== state.hazard) return;
    state.shelters = results.slice(0, 6);
    renderMarkers($('#map-layer'), state.mapCenter || state.location, state.shelters, focusShelter, state.mapZoom);
    positionCurrentMarker($('#map-layer'), state.mapCenter || state.location, state.location, state.mapZoom);
    renderShelters();
    $('#data-status').textContent = state.shelters.length ? text().loaded.replace('{count}', state.shelters.length) : text().noData;
  } catch {
    if (hazard !== state.hazard) return;
    state.shelters = [];
    renderShelters();
    $('#data-status').textContent = text().failed;
  }
}

function renderShelters() {
  const list = $('#shelter-list');
  if (!state.shelters.length) {
    const item = document.createElement('li');
    item.className = 'shelter-option';
    item.textContent = text().noData;
    list.replaceChildren(item);
    return;
  }
  list.replaceChildren(...state.shelters.map((shelter, index) => {
    const item = document.createElement('li');
    item.className = 'shelter-option';
    item.id = `shelter-${index + 1}`;
    const top = document.createElement('div');
    top.className = 'shelter-top';
    const number = document.createElement('span');
    number.className = 'shelter-num'; number.textContent = index + 1;
    const info = document.createElement('div');
    const name = document.createElement('h3'); name.dataset.noRuby = ''; name.innerHTML = `<img class="shelter-icon" src="assets/pictograms/evacuation-area-jis-hd.jpg" width="150" height="150" alt="">${escapeHtml(shelter.name)}`;
    const opening = document.createElement('strong'); opening.className = 'opening-unknown'; opening.textContent = text().openingUnknown;
    const meta = document.createElement('p'); meta.dataset.noRuby = '';
    const distance = shelter.distance < 1 ? `${Math.round(shelter.distance * 1000)} m` : `${shelter.distance.toFixed(1)} km`;
    meta.textContent = `${text().directions[shelter.direction]} · ${distance}${shelter.address ? ` · ${shelter.address}` : ''}`;
    info.append(name, opening, meta); top.append(number, info);
    const actions = document.createElement('div'); actions.className = 'shelter-actions';
    const locateOnMap = document.createElement('button'); locateOnMap.type = 'button'; locateOnMap.className = 'show-on-map'; locateOnMap.textContent = text().showOnMap; locateOnMap.addEventListener('click', () => focusMapMarker(index));
    const map = document.createElement('a'); map.target = '_blank'; map.rel = 'noopener'; map.textContent = `${text().details} ↗`; map.href = `https://maps.gsi.go.jp/#17/${shelter.coordinates[1]}/${shelter.coordinates[0]}/&base=std`;
    const copyPlace = document.createElement('button'); copyPlace.type = 'button'; copyPlace.className = 'copy-place'; copyPlace.textContent = text().copyPlace; copyPlace.addEventListener('click', () => copyText([shelter.name, shelter.address].filter(Boolean).join('\n')));
    const route = document.createElement('a'); route.className = `route-link${isOnline() ? '' : ' unavailable'}`; route.target = '_blank'; route.rel = 'noopener'; route.textContent = isOnline() ? `${state.mobility ? text().routeMobility : text().route} →` : text().routeOffline; if (isOnline()) route.href = `https://www.google.com/maps/dir/?api=1&origin=${state.location.latitude},${state.location.longitude}&destination=${shelter.coordinates[1]},${shelter.coordinates[0]}&travelmode=walking`; else route.setAttribute('aria-disabled', 'true');
    actions.append(locateOnMap, map, copyPlace, route); item.append(top, actions); return item;
  }));
}

function focusShelter(index) {
  document.querySelectorAll('.shelter-option, .map-marker').forEach(element => element.classList.remove('active-choice'));
  const item = $(`#shelter-${index + 1}`);
  const marker = $$('.map-marker')[index];
  item?.classList.add('active-choice');
  marker?.classList.add('active-choice');
  item?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function focusMapMarker(index) {
  document.querySelectorAll('.shelter-option, .map-marker').forEach(element => element.classList.remove('active-choice'));
  const item = $(`#shelter-${index + 1}`);
  const marker = $$('.map-marker')[index];
  item?.classList.add('active-choice');
  marker?.classList.add('active-choice');
  $('#gsi-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  marker?.focus();
}

function redrawMap() {
  if (!state.location || !state.mapCenter) return;
  const layer = $('#map-layer');
  $('#map-error').hidden = true;
  renderBaseMap(layer, state.mapCenter, () => { $('#map-error').hidden = false; }, state.mapZoom);
  renderMarkers(layer, state.mapCenter, state.shelters, focusShelter, state.mapZoom);
  positionCurrentMarker(layer, state.mapCenter, state.location, state.mapZoom);
  updateHazardOverlay();
  updateZoomControls();
}

function updateZoomControls() {
  const zoomIn = $('#map-zoom-in');
  const zoomOut = $('#map-zoom-out');
  if (zoomIn) zoomIn.disabled = state.mapZoom >= 17;
  if (zoomOut) zoomOut.disabled = state.mapZoom <= 11;
}

function changeMapZoom(change) {
  const next = Math.max(11, Math.min(17, state.mapZoom + change));
  if (next === state.mapZoom) return;
  state.mapZoom = next;
  redrawMap();
}

function resetMapCenter() {
  if (!state.location) return;
  state.mapCenter = { ...state.location };
  redrawMap();
}

function enableMapPanning() {
  const map = $('#gsi-map');
  const layer = $('#map-layer');
  const reset = $('#map-reset');
  if (!map || !layer || !reset) return;
  let drag = null;
  let animationFrame = 0;
  const paintDrag = () => {
    animationFrame = 0;
    if (!drag) return;
    layer.style.transform = `translate3d(calc(-50% + ${drag.dx}px), calc(-50% + ${drag.dy}px), 0)`;
  };
  map.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button')) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0 };
    map.setPointerCapture(event.pointerId);
    map.classList.add('dragging');
  });
  map.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    event.preventDefault();
    drag.dx = event.clientX - drag.x;
    drag.dy = event.clientY - drag.y;
    if (!animationFrame) animationFrame = requestAnimationFrame(paintDrag);
  });
  const finish = event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    const moved = Math.abs(drag.dx) + Math.abs(drag.dy) > 3;
    if (moved && state.mapCenter) state.mapCenter = panMapCenter(state.mapCenter, drag.dx, drag.dy, state.mapZoom);
    drag = null;
    layer.style.transform = '';
    map.classList.remove('dragging');
    if (moved) redrawMap();
  };
  map.addEventListener('pointerup', finish);
  map.addEventListener('pointercancel', finish);
  map.addEventListener('keydown', event => {
    if (event.target !== map || !state.mapCenter) return;
    const delta = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] }[event.key];
    if (!delta) return;
    event.preventDefault();
    state.mapCenter = panMapCenter(state.mapCenter, delta[0], delta[1], state.mapZoom);
    redrawMap();
  });
  reset.addEventListener('click', resetMapCenter);
  $('#map-zoom-in')?.addEventListener('click', () => changeMapZoom(1));
  $('#map-zoom-out')?.addEventListener('click', () => changeMapZoom(-1));
  updateZoomControls();
}

async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) throw new Error('clipboard unavailable');
    }
    $('#copy-status').textContent = text().copied;
  } catch {
    $('#copy-status').textContent = text().copyFailed;
  }
}

function speakPage() {
  const button = $('#read-aloud');
  if (!('speechSynthesis' in window)) {
    $('#copy-status').textContent = text().speechUnavailable;
    return;
  }
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    button.setAttribute('aria-pressed', 'false');
    return;
  }
  const actions = text().checks?.[state.hazard] || [];
  const places = state.shelters.slice(0, 3).map((shelter, index) => `${index + 1}. ${shelter.name}. ${text().directions[shelter.direction]}. ${Math.round(shelter.distance * 1000)} ${text().meters}`);
  const utterance = new SpeechSynthesisUtterance([text().immediateTitle, ...actions, text().shelterTitle, ...places].join('。'));
  utterance.lang = state.language === 'zh' ? 'zh-CN' : state.language === 'ko' ? 'ko-KR' : state.language === 'en' ? 'en-US' : 'ja-JP';
  utterance.onend = () => button.setAttribute('aria-pressed', 'false');
  utterance.onerror = () => button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-pressed', 'true');
  speechSynthesis.speak(utterance);
}

function toggleView(button, className) {
  const enabled = !document.body.classList.contains(className);
  document.body.classList.toggle(className, enabled);
  document.documentElement.classList.toggle(className, enabled);
  button.setAttribute('aria-pressed', String(enabled));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function changeLocation() {
  $('#dashboard').hidden = true;
  $('#action-panel').hidden = true;
  $('#location-panel').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showResults() {
  $('#action-panel').hidden = true;
  $('#dashboard').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  $('#risk-title').focus?.();
}

function formatSavedTime(timestamp) {
  try { return new Intl.DateTimeFormat(state.language === 'zh' ? 'zh-CN' : state.language === 'en' ? 'en' : state.language === 'ko' ? 'ko-KR' : 'ja-JP', { dateStyle: 'short', timeStyle: 'short' }).format(timestamp); }
  catch { return new Date(timestamp).toLocaleString(); }
}

function showCachedData(timestamp) {
  const status = $('#cache-status');
  status.hidden = false;
  status.textContent = text().cachedData.replace('{time}', formatSavedTime(timestamp));
}

function hideCachedData() {
  $('#cache-status').hidden = true;
}

function updateConnectionStatus() {
  const status = $('#connection-status');
  status.className = `connection-status ${isOnline() ? 'online' : 'offline'}`;
  status.textContent = isOnline() ? text().online : text().offline;
}

function init() {
  const language = ['ja', 'en', 'zh', 'ko'].includes(navigator.language.slice(0, 2)) ? navigator.language.slice(0, 2) : 'ja';
  state.language = language; $('#language').value = language; setLanguage(language);
  registerServiceWorker();
  const savedLocation = loadLastLocation();
  $('#use-saved').hidden = !savedLocation;
  const gpsBlockedByPage = location.protocol === 'file:' || (!window.isSecureContext && location.hostname !== 'localhost');
  if (gpsBlockedByPage) {
    $('#location-mode-note').hidden = false;
    $('#location-fallback').open = true;
    $('#use-gps').setAttribute('aria-describedby', 'location-mode-note');
  }
  watchConnection(() => {
    updateConnectionStatus();
    if (state.shelters.length) renderShelters();
  });
  $$('.language-choice').forEach(button => button.addEventListener('click', () => enterApp(button.dataset.language)));
  $('#language').addEventListener('change', event => setLanguage(event.target.value));
  $('#use-gps').addEventListener('click', locate);
  $('#place-search-form').addEventListener('submit', findPlace);
  $('#use-manual').addEventListener('click', useManual);
  $('#use-sample').addEventListener('click', () => useLocation({ ...FALLBACK_LOCATION, accuracy: null, capturedAt: Date.now() }, 'sampleSource'));
  $('#use-saved').addEventListener('click', () => {
    const saved = loadLastLocation();
    if (saved?.location) useLocation(saved.location, 'savedSource');
  });
  $('#change-location').addEventListener('click', changeLocation);
  $('#action-change-location').addEventListener('click', changeLocation);
  $('#show-results').addEventListener('click', showResults);
  $$('input[name="overlay-layer"]').forEach(input => input.addEventListener('change', event => {
    if (event.target.checked) selectMapHazard(event.target.value);
  }));
  $('#mobility-mode').addEventListener('change', event => {
    state.mobility = event.target.checked;
    $('#mobility-warning').hidden = !state.mobility;
    renderShelters();
  });
  $('#read-aloud').addEventListener('click', speakPage);
  $('#large-text').addEventListener('click', event => toggleView(event.currentTarget, 'large-text-mode'));
  $('#high-contrast').addEventListener('click', event => toggleView(event.currentTarget, 'high-contrast-mode'));
  $('#copy-help').addEventListener('click', () => copyText(text().phrase));
  enableMapPanning();
}

startRubySupport();
init();
