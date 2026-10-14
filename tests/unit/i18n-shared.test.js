// @vitest-environment jsdom
// Phase 3: shared helpers return Txt (language-independent); UI renders it with tx(), sinks with txVi().
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { noToggle } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { setLang, tx, txVi } from '../../src/i18n/index.js';
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
  it('targetName: language-independent Txt; txVi is Vietnamese, tx gives English', () => {
    setState(structuredClone(base));
    hireMgr(S.mgrPool[0].id);
    const m = S.managers[0], a = S.artists[0];
    const cases = [null, { t: 't' }, { t: 'b', id: S.curBatch }, { t: 'b', id: -1 }, { t: 's' }, { t: 'd' }, { t: 'l', ids: [a.id] }, { t: 'l', ids: [] }, { t: 'g', id: -1 }, { t: 'a', id: a.id }];
    for (const as of cases) {
      m.as = as;
      setLang('vi');
      const vi = targetName(m), viTxt = txVi(vi);
      setLang('en');
      expect(JSON.stringify(targetName(m))).toBe(JSON.stringify(vi));
      expect(txVi(targetName(m))).toBe(viTxt);
      if (as && as.t !== 'b') expect(VI.test(tx(targetName(m)).split(a.name).join('')), JSON.stringify(as)).toBe(false); // names are data
    }
  });
  it('wkLabel: language-independent Txt; txVi is Vietnamese, tx gives English', () => {
    setState(structuredClone(base));
    for (const w of [5, 52, 53, 60]) {
      setLang('vi');
      const vi = wkLabel(w), viTxt = txVi(vi);
      setLang('en');
      expect(JSON.stringify(wkLabel(w))).toBe(JSON.stringify(vi));
      expect(txVi(wkLabel(w))).toBe(viTxt);
      expect(VI.test(tx(wkLabel(w)))).toBe(false);
    }
    setLang('vi');
    expect(txVi(wkLabel(5))).toBe('T5');
    expect(txVi(wkLabel(53))).toBe('T1 N2');
    setLang('en');
    expect(tx(wkLabel(5))).toBe('W5');
    expect(tx(wkLabel(53))).toBe('W1 Y2');
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
