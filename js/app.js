import { createMapFollower } from './map-follow.js?v=44-walk46';
import { initWalking } from './walking.js?v=44-walk46-practice21';
import { initTransit } from './transit.js?v=44-walk46';
import { ui, localizeInterface, startInterfaceLocalization } from './ui-language.js?v=44-walk46';
import { captureMapForPng, createMapPng, downloadPng } from './map-png.js?v=44-walk46';
import { readSavedViews, writeSavedView, removeSavedView, cacheSavedTiles, offlineAppReady } from './saved-views.js?v=44-walk46';
import { createContextLayers } from './context-layers.js?v=44-walk46';
import { getCurrentLocation, FALLBACK_LOCATION, formatCoordinate } from './location.js?v=44-walk46';
import { fitRouteEndpoints, renderRouteEndpoints, getShelters, renderBaseMap, renderHazardOverlay, renderMarkers, positionCurrentMarker, panMapCenter, gsiMapUrl } from './geo.js?v=44-walk46';
import { analyzeHazards, choosePriority } from './hazard.js?v=44-walk46';
import { getText, translate } from './i18n.js?v=44-walk46';
import { isOnline, loadData, loadLastLocation, registerServiceWorker, saveData, saveLastLocation, watchConnection } from './offline.js?v=44-walk46';
import { searchPlaces } from './search.js?v=44-walk46';
import { startRubySupport, removeJapaneseRuby } from './ruby.js?v=44-walk46';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let walking = null;
let state = { language: 'ja', location: null, mapCenter: null, mapZoom: 15, mapHazard: 0, source: '', placeName: '', hazard: 4, risks: [], shelters: [], mobility: false, overlayStatus: 'off' };
let purpose = 'shelter';
let searchTarget = 'origin';
let homeDestination = null;
let shelterPanelController;
let selectedShelterIndex = null;
let shelterMarkersEnabled = false;
let dataRevision = 0;
let overlayRevision = 0;
let contextLayers;
let searchController = null;
const text = () => getText(state.language);
const hazardIcons = { 1: 'flood.jpg', 2: 'landslide.jpg', 3: 'storm-surge.jpg', 4: 'evacuation-area-jis-hd.jpg', 5: 'tsunami-warning.jpg', 6: 'fire.jpg', 7: 'flood.jpg' };
const waterLegendColors = ['#f7f5a9', '#ffd8c0', '#ffb7b7', '#ff9191', '#f285c9', '#dc7adc'];
const landslideLegendColors = ['#fff33b', '#e60012'];
function setLanguage(language) {
  state.language = ['ja', 'en', 'zh', 'ko'].includes(language) ? language : 'ja';
  removeJapaneseRuby();
  translate(state.language);
  localizeInterface();
  syncHazardPicker();
  updateConnectionStatus();
  if ($('#origin-value')) updateHomeRoute();
  if (!$('#location-panel').hidden && document.body.classList.contains('workspace-open')) {
    $('#location-title').textContent = ui(searchTarget === 'destination' ? '目的地はどこですか？' : purpose === 'home' ? 'どこから出発しますか？' : 'どの場所の近くで探しますか？');
  }
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
  walking?.reset();
  selectedShelterIndex = null;
  dataRevision++;
  if ($('#saved-view-notice')) $('#saved-view-notice').hidden = true;
  const normalizedLocation = { ...location, capturedAt: location.capturedAt || Date.now() };
  state = { ...state, location: normalizedLocation, mapCenter: normalizedLocation, mapZoom: 15, mapHazard: 0, source, placeName, savedViewAt: null, hazard: 4, risks: [], shelters: [] };
  $('#location-panel').hidden = true;
  $('#dashboard').hidden = false;
  $('#action-panel').hidden = true;
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
  $('#map-layer .you-marker').hidden = false;
  positionCurrentMarker($('#map-layer'), normalizedLocation, normalizedLocation, state.mapZoom);
  contextLayers?.update(state.mapCenter, state.mapZoom);
  updateLinks();
  updateSelectedHazard();
  void checkRisks().catch(() => {}).finally(() => { $('#action-status').textContent = ''; });
  document.body.classList.add('has-location');
  updateHomeRoute();
  document.body.classList.remove('picking-location');
  if (purpose === 'home' && !homeDestination) openPlacePicker('destination');
  else $('#map-title').focus({ preventScroll: true });
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
    if (searchController !== controller) return;
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
      const copy = document.createElement('div');
      copy.append(name);
      if (place.description) {
        const detail = document.createElement('small');
        detail.dataset.noRuby = '';
        detail.className = 'search-result-detail';
        detail.textContent = place.description;
        copy.append(detail);
      }
      button.append(copy, hint);
      button.addEventListener('click', () => {
        if (searchTarget === 'destination') {
          homeDestination = place;
          $('#location-panel').hidden = true;
          document.body.classList.remove('picking-location');
          updateHomeRoute();
          $('#choose-home').focus();
        } else useLocation({ latitude: place.latitude, longitude: place.longitude, accuracy: null, capturedAt: Date.now() }, 'searchSource', place.name);
      });
      item.append(button);
      return item;
    }));
  } catch (error) {
    if (searchController === controller && error?.name !== 'AbortError') { status.textContent = text().searchFailed; fallback.hidden = false; }
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
  const requestRevision = dataRevision;
  $('#risk-status').textContent = text().riskLoading;
  $('#risk-cards').replaceChildren(makeLoadingCard());
  try {
    const cached = loadData('risks', state.location);
    if (!isOnline() && cached) {
      state.risks = cached.value;
      showCachedData(cached.savedAt);
    } else {
      const fresh = await analyzeHazards(state.location);
      if (requestRevision !== dataRevision) return;
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
    // Keep the overlay explicitly chosen by the user.
    $('#risk-status').textContent = text().riskReady;
    renderRisks();
    updateSelectedHazard();
    updateLinks();
    await loadShelters();
  } catch {
    if (requestRevision !== dataRevision) return;
    state.risks = [{ type: 4, status: 'always' }, { type: 6, status: 'realtime' }];
    state.hazard = 4;
    // A risk lookup failure does not change the chosen overlay.
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
  syncHazardPicker();
  if (!state.mapCenter && !state.location) return;
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

function syncHazardPicker() {
  if (!$('#hazard-picker')) return;
  $$('[data-map-hazard]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.mapHazard) === state.mapHazard)));
  $('#clear-hazard').hidden = state.mapHazard === 0;
  if ($('#hazard-layer-info')) $('#hazard-layer-info').hidden = state.mapHazard === 0;
  const description = $('#hazard-description');
  description.hidden = state.mapHazard === 0;
  const japanese = {
    1: ui('洪水：川の水があふれたときに、水につかる想定範囲です。'),
    2: ui('土砂災害：がけ崩れや土石流などに注意が必要な区域です。'),
    5: ui('津波：津波で水につかる想定範囲です。'),
    7: ui('内水氾濫：大雨で下水や水路から水があふれ、水につかる想定範囲です。'),
    3: ui('高潮：台風などで海面が高くなり、水につかる想定範囲です。')
  };
  const keys = {1:'floodDesc',2:'landslideDesc',5:'tsunamiDesc',7:'inlandFloodDesc',3:'highTideDesc'};
  description.textContent = state.language === 'ja' ? (japanese[state.mapHazard] || '') : (text()[keys[state.mapHazard]] || '');
  $('#other-hazards').classList.toggle('has-selection', [3,7].includes(state.mapHazard));
}
function selectMapHazard(value) {
  const type = Number(value);
  state.mapHazard = [1, 2, 3, 5, 7].includes(type) ? type : 0;
  updateHazardOverlay();
  if (state.location) updateLinks();
}

function updateLinks() {
  const { latitude, longitude } = state.location;
  $('#gsi-link').href = gsiMapUrl(state.location, state.hazard);
  const showLandslide = state.mapHazard === 2;
  $('#hazard-link').href = `https://disaportal.gsi.go.jp/maps/index.html?base=pale&ll=${latitude},${longitude}&z=15${showLandslide ? '&layerset=dosya' : ''}`;
}

async function loadShelters() {
  const requestRevision = dataRevision;
  selectedShelterIndex = null;
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
      if (requestRevision !== dataRevision) return;
      if (fresh.length) {
        results = fresh;
        saveData('shelters', state.location, fresh, hazard);
      } else if (cached) {
        results = cached.value;
        showCachedData(cached.savedAt);
      } else results = fresh;
    }
    if (hazard !== state.hazard || requestRevision !== dataRevision) return;
    state.shelters = results.slice(0, 6);
    renderShelterMarkers($('#map-layer'), state.mapCenter || state.location, state.shelters, focusShelter, state.mapZoom);
    positionCurrentMarker($('#map-layer'), state.mapCenter || state.location, state.location, state.mapZoom);
    renderJourneyMarkers();
    renderShelters();
    $('#data-status').textContent = state.shelters.length ? text().loaded.replace('{count}', state.shelters.length) : text().noData;
  } catch {
    if (hazard !== state.hazard || requestRevision !== dataRevision) return;
    state.shelters = [];
    renderJourneyMarkers();
    renderShelters();
    $('#data-status').textContent = text().failed;
  }
}

function renderShelters() {
  if ($('#shelter-count')) $('#shelter-count').textContent = state.location ? String(state.shelters.length) : '';
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
    const top = document.createElement('span');
    top.className = 'shelter-top';
    const number = document.createElement('span');
    number.className = 'shelter-num'; number.textContent = index + 1;
    const info = document.createElement('span');
    const name = document.createElement('b'); name.className = 'shelter-name'; name.dataset.noRuby = ''; name.innerHTML = `<img class="shelter-icon" src="assets/pictograms/evacuation-area-jis-hd.jpg" width="150" height="150" alt="">${escapeHtml(shelter.name)}`;
    const opening = document.createElement('strong'); opening.className = 'opening-unknown'; opening.textContent = text().openingUnknown;
    const meta = document.createElement('span'); meta.className = 'shelter-distance';
    const distance = shelter.distance < 1 ? `${Math.round(shelter.distance * 1000)} m` : `${shelter.distance.toFixed(1)} km`;
    meta.textContent = `${text().directions[shelter.direction]} · ${distance}`;
    info.append(name, opening, meta); top.append(number, info);
    const actions = document.createElement('div'); actions.className = 'shelter-actions';
    const locateOnMap = document.createElement('button'); locateOnMap.type = 'button'; locateOnMap.className = 'show-on-map'; locateOnMap.textContent = text().showOnMap; locateOnMap.addEventListener('click', () => focusMapMarker(index));
    const map = document.createElement('a'); map.target = '_blank'; map.rel = 'noopener'; map.textContent = `${text().details} ↗`; map.href = `https://maps.gsi.go.jp/#17/${shelter.coordinates[1]}/${shelter.coordinates[0]}/&base=std`;
    const copyPlace = document.createElement('button'); copyPlace.type = 'button'; copyPlace.className = 'copy-place'; copyPlace.textContent = text().copyPlace; copyPlace.addEventListener('click', () => copyText([shelter.name, shelter.address].filter(Boolean).join('\n')));
    const route = document.createElement('a'); route.className = `route-link${isOnline() ? '' : ' unavailable'}`; route.target = '_blank'; route.rel = 'noopener'; route.textContent = isOnline() ? `${state.mobility ? text().routeMobility : text().route} →` : text().routeOffline; if (isOnline()) route.href = `https://www.google.com/maps/dir/?api=1&origin=${state.location.latitude},${state.location.longitude}&destination=${shelter.coordinates[1]},${shelter.coordinates[0]}&travelmode=walking`; else route.setAttribute('aria-disabled', 'true');
    const streetView = document.createElement('a');
    streetView.className = 'streetview-link';
    streetView.target = '_blank';
    streetView.rel = 'noopener noreferrer';
    streetView.textContent = `${text().streetView} ↗`;
    streetView.setAttribute('aria-label', `${shelter.name}：${text().streetView}`);
    streetView.setAttribute('aria-describedby', 'streetview-note');
    if (isOnline()) {
      const url = new URL('https://www.google.com/maps/@');
      url.searchParams.set('api', '1');
      url.searchParams.set('map_action', 'pano');
      url.searchParams.set('viewpoint', `${shelter.coordinates[1]},${shelter.coordinates[0]}`);
      streetView.href = url.toString();
    } else {
      streetView.setAttribute('aria-disabled', 'true');
      streetView.textContent = text().streetViewOffline;
    }
    actions.append(locateOnMap, route, streetView, map, copyPlace);
    const details = document.createElement('details');
    details.className = 'shelter-row-details';
    const summary = document.createElement('summary');
    summary.append(top);
    summary.addEventListener('click', event => { if (selectedShelterIndex === index) event.preventDefault(); });
    summary.setAttribute('aria-label', `${index + 1}. ${shelter.name} ${distance}：経路・詳しい情報`);
    const address = document.createElement('p');
    address.dataset.noRuby = '';
    address.textContent = shelter.address;
    details.append(summary, address, actions);
    item.append(details);
    return item;
  }));
  applyShelterSelection();
}

