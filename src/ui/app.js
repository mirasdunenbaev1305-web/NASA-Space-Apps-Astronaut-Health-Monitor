// Astronaut Vitals — UI controller. Talks to the engine only through the
// functions in CONTRACT.md. AI-generated code (Claude) — see README "AI tools used".

import { loadEngine } from './engine.js';
import { ORGAN_IDS, renderFigure, updateFigure } from './body.js';
import { renderCharts } from './charts.js';
import {
  FIELDS, ICON, TEXT, RANK, SYMPTOM_TEXT, MAX_HISTORY, normStatus, worstStatus, hazardText, rangeText, parseRange,
  organStatuses, validateField, hasAnyMeasurement, missionDayOf, sanitizeState, simulated, demoWeek, buildCsv,
} from './logic.js';

const STORE_KEY = 'astronautVitals.v1';
const $ = (sel) => document.querySelector(sel);
let engine;
const organs = {};
const names = {};
let state = { missionStart: Date.now(), history: [] };
let selectedOrgan = null;

/* ---------- storage (per-browser convenience; never required) ---------- */
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = sanitizeState(JSON.parse(raw));
  } catch (_) { /* storage unavailable or corrupted: run in memory */ }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* ignore */ }
}

/* ---------- helpers ---------- */
const missionDay = (t = Date.now()) => missionDayOf(t, state.missionStart);
function badge(status) {
  const s = normStatus(status);
  const b = el('span', 'badge');
  b.dataset.status = s;
  const ico = el('span', 'ico', ICON[s]);
  ico.setAttribute('aria-hidden', 'true');
  b.append(ico, el('span', '', TEXT[s]));
  return b;
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function fmtTime(t) {
  return new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
const EMPTY_RESULT = { indicators: [], overall: 'UNKNOWN', escalate: false };
function evaluate(readings) {
  try {
    const r = engine.evaluateIndicators(readings);
    return r && Array.isArray(r.indicators) ? r : EMPTY_RESULT;
  } catch (err) { console.error('evaluateIndicators failed', err); return EMPTY_RESULT; }
}
function safeGuidance(id, status) {
  try { return engine.getGuidance(id, status); } catch (err) { console.error('getGuidance failed', err); return null; }
}
const baseIndicators = () => evaluate({}).indicators;

/* ---------- derived view model ---------- */
const latest = () => state.history[state.history.length - 1] || null;
const currentResult = () => (latest() ? evaluate(latest().readings) : null);

/* ---------- renderers ---------- */
function renderHeader(result) {
  $('#missionDay').textContent = String(missionDay());
  const chip = $('#overallChip');
  const s = result ? normStatus(result.overall) : 'UNKNOWN';
  chip.dataset.status = s;
  chip.querySelector('.ico').textContent = ICON[s];
  chip.querySelector('.txt').textContent = result ? `Overall: ${TEXT[s]}` : 'No data';

  const esc = $('#escalation');
  if (result && result.escalate) {
    const alerts = result.indicators.filter((i) => i.status === 'ALERT').map((i) => i.label);
    const watches = result.indicators.filter((i) => i.status === 'WATCH').map((i) => i.label);
    const parts = [];
    if (alerts.length) parts.push(`Alert: ${alerts.join(', ')}`);
    if (watches.length) parts.push(`Watch: ${watches.join(', ')}`);
    $('#escalationReason').textContent = `${parts.join(' · ')}. Share the exported report at the next medical conference.`;
    esc.hidden = false;
  } else {
    esc.hidden = true;
  }
}

function renderOrganList(statuses) {
  const list = $('#organList');
  if (!list.children.length) {
    ORGAN_IDS.forEach((id) => {
      const li = el('li');
      const btn = el('button', 'organ-btn');
      btn.type = 'button';
      btn.dataset.organ = id;
      btn.append(el('span', 'name', names[id]));
      btn.addEventListener('click', () => selectOrgan(id));
      li.append(btn);
      list.append(li);
    });
  }
  list.querySelectorAll('.organ-btn').forEach((btn) => {
    const id = btn.dataset.organ;
    btn.setAttribute('aria-pressed', String(id === selectedOrgan));
    const old = btn.querySelector('.badge');
    if (old) old.remove();
    btn.append(badge(statuses[id]));
  });
}

function renderOrganDetail(statuses, byId) {
  const box = $('#organDetail');
  box.replaceChildren();
  if (!selectedOrgan || !organs[selectedOrgan]) {
    box.append(el('p', 'muted', 'No body area selected. Select one on the figure or in the list.'));
    return;
  }
  const info = organs[selectedOrgan];
  const status = statuses[selectedOrgan];
  const ids = Array.isArray(info.indicatorIds) ? info.indicatorIds : [];
  const h = el('h3');
  h.append(document.createTextNode(info.name), badge(status));
  box.append(h, el('p', 'fn', info.function || ''));

  if (ids.length) {
    box.append(el('p', 'sub', 'Related indicators'));
    const ul = el('ul', 'mini-list');
    ids.forEach((id) => {
      const ind = byId[id];
      const li = el('li');
      const label = ind ? ind.label : id;
      const val = ind && ind.value !== null && ind.value !== undefined ? `${ind.value} ${ind.unit}` : 'not measured';
      li.append(el('span', '', `${label}: ${val}`), badge(ind ? ind.status : 'UNKNOWN'));
      ul.append(li);
    });
    box.append(ul);
  }

  if (Array.isArray(info.hazards) && info.hazards.length) {
    box.append(el('p', 'sub', 'Spaceflight hazards'));
    const chips = el('div', 'chips');
    info.hazards.forEach((hz) => chips.append(el('span', 'chip', hazardText(hz))));
    box.append(chips);
  }

  const flagged = ids.map((id) => byId[id]).filter((i) => i && (i.status === 'ALERT' || i.status === 'WATCH'))
    .sort((a, b) => RANK[b.status] - RANK[a.status]);
  let tip = 'All related indicators are within the normal range. Keep your exercise, sleep and nutrition routine.';
  if (flagged.length) {
    const g = safeGuidance(flagged[0].id, flagged[0].status);
    tip = g && Array.isArray(g.steps) && g.steps.length ? g.steps[0] : 'An indicator for this area needs attention. See Guidance.';
  } else if (!ids.length) {
    tip = 'No indicator in this prototype measures this area directly. Follow the scheduled exercise and medical checks for it.';
  } else if (status === 'UNKNOWN') {
    tip = 'No measurements for this area yet. Log a reading to see its status.';
  }
  box.append(el('p', 'tip', tip));
}

function renderStatus(result) {
  const grid = $('#statusGrid');
  grid.replaceChildren();
  const l = latest();
  $('#statusTime').textContent = l ? `Latest reading: ${fmtTime(l.t)} · mission day ${l.missionDay}` : 'No readings yet.';
  const indicators = result ? result.indicators : baseIndicators();
  indicators.forEach((i) => {
    const li = el('li', 'status-card');
    li.dataset.status = normStatus(i.status);
    const top = el('div', 'card-top');
    top.append(el('span', 'label', i.label), badge(i.status));
    const v = el('div', 'value', i.value === null || i.value === undefined ? '—' : String(i.value));
    v.append(el('small', '', i.unit));
    li.append(top, v, el('span', 'range', rangeText(i.threshold)));
    grid.append(li);
  });
  if (l && l.readings.symptoms && l.readings.symptoms.length) {
    // Symptoms are reported, not scored: the engine decides statuses.
    const li = el('li', 'status-card info-card');
    li.append(el('span', 'label', 'Reported symptoms'), el('div', 'symptom-list', l.readings.symptoms.map((s) => SYMPTOM_TEXT[s] || s).join(', ')),
      el('span', 'range', 'Mention these in the report to the flight surgeon.'));
    grid.append(li);
  }
}

function renderGuidance(result) {
  const box = $('#guidanceList');
  box.replaceChildren();
  if (!result) { box.append(el('p', 'muted', 'Guidance appears here when an indicator needs attention.')); return; }
  const flagged = result.indicators.filter((i) => i.status === 'WATCH' || i.status === 'ALERT').sort((a, b) => RANK[b.status] - RANK[a.status]);
  if (!flagged.length) { box.append(el('p', 'muted', 'All measured indicators are in the normal range. No action needed.')); return; }
  flagged.forEach((i) => {
    const g = safeGuidance(i.id, i.status);
    if (!g) return;
    const item = el('article', 'guidance-item');
    item.dataset.status = i.status;
    const h = el('h3');
    h.append(document.createTextNode(g.title || i.label), badge(i.status));
    const ol = el('ol');
    (Array.isArray(g.steps) ? g.steps : []).forEach((s) => ol.append(el('li', '', s)));
    item.append(h, ol, el('p', 'disc', g.disclaimer || 'Decision support, not a medical diagnosis.'));
    box.append(item);
  });
}

function renderHazards(statuses) {
  const grid = $('#hazardGrid');
  grid.replaceChildren();
  const map = new Map();
  ORGAN_IDS.forEach((id) => (organs[id] && Array.isArray(organs[id].hazards) ? organs[id].hazards : []).forEach((hz) => {
    if (!map.has(hz)) map.set(hz, []);
    map.get(hz).push(id);
  }));
  if (!map.size) { grid.append(el('li', 'muted', 'No hazard information available.')); return; }
  map.forEach((ids, hz) => {
    const li = el('li', 'hazard');
    const head = el('div', 'hazard-head');
    head.append(el('strong', '', hazardText(hz)), badge(worstStatus(ids.map((id) => statuses[id]))));
    const chips = el('div', 'chips');
    ids.forEach((id) => {
      const c = el('button', 'chip chip-btn', names[id]);
      c.type = 'button';
      c.addEventListener('click', () => selectOrgan(id, true));
      chips.append(c);
    });
    li.append(head, chips);
    grid.append(li);
  });
}

function renderTrends() {
  const evaluated = state.history.map((h) => ({ h, r: evaluate(h.readings) }));
  const base = baseIndicators();
  const series = base.map((b) => ({
    id: b.id,
    label: b.label,
    unit: b.unit,
    range: parseRange(b.threshold),
    points: evaluated.map(({ h, r }) => {
      const ind = r.indicators.find((x) => x.id === b.id);
      return { label: `Day ${h.missionDay}`, value: ind && ind.value !== undefined ? ind.value : null, status: ind ? normStatus(ind.status) : 'UNKNOWN' };
    }),
  }));
  renderCharts($('#chartGrid'), series);

  const table = $('#historyTable');
  table.replaceChildren();
  const thead = el('thead');
  const tr = el('tr');
  ['Time', 'Day', ...base.map((b) => `${b.label} (${b.unit})`), 'Overall'].forEach((t) => {
    const th = el('th', '', t);
    th.scope = 'col';
    tr.append(th);
  });
  thead.append(tr);
  const tbody = el('tbody');
  if (!evaluated.length) {
    const row = el('tr');
    const td = el('td', 'muted', 'No readings yet.');
    td.colSpan = base.length + 3;
    row.append(td);
    tbody.append(row);
  }
  evaluated.slice().reverse().forEach(({ h, r }) => {
    const row = el('tr');
    row.append(el('td', '', fmtTime(h.t)), el('td', '', String(h.missionDay)));
    base.forEach((b) => {
      const ind = r.indicators.find((x) => x.id === b.id);
      row.append(el('td', '', ind && ind.value !== null && ind.value !== undefined ? `${ind.value} · ${TEXT[normStatus(ind.status)]}` : '—'));
    });
    row.append(el('td', '', TEXT[normStatus(r.overall)]));
    tbody.append(row);
  });
  table.append(thead, tbody);
}

function renderAll() {
  const result = currentResult();
  const { out, byId } = organStatuses(result, organs, ORGAN_IDS);
  renderHeader(result);
  updateFigure($('#figureWrap'), out, names, selectedOrgan);
  renderOrganList(out);
  renderOrganDetail(out, byId);
  renderStatus(result);
  renderGuidance(result);
  renderHazards(out);
  renderTrends();
}

function selectOrgan(id, scroll) {
  selectedOrgan = id;
  renderAll();
  if (scroll) $('#organDetail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------- form ---------- */
function readForm(form) {
  const readings = {};
  const invalidFields = [];
  FIELDS.forEach((f) => {
    const input = form.elements[f];
    const { value, invalid } = validateField(input.value, Number(input.min), Number(input.max), input.validity && input.validity.badInput);
    if (invalid) { input.setAttribute('aria-invalid', 'true'); invalidFields.push(input); } else input.removeAttribute('aria-invalid');
    readings[f] = value;
  });
  const mood = form.querySelector('input[name="mood"]:checked');
  readings.mood = mood ? Number(mood.value) : null;
  readings.symptoms = [...form.querySelectorAll('input[name="symptoms"]:checked')].map((c) => c.value);
  return { readings, invalidFields };
}

function addEntry(readings, t = Date.now()) {
  state.history.push({ t, missionDay: missionDay(t), readings });
  if (state.history.length > MAX_HISTORY) state.history = state.history.slice(-MAX_HISTORY);
  save();
}

function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const { readings, invalidFields } = readForm(form);
  const msg = $('#formMsg');
  if (invalidFields.length) {
    const n = invalidFields.length;
    msg.textContent = `${n} value${n > 1 ? 's are' : ' is'} not a valid number or outside the possible range. Check the highlighted field${n > 1 ? 's' : ''}.`;
    invalidFields[0].focus();
    return;
  }
  if (!hasAnyMeasurement(readings)) { msg.textContent = 'Enter at least one measurement, or use Simulate readings.'; return; }
  addEntry(readings);
  const r = evaluate(readings);
  msg.textContent = `Reading logged. Overall status: ${TEXT[normStatus(r.overall)]}.`;
  renderAll();
  if (r.escalate) $('#escalation').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearInvalid(form) {
  form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
}

function fillForm(r) {
  const form = $('#readingForm');
  clearInvalid(form);
  FIELDS.forEach((f) => { form.elements[f].value = r[f] ?? ''; });
  form.querySelectorAll('input[name="mood"]').forEach((m) => { m.checked = Number(m.value) === r.mood; });
  form.querySelectorAll('input[name="symptoms"]').forEach((c) => { c.checked = r.symptoms.includes(c.value); });
  $('#formMsg').textContent = 'Simulated sensor values filled in. Press Log reading to save them.';
}

function loadDemoWeek() {
  state = demoWeek();
  save();
  selectedOrgan = 'heart';
  $('#formMsg').textContent = 'Loaded a 7-day demo: sleep loss and rising heart rate over the week.';
  renderAll();
}

/* ---------- export ---------- */
function exportCsv() {
  const msg = $('#formMsg');
  if (!state.history.length) { msg.textContent = 'Nothing to export yet. Log a reading or load the demo week.'; return; }
  const csv = buildCsv(state.history, evaluate, baseIndicators());
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `astronaut-vitals-day${missionDay()}.csv`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  msg.textContent = `Exported ${state.history.length} reading${state.history.length > 1 ? 's' : ''} to CSV.`;
}

function printReport() {
  const d = $('.table-view');
  const wasOpen = d.open;
  d.open = true;
  window.addEventListener('afterprint', () => { d.open = wasOpen; }, { once: true });
  window.print();
}

let resetArmed = null;
function onReset(e) {
  const btn = e.currentTarget;
  if (!resetArmed) {
    btn.classList.add('confirm');
    btn.textContent = 'Click again to erase';
    resetArmed = setTimeout(() => { btn.classList.remove('confirm'); btn.textContent = 'Reset demo data'; resetArmed = null; }, 4000);
    return;
  }
  clearTimeout(resetArmed);
  resetArmed = null;
  btn.classList.remove('confirm');
  btn.textContent = 'Reset demo data';
  state = { missionStart: Date.now(), history: [] };
  try { localStorage.removeItem(STORE_KEY); } catch (_) { /* ignore */ }
  selectedOrgan = null;
  const form = $('#readingForm');
  form.reset();
  clearInvalid(form);
  $('#formMsg').textContent = 'All demo data erased.';
  renderAll();
}

/* ---------- installable app (PWA) & offline ---------- */
function setupPwa() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker not registered', err));
  }
  let deferred = null;
  const btn = $('#installBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.hidden = false;
  });
  btn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (_) { /* ignore */ }
    deferred = null;
    btn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; });
  const net = () => { $('#netChip').hidden = navigator.onLine; };
  window.addEventListener('online', net);
  window.addEventListener('offline', net);
  net();
}

/* ---------- boot ---------- */
async function init() {
  setupPwa();
  const loaded = await loadEngine();
  engine = loaded.engine;
  $('#engineSource').textContent = loaded.source === 'stubs' ? 'Engine: placeholder thresholds (stub).' : '';
  ORGAN_IDS.forEach((id) => {
    let info = null;
    try { info = engine.getOrganInfo(id); } catch (_) { /* ignore */ }
    organs[id] = info && typeof info === 'object' ? info : { name: id, function: '', indicatorIds: [], hazards: [] };
    names[id] = organs[id].name || id;
  });
  load();
  renderFigure($('#figureWrap'), names, (id) => selectOrgan(id, window.innerWidth < 1025));
  $('#readingForm').addEventListener('submit', onSubmit);
  $('#simulateBtn').addEventListener('click', () => fillForm(simulated()));
  $('#demoBtn').addEventListener('click', loadDemoWeek);
  $('#csvBtn').addEventListener('click', exportCsv);
  $('#pdfBtn').addEventListener('click', printReport);
  $('#resetBtn').addEventListener('click', onReset);
  renderAll();
  document.documentElement.dataset.ready = 'true';
}

init();
