import { fmt } from '../core/util.js';
// Lõi i18n: module lá (không import system/UI, không chạm DOM, không gọi RNG).
const mods = import.meta.glob('./locales/*.js', { eager: true });
let DICTS = Object.fromEntries(Object.values(mods).map(m => [m.default.meta.code, m.default]));
export const LANG_KEY = 'starlight_lang';
let cur = 'vi';
export const getLang = () => cur;
export const langs = () => Object.values(DICTS).map(d => d.meta).sort((a, b) => (b.code === 'vi') - (a.code === 'vi'));
const has = c => typeof c === 'string' && Object.hasOwn(DICTS, c); // chặn '__proto__', 'constructor'…
export const getMeta = () => DICTS[cur].meta;
export function setLang(c) { if (!has(c)) return false; cur = c; try { localStorage.setItem(LANG_KEY, c); } catch {} return true; }
export function initLang() { let c = null; try { c = localStorage.getItem(LANG_KEY); } catch {} cur = has(c) ? c : 'vi'; return cur; }
// Giá trị: chuỗi có {x}, hoặc hàm (p) => string. Từ điển là HTML tin cậy, tham số do caller esc().
export function t(k, p) {
  const v = DICTS[cur]?.dict[k] ?? DICTS.vi.dict[k];
  if (v == null) return k;
  return typeof v === 'function' ? v(p || {}) : p ? v.replace(/\{(\w+)\}/g, (m, n) => (n in p ? p[n] : m)) : v;
}
export const __setDicts = d => { DICTS = d; }; // chỉ cho test
export const roomName = id => t(`room.${id}.name`);
// Nhãn dữ liệu tra theo id (UI). Bảng trong src/data/* giữ field n/chuỗi chỉ cho log/S. biz dùng lbl('biz', `${k}.n`)
export const lbl = (ns, k) => t(`${ns}.${k}`);
// Tiền hiển thị theo ngôn ngữ. fmt() mặc định (vi) vẫn dùng cho addLog để S không phụ thuộc ngôn ngữ.
export const money = m => fmt(m, t('fmt.units'));
