# Starlight Ent. — Short save code (`SL2.`)

**Goal:** Add a second, shorter export code for moving a game between devices quickly. The full `SL1.` code and the `.json` file stay exactly as they are.

**User decisions (confirmed):**
- Use case: quick device-to-device transfer. There is no hard length limit; aim for about half of today's `SL1.` length.
- The short code may drop history and lists the game can rebuild. Progress must survive: artists, money, groups, songs, awards, managers, contracts, batches and current schedules.

**Measured baseline** (rich state, seed 3, gzip + base64url):

| Week | `SL1.` full | compact lvl 2 | lvl 2, no history | also no regenerable lists |
|---|---|---|---|---|
| 56 | 13.6k | 10.6k | 8.7k | **6.8k** |
| 150 | 13.9k | 10.0k | 8.4k | **6.8k** |

**Intentional gameplay change:** none on the normal path. Golden stays **unchanged**: no RNG calls are added to `nextWeek`/render, and `S` gets no new fields.

---

## Design decisions

1. **Format.** `SL2.` + base64url( deflate-raw( JSON( shortOf(S) ) ) ).
   - `deflate-raw` drops gzip's 18-byte header and trailer, and every browser that has `CompressionStream` supports it.
   - The string goes through the same `checkSave`, so `parseSaveText` and `importCode` accept both `SL1.` and `SL2.` by prefix.
   - Same `MAX_CODE` guard.

2. **`shortOf(s)` in `src/save/storage.js`, next to `compactOf`.** It is a pure function, never mutates `S`, and starts from `compactOf(s, 2)`. It then:
   - empties `log` and keeps a single entry saying the game came from a short code;
   - empties `fin`, `prHist` and `rec.log`;
   - sets `lastRep` / `lastEval` (report-only fields) to null or drops them, but only where the code tolerates missing values (check readers);
   - for each artist and pool entry, empties `hist` and `lessons`;
   - drops the regenerable lists `offers`, `pool`, `mgrPool`, `hsC` and the open (not entered) `comps`.
   - **It keeps** anything another structure refers to by id: `compRuns`, busy references, `songs`, `films`, `concerts` (as `compactOf` keeps them), `awards`, `groups`, `batches`, `managers`, `assts`, `events` and so on.
   - **Before dropping offers**, it must handle anything that points at an offer id. Pending events such as `mtjob` reference `of`, and the busy entries of artists on an accepted offer may too. Grep for every `.of`/offer-id reader. Either drop events whose offer is gone, or keep the offers that something still references. Prefer keeping referenced offers, since that loses nothing.

3. **Rebuild on import (`regenAfterShort()` in `src/save/storage.js`, or wherever the regenerators already live).** It runs only when the source was `SL2.` (`importCode` returns a flag, or `shortOf` sets `S.__short = 1`, which the loader consumes and deletes). It then:
   - calls `genPool(poolSize())`, `genMgrPool()`, `genOffers(...)` with the same arguments the week loop uses for a fresh week, `compTick()` and `genHSC()` if `hsC` was dropped;
   - adds a log line with a new stored key, `log.sys.shortImport`, in vi and en.

   These calls happen at import time only, never in `nextWeek`, so the golden is unaffected.

4. **UI (`src/ui/saveView.js`).**
   - Next to the existing export code box, add a toggle or a second button: "Mã ngắn (chuyển máy)" / "Short code (device transfer)". It shows the character count of both codes, and a one-line note that the short code leaves out the log, history and current offers, and the casting/manager candidate lists, which are generated again when the code is loaded.
   - The import box accepts both codes with no extra choice.
   - All new strings go through i18n keys in vi and en, and pass `check:i18n` (strict).

---

## Tasks (one commit each)

### Task 1 — `shortOf` + `SL2.` encode/decode
- **Files:** `src/save/storage.js`, `src/save/transfer.js`, new `tests/unit/short-code.test.js`.
- **Code changes:**
  - Add `shortOf`.
  - Add `exportShortCode(state)`.
  - Make `importCode` / `parseSaveText` accept `SL2.`. They return the state plus a way to know it was short.
- **Tests:**
  - `shortOf` does not mutate its input.
  - The round trip keeps the progress fields deep-equal: `money`, `year`, `week`, the artists' `st`, `look`, `fans` and `status`, `groups`, `songs`, `managers`, `batches`, `awards`.
  - The short code is at most 60% of the `SL1.` length on `richState(3, 56)` and `richState(3, 150)`. Compute the size with `node:zlib` `deflateRawSync`/`gzipSync`, because jsdom's Blob has no `.stream()`. Unit-test the pure part, and leave the browser compression path to e2e.
  - No dangling offer references: every event or busy entry that refers to an offer id still finds that offer.
  - An invalid or truncated `SL2.` code throws the same friendly errors as `SL1.`.
- **Commit:** `feat(save): short SL2 save code without history and regenerable lists`

### Task 2 — rebuild after short import + UI
- **Files:** `src/save/storage.js` (or the import path in `src/ui/saveView.js`), `src/ui/saveView.js`, the locale parts for save view keys and the `log.sys.shortImport` key, `src/ui/globals.js` if a new handler is added, `tests/fixtures/stored-keys.json` for the new stored key.
- **Code changes:** add `regenAfterShort` and the UI described above.
- **Tests:**
  - Importing an `SL2.` code gives non-empty `pool`, `mgrPool` and `offers` (and `comps` per `compTick`), and adds the import log line.
  - 20 more weeks after the import run without errors and with no NaN money.
  - Every save-view surface stays in the en guard (no Vietnamese).
  - The vi save-view snapshot gets a new extra case recorded on unchanged src first. Existing vi snapshots are not modified, so the new UI must not change the existing markup. Append the new block after it, or record it as a separate surface.
- **E2E:** extend the save smoke test: export the short code, reload into a fresh page, import it, and check that the week and money match and the casting pool is non-empty.
- **Commit:** `feat(save-ui): export and import the short code; rebuild pools after a short import`

## Golden master
Unchanged in both tasks. A red golden means an RNG call or `S` change leaked into the week loop or render.

## Risks
- **Dangling ids.** This is the main risk. The test in task 1 is the guard.
- **Imported week not generating new offers or pool.** If the week loop only generates them on certain weeks (`S.week%4` for the pool), an imported game could sit with empty lists. `regenAfterShort` covers this.
- **Save-view vi snapshot drift.** The new markup must go in additively.
