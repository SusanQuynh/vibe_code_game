import { R, pick } from '../core/rng.js';
import { $, clamp, esc, fmtN } from '../core/util.js';
import { GNAMES } from '../data/names.js';
import { CONCEPTS, GENRES, STATS } from '../data/rules.js';
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
export function fitRows(rows,tbl){const mx=rows[0].f;return`<div class="cfit">${rows.map(r=>`<span class="${r.f===mx?'best':''}">${r.f===mx?'⭐ ':''}${tbl[r.k].n}</span><div class="bar"><i style="width:${r.f}%"></i></div><b>${Math.round(r.f)}%</b>`).join('')}</div>`}
export function debutAnalysis(){
  const t=$('#dType').value,ids=[...document.querySelectorAll('.dsel:checked')].map(x=>+x.value),sel=ids.map(byId).filter(Boolean);
  if(t==='group'){
    if(sel.length<2)return'<div class="small muted">Chọn từ 2 người (hoặc bấm một đội hình gợi ý) để xem nhóm hợp concept nào.</div>';
    const rows=Object.keys(CONCEPTS).map(k=>({k,f:avgFit(sel,CONCEPTS[k].w)})).sort((a,b)=>b.f-a.f),hm=harmony(ids),roles=roleTags(sel);
    const enem=[];for(let i=0;i<sel.length;i++)for(let j=i+1;j<sel.length;j++)if(sel[i].tag[sel[j].id]==='enemy')enem.push(sel[i].name+' & '+sel[j].name);
    return`<b>Đội hình đang chọn (${sel.length} người)</b> · hòa hợp <b class="${hm<0?'bad':'good'}">${hm>=0?'+':''}${hm}</b>${enem.length?` · <span class="bad">⚠️ mâu thuẫn: ${esc(enem.join(', '))}</span>`:''}
    ${fitRows(rows,CONCEPTS)}<div class="small">👉 Hợp nhất với concept <b>${CONCEPTS[rows[0].k].n}</b>${rows[0].f-rows[1].f<3?`, gần bằng ${CONCEPTS[rows[1].k].n}`:''}.</div>
    <div class="small" style="margin-top:6px"><b>Vị trí gợi ý:</b><br>${sel.map(a=>`${esc(a.name)}: ${(roles[a.id]||['Thành viên']).join(', ')}`).join('<br>')}</div>`;
  }
  if(!sel.length)return'<div class="small muted">Chọn một người để xem phân tích.</div>';
  const a=sel[0],rc=debutRec(a),cmp=a.status==='trainee'?`<div class="small" style="margin-top:6px">🎯 Đề xuất chung: <b>${rc.t==='wait'?'chưa nên debut':DR[rc.t]}</b>${rc.t!==t&&rc.t!=='wait'?' <span class="bad">(khác lựa chọn hiện tại)</span>':''}</div>`:'';
  if(t==='solo')return`<b>${esc(a.name)} khi ra solo</b>${fitRows(bestOf(a,CONCEPTS),CONCEPTS)}<div class="small">👉 Nên ra mắt với concept <b>${CONCEPTS[bestOf(a,CONCEPTS)[0].k].n}</b>.</div>`+cmp;
  if(t==='actor')return`<b>${esc(a.name)} khi làm diễn viên</b> · Diễn xuất ${Math.round(a.st.acting)}${fitRows(bestOf(a,GENRES),GENRES)}<div class="small">👉 Hợp nhất thể loại <b>${GENRES[bestOf(a,GENRES)[0].k].n}</b>.</div>`+cmp;
  if(t==='solo')return`<b>${esc(a.name)} khi ra solo</b>${fitRows(bestOf(a,CONCEPTS),CONCEPTS)}<div class="small">👉 Nên ra mắt với concept <b>${CONCEPTS[bestOf(a,CONCEPTS)[0].k].n}</b>.</div>`;
  return`<b>${esc(a.name)} khi làm diễn viên</b> · Diễn xuất ${Math.round(a.st.acting)}${fitRows(bestOf(a,GENRES),GENRES)}<div class="small">👉 Hợp nhất thể loại <b>${GENRES[bestOf(a,GENRES)[0].k].n}</b>${a.st.acting<25?'. Diễn xuất còn yếu, nên tập thêm ở Phòng Diễn xuất trước khi debut':''}.</div>`;
}
export const DR={group:'👥 Nhóm nhạc',solo:'🎤 Solo',actor:'🎬 Diễn viên'};
export const DRT={group:'nhóm nhạc',solo:'solo',actor:'diễn viên'};
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
  const lbl=t==='actor'?GENRES[r.k].n:CONCEPTS[r.k].n;
  if(t==='group'){const mates=grp.ids.filter(i=>i!==a.id).map(i=>byId(i).name);r.why=`Hợp nhất khi debut cùng ${mates.join(', ')}, concept ${lbl} ${Math.round(grp.f)}%${grp.hm>0?', nhóm hòa hợp':''}. Kỹ năng bổ trợ nhau tốt hơn đứng một mình.`}
  else if(t==='solo')r.why=`${STATS[['vocal','dance','rap'].reduce((m,k)=>a.st[k]>a.st[m]?k:m,'vocal')]} ${Math.round(music)} đủ nổi bật để đứng sân khấu một mình, hợp concept ${lbl} ${Math.round(so.f)}%.`;
  else r.why=`Diễn xuất ${Math.round(a.st.acting)} mạnh hơn kỹ năng âm nhạc, hợp phim ${lbl} ${Math.round(ac.f)}%.`;
  r.short=`nên debut ${DRT[t]} · ${lbl} ${Math.round(r.f)}%`;
  if(a.status==='trainee'&&r.f<=DEBUT_MIN){const W=t==='actor'?GENRES[r.k].w:CONCEPTS[r.k].w,k=Object.keys(W).reduce((m,x)=>W[x]*(100-a.st[x])>W[m]*(100-a.st[m])?x:m);
    r.best=t;r.t='wait';r.why=`Độ phù hợp mới ${Math.round(r.f)}% (cần trên ${DEBUT_MIN}%). Tập thêm ${STATS[k]} rồi debut ${DRT[t]} (${lbl}).`;r.short=`chưa đủ điểm (${Math.round(r.f)}/${DEBUT_MIN})`}
  return r;
}
export function recLine(a){const r=debutRec(a);const s=r.sc;return`<div class="prow"><b>${esc(a.name)}</b><span class="small">${r.t==='wait'?'⏳ Chưa nên debut':`<b>${DR[r.t]}</b>`}<br><span class="muted">${esc(r.why)}</span><br><span class="muted">Phù hợp ${Math.round(r.f)}% / cần trên ${DEBUT_MIN}% · Điểm: Solo ${s.solo} · Diễn viên ${s.actor}${s.group!=null?' · Nhóm '+s.group:''}</span></span><span class="sp"></span>${r.t==='wait'?'':`<button class="btn sm pri" onclick="applyRec(${a.id})">Áp dụng</button>`}</div>`}
export function applyRec(id){const a=byId(id);if(!a)return;const r=debutRec(a);if(r.t==='wait')return;$('#dType').value=r.t;$('#dType').onchange();
  if(r.t==='group')applyLineup(r.ids);else{const x=[...document.querySelectorAll('.dsel')].find(e=>+e.value===id);if(x){x.checked=true;x.onchange&&x.onchange()}}
  $('#dAna')?.scrollIntoView({behavior:'smooth',block:'center'})}
