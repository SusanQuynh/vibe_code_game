import { R, pick, rnd } from '../core/rng.js';
import { $, clamp, esc, fmt } from '../core/util.js';
import { STATS } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fit } from './artists.js';
import { batchOf } from './batches.js';
import { dHold } from './ext2.js';
import { mgrExp, mgrOf } from './managers.js';
import { cbHold, chem } from './offers.js';
import { wkLabel } from './secretary.js';
import { applyLesson } from './week.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';
import { det } from '../ui/views.js';

/* ---- Trainee competitions ---- */
export const COMP=[
  {n:'Giọng hát Tân binh',ic:'🎙️',w:{vocal:1},t:[1,1]},
  {n:'Đấu trường Rap Trẻ',ic:'🎤',w:{rap:1,variety:.3},t:[1,1]},
  {n:'Liên hoan Nhảy đường phố',ic:'🕺',w:{dance:1,stamina:.5},t:[2,5]},
  {n:'Cover Dance Idol',ic:'💃',w:{dance:.8,vocal:.4,visual:.4},t:[3,6]},
  {n:'Gương mặt Teen',ic:'📸',w:{visual:1,variety:.4},t:[1,1]},
  {n:'Tài năng Diễn xuất Trẻ',ic:'🎭',w:{acting:1,visual:.3},t:[1,2]},
  {n:'Ban nhạc Học đường',ic:'🎸',w:{vocal:.8,rap:.4,dance:.4},t:[2,4]}
];
export function genComp(){const T=pick(COMP.filter(c=>!(S.comps||[]).some(x=>x.n===c.n)));if(!T)return;
  const lvl=clamp(R(18,36)+(S.year-1)*6+Math.floor(S.week/13)*2,12,85),p1=Math.round(R(30,70)*(1+lvl/40))*1e6;
  S.comps.push({id:uid(),n:T.n,ic:T.ic,w:T.w,t:T.t,lvl,wk:R(1,2),fee:R(2,6)*1e6*T.t[0],prize:[p1,Math.round(p1*.45/1e6)*1e6,Math.round(p1*.2/1e6)*1e6],exp:abs()+R(3,5)})}
/* contest kind table: tts (trainees) for now */
export const kindOf=c=>c.k||'tts';
export const KIND={tts:{elig:a=>a.status==='trainee'&&!a.busy,label:'thực tập sinh',fanMul:()=>1}};
export function compTick(){S.comps=(S.comps||[]).filter(c=>c.exp>abs());const n=S.comps.filter(c=>kindOf(c)==='tts').length;if(n<2||(n<4&&Math.random()<.35))genComp()}
const compScore=(ms,ids,c)=>ms.reduce((t,a)=>t+fit(a,c.w),0)/Math.max(ms.length,1)*(1+(ms.length>1?chem(ids):0));
const compRank=(c,sc)=>{let r=1;for(let j=0;j<7;j++)if(c.lvl+rnd(-12,14)>sc)r++;return r};
export function compOdds(c,ids){const ms=ids.map(byId).filter(Boolean);if(!ms.length)return 0;const f=compScore(ms,ids,c);
  let n=0;for(let i=0;i<300;i++){const sc=f+rnd(-8,8);if(compRank(c,sc)<=3)n++}return Math.round(n/3)}
export function compSel(cid){return[...document.querySelectorAll('.cp'+cid+':checked')].map(x=>+x.value)}
export function compPrev(cid){const c=S.comps.find(x=>x.id===cid),el=$('#cpo'+cid);if(!c||!el)return;const ids=compSel(cid);
  el.textContent=ids.length?`Đã chọn ${ids.length} người · cơ hội vào top 3 khoảng ${compOdds(c,ids)}%`:`Chọn ${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} thực tập sinh`}
export function compPick(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const n=c.t[1]>1?clamp(3,c.t[0],c.t[1]):1;
  const L=S.artists.filter(KIND[kindOf(c)].elig).sort((x,y)=>fit(y,c.w)-fit(x,c.w)).slice(0,n).map(a=>a.id);
  document.querySelectorAll('.cp'+cid).forEach(x=>x.checked=L.includes(+x.value));compPrev(cid)}
export function enterComp(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const ids=compSel(cid),ms=ids.map(byId).filter(a=>a&&KIND[kindOf(c)].elig(a));
  {const h=ms.find(dHold);if(h)return toast(`${h.name} đang chừa lịch debut`)}
  {const h=ms.find(a=>{const p=cbHold(a);return p&&abs()+c.wk>p.w});if(h)return toast(`${h.name} đang chừa lịch comeback ${wkLabel(cbHold(h).w)}`)}
  if(ms.length<c.t[0]||ms.length>c.t[1])return toast(`Cần ${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} thực tập sinh`);
  if(S.money<c.fee)return toast('Không đủ tiền lệ phí');S.money-=c.fee;
  const run={id:uid(),c,ids:ms.map(a=>a.id),res:null};S.compRuns=S.compRuns||[];S.compRuns.push(run);
  ms.forEach(a=>a.busy={kind:'comp',title:'Cuộc thi «'+c.n+'»',left:c.wk,total:c.wk,run:run.id});
  S.comps=S.comps.filter(x=>x!==c);addLog(`🏅 ${ms.map(a=>a.name).join(', ')} lên đường dự thi «${c.n}» (${c.wk} tuần, lệ phí ${fmt(c.fee)}).`,'good');act()}
