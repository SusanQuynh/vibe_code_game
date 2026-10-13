import { R, pick } from '../core/rng.js';
import { esc, fmt } from '../core/util.js';
import { LNM, MGN } from '../data/names.js';
import { S, addLog, uid } from '../state.js';
import { signCore } from './artists.js';
import { bMem, openBatch } from './batches.js';
import { book } from './ext2.js';
import { stSum } from './review.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

/* Recruitment staff: lazy state S.rec (created only by player handlers); weekly tick is RNG-free */
export const REC0={staff:[],cand:[],mode:'off',quota:5,reserve:100e6,sug:[],log:[]};
export const REC_MAX=2,RESERVES=[0,50,100,200,500],MODES={off:'Tắt',suggest:'Đề xuất',auto:'Tự ký'};
export function recEnsure(){if(!S.rec)S.rec={staff:[],cand:[],mode:'off',quota:5,reserve:100e6,sug:[],log:[]};return S.rec}
/* talent-weighted estimate: low eye ranks by visible stats, high eye weighs hidden potential */
export const est=(a,eye)=>stSum(a)*(1+(eye/10)*(a.talent-1)*2);
export const recEye=()=>{const st=(S.rec||REC0).staff;return st.length?Math.max(...st.map(r=>r.eye)):0};
export const recCap=()=>(S.rec||REC0).staff.reduce((t,r)=>t+1+Math.floor(r.eye/4),0);
export const recSal=()=>(S.rec||REC0).staff.reduce((t,r)=>t+r.sal,0);
const recLog=(t,mirror)=>{const r=recEnsure();r.log.unshift(t);if(r.log.length>10)r.log.length=10;if(!mirror)addLog(t)};
export const huntCost=()=>S.rec&&S.rec.hunted?5e6:0;
export function recHunt(){const r=recEnsure(),c=huntCost();if(S.money<c)return toast('Không đủ tiền');
  if(c){S.money-=c;book('hr',-c)}r.hunted=1;r.cand=[];
  for(let i=0;i<3;i++){const eye=R(2,9);r.cand.push({id:uid(),name:pick(LNM)+' '+pick(MGN),eye,fee:eye*4e6,sal:2e6+eye*.5e6})}act()}
export function recHire(id){const r=recEnsure(),c=r.cand.find(x=>x.id===id);if(!c)return;if(r.staff.length>=REC_MAX)return toast(`Tối đa ${REC_MAX} nhân viên tuyển dụng`);if(S.money<c.fee)return toast('Không đủ tiền');
  S.money-=c.fee;book('hr',-c.fee);r.cand=r.cand.filter(x=>x!==c);r.staff.push(c);addLog(`🧑‍💼 Tuyển nhân viên tuyển dụng ${c.name} (mắt nhìn ${c.eye}/10).`,'good');act()}
export function recFire(id,btn){if(btn&&btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent='Chạm lần nữa để cho nghỉ';return}
  const r=recEnsure(),c=r.staff.find(x=>x.id===id);if(!c)return;r.staff=r.staff.filter(x=>x!==c);addLog(`👋 Cho nghỉ nhân viên tuyển dụng ${c.name}.`);act()}
export function recSet(k,v){const r=recEnsure();
  if(k==='mode'){if(!MODES[v])return;r.mode=v;r.sug=[]}
  else if(k==='quota'){v=Math.round(+v);if(!(v>=1&&v<=12))return;r.quota=v}
  else if(k==='reserve'){v=+v;if(!RESERVES.includes(v))return;r.reserve=v*1e6}
  else return;act()}
export function recSignSug(){const r=S.rec;if(!r||!r.sug.length)return;let n=0;
  for(const id of r.sug){const a=S.pool.find(x=>x.id===id);if(a&&signCore(a))n++}
  r.sug=[];if(n<1)toast('Không đủ tiền hoặc hồ sơ đã hết');act()}
