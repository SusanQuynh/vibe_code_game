import { esc, fmt, fmtN } from '../core/util.js';
import { S, abs, addLog } from '../state.js';
import { book } from './ext2.js';
import { gmOf, mKids } from './managers.js';
import { act } from '../ui/building.js';
import { toast } from '../ui/modal.js';
import { teamOf } from '../ui/views.js';

export { gmOf };
export const gmFee=m=>20e6+5e6*m.lv;
/* make m the General Manager: old GM is demoted, every top-level manager reports to the new GM */
function setGM(m){const old=gmOf();if(old&&old!==m)unGM(old);
  m.gm=1;m.as=null;m.boss=null;m.gmRaise=Math.round(m.salary*.5/1e6)*1e6;m.salary+=m.gmRaise;
  for(const x of S.managers)if(x!==m&&!x.boss)x.boss=m.id;
  S.props=null;addLog(`⭐ ${m.name} được bổ nhiệm Quản lý tổng: quản lý mọi quản lý và báo cáo trực tiếp Giám đốc.`,'gold')}
function unGM(g){g.gm=0;g.salary-=g.gmRaise||0;delete g.gmRaise;mKids(g).forEach(k=>k.boss=null);S.props=null}
export function promoteGM(id){const m=S.managers.find(x=>x.id===id);if(!m||m.gm)return;const fee=gmFee(m);if(S.money<fee)return toast('Không đủ tiền');
  S.money-=fee;book('mgr',-fee);setGM(m);act()}
export function hireGM(id){const m=(S.mgrPool||[]).find(x=>x.id===id);if(!m)return;const fee=m.fee*2;if(S.money<fee)return toast('Không đủ tiền');
  S.money-=fee;book('mgr',-fee);S.mgrPool=S.mgrPool.filter(x=>x!==m);S.managers.push(m);addLog(`🧑‍💼 Tuyển ${m.name} làm quản lý tổng.`,'good');setGM(m);act()}
export function demoteGM(btn){const g=gmOf();if(!g)return;if(btn&&btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent='Chạm lần nữa để bãi nhiệm';return}
  unGM(g);addLog(`📋 ${g.name} thôi chức Quản lý tổng, các quản lý cấp dưới báo cáo trực tiếp Giám đốc.`);act()}
/* weekly GM report; lv0/e0 are locals captured at the start of the week. No-op (and no S writes) without a GM */
export function gmReport(rep,lv0,e0){const g=gmOf();if(!g)return;const w=abs()-1,up=[],prob=[];
  for(const m of S.managers)if(m!==g&&lv0[m.id]&&m.lv>lv0[m.id])up.push(m.name);
  for(const m of S.managers){if(m===g)continue;if(m.rt>abs())prob.push(`${m.name} đang đào tạo lại`);else if(!m.as)prob.push(`${m.name} chưa được phân công`)}
  const teams=mKids(g).map(k=>{const ts=teamOf(k);let fans=0,earn=0,warn=0;
    for(const a of ts){const r=rep.a[a.id]||{};fans+=r.f||0;earn+=Math.round((a.earn||0)-(e0[a.id]||0));
      if(a.energy<30||a.mood<30){warn++;prob.push(`${a.name} ${a.energy<30?'kiệt sức':'tâm trạng xấu'}`)}
      if(a.scandal)prob.push(`${a.name} đang dính scandal`)}
    return{mid:k.id,n:ts.length,fans,earn,warn}});
  for(const e of S.events)if(e.m)prob.push('có tình huống quản lý báo lên');
  S.gmRep={w,y:rep.y,up,prob:prob.slice(0,12),teams};
  if(w%4===0){const f=teams.reduce((t,x)=>t+x.fans,0),e=teams.reduce((t,x)=>t+x.earn,0);
    addLog(`📊 QL tổng ${g.name}: ${up.length} QL lên cấp · ${f>=0?'+':''}${fmtN(f)} fan · ${e>=0?'+':''}${fmt(e)} doanh thu · ${prob.length} vấn đề`)}}
export function gmCardHTML(){const R=S.gmRep,g=gmOf();if(!g||!R)return'';
  const nm=id=>(S.managers.find(m=>m.id===id)||{name:'?'}).name;
  return`<div class="card rep" style="margin:0 0 8px"><b>⭐ Báo cáo của Quản lý tổng ${esc(g.name)}</b>
  ${R.teams.map(x=>`<div>• ${esc(nm(x.mid))}: ${x.n} người · 💗 ${x.fans>=0?'+':''}${fmtN(x.fans)} · 💰 ${x.earn>=0?'+':''}${fmt(x.earn)}${x.warn?` · <span class="w">⚠️ ${x.warn} cần chú ý</span>`:''}</div>`).join('')||'<div class="muted">Chưa có đội nào báo cáo.</div>'}
  ${R.up.length?`<div class="good">📈 Lên cấp: ${R.up.map(esc).join(', ')}</div>`:''}
  ${R.prob.length?`<div class="w">⚠️ ${R.prob.slice(0,5).map(esc).join(' · ')}${R.prob.length>5?` · +${R.prob.length-5} vấn đề khác`:''}</div>`:'<div class="muted">✅ Không có vấn đề đáng kể</div>'}</div>`}