export function compDone(a,b){const run=(S.compRuns||[]).find(r=>r.id===b.run);if(!run)return;const c=run.c;
  if(!run.res){const ms=run.ids.map(byId).filter(Boolean),f=compScore(ms,run.ids,c),sc=f+rnd(-8,8);
    const rank=compRank(c,sc),prize=rank<=3?c.prize[rank-1]:0;S.money+=prize;run.res={rank,prize};
    const who=ms.map(x=>x.name).join(', ');
    addLog(rank<=3?`🏅 ${c.ic} ${who} giành hạng ${rank} tại «${c.n}», nhận ${fmt(prize)}!`:`${c.ic} ${who} dừng ở hạng ${rank}/8 tại «${c.n}». Kinh nghiệm quý cho lần sau.`,rank<=3?'gold':'');
    {const m=ms.map(mgrOf).find(Boolean);if(m)mgrExp(m,rank===1?2:1)}}
  const r=run.res,q=r.rank===1?1.4:r.rank<=3?1.15:.9,fg=r.rank===1?R(3000,7000):r.rank<=3?R(1000,3000):R(200,800);a.fans+=fg;a.yr.fans+=fg;
  const les={};for(const k in c.w)les[k]=c.w[k]*3;const ls=applyLesson(a,les,q);
  a.lessons.unshift({t:`Cuộc thi «${c.n}»`,l:r.rank<=3?'Tự tin hơn khi thi đấu':'Học được nhiều từ đối thủ',s:ls,y:S.year});if(a.lessons.length>12)a.lessons.length=12;
  a.mood=clamp(a.mood+(r.rank<=3?12:-4),0,100);a.hist.unshift(`N${S.year}: Cuộc thi «${c.n}» – hạng ${r.rank}`);a.wc=(a.wc||0)+1;
  if(!S.artists.some(x=>x.busy&&x.busy.run===run.id))S.compRuns=S.compRuns.filter(x=>x!==run)}
export function compHTML(kinds=['tts']){const free=S.artists.filter(KIND.tts.elig),going=S.artists.filter(a=>a.busy&&a.busy.kind==='comp');
  return`<div class="small muted" style="margin-bottom:6px">Chỉ thực tập sinh được dự thi. Top 3 nhận tiền thưởng, ai cũng có thêm fan và bài học theo kỹ năng thi. ${going.length?`Đang thi: <b>${going.map(a=>esc(a.name)).join(', ')}</b>.`:''}</div>`+
  (S.comps.filter(c=>kinds.includes(kindOf(c))).map(c=>{const team=c.t[1]===1?'Thi cá nhân':c.t[0]===c.t[1]?`Đội ${c.t[0]} người`:`Đội ${c.t[0]}–${c.t[1]} người`,L=free.slice().sort((x,y)=>fit(y,c.w)-fit(x,c.w)),multi=c.t[1]>1;
    const list=x=>x.map(a=>{const bt=batchOf(a);return`<label><input type="${multi?'checkbox':'radio'}" name="cp${c.id}" class="cp${c.id}" value="${a.id}" onchange="compPrev(${c.id})"> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">${bt&&S.batches.length>1?esc(bt.n)+' · ':''}điểm kỹ năng ${Math.round(fit(a,c.w))}</span></span></label>`}).join('');
    return`<div class="card"><div class="row"><b>${c.ic} ${esc(c.n)}</b><span class="sp"></span><span class="small muted">hạn đăng ký ${c.exp-abs()} tuần</span></div>
    <div class="small">${team} · ${c.wk} tuần · lệ phí ${fmt(c.fee)} · đối thủ khoảng ${c.lvl} điểm<br>🥇 ${fmt(c.prize[0])} · 🥈 ${fmt(c.prize[1])} · 🥉 ${fmt(c.prize[2])}</div>
    <div class="req">Chấm điểm: ${Object.keys(c.w).map(k=>STATS[k]).join(', ')}</div>
    ${L.length?det('cp-l'+c.id,`Chọn thực tập sinh (${L.length} người rảnh)`,`<div class="list">${list(L)}</div>`,true)+`<div class="row" style="margin-top:6px"><span class="small muted" id="cpo${c.id}" style="flex:1">Chọn ${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} thực tập sinh</span><button class="btn sm" onclick="compPick(${c.id})">💡 Gợi ý</button><button class="btn sm pri" onclick="enterComp(${c.id})">Đăng ký</button></div>`:'<div class="small muted">Không có thực tập sinh rảnh.</div>'}</div>`}).join('')||'<div class="small muted">Chưa có cuộc thi nào mở đăng ký. Sang tuần mới để xem thêm.</div>')}
