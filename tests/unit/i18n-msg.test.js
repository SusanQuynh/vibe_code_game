// Stored-text primitives: Lk/tx/txVi/isK/wkTok, tags, nested params, no RNG use.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { Lk, tx, txVi, isK, wkTok, t, tVi, setLang } from '../../src/i18n/index.js';
import { fmt } from '../../src/core/util.js';
import { pickI, pick } from '../../src/core/rng.js';
import { seed } from './helpers.js';

afterEach(() => setLang('vi'));
const both = f => { setLang('vi'); const a = f(); setLang('en'); const b = f(); return [a, b]; };

describe('Txt rendering', () => {
  it('legacy string in, same string out', () => {
    const [a, b] = both(() => tx('Nghỉ phép'));
    expect(a).toBe('Nghỉ phép'); expect(b).toBe('Nghỉ phép'); expect(txVi('x')).toBe('x');
  });
  it('null/number', () => { expect(tx(null)).toBe(''); expect(tx(undefined)).toBe(''); expect(tx(5)).toBe('5'); });
  it('Lk without params and with params', () => {
    expect(Lk('a.b')).toEqual({ k: 'a.b' }); expect(Lk('a.b', { x: 1 })).toEqual({ k: 'a.b', p: { x: 1 } });
    const [a, b] = both(() => tx(Lk('batch.n', { i: 3 })));
    expect(a).toBe('Lứa 3'); expect(b).toBe('Batch 3');
    expect(txVi(Lk('batch.n', { i: 3 }))).toBe('Lứa 3');
  });
  it('missing key renders the key', () => { expect(tx(Lk('no.such.key'))).toBe('no.such.key'); });
  it('nested Msg in Msg and in t() params', () => {
    const m = Lk('prop.cf.overlap');
    expect(txVi(Lk('target.batch', { n: Lk('batch.n', { i: 2 }) }))).toBe('thực tập sinh lứa 2');
    setLang('en');
    expect(tx(m)).toBe(t('prop.cf.overlap'));
    expect(tx(Lk('target.batch', { n: Lk('batch.n', { i: 2 }) }))).toBe(t('target.batch', { n: 'Batch 2' }));
    // t() itself renders Txt params, whether legacy string or Msg
    expect(t('target.batch', { n: Lk('batch.n', { i: 2 }) })).toBe(t('target.batch', { n: 'Batch 2' }));
    expect(tVi('target.batch', { n: Lk('batch.n', { i: 2 }) })).toBe('thực tập sinh lứa 2');
  });
  it('function-valued keys receive rendered strings', () => {
    expect(txVi(Lk('target.batch', { n: Lk('batch.n', { i: 2 }) }))).toBe('thực tập sinh lứa 2');
  });
  it('money tag', () => {
    expect(txVi({ $: 2.5e9 })).toBe('2.5 tỷ'); expect(txVi({ $: 2.5e9 })).toBe(fmt(2.5e9));
    expect(txVi({ $: 60e6 })).toBe(fmt(60e6)); expect(txVi({ $: -3000 })).toBe(fmt(-3000));
    setLang('en'); expect(tx({ $: 2.5e9 })).toBe('2.5B'); expect(tx({ $: 60e6 })).toBe('60M'); expect(txVi({ $: 60e6 })).toBe('60 tr');
  });
  it('stat-gain tag', () => {
    const g = { $g: { vocal: '1.3', dance: '0.8' } };
    const [a, b] = both(() => tx(g));
    expect(a).toBe(`${tVi('stat.vocal')} +1.3, ${tVi('stat.dance')} +0.8`);
    expect(b).toBe('Vocal +1.3, Dance +0.8');
    expect(txVi(g)).toBe(a);
  });
  it('list tag', () => {
    const l = { $l: ['a', Lk('batch.n', { i: 1 }), 'c'], j: ' · ' };
    const [a, b] = both(() => tx(l));
    expect(a).toBe('a · Lứa 1 · c'); expect(b).toBe('a · Batch 1 · c');
    expect(txVi({ $l: ['x', 'y'] })).toBe('x, y');
  });
  it('tags inside params', () => {
    expect(txVi(Lk('toast.need', { m: { $: 60e6 } }))).toBe('Không đủ ' + fmt(60e6));
    setLang('en'); expect(tx(Lk('toast.need', { m: { $: 60e6 } }))).toBe(t('toast.need', { m: '60M' }));
  });
  it('objects with a stray k are not Txt', () => {
    const o = { k: 'x', id: 4, toString: () => 'OBJ' };
    expect(t('toast.need', { m: o })).toBe('Không đủ OBJ'); // passed through untouched, not rendered as a Msg
  });
});

describe('isK / wkTok', () => {
  it('isK on legacy string, Msg, null', () => {
    expect(isK('Không đạt', 'grade.fail')).toBe(true);
    expect(isK('Đạt', 'grade.fail')).toBe(false);
    expect(isK(Lk('grade.fail'), 'grade.fail')).toBe(true);
    expect(isK(Lk('grade.pass'), 'grade.fail')).toBe(false);
    expect(isK(null, 'grade.fail')).toBeFalsy(); expect(isK(undefined, 'grade.fail')).toBeFalsy();
    setLang('en'); expect(isK('Không đạt', 'grade.fail')).toBe(true); // legacy compares with the Vietnamese text in any language
  });
  it('wkTok', () => {
    const [a, b] = both(() => wkTok('N2·T7'));
    expect(a).toBe('N2·T7'); expect(b).toBe('Y2·W7');
    expect(wkTok('x')).toBe('x'); expect(wkTok(undefined)).toBe(undefined);
  });
});

describe('no RNG use, pickI', () => {
  it('rendering never calls Math.random', () => {
    const spy = vi.spyOn(Math, 'random');
    tx(Lk('batch.n', { i: 1 })); txVi({ $g: { vocal: '1' } }); tx({ $: 1e9 }); isK('x', 'grade.ex'); wkTok('N1·T1');
    expect(spy).not.toHaveBeenCalled(); spy.mockRestore();
  });
  it('pickI draws exactly like pick', () => {
    for (let n = 2; n <= 7; n++) {
      const a = Array.from({ length: n }, (_, i) => i);
      seed(11 + n); let c1 = 0; const o = Math.random; Math.random = () => { c1++; return o(); };
      const x = a.indexOf(pick(a)); Math.random = o;
      seed(11 + n); let c2 = 0; const o2 = Math.random; Math.random = () => { c2++; return o2(); };
      const y = pickI(n); Math.random = o2;
      expect(y).toBe(x); expect(c2).toBe(1); expect(c1).toBe(1);
    }
  });
});
