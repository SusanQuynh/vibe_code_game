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

export const SHELL = `<div class="wrap"><b id="date"></b><small id="yearL"></small><b id="money"></b>
<span id="artN"></span><span id="fansP"></span><b id="evn"></b><small id="roofInfo"></small>
<div id="facade"></div><nav id="dock"></nav><div id="outside"></div><button id="trendBar"></button>
<div id="saved"></div><div id="log"></div><button id="nextBtn"></button></div><div class="sheet" id="sheet"></div>`;

// <details ontoggle="togD(..)"> fires asynchronously in jsdom where togD is not on window: strip the handler on insert
export function noToggle() {
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.querySelectorAll) n.querySelectorAll('[ontoggle]').forEach(e => e.removeAttribute('ontoggle')); })
    .observe(document, { childList: true, subtree: true });
}
