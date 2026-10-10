// @vitest-environment jsdom
// Hàm hiển thị bản T (UI) phải bằng hàm gốc (log/S) ở vi; ở en không rò chữ Việt. Mỗi task giai đoạn 2 thêm describe của mình.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { setLang, t } from '../../src/i18n/index.js';
import { targetName, targetNameT } from '../../src/systems/managers.js';
import { wkLabel, wkLabelT } from '../../src/systems/secretary.js';
import { debutRec, debutRecT } from '../../src/systems/debut.js';
import { sv } from '../../src/i18n/index.js';
import { saveImportFile, saveImportText, viewCode } from '../../src/ui/saveView.js';
import { applyStatic } from '../../src/ui/lang.js';
import { saveFileName } from '../../src/save/transfer.js';
import { planWhy } from '../../src/systems/week.js';
import { lbl } from '../../src/i18n/index.js';
import { view } from '../../src/ui/modal.js';
import { COMP, batchNameT, compNameT } from '../../src/systems/batches.js';
import { MSK } from '../../src/data/rules.js';
import { prHTML, prPlans } from '../../src/systems/review.js';
import viL from '../../src/i18n/locales/vi.js';
import enL from '../../src/i18n/locales/en.js';

noToggle();
const rich = () => structuredClone(JSON.parse(fs.readFileSync('tests/fixtures/ui-rich.json', 'utf8')));
const VI = /[À-ỹĐđ]/;
beforeEach(() => { document.body.innerHTML = SHELL; localStorage.clear(); setLang('vi'); seed(42); });
afterEach(() => setLang('vi'));

describe('task 5: targetNameT, wkLabelT', () => {
  const asg = [null, { t: 't' }, { t: 's' }, { t: 'd' }, { t: 'l', ids: [] }, { t: 'a', id: 999 }, { t: 'g', id: 999 }, { t: 'b', id: 999 }];
  it('vi: targetNameT === targetName cho mọi kiểu phân công', () => {
    setState(rich());
    const ids = S.artists.map(a => a.id);
    const more = [{ t: 'l', ids: ids.slice(0, 1) }, { t: 'l', ids: ids.slice(0, 4) }, ...S.groups.map(g => ({ t: 'g', id: g.id })), ...(S.batches || []).map(b => ({ t: 'b', id: b.id })), ...ids.map(id => ({ t: 'a', id }))];
    const m = S.managers[0];
    for (const as of [...asg, ...more]) { m.as = as; expect(targetNameT(m), JSON.stringify(as)).toBe(targetName(m)); }
  });
  it('en: targetNameT không rò chữ Việt (trừ tên trong S)', () => {
    setState(rich());
    const m = S.managers[0]; setLang('en');
    for (const as of asg) { m.as = as; expect(targetNameT(m)).not.toMatch(VI); }
    m.as = { t: 'l', ids: S.artists.slice(0, 3).map(a => a.id) };
    expect(targetNameT(m)).toMatch(/^3 artists: /);
  });
  it('wkLabelT: vi bằng wkLabel, en W5 Y2', () => {
    setState(rich());
    for (const w of [1, 5, 52, 53, 57, 104, 105, 130, S.year * 52]) expect(wkLabelT(w)).toBe(wkLabel(w));
    S.year = 1;
    expect(wkLabelT(5)).toBe('T5'); expect(wkLabelT(57)).toBe('T5 N2');
    setLang('en');
    expect(wkLabelT(5)).toBe('W5'); expect(wkLabelT(57)).toBe('W5 Y2');
  });
  it('trend.cb và org.team: số ít/số nhiều ở en', () => {
    setLang('en');
    expect([1, 2].map(n => t('trend.cb', { n }))).toEqual(['1 rival comeback', '2 rival comebacks']);
    expect(t('org.team', { n: 1, k: 1 })).toBe('1 person · 1 sub-manager');
    expect(t('org.ceoSub', { m: 2, a: 1 })).toBe('2 managers · 1 artist reporting directly');
  });
});

