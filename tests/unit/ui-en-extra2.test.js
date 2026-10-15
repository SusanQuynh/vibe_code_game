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
import { viewCode, saveImportText } from '../../src/ui/saveView.js';
import { setCurView } from '../../src/ui/modal.js';
import { importCode, parseSaveText } from '../../src/save/transfer.js';
import { save, saveMeta } from '../../src/save/storage.js';

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
    it(c.name, async () => {
      setLang('en');
      const r = await c.run(ctx);
      for (const [k, v] of flat(r).filter(([k]) => !c.skipEn.includes(k))) {
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
  for (const room of ['mgr', 'studio', 'acting', 'hr', 'gym', 'market', 'invest', 'ceo', 'pr', 'meet']) {
    it(room, () => {
      ctx.fresh(ctx.base); setLang('vi'); openRoom(room); const a = sig();
      ctx.fresh(ctx.base); setLang('en'); openRoom(room); const b = sig();
      expect(b).toEqual(a);
      if (room === 'mgr') expect(a.o.length).toBeGreaterThan(5);
      if (room === 'acting') expect(a.o.length).toBeGreaterThan(5);
    });
  }
});

describe('data-t stays Vietnamese: S.prHist is language-independent', () => {
  it('t10-prgo gives identical output in vi and en', () => {
    const c = CASES.find(x => x.name === 't10-prgo');
    setLang('vi'); const a = c.run(ctx);
    setLang('en'); const b = c.run(ctx);
    expect(a.dataT.length).toBeGreaterThan(3);
    expect(b).toEqual(a);
    expect(b.hist[0]).toMatch(/^T\d+: .*[ạảãàáâấầẩẫậăắằẳẵặđêếềểễệôốồổỗộơớờởỡợưứừửữự]/);
  });
});

describe('event choices keep their keys in en', () => {
  const ks = r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v && typeof v === 'object' && Array.isArray(v.o) ? v.o.map(x => x.split('|')[0]) : v === null ? null : typeof v]));
  for (const n of ['t12-basic', 't12-sx', 't12-mx', 't12-x', 't12-v3']) {
    it(n, () => {
      const c = CASES.find(x => x.name === n);
      setLang('vi'); const a = ks(c.run(ctx));
      setLang('en'); const b = ks(c.run(ctx));
      expect(b).toEqual(a);
      expect(Object.values(a).filter(v => Array.isArray(v)).length).toBeGreaterThan(3);
    });
  }
});

describe('save view and transfer errors', () => {
  it('importCode rejects with a key and keeps the Vietnamese message', async () => {
    await expect(importCode('xyz')).rejects.toMatchObject({ key: 'save.err.invalid', message: 'Mã không hợp lệ' });
    await expect(parseSaveText('{"a":1}')).rejects.toMatchObject({ key: 'save.err.notSave' });
    await expect(parseSaveText('{oops')).rejects.toMatchObject({ key: 'save.err.json' });
  });
  it('en shows the translated error and re-renders it when the language changes', async () => {
    ctx.fresh(ctx.base); setLang('en'); setCurView(viewCode); viewCode();
    document.getElementById('codeIn').value = 'xyz'; await saveImportText();
    expect(document.getElementById('sheet').textContent).toContain('❌ Invalid code');
    setLang('vi'); viewCode();
    expect(document.getElementById('sheet').textContent).toContain('❌ Mã không hợp lệ');
    setLang('en'); viewCode();
    expect(document.getElementById('sheet').textContent).toContain('❌ Invalid code');
    localStorage.clear();
  });
  it('the slot date follows the language (fmt.locale)', () => {
    ctx.fresh(ctx.base); localStorage.clear(); save({ full: true }); setLang('en'); setCurView(viewCode); viewCode();
    const at = saveMeta().c.at;
    expect(document.getElementById('sheet').textContent).toContain(new Date(at).toLocaleString('en-GB'));
    setLang('vi'); viewCode();
    expect(document.getElementById('sheet').textContent).toContain(new Date(at).toLocaleString('vi-VN'));
    localStorage.clear();
  });
});
