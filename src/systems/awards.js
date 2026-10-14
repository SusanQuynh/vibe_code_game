import { R, rnd } from '../core/rng.js';
import { clamp, fmtN } from '../core/util.js';
import { Lk } from '../i18n/index.js';
import { S, addLog, byId } from '../state.js';
import { newYr } from './artists.js';

export let awardToShow=null;
/* ================= AWARDS ================= */
export function awards(){
  const y=S.year,A=S.artists,res=[],gr=1+.35*(y-1);
  const best=(arr,f)=>arr.reduce((m,a)=>!m||f(a)>f(m)?a:m,null);
  const give=(cat,names,ok,ids,note)=>{res.push({cat,names,ok,note});if(ok)for(const id of ids){const a=byId(id);if(a){a.fans=Math.round(a.fans*1.15)+5000;a.mood=clamp(a.mood+15,0,100);a.hist.unshift(Lk('h.award',{y,c:cat}))}};if(ok)S.money+=30e6};
  let c=best(A.filter(a=>a.status==='debuted'),a=>a.yr.fans);
  if(c)give(Lk('aw.cat.artist'),c.name,c.yr.fans>=120000*gr*rnd(.7,1.2),[c.id],Lk('aw.note.fansYr',{n:fmtN(c.yr.fans)}));
  c=best(A.filter(a=>a.debutYear===y),a=>a.yr.fans);
  if(c)give(Lk('aw.cat.rookie'),c.name,c.yr.fans>=25000*rnd(.7,1.3),[c.id],Lk('aw.note.fans',{n:fmtN(c.yr.fans)}));
  const sg=S.singles.filter(s=>s.y===y).sort((a,b)=>a.rank-b.rank)[0];
  if(sg)give(Lk('aw.cat.song'),`«${sg.title}» – ${sg.act.slice(2)}`,sg.rank<=R(1,7),sg.m,Lk('aw.note.bestRank',{r:sg.rank}));
  for(const [g,lab] of [['M','actorM'],['F','actorF']]){c=best(A.filter(a=>a.g===g&&a.yr.actQ>0),a=>a.yr.actQ);if(c)give(Lk(`aw.cat.${lab}`),c.name,c.yr.actQ>=clamp(42+y*4,0,88)+R(-8,8),[c.id],Lk('aw.note.actQ',{q:c.yr.actQ}))}
  c=best(A.filter(a=>a.yr.variety>0),a=>a.yr.variety*10+a.st.variety);
  if(c)give(Lk('aw.cat.variety'),c.name,c.yr.variety>=3&&c.st.variety>=30+y*3+R(-5,5),[c.id],Lk('aw.note.shows',{n:c.yr.variety}));
  const fb=S.films.filter(f=>f.done&&f.y===y).sort((a,b)=>b.mult-a.mult)[0];
  if(fb)give(Lk('aw.cat.film'),`«${fb.title}»`,fb.mult>=2+rnd(-.3,.3),fb.cast,Lk('aw.note.film',{m:fb.mult}));
  const cc=S.concerts.filter(x=>x.y===y).sort((a,b)=>b.aud-a.aud)[0];
  if(cc)give(Lk('aw.cat.concert'),cc.act.slice(2),cc.aud>=4000*gr*rnd(.7,1.3),cc.m,Lk('aw.note.aud',{n:fmtN(cc.aud)}));
  const total=S.artists.reduce((s,a)=>s+a.fans,0);
  const board=S.rivals.map(r=>({n:r.n,f:r.fans})).concat([{n:Lk('aw.me'),f:total,me:1}]).sort((a,b)=>b.f-a.f);
  const rank=board.findIndex(x=>x.me)+1;
  const entry={y,res,board,rank};S.awards.push(entry);
  addLog(Lk('log.aw.ceremony',{y,w:res.filter(r=>r.ok).length,t:res.length,r:rank,b:board.length}),'gold');
  for(const a of A)a.yr=newYr();S.rivals.forEach(r=>r.f0=r.fans);
  awardToShow=entry;
}
export const setAwardToShow=v=>{awardToShow=v};
