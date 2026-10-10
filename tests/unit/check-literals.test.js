// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { scan } from '../../scripts/lib/scan-literals.mjs';

describe('scan-literals', () => {
  it('addLog → ctx log', () => {
    const r = scan('function f(x){addLog(`Ký ${x} thành công`)}', 'f.js');
    expect(r.length).toBe(2);
    expect(r.every(x => x.ctx === 'log')).toBe(true);
  });
  it('modal → ctx ui, at theo khai báo', () => {
    expect(scan('function foo(){modal(`<h2>Phòng</h2>`)}', 'f.js')).toEqual([{ at: 'f.js#foo', text: '<h2>Phòng</h2>', ctx: 'ui', cmp: false }]);
  });
  it('t() và chuỗi không dấu không bị bắt', () => {
    expect(scan("function f(){t('a.b');return 'abc'}", 'f.js')).toEqual([]);
  });
  it('so sánh trong logic → cmp', () => {
    const r = scan("function f(x){if (x.why2 === 'đã có dự án') return 1}", 'f.js');
    expect(r).toHaveLength(1); expect(r[0].cmp).toBe(true);
    expect(scan("function f(x){switch(x){case 'Tốt': return 1}}", 'f.js')[0].cmp).toBe(true);
    expect(scan("function f(a){return a.includes('Giám đốc')}", 'f.js')[0].cmp).toBe(true);
  });
  it('RV.* được mở rộng', () => {
    expect(scan('export const RV={mgr(){return`Phòng`}}', 'f.js')[0].at).toBe('f.js#RV.mgr');
    expect(scan('RV.sales=function(){return`Phòng`}', 'f.js')[0].at).toBe('f.js#RV.sales');
  });
  it('src/data/names.js → ctx name', () => {
    expect(scan("export const N=['Nguyễn']", 'src/data/names.js')[0].ctx).toBe('name');
  });
  it('gộp khoảng trắng trong text', () => {
    expect(scan('function f(){return`Phòng\n   họp`}', 'f.js')[0].text).toBe('Phòng họp');
  });
});
