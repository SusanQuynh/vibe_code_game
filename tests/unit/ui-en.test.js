// @vitest-environment jsdom
// Leftover-Vietnamese guard for lang=en. EN_DONE grows with each area task; task 14 asserts it covers every surface.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { noToggle } from './helpers.js';
import { setLang } from '../../src/i18n/index.js';
import { richState, renderSurface, runToasts, visibleText } from './sim.js';
import { S, setState } from '../../src/state.js';

noToggle();
export const EN_DONE = ['lang'];
export const TOASTS_DONE = [];

const VI_LETTER = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
// proper nouns / names that come from data tables and are shown verbatim
const ALLOW_WORDS = new Set(['Tiếng', 'Việt']);
const STORED_KEYS = new Set(['log', 'hist', 'lessons', 'why', 'prob', 'ev', 'prHist']);

// Vietnamese strings reachable from S: long ones are stripped whole, short ones (names…) allow their words
function storedStrings(root) {
  const all = [], short = new Set();
  const walk = (v, key, underStored) => {
    if (typeof v === 'string') {
      if (!VI_LETTER.test(v)) return;
      all.push(v);
      if (v.length <= 40 && !underStored) for (const w of v.match(/\p{L}+/gu) || []) short.add(w);
    } else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) walk(x, k, underStored || STORED_KEYS.has(k));
    }
  };
  walk(root, '', false);
  return { all: all.sort((a, b) => b.length - a.length), short };
}

// returns the offending words/tokens of `text` (visible text of an en render)
export function offenders(text, state) {
  const { all, short } = storedStrings(state);
  for (const s of all) text = text.split(s).join(' ');
  const out = [];
  for (const w of text.match(/\p{L}+/gu) || []) if (VI_LETTER.test(w) && !short.has(w) && !ALLOW_WORDS.has(w)) out.push(w);
  for (const m of text.matchAll(/\b(TTS|QL|GĐ|CN|tr)\b|\bN\d+·T\d+\b|\bT[2-7]\b/gu)) out.push(m[0]);
  return out;
}

let base, early;
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1790000000000);
  base = richState();
  early = richState(42, 0);
}, 120000);
afterEach(() => setLang('vi'));

describe('offenders()', () => {
  it('flags Vietnamese words and ignores stored names', () => {
    setState(structuredClone(base));
    expect(offenders('Tuần 3 · Not enough money', S)).toEqual(['Tuần']);
    expect(offenders(`Sign ${S.artists[0].name}`, S)).toEqual([]);
    expect(offenders('Cost 10 tr, TTS Q1', S)).toEqual(['tr', 'TTS']);
  });
});

describe('en render has no Vietnamese', () => {
  it.each(EN_DONE)('%s', name => {
    setLang('en');
    const early_ = name.startsWith('early-');
    const base_ = early_ ? early : base;
    const html = renderSurface(early_ ? name.slice(6) : name, base_);
    if (html == null) return;
    const root = document.getElementById('sheet').isConnected && name !== 'top' ? document.getElementById('sheet') : document.body;
    const off = offenders(visibleText(root), S);
    expect(off, `${name}: ${off.join(', ')}`).toEqual([]);
  });
  it('toasts', () => {
    setLang('en');
    const res = runToasts(base);
    for (const n of TOASTS_DONE) expect(offenders(res[n] || '', base), n).toEqual([]);
  });
});
