import { R, pick, rnd } from '../core/rng.js';
import { clamp, fmt } from '../core/util.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fit } from './artists.js';
import { mgrExp, mgrOf } from './managers.js';
import { chem } from './offers.js';
import { doLive } from './releases.js';
import { applyLesson, defaultDays } from './week.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

/* ---- Lứa thực tập sinh ---- */
export function initBatches(){S.bno=1;S.batches=[{id:uid(),n:'Lứa 1',w:abs()}];S.curBatch=S.batches[0].id;S.artists.filter(a=>a.status==='trainee').forEach(a=>a.batch=S.curBatch)}
export const batchOf=a=>(S.batches||[]).find(b=>b.id===a.batch)||null;
export const bMem=b=>S.artists.filter(a=>a.status==='trainee'&&a.batch===b.id);
export function fixBatch(a){if(a.status==='trainee'&&!S.batches.some(b=>b.id===a.batch))a.batch=S.curBatch}
export function newBatch(){const n='Lứa '+(++S.bno),b={id:uid(),n,w:abs()};S.batches.push(b);S.curBatch=b.id;S.ui=S.ui||{};S.ui['lb-b'+b.id]=true;addLog(`🌱 Mở ${n}. Thực tập sinh ký mới sẽ vào lứa này.`,'good');act()}
export function setCurBatch(id){S.curBatch=+id;act()}
export function moveBatch(aid,bid){const a=byId(aid),b=S.batches.find(x=>x.id===+bid);if(a&&b){a.batch=b.id;addLog(`🔀 Chuyển ${a.name} sang ${b.n}.`);act()}}
export function batchSched(bid,v){if(!v)return;S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).forEach(a=>a.days=defaultDays(v));toast('Đã xếp lịch cho cả lứa');act()}
export function batchLive(bid){const ids=S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).map(a=>a.id);if(!ids.length)return toast('Không có ai rảnh');doLive(ids)}
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
export function genComp(){const T=pick(COMP.filter(c=>!(S.comps||[]).some(x=>x.n===c.n)));if(!T)return;
  const lvl=clamp(R(18,36)+(S.year-1)*6+Math.floor(S.week/13)*2,12,85),p1=Math.round(R(30,70)*(1+lvl/40))*1e6;
  S.comps.push({id:uid(),n:T.n,ic:T.ic,w:T.w,t:T.t,lvl,wk:R(1,2),fee:R(2,6)*1e6*T.t[0],prize:[p1,Math.round(p1*.45/1e6)*1e6,Math.round(p1*.2/1e6)*1e6],exp:abs()+R(3,5)})}
export function compTick(){S.comps=(S.comps||[]).filter(c=>c.exp>abs());if(S.comps.length<2||(S.comps.length<4&&Math.random()<.35))genComp()}
export function compOdds(c,ids){const ms=ids.map(byId).filter(Boolean);if(!ms.length)return 0;const f=ms.reduce((t,a)=>t+fit(a,c.w),0)/ms.length*(1+(ms.length>1?chem(ids):0));
  let n=0;for(let i=0;i<300;i++){const sc=f+rnd(-8,8);let r=1;for(let j=0;j<7;j++)if(c.lvl+rnd(-12,14)>sc)r++;if(r<=3)n++}return Math.round(n/3)}
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
