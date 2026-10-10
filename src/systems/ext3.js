import { R, pick, rnd } from '../core/rng.js';
import { t } from '../i18n/index.js';
import { $, clamp, esc, fmt, fmtN } from '../core/util.js';
import { FN, GNAMES, LNM, MN, SONGS } from '../data/names.js';
import { OFFER } from '../data/offers.js';
import { CONCEPTS, GENRES, MSK, MSKD, STATS } from '../data/rules.js';
import { save } from '../save/storage.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fame, genArtist, mkLook } from './artists.js';
import { batchOf } from './batches.js';
import { DEBUT_COST, DEBUT_MIN, DR, DRT, bestOf, debutIds, debutRec, lineupWith } from './debut.js';
import { pushEv } from './events.js';
import { MOOD, SONGW, book, compRep, dHold, ensureCurBatch, gMgr, lowK, mdReview, menteesOf, mentorScore, mxP, songRelease } from './ext2.js';
import { effSk, inSub, mBoss, mCap, mKids, mgrExp, mgrOf, targetName } from './managers.js';
import { trendTag } from './market.js';
import { acceptCast, canTake, slotsOf } from './offers.js';
import { datingPartner, getRel, groupsOf, harmony, setRel, setTag } from './relations.js';
import { actByKey } from './releases.js';
import { actFree, acts } from './secretary.js';
import { ensureDays, focusKeys, projEnergy, trainDays } from './week.js';
import { act, chibiHTML } from '../ui/building.js';
import { closeM, modal, setCurRC, toast, view } from '../ui/modal.js';
import { det, teamOf, viewArtist } from '../ui/views.js';

export const eligSort=(x,y)=>((y.dReady&&y.status==='trainee')?1:0)-((x.dReady&&x.status==='trainee')?1:0);
export function dElig(a,t){if(a.status!=='trainee')return false;const tbl=t==='actor'?GENRES:CONCEPTS;if(t==='group')return!!a.dReady;return bestOf(a,tbl)[0].f>DEBUT_MIN}
export function migrateV3(){S.mrel=S.mrel||{};S.ext=S.ext||[];S.artists.forEach(a=>{a.xr=a.xr||{}})}
/* ---- Màu tên quản lý theo cấp & quản lý các quản lý ---- */
export const LVC=['#f2557f','#a497d6','#5fd0a0','#efb54d','#6fb3f2','#f2895e','#c49bf0','#4fc8d9','#f07fae','#a8cf5a'];
export const lvColor=lv=>LVC[(Math.max(1,lv)-1)%LVC.length];
export function mNameH(m){return mBoss(m)?`<b style="color:${lvColor(m.lv)}">${esc(m.name)}</b>`:`<b>${esc(m.name)}</b>`}
export const mrK=(x,y)=>x.id<y.id?x.id+'-'+y.id:y.id+'-'+x.id;
export const mrel=(x,y)=>(S.mrel||{})[mrK(x,y)]||0;
export function setMrel(x,y,v){S.mrel=S.mrel||{};S.mrel[mrK(x,y)]=clamp(Math.round(v),-100,100)}
export const canKid=(m,x)=>x!==m&&x.boss!==m.id&&!inSub(x,m)&&mKids(m).length<mCap(m);
export const relTxt=v=>`<b class="${v<0?'bad':v>0?'good':''}">${v>0?'+':''}${v}</b>`;
export function mgrBossHTML(){
  if(!S.managers.length)return'';
  const L=S.managers.slice().sort((a,b)=>mKids(b).length-mKids(a).length||b.lv-a.lv);
  const lvs=[...new Set(S.managers.map(m=>m.lv))].sort((a,b)=>a-b);
  const legend=`<div class="small" style="margin-bottom:6px">Quản lý có cấp trên là quản lý khác sẽ hiện tên màu theo cấp (cùng cấp cùng màu): ${lvs.map(l=>`<b style="color:${lvColor(l)}">● Cấp ${l}</b>`).join(' ')} · tên màu thường là người báo cáo trực tiếp Giám đốc.</div>`;
  const row=m=>{const ks=mKids(m),cand=S.managers.filter(x=>canKid(m,x)).sort((a,b)=>(a.boss?1:0)-(b.boss?1:0)||a.lv-b.lv);
    return`<div class="card"><div class="row"><div class="chibi mini">${chibiHTML(m)}</div><div style="flex:1;min-width:0">${mNameH(m)} <span class="tag v">Cấp ${m.lv}</span>${ks.length?' <span class="tag s">👔 Trưởng nhóm</span>':''}<div class="small muted">${mBoss(m)?'Báo cáo cho '+esc(mBoss(m).name):'Báo cáo trực tiếp Giám đốc'} · kèm cặp ${ks.length}/${mCap(m)} quản lý · cả đội ${teamOf(m).length} nghệ sĩ</div></div></div>
    ${ks.length?ks.map(k=>`<div class="prow">↳ ${mNameH(k)}<span class="small muted">Cấp ${k.lv} · ${esc(targetName(k))} · quan hệ ${relTxt(mrel(m,k))}${mKids(k).length?` · kèm ${mKids(k).length} QL`:''}</span><span class="sp"></span><button class="btn sm" onclick="setBoss(${k.id},'')">Tách ra</button></div>`).join(''):'<div class="small muted" style="margin-top:4px">Chưa kèm cặp quản lý nào.</div>'}
    ${cand.length?`<div class="row" style="margin-top:6px"><select onchange="if(this.value)setBoss(+this.value,${m.id})" style="flex:1;min-width:0" aria-label="Giao quản lý cấp dưới"><option value="">+ Giao quản lý cấp dưới cho ${esc(m.name)}…</option>${cand.map(x=>`<option value="${x.id}">${esc(x.name)} (cấp ${x.lv})${x.boss?' – đang dưới '+esc((mBoss(x)||{}).name||''):''}</option>`).join('')}</select></div>`:(ks.length>=mCap(m)?'<div class="small muted">Đã đủ số cấp dưới ở cấp hiện tại.</div>':'')}</div>`};
  const pairs=[];for(let i=0;i<S.managers.length;i++)for(let j=i+1;j<S.managers.length;j++){const x=S.managers[i],y=S.managers[j],v=mrel(x,y);if(v)pairs.push({x,y,v})}
  pairs.sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
  const rel=`<h3 style="margin-top:10px">🤝 Quan hệ giữa các quản lý</h3>${pairs.slice(0,12).map(p=>`<div class="small">${mNameH(p.x)} & ${mNameH(p.y)}: ${relTxt(p.v)} ${p.v>=50?'· thân thiết, hay chia sẻ kinh nghiệm':p.v<=-30?'· hay bất đồng':''}</div>`).join('')||'<div class="small muted">Các quản lý chưa có tương tác đáng kể. Họ sẽ đi cà phê, tranh luận hoặc kèm cặp nhau theo thời gian.</div>'}`;
  return det('mg-boss',`👔 Quản lý các quản lý (${S.managers.filter(m=>mKids(m).length).length} trưởng nhóm)`,legend+L.map(row).join('')+rel,true);
}
/* ---- Trợ lý cá nhân cho nghệ sĩ quản lý theo nhóm ---- */
export const paOK=a=>a.status==='debuted'&&groupsOf(a).length>0&&!a.pm;
export const PA_NEED=a=>({care:(100-a.mood)/10+(groupsOf(a).some(g=>harmony(g.members)<0)?3:0),nego:fame(a)/12+2,pr:a.scandal?8:(datingPartner(a)?4:1),plan:(100-a.energy)/12+(a.busy?2:0)});
export const PA_WHY={care:'muốn có người lắng nghe, giữ tinh thần ổn định',nego:'muốn được hỗ trợ đàm phán thù lao tốt hơn',pr:'lo truyền thông, muốn có người giữ gìn hình ảnh',plan:'lịch trình dày, cần người sắp xếp thời gian'};
export function genPAC(a){const ks=Object.keys(MSK).sort(()=>Math.random()-.5).slice(0,3);a.paC=ks.map(k=>{const v=R(1,3);return{id:uid(),name:pick(LNM)+' '+pick(FN.concat(MN)),k,v,sal:(v+1)*5e5,fee:v*5e6}});a.paW=abs()}
export function paPick(a){const n=PA_NEED(a);return(a.paC||[]).slice().sort((x,y)=>(n[y.k]*y.v-y.fee/1e7)-(n[x.k]*x.v-x.fee/1e7))[0]}
export function paOpen(id){const a=byId(id);if(!a||!paOK(a))return toast('Chỉ nghệ sĩ được quản lý theo nhóm mới tự chọn trợ lý');if(!a.paC||abs()-(a.paW||0)>=8)genPAC(a);save();view(()=>viewPA(id))}
export function viewPA(id){const a=byId(id);if(!a)return closeM();if(!a.paC)genPAC(a);setCurRC('var(--r-mgr)');const p=paPick(a),gm=groupsOf(a).map(g=>gMgr(g)).find(Boolean);
  const L=a.paC.slice().sort((x,y)=>(y===p)-(x===p));
  modal(`<h2>🧑‍💻 Trợ lý cá nhân · ${esc(a.name)}</h2><div class="sub">Nghệ sĩ được quản lý theo nhóm có thể tự chọn một trợ lý riêng. Kỹ năng trợ lý cộng thêm vào kỹ năng quản lý áp dụng riêng cho ${esc(a.name)}${gm?` (trên nền QL nhóm ${esc(gm.name)})`:''}.</div>
  ${a.pa?`<div class="card row"><span class="small" style="flex:1">Hiện tại: <b>${esc(a.pa.name)}</b> · ${MSK[a.pa.k]} +${a.pa.v} · ${fmt(a.pa.sal)}/tuần</span><button class="btn sm warn" onclick="paFire(${a.id})">Cho nghỉ</button></div>`:''}
  <div class="card row wish"><div class="chibi mini">${chibiHTML(a)}</div><div class="small" style="flex:1">💬 <b>${esc(a.name)}:</b> "${p?`Em muốn chọn ${esc(p.name)} vì em ${PA_WHY[p.k]}.`:'Em chưa thấy ai phù hợp.'}"</div></div>
  ${L.map(c=>`<div class="card"><div class="row"><b>${esc(c.name)}</b>${c===p?' <span class="tag s">💬 Nghệ sĩ tự chọn</span>':''}<span class="sp"></span><span class="tag v">${MSK[c.k]} +${c.v}</span></div><div class="small muted">${MSKD[c.k]} · Phí ${fmt(c.fee)} · lương ${fmt(c.sal)}/tuần</div><div class="row" style="margin-top:6px"><span class="sp"></span><button class="btn sm ${c===p?'pri':''}" onclick="paHire(${a.id},${c.id})">${c===p?'Đồng ý lựa chọn của '+esc(a.name):'Chọn người này thay'}</button></div></div>`).join('')}
  <div class="row"><button class="btn" onclick="paRe(${a.id})">🔄 Ứng viên khác (3 tr)</button><span class="sp"></span><button class="btn" onclick="view(()=>viewArtist(${a.id}))">← Hồ sơ</button></div>`)}
