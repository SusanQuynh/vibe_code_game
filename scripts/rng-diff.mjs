// So chuỗi lời gọi RNG (R/rnd/pick/Math.random) theo từng khai báo top-level giữa REV (mặc định HEAD) và cây làm việc.
// Heuristic: không theo được lời gọi gián tiếp (vd genArtist()); golden vẫn là trọng tài.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseAst } from 'rollup/parseAst';

const REV = process.argv[2] || 'HEAD';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 });
const RNG = new Set(['R', 'rnd', 'pick']);
const kids = n => { const o = []; for (const k in n) { if (k === 'type' || k === 'start' || k === 'end') continue; const v = n[k]; if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') o.push(c); } else if (v && typeof v.type === 'string') o.push(v); } return o; };
const mem = n => n.type === 'Identifier' ? n.name : n.type === 'MemberExpression' && !n.computed ? mem(n.object) + '.' + n.property.name : '?';

function calls(code) {
  const prog = parseAst(code), out = new Map();
  const add = (k, s) => { if (!out.has(k)) out.set(k, []); out.get(k).push(s); };
  for (let st of prog.body) {
    if (st.type === 'ExportNamedDeclaration' && st.declaration) st = st.declaration;
    const names = st.type === 'VariableDeclaration' ? st.declarations.map(d => [d.id.name ?? 'destructure', d])
      : st.type === 'ExpressionStatement' && st.expression.type === 'AssignmentExpression' ? [[mem(st.expression.left), st]]
      : [[st.id?.name ?? '(top)', st]];
    for (const [nm, node] of names) {
      const base = nm === 'RV' && node.init?.type === 'ObjectExpression' ? null : nm;
      const walk = (n, key) => {
        if (n.type === 'CallExpression') {
          const c = n.callee;
          if ((c.type === 'Identifier' && RNG.has(c.name)) || (c.type === 'MemberExpression' && mem(c) === 'Math.random')) add(key, code.slice(n.start, n.end));
        }
        for (const k of kids(n)) walk(k, key);
      };
      if (base === null) for (const p of node.init.properties) walk(p, 'RV.' + (p.key?.name ?? p.key?.value ?? '?'));
      else walk(node, base);
    }
  }
  return out;
}

const changed = new Set(git('diff', '--name-only', REV, '--', 'src').split('\n').filter(f => f.endsWith('.js')));
for (const f of git('ls-files', '-o', '--exclude-standard', 'src').split('\n')) if (f.endsWith('.js')) changed.add(f);
let diffs = 0;
for (const f of [...changed].sort()) {
  if (f.startsWith('src/i18n/')) continue;
  let oldC = '', newC = '';
  try { oldC = git('show', `${REV}:${f}`); } catch {}
  try { newC = fs.readFileSync(f, 'utf8'); } catch {}
  const a = oldC ? calls(oldC) : new Map(), b = newC ? calls(newC) : new Map();
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    const x = (a.get(k) ?? []).join('\n'), y = (b.get(k) ?? []).join('\n');
    if (x !== y) { diffs++; console.log(`RNG khác: ${f}#${k}\n  cũ: ${JSON.stringify(a.get(k) ?? [])}\n  mới: ${JSON.stringify(b.get(k) ?? [])}`); }
  }
}
console.log(diffs ? `RNG: ${diffs} khai báo khác` : 'RNG: không đổi');
process.exit(diffs ? 1 : 0);
