// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { t, setLang, getLang, initLang, langs, LANG_KEY, __setDicts } from '../../src/i18n/index.js';
import { diffLocales } from '../../src/i18n/check.js';
import viL from '../../src/i18n/locales/vi.js';
import enL from '../../src/i18n/locales/en.js';

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
    localStorage.setItem(LANG_KEY, 'rác');
    expect(initLang()).toBe('vi');
  });
  it('không gọi Math.random', () => {
    const sp = vi.spyOn(Math, 'random');
    t('lang.title'); setLang('en'); initLang(); langs();
    expect(sp).not.toHaveBeenCalled();
    sp.mockRestore();
  });
  it('langs(): vi đứng đầu', () => expect(langs()[0].code).toBe('vi'));
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
  it('diffLocales bắt thiếu, thừa, lệch placeholder, lệch kiểu', () => {
    const d = diffLocales({ a: '{x}', b: 'b', c: p => p, d: 'd' }, { a: '{y}', c: 'c', e: 'e', d: 'd' });
    expect(d.missing).toEqual(['b']);
    expect(d.extra).toEqual(['e']);
    expect(d.badParams.sort()).toEqual(['a', 'c']);
  });
});
