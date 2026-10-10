// @vitest-environment jsdom
// S và số lần gọi Math.random không được phụ thuộc ngôn ngữ: cùng kịch bản ở vi và en phải ra y hệt.
import { describe, it, expect, beforeEach } from 'vitest';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, newGame } from '../../src/state.js';
import { ROOMS } from '../../src/data/rules.js';
import { render, setPos } from '../../src/ui/building.js';
import { openRoom } from '../../src/ui/rooms.js';
import { closeM } from '../../src/ui/modal.js';
import { setLang } from '../../src/i18n/index.js';
import { nextWeek } from '../../src/systems/week.js';
import { hireMgr } from '../../src/systems/managers.js';
import { sign } from '../../src/systems/artists.js';
import { debutIds } from '../../src/systems/debut.js';
import { acceptOffer } from '../../src/systems/offers.js';

noToggle();

// Kịch bản: hành động của golden 110 tuần, cộng mở mọi phòng mỗi 5 tuần (đường render có thể ensure*). Các task sau thêm hành động của khu vực mình.
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
    if (i % 5 === 0) { for (const r of ROOMS) openRoom(r.id); closeM(); render(); }
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
  }, 60000);
});
