import { R, pick, rnd } from '../core/rng.js';
import { $, clamp, esc, fmt } from '../core/util.js';
import { CB, STATS } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fame, fit } from './artists.js';
import { batchOf } from './batches.js';
import { dHold } from './ext2.js';
import { mgrExp, mgrOf } from './managers.js';
import { cbHold, chem } from './offers.js';
import { wkLabel } from './secretary.js';
import { applyLesson } from './week.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';
import { det } from '../ui/views.js';

/* ---- Trainee competitions ---- */
export const COMP=[
  {n:'Giọng hát Tân binh',ic:'🎙️',w:{vocal:1},t:[1,1]},
  {n:'Đấu trường Rap Trẻ',ic:'🎤',w:{rap:1,variety:.3},t:[1,1]},
  {n:'Liên hoan Nhảy đường phố',ic:'🕺',w:{dance:1,stamina:.5},t:[2,5]},
  {n:'Cover Dance Idol',ic:'💃',w:{dance:.8,vocal:.4,visual:.4},t:[3,6]},
  {n:'Gương mặt Teen',ic:'📸',w:{visual:1,variety:.4},t:[1,1]},
  {n:'Tài năng Diễn xuất Trẻ',ic:'🎭',w:{acting:1,visual:.3},t:[1,2]},
  {n:'Ban nhạc Học đường',ic:'🎸',w:{vocal:.8,rap:.4,dance:.4},t:[2,4]}
];
/* debuted-artist templates: k = kind, t = team size (group: member count) */
export const DCOMP=[
  {k:'grp',n:'Đại chiến Idol Group',ic:'👥',w:{vocal:.6,dance:.8,visual:.4},t:[2,9]},
  {k:'grp',n:'Sân khấu Huyền thoại',ic:'🌟',w:{vocal:1,dance:.5},t:[2,9]},
  {k:'solo',n:'Giọng ca Vàng',ic:'🎙️',w:{vocal:1,variety:.3},t:[1,1]},
  {k:'solo',n:'Vũ điệu Solo',ic:'💃',w:{dance:1,visual:.4},t:[1,1]},
  {k:'solo',n:'Rap Battle Pro',ic:'🎤',w:{rap:1,variety:.4},t:[1,1]},
  {k:'act',n:'Liên hoan Diễn xuất',ic:'🎬',w:{acting:1,visual:.3},t:[1,1]},
  {k:'act',n:'Thử thách Độc thoại',ic:'🎭',w:{acting:1,variety:.4},t:[1,1]}
];
const rp=p1=>[p1,Math.round(p1*.45/1e6)*1e6,Math.round(p1*.2/1e6)*1e6];
export function genComp(kind='tts'){
  if(kind!=='tts'){const T=pick(DCOMP.filter(c=>c.k===kind&&!(S.comps||[]).some(x=>x.n===c.n)));if(!T)return;
    const lvl=clamp(R(40,58)+(S.year-1)*6+Math.floor(S.week/13)*2,30,95),p1=Math.round(R(80,160)*(1+lvl/40))*1e6;
    S.comps.push({id:uid(),k:T.k,n:T.n,ic:T.ic,w:T.w,t:T.t,lvl,wk:R(1,3),fee:R(8,20)*1e6*T.t[0],prize:rp(p1),exp:abs()+R(3,5)});return}
  const T=pick(COMP.filter(c=>!(S.comps||[]).some(x=>x.n===c.n)));if(!T)return;
  const lvl=clamp(R(18,36)+(S.year-1)*6+Math.floor(S.week/13)*2,12,85),p1=Math.round(R(30,70)*(1+lvl/40))*1e6;
  S.comps.push({id:uid(),n:T.n,ic:T.ic,w:T.w,t:T.t,lvl,wk:R(1,2),fee:R(2,6)*1e6*T.t[0],prize:[p1,Math.round(p1*.45/1e6)*1e6,Math.round(p1*.2/1e6)*1e6],exp:abs()+R(3,5)})}
