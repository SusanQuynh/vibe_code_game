import { R, pick, rnd } from '../core/rng.js';
import { clamp, fmt, fmtN } from '../core/util.js';
import { FN, LNM, MN, SONGS } from '../data/names.js';
import { CONCEPTS, MSK, STATS } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fame, fit, genArtist } from './artists.js';
import { bMem } from './batches.js';
import { avgFit, bestOf, debutRec } from './debut.js';
import { hasEv, pushEv, removeArtist } from './events.js';
import { migrateV3, v3Info, v3Resolve, v3Tick } from './ext3.js';
import { effSk, mgrExp, mgrTargets, msk } from './managers.js';
import { bizLv, rivalPress, trendB } from './market.js';
import { chem } from './offers.js';
import { getRel, harmony, setRel, setTag } from './relations.js';
import { actFree, acts } from './secretary.js';
import { focusKeys } from './week.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

/* ================= MỞ RỘNG v2 ================= */
export const MAX_SA=4;
export const CT_WK=52;
export const pct=p=>Math.round(p*100)+'%';
export const MOOD=(a,d)=>a.mood=clamp(a.mood+d,0,100);
export const asstOf=m=>(S.assts||[]).filter(x=>x.mid===m.id);
export const asstB=(m,k)=>asstOf(m).filter(x=>x.k===k).reduce((t,x)=>t+x.v,0);
export const otherMgr=(a,m)=>S.managers.find(x=>x!==m&&x.as&&mgrTargets(x).includes(a));
/* ---- Sổ thu chi ---- */
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
/* ---- Nhạc số ---- */
export function digTick(){let t=0;for(const s of S.singles){if(!s.dig||s.end)continue;const wk=abs()-s.w;if(wk<1)continue;
  const v=Math.round(s.dig*Math.pow(s.dk||.88,wk-1)*(1+bizLv('media')*.05)/1e4)*1e4;if(v<1e5||wk>52){s.end=1;continue}
  const net=Math.round(v*(1-(s.roy||0))/1e4)*1e4;s.dt=(s.dt||0)+net;s.dl=net;s.dlw=abs();t+=net;S.money+=net;book('dig',net,(s.m||[]).map(byId).filter(Boolean))}
  if(t)addLog(`🎧 Doanh thu nhạc số tuần này: ${fmt(t)}.`,'good');return t}
export const digNext=s=>{if(!s.dig||s.end)return 0;const wk=abs()-s.w+1;const v=s.dig*Math.pow(s.dk||.88,wk-1);return v<1e5||wk>52?0:Math.round(v*(1-(s.roy||0)))};
/* ---- Danh tiếng & tuyển TTS ---- */
export function compRep(){const tf=S.artists.reduce((t,a)=>t+a.fans,0),aw=(S.awards||[]).reduce((s,e)=>s+e.res.filter(r=>r.ok).length,0),hit=(S.singles||[]).filter(s=>s.rank<=10).length,lr=(S.awards||[]).length?S.awards[S.awards.length-1].rank:0;
  return clamp(Math.round(Math.min(55,Math.sqrt(tf/1500))+Math.min(20,aw*4)+Math.min(15,hit*3)+(lr===1?10:lr===2?6:lr===3?3:0)),0,100)}
export const poolSize=()=>3+Math.floor(compRep()/15);
export const repStars=r=>'★'.repeat(1+Math.floor(Math.min(r,99)/25))+'☆'.repeat(4-Math.floor(Math.min(r,99)/25));
/* ---- Lứa TTS tự xoá ---- */
export function cleanBatches(){if(!Array.isArray(S.batches))return;for(const b of S.batches)if(bMem(b).length)b.had=1;
  const gone=S.batches.filter(b=>b.had&&!bMem(b).length);if(!gone.length)return;
  S.batches=S.batches.filter(b=>!gone.includes(b));
  for(const b of gone){addLog(`🗑️ ${b.n} không còn thực tập sinh nên đã tự xoá.`);for(const m of S.managers)if(m.as&&m.as.t==='b'&&m.as.id===b.id){m.as=null;addLog(`📋 ${m.name} rảnh việc vì ${b.n} đã giải thể, hãy giao lứa khác.`)}}
  if(!S.batches.some(b=>b.id===S.curBatch))S.curBatch=S.batches.length?S.batches[S.batches.length-1].id:0;S.props=null}
export function ensureCurBatch(){if(!S.batches.some(b=>b.id===S.curBatch)){const b={id:uid(),n:'Lứa '+(++S.bno),w:abs()};S.batches.push(b);S.curBatch=b.id;addLog(`🌱 Tự mở ${b.n} cho thực tập sinh mới.`,'good')}return S.curBatch}
/* ---- Chừa lịch debut ---- */
export const dHold=a=>a.status==='trainee'&&a.dReady&&!a.noHold;
export function debutHoldTick(){for(const a of S.artists){if(a.status!=='trainee')continue;const r=debutRec(a),ok=r.t!=='wait';
  if(ok&&!a.dReady){a.dReady=1;addLog(`🎊 TTS ${a.name} đủ điều kiện debut (${r.short}). Công ty chừa lịch, không nhận dự án ngoài để ưu tiên debut.`,'gold')}else if(!ok)a.dReady=0}}
