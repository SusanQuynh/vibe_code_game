import { R, pick, rnd } from '../core/rng.js';
import { $, clamp, esc, fmt, fmtN } from '../core/util.js';
import { FN, LNM, MN, SONGS } from '../data/names.js';
import { CONCEPTS, MSK, STATS } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fame, fit, genArtist } from './artists.js';
import { bMem, batchOf } from './batches.js';
import { avgFit, bestOf, debutRec } from './debut.js';
import { hasEv, pushEv, removeArtist } from './events.js';
import { migrateV3, v3Info, v3Resolve, v3Tick } from './ext3.js';
import { effSk, mgrExp, mgrTargets, msk } from './managers.js';
import { bizLv, rivalPress, trendB, trendTag } from './market.js';
import { chem, chemTxt } from './offers.js';
import { getRel, harmony, setRel, setTag } from './relations.js';
import { actByKey } from './releases.js';
import { actFree, acts } from './secretary.js';
import { focusKeys } from './week.js';
import { isK, money, roomName, t, t as tl, tx, txVi } from '../i18n/index.js';
import { conceptName, mskName, statName } from '../i18n/labels.js';
import { NPC, act, chibiHTML } from '../ui/building.js';
import { closeM, modal, setCurRC, toast, view } from '../ui/modal.js';
import { RV, openRoom } from '../ui/rooms.js';
import { aTags, bars, det } from '../ui/views.js';

/* ================= EXTENSION v2 ================= */
export const MAX_SA=4;
export const CT_WK=52;
export const pct=p=>Math.round(p*100)+'%';
export const MOOD=(a,d)=>a.mood=clamp(a.mood+d,0,100);
export const asstOf=m=>(S.assts||[]).filter(x=>x.mid===m.id);
export const asstB=(m,k)=>asstOf(m).filter(x=>x.k===k).reduce((t,x)=>t+x.v,0);
export const otherMgr=(a,m)=>S.managers.find(x=>x!==m&&x.as&&mgrTargets(x).includes(a));
/* ---- Income & expense ledger ---- */
export const FIN_I={dig:'🎧 Nhạc số',sgl:'💿 Bán single',job:'📨 Thù lao dự án',con:'🏟️ Concert & fan meeting',film:'🎞️ Phim',live:'📱 Livestream & quảng bá',biz:'📈 Đầu tư',oth:'➕ Khác'};
export const FIN_X={sal:'💵 Lương nghệ sĩ',mgr:'📋 Lương quản lý & trợ lý',trn:'🏫 Đào tạo',prod:'🎬 Sản xuất & debut',hr:'🗂️ Hợp đồng & tuyển dụng',oth:'➖ Khác'};
export function fcEnsure(){if(!S.fc)S.fc={w:abs(),m0:S.money,i:{},x:{}};return S.fc}
export function book(c,v,arts){const f=fcEnsure();v=Math.round(v);if(!v)return;if(v>0)f.i[c]=(f.i[c]||0)+v;else f.x[c]=(f.x[c]||0)-v;
  if(arts&&arts.length&&v>0){const p=v/arts.length;arts.forEach(a=>{if(a){a.earn=(a.earn||0)+p;a.earnC=(a.earnC||0)+p}})}}
export const fsum=o=>Object.values(o||{}).reduce((t,v)=>t+v,0);
export function finClose(){const f=fcEnsure(),o=Math.round((S.money-f.m0)-(fsum(f.i)-fsum(f.x)));
  if(o>0)f.i.oth=(f.i.oth||0)+o;else if(o<0)f.x.oth=(f.x.oth||0)-o;
  S.fin=S.fin||[];S.fin.push({w:abs(),y:S.year,wk:S.week,i:f.i,x:f.x});if(S.fin.length>104)S.fin=S.fin.slice(-104);
  S.fc={w:abs()+1,m0:S.money,i:{},x:{}}}
/* ---- Digital music ---- */
export function digTick(){let t=0;for(const s of S.singles){if(!s.dig||s.end)continue;const wk=abs()-s.w;if(wk<1)continue;
  const v=Math.round(s.dig*Math.pow(s.dk||.88,wk-1)*(1+bizLv('media')*.05)/1e4)*1e4;if(v<1e5||wk>52){s.end=1;continue}
  const net=Math.round(v*(1-(s.roy||0))/1e4)*1e4;s.dt=(s.dt||0)+net;s.dl=net;s.dlw=abs();t+=net;S.money+=net;book('dig',net,(s.m||[]).map(byId).filter(Boolean))}
  if(t)addLog(`🎧 Doanh thu nhạc số tuần này: ${fmt(t)}.`,'good');return t}
export const digNext=s=>{if(!s.dig||s.end)return 0;const wk=abs()-s.w+1;const v=s.dig*Math.pow(s.dk||.88,wk-1);return v<1e5||wk>52?0:Math.round(v*(1-(s.roy||0)))};
/* ---- Reputation & trainee recruiting ---- */
export function compRep(){const tf=S.artists.reduce((t,a)=>t+a.fans,0),aw=(S.awards||[]).reduce((s,e)=>s+e.res.filter(r=>r.ok).length,0),hit=(S.singles||[]).filter(s=>s.rank<=10).length,lr=(S.awards||[]).length?S.awards[S.awards.length-1].rank:0;
  return clamp(Math.round(Math.min(55,Math.sqrt(tf/1500))+Math.min(20,aw*4)+Math.min(15,hit*3)+(lr===1?10:lr===2?6:lr===3?3:0)),0,100)}
export const poolSize=()=>3+Math.floor(compRep()/15);
export const repStars=r=>'★'.repeat(1+Math.floor(Math.min(r,99)/25))+'☆'.repeat(4-Math.floor(Math.min(r,99)/25));
export function repCard(){const r=compRep();return`<div class="card small">${t('rep.title',{r})} <span style="color:var(--sun)">${repStars(r)}</span><br>${t('rep.body',{n:poolSize(),p:Math.round(r/1.2),q:Math.floor(r/12)})}<br><span class="muted">${t('rep.note')}</span></div>`}
/* ---- Auto-remove empty trainee batches ---- */
export function cleanBatches(){if(!Array.isArray(S.batches))return;for(const b of S.batches)if(bMem(b).length)b.had=1;
  const gone=S.batches.filter(b=>b.had&&!bMem(b).length);if(!gone.length)return;
  S.batches=S.batches.filter(b=>!gone.includes(b));
  for(const b of gone){addLog(`🗑️ ${b.n} không còn thực tập sinh nên đã tự xoá.`);for(const m of S.managers)if(m.as&&m.as.t==='b'&&m.as.id===b.id){m.as=null;addLog(`📋 ${m.name} rảnh việc vì ${b.n} đã giải thể, hãy giao lứa khác.`)}}
  if(!S.batches.some(b=>b.id===S.curBatch))S.curBatch=S.batches.length?S.batches[S.batches.length-1].id:0;S.props=null}
export function ensureCurBatch(){if(!S.batches.some(b=>b.id===S.curBatch)){const b={id:uid(),n:'Lứa '+(++S.bno),w:abs()};S.batches.push(b);S.curBatch=b.id;addLog(`🌱 Tự mở ${b.n} cho thực tập sinh mới.`,'good')}return S.curBatch}
/* ---- Hold schedule for debut ---- */
export const dHold=a=>a.status==='trainee'&&a.dReady&&!a.noHold;
export function debutHoldTick(){for(const a of S.artists){if(a.status!=='trainee')continue;const r=debutRec(a),ok=r.t!=='wait';
  if(ok&&!a.dReady){a.dReady=1;addLog(`🎊 TTS ${a.name} đủ điều kiện debut (${txVi(r.short)}). Công ty chừa lịch, không nhận dự án ngoài để ưu tiên debut.`,'gold')}else if(!ok)a.dReady=0}}
export function toggleHold(id){const a=byId(id);if(a){a.noHold=!a.noHold;addLog(a.noHold?`📅 Mở lịch cho ${a.name} nhận dự án dù đã đủ điều kiện debut.`:`📅 Chừa lịch debut cho ${a.name}.`);act()}}
/* ---- Senior mentors ---- */
export const menteesOf=m=>S.artists.filter(a=>a.status==='trainee'&&a.mt===m.id);
export function mtB(a,s){if(!a.mt)return 1;const m=byId(a.mt);if(!m||m.busy)return 1;return 1+clamp((m.st[s]-a.st[s])/150,0,.4)}
export function mentorScore(m,a){return focusKeys(a).reduce((t,k)=>t+Math.max(0,m.st[k]-a.st[k]),0)/4+(a.tag[m.id]==='friend'?6:a.tag[m.id]==='enemy'?-20:0)}
export function mentorSug(a){return S.artists.filter(m=>m.status==='debuted'&&(menteesOf(m).length<2||a.mt===m.id)).sort((x,y)=>mentorScore(y,a)-mentorScore(x,a))[0]}
export function setMentor(tid,mid){const a=byId(tid);if(!a||a.status!=='trainee')return;mid=+mid;
  if(!mid){if(a.mt){const o=byId(a.mt);addLog(`👩‍🏫 ${o?o.name:'Tiền bối'} thôi dẫn dắt ${a.name}.`)}a.mt=0;return act()}
  const m=byId(mid);if(!m||m.status!=='debuted')return act();if(menteesOf(m).filter(x=>x!==a).length>=2){toast(t('mentor.toast.full',{n:m.name}));return act()}
  a.mt=m.id;setRel(a,m,getRel(a,m)+10);addLog(`👩‍🏫 ${m.name} nhận dẫn dắt thực tập sinh ${a.name}.`,'good');act()}
