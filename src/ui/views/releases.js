import { pick } from '../../core/rng.js';
import { $, esc, fmt, fmtN } from '../../core/util.js';
import { FT1, FT2 } from '../../data/names.js';
import { GENRES } from '../../data/rules.js';
import { S, abs, addLog, byId, uid } from '../../state.js';
import { book } from '../../systems/ext2.js';
import { POST, PRE, PROMO_WK, campMem, postRec, preRec } from '../../systems/promo.js';
import { actByKey, doSingle, fanSugs, liveEst } from '../../systems/releases.js';
import { actFree, wkLabel } from '../../systems/secretary.js';
import { act } from '../building.js';
import { closeM, modal, toast } from '../modal.js';

export function fanHTML(){const L=fanSugs();if(!L.length)return'<div class="small muted">Fan đang được chăm sóc tốt, chưa cần thêm hoạt động.</div>';
  return L.map(f=>f.t==='fm'?`<div class="prow">💝 <b>${esc(f.n)}</b><span class="small">Fan meeting · ~${fmtN(f.est)} chỗ, lãi ~${fmt(f.est*150000-f.cost)}<br><span class="muted">${esc(f.why)}</span></span><span class="sp"></span><button class="btn sm pri" onclick="doFM('${f.k}')">Tổ chức (${fmt(f.cost)})</button></div>`
    :`<div class="prow">📱 <b>${esc(f.n)}</b><span class="small muted">${esc(f.why)}</span><span class="sp"></span><button class="btn sm" onclick="doLive([${f.id}])">Livestream (thu ~${fmt(liveEst([byId(f.id)]))})</button></div>`).join('')}
export function viewCamp(k){const x=actByKey(k);if(!x)return closeM();const c=S.camp[k],ms=campMem(k),nm=esc(x.n),free=actFree(x),pl=(S.cbPlan||[]).find(p=>p.k===k);
  const eRow=`<div class="small">⚡ Năng lượng: ${ms.map(a=>`${esc(a.name)} <b class="${a.energy<35?'bad':''}">${Math.round(a.energy)}</b>`).join(' · ')}</div>`;
  let body='';
  if(c&&c.ph==='post'){const u=c.used.wk===abs()?c.used.l:[],rec=postRec(k);
    body=`<div class="grid2"><div class="card small">📈 Hạng hiện tại <b>#${c.rank}</b><br><span class="muted">cao nhất #${c.best}</span></div><div class="card small">🏆 <b>${c.wins}</b> cúp · 🎤 ${c.stages} sân khấu<br><span class="muted">Tuần ${c.wn+1}/${PROMO_WK} · thu ${fmt(c.inc)}</span></div></div>${eRow}
    <h3>Hoạt động tuần này</h3><div class="card">${Object.keys(POST).map(id=>{const P=POST[id],dn=u.includes(id);return`<div class="prow" style="${dn?'opacity:.55':''}">${P.ic} <b>${P.n}</b><span class="small muted">−${P.e}⚡${P.stage?' · cơ hội giành cúp':id==='fansign'?' · bán album':id==='challenge'?' · có thể viral':''}</span><span class="sp"></span>${dn?'<span class="tag m">✓</span>':`<button class="btn sm${rec.includes(id)?' pri':''}" onclick="postDo('${k}','${id}')">Làm</button>`}</div>`}).join('')}</div>
    <div class="card small">🗒️ <b>Thư ký gợi ý:</b> ${rec.length?rec.map(id=>POST[id].n).join(', ')+' (giữ năng lượng trên 30).':'thành viên đã mệt, để họ nghỉ.'} ${rec.length?`<button class="btn sm pri" onclick="postAuto('${k}')">Làm theo gợi ý</button>`:''}</div>
    <label class="small row"><input type="checkbox" ${S.autoPromo!==false?'checked':''} onchange="S.autoPromo=this.checked;save()"> Tuần nào bạn chưa xếp, thư ký tự làm theo gợi ý</label>`}
  else{const rec=free?preRec(k):[],h=c?c.hype:0;
    body=`<div class="card small">🔥 Hype hiện tại <b>${h}</b>/80 — mỗi 4 hype ≈ +1 điểm xếp hạng và thêm fan khi phát hành. Hype giảm dần nếu lâu không comeback.${pl?`<br>📅 Đã hẹn comeback ${wkLabel(pl.w)}.`:''}</div>
    <div class="bar" style="margin:6px 0"><i style="width:${h/.8}%;background:var(--pink)"></i></div>${eRow}
    <h3>Hoạt động trước comeback</h3>${free?`<div class="card">${Object.keys(PRE).map(id=>{const P=PRE[id],dn=c&&c.done[id];return`<div class="prow" style="${dn?'opacity:.55':''}">${P.ic} <b>${P.n}</b><span class="small muted">${P.d} · +${P.h} hype · ${P.c?fmt(P.c):'miễn phí'}${P.e?' · −'+P.e+'⚡':''}</span><span class="sp"></span>${dn?'<span class="tag m">✓</span>':`<button class="btn sm${rec.includes(id)?' pri':''}" onclick="preDo('${k}','${id}')">Làm</button>`}</div>`}).join('')}</div>
    <div class="card small">🗒️ <b>Thư ký gợi ý:</b> ${rec.length?rec.map(id=>PRE[id].n).join(', '):'chưa nên làm thêm (mệt hoặc quỹ thấp)'}. ${rec.length?`<button class="btn sm pri" onclick="preAuto('${k}')">Làm theo gợi ý</button>`:''}</div>
    <div class="row"><button class="btn" onclick="view(viewSec)">🗒️ Kế hoạch comeback</button><span class="sp"></span>${pl?'':`<button class="btn pink" onclick="cbNow('${k}')">Comeback ngay</button>`}</div>`:'<div class="card small muted">Thành viên đang bận. Khi rảnh có thể làm teaser trước comeback.</div>'}`}
  modal(`<h2>📣 Quảng bá: ${nm}</h2><div class="sub">${c&&c.ph==='post'?`Đang quảng bá «${esc(c.t)}». Mỗi tuần chọn sân khấu và hoạt động; ${PROMO_WK} tuần sau khi phát hành.`:'Giai đoạn trước comeback: teaser để tạo hype.'}</div>${body}
  <h3>💬 Giao lưu fan</h3><div class="card">${fanHTML()}</div>`)}
export function releaseSingle(){doSingle($('#sAct').value,$('#sCon').value,+$('#sBud').value,$('#sTitle').value,false,+($('#sSong')?.value||0))}
export function produceFilm(){
  const genre=$('#fGen').value,bud=+$('#fBud').value,title=($('#fTitle').value||pick(FT1)+' '+pick(FT2)).trim().slice(0,40);
  const cast=[...document.querySelectorAll('.fcast:checked')].map(x=>+x.value);
  if(!cast.length)return toast('Chọn ít nhất 1 diễn viên');
  if(cast.length>3)return toast('Tối đa 3 vai chính');
  if(S.money<bud)return toast('Không đủ tiền');
  S.money-=bud;book('prod',-bud);
  const f={id:uid(),title,genre,own:true,budget:bud,share:1,cost:bud,cast,status:'Đang quay',releaseAt:0,done:false,y:S.year};
  S.films.push(f);
  for(const id of cast){const a=byId(id);a.busy={kind:'shoot',filmId:f.id,title,left:8,total:8}}
  addLog(`🎬 Khởi quay phim ${GENRES[genre].n} «${title}», kinh phí ${fmt(bud)}.`,'gold');act();
}
