import { R, pick } from '../core/rng.js';
import { t, t as tl, tVi } from '../i18n/index.js';
import { domName } from '../i18n/labels.js';
import { clamp, fmt } from '../core/util.js';
import { LNM, MGN } from '../data/names.js';
import { DOM_KEYS, MDOM, MSK } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { mkLook } from './artists.js';
import { MAX_SA, asstB, book } from './ext2.js';
import { acceptCast, bestCast } from './offers.js';
import { groupsOf } from './relations.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

export function genManager(){const sk={};for(const k in MSK)sk[k]=R(1,5);const sp=pick(Object.keys(MSK));sk[sp]=clamp(sk[sp]+R(2,4),1,10);const tot=Object.values(sk).reduce((a,b)=>a+b,0);
  const m={id:uid(),name:pick(LNM)+' '+pick(MGN),look:mkLook(Math.random()<.5?'F':'M',pick(['#333a56','#5b6b8c','#2f4f4f','#6b4f3a','#7a7f8c'])),sk,spec:sp,lv:1,exp:0,salary:Math.round(tot*.3)*1e6,fee:tot*3e6,as:null,auto:'off',ps:2};m.dom=pick(DOM_KEYS);return m}
export function genMgrPool(){S.mgrPool=[];for(let i=0;i<3;i++)S.mgrPool.push(genManager())}
export const mTot=m=>Object.values(m.sk).reduce((x,y)=>x+y,0);
export function mgrTargets(m){if(!m.as)return[];if(m.as.t==='t')return S.artists.filter(a=>a.status==='trainee');if(m.as.t==='b')return S.artists.filter(a=>a.status==='trainee'&&a.batch===m.as.id);if(m.as.t==='l')return(m.as.ids||[]).map(byId).filter(Boolean);if(m.as.t==='s')return S.artists.filter(a=>a.solo&&!a.pm);if(m.as.t==='d')return S.artists.filter(a=>a.actor);if(m.as.t==='a'){const a=byId(m.as.id);return a?[a]:[]}const g=S.groups.find(x=>x.id===m.as.id);return g?g.members.map(byId).filter(Boolean):[]}
export function mgrOf(a){let best=null;for(const m of S.managers)if(m.as&&mgrTargets(m).includes(a)&&(!best||mTot(m)>mTot(best)))best=m;return best}
export const mBoss=m=>m.boss?S.managers.find(x=>x.id===m.boss)||null:null;
export const mKids=m=>S.managers.filter(x=>x.boss===m.id);
export function inSub(root,x){for(const k of mKids(root))if(k===x||inSub(k,x))return true;return false}
export const gmOf=()=>S.managers.find(m=>m.gm)||null;
export const mCap=m=>m.gm?Infinity:2+Math.floor(m.lv/2);
/* GM bonus: 10% of GM skill for managers below the GM that are not direct reports (those already get the boss +20%) */
const gmB=(m,k)=>{const g=gmOf();return g&&g!==m&&m.boss!==g.id&&inSub(g,m)?Math.floor(g.sk[k]*.1):0};
export const effSk=(m,k)=>{const b=mBoss(m);return Math.min(10,m.sk[k]+(b?Math.floor(b.sk[k]*.2):0)+gmB(m,k)+asstB(m,k))};
export const msk=(a,k)=>{const m=mgrOf(a),v=m?effSk(m,k):0,b=a.pm?Math.max(v,a.pm.sk[k]||0):v;return Math.min(10,b+(a.pa&&a.pa.k===k?a.pa.v:0))};
export function givePM(a,quiet){if(a.pm)return;const sk={};for(const k in MSK)sk[k]=R(3,7);a.pm={id:-a.id,name:pick(LNM)+' '+pick(MGN),sk,lv:1,ps:1,boss:null};
  for(const m of S.managers){if(m.as&&m.as.t==='a'&&m.as.id===a.id)m.as=null;if(m.as&&m.as.t==='l')m.as.ids=m.as.ids.filter(i=>i!==a.id)}S.props=null;
  if(!quiet)addLog(`🧑‍💼 ${a.name} tách solo và tự chọn quản lý riêng: ${a.pm.name}. Văn phòng Quản lý không cần phụ trách nữa.`)}
export function setBoss(id,v){const m=S.managers.find(x=>x.id===id);if(!m)return;if(m.gm)return toast(t('mgr.toast.gmRpt'));
  if(!v){const g=gmOf();m.boss=g?g.id:null;addLog(g?`📋 ${m.name} báo cáo cho quản lý tổng ${g.name}.`:`📋 ${m.name} báo cáo trực tiếp Giám đốc.`)}
  else{const b=S.managers.find(x=>x.id===+v);if(!b||b===m||inSub(m,b))return toast(t('mgr.toast.loop'));if(mKids(b).length>=mCap(b))return toast(t('mgr.toast.cap',{n:b.name,c:mCap(b)}));m.boss=b.id;addLog(`📋 ${m.name} giờ báo cáo cho ${b.name}.`)}
  act()}
