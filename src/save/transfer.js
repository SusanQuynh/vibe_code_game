// Xuất / nhập save không cần server: JSON → gzip → base64url, tiền tố "SL1.".
import { t } from '../i18n/index.js';
const PREFIX = 'SL1.';
const MAX_CODE = 30 * 1024 * 1024;

function toB64u(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const fromB64u = (t) => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

// Lỗi có mã: message tra từ điển lúc ném (vi trùng chữ cũ), UI dịch lại theo code lúc hiển thị
const err = (code) => Object.assign(new Error(t(`save.err.${code}`)), { code });

export function checkSave(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.artists)) throw err('notSave');
  return d;
}

export async function exportCode(state) {
  const gz = new Blob([JSON.stringify(state)]).stream().pipeThrough(new CompressionStream('gzip'));
  return PREFIX + toB64u(new Uint8Array(await new Response(gz).arrayBuffer()));
}

export async function importCode(code) {
  code = String(code ?? '').trim().replace(/\s+/g, '');
  if (!code.startsWith(PREFIX) || code.length > MAX_CODE) throw err('badCode');
  let txt;
  try {
    const bin = fromB64u(code.slice(PREFIX.length));
    txt = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  } catch {
    throw err('truncated');
  }
  let d;
  try { d = JSON.parse(txt); } catch { throw err('badCode'); }
  return checkSave(d);
}

// Nhận cả mã SL1.… lẫn nội dung file .json
export async function parseSaveText(text) {
  const t = String(text ?? '').trim();
  if (t.startsWith(PREFIX)) return importCode(t);
  if (t.startsWith('{')) {
    let d;
    try { d = JSON.parse(t); } catch { throw err('badJson'); }
    return checkSave(d);
  }
  throw err('badCode');
}

export const importFile = async (file) => parseSaveText(await file.text());

export const saveFileName = (state) => t('save.fileName', { y: state.year, w: state.week });

export function exportFile(state) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = saveFileName(state);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
