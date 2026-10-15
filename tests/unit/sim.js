// Shared harness for the i18n phase 2 safety nets: builds a rich seeded game state, renders every surface.
// Import only from jsdom tests (touches `document`).
import { seed, SHELL } from './helpers.js';
import { S, newGame, setState } from '../../src/state.js';
import { ROOMS } from '../../src/data/rules.js';
import { setPos, render } from '../../src/ui/building.js';
import { openRoom } from '../../src/ui/rooms.js';
import { closeM } from '../../src/ui/modal.js';
import { viewArtist, viewEvents, viewSkipWarn, viewAward, viewReport, viewReportFull, setRepDay, setAllD } from '../../src/ui/views.js';
import { startPlan } from '../../src/ui/planning.js';
import { viewCode } from '../../src/ui/saveView.js';
import { viewLang } from '../../src/ui/lang.js';
import { viewSec } from '../../src/systems/secretary.js';
import { viewProps } from '../../src/systems/proposals.js';
import { viewSongs, viewSong, viewRenew } from '../../src/systems/ext2.js';
import { viewCamp } from '../../src/systems/releases.js';
import { viewDebutQ, viewPA, paOK, hsHire, paRe } from '../../src/systems/ext3.js';
import { viewInv, randomEvents, makeScandal, invStart, invOpen } from '../../src/systems/events.js';
import { prDo } from '../../src/systems/review.js';
import { preDo, postDo } from '../../src/systems/promo.js';
import { doLive, doFM, releaseSingle, holdConcert, produceFilm } from '../../src/systems/releases.js';
import { batchSched } from '../../src/systems/batches.js';
import { writeSong, renewDo } from '../../src/systems/ext2.js';
import { saveCopyCode } from '../../src/ui/saveView.js';
import { byId, abs } from '../../src/state.js';
import { nextWeek } from '../../src/systems/week.js';
import { hireMgr, setDom, assignMgr, gmOf } from '../../src/systems/managers.js';
import { MDOM } from '../../src/data/rules.js';
import { promoteGM } from '../../src/systems/gm.js';
import { recHunt, recHire } from '../../src/systems/recruit.js';
import { sign, recast } from '../../src/systems/artists.js';
import { debutIds } from '../../src/systems/debut.js';
import { acceptOffer, acceptSel, investOffer } from '../../src/systems/offers.js';
import { buyBiz, raiseBiz, BIZ } from '../../src/systems/market.js';
import { enterComp } from '../../src/systems/contests.js';
import { doSingle } from '../../src/systems/releases.js';
import { acts } from '../../src/systems/secretary.js';

// One week of scripted actions (modelled on golden scenario 2, plus extras so every area has content).
// Each action runs in its own try: failures are collected in `errs` and never asserted on.
export function scripted(i, errs = []) {
  const T = (tag, fn) => { try { fn(); } catch (e) { errs.push(i + ':' + tag + ':' + e.message); } };
  S.money = Math.max(S.money, 600e6); // keep the scripted player solvent so every area has content
  T('mgr', () => { if ([2, 10, 20].includes(i) && S.mgrPool.length) hireMgr(S.mgrPool[0].id); });
  T('gm', () => { if (i === 24 && S.managers.length) promoteGM(S.managers[0].id); });
  T('rec', () => { if (i === 6) { recHunt(); const r = S.rec; if (r && r.cand.length) recHire(r.cand[0].id); } });
  T('sign', () => { if (i % 3 === 0 && S.artists.filter(a => a.status === 'trainee').length < 5 && S.artists.length < 10 && S.pool.length) sign(S.pool[0].id); });
  T('debut', () => {
    const rd = S.artists.filter(a => a.status === 'trainee' && a.dReady);
    if (rd.length >= 3) debutIds('group', rd.slice(0, 3).map(a => a.id), 'Test Group');
    else if (rd.length && S.artists.filter(a => a.status === 'trainee').length > 2 && i >= 30) debutIds(S.artists.some(a => a.actor) ? 'solo' : 'actor', [rd[0].id], '');
  });
  T('offer', () => {
    for (const o of [...S.offers].slice(0, 3)) {
      const a = S.artists.find(x => !x.busy && x.status === 'debuted');
      if (a) acceptOffer(o.id, a.id, true);
    }
  });
  T('biz', () => { if (i === 15) buyBiz(Object.keys(BIZ)[0]); });
  T('hs', () => { if (i === 18 && S.hsC && S.hsC.length) hsHire(S.hsC[0].id); });
  T('single', () => { if ([26, 40, 54].includes(i)) { const x = acts().find(z => z.m.every(id => !S.artists.find(a => a.id === id)?.busy)); if (x) doSingle(x.k, 'cute', 20e6, 'Test Single ' + i, true); } });
  T('comp', () => {
    if (i % 4 !== 3) return;
    openRoom('lobby');
    for (const c of [...(S.comps || [])]) {
      const bx = [...document.querySelectorAll('.cp' + c.id)];
      if (!bx.length) continue;
      bx.slice(0, c.t[1]).forEach(x => { x.checked = true; });
      const n = S.comps.length;
      enterComp(c.id);
      if (S.comps.length < n) break;
    }
    closeM();
  });
}

