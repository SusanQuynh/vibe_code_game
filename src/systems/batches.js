import { R, pick, rnd } from '../core/rng.js';
import { lbl, money, t } from '../i18n/index.js';
import { $, clamp, esc, fmt, fmtN } from '../core/util.js';
import { TRAIN } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fit } from './artists.js';
import { dHold } from './ext2.js';
import { eligSort } from './ext3.js';
import { mgrExp, mgrOf } from './managers.js';
import { cbHold, chem } from './offers.js';
import { doLive, liveEst } from './releases.js';
import { EV_PCT, EV_TTS, stSum } from './review.js';
import { wkLabelT } from './secretary.js';
import { applyLesson, defaultDays } from './week.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';
import { det } from '../ui/views.js';

/* ---- Lứa thực tập sinh ---- */
export function initBatches(){S.bno=1;S.batches=[{id:uid(),n:'Lứa 1',w:abs()}];S.curBatch=S.batches[0].id;S.artists.filter(a=>a.status==='trainee').forEach(a=>a.batch=S.curBatch)}
// Tên lứa hiển thị: S.batches[].n lưu 'Lứa N' (nguyên văn, dùng cho log); UI lấy số rồi dựng qua từ điển.
export const batchNameT=b=>{const n=(b.n.match(/\d+/)||[])[0];return n?t('batch.name',{n}):esc(b.n)};
export const batchOf=a=>(S.batches||[]).find(b=>b.id===a.batch)||null;
export const bMem=b=>S.artists.filter(a=>a.status==='trainee'&&a.batch===b.id);
export function fixBatch(a){if(a.status==='trainee'&&!S.batches.some(b=>b.id===a.batch))a.batch=S.curBatch}
export function newBatch(){const n='Lứa '+(++S.bno),b={id:uid(),n,w:abs()};S.batches.push(b);S.curBatch=b.id;S.ui=S.ui||{};S.ui['lb-b'+b.id]=true;addLog(`🌱 Mở ${n}. Thực tập sinh ký mới sẽ vào lứa này.`,'good');act()}
export function setCurBatch(id){S.curBatch=+id;act()}
export function moveBatch(aid,bid){const a=byId(aid),b=S.batches.find(x=>x.id===+bid);if(a&&b){a.batch=b.id;addLog(`🔀 Chuyển ${a.name} sang ${b.n}.`);act()}}
export function batchSched(bid,v){if(!v)return;S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).forEach(a=>a.days=defaultDays(v));toast(t('batch.toast.sched'));act()}
export function batchLive(bid){const ids=S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).map(a=>a.id);if(!ids.length)return toast(t('batch.toast.noFree'));doLive(ids)}
export function batchHTML(){const cur=S.curBatch;
  return`<div class="row" style="margin-bottom:6px"><span class="small">${t('batch.signTo')}</span><select onchange="setCurBatch(this.value)">${S.batches.length?'':`<option>${t('batch.autoOpt')}</option>`}${S.batches.map(b=>`<option value="${b.id}" ${b.id===cur?'selected':''}>${batchNameT(b)}</option>`).join('')}</select><span class="sp"></span><button class="btn sm pri" onclick="newBatch()">${t('batch.new')}</button></div>
  <div class="small muted" style="margin-bottom:6px">${t('batch.tip')}</div>`+
  S.batches.slice().reverse().map(b=>{const ms=bMem(b).sort(eligSort),grad=S.artists.filter(a=>a.batch===b.id&&a.status==='debuted').length;
    const m=S.managers.find(x=>x.as&&x.as.t==='b'&&x.as.id===b.id);
    const pr=ms.filter(a=>a.ev).map(a=>(stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100),ap=pr.length?pr.reduce((x,y)=>x+y,0)/pr.length:0,free=ms.filter(a=>!a.busy);
    const body=`<div class="small muted">${t('batch.sub',{w:wkLabelT(b.w),g:grad,m:m?esc(m.name):t('batch.noMgr'),a:pr.length?t('batch.avg',{p:ap.toFixed(1),n:EV_PCT}):'',f:fmtN(ms.reduce((q,a)=>q+a.fans,0))})}</div>
    ${ms.length?`<div class="row" style="margin:6px 0"><select onchange="batchSched(${b.id},this.value)"><option value="">${t('batch.schedAll')}</option>${Object.keys(TRAIN).map(k=>`<option value="${k}">${lbl('train.n',k)}</option>`).join('')}</select><button class="btn sm" onclick="batchLive(${b.id})" ${free.length?'':'disabled'}>${t('batch.live',{c:money(1e6),m:money(liveEst(free))})}</button></div>`:''}
    ${ms.map(a=>`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button>${dHold(a)?`<span class="tag s">${t('batch.ready')}</span>`:''}${a.mt&&byId(a.mt)?`<span class="tag v">👩‍🏫 ${esc(byId(a.mt).name)}</span>`:''}<span class="small muted">${a.busy?'🚶 '+esc(a.busy.title):t('batch.total',{n:Math.round(stSum(a))})}${a.ev?' · '+((stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100).toFixed(1)+'%':''} · ${t('batch.fail',{a:a.ttsFail||0,b:EV_TTS})} · 💗${fmtN(a.fans)}</span><span class="sp"></span>${S.batches.length>1?`<select onchange="moveBatch(${a.id},this.value)" aria-label="${t('batch.moveAria')}">${S.batches.map(x=>`<option value="${x.id}" ${x.id===b.id?'selected':''}>${batchNameT(x)}</option>`).join('')}</select>`:''}</div>`).join('')||`<div class="small muted">${t('batch.empty')}</div>`}`;
    return det('lb-b'+b.id,`${batchNameT(b)} (${t('batch.nTts',{n:ms.length})})${b.id===cur?` <span class="tag v">${t('batch.cur')}</span>`:''}`,body,ms.length>0)}).join('')}
/* ---- Cuộc thi cho thực tập sinh ---- */
export const COMP=[
  {n:'Giọng hát Tân binh',ic:'🎙️',w:{vocal:1},t:[1,1]},
  {n:'Đấu trường Rap Trẻ',ic:'🎤',w:{rap:1,variety:.3},t:[1,1]},
  {n:'Liên hoan Nhảy đường phố',ic:'🕺',w:{dance:1,stamina:.5},t:[2,5]},
  {n:'Cover Dance Idol',ic:'💃',w:{dance:.8,vocal:.4,visual:.4},t:[3,6]},
  {n:'Gương mặt Teen',ic:'📸',w:{visual:1,variety:.4},t:[1,1]},
  {n:'Tài năng Diễn xuất Trẻ',ic:'🎭',w:{acting:1,visual:.3},t:[1,2]},
  {n:'Ban nhạc Học đường',ic:'🎸',w:{vocal:.8,rap:.4,dance:.4},t:[2,4]}
];
// Tên cuộc thi hiển thị: S.comps[].n là bản sao nguyên văn COMP[i].n (đi vào busy.title/hist); UI tra từ điển theo chỉ số trong COMP.
export const compNameT=c=>{const i=COMP.findIndex(x=>x.n===c.n);return i<0?esc(c.n):lbl('comp.n',i)};
export function genComp(){const T=pick(COMP.filter(c=>!(S.comps||[]).some(x=>x.n===c.n)));if(!T)return;
  const lvl=clamp(R(18,36)+(S.year-1)*6+Math.floor(S.week/13)*2,12,85),p1=Math.round(R(30,70)*(1+lvl/40))*1e6;
  S.comps.push({id:uid(),n:T.n,ic:T.ic,w:T.w,t:T.t,lvl,wk:R(1,2),fee:R(2,6)*1e6*T.t[0],prize:[p1,Math.round(p1*.45/1e6)*1e6,Math.round(p1*.2/1e6)*1e6],exp:abs()+R(3,5)})}
export function compTick(){S.comps=(S.comps||[]).filter(c=>c.exp>abs());if(S.comps.length<2||(S.comps.length<4&&Math.random()<.35))genComp()}
export function compOdds(c,ids){const ms=ids.map(byId).filter(Boolean);if(!ms.length)return 0;const f=ms.reduce((t,a)=>t+fit(a,c.w),0)/ms.length*(1+(ms.length>1?chem(ids):0));
  let n=0;for(let i=0;i<300;i++){const sc=f+rnd(-8,8);let r=1;for(let j=0;j<7;j++)if(c.lvl+rnd(-12,14)>sc)r++;if(r<=3)n++}return Math.round(n/3)}
export function compSel(cid){return[...document.querySelectorAll('.cp'+cid+':checked')].map(x=>+x.value)}
export function compPrev(cid){const c=S.comps.find(x=>x.id===cid),el=$('#cpo'+cid);if(!c||!el)return;const ids=compSel(cid);
  el.textContent=ids.length?t('comp.sel',{n:ids.length,p:compOdds(c,ids)}):t('comp.pickN',{n:c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]})}
export function compPick(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const n=c.t[1]>1?clamp(3,c.t[0],c.t[1]):1;
  const L=S.artists.filter(a=>a.status==='trainee'&&!a.busy).sort((x,y)=>fit(y,c.w)-fit(x,c.w)).slice(0,n).map(a=>a.id);
  document.querySelectorAll('.cp'+cid).forEach(x=>x.checked=L.includes(+x.value));compPrev(cid)}
export function enterComp(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const ids=compSel(cid),ms=ids.map(byId).filter(a=>a&&a.status==='trainee'&&!a.busy);
  {const h=ms.find(dHold);if(h)return toast(t('comp.toast.debutHold',{n:h.name}))}
  {const h=ms.find(a=>{const p=cbHold(a);return p&&abs()+c.wk>p.w});if(h)return toast(t('comp.toast.cbHold',{n:h.name,w:wkLabelT(cbHold(h).w)}))}
  if(ms.length<c.t[0]||ms.length>c.t[1])return toast(t('comp.toast.need',{n:c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]}));
  if(S.money<c.fee)return toast(t('comp.toast.noFee'));S.money-=c.fee;
  const run={id:uid(),c,ids:ms.map(a=>a.id),res:null};S.compRuns=S.compRuns||[];S.compRuns.push(run);
  ms.forEach(a=>a.busy={kind:'comp',title:'Cuộc thi «'+c.n+'»',left:c.wk,total:c.wk,run:run.id});
  S.comps=S.comps.filter(x=>x!==c);addLog(`🏅 ${ms.map(a=>a.name).join(', ')} lên đường dự thi «${c.n}» (${c.wk} tuần, lệ phí ${fmt(c.fee)}).`,'good');act()}
