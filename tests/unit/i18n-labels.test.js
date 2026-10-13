// Display-name helpers (src/i18n/labels.js) must reproduce the Vietnamese data tables exactly in vi,
// and every table id must have a key in every locale.
import { describe, it, expect, afterEach } from 'vitest';
import { setLang, t } from '../../src/i18n/index.js';
import { PRE, POST } from '../../src/systems/promo.js';
import { FIN_I, FIN_X } from '../../src/systems/ext2.js';
import { statName, trainName, conceptName, genreName, offerName, mskName, mskDesc, domName, dayShort, dayName, bizName } from '../../src/i18n/labels.js';
import { STATS, TRAIN, CONCEPTS, GENRES, MSK, MSKD, MDOM } from '../../src/data/rules.js';
import { OFFER } from '../../src/data/offers.js';
import { DAYS, DAYN } from '../../src/systems/week.js';
import { BIZ } from '../../src/systems/market.js';
import viL from '../../src/i18n/locales/vi.js';
import enL from '../../src/i18n/locales/en.js';

const VI_LETTER = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
afterEach(() => setLang('vi'));

// [prefix, ids, vi value of an id, helper]
const TABLES = [
  ['stat', Object.keys(STATS), k => STATS[k], statName],
  ['train', Object.keys(TRAIN), k => TRAIN[k].n, trainName],
  ['concept', Object.keys(CONCEPTS), k => CONCEPTS[k].n, conceptName],
  ['genre', Object.keys(GENRES), k => GENRES[k].n, genreName],
  ['offer', Object.keys(OFFER), k => OFFER[k].n, offerName],
  ['msk', Object.keys(MSK), k => MSK[k], mskName],
  ['mskd', Object.keys(MSKD), k => MSKD[k], mskDesc],
  ['dom', Object.keys(MDOM), k => MDOM[k], domName],
  ['day', DAYS.map((_, i) => i), i => DAYS[i], dayShort],
  ['dayn', DAYN.map((_, i) => i), i => DAYN[i], dayName],
  ['biz', Object.keys(BIZ), k => BIZ[k].n, bizName],
  ['promo.pre', Object.keys(PRE), k => PRE[k].n, k => t(`promo.pre.${k}`)],
  ['promo.preD', Object.keys(PRE), k => PRE[k].d, k => t(`promo.preD.${k}`)],
  ['promo.post', Object.keys(POST), k => POST[k].n, k => t(`promo.post.${k}`)],
  ['fin.in', Object.keys(FIN_I), k => FIN_I[k], k => t(`fin.in.${k}`)],
  ['fin.out', Object.keys(FIN_X), k => FIN_X[k], k => t(`fin.out.${k}`)],
];

describe('label helpers', () => {
  for (const [p, ids, tbl, fn] of TABLES) {
    it(`vi ${p}: helper === data table`, () => {
      setLang('vi');
      expect(ids.length).toBeGreaterThan(0);
      for (const k of ids) expect(fn(k)).toBe(tbl(k));
    });
    for (const [code, L] of Object.entries({ vi: viL, en: enL })) {
      it(`${code} ${p}: every id has a key${code === 'en' ? ' and no Vietnamese' : ''}`, () => {
        for (const k of ids) {
          expect(L.dict, `${p}.${k}`).toHaveProperty(`${p}.${k}`);
          if (code === 'en') expect(VI_LETTER.test(L.dict[`${p}.${k}`]), `${p}.${k}`).toBe(false);
        }
      });
    }
  }
  it('rel tags: both TN variants exist in vi and en', () => {
    for (const L of [viL, enL]) for (const k of ['friend', 'enemy', 'dating', 'public']) {
      expect(L.dict).toHaveProperty(`rel.${k}`);
      expect(L.dict).toHaveProperty(`rel.room.${k}`);
    }
    expect(viL.dict['rel.dating']).toBe('💞 Hẹn hò (bí mật)');
    expect(viL.dict['rel.room.dating']).toBe('💞 Hẹn hò bí mật');
  });
});
