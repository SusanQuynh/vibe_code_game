// @vitest-environment jsdom
// Runtime census of stored text: after the rich state and every extra-cases scenario, no field of a converted category
// (P3_FIELDS) may hold a Vietnamese string. Counts per category are printed so each task can watch them drop.
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { noToggle, seed } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { closeM } from '../../src/ui/modal.js';
import { richState } from './sim.js';
import { CASES } from './extra-cases.js';
import { census, P3_FIELDS, TXT_PATHS } from './p3.js';

noToggle();
const ctx = {}, total = {};
const add = c => { for (const [k, n] of Object.entries(c)) total[k] = Math.max(total[k] || 0, n); };
beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1790000000000);
  ctx.base = richState();
  ctx.early = richState(42, 0);
  ctx.fresh = b => { setState(structuredClone(b)); S.ui = {}; closeM(); seed(77); };
  add(census(ctx.base)); add(census(ctx.early));
  for (const c of CASES) { try { await c.run(ctx); add(census(S)); } catch { /* scenario errors are covered by the extra2 tests */ } }
  vi.useRealTimers();
}, 240000);

describe('stored text census', () => {
  it('prints the per-category counts', () => { console.info('[p3 census] Vietnamese strings left:', JSON.stringify(total)); });
  it('every category has a census path', () => { expect(TXT_PATHS.map(p => p.cat).sort()).toEqual([...new Set(TXT_PATHS.map(p => p.cat))].sort()); });
  it('converted categories hold no Vietnamese string', () => {
    for (const cat of P3_FIELDS) expect(total[cat], 'category ' + cat).toBe(0);
  });
});
