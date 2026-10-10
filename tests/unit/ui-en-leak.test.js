// @vitest-environment jsdom
// Bề mặt đã dịch (DONE) ở lang=en không được còn chữ Việt, trừ dữ liệu lấy từ S (tên người, bài hát…, bỏ log/hist/prHist).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { setPos } from '../../src/ui/building.js';
import { setLang } from '../../src/i18n/index.js';
import { SURFACES, DONE, EXCLUDED } from './surfaces.js';
import { bars, mgrBars, schedSel, wTable } from '../../src/ui/views.js';
import { CONCEPTS, GENRES } from '../../src/data/rules.js';

noToggle();
const FX = Object.fromEntries(['new', 'rich'].map(k => [k, JSON.parse(fs.readFileSync(`tests/fixtures/ui-${k}.json`, 'utf8'))]));
const SKIP = new Set(['log', 'hist', 'prHist']);
const VI = /[À-ỹĐđ]/;
// tiếng Việt không dấu: tiền "600 tr", TTS, QL, nhãn tuần "T5 N2"
const VI_PLAIN = /\d tr\b|\bTTS\b|\bQL\b|\bT\d+( N\d+)?\b/;

function words(v, out = new Set(), key) {
  if (typeof v === 'string') { for (const w of v.split(/[^\p{L}\p{N}]+/u)) if (w) out.add(w); }
  else if (Array.isArray(v)) v.forEach(x => words(x, out));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) if (!SKIP.has(k)) words(v[k], out, k);
  return out;
}
function surfaceText(root) {
  const parts = [root.textContent];
  for (const e of [root, ...root.querySelectorAll('*')]) for (const a of ['title', 'aria-label', 'placeholder', 'value']) { const v = e.getAttribute?.(a); if (v) parts.push(v); }
  return parts.join('\n');
}
export function leaks(text, known) {
  return text.split(/[^\p{L}\p{N}]+/u).filter(w => w && VI.test(w) && !known.has(w));
}

beforeEach(() => { document.body.innerHTML = SHELL; localStorage.clear(); seed(42); setPos({}); });
afterEach(() => setLang('vi'));

describe('ui-en-leak', () => {
  it('DONE ⊆ SURFACES', () => {
    const ids = new Set(SURFACES.map(s => s.id));
    expect([...DONE].filter(d => !ids.has(d))).toEqual([]);
  });
  it('bộ lọc bắt được chữ Việt', () => {
    expect(leaks('Phòng Họp Smith', new Set(['Smith']))).toEqual(['Phòng', 'Họp']);
    expect(VI_PLAIN.test('Fee 600 tr')).toBe(true);
    expect(VI_PLAIN.test('Fee 600M')).toBe(false);
  });
  const run = SURFACES.filter(s => DONE.has(s.id) && !EXCLUDED.has(s.id)).map(s => [s.id, s]);
  if (run.length) it.each(run)('%s không rò chữ Việt ở en', (_id, s) => {
    setState(structuredClone(FX[s.fx.split('.')[0]]));
    setLang('en');
    s.open();
    const el = document.querySelector(s.sel);
    expect(el).toBeTruthy();
    const text = surfaceText(el);
    const known = words(S);
    expect(leaks(text, known)).toEqual([]);
    expect(text.match(VI_PLAIN)).toBeNull();
  });
});

describe('helper hiển thị dùng chung (task 4) ở en', () => {
  it('bars, mgrBars, wTable, tiêu đề lịch của schedSel không rò chữ Việt; vi giữ nguyên chữ cũ', () => {
    setState(structuredClone(FX.rich));
    const a = S.artists[0], m = S.managers[0];
    const html = () => {
      const d = document.createElement('div');
      d.innerHTML = bars(a) + mgrBars(m) + wTable(CONCEPTS, 'concept') + wTable(GENRES, 'genre') + schedSel(a).split('</span>')[0] + '</span>';
      return surfaceText(d);
    };
    setLang('vi');
    const vi = html();
    expect(vi).toContain('Diễn xuất');
    expect(vi).toContain('Đàm phán');
    expect(vi).toContain('Dễ thương');
    expect(vi).toMatch(/T2: /);
    setLang('en');
    const en = html();
    expect(leaks(en, new Set())).toEqual([]);
    expect(en).toContain('Negotiation');
    expect(en).toContain('Cute');
    expect(en).toMatch(/Mo: /);
    expect(en).not.toMatch(/\bT[2-7]\b|\bCN\b/);
  });
});
