import { esc, fmt, fmtN } from '../core/util.js';
import { STATS, TRAIN } from '../data/rules.js';
import { save } from '../save/storage.js';
import { S, abs, byId } from '../state.js';
import { mgrOf } from '../systems/managers.js';
import { propCount } from '../systems/proposals.js';
import { DAYN, DAYS, TIC, daysMini, defaultDays, mgrScheduleAll, mgrSchedules, nextWeek, planWeek, planWhy, projEnergy, trainDays, weekCost } from '../systems/week.js';
import { act, blinkD, chibiHTML, render } from './building.js';
import { closeM, modal, view } from './modal.js';
import { aTags, bars, det } from './views.js';
import { viewProps } from './views/proposals.js';

export let propNext=null;
export let plan=null;
export function startPlan(force,skipProps){
  mgrScheduleAll();
  if(!skipProps&&propCount()){propNext=()=>startPlan(force,true);return view(viewProps)}
  const list=S.artists.filter(a=>!a.busy&&!mgrSchedules(a)&&a.appr!==abs()).map(a=>a.id);
  if(skipProps&&S.planOn===false){closeM();return nextWeek(force,true)}
  plan={list,i:0,day:0,force:!!force};
  view(viewPlan);
}
export function startPlanOne(id){plan={list:[id],i:0,day:0,single:true};view(viewPlan)}
export const curPA=()=>byId(plan.list[plan.i]);
export function planSel(d){plan.day=d;viewPlan()}
export function planSet(k){const a=curPA();if(!a)return;a.days[plan.day]=k;if(plan.day<6)plan.day++;save();render();viewPlan()}
export function planRec(){const a=curPA();if(a){a.days=planWeek(a,10);save();render();viewPlan()}}
export function planMgr(){const a=curPA(),m=a&&mgrOf(a),pr=m&&S.props&&S.props.m[m.id]&&S.props.m[m.id].s.find(x=>x.a===a.id);if(pr){a.days=pr.days.slice();pr.ok=1;save();render();viewPlan()}}
export function planFill(){const a=curPA();if(a){const k=a.days[plan.day];a.days=k==='rest'?Array(7).fill('rest'):defaultDays(k);save();render();viewPlan()}}
export function planNext(){plan.i++;plan.day=0;if(plan.single&&plan.i>=plan.list.length){plan=null;closeM();act();return}viewPlan()}
export function planBack(){if(plan.i>0)plan.i--;plan.day=0;viewPlan()}
export function planSkip(){plan.i=plan.list.length;viewPlan()}
export function planGo(){const f=plan.force;plan=null;closeM();nextWeek(f,true)}
export function meter(ic,v,col){return`<div class="meterrow"><span>${ic}</span><div class="mbar"><i style="width:${v}%;background:${col}"></i></div><b>${Math.round(v)}</b></div>`}
export function viewPlan(){
  if(!plan)return closeM();
  const P=plan,n=P.list.length;
  if(P.i>=n){
    const busy=S.artists.filter(a=>a.busy),isMg=a=>mgrSchedules(a)||a.appr===abs(),mg=S.artists.filter(a=>!a.busy&&isMg(a)),me=S.artists.filter(a=>!a.busy&&!isMg(a));
    const cost=weekCost();
    const line=a=>`<div class="card row small"><div class="chibi mini" style="transform:scale(.8);margin:-6px 4px -6px 0">${chibiHTML(a)}</div><b>${esc(a.name)}</b><span class="sp"></span><span class="dmini">${daysMini(a)}</span></div>`;
    modal(`<h2>📅 Lịch tuần ${S.week}</h2><div class="sub">Kiểm tra lại rồi bắt đầu tuần. Chi phí dự kiến ${fmt(cost)}.</div>
    ${me.length?det('pl-me',`Bạn xếp (${me.length})`,me.map(line).join(''),true):''}
    ${mg.length?det('pl-mg',`📋 Quản lý xếp / đã duyệt (${mg.length})`,mg.map(a=>line(a).replace('<span class="sp"></span>',`<span class="small muted">📋 ${esc((mgrSchedules(a)||mgrOf(a)||{name:'—'}).name)}</span><span class="sp"></span>`)).join(''),false):''}
    ${busy.length?det('pl-out',`🚶 Bên ngoài (${busy.length})`,`<div class="small">${busy.map(a=>`${esc(a.name)}: ${esc(a.busy.title)} (${a.busy.left} tuần)`).join('<br>')}</div>`,false):''}
    <label class="row small" style="margin:14px 0"><input type="checkbox" ${S.planOn!==false?'checked':''} onchange="S.planOn=this.checked;save()"> Hiện hồ sơ từng nghệ sĩ để xếp lịch mỗi tuần</label>
    <div class="row">${n?'<button class="btn" onclick="planBack()">◀ Sửa lại</button>':''}<span class="sp"></span><button class="btn pink" onclick="planGo()">▶ Bắt đầu tuần ${S.week}</button></div>`);
    return;
  }
  const a=byId(P.list[P.i]);if(!a){P.list.splice(P.i,1);return viewPlan()}
  const recW=planWeek(a,10),d=plan.day,pe=projEnergy(a);
  const cells=DAYS.map((x,i)=>`<button class="dcell${i===d?' on':''}${pe[i]<30?' lo':''}" onclick="planSel(${i})" aria-label="${DAYN[i]}"><small>${x}</small><span>${TIC[a.days[i]]}</span><i>⚡${pe[i]}</i></button>`).join('');
  const tiles=Object.keys(TRAIN).map(k=>{const t=TRAIN[k];const eff=k==='rest'?'+12⚡ · +🙂':Object.keys(t.g).map(s=>'+'+STATS[s]).join(' ')+` · ${Math.round(t.e*.3)}⚡`;
    return`<button class="tile${a.days[d]===k?' on':''}${recW[d]===k?' rec':''}" onclick="planSet('${k}')"><div class="ti">${TIC[k]}</div><b>${t.n}</b><span class="small muted">${eff}</span></button>`}).join('');
  const last=P.i>=n-1;
  modal(`<div class="row" style="padding-right:42px"><h2 style="margin:0">📅 ${P.single?'Lịch tuần':'Lên lịch tuần '+S.week}</h2><span class="sp"></span><span class="small muted">${P.single?'':(P.i+1)+'/'+n}</span></div>
  ${P.single?'':`<div class="prog"><i style="width:${(P.i/n)*100}%"></i></div>`}
  <div class="pstage"><div class="bigwrap"><div class="chibi big" style="${blinkD(a.id)}">${chibiHTML(a)}</div></div>
  <div class="pinfo"><h3 style="margin:0;font-size:22px">${esc(a.name)}</h3><div>${aTags(a)}</div><div class="small muted">💗 ${fmtN(a.fans)} fan · ${trainDays(a)} ngày tập, ${7-trainDays(a)} ngày nghỉ</div>
  ${meter('⚡',a.energy,a.energy<40?'var(--red)':'var(--mint)')}${meter('🙂',a.mood,a.mood<30?'var(--red)':'var(--sun)')}</div></div>
  ${bars(a)}
  <div class="dayrow">${cells}</div>
  <div class="small muted">Chọn một ngày, rồi chạm hoạt động bên dưới. Số ⚡ là năng lượng dự kiến cuối ngày${pe.some(x=>x<30)?' — <b class="bad">có ngày năng lượng quá thấp, nên thêm ngày nghỉ</b>':''}.</div>
  <div class="small" style="margin:8px 0 0"><b>${DAYN[d]}:</b> ${TIC[a.days[d]]} ${TRAIN[a.days[d]].n}</div>
  <div class="tiles">${tiles}</div>
  <div class="card small">💡 Lịch gợi ý: <span class="dmini">${recW.map(k=>TIC[k]).join('')}</span> — ${planWhy(a)}.${a.scandal?' 🚨 Đang dính scandal.':''}
  ${(()=>{const m=mgrOf(a),pr=m&&S.props&&S.props.w===abs()&&S.props.m[m.id]?S.props.m[m.id].s.find(x=>x.a===a.id):null;return pr?`<div style="margin-top:6px">📋 QL ${esc(m.name)} đề xuất: <span class="dmini">${pr.days.map(k=>TIC[k]).join('')}</span> — ${esc(pr.why)} <button class="btn sm" onclick="planMgr()">Dùng</button></div>`:''})()}
  <div class="row" style="margin-top:6px"><button class="btn sm" onclick="planRec()">Dùng lịch gợi ý</button><button class="btn sm" onclick="planFill()">Cả tuần như ${DAYS[d]} (nghỉ cuối tuần)</button></div></div>
  <div class="row">${P.i>0?'<button class="btn" onclick="planBack()">◀ Người trước</button>':''}${!P.single?`<button class="btn sm" onclick="planSkip()">Giữ lịch cũ cho ${n-P.i} người còn lại</button>`:''}<span class="sp"></span><button class="btn pri" onclick="planNext()">${P.single?'Lưu lịch':last?'Xong ▶ Tổng kết':'Người tiếp ▶'}</button></div>
  ${P.single?'':'<div class="small muted" style="margin-top:8px">Mẹo: giao quản lý "Xếp lịch tập & nghỉ" để họ tự lo cho nghệ sĩ mình phụ trách.</div>'}`);
}
export const setPropNext=v=>{propNext=v};
export const setPlan=v=>{plan=v};