export function paHire(aid,cid){const a=byId(aid);if(!a)return;const c=(a.paC||[]).find(x=>x.id===cid);if(!c)return;if(S.money<c.fee)return toast('Không đủ tiền');
  const p=paPick(a);S.money-=c.fee;book('hr',-c.fee);a.pa={name:c.name,k:c.k,v:c.v,sal:c.sal};a.paC=null;
  if(c===p){MOOD(a,6);addLog(`🧑‍💻 ${a.name} tự chọn trợ lý cá nhân ${c.name} (${MSK[c.k]} +${c.v}).`,'good')}else{MOOD(a,-3);addLog(`🧑‍💻 Công ty chọn trợ lý ${c.name} cho ${a.name} thay vì người ${a.name} thích.`)}
  view(()=>viewArtist(aid));act()}
export function paRe(aid){const a=byId(aid);if(!a)return;if(S.money<3e6)return toast('Không đủ tiền');S.money-=3e6;book('hr',-3e6);genPAC(a);act()}
export function paFire(aid){const a=byId(aid);if(!a||!a.pa)return;addLog(`👋 Trợ lý cá nhân ${a.pa.name} của ${a.name} nghỉ việc.`);a.pa=null;MOOD(a,-3);act()}
/* ---- Chuyên gia chăm sóc sức khoẻ ---- */
export function genHSC(){S.hsC=[0,1].map(()=>{const sk=R(1,5);return{id:uid(),name:'BS. '+pick(LNM)+' '+pick(FN.concat(MN)),sk,sal:(sk+1)*1e6,fee:sk*8e6,look:mkLook(Math.random()<.5?'F':'M','#e9e9f2')}})}
export function hsHire(id){const c=(S.hsC||[]).find(x=>x.id===id);if(!c)return;if(S.money<c.fee)return toast('Không đủ tiền');S.money-=c.fee;book('hr',-c.fee);S.hs=c;S.hsC=null;addLog(`🩺 Tuyển chuyên gia chăm sóc sức khỏe ${c.name} (chuyên môn ${c.sk}/5).`,'good');act()}
export function hsFire(btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent=t('btn.tapAgain');return}if(!S.hs)return;addLog(`👋 Chuyên gia ${S.hs.name} nghỉ việc.`);S.hs=null;act()}
export const restN=a=>a.days.filter(k=>k==='rest').length;
export function hsRisk(a){const td=trainDays(a),r=[];ensureDays(a);if(a.energy<35)r.push(`năng lượng chỉ còn ${Math.round(a.energy)}`);if(a.mood<30)r.push(`tâm trạng xuống ${Math.round(a.mood)}`);if(td>=6&&a.energy<65)r.push(`tập ${td}/7 ngày khi thể lực chưa hồi`);if(a.status==='trainee'&&(a.ttsFail||0)>=2&&a.mood<55)r.push('áp lực vì trượt đánh giá liên tiếp');const pe=projEnergy(a);if(pe[6]<20&&td>=4)r.push('dự báo cạn sức cuối tuần');return r}
export function applyRest(a,n){if(a.busy)return;ensureDays(a);const d=a.days.slice();let c=d.filter(k=>k==='rest').length;for(let i=6;i>=0&&c<n;i--)if(d[i]!=='rest'){d[i]='rest';c++}a.days=d}
export function restDo(a,n,by){applyRest(a,n);a.restRec=abs()+2;a.restN=n;if(a.hsF)a.hsF.st='ok';MOOD(a,4);addLog(`🛌 ${by} cho ${a.name} nghỉ ${n} ngày/tuần trong 2 tuần theo khuyến nghị sức khỏe.`,'good')}
export function hsApply(id){const a=byId(id);if(!a||!a.hsF)return;restDo(a,a.hsF.n,'Giám đốc');S.events=S.events.filter(e=>!(e.kind==='v3'&&e.t==='hs'&&e.a===id));act()}
export function hsTick(){if(!S.hs)return;let n=0;const ch=.4+S.hs.sk*.12;
  const L=S.artists.filter(a=>!a.busy&&!(a.hsF&&a.hsF.w>abs()-3)&&!(a.restRec>abs())).map(a=>({a,r:hsRisk(a)})).filter(x=>x.r.length).sort((x,y)=>y.r.length-x.r.length);
  for(const {a,r} of L){if(Math.random()>ch)continue;const need=clamp(Math.max(restN(a)+1,2+r.length),2,5),m=mgrOf(a)||null;a.hsF={w:abs(),why:r,n:need,st:'new'};
    if(n<2&&!S.events.some(e=>e.t==='hs'&&e.a===a.id)){pushEv({kind:'v3',t:'hs',a:a.id,n:need,m:m?m.id:0});n++}}
  if(L.length&&!n&&Math.random()<.3)addLog(`🩺 ${S.hs.name} đang theo dõi ${L.length} người có dấu hiệu mệt mỏi.`)}
