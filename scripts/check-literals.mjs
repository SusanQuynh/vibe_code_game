// Chặn chuỗi tiếng Việt viết cứng trong src/ (ngoài src/i18n/). Allowlist + bộ đếm "bánh cóc" trong scripts/i18n-literals.json.
// Dùng: node scripts/check-literals.mjs [--report] [--update [--force]]
import fs from 'node:fs';
import path from 'node:path';
import { scan } from './lib/scan-literals.mjs';

const CFG = 'scripts/i18n-literals.json';
const args = new Set(process.argv.slice(2));
const cfg = fs.existsSync(CFG) ? JSON.parse(fs.readFileSync(CFG, 'utf8')) : { allow: {}, allowText: [] };
cfg.allow ??= {}; cfg.allowText ??= [];

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name).split(path.sep).join('/');
    if (e.isDirectory()) { if (p !== 'src/i18n') yield* walk(p); } else if (p.endsWith('.js')) yield p;
  }
}
const allowDecl = at => cfg.allow[at] ?? cfg.allow[at.split('#')[0] + '#*'];
const textKey = (at, text) => at + '\u0000' + text;
const allowT = new Map(cfg.allowText.map(e => [textKey(e.at, e.text), e]));

const todo = {}, kinds = {}, cmpBad = [], per = {};
let total = 0, ui = 0;
for (const f of walk('src')) {
  for (const x of scan(fs.readFileSync(f, 'utf8'), f)) {
    total++;
    const row = per[x.at] ??= { todo: 0, log: 0, name: 0, state: 0, event: 0 };
    const at = allowT.get(textKey(x.at, x.text)), ad = allowDecl(x.at);
    if (x.cmp && !at) { cmpBad.push(x); row.todo++; continue; }
    if (x.ctx === 'log') { row.log++; continue; }
    if (x.ctx === 'name') { row.name++; continue; }
    const kind = at?.kind ?? ad;
    if (kind) { row[kind] = (row[kind] ?? 0) + 1; kinds[kind] = (kinds[kind] ?? 0) + 1; continue; }
    todo[x.at] = (todo[x.at] ?? 0) + 1; row.todo++; ui++;
  }
}
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const nTodo = sum(todo);

if (args.has('--report')) {
  console.log('khai báo'.padEnd(46) + 'todo  log name state event');
  for (const [at, r] of Object.entries(per).sort((a, b) => b[1].todo - a[1].todo || a[0].localeCompare(b[0])))
    if (r.todo) console.log(at.padEnd(46) + [r.todo, r.log, r.name, r.state, r.event].map(v => String(v).padStart(4)).join(' '));
  console.log(`Tiến độ: ${total - nTodo}/${total} đã phân loại (todo ${nTodo}; log/name/state/event tính vào đã phân loại)`);
  if (cmpBad.length) console.log(`CẢNH BÁO: ${cmpBad.length} literal so sánh chưa vào allowText`);
  process.exit(0);
}

const errs = [];
for (const x of cmpBad) errs.push(`${x.at}: literal dùng để so sánh logic phải vào allowText (state, kèm why): "${x.text}"`);
if (args.has('--update')) {
  const old = cfg.todo ?? {};
  const up = Object.keys(todo).filter(k => todo[k] > (old[k] ?? 0));
  if (cfg.todo && up.length && !args.has('--force')) { console.error('Từ chối --update: số tăng ở ' + up.join(', ')); process.exit(1); }
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  cfg.todo = Object.fromEntries(Object.entries(todo).sort((a, b) => a[0].localeCompare(b[0])));
  fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`Đã ghi todo: ${nTodo} chuỗi ở ${Object.keys(todo).length} khai báo (trước: ${sum(old)})`);
  process.exit(0);
}
if (!cfg.todo) {
  for (const [at, n] of Object.entries(todo)) errs.push(`${at}: ${n} chuỗi tiếng Việt chưa phân loại`);
} else {
  for (const at of new Set([...Object.keys(todo), ...Object.keys(cfg.todo)])) {
    const n = todo[at] ?? 0, m = cfg.todo[at] ?? 0;
    if (n > m) errs.push(`chuỗi viết cứng mới ở ${at}: ${n} > ${m}`);
    else if (n < m) errs.push(`${at}: todo giảm ${m} → ${n}, chạy: npm run check:literals -- --update`);
  }
}
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`OK: todo ${nTodo}, tổng ${total} literal tiếng Việt`);
