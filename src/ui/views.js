import { R } from '../core/rng.js';
import { esc, fmt, fmtN } from '../core/util.js';
import { CONCEPTS, GENRES, MSK, STATS, TRAIN, TRAIN_COST } from '../data/rules.js';
import { lbl, t } from '../i18n/index.js';
import { save } from '../save/storage.js';
import { S, abs, byId } from '../state.js';
import { fame } from '../systems/artists.js';
import { DEBUT_MIN, DR, bestOf, debutRec } from '../systems/debut.js';
import { evInfo, invBlock } from '../systems/events.js';
import { candBlock, dHold, menteesOf, mentorScore, mentorSel, renewBlock, wp } from '../systems/ext2.js';
import { mNameH, v3ArtistHTML } from '../systems/ext3.js';
import { mBoss, mKids, mgrOf, mgrTargets, targetNameT } from '../systems/managers.js';
import { cbHold } from '../systems/offers.js';
import { propCount } from '../systems/proposals.js';
import { groupsOf } from '../systems/relations.js';
import { liveEst } from '../systems/releases.js';
import { EV_ART, EV_PCT, EV_TTS, evNext, evalBrief, stSum } from '../systems/review.js';
import { wkLabelT } from '../systems/secretary.js';
import { DAYN, DAYS, TIC, daysMini, mgrSchedules, trainDays } from '../systems/week.js';
import { blinkD, campKeyOf, chibiHTML } from './building.js';
import { closeM, modal } from './modal.js';

