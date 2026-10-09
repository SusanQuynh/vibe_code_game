# Starlight Ent. — Kế hoạch chuyển artifact thành web game

> **Cho người thực thi:** làm tuần tự từng task. Mỗi task kết thúc bằng một commit. Không gộp task. Nếu golden test đỏ ở bất kỳ bước refactor nào → dừng, sửa cho xanh rồi mới đi tiếp.

**Mục tiêu:** Biến artifact Claude “Starlight Ent.” (game quản lý công ty giải trí, 1 file HTML ~2.700 dòng) thành một web game độc lập: mã nguồn tách module, build bằng Vite, có test, tự lưu trên trình duyệt + xuất/nhập save, deploy lên GitHub Pages. **Gameplay và giao diện giữ nguyên 100%.**

**Kiến trúc:** Refactor kiểu *strangler*: trước tiên khoá hành vi của bản gốc bằng một **golden-master test** (mô phỏng 30 tuần với RNG có seed → snapshot state), sau đó bóc dần CSS → data → tiện ích → hệ thống game → UI ra ES modules. Mỗi bước phải tái tạo đúng snapshot đó. Handler `onclick="..."` inline được giữ, nối vào `window` qua một module cầu nối duy nhất.

**Tech stack:** Vite 5 (vanilla JS, không framework) · Vitest 2 (unit test) · Playwright (golden + smoke e2e, dùng Chromium có sẵn) · GitHub Actions → GitHub Pages.

**Nguồn:** `legacy/starlight-original.html` — bản sao nguyên văn artifact `https://claude.ai/artifact/V8ouYuhicDjigTqU2nehF9` (version `1791522212-4a94`, sha256 `524521a1…f2d79b`). Không bao giờ sửa file này; nó là chuẩn đối chiếu.

---

## 0. Hiện trạng bản gốc (đã khảo sát)

| Khía cạnh | Thực tế | Hệ quả cho refactor |
|---|---|---|
| Cấu trúc | 1 `<script>` duy nhất (dòng 382–2724), chia mục bằng comment `/* ===== X ===== */` | Dùng chính các mục này làm ranh giới module |
| Khung ngoài | Dòng 1 có `<!doctype html><html><head>…<style>` do artifact service bọc thêm | Bỏ khung này, viết `index.html` sạch |
| State | `let S` toàn cục, bị gán lại (`S=d` khi load) | Module `state.js` export *live binding* `S` + `setState()` |
| Biến UI toàn cục | `curView, pos, awardToShow, curRC, repDay, tutI, DB…` | Mỗi biến về module sở hữu nó, có setter |
| Handler | 117 `onclick/onchange/oninput` inline, ~104 tên hàm khác nhau, cả trong HTML sinh động | Module `ui/globals.js` gán các hàm đó lên `window` |
| Lớp vá v2/v3 | Gán đè: `planWeek`, `weekV2`, `weekCost`, `xInfo`, `xResolve`, `aTags`, `RV.gym`, `RV.dorm` (dòng 2529–2686) | ES module không cho gán đè import → **gộp vá vào hàm gốc** |
| Ngẫu nhiên | 75 lần `Math.random`, qua `R/rnd/pick` và gọi trực tiếp | Seed được bằng cách thay `Math.random` → golden test khả thi |
| Lưu | `localStorage['starlight_idol_save_v1']` + “mã lưu” đám mây qua `window.claude.use('db')` | Bỏ phần đám mây, thay bằng xuất/nhập mã & file |
| Mô phỏng tuần | `nextWeek(force, planned)`; `nextWeek(true,true)` bỏ qua kế hoạch & sự kiện chờ | Dùng làm driver cho golden test |
| Ngoại vi | Chỉ Google Fonts | Giữ nguyên |

### Quyết định thiết kế & lý do

