import { R, pick, rnd } from '../core/rng.js';
import { t } from '../i18n/index.js';
import { clamp, fmt, fmtN } from '../core/util.js';
import { SONGS } from '../data/names.js';
import { OFFER, PARTNERS, RIVALS } from '../data/offers.js';
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

/* ================= THỊ TRƯỜNG: XU HƯỚNG, ĐỐI THỦ, BIẾN CỐ ================= */
export const modV=k=>{const m=S.mods&&S.mods[k];return m&&m.until>abs()?m.v:1};
export const setMod=(k,v,w,n)=>{S.mods=S.mods||{};S.mods[k]={v,until:abs()+w,n}};
export const trendB=k=>S.trend?(S.trend.hot.includes(k)?12:S.trend.cold===k?-8:0):0;
export const trendTag=k=>S.trend?(S.trend.hot.includes(k)?' 🔥':S.trend.cold===k?' ❄️':''):'';
export const totalFans=()=>S.artists.reduce((t,a)=>t+a.fans,0);
export function newTrend(force){const ks=Object.keys(CONCEPTS).sort(()=>Math.random()-.5);
  let hot=[ks[0],ks[1]];if(force)hot=[force,ks.find(k=>k!==force)];const cold=ks.find(k=>!hot.includes(k));
  S.trend={hot,cold,until:abs()+R(6,10)};addLog(`🔥 Xu hướng mới: ${hot.map(k=>CONCEPTS[k].n).join(' và ')} đang thịnh hành, ${CONCEPTS[cold].n} hết thời.`,'gold')}
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
      r.cb={w:now,t:pick(SONGS),ck,p,rank};r.fans+=Math.round((101-rank)*R(60,160));r.last=`Comeback «${r.cb.t}» (${CONCEPTS[ck].n}) – hạng ${rank}`;
      addLog(`⚔️ ${r.n} comeback với «${r.cb.t}» (${CONCEPTS[ck].n}), hạng ${rank}. Single ra tuần này sẽ bị cạnh tranh.`)}
    if(Math.random()<.02){r.fans=Math.round(r.fans*.9);r.last='Dính scandal, mất 10% fan';addLog(`📰 ${r.n} dính scandal lớn, mất nhiều fan. Cơ hội cho bạn!`,'good')}
  }
  if(S.offers.length>2&&Math.random()<.2){const r=pick(S.rivals),of=S.offers.filter(o=>!o.invested&&!o.target).sort((x,y)=>y.pay-x.pay)[R(0,1)];
    if(of){S.offers=S.offers.filter(o=>o!==of);r.stole=(r.stole||0)+1;r.last=`Giành lời mời «${of.title}»`;addLog(`⚔️ ${r.n} giành mất lời mời «${of.title}» (${OFFER[of.type].n}).`,'bad')}}
  const cand=S.artists.filter(a=>a.status==='debuted'&&a.fans>=6000&&!a.busy&&!hasEv(a.id,'poach'));
  if(cand.length&&Math.random()<.06){const a=pick(cand);if(Math.random()<1.1-a.mood/100-msk(a,'care')*.03){const r=pick(S.rivals);pushEv({kind:'poach',a:a.id,r:r.n,fee:clamp(Math.round(a.fans*1500/1e6)*1e6,30e6,3e9)})}}
}
export const SXD={
  fire:{ic:'🔥',t:'Sự cố chập điện phòng tập',d:()=>'Phòng tập hư hỏng. Sửa tạm thì 4 tuần tới luyện tập kém hiệu quả.',o:()=>[{k:'fix',l:'Sửa ngay (60 tr)'},{k:'cheap',l:'Sửa tạm (15 tr)'}]},
  sponsor:{ic:'🤝',t:'Nhà tài trợ bất ngờ',d:e=>`${e.p} muốn tài trợ ${fmt(e.v)} để gắn logo vào hoạt động của công ty. Một số fan có thể chê "thương mại hóa".`,o:()=>[{k:'yes',l:'Nhận tài trợ'},{k:'no',l:'Từ chối'}]},
  tax:{ic:'🧾',t:'Thanh tra thuế',d:()=>'Cơ quan thuế kiểm tra sổ sách. Luật sư giỏi có thể giúp thoát phạt.',o:()=>[{k:'law',l:'Thuê luật sư (40 tr)'},{k:'pay',l:'Nộp phạt luôn'}]},
  festival:{ic:'🌏',t:'Lời mời lễ hội quốc tế',d:e=>`Lễ hội âm nhạc châu Á mời ${e.n} biểu diễn 1 tuần. Chi phí 50 tr, đổi lại nhiều fan quốc tế.`,o:()=>[{k:'yes',l:'Nhận lời (50 tr)'},{k:'no',l:'Từ chối'}]},
  leak:{ic:'💧',t:'Bản demo bị rò rỉ',d:()=>'Một bài hát chưa phát hành lan truyền trên mạng.',o:()=>[{k:'embrace',l:'Biến thành teaser'},{k:'sue',l:'Kiện người phát tán (20 tr)'},{k:'ignore',l:'Lờ đi'}]},
  investor:{ic:'💼',t:'Quỹ đầu tư muốn rót vốn',d:e=>`${e.p} rót ${fmt(e.v)} ngay. Công ty trả lại ${fmt(Math.round(e.v*1.3/26/1e6)*1e6)}/tuần trong 26 tuần.`,o:()=>[{k:'yes',l:'Nhận vốn'},{k:'no',l:'Từ chối'}]}
};
export function surprise(){
  if(Math.random()>.24)return;
  const deb=S.artists.filter(a=>a.status==='debuted'),free=acts().filter(actFree);
  const pool=['fire','tax','sponsor','investor','boom','crisis','gift','challenge'];
  if(deb.length)pool.push('viral','viral','leak','injury');if(free.length&&deb.length)pool.push('festival');
  const k=pick(pool),now=abs();
  if(k==='viral'){const a=pick(deb),g=Math.round(R(3000,12000)*(1+fame(a)/50));a.fans+=g;a.yr.fans+=g;a.mood=clamp(a.mood+8,0,100);addLog(`📱 Bất ngờ: clip hậu trường của ${a.name} viral khắp mạng xã hội! +${fmtN(g)} fan.`,'gold')}
  else if(k==='boom'){setMod('fan',1.6,4,'Làn sóng K-pop: fan tăng nhanh');addLog('🌊 Bất ngờ: làn sóng thần tượng bùng nổ, 4 tuần tới fan tăng nhanh hơn 60%!','gold')}
  else if(k==='crisis'){setMod('pay',.8,6,'Suy thoái: thù lao −20%');setMod('econ',.7,6,'Suy thoái: kinh doanh −30%');addLog('📉 Bất ngờ: kinh tế suy thoái. 6 tuần tới thù lao giảm 20%, lợi nhuận kinh doanh giảm 30%.','bad')}
  else if(k==='gift'){S.artists.forEach(a=>a.mood=clamp(a.mood+8,0,100));addLog('🎁 Bất ngờ: fan gửi xe cà phê và quà đến công ty. Ai cũng vui!','good')}
  else if(k==='challenge'){const c=pick(Object.keys(CONCEPTS));newTrend(c);addLog(`🕺 Bất ngờ: một thử thách nhảy trên mạng khiến concept ${CONCEPTS[c].n} hot trở lại!`,'gold')}
  else if(k==='injury'){const c=deb.filter(a=>!a.busy);if(!c.length)return;const a=pick(c);a.busy={kind:'leave',title:'Điều trị chấn thương',left:2,total:2};a.mood=clamp(a.mood-10,0,100);addLog(`🩹 Bất ngờ: ${a.name} bị chấn thương khi tập, phải nghỉ 2 tuần.`,'bad')}
  else if(k==='sponsor')pushEv({kind:'sx',sx:k,p:pick(PARTNERS.ad),v:Math.round(R(40,150)*(1+S.year*.3))*1e6},true);
  else if(k==='investor')pushEv({kind:'sx',sx:k,p:pick(['Quỹ Sao Mai','Lotus Capital','Quỹ Rồng Vàng']),v:Math.round(R(200,500)*(1+S.year*.2))*1e6},true);
  else if(k==='festival'){const x=pick(free);pushEv({kind:'sx',sx:k,act:x.k,n:x.n.slice(2)},true)}
  else pushEv({kind:'sx',sx:k},true);
  toast(t('market.toast.surprise'));
}
export function sxResolve(e,k){
  const D=SXD[e.sx];
  switch(e.sx+':'+k){
    case'fire:fix':S.money-=60e6;addLog('🔧 Đã sửa xong phòng tập.');break;
    case'fire:cheap':S.money-=15e6;setMod('train',.8,4,'Phòng tập sửa tạm: luyện tập −20%');addLog('🔧 Phòng tập được sửa tạm, hiệu quả tập giảm 4 tuần.','bad');break;
    case'sponsor:yes':S.money+=e.v;S.artists.forEach(a=>{if(a.status==='debuted')a.fans=Math.round(a.fans*.99)});addLog(`🤝 Nhận ${fmt(e.v)} tài trợ từ ${e.p}.`,'good');break;
    case'sponsor:no':S.artists.forEach(a=>a.mood=clamp(a.mood+3,0,100));addLog('Từ chối tài trợ, fan khen công ty có tâm.');break;
    case'tax:law':S.money-=40e6;if(Math.random()<.6)addLog('⚖️ Luật sư chứng minh sổ sách hợp lệ, không bị phạt.','good');else{const f=clamp(Math.round(Math.abs(S.money)*.05/1e6)*1e6,30e6,300e6);S.money-=f;addLog(`🧾 Vẫn bị phạt ${fmt(f)}.`,'bad')}break;
    case'tax:pay':{const f=clamp(Math.round(Math.abs(S.money)*.04/1e6)*1e6,20e6,250e6);S.money-=f;addLog(`🧾 Nộp phạt thuế ${fmt(f)}.`,'bad');break}
    case'festival:yes':{const A=actByKey(e.act);if(!A||!actFree(A)||S.money<50e6){addLog('Không thể cử người đi lễ hội lúc này.','bad');break}S.money-=50e6;for(const id of A.m){const a=byId(id),g=R(5000,15000);a.fans+=g;a.yr.fans+=g;a.busy={kind:'concert',title:'Lễ hội quốc tế',left:1,total:1}}addLog(`🌏 ${e.n} biểu diễn ở lễ hội quốc tế, fan nước ngoài tăng mạnh!`,'gold');break}
    case'festival:no':break;
    case'leak:embrace':if(Math.random()<.6){S.artists.filter(a=>a.status==='debuted').forEach(a=>a.fans+=R(500,2500));addLog('💧 Teaser bất đắc dĩ gây sốt, fan háo hức chờ bài mới!','good')}else addLog('💧 Teaser không tạo được tiếng vang.');break;
    case'leak:sue':S.money-=20e6;addLog('⚖️ Đã khởi kiện người phát tán bản demo.');break;
    case'leak:ignore':S.artists.filter(a=>a.status==='debuted').forEach(a=>a.mood=clamp(a.mood-5,0,100));addLog('💧 Nghệ sĩ buồn vì bài hát bị rò rỉ.','bad');break;
    case'investor:yes':S.money+=e.v;S.loan={pay:Math.round(e.v*1.3/26/1e6)*1e6,left:26,n:e.p};addLog(`💼 Nhận ${fmt(e.v)} từ ${e.p}. Trả dần ${fmt(S.loan.pay)}/tuần trong 26 tuần.`,'good');break;
  }
}
/* ---- đầu tư kinh doanh ---- */
export const BIZ={
  cafe:{n:'Cà phê thần tượng',ic:'☕',cost:150e6,base:5e6,syn:.8,vol:.3},
  food:{n:'Chuỗi nhà hàng',ic:'🍜',cost:350e6,base:11e6,syn:.2,vol:.25},
  media:{n:'Studio nội dung số',ic:'📹',cost:250e6,base:5e6,syn:.6,vol:.4},
  academy:{n:'Học viện đào tạo',ic:'🏫',cost:500e6,base:8e6,syn:.1,vol:.2},
  fashion:{n:'Thương hiệu thời trang',ic:'👗',cost:450e6,base:13e6,syn:1,vol:.45},
  beauty:{n:'Dòng mỹ phẩm',ic:'💄',cost:700e6,base:19e6,syn:1,vol:.5},
  game:{n:'Studio game',ic:'🎮',cost:900e6,base:26e6,syn:.5,vol:1.1},
  estate:{n:'Bất động sản',ic:'🏢',cost:1200e6,base:22e6,syn:0,vol:.1}
};
export const bizLv=k=>{const b=(S.biz||[]).find(x=>x.k===k);return b?b.lv:0};
export const upCost=b=>Math.round(BIZ[b.k].cost*.7*b.lv);
export function bizTick(){const fF=clamp(totalFans()/300000,0,2);let t=0;
  for(const b of S.biz){const B=BIZ[b.k];const p=Math.round(B.base*b.lv*(1+B.syn*fF)*rnd(1-B.vol,1+B.vol)*modV('econ')/1e5)*1e5;const q=Math.round(p*bizOwn(b));b.last=p;b.tot+=q;t+=q}
  S.money+=t;book('biz',t);if(S.loan){S.money-=S.loan.pay;S.loan.left--;if(S.loan.left<=0){addLog(`💼 Đã trả xong khoản vốn của ${S.loan.n}.`,'good');S.loan=null}}
  return t}