export function play(weeks = 56, errs = [], each) {
  for (let i = 0; i < weeks; i++) {
    scripted(i, errs);
    if (each) each(i);
    nextWeek(true, true);
  }
}

export function richState(sd = 7, weeks = 56) {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seed(sd);
  setPos({});
  newGame();
  const errs = [];
  play(weeks, errs);
  if (weeks) { // leave a few pending events + an investigation so those surfaces have content
    for (let k = 0; k < 4; k++) { try { randomEvents(); } catch (e) { errs.push('ev:' + e.message); } }
    try { // an open scandal investigation
      const a = S.artists.find(x => x.status === 'debuted' && !x.scandal);
      if (a) { makeScandal(a); S.money = Math.max(S.money, 100e6); invStart(a.id); closeM(); }
    } catch (e) { errs.push('inv:' + e.message); }
    S.ui = {};
    if (errs.length) console.warn(`[sim] ${errs.length} scripted action errors (ignored)`, process.env.SIM_DEBUG ? errs : '');
  }
  return structuredClone(S);
}

const first = (L, f) => (L || []).find(f);
const art = k => S.artists.find(a => (k === 'trainee' ? a.status === 'trainee' : k === 'actor' ? a.status === 'debuted' && a.actor : a.status === 'debuted' && !a.actor));
const withArt = (k, fn) => () => { const a = art(k); return a ? fn(a) : null; };

// Ordered registry. open() returns false/null when the precondition is missing (surface skipped).
export const SURFACES = [
  ...ROOMS.map(r => ({ name: r.id, open: () => openRoom(r.id) })),
  { name: 'artist-trainee', open: withArt('trainee', a => viewArtist(a.id)) },
  { name: 'artist-debuted', open: withArt('debuted', a => viewArtist(a.id)) },
  { name: 'artist-actor', open: withArt('actor', a => viewArtist(a.id)) },
  { name: 'events', open: () => viewEvents() },
  { name: 'skipWarn', open: () => viewSkipWarn() },
  { name: 'award', open: () => (S.awards && S.awards.length ? viewAward(S.awards.at(-1)) : null) },
  { name: 'report', open: () => (S.lastRep ? viewReport() : null) },
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(d => ({ name: 'reportFull-' + d, open: () => (S.lastRep ? (setRepDay(d), viewReportFull()) : null) })),
  { name: 'plan', open: () => startPlan(true, true) },
  { name: 'sec', open: () => viewSec() },
  { name: 'songs', open: () => viewSongs() },
  { name: 'song', open: () => { const s = first(S.songs, () => true); return s ? viewSong(s.id) : null; } },
  { name: 'camp', open: () => { const k = Object.keys(S.camp || {})[0]; return k ? viewCamp(k) : null; } },
  { name: 'props', open: () => viewProps() },
  { name: 'debutQ', open: () => viewDebutQ() },
  { name: 'pa', open: () => { const a = S.artists.find(paOK); return a ? viewPA(a.id) : null; } },
  { name: 'renew', open: withArt('debuted', a => viewRenew(a.id)) },
  { name: 'inv', open: () => { const a = S.artists.find(x => x.scandal); return a ? viewInv(a.id) : null; } },
  { name: 'save', open: () => viewCode() },
  { name: 'lang', open: () => viewLang() },
  { name: 'top', open: () => null }, // special: see renderSurface
];

const norm = h => h.replace(/\d{1,2}:\d{2}(:\d{2})?[^<]*\d{4}|\d{1,2}\/\d{1,2}\/\d{4}[^<]*/g, '<date>');

