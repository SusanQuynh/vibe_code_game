import { txVi } from '../../src/i18n/index.js';
// Mulberry32 — same algorithm as tests/e2e/seed.js
export function seed(n = 1) {
  let a = n >>> 0;
  Math.random = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// stored text (Txt) rendered in Vietnamese, for assertions on S
export const viT = v => txVi(v);

export const SHELL = `<div class="wrap"><b id="date"></b><small id="yearL"></small><b id="money"></b>
<span id="artN"></span><span id="fansP"></span><b id="evn"></b><small id="roofInfo"></small>
<div id="facade"></div><nav id="dock"></nav><div id="outside"></div><button id="trendBar"></button>
<div id="saved"></div><div id="log"></div><button id="nextBtn"></button></div><div class="sheet" id="sheet"></div>`;

// <details ontoggle="togD(..)"> fires asynchronously in jsdom where togD is not on window: strip the handler on insert
export function noToggle(sync = false) {
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.querySelectorAll) n.querySelectorAll('[ontoggle]').forEach(e => e.removeAttribute('ontoggle')); })
    .observe(document, { childList: true, subtree: true });
  // sync = true also strips on every innerHTML set (nodes replaced within the same tick would otherwise still fire ontoggle later).
  // The display snapshots (ui-vi-*) must keep the ontoggle attributes, so they use the default.
  const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (sync && d && d.set && !d.set.__noToggle) {
    const set = function (v) { d.set.call(this, v); this.querySelectorAll('[ontoggle]').forEach(e => e.removeAttribute('ontoggle')); };
    set.__noToggle = true;
    Object.defineProperty(Element.prototype, 'innerHTML', { ...d, set });
  }
}
