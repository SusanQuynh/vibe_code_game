import { describe, it, expect } from 'vitest';
import { exportCode, importCode, parseSaveText, saveFileName } from '../../src/save/transfer.js';

const sample = { v: 1, year: 2, week: 7, artists: [{ id: 1, name: 'Hà Linh' }], log: [] };

describe('exportCode / importCode', () => {
  it('round-trip giữ nguyên state', async () => {
    const code = await exportCode(sample);
    expect(code.startsWith('SL1.')).toBe(true);
    expect(code).toMatch(/^SL1\.[A-Za-z0-9_-]+$/);
    expect(await importCode(code)).toEqual(sample);
  });
  it('save lớn (nhiều trăm KB) không tràn stack', async () => {
    const big = { ...sample, log: Array.from({ length: 20000 }, (_, i) => ({ t: 'dòng nhật ký số ' + i + ' ' + Math.random(), c: '', w: 'N1·T1' })) };
    expect(await importCode(await exportCode(big))).toEqual(big);
  });
  it('chấp nhận khoảng trắng/xuống dòng khi dán mã', async () => {
    const code = await exportCode(sample);
    expect(await importCode('  ' + code.slice(0, 20) + '\n' + code.slice(20) + ' ')).toEqual(sample);
  });
  it('từ chối mã hỏng', async () => {
    await expect(importCode('SL1.abc')).rejects.toThrow();
    await expect(importCode('xyz')).rejects.toThrow(/không hợp lệ/);
    const code = await exportCode(sample);
    await expect(importCode(code.slice(0, code.length - 12))).rejects.toThrow();
  });
  it('từ chối dữ liệu không phải save', async () => {
    await expect(importCode(await exportCode({ foo: 1 }))).rejects.toThrow(/không phải save/);
    await expect(importCode(await exportCode(null))).rejects.toThrow();
  });
});

describe('parseSaveText', () => {
  it('nhận JSON thô và mã SL1', async () => {
    expect(await parseSaveText(JSON.stringify(sample))).toEqual(sample);
    expect(await parseSaveText(await exportCode(sample))).toEqual(sample);
  });
  it('từ chối rác', async () => {
    await expect(parseSaveText('')).rejects.toThrow();
    await expect(parseSaveText('{bad')).rejects.toThrow(/JSON/);
    await expect(parseSaveText('{"a":1}')).rejects.toThrow(/không phải save/);
  });
});

it('tên file theo năm/tuần', () => {
  expect(saveFileName(sample)).toBe('starlight-N2-T7.json');
});
