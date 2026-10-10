import { S, addLog, setState } from '../state.js';
import { ensureLook } from '../systems/artists.js';
import { fixBatch, genComp, initBatches } from '../systems/batches.js';
import { migrateV2 } from '../systems/ext2.js';
import { genMgrPool, givePM } from '../systems/managers.js';
import { initWorld } from '../systems/market.js';
import { groupsOf } from '../systems/relations.js';
import { ensureDays } from '../systems/week.js';

/* ================= DATA ================= */
export const KEY='starlight_idol_save_v1';
// Báo trạng thái lưu cho UI (main.js đăng ký) để storage không phải chạm DOM.
let onSaved=()=>{};
export const setSavedHook=fn=>{onSaved=fn};
export function save(){let ok=true;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){ok=false}onSaved(ok);return ok}
// Ghi đè save bằng d rồi nạp lại qua đúng đường load() (để chạy migration). Trả false nếu d không hợp lệ.
export function replaceSave(d){localStorage.setItem(KEY,JSON.stringify(d));return load()}
export function load(){try{const t=localStorage.getItem(KEY);if(!t)return false;const d=JSON.parse(t);if(!d||!d.artists)return false;setState(d);
  for(const k of ['groups','offers','films','events','log','singles','concerts','awards','pool'])if(!Array.isArray(S[k]))S[k]=[];
  if(!S.partners)S.partners={};if(!Array.isArray(S.managers)){S.managers=[];genMgrPool();addLog('📋 Văn phòng Quản lý vừa mở ở tầng 6: tuyển quản lý để chia nhau phụ trách nhóm và nghệ sĩ.','gold')}if(!Array.isArray(S.mgrPool))genMgrPool();[...S.artists,...S.pool,...S.managers,...S.mgrPool].forEach(ensureLook);[...S.artists,...S.pool].forEach(ensureDays);S.artists.forEach(a=>{if(a.solo&&groupsOf(a).length&&!a.pm)givePM(a,true)});initWorld();S.managers.forEach(m=>{if(m.ps===true)m.ps=1;else if(m.ps!==1&&m.ps!==0)m.ps=2});if(S.planOn===undefined)S.planOn=true;if(!Array.isArray(S.batches)||!S.batches.length)initBatches();S.artists.forEach(fixBatch);if(!Array.isArray(S.comps)){S.comps=[];genComp();genComp()}if(!Array.isArray(S.compRuns))S.compRuns=[];migrateV2();return true}catch(e){console.error(e);return false}}
