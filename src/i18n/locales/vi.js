import core from './vi/core.js';
import common from './vi/common.js';
import labels from './vi/labels.js';
import shared from './vi/shared.js';
import lobby from './vi/lobby.js';
import mgr from './vi/mgr.js';
import artist from './vi/artist.js';
import report from './vi/report.js';
import studio from './vi/studio.js';
import hr from './vi/hr.js';

// Dictionary parts per area; the merged dict is what t() reads. check:i18n reports keys defined in two parts.
export const parts = [['core', core], ['common', common], ['labels', labels], ['shared', shared], ['lobby', lobby], ['mgr', mgr], ['artist', artist], ['report', report], ['studio', studio], ['hr', hr]];
export default {
  meta: { code: 'vi', name: 'Tiếng Việt', htmlLang: 'vi' },
  parts,
  dict: Object.assign({}, ...parts.map(p => p[1])),
};
