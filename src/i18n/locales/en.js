import core from './en/core.js';
import common from './en/common.js';
import labels from './en/labels.js';
import shared from './en/shared.js';
import lobby from './en/lobby.js';
import mgr from './en/mgr.js';
import artist from './en/artist.js';
import report from './en/report.js';
import studio from './en/studio.js';
import hr from './en/hr.js';
import market from './en/market.js';
import events from './en/events.js';
import meet from './en/meet.js';
import save from './en/save.js';
import stCommon from './en/st-common.js';

// Dictionary parts per area; the merged dict is what t() reads. check:i18n reports keys defined in two parts.
export const parts = [['core', core], ['common', common], ['labels', labels], ['shared', shared], ['lobby', lobby], ['mgr', mgr], ['artist', artist], ['report', report], ['studio', studio], ['hr', hr], ['market', market], ['events', events], ['meet', meet], ['save', save], ['st-common', stCommon]];
export default {
  meta: { code: 'en', name: 'English (beta)', htmlLang: 'en' },
  parts,
  dict: Object.assign({}, ...parts.map(p => p[1])),
};
