// Phase 3 helpers: legacy vi-view of a state, census of stored-text fields, progress lists.
import * as I18N from '../../src/i18n/index.js';

const OK_K = new Set(['k', 'p']);
// a structured stored-text value: Msg {k,p?} or one tag ({$}, {$g}, {$l,j?})
export function isTxtObj(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const ks = Object.keys(v);
  if (typeof v.k === 'string') return ks.every(x => OK_K.has(x));
  if (ks.length === 1) return ['$', '$g', '$l'].includes(ks[0]);
  return ks.length === 2 && '$l' in v && 'j' in v;
}
// deep clone where every Txt object becomes its Vietnamese rendering (identity while txVi does not exist or S holds strings)
export function viView(x) {
  const tv = I18N.txVi;
  const go = v => {
    if (Array.isArray(v)) return v.map(go);
    if (v && typeof v === 'object') {
      if (tv && isTxtObj(v)) return tv(v);
      const o = {};
      for (const k of Object.keys(v)) o[k] = go(v[k]);
      return o;
    }
    return v;
  };
  return go(x);
}

const arr = v => (Array.isArray(v) ? v : []);
const vals = o => Object.values(o || {});
const busyTitles = S => S.artists.map(a => a.busy).filter(b => b && b.kind !== 'offer' && b.kind !== 'shoot').map(b => b.title);
const propVals = S => {
  const P = S.props || {}, out = [];
  for (const m of vals(P.m)) {
    for (const s of arr(m.s)) out.push(s.why, s.why2);
    for (const d of arr(m.d)) out.push(d.txt);
  }
  for (const c of arr(P.c)) out.push(c.txt, c.by, ...arr(c.path));
  for (const x of arr(P.x)) out.push(x.by);
  return out;
};
const rep = S => S.lastRep || {};
// category → every stored-text value of that category in S (undefined entries are skipped by the census)
export const TXT_PATHS = [
  { cat: 'log', get: S => arr(S.log).map(l => l.t) },
  { cat: 'ev', get: S => arr(rep(S).ev) }, // rep.a[].b is a straight copy of busy.title (counted under 'busy'; offer/shoot titles are project names)
  { cat: 'hist', get: S => S.artists.flatMap(a => arr(a.hist)) },
  { cat: 'lessons', get: S => S.artists.flatMap(a => arr(a.lessons).flatMap(l => [l.t, l.l, l.s, l.b])) },
  { cat: 'busy', get: busyTitles },
  { cat: 'awards', get: S => arr(S.awards).flatMap(w => [...arr(w.res).flatMap(r => [r.cat, r.note]), ...arr(w.board).filter(b => b.me).map(b => b.n)]) },
  { cat: 'comps', get: S => arr(S.comps).map(c => c.n) },
  { cat: 'rivals', get: S => arr(S.rivals).map(r => r.last) },
  { cat: 'mods', get: S => vals(S.mods).map(m => m && m.n) },
  { cat: 'loan', get: S => [S.loan && S.loan.n] },
  { cat: 'gmRep', get: S => arr(S.gmRep && S.gmRep.prob) },
  { cat: 'rec', get: S => arr(S.rec && S.rec.log) },
  { cat: 'props', get: propVals },
  { cat: 'hsF', get: S => S.artists.flatMap(a => arr(a.hsF && a.hsF.why)) },
  { cat: 'dw', get: S => S.artists.map(a => a.dw && a.dw.why) },
  { cat: 'scandal', get: S => S.artists.map(a => a.scandal && a.scandal.t) },
  { cat: 'events', get: S => arr(S.events).flatMap(e => [e.why, e.how, e.where]) },
  { cat: 'prHist', get: S => arr(S.prHist) },
  { cat: 'batches', get: S => arr(S.batches).map(b => b.n) },
  { cat: 'films', get: S => arr(S.films).map(f => f.status) },
  { cat: 'singles', get: S => arr(S.singles).map(s => s.concept) },
  { cat: 'evG', get: S => S.artists.map(a => a.evG) },
  { cat: 'lastEval', get: S => [...arr(S.lastEval && S.lastEval.t), ...arr(S.lastEval && S.lastEval.a)].map(x => x.g) },
];
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
// { cat: number of string values holding a Vietnamese letter }
export function census(S) {
  const out = {};
  for (const { cat, get } of TXT_PATHS) {
    let n = 0;
    try { for (const v of get(S)) if (typeof v === 'string' && VI.test(v)) n++; } catch { n = -1; }
    out[cat] = n;
  }
  return out;
}

