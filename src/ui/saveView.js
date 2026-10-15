import { $, esc } from '../core/util.js';
import { Lk, money, t } from '../i18n/index.js';
import { KEY, KEY_FULL, lastLoadSource, lastSaveError, replaceSave, save, saveMeta, slotInfo } from '../save/storage.js';
import { exportCode, exportFile, importFile, parseSaveText } from '../save/transfer.js';
import { S, addLog } from '../state.js';
import { act, setPos } from './building.js';
import { curView, modal, toast } from './modal.js';

let preview = null;   // { d, y, w, money, n } — parsed data awaiting overwrite confirmation
let ioMsg = null;   // { k, p } translation key + params, or { raw } for an untranslated message; pre = emoji prefix

const refresh = () => { if (curView) curView(); };

function setPreview(d) {
  preview = { d, y: d.year, w: d.week, money: d.money, n: d.artists.length };
  ioMsg = null;
}

const slotRow = (label, i, extra) => `<div class="prow"><b>${label}</b><span class="small muted">${i
  ? t('save.slot', { y: i.y, w: i.w, kb: (i.len / 1024).toFixed(1), d: i.at ? ' · ' + new Date(i.at).toLocaleString(t('fmt.locale')) : '' }) : t('save.none')}${extra || ''}</span></div>`;
const errMsg = (e) => (e && e.key ? { k: e.key, pre: '❌ ' } : { raw: e && e.message, pre: '❌ ' });
const ioHtml = (m) => (m.pre || '') + (m.k ? t(m.k, m.p) : esc(m.raw));
const readSlotData = (k) => { try { const d = JSON.parse(localStorage.getItem(k)); return d && Array.isArray(d.artists) ? d : null; } catch { return null; } };

export function viewCode() {
  const c = slotInfo('c'), f = slotInfo('f'), mf = saveMeta().f || {};
  const rest = lastLoadSource() === 'full' && f && f.at ? `<div class="card small">${t('save.restored', { d: new Date(f.at).toLocaleString(t('fmt.locale')) })}</div>` : '';
  modal(`<h2>${t('save.title')}</h2><div class="sub">${t('save.sub')}</div>
  ${rest}
  <div class="card"><b>${t('save.browser')}</b>
    ${slotRow(t('save.slotC'), c, c && c.lvl === 2 ? ' · lite' : '')}
    ${slotRow(t('save.slotF'), f, (mf.prev ? t('save.prev') : '') + (mf.err ? t('save.errLast') : ''))}
    <div class="small muted" style="margin:4px 0">${t('save.note')}</div>
    <div class="row"><button class="btn pri" onclick="saveBackupNow()">${t('save.backupNow')}</button><button class="btn" onclick="saveExportSlot('c')" ${c ? '' : 'disabled'}>${t('save.expC')}</button><button class="btn" onclick="saveExportSlot('f')" ${f ? '' : 'disabled'}>${t('save.expF')}</button><button class="btn warn" onclick="saveRestorePreview()" ${f ? '' : 'disabled'}>${t('save.restoreBtn')}</button></div></div>
  <h3>${t('save.exportH')}</h3>
  <div class="card"><div class="small" style="margin-bottom:6px">${t('save.codeLbl', { y: S.year, w: S.week })}</div>
    <textarea id="codeShow" readonly rows="3" style="width:100%;font:12px 'JetBrains Mono',monospace" placeholder="${t('save.generating')}"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn pri" onclick="saveCopyCode()">${t('save.copy')}</button><button class="btn" onclick="saveDownload()">${t('save.dl')}</button></div></div>
  <h3>${t('save.importH')}</h3>
  <div class="card"><textarea id="codeIn" rows="3" style="width:100%;font:12px 'JetBrains Mono',monospace" placeholder="${t('save.pastePh')}"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn" onclick="saveImportText()">${t('save.preview')}</button>
    <label class="btn" style="cursor:pointer">${t('save.pick')}<input type="file" accept=".json,.txt,application/json" hidden onchange="saveImportFile(this)"></label></div>
    ${preview ? `<div class="small" style="margin-top:8px">${t('save.found', { y: preview.y, w: preview.w, m: money(preview.money), n: preview.n })}</div>
    <div class="small bad" style="margin:4px 0">${t('save.overwriteWarn')}</div>
    <button class="btn pri" onclick="saveImportApply()">${t('save.overwrite')}</button>` : ''}
  </div>
  ${ioMsg ? `<div class="card small">${ioHtml(ioMsg)}</div>` : ''}`);
  exportCode(S).then((c) => { const el = $('#codeShow'); if (el) el.value = c; }, () => {});
}

export async function saveCopyCode() {
  const el = $('#codeShow');
  if (!el || !el.value) return toast(t('save.toast.notReady'));
  try { await navigator.clipboard.writeText(el.value); toast(t('save.toast.copied')); }
  catch { el.select(); toast(t('save.toast.copySel')); }
}

export function saveDownload() { exportFile(S); toast(t('save.toast.dl')); }

export function saveBackupNow() {
  if (save({ full: true })) toast(t('save.toast.backedUp'));
  else toast(t('save.toast.backupFail'));
  refresh();
}

// which: 'c' compact slot, 'f' full backup slot → fills the code box and downloads the file
export async function saveExportSlot(which) {
  const d = readSlotData(which === 'c' ? KEY : KEY_FULL);
  if (!d) return toast(t('save.toast.noSlot'));
  exportFile(d);
  try { const c = await exportCode(d), el = $('#codeShow'); if (el) el.value = c; } catch { /* file was still downloaded */ }
  toast(which === 'c' ? t('save.toast.expC') : t('save.toast.expF'));
}

// preview the backup; the existing overwrite button then restores it into both slots
export function saveRestorePreview() {
  const d = readSlotData(KEY_FULL);
  if (!d) { preview = null; ioMsg = { k: 'save.msg.noBackup' }; return refresh(); }
  setPreview(d);
  refresh();
}

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
  if (!replaceSave(preview.d)) { ioMsg = { k: lastSaveError() === 'quota' ? 'save.msg.quota' : 'save.msg.bad' }; preview = null; return refresh(); }
  preview = null; ioMsg = { k: 'save.msg.ok' };
  setPos({});
  addLog(Lk('log.sv.load'), 'gold');
  act();
}
