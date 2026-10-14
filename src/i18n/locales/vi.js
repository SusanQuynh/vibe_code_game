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
import market from './vi/market.js';
import events from './vi/events.js';
import meet from './vi/meet.js';
import save from './vi/save.js';
import stCommon from './vi/st-common.js';
import stCore from './vi/st-core.js';
import stWeek from './vi/st-week.js';
import stStudio from './vi/st-studio.js';
import stLobby from './vi/st-lobby.js';
import stMgr from './vi/st-mgr.js';
import stMeet from './vi/st-meet.js';

// Dictionary parts per area; the merged dict is what t() reads. check:i18n reports keys defined in two parts.
export const parts = [['core', core], ['common', common], ['labels', labels], ['shared', shared], ['lobby', lobby], ['mgr', mgr], ['artist', artist], ['report', report], ['studio', studio], ['hr', hr], ['market', market], ['events', events], ['meet', meet], ['save', save], ['st-common', stCommon], ['st-core', stCore], ['st-week', stWeek], ['st-studio', stStudio], ['st-lobby', stLobby], ['st-mgr', stMgr], ['st-meet', stMeet]];
export default {
  meta: { code: 'vi', name: 'Tiếng Việt', htmlLang: 'vi' },
  parts,
  dict: Object.assign({}, ...parts.map(p => p[1])),
};