export function mentorSel(a){const s=mentorSug(a);return`<select onchange="setMentor(${a.id},this.value)" aria-label="${t('mentor.aria')}"><option value="0">${t('mentor.none')}</option>${S.artists.filter(m=>m.status==='debuted').sort((x,y)=>((menteesOf(x).length>=2&&a.mt!==x.id)-(menteesOf(y).length>=2&&a.mt!==y.id))||mentorScore(y,a)-mentorScore(x,a)).map(m=>{const full=menteesOf(m).length>=2&&a.mt!==m.id;return`<option value="${m.id}" ${a.mt===m.id?'selected':''} ${full?'disabled':''}>${s===m?'💡 ':''}${esc(m.name)} (+${Math.round(mentorScore(m,a))})${full?t('mentor.full'):''}</option>`}).join('')}</select>`}
export function mentorTick(){for(const a of S.artists){if(a.status!=='trainee'||!a.mt)continue;const m=byId(a.mt);if(!m||m.status!=='debuted'){a.mt=0;continue}
  if(m.busy)continue;m.energy=clamp(m.energy-3,0,100);MOOD(m,1);MOOD(a,2);setRel(a,m,getRel(a,m)+R(1,4));
  if(!a.tag[m.id]&&getRel(a,m)>=60){setTag(a,m,'friend');addLog(`🤝 ${a.name} và tiền bối ${m.name} trở nên thân thiết.`,'good')}}}
/* ---- Manager assistants ---- */
export function hireAsst(mid,k,v,name,fee,sal){const m=S.managers.find(x=>x.id===mid);if(!m)return false;if(asstOf(m).length>=2){toast(t('mgr.toast.asstMax'));return false}if(S.money<fee){toast(t('toast.noMoney'));return false}
  S.money-=fee;book('hr',-fee);S.assts=S.assts||[];S.assts.push({id:uid(),mid,k,v,name,sal});addLog(`🧑‍💻 Tuyển trợ lý ${name} cho QL ${m.name}: ${MSK[k]} +${v}.`,'good');return true}
