// Scenario table shared by ui-vi-extra2.test.js (vi output frozen as file snapshots, recorded BEFORE each area was translated)
// and ui-en-extra2.test.js (en guard). A case runs against ctx.fresh(state) and returns a string or an object of strings.
// Read the DOM synchronously: building.js's interval mutates it between awaits.
import { S, abs, byId, setState } from '../../src/state.js';
import { seed } from './helpers.js';
import { openRoom } from '../../src/ui/rooms.js';
import { closeM } from '../../src/ui/modal.js';
import { genManager, gmOf, hireMgr, setBoss, setDom, assignMgr, toggleMA, rehuntMgr, retrain } from '../../src/systems/managers.js';
import { promoteGM, hireGM, demoteGM, gmCardHTML } from '../../src/systems/gm.js';
import { hireAsst } from '../../src/systems/ext2.js';
import { mgrBossHTML, setMrel } from '../../src/systems/ext3.js';
import { orgTree } from '../../src/ui/views.js';

export const CASES = [];
export const add = (name, run) => CASES.push({ name, run });
export const sheet = () => document.getElementById('sheet').innerHTML;
export const toastText = () => document.getElementById('toast')?.textContent || null;
export const clearToast = () => { const el = document.getElementById('toast'); if (el) el.textContent = ''; };
// toast case: run f against a fresh state, return the toast text (or THROW message)
export const toastOf = (ctx, b, f) => { ctx.fresh(b); clearToast(); try { f(); } catch (e) { return 'THROW ' + e.message; } return toastText(); };
// give trainees high stats so every debut branch is reachable
export const boost = () => S.artists.filter(a => a.status === 'trainee').forEach(a => { for (const k in a.st) a.st[k] = 70; a.dReady = 1; a.busy = null; });

// ---------------- task 5: manager office ----------------
const nonGm = () => S.managers.filter(m => !m.gm);
add('t5-mgr-nogm', ctx => { ctx.fresh(ctx.base); demoteGM(null); openRoom('mgr'); return sheet(); });
add('t5-mgr-variants', ctx => {
  ctx.fresh(ctx.base);
  const ms = nonGm(), tr = S.artists.find(a => a.status === 'trainee'), ds = S.artists.filter(a => a.status !== 'trainee');
  if (tr) tr.batch = 9999; S.batches.push({ id: 9999, n: 'Lứa 9', w: 1 });
  if (ds[0]) ds[0].pm = { id: -1, name: 'PM Test', sk: { nego: 5, care: 5, pr: 5, plan: 5 }, lv: 1, ps: 1, boss: null };
  const kinds = [{ t: 'l', id: 0, ids: ds.slice(1, 3).map(a => a.id) }, { t: 'b', id: S.batches[0].id }, S.groups[0] && { t: 'g', id: S.groups[0].id }, ds[2] && { t: 'a', id: ds[2].id }, { t: 't', id: 0 }, { t: 's', id: 0 }, { t: 'd', id: 0 }];
  ms.forEach((m, i) => { m.as = kinds[i % kinds.length] || null; m.auto = ['off', 'short', 'all'][i % 3]; m.ps = i % 3; });
  if (ms[1]) ms[1].rt = abs() + 2;
  openRoom('mgr'); return sheet();
});
add('t5-mgr-lists', ctx => { // a manager with a self-chosen list, every list-row state, plus a mentored sub-manager
  ctx.fresh(ctx.base);
  const ms = nonGm(), ds = S.artists.filter(a => a.status !== 'trainee');
  ms.forEach(m => { m.dom = 'solo'; });
  if (ms[0]) ms[0].as = { t: 'l', id: 0, ids: ds.slice(0, 2).map(a => a.id) };
  if (ms[1]) { ms[1].as = { t: 'l', id: 0, ids: [] }; ms[1].dom = null; }
  openRoom('mgr'); return sheet();
});
add('t5-mgr-early', ctx => { ctx.fresh(ctx.early); const out = {}; openRoom('mgr'); out.none = sheet(); S.mgrPool = []; openRoom('mgr'); out.nopool = sheet();
  S.mgrPool = ctx.early.mgrPool.slice(); S.money = 1e10; const ids = S.mgrPool.map(m => m.id); ids.forEach(id => hireMgr(id)); openRoom('mgr'); out.hired = sheet();
  const [a, b, c] = S.managers; if (a && b) { setBoss(b.id, String(a.id)); setMrel(a, b, 55); } if (a && c) { setBoss(c.id, String(a.id)); setMrel(a, c, -40); } if (b && c) setMrel(b, c, 12);
  openRoom('mgr'); out.chain = sheet(); out.boss = mgrBossHTML(); out.tree = orgTree();
  hireGM(S.mgrPool[0]?.id); openRoom('mgr'); out.gm = sheet(); return out; });