export function toggleHold(id){const a=byId(id);if(a){a.noHold=!a.noHold;addLog(a.noHold?`📅 Mở lịch cho ${a.name} nhận dự án dù đã đủ điều kiện debut.`:`📅 Chừa lịch debut cho ${a.name}.`);act()}}
/* ---- Tiền bối dẫn dắt ---- */
export const menteesOf=m=>S.artists.filter(a=>a.status==='trainee'&&a.mt===m.id);
export function mtB(a,s){if(!a.mt)return 1;const m=byId(a.mt);if(!m||m.busy)return 1;return 1+clamp((m.st[s]-a.st[s])/150,0,.4)}
export function mentorScore(m,a){return focusKeys(a).reduce((t,k)=>t+Math.max(0,m.st[k]-a.st[k]),0)/4+(a.tag[m.id]==='friend'?6:a.tag[m.id]==='enemy'?-20:0)}
export function mentorSug(a){return S.artists.filter(m=>m.status==='debuted'&&(menteesOf(m).length<2||a.mt===m.id)).sort((x,y)=>mentorScore(y,a)-mentorScore(x,a))[0]}
export function setMentor(tid,mid){const a=byId(tid);if(!a||a.status!=='trainee')return;mid=+mid;
  if(!mid){if(a.mt){const o=byId(a.mt);addLog(`👩‍🏫 ${o?o.name:'Tiền bối'} thôi dẫn dắt ${a.name}.`)}a.mt=0;return act()}
  const m=byId(mid);if(!m||m.status!=='debuted')return act();if(menteesOf(m).filter(x=>x!==a).length>=2){toast(`${m.name} đã dẫn dắt đủ 2 TTS`);return act()}
  a.mt=m.id;setRel(a,m,getRel(a,m)+10);addLog(`👩‍🏫 ${m.name} nhận dẫn dắt thực tập sinh ${a.name}.`,'good');act()}
export function mentorTick(){for(const a of S.artists){if(a.status!=='trainee'||!a.mt)continue;const m=byId(a.mt);if(!m||m.status!=='debuted'){a.mt=0;continue}
  if(m.busy)continue;m.energy=clamp(m.energy-3,0,100);MOOD(m,1);MOOD(a,2);setRel(a,m,getRel(a,m)+R(1,4));
  if(!a.tag[m.id]&&getRel(a,m)>=60){setTag(a,m,'friend');addLog(`🤝 ${a.name} và tiền bối ${m.name} trở nên thân thiết.`,'good')}}}
/* ---- Trợ lý quản lý ---- */
export function hireAsst(mid,k,v,name,fee,sal){const m=S.managers.find(x=>x.id===mid);if(!m)return false;if(asstOf(m).length>=2){toast('Mỗi quản lý tối đa 2 trợ lý');return false}if(S.money<fee){toast('Không đủ tiền');return false}
  S.money-=fee;book('hr',-fee);S.assts=S.assts||[];S.assts.push({id:uid(),mid,k,v,name,sal});addLog(`🧑‍💻 Tuyển trợ lý ${name} cho QL ${m.name}: ${MSK[k]} +${v}.`,'good');return true}
