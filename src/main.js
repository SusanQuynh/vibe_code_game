import './styles/index.css';
import './ui/globals.js';
import { load, save, setSavedHook } from './save/storage.js';
import { $ } from './core/util.js';
import { S, newGame } from './state.js';
import { nextWeek } from './systems/week.js';
import { migrateV3 } from './systems/ext3.js';
import { debutIds } from './systems/debut.js';
import { hireMgr } from './systems/managers.js';
import { sign } from './systems/artists.js';
import { acceptOffer } from './systems/offers.js';
import { render } from './ui/building.js';
import { tutStart } from './ui/tutorial.js';

setSavedHook((ok) => { const el = $('#saved'); if (el) el.textContent = ok ? '💾 Đã lưu tự động' : '⚠️ Không lưu được'; });
if (!load()) newGame();
migrateV3();
render();
save();
if (!S.tut && !localStorage.getItem('__golden')) setTimeout(() => tutStart(0), 400);

// móc cho test e2e (golden master)
window.__game = { nextWeek: (...a) => nextWeek(...a), state: () => S, api: { hireMgr, sign, debutIds, acceptOffer } };
