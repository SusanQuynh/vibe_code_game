import { $ } from '../core/util.js';
import { save } from '../save/storage.js';
import { S } from '../state.js';
import { t } from '../i18n/index.js';
import { closeM } from './modal.js';

/* ---- Hướng dẫn người mới ---- */
export const TUT=[
 {id:'welcome',first:1},
 {id:'top',sel:'.top'},
 {id:'bld',sel:'.bld'},
 {id:'dock',sel:'#dock'},
 {id:'lobby',sel:'#dock button[onclick*="lobby"]'},
 {id:'ceo',sel:'#dock button[onclick*="ceo"]'},
 {id:'meet',sel:'#dock button[onclick*="meet"]'},
 {id:'mgr',sel:'#dock button[onclick*="mgr"]'},
 {id:'studio',sel:'#dock button[onclick*="studio"]'},
 {id:'gym',sel:'#dock button[onclick*="gym"]'},
 {id:'next',sel:'#nextBtn'},
 {id:'log',sel:'.logbox'}
];
export let tutI=-1;
export function tutStart(i){closeM();tutI=i||0;tutShow()}
export function tutShow(){document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl'));let el=$('#tut');
  if(tutI<0||tutI>=TUT.length){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='tut';el.setAttribute('role','dialog');document.body.appendChild(el)}
  const s=TUT[tutI],tg=s.sel?document.querySelector(s.sel):null;if(tg){tg.classList.add('tut-hl');try{tg.scrollIntoView({behavior:'smooth',block:'center',inline:'center'})}catch(e){}}
  el.innerHTML=`<div class="tutc">${s.first?'':`<div class="small muted">${t('tut.progress',{i:tutI,n:TUT.length-1})}</div>`}<h3>${t(`tut.${s.id}.t`)}</h3><div class="small">${t(`tut.${s.id}.d`)}</div>
  <div class="row" style="margin-top:10px">${s.first?`<button class="btn" onclick="tutEnd()">${t('tut.skipKnown')}</button><span class="sp"></span><button class="btn pri" onclick="tutGo(1)">${t('tut.start')}</button>`:`<button class="btn sm" onclick="tutEnd()">${t('tut.skip')}</button><span class="sp"></span>${tutI>1?`<button class="btn sm" onclick="tutGo(-1)">${t('tut.prev')}</button>`:''}<button class="btn sm pri" onclick="tutGo(1)">${tutI===TUT.length-1?t('tut.done'):t('tut.next')}</button>`}</div>
  ${s.first?'':`<div class="tutdots">${TUT.slice(1).map((_,i)=>`<i class="${i+1===tutI?'on':''}"></i>`).join('')}</div>`}</div>`}
export function tutGo(d){tutI+=d;if(tutI>=TUT.length)return tutEnd();if(tutI<1)tutI=1;tutShow()}
export function tutEnd(){tutI=-1;S.tut=1;save();tutShow()}
export const setTutI=v=>{tutI=v};
