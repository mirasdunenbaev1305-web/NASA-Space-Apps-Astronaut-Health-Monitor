# Submission form — ready-to-paste answers (Space Apps 2026)

Тексты для формы подачи проекта. Копируйте поле за полем. Нажимает **Submit** только команда.

---

## Project Name
Astronaut Vitals — Offline Health Self-Check for Long-Duration Missions

## Summary
Astronaut Vitals is an offline web app that helps astronauts check their own health on long missions, when the link to Earth is slow or interrupted. Crew members log blood pressure, heart rate, blood glucose, body temperature, sleep, blood oxygen (SpO₂), bone-loading exercise, mood and symptoms, or simulate sensor readings. Every indicator is shown as NORMAL, WATCH or ALERT, always with an icon and text, and the transparent thresholds are shown next to it. If there is any ALERT or two WATCH indicators, a banner asks the astronaut to contact the flight surgeon on the ground. A clickable body figure shows how the brain, heart, bones, immune system and other areas are affected by the five hazards of spaceflight described by NASA's Human Research Program. Step-by-step guidance, 7-day trend charts and a CSV or PDF report make it easy to share data at the next medical conference. The app installs like a native app, works without a network, and keeps data on the device. It is a demo prototype that uses synthetic data, not a medical device.

## Project Demonstration
https://mirasdunenbaev1305-web.github.io/NASA-Space-Apps-Astronaut-Health-Monitor/demo/

(27-second video, English, synthetic data, with a visible "AI-assisted" watermark. Screenshots are in `docs/media/screenshots/`.)

## Project
https://mirasdunenbaev1305-web.github.io/NASA-Space-Apps-Astronaut-Health-Monitor/

(Code: https://github.com/mirasdunenbaev1305-web/NASA-Space-Apps-Astronaut-Health-Monitor)

## Project Details
**What it does.** Astronaut Vitals turns daily self-measurements into a clear, visual answer to "Am I okay, and what should I do next?"
- Input: blood pressure, heart rate, blood glucose, body temperature, sleep in the last 24 hours, a 1–5 mood scale and symptoms. Input works by keyboard or mouse, or with "Simulate readings" in place of real sensors.
- A rule engine rates each indicator NORMAL, WATCH or ALERT using editable, transparent thresholds stored in config/thresholds.json.
- Escalation: any ALERT, or two or more WATCH indicators, shows "Contact flight surgeon on the ground" with the reason.
- A clickable body figure covers 7 areas: brain, mood, immune system, lungs, heart, digestive system and bones. Each area shows its function, related readings, spaceflight hazards and a tip.
- Users also get step-by-step guidance for each WATCH or ALERT, a hazard map, trend charts with the normal band, a history table, CSV export and a printable PDF report.
- "Load demo week" tells a 7-day story: sleep falls from 8 h to 4.5 h, heart rate rises from 64 to 112 bpm, and the status moves from NORMAL to ALERT.

**Benefits and intended impact.** On long missions to the Moon or Mars, crews cannot always reach doctors on Earth in real time. The app supports:
- earlier self-detection of problems;
- less routine load on ground teams;
- a clean report ready for when the link returns.

Because it is a Progressive Web App, it installs on a laptop or tablet and works fully offline. Data never leaves the device: there is no login, no backend and no tracking.

**How it works / tools.**
- Built with HTML, CSS and vanilla JavaScript (ES modules), no build step.
- Chart.js draws the trends, and an inline SVG draws the body figure.
- A service worker and web manifest provide offline use and installation; data is stored in browser localStorage.
- The project has 38 automated tests on the Node.js test runner, covering the rule engine, the UI logic and the engine–UI contract.
- It is hosted on GitHub Pages. Development used Git/GitHub, VS Code, Google Chrome and Claude/ChatGPT-style AI assistants (see the SI section).

**Creativity.** Abstract numbers become a body map: the user sees which organ needs attention and why, linked to NASA's five spaceflight hazards. The "distance from Earth" hazard directly shaped the offline-first design and the flight-surgeon escalation.

**Factors we considered.**
- Accessibility: status is never shown by color alone, keyboard navigation works, it respects reduced-motion settings, and it works on phones at 375 px width.
- Safety: the app clearly states "Demo prototype, not a medical device" and that decisions stay with flight surgeons.
- Privacy: data stays on the device.
- Robustness: input validation, recovery from corrupted storage, and protection against CSV formula injection.
- Data honesty: thresholds are simplified demo bands, not NASA flight rules, and all data is synthetic.

## Use of Super Intelligence (SI)
Select options that apply: **code**, **text / documentation**, **video (watermarked)**. Suggested description if a text box appears:

> We used AI assistants: Anthropic Claude for the user interface code, service worker, icons, tests, the demo video assembly and documentation drafts, and an AI coding assistant for the rule-engine code, threshold configuration, tests and docs. The team directed, reviewed, tested and integrated all output. AI-generated source files say so in a header comment, and the README has an "AI tools used" section. The demo video carries a visible "AI-assisted (Claude)" watermark. No AI-generated images of people were used, and no NASA branding was used. All health data is synthetic.

## NASA Data
| Link Text | Link Url |
|---|---|
| NASA Human Research Program — Five Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/ |
| NASA Human Research Program — Risks of Human Spaceflight | https://www.nasa.gov/hrp/risks/ |
| NASA Human Research Program — Ongoing HRP Research | https://www.nasa.gov/hrp/ongoing-hrp-research/ |
| NASA — Fundamentals of Human Health | https://www.nasa.gov/reference/fundamentals-of-human-health/ |

## Space Agency Partner & Other Data
| Link Text | Link Url |
|---|---|
| Canadian Space Agency — Monitoring radiation for astronaut health | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp |
| Canadian Space Agency — Why do we conduct science experiments in space? | https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp |
| MedlinePlus — Vital signs | https://medlineplus.gov/ency/article/002341.htm |
| American Heart Association — Understanding blood pressure readings | https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/ |
| NIDDK — Diabetes tests and diagnosis | https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis |
| CDC — About sleep | https://www.cdc.gov/sleep/about/ |
| Chart.js 4.4.1 (MIT license) | https://www.chartjs.org/ |
| Project source code (GitHub) | https://github.com/mirasdunenbaev1305-web/NASA-Space-Apps-Astronaut-Health-Monitor |

## Project Submission Verification
Две галочки (Terms and Conditions и Original work) ставит сама команда, прочитав условия.
