import { rnd } from '../core/rng.js';
import { clamp, esc, fmt } from '../core/util.js';
import { OFFER } from '../data/offers.js';
import { CONCEPTS, STATS, TRAIN } from '../data/rules.js';
import { S, abs, addLog, byId } from '../state.js';
import { fit } from './artists.js';
import { debutRec } from './debut.js';
import { effSk, mBoss, mgrExp, mgrOf, mgrTargets } from './managers.js';
import { acceptCast, bestCast, canTake, chem, effPay } from './offers.js';
import { secPlans } from './secretary.js';
import { TIC, focusKeys, planWeek } from './week.js';
import { act } from '../ui/building.js';
import { modal, toast } from '../ui/modal.js';
import { propNext, setPropNext } from '../ui/planning.js';
import { det } from '../ui/views.js';

/* ---- manager proposals ---- */
export function shortWhy(a){if(a.energy<40)return'năng lượng thấp, nghỉ trước';if(a.mood<28)return'tâm trạng xấu, cho nghỉ';if(a.wantAct)return'muốn đóng phim, tập diễn';const k=focusKeys(a).reduce((m,x)=>a.st[x]<a.st[m]?x:m);return'bù '+STATS[k]+' ('+Math.round(a.st[k])+')'}
export function buildProps(){
  if(S.props&&S.props.w===abs()&&S.props.c)return S.props;
  const P={w:abs(),m:{},c:[],st:{auto:0,boss:{},res:0}};
  for(const m of S.managers){if(!m.as)continue;const free=mgrTargets(m).filter(a=>!a.busy);if(!free.length)continue;
    const it={s:[],p:[],d:[]};
    if(m.ps===2)for(const a of free)if(a.appr!==abs()&&!a.pm)it.s.push({a:a.id,days:planWeek(a,effSk(m,'plan')),why:shortWhy(a),ok:0});
    if(m.auto==='off'){const used=new Set();
      const tg=o=>o.target&&free.some(a=>a.id===o.target)?1:0;for(const of of S.offers.slice().sort((x,y)=>(tg(y)-tg(x))||(y.pay*rnd(.6,1.4)-x.pay*rnd(.6,1.4)))){if(it.p.length>=2)break;
        const c=bestCast(of,free.filter(a=>!used.has(a.id)&&a.energy>=35));if(!c)continue;
        c.forEach(i=>used.add(i));it.p.push({of:of.id,ids:c,ok:0})}}
    for(const a of free)if(a.status==='trainee'){const r=debutRec(a);if(r.t!=='wait')it.d.push({a:a.id,t:r.t,txt:r.short})}
    if(it.s.length||it.p.length||it.d.length)P.m[m.id]=it}
  S.props=P;routeProps(P);return P;
}
/* ---- approval flow: manager → boss → … → Director ---- */
export const CFT={overlap:'Trùng người',offer:'Tranh cùng lời mời',tired:'Quá sức',enemy:'Bạn diễn mâu thuẫn',scandal:'Đang dính scandal'};
export const mById=id=>S.managers.find(m=>m.id===id);
export const chainUp=m=>{const r=[];let b=mBoss(m);while(b&&!r.includes(b)){r.push(b);b=mBoss(b)}return r};
export const canSolve=(r,c)=>effSk(r,'plan')+r.lv>=c.sev*3;
export function itemsOf(P){const L=[];for(const k in P.m){const mid=+k,it=P.m[k];it.s.forEach((x,i)=>L.push({mid,kind:'s',i,x,arts:[x.a]}));it.p.forEach((x,i)=>L.push({mid,kind:'p',i,x,arts:x.ids}))}return L}
export const refIt=(P,r)=>{const x=P.m[r.mid]&&P.m[r.mid][r.k][r.i];return x?{mid:r.mid,kind:r.k,i:r.i,x,arts:r.k==='s'?[x.a]:x.ids}:null};
export function itDesc(t){const m=mById(t.mid),who=m?m.name:'?';if(t.kind==='s'){const a=byId(t.x.a);return`${who}: lịch tập ${a?a.name:''} ${t.x.days.map(k=>TIC[k]).join('')}`}
  const of=S.offers.find(o=>o.id===t.x.of);return`${who}: «${of?of.title:'?'}» cho ${t.x.ids.map(byId).filter(Boolean).map(a=>a.name).join(', ')}${of?' (+'+fmt(t.x.ids.reduce((s,i)=>s+(byId(i)?effPay(of,byId(i)):0),0))+')':''}`}
