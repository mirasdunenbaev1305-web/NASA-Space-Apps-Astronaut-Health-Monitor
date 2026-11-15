# Astronaut Vitals — NASA Space Apps Challenge 2026

An educational, rule-based health self-assessment app for astronauts on long-duration missions. This is not a medical device and must not be used to make care decisions.

**Live app:** https://mirasdunenbaev1305-web.github.io/NASA-Space-Apps-Astronaut-Health-Monitor/ — no login; installable; works offline after the first visit.

## The app

- **Interactive body figure** with seven clickable, keyboard-accessible areas (brain, mood, immune system, lungs, heart, digestive system, bones). Each shows its function, related indicators, spaceflight hazards and a tip.
- **Reading form** for blood pressure, heart rate, blood glucose, body temperature, sleep, blood oxygen (SpO₂), bone-loading exercise minutes, a 1–5 mood scale and symptoms, with input validation and a "Simulate readings" option.
- **Status cards** (NORMAL / WATCH / ALERT, always with an icon and text) and a **"Contact flight surgeon on the ground"** banner for any ALERT or two or more WATCH indicators.
- **Guidance**, a **spaceflight-hazard map**, **trend charts** with the normal band, and a history table.
- **CSV export** and **print / save as PDF** report for the flight surgeon; **"Load demo week"** shows a 7-day story of sleep loss and rising heart rate.
- **Offline, installable app (PWA):** communication with Earth is slow and intermittent on long missions, so self-assessment must work without a network. Data stays in the browser on the device.

Files: `index.html`, `src/ui/` (interface), `src/styles/`, `sw.js` and `manifest.webmanifest` (offline/install), `src/engine/` and `config/` (rules and thresholds).

## Logic module

`src/engine/evaluate.js` exports the functions defined in [`docs/process/CONTRACT.md`](docs/process/CONTRACT.md) and imports browser-safe thresholds from `src/engine/thresholds.js`:

- `evaluateIndicators(readings)` evaluates systolic and diastolic blood pressure, heart rate, glucose, temperature, sleep hours, a mood self-rating, blood oxygen saturation (lungs) and bone-loading exercise minutes (bones).
- `getGuidance(indicatorId, status)` provides short demo guidance for WATCH and ALERT only.
- `getOrganInfo(organId)` gives educational context for the seven body areas and their related indicators and spaceflight hazards.

Readings may be `null` or omitted. Missing, non-finite, out-of-range, or invalidly typed values produce `UNKNOWN` and do not count toward escalation. The overall status is the worst known status; escalation is true for any ALERT or two or more WATCH indicators.

## Run the tests

All tests use Node's built-in test runner and have no third-party dependencies:

```sh
npm test
```

This runs the logic tests (`tests/evaluate.test.mjs`) and the interface tests (`src/ui/tests/ui.test.mjs`), including a check that the engine's output works with the interface. Node.js 22 or newer is recommended.

Run the web app locally from the repository root with `python3 -m http.server 8000`, then open `http://localhost:8000` (opening `index.html` directly from disk does not work because browsers block ES modules from `file://`).

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
| Blood oxygen SpO₂ (lungs) | 95–100 % | 92–94 % | <92 % |
| Bone-loading exercise today (bones) | ≥60 min | 30–59 min | <30 min |

These bands deliberately simplify heterogeneous reference values into one transparent demo rule. A displayed ALERT is not a diagnosis or an emergency determination. Use approved mission procedures and qualified clinical judgment.

## Spaceflight context and sources

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) for source-by-source notes, including the NASA and Canadian Space Agency references from the project prompt. The project does not ingest NASA telemetry or real astronaut records. Inputs and simulated readings are synthetic.

## Demo material

- **Demo video (27 s):** https://mirasdunenbaev1305-web.github.io/NASA-Space-Apps-Astronaut-Health-Monitor/demo/
- **Slides (7):** https://mirasdunenbaev1305-web.github.io/NASA-Space-Apps-Astronaut-Health-Monitor/slides/
- Screenshots: [`docs/media/screenshots/`](docs/media/screenshots/)

Team Bit&Byte: Madi Shynzhyrbekov (logic and content), Miras Dunenbaev (user interface).

`docs/process/` keeps our working notes: the original prompt, how work was split between two AI-assisted developers, the UI–engine contract, review notes and submission drafts. They document our process and AI use; some notes are in Russian.

## Data and privacy

The product brief specifies browser-only storage with a reset control and no login or backend. The current logic module itself performs no storage, network requests, authentication, or token handling. The UI integration must keep demo data local and handle browser storage errors.

## AI tools used

AI assistance was used to draft the JavaScript rule engine, illustrative demo threshold configuration, tests, and project documentation. The interface (`index.html`, `src/ui/`, `src/styles/`), its tests, the offline service worker, the app icon and the web manifest were generated with Claude (Anthropic); generated source files say so in a header comment. NASA and agency references are attributed in `docs/DATA_SOURCES.md`. All health readings used in examples are synthetic; the thresholds and content are educational demo material, not NASA flight rules or clinical guidance.