export function fireAsst(id){const x=(S.assts||[]).find(z=>z.id===id);if(!x)return;S.assts=S.assts.filter(z=>z!==x);addLog(`👋 Cho trợ lý ${x.name} nghỉ việc.`);act()}
/* ---- Tình huống quản lý & nghệ sĩ ---- */
export const mxP=(m,k,b)=>clamp(b+(m?effSk(m,k):0)*.06,.05,.95);
export const lowK=a=>focusKeys(a).reduce((m,x)=>a.st[x]<a.st[m]?x:m);
export const SCOUT_W=['ở quán cà phê gần phim trường','trong buổi fan meeting','ở một lễ hội âm nhạc trường học','tại cuộc thi hát karaoke khu phố','trên chuyến tàu đi quay ngoại cảnh','khi xem một buổi diễn đường phố'];
export const MXS={
 fan:{who:'d',ic:'🕵️',t:(a,m)=>`Fan cuồng bám theo ${a.name}`,d:(a,m)=>`Quản lý ${m.name} báo: vài fan cuồng theo dõi ${a.name} tới tận ký túc xá và chụp lén. ${a.name} rất hoảng sợ.`,
  o:(a,m)=>[{k:'guard',l:'Thuê vệ sĩ (20 tr)'},{k:'mgr',l:`QL tự nói chuyện với fan (~${pct(mxP(m,'care',.35))})`},{k:'police',l:`Báo công an & cảnh báo fan (~${pct(mxP(m,'pr',.4))})`},{k:'no',l:'Mặc kệ'}],
  r:{guard:(a,m)=>{S.money-=20e6;MOOD(a,10);return[`🛡️ Vệ sĩ hộ tống ${a.name}, cậu ấy yên tâm trở lại.`,'good']},
   mgr:(a,m)=>Math.random()<mxP(m,'care',.35)?(MOOD(a,12),mgrExp(m,1),[`🤝 ${m.name} khéo léo nói chuyện với nhóm fan, ${a.name} rất cảm động.`,'good']):(MOOD(a,-10),[`😰 ${m.name} xử lý vụng về, fan cuồng vẫn bám theo ${a.name}.`,'bad']),
   police:(a,m)=>Math.random()<mxP(m,'pr',.4)?(a.fans=Math.round(a.fans*1.02),MOOD(a,8),[`🚓 Công ty lên tiếng cứng rắn, fan chân chính ủng hộ ${a.name}.`,'good']):(a.fans=Math.round(a.fans*.98),[`📰 Thông báo bị cho là "làm quá", một số fan phật ý.`,'bad']),
   no:(a,m)=>{MOOD(a,-15);a.energy=clamp(a.energy-15,0,100);return[`😞 ${a.name} mất ngủ vì bị theo dõi.`,'bad']}}},
 late:{who:'x',ic:'⏰',t:(a,m)=>`${a.name} đến muộn ${a.status==='trainee'?'buổi tập':'buổi ghi hình'}`,d:(a,m)=>a.status==='trainee'?`Huấn luyện viên phàn nàn với QL ${m.name}: ${a.name} đến muộn 40 phút, cả lứa phải chờ.`:`Đối tác gọi cho QL ${m.name} phàn nàn vì ${a.name} đến muộn, cả ê-kíp phải chờ.`,
  o:(a,m)=>[{k:'apol',l:a.status==='trainee'?`QL kèm riêng để bù buổi (~${pct(mxP(m,'plan',.4))})`:`QL xin lỗi & dàn xếp (~${pct(mxP(m,'nego',.4))})`},{k:'talk',l:`Hỏi rõ lý do (~${pct(mxP(m,'care',.4))})`},{k:'fine',l:'Phạt nghệ sĩ'},{k:'no',l:'Bỏ qua'}],
  r:{apol:(a,m)=>{const tts=a.status==='trainee',ok=Math.random()<mxP(m,tts?'plan':'nego',.4);if(tts){if(ok){const k=lowK(a);a.st[k]=clamp(+(a.st[k]+1.5).toFixed(1),0,100);mgrExp(m,1);return[`📚 ${m.name} kèm riêng, ${a.name} bù được buổi tập (${STATS[k]} +1.5).`,'good']}MOOD(a,-4);return[`😓 Buổi kèm riêng không hiệu quả, ${a.name} vẫn chậm tiến độ.`,'bad']}
    const p=Object.keys(a.pw)[0];if(ok){mgrExp(m,1);return[`🙏 ${m.name} dàn xếp êm đẹp với đối tác, không ảnh hưởng quan hệ.`,'good']}if(p)S.partners[p]=clamp((S.partners[p]||0)-6,0,100);return[`😬 Đối tác vẫn không hài lòng${p?`, quan hệ với ${p} −6`:''}.`,'bad']},
   talk:(a,m)=>Math.random()<mxP(m,'care',.4)?(a.energy=clamp(a.energy+20,0,100),MOOD(a,8),[`💬 ${m.name} phát hiện ${a.name} kiệt sức vì lịch dày, điều chỉnh để cậu ấy hồi sức.`,'good']):(MOOD(a,-3),[`💬 ${a.name} không chịu chia sẻ, ${m.name} chưa tìm ra nguyên nhân.`]),
   fine:(a,m)=>{MOOD(a,-10);const k=lowK(a);a.st[k]=clamp(+(a.st[k]+.8).toFixed(1),0,100);return[`📏 ${a.name} bị phạt, nghiêm túc hơn nhưng buồn bã.`]},
   no:(a,m)=>{if(a.status!=='trainee'){const p=Object.keys(a.pw)[0];if(p)S.partners[p]=clamp((S.partners[p]||0)-4,0,100)}return[`🤷 Bỏ qua chuyện ${a.name} đến muộn.`]}}},
 cry:{who:'t',ic:'😢',t:(a,m)=>`TTS ${a.name} muốn bỏ cuộc`,d:(a,m)=>`QL ${m.name} thấy ${a.name} khóc sau buổi tập. Áp lực đánh giá khiến em muốn rời chương trình đào tạo.`,
  o:(a,m)=>{const s=a.mt?byId(a.mt):S.artists.find(x=>x.status==='debuted'&&!x.busy);return[{k:'rest',l:'Cho nghỉ 1 tuần'},{k:'mgr',l:`QL tâm sự (~${pct(mxP(m,'care',.4))})`},...(s?[{k:'senior',l:`Nhờ tiền bối ${s.name} động viên`}]:[]),{k:'no',l:'Mặc kệ'}]},
  r:{rest:(a,m)=>{if(!a.busy)a.busy={kind:'leave',title:'Nghỉ lấy lại tinh thần',left:1,total:1};a.energy=100;MOOD(a,15);return[`🌴 ${a.name} được nghỉ 1 tuần để lấy lại tinh thần.`]},
   mgr:(a,m)=>Math.random()<mxP(m,'care',.4)?(MOOD(a,22),mgrExp(m,1),[`🫂 ${m.name} tâm sự cả buổi tối, ${a.name} quyết tâm tiếp tục.`,'good']):(MOOD(a,-5),[`😔 ${a.name} vẫn chưa nguôi sau buổi nói chuyện.`,'bad']),
   senior:(a,m)=>{const s=a.mt?byId(a.mt):S.artists.find(x=>x.status==='debuted'&&!x.busy);if(!s)return[`Không tìm được tiền bối nào rảnh.`];MOOD(a,18);setRel(a,s,getRel(a,s)+15);s.energy=clamp(s.energy-8,0,100);return[`🌟 ${s.name} kể lại thời TTS của mình, ${a.name} được tiếp thêm động lực.`,'good']},
   no:(a,m)=>{MOOD(a,-15);if(a.mood<12){removeArtist(a,'xin rút khỏi chương trình đào tạo');return null}return[`😞 ${a.name} càng thêm chán nản.`,'bad']}}},
 clash:{who:'x',ic:'🗯️',t:(a,m)=>`QL ${m.name} và ${a.name} bất đồng lịch trình`,d:(a,m)=>`${m.name} muốn ${a.name} tập thêm ${STATS[lowK(a)]} đang yếu, còn ${a.name} muốn được nghỉ ngơi. Hai bên nhờ Giám đốc phân xử.`,
  o:(a,m)=>[{k:'mgr',l:'Nghe theo quản lý'},{k:'mix',l:`Thỏa hiệp (~${pct(mxP(m,'plan',.35))})`},{k:'art',l:'Nghe theo nghệ sĩ'}],
  r:{mgr:(a,m)=>{const k=lowK(a);a.st[k]=clamp(+(a.st[k]+1.5).toFixed(1),0,100);MOOD(a,-8);a.energy=clamp(a.energy-10,0,100);return[`📋 ${a.name} tập thêm theo QL (${STATS[k]} +1.5) nhưng không vui.`]},
   mix:(a,m)=>{if(Math.random()<mxP(m,'plan',.35)){const k=lowK(a);a.st[k]=clamp(+(a.st[k]+1).toFixed(1),0,100);MOOD(a,4);mgrExp(m,1);return[`🤝 ${m.name} và ${a.name} tìm được lịch cân bằng (${STATS[k]} +1).`,'good']}MOOD(a,-3);return[`😐 Thỏa hiệp không thành, cả hai đều chưa hài lòng.`]},
   art:(a,m)=>{MOOD(a,10);a.energy=clamp(a.energy+10,0,100);return[`😌 ${a.name} được nghỉ ngơi như mong muốn.`]}}},
 injury:{who:'x',ic:'🩹',t:(a,m)=>`${a.name} bị chấn thương khi tập`,d:(a,m)=>`QL ${m.name} báo ${a.name} bị bong gân khi tập vũ đạo. Bác sĩ khuyên nên nghỉ.`,
  o:(a,m)=>[{k:'vip',l:'Vật lý trị liệu cao cấp, nghỉ 1 tuần (30 tr)'},{k:'push',l:`Tập nhẹ tiếp (~${pct(mxP(m,'care',.4))} ổn)`},{k:'treat',l:'Điều trị & nghỉ 2 tuần (10 tr)'}],
  r:{vip:(a,m)=>{S.money-=30e6;if(!a.busy)a.busy={kind:'leave',title:'Trị liệu chấn thương',left:1,total:1};a.energy=100;return[`🏥 ${a.name} hồi phục nhanh nhờ trị liệu cao cấp.`,'good']},
   push:(a,m)=>{if(Math.random()<mxP(m,'care',.4)){a.energy=clamp(a.energy-10,0,100);return[`💪 ${a.name} tập nhẹ, chấn thương không nặng thêm.`]}if(!a.busy)a.busy={kind:'leave',title:'Chấn thương nặng hơn',left:3,total:3};MOOD(a,-15);return[`🚑 Chấn thương của ${a.name} nặng hơn, phải nghỉ 3 tuần!`,'bad']},
   treat:(a,m)=>{S.money-=10e6;if(!a.busy)a.busy={kind:'leave',title:'Điều trị chấn thương',left:2,total:2};a.energy=100;return[`🩹 ${a.name} nghỉ 2 tuần điều trị.`]}}},
 leak:{who:'d',ic:'📸',t:(a,m)=>`Ảnh hậu trường của ${a.name} bị lộ`,d:(a,m)=>`Một loạt ảnh hậu trường của ${a.name} lan truyền trên mạng. Dư luận đang chia hai phe.`,
  o:(a,m)=>[{k:'pr',l:`QL xử lý truyền thông (~${pct(mxP(m,'pr',.4))})`},{k:'content',l:`Biến thành nội dung quảng bá (~${pct(clamp(.2+a.st.variety/100,.1,.9))})`},{k:'silent',l:'Im lặng'}],
  r:{pr:(a,m)=>{if(Math.random()<mxP(m,'pr',.4)){a.fans=Math.round(a.fans*1.03)+500;mgrExp(m,1);return[`📰 ${m.name} xoay chuyển dư luận, ${a.name} được khen "đời thường dễ thương".`,'good']}if(!a.scandal){a.scandal={t:'Ảnh hậu trường gây tranh cãi',sev:1,left:3,truth:true,dating:false,other:0};pushEv({kind:'scandal',a:a.id},true)}return[`🚨 Xử lý thất bại, chuyện ảnh lộ thành scandal nhỏ.`,'bad']},
   content:(a,m)=>{if(Math.random()<clamp(.2+a.st.variety/100,.1,.9)){const g=R(1500,5000)+Math.round(a.fans*.02);a.fans+=g;a.yr.fans+=g;return[`😂 ${a.name} tự trêu mình trên mạng, viral! +${fmtN(g)} fan.`,'good']}a.fans=Math.round(a.fans*.97);return[`😬 Màn "biến khủng hoảng thành cơ hội" bị chê gượng gạo.`,'bad']},
   silent:(a,m)=>{a.fans=Math.round(a.fans*.99);return[`🤐 Công ty im lặng, chuyện ảnh lộ dần chìm.`]}}},
 brand:{who:'d',ic:'🛍️',t:(a,m)=>`Nhãn hàng muốn ký gấp với ${a.name}`,d:(a,m)=>`Một nhãn hàng liên hệ QL ${m.name}, muốn ${a.name} quay quảng cáo ngay tuần này dù trùng lịch tập. Thù lao ${fmt(Math.round((5+fame(a)*.6))*1e6)}.`,
  o:(a,m)=>[{k:'take',l:'Nhận ngay'},{k:'nego',l:`QL đàm phán dời lịch (~${pct(mxP(m,'nego',.35))})`},{k:'no',l:'Từ chối'}],
  r:{take:(a,m)=>{const p=Math.round((5+fame(a)*.6))*1e6;S.money+=p;book('job',p,[a]);a.energy=clamp(a.energy-20,0,100);MOOD(a,-5);a.fans+=R(300,1500);return[`🛍️ ${a.name} quay quảng cáo gấp, nhận ${fmt(p)} nhưng khá mệt.`,'good']},
   nego:(a,m)=>{const p=Math.round((5+fame(a)*.6)*1.2)*1e6;if(Math.random()<mxP(m,'nego',.35)){S.money+=p;book('job',p,[a]);a.fans+=R(300,1500);mgrExp(m,1);return[`🤝 ${m.name} dời được lịch quay và nâng thù lao lên ${fmt(p)}.`,'good']}MOOD(a,-3);return[`💨 Nhãn hàng chọn người khác vì không chờ được.`,'bad']},
   no:(a,m)=>{MOOD(a,2);return[`🙅 Từ chối quảng cáo để ${a.name} tập trung luyện tập.`]}}},
 burn:{who:'x',ic:'🥵',ok:(a,m)=>mgrTargets(m).length>=2,t:(a,m)=>`QL ${m.name} kiệt sức`,d:(a,m)=>`${m.name} ôm ${mgrTargets(m).length} người, chạy lịch cả cuối tuần. ${a.name} lo lắng vì quản lý hay quên việc.`,
  o:(a,m)=>[{k:'raise',l:'Tăng lương QL 2 tr/tuần'},...(asstOf(m).length<2?[{k:'asst',l:`Tuyển trợ lý ngay (15 tr)`}]:[]),{k:'talk',l:'Động viên tinh thần'}],
  r:{raise:(a,m)=>{m.salary+=2e6;mgrExp(m,2);return[`💸 ${m.name} được tăng lương, làm việc hăng hái hơn.`,'good']},
   asst:(a,m)=>{const k=Object.keys(MSK).reduce((x,y)=>m.sk[y]<m.sk[x]?y:x);hireAsst(m.id,k,1,pick(LNM)+' '+pick(FN.concat(MN)),15e6,1e6);return null},
   talk:(a,m)=>{if(Math.random()<.5)return[`☕ ${m.name} được động viên, tạm ổn trở lại.`];const ks=Object.keys(MSK).filter(k=>m.sk[k]>1),k=ks.length?pick(ks):null;if(k)m.sk[k]--;return[`😵 ${m.name} vẫn quá tải${k?`, kỹ năng ${MSK[k]} −1`:''}.`,'bad']}}},
 song:{who:'d',ic:'✍️',ok:(a,m)=>a.st.vocal+a.st.rap>=60,t:(a,m)=>`${a.name} muốn tự sáng tác`,d:(a,m)=>`${a.name} nhờ QL ${m.name} xin phép Giám đốc: cậu ấy đã viết sẵn một bản demo và muốn gửi cho GĐ Âm nhạc nghe thử.`,
  o:(a,m)=>[{k:'yes',l:'Ủng hộ, gửi demo cho GĐ Âm nhạc'},{k:'no',l:'Để lần sau'}],
  r:{yes:(a,m)=>{const ck=bestOf(a,CONCEPTS)[0].k,s=mkSong([a.id],ck,'',false);a.cs=(a.cs||0)+1;MOOD(a,10);return[`🎼 Demo «${s.t}» của ${a.name} đã gửi GĐ Âm nhạc chờ duyệt (Phòng Thu âm).`,'good']},
   no:(a,m)=>{MOOD(a,-6);return[`😕 ${a.name} hơi buồn vì chưa được thử sức sáng tác.`]}}},
 fight:{who:'t',ic:'⚡',pre:(a,m)=>{const ms=S.artists.filter(x=>x!==a&&x.status==='trainee'&&x.batch===a.batch);return ms.length?{b:pick(ms).id}:null},
  t:(a,m,e)=>`TTS ${a.name} cãi nhau với ${byId(e.b)?.name||'bạn cùng lứa'}`,d:(a,m,e)=>`QL ${m.name} báo hai TTS cùng lứa to tiếng trong phòng tập vì tranh vị trí center.`,
  o:(a,m)=>[{k:'mgr',l:`QL hòa giải (~${pct(mxP(m,'care',.4))})`},{k:'both',l:'Phạt cả hai'},{k:'no',l:'Để tự giải quyết'}],
  r:{mgr:(a,m,e)=>{const b=byId(e.b);if(!b)return null;if(Math.random()<mxP(m,'care',.4)){setRel(a,b,getRel(a,b)+20);MOOD(a,3);MOOD(b,3);mgrExp(m,1);return[`🕊️ ${a.name} và ${b.name} làm hòa nhờ ${m.name}.`,'good']}setRel(a,b,getRel(a,b)-10);return[`💢 Hòa giải thất bại, ${a.name} và ${b.name} càng xa cách.`,'bad']},
   both:(a,m,e)=>{const b=byId(e.b);if(!b)return null;MOOD(a,-8);MOOD(b,-8);setRel(a,b,getRel(a,b)+5);return[`📏 Cả hai bị phạt dọn phòng tập, cùng chịu phạt nên dần thông cảm.`]},
   no:(a,m,e)=>{const b=byId(e.b);if(!b)return null;setRel(a,b,getRel(a,b)+R(-20,10));if(getRel(a,b)<=-40&&a.tag[b.id]!=='enemy'){setTag(a,b,'enemy');return[`⚡ ${a.name} và ${b.name} trở thành đối thủ.`,'bad']}return[`🤷 ${a.name} và ${b.name} tự giải quyết với nhau.`]}}}
};
export function mxTick(){for(const m of S.managers){if(!m.as)continue;const ts=mgrTargets(m);if(!ts.length)continue;
  if(Math.random()<.07){const a=pick(ts);if(!S.events.some(e=>e.a===a.id)){const ks=Object.keys(MXS).filter(k=>{const D=MXS[k],w=D.who;return(w==='x'||(w==='d'&&a.status==='debuted')||(w==='t'&&a.status==='trainee'))&&(!D.ok||D.ok(a,m))});
    if(ks.length){const k=pick(ks),D=MXS[k],ex=D.pre?D.pre(a,m):{};if(ex)pushEv({kind:'mx',mx:k,a:a.id,m:m.id,...ex})}}}
  if(Math.random()<.045&&asstOf(m).length<2&&!S.events.some(e=>e.kind==='mp'&&e.m===m.id)){const k=Object.keys(MSK).reduce((x,y)=>m.sk[y]<m.sk[x]?y:x),v=R(1,3);pushEv({kind:'mp',t:'asst',m:m.id,k,v,name:pick(LNM)+' '+pick(FN.concat(MN)),fee:v*8e6,sal:v*1e6})}
  else if(Math.random()<.035&&!S.events.some(e=>e.kind==='mp'&&e.t==='scout')){const a=pick(ts),c=genArtist();c.talent=+rnd(1.05,1.3).toFixed(2);c.st[c.spec]=clamp(c.st[c.spec]+R(8,15),0,80);pushEv({kind:'mp',t:'scout',m:m.id,a:a.id,cand:c,where:pick(SCOUT_W)})}}}
