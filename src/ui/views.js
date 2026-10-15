import { R } from '../core/rng.js';
import { esc, fmt, fmtN } from '../core/util.js';
import { CONCEPTS, GENRES, MSK, STATS, TRAIN, TRAIN_COST } from '../data/rules.js';
import { save } from '../save/storage.js';
import { S, abs, byId } from '../state.js';
import { fame } from '../systems/artists.js';
import { DEBUT_MIN, bestOf, debutRec } from '../systems/debut.js';
import { evInfo, invBlock } from '../systems/events.js';
import { candBlock, dHold, menteesOf, mentorScore, mentorSel, renewBlock, wp } from '../systems/ext2.js';
import { mNameH, v3ArtistHTML } from '../systems/ext3.js';
import { gmCardHTML } from '../systems/gm.js';
import { gmOf, mBoss, mKids, mgrOf, mgrTargets, targetName } from '../systems/managers.js';
import { cbHold } from '../systems/offers.js';
import { propCount } from '../systems/proposals.js';
import { groupsOf } from '../systems/relations.js';
import { liveEst } from '../systems/releases.js';
import { EV_ART, EV_PCT, EV_TTS, evNext, evalBrief, stSum } from '../systems/review.js';
import { wkLabel } from '../systems/secretary.js';
import { DAYS, TIC, daysMini, mgrSchedules, trainDays } from '../systems/week.js';
import { blinkD, campKeyOf, chibiHTML } from './building.js';
import { closeM, modal } from './modal.js';
import { money, t, tx } from '../i18n/index.js';
import { conceptName, dayName, dayShort, genreName, mskName, relTagName, statName, trainName } from '../i18n/labels.js';

