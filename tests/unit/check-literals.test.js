// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { declaredFns, scan, scanCss } from '../../scripts/lib/scan-literals.mjs';

describe('scan-literals', () => {
  it('tham số của hàm lồng (vd .find(r=>…)) không biến literal UI cùng tên thành log', () => {
    const src = "function f(b){const m=S.ms.find(r=>r.id===b);addLog(`QL ${m.name} nhận việc`);{const r=`<b>Hạng mới</b>`;el.innerHTML=r}}";
    const ui = scan(src, 'f.js').find(x => x.text === '<b>Hạng mới</b>');
    expect(ui.ctx).toBe('ui');
  });
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

// ---- sink cấu hình: literal đi vào S/log qua tham số hàm, thuộc tính object, bảng dữ liệu ----
const sk = (s, code, file = 'f.js') => Object.fromEntries(scan(code, file, s).map(v => [v.text, v.sink ?? v.ctx]));
describe('scan-literals: sink', () => {
  it('call: literal ở đúng vị trí đối số (trực tiếp, template, ternary, biến cục bộ, for-of destructuring); literal UI cạnh đó vẫn ui', () => {
    const S = [{ id: 'rm#1', kind: 'call', fn: 'rm', arg: 1 }];
    expect(sk(S, "function f(a){rm(a,'đã nghỉ');modal('Cửa sổ')}")).toEqual({ 'đã nghỉ': 'rm#1', 'Cửa sổ': 'ui' });
    expect(sk(S, "function f(a,x){rm(a,x?'Một':`Hai là ${a}`)}")).toEqual({ 'Một': 'rm#1', 'Hai là': 'rm#1' });
    expect(sk(S, "function f(a){let w='Lý do';if(a)w='Lý do khác';rm(a,w);const u='Chữ UI'}")).toEqual({ 'Lý do': 'rm#1', 'Lý do khác': 'rm#1', 'Chữ UI': 'ui' });
    expect(sk(S, "function f(a){for(const [g,lab] of [['M','Nam'],['F','Nữ']])rm(a,`${lab} xin chào`)}")).toEqual({ 'Nữ': 'rm#1', 'xin chào': 'rm#1' });
    // âm: sai vị trí đối số, hàm khác, biến không chảy vào sink
    expect(sk(S, "function f(a){rm('Đối số đầu',a);other(a,'Hàm khác');const q='Biến lạ';show(q)}")).toEqual({ 'Đối số đầu': 'ui', 'Hàm khác': 'ui', 'Biến lạ': 'ui' });
  });
  it('call: method dotted (hist.unshift) khớp theo đuôi, không khớp tên chỉ trùng một phần; in giới hạn khai báo; toast không bao giờ là sink', () => {
    const S = [{ id: 'hist#0', kind: 'call', fn: 'hist.unshift', arg: 0 }];
    expect(sk(S, "function f(a){a.hist.unshift(`N1: Đã xong`);a.xhist.unshift('Không khớp');a.hist.push('Sai phương thức')}")).toEqual({ 'N1: Đã xong': 'hist#0', 'Không khớp': 'ui', 'Sai phương thức': 'ui' });
    const S2 = [{ id: 'rm#0', kind: 'call', fn: 'rm', arg: 0, in: ['f.js#g'] }];
    expect(sk(S2, "function f(){rm('Ở f')}function g(){rm('Ở g')}")).toEqual({ 'Ở f': 'ui', 'Ở g': 'rm#0' });
    expect(sk([{ id: 'rm#0', kind: 'call', fn: 'rm', arg: 0 }], "function f(){rm(toast('Đang bận'))}")).toEqual({ 'Đang bận': 'toast' });
  });
  it('prop: khoá object literal, phép gán thuộc tính, biến tên key; chỉ trong khai báo in; khoá khác vẫn ui', () => {
    const S = [{ id: 'busy.title', kind: 'prop', key: 'title', in: ['f.js#f'] }];
    expect(sk(S, "function f(a){a.busy={kind:'x',title:'Quảng bá «'+a.t+' ✓',note:'Ghi chú UI'}}")).toEqual({ 'Quảng bá «': 'busy.title', 'Ghi chú UI': 'ui' });
    expect(sk(S, "function f(o){o.title='Gán thẳng';o.other='Gán khác'}")).toEqual({ 'Gán thẳng': 'busy.title', 'Gán khác': 'ui' });
    expect(sk([{ id: 'cm', kind: 'prop', key: 'cm', in: ['f.js#f'] }], "function f(g){const cm={S:'Tốt',A:'Khá'}[g];const other='Giao diện'}")).toEqual({ 'Tốt': 'cm', 'Khá': 'cm', 'Giao diện': 'ui' });
    // âm: khoá title ở khai báo không nằm trong in
    expect(sk(S, "function g(a){a.busy={title:'Ở g'}}")).toEqual({ 'Ở g': 'ui' });
    // lồng sâu: khoá title nằm trong giá trị khác không bị nhầm với literal anh em
    expect(sk(S, "function f(){return {title:'Có', label:'Không'}}")).toEqual({ 'Có': 'busy.title', 'Không': 'ui' });
  });
  it('data: cả khai báo, hoặc chỉ khoá key; khai báo khác vẫn ui', () => {
    expect(sk([{ id: 'tbl', kind: 'data', in: ['f.js#T'] }], "export const T={a:{n:'Nhảy',d:'Mô tả'}};export const U={n:'Khác'}")).toEqual({ 'Nhảy': 'tbl', 'Mô tả': 'tbl', 'Khác': 'ui' });
    expect(sk([{ id: 'tbl.n', kind: 'data', key: 'n', in: ['f.js#T'] }], "export const T={a:{n:'Nhảy',d:'Mô tả UI'}}")).toEqual({ 'Nhảy': 'tbl.n', 'Mô tả UI': 'ui' });
  });
  it('ưu tiên: literal so sánh không bị sink bắt, log vẫn là log; src/data/names.js là name', () => {
    const r = scan("function f(x){rm(x,'Tốt');if(x==='Tốt')addLog('Đã xong')}", 'f.js', [{ id: 'rm#1', kind: 'call', fn: 'rm', arg: 1 }]);
    expect(r.map(v => [v.text, v.ctx, v.cmp, v.sink])).toEqual([['Tốt', 'ui', false, 'rm#1'], ['Tốt', 'ui', true, undefined], ['Đã xong', 'log', false, undefined]]);
  });
  it('declaredFns thấy function, const arrow, hàm cục bộ', () => {
    expect([...declaredFns('export function a(){const give=(x)=>x;function loc(){}}const b=function(){};const c=3')].sort()).toEqual(['a', 'b', 'give', 'loc']);
  });
});
