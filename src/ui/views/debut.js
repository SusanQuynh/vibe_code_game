import { R, pick } from '../../core/rng.js';
import { $, esc } from '../../core/util.js';
import { GNAMES } from '../../data/names.js';
import { CONCEPTS, GENRES } from '../../data/rules.js';
import { S, byId } from '../../state.js';
import { DEBUT_MIN, DR, avgFit, bestOf, debutIds, debutRec, roleTags } from '../../systems/debut.js';
import { harmony } from '../../systems/relations.js';

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
export function recLine(a){const r=debutRec(a);const s=r.sc;return`<div class="prow"><b>${esc(a.name)}</b><span class="small">${r.t==='wait'?'⏳ Chưa nên debut':`<b>${DR[r.t]}</b>`}<br><span class="muted">${esc(r.why)}</span><br><span class="muted">Phù hợp ${Math.round(r.f)}% / cần trên ${DEBUT_MIN}% · Điểm: Solo ${s.solo} · Diễn viên ${s.actor}${s.group!=null?' · Nhóm '+s.group:''}</span></span><span class="sp"></span>${r.t==='wait'?'':`<button class="btn sm pri" onclick="applyRec(${a.id})">Áp dụng</button>`}</div>`}
export function applyRec(id){const a=byId(id);if(!a)return;const r=debutRec(a);if(r.t==='wait')return;$('#dType').value=r.t;$('#dType').onchange();
  if(r.t==='group')applyLineup(r.ids);else{const x=[...document.querySelectorAll('.dsel')].find(e=>+e.value===id);if(x){x.checked=true;x.onchange&&x.onchange()}}
  $('#dAna')?.scrollIntoView({behavior:'smooth',block:'center'})}
export function applyLineup(ids){document.querySelectorAll('.dsel').forEach(x=>x.checked=ids.includes(+x.value));if(!$('#dName').value)$('#dName').value=pick(GNAMES.filter(n=>!S.groups.some(g=>g.name===n)).concat(['Starlight '+R(2,9)]));document.querySelectorAll('.dsel')[0]?.onchange?.()}
export function debut(){const type=$('#dType').value,ids=[...document.querySelectorAll('.dsel:checked')].map(x=>+x.value);debutIds(type,ids,type==='group'?($('#dName').value||''):'')}