/* contest kind table: tts (trainees) | grp (debuted groups) | solo | act. grp units are groups, the rest artists */
export const kindOf=c=>c.k||'tts';
const okD=a=>!a.busy&&!(a.scandal&&a.scandal.sev>=2);
const fanD=a=>2+fame(a)/25;
export const KIND={
  tts:{elig:a=>a.status==='trainee'&&!a.busy,label:'thực tập sinh',fanMul:()=>1},
  grp:{grp:1,elig:g=>!(g.hiatus>abs())&&g.members.length>0&&g.members.every(i=>{const a=byId(i);return a&&okD(a)}),label:'nhóm',fanMul:fanD,pm:1,sec:'Nhóm nhạc'},
  solo:{elig:a=>a.status==='debuted'&&!!a.solo&&okD(a),label:'nghệ sĩ solo',fanMul:fanD,pm:1,sec:'Solo'},
  act:{elig:a=>a.status==='debuted'&&!!a.actor&&okD(a),label:'diễn viên',fanMul:fanD,pm:1,sec:'Diễn viên'}
};
const unitsOf=c=>{const K=KIND[kindOf(c)];return(K.grp?S.groups:S.artists).filter(K.elig)};
const idsOfSel=(c,sel)=>{const K=KIND[kindOf(c)];if(!K.grp)return sel;const g=S.groups.find(x=>x.id===sel[0]);return g?g.members.slice():[]};
const teamTxt=c=>KIND[kindOf(c)].grp?`Cả nhóm (${c.t[0]}–${c.t[1]} thành viên)`:c.t[1]===1?'Thi cá nhân':c.t[0]===c.t[1]?`Đội ${c.t[0]} người`:`Đội ${c.t[0]}–${c.t[1]} người`;
const needTxt=c=>KIND[kindOf(c)].grp?'nhóm':`${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} ${KIND[kindOf(c)].label}`;
/* prize multiplier by fame at registration (debuted kinds only) */
const pmOf=(c,ms)=>KIND[kindOf(c)].pm&&ms.length?1+ms.reduce((t,a)=>t+fame(a),0)/ms.length/60:0;
const prizeOf=(c,rank,pm)=>pm?Math.round(c.prize[rank-1]*pm/1e6)*1e6:c.prize[rank-1];
const bonusOf=(c,rank)=>rank<=3?Object.keys(c.w).map(k=>[k,+(CB[rank-1]*c.w[k]).toFixed(1)]):[];
export const bonusTxt=(c,rank)=>bonusOf(c,rank).map(([k,g])=>`${STATS[k]} +${g}`).join(', ');
/* top-3 stat bonus (no RNG); returns the text */
export function compBonus(a,c,rank){const L=bonusOf(c,rank);L.forEach(([k,g])=>a.st[k]=clamp(+(a.st[k]+g).toFixed(1),0,100));return bonusTxt(c,rank)}
export function compTick(){S.comps=(S.comps||[]).filter(c=>c.exp>abs());const n=S.comps.filter(c=>kindOf(c)==='tts').length;if(n<2||(n<4&&Math.random()<.35))genComp();
  if(S.artists.some(a=>a.status==='debuted')){const ks=['grp','solo','act'].filter(k=>k==='grp'?S.groups.length:k==='solo'?S.artists.some(a=>a.solo):S.artists.some(a=>a.actor)),d=S.comps.filter(c=>kindOf(c)!=='tts');if(ks.length&&(d.length<2||(d.length<3&&Math.random()<.3)))genComp(pick(ks))}}
const compScore=(ms,ids,c)=>ms.reduce((t,a)=>t+fit(a,c.w),0)/Math.max(ms.length,1)*(1+(ms.length>1?chem(ids):0));
const compRank=(c,sc)=>{let r=1;for(let j=0;j<7;j++)if(c.lvl+rnd(-12,14)>sc)r++;return r};
export function compOdds(c,ids){const ms=ids.map(byId).filter(Boolean);if(!ms.length)return 0;const f=compScore(ms,ids,c);
  let n=0;for(let i=0;i<300;i++){const sc=f+rnd(-8,8);if(compRank(c,sc)<=3)n++}return Math.round(n/3)}
export function compSel(cid){return[...document.querySelectorAll('.cp'+cid+':checked')].map(x=>+x.value)}
export function compPrev(cid){const c=S.comps.find(x=>x.id===cid),el=$('#cpo'+cid);if(!c||!el)return;const sel=compSel(cid),ids=idsOfSel(c,sel),ms=ids.map(byId).filter(Boolean);
  if(!ids.length){el.textContent=`Chọn ${needTxt(c)}`;return}
  const pm=pmOf(c,ms);el.textContent=`Đã chọn ${ids.length} người · cơ hội vào top 3 khoảng ${compOdds(c,ids)}%`+(pm?` · thưởng 🥇 ${fmt(prizeOf(c,1,pm))} · 🥈 ${fmt(prizeOf(c,2,pm))} · 🥉 ${fmt(prizeOf(c,3,pm))}`:'')}
