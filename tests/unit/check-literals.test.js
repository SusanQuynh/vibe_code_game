// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { scan, scanCss } from '../../scripts/lib/scan-literals.mjs';

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

  it('toast(): kể cả lồng trong ternary/template → ctx toast', () => {
    const r = scan("function f(x){toast(x?'Không đủ tiền':`Ổn ${x}`);return x||toast('Đang bận')}", 'f.js');
    expect(r.map(v => v.ctx)).toEqual(['toast', 'toast', 'toast']);
  });
  it('biến cục bộ chảy vào addLog/pushEv → log; biến khác vẫn ui', () => {
    const r = scan("function f(x){let msg='',h='';if(x)msg=`🏆 Giành cúp`;else msg=`Biểu diễn ${x}`;h+='Khuôn';addLog(msg);pushEv({how:'bạn cũ'})}", 'f.js');
    expect(Object.fromEntries(r.map(v => [v.text, v.ctx]))).toEqual({ '🏆 Giành cúp': 'log', 'Biểu diễn': 'log', 'Khuôn': 'ui', 'bạn cũ': 'log' });
    expect(scan("function f(){const a=`Một`;const b=a;addLog(b)}", 'f.js')[0].ctx).toBe('log');
  });
  it('cmp mở rộng: mảng .includes, ternary/template trần, startsWith/indexOf/has, khoá object tra [x]', () => {
    const c = code => scan(code, 'f.js').map(v => v.cmp);
    expect(c("function f(x){return ['Tốt','Đạt'].includes(x)}")).toEqual([true, true]);
    expect(c("function f(x){return x===(x.a?'Tốt':'Đạt')}")).toEqual([true, true]);
    expect(c("function f(x){return x===`Tốt`}")).toEqual([true]);
    expect(c("function f(x){return x.startsWith('Quản')||x.endsWith('lý')||x.indexOf('Nghệ')}")).toEqual([true, true, true]);
    expect(c("function f(x){return new Set(['Tốt']).has(x)}")).toEqual([true]);
    expect(c("const OK=new Set(['Tốt']);function f(x){return OK.has(x)}")).toEqual([true]);
    expect(c("const OK=['Tốt'];function f(x){return OK[0]}")).toEqual([false]);
    expect(c("function f(x){return ({'Tốt':1,b:'Đạt'})[x]}")).toEqual([true, false]);
    expect(c("const M={'Tốt':1};function f(x){return M[x]}")).toEqual([true]);
    expect(c("function f(x){return x?'Tốt':'Đạt'}")).toEqual([false, false]);
    expect(c("function f(x){return `Tốt ${x}`===x}")).toEqual([false]);
  });
  it('regex literal có dấu → cmp (quét regex.source)', () => {
    const r = scan('function f(x){return /Giám đốc/i.test(x)}', 'f.js');
    expect(r).toEqual([{ at: 'f.js#f', text: '/Giám đốc/', ctx: 'ui', cmp: true }]);
  });
  it('tiếng Việt không dấu: TTS, QL, "N tr", nhãn tuần N${y}/T${w}; không bắt chuỗi kỹ thuật', () => {
    const t = code => scan(code, 'f.js').map(v => v.text);
    expect(t("function f(){return 'Cho ra solo (80 tr)'+'TTS '+'QL'}")).toEqual(['Cho ra solo (80 tr)', 'TTS', 'QL']);
    expect(t('function f(y,w){return`N${y}·T${w}`}')).toEqual(['N', '·T']);
    expect(t('function f(x){return`${x} tr`}')).toEqual(['tr']);
    expect(scan("function f(){return 'Fee 600 tr'}", 'f.js')[0].plain).toBe(true);
    expect(t("function f(y){return `<tr><td class=\"trk\">${y}</td></tr>`+'Table'+'strong'+'T'+'Nam'+'tr'}")).toEqual([]);
  });
  it('css: content có chữ Việt → ctx css, at = file#selector', () => {
    const r = scanCss('.a{color:red}\n.tile.rec::after{content:"Gợi ý";top:0}\n.b::after{content:\' ▸\'}', 's.css');
    expect(r).toEqual([{ at: 's.css#.tile.rec::after', text: 'Gợi ý', ctx: 'css', cmp: false }]);
  });
});
