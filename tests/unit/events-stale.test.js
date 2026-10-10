// @vitest-environment jsdom
// Sự kiện "mồ côi" (nghệ sĩ liên quan đã rời công ty) bị màn Sự kiện lọc bỏ:
// chuông, Phòng Họp và cảnh báo sang tuần không được đếm chúng.
import { describe, it, expect, beforeEach } from 'vitest';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, newGame } from '../../src/state.js';
import { liveEvents } from '../../src/systems/events.js';
import { renderTop } from '../../src/ui/building.js';
import { curView } from '../../src/ui/modal.js';
import { viewSkipWarn } from '../../src/ui/views.js';
import { nextWeek } from '../../src/systems/week.js';

noToggle();
beforeEach(() => { document.body.innerHTML = SHELL; localStorage.clear(); seed(42); newGame(); });

describe('sự kiện mồ côi', () => {
  it('chuông ẩn và không chặn sang tuần khi chỉ còn sự kiện mồ côi', () => {
    S.events = [{ id: 9001, kind: 'req_rest', a: 424242 }];
    expect(liveEvents()).toEqual([]);
    renderTop();
    expect(document.querySelector('#evn').hidden).toBe(true);
    nextWeek();
    expect(curView).not.toBe(viewSkipWarn);
  });
  it('sự kiện thật vẫn được đếm và chặn sang tuần', () => {
    S.events = [{ id: 9002, kind: 'req_rest', a: S.artists[0].id }, { id: 9003, kind: 'req_rest', a: 424242 }];
    expect(liveEvents()).toHaveLength(1);
    renderTop();
    expect(document.querySelector('#evn').hidden).toBe(false);
    expect(document.querySelector('#evn').textContent).toBe('1');
    nextWeek();
    expect(curView).toBe(viewSkipWarn);
  });
  it('sang tuần (không force) dọn sự kiện mồ côi thay vì giữ mãi', () => {
    S.events = [{ id: 9005, kind: 'req_rest', a: 424242 }];
    const w0 = S.week;
    nextWeek(false, true);
    expect(S.week).not.toBe(w0);
    expect(S.events.find(e => e.id === 9005)).toBeUndefined();
  });
});
