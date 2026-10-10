import { describe, it, expect } from 'vitest';
import { R, rnd, pick } from '../../src/core/rng.js';
import { seed } from './helpers.js';

describe('rng (built on Math.random → seedable)', () => {
  it('R stays within [a,b], both ends included', () => {
    seed(5);
    const xs = Array.from({ length: 500 }, () => R(2, 4));
    expect(Math.min(...xs)).toBe(2);
    expect(Math.max(...xs)).toBe(4);
  });
  it('rnd stays within [a,b)', () => {
    seed(6);
    for (let i = 0; i < 200; i++) { const v = rnd(1, 2); expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThan(2); }
  });
  it('same seed → same sequence; pick returns an array element', () => {
    seed(9); const a = [R(1, 100), pick(['x', 'y', 'z'])];
    seed(9); const b = [R(1, 100), pick(['x', 'y', 'z'])];
    expect(a).toEqual(b);
    expect(['x', 'y', 'z']).toContain(a[1]);
  });
});
