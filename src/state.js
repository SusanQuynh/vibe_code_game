import { genArtist, genPool } from './systems/artists.js';
import { Lk, t } from './i18n/index.js';
import { genComp } from './systems/contests.js';
import { initBatches } from './systems/batches.js';
import { genMgrPool } from './systems/managers.js';
import { initWorld } from './systems/market.js';
import { genOffers } from './systems/offers.js';
import { defaultDays } from './systems/week.js';
import { act } from './ui/building.js';
import { closeM } from './ui/modal.js';
import { markFresh } from './save/storage.js';

/* ================= STATE ================= */
export let S;
export const abs=()=>(S.year-1)*52+S.week;
export const uid=()=>S.nid++;
export const byId=id=>S.artists.find(a=>a.id===id);
// t: Txt (Msg, tag or a legacy/proper-noun string)
export function addLog(t,c=''){S.log.unshift({t,c,w:`N${S.year}·T${S.week}`});if(S.log.length>80)S.log.length=80}
export function newGame(){
  markFresh();
  S={v:1,year:1,week:1,money:600e6,nid:1,planOn:true,managers:[],mgrPool:[],artists:[],groups:[],offers:[],films:[],events:[],log:[],partners:{},singles:[],concerts:[],awards:[],pool:[]};
  S.assts=[];S.songs=[];S.fin=[];
  genPool(4);genMgrPool();
  for(let i=0;i<2;i++){const a=genArtist();S.artists.push(a)}
  S.artists[1].days=defaultDays('dance');
  initBatches();S.comps=[];S.compRuns=[];genComp();genComp();
  genOffers(3);genOffers(2,1);initWorld();
  addLog(Lk('log.st.welcome'),'gold');
  addLog(Lk('log.st.tip'));
}
export function resetGame(btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent=t('btn.tapAgainReset');return}newGame();closeM();act()}
export const setState=v=>{S=v};
