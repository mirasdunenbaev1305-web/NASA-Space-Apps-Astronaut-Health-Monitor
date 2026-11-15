// Pure UI helpers (no DOM) so they can be unit-tested with `node --test`.
// Medical status rules live in the engine (src/engine/); nothing here decides
// whether a value is normal. AI-generated code (Claude) — see README "AI tools used".

export const DAY_MS = 86400000;
export const MAX_HISTORY = 1000;
export const FIELDS = ['systolic', 'diastolic', 'heartRate', 'glucose', 'temperature', 'sleepHours'];
export const ICON = { NORMAL: '✓', WATCH: '!', ALERT: '✕', UNKNOWN: '?' };
export const TEXT = { NORMAL: 'Normal', WATCH: 'Watch', ALERT: 'Alert', UNKNOWN: 'No data' };
export const RANK = { UNKNOWN: -1, NORMAL: 0, WATCH: 1, ALERT: 2 };
export const SYMPTOM_TEXT = { headache: 'Headache', dizziness: 'Dizziness', nausea: 'Nausea', jointPain: 'Joint pain', fatigue: 'Fatigue' };
const HAZARD_TEXT = {
  spaceRadiation: 'Space radiation',
  isolationConfinement: 'Isolation and confinement',
  distanceFromEarth: 'Distance from Earth',
  gravityFields: 'Gravity fields',
  hostileClosedEnvironments: 'Hostile closed environments',
};

export const normStatus = (s) => (Object.hasOwn(TEXT, s) ? s : 'UNKNOWN');

/** Worst status in a list; UNKNOWN only if nothing was measured. */
export function worstStatus(list) {
  return (list || []).map(normStatus).reduce((acc, s) => (RANK[s] > RANK[acc] ? s : acc), 'UNKNOWN');
}

/** Hazard ids ("spaceRadiation") or plain text → readable text. */
export function hazardText(h) {
  if (Object.hasOwn(HAZARD_TEXT, h)) return HAZARD_TEXT[h];
  return String(h ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

/** Text under an indicator value. */
export function rangeText(t) {
  if (t === null || t === undefined || t === '') return '';
  return /NORMAL/i.test(String(t)) ? String(t) : `Normal: ${t}`;
}

const NUM = '(-?\\d+(?:\\.\\d+)?)';
/**
 * Normal band for charts, parsed from the contract's threshold text.
 * Accepts "60–100 bpm", "NORMAL 60–100; WATCH …" and "NORMAL ≥7; …" (open upper end).
 */
export function parseRange(text) {
  const s = String(text ?? '');
  let m = s.match(new RegExp(`NORMAL\\s*${NUM}\\s*[–—-]\\s*${NUM}`, 'i'));
  if (m) return [Number(m[1]), Number(m[2])];
  m = s.match(new RegExp(`NORMAL\\s*(?:≥|>=|>)\\s*${NUM}`, 'i'));
  if (m) { const lo = Number(m[1]); return [lo, lo * 1.4]; }
  m = s.match(new RegExp(`${NUM}\\s*[–—-]\\s*${NUM}`));
  if (!m) return null;
  const a = Number(m[1]); const b = Number(m[2]);
  return a <= b ? [a, b] : null;
}

/** Status of each body area = worst status of its indicators. */
export function organStatuses(result, organs, organIds) {
  const byId = {};
  ((result && result.indicators) || []).forEach((i) => { byId[i.id] = i; });
  const out = {};
  organIds.forEach((id) => {
    const ids = (organs[id] && Array.isArray(organs[id].indicatorIds)) ? organs[id].indicatorIds : [];
    out[id] = worstStatus(ids.map((k) => (byId[k] ? byId[k].status : 'UNKNOWN')));
  });
  return { out, byId };
}

/**
 * Validate one numeric form field. `badInput` is the browser's flag for text that
 * a number input could not parse (its value is then "").
 */
export function validateField(raw, min, max, badInput = false) {
  if (badInput) return { value: null, invalid: true };
  const s = String(raw ?? '').trim();
  if (s === '') return { value: null, invalid: false };
  const v = Number(s);
  if (!Number.isFinite(v) || v < min || v > max) return { value: null, invalid: true };
  return { value: v, invalid: false };
}

export function hasAnyMeasurement(readings) {
  return FIELDS.some((f) => readings[f] !== null && readings[f] !== undefined) || (readings.mood !== null && readings.mood !== undefined);
}

export const missionDayOf = (t, start) => Math.max(1, Math.floor((t - start) / DAY_MS) + 1);

/** Restore stored state, dropping anything malformed. */
export function sanitizeState(parsed, now = Date.now()) {
  const empty = { missionStart: now, history: [] };
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.history)) return empty;
  const start = Number.isFinite(parsed.missionStart) ? parsed.missionStart : now;
  const history = parsed.history
    .filter((h) => h && Number.isFinite(h.t) && h.readings && typeof h.readings === 'object')
    .map((h) => ({
      t: h.t,
      missionDay: Number.isFinite(h.missionDay) ? h.missionDay : missionDayOf(h.t, start),
      readings: { ...h.readings, symptoms: Array.isArray(h.readings.symptoms) ? h.readings.symptoms : [] },
    }))
    .slice(-MAX_HISTORY);
  return { missionStart: start, history };
}

