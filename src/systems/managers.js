import { R, pick } from '../core/rng.js';
import { clamp } from '../core/util.js';
import { LNM, MGN } from '../data/names.js';
import { MSK } from '../data/rules.js';
import { S, addLog, byId, uid } from '../state.js';
import { mkLook } from './artists.js';
import { MAX_SA, asstB } from './ext2.js';
import { acceptCast, bestCast } from './offers.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

export function genManager(){const sk={};for(const k in MSK)sk[k]=R(1,5);const sp=pick(Object.keys(MSK));sk[sp]=clamp(sk[sp]+R(2,4),1,10);const tot=Object.values(sk).reduce((a,b)=>a+b,0);
  return{id:uid(),name:pick(LNM)+' '+pick(MGN),look:mkLook(Math.random()<.5?'F':'M',pick(['#333a56','#5b6b8c','#2f4f4f','#6b4f3a','#7a7f8c'])),sk,spec:sp,lv:1,exp:0,salary:Math.round(tot*.3)*1e6,fee:tot*3e6,as:null,auto:'off',ps:2}}
export function genMgrPool(){S.mgrPool=[];for(let i=0;i<3;i++)S.mgrPool.push(genManager())}
export const mTot=m=>Object.values(m.sk).reduce((x,y)=>x+y,0);
export function mgrTargets(m){if(!m.as)return[];if(m.as.t==='t')return S.artists.filter(a=>a.status==='trainee');if(m.as.t==='b')return S.artists.filter(a=>a.status==='trainee'&&a.batch===m.as.id);if(m.as.t==='l')return(m.as.ids||[]).map(byId).filter(Boolean);if(m.as.t==='s')return S.artists.filter(a=>a.solo&&!a.pm);if(m.as.t==='d')return S.artists.filter(a=>a.actor);if(m.as.t==='a'){const a=byId(m.as.id);return a?[a]:[]}const g=S.groups.find(x=>x.id===m.as.id);return g?g.members.map(byId).filter(Boolean):[]}
export function mgrOf(a){let best=null;for(const m of S.managers)if(m.as&&mgrTargets(m).includes(a)&&(!best||mTot(m)>mTot(best)))best=m;return best}
export const mBoss=m=>m.boss?S.managers.find(x=>x.id===m.boss)||null:null;
export const mKids=m=>S.managers.filter(x=>x.boss===m.id);
export function inSub(root,x){for(const k of mKids(root))if(k===x||inSub(k,x))return true;return false}
export const mCap=m=>2+Math.floor(m.lv/2);
export const effSk=(m,k)=>{const b=mBoss(m);return Math.min(10,m.sk[k]+(b?Math.floor(b.sk[k]*.2):0)+asstB(m,k))};
export const msk=(a,k)=>{const m=mgrOf(a),v=m?effSk(m,k):0,b=a.pm?Math.max(v,a.pm.sk[k]||0):v;return Math.min(10,b+(a.pa&&a.pa.k===k?a.pa.v:0))};
export function givePM(a,quiet){if(a.pm)return;const sk={};for(const k in MSK)sk[k]=R(3,7);a.pm={id:-a.id,name:pick(LNM)+' '+pick(MGN),sk,lv:1,ps:1,boss:null};
  for(const m of S.managers){if(m.as&&m.as.t==='a'&&m.as.id===a.id)m.as=null;if(m.as&&m.as.t==='l')m.as.ids=m.as.ids.filter(i=>i!==a.id)}S.props=null;
  if(!quiet)addLog(`🧑‍💼 ${a.name} tách solo và tự chọn quản lý riêng: ${a.pm.name}. Văn phòng Quản lý không cần phụ trách nữa.`)}
export function setBoss(id,v){const m=S.managers.find(x=>x.id===id);if(!m)return;
  if(!v){m.boss=null;addLog(`📋 ${m.name} báo cáo trực tiếp Giám đốc.`)}
  else{const b=S.managers.find(x=>x.id===+v);if(!b||b===m||inSub(m,b))return toast('Không thể tạo vòng lặp cấp bậc');if(mKids(b).length>=mCap(b))return toast(`${b.name} chỉ quản được ${mCap(b)} người ở cấp hiện tại`);m.boss=b.id;addLog(`📋 ${m.name} giờ báo cáo cho ${b.name}.`)}
  act()}
