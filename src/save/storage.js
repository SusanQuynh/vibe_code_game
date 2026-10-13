import { S, abs, addLog, setState } from '../state.js';
import { ensureLook } from '../systems/artists.js';
import { fixBatch, initBatches } from '../systems/batches.js';
import { genComp } from '../systems/contests.js';
import { migrateV2 } from '../systems/ext2.js';
import { genMgrPool, givePM, legacyDom, migrateDom } from '../systems/managers.js';
import { initWorld } from '../systems/market.js';
import { groupsOf } from '../systems/relations.js';
import { ensureDays } from '../systems/week.js';

/* ================= DATA ================= */
// Two tiers: KEY = compact autosave (every action), KEY_FULL = full backup (every 4 weeks / manual), KEY_META = sizes + times (never inside S).
export const KEY='starlight_idol_save_v1';
export const KEY_FULL=KEY+'_full';
export const KEY_META='starlight_save_meta';
// Report save status to the UI (registered by main.js) so storage never touches the DOM.
let onSaved=()=>{};
export const setSavedHook=fn=>{onSaved=fn};
let loadSrc='compact';
export const lastLoadSource=()=>loadSrc;
export const saveMeta=()=>{try{return JSON.parse(localStorage.getItem(KEY_META))||{}}catch(e){return{}}};
const putMeta=m=>{try{localStorage.setItem(KEY_META,JSON.stringify(m))}catch(e){}};
const isQuota=e=>!!e&&(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'||e.code===22||e.code===1014||/quota/i.test(e.message||''));
const absOf=d=>(d.year-1)*52+d.week;
/* Trimmed COPY of s (never mutates it): only fields that gameplay never reads. lvl 2 = tighter limits for quota pressure */
export function compactOf(s,lvl=1){const t=lvl>1,c={...s},cut=(a,n,m)=>a.slice(0,t?m:n);
  if(Array.isArray(s.log))c.log=cut(s.log,30,10);
  const tr=a=>{const o={...a};if(Array.isArray(a.hist))o.hist=cut(a.hist,12,5);if(Array.isArray(a.lessons))o.lessons=cut(a.lessons,5,2);return o};
  if(Array.isArray(s.artists))c.artists=s.artists.map(tr);
  if(Array.isArray(s.pool))c.pool=s.pool.map(tr);
  if(Array.isArray(s.prHist))c.prHist=cut(s.prHist,10,3);
  if(Array.isArray(s.fin)){const F=s.fin;c.fin=t?F.slice(-12):F.filter((f,i)=>f.y===s.year||i>=F.length-12)}
  if(Array.isArray(s.films))c.films=s.films.filter(f=>!f.done||f.y>=s.year);
  if(Array.isArray(s.concerts)){const last=new Map();s.concerts.forEach((x,i)=>last.set(x.k||x.act,i));c.concerts=s.concerts.filter((x,i)=>x.y>=s.year||last.get(x.k||x.act)===i)}
  if(s.rec&&Array.isArray(s.rec.log))c.rec={...s.rec,log:cut(s.rec.log,5,0)};
  if(t)delete c.gmRep;
  return c}
/* Info about a stored slot: 'c' compact / 'f' full backup. null when the slot is empty */
export function slotInfo(which){const raw=localStorage.getItem(which==='c'?KEY:KEY_FULL);if(!raw)return null;
  const m=saveMeta()[which];if(m&&m.len)return{...m};
  try{const d=JSON.parse(raw);return{y:d.year,w:d.week,abs:absOf(d),len:raw.length}}catch(e){return{len:raw.length}}}
/* Write compact (quota ladder: lvl 1, lvl 2, drop backup + lvl 2), then the full backup when due. onSaved(ok, info) with info ok|lite|noBackup|fail */
export function save(opt={}){const m=saveMeta(),now=Date.now(),a=abs(),y=S.year,w=S.week;let ok=true,lvl=1,len=0,dropped=false,bad=false,wroteFull=false;
  const put=l=>{const cs=JSON.stringify(compactOf(S,l));localStorage.setItem(KEY,cs);lvl=l;len=cs.length};
  try{try{put(1)}catch(e){if(!isQuota(e))throw e;try{put(2)}catch(e2){if(!isQuota(e2))throw e2;localStorage.removeItem(KEY_FULL);dropped=true;put(2)}}}catch(e){ok=false}
  if(ok){m.c={at:now,abs:a,y,w,len,lvl};
    const f=m.f,due=opt.full||!f||a<f.abs||a-(f.try!=null?f.try:f.abs)>=4;
    if(due&&!dropped){try{const fs=JSON.stringify(S);localStorage.setItem(KEY_FULL,fs);m.f={at:now,abs:a,y,w,len:fs.length};wroteFull=true}catch(e){bad=true;m.f={...(f||{}),err:1,try:a,abs:f?f.abs:a}}}
    else if(dropped){bad=true;m.f={...(f||{}),err:1,try:a,abs:f?f.abs:a}}
    m.c.fl=wroteFull?1:0;
    putMeta(m)}
  onSaved(ok,!ok?'fail':lvl>1?(dropped?'noBackup':'lite'):bad?'noBackup':'ok');return ok}
// Overwrite both slots with d, then reload through load() (so migrations run). Returns false if d is invalid.
export function replaceSave(d){if(!d||!Array.isArray(d.artists))return false;try{const t=JSON.stringify(d);localStorage.setItem(KEY,t);try{localStorage.setItem(KEY_FULL,t)}catch(e){localStorage.removeItem(KEY_FULL)}
  {const o={at:Date.now(),abs:absOf(d),y:d.year,w:d.week,len:t.length};putMeta({c:{...o,lvl:1,fl:1},f:{...o}})}}catch(e){return false}
  return load()}
export function restoreBackup(){try{const t=localStorage.getItem(KEY_FULL);return t?replaceSave(JSON.parse(t)):false}catch(e){return false}}
const readSlot=k=>{try{const t=localStorage.getItem(k);if(!t)return null;const d=JSON.parse(t);return d&&d.artists?d:null}catch(e){return null}};
export function load(){try{let d=readSlot(KEY),restored=false;loadSrc='compact';const f=readSlot(KEY_FULL),mc=saveMeta().c;
  // full backup of the same game moment is a strict superset (unless later actions only reached the compact slot)
  if(d&&f&&f.nid===d.nid&&f.year===d.year&&f.week===d.week&&!(mc&&mc.fl===0)){d=f;loadSrc='full'}
  else if(!d&&f){d=f;loadSrc='full';restored=true}
  if(!d)return false;setState(d);
  for(const k of ['groups','offers','films','events','log','singles','concerts','awards','pool'])if(!Array.isArray(S[k]))S[k]=[];
  if(!S.partners)S.partners={};if(!Array.isArray(S.managers)){S.managers=[];genMgrPool();addLog('📋 Văn phòng Quản lý vừa mở ở tầng 6: tuyển quản lý để chia nhau phụ trách nhóm và nghệ sĩ.','gold')}if(!Array.isArray(S.mgrPool))genMgrPool();[...S.artists,...S.pool,...S.managers,...S.mgrPool].forEach(ensureLook);[...S.artists,...S.pool].forEach(ensureDays);S.artists.forEach(a=>{if(a.solo&&groupsOf(a).length&&!a.pm)givePM(a,true)});initWorld();S.managers.forEach(m=>{if(m.ps===true)m.ps=1;else if(m.ps!==1&&m.ps!==0)m.ps=2});if(S.planOn===undefined)S.planOn=true;if(!Array.isArray(S.batches)||!S.batches.length)initBatches();S.artists.forEach(fixBatch);if(!Array.isArray(S.comps)){S.comps=[];genComp();genComp()}if(!Array.isArray(S.compRuns))S.compRuns=[];S.artists.forEach(a=>{if(!a.pg)a.pg={}});legacyDom();migrateV2();migrateDom();if(restored)addLog('🛟 Bản lưu chính bị lỗi, đã khôi phục từ bản sao lưu đầy đủ.','bad');return true}catch(e){console.error(e);return false}}
