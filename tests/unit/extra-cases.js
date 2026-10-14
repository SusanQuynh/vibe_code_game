// Scenario table shared by ui-vi-extra2.test.js (vi output frozen as file snapshots, recorded BEFORE each area was translated)
// and ui-en-extra2.test.js (en guard). A case runs against ctx.fresh(state) and returns a string or an object of strings.
// Read the DOM synchronously: building.js's interval mutates it between awaits.
import { S, abs, byId, setState, uid } from '../../src/state.js';
import { seed } from './helpers.js';
import { openRoom } from '../../src/ui/rooms.js';
import { closeM } from '../../src/ui/modal.js';
import { genManager, gmOf, hireMgr, setBoss, setDom, assignMgr, toggleMA, rehuntMgr, retrain } from '../../src/systems/managers.js';
import { promoteGM, hireGM, demoteGM, gmCardHTML } from '../../src/systems/gm.js';
import { hireAsst } from '../../src/systems/ext2.js';
import { mgrBossHTML, setMrel } from '../../src/systems/ext3.js';
import { orgTree } from '../../src/ui/views.js';

export const CASES = [];
// `stored`: Vietnamese test strings the case writes into S (the en guard treats them like stored text)
// `skipEn`: result keys the en guard ignores because they are meant to stay Vietnamese (checked by a dedicated test)
export const add = (name, run, stored = [], skipEn = []) => CASES.push({ name, run, stored, skipEn });
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

// ---------------- task 6: artist profile, personal assistants, mentors, dorm ----------------
import { viewArtist } from '../../src/ui/views.js';
import { viewPA, paOK, paOpen, paHire, paRe, paFire, v3ArtistHTML } from '../../src/systems/ext3.js';
import { mentorSel, setMentor } from '../../src/systems/ext2.js';
import { doLive, doFM } from '../../src/systems/releases.js';
import { acts } from '../../src/systems/secretary.js';
const pg = html => html; // html is read synchronously by callers
const view = a => { viewArtist(a.id); return sheet(); };
add('t6-art-all', ctx => { // every artist of both states, as generated
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); if (n === 'early') boost(); S.artists.forEach((a, i) => { out[n + i + a.status[0]] = view(a); }); }
  return out;
});
add('t6-art-variants', ctx => {
  const out = {};
  ctx.fresh(ctx.base);
  const deb = S.artists.filter(a => a.status === 'debuted'), tr = S.artists.filter(a => a.status === 'trainee');
  const d0 = deb[0], d1 = deb[1];
  if (d0) { d0.pm = { id: -d0.id, name: 'PM Test', sk: { nego: 5, care: 4, pr: 3, plan: 2 }, lv: 1, ps: 1, boss: null }; out.pm = view(d0); d0.pm = null; }
  if (d0) { d0.scandal = { t: 'Tin đồn test', sev: 2, left: 3, truth: false, dating: false, other: 0 }; d0.wantAct = abs() + 4; d0.ceNo = 1; d0.ce = abs() + 9; d0.cs = 3; d0.busy = { kind: 'x', title: 'Việc test', left: 2, total: 3 }; out.scandalBusy = view(d0); }
  if (d1) { d1.lessons = [{ t: 'Bài học test', y: 1, l: 'Nội dung', s: '+3 fan', b: 'Huy hiệu' }]; d1.pg = { vocal: 2.5, dance: 1 }; d1.hist = []; d1.ev = undefined; d1.evG = 'A'; d1.evFail = 4; out.lessons = view(d1); d1.pg = {}; d1.evG = ''; d1.ce = 0; d1.cs = 0; out.bare = view(d1); }
  if (tr[0] && d0) { tr[0].mt = d0.id; tr[0].dReady = 1; tr[0].noHold = false; tr[0].ev = { st: 100 }; tr[0].ttsFail = 3; out.mentored = view(tr[0]); tr[0].noHold = true; tr[0].ev = undefined; out.mentoredOpen = view(tr[0]); }
  if (tr[0] && d0) { tr[0].dReady = 0; tr[0].mt = 0; d0.mt = 0; S.artists.filter(x => x.status === 'trainee').forEach(x => { x.mt = d0.id; }); out.mentorFull = view(d0); S.artists.forEach(x => { x.mt = 0; }); }
  if (d0) { d0.rel = {}; d0.tag = {}; d0.pw = { 'Đối tác X': 2 }; d0.co = { 'Bạn diễn Y': 1 }; S.partners = { 'Đối tác X': 5 }; out.relNone = view(d0); }
  if (d0 && d1) { d0.rel[d1.id] = -10; d0.tag[d1.id] = 'enemy'; d0.rel[tr[0] ? tr[0].id : d1.id] = 30; d0.tag[tr[0] ? tr[0].id : d1.id] = 'dating'; out.relTags = view(d0); d0.tag[d1.id] = 'public'; d0.tag[tr[0] ? tr[0].id : d1.id] = 'friend'; out.relTags2 = view(d0); }
  ctx.fresh(ctx.early); boost();
  const e = S.artists; e[0].status = 'trainee'; e[0].dReady = 1; out.earlyReady = view(e[0]);
  ctx.fresh(ctx.base); const dd = S.artists.find(a => a.status === 'debuted' && !a.actor); if (dd) { dd.solo = 0; dd.actor = 0; S.artists.forEach(x => { x.st && Object.keys(x.st).forEach(k => { }); }); for (const k in dd.st) dd.st[k] = 90; out.hi = view(dd); }
  return out;
}, ['Việc test','Tin đồn test','PM Test','Bài học test','Nội dung','Huy hiệu','Đối tác X','Bạn diễn Y']);
add('t6-v3art', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) {
    ctx.fresh(b); if (n === 'early') boost();
    S.artists.forEach((a, i) => { out[n + i] = v3ArtistHTML(a); });
    const a = S.artists.find(paOK);
    if (a) { a.hsF = { w: abs(), why: ['mệt', 'kiệt sức'], n: 2, st: 'new' }; a.restRec = 0; out[n + 'hs'] = v3ArtistHTML(a); a.restRec = abs() + 3; out[n + 'hs2'] = v3ArtistHTML(a); a.pa = { name: 'Trợ lý Test', k: 'care', v: 2, sal: 2e6 }; out[n + 'pa'] = v3ArtistHTML(a); a.xr = { 1: 20 }; out[n + 'xr'] = v3ArtistHTML(a); }
  }
  return out;
}, ['mệt','kiệt sức','Trợ lý Test']);
add('t6-pa', ctx => {
  const out = {};
  ctx.fresh(ctx.base);
  const a = S.artists.find(paOK);
  if (!a) return { none: 'no pa artist' };
  out.view = (viewPA(a.id), sheet());
  const p = a.paC; a.paC = []; out.empty = (viewPA(a.id), sheet()); a.paC = p;
  a.pa = { name: 'Trợ lý Test', k: 'plan', v: 3, sal: 3e6 }; out.hasPa = (viewPA(a.id), sheet());
  for (const k of ['care', 'nego', 'pr', 'plan']) { a.paC = [{ id: 9001, name: 'Ứng viên ' + k, k, v: 2, sal: 15e5, fee: 1e7 }]; out['why-' + k] = (viewPA(a.id), sheet()); }
  return out;
}, ['Trợ lý Test','Ứng viên care','Ứng viên nego','Ứng viên pr','Ứng viên plan']);
add('t6-mentor', ctx => {
  const out = {};
  ctx.fresh(ctx.base);
  S.artists.filter(x => x.status === 'trainee').forEach((t0, i) => { out['sel' + i] = mentorSel(t0); });
  const d = S.artists.filter(x => x.status === 'debuted'); const tr = S.artists.filter(x => x.status === 'trainee');
  tr.slice(0, 3).forEach(x => { x.mt = d[0].id; }); out.selFull = tr[3] ? mentorSel(tr[3]) : (tr[0] ? mentorSel(tr[0]) : '');
  return out;
});
add('t6-dorm', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); openRoom('dorm'); out[n] = sheet(); }
  ctx.fresh(ctx.base);
  const ds = S.artists.filter(a => a.status === 'debuted');
  if (ds.length > 3) { ds[0].tag[ds[1].id] = 'dating'; ds[1].tag[ds[0].id] = 'dating'; ds[2].tag[ds[3].id] = 'public'; ds[3].tag[ds[2].id] = 'public'; ds[0].tag[ds[2].id] = 'enemy'; ds[2].tag[ds[0].id] = 'enemy'; ds[1].tag[ds[3].id] = 'friend'; ds[3].tag[ds[1].id] = 'friend'; }
  ds[0].pa = { name: 'Trợ lý Test', k: 'pr', v: 1, sal: 1e6 }; ds[0].xr = { 1: 30 };
  openRoom('dorm'); out.tags = sheet();
  S.artists.forEach(a => { a.tag = {}; a.xr = {}; a.pa = null; }); openRoom('dorm'); out.empty = sheet();
  return out;
}, ['Trợ lý Test']);
add('t6-toasts', ctx => {
  const out = {}, T = (n, b, f) => { out[n] = toastOf(ctx, b, f); };
  const B = ctx.base, E = ctx.early;
  const deb = () => S.artists.filter(a => a.status === 'debuted');
  T('pa.open.no', B, () => { const a = S.artists.find(x => !paOK(x)); paOpen(a.id); });
  T('pa.hire.money', B, () => { const a = S.artists.find(paOK); viewPA(a.id); S.money = 0; paHire(a.id, a.paC[0].id); });
  T('pa.re.money', B, () => { const a = S.artists.find(paOK); S.money = 0; paRe(a.id); });
  T('mentor.full', B, () => { const d = deb()[0]; let tr = S.artists.filter(x => x.status === 'trainee'); while (tr.length < 3) { const c = structuredClone(tr[0]); c.id = uid(); c.mt = 0; S.artists.push(c); tr = S.artists.filter(x => x.status === 'trainee'); } tr.forEach(x => { x.mt = 0; }); tr.slice(0, 2).forEach(x => { x.mt = d.id; }); setMentor(tr[2].id, d.id); });
  T('live.twice', B, () => { const a = deb()[0]; a.lastLive = abs(); doLive([a.id]); });
  T('live.money', B, () => { const a = deb()[0]; a.lastLive = -1; S.money = 0; doLive([a.id]); });
  T('live.ok', B, () => { const a = deb()[0]; a.lastLive = -1; S.money = 1e9; doLive([a.id]); });
  T('fm.busy', B, () => { const x = acts()[0]; x.m.forEach(id => { byId(id).busy = { kind: 'x', title: 'x', left: 2, total: 2 }; }); doFM(x.k); });
  T('fm.fans', B, () => { const x = acts()[0]; x.m.forEach(id => { const a = byId(id); a.busy = null; a.fans = 0; }); doFM(x.k); });
  T('fm.money', B, () => { const x = acts()[0]; x.m.forEach(id => { const a = byId(id); a.busy = null; a.fans = 1e6; }); S.money = 0; doFM(x.k); });
  return out;
});

