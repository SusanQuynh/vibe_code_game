import { R, rnd } from '../core/rng.js';
import { clamp, fmtN } from '../core/util.js';
import { S, addLog, byId } from '../state.js';
import { newYr } from './artists.js';

export let awardToShow=null;
/* ================= AWARDS ================= */
export function awards(){
  const y=S.year,A=S.artists,res=[],gr=1+.35*(y-1);
  const best=(arr,f)=>arr.reduce((m,a)=>!m||f(a)>f(m)?a:m,null);
  const give=(cat,names,ok,ids,note)=>{res.push({cat,names,ok,note});if(ok)for(const id of ids){const a=byId(id);if(a){a.fans=Math.round(a.fans*1.15)+5000;a.mood=clamp(a.mood+15,0,100);a.hist.unshift(`N${y}: 🏆 ${cat}`)}};if(ok)S.money+=30e6};
  let c=best(A.filter(a=>a.status==='debuted'),a=>a.yr.fans);
  if(c)give('Nghệ sĩ của năm',c.name,c.yr.fans>=120000*gr*rnd(.7,1.2),[c.id],`+${fmtN(c.yr.fans)} fan trong năm`);
  c=best(A.filter(a=>a.debutYear===y),a=>a.yr.fans);
  if(c)give('Tân binh của năm',c.name,c.yr.fans>=25000*rnd(.7,1.3),[c.id],`+${fmtN(c.yr.fans)} fan`);
  const sg=S.singles.filter(s=>s.y===y).sort((a,b)=>a.rank-b.rank)[0];
  if(sg)give('Bài hát của năm',`«${sg.title}» – ${sg.act.slice(2)}`,sg.rank<=R(1,7),sg.m,`hạng cao nhất ${sg.rank}`);
  for(const [g,lab] of [['M','Nam'],['F','Nữ']]){c=best(A.filter(a=>a.g===g&&a.yr.actQ>0),a=>a.yr.actQ);if(c)give(`${lab} diễn viên xuất sắc`,c.name,c.yr.actQ>=clamp(42+y*4,0,88)+R(-8,8),[c.id],`điểm diễn ${c.yr.actQ}`)}
  c=best(A.filter(a=>a.yr.variety>0),a=>a.yr.variety*10+a.st.variety);
  if(c)give('Ngôi sao tạp kỹ',c.name,c.yr.variety>=3&&c.st.variety>=30+y*3+R(-5,5),[c.id],`${c.yr.variety} show`);
  const fb=S.films.filter(f=>f.done&&f.y===y).sort((a,b)=>b.mult-a.mult)[0];
  if(fb)give('Phim của năm',`«${fb.title}»`,fb.mult>=2+rnd(-.3,.3),fb.cast,`x${fb.mult} doanh thu`);
  const cc=S.concerts.filter(x=>x.y===y).sort((a,b)=>b.aud-a.aud)[0];
  if(cc)give('Concert của năm',cc.act.slice(2),cc.aud>=4000*gr*rnd(.7,1.3),cc.m,`${fmtN(cc.aud)} khán giả`);
  const total=S.artists.reduce((s,a)=>s+a.fans,0);
  const board=S.rivals.map(r=>({n:r.n,f:r.fans})).concat([{n:'⭐ Starlight Ent. (bạn)',f:total,me:1}]).sort((a,b)=>b.f-a.f);
  const rank=board.findIndex(x=>x.me)+1;
  const entry={y,res,board,rank};S.awards.push(entry);
  addLog(`🏆 Lễ trao giải năm ${y}: thắng ${res.filter(r=>r.ok).length}/${res.length} hạng mục. Công ty xếp hạng ${rank}/${board.length}.`,'gold');
  for(const a of A)a.yr=newYr();S.rivals.forEach(r=>r.f0=r.fans);
  awardToShow=entry;
}
export const setAwardToShow=v=>{awardToShow=v};