/* ---- Nhóm giải tán ---- */
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
/* ---- Hợp đồng & tái ký ---- */
export function ctInit(a){if(a.status==='debuted'&&!a.ce){a.ce=abs()+R(10,40);a.cs0=abs()-R(5,30);a.earnC=a.earnC||0;if(a.cf0==null)a.cf0=Math.round(a.fans*.7)}}
export function renewEval(a,mul=1){const wk=Math.max(1,abs()-(a.cs0||abs()-26)),cost=a.salary*wk,earn=Math.round(a.earnC||0),roi=earn/Math.max(cost,1),grow=a.fans-(a.cf0||0),gp=grow/Math.max(a.cf0||0,3000)*100,L=[];let sc=50;
  sc+=clamp((roi-1)*20,-25,25);L.push(`💰 Doanh thu mang về ${fmt(earn)} so với lương đã trả ~${fmt(cost)} (x${roi.toFixed(2)})`);
  sc+=clamp(gp/5,-10,15);L.push(`💗 Fan ${grow>=0?'+':''}${fmtN(grow)} trong hợp đồng (${gp>=0?'+':''}${Math.round(gp)}%)`);
  sc+=fame(a)*.15;L.push(`⭐ Danh tiếng ${fame(a)}/100`);
  if(a.evG){sc+=a.evG==='Xuất sắc'?8:a.evG==='Không đạt'?-12:0;L.push(`📋 Đánh giá gần nhất: ${a.evG}${a.evFail?` (trượt ${a.evFail} lần liên tiếp)`:''}`)}
  sc-=(a.evFail||0)*2;if(a.scandal){sc-=10;L.push('🚨 Đang dính scandal')}
  if(a.mood<35)L.push(`🙁 Tâm trạng thấp (${Math.round(a.mood)}), dễ từ chối tái ký`);
  sc=clamp(Math.round(sc),0,100);
  const rec=sc>=58?['Nên tái ký','m']:sc>=40?['Cân nhắc kỹ','s']:['Nên kết thúc hợp đồng','r'];
  const dem=Math.round(Math.max(a.salary*1.1,1e6+fame(a)*.5e6)*(1-msk(a,'nego')*.02)*mul/1e6)*1e6;
  const p=clamp(.5+(a.mood-50)/120+msk(a,'care')*.03+(fame(a)>60?-.1:0)+(mul>1?.25:0),.08,.97);
  return{sc,rec,L,dem,p}}