/* runs in nextWeek right after weekV2(): pays salaries, then suggests or signs by estimate */
export function recruitTick(){const r=S.rec;if(!r||!r.staff.length)return;
  const sal=recSal();S.money-=sal;book('hr',-sal);
  const eye=recEye(),cap=recCap(),by=r.staff.slice().sort((x,y)=>y.eye-x.eye)[0].name,rank=()=>S.pool.slice().sort((x,y)=>est(y,eye)-est(x,eye));
  if(r.mode==='suggest'){const top=rank().slice(0,cap);r.sug=top.map(a=>a.id);
    recLog(top.length?`🧑‍💼 NV tuyển dụng ${by} đề xuất: ${top.map(a=>`${a.name} (~${Math.round(est(a,eye))})`).join(', ')}.`:'🧑‍💼 NV tuyển dụng: danh sách casting đang trống.');return}
  r.sug=[];if(r.mode!=='auto')return;
  const full=()=>{const b=S.batches.find(x=>x.id===S.curBatch);return b&&bMem(b).length>=r.quota},open=()=>{const b=openBatch(true);recLog(`🧑‍💼 NV tuyển dụng ${by} mở ${b.n} (lứa trước đủ ${r.quota} TTS).`)};
  let n=0;
  while(n<cap){if(full())open();
    if(!S.pool.length){recLog('🧑‍💼 NV tuyển dụng: danh sách casting đang trống.');break}
    if(S.money-20e6<r.reserve){recLog(`🧑‍💼 NV tuyển dụng dừng ký vì tiền gần chạm mức dự trữ ${fmt(r.reserve)}.`);break}
    const a=rank()[0],ev=Math.round(est(a,eye));if(!signCore(a,by))break;n++;recLog(`🧑‍💼 NV tuyển dụng ${by} ký ${a.name} (ước tính ${ev}).`,1)}
  if(full())open()}
export function recHTML(){const r=S.rec||REC0,cap=recCap();
  const sel=(k,opts,cur)=>`<select onchange="recSet('${k}',this.value)">${opts.map(([v,l])=>`<option value="${v}" ${String(v)===String(cur)?'selected':''}>${l}</option>`).join('')}</select>`;
  return`<div class="small muted" style="margin-bottom:6px">Nhân viên tuyển dụng tự xem hồ sơ casting. Mắt nhìn càng cao càng đoán đúng tố chất ẩn; cứ 4 điểm mắt nhìn thêm 1 hồ sơ mỗi tuần. Tối đa ${REC_MAX} người, lương trả hằng tuần.</div>
  ${r.staff.map(c=>`<div class="prow">🧑‍💼 <b>${esc(c.name)}</b> <span class="small muted">mắt nhìn ${'★'.repeat(Math.ceil(c.eye/2))} ${c.eye}/10 · ${1+Math.floor(c.eye/4)} hồ sơ/tuần · lương ${fmt(c.sal)}/tuần</span><span class="sp"></span><button class="btn sm warn" onclick="recFire(${c.id},this)">Cho nghỉ</button></div>`).join('')||'<div class="small muted">Chưa có nhân viên tuyển dụng.</div>'}
  ${r.staff.length?`<div class="row" style="margin-top:6px"><span class="small">Chế độ:</span>${sel('mode',Object.entries(MODES),r.mode)}<span class="small">Mỗi lứa:</span>${sel('quota',Array.from({length:12},(_,i)=>[i+1,(i+1)+' TTS']),r.quota)}<span class="small">Dự trữ:</span>${sel('reserve',RESERVES.map(v=>[v,v?v+' tr':'Không']),r.reserve/1e6)}</div>
  <div class="small muted" style="margin-top:4px">${r.mode==='auto'?`Tự ký tối đa ${cap} hồ sơ/tuần, đầy ${r.quota} TTS thì mở lứa mới, luôn giữ tối thiểu ${fmt(r.reserve)}.`:r.mode==='suggest'?`Mỗi tuần đề xuất ${cap} hồ sơ tốt nhất, bạn bấm ký ở danh sách casting.`:'Đang tắt: chỉ trả lương.'}</div>`:''}
  ${r.log.length?`<div class="small" style="margin-top:6px">${r.log.slice(0,5).map(t=>`<div>${esc(t)}</div>`).join('')}</div>`:''}
  <h3 style="margin-top:8px">Ứng viên tuyển dụng</h3>
  ${r.cand.map(c=>`<div class="prow">🧑‍💼 <b>${esc(c.name)}</b> <span class="small muted">mắt nhìn ${c.eye}/10 · lương ${fmt(c.sal)}/tuần</span><span class="sp"></span><button class="btn sm pri" onclick="recHire(${c.id})" ${r.staff.length>=REC_MAX?'disabled':''}>Tuyển (${fmt(c.fee)})</button></div>`).join('')||'<div class="small muted">Chưa có ứng viên.</div>'}
  <button class="btn" onclick="recHunt()" style="margin-top:6px">🔍 Tìm ứng viên (${huntCost()?fmt(huntCost()):'miễn phí lần đầu'})</button>`}
