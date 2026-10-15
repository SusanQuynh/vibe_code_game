// SL2 codec round trip (node environment: needs CompressionStream / Blob.stream).
import { describe, it, expect } from 'vitest';
import { exportCode, exportShortCode, importCode, parseSaveText } from '../../src/save/transfer.js';

const sample = { v: 1, year: 2, week: 7, money: 5e8, artists: [{ id: 1, name: 'Hà Linh' }], log: [], __short: 1 };

describe('SL2 code', () => {
  it('round trips and is accepted by importCode and parseSaveText', async () => {
    const c = await exportShortCode(sample);
    expect(c).toMatch(/^SL2\.[A-Za-z0-9_-]+$/);
    expect(await importCode(c)).toEqual(sample);
    expect(await parseSaveText(c)).toEqual(sample);
    expect(await importCode(await exportCode({ ...sample, __short: undefined }))).not.toHaveProperty('__short');
  });
  it('flags the state as short even when the payload lacks the flag', async () => {
    const c = await exportShortCode({ ...sample, __short: 0 });
    expect((await importCode(c)).__short).toBe(1);
  });
  it('tolerates whitespace', async () => {
    const c = await exportShortCode(sample);
    expect(await importCode(' ' + c.slice(0, 15) + '\n' + c.slice(15) + ' ')).toEqual(sample);
  });
  it('rejects bad or truncated codes like SL1', async () => {
    const c = await exportShortCode(sample);
    await expect(importCode('SL2.abc')).rejects.toMatchObject({ key: 'save.err.truncated' });
    await expect(importCode(c.slice(0, c.length - 10))).rejects.toThrow();
    await expect(importCode('SL3.abc')).rejects.toMatchObject({ key: 'save.err.invalid' });
    await expect(importCode(await exportShortCode({ foo: 1 }))).rejects.toMatchObject({ key: 'save.err.notSave' });
  });
});