export function renewOpts(a,mul=1){const E=renewEval(a,mul);return[1,2,3].map(y=>({k:'r'+y,l:`Tái ký ${y} năm (phí ${fmt(E.dem*4*y)})`})).concat([{k:'end',l:'Kết thúc hợp đồng'},{k:'later',l:'Để sau'}])}
export function renewDo(id,k,mul=1,quiet){const a=byId(id);if(!a)return true;
  if(k[0]==='r'){const y=+k.slice(1),E=renewEval(a,mul),bonus=E.dem*4*y;if(S.money<bonus){toast('Không đủ tiền phí ký hợp đồng');return false}
    S.events=S.events.filter(e=>!(e.kind==='renew'&&e.a===id));
    if(Math.random()<E.p+(y===1?.05:y===3?-.05:0)){S.money-=bonus;book('hr',-bonus);a.salary=E.dem;a.ce=Math.max(a.ce,abs())+y*52;a.cs0=abs();a.earnC=0;a.cf0=a.fans;a.ceNo=0;MOOD(a,10);addLog(`✍️ ${a.name} tái ký ${y} năm: lương ${fmt(a.salary)}/tuần, phí ký ${fmt(bonus)}.`,'good')}
    else{MOOD(a,-5);if(mul<1.3){addLog(`🙅 ${a.name} từ chối đề nghị tái ký, muốn mức đãi ngộ cao hơn.`,'bad');pushEv({kind:'renew',a:a.id,mul:1.3},true)}else{a.ceNo=1;addLog(`🚪 ${a.name} từ chối tái ký lần nữa và sẽ rời công ty khi hết hạn hợp đồng.`,'bad')}}}
  else{S.events=S.events.filter(e=>!(e.kind==='renew'&&e.a===id));if(k==='end'){a.ceNo=1;addLog(`📄 Công ty quyết định không tái ký với ${a.name}. ${a.name} sẽ rời đi khi hết hạn (${a.ce-abs()} tuần nữa).`)}}
  if(!quiet)act();return true}
