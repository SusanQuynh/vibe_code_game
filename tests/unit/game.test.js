// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import { seed, SHELL } from './helpers.js';
import { S, setState, abs, addLog, uid, newGame, byId } from '../../src/state.js';
import { genArtist, fit, fame } from '../../src/systems/artists.js';
import { STATS } from '../../src/data/rules.js';
import { weekCost, nextWeek, trainDays } from '../../src/systems/week.js';
import { save, load, KEY, replaceSave, setSavedHook } from '../../src/save/storage.js';
import { TRAIN_COST } from '../../src/data/rules.js';

beforeEach(() => {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seed(42);
});

describe('state', () => {
  it('abs() đếm tuần từ đầu game', () => {
    setState({ year: 2, week: 3, log: [], nid: 1, artists: [] });
    expect(abs()).toBe(55);
  });
  it('addLog thêm vào đầu và cắt ở 80', () => {
    setState({ year: 1, week: 1, log: [], nid: 1, artists: [] });
    for (let i = 0; i < 100; i++) addLog('m' + i);
    expect(S.log).toHaveLength(80);
    expect(S.log[0].t).toBe('m99');
    expect(S.log[0].w).toBe('N1·T1');
  });
  it('uid tăng dần', () => {
    setState({ nid: 7 });
    expect([uid(), uid()]).toEqual([7, 8]);
  });
  it('newGame: 600 triệu, 2 thực tập sinh, pool 4', () => {
    newGame();
    expect(S.money).toBe(600e6);
    expect(S.artists).toHaveLength(2);
    expect(S.artists.every(a => a.status === 'trainee')).toBe(true);
    expect(S.pool).toHaveLength(4);
    expect(byId(S.artists[0].id)).toBe(S.artists[0]);
  });
});

describe('artists', () => {
  it('genArtist: chỉ số, tố chất, tên hợp lệ', () => {
    newGame();
    for (let i = 0; i < 60; i++) {
      const a = genArtist();
      for (const k in STATS) { expect(a.st[k]).toBeGreaterThanOrEqual(3); expect(a.st[k]).toBeLessThanOrEqual(68); }
      expect(a.talent).toBeGreaterThanOrEqual(0.75);
      expect(a.talent).toBeLessThanOrEqual(1.25);
      expect(a.name).toBeTruthy();
    }
  });
  it('fit = trung bình có trọng số', () => {
    const a = { st: { vocal: 10, dance: 30 } };
    expect(fit(a, { vocal: 1, dance: 1 })).toBe(20);
    expect(fit(a, { vocal: 3, dance: 1 })).toBe(15);
    expect(fit(a, {})).toBe(0);
  });
  it('fame = sqrt(fans/100), tối đa 100', () => {
    expect(fame({ fans: 10000 })).toBe(10);
    expect(fame({ fans: 1e9 })).toBe(100);
  });
});

describe('tuần', () => {
  it('weekCost = lương nghệ sĩ + tiền tập + quản lý + trợ lý', () => {
    newGame();
    const train = S.artists.reduce((s, a) => s + (a.busy ? 0 : trainDays(a) * TRAIN_COST / 5), 0);
    expect(weekCost()).toBe(S.artists.reduce((s, a) => s + a.salary, 0) + train + S.managers.reduce((s, m) => s + m.salary, 0) + (S.assts || []).reduce((s, x) => s + x.sal, 0));
    // lương PA & chuyên gia (lớp vá v3 đã gộp vào hàm gốc)
    const base = weekCost();
    S.artists[0].pa = { sal: 5e6 };
    expect(weekCost()).toBe(base + 5e6);
    S.hs = { sal: 2e6 };
    expect(weekCost()).toBe(base + 7e6);
  });
  it('nextWeek(true,true): tuần +1, qua tuần 52 thì sang năm mới', () => {
    newGame();
    const w = S.week;
    nextWeek(true, true);
    expect(S.week).toBe(w + 1);
    S.week = 52;
    nextWeek(true, true);
    expect(S.week).toBe(1);
    expect(S.year).toBe(2);
  });
  it('tất định: cùng seed → cùng state sau 10 tuần', () => {
    const run = () => { seed(11); newGame(); for (let i = 0; i < 10; i++) nextWeek(true, true); return JSON.stringify(S); };
    expect(run()).toBe(run());
  });
});

describe('lưu / tải', () => {
  it('save báo trạng thái qua hook thay vì chạm DOM', () => {
    newGame();
    const seen = [];
    setSavedHook((ok) => seen.push(ok));
    expect(save()).toBe(true);
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('quota'); };
    expect(save()).toBe(false);
    Storage.prototype.setItem = orig;
    expect(seen).toEqual([true, false]);
    setSavedHook(() => {});
  });
  it('replaceSave nạp state khác qua load() và từ chối dữ liệu hỏng', () => {
    newGame(); nextWeek(true, true);
    const d = JSON.parse(JSON.stringify(S)); d.money = 123e6;
    newGame();
    expect(replaceSave(d)).toBe(true);
    expect(S.money).toBe(123e6);
    expect(replaceSave({ foo: 1 })).toBe(false);
  });
  it('save → load round-trip', () => {
    newGame(); nextWeek(true, true);
    const snap = JSON.stringify(S);
    save();
    setState(null);
    expect(load()).toBe(true);
    expect(S.week).toBe(JSON.parse(snap).week);
    expect(S.artists).toHaveLength(JSON.parse(snap).artists.length);
  });
  it('load trả false khi chưa có save hoặc save hỏng', () => {
    expect(load()).toBe(false);
    localStorage.setItem(KEY, '{not json');
    expect(load()).toBe(false);
    localStorage.setItem(KEY, JSON.stringify({ foo: 1 }));
    expect(load()).toBe(false);
  });
  it('migration: save v1 (thiếu managers, songs, days…) được bù đủ và chơi tiếp được', () => {
    const old = fs.readFileSync('tests/fixtures/save-v1.json', 'utf8');
    expect(JSON.parse(old).managers).toBeUndefined();
    localStorage.setItem(KEY, old);
    expect(load()).toBe(true);
    expect(Array.isArray(S.managers)).toBe(true);
    expect(Array.isArray(S.mgrPool)).toBe(true);
    expect(S.artists.every(a => Array.isArray(a.days) && a.days.length === 7)).toBe(true);
    for (let i = 0; i < 3; i++) nextWeek(true, true);
    expect(abs()).toBeGreaterThan(7);
  });
});
