import { Lk } from '../i18n/index.js';
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
let fresh=false,gidN=0;
const newGid=()=>Date.now().toString(36)+(++gidN);   // lineage id lives in meta only (no RNG, not in S)
export const markFresh=()=>{fresh=true};            // newGame(): the existing backup now belongs to the previous game
let saveErr='';
export const lastSaveError=()=>saveErr;
/* Trimmed COPY of s (never mutates it): only fields that gameplay never reads. lvl 2 = tighter limits for quota pressure.
   Level 1 keeps a.hist/a.lessons (already capped by gameplay); load() rehydrates trimmed tails from the backup. */
export function compactOf(s,lvl=1){const t=lvl>1,c={...s},cut=(a,n,m)=>a.slice(0,t?m:n);
  if(Array.isArray(s.log))c.log=cut(s.log,30,10);
  const tr=a=>{if(!t)return a;const o={...a};if(Array.isArray(a.hist))o.hist=a.hist.slice(0,5);if(Array.isArray(a.lessons))o.lessons=a.lessons.slice(0,2);return o};
  if(Array.isArray(s.artists))c.artists=s.artists.map(tr);
  if(Array.isArray(s.pool))c.pool=s.pool.map(tr);
  if(Array.isArray(s.prHist))c.prHist=cut(s.prHist,10,3);
  if(Array.isArray(s.fin)){const F=s.fin;c.fin=t?F.slice(-12):F.filter((f,i)=>f.y===s.year||i>=F.length-12)}
  if(Array.isArray(s.films))c.films=s.films.filter(f=>!f.done||f.y>=s.year);
  if(Array.isArray(s.concerts)){const last=new Map();s.concerts.forEach((x,i)=>last.set(x.k||x.act,i));c.concerts=s.concerts.filter((x,i)=>x.y>=s.year||last.get(x.k||x.act)===i)}
  if(s.rec&&Array.isArray(s.rec.log))c.rec={...s.rec,log:cut(s.rec.log,5,0)};
  if(t)delete c.gmRep;
  return c}
/* SL2 short code payload: compactOf(s,2) minus history and lists the game rebuilds (see regenAfterShort). Pure; keeps every offer something still points at. */
export function shortOf(s){const c=compactOf(s,2);c.__short=1;
  c.log=[];c.fin=[];c.prHist=[];delete c.lastRep;delete c.lastEval;delete c.hsC;
  if(c.rec&&typeof c.rec==='object')c.rec={...c.rec,log:[],sug:[]};
  const wipe=a=>({...a,hist:[],lessons:[]});
  if(Array.isArray(c.artists))c.artists=c.artists.map(wipe);
  c.pool=[];c.mgrPool=[];c.comps=[];
  if(Array.isArray(s.offers)){const ref=new Set();   // offer ids read elsewhere: pending events (mtjob.of), films (offerId), this week's proposals, busy copies
    for(const e of s.events||[])if(e&&e.of!=null)ref.add(e.of);
    for(const f of s.films||[])if(f&&f.offerId!=null)ref.add(f.offerId);
    if(s.props&&s.props.m)for(const k in s.props.m)for(const x of s.props.m[k].p||[])ref.add(x.of);
    for(const a of s.artists||[])if(a.busy&&a.busy.offerId!=null)ref.add(a.busy.offerId);
    c.offers=s.offers.filter(o=>o.invested||ref.has(o.id))}
  return c}
