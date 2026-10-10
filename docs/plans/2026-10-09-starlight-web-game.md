# Starlight Ent. — Plan to turn the artifact into a web game

> **For the implementer:** work through the tasks in order. Each task ends with one commit. Do not merge tasks. If the golden test goes red at any refactor step → stop, make it green, then continue.

**Goal:** Turn the Claude artifact "Starlight Ent." (an entertainment-agency management game, a single HTML file of ~2,700 lines) into a standalone web game: modular source code, built with Vite, tested, autosaving in the browser plus save export/import, deployed to GitHub Pages. **Gameplay and UI stay 100% unchanged.**

**Architecture:** A *strangler*-style refactor: first lock the original's behavior with a **golden-master test** (simulate 30 weeks with a seeded RNG → state snapshot), then peel off CSS → data → utilities → game systems → UI into ES modules. Every step must reproduce that exact snapshot. Inline `onclick="..."` handlers are kept and wired to `window` through a single bridge module.

**Tech stack:** Vite 5 (vanilla JS, no framework) · Vitest 2 (unit tests) · Playwright (golden + smoke e2e, using the preinstalled Chromium) · GitHub Actions → GitHub Pages.

**Source:** `legacy/starlight-original.html` — a verbatim copy of the artifact `https://claude.ai/artifact/V8ouYuhicDjigTqU2nehF9` (version `1791522212-4a94`, sha256 `524521a1…f2d79b`). Never edit this file; it is the reference.

---

## 0. State of the original (surveyed)

| Aspect | Reality | Consequence for the refactor |
|---|---|---|
| Structure | A single `<script>` (lines 382–2724), split into sections by `/* ===== X ===== */` comments | Use those sections as module boundaries |
| Outer shell | Line 1 has a `<!doctype html><html><head>…<style>` added by the artifact service | Drop that shell and write a clean `index.html` |
| State | Global `let S`, reassigned (`S=d` on load) | A `state.js` module exporting a *live binding* `S` + `setState()` |
| Global UI variables | `curView, pos, awardToShow, curRC, repDay, tutI, DB…` | Each variable moves to the module that owns it, with a setter |
| Handlers | 117 inline `onclick/onchange/oninput`, ~104 distinct function names, including in dynamically generated HTML | A `ui/globals.js` module attaches those functions to `window` |
| v2/v3 patch layers | Overrides: `planWeek`, `weekV2`, `weekCost`, `xInfo`, `xResolve`, `aTags`, `RV.gym`, `RV.dorm` (lines 2529–2686) | ES modules cannot reassign imports → **merge the patches into the original functions** |
| Randomness | 75 uses of `Math.random`, via `R/rnd/pick` and direct calls | Seedable by replacing `Math.random` → golden test is feasible |
| Saving | `localStorage['starlight_idol_save_v1']` + a cloud "save code" via `window.claude.use('db')` | Drop the cloud part, replace with code & file export/import |
| Week simulation | `nextWeek(force, planned)`; `nextWeek(true,true)` skips planning & pending events | Use it as the driver for the golden test |
| External dependencies | Google Fonts only | Keep as is |

### Design decisions & rationale

