import { clamp } from '../core/util.js';
import { S, byId } from '../state.js';

/* ================= RELATIONS ================= */
export const getRel=(x,y)=>x.rel[y.id]||0;
export function setRel(x,y,v){v=clamp(Math.round(v),-100,100);x.rel[y.id]=v;y.rel[x.id]=v}
export function setTag(x,y,t){if(t){x.tag[y.id]=t;y.tag[x.id]=t}else{delete x.tag[y.id];delete y.tag[x.id]}}
export const datingPartner=a=>{for(const id in a.tag)if(a.tag[id]==='dating'||a.tag[id]==='public')return byId(+id);return null};
export const groupsOf=a=>S.groups.filter(g=>g.members.includes(a.id));
export const sameGroup=(x,y)=>S.groups.some(g=>g.members.includes(x.id)&&g.members.includes(y.id));
export function harmony(ids){let h=0;for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=byId(ids[i]);if(!a)continue;const t=a.tag[ids[j]];if(t==='friend')h+=3;else if(t==='dating'||t==='public')h+=1;else if(t==='enemy')h-=6}return h}