export function itScore(t){if(t.kind==='p'){const of=S.offers.find(o=>o.id===t.x.of);return 1e13+(of?t.x.ids.reduce((s,i)=>s+(byId(i)?effPay(of,byId(i)):0),0):0)}const a=byId(t.x.a),m=a&&mgrOf(a);return m&&m.id===t.mid?2:1}
export function dropIt(t,c){t.x.ok=-2;t.x.why2=CFT[c.type];if(t.kind==='p'){const it=S.props&&S.props.m[t.mid];if(it)it.s.forEach(x=>{if(x.ok===-2&&x.why2==='đã có dự án'&&t.x.ids.includes(x.a)){x.ok=0;delete x.why2}})}}
export function fixConf(P,c,keep){
  const its=c.refs.map(r=>refIt(P,r)).filter(t=>t&&t.x.ok!==-2&&t.x.ok!==1);
  if(c.type==='overlap'||c.type==='offer'){const k=keep!=null?refIt(P,c.refs[keep]):its.slice().sort((a,b)=>itScore(b)-itScore(a))[0];for(const t of its)if(!k||t.x!==k.x)dropIt(t,c)}
  else if(c.type==='tired'){for(const t of its){if(t.kind==='p')dropIt(t,c);else{const a=byId(t.x.a);if(a){t.x.days=planWeek(a,10);t.x.why='đã giảm tải'}}}}
  else if(c.type==='enemy'){const t=its[0];if(t){const of=S.offers.find(o=>o.id===t.x.of),ms=t.x.ids.map(byId).filter(Boolean);
    for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++)if(ms[i].tag[ms[j].id]==='enemy'){const out=[ms[i],ms[j]].filter(a=>a.id!==(of&&of.target)).sort((x,y)=>(of?fit(x,of.w)-fit(y,of.w):0))[0];if(out)t.x.ids=t.x.ids.filter(id=>id!==out.id)}
    if(!t.x.ids.length)dropIt(t,c)}}
  else if(c.type==='scandal')its.forEach(t=>dropIt(t,c));
  c.pend=0;c.done=1;
}
export function approveIt(P,t,by){if(t.x.ok)return;const pend=(t.x.cf||[]).some(id=>{const c=P.c.find(z=>z.id===id);return c&&c.pend});if(pend)return;
  propOk(t.mid,t.kind,t.i,1);if(t.x.ok===1)t.x.by=by}
