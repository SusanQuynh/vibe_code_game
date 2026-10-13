# Starlight Ent. — Recruiters, contests, manager domains, General Manager, two-tier saves

> **For the implementer:** work through the tasks in order. Each task ends with **one** commit; do not merge tasks. Unlike the refactor and i18n plans, this plan **intentionally changes gameplay**, so the golden master is regenerated, but **only in the tasks named in the "Golden master" section**. In every other task the golden must stay green without `UPDATE_GOLDEN`. If it goes red there, a change leaked an RNG call or a field into `S`: stop, find it, fix it.
>
> `node_modules/` is not installed in this checkout (`vitest: not found`). Run `npm ci` once before task 1.

**Goal:** Eight features requested by the owner (all design decisions below were confirmed in Vietnamese; this plan does not reopen them):

1. **Recruitment staff** (nhân viên tuyển dụng): hireable recruiters with an "eye for talent" who sign trainees from `S.pool` themselves. Modes are off / suggest / auto. In auto mode the recruiter fills the current batch up to a quota N, then opens a new batch. It keeps a money reserve and logs everything it does.
2. **Contest stat bonus:** the top 3 of a contest get an explicit stat bonus on the contest's weighted skills (+3 / +2 / +1, scaled by weight, clamped 0–100), shown in the log, the lesson card and the history. Everyone still gets the existing lesson.
3. **Contests for debuted artists:** the same mechanism (registration, fee, weeks busy, odds preview, suggestion, ranks, prizes, fans, stat bonus) with separate templates for **groups** (entered as an existing group), **soloists** and **actors**. They are harder, pay more, and scale with fame. The existing comp code is generalized, not copied.
4. **Manager domains:** each manager belongs to `group | solo | actor | trainee` and can only be assigned targets in that domain. The hire pool shows the domain, old saves are migrated, and changing domain costs a retraining fee and 2 weeks.
5. **General Manager (Quản lý tổng):** a single role that manages only managers and reports to the player. Every top-level manager reports to the GM, which has no subordinate cap, gives a skill bonus to everyone below it, and writes a weekly report card plus a monthly log line.
6. **Manager name colour by tree position:** GM = gold, team leads (managers with subordinate managers) = one colour, regular managers = another. This applies everywhere a hired manager's name is rendered, and the legend is updated.
7. **Two-tier saves:** autosave writes a **compact** save to the main key and a **full** backup to a second key every 4 weeks and on manual save. `load()` prefers compact and falls back to the backup. The 🔑 view shows both (size, time), exports either, and restores from backup. Quota errors are handled gracefully.
8. **Skill gains from every project:** comeback/single promotion, the debut showcase, outside collaborations, concerts, fan meetings, livestreams and songwriting now teach skills too, through lesson tables in `src/data/`. Amounts are modest, in line with `OFFER` lessons, and recorded in `a.lessons`. The artist profile shows the **cumulative skill points gained from projects** per stat (`a.pg`).

**Done criteria:**
- Every feature above works from the UI on desktop and at 375px (no horizontal scroll; smoke e2e green).
- `npm test && npm run check:handlers && npm run check:i18n && npx playwright test` is green after every task.
- `tests/fixtures/save-v1.json` still loads, migrates (now including manager domains) and plays 3+ weeks. A save from the previous version (with managers, comps and compRuns) also loads.
- Each golden regeneration happens only in the tasks named below and is explained in the commit body ("why the snapshot changed").
- No translated or display-only string and no timestamp goes into `S` (the vi and en goldens must stay identical).

**Intentional gameplay change:** **Yes.** The goldens are regenerated in **task 3** (debuted contest generation adds RNG calls once a company has a debuted artist), **task 4** (each manager candidate gets a random domain) and **task 5** (promo, concert and other projects now change stats, and `a.pg` appears on artists). Every other task must leave the golden unchanged.

**Architecture:** No new dependencies and no framework. Contest logic moves from `systems/batches.js` into a new `systems/contests.js` that drives every contest through one **kind** table (`tts | grp | solo | act`). Recruiters get their own module, `systems/recruit.js`, and the GM gets `systems/gm.js`. Both are lazy: they create their `S` sub-objects only when the player first uses them, so `newGame()` and the goldens are unaffected. Manager domains live on `m.dom`, with labels in `data/rules.js` (a leaf). Save tiers live entirely in `save/storage.js`, using a pure `compactOf(S)` that returns a **trimmed copy** and never mutates the live `S`. Save metadata such as timestamps and sizes goes into a separate localStorage key, never into `S`. Project lessons go through one helper, `projLesson(a,key,title)` in `week.js`, which reads `data/lessons.js` and is called from `completeBusy` (by busy kind and `busy.lk`) and from `doLive`. `applyLesson` tracks the actual applied deltas in `a.pg`.

---

## 0. Current state (surveyed)

| Area | Reality (file:function) | Consequence |
|---|---|---|
| Signing | `artists.js sign(id)`: 20 tr, `book('hr')`, `a.batch=ensureCurBatch()`, `addLog`, then **`act()`** | Split out a `signCore(a,by)` without `act()` so the weekly tick can reuse it |
| Batches | `batches.js newBatch()` calls `act()`. `ext2.js ensureCurBatch()` auto-opens a batch. `ext2.js cleanBatches()` (run in every `act()`) deletes batches that **had** members and are now empty | Factor out `openBatch(quiet)` without `act()`. A freshly opened empty batch survives `cleanBatches` because it has no `had` flag |
| Pool | `genPool(poolSize())` every 4 weeks (replaces the pool). `weekV2` sometimes adds a self-applicant | The recruiter acts **after** `weekV2()` in `nextWeek`, so it sees both |
| Contests | `batches.js`: `COMP` (7 trainee templates), `genComp` (RNG: pick, R×4), `compTick` (filter + `Math.random<.35`), `compOdds` (300×8 `rnd`, **UI only**), `compPrev/compPick/compSel` (DOM), `enterComp` (checks `dHold`, `cbHold`, size, fee), `compDone(a,b)` (runs once per member: `run.res` with `rnd` + 7×`rnd` once, then `R()` fans per member, `applyLesson`, lesson, mood, hist, `wc`), `compHTML()` | `newGame()` calls `genComp()` twice, so contest RNG is part of both goldens. Neither golden scenario ever **enters** a contest, so `compDone` never runs in the goldens |
| Busy | `a.busy={kind:'comp',run}`, then `week.js completeBusy` calls `compDone` | Reused unchanged for debuted contests |
| Holds | `ext2.dHold(a)` (trainee debut hold), `offers.cbHold(a)` (comeback plan), `offers.canTake` (busy, dHold, scandal sev≥2, cbHold), `g.hiatus>abs()` | Contest eligibility = not busy + not dHold + not scandal sev≥2 + `cbHold` window + group not on hiatus |
| Managers | `managers.js`: `genManager` (RNG), `as.t ∈ t,b,l,s,d,a,g` (`t/s/d` are legacy, converted by `migrateV2`), `assignMgr`, `toggleMA` (`l`), `mgrTargets`, `mBoss/mKids/inSub/mCap=2+⌊lv/2⌋`, `effSk` (+20% of direct boss + assistants), `mgrExp` (half goes to the boss, recursively), `setBoss`, `fireMgr` (kids move to `m.boss`). `cleanMgr()` exists but **is never called** | Domain checks go in `assignMgr`/`toggleMA`. The GM becomes the **explicit** `boss` of top-level managers, so `chainUp`, `passAll`, `mgrExp` and `effSk` work unchanged |
| Approval flow | `proposals.passAll`: approved by `mBoss(m)`, or "tự duyệt" if no boss and `S.autoAppr` | With a GM, the GM approves non-conflicting proposals; conflicts climb to the GM (`canSolve`) and then to the player |
| Name colour | `ext3.mNameH(m)`: colour by `lvColor(lv)` **only if the manager has a boss**. Used in `rooms.js` (mgr card), `views.js tnode`, `ext3 mgrBossHTML` (+ legend). Plain `esc(m.name)` for hired managers in `views.js` (40, 105, 119), `planning.js:66`, `proposals.js:123`, `batches.js:34`, `building.js:96` | All of these switch to `mNameH`. `addLog` texts stay plain |
| Project skill gains | `week.js applyLesson(a,lesson,q)`: gain `lesson[k]*(.8+q*.3)`, clamped, returns text. Called **only** for `offer` (`OFFER[type].lesson` 1–6 per stat, `q` from `rnd`, `lt=pick(O.lt)`), `shoot` (`{acting:5,stamina:1}`) and contests. `completeBusy` has **no branch** for `kind:'write'` and only logs for `promo`/`concert`. Busy creators: `releases.js:77` single promo (`PROMO_WK=3` weeks), `debut.js:94` "Showcase debut" (2 weeks, not for actors), `ext3.js:204` "Hợp tác với X" (1 week), `releases.js:95` concert and `:28` fan meeting (both `kind:'concert'`, 1 week), `ext2.js:223` songwriting `kind:'write'`. `doLive` (`releases.js:20`) is instant (no busy) and is **only** called from player buttons | Add a lesson key `lk` when the busy is created, so `completeBusy` can tell showcase, collab, concert and fan meeting apart (old in-flight busies fall back by kind). Livestream lessons are applied inside `doLive` |
| Lessons/history | `a.lessons` (cap 12) is shown in `views.viewArtist` as `l.s` (unescaped, generated). `a.hist` (cap 30) shows 12. **Only the UI reads them** | Safe to trim in the compact save; add an optional `l.b` (bonus) field |
| Save | `storage.js`: `KEY='starlight_idol_save_v1'`. `save()` = `setItem(JSON.stringify(S))` → `onSaved(ok)`. `load()` normalizes, calls `migrateV2`, returns a bool. `replaceSave(d)`. `act()` calls `save()` after **every** action. `main.js` boots with `load()||newGame()`, `migrateV3()`, `render()`, `save()` | Tiering stays inside `save()`/`load()`, so call sites are unchanged. The existing unit tests (`save` returns false when `setItem` throws, `load` false on corrupt/missing) must stay green |
| Data that gameplay reads from "history" | `compRep()` reads **all** `S.awards` and all `S.singles` with `rank<=10`. `secretary` reads the last single and **last concert per act**. `awards()` reads current-year singles/films/concerts. `digTick` reads non-ended singles. `offers.js:79` reads not-done films. `nextWeek` reads `S.log` only for the current week | These **must not** be trimmed (see Task 8 table) |
| i18n | Phase 1 only: masthead/`#saved`/dock/room titles use `t()`. Room contents (lobby, mgr, 🔑 view) are hard-coded Vietnamese | New room-content strings stay **Vietnamese literals**, like the surrounding code. Only new `#saved` statuses need keys (`vi.js` + `en.js`, checked by `check:i18n`) |
| Handlers | `ui/globals.js` + `check:handlers` | Each task lists the new names to add |
| Tests | `tests/unit/game.test.js` (jsdom, `SHELL`, `seed(42)`), `transfer.test.js`, `ui-vi.test.js` (phase-1 surfaces only), e2e golden (seed 42 idle 30 weeks; seed 7 with `hireMgr`, `sign`, solo `debutIds`, `acceptOffer` over 110 weeks), smoke | New tests go in new files per feature (below) |