/* ================= COLLAPSIBLES ================= */
export function det(k,sum,body,def){S.ui=S.ui||{};const o=S.ui[k],op=o===undefined?def:o;return`<details class="cl" ${op?'open':''} ontoggle="togD('${k}',this.open)"><summary>${sum}</summary><div class="clb">${body}</div></details>`}
export function togD(k,v){S.ui=S.ui||{};if(S.ui[k]===v)return;S.ui[k]=v;save()}
export function setAllD(pre,v){S.ui=S.ui||{};document.querySelectorAll('details.cl').forEach(d=>{const m=(d.getAttribute('ontoggle')||'').match(/togD\('([^']+)'/);if(m&&m[1].startsWith(pre)){S.ui[m[1]]=v;d.open=v}});save()}
/* ================= VIEWS ================= */
export function bars(a){return`<div class="bars">${Object.keys(STATS).map(k=>`<span>${statName(k)}</span><div class="bar"><i style="width:${a.st[k]}%"></i></div><b>${Math.round(a.st[k])}</b>`).join('')}</div>`}
export function aTags(a){let h=a.status==='trainee'?`<span class="tag">${t('tag.trainee')}</span>`:'';groupsOf(a).forEach(g=>h+=`<span class="tag v">👥 ${esc(g.name)}</span>`);if(a.solo)h+=`<span class="tag p">${t('tag.solo')}</span>`;if(a.actor)h+=`<span class="tag m">${t('tag.actor')}</span>`;if(a.scandal)h+=`<span class="tag r">${t('tag.scandal')}</span>`;if(dHold(a))h+=`<span class="tag s">${t('tag.debutHold')}</span>`;if(a.mt&&byId(a.mt))h+=`<span class="tag v">👩‍🏫 ${esc(byId(a.mt).name)}</span>`;if(a.status==='debuted'&&a.ce&&a.ce-abs()<=8)h+=`<span class="tag r">${t('tag.contract',{n:a.ce-abs()})}</span>`;{const hd=cbHold(a);if(hd)h+=`<span class="tag p">${t('tag.cbHold',{w:wkLabel(hd.w)})}</span>`}if(a.pa)h+=`<span class="tag m">🧑‍💻 ${esc(a.pa.name)}</span>`;if(a.restRec>abs())h+=`<span class="tag">${t('tag.restMore')}</span>`;else if(a.hsF&&a.hsF.w>=abs()-3&&a.hsF.st!=='ok')h+=`<span class="tag r">${t('tag.needRest')}</span>`;return h}
export function schedSel(a){const m=mgrSchedules(a);return`<span class="dmini" title="${a.days.map((k,i)=>dayShort(i)+': '+trainName(k)).join(', ')}">${daysMini(a)}</span>`+(m?`<span class="tag v">${t('sched.mgr')}</span>`:`<button class="btn sm" onclick="startPlanOne(${a.id})">${t('btn.edit')}</button>`)}
export function wTable(obj,nm){const ks=Object.keys(STATS);return`<div class="tbl"><table><tr><th></th>${ks.map(k=>`<th>${statName(k)}</th>`).join('')}</tr>${Object.keys(obj).map(id=>{const c=obj[id];return`<tr><td><b>${nm(id)}</b></td>${ks.map(k=>{const v=c.w[k]||0;return`<td>${v?`<span class="hm" style="padding:1px 5px;background:rgba(242,85,127,${v*.75})">${Math.round(v*100)}%</span>`:'·'}</td>`}).join('')}</tr>`}).join('')}</table></div>`}
export function artistLine(a,right=''){return`<div class="card row"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">${a.busy?'🚶 '+esc(tx(a.busy.title)):daysMini(a)+' · '+t('art.today',{n:trainName(a.days[0])})} · ⚡${Math.round(a.energy)} · 🙂${Math.round(a.mood)}</span><span class="sp"></span>${right}</div>`}
export function viewArtist(id){
  const a=byId(id);if(!a)return closeM();
  const rels=Object.keys(a.rel).map(i=>({o:byId(+i),v:a.rel[i],t:a.tag[i]})).filter(x=>x.o).sort((x,y)=>Math.abs(y.v)-Math.abs(x.v)).slice(0,8);
  const pws=Object.keys(a.pw).map(p=>`${esc(p)} (${t('art.pw',{n:a.pw[p],r:S.partners[p]||0})})`);
  const cos=Object.keys(a.co).map(c=>`${esc(c)} ${a.co[c]}`);
  modal(`<div class="big"><div class="bigwrap"><div class="chibi big" style="${blinkD(a.id)}">${chibiHTML(a)}</div></div><div><h2>${esc(a.name)}</h2><div>${aTags(a)}</div><div class="small muted">${t('art.bio',{g:t(a.g==='F'?'lobby.female':'lobby.male'),a:a.age,s:statName(a.spec),x:a.talent})}</div></div></div>
  <div class="grid2" style="margin:10px 0"><div class="card">${t('art.fansCard',{n:fmtN(a.fans),f:fame(a)})}</div><div class="card">${t('art.energy',{e:Math.round(a.energy)})}<br>${t('art.mood',{c:a.mood<30?'bad':'',m:Math.round(a.mood)})}</div><div class="card">${t('art.salary',{s:money(a.salary)})}<br><span class="small muted">${a.busy?t('art.doing',{t:esc(tx(a.busy.title)),w:t('common.weeks',{n:a.busy.left})}):t('art.atCo')}</span></div></div>
  <div class="card small">${a.pm?t('art.pm',{n:esc(a.pm.name),sk:Object.keys(MSK).map(k=>mskName(k)+' '+a.pm.sk[k]).join(' · ')}):''}${t('art.mgrCo')} ${(()=>{const m=mgrOf(a);return m?`${mNameH(m)} (${t('mgr.lvLow',{n:m.lv})}) · ${Object.keys(MSK).map(k=>mskName(k)+' '+m.sk[k]).join(' · ')}`:`<span class="muted">${t('art.mgrNone')}</span>`})()}</div>
  ${a.scandal?`<div class="card tg">${t('art.scandal',{t:esc(tx(a.scandal.t)),s:a.scandal.sev,w:t('common.weeks',{n:a.scandal.left})})}</div>`:''}
  ${a.wantAct?`<div class="card">${t('art.wantAct',{a:a.wantAct,w:t('common.weeks',{n:a.wantAct-abs()})})}</div>`:''}
  ${(()=>{const r=debutRec(a);if(a.status==='trainee')return`<div class="card small">${t('art.debutDir')} ${r.t==='wait'?t('debut.notYet'):t(`debut.type.${r.t}`)} — ${esc(tx(r.why))}</div>`;
    const ex=[];if(!a.solo&&bestOf(a,CONCEPTS)[0].f>DEBUT_MIN)ex.push(t('art.exSolo',{c:conceptName(bestOf(a,CONCEPTS)[0].k)}));if(!a.actor&&bestOf(a,GENRES)[0].f>DEBUT_MIN)ex.push(t('art.exAct',{g:genreName(bestOf(a,GENRES)[0].k)}));
    return ex.length?`<div class="card small">${t('art.growth',{x:ex.join(t('art.or'))})}</div>`:''})()}
  ${a.status==='trainee'?`<div class="card small">${t('art.mentorH')} ${mentorSel(a)}<br><span class="muted">${t('art.mentorNote')}</span>${a.dReady?`<br>${t('art.ready')} ${a.noHold?t('art.holdOpen'):t('art.holdOn')} <button class="btn sm" onclick="toggleHold(${a.id})">${a.noHold?t('art.btnHold'):t('art.btnOpen')}</button>`:''}</div>`:`<div class="card small">${t('art.contract',{w:t('common.weeks',{n:a.ce?a.ce-abs():'?'})})}${a.ceNo?t('art.noRenew'):''}${t('art.earned',{e:money(a.earn||0)})} <button class="btn sm" onclick="view(()=>viewRenew(${a.id}))">${t('art.renewEval')}</button><br>${t('art.mentees',{n:menteesOf(a).length})} ${menteesOf(a).map(x=>`${esc(x.name)} <button class="btn sm" onclick="setMentor(${x.id},0)">✕</button>`).join(' ')||`<span class="muted">${t('art.noneYet')}</span>`}${menteesOf(a).length<2&&S.artists.some(x=>x.status==='trainee'&&!x.mt)?` <select onchange="if(this.value)setMentor(+this.value,${a.id})"><option value="">${t('art.takeTts')}</option>${S.artists.filter(x=>x.status==='trainee'&&!x.mt).sort((x,y)=>mentorScore(a,y)-mentorScore(a,x)).map(x=>`<option value="${x.id}">${esc(x.name)} (+${Math.round(mentorScore(a,x))})</option>`).join('')}</select>`:''}${a.cs?`<br>${t('art.songs',{n:a.cs,p:Math.round(wp(a))})}`:''}</div>`}
  <div class="card small">${t('art.eval')} ${a.evG?t('art.evPrev',{g:a.evG}):t('art.evNone')}${a.status==='trainee'?`${t('art.evFail',{c:(a.ttsFail||0)>=3?'bad':'',n:a.ttsFail||0,x:EV_TTS})}${a.ev?t('art.evProg',{p:((stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100).toFixed(1),x:EV_PCT}):''}`:t('art.evFail',{c:(a.evFail||0)>=7?'bad':'',n:a.evFail||0,x:EV_ART})}${t('art.evNext',{w:t('common.weeks',{n:evNext()})})}</div>
  ${v3ArtistHTML(a)}
  <h3>${t('art.stats')}</h3>${bars(a)}
  <h3>${t('art.sched')}</h3><div class="row">${schedSel(a)}${mgrSchedules(a)?`<span class="small muted">${t('art.mgrSched',{n:esc(mgrSchedules(a).name)})}</span>`:''}<span class="small muted">${t('art.trainInfo',{d:trainDays(a),c:money(trainDays(a)*TRAIN_COST/5)})}</span></div>
  ${det('ap-rel',t('art.relH'),`${rels.length?rels.map(r=>`<div class="small">${esc(r.o.name)}: <b class="${r.v<0?'bad':'good'}">${r.v}</b> ${r.t?relTagName(r.t):''}</div>`).join(''):`<div class="small muted">${t('art.none')}</div>`}`,false)}
  ${det('ap-par',t('art.parH'),`<div class="small">${pws.length?'🏢 '+pws.join(', '):`<span class="muted">${t('art.noPar')}</span>`}</div>${cos.length?`<div class="small">🎭 ${cos.join(', ')}</div>`:''}`,false)}
  ${det('ap-les',t('art.lessonsH'),`${a.lessons.length?a.lessons.map(l=>`<div class="card small"><b>${esc(tx(l.t))}</b> (${t('common.wkYear',{y:l.y})})<br>${esc(tx(l.l))} · <span class="good">${esc(tx(l.s))}</span>${l.b?` · <span class="good">🏅 ${esc(tx(l.b))}</span>`:''}</div>`).join(''):`<div class="small muted">${t('art.lessonsNone')}</div>`}`,false)}
  ${(()=>{const pg=a.pg||{},ks=Object.keys(STATS).filter(k=>pg[k]>0).sort((x,y)=>pg[y]-pg[x]),tot=ks.reduce((t,k)=>t+pg[k],0);return`<div class="card small"><b>${t('art.pgH',{n:tot.toFixed(1)})}</b><br>${ks.length?ks.map(k=>`${statName(k)} <span class="good">+${pg[k].toFixed(1)}</span>`).join(' · '):`<span class="muted">${t('art.pgNone')}</span>`}</div>`})()}
  ${det('ap-his',t('art.histH'),`<div class="small">${a.hist.slice(0,12).map(h=>esc(tx(h))).join('<br>')||`<span class="muted">${t('common.empty')}</span>`}</div>`,false)}
  <div class="row" style="margin-top:16px">${!a.busy?`<button class="btn" onclick="doLive([${a.id}])" ${a.lastLive===abs()?'disabled':''}>${t('art.live',{c:money(1e6),r:money(liveEst([a]))})}</button>`:''}${campKeyOf(a)?`<button class="btn pri" onclick="view(()=>viewCamp('${campKeyOf(a)}'))">${t('art.promoBtn')}</button>`:''}<span class="sp"></span><button class="btn warn" onclick="fire(${a.id},this)">${t('art.fireBtn')}</button></div>`);
}
export function viewEvents(){
  const list=S.events.map(e=>({e,i:evInfo(e)})).filter(x=>x.i);
  modal(`<h2>${t('rep.evH')}</h2><div class="sub">${t('rep.evSub')}</div>${list.length?list.map(({e,i})=>`<div class="card"><b>${i.ic} ${esc(i.t)}</b><div class="small muted" style="margin:4px 0 8px">${esc(i.d)}</div>${e.kind==='scandal'?invBlock(byId(e.a)):''}${e.kind==='renew'?renewBlock(byId(e.a),e.mul):''}${(e.kind==='mp'||e.kind==='v3')&&e.cand?candBlock(e.cand):''}<div class="row">${i.o.map(o=>`<button class="btn sm ${o.k==='yes'||o.k==='fix'||o.k==='talk'||o.k==='r1'?'pri':o.k==='end'||o.k==='split'?'warn':''}" onclick="resolveEv(${e.id},'${o.k}')">${o.l}</button>`).join('')}</div></div>`).join(''):`<div class="card muted">${t('rep.evNone')}</div>`}`);
}
export function viewSkipWarn(){
  modal(`<h2>${t('rep.skipH',{n:S.events.length})}</h2><div class="sub">${t('rep.skipSub')}</div><div class="row"><button class="btn pri" onclick="view(viewEvents)">${t('rep.skipNow')}</button><button class="btn" onclick="closeM();nextWeek(true)">${t('rep.skipGo')}</button></div>`);
}
export function viewAward(e){
  modal(`<div class="stage">🏆</div><h2 style="text-align:center">${t('rep.awardH',{y:e.y})}</h2><div class="sub" style="text-align:center">${t('rep.awardSub')}</div>
  ${e.res.length?e.res.map(r=>`<div class="card row"><b>${r.ok?'🥇':'—'} ${esc(tx(r.cat))}</b><span class="sp"></span><span class="small">${esc(r.names)} <span class="muted">(${esc(tx(r.note))})</span> ${r.ok?`<span class="tag s">${t('rep.won')}</span>`:`<span class="tag">${t('rep.nominated')}</span>`}</span></div>`).join(''):`<div class="card muted">${t('rep.awardNone')}</div>`}
  <h3>${t('rep.board')}</h3>${e.board.map((b,i)=>`<div class="card row" style="${b.me?'border-color:var(--pink)':''}"><b>#${i+1}</b> ${esc(tx(b.n))}<span class="sp"></span>${t('common.fanN',{n:fmtN(b.f)})}</div>`).join('')}
  <button class="btn pri" onclick="${S.repOn!==false&&S.lastRep?'view(viewReport)':'closeM()'}">${t('rep.continue')}</button>`);
}
export let repDay=0;
export function tnode(m){const ts=mgrTargets(m);return`<div class="tnode"><div class="chibi mini">${chibiHTML(m)}</div><div style="min-width:0">${mNameH(m)} <span class="tag v">${t('mgr.lv',{n:m.lv})}</span><div class="small muted">${m.as?t('mgr.inCharge',{n:esc(tx(targetName(m)))})+` (${ts.length})`:t('target.none')}${m.ps===1?t('mgr.psAuto'):m.ps===2?t('mgr.psSug'):''}${m.auto!=='off'?t('mgr.sumAuto'):''}</div></div></div>`}
export function orgTree(){
  const sub=m=>{const k=mKids(m);if(!k.length)return`<li>${tnode(m)}</li>`;const op=!(S.ui&&S.ui['ot-'+m.id]===false);
    return`<li><details class="tdet" ${op?'open':''} ontoggle="togD('ot-${m.id}',this.open)"><summary>${tnode(m)}<span class="tcnt">${t('mgr.tcnt',{a:teamOf(m).length,k:k.length})}</span></summary><ul>${k.map(sub).join('')}</ul></details></li>`};
  const top=S.managers.filter(m=>!mBoss(m));
  const free=S.artists.filter(a=>!mgrOf(a)&&!a.pm);
  return`<div class="tnode ceo"><span style="font-size:24px;padding:0 6px">👔</span><div><b>${t('mgr.ceo')}</b><div class="small muted">${t('mgr.nMgrs',{n:S.managers.length})}${gmOf()?t('mgr.treeGm'):''}${t('mgr.treeFree',{n:free.length})}</div></div></div>${top.length?`<ul>${top.map(sub).join('')}</ul>`:`<div class="small muted" style="margin:6px 0 0 20px">${t('mgr.noMgr')}</div>`}`;
}
export function artDayLine(a,d){
  const r=S.lastRep&&S.lastRep.a[a.id];
  if(!r)return`<div>${t('rep.newJoin',{n:esc(a.name)})}</div>`;
  if(r.b)return`<div>${t('rep.outside',{n:esc(a.name),b:esc(tx(r.b))})}</div>`;
  if(d===7){const g=r.d.reduce((s,x)=>s+x[1],0),tr=r.d.filter(x=>x[0]!=='rest').length,end=r.d[6];
    return`<div>${daysMini({days:r.d.map(x=>x[0])})} <b>${esc(a.name)}</b>: ${t('rep.weekLine',{d:tr,g:g.toFixed(1),e:end[2],m:end[3]})}${end[2]<30?` <span class="w">${t('rep.warnExh')}</span>`:''}</div>`}
  const [k,g,e,mo]=r.d[d];
  const warn=(e<30?` <span class="w">${t('rep.warnRest')}</span>`:'')+(mo<30?` <span class="w">${t('rep.warnMood')}</span>`:'');
  return`<div>${TIC[k]} <b>${esc(a.name)}</b>: ${trainName(k)}${g?` (+${g.toFixed(1)})`:''} · ⚡${e} · 🙂${mo}${warn}</div>`;
}
export function teamOf(m){let r=[...mgrTargets(m)];for(const k of mKids(m))r=r.concat(teamOf(k));return[...new Set(r)]}
export function warnCount(arts,d){if(!S.lastRep)return 0;return arts.filter(a=>{const r=S.lastRep.a[a.id];if(!r||!r.d)return false;const x=r.d[d===7?6:d];return x[2]<30||x[3]<30}).length}
export function briefOf(arts){const L=S.lastRep;let g=0,tr=0,fans=0;const warn=[],wn=[],done=[],out=[];
  for(const a of arts){const r=L.a[a.id];if(!r)continue;fans+=r.f||0;if(r.done)done.push(`${a.name} «${tx(r.done)}»`);
    if(r.d){g+=r.d.reduce((t,x)=>t+x[1],0);tr++;const e=r.d[6];if(e[2]<30){warn.push(`${a.name} ${t('rep.exh')}`);wn.push(a.name)}else if(e[3]<30){warn.push(`${a.name} ${t('rep.badMood')}`);wn.push(a.name)}}else if(!r.done)out.push(a.name)}
  return{g,tr,fans,warn,wn,done,out,dec:arts.reduce((t,a)=>t+((L.a[a.id]||{}).dec||0),0)}}
export function briefCard(title,arts,m){const b=briefOf(arts);
  let tip='';if(b.wn.length)tip=t('rep.tipRest',{n:b.wn.join(', ')});
  else{const x=arts.find(a=>a.status==='trainee'&&!a.busy&&debutRec(a).t!=='wait');if(x)tip=`${x.name} ${tx(debutRec(x).short)}`}
  const l1=`${t('common.people',{n:arts.length})} · 📈 +${(b.g/Math.max(b.tr,1)).toFixed(1)}${t('rep.perPerson')}${b.dec?t('rep.decline',{n:b.dec.toFixed(1)}):''} · 💗 ${b.fans>=0?'+':''}${fmtN(b.fans)}${b.out.length?t('rep.goneOut',{n:b.out.length}):''}`;
  return`<div class="card rep" style="margin:0 0 6px">${title}<div>${l1}</div><div>${b.warn.length?`<span class="w">⚠️ ${esc(b.warn.join(', '))}</span>`:t('rep.stable')}${b.done.length?t('rep.doneBy',{n:esc(b.done.join(', '))}):''}</div>${tip?`<div class="muted">💡 ${esc(tip)}</div>`:''}</div>`}
export function viewReport(){
  const L=S.lastRep;if(!L){modal(`<h2>${t('rep.emptyH')}</h2><div class="sub">${t('rep.emptySub')}</div>`);return}
  const dm=L.m1!=null?L.m1-L.m0:null,fans=Object.values(L.a).reduce((t,r)=>t+(r.f||0),0),dn=Object.values(L.a).filter(r=>r.done).length,wc=warnCount(S.artists,7);
  const lst=[],walk=(m,d)=>{lst.push([m,d]);mKids(m).forEach(k=>walk(k,d+1))};S.managers.filter(m=>!mBoss(m)).forEach(m=>walk(m,0));
  const free=S.artists.filter(a=>!mgrOf(a)&&!a.pm);
  const cards=lst.map(([m,d])=>{const ts=mgrTargets(m);if(!ts.length)return'';return`<div style="margin-left:${d*14}px">${briefCard(`📋 ${mNameH(m)} <span class="muted">· ${esc(tx(targetName(m)))}</span>`,ts,m)}</div>`}).join('');
  const pc=propCount();
  modal(`<h2>${t('rep.weekH',{w:L.w,y:L.y})}</h2>
  <div class="grid2" style="margin-bottom:8px"><div class="card small">💰 <b class="${dm<0?'bad':'good'}">${dm==null?'—':(dm>=0?'+':'')+money(dm)}</b></div><div class="card small">${t('rep.fans',{n:(fans>=0?'+':'')+fmtN(fans)})}</div><div class="card small">${t('rep.done',{n:dn})}</div><div class="card small">${t('rep.warns',{c:wc?'bad':'',n:wc})}</div>${L.biz?`<div class="card small">${t('rep.biz',{c:L.biz<0?'bad':'good',v:(L.biz>=0?'+':'')+money(L.biz)})}</div>`:''}</div>
  ${L.evl?evalBrief(S.lastEval):''}
  ${S.gmRep&&S.gmRep.w===abs()-1?gmCardHTML():''}
  ${cards}${free.length?briefCard(`<b>${t('rep.noMgrB')}</b>`,free):''}
  ${(()=>{const P=S.props&&S.props.w===abs()?S.props:null;if(!P)return'';const nb=Object.values(P.st.boss).reduce((a,b)=>a+b,0),pd=P.c.filter(c=>c.pend).length;return(nb||P.st.auto||P.st.res||pd)?`<div class="card small rep">${t('rep.appr')} ${nb?t('rep.byBoss',{n:nb}):''}${P.st.auto?t('rep.auto',{n:P.st.auto}):''}${P.st.res?t('rep.resolved',{n:P.st.res}):''}${pd?t('rep.pending',{n:pd}):''}</div>`:''})()}
  ${L.ev.length?`<h3>${t('rep.noteworthy')}</h3><div class="card rep">${L.ev.slice(0,5).map(x=>`<div>${esc(tx(x))}</div>`).join('')}${L.ev.length>5?`<div class="muted">${t('rep.moreEv',{n:L.ev.length-5})}</div>`:''}</div>`:''}
  <div class="row" style="margin-top:10px"><button class="btn" onclick="setRepDay(7);view(viewReportFull)">${t('rep.byDay')}</button>${pc?`<button class="btn" onclick="setPropNext(null);view(viewProps)">${t('rep.proposals',{n:pc})}</button>`:''}<span class="sp"></span><button class="btn pri" onclick="closeM()">${t('btn.close')}</button></div>`);
}
export function viewReportFull(){
  const R=S.lastRep;if(!R){modal(`<h2>${t('rep.emptyH')}</h2><div class="sub">${t('rep.emptySub')}</div>`);return}
  const d=repDay;
  const node=m=>{const ts=mgrTargets(m),kids=mKids(m),team=teamOf(m),wc=warnCount(team,d);
    return`<li><div class="card" style="margin:0"><div class="row"><div class="chibi mini" style="transform:scale(.72);margin:-8px 0 -8px 0">${chibiHTML(m)}</div><div>📋 ${mNameH(m)} <span class="small muted">${t('mgr.lvLow',{n:m.lv})}${mBoss(m)?t('rep.rptUp',{b:mNameH(mBoss(m))}):t('rep.rptCeo')}</span></div></div>
    <div class="rep" style="margin-top:4px">${ts.length?ts.map(a=>artDayLine(a,d)).join(''):`<div class="muted">${t('rep.noDirect')}</div>`}
    ${kids.length?`<div style="margin-top:4px">${t('rep.teamSum',{a:team.length,w:wc?t('rep.teamWarn',{n:wc}):t('rep.teamCalm')})}</div>`:''}</div></div>
    ${kids.length?`<ul>${kids.map(node).join('')}</ul>`:''}</li>`};
  const top=S.managers.filter(m=>!mBoss(m)),free=S.artists.filter(a=>!mgrOf(a)&&!a.pm);
  modal(`<h2>${t('rep.weekH',{w:R.w,y:R.y})}</h2><div class="sub">${d===7?t('rep.subWeek'):t('rep.subDay',{d:dayName(d)})}</div>
  <div class="tabs">${DAYS.map((x,i)=>`<button class="${i===d?'on':''}" onclick="setRepDay(${i});viewReportFull()">${dayShort(i)}</button>`).join('')}<button class="${d===7?'on':''}" onclick="setRepDay(7);viewReportFull()">${t('rep.allWeek')}</button></div>
  <div class="tree"><div class="tnode ceo"><span style="font-size:24px;padding:0 6px">👔</span><div><b>${t('rep.toCeo')}</b><div class="small muted">${t('rep.attn',{n:warnCount(S.artists,d),w:t(d===7?'rep.whenWeek':'rep.whenToday')})}</div></div></div>
  <ul>${top.map(node).join('')}${free.length?`<li><div class="card" style="margin:0"><b>${t('rep.direct')}</b><div class="rep" style="margin-top:4px">${free.map(a=>artDayLine(a,d)).join('')}</div></div></li>`:''}</ul></div>
  ${d===7&&R.ev.length?`<h3>${t('rep.weekEv')}</h3><div class="card rep">${R.ev.map(x=>`<div>${esc(tx(x))}</div>`).join('')}</div>`:''}
  <div class="row" style="margin-top:10px">${d>0?`<button class="btn" onclick="setRepDay(${d-1});viewReportFull()">${t('rep.prevDay')}</button>`:''}<span class="sp"></span>${d<7?`<button class="btn pri" onclick="setRepDay(${d+1});viewReportFull()">${d===6?t('rep.sumBtn'):t('rep.nextDay')}</button>`:`<button class="btn" onclick="view(viewReport)">${t('rep.brief')}</button><button class="btn pri" onclick="closeM()">${t('btn.close')}</button>`}</div>`);
}
export function mgrBars(m){return`<div class="bars">${Object.keys(MSK).map(k=>`<span>${mskName(k)}</span><div class="bar"><i style="width:${m.sk[k]*10}%"></i></div><b>${m.sk[k]}</b>`).join('')}</div>`}
export const setRepDay=v=>{repDay=v};