/* ================= THU GỌN ================= */
export function det(k,sum,body,def){S.ui=S.ui||{};const o=S.ui[k],op=o===undefined?def:o;return`<details class="cl" ${op?'open':''} ontoggle="togD('${k}',this.open)"><summary>${sum}</summary><div class="clb">${body}</div></details>`}
export function togD(k,v){S.ui=S.ui||{};if(S.ui[k]===v)return;S.ui[k]=v;save()}
export function setAllD(pre,v){S.ui=S.ui||{};document.querySelectorAll('details.cl').forEach(d=>{const m=(d.getAttribute('ontoggle')||'').match(/togD\('([^']+)'/);if(m&&m[1].startsWith(pre)){S.ui[m[1]]=v;d.open=v}});save()}
/* ================= VIEWS ================= */
export function bars(a){return`<div class="bars">${Object.keys(STATS).map(k=>`<span>${lbl('stat',k)}</span><div class="bar"><i style="width:${a.st[k]}%"></i></div><b>${Math.round(a.st[k])}</b>`).join('')}</div>`}
export function aTags(a){let h=a.status==='trainee'?`<span class="tag">${t('tag.trainee')}</span>`:'';groupsOf(a).forEach(g=>h+=`<span class="tag v">👥 ${esc(g.name)}</span>`);if(a.solo)h+='<span class="tag p">Solo</span>';if(a.actor)h+=`<span class="tag m">${t('tag.actor')}</span>`;if(a.scandal)h+='<span class="tag r">Scandal</span>';if(dHold(a))h+=`<span class="tag s">🎊 ${t('tag.debutHold')}</span>`;if(a.mt&&byId(a.mt))h+=`<span class="tag v">👩‍🏫 ${esc(byId(a.mt).name)}</span>`;if(a.status==='debuted'&&a.ce&&a.ce-abs()<=8)h+=`<span class="tag r">📄 ${t('tag.contract',{n:a.ce-abs()})}</span>`;{const hd=cbHold(a);if(hd)h+=`<span class="tag p">📅 ${t('tag.cbHold',{w:wkLabelT(hd.w)})}</span>`}if(a.pa)h+=`<span class="tag m">🧑‍💻 ${esc(a.pa.name)}</span>`;if(a.restRec>abs())h+=`<span class="tag">🛌 ${t('tag.extraRest')}</span>`;else if(a.hsF&&a.hsF.w>=abs()-3&&a.hsF.st!=='ok')h+=`<span class="tag r">🩺 ${t('tag.needRest')}</span>`;return h}
export function schedSel(a){const m=mgrSchedules(a);return`<span class="dmini" title="${a.days.map((k,i)=>lbl('day',i)+': '+lbl('train.n',k)).join(', ')}">${daysMini(a)}</span>`+(m?`<span class="tag v">📋 QL xếp</span>`:`<button class="btn sm" onclick="startPlanOne(${a.id})">Sửa</button>`)}
export function wTable(obj,ns){const ks=Object.keys(STATS);return`<div class="tbl"><table><tr><th></th>${ks.map(k=>`<th>${lbl('stat',k)}</th>`).join('')}</tr>${Object.keys(obj).map(i=>{const c=obj[i];return`<tr><td><b>${lbl(ns,i)}</b></td>${ks.map(k=>{const v=c.w[k]||0;return`<td>${v?`<span class="hm" style="padding:1px 5px;background:rgba(242,85,127,${v*.75})">${Math.round(v*100)}%</span>`:'·'}</td>`}).join('')}</tr>`}).join('')}</table></div>`}
export function artistLine(a,right=''){return`<div class="card row"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">${a.busy?'🚶 '+esc(a.busy.title):daysMini(a)+' · '+t('line.today',{k:lbl('train.n',a.days[0])})} · ⚡${Math.round(a.energy)} · 🙂${Math.round(a.mood)}</span><span class="sp"></span>${right}</div>`}
export function viewArtist(id){
  const a=byId(id);if(!a)return closeM();
  const rels=Object.keys(a.rel).map(i=>({o:byId(+i),v:a.rel[i],t:a.tag[i]})).filter(x=>x.o).sort((x,y)=>Math.abs(y.v)-Math.abs(x.v)).slice(0,8);
  const TN={friend:'🤝 Bạn thân',enemy:'⚡ Mâu thuẫn',dating:'💞 Hẹn hò (bí mật)',public:'💌 Hẹn hò (công khai)'};
  const pws=Object.keys(a.pw).map(p=>`${esc(p)} (${a.pw[p]} lần, quan hệ ${S.partners[p]||0})`);
  const cos=Object.keys(a.co).map(c=>`${esc(c)} ${a.co[c]}`);
  modal(`<div class="big"><div class="bigwrap"><div class="chibi big" style="${blinkD(a.id)}">${chibiHTML(a)}</div></div><div><h2>${esc(a.name)}</h2><div>${aTags(a)}</div><div class="small muted">${a.g==='F'?'Nữ':'Nam'}, ${a.age} tuổi · Năng khiếu: ${STATS[a.spec]} · Tố chất x${a.talent}</div></div></div>
  <div class="grid2" style="margin:10px 0"><div class="card">💗 <b>${fmtN(a.fans)}</b> fan<br><span class="small muted">Danh tiếng ${fame(a)}/100</span></div><div class="card">⚡ Năng lượng <b>${Math.round(a.energy)}</b><br>🙂 Tâm trạng <b class="${a.mood<30?'bad':''}">${Math.round(a.mood)}</b></div><div class="card">💵 Lương <b>${fmt(a.salary)}</b>/tuần<br><span class="small muted">${a.busy?'Đang: '+esc(a.busy.title)+` (${a.busy.left} tuần)`:'Ở công ty'}</span></div></div>
  <div class="card small">${a.pm?`🧑‍💼 Quản lý riêng (tự chọn khi tách solo): <b>${esc(a.pm.name)}</b> · ${Object.keys(MSK).map(k=>MSK[k]+' '+a.pm.sk[k]).join(' · ')} · tự xếp lịch, không thuộc Văn phòng Quản lý<br>`:''}📋 Quản lý công ty: ${(()=>{const m=mgrOf(a);return m?`<b>${esc(m.name)}</b> (cấp ${m.lv}) · ${Object.keys(MSK).map(k=>MSK[k]+' '+m.sk[k]).join(' · ')}`:'<span class="muted">Chưa có. Tuyển ở Văn phòng Quản lý (tầng 6).</span>'})()}</div>
  ${a.scandal?`<div class="card tg">🚨 <b>${esc(a.scandal.t)}</b> · mức ${a.scandal.sev} · còn ${a.scandal.left} tuần. Xử lý ở Phòng Truyền thông.</div>`:''}
  ${a.wantAct?`<div class="card">🎭 Đã hứa tìm vai trước tuần tuyệt đối ${a.wantAct} (còn ${a.wantAct-abs()} tuần).</div>`:''}
  ${(()=>{const r=debutRec(a);if(a.status==='trainee')return`<div class="card small">🎯 <b>Hướng debut:</b> ${r.t==='wait'?'chưa nên debut':DR[r.t]} — ${esc(r.why)}</div>`;
    const ex=[];if(!a.solo&&bestOf(a,CONCEPTS)[0].f>DEBUT_MIN)ex.push('ra thêm solo (concept '+CONCEPTS[bestOf(a,CONCEPTS)[0].k].n+')');if(!a.actor&&bestOf(a,GENRES)[0].f>DEBUT_MIN)ex.push('lấn sân diễn xuất (phim '+GENRES[bestOf(a,GENRES)[0].k].n+')');
    return ex.length?`<div class="card small">🎯 <b>Hướng phát triển:</b> có thể ${ex.join(' hoặc ')}.</div>`:''})()}
  ${a.status==='trainee'?`<div class="card small">👩‍🏫 <b>Tiền bối dẫn dắt:</b> ${mentorSel(a)}<br><span class="muted">Tập nhanh hơn ở kỹ năng tiền bối giỏi hơn (tối đa +40%).</span>${a.dReady?`<br>🎊 <b>Đủ điều kiện debut.</b> ${a.noHold?'Đang mở lịch nhận dự án.':'Đang chừa lịch, không nhận dự án ngoài.'} <button class="btn sm" onclick="toggleHold(${a.id})">${a.noHold?'Chừa lịch debut':'Mở lịch nhận dự án'}</button>`:''}</div>`:`<div class="card small">📄 <b>Hợp đồng:</b> còn ${a.ce?a.ce-abs():'?'} tuần${a.ceNo?' · <span class="bad">không tái ký</span>':''} · doanh thu mang về ${fmt(a.earn||0)} <button class="btn sm" onclick="view(()=>viewRenew(${a.id}))">Đánh giá tái ký</button><br>👩‍🏫 <b>Dẫn dắt TTS (${menteesOf(a).length}/2):</b> ${menteesOf(a).map(x=>`${esc(x.name)} <button class="btn sm" onclick="setMentor(${x.id},0)">✕</button>`).join(' ')||'<span class="muted">chưa có</span>'}${menteesOf(a).length<2&&S.artists.some(x=>x.status==='trainee'&&!x.mt)?` <select onchange="if(this.value)setMentor(+this.value,${a.id})"><option value="">+ Nhận TTS…</option>${S.artists.filter(x=>x.status==='trainee'&&!x.mt).sort((x,y)=>mentorScore(a,y)-mentorScore(a,x)).map(x=>`<option value="${x.id}">${esc(x.name)} (+${Math.round(mentorScore(a,x))})</option>`).join('')}</select>`:''}${a.cs?`<br>✍️ Đã sáng tác ${a.cs} bài · bút lực ${Math.round(wp(a))}`:''}</div>`}
  <div class="card small">📋 <b>Đánh giá định kỳ:</b> ${a.evG?`kỳ trước <b>${a.evG}</b>`:'chưa đánh giá'}${a.status==='trainee'?` · không đạt liên tiếp <b class="${(a.ttsFail||0)>=3?'bad':''}">${a.ttsFail||0}/${EV_TTS}</b>${a.ev?` · tiến bộ kỳ này ${((stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100).toFixed(1)}% (cần >${EV_PCT}%)`:''}`:` · không đạt liên tiếp <b class="${(a.evFail||0)>=7?'bad':''}">${a.evFail||0}/${EV_ART}</b>`} · kỳ tới sau ${evNext()} tuần</div>
  ${v3ArtistHTML(a)}
  <h3>Chỉ số</h3>${bars(a)}
  <h3>Lịch tập tuần</h3><div class="row">${schedSel(a)}${mgrSchedules(a)?`<span class="small muted">Quản lý ${esc(mgrSchedules(a).name)} đang xếp lịch</span>`:''}<span class="small muted">${trainDays(a)} ngày tập · chi phí ${fmt(trainDays(a)*TRAIN_COST/5)}/tuần</span></div>
  ${det('ap-rel','Quan hệ nội bộ',`${rels.length?rels.map(r=>`<div class="small">${esc(r.o.name)}: <b class="${r.v<0?'bad':'good'}">${r.v}</b> ${r.t?TN[r.t]:''}</div>`).join(''):'<div class="small muted">Chưa có.</div>'}`,false)}
  ${det('ap-par','Đối tác & bạn diễn',`<div class="small">${pws.length?'🏢 '+pws.join(', '):'<span class="muted">Chưa hợp tác.</span>'}</div>${cos.length?`<div class="small">🎭 ${cos.join(', ')}</div>`:''}`,false)}
  ${det('ap-les','Bài học rút ra',`${a.lessons.length?a.lessons.map(l=>`<div class="card small"><b>${esc(l.t)}</b> (N${l.y})<br>${esc(l.l)} · <span class="good">${l.s}</span></div>`).join(''):'<div class="small muted">Hoàn thành dự án để rút ra bài học.</div>'}`,false)}
  ${det('ap-his','Lịch sử',`<div class="small">${a.hist.slice(0,12).map(esc).join('<br>')||'<span class="muted">Trống.</span>'}</div>`,false)}
  <div class="row" style="margin-top:16px">${!a.busy?`<button class="btn" onclick="doLive([${a.id}])" ${a.lastLive===abs()?'disabled':''}>📱 Livestream (chi 1 tr, thu ~${fmt(liveEst([a]))})</button>`:''}${campKeyOf(a)?`<button class="btn pri" onclick="view(()=>viewCamp('${campKeyOf(a)}'))">📣 Lịch quảng bá</button>`:''}<span class="sp"></span><button class="btn warn" onclick="fire(${a.id},this)">Chấm dứt hợp đồng</button></div>`);
}
export function viewEvents(){
  const list=S.events.map(e=>({e,i:evInfo(e)})).filter(x=>x.i);
  modal(`<h2>🔔 Sự kiện</h2><div class="sub">Yêu cầu của nghệ sĩ, tình huống quản lý báo lên, đề xuất, hợp đồng, quan hệ nội bộ và scandal.</div>${list.length?list.map(({e,i})=>`<div class="card"><b>${i.ic} ${esc(i.t)}</b><div class="small muted" style="margin:4px 0 8px">${esc(i.d)}</div>${e.kind==='scandal'?invBlock(byId(e.a)):''}${e.kind==='renew'?renewBlock(byId(e.a),e.mul):''}${(e.kind==='mp'||e.kind==='v3')&&e.cand?candBlock(e.cand):''}<div class="row">${i.o.map(o=>`<button class="btn sm ${o.k==='yes'||o.k==='fix'||o.k==='talk'||o.k==='r1'?'pri':o.k==='end'||o.k==='split'?'warn':''}" onclick="resolveEv(${e.id},'${o.k}')">${o.l}</button>`).join('')}</div></div>`).join(''):'<div class="card muted">Không có sự kiện nào. Mọi thứ đang yên bình.</div>'}`);
}
export function viewSkipWarn(){
  modal(`<h2>Còn ${S.events.length} sự kiện chưa xử lý</h2><div class="sub">Nếu sang tuần, các sự kiện sẽ tự chọn phương án cuối (thường là bất lợi).</div><div class="row"><button class="btn pri" onclick="view(viewEvents)">Xử lý ngay</button><button class="btn" onclick="closeM();nextWeek(true)">Bỏ qua & sang tuần</button></div>`);
}
export function viewAward(e){
  modal(`<div class="stage">🏆</div><h2 style="text-align:center">Lễ trao giải năm ${e.y}</h2><div class="sub" style="text-align:center">Năm mới bắt đầu, trò chơi tiếp tục không giới hạn.</div>
  ${e.res.length?e.res.map(r=>`<div class="card row"><b>${r.ok?'🥇':'—'} ${r.cat}</b><span class="sp"></span><span class="small">${esc(r.names)} <span class="muted">(${r.note})</span> ${r.ok?'<span class="tag s">Thắng</span>':'<span class="tag">Đề cử</span>'}</span></div>`).join(''):'<div class="card muted">Năm nay công ty chưa có đề cử nào.</div>'}
  <h3>Xếp hạng công ty cuối năm</h3>${e.board.map((b,i)=>`<div class="card row" style="${b.me?'border-color:var(--pink)':''}"><b>#${i+1}</b> ${esc(b.n)}<span class="sp"></span>${fmtN(b.f)} fan</div>`).join('')}
  <button class="btn pri" onclick="${S.repOn!==false&&S.lastRep?'view(viewReport)':'closeM()'}">Tiếp tục</button>`);
}
export let repDay=0;
export function tnode(m){const ts=mgrTargets(m);return`<div class="tnode"><div class="chibi mini">${chibiHTML(m)}</div><div style="min-width:0">${mNameH(m)} <span class="tag v">${t('org.lv',{n:m.lv})}</span><div class="small muted">${m.as?t('org.charge',{who:esc(targetNameT(m)),n:ts.length}):t('mgr.tgt.none')}${m.ps===1?` · ${t('org.ps1')}`:m.ps===2?` · ${t('org.ps2')}`:''}${m.auto!=='off'?` · ${t('org.auto')}`:''}</div></div></div>`}
export function orgTree(){
  const sub=m=>{const k=mKids(m);if(!k.length)return`<li>${tnode(m)}</li>`;const op=!(S.ui&&S.ui['ot-'+m.id]===false);
    return`<li><details class="tdet" ${op?'open':''} ontoggle="togD('ot-${m.id}',this.open)"><summary>${tnode(m)}<span class="tcnt">${t('org.team',{n:teamOf(m).length,k:k.length})}</span></summary><ul>${k.map(sub).join('')}</ul></details></li>`};
  const top=S.managers.filter(m=>!mBoss(m));
  const free=S.artists.filter(a=>!mgrOf(a)&&!a.pm);
  return`<div class="tnode ceo"><span style="font-size:24px;padding:0 6px">👔</span><div><b>${t('org.ceo')}</b><div class="small muted">${t('org.ceoSub',{m:S.managers.length,a:free.length})}</div></div></div>${top.length?`<ul>${top.map(sub).join('')}</ul>`:`<div class="small muted" style="margin:6px 0 0 20px">${t('org.noMgr')}</div>`}`;
}
export function artDayLine(a,d){
  const r=S.lastRep&&S.lastRep.a[a.id];
  if(!r)return`<div>🆕 <b>${esc(a.name)}</b>: ${t('dayln.new')}</div>`;
  if(r.b)return`<div>🚶 <b>${esc(a.name)}</b>: ${t('dayln.out',{b:esc(r.b)})}</div>`;
  if(d===7){const g=r.d.reduce((s,x)=>s+x[1],0),tr=r.d.filter(x=>x[0]!=='rest').length,end=r.d[6];
    return`<div>${daysMini({days:r.d.map(x=>x[0])})} <b>${esc(a.name)}</b>: ${t('dayln.week',{tr,g:g.toFixed(1),e:end[2],m:end[3]})}${end[2]<30?` <span class="w">⚠️ ${t('dayln.exhausted')}</span>`:''}</div>`}
  const [k,g,e,mo]=r.d[d];
  const warn=(e<30?` <span class="w">⚠️ ${t('dayln.needRest')}</span>`:'')+(mo<30?` <span class="w">💢 ${t('dayln.badMood')}</span>`:'');
  return`<div>${TIC[k]} <b>${esc(a.name)}</b>: ${lbl('train.n',k)}${g?` (+${g.toFixed(1)})`:''} · ⚡${e} · 🙂${mo}${warn}</div>`;
}
export function teamOf(m){let r=[...mgrTargets(m)];for(const k of mKids(m))r=r.concat(teamOf(k));return[...new Set(r)]}
export function warnCount(arts,d){if(!S.lastRep)return 0;return arts.filter(a=>{const r=S.lastRep.a[a.id];if(!r||!r.d)return false;const x=r.d[d===7?6:d];return x[2]<30||x[3]<30}).length}
export function briefOf(arts){const L=S.lastRep;let g=0,tr=0,fans=0;const warn=[],wn=[],done=[],out=[];
  for(const a of arts){const r=L.a[a.id];if(!r)continue;fans+=r.f||0;if(r.done)done.push(`${a.name} «${r.done}»`);
    if(r.d){g+=r.d.reduce((t,x)=>t+x[1],0);tr++;const e=r.d[6];if(e[2]<30){warn.push(t('brief.exhausted',{n:a.name}));wn.push(a.name)}else if(e[3]<30){warn.push(t('brief.badMood',{n:a.name}));wn.push(a.name)}}else if(!r.done)out.push(a.name)}
  return{g,tr,fans,warn,wn,done,out,dec:arts.reduce((t,a)=>t+((L.a[a.id]||{}).dec||0),0)}}
export function briefCard(title,arts,m){const b=briefOf(arts);
  let tip='';if(b.wn.length)tip=t('brief.tipRest',{n:b.wn.join(t('list.sep'))});
  else{const t=arts.find(a=>a.status==='trainee'&&!a.busy&&debutRec(a).t!=='wait');if(t)tip=`${t.name} ${debutRec(t).short}`}
  const l1=`${t('brief.l1',{n:arts.length,g:(b.g/Math.max(b.tr,1)).toFixed(1)})}${b.dec?` · ${t('brief.dec',{d:b.dec.toFixed(1)})}`:''} · 💗 ${b.fans>=0?'+':''}${fmtN(b.fans)}${b.out.length?` · ${t('brief.out',{n:b.out.length})}`:''}`;
  return`<div class="card rep" style="margin:0 0 6px">${title}<div>${l1}</div><div>${b.warn.length?`<span class="w">⚠️ ${esc(b.warn.join(', '))}</span>`:`✅ ${t('brief.ok')}`}${b.done.length?` · 🎬 ${t('brief.done',{d:esc(b.done.join(', '))})}`:''}</div>${tip?`<div class="muted">💡 ${esc(tip)}</div>`:''}</div>`}
export function viewReport(){
  const L=S.lastRep;if(!L){modal('<h2>📑 Báo cáo</h2><div class="sub">Chưa có báo cáo. Hãy chơi qua một tuần.</div>');return}
  const dm=L.m1!=null?L.m1-L.m0:null,fans=Object.values(L.a).reduce((t,r)=>t+(r.f||0),0),dn=Object.values(L.a).filter(r=>r.done).length,wc=warnCount(S.artists,7);
  const lst=[],walk=(m,d)=>{lst.push([m,d]);mKids(m).forEach(k=>walk(k,d+1))};S.managers.filter(m=>!mBoss(m)).forEach(m=>walk(m,0));
  const free=S.artists.filter(a=>!mgrOf(a)&&!a.pm);
  const cards=lst.map(([m,d])=>{const ts=mgrTargets(m);if(!ts.length)return'';return`<div style="margin-left:${d*14}px">${briefCard(`<b>📋 ${esc(m.name)}</b> <span class="muted">· ${esc(targetNameT(m))}</span>`,ts,m)}</div>`}).join('');
  const pc=propCount();
  modal(`<h2>📑 Báo cáo tuần ${L.w} · Năm ${L.y}</h2>
  <div class="grid2" style="margin-bottom:8px"><div class="card small">💰 <b class="${dm<0?'bad':'good'}">${dm==null?'—':(dm>=0?'+':'')+fmt(dm)}</b></div><div class="card small">💗 <b>${fans>=0?'+':''}${fmtN(fans)}</b> fan</div><div class="card small">🎬 <b>${dn}</b> dự án xong</div><div class="card small">⚠️ <b class="${wc?'bad':''}">${wc}</b> cần chú ý</div>${L.biz?`<div class="card small">📈 Kinh doanh <b class="${L.biz<0?'bad':'good'}">${L.biz>=0?'+':''}${fmt(L.biz)}</b></div>`:''}</div>
  ${L.evl?evalBrief(S.lastEval):''}
  ${cards}${free.length?briefCard('<b>👔 Chưa có quản lý</b>',free):''}
  ${(()=>{const P=S.props&&S.props.w===abs()?S.props:null;if(!P)return'';const nb=Object.values(P.st.boss).reduce((a,b)=>a+b,0),pd=P.c.filter(c=>c.pend).length;return(nb||P.st.auto||P.st.res||pd)?`<div class="card small rep">📨 Duyệt tuần mới: ${nb?`cấp trên duyệt ${nb}`:''}${P.st.auto?` · tự duyệt ${P.st.auto}`:''}${P.st.res?` · ⚖️ ${P.st.res} xung đột đã xử lý`:''}${pd?` · <span class="w">⚠️ ${pd} xung đột chờ bạn</span>`:''}</div>`:''})()}
  ${L.ev.length?`<h3>Đáng chú ý</h3><div class="card rep">${L.ev.slice(0,5).map(t=>`<div>${esc(t)}</div>`).join('')}${L.ev.length>5?`<div class="muted">+${L.ev.length-5} sự kiện khác trong Nhật ký</div>`:''}</div>`:''}
  <div class="row" style="margin-top:10px"><button class="btn" onclick="setRepDay(7);view(viewReportFull)">Chi tiết theo ngày</button>${pc?`<button class="btn" onclick="setPropNext(null);view(viewProps)">📋 ${pc} đề xuất</button>`:''}<span class="sp"></span><button class="btn pri" onclick="closeM()">Đóng</button></div>`);
}
export function viewReportFull(){
  const R=S.lastRep;if(!R){modal('<h2>📑 Báo cáo</h2><div class="sub">Chưa có báo cáo. Hãy chơi qua một tuần.</div>');return}
  const d=repDay;
  const node=m=>{const ts=mgrTargets(m),kids=mKids(m),team=teamOf(m),wc=warnCount(team,d);
    return`<li><div class="card" style="margin:0"><div class="row"><div class="chibi mini" style="transform:scale(.72);margin:-8px 0 -8px 0">${chibiHTML(m)}</div><div><b>📋 ${esc(m.name)}</b> <span class="small muted">cấp ${m.lv}${mBoss(m)?' · báo cáo lên '+esc(mBoss(m).name):' · báo cáo Giám đốc'}</span></div></div>
    <div class="rep" style="margin-top:4px">${ts.length?ts.map(a=>artDayLine(a,d)).join(''):'<div class="muted">Không trực tiếp phụ trách nghệ sĩ nào.</div>'}
    ${kids.length?`<div style="margin-top:4px">👥 <b>Tóm tắt đội:</b> ${team.length} nghệ sĩ dưới quyền${wc?`, <span class="w">${wc} cần chú ý</span>`:', mọi người ổn định'}.</div>`:''}</div></div>
    ${kids.length?`<ul>${kids.map(node).join('')}</ul>`:''}</li>`};
  const top=S.managers.filter(m=>!mBoss(m)),free=S.artists.filter(a=>!mgrOf(a)&&!a.pm);
  modal(`<h2>📑 Báo cáo tuần ${R.w} · Năm ${R.y}</h2><div class="sub">${d===7?'Tổng kết cả tuần':'Báo cáo cuối ngày '+DAYN[d]} theo sơ đồ quản lý.</div>
  <div class="tabs">${DAYS.map((x,i)=>`<button class="${i===d?'on':''}" onclick="setRepDay(${i});viewReportFull()">${x}</button>`).join('')}<button class="${d===7?'on':''}" onclick="setRepDay(7);viewReportFull()">Cả tuần</button></div>
  <div class="tree"><div class="tnode ceo"><span style="font-size:24px;padding:0 6px">👔</span><div><b>Gửi Giám đốc</b><div class="small muted">${warnCount(S.artists,d)} nghệ sĩ cần chú ý ${d===7?'cuối tuần':'hôm nay'}</div></div></div>
  <ul>${top.map(node).join('')}${free.length?`<li><div class="card" style="margin:0"><b>👔 Báo cáo trực tiếp (chưa có quản lý)</b><div class="rep" style="margin-top:4px">${free.map(a=>artDayLine(a,d)).join('')}</div></div></li>`:''}</ul></div>
  ${d===7&&R.ev.length?`<h3>Sự kiện trong tuần</h3><div class="card rep">${R.ev.map(t=>`<div>${esc(t)}</div>`).join('')}</div>`:''}
  <div class="row" style="margin-top:10px">${d>0?`<button class="btn" onclick="setRepDay(${d-1});viewReportFull()">◀ Hôm trước</button>`:''}<span class="sp"></span>${d<7?`<button class="btn pri" onclick="setRepDay(${d+1});viewReportFull()">${d===6?'Tổng kết tuần ▶':'Hôm sau ▶'}</button>`:'<button class="btn" onclick="view(viewReport)">◀ Bản gọn</button><button class="btn pri" onclick="closeM()">Đóng</button>'}</div>`);
}
export function mgrBars(m){return`<div class="bars">${Object.keys(MSK).map(k=>`<span>${lbl('msk',k)}</span><div class="bar"><i style="width:${m.sk[k]*10}%"></i></div><b>${m.sk[k]}</b>`).join('')}</div>`}
export const setRepDay=v=>{repDay=v};
