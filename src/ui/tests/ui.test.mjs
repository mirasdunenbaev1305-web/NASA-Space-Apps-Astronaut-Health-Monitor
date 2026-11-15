// UI tests (AI 1). Run from the project root:
//   node --test src/ui/tests/
// Node 22+; no dependencies. Covers the pure UI logic, the contract stubs, static
// wiring of the page, and — when src/engine/evaluate.js exists — compatibility of
// the real engine's output with the UI. AI-generated code (Claude).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  DAY_MS, MAX_HISTORY, FIELDS, worstStatus, hazardText, rangeText, parseRange, organStatuses, validateField,
  hasAnyMeasurement, missionDayOf, sanitizeState, simulated, demoWeek, buildCsv, escapeHtml, normStatus,
} from '../logic.js';
import * as stubs from '../stubs.js';
import { ORGAN_IDS } from '../body.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const INDICATOR_IDS = ['systolic', 'diastolic', 'heartRate', 'glucose', 'temperature', 'sleepHours', 'mood', 'spo2', 'exerciseMinutes'];
const STATUSES = ['NORMAL', 'WATCH', 'ALERT', 'UNKNOWN'];

// Deterministic random numbers for repeatable tests.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Form limits straight from index.html, so simulated values are always accepted by the form.
const html = read('index.html');
const LIMITS = Object.fromEntries(FIELDS.map((f) => {
  const m = html.match(new RegExp(`name="${f}"[^>]*min="([\\d.]+)" max="([\\d.]+)"`));
  assert.ok(m, `index.html has min/max for ${f}`);
  return [f, [Number(m[1]), Number(m[2])]];
}));

/* ---------------- parseRange ---------------- */
test('parseRange reads the short contract format', () => {
  assert.deepEqual(parseRange('60–100 bpm'), [60, 100]);
  assert.deepEqual(parseRange('36.1–37.4 °C'), [36.1, 37.4]);
  assert.deepEqual(parseRange('90-129 mmHg'), [90, 129]);
});

test('parseRange prefers the NORMAL band in the engine\'s long format', () => {
  assert.deepEqual(parseRange('Demo: NORMAL 90–119; WATCH 120–139; ALERT <90 or ≥140 mmHg'), [90, 119]);
  assert.deepEqual(parseRange('Demo adult band: NORMAL ≥7; WATCH 5–6.9; ALERT <5 h per 24 h')[0], 7);
  assert.deepEqual(parseRange('Demo self-rating only: NORMAL 4–5; WATCH 3; ALERT 1–2'), [4, 5]);
  assert.deepEqual(parseRange('Demo only, meal/fasting context required: NORMAL 70–140; WATCH 54–69'), [70, 140]);
});

test('parseRange returns null when there is no usable band', () => {
  for (const v of [undefined, null, '', 'no numbers', 'NORMAL', '100–60 bpm']) assert.equal(parseRange(v), null, String(v));
});

/* ---------------- text helpers ---------------- */
test('hazardText turns engine ids into readable names and keeps plain text', () => {
  assert.equal(hazardText('spaceRadiation'), 'Space radiation');
  assert.equal(hazardText('hostileClosedEnvironments'), 'Hostile closed environments');
  assert.equal(hazardText('Isolation and confinement'), 'Isolation and confinement');
  assert.equal(hazardText('someNewHazard'), 'Some New Hazard');
  assert.equal(hazardText(undefined), '');
});

test('rangeText does not double the NORMAL label', () => {
  assert.equal(rangeText('60–100 bpm'), 'Normal: 60–100 bpm');
  assert.equal(rangeText('Demo: NORMAL 60–79; WATCH 80–89'), 'Demo: NORMAL 60–79; WATCH 80–89');
  assert.equal(rangeText(undefined), '');
});

test('escapeHtml neutralises markup in engine-provided names', () => {
  assert.equal(escapeHtml('<b>"Heart" & \'lungs\'</b>'), '&lt;b&gt;&quot;Heart&quot; &amp; &#39;lungs&#39;&lt;/b&gt;');
});

/* ---------------- statuses ---------------- */
test('worstStatus ranks ALERT > WATCH > NORMAL > UNKNOWN', () => {
  assert.equal(worstStatus([]), 'UNKNOWN');
  assert.equal(worstStatus(['UNKNOWN', 'UNKNOWN']), 'UNKNOWN');
  assert.equal(worstStatus(['UNKNOWN', 'NORMAL']), 'NORMAL');
  assert.equal(worstStatus(['NORMAL', 'WATCH', 'NORMAL']), 'WATCH');
  assert.equal(worstStatus(['WATCH', 'ALERT', 'NORMAL']), 'ALERT');
  assert.equal(worstStatus(['weird', 'NORMAL']), 'NORMAL');
  assert.equal(normStatus('normal'), 'UNKNOWN', 'statuses are case-sensitive per contract');
});

