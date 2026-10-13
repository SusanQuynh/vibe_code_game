// @vitest-environment jsdom
// Extra Vietnamese display baselines for branches the main snapshots do not reach (recorded BEFORE the area was translated).
// Files under __snapshots__/ui-vi-extra/ are never regenerated: a diff means the vi output drifted.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { noToggle, seed } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { openRoom } from '../../src/ui/rooms.js';
import { closeM } from '../../src/ui/modal.js';
import { richState } from './sim.js';
import { genComp, compHTML, compPrev, compPick, enterComp, bonusTxt } from '../../src/systems/contests.js';
import { recHTML, recSignSug, recHunt, recHire, recSet } from '../../src/systems/recruit.js';
import { batchHTML, batchLive, openBatch } from '../../src/systems/batches.js';
import { debutRec, recLine, debutAnalysis, debutIds } from '../../src/systems/debut.js';
import { dqBanner, viewDebutQ, dqDo, dOpts } from '../../src/systems/ext3.js';
import { byId } from '../../src/state.js';

noToggle();
let base, early;
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1790000000000);
  base = richState();
  early = richState(42, 0);
}, 120000);
afterAll(() => vi.useRealTimers());

const fresh = b => { setState(structuredClone(b)); S.ui = {}; closeM(); seed(77); };
const sheet = () => document.getElementById('sheet').innerHTML;
const snap = (name, v) => expect(typeof v === 'string' ? v : JSON.stringify(v, null, 1)).toMatchFileSnapshot(`__snapshots__/ui-vi-extra/${name}`);
// give trainees high stats so every debut branch (group/solo/actor, both) is reachable
const boost = () => S.artists.filter(a => a.status === 'trainee').forEach(a => { for (const k in a.st) a.st[k] = 70; a.dReady = 1; a.busy = null; });

describe('lobby debut form', () => {
  for (const [n, b] of [['base', () => base], ['early', () => early]])
    for (const ty of ['group', 'solo', 'actor']) {
      it(`${n}-${ty}`, async () => {
        fresh(b()); if (n === 'early') boost();
        openRoom('lobby');
        document.querySelector('#dType').value = ty; document.querySelector('#dType').onchange();
        const h0 = sheet(); // read the DOM synchronously: the walking-chibi interval in building.js mutates it between awaits
        document.querySelectorAll('.dsel').forEach((x, i) => { if (i < (ty === 'group' ? 3 : 1)) { x.checked = true; x.onchange(); } });
        const h1 = sheet();
        await snap(`lobby-${n}-${ty}-0.html`, h0);
        await snap(`lobby-${n}-${ty}-sel.html`, h1);
      });
    }
  it('debutAnalysis with 1 group member', async () => {
    fresh(early); boost(); openRoom('lobby');
    document.querySelectorAll('.dsel')[0].checked = true; document.querySelectorAll('.dsel')[0].onchange();
    const h = document.getElementById('dAna').innerHTML;
    await snap('lobby-early-group-1.html', h);
  });
});

describe('contests', () => {
  it('compHTML for every kind + compPrev + compPick', async () => {
    fresh(base);
    S.artists.forEach(a => { a.busy = null; a.scandal = null; });
    S.comps = []; for (const k of ['tts', 'tts', 'grp', 'solo', 'act']) genComp(k);
    S.batches.push({ id: 9999, n: 'Lứa 9', w: 1 });
    const out = {};
    for (const kinds of [['tts'], ['grp'], ['solo'], ['act'], ['grp', 'solo', 'act']]) {
      document.getElementById('sheet').innerHTML = compHTML(kinds);
      out[kinds.join('+')] = sheet();
      const pv = {};
      for (const c of S.comps) {
        const el = document.getElementById('cpo' + c.id);
        if (!el) continue;
        compPrev(c.id); const a0 = el.textContent;
        compPick(c.id); pv[c.id] = [a0, el.textContent];
      }
      out[kinds.join('+') + ':prev'] = pv;
    }
    for (const c of S.comps) for (const r of [1, 2, 3, 4]) out['bonus' + c.id + '-' + r] = bonusTxt(c, r);
    await snap('contests.json', out);
  });
});