/* Put back what compactOf trimmed, from the backup of the same game (so the next full backup keeps full history) */
const kj=x=>JSON.stringify(x);
function nf(a,b,cap){const ks=new Set((a||[]).map(kj));return(a||[]).concat((b||[]).filter(x=>!ks.has(kj(x)))).slice(0,cap)}   // newest-first lists
function un(a,b,cap){const ks=new Set((a||[]).map(kj));return(b||[]).filter(x=>!ks.has(kj(x))).concat(a||[]).slice(-cap)}            // chronological lists
export function rehydrate(d,f){
  if(Array.isArray(d.log)&&Array.isArray(f.log))d.log=nf(d.log,f.log,80);
  if(Array.isArray(d.prHist)&&Array.isArray(f.prHist))d.prHist=nf(d.prHist,f.prHist,40);
  if(Array.isArray(d.fin)&&Array.isArray(f.fin)){const ws=new Set(d.fin.map(x=>x.w));d.fin=f.fin.filter(x=>!ws.has(x.w)).concat(d.fin).sort((x,y)=>x.w-y.w).slice(-104)}
  if(Array.isArray(d.films)&&Array.isArray(f.films)){const ids=new Set(d.films.map(x=>x.id));d.films=f.films.filter(x=>!ids.has(x.id)&&x.done).concat(d.films)}
  if(Array.isArray(d.concerts)&&Array.isArray(f.concerts))d.concerts=un(d.concerts,f.concerts,60);
  for(const k of ['artists','pool']){if(!Array.isArray(d[k])||!Array.isArray(f[k]))continue;const fm=new Map(f[k].map(a=>[a.id,a]));
    for(const a of d[k]){const o=fm.get(a.id);if(!o)continue;if(Array.isArray(a.hist)&&Array.isArray(o.hist))a.hist=nf(a.hist,o.hist,30);if(Array.isArray(a.lessons)&&Array.isArray(o.lessons))a.lessons=nf(a.lessons,o.lessons,12)}}}
/* Info about a stored slot: 'c' compact / 'f' full backup. null when the slot is empty */
export function slotInfo(which){const raw=localStorage.getItem(which==='c'?KEY:KEY_FULL);if(!raw)return null;
  const m=saveMeta()[which];if(m&&m.len)return{...m};
  try{const d=JSON.parse(raw);return{y:d.year,w:d.week,abs:absOf(d),len:raw.length}}catch(e){return{len:raw.length}}}
/* Write compact (quota ladder: lvl 1, lvl 2, drop backup + lvl 2), then the full backup when due. onSaved(ok, info) with info ok|lite|noBackup|fail */
export function save(opt={}){const m=saveMeta(),now=Date.now(),a=abs(),y=S.year,w=S.week;let ok=true,lvl=1,len=0,dropped=false,bad=false,wroteFull=false;
  if(fresh){fresh=false;m.gid=newGid();if(m.f)m.f.prev=1}   // new game: keep the old backup (labelled) until the first regular interval
  if(!m.gid)m.gid=newGid();
  if(m.c&&m.c.fl!==0){m.c.fl=0;putMeta(m)}                    // fail-safe: if the meta write after the compact write fails, load() will not prefer an older backup
  const put=l=>{const cs=JSON.stringify(compactOf(S,l));localStorage.setItem(KEY,cs);lvl=l;len=cs.length};
  try{try{put(1)}catch(e){if(!isQuota(e))throw e;try{put(2)}catch(e2){if(!isQuota(e2))throw e2;localStorage.removeItem(KEY_FULL);dropped=true;put(2)}}}catch(e){ok=false}
  if(ok){m.c={at:now,abs:a,y,w,len,lvl,gid:m.gid,fl:0};
    const f=m.f,base=f?(f.try!=null?f.try:f.prev?1:f.abs):0,due=opt.full||!f||(!f.prev&&a<f.abs)||a-base>=4;
    if(due&&!dropped){try{const fs=JSON.stringify(S);localStorage.setItem(KEY_FULL,fs);m.f={at:now,abs:a,y,w,len:fs.length,gid:m.gid};wroteFull=true}catch(e){bad=true;m.f={...(f||{}),err:1,try:a,abs:f?f.abs:a}}}
    else if(dropped){bad=true;m.f={...(f||{}),err:1,try:a,abs:f?f.abs:a}}
    m.c.fl=wroteFull?1:0;
    putMeta(m)}
  onSaved(ok,!ok?'fail':lvl>1?(dropped?'noBackup':'lite'):bad?'noBackup':'ok');return ok}