test('organStatuses uses the worst related indicator and handles areas without indicators', () => {
  const organs = { heart: { indicatorIds: ['heartRate', 'systolic'] }, lungs: { indicatorIds: [] }, gut: {} };
  const result = { indicators: [{ id: 'heartRate', status: 'WATCH' }, { id: 'systolic', status: 'NORMAL' }] };
  const { out, byId } = organStatuses(result, organs, ['heart', 'lungs', 'gut', 'missing']);
  assert.deepEqual(out, { heart: 'WATCH', lungs: 'UNKNOWN', gut: 'UNKNOWN', missing: 'UNKNOWN' });
  assert.equal(byId.heartRate.status, 'WATCH');
  assert.deepEqual(organStatuses(null, organs, ['heart']).out, { heart: 'UNKNOWN' });
});

/* ---------------- form validation ---------------- */
test('validateField accepts empty, in-range and boundary values', () => {
  assert.deepEqual(validateField('', 20, 250), { value: null, invalid: false });
  assert.deepEqual(validateField('   ', 20, 250), { value: null, invalid: false });
  assert.deepEqual(validateField('72', 20, 250), { value: 72, invalid: false });
  assert.deepEqual(validateField(' 36.6 ', 30, 45), { value: 36.6, invalid: false });
  assert.deepEqual(validateField('20', 20, 250), { value: 20, invalid: false });
  assert.deepEqual(validateField('250', 20, 250), { value: 250, invalid: false });
});

test('validateField rejects out-of-range, non-numeric and unparseable input', () => {
  assert.equal(validateField('300', 20, 250).invalid, true);
  assert.equal(validateField('19.9', 20, 250).invalid, true);
  assert.equal(validateField('abc', 20, 250).invalid, true);
  assert.equal(validateField('Infinity', 20, 250).invalid, true);
  assert.equal(validateField('', 20, 250, true).invalid, true, 'browser badInput (e.g. "12.3.4") must not be silently ignored');
});

test('hasAnyMeasurement needs at least one vital sign or mood', () => {
  const empty = Object.fromEntries(FIELDS.map((f) => [f, null]));
  assert.equal(hasAnyMeasurement({ ...empty, mood: null, symptoms: ['headache'] }), false);
  assert.equal(hasAnyMeasurement({ ...empty, mood: 3 }), true);
  assert.equal(hasAnyMeasurement({ ...empty, heartRate: 0 }), true);
});

/* ---------------- mission time & storage ---------------- */
test('missionDayOf counts from day 1 and never goes below 1', () => {
  const start = Date.UTC(2026, 10, 1);
  assert.equal(missionDayOf(start, start), 1);
  assert.equal(missionDayOf(start + DAY_MS - 1, start), 1);
  assert.equal(missionDayOf(start + DAY_MS, start), 2);
  assert.equal(missionDayOf(start - 5 * DAY_MS, start), 1);
});

test('sanitizeState drops malformed stored data instead of crashing', () => {
  const now = 1_800_000_000_000;
  for (const bad of [null, 42, 'x', {}, { history: 'nope' }]) assert.deepEqual(sanitizeState(bad, now), { missionStart: now, history: [] });
  const s = sanitizeState({ missionStart: 'oops', history: [null, { t: 'x' }, { t: now }, { t: now, readings: { heartRate: 70, symptoms: 'headache' } }] }, now);
  assert.equal(s.missionStart, now);
  assert.equal(s.history.length, 1);
  assert.deepEqual(s.history[0].readings.symptoms, []);
  assert.equal(s.history[0].missionDay, 1);
});

test('sanitizeState keeps only the newest MAX_HISTORY readings', () => {
  const history = Array.from({ length: MAX_HISTORY + 25 }, (_, i) => ({ t: i, missionDay: 1, readings: {} }));
  const s = sanitizeState({ missionStart: 0, history });
  assert.equal(s.history.length, MAX_HISTORY);
  assert.equal(s.history[0].t, 25);
});

