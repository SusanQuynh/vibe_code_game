// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { noToggle, seed, SHELL, viT } from './helpers.js';
import { S, newGame } from '../../src/state.js';
import { genArtist, sign } from '../../src/systems/artists.js';
import { bMem } from '../../src/systems/batches.js';
import { REC0, est, recCap, recEnsure, recHire, recHunt, recSet, recSignSug, recruitTick } from '../../src/systems/recruit.js';
import { stSum } from '../../src/systems/review.js';
import { nextWeek, weekCost } from '../../src/systems/week.js';
import { openRoom } from '../../src/ui/rooms.js';

noToggle();

beforeEach(() => {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seed(42);
});

// give the company one recruiter directly (bypasses the hunt RNG)
const staff = (eye, mode, extra = {}) => {
  const r = recEnsure();
  r.staff.push({ id: 9000 + r.staff.length, name: 'Test NV', eye, fee: eye * 4e6, sal: 2e6 + eye * .5e6 });
  Object.assign(r, { mode }, extra);
  return r;
};
const fillPool = n => { S.pool = []; for (let i = 0; i < n; i++) S.pool.push(genArtist()); };

describe('nhân viên tuyển dụng', () => {
  it('newGame + 5 tuần: S.rec không tồn tại, weekCost không tính lương tuyển dụng', () => {
    newGame();
    const base = S.artists.reduce((s, a) => s + a.salary, 0);
    expect(weekCost()).toBeGreaterThanOrEqual(base);
    for (let i = 0; i < 5; i++) nextWeek(true, true);
    expect(S.rec).toBeUndefined();
    expect(JSON.stringify(S)).not.toContain('"rec"');
    expect(REC0.staff).toEqual([]);
    const c = weekCost();
    staff(4, 'off');
    expect(weekCost()).toBe(c + 2e6 + 4 * .5e6);
  });
  it('est: mắt nhìn thấp xếp theo tổng chỉ số, mắt nhìn cao ưu tiên tố chất', () => {
    newGame();
    const a = genArtist(), b = genArtist();
    for (const k in a.st) { a.st[k] = 40; b.st[k] = 36; }
    a.talent = .8; b.talent = 1.2;
    expect(stSum(a)).toBeGreaterThan(stSum(b));
    expect(est(a, 1)).toBeGreaterThan(est(b, 1));
    expect(est(b, 10)).toBeGreaterThan(est(a, 10));
  });
  it('auto: đủ quota thì mở lứa mới ngay, ký tiếp vào lứa mới, trừ tiền và ghi log', () => {
    newGame();
    S.artists.forEach(a => { a.batch = S.curBatch; });
    S.artists.length = 1;                       // current batch has 1 trainee
    fillPool(4);
    staff(10, 'auto', { quota: 2, reserve: 0 });
    expect(recCap()).toBe(3);
    S.money = 1000e6;
    const b1 = S.curBatch, n0 = S.batches.length, m0 = S.money;
    recruitTick();
    const first = S.batches.find(b => b.id === b1);
    expect(bMem(first)).toHaveLength(2);
    expect(S.batches.length).toBeGreaterThan(n0);
    expect(S.curBatch).not.toBe(b1);
    const second = S.batches.find(b => b.id !== b1 && bMem(b).length);
    expect(bMem(second)).toHaveLength(2);
    expect(S.pool).toHaveLength(1);
    expect(S.money).toBe(m0 - 3 * 20e6 - (2e6 + 10 * .5e6));
    expect(S.log.filter(l => viT(l.t).includes('NV tuyển dụng Test NV ký')).length).toBe(3);
    expect(S.rec.log.length).toBeGreaterThan(0);
  });
  it('dự trữ: tiền = dự trữ + 25 tr (+ lương) chỉ ký đúng một người', () => {
    newGame();
    fillPool(4);
    staff(10, 'auto', { quota: 12, reserve: 100e6 });
    const n0 = S.artists.length;
    S.money = 100e6 + 25e6 + (2e6 + 5e6);
    recruitTick();
    expect(S.artists.length).toBe(n0 + 1);
    expect(S.pool).toHaveLength(3);
  });
  it('suggest: không ký ai, S.rec.sug là top-cap theo est', () => {
    newGame();
    fillPool(6);
    staff(8, 'suggest');
    const n0 = S.artists.length, cap = recCap();
    recruitTick();
    expect(S.artists.length).toBe(n0);
    const exp = S.pool.slice().sort((x, y) => est(y, 8) - est(x, 8)).slice(0, cap).map(a => a.id);
    expect(S.rec.sug).toEqual(exp);
    S.money = 500e6;
    recSignSug();
    expect(S.artists.length).toBe(n0 + cap);
    expect(S.rec.sug).toEqual([]);
  });
  it('tìm ứng viên: lần đầu miễn phí, lần sau 5 tr; tuyển tối đa 2', () => {
    newGame();
    const m0 = S.money;
    recHunt();
    expect(S.money).toBe(m0);
    expect(S.rec.cand).toHaveLength(3);
    recHunt();
    expect(S.money).toBe(m0 - 5e6);
    S.money = 1000e6;
    for (let i = 0; i < 3; i++) { const c = S.rec.cand[0]; if (c) recHire(c.id); recHunt(); }
    expect(S.rec.staff.length).toBe(2);
    recSet('mode', 'auto'); recSet('quota', 20); recSet('reserve', 200);
    expect(S.rec.mode).toBe('auto');
    expect(S.rec.quota).toBe(5);
    expect(S.rec.reserve).toBe(200e6);
  });
  it('sàn Sảnh: render hiện khu nhân viên tuyển dụng và badge đề xuất', () => {
    newGame();
    staff(6, 'suggest');
    recruitTick();
    openRoom('lobby');
    const h = document.getElementById('sheet').innerHTML;
    expect(h).toContain('Nhân viên tuyển dụng (1/2)');
    expect(h).toContain('NV đề xuất');
    expect(h).toContain('Ký các đề xuất');
  });
  it('sign(id) của người chơi giữ nguyên log và tiền', () => {
    newGame();
    const a = S.pool[0], m0 = S.money, bn = S.batches.find(b => b.id === S.curBatch).n;
    sign(a.id);
    expect(S.money).toBe(m0 - 20e6);
    expect(S.log.some(l => viT(l.t) === `✍️ Ký hợp đồng thực tập sinh ${a.name} vào ${viT(bn)}.`)).toBe(true);
    expect(S.artists.includes(a)).toBe(true);
  });
  it('nextWeek gọi recruitTick: tự ký và trả lương', () => {
    newGame();
    staff(6, 'auto', { quota: 3, reserve: 0 });
    S.money = 900e6;
    const n0 = S.artists.length;
    nextWeek(true, true);
    expect(S.artists.length).toBeGreaterThan(n0);
    expect(S.log.some(l => viT(l.t).includes('NV tuyển dụng Test NV ký thực tập sinh'))).toBe(true);
  });
});