---

## Open questions

All seven features are confirmed. These are only the gaps the confirmed design leaves open; each has a working assumption the implementer follows unless the owner says otherwise.

1. **Where do debuted-artist contests live in the UI?** *Assumption:* a new section `🏆 Cuộc thi cho nghệ sĩ` in the **Meeting Room** (`RV.meet`, where outside work is accepted). The lobby keeps trainee contests only.
2. **Recruiter headcount and stacking.** *Assumption:* up to **2** recruiters. Mode, quota and reserve are **company-wide** settings (`S.rec`). The team's eye is the best recruiter's eye, and weekly signing capacity is the **sum** of each recruiter's capacity.
3. **Should the recruiter run a new casting (10 tr) when the pool is empty?** *Assumption:* **no**. It only signs from the existing pool (casting refresh every 4 weeks plus self-applicants). The weekly log says "pool empty".
4. **"Open a new batch after reaching N":** right away or only when the next signing needs it? *Assumption:* **right away**, as worded. It is harmless because an empty, never-filled batch is not deleted by `cleanBatches` and simply becomes "Ký mới vào".
5. **Suggest mode output.** *Assumption:* a weekly log line plus a ⭐ badge and estimate on suggested pool cards in the lobby, and a "Ký các đề xuất" button. It is **not** an `S.events` entry, because events block `nextWeek` until resolved.
6. **GM hire path.** *Assumption:* both are possible: **promote** an existing manager (fee 20 tr + 5 tr × level, salary ×1.5) or **hire directly as GM** from the candidate pool (normal fee ×2, salary ×1.5). Promoting while a GM exists **swaps** them: the old GM is demoted and reports to the new one.
7. **Compact load loses old history on every reload.** `load()` prefers compact (confirmed), so trimmed history is gone after a reload. *Assumption:* if the full backup is **the same game moment** (same `nid`, `year`, `week`), `load()` uses the backup instead, since it is a strict superset. Otherwise it uses compact.
8. **GM "monthly" vs "weekly" report.** *Assumption:* both. The weekly card is stored in `S.gmRep` (latest only) and shown at the top of the weekly report and in the Management Office. Every 4 weeks (`abs()%4===0`), one summary line is also added to the log.
9. **Domain retraining duration.** *Assumption:* **2 weeks**, during which the manager is unassigned and cannot be assigned. Fee = 10 tr + 2 tr × level.
10. **Project lessons and spam.** Weekly livestreams would flood `a.lessons` (cap 12). *Assumption:* consecutive livestream lessons **merge** into one entry (`×n`, summed gains) instead of adding new ones. Every other project adds one entry when it completes; multi-week promotions give their lesson once, at the end.
11. **Do contest gains (lessons + rank bonus) count toward `a.pg`?** *Assumption:* **yes**. `a.pg` is "skill points from all projects" (offers, films, contests, promo, concerts, livestreams, songwriting), not from daily training.
12. **Should the hire pool guarantee domain variety?** *Assumption:* **no**. Each candidate draws `pick(DOM_KEYS)` independently (one RNG call at the end of `genManager`). "Tìm ứng viên mới" (15 tr) already exists for rerolling.

---

## Design decisions & rationale

1. **One contest engine with a kind table, not a second copy.**
   - *Option A: copy `enterComp/compDone/compHTML` for debuted artists.* Fastest to write, but duplicates ~40 dense lines, and every later balance change has to be made twice.
   - *Option B (chosen): a `KIND` table* `{tts, grp, solo, act}`, each entry giving `elig(a)`, the team rule, the level/prize formulas, the fan multiplier and the section label. The engine (`genComp(kind)`, `compOdds`, `enterComp`, `compDone`, `compHTML(kinds)`) is written once. Old comps have no `k` and default to `'tts'` through `kindOf(c)`, so no migration is needed. Task 1 does a **pure refactor** first (golden unchanged), so the behaviour changes in tasks 2–3 show up as small diffs.
   - Group contests use the **group** as the unit: the radio value is the group id, and the run stores `g` and `ids=g.members`. The existing `compSel/compPrev/compPick` keep their names and signatures (`cid`); the kind decides how a selected value maps to ids.