1. **Golden master first, refactor second.** The original has no tests, and 2,300 lines of logic are intertwined. A state snapshot after 30 weeks with a fixed seed catches almost any drift (RNG call order, money and fan formulas…) without having to understand every system. Trade-off: no "while I'm here" logic changes during the split — changing logic belongs to a later phase.
2. **Live binding instead of rewriting `S.` as `state.S.`** — `export let S` + `setState()` keeps 100% of function bodies unchanged: small diff, low risk.
3. **Keep inline handlers + a `window` bridge** instead of rewriting to event delegation now. Delegation is cleaner but means editing 117 HTML strings — high risk, low benefit at this stage. A static test ensures every handler name is exported.
4. **No framework.** The game renders with template strings + `innerHTML`; adding React/Svelte would be a rewrite, not a migration.
5. **Serverless saves:** gzip (the browser's built-in CompressionStream) + base64url, prefixed `SL1.`. Free, leaks no data, and still lets players switch machines.

### Main risks

- **Circular imports** between system modules: safe with `function` (hoisted), but a `const` used at top level can hit the TDZ. Rule: `data/*` and `core/*` are leaves (no system/UI imports); no logic runs at top level outside `main.js`.
- **RNG order changes** while merging patches → golden goes red. Merge in exactly the original before/after call order.
- **Logic functions touching the DOM** (e.g. `save()` writes `#saved`, `addLog` does not). When unit testing systems, split the DOM part out (task 9).

---

## Target structure

```
index.html
vite.config.js
package.json
src/
  main.js                 # boot: load/newGame → migrateV3 → render → tutorial
  styles/                 # split from <style>: base, masthead, tower, chibi, deck, sheets, ui, tutorial
  core/
    rng.js                # R, rnd, pick (use Math.random → seedable in tests)
    util.js               # clamp, esc, fmt, fmtN, $
  data/
    names.js              # FN, MN, LNM, MGN, COSTARS, FT1, FT2, SONGS, GNAMES…
    looks.js              # HAIR, SKIN, OUT
    rules.js              # STATS, TRAIN, TRAIN_COST, ROOMS, MSK, MSKD, GENRES, CONCEPTS
    offers.js             # OFFER, PARTNERS, TT, RIVALS
  state.js                # export let S; setState(); abs, uid, byId, addLog, newGame
  systems/                # following the original's /* ===== */ sections
    artists.js managers.js relations.js offers.js week.js market.js
    events.js releases.js awards.js ext2.js ext3.js
  save/
    storage.js            # save(), load() + migrate (keeps the old KEY)
    transfer.js           # exportCode/importCode/exportFile/importFile
  ui/
    building.js views.js rooms.js modal.js tutorial.js saveView.js
    globals.js            # Object.assign(window, {...handlers})
legacy/starlight-original.html
tests/
  unit/*.test.js          # Vitest
  e2e/golden.spec.js      # Playwright golden master
  e2e/smoke.spec.js
  golden/week30.json
  fixtures/save-v1.json
scripts/check-handlers.mjs
.github/workflows/deploy.yml
```

---

## Phase A — Foundations & behavior lock

### Task 1: Scaffold the project

**Files:** create `package.json`, `vite.config.js`, `.gitignore`, `README.md`

1. `npm init -y`, then install (pin exact versions):
   ```bash
   npm i -D vite@5.4.10 vitest@2.1.4 @playwright/test@1.56.0 serve-handler@6.1.6
   ```
   - If `@playwright/test` does not match the preinstalled Chromium (`/opt/pw-browsers/chromium-1194`), do **not** run `playwright install`; set `launchOptions.executablePath` in `playwright.config.js` to that binary.
2. `package.json` scripts:
   ```json
   {
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview --port 4173",
       "test": "vitest run",
       "test:e2e": "playwright test",
       "check:handlers": "node scripts/check-handlers.mjs"
     }
   }
   ```
3. `vite.config.js`:
   ```js
   import { defineConfig } from 'vite';
   export default defineConfig({
     base: process.env.GITHUB_ACTIONS ? '/vibe_code_game/' : '/',
     build: { target: 'es2020' },
   });
   ```
4. `.gitignore`: `node_modules/ dist/ test-results/ playwright-report/`
5. Run `npm run build` (it will fail because there is no `index.html` yet — expected; task 3 handles it).
6. Commit: `chore: scaffold Vite + Vitest + Playwright`

### Task 2: Golden-master test on the original

**Files:** create `playwright.config.js`, `tests/e2e/golden.spec.js`, `tests/e2e/seed.js`, `tests/golden/week30.json`

**Idea:** run the same scenario on `legacy/starlight-original.html` (now) and on the Vite version (every later task); the results must match byte for byte.

1. `tests/e2e/seed.js` — a script injected into the page before the game runs:
   ```js
   // Mulberry32: 32-bit PRNG, good enough and reproducible.
   export const seedScript = (seed) => `
     (() => {
       let a = ${seed} >>> 0;
       Math.random = () => {
         a |= 0; a = (a + 0x6D2B79F5) | 0;
         let t = Math.imul(a ^ (a >>> 15), 1 | a);
         t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
         return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
       };
       const T = 1790000000000; Date.now = () => T;
       localStorage.clear();
       // skip the tutorial so no setTimeout interferes
       localStorage.setItem('__golden', '1');
     })();`;
   ```
2. `tests/e2e/golden.spec.js`:
   ```js
   import { test, expect } from '@playwright/test';
   import fs from 'node:fs';
   import { seedScript } from './seed.js';

   const TARGET = process.env.GOLDEN_TARGET ?? '/';   // '/legacy/starlight-original.html' when recording the golden
   const GOLDEN = 'tests/golden/week30.json';

   test('30 simulated weeks match the golden master', async ({ page }) => {
     const errors = [];
     page.on('pageerror', e => errors.push(e.message));
     await page.addInitScript(seedScript(42));
     await page.goto(TARGET);
     const snap = await page.evaluate(() => {
       const g = window.__game ?? { nextWeek: window.nextWeek, state: () => S };
       for (let i = 0; i < 30; i++) g.nextWeek(true, true);
       return JSON.stringify(g.state());
     });
     expect(errors).toEqual([]);
     if (process.env.UPDATE_GOLDEN) fs.writeFileSync(GOLDEN, snap);
     expect(snap).toBe(fs.readFileSync(GOLDEN, 'utf8'));
   });
   ```
   - The original declares `S` with `let` in a classic script → reachable by name `S` inside `page.evaluate` (same global lexical scope).
3. `playwright.config.js`: `webServer` runs `npx vite --port 5173` (Vite can serve `/legacy/…` since it is inside the root), `use.baseURL = 'http://localhost:5173'`, chromium project only.
4. Record the golden from the original:
   ```bash
   GOLDEN_TARGET=/legacy/starlight-original.html UPDATE_GOLDEN=1 npx playwright test golden
   GOLDEN_TARGET=/legacy/starlight-original.html npx playwright test golden   # rerun: must PASS
   ```
   - The second run proves determinism. If it FAILS → there is still an unlocked source of randomness (check `new Date()`, `crypto`, `setTimeout`) — fix `seed.js`, not the game.
   - Sanity-check that the golden is meaningful: `week`/`year` = week 31, `log` is populated, `artists` fans have changed.
5. Commit: `test: 30-week golden master from the original artifact`

### Task 3: Run the original under Vite, logic unchanged

**Files:** create `index.html`, `src/legacy-game.js` (temporary), `src/main.js`

1. `index.html`: take the `<head>` (title, Google Fonts) + the `<style>` block + the `<div class="wrap">…</div><div class="sheet">` markup from the original, **drop** the wrapper on line 1 but move its useful rules (safe-area padding) into CSS. Add `<meta name="viewport">`, `<html lang="vi">`, and a 🌟 emoji favicon (inline SVG).
2. Copy the `<script>` block (lines 383–2723) verbatim into `public/legacy-game.js` and load it with `<script src="/legacy-game.js"></script>` (a classic script, not a module yet).
3. Add the test hook at the very end of the file (the only added line):
   ```js
   window.__game = { nextWeek: (...a) => nextWeek(...a), state: () => S };
   ```
4. Tutorial hook: at boot, change `if(!S.tut)` to `if(!S.tut && !localStorage.getItem('__golden'))`. (No RNG impact since the tutorial never calls random — verified by the golden.)
5. Verify: `npx playwright test golden` → PASS; open `npm run dev` by hand and play 2 weeks.
6. Commit: `feat: run the game under Vite (classic script, logic unchanged)`

---

## Phase B — Split into modules (every task: golden must stay green)

> Loop for tasks 4–10: **cut** a block of code → **paste** it into a new module → add `import`/`export` → update `ui/globals.js` if it is a handler → `npm run check:handlers && npx playwright test golden && npm test` → commit.

### Task 4: Move to ES modules + window bridge

**Files:** move `public/legacy-game.js` → `src/game.js` (module); create `src/ui/globals.js`, `scripts/check-handlers.mjs`

1. `scripts/check-handlers.mjs` (write it first — this is the "red test"):
   ```js
   // Every function name in on*="fn(" must appear in the export list of ui/globals.js
   import fs from 'node:fs'; import path from 'node:path';
   const files = [...walk('src'), 'index.html'];
   const used = new Set();
   for (const f of files) for (const m of fs.readFileSync(f,'utf8').matchAll(/on(?:click|change|input)="(?:event\.[^;]+;)?\s*(?:if\([^)]*\))?\s*([A-Za-z_$][\w$]*)\s*\(/g)) used.add(m[1]);
   const g = fs.readFileSync('src/ui/globals.js','utf8');
   const missing = [...used].filter(n => !new RegExp(`\\b${n}\\b`).test(g));
   if (missing.length) { console.error('Handlers missing on window:', missing); process.exit(1); }
   console.log(`OK: ${used.size} handlers`);
   function* walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})) { const p=path.join(d,e.name); e.isDirectory()? yield* walk(p) : p.endsWith('.js') && (yield p); } }
   ```
   - Get the original list with `grep -oE 'on(click|change|input)="[^"]*' legacy/starlight-original.html` to check that the regex catches all ~104 names (including forms like `if(event.target===this)closeM()`).
2. Change the `<script src>` to `<script type="module" src="/src/main.js">`; `main.js` only does `import './game.js'`.
3. `src/game.js`: at the end of the file call `Object.assign(window, { nextWeek, view, openRoom, closeM, … })` with the full handler list. Everything is still one module, so `ui/globals.js` is not needed yet; task 10 moves this block there.
4. Module strict mode will expose assignments to undeclared variables (if any) → fix with a `let` declaration and note it in the commit.
5. Verify: check:handlers OK, golden PASS, manual smoke (open every room in the dock).
6. Commit: `refactor: move the game to ES modules, bridge handlers through window`

### Task 5: Split the CSS

**Files:** `src/styles/{base,masthead,tower,chibi,deck,sheets,ui,tutorial}.css`, `src/styles/index.css`

1. Cut `<style>` along the existing `/* ===== … ===== */` comments → one file per section; `index.css` `@import`s them in the original order (cascade order matters).
2. `main.js`: `import './styles/index.css'`.
3. Visual check: Playwright screenshot of the home page before/after (`expect(page).toHaveScreenshot()` — add it to `smoke.spec.js`, recording the baseline in a commit before the CSS split).
4. Commit: `refactor: split CSS into modules by area`

### Task 6: Split out `core/` and `data/`

**Files:** `src/core/rng.js`, `src/core/util.js`, `src/data/*.js`, `tests/unit/util.test.js`

1. Write the test `tests/unit/util.test.js` first:
   ```js
   import { fmt, fmtN, clamp, esc } from '../../src/core/util.js';
   import { describe, it, expect } from 'vitest';
   describe('fmt', () => {
     it('billions / millions / thousands', () => {
       expect(fmt(1.5e9)).toBe('1.5 tỷ');
       expect(fmt(600e6)).toBe('600 tr');
       expect(fmt(-2e6)).toBe('-2 tr');
       expect(fmt(4500)).toBe('5k');
     });
   });
   describe('fmtN', () => {
     it('K/M', () => { expect(fmtN(1500)).toBe('1.5K'); expect(fmtN(2_000_000)).toBe('2M'); expect(fmtN(12)).toBe('12'); });
   });
   it('clamp', () => { expect(clamp(5,0,3)).toBe(3); });
   it('esc prevents XSS', () => { expect(esc('<a href="x">')).toBe('&lt;a href=&quot;x&quot;&gt;'); });
   ```
   Run `npm test` → FAIL (the module does not exist yet).
2. Move `R, rnd, pick` → `rng.js`; `clamp, esc, fmt, fmtN, $` → `util.js`; the constants on lines 391–472 → `data/*` following the structure table. Data modules only import `core/`.
3. `npm test` PASS, golden PASS.
4. Commit: `refactor: split out core utils and game data`

### Task 7: `state.js` with a live binding

**Files:** `src/state.js`, `tests/unit/state.test.js`

1. ```js
   export let S = null;
   export const setState = (next) => { S = next; };
   export const abs = () => (S.year - 1) * 52 + S.week;
   export const uid = () => S.nid++;
   export const byId = (id) => S.artists.find(a => a.id === id);
   export function addLog(t, c = '') { S.log.unshift({ t, c, w: `N${S.year}·T${S.week}` }); if (S.log.length > 80) S.log.length = 80; }
   ```
2. Every `S = …` in the code (newGame, load, import) → `setState(…)`. Find them with `grep -nE '(^|[^.\w])S=' src`.
3. Test: `setState({year:2,week:3,…})` → `abs()===55`; `addLog` caps at 80.
4. Commit: `refactor: state module with a live binding`

### Task 8: Merge the v2/v3 patch layers into the original functions

**Files:** `src/game.js`

This must happen **before** splitting the systems, because once split, imports cannot be overridden.

| Patch (original line) | Merge as |
|---|---|
| `planWeek` (2529) | add the `restRec` block at the end of the original `planWeek`, before `return` |
| `weekV2` (2625) | at the end of the original `weekV2`: `migrateV3(); v3Tick();` |
| `weekCost` (2626) | add PA & health-specialist salaries to the original `return` |
| `xInfo`, `xResolve` (2673–2674) | an `if (e.kind === 'v3') return v3Info(e)` branch at the top of the original function |
| `aTags` (2677) | append the PA/rest tag part to the end of the original function |
| `RV.gym`, `RV.dorm` (2541, 2686) | write the new definitions directly into the `RV` object |

- After each merge: run the golden. Delete the variables `_pw, _w2, _wc, _xI, _xR, _aT, _gym, _dorm`.
- Commit: `refactor: merge v2/v3 patch layers into the original functions`

### Task 9: Split the game systems (pure logic) — one commit per section

**Files:** `src/systems/*.js`, `src/save/storage.js`, `tests/unit/*.test.js`

Order (fewest dependencies → most): `relations` → `artists` (genArtist, mkLook, fit, fame) → `managers` → `offers` → `market` (trend, rivals, biz) → `events` → `releases` (single/concert/film/debut) → `awards` → `ext2` → `ext3` → `week` (nextWeek, last).

For each section:
1. Write 1–3 unit tests for the most important pure function **before** moving it, using a seed:
   ```js
   // tests/unit/helpers.js
   export function seed(n = 1) { let a = n; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
   ```
   Worthwhile tests:
   - `genArtist`: every stat in `[3, 68]`, `talent` in `[0.75, 1.25]`, no duplicate names.
   - `fit(a, w)`: correct weighted average.
   - `weekCost()`: = sum of artist + manager + PA + specialist salaries.
   - `nextWeek(true,true)` for 1 week: `week` goes up by 1, money drops by exactly the salaries when there is no income.
   - `load()` with `tests/fixtures/save-v1.json` (old state missing `managers`, `songs`…): does not throw, arrays get initialized (this is the migration test).
2. Logic functions that touch the DOM (`save()` writes `#saved`, `toast`) → split: logic returns data, UI displays it. E.g. `save()` → `storage.save(S)` returns `{ok}`, and the `ui` updates `#saved`. RNG call order must be preserved.
3. Move the code; golden + unit + check:handlers green; commit `refactor(systems): split out <section>`.

### Task 10: Split the UI

**Files:** `src/ui/{modal,building,views,rooms,tutorial,saveView,globals}.js`, `src/main.js`

1. `modal.js`: `view, modal, closeM, toast, curView/curRC` (UI variables → this module, with exported setters).
2. `building.js`: `chibiHTML, renderBuilding, renderTop, renderDock, renderTrend, render`.
3. `rooms.js`: the `RV` object + `openRoom`, `trainRoom`.
4. `views.js`: the remaining `view*` functions; `tutorial.js`: `TUT, tutStart…`.
5. `globals.js`: centralize `Object.assign(window, {...})` — importing from every UI/system module with handlers. Delete the temporary copy in `game.js`. `src/game.js` should now be empty → delete it.
6. `main.js` — boot identical to lines 2718–2722, minus the `window.claude` part:
   ```js
   import './styles/index.css';
   import './ui/globals.js';
   import { load } from './save/storage.js';
   import { newGame } from './state.js';
   import { migrateV3 } from './systems/ext3.js';
   import { render } from './ui/building.js';
   import { tutStart } from './ui/tutorial.js';
   import { S } from './state.js';
   import { save } from './save/storage.js';
   import { nextWeek } from './systems/week.js';

   if (!load()) newGame();
   migrateV3(); render(); save();
   if (!S.tut && !localStorage.getItem('__golden')) setTimeout(() => tutStart(0), 400);
   window.__game = { nextWeek, state: () => S };
   ```
7. Verify: golden, unit, check:handlers, screenshot smoke. Commit: `refactor(ui): split UI into modules`.

---

## Phase C — Web features

### Task 11: Replace the "cloud save code" with save export/import

**Files:** `src/save/transfer.js`, `src/ui/saveView.js`, `tests/unit/transfer.test.js`; delete `cloudPut/cloudSave/cloudAuto/cloudCheck/cloudLoad/newCode/DB/dbState`

1. Tests first:
   ```js
   import { exportCode, importCode } from '../../src/save/transfer.js';
   it('round-trip preserves state', async () => {
     const s = { v: 1, year: 2, week: 7, artists: [{ id: 1, name: 'Hà Linh' }], log: [] };
     const code = await exportCode(s);
     expect(code.startsWith('SL1.')).toBe(true);
     expect(await importCode(code)).toEqual(s);
   });
   it('rejects corrupt codes', async () => {
     await expect(importCode('SL1.abc')).rejects.toThrow();
     await expect(importCode('xyz')).rejects.toThrow(/không hợp lệ/);
   });
   it('rejects data that is not a save', async () => {
     await expect(importCode(await exportCode({ foo: 1 }))).rejects.toThrow();
   });
   ```
2. Implementation:
   ```js
   const PREFIX = 'SL1.';
   const toB64u = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
   // note: a large save makes the spread overflow the stack; loop over 32KB chunks instead
   export async function exportCode(state) {
     const gz = new Blob([JSON.stringify(state)]).stream().pipeThrough(new CompressionStream('gzip'));
     return PREFIX + toB64u(new Uint8Array(await new Response(gz).arrayBuffer()));
   }
   export async function importCode(code) {
     code = String(code).trim();
     if (!code.startsWith(PREFIX)) throw new Error('Mã không hợp lệ');
     const bin = Uint8Array.from(atob(code.slice(4).replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
     const txt = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
     const d = JSON.parse(txt);
     if (!d || !Array.isArray(d.artists)) throw new Error('Dữ liệu không phải save Starlight');
     return d;
   }
   export const exportFile = (state) => { /* JSON Blob → <a download="starlight-N{y}-T{w}.json"> */ };
   export const importFile = async (file) => importCode(…) /* or JSON.parse directly for a .json file */;
   ```
   - Vitest on Node 22 has `CompressionStream`, `Blob` and `atob` built in → no jsdom needed.
3. `saveView.js` replaces `viewCode`: two blocks, "Export" (buttons *Copy code*, *Download .json*) and "Import" (paste a code / pick a file → preview `Year · Week · Funds · artist count` → confirm *Overwrite current game*). After import, go through the normal `load()` path so migrations run. Keep the 🔑 button in the masthead.
4. The golden might change (because `cloudAuto` is removed — it makes no RNG calls, so it **should not**). If it changes → investigate, don't update blindly.
5. Add an e2e to `smoke.spec.js`: play 3 weeks → export a code → clear localStorage → reload → import the code → week = 4.
6. Commit: `feat(save): export/import saves via code & file, drop Claude sync`

### Task 12: Smoke e2e & UI regression protection

**Files:** `tests/e2e/smoke.spec.js`

Scenarios (unseeded, checking "nothing breaks"):
- The page loads with no `pageerror`/`console.error`.
- Click each of the 16 buttons in `#dock` → `#sheet.on` appears each time and closes with ✕.
- Press "End week" 10 times, handling plan/report modals with the primary button (`.btn.pri`) → `#date` changes.
- Reload → state persists (autosave).
- 375×812 viewport (mobile): no horizontal scroll (`document.documentElement.scrollWidth <= 375`).

Commit: `test: smoke e2e for rooms, week loop, autosave, mobile`

### Task 13: Deploy to GitHub Pages

**Files:** `.github/workflows/deploy.yml`, `README.md`

```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run check:handlers
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.d.outputs.page_url }} }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```

- **Manual step for the repo owner:** Settings → Pages → Source = *GitHub Actions*.
- Check that `base: '/vibe_code_game/'` works: `GITHUB_ACTIONS=1 npm run build && npx vite preview --base /vibe_code_game/` → open it, play 1 week.
- README: how to run (`npm i`, `npm run dev`), how to test, how to update the golden (`UPDATE_GOLDEN=1` — only when **intentionally** changing gameplay), link to the game.
- Commit: `ci: test + deploy to GitHub Pages`

> [!NOTE]
> Deployment later moved off GitHub Actions to `npm run deploy`, which pushes `dist/` to the `gh-pages` branch. See the README.

---

## Definition of Done

- [ ] `npm test`, `npm run check:handlers`, `npx playwright test` all green on CI.
- [ ] The 30-week golden matches the original artifact (proving gameplay is unchanged).
- [ ] No remaining references to `window.claude`, `DB.`, `cloud*` in `src/`.
- [ ] No file over ~400 lines in `src/` (except `data/` and `views.js` where reasonable).
- [ ] The game runs at `https://susanquynh.github.io/vibe_code_game/`, is playable on mobile, saves survive reload, and export/import works between 2 browsers.

## Out of scope (proposed for later phases)

- Move inline handlers → `data-action` event delegation (once smoke tests are thorough).
- PWA/offline, install to home screen.
- Gameplay balancing / logic fixes (update the golden intentionally at that point).
- TypeScript (JSDoc types for `S` first as a cheap stepping stone).
- Migrating saves from the old Claude version: the artifact has no export button → an `SL1.` export button would need to be added to the artifact if players want to carry their progress over.
