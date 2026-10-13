import core from './en/core.js';
import common from './en/common.js';
import labels from './en/labels.js';

// Dictionary parts per area; the merged dict is what t() reads. check:i18n reports keys defined in two parts.
export const parts = [['core', core], ['common', common], ['labels', labels]];
export default {
  meta: { code: 'en', name: 'English (beta)', htmlLang: 'en' },
  parts,
  dict: Object.assign({}, ...parts.map(p => p[1])),
};
