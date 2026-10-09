import { R, pick } from '../core/rng.js';
import { clamp } from '../core/util.js';
import { HAIR, OUT, SKIN } from '../data/looks.js';
import { FN, FT1, FT2, MN } from '../data/names.js';
import { OFFER, TT } from '../data/offers.js';
import { STATS } from '../data/rules.js';
import { S, addLog, byId, uid } from '../state.js';
import { removeArtist } from './events.js';
import { book, compRep, ensureCurBatch, poolSize } from './ext2.js';
import { defaultDays } from './week.js';
import { act } from '../ui/building.js';
import { closeM, toast } from '../ui/modal.js';

export const fame=a=>Math.min(100,Math.round(Math.sqrt(a.fans/100)));
export const fit=(a,w)=>{let s=0,t=0;for(const k in w){s+=a.st[k]*w[k];t+=w[k]}return t?s/t:0};
export const newYr=()=>({fans:0,actQ:0,variety:0});
export function genTitle(type){if(OFFER[type].film)return pick(FT1)+' '+pick(FT2);return pick(TT[type])}
export function mkLook(g,out){const style=g==='F'?pick(['long','twin','pony','bun','short','long']):pick(['short','spiky','short','pony']);return{hair:pick(HAIR),skin:pick(SKIN),out,style,long:!['short','spiky'].includes(style),skirt:g==='F'&&Math.random()<.5}}
export function ensureLook(o){const L=o.look;if(!L)return;const i=typeof o.id==='number'?o.id:0;if(!L.style)L.style=L.long?['long','twin','pony','bun'][i%4]:['short','spiky'][i%2];if(L.skirt===undefined)L.skirt=o.g==='F'&&i%2===0}
export function genArtist(){
  const g=Math.random()<.5?'F':'M';
  const used=new Set(S.artists.map(a=>a.name).concat(S.pool.map(a=>a.name)));
  let name;for(let i=0;i<30;i++){name=pick(g==='F'?FN:MN);if(!used.has(name))break}
  if(used.has(name))name+=' '+R(2,9);
  const base=R(6,24)+Math.floor((S.awards?compRep():0)/12),st={};
  for(const k in STATS)st[k]=clamp(base+R(-6,14),3,55);
  const sp=pick(Object.keys(STATS));st[sp]=clamp(st[sp]+R(10,22),3,68);
  return{id:uid(),name,g,age:R(16,22),look:mkLook(g,pick(OUT)),
    st,talent:+(0.75+Math.random()*.5).toFixed(2),spec:sp,energy:100,mood:70,fans:0,status:'trainee',solo:false,actor:false,
    sched:'vocal',days:defaultDays('vocal'),busy:null,salary:1e6,co:{},rel:{},tag:{},pw:{},scandal:null,yr:newYr(),debutYear:0,lessons:[],hist:[],wantAct:0};
}
export function genPool(n){const r=[];for(let i=0;i<n;i++){const a=genArtist();S.pool.push(a);r.push(a)}S.pool=S.pool.filter(x=>r.includes(x));return r}
export function sign(id){const a=S.pool.find(x=>x.id===id);if(!a)return;if(S.money<20e6)return toast('Không đủ 20 tr');S.money-=20e6;book('hr',-20e6);S.pool=S.pool.filter(x=>x!==a);a.batch=ensureCurBatch();S.artists.push(a);addLog(`✍️ Ký hợp đồng thực tập sinh ${a.name} vào ${(S.batches.find(b=>b.id===a.batch)||{n:'lứa mới'}).n}.`,'good');act()}
export function recast(){if(S.money<10e6)return toast('Không đủ tiền');S.money-=10e6;book('hr',-10e6);genPool(poolSize());act()}
export function setSched(id,v){const a=byId(id);if(a){a.days=a.days.some(k=>k!=='rest')?a.days.map(k=>k==='rest'?'rest':v):defaultDays(v);act()}}
export function setAll(v){if(!v)return;S.artists.forEach(a=>a.days=defaultDays(v));act()}
export function fire(id,btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent='Chạm lần nữa để xác nhận';return}const a=byId(id);if(a){removeArtist(a,'đã chấm dứt hợp đồng');closeM();act()}}
