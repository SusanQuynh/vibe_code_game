// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { noToggle, seed, SHELL, viT } from './helpers.js';
import { S, abs, newGame } from '../../src/state.js';
import { demoteGM, gmOf, hireGM, promoteGM } from '../../src/systems/gm.js';
import { assignMgr, effSk, fireMgr, genManager, hireMgr, mCap, setBoss } from '../../src/systems/managers.js';
import { buildProps } from '../../src/systems/proposals.js';
import { nextWeek } from '../../src/systems/week.js';
import { mNameH } from '../../src/systems/ext3.js';
import { openRoom } from '../../src/ui/rooms.js';

noToggle();

beforeEach(() => {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seed(42);
});

const hire = (dom = 'trainee') => { const m = genManager(); m.dom = dom; m.boss = null; S.managers.push(m); return m; };
// a, b top-level; c under a
const tree3 = () => { const a = hire(), b = hire(), c = hire(); c.boss = a.id; return [a, b, c]; };

describe('Quản lý tổng', () => {
  it('bổ nhiệm: thu phí, GM không phụ trách, hai QL cấp cao nhất báo cáo GM, cấp dưới giữ nguyên', () => {
    newGame();
    const [a, b, c] = tree3(), g = hire(), s0 = g.salary, m0 = S.money;
    g.as = { t: 'b', id: S.batches[0].id };
    promoteGM(g.id);
    expect(gmOf()).toBe(g);
    expect(g.as).toBe(null);
    expect(g.boss).toBe(null);
    expect(a.boss).toBe(g.id);
    expect(b.boss).toBe(g.id);
    expect(c.boss).toBe(a.id);
    expect(S.money).toBe(m0 - (20e6 + 5e6 * g.lv));
    expect(g.salary).toBe(s0 + g.gmRaise);
    expect(mCap(g)).toBe(Infinity);
  });
  it('thưởng 10% kỹ năng cho cấp dưới gián tiếp, cấp dưới trực tiếp không nhận hai lần', () => {
    newGame();
    const [a, , c] = tree3(), g = hire();
    g.sk.plan = 10; a.sk.plan = 1; c.sk.plan = 1;
    const before = { a: effSk(a, 'plan'), c: effSk(c, 'plan') };
    promoteGM(g.id);
    expect(effSk(a, 'plan')).toBe(Math.min(10, 1 + 2 + 0));           // +20% GM, không +10%
    expect(effSk(c, 'plan')).toBe(Math.min(10, 1 + Math.floor(a.sk.plan * .2) + 1));   // +20% của a, +10% của GM
    expect(effSk(a, 'plan')).toBeGreaterThanOrEqual(before.a);
    expect(effSk(c, 'plan')).toBe(before.c + 1);
  });
  it('từ chối phân công GM; setBoss rỗng chuyển về GM; không đặt boss cho GM', () => {
    newGame();
    const [a, , c] = tree3(), g = hire();
    promoteGM(g.id);
    assignMgr(g.id, 'b' + S.batches[0].id);
    expect(g.as).toBe(null);
    setBoss(c.id, '');
    expect(c.boss).toBe(g.id);
    setBoss(g.id, String(a.id));
    expect(g.boss).toBe(null);
    const p = genManager(); S.mgrPool.push(p); S.money = 1e9; hireMgr(p.id);
    expect(S.managers.find(x => x.id === p.id).boss).toBe(g.id);
  });
  it('bãi nhiệm trả lương và đưa cấp dưới về Giám đốc; sa thải GM cũng vậy', () => {
    newGame();
    const [a, b] = tree3(), g = hire(), s0 = g.salary;
    promoteGM(g.id);
    demoteGM();
    expect(gmOf()).toBe(null);
    expect(g.salary).toBe(s0);
    expect(a.boss).toBe(null);
    expect(b.boss).toBe(null);
    promoteGM(g.id);
    const btn = document.createElement('button');
    fireMgr(g.id, btn); fireMgr(g.id, btn);
    expect(S.managers.includes(g)).toBe(false);
    expect(a.boss).toBe(null);
    expect(b.boss).toBe(null);
  });
  it('bổ nhiệm người mới hạ GM cũ xuống báo cáo GM mới', () => {
    newGame();
    const g1 = hire(), g2 = hire(), a = hire();
    promoteGM(g1.id);
    promoteGM(g2.id);
    expect(gmOf()).toBe(g2);
    expect(g1.gm).toBe(0);
    expect(g1.boss).toBe(g2.id);
    expect(a.boss).toBe(g2.id);
  });
  it('tuyển thẳng làm GM tốn gấp đôi phí', () => {
    newGame();
    const p = S.mgrPool[0], m0 = S.money;
    hireGM(p.id);
    expect(gmOf().id).toBe(p.id);
    expect(S.money).toBe(m0 - p.fee * 2);
    expect(S.mgrPool.includes(p)).toBe(false);
  });
  it('nextWeek có GM ghi gmRep và dòng nhật ký mỗi 4 tuần; không có GM thì không có gmRep', () => {
    newGame();
    tree3();
    for (let i = 0; i < 4; i++) nextWeek(true, true);
    expect(JSON.stringify(S)).not.toContain('gmRep');
    const g = hire();
    promoteGM(g.id);
    let found = false;
    for (let i = 0; i < 4; i++) { nextWeek(true, true); if (S.log.some(l => viT(l.t).startsWith('📊 QL tổng'))) found = true; expect(S.gmRep.w).toBe(abs() - 1); }
    expect(found).toBe(true);
    expect(S.gmRep.teams.length).toBe(S.managers.filter(m => m.boss === g.id).length);
  });
  it('GM duyệt đề xuất của quản lý cấp dưới', () => {
    newGame();
    const m = hire('trainee'), g = hire();
    m.as = { t: 'b', id: S.batches[0].id }; m.ps = 2;
    promoteGM(g.id);
    buildProps();
    expect(S.props.st.boss[g.name]).toBeGreaterThan(0);
  });
  it('phòng Quản lý hiện thẻ QL tổng và nút tuyển QL tổng', () => {
    newGame();
    hire(); hire();
    openRoom('mgr');
    let h = document.getElementById('sheet').innerHTML;
    expect(h).toContain('Bổ nhiệm Quản lý tổng');
    expect(h).toContain('hireGM(');
    promoteGM(S.managers[0].id);
    openRoom('mgr');
    h = document.getElementById('sheet').innerHTML;
    expect(h).toContain('Bãi nhiệm');
    expect(h).toContain('(Quản lý tổng)');
  });
});