export function targetName(m){if(!m.as)return'Chưa phân công';if(m.as.t==='t')return'tất cả thực tập sinh';if(m.as.t==='b'){const b=(S.batches||[]).find(x=>x.id===m.as.id);return b?'thực tập sinh '+b.n.toLowerCase():'lứa đã giải tán'}if(m.as.t==='s')return'tất cả nghệ sĩ solo';if(m.as.t==='d')return'tất cả diễn viên';if(m.as.t==='l'){const ts=mgrTargets(m);return ts.length?`${ts.length} nghệ sĩ: ${ts.slice(0,2).map(a=>a.name).join(', ')}${ts.length>2?'…':''}`:'danh sách trống'}if(m.as.t==='g'){const g=S.groups.find(x=>x.id===m.as.id);return g?'nhóm '+g.name:'—'}const a=byId(m.as.id);return a?a.name:'—'}
export function mgrExp(m,n=1){const b=mBoss(m);if(b&&n>=.25)mgrExp(b,n*.5);m.exp=+(m.exp+n).toFixed(2);while(m.exp>=m.lv*4){m.exp-=m.lv*4;m.lv++;const ks=Object.keys(MSK).filter(k=>m.sk[k]<10),k=ks.length?pick(ks):null;if(k)m.sk[k]++;m.salary+=1e6;addLog(`📈 Quản lý ${m.name} lên cấp ${m.lv}${k?' ('+MSK[k]+' +1)':''}.`,'good')}}
export function mgrAuto(){for(const m of S.managers){if(m.auto==='off'||!m.as)continue;
  const free=()=>mgrTargets(m).filter(a=>!a.busy);
  const mine=o=>o.target&&mgrTargets(m).some(a=>a.id===o.target)?1:0;
  for(const of of S.offers.slice().sort((x,y)=>(mine(y)-mine(x))||y.pay-x.pay)){if(!free().length)break;if(m.auto!=='all'&&of.weeks>2&&!mine(of))continue;
    const c=bestCast(of,free());if(c){addLog(`📋 Quản lý ${m.name} ${mine(of)?'ưu tiên dự án mời đích danh, ':''}nhận giúp ${c.map(i=>byId(i).name).join(', ')}: «${of.title}».`);acceptCast(of.id,c,true)}}}}
export function cleanMgr(){for(const m of S.managers)if(m.as&&!'tsdlb'.includes(m.as.t)&&!mgrTargets(m).length&&!(m.as.t==='g'&&S.groups.find(g=>g.id===m.as.id)))m.as=null}
export function hireMgr(id){const m=S.mgrPool.find(x=>x.id===id);if(!m)return;if(S.money<m.fee)return toast('Không đủ tiền');S.money-=m.fee;S.mgrPool=S.mgrPool.filter(x=>x!==m);S.managers.push(m);addLog(`🧑‍💼 Tuyển quản lý ${m.name}.`,'good');act()}
export function assignMgr(id,v){const m=S.managers.find(x=>x.id===id);if(!m)return;S.props=null;if(!v)m.as=null;else{const t=v[0],tid=+v.slice(1);if(t!=='l'&&S.managers.some(x=>x!==m&&x.as&&x.as.t===t&&x.as.id===tid))return toast('Đã có quản lý phụ trách');m.as=t==='l'?{t,id:0,ids:(m.as&&m.as.t==='l'?m.as.ids:[])}:{t,id:tid};addLog(`📋 ${m.name} phụ trách ${targetName(m)}.`)}act()}
export const mCapA=m=>MAX_SA;
export function toggleMA(mid,aid,on){const m=S.managers.find(x=>x.id===mid);if(!m||!m.as||m.as.t!=='l')return;S.props=null;const L=m.as.ids;
  if(on){if(L.includes(aid))return;if(L.length>=mCapA(m)){toast(`${m.name} cấp ${m.lv} quản tối đa ${mCapA(m)} người`);return act()}
    const o=S.managers.find(x=>x!==m&&x.as&&x.as.t==='l'&&x.as.ids.includes(aid));if(o){toast(`Đã thuộc danh sách của ${o.name}`);return act()}L.push(aid)}
  else m.as.ids=L.filter(i=>i!==aid);act()}
export function setAuto(id,v){const m=S.managers.find(x=>x.id===id);if(m){S.props=null;m.auto=v;act()}}
export function fireMgr(id,btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent='Chạm lần nữa để xác nhận';return}const m=S.managers.find(x=>x.id===id);if(m){mKids(m).forEach(k=>k.boss=m.boss||null);S.managers=S.managers.filter(x=>x!==m);S.assts=(S.assts||[]).filter(x=>x.mid!==m.id);S.events=S.events.filter(e=>e.m!==m.id);addLog(`👋 Cho nghỉ việc quản lý ${m.name}.`);act()}}
export function rehuntMgr(){if(S.money<15e6)return toast('Không đủ tiền');S.money-=15e6;genMgrPool();act()}
