import { R, pick, rnd } from '../core/rng.js';
import { clamp, fmt, fmtN } from '../core/util.js';
import { lbl, t } from '../i18n/index.js';
import { OFFER } from '../data/offers.js';
import { GENRES, STATS, TRAIN, TRAIN_COST } from '../data/rules.js';
import { S, abs, addLog, byId } from '../state.js';
import { fame, fit, genPool } from './artists.js';
import { awardToShow, awards, setAwardToShow } from './awards.js';
import { compDone, compTick } from './batches.js';
import { evInfo, liveEvents, randomEvents, resolveEv } from './events.js';
import { book, finClose, mtB, poolSize, weekV2 } from './ext2.js';
import { dqList, viewDebutQ } from './ext3.js';
import { effSk, genMgrPool, mgrAuto, mgrExp, mgrOf, msk } from './managers.js';
import { bizLv, modV, weekWorld } from './market.js';
import { genOffers } from './offers.js';
import { promoWeek } from './promo.js';
import { buildProps, propCount } from './proposals.js';
import { getRel, groupsOf, setRel } from './relations.js';
import { evalAll } from './review.js';
import { runCbPlans } from './secretary.js';
import { act } from '../ui/building.js';
import { view } from '../ui/modal.js';
import { startPlan } from '../ui/planning.js';
import { setRepDay, viewAward, viewReport, viewSkipWarn } from '../ui/views.js';

/* ================= WEEK ================= */
export const TTS_BOOST=3;
export const TTS_DECAY=.25;
export function ttsDecay(a){const tr=new Set();a.days.forEach(k=>{if(TRAIN[k])Object.keys(TRAIN[k].g).forEach(x=>tr.add(x))});
  const rest=a.days.filter(k=>k==='rest').length,p=TTS_DECAY+(rest>=5?.25:0)+(a.mood<30?.15:0)-msk(a,'plan')*.015;let tot=0;
  for(const x in a.st){if(tr.has(x))continue;if(Math.random()<p){const d=+rnd(.3,1).toFixed(1);a.st[x]=clamp(+(a.st[x]-d).toFixed(1),0,100);tot+=d}}
  return +tot.toFixed(1)}