export function fireAsst(id){const x=(S.assts||[]).find(z=>z.id===id);if(!x)return;S.assts=S.assts.filter(z=>z!==x);addLog(`👋 Cho trợ lý ${x.name} nghỉ việc.`);act()}
/* ---- Manager & artist situations ---- */
export const mxP=(m,k,b)=>clamp(b+(m?effSk(m,k):0)*.06,.05,.95);
export const lowK=a=>focusKeys(a).reduce((m,x)=>a.st[x]<a.st[m]?x:m);
export const SCOUT_W=['ở quán cà phê gần phim trường','trong buổi fan meeting','ở một lễ hội âm nhạc trường học','tại cuộc thi hát karaoke khu phố','trên chuyến tàu đi quay ngoại cảnh','khi xem một buổi diễn đường phố'];
export const MXS={
 fan:{who:'d',ic:'🕵️',t:(a,m)=>t('mx.fan.t',{a:a.name}),d:(a,m)=>t('mx.fan.d',{m:m.name,a:a.name}),
  o:(a,m)=>[{k:'guard',l:t('mx.fan.o.guard',{m:money(20e6)})},{k:'mgr',l:t('mx.fan.o.mgr',{p:pct(mxP(m,'care',.35))})},{k:'police',l:t('mx.fan.o.police',{p:pct(mxP(m,'pr',.4))})},{k:'no',l:t('mx.fan.o.no')}],
  r:{guard:(a,m)=>{S.money-=20e6;MOOD(a,10);return[`🛡️ Vệ sĩ hộ tống ${a.name}, cậu ấy yên tâm trở lại.`,'good']},
   mgr:(a,m)=>Math.random()<mxP(m,'care',.35)?(MOOD(a,12),mgrExp(m,1),[`🤝 ${m.name} khéo léo nói chuyện với nhóm fan, ${a.name} rất cảm động.`,'good']):(MOOD(a,-10),[`😰 ${m.name} xử lý vụng về, fan cuồng vẫn bám theo ${a.name}.`,'bad']),
   police:(a,m)=>Math.random()<mxP(m,'pr',.4)?(a.fans=Math.round(a.fans*1.02),MOOD(a,8),[`🚓 Công ty lên tiếng cứng rắn, fan chân chính ủng hộ ${a.name}.`,'good']):(a.fans=Math.round(a.fans*.98),[`📰 Thông báo bị cho là "làm quá", một số fan phật ý.`,'bad']),
   no:(a,m)=>{MOOD(a,-15);a.energy=clamp(a.energy-15,0,100);return[`😞 ${a.name} mất ngủ vì bị theo dõi.`,'bad']}}},
 late:{who:'x',ic:'⏰',t:(a,m)=>a.status==='trainee'?t('mx.late.tT',{a:a.name}):t('mx.late.tA',{a:a.name}),d:(a,m)=>a.status==='trainee'?t('mx.late.dT',{m:m.name,a:a.name}):t('mx.late.dA',{m:m.name,a:a.name}),
  o:(a,m)=>[{k:'apol',l:a.status==='trainee'?t('mx.late.o.apolT',{p:pct(mxP(m,'plan',.4))}):t('mx.late.o.apolA',{p:pct(mxP(m,'nego',.4))})},{k:'talk',l:t('mx.late.o.talk',{p:pct(mxP(m,'care',.4))})},{k:'fine',l:t('mx.late.o.fine')},{k:'no',l:t('mx.late.o.no')}],
  r:{apol:(a,m)=>{const tts=a.status==='trainee',ok=Math.random()<mxP(m,tts?'plan':'nego',.4);if(tts){if(ok){const k=lowK(a);a.st[k]=clamp(+(a.st[k]+1.5).toFixed(1),0,100);mgrExp(m,1);return[`📚 ${m.name} kèm riêng, ${a.name} bù được buổi tập (${STATS[k]} +1.5).`,'good']}MOOD(a,-4);return[`😓 Buổi kèm riêng không hiệu quả, ${a.name} vẫn chậm tiến độ.`,'bad']}
    const p=Object.keys(a.pw)[0];if(ok){mgrExp(m,1);return[`🙏 ${m.name} dàn xếp êm đẹp với đối tác, không ảnh hưởng quan hệ.`,'good']}if(p)S.partners[p]=clamp((S.partners[p]||0)-6,0,100);return[`😬 Đối tác vẫn không hài lòng${p?`, quan hệ với ${p} −6`:''}.`,'bad']},
   talk:(a,m)=>Math.random()<mxP(m,'care',.4)?(a.energy=clamp(a.energy+20,0,100),MOOD(a,8),[`💬 ${m.name} phát hiện ${a.name} kiệt sức vì lịch dày, điều chỉnh để cậu ấy hồi sức.`,'good']):(MOOD(a,-3),[`💬 ${a.name} không chịu chia sẻ, ${m.name} chưa tìm ra nguyên nhân.`]),
   fine:(a,m)=>{MOOD(a,-10);const k=lowK(a);a.st[k]=clamp(+(a.st[k]+.8).toFixed(1),0,100);return[`📏 ${a.name} bị phạt, nghiêm túc hơn nhưng buồn bã.`]},
   no:(a,m)=>{if(a.status!=='trainee'){const p=Object.keys(a.pw)[0];if(p)S.partners[p]=clamp((S.partners[p]||0)-4,0,100)}return[`🤷 Bỏ qua chuyện ${a.name} đến muộn.`]}}},
 cry:{who:'t',ic:'😢',t:(a,m)=>t('mx.cry.t',{a:a.name}),d:(a,m)=>t('mx.cry.d',{m:m.name,a:a.name}),
  o:(a,m)=>{const s=a.mt?byId(a.mt):S.artists.find(x=>x.status==='debuted'&&!x.busy);return[{k:'rest',l:t('mx.cry.o.rest')},{k:'mgr',l:t('mx.cry.o.mgr',{p:pct(mxP(m,'care',.4))})},...(s?[{k:'senior',l:t('mx.cry.o.senior',{n:s.name})}]:[]),{k:'no',l:t('mx.cry.o.no')}]},
  r:{rest:(a,m)=>{if(!a.busy)a.busy={kind:'leave',title:'Nghỉ lấy lại tinh thần',left:1,total:1};a.energy=100;MOOD(a,15);return[`🌴 ${a.name} được nghỉ 1 tuần để lấy lại tinh thần.`]},
   mgr:(a,m)=>Math.random()<mxP(m,'care',.4)?(MOOD(a,22),mgrExp(m,1),[`🫂 ${m.name} tâm sự cả buổi tối, ${a.name} quyết tâm tiếp tục.`,'good']):(MOOD(a,-5),[`😔 ${a.name} vẫn chưa nguôi sau buổi nói chuyện.`,'bad']),
   senior:(a,m)=>{const s=a.mt?byId(a.mt):S.artists.find(x=>x.status==='debuted'&&!x.busy);if(!s)return[`Không tìm được tiền bối nào rảnh.`];MOOD(a,18);setRel(a,s,getRel(a,s)+15);s.energy=clamp(s.energy-8,0,100);return[`🌟 ${s.name} kể lại thời TTS của mình, ${a.name} được tiếp thêm động lực.`,'good']},
   no:(a,m)=>{MOOD(a,-15);if(a.mood<12){removeArtist(a,'xin rút khỏi chương trình đào tạo');return null}return[`😞 ${a.name} càng thêm chán nản.`,'bad']}}},
 clash:{who:'x',ic:'🗯️',t:(a,m)=>t('mx.clash.t',{m:m.name,a:a.name}),d:(a,m)=>t('mx.clash.d',{m:m.name,a:a.name,s:statName(lowK(a))}),
  o:(a,m)=>[{k:'mgr',l:t('mx.clash.o.mgr')},{k:'mix',l:t('mx.clash.o.mix',{p:pct(mxP(m,'plan',.35))})},{k:'art',l:t('mx.clash.o.art')}],
  r:{mgr:(a,m)=>{const k=lowK(a);a.st[k]=clamp(+(a.st[k]+1.5).toFixed(1),0,100);MOOD(a,-8);a.energy=clamp(a.energy-10,0,100);return[`📋 ${a.name} tập thêm theo QL (${STATS[k]} +1.5) nhưng không vui.`]},
   mix:(a,m)=>{if(Math.random()<mxP(m,'plan',.35)){const k=lowK(a);a.st[k]=clamp(+(a.st[k]+1).toFixed(1),0,100);MOOD(a,4);mgrExp(m,1);return[`🤝 ${m.name} và ${a.name} tìm được lịch cân bằng (${STATS[k]} +1).`,'good']}MOOD(a,-3);return[`😐 Thỏa hiệp không thành, cả hai đều chưa hài lòng.`]},
   art:(a,m)=>{MOOD(a,10);a.energy=clamp(a.energy+10,0,100);return[`😌 ${a.name} được nghỉ ngơi như mong muốn.`]}}},
 injury:{who:'x',ic:'🩹',t:(a,m)=>t('mx.injury.t',{a:a.name}),d:(a,m)=>t('mx.injury.d',{m:m.name,a:a.name}),
  o:(a,m)=>[{k:'vip',l:t('mx.injury.o.vip',{m:money(30e6)})},{k:'push',l:t('mx.injury.o.push',{p:pct(mxP(m,'care',.4))})},{k:'treat',l:t('mx.injury.o.treat',{m:money(10e6)})}],
  r:{vip:(a,m)=>{S.money-=30e6;if(!a.busy)a.busy={kind:'leave',title:'Trị liệu chấn thương',left:1,total:1};a.energy=100;return[`🏥 ${a.name} hồi phục nhanh nhờ trị liệu cao cấp.`,'good']},
   push:(a,m)=>{if(Math.random()<mxP(m,'care',.4)){a.energy=clamp(a.energy-10,0,100);return[`💪 ${a.name} tập nhẹ, chấn thương không nặng thêm.`]}if(!a.busy)a.busy={kind:'leave',title:'Chấn thương nặng hơn',left:3,total:3};MOOD(a,-15);return[`🚑 Chấn thương của ${a.name} nặng hơn, phải nghỉ 3 tuần!`,'bad']},
   treat:(a,m)=>{S.money-=10e6;if(!a.busy)a.busy={kind:'leave',title:'Điều trị chấn thương',left:2,total:2};a.energy=100;return[`🩹 ${a.name} nghỉ 2 tuần điều trị.`]}}},
 leak:{who:'d',ic:'📸',t:(a,m)=>t('mx.leak.t',{a:a.name}),d:(a,m)=>t('mx.leak.d',{a:a.name}),
  o:(a,m)=>[{k:'pr',l:t('mx.leak.o.pr',{p:pct(mxP(m,'pr',.4))})},{k:'content',l:t('mx.leak.o.content',{p:pct(clamp(.2+a.st.variety/100,.1,.9))})},{k:'silent',l:t('mx.leak.o.silent')}],
  r:{pr:(a,m)=>{if(Math.random()<mxP(m,'pr',.4)){a.fans=Math.round(a.fans*1.03)+500;mgrExp(m,1);return[`📰 ${m.name} xoay chuyển dư luận, ${a.name} được khen "đời thường dễ thương".`,'good']}if(!a.scandal){a.scandal={t:'Ảnh hậu trường gây tranh cãi',sev:1,left:3,truth:true,dating:false,other:0};pushEv({kind:'scandal',a:a.id},true)}return[`🚨 Xử lý thất bại, chuyện ảnh lộ thành scandal nhỏ.`,'bad']},
   content:(a,m)=>{if(Math.random()<clamp(.2+a.st.variety/100,.1,.9)){const g=R(1500,5000)+Math.round(a.fans*.02);a.fans+=g;a.yr.fans+=g;return[`😂 ${a.name} tự trêu mình trên mạng, viral! +${fmtN(g)} fan.`,'good']}a.fans=Math.round(a.fans*.97);return[`😬 Màn "biến khủng hoảng thành cơ hội" bị chê gượng gạo.`,'bad']},
   silent:(a,m)=>{a.fans=Math.round(a.fans*.99);return[`🤐 Công ty im lặng, chuyện ảnh lộ dần chìm.`]}}},
 brand:{who:'d',ic:'🛍️',t:(a,m)=>t('mx.brand.t',{a:a.name}),d:(a,m)=>t('mx.brand.d',{m:m.name,a:a.name,p:money(Math.round((5+fame(a)*.6))*1e6)}),
  o:(a,m)=>[{k:'take',l:t('mx.brand.o.take')},{k:'nego',l:t('mx.brand.o.nego',{p:pct(mxP(m,'nego',.35))})},{k:'no',l:t('mx.brand.o.no')}],
  r:{take:(a,m)=>{const p=Math.round((5+fame(a)*.6))*1e6;S.money+=p;book('job',p,[a]);a.energy=clamp(a.energy-20,0,100);MOOD(a,-5);a.fans+=R(300,1500);return[`🛍️ ${a.name} quay quảng cáo gấp, nhận ${fmt(p)} nhưng khá mệt.`,'good']},
   nego:(a,m)=>{const p=Math.round((5+fame(a)*.6)*1.2)*1e6;if(Math.random()<mxP(m,'nego',.35)){S.money+=p;book('job',p,[a]);a.fans+=R(300,1500);mgrExp(m,1);return[`🤝 ${m.name} dời được lịch quay và nâng thù lao lên ${fmt(p)}.`,'good']}MOOD(a,-3);return[`💨 Nhãn hàng chọn người khác vì không chờ được.`,'bad']},
   no:(a,m)=>{MOOD(a,2);return[`🙅 Từ chối quảng cáo để ${a.name} tập trung luyện tập.`]}}},
 burn:{who:'x',ic:'🥵',ok:(a,m)=>mgrTargets(m).length>=2,t:(a,m)=>t('mx.burn.t',{m:m.name}),d:(a,m)=>t('mx.burn.d',{m:m.name,n:mgrTargets(m).length,a:a.name}),
  o:(a,m)=>[{k:'raise',l:t('mx.burn.o.raise',{m:money(2e6)})},...(asstOf(m).length<2?[{k:'asst',l:t('mx.burn.o.asst',{m:money(15e6)})}]:[]),{k:'talk',l:t('mx.burn.o.talk')}],
  r:{raise:(a,m)=>{m.salary+=2e6;mgrExp(m,2);return[`💸 ${m.name} được tăng lương, làm việc hăng hái hơn.`,'good']},
   asst:(a,m)=>{const k=Object.keys(MSK).reduce((x,y)=>m.sk[y]<m.sk[x]?y:x);hireAsst(m.id,k,1,pick(LNM)+' '+pick(FN.concat(MN)),15e6,1e6);return null},
   talk:(a,m)=>{if(Math.random()<.5)return[`☕ ${m.name} được động viên, tạm ổn trở lại.`];const ks=Object.keys(MSK).filter(k=>m.sk[k]>1),k=ks.length?pick(ks):null;if(k)m.sk[k]--;return[`😵 ${m.name} vẫn quá tải${k?`, kỹ năng ${MSK[k]} −1`:''}.`,'bad']}}},
 song:{who:'d',ic:'✍️',ok:(a,m)=>a.st.vocal+a.st.rap>=60,t:(a,m)=>t('mx.song.t',{a:a.name}),d:(a,m)=>t('mx.song.d',{m:m.name,a:a.name}),
  o:(a,m)=>[{k:'yes',l:t('mx.song.o.yes')},{k:'no',l:t('mx.song.o.no')}],
  r:{yes:(a,m)=>{const ck=bestOf(a,CONCEPTS)[0].k,s=mkSong([a.id],ck,'',false);a.cs=(a.cs||0)+1;MOOD(a,10);return[`🎼 Demo «${s.t}» của ${a.name} đã gửi GĐ Âm nhạc chờ duyệt (Phòng Thu âm).`,'good']},
   no:(a,m)=>{MOOD(a,-6);return[`😕 ${a.name} hơi buồn vì chưa được thử sức sáng tác.`]}}},
 fight:{who:'t',ic:'⚡',pre:(a,m)=>{const ms=S.artists.filter(x=>x!==a&&x.status==='trainee'&&x.batch===a.batch);return ms.length?{b:pick(ms).id}:null},
  t:(a,m,e)=>t('mx.fight.t',{a:a.name,b:byId(e.b)?.name||t('mx.fight.anon')}),d:(a,m,e)=>t('mx.fight.d',{m:m.name}),
  o:(a,m)=>[{k:'mgr',l:t('mx.fight.o.mgr',{p:pct(mxP(m,'care',.4))})},{k:'both',l:t('mx.fight.o.both')},{k:'no',l:t('mx.fight.o.no')}],
  r:{mgr:(a,m,e)=>{const b=byId(e.b);if(!b)return null;if(Math.random()<mxP(m,'care',.4)){setRel(a,b,getRel(a,b)+20);MOOD(a,3);MOOD(b,3);mgrExp(m,1);return[`🕊️ ${a.name} và ${b.name} làm hòa nhờ ${m.name}.`,'good']}setRel(a,b,getRel(a,b)-10);return[`💢 Hòa giải thất bại, ${a.name} và ${b.name} càng xa cách.`,'bad']},
   both:(a,m,e)=>{const b=byId(e.b);if(!b)return null;MOOD(a,-8);MOOD(b,-8);setRel(a,b,getRel(a,b)+5);return[`📏 Cả hai bị phạt dọn phòng tập, cùng chịu phạt nên dần thông cảm.`]},
   no:(a,m,e)=>{const b=byId(e.b);if(!b)return null;setRel(a,b,getRel(a,b)+R(-20,10));if(getRel(a,b)<=-40&&a.tag[b.id]!=='enemy'){setTag(a,b,'enemy');return[`⚡ ${a.name} và ${b.name} trở thành đối thủ.`,'bad']}return[`🤷 ${a.name} và ${b.name} tự giải quyết với nhau.`]}}}
};
export function mxTick(){for(const m of S.managers){if(!m.as)continue;const ts=mgrTargets(m);if(!ts.length)continue;
  if(Math.random()<.07){const a=pick(ts);if(!S.events.some(e=>e.a===a.id)){const ks=Object.keys(MXS).filter(k=>{const D=MXS[k],w=D.who;return(w==='x'||(w==='d'&&a.status==='debuted')||(w==='t'&&a.status==='trainee'))&&(!D.ok||D.ok(a,m))});
    if(ks.length){const k=pick(ks),D=MXS[k],ex=D.pre?D.pre(a,m):{};if(ex)pushEv({kind:'mx',mx:k,a:a.id,m:m.id,...ex})}}}
  if(Math.random()<.045&&asstOf(m).length<2&&!S.events.some(e=>e.kind==='mp'&&e.m===m.id)){const k=Object.keys(MSK).reduce((x,y)=>m.sk[y]<m.sk[x]?y:x),v=R(1,3);pushEv({kind:'mp',t:'asst',m:m.id,k,v,name:pick(LNM)+' '+pick(FN.concat(MN)),fee:v*8e6,sal:v*1e6})}
  else if(Math.random()<.035&&!S.events.some(e=>e.kind==='mp'&&e.t==='scout')){const a=pick(ts),c=genArtist();c.talent=+rnd(1.05,1.3).toFixed(2);c.st[c.spec]=clamp(c.st[c.spec]+R(8,15),0,80);pushEv({kind:'mp',t:'scout',m:m.id,a:a.id,cand:c,where:pick(SCOUT_W)})}}}
