import { clamp } from '../core/util.js';
import { CONCEPTS } from '../data/rules.js';
import { S, abs, addLog, byId } from '../state.js';
import { fame } from './artists.js';
import { avgFit } from './debut.js';
import { gHiatus } from './ext2.js';
import { rivalPress, trendB } from './market.js';
import { harmony } from './relations.js';
import { actByKey, doSingle } from './releases.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

/* ================= SINGLES / CONCERTS / FILMS / DEBUT ================= */
export function acts(){const r=[];S.groups.forEach(g=>r.push({k:'g'+g.id,n:'👥 '+g.name,m:g.members}));S.artists.filter(a=>a.solo).forEach(a=>r.push({k:'s'+a.id,n:'🎤 '+a.name+' (solo)',m:[a.id]}));return r}
export const actFree=x=>x.m.length&&!gHiatus(x.k)&&x.m.every(id=>{const a=byId(id);return a&&!a.busy});
export function conceptRec(x){const m=x.m.map(byId).filter(Boolean);return Object.keys(CONCEPTS).map(k=>{const f=avgFit(m,CONCEPTS[k].w);return{k,f,s:f+trendB(k)}}).sort((a,b)=>b.s-a.s)}
/* ---- Thư ký: kế hoạch comeback ---- */
export const BUDN={30e6:'Tiết kiệm',80e6:'Tiêu chuẩn',200e6:'Bom tấn'};
export function lastSingleW(x){const s=S.singles.find(z=>z.k?z.k===x.k:z.act===x.n);return s?(s.w||(s.y-1)*52+1):null}
export function estRank(x,ck,bud,rp){const mem=x.m.map(byId).filter(Boolean);if(!mem.length)return 100;const ft=avgFit(mem,CONCEPTS[ck].w),fm=mem.reduce((t,a)=>t+fame(a),0)/mem.length,bb=bud>=200e6?16:bud>=80e6?8:0;
  return clamp(Math.round(118-(ft*.6+fm*.3+bb+10+harmony(x.m)+trendB(ck)-(rp==null?rivalPress():rp))),1,100)}
