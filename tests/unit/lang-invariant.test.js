// @vitest-environment jsdom
// S và số lần gọi Math.random không được phụ thuộc ngôn ngữ: cùng kịch bản ở vi và en phải ra y hệt.
import { describe, it, expect, beforeEach } from 'vitest';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, abs, byId, newGame } from '../../src/state.js';
import { CONCEPTS, ROOMS } from '../../src/data/rules.js';
import { render, setPos } from '../../src/ui/building.js';
import { openRoom, setSchedTTS } from '../../src/ui/rooms.js';
import { closeM, view } from '../../src/ui/modal.js';
import { viewArtist, viewEvents, viewReport, viewReportFull, viewSkipWarn } from '../../src/ui/views.js';
import { viewInv } from '../../src/systems/events.js';
import { planFill, planNext, planRec, planSel, startPlanOne } from '../../src/ui/planning.js';
import { viewCode } from '../../src/ui/saveView.js';
import { setLang } from '../../src/i18n/index.js';
import { nextWeek, setPs } from '../../src/systems/week.js';
import { assignMgr, fireMgr, hireMgr, rehuntMgr, setAuto, setBoss, toggleMA } from '../../src/systems/managers.js';
import { recast, setAll, setSched, sign } from '../../src/systems/artists.js';
import { debutAnalysis, debutIds } from '../../src/systems/debut.js';
import { batchLive, batchSched, compPick, compPrev, enterComp, genComp, moveBatch, newBatch } from '../../src/systems/batches.js';
import { dqBanner, dqDo, dqKeep, dqLater, hsApply, hsFire, hsHire, paFire, paHire, paOK, paOpen, paRe, viewDebutQ } from '../../src/systems/ext3.js';
import { acceptCast, acceptOffer, bestCast, investOffer, slotsOf } from '../../src/systems/offers.js';
import { acts, cbNow, cbSched, cbSchedRec, viewSec } from '../../src/systems/secretary.js';
import { cfPick, propAll, viewProps } from '../../src/systems/proposals.js';
import { doFM, doLive, doSingle, holdConcert, viewCamp } from '../../src/systems/releases.js';
import { postAuto, postDo, preAuto, preDo } from '../../src/systems/promo.js';
import { buyBiz, buybackBiz, raiseBiz, sellBiz, upBiz } from '../../src/systems/market.js';
import { prDo, prGo } from '../../src/systems/review.js';
import { mkSong, songAct, viewSong, viewSongs, writeSong } from '../../src/systems/ext2.js';

noToggle();
Object.assign(globalThis, { doFM, doLive, postAuto, preAuto, prDo }); // prGo chạy chuỗi data-go bằng new Function nên cần các hàm này ở phạm vi toàn cục (như globals.js)

