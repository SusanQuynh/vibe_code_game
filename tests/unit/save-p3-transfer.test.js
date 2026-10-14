// SL1 export / import round-trips structured stored text (node environment: needs CompressionStream / Blob.stream).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { exportCode, importCode, parseSaveText } from '../../src/save/transfer.js';

const mixed = {
  v: 1, year: 2, week: 7, artists: [{ id: 1, name: 'Hà Linh', hist: [{ k: 'hist.award', p: { y: 1, c: { k: 'aw.cat.artist' } } }, 'N1: dòng cũ'], lessons: [{ t: { k: 'les.rep' }, l: 'x', s: { $g: { vocal: '1.5' } }, y: 1 }] }],
  log: [{ t: { k: 'log.ev.left', p: { n: 'Hà Linh', w: { k: 'ev.why.fire' }, g: '' } }, c: 'bad', w: 'N2·T7' }, { t: '👋 dòng cũ', c: '', w: 'N1·T1' }, { t: { $: 2.5e9 }, c: '', w: 'N1·T1' }],
  batches: [{ id: 1, n: { k: 'batch.n', p: { i: 1 } }, w: 1 }],
};

describe('SL1 with structured stored text', () => {
  it('round trip deep-equals', async () => {
    expect(await importCode(await exportCode(mixed))).toEqual(mixed);
    expect(await parseSaveText(JSON.stringify(mixed))).toEqual(mixed);
  });
  it('a code built from the v1 fixture imports with its legacy strings verbatim', async () => {
    const f = JSON.parse(fs.readFileSync('tests/fixtures/save-v1.json', 'utf8'));
    const d = await importCode(await exportCode(f));
    expect(d.log).toEqual(f.log);
    expect(d).toEqual(f);
  });
});
