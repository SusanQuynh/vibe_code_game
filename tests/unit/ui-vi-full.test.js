// @vitest-environment jsdom
// i18n phase 2 safety net: byte-identical Vietnamese HTML of every room/view + toast texts.
// These files are recorded once (task 1) and must NEVER be regenerated during phase 2.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { noToggle } from './helpers.js';
import { ROOMS } from '../../src/data/rules.js';
import { richState, SURFACES, renderSurface, runToasts, skipped } from './sim.js';

noToggle();
let base, early;
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1790000000000);
  base = richState();
  early = richState(42, 0);
}, 120000);
afterAll(() => { vi.useRealTimers(); if (skipped.length) console.log('skipped surfaces (precondition missing):', [...new Set(skipped)].join(', ')); });

describe('vi display golden (rich state)', () => {
  for (const s of SURFACES) {
    it(s.name, async () => {
      const html = renderSurface(s.name, base);
      if (html == null) return;
      await expect(html).toMatchFileSnapshot(`__snapshots__/ui-vi/${s.name}.html`);
    });
  }
});

describe('vi display golden (week 1)', () => {
  for (const r of ROOMS) {
    it('early-' + r.id, async () => {
      const html = renderSurface(r.id, early);
      await expect(html).toMatchFileSnapshot(`__snapshots__/ui-vi/early-${r.id}.html`);
    });
  }
});

describe('vi toasts', () => {
  it('toasts.json', async () => {
    await expect(JSON.stringify(runToasts(base), null, 1)).toMatchFileSnapshot('__snapshots__/ui-vi/toasts.json');
  });
});
