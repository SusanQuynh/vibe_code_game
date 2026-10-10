import { $, esc } from '../core/util.js';
import { money, t } from '../i18n/index.js';
import { replaceSave } from '../save/storage.js';
import { exportCode, exportFile, importFile, parseSaveText } from '../save/transfer.js';
import { S, addLog } from '../state.js';
import { act, setPos } from './building.js';
import { curView, modal, toast } from './modal.js';

let preview = null;   // { d, y, w, money, n } — dữ liệu đã đọc, chờ xác nhận ghi đè
let ioMsg = null;   // { ok } | { code } | { text }: lưu mã lỗi, dịch lúc render để đổi ngôn ngữ tại chỗ vẫn đúng

// Chỉ nhận mã lỗi của chính ta (chuỗi có key save.err.*); DOMException có code số → dùng message.
const errMsg = (e) => (e && typeof e.code === 'string' && t(`save.err.${e.code}`) !== `save.err.${e.code}` ? { code: e.code } : { text: e && e.message });
const refresh = () => { if (curView) curView(); };

function setPreview(d) {
  // Ép kiểu số: dữ liệu nhập từ ngoài, được chèn vào innerHTML khi xem trước.
  preview = { d, y: +d.year || 0, w: +d.week || 0, money: +d.money || 0, n: d.artists.length };
  ioMsg = null;
}

export function viewCode() {
  modal(`<h2>🔑 ${t('save.title')}</h2><div class="sub">${t('save.sub')}</div>
  <h3>${t('save.export')}</h3>
  <div class="card"><div class="small" style="margin-bottom:6px">${t('save.codeLabel', { y: S.year, w: S.week })}</div>
    <textarea id="codeShow" readonly rows="3" style="width:100%;font:12px 'JetBrains Mono',monospace" placeholder="${t('save.making')}"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn pri" onclick="saveCopyCode()">${t('save.copy')}</button><button class="btn" onclick="saveDownload()">${t('save.download')}</button></div></div>
  <h3>${t('save.import')}</h3>
  <div class="card"><textarea id="codeIn" rows="3" style="width:100%;font:12px 'JetBrains Mono',monospace" placeholder="${t('save.paste')}"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn" onclick="saveImportText()">${t('save.preview')}</button>
    <label class="btn" style="cursor:pointer">${t('save.pickFile')}<input type="file" accept=".json,.txt,application/json" hidden onchange="saveImportFile(this)"></label></div>
    ${preview ? `<div class="small" style="margin-top:8px">${t('save.found', { y: preview.y, w: preview.w, m: money(preview.money), n: preview.n })}</div>
    <div class="small bad" style="margin:4px 0">${t('save.overwriteWarn')}</div>
    <button class="btn pri" onclick="saveImportApply()">${t('save.overwrite')}</button>` : ''}
  </div>
  ${ioMsg ? `<div class="card small">${ioMsg.ok ? '✅ ' + t('save.loaded') : '❌ ' + (ioMsg.code ? t(`save.err.${ioMsg.code}`) : esc(ioMsg.text))}</div>` : ''}`);
  exportCode(S).then((c) => { const el = $('#codeShow'); if (el) el.value = c; }, () => {});
}

export async function saveCopyCode() {
  const el = $('#codeShow');
  if (!el || !el.value) return toast(t('save.toast.notReady'));
  try { await navigator.clipboard.writeText(el.value); toast(t('save.toast.copied')); }
  catch { el.select(); toast(t('save.toast.selected')); }
}

export function saveDownload() { exportFile(S); toast(t('save.toast.downloaded')); }

export async function saveImportText() {
  try { setPreview(await parseSaveText($('#codeIn').value)); }
  catch (e) { preview = null; ioMsg = errMsg(e); }
  refresh();
}

export async function saveImportFile(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  try { setPreview(await importFile(f)); }
  catch (e) { preview = null; ioMsg = errMsg(e); }
  refresh();
}

export function saveImportApply() {
  if (!preview) return;
  if (!replaceSave(preview.d)) { ioMsg = { code: 'corrupt' }; preview = null; return refresh(); }
  preview = null; ioMsg = { ok: true };
  setPos({});
  addLog('🔑 Đã nạp game từ mã / file lưu.', 'gold');
  act();
}