export function compPick(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const K=KIND[kindOf(c)];let L;
  if(K.grp)L=unitsOf(c).filter(g=>g.members.length>=c.t[0]&&g.members.length<=c.t[1]).sort((x,y)=>compScore(y.members.map(byId).filter(Boolean),y.members,c)-compScore(x.members.map(byId).filter(Boolean),x.members,c)).slice(0,1).map(g=>g.id);
  else{const n=c.t[1]>1?clamp(3,c.t[0],c.t[1]):1;L=unitsOf(c).sort((x,y)=>fit(y,c.w)-fit(x,c.w)).slice(0,n).map(a=>a.id)}
  document.querySelectorAll('.cp'+cid).forEach(x=>x.checked=L.includes(+x.value));compPrev(cid)}
export function enterComp(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const K=KIND[kindOf(c)],sel=compSel(cid);let g=null,ms;
  if(K.grp){g=S.groups.find(x=>x.id===sel[0]);if(!g)return toast('Chọn một nhóm');if(!K.elig(g))return toast(`Nhóm ${g.name} đang bận hoặc tạm ngừng`);ms=g.members.map(byId).filter(Boolean)}
  else ms=sel.map(byId).filter(a=>a&&K.elig(a));
  {const h=ms.find(dHold);if(h)return toast(`${h.name} đang chừa lịch debut`)}
  {const h=ms.find(a=>{const p=cbHold(a);return p&&abs()+c.wk>p.w});if(h)return toast(`${h.name} đang chừa lịch comeback ${wkLabel(cbHold(h).w)}`)}
  if(ms.length<c.t[0]||ms.length>c.t[1])return toast(`Cần ${needTxt(c)}`);
  if(S.money<c.fee)return toast('Không đủ tiền lệ phí');S.money-=c.fee;
  const run={id:uid(),c,ids:ms.map(a=>a.id),res:null};if(g)run.g=g.id;const pm=pmOf(c,ms);if(pm)run.pm=pm;S.compRuns=S.compRuns||[];S.compRuns.push(run);
  ms.forEach(a=>a.busy={kind:'comp',title:'Cuộc thi «'+c.n+'»',left:c.wk,total:c.wk,run:run.id});
  S.comps=S.comps.filter(x=>x!==c);addLog(`🏅 ${g?'Nhóm '+g.name:ms.map(a=>a.name).join(', ')} lên đường dự thi «${c.n}» (${c.wk} tuần, lệ phí ${fmt(c.fee)}).`,'good');act()}
export function compDone(a,b){const run=(S.compRuns||[]).find(r=>r.id===b.run);if(!run)return;const c=run.c,K=KIND[kindOf(c)];
  if(!run.res){const ms=run.ids.map(byId).filter(Boolean),f=compScore(ms,run.ids,c),sc=f+rnd(-8,8);
    const rank=compRank(c,sc),prize=rank<=3?prizeOf(c,rank,run.pm):0;S.money+=prize;run.res={rank,prize};
    const gr=run.g&&S.groups.find(x=>x.id===run.g),who=gr?'Nhóm '+gr.name:ms.map(x=>x.name).join(', ');
    addLog(rank<=3?`🏅 ${c.ic} ${who} giành hạng ${rank} tại «${c.n}», nhận ${fmt(prize)}! Thưởng chỉ số mỗi người: ${bonusTxt(c,rank)}.`:`${c.ic} ${who} dừng ở hạng ${rank}/8 tại «${c.n}». Kinh nghiệm quý cho lần sau.`,rank<=3?'gold':'');
    {const m=ms.map(mgrOf).find(Boolean);if(m)mgrExp(m,rank===1?2:1)}}
  const r=run.res,q=r.rank===1?1.4:r.rank<=3?1.15:.9,fg=Math.round((r.rank===1?R(3000,7000):r.rank<=3?R(1000,3000):R(200,800))*K.fanMul(a));a.fans+=fg;a.yr.fans+=fg;
  const les={};for(const k in c.w)les[k]=c.w[k]*3;const ls=applyLesson(a,les,q),bt=compBonus(a,c,r.rank);
  a.lessons.unshift({t:`Cuộc thi «${c.n}»`,l:r.rank<=3?'Tự tin hơn khi thi đấu':'Học được nhiều từ đối thủ',s:ls,y:S.year,...(bt?{b:bt}:{})});if(a.lessons.length>12)a.lessons.length=12;
  a.mood=clamp(a.mood+(r.rank<=3?12:-4),0,100);a.hist.unshift(`N${S.year}: Cuộc thi «${c.n}» – hạng ${r.rank}${bt?` · 🏅 ${bt}`:''}`);a.wc=(a.wc||0)+1;
  if(!S.artists.some(x=>x.busy&&x.busy.run===run.id))S.compRuns=S.compRuns.filter(x=>x!==run)}
