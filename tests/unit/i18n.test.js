// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { t, money, setLang, getLang, initLang, langs, LANG_KEY, __setDicts } from '../../src/i18n/index.js';
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

noToggle();
const REAL = { vi: viL, en: enL };
beforeEach(() => localStorage.clear());
afterEach(() => { __setDicts(REAL); setLang('vi'); });

describe('i18n core', () => {
  it('a missing key returns the key itself', () => expect(t('x.missing')).toBe('x.missing'));
  it('replaces placeholders, keeps them when a parameter is missing', () => {
    expect(t('lang.current', { name: 'X' })).toBe('Đang dùng: X');
    expect(t('lang.current', {})).toBe('Đang dùng: {name}');
    expect(t('lang.current')).toBe('Đang dùng: {name}');
  });
  it('falls back to vi when the current locale lacks a key; function values are called', () => {
    __setDicts({
      vi: { meta: { code: 'vi' }, dict: { a: 'A-vi', b: p => `b${p.n}` } },
      zz: { meta: { code: 'zz' }, dict: { b: p => `zz${p.n}` } },
    });
    setLang('zz');
    expect(t('a')).toBe('A-vi');
    expect(t('b', { n: 1 })).toBe('zz1');
  });
  it('setLang: unknown codes are ignored; valid codes are written to localStorage', () => {
    expect(setLang('xx')).toBe(false);
    expect(getLang()).toBe('vi');
    expect(localStorage.getItem(LANG_KEY)).toBeNull();
    expect(setLang('en')).toBe(true);
    expect(getLang()).toBe('en');
    expect(localStorage.getItem('starlight_lang')).toBe('en');
  });
  it('initLang: defaults to vi, reads a valid key, ignores junk', () => {
    expect(initLang()).toBe('vi');
    localStorage.setItem(LANG_KEY, 'en');
    expect(initLang()).toBe('en');
    for (const bad of ['rác', '__proto__', 'constructor', 'toString']) {
      localStorage.setItem(LANG_KEY, bad);
      expect(initLang()).toBe('vi');
      expect(setLang(bad)).toBe(false);
    }
  });
  it('does not call Math.random', () => {
    const sp = vi.spyOn(Math, 'random');
    t('lang.title'); setLang('en'); initLang(); langs();
    expect(sp).not.toHaveBeenCalled();
    sp.mockRestore();
  });
  it('langs(): vi comes first', () => expect(langs()[0].code).toBe('vi'));
});

describe('money', () => {
  it('follows the language', () => {
    setLang('en'); expect(money(600e6)).toBe('600M'); expect(money(1.5e9)).toBe('1.5B');
    setLang('vi'); expect(money(600e6)).toBe('600 tr');
  });
});

describe('parity locale', () => {
  it('every locale has exactly the keys and placeholders of vi', () => {
    for (const m of langs()) {
      expect(m.code).toBeTruthy();
    }
    for (const L of Object.values(REAL)) {
      const d = diffLocales(viL.dict, L.dict);
      expect(d).toEqual({ missing: [], extra: [], badParams: [] });
    }
  });
  it('diffLocales catches objects missing child keys (e.g. fmt.units)', () => {
    const d = diffLocales({ u: { b: 'B', m: 'M', k: 'K' } }, { u: { b: 'B', m: 'M' } });
    expect(d.badParams).toEqual(['u']);
  });
  it('diffLocales catches missing, extra, placeholder and type mismatches', () => {
    const d = diffLocales({ a: '{x}', b: 'b', c: p => p, d: 'd' }, { a: '{y}', c: 'c', e: 'e', d: 'd' });
    expect(d.missing).toEqual(['b']);
    expect(d.extra).toEqual(['e']);
    expect(d.badParams.sort()).toEqual(['a', 'c']);
  });
});

describe('masthead & static shell', () => {
  beforeEach(() => { document.body.innerHTML = SHELL; seed(42); newGame(); });
  it('renderTop follows the language', () => {
    setLang('en'); renderTop();
    expect(document.getElementById('nextBtn').textContent).toBe('End week 1');
    expect(document.getElementById('yearL').textContent).toBe('Year 1');
    expect(document.getElementById('artN').textContent).toBe('2 artists');
    setLang('vi'); renderTop();
    expect(document.getElementById('nextBtn').textContent).toBe('Kết thúc tuần 1');
  });
  it('applyStatic updates textContent and aria-label', () => {
    const d = document.createElement('div');
    d.innerHTML = '<small data-i18n="top.fund">x</small><button data-i18n-aria="top.help" aria-label="x"></button>';
    setLang('en'); applyStatic(d);
    expect(d.querySelector('small').textContent).toBe('Company funds');
    expect(d.querySelector('button').getAttribute('aria-label')).toBe('Help');
  });
});

describe('rooms, dock, NPCs', () => {
  beforeEach(() => { document.body.innerHTML = SHELL; seed(42); newGame(); });
  it('every room/NPC has a key in vi', () => {
    for (const r of ROOMS) for (const k of ['name', 'dock', 'desc']) expect(viL.dict[`room.${r.id}.${k}`], r.id + k).toBeTypeOf('string');
    for (const n of NPC) expect(viL.dict[`npc.${n.id}`]).toBeTypeOf('string');
  });
  it('en: dock no longer says Phòng; room titles are translated', () => {
    setLang('en'); renderDock();
    expect(document.getElementById('dock').innerHTML).not.toContain('Phòng');
    openRoom('ceo');
    expect(document.querySelector('#sheet h2').textContent).toBe('💼 CEO Office');
    openRoom('sales');
    expect(document.querySelector('#sheet h2').textContent).toBe('💹 Sales Room');
  });
});

describe('common buttons', () => {
  beforeEach(() => { document.body.innerHTML = SHELL; });
  it('en: close and tap again', () => {
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
  it('every step has .t/.d keys in vi', () => {
    for (const s of TUT) for (const k of ['t', 'd']) expect(viL.dict[`tut.${s.id}.${k}`], s.id).toBeTypeOf('string');
  });
  it('en: titles and mention of the 🌐 button', () => {
    setLang('en'); tutStart(1);
    expect(document.querySelector('#tut h3').textContent).toBe('Top bar');
    expect(document.querySelector('#tut .small:not(.muted)').innerHTML).toContain('🌐');
    tutEnd();
  });
});

describe('chooseLang', () => {
  beforeEach(() => { document.body.innerHTML = SHELL; seed(42); newGame(); renderTop(); });
  it('switches in place, leaves S untouched, persists to localStorage', () => {
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
  it('re-renders the open sheet', () => {
    view(viewLang);
    expect(document.querySelector('#sheet h2').textContent).toContain('Ngôn ngữ');
    chooseLang('en');
    expect(document.querySelector('#sheet h2').textContent).toContain('Language');
    chooseLang('vi');
    expect(document.querySelector('#sheet h2').textContent).toContain('Ngôn ngữ');
  });
});
