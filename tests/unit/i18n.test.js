// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { t, lbl, money, setLang, getLang, initLang, langs, LANG_KEY, __setDicts } from '../../src/i18n/index.js';
import { diffLocales } from '../../src/i18n/check.js';
import { noToggle, seed, SHELL } from './helpers.js';
import { newGame } from '../../src/state.js';
import { ROOMS } from '../../src/data/rules.js';
import { renderTop, renderDock, NPC } from '../../src/ui/building.js';
import { modal } from '../../src/ui/modal.js';
import { fire } from '../../src/systems/artists.js';
import { TUT, tutStart, tutEnd } from '../../src/ui/tutorial.js';
import { openRoom } from '../../src/ui/rooms.js';
import { S } from '../../src/state.js';
import { view } from '../../src/ui/modal.js';
import { applyHtmlLang, applyStatic, chooseLang, viewLang } from '../../src/ui/lang.js';
import viL from '../../src/i18n/locales/vi.js';
import enL from '../../src/i18n/locales/en.js';
import { STATS, TRAIN, GENRES, CONCEPTS, MSK, MSKD } from '../../src/data/rules.js';
import { OFFER } from '../../src/data/offers.js';
import { BIZ } from '../../src/systems/market.js';
import { DAYS } from '../../src/systems/week.js';
// DAYN đã bỏ khỏi src (chỉ UI dùng, qua lbl): nguồn chuẩn của tên ngày tiếng Việt nằm ở đây
const DAYN = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
import { FIN_I, FIN_X } from '../../src/systems/ext2.js';
import { DR, DRT } from '../../src/systems/debut.js';
import { CFT } from '../../src/systems/proposals.js';
import { BUDN } from '../../src/systems/secretary.js';
import { PRE, POST } from '../../src/systems/promo.js';
import { PRP } from '../../src/systems/review.js';

noToggle();
const REAL = { vi: viL, en: enL };
beforeEach(() => localStorage.clear());
afterEach(() => { __setDicts(REAL); setLang('vi'); });

describe('i18n lõi', () => {
  it('key thiếu trả về chính key', () => expect(t('x.missing')).toBe('x.missing'));
  it('thay placeholder, giữ nguyên nếu thiếu tham số', () => {
    expect(t('lang.current', { name: 'X' })).toBe('Đang dùng: X');
    expect(t('lang.current', {})).toBe('Đang dùng: {name}');
    expect(t('lang.current')).toBe('Đang dùng: {name}');
  });
  it('fallback về vi khi locale hiện tại thiếu key; giá trị hàm được gọi', () => {
    __setDicts({
      vi: { meta: { code: 'vi' }, dict: { a: 'A-vi', b: p => `b${p.n}` } },
      zz: { meta: { code: 'zz' }, dict: { b: p => `zz${p.n}` } },
    });
    setLang('zz');
    expect(t('a')).toBe('A-vi');
    expect(t('b', { n: 1 })).toBe('zz1');
  });
  it('setLang: mã lạ bị bỏ qua; mã hợp lệ được ghi vào localStorage', () => {
    expect(setLang('xx')).toBe(false);
    expect(getLang()).toBe('vi');
    expect(localStorage.getItem(LANG_KEY)).toBeNull();
    expect(setLang('en')).toBe(true);
    expect(getLang()).toBe('en');
    expect(localStorage.getItem('starlight_lang')).toBe('en');
  });
  it('initLang: mặc định vi, đọc key hợp lệ, bỏ qua key rác', () => {
    expect(initLang()).toBe('vi');
    localStorage.setItem(LANG_KEY, 'en');
    expect(initLang()).toBe('en');
    for (const bad of ['rác', '__proto__', 'constructor', 'toString']) {
      localStorage.setItem(LANG_KEY, bad);
      expect(initLang()).toBe('vi');
      expect(setLang(bad)).toBe(false);
    }
  });
  it('không gọi Math.random', () => {
    const sp = vi.spyOn(Math, 'random');
    t('lang.title'); setLang('en'); initLang(); langs();
    expect(sp).not.toHaveBeenCalled();
    sp.mockRestore();
  });
  it('langs(): vi đứng đầu', () => expect(langs()[0].code).toBe('vi'));
});

describe('money', () => {
  it('theo ngôn ngữ', () => {
    setLang('en'); expect(money(600e6)).toBe('600M'); expect(money(1.5e9)).toBe('1.5B');
    setLang('vi'); expect(money(600e6)).toBe('600 tr');
  });
});

