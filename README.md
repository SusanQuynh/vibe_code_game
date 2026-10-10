<div align="center">

# 🌟 Starlight Ent.

**Run a K-pop–style entertainment agency in your browser.**<br>
Sign trainees, plan their weeks, debut groups, soloists and actors, win the charts, and outgrow five rival companies.

[![Play now](https://img.shields.io/badge/Play-GitHub%20Pages-ff69b4?style=flat-square)](https://susanquynh.github.io/vibe_code_game/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Languages](https://img.shields.io/badge/languages-vi%20%7C%20en%20(beta)-blue?style=flat-square)

[How to play](#how-to-play) • [Getting started](#getting-started) • [Architecture](#architecture) • [Testing](#testing) • [Internationalization](#internationalization) • [Deployment](#deployment)

</div>

## Overview

Starlight Ent. is a single-player management sim. You start as the new director with **600M in funds and two trainees** and play one week at a time. There is no server, no account, and no framework: just a Vite-built static site that saves to your browser.

> [!NOTE]
> The game began as a single-file HTML artifact (~2,700 lines) made with Claude. This repository refactors it into ES modules **without changing gameplay or UI**: a seeded "golden master" test proves the new code produces the same game state as the original, which is kept read-only in [`legacy/starlight-original.html`](legacy/starlight-original.html).

## How to play

Each week follows the same loop:

1. **Plan**: give every free artist a 7-day schedule (vocal, dance, rap, acting, variety, gym or rest), or let managers propose one.
2. **Decide**: accept job offers, release music, handle events in the 🔔 inbox.
3. **End week**: schedules run, money and fans update, the world moves on, and you get a report.

The company lives in an 8-floor building with 16 rooms. Tap a room (or use the dock) to open it, tap a character to see their profile.

| Area | What you do there |
| --- | --- |
| 🌟 **Recruitment Lobby** | Sign trainees (20M), organize them into batches, enter competitions, debut a group (2–5 members), soloist or actor |
| 💼 **CEO Office** | Weekly schedules for everyone, review results, groups, partner relations, awards history |
| 🎤 🪩 🎬 🏋️ **Training rooms** | Training raises 7 stats (Vocal, Dance, Rap, Acting, Variety, Visual, Stamina) but costs energy, mood and money. The Gym also hosts a health specialist who flags overworked artists |
| 📨 **Meeting Room** | Accept offers: dramas, films, web dramas, variety, music shows, survival shows, magazines, ads, plus small jobs for trainees |
| 🎙️ **Recording Studio** | Release singles in one of 7 concepts, hold concerts, produce films, get demos graded by the Music Director, and plan comebacks with the secretary: teasers to build hype before release, music-show stages for trophies after |
| 📋 **Management Office** | Hire managers (Negotiation, Care, PR, Planning), assign them to batches, groups or artist lists, build a reporting hierarchy |
| 📰 **PR Room** | Approve suggested promotion plans, investigate and respond to scandals |
| 📊 **Market Room** | Follow hot and cold concepts, rival comebacks, and temporary world events |
| 📈 **Investment Room** | Buy and upgrade 8 side businesses (café, fashion, game studio, real estate…), sell shares, buy them back |
| 💹 **Sales Room** · 🗂️ **HR Room** | Read the income/expense ledger and streaming revenue, renew contracts, assign senior mentors to trainees |
| 🛏️ **Dorm** · ☕ **Rooftop** | Rest, relationships inside the company, personal assistants, and contacts at other agencies |

<details>
<summary><b>Systems at a glance</b></summary>

- **Debut readiness**: a trainee is ready once their best concept or film-genre fit passes 50%. The game reserves their schedule and asks you at the start of the week whether to debut them, and as a group or solo when both fit.
- **Reviews every 4 weeks**: trainees must improve their total stats by more than 20% (or already be debut-ready). Five failed reviews in a row and they are cut; debuted artists are terminated after ten.
- **Singles and charts**: rank depends on concept fit, fame, budget, group harmony, trends, rival pressure, pre-release hype and song quality. Each single earns streaming revenue that decays over up to 52 weeks. Songs bought from outside writers pay 15% royalties; songs written in-house keep everything.
- **Relationships**: artists become friends, rivals or couples. Chemistry affects job quality, group lineups and disband risk. Dating can turn into a scandal.
- **Scandals**: open a case file, spend investigation points on clues of varying reliability, then deny, apologize, sue, go public or stay silent.
- **Managers**: they level up from completed work, can auto-accept jobs and auto-plan schedules, and pass weekly proposals up the chain. Conflicts they cannot resolve reach you.
- **Contracts**: debuts sign a one-year contract. Eight weeks before it ends, HR scores the artist (revenue vs. salary, fan growth, fame, reviews) to help you decide whether to renew.
- **Year end**: an awards show with eight categories (Artist, Rookie, Song, Actor, Actress, Variety Star, Film, Concert) and a company ranking against the rivals.

</details>

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
| `npm run check:handlers` | Fail if an inline handler (`onclick="…"`) is not exposed on `window` |
| `npm run check:i18n` | Fail if a locale has missing/extra keys or mismatched placeholders |
| `npm run test:e2e` | Playwright golden master and smoke tests |
| `npm run deploy` | Build and push `dist/` to the `gh-pages` branch |

### Saving

The game autosaves to `localStorage` (`starlight_idol_save_v1`) after every action. The 🔑 button exports your game as an `SL1.…` code (gzipped JSON, base64url) or a `.json` file, and imports either one in another browser after a preview. Older saves are migrated on load.

## Architecture

```
index.html        Static shell (top bar, building, dock, log)
src/
├── main.js       Boot: language → load or new game → migrate → render → tutorial
├── state.js      Global state S (live binding) + setState, newGame, addLog, uid
├── core/         rng (R, rnd, pick) and pure utilities (clamp, esc, fmt…)
├── data/         Game constants: stats, training, rooms, concepts, genres, offers, names
├── systems/      Game logic by domain
│   ├── week.js        nextWeek() and training
│   ├── artists, relations, debut, batches, review
│   ├── offers, releases, promo, secretary, proposals, managers
│   ├── market, events, awards
│   └── ext2.js, ext3.js   Features added in later versions of the original (ledger, contracts, mentors, songwriting, health specialist, outside contacts…)
├── save/         storage.js (localStorage + migrations), transfer.js (SL1 code / .json)
├── i18n/         t(), setLang, locale registry (locales/*.js)
├── ui/           building, rooms, views, planning, tutorial, saveView, modal, lang
│   └── globals.js     The only place handlers are attached to window
└── styles/       CSS split by area
legacy/           Original artifact (reference only)
tests/            unit/, e2e/, golden/, fixtures/
scripts/          check-handlers, check-i18n, deploy, extract-handlers
docs/plans/       Implementation plans
```

**Design choices**, kept from the migration plan:

- **No framework.** Views are template strings rendered with `innerHTML`; `act()` saves, re-renders the building and refreshes the open sheet after every action.
- **Inline handlers stay**, wired to `window` in [`src/ui/globals.js`](src/ui/globals.js). `check:handlers` catches any missing name.
- **Live binding for state.** `export let S` plus `setState()` keeps function bodies identical to the original. Other shared `let` variables also change only through setters (`setCurView`, `setPos`…).
- **All randomness goes through `Math.random`**, so tests can replace it with a seeded generator (Mulberry32) and replay the game exactly.
- **Leaf modules.** `core/`, `data/` and `i18n/` import no systems or UI, and no module runs logic at top level except `main.js`, to avoid circular-import issues.

> [!TIP]
> In the browser console, `window.__game` exposes `nextWeek`, `state()` and a small API (`hireMgr`, `sign`, `debutIds`, `acceptOffer`). The golden tests use it to drive simulations.

## Testing

Run the full suite before merging or deploying:

```bash
npm test && npm run check:handlers && npm run check:i18n && npm run test:e2e
```

| Suite | Covers |
| --- | --- |
| `tests/unit/` | State, RNG, formatting, week cost and rollover, determinism, save/load and migration of a v1 save fixture, save transfer, i18n core and locale parity, Vietnamese UI snapshots |
| `tests/e2e/golden.spec.js` | 30 weeks idle (seed 42) and 110 weeks with scripted actions (seed 7), compared byte-for-byte with snapshots recorded from the original, in both `vi` and `en` |
| `tests/e2e/smoke.spec.js` | Every room opens and closes, 10 week cycles with autosave across reload, no horizontal scroll at 375px, language switching, export → wipe → import |

> [!TIP]
> If Chromium is already installed, point Playwright to it instead of running `playwright install`:
> ```bash
> PW_CHROMIUM=/path/to/chrome npm run test:e2e
> ```
> To test the production build, run `npm run preview` and then `BASE_URL=http://localhost:4173/vibe_code_game/ npx playwright test`.

> [!IMPORTANT]
> A red golden test means behavior changed. Never edit `legacy/starlight-original.html`, and only regenerate snapshots when a change to gameplay is **intentional**:
> ```bash
> UPDATE_GOLDEN=1 npx playwright test golden
> ```

## Internationalization

Vietnamese (`vi`) is the default and the source of truth; English (`en`) is in beta. Players switch with the 🌐 button and the game re-renders in place without touching game state. The choice is stored in `localStorage['starlight_lang']`, separately from the save.

> [!NOTE]
> Phase 1 translates the fixed UI only: top bar, room names, dock, common buttons and the tutorial. Room contents, logs, events and offers are still Vietnamese. Later phases are outlined in [`docs/plans/2026-10-10-i18n-phase-1.md`](docs/plans/2026-10-10-i18n-phase-1.md).

**Adding a language**

1. Copy `src/i18n/locales/en.js` to `xx.js`.
2. Update `meta` (`code`, `name`, `htmlLang`) and translate `dict`.
3. Run `npm run check:i18n`. The registry picks up the file automatically.

Keys are flat and dot-separated (`top.*`, `room.<id>.{name,dock,desc}`, `npc.<id>`, `btn.*`, `tut.<id>.{t,d}`, `lang.*`, `saved.*`, `fmt.units`). Values are strings with `{x}` placeholders, or `(p) => string` functions for plurals.

**Rules**

- Don't call `t()` at module top level; look strings up at render time.
- Dictionaries are trusted HTML: escape user data with `esc()` before passing it to `t()`.
- Never store translated text in `S`. `addLog` keeps Vietnamese and `fmt()` units so the state (and golden snapshots) stay language-independent; use `money()` for display only.
- `src/i18n/` never imports systems or UI, touches the DOM, or calls the RNG.
- Static markup in `index.html` uses `data-i18n` / `data-i18n-aria`.

## Deployment

The site is served by GitHub Pages from the `gh-pages` branch, without GitHub Actions:

```bash
npm run deploy
```

This builds with the `/vibe_code_game/` base path, adds `.nojekyll`, and force-pushes `dist/` to `gh-pages`.

> [!IMPORTANT]
> One-time setup: in **Settings → Pages**, set **Source** to **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.

## Working with Claude Code

The repository ships [Claude Code](https://claude.com/claude-code) subagents in [`.claude/agents/`](.claude/agents/), meant to be used in this order:

1. **`planner`**: investigates and writes a plan to `docs/plans/` (no code changes).
2. **`gameplay-dev`**: implements the plan task by task, one test and one commit each.
3. **`golden-guardian`**: runs every check and diagnoses golden master drift (report only).
4. **`code-reviewer`**: reviews the diff against `main` before merging or deploying (read only).
5. **`balance-analyst`**: simulates many seeds to answer balance questions (read only).

## Roadmap

From the plans in [`docs/plans/`](docs/plans/):

- [ ] Translate room contents, views and data labels (i18n phase 2)
- [ ] Store logs, events and offers as keys + parameters so they can be translated (i18n phase 3)
- [ ] Replace inline handlers with `data-action` event delegation
- [ ] PWA / offline support
- [ ] Gameplay balancing, with intentional golden updates
- [ ] JSDoc types for `S` as a step toward TypeScript
