import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { seedScript } from './seed.js';

const TARGET = process.env.GOLDEN_TARGET ?? '/';
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