export function buyBiz(k){const B=BIZ[k];if(bizLv(k))return;if(S.money<B.cost)return toast(t('common.noMoney'));S.money-=B.cost;S.biz.push({k,lv:1,inv:B.cost,tot:0,last:0,y:S.year});addLog(`${B.ic} Mở ${B.n} (${fmt(B.cost)}).`,'gold');act()}
export function upBiz(k){const b=S.biz.find(x=>x.k===k);if(!b||b.lv>=5)return;const c=upCost(b);if(S.money<c)return toast(t('common.noMoney'));S.money-=c;b.inv+=c;b.lv++;addLog(`${BIZ[k].ic} Mở rộng ${BIZ[k].n} lên cấp ${b.lv}.`,'good');act()}
export function sellBiz(k,btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent=t('btn.tapAgain');return}const b=S.biz.find(x=>x.k===k);if(!b)return;const v=Math.round(b.inv*.6*bizOwn(b));S.money+=v;S.biz=S.biz.filter(x=>x!==b);addLog(`${BIZ[k].ic} Bán ${BIZ[k].n}, thu về ${fmt(v)}.`);act()}
export const bizOwn=b=>b.own??1;
export const bizVal=b=>{const B=BIZ[b.k],fF=clamp(totalFans()/300000,0,2),exp=B.base*b.lv*(1+B.syn*fF);return Math.round((b.inv+exp*26)/1e6)*1e6};
export const bizWait=b=>Math.max(0,8-(abs()-(b.rw??-99)));
export function raiseBiz(k,pct){const b=S.biz.find(x=>x.k===k);if(!b)return;if(Math.round((bizOwn(b)-pct)*100)<51)return toast(t('invest.toast.min'));if(bizWait(b))return toast(t('invest.toast.wait',{w:t('unit.weeks',{n:bizWait(b)})}));const v=Math.round(bizVal(b)*pct);S.money+=v;b.own=bizOwn(b)-pct;b.rw=abs();addLog(`💼 ${BIZ[k].n} kêu gọi vốn: bán ${Math.round(pct*100)}% cổ phần cho ${pick(['Quỹ Sao Mai','Lotus Capital','Quỹ Rồng Vàng'])}, nhận ${fmt(v)}.`,'gold');act()}
export function buybackBiz(k){const b=S.biz.find(x=>x.k===k);if(!b||bizOwn(b)>=1)return;const c=Math.round(bizVal(b)*(1-bizOwn(b))*1.15);if(S.money<c)return toast(t('common.noMoney'));S.money-=c;b.own=1;addLog(`💼 Mua lại toàn bộ cổ phần ${BIZ[k].n} (${fmt(c)}).`,'good');act()}
export function weekWorld(){
  if(!S.trend||abs()>=S.trend.until)newTrend();
  rivalsTick();surprise();
  for(const k in S.mods)if(S.mods[k].until<=abs())delete S.mods[k];
  return bizTick();
}
