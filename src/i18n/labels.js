// Display names of the data tables, looked up by id. The tables (STATS, TRAIN, CONCEPTS…) keep their Vietnamese
// fields because log code still reads them; UI code uses these helpers. Leaf module: imports only ./index.js.
import { t } from './index.js';

export const statName = k => t(`stat.${k}`), trainName = k => t(`train.${k}`), conceptName = k => t(`concept.${k}`),
  genreName = k => t(`genre.${k}`), offerName = k => t(`offer.${k}`), mskName = k => t(`msk.${k}`), mskDesc = k => t(`mskd.${k}`),
  domName = k => t(`dom.${k}`), dayShort = i => t(`day.${i}`), dayName = i => t(`dayn.${i}`), bizName = k => t(`biz.${k}`),
  relTagName = k => t(`rel.${k}`);
