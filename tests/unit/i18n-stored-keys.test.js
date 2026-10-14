// Keys written into S are a save format: every Lk('…') / isK(…,'…') key in src/ must be in tests/fixtures/stored-keys.json
// (append-only registry), resolve in vi and en, hold no markup, and `logic` keys keep the Vietnamese value legacy saves use.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { walk } from '../../scripts/lib/js-spans.mjs';
import vi from '../../src/i18n/locales/vi.js';
import en from '../../src/i18n/locales/en.js';

const REG = JSON.parse(fs.readFileSync('tests/fixtures/stored-keys.json', 'utf8'));
const ENUMS = JSON.parse(fs.readFileSync('tests/fixtures/legacy-enums.json', 'utf8'));
const covers = (k, prefixOnly) => REG.some(e => (e.k.endsWith('*') ? k.startsWith(e.k.slice(0, -1)) : !prefixOnly && e.k === k));
const files = [...walk('src')].map(f => f.replace(/\\/g, '/')).filter(f => !f.startsWith('src/i18n/locales/'));
const used = { exact: new Set(), prefix: new Set() };
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\bLk\(\s*'([\w.]+)'/g)) used.exact.add(m[1]);
  for (const m of s.matchAll(/\bisK\([^,()]+,\s*'([\w.]+)'/g)) used.exact.add(m[1]);
  for (const m of s.matchAll(/\bLk\(\s*`([\w.]+)\$\{/g)) used.prefix.add(m[1]);
}
const proxy = () => new Proxy({}, { get: () => 'x' });
const text = v => (typeof v === 'function' ? v(proxy()) : typeof v === 'string' ? v : '');

describe('stored key registry', () => {
  it('every stored key used in src/ is registered', () => {
    for (const k of used.exact) expect(covers(k), `unregistered key ${k}`).toBe(true);
    for (const p of used.prefix) expect(REG.some(e => (e.k.endsWith('*') ? p.startsWith(e.k.slice(0, -1)) || e.k.slice(0, -1).startsWith(p) : e.k.startsWith(p))), `unregistered prefix ${p}`).toBe(true);
  });
  for (const [code, L] of [['vi', vi], ['en', en]]) {
    it(`every registry entry resolves in ${code}`, () => {
      for (const e of REG) {
        if (e.k.endsWith('*')) expect(Object.keys(L.dict).some(k => k.startsWith(e.k.slice(0, -1))), `${code}: no key for ${e.k}`).toBe(true);
        else expect(e.k in L.dict, `${code}: missing ${e.k}`).toBe(true);
      }
    });
    it(`stored values hold no markup in ${code}`, () => {
      for (const e of REG) {
        const ks = e.k.endsWith('*') ? Object.keys(L.dict).filter(k => k.startsWith(e.k.slice(0, -1))) : [e.k];
        for (const k of ks) expect(text(L.dict[k]).includes('<'), `${code}: ${k} contains <`).toBe(false);
      }
    });
  }
  it('logic keys match legacy-enums.json', () => {
    const logic = REG.filter(e => e.logic).map(e => e.k).sort();
    expect(Object.keys(ENUMS).sort()).toEqual(logic);
    for (const k of logic) expect(vi.dict[k], k).toBe(ENUMS[k]);
  });
  it('every key of a stored-text locale part (st-*) is registered', () => {
    for (const [name, d] of vi.parts) if (name.startsWith('st-')) for (const k of Object.keys(d)) expect(REG.some(e => e.k === k), `${name}: ${k} is not in stored-keys.json`).toBe(true);
  });
  it('registry has no duplicates', () => { expect(new Set(REG.map(e => e.k)).size).toBe(REG.length); });
});
