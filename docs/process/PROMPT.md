# Prompt for the AI coding tool

Copy everything below the line into your AI tool (Claude Code, Cursor, Lovable, etc.).

---

Build a web app called **"Astronaut Vitals"**: a visual health monitoring tool that helps astronauts assess their own health during a long-duration space mission and get guidance on treatment and health improvement.

## Context (why this matters)
- Long missions expose astronauts to five spaceflight hazards: space radiation, isolation and confinement, distance from Earth, gravity fields (altered gravity), and hostile closed environments.
- These hazards can cause immune changes, bone density loss, cardiovascular events, inadequate nutrition, and behavioral health problems.
- Astronauts must be able to assess their own health during a mission. Key indicators: blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, and mood.

## Core features
1. **Data input (at least 3 input types):**
   - Manual entry form for: blood pressure (systolic/diastolic, mmHg), heart rate (bpm), blood glucose (mg/dL), body temperature (°C), sleep hours (last 24 h), mood (1–5 scale with emoji buttons), and optional symptom checkboxes (headache, dizziness, nausea, joint pain, fatigue, etc.).
   - Mouse/touch interaction: clicking on a body figure to log a symptom in a specific body area.
   - Optional: a "simulated sensor" mode that generates realistic readings so the demo works without hardware.
2. **Interactive human body figure (SVG):** every body part (head, heart, lungs, bones/skeleton, GI tract, immune system, brain/mood) is clickable. Clicking shows what that organ does, the related health indicators, its current status (green / yellow / red), and a short tip.
3. **Status engine (rule-based, transparent):**
   - Each indicator gets a status: NORMAL, WATCH, or ALERT, using clearly stated thresholds (for example, resting heart rate, systolic BP, glucose ranges). Show the threshold next to each value.
   - Trends: keep the history of each indicator and draw a simple line chart with animated transitions.
   - Rule for escalation: if any indicator is ALERT, or two or more are WATCH at the same time, show "Contact flight surgeon on the ground" as a prominent banner.
4. **Guidance panel:** for each WATCH or ALERT condition, show prevention and action steps (for example: hydration and rest for elevated heart rate, exercise countermeasure for bone loss risk, sleep schedule adjustment for low sleep, and a crew-psychology check-in for low mood). Include a clear sentence that this is decision support, not a medical diagnosis.
5. **Mission context:** a mission-day counter and a "hazard exposure" summary that links active hazards (radiation, isolation, gravity, etc.) to the indicators they affect.
6. **Report export:** download the session summary as a PDF or CSV that the crew could send to the flight surgeon.

## UI / UX requirements
- Clean, modern, space-themed dark UI with high contrast and readable typography.
- Use animations (smooth transitions, pulsing ALERT indicators, animated charts) but respect `prefers-reduced-motion`.
- Works on desktop and tablet; keyboard accessible; color is never the only signal (use icons and text labels too).
- Everything in the interface must be in **English**.
- Include a visible disclaimer: "Demo prototype. Not a medical device."

## Data and sources
- Use public NASA information for hazard descriptions and indicator explanations:
  - https://www.nasa.gov/hrp/hazards/
  - https://www.nasa.gov/hrp/risks/
  - https://www.nasa.gov/hrp/ongoing-hrp-research/
  - https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
  - https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- Store the thresholds in one clearly named config file (for example `thresholds.json`) so they can be edited and cited.
- Use only synthetic/demo data. Do not invent claims about real astronauts.

## Technical requirements
- Single-page app. Preferred stack: plain HTML + CSS + JavaScript (no build step) or React + Vite. Charts with Chart.js or D3. Body figure as inline SVG.
- All data stored in the browser (localStorage) with a "Reset demo data" button. Wrap storage calls in try/catch.
- No login, no backend required for the demo.
- Must run with a single command (`npm install && npm run dev`) or by opening `index.html`.
- Include a `README.md` with: how to run, the list of indicators and thresholds, the data sources, and a line noting any AI-generated code or images.
- Include unit tests for the status engine (for example, Vitest or plain JS asserts).

## Deliverables
1. Working app with the features above.
2. A 7-slide demo deck outline or a 30-second demo script (the app will be shown to judges).
3. Deployed public URL (GitHub Pages, Netlify, or Vercel) that works without login.
4. README with the NASA data used and an "AI tools used" section.

Start by creating the project structure, the thresholds config, and the status engine with tests. Then build the body figure, the input forms, the charts, the guidance panel, and the export. Finish with a responsive pass and a check of the reduced-motion and keyboard behavior.