// Overwrite both slots with d (compact main copy, quota-safe), then reload through load() (so migrations run). Returns false if d is invalid or storage is full (see lastSaveError).
export function replaceSave(d){saveErr='';if(!d||!Array.isArray(d.artists)){saveErr='invalid';return false}
  try{const t=JSON.stringify(d),put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){if(!isQuota(e))throw e;localStorage.removeItem(k);localStorage.setItem(k,v)}};
    let ct=JSON.stringify(compactOf(d,1));
    try{put(KEY,ct)}catch(e){if(!isQuota(e))throw e;ct=JSON.stringify(compactOf(d,2));localStorage.removeItem(KEY_FULL);put(KEY,ct)}
    let hasFull=localStorage.getItem(KEY_FULL)===t;
    if(!hasFull)try{put(KEY_FULL,t);hasFull=true}catch(e){if(!isQuota(e))throw e;localStorage.removeItem(KEY_FULL)}
    const o={at:Date.now(),abs:absOf(d),y:d.year,w:d.week},g=newGid();putMeta(hasFull?{gid:g,c:{...o,len:ct.length,lvl:1,fl:1,gid:g},f:{...o,len:t.length,gid:g}}:{gid:g,c:{...o,len:ct.length,lvl:1,fl:0,gid:g}})}
  catch(e){saveErr=isQuota(e)?'quota':'invalid';return false}
  return load()}
export function restoreBackup(){try{const t=localStorage.getItem(KEY_FULL);return t?replaceSave(JSON.parse(t)):false}catch(e){return false}}
const readSlot=k=>{try{const t=localStorage.getItem(k);if(!t)return null;const d=JSON.parse(t);return d&&d.artists?d:null}catch(e){return null}};
export function load(){try{return loadImpl(false)}catch(e){console.error(e);
  if(readSlot(KEY_FULL)){try{return loadImpl(true)}catch(e2){console.error(e2)}}return false}}
function loadImpl(onlyFull){let d=onlyFull?null:readSlot(KEY),restored=false;loadSrc='compact';const f=readSlot(KEY_FULL),mt=saveMeta(),mc=mt.c,mf=mt.f;
  // full backup of the same game moment is a strict superset (unless later actions only reached the compact slot)
  if(d&&f&&f.nid===d.nid&&f.year===d.year&&f.week===d.week&&!(mc&&mc.fl===0)){d=f;loadSrc='full'}
  else if(!d&&f){d=f;loadSrc='full';restored=true}
  else if(d&&f&&(!mc||!mf||mc.gid===mf.gid)&&f.nid<=d.nid&&absOf(f)<=absOf(d))rehydrate(d,f);
  if(!d)return false;fresh=false;setState(d);
  for(const k of ['groups','offers','films','events','log','singles','concerts','awards','pool'])if(!Array.isArray(S[k]))S[k]=[];
  if(!S.partners)S.partners={};if(!Array.isArray(S.managers)){S.managers=[];genMgrPool();addLog(Lk('log.st.office'),'gold')}if(!Array.isArray(S.mgrPool))genMgrPool();[...S.artists,...S.pool,...S.managers,...S.mgrPool].forEach(ensureLook);[...S.artists,...S.pool].forEach(ensureDays);S.artists.forEach(a=>{if(a.solo&&groupsOf(a).length&&!a.pm)givePM(a,true)});initWorld();S.managers.forEach(m=>{if(m.ps===true)m.ps=1;else if(m.ps!==1&&m.ps!==0)m.ps=2});if(S.planOn===undefined)S.planOn=true;if(!Array.isArray(S.batches)||!S.batches.length)initBatches();S.artists.forEach(fixBatch);if(!Array.isArray(S.comps)){S.comps=[];genComp();genComp()}if(!Array.isArray(S.compRuns))S.compRuns=[];S.artists.forEach(a=>{if(!a.pg)a.pg={}});legacyDom();migrateV2();migrateDom();if(restored)addLog(Lk('log.st.restore'),'bad');return true}