const rnd = (rand, a, b, step = 1) => Math.round((a + rand() * (b - a)) / step) * step;
const dec = (x) => Number(x.toFixed(1));

/** Simulated sensor values. drift=false stays inside typical normal ranges. */
export function simulated(drift, rand = Math.random) {
  const doDrift = drift === undefined ? rand() < 0.4 : drift;
  const r = {
    systolic: rnd(rand, 102, 116), diastolic: rnd(rand, 64, 76), heartRate: rnd(rand, 62, 84), glucose: rnd(rand, 82, 112),
    temperature: dec(rnd(rand, 36.6, 37.2, 0.1)), sleepHours: rnd(rand, 7, 8.5, 0.5), mood: rnd(rand, 4, 5), symptoms: [],
  };
  if (doDrift) {
    const pick = ['heartRate', 'sleepHours', 'systolic', 'mood', 'temperature', 'glucose'][Math.min(5, Math.floor(rand() * 6))];
    if (pick === 'heartRate') r.heartRate = rnd(rand, 104, 126);
    if (pick === 'sleepHours') r.sleepHours = rnd(rand, 4, 6.5, 0.5);
    if (pick === 'systolic') { r.systolic = rnd(rand, 126, 146); r.diastolic = rnd(rand, 82, 92); }
    if (pick === 'mood') { r.mood = rnd(rand, 1, 3); r.symptoms = ['fatigue']; }
    if (pick === 'temperature') { r.temperature = dec(rnd(rand, 37.5, 38.3, 0.1)); r.symptoms = ['headache', 'fatigue']; }
    if (pick === 'glucose') r.glucose = rnd(rand, 145, 190);
  }
  return r;
}

const DEMO_STORY = [
  { sleepHours: 8, heartRate: 64, mood: 5 },
  { sleepHours: 7.5, heartRate: 66, mood: 4 },
  { sleepHours: 7, heartRate: 70, mood: 4 },
  { sleepHours: 6, heartRate: 78, mood: 3 },
  { sleepHours: 5.5, heartRate: 92, mood: 3, systolic: 128 },
  { sleepHours: 5, heartRate: 104, mood: 2, systolic: 134, symptoms: ['fatigue', 'headache'] },
  { sleepHours: 4.5, heartRate: 112, mood: 2, systolic: 138, diastolic: 88, temperature: 37.6, symptoms: ['fatigue', 'headache', 'dizziness'] },
];

/** 7 days of readings ending now (never in the future): sleep loss, rising heart rate. */
export function demoWeek(now = Date.now(), rand = Math.random) {
  const n = DEMO_STORY.length;
  const missionStart = now - (n - 1) * DAY_MS - 3600000;
  const history = DEMO_STORY.map((s, i) => {
    const t = now - (n - 1 - i) * DAY_MS;
    return { t, missionDay: missionDayOf(t, missionStart), readings: { ...simulated(false, rand), ...s, symptoms: s.symptoms || [] } };
  });
  return { missionStart, history };
}

const csvCell = (c) => {
  let s = String(c ?? '');
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s)) s = `'${s}`; // block spreadsheet formulas
  return `"${s.replace(/"/g, '""')}"`;
};

/** CSV of the full history, statuses re-evaluated by the engine. */
export function buildCsv(history, evaluate, baseIndicators) {
  const head = ['Timestamp (UTC)', 'Mission day',
    ...baseIndicators.flatMap((b) => [`${b.label} (${b.unit})`, `${b.label} status`]),
    'Symptoms', 'Overall', 'Contact flight surgeon'];
  const rows = history.map((h) => {
    const r = evaluate(h.readings);
    const cells = [new Date(h.t).toISOString(), h.missionDay];
    baseIndicators.forEach((b) => {
      const ind = (r.indicators || []).find((x) => x.id === b.id);
      cells.push(ind && ind.value !== null && ind.value !== undefined ? ind.value : '', ind ? normStatus(ind.status) : 'UNKNOWN');
    });
    cells.push((h.readings.symptoms || []).map((s) => SYMPTOM_TEXT[s] || s).join('; '), normStatus(r.overall), r.escalate ? 'yes' : 'no');
    return cells;
  });
  return `﻿${[head, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