2. **RNG discipline for contests.** `compDone` keeps exactly one `R()` for fans per member and the same `run.res` draws for every kind. Only the multipliers differ by kind, and the stat bonus is deterministic. Debuted contest generation is a **separate** branch at the **end** of `compTick`, gated on `S.artists.some(a=>a.status==='debuted')`, so the idle 30-week golden (no debut) is expected to stay byte-identical. Only the 110-week golden moves.
3. **Stat bonus by rank:** `CB=[3,2,1]`, `g = CB[rank-1] * w[k]` for each weighted skill (weights ≤ 1, so a 0.3 weight gives +0.9), applied with `clamp(+(st+g).toFixed(1),0,100)`. It is applied **after** `applyLesson`, so the lesson text (`ls`) stays identical. Shown in three places: the result log line (once per run), the lesson entry (`les.b = 'Thanh nhạc +3'`, rendered as `🏅 …` in `viewArtist`), and the history line (`– hạng 1 · 🏅 Thanh nhạc +3`).
4. **Debuted contest scaling:** level `clamp(R(40,58)+(S.year-1)*6+⌊week/13⌋*2, 30, 95)`, prize base `R(80,160) tr × (1+lvl/40)`, fee `R(8,20) tr × (team min)`, 1–3 weeks. Prizes are scaled to fame **at registration** (`run.pm = 1 + avgFame/60`, shown in the card and preview), so the open card shows base prizes and the preview shows the real ones. Fans are `R(...)` × `(2 + fame(a)/25)`. Higher level means lower odds for weak artists, by design.
5. **Manager domain = `m.dom`**, with labels `MDOM={group:'👥 Nhóm nhạc',solo:'🎤 Solo',actor:'🎬 Diễn viên',trainee:'🌱 Thực tập sinh'}` in `data/rules.js`.
   - Assignment types map to domains: `b,t → trainee`, `g → group`, `s → solo`, `d → actor`. For `l` and `a`, **each artist** must match `artDom(a,dom)`: trainee = `status==='trainee'`; group = `groupsOf(a).length>0`; solo = `a.solo&&!a.pm`; actor = `a.actor`.
   - `assignMgr`/`toggleMA` reject mismatches with a toast. The assignment dropdown only offers matching optgroups.
   - A weekly `mgrDomTick()` (no RNG) removes `l` members who no longer match (e.g. their group disbanded) and logs it. `cleanMgr` stays dead code (out of scope).
   - Personal managers (`a.pm`) do not have `dom` and are untouched.
6. **Domain migration (`migrateDom`, called from `load()` only, never from the weekly `migrateV3`):** `b/t` → trainee, `g` → group, `s` → solo, `d` → actor. For `l/a`: majority vote over the targets' matching domains (tie order solo > actor > group > trainee); targets that don't match are dropped with a log line. Unassigned or empty → `pick(DOM_KEYS)`. That is RNG at load time, but the goldens never load a save. GMs keep their `dom` (needed when demoted). `mgrPool` candidates without `dom` get one the same way.
7. **GM as an explicit boss, not an implicit layer.**
   - *Option A: implicit*. `mBoss(m)` returns the GM when `m.boss` is null. No data change, but every `!mBoss(m)` "top level" query (orgTree, report, proposals, `S.autoAppr`) silently changes meaning, which is easy to get wrong.
   - *Option B (chosen): explicit*. `m.gm=1` and every other top-level manager gets `boss=GM.id` when the GM is promoted or hired. New hires and "Tách ra / báo cáo Giám đốc" default to the GM. `mCap(GM)=Infinity`. `assignMgr` refuses the GM, and so does `setBoss(GM, x)`. Existing code (`chainUp`, `passAll`, `mgrExp`, `effSk` boss bonus, orgTree) then just works: the GM approves, solves conflicts it can, gains exp from the whole tree, and the tree is rooted at the GM.
   - **GM bonus:** `effSk` adds `⌊GM.sk[k]×0.1⌋` for every manager **below** the GM that is not a direct report (direct reports already get the +20% boss bonus). Still capped at 10.
   - **Fire GM:** the existing `fireMgr` already moves kids to `m.boss||null`, so they report to the player. **Demote GM** (`demoteGM`): `gm=0`, the salary raise is removed (`gmRaise` stored at promotion), and direct reports go back to the player. The former GM keeps its old `dom` and is unassigned.
   - The `S.autoAppr` checkbox becomes moot while a GM exists. The label says so.
8. **GM report:** `nextWeek` captures `lv0` (manager levels) and `e0` (artist `earn`) in **local variables** at the start of the week. After `S.lastRep` is built it calls `gmReport(rep,lv0,e0)`. When there is no GM, the function returns before touching `S`, so the goldens are unaffected and nothing is added to `rep` (it lives in `S.lastRep`). When there is a GM: `S.gmRep={w,y,up:[…],prob:[…],teams:[{mid,n,fans,earn,warn}]}` (latest only). The monthly log line is a plain string.
9. **Name colour = role, not level.** `mRole(m)` = `'gm'|'lead'|'reg'`. `mNameH` renders `<b class="mn mn-${role}">`. The CSS in `styles/ui.css` uses gold `var(--warn)` for the GM, `var(--info)` (violet) for leads and `var(--good)` (mint) for regular managers. `LVC/lvColor` are deleted once nothing else uses them (grep). Pool candidates (not in the tree) stay plain `<b>`.
10. **Recruiters are lazy and RNG-free per week.**
    - `S.rec` is created only by recruiter handlers (`recEnsure()`): `{staff:[], cand:[], mode:'off', quota:5, reserve:100e6, sug:[], log:[]}`. UI renders read `S.rec||REC0` and **never write** `S`.
    - Candidates come from the `recHunt()` handler (first time free, then 5 tr). That is RNG inside a player action, which the goldens never call.
    - **Eye for talent** (1–10) is deterministic: `est(a,eye)=stSum(a)×(1+(eye/10)×(a.talent−1)×2)`. A low eye ranks by visible stats; a high eye weighs hidden potential.
    - Capacity is `1+⌊eye/4⌋` signings per week per recruiter. Salary is `2 tr + eye×0.5 tr` a week; the hire fee is `eye×4 tr`.
    - Recruiters do not appear in the building (rendering chibis calls `R()` via `pos`). `weekCost` adds their salary (`+0` when absent).
    - `recruitTick()` runs in `nextWeek` right after `weekV2()` and only does anything when `S.rec?.staff.length`. It pays salaries (`book('hr')`), then:
      - in **suggest** mode it stores the top `cap` pool ids in `S.rec.sug` and logs them;
      - in **auto** mode it loops: if `bMem(cur).length>=quota`, it calls `openBatch(true)`; it signs the best `est` candidate if `S.money-20e6>=reserve`; it stops at capacity, at the reserve, or when the pool is empty. Each step is logged (`🧑‍💼 NV tuyển dụng …`) and mirrored in `S.rec.log` (last 10).
11. **Two-tier save.**
    - *Option A: one key, compact only.* Smallest, but loses history permanently and has no recovery path.
    - *Option B: IndexedDB for the full save.* No quota pressure, but async: `save()`/`load()` are synchronous and called from `act()`/boot, so it would be a big rewrite.
    - *Option C (chosen): two localStorage keys plus a meta key.* `KEY` (compact, same name, so existing installs just keep working), `KEY_FULL='starlight_idol_save_v1_full'`, `KEY_META='starlight_save_meta'` = `{c:{at,abs,y,w,len,lvl}, f:{at,abs,y,w,len,err?}}`. `at` is `Date.now()` and lives **only** in meta, never in `S`.
    - **Full backup rule:** write when there is no `meta.f`, when `abs()-meta.f.abs>=4`, when `abs()<meta.f.abs` (new game or import moved time backwards), or on `save({full:true})` (manual button, import, restore).
    - `compactOf(S, lvl)` works on `JSON.parse(JSON.stringify(S))` and never mutates live `S` (a unit test proves `S` is byte-identical before and after `save()`).
12. **Project lessons are deterministic.**
    - *Option A: copy the offer pattern* (`q=rnd(...)`, `lt=pick(...)`). Consistent with offers, but adds RNG draws on every promo/concert completion. That couples balance and RNG and makes the golden diff harder to read.
    - *Option B (chosen): no new RNG.* `q=1` (so the gain is `lesson×1.1`) and the lesson sentence is `lt[abs()%lt.length]`. Stats still change, so the golden moves, but the RNG stream does not.
    - **Tables** (`src/data/lessons.js`, a leaf): `PLESSON={promo:{n:'Quảng bá',l:{vocal:1.5,dance:1.5,variety:1,stamina:.5},lt:[…]}, showcase:{l:{vocal:1,dance:1,visual:1}}, collab:{l:{variety:1.5,vocal:.5}}, concert:{l:{vocal:2,dance:2,stamina:1.5}}, fanmeet:{l:{variety:2,visual:.5}}, live:{l:{variety:.5}}, write:{l:{vocal:1,rap:1}}}`. Per completion that is roughly half an `OFFER` lesson (offers give 3–8 points in total).
    - **`a.pg`** (`{[stat]:points}`) is created **lazily** on the first gain (`a.pg=a.pg||{}`) and stores the actual applied delta (after clamp), rounded to 0.1. `load()` defaults it to `{}`. `genArtist` does **not** add it, so newly generated artists and the idle golden don't change shape.
    - The profile shows a "📈 Điểm kỹ năng từ dự án" card: a total per stat (sorted, with `STATS[k]` labels) and the grand total.