export function hsHTML(){const fl=S.artists.filter(a=>a.hsF&&a.hsF.w>=abs()-3).sort((x,y)=>(x.hsF.st==='ok')-(y.hsF.st==='ok')||y.hsF.why.length-x.hsF.why.length);
  let h=`<h3>🩺 Chuyên gia chăm sóc sức khỏe</h3>`;
  if(S.hs)h+=`<div class="card row"><div class="chibi mini">${chibiHTML(S.hs)}</div><div class="small" style="flex:1"><b>${esc(S.hs.name)}</b> · chuyên môn ${S.hs.sk}/5 · lương ${fmt(S.hs.sal)}/tuần<br><span class="muted">Mỗi tuần kiểm tra năng lượng, tâm trạng, lịch tập của nghệ sĩ và TTS. Ai cần nghỉ nhiều hơn sẽ được báo để quản lý cân nhắc. Chuyên môn cao phát hiện chính xác hơn.</span></div><button class="btn sm warn" onclick="hsFire(this)">Cho nghỉ</button></div>`;
  else{if(!S.hsC)genHSC();h+=`<div class="small muted" style="margin-bottom:6px">Chưa có chuyên gia. Chuyên gia sẽ phát hiện nghệ sĩ/TTS cần thêm lịch nghỉ và báo quản lý cân nhắc.</div>${S.hsC.map(c=>`<div class="card row"><div class="chibi mini">${chibiHTML(c)}</div><div class="small" style="flex:1"><b>${esc(c.name)}</b><br>Chuyên môn ${c.sk}/5 · lương ${fmt(c.sal)}/tuần</div><button class="btn sm pri" onclick="hsHire(${c.id})">Tuyển (${fmt(c.fee)})</button></div>`).join('')}`}
  h+=fl.length?`<div class="small" style="margin:6px 0 4px"><b>Cần thêm lịch nghỉ (${fl.length})</b></div>${fl.map(a=>{const m=mgrOf(a);return`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">${a.status==='trainee'?'TTS · ':''}${esc(a.hsF.why.join(', '))} · đề xuất ${a.hsF.n} ngày nghỉ${m?' · QL '+esc(m.name):''}</span><span class="sp"></span>${a.hsF.st==='ok'?'<span class="tag m">✓ đã cho nghỉ</span>':`<button class="btn sm pri" onclick="hsApply(${a.id})">Áp dụng</button>`}</div>`}).join('')}`:(S.hs?'<div class="small muted">Chưa phát hiện ai cần nghỉ thêm.</div>':'');
  return h}
/* ---- Debut đầu tuần: hỏi nhóm hay solo ---- */
export function dOpts(a){if(a.status!=='trainee')return null;const r=debutRec(a);if(r.t==='wait')return null;const so=bestOf(a,CONCEPTS)[0];
  const pool=S.artists.filter(x=>x.status==='trainee'&&!x.busy&&!groupsOf(x).length);let grp=null,gk=null;
  for(const k in CONCEPTS){const l=lineupWith(a,pool,CONCEPTS[k].w);if(l&&(!grp||l.sc>grp.sc)){grp=l;gk=k}}
  const soloOK=so.f>DEBUT_MIN,grpOK=!!(grp&&grp.f>DEBUT_MIN),actOK=r.t==='actor';
  return{r,so,grp,gk,soloOK,grpOK,actOK,both:soloOK&&grpOK}}
export function dWish(a,o){if(a.dw&&a.dw.w>abs()-4)return a.dw;
  const mates=o.grp?o.grp.ids.filter(i=>i!==a.id).map(byId).filter(Boolean):[],fr=mates.filter(x=>a.tag[x.id]==='friend'),en=mates.filter(x=>a.tag[x.id]==='enemy');
  const s=(o.so.f-(o.grp?o.grp.f:0))*.6+(['vocal','rap'].includes(a.spec)?4:0)+(a.mood<40?-5:0)-fr.length*6+en.length*8+R(-4,4),t=s>0?'solo':'group';
  const why=t==='solo'?(en.length?`Em không hợp với ${en[0].name}, em muốn tự đứng trên sân khấu của mình.`:`Em tự tin vào ${STATS[a.spec]} và muốn thử sức solo với concept ${CONCEPTS[o.so.k].n}.`):(fr.length?`Em muốn debut cùng ${fr.map(x=>x.name).join(', ')}, tụi em đã cùng cố gắng rất lâu.`:`Em nghĩ đứng chung nhóm sẽ bổ trợ nhau tốt hơn, concept ${CONCEPTS[o.gk].n} rất hợp.`);
  a.dw={t,why,w:abs()};return a.dw}
