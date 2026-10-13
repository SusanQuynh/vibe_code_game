// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, abs, uid, newGame } from '../../src/state.js';
import { DOM_KEYS, MDOM } from '../../src/data/rules.js';
import { assignMgr, genManager, setDom, toggleMA } from '../../src/systems/managers.js';
import { nextWeek } from '../../src/systems/week.js';
import { load, KEY } from '../../src/save/storage.js';
import { openRoom } from '../../src/ui/rooms.js';

noToggle();

beforeEach(() => {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seed(42);
});

const hire = dom => { const m = genManager(); m.dom = dom; S.managers.push(m); return m; };

describe('manager domains', () => {
  it('genManager luôn có dom hợp lệ', () => {
    newGame();
    for (let i = 0; i < 30; i++) expect(DOM_KEYS).toContain(genManager().dom);
    expect(S.mgrPool.every(m => DOM_KEYS.includes(m.dom))).toBe(true);
  });
  it('QL mảng TTS nhận lứa, bị từ chối nhóm và nghệ sĩ thuộc nhóm', () => {
    newGame();
    const m = hire('trainee'), [x, y] = S.artists, b = S.batches[0];
    assignMgr(m.id, 'b' + b.id);
    expect(m.as).toEqual({ t: 'b', id: b.id });
    const g = { id: uid(), name: 'G', members: [x.id, y.id], y: 1, concept: 'bright' };
    S.groups.push(g);
    [x, y].forEach(a => { a.status = 'debuted'; });
    m.as = null;
    assignMgr(m.id, 'g' + g.id);
    expect(m.as).toBe(null);
    assignMgr(m.id, 'a' + x.id);
    expect(m.as).toBe(null);
    const gm = hire('group');
    assignMgr(gm.id, 'a' + x.id);
    expect(gm.as).toEqual({ t: 'a', id: x.id });
  });
  it('danh sách tự chọn của QL solo từ chối nghệ sĩ chỉ là diễn viên', () => {
    newGame();
    const m = hire('solo'), [s, ac] = S.artists;
    s.status = 'debuted'; s.solo = true;
    ac.status = 'debuted'; ac.actor = true;
    assignMgr(m.id, 'l0');
    toggleMA(m.id, s.id, true);
    toggleMA(m.id, ac.id, true);
    expect(m.as.ids).toEqual([s.id]);
  });
  it('setDom thu phí, xoá phân công, khoá 2 tuần rồi cho phép', () => {
    newGame();
    const m = hire('trainee');
    assignMgr(m.id, 'b' + S.batches[0].id);
    const m0 = S.money;
    setDom(m.id, 'solo');
    expect(S.money).toBe(m0 - (10e6 + 2e6 * m.lv));
    expect(m.dom).toBe('solo');
    expect(m.as).toBe(null);
    S.artists[0].status = 'debuted'; S.artists[0].solo = true;
    assignMgr(m.id, 'a' + S.artists[0].id);
    expect(m.as).toBe(null);
    nextWeek(true, true); nextWeek(true, true);
    assignMgr(m.id, 'a' + S.artists[0].id);
    expect(m.as && m.as.id).toBe(S.artists[0].id);
    expect(m.rt).toBeUndefined();
  });
  it('setDom từ chối cùng mảng hoặc thiếu tiền', () => {
    newGame();
    const m = hire('solo');
    const m0 = S.money;
    setDom(m.id, 'solo');
    expect(S.money).toBe(m0);
    S.money = 1e6;
    setDom(m.id, 'actor');
    expect(m.dom).toBe('solo');
  });
  it('phòng Quản lý hiện mảng', () => {
    newGame();
    const m = hire('actor');
    openRoom('mgr');
    const h = document.getElementById('sheet').innerHTML;
    expect(h).toContain(MDOM.actor);
    expect(h).toContain('Đổi mảng');
    expect(m.dom).toBe('actor');
  });
});

describe('migrateDom', () => {
  it('save cũ không có dom được suy ra và chạy tiếp được', () => {
    newGame();
    const d = JSON.parse(fs.readFileSync('tests/fixtures/save-v1.json', 'utf8'));
    const ids = d.artists.map(a => a.id);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    const [sid, aid] = ids;
    const sA = d.artists.find(a => a.id === sid), aA = d.artists.find(a => a.id === aid);
    sA.status = 'debuted'; sA.solo = true; sA.pm = undefined; sA.busy = null;
    aA.status = 'debuted'; aA.actor = true; aA.solo = false; aA.busy = null;
    const mk = as => { const m = genManager(); delete m.dom; m.as = as; return m; };
    const b = 9000;
    d.batches = [{ id: b, n: 'Lứa 1', w: 1 }]; d.bno = 1; d.curBatch = b;
    d.managers = [mk({ t: 'b', id: b }), mk({ t: 'l', id: 0, ids: [sid, aid, sid] }), mk(null)].map(m => ({ ...m, id: m.id + 100000 }));
    d.mgrPool = [mk(null)];
    d.managers[1].as.ids = [sid, aid];
    localStorage.setItem(KEY, JSON.stringify(d));
    expect(load()).toBe(true);
    const [m1, m2, m3] = S.managers;
    expect(m1.dom).toBe('trainee');
    expect(['solo', 'actor']).toContain(m2.dom);
    expect(m2.as.ids).toHaveLength(1);
    expect(DOM_KEYS).toContain(m3.dom);
    expect(DOM_KEYS).toContain(S.mgrPool[0].dom);
    for (let i = 0; i < 3; i++) nextWeek(true, true);
  });
  it('QL cũ as.t s/d/t (không có solo) được suy ra mảng, không phải ngẫu nhiên', () => {
    newGame();
    const d = JSON.parse(fs.readFileSync('tests/fixtures/save-v1.json', 'utf8'));
    d.artists.forEach(a => { a.solo = false; a.actor = false; });
    d.batches = [{ id: 9000, n: 'Lứa 1', w: 1 }]; d.bno = 1; d.curBatch = 9000;
    const mk = t => { const m = genManager(); delete m.dom; m.as = { t, id: 0 }; return { ...m, id: m.id + 100000 + t.charCodeAt(0) }; };
    d.managers = [mk('s'), mk('d'), mk('t')];
    localStorage.setItem(KEY, JSON.stringify(d));
    expect(load()).toBe(true);
    expect(S.managers.map(m => m.dom)).toEqual(['solo', 'actor', 'trainee']);
  });
});