export function candBlock(c){return`<div class="card" style="background:var(--bg)"><div class="row"><div class="chibi mini">${chibiHTML(c)}</div><div class="small"><b>${esc(c.name)}</b> · ${t('lobby.cand',{g:c.g==='F'?t('lobby.female'):t('lobby.male'),a:c.age,s:statName(c.spec),t:c.talent})}</div></div>${bars(c)}</div>`}
/* ---- Group disbanding ---- */
export const gMgr=g=>S.managers.find(m=>m.as&&m.as.t==='g'&&m.as.id===g.id);
export const gHiatus=k=>{if(!k||k[0]!=='g')return false;const g=S.groups.find(x=>'g'+x.id===k);return!!(g&&g.hiatus>abs())};
export function disbandTick(){for(const g of S.groups){if(g.hiatus){if(g.hiatus<=abs()){g.hiatus=0;addLog(`🎉 Nhóm ${g.name} kết thúc thời gian tạm ngừng, sẵn sàng hoạt động trở lại.`,'good')}else continue}
  if(g.members.length<2||S.events.some(e=>e.kind==='disband'&&e.g===g.id))continue;
  const ms=g.members.map(byId).filter(Boolean),h=harmony(g.members),am=ms.reduce((t,a)=>t+a.mood,0)/ms.length,age=S.year-g.y;
  const p=.002+(h<0?.025:0)+(h<-6?.03:0)+(am<35?.03:0)+(age>=4?.01:0);
  if(Math.random()<p){const why=h<0?'mâu thuẫn nội bộ kéo dài':am<35?'các thành viên kiệt sức, tâm trạng sa sút':age>=4?'các thành viên muốn theo đuổi con đường riêng':'bất đồng về định hướng âm nhạc';pushEv({kind:'disband',g:g.id,a:ms[0].id,why},true);addLog(`⚠️ Nhóm ${g.name} có nguy cơ tan rã: ${why}.`,'bad')}}}
export function disbandGroup(g,why){const ms=g.members.map(byId).filter(Boolean);S.groups=S.groups.filter(x=>x!==g);
  for(const m of S.managers)if(m.as&&m.as.t==='g'&&m.as.id===g.id)m.as=null;
  if(S.camp)delete S.camp['g'+g.id];S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!=='g'+g.id);
  ms.forEach(a=>{a.fans=Math.round(a.fans*.88);MOOD(a,-8);a.hist.unshift(`N${S.year}: Nhóm ${g.name} giải tán`)});
  S.props=null;addLog(`💔 Nhóm ${g.name} chính thức giải tán (${why}). Các thành viên vẫn ở lại công ty, có thể ra solo, làm diễn viên hoặc vào nhóm mới.`,'bad')}
export const fixP=g=>{const m=gMgr(g);return clamp(.35+(m?effSk(m,'care')*.05:0)+(harmony(g.members)>=0?.15:0),.1,.92)};
/* ---- Contracts & renewals ---- */
export function ctInit(a){if(a.status==='debuted'&&!a.ce){a.ce=abs()+R(10,40);a.cs0=abs()-R(5,30);a.earnC=a.earnC||0;if(a.cf0==null)a.cf0=Math.round(a.fans*.7)}}
export function renewEval(a,mul=1){const wk=Math.max(1,abs()-(a.cs0||abs()-26)),cost=a.salary*wk,earn=Math.round(a.earnC||0),roi=earn/Math.max(cost,1),grow=a.fans-(a.cf0||0),gp=grow/Math.max(a.cf0||0,3000)*100,L=[];let sc=50;
  sc+=clamp((roi-1)*20,-25,25);L.push(t('renew.roi',{e:money(earn),c:money(cost),x:roi.toFixed(2)}));
  sc+=clamp(gp/5,-10,15);L.push(t('renew.fans',{g:(grow>=0?'+':'')+fmtN(grow),p:(gp>=0?'+':'')+Math.round(gp)}));
  sc+=fame(a)*.15;L.push(t('renew.fame',{n:fame(a)}));
  if(a.evG){sc+=isK(a.evG,'grade.ex')?8:isK(a.evG,'grade.fail')?-12:0;L.push(t('renew.lastEv',{g:a.evG})+(a.evFail?t('renew.fails',{n:a.evFail}):''))}
  sc-=(a.evFail||0)*2;if(a.scandal){sc-=10;L.push(t('renew.scandal'))}
  if(a.mood<35)L.push(t('renew.lowMood',{m:Math.round(a.mood)}));
  sc=clamp(Math.round(sc),0,100);
  const rec=sc>=58?[t('renew.rec.yes'),'m']:sc>=40?[t('renew.rec.maybe'),'s']:[t('renew.rec.no'),'r'];
  const dem=Math.round(Math.max(a.salary*1.1,1e6+fame(a)*.5e6)*(1-msk(a,'nego')*.02)*mul/1e6)*1e6;
  const p=clamp(.5+(a.mood-50)/120+msk(a,'care')*.03+(fame(a)>60?-.1:0)+(mul>1?.25:0),.08,.97);
  return{sc,rec,L,dem,p}}
