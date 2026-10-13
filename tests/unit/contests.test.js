// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, abs, uid, newGame } from '../../src/state.js';
import { enterComp, compDone, compBonus, kindOf } from '../../src/systems/contests.js';
import { viewArtist } from '../../src/ui/views.js';

noToggle();

beforeEach(() => {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seed(42);
});

const mkComp = (o = {}) => ({ id: uid(), n: 'Test', ic: '🎙️', w: { vocal: 1 }, t: [1, 2], lvl: 30, wk: 1, fee: 3e6, prize: [50e6, 20e6, 10e6], exp: abs() + 3, ...o });
const check = (c, ids) => {
  document.body.insertAdjacentHTML('beforeend', ids.map(i => `<input type="checkbox" class="cp${c.id}" value="${i}" checked>`).join(''));
};

describe('contests', () => {
  it('newGame tạo 2 cuộc thi không có k, kindOf là tts', () => {
    newGame();
    expect(S.comps).toHaveLength(2);
    expect(S.comps.every(c => c.k === undefined && kindOf(c) === 'tts')).toBe(true);
  });
  it('compDone xác định (seed 5)', () => {
    newGame();
    const [x] = S.artists, c = mkComp({ lvl: -50 });
    S.comps.push(c);
    check(c, [x.id]);
    enterComp(c.id);
    expect(x.busy.kind).toBe('comp');
    seed(5);
    const m0 = S.money, st0 = { ...x.st }, f0 = x.fans;
    compDone(x, x.busy);
    // values recorded from the pre-refactor engine (same RNG draw order)
    expect(S.money - m0).toBe(EXPECT.money);
    expect(x.fans - f0).toBe(EXPECT.fans);
    expect(x.lessons[0].s).toBe(EXPECT.ls);
    expect(x.hist[0]).toBe(EXPECT.h + ' · 🏅 Vocal +3');
    expect(S.log.some(l => l.t.includes('Thưởng chỉ số mỗi người: Vocal +3'))).toBe(true); expect(+(x.st.vocal - EXPECT.vocal).toFixed(1)).toBe(3); // rank-1 bonus only: delta asserted, RNG unchanged
    expect(x.lessons[0].b).toBe('Vocal +3');
  });
  it('enterComp từ chối TTS đang chừa lịch debut', () => {
    newGame();
    const [x] = S.artists, c = mkComp({ t: [1, 1] });
    S.comps.push(c);
    x.dReady = true;
    check(c, [x.id]);
    const m = S.money;
    enterComp(c.id);
    expect(x.busy).toBeFalsy();
    expect(S.money).toBe(m);
  });
  it('enterComp từ chối khi vướng kế hoạch comeback', () => {
    newGame();
    const [x] = S.artists, c = mkComp({ t: [1, 1], wk: 2 });
    S.comps.push(c);
    x.status = 'debuted'; x.solo = true;
    S.cbPlan = [{ k: 's' + x.id, w: abs() + 1 }];
    check(c, [x.id]);
    enterComp(c.id);
    expect(x.busy).toBeFalsy();
  });
});
const EXPECT = { money: 50e6, fans: 6623, ls: 'Vocal +3.7', h: 'N1: Cuộc thi «Test» – hạng 1', vocal: 12.7 };

describe('compBonus', () => {
  it('thưởng theo hạng và trọng số, không đổi khi hạng > 3', () => {
    newGame();
    const [a] = S.artists, c = mkComp({ w: { dance: .8, vocal: .4 } });
    const d0 = a.st.dance, v0 = a.st.vocal;
    expect(compBonus(a, c, 1)).toBe('Nhảy +2.4, Vocal +1.2');
    expect(+(a.st.dance - d0).toFixed(1)).toBe(2.4);
    expect(+(a.st.vocal - v0).toFixed(1)).toBe(1.2);
    const s1 = { ...a.st };
    expect(compBonus(a, c, 4)).toBe('');
    expect(a.st).toEqual(s1);
  });
  it('kẹp ở 100', () => {
    newGame();
    const [a] = S.artists;
    a.st.vocal = 99.5;
    compBonus(a, mkComp(), 1);
    expect(a.st.vocal).toBe(100);
  });
  it('viewArtist hiện 🏅 cho bài học có b', () => {
    newGame();
    const [a] = S.artists;
    a.lessons.unshift({ t: 'Cuộc thi', l: 'x', s: 'Vocal +1', y: 1, b: 'Vocal +3' });
    viewArtist(a.id);
    expect(document.getElementById('sheet').innerHTML).toContain('🏅 Vocal +3');
  });
});
