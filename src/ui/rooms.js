import { $, clamp, esc, fmt, fmtN } from '../core/util.js';
import { OFFER } from '../data/offers.js';
import { CONCEPTS, GENRES, MSK, MSKD, ROOMS, STATS, TRAIN, TRAIN_COST } from '../data/rules.js';
import { S, abs, byId } from '../state.js';
import { fame, fit } from '../systems/artists.js';
import { bMem, batchHTML, batchNameT, compHTML } from '../systems/batches.js';
import { DEBUT_COST, DEBUT_MIN, bestLineup, bestOf, debutAnalysis, recLine } from '../systems/debut.js';
import { evInfo, invBlock } from '../systems/events.js';
import { MAX_SA, asstOf, curSong, otherMgr, repCard, songCard, songOpts, songPrev } from '../systems/ext2.js';
import { dElig, dqBanner, eligSort, extById, hsHTML, mNameH, mgrBossHTML, relTxt } from '../systems/ext3.js';
import { inSub, mBoss, mCap, mKids, mgrOf, mgrTargets, targetNameT } from '../systems/managers.js';
import { BIZ, bizLv, bizOwn, bizVal, bizWait, modV, rivalPress, totalFans, trendB, trendTag, upCost } from '../systems/market.js';
import { canTake, effPay, offerOrder, slotsOf } from '../systems/offers.js';
import { PROMO_WK } from '../systems/promo.js';
import { getRel, groupsOf, harmony } from '../systems/relations.js';
import { actByKey, fanSugs } from '../systems/releases.js';
import { EV_ART, EV_PCT, EV_TTS, evNext, evalTable, prHTML, prPlans } from '../systems/review.js';
import { actFree, acts, conceptRec, secPlans, secSchedRec } from '../systems/secretary.js';
import { defaultDays, weekCost } from '../systems/week.js';
import { lbl, money, roomName, sv, t } from '../i18n/index.js';
import { NPC, act, chibiHTML, lastRoom, renderDock, setLastRoom } from './building.js';
import { curView, modal, setCurRC, setCurView } from './modal.js';
import { artistLine, bars, det, mgrBars, orgTree, schedSel, wTable } from './views.js';

export function openRoom(id){if(lastRoom!==id){setLastRoom(id);renderDock()}setCurRC(`var(--r-${id})`);setCurView(()=>RV[id]());curView()}
export function ttsSplit(arr,fn,key,empty,ttsBtn){const tt=arr.filter(a=>a.status==='trainee').sort(eligSort),ot=arr.filter(a=>a.status!=='trainee');
  const byB=(S.batches||[]).length>1?S.batches.map(b=>({b,l:tt.filter(a=>a.batch===b.id)})).filter(x=>x.l.length):null;
  return(ot.map(fn).join('')||(tt.length?'':`<div class="small muted">${empty}</div>`))+(tt.length?det(key,t('room.allTts',{n:tt.length}),(ttsBtn||'')+(byB?byB.map(x=>det(key+'-b'+x.b.id,`${batchNameT(x.b)} (${x.l.length})`,x.l.map(fn).join(''),true)).join(''):tt.map(fn).join('')),false):'')}
