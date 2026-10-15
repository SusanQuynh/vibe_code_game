// @vitest-environment jsdom
// shortOf (SL2 payload): pure, keeps progress, drops history and rebuildable lists, no dangling offer ids. Sizes use node:zlib (jsdom Blob has no .stream()).
import { describe, it, expect, beforeAll } from 'vitest';
import zlib from 'node:zlib';
import { noToggle } from './helpers.js';
import { richState } from './sim.js';
import { S } from '../../src/state.js';
import { shortOf } from '../../src/save/storage.js';

noToggle(true);
const clone = (x) => JSON.parse(JSON.stringify(x));
const b64 = (b) => b.toString('base64url');
const sl1 = (s) => 4 + b64(zlib.gzipSync(JSON.stringify(s))).length;
const sl2 = (s) => 4 + b64(zlib.deflateRawSync(JSON.stringify(s))).length;
const PROGRESS = ['money', 'year', 'week', 'groups', 'songs', 'managers', 'batches', 'awards', 'compRuns'];

describe('shortOf', () => {
  let st;
  beforeAll(() => { richState(3, 56); st = clone(S); }, 120000);

  it('does not mutate its input', () => {
    const before = JSON.stringify(st);
    shortOf(st);
    expect(JSON.stringify(st)).toBe(before);
  });
  it('keeps the progress fields', () => {
    const s = shortOf(st);
    for (const k of PROGRESS) expect(s[k], k).toEqual(st[k]);
    expect(s.artists.length).toBe(st.artists.length);
    st.artists.forEach((a, i) => {
      const b = s.artists[i];
      for (const k of ['id', 'name', 'st', 'look', 'fans', 'status', 'busy', 'contract']) expect(b[k], k).toEqual(a[k]);
    });
    expect(s.__short).toBe(1);
  });
  it('drops history and regenerable lists', () => {
    const s = shortOf(st);
    for (const k of ['log', 'fin', 'prHist', 'pool', 'mgrPool', 'comps']) expect(s[k], k).toEqual([]);
    for (const k of ['hsC', 'lastRep', 'lastEval']) expect(k in s, k).toBe(false);
    expect(s.artists.every((a) => !a.hist.length && !a.lessons.length)).toBe(true);
    expect(s.rec.log).toEqual([]);
  });
  for (const wk of [10, 56, 150]) {
    it(`SL2 is at most 60% of SL1 at week ${wk}`, () => {
      richState(3, wk);
      const full = clone(S), a = sl1(full), b = sl2(shortOf(full));
      console.log(`week ${wk}: SL1 ${a}  SL2 ${b}  ratio ${(b / a).toFixed(3)}`);
      expect(b).toBeLessThanOrEqual(a * 0.6);
    }, 240000);
  }
  it('no dangling offer ids', () => {
    richState(3, 56);
    const d = clone(S), o = d.offers;
    expect(o.length).toBeGreaterThan(5);
    const [x, y, z, inv] = o;
    inv.invested = true;
    d.events.push({ kind: 'v3', t: 'mtjob', a: d.artists[0].id, b: d.artists[1].id, of: x.id });
    d.films.push({ id: 9999, title: 'F', offerId: y.id, cast: [], done: false });
    d.props = { w: 1, m: { 1: { s: [], d: [], p: [{ of: z.id, ids: [], ok: 0 }] } }, c: [], st: {} };
    d.artists[0].busy = { kind: 'offer', offerId: o[4].id, left: 1, total: 1 };
    const s = shortOf(d), keep = new Set(s.offers.map((q) => q.id));
    for (const q of [x, y, z, inv, o[4]]) expect(keep.has(q.id)).toBe(true);
    expect(s.offers.length).toBeLessThanOrEqual(5 + o.filter((q) => q.invested && ![x, y, z, inv, o[4]].includes(q)).length);
    const ids = [...s.events.filter((e) => e.of != null).map((e) => e.of), ...s.films.filter((f) => f.offerId != null).map((f) => f.offerId),
      ...Object.values(s.props.m).flatMap((m) => m.p.map((p) => p.of)), ...s.artists.filter((a) => a.busy && a.busy.offerId != null).map((a) => a.busy.offerId)];
    expect(ids.length).toBeGreaterThanOrEqual(4);
    const had = new Set(o.map((q) => q.id));   // ids already gone in the source (accepted offers) stay gone: not new dangling
    for (const id of ids) if (had.has(id)) expect(keep.has(id), String(id)).toBe(true);
  }, 120000);
});
