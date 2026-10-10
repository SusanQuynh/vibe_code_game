// @vitest-environment jsdom
// Snapshot ruột phòng/view tiếng Việt (giai đoạn 2). KHÔNG cập nhật (-u) khi chuyển chuỗi sang từ điển: vi phải giữ nguyên từng byte.
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import { noToggle, seed, SHELL } from './helpers.js';
import { setState } from '../../src/state.js';
import { setPos } from '../../src/ui/building.js';
import { setLang } from '../../src/i18n/index.js';
import { SURFACES } from './surfaces.js';

noToggle();
const FX = Object.fromEntries(['new', 'rich'].map(k => [k, JSON.parse(fs.readFileSync(`tests/fixtures/ui-${k}.json`, 'utf8'))]));

beforeEach(() => {
  document.body.innerHTML = SHELL;
  localStorage.clear();
  setLang('vi');
  seed(42);
  setPos({});
});

describe('snapshot ruột phòng/view [vi]', () => {
  it('id bề mặt không trùng', () => { expect(new Set(SURFACES.map(s => s.id)).size).toBe(SURFACES.length); });
  it.each(SURFACES.map(s => [s.id, s]))('%s', (_id, s) => {
    setState(structuredClone(FX[s.fx.split('.')[0]]));
    const r = s.open();
    const el = document.querySelector(s.sel);
    expect(r === 'n/a' ? 'n/a' : el ? el.innerHTML : 'n/a (không có phần tử)').toMatchSnapshot();
  });
});
