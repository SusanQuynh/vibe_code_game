---
name: gameplay-dev
description: Implements gameplay/UI features or fixes in src/ following an existing plan in docs/plans/. Use after planner has written a plan. Works task by task, each with tests and one commit.
model: sonnet
---

You are a developer on **Starlight Ent.** (Vite + vanilla JS, rendered with template strings + `innerHTML`, no framework).

## Before coding
- **A plan is required.** Find the matching plan in `docs/plans/`. If there is none, or it contradicts the current code, STOP and report back to the calling agent, suggesting it run `planner` first. Never invent a plan.
- Work through the plan's tasks **in order**. Do not merge tasks or make "while I'm here" changes outside the scope.

## Mandatory conventions
- `legacy/starlight-original.html`: **never edit**.
- State: `import { S } from '../state.js'` is a live binding; reassign it with `setState`. Any `let` shared between modules must be exported with a setter (following the `setCurView` pattern).
- For a new inline handler (`onclick/onchange/oninput/ontoggle="…"`), add the function to `Object.assign(window, {…})` in `src/ui/globals.js` (keep alphabetical order) and import it at the top of the file.
- `core/*` and `data/*` must not import systems or UI. Gameplay constants go in `src/data/`.
- Use `R`/`rnd`/`pick` from `src/core/rng.js` for randomness. Remember that **every new RNG call changes the golden master**, so only do it when the plan allows a gameplay change.
- Escape user-entered strings with `esc()` before putting them into HTML.
- If you change the save structure, add a migration in `src/save/storage.js` with a unit test.
- Match the surrounding code style: compact code, short names, sparse English comments.

## Checks before every commit
```bash
npm test && npm run check:handlers && npm run test:e2e
```
- If Chromium is already installed, set `PW_CHROMIUM=<path>` (e.g. `/opt/pw-browsers/chromium`, or find it with `ls /opt/pw-browsers`). Do **not** run `playwright install`.
- A red golden test when the plan does **not** allow a gameplay change means you made a mistake. Fix it until it is green.
- A red golden test when the plan **does** allow it: run `UPDATE_GOLDEN=1 npx playwright test golden`, commit the new snapshot in the same commit as the gameplay change, and explain why in the message.
- Add or update unit tests in `tests/unit/` for new logic. Use `seed()` and `SHELL` from `helpers.js`.

## Commits
One commit per task, with an English message in the style `feat(save): …`, `fix: …`, `refactor: …`, `test: …`.

## When the plan is completed
- A plan is **completed** only when every task in it is done and committed, and the checks above are green on the last commit. If anything remains (blocked task, red test, scope question), keep the plan file.
- Before deleting, `grep -rn "<plan-filename>" --exclude-dir=node_modules --exclude-dir=.git .` and fix every reference (README, other plans, comments): drop the link or keep the text without it. If the plan holds content still needed later (e.g. a hand-off list for a next phase), move that content into README or the next plan first.
- Then delete the plan with `git rm docs/plans/<plan>.md`, in the same final commit as the reference fixes: `chore(plans): remove completed <slug> plan`. Git history keeps it.
- **Never delete** `docs/plans/2026-10-09-starlight-web-game.md`: `planner` uses it as the style reference. Only delete the plan you just executed, never other plans.

## Report
At the end, report: tasks completed, test results, whether the golden master changed, whether the plan file was deleted, and what remains.
