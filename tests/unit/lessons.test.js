// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import { noToggle, seed, SHELL, viT } from './helpers.js';
import { S, newGame } from '../../src/state.js';
import { STATS } from '../../src/data/rules.js';
import { PLESSON } from '../../src/data/lessons.js';
import { applyLesson, completeBusy, nextWeek } from '../../src/systems/week.js';
import { doLive } from '../../src/systems/releases.js';
import { load, KEY } from '../../src/save/storage.js';
import { viewArtist } from '../../src/ui/views.js';

noToggle();

beforeEach(() => {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seed(42);
  vi.restoreAllMocks();
});

describe('applyLesson / a.pg', () => {
  it('giữ nguyên chuỗi trả về và ghi điểm thực nhận, kể cả khi chạm 100', () => {
    newGame();
    const [a] = S.artists;
    a.st.vocal = 10; a.st.dance = 99.5;
    const s = applyLesson(a, { vocal: 5, dance: 5 }, 1);
    expect(viT(s)).toBe('Vocal +5.5, Nhảy +5.5');
    expect(a.pg.vocal).toBe(5.5);
    expect(a.pg.dance).toBe(0.5);
    expect(a.st.dance).toBe(100);
  });
});

describe('completeBusy lessons', () => {
  const cases = [['promo', 'promo', 'Quảng bá «X»'], ['promo', 'showcase', 'Showcase debut'], ['promo', 'collab', 'Hợp tác với Y'],
    ['concert', 'concert', 'Concert'], ['concert', 'fanmeet', 'Fan meeting'], ['write', 'write', 'Sáng tác «Z»']];
  for (const [kind, lk, title] of cases) {
    it(`${lk}: một bài học đúng chỉ số, không dùng RNG`, () => {
      newGame();
      const [a] = S.artists, before = { ...a.st };
      a.busy = { kind, title, left: 0, total: 1, lk };
      vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('RNG'); });
      completeBusy(a);
      expect(a.lessons).toHaveLength(1);
      expect(a.lessons[0].lk).toBe(lk);
      for (const k in PLESSON[lk].l) expect(+(a.st[k] - before[k]).toFixed(1)).toBeCloseTo(PLESSON[lk].l[k] * 1.1, 0);
      for (const k in STATS) if (!(k in PLESSON[lk].l)) expect(a.st[k]).toBe(before[k]);
      expect(Object.keys(a.pg).sort()).toEqual(Object.keys(PLESSON[lk].l).sort());
    });
  }
  it('busy cũ không có lk (Fan meeting) dùng fanmeet', () => {
    newGame();
    const [a] = S.artists;
    a.busy = { kind: 'concert', title: 'Fan meeting', left: 0, total: 1 };
    completeBusy(a);
    expect(a.lessons[0].lk).toBe('fanmeet');
  });
  it('hai livestream ở hai tuần gộp thành một bài học (×2)', () => {
    newGame();
    const [a] = S.artists, v0 = a.st.variety;
    doLive([a.id], true);
    S.week++;
    doLive([a.id], true);
    expect(a.lessons).toHaveLength(1);
    expect(viT(a.lessons[0].t)).toContain('(×2)');
    expect(a.pg.variety).toBeCloseTo(a.st.variety - v0, 5);
    expect(a.pg.variety).toBeGreaterThan(0.9);
  });
});

describe('livestream gộp dùng điểm thực', () => {
  it('4 livestream: tổng trên thẻ khớp a.pg; chỉ số 100 thì không tăng', () => {
    newGame();
    const [a] = S.artists;
    a.st.variety = 98.7;
    for (let i = 0; i < 4; i++) { doLive([a.id], true); S.week++; }
    expect(viT(a.lessons[0].t)).toContain('(×4)');
    expect(a.lessons[0].g.variety).toBeCloseTo(a.pg.variety, 5);
    expect(viT(a.lessons[0].s)).toContain(`+${a.pg.variety.toFixed(1)}`);
    expect(a.st.variety).toBe(100);
    const g = a.pg.variety;
    doLive([a.id], true);
    expect(a.pg.variety).toBe(g);
  });
});

describe('migration và golden-neutral', () => {
  it('fixture save-v1 có pg = {} cho mọi nghệ sĩ và chạy 3 tuần', () => {
    newGame();
    localStorage.setItem(KEY, fs.readFileSync('tests/fixtures/save-v1.json', 'utf8'));
    expect(load()).toBe(true);
    expect(S.artists.length).toBeGreaterThan(0);
    expect(S.artists.every(a => a.pg && Object.keys(a.pg).length === 0)).toBe(true);
    for (let i = 0; i < 3; i++) nextWeek(true, true);
  });
  it('newGame + 30 tuần rảnh: không nghệ sĩ nào có pg', () => {
    newGame();
    for (let i = 0; i < 30; i++) nextWeek(true, true);
    expect(S.artists.every(a => !('pg' in a))).toBe(true);
  });
});

describe('profile', () => {
  it('hiện thẻ điểm kỹ năng từ dự án', () => {
    newGame();
    const [a] = S.artists;
    viewArtist(a.id);
    expect(document.getElementById('sheet').innerHTML).toContain('Điểm kỹ năng từ dự án');
    expect(document.getElementById('sheet').innerHTML).toContain('Chưa có');
    a.pg = { vocal: 3.5, rap: 1 };
    viewArtist(a.id);
    const h = document.getElementById('sheet').innerHTML;
    expect(h).toContain('tổng +4.5');
    expect(h).toContain('Vocal');
  });
});