13. **Quota handling ladder:** compact lvl 1 → compact lvl 2 (tighter limits) → delete `KEY_FULL` and retry lvl 2 → fail. `onSaved(ok, info)` keeps its first boolean argument (existing test), and `info∈{'ok','lite','noBackup','fail'}` drives `#saved` through new i18n keys `saved.lite` and `saved.noBackup`. A failed backup write leaves the previous backup intact (`setItem` is atomic) and records `meta.f.err=1`.

---

## Risks

- **RNG leaks into "golden-neutral" tasks.** Tasks 1, 2 and 5–9 must not add, remove or reorder `Math.random` calls on paths the goldens take (`newGame`, `nextWeek`, `render`, `hireMgr`, `sign`, `debutIds`, `acceptOffer`). Recruiter and GM code is gated on lazily created state; contest scoring keeps the same calls. If a "neutral" task goes red, diff the snapshots (`git diff --no-index`) before touching anything.
- **Refactor drift in task 1.** `genComp` draw order (`pick`, `R lvl`, `R prize`, `R wk`, `R fee`, `R exp`) and `compTick`'s single `Math.random` must be preserved exactly. The golden catches it, since `newGame` calls `genComp()` twice.
- **`S.lastRep` is in the golden.** The GM report must not add fields to `rep`. Use locals for `lv0/e0`.
- **Domain filter hides existing assignments.** After migration a manager's current assignment always matches its new domain (it was inferred from it), and mismatching list members are dropped and logged. The dropdown must still render the **current** selection even if it is somehow out of domain, so the UI never silently loses it.
- **Explicit GM boss links and old UI code.** "Báo cáo cho" in `rooms.js` lists every manager. With a GM, the first option becomes "⭐ <GM name> (Quản lý tổng)" instead of "👔 Giám đốc", and the GM's own card hides the select. `inSub` loops are impossible because `setBoss(GM, x)` is refused.
- **Compact save hides data the game needs.** Mitigated by the table in task 9 (singles, awards, last concert per act, current-year films/fin are **kept**) and by the fork test: play → compact → reload → play 20 more weeks, and compare with the uncompacted fork on everything except the trimmed fields.
- **Project lessons change the 110-week balance.** Soloists in the seed-7 scenario get showcase and promo lessons, so their fit, chart ranks and income move. That is intended, but check the diff only shows stat drift, not errors (`errs:[]` in `actions110.json`). If later balance work finds the gains too high, tune `PLESSON` only.
- **localStorage quota.** A full save after 110 weeks is a few hundred KB, so two copies fit in 5 MB, but very long games might not. The ladder in decision 13 keeps the **main** save alive first.
- **Contest odds preview runs RNG in the UI** (`compOdds`, 300 samples). This already exists and is only triggered by player input, never by `render()`. Reusing it for debuted contests keeps the same property.
- **jsdom tests calling handlers.** Most handlers end with `act()` → `save()` + `render()`. Tests must set `document.body.innerHTML = SHELL` (as `game.test.js` does), and call `noToggle()` when rendering `det(...)`.

---

## Target structure (new/changed)

```
src/data/rules.js          + MDOM, DOM_KEYS, CB (contest bonus)
src/data/lessons.js        NEW: PLESSON (project lesson tables)
src/systems/contests.js    NEW: KIND, COMP, DCOMP, kindOf, genComp, compTick, compOdds, compSel, compPrev, compPick, enterComp, compDone, compBonus, compHTML
src/systems/batches.js     keeps batches only; + openBatch(quiet)
src/systems/artists.js     + signCore(a, by)
src/systems/managers.js    + artDom, domOk, setDom, migrateDom, mgrDomTick; GM-aware mCap/effSk/setBoss/assignMgr/hireMgr
src/systems/gm.js          NEW: gmOf, promoteGM, demoteGM, hireGM, gmReport, gmCardHTML
src/systems/recruit.js     NEW: REC0, recEnsure, est, recHunt, recHire, recFire, recSet, recSignSug, recruitTick, recHTML
src/systems/ext3.js        mRole, mNameH by role, legend
src/save/storage.js        KEY_FULL, KEY_META, compactOf, saveMeta, save({full}), load() fallback, readSlot, restoreBackup
src/ui/saveView.js         two-slot panel, export either, restore from backup
src/i18n/locales/{vi,en}.js  + saved.lite, saved.noBackup
src/systems/week.js        applyLesson tracks a.pg; projLesson; completeBusy branches for promo/concert/write
tests/unit/contests.test.js, managers.test.js, lessons.test.js, gm.test.js, recruit.test.js, save-tiers.test.js
```

---

## Tasks

> **CHECK** (run at the end of every task):
> ```bash
> npm test && npm run check:handlers && npm run check:i18n && npx playwright test
> ```
> If Chromium is preinstalled: prefix with `PW_CHROMIUM=/path/to/chrome`. "Golden: unchanged" means `npx playwright test golden` must pass **without** `UPDATE_GOLDEN`.

### Task 1: Extract and generalize the contest engine (pure refactor)

**Files:** create `src/systems/contests.js`; modify `src/systems/batches.js`, `src/state.js`, `src/save/storage.js`, `src/systems/week.js`, `src/ui/rooms.js`, `src/ui/globals.js`; create `tests/unit/contests.test.js`.

1. Move `COMP, genComp, compTick, compOdds, compSel, compPrev, compPick, enterComp, compDone, compHTML` from `batches.js` to `contests.js` and update all imports (`state.js` and `storage.js` use `genComp`, `week.js` uses `compDone/compTick`, `rooms.js` uses `compHTML`, `globals.js` uses `compPick/compPrev/enterComp`).
2. Introduce `kindOf=c=>c.k||'tts'` and `KIND={tts:{elig:a=>a.status==='trainee'&&!a.busy, label:'thực tập sinh', fanMul:()=>1}}`, with only `tts` for now. Replace the hard-coded `status==='trainee'&&!a.busy` checks in `compPick`, `enterComp` and `compHTML` with `KIND[kindOf(c)].elig`.
3. Extract `compScore(ms,ids,c)` (the `fit×chem` average) and `compRank(c,sc)` (the 7×`rnd` loop), and use them in both `compOdds` and `compDone`. **The draw order must stay identical**: in `compDone`, `sc=f+rnd(-8,8)` comes first, then the 7 draws.
4. `compTick`: count only `kindOf(c)==='tts'` comps for the existing rule. Behaviour is identical today because no other kinds exist yet.
5. Signature for the next tasks: `compHTML(kinds=['tts'])`.

**Tests (`contests.test.js`, jsdom + `SHELL`, `seed(42)`):**
- `newGame()` gives 2 comps without `k`, and `kindOf` returns `'tts'`.
- `compDone` determinism: build a run with two trainees, set `busy` as `enterComp` would, call `compDone` for both members under `seed(5)`, and snapshot `S.money`, the members' `st`/`fans`/`lessons[0]`. Write the expected values in task 1 and keep them **unchanged** (they guard task 2's "no extra RNG").
- `enterComp` refuses a `dHold` trainee and a `cbHold` conflict (set `S.cbPlan` to a plan covering the artist).

**Verify:** CHECK. **Golden: unchanged.**
**Commit:** `refactor(contests): move contest engine to systems/contests.js behind a kind table`

### Task 2: Explicit stat bonus for the top 3

