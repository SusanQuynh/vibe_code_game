import { $, esc, fmt } from '../../core/util.js';
import { CONCEPTS, MSK, MSKD } from '../../data/rules.js';
import { S, abs, addLog, byId } from '../../state.js';
import { batchOf } from '../../systems/batches.js';
import { DEBUT_COST, DR, DRT, debutIds } from '../../systems/debut.js';
import { MOOD, gMgr, menteesOf, mentorScore } from '../../systems/ext2.js';
import { PA_WHY, canKid, dOpts, dWish, dqList, extById, gName, genHSC, genPAC, lvColor, mrel, paOK, paPick } from '../../systems/ext3.js';
import { mBoss, mCap, mKids, mgrOf, targetName } from '../../systems/managers.js';
import { trendTag } from '../../systems/market.js';
import { groupsOf } from '../../systems/relations.js';
import { act, chibiHTML } from '../building.js';
import { closeM, modal, setCurRC, toast } from '../modal.js';
import { det, teamOf } from '../views.js';

export function mNameH(m){return mBoss(m)?`<b style="color:${lvColor(m.lv)}">${esc(m.name)}</b>`:`<b>${esc(m.name)}</b>`}
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
export function viewPA(id){const a=byId(id);if(!a)return closeM();if(!a.paC)genPAC(a);setCurRC('var(--r-mgr)');const p=paPick(a),gm=groupsOf(a).map(g=>gMgr(g)).find(Boolean);
  const L=a.paC.slice().sort((x,y)=>(y===p)-(x===p));
  modal(`<h2>🧑‍💻 Trợ lý cá nhân · ${esc(a.name)}</h2><div class="sub">Nghệ sĩ được quản lý theo nhóm có thể tự chọn một trợ lý riêng. Kỹ năng trợ lý cộng thêm vào kỹ năng quản lý áp dụng riêng cho ${esc(a.name)}${gm?` (trên nền QL nhóm ${esc(gm.name)})`:''}.</div>
  ${a.pa?`<div class="card row"><span class="small" style="flex:1">Hiện tại: <b>${esc(a.pa.name)}</b> · ${MSK[a.pa.k]} +${a.pa.v} · ${fmt(a.pa.sal)}/tuần</span><button class="btn sm warn" onclick="paFire(${a.id})">Cho nghỉ</button></div>`:''}
  <div class="card row wish"><div class="chibi mini">${chibiHTML(a)}</div><div class="small" style="flex:1">💬 <b>${esc(a.name)}:</b> "${p?`Em muốn chọn ${esc(p.name)} vì em ${PA_WHY[p.k]}.`:'Em chưa thấy ai phù hợp.'}"</div></div>
  ${L.map(c=>`<div class="card"><div class="row"><b>${esc(c.name)}</b>${c===p?' <span class="tag s">💬 Nghệ sĩ tự chọn</span>':''}<span class="sp"></span><span class="tag v">${MSK[c.k]} +${c.v}</span></div><div class="small muted">${MSKD[c.k]} · Phí ${fmt(c.fee)} · lương ${fmt(c.sal)}/tuần</div><div class="row" style="margin-top:6px"><span class="sp"></span><button class="btn sm ${c===p?'pri':''}" onclick="paHire(${a.id},${c.id})">${c===p?'Đồng ý lựa chọn của '+esc(a.name):'Chọn người này thay'}</button></div></div>`).join('')}
  <div class="row"><button class="btn" onclick="paRe(${a.id})">🔄 Ứng viên khác (3 tr)</button><span class="sp"></span><button class="btn" onclick="view(()=>viewArtist(${a.id}))">← Hồ sơ</button></div>`)}