// ---------------- task 7: reports, planner, awards, skip warning ----------------
import { viewReport, viewReportFull, setRepDay, viewAward, viewSkipWarn, viewEvents, briefCard } from '../../src/ui/views.js';
import { startPlan, startPlanOne, planSel, planNext, planSkip, setPlan } from '../../src/ui/planning.js';
import { mgrOf } from '../../src/systems/managers.js';
import { planWhy } from '../../src/systems/week.js';
const rep = () => (viewReport(), sheet());
// fabricate per-artist report rows under the managers so every row/warning branch is rendered
const fab = () => {
  const ms = S.managers.filter(m => !m.gm), arts = S.artists;
  S.managers.forEach(m => { m.as = null; });
  ms.forEach((m, i) => { m.dom = null; m.as = { t: 'l', id: 0, ids: arts.filter((_, j) => j % Math.max(ms.length, 1) === i).map(a => a.id) }; });
  const mk = (e, mo) => Array.from({ length: 7 }, (_, k) => [['vocal', 'dance', 'rest', 'gym', 'rap', 'acting', 'variety'][k], k === 2 ? 0 : 1.2, e, mo]);
  arts.forEach((a, i) => { const v = i % 6; if (v === 5) delete S.lastRep.a[a.id]; else S.lastRep.a[a.id] = v === 0 ? { d: mk(70, 70), f: 12 } : v === 1 ? { d: mk(10, 70), f: -3 } : v === 2 ? { d: mk(70, 10), f: 0, done: 'Phim test' } : v === 3 ? { b: 'Việc ngoài test', f: 5 } : { d: mk(70, 70), f: 1, dec: 1.5, done: 'Phim test' }; });
};
const full = d => (setRepDay(d), viewReportFull(), sheet());
add('t7-report', ctx => {
  const out = {};
  ctx.fresh(ctx.early); out.none = rep(); out.noneFull = full(0);
  ctx.fresh(ctx.base); out.base = rep();
  S.lastRep.m1 = null; S.lastRep.biz = -5e6; out.nullMoney = rep();
  ctx.fresh(ctx.base); S.lastRep.biz = 0; S.lastRep.evl = 0; S.lastRep.m1 = S.lastRep.m0 - 3e6; S.lastRep.ev = ['dòng 1', 'dòng 2', 'dòng 3', 'dòng 4', 'dòng 5', 'dòng 6', 'dòng 7']; out.neg = rep();
  S.lastRep.ev = []; S.lastRep.evl = 1; out.noEv = rep();
  ctx.fresh(ctx.base);
  fab();
  S.props = { w: abs(), m: {}, c: [{ pend: 1 }, { pend: 1 }], st: { boss: { 1: 2, 2: 1 }, auto: 3, res: 2 } };
  out.warns = rep();
  S.props = { w: abs(), m: {}, c: [], st: { boss: {}, auto: 0, res: 0 } }; out.noProps = rep();
  ctx.fresh(ctx.base); S.managers.forEach(m => { m.as = null; }); out.noTeams = rep();
  return out;
}, ['dòng 1', 'dòng 2', 'dòng 3', 'dòng 4', 'dòng 5', 'dòng 6', 'dòng 7', 'Phim test', 'Việc ngoài test']);
add('t7-full', ctx => {
  const out = {};
  ctx.fresh(ctx.base);
  fab();
  for (let d = 0; d <= 7; d++) out['d' + d] = full(d);
  S.managers.forEach(m => { m.as = null; m.boss = null; }); out.noMgr = full(7); fab(); S.managers.forEach(m => { m.boss = null; }); out.flat = full(7);
  ctx.fresh(ctx.base); fab(); for (const id in S.lastRep.a) { const r = S.lastRep.a[id]; if (r.d) r.d = r.d.map(x => [x[0], x[1], 70, 70]); } out.calm = full(7);
  S.managers = []; out.noMgrs = full(3);
  S.lastRep.ev = []; out.noEv = full(7);
  setRepDay(0);
  return out;
}, ['Phim test', 'Việc ngoài test']);
add('t7-brief', ctx => {
  const out = {};
  ctx.fresh(ctx.early); boost(); // no lastRep yet: fake one
  S.lastRep = { w: 1, y: 1, m0: 0, m1: 0, ev: [], a: {} };
  const tr = S.artists.filter(a => a.status === 'trainee');
  tr.forEach((a, i) => { S.lastRep.a[a.id] = { d: Array.from({ length: 7 }, (_, k) => ['vocal', i % 2 ? 1.5 : 0, 70 - i * 20, 60]), f: 10, dec: i ? 0.5 : 0 }; });
  out.ok = briefCard('<b>T</b>', tr);
  S.lastRep.a[tr[0].id].d[6][2] = 5; out.warn = briefCard('<b>T</b>', tr);
  S.lastRep.a[tr[0].id] = { b: 'Việc test' }; delete S.lastRep.a[tr[1].id]; out.out = briefCard('<b>T</b>', tr);
  S.lastRep.a[tr[0].id] = { done: 'Phim test' }; out.done = briefCard('<b>T</b>', tr);
  ctx.fresh(ctx.base); out.empty = briefCard('<b>E</b>', []);
  return out;
}, ['Việc test', 'Phim test']);
add('t7-award', ctx => {
  const out = {};
  ctx.fresh(ctx.base);
  (S.awards || []).forEach((e, i) => { out['a' + i] = (viewAward(e), sheet()); });
  const e0 = S.awards && S.awards.at(-1) || { y: 3, res: [], board: [{ n: 'Cty A', f: 100, me: 0 }, { n: 'Starlight', f: 50, me: 1 }] };
  const e1 = { ...e0, res: [] }; out.noRes = (viewAward(e1), sheet());
  const e2 = { ...e0, res: [{ ok: 1, cat: 'Hạng mục test', names: 'Ai đó', note: 'ghi chú' }, { ok: 0, cat: 'Hạng mục test 2', names: 'Ai đó', note: 'ghi chú' }] }; out.res = (viewAward(e2), sheet());
  S.repOn = false; out.noRep = (viewAward(e2), sheet()); S.repOn = true; S.lastRep = null; out.noLast = (viewAward(e2), sheet());
  return out;
}, ['Hạng mục test', 'Hạng mục test 2', 'Ai đó', 'ghi chú', 'Cty A']);
add('t7-skip', ctx => {
  const out = {};
  ctx.fresh(ctx.base);
  for (const n of [0, 1, 4]) { S.events = S.events.slice(0, 0); for (let i = 0; i < n; i++) S.events.push({ id: 900 + i, kind: 'zz' }); out['skip' + n] = (viewSkipWarn(), sheet()); }
  S.events = []; out.eventsEmpty = (viewEvents(), sheet());
  return out;
});
add('t7-plan', ctx => {
  const out = {};
  const walkPlan = (name, f) => {
    f(); let i = 0, guard = 0;
    while (document.getElementById('sheet').innerHTML && guard++ < 20) {
      const h = sheet(); out[name + i++] = h;
      if (i === 1) { planSel(3); out[name + 'd3'] = sheet(); planSel(6); out[name + 'd6'] = sheet(); }
      if (!document.querySelector('[onclick="planNext()"]')) break;
      planNext();
    }
  };
  ctx.fresh(ctx.base);
  walkPlan('base', () => startPlan(true, true));
  ctx.fresh(ctx.base); S.managers.forEach(m => { m.ps = 1; }); const ap = S.artists.find(x => !x.busy); if (ap) ap.appr = abs(); S.artists.find(x => x.busy) || (S.artists.at(-1).busy = { kind: 'x', title: 'Việc ngoài', left: 2, total: 2 });
  walkPlan('mg', () => startPlan(true, true));
  ctx.fresh(ctx.early); boost();
  walkPlan('early', () => startPlan(true, true));
  // variants of the per-artist page
  ctx.fresh(ctx.base);
  const a = S.artists.find(x => x.status === 'debuted' && !x.busy && !mgrOf(x)) || S.artists.find(x => !x.busy);
  const m = S.managers.find(x => !x.gm);
  const setup = (fn) => { setPlan({ list: [a.id], i: 0, day: 0, force: true }); fn(); viewPlanSheet(); return sheet(); };
  const viewPlanSheet = () => planSel(0);
  out.lowEnergy = setup(() => { a.energy = 20; });
  out.lowMood = setup(() => { a.energy = 90; a.mood = 10; });
  out.wantAct = setup(() => { a.mood = 90; a.wantAct = abs() + 3; });
  out.scandal = setup(() => { a.wantAct = 0; a.scandal = { t: 'Tin đồn test', sev: 1, left: 2, truth: false, dating: false, other: 0 }; });
  out.plain = setup(() => { a.scandal = null; });
  if (m) { a.pm = null; m.as = { t: 'a', id: a.id }; S.props = { w: abs(), m: { [m.id]: { s: [{ a: a.id, days: ['vocal', 'vocal', 'dance', 'rest', 'rest', 'gym', 'rest'], why: 'Lý do test', ok: 0 }] } }, c: [], st: { boss: {}, auto: 0, res: 0 } }; out.prop = setup(() => { }); }
  startPlanOne(a.id); out.single = sheet(); planSel(2); out.singleD2 = sheet();
  out.why = [20, 90].map(e => { a.energy = e; a.mood = e < 50 ? 90 : 10; return planWhy(a); });
  a.energy = 90; a.mood = 90; a.wantAct = abs() + 1; out.why.push(planWhy(a)); a.wantAct = 0; out.why.push(planWhy(a));
  return out;
}, ['Tin đồn test', 'Lý do test']);

