import { describe, it, expect } from 'vitest';
import { fmt, fmtN, FMT_VI, clamp, esc } from '../../src/core/util.js';

describe('fmt', () => {
  it('billions / millions / thousands', () => {
    expect(fmt(1.5e9)).toBe('1.5 tỷ');
    expect(fmt(600e6)).toBe('600 tr');
    expect(fmt(-2e6)).toBe('-2 tr');
    expect(fmt(4500)).toBe('5k');
  });
  it('default == FMT_VI across the whole range', () => {
    for (let x = -3e9; x <= 3e9; x += 7_654_321.5) expect(fmt(x)).toBe(fmt(x, FMT_VI));
  });
  it('accepts another unit table', () => {
    const u = { b: 'B', m: 'M', k: 'K' };
    expect(fmt(1.5e9, u)).toBe('1.5B');
    expect(fmt(600e6, u)).toBe('600M');
    expect(fmt(4500, u)).toBe('5K');
  });
});

describe('fmtN', () => {
  it('K/M', () => {
    expect(fmtN(1500)).toBe('1.5K');
    expect(fmtN(2_000_000)).toBe('2M');
    expect(fmtN(12)).toBe('12');
  });
});

it('clamp', () => {
  expect(clamp(5, 0, 3)).toBe(3);
  expect(clamp(-1, 0, 3)).toBe(0);
  expect(clamp(2, 0, 3)).toBe(2);
});

it('esc prevents XSS', () => {
  expect(esc('<a href="x">')).toBe('&lt;a href=&quot;x&quot;&gt;');
  expect(esc("it's & co")).toBe('it&#39;s &amp; co');
});
