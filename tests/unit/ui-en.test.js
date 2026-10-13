// @vitest-environment jsdom
// Leftover-Vietnamese guard for lang=en. EN_DONE grows with each area task; task 14 asserts it covers every surface.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { noToggle } from './helpers.js';
import { setLang } from '../../src/i18n/index.js';
import { richState, renderSurface, runToasts, visibleText, offenders, SURFACES, TOAST_CASES, skipped } from './sim.js';
import { ROOMS } from '../../src/data/rules.js';
import { applyHtmlLang } from '../../src/ui/lang.js';
import { S, setState } from '../../src/state.js';

noToggle();
export const EN_DONE = ['lang', 'vocal', 'dance', 'roof', 'top', 'early-vocal', 'early-dance', 'early-roof', 'lobby', 'debutQ', 'early-lobby', 'mgr', 'early-mgr', 'artist-trainee', 'artist-debuted', 'artist-actor', 'pa', 'dorm', 'early-dorm', 'report', ...[0, 1, 2, 3, 4, 5, 6, 7].map(d => 'reportFull-' + d), 'plan', 'award', 'skipWarn', 'studio', 'acting', 'songs', 'song', 'camp', 'early-studio', 'early-acting', 'sales', 'hr', 'gym', 'renew', 'early-sales', 'early-hr', 'early-gym', 'market', 'invest', 'ceo', 'pr', 'inv', 'early-market', 'early-invest', 'early-ceo', 'early-pr', 'meet', 'props', 'sec', 'early-meet', 'events', 'save'];
export const TOASTS_DONE = ['debut.group1', 'debut.solo2', 'debut.money', 'debut.busy', 'debut.name', 'recruit.recHire', 'recruit.recHireMax', 'contests.enterComp', 'batches.batchSched', 'managers.hireMgr', 'managers.retrain', 'managers.assignGM', 'managers.assignDom', 'gm.promoteGM', 'releases.doLiveMoney', 'releases.doLiveTwice', 'releases.doFM', 'ext3.paRe', 'releases.releaseSingle', 'releases.holdConcert', 'releases.produceFilm', 'ext2.writeSong', 'promo.preDo', 'promo.postDo', 'ext2.renewDo', 'ext3.hsHire', 'events.invOpen', 'review.prDo', 'market.buyBiz', 'market.raiseBiz', 'offers.acceptSel', 'offers.investOffer', 'artists.sign', 'artists.recast', 'saveView.saveCopyCode'];

let base, early;
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1790000000000);
  base = richState();
  early = richState(42, 0);
}, 120000);
afterEach(() => setLang('vi'));

describe('offenders()', () => {
  it('flags Vietnamese words and ignores stored names', () => {
    setState(structuredClone(base));
    expect(offenders('Tuần 3 · Not enough money', S)).toEqual(['Tuần']);
    expect(offenders(`Sign ${S.artists[0].name}`, S)).toEqual([]);
    expect(offenders('Cost 10 tr, TTS Q1', S)).toEqual(['tr', 'TTS']);
  });
});

describe('en render has no Vietnamese', () => {
  it.each(EN_DONE)('%s', name => {
    setLang('en');
    const early_ = name.startsWith('early-');
    const base_ = early_ ? early : base;
    const html = renderSurface(early_ ? name.slice(6) : name, base_);
    if (html == null) return;
    let root = document.getElementById('sheet');
    if (name === 'top' || name === 'early-top') { root = document.body.cloneNode(true); root.querySelector('#log')?.remove(); } // the log is stored text
    const off = offenders(visibleText(root), S);
    expect(off, `${name}: ${off.join(', ')}`).toEqual([]);
    if (name !== 'top' && name !== 'early-top') for (const b of root.querySelectorAll('.x')) expect(b.getAttribute('aria-label'), `${name}: close button`).toBe('Close');
  });
  it('toasts', () => {
    setLang('en');
    const res = runToasts(base);
    for (const n of TOASTS_DONE) expect(offenders(res[n] || '', base), n).toEqual([]);
  });
});

describe('coverage is complete', () => {
  it('EN_DONE lists every surface and every early room', () => {
    const want = new Set([...SURFACES.map(x => x.name), ...ROOMS.map(r => 'early-' + r.id)]);
    expect(new Set(EN_DONE)).toEqual(want);
    expect(EN_DONE.length).toBe(want.size);
  });
  it('TOASTS_DONE lists every toast case', () => {
    expect(new Set(TOASTS_DONE)).toEqual(new Set(TOAST_CASES.map(c => c.name)));
  });
  it('no surface is skipped in the rich or the early state', () => {
    skipped.length = 0;
    for (const x of SURFACES) renderSurface(x.name, base);
    for (const r of ROOMS) renderSurface(r.id, early);
    expect(skipped).toEqual([]);
  });
  it('<html lang> follows the language', () => {
    setLang('en'); applyHtmlLang();
    expect(document.documentElement.lang).toBe('en');
    setLang('vi'); applyHtmlLang();
    expect(document.documentElement.lang).toBe('vi');
  });
});