// ---------------- task 8: studio, acting, songs, releases, promotion ----------------
import { songCard, songOpts, songPrev, wPrev, viewSongs, viewSong, writeSong, songAct, songRelease, mkSong, mdReview, curSong } from '../../src/systems/ext2.js';
import { viewCamp, fanHTML, fanSugs, releaseSingle, doSingle, holdConcert, produceFilm, actByKey } from '../../src/systems/releases.js';
import { preDo, postDo, postAuto, preAuto } from '../../src/systems/promo.js';
import { cbNow } from '../../src/systems/secretary.js';
import { genOffers } from '../../src/systems/offers.js';
const room = id => (openRoom(id), sheet());
add('t8-studio', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('studio'); out[n + 'Prev'] = document.getElementById('sPrev')?.innerHTML ?? null; }
  ctx.fresh(ctx.base); S.artists.forEach(a => { a.busy = null; }); // rival comeback, hiatus group, promo entries, trend variants
  S.rivals = S.rivals || []; if (S.rivals[0]) S.rivals[0].cb = { w: abs(), ck: 'cute', p: 6 };
  const g = S.groups[0]; if (g) g.hiatus = abs() + 3;
  const L = acts(); if (L[1]) S.camp[L[1].k] = { k: L[1].k, n: L[1].n, ph: 'post', t: 'Bài test', ck: 'cute', rank: 12, best: 5, wins: 2, stages: 3, wn: 1, used: { wk: abs(), l: [] }, hype: 10, inc: 5e6 };
  out.rival = room('studio'); out.rivalPrev = document.getElementById('sPrev')?.innerHTML ?? null;
  S.trend = { hot: ['cute', 'edm'], cold: 'ballad', until: abs() + 4 };
  const sel = document.getElementById('sCon'); const prevs = {};
  if (sel) for (const k of ['cute', 'ballad', 'retro']) { sel.value = k; sel.onchange(); prevs[k] = document.getElementById('sPrev').innerHTML; }
  out.prevs = prevs;
  const s1 = mkSong([S.artists.find(a => a.status === 'debuted').id], 'cute', 'Bài ok', false); s1.st = 'ok'; s1.rv = { g: 'A', mk: 70 }; s1.for = acts()[0] && acts()[0].k;
  const s2 = mkSong([S.artists.find(a => a.status === 'debuted').id], 'edm', 'Bài md', false); s2.st = 'ok'; s2.md = 1; s2.rv = null;
  out.withSongs = room('studio');
  const so = document.getElementById('sSong'); if (so) for (const s of [s1, s2]) { so.value = s.id; so.onchange(); out['song' + s.id] = document.getElementById('sPrev').innerHTML + '|' + document.getElementById('sTitle').value; }
  S.artists.forEach(a => { a.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; }); out.allBusy = room('studio');
  ctx.fresh(ctx.early); S.groups = []; S.artists.forEach(a => { a.solo = 0; }); out.noActs = room('studio');
  return out;
}, ['Bài test', 'Bài ok', 'Bài md', 'x']);
add('t8-acting', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('acting'); }
  ctx.fresh(ctx.base);
  const d = S.artists.find(a => a.status === 'debuted');
  S.films = [
    { id: 901, title: 'Phim A', genre: 'romance', own: true, budget: 3e8, share: 1, cost: 3e8, cast: [d.id], status: 'Đang quay', releaseAt: 0, done: false, y: 2 },
    { id: 902, title: 'Phim B', genre: 'action', own: false, budget: 8e8, share: .3, cost: 2.4e8, cast: [], status: 'Hậu kỳ', releaseAt: abs() + 2, done: false, y: 2 },
    { id: 903, title: 'Phim C', genre: 'horror', own: true, budget: 2e9, share: 1, cost: 2e9, cast: [d.id, 999999], status: 'Đã chiếu', releaseAt: 0, done: true, rev: 5e9, mult: 1.5, inc: 5e9, y: 2 }];
  out.films = room('acting');
  const sel = document.getElementById('fGen'); const fits = {}; for (const k of ['romance', 'horror', 'musical']) { sel.value = k; sel.onchange(); fits[k] = [...document.querySelectorAll('[data-f]')].map(e => e.textContent); } out.fits = fits;
  S.artists.forEach(a => { a.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; }); out.noCands = room('acting');
  return out;
}, ['Phim A', 'Phim B', 'Phim C', 'x']);
add('t8-songs', ctx => {
  const out = {};
  ctx.fresh(ctx.base); S.artists.forEach(a => { a.busy = null; a.scandal = null; }); S.songs = []; out.card0 = songCard(); out.opts0 = songOpts(); out.list0 = (viewSongs(), sheet());
  const ds = S.artists.filter(a => a.status === 'debuted'); const A = acts()[0];
  const mk = (st, ck, q) => { const s = mkSong([ds[0].id], ck, 'Bài ' + st + q, st === 'writing'); s.st = st; s.q = q; if (st === 'ok') s.rv = { g: 'B', mk: 55 }; if (st === 'used') { s.rank = 7; s.act = A ? A.n : '👥 X'; s.rv = { g: 'S', mk: 90 }; } return s; };
  const ss = [mk('review', 'cute', 90), mk('review', 'edm', 60), mk('review', 'ballad', 45), mk('ok', 'retro', 30), mk('used', 'hiphop', 10), mk('writing', 'crush', 50), mk('review', 'retro', 75), mk('review', 'retro', 60)];
  ss[3].for = A && A.k; ss[3].md = 1; ss[3].by = [];
  S.trend = { hot: ['cute'], cold: 'edm', until: abs() + 5 };
  out.card = songCard(); out.opts = songOpts(); out.list = (viewSongs(), sheet());
  ss.forEach((s, i) => { out['song' + i] = (viewSong(s.id), sheet()); out['rv' + i] = mdReview(s); });
  acts().forEach(z => campBusy(z, true)); out.songBusy = (viewSong(ss[0].id), sheet()); acts().forEach(z => campBusy(z, false)); const gs = S.groups, ar = S.artists.filter(a => a.solo); S.groups = []; S.artists.forEach(a => { a.solo = 0; }); out.songNoActs = (viewSong(ss[0].id), sheet()); S.groups = gs; ar.forEach(a => { a.solo = 1; });
  ss[0].rw = 2; out.song0max = (viewSong(ss[0].id), sheet());
  out.missing = (viewSong(424242), sheet());
  S.rivals = S.rivals || []; if (S.rivals[0]) S.rivals[0].cb = { w: abs(), ck: 'cute', p: 6 }; out.rivalSong = (viewSong(ss[0].id), sheet());
  // preview / compose form
  viewSongs(); const wm = document.getElementById('wMain'); out.wprev0 = document.getElementById('wPrev').innerHTML;
  const boxes = [...document.querySelectorAll('.wco')]; boxes.slice(0, 1).forEach(b => { b.checked = true; }); wPrev(); out.wprev1 = document.getElementById('wPrev').innerHTML;
  boxes.forEach(b => { b.checked = true; }); wPrev(); out.wprev3 = document.getElementById('wPrev').innerHTML;
  boxes.forEach(b => { b.checked = false; }); S.artists.forEach(a => S.artists.forEach(b => { if (a !== b) a.tag[b.id] = 'enemy'; })); boxes.slice(0, 2).forEach(b => { b.checked = true; }); wPrev(); out.wprevEnemy = document.getElementById('wPrev').innerHTML; S.artists.forEach(a => { a.tag = {}; });
  boxes.forEach(b => { b.checked = false; }); const t0 = S.trend; S.trend = null; wPrev(); out.wprevNoTrend = document.getElementById('wPrev').innerHTML; S.trend = t0;
  out.songPrevBuy = songPrev(A || { m: [] });
  openRoom('studio'); const so = document.getElementById('sSong'); so.value = ss[3].id; out.songPrevOwn = songPrev(A || { m: [] });
  ctx.fresh(ctx.early); out.earlyList = (viewSongs(), sheet()); out.earlyCard = songCard();
  return out;
}, ['Bài review90', 'Bài review60', 'Bài review45', 'Bài ok30', 'Bài used10', 'Bài writing50', 'Bài review75']);
add('t8-camp', ctx => {
  const out = {};
  ctx.fresh(ctx.base); S.artists.forEach(a => { a.busy = null; });
  const L = acts(); const x = L[0];
  out.pre = (viewCamp(x.k), sheet());
  S.camp[x.k] = { k: x.k, n: x.n, ph: 'pre', hype: 24, done: { sched: abs(), photo: abs() } }; out.preDone = (viewCamp(x.k), sheet());
  S.cbPlan = [{ k: x.k, w: abs() + 3 }]; out.prePlanned = (viewCamp(x.k), sheet()); S.cbPlan = [];
  S.money = 5e6; out.preBroke = (viewCamp(x.k), sheet()); S.money = 1e10;
  campBusy(x, true); out.preBusy = (viewCamp(x.k), sheet()); campBusy(x, false);
  S.camp[x.k] = { k: x.k, n: x.n, ph: 'post', t: 'Bài test', ck: 'cute', rank: 12, best: 5, wins: 2, stages: 3, wn: 1, used: { wk: abs(), l: ['s1', 'radio'] }, hype: 10, inc: 5e6 };
  out.post = (viewCamp(x.k), sheet());
  x.m.forEach(id => { byId(id).energy = 5; }); out.postTired = (viewCamp(x.k), sheet());
  S.autoPromo = false; out.postNoAuto = (viewCamp(x.k), sheet());
  out.fanHTML = fanHTML(); out.sugs = fanSugs().map(f => ({ ...f }));
  S.fmHint = { [x.k]: abs() }; S.fmLast = {}; out.fanHint = fanHTML();
  ctx.fresh(ctx.base); S.artists.filter(a => a.status === 'debuted').forEach((a, i) => { a.lastLive = -9; a.lastFan = i % 2 ? 0 : abs() - 7; a.mood = i === 0 ? 20 : 80; if (i === 1) a.scandal = { t: 'x', sev: 1, left: 2, truth: true, dating: false, other: 0 }; a.busy = null; a.fans = 5e5; });
  S.fmLast = {}; out.fanVariants = fanHTML(); out.sugs2 = fanSugs().map(f => f.why);
  acts().forEach(z => { S.fmLast[z.k] = abs() - 20; }); out.fanGap = fanHTML(); out.sugs3 = fanSugs().map(f => f.why);
  S.artists.forEach(a => { a.lastLive = abs(); }); acts().forEach(z => { S.fmLast[z.k] = abs(); }); out.fanNone = fanHTML();
  ctx.fresh(ctx.early); out.earlyNone = fanHTML();
  return out;
}, ['Bài test', 'x']);
function campBusy(x, on) { x.m.forEach(id => { byId(id).busy = on ? { kind: 'x', title: 'x', left: 2, total: 2 } : null; }); }
add('t8-toasts', ctx => {
  const out = {}, T = (n, b, f) => { out[n] = toastOf(ctx, b, f); };
  const B = ctx.base;
  const A = () => acts()[0];
  const free = x => x.m.forEach(id => { const a = byId(id); a.busy = null; a.energy = 100; });
  const form = () => { S.artists.forEach(a => { if (!a.scandal) a.busy = null; }); openRoom('studio'); return document.getElementById('sAct') ? 1 : 0; };
  T('single.none', B, () => { form(); document.getElementById('sAct').value = ''; releaseSingle(); });
  T('single.hiatus', B, () => { const x = A(); free(x); S.groups[0].hiatus = abs() + 3; doSingle(x.k, 'cute', 1e6, 't', false, 0); });
  T('single.busy', B, () => { const x = A(); campBusy(x, true); doSingle(x.k, 'cute', 1e6, 't', false, 0); });
  T('single.money', B, () => { const x = A(); free(x); S.money = 0; form(); document.getElementById('sAct').value = x.k; releaseSingle(); });
  T('concert.none', B, () => { form(); holdConcert('zzz'); });
  T('concert.fans', B, () => { const x = A(); free(x); x.m.forEach(id => { byId(id).fans = 0; }); holdConcert(x.k); });
  T('concert.busy', B, () => { const x = A(); free(x); x.m.forEach(id => { byId(id).fans = 1e6; }); byId(x.m[0]).busy = { kind: 'x', title: 'x', left: 2, total: 2 }; holdConcert(x.k); });
  T('concert.hiatus', B, () => { const x = A(); free(x); x.m.forEach(id => { byId(id).fans = 1e6; }); const g = S.groups.find(z => 'g' + z.id === x.k); if (g) g.hiatus = abs() + 3; holdConcert(x.k); });
  T('concert.money', B, () => { const x = A(); free(x); x.m.forEach(id => { byId(id).fans = 1e6; }); S.money = 100e6; holdConcert(x.k); });
  T('film.none', B, () => { openRoom('acting'); document.querySelectorAll('.fcast').forEach(c => { c.checked = false; }); produceFilm(); });
  T('film.many', B, () => { S.artists.forEach(a => { if (a.status === 'debuted') a.busy = null; }); const ds = S.artists.filter(a => a.status === 'debuted'); while (ds.length < 4) { const c = structuredClone(ds[0]); c.id = uid(); S.artists.push(c); ds.push(c); } openRoom('acting'); document.querySelectorAll('.fcast').forEach(c => { c.checked = true; }); produceFilm(); });
  T('film.money', B, () => { S.artists.forEach(a => { if (a.status === 'debuted') a.busy = null; }); openRoom('acting'); document.querySelectorAll('.fcast')[0].checked = true; S.money = 0; produceFilm(); });
  T('song.nomain', B, () => { viewSongs(); document.getElementById('wMain').value = ''; writeSong(); });
  T('song.many', B, () => { S.artists.forEach(a => { a.busy = null; }); S.money = 1e10; viewSongs(); const bx = [...document.querySelectorAll('.wco')]; bx.forEach(b => { b.checked = true; }); writeSong(); });
  T('song.busy', B, () => { S.artists.forEach(a => { a.busy = null; }); viewSongs(); const m = byId(+document.getElementById('wMain').value); m.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; writeSong(); });
  T('song.money', B, () => { S.artists.forEach(a => { a.busy = null; }); S.money = 0; viewSongs(); writeSong(); });
  T('song.redoMoney', B, () => { const s = mkSong([S.artists[0].id], 'cute', 'x', false); S.money = 0; songAct(s.id, 'redo'); });
  T('song.redoMax', B, () => { const s = mkSong([S.artists[0].id], 'cute', 'x', false); s.rw = 2; S.money = 1e10; songAct(s.id, 'redo'); });
  T('song.releaseBusy', B, () => { const s = mkSong([S.artists[0].id], 'cute', 'x', false); s.st = 'ok'; const x = A(); campBusy(x, true); songRelease(s.id, x.k); });
  T('promo.preBusy', B, () => { const x = A(); campBusy(x, true); preDo(x.k, 'photo'); });
  T('promo.preInPost', B, () => { const x = A(); free(x); S.camp[x.k] = { k: x.k, n: x.n, ph: 'post', t: 'x', ck: 'cute', rank: 5, best: 5, wins: 0, stages: 0, wn: 0, used: { wk: abs(), l: [] }, hype: 0, inc: 0 }; preDo(x.k, 'photo'); });
  T('promo.preDone', B, () => { const x = A(); free(x); S.camp = {}; S.camp[x.k] = { k: x.k, n: x.n, ph: 'pre', hype: 0, done: { photo: abs() } }; preDo(x.k, 'photo'); });
  T('promo.preMoney', B, () => { const x = A(); free(x); S.camp = {}; S.money = 0; preDo(x.k, 'photo'); });
  T('promo.preTired', B, () => { const x = A(); free(x); S.camp = {}; byId(x.m[0]).energy = 3; preDo(x.k, 'photo'); });
  T('promo.postTwice', B, () => { const x = A(); free(x); S.camp[x.k] = { k: x.k, n: x.n, ph: 'post', t: 'x', ck: 'cute', rank: 5, best: 5, wins: 0, stages: 0, wn: 0, used: { wk: abs(), l: ['s1'] }, hype: 0, inc: 0 }; postDo(x.k, 's1'); });
  T('promo.postTired', B, () => { const x = A(); free(x); S.camp[x.k] = { k: x.k, n: x.n, ph: 'post', t: 'x', ck: 'cute', rank: 5, best: 5, wins: 0, stages: 0, wn: 0, used: { wk: abs(), l: [] }, hype: 0, inc: 0 }; byId(x.m[0]).energy = 3; postDo(x.k, 's1'); });
  T('promo.postAutoTired', B, () => { const x = A(); free(x); S.camp[x.k] = { k: x.k, n: x.n, ph: 'post', t: 'x', ck: 'cute', rank: 5, best: 5, wins: 0, stages: 0, wn: 0, used: { wk: abs(), l: [] }, hype: 0, inc: 0 }; x.m.forEach(id => { byId(id).energy = 20; }); postAuto(x.k); });
  T('promo.preAuto', B, () => { const x = A(); free(x); S.camp = {}; S.money = 0; preAuto(x.k); });
  return out;
});

