import { THRESHOLDS } from './thresholds.js';

const STATUS_RANK = { UNKNOWN: 0, NORMAL: 1, WATCH: 2, ALERT: 3 };
const STATUSES = ['normal', 'watch', 'alert'];
const DISCLAIMER = 'Decision support, not a medical diagnosis. Follow mission medical procedures and qualified clinician guidance.';

const guidance = {
  systolic: {
    WATCH: ['Repeat the measurement using the approved device and technique after following local rest instructions.', 'Record the value and conditions, then follow crew medical officer guidance.'],
    ALERT: ['Repeat only if mission procedures permit; do not delay required medical response.', 'Contact the flight surgeon or follow the mission medical escalation procedure.']
  },
  diastolic: {
    WATCH: ['Repeat the measurement using the approved device and technique after following local rest instructions.', 'Record the value and conditions, then follow crew medical officer guidance.'],
    ALERT: ['Repeat only if mission procedures permit; do not delay required medical response.', 'Contact the flight surgeon or follow the mission medical escalation procedure.']
  },
  heartRate: {
    WATCH: ['If safe and appropriate, pause activity and recheck after following crew measurement guidance.', 'Record symptoms and context; consult the crew medical officer if the reading persists or concerns you.'],
    ALERT: ['Follow mission medical procedures promptly; do not rely on this demo to assess urgency.', 'Contact the flight surgeon or crew medical officer, especially if symptoms are present.']
  },
  glucose: {
    WATCH: ['Check the approved measurement method and whether the reading was fasting or after a meal.', 'Follow your clinician-provided plan; this demo band cannot interpret glucose without context.'],
    ALERT: ['Use the mission-approved medical procedure and confirm the reading as directed.', 'Contact the flight surgeon or crew medical officer; do not change medication based on this demo.']
  },
  temperature: {
    WATCH: ['Recheck with the approved thermometer and technique.', 'Record symptoms and follow crew medical officer guidance if the reading persists.'],
    ALERT: ['Follow mission medical procedures promptly and report associated symptoms.', 'Contact the flight surgeon or crew medical officer; this demo cannot determine a cause.']
  },
  sleepHours: {
    WATCH: ['Log sleep timing and any schedule disruptions.', 'Use the mission-approved sleep plan and discuss persistent short sleep with the crew medical officer.'],
    ALERT: ['Notify the crew medical officer about repeated or severe sleep loss.', 'Follow mission fatigue-management procedures before safety-critical duties.']
  },
  mood: {
    WATCH: ['Consider a private check-in with a trusted crewmate or behavioral health support.', 'Track how you feel and use the mission-approved support resources.'],
    ALERT: ['Reach out promptly to the crew medical officer or behavioral health support.', 'If anyone may be in immediate danger, follow mission emergency procedures now.']
  },
  spo2: {
    WATCH: ['Rest, warm your hands and recheck with the approved pulse oximeter.', 'Note breathing symptoms and check cabin air readings; tell the crew medical officer if it stays low.'],
    ALERT: ['Follow the mission medical procedure for low oxygen saturation now.', 'Contact the flight surgeon or crew medical officer and report symptoms and cabin air readings.']
  },
  exerciseMinutes: {
    WATCH: ['Plan the missing resistance and treadmill time into the next work period.', 'Tell the crew medical officer if pain or schedule prevents exercise.'],
    ALERT: ['Bone and muscle loss in weightlessness depends on daily loading; restore the prescribed exercise plan.', 'Discuss repeated missed sessions with the flight surgeon and fitness team.']
  }
};