describe('task 6: debutRecT, sv', () => {
  const fixtures = () => ['new', 'rich'].map(k => JSON.parse(fs.readFileSync(`tests/fixtures/ui-${k}.json`, 'utf8')));
  it('vi: debutRecT bằng debutRec (cả why và short) với mọi nghệ sĩ, cả khi ép nhánh wait/actor/solo/group', () => {
    let n = 0;
    for (const fx of fixtures()) {
      setState(fx);
      for (const a of S.artists) for (const mut of [() => {}, () => { for (const k in a.st) a.st[k] = 5; }, () => { a.st.acting = 95; a.st.vocal = 20; a.st.dance = 20; a.st.rap = 20; }, () => { for (const k in a.st) a.st[k] = 90; }]) {
        mut(); const o = debutRec(a), u = debutRecT(a);
        expect(u.why).toBe(o.why); expect(u.short).toBe(o.short); expect(u.t).toBe(o.t); expect(u.f).toBe(o.f); n++;
      }
    }
    expect(n).toBeGreaterThan(20);
  });
  it('en: debutRecT không rò chữ Việt (tên người là dữ liệu)', () => {
    setState(fixtures()[1]); setLang('en');
    const names = new Set(S.artists.map(a => a.name));
    for (const a of S.artists) { const r = debutRecT(a); let w = r.why + ' ' + r.short; for (const nm of names) w = w.split(nm).join(''); expect(w, a.name).not.toMatch(VI); }
  });
  it('sv: giá trị biết trước được dịch, lạ thì giữ nguyên văn', () => {
    expect(sv('Xuất sắc')).toBe('Xuất sắc'); expect(sv('Điều lạ')).toBe('Điều lạ');
    setLang('en'); expect(sv('Xuất sắc')).toBe('Excellent'); expect(sv('Không đạt')).toBe('Fail'); expect(sv('Điều lạ')).toBe('Điều lạ');
  });
});

