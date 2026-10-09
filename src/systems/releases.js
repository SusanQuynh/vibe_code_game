import { R, pick, rnd } from '../core/rng.js';
import { $, clamp, fmt, fmtN } from '../core/util.js';
import { SONGS } from '../data/names.js';
import { CONCEPTS } from '../data/rules.js';
import { S, abs, addLog, byId } from '../state.js';
import { fame, fit } from './artists.js';
import { pushEv } from './events.js';
import { MOOD, book, gHiatus, sgBonus } from './ext2.js';
import { mgrExp, mgrOf } from './managers.js';
import { rivalPress, trendB } from './market.js';
import { PROMO_WK, campMem } from './promo.js';
import { harmony } from './relations.js';
import { actFree, acts } from './secretary.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

/* ---- Giao lưu fan: livestream & fan meeting ---- */
export function liveInc(a){return Math.round((a.fans*300+1.2e6)*(1+fame(a)/200)*rnd(.7,1.3)/1e5)*1e5}
export function liveEst(ms){return ms.reduce((t,a)=>t+Math.round((a.fans*300+1.2e6)*(1+fame(a)/200)/1e5)*1e5,0)}
export function doLive(ids,quiet){const ms=ids.map(byId).filter(Boolean).filter(a=>a.lastLive!==abs());if(!ms.length)return quiet||toast('Tuần này đã livestream');if(S.money<1e6)return quiet||toast('Không đủ tiền');
  S.money-=1e6;let inc=0;for(const a of ms){inc+=liveInc(a);const g=Math.round(a.fans*.01+R(200,800)*(1+fame(a)/60));a.fans+=g;a.yr.fans+=g;a.mood=clamp(a.mood+8,0,100);a.energy=clamp(a.energy-4,0,100);a.lastLive=abs();a.lastFan=abs()}
  S.money+=inc;book('live',inc,ms);addLog(`📱 ${ms.length>3?ms.length+' người':ms.map(a=>a.name).join(', ')} livestream trò chuyện với fan, thu ${fmt(inc)} tiền donate và quảng cáo (chi 1 tr).`,inc>1e6?'good':'');if(!quiet)toast(`Livestream thu ${fmt(inc)}`);
  if(Math.random()<.03){const a=pick(ms);if(!a.scandal&&a.status==='debuted'){a.scandal={t:'Lỡ lời khi livestream',sev:1,left:2,truth:true,dating:false,other:0};pushEv({kind:'scandal',a:a.id},true);addLog(`😬 ${a.name} lỡ lời khi livestream, dân mạng bàn tán.`,'bad')}}
  if(!quiet)act()}
export const fmCost=x=>40e6+x.m.length*10e6;
export function doFM(k){const x=actByKey(k);if(!x)return;if(!actFree(x))return toast('Đang bận');const ms=campMem(k),tf=ms.reduce((t,a)=>t+a.fans,0);if(tf<10000)return toast('Cần tổng 10K fan');const c=fmCost(x);if(S.money<c)return toast('Không đủ tiền');
  S.money-=c;book('prod',-c);const seats=Math.round(Math.min(tf*.03,8000)*rnd(.8,1.1)),inc=seats*150000;S.money+=inc;book('con',inc,ms);
  for(const a of ms){a.fans=Math.round(a.fans*1.03);a.mood=clamp(a.mood+12,0,100);a.energy=clamp(a.energy-10,0,100);a.lastFan=abs();a.wc=(a.wc||0)+1;a.busy={kind:'concert',title:'Fan meeting',left:1,total:1}}
  S.fmLast=S.fmLast||{};S.fmLast[k]=abs();if(S.fmHint)delete S.fmHint[k];
  addLog(`💝 Fan meeting của ${x.n.slice(2).trim()}: ${fmtN(seats)} fan tham dự, thu ${fmt(inc)} (chi ${fmt(c)}).`,'gold');act()}
export function fanSugs(){const now=abs(),L=[];
  for(const x of acts()){if(!actFree(x))continue;const ms=campMem(x.k),tf=ms.reduce((t,a)=>t+a.fans,0),last=(S.fmLast||{})[x.k],gap=last?now-last:99;
    if(tf<10000||gap<16)continue;const why=(S.fmHint||{})[x.k]&&now-S.fmHint[x.k]<=4?'vừa kết thúc quảng bá, cảm ơn fan đúng lúc':ms.some(a=>a.mood<45)?'thành viên đang buồn, gặp fan sẽ vui lên':gap>=99?'chưa từng tổ chức fan meeting':`${gap} tuần chưa gặp fan`;
    L.push({t:'fm',k:x.k,n:x.n,why,est:Math.round(Math.min(tf*.03,8000)),cost:fmCost(x),pri:(S.fmHint||{})[x.k]?3:2})}
  for(const a of S.artists){if(a.status!=='debuted'||a.lastLive===now)continue;const gap=a.lastFan?now-a.lastFan:99;let why='';
    if(a.mood<45)why='tâm trạng thấp, fan động viên sẽ đỡ hơn';else if(a.scandal)why='đang có tin đồn, livestream để giữ fan';else if(gap>=6)why=gap>=99?'chưa từng livestream':`${gap} tuần chưa giao lưu fan`;
    if(why)L.push({t:'live',id:a.id,n:a.name,why,pri:a.mood<45?2.5:1})}
  return L.sort((a,b)=>b.pri-a.pri).slice(0,8)}
