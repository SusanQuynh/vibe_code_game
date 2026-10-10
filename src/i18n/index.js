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
export function t(k, p) {
  const v = DICTS[cur]?.dict[k] ?? DICTS.vi.dict[k];
  if (v == null) return k;
  return typeof v === 'function' ? v(p || {}) : p ? v.replace(/\{(\w+)\}/g, (m, n) => (n in p ? p[n] : m)) : v;
}
export const __setDicts = d => { DICTS = d; }; // tests only
export const roomName = id => t(`room.${id}.name`);
// Money for display, per language. Default fmt() (vi) is still used by addLog so S stays language-independent.
export const money = m => fmt(m, t('fmt.units'));