describe('recruit', () => {
  it('recHTML variants', async () => {
    fresh(base);
    const out = {};
    S.rec = null; out.empty = recHTML();
    recHunt(); out.hunted0 = recHTML();
    S.rec.staff = []; S.rec.hunted = 1; out.cand = recHTML();
    fresh(base);
    for (const mode of ['off', 'suggest', 'auto']) { recSet('mode', mode); out['mode-' + mode] = recHTML(); }
    S.rec.log = ['dòng log 1', 'dòng log 2'];
    S.rec.reserve = 0; out.reserve0 = recHTML();
    S.rec.staff.length = 0; S.rec.staff.push({ id: 5, name: 'Test Nguyễn', eye: 7, fee: 28e6, sal: 5.5e6 }, { id: 6, name: 'B', eye: 2, fee: 8e6, sal: 3e6 }); out.two = recHTML();
    await snap('recruit.json', out);
  });
});

describe('batches', () => {
  it('batchHTML variants', async () => {
    fresh(base);
    const out = { one: batchHTML() };
    openBatch(true); out.two = batchHTML();
    S.batches = []; out.none = batchHTML();
    fresh(early); out.early = batchHTML();
    await snap('batches.json', out);
  });
});

describe('debut', () => {
  it('debutRec / recLine / dqBanner / viewDebutQ', async () => {
    const out = {};
    for (const [n, b] of [['base', base], ['early', early], ['boosted', early]]) {
      fresh(b); if (n === 'boosted') boost();
      out[n] = { rec: S.artists.map(a => debutRec(a)), line: S.artists.filter(a => a.status === 'trainee').map(a => recLine(a)), banner: dqBanner(), opts: S.artists.map(a => { const o = dOpts(a); return o && { t: o.r.t, why: o.r.why, short: o.r.short, soloOK: o.soloOK, grpOK: o.grpOK, actOK: o.actOK, both: o.both }; }) };
      viewDebutQ(); out[n].dq = sheet();
    }
    await snap('debut.json', out);
  });
});

describe('extra toasts', () => {
  it('toasts', async () => {
    const out = {};
    const run = (name, b, f) => { fresh(b); const el = document.getElementById('toast'); if (el) el.textContent = ''; try { f(); } catch (e) { out[name] = 'THROW ' + e.message; return; } out[name] = document.getElementById('toast')?.textContent || null; };
    run('comp.group.none', base, () => { S.comps = []; genComp('grp'); openRoom('meet'); enterComp(S.comps[0].id); });
    run('comp.solo.count', base, () => { S.comps = []; genComp('solo'); openRoom('meet'); enterComp(S.comps[0].id); });
    run('comp.tts.money', base, () => { S.comps = []; genComp('tts'); S.money = 0; S.artists.forEach(a => { a.dReady = 0; a.busy = null; }); openRoom('lobby'); const c = S.comps[0]; const bx = [...document.querySelectorAll('.cp' + c.id)]; bx.slice(0, c.t[0]).forEach(x => { x.checked = true; }); enterComp(c.id); });
    run('comp.tts.hold', early, () => { S.comps = []; genComp('tts'); S.artists[0].dReady = 1; S.artists[0].noHold = false; openRoom('lobby'); const c = S.comps[0]; document.querySelectorAll('.cp' + c.id).forEach(x => { x.checked = true; }); enterComp(c.id); });
    run('rec.hunt.money', base, () => { S.money = 0; S.rec.hunted = 1; recHunt(); });
    run('rec.sign.none', base, () => { S.rec.sug = [-1]; recSignSug(); });
    run('batch.live.none', early, () => { S.artists.forEach(a => { a.busy = { kind: 'x', title: 'x', left: 1, total: 1 }; }); batchLive(S.curBatch); });
    run('dq.gone', base, () => { dqDo(S.artists[0].id, 'solo'); });
    run('dq.nogroup', early, () => { boost(); const a = S.artists[0]; S.artists.forEach(x => { if (x !== a) x.status = 'debuted'; }); dqDo(a.id, 'group'); });
    run('debut.group.name', early, () => { boost(); debutIds('group', S.artists.map(a => a.id), ''); });
    await snap('extra-toasts.json', out);
  });
});
