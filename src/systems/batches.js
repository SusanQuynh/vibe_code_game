import { esc, fmt, fmtN } from '../core/util.js';
import { TRAIN } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { dHold } from './ext2.js';
import { eligSort } from './ext3.js';
import { doLive, liveEst } from './releases.js';
import { EV_PCT, EV_TTS, stSum } from './review.js';
import { wkLabel } from './secretary.js';
import { defaultDays } from './week.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';
import { det } from '../ui/views.js';

/* ---- Trainee batches ---- */
export function initBatches(){S.bno=1;S.batches=[{id:uid(),n:'Lứa 1',w:abs()}];S.curBatch=S.batches[0].id;S.artists.filter(a=>a.status==='trainee').forEach(a=>a.batch=S.curBatch)}
export const batchOf=a=>(S.batches||[]).find(b=>b.id===a.batch)||null;
export const bMem=b=>S.artists.filter(a=>a.status==='trainee'&&a.batch===b.id);
export function fixBatch(a){if(a.status==='trainee'&&!S.batches.some(b=>b.id===a.batch))a.batch=S.curBatch}
export function newBatch(){const n='Lứa '+(++S.bno),b={id:uid(),n,w:abs()};S.batches.push(b);S.curBatch=b.id;S.ui=S.ui||{};S.ui['lb-b'+b.id]=true;addLog(`🌱 Mở ${n}. Thực tập sinh ký mới sẽ vào lứa này.`,'good');act()}
export function setCurBatch(id){S.curBatch=+id;act()}
export function moveBatch(aid,bid){const a=byId(aid),b=S.batches.find(x=>x.id===+bid);if(a&&b){a.batch=b.id;addLog(`🔀 Chuyển ${a.name} sang ${b.n}.`);act()}}
export function batchSched(bid,v){if(!v)return;S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).forEach(a=>a.days=defaultDays(v));toast('Đã xếp lịch cho cả lứa');act()}
export function batchLive(bid){const ids=S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).map(a=>a.id);if(!ids.length)return toast('Không có ai rảnh');doLive(ids)}
export function batchHTML(){const cur=S.curBatch;
  return`<div class="row" style="margin-bottom:6px"><span class="small">Ký mới vào:</span><select onchange="setCurBatch(this.value)">${S.batches.length?'':'<option>Tự mở lứa mới khi ký</option>'}${S.batches.map(b=>`<option value="${b.id}" ${b.id===cur?'selected':''}>${esc(b.n)}</option>`).join('')}</select><span class="sp"></span><button class="btn sm pri" onclick="newBatch()">+ Mở lứa mới</button></div>
  <div class="small muted" style="margin-bottom:6px">Mỗi lứa có thể xếp lịch tập chung, livestream chung và giao cho một quản lý riêng ở Văn phòng Quản lý. Lứa không còn thực tập sinh sẽ tự xoá.</div>`+
  S.batches.slice().reverse().map(b=>{const ms=bMem(b).sort(eligSort),grad=S.artists.filter(a=>a.batch===b.id&&a.status==='debuted').length;
    const m=S.managers.find(x=>x.as&&x.as.t==='b'&&x.as.id===b.id);
    const pr=ms.filter(a=>a.ev).map(a=>(stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100),ap=pr.length?pr.reduce((x,y)=>x+y,0)/pr.length:0,free=ms.filter(a=>!a.busy);
    const body=`<div class="small muted">Mở ${wkLabel(b.w)} · ${grad} đã debut · 📋 ${m?esc(m.name):'chưa có quản lý'}${pr.length?` · tiến bộ trung bình ${ap.toFixed(1)}% (cần trên ${EV_PCT}%)`:''} · 💗 ${fmtN(ms.reduce((t,a)=>t+a.fans,0))} fan</div>
    ${ms.length?`<div class="row" style="margin:6px 0"><select onchange="batchSched(${b.id},this.value)"><option value="">📅 Lịch tập cả lứa…</option>${Object.keys(TRAIN).map(k=>`<option value="${k}">${TRAIN[k].n}</option>`).join('')}</select><button class="btn sm" onclick="batchLive(${b.id})" ${free.length?'':'disabled'}>📱 Livestream cả lứa (chi 1 tr, thu ~${fmt(liveEst(free))})</button></div>`:''}
    ${ms.map(a=>`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button>${dHold(a)?'<span class="tag s">🎊 sẵn sàng debut</span>':''}${a.mt&&byId(a.mt)?`<span class="tag v">👩‍🏫 ${esc(byId(a.mt).name)}</span>`:''}<span class="small muted">${a.busy?'🚶 '+esc(a.busy.title):'tổng '+Math.round(stSum(a))}${a.ev?' · '+((stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100).toFixed(1)+'%':''} · trượt ${a.ttsFail||0}/${EV_TTS} · 💗${fmtN(a.fans)}</span><span class="sp"></span>${S.batches.length>1?`<select onchange="moveBatch(${a.id},this.value)" aria-label="Chuyển lứa">${S.batches.map(x=>`<option value="${x.id}" ${x.id===b.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select>`:''}</div>`).join('')||'<div class="small muted">Lứa này không còn thực tập sinh.</div>'}`;
    return det('lb-b'+b.id,`${esc(b.n)} (${ms.length} TTS)${b.id===cur?' <span class="tag v">đang tuyển</span>':''}`,body,ms.length>0)}).join('')}
