import { R } from '../core/rng.js';
import { isK, money, t, t as tl, tVi, tx, txVi } from '../i18n/index.js';
import { clamp, esc, fmt, fmtN } from '../core/util.js';
import { CONCEPTS, GENRES } from '../data/rules.js';
import { S, abs, addLog, byId } from '../state.js';
import { fame } from './artists.js';
import { DEBUT_MIN, bestOf } from './debut.js';
import { removeArtist } from './events.js';
import { pct } from './ext2.js';
import { effSk } from './managers.js';
import { POST, PRE, campMem, postRec, preRec } from './promo.js';
import { actByKey, fanSugs, liveEst } from './releases.js';
import { actFree, acts, lastSingleW, secPlan, wkLabel } from './secretary.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';

/* ---- 4-week periodic reviews ---- */
export const EV_TTS=5;
export const EV_ART=10;
export const EV_PCT=20;
export const stSum=a=>Object.values(a.st).reduce((t,v)=>t+v,0);
export const evSnap=a=>{a.ev={st:stSum(a),f:a.fans,wc:a.wc||0,w:abs()}};
export const evNext=()=>4-(abs()%4)||4;
export function evalAll(){const R0={w:abs(),y:S.year,wk:S.week,t:[],a:[]};
  for(const a of [...S.artists]){
    if(!a.ev){evSnap(a);continue}
    if(a.status==='trainee'){
      const p=+((stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100).toFixed(1),rd=Math.max(bestOf(a,CONCEPTS)[0].f,bestOf(a,GENRES)[0].f)>DEBUT_MIN;
      const g=p>=35?'Xuất sắc':p>=27?'Tốt':(p>EV_PCT||rd)?'Đạt':'Không đạt';
      a.ttsFail=isK(g,'grade.fail')?(a.ttsFail||0)+1:0;
      R0.t.push({id:a.id,n:a.name,g,p,f:a.ttsFail});a.evG=g;
      if(isK(g,'grade.fail')){a.mood=clamp(a.mood-5,0,100);
        if(a.ttsFail>=EV_TTS){removeArtist(a,`bị loại khỏi chương trình đào tạo sau ${EV_TTS} lần đánh giá không đạt liên tiếp`);R0.t[R0.t.length-1].out=1;continue}
        if(a.ttsFail>=3)addLog(`⚠️ TTS ${a.name} không đạt đánh giá lần ${a.ttsFail}/${EV_TTS} liên tiếp. Thêm ${EV_TTS-a.ttsFail} lần nữa sẽ bị loại.`,'bad')}
      else if(isK(g,'grade.ex'))a.mood=clamp(a.mood+5,0,100);
    }else{
      const pct=(a.fans-a.ev.f)/Math.max(a.ev.f,2000)*100,wk=(a.wc||0)-a.ev.wc,pts=Math.round(pct+wk*6-(a.scandal?8:0));
      const g=pts>=20?'Xuất sắc':pts>=5?'Đạt':'Không đạt';let money=0;
      if(isK(g,'grade.ex')){money=-Math.max(5e6,Math.round(a.salary*2/1e6)*1e6);S.money+=money;a.mood=clamp(a.mood+10,0,100);a.evFail=0}
      else if(isK(g,'grade.pass'))a.evFail=0;
      else{money=Math.max(1e6,Math.round(a.salary/1e6)*1e6);S.money+=money;a.mood=clamp(a.mood-6,0,100);a.evFail=(a.evFail||0)+1}
      R0.a.push({id:a.id,n:a.name,g,pts,f:a.evFail||0,money});a.evG=g;
      if(isK(g,'grade.fail')){if(a.evFail>=EV_ART){removeArtist(a,`bị chấm dứt hợp đồng sau ${EV_ART} lần đánh giá không đạt liên tiếp`);R0.a[R0.a.length-1].out=1;continue}
        if(a.evFail>=7)addLog(`⚠️ ${a.name} không đạt đánh giá ${a.evFail}/${EV_ART} lần liên tiếp. Sắp bị chấm dứt hợp đồng!`,'bad')}
    }
    evSnap(a);
  }
  if(!R0.t.length&&!R0.a.length)return;
  S.lastEval=R0;
  const ex=R0.a.filter(x=>isK(x.g,'grade.ex')),fa=R0.a.filter(x=>isK(x.g,'grade.fail')),tf=R0.t.filter(x=>isK(x.g,'grade.fail'));
  addLog(`📋 Đánh giá định kỳ: TTS ${R0.t.length-tf.length}/${R0.t.length} đạt · Nghệ sĩ ${ex.length} xuất sắc${ex.length?` (thưởng ${fmt(-ex.reduce((t,x)=>t+x.money,0))})`:''}, ${fa.length} không đạt${fa.length?` (trừ ${fmt(fa.reduce((t,x)=>t+x.money,0))})`:''}.`,fa.length||tf.length?'':'good');
}
export function evalBrief(E){if(!E)return'';const tf=E.t.filter(x=>isK(x.g,'grade.fail')),ex=E.a.filter(x=>isK(x.g,'grade.ex')),fa=E.a.filter(x=>isK(x.g,'grade.fail'));
  return`<div class="card rep">${t('rep.ev.h',{yw:t('common.wkShort',{w:E.wk})+' '+t('common.wkYear',{y:E.y})})}<br>${t('rep.ev.tts',{a:E.t.length-tf.length,b:E.t.length})}${tf.length?` · <span class="w">${tf.map(x=>esc(x.n)+(x.out?t('rep.ev.out'):` ${x.f}/${EV_TTS}`)).join(', ')}</span>`:''}<br>${t('rep.ev.art')} ${ex.length?t('rep.ev.ex',{n:ex.map(x=>esc(x.n)).join(', ')}):t('rep.ev.noex')}${fa.length?` · <span class="w">${fa.map(x=>esc(x.n)+(x.out?t('rep.ev.term'):` ${x.f}/${EV_ART}`)).join(', ')}</span>`:''}</div>`}
export function evalTable(E){if(!E)return`<div class="small muted">${t('eval.none')}</div>`;const gc=g=>isK(g,'grade.ex')?'tag s':isK(g,'grade.good')||isK(g,'grade.pass')?'tag m':'tag r';
  return`${E.t.length?`<div class="small">${t('eval.ttsH',{p:EV_PCT,d:DEBUT_MIN})}</div>${E.t.map(x=>`<div class="prow"><b>${esc(x.n)}</b><span class="${gc(x.g)}">${tx(x.g)}</span><span class="small muted">${x.p>=0?'+':''}${x.p}%${isK(x.g,'grade.fail')?` · ${x.out?t('eval.out'):t('eval.fail',{f:x.f,n:EV_TTS})}`:''}</span></div>`).join('')}`:''}
  ${E.a.length?`<div class="small" style="margin-top:6px">${t('eval.artH')}</div>${E.a.map(x=>`<div class="prow"><b>${esc(x.n)}</b><span class="${gc(x.g)}">${tx(x.g)}</span><span class="small muted">${t('eval.pts',{n:x.pts})}${x.money<0?t('eval.bonus',{m:money(-x.money)}):x.money>0?t('eval.cut',{m:money(x.money)}):''}${isK(x.g,'grade.fail')?` · ${x.out?t('eval.term'):t('eval.fail',{f:x.f,n:EV_ART})}`:''}</span></div>`).join('')}`:''}`}
/* ---- PR Room: suggested promotion plans ---- */
export const PRP={
  sns:{ic:'📱',c:15e6},
  press:{ic:'📰',c:5e6},
  mag:{ic:'📷',c:8e6},
  tts:{ic:'🎥',c:8e6},
  actor:{ic:'🎬',c:12e6}
};
export const PR_CD=4;
export function prSk(){return S.managers.reduce((m,x)=>Math.max(m,effSk(x,'pr')),0)}
export function prCool(t,k){const u=(S.prUsed||{})[t+':'+k];return u!=null&&abs()-u<PR_CD}
export function prMem(k){return k==='tts'?S.artists.filter(a=>a.status==='trainee'):k[0]==='a'?[byId(+k.slice(1))].filter(Boolean):campMem(k)}
export function prName(k){if(k==='tts')return'tất cả thực tập sinh';if(k[0]==='a'){const a=byId(+k.slice(1));return a?a.name:'?'}const x=actByKey(k);return x?x.n.slice(2).trim():'?'}
export function prPlans(){const L=[],now=abs();const W=(k,p)=>({t:tVi(k,p),tt:t(k,p)});
  for(const x of acts()){const k=x.k,c=S.camp[k],nm=esc(x.n.slice(2).trim()),ms=campMem(k);if(!ms.length)continue;
    if(c&&c.ph==='post'){const r=postRec(k);if(r.length&&!(c.used.wk===now&&c.used.l.length))L.push({hot:1,pri:9,ic:'🎤',...W('pr.t.post',{n:nm}),why:t('pr.why.post',{t:esc(c.t),r:c.rank,l:r.map(id=>t(`promo.post.${id}`)).join(', ')}),cost:0,go:`postAuto('${k}')`});continue}
    if(!actFree(x))continue;
    const pl=(S.cbPlan||[]).find(p=>p.k===k),sp=secPlan(x),soon=pl||(c&&c.ph==='pre')||(sp&&!sp.wait);
    if(soon){const r=preRec(k);if(r.length)L.push({hot:1,pri:8,ic:'📣',...W('pr.t.pre',{n:nm}),why:t('pr.why.pre',{s:pl?t('pr.why.preAt',{w:wkLabel(pl.w)}):t('pr.why.preSoon'),h:c?c.hype:0,l:r.map(id=>t(`promo.pre.${id}`)).join(', ')}),cost:r.reduce((t,id)=>t+PRE[id].c,0),go:`preAuto('${k}')`})}
    const lw=lastSingleW(x),gap=lw?now-lw:99;
    if(!soon&&gap>=8&&!prCool('sns',k))L.push({pri:5,ic:PRP.sns.ic,...W('pr.t.sns',{n:nm}),why:gap>=99?t('pr.why.snsNone'):t('pr.why.snsGap',{n:gap}),cost:PRP.sns.c,go:`prDo('sns','${k}')`});
    if(soon&&!prCool('sns',k))L.push({pri:6,ic:PRP.sns.ic,...W('pr.t.snsPre',{n:nm}),why:t('pr.why.snsPre'),cost:PRP.sns.c,go:`prDo('sns','${k}')`});
    if(ms.some(a=>a.scandal)&&!prCool('press',k))L.push({hot:1,pri:7,ic:PRP.press.ic,...W('pr.t.press',{n:nm}),why:t('pr.why.press'),cost:PRP.press.c,go:`prDo('press','${k}')`});
    else if(!prCool('mag',k)&&!prCool('press',k)&&gap>=5&&gap<99&&Math.min(...ms.map(a=>a.st.visual))>=45)L.push({pri:3,ic:PRP.mag.ic,...W('pr.t.mag',{n:nm}),why:t('pr.why.mag'),cost:PRP.mag.c,go:`prDo('mag','${k}')`});
  }
  for(const a of S.artists.filter(a=>a.actor&&!a.busy)){const k='a'+a.id;if(prCool('actor',k))continue;const gap=a.lastFan?now-a.lastFan:99;
    if(gap>=4||a.wantAct)L.push({pri:4,ic:PRP.actor.ic,...W('pr.t.actor',{n:esc(a.name)}),why:a.wantAct?t('pr.why.actorWant'):t('pr.why.actorGap'),cost:PRP.actor.c,go:`prDo('actor','${k}')`})}
  const tts=S.artists.filter(a=>a.status==='trainee');
  if(tts.length>=2&&!prCool('tts','tts'))L.push({pri:4,ic:PRP.tts.ic,...W('pr.t.tts',{n:tts.length}),why:t('pr.why.tts'),cost:PRP.tts.c,go:`prDo('tts','tts')`});
  for(const f of fanSugs().slice(0,3))L.push(f.t==='fm'?{pri:6,ic:'💝',...W('pr.t.fm',{n:esc(f.n.slice(2).trim())}),why:t('pr.why.fm',{w:esc(f.why),n:fmtN(f.est)}),cost:f.cost,go:`doFM('${f.k}')`}:{pri:2,ic:'📱',...W('pr.t.live',{n:esc(f.n)}),why:t('pr.why.live',{w:esc(f.why),m:money(liveEst([byId(f.id)]))}),cost:1e6,go:`doLive([${f.id}])`});
  return L.sort((a,b)=>b.pri-a.pri)}
export function prHTML(L){const sk=prSk();
  return`<div class="small muted" style="margin-bottom:6px">${t('pr.intro',{sk,p:Math.round(sk*4)})}</div>`+
  (L.map(p=>`<div class="card prp ${p.hot?'hot':''}"><div class="row"><b>${p.ic} ${p.tt}</b><span class="sp"></span><span class="small muted">${p.cost?money(p.cost):t('pr.free')}</span></div><div class="small muted">${p.why}</div><div class="row" style="margin-top:6px"><span class="sp"></span><button class="btn sm pri" onclick="prGo(this)" data-t="${p.t}" data-go="${p.go}">${t('pr.approve')}</button></div></div>`).join('')||`<div class="small muted">${t('pr.none')}</div>`)}
export function prGo(btn){const f=btn.dataset.go,t=btn.dataset.t||'';S.prHist=S.prHist||[];S.prHist.unshift(`${txVi(wkLabel(abs()))}: ${t.replace(/<[^>]+>/g,'')}`);if(S.prHist.length>40)S.prHist.length=40;new Function(f)()}
export function prDo(t,k){const P=PRP[t];if(!P)return;if(S.money<P.c)return toast(tl('toast.noMoney'));const ms=prMem(k);if(!ms.length)return;
  S.money-=P.c;S.prUsed=S.prUsed||{};S.prUsed[t+':'+k]=abs();const mu=1+prSk()*.04,nm=prName(k);let tf=0;
  const gF=n=>ms.forEach(a=>{const g=Math.round(R(n[0],n[1])*mu*(1+fame(a)/100));a.fans+=g;if(a.yr)a.yr.fans+=g;tf+=g});
  let msg='';
  if(t==='sns'){gF([600,2000]);const c=S.camp[k];let h='';if(c&&c.ph==='pre'){const d=Math.round(6*mu);c.hype=Math.min(80,c.hype+d);h=`, +${d} hype`}msg=`${P.ic} Quảng cáo SNS cho ${nm}: +${fmtN(tf)} fan${h}.`}
  else if(t==='press'){gF([200,700]);ms.forEach(a=>{if(a.scandal&&a.scandal.left>1)a.scandal.left--;a.mood=clamp(a.mood+3,0,100)});msg=`${P.ic} ${nm} trả lời phỏng vấn, dư luận dịu lại (+${fmtN(tf)} fan).`}
  else if(t==='mag'){gF([300,900]);ms.forEach(a=>a.st.visual=clamp(+(a.st.visual+1).toFixed(1),0,100));msg=`${P.ic} ${nm} lên tạp chí: +${fmtN(tf)} fan, Visual +1.`}
  else if(t==='tts'){gF([80,300]);ms.forEach(a=>a.mood=clamp(a.mood+5,0,100));msg=`${P.ic} Clip của ${ms.length} thực tập sinh lan truyền: +${fmtN(tf)} fan, cả lứa vui hơn.`}
  else if(t==='actor'){gF([300,1000]);ms.forEach(a=>{a.st.acting=clamp(+(a.st.acting+.5).toFixed(1),0,100);a.lastFan=abs()});msg=`${P.ic} ${nm} quảng bá hình ảnh: +${fmtN(tf)} fan, Diễn xuất +0.5.`}
  if(t!=='tts')ms.forEach(a=>a.wc=(a.wc||0)+1);
  addLog(msg,'good');act()}