export function targetName(m,tr=tVi){if(!m.as)return tr('target.none');if(m.as.t==='t')return tr('target.allTts');if(m.as.t==='b'){const b=(S.batches||[]).find(x=>x.id===m.as.id);return b?tr('target.batch',{n:b.n}):tr('target.batchGone')}if(m.as.t==='s')return tr('target.allSolo');if(m.as.t==='d')return tr('target.allActors');if(m.as.t==='l'){const ts=mgrTargets(m);return ts.length?tr('target.list',{n:ts.length,names:ts.slice(0,2).map(a=>a.name).join(', ')+(ts.length>2?'…':'')}):tr('target.empty')}if(m.as.t==='g'){const g=S.groups.find(x=>x.id===m.as.id);return g?tr('target.group',{n:g.name}):'—'}const a=byId(m.as.id);return a?a.name:'—'}
export function mgrExp(m,n=1){const b=mBoss(m);if(b&&n>=.25)mgrExp(b,n*.5);m.exp=+(m.exp+n).toFixed(2);while(m.exp>=m.lv*4){m.exp-=m.lv*4;m.lv++;const ks=Object.keys(MSK).filter(k=>m.sk[k]<10),k=ks.length?pick(ks):null;if(k)m.sk[k]++;m.salary+=1e6;addLog(`📈 Quản lý ${m.name} lên cấp ${m.lv}${k?' ('+MSK[k]+' +1)':''}.`,'good')}}
export function mgrAuto(){for(const m of S.managers){if(m.auto==='off'||!m.as)continue;
  const free=()=>mgrTargets(m).filter(a=>!a.busy);
  const mine=o=>o.target&&mgrTargets(m).some(a=>a.id===o.target)?1:0;
  for(const of of S.offers.slice().sort((x,y)=>(mine(y)-mine(x))||y.pay-x.pay)){if(!free().length)break;if(m.auto!=='all'&&of.weeks>2&&!mine(of))continue;
    const c=bestCast(of,free());if(c){addLog(`📋 Quản lý ${m.name} ${mine(of)?'ưu tiên dự án mời đích danh, ':''}nhận giúp ${c.map(i=>byId(i).name).join(', ')}: «${of.title}».`);acceptCast(of.id,c,true)}}}}
export function cleanMgr(){for(const m of S.managers)if(m.as&&!'tsdlb'.includes(m.as.t)&&!mgrTargets(m).length&&!(m.as.t==='g'&&S.groups.find(g=>g.id===m.as.id)))m.as=null}
export function hireMgr(id){const m=S.mgrPool.find(x=>x.id===id);if(!m)return;if(S.money<m.fee)return toast(t('toast.noMoney'));S.money-=m.fee;S.mgrPool=S.mgrPool.filter(x=>x!==m);S.managers.push(m);const g=gmOf();if(g)m.boss=g.id;addLog(`🧑‍💼 Tuyển quản lý ${m.name}.`,'good');act()}
/* ---- Manager domains: m.dom in DOM_KEYS (MDOM labels) ---- */
export const artDom=(a,dom)=>dom==='trainee'?a.status==='trainee':dom==='group'?groupsOf(a).length>0:dom==='solo'?!!a.solo&&!a.pm:dom==='actor'?!!a.actor:false;
const AS_DOM={t:'trainee',b:'trainee',g:'group',s:'solo',d:'actor'};
export const domOfAs=t=>AS_DOM[t];
export function domOk(m,as){if(!m.dom||!as)return true;if(AS_DOM[as.t])return AS_DOM[as.t]===m.dom;if(as.t==='a'){const a=byId(as.id);return!!a&&artDom(a,m.dom)}return true}
export const retrain=m=>m.rt>abs()?m.rt-abs():0;
export function setDom(id,dom){const m=S.managers.find(x=>x.id===id);if(!m||!MDOM[dom]||m.dom===dom)return;const fee=10e6+2e6*m.lv;if(S.money<fee)return toast(t('mgr.toast.retrainMoney'));
  S.money-=fee;book('mgr',-fee);m.dom=dom;m.as=null;m.rt=abs()+2;S.props=null;addLog(`🎓 ${m.name} đào tạo lại sang mảng ${MDOM[dom]} (${fmt(fee)}, 2 tuần).`);act()}
