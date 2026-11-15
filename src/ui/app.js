// Astronaut Vitals — UI controller. Talks to the engine only through the
// functions in CONTRACT.md. AI-generated code (Claude) — see README "AI tools used".

import { loadEngine } from './engine.js';
import { ORGAN_IDS, renderFigure, updateFigure } from './body.js';
import { renderCharts, parseRange } from './charts.js';

const STORE_KEY = 'astronautVitals.v1';
const DAY_MS = 86400000;
const FIELDS = ['systolic', 'diastolic', 'heartRate', 'glucose', 'temperature', 'sleepHours'];
const ICON = { NORMAL: '✓', WATCH: '!', ALERT: '✕', UNKNOWN: '?' };
const TEXT = { NORMAL: 'Normal', WATCH: 'Watch', ALERT: 'Alert', UNKNOWN: 'No data' };
const RANK = { NORMAL: 0, UNKNOWN: -1, WATCH: 1, ALERT: 2 };
const HAZARD_TEXT = {
  spaceRadiation: 'Space radiation',
  isolationConfinement: 'Isolation and confinement',
  distanceFromEarth: 'Distance from Earth',
  gravityFields: 'Gravity fields',
  hostileClosedEnvironments: 'Hostile closed environments',
};
// Engine may return hazard ids ("spaceRadiation") or plain text; show readable text.
const hazardText = (h) => HAZARD_TEXT[h] || String(h).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
const rangeText = (t) => (/NORMAL/i.test(String(t)) ? String(t) : `Normal: ${t}`);
const SYMPTOM_TEXT = { headache: 'Headache', dizziness: 'Dizziness', nausea: 'Nausea', jointPain: 'Joint pain', fatigue: 'Fatigue' };

const $ = (sel) => document.querySelector(sel);
let engine;
let organs = {};
let names = {};
let state = { missionStart: Date.now(), history: [] };
let selectedOrgan = null;

/* ---------- storage (per-browser convenience; never required) ---------- */
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.history)) state = { missionStart: parsed.missionStart || Date.now(), history: parsed.history };
    }
  } catch (_) { /* storage unavailable: run in memory */ }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* ignore */ }
}

