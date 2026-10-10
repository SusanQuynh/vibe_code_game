import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { seedScript } from './seed.js';

const TARGET = process.env.GOLDEN_TARGET ?? './';
const GOLDEN = 'tests/golden/week30.json';
const GOLDEN2 = 'tests/golden/actions110.json';

// S must be language-independent: both vi and en compare against the SAME golden file
for (const lang of ['vi', 'en']) {
test(`30 simulated weeks match the golden master [${lang}]`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seedScript(42));
  if (lang !== 'vi') await page.addInitScript(l => localStorage.setItem('starlight_lang', l), lang);
  await page.goto(TARGET);
  const snap = await page.evaluate(() => {
    const g = window.__game ?? { nextWeek: window.nextWeek, state: () => S };
    for (let i = 0; i < 30; i++) g.nextWeek(true, true);
    return JSON.stringify(g.state());
  });
  expect(errors).toEqual([]);
  if (process.env.UPDATE_GOLDEN && lang === 'vi') fs.writeFileSync(GOLDEN, snap);
  expect(snap).toBe(fs.readFileSync(GOLDEN, 'utf8'));
});

// Scenario 2: with actions (hire a manager, sign trainees, solo debuts, accept offers) over 110 weeks
// → exercises awards, contracts, films, rivals, etc.
test(`110 weeks with actions match the golden master [${lang}]`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seedScript(7));
  if (lang !== 'vi') await page.addInitScript(l => localStorage.setItem('starlight_lang', l), lang);
  await page.goto(TARGET);
  const snap = await page.evaluate(() => {
    const g = window.__game ?? { nextWeek: window.nextWeek, state: () => S };
    const api = window.__game?.api ?? window;
    const log = [];
    for (let i = 0; i < 110; i++) {
      const S = g.state();
      try {
        if (i === 2 && S.mgrPool.length && S.managers.length < 1) api.hireMgr(S.mgrPool[0].id);
        if (i % 3 === 0 && S.artists.length < 5 && S.money > 150e6) for (const p of [...S.pool].slice(0, 1)) api.sign(p.id);
        for (const a of [...S.artists]) if (a.status === 'trainee' && a.dReady) api.debutIds('solo', [a.id], '');
        for (const o of [...S.offers].slice(0, 3)) {
          const a = S.artists.find(x => !x.busy && x.status === 'debuted');
          if (a) api.acceptOffer(o.id, a.id, true);
        }
      } catch (e) { log.push(i + ':' + e.message); }
      g.nextWeek(true, true);
    }
    return JSON.stringify({ state: g.state(), errs: log });
  });
  expect(errors).toEqual([]);
  if (process.env.UPDATE_GOLDEN && lang === 'vi') fs.writeFileSync(GOLDEN2, snap);
  expect(snap).toBe(fs.readFileSync(GOLDEN2, 'utf8'));
});
}