describe('parity locale', () => {
  it('mọi locale có đúng bộ key và placeholder của vi', () => {
    for (const m of langs()) {
      expect(m.code).toBeTruthy();
    }
    for (const L of Object.values(REAL)) {
      const d = diffLocales(viL.dict, L.dict);
      expect(d).toEqual({ missing: [], extra: [], badParams: [] });
    }
  });
  it('diffLocales bắt object thiếu key con (vd fmt.units)', () => {
    const d = diffLocales({ u: { b: 'B', m: 'M', k: 'K' } }, { u: { b: 'B', m: 'M' } });
    expect(d.badParams).toEqual(['u']);
  });
  it('diffLocales bắt thiếu, thừa, lệch placeholder, lệch kiểu', () => {
    const d = diffLocales({ a: '{x}', b: 'b', c: p => p, d: 'd' }, { a: '{y}', c: 'c', e: 'e', d: 'd' });
    expect(d.missing).toEqual(['b']);
    expect(d.extra).toEqual(['e']);
    expect(d.badParams.sort()).toEqual(['a', 'c']);
  });
});

describe('masthead & khung tĩnh', () => {
  beforeEach(() => { document.body.innerHTML = SHELL; seed(42); newGame(); });
  it('renderTop theo ngôn ngữ', () => {
    setLang('en'); renderTop();
    expect(document.getElementById('nextBtn').textContent).toBe('End week 1');
    expect(document.getElementById('yearL').textContent).toBe('Year 1');
    expect(document.getElementById('artN').textContent).toBe('2 artists');
    setLang('vi'); renderTop();
    expect(document.getElementById('nextBtn').textContent).toBe('Kết thúc tuần 1');
  });
  it('applyStatic đổi textContent và aria-label', () => {
    const d = document.createElement('div');
    d.innerHTML = '<small data-i18n="top.fund">x</small><button data-i18n-aria="top.help" aria-label="x"></button>';
    setLang('en'); applyStatic(d);
    expect(d.querySelector('small').textContent).toBe('Company funds');
    expect(d.querySelector('button').getAttribute('aria-label')).toBe('Help');
  });
});

describe('phòng, dock, NPC', () => {
  beforeEach(() => { document.body.innerHTML = SHELL; seed(42); newGame(); });
  it('mọi phòng/NPC có key trong vi', () => {
    for (const r of ROOMS) for (const k of ['name', 'dock', 'desc']) expect(viL.dict[`room.${r.id}.${k}`], r.id + k).toBeTypeOf('string');
    for (const n of NPC) expect(viL.dict[`npc.${n.id}`]).toBeTypeOf('string');
  });
  it('en: dock không còn chữ Phòng; tiêu đề phòng dịch', () => {
    setLang('en'); renderDock();
    expect(document.getElementById('dock').innerHTML).not.toContain('Phòng');
    openRoom('ceo');
    expect(document.querySelector('#sheet h2').textContent).toBe('💼 CEO Office');
    openRoom('sales');
    expect(document.querySelector('#sheet h2').textContent).toBe('💹 Sales Room');
  });
});

describe('nút chung', () => {
  beforeEach(() => { document.body.innerHTML = SHELL; });
  it('en: đóng và chạm lần nữa', () => {
    setLang('en');
    modal('<h2>x</h2>');
    expect(document.querySelector('#sheet .x').getAttribute('aria-label')).toBe('Close');
    const b = document.createElement('button');
    fire(-1, b);
    expect(b.textContent).toBe('Tap again to confirm');
  });
});

describe('tutorial', () => {
  beforeEach(() => { document.body.innerHTML = SHELL; });
  it('mọi bước có key .t/.d trong vi', () => {
    for (const s of TUT) for (const k of ['t', 'd']) expect(viL.dict[`tut.${s.id}.${k}`], s.id).toBeTypeOf('string');
  });
  it('en: tiêu đề và nhắc nút 🌐', () => {
    setLang('en'); tutStart(1);
    expect(document.querySelector('#tut h3').textContent).toBe('Top bar');
    expect(document.querySelector('#tut .small:not(.muted)').innerHTML).toContain('🌐');
    tutEnd();
  });
});