export function contractTick(){for(const a of [...S.artists]){if(a.status!=='debuted')continue;ctInit(a);const left=a.ce-abs();
  if(left<=0){S.events=S.events.filter(e=>!(e.kind==='renew'&&e.a===a.id));removeArtist(a,'đã hết hạn hợp đồng và rời công ty');continue}
  if(left<=8&&!a.ceNo&&!hasEv(a.id,'renew')){pushEv({kind:'renew',a:a.id,mul:1},true);if(left===8)addLog(`📄 Hợp đồng của ${a.name} còn 8 tuần. Xem đánh giá tái ký ở Phòng Nhân sự.`)}}}
/* ---- Sáng tác & Giám đốc âm nhạc ---- */
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
  const cm={S:'Bản hit tiềm năng! Giai điệu bắt tai, đủ sức cạnh tranh top 10.',A:'Chất lượng cao, vượt mặt bằng chung thị trường.',B:'Ngang mặt bằng thị trường. Cần nghệ sĩ hợp concept để tỏa sáng.',C:'Dưới mặt bằng, điệp khúc chưa đủ ấn tượng. Có thể làm bài B-side.',D:'Chưa đạt chuẩn phát hành, nên viết lại.'}[g];
  const tr=tb>0?`Concept ${CONCEPTS[s.ck].n} đang hot 🔥 (+${tb}).`:tb<0?`Concept ${CONCEPTS[s.ck].n} đang nguội ❄️ (${tb}).`:`Concept ${CONCEPTS[s.ck].n} ở mức bình thường.`;
  const sug=acts().map(x=>{const ms=x.m.map(byId).filter(Boolean);if(!ms.length)return null;const own=s.by.some(i=>x.m.includes(i));return{k:x.k,n:x.n,f:Math.round(avgFit(ms,CONCEPTS[s.ck].w)+(own?6:0)),own,free:actFree(x)}}).filter(Boolean).sort((a,b)=>b.f-a.f).slice(0,3);
  return{mk,g,better:clamp(Math.round(mk*1.05-8),1,99),cm,tr,rp,sug}}