add('t5-gmcard', ctx => {
  ctx.fresh(ctx.base); const g = gmOf(), out = {};
  if (!g) return { none: 'no gm' };
  const ms = S.managers.filter(m => !m.gm);
  out.cur = gmCardHTML();
  S.gmRep = { w: 5, y: 1, up: ['Mgr A', 'Mgr B'], prob: ['p1 x', 'p2 x', 'p3 x', 'p4 x', 'p5 x', 'p6 x', 'p7 x'], teams: ms.slice(0, 2).map((m, i) => ({ mid: m.id, n: 3 + i, fans: i ? -250 : 1500, earn: i ? -2e6 : 12e6, warn: i * 2 })) };
  out.big = gmCardHTML();
  S.gmRep = { w: 5, y: 1, up: [], prob: [], teams: [] }; out.empty = gmCardHTML();
  S.gmRep = { w: 5, y: 1, up: [], prob: ['solo'], teams: [{ mid: 424242, n: 1, fans: 0, earn: 0, warn: 0 }] }; out.few = gmCardHTML();
  openRoom('mgr'); out.sheet = sheet();
  ctx.fresh(ctx.base); // restore S so stored strings in `cur` are still reachable for the en guard
  return out;
});
add('t5-toasts', ctx => {
  const out = {}, T = (n, b, f) => { out[n] = toastOf(ctx, b, f); };
  const B = ctx.base, E = ctx.early;
  T('setBoss.gm', B, () => setBoss(gmOf().id, ''));
  T('setBoss.loop', B, () => { const [a, b] = nonGm(); setBoss(b.id, String(a.id)); setBoss(a.id, String(b.id)); });
  T('setBoss.cap', B, () => { const a = nonGm()[0]; a.lv = 1; for (let i = 0; i < 3; i++) { const k = genManager(); k.boss = i < 2 ? a.id : null; S.managers.push(k); } setBoss(S.managers.at(-1).id, String(a.id)); });
  T('setDom.money', B, () => { S.money = 0; const m = nonGm()[0]; setDom(m.id, ['group', 'solo', 'actor', 'trainee'].find(k => k !== m.dom)); });
  T('assign.gm', B, () => assignMgr(gmOf().id, 't0'));
  T('assign.retrain', B, () => { const m = nonGm()[0]; m.rt = abs() + 2; assignMgr(m.id, 't0'); });
  T('assign.taken', B, () => { const [a, b] = nonGm(); a.dom = b.dom = 'trainee'; a.as = { t: 'b', id: S.batches[0].id }; b.as = null; assignMgr(b.id, 'b' + S.batches[0].id); });
  T('assign.dom', B, () => { const m = nonGm()[0]; m.dom = 'actor'; m.as = null; assignMgr(m.id, 't0'); });
  T('toggle.dom', B, () => { const m = nonGm()[0]; m.dom = 'trainee'; m.as = { t: 'l', id: 0, ids: [] }; toggleMA(m.id, S.artists.find(a => a.status !== 'trainee').id, true); });
  T('toggle.cap', B, () => { const m = nonGm()[0]; m.dom = null; const ds = S.artists.filter(a => a.status !== 'trainee'); m.as = { t: 'l', id: 0, ids: ds.slice(0, 4).map(a => a.id) }; toggleMA(m.id, ds[4] ? ds[4].id : S.artists.at(-1).id, true); });
  T('toggle.other', B, () => { const [a, b] = nonGm(); const ds = S.artists.filter(x => x.status !== 'trainee'); a.dom = b.dom = null; a.as = { t: 'l', id: 0, ids: [ds[0].id] }; b.as = { t: 'l', id: 0, ids: [] }; toggleMA(b.id, ds[0].id, true); });
  T('hire.money', E, () => { S.money = 0; hireMgr(S.mgrPool[0].id); });
  T('hireGM.money', E, () => { S.money = 0; hireGM(S.mgrPool[0].id); });
  T('promote.money', B, () => { S.money = 0; promoteGM(nonGm()[0].id); });
  T('rehunt.money', B, () => { S.money = 0; rehuntMgr(); });
  T('asst.max', B, () => { const m = nonGm()[0]; S.money = 1e10; hireAsst(m.id, 'nego', 1, 'A', 1, 1); hireAsst(m.id, 'care', 1, 'B', 1, 1); hireAsst(m.id, 'pr', 1, 'C', 1, 1); });
  T('asst.money', B, () => { S.money = 0; hireAsst(nonGm()[0].id, 'nego', 1, 'A', 1e6, 1); });
  T('demote.tap', B, () => { openRoom('mgr'); const b = [...document.querySelectorAll('button')].find(x => /demoteGM/.test(x.getAttribute('onclick') || '')); window.demoteGM = demoteGM; b.dataset.c = '0'; demoteGM(b); out['demote.btn'] = b.textContent; });
  return out;
});
