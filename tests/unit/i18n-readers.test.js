// @vitest-environment jsdom
// Readers accept structured stored text: with every stored-text field replaced by a Msg, no surface may print a raw object,
// and with lang=en no surface may show Vietnamese outside proper nouns.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { noToggle } from './helpers.js';
import { setLang } from '../../src/i18n/index.js';
import { richState, SURFACES, renderSurface, renderLog, visibleText, offenders } from './sim.js';
import { S } from '../../src/state.js';
import { msgify } from './p3.js';

noToggle();
let base;
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1790000000000);
  base = msgify(richState());
}, 120000);
afterEach(() => setLang('vi'));

for (const lang of ['vi', 'en']) {
  describe(`msgified state renders in ${lang}`, () => {
    for (const s of SURFACES) {
      it(s.name, () => {
        setLang(lang);
        const html = renderSurface(s.name, base);
        if (html == null) return;
        expect(html).not.toContain('[object Object]');
        if (lang === 'en' && s.name !== 'lang') {
          let root = document.getElementById('sheet');
          if (s.name === 'top') { root = document.body.cloneNode(true); root.querySelector('#toast')?.remove(); } // the log is checked in the 'log' test
          const off = offenders(visibleText(root), S);
          expect(off.filter(w => !/^N\d+·T\d+$/.test(w)), s.name).toEqual([]);
        }
      });
    }
    it('log', () => {
      setLang(lang);
      const h = renderLog(base);
      expect(h).not.toContain('[object Object]');
      expect(h).toContain(lang === 'vi' ? 'Lứa 9' : 'Batch 9');
      if (lang === 'en') expect(h).not.toMatch(/N\d+·T\d+/);
    });
  });
}
