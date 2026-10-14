// Every sink that writes text into S (log, hist, lessons, busy title, prHist, GM problems, events, reasons…) follows
// the phase 3 rules: it stores keys (Lk), never a rendered Vietnamese string.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { spans, walk, skipBal, skipStr, skipTpl, skipExpr, SINK_STARTS } from '../../scripts/lib/js-spans.mjs';
import { P3_DONE } from './p3.js';

const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const files = [...walk('src')].map(f => f.replace(/\\/g, '/')).filter(f => !f.startsWith('src/i18n/locales/')).sort();
const spansOf = f => spans(fs.readFileSync(f, 'utf8'), SINK_STARTS).map(sp => sp.text);

// First argument of an addLog(/recLog( span, and the top-level `?`/`:` split of a ternary.
const firstArg = s => { const a = s.indexOf('(') + 1; return s.slice(a, skipExpr(s, a)).trim(); };
function ternary(e) {
  let q = -1;
  for (let i = 0; i < e.length; i++) {
    const c = e[i];
    if (c === "'" || c === '"') i = skipStr(e, i) - 1;
    else if (c === '`') i = skipTpl(e, i) - 1;
    else if ('([{'.includes(c)) i = skipBal(e, i) - 1;
    else if (c === '?' && q < 0) q = i;
    else if (c === ':' && q >= 0) return [e.slice(q + 1, i).trim(), e.slice(i + 1).trim()];
  }
  return null;
}
const isKey = e => e.startsWith('Lk(') || (() => { const b = ternary(e); return !!b && b.every(isKey); })();
// reviewed identifiers: a Txt built earlier in the same function (no literal text)
const REVIEWED = { 'src/systems/ext2.js': ['r[0]'], 'src/systems/promo.js': ['msg'], 'src/systems/review.js': ['msg'], 'src/systems/recruit.js': ['t'] }; // recruit.js: the recLog definition

const withSinks = files.filter(f => spansOf(f).length);

describe('sink spans', () => {
  it('sanity: enough sinks overall', () => {
    expect(files.reduce((n, f) => n + spansOf(f).length, 0)).toBeGreaterThanOrEqual(200);
  });
  it('P3_DONE lists every file with a sink span and no frozen snapshot is left', () => {
    expect(withSinks.map(f => f.replace(/^src\//, '')).sort()).toEqual([...P3_DONE].sort());
    expect(fs.existsSync('tests/unit/__snapshots__/sinks') ? fs.readdirSync('tests/unit/__snapshots__/sinks') : []).toEqual([]);
  });
  for (const f of withSinks) {
    it(`${f.replace(/^src\//, '')} stores keys`, () => {
      for (const s of spansOf(f)) {
        expect(VI.test(s), 'Vietnamese letter in sink: ' + s).toBe(false);
        expect(/\bfmt\(/.test(s), 'fmt( in sink: ' + s).toBe(false);
        if (f === 'src/state.js' && /^(addLog|recLog)\(\w+/.test(s)) continue; // the definitions
        if (/^(addLog|recLog)\(/.test(s)) {
          const a = firstArg(s);
          expect(/^['"`]/.test(a), 'string first arg: ' + s).toBe(false);
          expect(isKey(a) || (REVIEWED[f] || []).includes(a), 'addLog/recLog without a key: ' + s).toBe(true);
        }
      }
    });
  }
});
