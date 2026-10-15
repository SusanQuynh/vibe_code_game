// @vitest-environment jsdom
// SL2 import: replaceSave refills the dropped lists once (flag never stored), the game keeps running, and the save view offers the short code.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { Blob as NodeBlob } from 'node:buffer';
import { noToggle, seed } from './helpers.js';
import { richState } from './sim.js';
import { S } from '../../src/state.js';
import { setLang } from '../../src/i18n/index.js';
import { KEY, KEY_FULL, load, replaceSave, shortOf } from '../../src/save/storage.js';
import { nextWeek } from '../../src/systems/week.js';
import { viewCode } from '../../src/ui/saveView.js';
import { importCode, exportShortCode } from '../../src/save/transfer.js';
import { setCurView } from '../../src/ui/modal.js';

noToggle(true);
const clone = (x) => JSON.parse(JSON.stringify(x));
afterEach(() => setLang('vi'));

describe('regenAfterShort via replaceSave', () => {
  let short, src;
  beforeAll(() => { richState(3, 56); src = clone(S); short = shortOf(src); }, 120000);

  it('refills pool, mgrPool, offers, comps, hsC and adds the log line; keeps progress', () => {
    seed(5);
    expect(replaceSave(clone(short))).toBe(true);
    expect(S.pool.length).toBeGreaterThan(0);
    expect(S.mgrPool.length).toBe(3);
    expect(S.offers.length).toBeGreaterThan(0);
    expect(S.comps.length).toBeGreaterThan(0);
    expect(S.hsC.length).toBe(2);
    expect(S.log.some((l) => l.t && l.t.k === 'log.sys.shortImport')).toBe(true);
    expect(S.money).toBe(src.money);
    expect(S.week).toBe(src.week);
    expect(S.groups).toEqual(src.groups);
    expect(S.__short).toBeUndefined();
    for (const k of [KEY, KEY_FULL]) expect(localStorage.getItem(k)).not.toContain('__short');
  });
  it('a reload does not refill again', () => {
    const ids = S.pool.map((a) => a.id).join();
    expect(load()).toBe(true);
    expect(S.pool.map((a) => a.id).join()).toBe(ids);
    expect(S.log.filter((l) => l.t && l.t.k === 'log.sys.shortImport').length).toBe(1);
  });
  it('20 more weeks run without errors or NaN money', () => {
    seed(6);
    replaceSave(clone(short));
    for (let i = 0; i < 20; i++) nextWeek(true, true);
    expect(Number.isFinite(S.money)).toBe(true);
    expect(JSON.stringify(S)).not.toContain('NaN');
  }, 120000);
  it('a normal (SL1 style) replaceSave adds nothing', () => {
    replaceSave(clone(src));
    expect(S.log.some((l) => l.t && l.t.k === 'log.sys.shortImport')).toBe(false);
  });
});

describe('save view short code card', () => {
  beforeAll(() => { globalThis.Blob = NodeBlob; });
  const settle = () => new Promise((r) => setTimeout(r, 200));
  const open = async () => {
    document.body.innerHTML = '<div class="sheet" id="sheet"></div><div id="toast"></div>';
    setCurView(viewCode); viewCode();
    const first = document.getElementById('sheet').innerHTML;
    await settle();
    return first;
  };
  it('card appears after both codes exist; the original markup is untouched', async () => {
    seed(3);
    const first = await open();
    const card = document.getElementById('shortCard');
    expect(card).toBeTruthy();
    expect(document.getElementById('codeShort').value).toMatch(/^SL2\./);
    expect(document.getElementById('codeShow').value).toMatch(/^SL1\./);
    expect(card.textContent).toMatch(/\d+ ký tự/);
    expect(document.getElementById('codeShort').value.length).toBeLessThan(document.getElementById('codeShow').value.length);
    card.remove();
    expect(document.getElementById('sheet').innerHTML.replace(/\s+/g, '')).toBe(first.replace(/\s+/g, ''));
    expect(first).not.toContain('shortCard');
  });
  it('en: no Vietnamese in the card', async () => {
    setLang('en');
    await open();
    const txt = document.getElementById('shortCard').textContent;
    expect(txt).toContain('Short code');
    expect(txt).not.toMatch(/[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/i);
  });
  it('the short code from the view imports back to a flagged short state', async () => {
    await open();
    const d = await importCode(document.getElementById('codeShort').value);
    expect(d.__short).toBe(1);
    expect(d.pool).toEqual([]);
    expect((await importCode(await exportShortCode(shortOf(S)))).artists.length).toBe(S.artists.length);
  });
});