// Kịch bản: hành động của golden 110 tuần, cộng mở mọi phòng mỗi 5 tuần (đường render có thể ensure*), cộng quảng bá và các hành động ghi S của từng khu vực.
// Hành động không gắn vào may rủi của kịch bản: mỗi hành động tự dựng tiền đề (bơm tiền, giải phóng busy, nới yêu cầu lời mời, bật đề xuất cho quản lý…) giống hệt ở vi và en, rồi bọc trong T(tag, fn):
// T gom các dòng log mới (S.log chỉ giữ 80 dòng nên không thể đọc lại cuối kịch bản) và đếm số lần hành động THẬT SỰ có tác dụng (ghi ít nhất một dòng log). Cuối kịch bản test khẳng định mỗi tag đã chạy và dấu vết log của nó có mặt.
// Chuỗi dịch lọt vào S/log thì S, did hoặc dấu vết sẽ lệch giữa hai ngôn ngữ.
const rich = () => { if (S.money < 3e9) S.money = 3e9; }; // tiền đề: đủ tiền (giống nhau ở cả hai ngôn ngữ)
const freeUp = (n, ok = () => true) => { let c = S.artists.filter(a => !a.busy && ok(a)).length; for (const a of S.artists) { if (c >= n) break; if (a.busy && ok(a)) { a.busy = null; c++; } } }; // tiền đề: ít nhất n nghệ sĩ rảnh
const actNow = fans => { const z = acts()[0]; if (!z) return null; for (const id of z.m) { const a = byId(id); if (a) { a.busy = null; a.fans = Math.max(a.fans, fans); } } if (z.k[0] === 'g') { const g = S.groups.find(q => 'g' + q.id === z.k); if (g) g.hiatus = 0; } return z; }; // tiền đề: một nhóm/solo rảnh, đủ fan
const DEB = a => a.status === 'debuted';
function run(lang, weeks = 40) {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  setLang(lang);
  seed(7);
  const did = {}, tr = [];
  const T = (tag, fn) => { const h = S.log[0]; fn(); let k = 0; for (const e of S.log) { if (e === h) break; k++; tr.push(e.t); } if (k) did[tag] = (did[tag] || 0) + 1; return k; };
  const base = Math.random; let n = 0;
  Math.random = () => { n++; return base(); };
  setPos({});
  newGame();
  for (let i = 0; i < weeks; i++) {
    if (i === 2 && S.mgrPool.length && S.managers.length < 1) hireMgr(S.mgrPool[0].id);
    if (i % 3 === 0 && S.artists.length < 5 && S.money > 150e6) for (const p of [...S.pool].slice(0, 1)) sign(p.id);
    for (const a of [...S.artists]) if (a.status === 'trainee' && a.dReady) debutIds('solo', [a.id], '');
    for (const o of [...S.offers].slice(0, 3)) { const a = S.artists.find(x => !x.busy && x.status === 'debuted'); if (a) T('offer', () => acceptOffer(o.id, a.id, true)); }
    if (i === 21) { rich(); const o = S.offers.find(q => slotsOf(q) > 1); if (o) { o.req = {}; o.fame = 0; o.target = null; freeUp(slotsOf(o), DEB); const c = bestCast(o, S.artists.filter(a => !a.busy)); if (c && c.length > 1) T('cast', () => acceptCast(o.id, c, true)); } } // lời mời nhiều người (ăn ý): nới yêu cầu, giải phóng nghệ sĩ
    if (i === 8) { // cuộc thi cho TTS: mở Sảnh (compHTML), chọn người rảnh, xem trước/gợi ý, đăng ký; lỗi khi chưa chọn
      rich(); if (!(S.comps || []).length) genComp(); const c = [...S.comps].sort((q, r) => q.t[0] - r.t[0])[0], tts = S.artists.filter(a => a.status === 'trainee');
      if (c) { freeUp(c.t[0], a => a.status === 'trainee'); tts.forEach(a => { a.dReady = 0; }); openRoom('lobby'); enterComp(c.id); compPick(c.id); compPrev(c.id); const sel = [...document.querySelectorAll('.cp' + c.id + ':checked')].length; did.compSel = sel; T('comp', () => enterComp(c.id)); closeM(); }
    }
    if (i === 11) { // lứa TTS: mở lứa mới, chuyển một TTS sang, xếp lịch cả lứa, livestream cả lứa
      rich(); freeUp(2, a => a.status === 'trainee'); const a = S.artists.find(q => q.status === 'trainee' && !q.busy);
      if (a) { T('newBatch', newBatch); const b = S.batches.at(-1); T('moveBatch', () => moveBatch(a.id, b.id)); batchSched(b.id, 'vocal'); did.batchSched = a.days.includes('vocal') ? 1 : 0; T('batchLive', () => batchLive(b.id)); batchLive(-1); }
    }
    if (i === 13) { // hàng chờ debut: banner, màn quyết định (dWish ghi a.dw), debut nhóm theo mong muốn, giữ làm TTS, để tuần sau
      rich(); freeUp(3, a => a.status === 'trainee'); const ts = S.artists.filter(a => a.status === 'trainee' && !a.busy).slice(0, 3);
      if (ts.length === 3) { ts.forEach(a => { a.dReady = 1; a.dqSkip = 0; for (const k in a.st) a.st[k] = 90; }); document.getElementById('sheet').innerHTML = dqBanner(); view(viewDebutQ); T('dqDo', () => dqDo(ts[0].id, 'group')); T('dqKeep', () => dqKeep(ts[2].id)); dqLater(ts[1].id); did.dqLater = ts[1].dqSkip > abs() ? 1 : 0; dqDo(-1, 'solo'); closeM(); }
    }
    if (i === 14) { // Phòng Đầu tư: mở ngành, mở rộng, gọi vốn (bán cổ phần + chờ), mua lại, bán; mở phòng Đầu tư/Thị trường
      rich(); openRoom('invest'); openRoom('market'); closeM();
      T('buyBiz', () => buyBiz('cafe')); buyBiz('cafe'); T('buyBiz2', () => buyBiz('food')); T('upBiz', () => upBiz('cafe')); T('raiseBiz', () => raiseBiz('cafe', .2)); raiseBiz('cafe', .2); raiseBiz('food', .6);
      T('buybackBiz', () => buybackBiz('cafe')); openRoom('invest'); closeM(); T('sellBiz', () => sellBiz('food', { dataset: { c: '1' }, textContent: '' }));
    }
    if (i === 15) { // Văn phòng Quản lý: phân công (danh sách tự chọn, nhóm), cấp trên/vòng lặp, chế độ tự động, tuyển ứng viên mới
      rich(); if (S.managers.length < 2 && S.mgrPool.length) T('hire2', () => hireMgr(S.mgrPool[0].id));
      const [m1, m2] = S.managers, a0 = S.artists.find(DEB);
      if (m1 && m2 && a0) {
        T('mAssign', () => assignMgr(m1.id, 'l0')); toggleMA(m1.id, a0.id, true); did.mList = m1.as.ids.includes(a0.id) ? 1 : 0; toggleMA(m2.id, a0.id, true);
        T('mBoss', () => setBoss(m2.id, String(m1.id))); setBoss(m1.id, String(m2.id)); did.mLoop = m1.boss ? 0 : 1; // vòng lặp cấp bậc bị từ chối
        const g = S.groups[0]; if (g) { T('mGroup', () => assignMgr(m1.id, 'g' + g.id)); assignMgr(m2.id, 'g' + g.id); did.mTaken = m2.as?.t === 'g' ? 0 : 1; }
        setAuto(m1.id, 'short'); setPs(m1.id, '1'); did.mAuto = m1.auto === 'short' && m1.ps === 1 ? 1 : 0;
        const pool0 = S.mgrPool.map(q => q.id).join(); rehuntMgr(); did.mRehunt = S.mgrPool.map(q => q.id).join() !== pool0 ? 1 : 0;
        T('mUnboss', () => setBoss(m2.id, '')); openRoom('mgr'); closeM();
      }
    }
    if (i === 19) { // trợ lý cá nhân (chọn, đổi ứng viên, thuê, cho nghỉ) và chuyên gia sức khỏe (render phòng Gym tạo ứng viên, thuê, áp dụng khuyến nghị nghỉ)
      rich(); const a = S.artists.find(paOK);
      if (a) { paOpen(a.id); did.paC = (a.paC || []).length; const c0 = (a.paC || []).map(q => q.id).join(); paRe(a.id); did.paRe = (a.paC || []).map(q => q.id).join() !== c0 ? 1 : 0; T('paHire', () => paHire(a.id, a.paC[0].id)); did.paHas = a.pa ? 1 : 0; T('paFire', () => paFire(a.id)); closeM(); }
      openRoom('gym'); closeM(); if (S.hsC && !S.hs) T('hsHire', () => hsHire(S.hsC[0].id));
      const b = S.artists.find(q => q.status === 'debuted'); if (b && S.hs) { b.hsF = { w: abs(), why: ['năng lượng chỉ còn 20'], n: 3, st: 'new' }; openRoom('gym'); closeM(); T('hsApply', () => hsApply(b.id)); }
    }
    if (i === 22) { // Phòng Truyền thông: render kế hoạch đề xuất ở ngôn ngữ đang chạy rồi bấm "Duyệt" (prGo ghi S.prHist từ data-t, luôn là chữ vi)
      rich(); S.prUsed = {}; openRoom('pr'); const bs = [...document.querySelectorAll('#sheet [data-go]')].slice(0, 3); did.prBtn = bs.length;
      for (const b of bs) T('prGo', () => prGo(b)); closeM(); did.prHist = (S.prHist || []).length;
    }
    if (i === 38 && S.hs) T('hsFire', () => hsFire({ dataset: { c: '1' }, textContent: '' })); // cho chuyên gia nghỉ việc (đã bấm xác nhận)
    if (i === 38 && S.managers.length > 1) T('mFire', () => fireMgr(S.managers.at(-1).id, { dataset: { c: '1' }, textContent: '' })); // cho quản lý nghỉ việc (đã bấm xác nhận)
    if (i === 17) { rich(); let o = S.offers.find(q => q.invest && !q.invested); if (!o) { o = S.offers.find(q => q.genre && !q.invested); if (o) o.invest = { budget: 300e6, share: .1 }; } if (o) T('invest', () => investOffer(o.id)); } // góp vốn phim (bơm tiền; nếu thiếu thì gắn mục góp vốn vào một lời mời phim, vì phim cần thể loại)
    acceptCast(-1, [], true); acceptCast(S.offers[0]?.id, [], true); // đường toast lỗi
    const x = acts().find(z => z.m.every(id => { const a = S.artists.find(q => q.id === id); return a && a.status === 'debuted' && !a.busy; }));
    if (x) {
      if (!S.camp[x.k] && i % 4 === 0) T('pre', () => { for (const id of ['photo', 'vpre', 'pre']) preDo(x.k, id, true); });
      if (i % 4 === 1) T('single', () => doSingle(x.k, 'ballad', 30e6, 'Bài thử', true));
    }
    for (const k of Object.keys(S.camp)) if (S.camp[k].ph === 'post') { T('post', () => { if (i % 2) postAuto(k, true); else for (const id of ['s1', 'radio', 'variety', 'fansign', 'challenge', 'live']) postDo(k, id, true); }); }
    if (x && i % 6 === 2) T('pr', () => { for (const t of ['sns', 'mag', 'clip', 'int']) prDo(t, x.k); });
    if (i % 5 === 0) { for (const r of ROOMS) openRoom(r.id); closeM(); render(); }
    if (i % 10 === 0) { for (const a of [...S.artists]) view(() => viewArtist(a.id)); closeM(); } // hồ sơ nghệ sĩ (dWish ghi a.dw lúc render)
    if (i % 10 === 5) { for (const f of [viewReport, viewReportFull, viewEvents, viewSkipWarn]) view(f); for (const a of S.artists) if (a.scandal) view(() => viewInv(a.id)); closeM(); } // báo cáo, khung sự kiện, hồ sơ điều tra
    if (i % 10 === 4) { // đề xuất của quản lý + Thư ký. Tiền đề: hai quản lý bật đề xuất, quản lý 1 (auto short) xếp lịch cho 3 người, quản lý 2 (auto off) chỉ phụ trách người đầu và xin nhận dự án → xung đột (trùng người, quá sức) treo chờ Giám đốc; lịch của hai người còn lại tự duyệt
      if (i === 24 || i === 34) { rich(); if (S.managers.length < 2 && S.mgrPool.length) T('hire2', () => hireMgr(S.mgrPool[0].id)); freeUp(3, DEB); const tg = [...S.artists.filter(DEB).slice(0, 3), ...S.artists.filter(a => a.status === 'trainee').slice(0, 1)]; tg.forEach((a, j) => { a.busy = null; a.energy = j === 0 ? 40 : 80; a.appr = 0; }); S.offers.slice(0, 3).forEach(o => { o.req = {}; o.fame = 0; o.target = null; });
        S.managers.slice(0, 2).forEach((m, j) => { m.as = { t: 'l', ids: (j ? tg.slice(0, 1) : tg).map(a => a.id) }; m.ps = 2; m.auto = j ? 'off' : 'short'; m.boss = null; }); S.props = null; }
      view(viewProps); if (i === 24 || i === 34) { const P = S.props; did.pm = Math.max(did.pm || 0, Object.keys(P.m).length); did.ps = Math.max(did.ps || 0, ...Object.values(P.m).map(q => q.s.length)); did.pp = Math.max(did.pp || 0, ...Object.values(P.m).map(q => q.p.length)); did.pc = Math.max(did.pc || 0, P.c.filter(c => c.pend).length); }
      view(viewSec); closeM();
      if (i === 34) { propAll(); did.pa = Object.values(S.props.m).reduce((q, m) => q + [...m.s, ...m.p].filter(x => x.ok === 1).length, 0); for (const c of S.props.c.filter(q => q.pend)) T('cfPick', () => cfPick(c.id)); T('cbRec', cbSchedRec); } } // propAll ghi lịch/nhận dự án (đếm mục ok=1; không ghi log), cfPick xử lý xung đột, cbSchedRec ghi cbPlan/log
    if (i % 10 === 6) { for (const k of Object.keys(S.camp)) view(() => viewCamp(k)); closeM(); } // chiến dịch (đọc)
    if (i === 25) { openRoom('lobby'); for (const ty of ['group', 'solo', 'actor']) { const el = document.getElementById('dType'); el.value = ty; el.onchange(); document.querySelectorAll('.dsel').forEach((b, j) => { b.checked = j < 2; }); debutAnalysis(); } closeM(); debutIds('group', [], ''); debutIds('solo', [], ''); recast(); } // Sảnh: form debut, phân tích, toast lỗi, casting lại (genPool dùng RNG)
    if (i === 27) { rich(); freeUp(6); view(viewSongs); document.querySelectorAll('.wco').forEach((e, j) => { e.checked = j < 3; }); T('write', writeSong); view(viewSongs); T('write2', writeSong); S.money = 1e6; view(viewSongs); writeSong(); closeM(); } // sáng tác có người viết chung rồi bài thứ hai (mkSong dùng RNG, busy) + toast lỗi hết tiền
    if (i === 29) { rich(); if (!(S.songs || []).some(q => q.st === 'review')) mkSong([S.artists[0].id], Object.keys(CONCEPTS)[0], 'Bản thử', false); for (const sg of [...S.songs]) { view(() => viewSong(sg.id)); if (sg.st === 'review') T('songOk', () => songAct(sg.id, 'ok')); } T('songRedo', () => songAct(S.songs[0].id, 'redo')); if (S.songs.length > 1) T('songDrop', () => songAct(S.songs.at(-1).id, 'drop')); closeM(); } // xem/duyệt/chỉnh/bỏ bài (tạo bản demo chờ duyệt nếu chưa có)
    if (i === 31) { rich(); const a = S.artists.find(DEB); if (a) { a.lastLive = 0; T('live', () => doLive([a.id])); doLive([a.id]); } doLive([-1]); } // livestream + toast lỗi (đã live tuần này, không có ai)
    if (i === 33) { rich(); const z = actNow(40000); if (z) T('fm', () => doFM(z.k)); doFM('zzz'); holdConcert('zzz'); } // fan meeting (đủ fan, rảnh) + toast lỗi
    if (i === 35) { rich(); const z = actNow(80000); if (z) T('concert', () => holdConcert(z.k)); } // concert
    if (i === 36) { rich(); const z = actNow(0); if (z) { T('cbSched', () => cbSched(z.k)); T('cbNow', () => cbNow(z.k)); } } // hẹn comeback rồi triển khai ngay
    if (i % 10 === 3) { for (const a of S.artists.slice(0, 2)) { startPlanOne(a.id); planSel(2); planRec(); planFill(); planNext(); } view(viewCode); closeM(); } // xếp lịch lẻ (ghi a.days) + màn lưu
    if (i % 10 === 7) { setSchedTTS('vocal'); if (S.artists[0]) setSched(S.artists[0].id, 'dance'); if (i % 20 === 7) setAll('gym'); } // chuyển phòng tập (ghi a.days)
    nextWeek(true, true);
  }
  did.hsF = S.artists.filter(q => q.hsF && q.hsF.why.length).length; // hsTick (chuỗi hsRisk vào S.hsF.why) đã chạy hằng tuần
  return { s: JSON.stringify(S), n, did, tr: tr.join('\n') };
}