export const dqList=()=>S.artists.filter(a=>a.status==='trainee'&&a.dReady&&!a.busy&&(a.dqSkip||0)<=abs()).sort((x,y)=>debutRec(y).f-debutRec(x).f);
export function dqBanner(){const L=dqList();return L.length?`<div class="card tg row"><span class="small" style="flex:1">🎊 <b>${L.length} TTS đủ điều kiện debut tuần này:</b> ${L.map(a=>esc(a.name)).join(', ')}</span><button class="btn sm pri" onclick="view(viewDebutQ)">Quyết định</button></div>`:''}
export function gName(a){if(!a.dqName||S.groups.some(g=>g.name===a.dqName))a.dqName=pick(GNAMES.filter(n=>!S.groups.some(g=>g.name===n)).concat(['Starlight '+R(2,9)]));return a.dqName}
export function viewDebutQ(){setCurRC('var(--r-lobby)');const L=dqList();
  const card=a=>{const o=dOpts(a);if(!o)return'';const w=o.both?dWish(a,o):null,gIds=o.grp?o.grp.ids:[],mates=gIds.filter(i=>i!==a.id).map(byId).filter(Boolean),notR=mates.filter(x=>!x.dReady);
    const btn=(t,lbl,cost)=>`<button class="btn sm ${(w?w.t===t:o.r.t===t)?'pri':''}" onclick="dqDo(${a.id},'${t}')">${lbl} (${fmt(cost)})</button>`;
    return`<div class="card ${o.both?'wish':''}"><div class="row"><div class="chibi mini">${chibiHTML(a)}</div><div style="flex:1;min-width:0"><b>${esc(a.name)}</b> <span class="tag s">✅ Đủ điều kiện</span>${o.both?' <span class="tag v">Nhóm & Solo</span>':''}<div class="small muted">${esc((batchOf(a)||{n:''}).n)} · đề xuất: ${DR[o.r.t]} · ${esc(o.r.why)}</div></div></div>
    ${o.grpOK?`<div class="small" style="margin-top:6px">👥 <b>Nhóm:</b> cùng ${mates.map(x=>esc(x.name)).join(', ')} · concept ${CONCEPTS[o.gk].n}${trendTag(o.gk)} ${Math.round(o.grp.f)}% · hòa hợp ${o.grp.hm>=0?'+':''}${o.grp.hm}${notR.length?` <span class="muted">(${notR.map(x=>esc(x.name)).join(', ')} chưa đủ điều kiện riêng nhưng hợp đội hình)</span>`:''}</div><div class="row" style="margin-top:4px"><span class="small">Tên nhóm:</span><input type="text" id="dqn${a.id}" value="${esc(gName(a))}" onchange="byId(${a.id}).dqName=this.value;save()" style="flex:1;min-width:0"></div>`:''}
    ${o.soloOK?`<div class="small" style="margin-top:4px">🎤 <b>Solo:</b> concept ${CONCEPTS[o.so.k].n}${trendTag(o.so.k)} ${Math.round(o.so.f)}%</div>`:''}
    ${w?`<div class="card row" style="margin:6px 0 0;background:var(--bg)"><span class="small">❓ Công ty hỏi: "Em muốn debut theo nhóm hay solo?"<br>💬 <b>${esc(a.name)}:</b> "${esc(w.why)}" → <b>muốn debut ${DRT[w.t]}</b></span></div>`:''}
    <div class="row" style="margin-top:8px">${o.grpOK?btn('group','👥 Debut nhóm',DEBUT_COST.group(gIds.length)):''}${o.soloOK?btn('solo','🎤 Debut solo',DEBUT_COST.solo()):''}${o.actOK?btn('actor','🎬 Debut diễn viên',DEBUT_COST.actor()):''}</div>
    <div class="row" style="margin-top:6px"><button class="btn sm" onclick="dqKeep(${a.id})">Tiếp tục làm TTS</button><button class="btn sm" onclick="dqLater(${a.id})">Để tuần sau</button><span class="sp"></span><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">Hồ sơ</button></div></div>`};
  modal(`<h2>🎊 Đầu tuần ${S.week}: quyết định debut</h2><div class="sub">Các TTS đủ điều kiện debut. Chọn cho debut ngay hoặc tiếp tục làm thực tập sinh. Ai đủ điều kiện cả nhóm lẫn solo sẽ được hỏi ý kiến; chọn đúng mong muốn giúp tâm trạng tốt hơn.</div>
  ${L.length?L.map(card).join(''):'<div class="card small">✅ Đã quyết định xong cho tất cả TTS đủ điều kiện tuần này.</div>'}
  <label class="small row"><input type="checkbox" ${S.dqOn!==false?'checked':''} onchange="S.dqOn=this.checked;save()"> Tự hiện danh sách này mỗi đầu tuần</label>
  <div class="row" style="margin-top:8px">${S.lastRep?'<button class="btn pri" onclick="view(viewReport)">📑 Xem báo cáo tuần trước</button>':''}<span class="sp"></span><button class="btn" onclick="closeM()">Đóng</button></div>`)}
export function dqDo(id,t){const a=byId(id);if(!a)return;const o=dOpts(a);if(!o)return toast('Không còn đủ điều kiện');const w=o.both?a.dw:null;let ok=false;
  if(t==='group'){if(!o.grp)return toast('Không đủ người lập nhóm');ok=debutIds('group',o.grp.ids,($('#dqn'+id)?.value||gName(a)))}else ok=debutIds(t,[id]);
  if(ok&&w){const h=w.t===t;MOOD(a,h?8:-8);addLog(h?`😊 ${a.name} vui vì được debut ${DRT[t]} đúng mong muốn.`:`😕 ${a.name} tiếc vì muốn debut ${DRT[w.t]} nhưng công ty chọn ${DRT[t]}.`,h?'good':'bad');act()}}