function applyShelterSelection() {
  $$('#shelter-list .shelter-option').forEach((item, index) => {
    item.hidden = selectedShelterIndex !== null && index !== selectedShelterIndex;
    item.classList.toggle('active-choice', index === selectedShelterIndex);
    const details = item.querySelector('details');
    if (details) details.open = index === selectedShelterIndex;
  });
  $$('.map-marker').forEach((marker, index) => marker.classList.toggle('active-choice', index === selectedShelterIndex));
  $('#shelter-panel')?.classList.toggle('single-shelter', selectedShelterIndex !== null);
  $('#shelter-dock')?.classList.toggle('showing-one', selectedShelterIndex !== null);
}

function focusShelter(index) {
  if (!state.shelters[index]) return;
  selectedShelterIndex = index;
  shelterPanelController?.open();
  applyShelterSelection();
  $('#shelter-list').scrollTop = 0;
}

function focusMapMarker(index) {
  const shelter = state.shelters[index];
  if (!shelter) return;
  state.mapCenter = {latitude:shelter.coordinates[1], longitude:shelter.coordinates[0]};
  state.mapZoom = Math.max(15, state.mapZoom);
  redrawMap();
  $$('.shelter-option, .map-marker').forEach(element => element.classList.remove('active-choice'));
  $(`#shelter-${index + 1}`)?.classList.add('active-choice');
  const marker = $$('.map-marker')[index];
  marker?.classList.add('active-choice');
  if (window.innerWidth <= 760) shelterPanelController?.close();
  marker?.focus({preventScroll:true});
}