// ---------------- task 9: sales & finance, HR, contracts, health specialist ----------------
import { renewEval, renewBlock, renewOpts, renewDo, viewRenew, finChart, catRows, repCard, repStars, FIN_I, FIN_X, ctInit } from '../../src/systems/ext2.js';
import { hsHTML, hsHire, hsApply, genHSC } from '../../src/systems/ext3.js';
const deb = () => S.artists.filter(a => a.status === 'debuted');
add('t9-sales', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('sales'); }
  ctx.fresh(ctx.base);
  const ds = deb(), A = acts()[0];
  S.singles.forEach(s => { s.dig = 1; s.end = 0; s.dl = 3e6; s.dt = 9e6; s.roy = 0; s.rank = 4; s.w = abs() - 3; });
  if (S.singles[0]) { S.singles[0].roy = .15; S.singles[0].dl = 1e6; }
  if (S.singles[1]) S.singles[1].end = 1;
  ds.forEach((a, i) => { a.earn = (i + 1) * 5e6; });
  S.fc = { w: abs(), m0: S.money, i: { dig: 5e6, oth: 1e6, zzz: 2e6 }, x: { sal: 3e6, mgr: 1e6, trn: 1e6, prod: 2e6, hr: 1e6, oth: 1e5 } };
  out.rich = room('sales');
  S.fin = S.fin.map((f, i) => ({ ...f, i: { dig: 4e6, sgl: 3e6, job: 2e6, con: 1e6, film: 1e6, live: 1e6, biz: 1e6, oth: 1e6 }, x: { sal: 5e6, mgr: 2e6, trn: 1e6, prod: 3e6, hr: 1e6, oth: 1e6 } }));
  out.ledger = room('sales');
  S.singles = []; S.artists.forEach(a => { a.earn = 0; }); S.fin = []; S.fc = { w: abs(), m0: S.money, i: {}, x: {} };
  out.empty = room('sales');
  out.chart0 = finChart([]); out.chart1 = finChart([{ wk: 3, i: { dig: 1e6 }, x: { sal: 2e6 } }]); out.catEmpty = catRows({}, FIN_I, 'red'); out.catUnknown = catRows({ dig: 1, zz: 3 }, FIN_X, 'blue');
  return out;
});
add('t9-hr', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('hr'); }
  ctx.fresh(ctx.base);
  const ds = deb(); ds.forEach(ctInit);
  if (ds[0]) { ds[0].ce = abs() + 5; ds[0].ceNo = 1; }
  if (ds[1]) ds[1].ce = abs() + 30;
  if (ds[2]) { ds[2].ce = abs() + 3; ds[2].mood = 20; ds[2].scandal = { t: 'x', sev: 1, left: 2, truth: true, dating: false, other: 0 }; }
  S.assts = [{ id: 1, name: 'Trợ Lý A', mid: S.managers[0] ? S.managers[0].id : 0, k: 'nego', v: 3, sal: 2e6 }, { id: 2, name: 'Trợ Lý B', mid: 424242, k: 'care', v: 2, sal: 1e6 }];
  out.rich = room('hr');
  S.artists.forEach(a => { if (a.status === 'trainee') a.mt = null; });
  const tr = S.artists.find(a => a.status === 'trainee'); if (ds[0] && tr) { tr.mt = ds[0].id; }
  out.mentor = room('hr');
  S.assts = []; S.artists = S.artists.filter(a => a.status !== 'trainee'); out.noTts = room('hr');
  S.artists = S.artists.filter(a => a.status !== 'debuted'); out.noDeb = room('hr');
  out.stars = [0, 24, 25, 50, 75, 99, 150].map(repStars); out.repCard = repCard();
  return out;
}, ['Trợ Lý A', 'Trợ Lý B', 'x']);
add('t9-renew', ctx => {
  const out = {};
  ctx.fresh(ctx.base);
  const ds = deb(); ds.forEach(ctInit); const a = ds[0];
  a.ce = abs() + 6; a.earnC = 0; a.salary = 2e6; a.mood = 80; a.scandal = null; a.evG = null; a.evFail = 0;
  out.plain = [renewEval(a), renewEval(a, 1.3)].map(e => ({ ...e }));
  out.block = renewBlock(a); out.block13 = renewBlock(a, 1.3); out.none = renewBlock(null);
  const var1 = (k, f) => { f(); out[k] = { ev: renewEval(a), blk: renewBlock(a), opts: renewOpts(a) }; };
  var1('great', () => { a.earnC = 5e9; a.fans = a.fans * 3 + 1e5; a.evG = 'Xuất sắc'; a.evFail = 0; });
  var1('good-evFail', () => { a.evG = 'Đạt'; a.evFail = 2; });
  var1('bad', () => { a.earnC = 0; a.cf0 = a.fans * 2 + 1e5; a.evG = 'Không đạt'; a.evFail = 3; a.scandal = { t: 'x', sev: 1, left: 2, truth: true, dating: false, other: 0 }; a.mood = 20; });
  out.optsSix = renewOpts(a, 1.3);
  a.scandal = null; a.mood = 70; a.ce = abs() + 6; a.ceNo = 0;
  S.events = []; out.view = (viewRenew(a.id), sheet());
  a.ceNo = 1; out.viewNo = (viewRenew(a.id), sheet()); a.ceNo = 0;
  S.events.push({ kind: 'renew', a: a.id, mul: 1.3 }); out.view13 = (viewRenew(a.id), sheet());
  out.missing = (viewRenew(424242), document.getElementById('sheet') ? sheet() : null);
  return out;
}, ['x', 'Xuất sắc', 'Đạt', 'Không đạt']);
add('t9-gym', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('gym'); out[n + 'Html'] = hsHTML(); }
  ctx.fresh(ctx.base);
  S.hs = null; S.hsC = null; out.cands = room('gym');
  S.hs = { id: 9100, name: 'BS. Test', sk: 3, sal: 4e6, fee: 24e6, look: S.hsC ? S.hsC[0].look : S.managers[0].look };
  S.hsC = null; out.hired = room('gym');
  const ds = S.artists.slice(0, 3); const mg = S.managers[0];
  ds.forEach((a, i) => { a.hsF = { w: abs(), why: ['năng lượng chỉ còn 20', 'tâm trạng xuống 25'].slice(0, i + 1), n: 3, st: i === 1 ? 'ok' : 'new' }; });
  out.flagged = room('gym');
  return out;
}, ['BS. Test', 'năng lượng chỉ còn 20', 'tâm trạng xuống 25']);
add('t9-toasts', ctx => {
  const out = {}, T = (n, b, f) => { out[n] = toastOf(ctx, b, f); };
  const B = ctx.base;
  T('renew.money', B, () => { const a = deb()[0]; ctInit(a); a.ce = abs() + 5; S.money = 0; renewDo(a.id, 'r1'); });
  T('renew.money3', B, () => { const a = deb()[0]; ctInit(a); S.money = 1; renewDo(a.id, 'r3', 1.3); });
  T('hs.money', B, () => { S.hs = null; S.hsC = [{ id: 9100, name: 'BS. X', sk: 3, sal: 1e6, fee: 50e6 }]; S.money = 0; hsHire(9100); });
  return out;
});

// ---------------- task 10: market, investment, CEO office, PR room ----------------
import { BIZ, setMod, buyBiz, upBiz, raiseBiz, buybackBiz } from '../../src/systems/market.js';
import { prPlans, prHTML, prGo, prDo, evalTable } from '../../src/systems/review.js';
import { invStart, invOpen, invBuy, viewInv, invBlock, invVerdict, invRec, LEADS, pushEv } from '../../src/systems/events.js';
const scand = (a, o = {}) => { a.scandal = { t: 'Tin đồn thái độ', sev: 2, left: 4, truth: true, dating: false, other: 0, ...o }; if (!S.events.some(e => e.kind === 'scandal' && e.a === a.id)) pushEv({ kind: 'scandal', a: a.id }, true); return a; };
add('t10-invest', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('invest'); }
  ctx.fresh(ctx.base);
  S.biz = [{ k: 'cafe', lv: 2, inv: 150e6, tot: 12e6, last: 3e6, y: 1, own: .7, rw: abs() - 1 }, { k: 'game', lv: 5, inv: 900e6, tot: -5e6, last: -4e6, y: 1 }, { k: 'estate', lv: 1, inv: 1200e6, tot: 0, last: 0, y: 1, own: .9, rw: abs() - 20 }];
  S.loan = { pay: 5e6, left: 12, n: 'Quỹ Sao Mai' }; setMod('econ', .7, 6, 'Suy thoái: kinh doanh −30%');
  out.rich = room('invest');
  S.biz = Object.keys(BIZ).map(k => ({ k, lv: 1, inv: BIZ[k].cost, tot: 1, last: 1e6, y: 1 })); S.loan = null; S.mods = {}; out.all = room('invest');
  S.biz = []; out.none = room('invest');
  return out;
}, ['Quỹ Sao Mai', 'Suy thoái: kinh doanh −30%']);
add('t10-market', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('market'); }
  ctx.fresh(ctx.base);
  S.mods = { fan: { v: 1.6, until: abs() + 3, n: 'Làn sóng K-pop: fan tăng nhanh' }, pay: { v: .8, until: abs() + 5, n: 'Suy thoái: thù lao −20%' } };
  S.rivals.forEach((r, i) => { r.f0 = r.fans * (i ? 1.2 : .8); r.stole = i; r.last = i === 1 ? 'Dính scandal, mất 10% fan' : ''; r.cb = i === 0 ? { w: abs(), t: 'Bài X', ck: 'cute', p: 3, rank: 5 } : null; });
  out.rich = room('market');
  S.rivals.forEach(r => { r.fans = 1; r.cb = null; r.stole = 0; r.last = ''; r.f0 = 1; }); S.mods = {}; out.top = room('market'); // player on top, no mods
  return out;
}, ['Làn sóng K-pop: fan tăng nhanh', 'Suy thoái: thù lao −20%', 'Bài X', 'Dính scandal, mất 10% fan']);
add('t10-ceo', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('ceo'); }
  ctx.fresh(ctx.base);
  S.partners = { 'Đài ABC': 3, 'Hãng XYZ': 5 };
  S.awards = [{ y: 1, rank: 2, res: [{ ok: 1, cat: 'Nhóm mới xuất sắc', note: 'n' }, { ok: 0, cat: 'Bài hát của năm', note: 'n' }] }, { y: 2, rank: 4, res: [{ ok: 0, cat: 'Bài hát của năm', note: 'n' }] }];
  S.lastEval = { w: 8, y: 1, wk: 8, t: [{ id: 1, n: 'Test A', g: 'Đạt', p: 25, f: 0 }], a: [{ id: 2, n: 'Test B', g: 'Xuất sắc', pts: 30, f: 0, money: -5e6 }] };
  out.rich = room('ceo');
  S.artists = []; S.groups = []; S.partners = {}; S.awards = []; S.lastEval = null; out.empty = room('ceo');
  return out;
}, ['Đài ABC', 'Hãng XYZ', 'Nhóm mới xuất sắc', 'Bài hát của năm', 'Test A', 'Test B', 'Đạt', 'Xuất sắc', 'n']);
add('t10-eval', ctx => {
  ctx.fresh(ctx.base);
  const T = (g, p, f, out) => ({ id: 1, n: 'TTS ' + g, g, p, f, ...(out ? { out } : {}) }), A = (g, pts, f, money, out) => ({ id: 2, n: 'NS ' + g, g, pts, f, money, ...(out ? { out } : {}) });
  const E = { w: 8, y: 1, wk: 8, t: [T('Xuất sắc', 40, 0), T('Tốt', 30, 0), T('Đạt', 22, 0), T('Không đạt', 3, 2), T('Không đạt', -2, 5, 1)], a: [A('Xuất sắc', 30, 0, -5e6), A('Đạt', 7, 0, 0), A('Không đạt', -3, 2, 2e6), A('Không đạt', -9, 10, 1e6, 1)] };
  return { full: evalTable(E), none: evalTable(null), ttsOnly: evalTable({ ...E, a: [] }), artOnly: evalTable({ ...E, t: [] }) };
}, ['TTS Xuất sắc', 'TTS Tốt', 'TTS Đạt', 'TTS Không đạt', 'NS Xuất sắc', 'NS Đạt', 'NS Không đạt', 'Xuất sắc', 'Tốt', 'Đạt', 'Không đạt']);
add('t10-pr', ctx => {
  const out = {}, A = () => acts()[0], free = x => x.m.forEach(id => { const a = byId(id); a.busy = null; a.energy = 100; a.scandal = null; });
  const snap = k => { const L = prPlans(); out[k] = { plans: L.map(p => ({ ic: p.ic, t: p.t, why: p.why, cost: p.cost, go: p.go, hot: p.hot || 0 })), html: prHTML(L), room: room('pr') }; };
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('pr'); }
  ctx.fresh(ctx.base); let x = A(); free(x); S.camp = {}; S.cbPlan = []; S.singles.forEach(s => { s.w = abs() - 12; });
  snap('gap');
  S.singles = []; snap('nosingle');
  S.cbPlan = [{ k: x.k, w: abs() + 2 }]; snap('cbplan');
  S.cbPlan = []; S.camp[x.k] = { k: x.k, n: x.n, ph: 'pre', t: 'x', ck: 'cute', rank: 5, best: 5, wins: 0, stages: 0, wn: 0, used: { wk: abs() - 3, l: [] }, hype: 20, inc: 0 }; snap('pre');
  S.camp[x.k] = { k: x.k, n: x.n, ph: 'post', t: 'Bài X', ck: 'cute', rank: 5, best: 5, wins: 0, stages: 0, wn: 0, used: { wk: abs() - 3, l: [] }, hype: 0, inc: 0 }; snap('post');
  S.camp = {}; byId(x.m[0]).scandal = { t: 'Tin đồn', sev: 1, left: 3, truth: false, dating: false, other: 0 }; snap('press');
  byId(x.m[0]).scandal = null; S.singles = [{ k: x.k, act: x.n, w: abs() - 6, t: 'Bài Y', rank: 5 }]; S.artists.forEach(a => { a.st.visual = 80; }); snap('mag');
  S.artists.forEach(a => { if (a.status !== 'trainee') a.actor = 1; a.wantAct = 1; }); snap('actor');
  S.prUsed = { 'sns:g1': abs() }; S.prHist = ['T3: Chạy quảng cáo SNS cho Test']; out.hist = room('pr');
  S.prUsed = {}; S.prHist = [];
  return out;
}, ['Bài X', 'Bài Y', 'Tin đồn', 'Tin đồn thái độ', 'T3: Chạy quảng cáo SNS cho Test']);
add('t10-inv', ctx => {
  const out = {}, ds = () => S.artists.filter(a => a.status === 'debuted');
  ctx.fresh(ctx.base); const a = scand(ds()[0]);
  S.money = 1e10; out.block0 = invBlock(a); out.closed = (viewInv(424242), sheet());
  invStart(a.id); out.opened = sheet(); out.prEv = room('pr'); out.block1 = invBlock(a);
  for (let i = 0; i < 6; i++) { invOpen(a.id, i); } out.some = sheet();
  invBuy(a.id); out.bought = sheet();
  out.verdicts = [0.1, 0.5, 0.9].map(p => ({ ...invVerdict(p), rec: [invRec(invVerdict(p).v, false), invRec(invVerdict(p).v, true)] }));
  a.scandal.inv.p = .9; out.sure = sheet(); viewInv(a.id); out.sureV = sheet(); a.scandal.inv.p = .1; viewInv(a.id); out.falseV = sheet();
  S.events = S.events.filter(e => e.kind !== 'scandal'); viewInv(a.id); out.silent = sheet();
  a.scandal.inv.ap = 0; a.scandal.inv.leads.forEach(L => { L.open = false; }); viewInv(a.id); out.noap = sheet();
  out.pr = room('pr');
  return out;
}, ['Tin đồn thái độ']);
add('t10-toasts', ctx => {
  const out = {}, T = (n, b, f) => { out[n] = toastOf(ctx, b, f); };
  const B = ctx.base, ds = () => S.artists.filter(a => a.status === 'debuted'), x0 = () => acts()[0];
  T('prDo.money', B, () => { S.money = 0; prDo('sns', x0().k); });
  T('invStart.money', B, () => { S.money = 0; invStart(scand(ds()[0]).id); });
  T('invOpen.noap', B, () => { S.money = 1e10; const a = scand(ds()[0]); invStart(a.id); a.scandal.inv.ap = 0; invOpen(a.id, 0); });
  T('invBuy.money', B, () => { S.money = 1e10; const a = scand(ds()[0]); invStart(a.id); S.money = 0; invBuy(a.id); });
  T('buyBiz.money', B, () => { S.biz = []; S.money = 0; buyBiz('cafe'); });
  T('upBiz.money', B, () => { S.biz = [{ k: 'cafe', lv: 1, inv: 150e6, tot: 0, last: 0, y: 1 }]; S.money = 0; upBiz('cafe'); });
  T('raiseBiz.51', B, () => { S.biz = [{ k: 'cafe', lv: 1, inv: 150e6, tot: 0, last: 0, y: 1, own: .55 }]; raiseBiz('cafe', .1); });
  T('raiseBiz.wait', B, () => { S.biz = [{ k: 'cafe', lv: 1, inv: 150e6, tot: 0, last: 0, y: 1, rw: abs() - 2 }]; raiseBiz('cafe', .1); });
  T('buyback.money', B, () => { S.biz = [{ k: 'cafe', lv: 1, inv: 150e6, tot: 0, last: 0, y: 1, own: .7 }]; S.money = 0; buybackBiz('cafe'); });
  return out;
}, ['Tin đồn thái độ']);
add('t10-prgo', ctx => { // prGo stores the Vietnamese data-t in S.prHist whatever the language
  ctx.fresh(ctx.base); const x = acts()[0]; x.m.forEach(id => { const a = byId(id); a.busy = null; a.energy = 100; }); S.camp = {}; S.singles = []; S.prHist = [];
  const L = prPlans(), out = { dataT: L.map(p => p.t) };
  const d = document.createElement('div'); d.innerHTML = prHTML(L); const b = d.querySelector('button[data-t]');
  Object.assign(globalThis, { prDo }); S.money = 1e10; if (b) { out.btnT = b.dataset.t; prGo(b); } out.hist = S.prHist.slice(); out.sheetAfter = null;
  return out;
}, [], ['dataT', 'btnT', 'hist']);

