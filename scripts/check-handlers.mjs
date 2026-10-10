// Every identifier used in an inline handler (on*="...") must be attached to window in a single place.
import fs from 'node:fs';
import path from 'node:path';

const GLOBALS_FILE = fs.existsSync('src/ui/globals.js') ? 'src/ui/globals.js' : 'src/game.js';
const BUILTIN = new Set(['event', 'this', 'Math', 'JSON', 'Number', 'parseInt', 'parseFloat', 'document', 'window', 'confirm', 'alert', 'navigator']);
const KW = new Set('if else return true false null undefined new typeof var let const function'.split(' '));

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p); else if (p.endsWith('.js')) yield p;
  }
}

const files = [...walk('src'), 'index.html'];
const used = new Set();
for (const f of files) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bon(?:click|change|input|toggle)="([^"]*)"/g)) {
    const s = m[1].replace(/\$\{[^}]*\}/g, ' ').replace(/'[^']*'/g, "''");
    for (const id of s.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g))
      if (!KW.has(id[1]) && !BUILTIN.has(id[1])) used.add(id[1]);
  }
}
// Expressions inside ${...} can also call globals (e.g. ${go?'propGo()':'closeM()'} -> the literal was stripped);
// names inside string literals are scanned separately:
for (const f of files)
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bon(?:click|change|input|toggle)="[^"]*\$\{[^}]*'([A-Za-z_$][\w$]*)\(\)'[^}]*\}/g)) used.add(m[1]);

const g = fs.readFileSync(GLOBALS_FILE, 'utf8');
const missing = [...used].filter(n => !new RegExp(`(?<![\\w$])${n.replace(/\$/g, '\\$')}(?![\\w$])`).test(g.slice(g.lastIndexOf('Object.assign(window'))));
if (missing.length) { console.error('Thiếu handler trên window:', missing.join(', ')); process.exit(1); }
console.log(`OK: ${used.size} định danh handler đều có trên window`);
