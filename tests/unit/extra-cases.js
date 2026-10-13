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
export const add = (name, run, stored = []) => CASES.push({ name, run, stored });
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
