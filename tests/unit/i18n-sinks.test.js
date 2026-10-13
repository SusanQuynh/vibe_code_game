// Every sink that writes text into S (log, hist, lessons, busy title, prHist, GM problems, events) is snapshotted.
// Phase 2 must never change a sink: an edit inside one turns this test red.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { spans, walk } from '../../scripts/lib/js-spans.mjs';

const STARTS = ['addLog(', 'recLog(', 'pushEv(', '.hist.unshift(', '.lessons.unshift(', 'busy={', 'S.prHist.unshift(', 'prob.push('];

describe('sink spans', () => {
  it('snapshot of every sink call in src/', () => {
    const out = [];
    for (const f of [...walk('src')].sort()) {
      const src = fs.readFileSync(f, 'utf8');
      for (const sp of spans(src, STARTS)) out.push(`${f.replace(/\\/g, '/')}: ${sp.text}`);
    }
    out.sort();
    expect(out.length).toBeGreaterThanOrEqual(200);
    expect(out.join('\n')).toMatchSnapshot();
  });
});