describe('S độc lập ngôn ngữ', () => {
  it('vi và en cho cùng S, cùng số lần gọi Math.random, cùng dấu vết log, và mọi hành động đã chạy thật', () => {
    const vi = run('vi'), en = run('en');
    setLang('vi');
    expect(en.n).toBe(vi.n);
    expect(en.did).toEqual(vi.did);
    expect(en.tr === vi.tr).toBe(true);
    expect(en.s === vi.s).toBe(true);
    expect(vi.n).toBeGreaterThan(100);
    // mỗi hành động đã ghi log ít nhất một lần (không chỉ đi đường toast lỗi) và dấu vết đúng của nó có mặt
    const must = { comp: /lên đường dự thi «/, newBatch: /Mở Lứa \d+/, moveBatch: /Chuyển .+ sang Lứa/, batchLive: /livestream trò chuyện/, dqDo: /vui vì được debut|tiếc vì muốn debut/, dqKeep: /tiếp tục làm thực tập sinh/, offer: /nhận .+ «/, cast: /· \d+ người/, invest: /Góp vốn .+ vào phim «/, pre: /Ảnh teaser/, single: /Single «Bài thử»/, post: /lên radio/, pr: /Quảng cáo SNS cho/,
      write: /vào phòng thu sáng tác «/, write2: /vào phòng thu sáng tác «/, songOk: /GĐ Âm nhạc duyệt «/, songRedo: /Chỉnh sửa «/, songDrop: /Bỏ bài «/, live: /livestream trò chuyện/, fm: /Fan meeting của/, concert: /Concert của/,
      cbSched: /Hẹn comeback cho/, cbNow: /Thư ký triển khai comeback/, hire2: /Tuyển quản lý/, mAssign: /Quản lý .+ phụ trách|phụ trách/, mBoss: /giờ báo cáo cho/, mUnboss: /báo cáo trực tiếp Giám đốc/, mGroup: /phụ trách nhóm/, mFire: /Cho nghỉ việc quản lý/, buyBiz: /Mở Cà phê/, buyBiz2: /Mở Chuỗi nhà hàng/, upBiz: /Mở rộng Cà phê thần tượng lên cấp 2/, raiseBiz: /kêu gọi vốn: bán 20% cổ phần/, buybackBiz: /Mua lại toàn bộ cổ phần Cà phê/, sellBiz: /Bán Chuỗi nhà hàng/, paHire: /trợ lý cá nhân|Công ty chọn trợ lý/, paFire: /Trợ lý cá nhân .+ nghỉ việc/, hsHire: /Tuyển chuyên gia chăm sóc sức khỏe/, hsApply: /theo khuyến nghị sức khỏe/, hsFire: /Chuyên gia .+ nghỉ việc/, prGo: /Fan meeting|livestream|Quảng cáo SNS|lên tạp chí|phỏng vấn|Clip của|quảng bá hình ảnh/, cfPick: /Giám đốc xử lý xung đột/, cbRec: /Thư ký hẹn comeback theo khuyến nghị/ };
    for (const [k, re] of Object.entries(must)) { expect(vi.did[k], `hành động ${k} phải có tác dụng`).toBeGreaterThan(0); expect(vi.tr, `dấu vết log của ${k}`).toMatch(re); }
    // đề xuất của quản lý: có mục lịch, dự án và xung đột treo chờ Giám đốc (cfHTML/itDesc/stTag được render và so sánh)
    expect(vi.did.prBtn).toBeGreaterThan(0); expect(vi.did.prHist).toBeGreaterThan(0); expect(vi.s).toMatch(/"prHist":\["T\d+: /); // S.prHist luôn là chữ vi dù render ở en
    for (const k of ['paC', 'paRe', 'paHas', 'hsF']) expect(vi.did[k], `PA/HS ${k}`).toBeGreaterThan(0);
    for (const k of ['mList', 'mLoop', 'mTaken', 'mAuto', 'mRehunt']) expect(vi.did[k], `quản lý ${k}`).toBe(1);
    expect(vi.did.compSel).toBeGreaterThan(0); expect(vi.did.batchSched).toBe(1); expect(vi.did.dqLater).toBe(1); // gợi ý cuộc thi chọn được người; xếp lịch cả lứa ghi a.days; hoãn debut ghi dqSkip
    expect(vi.did.pm).toBeGreaterThan(0); expect(vi.did.ps).toBeGreaterThan(0); expect(vi.did.pp).toBeGreaterThan(0); expect(vi.did.pc).toBeGreaterThan(0); expect(vi.did.pa).toBeGreaterThan(0);
  }, 60000);
});