export function renewBlock(a,mul=1){if(!a)return'';const E=renewEval(a,mul);return`<div class="card" style="background:var(--bg);margin-bottom:8px"><div class="row"><b>${t('renew.h')}</b><span class="sp"></span><span class="tag ${E.rec[1]}">${E.rec[0]}</span></div>
  <div class="bar" style="margin:4px 0"><i style="width:${E.sc}%"></i></div><div class="small muted">${t('renew.score',{s:E.sc})}</div>
  <div class="small" style="margin-top:4px">${E.L.join('<br>')}</div>
  <div class="small" style="margin-top:6px">${t('renew.ask',{d:money(E.dem),s:money(a.salary),p:pct(E.p),f:money(E.dem*4),w:a.ce-abs()})}${mul>1?t('renew.second'):''}</div></div>`}
export function renewOpts(a,mul=1){const E=renewEval(a,mul);return[1,2,3].map(y=>({k:'r'+y,l:t('renew.opt',{y,f:money(E.dem*4*y)})})).concat([{k:'end',l:t('renew.end')},{k:'later',l:t('renew.later')}])}
export function renewDo(id,k,mul=1,quiet){const a=byId(id);if(!a)return true;
  if(k[0]==='r'){const y=+k.slice(1),E=renewEval(a,mul),bonus=E.dem*4*y;if(S.money<bonus){toast(t('renew.toast.fee'));return false}
    S.events=S.events.filter(e=>!(e.kind==='renew'&&e.a===id));
    if(Math.random()<E.p+(y===1?.05:y===3?-.05:0)){S.money-=bonus;book('hr',-bonus);a.salary=E.dem;a.ce=Math.max(a.ce,abs())+y*52;a.cs0=abs();a.earnC=0;a.cf0=a.fans;a.ceNo=0;MOOD(a,10);addLog(`✍️ ${a.name} tái ký ${y} năm: lương ${fmt(a.salary)}/tuần, phí ký ${fmt(bonus)}.`,'good')}
    else{MOOD(a,-5);if(mul<1.3){addLog(`🙅 ${a.name} từ chối đề nghị tái ký, muốn mức đãi ngộ cao hơn.`,'bad');pushEv({kind:'renew',a:a.id,mul:1.3},true)}else{a.ceNo=1;addLog(`🚪 ${a.name} từ chối tái ký lần nữa và sẽ rời công ty khi hết hạn hợp đồng.`,'bad')}}}
  else{S.events=S.events.filter(e=>!(e.kind==='renew'&&e.a===id));if(k==='end'){a.ceNo=1;addLog(`📄 Công ty quyết định không tái ký với ${a.name}. ${a.name} sẽ rời đi khi hết hạn (${a.ce-abs()} tuần nữa).`)}}
  if(!quiet)act();return true}
export function contractTick(){for(const a of [...S.artists]){if(a.status!=='debuted')continue;ctInit(a);const left=a.ce-abs();
  if(left<=0){S.events=S.events.filter(e=>!(e.kind==='renew'&&e.a===a.id));removeArtist(a,'đã hết hạn hợp đồng và rời công ty');continue}
  if(left<=8&&!a.ceNo&&!hasEv(a.id,'renew')){pushEv({kind:'renew',a:a.id,mul:1},true);if(left===8)addLog(`📄 Hợp đồng của ${a.name} còn 8 tuần. Xem đánh giá tái ký ở Phòng Nhân sự.`)}}}
export function viewRenew(id){const a=byId(id);if(!a)return closeM();const e=S.events.find(x=>x.kind==='renew'&&x.a===id),mul=e?e.mul:1;setCurRC('var(--r-hr)');
  modal(`<h2>${t('renew.title',{n:esc(a.name)})}</h2><div class="sub">${aTags(a)}${t('renew.sal',{s:money(a.salary)})}</div>${renewBlock(a,mul)}${a.ceNo?`<div class="card small bad">${t('renew.noted')}</div>`:''}
  <div class="row">${renewOpts(a,mul).filter(o=>o.k!=='later').map(o=>`<button class="btn sm ${o.k==='end'?'warn':'pri'}" onclick="if(renewDo(${a.id},'${o.k}',${mul},1)){view(()=>RV.hr());act()}">${o.l}</button>`).join('')}</div>
  <button class="btn" style="margin-top:10px" onclick="openRoom('hr')">← ${roomName('hr')}</button>`)}
/* ---- Songwriting & Music Director ---- */
export const SONGW=['Ngày Mai Sẽ Khác','Gửi Em Mùa Hạ','Không Thể Quên','Bước Qua Đêm Tối','Nắng Ấm','Thanh Xuân','Lạc Lối','Tự Do','Hẹn Mùa Thu','Sóng Vỗ','Đường Về','Thành Phố Ngủ Quên','Một Lần Nữa','Bay Lên','Chạm','Ánh Sao Cuối Trời'];
export const wp=a=>a.st.vocal*.3+a.st.rap*.3+a.st.variety*.1+a.st.dance*.05+(a.cs||0)*4+a.talent*12;
export function mkSong(ids,ck,title,writing){const ws=ids.map(byId).filter(Boolean);if(!ws.length)return null;const main=ws[0],co=ws.slice(1);
  let q=wp(main)*.75+(co.length?co.reduce((t,a)=>t+wp(a),0)/co.length*.25+co.length*3+chem(ids)*30:wp(main)*.2)+(fit(main,CONCEPTS[ck].w)-40)*.15+R(-8,12);
  q=clamp(Math.round(q),5,98);
  const s={id:uid(),t:(title||pick(SONGW.concat(SONGS))).slice(0,40),ck,q,by:ids,st:writing?'writing':'review',w:abs(),doneAt:abs(),y:S.year};
  S.songs=S.songs||[];S.songs.unshift(s);if(S.songs.length>40)S.songs.length=40;return s}
export function songTick(){for(const s of (S.songs||[]))if(s.st==='writing'&&s.doneAt<=abs()){s.st='review';s.by.map(byId).filter(Boolean).forEach(a=>{a.cs=(a.cs||0)+1;MOOD(a,3)});addLog(`🎼 Demo «${s.t}» hoàn thành, chờ GĐ Âm nhạc duyệt tại Phòng Thu âm.`,'good')}}
export function mdReview(s){const tb=trendB(s.ck),rp=rivalPress(),mk=clamp(Math.round(s.q+tb*1.2-rp*.4),1,99);
  const g=mk>=82?'S':mk>=68?'A':mk>=54?'B':mk>=40?'C':'D';
  const cm=t(`song.cm.${g}`);
  const tr=tb>0?t('song.trHot',{c:conceptName(s.ck),n:tb}):tb<0?t('song.trCold',{c:conceptName(s.ck),n:tb}):t('song.trFlat',{c:conceptName(s.ck)});
  const sug=acts().map(x=>{const ms=x.m.map(byId).filter(Boolean);if(!ms.length)return null;const own=s.by.some(i=>x.m.includes(i));return{k:x.k,n:x.n,f:Math.round(avgFit(ms,CONCEPTS[s.ck].w)+(own?6:0)),own,free:actFree(x)}}).filter(Boolean).sort((a,b)=>b.f-a.f).slice(0,3);
  return{mk,g,better:clamp(Math.round(mk*1.05-8),1,99),cm,tr,rp,sug}}
export const GC={S:'s',A:'m',B:'v',C:'',D:'r'};
export const curSong=()=>(S.songs||[]).find(x=>x.id===+($('#sSong')?.value||0)&&x.st==='ok');
export const sgBonus=(s,m)=>s?(s.q-50)*.35+(s.by.some(i=>m.includes(i))?4:0):0;
export function songPrev(x){const s=curSong();if(!s)return t('song.buy');const own=s.by.some(i=>x.m.includes(i)),b=Math.round(sgBonus(s,x.m));return t('song.own',{g:s.rv?s.rv.g:'?',b:(b>=0?'+':'')+b,o:own?t('song.ownTag'):''})}
export function songOpts(){const L=(S.songs||[]).filter(s=>s.st==='ok');return`<option value="0">${t('song.optBuy')}</option>${L.map(s=>`<option value="${s.id}">${s.md?'🎼':'✍️'} «${esc(s.t)}»${s.for&&actByKey(s.for)?t('song.forAct',{n:esc(actByKey(s.for).n.slice(2).trim())}):''}${t('song.rank',{g:s.rv?s.rv.g:'?'})} · ${conceptName(s.ck)}</option>`).join('')}`}
export function songCard(){const n=(S.songs||[]).filter(s=>s.st==='review').length,ok=(S.songs||[]).filter(s=>s.st==='ok').length,wr=(S.songs||[]).filter(s=>s.st==='writing').length;
  return`<div class="card row"><div class="chibi mini">${chibiHTML(NPC[3])}</div><div class="small" style="flex:1"><b>${t('song.md')}:</b> ${n?t('song.cardN',{n}):t('song.cardNone')} ${ok?t('song.cardOk',{n:ok}):''}${wr?' '+t('song.cardWr',{n:wr}):''}</div><button class="btn sm pri" onclick="view(viewSongs)">${t('song.write')}</button></div>`}
