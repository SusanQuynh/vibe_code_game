import { R, pick, pickI, rnd } from '../core/rng.js';
import { Lk, money, t } from '../i18n/index.js';
import { clamp, fmtN } from '../core/util.js';
import { SONGS } from '../data/names.js';
import { PARTNERS, RIVALS } from '../data/offers.js';
import { CONCEPTS } from '../data/rules.js';
import { S, abs, addLog, byId } from '../state.js';
import { fame } from './artists.js';
import { hasEv, pushEv } from './events.js';
import { book, pct } from './ext2.js';
import { msk } from './managers.js';
import { actByKey } from './releases.js';
import { actFree, acts } from './secretary.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

/* ================= MARKET: TRENDS, RIVALS, SURPRISES ================= */
export const modV=k=>{const m=S.mods&&S.mods[k];return m&&m.until>abs()?m.v:1};
export const setMod=(k,v,w,n)=>{S.mods=S.mods||{};S.mods[k]={v,until:abs()+w,n}};
export const trendB=k=>S.trend?(S.trend.hot.includes(k)?12:S.trend.cold===k?-8:0):0;
export const trendTag=k=>S.trend?(S.trend.hot.includes(k)?' 🔥':S.trend.cold===k?' ❄️':''):'';
export const totalFans=()=>S.artists.reduce((t,a)=>t+a.fans,0);
export function newTrend(force){const ks=Object.keys(CONCEPTS).sort(()=>Math.random()-.5);
  let hot=[ks[0],ks[1]];if(force)hot=[force,ks.find(k=>k!==force)];const cold=ks.find(k=>!hot.includes(k));
  S.trend={hot,cold,until:abs()+R(6,10)};addLog(Lk('log.mk.trend',{a:Lk(`concept.${hot[0]}`),b:Lk(`concept.${hot[1]}`),c:Lk(`concept.${cold}`)}),'gold')}
