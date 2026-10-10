// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkBaseline, classify, decideUpdate, validateConfig } from '../../scripts/lib/literals-policy.mjs';

const it_ = (at, text, o = {}) => ({ at, text, ctx: 'ui', cmp: false, ...o });
const cfg0 = (o = {}) => ({ allow: {}, allowText: [], ...o });
const ev = { kind: 'event', why: 'sự kiện' };

describe('classify', () => {
  it('allow cấp khai báo không miễn toast, css, cmp', () => {
    const cfg = cfg0({ allow: { 'f#a': ev } });
    const r = classify([it_('f#a', 'Sự kiện'), it_('f#a', 'Không đủ tiền', { ctx: 'toast' }), it_('f#a', 'Gợi ý', { ctx: 'css' }), it_('f#a', 'Tốt', { cmp: true })], cfg);
    expect(r.exempt).toEqual({ event: 1 });
    expect(r.todo).toEqual({ 'f#a': 2 });
    expect(r.cmpBad).toHaveLength(1);
  });
  it('allowText cmp chỉ miễn literal so sánh, bản hiển thị cùng chữ vẫn là todo', () => {
    const cfg = cfg0({ allowText: [{ at: 'f#v', text: 'Giám đốc', kind: 'cmp', why: 'so sánh' }] });
    const r = classify([it_('f#v', 'Giám đốc', { cmp: true }), it_('f#v', 'Giám đốc')], cfg);
    expect(r.exempt).toEqual({ cmp: 1 });
    expect(r.todo).toEqual({ 'f#v': 1 });
  });
  it('allowText state bị khoá theo n', () => {
    const cfg = cfg0({ allowText: [{ at: 'f#v', text: 'Tốt', kind: 'state', n: 1, why: 'lưu S' }] });
    const r = classify([it_('f#v', 'Tốt'), it_('f#v', 'Tốt')], cfg);
    expect(r.exempt).toEqual({ state: 1 });
    expect(r.todo).toEqual({ 'f#v': 1 });
  });
  it('mục cũ không còn khớp → stale; n lớn hơn số lần khớp → báo giảm n', () => {
    const cfg = cfg0({ allow: { 'f#gone': ev }, allowText: [{ at: 'f#x', text: 'Tốt', kind: 'state', n: 2, why: 'w' }, { at: 'f#y', text: 'Đạt', kind: 'cmp', why: 'w' }] });
    const r = classify([it_('f#x', 'Tốt')], cfg);
    expect(r.stale.join('\n')).toMatch(/f#gone/);
    expect(r.stale.join('\n')).toMatch(/n=2 nhưng chỉ còn 1/);
    expect(r.stale.join('\n')).toMatch(/f#y/);
  });
});

describe('validateConfig', () => {
  it('kind lạ, thiếu why, wildcard sai chỗ, state thiếu n, cmp có n', () => {
    const e = validateConfig(cfg0({
      allow: { 'a#x': { kind: 'lạ', why: 'w' }, 'b#y': { kind: 'event' }, 'src/ui/rooms.js#*': { kind: 'name', why: 'w' }, 'src/data/names.js#*': { kind: 'name', why: 'w' } },
      allowText: [{ at: 'f#a', text: 't', kind: 'state', why: 'w' }, { at: 'f#b', text: 't', kind: 'cmp', n: 1, why: 'w' }, { at: 'f#c', text: 't', kind: 'cmp' }],
    })).join('\n');
    expect(e).toMatch(/a#x: kind lạ/);
    expect(e).toMatch(/b#y: thiếu why/);
    expect(e).toMatch(/rooms.js#\*: wildcard/);
    expect(e).not.toMatch(/names.js#\*/);
    expect(e).toMatch(/f#a.*cần n/);
    expect(e).toMatch(/f#b.*không có n/);
    expect(e).toMatch(/f#c.*thiếu why/);
  });
});

describe('ratchet', () => {
  const base = () => cfg0({ allow: { 'f#a': ev }, todo: { 'f#a': 1 }, allowCount: { event: 1 } });
  const items = n => [it_('f#a', 'Một'), ...Array.from({ length: n }, (_, i) => it_('f#b', 'Hai' + i))];
  it('khớp baseline thì sạch; todo tăng/giảm đều báo', () => {
    const c = cfg0({ allow: { 'f#a': ev }, todo: { 'f#b': 1 }, allowCount: { event: 1 } });
    expect(checkBaseline(classify(items(1), c), c)).toEqual([]);
    expect(checkBaseline(classify(items(2), c), c).join()).toMatch(/mới ở f#b: 2 > 1/);
    expect(checkBaseline(classify(items(0), c), c).join()).toMatch(/giảm/);
  });
  it('số literal được miễn tăng thì báo (lách bằng allow)', () => {
    const c = cfg0({ allow: { 'f#a': ev }, todo: {}, allowCount: { event: 1 } });
    const r = classify([it_('f#a', 'Một'), it_('f#a', 'Hai')], c);
    expect(checkBaseline(r, c).join()).toMatch(/miễn \(event\) tăng 1 → 2/);
  });
  it('--update từ chối khi todo tăng hoặc allow tăng (không force)', () => {
    const c = cfg0({ allow: { 'f#a': ev }, todo: {}, allowCount: { event: 1 } });
    expect(decideUpdate(classify(items(1), c), c).msg).toMatch(/todo f#b/);
    expect(decideUpdate(classify([it_('f#a', 'Một'), it_('f#a', 'Hai')], c), c).msg).toMatch(/miễn event/);
  });
  it('--force bị từ chối khi đã có baseline, trừ khi có env riêng', () => {
    const c = cfg0({ allow: { 'f#a': ev }, todo: {}, allowCount: { event: 1 } });
    const r = classify(items(2), c);
    expect(decideUpdate(r, c, { force: true }).msg).toMatch(/I18N_LITERALS_FORCE=1/);
    const d = decideUpdate(r, c, { force: true, envForce: true });
    expect(d.ok).toBe(true);
    expect(d.next.todo).toEqual({ 'f#b': 2 });
  });
  it('--update giảm thì không cần force; chưa có baseline thì ghi được', () => {
    const c = cfg0({ allow: { 'f#a': ev }, todo: { 'f#b': 3 }, allowCount: { event: 1 } });
    expect(decideUpdate(classify(items(1), c), c).ok).toBe(true);
    const c0 = cfg0({ allow: { 'f#a': ev } });
    expect(decideUpdate(classify(items(2), c0), c0).ok).toBe(true);
  });
  it('--update từ chối khi cấu hình sai (kind lạ/thiếu why), kể cả có force', () => {
    const c = cfg0({ allow: { 'f#a': { kind: 'x', why: '' } }, todo: {}, allowCount: {} });
    const d = decideUpdate(classify(items(0), c), c, { force: true, envForce: true });
    expect(d.ok).toBe(false);
    expect(d.msg).toMatch(/kind lạ/);
    expect(d.msg).toMatch(/thiếu why/);
  });
});

// CLI thật trong thư mục tạm
describe('check-literals CLI', () => {
  const script = path.resolve('scripts/check-literals.mjs');
  const mk = (cfg, src = 'export function f(){return`Phòng họp`}\nexport function g(){return`Sảnh`}') => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'lit-'));
    fs.mkdirSync(path.join(d, 'src')); fs.mkdirSync(path.join(d, 'scripts'));
    fs.writeFileSync(path.join(d, 'src/a.js'), src);
    fs.writeFileSync(path.join(d, 'scripts/i18n-literals.json'), JSON.stringify(cfg));
    return d;
  };
  const run = (d, args = [], env = {}) => spawnSync('node', [script, ...args], { cwd: d, encoding: 'utf8', env: { ...process.env, I18N_LITERALS_FORCE: '', ...env } });
  it('todo tăng → exit 1; --update bị từ chối; --force không env bị từ chối; có env thì ghi', () => {
    const d = mk({ allow: {}, allowText: [], todo: { 'src/a.js#f': 1 }, allowCount: {} });
    expect(run(d).status).toBe(1);
    expect(run(d, ['--update']).stderr).toMatch(/Từ chối --update/);
    expect(run(d, ['--update', '--force']).stderr).toMatch(/I18N_LITERALS_FORCE=1/);
    const ok = run(d, ['--update', '--force'], { I18N_LITERALS_FORCE: '1' });
    expect(ok.status).toBe(0);
    expect(JSON.parse(fs.readFileSync(path.join(d, 'scripts/i18n-literals.json'), 'utf8')).todo).toEqual({ 'src/a.js#f': 1, 'src/a.js#g': 1 });
    expect(run(d).status).toBe(0);
  });
  it('thêm allow để lách (allowCount tăng) → exit 1', () => {
    const d = mk({ allow: { 'src/a.js#g': { kind: 'event', why: 'lách' } }, allowText: [], todo: { 'src/a.js#f': 1 }, allowCount: {} });
    const r = run(d);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/miễn \(event\) tăng 0 → 1/);
  });
  it('kind lạ / thiếu why / mục stale → exit 1', () => {
    const d = mk({ allow: { 'src/a.js#g': { kind: 'lạ' }, 'src/a.js#zzz': { kind: 'event', why: 'w' } }, allowText: [], todo: { 'src/a.js#f': 1 }, allowCount: {} });
    const r = run(d);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/kind lạ/);
    expect(r.stderr).toMatch(/thiếu why/);
    expect(r.stderr).toMatch(/zzz: không còn khớp/);
  });
});

describe('sink trong chính sách', () => {
  const S1 = { id: 'rm#1', kind: 'call', fn: 'rm', arg: 1, why: 'lý do vào log' };
  const SP = { id: 'busy.title', kind: 'prop', key: 'title', in: ['f#a'], why: 'S.busy' };
  it('literal sink không vào todo, không tính allowCount; đếm theo id; toast/cmp không bị nuốt', () => {
    const cfg = cfg0({ sinks: [S1, SP] });
    const r = classify([it_('f#a', 'Một', { sink: 'rm#1' }), it_('f#a', 'Hai', { sink: 'busy.title' }), it_('f#b', 'Ba', { sink: 'rm#1' }), it_('f#a', 'Lỗi', { ctx: 'toast', sink: 'rm#1' }), it_('f#a', 'Tốt', { cmp: true, sink: 'rm#1' })], cfg);
    expect(r.sink).toEqual({ 'rm#1': 2, 'busy.title': 1 });
    expect(r.exempt).toEqual({});
    expect(r.todo).toEqual({ 'f#a': 1 });
    expect(r.cmpBad).toHaveLength(1);
  });
  it('allow cấp khai báo được ưu tiên trước sink (allowCount event không đổi)', () => {
    const r = classify([it_('f#a', 'Sự kiện', { sink: 'rm#1' })], cfg0({ allow: { 'f#a': ev }, sinks: [S1] }));
    expect(r.exempt).toEqual({ event: 1 });
    expect(r.sink).toEqual({});
  });
  it('sink không bắt literal nào / khai báo in không khớp / hàm đích không tồn tại → stale', () => {
    const cfg = cfg0({ sinks: [S1, { ...SP, in: ['f#a', 'f#gone'] }] });
    const r = classify([it_('f#a', 'Hai', { sink: 'busy.title' })], cfg, { declared: new Set(['other']) });
    const m = r.stale.join('\n');
    expect(m).toMatch(/sink rm#1: không bắt được literal nào/);
    expect(m).toMatch(/sink rm#1: không có hàm rm khai báo/);
    expect(m).toMatch(/sink busy.title: khai báo f#gone không có literal nào khớp/);
    expect(classify([it_('f#a', 'Một', { sink: 'rm#1' })], cfg0({ sinks: [S1] }), { declared: new Set(['rm']) }).stale).toEqual([]);
    expect(classify([it_('f#a', 'Một', { sink: 'h#0' })], cfg0({ sinks: [{ id: 'h#0', kind: 'call', fn: 'hist.unshift', arg: 0, why: 'w' }] }), { declared: new Set() }).stale).toEqual([]); // method dotted không cần khai báo
  });
  it('validateConfig: kind lạ, thiếu why, thiếu tham số, trùng id, in sai dạng', () => {
    const e = validateConfig(cfg0({ sinks: [{ id: 'a', kind: 'zzz', why: 'w' }, { id: 'b', kind: 'call', why: '' , fn: 'x'}, { id: 'c', kind: 'prop', why: 'w', key: 'k' }, { id: 'c', kind: 'data', why: 'w', in: ['không-hợp-lệ'] }] })).join('\n');
    expect(e).toMatch(/sink a: kind lạ/);
    expect(e).toMatch(/sink b: thiếu why/);
    expect(e).toMatch(/sink b: call cần fn và arg/);
    expect(e).toMatch(/sink c: prop cần in/);
    expect(e).toMatch(/sink c: trùng id/);
    expect(e).toMatch(/phải dạng src\//);
    expect(validateConfig(cfg0({ sinks: [S1, { ...SP, in: ['src/a.js#f'] }] }))).toEqual([]);
  });
  it('bánh cóc sink: tăng/giảm đều báo; chưa có sinkCount thì đòi baseline', () => {
    const res = { todo: {}, exempt: {}, sink: { x: 3 } };
    const base = { todo: {}, allowCount: {} };
    expect(checkBaseline(res, { ...base, sinkCount: { x: 3 } })).toEqual([]);
    expect(checkBaseline(res, { ...base, sinkCount: { x: 2 } }).join()).toMatch(/sink x tăng 2 → 3/);
    expect(checkBaseline(res, { ...base, sinkCount: { x: 4 } }).join()).toMatch(/sink x giảm 4 → 3/);
    expect(checkBaseline(res, base).join()).toMatch(/thiếu sinkCount/);
  });
  it('--update: sink tăng bị từ chối (kể cả --force thiếu env); ghi được khi có env; giảm thì không cần force', () => {
    const res = classify([it_('f#a', 'Một', { sink: 'rm#1' })], cfg0({ sinks: [S1] }));
    const base = cfg0({ sinks: [S1], todo: {}, allowCount: {}, sinkCount: {} });
    expect(decideUpdate(res, base).ok).toBe(false);
    expect(decideUpdate(res, base).msg).toMatch(/sink rm#1/);
    expect(decideUpdate(res, base, { force: true }).ok).toBe(false);
    const d = decideUpdate(res, base, { force: true, envForce: true });
    expect(d.ok).toBe(true); expect(d.next.sinkCount).toEqual({ 'rm#1': 1 });
    expect(decideUpdate(classify([], cfg0({ sinks: [] })), cfg0({ todo: {}, allowCount: {}, sinkCount: { 'rm#1': 1 } })).ok).toBe(true);
  });
});
