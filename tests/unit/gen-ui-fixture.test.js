// @vitest-environment jsdom
// Sinh tests/fixtures/ui-rich.json (+ ui-new.json). Chỉ chạy khi GEN_UI_FIXTURE=1:  GEN_UI_FIXTURE=1 npx vitest run tests/unit/gen-ui-fixture.test.js
import { describe, it } from 'vitest';
import fs from 'node:fs';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, newGame, setState, byId } from '../../src/state.js';
import { setPos } from '../../src/ui/building.js';
import { nextWeek } from '../../src/systems/week.js';
import { sign } from '../../src/systems/artists.js';
import { hireMgr, assignMgr } from '../../src/systems/managers.js';
import { debutIds } from '../../src/systems/debut.js';
import { acceptOffer, acceptCast } from '../../src/systems/offers.js';
import { hireAsst, mkSong } from '../../src/systems/ext2.js';
import { doSingle, holdConcert } from '../../src/systems/releases.js';
import { genPAC, paHire, genHSC, hsHire } from '../../src/systems/ext3.js';
import { preDo } from '../../src/systems/promo.js';
import { BIZ, buyBiz } from '../../src/systems/market.js';
import { compHTML, enterComp } from '../../src/systems/batches.js';
import { dHold } from '../../src/systems/ext2.js';
import { invOpen, invStart, makeScandal } from '../../src/systems/events.js';
import { closeM } from '../../src/ui/modal.js';
import { CONCEPTS } from '../../src/data/rules.js';

noToggle();
const gen = process.env.GEN_UI_FIXTURE === '1' ? describe : describe.skip;

gen('sinh fixture UI', () => {
  it('ui-new + ui-rich', () => {
    document.body.innerHTML = SHELL;
    localStorage.clear();
    seed(42); setPos({}); newGame();
    fs.writeFileSync('tests/fixtures/ui-new.json', JSON.stringify(S));

    // ui-rich: chép từ state golden 110 tuần (không tham chiếu), rồi phủ thêm các khu vực
    seed(2024); setPos({});
    setState(structuredClone(JSON.parse(fs.readFileSync('tests/golden/actions110.json', 'utf8')).state));
    const log = [];
    const T = (n, fn) => { document.getElementById('toast')?.remove(); try { const r = fn(); const tt = document.getElementById('toast')?.textContent; if (r === false || tt) log.push(n + ': ' + r + ' ' + (tt || '')); } catch (e) { log.push(n + ': ' + e.message); } };
    const idle = ids => { for (let i = 0; i < 8 && ids().some(a => a.busy); i++) nextWeek(true, true); };
    S.money = Math.max(S.money, 900e6);
    for (let i = 0; i < 4; i++) T('sign' + i, () => S.pool[0] && sign(S.pool[0].id));
    T('mgr', () => { if (S.mgrPool[0]) hireMgr(S.mgrPool[0].id); });
    T('mgr2', () => { if (S.mgrPool[0]) hireMgr(S.mgrPool[0].id); });
    for (let i = 0; i < 2; i++) nextWeek(true, true);
    const tts = () => S.artists.filter(a => a.status === 'trainee' && !a.busy);
    T('group', () => { const t = tts(); return debutIds('group', [t[0].id, t[1].id], 'Nova Star'); });
    T('actor', () => { const t = tts(); return debutIds('actor', [t[0].id], ''); });
    for (let i = 0; i < 3; i++) nextWeek(true, true);
    T('songs', () => { const ids = S.artists.filter(a => a.status === 'debuted').map(a => a.id); mkSong([ids[0], ids[1]], Object.keys(CONCEPTS)[0], 'Đêm Không Ngủ', false); mkSong([ids[2]], Object.keys(CONCEPTS)[1], '', false); });
    idle(() => S.groups[0].members.map(byId));
    T('single', () => { const g = S.groups[0]; return doSingle('g' + g.id, Object.keys(CONCEPTS)[0], 20e6, 'Ánh Sao Đầu Tiên', false, 0); });
    for (let i = 0; i < 3; i++) nextWeek(true, true);
    idle(() => S.groups[0].members.map(byId));
    T('fans', () => S.groups[0].members.forEach(i => { const a = byId(i); if (a) a.fans = Math.max(a.fans, 25000); }));
    T('concert', () => holdConcert('g' + S.groups[0].id));
    T('asst', () => hireAsst(S.managers[0].id, 'sched', 2, 'Lan Chi', 5e6, 1e6));
    T('assign', () => { const m = S.managers[0], g = S.groups[0]; if (m && g) assignMgr(m.id, 'g' + g.id); const m2 = S.managers[1]; if (m2) assignMgr(m2.id, 'b' + S.batches[0].id); });
    T('offer', () => { const a = S.artists.filter(x => !x.busy && x.status === 'debuted'); const o = S.offers.find(x => x.type === 'movie' || x.type === 'drama'); if (o && a.length) return acceptCast(o.id, a.slice(0, 2).map(x => x.id), true); });
    T('pa', () => { const a = S.artists.find(x => x.status === 'debuted' && x.id !== undefined && S.groups.some(g => g.members.includes(x.id))); genPAC(a); return paHire(a.id, a.paC[0].id); });
    T('hs', () => { genHSC(); return hsHire(S.hsC[0].id); });
    T('biz', () => buyBiz(Object.keys(BIZ)[0]));
    T('comp', () => { const t0 = tts()[0]; if (t0) t0.dReady = 0; for (const c of S.comps) { const d = document.createElement('div'); d.innerHTML = compHTML(); document.body.appendChild(d); let n = 0; document.querySelectorAll('.cp' + c.id).forEach(x => { x.checked = n < c.t[0] && !dHold(byId(+x.value)) && ++n; }); const before = (S.compRuns || []).length; enterComp(c.id); d.remove(); if ((S.compRuns || []).length > before) return; } return false; });
    idle(() => S.groups[0].members.map(byId));
    T('pre', () => preDo('g' + S.groups[0].id, 'pre', false));
    T('single2', () => doSingle('g' + S.groups[0].id, Object.keys(CONCEPTS)[2], 20e6, 'Nắng Sau Mưa', false, 0));
    T('scandal', () => { const a = S.artists.find(x => x.status === 'debuted' && !x.scandal); makeScandal(a); invStart(a.id); invOpen(a.id, 0); });
    closeM();
    fs.writeFileSync('tests/fixtures/ui-rich.json', JSON.stringify(S));
    console.log(JSON.stringify(log), S.artists.map(a => a.id + ':' + a.status + ':' + a.name).join(' | '), JSON.stringify({ g: S.groups.length, songs: S.songs.length, camp: Object.keys(S.camp || {}), assts: S.assts.length, hs: !!S.hs, biz: S.biz.length, runs: (S.compRuns || []).length, scandal: S.artists.filter(a => a.scandal).length, ev: S.events.map(e => e.kind + ':' + (e.t || '')), off: S.offers.length, lr: !!S.lastRep, aw: S.awards.length, singles: S.singles.length, conc: S.concerts.length, films: S.films.length, bat: S.batches.length }));
  });
});
