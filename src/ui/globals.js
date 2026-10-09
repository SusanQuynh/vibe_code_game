/* Cầu nối: handler inline trong HTML (onclick="...") gọi hàm toàn cục → gán lên window ở đúng một nơi. */
import { $ } from '../core/util.js';
import { save } from '../save/storage.js';
import { S, byId, resetGame } from '../state.js';
import { fire, recast, setAll, setSched, sign } from '../systems/artists.js';
import { batchLive, batchSched, moveBatch, newBatch, setCurBatch } from '../systems/batches.js';
import { invBuy, invOpen, invStart, resolveEv } from '../systems/events.js';
import { fireAsst, renewDo, setMentor, songAct, toggleHold } from '../systems/ext2.js';
import { dqKeep, dqLater, hsApply, hsFire, hsHire, paFire, paHire, paOpen, paRe } from '../systems/ext3.js';
import { assignMgr, fireMgr, hireMgr, rehuntMgr, setAuto, setBoss, toggleMA } from '../systems/managers.js';
import { buyBiz, buybackBiz, raiseBiz, sellBiz, upBiz } from '../systems/market.js';
import { acceptOffer, investOffer } from '../systems/offers.js';
import { postAuto, postDo, preAuto, preDo } from '../systems/promo.js';
import { cfPick, propAll, propOk, propOkAll } from '../systems/proposals.js';
import { doFM, doLive, holdConcert } from '../systems/releases.js';
import { prGo } from '../systems/review.js';
import { cbCancel, cbNow, cbSched, cbSchedRec } from '../systems/secretary.js';
import { nextWeek, setPs } from '../systems/week.js';
import { act, campKeyOf } from './building.js';
import { closeM, view } from './modal.js';
import { planBack, planFill, planGo, planMgr, planNext, planRec, planSel, planSet, planSkip, setPropNext, startPlanOne } from './planning.js';
import { RV, openRoom, setSchedTTS } from './rooms.js';
import { saveCopyCode, saveDownload, saveImportApply, saveImportFile, saveImportText, viewCode } from './saveView.js';
import { tutEnd, tutGo, tutStart } from './tutorial.js';
import { setAllD, setRepDay, togD, viewArtist, viewEvents, viewReport, viewReportFull } from './views.js';
import { compPick, compPrev, enterComp } from './views/batches.js';
import { applyLineup, applyRec, debut } from './views/debut.js';
import { songRelease, viewRenew, viewSong, viewSongs, wPrev, writeSong } from './views/ext2.js';
import { dqDo, viewDebutQ } from './views/ext3.js';
import { acceptSel, ocPick, ocPrev } from './views/offers.js';
import { viewProps } from './views/proposals.js';
import { produceFilm, releaseSingle, viewCamp } from './views/releases.js';
import { studioPick, viewSec } from './views/secretary.js';

Object.assign(window, {
  $,
  RV,
  acceptOffer,
  acceptSel,
  act,
  applyLineup,
  applyRec,
  assignMgr,
  batchLive,
  batchSched,
  buyBiz,
  buybackBiz,
  byId,
  campKeyOf,
  cbCancel,
  cbNow,
  cbSched,
  cbSchedRec,
  cfPick,
  closeM,
  compPick,
  compPrev,
  debut,
  doFM,
  doLive,
  dqDo,
  dqKeep,
  dqLater,
  enterComp,
  fire,
  fireAsst,
  fireMgr,
  hireMgr,
  holdConcert,
  hsApply,
  hsFire,
  hsHire,
  invBuy,
  invOpen,
  invStart,
  investOffer,
  moveBatch,
  newBatch,
  nextWeek,
  ocPick,
  ocPrev,
  openRoom,
  paFire,
  paHire,
  paOpen,
  paRe,
  planBack,
  planFill,
  planGo,
  planMgr,
  planNext,
  planRec,
  planSel,
  planSet,
  planSkip,
  postAuto,
  postDo,
  prGo,
  preAuto,
  preDo,
  produceFilm,
  propAll,
  propOk,
  propOkAll,
  raiseBiz,
  recast,
  rehuntMgr,
  releaseSingle,
  renewDo,
  resetGame,
  resolveEv,
  save,
  sellBiz,
  setAll,
  setAllD,
  setAuto,
  setBoss,
  setCurBatch,
  setMentor,
  setPropNext,
  setPs,
  setRepDay,
  setSched,
  setSchedTTS,
  sign,
  songAct,
  songRelease,
  startPlanOne,
  studioPick,
  togD,
  toggleHold,
  toggleMA,
  tutEnd,
  tutGo,
  tutStart,
  upBiz,
  view,
  viewArtist,
  viewCamp,
  saveCopyCode,
  saveDownload,
  saveImportApply,
  saveImportFile,
  saveImportText,
  viewCode,
  viewDebutQ,
  viewEvents,
  viewProps,
  viewRenew,
  viewReport,
  viewReportFull,
  viewSec,
  viewSong,
  viewSongs,
  wPrev,
  writeSong
});
// handler inline đọc/ghi S.xxx → luôn trỏ tới state hiện tại
Object.defineProperty(window, 'S', { get: () => S, configurable: true });
