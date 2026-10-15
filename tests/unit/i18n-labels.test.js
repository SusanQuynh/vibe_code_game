// Every id of the data tables (their Vietnamese text now lives only in the locales; pinned by p3-equiv and
// the phase 1/2 vi snapshots) has a key in every locale.
import { describe, it, expect, afterEach } from 'vitest';
import { setLang } from '../../src/i18n/index.js';
import { PRE, POST } from '../../src/systems/promo.js';
import { FIN_I, FIN_X, SCOUT_N } from '../../src/systems/ext2.js';
import { LEADS } from '../../src/systems/events.js';
import { COMP, DCOMP } from '../../src/systems/contests.js';
import { PLESSON } from '../../src/data/lessons.js';
import { BUDN } from '../../src/systems/secretary.js';
import { STATS, TRAIN, CONCEPTS, GENRES, MSK, MSKD, MDOM } from '../../src/data/rules.js';
import { OFFER } from '../../src/data/offers.js';
import { DAYS } from '../../src/systems/week.js';
import { BIZ } from '../../src/systems/market.js';
import viL from '../../src/i18n/locales/vi.js';
import enL from '../../src/i18n/locales/en.js';

const VI_LETTER = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
afterEach(() => setLang('vi'));

// [prefix, ids]
const CF_IDS = ['overlap', 'offer', 'tired', 'enemy', 'scandal'];
const TABLES = [
  ['stat', Object.keys(STATS)],
  ['train', Object.keys(TRAIN)],
  ['concept', Object.keys(CONCEPTS)],
  ['genre', Object.keys(GENRES)],
  ['offer', Object.keys(OFFER)],
  ['msk', Object.keys(MSK)],
  ['mskd', Object.keys(MSKD)],
  ['dom', Object.keys(MDOM)],
  ['day', DAYS],
  ['dayn', DAYS],
  ['biz', Object.keys(BIZ)],
  ['promo.pre', Object.keys(PRE)],
  ['promo.preD', Object.keys(PRE)],
  ['promo.post', Object.keys(POST)],
  ['biz.d', Object.keys(BIZ)],
  ['inv.leadN', Object.keys(LEADS)],
  ['inv.leadT', Object.keys(LEADS)],
  ['inv.leadF', Object.keys(LEADS)],
  ['prop.cf', CF_IDS],
  ['sec.bud', Object.keys(BUDN).map(k => k / 1e6)],
  ['fin.in', Object.keys(FIN_I)],
  ['fin.out', Object.keys(FIN_X)],
  ['comp.name', [...COMP.map((_, i) => 't' + i), ...DCOMP.map((_, i) => 'd' + i)]],
  ...Object.keys(OFFER).map(k => ['ol.' + k, Array.from({ length: OFFER[k].ltN }, (_, i) => i)]),
  ...Object.keys(PLESSON).map(k => ['ll.' + k, Array.from({ length: PLESSON[k].ltN }, (_, i) => i)]),
  ['ev.why.scout', Array.from({ length: SCOUT_N }, (_, i) => i)],
];

describe('label helpers', () => {
  for (const [p, ids] of TABLES) {
    it(`${p}: table is not empty`, () => expect(ids.length).toBeGreaterThan(0));
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
