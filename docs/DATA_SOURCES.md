# Data sources and attribution

## How sources are used

This project is an educational interface concept. It does not download, process, or reproduce NASA telemetry, clinical records, or astronaut measurements. All example readings are synthetic. NASA and agency pages below supply mission context and explain why health monitoring is relevant; they do not endorse this app or provide its numeric demo thresholds.

## NASA sources

| Source | Project use |
|---|---|
| [NASA Human Research Program: Five Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) | Names the five context tags used in `getOrganInfo`: space radiation, isolation and confinement, distance from Earth, gravity fields, and hostile/closed environments. The tags are explanatory associations, not causal predictions for a person. |
| [NASA Human Research Program: Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) | Background for the educational links between spaceflight and cardiovascular adaptation, bone changes, altered immune response, sensorimotor changes, behavioral health, and sleep. This source motivates topic selection; it does not validate individual threshold rules. |
| [NASA Human Research Program: Ongoing Research](https://www.nasa.gov/hrp/ongoing-hrp-research/) | General context that astronaut health effects and countermeasures remain active research areas. No live data from this page is used by the app. |
| [NASA: Fundamentals of Human Health](https://www.nasa.gov/reference/fundamentals-of-human-health/) | Context that NASA medical operations prepare for in-flight events and that exploration missions create distinct health-support challenges. No medical procedures are copied into the demo. |

## Canadian Space Agency sources

| Source | Project use |
|---|---|
| [Canadian Space Agency: Monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) | CANS is described as a continuously operating autonomous neutron-radiation measurement instrument under development. The app only uses this as a radiation-monitoring example; it does not contain CANS measurements. |
| [Canadian Space Agency: Why do we conduct science experiments in space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp) | Supports the high-level context that spaceflight research studies health effects and seeks countermeasures, with potential relevance to health on Earth. |

## General health references for illustrative thresholds

The demo bands are simplified and should be reviewed before any use beyond a hackathon prototype. Reference pages describe different populations, test methods, and clinical contexts; their values are not interchangeable with astronaut monitoring limits.

| Source | Narrow use in this demo |
|---|---|
| [MedlinePlus: Vital signs](https://medlineplus.gov/ency/article/002341.htm) | General adult resting reference context for pulse, blood pressure, and temperature. The app's WATCH/ALERT subdivisions are additional demo choices. |
| [American Heart Association: Understanding blood pressure readings](https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/) | Adult blood-pressure category context: normal, elevated, and hypertension stages. The app simplifies those categories and adds a low-value band for demonstration. |
| [NIDDK: Diabetes tests and diagnosis](https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis) | Shows that glucose interpretation depends on test type and conditions such as fasting. The app's single glucose field lacks this context and must not be used to infer prediabetes or diabetes. |
| [CDC: About sleep](https://www.cdc.gov/sleep/about/) | General adult sleep-duration context. The app's shorter-than-recommended WATCH/ALERT split is illustrative only. |

Mood ratings have no clinical cutoffs in this project. The 1–5 mood bands are a simple self-reflection demo and are not a mental-health screening instrument. Temperature, glucose, and sleep alerts likewise do not diagnose a condition. Use qualified medical sources and a clinician-approved protocol for any real monitoring application.

## Hazard identifiers used by the engine

| Identifier | Display label |
|---|---|
| `spaceRadiation` | Space radiation |
| `isolationConfinement` | Isolation and confinement |
| `distanceFromEarth` | Distance from Earth |
| `gravityFields` | Gravity fields |
| `hostileClosedEnvironments` | Hostile/closed environments |

The organ-to-hazard links in `getOrganInfo()` are broad educational associations for navigation. They do not estimate an individual's exposure or predict a medical outcome.