export function dqKeep(id){const a=byId(id);if(!a)return;a.dqSkip=abs()+4;a.noHold=true;addLog(`🌱 ${a.name} tiếp tục làm thực tập sinh, mở lịch nhận dự án. Công ty sẽ hỏi lại sau 4 tuần.`);act()}
export function dqLater(id){const a=byId(id);if(!a)return;a.dqSkip=abs()+1;act()}
/* ---- Người ngoài công ty ---- */
export const EXTN=['Jun Kai','Mina Lê','Rosie Trần','Leo Phạm','Hana Võ','Ryan Đỗ','Yuna Mai','Sky Nguyễn','Luna Hồ','Zen Lâm','Bella Vũ','Tony Lý','Coco Đinh','Nick Huỳnh','Amy Tô','Rin Đào','Kenji Bùi','Mia Cao'];
export function extFill(){S.ext=S.ext||[];const used=new Set(S.ext.map(x=>x.name));while(S.ext.length<8){const nm=pick(EXTN.filter(n=>!used.has(n)));if(!nm)break;used.add(nm);const rv=S.rivals&&S.rivals.length?pick(S.rivals):{n:'Indie',fans:5e4};S.ext.push({id:uid(),name:nm,co:rv.n,fans:Math.round(rv.fans*rnd(.04,.25))})}}
export const extById=id=>(S.ext||[]).find(x=>x.id===id);
export const xRel=(a,x)=>(a.xr||{})[x.id]||0;
export function setXr(a,x,v){a.xr=a.xr||{};a.xr[x.id]=clamp(Math.round(v),-100,100)}
export function interTick(){extFill();const now=abs(),deb=S.artists.filter(a=>a.status==='debuted'),free=S.artists.filter(a=>!a.busy),evN=()=>S.events.filter(e=>e.kind==='v3').length;
  /* nghệ sĩ ↔ người ngoài */
  if(deb.length&&Math.random()<.45){const a=pick(deb),x=pick(S.ext),r=Math.random();
    if(r<.35){setXr(a,x,xRel(a,x)+R(10,22));addLog(`🎤 ${a.name} làm quen với ${x.name} (${x.co}) ở hậu trường show âm nhạc.${xRel(a,x)>=50?' Hai người đã khá thân.':''}`)}
    else if(r<.55&&x.fans>a.fans){const k=lowK(a);a.st[k]=clamp(+(a.st[k]+2).toFixed(1),0,100);setXr(a,x,xRel(a,x)+8);addLog(`💡 Tiền bối ${x.name} (${x.co}) chỉ cho ${a.name} vài bí quyết: ${STATS[k]} +2.`,'good')}
    else if(r<.78&&!a.busy&&evN()<3)pushEv({kind:'v3',t:'xcollab',a:a.id,x:x.id})
    else if(r<.9&&a.fans>5000&&xRel(a,x)>=25&&!a.scandal&&evN()<3)pushEv({kind:'v3',t:'xrumor',a:a.id,x:x.id})
    else{MOOD(a,-3);setXr(a,x,xRel(a,x)-10);addLog(`😤 ${x.name} (${x.co}) bóng gió chê ${a.name} trên livestream. ${a.name} hơi buồn nhưng có thêm động lực.`)}}
  /* nghệ sĩ ↔ nghệ sĩ trong công ty */
  if(free.length>=2&&Math.random()<.35){const a=pick(free),b=pick(free.filter(x=>x!==a&&x.tag[a.id]!=='enemy'));if(b){setRel(a,b,getRel(a,b)+R(4,10));a.st[b.spec]=clamp(+(a.st[b.spec]+1).toFixed(1),0,100);b.st[a.spec]=clamp(+(b.st[a.spec]+1).toFixed(1),0,100);addLog(`🤝 ${a.name} rủ ${b.name} tập thêm buổi tối: ${STATS[b.spec]} và ${STATS[a.spec]} cùng tiến bộ.`);if(!a.tag[b.id]&&getRel(a,b)>=60){setTag(a,b,'friend');addLog(`🤝 ${a.name} và ${b.name} trở thành bạn thân.`,'good')}}}
  /* nghệ sĩ ↔ quản lý */
  if(Math.random()<.3){const a=pick(S.artists.filter(x=>!x.busy&&mgrOf(x))||[]);if(a){const m=mgrOf(a);
    if(a.energy<45&&trainDays(a)>=5&&evN()<3&&!S.events.some(e=>e.t==='amgr'))pushEv({kind:'v3',t:'amgr',a:a.id,m:m.id});
    else if(a.mood>70&&effSk(m,'care')>=4){mgrExp(m,.5);addLog(`🎁 ${a.name} tặng quà cảm ơn QL ${m.name} vì đã chăm sóc chu đáo.`,'good')}}}
  /* quản lý ↔ quản lý */
  if(S.managers.length>=2&&Math.random()<.4){const x=pick(S.managers),y=pick(S.managers.filter(m=>m!==x)),r=Math.random();
    if(r<.45){setMrel(x,y,mrel(x,y)+R(5,12));if(mrel(x,y)>=40&&x.sk[x.spec]>y.sk[x.spec]&&y.sk[x.spec]<10&&Math.random()<.4){y.sk[x.spec]++;addLog(`☕ QL ${x.name} chia sẻ kinh nghiệm ${MSK[x.spec]} cho QL ${y.name} (+1).`,'good')}else addLog(`☕ QL ${x.name} và QL ${y.name} đi cà phê, trao đổi công việc.`)}
    else if(r<.7&&x.as&&y.as&&evN()<3&&!S.events.some(e=>e.t==='mmclash'))pushEv({kind:'v3',t:'mmclash',m:x.id,m2:y.id,why:pick(['tranh lịch phòng tập cho nghệ sĩ mình phụ trách','tranh lời mời béo bở','bất đồng cách xử lý truyền thông','đổ lỗi cho nhau về lịch trình trùng'])});
    else{const hi=x.lv>=y.lv?x:y,lo=hi===x?y:x;if(hi.lv>lo.lv&&!lo.boss&&canKid(hi,lo)&&evN()<3&&!S.events.some(e=>e.t==='mmcoach'))pushEv({kind:'v3',t:'mmcoach',m:hi.id,m2:lo.id})}}
  for(const m of S.managers){const b=mBoss(m);if(b)setMrel(m,b,mrel(m,b)+1)}
}
/* ---- Tiền bối, giới thiệu TTS, GĐ Âm nhạc ---- */
export function v3Tick(){const evN=()=>S.events.filter(e=>e.kind==='v3').length;
  /* nghệ sĩ tự đề xuất dẫn dắt TTS */
  if(!S.events.some(e=>e.t==='mtreq')){const ms=S.artists.filter(m=>m.status==='debuted'&&!m.busy&&m.mood>=45&&menteesOf(m).length<2&&abs()-(m.mtRq||-99)>=6);
    for(const m of ms.sort(()=>Math.random()-.5)){if(Math.random()>.15)continue;const t=S.artists.filter(x=>x.status==='trainee'&&!x.mt&&x.tag[m.id]!=='enemy').sort((x,y)=>mentorScore(m,y)-mentorScore(m,x))[0];if(t&&mentorScore(m,t)>3){m.mtRq=abs();pushEv({kind:'v3',t:'mtreq',a:m.id,b:t.id});break}}}
  /* tiền bối giới thiệu đàn em vào dự án */
  if(!S.events.some(e=>e.t==='mtjob'))for(const t of S.artists.filter(x=>x.status==='trainee'&&x.mt&&!x.busy&&!dHold(x)).sort(()=>Math.random()-.5)){const m=byId(t.mt);if(!m||Math.random()>.3)continue;
    const ofs=S.offers.filter(o=>OFFER[o.type].trainee&&(!o.target||o.target===t.id)&&slotsOf(o)>=1).filter(o=>{const old=o.target;o.target=t.id;const ok=!canTake(o,t);o.target=old;return ok});
    if(ofs.length){const of=ofs.sort((x,y)=>y.pay-x.pay)[0];pushEv({kind:'v3',t:'mtjob',a:m.id,b:t.id,of:of.id});break}}
  /* nghệ sĩ giới thiệu TTS mới */
  {const deb=S.artists.filter(a=>a.status==='debuted');if(deb.length&&Math.random()<.07&&!S.events.some(e=>e.t==='intro')&&evN()<4){const a=pick(deb),c=genArtist();c.talent=+rnd(.95,1.25).toFixed(2);c.st[c.spec]=clamp(c.st[c.spec]+R(4,12),0,75);pushEv({kind:'v3',t:'intro',a:a.id,cand:c,how:pick(['bạn thời cấp ba','đàn em cùng lớp nhảy','người quen ở phòng thu','em họ','bạn cùng xóm','đàn em ở câu lạc bộ âm nhạc'])})}}
  /* trợ lý cá nhân: nghệ sĩ nhóm xin chọn */
  {const L=S.artists.filter(a=>paOK(a)&&!a.pa&&abs()-(a.paAsk||-99)>=10);if(L.length&&Math.random()<.08&&!S.events.some(e=>e.t==='paask')){const a=pick(L);a.paAsk=abs();pushEv({kind:'v3',t:'paask',a:a.id})}}
  /* GĐ Âm nhạc tự sáng tác */
  if(acts().length&&Math.random()<.13&&!S.events.some(e=>e.t==='md')){const ck=S.trend&&Math.random()<.55?pick(S.trend.hot):pick(Object.keys(CONCEPTS));
    const s={id:uid(),t:pick(SONGW.concat(SONGS)),ck,q:clamp(R(40,78)+Math.floor(compRep()/8),20,96),by:[],st:'ok',w:abs(),doneAt:abs(),y:S.year,md:1};const r=mdReview(s);
    if(r.sug.length){s.rv={g:r.g,mk:r.mk};pushEv({kind:'v3',t:'md',song:s,k:r.sug[0].k},true)}}
  hsTick();interTick();
  {const t=S.artists.reduce((x,a)=>x+(a.pa?a.pa.sal:0),0)+(S.hs?S.hs.sal:0);if(t){S.money-=t;book('mgr',-t)}}
  if(S.week%8===0&&!S.hs)genHSC();
}
/* ---- Sự kiện v3 ---- */
export function v3Info(e){const a=e.a!=null?byId(e.a):null,b=e.b?byId(e.b):null;
  switch(e.t){
  case'mtreq':{if(!a||!b||b.status!=='trainee'||b.mt)return null;const k=focusKeys(b).reduce((m,x)=>(a.st[x]-b.st[x])>(a.st[m]-b.st[m])?x:m),fr=a.tag[b.id]==='friend';
    return{ic:'🙋',t:`${a.name} muốn dẫn dắt TTS ${b.name}`,d:`${a.name} tự đề xuất làm tiền bối cho ${b.name}: "Em thấy ${b.name} còn yếu ${STATS[k]} (${Math.round(b.st[k])} so với ${Math.round(a.st[k])} của em), em muốn kèm thêm."${fr?' Hai người vốn thân thiết.':''} Tập nhanh hơn tối đa +40%, tiền bối tốn chút năng lượng mỗi tuần. Đang dẫn dắt ${menteesOf(a).length}/2.`,o:[{k:'yes',l:'Đồng ý'},{k:'no',l:'Từ chối'}]}}
  case'mtjob':{const of=S.offers.find(o=>o.id===e.of);if(!a||!b||!of||b.busy)return null;const O=OFFER[of.type];
    return{ic:'🤝',t:`${a.name} giới thiệu đàn em ${b.name} vào dự án`,d:`Tiền bối ${a.name} quen ${of.partner} và tiến cử ${b.name} cho ${O.n} «${of.title}» (${of.weeks} tuần, thù lao gốc ${fmt(of.pay)}). Nhờ được giới thiệu, đối tác mời đích danh nên yêu cầu giảm 20% và quan hệ đối tác tăng.`,o:[{k:'yes',l:'Nhận dự án'},{k:'no',l:'Từ chối'}]}}
  case'intro':{if(!a||!e.cand)return null;const c=e.cand;return{ic:'💌',t:`${a.name} giới thiệu một gương mặt mới`,d:`${a.name} giới thiệu ${c.name} (${e.how}), năng khiếu ${STATS[c.spec]}, tố chất x${c.talent}: "Bạn ấy rất chăm chỉ, em tin sẽ hợp với công ty." Ký hợp đồng TTS 10 tr.`,o:[{k:'yes',l:'Mời làm TTS (10 tr)'},{k:'no',l:'Bỏ qua'}]}}
  case'paask':{if(!a||!paOK(a)||a.pa)return null;const gm=groupsOf(a).map(g=>gMgr(g)).find(Boolean);return{ic:'🧑‍💻',t:`${a.name} muốn tự chọn trợ lý cá nhân`,d:`${a.name} đang được quản lý theo nhóm${gm?' bởi QL '+gm.name:''} và muốn có trợ lý riêng để lo việc cá nhân. ${a.name} sẽ tự chọn trong 3 ứng viên, bạn duyệt chi phí.`,o:[{k:'yes',l:'Cho tự chọn'},{k:'no',l:'Để sau'}]}}
  case'hs':{if(!a||!S.hs||!a.hsF)return null;const m=e.m?S.managers.find(x=>x.id===e.m):null;
    return{ic:'🩺',t:`Chuyên gia: ${a.name} cần nghỉ nhiều hơn`,d:`${S.hs.name} phát hiện ${a.status==='trainee'?'TTS':'nghệ sĩ'} ${a.name}: ${a.hsF.why.join(', ')}. Đề xuất ${e.n} ngày nghỉ/tuần trong 2 tuần (hiện ${restN(a)} ngày). ${m?`Đã gửi QL ${m.name} (Chăm sóc ${effSk(m,'care')}) cân nhắc.`:'Chưa có quản lý, cần Giám đốc quyết định.'}`,o:m?[{k:'yes',l:'Áp dụng ngay'},{k:'no',l:'Giữ lịch hiện tại'},{k:'mgr',l:`Để QL ${m.name} cân nhắc`}]:[{k:'yes',l:'Áp dụng'},{k:'no',l:'Giữ lịch hiện tại'}]}}
  case'md':{const s=e.song,x=actByKey(e.k);if(!s||!x)return null;const r=mdReview(s);
    return{ic:'🎼',t:`GĐ Âm nhạc sáng tác «${s.t}» cho ${x.n.slice(2).trim()}`,d:`GĐ Âm nhạc tự sáng tác một bài ${CONCEPTS[s.ck].n}${trendTag(s.ck)}, chất lượng ${s.q}/100, hạng ${r.g}. "${r.cm}" Đề xuất nghệ sĩ hợp: ${r.sug.map(z=>`${z.n.slice(2).trim()} ${z.f}%${z.free?'':' (đang bận)'}`).join(', ')}.`,o:[{k:'give',l:`Giao cho ${x.n.slice(2).trim()}`},{k:'no',l:'Không dùng'},{k:'keep',l:'Lưu vào kho bài'}]}}
  case'xcollab':{const x=extById(e.x);if(!a||!x||a.busy)return null;return{ic:'🎙️',t:`${x.name} (${x.co}) mời ${a.name} hợp tác`,d:`${x.name} của ${x.co} (${fmtN(x.fans)} fan, quan hệ ${xRel(a,x)}) mời ${a.name} góp giọng một ca khúc. Mất 1 tuần, tiếp cận fan của công ty bạn, nhận thù lao.`,o:[{k:'yes',l:'Nhận lời'},{k:'no',l:'Từ chối'}]}}
  case'xrumor':{const x=extById(e.x);if(!a||!x)return null;return{ic:'📸',t:`Tin đồn hẹn hò: ${a.name} & ${x.name}`,d:`Báo lá cải đăng ảnh ${a.name} đi ăn cùng ${x.name} (${x.co}). Fan hai bên đang tranh cãi.`,o:[{k:'deny',l:'Phủ nhận'},{k:'admit',l:'Xác nhận là bạn thân'},{k:'quiet',l:'Im lặng'}]}}
  case'amgr':{const m=S.managers.find(x=>x.id===e.m);if(!a||!m)return null;return{ic:'😮‍💨',t:`${a.name} than phiền về lịch của QL ${m.name}`,d:`${a.name} (năng lượng ${Math.round(a.energy)}, tập ${trainDays(a)}/7 ngày) nói với Giám đốc rằng QL ${m.name} xếp lịch quá dày.`,o:[{k:'rest',l:'Yêu cầu QL giảm lịch'},{k:'back',l:'Ủng hộ quản lý'}]}}
  case'mmclash':{const x=S.managers.find(z=>z.id===e.m),y=S.managers.find(z=>z.id===e.m2);if(!x||!y)return null;return{ic:'⚡',t:`QL ${x.name} và QL ${y.name} tranh cãi`,d:`Hai quản lý ${e.why}. Quan hệ hiện tại ${mrel(x,y)}.`,o:[{k:'meet',l:'Họp hòa giải (5 tr)'},{k:'x',l:`Đứng về phía ${x.name}`},{k:'y',l:`Đứng về phía ${y.name}`},{k:'none',l:'Để họ tự giải quyết'}]}}
  case'mmcoach':{const x=S.managers.find(z=>z.id===e.m),y=S.managers.find(z=>z.id===e.m2);if(!x||!y||!canKid(x,y)||y.boss)return null;return{ic:'👔',t:`QL ${x.name} đề nghị kèm cặp QL ${y.name}`,d:`${x.name} (cấp ${x.lv}) muốn nhận ${y.name} (cấp ${y.lv}) làm cấp dưới. Cấp dưới được cộng 20% kỹ năng cấp trên, cấp trên nhận một nửa kinh nghiệm cấp dưới.`,o:[{k:'yes',l:'Đồng ý'},{k:'no',l:'Không'}]}}
  }return null}