export function writeSong(){const main=+$('#wMain').value,co=[...document.querySelectorAll('.wco:checked')].map(x=>+x.value).filter(i=>i!==main),ck=$('#wCon').value,t=($('#wTitle').value||'').trim().slice(0,40);
  if(!main)return toast(tl('song.toast.main'));if(co.length>2)return toast(tl('song.toast.max'));
  const ids=[main,...co],ws=ids.map(byId);if(ws.some(a=>!a||a.busy))return toast(tl('song.toast.busy'));
  if(S.money<5e6)return toast(tl('toast.noMoney'));S.money-=5e6;book('prod',-5e6);
  const s=mkSong(ids,ck,t,true);ws.forEach(a=>a.busy={kind:'write',title:'Sáng tác «'+s.t+'»',left:1,total:1,lk:'write'});
  addLog(`✍️ ${ws.map(a=>a.name).join(', ')} vào phòng thu sáng tác «${s.t}» (${CONCEPTS[ck].n}). Demo xong sau 1 tuần.`);act()}
export function wPrev(){const el=$('#wPrev');if(!el)return;const main=byId(+$('#wMain').value);if(!main){el.textContent='';return}
  const co=[...document.querySelectorAll('.wco:checked')].map(x=>+x.value).filter(i=>i!==main.id);if(co.length>2){el.innerHTML=`<span class="bad">${t('song.toast.max')}</span>`;return}
  const ids=[main.id,...co],c=co.length?chem(ids):0,ck=$('#wCon').value,base=wp(main)*.75+(co.length?co.reduce((t,i)=>t+wp(byId(i)),0)/co.length*.25+co.length*3+c*30:wp(main)*.2)+(fit(main,CONCEPTS[ck].w)-40)*.15;
  el.innerHTML=`${t('song.prevQ',{a:Math.round(clamp(base-8,5,98)),b:Math.round(clamp(base+12,5,98))})}${co.length?`${t('song.coop',{n:co.length})}${c?' · '+chemTxt(c):''}`:''}${trendTag(ck)?t('song.conceptTag',{x:trendTag(ck)}):''}`}
export function songAct(id,k){const s=(S.songs||[]).find(x=>x.id===id);if(!s)return;
  if(k==='ok'){const r=mdReview(s);s.rv={g:r.g,mk:r.mk};s.st='ok';s.by.map(byId).filter(Boolean).forEach(a=>MOOD(a,8));addLog(`✅ GĐ Âm nhạc duyệt «${s.t}» (hạng ${r.g}, điểm thị trường ${r.mk}).`,'good')}
  else if(k==='redo'){if(S.money<3e6)return toast(t('toast.noMoney'));if((s.rw||0)>=2)return toast(t('song.toast.redoMax'));S.money-=3e6;s.rw=(s.rw||0)+1;const d=R(2,9);s.q=clamp(s.q+d,5,98);addLog(`🔁 Chỉnh sửa «${s.t}» theo góp ý của GĐ Âm nhạc: chất lượng +${d}.`)}
  else if(k==='drop'){S.songs=S.songs.filter(x=>x!==s);s.by.map(byId).filter(Boolean).forEach(a=>MOOD(a,-5));addLog(`🗑️ Bỏ bài «${s.t}».`)}
  act()}
export function songRelease(id,k){const s=(S.songs||[]).find(x=>x.id===id);if(!s)return;if(s.st==='review')songAct(id,'ok');const x=actByKey(k);if(!x||!actFree(x))return toast(t('song.toast.actBusy'));
  openRoom('studio');setTimeout(()=>{if(!$('#sSong'))return;$('#sAct').value=k;$('#sSong').value=id;$('#sSong').onchange&&$('#sSong').onchange();$('#sSong').scrollIntoView({behavior:'smooth',block:'center'})},30)}
export function viewSong(id){const s=(S.songs||[]).find(x=>x.id===id);if(!s)return view(viewSongs);setCurRC('var(--r-studio)');const r=mdReview(s),by=s.by.map(byId).filter(Boolean);
  modal(`<div class="row"><div class="chibi mini">${chibiHTML(NPC[3])}</div><div><h2 style="margin:0">«${esc(s.t)}»</h2><div class="small muted">${conceptName(s.ck)}${trendTag(s.ck)} · ${t('song.by',{n:by.map(a=>esc(a.name)).join(', ')||(s.md?t('song.mdTag'):'—')})} · ${s.st==='ok'?t('song.st.ok'):s.st==='used'?t('song.st.used'):t('song.st.review')}</div></div></div>
  <div class="card" style="margin-top:10px"><div class="row"><b>${t('song.reviewH')}</b><span class="sp"></span><span class="tag ${GC[r.g]}" style="font-size:14px">${t('song.grade',{g:r.g})}</span></div>
  <div class="small">${t('song.quality',{q:s.q,m:r.mk})}</div><div class="bar" style="margin:4px 0"><i style="width:${r.mk}%"></i></div>
  <div class="small">${t('song.better',{n:r.better})} ${r.tr}${r.rp?' '+t('song.rivalCb',{n:Math.round(r.rp*.4)}):''}</div>
  <div class="small" style="margin-top:6px">💬 "${r.cm}"</div></div>
  ${s.st!=='used'?`<h3>${t('song.fitH')}</h3>${r.sug.length?r.sug.map((x,i)=>`<div class="prow"><b>${i===0?'⭐ ':''}${esc(x.n)}</b><span class="small muted">${t('song.fitPct',{n:x.f})}${x.own?t('song.fitOwn'):''}${x.free?'':t('song.fitBusy')}</span><span class="sp"></span>${x.free&&r.g!=='D'?`<button class="btn sm ${i===0?'pri':''}" onclick="songRelease(${s.id},'${x.k}')">${t('song.give')}</button>`:''}</div>`).join(''):`<div class="small muted">${t('song.noActs')}</div>`}`:`<div class="card small">${t('song.released',{r:s.rank||'?',a:esc(s.act||'')})}</div>`}
  <div class="row" style="margin-top:10px">${s.st==='review'?`<button class="btn pri" onclick="songAct(${s.id},'ok');view(viewSongs)">${t('song.approve')}</button>`:''}${s.st!=='used'?`<button class="btn" onclick="songAct(${s.id},'redo')" ${(s.rw||0)>=2?'disabled':''}>${t('song.redo',{m:money(3e6),n:2-(s.rw||0)})}</button><button class="btn warn" onclick="songAct(${s.id},'drop');view(viewSongs)">${t('song.drop')}</button>`:''}</div>
  <button class="btn" style="margin-top:10px" onclick="view(viewSongs)">${t('song.back')}</button>`)}
export function viewSongs(){setCurRC('var(--r-studio)');const L=S.songs||[],rv=L.filter(s=>s.st==='review'),ok=L.filter(s=>s.st==='ok'),wr=L.filter(s=>s.st==='writing'),us=L.filter(s=>s.st==='used');
  const free=S.artists.filter(a=>!a.busy).sort((x,y)=>wp(y)-wp(x));
  const row=s=>{const r=mdReview(s);return`<div class="prow"><b>«${esc(s.t)}»</b><span class="small muted">${conceptName(s.ck)}${trendTag(s.ck)} · ${s.by.map(byId).filter(Boolean).map(a=>esc(a.name)).join(', ')||(s.md?t('song.mdTag'):'')}${s.for&&actByKey(s.for)?t('song.forAct',{n:esc(actByKey(s.for).n.slice(2).trim())}):''}</span><span class="tag ${GC[s.rv?s.rv.g:r.g]}">${s.rv?s.rv.g:r.g}</span><span class="sp"></span><button class="btn sm ${s.st==='review'?'pri':''}" onclick="view(()=>viewSong(${s.id}))">${s.st==='review'?t('song.review'):t('song.view')}</button></div>`};
  modal(`<div class="row"><div class="chibi mini">${chibiHTML(NPC[3])}</div><div><h2 style="margin:0">${t('song.title')}</h2><div class="sub" style="margin:0">${t('song.sub')}</div></div></div>
  <div class="card small" style="margin-top:8px">${t('song.note')}</div>
  ${det('sg-rv',t('song.rvH',{n:rv.length}),rv.map(row).join('')||`<div class="small muted">${t('song.rvNone')}</div>`,true)}
  ${det('sg-ok',t('song.okH',{n:ok.length}),ok.map(row).join('')||`<div class="small muted">${t('song.okNone')}</div>`,true)}
  ${wr.length?det('sg-wr',t('song.wrH',{n:wr.length}),wr.map(s=>`<div class="small">«${esc(s.t)}» · ${s.by.map(byId).filter(Boolean).map(a=>esc(a.name)).join(', ')}${t('song.nextWk')}</div>`).join(''),true):''}
  ${det('sg-new',t('song.newH',{m:money(5e6)}),free.length?`<div class="row"><span class="small">${t('song.mainLabel')}</span><select id="wMain" style="flex:1">${free.map(a=>`<option value="${a.id}">${esc(a.name)} · ${t('song.pen',{p:Math.round(wp(a))})}${a.cs?t('song.nSongs',{n:a.cs}):''}</option>`).join('')}</select></div>
    <div class="row" style="margin-top:6px"><span class="small">${t('song.conceptLabel')}</span><select id="wCon">${Object.keys(CONCEPTS).map(k=>`<option value="${k}">${conceptName(k)}${trendTag(k)}</option>`).join('')}</select><input type="text" id="wTitle" placeholder="${t('song.titlePh')}" style="flex:1"></div>
    <div class="small" style="margin-top:6px">${t('song.coLabel')}</div><div class="list">${free.map(a=>`<label><input type="checkbox" class="wco" value="${a.id}" onchange="wPrev()"> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">${t('song.penVR',{p:Math.round(wp(a)),v:Math.round(a.st.vocal),r:Math.round(a.st.rap)})}</span></span></label>`).join('')}</div>
    <div class="small muted" id="wPrev" style="margin:6px 0"></div><button class="btn pink" onclick="writeSong()">${t('song.start')}</button>`:`<div class="small muted">${t('song.noFree')}</div>`,!rv.length)}
  ${us.length?det('sg-us',t('song.usH',{n:us.length}),us.map(s=>`<div class="small">${t('song.usRow',{t:esc(s.t),a:esc((s.act||'').slice(2)),r:s.rank,g:s.rv?s.rv.g:'?'})}</div>`).join(''),false):''}
  <button class="btn" style="margin-top:8px" onclick="openRoom('studio')">← ${roomName('studio')}</button>`);
  if($('#wMain')){$('#wMain').onchange=wPrev;$('#wCon').onchange=wPrev;wPrev()}}