const organs = {
  brain: {
    name: 'Brain',
    function: 'Coordinates thinking, movement, sensation, and many body functions. This demo has no neurological exam.',
    indicatorIds: ['mood', 'sleepHours'],
    hazards: ['Space radiation', 'Isolation and confinement', 'Distance from Earth', 'Gravity fields']
  },
  heart: {
    name: 'Heart',
    function: 'Pumps blood through the body. The available readings show pulse and blood pressure only; they do not assess heart disease.',
    indicatorIds: ['heartRate', 'systolic', 'diastolic'],
    hazards: ['Space radiation', 'Gravity fields', 'Distance from Earth']
  },
  lungs: {
    name: 'Lungs',
    function: 'Exchange oxygen and carbon dioxide. A pulse-oximeter oxygen saturation reading is a simple check; it is not a full lung assessment.',
    indicatorIds: ['spo2'],
    hazards: ['Hostile/closed environments', 'Distance from Earth']
  },
  bones: {
    name: 'Bones and skeleton',
    function: 'Provide structure and protect organs. In weightlessness bones lose density without daily loading exercise; this demo tracks exercise minutes, not bone density.',
    indicatorIds: ['exerciseMinutes'],
    hazards: ['Gravity fields', 'Distance from Earth']
  },
  gut: {
    name: 'Digestive system',
    function: 'Processes food and absorbs nutrients. A single glucose entry does not assess digestion or nutrition.',
    indicatorIds: ['glucose'],
    hazards: ['Hostile/closed environments', 'Distance from Earth']
  },
  immune: {
    name: 'Immune system',
    function: 'Helps defend the body against infection. Temperature and symptoms are not a complete immune assessment.',
    indicatorIds: ['temperature'],
    hazards: ['Space radiation', 'Isolation and confinement', 'Hostile/closed environments', 'Distance from Earth']
  },
  mood: {
    name: 'Mood and behavioral health',
    function: 'A brief self-rating can support reflection, but it is not a mental health screening or diagnosis.',
    indicatorIds: ['mood', 'sleepHours'],
    hazards: ['Isolation and confinement', 'Distance from Earth', 'Hostile/closed environments']
  }
};

function isValidValue(value, definition) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  if (value < definition.validRange.min || value > definition.validRange.max) return false;
  if (definition.validRange.integer && !Number.isInteger(value)) return false;
  return true;
}

function matches(value, ranges) {
  return ranges.some(({ min, max, minExclusive = false, maxExclusive = false }) => {
    const aboveMin = minExclusive ? value > min : value >= min;
    const belowMax = maxExclusive ? value < max : value <= max;
    return aboveMin && belowMax;
  });
}

function classify(value, definition) {
  for (const status of STATUSES) {
    if (matches(value, definition[status])) return status.toUpperCase();
  }
  return 'UNKNOWN';
}

/** Evaluate the numeric readings described in CONTRACT.md. */
export function evaluateIndicators(readings = {}) {
  const safeReadings = readings && typeof readings === 'object' && !Array.isArray(readings) ? readings : {};
  const indicators = Object.entries(THRESHOLDS).map(([id, definition]) => {
    const rawValue = safeReadings[id];
    const valid = isValidValue(rawValue, definition);
    return {
      id,
      label: definition.label,
      value: valid ? rawValue : null,
      unit: definition.unit,
      status: valid ? classify(rawValue, definition) : 'UNKNOWN',
      threshold: definition.threshold
    };
  });

  const overall = indicators.reduce((worst, item) =>
    STATUS_RANK[item.status] > STATUS_RANK[worst] ? item.status : worst, 'UNKNOWN');
  const watchCount = indicators.filter((item) => item.status === 'WATCH').length;
  const escalate = indicators.some((item) => item.status === 'ALERT') || watchCount >= 2;

  return { indicators, overall, escalate };
}

/** Return concise demo guidance for WATCH/ALERT only. */
export function getGuidance(indicatorId, status) {
  const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : '';
  if (!['WATCH', 'ALERT'].includes(normalizedStatus)) return null;
  if (!Object.hasOwn(guidance, indicatorId) || !Object.hasOwn(THRESHOLDS, indicatorId)) return null;
  const steps = guidance[indicatorId]?.[normalizedStatus];
  if (!steps) return null;
  return {
    title: `${THRESHOLDS[indicatorId].label}: ${normalizedStatus}`,
    steps: [...steps],
    disclaimer: DISCLAIMER
  };
}

/** Return static educational context for a supported organ ID, or null. */
export function getOrganInfo(organId) {
  if (!Object.hasOwn(organs, organId)) return null;
  const info = organs[organId];
  return info ? { ...info, indicatorIds: [...info.indicatorIds], hazards: [...info.hazards] } : null;
}