export function setSchedTTS(v){S.artists.filter(a=>a.status==='trainee'&&!a.busy).forEach(a=>{a.days=a.days.some(k=>k!=='rest')?a.days.map(k=>k==='rest'?'rest':v):defaultDays(v)});act()}
export function trainRoom(r,key,extra=''){
  const here=S.artists.filter(a=>!a.busy&&a.days.includes(key)),others=S.artists.filter(a=>!a.busy&&!a.days.includes(key));
  const tr=TRAIN[key];
  return`<h2>${r.ic} ${roomName(r.id)}</h2><div class="sub">${key==='rest'?t('train.subRest'):t('train.sub',{s:Object.keys(tr.g).map(k=>lbl('stat',k)).join(t('list.sep')),e:Math.abs(Math.round(tr.e*.3)),m:money(TRAIN_COST/5)})}</div>${extra}
  ${det('rm-'+key+'-in',t('train.here',{n:here.length}),ttsSplit(here,a=>artistLine(a,`<span class="small">${t('unit.days',{n:a.days.filter(k=>k===key).length})} · ${Object.keys(tr.g).map(k=>lbl('stat',k)+' '+Math.round(a.st[k])).join(' · ')}</span>`),'rm-'+key+'-in-t',t('train.empty'),''),true)}
  ${det('rm-'+key+'-out',t('train.moveIn',{n:others.length}),ttsSplit(others,a=>artistLine(a,`<button class="btn sm pri" onclick="setSched(${a.id},'${key}')">${t('train.move')}</button>`),'rm-'+key+'-out-t',t('train.noneFree'),`<button class="btn sm pri" onclick="setSchedTTS('${key}')">${t('train.moveAll')}</button>`),false)}`;
}
export const RV={
  mgr(){
    const taken=(t,id,m)=>S.managers.some(x=>x!==m&&x.as&&x.as.t===t&&x.as.id===id);
    const noMgr=S.artists.filter(a=>!mgrOf(a)&&!a.pm&&a.status!=='trainee'),tts=S.artists.filter(a=>a.status==='trainee'),ttsNo=tts.filter(a=>!mgrOf(a)),pmA=S.artists.filter(a=>a.pm);
    const PS=[t('mgr.ps0'),t('mgr.ps1'),t('mgr.ps2')];
    const card=m=>{const sum=`📋 ${mNameH(m)} <span class="tag v">${t('org.lv',{n:m.lv})}</span><span class="small muted" style="font-weight:500">${t('mgr.sum',{w:esc(targetNameT(m)),n:mgrTargets(m).length,ps:PS[m.ps]||'—',a:m.auto!=='off'?` · ${t('org.auto')}`:''})}</span>`;
      const body=`<div class="row"><div class="chibi mini">${chibiHTML(m)}</div><div class="small muted">${t('mgr.stats',{s:t('unit.perWeek',{m:money(m.salary)}),e:Math.floor(m.exp*10)/10,x:m.lv*4,k:mKids(m).length,c:mCap(m),b:mBoss(m)?`<br>${t('mgr.coach',{n:esc(mBoss(m).name)})}`:''})}</div></div>${mgrBars(m)}
      <div class="small" style="margin-top:6px">${t('mgr.asst',{n:asstOf(m).length,l:asstOf(m).map(x=>`${esc(x.name)} <span class="muted">${t('mgr.asstSk',{k:MSK[x.k]&&lbl('msk',x.k),v:x.v,s:money(x.sal)})}</span> <button class="btn sm" onclick="fireAsst(${x.id})">✕</button>`).join(' · ')||`<span class="muted">${t('mgr.asstNone')}</span>`})}</div>
      <div class="row" style="margin-top:8px"><span class="small">${t('mgr.reportTo')}</span><select onchange="setBoss(${m.id},this.value)" style="flex:1;min-width:150px"><option value="">${t('mgr.toCeo')}</option>${S.managers.filter(x=>x!==m).map(x=>`<option value="${x.id}" ${m.boss===x.id?'selected':''} ${inSub(m,x)||(m.boss!==x.id&&mKids(x).length>=mCap(x))?'disabled':''}>${t('mgr.bossOpt',{n:esc(x.name),l:x.lv,s:inSub(m,x)?t('mgr.subSfx'):''})}</option>`).join('')}</select></div>
      <div class="row" style="margin-top:8px"><span class="small">${t('mgr.charge')}</span><select onchange="assignMgr(${m.id},this.value)" style="flex:1;min-width:160px"><option value="">${t('mgr.unassigned')}</option>
      ${(()=>{const bs=(S.batches||[]).filter(b=>!taken('b',b.id,m));return bs.length?`<optgroup label="${t('mgr.grpBatch')}">${bs.map(b=>`<option value="b${b.id}" ${m.as&&m.as.t==='b'&&m.as.id===b.id?'selected':''}>🌱 ${batchNameT(b)} (${t('batch.nTts',{n:bMem(b).length})})</option>`).join('')}</optgroup>`:''})()}
      <optgroup label="${t('mgr.grpSolo')}"><option value="l0" ${m.as&&m.as.t==='l'?'selected':''}>${t('mgr.optList',{n:t('unit.people',{n:MAX_SA})})}</option></optgroup>
      ${(()=>{const gs=S.groups.filter(g=>!taken('g',g.id,m));return gs.length?`<optgroup label="${t('mgr.grpGroup')}">${gs.map(g=>`<option value="g${g.id}" ${m.as&&m.as.t==='g'&&m.as.id===g.id?'selected':''}>👥 ${esc(g.name)} (${g.members.length})${g.hiatus>abs()?' ⏸️':''}</option>`).join('')}</optgroup>`:''})()}
      ${(()=>{const as=S.artists.filter(a=>(!a.pm&&a.status!=='trainee'&&!otherMgr(a,m))||(m.as&&m.as.t==='a'&&m.as.id===a.id));return as.length?`<optgroup label="${t('mgr.grpOne')}">${as.map(a=>`<option value="a${a.id}" ${m.as&&m.as.t==='a'&&m.as.id===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</optgroup>`:''})()}</select></div>
      <div class="small muted">${t('mgr.onlyFree')}</div>
      ${m.as&&m.as.t==='l'?(()=>{const own=m.as.ids,inOther=a=>S.managers.find(x=>x!==m&&x.as&&x.as.t==='l'&&x.as.ids.includes(a.id)),row=a=>{const o=inOther(a);return`<label><input type="checkbox" ${own.includes(a.id)?'checked':''} ${o?'disabled':''} onchange="toggleMA(${m.id},${a.id},this.checked)"> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">${[a.solo?t('mgr.kindSolo'):'',a.actor?t('mgr.kindActor'):'',groupsOf(a).length?t('mgr.kindGroup'):'',a.status==='trainee'?t('mgr.kindTts'):''].filter(Boolean).join(' · ')}${o?t('mgr.belongs',{n:esc(o.name)}):''}</span></span></label>`};
        const vis=a=>own.includes(a.id)||(!inOther(a)&&!otherMgr(a,m));const main=S.artists.filter(a=>(a.solo||a.actor)&&!a.pm&&vis(a)),rest=S.artists.filter(a=>!a.solo&&!a.actor&&!a.pm&&a.status!=='trainee'&&vis(a));
        return`<div class="small" style="margin-top:6px">${t('mgr.picked',{a:own.length,m:MAX_SA})}</div><div class="list">${main.map(row).join('')||`<div class="small muted">${t('mgr.noSolo')}</div>`}</div>${rest.length?det('mg-lo-'+m.id,t('mgr.others',{n:rest.length}),`<div class="list">${rest.map(row).join('')}</div>`,false):''}`})():''}
      <div class="row" style="margin-top:6px"><span class="small">${t('mgr.psLbl')}</span><select onchange="setPs(${m.id},this.value)"><option value="0" ${m.ps===0?'selected':''}>${t('mgr.off')}</option><option value="2" ${m.ps===2?'selected':''}>${t('mgr.psOpt2')}</option><option value="1" ${m.ps===1?'selected':''}>${t('mgr.psOpt1')}</option></select></div>
      <div class="row" style="margin-top:6px"><span class="small">${t('mgr.autoLbl')}</span><select onchange="setAuto(${m.id},this.value)"><option value="off" ${m.auto==='off'?'selected':''}>${t('mgr.off')}</option><option value="short" ${m.auto==='short'?'selected':''}>${t('mgr.autoShort')}</option><option value="all" ${m.auto==='all'?'selected':''}>${t('mgr.autoAll')}</option></select><span class="sp"></span><button class="btn sm warn" onclick="fireMgr(${m.id},this)">${t('mgr.fire')}</button></div>`;
      return det('mg-'+m.id,sum,body,false)};
    modal(`<h2>📋 ${roomName('mgr')}</h2><div class="sub">${t('mgr.tap')}</div>
    <div class="row" style="margin-bottom:4px"><button class="btn pri" onclick="view(viewReport)" ${S.lastRep?'':'disabled'}>${t('mgr.lastRep')}</button><button class="btn" onclick="setPropNext(null);view(viewProps)">${t('mgr.propsNow')}</button></div>
    <label class="small row"><input type="checkbox" ${S.repOn!==false?'checked':''} onchange="S.repOn=this.checked;save()"> ${t('mgr.repOn')}</label>
    <label class="small row"><input type="checkbox" ${S.autoAppr!==false?'checked':''} onchange="S.autoAppr=this.checked;save()"> ${t('props.autoAppr')}</label>
    ${(()=>{const nb=(S.batches||[]).filter(b=>bMem(b).length&&!S.managers.some(m=>m.as&&m.as.t==='b'&&m.as.id===b.id));return nb.length?`<div class="card small">${t('mgr.batchNo',{l:nb.map(b=>batchNameT(b)).join(t('list.sep'))})}</div>`:''})()}
    ${det('mg-help',t('mgr.helpTitle'),`<div class="small">${Object.keys(MSK).map(k=>`<b>${lbl('msk',k)}:</b> ${lbl('mskd',k)}`).join('<br>')}${t('mgr.help',{m:MAX_SA})}</div>`,false)}
    ${mgrBossHTML()}
    ${det('mg-tree',t('mgr.tree'),`<div class="tree">${orgTree()}</div>`,true)}
    <div class="row" style="margin:12px 0 0"><h3 style="margin:0">${t('mgr.team',{n:S.managers.length})}</h3><span class="sp"></span>${S.managers.length?`<button class="btn sm" onclick="setAllD('mg-',false)">${t('sec.collapseAll')}</button><button class="btn sm" onclick="setAllD('mg-',true)">${t('sec.expandAll')}</button>`:''}</div>
    ${S.managers.length?[...new Set(S.managers.map(m=>m.lv))].sort((x,y)=>y-x).map(lv=>{const ms=S.managers.filter(m=>m.lv===lv);
      return det('mg-lv-'+lv,`${t('mgr.lvHead',{l:lv})} <span class="small muted" style="font-weight:500">${t('mgr.lvSub',{m:ms.length,a:ms.reduce((q,m)=>q+mgrTargets(m).length,0)})}</span>`,ms.map(card).join(''),true)}).join(''):`<div class="card small muted">${t('mgr.none')}</div>`}
    ${det('mg-free',t('mgr.freeTitle',{n:noMgr.length+(ttsNo.length?1:0)}),`<div class="small">${noMgr.map(a=>esc(a.name)).join(t('list.sep'))}${ttsNo.length?`${noMgr.length?'<br>':''}${t('mgr.freeTts',{n:ttsNo.length})}`:''}${!noMgr.length&&!ttsNo.length?`<span class="muted">${t('mgr.allHave')}</span>`:''}</div>${pmA.length?`<div class="small muted" style="margin-top:6px">${t('mgr.pmNote',{l:pmA.map(a=>esc(a.name)).join(t('list.sep'))})}</div>`:''}`,noMgr.length+ttsNo.length>0)}
    ${det('mg-pool',t('mgr.poolTitle',{n:S.mgrPool.length}),`<div class="small muted" style="margin-bottom:6px">${t('mgr.poolTip')}</div>${S.mgrPool.map(m=>`<div class="card"><div class="row"><div class="chibi mini">${chibiHTML(m)}</div><div><b>${esc(m.name)}</b><div class="small muted">${t('mgr.cand',{k:lbl('msk',m.spec),s:t('unit.perWeek',{m:money(m.salary)})})}</div></div><span class="sp"></span><button class="btn sm pri" onclick="hireMgr(${m.id})">${t('mgr.hire',{m:money(m.fee)})}</button></div>${mgrBars(m)}</div>`).join('')||`<div class="small muted">${t('mgr.poolNone')}</div>`}<button class="btn" onclick="rehuntMgr()">${t('mgr.rehunt',{m:money(15e6)})}</button>`,!S.managers.length)}`);
  },
  invest(){
    const own=S.biz,tot=own.reduce((t,b)=>t+Math.round(b.last*bizOwn(b)),0),fF=clamp(totalFans()/300000,0,2);
    modal(`<h2>📈 ${roomName('invest')}</h2><div class="sub">${t('invest.sub',{x:(1+fF).toFixed(2)})}</div>
    <div class="grid2"><div class="card">💼 ${t('invest.owning')}<br>${t('invest.owned',{n:own.length})}</div><div class="card">💵 ${t('invest.last')}<br><b class="${tot<0?'bad':'good'}">${money(tot)}</b></div></div>
    ${modV('econ')<1?`<div class="card small bad">📉 ${t('invest.recession')}</div>`:''}
    ${S.loan?`<div class="card small">💼 ${t('invest.loan',{n:esc(S.loan.n),p:t('unit.perWeek',{m:money(S.loan.pay)}),w:t('unit.weeks',{n:S.loan.left})})}</div>`:''}
    ${det('iv-own',`💼 ${t('invest.mine',{n:own.length})}`,own.map(b=>{const B=BIZ[b.k];return`<div class="card"><div class="row"><b>${B.ic} ${lbl('biz',b.k+'.n')}</b><span class="tag v">${t('invest.lv',{n:b.lv})}</span><span class="tag s">${t('invest.share',{p:Math.round(bizOwn(b)*100)})}</span><span class="sp"></span><span class="small ${b.last<0?'bad':'good'}">${b.last>=0?'+':''}${t('unit.perWeek',{m:money(bizOwn(b)<1?b.last*bizOwn(b):b.last)})}</span></div><div class="small muted">${t('invest.stats',{d:lbl('biz',b.k+'.d'),t:money(b.tot),i:money(b.inv),o:bizOwn(b)<1?t('invest.yours',{m:money(b.last)}):''})}</div><div class="row" style="margin-top:6px;flex-wrap:wrap"><span class="small">💼 ${t('invest.raise',{v:money(bizVal(b))})}</span><span class="sp"></span>${[.1,.2,.3].map(p=>`<button class="btn sm" ${Math.round((bizOwn(b)-p)*100)<51||bizWait(b)?'disabled':''} onclick="raiseBiz('${b.k}',${p})">${t('invest.sellPct',{p:p*100,m:money(bizVal(b)*p)})}</button>`).join('')}${bizOwn(b)<1?`<button class="btn sm pri" onclick="buybackBiz('${b.k}')">${t('invest.buyback',{m:money(bizVal(b)*(1-bizOwn(b))*1.15)})}</button>`:''}</div>${bizWait(b)?`<div class="small muted">${t('invest.cool',{w:t('unit.weeks',{n:bizWait(b)})})}</div>`:''}<div class="row" style="margin-top:6px">${b.lv<5?`<button class="btn sm pri" onclick="upBiz('${b.k}')">${t('invest.upgrade',{m:money(upCost(b))})}</button>`:`<span class="tag s">${t('invest.max')}</span>`}<span class="sp"></span><button class="btn sm warn" onclick="sellBiz('${b.k}',this)">${t('invest.sell',{m:money(b.inv*.6*bizOwn(b))})}</button></div></div>`}).join('')||`<div class="card small muted">${t('invest.none')}</div>`,true)}
    ${det('iv-shop',`🏪 ${t('invest.shop')}`,Object.keys(BIZ).filter(k=>!bizLv(k)).map(k=>{const B=BIZ[k],est=B.base*(1+B.syn*fF);return`<div class="prow"><b>${B.ic} ${lbl('biz',k+'.n')}</b><span class="small muted">${t('invest.est',{d:lbl('biz',k+'.d'),m:t('unit.perWeek',{m:money(est)}),v:B.vol>.6?t('invest.volatile'):''})}</span><span class="sp"></span><button class="btn sm pri" onclick="buyBiz('${k}')">${t('invest.open',{m:money(B.cost)})}</button></div>`}).join('')||`<div class="small muted">${t('invest.allOpen')}</div>`,true)}`);
  },
  market(){
    const me={n:t('market.me'),fans:totalFans(),me:1},list=S.rivals.concat([me]).sort((a,b)=>b.fans-a.fans),mx=list[0].fans||1;
    const ms=Object.values(S.mods||{}).filter(m=>m.until>abs());
    const free=acts().filter(actFree).map(x=>({x,r:conceptRec(x).find(c=>S.trend.hot.includes(c.k))})).sort((a,b)=>b.r.f-a.r.f).slice(0,4);
    modal(`<h2>📊 ${roomName('market')}</h2><div class="sub">${t('market.sub')}</div>
    <h3>🔥 ${t('market.hot')}</h3><div class="card"><div class="cfit">${Object.keys(CONCEPTS).map(k=>({k,v:S.trend.hot.includes(k)?95:S.trend.cold===k?15:50})).sort((a,b)=>b.v-a.v).map(r=>`<span class="${r.v>90?'best':''}">${lbl('concept',r.k)}${trendTag(r.k)}</span><div class="bar"><i style="width:${r.v}%"></i></div><b>${r.v>90?t('market.tagHot'):r.v<20?t('market.tagCold'):'·'}</b>`).join('')}</div>
    <div class="small muted">${t('market.left',{w:t('unit.weeks',{n:S.trend.until-abs()})})}</div>
    ${free.length?`<div class="small" style="margin-top:6px">${t('market.fit')}<br>${free.map(o=>`${esc(o.x.n)}: ${lbl('concept',o.r.k)} ${Math.round(o.r.f)}%`).join('<br>')}</div>`:''}</div>
    ${ms.length?`<h3>⚡ ${t('market.mods')}</h3><div class="card small">${ms.map(m=>t('market.modLeft',{n:esc(m.n),w:t('unit.weeks',{n:m.until-abs()})})).join('<br>')}</div>`:''}
    ${det('mk-rank',`⚔️ ${t('market.rank')}`,list.map((r,i)=>`<div class="card" style="${r.me?'border-color:var(--pink)':''}"><div class="row"><b>#${i+1} ${esc(r.n)}</b><span class="sp"></span>${t('market.fans',{n:fmtN(r.fans)})}</div><div class="bar" style="margin:4px 0"><i style="width:${r.fans/mx*100}%;${r.me?'background:var(--pink)':''}"></i></div>${r.me?'':`<div class="small muted">${t('market.year',{d:(r.fans>=r.f0?'+':'')+fmtN(r.fans-r.f0),s:r.stole?t('market.stole',{n:r.stole}):'',l:r.last?' · '+esc(r.last):'',c:r.cb&&r.cb.w>=abs()-1?t('market.cb'):''})}</div>`}</div>`).join(''),true)}
    <div class="small muted">${t('market.note')}</div>`);
  },
  roof(){modal(trainRoom(ROOMS.find(r=>r.id==='roof'),'rest',`<div class="small muted">${t('roof.tip')}</div>`))},
  ceo(){
    const wk=weekCost();
    const last=S.awards[S.awards.length-1];
    modal(`<h2>💼 ${roomName('ceo')}</h2><div class="sub">${t('ceo.sub')}</div>
    <div class="grid2"><div class="card">💰 ${t('ceo.fund')}<br><b>${money(S.money)}</b></div><div class="card">📉 ${t('ceo.wcost')}<br><b>${money(wk)}</b></div><div class="card">🏆 ${t('ceo.wins')}<br><b>${S.awards.reduce((s,e)=>s+e.res.filter(r=>r.ok).length,0)}</b></div><div class="card">📊 ${t('ceo.lastRank')}<br><b>${last?'#'+last.rank:'—'}</b></div></div>
    ${det('ceo-sched',`📅 ${t('ceo.sched',{a:S.artists.filter(a=>!a.busy).length,b:S.artists.filter(a=>a.busy).length})}`,`<div class="row" style="margin-bottom:8px"><span class="small">${t('ceo.applyAll')}</span><select onchange="setAll(this.value)"><option value="">${t('common.choose')}</option>${Object.keys(TRAIN).map(k=>`<option value="${k}">${lbl('train.n',k)}</option>`).join('')}</select></div>
    ${S.artists.length?ttsSplit(S.artists,a=>artistLine(a,a.busy?`<span class="tag">${t('common.outside')}</span>`:schedSel(a)),'ceo-tts','',''):`<div class="muted small">${t('ceo.noArtists',{r:roomName('lobby')})}</div>`}`,true)}
    ${det('ceo-grp',`👥 ${t('ceo.groups',{n:S.groups.length})}`,S.groups.map(g=>`<div class="card"><b>👥 ${esc(g.name)}</b> <span class="small muted">${t('ceo.grpInfo',{y:g.y,h:(harmony(g.members)>=0?'+':'')+harmony(g.members),m:esc((S.managers.find(m=>m.as&&m.as.t==='g'&&m.as.id===g.id)||{name:t('ceo.noMgr')}).name)})}</span><div class="small">${g.members.map(i=>byId(i)).filter(Boolean).map(a=>esc(a.name)).join(t('list.sep'))} · ${t('common.fans',{n:fmtN(g.members.reduce((s,i)=>s+(byId(i)?.fans||0),0))})}</div></div>`).join('')||`<div class="small muted">${t('ceo.noGroups')}</div>`,false)}
    ${det('ceo-par',`🤝 ${t('ceo.partners',{n:Object.keys(S.partners).length})}`,`<div class="small">${Object.keys(S.partners).sort((x,y)=>S.partners[y]-S.partners[x]).map(p=>`${esc(p)}: <b>${S.partners[p]}</b>`).join(' · ')||`<span class="muted">${t('ceo.parNone')}</span>`}</div>`,false)}
    ${det('ceo-eval',`📋 ${t('ceo.evalTitle',{w:t('unit.weeks',{n:evNext()})})}`,`<div class="small muted" style="margin-bottom:6px">${t('ceo.evalRule',{p:EV_PCT,t:EV_TTS,a:EV_ART})}</div>${evalTable(S.lastEval)}`,true)}
    ${det('ceo-aw',`🏆 ${t('ceo.awards',{n:S.awards.length})}`,S.awards.slice().reverse().map(e=>`<div class="card small"><b>${t('ceo.awYear',{y:e.y})}</b> · ${t('ceo.awRank',{r:e.rank})} · ${e.res.filter(r=>r.ok).map(r=>r.cat).join(t('list.sep'))||t('ceo.noAward')}</div>`).join('')||`<div class="small muted">${t('ceo.awNone')}</div>`,false)}
    <h3>${t('ceo.data')}</h3><div class="small muted" style="margin-bottom:6px">${t('ceo.dataTip')}</div><button class="btn pri" onclick="view(viewCode)">🔑 ${t('top.save')}</button> <button class="btn warn" onclick="resetGame(this)">${t('ceo.reset')}</button>`);
  },
  meet(){
    const now=abs();
    const avail=S.artists.filter(a=>!a.busy);
    modal(`<h2>📨 ${roomName('meet')}</h2><div class="sub">${t('meet.sub')}</div>
    ${S.events.length?`<button class="btn pink" onclick="view(viewEvents)">🔔 ${t('meet.events',{n:S.events.length})}</button>`:''}
    ${(()=>{const L=secPlans();if(!L.length)return'';const r=L.filter(p=>!p.wait&&!p.plan),pl=L.filter(p=>p.plan),sr=secSchedRec();return`<div class="card row"><div class="chibi mini">${chibiHTML(NPC[1])}</div><div class="small" style="flex:1"><b>${t('meet.secLbl')}</b> ${r.length?t('meet.secCb',{n:r.map(p=>esc(p.n.slice(2).trim())).join(t('list.sep')),c:lbl('concept',r[0].ck),tr:trendTag(r[0].ck)}):t('meet.secNoCb')}${sr.length?t('meet.secBook',{n:sr.map(p=>esc(p.n.slice(2).trim())).join(t('list.sep'))}):''}${pl.length?t('meet.secPlans',{n:pl.length}):''}${Object.values(S.camp).some(c=>c.ph==='post')?t('meet.secPromo',{n:Object.values(S.camp).filter(c=>c.ph==='post').length}):''}${fanSugs().length?t('meet.secFan',{n:fanSugs().length}):''}</div>${sr.length?`<button class="btn sm" onclick="cbSchedRec()">${t('meet.bookRec')}</button>`:''}<button class="btn sm pri" onclick="view(viewSec)">${t('meet.plan')}</button></div>`})()}
    ${(()=>{const offCard=of=>{const O=OFFER[of.type],tg=of.target?byId(of.target):null;
      const opts=avail.slice().sort((x,y)=>(canTake(of,x)?1:0)-(canTake(of,y)?1:0)||(y.id===of.target)-(x.id===of.target)).map(a=>{const why=canTake(of,a);return`<option value="${a.id}" ${why?'disabled':''}>${esc(a.name)} – ${why||t('meet.fitPay',{f:Math.round(fit(a,of.w)),m:money(effPay(of,a))})}</option>`}).join('');
      return`<div class="card ${tg?'tg':''}"><div class="row"><b>${O.ic} ${lbl('offer',of.type)}: «${esc(of.title)}»</b>${slotsOf(of)>1?` <span class="tag v">👥 ${t('unit.people',{n:slotsOf(of)})}</span>`:''}<span class="sp"></span><span class="small muted">${t('meet.exp',{n:of.exp-now})}</span></div>
      <div class="small">${t('meet.partner',{p:esc(of.partner),r:S.partners[of.partner]||0})}${of.genre?' · '+t('meet.genre',{g:lbl('genre',of.genre)}):''} · ${t('unit.weeks',{n:of.weeks})} · ${t('meet.basePay',{m:money(of.pay)})}${of.costar?' · '+t('meet.costar',{c:esc(of.costar)}):''}</div>
      ${tg?`<div class="small" style="color:var(--sun);font-weight:700">${t('meet.target',{n:esc(tg.name)})}${slotsOf(of)>1?' · '+t('meet.targetMore'):''}</div>`:''}
      <div class="req">${t('meet.req',{s:Object.keys(of.req).map(k=>`${lbl('stat',k)} ≥ ${of.req[k]}`).join(t('list.sep'))})}${of.fame?` · ${t('meet.fameReq',{n:of.fame})}`:''}${O.trainee?' · '+t('meet.traineeOk'):''}</div>
      ${slotsOf(of)>1?(()=>{const ok=avail.filter(a=>!canTake(of,a));return`<div class="small" style="margin-top:6px">${t('meet.slots',{n:t('unit.people',{n:slotsOf(of)})})}</div>
      <div class="list">${ok.map(a=>`<label><input type="checkbox" class="oc${of.id}" value="${a.id}" onchange="ocPrev(${of.id},this)" ${a.id===of.target?'checked':''}> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">${t('meet.fitPay',{f:Math.round(fit(a,of.w)),m:money(effPay(of,a))})}</span></span></label>`).join('')||`<div class="small muted">${t('meet.noEligible')}</div>`}</div>
      ${avail.length>ok.length?`<div class="small muted">${t('meet.notEligible',{n:avail.length-ok.length})}</div>`:''}
      <div class="row" style="margin-top:6px"><span class="small muted" id="ocp${of.id}">${t('meet.pickMax',{n:t('unit.people',{n:slotsOf(of)})})}</span><span class="sp"></span>${ok.length?`<button class="btn sm" onclick="ocPick(${of.id})">${t('meet.suggestCast')}</button><button class="btn sm pri" onclick="acceptSel(${of.id})">${t('meet.accept')}</button>`:''}</div>`})():`<div class="row" style="margin-top:6px"><select id="ofs${of.id}" style="flex:1;min-width:180px">${opts||`<option disabled>${t('meet.noFree')}</option>`}</select><button class="btn sm pri" onclick="acceptOffer(${of.id},+$('#ofs${of.id}').value)">${t('meet.accept')}</button></div>`}
      ${of.invest?`<div class="row" style="margin-top:6px"><span class="small">${t('meet.invest',{p:Math.round(of.invest.share*100),m:money(of.invest.budget)})}</span><span class="sp"></span><button class="btn sm" ${of.invested?'disabled':''} onclick="investOffer(${of.id})">${of.invested?t('meet.invested'):t('meet.coFund',{m:money(of.invest.budget*of.invest.share)})}</button></div>`:''}</div>`},tO=offerOrder(S.offers).filter(o=>OFFER[o.type].trainee),oO=offerOrder(S.offers).filter(o=>!OFFER[o.type].trainee),tgT=n=>{const k=n.filter(o=>byId(o.target)).length;return k?` · ${t('meet.tgCount',{n:k})}`:''},nt=S.artists.filter(a=>a.status==='trainee').length;
      return det('mt-tts',`${t('meet.ttsTitle',{n:tO.length})}${tgT(tO)}`,`<div class="small muted" style="margin-bottom:6px">${t('meet.ttsTip',{p:EV_PCT})}</div>`+(tO.map(offCard).join('')||`<div class="card muted">${t('meet.noTts')}</div>`),nt>0)
        +det('mt-off',`${t('meet.offTitle',{n:oO.length})}${tgT(oO)}`,oO.map(offCard).join('')||`<div class="card muted">${t('meet.noOff')}</div>`,true)})()}`);
  },
  studio(){
    const all=acts(),A=all.filter(actFree),busyN=all.length-A.length;
    const opt=A.map(x=>`<option value="${x.k}">${esc(x.n)}</option>`).join('');const hiat=S.groups.filter(g=>g.hiatus>abs());
    const rp=rivalPress(),cb=S.rivals.filter(r=>r.cb&&r.cb.w>=abs()-1);
    const recs=A.map(x=>{const r=conceptRec(x);const b=r[0],c=r[1];return`<div class="prow"><b>${esc(x.n)}</b><span class="small">⭐ ${lbl('concept',b.k)}${trendTag(b.k)} ${Math.round(b.f)}% <span class="muted">· ${lbl('concept',c.k)}${trendTag(c.k)} ${Math.round(c.f)}%</span></span><span class="sp"></span><button class="btn sm" onclick="view(()=>viewCamp('${x.k}'))">📣</button><button class="btn sm pri" onclick="studioPick('${x.k}','${b.k}')">${t('studio.pick')}</button></div>`}).join('');
    modal(trainRoom(ROOMS[2],'rap',`
    <div class="card small">${t('studio.trend',{h:S.trend.hot.map(k=>lbl('concept',k)).join(t('list.sep')),c:lbl('concept',S.trend.cold),w:t('unit.weeks',{n:S.trend.until-abs()})})}${cb.length?`<br>${t('studio.rivalCb',{l:cb.map(r=>esc(r.n)+' ('+lbl('concept',r.cb.ck)+')').join(t('list.sep')),p:rp})}`:''}</div>
    <button class="btn" onclick="view(viewSec)">${t('studio.secBtn')}</button>
    ${songCard()}
    ${(()=>{const L=Object.values(S.camp).filter(c=>c.ph==='post');return L.length?`<h3>${t('studio.promoting',{n:L.length})}</h3>${L.map(c=>`<div class="card row small"><b>${esc(c.n)}</b> «${esc(c.t)}» · #${c.rank} · 🏆${c.wins} · ${t('studio.promoWeek',{n:c.wn+1,m:PROMO_WK})}<span class="sp"></span><button class="btn sm pri" onclick="view(()=>viewCamp('${c.k}'))">${t('studio.stageSched')}</button></div>`).join('')}`:''})()}
    ${hiat.length?`<div class="card small">${t('studio.hiatus',{l:hiat.map(g=>t('studio.hiatusLeft',{n:esc(g.name),w:t('unit.weeks',{n:g.hiatus-abs()})})).join(t('list.sep'))})}</div>`:''}
    ${det('st-rec',t('studio.recTitle',{n:A.length}),(recs||`<div class="small muted">${t('studio.noFree')}</div>`)+(busyN?`<div class="small muted">${t('studio.hidden',{n:busyN})}</div>`:''),true)}
    <h3>${t('studio.single')}</h3>${A.length?`<div class="card"><div class="row"><select id="sAct">${opt}</select><select id="sCon">${Object.keys(CONCEPTS).map(k=>`<option value="${k}">${lbl('concept',k)}${trendTag(k)}</option>`).join('')}</select></div>
    <div class="row" style="margin-top:6px"><select id="sBud"><option value="30000000">${lbl('bud',30e6)} – ${money(30e6)}</option><option value="80000000" selected>${lbl('bud',80e6)} – ${money(80e6)}</option><option value="200000000">${lbl('bud',200e6)} – ${money(200e6)}</option></select><input type="text" id="sTitle" placeholder="${t('studio.titlePh')}" style="flex:1"></div>
    <div class="row" style="margin-top:6px"><select id="sSong" style="flex:1;min-width:0">${songOpts()}</select></div>
    <div class="small muted" id="sPrev" style="margin:6px 0"></div><button class="btn pink" onclick="releaseSingle()">${t('studio.release')}</button></div>`:`<div class="card small muted">${all.length?t('studio.allBusy'):t('studio.needDebut',{r:roomName('lobby')})}</div>`}
    ${det('st-tbl',t('studio.tblTitle'),`<div class="small muted">${t('studio.tblTip')}</div>${wTable(CONCEPTS,'concept')}`,false)}
    <h3>${t('studio.conTitle')}</h3>${A.length?`<div class="card"><div class="row"><select id="cAct">${opt}</select><button class="btn pri" onclick="holdConcert()">${t('fan.hold',{m:money(200e6)})}</button></div><div class="small muted">${t('studio.conTip')}</div></div>`:`<div class="small muted">${t('studio.nobodyFree')}</div>`}
    ${det('st-hist',t('studio.histTitle'),`<div class="small">${S.singles.slice(0,10).map(s=>t('studio.hist',{y:s.y,t:esc(s.title),a:esc(s.act.slice(2)),c:sv(s.concept),r:s.rank})).join('<br>')||`<span class="muted">${t('studio.noSingles')}</span>`}</div>`,false)}`));
    const up=()=>{const a=actByKey($('#sAct')?.value);if(!a)return;const m=a.m.map(byId).filter(Boolean),k=$('#sCon').value,w=CONCEPTS[k].w,tb=trendB(k);$('#sPrev').innerHTML=`${t('studio.prev',{f:Math.round(m.reduce((s,x)=>s+fit(x,w),0)/m.length),h:harmony(a.m)})}${tb?` · ${tb>0?t('studio.tHot',{n:tb}):t('studio.tCold',{n:tb})}`:''}${rp?` · ${t('studio.rival',{p:rp})}`:''}${songPrev(a)}`};
    const pre=()=>{const A2=actByKey($('#sAct').value);if(!A2)return;const s=curSong();$('#sCon').value=s?s.ck:conceptRec(A2)[0].k;up()};
    if($('#sAct')){$('#sAct').onchange=pre;$('#sCon').onchange=up;$('#sSong').onchange=()=>{const s=curSong();if(s){$('#sCon').value=s.ck;$('#sTitle').value=s.t}else $('#sTitle').value='';up()};pre()}
  },
  acting(){
    const cands=S.artists.filter(a=>a.status==='debuted'&&!a.busy);
    modal(trainRoom(ROOMS[3],'acting',`
    <h3>🎬 ${t('acting.makeTitle')}</h3><div class="card"><div class="row"><select id="fGen">${Object.keys(GENRES).map(k=>`<option value="${k}">${lbl('genre',k)}</option>`).join('')}</select><select id="fBud"><option value="300000000">${t('acting.bud.low')} – ${money(300e6)}</option><option value="800000000">${t('acting.bud.mid')} – ${money(800e6)}</option><option value="2000000000">${t('acting.bud.big')} – ${money(2e9)}</option></select></div>
    <input type="text" id="fTitle" placeholder="${t('acting.titlePh')}" style="width:100%;margin-top:6px">
    <div class="small" style="margin-top:6px">${t('acting.pickCast')}</div>
    <div class="list" id="fList">${cands.map(a=>`<label><input type="checkbox" class="fcast" value="${a.id}"> ${esc(a.name)} <span class="small muted" data-f="${a.id}"></span></label>`).join('')||`<div class="small muted">${t('acting.noFree')}</div>`}</div>
    <button class="btn pink" style="margin-top:6px" onclick="produceFilm()">${t('acting.shoot')}</button></div>
    <div class="small muted">${t('acting.coFundTip',{r:roomName('meet')})}</div>
    ${det('fl-tbl',`📋 ${t('acting.tblTitle')}`,wTable(GENRES,'genre'),false)}
    ${det('fl-list',`🎞️ ${t('acting.films',{n:S.films.length})}`,S.films.slice().reverse().map(f=>`<div class="card small"><b>«${esc(f.title)}»</b> ${lbl('genre',f.genre)} · ${f.own?t('acting.own'):t('acting.share',{p:Math.round(f.share*100)})} · ${t('acting.cost',{m:money(f.cost)})}<br>${f.done?`${t('acting.rev',{m:money(f.rev),x:f.mult})} · ${t('acting.income',{m:money(f.inc)})}`:sv(f.status)+(f.releaseAt?` · ${t('acting.releaseIn',{w:t('unit.weeks',{n:f.releaseAt-abs()})})}`:'')}${f.cast.length?' · '+t('acting.cast',{c:f.cast.map(byId).filter(Boolean).map(a=>esc(a.name)).join(t('list.sep'))}):''}</div>`).join('')||`<div class="small muted">${t('acting.noFilms')}</div>`,true)}`));
    const up=()=>{const w=GENRES[$('#fGen').value].w;document.querySelectorAll('[data-f]').forEach(el=>{const a=byId(+el.dataset.f);el.textContent=t('acting.fit',{f:Math.round(fit(a,w)),n:fame(a)})})};
    $('#fGen').onchange=up;up();
  },
  vocal(){modal(trainRoom(ROOMS[4],'vocal'))},
  dance(){modal(trainRoom(ROOMS[5],'dance'))},
  gym(){modal(trainRoom(ROOMS[6],'gym',hsHTML()))},
  pr(){
    const sc=S.artists.filter(a=>a.scandal);
    const pl=prPlans();
    modal(trainRoom(ROOMS[7],'variety',`${det('pr-plan',t('pr.planTitle',{n:pl.length}),prHTML(pl),true)}${det('pr-sc',t('pr.scTitle',{n:sc.length}),`${sc.map(a=>{const e=S.events.find(x=>x.kind==='scandal'&&x.a===a.id);return`<div class="card"><b>${esc(a.name)}</b>: ${t('pr.scLine',{t:esc(a.scandal.t),f:'🔥'.repeat(a.scandal.sev),w:t('unit.weeks',{n:a.scandal.left})})}<div class="small muted">${t('pr.scNote',{p:2*a.scandal.sev})}</div>${e?invBlock(a):''}${e?`<div class="row" style="margin-top:6px">${evInfo(e).o.map(o=>`<button class="btn sm" onclick="resolveEv(${e.id},'${o.k}')">${o.l}</button>`).join('')}</div>`:`<div class="small">${t('pr.silent')}</div>`}</div>`}).join('')||`<div class="card small muted">${t('pr.noSc')}</div>`}
    <div class="small muted">${t('pr.dateNote')}</div>`,sc.length>0)}${det('pr-hist',t('pr.histTitle',{n:(S.prHist||[]).length}),(S.prHist||[]).slice(0,20).map(h=>`<div class="small">${esc(h)}</div>`).join('')||`<div class="small muted">${t('pr.histNone')}</div>`,false)}`));
  },
  lobby(){
    const tr=S.artists.filter(a=>!a.busy);
    modal(`<h2>🌟 ${roomName('lobby')}</h2><div class="sub">${t('lobby.sub')}</div>${dqBanner()}
    ${det('lb-cast',t('lobby.castTitle',{n:S.pool.length}),`<div class="small muted" style="margin-bottom:6px">${t('lobby.castTip',{m:money(20e6)})}</div>${repCard()}
    ${S.pool.map(a=>`<div class="card"><div class="row"><div class="chibi mini">${chibiHTML(a)}</div><div><b>${esc(a.name)}</b> <span class="small muted">${t('lobby.cand',{g:a.g==='F'?t('lobby.f'):t('lobby.m'),a:a.age,s:lbl('stat',a.spec),x:a.talent})}</span></div><span class="sp"></span><button class="btn sm pri" onclick="sign(${a.id})">${t('lobby.sign')}</button></div>${bars(a)}</div>`).join('')||`<div class="small muted">${t('lobby.noCand')}</div>`}
    <button class="btn" onclick="recast()">${t('lobby.recast',{m:money(10e6)})}</button>`,true)}
    ${det('lb-batches',t('lobby.batches',{b:S.batches.length,n:S.artists.filter(a=>a.status==='trainee').length}),batchHTML(),true)}
    ${det('lb-comp',t('lobby.comps',{n:S.comps.length}),compHTML(),true)}
    ${(()=>{const ts=S.artists.filter(a=>a.status==='trainee'&&!a.busy).sort(eligSort);return ts.length?det('lb-rec',t('lobby.recTitle',{n:ts.length}),`<div class="small muted" style="margin-bottom:4px">${t('lobby.recTip',{m:DEBUT_MIN})}</div><div class="card">${ts.map(recLine).join('')}</div>`,false):''})()}
    <h3>🎊 Debut</h3><div class="card"><div class="row"><select id="dType"><option value="group">${t('lobby.type.group')}</option><option value="solo">${t('lobby.type.solo')}</option><option value="actor">${t('lobby.type.actor')}</option></select><input type="text" id="dName" placeholder="${t('lobby.groupName')}" style="flex:1"></div>
    <div id="dSug"></div><h3 style="margin-top:10px">${t('lobby.pickArt')}</h3><div class="list" id="dList"></div><div class="card" id="dAna" style="margin-top:10px;background:var(--bg)"></div><div class="small muted" id="dCost" style="margin:6px 0"></div><button class="btn pink" onclick="debut()">${t('lobby.debut')}</button></div>
    <div class="small muted">${t('lobby.foot')}</div>`);
    const up=()=>{const ty=$('#dType').value;$('#dName').style.display=ty==='group'?'':'none';
      let list=tr.filter(a=>ty==='group'?!groupsOf(a).length:ty==='solo'?!a.solo:!a.actor);
      const tbl=ty==='actor'?GENRES:CONCEPTS,bf=a=>bestOf(a,tbl)[0];
      if(ty!=='group')list.sort((x,y)=>bf(y).f-bf(x).f);list.sort((x,y)=>(dElig(y,ty)?1:0)-(dElig(x,ty)?1:0));
      let sug='';
      if(ty==='group'&&list.length>=2){
        const L=Object.keys(CONCEPTS).map(k=>({k,...bestLineup(list,CONCEPTS[k].w)})).sort((a,b)=>b.sc-a.sc);
        sug=`<h3 style="margin-top:8px">${t('lobby.lineupTitle')}</h3>${L.map((x,i)=>`<div class="lineup"><div style="flex:1;min-width:0"><b>${i===0?'⭐ ':''}${lbl('concept',x.k)}</b> · ${t('lobby.lineFit',{f:Math.round(x.f),h:(x.hm>=0?'+':'')+x.hm})}<br><span class="muted">${x.ids.map(id=>esc(byId(id).name)).join(', ')}</span></div><button class="btn sm${i===0?' pri':''}" onclick="applyLineup([${x.ids}])">${t('lobby.pick')}</button></div>`).join('')}`;
      }else if(ty!=='group'&&list.length)sug=`<div class="small muted" style="margin-top:8px">${t('lobby.sorted',{w:ty==='solo'?t('lobby.byConcept'):t('lobby.byGenre')})}</div>`;
      $('#dSug').innerHTML=sug;
      $('#dList').innerHTML=list.map((a,i)=>{const b=bf(a);return`<label><input type="${ty==='group'?'checkbox':'radio'}" name="dsel" class="dsel" value="${a.id}"> <span style="flex:1">${ty!=='group'&&i<3?'⭐ ':''}${dElig(a,ty)?`<span class="tag s">${t('lobby.elig')}</span> `:''}<b>${esc(a.name)}</b> <span class="small muted">${a.status==='trainee'?t('lobby.tts'):t('lobby.debuted')} · ${t('lobby.stats',{v:Math.round(a.st.vocal),n:Math.round(a.st.dance),r:Math.round(a.st.rap),d:Math.round(a.st.acting),s:Math.round(a.st.visual)})}<br>${t('lobby.bestFit',{l:lbl(ty==='actor'?'genre':'concept',b.k),f:Math.round(b.f)})}</span></span></label>`}).join('')||`<div class="small muted">${t('lobby.noneFit')}</div>`;
      const cnt=()=>{const n=document.querySelectorAll('.dsel:checked').length;$('#dCost').textContent=`${t('lobby.cost',{m:money(DEBUT_COST[ty](Math.max(n,ty==='group'?2:1)))})}${ty==='group'?' '+t('lobby.costGrp',{a:money(120e6),b:money(20e6)}):''}`;$('#dAna').innerHTML=debutAnalysis()};
      document.querySelectorAll('.dsel').forEach(x=>x.onchange=cnt);cnt()};
    $('#dType').onchange=up;up();
  },
  dorm(){
    const pairs=[];const seen=new Set();
    for(const a of S.artists)for(const id in a.tag){const k=[a.id,+id].sort().join('-');if(seen.has(k))continue;seen.add(k);const b=byId(+id);if(b)pairs.push({a,b,t:a.tag[id],v:getRel(a,b)})}
    modal(trainRoom(ROOMS[9],'rest',`${det('dm-rel',`💞 ${t('dorm.rel',{n:pairs.length})}`,`<div class="small muted" style="margin-bottom:6px">${t('dorm.relTip')}</div>${pairs.map(p=>`<div class="card small row"><b>${esc(p.a.name)} & ${esc(p.b.name)}</b><span class="sp"></span>${lbl('dormtag',p.t)} <span class="muted">(${p.v})</span></div>`).join('')||`<div class="card small muted">${t('dorm.relNone')}</div>`}`,true)}`));
    /* v3: giao lưu ngoài công ty + trợ lý cá nhân */
    const p=$('#sheet .panel');if(!p)return;
  const L=[];S.artists.forEach(a=>Object.keys(a.xr||{}).forEach(id=>{const x=extById(+id);if(x&&a.xr[id])L.push({a,x,v:a.xr[id]})}));L.sort((p,q)=>Math.abs(q.v)-Math.abs(p.v));
  const ml=S.artists.filter(a=>a.pa);
  p.insertAdjacentHTML('beforeend',det('dm-ext',`🌐 ${t('dorm.ext',{n:L.length})}`,`<div class="small muted" style="margin-bottom:6px">${t('dorm.extTip')}</div>${L.slice(0,15).map(z=>`<div class="card small row"><b>${esc(z.a.name)}</b> ↔ ${esc(z.x.name)} <span class="muted">(${esc(z.x.co)})</span><span class="sp"></span>${relTxt(z.v)}</div>`).join('')||`<div class="small muted">${t('dorm.extNone')}</div>`}`,false)+(ml.length?det('dm-pa',`🧑‍💻 ${t('dorm.pa',{n:ml.length})}`,ml.map(a=>`<div class="small">${esc(a.name)}: ${esc(a.pa.name)} · ${lbl('msk',a.pa.k)} +${a.pa.v}</div>`).join(''),false):''));
  }
};
