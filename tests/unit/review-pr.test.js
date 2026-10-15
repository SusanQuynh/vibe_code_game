// @vitest-environment jsdom
// prPlans() feeds prGo's stored Msg: it must be pure (no RNG, no write to S).
import { describe, it, expect, vi } from 'vitest';
import { noToggle } from './helpers.js';
import { S, setState } from '../../src/state.js';
import { richState } from './sim.js';
import { prPlans } from '../../src/systems/review.js';

noToggle();
describe('prPlans purity', () => {
  it('draws no random number and leaves S untouched', () => {
    setState(richState(7, 56));
    const before = JSON.stringify(S), spy = vi.spyOn(Math, 'random');
    const L = prPlans();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    expect(JSON.stringify(S)).toBe(before);
    expect(L.length).toBeGreaterThan(0);
    for (const p of L) expect(p.m && typeof p.m.k).toBe('string');
  });
});
