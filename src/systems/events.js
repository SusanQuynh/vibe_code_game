import { R, pick } from '../core/rng.js';
import { clamp, esc, fmt } from '../core/util.js';
import { money, roomName, t } from '../i18n/index.js';
import { save } from '../save/storage.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { XK, pct, xInfo, xResolve } from './ext2.js';
import { givePM, msk } from './managers.js';
import { SXD, sxResolve } from './market.js';
import { datingPartner, getRel, groupsOf, sameGroup, setRel, setTag } from './relations.js';
import { act, render, roomOf } from '../ui/building.js';
import { curView, modal, setCurRC, setCurView, toast } from '../ui/modal.js';

/* ================= EVENTS ================= */
export const hasEv=(id,k)=>S.events.some(e=>e.a===id&&e.kind===k);
export function pushEv(e,force){if(S.events.length>=7&&!force)return;e.id=uid();S.events.push(e)}
export function makeScandal(a){
  const dp=datingPartner(a),dating=dp&&a.tag[dp.id]==='dating'&&Math.random()<.6;
  const t=dating?`Bị chụp ảnh hẹn hò với ${dp.name}`:pick(['Tin đồn thái độ với nhân viên','Bị đào lại phát ngôn cũ','Tin đồn chèn ép đồng nghiệp','Lộ ảnh quá khứ gây tranh cãi','Tin đồn đạo nhái vũ đạo']);
  a.scandal={t,sev:R(1,3),left:6,truth:dating||Math.random()<.4,dating:!!dating,other:dating?dp.id:0};
  a.fans=Math.round(a.fans*.95);
  pushEv({kind:'scandal',a:a.id},true);
  addLog(`🚨 Scandal: ${a.name} – ${t}!`,'bad');
}
export const LEADS={
  photo:{n:'Ảnh/video gốc',ic:'📷',r:.85,T:'File gốc có dữ liệu ngày giờ khớp, không bị chỉnh sửa.',F:'Phân tích điểm ảnh cho thấy ảnh đã bị ghép.'},
  witness:{n:'Nhân chứng',ic:'🧑‍🤝‍🧑',r:.7,T:'Hai nhân chứng độc lập xác nhận sự việc.',F:'Lời khai mâu thuẫn, có dấu hiệu được trả tiền.'},
  chat:{n:'Tin nhắn',ic:'💬',r:.8,T:'Lịch sử tin nhắn trùng khớp nội dung tin đồn.',F:'Ảnh chụp tin nhắn dùng giao diện giả.'},
  schedule:{n:'Lịch trình',ic:'🗓️',r:.75,T:'Lịch trình có khoảng trống đúng giờ được nhắc tới.',F:'Hôm đó nghệ sĩ đang tập, có camera phòng tập làm chứng.'},
  source:{n:'Nguồn tung tin',ic:'🕵️',r:.65,T:'Nguồn tin là phóng viên uy tín, từng đưa tin chính xác.',F:'Tài khoản tung tin mới lập, liên quan công ty đối thủ.'},
  talk:{n:'Nói chuyện riêng',ic:'🗣️',r:.6,T:'Nghệ sĩ lúng túng và thừa nhận một phần.',F:'Nghệ sĩ bình tĩnh đưa ra lời giải thích hợp lý.'},
  social:{n:'Mạng xã hội',ic:'📱',r:.55,T:'Nhiều tài khoản cũ từng nhắc chuyện tương tự.',F:'Tin đồn chỉ lan từ một cụm tài khoản ảo.'},
  staff:{n:'Nhân viên hậu trường',ic:'🎬',r:.7,T:'Staff xác nhận có chuyện xảy ra.',F:'Staff khẳng định không có chuyện đó.'}
};
export function invFix(sc){if(sc&&sc.inv&&!sc.inv.leads)sc.inv=null}
export function invStart(aId){
  const a=byId(aId),sc=a&&a.scandal;if(!sc)return;invFix(sc);
  if(!sc.inv){
    if(S.money<10e6)return toast(t('inv.toast.need',{m:money(10e6)}));
    S.money-=10e6;const pr=msk(a,'pr');
    const ks=Object.keys(LEADS).sort(()=>Math.random()-.5).slice(0,6);
    sc.inv={leads:ks.map(k=>{const r=Math.min(.95,LEADS[k].r+pr*.02);return{k,r:+r.toFixed(2),says:Math.random()<r?sc.truth:!sc.truth,open:false}}),ap:3+Math.floor(pr/3),p:.5};
    addLog(`🕵️ Mở hồ sơ điều tra scandal của ${a.name}.`);save();render();
  }
  setCurRC('var(--r-pr)');setCurView(()=>viewInv(aId));curView();
}
export function invOpen(aId,i){
  const a=byId(aId),inv=a&&a.scandal&&a.scandal.inv;if(!inv)return;const L=inv.leads[i];if(!L||L.open)return;
  if(inv.ap<=0)return toast(t('inv.toast.noAp'));
  inv.ap--;L.open=true;L.fresh=true;const r=L.r,p=inv.p;
  inv.p=L.says?p*r/(p*r+(1-p)*(1-r)):p*(1-r)/(p*(1-r)+(1-p)*r);
  act();
}
export function invBuy(aId){const inv=byId(aId)?.scandal?.inv;if(!inv)return;if(S.money<8e6)return toast(t('common.noMoney'));S.money-=8e6;inv.ap++;act()}
// invVerdict/invRec chỉ dùng cho UI (không vào log/S) nên dịch tại chỗ
export function invVerdict(p){return p>=.75?{t:t('inv.v.true'),c:'bad',v:1}:p<=.25?{t:t('inv.v.false'),c:'good',v:0}:{t:t('inv.v.unsure'),c:'muted',v:-1}}
export function invRec(v,dating){return v===1?(dating?t('inv.rec.sorryDating'):t('inv.rec.sorry')):v===0?t('inv.rec.sue'):t('inv.rec.more')}
export function viewInv(aId){
  const a=byId(aId);
  if(!a||!a.scandal||!a.scandal.inv){modal(`<h2>🗂️ ${t('inv.closed')}</h2><div class="sub">${t('inv.closedSub')}</div><button class="btn pri" onclick="openRoom('pr')">${t('inv.back',{r:roomName('pr')})}</button>`);return}
  const sc=a.scandal,inv=sc.inv,pct=Math.round(inv.p*100),vd=invVerdict(inv.p),e=S.events.find(x=>x.kind==='scandal'&&x.a===a.id),info=e&&evInfo(e);
  const files=inv.leads.map((L,i)=>{const D=LEADS[L.k],rot=`--rot:${(i%3-1)*1.6}deg`;
    if(L.open){const fr=L.fresh?' flip':'';L.fresh=false;return`<div class="file open ${L.says?'t':'f'}${fr}" style="${rot}"><b>${D.ic} ${D.n}</b>${L.says?D.T:D.F}<br><span class="stamp" style="color:${L.says?'var(--red)':'var(--mint)'}">${L.says?t('inv.stampT'):t('inv.stampF')}</span> <span class="small" style="opacity:.7">${t('inv.conf',{p:Math.round(L.r*100)})}</span></div>`}
    return`<button class="file" style="${rot}" onclick="invOpen(${a.id},${i})" ${inv.ap<=0?'aria-disabled="true"':''}><b>${D.ic} ${D.n}</b>${t('inv.reliab')} ${'★'.repeat(Math.round(L.r*5))}${'☆'.repeat(5-Math.round(L.r*5))}<div style="margin-top:14px;font-weight:700">🔎 ${t('inv.tap')}</div></button>`}).join('');
  modal(`<h2>🕵️ ${t('inv.h',{n:esc(a.name)})}</h2><div class="sub">${esc(sc.t)} · ${t('inv.sub',{s:'🔥'.repeat(sc.sev),w:t('unit.weeks',{n:sc.left})})}</div>
  <div class="card"><div class="row"><b>${t('inv.ap')}</b><span style="font-size:18px">${'🔎'.repeat(inv.ap)||`<span class="small muted">${t('inv.noAp')}</span>`}</span><span class="sp"></span><button class="btn sm" onclick="invBuy(${a.id})">${t('inv.buy',{m:money(8e6)})}</button></div>
  <div class="meter"><div class="needle" style="left:${pct}%" data-p="${t('inv.pTrue',{p:pct})}"></div></div><div class="mlab"><span>${t('inv.mFalse')}</span><span>${t('inv.mUnsure')}</span><span>${t('inv.mTrue')}</span></div></div>
  <div class="small muted">${t('inv.how')}</div>
  <div class="case">${files}</div>
  <div class="card" style="border-color:${vd.v===1?'var(--red)':vd.v===0?'var(--mint)':'var(--line)'}"><b class="${vd.c}">${t('inv.concl',{v:vd.t})}</b><div class="small" style="margin:4px 0 8px">👉 ${invRec(vd.v,sc.dating)}</div>
  ${info?`<div class="row">${info.o.map(o=>`<button class="btn sm ${(vd.v===1&&(o.k==='sorry'||o.k==='public'))||(vd.v===0&&(o.k==='sue'||o.k==='deny'))?'pri':''}" onclick="resolveEv(${e.id},'${o.k}');openRoom('pr')">${o.l}</button>`).join('')}</div>`:`<div class="small muted">${t('inv.silent')}</div>`}</div>`);
}
export function invBlock(a){
  const sc=a.scandal;if(!sc)return'';invFix(sc);
  if(!sc.inv)return`<div class="row" style="margin:6px 0"><button class="btn sm pri" onclick="invStart(${a.id})">🕵️ ${t('inv.open',{m:money(10e6)})}</button><span class="small muted">${t('inv.openTip')}</span></div>`;
  const vd=invVerdict(sc.inv.p);
  return`<div class="row" style="margin:6px 0"><button class="btn sm pri" onclick="invStart(${a.id})">🕵️ ${t('inv.cont')}</button><span class="small ${vd.c}">${t('inv.pctVerdict',{p:Math.round(sc.inv.p*100),v:vd.t})}</span></div>`;
}
export function randomEvents(){
  const A=S.artists;
  for(const a of A){
    if(a.mood<22&&Math.random()<.3*(1-msk(a,'care')*.06)&&!hasEv(a.id,'req_leave'))pushEv({kind:'req_leave',a:a.id});
    else if(Math.random()<.035&&!S.events.some(e=>e.a===a.id)){
      const o=['req_rest','req_raise'];
      if(a.status==='debuted'&&!a.wantAct)o.push('req_acting');
      if(groupsOf(a).length&&!a.solo)o.push('req_solo');
      pushEv({kind:pick(o),a:a.id});
    }
    if(a.status==='debuted'&&!a.scandal&&Math.random()<(.012+(datingPartner(a)&&a.tag[datingPartner(a).id]==='dating'?.05:0))*(1-msk(a,'pr')*.07))makeScandal(a);
  }
  if(A.length>=2){
    const n=Math.min(8,Math.ceil(A.length/2)+1);
    for(let i=0;i<n;i++){
      const x=pick(A),y=pick(A);if(x===y)continue;
      const same=sameGroup(x,y)||(!x.busy&&!y.busy&&roomOf(x)===roomOf(y));
      setRel(x,y,getRel(x,y)+R(-7,8)+(same?3:0));
      const r=getRel(x,y),t=x.tag[y.id];
      if(!t&&r>=60){setTag(x,y,'friend');addLog(`🤝 ${x.name} và ${y.name} trở thành bạn thân.`,'good')}
      else if(t==='friend'&&r>=85&&Math.random()<.35&&!datingPartner(x)&&!datingPartner(y)&&!S.events.some(e=>e.kind==='rel_dating'))pushEv({kind:'rel_dating',a:x.id,b:y.id});
      else if(t!=='enemy'&&r<=-40&&!S.events.some(e=>e.kind==='rel_conflict'&&(e.a===x.id||e.a===y.id)))pushEv({kind:'rel_conflict',a:x.id,b:y.id});
    }
  }
}
export function evInfo(e){
  {const x=xInfo(e);if(x!==undefined)return x}
  if(e.kind==='sx'){const D=SXD[e.sx];return D?{ic:D.ic,t:D.t,d:D.d(e),o:D.o(e)}:null}
  const a=byId(e.a),b=e.b?byId(e.b):null;if(!a||(e.b&&!b))return null;
  switch(e.kind){
    case'req_rest':return{ic:'😮‍💨',t:`${a.name} xin nghỉ phép`,d:'Lịch trình dày khiến cậu ấy kiệt sức và muốn nghỉ 2 tuần.',o:[{k:'yes',l:'Cho nghỉ 2 tuần'},{k:'no',l:'Từ chối'}]};
    case'req_raise':return{ic:'💸',t:`${a.name} muốn tăng lương`,d:`Lương hiện tại ${fmt(a.salary)}/tuần.`,o:[{k:'yes',l:'Tăng 3 tr/tuần'},{k:'no',l:'Từ chối'}]};
    case'req_acting':return{ic:'🎭',t:`${a.name} muốn thử sức diễn xuất`,d:'Cậu ấy mong được nhận vai trong 10 tuần tới.',o:[{k:'yes',l:'Hứa sẽ tìm vai'},{k:'no',l:'Từ chối'}]};
    case'req_solo':return{ic:'🎤',t:`${a.name} muốn ra mắt solo`,d:'Hoạt động solo song song với nhóm. Chi phí 80 tr.',o:[{k:'yes',l:'Cho ra solo (80 tr)'},{k:'no',l:'Để sau'}]};
    case'req_leave':return{ic:'🚪',t:`${a.name} đòi rời công ty!`,d:`Tâm trạng chỉ còn ${Math.round(a.mood)}. Nếu không giữ chân, cậu ấy sẽ đi.`,o:[{k:'talk',l:'Thuyết phục (30 tr)'},{k:'raise',l:'Tăng lương 10 tr/tuần'},{k:'go',l:'Để rời đi'}]};
    case'rel_conflict':return{ic:'⚡',t:`${a.name} và ${b.name} mâu thuẫn`,d:'Không khí trong công ty căng thẳng. Mâu thuẫn trong nhóm làm giảm chất lượng single.',o:[{k:'fix',l:'Hòa giải (10 tr)'},{k:'no',l:'Mặc kệ'}]};
    case'poach':return{ic:'🕵️',t:`${e.r} muốn chiêu mộ ${a.name}`,d:`Họ đề nghị lương gấp đôi. Tâm trạng hiện tại ${Math.round(a.mood)}. Để đi thì nhận phí chuyển nhượng ${fmt(e.fee)}.`,o:[{k:'raise',l:`Giữ chân: tăng lương ${fmt(Math.max(5e6,Math.round(a.salary*.5/1e6)*1e6))}/tuần`},{k:'talk',l:'Nói chuyện (40 tr)'},{k:'go',l:`Để đi (+${fmt(e.fee)})`}]};
    case'rel_dating':return{ic:'💞',t:`${a.name} và ${b.name} muốn hẹn hò`,d:'Hai người đã rất thân. Hẹn hò làm họ vui hơn nhưng có nguy cơ bị lộ.',o:[{k:'yes',l:'Cho phép (bí mật)'},{k:'no',l:'Cấm'}]};
    case'scandal':{if(!a.scandal)return null;const o=[{k:'deny',l:'Phủ nhận'},{k:'sorry',l:'Xin lỗi công khai'},{k:'sue',l:'Kiện tụng (30 tr)'}];if(a.scandal.dating)o.push({k:'public',l:'Công khai hẹn hò'});o.push({k:'silent',l:'Im lặng chờ lắng'});
      return{ic:'🚨',t:`Scandal: ${a.name}`,d:`${a.scandal.t}. Mức độ ${'🔥'.repeat(a.scandal.sev)}. Fan giảm mỗi tuần cho đến khi được xử lý.`,o}}
  }
  return null;
}
export function removeArtist(a,why){
  for(const m of S.managers)if(m.as&&m.as.t==='l')m.as.ids=m.as.ids.filter(i=>i!==a.id);
  S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!=='s'+a.id);
  S.artists=S.artists.filter(x=>x!==a);S.artists.forEach(x=>{if(x.mt===a.id)x.mt=0});
  for(const g of S.groups)g.members=g.members.filter(id=>id!==a.id);
  const gone=S.groups.filter(g=>!g.members.length);S.groups=S.groups.filter(g=>g.members.length);
  for(const x of S.artists){delete x.rel[a.id];delete x.tag[a.id]}
  S.events=S.events.filter(e=>e.a!==a.id&&e.b!==a.id);
  for(const m of S.managers)if(m.as&&((m.as.t==='a'&&m.as.id===a.id)||(m.as.t==='g'&&!S.groups.find(g=>g.id===m.as.id))))m.as=null;
  addLog(`👋 ${a.name} ${why}.`+(gone.length?` Nhóm ${gone.map(g=>g.name).join(', ')} tan rã.`:''),'bad');
}
export function resolveEv(id,k,silent){
  const e=S.events.find(x=>x.id===id);if(!e)return;S.events=S.events.filter(x=>x!==e);
  if(e.kind==='sx'){sxResolve(e,k);if(!silent)act();return}
  if(XK.includes(e.kind)){xResolve(e,k);if(!silent)act();return}
  const a=byId(e.a),b=e.b?byId(e.b):null;if(!a||(e.b&&!b)){if(!silent)act();return}
  const M=(x,d)=>x.mood=clamp(x.mood+d,0,100);
  switch(e.kind+':'+k){
    case'req_rest:yes':if(!a.busy)a.busy={kind:'leave',title:'Nghỉ phép',left:2,total:2};a.energy=100;M(a,20);addLog(`🌴 ${a.name} đi nghỉ phép 2 tuần.`);break;
    case'req_rest:no':M(a,-15);break;
    case'req_raise:yes':a.salary+=3e6;M(a,20);addLog(`💸 Lương ${a.name} tăng lên ${fmt(a.salary)}/tuần.`);break;
    case'req_raise:no':M(a,-15);break;
    case'req_acting:yes':a.wantAct=abs()+10;M(a,10);addLog(`🎭 Bạn hứa tìm vai cho ${a.name} trong 10 tuần.`);break;
    case'req_acting:no':M(a,-12);break;
    case'req_solo:yes':if(S.money<80e6){M(a,-10);addLog(`Không đủ tiền cho ${a.name} ra solo.`,'bad');break}S.money-=80e6;a.solo=true;givePM(a);M(a,25);a.fans+=R(3000,8000);addLog(`🎤 ${a.name} chính thức ra mắt solo!`,'gold');break;
    case'req_solo:no':M(a,-15);break;
    case'req_leave:talk':S.money-=30e6;if(Math.random()<.35+a.mood/100){a.mood=50;addLog(`🤝 ${a.name} đồng ý ở lại sau buổi nói chuyện.`,'good')}else removeArtist(a,'vẫn quyết định rời công ty');break;
    case'req_leave:raise':a.salary+=10e6;a.mood=60;addLog(`💸 ${a.name} ở lại với mức lương ${fmt(a.salary)}/tuần.`);break;
    case'req_leave:go':removeArtist(a,'đã rời công ty');break;
    case'poach:raise':a.salary+=Math.max(5e6,Math.round(a.salary*.5/1e6)*1e6);M(a,15);addLog(`💸 Giữ chân ${a.name} trước lời mời của ${e.r}.`,'good');break;
    case'poach:talk':S.money-=40e6;if(Math.random()<.3+a.mood/120+msk(a,'care')*.04){M(a,10);addLog(`🤝 ${a.name} từ chối ${e.r}, ở lại công ty.`,'good')}else{S.money+=e.fee;const r=S.rivals.find(x=>x.n===e.r);if(r)r.fans+=Math.round(a.fans*.5);removeArtist(a,`chuyển sang ${e.r}`)}break;
    case'poach:go':{S.money+=e.fee;const r=S.rivals.find(x=>x.n===e.r);if(r)r.fans+=Math.round(a.fans*.5);removeArtist(a,`chuyển sang ${e.r} (phí ${fmt(e.fee)})`);break}
    case'rel_conflict:fix':S.money-=10e6;setRel(a,b,0);if(a.tag[b.id]==='enemy')setTag(a,b,null);M(a,-3);M(b,-3);addLog(`🕊️ ${a.name} và ${b.name} đã làm hòa.`,'good');break;
    case'rel_conflict:no':setTag(a,b,'enemy');addLog(`⚡ ${a.name} và ${b.name} trở thành đối thủ.`,'bad');break;
    case'rel_dating:yes':setTag(a,b,'dating');M(a,15);M(b,15);addLog(`💞 ${a.name} và ${b.name} bí mật hẹn hò.`);break;
    case'rel_dating:no':setRel(a,b,getRel(a,b)-20);M(a,-20);M(b,-20);addLog(`💔 ${a.name} và ${b.name} bị cấm hẹn hò.`,'bad');break;
    case'scandal:deny':if(a.scandal.truth&&Math.random()<.6-msk(a,'pr')*.04){a.fans=Math.round(a.fans*.85);a.scandal.sev=Math.min(3,a.scandal.sev+1);a.scandal.left=4;addLog(`📉 Phủ nhận thất bại! Bằng chứng mới khiến scandal của ${a.name} nặng hơn.`,'bad')}else{a.fans=Math.round(a.fans*.98);a.scandal=null;addLog(`🛡️ Phủ nhận thành công, ${a.name} thoát scandal.`,'good')}break;
    case'scandal:sorry':a.fans=Math.round(a.fans*(a.scandal.truth?.96:.91));M(a,-10);a.scandal=null;addLog(`🙇 ${a.name} xin lỗi công khai, dư luận dần dịu lại.`);break;
    case'scandal:sue':S.money-=30e6;if(!a.scandal.truth&&Math.random()<.8+msk(a,'pr')*.015){a.fans=Math.round(a.fans*1.03);a.scandal=null;addLog(`⚖️ Thắng kiện! Fan càng ủng hộ ${a.name}.`,'good')}else{a.fans=Math.round(a.fans*.9);a.scandal=null;addLog(`⚖️ Thua kiện, hình ảnh ${a.name} bị ảnh hưởng.`,'bad')}break;
    case'scandal:public':{const o=byId(a.scandal.other);a.fans=Math.round(a.fans*.92);if(o){setTag(a,o,'public');o.fans=Math.round(o.fans*.95)}a.scandal=null;M(a,10);addLog(`💌 ${a.name} công khai hẹn hò. Một phần fan rời đi, nhưng không còn rủi ro bị "khui".`);break}
    case'scandal:silent':addLog(`🤐 Công ty im lặng về scandal của ${a.name}.`);break;
  }
  if(!silent)act();
}
