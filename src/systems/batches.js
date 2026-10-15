import { esc, fmtN } from '../core/util.js';
import { Lk, money, t, tx } from '../i18n/index.js';
import { trainName } from '../i18n/labels.js';
import { TRAIN } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { dHold } from './ext2.js';
import { eligSort, mNameH } from './ext3.js';
import { doLive, liveEst } from './releases.js';
import { EV_PCT, EV_TTS, stSum } from './review.js';
import { wkLabel } from './secretary.js';
import { defaultDays } from './week.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';
import { det } from '../ui/views.js';

/* ---- Trainee batches ---- */
export function initBatches(){S.bno=1;S.batches=[{id:uid(),n:Lk('batch.n',{i:1}),w:abs()}];S.curBatch=S.batches[0].id;S.artists.filter(a=>a.status==='trainee').forEach(a=>a.batch=S.curBatch)}
export const batchOf=a=>(S.batches||[]).find(b=>b.id===a.batch)||null;
export const bMem=b=>S.artists.filter(a=>a.status==='trainee'&&a.batch===b.id);
export function fixBatch(a){if(a.status==='trainee'&&!S.batches.some(b=>b.id===a.batch))a.batch=S.curBatch}
export function openBatch(quiet){const n=Lk('batch.n',{i:++S.bno}),b={id:uid(),n,w:abs()};S.batches.push(b);S.curBatch=b.id;S.ui=S.ui||{};S.ui['lb-b'+b.id]=true;if(!quiet)addLog(Lk('log.bat.open',{b:n}),'good');return b}
export function newBatch(){openBatch();act()}
export function setCurBatch(id){S.curBatch=+id;act()}
export function moveBatch(aid,bid){const a=byId(aid),b=S.batches.find(x=>x.id===+bid);if(a&&b){a.batch=b.id;addLog(Lk('log.bat.move',{n:a.name,b:b.n}));act()}}
export function batchSched(bid,v){if(!v)return;S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).forEach(a=>a.days=defaultDays(v));toast(t('batch.toast.sched'));act()}
export function batchLive(bid){const ids=S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).map(a=>a.id);if(!ids.length)return toast(t('batch.toast.noneFree'));doLive(ids)}
export function batchHTML(){const cur=S.curBatch;
  return`<div class="row" style="margin-bottom:6px"><span class="small">${t('batch.signInto')}</span><select onchange="setCurBatch(this.value)">${S.batches.length?'':`<option>${t('batch.autoOpen')}</option>`}${S.batches.map(b=>`<option value="${b.id}" ${b.id===cur?'selected':''}>${esc(tx(b.n))}</option>`).join('')}</select><span class="sp"></span><button class="btn sm pri" onclick="newBatch()">${t('batch.new')}</button></div>
  <div class="small muted" style="margin-bottom:6px">${t('batch.help')}</div>`+
  S.batches.slice().reverse().map(b=>{const ms=bMem(b).sort(eligSort),grad=S.artists.filter(a=>a.batch===b.id&&a.status==='debuted').length;
    const m=S.managers.find(x=>x.as&&x.as.t==='b'&&x.as.id===b.id);
    const pr=ms.filter(a=>a.ev).map(a=>(stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100),ap=pr.length?pr.reduce((x,y)=>x+y,0)/pr.length:0,free=ms.filter(a=>!a.busy);
    const body=`<div class="small muted">${t('batch.opened',{w:wkLabel(b.w)})} · ${t('batch.debuted',{n:grad})} · 📋 ${m?mNameH(m):t('batch.noMgr')}${pr.length?` · ${t('batch.avg',{p:ap.toFixed(1),n:EV_PCT})}`:''} · 💗 ${t('common.fanN',{n:fmtN(ms.reduce((s,a)=>s+a.fans,0))})}</div>
    ${ms.length?`<div class="row" style="margin:6px 0"><select onchange="batchSched(${b.id},this.value)"><option value="">${t('batch.sched')}</option>${Object.keys(TRAIN).map(k=>`<option value="${k}">${trainName(k)}</option>`).join('')}</select><button class="btn sm" onclick="batchLive(${b.id})" ${free.length?'':'disabled'}>${t('batch.live',{c:money(1e6),r:money(liveEst(free))})}</button></div>`:''}
    ${ms.map(a=>`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button>${dHold(a)?`<span class="tag s">${t('batch.ready')}</span>`:''}${a.mt&&byId(a.mt)?`<span class="tag v">👩‍🏫 ${esc(byId(a.mt).name)}</span>`:''}<span class="small muted">${a.busy?'🚶 '+esc(tx(a.busy.title)):t('batch.total',{n:Math.round(stSum(a))})}${a.ev?' · '+((stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100).toFixed(1)+'%':''} · ${t('batch.fails',{a:a.ttsFail||0,b:EV_TTS})} · 💗${fmtN(a.fans)}</span><span class="sp"></span>${S.batches.length>1?`<select onchange="moveBatch(${a.id},this.value)" aria-label="${t('batch.moveAria')}">${S.batches.map(x=>`<option value="${x.id}" ${x.id===b.id?'selected':''}>${esc(tx(x.n))}</option>`).join('')}</select>`:''}</div>`).join('')||`<div class="small muted">${t('batch.empty')}</div>`}`;
    return det('lb-b'+b.id,`${esc(tx(b.n))} (${t('common.trainees',{n:ms.length})})${b.id===cur?` <span class="tag v">${t('batch.current')}</span>`:''}`,body,ms.length>0)}).join('')}