export function initWorld(){
  if(!Array.isArray(S.rivals))S.rivals=RIVALS.map(([n,b],i)=>({id:i+1,n,fans:Math.round(b*Math.pow(1.4,S.year-1)),g:+(.005+Math.random()*.004).toFixed(4),f0:0,last:'',stole:0,cb:null}));
  S.rivals.forEach(r=>{if(!r.f0)r.f0=r.fans});
  if(!S.trend)newTrend();if(!S.mods)S.mods={};if(!Array.isArray(S.biz))S.biz=[];if(!S.camp)S.camp={};if(!S.ui)S.ui={};
}
export function rivalPress(){return(S.rivals||[]).filter(r=>r.cb&&r.cb.w>=abs()-1).reduce((t,r)=>t+r.cb.p,0)}
export function rivalsTick(){const now=abs();
  for(const r of S.rivals){
    r.fans=Math.round(r.fans*(1+r.g*rnd(.3,1.7))+R(0,600));
    if(Math.random()<.11){const ck=Math.random()<.6?pick(S.trend.hot):pick(Object.keys(CONCEPTS)),p=clamp(Math.round(Math.log10(r.fans+10)*1.6+R(-2,2)),2,10),rank=clamp(Math.round(42-p*3.6+R(-8,14)),1,100);
      r.cb={w:now,t:pick(SONGS),ck,p,rank};r.fans+=Math.round((101-rank)*R(60,160));r.last=Lk('riv.cb',{t:r.cb.t,c:Lk(`concept.${ck}`),r:rank});
      addLog(Lk('log.mk.cb',{n:r.n,t:r.cb.t,c:Lk(`concept.${ck}`),r:rank}))}
    if(Math.random()<.02){r.fans=Math.round(r.fans*.9);r.last=Lk('riv.scandal');addLog(Lk('log.mk.rscan',{n:r.n}),'good')}
  }
  if(S.offers.length>2&&Math.random()<.2){const r=pick(S.rivals),of=S.offers.filter(o=>!o.invested&&!o.target).sort((x,y)=>y.pay-x.pay)[R(0,1)];
    if(of){S.offers=S.offers.filter(o=>o!==of);r.stole=(r.stole||0)+1;r.last=Lk('riv.stole',{t:of.title});addLog(Lk('log.mk.stole',{n:r.n,t:of.title,o:Lk(`offer.${of.type}`)}),'bad')}}
  const cand=S.artists.filter(a=>a.status==='debuted'&&a.fans>=6000&&!a.busy&&!hasEv(a.id,'poach'));
  if(cand.length&&Math.random()<.06){const a=pick(cand);if(Math.random()<1.1-a.mood/100-msk(a,'care')*.03){const r=pick(S.rivals);pushEv({kind:'poach',a:a.id,r:r.n,fee:clamp(Math.round(a.fans*1500/1e6)*1e6,30e6,3e9)})}}
}
export const SXD={
  fire:{ic:'🔥',t:()=>t('sx.fire.t'),d:()=>t('sx.fire.d'),o:()=>[{k:'fix',l:t('sx.fire.o.fix',{m:money(60e6)})},{k:'cheap',l:t('sx.fire.o.cheap',{m:money(15e6)})}]},
  sponsor:{ic:'🤝',t:()=>t('sx.sponsor.t'),d:e=>t('sx.sponsor.d',{p:e.p,m:money(e.v)}),o:()=>[{k:'yes',l:t('sx.sponsor.o.yes')},{k:'no',l:t('ev.o.refuse')}]},
  tax:{ic:'🧾',t:()=>t('sx.tax.t'),d:()=>t('sx.tax.d'),o:()=>[{k:'law',l:t('sx.tax.o.law',{m:money(40e6)})},{k:'pay',l:t('sx.tax.o.pay')}]},
  festival:{ic:'🌏',t:()=>t('sx.festival.t'),d:e=>t('sx.festival.d',{n:e.n,m:money(50e6)}),o:()=>[{k:'yes',l:t('sx.festival.o.yes',{m:money(50e6)})},{k:'no',l:t('ev.o.refuse')}]},
  leak:{ic:'💧',t:()=>t('sx.leak.t'),d:()=>t('sx.leak.d'),o:()=>[{k:'embrace',l:t('sx.leak.o.embrace')},{k:'sue',l:t('sx.leak.o.sue',{m:money(20e6)})},{k:'ignore',l:t('sx.leak.o.ignore')}]},
  investor:{ic:'💼',t:()=>t('sx.investor.t'),d:e=>t('sx.investor.d',{p:e.p,m:money(e.v),w:money(Math.round(e.v*1.3/26/1e6)*1e6)}),o:()=>[{k:'yes',l:t('sx.investor.o.yes')},{k:'no',l:t('ev.o.refuse')}]}
};
export function surprise(){
  if(Math.random()>.24)return;
  const deb=S.artists.filter(a=>a.status==='debuted'),free=acts().filter(actFree);
  const pool=['fire','tax','sponsor','investor','boom','crisis','gift','challenge'];
  if(deb.length)pool.push('viral','viral','leak','injury');if(free.length&&deb.length)pool.push('festival');
  const k=pick(pool),now=abs();
  if(k==='viral'){const a=pick(deb),g=Math.round(R(3000,12000)*(1+fame(a)/50));a.fans+=g;a.yr.fans+=g;a.mood=clamp(a.mood+8,0,100);addLog(Lk('log.mk.viral',{n:a.name,f:fmtN(g)}),'gold')}
  else if(k==='boom'){setMod('fan',1.6,4,Lk('mod.wave'));addLog(Lk('log.mk.boom'),'gold')}
  else if(k==='crisis'){setMod('pay',.8,6,Lk('mod.pay'));setMod('econ',.7,6,Lk('mod.econ'));addLog(Lk('log.mk.crisis'),'bad')}
  else if(k==='gift'){S.artists.forEach(a=>a.mood=clamp(a.mood+8,0,100));addLog(Lk('log.mk.gift'),'good')}
  else if(k==='challenge'){const c=pick(Object.keys(CONCEPTS));newTrend(c);addLog(Lk('log.mk.chal',{c:Lk(`concept.${c}`)}),'gold')}
  else if(k==='injury'){const c=deb.filter(a=>!a.busy);if(!c.length)return;const a=pick(c);a.busy={kind:'leave',title:Lk('b.injury'),left:2,total:2};a.mood=clamp(a.mood-10,0,100);addLog(Lk('log.mk.injury',{n:a.name}),'bad')}
  else if(k==='sponsor')pushEv({kind:'sx',sx:k,p:pick(PARTNERS.ad),v:Math.round(R(40,150)*(1+S.year*.3))*1e6},true);
  else if(k==='investor')pushEv({kind:'sx',sx:k,p:Lk(`fund.${pickI(3)}`),v:Math.round(R(200,500)*(1+S.year*.2))*1e6},true);
  else if(k==='festival'){const x=pick(free);pushEv({kind:'sx',sx:k,act:x.k,n:x.n.slice(2)},true)}
  else pushEv({kind:'sx',sx:k},true);
  toast(t('sx.toast'));
}
export function sxResolve(e,k){
  const D=SXD[e.sx];
  switch(e.sx+':'+k){
    case'fire:fix':S.money-=60e6;addLog(Lk('log.mk.fixed'));break;
    case'fire:cheap':S.money-=15e6;setMod('train',.8,4,Lk('mod.train'));addLog(Lk('log.mk.cheap'),'bad');break;
    case'sponsor:yes':S.money+=e.v;S.artists.forEach(a=>{if(a.status==='debuted')a.fans=Math.round(a.fans*.99)});addLog(Lk('log.mk.spon',{m:{$:e.v},p:e.p}),'good');break;
    case'sponsor:no':S.artists.forEach(a=>a.mood=clamp(a.mood+3,0,100));addLog(Lk('log.mk.sponNo'));break;
    case'tax:law':S.money-=40e6;if(Math.random()<.6)addLog(Lk('log.mk.taxWin'),'good');else{const f=clamp(Math.round(Math.abs(S.money)*.05/1e6)*1e6,30e6,300e6);S.money-=f;addLog(Lk('log.mk.taxFine',{m:{$:f}}),'bad')}break;
    case'tax:pay':{const f=clamp(Math.round(Math.abs(S.money)*.04/1e6)*1e6,20e6,250e6);S.money-=f;addLog(Lk('log.mk.taxPay',{m:{$:f}}),'bad');break}
    case'festival:yes':{const A=actByKey(e.act);if(!A||!actFree(A)||S.money<50e6){addLog(Lk('log.mk.festNo'),'bad');break}S.money-=50e6;for(const id of A.m){const a=byId(id),g=R(5000,15000);a.fans+=g;a.yr.fans+=g;a.busy={kind:'concert',title:Lk('b.festival'),left:1,total:1,lk:'concert'}}addLog(Lk('log.mk.fest',{n:e.n}),'gold');break}
    case'festival:no':break;
    case'leak:embrace':if(Math.random()<.6){S.artists.filter(a=>a.status==='debuted').forEach(a=>a.fans+=R(500,2500));addLog(Lk('log.mk.leakOk'),'good')}else addLog(Lk('log.mk.leakNo'));break;
    case'leak:sue':S.money-=20e6;addLog(Lk('log.mk.leakSue'));break;
    case'leak:ignore':S.artists.filter(a=>a.status==='debuted').forEach(a=>a.mood=clamp(a.mood-5,0,100));addLog(Lk('log.mk.leakIgn'),'bad');break;
    case'investor:yes':S.money+=e.v;S.loan={pay:Math.round(e.v*1.3/26/1e6)*1e6,left:26,n:e.p};addLog(Lk('log.mk.inv',{m:{$:e.v},p:e.p,l:{$:S.loan.pay}}),'good');break;
  }
}
/* ---- business investments ---- */
export const BIZ={
  cafe:{ic:'☕',cost:150e6,base:5e6,syn:.8,vol:.3},
  food:{ic:'🍜',cost:350e6,base:11e6,syn:.2,vol:.25},
  media:{ic:'📹',cost:250e6,base:5e6,syn:.6,vol:.4},
  academy:{ic:'🏫',cost:500e6,base:8e6,syn:.1,vol:.2},
  fashion:{ic:'👗',cost:450e6,base:13e6,syn:1,vol:.45},
  beauty:{ic:'💄',cost:700e6,base:19e6,syn:1,vol:.5},
  game:{ic:'🎮',cost:900e6,base:26e6,syn:.5,vol:1.1},
  estate:{ic:'🏢',cost:1200e6,base:22e6,syn:0,vol:.1}
};
export const bizLv=k=>{const b=(S.biz||[]).find(x=>x.k===k);return b?b.lv:0};
export const upCost=b=>Math.round(BIZ[b.k].cost*.7*b.lv);
export function bizTick(){const fF=clamp(totalFans()/300000,0,2);let t=0;
  for(const b of S.biz){const B=BIZ[b.k];const p=Math.round(B.base*b.lv*(1+B.syn*fF)*rnd(1-B.vol,1+B.vol)*modV('econ')/1e5)*1e5;const q=Math.round(p*bizOwn(b));b.last=p;b.tot+=q;t+=q}
  S.money+=t;book('biz',t);if(S.loan){S.money-=S.loan.pay;S.loan.left--;if(S.loan.left<=0){addLog(Lk('log.mk.loanDone',{n:S.loan.n}),'good');S.loan=null}}
  return t}
