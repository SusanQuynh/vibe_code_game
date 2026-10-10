// Dictionary check: every locale has exactly the vi key set with matching placeholders, and every key used in src/index.html exists.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { diffLocales } from '../src/i18n/check.js';

const DIR = 'src/i18n/locales';
const locs = {};
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.js')))
  locs[f.replace(/\.js$/, '')] = (await import(pathToFileURL(path.resolve(DIR, f)).href)).default;
if (!locs.vi) { console.error('Missing reference locale vi.js'); process.exit(1); }
const errs = [];
const base = locs.vi.dict;
for (const [code, L] of Object.entries(locs)) {
  if (L.meta.code !== code) errs.push(`${code}.js: meta.code='${L.meta.code}' does not match the file name`);
  if (code === 'vi') continue;
  const d = diffLocales(base, L.dict);
  if (d.missing.length) errs.push(`${code}: missing keys ${d.missing.join(', ')}`);
  if (d.extra.length) errs.push(`${code}: extra keys ${d.extra.join(', ')}`);
  if (d.badParams.length) errs.push(`${code}: placeholder/type mismatch in ${d.badParams.join(', ')}`);
}

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p); else if (p.endsWith('.js')) yield p;
  }
}
for (const f of [...walk('src'), 'index.html']) {
  const s = fs.readFileSync(f, 'utf8');
  const keys = [...s.matchAll(/\bt\(\s*'([\w.]+)'/g), ...s.matchAll(/data-i18n(?:-aria)?="([\w.]+)"/g)].map(m => m[1]);
  for (const k of new Set(keys)) if (!(k in base)) errs.push(`${f}: key '${k}' not found in vi`);
}
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`OK: ${Object.keys(base).length} keys × ${Object.keys(locs).length} languages`);