export function compDone(a,b){const run=(S.compRuns||[]).find(r=>r.id===b.run);if(!run)return;const c=run.c;
  if(!run.res){const ms=run.ids.map(byId).filter(Boolean),f=ms.reduce((t,x)=>t+fit(x,c.w),0)/Math.max(ms.length,1)*(1+(ms.length>1?chem(run.ids):0)),sc=f+rnd(-8,8);
    let rank=1;for(let j=0;j<7;j++)if(c.lvl+rnd(-12,14)>sc)rank++;const prize=rank<=3?c.prize[rank-1]:0;S.money+=prize;run.res={rank,prize};
    const who=ms.map(x=>x.name).join(', ');
    addLog(rank<=3?`🏅 ${c.ic} ${who} giành hạng ${rank} tại «${c.n}», nhận ${fmt(prize)}!`:`${c.ic} ${who} dừng ở hạng ${rank}/8 tại «${c.n}». Kinh nghiệm quý cho lần sau.`,rank<=3?'gold':'');
    {const m=ms.map(mgrOf).find(Boolean);if(m)mgrExp(m,rank===1?2:1)}}
  const r=run.res,q=r.rank===1?1.4:r.rank<=3?1.15:.9,fg=r.rank===1?R(3000,7000):r.rank<=3?R(1000,3000):R(200,800);a.fans+=fg;a.yr.fans+=fg;
  const les={};for(const k in c.w)les[k]=c.w[k]*3;const ls=applyLesson(a,les,q);
  a.lessons.unshift({t:`Cuộc thi «${c.n}»`,l:r.rank<=3?'Tự tin hơn khi thi đấu':'Học được nhiều từ đối thủ',s:ls,y:S.year});if(a.lessons.length>12)a.lessons.length=12;
  a.mood=clamp(a.mood+(r.rank<=3?12:-4),0,100);a.hist.unshift(`N${S.year}: Cuộc thi «${c.n}» – hạng ${r.rank}`);a.wc=(a.wc||0)+1;
  if(!S.artists.some(x=>x.busy&&x.busy.run===run.id))S.compRuns=S.compRuns.filter(x=>x!==run)}