/* weekly (runs before the week advances), no RNG: drop members that no longer match the domain, end retraining */
export function mgrDomTick(){for(const m of S.managers){if(m.rt&&m.rt<=abs()+1){delete m.rt;addLog(`🎓 ${m.name} đã sẵn sàng nhận việc ở mảng ${MDOM[m.dom]}.`)}
  if(!m.dom||!m.as)continue;
  if(m.as.t==='l'){const keep=m.as.ids.filter(i=>{const a=byId(i);return a&&artDom(a,m.dom)});if(keep.length!==m.as.ids.length){addLog(`📋 ${m.name} không còn phụ trách ${m.as.ids.length-keep.length} nghệ sĩ ngoài mảng ${MDOM[m.dom]}.`);m.as.ids=keep;S.props=null}}
  else if(m.as.t==='a'&&!domOk(m,m.as)){addLog(`📋 ${m.name} không còn phụ trách ${targetName(m)} (ngoài mảng ${MDOM[m.dom]}).`);m.as=null;S.props=null}}}
/* old saves: infer the domain from the current assignment (tie order solo > actor > group > trainee) */
/* legacy as.t t/s/d is rewritten by migrateV2: map it to a domain first (call before migrateV2) */
export function legacyDom(){for(const m of S.managers)if(!m.dom&&m.as&&'tsd'.includes(m.as.t))m.dom=AS_DOM[m.as.t]}
export function migrateDom(){const ORD=['solo','actor','group','trainee'];
  for(const m of S.managers){if(m.dom)continue;const as=m.as;let d=as&&AS_DOM[as.t];
    if(!d&&as&&(as.t==='l'||as.t==='a')){const ts=as.t==='l'?as.ids.map(byId).filter(Boolean):[byId(as.id)].filter(Boolean),cnt=ORD.map(k=>ts.filter(a=>artDom(a,k)).length),mx=Math.max(0,...cnt);
      if(mx>0){d=ORD[cnt.indexOf(mx)];if(as.t==='l'){const keep=as.ids.filter(i=>{const a=byId(i);return a&&artDom(a,d)});if(keep.length!==as.ids.length)addLog(`📋 ${m.name}: bỏ ${as.ids.length-keep.length} nghệ sĩ không thuộc mảng ${MDOM[d]}.`);as.ids=keep}}}
    if(!d){d=pick(DOM_KEYS);if(as&&(as.t==='a'||as.t==='l'))m.as=null}
    m.dom=d}
  (S.mgrPool||[]).forEach(m=>{if(!m.dom)m.dom=pick(DOM_KEYS)})}
export function assignMgr(id,v){const m=S.managers.find(x=>x.id===id);if(!m)return;if(m.gm)return toast(t('mgr.toast.gmNoAssign'));if(retrain(m))return toast(t('mgr.toast.retraining',{n:m.name,w:t('common.weeks',{n:retrain(m)})}));S.props=null;if(!v)m.as=null;else{const t=v[0],tid=+v.slice(1);if(t!=='l'&&S.managers.some(x=>x!==m&&x.as&&x.as.t===t&&x.as.id===tid))return toast(tl('mgr.toast.taken'));if(!domOk(m,{t,id:tid}))return toast(tl('mgr.toast.domain',{d:domName(m.dom)}));m.as=t==='l'?{t,id:0,ids:(m.as&&m.as.t==='l'?m.as.ids:[])}:{t,id:tid};addLog(`📋 ${m.name} phụ trách ${targetName(m)}.`)}act()}
export const mCapA=m=>MAX_SA;
export function toggleMA(mid,aid,on){const m=S.managers.find(x=>x.id===mid);if(!m||!m.as||m.as.t!=='l')return;S.props=null;const L=m.as.ids;
  if(on){if(L.includes(aid))return;{const a=byId(aid);if(m.dom&&a&&!artDom(a,m.dom)){toast(t('mgr.toast.domainArt',{d:domName(m.dom),n:a.name}));return act()}}if(L.length>=mCapA(m)){toast(t('mgr.toast.listCap',{n:m.name,l:m.lv,c:mCapA(m)}));return act()}
    const o=S.managers.find(x=>x!==m&&x.as&&x.as.t==='l'&&x.as.ids.includes(aid));if(o){toast(t('mgr.toast.inList',{n:o.name}));return act()}L.push(aid)}
  else m.as.ids=L.filter(i=>i!==aid);act()}
export function setAuto(id,v){const m=S.managers.find(x=>x.id===id);if(m){S.props=null;m.auto=v;act()}}
export function fireMgr(id,btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent=t('btn.tapAgainConfirm');return}const m=S.managers.find(x=>x.id===id);if(m){mKids(m).forEach(k=>k.boss=m.boss||null);S.managers=S.managers.filter(x=>x!==m);S.assts=(S.assts||[]).filter(x=>x.mid!==m.id);S.events=S.events.filter(e=>e.m!==m.id);addLog(`👋 Cho nghỉ việc ${m.gm?'quản lý tổng':'quản lý'} ${m.name}.`);act()}}
export function rehuntMgr(){if(S.money<15e6)return toast(t('toast.noMoney'));S.money-=15e6;genMgrPool();act()}
