import { R, pick } from '../core/rng.js';
import { $, clamp, esc, fmtN } from '../core/util.js';
import { GNAMES } from '../data/names.js';
import { CONCEPTS, GENRES } from '../data/rules.js';
import { Lk, t, tx } from '../i18n/index.js';
import { conceptName, genreName, statName } from '../i18n/labels.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fame, fit } from './artists.js';
import { CT_WK, MOOD, book } from './ext2.js';
import { givePM } from './managers.js';
import { getRel, groupsOf, harmony, setRel } from './relations.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

export const tagScore=(p,c)=>{const t=p.tag[c.id];return t==='friend'?3:t==='dating'||t==='public'?1:t==='enemy'?-6:0};
export const avgFit=(ms,w)=>ms.reduce((s,a)=>s+fit(a,w),0)/ms.length;
export function bestLineup(pool,w){
  const sorted=pool.slice().sort((a,b)=>fit(b,w)-fit(a,w));let best=null;
  for(let n=2;n<=Math.min(5,sorted.length);n++){
    const pk=[sorted[0]];
    while(pk.length<n){let bc=null,bs=-1e9;for(const c of sorted){if(pk.includes(c))continue;const s=fit(c,w)+pk.reduce((t,p)=>t+tagScore(p,c),0)*3;if(s>bs){bs=s;bc=c}}pk.push(bc)}
    const ids=pk.map(a=>a.id),f=avgFit(pk,w),hm=harmony(ids),sc=f+hm*1.5+n*2;
    if(!best||sc>best.sc)best={ids,f,hm,sc,n};
  }
  return best;
}
export function roleTags(ms){const r={},add=(a,t)=>(r[a.id]=r[a.id]||[]).push(t),top=k=>ms.reduce((m,x)=>x.st[k]>m.st[k]?x:m);
  add(top('vocal'),'Main Vocal');add(top('dance'),'Main Dancer');const rp=top('rap');if(rp.st.rap>=20)add(rp,'Rapper');add(top('visual'),'Visual');
  add(ms.reduce((m,x)=>(x.st.variety+x.mood/2)>(m.st.variety+m.mood/2)?x:m),'Leader');
  add(ms.reduce((m,x)=>(x.st.visual+x.st.dance+fame(x))>(m.st.visual+m.st.dance+fame(m))?x:m),'Center');return r}
export const bestOf=(a,tbl)=>Object.keys(tbl).map(k=>({k,f:fit(a,tbl[k].w)})).sort((x,y)=>y.f-x.f);
export function fitRows(rows,nm){const mx=rows[0].f;return`<div class="cfit">${rows.map(r=>`<span class="${r.f===mx?'best':''}">${r.f===mx?'⭐ ':''}${nm(r.k)}</span><div class="bar"><i style="width:${r.f}%"></i></div><b>${Math.round(r.f)}%</b>`).join('')}</div>`}
export function debutAnalysis(){
  const ty=$('#dType').value,ids=[...document.querySelectorAll('.dsel:checked')].map(x=>+x.value),sel=ids.map(byId).filter(Boolean);
  if(ty==='group'){
    if(sel.length<2)return`<div class="small muted">${t('da.pick2')}</div>`;
    const rows=Object.keys(CONCEPTS).map(k=>({k,f:avgFit(sel,CONCEPTS[k].w)})).sort((a,b)=>b.f-a.f),hm=harmony(ids),roles=roleTags(sel);
    const enem=[];for(let i=0;i<sel.length;i++)for(let j=i+1;j<sel.length;j++)if(sel[i].tag[sel[j].id]==='enemy')enem.push(sel[i].name+' & '+sel[j].name);
    return`<b>${t('da.lineup',{n:t('common.people',{n:sel.length})})}</b> · ${t('da.harmony')} <b class="${hm<0?'bad':'good'}">${hm>=0?'+':''}${hm}</b>${enem.length?` · <span class="bad">${t('da.conflict',{n:esc(enem.join(', '))})}</span>`:''}
    ${fitRows(rows,conceptName)}<div class="small">${t('da.bestConcept',{c:conceptName(rows[0].k)})}${rows[0].f-rows[1].f<3?t('da.nearConcept',{c:conceptName(rows[1].k)}):''}.</div>
    <div class="small" style="margin-top:6px"><b>${t('da.roles')}</b><br>${sel.map(a=>`${esc(a.name)}: ${(roles[a.id]||[t('da.member')]).join(', ')}`).join('<br>')}</div>`;
  }
  if(!sel.length)return`<div class="small muted">${t('da.pick1')}</div>`;
  const a=sel[0],rc=debutRec(a),cmp=a.status==='trainee'?`<div class="small" style="margin-top:6px">${t('da.common')} <b>${rc.t==='wait'?t('debut.notYet'):t(`debut.type.${rc.t}`)}</b>${rc.t!==ty&&rc.t!=='wait'?` <span class="bad">${t('da.differs')}</span>`:''}</div>`:'';
  if(ty==='solo')return`<b>${t('da.soloTitle',{n:esc(a.name)})}</b>${fitRows(bestOf(a,CONCEPTS),conceptName)}<div class="small">${t('da.soloBest',{c:conceptName(bestOf(a,CONCEPTS)[0].k)})}</div>`+cmp;
  if(ty==='actor')return`<b>${t('da.actTitle',{n:esc(a.name)})}</b> · ${statName('acting')} ${Math.round(a.st.acting)}${fitRows(bestOf(a,GENRES),genreName)}<div class="small">${t('da.actBest',{g:genreName(bestOf(a,GENRES)[0].k)})}</div>`+cmp;
  if(ty==='solo')return`<b>${t('da.soloTitle',{n:esc(a.name)})}</b>${fitRows(bestOf(a,CONCEPTS),conceptName)}<div class="small">${t('da.soloBest',{c:conceptName(bestOf(a,CONCEPTS)[0].k)})}</div>`;
  return`<b>${t('da.actTitle',{n:esc(a.name)})}</b> · ${statName('acting')} ${Math.round(a.st.acting)}${fitRows(bestOf(a,GENRES),genreName)}<div class="small">${t('da.actBestW',{g:genreName(bestOf(a,GENRES)[0].k),w:a.st.acting<25?t('da.actWeak'):''})}.</div>`;
}
export function lineupWith(a,pool,w){const others=pool.filter(x=>x!==a);if(!others.length)return null;let best=null;
  for(let n=2;n<=Math.min(5,others.length+1);n++){const pk=[a];while(pk.length<n){let bc=null,bs=-1e9;for(const c of others){if(pk.includes(c))continue;const sc=fit(c,w)+pk.reduce((t,p)=>t+tagScore(p,c),0)*3;if(sc>bs){bs=sc;bc=c}}pk.push(bc)}
    const ids=pk.map(x=>x.id),f=avgFit(pk,w),hm=harmony(ids),sc=f+hm*1.5+n*2;if(!best||sc>best.sc)best={ids,f,hm,sc}}return best}
