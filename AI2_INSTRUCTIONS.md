# Инструкция для AI 2 (Мади): куда загружать работу и как проверить часть AI 1

Скопируй всё ниже линии в свой AI вместе с промптом «AI 2 — Logic & Content» из `WORK_SPLIT.md` и файлом `CONTRACT.md`.

---

## 1. Общий репозиторий

- Репозиторий: https://github.com/mirasdunenbaev1305-web/NASA-Space-Apps-Astronaut-Health-Monitor
- **Твоя ветка: `ai2-logic`.** Загружай только в неё. В `main` и `ai1-ui` не загружай — слияние в `main` делает человек после проверки.
- Опубликованный сайт (собирается из `main`): https://mirasdunenbaev1305-web.github.io/NASA-Space-Apps-Astronaut-Health-Monitor/

### Подготовка (один раз)
Если проекта ещё нет на компьютере:
```bash
git clone -b ai2-logic https://github.com/mirasdunenbaev1305-web/NASA-Space-Apps-Astronaut-Health-Monitor.git
cd NASA-Space-Apps-Astronaut-Health-Monitor
```
Если уже есть:
```bash
git checkout ai2-logic
git pull
```
Затем **подтяни интерфейс из `main`**, чтобы проверять свою логику вместе с ним. Конфликтов не будет — папки разные:
```bash
git fetch origin
git merge origin/main
```

## 2. Куда класть файлы

| Можно менять | Нельзя менять |
|---|---|
| `src/engine/` | `index.html` |
| `config/` | `src/ui/` |
| `tests/` | `src/styles/` |
| `docs/` | `sw.js`, `manifest.webmanifest`, `icons/` |
| `README.md` | `CONTRACT.md`, `WORK_SPLIT.md`, `PROMPT.md` (только по согласованию) |
| `package.json` (если нужен для `npm test`) | |

## 3. Технические требования, чтобы логика заработала с интерфейсом

Интерфейс уже готов и сам подключает файл **`src/engine/evaluate.js`**, как только он появится (см. `src/ui/engine.js`). Пока его нет, интерфейс работает на заглушках `src/ui/stubs.js`. Можно открыть `stubs.js` как пример нужной формы данных, но не копировать пороги — они временные.

1. `src/engine/evaluate.js` — **браузерный ES-модуль** с именованными экспортами:
   ```js
   export function evaluateIndicators(readings) { ... }
   export function getGuidance(indicatorId, status) { ... }
   export function getOrganInfo(organId) { ... }
   ```
2. **Без `require`, без модулей Node (`fs`, `path`) и без `import ... from '...json'`.** В браузере на GitHub Pages это не загрузится, и интерфейс молча вернётся к заглушкам.
3. Пороги: `config/thresholds.json` — документированный источник. Те же значения положи в `src/engine/thresholds.js` (`export const THRESHOLDS = {...}`) и импортируй в `evaluate.js` через относительный путь с расширением: `import { THRESHOLDS } from './thresholds.js';`. Добавь тест, который проверяет, что JSON и JS совпадают.
4. Форма данных — **строго по `CONTRACT.md`**: id показателей (`systolic`, `diastolic`, `heartRate`, `glucose`, `temperature`, `sleepHours`, `mood`), id органов (`brain`, `heart`, `lungs`, `bones`, `gut`, `immune`, `mood`), статусы `NORMAL | WATCH | ALERT | UNKNOWN`.
5. Поле **`threshold` пиши в формате `"60–100 bpm"`** (два числа через тире и единица). Интерфейс разбирает его, чтобы нарисовать зелёную полосу нормы на графике.
6. `getGuidance` возвращает `{ title, steps, disclaimer }` для `WATCH` и `ALERT` и `null` для остальных. `getOrganInfo` возвращает `{ name, function, indicatorIds, hazards }`. Названия опасностей в `hazards` пиши одинаково во всех органах (например, `"Space radiation"`): интерфейс группирует органы по этому тексту.
7. Функции не должны падать на пустом объекте `{}`, на `null` в полях и на строках вместо чисел.
8. Тесты запускаются без браузера: `npm test` (например, `node --test` и `"type": "module"` в `package.json`).