export function v3Resolve(e,k){const a=e.a!=null?byId(e.a):null,b=e.b?byId(e.b):null;
  switch(e.t){
  case'mtreq':if(!a||!b)return;if(k==='yes'){if(b.status!=='trainee'||b.mt||menteesOf(a).length>=2)return toast('Không còn phù hợp');b.mt=a.id;setRel(a,b,getRel(a,b)+10);MOOD(a,6);MOOD(b,4);addLog(`👩‍🏫 ${a.name} tự đề xuất và được duyệt dẫn dắt TTS ${b.name}.`,'good')}else{MOOD(a,-3);addLog(`🙅 Từ chối đề xuất dẫn dắt ${b.name} của ${a.name}.`)}return;
  case'mtjob':{const of=S.offers.find(o=>o.id===e.of);if(!a||!b||!of)return;if(k!=='yes'){addLog(`🙅 Từ chối dự án ${a.name} giới thiệu cho ${b.name}.`);return}
    const old=of.target;of.target=b.id;const why=canTake(of,b);if(why){of.target=old;toast(b.name+': '+why);return}acceptCast(of.id,[b.id],true);
    if(!S.offers.includes(of)){S.partners[of.partner]=(S.partners[of.partner]||0)+2;setRel(a,b,getRel(a,b)+5);MOOD(a,4);MOOD(b,5);addLog(`🤝 Nhờ tiền bối ${a.name} giới thiệu, ${b.name} nhận «${of.title}».`,'good')}return}
  case'intro':{if(!a||!e.cand)return;if(k!=='yes'){MOOD(a,-2);return}if(S.money<10e6){toast('Không đủ tiền');S.events.push(e);return}const c=e.cand;if(S.artists.some(x=>x.id===c.id))return;S.money-=10e6;book('hr',-10e6);c.batch=ensureCurBatch();c.xr={};S.artists.push(c);setRel(a,c,45);setTag(a,c,'friend');MOOD(a,5);addLog(`💌 ${c.name} được ${a.name} giới thiệu, ký hợp đồng TTS vào ${(S.batches.find(x=>x.id===c.batch)||{n:''}).n}.`,'gold');return}
  case'paask':if(!a)return;if(k==='yes')setTimeout(()=>paOpen(a.id),0);else MOOD(a,-3);return;
  case'hs':{if(!a)return;const m=e.m?S.managers.find(x=>x.id===e.m):null;if(k==='yes')restDo(a,e.n,'Giám đốc');
    else if(k==='mgr'&&m){if(Math.random()<mxP(m,'care',.45)){restDo(a,e.n,'QL '+m.name);mgrExp(m,.5)}else{if(a.hsF)a.hsF.st='kept';MOOD(a,-2);addLog(`📋 QL ${m.name} cân nhắc và giữ lịch hiện tại cho ${a.name} vì lịch trình đang quan trọng.`)}}
    else{if(a.hsF)a.hsF.st='kept';MOOD(a,-3);addLog(`⚠️ Giữ nguyên lịch của ${a.name} dù chuyên gia khuyên nghỉ thêm.`,'bad')}return}
  case'md':{const s=e.song;if(!s)return;if(k==='no'){addLog(`🎼 Bài «${s.t}» của GĐ Âm nhạc không được sử dụng.`);return}S.songs=S.songs||[];S.songs.unshift(s);if(S.songs.length>40)S.songs.length=40;
    if(k==='give'){s.for=e.k;const x=actByKey(e.k);addLog(`🎼 GĐ Âm nhạc giao bài «${s.t}» (hạng ${s.rv.g}) cho ${x?x.n.slice(2).trim():''}.`,'good');if(x&&actFree(x))setTimeout(()=>songRelease(s.id,e.k),0)}else addLog(`🎼 Lưu bài «${s.t}» của GĐ Âm nhạc vào kho.`);return}
  case'xcollab':{const x=extById(e.x);if(!a||!x)return;if(k!=='yes'){setXr(a,x,xRel(a,x)-8);return}if(a.busy)return toast('Đang bận');
    const g=Math.round(Math.min(x.fans,a.fans*3+20000)*rnd(.03,.08)),pay=R(10,40)*1e6;a.fans+=g;a.yr.fans+=g;S.money+=pay;book('job',pay,[a]);setXr(a,x,xRel(a,x)+15);a.busy={kind:'promo',title:'Hợp tác với '+x.name,left:1,total:1};a.hist.unshift(`N${S.year} T${S.week}: hợp tác với ${x.name} (${x.co})`);addLog(`🎙️ ${a.name} hợp tác với ${x.name} (${x.co}): +${fmtN(g)} fan, +${fmt(pay)}.`,'good');return}
  case'xrumor':{const x=extById(e.x);if(!a||!x)return;
    if(k==='deny'){if(Math.random()<.7){MOOD(a,-2);addLog(`📰 ${a.name} phủ nhận tin đồn với ${x.name}, dư luận lắng xuống.`)}else{a.fans=Math.round(a.fans*.97);addLog(`📰 Lời phủ nhận của ${a.name} bị nghi ngờ, fan giảm 3%.`,'bad')}}
    else if(k==='admit'){a.fans=Math.round(a.fans*.99);setXr(a,x,xRel(a,x)+10);MOOD(a,5);addLog(`📰 ${a.name} xác nhận chỉ là bạn thân với ${x.name}. Fan thông cảm.`)}
    else if(Math.random()<.5){a.fans=Math.round(a.fans*.96);addLog(`📰 ${a.name} im lặng trước tin đồn với ${x.name}, fan giảm 4%.`,'bad')}else addLog(`📰 Tin đồn ${a.name} & ${x.name} tự lắng xuống.`);return}
  case'amgr':{const m=S.managers.find(x=>x.id===e.m);if(!a||!m)return;if(k==='rest'){restDo(a,3,'QL '+m.name);MOOD(a,4)}else{MOOD(a,-6);mgrExp(m,.3);addLog(`📋 Giám đốc ủng hộ QL ${m.name}, ${a.name} không vui.`,'bad')}return}
  case'mmclash':{const x=S.managers.find(z=>z.id===e.m),y=S.managers.find(z=>z.id===e.m2);if(!x||!y)return;
    if(k==='meet'){if(S.money<5e6){toast('Không đủ tiền');S.events.push(e);return}S.money-=5e6;book('oth',-5e6);setMrel(x,y,mrel(x,y)+20);mgrExp(x,.3);mgrExp(y,.3);addLog(`🕊️ Buổi họp hòa giải giúp QL ${x.name} và ${y.name} hiểu nhau hơn.`,'good')}
    else if(k==='x'||k==='y'){const w=k==='x'?x:y,l=k==='x'?y:x;mgrExp(w,.6);setMrel(x,y,mrel(x,y)-15);addLog(`⚖️ Giám đốc đứng về phía QL ${w.name}; QL ${l.name} không phục.`)}
    else{setMrel(x,y,mrel(x,y)-10);addLog(`⚡ QL ${x.name} và ${y.name} tự giải quyết nhưng vẫn còn khúc mắc.`)}return}
  case'mmcoach':{const x=S.managers.find(z=>z.id===e.m),y=S.managers.find(z=>z.id===e.m2);if(!x||!y)return;if(k==='yes'&&canKid(x,y)){y.boss=x.id;setMrel(x,y,mrel(x,y)+10);addLog(`👔 QL ${x.name} nhận kèm cặp QL ${y.name}.`,'good')}else setMrel(x,y,mrel(x,y)-5);return}
  }}