describe('màu tên quản lý theo vị trí', () => {
  it('mNameH: GM, trưởng nhóm, quản lý thường', () => {
    newGame();
    const [a, b, c] = tree3(), g = hire();
    promoteGM(g.id);
    expect(mNameH(g)).toContain('mn-gm');
    expect(mNameH(a)).toContain('mn-lead');   // a có c dưới quyền
    expect(mNameH(b)).toContain('mn-reg');
    expect(mNameH(c)).toContain('mn-reg');
    expect(mNameH({ ...b, name: '<x>' })).toContain('&lt;x&gt;');
  });
  it('phòng Quản lý và báo cáo không còn style màu trên tên quản lý', () => {
    newGame();
    const [a, , c] = tree3(), g = hire();
    promoteGM(g.id);
    a.as = { t: 'b', id: S.batches[0].id }; c.as = null;
    openRoom('mgr');
    const h = document.getElementById('sheet').innerHTML;
    expect(h).not.toMatch(/style="color:[^"]*"[^>]*>[^<]*<\/b>/);
    expect(h).not.toContain('style="color:#');
    expect(h).toContain('mn-gm');
    expect(h).toContain('mn-lead');
    expect(h).toContain('mn-reg');
    expect(h).toContain('● Quản lý tổng');
  });
});
