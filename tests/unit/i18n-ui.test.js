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
import { saveImportText, viewCode } from '../../src/ui/saveView.js';
import { applyStatic } from '../../src/ui/lang.js';
import { saveFileName } from '../../src/save/transfer.js';
import { planWhy } from '../../src/systems/week.js';
import { lbl } from '../../src/i18n/index.js';
import { view } from '../../src/ui/modal.js';
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