export const DEBUT_MIN=50;
export function debutRec(a){
  const so=bestOf(a,CONCEPTS)[0],ac=bestOf(a,GENRES)[0],music=Math.max(a.st.vocal,a.st.dance,a.st.rap);
  const soloS=so.f*.85+music*.25+(a.st.visual>=50?3:0)-(a.mood<30?5:0);
  const actS=ac.f*.9+(a.st.acting-(a.st.vocal+a.st.dance)/2)*.3;
  const pool=S.artists.filter(x=>x.status==='trainee'&&!x.busy&&!groupsOf(x).length);
  let grp=null,gk=null;if(a.status==='trainee')for(const k in CONCEPTS){const l=lineupWith(a,pool,CONCEPTS[k].w);if(l&&(!grp||l.sc>grp.sc)){grp=l;gk=k}}
  const grpS=grp?grp.f+grp.hm*1.5+6:-99;
  const sc={solo:Math.round(soloS),actor:Math.round(actS),group:grp?Math.round(grpS):null};
  let t='solo';if(actS>soloS)t='actor';if(grpS>Math.max(soloS,actS))t='group';
  const r={t,sc,k:t==='group'?gk:t==='solo'?so.k:ac.k,ids:grp?grp.ids:[a.id],f:t==='group'?grp.f:t==='solo'?so.f:ac.f};
  const lbl=Lk(t==='actor'?`genre.${r.k}`:`concept.${r.k}`);
  if(t==='group'){const mates=grp.ids.filter(i=>i!==a.id).map(i=>byId(i).name);r.why=Lk('debut.why.group',{m:mates.join(', '),c:lbl,f:Math.round(grp.f),h:grp.hm>0?Lk('debut.why.harm'):''})}
  else if(t==='solo')r.why=Lk('debut.why.solo',{s:Lk(`stat.${['vocal','dance','rap'].reduce((m,k)=>a.st[k]>a.st[m]?k:m,'vocal')}`),n:Math.round(music),c:lbl,f:Math.round(so.f)});
  else r.why=Lk('debut.why.actor',{n:Math.round(a.st.acting),c:lbl,f:Math.round(ac.f)});
  r.short=Lk('debut.short',{d:Lk(`debut.typeShort.${t}`),c:lbl,f:Math.round(r.f)});
  if(a.status==='trainee'&&r.f<=DEBUT_MIN){const W=t==='actor'?GENRES[r.k].w:CONCEPTS[r.k].w,k=Object.keys(W).reduce((m,x)=>W[x]*(100-a.st[x])>W[m]*(100-a.st[m])?x:m);
    r.best=t;r.t='wait';r.why=Lk('debut.why.wait',{f:Math.round(r.f),m:DEBUT_MIN,s:Lk(`stat.${k}`),d:Lk(`debut.typeShort.${t}`),c:lbl});r.short=Lk('debut.short.wait',{f:Math.round(r.f),m:DEBUT_MIN})}
  return r;
}
export function recLine(a){const r=debutRec(a);const s=r.sc;return`<div class="prow"><b>${esc(a.name)}</b><span class="small">${r.t==='wait'?t('debut.wait'):`<b>${t(`debut.type.${r.t}`)}</b>`}<br><span class="muted">${esc(tx(r.why))}</span><br><span class="muted">${t('debut.fitLine',{f:Math.round(r.f),m:DEBUT_MIN,s:s.solo,a:s.actor})}${s.group!=null?' · '+t('debut.scoreGroup',{n:s.group}):''}</span></span><span class="sp"></span>${r.t==='wait'?'':`<button class="btn sm pri" onclick="applyRec(${a.id})">${t('btn.apply')}</button>`}</div>`}
export function applyRec(id){const a=byId(id);if(!a)return;const r=debutRec(a);if(r.t==='wait')return;$('#dType').value=r.t;$('#dType').onchange();
  if(r.t==='group')applyLineup(r.ids);else{const x=[...document.querySelectorAll('.dsel')].find(e=>+e.value===id);if(x){x.checked=true;x.onchange&&x.onchange()}}
  $('#dAna')?.scrollIntoView({behavior:'smooth',block:'center'})}