function renderShelterMarkers(root, center, shelters, onSelect, zoom) {
  renderMarkers(root, center, shelterMarkersEnabled ? shelters : [], onSelect, zoom);
  $('#shelter-menu-trigger')?.setAttribute('aria-pressed', String(shelterMarkersEnabled));
}

function redrawMap() {
  if (!state.location || !state.mapCenter) return;
  const layer = $('#map-layer');
  $('#map-error').hidden = true;
  renderBaseMap(layer, state.mapCenter, () => { $('#map-error').hidden = false; }, state.mapZoom);
  renderShelterMarkers(layer, state.mapCenter, state.shelters, focusShelter, state.mapZoom);
  positionCurrentMarker(layer, state.mapCenter, state.location, state.mapZoom);
  renderJourneyMarkers();
  applyShelterSelection();
  updateHazardOverlay();
  updateZoomControls();
  contextLayers?.update(state.mapCenter, state.mapZoom);
  walking?.render();
}

function updateZoomControls() {
  const zoomIn = $('#map-zoom-in');
  const zoomOut = $('#map-zoom-out');
  if (zoomIn) zoomIn.disabled = state.mapZoom >= 17;
  if (zoomOut) zoomOut.disabled = state.mapZoom <= 3;
}

function changeMapZoom(change) {
  const next = Math.max(3, Math.min(17, state.mapZoom + change));
  if (next === state.mapZoom) return;
  state.mapZoom = next;
  redrawMap();
}

function resetMapCenter() {
  if (!state.location) return;
  if (purpose === 'home' && homeDestination) { fitJourney(); return; }
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
    if (event.pointerType === 'touch' || event.button !== 0 || event.target.closest('button, .map-control-panel')) return;
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
  map.classList.add('interactive');
  const expand = $('#map-expand');
  const labels = {
    ja: ['地図を操作', '操作を終了', '地図を全画面で見る', '全画面を終了'],
    en: ['Interact with map', 'Done', 'Full-screen map', 'Exit full screen'],
    zh: ['操作地图', '结束操作', '全屏查看地图', '退出全屏'],
    ko: ['지도 조작', '조작 종료', '전체 화면 지도', '전체 화면 종료']
  };
  function refreshMapLabels() {
    const words = labels[state.language] || labels.ja;
    expand.textContent = words[map.classList.contains('expanded') ? 3 : 2];
    $('#map-touch-hint').textContent = ({ja:'指で地図を動かせます。2本指を広げると拡大、つまむと縮小できます。',en:'Drag to move the map. Pinch with two fingers to zoom.',zh:'拖动地图，双指张开放大、合拢缩小。',ko:'지도를 드래그하고 두 손가락으로 확대·축소합니다.'})[state.language];
  }
  const closeFullscreen = $('#map-fullscreen-close');
  let previousInteraction = false;
  function setFullscreen(enabled) {
    if (enabled === map.classList.contains('expanded')) return;
    if (enabled) previousInteraction = map.classList.contains('interactive');
    map.classList.toggle('expanded', enabled);
    map.closest('.walking-workspace')?.classList.toggle('walking-fullscreen', enabled);
    document.body.classList.toggle('map-fullscreen-open', enabled);
    map.classList.toggle('interactive', enabled || previousInteraction);
    expand.setAttribute('aria-expanded', String(enabled));
    closeFullscreen.hidden = !enabled;
    const labels = {ja:ui('✕ 地図を閉じる'),en:'✕ Close map',zh:'✕ 关闭地图',ko:'✕ 지도 닫기'};
    closeFullscreen.textContent = labels[state.language] || labels.ja;
    refreshMapLabels();
    if (enabled) {
      const dialog = map.closest('.walking-workspace') || map;
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      closeFullscreen.focus();
    } else {
      const dialog = map.closest('.walking-workspace') || map;
      dialog.removeAttribute('role');
      dialog.removeAttribute('aria-modal');
      expand.focus({preventScroll:true});
    }
  }
  expand.addEventListener('click', () => setFullscreen(!map.classList.contains('expanded')));
  closeFullscreen.addEventListener('click', () => setFullscreen(false));
  document.addEventListener('context-detail-open', () => setFullscreen(false));
  document.addEventListener('keydown', event => {
    if (!map.classList.contains('expanded')) return;
    if (event.key === 'Escape') { event.preventDefault(); setFullscreen(false); }
    if (event.key === 'Tab') {
      const dialog = map.closest('.walking-workspace') || map;
      const controls = [...dialog.querySelectorAll('button:not([hidden]):not(:disabled),select,summary')].filter(el=>el.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === map)) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
    }
  });
  $('#language').addEventListener('change', refreshMapLabels);
  $$('.language-choice').forEach(button => button.addEventListener('click', refreshMapLabels));
  refreshMapLabels();
  let gesture = null;
  const sample = touches => ({
    x: [...touches].reduce((n,t) => n+t.clientX,0)/touches.length,
    y: [...touches].reduce((n,t) => n+t.clientY,0)/touches.length,
    distance: touches.length > 1 ? Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY) : 0,
    count: touches.length
  });
  let pinch = null;
  map.addEventListener('touchstart', event => {
    if (event.target.closest('.map-control-panel')) { gesture = null; pinch = null; return; }
    if (event.touches.length < 2 && (!map.classList.contains('interactive') || event.target.closest('button'))) return;
    if (event.touches.length >= 2 && event.cancelable) event.preventDefault();
    gesture = sample(event.touches);
    pinch = gesture.distance ? { distance: gesture.distance, zoom: state.mapZoom } : null;
  }, {passive:false});
  map.addEventListener('touchmove', event => {
    if (!gesture || !state.mapCenter) return;
    if (event.touches.length < 2 && !map.classList.contains('interactive')) return;
    if (event.cancelable) event.preventDefault();
    const next = sample(event.touches);
    if (next.count !== gesture.count) {
      gesture = next;
      pinch = next.distance ? {distance: next.distance, zoom: state.mapZoom} : null;
      return;
    }
    state.mapCenter = panMapCenter(state.mapCenter, next.x-gesture.x, next.y-gesture.y, state.mapZoom);
    if (next.distance > 0 && pinch?.distance > 0) {
      state.mapZoom = Math.max(3, Math.min(17, pinch.zoom + Math.round(Math.log2(next.distance / pinch.distance))));
    }
    gesture = next;
    redrawMap();
  }, {passive:false});
  map.addEventListener('touchend', event => {
    gesture = event.touches.length && map.classList.contains('interactive') ? sample(event.touches) : null;
    pinch = null;
  });
  map.addEventListener('touchcancel', () => { gesture = null; pinch = null; });
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
  const activePanel = ['#language-gate', '#location-panel', '#action-panel'].map(selector => $(selector)).find(panel => !panel.hidden);
  const spokenText = activePanel ? activePanel.innerText : [text().immediateTitle, ...actions, text().shelterTitle, ...places].join('。');
  const utterance = new SpeechSynthesisUtterance(spokenText);
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

