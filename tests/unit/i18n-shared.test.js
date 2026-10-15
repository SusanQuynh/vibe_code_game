// @vitest-environment jsdom
// Task 3: dual-use helpers keep producing Vietnamese by default (they feed S); UI call sites pass t.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { noToggle } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { t, tVi, setLang } from '../../src/i18n/index.js';
import { targetName, hireMgr } from '../../src/systems/managers.js';
import { wkLabel } from '../../src/systems/secretary.js';
import { renderTop } from '../../src/ui/building.js';
import { richState } from './sim.js';

noToggle();
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
let base;
beforeAll(() => { base = richState(42, 0); });
afterEach(() => setLang('vi'));

describe('dual-use helpers', () => {
  it('targetName: default (tVi) is identical under en, and t gives English', () => {
    setState(structuredClone(base));
    hireMgr(S.mgrPool[0].id);
    const m = S.managers[0], a = S.artists[0];
    const cases = [null, { t: 't' }, { t: 'b', id: S.curBatch }, { t: 'b', id: -1 }, { t: 's' }, { t: 'd' }, { t: 'l', ids: [a.id] }, { t: 'l', ids: [] }, { t: 'g', id: -1 }, { t: 'a', id: a.id }];
    for (const as of cases) {
      m.as = as;
      setLang('vi');
      const vi = targetName(m);
      setLang('en');
      expect(targetName(m)).toBe(vi);
      expect(targetName(m, tVi)).toBe(vi);
      if (as && as.t !== 'b') expect(VI.test(targetName(m, t).split(a.name).join('')), JSON.stringify(as)).toBe(false); // names are data
    }
  });
  it('wkLabel: default (tVi) is identical under en, and t gives English', () => {
    setState(structuredClone(base));
    for (const w of [5, 52, 53, 60]) {
      setLang('vi');
      const vi = wkLabel(w);
      setLang('en');
      expect(wkLabel(w)).toBe(vi);
      expect(wkLabel(w, tVi)).toBe(vi);
      expect(VI.test(wkLabel(w, t))).toBe(false);
    }
    setLang('en');
    expect(wkLabel(5, t)).toBe('W5');
    expect(wkLabel(53, t)).toBe('W1 Y2');
  });
  it('#outside manager chip is translated', () => {
    setState(structuredClone(base));
    hireMgr(S.mgrPool[0].id);
    const m = S.managers[0], a = S.artists[0];
    a.busy = { kind: 'offer', type: 'drama', title: 'x', left: 2, total: 2 };
    m.as = { t: 'a', id: a.id };
    setLang('vi');
    renderTop();
    expect(document.getElementById('outside').textContent).toContain('QL ');
    setLang('en');
    renderTop();
    const o = document.getElementById('outside').textContent;
    expect(o).toContain('Mgr ');
    expect(o).toContain('(2w)');
    expect(o).not.toContain(' đi cùng ');
  });
});
