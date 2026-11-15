import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateIndicators, getGuidance, getOrganInfo } from '../src/engine/evaluate.js';

const normalReadings = {
  systolic: 110,
  diastolic: 70,
  heartRate: 72,
  glucose: 90,
  temperature: 36.8,
  sleepHours: 7.5,
  mood: 4,
  symptoms: []
};

test('normal example returns all seven indicators and no escalation', () => {
  const result = evaluateIndicators(normalReadings);
  assert.equal(result.indicators.length, 7);
  assert.equal(result.overall, 'NORMAL');
  assert.equal(result.escalate, false);
  assert.ok(result.indicators.every(({ status }) => status === 'NORMAL'));
});

test('contract example has a normal heart-rate indicator', () => {
  const { indicators } = evaluateIndicators({ ...normalReadings, heartRate: 70 });
  assert.equal(indicators.find(({ id }) => id === 'heartRate')?.status, 'NORMAL');
});

test('classifies WATCH and ALERT boundaries inclusively', () => {
  assert.equal(evaluateIndicators({ ...normalReadings, systolic: 120 }).indicators[0].status, 'WATCH');
  assert.equal(evaluateIndicators({ ...normalReadings, systolic: 119.5 }).indicators[0].status, 'NORMAL');
  assert.equal(evaluateIndicators({ ...normalReadings, systolic: 139.5 }).indicators[0].status, 'WATCH');
  assert.equal(evaluateIndicators({ ...normalReadings, diastolic: 80 }).indicators[1].status, 'WATCH');
  assert.equal(evaluateIndicators({ ...normalReadings, heartRate: 121 }).indicators[2].status, 'ALERT');
  assert.equal(evaluateIndicators({ ...normalReadings, glucose: 53 }).indicators[3].status, 'ALERT');
  assert.equal(evaluateIndicators({ ...normalReadings, temperature: 38 }).indicators[4].status, 'ALERT');
  assert.equal(evaluateIndicators({ ...normalReadings, temperature: 37.35 }).indicators[4].status, 'NORMAL');
  assert.equal(evaluateIndicators({ ...normalReadings, temperature: 37.5 }).indicators[4].status, 'WATCH');
  assert.equal(evaluateIndicators({ ...normalReadings, sleepHours: 4.9 }).indicators[5].status, 'ALERT');
  assert.equal(evaluateIndicators({ ...normalReadings, mood: 2 }).indicators[6].status, 'ALERT');
});

test('any ALERT escalates', () => {
  const result = evaluateIndicators({ ...normalReadings, heartRate: 130 });
  assert.equal(result.overall, 'ALERT');
  assert.equal(result.escalate, true);
});

test('two WATCH indicators escalate, one WATCH does not', () => {
  const oneWatch = evaluateIndicators({ ...normalReadings, sleepHours: 6 });
  const twoWatch = evaluateIndicators({ ...normalReadings, sleepHours: 6, mood: 3 });
  assert.equal(oneWatch.escalate, false);
  assert.equal(twoWatch.escalate, true);
  assert.equal(twoWatch.overall, 'WATCH');
});

test('missing and null values are UNKNOWN and excluded from escalation', () => {
  const result = evaluateIndicators({ heartRate: null });
  assert.equal(result.indicators.find(({ id }) => id === 'heartRate')?.status, 'UNKNOWN');
  assert.equal(result.indicators.find(({ id }) => id === 'heartRate')?.value, null);
  assert.equal(result.overall, 'UNKNOWN');
  assert.equal(result.escalate, false);
});

test('invalid types, non-finite values, and out-of-range values become UNKNOWN', () => {
  const result = evaluateIndicators({ heartRate: '70', glucose: Number.NaN, mood: 6, temperature: 36.8 });
  assert.equal(result.indicators.find(({ id }) => id === 'heartRate')?.status, 'UNKNOWN');
  assert.equal(result.indicators.find(({ id }) => id === 'glucose')?.status, 'UNKNOWN');
  assert.equal(result.indicators.find(({ id }) => id === 'mood')?.status, 'UNKNOWN');
  assert.equal(result.indicators.find(({ id }) => id === 'temperature')?.status, 'NORMAL');
});

test('empty, null, and malformed readings objects are handled safely', () => {
  for (const input of [undefined, null, [], 'invalid']) {
    const result = evaluateIndicators(input);
    assert.equal(result.indicators.length, 7);
    assert.equal(result.overall, 'UNKNOWN');
    assert.equal(result.escalate, false);
  }
});

test('guidance exists only for supported WATCH/ALERT combinations', () => {
  assert.equal(getGuidance('heartRate', 'NORMAL'), null);
  assert.equal(getGuidance('heartRate', 'UNKNOWN'), null);
  assert.equal(getGuidance('missing', 'ALERT'), null);
  const guidance = getGuidance('mood', 'alert');
  assert.match(guidance.title, /ALERT/);
  assert.ok(guidance.steps.length >= 2);
  assert.match(guidance.disclaimer, /not a medical diagnosis/i);
});

test('organ info covers contract IDs and returns defensive arrays', () => {
  for (const id of ['brain', 'heart', 'lungs', 'bones', 'gut', 'immune', 'mood']) {
    const info = getOrganInfo(id);
    assert.ok(info.name);
    assert.ok(info.function);
    assert.ok(Array.isArray(info.indicatorIds));
    assert.ok(Array.isArray(info.hazards));
  }
  const heart = getOrganInfo('heart');
  heart.hazards.push('modified');
  assert.ok(!getOrganInfo('heart').hazards.includes('modified'));
  assert.equal(getOrganInfo('missing'), null);
});