export function applyLineup(ids){document.querySelectorAll('.dsel').forEach(x=>x.checked=ids.includes(+x.value));if(!$('#dName').value)$('#dName').value=pick(GNAMES.filter(n=>!S.groups.some(g=>g.name===n)).concat(['Starlight '+R(2,9)]));document.querySelectorAll('.dsel')[0]?.onchange?.()}
export const DEBUT_COST={group:n=>120e6+n*20e6,solo:()=>80e6,actor:()=>50e6};
export function debut(){const type=$('#dType').value,ids=[...document.querySelectorAll('.dsel:checked')].map(x=>+x.value);debutIds(type,ids,type==='group'?($('#dName').value||''):'')}
export function debutIds(type,ids,name){
  const cost=DEBUT_COST[type](ids.length);
  if(type==='group'&&ids.length<2){toast('Nhóm cần ít nhất 2 người');return false}
  if(type!=='group'&&ids.length!==1){toast('Chọn đúng 1 người');return false}
  if(S.money<cost){toast('Không đủ tiền');return false}
  const mem=ids.map(byId);if(mem.some(a=>!a||a.busy)){toast('Có người đang bận');return false}
  name=type==='group'?String(name||'').trim().slice(0,24):'';
  if(type==='group'&&!name){toast('Đặt tên nhóm');return false}
  S.money-=cost;book('prod',-cost);
  for(const a of mem){
    if(a.status==='trainee'){a.status='debuted';a.debutYear=S.year;a.salary=Math.max(a.salary,4e6);a.ce=abs()+CT_WK;a.cs0=abs();a.earnC=0;a.dReady=0}
    const g=R(2000,7000)*(type==='actor'?.5:1);a.fans+=g;a.yr.fans+=g;a.mood=clamp(a.mood+15,0,100);if(a.cf0==null||a.cs0===abs())a.cf0=a.fans;
    if(a.mt){const mt=byId(a.mt);if(mt){const b=Math.round(g*.3)+500;mt.fans+=b;MOOD(mt,10);setRel(a,mt,getRel(a,mt)+10);addLog(`👩‍🏫 Tiền bối ${mt.name} tự hào khi đàn em ${a.name} debut (+${fmtN(b)} fan).`,'good')}a.mtd=a.mt;a.mt=0}
    if(type==='solo'){if(groupsOf(a).length)givePM(a);a.solo=true}if(type==='actor')a.actor=true;
    if(type!=='actor')a.busy={kind:'promo',title:'Showcase debut',left:2,total:2};
  }
  if(type==='group'){const ck=Object.keys(CONCEPTS).sort((x,y)=>avgFit(mem,CONCEPTS[y].w)-avgFit(mem,CONCEPTS[x].w))[0];S.groups.push({id:uid(),name,members:ids,y:S.year,concept:ck});addLog(`🎊 Nhóm ${name} chính thức debut với ${ids.length} thành viên, hợp nhất concept ${CONCEPTS[ck].n}!`,'gold')}
  else addLog(`🎊 ${mem[0].name} debut ${type==='solo'?'solo':'diễn viên'}!`,'gold');
  act();return true;
}