// ---------------- task 11: meeting room, offers, proposals, secretary ----------------
import { OFFER, PARTNERS } from '../../src/data/offers.js';
import { GENRES } from '../../src/data/rules.js';
import { canTake, acceptCast, acceptSel, ocPrev, ocPick, investOffer } from '../../src/systems/offers.js';
import { buildProps, viewProps, itDesc, stTag, propOk, cfPick, CFT } from '../../src/systems/proposals.js';
import { secPlan, secPlans, secSchedRec, viewSec, cbNow, cbSched, cbSchedRec, BUDN } from '../../src/systems/secretary.js';
const mkOffer = (o = {}) => { const type = o.type || 'drama', O = OFFER[type], genre = O.film ? (o.genre || 'romance') : null;
  const of = { id: uid(), type, partner: PARTNERS[type][0], genre, w: genre ? GENRES[genre].w : O.req, req: O.film ? { acting: 20, visual: 10 } : { ...O.req }, L: 20, fame: 0, weeks: 3, pay: 50e6, costar: null, exp: abs() + 3, title: 'Dự án thử ' + type, target: null, invest: null, invested: false, slots: 1, ...o };
  Object.keys(of.req).forEach(k => { of.req[k] = Math.min(of.req[k], 20); }); S.offers.push(of); return of; };
const trn = () => S.artists.filter(a => a.status === 'trainee');
add('t11-meet', ctx => {
  const out = {};
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); out[n] = room('meet'); }
  ctx.fresh(ctx.base);
  const ds = deb(); S.offers = []; S.partners = { [PARTNERS.drama[0]]: 40, [PARTNERS.movie[0]]: 10 };
  mkOffer({ type: 'drama', slots: 3, target: ds[0].id, invest: { budget: 6e8, share: .1 }, costar: 'Test Costar', fame: 3 });
  mkOffer({ type: 'movie', genre: 'action', slots: 1, invest: { budget: 9e8, share: .2 }, invested: true, costar: 'Test Costar' });
  mkOffer({ type: 'variety', slots: 2, req: { variety: 15 }, fame: 90 });
  mkOffer({ type: 'music', slots: 1, target: ds[1] ? ds[1].id : null, req: { vocal: 5, dance: 5 } });
  mkOffer({ type: 'backup', slots: 1, req: { dance: 5 } }); mkOffer({ type: 'guide', slots: 2, target: trn()[0] ? trn()[0].id : null, req: { vocal: 5 } });
  S.events = [{ id: 901, kind: 'x' }]; // only the count is shown
  if (ds[2]) ds[2].scandal = { t: 'x', sev: 2, left: 2, truth: true, dating: false, other: 0 };
  if (ds[3]) ds[3].energy = 5;
  out.rich = room('meet');
  mkOffer({ type: 'music', slots: 1, req: { vocal: 9999 }, fame: 99999 }); out.lacks = room('meet');
  S.artists.forEach(a => { a.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; }); out.noFree = room('meet');
  S.offers = []; S.events = []; out.noOffers = room('meet');
  return out;
}, ['Dự án thử drama', 'Dự án thử movie', 'Dự án thử variety', 'Dự án thử music', 'Dự án thử backup', 'Dự án thử guide', 'Test Costar', 'x', ...['drama', 'movie', 'variety', 'music', 'backup', 'guide'].map(k => PARTNERS[k][0])]);
add('t11-meet-sec', ctx => { // the secretary card of the meeting room in several secretary states
  const out = {}, A = () => acts()[0], free = x => x.m.forEach(id => { const a = byId(id); a.busy = null; a.energy = 100; a.scandal = null; });
  ctx.fresh(ctx.base); const x = A(); free(x); S.cbPlan = []; S.camp = {}; S.singles = []; S.rivals.forEach(r => { r.cb = null; });
  out.ready = room('meet');
  S.cbPlan = [{ k: x.k, n: x.n, w: abs() + 3, ck: 'cute', bud: 80e6, tries: 0 }]; out.planned = room('meet');
  S.cbPlan = []; S.camp[x.k] = { k: x.k, n: x.n, ph: 'post', t: 'Bài X', ck: 'cute', rank: 5, best: 5, wins: 1, stages: 1, wn: 1, used: { wk: abs() - 3, l: [] }, hype: 0, inc: 0 }; out.post = room('meet');
  S.camp = {}; S.singles = [{ k: x.k, act: x.n, w: abs() - 2, t: 'Bài Y', rank: 5 }]; out.recent = room('meet');
  S.cbPlan = []; byId(x.m[0]).busy = { kind: 'offer', title: 'Dự án bận', left: 3, total: 3 }; S.singles = []; out.waitSched = room('meet');
  return out;
}, ['Bài X', 'Bài Y', 'Dự án bận']);
add('t11-reasons', ctx => { // every canTake reason, and the checkbox/preview helpers
  ctx.fresh(ctx.base); S.offers = []; const out = {}, ds = deb(), a = ds[0], t0 = trn()[0], x = acts()[0];
  const of = mkOffer({ type: 'drama', slots: 1 }), tof = mkOffer({ type: 'backup', slots: 1, req: { dance: 5 } });
  a.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; out.busy = canTake(of, a); a.busy = null;
  if (t0) { t0.dReady = 1; t0.noHold = false; out.hold = canTake(tof, t0); t0.dReady = 0; out.notDebuted = canTake(of, t0); }
  of.target = ds[1].id; out.other = canTake(of, a); of.target = null;
  a.scandal = { t: 'x', sev: 2, left: 2, truth: true, dating: false, other: 0 }; out.scandal = canTake(of, a); a.scandal = null;
  S.cbPlan = [{ k: x.k, n: x.n, w: abs() + 1, ck: 'cute', bud: 80e6, tries: 0 }]; const mem = byId(x.m[0]); of.weeks = 5; out.cbHold = canTake(of, mem); S.cbPlan = []; of.weeks = 3;
  of.fame = 9999; out.fame = canTake(of, a); of.fame = 0;
  of.req = { vocal: 9999 }; out.lack = canTake(of, a); of.req = { acting: 1 };
  out.ok = canTake(of, a);
  return out;
});
add('t11-oc', ctx => { // multi-slot checkbox preview and the suggested cast
  ctx.fresh(ctx.base); S.offers = []; const out = {}, ds = deb(); ds.forEach(a => { a.busy = null; a.energy = 100; a.scandal = null; });
  const of = mkOffer({ type: 'drama', slots: 3, target: ds[0].id, req: { acting: 1 } }); room('meet');
  const prev = () => { const e = document.getElementById('ocp' + of.id); return e ? e.innerHTML : null; };
  out.start = prev(); const bx = [...document.querySelectorAll('.oc' + of.id)];
  out.boxes = bx.length;
  bx.slice(0, 2).forEach(b => { b.checked = true; }); ocPrev(of.id, bx[1]); out.two = prev();
  bx.forEach(b => { b.checked = true; }); ocPrev(of.id, bx[bx.length - 1]); out.over = prev();
  bx.forEach(b => { b.checked = false; }); ocPick(of.id); out.picked = prev();
  return out;
});
add('t11-props', ctx => {
  ctx.fresh(ctx.base); S.offers = []; const out = {}, ds = deb(), tr = trn()[0], ms = nonGm();
  if (ms.length < 2) return { skip: 'few managers' };
  const [m1, m2] = ms, of1 = mkOffer({ type: 'drama', slots: 2 }), of2 = mkOffer({ type: 'music', slots: 1, req: { vocal: 1 } });
  S.managers.forEach(m => { if (!m.gm) m.boss = null; }); m2.boss = m1.id;
  const sI = (a, ok, o = {}) => ({ a: a.id, days: ['vocal', 'dance', 'rest', 'rest', 'vocal'], why: 'bù Vocal (30)', ok, ...o });
  const P = { w: abs(), m: {}, c: [], st: { auto: 2, boss: { [m1.name]: 3 }, res: 1 } };
  P.m[m1.id] = { s: [sI(ds[0], 0, { cf: [1] }), sI(ds[1], 1, { by: 'Giám đốc' }), sI(ds[2], -2, { why2: 'Trùng người' }), sI(ds[3], -1), sI(ds[4] || ds[0], 0)], p: [{ of: of1.id, ids: [ds[0].id, ds[1].id], ok: 0, cf: [2, 3, 4, 5] }, { of: of2.id, ids: [ds[2].id], ok: 1, by: m1.name }, { of: 4242424, ids: [ds[3].id], ok: -2, why2: 'Quá sức' }, { of: of2.id, ids: [ds[4] ? ds[4].id : ds[0].id], ok: 0 }], d: tr ? [{ a: tr.id, t: 'group', txt: 'đủ điều kiện debut nhóm' }] : [] };
  P.m[m2.id] = { s: [sI(ds[0], 0, { cf: [1] })], p: [], d: [] };
  P.c = [{ id: 1, type: 'overlap', sev: 2, txt: 'Một nghệ sĩ được 2 quản lý xếp việc khác nhau', refs: [{ mid: m1.id, k: 's', i: 0 }, { mid: m2.id, k: 's', i: 0 }], path: [m1.name, 'Giám đốc'], pend: 1 },
    { id: 2, type: 'offer', sev: 1, txt: '2 quản lý cùng muốn nhận «x»', refs: [{ mid: m1.id, k: 'p', i: 0 }, { mid: m1.id, k: 'p', i: 3 }], path: ['Giám đốc'], pend: 1 },
    { id: 3, type: 'tired', sev: 1, txt: 'Vài người năng lượng thấp', refs: [{ mid: m1.id, k: 'p', i: 0 }], path: [m1.name, 'Giám đốc'], pend: 1 },
    { id: 4, type: 'enemy', sev: 1, txt: 'Đội hình có hai người mâu thuẫn', refs: [{ mid: m1.id, k: 'p', i: 0 }], path: ['Giám đốc'], pend: 1 },
    { id: 5, type: 'scandal', sev: 3, txt: 'Có người đang dính scandal', refs: [{ mid: m1.id, k: 'p', i: 0 }], path: ['Giám đốc'], pend: 1 },
    { id: 6, type: 'tired', sev: 1, txt: 'Lịch quá dày', refs: [], path: [m1.name], pend: 0, done: 1, by: m1.name },
    { id: 7, type: 'enemy', sev: 1, txt: 'Hai người mâu thuẫn', refs: [], path: [m1.name], pend: 0, done: 1, by: m1.name },
    { id: 8, type: 'scandal', sev: 3, txt: 'Dính scandal', refs: [], path: [m1.name], pend: 0, done: 1, by: m1.name },
    { id: 9, type: 'overlap', sev: 2, txt: 'Trùng người', refs: [], path: [m1.name], pend: 0, done: 1, by: m1.name }];
  S.props = P; S.autoAppr = true;
  viewProps(); out.full = sheet();
  const L = []; for (const c of P.c) for (const r of c.refs) { const it = P.m[r.mid] && P.m[r.mid][r.k][r.i]; if (it) L.push({ mid: r.mid, kind: r.k, i: r.i, x: it, arts: r.k === 's' ? [it.a] : it.ids }); }
  out.desc = L.slice(0, 6).map(itDesc); out.tags = [{ ok: 1, by: 'Giám đốc' }, { ok: 1 }, { ok: -2, why2: 'Trùng người' }, { ok: -2 }, { ok: -1 }, { ok: 0, cf: [1] }, { ok: 0 }].map(x => stTag(x));
  S.autoAppr = false; for (const m of S.managers) m.boss = null; S.props.c = []; S.props.st = { auto: 0, boss: {}, res: 0 }; viewProps(); out.plain = sheet();
  S.props = { w: abs(), m: {}, c: [], st: { auto: 0, boss: {}, res: 0 } }; viewProps(); out.empty = sheet();
  return out;
}, ['Giám đốc', 'bù Vocal (30)', 'Trùng người', 'Quá sức', 'đủ điều kiện debut nhóm', 'Dự án thử drama', 'Dự án thử music', '2 quản lý cùng muốn nhận «x»', 'Vài người năng lượng thấp', 'Đội hình có hai người mâu thuẫn', 'Có người đang dính scandal', 'Lịch quá dày', 'Hai người mâu thuẫn', 'Dính scandal', 'Một nghệ sĩ được 2 quản lý xếp việc khác nhau', 'đã có dự án']);
add('t11-sec', ctx => {
  const out = {}, A = () => acts()[0], free = x => x.m.forEach(id => { const a = byId(id); a.busy = null; a.energy = 100; a.scandal = null; });
  for (const [n, b] of [['base', ctx.base], ['early', ctx.early]]) { ctx.fresh(b); viewSec(); out[n] = sheet(); }
  ctx.fresh(ctx.base); const x = A(); free(x); S.cbPlan = []; S.camp = {}; S.singles = []; S.rivals.forEach(r => { r.cb = null; });
  const snap = k => { viewSec(); out[k] = sheet(); out[k + '.plan'] = JSON.stringify(secPlan(x).why); out[k + '.rec'] = JSON.stringify(secSchedRec().map(p => p.recWhy)); };
  snap('ready');
  S.singles = [{ k: x.k, act: x.n, w: abs() - 2, t: 'Bài Y', rank: 5 }]; byId(x.m[0]).energy = 30; snap('recent');
  byId(x.m[0]).energy = 100; byId(x.m[0]).busy = { kind: 'offer', title: 'Dự án bận', left: 3, total: 3 }; S.trend.until = abs() + 2; snap('busy');
  byId(x.m[0]).busy = null; S.singles = []; S.rivals[0].cb = { w: abs(), t: 'Bài Z', ck: S.trend.hot[0], p: 10, rank: 2 }; S.money = 1e6; snap('rival');
  S.rivals[0].cb = null; S.money = 5e9; S.cbPlan = [{ k: x.k, n: x.n, w: abs() + 2, ck: 'cute', bud: 80e6, tries: 0 }]; snap('planned');
  S.cbPlan = []; S.camp[x.k] = { k: x.k, n: x.n, ph: 'post', t: 'Bài X', ck: 'cute', rank: 5, best: 5, wins: 1, stages: 1, wn: 1, used: { wk: abs() - 3, l: [] }, hype: 0, inc: 0 }; snap('post');
  S.camp[x.k] = { k: x.k, n: x.n, ph: 'pre', t: 'x', ck: 'cute', rank: 5, best: 5, wins: 0, stages: 0, wn: 0, used: { wk: abs() - 3, l: [] }, hype: 30, inc: 0 }; S.singles = [{ k: x.k, act: x.n, w: abs() - 2, t: 'Bài Y', rank: 5 }]; snap('pre');
  S.camp = {}; S.singles = []; x.m.forEach(id => { byId(id).fans = 60000; }); S.concerts = []; snap('concert');
  return out;
}, ['Bài X', 'Bài Y', 'Bài Z', 'Dự án bận', 'x']);
add('t11-toasts', ctx => {
  const out = {}, T = (n, b, f) => { out[n] = toastOf(ctx, b, f); };
  const B = ctx.base, ds = () => deb();
  T('accept.none', B, () => { S.offers = []; const of = mkOffer({}); acceptCast(of.id, []); });
  T('accept.max', B, () => { S.offers = []; const of = mkOffer({ slots: 1 }); acceptCast(of.id, [ds()[0].id, ds()[1].id]); });
  T('accept.target', B, () => { S.offers = []; const of = mkOffer({ slots: 1, target: ds()[0].id }); acceptCast(of.id, [ds()[1].id]); });
  T('accept.reason', B, () => { S.offers = []; const of = mkOffer({ slots: 1, req: { acting: 1 }, fame: 9999 }); acceptCast(of.id, [ds()[0].id]); });
  T('accept.busy', B, () => { S.offers = []; const of = mkOffer({ slots: 1 }); const a = ds()[0]; a.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; acceptCast(of.id, [a.id]); });
  T('ocPrev.max', B, () => { S.offers = []; const of = mkOffer({ type: 'drama', slots: 2, req: { acting: 1 } }); ds().forEach(a => { a.busy = null; a.energy = 100; a.scandal = null; }); room('meet'); const bx = [...document.querySelectorAll('.oc' + of.id)]; bx.slice(0, 3).forEach(b => { b.checked = true; }); ocPrev(of.id, bx[2]); });
  T('invest.money', B, () => { S.offers = []; const of = mkOffer({ type: 'drama', invest: { budget: 6e9, share: .5 } }); S.money = 0; investOffer(of.id); });
  T('cbNow.cant', B, () => { const x = acts()[0]; x.m.forEach(id => { byId(id).busy = { kind: 'x', title: 'x', left: 3, total: 3 }; }); cbNow(x.k); });
  const pr = (kind, f) => { S.offers = []; const of = mkOffer({ type: 'drama', slots: 1, req: { acting: 1 } }); const a = ds()[0]; a.busy = null; const m = nonGm()[0];
    S.props = { w: abs(), m: { [m.id]: { s: [{ a: a.id, days: ['rest'], why: 'x', ok: 0, cf: [1] }], p: [{ of: kind === 'gone' ? 99999 : of.id, ids: [a.id], ok: 0 }], d: [] } }, c: [{ id: 1, type: 'overlap', sev: 1, txt: 'x', refs: [], path: [], pend: 1 }], st: { auto: 0, boss: {}, res: 0 } };
    if (kind === 'bad') a.scandal = { t: 'x', sev: 2, left: 2, truth: true, dating: false, other: 0 };
    if (kind === 'conflict') propOk(m.id, 's', 0); else propOk(m.id, 'p', 0); };
  T('prop.conflict', B, () => pr('conflict'));
  T('prop.gone', B, () => pr('gone'));
  T('prop.bad', B, () => pr('bad'));
  return out;
}, ['x']);

