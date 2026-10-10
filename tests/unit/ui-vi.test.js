// @vitest-environment jsdom
// Snapshot giao diện tiếng Việt cho các bề mặt được i18n ở giai đoạn 1 (khoá hiển thị).
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, newGame, resetGame } from '../../src/state.js';
import { ROOMS } from '../../src/data/rules.js';
import { renderTop, renderDock, renderBuilding, setPos } from '../../src/ui/building.js';
import { openRoom } from '../../src/ui/rooms.js';
import { TUT, tutStart, tutEnd } from '../../src/ui/tutorial.js';
import { fire } from '../../src/systems/artists.js';
import { fireMgr } from '../../src/systems/managers.js';
import { sellBiz } from '../../src/systems/market.js';
import { hsFire } from '../../src/systems/ext3.js';
import { closeM } from '../../src/ui/modal.js';

noToggle();

beforeEach(() => {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seed(42);
  setPos({});
  newGame();
});

describe('snapshot UI tiếng Việt', () => {
  it('renderTop', () => {
    renderTop();
    const o = {};
    for (const id of ['date', 'yearL', 'nextBtn', 'fansP', 'artN', 'roofInfo', 'money']) o[id] = document.getElementById(id).innerHTML;
    expect(o).toMatchSnapshot();
  });
  it('renderDock', () => {
    renderDock();
    expect(document.getElementById('dock').innerHTML).toMatchSnapshot();
  });
  it('renderBuilding: nhãn phòng và nhãn NPC', () => {
    renderBuilding();
    const rooms = [...document.querySelectorAll('.room')].map(r => ({
      aria: r.getAttribute('aria-label'), title: r.getAttribute('title'), rl: r.querySelector('.rl').textContent,
      npc: [...r.querySelectorAll('.chibi.npc .nm')].map(n => n.textContent),
    }));
    expect(rooms).toMatchSnapshot();
  });
  it('tiêu đề sheet của từng phòng', () => {
    const o = {};
    for (const r of ROOMS) {
      openRoom(r.id);
      o[r.id] = { h2: document.querySelector('#sheet h2').outerHTML, x: document.querySelector('#sheet .x').getAttribute('aria-label') };
      closeM();
    }
    expect(o).toMatchSnapshot();
  });
  it('tutorial từng bước', () => {
    const o = [];
    for (let i = 0; i < TUT.length; i++) { tutStart(i); o.push(document.querySelector('#tut .tutc').innerHTML); }
    tutEnd();
    expect(o).toMatchSnapshot();
  });
  it('khung tĩnh index.html', () => {
    const d = new DOMParser().parseFromString(fs.readFileSync('index.html', 'utf8'), 'text/html');
    expect({
      fund: d.querySelector('.cash>small').textContent,
      logTitle: d.querySelector('.lhead h3').textContent,
      btns: [...d.querySelectorAll('.hbtns .rb')].map(b => b.getAttribute('aria-label')),
      dock: d.querySelector('#dock').getAttribute('aria-label'),
    }).toMatchSnapshot();
  });
  it('nút chạm lần nữa', () => {
    const t = fn => { const b = document.createElement('button'); fn(b); return b.textContent; };
    expect({
      reset: t(b => resetGame(b)),
      fireMgr: t(b => fireMgr(-1, b)),
      sellBiz: t(b => sellBiz('x', b)),
      hsFire: t(b => hsFire(b)),
      fire: t(b => fire(-1, b)),
    }).toMatchSnapshot();
  });
});
