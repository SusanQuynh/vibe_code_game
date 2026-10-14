import { fmt } from '../core/util.js';
// i18n core: leaf module (no system/UI imports, no DOM access, no RNG calls).
const mods = import.meta.glob('./locales/*.js', { eager: true });
let DICTS = Object.fromEntries(Object.values(mods).map(m => [m.default.meta.code, m.default]));
export const LANG_KEY = 'starlight_lang';
let cur = 'vi';
export const getLang = () => cur;
export const langs = () => Object.values(DICTS).map(d => d.meta).sort((a, b) => (b.code === 'vi') - (a.code === 'vi'));
const has = c => typeof c === 'string' && Object.hasOwn(DICTS, c); // blocks '__proto__', 'constructor'…
export const getMeta = () => DICTS[cur].meta;
export function setLang(c) { if (!has(c)) return false; cur = c; try { localStorage.setItem(LANG_KEY, c); } catch {} return true; }
export function initLang() { let c = null; try { c = localStorage.getItem(LANG_KEY); } catch {} cur = has(c) ? c : 'vi'; return cur; }
// Values: strings with {x}, or functions (p) => string. Dictionaries are trusted HTML; callers esc() parameters.
const lookCur = k => DICTS[cur]?.dict[k] ?? DICTS.vi.dict[k];
const lookVi = k => DICTS.vi.dict[k];
// Txt (stored text): string (legacy / proper noun) | Msg {k,p?} | tag {$: money} {$g: stat gains} {$l: [Txt…], j}
const OKP = new Set(['k', 'p']);
const isTxt = v => {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return false;
  const ks = Object.keys(v);
  if (typeof v.k === 'string') return ks.every(x => OKP.has(x));
  return ks.length === 1 ? ks[0] === '$' || ks[0] === '$g' || ks[0] === '$l' : ks.length === 2 && '$l' in v && 'j' in v;
};
// copies p only when a value is a Txt (no allocation on the hot path)
const mapTxt = (p, look) => { let q = null; for (const k in p) if (isTxt(p[k])) { q = q || { ...p }; q[k] = rv(p[k], look); } return q || p; };
// Placeholders: {x} = param, {x:ns} = param holds an id and renders the label key `ns.<id>` (keeps stored refs short).
// lenient (stored Msg): a param Lk() left out (empty string) renders as ''; otherwise a missing one stays visible as {x}.
const fmtv = (v, p, look = lookCur, lenient = false) => {
  const q = p && mapTxt(p, look);
  if (typeof v === 'function') return v(lenient ? new Proxy(q || {}, { get: (o, k) => (k in o || typeof k === 'symbol' ? o[k] : '') }) : q || {});
  if (!q && !lenient) return v;
  return v.replace(/\{(\w+)(?::([\w.]+))?\}/g, (m, n, ns) => (q && n in q ? (ns ? look(`${ns}.${q[n]}`) ?? q[n] : q[n]) : lenient ? '' : m));
};
function rv(v, look) {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  if (!isTxt(v)) return String(v);
  if ('$' in v) return fmt(v.$, look('fmt.units'));
  if ('$g' in v) return Object.entries(v.$g).map(([s, x]) => fmtv(look('common.gain'), { s: look(`stat.${s}`), v: x }, look)).join(', ');
  if ('$l' in v) return v.$l.map(i => rv(i, look)).join(v.j ?? ', ');
  const d = look(v.k);
  return d == null ? v.k : fmtv(d, v.p, look, true);
}
export function t(k, p) {
  const v = lookCur(k);
  return v == null ? k : fmtv(v, p, lookCur);
}
// Pinned to Vietnamese: for helpers whose output also goes into S (log, hist, lessons…), so S stays language-independent.
export function tVi(k, p) { const v = lookVi(k); return v == null ? k : fmtv(v, p, lookVi); }
// Structured stored text: Lk builds a Msg; tx renders a Txt in the current language, txVi in Vietnamese.
// Params equal to '' are not stored (optional suffixes); rendering treats a missing param as ''.
export const Lk = (k, p) => {
  if (!p) return { k };
  let q = null;
  for (const n in p) if (p[n] !== '' && p[n] !== undefined) (q ||= {})[n] = p[n];
  return q ? { k, p: q } : { k };
};
export const tx = v => rv(v, lookCur);
export const txVi = v => rv(v, lookVi);
// compare a stored value with a key; a legacy (pre-phase-3) string is compared with the key's Vietnamese text
export const isK = (v, k) => (v && typeof v === 'object' ? v.k === k : v === tVi(k));
// log stamp 'N{y}·T{w}' (language-neutral token) in the current language
export const wkTok = w => { const m = /^N(\d+)·T(\d+)$/.exec(w || ''); return m ? t('common.yw', { y: +m[1], w: +m[2] }) : w; };
export const __setDicts = d => { DICTS = d; }; // tests only
export const roomName = id => t(`room.${id}.name`);
// Money for display, per language. Default fmt() (vi) is still used by addLog so S stays language-independent.
export const money = m => fmt(m, t('fmt.units'));