// ---------------- task 12: event cards of every kind ----------------
import { evInfo } from '../../src/systems/events.js';
import { viewEvents } from '../../src/ui/views.js';
import { MXS } from '../../src/systems/ext2.js';
import { candBlock } from '../../src/systems/ext2.js';
import { genArtist } from '../../src/systems/artists.js';
import { extFill } from '../../src/systems/ext3.js';
import { SXD } from '../../src/systems/market.js';
const evOut = e => { const i = evInfo(e); return i === null ? null : i === undefined ? 'undef' : { ic: i.ic, t: i.t, d: i.d, o: i.o.map(o => o.k + '|' + o.l) }; };
const evAll = (out, E) => { for (const [k, e] of Object.entries(E)) out[k] = evOut(e); };
const trs = () => S.artists.filter(a => a.status === 'trainee');
const sc0 = (a, o = {}) => { a.scandal = { t: 'Tin đồn thái độ', sev: 2, left: 4, truth: true, dating: false, other: 0, ...o }; return a; };
add('t12-basic', ctx => {
  ctx.fresh(ctx.base); const out = {}, [a, b, c] = deb();
  sc0(a); sc0(b, { dating: true, other: a.id });
  const E = { rest: { kind: 'req_rest', a: a.id }, raise: { kind: 'req_raise', a: a.id }, acting: { kind: 'req_acting', a: a.id }, solo: { kind: 'req_solo', a: a.id }, leave: { kind: 'req_leave', a: a.id },
    conflict: { kind: 'rel_conflict', a: a.id, b: b.id }, dating: { kind: 'rel_dating', a: a.id, b: b.id }, poach: { kind: 'poach', a: c.id, r: 'Moonlight Ent.', fee: 90e6 },
    scandal: { kind: 'scandal', a: a.id }, scandalD: { kind: 'scandal', a: b.id }, gone: { kind: 'req_rest', a: 424242 }, goneB: { kind: 'rel_conflict', a: a.id, b: 424242 }, unknown: { kind: 'zzz', a: a.id } };
  evAll(out, E);
  S.events = []; for (const k of ['rest', 'raise', 'acting', 'solo', 'leave', 'conflict', 'dating', 'poach', 'scandal', 'scandalD']) pushEv({ ...E[k] }, true);
  viewEvents(); out.sheet = sheet();
  S.events = []; viewEvents(); out.empty = sheet();
  return out;
}, ['Tin đồn thái độ', 'Moonlight Ent.']);
add('t12-sx', ctx => {
  ctx.fresh(ctx.base); const out = {}, P = acts()[0];
  evAll(out, { fire: { kind: 'sx', sx: 'fire' }, sponsor: { kind: 'sx', sx: 'sponsor', p: 'Hãng Tài Trợ', v: 60e6 }, tax: { kind: 'sx', sx: 'tax' }, festival: { kind: 'sx', sx: 'festival', act: P.k, n: P.n.slice(2) }, leak: { kind: 'sx', sx: 'leak' }, investor: { kind: 'sx', sx: 'investor', p: 'Quỹ Sao Mai', v: 300e6 }, unknown: { kind: 'sx', sx: 'zzz' } });
  out.keys = Object.keys(SXD);
  S.events = []; for (const k of ['sponsor', 'investor']) pushEv({ kind: 'sx', sx: k, p: 'Hãng Tài Trợ', v: 60e6 }, true); viewEvents(); out.sheet = sheet();
  return out;
}, ['Hãng Tài Trợ', 'Quỹ Sao Mai']);
add('t12-mx', ctx => {
  ctx.fresh(ctx.base); const out = {}, d0 = deb()[0], t0 = trs()[0], m = nonGm()[0];
  const mk = (k, a, o = {}) => ({ kind: 'mx', mx: k, a: a.id, m: m.id, ...o });
  S.assts = [];
  for (const k of Object.keys(MXS)) { const who = MXS[k].who; const a = who === 't' ? t0 : d0; out[k] = evOut(mk(k, a, k === 'fight' ? { b: (trs()[1] || trs()[0]).id } : {})); }
  out['late.trainee'] = evOut(mk('late', t0)); out['cry.noSenior'] = (() => { const sv = S.artists.map(a => a.busy); S.artists.forEach(a => { if (a.status === 'debuted') a.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; }); t0.mt = 0; const r = evOut(mk('cry', t0)); S.artists.forEach((a, i) => { a.busy = sv[i]; }); return r; })();
  out['cry.mentor'] = (() => { t0.mt = d0.id; return evOut(mk('cry', t0)); })(); t0.mt = 0;
  out['burn.assts'] = (() => { S.assts = [{ id: 1, name: 'Trợ Lý A', mid: m.id, k: 'nego', v: 1, sal: 1e6 }, { id: 2, name: 'Trợ Lý B', mid: m.id, k: 'care', v: 1, sal: 1e6 }]; const r = evOut(mk('burn', d0)); S.assts = []; return r; })();
  out['fight.nob'] = evOut(mk('fight', t0, { b: 424242 })); out['fight.noB'] = evOut(mk('fight', t0));
  out.gone = evOut({ kind: 'mx', mx: 'fan', a: d0.id, m: 424242 }); out.unknownMx = evOut(mk('zzz', d0));
  S.events = []; for (const k of ['fan', 'late', 'clash', 'injury', 'leak', 'brand']) pushEv(mk(k, d0), true); viewEvents(); out.sheet = sheet();
  return out;
}, ['Trợ Lý A', 'Trợ Lý B']);
add('t12-x', ctx => {
  ctx.fresh(ctx.base); const out = {}, m = nonGm()[0], a = deb()[0], g = S.groups[0];
  const cand = genArtist(); cand.name = 'Ứng Viên Test'; cand.talent = 1.2;
  S.managers.forEach(x => { x.as = null; });
  evAll(out, { asst: { kind: 'mp', t: 'asst', m: m.id, k: 'nego', v: 2, name: 'Trợ Lý Z', fee: 16e6, sal: 2e6 }, scout: { kind: 'mp', t: 'scout', m: m.id, a: a.id, cand, where: 'ở quán cà phê gần phim trường' }, scoutNoA: { kind: 'mp', t: 'scout', m: m.id, a: 424242, cand, where: 'trên chuyến tàu đi quay ngoại cảnh' }, mpOther: { kind: 'mp', t: 'zz', m: m.id }, mpNoM: { kind: 'mp', t: 'asst', m: 424242, k: 'nego', v: 1, name: 'x', fee: 1, sal: 1 },
    disbandNoMgr: { kind: 'disband', g: g.id, why: 'mâu thuẫn nội bộ kéo dài' }, renew: { kind: 'renew', a: a.id }, renew13: { kind: 'renew', a: a.id, mul: 1.3 }, goneG: { kind: 'disband', g: 424242, why: 'x' } });
  m.as = { t: 'g', id: g.id }; out.disbandMgr = evOut({ kind: 'disband', g: g.id, why: 'các thành viên kiệt sức, tâm trạng sa sút' });
  out.cand = candBlock(cand); const cm = genArtist(); cm.name = 'Ứng Viên Nam'; cm.g = 'M'; out.candM = candBlock(cm);
  S.events = []; pushEv({ kind: 'mp', t: 'scout', m: m.id, a: a.id, cand, where: 'khi xem một buổi diễn đường phố' }, true); pushEv({ kind: 'mp', t: 'asst', m: m.id, k: 'pr', v: 1, name: 'Trợ Lý Z', fee: 8e6, sal: 1e6 }, true); pushEv({ kind: 'disband', g: g.id, why: 'bất đồng về định hướng âm nhạc' }, true); pushEv({ kind: 'renew', a: a.id, mul: 1.3 }, true);
  viewEvents(); out.sheet = sheet();
  return out;
}, ['Ứng Viên Test', 'Ứng Viên Nam', 'Trợ Lý Z', 'ở quán cà phê gần phim trường', 'trên chuyến tàu đi quay ngoại cảnh', 'khi xem một buổi diễn đường phố', 'mâu thuẫn nội bộ kéo dài', 'các thành viên kiệt sức, tâm trạng sa sút', 'bất đồng về định hướng âm nhạc', 'x']);
add('t12-v3', ctx => {
  ctx.fresh(ctx.base); const out = {}, [a, b] = deb(), t0 = trs()[0], [m1, m2] = nonGm();
  S.offers = []; const of = mkOffer({ type: 'backup', slots: 1, req: { dance: 5 } }); extFill(); const x = S.ext[0];
  const cand = genArtist(); cand.name = 'Ứng Viên Test';
  S.hs = { id: 9100, name: 'BS. Test', sk: 3, sal: 4e6, fee: 24e6 }; a.hsF = { w: abs(), why: ['năng lượng chỉ còn 20', 'tâm trạng xuống 25'], n: 3, st: 'new' }; t0.hsF = { w: abs(), why: ['mệt'], n: 2, st: 'new' };
  a.busy = null; t0.mt = 0; a.tag[t0.id] = 'friend'; m1.lv = 3; m2.lv = 1; m2.boss = null; a.pa = null; a.pm = null;
  const song = { id: 1, t: 'Bài Test', ck: 'cute', q: 70, by: [a.id], st: 'ok' }, P = acts()[0];
  const ev = (t, o) => ({ kind: 'v3', t, ...o });
  evAll(out, { mtreq: ev('mtreq', { a: a.id, b: t0.id }), mtjob: ev('mtjob', { a: a.id, b: t0.id, of: of.id }), intro: ev('intro', { a: a.id, cand, how: 'bạn thời cấp ba' }), paask: ev('paask', { a: a.id }), hsM: ev('hs', { a: a.id, n: 3, m: m1.id }), hsNoM: ev('hs', { a: t0.id, n: 2, m: 0 }),
    md: ev('md', { song, k: P.k }), xcollab: ev('xcollab', { a: a.id, x: x.id }), xrumor: ev('xrumor', { a: a.id, x: x.id }), amgr: ev('amgr', { a: a.id, m: m1.id }), mmclash: ev('mmclash', { m: m1.id, m2: m2.id, why: 'tranh lịch phòng tập cho nghệ sĩ mình phụ trách' }), mmcoach: ev('mmcoach', { m: m1.id, m2: m2.id }),
    goneA: ev('mtreq', { a: 424242, b: t0.id }), unknown: ev('zzz', { a: a.id }) });
  S.events = []; for (const [t, o] of [['mtreq', { a: a.id, b: t0.id }], ['intro', { a: a.id, cand, how: 'bạn thời cấp ba' }], ['hs', { a: a.id, n: 3, m: m1.id }], ['md', { song, k: P.k }], ['mmclash', { m: m1.id, m2: m2.id, why: 'tranh lịch phòng tập cho nghệ sĩ mình phụ trách' }]]) pushEv(ev(t, o), true);
  viewEvents(); out.sheet = sheet();
  return out;
}, ['Ứng Viên Test', 'bạn thời cấp ba', 'BS. Test', 'năng lượng chỉ còn 20', 'tâm trạng xuống 25', 'mệt', 'Bài Test', 'tranh lịch phòng tập cho nghệ sĩ mình phụ trách', 'Dự án thử backup']);
import { xResolve } from '../../src/systems/ext2.js';
import { v3Resolve } from '../../src/systems/ext3.js';
import { resolveEv } from '../../src/systems/events.js';
add('t12-toasts', ctx => {
  const out = {}, T = (n, b, f) => { out[n] = toastOf(ctx, b, f); };
  const B = ctx.base;
  T('scout.money', B, () => { const m = nonGm()[0], a = deb()[0]; const cand = genArtist(); S.money = 0; S.events = []; pushEv({ kind: 'mp', t: 'scout', m: m.id, a: a.id, cand, where: 'x' }, true); resolveEv(S.events[0].id, 'yes'); });
  T('mtreq.gone', B, () => { const [a] = deb(), t0 = trs()[0]; a.tag[t0.id] = 'friend'; t0.mt = a.id; S.events = []; pushEv({ kind: 'v3', t: 'mtreq', a: a.id, b: t0.id }, true); resolveEv(S.events[0].id, 'yes'); });
  T('mtjob.reason', B, () => { S.offers = []; const [a] = deb(), t0 = trs()[0], of = mkOffer({ type: 'backup', slots: 1, req: { dance: 5 } }); t0.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; S.events = []; pushEv({ kind: 'v3', t: 'mtjob', a: a.id, b: t0.id, of: of.id }, true); resolveEv(S.events[0].id, 'yes'); });
  T('intro.money', B, () => { const [a] = deb(), cand = genArtist(); S.money = 0; S.events = []; pushEv({ kind: 'v3', t: 'intro', a: a.id, cand, how: 'x' }, true); resolveEv(S.events[0].id, 'yes'); });
  T('xcollab.busy', B, () => { const [a] = deb(); extFill(); a.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; S.events = []; pushEv({ kind: 'v3', t: 'xcollab', a: a.id, x: S.ext[0].id }, true); resolveEv(S.events[0].id, 'yes'); });
  return out;
}, ['x']);

