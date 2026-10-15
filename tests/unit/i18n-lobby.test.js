// @vitest-environment jsdom
// Task 4: dual-use helpers of the lobby area keep producing Vietnamese by default (they feed S.props, log, lessons).
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { noToggle } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { t, tVi, setLang } from '../../src/i18n/index.js';
import { debutRec } from '../../src/systems/debut.js';
import { genComp, bonusTxt } from '../../src/systems/contests.js';
import { dOpts } from '../../src/systems/ext3.js';
import { richState } from './sim.js';

noToggle();
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
let base;
beforeAll(() => { base = richState(42, 0); });
afterEach(() => setLang('vi'));

describe('debutRec(a, tr)', () => {
  it('default (tVi) is language-independent; t gives English', () => {
    setState(structuredClone(base));
    for (const a of S.artists) {
      setLang('vi');
      const vi = debutRec(a);
      setLang('en');
      const dflt = debutRec(a), viaVi = debutRec(a, tVi), en = debutRec(a, t);
      expect(dflt).toEqual(vi);
      expect(viaVi).toEqual(vi);
      expect(dflt.short).toBe(debutRec(a, tVi).short);
      // names of mates are data, strip them before looking for Vietnamese letters
      const strip = s => S.artists.reduce((x, o) => x.split(o.name).join(''), s);
      expect(VI.test(strip(en.short)), en.short).toBe(false);
      expect(VI.test(strip(en.why)), en.why).toBe(false);
    }
  });
  it('dOpts default keeps Vietnamese text', () => {
    setState(structuredClone(base));
    S.artists.forEach(a => { for (const k in a.st) a.st[k] = 70; a.dReady = 1; });
    setLang('vi');
    const vi = S.artists.map(a => { const o = dOpts(a); return o && o.r; });
    setLang('en');
    expect(S.artists.map(a => { const o = dOpts(a); return o && o.r; })).toEqual(vi);
  });
});

describe('bonusTxt(c, rank, tr)', () => {
  it('default (tVi) is language-independent; t gives English', () => {
    setState(structuredClone(base));
    S.comps = []; genComp('tts');
    const c = S.comps[0];
    setLang('vi');
    const vi = [1, 2, 3].map(r => bonusTxt(c, r));
    setLang('en');
    expect([1, 2, 3].map(r => bonusTxt(c, r))).toEqual(vi);
    expect(vi.join()).toMatch(VI); // vi stat names such as "Nhảy" / "Diễn xuất" appear for at least one contest
    for (const r of [1, 2, 3]) expect(VI.test(bonusTxt(c, r, t))).toBe(false);
  });
});
