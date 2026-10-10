import { describe, it, expect } from 'vitest';
import { exportCode, importCode, parseSaveText, saveFileName } from '../../src/save/transfer.js';

const sample = { v: 1, year: 2, week: 7, artists: [{ id: 1, name: 'Hà Linh' }], log: [] };

describe('exportCode / importCode', () => {
  it('round-trip preserves state', async () => {
    const code = await exportCode(sample);
    expect(code.startsWith('SL1.')).toBe(true);
    expect(code).toMatch(/^SL1\.[A-Za-z0-9_-]+$/);
    expect(await importCode(code)).toEqual(sample);
  });
  it('a large save (hundreds of KB) does not overflow the stack', async () => {
    const big = { ...sample, log: Array.from({ length: 20000 }, (_, i) => ({ t: 'dòng nhật ký số ' + i + ' ' + Math.random(), c: '', w: 'N1·T1' })) };
    expect(await importCode(await exportCode(big))).toEqual(big);
  });
  it('accepts whitespace/newlines in pasted codes', async () => {
    const code = await exportCode(sample);
    expect(await importCode('  ' + code.slice(0, 20) + '\n' + code.slice(20) + ' ')).toEqual(sample);
  });
  it('rejects corrupt codes', async () => {
    await expect(importCode('SL1.abc')).rejects.toThrow();
    await expect(importCode('xyz')).rejects.toThrow(/không hợp lệ/);
    const code = await exportCode(sample);
    await expect(importCode(code.slice(0, code.length - 12))).rejects.toThrow();
  });
  it('rejects data that is not a save', async () => {
    await expect(importCode(await exportCode({ foo: 1 }))).rejects.toThrow(/không phải save/);
    await expect(importCode(await exportCode(null))).rejects.toThrow();
  });
});

describe('parseSaveText', () => {
  it('accepts raw JSON and SL1 codes', async () => {
    expect(await parseSaveText(JSON.stringify(sample))).toEqual(sample);
    expect(await parseSaveText(await exportCode(sample))).toEqual(sample);
  });
  it('rejects junk', async () => {
    await expect(parseSaveText('')).rejects.toThrow();
    await expect(parseSaveText('{bad')).rejects.toThrow(/JSON/);
    await expect(parseSaveText('{"a":1}')).rejects.toThrow(/không phải save/);
  });
});

it('file name uses year/week', () => {
  expect(saveFileName(sample)).toBe('starlight-N2-T7.json');
});
