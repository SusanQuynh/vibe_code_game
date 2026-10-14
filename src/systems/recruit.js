import { R, pick } from '../core/rng.js';
import { esc } from '../core/util.js';
import { Lk, money, t, tx } from '../i18n/index.js';
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
export const REC_MAX=2,RESERVES=[0,50,100,200,500],MODES={off:1,suggest:1,auto:1}; // ids only: labels are rec.mode.<id>
export function recEnsure(){if(!S.rec)S.rec={staff:[],cand:[],mode:'off',quota:5,reserve:100e6,sug:[],log:[]};return S.rec}
/* talent-weighted estimate: low eye ranks by visible stats, high eye weighs hidden potential */
export const est=(a,eye)=>stSum(a)*(1+(eye/10)*(a.talent-1)*2);
export const recEye=()=>{const st=(S.rec||REC0).staff;return st.length?Math.max(...st.map(r=>r.eye)):0};
export const recCap=()=>(S.rec||REC0).staff.reduce((t,r)=>t+1+Math.floor(r.eye/4),0);
export const recSal=()=>(S.rec||REC0).staff.reduce((t,r)=>t+r.sal,0);
const recLog=(t,mirror)=>{const r=recEnsure();r.log.unshift(t);if(r.log.length>10)r.log.length=10;if(!mirror)addLog(t)};
export const huntCost=()=>S.rec&&S.rec.hunted?5e6:0;
export function recHunt(){const r=recEnsure(),c=huntCost();if(S.money<c)return toast(t('toast.noMoney'));
  if(c){S.money-=c;book('hr',-c)}r.hunted=1;r.cand=[];
  for(let i=0;i<3;i++){const eye=R(2,9);r.cand.push({id:uid(),name:pick(LNM)+' '+pick(MGN),eye,fee:eye*4e6,sal:2e6+eye*.5e6})}act()}
export function recHire(id){const r=recEnsure(),c=r.cand.find(x=>x.id===id);if(!c)return;if(r.staff.length>=REC_MAX)return toast(t('rec.toast.max',{n:REC_MAX}));if(S.money<c.fee)return toast(t('toast.noMoney'));
  S.money-=c.fee;book('hr',-c.fee);r.cand=r.cand.filter(x=>x!==c);r.staff.push(c);addLog(Lk('log.rec.hire',{n:c.name,e:c.eye}),'good');act()}
export function recFire(id,btn){if(btn&&btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent=t('rec.tapFire');return}
  const r=recEnsure(),c=r.staff.find(x=>x.id===id);if(!c)return;r.staff=r.staff.filter(x=>x!==c);addLog(Lk('log.rec.fire',{n:c.name}));act()}
export function recSet(k,v){const r=recEnsure();
  if(k==='mode'){if(!MODES[v])return;r.mode=v;r.sug=[]}
  else if(k==='quota'){v=Math.round(+v);if(!(v>=1&&v<=12))return;r.quota=v}
  else if(k==='reserve'){v=+v;if(!RESERVES.includes(v))return;r.reserve=v*1e6}
  else return;act()}
export function recSignSug(){const r=S.rec;if(!r||!r.sug.length)return;let n=0;
  for(const id of r.sug){const a=S.pool.find(x=>x.id===id);if(a&&signCore(a))n++}
  r.sug=[];if(n<1)toast(t('rec.toast.signFail'));act()}