// ---------------- task 13: save view, transfer errors, remaining toasts ----------------
import { viewCode, saveCopyCode, saveDownload, saveBackupNow, saveExportSlot, saveRestorePreview, saveImportText, saveImportApply } from '../../src/ui/saveView.js';
import { save, load, saveMeta, KEY, KEY_META } from '../../src/save/storage.js';
import { setCurView } from '../../src/ui/modal.js';
import { importCode, parseSaveText } from '../../src/save/transfer.js';
import { sign, recast } from '../../src/systems/artists.js';
const dnorm = h => h.replace(/\d{1,2}:\d{2}(:\d{2})?[^<]*\d{4}|\d{1,2}\/\d{1,2}\/\d{4}[^<]*/g, '<date>');
const openSave = () => { setCurView(viewCode); viewCode(); };
const saveSheet = () => dnorm(sheet());
add('t13-save', async ctx => {
  const out = {}; localStorage.clear();
  ctx.fresh(ctx.base); openSave(); out.empty = saveSheet();
  save({ full: true }); openSave(); out.saved = saveSheet();
  const m = saveMeta(); m.f.prev = 1; m.f.err = 1; m.c.lvl = 2; localStorage.setItem(KEY_META, JSON.stringify(m)); openSave(); out.flags = saveSheet();
  localStorage.removeItem(KEY); load(); openSave(); out.restored = saveSheet();   // loaded from the full backup
  saveRestorePreview(); out.preview = saveSheet();
  for (const [k, v] of [['bad', 'xyz'], ['json', '{oops'], ['notsave', '{"a":1}'], ['trunc', 'SL1.@@@']]) { openSave(); document.getElementById('codeIn').value = v; await saveImportText(); out['err.' + k] = saveSheet(); }
  openSave(); out.noBackup = null; localStorage.removeItem('starlight_idol_save_v1_full'); saveRestorePreview(); out.noBackup = saveSheet();
  save({ full: true }); openSave(); document.getElementById('codeIn').value = JSON.stringify(S); await saveImportText(); out.prevJson = saveSheet();
  const ok = saveImportApply(); out.applied = saveSheet();
  save(); load(); // back to a compact load source for the cases that follow
  openSave(); document.getElementById('codeIn').value = JSON.stringify(S); await saveImportText();
  const orig = Storage.prototype.setItem; Storage.prototype.setItem = () => { const e = new Error('q'); e.name = 'QuotaExceededError'; throw e; };
  try { saveImportApply(); out.quota = saveSheet(); } finally { Storage.prototype.setItem = orig; }
  openSave(); document.getElementById('codeIn').value = JSON.stringify(S); await saveImportText(); S.artists = []; S.artists = null;
  localStorage.clear(); save(); load();
  return out;
}, ['{oops', '{"a":1}', 'SL1.@@@', 'xyz']);
add('t13-toasts', async ctx => {
  const out = {}; localStorage.clear();
  const T = async (n, b, f) => { ctx.fresh(b); clearToast(); try { await f(); } catch (e) { out[n] = 'THROW ' + e.message; return; } out[n] = toastText(); };
  const B = ctx.base;
  await T('sign.money', B, () => { S.money = 0; sign(S.pool[0].id); });
  await T('recast.money', B, () => { S.money = 0; recast(); });
  await T('copy.notReady', B, () => { openSave(); document.getElementById('codeShow').value = ''; return saveCopyCode(); });
  await T('copy.fallback', B, () => { openSave(); document.getElementById('codeShow').value = 'SL1.abc'; return saveCopyCode(); });
  await T('copy.ok', B, async () => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} }, configurable: true }); openSave(); document.getElementById('codeShow').value = 'SL1.abc'; await saveCopyCode(); delete navigator.clipboard; });
  await T('download', B, () => { const cu = URL.createObjectURL, ru = URL.revokeObjectURL, ck = HTMLAnchorElement.prototype.click; URL.createObjectURL = () => 'blob:x'; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = () => {}; try { saveDownload(); } finally { HTMLAnchorElement.prototype.click = ck; } });
  await T('backup.ok', B, () => { openSave(); saveBackupNow(); });
  await T('backup.fail', B, () => { openSave(); const orig = Storage.prototype.setItem; Storage.prototype.setItem = () => { const e = new Error('q'); e.name = 'QuotaExceededError'; throw e; }; try { saveBackupNow(); } finally { Storage.prototype.setItem = orig; } });
  await T('slot.none', B, () => { localStorage.clear(); return saveExportSlot('c'); });
  await T('slot.c', B, async () => { save({ full: true }); const cu = URL.createObjectURL, ru = URL.revokeObjectURL, ck = HTMLAnchorElement.prototype.click; URL.createObjectURL = () => 'blob:x'; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = () => {}; try { openSave(); await saveExportSlot('c'); } finally { HTMLAnchorElement.prototype.click = ck; } });
  await T('slot.f', B, async () => { save({ full: true }); const cu = URL.createObjectURL, ru = URL.revokeObjectURL, ck = HTMLAnchorElement.prototype.click; URL.createObjectURL = () => 'blob:x'; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = () => {}; try { openSave(); await saveExportSlot('f'); } finally { HTMLAnchorElement.prototype.click = ck; } });
  localStorage.clear();
  out.errKeys = await (async () => { const r = {}; for (const [k, v] of [['bad', 'xyz'], ['json', '{oops'], ['notsave', '{"a":1}'], ['trunc', 'SL1.@@@']]) { try { await parseSaveText(v); r[k] = 'ok'; } catch (e) { r[k] = e.message; } } try { await importCode('xyz'); } catch (e) { r.importCode = e.message; } return r; })();
  return out;
}, [], ['errKeys']);

// ---------------- phase 3 task 1: rare stored texts (recorded on pre-phase-3 code; proves the sinks keep their vi bytes) ----------------
// Keys starting with '~' are baseline-only probes (stored values rendered to Vietnamese, log rows): the en guard skips them.
import * as I18N from '../../src/i18n/index.js';
import { render } from '../../src/ui/building.js';
import { surprise, bizTick } from '../../src/systems/market.js';
import { disbandTick, mxTick } from '../../src/systems/ext2.js';
import { interTick, v3Tick, hsTick, hsHTML as hsHTML3 } from '../../src/systems/ext3.js';
import { makeScandal } from '../../src/systems/events.js';
import { awards } from '../../src/systems/awards.js';
import { nextWeek } from '../../src/systems/week.js';
import { setTag } from '../../src/systems/relations.js';
const vt = v => (I18N.txVi ? I18N.txVi(v) : v);          // stored value as Vietnamese text (strings pass through)
const logTop = (n = 4) => { render(); return [...document.querySelectorAll('#log > div')].slice(0, n).map(x => x.outerHTML).join('\n'); };
const SAFE = f => { try { return f(); } catch (e) { return 'THROW ' + e.message; } };
const J = v => JSON.stringify(v);
// run f with Math.random returning vals in turn (then the case's own seeded stream resumes)
const rstub = (vals, f) => { const o = Math.random; let i = 0; Math.random = () => vals[i++ % vals.length]; try { return f(); } finally { Math.random = o; } };
// Search seeds 1..max for runs where probe() yields a new key; returns {key: seed}. `prep` builds the start state, `run` does the step.
function hunt(ctx, base, prep, run, probe, want, max) {
  const found = {};
  for (let s = 1; s <= max && Object.keys(found).length < want; s++) {
    ctx.fresh(base); prep(); seed(s);
    try { run(); const k = probe(); if (k != null && !(k in found)) found[k] = s; } catch { /* seed did not work */ }
  }
  return found;
}
const replay = (ctx, base, prep, run, s) => { ctx.fresh(base); prep(); seed(s); run(); };
// seed-hunt a pool of stored variants and render each: out['~found'] lists them, out[`${i}.sheet`] etc. come from `show`
function pool(ctx, prep, run, probe, want, max, show) {
  const found = hunt(ctx, ctx.base, prep, run, probe, want, max), out = { '~found': J(Object.keys(found).sort()) };
  Object.entries(found).sort().forEach(([k, s], i) => { replay(ctx, ctx.base, prep, run, s); Object.assign(out, show(i)); });
  return out;
}
const P3N = []; // names of generated candidates shown in event cards (proper nouns, treated like stored text by the en guard)
const evSheet = i => { viewEvents(); for (const e of S.events) if (e.cand && e.cand.name) P3N.push(e.cand.name); return { [`ev${i}`]: sheet() }; };

