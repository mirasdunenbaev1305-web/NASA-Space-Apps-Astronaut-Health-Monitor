// STUB ENGINE — temporary stand-in for src/engine/evaluate.js (owned by AI 2).
// Returns data in exactly the shape defined in CONTRACT.md so the UI can be built
// and demoed before the real engine lands. The UI loads the real engine
// automatically once src/engine/evaluate.js exists (see src/ui/engine.js).
// Thresholds here are placeholders, NOT the project's reviewed values.
// AI-generated code (Claude) — see README "AI tools used".

const T = {
  systolic:    { label: 'Systolic BP',  unit: 'mmHg',  normal: [90, 129],   watch: [85, 139] },
  diastolic:   { label: 'Diastolic BP', unit: 'mmHg',  normal: [60, 84],    watch: [55, 89] },
  heartRate:   { label: 'Heart rate',   unit: 'bpm',   normal: [50, 100],   watch: [45, 110] },
  glucose:     { label: 'Blood glucose', unit: 'mg/dL', normal: [70, 110],  watch: [60, 140] },
  temperature: { label: 'Body temperature', unit: '°C', normal: [36.1, 37.4], watch: [35.5, 38.0] },
  sleepHours:  { label: 'Sleep (24 h)', unit: 'h',     normal: [6.5, 9],    watch: [5.5, 10] },
  mood:        { label: 'Mood',         unit: '/5',    normal: [3, 5],      watch: [2, 5] },
  spo2:        { label: 'Blood oxygen (SpO₂)', unit: '%', normal: [95, 100], watch: [92, 100] },
  exerciseMinutes: { label: 'Exercise today', unit: 'min', normal: [60, 300], watch: [30, 300] },
};

const ORDER = ['NORMAL', 'UNKNOWN', 'WATCH', 'ALERT'];
const worst = (a, b) => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b);

function statusFor(id, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'UNKNOWN';
  const t = T[id];
  const v = Number(value);
  if (v >= t.normal[0] && v <= t.normal[1]) return 'NORMAL';
  if (v >= t.watch[0] && v <= t.watch[1]) return 'WATCH';
  return 'ALERT';
}

export function evaluateIndicators(readings = {}) {
  const indicators = Object.keys(T).map((id) => {
    const t = T[id];
    const raw = readings[id];
    const value = raw === null || raw === undefined || raw === '' ? null : Number(raw);
    return {
      id,
      label: t.label,
      value,
      unit: t.unit,
      status: statusFor(id, value),
      threshold: `${t.normal[0]}–${t.normal[1]} ${t.unit}`,
    };
  });
  const measured = indicators.filter((i) => i.status !== 'UNKNOWN');
  const overall = measured.length ? measured.reduce((acc, i) => worst(acc, i.status), 'NORMAL') : 'UNKNOWN';
  const watchCount = indicators.filter((i) => i.status === 'WATCH').length;
  const escalate = indicators.some((i) => i.status === 'ALERT') || watchCount >= 2;
  return { indicators, overall, escalate };
}

const GUIDANCE = {
  systolic:    ['Rest seated for 5 minutes and re-measure.', 'Limit sodium and stay hydrated.', 'Report the trend at the next medical conference.'],
  diastolic:   ['Rest seated for 5 minutes and re-measure.', 'Check fluid intake and recent exertion.', 'Report the trend at the next medical conference.'],
  heartRate:   ['Hydrate and rest for 15 minutes, then re-measure.', 'Avoid strenuous tasks until the rate normalizes.', 'Note any palpitations or dizziness.'],
  glucose:     ['Re-test before the next meal.', 'Review recent meals against the mission menu.', 'Keep a fast-acting carbohydrate nearby if low.'],
  temperature: ['Re-measure in 30 minutes.', 'Hydrate and check cabin temperature.', 'Watch for other infection symptoms.'],
  sleepHours:  ['Protect the next sleep period; dim lights 1 hour before.', 'Limit caffeine in the 6 hours before sleep.', 'Check noise and CO₂ levels in the sleep station.'],
  spo2:        ['Rest and recheck with the pulse oximeter.', 'Check cabin air readings.', 'Tell the crew medical officer if it stays low.'],
  exerciseMinutes: ['Plan the missed exercise into the next work period.', 'Report pain or schedule conflicts to the crew medical officer.'],
  mood:        ['Take a short break and contact family or a crewmate.', 'Schedule a check-in with the crew psychologist.', 'Keep exercise and sleep routines regular.'],
};

export function getGuidance(indicatorId, status) {
  if (status !== 'WATCH' && status !== 'ALERT') return null;
  const t = T[indicatorId];
  if (!t) return null;
  const steps = [...(GUIDANCE[indicatorId] || [])];
  if (status === 'ALERT') steps.unshift('Contact the flight surgeon on the ground.');
  return {
    title: `${t.label}: ${status === 'ALERT' ? 'action needed' : 'keep an eye on it'}`,
    steps,
    disclaimer: 'Decision support, not a medical diagnosis.',
  };
}

const ORGANS = {
  brain:  { name: 'Brain & nervous system', function: 'Controls thinking, balance and sleep cycles.', indicatorIds: ['sleepHours', 'systolic'], hazards: ['Space radiation', 'Isolation and confinement'] },
  heart:  { name: 'Heart', function: 'Pumps blood; adapts to fluid shifts in microgravity.', indicatorIds: ['heartRate', 'systolic', 'diastolic'], hazards: ['Gravity fields', 'Space radiation'] },
  lungs:  { name: 'Lungs', function: 'Exchange oxygen and CO₂ with the cabin air.', indicatorIds: ['spo2'], hazards: ['Hostile closed environment'] },
  bones:  { name: 'Bones & muscles', function: 'Support the body; lose density without gravity loading.', indicatorIds: ['exerciseMinutes'], hazards: ['Gravity fields', 'Distance from Earth'] },
  gut:    { name: 'Digestive system', function: 'Absorbs nutrients and regulates blood sugar.', indicatorIds: ['glucose'], hazards: ['Distance from Earth', 'Hostile closed environment'] },
  immune: { name: 'Immune system', function: 'Defends against infection; weakens on long missions.', indicatorIds: ['temperature'], hazards: ['Space radiation', 'Hostile closed environment'] },
  mood:   { name: 'Mood & behavior', function: 'Emotional wellbeing and crew cohesion.', indicatorIds: ['mood', 'sleepHours'], hazards: ['Isolation and confinement', 'Distance from Earth'] },
};

export function getOrganInfo(organId) {
  return ORGANS[organId] || null;
}