1. **Golden master trước, refactor sau.** Không có test nào trong bản gốc; 2.300 dòng logic đan xen. Snapshot state sau 30 tuần với seed cố định bắt được gần như mọi sai lệch (thứ tự gọi RNG, công thức tiền, fan…) mà không cần hiểu hết từng hệ thống. Đánh đổi: không được “tiện tay sửa logic” trong lúc tách — sửa logic là việc của giai đoạn sau.
2. **Live binding thay vì đổi `S.` thành `state.S.`** — `export let S` + `setState()` giữ nguyên 100% thân hàm, diff nhỏ, ít rủi ro.
3. **Giữ handler inline + cầu nối `window`** thay vì viết lại sang event delegation ngay. Delegation sạch hơn nhưng phải sửa 117 chuỗi HTML — rủi ro cao, lợi ích thấp ở giai đoạn này. Có test tĩnh đảm bảo mọi tên handler đều được export.
4. **Không framework.** Game render bằng template string + `innerHTML`; thêm React/Svelte là viết lại, không phải chuyển đổi.
5. **Save không server:** gzip (CompressionStream có sẵn trong trình duyệt) + base64url, tiền tố `SL1.`. Không tốn chi phí, không lộ dữ liệu, và vẫn chuyển máy được.

### Rủi ro chính

- **Import vòng (circular imports)** giữa các module hệ thống: an toàn với `function` (hoisted), nhưng `const` dùng ở top-level có thể dính TDZ. Quy tắc: `data/*` và `core/*` là lá (không import hệ thống/UI); không chạy logic ở top-level ngoài `main.js`.
- **Thứ tự RNG thay đổi** khi gộp vá → golden đỏ. Gộp đúng thứ tự gọi gốc trước/sau.
- **Hàm logic chạm DOM** (vd `save()` ghi `#saved`, `addLog` không chạm). Khi unit test hệ thống, cần tách phần DOM ra (task 9).

---

## Cấu trúc đích

```
index.html
vite.config.js
package.json
src/
  main.js                 # boot: load/newGame → migrateV3 → render → tutorial
  styles/                 # tách từ <style>: base, masthead, tower, chibi, deck, sheets, ui, tutorial
  core/
    rng.js                # R, rnd, pick (dùng Math.random → seed được trong test)
    util.js               # clamp, esc, fmt, fmtN, $
  data/
    names.js              # FN, MN, LNM, MGN, COSTARS, FT1, FT2, SONGS, GNAMES…
    looks.js              # HAIR, SKIN, OUT
    rules.js              # STATS, TRAIN, TRAIN_COST, ROOMS, MSK, MSKD, GENRES, CONCEPTS
    offers.js             # OFFER, PARTNERS, TT, RIVALS
  state.js                # export let S; setState(); abs, uid, byId, addLog, newGame
  systems/                # theo các mục /* ===== */ của bản gốc
    artists.js managers.js relations.js offers.js week.js market.js
    events.js releases.js awards.js ext2.js ext3.js
  save/
    storage.js            # save(), load() + migrate (giữ KEY cũ)
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

## Giai đoạn A — Nền móng & khoá hành vi

### Task 1: Scaffold dự án

**Files:** tạo `package.json`, `vite.config.js`, `.gitignore`, `README.md`

1. `npm init -y`, rồi cài (pin chính xác phiên bản):
   ```bash
   npm i -D vite@5.4.10 vitest@2.1.4 @playwright/test@1.56.0 serve-handler@6.1.6
   ```
   - Nếu `@playwright/test` không khớp Chromium có sẵn (`/opt/pw-browsers/chromium-1194`), **không** chạy `playwright install`; đặt `launchOptions.executablePath` trong `playwright.config.js` trỏ tới binary đó.
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
5. Chạy `npm run build` (sẽ lỗi vì chưa có `index.html` — bình thường, task 3 xử lý).
6. Commit: `chore: scaffold Vite + Vitest + Playwright`

### Task 2: Golden-master test trên bản gốc

**Files:** tạo `playwright.config.js`, `tests/e2e/golden.spec.js`, `tests/e2e/seed.js`, `tests/golden/week30.json`

**Ý tưởng:** chạy cùng một kịch bản trên `legacy/starlight-original.html` (bây giờ) và trên bản Vite (mọi task sau); kết quả phải giống từng byte.

1. `tests/e2e/seed.js` — script tiêm vào trang trước khi game chạy:
   ```js
   // Mulberry32: PRNG 32-bit, đủ tốt và tái lập được.
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
       // bỏ tutorial để không có setTimeout chen vào
       localStorage.setItem('__golden', '1');
     })();`;
   ```
