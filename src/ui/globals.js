/* Cầu nối: handler inline trong HTML (onclick="...") gọi hàm toàn cục → gán lên window ở đúng một nơi. */
import { $ } from '../core/util.js';
import { save } from '../save/storage.js';
import { S, byId, resetGame } from '../state.js';
import { fire, recast, setAll, setSched, sign } from '../systems/artists.js';
import { batchLive, batchSched, compPick, compPrev, enterComp, moveBatch, newBatch, setCurBatch } from '../systems/batches.js';
import { applyLineup, applyRec, debut } from '../systems/debut.js';
import { invBuy, invOpen, invStart, resolveEv } from '../systems/events.js';
import { fireAsst, renewDo, setMentor, songAct, songRelease, toggleHold, viewRenew, viewSong, viewSongs, wPrev, writeSong } from '../systems/ext2.js';
import { dqDo, dqKeep, dqLater, hsApply, hsFire, hsHire, paFire, paHire, paOpen, paRe, viewDebutQ } from '../systems/ext3.js';
import { assignMgr, fireMgr, hireMgr, rehuntMgr, setAuto, setBoss, toggleMA } from '../systems/managers.js';
import { buyBiz, buybackBiz, raiseBiz, sellBiz, upBiz } from '../systems/market.js';
import { acceptOffer, acceptSel, investOffer, ocPick, ocPrev } from '../systems/offers.js';
import { postAuto, postDo, preAuto, preDo } from '../systems/promo.js';
import { cfPick, propAll, propOk, propOkAll, viewProps } from '../systems/proposals.js';
import { doFM, doLive, holdConcert, produceFilm, releaseSingle, viewCamp } from '../systems/releases.js';
import { prGo } from '../systems/review.js';
import { cbCancel, cbNow, cbSched, cbSchedRec, studioPick, viewSec } from '../systems/secretary.js';
import { nextWeek, setPs } from '../systems/week.js';
import { act, campKeyOf } from '../ui/building.js';
import { closeM, view } from '../ui/modal.js';
import { planBack, planFill, planGo, planMgr, planNext, planRec, planSel, planSet, planSkip, setPropNext, startPlanOne } from '../ui/planning.js';
import { RV, openRoom, setSchedTTS } from '../ui/rooms.js';
import { saveCopyCode, saveDownload, saveImportApply, saveImportFile, saveImportText, viewCode } from '../ui/saveView.js';
import { tutEnd, tutGo, tutStart } from '../ui/tutorial.js';
import { setAllD, setRepDay, togD, viewArtist, viewEvents, viewReport, viewReportFull } from '../ui/views.js';

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