export function compHTML(){const free=S.artists.filter(a=>a.status==='trainee'&&!a.busy),going=S.artists.filter(a=>a.busy&&a.busy.kind==='comp');
  return`<div class="small muted" style="margin-bottom:6px">${t('comp.tip')} ${going.length?t('comp.going',{n:going.map(a=>esc(a.name)).join(t('list.sep'))}):''}</div>`+
  (S.comps.map(c=>{const team=c.t[1]===1?t('comp.solo'):c.t[0]===c.t[1]?t('comp.team',{n:c.t[0]}):t('comp.team',{n:c.t[0]+'–'+c.t[1]}),L=free.slice().sort((x,y)=>fit(y,c.w)-fit(x,c.w)),multi=c.t[1]>1;
    const list=x=>x.map(a=>{const bt=batchOf(a);return`<label><input type="${multi?'checkbox':'radio'}" name="cp${c.id}" class="cp${c.id}" value="${a.id}" onchange="compPrev(${c.id})"> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">${bt&&S.batches.length>1?batchNameT(bt)+' · ':''}${t('comp.skill',{n:Math.round(fit(a,c.w))})}</span></span></label>`}).join('');
    return`<div class="card"><div class="row"><b>${c.ic} ${compNameT(c)}</b><span class="sp"></span><span class="small muted">${t('comp.exp',{w:t('unit.weeks',{n:c.exp-abs()})})}</span></div>
    <div class="small">${t('comp.info',{team,wk:t('unit.weeks',{n:c.wk}),fee:money(c.fee),lvl:c.lvl,p1:money(c.prize[0]),p2:money(c.prize[1]),p3:money(c.prize[2])})}</div>
    <div class="req">${t('comp.score',{s:Object.keys(c.w).map(k=>lbl('stat',k)).join(t('list.sep'))})}</div>
    ${L.length?det('cp-l'+c.id,t('comp.pickHead',{n:L.length}),`<div class="list">${list(L)}</div>`,true)+`<div class="row" style="margin-top:6px"><span class="small muted" id="cpo${c.id}" style="flex:1">${t('comp.pickN',{n:c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]})}</span><button class="btn sm" onclick="compPick(${c.id})">${t('comp.hint')}</button><button class="btn sm pri" onclick="enterComp(${c.id})">${t('comp.enter')}</button></div>`:`<div class="small muted">${t('comp.noFree')}</div>`}</div>`}).join('')||`<div class="small muted">${t('comp.none')}</div>`)}
