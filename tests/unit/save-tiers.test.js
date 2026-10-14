// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { noToggle, seed, SHELL, viT } from './helpers.js';
import { S, newGame, setState } from '../../src/state.js';
import { sign } from '../../src/systems/artists.js';
import { debutIds } from '../../src/systems/debut.js';
import { acceptOffer } from '../../src/systems/offers.js';
import { KEY, KEY_FULL, KEY_META, compactOf, lastLoadSource, load, replaceSave, restoreBackup, save, saveMeta, setSavedHook, slotInfo } from '../../src/save/storage.js';
import { nextWeek } from '../../src/systems/week.js';
import { setPos } from '../../src/ui/building.js';
import { view } from '../../src/ui/modal.js';
import { saveBackupNow, saveImportApply, saveRestorePreview, viewCode } from '../../src/ui/saveView.js';

const clone = x => JSON.parse(JSON.stringify(x));
const play = n => {
  for (let i = 0; i < n; i++) {
    if (i % 3 === 0 && S.artists.length < 5 && S.money > 150e6 && S.pool[0]) sign(S.pool[0].id);
    for (const a of [...S.artists]) if (a.status === 'trainee' && a.dReady) debutIds('solo', [a.id], '');
    for (const o of S.offers.slice(0, 2)) { const a = S.artists.find(x => !x.busy && x.status === 'debuted'); if (a) acceptOffer(o.id, a.id, true); }
    nextWeek(true, true);
  }
};
const seen = [];
beforeEach(() => {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seen.length = 0;
  setSavedHook((ok, info) => seen.push([ok, info]));
  seed(42);
});
afterEach(() => setSavedHook(() => {}));

describe('save hai tầng', () => {
  it('save() không đổi S; bản rút gọn nhỏ hơn bản đầy đủ và giữ singles/awards', () => {
    newGame(); play(60);
    const before = JSON.stringify(S);
    expect(save({ full: true })).toBe(true);
    expect(JSON.stringify(S)).toBe(before);
    const c = localStorage.getItem(KEY), f = localStorage.getItem(KEY_FULL);
    expect(f).toBe(before);
    expect(c.length).toBeLessThan(f.length);
    const d = JSON.parse(c);
    expect(d.log.length).toBeLessThanOrEqual(30);
    expect(d.singles).toEqual(S.singles);
    expect(d.awards).toEqual(S.awards);
    expect(d.artists.every(a => a.hist.length <= 30 && a.lessons.length <= 12)).toBe(true);
    expect(compactOf(S, 2).artists.every(a => a.hist.length <= 5 && a.lessons.length <= 2)).toBe(true);
    expect(compactOf(S, 2).log.length).toBeLessThanOrEqual(10);
    expect(JSON.stringify(S)).toBe(before);
  });
  it('fork: gameplay không đọc dữ liệu đã cắt (rút gọn → tải → chơi tiếp 20 tuần == bản đầy đủ)', () => {
    newGame(); play(60);
    const full = JSON.stringify(S), compact = JSON.stringify(compactOf(S, 1));
    expect(compact.length).toBeLessThan(full.length);
    const run = txt => {
      localStorage.clear(); localStorage.setItem(KEY, txt); expect(load()).toBe(true);
      setPos({}); seed(9); play(20);   // chibi positions (render RNG) live outside S, reset them for a fair fork
      const o = clone(S);
      for (const k of ['log', 'prHist', 'fin', 'films', 'concerts', 'rec', 'gmRep', 'props']) delete o[k];
      for (const a of [...o.artists, ...o.pool]) { delete a.hist; delete a.lessons; }
      return JSON.stringify(o);
    };
    const A = run(full), B = run(compact);
    expect(B).toBe(A);
  });
  it('nhịp sao lưu: tuần 1 ghi, 2-4 không, 5 ghi; save({full}) luôn ghi; newGame giữ bản sao lưu cũ đến chu kỳ đầu', () => {
    newGame();
    const writes = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === KEY_FULL) writes.push(S.week); return orig.call(this, k, v); };
    try {
      for (const w of [1, 2, 3, 4, 5]) { S.week = w; save(); }
      expect(writes).toEqual([1, 5]);
      S.week = 5; save({ full: true });
      expect(writes).toEqual([1, 5, 5]);
      newGame(); save();                       // new game: old backup is protected until the first regular interval
      expect(writes).toEqual([1, 5, 5]);
      S.week = 5; save();
      expect(writes).toEqual([1, 5, 5, 5]);
    } finally { Storage.prototype.setItem = orig; }
    expect(slotInfo('f').w).toBe(5);
  });
  it('load: KEY hỏng + KEY_FULL tốt → tải từ bản sao lưu và ghi 🛟; thiếu cả hai → false', () => {
    newGame(); play(5);
    save({ full: true });
    const w = S.week;
    localStorage.setItem(KEY, '{hỏng');
    setState(null);
    expect(load()).toBe(true);
    expect(S.week).toBe(w);
    expect(lastLoadSource()).toBe('full');
    expect(viT(S.log[0].t)).toContain('🛟');
    localStorage.clear();
    expect(load()).toBe(false);
  });
  it('cùng thời điểm thì dùng bản đầy đủ; có hành động sau sao lưu thì dùng bản rút gọn', () => {
    newGame(); play(5);
    S.artists[0].hist = Array.from({ length: 20 }, (_, i) => 'h' + i);
    save({ full: true });
    const histTxt = JSON.stringify(S.artists.map(a => a.hist));
    setState(null); load();
    expect(lastLoadSource()).toBe('full');
    expect(JSON.stringify(S.artists.map(a => a.hist))).toBe(histTxt);
    S.money -= 1e6; save();             // later action reaches only the compact slot
    const m = S.money;
    setState(null); load();
    expect(lastLoadSource()).toBe('compact');
    expect(S.money).toBe(m);
    expect(S.artists[0].hist).toHaveLength(20);
  });
  it('quota: lvl 1 hỏng, lvl 2 vừa → ok + info lite + meta lvl 2', () => {
    newGame(); play(40);
    const lv1 = JSON.stringify(compactOf(S, 1)).length, lv2 = JSON.stringify(compactOf(S, 2)).length;
    expect(lv2).toBeLessThan(lv1);
    const orig = Storage.prototype.setItem, N = Math.floor((lv1 + lv2) / 2);
    Storage.prototype.setItem = function (k, v) { if (String(v).length > N) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } return orig.call(this, k, v); };
    try {
      seen.length = 0;
      expect(save()).toBe(true);
      expect(seen.at(-1)).toEqual([true, 'lite']);
      expect(saveMeta().c.lvl).toBe(2);
      expect(JSON.parse(localStorage.getItem(KEY)).log.length).toBeLessThanOrEqual(10);
    } finally { Storage.prototype.setItem = orig; }
  });
  it('quota: chỉ KEY_FULL hỏng → ok + noBackup, bản sao lưu cũ còn nguyên', () => {
    newGame(); play(3);
    save({ full: true });
    const old = localStorage.getItem(KEY_FULL);
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === KEY_FULL) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } return orig.call(this, k, v); };
    try {
      play(1);
      seen.length = 0;
      expect(save({ full: true })).toBe(true);
      expect(seen.at(-1)).toEqual([true, 'noBackup']);
      expect(localStorage.getItem(KEY_FULL)).toBe(old);
      expect(saveMeta().f.err).toBe(1);
    } finally { Storage.prototype.setItem = orig; }
  });
  it('quota nặng: xoá bản sao lưu để giữ bản chính', () => {
    newGame(); play(3);
    save({ full: true });
    const lv2 = JSON.stringify(compactOf(S, 2)).length, orig = Storage.prototype.setItem;
    let n = 0;
    Storage.prototype.setItem = function (k, v) {
      if (k === KEY && n++ < 2) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; }
      return orig.call(this, k, v);
    };
    try {
      seen.length = 0;
      expect(save()).toBe(true);
      expect(seen.at(-1)).toEqual([true, 'noBackup']);
      expect(localStorage.getItem(KEY_FULL)).toBe(null);
      expect(lv2).toBeGreaterThan(0);
    } finally { Storage.prototype.setItem = orig; }
  });
  it('lỗi không phải quota → save false', () => {
    newGame();
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('boom'); };
    try { expect(save()).toBe(false); expect(seen.at(-1)).toEqual([false, 'fail']); } finally { Storage.prototype.setItem = orig; }
  });
  it('replaceSave ghi cả hai ô; restoreBackup quay về bản cũ', () => {
    newGame(); play(3);
    save({ full: true });
    const w3 = S.week;
    play(3);
    save();
    expect(S.week).toBe(w3 + 3);
    expect(restoreBackup()).toBe(true);
    expect(S.week).toBe(w3);
    expect(JSON.parse(localStorage.getItem(KEY)).week).toBe(w3);
    expect(JSON.parse(localStorage.getItem(KEY_FULL)).week).toBe(w3);
    expect(replaceSave({ foo: 1 })).toBe(false);
    expect(JSON.parse(localStorage.getItem(KEY)).week).toBe(w3);
    localStorage.removeItem(KEY_FULL);
    expect(restoreBackup()).toBe(false);
  });
  it('fixture save-v1 tải được từ KEY và cả khi chỉ có ở KEY_FULL', () => {
    const old = fs.readFileSync('tests/fixtures/save-v1.json', 'utf8');
    localStorage.setItem(KEY, old);
    expect(load()).toBe(true);
    localStorage.clear();
    localStorage.setItem(KEY_FULL, old);
    expect(load()).toBe(true);
    expect(lastLoadSource()).toBe('full');
    for (let i = 0; i < 3; i++) nextWeek(true, true);
  });
});