export function hsHTML(){const fl=S.artists.filter(a=>a.hsF&&a.hsF.w>=abs()-3).sort((x,y)=>(x.hsF.st==='ok')-(y.hsF.st==='ok')||y.hsF.why.length-x.hsF.why.length);
  let h=`<h3>🩺 Chuyên gia chăm sóc sức khỏe</h3>`;
  if(S.hs)h+=`<div class="card row"><div class="chibi mini">${chibiHTML(S.hs)}</div><div class="small" style="flex:1"><b>${esc(S.hs.name)}</b> · chuyên môn ${S.hs.sk}/5 · lương ${fmt(S.hs.sal)}/tuần<br><span class="muted">Mỗi tuần kiểm tra năng lượng, tâm trạng, lịch tập của nghệ sĩ và TTS. Ai cần nghỉ nhiều hơn sẽ được báo để quản lý cân nhắc. Chuyên môn cao phát hiện chính xác hơn.</span></div><button class="btn sm warn" onclick="hsFire(this)">Cho nghỉ</button></div>`;
  else{if(!S.hsC)genHSC();h+=`<div class="small muted" style="margin-bottom:6px">Chưa có chuyên gia. Chuyên gia sẽ phát hiện nghệ sĩ/TTS cần thêm lịch nghỉ và báo quản lý cân nhắc.</div>${S.hsC.map(c=>`<div class="card row"><div class="chibi mini">${chibiHTML(c)}</div><div class="small" style="flex:1"><b>${esc(c.name)}</b><br>Chuyên môn ${c.sk}/5 · lương ${fmt(c.sal)}/tuần</div><button class="btn sm pri" onclick="hsHire(${c.id})">Tuyển (${fmt(c.fee)})</button></div>`).join('')}`}
  h+=fl.length?`<div class="small" style="margin:6px 0 4px"><b>Cần thêm lịch nghỉ (${fl.length})</b></div>${fl.map(a=>{const m=mgrOf(a);return`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">${a.status==='trainee'?'TTS · ':''}${esc(a.hsF.why.join(', '))} · đề xuất ${a.hsF.n} ngày nghỉ${m?' · QL '+esc(m.name):''}</span><span class="sp"></span>${a.hsF.st==='ok'?'<span class="tag m">✓ đã cho nghỉ</span>':`<button class="btn sm pri" onclick="hsApply(${a.id})">Áp dụng</button>`}</div>`}).join('')}`:(S.hs?'<div class="small muted">Chưa phát hiện ai cần nghỉ thêm.</div>':'');
  return h}
export function dqBanner(){const L=dqList();return L.length?`<div class="card tg row"><span class="small" style="flex:1">🎊 <b>${L.length} TTS đủ điều kiện debut tuần này:</b> ${L.map(a=>esc(a.name)).join(', ')}</span><button class="btn sm pri" onclick="view(viewDebutQ)">Quyết định</button></div>`:''}
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
/* ---- Hồ sơ nghệ sĩ & phòng ---- */
export function v3ArtistHTML(a){let h='';
  if(paOK(a))h+=`<div class="card small">🧑‍💻 <b>Trợ lý cá nhân:</b> ${a.pa?`${esc(a.pa.name)} · ${MSK[a.pa.k]} +${a.pa.v} · ${fmt(a.pa.sal)}/tuần`:'<span class="muted">chưa có</span>'} <button class="btn sm" onclick="paOpen(${a.id})">${a.pa?'Đổi trợ lý':'Để '+esc(a.name)+' tự chọn'}</button><br><span class="muted">Nghệ sĩ được quản lý theo nhóm có thể tự chọn trợ lý riêng.</span></div>`;
  if(a.hsF&&a.hsF.w>=abs()-3)h+=`<div class="card small">🩺 <b>Chuyên gia sức khỏe:</b> ${esc(a.hsF.why.join(', '))}. Đề xuất ${a.hsF.n} ngày nghỉ/tuần. ${a.restRec>abs()?'<span class="good">Đang áp dụng.</span>':`<button class="btn sm pri" onclick="hsApply(${a.id})">Áp dụng</button>`}</div>`;
  if(a.status==='trainee'&&a.dReady){const o=dOpts(a);if(o&&o.both){const w=dWish(a,o);h+=`<div class="card small wish">💬 <b>Mong muốn debut:</b> ${DRT[w.t]} — "${esc(w.why)}" <button class="btn sm pri" onclick="view(viewDebutQ)">Quyết định</button></div>`}}
  if(a.status==='debuted'&&menteesOf(a).length<2){const t=S.artists.filter(x=>x.status==='trainee'&&!x.mt&&x.tag[a.id]!=='enemy').sort((x,y)=>mentorScore(a,y)-mentorScore(a,x))[0];if(t&&mentorScore(a,t)>3)h+=`<div class="card small">🙋 <b>${esc(a.name)} đề xuất dẫn dắt:</b> ${esc(t.name)} (+${Math.round(mentorScore(a,t))}) <button class="btn sm" onclick="setMentor(${t.id},${a.id})">Đồng ý</button></div>`}
  const xs=Object.keys(a.xr||{}).map(id=>({x:extById(+id),v:a.xr[id]})).filter(z=>z.x).sort((p,q)=>q.v-p.v).slice(0,5);
  if(xs.length)h+=`<div class="card small">🌐 <b>Quan hệ ngoài công ty:</b> ${xs.map(z=>`${esc(z.x.name)} (${esc(z.x.co)}) ${relTxt(z.v)}`).join(' · ')}</div>`;
  return h}
