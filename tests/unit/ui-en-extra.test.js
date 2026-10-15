// @vitest-environment jsdom
// en guard for the branches of the lobby/contests/recruit/batches/debut screens that the rich-state render does not reach
// (same scenarios as ui-vi-extra.test.js, whose vi output is frozen). Grows with each area task.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { noToggle, seed } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { setLang } from '../../src/i18n/index.js';
import { openRoom } from '../../src/ui/rooms.js';
import { closeM } from '../../src/ui/modal.js';
import { richState, visibleText, offenders } from './sim.js';
import { genComp, compHTML, compPrev, compPick, enterComp } from '../../src/systems/contests.js';
import { recHTML, recSignSug, recHunt, recSet } from '../../src/systems/recruit.js';
import { batchHTML, batchLive, openBatch } from '../../src/systems/batches.js';
import { debutRec, recLine, debutIds } from '../../src/systems/debut.js';
import { dqBanner, viewDebutQ, dqDo } from '../../src/systems/ext3.js';
import { t, tx } from '../../src/i18n/index.js';

noToggle(true);
let base, early;
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1790000000000);
  base = richState();
  early = richState(42, 0);
}, 120000);
afterEach(() => setLang('vi'));

const fresh = b => { setState(structuredClone(b)); S.ui = {}; closeM(); seed(77); };
const boost = () => S.artists.filter(a => a.status === 'trainee').forEach(a => { for (const k in a.st) a.st[k] = 70; a.dReady = 1; a.busy = null; });
const sheetText = () => visibleText(document.getElementById('sheet'));
const check = (name, text) => { const off = offenders(text, S); expect(off, `${name}: ${off.join(', ')}`).toEqual([]); };

describe('en: lobby debut form', () => {
  for (const [n, b] of [['base', () => base], ['early', () => early]])
    for (const ty of ['group', 'solo', 'actor'])
      it(`${n}-${ty}`, () => {
        fresh(b()); if (n === 'early') boost();
        setLang('en');
        openRoom('lobby');
        document.querySelector('#dType').value = ty; document.querySelector('#dType').onchange();
        check(`${n}-${ty}-0`, sheetText());
        document.querySelectorAll('.dsel').forEach((x, i) => { if (i < (ty === 'group' ? 3 : 1)) { x.checked = true; x.onchange(); } });
        check(`${n}-${ty}-sel`, sheetText());
      });
});

describe('en: contests, recruiters, batches, debut', () => {
  it('compHTML for every kind', () => {
    fresh(base);
    S.artists.forEach(a => { a.busy = null; a.scandal = null; });
    S.comps = []; for (const k of ['tts', 'tts', 'grp', 'solo', 'act']) genComp(k);
    S.batches.push({ id: 9999, n: 'Lứa 9', w: 1 });
    setLang('en');
    for (const kinds of [['tts'], ['grp'], ['solo'], ['act'], ['grp', 'solo', 'act']]) {
      document.getElementById('sheet').innerHTML = compHTML(kinds);
      for (const c of S.comps) { if (document.getElementById('cpo' + c.id)) { compPrev(c.id); check('prev0', document.getElementById('cpo' + c.id).textContent); compPick(c.id); check('pick', document.getElementById('cpo' + c.id).textContent); } }
      check(kinds.join('+'), sheetText());
    }
  });
  it('recHTML variants', () => {
    fresh(base); setLang('en');
    const box = document.getElementById('sheet');
    S.rec = null; box.innerHTML = recHTML(); check('rec-empty', sheetText());
    recHunt(); box.innerHTML = recHTML(); check('rec-hunted', sheetText());
    fresh(base); setLang('en');
    for (const mode of ['off', 'suggest', 'auto']) { recSet('mode', mode); box.innerHTML = recHTML(); check('rec-' + mode, sheetText()); }
    S.rec.reserve = 0; S.rec.staff.push({ id: 5, name: 'Test Nguyễn', eye: 7, fee: 28e6, sal: 5.5e6 }); box.innerHTML = recHTML(); check('rec-two', sheetText());
  });
  it('batchHTML variants', () => {
    fresh(base); setLang('en');
    const box = document.getElementById('sheet');
    box.innerHTML = batchHTML(); check('batch-one', sheetText());
    openBatch(true); box.innerHTML = batchHTML(); check('batch-two', sheetText());
    S.batches = []; box.innerHTML = batchHTML(); check('batch-none', sheetText());
  });
  it('debutRec / recLine / banner / viewDebutQ', () => {
    for (const [n, b] of [['base', base], ['early', early], ['boosted', early]]) {
      fresh(b); if (n === 'boosted') boost();
      setLang('en');
      const box = document.getElementById('sheet');
      for (const a of S.artists) {
        const r = debutRec(a);
        check(n + '-why', tx(r.why) + ' ' + tx(r.short));
      }
      box.innerHTML = S.artists.filter(a => a.status === 'trainee').map(recLine).join('') + dqBanner(); check(n + '-lines', sheetText());
      viewDebutQ(); check(n + '-dq', sheetText());
    }
  });
});


describe('en: extra toasts', () => {
  it('toasts', () => {
    const out = {};
    const run = (name, b, f) => { fresh(b); setLang('en'); const el = document.getElementById('toast'); if (el) el.textContent = ''; f(); out[name] = document.getElementById('toast')?.textContent || ''; };
    run('comp.group.none', base, () => { S.comps = []; genComp('grp'); openRoom('meet'); enterComp(S.comps[0].id); });
    run('comp.solo.count', base, () => { S.comps = []; genComp('solo'); openRoom('meet'); enterComp(S.comps[0].id); });
    run('comp.tts.money', base, () => { S.comps = []; genComp('tts'); S.money = 0; S.artists.forEach(a => { a.dReady = 0; a.busy = null; }); openRoom('lobby'); const c = S.comps[0]; [...document.querySelectorAll('.cp' + c.id)].slice(0, c.t[0]).forEach(x => { x.checked = true; }); enterComp(c.id); });
    run('comp.tts.hold', early, () => { S.comps = []; genComp('tts'); S.artists[0].dReady = 1; S.artists[0].noHold = false; openRoom('lobby'); const c = S.comps[0]; document.querySelectorAll('.cp' + c.id).forEach(x => { x.checked = true; }); enterComp(c.id); });
    run('rec.hunt.money', base, () => { S.money = 0; S.rec.hunted = 1; recHunt(); });
    run('rec.sign.none', base, () => { S.rec.sug = [-1]; recSignSug(); });
    run('batch.live.none', early, () => { S.artists.forEach(a => { a.busy = { kind: 'x', title: 'x', left: 1, total: 1 }; }); batchLive(S.curBatch); });
    run('dq.gone', base, () => { dqDo(S.artists[0].id, 'solo'); });
    run('dq.nogroup', early, () => { boost(); const a = S.artists[0]; S.artists.forEach(x => { if (x !== a) x.status = 'debuted'; }); dqDo(a.id, 'group'); });
    run('debut.group.name', early, () => { boost(); debutIds('group', S.artists.map(a => a.id), ''); });
    for (const [k, v] of Object.entries(out)) { expect(v, k).not.toBe(''); const off = offenders(v, S); expect(off, `${k}: ${v}`).toEqual([]); }
  });
});