export const GC={S:'s',A:'m',B:'v',C:'',D:'r'};
export const sgBonus=(s,m)=>s?(s.q-50)*.35+(s.by.some(i=>m.includes(i))?4:0):0;
export function songAct(id,k){const s=(S.songs||[]).find(x=>x.id===id);if(!s)return;
  if(k==='ok'){const r=mdReview(s);s.rv={g:r.g,mk:r.mk};s.st='ok';s.by.map(byId).filter(Boolean).forEach(a=>MOOD(a,8));addLog(`✅ GĐ Âm nhạc duyệt «${s.t}» (hạng ${r.g}, điểm thị trường ${r.mk}).`,'good')}
  else if(k==='redo'){if(S.money<3e6)return toast('Không đủ tiền');if((s.rw||0)>=2)return toast('Đã chỉnh sửa tối đa 2 lần');S.money-=3e6;s.rw=(s.rw||0)+1;const d=R(2,9);s.q=clamp(s.q+d,5,98);addLog(`🔁 Chỉnh sửa «${s.t}» theo góp ý của GĐ Âm nhạc: chất lượng +${d}.`)}
  else if(k==='drop'){S.songs=S.songs.filter(x=>x!==s);s.by.map(byId).filter(Boolean).forEach(a=>MOOD(a,-5));addLog(`🗑️ Bỏ bài «${s.t}».`)}
  act()}
/* ---- Thông tin & xử lý sự kiện mới ---- */
export const XK=['mx','mp','disband','renew'];
export function xInfo(e){
  if(e.kind==='v3')return v3Info(e);
  if(e.kind==='mx'){const D=MXS[e.mx],a=byId(e.a),m=S.managers.find(x=>x.id===e.m);if(!D||!a||!m)return null;return{ic:D.ic,t:D.t(a,m,e),d:D.d(a,m,e),o:D.o(a,m,e)}}
  if(e.kind==='mp'){const m=S.managers.find(x=>x.id===e.m);if(!m)return null;
    if(e.t==='asst')return{ic:'🧑‍💻',t:`QL ${m.name} đề xuất tuyển trợ lý`,d:`${m.name} muốn tuyển trợ lý ${e.name} chuyên ${MSK[e.k]} để san sẻ việc. Kỹ năng ${MSK[e.k]} của quản lý ${effSk(m,e.k)} → ${Math.min(10,effSk(m,e.k)+e.v)} (giúp mọi nghệ sĩ QL phụ trách). Phí tuyển ${fmt(e.fee)}, lương ${fmt(e.sal)}/tuần.`,o:[{k:'yes',l:`Tuyển (${fmt(e.fee)})`},{k:'no',l:'Từ chối'}]};
    if(e.t==='scout'){const a=byId(e.a),c=e.cand;return{ic:'🔎',t:`QL ${m.name} phát hiện một tài năng`,d:`Khi đi cùng ${a?a.name:'nghệ sĩ'} ${e.where}, ${m.name} để ý ${c.name} có năng khiếu ${STATS[c.spec]} nổi bật, tố chất x${c.talent}. Đề xuất mời về làm thực tập sinh.`,o:[{k:'yes',l:'Mời làm TTS (10 tr)'},{k:'no',l:'Bỏ qua'}]}}
    return null}
  if(e.kind==='disband'){const g=S.groups.find(x=>x.id===e.g);if(!g)return null;const m=gMgr(g);return{ic:'💔',t:`Nhóm ${g.name} đứng trước nguy cơ tan rã`,d:`Lý do: ${e.why}. Hòa hợp nhóm ${harmony(g.members)}${m?`, QL ${m.name} (Chăm sóc ${effSk(m,'care')})`:', chưa có quản lý'}. Tạm ngừng 8 tuần giúp các thành viên hồi phục nhưng không thể ra single hay concert.`,o:[{k:'fix',l:`Hòa giải (50 tr, ~${pct(fixP(g))})`},{k:'split',l:'Chấp nhận giải tán'},{k:'pause',l:'Tạm ngừng 8 tuần'}]}}
  if(e.kind==='renew'){const a=byId(e.a);if(!a)return null;return{ic:'📄',t:`Tái ký hợp đồng: ${a.name}`,d:`Hợp đồng của ${a.name} hết hạn sau ${a.ce-abs()} tuần. Nếu không tái ký, nghệ sĩ sẽ rời công ty.`,o:renewOpts(a,e.mul)}}
  return undefined}