export function trainDay(a,k){
  const t=TRAIN[k]||TRAIN.rest,ef=(a.status==='trainee'?TTS_BOOST:1)*(a.energy<25?.4:1)*(1+msk(a,'plan')*.04)*modV('train')*(1+bizLv('academy')*.06);let gs=0;
  for(const s in t.g){const g=t.g[s]*.22*a.talent*ef*(1-a.st[s]/125)*rnd(.8,1.2)*mtB(a,s);a.st[s]=clamp(+(a.st[s]+g).toFixed(2),0,100);gs+=g}
  if(k==='rest'){a.energy=clamp(a.energy+12,0,100);a.mood=clamp(a.mood+1.2,0,100)}
  else{a.energy=clamp(a.energy+t.e*.3*(1-msk(a,'care')*.04),0,100);a.mood=clamp(a.mood-.3,0,100);S.money-=TRAIN_COST/5;book('trn',-TRAIN_COST/5)}
  if(a.energy<20)a.mood=clamp(a.mood-1.2,0,100);
  return +gs.toFixed(2);
}
export function qLabel(q){return q>=1.25?'Xuất sắc':q>=1?'Tốt':q>=.8?'Ổn':'Chưa tốt'}
export function applyLesson(a,lesson,q){const out=[];for(const k in lesson){const g=lesson[k]*(.8+q*.3);a.st[k]=clamp(+(a.st[k]+g).toFixed(1),0,100);out.push(`${STATS[k]} +${g.toFixed(1)}`)}return out.join(', ')}
export function completeBusy(a){
  const b=a.busy;a.busy=null;
  if(b.kind==='offer'){
    const O=OFFER[b.type],f=fit(a,b.w),q=clamp(f/Math.max(b.L,10),.5,1.6)*rnd(.85,1.15)*(1+(b.chem||0));
    const mates=(b.mates||[]).filter(i=>i!==a.id).map(byId).filter(Boolean);for(const m of mates)setRel(a,m,getRel(a,m)+R(2,5));
    const fg=Math.round(R(O.fans[0],O.fans[1])*.4*q*(1+fame(a)/150));
    a.fans+=fg;a.yr.fans+=fg;S.money+=b.pay;book('job',b.pay,[a]);
    const ls=applyLesson(a,O.lesson,q),lt=pick(O.lt);
    a.lessons.unshift({t:`${O.n} «${b.title}»`+(mates.length?' cùng '+mates.map(x=>x.name).join(', '):''),l:lt,s:ls,y:S.year});if(a.lessons.length>12)a.lessons.length=12;
    S.partners[b.partner]=clamp(Math.round((S.partners[b.partner]||0)+R(6,12)*q),0,100);
    a.pw[b.partner]=(a.pw[b.partner]||0)+1;
    if(b.costar)a.co[b.costar]=clamp((a.co[b.costar]||0)+R(10,20),0,100);
    if(O.film){a.yr.actQ=Math.max(a.yr.actQ,Math.round(f*q));a.actor=a.actor||a.status==='debuted';if(a.wantAct){a.wantAct=0;a.mood=clamp(a.mood+10,0,100)}}
    if(b.type==='variety')a.yr.variety++;
    a.wc=(a.wc||0)+1;
    {const m=mgrOf(a);if(m)mgrExp(m)}
    a.mood=clamp(a.mood+6,0,100);a.energy=clamp(a.energy-10,0,100);
    a.hist.unshift(`N${S.year}: ${O.n} «${b.title}» – ${qLabel(q)}`);
    addLog(`✅ ${a.name} hoàn thành «${b.title}» (${qLabel(q)}): +${fmt(b.pay)}, +${fmtN(fg)} fan. Bài học: ${lt} (${ls}).`,'good');
  }else if(b.kind==='shoot'){
    const film=S.films.find(x=>x.id===b.filmId);
    const q=rnd(.9,1.25),ls=applyLesson(a,{acting:5,stamina:1},q);
    a.lessons.unshift({t:`Phim «${b.title}»`,l:'Hiểu cả công việc phía sau máy quay',s:ls,y:S.year});
    if(film){a.yr.actQ=Math.max(a.yr.actQ,Math.round(fit(a,GENRES[film.genre].w)*q));
      if(!S.artists.some(x=>x.busy&&x.busy.filmId===film.id)){film.status='Hậu kỳ';film.releaseAt=abs()+2}}
    a.actor=true;a.wc=(a.wc||0)+1;a.hist.unshift(`N${S.year}: Đóng phim công ty «${b.title}»`);
    addLog(`🎬 ${a.name} đóng máy phim «${b.title}». ${ls}.`,'good');
  }else if(b.kind==='promo'){addLog(`🎤 ${a.name} kết thúc đợt quảng bá.`)}
  else if(b.kind==='concert'){addLog(`🏟️ ${a.name} trở về sau concert.`)}
  else if(b.kind==='leave'){a.mood=clamp(a.mood+10,0,100);addLog(`🌴 ${a.name} quay lại sau kỳ nghỉ.`)}
  else if(b.kind==='comp')compDone(a,b);
}
export function releaseFilm(f){
  const cast=f.cast.map(byId).filter(Boolean);
  const w=GENRES[f.genre].w;
  const ft=cast.length?cast.reduce((s,a)=>s+fit(a,w),0)/cast.length:R(35,75);
  const fm=cast.length?cast.reduce((s,a)=>s+fame(a),0)/cast.length:R(10,50);
  const mult=Math.max(.1,.2+ft/100*1.3+fm/100*.6+rnd(-.4,.5)+(f.own?0:.05));
  const rev=Math.round(f.budget*mult),inc=Math.round(rev*f.share);
  S.money+=inc;book('film',inc,cast);f.done=true;f.mult=+mult.toFixed(2);f.rev=rev;f.inc=inc;f.status='Đã chiếu';f.y=S.year;
  for(const a of cast){const g=Math.round(rev/1e6*R(15,30));a.fans+=g;a.yr.fans+=g}
  addLog(`🎞️ Phim «${f.title}» ra rạp: doanh thu ${fmt(rev)} (x${f.mult}), công ty nhận ${fmt(inc)}${f.own?'':' từ phần góp vốn'}.`,mult>=1?'gold':'bad');
}
export const DAYS=['T2','T3','T4','T5','T6','T7','CN'];
export const defaultDays=k=>k==='rest'?Array(7).fill('rest'):[k,k,k,k,k,'rest','rest'];
export function ensureDays(a){if(!Array.isArray(a.days)||a.days.length!==7)a.days=defaultDays(a.sched||'vocal');a.days=a.days.map(k=>TRAIN[k]?k:'rest')}
export const daysMini=a=>a.days.map(k=>TIC[k]).join('');
export const trainDays=a=>a.days.filter(k=>k!=='rest').length;
export function weekCost(){return S.artists.reduce((s,a)=>s+a.salary+(a.busy?0:trainDays(a)*TRAIN_COST/5),0)+S.managers.reduce((s,m)=>s+m.salary,0)+(S.assts||[]).reduce((s,x)=>s+x.sal,0)+S.artists.reduce((t,a)=>t+(a.pa?a.pa.sal:0),0)+(S.hs?S.hs.sal:0)}
export const TIC={vocal:'🎤',dance:'🪩',rap:'🎧',acting:'🎭',variety:'😂',gym:'🏋️',rest:'🛌'};
export const STAT2T={vocal:'vocal',dance:'dance',rap:'rap',acting:'acting',variety:'variety',visual:'gym',stamina:'gym'};
export function focusKeys(a){const idol=groupsOf(a).length||a.solo;if(a.status==='trainee')return['vocal','dance','rap','visual'];if(a.actor&&!idol)return['acting','visual','variety','stamina'];if(a.actor)return['vocal','dance','acting','visual','variety'];return['vocal','dance','rap','visual','variety','stamina']}
export function planWeek(a,skill=10){
  let e=a.energy,mo=a.mood;const st={...a.st},out=[],ks0=focusKeys(a);
  for(let d=0;d<7;d++){let k;
    if(e<40||mo<28)k='rest';
    else if(a.wantAct&&d%2===0)k='acting';
    else{let ks=ks0;if(skill<4&&Math.random()<.35)ks=[pick(ks)];k=STAT2T[ks.reduce((m,x)=>st[x]<st[m]?x:m)];for(const g in TRAIN[k].g)st[g]+=TRAIN[k].g[g]*1.2}
    if(k==='rest'){e=Math.min(100,e+12);mo=Math.min(100,mo+1.2)}else{e=Math.max(0,e+TRAIN[k].e*.3);mo-=.3}
    out.push(k)}
  if(!out.includes('rest'))out[6]='rest';
  if(a.restRec&&a.restRec>abs()){let c=out.filter(k=>k==='rest').length;for(let i=6;i>=0&&c<(a.restN||3);i--)if(out[i]!=='rest'){out[i]='rest';c++}}
  return out;
}
// planWhy chỉ hiển thị (viewPlan), không vào log/S nên dịch tại chỗ
export function planWhy(a){if(a.energy<40)return t('plan.why.energy');if(a.mood<28)return t('plan.why.mood');if(a.wantAct)return t('plan.why.act');const k=focusKeys(a).reduce((m,x)=>a.st[x]<a.st[m]?x:m);return t('plan.why.focus',{s:lbl('stat',k),v:Math.round(a.st[k])})}
export function projEnergy(a){let e=a.energy;return a.days.map(k=>{e=clamp(e+(k==='rest'?12:TRAIN[k].e*.3),0,100);return Math.round(e)})}
export const mgrSchedules=a=>{if(a.pm)return a.pm;const m=mgrOf(a);return m&&m.ps===1?m:null};
export function mgrScheduleAll(){for(const a of S.artists){if(a.busy)continue;const m=mgrSchedules(a);if(m)a.days=planWeek(a,effSk(m,'plan'))}}
export function setPs(id,v){const m=S.managers.find(x=>x.id===id);if(m){S.props=null;m.ps=+v;if(m.ps===1)mgrScheduleAll();act()}}
export function nextWeek(force,planned){
  if(liveEvents().length&&!force)return view(viewSkipWarn);
  if(!planned)buildProps();
  if(!planned&&((S.planOn!==false&&S.artists.some(a=>!a.busy))||propCount()))return startPlan(force);
  mgrScheduleAll();
  if(force)for(const e of [...S.events]){const inf=evInfo(e);if(inf)resolveEv(e.id,inf.o[inf.o.length-1].k,true);else S.events=S.events.filter(x=>x!==e)}
  const now=abs(),logMark=S.log[0],rep={y:S.year,w:S.week,a:{},ev:[],m0:S.money},f0={};S.artists.forEach(a=>f0[a.id]=a.fans);
  promoWeek();
  for(const a of [...S.artists]){
    if(a.busy){rep.a[a.id]={b:a.busy.title};a.busy.left--;if(a.busy.left<=0){const bk=a.busy.kind,bt=a.busy.title;completeBusy(a);if(bk==='offer'||bk==='shoot')rep.a[a.id].done=bt}}
    else{ensureDays(a);rep.a[a.id]={d:a.days.map(k=>{const g=trainDay(a,k);return[k,g,Math.round(a.energy),Math.round(a.mood)]})}}
    if(a.status==='trainee'&&rep.a[a.id]&&rep.a[a.id].d){const dc=ttsDecay(a);if(dc)rep.a[a.id].dec=dc}
    if(a.scandal){a.fans=Math.round(a.fans*(1-.02*a.scandal.sev));a.scandal.left--;if(a.scandal.left<=0){a.scandal=null;addLog(`🌤️ Scandal của ${a.name} đã lắng xuống.`)}}
    if(a.status==='debuted')a.fans=Math.max(0,Math.round(a.fans*.996+fame(a)*3*modV('fan')*(1+bizLv('media')*.15)));
    if(a.wantAct&&now>=a.wantAct){a.wantAct=0;a.mood=clamp(a.mood-20,0,100);addLog(`😞 ${a.name} thất vọng vì lời hứa tìm vai diễn chưa thành.`,'bad')}
    S.money-=a.salary;book('sal',-a.salary);
    {const c=msk(a,'care');if(c)a.mood=clamp(a.mood+c*.25,0,100)}
    if(S.money<0)a.mood=clamp(a.mood-2,0,100);
  }
  for(const f of S.films)if(!f.done&&f.status!=='Đang quay'&&f.releaseAt&&f.releaseAt<=now)releaseFilm(f);
  S.offers=S.offers.filter(o=>o.exp>now);
  genOffers(R(2,4)+(S.artists.length>6?1:0)+(S.artists.length>12?1:0));
  {const nt=S.artists.filter(a=>a.status==='trainee').length,ho=S.offers.filter(o=>OFFER[o.type].tj).length;if(nt&&ho<Math.min(5,1+Math.ceil(nt/3)))genOffers(R(1,2),1)}
  if(S.offers.length>22)S.offers=S.offers.slice(-22);
  compTick();
  {const dn=S.films.filter(x=>x.done);if(dn.length>40){const keep=new Set(dn.slice(-40));S.films=S.films.filter(x=>!x.done||keep.has(x))}}
  if(S.singles.length>60)S.singles.length=60;if(S.concerts.length>60)S.concerts=S.concerts.slice(-60);
  for(const a of S.artists)if(a.hist.length>30)a.hist.length=30;
  if(S.week%4===0)genPool(poolSize());
  if(S.week%8===0)genMgrPool();
  for(const m of S.managers){S.money-=m.salary;book('mgr',-m.salary)}
  const bizP=weekWorld();
  mgrAuto();
  randomEvents();
  weekV2();
  if(S.money<0)addLog(`⚠️ Công ty đang âm ${fmt(-S.money)}. Nghệ sĩ bắt đầu lo lắng!`,'bad');
  if(abs()%4===0)evalAll();
  finClose();
  S.week++;
  if(S.week>52){awards();S.week=1;S.year++}
  runCbPlans();
  {const ix=S.log.indexOf(logMark);rep.ev=(ix<0?S.log:S.log.slice(0,ix)).slice(0,30).map(l=>l.t);rep.m1=S.money;if(S.lastEval&&S.lastEval.w===abs()-1)rep.evl=1;rep.biz=bizP;for(const a of S.artists)if(rep.a[a.id])rep.a[a.id].f=a.fans-(f0[a.id]||0);S.lastRep=rep}
  act();
  setRepDay(0);
  if(awardToShow){const e=awardToShow;setAwardToShow(null);view(()=>viewAward(e))}
  else if(S.dqOn!==false&&dqList().length)view(viewDebutQ);
  else if(S.repOn!==false)view(viewReport);
}