export const skipped = [];
// Renders one surface from a clone of `base`; returns normalised HTML or null when the precondition is missing.
export function renderSurface(name, base) {
  setState(structuredClone(base));
  S.ui = {};
  closeM();
  setRepDay(0);
  seed(99); // render-time RNG (gName, dWish, genPAC) is then independent of the surfaces rendered before
  if (name === 'top') {
    render();
    const g = id => document.getElementById(id)?.innerHTML ?? '';
    return norm([g('outside'), g('trendBar'), ...[...document.querySelectorAll('.room')].map(r => r.innerHTML)].join('\n<!--x-->\n'));
  }
  const s = SURFACES.find(x => x.name === name);
  const r = s.open();
  if (r === null || r === false) { skipped.push(name); return null; }
  const sh = document.getElementById('sheet');
  return norm(sh.innerHTML);
}

// innerHTML of the company log (#log) after a full render of `base`
export function renderLog(base) {
  setState(structuredClone(base));
  S.ui = {};
  closeM();
  seed(99);
  render();
  return norm(document.getElementById('log')?.innerHTML ?? '');
}

// text a player can read: textContent plus display attributes
export function visibleText(root) {
  const out = [];
  const w = document.createTreeWalker(root, 4 /* SHOW_TEXT */);
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n.nodeValue);
  root.querySelectorAll('[title],[aria-label],[placeholder],[label]').forEach(e => {
    for (const a of ['title', 'aria-label', 'placeholder', 'label']) if (e.hasAttribute(a)) out.push(e.getAttribute(a));
  });
  return out.join(' \n ');
}

// Failing actions; each prepares a state on a clone of base and calls one action.
// `toast` text is read from #toast right after the call (null = the case produced no toast).
export const TOAST_CASES = [];
export function toastCase(name, run) { TOAST_CASES.push({ name, run }); }
const broke = () => { S.money = 0; };
const deb = () => S.artists.filter(a => a.status === 'debuted' && !a.busy);
const trn = () => S.artists.find(a => a.status === 'trainee' && !a.busy);
const mgr0 = () => S.managers.find(m => !m.gm);
const bare = a => { a.busy = null; };
toastCase('artists.sign', () => { broke(); sign(S.pool[0].id); });
toastCase('artists.recast', () => { broke(); recast(); });
toastCase('debut.group1', () => { debutIds('group', [trn().id], 'X'); });
toastCase('debut.solo2', () => { debutIds('solo', [deb()[0].id, deb()[1].id], ''); });
toastCase('debut.money', () => { broke(); debutIds('solo', [trn().id], ''); });
toastCase('debut.busy', () => { const a = trn(); a.busy = { kind: 'x', title: 'x', left: 2, total: 2 }; debutIds('solo', [a.id], ''); });
toastCase('debut.name', () => { debutIds('group', [deb()[0].id, deb()[1].id], ' '); });
toastCase('offers.acceptSel', () => { openRoom('meet'); acceptSel(S.offers[0].id); });
toastCase('offers.investOffer', () => { broke(); const o = S.offers[0]; o.invest = { budget: 1e9, share: .2 }; o.invested = false; investOffer(o.id); });
toastCase('recruit.recHire', () => { broke(); const r = S.rec; r.cand = [{ id: 9001, name: 'X', eye: 5, fee: 20e6, sal: 3e6 }]; r.staff.length = 1; recHire(9001); });
toastCase('recruit.recHireMax', () => { const r = S.rec; r.cand = [{ id: 9001, name: 'X', eye: 5, fee: 1e6, sal: 1e6 }]; while (r.staff.length < 2) r.staff.push({ ...r.staff[0], id: 9002 + r.staff.length }); recHire(9001); });
toastCase('managers.hireMgr', () => { broke(); hireMgr(S.mgrPool[0].id); });
toastCase('managers.retrain', () => { broke(); const m = mgr0(); setDom(m.id, Object.keys(MDOM).find(k => k !== m.dom)); });
toastCase('managers.assignGM', () => { assignMgr(gmOf().id, 't0'); });
toastCase('managers.assignDom', () => { S.managers.forEach(x => { x.as = null; delete x.rt; }); const m = mgr0(); m.dom = 'actor'; assignMgr(m.id, 't0'); });
toastCase('gm.promoteGM', () => { broke(); promoteGM(mgr0().id); });
toastCase('contests.enterComp', () => { openRoom('lobby'); enterComp(S.comps.find(c => !c.k || c.k === 'tts').id); });
toastCase('events.invOpen', () => { const a = S.artists.find(x => x.scandal && x.scandal.inv); a.scandal.inv.ap = 0; a.scandal.inv.leads.forEach(l => { l.open = false; }); invOpen(a.id, 0); });
toastCase('review.prDo', () => { broke(); prDo('sns', 'tts'); });
toastCase('releases.doLiveMoney', () => { broke(); const a = deb()[0]; a.lastLive = -1; doLive([a.id]); });
toastCase('releases.doLiveTwice', () => { const a = deb()[0]; a.lastLive = abs(); doLive([a.id]); });
toastCase('releases.doFM', () => { const x = acts()[0]; x.m.forEach(id => { const a = byId(id); bare(a); a.fans = 0; }); doFM(x.k); });
toastCase('releases.releaseSingle', () => { S.artists.forEach(bare); S.camp = {}; openRoom('studio'); document.querySelector('#sAct').value = ''; releaseSingle(); });
toastCase('releases.holdConcert', () => { const x = acts()[0]; x.m.forEach(id => { byId(id).fans = 0; }); openRoom('studio'); holdConcert(x.k); });
toastCase('releases.produceFilm', () => { openRoom('acting'); produceFilm(); });
toastCase('ext2.writeSong', () => { viewSongs(); document.querySelector('#wMain').value = ''; writeSong(); });
toastCase('ext2.renewDo', () => { broke(); renewDo(deb()[0].id, 'r1'); });
toastCase('ext3.hsHire', () => { broke(); S.hsC = [{ id: 9100, name: 'BS. X', sk: 3, sal: 1e6, fee: 50e6 }]; hsHire(9100); });
toastCase('ext3.paRe', () => { broke(); paRe(deb()[0].id); });
toastCase('market.buyBiz', () => { broke(); buyBiz(Object.keys(BIZ).find(k => !S.biz.some(b => b.k === k))); });
toastCase('market.raiseBiz', () => { raiseBiz(S.biz[0].k, .9); });
toastCase('promo.preDo', () => { broke(); S.camp = {}; const x = acts()[0]; x.m.forEach(id => { const a = byId(id); bare(a); a.energy = 100; }); preDo(x.k, 'photo'); });
toastCase('promo.postDo', () => { const x = acts()[0]; x.m.forEach(id => { const a = byId(id); bare(a); a.energy = 100; }); S.camp = { [x.k]: { k: x.k, n: x.n, ph: 'post', used: { wk: abs(), l: ['s1'] }, hype: 0 } }; postDo(x.k, 's1'); });
toastCase('batches.batchSched', () => { batchSched(S.curBatch, 'vocal'); });
toastCase('saveView.saveCopyCode', () => { viewCode(); saveCopyCode(); });