2. `tests/e2e/golden.spec.js`:
   ```js
   import { test, expect } from '@playwright/test';
   import fs from 'node:fs';
   import { seedScript } from './seed.js';

   const TARGET = process.env.GOLDEN_TARGET ?? '/';   // '/legacy/starlight-original.html' khi ghi golden
   const GOLDEN = 'tests/golden/week30.json';

   test('30 tuần mô phỏng khớp golden master', async ({ page }) => {
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
   - Bản gốc khai báo `S` bằng `let` trong script cổ điển → truy cập được trong `page.evaluate` bằng tên `S` (cùng global lexical scope).
3. `playwright.config.js`: `webServer` chạy `npx vite --port 5173` (Vite phục vụ được cả `/legacy/…` vì nằm trong root), `use.baseURL = 'http://localhost:5173'`, chỉ project chromium.
4. Ghi golden từ bản gốc:
   ```bash
   GOLDEN_TARGET=/legacy/starlight-original.html UPDATE_GOLDEN=1 npx playwright test golden
   GOLDEN_TARGET=/legacy/starlight-original.html npx playwright test golden   # chạy lại: phải PASS
   ```
   - Chạy lần 2 để chứng minh tính tất định. Nếu FAIL → còn nguồn ngẫu nhiên chưa khoá (kiểm tra `new Date()`, `crypto`, `setTimeout`) — sửa `seed.js`, không sửa game.
   - Kiểm tra nhanh golden có ý nghĩa: `week`/`year` = tuần 31, có `log`, `artists` có fans thay đổi.
5. Commit: `test: golden master 30 tuần từ bản artifact gốc`

### Task 3: Chạy bản gốc dưới Vite, chưa đổi logic

**Files:** tạo `index.html`, `src/legacy-game.js` (tạm), `src/main.js`

1. `index.html`: lấy `<head>` (title, Google Fonts) + phần `<style>` + markup `<div class="wrap">…</div><div class="sheet">` từ bản gốc, **bỏ** khung bọc ở dòng 1 nhưng chuyển các luật hữu ích của nó (safe-area padding) vào CSS. Thêm `<meta name="viewport">`, `<html lang="vi">`, favicon emoji 🌟 (SVG inline).
2. Copy nguyên văn khối `<script>` (dòng 383–2723) vào `public/legacy-game.js` và nạp bằng `<script src="/legacy-game.js"></script>` (script cổ điển, chưa module).
3. Ngay cuối file thêm hook test (dòng duy nhất được thêm):
   ```js
   window.__game = { nextWeek: (...a) => nextWeek(...a), state: () => S };
   ```
4. Hook tutorial: ở boot, đổi `if(!S.tut)` thành `if(!S.tut && !localStorage.getItem('__golden'))`. (Không ảnh hưởng RNG vì tutorial không gọi random — xác minh bằng golden.)
5. Verify: `npx playwright test golden` → PASS; `npm run dev` mở tay, chơi 2 tuần.
6. Commit: `feat: chạy game dưới Vite (script cổ điển, chưa đổi logic)`

---

## Giai đoạn B — Tách module (mỗi task: golden phải xanh)

> Quy trình lặp cho task 4–10: **cắt** đoạn code → **dán** vào module mới → thêm `import`/`export` → cập nhật `ui/globals.js` nếu là handler → `npm run check:handlers && npx playwright test golden && npm test` → commit.

### Task 4: Chuyển sang ES module + cầu nối window

**Files:** chuyển `public/legacy-game.js` → `src/game.js` (module); tạo `src/ui/globals.js`, `scripts/check-handlers.mjs`

1. `scripts/check-handlers.mjs` (viết trước — đây là “test đỏ”):
   ```js
   // Mọi tên hàm trong on*="fn(" phải có trong danh sách export của ui/globals.js
   import fs from 'node:fs'; import path from 'node:path';
   const files = [...walk('src'), 'index.html'];
   const used = new Set();
   for (const f of files) for (const m of fs.readFileSync(f,'utf8').matchAll(/on(?:click|change|input)="(?:event\.[^;]+;)?\s*(?:if\([^)]*\))?\s*([A-Za-z_$][\w$]*)\s*\(/g)) used.add(m[1]);
   const g = fs.readFileSync('src/ui/globals.js','utf8');
   const missing = [...used].filter(n => !new RegExp(`\\b${n}\\b`).test(g));
   if (missing.length) { console.error('Thiếu handler trên window:', missing); process.exit(1); }
   console.log(`OK: ${used.size} handler`);
   function* walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})) { const p=path.join(d,e.name); e.isDirectory()? yield* walk(p) : p.endsWith('.js') && (yield p); } }
   ```
   - Lấy danh sách gốc: `grep -oE 'on(click|change|input)="[^"]*' legacy/starlight-original.html` để soát regex bắt đủ ~104 tên (gồm cả dạng `if(event.target===this)closeM()`).
2. Đổi `<script src>` thành `<script type="module" src="/src/main.js">`; `main.js` chỉ `import './game.js'`.
3. `src/game.js`: ở cuối file gọi `Object.assign(window, { nextWeek, view, openRoom, closeM, … })` với đủ danh sách handler. Lúc này mọi thứ còn chung một module nên chưa cần `ui/globals.js`; task 10 sẽ chuyển khối này sang đó.
4. Chế độ strict của module sẽ lộ lỗi gán biến chưa khai báo (nếu có) → sửa bằng `let` khai báo, ghi chú trong commit.
5. Verify: check:handlers OK, golden PASS, smoke tay (mở mọi phòng trong dock).
6. Commit: `refactor: chuyển game sang ES module, cầu nối handler qua window`

### Task 5: Tách CSS

**Files:** `src/styles/{base,masthead,tower,chibi,deck,sheets,ui,tutorial}.css`, `src/styles/index.css`

1. Cắt `<style>` theo các comment `/* ===== … ===== */` có sẵn → mỗi mục một file; `index.css` `@import` theo đúng thứ tự gốc (thứ tự cascade quan trọng).
2. `main.js`: `import './styles/index.css'`.
3. Verify trực quan: Playwright screenshot trang chủ trước/sau (`expect(page).toHaveScreenshot()` — thêm vào `smoke.spec.js`, ghi baseline ở commit trước khi tách CSS).
4. Commit: `refactor: tách CSS thành module theo khu vực`

### Task 6: Tách `core/` và `data/`

**Files:** `src/core/rng.js`, `src/core/util.js`, `src/data/*.js`, `tests/unit/util.test.js`

1. Viết test trước `tests/unit/util.test.js`:
   ```js
   import { fmt, fmtN, clamp, esc } from '../../src/core/util.js';
   import { describe, it, expect } from 'vitest';
   describe('fmt', () => {
     it('tỷ / triệu / nghìn', () => {
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
   it('esc chống XSS', () => { expect(esc('<a href="x">')).toBe('&lt;a href=&quot;x&quot;&gt;'); });
   ```
   Chạy `npm test` → FAIL (module chưa có).
2. Di chuyển `R, rnd, pick` → `rng.js`; `clamp, esc, fmt, fmtN, $` → `util.js`; hằng số dòng 391–472 → `data/*` theo bảng cấu trúc. Data module chỉ import `core/`.
3. `npm test` PASS, golden PASS.
4. Commit: `refactor: tách core utils và game data`

### Task 7: `state.js` với live binding

**Files:** `src/state.js`, `tests/unit/state.test.js`

1. ```js
   export let S = null;
   export const setState = (next) => { S = next; };
   export const abs = () => (S.year - 1) * 52 + S.week;
   export const uid = () => S.nid++;
   export const byId = (id) => S.artists.find(a => a.id === id);
   export function addLog(t, c = '') { S.log.unshift({ t, c, w: `N${S.year}·T${S.week}` }); if (S.log.length > 80) S.log.length = 80; }
   ```
2. Mọi chỗ `S = …` trong code (newGame, load, import) → `setState(…)`. Tìm bằng `grep -nE '(^|[^.\w])S=' src`.
3. Test: `setState({year:2,week:3,…})` → `abs()===55`; `addLog` cắt ở 80.
4. Commit: `refactor: state module với live binding`

### Task 8: Gộp các lớp vá v2/v3 vào hàm gốc

**Files:** `src/game.js`

Phải làm **trước** khi tách hệ thống, vì sau khi tách, import không gán đè được.

| Vá (dòng gốc) | Gộp thành |
|---|---|
| `planWeek` (2529) | thêm khối `restRec` vào cuối `planWeek` gốc, trước `return` |
| `weekV2` (2625) | cuối `weekV2` gốc: `migrateV3(); v3Tick();` |
| `weekCost` (2626) | cộng thêm lương PA & chuyên gia sức khoẻ trong `return` gốc |
| `xInfo`, `xResolve` (2673–2674) | nhánh `if (e.kind === 'v3') return v3Info(e)` ở đầu hàm gốc |
| `aTags` (2677) | nối phần tag PA/nghỉ vào cuối hàm gốc |
| `RV.gym`, `RV.dorm` (2541, 2686) | viết thẳng định nghĩa mới trong object `RV` |

- Sau mỗi dòng gộp: chạy golden. Xoá biến `_pw, _w2, _wc, _xI, _xR, _aT, _gym, _dorm`.
- Commit: `refactor: gộp các lớp vá v2/v3 vào hàm gốc`

### Task 9: Tách hệ thống game (logic thuần) — mỗi mục 1 commit

**Files:** `src/systems/*.js`, `src/save/storage.js`, `tests/unit/*.test.js`

Thứ tự (từ ít phụ thuộc → nhiều): `relations` → `artists` (genArtist, mkLook, fit, fame) → `managers` → `offers` → `market` (trend, rivals, biz) → `events` → `releases` (single/concert/film/debut) → `awards` → `ext2` → `ext3` → `week` (nextWeek, sau cùng).

Với mỗi mục:
1. Viết 1–3 unit test cho hàm thuần quan trọng nhất **trước khi** di chuyển, dùng seed:
   ```js
   // tests/unit/helpers.js
   export function seed(n = 1) { let a = n; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
   ```
   Gợi ý test có giá trị:
   - `genArtist`: mọi chỉ số trong `[3, 68]`, `talent` trong `[0.75, 1.25]`, tên không trùng.
   - `fit(a, w)`: trung bình có trọng số đúng.
   - `weekCost()`: = tổng lương nghệ sĩ + quản lý + PA + chuyên gia.
   - `nextWeek(true,true)` 1 tuần: `week` tăng 1, tiền giảm đúng bằng lương khi không có thu nhập.
   - `load()` với `tests/fixtures/save-v1.json` (state cũ thiếu `managers`, `songs`…): không ném lỗi, các mảng được khởi tạo (đây là test migration).
2. Hàm logic nào chạm DOM (`save()` ghi `#saved`, `toast`) → tách: logic trả về dữ liệu, UI hiển thị. Ví dụ `save()` → `storage.save(S)` trả `{ok}`, còn `ui` cập nhật `#saved`. Phải giữ nguyên thứ tự gọi RNG.
3. Di chuyển code; golden + unit + check:handlers xanh; commit `refactor(systems): tách <mục>`.

### Task 10: Tách UI

**Files:** `src/ui/{modal,building,views,rooms,tutorial,saveView,globals}.js`, `src/main.js`

1. `modal.js`: `view, modal, closeM, toast, curView/curRC` (biến UI → module này, export setter).
2. `building.js`: `chibiHTML, renderBuilding, renderTop, renderDock, renderTrend, render`.
3. `rooms.js`: object `RV` + `openRoom`, `trainRoom`.
4. `views.js`: các `view*` còn lại; `tutorial.js`: `TUT, tutStart…`.
5. `globals.js`: tập trung `Object.assign(window, {...})` — import từ mọi module UI/system có handler. Xoá bản tạm trong `game.js`. `src/game.js` lúc này phải rỗng → xoá.
6. `main.js` — boot giống hệt dòng 2718–2722, trừ phần `window.claude`:
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
7. Verify: golden, unit, check:handlers, screenshot smoke. Commit: `refactor(ui): tách UI thành module`.

---

## Giai đoạn C — Tính năng web

### Task 11: Thay “mã lưu đám mây” bằng xuất/nhập save

**Files:** `src/save/transfer.js`, `src/ui/saveView.js`, `tests/unit/transfer.test.js`; xoá `cloudPut/cloudSave/cloudAuto/cloudCheck/cloudLoad/newCode/DB/dbState`

1. Test trước:
   ```js
   import { exportCode, importCode } from '../../src/save/transfer.js';
   it('round-trip giữ nguyên state', async () => {
     const s = { v: 1, year: 2, week: 7, artists: [{ id: 1, name: 'Hà Linh' }], log: [] };
     const code = await exportCode(s);
     expect(code.startsWith('SL1.')).toBe(true);
     expect(await importCode(code)).toEqual(s);
   });
   it('từ chối mã hỏng', async () => {
     await expect(importCode('SL1.abc')).rejects.toThrow();
     await expect(importCode('xyz')).rejects.toThrow(/không hợp lệ/);
   });
   it('từ chối dữ liệu không phải save', async () => {
     await expect(importCode(await exportCode({ foo: 1 }))).rejects.toThrow();
   });
   ```
2. Cài đặt:
   ```js
   const PREFIX = 'SL1.';
   const toB64u = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
   // lưu ý: save lớn → spread làm tràn stack; dùng vòng lặp theo khối 32KB
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
   export const exportFile = (state) => { /* Blob JSON → <a download="starlight-N{y}-T{w}.json"> */ };
   export const importFile = async (file) => importCode(…) /* hoặc JSON.parse trực tiếp nếu là .json */;
   ```
   - Vitest chạy trên Node 22 có sẵn `CompressionStream`, `Blob`, `atob` → không cần jsdom.
3. `saveView.js` thay `viewCode`: 2 khối “Xuất” (nút *Sao chép mã*, *Tải file .json*) và “Nhập” (ô dán mã / chọn file → xem trước `Năm · Tuần · Quỹ · số nghệ sĩ` → xác nhận *Ghi đè game hiện tại*). Nạp xong đi qua đúng đường `load()` để chạy migration. Giữ nút 🔑 ở masthead.
4. Golden có thể đổi (vì bỏ `cloudAuto` — không gọi RNG nên **không nên** đổi). Nếu đổi → điều tra, không cập nhật mù.
5. Thêm e2e vào `smoke.spec.js`: chơi 3 tuần → xuất mã → xoá localStorage → reload → nhập mã → tuần = 4.
6. Commit: `feat(save): xuất/nhập save bằng mã & file, bỏ đồng bộ Claude`

### Task 12: Smoke e2e & bảo vệ hồi quy UI

**Files:** `tests/e2e/smoke.spec.js`

Kịch bản (không seed, kiểm tra “không vỡ”):
- Trang tải không có `pageerror`/`console.error`.
- Click lần lượt 16 nút trong `#dock` → mỗi lần `#sheet.on` hiện, đóng được bằng ✕.
- Bấm “Kết thúc tuần” 10 lần, xử lý modal kế hoạch/báo cáo bằng nút chính (`.btn.pri`) → `#date` thay đổi.
- Reload → state còn (autosave).
- Viewport 375×812 (mobile): không có scroll ngang (`document.documentElement.scrollWidth <= 375`).