**Files:** `src/data/rules.js` (+`CB=[3,2,1]`), `src/systems/contests.js`, `src/ui/views.js` (lesson card), `tests/unit/contests.test.js`.

1. `compBonus(a,c,rank)` (pure, no RNG): for `rank<=3`, for each `k` in `c.w`, `g=+(CB[rank-1]*c.w[k]).toFixed(1)`, then `a.st[k]=clamp(+(a.st[k]+g).toFixed(1),0,100)`. It returns a text like `'Thanh nhạc +3, Tạp kỹ +0.9'` (using `STATS[k]`), or `''`.
2. In `compDone`, after `applyLesson`, call `const bt=compBonus(a,c,r.rank)`. Store it on the lesson (`b: bt`) and append it to the hist line (`– hạng 1 · 🏅 ${bt}`). In the one-time `run.res` log line, append ` Thưởng chỉ số mỗi người: ${bonusText}` (the text is the same for every member, so compute it from `c` and `rank` with a string-only helper `bonusTxt(c,rank)`).
3. `views.js` lesson card: `${l.b?` · <span class="good">🏅 ${esc(l.b)}</span>`:''}`.
4. Losers (rank > 3) are unchanged: the lesson only, no `b`.

**Tests:**
- `compBonus` with `w={dance:.8,vocal:.4}`: rank 1 gives `dance +2.4`, `vocal +1.2`; rank 4 changes nothing; a stat at 99.5 clamps to 100.
- The task 1 determinism test still passes for `S.money`/`fans` (same RNG), and its `st` expectation is updated by exactly the bonus (assert the delta, not a new magic number).
- `viewArtist` renders `🏅` for a lesson with `b` (jsdom + `noToggle()`).

**Verify:** CHECK. **Golden: unchanged** (no golden scenario enters a contest). If it goes red, the bonus leaked into a path the goldens run, so investigate.
**Commit:** `feat(contests): top-3 stat bonus by rank, shown in log, lessons and history`

### Task 3: Contests for debuted groups, soloists and actors

**Files:** `src/systems/contests.js`, `src/ui/rooms.js` (`RV.meet`), `tests/unit/contests.test.js`, `tests/golden/*.json` (regenerated).

1. `DCOMP` templates, each with `k`, `n`, `ic`, `w` and `t`. Examples:
   - `grp`: «Đại chiến Idol Group» `{vocal:.6,dance:.8,visual:.4}`; «Sân khấu Huyền thoại» `{vocal:1,dance:.5}`.
   - `solo`: «Giọng ca Vàng» `{vocal:1,variety:.3}`; «Vũ điệu Solo» `{dance:1,visual:.4}`; «Rap Battle Pro» `{rap:1,variety:.4}`.
   - `act`: «Liên hoan Diễn xuất» `{acting:1,visual:.3}`; «Thử thách Độc thoại» `{acting:1,variety:.4}`.

   `t` is `[1,1]` for solo/act and `[2,9]` for grp (checked against `g.members.length`).
2. `KIND` gains these entries:
   - `grp`: unit = group. Eligible when `!(g.hiatus>abs())` and every member is not busy, not `scandal.sev>=2` and passes the `cbHold` window.
   - `solo`: `a.status==='debuted'&&a.solo&&!a.busy&&!(a.scandal&&a.scandal.sev>=2)`.
   - `act`: the same with `a.actor`.

   `enterComp` keeps the `dHold`/`cbHold` toasts for every kind. Each kind also sets `fanMul:a=>2+fame(a)/25`, plus `lvl`/`prize`/`fee` formulas (decision 4).
3. `genComp(kind)`: for `'tts'` the **existing code path is untouched** (same draws). For debuted kinds, pick a template of that kind not already open, then draw `R` values for lvl/prize/wk/fee/exp in the same order as tts.
4. `compTick()`: after the existing tts rule, `if(S.artists.some(a=>a.status==='debuted')){const ks=['grp','solo','act'].filter(k=>k==='grp'?S.groups.length:k==='solo'?S.artists.some(a=>a.solo):S.artists.some(a=>a.actor)),d=S.comps.filter(c=>kindOf(c)!=='tts');if(ks.length&&(d.length<2||(d.length<3&&Math.random()<.3)))genComp(pick(ks))}`.
5. `enterComp`: for `grp`, the selected value is a group id, so `ids=g.members` and `run.g=g.id`. Store `run.pm=1+avgFame/60`. The prize paid in `compDone` is `round(c.prize[rank-1]*run.pm/1e6)*1e6`, and log lines say `Nhóm X` for grp.
6. `compPrev` shows `cơ hội top 3 ~N% · thưởng 🥇 …` using `run.pm` computed live. `compPick` for grp picks the eligible group with the best `compScore`.
7. UI: `compHTML(['grp','solo','act'])` goes in a new `det('mt-comp','🏆 Cuộc thi cho nghệ sĩ (n đang mở)',…)` in `RV.meet`. `compHTML(['tts'])` stays in the lobby, and the lobby header counts only tts comps. Strings are Vietnamese literals.

**Tests:**
- With no debuted artist, 20× `compTick()` under a seed never creates a non-tts comp.
- With a debuted soloist, `compTick` creates `solo` comps and never `grp` when `S.groups` is empty.
- `enterComp` for a grp comp with one busy member is refused. With every member free, all members get `busy.kind==='comp'` and the same `run`.
- `compDone` for a debuted run: the prize is scaled by `run.pm`, fans exceed the tts formula for the same `R` (assert the multiplier), and the stat bonus is applied.
- `check:handlers` needs nothing new (same handler names).

**Verify:**
```bash
npm test && npm run check:handlers
npx playwright test golden          # expected: actions110 RED, week30 GREEN
UPDATE_GOLDEN=1 npx playwright test golden
git diff --stat tests/golden        # week30.json must NOT appear
npx playwright test                 # all green
```
**Golden: intentionally updated (actions110 only).** Expected cause: from the first solo debut onward, `compTick` draws extra RNG for debuted contests.
**Commit:** `feat(contests): contests for debuted groups, soloists and actors (golden updated)`, with a body explaining why only `actions110.json` changed.

### Task 4: Manager domains, assignment validation, retraining, migration

**Files:** `src/data/rules.js` (+`MDOM`, `DOM_KEYS`), `src/systems/managers.js`, `src/ui/rooms.js` (mgr room), `src/save/storage.js`, `src/systems/week.js`, `src/ui/globals.js`, `tests/unit/managers.test.js`, `tests/golden/*.json`.

1. `genManager`: build the object as today, then `m.dom=pick(DOM_KEYS)` as the **last** draw, and return it.
2. `artDom(a,dom)` (decision 5), `domOfAs(as)` for `t,b,g,s,d`, and `domOk(m,as)`. `assignMgr` refuses the GM (task 6 adds the flag; here it just checks `m.gm`), refuses retraining managers (`m.rt>abs()`), and refuses mismatches with the toast `Quản lý mảng ${MDOM[m.dom]} không phụ trách mục này`. `toggleMA` checks `artDom` per artist. The `a` type checks the one artist.
3. `setDom(id,dom)`: fee `10e6+2e6*m.lv`, `book('mgr')`, `m.dom=dom`, `m.as=null`, `m.rt=abs()+2`, `S.props=null`, log `🎓 … đào tạo lại sang mảng …`. Refuse the change if the money is short or `dom` is the same.
4. `mgrDomTick()` (no RNG), called in `nextWeek` right before `mgrAuto()`: drop `l` ids whose artist no longer matches, and set `as=null` for an `a` target that no longer matches, with a log line. When `m.rt<=abs()`, `delete m.rt` and log "đã sẵn sàng".
5. `migrateDom()` (decision 6) is called in `load()` after `migrateV2()`. It also fills `mgrPool` candidates that lack `dom`.
6. UI (`RV.mgr`): show the domain tag in the card summary and pool cards (`<span class="tag">${MDOM[m.dom]}</span>`). The "Phụ trách" select only renders optgroups for the domain, but always keeps the current selection. The `l` list filters to `artDom`. Add a "Đổi mảng" select plus a button showing the fee, and `🎓 đang đào tạo lại (còn n tuần)`. The help text explains domains. The banner "lứa chưa có quản lý" mentions that only trainee-domain managers can take batches.
7. `globals.js`: `setDom`.

