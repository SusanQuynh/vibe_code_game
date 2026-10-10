// @vitest-environment jsdom
// S và số lần gọi Math.random không được phụ thuộc ngôn ngữ: cùng kịch bản ở vi và en phải ra y hệt.
import { describe, it, expect, beforeEach } from 'vitest';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, newGame } from '../../src/state.js';
import { ROOMS } from '../../src/data/rules.js';
import { render, setPos } from '../../src/ui/building.js';
import { openRoom, setSchedTTS } from '../../src/ui/rooms.js';
import { closeM, view } from '../../src/ui/modal.js';
import { viewArtist, viewEvents, viewReport, viewReportFull, viewSkipWarn } from '../../src/ui/views.js';
import { viewInv } from '../../src/systems/events.js';
import { planFill, planNext, planRec, planSel, startPlanOne } from '../../src/ui/planning.js';
import { viewCode } from '../../src/ui/saveView.js';
import { setLang } from '../../src/i18n/index.js';
import { nextWeek } from '../../src/systems/week.js';
import { hireMgr } from '../../src/systems/managers.js';
import { setAll, setSched, sign } from '../../src/systems/artists.js';
import { debutIds } from '../../src/systems/debut.js';
import { acceptCast, acceptOffer, bestCast, investOffer, slotsOf } from '../../src/systems/offers.js';
import { acts, cbNow, cbSched, cbSchedRec, viewSec } from '../../src/systems/secretary.js';
import { propAll, viewProps } from '../../src/systems/proposals.js';
import { doFM, doLive, doSingle, holdConcert, viewCamp } from '../../src/systems/releases.js';
import { postAuto, postDo, preDo } from '../../src/systems/promo.js';
import { prDo } from '../../src/systems/review.js';

noToggle();

// Kịch bản: hành động của golden 110 tuần, cộng mở mọi phòng mỗi 5 tuần (đường render có thể ensure*), cộng quảng bá (preDo/doSingle/postDo/postAuto/prDo: chuỗi gán biến rồi addLog nên dịch nhầm sẽ làm S.log phụ thuộc ngôn ngữ). Các task sau thêm hành động của khu vực mình.
function run(lang, weeks = 40) {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  setLang(lang);
  seed(7);
  const base = Math.random; let n = 0;
  Math.random = () => { n++; return base(); };
  setPos({});
  newGame();
  for (let i = 0; i < weeks; i++) {
    if (i === 2 && S.mgrPool.length && S.managers.length < 1) hireMgr(S.mgrPool[0].id);
    if (i % 3 === 0 && S.artists.length < 5 && S.money > 150e6) for (const p of [...S.pool].slice(0, 1)) sign(p.id);
    for (const a of [...S.artists]) if (a.status === 'trainee' && a.dReady) debutIds('solo', [a.id], '');
    for (const o of [...S.offers].slice(0, 3)) { const a = S.artists.find(x => !x.busy && x.status === 'debuted'); if (a) acceptOffer(o.id, a.id, true); }
    { const o = S.offers.find(q => slotsOf(q) > 1), c = o && bestCast(o, S.artists.filter(a => !a.busy)); if (c && i === 21) acceptCast(o.id, c, true); } // lời mời nhiều người (ăn ý, mời đích danh)
    { const o = S.offers.find(q => q.invest && !q.invested); if (o && i === 17 && S.money > 150e6) investOffer(o.id); } // góp vốn phim
    acceptCast(-1, [], true); acceptCast(S.offers[0]?.id, [], true); // đường toast lỗi
    const x = acts().find(z => z.m.every(id => { const a = S.artists.find(q => q.id === id); return a && a.status === 'debuted' && !a.busy; }));
    if (x) {
      if (!S.camp[x.k] && i % 4 === 0) for (const id of ['photo', 'vpre', 'pre']) preDo(x.k, id, true);
      if (i % 4 === 1) doSingle(x.k, 'ballad', 30e6, 'Bài thử', true);
    }
    for (const k of Object.keys(S.camp)) if (S.camp[k].ph === 'post') { if (i % 2) postAuto(k, true); else for (const id of ['s1', 'radio', 'variety', 'fansign', 'challenge', 'live']) postDo(k, id, true); }
    if (x && i % 6 === 2) for (const t of ['sns', 'mag', 'clip', 'int']) prDo(t, x.k);
    if (i % 5 === 0) { for (const r of ROOMS) openRoom(r.id); closeM(); render(); }
    if (i % 10 === 0) { for (const a of [...S.artists]) view(() => viewArtist(a.id)); closeM(); } // hồ sơ nghệ sĩ (dWish ghi a.dw lúc render)
    if (i % 10 === 5) { for (const f of [viewReport, viewReportFull, viewEvents, viewSkipWarn]) view(f); for (const a of S.artists) if (a.scandal) view(() => viewInv(a.id)); closeM(); } // báo cáo, khung sự kiện, hồ sơ điều tra
    if (i % 10 === 4) { view(viewProps); view(viewSec); closeM(); if (i === 34) { propAll(); cbSchedRec(); } } // đề xuất của quản lý + Thư ký (propAll ghi lịch, cbSchedRec ghi cbPlan/log)
    if (i % 10 === 6) { for (const k of Object.keys(S.camp)) view(() => viewCamp(k)); closeM(); } // chiến dịch (đọc)
    if (i === 31) { const a = S.artists.find(q => q.status === 'debuted' && !q.busy); if (a) doLive([a.id]); doLive([-1]); } // livestream + toast lỗi
    if (x && i === 33) { doFM(x.k); doFM('zzz'); holdConcert('zzz'); }
    if (x && i === 35) holdConcert(x.k);
    if (x && i === 36) { cbSched(x.k); cbNow(x.k); }
    if (i % 10 === 3) { for (const a of S.artists.slice(0, 2)) { startPlanOne(a.id); planSel(2); planRec(); planFill(); planNext(); } view(viewCode); closeM(); } // xếp lịch lẻ (ghi a.days) + màn lưu
    if (i % 10 === 7) { setSchedTTS('vocal'); if (S.artists[0]) setSched(S.artists[0].id, 'dance'); if (i % 20 === 7) setAll('gym'); } // chuyển phòng tập (ghi a.days)
    nextWeek(true, true);
  }
  return { s: JSON.stringify(S), n };
}

describe('S độc lập ngôn ngữ', () => {
  it('vi và en cho cùng S và cùng số lần gọi Math.random', () => {
    const vi = run('vi'), en = run('en');
    setLang('vi');
    expect(en.n).toBe(vi.n);
    expect(en.s === vi.s).toBe(true);
    expect(vi.n).toBeGreaterThan(100);
    expect(vi.s).toMatch(/"ph":"post"|Quảng bá «/); // kịch bản thật sự chạy quảng bá
  }, 60000);
});
