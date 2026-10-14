// @vitest-environment jsdom
// Vietnamese baselines for the scenarios in extra-cases.js (tasks 5+). Files under __snapshots__/ui-vi-extra2/ are recorded
// BEFORE the matching area is translated and never regenerated: a diff means the vi output drifted.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { noToggle, seed } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { closeM } from '../../src/ui/modal.js';
import { richState } from './sim.js';
import { CASES } from './extra-cases.js';

noToggle();
const ctx = {};
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1790000000000);
  ctx.base = richState();
  ctx.early = richState(42, 0);
  ctx.fresh = b => { setState(structuredClone(b)); S.ui = {}; closeM(); seed(77); };
}, 120000);
afterAll(() => vi.useRealTimers());

describe('vi extra baselines', () => {
  for (const c of CASES) {
    it(c.name, async () => {
      const r = await c.run(ctx);
      const files = typeof r === 'string' ? { [c.name + '.html']: r } : { [c.name + '.json']: JSON.stringify(r, null, 1) };
      for (const [f, v] of Object.entries(files)) { expect(v).not.toContain('[object Object]'); }
      for (const [f, v] of Object.entries(files)) await expect(v).toMatchFileSnapshot(`__snapshots__/ui-vi-extra2/${f}`);
    });
  }
});