export function routeProps(P){
  const L=itemsOf(P);
  for(const t of L)if(t.kind==='s'&&L.some(u=>u.kind==='p'&&u.mid===t.mid&&u.arts.includes(t.x.a)))t.x.ok=-2,t.x.why2='đã có dự án';
  const live=L.filter(t=>!t.x.ok);let cid=1;
  const add=(type,sev,ts,txt)=>{const c={id:cid++,type,sev,txt,refs:ts.map(t=>({mid:t.mid,k:t.kind,i:t.i})),path:[]};P.c.push(c);ts.forEach(t=>(t.x.cf=t.x.cf||[]).push(c.id));c._t=ts};
  const byA={};live.forEach(t=>t.arts.forEach(a=>(byA[a]=byA[a]||[]).push(t)));
  for(const a in byA){const ts=byA[a];if(new Set(ts.map(t=>t.mid)).size>1)add('overlap',2,ts,`${byId(+a).name} được ${new Set(ts.map(t=>t.mid)).size} quản lý xếp việc khác nhau`)}
  const byO={};live.filter(t=>t.kind==='p').forEach(t=>(byO[t.x.of]=byO[t.x.of]||[]).push(t));
  for(const o in byO)if(byO[o].length>1){const of=S.offers.find(x=>x.id===+o);add('offer',1,byO[o],`${byO[o].length} quản lý cùng muốn nhận «${of?of.title:'?'}»`)}
  for(const t of live){
    if(t.kind==='p'){const ms=t.arts.map(byId).filter(Boolean),of=S.offers.find(o=>o.id===t.x.of);
      const sc=ms.filter(a=>a.scandal);if(sc.length)add('scandal',3,[t],`${sc[0].name} đang dính scandal mà vẫn được xếp «${of?of.title:''}»`);
      const ti=ms.filter(a=>a.energy<45);if(ti.length)add('tired',1,[t],`${ti.map(a=>a.name).join(', ')} năng lượng thấp (⚡${Math.round(ti[0].energy)}) mà vẫn nhận «${of?of.title:''}»`);
      if(ms.length>1&&chem(t.arts)<0)add('enemy',1,[t],`Đội hình «${of?of.title:''}» có hai người đang mâu thuẫn`)}
    else{const a=byId(t.x.a);let e=a.energy,lo=0;for(const k of t.x.days){e=clamp(e+(k==='rest'?12:TRAIN[k].e*.3),0,100);if(e<20)lo=1}
      if(lo)add('tired',1,[t],`Lịch của ${a.name} quá dày, năng lượng sẽ xuống dưới 20`)}
  }
  for(const c of P.c){
    const ms=[...new Set(c._t.map(t=>t.mid))].map(mById).filter(Boolean),ch=ms.map(chainUp);
    const cand=(ch[0]||[]).filter(r=>ch.every(x=>x.includes(r)));let res=null;
    for(const r of cand){c.path.push(r.name);if(canSolve(r,c)){res=r;break}}
    if(res){fixConf(P,c);c.by=res.name;mgrExp(res,.2);P.st.res++}else{c.pend=1;c.path.push('Giám đốc')}
    delete c._t;
  }
  passAll(P);
  const nb=Object.values(P.st.boss).reduce((a,b)=>a+b,0),pend=P.c.filter(c=>c.pend).length,parts=[];
  if(nb)parts.push(`cấp trên duyệt ${nb} mục (${Object.keys(P.st.boss).join(', ')})`);if(P.st.auto)parts.push(`${P.st.auto} mục tự duyệt`);
  if(P.st.res)parts.push(`${P.st.res} xung đột được quản lý cấp cao xử lý`);if(pend)parts.push(`⚠️ ${pend} xung đột chuyển lên Giám đốc`);
  if(parts.length)addLog(`📨 Đề xuất tuần: ${parts.join(' · ')}.`,pend?'bad':'');
}
export function passAll(P,force){
  for(const t of itemsOf(P)){if(t.x.ok)continue;
    const m=mById(t.mid),b=m&&mBoss(m),solved=(t.x.cf||[]).map(id=>P.c.find(c=>c.id===id)).filter(c=>c&&c.by).pop();
    const by=solved?solved.by:b?b.name:(S.autoAppr!==false?'tự duyệt':force||null);if(!by)continue;
    approveIt(P,t,by);if(t.x.ok===1){if(by==='tự duyệt')P.st.auto++;else if(by!=='Giám đốc')P.st.boss[by]=(P.st.boss[by]||0)+1}}
}
export function cfPick(cid,keep){const P=S.props;if(!P)return;const c=P.c.find(x=>x.id===cid);if(!c||!c.pend)return;
  if(keep==='as'){c.pend=0;c.done=1}else fixConf(P,c,keep==null?null:keep);c.by='Giám đốc';
  for(const r of c.refs){const t=refIt(P,r);if(t)approveIt(P,t,'Giám đốc')}
  passAll(P);
  addLog(`⚖️ Giám đốc xử lý xung đột: ${c.txt}.`);act()}
export const propCount=()=>{const P=buildProps();let n=P.c.filter(c=>c.pend).length;for(const k in P.m){const it=P.m[k];n+=it.s.filter(x=>!x.ok&&!(x.cf||[]).length&&byId(x.a)&&!byId(x.a).busy).length+it.p.filter(x=>!x.ok&&!(x.cf||[]).length&&S.offers.some(o=>o.id===x.of)).length}return n};
export function propOk(mid,kind,i,quiet){const it=S.props&&S.props.m[mid];if(!it)return;const x=it[kind][i];if(!x||x.ok)return;
  if((x.cf||[]).some(id=>{const c=S.props.c.find(z=>z.id===id);return c&&c.pend})){if(!quiet)toast('Cần xử lý xung đột trước');return}
  if(kind==='s'){const a=byId(x.a);if(!a||a.busy)return;a.days=x.days.slice();a.appr=abs();x.ok=1;if(!x.by)x.by='Giám đốc'}
  else if(kind==='p'){const of=S.offers.find(o=>o.id===x.of);if(!of){x.ok=-1;if(!quiet)toast('Lời mời đã hết hạn');return}
    if(x.ids.some(id=>{const a=byId(id);return !a||canTake(of,a)})){x.ok=-1;if(!quiet)toast('Đội hình không còn phù hợp');return}
    acceptCast(of.id,x.ids,true);x.ok=1;if(!x.by)x.by='Giám đốc';const mg=S.managers.find(m=>m.id===mid);if(mg)mgrExp(mg,.3)}
  if(!quiet)act()}
