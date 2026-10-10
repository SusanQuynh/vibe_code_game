import { $, fmt } from '../core/util.js';
import { replaceSave } from '../save/storage.js';
import { exportCode, exportFile, importFile, parseSaveText } from '../save/transfer.js';
import { S, addLog } from '../state.js';
import { act, setPos } from './building.js';
import { curView, modal, toast } from './modal.js';

let preview = null;   // { d, y, w, money, n } — parsed data awaiting overwrite confirmation
let ioMsg = '';

const refresh = () => { if (curView) curView(); };

function setPreview(d) {
  preview = { d, y: d.year, w: d.week, money: d.money, n: d.artists.length };
  ioMsg = '';
}

export function viewCode() {
  modal(`<h2>🔑 Lưu & chuyển game</h2><div class="sub">Game tự lưu trên trình duyệt này sau mỗi thao tác. Dùng mã hoặc file để sao lưu hoặc chơi tiếp trên thiết bị khác.</div>
  <h3>Xuất</h3>
  <div class="card"><div class="small" style="margin-bottom:6px">Mã lưu (Năm ${S.year} · Tuần ${S.week}):</div>
    <textarea id="codeShow" readonly rows="3" style="width:100%;font:12px 'JetBrains Mono',monospace" placeholder="Đang tạo mã…"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn pri" onclick="saveCopyCode()">Sao chép mã</button><button class="btn" onclick="saveDownload()">Tải file .json</button></div></div>
  <h3>Nhập</h3>
  <div class="card"><textarea id="codeIn" rows="3" style="width:100%;font:12px 'JetBrains Mono',monospace" placeholder="Dán mã SL1.… hoặc nội dung file .json"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn" onclick="saveImportText()">Xem trước</button>
    <label class="btn" style="cursor:pointer">Chọn file…<input type="file" accept=".json,.txt,application/json" hidden onchange="saveImportFile(this)"></label></div>
    ${preview ? `<div class="small" style="margin-top:8px">Tìm thấy: Năm ${preview.y} · Tuần ${preview.w} · ${fmt(preview.money)} · ${preview.n} nghệ sĩ</div>
    <div class="small bad" style="margin:4px 0">Thao tác này sẽ ghi đè game hiện tại.</div>
    <button class="btn pri" onclick="saveImportApply()">Ghi đè game hiện tại</button>` : ''}
  </div>
  ${ioMsg ? `<div class="card small">${ioMsg}</div>` : ''}`);
  exportCode(S).then((c) => { const el = $('#codeShow'); if (el) el.value = c; }, () => {});
}

export async function saveCopyCode() {
  const el = $('#codeShow');
  if (!el || !el.value) return toast('Mã chưa sẵn sàng');
  try { await navigator.clipboard.writeText(el.value); toast('Đã sao chép mã'); }
  catch { el.select(); toast('Hãy sao chép mã đang được chọn'); }
}

export function saveDownload() { exportFile(S); toast('Đã tải file lưu'); }

export async function saveImportText() {
  try { setPreview(await parseSaveText($('#codeIn').value)); }
  catch (e) { preview = null; ioMsg = '❌ ' + e.message; }
  refresh();
}

export async function saveImportFile(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  try { setPreview(await importFile(f)); }
  catch (e) { preview = null; ioMsg = '❌ ' + e.message; }
  refresh();
}

export function saveImportApply() {
  if (!preview) return;
  if (!replaceSave(preview.d)) { ioMsg = '❌ Dữ liệu trong mã bị lỗi'; preview = null; return refresh(); }
  preview = null; ioMsg = '✅ Đã nạp game.';
  setPos({});
  addLog('🔑 Đã nạp game từ mã / file lưu.', 'gold');
  act();
}
