import { R, pick } from '../core/rng.js';
import { clamp, fmt } from '../core/util.js';
import { COSTARS } from '../data/names.js';
import { OFFER, PARTNERS } from '../data/offers.js';
import { GENRES, STATS } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fame, fit, genTitle } from './artists.js';
import { tagScore } from './debut.js';
import { dHold } from './ext2.js';
import { msk } from './managers.js';
import { modV } from './market.js';
import { sameGroup } from './relations.js';
import { actByKey } from './releases.js';
import { wkLabel } from './secretary.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

/* ================= OFFERS ================= */
export function genOffers(n,tj){
  const types=Object.keys(OFFER).filter(k=>!!OFFER[k].tj===!!tj);
  for(let i=0;i<n;i++){
    const type=pick(types),O=OFFER[type],partner=pick(PARTNERS[type]);
    const L=tj?clamp(R(8,20)+(S.year-1)*4,6,45):clamp(R(12,30)+(S.year-1)*6+Math.floor(S.week/13)*2,10,85);
    let w,genre=null;
    if(O.film){genre=pick(Object.keys(GENRES));w=GENRES[genre].w}else w=O.req;
    const mx=Math.max(...Object.values(w)),req={};
    for(const k in w)if(w[k]/mx>=.5)req[k]=Math.round(L*w[k]/mx);
    const of={id:uid(),type,partner,genre,w,req,L,fame:Math.round(O.fame*(1+(S.year-1)*.3)*Math.random()),
      weeks:R(O.wk[0],O.wk[1]),pay:Math.round(R(O.pay[0],O.pay[1])*(1+(S.year-1)*.15))*1e6,
      costar:(O.film||type==='variety')?pick(COSTARS):null,exp:abs()+R(2,4),title:genTitle(type),target:null,invest:null,invested:false,slots:(O.sl&&O.sl[1]>1&&Math.random()<.45)?R(2,O.sl[1]):1};
    const rel=S.partners[partner]||0;
    const cands=S.artists.filter(a=>a.status==='debuted'||O.trainee);
    if(cands.length&&((rel>=35&&Math.random()<.55)||Math.random()<.1)){
      cands.sort((x,y)=>((y.pw[partner]||0)*20+fame(y)+(y.co[of.costar]||0)/5)-((x.pw[partner]||0)*20+fame(x)+(x.co[of.costar]||0)/5));
      of.target=cands[0].id;of.pay=Math.round(of.pay*1.3/1e6)*1e6;
    }
    if(type==='drama'||type==='movie')of.invest={budget:of.pay*R(8,14),share:pick([.05,.1,.15,.2])};
    S.offers.push(of);
  }
}
export function disc(of,a){return clamp((S.partners[of.partner]||0)/100*.3+(of.target===a.id?.2:0)+(of.costar?(a.co[of.costar]||0)/100*.1:0)+msk(a,'nego')*.015,0,.65)}
export const effReq=(of,a)=>{const d=disc(of,a),r={};for(const k in of.req)r[k]=Math.round(of.req[k]*(1-d));return r};
export const effPay=(of,a)=>Math.round(modV('pay')*of.pay*(1+(S.partners[of.partner]||0)/200)*(1+fame(a)/250)*(1+msk(a,'nego')*.04)/1e6)*1e6;
export function canTake(of,a){
  const O=OFFER[of.type];
  if(a.busy)return'Đang bận';
  if(dHold(a))return'Chừa lịch debut';
  if(a.status!=='debuted'&&!O.trainee)return'Chưa ra mắt';
  if(of.target&&of.target!==a.id&&slotsOf(of)<2)return'Mời người khác';
  if(a.scandal&&a.scandal.sev>=2)return'Đang dính scandal';
  {const h=cbHold(a);if(h&&abs()+of.weeks>h.w)return`Chừa lịch comeback ${wkLabel(h.w)}`}
  const d=disc(of,a);if(fame(a)<Math.round(of.fame*(1-d)))return'Chưa đủ danh tiếng';
  const r=effReq(of,a);for(const k in r)if(a.st[k]<r[k])return'Thiếu '+STATS[k];
  return'';
}
export const slotsOf=of=>of.slots||1;
export const offerOrder=list=>list.slice().reverse().sort((x,y)=>(byId(x.target)?0:1)-(byId(y.target)?0:1));
export function cbHold(a){let best=null;for(const p of (S.cbPlan||[])){const x=actByKey(p.k);if(x&&x.m.includes(a.id)&&(!best||p.w<best.w))best=p}return best}
export function chem(ids){let c=0;const ms=ids.map(byId).filter(Boolean);for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++){const t=ms[i].tag[ms[j].id];c+=t==='friend'?.08:t==='enemy'?-.12:(t==='dating'||t==='public')?.04:0;if(sameGroup(ms[i],ms[j]))c+=.05}return clamp(+c.toFixed(2),-.3,.3)}
export function bestCast(of,pool){
  const el=pool.filter(a=>!canTake(of,a));if(!el.length)return null;
  let first;if(of.target){first=el.find(a=>a.id===of.target);if(!first)return null}
  el.sort((x,y)=>fit(y,of.w)-fit(x,of.w));const pk=[first||el[0]];
  while(pk.length<slotsOf(of)){let bc=null,bs=-1e9;for(const c of el){if(pk.includes(c))continue;const sc=fit(c,of.w)+pk.reduce((t,p)=>t+tagScore(p,c)+(sameGroup(p,c)?2:0),0)*2;if(sc>bs){bs=sc;bc=c}}if(!bc)break;pk.push(bc)}
  return pk.map(a=>a.id);
}
export function acceptOffer(ofId,aId,silent){return acceptCast(ofId,[aId],silent)}
export function acceptCast(ofId,ids,silent){
  const of=S.offers.find(o=>o.id===ofId);if(!of)return;
  ids=[...new Set(ids)].filter(i=>byId(i));
  if(!ids.length)return toast('Chọn ít nhất 1 nghệ sĩ');
  if(ids.length>slotsOf(of))return toast(`Dự án chỉ nhận tối đa ${slotsOf(of)} người`);
  if(of.target&&!ids.includes(of.target))return toast('Phải có người được mời đích danh');
  for(const i of ids){const why=canTake(of,byId(i));if(why)return toast(byId(i).name+': '+why)}
  const O=OFFER[of.type],c=ids.length>1?chem(ids):0,ms=ids.map(byId);
  for(const a of ms)a.busy={kind:'offer',type:of.type,title:of.title,partner:of.partner,costar:of.costar,left:of.weeks,total:of.weeks,pay:effPay(of,a),genre:of.genre,w:of.w,L:of.L,offerId:of.id,mates:ids,chem:c};
  S.offers=S.offers.filter(o=>o!==of);
  const f=S.films.find(x=>x.offerId===of.id);if(f)ids.forEach(i=>f.cast.push(i));
  addLog(`${O.ic} ${ms.map(a=>a.name).join(', ')} nhận ${O.n} «${of.title}» (${of.partner}), ${of.weeks} tuần${ids.length>1?` · ${ids.length} người${c?(c>0?', ăn ý +':', lục đục ')+Math.round(Math.abs(c)*100)+'%':''}`:''}.`);
  if(!silent)act();
}
export function investOffer(ofId){
  const of=S.offers.find(o=>o.id===ofId);if(!of||!of.invest||of.invested)return;
  const cost=Math.round(of.invest.budget*of.invest.share);
  if(S.money<cost)return toast('Không đủ tiền góp vốn');
  S.money-=cost;of.invested=true;
  S.films.push({id:uid(),title:of.title,genre:of.genre,own:false,budget:of.invest.budget,share:of.invest.share,cost,cast:[],offerId:of.id,status:'Sắp chiếu',releaseAt:abs()+of.weeks+R(1,3),done:false,y:S.year});
  addLog(`💰 Góp vốn ${fmt(cost)} (${of.invest.share*100}%) vào phim «${of.title}».`);act();
}
