// @vitest-environment jsdom
// Phase 3 proof that only the representation of stored text changed: the state, rendered back to Vietnamese (viView),
// equals the file recorded in task 1 on the pre-phase-3 code. Files under __snapshots__/p3/ are never updated afterwards.
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import fs from 'node:fs';
import { noToggle } from './helpers.js';
import { setLang } from '../../src/i18n/index.js';
import { compactOf } from '../../src/save/storage.js';
import { richState } from './sim.js';
import { viView } from './p3.js';

noToggle();
afterEach(() => setLang('vi'));
const J = x => JSON.stringify(viView(x), null, 1);
let rich;
beforeAll(() => { rich = richState(7, 56); }, 120000);

describe('p3 legacy vi-view snapshots', () => {
  it('rich', async () => { await expect(J(rich)).toMatchFileSnapshot('__snapshots__/p3/rich.json'); });
  it('early', async () => { await expect(J(richState(42, 0))).toMatchFileSnapshot('__snapshots__/p3/early.json'); });
  it('en-rich (language independence)', async () => {
    setLang('en');
    await expect(J(richState(7, 56))).toMatchFileSnapshot('__snapshots__/p3/rich.json');
  }, 120000);
  it('golden-week30', async () => {
    await expect(J(JSON.parse(fs.readFileSync('tests/golden/week30.json', 'utf8')))).toMatchFileSnapshot('__snapshots__/p3/golden-week30.json');
  });
  it('golden-actions110', async () => {
    const g = JSON.parse(fs.readFileSync('tests/golden/actions110.json', 'utf8'));
    await expect(J({ state: g.state, errs: g.errs })).toMatchFileSnapshot('__snapshots__/p3/golden-actions110.json');
  });
  it('save size stays within +10% of the task 1 baseline', () => {
    const cur = { compact: JSON.stringify(compactOf(rich, 1)).length, full: JSON.stringify(rich).length };
    const f = 'tests/unit/__snapshots__/p3/size.json';
    if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify(cur, null, 1));
    const base = JSON.parse(fs.readFileSync(f, 'utf8'));
    console.info('[p3] save size', cur, 'ratio', { compact: cur.compact / base.compact, full: cur.full / base.full });
    expect(cur.compact).toBeGreaterThan(0);
    expect(cur.compact / base.compact, 'compact save size').toBeLessThanOrEqual(1.1);
    expect(cur.full / base.full, 'full save size').toBeLessThanOrEqual(1.1);
  });
});