/* runs in nextWeek right after weekV2(): pays salaries, then suggests or signs by estimate */
export function recruitTick(){const r=S.rec;if(!r||!r.staff.length)return;
  const sal=recSal();S.money-=sal;book('hr',-sal);
  const eye=recEye(),cap=recCap(),by=r.staff.slice().sort((x,y)=>y.eye-x.eye)[0].name,rank=()=>S.pool.slice().sort((x,y)=>est(y,eye)-est(x,eye));
  if(r.mode==='suggest'){const top=rank().slice(0,cap);r.sug=top.map(a=>a.id);
    recLog(top.length?Lk('log.rec.sug',{r:by,l:top.map(a=>`${a.name} (~${Math.round(est(a,eye))})`).join(', ')}):Lk('log.rec.empty'));return}
  r.sug=[];if(r.mode!=='auto')return;
  const full=()=>{const b=S.batches.find(x=>x.id===S.curBatch);return b&&bMem(b).length>=r.quota},open=()=>{const b=openBatch(true);recLog(Lk('log.rec.open',{r:by,b:b.n,q:r.quota}))};
  let n=0;
  while(n<cap){if(full())open();
    if(!S.pool.length){recLog(Lk('log.rec.empty'));break}
    if(S.money-20e6<r.reserve){recLog(Lk('log.rec.stop',{m:{$:r.reserve}}));break}
    const a=rank()[0],ev=Math.round(est(a,eye));if(!signCore(a,by))break;n++;recLog(Lk('log.rec.sign',{r:by,n:a.name,v:ev}),1)}
  if(full())open()}
export function recHTML(){const r=S.rec||REC0,cap=recCap();
  const sel=(k,opts,cur)=>`<select onchange="recSet('${k}',this.value)">${opts.map(([v,l])=>`<option value="${v}" ${String(v)===String(cur)?'selected':''}>${l}</option>`).join('')}</select>`;
  return`<div class="small muted" style="margin-bottom:6px">${t('rec.help',{n:REC_MAX})}</div>
  ${r.staff.map(c=>`<div class="prow">🧑‍💼 <b>${esc(c.name)}</b> <span class="small muted">${t('rec.eyeStaff',{s:'★'.repeat(Math.ceil(c.eye/2)),e:c.eye,h:1+Math.floor(c.eye/4),w:money(c.sal)})}</span><span class="sp"></span><button class="btn sm warn" onclick="recFire(${c.id},this)">${t('rec.fire')}</button></div>`).join('')||`<div class="small muted">${t('rec.noStaff')}</div>`}
  ${r.staff.length?`<div class="row" style="margin-top:6px"><span class="small">${t('rec.mode')}</span>${sel('mode',Object.keys(MODES).map(k=>[k,t(`rec.mode.${k}`)]),r.mode)}<span class="small">${t('rec.perBatch')}</span>${sel('quota',Array.from({length:12},(_,i)=>[i+1,t('common.trainees',{n:i+1})]),r.quota)}<span class="small">${t('rec.reserve')}</span>${sel('reserve',RESERVES.map(v=>[v,v?money(v*1e6):t('rec.none')]),r.reserve/1e6)}</div>
  <div class="small muted" style="margin-top:4px">${r.mode==='auto'?t('rec.desc.auto',{cap,q:r.quota,m:money(r.reserve)}):r.mode==='suggest'?t('rec.desc.suggest',{cap}):t('rec.desc.off')}</div>`:''}
  ${r.log.length?`<div class="small" style="margin-top:6px">${r.log.slice(0,5).map(x=>`<div>${esc(tx(x))}</div>`).join('')}</div>`:''}
  <h3 style="margin-top:8px">${t('rec.candTitle')}</h3>
  ${r.cand.map(c=>`<div class="prow">🧑‍💼 <b>${esc(c.name)}</b> <span class="small muted">${t('rec.eyeCand',{e:c.eye,w:money(c.sal)})}</span><span class="sp"></span><button class="btn sm pri" onclick="recHire(${c.id})" ${r.staff.length>=REC_MAX?'disabled':''}>${t('rec.hire',{m:money(c.fee)})}</button></div>`).join('')||`<div class="small muted">${t('rec.noCand')}</div>`}
  <button class="btn" onclick="recHunt()" style="margin-top:6px">${t('rec.hunt',{x:huntCost()?money(huntCost()):t('rec.huntFree')})}</button>`}