add('p3-loan', ctx => {
  ctx.fresh(ctx.base); const out = {}; S.events = []; S.loan = null;
  pushEv({ kind: 'sx', sx: 'investor', p: 'Quỹ Sao Mai', v: 300e6 }, true);
  out['~res'] = SAFE(() => { resolveEv(S.events[0].id, 'yes'); return 'ok'; });
  out['~log1'] = logTop(2); out.invest = room('invest'); out['~loan1'] = J(S.loan && { ...S.loan, n: vt(S.loan.n) });
  if (S.loan) S.loan.left = 1; bizTick(); out['~log2'] = logTop(2); out.invest2 = room('invest'); out['~loan2'] = J(S.loan);
  S.events = []; pushEv({ kind: 'sx', sx: 'investor', p: 'Quỹ Rồng Vàng', v: 200e6 }, true); resolveEv(S.events[0].id, 'yes'); out.invest3 = room('invest'); out['~loan3'] = J(S.loan && { ...S.loan, n: vt(S.loan.n) });
  return out;
}, ['Quỹ Sao Mai', 'Quỹ Rồng Vàng']);

add('p3-mods', ctx => {
  ctx.fresh(ctx.base); const out = {};
  S.events = []; pushEv({ kind: 'sx', sx: 'fire' }, true);
  out['~cheap'] = SAFE(() => { resolveEv(S.events[0].id, 'cheap'); return 'ok'; }); out['~cheapLog'] = logTop(2); out.cheapMarket = room('market');
  out['~cheapMods'] = J(Object.entries(S.mods).map(([k, m]) => [k, m.v, vt(m.n)]));
  // surprise(): pick(pool) → boom / crisis for some seed
  const prep = () => { S.mods = {}; };
  const run = () => { for (let i = 0; i < 40 && !Object.keys(S.mods).length; i++) surprise(); };
  const probe = () => Object.keys(S.mods).filter(k => k === 'fan' || k === 'pay').join('+') || null;
  Object.assign(out, pool(ctx, prep, run, probe, 2, 400, i => ({ [`~mods${i}`]: J(Object.entries(S.mods).map(([a, m]) => [a, m.v, vt(m.n)])), [`~log${i}`]: logTop(2), [`market${i}`]: room('market') })));
  return out;
}, ['Phòng tập sửa tạm: luyện tập −20%', 'Làn sóng K-pop: fan tăng nhanh', 'Suy thoái: thù lao −20%', 'Suy thoái: kinh doanh −30%']);

add('p3-disband', ctx => {
  const out = {}, setup = (mood, rel, age) => { ctx.fresh(ctx.base); S.events = []; S.camp = {}; const g = S.groups[0]; if (!g) return null; g.hiatus = 0; g.y = S.year - age; const ms = g.members.map(byId).filter(Boolean); ms.forEach(a => { a.mood = mood; }); for (const a of ms) for (const b of ms) if (a !== b) setTag(a, b, rel < 0 ? 'enemy' : null); return g; };
  const cases = { conflict: [80, -30, 1], tired: [10, 60, 1], old: [80, 60, 5], music: [80, 60, 1] };
  for (const [k, [mood, rel, age]] of Object.entries(cases)) {
    const g = setup(mood, rel, age); if (!g) return { skip: 'no group' };
    SAFE(() => rstub([0], () => disbandTick()));
    const e = S.events.find(x => x.kind === 'disband');
    out['~' + k + '.why'] = e ? J(vt(e.why)) : 'none'; out['~' + k + '.log'] = logTop(1);
    if (e) { viewEvents(); out[k + '.sheet'] = sheet(); const m0 = g.members[0]; SAFE(() => resolveEv(e.id, 'split')); out['~' + k + '.split'] = logTop(2); out['~' + k + '.hist'] = J(byId(m0) ? byId(m0).hist.slice(0, 1).map(vt) : null); }
  }
  return out;
}, ['mâu thuẫn nội bộ kéo dài', 'các thành viên kiệt sức, tâm trạng sa sút', 'các thành viên muốn theo đuổi con đường riêng', 'bất đồng về định hướng âm nhạc']);

add('p3-mmclash', ctx => pool(ctx, () => { S.events = []; S.managers.forEach(m => { m.as = m.as || { t: 't', id: 0 }; m.boss = null; }); }, () => { interTick(); },
  () => { const e = S.events.find(x => x.t === 'mmclash'); return e ? vt(e.why) : null; }, 4, 1500, evSheet), ['tranh lịch phòng tập cho nghệ sĩ mình phụ trách', 'tranh lời mời béo bở', 'bất đồng cách xử lý truyền thông', 'đổ lỗi cho nhau về lịch trình trùng']);

add('p3-intro', ctx => pool(ctx, () => { S.events = []; }, () => { v3Tick(); },
  () => { const e = S.events.find(x => x.t === 'intro'); return e ? vt(e.how) : null; }, 6, 2500, evSheet), P3N);
P3N.push('bạn thời cấp ba', 'đàn em cùng lớp nhảy', 'người quen ở phòng thu', 'em họ', 'bạn cùng xóm', 'đàn em ở câu lạc bộ âm nhạc');

add('p3-scout', ctx => pool(ctx, () => { S.events = []; S.managers.forEach(m => { m.as = m.as || { t: 't', id: 0 }; }); },
  () => { for (let i = 0; i < 12; i++) { mxTick(); if (S.events.some(x => x.kind === 'mp' && x.t === 'scout')) break; } },
  () => { const e = S.events.find(x => x.kind === 'mp' && x.t === 'scout'); return e ? vt(e.where) : null; }, 6, 600, evSheet), P3N);
P3N.push('ở quán cà phê gần phim trường', 'trong buổi fan meeting', 'ở một lễ hội âm nhạc trường học', 'tại cuộc thi hát karaoke khu phố', 'trên chuyến tàu đi quay ngoại cảnh', 'khi xem một buổi diễn đường phố');

add('p3-scandal', ctx => {
  const prep = () => { S.events = []; S.artists.forEach(a => { a.scandal = null; }); };
  const run = () => { makeScandal(S.artists.filter(x => x.status === 'debuted')[0]); };
  const probe = () => vt(S.artists.filter(x => x.status === 'debuted')[0].scandal.t);
  const out = pool(ctx, prep, run, probe, 5, 300, i => { const a = S.artists.filter(x => x.status === 'debuted')[0]; return { [`~log${i}`]: logTop(1), [`artist${i}`]: (viewArtist(a.id), sheet()), [`pr${i}`]: room('pr') }; });
  // dating variant: partner tagged 'dating'
  const prepD = () => { prep(); const [a, b] = S.artists.filter(x => x.status === 'debuted'); a.tag[b.id] = 'dating'; b.tag[a.id] = 'dating'; };
  const fd = hunt(ctx, ctx.base, prepD, run, probe, 6, 100);
  for (const [k, s] of Object.entries(fd)) if (k.includes('hẹn hò')) { replay(ctx, ctx.base, prepD, run, s); out['~dating.t'] = k; out['~dating.log'] = logTop(1); out['dating.pr'] = room('pr'); }
  return out;
}, ['Tin đồn thái độ với nhân viên', 'Bị đào lại phát ngôn cũ', 'Tin đồn chèn ép đồng nghiệp', 'Lộ ảnh quá khứ gây tranh cãi', 'Tin đồn đạo nhái vũ đạo', 'Bị chụp ảnh hẹn hò với']);

add('p3-prhist', ctx => {
  ctx.fresh(ctx.base); const out = {}; S.prHist = [];
  const plans = prPlans(); out['~plans'] = J(plans.map(p => [p.go, p.t]));
  const mk = (go, tt) => { const b = document.createElement('button'); b.dataset.go = go; b.dataset.t = tt; return b; };
  prGo(mk('void 0', '📣 Quảng bá <b>nhóm</b> thử')); prGo(mk('void 0', '🎤 Hậu quảng bá'));
  if (plans[0]) prGo(mk('void 0', plans[0].t));
  out['~hist'] = J(S.prHist.map(vt)); out.pr = room('pr');
  return out;
});

add('p3-films', ctx => {
  ctx.fresh(ctx.base); S.offers = []; S.films = []; const out = {}; S.money = Math.max(S.money, 5e9);
  const seen = [], snap = tag => { const k = S.films.map(f => vt(f.status)).join('|'); if (seen.at(-1) !== k) { seen.push(k); out[`${tag}.acting`] = room('acting'); out[`~${tag}.st`] = k; } };
  const of = mkOffer({ type: 'drama', slots: 1, invest: { budget: 2e9, share: .2 } }); of.invested = false;
  SAFE(() => investOffer(of.id)); snap('invested');
  openRoom('acting');
  const gen = document.querySelector('#fGen'), bud = document.querySelector('#fBud'), ti = document.querySelector('#fTitle');
  out['~produce'] = SAFE(() => { if (ti) ti.value = 'Phim Thử Nghiệm'; if (gen) gen.selectedIndex = 0; if (bud && bud.options && bud.options.length) bud.selectedIndex = 0; document.querySelectorAll('.fcast').forEach((c, i) => { c.checked = i === 0; }); produceFilm(); return 'ok'; });
  snap('shooting');
  for (let w = 0; w < 16; w++) { SAFE(() => nextWeek(true, true)); snap('w' + w); }
  out['~log'] = logTop(3); out['~last'] = J(S.films.map(f => [f.title, vt(f.status)]));
  return out;
}, ['Phim Thử Nghiệm', 'Sắp chiếu', 'Đang quay', 'Hậu kỳ', 'Đã chiếu']);

add('p3-award', ctx => {
  ctx.fresh(ctx.base); const out = {}; S.awards = S.awards || [];
  S.artists.forEach(a => { if (a.yr) { a.yr.fans = 900000; a.yr.actQ = 95; a.yr.variety = 9; } });
  SAFE(() => awards()); const w = S.awards.at(-1);
  out['~cats'] = J((w.res || []).map(r => [vt(r.cat), vt(r.note), r.ok]));
  out['~board'] = J((w.board || []).filter(b => b.me).map(b => vt(b.n)));
  out['~log'] = logTop(1); viewAward(w); out.sheet = sheet(); out.ceo = room('ceo');
  out['~hist'] = J(S.artists.map(a => a.hist.filter(h => String(vt(h)).includes('🏆')).map(vt)).filter(h => h.length));
  return out;
});

add('p3-hs', ctx => {
  ctx.fresh(ctx.base); const out = {}; const ds = S.artists.filter(a => a.status === 'debuted' && !a.busy), tr = S.artists.find(a => a.status === 'trainee' && !a.busy);
  S.hsC = null; genHSC(); S.hs = { ...S.hsC[0], sk: 5 }; S.hsC = [];
  const tire = a => { a.busy = null; a.energy = 20; a.mood = 20; a.restRec = 0; a.hsF = null; a.days = ['vocal', 'dance', 'vocal', 'dance', 'vocal', 'dance', 'rap']; a.ttsFail = 3; };
  [ds[0], tr].filter(Boolean).forEach(tire);
  const a2 = ds[1]; if (a2) { a2.busy = null; a2.energy = 60; a2.mood = 80; a2.restRec = 0; a2.hsF = null; a2.days = ['vocal', 'dance', 'vocal', 'dance', 'vocal', 'dance', 'rap']; }
  SAFE(() => rstub([0], () => hsTick()));
  out['~flagged'] = J(S.artists.filter(a => a.hsF).map(a => [a.name, a.hsF.why.map(vt), a.hsF.n]));
  out.gym = room('gym'); out.hs = hsHTML3(); out['~log'] = logTop(2);
  const b = S.artists.find(a => a.hsF); if (b) { viewArtist(b.id); out.artist = sheet(); }
  return out;
});

add('p3-props', ctx => {
  ctx.fresh(ctx.base); const out = {}; S.offers = []; S.props = null; S.autoAppr = true;
  S.money = Math.max(S.money, 5e9); while (nonGm().length < 3 && S.mgrPool.length) hireMgr(S.mgrPool[0].id);
  S.artists.forEach(a => { a.busy = null; }); const ms = nonGm(), ds = S.artists.filter(a => a.status === 'debuted').concat(S.artists.filter(a => a.status === 'trainee')).slice(0, 5);
  if (ms.length < 2 || ds.length < 3) return { skip: 'few managers ' + ms.length + ' ' + ds.length };
  mkOffer({ type: 'drama', slots: 2, req: { acting: 1 } }); mkOffer({ type: 'music', slots: 1, req: { vocal: 1 } });
  ds.forEach(a => { a.busy = null; a.energy = 100; a.scandal = null; a.appr = 0; });
  ms.forEach((m, i) => { m.boss = i === 1 ? ms[0].id : null; m.ps = 2; m.auto = 'off'; m.dom = null; m.as = { t: 'l', id: 0, ids: ds.slice(0, 3).map(a => a.id) }; });
  out['~built'] = SAFE(() => { const P = buildProps(); return J({ c: P.c.map(c => [c.type, vt(c.txt), vt(c.by), (c.path || []).map(vt), c.pend]), st: P.st }); });
  out.sheet = SAFE(() => { viewProps(); return sheet(); });
  out['~ceo'] = SAFE(() => { const c = S.props && S.props.c.find(x => x.pend); if (c) cfPick(c.id); return J(S.props.c.map(x => [vt(x.txt), vt(x.by), x.pend])); }); out['~ceoLog'] = logTop(2);
  out.after = SAFE(() => { viewProps(); return sheet(); });
  out['~items'] = SAFE(() => J(Object.values(S.props.m).map(it => ({ s: it.s.map(x => [vt(x.why), vt(x.why2), vt(x.by), x.ok]), p: it.p.map(x => [vt(x.why2), vt(x.by), x.ok]), d: it.d.map(x => vt(x.txt)) }))));
  return out;
}, ['Dự án thử drama', 'Dự án thử music']);
