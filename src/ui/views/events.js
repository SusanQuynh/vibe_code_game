import { esc } from '../../core/util.js';
import { S, byId } from '../../state.js';
import { LEADS, evInfo, invFix, invRec, invVerdict } from '../../systems/events.js';
import { pct } from '../../systems/ext2.js';
import { modal } from '../modal.js';

export function viewInv(aId){
  const a=byId(aId);
  if(!a||!a.scandal||!a.scandal.inv){modal(`<h2>🗂️ Hồ sơ đã đóng</h2><div class="sub">Scandal này đã được xử lý.</div><button class="btn pri" onclick="openRoom('pr')">Về Phòng Truyền thông</button>`);return}
  const sc=a.scandal,inv=sc.inv,pct=Math.round(inv.p*100),vd=invVerdict(inv.p),e=S.events.find(x=>x.kind==='scandal'&&x.a===a.id),info=e&&evInfo(e);
  const files=inv.leads.map((L,i)=>{const D=LEADS[L.k],rot=`--rot:${(i%3-1)*1.6}deg`;
    if(L.open){const fr=L.fresh?' flip':'';L.fresh=false;return`<div class="file open ${L.says?'t':'f'}${fr}" style="${rot}"><b>${D.ic} ${D.n}</b>${L.says?D.T:D.F}<br><span class="stamp" style="color:${L.says?'var(--red)':'var(--mint)'}">${L.says?'→ THẬT':'→ SAI'}</span> <span class="small" style="opacity:.7">tin cậy ${Math.round(L.r*100)}%</span></div>`}
    return`<button class="file" style="${rot}" onclick="invOpen(${a.id},${i})" ${inv.ap<=0?'aria-disabled="true"':''}><b>${D.ic} ${D.n}</b>Độ tin cậy ${'★'.repeat(Math.round(L.r*5))}${'☆'.repeat(5-Math.round(L.r*5))}<div style="margin-top:14px;font-weight:700">🔎 Chạm để điều tra</div></button>`}).join('');
  modal(`<h2>🕵️ Hồ sơ: ${esc(a.name)}</h2><div class="sub">${esc(sc.t)} · mức ${'🔥'.repeat(sc.sev)} · còn ${sc.left} tuần</div>
  <div class="card"><div class="row"><b>Lượt điều tra:</b><span style="font-size:18px">${'🔎'.repeat(inv.ap)||'<span class="small muted">hết lượt</span>'}</span><span class="sp"></span><button class="btn sm" onclick="invBuy(${a.id})">+1 lượt (8 tr)</button></div>
  <div class="meter"><div class="needle" style="left:${pct}%" data-p="${pct}% thật"></div></div><div class="mlab"><span>Tin sai</span><span>Chưa rõ</span><span>Sự thật</span></div></div>
  <div class="small muted">Mỗi hồ sơ cho một manh mối nghiêng về "thật" hoặc "sai". Hồ sơ nhiều sao đáng tin hơn, nhưng manh mối nào cũng có thể sai. Kỹ năng Truyền thông của quản lý giúp tăng lượt và độ tin cậy.</div>
  <div class="case">${files}</div>
  <div class="card" style="border-color:${vd.v===1?'var(--red)':vd.v===0?'var(--mint)':'var(--line)'}"><b class="${vd.c}">Kết luận hiện tại: ${vd.t}</b><div class="small" style="margin:4px 0 8px">👉 ${invRec(vd.v,sc.dating)}</div>
  ${info?`<div class="row">${info.o.map(o=>`<button class="btn sm ${(vd.v===1&&(o.k==='sorry'||o.k==='public'))||(vd.v===0&&(o.k==='sue'||o.k==='deny'))?'pri':''}" onclick="resolveEv(${e.id},'${o.k}');openRoom('pr')">${o.l}</button>`).join('')}</div>`:'<div class="small muted">Công ty đã chọn im lặng. Chờ dư luận lắng xuống.</div>'}</div>`);
}
export function invBlock(a){
  const sc=a.scandal;if(!sc)return'';invFix(sc);
  if(!sc.inv)return`<div class="row" style="margin:6px 0"><button class="btn sm pri" onclick="invStart(${a.id})">🕵️ Mở hồ sơ điều tra (10 tr)</button><span class="small muted">Tìm manh mối trước khi chọn cách xử lý</span></div>`;
  const vd=invVerdict(sc.inv.p);
  return`<div class="row" style="margin:6px 0"><button class="btn sm pri" onclick="invStart(${a.id})">🕵️ Tiếp tục điều tra</button><span class="small ${vd.c}">${Math.round(sc.inv.p*100)}% thật · ${vd.t}</span></div>`;
}
