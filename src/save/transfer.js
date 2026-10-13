// Serverless save export / import: JSON → gzip → base64url, prefixed "SL1.".
const PREFIX = 'SL1.';
const MAX_CODE = 30 * 1024 * 1024;

// Errors keep their Vietnamese message (transfer.test.js) and carry a key that the save view translates.
const err = (message, key) => Object.assign(new Error(message), { key });

function toB64u(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const fromB64u = (t) => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export function checkSave(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.artists)) throw err('Dữ liệu không phải save Starlight', 'save.err.notSave');
  return d;
}

export async function exportCode(state) {
  const gz = new Blob([JSON.stringify(state)]).stream().pipeThrough(new CompressionStream('gzip'));
  return PREFIX + toB64u(new Uint8Array(await new Response(gz).arrayBuffer()));
}

export async function importCode(code) {
  code = String(code ?? '').trim().replace(/\s+/g, '');
  if (!code.startsWith(PREFIX) || code.length > MAX_CODE) throw err('Mã không hợp lệ', 'save.err.invalid');
  let txt;
  try {
    const bin = fromB64u(code.slice(PREFIX.length));
    txt = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  } catch {
    throw err('Mã không hợp lệ hoặc bị cắt cụt', 'save.err.truncated');
  }
  let d;
  try { d = JSON.parse(txt); } catch { throw err('Mã không hợp lệ', 'save.err.invalid'); }
  return checkSave(d);
}

// Accepts both SL1.… codes and .json file contents
export async function parseSaveText(text) {
  const t = String(text ?? '').trim();
  if (t.startsWith(PREFIX)) return importCode(t);
  if (t.startsWith('{')) {
    let d;
    try { d = JSON.parse(t); } catch { throw err('File không phải JSON hợp lệ', 'save.err.json'); }
    return checkSave(d);
  }
  throw err('Mã không hợp lệ', 'save.err.invalid');
}

export const importFile = async (file) => parseSaveText(await file.text());

export const saveFileName = (state) => `starlight-N${state.year}-T${state.week}.json`;

export function exportFile(state) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = saveFileName(state);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
