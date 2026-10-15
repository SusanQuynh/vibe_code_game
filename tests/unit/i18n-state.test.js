// @vitest-environment jsdom
// S must be language-independent: same JSON.stringify(S) and same Math.random call count for vi and en,
// with a room or view open every week (so act() re-renders it).
import { describe, it, expect, afterEach } from 'vitest';
import { noToggle, seed, SHELL } from './helpers.js';
import { S, newGame } from '../../src/state.js';
import { setPos } from '../../src/ui/building.js';
import { closeM } from '../../src/ui/modal.js';
import { setLang } from '../../src/i18n/index.js';
import { SURFACES, play } from './sim.js';

noToggle();
afterEach(() => setLang('vi'));

function run(lang) {
  setLang(lang);
  document.body.innerHTML = SHELL;
  localStorage.clear();
  seed(7);
  const orig = Math.random;
  let n = 0;
  Math.random = () => { n++; return orig(); };
  setPos({});
  newGame();
  const errs = [];
  play(56, errs, i => {
    closeM();
    const s = SURFACES[i % SURFACES.length];
    try { s.open(); } catch (e) { errs.push('open:' + s.name + ':' + e.message); }
  });
  Math.random = orig;
  return { s: JSON.stringify(S), n, errs: errs.length };
}

describe('S language-independence', () => {
  it('vi and en give the same S and the same RNG call count', () => {
    const a = run('vi'), b = run('en');
    expect(b.n).toBe(a.n);
    expect(b.errs).toBe(a.errs);
    expect(b.s === a.s).toBe(true);
  }, 120000);
});
