import { R } from '../core/rng.js';
import { $, clamp, esc, fmtN } from '../core/util.js';
import { OFFER } from '../data/offers.js';
import { CONCEPTS, ROOMS, TRAIN } from '../data/rules.js';
import { save } from '../save/storage.js';
import { S, abs } from '../state.js';
import { cleanBatches } from '../systems/ext2.js';
import { mgrTargets, targetName } from '../systems/managers.js';
import { campMem } from '../systems/promo.js';
import { datingPartner } from '../systems/relations.js';
import { prPlans } from '../systems/review.js';
import { money, t } from '../i18n/index.js';
import { curView } from './modal.js';

export let pos={};
export function renderTrend(){const el=$('#trendBar');if(!el||!S.trend)return;const L=S.trend.until-abs(),cb=S.rivals.filter(r=>r.cb&&r.cb.w>=abs()-1);
  const ms=Object.values(S.mods||{}).filter(m=>m.until>abs());
  el.innerHTML=`🔥 Thịnh hành: <b>${S.trend.hot.map(k=>CONCEPTS[k].n).join(', ')}</b> <span class="muted">· ❄️ ${CONCEPTS[S.trend.cold].n} · còn ${L} tuần</span>${cb.length?` · ⚔️ ${cb.length} đối thủ comeback`:''}${ms.length?` · ${ms.map(m=>esc(m.n)).join(' · ')}`:''}`}