**Tests (`managers.test.js`):**
- `genManager` always has a `dom` in `DOM_KEYS`.
- A trainee-domain manager can take `b`, is refused `g`, and is refused an `a` that is a group member. A solo-domain `l` list rejects an actor-only artist.
- `setDom` charges the fee, clears `as`, blocks assignment for 2 weeks and allows it after 2× `nextWeek(true,true)`.
- **Migration with `tests/fixtures/save-v1.json`:** load the fixture JSON, inject `managers` without `dom` (one `as:{t:'b',id:<batch>}`, one `{t:'l',ids:[soloId, actorId]}` after making those artists debuted solo/actor, and one `as:null`), write it to `KEY`, then `load()`. Expect `trainee`, a majority domain (with the mismatching id dropped), and a valid random domain. Then 3× `nextWeek(true,true)` runs without throwing.
- The existing fixture migration test still passes.

**Verify:** `npm test && npm run check:handlers`, then the golden is red on both files. Run `UPDATE_GOLDEN=1 npx playwright test golden` and then CHECK.
**Golden: intentionally updated (both files).** `genMgrPool()` runs in `newGame()` and every 8 weeks, and every candidate now draws one extra `pick`.
**Commit:** `feat(managers): manager domains with assignment validation, retraining and save migration (golden updated)`

### Task 5: Skill gains from every project + cumulative project points

**Files:** create `src/data/lessons.js`; modify `src/systems/week.js` (`applyLesson`, `projLesson`, `completeBusy`), `src/systems/releases.js` (busy `lk` for promo/concert/fan meeting; `doLive` lesson), `src/systems/debut.js` (showcase `lk`), `src/systems/ext3.js` (collab `lk`), `src/systems/ext2.js` (write `lk`), `src/systems/contests.js` (`compBonus` adds to `a.pg`), `src/save/storage.js` (default `a.pg`), `src/ui/views.js` (profile card); create `tests/unit/lessons.test.js`; `tests/golden/actions110.json` (regenerated).

1. `data/lessons.js`: `PLESSON` (decision 12) with Vietnamese `n` and 2–3 `lt` sentences per key, in the style of `OFFER.lt`.
2. `applyLesson(a,lesson,q)`: keep the formula and the returned text **identical**. Also record the real delta (`after-before`) into `a.pg` (lazy init, `+(…).toFixed(1)`). No RNG.
3. `projLesson(a,key,title)`: applies `PLESSON[key].l` with `q=1` and `lt=PLESSON[key].lt[abs()%len]`, then unshifts `{t:title,l:lt,s,y:S.year,lk:key}` and caps lessons at 12. For `key==='live'`, if `a.lessons[0]?.lk==='live'` it merges instead (`n++`, text `(×n)`; open question 10). Returns `s`.
4. Busy creators add `lk`: single promo `'promo'`, showcase `'showcase'`, collab `'collab'`, concert `'concert'`, fan meeting `'fanmeet'`, write `'write'`. `completeBusy`:
   - `promo`: `projLesson(a,b.lk||'promo',b.title)`, and the existing log gains ` (${s})`;
   - `concert`: `b.lk||(b.title==='Fan meeting'?'fanmeet':'concert')`;
   - a **new** `write` branch: `projLesson(a,'write',b.title)` (`songTick` is unchanged; it still moves the song to review).

   Branch order and the existing RNG-free logs stay the same.
5. `doLive`: after each member's existing updates, inside the same loop and **before** the `Math.random()<.03` scandal check (which must stay last), call `projLesson(a,'live','Livestream')`. No RNG is added, so the order is unaffected.
6. `compBonus` (task 2) also adds its points to `a.pg`.
7. `load()` normalization: `S.artists.forEach(a=>{if(!a.pg)a.pg={}})`.
8. Profile (`viewArtist`): a card "📈 Điểm kỹ năng từ dự án: tổng +X" listing `STATS[k] +v` for each stat with `v>0`, or "Chưa có. Nhận dự án, quảng bá, concert… để tích lũy." Lesson cards already show `l.s`.

**Tests (`lessons.test.js`, jsdom, `seed(42)`):**
- `applyLesson` returns the same text as before for a fixed input, and `a.pg` equals the actual deltas, including when clamped at 100.
- `completeBusy` for each busy kind/`lk` (`promo`, `showcase`, `collab`, `concert`, `fanmeet`, `write`) adds one lesson with the right stats and no RNG: stub `Math.random` to throw and assert nothing throws.
- An old in-flight busy without `lk` (`kind:'concert', title:'Fan meeting'`) uses `fanmeet`.
- Two `doLive([id],true)` calls in different weeks give **one** merged lesson `(×2)`, and `a.pg.variety` reflects both gains.
- Migration: `tests/fixtures/save-v1.json` loads with `a.pg` set to `{}` for every artist and plays 3 weeks.
- `viewArtist` renders the "📈 Điểm kỹ năng từ dự án" card (`noToggle()`).
- `newGame()` + 30 idle weeks: no artist has a `pg` key (guards the idle golden).

**Verify:**
```bash
npm test && npm run check:handlers
npx playwright test golden          # expected: actions110 RED, week30 GREEN
UPDATE_GOLDEN=1 npx playwright test golden
git diff --stat tests/golden        # week30.json must NOT appear
npx playwright test
```
**Golden: intentionally updated (actions110 only).** Showcase/promo and offer completions in the seed-7 scenario now change stats and add `a.pg`. No RNG draws are added (decision 12), so the diff is value drift, not a shifted stream. `week30.json` must stay identical, because nothing in the idle run creates a busy or accepts an offer.
**Commit:** `feat(lessons): skill gains from promo, showcase, concerts, fan meetings, livestreams and songwriting; track project points per stat (golden updated)`

### Task 6: General Manager

**Files:** create `src/systems/gm.js`; modify `src/systems/managers.js` (`mCap`, `effSk`, `setBoss`, `assignMgr`, `hireMgr`, `fireMgr`), `src/systems/week.js` (locals + `gmReport` call), `src/ui/rooms.js`, `src/ui/views.js` (report card, orgTree root), `src/systems/ext3.js` (`mgrBossHTML` GM row), `src/ui/globals.js`; create `tests/unit/gm.test.js`.

1. `gmOf()=S.managers.find(m=>m.gm)||null`. `mCap(m)=m.gm?Infinity:2+⌊lv/2⌋`. `effSk` adds the GM bonus (decision 7).
2. `promoteGM(id)`:
   - charge the fee;
   - if there is an old GM, demote it first, then set its `boss` to the new GM;
   - set `m.gm=1`, `m.as=null`, `m.boss=null`, `m.gmRaise=round(m.salary*.5/1e6)*1e6`, `m.salary+=m.gmRaise`;
   - set every other manager with `!m.boss` to report to the GM;
   - set `S.props=null` and log.
3. `hireGM(id)`: normal hire at fee ×2, then promote without a fee. `demoteGM()`: `gm=0`, `salary-=gmRaise`, kids go to `boss=null`, log. `fireMgr` already handles a fired GM (kids move to `m.boss||null`). Only the log text changes.
4. GM-aware defaults: `hireMgr` sets `boss=gmOf()?.id||null`. `setBoss(id,'')` routes to the GM when one exists. `setBoss(GM,…)` is refused. `assignMgr(GM,…)` is refused.
5. `gmReport(rep,lv0,e0)` (decision 8), called at the end of `nextWeek` after `S.lastRep=rep`. Problems collected: unassigned or retraining managers, team artists with energy or mood < 30 (from `rep.a`), scandals in a team, pending `S.events` with `e.m`. The monthly log line is `📊 QL tổng X: n QL lên cấp · +fans · +doanh thu · k vấn đề`.
6. UI:
   - **Management Office:** a GM card at the top. Without a GM: "⭐ Bổ nhiệm Quản lý tổng" with a select of managers and the fee, plus the hint that pool candidates can be hired as GM. With a GM: name, bonus explanation, `S.gmRep` summary, and a "Bãi nhiệm" button (tap twice).
   - Pool cards gain a "Tuyển làm QL tổng (fee×2)" button.
   - In each manager card, the "Báo cáo cho" first option becomes the GM when one exists, and the GM's own card hides "Phụ trách"/"Báo cáo cho".
   - **Weekly report** (`viewReport`): a `gmCardHTML()` at the top when `S.gmRep?.w===abs()-1`.
   - **orgTree:** the CEO node shows "1 quản lý tổng".
