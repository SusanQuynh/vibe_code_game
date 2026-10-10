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