export function buyBiz(k){const B=BIZ[k];if(bizLv(k))return;if(S.money<B.cost)return toast(t('toast.noMoney'));S.money-=B.cost;S.biz.push({k,lv:1,inv:B.cost,tot:0,last:0,y:S.year});addLog(Lk('log.mk.open',{i:B.ic,b:Lk(`biz.${k}`),m:{$:B.cost}}),'gold');act()}
export function upBiz(k){const b=S.biz.find(x=>x.k===k);if(!b||b.lv>=5)return;const c=upCost(b);if(S.money<c)return toast(t('toast.noMoney'));S.money-=c;b.inv+=c;b.lv++;addLog(Lk('log.mk.up',{i:BIZ[k].ic,b:Lk(`biz.${k}`),l:b.lv}),'good');act()}
export function sellBiz(k,btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent=t('btn.tapAgain');return}const b=S.biz.find(x=>x.k===k);if(!b)return;const v=Math.round(b.inv*.6*bizOwn(b));S.money+=v;S.biz=S.biz.filter(x=>x!==b);addLog(Lk('log.mk.sell',{i:BIZ[k].ic,b:Lk(`biz.${k}`),m:{$:v}}));act()}
export const bizOwn=b=>b.own??1;
export const bizVal=b=>{const B=BIZ[b.k],fF=clamp(totalFans()/300000,0,2),exp=B.base*b.lv*(1+B.syn*fF);return Math.round((b.inv+exp*26)/1e6)*1e6};
export const bizWait=b=>Math.max(0,8-(abs()-(b.rw??-99)));
export function raiseBiz(k,pct){const b=S.biz.find(x=>x.k===k);if(!b)return;if(Math.round((bizOwn(b)-pct)*100)<51)return toast(t('invest.toast.keep51'));if(bizWait(b))return toast(t('invest.toast.wait',{w:bizWait(b)}));const v=Math.round(bizVal(b)*pct);S.money+=v;b.own=bizOwn(b)-pct;b.rw=abs();addLog(Lk('log.mk.raise',{b:Lk(`biz.${k}`),p:Math.round(pct*100),f:Lk(`fund.${pickI(3)}`),m:{$:v}}),'gold');act()}
export function buybackBiz(k){const b=S.biz.find(x=>x.k===k);if(!b||bizOwn(b)>=1)return;const c=Math.round(bizVal(b)*(1-bizOwn(b))*1.15);if(S.money<c)return toast(t('toast.noMoney'));S.money-=c;b.own=1;addLog(Lk('log.mk.buyback',{b:Lk(`biz.${k}`),m:{$:c}}),'good');act()}
export function weekWorld(){
  if(!S.trend||abs()>=S.trend.until)newTrend();
  rivalsTick();surprise();
  for(const k in S.mods)if(S.mods[k].until<=abs())delete S.mods[k];
  return bizTick();
}
