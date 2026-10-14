// Every sink that writes text into S (log, hist, lessons, busy title, prHist, GM problems, events, reasons…).
// Files not yet converted (phase 3) are frozen as one snapshot file each; files in P3_DONE must follow the sink rules.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { spans, walk, SINK_STARTS } from '../../scripts/lib/js-spans.mjs';
import { P3_DONE } from './p3.js';

const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const files = [...walk('src')].map(f => f.replace(/\\/g, '/')).filter(f => !f.startsWith('src/i18n/locales/')).sort();
const spansOf = f => spans(fs.readFileSync(f, 'utf8'), SINK_STARTS).map(sp => sp.text);

describe('sink spans', () => {
  it('sanity: enough sinks overall', () => {
    expect(files.reduce((n, f) => n + spansOf(f).length, 0)).toBeGreaterThanOrEqual(200);
  });
  for (const f of files) {
    const sp = spansOf(f), short = f.replace(/^src\//, '');
    if (!sp.length) continue;
    const done = P3_DONE.includes(short);
    it(`${short} (${done ? 'rules' : 'frozen'})`, async () => {
      if (!done) return expect(sp.slice().sort().map(s => `${f}: ${s}`).join('\n')).toMatchFileSnapshot(`__snapshots__/sinks/${f.replace(/^src\//, '').replace(/\//g, '__')}.txt`);
      for (const s of sp) {
        expect(VI.test(s), 'Vietnamese letter in sink: ' + s).toBe(false);
        expect(/\bfmt\(/.test(s), 'fmt( in sink: ' + s).toBe(false);
        if (/^(addLog|recLog)\(/.test(s)) expect(/^(addLog|recLog)\(\s*['"`]/.test(s), 'string first arg: ' + s).toBe(false);
      }
    });
  }
});
