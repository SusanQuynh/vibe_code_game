import { $, clamp, esc, fmt, fmtN } from '../../core/util.js';
import { STATS, TRAIN } from '../../data/rules.js';
import { S, abs, addLog, byId, uid } from '../../state.js';
import { fit } from '../../systems/artists.js';
import { bMem, batchOf, compOdds } from '../../systems/batches.js';
import { dHold } from '../../systems/ext2.js';
import { eligSort } from '../../systems/ext3.js';
import { cbHold } from '../../systems/offers.js';
import { liveEst } from '../../systems/releases.js';
import { EV_PCT, EV_TTS, stSum } from '../../systems/review.js';
import { wkLabel } from '../../systems/secretary.js';
import { act } from '../building.js';
import { toast } from '../modal.js';
import { det } from '../views.js';

export function enterComp(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const ids=compSel(cid),ms=ids.map(byId).filter(a=>a&&a.status==='trainee'&&!a.busy);
  {const h=ms.find(dHold);if(h)return toast(`${h.name} đang chừa lịch debut`)}
  {const h=ms.find(a=>{const p=cbHold(a);return p&&abs()+c.wk>p.w});if(h)return toast(`${h.name} đang chừa lịch comeback ${wkLabel(cbHold(h).w)}`)}
  if(ms.length<c.t[0]||ms.length>c.t[1])return toast(`Cần ${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} thực tập sinh`);
  if(S.money<c.fee)return toast('Không đủ tiền lệ phí');S.money-=c.fee;
  const run={id:uid(),c,ids:ms.map(a=>a.id),res:null};S.compRuns=S.compRuns||[];S.compRuns.push(run);
  ms.forEach(a=>a.busy={kind:'comp',title:'Cuộc thi «'+c.n+'»',left:c.wk,total:c.wk,run:run.id});
  S.comps=S.comps.filter(x=>x!==c);addLog(`🏅 ${ms.map(a=>a.name).join(', ')} lên đường dự thi «${c.n}» (${c.wk} tuần, lệ phí ${fmt(c.fee)}).`,'good');act()}
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
export function compSel(cid){return[...document.querySelectorAll('.cp'+cid+':checked')].map(x=>+x.value)}
export function compPrev(cid){const c=S.comps.find(x=>x.id===cid),el=$('#cpo'+cid);if(!c||!el)return;const ids=compSel(cid);
  el.textContent=ids.length?`Đã chọn ${ids.length} người · cơ hội vào top 3 khoảng ${compOdds(c,ids)}%`:`Chọn ${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} thực tập sinh`}
export function compPick(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const n=c.t[1]>1?clamp(3,c.t[0],c.t[1]):1;
  const L=S.artists.filter(a=>a.status==='trainee'&&!a.busy).sort((x,y)=>fit(y,c.w)-fit(x,c.w)).slice(0,n).map(a=>a.id);
  document.querySelectorAll('.cp'+cid).forEach(x=>x.checked=L.includes(+x.value));compPrev(cid)}
export function compHTML(){const free=S.artists.filter(a=>a.status==='trainee'&&!a.busy),going=S.artists.filter(a=>a.busy&&a.busy.kind==='comp');
  return`<div class="small muted" style="margin-bottom:6px">Chỉ thực tập sinh được dự thi. Top 3 nhận tiền thưởng, ai cũng có thêm fan và bài học theo kỹ năng thi. ${going.length?`Đang thi: <b>${going.map(a=>esc(a.name)).join(', ')}</b>.`:''}</div>`+
  (S.comps.map(c=>{const team=c.t[1]===1?'Thi cá nhân':c.t[0]===c.t[1]?`Đội ${c.t[0]} người`:`Đội ${c.t[0]}–${c.t[1]} người`,L=free.slice().sort((x,y)=>fit(y,c.w)-fit(x,c.w)),multi=c.t[1]>1;
    const list=x=>x.map(a=>{const bt=batchOf(a);return`<label><input type="${multi?'checkbox':'radio'}" name="cp${c.id}" class="cp${c.id}" value="${a.id}" onchange="compPrev(${c.id})"> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">${bt&&S.batches.length>1?esc(bt.n)+' · ':''}điểm kỹ năng ${Math.round(fit(a,c.w))}</span></span></label>`}).join('');
    return`<div class="card"><div class="row"><b>${c.ic} ${esc(c.n)}</b><span class="sp"></span><span class="small muted">hạn đăng ký ${c.exp-abs()} tuần</span></div>
    <div class="small">${team} · ${c.wk} tuần · lệ phí ${fmt(c.fee)} · đối thủ khoảng ${c.lvl} điểm<br>🥇 ${fmt(c.prize[0])} · 🥈 ${fmt(c.prize[1])} · 🥉 ${fmt(c.prize[2])}</div>
    <div class="req">Chấm điểm: ${Object.keys(c.w).map(k=>STATS[k]).join(', ')}</div>
    ${L.length?det('cp-l'+c.id,`Chọn thực tập sinh (${L.length} người rảnh)`,`<div class="list">${list(L)}</div>`,true)+`<div class="row" style="margin-top:6px"><span class="small muted" id="cpo${c.id}" style="flex:1">Chọn ${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} thực tập sinh</span><button class="btn sm" onclick="compPick(${c.id})">💡 Gợi ý</button><button class="btn sm pri" onclick="enterComp(${c.id})">Đăng ký</button></div>`:'<div class="small muted">Không có thực tập sinh rảnh.</div>'}</div>`}).join('')||'<div class="small muted">Chưa có cuộc thi nào mở đăng ký. Sang tuần mới để xem thêm.</div>')}
