import { R, pick, rnd } from '../core/rng.js';
import { $, clamp, esc, fmt, fmtN } from '../core/util.js';
import { FT1, FT2, SONGS } from '../data/names.js';
import { CONCEPTS, GENRES } from '../data/rules.js';
import { S, abs, addLog, byId, uid } from '../state.js';
import { fame, fit } from './artists.js';
import { pushEv } from './events.js';
import { MOOD, book, gHiatus, sgBonus } from './ext2.js';
import { mgrExp, mgrOf } from './managers.js';
import { rivalPress, trendB } from './market.js';
import { POST, PRE, PROMO_WK, campMem, postRec, preRec } from './promo.js';
import { harmony } from './relations.js';
import { actFree, acts, wkLabelT } from './secretary.js';
import { lbl, money, t } from '../i18n/index.js';
import { act } from '../ui/building.js';
import { closeM, modal, toast } from '../ui/modal.js';

/* ---- Giao lưu fan: livestream & fan meeting ---- */
export function liveInc(a){return Math.round((a.fans*300+1.2e6)*(1+fame(a)/200)*rnd(.7,1.3)/1e5)*1e5}
export function liveEst(ms){return ms.reduce((t,a)=>t+Math.round((a.fans*300+1.2e6)*(1+fame(a)/200)/1e5)*1e5,0)}
export function doLive(ids,quiet){const ms=ids.map(byId).filter(Boolean).filter(a=>a.lastLive!==abs());if(!ms.length)return quiet||toast(t('rel.toast.liveDone'));if(S.money<1e6)return quiet||toast(t('common.noMoney'));
  S.money-=1e6;let inc=0;for(const a of ms){inc+=liveInc(a);const g=Math.round(a.fans*.01+R(200,800)*(1+fame(a)/60));a.fans+=g;a.yr.fans+=g;a.mood=clamp(a.mood+8,0,100);a.energy=clamp(a.energy-4,0,100);a.lastLive=abs();a.lastFan=abs()}
  S.money+=inc;book('live',inc,ms);addLog(`📱 ${ms.length>3?ms.length+' người':ms.map(a=>a.name).join(', ')} livestream trò chuyện với fan, thu ${fmt(inc)} tiền donate và quảng cáo (chi 1 tr).`,inc>1e6?'good':'');if(!quiet)toast(t('rel.toast.liveGot',{m:money(inc)}));
  if(Math.random()<.03){const a=pick(ms);if(!a.scandal&&a.status==='debuted'){a.scandal={t:'Lỡ lời khi livestream',sev:1,left:2,truth:true,dating:false,other:0};pushEv({kind:'scandal',a:a.id},true);addLog(`😬 ${a.name} lỡ lời khi livestream, dân mạng bàn tán.`,'bad')}}
  if(!quiet)act()}
export const fmCost=x=>40e6+x.m.length*10e6;
export function doFM(k){const x=actByKey(k);if(!x)return;if(!actFree(x))return toast(t('rel.toast.busy'));const ms=campMem(k),tf=ms.reduce((t,a)=>t+a.fans,0);if(tf<10000)return toast(t('rel.toast.fm10k'));const c=fmCost(x);if(S.money<c)return toast(t('common.noMoney'));
  S.money-=c;book('prod',-c);const seats=Math.round(Math.min(tf*.03,8000)*rnd(.8,1.1)),inc=seats*150000;S.money+=inc;book('con',inc,ms);
  for(const a of ms){a.fans=Math.round(a.fans*1.03);a.mood=clamp(a.mood+12,0,100);a.energy=clamp(a.energy-10,0,100);a.lastFan=abs();a.wc=(a.wc||0)+1;a.busy={kind:'concert',title:'Fan meeting',left:1,total:1}}
  S.fmLast=S.fmLast||{};S.fmLast[k]=abs();if(S.fmHint)delete S.fmHint[k];
  addLog(`💝 Fan meeting của ${x.n.slice(2).trim()}: ${fmtN(seats)} fan tham dự, thu ${fmt(inc)} (chi ${fmt(c)}).`,'gold');act()}
