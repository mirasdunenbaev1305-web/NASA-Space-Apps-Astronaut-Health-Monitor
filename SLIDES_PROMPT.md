# Промпт для AI: слайды демо (NASA Space Apps 2026)

**Перед отправкой** замените всё в квадратных скобках `[...]` на свои данные: название команды, имена участников, Local Event и точное название челленджа (как на сайте Space Apps). Скопируйте в AI для презентаций (Gamma, Canva, Google Slides + Gemini, ChatGPT, Claude) всё ниже линии.

---

Create a slide deck for our NASA Space Apps Challenge 2026 project demo. Follow every rule below exactly — breaking a limit makes the project ineligible for global judging.

## Hard rules (from the official NASA Space Apps Project Submission Guide)
1. **Maximum 7 slides in total, including the title slide and the intro slide.** Do not add an 8th slide, appendix, "Thank you" or "Questions" slide.
2. **English only** on every slide, including speaker notes and image captions.
3. The deck must show: **team name, names of all team members, and the challenge we selected.**
4. Visuals must: **show an image of the project**, **describe the user experience**, and **show how NASA and space agency open data and resources made the solution possible.**
5. Readable template: large fonts (titles ≥ 32 pt, body ≥ 18 pt), high contrast, **few words per slide** (max ~35 words of body text, short bullets, no paragraphs).
6. **No NASA logos, the NASA "meatball" or "worm", flags, mission patches or other NASA branding** anywhere, and do not imitate them. Do not use the Space Apps logo unless we add it ourselves.
7. **No images, video, voice or likeness of anyone under 18.** Prefer no people at all; use screenshots of our app.
8. If you generate any image with AI, it **must carry a visible "AI-generated" watermark** on the image. Prefer our real app screenshots instead (placeholders below).
9. Health values are **synthetic demo data**; the app is **a demo prototype, not a medical device.** Do not claim it diagnoses, treats or measures real astronauts.

## Our details
- **Project name:** Astronaut Vitals
- **Tagline:** Health self-assessment for long-duration missions — works offline
- **Team name:** [TEAM NAME]
- **Team members:** [Full name 1], [Full name 2], [Full name 3 …]
- **Challenge:** [EXACT CHALLENGE TITLE FROM THE SPACE APPS WEBSITE]
- **Local Event:** [CITY / LOCAL EVENT NAME]
- **Live app (no login):** https://mirasdunenbaev1305-web.github.io/NASA-Space-Apps-Astronaut-Health-Monitor/
- **Code:** https://github.com/mirasdunenbaev1305-web/NASA-Space-Apps-Astronaut-Health-Monitor

## What the app does (source material — do not invent features)
- Astronauts log blood pressure, heart rate, blood glucose, body temperature, sleep hours, mood (1–5) and symptoms — by keyboard/mouse, or "Simulate readings".
- Every indicator gets **NORMAL / WATCH / ALERT** with an icon and text; thresholds are transparent and shown on screen.
- **Any ALERT or two WATCH → banner "Contact flight surgeon on the ground."**
- **Interactive body figure:** 7 clickable areas (brain, mood, immune system, lungs, heart, digestive system, bones) show function, related readings, spaceflight hazards and a tip.
- Step-by-step guidance for each WATCH/ALERT; trend charts with the normal band; CSV and PDF report for the flight surgeon.
- **Works offline and installs like an app** — on long missions the link to Earth is slow and intermittent, so self-checks cannot depend on a network. Data stays on the device.
- "Load demo week": 7 days of synthetic data — sleep falls 8 h → 4.5 h, heart rate rises 64 → 112 bpm, the app moves from NORMAL to ALERT and asks to contact the flight surgeon.

## NASA and space agency resources we used
- NASA Human Research Program — the five hazards of human spaceflight: https://www.nasa.gov/hrp/hazards/
- NASA HRP — human health risks: https://www.nasa.gov/hrp/risks/
- NASA HRP — ongoing research: https://www.nasa.gov/hrp/ongoing-hrp-research/
- Canadian Space Agency — monitoring radiation and astronaut health: https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- Canadian Space Agency — why we do science in space: https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp

How they shaped the app: the five hazards (space radiation, isolation and confinement, distance from Earth, gravity fields, hostile closed environments) are mapped to body areas in the hazard panel; HRP risk areas (cardiovascular, bone, immune, behavioral health, sleep, nutrition) chose which indicators we track; "distance from Earth" drove the offline-first design and the flight-surgeon escalation.

## Slide plan — exactly 7 slides
1. **Title.** "Astronaut Vitals" + tagline. Team name, all member names, challenge title, Local Event, "NASA Space Apps Challenge 2026". Visual: [SCREENSHOT 1 — app home with body figure].
2. **Intro — the problem.** Long missions = radiation, isolation, altered gravity, closed environment, far from Earth → bone loss, heart and immune changes, sleep and mood problems. Astronauts must check their own health. Visual: simple icon row of the 5 hazards (icons, not NASA art).
3. **Our solution.** One sentence: a visual self-check that turns daily readings into clear NORMAL / WATCH / ALERT and next steps. Visual: [SCREENSHOT 2 — indicator cards + red "Contact flight surgeon" banner].
4. **User experience.** 4-step flow with arrows: Log readings → See status on the body map → Read guidance → Export report for the flight surgeon. Visual: [SCREENSHOT 3 — body figure with an organ selected].
5. **Built on NASA & space agency resources.** Diagram: 5 HRP hazards → body areas → indicators we track. List the sources above in short form (NASA HRP Hazards, HRP Risks, HRP Research, CSA). Note: "No real crew data — synthetic readings."
6. **Demo week + works offline.** Mini story: Day 1 NORMAL → Day 7 ALERT (sleep 8 → 4.5 h, heart rate 64 → 112 bpm). Badge-style callout: "Works offline · installable · data stays on device". Visual: [SCREENSHOT 4 — trend charts].
7. **Impact & future.** Earlier detection of problems on long missions, less load on ground teams, a clear report when the link to Earth returns. Next: medical review of thresholds, wearable sensor input, Mars-mission delay mode. Live app link + GitHub link. Small footer: "Demo prototype. Not a medical device. Synthetic data."

## Style
- Dark space theme (near-black navy background #070B18, light text, accent blue #7CB2FF; status colors green #3ECF8E, amber #F5B942, red #FF6170 — always with a text label too).
- One clear visual per slide, lots of empty space, consistent layout, no clip-art astronauts.
- Add short speaker notes (2–3 sentences, English) for each slide.

## Output
- Return the 7 slides with titles, on-slide text, image placeholders marked [SCREENSHOT n], and speaker notes.
- At the end, list what we must replace (screenshots, names) and a checklist confirming: 7 slides max, English, team name + members + challenge shown, project image, user experience, NASA data, no NASA branding, no minors, AI images watermarked.

---

## После генерации (вручную)
1. Сделайте скриншоты с сайта и вставьте вместо `[SCREENSHOT 1–4]`: главный экран, баннер после «Load demo week», выбранный орган, графики.
2. Пересчитайте слайды: их **не больше 7**.
3. Опубликуйте: Google Slides → «Настройки доступа» → «Все, у кого есть ссылка» → «Читатель» (или PDF на Google Drive с тем же доступом).
4. Откройте ссылку в режиме инкогнито: она должна открываться без входа.
5. Вставьте ссылку в поле **«Link to Project Demo»** на странице подачи.