## 4. Проверка своей логики вместе с интерфейсом

Из папки проекта:
```bash
python3 -m http.server 8000
```
Открой http://localhost:8000 (двойной клик по `index.html` не сработает — браузер не грузит модули с диска).

- [ ] Внизу страницы **нет** надписи «Engine: placeholder thresholds (stub)». Если она есть — интерфейс не смог загрузить `evaluate.js`; причина в консоли браузера (F12 → Console).
- [ ] В консоли нет красных ошибок.
- [ ] «Load demo week»: статусы, баннер «Contact flight surgeon on the ground», рекомендации и 7 графиков с зелёной полосой нормы.
- [ ] Клик по каждой из 7 зон тела показывает название, функцию, показатели, опасности и совет.
- [ ] Ввод вручную: нормальные значения → всё зелёное, без баннера. Один показатель в ALERT → баннер. Два в WATCH → баннер.
- [ ] `npm test` проходит.

Если браузер показывает старую версию — Ctrl+Shift+R (на Mac Cmd+Shift+R): приложение кэшируется для работы без сети.

## 5. Проверка части AI 1 (интерфейс)

Проверь интерфейс по списку задач AI 1 из `WORK_SPLIT.md`. **Файлы интерфейса не исправляй** — запиши найденное в `docs/UI_REVIEW.md`.

Что проверить:
- [ ] Фигура: 7 зон кликаются; с клавиатуры — Tab до зоны и Enter.
- [ ] Статус показан не только цветом, но и значком и текстом.
- [ ] Форма: значение вне границ (например, пульс 300) не сохраняется и подсвечивается; пустая форма не сохраняется; «Simulate readings» заполняет поля.
- [ ] Баннер эскалации появляется и исчезает правильно по правилу из `CONTRACT.md`.
- [ ] Рекомендации показывают текст «decision support, not a medical diagnosis».
- [ ] Графики обновляются после каждой записи; таблица истории совпадает с графиками.
- [ ] «Export CSV» скачивает файл с понятными колонками; «Print / Save as PDF» даёт читаемый отчёт.
- [ ] «Reset demo data» стирает данные только после второго клика.
- [ ] Ширина телефона (в Chrome F12 → значок телефона, 375px): нет горизонтальной прокрутки, всё читается.
- [ ] Офлайн: открой сайт один раз, затем F12 → Network → Offline и перезагрузи — приложение должно открыться.
- [ ] Интерфейс использует контракт правильно: читает все поля, которые ты возвращаешь, и не ожидает полей, которых в `CONTRACT.md` нет.
- [ ] Весь текст на английском, дисклеймер «Demo prototype. Not a medical device.» виден.

Формат `docs/UI_REVIEW.md` — по одной строке на находку:

| # | Важность (high/medium/low) | Где | Шаги | Ожидалось | Получилось |
|---|---|---|---|---|---|

Если всё в порядке, так и напиши: «Проверено, проблем не найдено» и список проверенного.

## 6. Загрузка в репозиторий

Маленькие коммиты с префиксом `logic:`:
```bash
git add src/engine config tests docs README.md package.json
git commit -m "logic: status engine and thresholds"
git push origin ai2-logic
```
- Загружай **только в `ai2-logic`**: `git push origin ai2-logic`.
- Не делай `git add .` — так можно случайно закоммитить чужие файлы или мусор.
- Если git спросит пароль: логин `Madi-viber`, вместо пароля — персональный токен с https://github.com/settings/tokens (галочка **repo**). Обычный пароль GitHub для `git push` не подходит.
- Если `git push` отклонён (rejected): `git pull --rebase origin ai2-logic`, затем снова `git push origin ai2-logic`.

## 7. В конце

Напиши человеку:
1. Что сделано и что осталось.
2. Результат `npm test`.
3. Пункты проверки из разделов 4 и 5: что прошло, что нет.
4. Ссылку на свой последний коммит в `ai2-logic`.

После этого человек сольёт `ai2-logic` в `main`, и сайт обновится сам.