// grown by the writer tasks
export const P3_DONE = ['state.js', 'save/storage.js', 'ui/saveView.js', 'systems/artists.js', 'systems/batches.js', 'systems/awards.js', 'systems/week.js', 'systems/releases.js', 'systems/promo.js', 'systems/contests.js', 'systems/debut.js', 'systems/recruit.js', 'systems/managers.js', 'systems/gm.js', 'systems/offers.js', 'systems/proposals.js', 'systems/secretary.js', 'systems/review.js', 'systems/events.js', 'systems/market.js', 'systems/ext2.js', 'systems/ext3.js'];
export const P3_FIELDS = TXT_PATHS.map(p => p.cat); // every stored-text category is converted

// Replace every stored-text field of a state by a structured entry (mirrors TXT_PATHS). Used to prove that no reader prints a raw object.
export function msgify(S, M = { k: 'batch.n', p: { i: 9 } }) {
  const m = () => ({ k: M.k, p: { ...M.p } });
  const arrM = a => { if (Array.isArray(a)) for (let i = 0; i < a.length; i++) a[i] = m(); };
  for (const l of arr(S.log)) l.t = m();
  const R = rep(S);
  arrM(R.ev); for (const x of vals(R.a)) if (x.b) x.b = m();
  for (const a of S.artists) {
    arrM(a.hist);
    for (const l of arr(a.lessons)) { l.t = m(); l.l = m(); l.s = { $g: { vocal: '1.5' } }; if (l.b) l.b = { $g: { dance: '2' } }; }
    if (a.busy && a.busy.kind !== 'offer' && a.busy.kind !== 'shoot') a.busy.title = m();
    if (a.hsF) arrM(a.hsF.why);
    if (a.dw) a.dw.why = m();
    if (a.scandal) a.scandal.t = m();
    if (a.evG) a.evG = { k: 'grade.pass' };
  }
  for (const w of arr(S.awards)) { for (const r of arr(w.res)) { r.cat = m(); r.note = m(); } for (const b of arr(w.board)) if (b.me) b.n = m(); }
  for (const c of arr(S.comps)) c.n = m();
  for (const r of arr(S.rivals)) if (r.last) r.last = m();
  for (const x of vals(S.mods)) if (x) x.n = m();
  if (S.loan) S.loan.n = m();
  if (S.gmRep) arrM(S.gmRep.prob);
  if (S.rec) arrM(S.rec.log);
  const P = S.props || {};
  for (const x of vals(P.m)) { for (const s of arr(x.s)) { s.why = m(); if (s.why2) s.why2 = m(); if (s.by) s.by = m(); } for (const d of arr(x.d)) d.txt = m(); for (const p of arr(x.p)) { if (p.why2) p.why2 = m(); if (p.by) p.by = m(); } }
  for (const c of arr(P.c)) { c.txt = m(); if (c.by) c.by = m(); c.path = arr(c.path).map(() => m()); }
  for (const e of arr(S.events)) for (const k of ['why', 'how', 'where']) if (e[k]) e[k] = m();
  arrM(S.prHist);
  for (const b of arr(S.batches)) b.n = m();
  for (const f of arr(S.films)) f.status = { k: 'film.st.post' };
  for (const s of arr(S.singles)) s.concept = { k: 'concept.cute' };
  const le = S.lastEval; if (le) for (const x of [...arr(le.t), ...arr(le.a)]) x.g = { k: 'grade.pass' };
  return S;
}
