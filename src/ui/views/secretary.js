import { R } from '../../core/rng.js';
import { $, esc, fmt, fmtN } from '../../core/util.js';
import { CONCEPTS } from '../../data/rules.js';
import { S, abs } from '../../state.js';
import { trendTag } from '../../systems/market.js';
import { PROMO_WK } from '../../systems/promo.js';
import { BUDN, secPlans, secSchedRec, wkLabel } from '../../systems/secretary.js';
import { NPC, chibiHTML } from '../building.js';
import { modal } from '../modal.js';
import { det } from '../views.js';
import { fanHTML } from './releases.js';

export function studioPick(k,c){if(!$('#sAct'))return;$('#sAct').value=k;$('#sCon').value=c;$('#sCon').onchange();$('#sAct').scrollIntoView({behavior:'smooth',block:'center'})}
export function secCard(p,rec){const name=esc(p.n);
  const st=p.plan?`<span class="tag v">📅 Đã hẹn ${wkLabel(p.plan.w)}</span>`:p.wait?`<span class="tag">⏳ Chờ ${p.wait} tuần</span>`:'<span class="tag m">✅ Sẵn sàng</span>';
  const body=`<div class="small">⭐ ${CONCEPTS[p.ck].n}${trendTag(p.ck)} (${Math.round(p.fit)}%) · ${BUDN[p.bud]} ${fmt(p.bud)} · dự kiến hạng ~<b>${p.rank}</b></div>
  <div class="small muted">💬 ${esc(p.why.join('; '))}.</div>
  ${(()=>{const c=S.camp[p.k];return c&&c.ph==='post'?`<div class="small">📣 Đang quảng bá «${esc(c.t)}»: hạng #${c.rank}, ${c.wins} cúp, tuần ${c.wn+1}/${PROMO_WK}.</div>`:(p.wait||p.plan)?`<div class="small">📣 ${c?`Hype ${c.hype}.`:'Chưa teaser.'} Tận dụng thời gian chờ để tung teaser, tạo hype trước comeback.</div>`:c&&c.hype?`<div class="small">📣 Hype ${c.hype} sẵn sàng cho comeback.</div>`:''})()}
  ${p.concert?`<div class="small">🏟️ Đủ ${fmtN(p.tf)} fan và lâu rồi chưa diễn: nên tổ chức concert (200 tr). <button class="btn sm" onclick="holdConcert('${p.k}')">Tổ chức</button></div>`:''}
  <div class="row" style="margin-top:6px"><button class="btn sm" onclick="view(()=>viewCamp('${p.k}'))">📣 Quảng bá</button><span class="sp"></span>${p.plan?`<button class="btn sm" onclick="cbCancel('${p.k}')">Hủy hẹn</button>`:p.wait?`<button class="btn sm pri" onclick="cbSched('${p.k}')">Hẹn tuần ${wkLabel(abs()+p.wait)}</button>`:`<button class="btn sm" onclick="cbSched('${p.k}')">Hẹn tuần sau</button><button class="btn sm pink" onclick="cbNow('${p.k}')">Comeback ngay</button>`}</div>`;
  return det('sec-c'+p.k,`<b>${name}</b> ${st} <span class="small muted">· hạng ~${p.rank}${rec?' ⭐':''}</span>`,body,rec||(!p.wait&&!p.plan))}
export function viewSec(){const L=secPlans(),R=secSchedRec(),rk=new Set(R.map(p=>p.k)),due=L.filter(p=>rk.has(p.k)||(!p.wait&&!p.plan)),rest=L.filter(p=>!due.includes(p)),ready=L.filter(p=>!p.wait&&!p.plan).length,cb=S.rivals.filter(r=>r.cb&&r.cb.w>=abs()-1);
  modal(`<div class="row" style="padding-right:42px"><div class="chibi mini">${chibiHTML(NPC[1])}</div><div><h2 style="margin:0;font-size:21px">🗒️ Kế hoạch comeback</h2><div class="small muted">Thư ký tổng hợp: xu hướng, đối thủ, năng lượng, quỹ.</div></div></div>
  <div class="card small">🔥 Hot: <b>${S.trend.hot.map(k=>CONCEPTS[k].n).join(', ')}</b> (còn ${S.trend.until-abs()} tuần)${cb.length?` · ⚔️ ${cb.map(r=>esc(r.n)).join(', ')} đang comeback`:' · Không có đối thủ comeback'} · 💰 Quỹ ${fmt(S.money)}<br>${L.length?`👉 ${ready?`<b>${ready}</b> nhóm/solo nên comeback ngay.`:'Chưa ai nên comeback ngay, xem lịch hẹn bên dưới.'}`:'Chưa có nhóm hay solo nào. Debut ở Sảnh Tuyển dụng trước nhé.'}</div>
  <div class="card small">🗒️ ${R.length?`<b>Thư ký khuyến nghị hẹn:</b> ${R.map(p=>`${esc(p.n.slice(2).trim())} (${wkLabel(abs()+p.wait)}, ${esc(p.recWhy)})`).join(' · ')} <button class="btn sm pri" onclick="cbSchedRec()">Hẹn theo khuyến nghị</button>`:'Chưa cần hẹn thêm ai.'}</div>
  ${L.length?`<div class="row" style="margin-bottom:6px"><span class="sp"></span><button class="btn sm" onclick="setAllD('sec-',false)">Thu gọn hết</button><button class="btn sm" onclick="setAllD('sec-',true)">Mở hết</button></div>`:''}
  ${due.length?det('sec-due',`✅ Nên xử lý (${due.length})`,due.map(p=>secCard(p,rk.has(p.k))).join(''),true):''}
  ${rest.length?det('sec-rest',`📅 Đã hẹn & đang chờ (${rest.length})`,rest.map(p=>secCard(p,rk.has(p.k))).join(''),false):''}
  ${det('sec-fan','💬 Đề xuất giao lưu fan (fan meeting, livestream)',fanHTML(),true)}
  <div class="small muted">Lịch đã hẹn sẽ được thư ký tự triển khai vào đầu tuần đó, concept được chọn lại theo xu hướng lúc ấy. Nếu thành viên bận hoặc thiếu tiền, lịch tự lùi 1 tuần (tối đa 3 lần).</div>`)}