/* ---------------- simulation & demo ---------------- */
test('simulated values always pass the form\'s own limits', () => {
  for (let seed = 1; seed <= 500; seed += 1) {
    const r = simulated(undefined, seeded(seed));
    for (const f of FIELDS) {
      const { invalid } = validateField(String(r[f]), LIMITS[f][0], LIMITS[f][1]);
      assert.equal(invalid, false, `seed ${seed}: ${f}=${r[f]} outside ${LIMITS[f]}`);
    }
    assert.ok(Number.isInteger(r.mood) && r.mood >= 1 && r.mood <= 5, `seed ${seed}: mood ${r.mood}`);
    assert.ok(Array.isArray(r.symptoms));
  }
});

test('simulated(false) never drifts; simulated(true) always changes something', () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    const calm = simulated(false, seeded(seed));
    assert.deepEqual(calm.symptoms, []);
    assert.ok(calm.heartRate <= 84 && calm.sleepHours >= 7 && calm.mood >= 4, `seed ${seed}`);
    const drift = simulated(true, seeded(seed));
    const changed = drift.heartRate > 100 || drift.sleepHours < 7 || drift.systolic > 120 || drift.mood <= 3 || drift.temperature >= 37.5 || drift.glucose >= 145;
    assert.ok(changed, `seed ${seed}: drift produced no abnormal value`);
  }
});

test('demoWeek has 7 consecutive mission days and no reading in the future', () => {
  const now = Date.UTC(2026, 10, 15, 14, 30);
  const { missionStart, history } = demoWeek(now, seeded(7));
  assert.equal(history.length, 7);
  assert.deepEqual(history.map((h) => h.missionDay), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(history.every((h) => h.t <= now), 'no timestamps after now');
  assert.equal(history.at(-1).t, now);
  assert.equal(missionDayOf(now, missionStart), 7, 'header mission day matches the last reading');
  assert.ok(history[0].readings.sleepHours > history.at(-1).readings.sleepHours);
  assert.ok(history[0].readings.heartRate < history.at(-1).readings.heartRate);
});

/* ---------------- CSV export ---------------- */
test('buildCsv writes one row per reading with readable headers', () => {
  const { history } = demoWeek(Date.UTC(2026, 10, 15), seeded(3));
  const base = stubs.evaluateIndicators({}).indicators;
  const csv = buildCsv(history, stubs.evaluateIndicators, base);
  assert.ok(csv.startsWith('﻿'), 'BOM so Excel opens UTF-8 (°C) correctly');
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 1 + history.length);
  const header = lines[0].replace('﻿', '');
  assert.match(header, /"Heart rate \(bpm\)","Heart rate status"/);
  assert.match(header, /"Contact flight surgeon"$/);
  const cols = header.split('","').length;
  for (const line of lines.slice(1)) assert.equal(line.split('","').length, cols);
  assert.match(lines.at(-1), /"yes"$/, 'last demo day escalates');
  assert.match(lines.at(-1), /"Fatigue; Headache; Dizziness"/);
});

test('buildCsv quotes cells and blocks spreadsheet formulas', () => {
  const base = [{ id: 'x', label: 'X "quoted"', unit: 'u' }];
  const evaluate = () => ({ indicators: [{ id: 'x', value: '=HYPERLINK("http://evil")', status: 'NORMAL' }], overall: 'NORMAL', escalate: false });
  const csv = buildCsv([{ t: 0, missionDay: 1, readings: { symptoms: ['@cmd'] } }], evaluate, base);
  assert.match(csv, /"X ""quoted"" \(u\)"/);
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/evil""\)"/);
  assert.match(csv, /"'@cmd"/);
  const negative = buildCsv([{ t: 0, missionDay: 1, readings: {} }], () => ({ indicators: [{ id: 'x', value: -5, status: 'NORMAL' }], overall: 'NORMAL', escalate: false }), base);
  assert.match(negative, /"-5"/, 'negative numbers are not mangled');
});