/* ---------- helpers ---------- */
const missionDay = (t = Date.now()) => Math.max(1, Math.floor((t - state.missionStart) / DAY_MS) + 1);
const worst = (list) => list.reduce((acc, s) => (RANK[s] > RANK[acc] ? s : acc), 'UNKNOWN');
function badge(status) {
  const s = TEXT[status] ? status : 'UNKNOWN';
  const el = document.createElement('span');
  el.className = 'badge';
  el.dataset.status = s;
  const ico = document.createElement('span');
  ico.className = 'ico';
  ico.setAttribute('aria-hidden', 'true');
  ico.textContent = ICON[s];
  const txt = document.createElement('span');
  txt.textContent = TEXT[s];
  el.append(ico, txt);
  return el;
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
function evaluate(readings) {
  try { return engine.evaluateIndicators(readings); }
  catch (err) { console.error('evaluateIndicators failed', err); return { indicators: [], overall: 'UNKNOWN', escalate: false }; }
}

/* ---------- derived view model ---------- */
function latest() { return state.history[state.history.length - 1] || null; }
function currentResult() {
  const l = latest();
  return l ? evaluate(l.readings) : null;
}
function organStatuses(result) {
  const byId = {};
  (result ? result.indicators : []).forEach((i) => { byId[i.id] = i; });
  const out = {};
  ORGAN_IDS.forEach((id) => {
    const info = organs[id];
    const sts = (info && info.indicatorIds ? info.indicatorIds : []).map((k) => (byId[k] ? byId[k].status : 'UNKNOWN'));
    if (id === 'mood' && result && latest() && (latest().readings.symptoms || []).length >= 3 && RANK[worst(sts)] < 1) sts.push('WATCH');
    out[id] = sts.length ? worst(sts) : 'UNKNOWN';
  });
  return { out, byId };
}

/* ---------- renderers ---------- */
function renderHeader(result) {
  $('#missionDay').textContent = String(missionDay());
  const chip = $('#overallChip');
  const s = result ? result.overall : 'UNKNOWN';
  chip.dataset.status = TEXT[s] ? s : 'UNKNOWN';
  chip.querySelector('.ico').textContent = ICON[chip.dataset.status];
  chip.querySelector('.txt').textContent = result ? `Overall: ${TEXT[chip.dataset.status]}` : 'No data';

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
  const h = el('h3');
  h.append(document.createTextNode(info.name), badge(status));
  box.append(h, el('p', 'fn', info.function));

  box.append(el('p', 'sub', 'Related indicators'));
  const ul = el('ul', 'mini-list');
  (info.indicatorIds || []).forEach((id) => {
    const ind = byId[id];
    const li = el('li');
    const label = ind ? ind.label : id;
    const val = ind && ind.value !== null && ind.value !== undefined ? `${ind.value} ${ind.unit}` : 'not measured';
    li.append(el('span', '', `${label}: ${val}`), badge(ind ? ind.status : 'UNKNOWN'));
    ul.append(li);
  });
  box.append(ul);

  if (info.hazards && info.hazards.length) {
    box.append(el('p', 'sub', 'Spaceflight hazards'));
    const chips = el('div', 'chips');
    info.hazards.forEach((hz) => chips.append(el('span', 'chip', hazardText(hz))));
    box.append(chips);
  }

  const flagged = (info.indicatorIds || []).map((id) => byId[id]).filter((i) => i && (i.status === 'ALERT' || i.status === 'WATCH'))
    .sort((a, b) => RANK[b.status] - RANK[a.status]);
  let tip = 'All related indicators are within the normal range. Keep your exercise, sleep and nutrition routine.';
  if (flagged.length) {
    const g = safeGuidance(flagged[0].id, flagged[0].status);
    if (g && g.steps && g.steps.length) tip = g.steps[0];
  } else if (!(info.indicatorIds || []).length) {
    tip = 'No indicator in this prototype measures this area directly. Follow the scheduled exercise and medical checks for it.';
  } else if (status === 'UNKNOWN') {
    tip = 'No measurements for this area yet. Log a reading to see its status.';
  }
  box.append(el('p', 'tip', tip));
}

function safeGuidance(id, status) {
  try { return engine.getGuidance(id, status); } catch (err) { console.error('getGuidance failed', err); return null; }
}

function renderStatus(result) {
  const grid = $('#statusGrid');
  grid.replaceChildren();
  const l = latest();
  $('#statusTime').textContent = l ? `Latest reading: ${fmtTime(l.t)} · mission day ${l.missionDay}` : 'No readings yet.';
  const indicators = result ? result.indicators : engine.evaluateIndicators({}).indicators;
  indicators.forEach((i) => {
    const li = el('li', 'status-card');
    li.dataset.status = TEXT[i.status] ? i.status : 'UNKNOWN';
    const top = el('div');
    top.style.display = 'flex';
    top.style.justifyContent = 'space-between';
    top.style.gap = '8px';
    top.style.flexWrap = 'wrap';
    top.append(el('span', 'label', i.label), badge(i.status));
    const v = el('div', 'value', i.value === null || i.value === undefined ? '—' : String(i.value));
    v.append(el('small', '', i.unit));
    li.append(top, v, el('span', 'range', rangeText(i.threshold)));
    grid.append(li);
  });
  if (l && l.readings.symptoms && l.readings.symptoms.length) {
    const li = el('li', 'status-card');
    li.dataset.status = l.readings.symptoms.length >= 3 ? 'WATCH' : 'UNKNOWN';
    li.append(el('span', 'label', 'Reported symptoms'), el('div', '', l.readings.symptoms.map((s) => SYMPTOM_TEXT[s] || s).join(', ')));
    grid.append(li);
  }
}

function renderGuidance(result) {
  const box = $('#guidanceList');
  box.replaceChildren();
  const flagged = result ? result.indicators.filter((i) => i.status === 'WATCH' || i.status === 'ALERT').sort((a, b) => RANK[b.status] - RANK[a.status]) : [];
  if (!result) { box.append(el('p', 'muted', 'Guidance appears here when an indicator needs attention.')); return; }
  if (!flagged.length) { box.append(el('p', 'muted', 'All measured indicators are in the normal range. No action needed.')); return; }
  flagged.forEach((i) => {
    const g = safeGuidance(i.id, i.status);
    if (!g) return;
    const item = el('article', 'guidance-item');
    item.dataset.status = i.status;
    const h = el('h3');
    h.append(document.createTextNode(g.title || i.label), badge(i.status));
    const ol = el('ol');
    (g.steps || []).forEach((s) => ol.append(el('li', '', s)));
    item.append(h, ol, el('p', 'disc', g.disclaimer || 'Decision support, not a medical diagnosis.'));
    box.append(item);
  });
}

function renderHazards(statuses) {
  const grid = $('#hazardGrid');
  grid.replaceChildren();
  const map = new Map();
  ORGAN_IDS.forEach((id) => (organs[id] && organs[id].hazards ? organs[id].hazards : []).forEach((hz) => {
    if (!map.has(hz)) map.set(hz, []);
    map.get(hz).push(id);
  }));
  map.forEach((ids, hz) => {
    const li = el('li', 'hazard');
    const head = el('div', 'hazard-head');
    head.append(el('strong', '', hazardText(hz)), badge(worst(ids.map((id) => statuses[id]))));
    const chips = el('div', 'chips');
    ids.forEach((id) => {
      const c = el('button', 'chip', names[id]);
      c.type = 'button';
      c.style.border = '0';
      c.style.cursor = 'pointer';
      c.addEventListener('click', () => selectOrgan(id, true));
      chips.append(c);
    });
    li.append(head, chips);
    grid.append(li);
  });
}

function renderTrends() {
  const evaluated = state.history.map((h) => ({ h, r: evaluate(h.readings) }));
  const base = engine.evaluateIndicators({}).indicators;
  const series = base.map((b) => ({
    id: b.id,
    label: b.label,
    unit: b.unit,
    range: parseRange(b.threshold),
    points: evaluated.map(({ h, r }) => {
      const ind = r.indicators.find((x) => x.id === b.id);
      return { label: `Day ${h.missionDay}`, value: ind && ind.value !== undefined ? ind.value : null, status: ind ? ind.status : 'UNKNOWN' };
    }),
  }));
  renderCharts($('#chartGrid'), series);

  const table = $('#historyTable');
  table.replaceChildren();
  const thead = el('thead');
  const tr = el('tr');
  ['Time', 'Day', ...base.map((b) => `${b.label} (${b.unit})`), 'Overall'].forEach((t) => tr.append(el('th', '', t)));
  thead.append(tr);
  const tbody = el('tbody');
  evaluated.slice().reverse().forEach(({ h, r }) => {
    const row = el('tr');
    row.append(el('td', '', fmtTime(h.t)), el('td', '', String(h.missionDay)));
    base.forEach((b) => {
      const ind = r.indicators.find((x) => x.id === b.id);
      row.append(el('td', '', ind && ind.value !== null && ind.value !== undefined ? `${ind.value} · ${TEXT[ind.status]}` : '—'));
    });
    row.append(el('td', '', TEXT[r.overall] || r.overall));
    tbody.append(row);
  });
  table.append(thead, tbody);
}

function renderAll() {
  const result = currentResult();
  const { out, byId } = organStatuses(result);
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
  let invalid = 0;
  FIELDS.forEach((f) => {
    const input = form.elements[f];
    const raw = input.value.trim();
    input.removeAttribute('aria-invalid');
    if (raw === '') { readings[f] = null; return; }
    const v = Number(raw);
    if (!Number.isFinite(v) || v < Number(input.min) || v > Number(input.max)) {
      input.setAttribute('aria-invalid', 'true');
      invalid += 1;
      readings[f] = null;
      return;
    }
    readings[f] = v;
  });
  const mood = form.querySelector('input[name="mood"]:checked');
  readings.mood = mood ? Number(mood.value) : null;
  readings.symptoms = [...form.querySelectorAll('input[name="symptoms"]:checked')].map((c) => c.value);
  return { readings, invalid };
}

function addEntry(readings, t = Date.now()) {
  state.history.push({ t, missionDay: missionDay(t), readings });
  save();
}

function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const { readings, invalid } = readForm(form);
  const msg = $('#formMsg');
  if (invalid) { msg.textContent = `${invalid} value${invalid > 1 ? 's are' : ' is'} outside the possible range. Check the highlighted field.`; return; }
  const any = FIELDS.some((f) => readings[f] !== null) || readings.mood !== null;
  if (!any) { msg.textContent = 'Enter at least one measurement, or use Simulate readings.'; return; }
  addEntry(readings);
  const r = evaluate(readings);
  msg.textContent = `Reading logged. Overall status: ${TEXT[r.overall] || r.overall}.`;
  renderAll();
  if (r.escalate) $('#escalation').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const rnd = (a, b, step = 1) => Math.round((a + Math.random() * (b - a)) / step) * step;
function simulated(drift = Math.random() < 0.4) {
  const r = {
    systolic: rnd(102, 116), diastolic: rnd(64, 76), heartRate: rnd(62, 84), glucose: rnd(82, 112),
    temperature: Number(rnd(36.6, 37.2, 0.1).toFixed(1)), sleepHours: rnd(7, 8.5, 0.5), mood: rnd(4, 5), symptoms: [],
  };
  if (drift) {
    const pick = ['heartRate', 'sleepHours', 'systolic', 'mood', 'temperature', 'glucose'][rnd(0, 5)];
    if (pick === 'heartRate') r.heartRate = rnd(104, 126);
    if (pick === 'sleepHours') r.sleepHours = rnd(4, 6.5, 0.5);
    if (pick === 'systolic') { r.systolic = rnd(126, 146); r.diastolic = rnd(82, 92); }
    if (pick === 'mood') { r.mood = rnd(1, 3); r.symptoms = ['fatigue']; }
    if (pick === 'temperature') { r.temperature = Number(rnd(37.5, 38.3, 0.1).toFixed(1)); r.symptoms = ['headache', 'fatigue']; }
    if (pick === 'glucose') r.glucose = rnd(145, 190);
  }
  return r;
}

function fillForm(r) {
  const form = $('#readingForm');
  FIELDS.forEach((f) => { form.elements[f].value = r[f] ?? ''; form.elements[f].removeAttribute('aria-invalid'); });
  form.querySelectorAll('input[name="mood"]').forEach((m) => { m.checked = Number(m.value) === r.mood; });
  form.querySelectorAll('input[name="symptoms"]').forEach((c) => { c.checked = r.symptoms.includes(c.value); });
  $('#formMsg').textContent = 'Simulated sensor values filled in. Press Log reading to save them.';
}

function loadDemoWeek() {
  const now = Date.now();
  state = { missionStart: now - 6 * DAY_MS - 3600000, history: [] };
  const story = [
    { sleepHours: 8, heartRate: 64, mood: 5 },
    { sleepHours: 7.5, heartRate: 66, mood: 4 },
    { sleepHours: 7, heartRate: 70, mood: 4 },
    { sleepHours: 6, heartRate: 78, mood: 3 },
    { sleepHours: 5.5, heartRate: 92, mood: 3, systolic: 128 },
    { sleepHours: 5, heartRate: 104, mood: 2, systolic: 134, symptoms: ['fatigue', 'headache'] },
    { sleepHours: 4.5, heartRate: 112, mood: 2, systolic: 138, diastolic: 88, temperature: 37.6, symptoms: ['fatigue', 'headache', 'dizziness'] },
  ];
  story.forEach((s, i) => {
    const base = simulated(false);
    addEntry({ ...base, ...s, symptoms: s.symptoms || [] }, state.missionStart + i * DAY_MS + 3600000 * 9);
  });
  selectedOrgan = 'heart';
  $('#formMsg').textContent = 'Loaded a 7-day demo: sleep loss and rising heart rate over the week.';
  renderAll();
}

/* ---------- export ---------- */
function exportCsv() {
  const base = engine.evaluateIndicators({}).indicators;
  const head = ['timestamp', 'mission_day', ...base.flatMap((b) => [`${b.id}_${b.unit.replace(/[^a-zA-Z0-9]/g, '') || 'value'}`, `${b.id}_status`]), 'symptoms', 'overall', 'escalate'];
  const rows = state.history.map((h) => {
    const r = evaluate(h.readings);
    const cells = [new Date(h.t).toISOString(), h.missionDay];
    base.forEach((b) => {
      const ind = r.indicators.find((x) => x.id === b.id);
      cells.push(ind && ind.value !== null && ind.value !== undefined ? ind.value : '', ind ? ind.status : 'UNKNOWN');
    });
    cells.push((h.readings.symptoms || []).join(' '), r.overall, r.escalate);
    return cells;
  });
  const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `astronaut-vitals-day${missionDay()}.csv`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
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
  $('#readingForm').reset();
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
    organs[id] = info || { name: id, function: '', indicatorIds: [], hazards: [] };
    names[id] = organs[id].name;
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
}

init();