export function runToasts(base) {
  const out = {};
  for (const c of TOAST_CASES) {
    setState(structuredClone(base));
    S.ui = {};
    closeM();
    seed(5);
    const el = document.getElementById('toast');
    if (el) el.textContent = '';
    try { c.run(); } catch (e) { out[c.name] = 'THROW ' + e.message; continue; }
    out[c.name] = (document.getElementById('toast')?.textContent) || null;
  }
  return out;
}

// ---- leftover-Vietnamese detection for lang=en (used by ui-en*.test.js) ----
const VI_LETTER = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
// proper nouns / names that come from data tables and are shown verbatim
const ALLOW_WORDS = new Set(['Tiếng', 'Việt']);
// Short Vietnamese strings reachable from S are proper nouns (names, partners): their words are allowed.
// Stored text is language-aware since phase 3, so long strings are no longer stripped from the render.
function storedStrings(root) {
  const short = new Set();
  const walk = v => {
    if (typeof v === 'string') {
      if (VI_LETTER.test(v) && v.length <= 40) for (const w of v.match(/\p{L}+/gu) || []) short.add(w);
    } else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        // object keys can be shown verbatim too (a.pw / S.partners are keyed by partner name)
        if (VI_LETTER.test(k) && !/^\d+$/.test(k)) walk(k);
        walk(x);
      }
    }
  };
  walk(root);
  return { short };
}

// returns the offending words/tokens of `text` (visible text of an en render)
export function offenders(text, state) {
  const { short } = storedStrings(state);
  // strings a case declares as legacy/raw stored text (extra-cases `stored`) are removed whole, as before
  for (const x of [...(state && state.extra ? state.extra : [])].filter(x => typeof x === 'string' && VI_LETTER.test(x)).sort((a, b) => b.length - a.length)) text = text.split(x).join(' ');
  const out = [];
  for (const w of text.match(/\p{L}+/gu) || []) if (VI_LETTER.test(w) && !short.has(w) && !ALLOW_WORDS.has(w)) out.push(w);
  for (const m of text.matchAll(/\b(TTS|QL|GĐ|CN|tr)\b|\bN\d+·T\d+\b|\bT[2-7]\b/gu)) out.push(m[0]);
  return out;
}