export function compHTML(kinds=['tts']){const dbt=!kinds.includes('tts'),inK=c=>kinds.includes(kindOf(c)),
  going=S.artists.filter(a=>{if(!a.busy||a.busy.kind!=='comp')return false;const r=(S.compRuns||[]).find(x=>x.id===a.busy.run);return r?inK(r.c):!dbt});
  return`<div class="small muted" style="margin-bottom:6px">${dbt?'Dành cho nghệ sĩ đã debut: nhóm thi theo nhóm, solo và diễn viên thi cá nhân. Đối thủ mạnh hơn, thưởng cao hơn, tiền thưởng và fan tăng theo danh tiếng. Top 3 nhận thêm chỉ số, ai cũng có bài học.':'Chỉ thực tập sinh được dự thi. Top 3 nhận tiền thưởng, ai cũng có thêm fan và bài học theo kỹ năng thi.'} ${going.length?`Đang thi: <b>${going.map(a=>esc(a.name)).join(', ')}</b>.`:''}</div>`+
  (S.comps.filter(inK).map(c=>{const K=KIND[kindOf(c)],U=unitsOf(c),multi=c.t[1]>1&&!K.grp,
    sc=u=>K.grp?compScore(u.members.map(byId).filter(Boolean),u.members,c):fit(u,c.w),L=U.slice().sort((x,y)=>sc(y)-sc(x));
    const list=x=>x.map(u=>{if(K.grp)return`<label><input type="radio" name="cp${c.id}" class="cp${c.id}" value="${u.id}" onchange="compPrev(${c.id})"> <span style="flex:1"><b>${esc(u.name)}</b> <span class="small muted">${u.members.length} thành viên · điểm kỹ năng ${Math.round(sc(u))}</span></span></label>`;
      const bt=batchOf(u);return`<label><input type="${multi?'checkbox':'radio'}" name="cp${c.id}" class="cp${c.id}" value="${u.id}" onchange="compPrev(${c.id})"> <span style="flex:1"><b>${esc(u.name)}</b> <span class="small muted">${bt&&S.batches.length>1&&u.status==='trainee'?esc(bt.n)+' · ':''}điểm kỹ năng ${Math.round(sc(u))}${K.pm?' · danh tiếng '+fame(u):''}</span></span></label>`}).join('');
    return`<div class="card"><div class="row"><b>${c.ic} ${esc(c.n)}</b><span class="sp"></span><span class="small muted">hạn đăng ký ${c.exp-abs()} tuần</span></div>
    <div class="small">${teamTxt(c)} · ${c.wk} tuần · lệ phí ${fmt(c.fee)} · đối thủ khoảng ${c.lvl} điểm<br>🥇 ${fmt(c.prize[0])} · 🥈 ${fmt(c.prize[1])} · 🥉 ${fmt(c.prize[2])}${K.pm?' <span class="muted">(thưởng gốc, nhân theo danh tiếng khi đăng ký)</span>':''}</div>
    <div class="req">Chấm điểm: ${Object.keys(c.w).map(k=>STATS[k]).join(', ')}</div>
    ${L.length?det('cp-l'+c.id,`Chọn ${K.label} (${L.length} ${K.grp?'nhóm':'người'} rảnh)`,`<div class="list">${list(L)}</div>`,true)+`<div class="row" style="margin-top:6px"><span class="small muted" id="cpo${c.id}" style="flex:1">Chọn ${needTxt(c)}</span><button class="btn sm" onclick="compPick(${c.id})">💡 Gợi ý</button><button class="btn sm pri" onclick="enterComp(${c.id})">Đăng ký</button></div>`:`<div class="small muted">Không có ${K.label} rảnh.</div>`}</div>`}).join('')||'<div class="small muted">Chưa có cuộc thi nào mở đăng ký. Sang tuần mới để xem thêm.</div>')}