7. `globals.js`: `promoteGM`, `hireGM`, `demoteGM`.

**Tests (`gm.test.js`):**
- Promote with 3 managers (one already under another): the GM has `as=null`, both former top-levels have `boss===GM.id`, the subordinate is unchanged, and the fee is charged.
- `effSk` of a grandchild includes `⌊GM.sk×0.1⌋`, and a direct report does not get it twice.
- `assignMgr(GM)` is refused. `setBoss(x,'')` with a GM gives `x.boss===GM.id`. `mCap(GM)===Infinity`.
- Demote restores the salary and frees the kids. Firing the GM leaves the kids at `boss===null`.
- `nextWeek` with a GM sets `S.gmRep.w` and adds a log line when `abs()%4===0`. **Without** a GM, `JSON.stringify(S)` has no `gmRep` key after 4 weeks.
- `passAll` with a GM attributes approvals to the GM's name.

**Verify:** CHECK. **Golden: unchanged** (the goldens never create a GM; `lv0/e0` are locals).
**Commit:** `feat(managers): General Manager role with tree-wide bonus and weekly report`

### Task 7: Manager name colour by position in the tree

**Files:** `src/systems/ext3.js` (`mRole`, `mNameH`, legend; remove `LVC/lvColor` if unused), `src/styles/ui.css` (`.mn-gm/.mn-lead/.mn-reg`), `src/ui/views.js` (lines 40, 105, 119), `src/ui/planning.js:66`, `src/systems/proposals.js:123`, `src/systems/contests.js` and `src/systems/batches.js` (batch card manager name), `src/ui/building.js:96` (outside chip); create a test in `tests/unit/gm.test.js` or `managers.test.js`.

1. `mRole(m)=m.gm?'gm':mKids(m).length?'lead':'reg'`. `mNameH(m)=`<b class="mn mn-${mRole(m)}">${esc(m.name)}</b>``.
2. Replace every **render** of a hired manager's name with `mNameH` (the list above; re-grep `esc\((m|b|mBoss\(m\))\.name\)` and keep only hired managers). **Do not** touch `addLog` strings or pool candidates.
3. The legend in `mgrBossHTML` becomes `● Quản lý tổng · ● Trưởng nhóm (có QL cấp dưới) · ● Quản lý`, with the same colour classes. Keep the 👔 Trưởng nhóm tag.
4. CSS: `.mn-gm{color:var(--warn)}.mn-lead{color:var(--info)}.mn-reg{color:var(--good)}`.

**Tests:** for `mNameH` of a GM, a lead and a leaf, assert the class. Render `RV.mgr` (jsdom, `noToggle()`) with a GM plus a lead and check there is no `style="color:` left on manager names. `ui-vi` snapshots are unaffected (they only cover phase-1 surfaces). If any change, the diff must be limited to the mgr `<h2>` area and is a bug.

**Verify:** CHECK. **Golden: unchanged.**
**Commit:** `feat(managers): colour manager names by tree role (GM, team lead, manager) everywhere`

### Task 8: Recruitment staff

**Files:** create `src/systems/recruit.js`; modify `src/systems/artists.js` (`signCore`), `src/systems/batches.js` (`openBatch`), `src/systems/week.js` (`recruitTick` call, `weekCost`), `src/ui/rooms.js` (lobby), `src/ui/globals.js`; create `tests/unit/recruit.test.js`.

