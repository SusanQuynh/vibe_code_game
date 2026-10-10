import { R } from '../core/rng.js';
import { clamp, fmt } from '../core/util.js';
import { S, abs, addLog, byId } from '../state.js';
import { fame } from './artists.js';
import { book } from './ext2.js';
import { actByKey, liveInc } from './releases.js';
import { actFree } from './secretary.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

/* ---- Promotion campaigns before & after a comeback ---- */
export const PROMO_WK=3;
export const PRE={
  sched:{n:'Lịch trình comeback',ic:'🗓️',c:3e6,h:4,e:0,d:'Công bố ngày ra mắt'},
  photo:{n:'Ảnh teaser',ic:'📸',c:10e6,h:6,e:3,d:'Bộ ảnh concept'},
  medley:{n:'Highlight medley',ic:'🎧',c:15e6,h:8,e:2,d:'Nghe thử các bài'},
  mvt:{n:'MV teaser',ic:'🎬',c:30e6,h:12,e:6,d:'Đoạn MV 30 giây'},
  pre:{n:'Pre-release',ic:'🎵',c:40e6,h:14,e:8,d:'Tung trước 1 bài, thêm fan'},
  vpre:{n:'Tạp kỹ quảng bá',ic:'📺',c:0,h:10,e:10,d:'Lên show, tăng Tạp kỹ'},
  showcase:{n:'Showcase báo chí',ic:'🎤',c:50e6,h:15,e:12,d:'Ra mắt trước truyền thông'}
};
export const POST={
  s1:{n:'Sân khấu Music Weekly',ic:'🎤',stage:1,e:8},
  s2:{n:'Sân khấu Sân Khấu Sao',ic:'🎤',stage:1,e:8},
  s3:{n:'Sân khấu Đài Âm Nhạc',ic:'🎤',stage:1,e:8},
  s4:{n:'Bảng Xếp Hạng Tuần',ic:'🎤',stage:1,e:8},
  radio:{n:'Radio',ic:'📻',e:3},
  variety:{n:'Tạp kỹ',ic:'📺',e:8},
  fansign:{n:'Ký tặng (fansign)',ic:'✍️',e:6},
  challenge:{n:'Dance challenge',ic:'🕺',e:4},
  live:{n:'Livestream cùng fan',ic:'📱',e:3}
};
export const campMem=k=>{const x=actByKey(k);return x?x.m.map(byId).filter(Boolean):[]};
export const avgE=ms=>ms.length?ms.reduce((t,a)=>t+a.energy,0)/ms.length:0;
export const avgFm=ms=>ms.length?ms.reduce((t,a)=>t+fame(a),0)/ms.length:0;
export function preDo(k,id,quiet){const x=actByKey(k),P=PRE[id];if(!x||!P)return;
  if(!actFree(x))return quiet||toast('Đang bận, chưa thể teaser');
  let c=S.camp[k];if(c&&c.ph==='post')return quiet||toast('Đang trong đợt quảng bá');
  if(!c)c=S.camp[k]={k,n:x.n,ph:'pre',hype:0,done:{}};
  if(c.done[id])return quiet||toast('Đã làm rồi');if(S.money<P.c)return quiet||toast('Không đủ tiền');
  const ms=campMem(k);if(ms.some(a=>a.energy<P.e+5))return quiet||toast('Có thành viên quá mệt');
  S.money-=P.c;c.done[id]=abs();const h=Math.round(P.h*(1+avgFm(ms)/150));c.hype=Math.min(80,c.hype+h);
  for(const a of ms){a.energy=clamp(a.energy-P.e,0,100);if(id==='vpre')a.st.variety=clamp(+(a.st.variety+1.5).toFixed(1),0,100);if(id==='pre'){const g=R(300,1500);a.fans+=g;a.yr.fans+=g}}
  addLog(`📣 ${x.n.slice(2).trim()}: ${P.ic} ${P.n} (+${h} hype, tổng ${c.hype}).`);if(!quiet)act()}
