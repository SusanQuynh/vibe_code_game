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

// Chỉ gỡ NGUYÊN chuỗi giá trị của field kiểu tên/tiêu đề (không gỡ theo từ: "Không", "tuần", "Năm"… phải còn bị bắt). Thêm biến thể bỏ emoji/ký hiệu đầu (n của nhóm là "⭐ Tên").
const NAME_KEYS = new Set(['name', 'names', 'title', 't', 'partner', 'costar', 'n']);
// Văn bản lưu trong S mà UI hiển thị nguyên văn (giai đoạn 3 mới chuyển sang key). Khớp theo đường dẫn, gỡ NGUYÊN chuỗi. Thêm mục ở đây phải kèm lý do.
const VERBATIM = [
  /^artists\.\d+\.hist\.\d+$/, // lịch sử nghệ sĩ (viewArtist)
  /^artists\.\d+\.lessons\.\d+\.[ls]$/, // bài học rút ra
  /^artists\.\d+\.dw\.why$/, // lời mong muốn debut (dWish lưu vào S)
  /^artists\.\d+\.hsF\.why\.\d+$/, // lý do của chuyên gia sức khỏe
  /^lastRep\.ev\.\d+$/, // dòng sự kiện tuần trong báo cáo (đi từ log)
  /^lastRep\.a\.\d+\.(b|done)$/, // việc ngoài / dự án xong của nghệ sĩ trong báo cáo
  /^awards\.\d+\.res\.\d+\.(cat|note)$/, // hạng mục + ghi chú giải thưởng
];
function names(v, out = new Set(), key, path = '') {
  if (typeof v === 'string') {
    if ((NAME_KEYS.has(key) || VERBATIM.some(r => r.test(path))) && VI.test(v)) { out.add(v); out.add(v.replace(/^[^\p{L}\p{N}]+/u, '')); }
  } else if (Array.isArray(v)) v.forEach((x, i) => names(x, out, key, path ? `${path}.${i}` : String(i)));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) { if (key === 'partners' && VI.test(k)) out.add(k); // S.partners: khoá là tên đối tác
    if (!SKIP.has(k) || VERBATIM.some(r => r.test(`${path}.${k}.0`))) names(v[k], out, k, path ? `${path}.${k}` : k); }
  out.delete('');
  return out;
}
function surfaceText(root) {
  const parts = [root.textContent];
  for (const e of [root, ...root.querySelectorAll('*')]) for (const a of ['title', 'aria-label', 'placeholder', 'value']) { const v = e.getAttribute?.(a); if (v) parts.push(v); }
  return parts.join('\n');
}
const strip = (text, known) => { for (const v of [...known].sort((a, b) => b.length - a.length)) text = text.split(v).join(' '); return text; };
export function leaks(text, known) {
  text = strip(text, known);
  return text.split(/[^\p{L}\p{N}]+/u).filter(w => w && VI.test(w));
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
    // tên lấy từ S bị gỡ nguyên chuỗi, từ thông dụng trong tên thì không
    const nm = new Set(['Ký Ức Không Tên']);
    expect(leaks('Ký Ức Không Tên: Không đủ tiền', nm)).toEqual(['Không', 'đủ', 'tiền']);
    expect(leaks('«Ký Ức Không Tên»', nm)).toEqual([]);
    expect([...names({ artists: [{ name: 'Vũ Quốc Huy', why: 'Không đủ' }], groups: [{ n: '⭐ Sao Đêm' }], log: [{ t: 'Ký' }] })].sort()).toEqual(['Sao Đêm', 'Vũ Quốc Huy', '⭐ Sao Đêm']);
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
    const known = names(S);
    expect(leaks(text, known)).toEqual([]);
    expect(strip(text, known).match(VI_PLAIN)).toBeNull();
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