/* ---------------- stub engine follows CONTRACT.md ---------------- */
function checkContract(engine, label) {
  const empty = engine.evaluateIndicators({});
  assert.deepEqual(empty.indicators.map((i) => i.id).sort(), [...INDICATOR_IDS].sort(), `${label}: indicator ids`);
  for (const i of empty.indicators) {
    assert.equal(i.status, 'UNKNOWN', `${label}: ${i.id} unmeasured → UNKNOWN`);
    for (const k of ['label', 'unit', 'threshold']) assert.equal(typeof i[k], 'string', `${label}: ${i.id}.${k}`);
    assert.ok(parseRange(i.threshold), `${label}: chart band parseable from "${i.threshold}"`);
  }
  assert.equal(empty.escalate, false);
  for (const id of ORGAN_IDS) {
    const o = engine.getOrganInfo(id);
    assert.ok(o, `${label}: organ ${id}`);
    assert.equal(typeof o.name, 'string');
    assert.ok(Array.isArray(o.indicatorIds) && o.indicatorIds.every((k) => INDICATOR_IDS.includes(k)), `${label}: ${id} indicatorIds`);
    assert.ok(Array.isArray(o.hazards));
    for (const h of o.hazards) assert.doesNotMatch(hazardText(h), /[a-z][A-Z]/, `${label}: hazard "${h}" renders readable`);
  }
  for (const s of ['NORMAL', 'UNKNOWN']) assert.equal(engine.getGuidance('heartRate', s), null);
  for (const id of INDICATOR_IDS) for (const s of ['WATCH', 'ALERT']) {
    const g = engine.getGuidance(id, s);
    assert.ok(g && typeof g.title === 'string' && Array.isArray(g.steps) && g.steps.length, `${label}: guidance ${id}/${s}`);
  }
}

test('stub engine matches CONTRACT.md', () => checkContract(stubs, 'stubs'));

test('stub engine escalation rule: any ALERT or 2+ WATCH', () => {
  const normal = { systolic: 115, diastolic: 75, heartRate: 70, glucose: 90, temperature: 36.8, sleepHours: 8, mood: 4 };
  assert.equal(stubs.evaluateIndicators(normal).escalate, false);
  assert.equal(stubs.evaluateIndicators(normal).overall, 'NORMAL');
  assert.equal(stubs.evaluateIndicators({ ...normal, heartRate: 105 }).escalate, false);
  assert.equal(stubs.evaluateIndicators({ ...normal, heartRate: 105, sleepHours: 6 }).escalate, true);
  assert.equal(stubs.evaluateIndicators({ ...normal, heartRate: 150 }).escalate, true);
  for (const i of stubs.evaluateIndicators(normal).indicators) assert.ok(STATUSES.includes(i.status));
});

/* ---------------- static wiring ---------------- */
test('every element app.js looks up exists in index.html', () => {
  const app = read('src/ui/app.js');
  const ids = [...app.matchAll(/\$\('#([\w-]+)/g)].map((m) => m[1]);
  assert.ok(ids.length > 10);
  for (const id of new Set(ids)) assert.match(html, new RegExp(`id="${id}"`), `#${id} missing in index.html`);
});

test('files referenced by the page, manifest and service worker exist', () => {
  const local = (u) => !/^https?:/.test(u);
  const pageRefs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map((m) => m[1]).filter(local);
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const swCore = [...read('sw.js').match(/const CORE = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).filter(local);
  for (const p of [...pageRefs, ...manifest.icons.map((i) => i.src), ...swCore]) {
    if (p === './' || p === '') continue;
    assert.ok(existsSync(join(ROOT, p.replace(/^\.\//, ''))), `${p} exists`);
  }
  assert.equal(manifest.start_url, './');
  assert.ok(manifest.icons.some((i) => i.sizes === '512x512'));
});

test('every UI module is cached for offline use', () => {
  const sw = read('sw.js');
  for (const f of ['app.js', 'engine.js', 'body.js', 'charts.js', 'stubs.js', 'logic.js']) assert.match(sw, new RegExp(`src/ui/${f.replace('.', '\\.')}`), `${f} precached`);
});

/* ---------------- real engine compatibility (after merging ai2-logic) ---------------- */
const enginePath = join(ROOT, 'src', 'engine', 'evaluate.js');
test('real engine output works with the UI', { skip: !existsSync(enginePath) && 'src/engine/evaluate.js not present on this branch' }, async () => {
  const engine = await import('../../engine/evaluate.js');
  checkContract(engine, 'engine');
  for (let seed = 1; seed <= 300; seed += 1) {
    const r = engine.evaluateIndicators(simulated(false, seeded(seed)));
    assert.equal(r.overall, 'NORMAL', `seed ${seed}: calm simulation should be all NORMAL: ${r.indicators.filter((i) => i.status !== 'NORMAL').map((i) => `${i.id}=${i.value}:${i.status}`)}`);
    assert.equal(r.escalate, false);
  }
  const { history } = demoWeek(Date.UTC(2026, 10, 15), seeded(11));
  assert.equal(engine.evaluateIndicators(history[0].readings).overall, 'NORMAL', 'demo day 1 is healthy');
  assert.equal(engine.evaluateIndicators(history.at(-1).readings).escalate, true, 'demo day 7 escalates');
});
