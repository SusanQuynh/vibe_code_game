import { describe, it, expect } from 'vitest';
import { fmt, fmtN, clamp, esc } from '../../src/core/util.js';

describe('fmt', () => {
  it('tỷ / triệu / nghìn', () => {
    expect(fmt(1.5e9)).toBe('1.5 tỷ');
    expect(fmt(600e6)).toBe('600 tr');
    expect(fmt(-2e6)).toBe('-2 tr');
    expect(fmt(4500)).toBe('5k');
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

it('esc chống XSS', () => {
  expect(esc('<a href="x">')).toBe('&lt;a href=&quot;x&quot;&gt;');
  expect(esc("it's & co")).toBe('it&#39;s &amp; co');
});