export function postDo(k,id,quiet){const c=S.camp[k],P=POST[id],x=actByKey(k);if(!c||c.ph!=='post'||!P||!x)return;
  if(c.used.wk!==abs())c.used={wk:abs(),l:[]};if(c.used.l.includes(id))return quiet||toast('Tuần này đã làm');
  const ms=campMem(k);if(ms.some(a=>a.energy<P.e+3))return quiet||toast('Có thành viên quá mệt, nên nghỉ');
  c.used.l.push(id);const fm=avgFm(ms),nm=x.n.slice(2).trim();let msg='';
  for(const a of ms)a.energy=clamp(a.energy-P.e,0,100);
  const gF=n=>{for(const a of ms){const g=Math.round(n*(1+fm/100));a.fans+=g;a.yr.fans+=g}};
  if(P.stage){c.stages++;gF(R(400,1200));c.rank=Math.max(1,c.rank-R(0,3));
    const pw=clamp(((101-c.rank)*.75+c.hype*.3+fm*.3-62)/40,.02,.85);
    if(Math.random()<pw){c.wins++;gF(R(2500,6000));ms.forEach(a=>a.mood=clamp(a.mood+10,0,100));const sg=S.singles.find(z=>z.k===k&&z.title===c.t);if(sg)sg.wins=(sg.wins||0)+1;msg=`🏆 «${c.t}» giành cúp #1 tại ${P.n.replace('Sân khấu ','')}!`;addLog(`${msg} (${nm}, cúp thứ ${c.wins})`,'gold')}
    else msg=`${P.ic} ${nm} biểu diễn ${P.n}.`}
  else if(id==='radio'){gF(R(200,600));ms.forEach(a=>a.st.variety=clamp(+(a.st.variety+.5).toFixed(1),0,100));msg=`📻 ${nm} lên radio.`}
  else if(id==='variety'){gF(R(600,1800));ms.forEach(a=>a.st.variety=clamp(+(a.st.variety+1.5).toFixed(1),0,100));c.rank=Math.max(1,c.rank-R(0,2));msg=`📺 ${nm} quảng bá trên tạp kỹ.`}
  else if(id==='fansign'){const tf=ms.reduce((t,a)=>t+a.fans,0),v=Math.round(Math.min(tf*.01,4000)*R(150,250))*1e3;S.money+=v;book('live',v,ms);c.inc+=v;ms.forEach(a=>a.mood=clamp(a.mood+6,0,100));gF(R(200,500));msg=`✍️ Fansign của ${nm}: bán thêm album, +${fmt(v)}.`}
  else if(id==='challenge'){if(Math.random()<.25){gF(R(3000,8000));c.rank=Math.max(1,c.rank-R(3,8));msg=`🕺 Dance challenge của «${c.t}» viral! Bài hát leo hạng mạnh.`}else{gF(R(300,900));msg=`🕺 ${nm} tung dance challenge.`}}
  else if(id==='live'){gF(R(200,700));const v=ms.reduce((t,a)=>t+liveInc(a),0);S.money+=v;book('live',v,ms);c.inc+=v;ms.forEach(a=>{a.mood=clamp(a.mood+6,0,100);a.lastLive=abs()});msg=`📱 ${nm} livestream giao lưu fan sau sân khấu, thu ${fmt(v)}.`}
  c.best=Math.min(c.best,c.rank);if(!P.stage||!msg.startsWith('🏆'))addLog(msg);
  if(!quiet)act()}
export function postRec(k){const c=S.camp[k],ms=campMem(k);if(!c)return[];let e=Math.min(...ms.map(a=>a.energy)),out=[];const u=c.used.wk===abs()?c.used.l:[];
  for(const id of ['s1','s2','s3','s4','fansign','radio','challenge','variety','live']){if(out.length>=4)break;if(u.includes(id))continue;const P=POST[id];if(e-P.e<30)continue;out.push(id);e-=P.e}
  return out}
export function postAuto(k,quiet){const L=postRec(k);L.forEach(id=>postDo(k,id,true));if(!quiet){if(!L.length)toast('Thành viên đã mệt, nên để nghỉ');act()}return L.length}
export function preRec(k){const c=S.camp[k]||{done:{}},ms=campMem(k);let e=Math.min(...ms.map(a=>a.energy)),m=S.money,out=[];
  for(const id of ['sched','photo','medley','vpre','mvt','pre','showcase']){const P=PRE[id];if(c.done&&c.done[id])continue;if(e-P.e<40||m-P.c<100e6)continue;out.push(id);e-=P.e;m-=P.c;if(out.length>=3)break}return out}
export function preAuto(k){const L=preRec(k);if(!L.length)return toast('Chưa có hoạt động phù hợp (mệt hoặc thiếu tiền)');L.forEach(id=>preDo(k,id,true));act()}
export function promoWeek(){
  for(const k of Object.keys(S.camp)){const c=S.camp[k],x=actByKey(k);if(!x){delete S.camp[k];continue}
    if(c.ph==='pre'){const pl=(S.cbPlan||[]).find(p=>p.k===k);if(!pl&&Object.values(c.done).every(w=>abs()-w>6)){c.hype=Math.max(0,c.hype-5);if(!c.hype)delete S.camp[k]}continue}
    if(S.autoPromo!==false&&(c.used.wk!==abs()||!c.used.l.length)){const n=postAuto(k,true);if(n)addLog(`🗒️ Thư ký tự xếp ${n} hoạt động quảng bá cho ${x.n.slice(2).trim()}.`)}
    const ms=campMem(k),fm=avgFm(ms),inc=Math.round(Math.pow(101-c.rank,1.6)*15000*(1+fm/100)/1e5)*1e5;S.money+=inc;book('live',inc,ms);c.inc+=inc;
    c.wn++;
    if(c.wn>=PROMO_WK){S.fmHint=S.fmHint||{};S.fmHint[k]=abs();addLog(`📣 Kết thúc quảng bá «${c.t}» (${x.n.slice(2).trim()}): ${c.stages} sân khấu, ${c.wins} cúp, hạng cao nhất #${c.best}, thu thêm ${fmt(c.inc)}.`,c.wins?'gold':'good');delete S.camp[k]}
    else c.rank=Math.min(100,c.rank+R(1,5));
  }}