/* ---- Info & resolution for new events ---- */
export const XK=['mx','mp','disband','renew'];
export function xInfo(e){
  if(e.kind==='v3')return v3Info(e);
  if(e.kind==='mx'){const D=MXS[e.mx],a=byId(e.a),m=S.managers.find(x=>x.id===e.m);if(!D||!a||!m)return null;return{ic:D.ic,t:D.t(a,m,e),d:D.d(a,m,e),o:D.o(a,m,e)}}
  if(e.kind==='mp'){const m=S.managers.find(x=>x.id===e.m);if(!m)return null;
    if(e.t==='asst')return{ic:'🧑‍💻',t:t('ev.asst.t',{m:m.name}),d:t('ev.asst.d',{m:m.name,n:e.name,s:mskName(e.k),a:effSk(m,e.k),b:Math.min(10,effSk(m,e.k)+e.v),f:money(e.fee),w:money(e.sal)}),o:[{k:'yes',l:t('ev.asst.o.yes',{m:money(e.fee)})},{k:'no',l:t('ev.o.refuse')}]};
    if(e.t==='scout'){const a=byId(e.a),c=e.cand;return{ic:'🔎',t:t('ev.scout.t',{m:m.name}),d:t('ev.scout.d',{a:a?a.name:t('ev.scout.anon'),w:e.where,m:m.name,c:c.name,s:statName(c.spec),k:c.talent}),o:[{k:'yes',l:t('ev.scout.o.yes',{m:money(10e6)})},{k:'no',l:t('ev.o.ignore')}]}}
    return null}
  if(e.kind==='disband'){const g=S.groups.find(x=>x.id===e.g);if(!g)return null;const m=gMgr(g);return{ic:'💔',t:t('ev.disband.t',{g:g.name}),d:t('ev.disband.d',{w:e.why,h:harmony(g.members),m:m?t('ev.disband.mgr',{n:m.name,c:effSk(m,'care')}):t('ev.disband.noMgr')}),o:[{k:'fix',l:t('ev.disband.o.fix',{m:money(50e6),p:pct(fixP(g))})},{k:'split',l:t('ev.disband.o.split')},{k:'pause',l:t('ev.disband.o.pause')}]}}
  if(e.kind==='renew'){const a=byId(e.a);if(!a)return null;return{ic:'📄',t:t('ev.renew.t',{a:a.name}),d:t('ev.renew.d',{a:a.name,w:a.ce-abs()}),o:renewOpts(a,e.mul)}}
  return undefined}
export function xResolve(e,k){
  if(e.kind==='v3')return v3Resolve(e,k);
  if(e.kind==='mx'){const D=MXS[e.mx],a=byId(e.a),m=S.managers.find(x=>x.id===e.m);if(!D||!a||!m||!D.r[k])return;const r=D.r[k](a,m,e);if(r)addLog(r[0],r[1]||'');return}
  if(e.kind==='mp'){const m=S.managers.find(x=>x.id===e.m);if(!m)return;
    if(e.t==='asst'){if(k==='yes'){if(!hireAsst(m.id,e.k,e.v,e.name,e.fee,e.sal))S.events.push(e)}else addLog(`🙅 Từ chối đề xuất tuyển trợ lý của ${m.name}.`);return}
    if(e.t==='scout'){if(k==='yes'){if(S.money<10e6){toast(t('toast.noMoney'));S.events.push(e);return}S.money-=10e6;book('hr',-10e6);const c=e.cand;if(S.artists.some(x=>x.id===c.id))return;c.batch=ensureCurBatch();S.artists.push(c);mgrExp(m,1);addLog(`🌟 ${c.name} được ${m.name} phát hiện, ký hợp đồng TTS vào ${(S.batches.find(b=>b.id===c.batch)||{n:''}).n}.`,'gold')}return}}
  if(e.kind==='disband'){const g=S.groups.find(x=>x.id===e.g);if(!g)return;const ms=g.members.map(byId).filter(Boolean);
    if(k==='fix'){S.money-=50e6;if(Math.random()<fixP(g)){for(const a of ms)for(const b of ms)if(a!==b){if(a.tag[b.id]==='enemy')setTag(a,b,null);if(getRel(a,b)<10)setRel(a,b,10)}ms.forEach(a=>MOOD(a,10));const m=gMgr(g);if(m)mgrExp(m,2);addLog(`🕊️ Buổi hòa giải thành công, nhóm ${g.name} đoàn kết trở lại!`,'good')}else disbandGroup(g,'hòa giải thất bại')}
    else if(k==='split')disbandGroup(g,e.why);
    else{g.hiatus=abs()+8;ms.forEach(a=>MOOD(a,15));for(const a of ms)for(const b of ms)if(a!==b&&a.tag[b.id]==='enemy'&&Math.random()<.5){setTag(a,b,null);setRel(a,b,0)}S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!=='g'+g.id);addLog(`⏸️ Nhóm ${g.name} tạm ngừng hoạt động 8 tuần để các thành viên nghỉ ngơi.`)}
    return}
  if(e.kind==='renew'){if(!renewDo(e.a,k,e.mul,true))S.events.push(e)}}
/* ---- Weekly tick ---- */
export function weekV2(){mentorTick();songTick();digTick();
  {const t=(S.assts||[]).reduce((s,x)=>s+x.sal,0);if(t){S.money-=t;book('mgr',-t)}}
  contractTick();debutHoldTick();disbandTick();mxTick();
  if(Math.random()<compRep()/120&&S.pool.length<poolSize()+4){const a=genArtist();S.pool.push(a);addLog(`📨 ${a.name} (${a.g==='F'?'nữ':'nam'}, ${a.age}) tự gửi đơn ứng tuyển thực tập sinh nhờ danh tiếng công ty.`,'good')};migrateV3();v3Tick()}
export function migrateV2(){S.assts=S.assts||[];S.songs=S.songs||[];S.fin=S.fin||[];
  if(!S.bno)S.bno=Math.max(S.batches.length,...S.batches.map(b=>typeof b.n==='string'?+((b.n.match(/\d+/)||[0])[0]):+(b.n.p&&b.n.p.i||0)));
  for(const m of S.managers){if(!m.as)continue;const t=m.as.t;
    if(t==='t'){const b=S.batches.find(b=>bMem(b).length&&!S.managers.some(x=>x.as&&x.as.t==='b'&&x.as.id===b.id));m.as=b?{t:'b',id:b.id}:null;addLog(`📋 Quản lý TTS giờ chỉ theo lứa: ${m.name} ${b?'chuyển sang phụ trách '+b.n:'chờ được giao lứa mới'}.`)}
    else if(t==='s'||t==='d'){const pool=S.artists.filter(a=>(t==='s'?a.solo&&!a.pm:a.actor)&&!S.managers.some(x=>x!==m&&x.as&&x.as.t!=='s'&&x.as.t!=='d'&&mgrTargets(x).includes(a))).slice(0,MAX_SA);m.as={t:'l',id:0,ids:pool.map(a=>a.id)};addLog(`📋 ${m.name} giờ quản lý danh sách tối đa ${MAX_SA} nghệ sĩ solo/diễn viên.`)}
    else if(t==='l'&&m.as.ids.length>MAX_SA)m.as.ids=m.as.ids.slice(0,MAX_SA)}
  S.artists.forEach(ctInit);S.batches.forEach(b=>{if(bMem(b).length)b.had=1})}
