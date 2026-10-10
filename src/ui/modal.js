import { $ } from '../core/util.js';
import { t } from '../i18n/index.js';

export let curView=null;
export let curRC=null;
export function view(fn){curRC=null;curView=fn;fn()}
export function modal(h){const sh=$('#sheet'),st=sh.querySelector('.panel')?.scrollTop||0,keep=sh.classList.contains('on');sh.innerHTML=`<div class="panel" style="--hc:${curRC||'var(--line)'}"><button class="x" onclick="closeM()" aria-label="${t('btn.close')}">✕</button>${h}</div>`;sh.classList.add('on');if(keep)sh.querySelector('.panel').scrollTop=st}
export function closeM(){$('#sheet').classList.remove('on');curView=null}
export let toastT;
export function toast(t){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.style.cssText='position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:9px 15px;border-radius:10px;z-index:99;font-weight:600;font-size:13.5px;max-width:90%;box-shadow:0 14px 30px -10px rgba(0,0,0,.8)';document.body.appendChild(el)}el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2200)}
export const setCurView=v=>{curView=v};
export const setCurRC=v=>{curRC=v};
export const setToastT=v=>{toastT=v};
