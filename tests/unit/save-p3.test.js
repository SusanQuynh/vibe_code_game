// @vitest-environment jsdom
// Phase 3 save format: structured stored text coexists with legacy strings. No version bump, no migration.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { noToggle, seed, SHELL, viT } from './helpers.js';
import { S, newGame, addLog, setState } from '../../src/state.js';
import { Lk, setLang, tx } from '../../src/i18n/index.js';
import { KEY, KEY_FULL, compactOf, load, rehydrate, save } from '../../src/save/storage.js';
import { nextWeek } from '../../src/systems/week.js';
import { renderLog } from './sim.js';
import { setPos } from '../../src/ui/building.js';

noToggle();
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const fixture = () => JSON.parse(fs.readFileSync('tests/fixtures/save-v1.json', 'utf8'));
beforeEach(() => { document.body.innerHTML = SHELL; localStorage.clear(); seed(3); setPos({}); newGame(); });
afterEach(() => setLang('vi'));
const logRows = () => [...document.querySelectorAll('#log > div')].map(d => [...d.childNodes].slice(1).map(n => n.textContent).join(''));

describe('legacy save (v1 fixture)', () => {
  it('loads, shows legacy lines verbatim in both languages, continues with structured entries', () => {
    const f = fixture();
    localStorage.setItem(KEY, JSON.stringify(f));
    expect(load()).toBe(true);
    const legacy = S.log.map(l => l.t).filter(t => typeof t === 'string');
    expect(legacy.length).toBeGreaterThanOrEqual(f.log.length);
    for (const l of f.log) expect(S.log.some(x => x.t === l.t && x.w === l.w)).toBe(true);
    for (const lang of ['vi', 'en']) {
      setLang(lang);
      const rows = (renderLog(S), logRows());
      for (const t of legacy.slice(0, 10)) expect(rows.some(r => r.includes(t)), `${lang}: ${t}`).toBe(true);
    }
    setLang('vi');
    for (let i = 0; i < 3; i++) nextWeek(true, true);
    const fresh = S.log.filter(l => typeof l.t === 'object');
    expect(fresh.length).toBeGreaterThan(0);                       // new lines are Msg
    expect(S.log.some(l => typeof l.t === 'string')).toBe(true);   // legacy lines are kept
  });
  it('the mixed log renders in en: legacy verbatim, new lines in English', () => {
    localStorage.setItem(KEY, JSON.stringify(fixture()));
    load();
    setLang('en');
    addLog(Lk('log.st.tip'));
    const rows = (renderLog(S), logRows());
    expect(rows[0]).toBe(tx(Lk('log.st.tip')));
    expect(VI.test(rows[0])).toBe(false);
    expect(rows.some(r => VI.test(r))).toBe(true);                 // legacy Vietnamese stays as written
  });
});

describe('compact / rehydrate with mixed entries', () => {
  it('keeps both kinds, dedups exact duplicates by JSON', () => {
    const a = { k: 'log.st.tip' }, b = 'dòng cũ';
    const full = { log: [{ t: a, c: '', w: 'N1·T2' }, { t: b, c: '', w: 'N1·T1' }, { t: Lk('batch.n', { i: 2 }), c: '', w: 'N1·T1' }] };
    const compact = { log: [{ t: { ...a }, c: '', w: 'N1·T2' }] };      // trimmed copy: same entry again
    rehydrate(compact, full);
    expect(compact.log).toHaveLength(3);
    expect(compact.log.filter(l => l.t && l.t.k === 'log.st.tip')).toHaveLength(1);
    expect(compact.log.some(l => l.t === b)).toBe(true);
    expect(compact.log.some(l => l.t.k === 'batch.n')).toBe(true);
  });
  it('compactOf trims structured logs by count like strings', () => {
    S.log = Array.from({ length: 80 }, (_, i) => ({ t: i % 2 ? Lk('batch.n', { i }) : 'x' + i, c: '', w: 'N1·T1' }));
    expect(compactOf(S, 1).log).toHaveLength(30);
    expect(compactOf(S, 2).log).toHaveLength(10);
  });
  it('full backup + compact autosave reload keeps the structured lines', () => {
    for (let i = 0; i < 6; i++) nextWeek(true, true);
    const before = JSON.stringify(S.log);
    save({ full: true });
    setState(null); expect(load()).toBe(true);
    expect(JSON.stringify(S.log)).toBe(before);
    expect(localStorage.getItem(KEY_FULL)).toBeTruthy();
  });
});