export function fanSugs(){const now=abs(),L=[];
  for(const x of acts()){if(!actFree(x))continue;const ms=campMem(x.k),tf=ms.reduce((t,a)=>t+a.fans,0),last=(S.fmLast||{})[x.k],gap=last?now-last:99;
    if(tf<10000||gap<16)continue;const why=(S.fmHint||{})[x.k]&&now-S.fmHint[x.k]<=4?t('fan.why.promoEnd'):ms.some(a=>a.mood<45)?t('fan.why.sad'):gap>=99?t('fan.why.neverFm'):t('fan.why.sinceFm',{w:t('unit.weeks',{n:gap})});
    L.push({t:'fm',k:x.k,n:x.n,why,est:Math.round(Math.min(tf*.03,8000)),cost:fmCost(x),pri:(S.fmHint||{})[x.k]?3:2})}
  for(const a of S.artists){if(a.status!=='debuted'||a.lastLive===now)continue;const gap=a.lastFan?now-a.lastFan:99;let why='';
    if(a.mood<45)why=t('fan.why.lowMood');else if(a.scandal)why=t('fan.why.rumor');else if(gap>=6)why=gap>=99?t('fan.why.neverLive'):t('fan.why.sinceFan',{w:t('unit.weeks',{n:gap})});
    if(why)L.push({t:'live',id:a.id,n:a.name,why,pri:a.mood<45?2.5:1})}
  return L.sort((a,b)=>b.pri-a.pri).slice(0,8)}
export function fanHTML(){const L=fanSugs();if(!L.length)return`<div class="small muted">${t('fan.none')}</div>`;
  return L.map(f=>f.t==='fm'?`<div class="prow">💝 <b>${esc(f.n)}</b><span class="small">${t('fan.fm',{n:fmtN(f.est),m:money(f.est*150000-f.cost)})}<br><span class="muted">${esc(f.why)}</span></span><span class="sp"></span><button class="btn sm pri" onclick="doFM('${f.k}')">${t('fan.hold',{m:money(f.cost)})}</button></div>`
    :`<div class="prow">📱 <b>${esc(f.n)}</b><span class="small muted">${esc(f.why)}</span><span class="sp"></span><button class="btn sm" onclick="doLive([${f.id}])">${t('fan.live',{m:money(liveEst([byId(f.id)]))})}</button></div>`).join('')}
export function viewCamp(k){const x=actByKey(k);if(!x)return closeM();const c=S.camp[k],ms=campMem(k),nm=esc(x.n),free=actFree(x),pl=(S.cbPlan||[]).find(p=>p.k===k);
  const eRow=`<div class="small">${t('camp.energy',{l:ms.map(a=>`${esc(a.name)} <b class="${a.energy<35?'bad':''}">${Math.round(a.energy)}</b>`).join(' · ')})}</div>`;
  let body='';
  if(c&&c.ph==='post'){const u=c.used.wk===abs()?c.used.l:[],rec=postRec(k);
    body=`<div class="grid2"><div class="card small">${t('camp.rank',{r:c.rank,b:c.best})}</div><div class="card small">${t('camp.stats',{w:c.wins,s:c.stages,n:c.wn+1,m:PROMO_WK,i:money(c.inc)})}</div></div>${eRow}
    <h3>${t('camp.thisWeek')}</h3><div class="card">${Object.keys(POST).map(id=>{const P=POST[id],dn=u.includes(id);return`<div class="prow" style="${dn?'opacity:.55':''}">${P.ic} <b>${lbl('post',id)}</b><span class="small muted">−${P.e}⚡${P.stage?' · '+t('camp.chance'):id==='fansign'?' · '+t('camp.album'):id==='challenge'?' · '+t('camp.viral'):''}</span><span class="sp"></span>${dn?'<span class="tag m">✓</span>':`<button class="btn sm${rec.includes(id)?' pri':''}" onclick="postDo('${k}','${id}')">${t('camp.do')}</button>`}</div>`}).join('')}</div>
    <div class="card small">🗒️ <b>${t('camp.secRec')}</b> ${rec.length?rec.map(id=>lbl('post',id)).join(t('list.sep'))+' '+t('camp.keepE'):t('camp.restThem')} ${rec.length?`<button class="btn sm pri" onclick="postAuto('${k}')">${t('camp.followRec')}</button>`:''}</div>
    <label class="small row"><input type="checkbox" ${S.autoPromo!==false?'checked':''} onchange="S.autoPromo=this.checked;save()"> ${t('camp.auto')}</label>`}
  else{const rec=free?preRec(k):[],h=c?c.hype:0;
    body=`<div class="card small">${t('camp.hype',{h})}${pl?`<br>${t('camp.booked',{w:wkLabelT(pl.w)})}`:''}</div>
    <div class="bar" style="margin:6px 0"><i style="width:${h/.8}%;background:var(--pink)"></i></div>${eRow}
    <h3>${t('camp.preTitle')}</h3>${free?`<div class="card">${Object.keys(PRE).map(id=>{const P=PRE[id],dn=c&&c.done[id];return`<div class="prow" style="${dn?'opacity:.55':''}">${P.ic} <b>${lbl('pre',id)}</b><span class="small muted">${lbl('pre','d.'+id)} · +${P.h} hype · ${P.c?money(P.c):t('common.free')}${P.e?' · −'+P.e+'⚡':''}</span><span class="sp"></span>${dn?'<span class="tag m">✓</span>':`<button class="btn sm${rec.includes(id)?' pri':''}" onclick="preDo('${k}','${id}')">${t('camp.do')}</button>`}</div>`}).join('')}</div>
    <div class="card small">🗒️ <b>${t('camp.secRec')}</b> ${rec.length?rec.map(id=>lbl('pre',id)).join(t('list.sep')):t('camp.noMore')}. ${rec.length?`<button class="btn sm pri" onclick="preAuto('${k}')">${t('camp.followRec')}</button>`:''}</div>
    <div class="row"><button class="btn" onclick="view(viewSec)">${t('sec.title')}</button><span class="sp"></span>${pl?'':`<button class="btn pink" onclick="cbNow('${k}')">${t('sec.comebackNow')}</button>`}</div>`:`<div class="card small muted">${t('camp.busy')}</div>`}`}
  modal(`<h2>${t('camp.title',{n:nm})}</h2><div class="sub">${c&&c.ph==='post'?t('camp.subPost',{t:esc(c.t),w:t('unit.weeks',{n:PROMO_WK})}):t('camp.subPre')}</div>${body}
  <h3>${t('camp.fanTitle')}</h3><div class="card">${fanHTML()}</div>`)}
