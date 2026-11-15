// Thresholds mirrored from config/thresholds.json for native browser modules.
// Keep both definitions in sync; tests/evaluate.test.mjs enforces parity.
// Demo thresholds, verify with medical sources. These are not clinical criteria.
export const THRESHOLDS = {
  systolic: {
    label: 'Systolic blood pressure',
    unit: 'mmHg',
    validRange: { min: 0, max: 300 },
    normal: [{ min: 90, max: 120, maxExclusive: true }],
    watch: [{ min: 120, max: 140, maxExclusive: true }],
    alert: [{ min: 0, max: 90, maxExclusive: true }, { min: 140, max: 300 }],
    threshold: '90–119 mmHg'
  },
  diastolic: {
    label: 'Diastolic blood pressure',
    unit: 'mmHg',
    validRange: { min: 0, max: 200 },
    normal: [{ min: 60, max: 80, maxExclusive: true }],
    watch: [{ min: 80, max: 90, maxExclusive: true }],
    alert: [{ min: 0, max: 60, maxExclusive: true }, { min: 90, max: 200 }],
    threshold: '60–79 mmHg'
  },
  heartRate: {
    label: 'Heart rate',
    unit: 'bpm',
    validRange: { min: 0, max: 300 },
    normal: [{ min: 60, max: 100 }],
    watch: [{ min: 50, max: 60, maxExclusive: true }, { min: 100, max: 120, minExclusive: true }],
    alert: [{ min: 0, max: 50, maxExclusive: true }, { min: 120, max: 300, minExclusive: true }],
    threshold: '60–100 bpm'
  },
  glucose: {
    label: 'Blood glucose',
    unit: 'mg/dL',
    validRange: { min: 0, max: 1000 },
    normal: [{ min: 70, max: 140 }],
    watch: [{ min: 54, max: 70, maxExclusive: true }, { min: 140, max: 200, minExclusive: true, maxExclusive: true }],
    alert: [{ min: 0, max: 54, maxExclusive: true }, { min: 200, max: 1000 }],
    threshold: '70–140 mg/dL'
  },
  temperature: {
    label: 'Body temperature',
    unit: '°C',
    validRange: { min: 25, max: 45 },
    normal: [{ min: 36.5, max: 37.4, maxExclusive: true }],
    watch: [{ min: 35, max: 36.5, maxExclusive: true }, { min: 37.4, max: 38, maxExclusive: true }],
    alert: [{ min: 25, max: 35, maxExclusive: true }, { min: 38, max: 45 }],
    threshold: '36.5–37.3 °C'
  },
  sleepHours: {
    label: 'Sleep in the last 24 hours',
    unit: 'h',
    validRange: { min: 0, max: 24 },
    normal: [{ min: 7, max: 24 }],
    watch: [{ min: 5, max: 7, maxExclusive: true }],
    alert: [{ min: 0, max: 5, maxExclusive: true }],
    threshold: '7–24 h'
  },
  mood: {
    label: 'Mood self-rating',
    unit: '/5',
    validRange: { min: 1, max: 5, integer: true },
    normal: [{ min: 4, max: 5 }],
    watch: [{ min: 3, max: 3 }],
    alert: [{ min: 1, max: 2 }],
    threshold: '4–5 /5'
  }
};