describe('chooseLang', () => {
  beforeEach(() => { document.body.innerHTML = SHELL; seed(42); newGame(); renderTop(); });
  it('đổi tại chỗ, không đụng S, lưu localStorage', () => {
    const snap = JSON.stringify(S);
    chooseLang('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.getElementById('nextBtn').textContent).toBe('End week 1');
    expect(JSON.stringify(S)).toBe(snap);
    expect(localStorage.getItem('starlight_lang')).toBe('en');
    chooseLang('xx');
    expect(getLang()).toBe('en');
    chooseLang('vi'); applyHtmlLang();
  });
  it('sheet đang mở được render lại', () => {
    view(viewLang);
    expect(document.querySelector('#sheet h2').textContent).toContain('Ngôn ngữ');
    chooseLang('en');
    expect(document.querySelector('#sheet h2').textContent).toContain('Language');
    chooseLang('vi');
    expect(document.querySelector('#sheet h2').textContent).toContain('Ngôn ngữ');
  });
});

// Nhãn dữ liệu tra theo id: mỗi bảng nguồn <-> tiền tố key. Key động chỉ được dùng với các tiền tố này (check:i18n không quét được).
const nOf = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.n]));
const LABELS = [
  ['stat', STATS], ['train.n', nOf(TRAIN)], ['genre', nOf(GENRES)], ['concept', nOf(CONCEPTS)], ['offer', nOf(OFFER)],
  ['msk', MSK], ['mskd', MSKD], ['biz', Object.fromEntries(Object.entries(BIZ).map(([k, v]) => [k + '.n', v.n]))],
  ['day', DAYS], ['dayn', DAYN], ['fin.i', FIN_I], ['fin.x', FIN_X], ['dr', DR], ['drt', DRT], ['cft', CFT], ['bud', BUDN],
  ['pre', nOf(PRE)], ['post', nOf(POST)], ['prp', nOf(PRP)],
];
describe('nhãn dữ liệu lbl(ns, id)', () => {
  it.each(LABELS)('%s: đủ key ở mọi ngôn ngữ, vi bằng đúng giá trị trong bảng, en không còn chữ Việt', (ns, tbl) => {
    const keys = Object.keys(tbl);
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      expect(`${ns}.${k}` in viL.dict, `${ns}.${k} thiếu ở vi`).toBe(true);
      expect(`${ns}.${k}` in enL.dict, `${ns}.${k} thiếu ở en`).toBe(true);
      setLang('vi'); expect(lbl(ns, k), `${ns}.${k}`).toBe(tbl[k]);
      setLang('en'); expect(lbl(ns, k)).not.toMatch(/[À-ỹĐđ]/);
    }
    setLang('vi');
  });
});
describe('mô tả hoạt động teaser pre.d.*', () => {
  it('mọi hoạt động trước comeback có mô tả ở mọi ngôn ngữ, en không còn chữ Việt', () => {
    for (const id of Object.keys(PRE)) {
      expect(`pre.d.${id}` in viL.dict, `pre.d.${id} thiếu ở vi`).toBe(true);
      expect(enL.dict[`pre.d.${id}`], `pre.d.${id} thiếu ở en`).toBeTruthy();
      setLang('en'); expect(lbl('pre', `d.${id}`)).not.toMatch(/[À-ỹĐđ]/);
    }
    setLang('vi');
  });
});
describe('từ vựng chung và số nhiều (unit.*)', () => {
  it('unit.weeks/days/people: vi giữ nguyên, en số ít/số nhiều', () => {
    setLang('vi');
    expect([t('unit.weeks', { n: 1 }), t('unit.weeks', { n: 3 }), t('unit.days', { n: 2 }), t('unit.people', { n: 5 })]).toEqual(['1 tuần', '3 tuần', '2 ngày', '5 người']);
    setLang('en');
    expect([1, 2].map(n => t('unit.weeks', { n }))).toEqual(['1 week', '2 weeks']);
    expect([1, 2].map(n => t('unit.days', { n }))).toEqual(['1 day', '2 days']);
    expect([1, 2].map(n => t('unit.people', { n }))).toEqual(['1 person', '2 people']);
    expect(t('unit.perWeek', { m: '5M' })).toBe('5M/week');
    expect(t('list.sep') + t('list.and')).toBe(', ' + ' and ');
    expect(t('common.refuse')).toBe('Decline');
    setLang('vi');
  });
  it('mọi key common.*/unit.*/list.* ở en không chứa chữ Việt', () => {
    for (const [k, v] of Object.entries(enL.dict)) if (/^(common|unit|list)\./.test(k)) expect(typeof v === 'function' ? v({ n: 2 }) : v).not.toMatch(/[À-ỹĐđ]/);
  });
});
