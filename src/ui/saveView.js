import { $, fmt } from '../core/util.js';
import { KEY, load, save } from '../save/storage.js';
import { S, addLog, setState } from '../state.js';
import { act, setPos } from './building.js';
import { curView, modal, toast } from './modal.js';

/* ---- lưu bằng mã 16 ký tự ---- */
export let DB=null;
export let dbState='loading';
export let cloudBusy=false;
export let cloudMsg='';
export let loadPreview=null;
export const CODE_AB='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newCode(){const r=new Uint32Array(16);crypto.getRandomValues(r);return Array.from(r,x=>CODE_AB[x%32]).join('')}
export const fmtCode=c=>c.match(/.{1,4}/g).join('-');
export const normCode=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
export async function cloudPut(code){
  const body={data:JSON.stringify(S),y:S.year,w:S.week,money:S.money,n:S.artists.length,t:Date.now()};
  await DB.collection('saves').doc(code).set(body);
}
export async function cloudSave(fresh){
  if(!DB)return toast('Chỉ lưu bằng mã được khi mở game trên Claude');
  if(cloudBusy)return;cloudBusy=true;
  const code=(!S.saveCode||fresh)?newCode():S.saveCode;
  const old=S.saveCode;S.saveCode=code;
  try{await cloudPut(code);cloudMsg=`✅ Đã lưu lên mã ${fmtCode(code)} lúc ${new Date().toLocaleTimeString('vi-VN')}`;save()}
  catch(e){S.saveCode=old;cloudMsg=e&&e.code==='invalid_argument'?'⚠️ Bạn không có quyền ghi dữ liệu ở trang này (cần quyền Contributor trở lên).':e&&e.code==='quota_exceeded'?'⚠️ Kho lưu đã đầy.':'⚠️ Lưu thất bại, thử lại sau.'}
  cloudBusy=false;if(curView)curView();
}
export let autoT=null;
export function cloudAuto(){if(!DB||!S.saveCode)return;clearTimeout(autoT);autoT=setTimeout(()=>{if(cloudBusy)return;cloudBusy=true;cloudPut(S.saveCode).then(()=>{cloudMsg=`☁️ Tự động đồng bộ lên mã lúc ${new Date().toLocaleTimeString('vi-VN')}`}).catch(()=>{cloudMsg='⚠️ Đồng bộ tự động thất bại'}).finally(()=>{cloudBusy=false})},1500)}
export async function cloudCheck(){
  const code=normCode($('#codeIn').value);
  if(code.length!==16)return toast('Mã cần đúng 16 ký tự');
  if(!DB)return toast('Chỉ tải bằng mã được khi mở game trên Claude');
  try{const s=await DB.collection('saves').doc(code).get();
    if(!s.exists){loadPreview=null;cloudMsg='❌ Không tìm thấy dữ liệu với mã này.'}
    else{const d=s.data();loadPreview={code,y:d.y,w:d.w,money:d.money,n:d.n,t:d.t,data:d.data};cloudMsg=''}}
  catch(e){cloudMsg='⚠️ Không đọc được dữ liệu, thử lại sau.'}
  if(curView)curView();
}
export function cloudLoad(){
  if(!loadPreview)return;
  try{const d=JSON.parse(loadPreview.data);if(!d||!d.artists)throw 0;
    setState(d);S.saveCode=loadPreview.code;
    localStorage.setItem(KEY,JSON.stringify(S));load();
    setPos({});loadPreview=null;cloudMsg=`✅ Đã tải dữ liệu từ mã ${fmtCode(S.saveCode)}.`;
    addLog(`🔑 Đã tải game từ mã lưu ${fmtCode(S.saveCode)}.`,'gold');act();
  }catch(e){toast('Dữ liệu trong mã bị lỗi')}
}
export function copyCode(){const c=fmtCode(S.saveCode);(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>toast('Đã sao chép mã'),()=>{const i=$('#codeShow');if(i){i.select();toast('Hãy sao chép mã đang được chọn')}})}
export function viewCode(){
  const lp=loadPreview;
  modal(`<h2>🔑 Lưu bằng mã</h2><div class="sub">Lưu toàn bộ tiến trình thành một mã 16 ký tự. Nhập mã ở thiết bị hoặc trình duyệt khác để chơi tiếp.</div>
  ${dbState==='loading'?'<div class="card small muted">Đang kết nối kho lưu…</div>':!DB?'<div class="card small">⚠️ Tính năng mã lưu chỉ hoạt động khi mở game qua đường link trên Claude và đã đăng nhập. Game vẫn tự lưu trên trình duyệt này.</div>':''}
  <h3>Mã của bạn</h3>
  ${S.saveCode?`<div class="card"><input type="text" id="codeShow" readonly value="${fmtCode(S.saveCode)}" style="width:100%;font:800 22px 'JetBrains Mono',monospace;letter-spacing:2px;text-align:center"><div class="row" style="margin-top:8px"><button class="btn pri" onclick="cloudSave(false)" ${!DB||cloudBusy?'disabled':''}>Lưu tiến trình lên mã này</button><button class="btn" onclick="copyCode()">Sao chép</button><button class="btn sm" onclick="cloudSave(true)" ${!DB||cloudBusy?'disabled':''}>Tạo mã mới</button></div><div class="small muted" style="margin-top:6px">Sau mỗi tuần, game tự đồng bộ lên mã này. Giữ mã bí mật: ai có mã đều tải được game của bạn.</div></div>`
  :`<div class="card"><div class="small" style="margin-bottom:8px">Bạn chưa có mã lưu.</div><button class="btn pri" onclick="cloudSave(true)" ${!DB||cloudBusy?'disabled':''}>Tạo mã và lưu</button></div>`}
  ${cloudMsg?`<div class="card small">${cloudMsg}</div>`:''}
  <h3>Tải game bằng mã</h3>
  <div class="card"><div class="row"><input type="text" id="codeIn" placeholder="XXXX-XXXX-XXXX-XXXX" maxlength="19" style="flex:1;min-width:180px;letter-spacing:1px;text-transform:uppercase" value="${lp?fmtCode(lp.code):''}"><button class="btn" onclick="cloudCheck()" ${!DB?'disabled':''}>Kiểm tra</button></div>
  ${lp?`<div class="small" style="margin-top:8px">Tìm thấy: Năm ${lp.y} · Tuần ${lp.w} · ${fmt(lp.money)} · ${lp.n} nghệ sĩ · lưu lúc ${new Date(lp.t).toLocaleString('vi-VN')}</div><div class="small bad" style="margin:4px 0">Tải mã này sẽ thay thế tiến trình hiện tại trên trình duyệt.</div><button class="btn pink" onclick="cloudLoad()">Tải game này</button>`:''}</div>`);
}
export const setDB=v=>{DB=v};
export const setDbState=v=>{dbState=v};
export const setCloudBusy=v=>{cloudBusy=v};
export const setCloudMsg=v=>{cloudMsg=v};
export const setLoadPreview=v=>{loadPreview=v};
export const setAutoT=v=>{autoT=v};