function setJourneyCollapsed(collapsed) {
  document.body.classList.toggle('journey-collapsed',collapsed);
  const toggle = $('#toggle-journey-fields');
  if(toggle){toggle.setAttribute('aria-expanded',String(!collapsed));toggle.textContent=ui(collapsed?'場所の設定を表示':'設定欄を隠す');}
  if(collapsed){
    searchController?.abort();searchController=null;
    $('#place-search-button').disabled=false;
    $('#location-panel').hidden=true;
    document.body.classList.remove('picking-location');
    $('#choose-origin')?.setAttribute('aria-expanded','false');
    $('#choose-home').setAttribute('aria-expanded','false');
  }
}

function openPlacePicker(target = 'origin') {
  setJourneyCollapsed(false);
  shelterPanelController?.close();
  searchController?.abort();
  searchController = null;
  $('#place-search-button').disabled = false;
  searchTarget = target;
  $('#choose-origin')?.setAttribute('aria-expanded', String(target === 'origin'));
  $('#choose-home').setAttribute('aria-expanded', String(target === 'destination'));
  {
    $('#use-gps b').removeAttribute('data-i18n-html');
    $('#use-gps b').textContent = ui('現在地を使う');
    $('#place-search-form > label').removeAttribute('data-i18n-html');
    $('#place-search-form > label').textContent = ui('住所・駅名で探す');
  }
  $('#location-panel').hidden = false;
  document.body.classList.add('picking-location');
  $('#place-search-results').replaceChildren();
  $('#place-search-status').textContent = '';
  $('#place-query').value = '';
  $('#location-title').removeAttribute('data-i18n-html');
  $('#location-title').textContent = target === 'destination' ? ui('目的地はどこですか？') : purpose === 'home' ? ui('どこから出発しますか？') : ui('どの場所の近くで探しますか？');
  $('#use-gps').hidden = target === 'destination';
  $('#location-fallback').hidden = target === 'destination';
  $('#location-mode-note').hidden = target === 'destination' || !(location.protocol === 'file:' || (!window.isSecureContext && location.hostname !== 'localhost')); 
  $('#place-query').setAttribute('aria-label', target === 'destination' ? ui('目的地の住所・駅名を検索') : ui('出発地の住所・駅名を検索'));
  $('#place-query').placeholder = target === 'destination' ? ui('目的地の住所・駅名') : ui('出発地の住所・駅名');
  $('#location-panel').dataset.target = target;
  $('#location-title').focus({ preventScroll: true });
}
function renderJourneyMarkers() {
  walking?.render();
  const root = $('#map-layer');
  const origin = state.location ? {...state.location, name: state.placeName || text()[state.source]} : null;
  root.querySelector('.you-marker').hidden = purpose === 'home' || !origin;
  root.querySelector('.you-marker').textContent = state.savedViewAt ? ui('保存地点') : text().you;
  renderRouteEndpoints(root, state.mapCenter, purpose === 'home' ? origin : null, purpose === 'home' ? homeDestination : null, state.mapZoom);
}
function fitJourney() {
  if (!state.location || !homeDestination || purpose !== 'home') { renderJourneyMarkers(); return; }
  const bounds = $('#gsi-map').getBoundingClientRect();
  const controls = $('#map-control-group')?.getBoundingClientRect();
  const bottomSpace = controls ? controls.height + 24 : 0;
  const fit = fitRouteEndpoints(state.location, homeDestination, bounds.width, Math.max(100, bounds.height - bottomSpace));
  state.mapCenter = panMapCenter(fit.center, 0, -bottomSpace / 2, fit.zoom);
  state.mapZoom = fit.zoom;
  redrawMap();
}
function updateHomeRoute() {
  const originValue = $('#origin-value');
  if (originValue) {
    originValue.toggleAttribute('data-no-ruby', Boolean(state.placeName));
    originValue.textContent = state.location ? (state.placeName || text()[state.source] || ui('選択した場所')) : ui('現在地・住所・駅名から選ぶ');
    $('#origin-label').textContent = purpose === 'home' ? ui('出発地') : ui('探す場所');
  }
  $('#choose-origin')?.setAttribute('aria-expanded', String(!$('#location-panel').hidden && searchTarget === 'origin'));
  $('#choose-home').setAttribute('aria-expanded', String(!$('#location-panel').hidden && searchTarget === 'destination'));
  const link = $('#home-route');
  link.hidden = purpose !== 'home' || !homeDestination || !state.location;
  if (!link.hidden) {
    const params = new URLSearchParams({api:'1', origin:`${state.location.latitude},${state.location.longitude}`, destination:`${homeDestination.latitude},${homeDestination.longitude}`, travelmode:'walking'});
    link.href = `https://www.google.com/maps/dir/?${params}`;
  }
  fitJourney();
  const destinationButton = $('#choose-home');
  const destinationLabel = document.createElement('span');
  destinationLabel.className = 'destination-label';
  destinationLabel.textContent = ui('目的地');
  const destinationName = document.createElement('span');
  destinationName.className = 'destination-name';
  if(homeDestination)destinationName.dataset.noRuby = '';
  if(homeDestination)destinationName.dataset.publicName = '';
  destinationName.textContent = homeDestination ? homeDestination.name : ui('目的地を選ぶ');
  const destinationAction = document.createElement('span');
  destinationAction.className = 'destination-action';
  destinationAction.textContent = homeDestination ? ui('変更') : ui('選択');
  destinationButton.replaceChildren(destinationLabel, destinationName, destinationAction);
  destinationButton.setAttribute('aria-label', homeDestination ? `目的地：${homeDestination.name}を変更` : ui('目的地を選ぶ'));
}
function changeLocation() { openPlacePicker('origin'); }
function openWorkspace(mode) {
  document.body.classList.add('workspace-open');
  purpose = mode;
  shelterMarkersEnabled = mode === 'shelter';
  selectedShelterIndex = null;
  if (state.location && state.mapCenter) redrawMap();
  shelterPanelController?.close();
  document.body.classList.toggle('route-mode', mode === 'home');
  $('#language-gate').hidden = true;
  $('#workspace-toolbar').hidden = false;
  $('#dashboard').hidden = false;
  $('#purpose-label').textContent = mode === 'home' ? ui('目的地への経路') : ui('近くの避難場所');
  $('#choose-home').hidden = mode !== 'home';
  updateHomeRoute();
  if (!state.mapCenter) {
    state.mapCenter = FALLBACK_LOCATION;
    renderBaseMap($('#map-layer'), state.mapCenter, () => { $('#map-error').hidden = false; }, state.mapZoom);
    $('#map-layer .you-marker').hidden = true;
  }
  openPlacePicker('origin');
  requestAnimationFrame(() => window.scrollTo({top:0,behavior:'instant'}));
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

function restoreSavedView(saved) {
  walking?.reset();
  dataRevision++;
  searchController?.abort();
  purpose = saved.purpose === 'home' ? 'home' : 'shelter';
  homeDestination = saved.homeDestination ? structuredClone(saved.homeDestination) : null;
  state = {...state, ...structuredClone(saved.state), language:state.language, savedViewAt:saved.state.savedViewAt || saved.savedAt};
  shelterMarkersEnabled = Boolean(saved.shelterMarkersEnabled);
  selectedShelterIndex = null;
  shelterPanelController?.close();
  document.body.classList.add('workspace-open','has-location');
  document.body.classList.remove('picking-location');
  document.body.classList.toggle('route-mode', purpose === 'home');
  $('#language-gate').hidden = true;
  $('#workspace-toolbar').hidden = false;
  $('#dashboard').hidden = false;
  $('#location-panel').hidden = true;
  $('#action-panel').hidden = true;
  $('#purpose-label').textContent = purpose === 'home' ? ui('目的地への経路') : ui('近くの避難場所');
  $('#choose-home').hidden = purpose !== 'home';
  $('#coordinate-label').textContent = `${formatCoordinate(state.location.latitude)}, ${formatCoordinate(state.location.longitude)}`;
  $('#location-source').textContent = state.placeName || text()[state.source] || ui('保存した場所');
  $('#mobility-mode').checked = Boolean(state.mobility);
  $('#mobility-warning').hidden = !state.mobility;
  ['history','lore','underpass'].forEach(name => { $(`#show-${name}`).checked = false; });
  const savedCenter = {...state.mapCenter}, savedZoom = state.mapZoom;
  setLanguage(state.language);
  updateHomeRoute();
  state.mapCenter = savedCenter;
  state.mapZoom = savedZoom;
  renderShelters();
  redrawMap();
  updateLinks();
  const notice = $('#saved-view-notice');
  notice.hidden = false;
  notice.textContent = `保存した表示：${saved.name}（情報の保存：${formatSavedTime(state.savedViewAt)}）。現在地・開設状況・道路状況の最新情報ではありません。`;
  $('#saved-views-menu').open = false;
  window.scrollTo({top:0,behavior:'instant'});
}
function initSavedViews() {
  const menu = document.createElement('details');
  menu.id = 'saved-views-menu';
  menu.className = 'header-popover';
  const summary = document.createElement('summary');
  summary.textContent = ui('保存した場所');
  const list = document.createElement('div');
  list.id = 'saved-views-list';
  list.className = 'header-popover-body';
  menu.append(summary,list);
  $('#header-information').append(menu);
  const refreshSavedViews = () => {
    const views = readSavedViews();
    list.replaceChildren();
    const note = document.createElement('p');
    note.textContent = ui('この端末・ブラウザに保存した場所です。オフラインでも保存時の情報を開けます。');
    list.append(note);
    if (!views.length) {
      const empty = document.createElement('p'); empty.textContent = ui('まだ保存がありません。場所を選んで「この表示を保存」を押してください。'); list.append(empty);
    }
    views.forEach(saved => {
      const row = document.createElement('div'); row.className = 'saved-view-row';
      const open = document.createElement('button'); open.type = 'button'; open.className = 'open-saved-view';
      const name = document.createElement('b'); name.textContent = saved.name; name.dataset.noRuby = '';
      const time = document.createElement('small'); time.textContent = `${formatSavedTime(saved.savedAt)} ／ 地図 ${saved.mapCache?.saved || 0}枚`;
      open.append(name,time); open.addEventListener('click', () => restoreSavedView(saved));
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-saved-view'; remove.textContent = ui('削除');
      remove.setAttribute('aria-label', `${saved.name}の保存を削除`);
      remove.addEventListener('click', () => { try { removeSavedView(saved.id); refreshSavedViews(); } catch { note.textContent = ui('保存を削除できませんでした。'); } });
      row.append(open,remove); list.append(row);
    });
  };
  menu.addEventListener('toggle', () => { if (menu.open) { refreshSavedViews(); $('#header-information .assist-menu').open = false; } });
  menu.addEventListener('keydown', event => { if (event.key === 'Escape') {menu.open=false; summary.focus({preventScroll:true});} });
  document.addEventListener('pointerdown', event => { if (!menu.contains(event.target)) menu.open = false; });
  const saveButton = document.createElement('button'); saveButton.type = 'button'; saveButton.id = 'save-current-view'; saveButton.textContent = ui('この表示を保存');
  $('#home-route').after(saveButton);
  const notice = document.createElement('p'); notice.id = 'saved-view-notice'; notice.hidden = true; notice.setAttribute('role','status'); $('#workspace-toolbar').append(notice);
  const dialog = document.createElement('dialog'); dialog.id = 'save-view-dialog'; dialog.setAttribute('aria-labelledby','save-view-title');
  const form = document.createElement('form');
  const title = document.createElement('h2'); title.id = 'save-view-title'; title.textContent = ui('場所と地図を保存');
  const label = document.createElement('label'); label.htmlFor = 'saved-view-name'; label.textContent = ui('保存する名前');
  const input = document.createElement('input'); input.id = 'saved-view-name'; input.required = true; input.maxLength = 80; input.autocomplete = 'off';
  const explanation = document.createElement('p'); explanation.textContent = ui('出発地・目的地、取得済みの情報と地図を保存し、PNG画像も自動ダウンロードします。自宅などの位置はこの端末に残ります。');
  const limit = document.createElement('p'); limit.className = 'save-view-note'; limit.textContent = ui('未取得の地図、場所の新規検索、Google マップの経路案内には通信が必要です。ブラウザのデータを消すと保存も失われます。');
  const status = document.createElement('p'); status.id = 'save-view-status'; status.setAttribute('role','status');
  const actions = document.createElement('div'); actions.className = 'save-view-actions';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = ui('閉じる'); cancel.addEventListener('click', () => dialog.close());
  const confirm = document.createElement('button'); confirm.type = 'submit'; confirm.textContent = ui('保存する');
  const retryPng = document.createElement('button'); retryPng.type='button'; retryPng.id='retry-map-png'; retryPng.textContent=ui('PNGを保存'); retryPng.hidden=true;
  let preparedPng = null;
  retryPng.addEventListener('click',()=>{if(preparedPng)downloadPng(preparedPng.blob,input.value.trim()||'いまここ減災ナビ');});
  actions.append(retryPng,cancel,confirm); form.append(title,label,input,explanation,limit,status,actions); dialog.append(form); document.body.append(dialog);
  saveButton.addEventListener('click', () => {
    if (!state.location) { notice.hidden=false; notice.textContent=ui('先に出発地や調べたい場所を選んでください。'); return; }
    input.value = homeDestination && purpose === 'home' ? `${state.placeName || ui('出発地')} → ${homeDestination.name}` : ui(`${state.placeName || ui('選択した場所')}の周辺`);
    status.textContent = ''; retryPng.hidden=true; preparedPng=null; confirm.disabled = false; confirm.textContent = ui('保存する'); dialog.showModal();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!input.value.trim()) {input.setCustomValidity(ui('保存する名前を入力してください。'));input.reportValidity();return;}
    input.setCustomValidity('');
    confirm.disabled=true; cancel.disabled=true; status.textContent=ui('地図と表示を保存しています…');
    const saved = {version:1,id:crypto.randomUUID(),name:input.value.trim(),savedAt:Date.now(),purpose,homeDestination:homeDestination ? structuredClone(homeDestination) : null,state:structuredClone(state),shelterMarkersEnabled};
    const pngSnapshot = captureMapForPng($('#gsi-map'), saved);
    const urls = [...document.querySelectorAll('#map-layer img.map-tile,#map-layer .hazard-export-tile')].map(tile=>tile.src||tile.dataset.src);
    try {
      saved.mapCache = await cacheSavedTiles(urls);
      saved.offlineReady = await offlineAppReady();
      writeSavedView(saved);
      const ready = saved.offlineReady ? ui('オフラインでこのページを開けます。') : ui('アプリのオフライン準備が未完了です。HTTPSまたはlocalhostでオンラインのまま一度開き直してください。');
      status.textContent = `保存しました。地図 ${saved.mapCache.saved}/${saved.mapCache.total}枚。${ready}「保存した場所」から呼び出せます。`;
      if (saved.mapCache.saved < saved.mapCache.total) status.textContent += ui(' 一部の地図は未保存です。');
      const saveMessage = status.textContent;
      status.textContent = `${saveMessage} PNG画像を作成しています…`;
      try {
        preparedPng = await createMapPng(pngSnapshot);
        downloadPng(preparedPng.blob,saved.name);
        retryPng.hidden=false;
        status.textContent = `${saveMessage} PNG画像のダウンロードを開始しました。${preparedPng.missing ? `画像に取り込めなかった地図が${preparedPng.missing}枚あります。` : ''}保存されない場合は「PNGを保存」を押してください。`;
      } catch(error) {
        status.textContent = `${saveMessage} PNG画像は作成できませんでした：${error.message}通信できる状態で再度保存してください。`;
      }
      confirm.textContent = ui('保存済み'); refreshSavedViews();
    } catch (error) { status.textContent=error?.message || ui('保存できませんでした。空き容量とブラウザの設定を確認してください。'); confirm.disabled=false; }
    finally {cancel.disabled=false;}
  });
  input.addEventListener('input',()=>input.setCustomValidity(''));
  refreshSavedViews();
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
  $('#action-change-location').addEventListener('click', changeLocation);
  $('#show-results').addEventListener('click', showResults);
  $$('[data-map-hazard]').forEach(button => button.addEventListener('click', () => selectMapHazard(button.dataset.mapHazard)));
  $('#clear-hazard').addEventListener('click', () => {
    selectMapHazard(0);
    $('[data-map-hazard="1"]').focus({preventScroll:true});
  });
  $('#mobility-mode').addEventListener('change', event => {
    state.mobility = event.target.checked;
    $('#mobility-warning').hidden = !state.mobility;
    renderShelters();
  });
  $('#read-aloud').addEventListener('click', speakPage);
  $('#large-text').addEventListener('click', event => toggleView(event.currentTarget, 'large-text-mode'));
  $('#high-contrast').addEventListener('click', event => toggleView(event.currentTarget, 'high-contrast-mode'));
  $('#copy-help').addEventListener('click', () => copyText(text().phrase));
  contextLayers = createContextLayers();
  enableMapPanning();
  document.querySelector('footer').append($('.assist-menu'));
  const journeyFields = document.createElement('div');
  journeyFields.id = 'journey-fields';
  const originButton = document.createElement('button');
  originButton.type = 'button';
  originButton.id = 'choose-origin';
  originButton.setAttribute('aria-controls', 'location-panel');
  originButton.setAttribute('aria-expanded', 'false');
  const originLabel = document.createElement('span');
  originLabel.id = 'origin-label';
  originLabel.className = 'destination-label';
  originLabel.textContent = ui('出発地');
  const originValue = document.createElement('span');
  originValue.id = 'origin-value';
  originValue.className = 'destination-name';
  originValue.dataset.noRuby = '';
  originValue.textContent = ui('現在地・住所・駅名から選ぶ');
  originButton.append(originLabel, originValue);
  originButton.addEventListener('click', () => openPlacePicker('origin'));
  const arrow = document.createElement('span');
  arrow.id = 'journey-arrow';
  arrow.textContent = '→';
  arrow.setAttribute('aria-hidden', 'true');
  $('#purpose-label').after(journeyFields);
  journeyFields.append(originButton, arrow, $('#choose-home'));
  $('#choose-home').setAttribute('aria-controls', 'location-panel');
  $('#workspace-toolbar').append($('#location-panel'));
  const fieldsToggle = document.createElement('button');
  fieldsToggle.id = 'toggle-journey-fields';
  fieldsToggle.type = 'button';
  fieldsToggle.textContent = ui('設定欄を隠す');
  fieldsToggle.setAttribute('aria-expanded','true');
  fieldsToggle.setAttribute('aria-controls','journey-fields location-panel');
  $('#choose-purpose').after(fieldsToggle);
  fieldsToggle.addEventListener('click',()=>setJourneyCollapsed(!document.body.classList.contains('journey-collapsed')));

  const closePicker = document.createElement('button');
  closePicker.id = 'close-place-picker';
  closePicker.type = 'button';
  closePicker.textContent = ui('閉じる');
  closePicker.addEventListener('click', () => {
    $('#location-panel').hidden = true;
    document.body.classList.remove('picking-location');
    $('#choose-origin').setAttribute('aria-expanded', 'false');
    $('#choose-home').setAttribute('aria-expanded', 'false');
    (searchTarget === 'destination' ? $('#choose-home') : $('#choose-origin')).focus({preventScroll:true});
  });
  $('#location-panel').append(closePicker);
  const sizeWorkspaceMap = () => {
    if (!document.body.classList.contains('workspace-open')) return;
    const walkingHeight = ($('#walking-panel')?.getBoundingClientRect().height || 0) + ($('.walking-workspace > .walk-toggle-bar')?.getBoundingClientRect().height || 0);
    const available = (window.visualViewport?.height || window.innerHeight) - document.querySelector('header').getBoundingClientRect().height - $('#workspace-toolbar').getBoundingClientRect().height - document.querySelector('footer').getBoundingClientRect().height - 32 - walkingHeight - ($('#walking-panel')?.hidden ? 8 : 16);
    $('#gsi-map').style.setProperty('--workspace-map-height', `${Math.max(300, available)}px`);
  };
  new ResizeObserver(sizeWorkspaceMap).observe($('#workspace-toolbar'));
  new ResizeObserver(sizeWorkspaceMap).observe(document.querySelector('header'));
  new ResizeObserver(sizeWorkspaceMap).observe(document.querySelector('footer'));
  window.addEventListener('resize', sizeWorkspaceMap);
  document.addEventListener('walking-panel-resize', sizeWorkspaceMap);
  window.visualViewport?.addEventListener('resize',sizeWorkspaceMap);
  const viewControls = document.createElement('section');
  viewControls.id = 'map-view-controls';
  viewControls.className = 'map-control-panel';
  viewControls.setAttribute('aria-label', ui('地図の表示'));
  $('#gsi-map').append(viewControls);
  const compass = document.createElement('div');
  compass.id = 'map-compass';
  compass.setAttribute('role','img');
  compass.setAttribute('aria-label',ui('地図の方角：上が北です。端末の向きを示すものではありません。'));
  compass.title = ui('地図は北が上です。GPS・方位センサーなしで表示できます。');
  compass.innerHTML = `<svg viewBox="0 0 64 66" aria-hidden="true" focusable="false"><circle cx="32" cy="37" r="24" fill="white" stroke="#b9c6c0"/><path d="M32 17 41 45 32 39Z" fill="#b93731"/><path d="M32 17 23 45 32 39Z" fill="#e65b50"/><path d="M32 57 41 29 32 35Z" fill="#183d38"/><path d="M32 57 23 29 32 35Z" fill="#72918a"/><circle cx="32" cy="37" r="3" fill="white" stroke="#183d38"/><text x="32" y="11" text-anchor="middle" fill="#a42b25" font-family="sans-serif" font-size="12" font-weight="bold">N</text></svg>`;
  const compassCaption = document.createElement('span');
  compassCaption.textContent = ui('上が北');
  compassCaption.setAttribute('aria-hidden','true');
  compass.append(compassCaption);
  $('#gsi-map').append(compass);

  viewControls.append($('#map-reset'), $('#map-expand'));
  $('.map-tools').remove(); 
  const mapSection = $('.map-section');
  mapSection.insertBefore($('#gsi-map'), mapSection.children[1]);
  $('#dashboard').prepend($('.content-grid'));
  const mapOptions = document.createElement('details');
  mapOptions.className = 'map-options';
  const optionsTitle = document.createElement('summary');
  optionsTitle.textContent = ui('過去の災害・その他の情報');
  mapOptions.append(optionsTitle);
  [...mapSection.children].filter(el => !el.matches('.section-heading, #gsi-map, .map-tools, #map-error, #hazard-picker')).forEach(el => mapOptions.append(el));
  mapSection.append(mapOptions);
  const picker = $('#hazard-picker');
  $('#gsi-map').append(picker);
  picker.classList.add('map-control-panel');
  const layerInfo = document.createElement('details');
  layerInfo.id = 'hazard-layer-info';
  const layerSummary = document.createElement('summary');
  layerSummary.textContent = ui('説明・色の意味');
  layerInfo.append(layerSummary, $('#hazard-description'), $('#overlay-status'), $('#hazard-legend'));
  picker.append(layerInfo, mapOptions);
  layerInfo.hidden = state.mapHazard === 0;
  const riskMenu = document.createElement('section');
  riskMenu.id = 'risk-menu';
  riskMenu.className = 'map-control-panel';
  const riskTrigger = document.createElement('button');
  riskTrigger.id = 'risk-menu-trigger';
  riskTrigger.type = 'button';
  riskTrigger.textContent = ui('災害リスク ▾');
  riskTrigger.setAttribute('aria-expanded', 'false');
  riskTrigger.setAttribute('aria-controls', 'hazard-picker');
  picker.before(riskMenu);
  riskMenu.append(riskTrigger, picker);
  picker.hidden = true;
  const mapControlGroup = document.createElement('section');
  mapControlGroup.id = 'map-control-group';
  mapControlGroup.className = 'map-control-panel';
  riskMenu.before(mapControlGroup);
  mapControlGroup.append(riskMenu);
  const contextMenu = document.createElement('section');
  contextMenu.id = 'context-menu';
  contextMenu.className = 'map-control-panel';
  const contextTrigger = document.createElement('button');
  contextTrigger.type = 'button';
  contextTrigger.id = 'context-menu-trigger';
  contextTrigger.textContent = ui('過去の災害・道路の注意箇所 ▾');
  contextTrigger.setAttribute('aria-controls', 'context-picker');
  const contextPicker = document.createElement('section');
  contextPicker.id = 'context-picker';
  contextPicker.className = 'map-control-panel';
  contextPicker.setAttribute('aria-label', ui('過去の災害・道路の注意箇所'));
  const oldContext = $('.context-controls');
  [...oldContext.children].filter(el => el.tagName !== 'SUMMARY').forEach(el => contextPicker.append(el));
  oldContext.remove();
  contextMenu.append(contextTrigger, contextPicker);
  mapControlGroup.append(contextMenu);
  optionsTitle.textContent = ui('その他の地図情報');
  mapSection.append($('#context-detail'));
  const menus = [];
  function setupMapMenu(menu, trigger, panel) {
    let pinned = false;
    let closeTimer;
    const setOpen = open => {
      clearTimeout(closeTimer);
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
    };
    const close = () => { pinned = false; setOpen(false); };
    const open = () => {
      menus.forEach(other => { if (other.menu !== menu) other.close(); });
      setOpen(true);
    };
    menus.push({menu, close});
    setOpen(false);
    menu.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') open();
    });
    menu.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && !pinned) closeTimer = setTimeout(close, 180);
    });
    trigger.addEventListener('click', () => {
      pinned = !pinned;
      if (pinned) open(); else setOpen(false);
    });
    menu.addEventListener('focusin', open);
    menu.addEventListener('focusout', event => {
      if (!menu.contains(event.relatedTarget)) close();
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        trigger.focus({preventScroll:true}); close();
      }
      if (event.key === 'ArrowDown' && event.target === trigger) {
        event.preventDefault(); open();
        panel.querySelector('button,input,summary')?.focus({preventScroll:true});
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!menu.contains(event.target)) close();
    });
  }
  setupMapMenu(riskMenu, riskTrigger, picker);
  setupMapMenu(contextMenu, contextTrigger, contextPicker);
  const shelterDock = document.createElement('section');
  shelterDock.id = 'shelter-dock';
  shelterDock.className = 'map-control-panel';
  const shelterTrigger = document.createElement('button');
  shelterTrigger.id = 'shelter-menu-trigger';
  shelterTrigger.type = 'button';
  shelterTrigger.setAttribute('aria-pressed', 'false');
  shelterTrigger.setAttribute('aria-label', ui('避難場所の番号を表示・非表示'));
  const triggerLabel = document.createElement('span');
  triggerLabel.textContent = ui('避難場所');
  const count = document.createElement('span');
  count.id = 'shelter-count';
  count.dataset.noRuby = '';
  shelterTrigger.append(triggerLabel, count);
  const shelterPanel = $('.shelter-section');
  shelterPanel.id = 'shelter-panel';
  shelterPanel.hidden = true;
  shelterPanel.classList.add('map-control-panel');
  const shelterClose = document.createElement('button');
  shelterClose.id = 'shelter-panel-close';
  shelterClose.type = 'button';
  shelterClose.textContent = ui('閉じる');
  shelterPanel.querySelector('.section-heading').append(shelterClose);
  const singleCaution = document.createElement('p');
  singleCaution.className = 'single-shelter-caution';
  singleCaution.textContent = ui('直線距離です。開設・道の安全は未確認です。');
  $('#shelter-list').before(singleCaution);

  const shelterNotes = document.createElement('details');
  shelterNotes.id = 'shelter-notes';
  const noteSummary = document.createElement('summary');
  noteSummary.textContent = ui('移動の配慮・注意事項');
  shelterNotes.append(noteSummary, $('.mobility'), $('#mobility-warning'), $('#streetview-note'));
  shelterPanel.append(shelterNotes);
  const placeholder = document.createElement('p');
  placeholder.id = 'shelter-location-guide';
  placeholder.textContent = ui('上の欄で場所を選ぶと、近くの候補が表示されます。');
  $('#shelter-list').before(placeholder);
  const openShelters = () => {
    if (selectedShelterIndex === null || !state.shelters[selectedShelterIndex]) return;
    shelterMarkersEnabled = true;
    if (state.location && state.mapCenter) {
      renderShelterMarkers($('#map-layer'), state.mapCenter, state.shelters, focusShelter, state.mapZoom);
      applyShelterSelection();
    }
    menus.forEach(menu => menu.close());
    shelterPanel.hidden = false;
  };
  const closeShelters = () => {
    selectedShelterIndex = null;
    applyShelterSelection();
    shelterPanel.hidden = true;
  };
  shelterPanelController = {open:openShelters,close:closeShelters};
  shelterTrigger.addEventListener('click', () => {
    shelterMarkersEnabled = !shelterMarkersEnabled;
    selectedShelterIndex = null;
    closeShelters();
    applyShelterSelection();
    if (state.location && state.mapCenter) renderShelterMarkers($('#map-layer'), state.mapCenter, state.shelters, focusShelter, state.mapZoom);
    shelterTrigger.setAttribute('aria-pressed', String(shelterMarkersEnabled));
  });
  shelterClose.addEventListener('click', () => {
    closeShelters(); shelterTrigger.focus({preventScroll:true});
  });
  shelterDock.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !shelterPanel.hidden) {
      event.preventDefault(); event.stopPropagation();
      closeShelters(); shelterTrigger.focus({preventScroll:true});
    }
  });
  shelterDock.append(shelterTrigger, shelterPanel);
  $('#gsi-map').append(shelterDock);


  const headerInformation = document.createElement('nav');
  headerInformation.id = 'header-information';
  headerInformation.setAttribute('aria-label', ui('出典と案内'));
  const attribution = document.createElement('details');
  attribution.className = 'header-popover';
  attribution.id = 'header-attribution';
  const attributionTitle = document.createElement('summary');
  attributionTitle.textContent = ui('追加情報の出典');
  const attributionBody = document.createElement('div');
  attributionBody.className = 'header-popover-body';
  attributionBody.append($('.context-credit'), $('.map-credit'), $('.official-links'), $('.local-hazard-maps'), $('.disclaimer'));
  attribution.append(attributionTitle, attributionBody);
  const symbolSources = $('.source-details');
  symbolSources.classList.add('header-popover');
  const symbolBody = document.createElement('div');
  symbolBody.className = 'header-popover-body';
  [...symbolSources.children].filter(el => el.tagName !== 'SUMMARY').forEach(el => symbolBody.append(el));
  symbolSources.append(symbolBody);
  const assist = $('.assist-menu');
  assist.classList.add('header-popover');
  assist.querySelector('.assist-menu-body').classList.add('header-popover-body');
  const footerSources = document.createElement('nav');
  footerSources.id = 'footer-sources';
  footerSources.setAttribute('aria-label', ui('出典'));
  footerSources.append(attribution, symbolSources);
  document.querySelector('footer').append(footerSources);
  headerInformation.append(assist);
  document.querySelector('header .header-actions').before(headerInformation);
  const headerMenus = [...headerInformation.querySelectorAll(':scope > details'), ...footerSources.querySelectorAll(':scope > details')];
  headerMenus.forEach(menu => {
    menu.addEventListener('toggle', () => {
      if (menu.open) headerMenus.filter(other => other !== menu).forEach(other => { other.open = false; });
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus({preventScroll:true}); }
    });
  });
  document.addEventListener('pointerdown', event => {
    if (!headerInformation.contains(event.target) && !footerSources.contains(event.target)) headerMenus.forEach(menu => { menu.open = false; });
  });
  const information = document.createElement('div');
  information.hidden = true;
  information.append($('.current-location'), $('.risk-section'), $('#action-panel'));
  $('#dashboard').append(information);
  $('#action-panel').hidden = true;
  $$('[data-purpose]').forEach(button => button.addEventListener('click', () => openWorkspace(button.dataset.purpose)));
  $('#choose-home').addEventListener('click', () => openPlacePicker('destination'));
  new ResizeObserver(() => {
    const map = $('#gsi-map');
    const controlsHeight = $('#map-control-group').getBoundingClientRect().height;
    map.style.setProperty('--map-panel-height', `${Math.max(90, map.clientHeight - controlsHeight - 36)}px`);
    if (purpose === 'home' && state.location && homeDestination) fitJourney();
  }).observe($('#gsi-map'));
  initSavedViews();
  const followMap=createMapFollower({
    layer:$('#map-layer'),
    getView:()=>({center:state.mapCenter,zoom:state.mapZoom}),
    setCenter:center=>{state.mapCenter=center;},redraw:redrawMap,
    prepare:target=>renderBaseMap($('#map-layer'),state.mapCenter,null,state.mapZoom,target)
  });
  // Commit the current displayed position before handing control to the user.
  for(const type of ['pointerdown','touchstart','wheel','keydown','click'])
    $('#gsi-map').addEventListener(type,()=>followMap.cancel(),{capture:true,passive:true});
  window.addEventListener('resize',()=>followMap.cancel());
  walking = initWalking(() => ({center:state.location ? state.mapCenter : null, zoom:state.mapZoom}), followMap);
  initTransit(()=>({origin:state.location,destination:purpose==='home'?homeDestination:null}));
  const controlsToggle=document.createElement('button');
  controlsToggle.id='toggle-map-controls';controlsToggle.type='button';
  controlsToggle.textContent=ui('操作ボタンを隠す');
  controlsToggle.setAttribute('aria-expanded','true');
  $('#gsi-map .map-zoom').id='map-zoom-controls';
  controlsToggle.setAttribute('aria-controls','map-zoom-controls map-control-group map-view-controls shelter-dock transit-trigger');
  const displayToggles=document.createElement('div');
  displayToggles.id='workspace-display-toggles';
  $('#toggle-journey-fields').before(displayToggles);
  displayToggles.append($('#toggle-journey-fields'),controlsToggle);
  controlsToggle.addEventListener('click',()=>{
    const hidden=!document.body.classList.contains('map-controls-hidden');
    if(hidden){
      for(const id of ['risk-menu-trigger','context-menu-trigger']){
        const trigger=$('#'+id);if(trigger.getAttribute('aria-expanded')==='true')trigger.click();
      }
      shelterPanelController?.close();
      $('#context-detail').hidden=true;
    }
    document.body.classList.toggle('map-controls-hidden',hidden);
    controlsToggle.setAttribute('aria-expanded',String(!hidden));
    controlsToggle.textContent=ui(hidden?'操作ボタンを表示':'操作ボタンを隠す');
    controlsToggle.focus({preventScroll:true});
  });

  $('#choose-purpose').addEventListener('click', () => {
    document.body.classList.remove('workspace-open');
    $('#language-gate').hidden = false;
    $('#dashboard').hidden = true;
    $('#location-panel').hidden = true;
    $('#workspace-toolbar').hidden = true;
    $('#language-gate-title').setAttribute('tabindex', '-1');
    $('#language-gate-title').focus();
  });
}

startRubySupport();
init();

startInterfaceLocalization();