/* ---- Hồ sơ nghệ sĩ & phòng ---- */
export function v3ArtistHTML(a){let h='';
  if(paOK(a))h+=`<div class="card small">🧑‍💻 <b>Trợ lý cá nhân:</b> ${a.pa?`${esc(a.pa.name)} · ${MSK[a.pa.k]} +${a.pa.v} · ${fmt(a.pa.sal)}/tuần`:'<span class="muted">chưa có</span>'} <button class="btn sm" onclick="paOpen(${a.id})">${a.pa?'Đổi trợ lý':'Để '+esc(a.name)+' tự chọn'}</button><br><span class="muted">Nghệ sĩ được quản lý theo nhóm có thể tự chọn trợ lý riêng.</span></div>`;
  if(a.hsF&&a.hsF.w>=abs()-3)h+=`<div class="card small">🩺 <b>Chuyên gia sức khỏe:</b> ${esc(a.hsF.why.join(', '))}. Đề xuất ${a.hsF.n} ngày nghỉ/tuần. ${a.restRec>abs()?'<span class="good">Đang áp dụng.</span>':`<button class="btn sm pri" onclick="hsApply(${a.id})">Áp dụng</button>`}</div>`;
  if(a.status==='trainee'&&a.dReady){const o=dOpts(a);if(o&&o.both){const w=dWish(a,o);h+=`<div class="card small wish">💬 <b>Mong muốn debut:</b> ${DRT[w.t]} — "${esc(w.why)}" <button class="btn sm pri" onclick="view(viewDebutQ)">Quyết định</button></div>`}}
  if(a.status==='debuted'&&menteesOf(a).length<2){const t=S.artists.filter(x=>x.status==='trainee'&&!x.mt&&x.tag[a.id]!=='enemy').sort((x,y)=>mentorScore(a,y)-mentorScore(a,x))[0];if(t&&mentorScore(a,t)>3)h+=`<div class="card small">🙋 <b>${esc(a.name)} đề xuất dẫn dắt:</b> ${esc(t.name)} (+${Math.round(mentorScore(a,t))}) <button class="btn sm" onclick="setMentor(${t.id},${a.id})">Đồng ý</button></div>`}
  const xs=Object.keys(a.xr||{}).map(id=>({x:extById(+id),v:a.xr[id]})).filter(z=>z.x).sort((p,q)=>q.v-p.v).slice(0,5);
  if(xs.length)h+=`<div class="card small">🌐 <b>Quan hệ ngoài công ty:</b> ${xs.map(z=>`${esc(z.x.name)} (${esc(z.x.co)}) ${relTxt(z.v)}`).join(' · ')}</div>`;
  return h}
