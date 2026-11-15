# Контракт между UI (AI 1) и логикой (AI 2)

Единственная точка связи — модуль `src/engine/evaluate.js`. UI не должен сам считать статусы, а логика не должна знать про DOM.

## 1. Входные данные — `readings`
```js
{
  systolic: 120,        // мм рт. ст.
  diastolic: 80,        // мм рт. ст.
  heartRate: 70,        // уд/мин
  glucose: 90,          // мг/дл
  temperature: 36.8,    // °C
  sleepHours: 7.5,      // часы за последние 24 ч
  mood: 4,              // 1–5
  symptoms: ["headache"] // массив id из списка ниже
}
```
Любое поле может быть `null` (не измерено). Тогда индикатор получает статус `UNKNOWN` и не участвует в эскалации.

Допустимые симптомы: `headache`, `dizziness`, `nausea`, `jointPain`, `fatigue`.

## 2. `evaluateIndicators(readings)`
Возвращает:
```js
{
  indicators: [
    { id: "heartRate", label: "Heart rate", value: 70, unit: "bpm",
      status: "NORMAL",            // NORMAL | WATCH | ALERT | UNKNOWN
      threshold: "60–100 bpm" }    // текст для показа в UI
  ],
  overall: "NORMAL",               // худший статус из индикаторов
  escalate: false                  // true, если есть ALERT или 2+ WATCH
}
```
ID индикаторов: `systolic`, `diastolic`, `heartRate`, `glucose`, `temperature`, `sleepHours`, `mood`.

## 3. `getGuidance(indicatorId, status)`
Возвращает `{ title, steps: [string], disclaimer }` для `WATCH` и `ALERT`. Для `NORMAL` и `UNKNOWN` возвращает `null`.

## 4. `getOrganInfo(organId)`
Возвращает `{ name, function, indicatorIds: [string], hazards: [string] }`.
ID органов: `brain`, `heart`, `lungs`, `bones`, `gut`, `immune`, `mood`.

## 5. Заглушки для UI до готовности логики
`src/ui/stubs.js` (пишет AI 1) возвращает фиксированные примеры в этой же форме. Когда `src/engine/evaluate.js` готов, UI переключается на него одним импортом.

## Правила изменения контракта
- Менять можно только по согласованию обоих исполнителей.
- При изменении — обновить этот файл в `main` и написать в коммите, что изменилось.