/* ================= RENDER: BUILDING ================= */
export function chibiHTML(a,extra=''){
  const L=a.look,st=L.style||(L.long?'long':'short'),c=L.hair;
  const back=st==='long'?`<div class="hb" style="background:${c}"></div>`:st==='twin'?`<div class="tw l" style="background:${c}"></div><div class="tw r" style="background:${c}"></div>`:st==='pony'?`<div class="po" style="background:${c}"></div>`:st==='bun'?`<div class="bn" style="background:${c}"></div>`:'';
  const ar=`--o:${L.out};--s:${L.skin}`;
  return`<div class="cw"><div class="cb"><div class="shd"></div>${back}<div class="lg l"></div><div class="lg r"></div>${L.skirt?`<div class="sk" style="background:${L.out}"></div>`:''}<div class="ar l" style="${ar}"></div><div class="ar r" style="${ar}"></div><div class="bd" style="background:${L.out}"><i></i></div><div class="hd" style="background:${L.skin}"><div class="hf${st==='spiky'?' spk':''}" style="background:${c}"></div><i class="e l"></i><i class="e r"></i><i class="bl l"></i><i class="bl r"></i><i class="mo"></i></div></div></div>${extra}`;
}
export const blinkD=id=>`--d:-${(String(id).split('').reduce((s,ch)=>s+ch.charCodeAt(0),0)%50)/10}s`;
export const PROPS={
  ceo:`<i class="win" style="left:38%"></i><i class="desk" style="right:8%;width:40%"></i><i class="pp" style="right:20%;bottom:37px;font-size:17px">🖥️</i><i class="pp" style="left:8px;bottom:22px;font-size:26px">🪴</i><i class="pp" style="left:14%;top:38px;font-size:16px">🏆</i>`,
  meet:`<i class="board" style="left:24%;width:44%">📊</i><i class="desk" style="left:14%;width:72%"></i><i class="pp" style="left:28%;bottom:37px;font-size:13px">☕</i><i class="pp" style="right:24%;bottom:37px;font-size:13px">📄</i>`,
  studio:`<i class="booth"></i><i class="pp" style="right:15%;bottom:24px;font-size:24px">🎙️</i><i class="desk" style="left:6%;width:38%"></i><i class="pp" style="left:12%;bottom:37px;font-size:18px">🎚️</i><i class="pp" style="left:12%;top:36px;font-size:16px">🎧</i>`,
  acting:`<i class="curtain" style="left:0"></i><i class="curtain" style="right:0"></i><i class="pp" style="right:20px;bottom:22px;font-size:26px">🎥</i><i class="pp" style="left:22px;top:30px;font-size:18px">💡</i><i class="pp" style="left:46%;top:36px;font-size:16px">🎬</i>`,
  vocal:`<i class="pp" style="left:6px;bottom:20px;font-size:32px">🎹</i><i class="pp" style="left:40%;top:36px;font-size:18px">🎼</i><i class="pp" style="right:12px;bottom:22px;font-size:24px">🎤</i>`,
  dance:`<i class="mirror"></i><i class="pp" style="left:48%;top:26px;font-size:18px">🪩</i><i class="pp" style="right:6px;bottom:22px;font-size:22px">🔊</i>`,
  gym:`<i class="pp" style="left:8px;bottom:22px;font-size:26px">🏋️</i><i class="desk" style="right:6%;width:30%"></i><i class="pp" style="right:12%;bottom:37px;font-size:16px">💄</i><i class="pp" style="left:42%;top:36px;font-size:16px">🪞</i>`,
  pr:`<i class="board" style="left:30%;width:36%;background:#222;border-color:#555">📺</i><i class="pp" style="left:8px;top:38px;font-size:16px">📰</i><i class="pp" style="right:10px;bottom:22px;font-size:22px">📷</i>`,
  lobby:`<i class="pp" style="left:40%;top:30px;font-size:30px;opacity:.35">⭐</i><i class="desk" style="left:6%;width:34%;height:22px"></i><i class="pp" style="left:18%;bottom:44px;font-size:13px">🛎️</i><i class="pp" style="right:8px;bottom:22px;font-size:26px">🪴</i>`,
  dorm:`<i class="win" style="left:44%;background:linear-gradient(#2b2f6b,#6b5ca8)"></i><i class="pp" style="left:47%;top:38px;font-size:14px">🌙</i><i class="bed" style="left:6px"></i><i class="bed" style="right:6px"></i><i class="pp" style="left:22px;bottom:36px;font-size:13px">🧸</i>`,
  mgr:`<i class="board" style="left:36%;width:30%">📋</i><i class="desk" style="left:6%;width:28%"></i><i class="desk" style="right:6%;width:28%"></i><i class="pp" style="left:12%;bottom:37px;font-size:15px">💻</i><i class="pp" style="right:12%;bottom:37px;font-size:15px">💻</i>`,
  invest:`<i class="desk" style="left:8%;width:40%"></i><i class="pp" style="left:16%;bottom:37px;font-size:16px">💹</i><i class="pp" style="right:10%;bottom:22px;font-size:26px">🏦</i><i class="pp" style="left:46%;top:34px;font-size:18px">💰</i>`,
  market:`<i class="board" style="left:24%;width:50%">📊</i><i class="pp" style="left:8px;bottom:22px;font-size:22px">🗞️</i><i class="pp" style="right:10px;bottom:22px;font-size:22px">🔭</i>`,
  sales:`<i class="board" style="left:30%;width:40%">📈</i><i class="desk" style="left:6%;width:30%"></i><i class="pp" style="left:12%;bottom:37px;font-size:15px">🧮</i><i class="pp" style="right:10px;bottom:22px;font-size:24px">💹</i>`,
  hr:`<i class="desk" style="right:8%;width:36%"></i><i class="pp" style="right:18%;bottom:37px;font-size:15px">📄</i><i class="pp" style="left:10px;bottom:22px;font-size:26px">🗄️</i><i class="pp" style="left:42%;top:34px;font-size:16px">🤝</i>`,
  roof:`<i class="city"></i><i class="fence"></i><i class="pp" style="left:12%;bottom:22px;font-size:30px">⛱️</i><i class="pp" style="right:8px;bottom:22px;font-size:22px">🪴</i><i class="pp" style="left:34%;bottom:24px;font-size:14px">🍹</i>`
};
export function roomOf(a){if(a.busy)return null;const k=a.days?a.days[0]:a.sched;if(k==='rest')return['lobby','roof','dorm'][a.id%3];return TRAIN[k].room}
export function mgrRoom(m){if(!m.as)return'mgr';for(const a of mgrTargets(m)){const r=roomOf(a);if(r)return r}return null}
export const NPC=[{id:'n1',room:'ceo',name:'Bạn (GĐ)',look:{hair:'#2b2233',skin:'#f8d0b0',out:'#333a56',style:'short'}},{id:'n2',room:'meet',name:'🗒️ Thư ký',look:{hair:'#5a3825',skin:'#ffe0c7',out:'#e9e9f2',style:'bun',skirt:true}},{id:'n3',room:'lobby',name:'Lễ tân',look:{hair:'#c98b4b',skin:'#eebf98',out:'#16b98f',style:'pony',skirt:true}},{id:'n4',room:'studio',name:'🎼 GĐ Âm nhạc',look:{hair:'#1d1d2b',skin:'#eebf98',out:'#9b5de5',style:'spiky'}}];
export function roomBadge(id){
  if(id==='meet'){const n=S.offers.length+S.events.length;return n?`<span class="badge">${n}</span>`:''}
  if(id==='pr'){const n=S.artists.filter(a=>a.scandal).length,p=prPlans().length;return n?`<span class="badge">${n}🚨</span>`:p?`<span class="badge" style="background:var(--violet)">${p} 📣</span>`:''}
  if(id==='mgr'){const n=S.managers.filter(m=>!m.as).length;return n?`<span class="badge" style="background:var(--violet)">${n} rảnh</span>`:''}
  if(id==='studio'){const n=(S.songs||[]).filter(s=>s.st==='review').length;return n?`<span class="badge" style="background:var(--violet)">${n} 🎼</span>`:''}
  if(id==='hr'){const n=S.artists.filter(a=>a.status==='debuted'&&a.ce&&a.ce-abs()<=8&&!a.ceNo).length;return n?`<span class="badge">${n} 📄</span>`:''}
  if(id==='sales'){const n=S.singles.filter(s=>s.dig&&!s.end).length;return n?`<span class="badge" style="background:var(--mint)">${n} 🎧</span>`:''}
  if(id==='invest'){const n=(S.biz||[]).length;return n?`<span class="badge" style="background:var(--mint)">${n}</span>`:''}
  if(id==='market'){const n=(S.rivals||[]).filter(r=>r.cb&&r.cb.w>=abs()-1).length;return n?`<span class="badge">⚔️${n}</span>`:''}
  if(id==='lobby'){const n=S.artists.filter(a=>a.status==='trainee').length,c=(S.comps||[]).length;return n?`<span class="badge" style="background:var(--violet)">${n} TTS${c?' · 🏅'+c:''}</span>`:''}
  return'';
}
export function renderBuilding(){
  let h='<div class="shaft"><i class="car"></i></div>';
  for(let f=Math.max(...ROOMS.map(r=>r.f));f>=1;f--){
    h+=`<div class="floor"><span class="fno">${f}F</span>`;
    for(const r of ROOMS.filter(x=>x.f===f)){
      let ch='';
      for(const n of NPC.filter(x=>x.room===r.id)){const p=pos[n.id]??=R(15,80);ch+=`<div class="chibi npc" data-id="${n.id}" style="left:${p}%;${blinkD(n.id)}"${n.id==='n2'?` onclick="event.stopPropagation();view(viewSec)"`:n.id==='n4'?` onclick="event.stopPropagation();view(viewSongs)"`:''}>${chibiHTML(n,`<div class="nm"><span>${n.name}</span></div>`)}</div>`}
      for(const m of S.managers.filter(x=>mgrRoom(x)===r.id)){const k='m'+m.id,p=pos[k]??=R(10,88);ch+=`<div class="chibi npc" data-id="${k}" style="left:${p}%;${blinkD(k)}" onclick="event.stopPropagation();openRoom('mgr')">${chibiHTML(m,`<div class="nm"><span>📋${esc(m.name.split(' ').pop())}</span></div>`)}</div>`}
      for(const a of S.artists.filter(x=>roomOf(x)===r.id)){
        const p=pos[a.id]??=R(10,88);
        const bub=a.scandal?'🚨':a.mood<30?'💢':a.energy<25?'💤':(datingPartner(a)?'💗':'');
        ch+=`<div class="chibi" data-id="${a.id}" style="left:${p}%;${blinkD(a.id)}" onclick="event.stopPropagation();view(()=>viewArtist(${a.id}))" title="${esc(a.name)}">${chibiHTML(a,`<div class="nm"><span>${esc(a.name)}</span></div>${bub?`<span class="bub">${bub}</span>`:''}`)}</div>`;
      }
      h+=`<button class="room" style="--rc:var(--r-${r.id})" onclick="openRoom('${r.id}')" aria-label="${r.n}" title="${r.n}: ${r.s}"><span class="rl"><span class="ri">${r.ic}</span>${r.n}</span>${PROPS[r.id]||''}${roomBadge(r.id)}${ch}</button>`;
    }
    h+='</div>';
  }
  $('#facade').innerHTML=h;
}
setInterval(()=>{
  document.querySelectorAll('.chibi').forEach(el=>{
    if(Math.random()<.45){
      const id=el.dataset.id,old=pos[id]??50,nw=clamp(old+R(-35,35),8,90);
      pos[id]=nw;el.classList.toggle('flip',nw<old);el.classList.add('walk');el.style.left=nw+'%';
      clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('walk'),2200);
    }
  });
},2600);
export function renderTop(){
  $('#money').textContent=money(S.money).replace(' ','');$('#money').classList.toggle('neg',S.money<0);
  $('#date').innerHTML=`<small>${t('top.week')}</small>${S.week}`;$('#yearL').textContent=t('top.year',{n:S.year});$('#nextBtn').textContent=t('top.next',{n:S.week});
  const tf=S.artists.reduce((s,a)=>s+a.fans,0);
  $('#fansP').textContent=t('top.fans',{n:fmtN(tf)});$('#artN').textContent=t('top.artists',{n:S.artists.length});
  const n=S.events.length;$('#evn').hidden=!n;$('#evn').textContent=n;
  $('#roofInfo').textContent=t('top.roof',{g:S.groups.length,s:S.artists.filter(a=>a.solo).length,a:S.artists.filter(a=>a.actor).length});
  const out=S.artists.filter(a=>a.busy),mo=S.managers.filter(m=>m.as&&!mgrRoom(m));
  $('#outside').innerHTML=out.length?`<span class="lbl">🚐 Đang làm việc bên ngoài</span>`+mo.map(m=>`<button class="chip" onclick="openRoom('mgr')"><span class="dot" style="background:${m.look.out}">📋</span>QL ${esc(m.name)} đi cùng ${esc(targetName(m))}</button>`).join('')+out.map(a=>`<button class="chip" onclick="${a.busy.kind==='promo'&&campKeyOf(a)?`view(()=>viewCamp('${campKeyOf(a)}'))`:`view(()=>viewArtist(${a.id}))`}"><span class="dot" style="background:${a.look.out}">${a.busy.kind==='offer'?OFFER[a.busy.type].ic:a.busy.kind==='shoot'?'🎬':a.busy.kind==='leave'?'🌴':a.busy.kind==='write'?'✍️':'🎤'}</span>${esc(a.name)} · ${esc(a.busy.title)} (${a.busy.left}t)</button>`).join(''):'';
  $('#log').innerHTML=S.log.map(l=>`<div class="${l.c}"><span class="w">${l.w}</span>${esc(l.t)}</div>`).join('');
}
export const campKeyOf=a=>Object.keys(S.camp||{}).find(k=>S.camp[k].ph==='post'&&campMem(k).includes(a));
export let lastRoom='ceo';
export function renderDock(){const d=$('#dock');if(!d)return;d.innerHTML=ROOMS.map(r=>`<button class="${r.id===lastRoom?'on':''}" onclick="openRoom('${r.id}')"><span class="di">${r.ic}</span><span>${r.n.replace(/^Phòng /,'')}</span>${roomBadge(r.id)}</button>`).join('')}
export function render(){renderTop();renderTrend();renderBuilding();renderDock()}
export function act(){cleanBatches();save();render();if(curView&&$('#sheet').classList.contains('on'))curView()}
export const setPos=v=>{pos=v};
export const setLastRoom=v=>{lastRoom=v};
