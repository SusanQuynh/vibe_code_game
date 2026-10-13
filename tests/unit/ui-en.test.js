// @vitest-environment jsdom
// Leftover-Vietnamese guard for lang=en. EN_DONE grows with each area task; task 14 asserts it covers every surface.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { noToggle } from './helpers.js';
import { setLang } from '../../src/i18n/index.js';
import { richState, renderSurface, runToasts, visibleText, offenders } from './sim.js';
import { S, setState } from '../../src/state.js';

noToggle();
export const EN_DONE = ['lang', 'vocal', 'dance', 'roof', 'top', 'early-vocal', 'early-dance', 'early-roof', 'lobby', 'debutQ', 'early-lobby', 'mgr', 'early-mgr', 'artist-trainee', 'artist-debuted', 'artist-actor', 'pa', 'dorm', 'early-dorm'];
export const TOASTS_DONE = ['debut.group1', 'debut.solo2', 'debut.money', 'debut.busy', 'debut.name', 'recruit.recHire', 'recruit.recHireMax', 'contests.enterComp', 'batches.batchSched', 'managers.hireMgr', 'managers.retrain', 'managers.assignGM', 'managers.assignDom', 'gm.promoteGM', 'releases.doLiveMoney', 'releases.doLiveTwice', 'releases.doFM', 'ext3.paRe'];

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
  });
  it('toasts', () => {
    setLang('en');
    const res = runToasts(base);
    for (const n of TOASTS_DONE) expect(offenders(res[n] || '', base), n).toEqual([]);
  });
});