export function secPlan(x){
  const mem=x.m.map(byId).filter(Boolean);if(!mem.length)return null;
  const now=abs(),busyL=Math.max(0,...mem.map(a=>a.busy?a.busy.left:0)),lw=lastSingleW(x),gap=lw==null?99:now-lw;
  const rec=conceptRec(x),fm=mem.reduce((t,a)=>t+fame(a),0)/mem.length,e=mem.reduce((t,a)=>t+a.energy,0)/mem.length;
  const bud=S.money>1.5e9&&fm>=25?200e6:S.money>400e6?80e6:30e6;
  let wait=0,ck=rec[0].k;const why=[];
  if(busyL){wait=busyL;why.push(`còn bận ${busyL} tuần`)}
  if(gap<4){wait=Math.max(wait,4-gap);why.push(`vừa comeback ${gap} tuần trước, nên cách ít nhất 4 tuần`)}
  if(!busyL&&e<45){wait=Math.max(wait,1);why.push(`năng lượng TB ${Math.round(e)}, cho nghỉ 1 tuần`)}
  if(rivalPress()>0&&wait<2){const d=estRank(x,ck,bud)-estRank(x,ck,bud,0);if(d>=4){wait=2;why.push(`đối thủ đang comeback, ra lúc này tụt ~${d} hạng`)}}
  if(wait>=S.trend.until-now&&S.trend.hot.includes(ck)){ck=rec.slice().sort((a,b)=>b.f-a.f)[0].k;why.push('xu hướng sắp đổi nên chọn concept hợp nhất thay vì concept hot')}
  if(S.money<bud+50e6)why.push('quỹ đang eo hẹp');
  if(!why.length)why.push(gap>=99?'chưa có single nào, nên ra mắt sớm':`đã ${gap} tuần chưa comeback, đội hình khỏe`);
  const tf=mem.reduce((t,a)=>t+a.fans,0),lc=S.concerts.slice().reverse().find(c=>c.k?c.k===x.k:c.act===x.n),cg=lc?(lc.w?now-lc.w:(S.year-lc.y)*52):99;
  return{k:x.k,n:x.n,wait,ck,bud,rank:estRank(x,ck,bud,wait>=2?0:null),fit:rec.find(r=>r.k===ck).f,why,gap,concert:tf>=30000&&cg>=26&&!busyL,tf,plan:(S.cbPlan||[]).find(p=>p.k===x.k)}
}
export function secPlans(){return acts().map(secPlan).filter(Boolean).sort((a,b)=>(a.plan?1:0)-(b.plan?1:0)||a.wait-b.wait||a.rank-b.rank)}
export function secSchedRec(){return secPlans().filter(p=>!p.plan&&!(S.camp[p.k]&&S.camp[p.k].ph==='post')&&p.wait>=1&&p.wait<=6&&S.money>=p.bud).sort((a,b)=>a.rank-b.rank||a.wait-b.wait).slice(0,3).map(p=>(p.recWhy=`hạng dự kiến ~${p.rank}, ${p.wait} tuần nữa sẵn sàng; ${p.why[0]}`,p))}
export function cbSchedRec(){const L=secSchedRec();if(!L.length)return;L.forEach(p=>cbSched(p.k));addLog(`🗒️ Thư ký hẹn comeback theo khuyến nghị cho: ${L.map(p=>p.n.slice(2).trim()).join(', ')}.`);act()}
export function cbNow(k){const p=secPlan(actByKey(k));if(!p)return;if(doSingle(k,p.ck,p.bud,null,true)){addLog(`🗒️ Thư ký triển khai comeback theo kế hoạch.`);act()}else toast('Chưa thể comeback (bận hoặc thiếu tiền)')}
export function cbSched(k){const x=actByKey(k),p=secPlan(x);if(!p)return;S.cbPlan=(S.cbPlan||[]).filter(z=>z.k!==k);const w=abs()+Math.max(1,p.wait);S.cbPlan.push({k,n:p.n,w,ck:p.ck,bud:p.bud,tries:0});
  addLog(`🗒️ Hẹn comeback cho ${p.n.slice(2).trim()} vào tuần ${((w-1)%52)+1}. Đã tự chừa lịch: thành viên không nhận dự án hay cuộc thi kéo dài qua tuần này.`);
  const late=x.m.map(byId).filter(a=>a&&a.busy&&abs()+a.busy.left>w);if(late.length)addLog(`⚠️ ${late.map(a=>a.name).join(', ')} đang bận ${late.map(a=>'«'+a.busy.title+'»').join(', ')} quá tuần comeback, có thể phải lùi lịch.`,'bad');act()}
export function cbCancel(k){S.cbPlan=(S.cbPlan||[]).filter(x=>x.k!==k);act()}
export const wkLabel=w=>`T${((w-1)%52)+1}${Math.ceil(w/52)!==S.year?' N'+Math.ceil(w/52):''}`;
export function runCbPlans(){if(!S.cbPlan||!S.cbPlan.length)return;const now=abs();
  for(const p of [...S.cbPlan]){if(p.w>now)continue;const x=actByKey(p.k);if(!x){S.cbPlan=S.cbPlan.filter(z=>z!==p);continue}
    const q=secPlan(x),ck=q?q.ck:p.ck;
    if(actFree(x)&&S.money>=p.bud&&doSingle(p.k,ck,p.bud,null,true))addLog(`🗒️ Thư ký triển khai comeback đã hẹn cho ${p.n.slice(2).trim()} (${CONCEPTS[ck].n}).`,'good');
    else{p.tries++;p.w=now+1;if(p.tries>3){S.cbPlan=S.cbPlan.filter(z=>z!==p);addLog(`🗒️ Hủy lịch comeback của ${p.n.slice(2).trim()} vì hoãn quá 3 lần.`,'bad')}else addLog(`🗒️ Lùi comeback của ${p.n.slice(2).trim()} 1 tuần (${actFree(x)?'thiếu tiền':'thành viên đang bận'}).`)}}}