export function actByKey(k){return acts().find(x=>x.k===k)}
export function doSingle(ak,ck,bud,title,silent,sid){
  title=(title||pick(SONGS)).trim().slice(0,40);
  const A=actByKey(ak);if(!A){if(!silent)toast('Chọn nghệ sĩ');return false}
  if(gHiatus(ak)){if(!silent)toast('Nhóm đang tạm ngừng hoạt động');return false}
  const sg=sid?(S.songs||[]).find(x=>x.id===sid&&x.st==='ok'):null;if(sg){ck=sg.ck;title=sg.t}
  const mem=A.m.map(byId).filter(Boolean);
  if(mem.some(a=>a.busy)){if(!silent)toast('Có thành viên đang bận');return false}
  if(S.money<bud){if(!silent)toast('Không đủ tiền');return false}
  S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!==ak);
  S.money-=bud;book('prod',-bud);
  const w=CONCEPTS[ck].w,ft=mem.reduce((s,a)=>s+fit(a,w),0)/mem.length,fm=mem.reduce((s,a)=>s+fame(a),0)/mem.length;
  const h=harmony(A.m),bb=bud>=200e6?16:bud>=80e6?8:0;
  const pc=S.camp[ak],hp=pc&&pc.ph==='pre'?pc.hype:0;
  const tb=trendB(ck),rp=rivalPress(),score=ft*.6+fm*.3+bb+R(0,20)+h+tb-rp+hp*.25+sgBonus(sg,A.m);
  const rank=clamp(Math.round(118-score),1,100);
  const sales=Math.round(Math.pow(101-rank,1.8)*30*(1+fm/100));
  const inc=sales*5000;S.money+=inc;book('sgl',inc,mem);
  for(const a of mem){const g=Math.round((101-rank)*R(60,130)*(1+fm/100)*(1+hp/100));a.fans+=g;a.yr.fans+=g;a.busy={kind:'promo',title:'Quảng bá «'+title+'»',left:PROMO_WK,total:PROMO_WK};a.mood=clamp(a.mood+5,0,100);a.hist.unshift(`N${S.year}: Single «${title}» – hạng ${rank}`);a.wc=(a.wc||0)+1}
  {const ms=new Set(mem.map(mgrOf).filter(Boolean));ms.forEach(m=>mgrExp(m))}
  S.singles.unshift({title,act:A.n,m:A.m,rank,y:S.year,concept:CONCEPTS[ck].n,k:ak,w:abs(),dig:Math.round(inc*.08/1e4)*1e4,dk:rank<=10?.93:rank<=40?.9:.86,dt:0,roy:sg?0:.15,sg:sg?sg.id:0});
  if(sg){sg.st='used';sg.rank=rank;sg.act=A.n;const ws=sg.by.map(byId).filter(Boolean);ws.forEach(a=>{const g=Math.round((101-rank)*R(20,50));a.fans+=g;a.yr.fans+=g;MOOD(a,10);a.hist.unshift(`N${S.year}: Sáng tác «${title}» – hạng ${rank}`)});addLog(`✍️ «${title}» do ${ws.map(a=>a.name).join(', ')} sáng tác, công ty giữ trọn doanh thu nhạc số.`,'good')}
  addLog(`💿 Single «${title}» của ${A.n.slice(2).trim()} (${CONCEPTS[ck].n}) đạt hạng ${rank}! Doanh thu ${fmt(inc)}.${tb>0?' 🔥 Hợp xu hướng.':tb<0?' ❄️ Concept đã hết thời.':''}${rp?' ⚔️ Bị đối thủ cạnh tranh.':''}${h<0?' Mâu thuẫn nội bộ kéo điểm xuống.':''}`,rank<=10?'gold':'good');
  if(hp)addLog(`📣 Hype ${hp} từ hoạt động teaser giúp «${title}» ra mắt mạnh hơn.`,'good');
  S.camp[ak]={k:ak,n:A.n,ph:'post',t:title,ck,rank,best:rank,wins:0,stages:0,wn:0,used:{wk:abs(),l:[]},hype:hp,inc:0};
  if(!silent)act();return true;
}
export function holdConcert(k){
  const A=actByKey(k||$('#cAct').value);if(!A)return toast('Chọn nghệ sĩ');
  const mem=A.m.map(byId).filter(Boolean),tf=mem.reduce((s,a)=>s+a.fans,0);
  if(tf<30000)return toast('Cần tổng 30K fan');
  if(mem.some(a=>a.busy))return toast('Có thành viên đang bận');
  if(gHiatus(A.k))return toast('Nhóm đang tạm ngừng hoạt động');
  if(S.money<200e6)return toast('Không đủ 200 tr');
  S.money-=200e6;book('prod',-200e6);
  const aud=Math.round(Math.min(tf*.04*rnd(.8,1.2),60000)),inc=aud*500000;S.money+=inc;book('con',inc,mem);
  for(const a of mem){a.fans=Math.round(a.fans*1.08);a.mood=clamp(a.mood+10,0,100);a.energy=clamp(a.energy-25,0,100);a.busy={kind:'concert',title:'Concert',left:1,total:1}}
  S.concerts.push({act:A.n,aud,y:S.year,m:A.m,k:A.k,w:abs()});
  addLog(`🏟️ Concert của ${A.n.slice(2).trim()}: ${fmtN(aud)} khán giả, doanh thu ${fmt(inc)}.`,'gold');act();
}