describe('🔑 hai bản lưu', () => {
  it('viewCode hiện cả hai hàng kèm dung lượng sau sao lưu đầy đủ', () => {
    newGame(); play(3);
    view(viewCode);
    let h = document.getElementById('sheet').innerHTML;
    expect(h).toContain('Bản rút gọn (tự lưu)');
    expect(h).toContain('Bản đầy đủ (sao lưu)');
    saveBackupNow();
    h = document.getElementById('sheet').innerHTML;
    expect(h).toMatch(/Bản đầy đủ \(sao lưu\)<\/b><span class="small muted">Năm 1 · Tuần 4 · [\d.]+ KB/);
    expect(h).toContain('Xem trước');
    expect(h).toContain('Sao lưu đầy đủ ngay');
  });
  it('saveRestorePreview + saveImportApply khôi phục bản sao lưu cũ (tuần 3)', () => {
    newGame(); play(2);
    save({ full: true });
    const w = S.week;
    play(3);
    save();
    view(viewCode);
    saveRestorePreview();
    const h = document.getElementById('sheet').innerHTML;
    expect(h).toContain('Ghi đè game hiện tại');
    expect(h).toContain('Tuần ' + w);
    saveImportApply();
    expect(S.week).toBe(w);
    expect(JSON.parse(localStorage.getItem(KEY)).week).toBe(w);
  });
  it('khôi phục khi chưa có bản sao lưu báo lỗi, không đổi game', () => {
    newGame();
    localStorage.removeItem(KEY_FULL);
    view(viewCode);
    saveRestorePreview();
    expect(document.getElementById('sheet').innerHTML).toContain('Chưa có bản sao lưu đầy đủ');
    expect(S.week).toBe(1);
  });
});

noToggle();