export function actByKey(k){return acts().find(x=>x.k===k)}
export function releaseSingle(){doSingle($('#sAct').value,$('#sCon').value,+$('#sBud').value,$('#sTitle').value,false,+($('#sSong')?.value||0))}
export function doSingle(ak,ck,bud,title,silent,sid){
  title=(title||pick(SONGS)).trim().slice(0,40);
  const A=actByKey(ak);if(!A){if(!silent)toast(t('rel.toast.pickAct'));return false}
  if(gHiatus(ak)){if(!silent)toast(t('rel.toast.hiatus'));return false}
  const sg=sid?(S.songs||[]).find(x=>x.id===sid&&x.st==='ok'):null;if(sg){ck=sg.ck;title=sg.t}
  const mem=A.m.map(byId).filter(Boolean);
  if(mem.some(a=>a.busy)){if(!silent)toast(t('rel.toast.memBusy'));return false}
  if(S.money<bud){if(!silent)toast(t('common.noMoney'));return false}
  S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!==ak);
  S.money-=bud;book('prod',-bud);
  const w=CONCEPTS[ck].w,ft=mem.reduce((s,a)=>s+fit(a,w),0)/mem.length,fm=mem.reduce((s,a)=>s+fame(a),0)/mem.length;
  const h=harmony(A.m),bb=bud>=200e6?16:bud>=80e6?8:0;
  const pc=S.camp[ak],hp=pc&&pc.ph==='pre'?pc.hype:0;
  const tb=trendB(ck),rp=rivalPress(),score=ft*.6+fm*.3+bb+R(0,20)+h+tb-rp+hp*.25+sgBonus(sg,A.m);
  const rank=clamp(Math.round(118-score),1,100);
  const sales=Math.round(Math.pow(101-rank,1.8)*30*(1+fm/100));
  const inc=sales*5000;S.money+=inc;book('sgl',inc,mem);
  for(const a of mem){const g=Math.round((101-rank)*R(60,130)*(1+fm/100)*(1+hp/100));a.fans+=g;a.yr.fans+=g;a.busy={kind:'promo',title:'Quảng bá «'+title+'»',left:PROMO_WK,total:PROMO_WK};a.mood=clamp(a.mood+5,0,100);a.hist.unshift(`N${S.year}: Single «${title}» – hạng ${rank}`);a.wc=(a.wc||0)+1}
  {const ms=new Set(mem.map(mgrOf).filter(Boolean));ms.forEach(m=>mgrExp(m))}
  S.singles.unshift({title,act:A.n,m:A.m,rank,y:S.year,concept:CONCEPTS[ck].n,k:ak,w:abs(),dig:Math.round(inc*.08/1e4)*1e4,dk:rank<=10?.93:rank<=40?.9:.86,dt:0,roy:sg?0:.15,sg:sg?sg.id:0});
  if(sg){sg.st='used';sg.rank=rank;sg.act=A.n;const ws=sg.by.map(byId).filter(Boolean);ws.forEach(a=>{const g=Math.round((101-rank)*R(20,50));a.fans+=g;a.yr.fans+=g;MOOD(a,10);a.hist.unshift(`N${S.year}: Sáng tác «${title}» – hạng ${rank}`)});addLog(`✍️ «${title}» do ${ws.map(a=>a.name).join(', ')} sáng tác, công ty giữ trọn doanh thu nhạc số.`,'good')}
  addLog(`💿 Single «${title}» của ${A.n.slice(2).trim()} (${CONCEPTS[ck].n}) đạt hạng ${rank}! Doanh thu ${fmt(inc)}.${tb>0?' 🔥 Hợp xu hướng.':tb<0?' ❄️ Concept đã hết thời.':''}${rp?' ⚔️ Bị đối thủ cạnh tranh.':''}${h<0?' Mâu thuẫn nội bộ kéo điểm xuống.':''}`,rank<=10?'gold':'good');
  if(hp)addLog(`📣 Hype ${hp} từ hoạt động teaser giúp «${title}» ra mắt mạnh hơn.`,'good');
  S.camp[ak]={k:ak,n:A.n,ph:'post',t:title,ck,rank,best:rank,wins:0,stages:0,wn:0,used:{wk:abs(),l:[]},hype:hp,inc:0};
  if(!silent)act();return true;
}
export function holdConcert(k){
  const A=actByKey(k||$('#cAct').value);if(!A)return toast(t('rel.toast.pickAct'));
  const mem=A.m.map(byId).filter(Boolean),tf=mem.reduce((s,a)=>s+a.fans,0);
  if(tf<30000)return toast(t('rel.toast.con30k'));
  if(mem.some(a=>a.busy))return toast(t('rel.toast.memBusy'));
  if(gHiatus(A.k))return toast(t('rel.toast.hiatus'));
  if(S.money<200e6)return toast(t('rel.toast.need',{m:money(200e6)}));
  S.money-=200e6;book('prod',-200e6);
  const aud=Math.round(Math.min(tf*.04*rnd(.8,1.2),60000)),inc=aud*500000;S.money+=inc;book('con',inc,mem);
  for(const a of mem){a.fans=Math.round(a.fans*1.08);a.mood=clamp(a.mood+10,0,100);a.energy=clamp(a.energy-25,0,100);a.busy={kind:'concert',title:'Concert',left:1,total:1}}
  S.concerts.push({act:A.n,aud,y:S.year,m:A.m,k:A.k,w:abs()});
  addLog(`🏟️ Concert của ${A.n.slice(2).trim()}: ${fmtN(aud)} khán giả, doanh thu ${fmt(inc)}.`,'gold');act();
}
export function produceFilm(){
  const genre=$('#fGen').value,bud=+$('#fBud').value,title=($('#fTitle').value||pick(FT1)+' '+pick(FT2)).trim().slice(0,40);
  const cast=[...document.querySelectorAll('.fcast:checked')].map(x=>+x.value);
  if(!cast.length)return toast(t('rel.toast.pickCast'));
  if(cast.length>3)return toast(t('rel.toast.max3'));
  if(S.money<bud)return toast(t('common.noMoney'));
  S.money-=bud;book('prod',-bud);
  const f={id:uid(),title,genre,own:true,budget:bud,share:1,cost:bud,cast,status:'Đang quay',releaseAt:0,done:false,y:S.year};
  S.films.push(f);
  for(const id of cast){const a=byId(id);a.busy={kind:'shoot',filmId:f.id,title,left:8,total:8}}
  addLog(`🎬 Khởi quay phim ${GENRES[genre].n} «${title}», kinh phí ${fmt(bud)}.`,'gold');act();
}