/* ---- Sales Room ---- */
export function finChart(L){if(!L.length)return`<div class="small muted">${t('fin.chartNone')}</div>`;const W=320,H=140,n=L.length,bw=W/n,mx=Math.max(1,...L.map(f=>Math.max(fsum(f.i),fsum(f.x))));
  const bars=L.map((f,i)=>{const hi=fsum(f.i)/mx*(H-26),hx=fsum(f.x)/mx*(H-26),x=i*bw+bw*.15,w=bw*.33;return`<rect x="${x.toFixed(1)}" y="${(H-16-hi).toFixed(1)}" width="${w.toFixed(1)}" height="${hi.toFixed(1)}" rx="2" style="fill:var(--mint)"/><rect x="${(x+w+1).toFixed(1)}" y="${(H-16-hx).toFixed(1)}" width="${w.toFixed(1)}" height="${hx.toFixed(1)}" rx="2" style="fill:var(--red)"/><text x="${(i*bw+bw/2).toFixed(1)}" y="${H-3}" text-anchor="middle" style="fill:var(--muted);font-size:8px">${t('common.wkShort',{w:f.wk})}</text>`}).join('');
  return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="${t('fin.chartAria')}"><line x1="0" y1="${H-16}" x2="${W}" y2="${H-16}" style="stroke:var(--line)"/>${bars}</svg><div class="small muted"><span style="color:var(--mint)">■</span> ${t('fin.inW')} · <span style="color:var(--red)">■</span> ${t('fin.outW')}</div>`}
export function catRows(o,lab,col){const ks=Object.keys(o).filter(k=>o[k]>0).sort((a,b)=>o[b]-o[a]),mx=Math.max(1,...ks.map(k=>o[k])),tot=fsum(o);return ks.map(k=>`<div class="small" style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:6px;align-items:center;margin:2px 0"><span>${lab[k]||k}</span><div class="bar"><i style="width:${o[k]/mx*100}%;background:${col}"></i></div><b>${money(o[k])} <span class="muted">${Math.round(o[k]/tot*100)}%</span></b></div>`).join('')||`<div class="small muted">${t('art.none')}</div>`}
export const finLab=(p,T)=>Object.fromEntries(Object.keys(T).map(k=>[k,t(`fin.${p}.${k}`)]));
export function aggr(L,f){const o={};L.forEach(e=>{for(const k in e[f])o[k]=(o[k]||0)+e[f][k]});return o}
RV.sales=function(){
  const F=S.fin||[],L=F.slice(-12),last=F[F.length-1],fc=fcEnsure(),yr=F.filter(f=>f.y===S.year),yi=yr.reduce((t,f)=>t+fsum(f.i),0),yx=yr.reduce((t,f)=>t+fsum(f.x),0);
  const l4=F.slice(-4),ai=aggr(l4,'i'),ax=aggr(l4,'x');
  const dg=S.singles.filter(s=>s.dig),act=dg.filter(s=>!s.end).sort((a,b)=>(b.dl||0)-(a.dl||0)),nx=act.reduce((t,s)=>t+digNext(s),0),dgT=dg.reduce((t,s)=>t+(s.dt||0),0),roy=dg.filter(s=>s.roy).reduce((t,s)=>t+Math.round((s.dt||0)/(1-s.roy)*s.roy),0);
  const top=S.artists.filter(a=>a.earn).sort((a,b)=>b.earn-a.earn).slice(0,8),mxE=top.length?top[0].earn:1;
  const net=last?fsum(last.i)-fsum(last.x):0;
  modal(`<h2>💹 ${roomName('sales')}</h2><div class="sub">${t('fin.sub')}</div>
  <div class="grid2"><div class="card">${t('fin.lastIn')}<br><b class="good">${money(last?fsum(last.i):0)}</b></div><div class="card">${t('fin.lastOut')}<br><b class="bad">${money(last?fsum(last.x):0)}</b></div><div class="card">${t('fin.lastNet')}<br><b class="${net<0?'bad':'good'}">${net>=0?'+':''}${money(net)}</b></div><div class="card">${t('fin.ytd',{y:S.year})}<br><b class="${yi-yx<0?'bad':'good'}">${yi-yx>=0?'+':''}${money(yi-yx)}</b><br><span class="small muted">${t('fin.inOut',{i:money(yi),o:money(yx)})}</span></div></div>
  ${det('sl-chart',t('fin.chartH'),finChart(L),true)}
  ${det('sl-cat',t('fin.catH'),`<h3 style="margin-top:0">${t('fin.srcH',{m:money(fsum(ai))})}</h3>${catRows(ai,finLab('in',FIN_I),'var(--mint)')}<h3>${t('fin.expH',{m:money(fsum(ax))})}</h3>${catRows(ax,finLab('out',FIN_X),'var(--red)')}`,true)}
  ${det('sl-dig',t('fin.digH',{n:act.length}),`<div class="grid2" style="margin-bottom:6px"><div class="card small">${t('fin.digTot')}<br><b>${money(dgT)}</b></div><div class="card small">${t('fin.digNext')}<br><b>${money(nx)}</b></div><div class="card small">${t('fin.digRoy')}<br><b>${money(roy)}</b></div></div>
    <div class="small muted" style="margin-bottom:4px">${t('fin.digNote')}</div>
    ${act.map(s=>`<div class="prow"><b>«${esc(s.title)}»</b><span class="small muted">${t('fin.digRow',{a:esc(s.act.slice(2)),r:s.rank,w:abs()-s.w,o:s.roy?t('fin.outside'):t('fin.inhouse')})}</span><span class="sp"></span><span class="small">${t('fin.digWk',{w:money(s.dl||0),t:money(s.dt||0)})}</span></div>`).join('')||`<div class="small muted">${t('fin.digNone')}</div>`}`,true)}
  ${det('sl-art',t('fin.artH',{n:top.length}),top.map(a=>`<div class="small" style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) auto;gap:6px;align-items:center;margin:3px 0"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><div class="bar"><i style="width:${a.earn/mxE*100}%"></i></div><b>${money(a.earn)}</b></div>`).join('')||`<div class="small muted">${t('fin.artNone')}</div>`,false)}
  ${det('sl-now',t('fin.nowH'),`<div class="small">${t('fin.now',{i:money(fsum(fc.i)),o:money(fsum(fc.x))})}</div>${catRows(fc.i,finLab('in',FIN_I),'var(--mint)')}${catRows(fc.x,finLab('out',FIN_X),'var(--red)')}`,false)}
  ${det('sl-hist',t('fin.histH'),F.slice(-16).reverse().map(f=>{const n=fsum(f.i)-fsum(f.x);return`<div class="prow"><b>${t('common.yw',{y:f.y,w:f.wk})}</b><span class="small muted">${t('fin.inOut',{i:money(fsum(f.i)),o:money(fsum(f.x))})}</span><span class="sp"></span><b class="${n<0?'bad':'good'}">${n>=0?'+':''}${money(n)}</b></div>`}).join('')||`<div class="small muted">${t('common.empty')}</div>`,false)}`);
};
RV.hr=function(){
  const deb=S.artists.filter(a=>a.status==='debuted').sort((a,b)=>(a.ce||1e9)-(b.ce||1e9)),tts=S.artists.filter(a=>a.status==='trainee'),mentors=S.artists.filter(a=>menteesOf(a).length);
  modal(`<h2>🗂️ ${roomName('hr')}</h2><div class="sub">${t('hr.sub')}</div>
  ${repCard()}
  ${det('hr-ct',t('hr.ctH',{n:deb.length}),`<div class="small muted" style="margin-bottom:6px">${t('hr.ctNote')}</div>`+deb.map(a=>{const E=renewEval(a),l=a.ce-abs();return`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">${t('hr.left',{c:l<=8?'bad':'',l,s:money(a.salary)})}</span><span class="tag ${E.rec[1]}">${a.ceNo?t('hr.noRenew'):E.rec[0]}</span><span class="sp"></span><button class="btn sm ${l<=8?'pri':''}" onclick="view(()=>viewRenew(${a.id}))">${t('hr.eval')}</button></div>`}).join('')||`<div class="small muted">${t('hr.noDeb')}</div>`,true)}
  ${det('hr-mt',t('hr.mtH',{a:tts.filter(a=>a.mt).length,b:tts.length}),`<div class="small muted" style="margin-bottom:6px">${t('hr.mtNote')}</div>`+(tts.map(a=>`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">${esc(tx((batchOf(a)||{n:''}).n))}</span><span class="sp"></span>${mentorSel(a)}</div>`).join('')||`<div class="small muted">${t('hr.noTts')}</div>`)+(mentors.length?`<div class="small" style="margin-top:6px">${t('hr.mentoring')} ${mentors.map(m=>`${esc(m.name)} → ${menteesOf(m).map(x=>esc(x.name)).join(', ')}`).join(' · ')}</div>`:''),true)}
  ${det('hr-as',t('hr.asH',{n:(S.assts||[]).length}),(S.assts||[]).map(x=>{const m=S.managers.find(z=>z.id===x.mid);return`<div class="prow"><b>${esc(x.name)}</b><span class="small muted">${t('hr.asRow',{m:esc(m?m.name:'?'),k:mskName(x.k),v:x.v,s:money(x.sal)})}</span><span class="sp"></span><button class="btn sm warn" onclick="fireAsst(${x.id})">${t('hr.fire')}</button></div>`}).join('')||`<div class="small muted">${t('hr.asNone')}</div>`,false)}`);
};
/* ================= EXTENSION v3 ================= */
XK.push('v3');
