// @vitest-environment jsdom
// Phase 3: lobby helpers return Txt (language-independent); UI renders it with tx(), sinks with txVi().
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { noToggle } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { setLang, tx, txVi } from '../../src/i18n/index.js';
import { debutRec } from '../../src/systems/debut.js';
import { genComp, bonusTxt } from '../../src/systems/contests.js';
import { dOpts } from '../../src/systems/ext3.js';
import { richState } from './sim.js';

noToggle();
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
let base;
beforeAll(() => { base = richState(42, 0); });
afterEach(() => setLang('vi'));

describe('debutRec(a)', () => {
  it('returns Txt: the same object in vi and en; vi text is language-independent, tx gives English', () => {
    setState(structuredClone(base));
    for (const a of S.artists) {
      setLang('vi');
      const vi = debutRec(a), viTxt = { why: txVi(vi.why), short: txVi(vi.short) };
      setLang('en');
      const en = debutRec(a);
      expect(JSON.stringify(en)).toBe(JSON.stringify(vi));            // language-independent
      expect({ why: txVi(en.why), short: txVi(en.short) }).toEqual(viTxt);
      // names of mates are data, strip them before looking for Vietnamese letters
      const strip = s => S.artists.reduce((x, o) => x.split(o.name).join(''), s);
      expect(VI.test(strip(tx(en.short))), tx(en.short)).toBe(false);
      expect(VI.test(strip(tx(en.why))), tx(en.why)).toBe(false);
    }
  });
  it('dOpts keeps language-independent Txt', () => {
    setState(structuredClone(base));
    S.artists.forEach(a => { for (const k in a.st) a.st[k] = 70; a.dReady = 1; });
    setLang('vi');
    const vi = S.artists.map(a => { const o = dOpts(a); return o && JSON.stringify(o.r); });
    setLang('en');
    expect(S.artists.map(a => { const o = dOpts(a); return o && JSON.stringify(o.r); })).toEqual(vi);
  });
});

describe('bonusTxt(c, rank)', () => {
  it('is a language-independent {$g}; txVi is Vietnamese, tx is English', () => {
    setState(structuredClone(base));
    S.comps = []; genComp('tts');
    const c = S.comps[0];
    setLang('vi');
    const vi = [1, 2, 3].map(r => bonusTxt(c, r));
    setLang('en');
    expect([1, 2, 3].map(r => bonusTxt(c, r))).toEqual(vi);
    expect(vi.map(txVi).join()).toMatch(VI); // vi stat names such as "Nhảy" / "Diễn xuất" appear for at least one contest
    for (const r of [1, 2, 3]) expect(VI.test(tx(bonusTxt(c, r)))).toBe(false);
  });
});
