// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { noToggle, seed, SHELL, viT } from './helpers.js';
import { S, abs, uid, newGame } from '../../src/state.js';
import { fame } from '../../src/systems/artists.js';
import { enterComp, compDone, compBonus, compTick, kindOf } from '../../src/systems/contests.js';
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
    x.st.vocal = 9; // pin: newGame's artist stats shift whenever generation RNG changes
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
    expect(viT(x.lessons[0].s)).toBe(EXPECT.ls);
    expect(viT(x.hist[0])).toBe(EXPECT.h + ' · 🏅 Vocal +3');
    expect(S.log.some(l => viT(l.t).includes('Thưởng chỉ số mỗi người: Vocal +3'))).toBe(true); expect(+(x.st.vocal - EXPECT.vocal).toFixed(1)).toBe(3); // rank-1 bonus only: delta asserted, RNG unchanged
    expect(viT(x.lessons[0].b)).toBe('Vocal +3');
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
    expect(viT(compBonus(a, c, 1))).toBe('Nhảy +2.4, Vocal +1.2');
    expect(+(a.st.dance - d0).toFixed(1)).toBe(2.4);
    expect(+(a.st.vocal - v0).toFixed(1)).toBe(1.2);
    const s1 = { ...a.st };
    expect(viT(compBonus(a, c, 4))).toBe('');
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

describe('cuộc thi nghệ sĩ đã debut', () => {
  const debutSolo = a => { a.status = 'debuted'; a.solo = true; };
  it('không có nghệ sĩ debut thì compTick không tạo cuộc thi khác tts', () => {
    newGame();
    for (let i = 0; i < 20; i++) { S.week++; compTick(); }
    expect(S.comps.every(c => kindOf(c) === 'tts')).toBe(true);
  });
  it('có solo debut thì tạo solo, không tạo grp khi chưa có nhóm', () => {
    newGame();
    debutSolo(S.artists[0]);
    for (let i = 0; i < 30; i++) { S.week++; compTick(); }
    const d = S.comps.filter(c => kindOf(c) !== 'tts');
    expect(d.length).toBeGreaterThan(0);
    expect(d.every(c => kindOf(c) === 'solo')).toBe(true);
  });
  const mkGroup = () => {
    newGame();
    const [x, y] = S.artists;
    [x, y].forEach(a => { a.status = 'debuted'; a.fans = 90000; });
    const g = { id: uid(), name: 'Sao Mai', members: [x.id, y.id], y: 1, concept: 'bright' };
    S.groups.push(g);
    return { x, y, g };
  };
  it('enterComp nhóm bị từ chối khi một thành viên bận, thành công khi cả nhóm rảnh', () => {
    const { x, y, g } = mkGroup();
    const c = mkComp({ k: 'grp', t: [2, 9], lvl: 40, fee: 10e6 });
    S.comps.push(c);
    check(c, [g.id]);
    x.busy = { kind: 'promo', title: 'x', left: 1, total: 1 };
    const m = S.money;
    enterComp(c.id);
    expect(S.money).toBe(m);
    expect(y.busy).toBeFalsy();
    x.busy = null;
    enterComp(c.id);
    expect(x.busy.kind).toBe('comp');
    expect(y.busy.run).toBe(x.busy.run);
    expect(S.compRuns.at(-1).g).toBe(g.id);
    expect(S.money).toBe(m - 10e6);
  });
  it('compDone debut: thưởng nhân run.pm, fan nhân danh tiếng, có thưởng chỉ số', () => {
    const { x, y, g } = mkGroup();
    const c = mkComp({ k: 'grp', t: [2, 9], lvl: -500, fee: 0, w: { vocal: 1 } });
    S.comps.push(c);
    check(c, [g.id]);
    enterComp(c.id);
    const run = S.compRuns.at(-1), pm = run.pm;
    expect(pm).toBeCloseTo(1 + fame(x) / 60, 5);
    const m0 = S.money, f0 = x.fans, v0 = x.st.vocal;
    seed(9);
    compDone(x, x.busy);
    expect(run.res.rank).toBe(1);
    expect(S.money - m0).toBe(Math.round(50e6 * pm / 1e6) * 1e6);
    // same R draw with the tts multiplier (1) would give fg/mult; fame 95+ -> mult > 5
    const mult = 2 + fame(x) / 25;
    expect(x.fans - f0).toBeGreaterThanOrEqual(Math.round(3000 * mult));
    expect(x.fans - f0).toBeLessThanOrEqual(Math.round(7000 * mult));
    expect(x.st.vocal).toBeGreaterThan(v0 + 3);
    expect(viT(x.lessons[0].b)).toBe('Vocal +3');
    expect(viT(S.log[0].t)).toContain('Nhóm Sao Mai');
  });
});
