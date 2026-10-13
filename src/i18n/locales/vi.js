import core from './vi/core.js';
import common from './vi/common.js';
import labels from './vi/labels.js';
import shared from './vi/shared.js';
import lobby from './vi/lobby.js';

// Dictionary parts per area; the merged dict is what t() reads. check:i18n reports keys defined in two parts.
export const parts = [['core', core], ['common', common], ['labels', labels], ['shared', shared], ['lobby', lobby]];
export default {
  meta: { code: 'vi', name: 'Tiếng Việt', htmlLang: 'vi' },
  parts,
  dict: Object.assign({}, ...parts.map(p => p[1])),
};