export function applyLineup(ids){document.querySelectorAll('.dsel').forEach(x=>x.checked=ids.includes(+x.value));if(!$('#dName').value)$('#dName').value=pick(GNAMES.filter(n=>!S.groups.some(g=>g.name===n)).concat(['Starlight '+R(2,9)]));document.querySelectorAll('.dsel')[0]?.onchange?.()}
export const DEBUT_COST={group:n=>120e6+n*20e6,solo:()=>80e6,actor:()=>50e6};
export function debut(){const type=$('#dType').value,ids=[...document.querySelectorAll('.dsel:checked')].map(x=>+x.value);debutIds(type,ids,type==='group'?($('#dName').value||''):'')}
export function debutIds(type,ids,name){
  const cost=DEBUT_COST[type](ids.length);
  if(type==='group'&&ids.length<2){toast(t('debut.toast.min2'));return false}
  if(type!=='group'&&ids.length!==1){toast(t('debut.toast.one'));return false}
  if(S.money<cost){toast(t('toast.noMoney'));return false}
  const mem=ids.map(byId);if(mem.some(a=>!a||a.busy)){toast(t('debut.toast.busy'));return false}
  name=type==='group'?String(name||'').trim().slice(0,24):'';
  if(type==='group'&&!name){toast(t('debut.toast.name'));return false}
  S.money-=cost;book('prod',-cost);
  for(const a of mem){
    if(a.status==='trainee'){a.status='debuted';a.debutYear=S.year;a.salary=Math.max(a.salary,4e6);a.ce=abs()+CT_WK;a.cs0=abs();a.earnC=0;a.dReady=0}
    const g=R(2000,7000)*(type==='actor'?.5:1);a.fans+=g;a.yr.fans+=g;a.mood=clamp(a.mood+15,0,100);if(a.cf0==null||a.cs0===abs())a.cf0=a.fans;
    if(a.mt){const mt=byId(a.mt);if(mt){const b=Math.round(g*.3)+500;mt.fans+=b;MOOD(mt,10);setRel(a,mt,getRel(a,mt)+10);addLog(Lk('log.deb.mt',{m:mt.name,n:a.name,f:fmtN(b)}),'good')}a.mtd=a.mt;a.mt=0}
    if(type==='solo'){if(groupsOf(a).length)givePM(a);a.solo=true}if(type==='actor')a.actor=true;
    if(type!=='actor')a.busy={kind:'promo',title:Lk('busy.showcase'),left:2,total:2,lk:'showcase'};
  }
  if(type==='group'){const ck=Object.keys(CONCEPTS).sort((x,y)=>avgFit(mem,CONCEPTS[y].w)-avgFit(mem,CONCEPTS[x].w))[0];S.groups.push({id:uid(),name,members:ids,y:S.year,concept:ck});addLog(Lk('log.deb.grp',{n:name,k:ids.length,c:Lk(`concept.${ck}`)}),'gold')}
  else addLog(Lk('log.deb.one',{n:mem[0].name,t:Lk(`debut.typeShort.${type==='solo'?'solo':'actor'}`)}),'gold');
  act();return true;
}