describe('mọi key kiểu hàm (số nhiều)', () => {
  const P = n => new Proxy({}, { get: (_, k) => (k === 'then' ? undefined : typeof k === 'string' && /^(b|names|hm)$/.test(k) ? 'X' : n) });
  it.each([1, 2])('vi/en: gọi với mọi tham số = %i cho chuỗi sạch, en không còn chữ Việt', n => {
    for (const [code, L] of [['vi', viL], ['en', enL]]) for (const [k, v] of Object.entries(L.dict)) {
      if (typeof v !== 'function') continue;
      const r = v(P(n));
      expect(typeof r, `${code}:${k}`).toBe('string');
      expect(r, `${code}:${k}`).not.toMatch(/undefined|NaN|\[object/);
      if (code === 'en') expect(r, k).not.toMatch(VI);
    }
  });
  it('en: 1 số ít, 2 số nhiều ở vài key tiêu biểu', () => {
    setLang('en');
    expect(t('report.done', { n: 1 })).toBe('<b>1</b> project done'); expect(t('report.done', { n: 2 })).toBe('<b>2</b> projects done');
    expect(t('evframe.skipTitle', { n: 1 })).toBe('1 unresolved event'); expect(t('evframe.skipTitle', { n: 3 })).toBe('3 unresolved events');
    expect(t('artist.hs.rec', { n: 1 })).toBe('Suggests 1 rest day/week.');
  });
  it('en (soát giai đoạn 2): số ít/số nhiều của kinh doanh, nhân sự, gia hạn, thư ký', () => {
    setLang('en');
    expect(t('hr.ctLeft', { c: '', l: 1, s: '5M' })).toBe('<b class="">1</b> week left · 5M/wk'); expect(t('hr.ctLeft', { c: 'bad', l: 2, s: '5M' })).toContain('2</b> weeks left');
    expect(t('renew.opt.re', { y: 1, m: '9M' })).toBe('Renew for 1 year (fee 9M)'); expect(t('renew.opt.re', { y: 2, m: '9M' })).toBe('Renew for 2 years (fee 9M)');
    expect(t('sales.dig', { n: 1 })).toContain('1 song earning'); expect(t('sales.dig', { n: 2 })).toContain('2 songs earning');
    expect(t('renew.ev.fails', { n: 1 })).toBe(' (failed 1 time in a row)'); expect(t('renew.ev.fails', { n: 3 })).toBe(' (failed 3 times in a row)');
    expect(t('sec.readyN', { n: 1 })).toBe('<b>1</b> group/solo should make a comeback now.'); expect(t('sec.readyN', { n: 2 })).toBe('<b>2</b> groups/solos should make a comeback now.');
    expect(t('props.sumSolved', { n: 1 })).toBe('⚖️ 1 conflict resolved'); expect(t('props.sumSolved', { n: 2 })).toBe('⚖️ 2 conflicts resolved');
    expect(t('mgr.kidN', { n: 1 })).toBe('coaches 1 manager'); expect(t('mgr.kidN', { n: 2 })).toBe('coaches 2 managers');
    expect(t('meet.secFan', { n: 1 })).toBe(' 💬 1 fan-interaction suggestion.');
    expect(t('studio.hidden', { n: 1 })).toBe('Hiding 1 busy act.'); expect(t('studio.hidden', { n: 4 })).toBe('Hiding 4 busy acts.');
    setLang('vi');
    expect(t('sec.readyN', { n: 2 })).toBe('<b>2</b> nhóm/solo nên comeback ngay.'); expect(t('mgr.kidN', { n: 2 })).toBe('kèm 2 QL');
  });
});

describe('task 8: lịch tập, lưu/chuyển game', () => {
  it('save.err.*: đủ 5 mã ở cả hai ngôn ngữ, en không còn chữ Việt', () => {
    for (const c of ['notSave', 'badCode', 'truncated', 'badJson', 'corrupt']) {
      expect(`save.err.${c}` in viL.dict && `save.err.${c}` in enL.dict, c).toBe(true);
      expect(enL.dict[`save.err.${c}`]).not.toMatch(VI);
    }
  });
  it('nhập mã hỏng ở en: màn hiện lỗi tiếng Anh, đổi lại vi thì hiện tiếng Việt (dịch lúc render)', async () => {
    setState(rich()); setLang('en');
    document.querySelector('#sheet') || (document.body.innerHTML = SHELL);
    view(viewCode);
    document.querySelector('#codeIn').value = 'xyz';
    await saveImportText();
    expect(document.querySelector('#sheet .panel').textContent).toContain('❌ Invalid code');
    setLang('vi'); view(viewCode);
    expect(document.querySelector('#sheet .panel').textContent).toContain('❌ Mã không hợp lệ');
  });
  it('lỗi ngoài (DOMException có code số) hiện message, không hiện key save.err.N', async () => {
    setState(rich()); view(viewCode);
    await saveImportFile({ files: [{ text: async () => { throw new DOMException('gone', 'NotFoundError'); } }] });
    const txt = document.querySelector('#sheet .panel').textContent;
    expect(txt).not.toMatch(/save\.err\./);
    expect(txt).toContain('❌ gone');
  });
  it('xem trước save lạ: year/week không được chèn HTML', async () => {
    setState(rich()); view(viewCode);
    document.querySelector('#codeIn').value = JSON.stringify({ artists: [], year: '<img id=pwn src=x>', week: '<b id=pwn2>', money: '<i>' });
    await saveImportText();
    expect(document.querySelector('#pwn')).toBeNull();
    expect(document.querySelector('#pwn2')).toBeNull();
  });
  it('sv(): giá trị không có trong từ điển được escape; key prototype trả nguyên văn', () => {
    expect(sv('<img src=x>')).toBe('&lt;img src=x&gt;');
    expect(sv('constructor')).toBe('constructor');
    expect(sv('Xuất sắc')).toBe('Xuất sắc');
  });
  it('mgr.tgt.list: số ít/số nhiều ở en', () => {
    setLang('en');
    expect(t('mgr.tgt.list', { n: 1, names: 'A' })).toBe('1 artist: A');
    expect(t('mgr.tgt.list', { n: 2, names: 'A, B' })).toBe('2 artists: A, B');
    setLang('vi');
    expect(t('mgr.tgt.list', { n: 2, names: 'A, B' })).toBe('2 nghệ sĩ: A, B');
  });
  it('tên file lưu và nhãn CSS "Gợi ý" theo ngôn ngữ', () => {
    setState(rich());
    expect(saveFileName({ year: 2, week: 7 })).toBe('starlight-N2-T7.json');
    applyStatic(); expect(document.documentElement.style.getPropertyValue('--t-rec')).toBe('"Gợi ý"');
    setLang('en'); expect(saveFileName({ year: 2, week: 7 })).toBe('starlight-Y2-W7.json');
    applyStatic(); expect(document.documentElement.style.getPropertyValue('--t-rec')).toBe('"Suggested"');
  });
  it('planWhy: vi giữ chữ cũ, en không rò', () => {
    setState(rich());
    const a = S.artists.find(x => x.status === 'trainee') || S.artists[0];
    for (const mut of [() => { a.energy = 10; }, () => { a.energy = 90; a.mood = 5; }, () => { a.mood = 90; a.wantAct = 5; }, () => { a.wantAct = 0; }]) {
      mut(); setLang('vi'); const v = planWhy(a); setLang('en'); const e = planWhy(a);
      expect(v).toMatch(VI); expect(e).not.toMatch(VI);
    }
    setLang('vi'); a.energy = 10; expect(planWhy(a)).toBe('năng lượng đang thấp nên cần nghỉ trước');
  });
});

describe('task 15: tên lứa và tên cuộc thi hiển thị', () => {
  it('batchNameT: vi bằng b.n, en "Batch N", tên lạ được escape', () => {
    for (const n of [1, 2, 12]) { const b = { n: 'Lứa ' + n }; setLang('vi'); expect(batchNameT(b)).toBe(b.n); setLang('en'); expect(batchNameT(b)).toBe('Batch ' + n); }
    expect(batchNameT({ n: '<i>x' })).toBe('&lt;i&gt;x');
  });
  it('compNameT: vi bằng c.n với mọi cuộc thi, en không rò; tên lạ được escape', () => {
    for (const c of COMP) { setLang('vi'); expect(compNameT(c)).toBe(c.n); setLang('en'); expect(compNameT(c)).not.toMatch(VI); }
    expect(compNameT({ n: '<b>x' })).toBe('&lt;b&gt;x');
  });
  it('số ít/số nhiều ở en: dq.banner, batch.nTts, comp.pickN, comp.toast.need', () => {
    setLang('en');
    expect(t('dq.banner', { n: 1, l: 'A' })).toBe('🎊 <b>1 trainee eligible to debut this week:</b> A');
    expect(t('dq.banner', { n: 2, l: 'A, B' })).toContain('2 trainees eligible');
    expect([1, 2].map(n => t('batch.nTts', { n }))).toEqual(['1 trainee', '2 trainees']);
    expect([1, '2–5'].map(n => t('comp.pickN', { n }))).toEqual(['Select 1 trainee', 'Select 2–5 trainees']);
    expect([1, '2–5'].map(n => t('comp.toast.need', { n }))).toEqual(['Need 1 trainee', 'Need 2–5 trainees']);
  });
});

describe('task 16: Văn phòng Quản lý', () => {
  it('targetNameT: tên lứa ở en là "Batch N", không rò chữ Việt', () => {
    setState(rich()); setLang('en');
    const m = S.managers[0]; m.as = { t: 'b', id: S.batches[0].id };
    expect(targetNameT(m)).toBe('trainees of Batch 4');
  });
  it('en: mẹo ở màn xếp lịch (plan.tip) gọi đúng tên tuỳ chọn của quản lý (mgr.psLbl)', () => {
    setLang('en');
    expect(t('plan.tip')).toContain(t('mgr.psLbl').replace(/:$/, ''));
    setLang('vi');
  });
  it('mgr.help/picked/lvSub/freeTts/bossTitle: số nhiều và placeholder lặp ở en', () => {
    setLang('en');
    expect(t('mgr.picked', { a: 2, m: 4 })).toBe('Selected <b>2/4</b>. Each manager can only handle up to 4 solo artists/actors; to cover more, let a senior manager coach other managers.');
    expect([1, 2].map(n => t('mgr.lvSub', { m: n, a: n }))).toEqual(['1 manager · 1 artist in charge', '2 managers · 2 artists in charge']);
    expect([1, 2].map(n => t('mgr.freeTts', { n }))).toEqual(['🌱 <b>1 trainee</b> — assign a manager by batch', '🌱 <b>2 trainees</b> — assign a manager by batch']);
    expect([1, 2].map(n => t('mgr.bossTitle', { n }))).toEqual(['👔 Managers of managers (1 team leader)', '👔 Managers of managers (2 team leaders)']);
    expect(t('mgr.help', { m: 4 })).toContain('up to 4 solo artists/actors');
    setLang('vi');
    expect(t('mgr.help', { m: 4 })).toContain('danh sách tối đa 4 nghệ sĩ');
  });
});

describe('task 17: trợ lý cá nhân, chuyên gia sức khỏe', () => {
  const WHY = { care: 'muốn có người lắng nghe, giữ tinh thần ổn định', nego: 'muốn được hỗ trợ đàm phán thù lao tốt hơn', pr: 'lo truyền thông, muốn có người giữ gìn hình ảnh', plan: 'lịch trình dày, cần người sắp xếp thời gian' };
  it('pa.why.<khoá MSK>: đủ key ở mọi ngôn ngữ, vi giữ nguyên chữ cũ, en không rò', () => {
    expect(Object.keys(WHY).sort()).toEqual(Object.keys(MSK).sort());
    for (const k of Object.keys(MSK)) {
      expect(`pa.why.${k}` in viL.dict && `pa.why.${k}` in enL.dict, k).toBe(true);
      setLang('vi'); expect(lbl('pa.why', k)).toBe(WHY[k]);
      setLang('en'); expect(lbl('pa.why', k)).not.toMatch(VI);
    }
    setLang('vi');
  });
  it('hs.sug số ít/số nhiều ở en', () => {
    setLang('en');
    expect([1, 3].map(n => t('hs.sug', { n }))).toEqual(['suggests 1 rest day', 'suggests 3 rest days']);
    setLang('vi');
  });
});

describe('task 18: Phòng Truyền thông', () => {
  it('prPlans: ở vi h === t (chữ lưu vào S.prHist); ở en h vẫn là chữ vi còn t/why đã dịch', () => {
    setState(rich()); S.prUsed = {};
    const vi = prPlans(); expect(vi.length).toBeGreaterThan(3);
    for (const p of vi) expect(p.h, p.t).toBe(p.t);
    setLang('en'); const en = prPlans();
    expect(en.map(p => p.h)).toEqual(vi.map(p => p.h));
    for (const p of en) { expect(p.t.replace(/Gia Hân|Duy Khánh|An Nhiên|Khánh Vy|Nova Star/g, '')).not.toMatch(VI); expect(p.why.replace(/Gia Hân|Duy Khánh|An Nhiên|Khánh Vy|Nova Star/g, '')).not.toMatch(VI); }
    const html = prHTML(en);
    expect(html).toContain(`data-t="${en.find(p => VI.test(p.h)).h}"`); // nút giữ data-t chữ vi cho prGo
    expect(html).toContain('>Approve</button>');
  });
});
