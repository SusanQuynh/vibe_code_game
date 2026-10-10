// Extract identifiers used in inline handlers (on*="...") that are top-level declarations of the game.
// Used once to generate the window list; check-handlers.mjs verifies it afterwards.
import fs from 'node:fs';
const src = process.argv[2], extra = process.argv.slice(3);
const code = fs.readFileSync(src, 'utf8');
const decl = new Set();
for (const m of code.matchAll(/^(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) decl.add(m[1]);
const handlers = [];
for (const f of [src, ...extra])
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bon(?:click|change|input|toggle)="([^"]*)"/g)) handlers.push(m[1]);
const KW = new Set('if else event this return true false null new typeof var let const function'.split(' '));
const used = new Set();
for (const h of handlers) {
  const s = h.replace(/\$\{[^}]*\}/g, m => ' ' + m.slice(2, -1) + ' ').replace(/'[^']*'/g, "''");
  for (const m of s.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g)) if (!KW.has(m[1]) && decl.has(m[1])) used.add(m[1]);
}
console.log([...used].sort().join('\n'));