Commit: `test: smoke e2e cho các phòng, vòng tuần, autosave, mobile`

### Task 13: Deploy GitHub Pages

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

- **Việc tay của chủ repo:** Settings → Pages → Source = *GitHub Actions*.
- Kiểm tra `base: '/vibe_code_game/'` hoạt động: `GITHUB_ACTIONS=1 npm run build && npx vite preview --base /vibe_code_game/` → mở, chơi 1 tuần.
- README: cách chạy (`npm i`, `npm run dev`), cách test, cách cập nhật golden (`UPDATE_GOLDEN=1` — chỉ khi **cố ý** đổi gameplay), link game.
- Commit: `ci: test + deploy GitHub Pages`

---

## Definition of Done

- [ ] `npm test`, `npm run check:handlers`, `npx playwright test` đều xanh trên CI.
- [ ] Golden 30 tuần khớp bản artifact gốc (chứng minh gameplay không đổi).
- [ ] Không còn tham chiếu `window.claude`, `DB.`, `cloud*` trong `src/`.
- [ ] Không còn file > ~400 dòng trong `src/` (trừ `data/` và `views.js` nếu hợp lý).
- [ ] Game chạy ở `https://susanquynh.github.io/vibe_code_game/`, chơi được trên mobile, save sống qua reload, xuất/nhập được giữa 2 trình duyệt.

## Ngoài phạm vi (đề xuất cho giai đoạn sau)

- Chuyển handler inline → event delegation `data-action` (sau khi có smoke test đầy đủ).
- PWA/offline, cài lên màn hình chính.
- Cân bằng gameplay / sửa logic (lúc đó cập nhật golden có chủ đích).
- TypeScript (JSDoc type cho `S` trước là bước đệm rẻ).
- Chuyển save từ bản Claude cũ: bản artifact không có nút xuất → cần thêm nút xuất `SL1.` vào artifact nếu người chơi muốn mang tiến trình sang.
