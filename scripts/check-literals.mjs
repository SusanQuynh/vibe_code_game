// Chặn chuỗi tiếng Việt viết cứng trong src/ (ngoài src/i18n/). Allowlist + bộ đếm "bánh cóc" trong scripts/i18n-literals.json.
// Dùng: node scripts/check-literals.mjs [--report] [--update [--force]]
// --force chỉ có tác dụng khi đã có baseline nếu đặt I18N_LITERALS_FORCE=1 (ghi tăng todo/allowCount phải có lý do trong commit).
import fs from 'node:fs';
import path from 'node:path';
import { declaredFns, scan, scanCss } from './lib/scan-literals.mjs';
import { checkBaseline, classify, decideUpdate, sum, validateConfig } from './lib/literals-policy.mjs';

const CFG = 'scripts/i18n-literals.json';
const args = new Set(process.argv.slice(2));
const cfg = fs.existsSync(CFG) ? JSON.parse(fs.readFileSync(CFG, 'utf8')) : { allow: {}, allowText: [] };
cfg.allow ??= {}; cfg.allowText ??= []; cfg.sinks ??= [];

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name).split(path.sep).join('/');
    if (e.isDirectory()) { if (p !== 'src/i18n') yield* walk(p); } else if (p.endsWith('.js') || p.endsWith('.css')) yield p;
  }
}
const items = [], declared = new Set();
for (const f of walk('src')) {
  const code = fs.readFileSync(f, 'utf8');
  if (f.endsWith('.css')) items.push(...scanCss(code, f)); else { items.push(...scan(code, f, cfg.sinks)); for (const n of declaredFns(code)) declared.add(n); }
}

const res = classify(items, cfg, { declared }), nTodo = sum(res.todo);
const cfgErrs = validateConfig(cfg);

if (args.has('--report')) {
  console.log('khai báo'.padEnd(46) + 'todo  log name state event cmp sink');
  for (const [at, r] of Object.entries(res.per).sort((a, b) => b[1].todo - a[1].todo || a[0].localeCompare(b[0])))
    if (r.todo || r.sink) console.log(at.padEnd(46) + [r.todo, r.log, r.name, r.state, r.event, r.cmp, r.sink].map(v => String(v).padStart(4)).join(' '));
  console.log(`Tiến độ: ${res.total - nTodo}/${res.total} đã phân loại (todo ${nTodo}; log/name/state/event/cmp tính vào đã phân loại)`);
  console.log('Được miễn theo allow/allowText: ' + (JSON.stringify(res.exempt)));
  console.log('Literal do sink bắt (ctx sink, khoá riêng): ' + sum(res.sink) + ' ' + JSON.stringify(res.sink));
  if (res.cmpBad.length) console.log(`CẢNH BÁO: ${res.cmpBad.length} literal so sánh chưa vào allowText`);
  for (const e of [...cfgErrs, ...res.stale]) console.log('CẢNH BÁO: ' + e);
  process.exit(0);
}

if (args.has('--update')) {
  const old = cfg.todo ?? {};
  const d = decideUpdate(res, cfg, { force: args.has('--force'), envForce: process.env.I18N_LITERALS_FORCE === '1' });
  if (!d.ok) { console.error(d.msg); process.exit(1); }
  if (d.next.todo) cfg.todo = d.next.todo; else delete cfg.todo; cfg.allowCount = d.next.allowCount; cfg.sinkCount = d.next.sinkCount; cfg.logCount = d.next.logCount;
  if (d.forced?.length) console.warn('⚠️ Ghi tăng bằng --force ở: ' + d.forced.join(', ') + ' — nêu lý do trong commit.');
  fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`Đã ghi todo: ${nTodo} chuỗi ở ${Object.keys(res.todo).length} khai báo (trước: ${sum(old)}); miễn: ${JSON.stringify(d.next.allowCount)}; sink: ${sum(d.next.sinkCount)} ${JSON.stringify(d.next.sinkCount)}`);
  process.exit(0);
}

const errs = [...cfgErrs, ...res.stale, ...res.cmpBad.map(x => `${x.at}: literal dùng để so sánh logic phải vào allowText (kind cmp, kèm why): "${x.text}"`), ...checkBaseline(res, cfg)];
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`OK: todo ${nTodo}, miễn ${sum(res.exempt)}, sink ${sum(res.sink)}, tổng ${res.total} literal tiếng Việt`);
