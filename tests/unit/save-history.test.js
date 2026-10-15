// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, newGame, setState } from '../../src/state.js';
import { sign } from '../../src/systems/artists.js';
import { KEY, KEY_FULL, KEY_META, compactOf, load, replaceSave, restoreBackup, save, saveMeta, setSavedHook, slotInfo } from '../../src/save/storage.js';
import { nextWeek } from '../../src/systems/week.js';
import { setPos } from '../../src/ui/building.js';

noToggle();
const play = n => { for (let i = 0; i < n; i++) nextWeek(true, true); };
const quota = () => { const e = new Error('full'); e.name = 'QuotaExceededError'; return e; };
beforeEach(() => { document.body.innerHTML = SHELL; localStorage.clear(); seed(42); setSavedHook(() => {}); });
afterEach(() => setSavedHook(() => {}));

describe('lịch sử đầy đủ qua các lần tải lại', () => {
  it('sao lưu sau khi tải lại (bản rút gọn) vẫn giữ log/hist/lessons/prHist/fin/concerts cũ', () => {
    newGame(); play(30);
    S.prHist = Array.from({ length: 25 }, (_, i) => 'pr' + i);
    S.concerts = Array.from({ length: 6 }, (_, i) => ({ act: 'A' + i, aud: i, y: 0, m: [], k: 'k' + (i % 3), w: i }));
    S.artists[0].lessons = Array.from({ length: 10 }, (_, i) => ({ t: 'L' + i, l: 'x', s: '', y: 1 }));
    S.artists[0].hist = Array.from({ length: 20 }, (_, i) => 'h' + i);
    const logBefore = S.log.map(l => l.t), finBefore = S.fin.length;
    save({ full: true });
    S.money -= 1e6; save();                  // later action → compact wins on reload
    setPos({}); setState(null); expect(load()).toBe(true);
    play(5);
    save({ full: true });
    const f = JSON.parse(localStorage.getItem(KEY_FULL));
    const lt = f.log.map(l => l.t);
    for (const t of logBefore.slice(0, 60)) expect(lt).toContainEqual(t);
    expect(f.artists[0].hist).toHaveLength(20);
    expect(f.artists[0].lessons.length).toBeGreaterThanOrEqual(10);
    expect(f.prHist).toEqual(expect.arrayContaining(['pr24', 'pr20']));
    expect(f.concerts.length).toBeGreaterThanOrEqual(6);
    expect(f.fin.length).toBeGreaterThanOrEqual(finBefore);
  });
  it('bản rút gọn không cắt hist/lessons mức 1', () => {
    newGame(); play(3);
    S.artists[0].lessons = Array.from({ length: 10 }, (_, i) => ({ t: 'L' + i, l: 'x', s: '', y: 1 }));
    save();
    expect(JSON.parse(localStorage.getItem(KEY)).artists[0].lessons).toHaveLength(10);
  });
});

describe('khôi phục / nhập an toàn dung lượng', () => {
  it('restoreBackup ở sát giới hạn dung lượng vẫn thành công', () => {
    newGame(); play(40);
    save({ full: true });
    const full = localStorage.getItem(KEY_FULL), w = S.week, ct = JSON.stringify(compactOf(S)).length;
    expect(ct).toBeLessThan(full.length - 500);
    play(3); save();
    const orig = Storage.prototype.setItem;
    // room for old KEY_FULL + one compact copy only: writing an extra uncompacted copy would overflow
    const budget = full.length + ct + 300;
    Storage.prototype.setItem = function (k, v) {
      let used = 0; for (let i = 0; i < localStorage.length; i++) { const kk = localStorage.key(i); if (kk !== k && kk !== KEY_META) used += localStorage.getItem(kk).length; }
      if (k !== KEY_META && used + String(v).length > budget) throw quota();
      return orig.call(this, k, v);
    };
    try {
      expect(restoreBackup()).toBe(true);
      expect(S.week).toBe(w);
      expect(localStorage.getItem(KEY_FULL)).toBe(full);
    } finally { Storage.prototype.setItem = orig; }
  });
  it('nhập save quá lớn báo lỗi hết dung lượng thay vì dữ liệu hỏng', async () => {
    newGame(); play(2);
    const { lastSaveError } = await import('../../src/save/storage.js');
    const d = JSON.parse(JSON.stringify(S));
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k !== KEY_META) throw quota(); return orig.call(this, k, v); };
    try { expect(replaceSave(d)).toBe(false); expect(lastSaveError()).toBe('quota'); } finally { Storage.prototype.setItem = orig; }
  });
});

describe('ván mới không ghi đè bản sao lưu', () => {
  it('newGame + save giữ bản sao lưu cũ đến khi đủ chu kỳ; có nhãn ván trước', () => {
    newGame(); play(6);
    save({ full: true });
    const old = localStorage.getItem(KEY_FULL);
    newGame(); save();
    expect(localStorage.getItem(KEY_FULL)).toBe(old);
    expect(saveMeta().f.prev).toBe(1);
    expect(restoreBackup()).toBe(true);
    expect(S.week).toBe(7);
  });
  it('sau chu kỳ đầu tiên của ván mới, sao lưu được ghi và bỏ nhãn', () => {
    newGame(); play(6);
    save({ full: true });
    newGame(); save();
    play(4); save();
    expect(slotInfo('f').w).toBe(5);
    expect(saveMeta().f.prev).toBeUndefined();
  });
  it('load lỗi khi migrate bản rút gọn thì thử bản sao lưu trước khi newGame', () => {
    newGame(); play(4);
    save({ full: true });
    const d = JSON.parse(localStorage.getItem(KEY));
    d.managers = [{ id: 1, name: 'X', as: { t: 'l' }, sk: null, lv: 1 }];  // blows up in migration
    d.mgrPool = [];
    localStorage.setItem(KEY, JSON.stringify(d));
    setState(null);
    expect(load()).toBe(true);
    expect(S.week).toBe(5);
  });
});

describe('meta lỗi an toàn', () => {
  it('cờ fl được xoá trước khi ghi bản rút gọn mới', () => {
    newGame(); play(2);
    save({ full: true });
    expect(saveMeta().c.fl).toBe(1);
    S.money -= 1e6;
    const orig = Storage.prototype.setItem;
    let n = 0;
    Storage.prototype.setItem = function (k, v) { if (k === KEY_META && ++n > 1) throw quota(); return orig.call(this, k, v); };
    try { save(); } finally { Storage.prototype.setItem = orig; }
    expect(saveMeta().c.fl).toBe(0);
    const m = S.money;
    setState(null); load();
    expect(S.money).toBe(m);
  });
});
void KEY_META;
