import { esc, fmt } from '../../core/util.js';
import { OFFER } from '../../data/offers.js';
import { CONCEPTS } from '../../data/rules.js';
import { S, byId } from '../../state.js';
import { mBoss } from '../../systems/managers.js';
import { effPay } from '../../systems/offers.js';
import { CFT, buildProps, itDesc, propCount, refIt } from '../../systems/proposals.js';
import { secPlans } from '../../systems/secretary.js';
import { TIC } from '../../systems/week.js';
import { modal } from '../modal.js';
import { propNext } from '../planning.js';
import { det } from '../views.js';

export const stTag=x=>x.ok===1?`<span class="tag m">✓ ${esc(x.by||'đã duyệt')}</span>`:x.ok===-2?`<span class="tag">✖ bỏ · ${esc(x.why2||'')}</span>`:x.ok===-1?'<span class="tag">hết hạn</span>':(x.cf||[]).some(id=>S.props.c.find(c=>c.id===id&&c.pend))?'<span class="tag r">⚠️ xung đột</span>':'';
export function viewProps(){
  const P=buildProps(),ms=S.managers.filter(m=>P.m[m.id]);
  const pc=P.c.filter(c=>c.pend),dc=P.c.filter(c=>c.done&&c.by&&c.by!=='Giám đốc');
  const cfHTML=pc.map(c=>{const its=c.refs.map(r=>refIt(P,r)).filter(Boolean);const two=c.type==='overlap'||c.type==='offer';
    return`<div class="card" style="border-color:var(--red)"><b>⚠️ ${CFT[c.type]}</b><div class="small">${esc(c.txt)}</div><div class="small muted">Đã chuyển qua: ${c.path.map(esc).join(' → ')}${c.path.length>1?' (cấp trên chưa đủ kỹ năng Kế hoạch để tự xử lý)':' (không có quản lý chung cấp trên)'}</div>
    ${two?its.map((t,i)=>`<div class="prow"><span class="small">${esc(itDesc(t))}</span><span class="sp"></span><button class="btn sm" onclick="cfPick(${c.id},${c.refs.findIndex(r=>r.mid===t.mid&&r.k===t.kind&&r.i===t.i)})">Giữ cái này</button></div>`).join(''):`<div class="small" style="margin:4px 0">${its.map(t=>esc(itDesc(t))).join('<br>')}</div>`}
    <div class="row" style="margin-top:6px"><button class="btn sm pri" onclick="cfPick(${c.id})">Theo gợi ý${c.type==='tired'?' (giảm tải)':c.type==='enemy'?' (đổi người)':c.type==='scandal'?' (hoãn dự án)':' (giữ phương án lợi nhất)'}</button>${two?'':`<button class="btn sm" onclick="cfPick(${c.id},'as')">Vẫn duyệt</button>`}</div></div>`}).join('');
  const body=ms.map(m=>{const it=P.m[m.id];
    const sl=it.s.map((x,i)=>{const a=byId(x.a);if(!a)return'';return`<div class="prow" style="${x.ok===-2?'opacity:.55':''}">🗓️ <b>${esc(a.name)}</b> <span class="dmini">${x.days.map(k=>TIC[k]).join('')}</span><span class="small muted">${esc(x.why)}</span><span class="sp"></span>${stTag(x)}${!x.ok&&!(x.cf||[]).length?`<button class="btn sm" onclick="propOk(${m.id},'s',${i})">Duyệt</button>`:''}</div>`}).join('');
    const pl=it.p.map((x,i)=>{const of=S.offers.find(o=>o.id===x.of);if(!of&&x.ok!==1&&x.ok!==-2)return'';const nm=x.ids.map(byId).filter(Boolean),O=OFFER[(of||{}).type]||{ic:'🎬'};
      const pay=of?nm.reduce((t,a)=>t+effPay(of,a),0):0;
      return`<div class="prow" style="${x.ok===-2?'opacity:.55':''}">${O.ic} <b>«${esc(of?of.title:'dự án')}»</b><span class="small muted">${esc(nm.map(a=>a.name).join(', '))}${of?` · ${of.weeks}t · +${fmt(pay)}`:''}</span><span class="sp"></span>${stTag(x)}${!x.ok&&!(x.cf||[]).length?`<button class="btn sm pri" onclick="propOk(${m.id},'p',${i})">Nhận</button>`:''}</div>`}).join('');
    const dl=it.d.map(x=>{const a=byId(x.a);if(!a||a.status!=='trainee')return'';return`<div class="prow">🎯 <b>${esc(a.name)}</b><span class="small">${esc(x.txt)}</span><span class="sp"></span><button class="btn sm" onclick="openRoom('lobby')">Xem</button></div>`}).join('');
    if(!sl&&!pl&&!dl)return'';
    const pend=it.s.filter(x=>!x.ok).length+it.p.filter(x=>!x.ok).length,b=mBoss(m);
    return det('pr-'+m.id,`📋 ${esc(m.name)} <span class="small muted" style="font-weight:500">· báo cáo ${b?esc(b.name):'Giám đốc'} · ${pend?pend+' chưa duyệt':'xong'}</span>`,`${pend&&!b?`<div class="row"><span class="sp"></span><button class="btn sm" onclick="propOkAll(${m.id})">Duyệt hết</button></div>`:''}${pl}${sl}${dl}`,pend>0)}).join('');
  const nb=Object.entries(P.st.boss);
  const go=propNext;
  modal(`<h2>📋 Đề xuất của quản lý</h2><div class="sub">Tuần ${S.week}. Quản lý báo cáo lên cấp trên: không xung đột thì được duyệt ngay, có xung đột thì chuyển lên người cao hơn, tới Giám đốc nếu không ai đủ thẩm quyền.</div>
  <div class="card small">📨 ${nb.length?nb.map(([n,v])=>`${esc(n)} duyệt ${v}`).join(' · '):'Chưa có cấp trên nào duyệt'}${P.st.auto?` · ${P.st.auto} tự duyệt`:''}${dc.length?` · ⚖️ ${dc.length} xung đột đã được xử lý`:''}${pc.length?` · <b class="bad">${pc.length} chờ bạn</b>`:''}</div>
  ${pc.length?`<h3>⚠️ Xung đột cần Giám đốc (${pc.length})</h3>${cfHTML}`:''}
  ${(()=>{const L=secPlans(),r=L.filter(p=>!p.wait&&!p.plan);return r.length?`<div class="card small row">🗒️ <span style="flex:1"><b>Thư ký:</b> ${r.map(p=>esc(p.n.slice(2).trim())+' ('+CONCEPTS[p.ck].n+')').join(', ')} sẵn sàng comeback.</span><button class="btn sm" onclick="view(viewSec)">Xem</button></div>`:''})()}
  ${dc.length?det('pr-solved',`⚖️ Xung đột cấp trên đã xử lý (${dc.length})`,dc.map(c=>`<div class="small">• <b>${esc(c.by)}</b>: ${esc(c.txt)} → ${c.type==='tired'?'giảm tải':c.type==='enemy'?'đổi người':c.type==='scandal'?'hoãn dự án':'giữ phương án lợi nhất'}</div>`).join(''),false):''}
  ${body||'<div class="card small muted">Không có đề xuất mới. Giao quản lý phụ trách nghệ sĩ và bật "Đề xuất" để nhận đề xuất mỗi tuần.</div>'}
  <label class="small row" style="margin-top:8px"><input type="checkbox" ${S.autoAppr!==false?'checked':''} onchange="S.autoAppr=this.checked;save()"> Tự duyệt đề xuất không xung đột của quản lý báo cáo trực tiếp cho bạn</label>
  <div class="row" style="margin-top:8px">${propCount()-pc.length>0?'<button class="btn" onclick="propAll()">✓ Duyệt phần còn lại</button>':''}<span class="sp"></span><button class="btn pri" onclick="${go?'propGo()':'closeM()'}">${go?'Tiếp tục ▶':'Đóng'}</button></div>`);
}
