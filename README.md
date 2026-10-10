<div align="center">

# 🌟 Starlight Ent.

**A browser-based entertainment agency management game.**<br>
Recruit trainees, plan their training, debut groups, soloists and actors, and take your company to the top.

[![Play now](https://img.shields.io/badge/Play-GitHub%20Pages-ff69b4?style=flat-square)](https://susanquynh.github.io/vibe_code_game/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Languages](https://img.shields.io/badge/languages-vi%20%7C%20en%20(beta)-blue?style=flat-square)

[Overview](#overview) • [Getting started](#getting-started) • [Testing](#testing) • [Project structure](#project-structure) • [Internationalization](#internationalization) • [Deployment](#deployment)

</div>

## Overview

You take over **Starlight Ent.** with 600M in funds and two trainees. Each week you schedule training, take on jobs, release music and manage your people, then press **End week** to see what happens.

- **A living company building**: 16 rooms across 8 floors (Recording Studio, Dance Room, PR Room, Management Office, Investment Room, Market Room…), with characters moving between them according to their schedules.
- **Training and debuts**: 7-day schedules that trade energy and money for stats, and debut decisions as trainees qualify for group, solo or acting careers.
- **Jobs and releases**: film, variety and performance offers, singles, concerts, and music charts.
- **Staff and relationships**: hire managers who plan and act on their own, mentor juniors, and handle scandals. Artists form friendships and seniority bonds.
- **Economy and market**: trends, rival companies, sales, and investments outside entertainment.
- **Save anywhere**: autosave in the browser, plus export/import as an `SL1.` code or a `.json` file to move a game to another device.

> [!NOTE]
> The game started as a single-file HTML artifact made with Claude. This repository refactors it into a modular Vite project **without changing gameplay or UI**. The original is kept in [`legacy/starlight-original.html`](legacy/starlight-original.html) and is the reference for the golden master tests.

## Getting started

**Play online:** <https://susanquynh.github.io/vibe_code_game/>

**Run locally** (requires [Node.js](https://nodejs.org) 18+):

```bash
git clone https://github.com/SusanQuynh/vibe_code_game.git
cd vibe_code_game
npm install
npm run dev        # http://localhost:5173
```

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Serve the build on port 4173 |
| `npm test` | Unit tests (Vitest + jsdom) |
| `npm run check:handlers` | Ensure every inline handler (`onclick="…"`) exists on `window` |
| `npm run check:i18n` | Validate locale keys and placeholders against `vi` |
| `npm run test:e2e` | Playwright golden master and smoke tests |
| `npm run deploy` | Build and push to the `gh-pages` branch |

## Testing

Run the full suite before merging or deploying:

```bash
npm test && npm run check:handlers && npm run check:i18n && npm run test:e2e
```

> [!TIP]
> If Chromium is already installed, point Playwright to it instead of running `playwright install`:
> ```bash
> PW_CHROMIUM=/path/to/chrome npm run test:e2e
> ```
> To test the production build, run `npm run preview` and then `BASE_URL=http://localhost:4173/vibe_code_game/ npx playwright test`.

### Golden master

`tests/golden/*.json` are state snapshots after simulating 30 and 110 weeks with a seeded RNG, **recorded from the original artifact**. They prove that refactoring hasn't changed behavior, in both Vietnamese and English.

> [!IMPORTANT]
> Never edit `legacy/starlight-original.html`. Only regenerate the snapshots when you are **intentionally** changing gameplay:
> ```bash
> UPDATE_GOLDEN=1 npx playwright test golden
> ```

## Project structure

```
src/
├── core/       Pure helpers: seeded RNG, utilities
├── data/       Constants and content: rules, rooms, names, looks, offers
├── i18n/       t(), setLang and the locale registry (locales/*.js)
├── state.js    Global state S (live binding) + setState
├── systems/    Game logic by domain: artists, managers, week, market, events, releases, awards…
├── save/       localStorage storage with migrations, SL1 code / .json transfer
├── ui/         Rendering: building, rooms, views, planning, tutorial, save view
└── styles/     CSS split by area
legacy/         Original single-file artifact (read-only reference)
tests/          unit/, e2e/, golden/ snapshots, fixtures/
scripts/        Handler and i18n checks, deploy script
docs/plans/     Implementation plans
```

Key conventions:

- Inline handlers in dynamically generated HTML are wired to `window` in one place: [`src/ui/globals.js`](src/ui/globals.js).
- Shared `let` variables across modules are changed only through setters (`setState`, `setCurView`, …).

## Internationalization

Vietnamese (`vi`) is the default and source of truth; English (`en`) is in beta. Players switch languages with the 🌐 button and the game re-renders in place without losing state. The choice is stored in `localStorage['starlight_lang']`, separately from save data.

> [!NOTE]
> Phase 1 covers the fixed UI only: top bar, room names, dock, common buttons and the tutorial. Game content such as logs and events is still in Vietnamese.

**Adding a language**

1. Copy `src/i18n/locales/en.js` to `xx.js`.
2. Update `meta` (`code`, `name`, `htmlLang`) and translate `dict`.
3. Run `npm run check:i18n`. The registry picks up the new file automatically.

Keys are flat and dot-separated (`top.*`, `room.<id>.{name,dock,desc}`, `npc.<id>`, `btn.*`, `tut.<id>.{t,d}`, `lang.*`, `saved.*`, `fmt.units`). Values are strings with `{x}` placeholders or `(p) => string` functions for plurals.

**Rules**

- Don't call `t()` at module top level; look up strings at render time.
- Dictionaries are trusted HTML: escape user data with `esc()` before passing it to `t()`.
- Never store translated strings in `S` (`addLog`, `title`…). `fmt()` keeps Vietnamese units for logs; use `money()` for display only.
- `src/i18n/` is a leaf module: no system/UI imports, no DOM access, no RNG calls.
- Static markup in `index.html` uses `data-i18n` / `data-i18n-aria`.

## Save data

The game autosaves to `localStorage` under the key `starlight_idol_save_v1`. Use the 🔑 button in the top bar to export an `SL1.…` code or a `.json` file and import it in another browser.

## Deployment

The site is hosted on GitHub Pages from the `gh-pages` branch, without GitHub Actions:

```bash
npm run deploy
```

This builds with the `/vibe_code_game/` base path and force-pushes `dist/` to `gh-pages`.

> [!IMPORTANT]
> One-time setup: in **Settings → Pages**, set **Source** to **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.

## Claude Code subagents

The repository ships with [Claude Code](https://claude.com/claude-code) subagents in [`.claude/agents/`](.claude/agents/). Recommended workflow:

1. **`planner`**: investigates and writes a plan to `docs/plans/` (no code).
2. **`gameplay-dev`**: implements the plan, one test and one commit per task.
3. **`golden-guardian`**: runs unit, handler and e2e checks and diagnoses golden master drift (report only).
4. **`code-reviewer`**: reviews the diff against `main` before merging or deploying (read only).
5. **`balance-analyst`**: simulates many seeds to analyze game balance (read only).
