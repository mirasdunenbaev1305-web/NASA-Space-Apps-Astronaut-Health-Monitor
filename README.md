# Astronaut Vitals — NASA Space Apps Challenge 2026

An educational, rule-based health-monitoring demo concept for a long-duration space mission. The repository currently contains the Logic & Content implementation and project documentation; the UI application is being built on the `ai1-ui` branch. This is not a medical device and must not be used to make care decisions.

## Logic module

`src/engine/evaluate.js` exports the functions defined in [`CONTRACT.md`](CONTRACT.md) and imports browser-safe thresholds from `src/engine/thresholds.js`:

- `evaluateIndicators(readings)` evaluates systolic and diastolic blood pressure, heart rate, glucose, temperature, sleep hours, and a mood self-rating.
- `getGuidance(indicatorId, status)` provides short demo guidance for WATCH and ALERT only.
- `getOrganInfo(organId)` gives educational context for the seven body areas and their related indicators and spaceflight hazards.

Readings may be `null` or omitted. Missing, non-finite, out-of-range, or invalidly typed values produce `UNKNOWN` and do not count toward escalation. The overall status is the worst known status; escalation is true for any ALERT or two or more WATCH indicators.

## Run the tests

The logic tests use Node's built-in test runner and have no third-party dependencies:

```sh
npm test
```

Node.js 22 or newer is recommended. To run tests directly without npm, use `node --test tests/evaluate.test.mjs`. Run the web app from the repository root with `python3 -m http.server 8000`, then open `http://localhost:8000`.

## Indicators and demo thresholds

Thresholds live in [`config/thresholds.json`](config/thresholds.json). They are editable demonstration bands, not NASA operational limits, diagnostic criteria, or individualized medical advice. Verify any future medical use with qualified clinicians and authoritative medical sources. In particular, blood glucose cannot be interpreted without knowing the test method and whether the reading is fasting or post-meal; this demo's single number is only a software example.

| Indicator | Demo NORMAL | Demo WATCH | Demo ALERT |
|---|---:|---:|---:|
| Systolic BP | 90–119 mmHg | 120–139 | <90 or ≥140 |
| Diastolic BP | 60–79 mmHg | 80–89 | <60 or ≥90 |
| Heart rate | 60–100 bpm | 50–59 or 101–120 | <50 or >120 |
| Glucose | 70–140 mg/dL | 54–69 or 141–199 | <54 or ≥200 |
| Temperature | 36.5–37.3 °C | 35.0–36.4 or 37.4–37.9 | <35.0 or ≥38.0 |
| Sleep, last 24 h | ≥7 h | 5–6.9 h | <5 h |
| Mood self-rating | 4–5 / 5 | 3 / 5 | 1–2 / 5 |

These bands deliberately simplify heterogeneous reference values into one transparent demo rule. A displayed ALERT is not a diagnosis or an emergency determination. Use approved mission procedures and qualified clinical judgment.

## Spaceflight context and sources

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) for source-by-source notes, including the NASA and Canadian Space Agency references from the project prompt. The project does not ingest NASA telemetry or real astronaut records. Inputs and simulated readings are synthetic.

## Demo material

[`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) contains a seven-slide outline. Replace the team and participant placeholders before submission.

## Data and privacy

The product brief specifies browser-only storage with a reset control and no login or backend. The current logic module itself performs no storage, network requests, authentication, or token handling. The UI integration must keep demo data local and handle browser storage errors.

## AI tools used

AI assistance was used to draft the JavaScript rule engine, illustrative demo threshold configuration, tests, and project documentation. NASA and agency references are attributed in `docs/DATA_SOURCES.md`. All health readings used in examples are synthetic; the thresholds and content are educational demo material, not NASA flight rules or clinical guidance.