export function propOkAll(mid){const it=S.props&&S.props.m[mid];if(!it)return;it.p.forEach((x,i)=>propOk(mid,'p',i,1));it.s.forEach((x,i)=>propOk(mid,'s',i,1));act()}
export function propAll(){const P=buildProps();for(const k in P.m)propOkAll(+k)}
export const stTag=x=>x.ok===1?`<span class="tag m">✓ ${esc(x.by||'đã duyệt')}</span>`:x.ok===-2?`<span class="tag">✖ bỏ · ${esc(x.why2||'')}</span>`:x.ok===-1?'<span class="tag">hết hạn</span>':(x.cf||[]).some(id=>S.props.c.find(c=>c.id===id&&c.pend))?'<span class="tag r">⚠️ xung đột</span>':'';
export function viewProps(){
  const P=buildProps(),ms=S.managers.filter(m=>P.m[m.id]);
  const pc=P.c.filter(c=>c.pend),dc=P.c.filter(c=>c.done&&c.by&&c.by!=='Giám đốc');
  const cfHTML=pc.map(c=>{const its=c.refs.map(r=>refIt(P,r)).filter(Boolean);const two=c.type==='overlap'||c.type==='offer';
    return`<div class="card" style="border-color:var(--red)"><b>⚠️ ${CFT[c.type]}</b><div class="small">${esc(c.txt)}</div><div class="small muted">Đã chuyển qua: ${c.path.map(esc).join(' → ')}${c.path.length>1?' (cấp trên chưa đủ kỹ năng Kế hoạch để tự xử lý)':' (không có quản lý chung cấp trên)'}</div>
    ${two?its.map((t,i)=>`<div class="prow"><span class="small">${esc(itDesc(t))}</span><span class="sp"></span><button class="btn sm" onclick="cfPick(${c.id},${c.refs.findIndex(r=>r.mid===t.mid&&r.k===t.kind&&r.i===t.i)})">Giữ cái này</button></div>`).join(''):`<div class="small" style="margin:4px 0">${its.map(t=>esc(itDesc(t))).join('<br>')}</div>`}
    <div class="row" style="margin-top:6px"><button class="btn sm pri" onclick="cfPick(${c.id})">Theo gợi ý${c.type==='tired'?' (giảm tải)':c.type==='enemy'?' (đổi người)':c.type==='scandal'?' (hoãn dự án)':' (giữ phương án lợi nhất)'}</button>${two?'':`<button class="btn sm" onclick="cfPick(${c.id},'as')">Vẫn duyệt</button>`}</div></div>`}).join('');
  const body=ms.map(m=>{const it=P.m[m.id];
    const sl=it.s.map((x,i)=>{const a=byId(x.a);if(!a)return'';return`<div class="prow" style="${x.ok===-2?'opacity:.55':''}">🗓️ <b>${esc(a.name)}</b> <span class="dmini">${x.days.map(k=>TIC[k]).join('')}</span><span class="small muted">${esc(x.why)}</span><span class="sp"></span>${stTag(x)}${!x.ok&&!(x.cf||[]).length?`<button class="btn sm" onclick="propOk(${m.id},'s',${i})">Duyệt</button>`:''}</div>`}).join('');
    const pl=it.p.map((x,i)=>{const of=S.offers.find(o=>o.id===x.of);if(!of&&x.ok!==1&&x.ok!==-2)return'';const nm=x.ids.map(byId).filter(Boolean),O=OFFER[(of||{}).type]||{ic:'🎬'};
      const pay=of?nm.reduce((t,a)=>t+effPay(of,a),0):0;
      return`<div class="prow" style="${x.ok===-2?'opacity:.55':''}">${O.ic} <b>«${esc(of?of.title:'dự án')}»</b><span class="small muted">${esc(nm.map(a=>a.name).join(', '))}${of?` · ${of.weeks}t · +${fmt(pay)}`:''}</span><span class="sp"></span>${stTag(x)}${!x.ok&&!(x.cf||[]).length?`<button class="btn sm pri" onclick="propOk(${m.id},'p',${i})">Nhận</button>`:''}</div>`}).join('');
    const dl=it.d.map(x=>{const a=byId(x.a);if(!a||a.status!=='trainee')return'';return`<div class="prow">🎯 <b>${esc(a.name)}</b><span class="small">${esc(x.txt)}</span><span class="sp"></span><button class="btn sm" onclick="openRoom('lobby')">Xem</button></div>`}).join('');
    if(!sl&&!pl&&!dl)return'';
    const pend=it.s.filter(x=>!x.ok).length+it.p.filter(x=>!x.ok).length,b=mBoss(m);
    return det('pr-'+m.id,`📋 ${esc(m.name)} <span class="small muted" style="font-weight:500">· báo cáo ${b?esc(b.name):'Giám đốc'} · ${pend?pend+' chưa duyệt':'xong'}</span>`,`${pend&&!b?`<div class="row"><span class="sp"></span><button class="btn sm" onclick="propOkAll(${m.id})">Duyệt hết</button></div>`:''}${pl}${sl}${dl}`,pend>0)}).join('');
  const nb=Object.entries(P.st.boss);
  const go=propNext;
  modal(`<h2>📋 Đề xuất của quản lý</h2><div class="sub">Tuần ${S.week}. Quản lý báo cáo lên cấp trên: không xung đột thì được duyệt ngay, có xung đột thì chuyển lên người cao hơn, tới Giám đốc nếu không ai đủ thẩm quyền.</div>
  <div class="card small">📨 ${nb.length?nb.map(([n,v])=>`${esc(n)} duyệt ${v}`).join(' · '):'Chưa có cấp trên nào duyệt'}${P.st.auto?` · ${P.st.auto} tự duyệt`:''}${dc.length?` · ⚖️ ${dc.length} xung đột đã được xử lý`:''}${pc.length?` · <b class="bad">${pc.length} chờ bạn</b>`:''}</div>
  ${pc.length?`<h3>⚠️ Xung đột cần Giám đốc (${pc.length})</h3>${cfHTML}`:''}
  ${(()=>{const L=secPlans(),r=L.filter(p=>!p.wait&&!p.plan);return r.length?`<div class="card small row">🗒️ <span style="flex:1"><b>Thư ký:</b> ${r.map(p=>esc(p.n.slice(2).trim())+' ('+CONCEPTS[p.ck].n+')').join(', ')} sẵn sàng comeback.</span><button class="btn sm" onclick="view(viewSec)">Xem</button></div>`:''})()}
  ${dc.length?det('pr-solved',`⚖️ Xung đột cấp trên đã xử lý (${dc.length})`,dc.map(c=>`<div class="small">• <b>${esc(c.by)}</b>: ${esc(c.txt)} → ${c.type==='tired'?'giảm tải':c.type==='enemy'?'đổi người':c.type==='scandal'?'hoãn dự án':'giữ phương án lợi nhất'}</div>`).join(''),false):''}
  ${body||'<div class="card small muted">Không có đề xuất mới. Giao quản lý phụ trách nghệ sĩ và bật "Đề xuất" để nhận đề xuất mỗi tuần.</div>'}
  <label class="small row" style="margin-top:8px"><input type="checkbox" ${S.autoAppr!==false?'checked':''} onchange="S.autoAppr=this.checked;save()"> Tự duyệt đề xuất không xung đột của quản lý báo cáo trực tiếp cho bạn</label>
  <div class="row" style="margin-top:8px">${propCount()-pc.length>0?'<button class="btn" onclick="propAll()">✓ Duyệt phần còn lại</button>':''}<span class="sp"></span><button class="btn pri" onclick="${go?'propGo()':'closeM()'}">${go?'Tiếp tục ▶':'Đóng'}</button></div>`);
}
export function propGo(){const f=propNext;setPropNext(null);f&&f()}
