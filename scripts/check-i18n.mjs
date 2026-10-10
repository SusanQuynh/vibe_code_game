// Kiểm tra từ điển: mọi locale có đúng bộ key của vi, placeholder khớp, và mọi key dùng trong src/index.html đều tồn tại.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { diffLocales } from '../src/i18n/check.js';

const DIR = 'src/i18n/locales';
const locs = {};
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.js')))
  locs[f.replace(/\.js$/, '')] = (await import(pathToFileURL(path.resolve(DIR, f)).href)).default;
if (!locs.vi) { console.error('Thiếu locale chuẩn vi.js'); process.exit(1); }
const errs = [];
const base = locs.vi.dict;
// Giá trị chuỗi: không chứa handler inline, và không còn dấu " ngoài thẻ HTML (giá trị có thể nằm trong thuộc tính title="…")
for (const [code, L] of Object.entries(locs))
  for (const [k, v] of Object.entries(L.dict)) {
    if (typeof v !== 'string') continue;
    if (/\bon\w+\s*=/i.test(v)) errs.push(`${code}: key '${k}' chứa handler inline (on*=), đặt handler trong template`);
    if (v.replace(/<[^>]*>/g, '').includes('"')) errs.push(`${code}: key '${k}' chứa dấu " ngoài thẻ HTML (vỡ thuộc tính)`);
  }
for (const [code, L] of Object.entries(locs)) {
  if (L.meta.code !== code) errs.push(`${code}.js: meta.code='${L.meta.code}' không khớp tên file`);
  if (code === 'vi') continue;
  const d = diffLocales(base, L.dict);
  if (d.missing.length) errs.push(`${code}: thiếu key ${d.missing.join(', ')}`);
  if (d.extra.length) errs.push(`${code}: thừa key ${d.extra.join(', ')}`);
  if (d.badParams.length) errs.push(`${code}: lệch placeholder/kiểu ở ${d.badParams.join(', ')}`);
}

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p); else if (p.endsWith('.js')) yield p;
  }
}
const NS = new Set(Object.keys(base).map(k => k.split('.')[0]));
const used = new Set(), dyn = new Set(['sv']); // used: key tham chiếu tĩnh; dyn: tiền tố key động (lbl('ns',k), t(`ns.${k}`), sv(), roomName())
const KEYS = Object.keys(base), isPrefix = p => KEYS.some(k => k.startsWith(p + '.')); // tiền tố cho lbl(ns,k)
for (const f of [...walk('src'), 'index.html']) {
  const s = fs.readFileSync(f, 'utf8');
  const keys = [...s.matchAll(/\bt\(\s*'([\w.]+)'/g), ...s.matchAll(/data-i18n(?:-aria)?="([\w.]+)"/g)].map(m => m[1]);
  const own = f.split(path.sep).join('/').startsWith('src/i18n/locales/'); // từ điển tự chứa key của chính nó: không tính là tham chiếu
  for (const k of keys) if (!own) used.add(k);
  for (const m of s.matchAll(/\blbl\(\s*'([\w.]+)'/g)) dyn.add(m[1]);
  for (const m of s.matchAll(/`([\w.]+?)\.?\$\{/g)) if (isPrefix(m[1])) dyn.add(m[1]);
  if (/\broomName\(/.test(s)) dyn.add('room');
  for (const k of new Set(keys)) if (!(k in base)) errs.push(`${f}: key '${k}' không có trong vi`);
  // Key nằm trong biểu thức (ternary, biến…) không khớp mẫu t('…') ở trên: mọi literal 'ns.x…'
  // có ns là namespace của từ điển (trừ tiền tố của key khác, dùng cho lbl/key ghép động) phải tồn tại.
  for (const m of s.matchAll(/'([a-z][\w]*(?:\.[\w]+)+)'/g))
    if (NS.has(m[1].split('.')[0]) && !(m[1] in base) && !isPrefix(m[1])) errs.push(`${f}: key '${m[1]}' không có trong vi`); else if (!own) { used.add(m[1]); if (isPrefix(m[1])) dyn.add(m[1]); }
}
// Cảnh báo (không đỏ): key vi không được tham chiếu tĩnh và không thuộc tiền tố key động đã thấy trong mã
const unused = KEYS.filter(k => !used.has(k) && ![...dyn].some(p => k.startsWith(p + '.')));
if (unused.length) console.warn(`CẢNH BÁO: ${unused.length} key vi không được tham chiếu tĩnh và không thuộc tiền tố key động nào (có thể thừa): ${unused.slice(0, 40).join(', ')}${unused.length > 40 ? ', …' : ''}`);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`OK: ${Object.keys(base).length} key × ${Object.keys(locs).length} ngôn ngữ`);