1. `signCore(a,by)`: the body of `sign` without `toast`/`act`, returning a boolean. It logs `✍️ Ký …` for the player, or `🧑‍💼 NV tuyển dụng ${by} ký …`. `sign(id)` becomes a wrapper with **identical** behaviour and log text for the player (the goldens call `api.sign`).
2. `openBatch(quiet)`: the body of `newBatch` without `act()`. `newBatch()` calls `openBatch()` and then `act()`, with an identical log.
3. `recruit.js`:
   - `REC0`, `recEnsure()`, `est(a,eye)`, `recCap()`, `recHunt()` (3 candidates `{id:uid(),name:pick(LNM)+' '+pick(MGN),eye:R(2,9),…}` with fee and salary from decision 10; free if `!S.rec||!S.rec.hunted`, then 5 tr);
   - `recHire(id)` (max 2), `recFire(id,btn)` (tap twice);
   - `recSet(k,v)` for `mode∈off|suggest|auto`, `quota∈1..12`, `reserve∈{0,50,100,200,500} tr`;
   - `recSignSug()` (signs the current suggestions, each through `signCore` with the player's money check);
   - `recruitTick()` (decision 10);
   - `recHTML()`.
4. `nextWeek`: call `recruitTick()` right after `weekV2()`. `weekCost` adds `+(S.rec?S.rec.staff.reduce((t,r)=>t+r.sal,0):0)`.
5. Lobby UI, `det('lb-hr','🧑‍💼 Nhân viên tuyển dụng (n/2)',recHTML(),…)` above the casting list, containing:
   - the staff (eye ★, salary, fire);
   - selects for mode, quota ("N TTS mỗi lứa") and reserve;
   - the last 5 `S.rec.log`;
   - candidates with a hire button, plus "🔍 Tìm ứng viên" showing its cost.

   Casting cards show `⭐ NV đề xuất · ước tính ${Math.round(est)}` when the id is in `S.rec.sug`, and "Ký các đề xuất" appears when the suggestion list is not empty.
6. `globals.js`: `recHunt`, `recHire`, `recFire`, `recSet`, `recSignSug`.

**Tests (`recruit.test.js`):**
- `newGame()` + 5 weeks: `S.rec` is undefined and `weekCost` is unchanged (regression for golden neutrality).
- `est` with eye 1 ranks by `stSum`, and eye 10 prefers a higher-talent candidate with a slightly lower sum.
- Auto mode, quota 2, current batch with 1 trainee, pool of 4, plenty of money, cap ≥ 3: after `recruitTick()`, the first batch has 2 trainees, a **new batch** exists and is `S.curBatch`, the following signings go there, money dropped by 20 tr × signings plus salary, and each signing was logged.
- Reserve: money = reserve + 25 tr gives exactly one signing.
- Suggest mode signs nobody and fills `S.rec.sug` with the top-`cap` ids by `est`.
- `sign(id)` for the player produces the same log text as before (string equality).

**Verify:** CHECK. **Golden: unchanged** (no recruiter in the scenarios, and `sign` keeps the same behaviour).
**Commit:** `feat(recruit): recruitment staff that suggest or auto-sign trainees into batches by quota`

### Task 9: Compact save + full backup + fallback load + quota handling (logic)

**Files:** `src/save/storage.js`, `src/main.js` (hook signature), `src/i18n/locales/vi.js`, `src/i18n/locales/en.js` (`saved.lite`, `saved.noBackup`); create `tests/unit/save-tiers.test.js`.

**What `compactOf(S,lvl)` trims.** It works on a deep copy and never mutates live `S`. Everything not listed is copied untouched.

| Field | Gameplay readers (surveyed) | lvl 1 | lvl 2 (quota) |
|---|---|---|---|
| `S.log` | UI; `nextWeek` (current week only, via `logMark`) | keep 30 newest | 10 |
| `a.hist` (artists + pool) | UI only (`viewArtist` shows 12) | 12 | 5 |
| `a.lessons` | UI only | 5 | 2 |
| `S.prHist` | UI only | 10 | 3 |
| `S.fin` | Sales Room UI (last 12 + current-year totals) | current year + last 12 entries | last 12 |
| `S.films` with `done` | `awards()` (current year), `offers.js:79` (not done only) | keep `!done` or `y>=S.year` | same |
| `S.concerts` | `awards()` (current year); `secretary` (latest per act) | keep current year + latest per `k‖act` | same |
| `S.rec.log`, `S.gmRep` | UI only | `rec.log` 5 | `rec.log` 0; `gmRep` dropped |
| **Not trimmed** | `S.singles` (`compRep`, `lastSingleW`, `digTick`, promo), `S.awards` (`compRep`), `S.lastRep` (report), `S.props`, `S.events`, `S.comps/compRuns`, `S.ext`, `S.mrel`, `S.ui`, all artist/manager core fields including `a.pg` | — | — |

1. Keys: `KEY` (compact), `KEY_FULL`, `KEY_META`. Helper `slotInfo(which)` returns `{y,w,abs,at,len,lvl}` from meta, falling back to parsing the slot.
2. `save(opt={})`:
   - write compact lvl 1, then lvl 2 on a quota error, then remove `KEY_FULL` and retry lvl 2;
   - if `opt.full` or the backup rule (decision 11) applies, write `JSON.stringify(S)` to `KEY_FULL`; on failure set `meta.f.err=1` and keep the old backup;
   - update `KEY_META` (`at=Date.now()`), call `onSaved(ok, info)` and return `ok`.

   A non-quota exception is treated as a failure (existing test).
3. `load()`:
   - read the compact slot; if it is missing or invalid (parse error or no `artists`), read `KEY_FULL`;
   - if compact is valid **and** the full backup has the same `nid/year/week`, use full (open question 7);
   - set `restoredFrom='full'` when the backup was used because compact failed, then run the existing normalization + `migrateV2` + `migrateDom`;
   - if restored, `addLog('🛟 Bản lưu chính bị lỗi, đã khôi phục từ bản sao lưu đầy đủ…','bad')`.

   Export `lastLoadSource()` for the UI.
4. `replaceSave(d)` writes `d` to **both** slots, then `load()`. A new `restoreBackup()` does `replaceSave(JSON.parse(localStorage.getItem(KEY_FULL)))` and returns a bool.
5. `main.js` hook: `(ok,info)` → `el.dataset.i18n = info==='lite'?'saved.lite':info==='noBackup'?'saved.noBackup':ok?'saved.ok':'saved.fail'`. Add the keys to `vi.js` ('💾 Đã lưu (bản rút gọn)', '💾 Đã lưu · ⚠️ chưa có sao lưu') and `en.js` ('💾 Saved (compact)', '💾 Saved · ⚠️ no backup').

**Tests (`save-tiers.test.js`, jsdom, `seed(42)`):**
- `save()` never mutates `S`: `JSON.stringify(S)` is identical before and after, after 60 weeks with a scripted signing and a solo debut.
- Compact is smaller than full. `S.log` in compact has ≤ 30 entries, and `singles/awards` are intact.
- **Fork test (gameplay never reads trimmed data):** play 60 weeks, then `const full=clone(S)`. Fork A: `setState(clone(full))`. Fork B: `setState(JSON.parse(compactString))` followed by the same normalization as `load()`. Run `seed(9)` + 20 weeks on each. Compare `JSON.stringify` of both states with the trimmed fields deleted: they must be equal.
- Backup cadence: `S` at abs 1 writes full; abs 2–4 do not; abs 5 does; `save({full:true})` always does; after `newGame()` (abs goes back) it writes again.
- `load()` with corrupt `KEY` and a valid `KEY_FULL` returns true from full and logs 🛟. With both missing it returns false. The existing tests "load trả false…" and "save báo trạng thái…" stay green.
- Quota: stub `Storage.prototype.setItem` to throw `QuotaExceededError` when `value.length > N`, so lvl 1 fails and lvl 2 fits. Then `save()` is true, `info==='lite'` and meta `lvl===2`. With a stub that fails only for `KEY_FULL`: `ok===true`, `info==='noBackup'`, and the old backup is still there.
- Migration: `tests/fixtures/save-v1.json` written to `KEY` still loads (as before), and also loads when written **only** to `KEY_FULL`.

**Verify:** CHECK (`check:i18n` checks the two new keys). **Golden: unchanged** (`S` is never mutated; meta is outside `S`). The smoke "autosave qua reload" must stay green.
**Commit:** `feat(save): compact autosave with periodic full backup, fallback load and quota ladder`

### Task 10: Save view with two versions + docs

**Files:** `src/ui/saveView.js`, `src/save/transfer.js` (no API change; reuse `exportCode/exportFile` with a given object), `src/ui/globals.js`, `README.md` (Saving section); extend `tests/unit/transfer.test.js` or `save-tiers.test.js`; extend `tests/e2e/smoke.spec.js`.

1. A new top card, "📦 Bản lưu trên trình duyệt", with two rows:
   - **Bản rút gọn (tự lưu)**: Năm/Tuần, size `(len/1024).toFixed(1) KB`, time `new Date(at).toLocaleString('vi-VN')`, and "lite" when `lvl===2`;
   - **Bản đầy đủ (sao lưu)**: the same, plus `⚠️ lỗi ghi lần cuối` when `err`, or "Chưa có" when missing.

   Buttons: "💾 Sao lưu đầy đủ ngay" (`saveBackupNow()` → `save({full:true})`), "Xuất bản rút gọn" / "Xuất bản đầy đủ" (`saveExportSlot('c'|'f')`, which reads the slot string, parses it and fills `#codeShow` via `exportCode`, plus the file download through `exportFile`), and "🛟 Khôi phục từ bản sao lưu" (`saveRestorePreview()` reuses the existing `preview` flow, so the confirmation is the existing "Ghi đè game hiện tại" button, which now calls `replaceSave`, writing both slots).
2. The existing export textarea defaults to the **full** in-memory state (unchanged behaviour). Keep the button labels "Xem trước" and "Ghi đè game hiện tại" (the smoke test depends on them).
3. If `lastLoadSource()==='full'`, show a banner: "Đã khôi phục từ bản sao lưu lúc …".
4. `globals.js`: `saveBackupNow`, `saveExportSlot`, `saveRestorePreview`.
5. README "Saving": describe the compact and full slots, the 4-week cadence, the restore path and what is trimmed (link to this plan).

**Tests:**
- Unit (jsdom): `viewCode()` renders both rows with sizes after `save({full:true})`. `saveRestorePreview()` + `saveImportApply()` restores an older full backup (set the backup at week 3, play to week 6, restore → week 3).
- Smoke e2e: open 🔑, click "Sao lưu đầy đủ ngay", corrupt `starlight_idol_save_v1` via `page.evaluate`, reload, and expect the game to load (week > 1) with the 🛟 log line.

**Verify:** CHECK. **Golden: unchanged.**
**Commit:** `feat(save-ui): show compact and full saves, export either, restore from backup`

---

## Golden master

**Intentionally updated (`UPDATE_GOLDEN=1`) in three tasks, unchanged everywhere else:**

| Task | Files | Why |
|---|---|---|
| 3 | `tests/golden/actions110.json` only | `compTick` draws extra RNG for debuted-artist contests once the company has a debuted artist (the seed-7 scenario debuts soloists). The idle 30-week scenario never debuts, so `week30.json` **must not change**; if it does, the tts path drifted. |
| 4 | `week30.json` and `actions110.json` | `genManager()` draws one more `pick` for `dom`. `genMgrPool()` runs in `newGame()` and every 8 weeks, so the RNG stream shifts from the start. |
| 5 | `tests/golden/actions110.json` only | Project lessons (showcase, promo, offers) change stats and add `a.pg` in the seed-7 scenario. No RNG draws are added, so this is value drift only. The idle 30-week scenario never completes a project, so `week30.json` **must not change**. |

Procedure each time: run the golden and confirm it is red **for the stated reason** (diff the snapshots: the first divergence should be the new `comps` entry, `mgrPool[*].dom`, or an artist's `st`/`pg`/`lessons`). Then run `UPDATE_GOLDEN=1 npx playwright test golden`, rerun without the flag (both `vi` and `en` green), and explain the change in the commit body. Tasks 1, 2, 6, 7, 8, 9 and 10 must pass the golden **without** regeneration.