export function xResolve(e,k){
  if(e.kind==='v3')return v3Resolve(e,k);
  if(e.kind==='mx'){const D=MXS[e.mx],a=byId(e.a),m=S.managers.find(x=>x.id===e.m);if(!D||!a||!m||!D.r[k])return;const r=D.r[k](a,m,e);if(r)addLog(r[0],r[1]||'');return}
  if(e.kind==='mp'){const m=S.managers.find(x=>x.id===e.m);if(!m)return;
    if(e.t==='asst'){if(k==='yes'){if(!hireAsst(m.id,e.k,e.v,e.name,e.fee,e.sal))S.events.push(e)}else addLog(`🙅 Từ chối đề xuất tuyển trợ lý của ${m.name}.`);return}
    if(e.t==='scout'){if(k==='yes'){if(S.money<10e6){toast('Không đủ tiền');S.events.push(e);return}S.money-=10e6;book('hr',-10e6);const c=e.cand;if(S.artists.some(x=>x.id===c.id))return;c.batch=ensureCurBatch();S.artists.push(c);mgrExp(m,1);addLog(`🌟 ${c.name} được ${m.name} phát hiện, ký hợp đồng TTS vào ${(S.batches.find(b=>b.id===c.batch)||{n:''}).n}.`,'gold')}return}}
  if(e.kind==='disband'){const g=S.groups.find(x=>x.id===e.g);if(!g)return;const ms=g.members.map(byId).filter(Boolean);
    if(k==='fix'){S.money-=50e6;if(Math.random()<fixP(g)){for(const a of ms)for(const b of ms)if(a!==b){if(a.tag[b.id]==='enemy')setTag(a,b,null);if(getRel(a,b)<10)setRel(a,b,10)}ms.forEach(a=>MOOD(a,10));const m=gMgr(g);if(m)mgrExp(m,2);addLog(`🕊️ Buổi hòa giải thành công, nhóm ${g.name} đoàn kết trở lại!`,'good')}else disbandGroup(g,'hòa giải thất bại')}
    else if(k==='split')disbandGroup(g,e.why);
    else{g.hiatus=abs()+8;ms.forEach(a=>MOOD(a,15));for(const a of ms)for(const b of ms)if(a!==b&&a.tag[b.id]==='enemy'&&Math.random()<.5){setTag(a,b,null);setRel(a,b,0)}S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!=='g'+g.id);addLog(`⏸️ Nhóm ${g.name} tạm ngừng hoạt động 8 tuần để các thành viên nghỉ ngơi.`)}
    return}
  if(e.kind==='renew'){if(!renewDo(e.a,k,e.mul,true))S.events.push(e)}}
/* ---- Tick tuần ---- */
export function weekV2(){mentorTick();songTick();digTick();
  {const t=(S.assts||[]).reduce((s,x)=>s+x.sal,0);if(t){S.money-=t;book('mgr',-t)}}
  contractTick();debutHoldTick();disbandTick();mxTick();
  if(Math.random()<compRep()/120&&S.pool.length<poolSize()+4){const a=genArtist();S.pool.push(a);addLog(`📨 ${a.name} (${a.g==='F'?'nữ':'nam'}, ${a.age}) tự gửi đơn ứng tuyển thực tập sinh nhờ danh tiếng công ty.`,'good')};migrateV3();v3Tick()}
export function migrateV2(){S.assts=S.assts||[];S.songs=S.songs||[];S.fin=S.fin||[];
  if(!S.bno)S.bno=Math.max(S.batches.length,...S.batches.map(b=>+((b.n.match(/\d+/)||[0])[0])));
  for(const m of S.managers){if(!m.as)continue;const t=m.as.t;
    if(t==='t'){const b=S.batches.find(b=>bMem(b).length&&!S.managers.some(x=>x.as&&x.as.t==='b'&&x.as.id===b.id));m.as=b?{t:'b',id:b.id}:null;addLog(`📋 Quản lý TTS giờ chỉ theo lứa: ${m.name} ${b?'chuyển sang phụ trách '+b.n:'chờ được giao lứa mới'}.`)}
    else if(t==='s'||t==='d'){const pool=S.artists.filter(a=>(t==='s'?a.solo&&!a.pm:a.actor)&&!S.managers.some(x=>x!==m&&x.as&&x.as.t!=='s'&&x.as.t!=='d'&&mgrTargets(x).includes(a))).slice(0,MAX_SA);m.as={t:'l',id:0,ids:pool.map(a=>a.id)};addLog(`📋 ${m.name} giờ quản lý danh sách tối đa ${MAX_SA} nghệ sĩ solo/diễn viên.`)}
    else if(t==='l'&&m.as.ids.length>MAX_SA)m.as.ids=m.as.ids.slice(0,MAX_SA)}
  S.artists.forEach(ctInit);S.batches.forEach(b=>{if(bMem(b).length)b.had=1})}
export function aggr(L,f){const o={};L.forEach(e=>{for(const k in e[f])o[k]=(o[k]||0)+e[f][k]});return o}
/* ================= MỞ RỘNG v3 ================= */
XK.push('v3');
