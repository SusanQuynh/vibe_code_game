// Static scanner for Vietnamese string literals left in src/ (display code that is not translated yet).
//   node scripts/i18n-literals.mjs --report [files…]   list findings (always exit 0)
//   node scripts/i18n-literals.mjs --strict            exit 1 on findings missing from scripts/i18n-literal-allow.json
// Ignored: comments, sink spans (text stored in S), the kept data/name tables (KEEP_CONSTS) and src/i18n/locales/**.
import fs from 'node:fs';
import path from 'node:path';
import { spans, walk, skipBal, SINK_STARTS } from './lib/js-spans.mjs';

const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const KEEP_CONSTS = ['STATS', 'TRAIN', 'MSK', 'MSKD', 'MDOM', 'GENRES', 'CONCEPTS', 'OFFER', 'PLESSON', 'PARTNERS', 'TT', 'RIVALS',
  'FN', 'MN', 'LNM', 'MGN', 'GNAMES', 'COSTARS', 'FT1', 'FT2', 'SONGS', 'SONGW', 'EXTN', 'SCOUT_W', 'COMP', 'DCOMP', 'DAYS', 'DAYN', 'DR', 'DRT', 'BIZ', 'PRE', 'POST', 'FIN_I', 'FIN_X', 'LEADS'];
const ALLOW_FILE = 'scripts/i18n-literal-allow.json';
const blank = (s, a, b) => s.slice(0, a) + s.slice(a, b).replace(/[^\n]/g, ' ') + s.slice(b);

// replace comments with spaces (string/template/regex aware)
function stripComments(s) {
  let out = s, i = 0, prev = '';
  const regexOk = () => /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || prev === '' || /\b(return|typeof|case|in|of)$/.test(prev);
  const tplEnd = (j) => { for (j++; j < s.length; j++) { if (s[j] === '\\') j++; else if (s[j] === '`') return j + 1; else if (s[j] === '$' && s[j + 1] === '{') j = skipBal(s, j + 1) - 1; } return j; };
  while (i < s.length) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '/') { let j = i; while (j < s.length && s[j] !== '\n') j++; out = blank(out, i, j); i = j; continue; }
    if (c === '/' && s[i + 1] === '*') { let j = s.indexOf('*/', i + 2); j = j < 0 ? s.length : j + 2; out = blank(out, i, j); i = j; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (j < s.length && s[j] !== c) { if (s[j] === '\\') j++; j++; } i = j + 1; prev = c; continue; }
    if (c === '`') { // template: nested ${} may hold comments but we only skip the literal as a whole
      const j = tplEnd(i); i = j; prev = c; continue;
    }
    if (c === '/' && regexOk()) { let j = i + 1, cls = false; while (j < s.length && (s[j] !== '/' || cls) && s[j] !== '\n') { if (s[j] === '\\') j++; else if (s[j] === '[') cls = true; else if (s[j] === ']') cls = false; j++; } i = j + 1; prev = '/'; continue; }
    if (!/\s/.test(c)) prev = (prev + c).slice(-8);
    i++;
  }
  return out;
}

// walk string literals and template text fragments of already-masked source; cb(fragment)
function eachLiteral(s, cb) {
  const run = (a, b) => {
    let i = a, prev = '';
    const regexOk = () => /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || prev === '' || /\b(return|typeof|case|in|of)$/.test(prev);
    while (i < b) {
      const c = s[i];
      if (c === "'" || c === '"') { let j = i + 1; while (j < b && s[j] !== c) { if (s[j] === '\\') j++; j++; } cb(s.slice(i + 1, j)); i = j + 1; prev = c; continue; }
      if (c === '`') {
        let j = i + 1, from = j;
        while (j < b && s[j] !== '`') {
          if (s[j] === '\\') { j += 2; continue; }
          if (s[j] === '$' && s[j + 1] === '{') { cb(s.slice(from, j)); const e = skipBal(s, j + 1); run(j + 2, e - 1); j = e; from = j; continue; }
          j++;
        }
        cb(s.slice(from, j)); i = j + 1; prev = c; continue;
      }
      if (c === '/' && regexOk()) { let j = i + 1, cls = false; while (j < b && (s[j] !== '/' || cls) && s[j] !== '\n') { if (s[j] === '\\') j++; else if (s[j] === '[') cls = true; else if (s[j] === ']') cls = false; j++; } i = j + 1; prev = '/'; continue; }
      if (!/\s/.test(c)) prev = (prev + c).slice(-8);
      i++;
    }
  };
  run(0, s.length);
}

export function scanFile(file, src) {
  let s = stripComments(src);
  for (const sp of spans(s, SINK_STARTS)) s = blank(s, sp.start, sp.start + sp.text.length);
  for (const n of KEEP_CONSTS) {
    const re = new RegExp(`(?:export\\s+)?(?:const|let)\\s+${n}\\s*=\\s*`, 'g');
    let m;
    while ((m = re.exec(s))) {
      const a = m.index, v = m.index + m[0].length;
      if ('{[('.includes(s[v])) { const e = skipBal(s, v); s = blank(s, a, e); re.lastIndex = e; }
    }
  }
  const out = [];
  eachLiteral(s, f => { if (VI.test(f)) out.push(f.replace(/\s+/g, ' ').trim()); });
  return out;
}

export function loadAllow() { try { return JSON.parse(fs.readFileSync(ALLOW_FILE, 'utf8')); } catch { return []; } }
// exact (trimmed) fragment match; an entry may opt into substring matching with "contains": true
export const isAllowed = (allow, file, frag) => allow.some(a => a.file === file && (a.contains ? frag.includes(a.text) : frag === a.text.trim()));

function main() {
  const args = process.argv.slice(2), strict = args.includes('--strict');
  const named = args.filter(a => !a.startsWith('--'));
  const files = (named.length ? named : [...walk('src')]).map(f => f.replace(/\\/g, '/')).filter(f => !f.startsWith('src/i18n/locales/')).sort();
  const allow = loadAllow(), bad = [], per = {};
  for (const f of files) {
    const frs = scanFile(f, fs.readFileSync(f, 'utf8'));
    per[f] = frs.length;
    for (const fr of frs) {
      const ok = isAllowed(allow, f, fr);
      if (!ok) bad.push(f);
      if (!strict || !ok) console.log(`${f}: «${fr.length > 140 ? fr.slice(0, 140) + '…' : fr}»${ok ? '  [allowed]' : ''}`);
    }
  }
  if (!strict) {
    const ent = Object.entries(per).filter(([, n]) => n);
    console.log('\n' + ent.map(([f, n]) => `${String(n).padStart(5)}  ${f}`).join('\n'));
    console.log(`TOTAL ${ent.reduce((t, [, n]) => t + n, 0)} literals with Vietnamese text in ${ent.length} files`);
    return;
  }
  const noWhy = allow.filter(a => !a.why);
  if (noWhy.length) { console.error(`${noWhy.length} allowlist entries without a 'why'`); process.exit(1); }
  if (bad.length) { console.error(`\n${bad.length} Vietnamese literals not translated or allowlisted`); process.exit(1); }
  console.log(`OK: no untranslated Vietnamese literals (${allow.length} allowlisted)`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
