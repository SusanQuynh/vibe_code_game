import { $, clamp, esc, fmt, fmtN } from '../core/util.js';
import { OFFER } from '../data/offers.js';
import { CONCEPTS, GENRES, MDOM, MSK, MSKD, ROOMS, STATS, TRAIN, TRAIN_COST } from '../data/rules.js';
import { S, abs, byId } from '../state.js';
import { fame, fit } from '../systems/artists.js';
import { bMem, batchHTML } from '../systems/batches.js';
import { compHTML, kindOf } from '../systems/contests.js';
import { DEBUT_COST, DEBUT_MIN, bestLineup, bestOf, debutAnalysis, recLine } from '../systems/debut.js';
import { evInfo, invBlock } from '../systems/events.js';
import { MAX_SA, asstOf, curSong, otherMgr, repCard, songCard, songOpts, songPrev } from '../systems/ext2.js';
import { dElig, dqBanner, eligSort, extById, hsHTML, mNameH, mgrBossHTML, relTxt } from '../systems/ext3.js';
import { gmCardHTML, gmFee } from '../systems/gm.js';
import { artDom, domOfAs, gmOf, inSub, mBoss, mCap, mKids, mgrOf, mgrTargets, retrain, targetName } from '../systems/managers.js';
import { BIZ, bizLv, bizOwn, bizVal, bizWait, modV, rivalPress, totalFans, trendB, trendTag, upCost } from '../systems/market.js';
import { canTake, effPay, offerOrder, slotsOf } from '../systems/offers.js';
import { est, recEye, recHTML } from '../systems/recruit.js';
import { PROMO_WK } from '../systems/promo.js';
import { getRel, groupsOf, harmony } from '../systems/relations.js';
import { actByKey, fanSugs } from '../systems/releases.js';
import { EV_ART, EV_PCT, EV_TTS, evNext, evalTable, prHTML, prPlans } from '../systems/review.js';
import { actFree, acts, conceptRec, secPlans, secSchedRec } from '../systems/secretary.js';
import { defaultDays, weekCost } from '../systems/week.js';
import { money, roomName, t } from '../i18n/index.js';
import { conceptName, domName, genreName, mskDesc, mskName, statName } from '../i18n/labels.js';
import { NPC, act, chibiHTML, lastRoom, renderDock, setLastRoom } from './building.js';
import { curView, modal, setCurRC, setCurView } from './modal.js';
import { artistLine, bars, det, mgrBars, orgTree, schedSel, wTable } from './views.js';

export function openRoom(id){if(lastRoom!==id){setLastRoom(id);renderDock()}setCurRC(`var(--r-${id})`);setCurView(()=>RV[id]());curView()}
export function ttsSplit(arr,fn,key,empty,ttsBtn){const tt=arr.filter(a=>a.status==='trainee').sort(eligSort),ot=arr.filter(a=>a.status!=='trainee');
  const byB=(S.batches||[]).length>1?S.batches.map(b=>({b,l:tt.filter(a=>a.batch===b.id)})).filter(x=>x.l.length):null;
  return(ot.map(fn).join('')||(tt.length?'':`<div class="small muted">${empty}</div>`))+(tt.length?det(key,t('tts.all',{n:tt.length}),(ttsBtn||'')+(byB?byB.map(x=>det(key+'-b'+x.b.id,`${esc(x.b.n)} (${x.l.length})`,x.l.map(fn).join(''),true)).join(''):tt.map(fn).join('')),false):'')}
