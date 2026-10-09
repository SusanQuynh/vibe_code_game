import './styles/index.css';
import './ui/globals.js';
import { load, save } from './save/storage.js';
import { S, newGame } from './state.js';
import { nextWeek } from './systems/week.js';
import { migrateV3 } from './systems/ext3.js';
import { debutIds } from './systems/debut.js';
import { hireMgr } from './systems/managers.js';
import { sign } from './systems/artists.js';
import { acceptOffer } from './systems/offers.js';
import { render } from './ui/building.js';
import { curView } from './ui/modal.js';
import { setDB, setDbState } from './ui/saveView.js';
import { tutStart } from './ui/tutorial.js';

if (!load()) newGame();
migrateV3();
render();
save();
if (!S.tut && !localStorage.getItem('__golden')) setTimeout(() => tutStart(0), 400);
(async()=>{try{if(window.claude&&window.claude.use){setDB(await window.claude.use('db'))}}catch(e){setDB(null)}setDbState('done');save();if(curView)curView()})();

// móc cho test e2e (golden master)
window.__game = { nextWeek: (...a) => nextWeek(...a), state: () => S, api: { hireMgr, sign, debutIds, acceptOffer } };
