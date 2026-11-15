# AI 1 interface review

Reviewed locally on the merged `ai2-logic` branch using `http://localhost:8000`. UI files were not changed.

| # | Importance | Where | Steps | Expected | Observed |
|---|---|---|---|---|---|
| 1 | low | Chart.js bundle during offline reload | Load the demo week, test at 375 px, stop the local server, and reload from the service-worker cache. | No red console errors. | The app and real engine loaded and retained the demo week, but one `Uncaught TypeError: this._fn is not a function` was logged from the Chart.js 4.4.1 bundle. A subsequent online reload produced no additional errors; the error was not reproducible in the online run. |

## Checks that passed

- The real engine loaded; the placeholder-engine message was absent.
- All seven body areas selected by pointer on their visible shapes and by Enter from the keyboard. The body list also selected each area.
- Statuses include an icon and text. The demo disclaimer is visible and English interface text was observed.
- A normal manual entry produced NORMAL with no banner. One ALERT displayed the escalation banner. Two WATCH readings displayed the banner, and a later normal entry cleared it.
- Heart rate 300 was marked invalid and was not saved. An empty form was not saved. “Simulate readings” filled the form without saving it.
- “Load demo week” created seven history rows, showed the escalation banner and recommendations, and updated all seven trend cards. Displayed latest chart labels and history values/statuses agreed. The chart screenshot showed a green normal band.
- CSV export downloaded `astronaut-vitals-day7.csv` with labeled columns and seven reading rows.
- “Reset demo data” required a second click; the first click retained history and the second cleared it.
- At a fresh 375 px viewport, the app had no horizontal page overflow (`scrollWidth` equaled `clientWidth`).
- With the local server stopped, a reload served the app from cache; the real engine and stored demo week remained available.

## Not fully verified

- “Print / Save as PDF” expanded the history table before invoking `window.print()`, but the in-app browser automation timed out while opening the print preview. Print output readability therefore remains unconfirmed.
