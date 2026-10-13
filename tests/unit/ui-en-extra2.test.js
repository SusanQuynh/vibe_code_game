// @vitest-environment jsdom
// en guard for the scenarios in extra-cases.js (the vi output of the same scenarios is frozen in ui-vi-extra2.test.js).
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { noToggle, seed } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { setLang } from '../../src/i18n/index.js';
import { closeM } from '../../src/ui/modal.js';
import { openRoom } from '../../src/ui/rooms.js';
import { richState, visibleText, offenders } from './sim.js';
import { CASES } from './extra-cases.js';

noToggle(true);
const ctx = {};
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1790000000000);
  ctx.base = richState();
  ctx.early = richState(42, 0);
  ctx.fresh = b => { setState(structuredClone(b)); S.ui = {}; closeM(); seed(77); };
}, 120000);
afterEach(() => setLang('vi'));

const textOf = s => { const d = document.createElement('div'); d.innerHTML = s; return visibleText(d); };
const flat = r => (typeof r === 'string' ? [['', r]] : Object.entries(r)).filter(([, v]) => v != null);

describe('en extra scenarios have no Vietnamese', () => {
  for (const c of CASES) {
    it(c.name, () => {
      setLang('en');
      const r = c.run(ctx);
      for (const [k, v] of flat(r)) {
        const isToast = c.name.endsWith('toasts');
        if (isToast) expect(v, k).not.toMatch(/^THROW/);
        const off = offenders(isToast ? v : textOf(v), { S, base: ctx.base, early: ctx.early, extra: c.stored }); // stored strings of every state the case touched
        expect(off, `${c.name}/${k}: ${off.join(', ')}`).toEqual([]);
      }
    });
  }
});

describe('en keeps <option> values and onclick targets identical to vi', () => {
  const sig = () => { const el = document.getElementById('sheet'); return { o: [...el.querySelectorAll('option')].map(o => o.value), c: [...el.querySelectorAll('[onclick]')].map(e => e.getAttribute('onclick')), v: [...el.querySelectorAll('[value]')].map(e => e.getAttribute('value')) }; };
  for (const room of ['mgr', 'studio', 'acting']) {
    it(room, () => {
      ctx.fresh(ctx.base); setLang('vi'); openRoom(room); const a = sig();
      ctx.fresh(ctx.base); setLang('en'); openRoom(room); const b = sig();
      expect(b).toEqual(a);
      if (room === 'mgr') expect(a.o.length).toBeGreaterThan(5);
      if (room === 'acting') expect(a.o.length).toBeGreaterThan(5);
    });
  }
});