export function setSchedTTS(v){S.artists.filter(a=>a.status==='trainee'&&!a.busy).forEach(a=>{a.days=a.days.some(k=>k!=='rest')?a.days.map(k=>k==='rest'?'rest':v):defaultDays(v)});act()}
export function trainRoom(r,key,extra=''){
  const here=S.artists.filter(a=>!a.busy&&a.days.includes(key)),others=S.artists.filter(a=>!a.busy&&!a.days.includes(key));
  const T=TRAIN[key];
  return`<h2>${r.ic} ${roomName(r.id)}</h2><div class="sub">${key==='rest'?t('train.restSub'):t('train.sub',{stats:Object.keys(T.g).map(k=>statName(k)).join(', '),e:Math.abs(Math.round(T.e*.3)),cost:money(TRAIN_COST/5)})}</div>${extra}
  ${det('rm-'+key+'-in',t('room.here',{n:here.length}),ttsSplit(here,a=>artistLine(a,`<span class="small">${t('train.days',{n:a.days.filter(k=>k===key).length})} · ${Object.keys(T.g).map(k=>statName(k)+' '+Math.round(a.st[k])).join(' · ')}</span>`),'rm-'+key+'-in-t',t('common.empty'),''),true)}
  ${det('rm-'+key+'-out',t('room.moveIn',{n:others.length}),ttsSplit(others,a=>artistLine(a,`<button class="btn sm pri" onclick="setSched(${a.id},'${key}')">${t('room.moveBtn')}</button>`),'rm-'+key+'-out-t',t('room.noneFree'),`<button class="btn sm pri" onclick="setSchedTTS('${key}')">${t('room.moveAllTts')}</button>`),false)}`;
}
export const RV={
  mgr(){
    const taken=(t,id,m)=>S.managers.some(x=>x!==m&&x.as&&x.as.t===t&&x.as.id===id);
    const dm=(m,t,id)=>!m.dom||domOfAs(t)===m.dom||(m.as&&m.as.t===t&&m.as.id===id);
    const noMgr=S.artists.filter(a=>!mgrOf(a)&&!a.pm&&a.status!=='trainee'),tts=S.artists.filter(a=>a.status==='trainee'),ttsNo=tts.filter(a=>!mgrOf(a)),pmA=S.artists.filter(a=>a.pm);
    const PS=[t('mgr.ps.0'),t('mgr.ps.1'),t('mgr.ps.2')];
    const G=gmOf();
    const card=m=>{const sum=`📋 ${mNameH(m)} <span class="tag v">${t('mgr.lv',{n:m.lv})}</span>${m.dom?`<span class="tag">${domName(m.dom)}</span>`:''}<span class="small muted" style="font-weight:500">${esc(targetName(m,t))} (${mgrTargets(m).length})${t('mgr.sumPs',{p:PS[m.ps]||'—'})}${m.auto!=='off'?t('mgr.sumAuto'):''}</span>`;
      const bodyN=`<div class="row"><div class="chibi mini">${chibiHTML(m)}</div><div class="small muted">${t('mgr.pay',{s:money(m.salary),e:Math.floor(m.exp*10)/10,x:m.lv*4})}${t('mgr.subs',{k:mKids(m).length,c:mCap(m)})}${mBoss(m)?t('mgr.coached',{b:mNameH(mBoss(m))}):''}${G&&!m.gm&&mBoss(m)!==G&&inSub(G,m)?t('mgr.gmHelped',{g:mNameH(G)}):''}</div></div>${mgrBars(m)}
      <div class="small" style="margin-top:6px">🧑‍💻 ${t('mgr.asst',{n:asstOf(m).length})} ${asstOf(m).map(x=>`${esc(x.name)} <span class="muted">${t('mgr.asstSk',{k:mskName(x.k),v:x.v,s:money(x.sal)})}</span> <button class="btn sm" onclick="fireAsst(${x.id})">✕</button>`).join(' · ')||`<span class="muted">${t('mgr.asstNone')}</span>`}</div>
      <div class="row" style="margin-top:8px"><span class="small">${t('mgr.reportsTo')}</span><select onchange="setBoss(${m.id},this.value)" style="flex:1;min-width:150px"><option value="" ${!m.boss||(G&&m.boss===G.id)?'selected':''}>${G?t('mgr.gmOpt',{n:esc(G.name)}):t('mgr.ceoOpt')}</option>${S.managers.filter(x=>x!==m&&!x.gm).map(x=>`<option value="${x.id}" ${m.boss===x.id?'selected':''} ${inSub(m,x)||(m.boss!==x.id&&mKids(x).length>=mCap(x))?'disabled':''}>📋 ${esc(x.name)} (${t('mgr.lvLow',{n:x.lv})})${inSub(m,x)?t('mgr.subSuffix'):''}</option>`).join('')}</select></div>
      <div class="row" style="margin-top:8px"><span class="small">${t('mgr.assignTo')}</span><select onchange="assignMgr(${m.id},this.value)" style="flex:1;min-width:160px" ${retrain(m)?'disabled':''}><option value="">${t('mgr.unassigned')}</option>
      ${(()=>{const bs=(S.batches||[]).filter(b=>!taken('b',b.id,m)&&dm(m,'b',b.id));return bs.length?`<optgroup label="${t('mgr.og.batch')}">${bs.map(b=>`<option value="b${b.id}" ${m.as&&m.as.t==='b'&&m.as.id===b.id?'selected':''}>${t('mgr.batchOpt',{n:esc(b.n),c:t('common.trainees',{n:bMem(b).length})})}</option>`).join('')}</optgroup>`:''})()}
      <optgroup label="${t('mgr.og.solo')}"><option value="l0" ${m.as&&m.as.t==='l'?'selected':''}>${t('mgr.listOpt',{x:MAX_SA})}</option></optgroup>
      ${(()=>{const gs=S.groups.filter(g=>!taken('g',g.id,m)&&dm(m,'g',g.id));return gs.length?`<optgroup label="${t('mgr.og.group')}">${gs.map(g=>`<option value="g${g.id}" ${m.as&&m.as.t==='g'&&m.as.id===g.id?'selected':''}>👥 ${esc(g.name)} (${g.members.length})${g.hiatus>abs()?' ⏸️':''}</option>`).join('')}</optgroup>`:''})()}
      ${(()=>{const as=S.artists.filter(a=>(!a.pm&&a.status!=='trainee'&&!otherMgr(a,m)&&(!m.dom||artDom(a,m.dom)))||(m.as&&m.as.t==='a'&&m.as.id===a.id));return as.length?`<optgroup label="${t('mgr.og.artist')}">${as.map(a=>`<option value="a${a.id}" ${m.as&&m.as.t==='a'&&m.as.id===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</optgroup>`:''})()}</select></div>
      <div class="small muted">${m.dom?t('mgr.onlyDom',{d:domName(m.dom)}):t('mgr.onlyAny')}</div>${retrain(m)?`<div class="small">${t('mgr.retraining',{w:t('common.weeks',{n:retrain(m)})})}</div>`:''}
      <div class="row" style="margin-top:6px"><span class="small">${t('mgr.chgDom')}</span><select id="dm${m.id}" style="flex:1;min-width:120px">${Object.keys(MDOM).filter(k=>k!==m.dom).map(k=>`<option value="${k}">${domName(k)}</option>`).join('')}</select><button class="btn sm" onclick="setDom(${m.id},document.getElementById('dm${m.id}').value)">${t('mgr.retrainBtn',{f:money(10e6+2e6*m.lv)})}</button></div>
      ${m.as&&m.as.t==='l'?(()=>{const own=m.as.ids,inOther=a=>S.managers.find(x=>x!==m&&x.as&&x.as.t==='l'&&x.as.ids.includes(a.id)),row=a=>{const o=inOther(a);return`<label><input type="checkbox" ${own.includes(a.id)?'checked':''} ${o?'disabled':''} onchange="toggleMA(${m.id},${a.id},this.checked)"> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">${[a.solo?t('mgr.tagSolo'):'',a.actor?t('mgr.tagActor'):'',groupsOf(a).length?t('mgr.tagGroup'):'',a.status==='trainee'?t('mgr.tagTts'):''].filter(Boolean).join(' · ')}${o?t('mgr.ownedBy',{m:mNameH(o)}):''}</span></span></label>`};
        const vis=a=>own.includes(a.id)||(!inOther(a)&&!otherMgr(a,m)&&(!m.dom||artDom(a,m.dom)));const main=S.artists.filter(a=>(a.solo||a.actor)&&!a.pm&&vis(a)),rest=S.artists.filter(a=>!a.solo&&!a.actor&&!a.pm&&(a.status!=='trainee'||m.dom==='trainee')&&vis(a));
        return`<div class="small" style="margin-top:6px">${t('mgr.picked',{o:own.length,x:MAX_SA})}</div><div class="list">${main.map(row).join('')||`<div class="small muted">${t('mgr.noneLeft')}</div>`}</div>${rest.length?det('mg-lo-'+m.id,t('mgr.others',{n:rest.length}),`<div class="list">${rest.map(row).join('')}</div>`,false):''}`})():''}
      <div class="row" style="margin-top:6px"><span class="small">${t('mgr.psLabel')}</span><select onchange="setPs(${m.id},this.value)"><option value="0" ${m.ps===0?'selected':''}>${t('mgr.psOpt.0')}</option><option value="2" ${m.ps===2?'selected':''}>${t('mgr.psOpt.2')}</option><option value="1" ${m.ps===1?'selected':''}>${t('mgr.psOpt.1')}</option></select></div>
      <div class="row" style="margin-top:6px"><span class="small">${t('mgr.autoLabel')}</span><select onchange="setAuto(${m.id},this.value)"><option value="off" ${m.auto==='off'?'selected':''}>${t('mgr.psOpt.0')}</option><option value="short" ${m.auto==='short'?'selected':''}>${t('mgr.autoShort')}</option><option value="all" ${m.auto==='all'?'selected':''}>${t('mgr.autoAll')}</option></select><span class="sp"></span><button class="btn sm warn" onclick="fireMgr(${m.id},this)">${t('mgr.fire')}</button></div>`;
      const body=m.gm?`<div class="row"><div class="chibi mini">${chibiHTML(m)}</div><div class="small muted">${t('mgr.pay',{s:money(m.salary),e:Math.floor(m.exp*10)/10,x:m.lv*4})}${t('mgr.gmDirect',{k:mKids(m).length})}</div></div>${mgrBars(m)}<div class="row" style="margin-top:6px"><span class="sp"></span><button class="btn sm" onclick="demoteGM(this)">${t('mgr.demote')}</button><button class="btn sm warn" onclick="fireMgr(${m.id},this)">${t('mgr.fire')}</button></div>`:bodyN;
      return det('mg-'+m.id,sum,body,false)};
    const gmBox=()=>{const others=S.managers.filter(x=>!x.gm);
      return`<div class="card"><b>${t('mgr.gmTitle')}</b>${G?` ${mNameH(G)} <span class="tag v">${t('mgr.lv',{n:G.lv})}</span>`:''}<div class="small muted" style="margin:4px 0">${t('mgr.gmDesc')}${G?'':t('mgr.gmDescNo')}</div>
      ${G?gmCardHTML()||`<div class="small muted">${t('mgr.gmNoRep')}</div>`:''}
      <div class="row">${others.length?`<select id="gmSel" style="flex:1;min-width:150px">${others.map(x=>`<option value="${x.id}">${esc(x.name)} (${t('mgr.lvLow',{n:x.lv})}, ${money(gmFee(x))})</option>`).join('')}</select><button class="btn sm pri" onclick="promoteGM(+document.getElementById('gmSel').value)">${G?t('mgr.gmChange'):t('mgr.gmAppoint')}</button>`:`<span class="small muted">${t('mgr.gmNeed')}</span>`}${G?`<button class="btn sm" onclick="demoteGM(this)">${t('mgr.demote')}</button>`:''}</div>
      ${G?'':`<div class="small muted">${t('mgr.gmOr')}</div>`}</div>`};
    modal(`<h2>📋 ${roomName('mgr')}</h2><div class="sub">${t('mgr.sub')}</div>
    <div class="row" style="margin-bottom:4px"><button class="btn pri" onclick="view(viewReport)" ${S.lastRep?'':'disabled'}>${t('mgr.lastRep')}</button><button class="btn" onclick="setPropNext(null);view(viewProps)">${t('mgr.propsBtn')}</button></div>
    <label class="small row"><input type="checkbox" ${S.repOn!==false?'checked':''} onchange="S.repOn=this.checked;save()"> ${t('mgr.repOn')}</label>
    <label class="small row"><input type="checkbox" ${S.autoAppr!==false?'checked':''} onchange="S.autoAppr=this.checked;save()"> ${t('mgr.autoAppr')}${G?t('mgr.autoApprGm'):''}</label>
    ${gmBox()}
    ${(()=>{const nb=(S.batches||[]).filter(b=>bMem(b).length&&!S.managers.some(m=>m.as&&m.as.t==='b'&&m.as.id===b.id));return nb.length?`<div class="card small">${t('mgr.nbCard',{n:nb.map(b=>esc(b.n)).join(', ')})}</div>`:''})()}
    ${det('mg-help',t('mgr.helpTitle'),`<div class="small">${t('mgr.help',{sk:Object.keys(MSK).map(k=>`<b>${mskName(k)}:</b> ${mskDesc(k)}`).join('<br>'),x:MAX_SA})}</div>`,false)}
    ${mgrBossHTML()}
    ${det('mg-tree',t('mgr.treeTitle'),`<div class="tree">${orgTree()}</div>`,true)}
    <div class="row" style="margin:12px 0 0"><h3 style="margin:0">${t('mgr.teamH',{n:S.managers.length})}</h3><span class="sp"></span>${S.managers.length?`<button class="btn sm" onclick="setAllD('mg-',false)">${t('mgr.collapseAll')}</button><button class="btn sm" onclick="setAllD('mg-',true)">${t('mgr.expandAll')}</button>`:''}</div>
    ${S.managers.length?[...new Set(S.managers.map(m=>m.lv))].sort((x,y)=>y-x).map(lv=>{const ms=S.managers.filter(m=>m.lv===lv);
      return det('mg-lv-'+lv,`⭐ ${t('mgr.lv',{n:lv})} <span class="small muted" style="font-weight:500">${t('mgr.lvInfo',{m:ms.length,a:ms.reduce((t,m)=>t+mgrTargets(m).length,0)})}</span>`,ms.map(card).join(''),true)}).join(''):`<div class="card small muted">${t('mgr.noMgrs')}</div>`}
    ${det('mg-free',t('mgr.freeH',{n:noMgr.length+(ttsNo.length?1:0)}),`<div class="small">${noMgr.map(a=>esc(a.name)).join(', ')}${ttsNo.length?`${noMgr.length?'<br>':''}${t('mgr.ttsNo',{n:ttsNo.length})}`:''}${!noMgr.length&&!ttsNo.length?`<span class="muted">${t('mgr.allHave')}</span>`:''}</div>${pmA.length?`<div class="small muted" style="margin-top:6px">${t('mgr.pmNote',{n:pmA.map(a=>esc(a.name)).join(', ')})}</div>`:''}`,noMgr.length+ttsNo.length>0)}
    ${det('mg-pool',t('mgr.poolH',{n:S.mgrPool.length}),`<div class="small muted" style="margin-bottom:6px">${t('mgr.poolSub')}</div>${S.mgrPool.map(m=>`<div class="card"><div class="row"><div class="chibi mini">${chibiHTML(m)}</div><div><b>${esc(m.name)}</b> ${m.dom?`<span class="tag">${domName(m.dom)}</span>`:''}<div class="small muted">${t('mgr.best',{k:mskName(m.spec),s:money(m.salary)})}</div></div><span class="sp"></span><button class="btn sm pri" onclick="hireMgr(${m.id})">${t('mgr.hire',{f:money(m.fee)})}</button></div><div class="row" style="margin-top:4px"><span class="sp"></span><button class="btn sm" onclick="hireGM(${m.id})">${t('mgr.hireGm',{f:money(m.fee*2)})}</button></div>${mgrBars(m)}</div>`).join('')||`<div class="small muted">${t('mgr.noCand')}</div>`}<button class="btn" onclick="rehuntMgr()">${t('mgr.rehunt',{f:money(15e6)})}</button>`,!S.managers.length)}`);
  },
  invest(){
    const own=S.biz,tot=own.reduce((t,b)=>t+Math.round(b.last*bizOwn(b)),0),fF=clamp(totalFans()/300000,0,2);
    modal(`<h2>📈 ${roomName('invest')}</h2><div class="sub">Mở thêm ngành kinh doanh để có thu nhập đều mỗi tuần. Lãi phụ thuộc tổng fan của công ty (hiện hệ số ×${(1+fF).toFixed(2)} cho ngành ăn theo fan). Doanh nghiệp có thể bán bớt cổ phần để kêu gọi vốn (giữ tối thiểu 51%), đổi lại chỉ hưởng lãi theo tỷ lệ còn giữ.</div>
    <div class="grid2"><div class="card">💼 Đang sở hữu<br><b>${own.length}</b> ngành</div><div class="card">💵 Lãi tuần trước<br><b class="${tot<0?'bad':'good'}">${fmt(tot)}</b></div></div>
    ${modV('econ')<1?'<div class="card small bad">📉 Đang suy thoái: lợi nhuận kinh doanh giảm.</div>':''}
    ${S.loan?`<div class="card small">💼 Đang trả vốn ${esc(S.loan.n)}: ${fmt(S.loan.pay)}/tuần, còn ${S.loan.left} tuần.</div>`:''}
    ${det('iv-own',`💼 Doanh nghiệp của bạn (${own.length})`,own.map(b=>{const B=BIZ[b.k];return`<div class="card"><div class="row"><b>${B.ic} ${B.n}</b><span class="tag v">Cấp ${b.lv}/5</span><span class="tag s">Cổ phần ${Math.round(bizOwn(b)*100)}%</span><span class="sp"></span><span class="small ${b.last<0?'bad':'good'}">${b.last>=0?'+':''}${fmt(bizOwn(b)<1?b.last*bizOwn(b):b.last)}/tuần</span></div><div class="small muted">${B.d} · Tổng lãi ${fmt(b.tot)} · đã đầu tư ${fmt(b.inv)}${bizOwn(b)<1?` · phần của bạn (toàn DN ${fmt(b.last)})`:''}</div><div class="row" style="margin-top:6px;flex-wrap:wrap"><span class="small">💼 Kêu gọi vốn · định giá ${fmt(bizVal(b))}</span><span class="sp"></span>${[.1,.2,.3].map(p=>`<button class="btn sm" ${Math.round((bizOwn(b)-p)*100)<51||bizWait(b)?'disabled':''} onclick="raiseBiz('${b.k}',${p})">Bán ${p*100}% (+${fmt(bizVal(b)*p)})</button>`).join('')}${bizOwn(b)<1?`<button class="btn sm pri" onclick="buybackBiz('${b.k}')">Mua lại (${fmt(bizVal(b)*(1-bizOwn(b))*1.15)})</button>`:''}</div>${bizWait(b)?`<div class="small muted">Vừa gọi vốn, còn ${bizWait(b)} tuần mới gọi tiếp được.</div>`:''}<div class="row" style="margin-top:6px">${b.lv<5?`<button class="btn sm pri" onclick="upBiz('${b.k}')">Mở rộng (${fmt(upCost(b))})</button>`:'<span class="tag s">Tối đa</span>'}<span class="sp"></span><button class="btn sm warn" onclick="sellBiz('${b.k}',this)">Bán (${fmt(b.inv*.6*bizOwn(b))})</button></div></div>`}).join('')||'<div class="card small muted">Chưa đầu tư ngành nào.</div>',true)}
    ${det('iv-shop','🏪 Ngành có thể đầu tư',Object.keys(BIZ).filter(k=>!bizLv(k)).map(k=>{const B=BIZ[k],est=B.base*(1+B.syn*fF);return`<div class="prow"><b>${B.ic} ${B.n}</b><span class="small muted">${B.d} Ước tính ~${fmt(est)}/tuần${B.vol>.6?' (dao động mạnh)':''}</span><span class="sp"></span><button class="btn sm pri" onclick="buyBiz('${k}')">Mở (${fmt(B.cost)})</button></div>`}).join('')||'<div class="small muted">Đã mở mọi ngành.</div>',true)}`);
  },
  market(){
    const me={n:'⭐ Starlight Ent. (bạn)',fans:totalFans(),me:1},list=S.rivals.concat([me]).sort((a,b)=>b.fans-a.fans),mx=list[0].fans||1;
    const ms=Object.values(S.mods||{}).filter(m=>m.until>abs());
    const free=acts().filter(actFree).map(x=>({x,r:conceptRec(x).find(c=>S.trend.hot.includes(c.k))})).sort((a,b)=>b.r.f-a.r.f).slice(0,4);
    modal(`<h2>📊 ${roomName('market')}</h2><div class="sub">Xu hướng âm nhạc, biến động thị trường và các công ty đối thủ.</div>
    <h3>🔥 Concept đang thịnh hành</h3><div class="card"><div class="cfit">${Object.keys(CONCEPTS).map(k=>({k,v:S.trend.hot.includes(k)?95:S.trend.cold===k?15:50})).sort((a,b)=>b.v-a.v).map(r=>`<span class="${r.v>90?'best':''}">${CONCEPTS[r.k].n}${trendTag(r.k)}</span><div class="bar"><i style="width:${r.v}%"></i></div><b>${r.v>90?'Hot':r.v<20?'Nguội':'·'}</b>`).join('')}</div>
    <div class="small muted">Còn khoảng ${S.trend.until-abs()} tuần trước khi xu hướng đổi. Single concept hot +12 điểm, concept nguội −8.</div>
    ${free.length?`<div class="small" style="margin-top:6px"><b>Ai hợp xu hướng:</b><br>${free.map(o=>`${esc(o.x.n)}: ${CONCEPTS[o.r.k].n} ${Math.round(o.r.f)}%`).join('<br>')}</div>`:''}</div>
    ${ms.length?`<h3>⚡ Biến động đang diễn ra</h3><div class="card small">${ms.map(m=>`${esc(m.n)} · còn ${m.until-abs()} tuần`).join('<br>')}</div>`:''}
    ${det('mk-rank','⚔️ Bảng xếp hạng công ty',list.map((r,i)=>`<div class="card" style="${r.me?'border-color:var(--pink)':''}"><div class="row"><b>#${i+1} ${esc(r.n)}</b><span class="sp"></span><b>${fmtN(r.fans)}</b> fan</div><div class="bar" style="margin:4px 0"><i style="width:${r.fans/mx*100}%;${r.me?'background:var(--pink)':''}"></i></div>${r.me?'':`<div class="small muted">Năm nay ${r.fans>=r.f0?'+':''}${fmtN(r.fans-r.f0)} fan${r.stole?` · đã giành ${r.stole} lời mời`:''}${r.last?' · '+esc(r.last):''}${r.cb&&r.cb.w>=abs()-1?' · <b class="bad">đang comeback</b>':''}</div>`}</div>`).join(''),true)}
    <div class="small muted">Đối thủ có thể comeback cùng lúc với bạn (làm single khó lên hạng), giành lời mời béo bở và chiêu mộ nghệ sĩ tâm trạng kém. Xếp hạng cuối năm dựa trên tổng fan.</div>`);
  },
  roof(){modal(trainRoom(ROOMS.find(r=>r.id==='roof'),'rest',`<div class="small muted">${t('roof.note')}</div>`))},
  ceo(){
    const wk=weekCost();
    const last=S.awards[S.awards.length-1];
    modal(`<h2>💼 ${roomName('ceo')}</h2><div class="sub">Quản lý tài chính, lịch tập hằng tuần và thành tích.</div>
    <div class="grid2"><div class="card">💰 Quỹ<br><b>${fmt(S.money)}</b></div><div class="card">📉 Chi phí tuần<br><b>${fmt(wk)}</b></div><div class="card">🏆 Giải đã thắng<br><b>${S.awards.reduce((s,e)=>s+e.res.filter(r=>r.ok).length,0)}</b></div><div class="card">📊 Hạng năm trước<br><b>${last?'#'+last.rank:'—'}</b></div></div>
    ${det('ceo-sched',`📅 Lịch tập tuần (${S.artists.filter(a=>!a.busy).length} ở công ty, ${S.artists.filter(a=>a.busy).length} bên ngoài)`,`<div class="row" style="margin-bottom:8px"><span class="small">Áp dụng cho tất cả (5 ngày tập + 2 ngày nghỉ):</span><select onchange="setAll(this.value)"><option value="">Chọn…</option>${Object.keys(TRAIN).map(k=>`<option value="${k}">${TRAIN[k].n}</option>`).join('')}</select></div>
    ${S.artists.length?ttsSplit(S.artists,a=>artistLine(a,a.busy?'<span class="tag">Bên ngoài</span>':schedSel(a)),'ceo-tts','',''):'<div class="muted small">Chưa có nghệ sĩ. Xuống Sảnh Tuyển dụng nhé.</div>'}`,true)}
    ${det('ceo-grp',`👥 Nhóm nhạc (${S.groups.length})`,S.groups.map(g=>`<div class="card"><b>👥 ${esc(g.name)}</b> <span class="small muted">debut năm ${g.y} · hòa hợp ${harmony(g.members)>=0?'+':''}${harmony(g.members)} · 📋 ${esc((S.managers.find(m=>m.as&&m.as.t==='g'&&m.as.id===g.id)||{name:'chưa có quản lý'}).name)}</span><div class="small">${g.members.map(i=>byId(i)).filter(Boolean).map(a=>esc(a.name)).join(', ')} · ${fmtN(g.members.reduce((s,i)=>s+(byId(i)?.fans||0),0))} fan</div></div>`).join('')||'<div class="small muted">Chưa có nhóm.</div>',false)}
    ${det('ceo-par',`🤝 Quan hệ đối tác (${Object.keys(S.partners).length})`,`<div class="small">${Object.keys(S.partners).sort((x,y)=>S.partners[y]-S.partners[x]).map(p=>`${esc(p)}: <b>${S.partners[p]}</b>`).join(' · ')||'<span class="muted">Hoàn thành dự án để xây dựng quan hệ. Quan hệ cao giúp giảm yêu cầu, tăng thù lao và nhận lời mời đích danh.</span>'}</div>`,false)}
    ${det('ceo-eval',`📋 Đánh giá định kỳ · kỳ tới sau ${evNext()} tuần`,`<div class="small muted" style="margin-bottom:6px">Mỗi 4 tuần. TTS phải tăng tổng chỉ số trên ${EV_PCT}% so với kỳ trước; không đạt ${EV_TTS} lần liên tiếp bị loại. TTS lười tập hoặc buồn có thể bị sa sút chỉ số. Nghệ sĩ xuất sắc được thưởng 2 tuần lương, không đạt bị trừ 1 tuần lương; ${EV_ART} lần liên tiếp không đạt sẽ bị chấm dứt hợp đồng.</div>${evalTable(S.lastEval)}`,true)}
    ${det('ceo-aw',`🏆 Lịch sử lễ trao giải (${S.awards.length})`,S.awards.slice().reverse().map(e=>`<div class="card small"><b>Năm ${e.y}</b> · hạng #${e.rank} · ${e.res.filter(r=>r.ok).map(r=>r.cat).join(', ')||'chưa có giải'}</div>`).join('')||'<div class="small muted">Lễ trao giải diễn ra sau tuần 52 mỗi năm.</div>',false)}
    <h3>Dữ liệu</h3><div class="small muted" style="margin-bottom:6px">Game tự lưu trên trình duyệt này sau mỗi thao tác. Muốn chơi ở thiết bị khác, hãy xuất mã hoặc file lưu.</div><button class="btn pri" onclick="view(viewCode)">🔑 Lưu / chuyển game</button> <button class="btn warn" onclick="resetGame(this)">Chơi lại từ đầu</button>`);
  },
  meet(){
    const now=abs();
    const avail=S.artists.filter(a=>!a.busy);
    modal(`<h2>📨 ${roomName('meet')}</h2><div class="sub">Lời mời hợp tác. Quan hệ tốt với đối tác/bạn diễn giúp giảm yêu cầu và tăng thù lao.</div>
    ${S.events.length?`<button class="btn pink" onclick="view(viewEvents)">🔔 ${S.events.length} sự kiện cần xử lý</button>`:''}
    ${(()=>{const L=secPlans();if(!L.length)return'';const r=L.filter(p=>!p.wait&&!p.plan),pl=L.filter(p=>p.plan),sr=secSchedRec();return`<div class="card row"><div class="chibi mini">${chibiHTML(NPC[1])}</div><div class="small" style="flex:1"><b>🗒️ Thư ký:</b> ${r.length?`${r.map(p=>esc(p.n.slice(2).trim())).join(', ')} nên comeback ngay (concept ${CONCEPTS[r[0].ck].n}${trendTag(r[0].ck)}).`:'chưa có ai nên comeback tuần này.'}${sr.length?` Nên hẹn: ${sr.map(p=>esc(p.n.slice(2).trim())).join(', ')}.`:''}${pl.length?` ${pl.length} lịch đã hẹn.`:''}${Object.values(S.camp).some(c=>c.ph==='post')?` 📣 ${Object.values(S.camp).filter(c=>c.ph==='post').length} đang quảng bá.`:''}${fanSugs().length?` 💬 ${fanSugs().length} gợi ý giao lưu fan.`:''}</div>${sr.length?`<button class="btn sm" onclick="cbSchedRec()">Hẹn theo khuyến nghị</button>`:''}<button class="btn sm pri" onclick="view(viewSec)">Kế hoạch</button></div>`})()}
    ${(()=>{const offCard=of=>{const O=OFFER[of.type],tg=of.target?byId(of.target):null;
      const opts=avail.slice().sort((x,y)=>(canTake(of,x)?1:0)-(canTake(of,y)?1:0)||(y.id===of.target)-(x.id===of.target)).map(a=>{const why=canTake(of,a);return`<option value="${a.id}" ${why?'disabled':''}>${esc(a.name)} – ${why||'phù hợp '+Math.round(fit(a,of.w))+'% · '+fmt(effPay(of,a))}</option>`}).join('');
      return`<div class="card ${tg?'tg':''}"><div class="row"><b>${O.ic} ${O.n}: «${esc(of.title)}»</b>${slotsOf(of)>1?` <span class="tag v">👥 ${slotsOf(of)} người</span>`:''}<span class="sp"></span><span class="small muted">hết hạn ${of.exp-now} tuần</span></div>
      <div class="small">${esc(of.partner)} (quan hệ ${S.partners[of.partner]||0})${of.genre?' · Thể loại '+GENRES[of.genre].n:''} · ${of.weeks} tuần · Thù lao gốc ${fmt(of.pay)}${of.costar?' · Bạn diễn: '+esc(of.costar):''}</div>
      ${tg?`<div class="small" style="color:var(--sun);font-weight:700">⭐ Mời đích danh: ${esc(tg.name)} (yêu cầu giảm thêm 20%)${slotsOf(of)>1?' · có thể mời thêm bạn diễn':''}</div>`:''}
      <div class="req">Yêu cầu: ${Object.keys(of.req).map(k=>`${STATS[k]} ≥ ${of.req[k]}`).join(', ')}${of.fame?` · Danh tiếng ≥ ${of.fame}`:''}${O.trainee?' · Nhận cả thực tập sinh':''}</div>
      ${slotsOf(of)>1?(()=>{const ok=avail.filter(a=>!canTake(of,a));return`<div class="small" style="margin-top:6px">👥 Tối đa <b>${slotsOf(of)} người</b> · bạn thân, cùng nhóm làm chung sẽ ăn ý hơn.</div>
      <div class="list">${ok.map(a=>`<label><input type="checkbox" class="oc${of.id}" value="${a.id}" onchange="ocPrev(${of.id},this)" ${a.id===of.target?'checked':''}> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">phù hợp ${Math.round(fit(a,of.w))}% · ${fmt(effPay(of,a))}</span></span></label>`).join('')||'<div class="small muted">Chưa có ai đủ điều kiện.</div>'}</div>
      ${avail.length>ok.length?`<div class="small muted">${avail.length-ok.length} người rảnh chưa đủ điều kiện.</div>`:''}
      <div class="row" style="margin-top:6px"><span class="small muted" id="ocp${of.id}">Chọn tối đa ${slotsOf(of)} người</span><span class="sp"></span>${ok.length?`<button class="btn sm" onclick="ocPick(${of.id})">💡 Gợi ý đội hình</button><button class="btn sm pri" onclick="acceptSel(${of.id})">Nhận</button>`:''}</div>`})():`<div class="row" style="margin-top:6px"><select id="ofs${of.id}" style="flex:1;min-width:180px">${opts||'<option disabled>Không có ai rảnh</option>'}</select><button class="btn sm pri" onclick="acceptOffer(${of.id},+$('#ofs${of.id}').value)">Nhận</button></div>`}
      ${of.invest?`<div class="row" style="margin-top:6px"><span class="small">💰 Góp vốn ${Math.round(of.invest.share*100)}% / kinh phí ${fmt(of.invest.budget)}</span><span class="sp"></span><button class="btn sm" ${of.invested?'disabled':''} onclick="investOffer(${of.id})">${of.invested?'Đã góp vốn':'Góp '+fmt(of.invest.budget*of.invest.share)}</button></div>`:''}</div>`},tO=offerOrder(S.offers).filter(o=>OFFER[o.type].trainee),oO=offerOrder(S.offers).filter(o=>!OFFER[o.type].trainee),tgT=n=>{const k=n.filter(o=>byId(o.target)).length;return k?` · ⭐ ${k} mời đích danh`:''},nt=S.artists.filter(a=>a.status==='trainee').length;
      return det('mt-tts',`🌱 Dự án nhận thực tập sinh (${tO.length})${tgT(tO)}`,`<div class="small muted" style="margin-bottom:6px">Việc ngắn để thực tập sinh kiếm tiền, thêm fan và học kinh nghiệm. Tuần đi làm sẽ không tập ở công ty, nên cân nhắc với mục tiêu tăng ${EV_PCT}% chỉ số mỗi kỳ.</div>`+(tO.map(offCard).join('')||'<div class="card muted">Chưa có dự án cho thực tập sinh.</div>'),nt>0)
        +det('mt-off',`📨 Lời mời cho nghệ sĩ (${oO.length})${tgT(oO)}`,oO.map(offCard).join('')||'<div class="card muted">Chưa có lời mời. Sang tuần mới để nhận thêm.</div>',true)
        +det('mt-comp',`🏆 Cuộc thi cho nghệ sĩ (${S.comps.filter(c=>kindOf(c)!=='tts').length} đang mở)`,compHTML(['grp','solo','act']),true)})()}`);
  },
  studio(){
    const all=acts(),A=all.filter(actFree),busyN=all.length-A.length;
    const opt=A.map(x=>`<option value="${x.k}">${esc(x.n)}</option>`).join('');const hiat=S.groups.filter(g=>g.hiatus>abs());
    const rp=rivalPress(),cb=S.rivals.filter(r=>r.cb&&r.cb.w>=abs()-1);
    const recs=A.map(x=>{const r=conceptRec(x);const b=r[0],c=r[1];return`<div class="prow"><b>${esc(x.n)}</b><span class="small">⭐ ${CONCEPTS[b.k].n}${trendTag(b.k)} ${Math.round(b.f)}% <span class="muted">· ${CONCEPTS[c.k].n}${trendTag(c.k)} ${Math.round(c.f)}%</span></span><span class="sp"></span><button class="btn sm" onclick="view(()=>viewCamp('${x.k}'))">📣</button><button class="btn sm pri" onclick="studioPick('${x.k}','${b.k}')">Chọn</button></div>`}).join('');
    modal(trainRoom(ROOMS[2],'rap',`
    <div class="card small">🔥 Thịnh hành: <b>${S.trend.hot.map(k=>CONCEPTS[k].n).join(', ')}</b> (+12 điểm) · ❄️ ${CONCEPTS[S.trend.cold].n} (−8) · còn ${S.trend.until-abs()} tuần${cb.length?`<br>⚔️ Đang comeback: ${cb.map(r=>esc(r.n)+' ('+CONCEPTS[r.cb.ck].n+')').join(', ')} → single ra lúc này bị trừ ${rp} điểm`:''}</div>
    <button class="btn" onclick="view(viewSec)">🗒️ Kế hoạch comeback của thư ký</button>
    ${songCard()}
    ${(()=>{const L=Object.values(S.camp).filter(c=>c.ph==='post');return L.length?`<h3>📣 Đang quảng bá (${L.length})</h3>${L.map(c=>`<div class="card row small"><b>${esc(c.n)}</b> «${esc(c.t)}» · #${c.rank} · 🏆${c.wins} · tuần ${c.wn+1}/${PROMO_WK}<span class="sp"></span><button class="btn sm pri" onclick="view(()=>viewCamp('${c.k}'))">Lịch sân khấu</button></div>`).join('')}`:''})()}
    ${hiat.length?`<div class="card small">⏸️ Tạm ngừng hoạt động: ${hiat.map(g=>`${esc(g.name)} (còn ${g.hiatus-abs()} tuần)`).join(', ')}</div>`:''}
    ${det('st-rec',`🎯 Đề xuất concept cho người rảnh (${A.length})`,(recs||'<div class="small muted">Không có nhóm/solo nào đang rảnh.</div>')+(busyN?`<div class="small muted">Ẩn ${busyN} nhóm/solo đang bận.</div>`:''),true)}
    <h3>💿 Phát hành single</h3>${A.length?`<div class="card"><div class="row"><select id="sAct">${opt}</select><select id="sCon">${Object.keys(CONCEPTS).map(k=>`<option value="${k}">${CONCEPTS[k].n}${trendTag(k)}</option>`).join('')}</select></div>
    <div class="row" style="margin-top:6px"><select id="sBud"><option value="30000000">Tiết kiệm – 30 tr</option><option value="80000000" selected>Tiêu chuẩn – 80 tr</option><option value="200000000">Bom tấn – 200 tr</option></select><input type="text" id="sTitle" placeholder="Tên bài hát (tuỳ chọn)" style="flex:1"></div>
    <div class="row" style="margin-top:6px"><select id="sSong" style="flex:1;min-width:0">${songOpts()}</select></div>
    <div class="small muted" id="sPrev" style="margin:6px 0"></div><button class="btn pink" onclick="releaseSingle()">Phát hành</button></div>`:`<div class="card small muted">${all.length?'Tất cả nhóm/solo đang bận. Chờ họ quay về nhé.':'Cần debut nhóm hoặc solo trước (Sảnh Tuyển dụng).'}</div>`}
    ${det('st-tbl','📋 Bảng chỉ số theo concept',`<div class="small muted">Tỉ trọng chỉ số quyết định điểm concept. Bạn bè trong nhóm cộng điểm, mâu thuẫn trừ điểm.</div>${wTable(CONCEPTS,conceptName)}`,false)}
    <h3>🏟️ Tổ chức concert</h3>${A.length?`<div class="card"><div class="row"><select id="cAct">${opt}</select><button class="btn pri" onclick="holdConcert()">Tổ chức (200 tr)</button></div><div class="small muted">Cần tổng ≥ 30K fan. Doanh thu theo số vé bán.</div></div>`:'<div class="small muted">Không có ai rảnh.</div>'}
    ${det('st-hist','💿 Single đã phát hành',`<div class="small">${S.singles.slice(0,10).map(s=>`N${s.y} «${esc(s.title)}» – ${esc(s.act.slice(2))} – ${s.concept} – hạng ${s.rank}`).join('<br>')||'<span class="muted">Chưa có.</span>'}</div>`,false)}`));
    const up=()=>{const a=actByKey($('#sAct')?.value);if(!a)return;const m=a.m.map(byId).filter(Boolean),k=$('#sCon').value,w=CONCEPTS[k].w,tb=trendB(k);$('#sPrev').innerHTML=`Độ hợp concept: <b>${Math.round(m.reduce((s,x)=>s+fit(x,w),0)/m.length)}%</b> · Hòa hợp ${harmony(a.m)}${tb?` · ${tb>0?'🔥 hợp xu hướng +'+tb:'❄️ hết thời '+tb}`:''}${rp?` · ⚔️ đối thủ −${rp}`:''}${songPrev(a)}`};
    const pre=()=>{const A2=actByKey($('#sAct').value);if(!A2)return;const s=curSong();$('#sCon').value=s?s.ck:conceptRec(A2)[0].k;up()};
    if($('#sAct')){$('#sAct').onchange=pre;$('#sCon').onchange=up;$('#sSong').onchange=()=>{const s=curSong();if(s){$('#sCon').value=s.ck;$('#sTitle').value=s.t}else $('#sTitle').value='';up()};pre()}
  },
  acting(){
    const cands=S.artists.filter(a=>a.status==='debuted'&&!a.busy);
    modal(trainRoom(ROOMS[3],'acting',`
    <h3>🎬 Tự sản xuất phim</h3><div class="card"><div class="row"><select id="fGen">${Object.keys(GENRES).map(k=>`<option value="${k}">${GENRES[k].n}</option>`).join('')}</select><select id="fBud"><option value="300000000">Kinh phí thấp – 300 tr</option><option value="800000000">Trung bình – 800 tr</option><option value="2000000000">Bom tấn – 2 tỷ</option></select></div>
    <input type="text" id="fTitle" placeholder="Tên phim (tuỳ chọn)" style="width:100%;margin-top:6px">
    <div class="small" style="margin-top:6px">Chọn 1–3 vai chính (quay 8 tuần, ra rạp sau 2 tuần hậu kỳ):</div>
    <div class="list" id="fList">${cands.map(a=>`<label><input type="checkbox" class="fcast" value="${a.id}"> ${esc(a.name)} <span class="small muted" data-f="${a.id}"></span></label>`).join('')||'<div class="small muted">Không có nghệ sĩ đã ra mắt nào rảnh.</div>'}</div>
    <button class="btn pink" style="margin-top:6px" onclick="produceFilm()">Bấm máy</button></div>
    <div class="small muted">Góp vốn vào phim được mời tại Phòng Họp (phim truyền hình & điện ảnh).</div>
    ${det('fl-tbl','📋 Bảng chỉ số theo thể loại phim',wTable(GENRES,genreName),false)}
    ${det('fl-list',`🎞️ Phim của công ty (${S.films.length})`,S.films.slice().reverse().map(f=>`<div class="card small"><b>«${esc(f.title)}»</b> ${GENRES[f.genre].n} · ${f.own?'Tự sản xuất':'Góp vốn '+Math.round(f.share*100)+'%'} · Vốn ${fmt(f.cost)}<br>${f.done?`Doanh thu ${fmt(f.rev)} (x${f.mult}) · Nhận ${fmt(f.inc)}`:f.status+(f.releaseAt?` · chiếu sau ${f.releaseAt-abs()} tuần`:'')}${f.cast.length?' · Cast: '+f.cast.map(byId).filter(Boolean).map(a=>esc(a.name)).join(', '):''}</div>`).join('')||'<div class="small muted">Chưa có phim.</div>',true)}`));
    const up=()=>{const w=GENRES[$('#fGen').value].w;document.querySelectorAll('[data-f]').forEach(el=>{const a=byId(+el.dataset.f);el.textContent=`phù hợp ${Math.round(fit(a,w))}% · danh tiếng ${fame(a)}`})};
    $('#fGen').onchange=up;up();
  },
  vocal(){modal(trainRoom(ROOMS[4],'vocal'))},
  dance(){modal(trainRoom(ROOMS[5],'dance'))},
  gym(){modal(trainRoom(ROOMS[6],'gym',hsHTML()))},
  pr(){
    const sc=S.artists.filter(a=>a.scandal);
    const pl=prPlans();
    modal(trainRoom(ROOMS[7],'variety',`${det('pr-plan',`📣 Kế hoạch quảng bá đề xuất (${pl.length})`,prHTML(pl),true)}${det('pr-sc',`🚨 Scandal đang diễn ra (${sc.length})`,`${sc.map(a=>{const e=S.events.find(x=>x.kind==='scandal'&&x.a===a.id);return`<div class="card"><b>${esc(a.name)}</b>: ${esc(a.scandal.t)} · mức ${'🔥'.repeat(a.scandal.sev)} · còn ${a.scandal.left} tuần<div class="small muted">Fan giảm ${2*a.scandal.sev}%/tuần. Mức 2+ không thể nhận dự án.</div>${e?invBlock(a):''}${e?`<div class="row" style="margin-top:6px">${evInfo(e).o.map(o=>`<button class="btn sm" onclick="resolveEv(${e.id},'${o.k}')">${o.l}</button>`).join('')}</div>`:'<div class="small">Đã chọn im lặng, chờ dư luận lắng xuống.</div>'}</div>`}).join('')||'<div class="card small muted">Không có scandal nào. Truyền thông đang êm đẹp.</div>'}
    <div class="small muted">Hẹn hò bí mật làm tăng nguy cơ bị "khui". Công khai hẹn hò giúp loại bỏ rủi ro này.</div>`,sc.length>0)}${det('pr-hist',`🗂️ Kế hoạch đã duyệt (${(S.prHist||[]).length})`,(S.prHist||[]).slice(0,20).map(h=>`<div class="small">${esc(h)}</div>`).join('')||'<div class="small muted">Chưa duyệt kế hoạch nào.</div>',false)}`));
  },
  lobby(){
    const tr=S.artists.filter(a=>!a.busy);
    modal(`<h2>🌟 ${roomName('lobby')}</h2><div class="sub">${t('lobby.sub')}</div>${dqBanner()}
    ${det('lb-hr',t('lobby.hr',{n:S.rec?S.rec.staff.length:0}),recHTML(),false)}
    ${det('lb-cast',t('lobby.cast',{n:S.pool.length}),`<div class="small muted" style="margin-bottom:6px">${t('lobby.castHelp',{m:money(20e6)})}</div>${repCard()}
    ${S.rec&&S.rec.sug.length?`<div class="card small row">${t('lobby.recSug',{n:S.rec.sug.filter(i=>S.pool.some(a=>a.id===i)).length})}<span class="sp"></span><button class="btn sm pri" onclick="recSignSug()">${t('lobby.signSug')}</button></div>`:''}
    ${S.pool.map(a=>`<div class="card"><div class="row"><div class="chibi mini">${chibiHTML(a)}</div><div><b>${esc(a.name)}</b> <span class="small muted">${t('lobby.cand',{g:a.g==='F'?t('lobby.female'):t('lobby.male'),a:a.age,s:statName(a.spec),t:a.talent})}</span>${S.rec&&S.rec.sug.includes(a.id)?`<div class="small"><span class="tag s">${t('lobby.recTag',{n:Math.round(est(a,recEye()))})}</span></div>`:''}</div><span class="sp"></span><button class="btn sm pri" onclick="sign(${a.id})">${t('lobby.signBtn')}</button></div>${bars(a)}</div>`).join('')||`<div class="small muted">${t('lobby.noCand')}</div>`}
    <button class="btn" onclick="recast()">${t('lobby.recast',{m:money(10e6)})}</button>`,true)}
    ${det('lb-batches',t('lobby.batches',{b:S.batches.length,n:S.artists.filter(a=>a.status==='trainee').length}),batchHTML(),true)}
    ${det('lb-comp',t('lobby.comp',{n:S.comps.filter(c=>kindOf(c)==='tts').length}),compHTML(),true)}
    ${(()=>{const ts=S.artists.filter(a=>a.status==='trainee'&&!a.busy).sort(eligSort);return ts.length?det('lb-rec',t('lobby.recTitle',{n:ts.length}),`<div class="small muted" style="margin-bottom:4px">${t('lobby.recHelp',{m:DEBUT_MIN})}</div><div class="card">${ts.map(recLine).join('')}</div>`,false):''})()}
    <h3>${t('lobby.debutH')}</h3><div class="card"><div class="row"><select id="dType"><option value="group">${t('lobby.opt.group')}</option><option value="solo">${t('lobby.opt.solo')}</option><option value="actor">${t('lobby.opt.actor')}</option></select><input type="text" id="dName" placeholder="${t('lobby.groupName')}" style="flex:1"></div>
    <div id="dSug"></div><h3 style="margin-top:10px">${t('lobby.pickArtists')}</h3><div class="list" id="dList"></div><div class="card" id="dAna" style="margin-top:10px;background:var(--bg)"></div><div class="small muted" id="dCost" style="margin:6px 0"></div><button class="btn pink" onclick="debut()">${t('lobby.debutBtn')}</button></div>
    <div class="small muted">${t('lobby.note')}</div>`);
    const up=()=>{const ty=$('#dType').value;$('#dName').style.display=ty==='group'?'':'none';
      let list=tr.filter(a=>ty==='group'?!groupsOf(a).length:ty==='solo'?!a.solo:!a.actor);
      const tbl=ty==='actor'?GENRES:CONCEPTS,bf=a=>bestOf(a,tbl)[0];
      if(ty!=='group')list.sort((x,y)=>bf(y).f-bf(x).f);list.sort((x,y)=>(dElig(y,ty)?1:0)-(dElig(x,ty)?1:0));
      let sug='';
      if(ty==='group'&&list.length>=2){
        const L=Object.keys(CONCEPTS).map(k=>({k,...bestLineup(list,CONCEPTS[k].w)})).sort((a,b)=>b.sc-a.sc);
        sug=`<h3 style="margin-top:8px">${t('lobby.lineups')}</h3>${L.map((x,i)=>`<div class="lineup"><div style="flex:1;min-width:0"><b>${i===0?'⭐ ':''}${conceptName(x.k)}</b> · ${t('lobby.lineupFit',{f:Math.round(x.f),h:(x.hm>=0?'+':'')+x.hm})}<br><span class="muted">${x.ids.map(id=>esc(byId(id).name)).join(', ')}</span></div><button class="btn sm${i===0?' pri':''}" onclick="applyLineup([${x.ids}])">${t('lobby.pick')}</button></div>`).join('')}`;
      }else if(ty!=='group'&&list.length)sug=`<div class="small muted" style="margin-top:8px">${t('lobby.sorted',{k:ty==='solo'?t('lobby.kSolo'):t('lobby.kFilm')})}</div>`;
      $('#dSug').innerHTML=sug;
      $('#dList').innerHTML=list.map((a,i)=>{const b=bf(a);return`<label><input type="${ty==='group'?'checkbox':'radio'}" name="dsel" class="dsel" value="${a.id}"> <span style="flex:1">${ty!=='group'&&i<3?'⭐ ':''}${dElig(a,ty)?`<span class="tag s">${t('lobby.eligTag')}</span> `:''}<b>${esc(a.name)}</b> <span class="small muted">${a.status==='trainee'?t('lobby.tts'):t('lobby.debuted')} · ${t('lobby.stats',{v:Math.round(a.st.vocal),n:Math.round(a.st.dance),r:Math.round(a.st.rap),d:Math.round(a.st.acting),s:Math.round(a.st.visual)})}<br>${t('lobby.bestFit',{n:ty==='actor'?genreName(b.k):conceptName(b.k),f:Math.round(b.f)})}</span></span></label>`}).join('')||`<div class="small muted">${t('lobby.noneFit')}</div>`;
      const cnt=()=>{const n=document.querySelectorAll('.dsel:checked').length;$('#dCost').textContent=t('lobby.cost',{m:money(DEBUT_COST[ty](Math.max(n,ty==='group'?2:1)))})+(ty==='group'?' '+t('lobby.costGroup',{a:money(120e6),b:money(20e6)}):'');$('#dAna').innerHTML=debutAnalysis()};
      document.querySelectorAll('.dsel').forEach(x=>x.onchange=cnt);cnt()};
    $('#dType').onchange=up;up();
  },
  dorm(){
    const pairs=[];const seen=new Set();
    for(const a of S.artists)for(const id in a.tag){const k=[a.id,+id].sort().join('-');if(seen.has(k))continue;seen.add(k);const b=byId(+id);if(b)pairs.push({a,b,t:a.tag[id],v:getRel(a,b)})}
    const TN={friend:'🤝 Bạn thân',enemy:'⚡ Mâu thuẫn',dating:'💞 Hẹn hò bí mật',public:'💌 Hẹn hò công khai'};
    modal(trainRoom(ROOMS[9],'rest',`${det('dm-rel',`💞 Quan hệ nội bộ (${pairs.length})`,`<div class="small muted" style="margin-bottom:6px">Nghệ sĩ cùng nhóm hoặc cùng phòng tập dễ thân nhau hơn. Quan hệ tạo ra sự kiện bạn bè, mâu thuẫn, hẹn hò.</div>${pairs.map(p=>`<div class="card small row"><b>${esc(p.a.name)} & ${esc(p.b.name)}</b><span class="sp"></span>${TN[p.t]} <span class="muted">(${p.v})</span></div>`).join('')||'<div class="card small muted">Chưa có mối quan hệ đặc biệt nào.</div>'}`,true)}`));
    /* v3: outside-company contacts + personal assistants */
    const p=$('#sheet .panel');if(!p)return;
  const L=[];S.artists.forEach(a=>Object.keys(a.xr||{}).forEach(id=>{const x=extById(+id);if(x&&a.xr[id])L.push({a,x,v:a.xr[id]})}));L.sort((p,q)=>Math.abs(q.v)-Math.abs(p.v));
  const ml=S.artists.filter(a=>a.pa);
  p.insertAdjacentHTML('beforeend',det('dm-ext',`🌐 Giao lưu ngoài công ty (${L.length})`,`<div class="small muted" style="margin-bottom:6px">Nghệ sĩ gặp idol công ty khác ở show âm nhạc, hậu trường, livestream. Quan hệ tốt mở ra lời mời hợp tác; thân quá dễ thành tin đồn.</div>${L.slice(0,15).map(z=>`<div class="card small row"><b>${esc(z.a.name)}</b> ↔ ${esc(z.x.name)} <span class="muted">(${esc(z.x.co)})</span><span class="sp"></span>${relTxt(z.v)}</div>`).join('')||'<div class="small muted">Chưa có giao lưu nào.</div>'}`,false)+(ml.length?det('dm-pa',`🧑‍💻 Trợ lý cá nhân (${ml.length})`,ml.map(a=>`<div class="small">${esc(a.name)}: ${esc(a.pa.name)} · ${MSK[a.pa.k]} +${a.pa.v}</div>`).join(''),false):''));
  }
};
