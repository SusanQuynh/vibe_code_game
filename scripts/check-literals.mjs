// Chặn chuỗi tiếng Việt viết cứng trong src/ (ngoài src/i18n/). Allowlist + bộ đếm "bánh cóc" trong scripts/i18n-literals.json.
// Dùng: node scripts/check-literals.mjs [--report] [--update [--force]]
// --force chỉ có tác dụng khi đã có baseline nếu đặt I18N_LITERALS_FORCE=1 (ghi tăng todo/allowCount phải có lý do trong commit).
import fs from 'node:fs';
import path from 'node:path';
import { scan, scanCss } from './lib/scan-literals.mjs';
import { checkBaseline, classify, decideUpdate, sum, validateConfig } from './lib/literals-policy.mjs';

const CFG = 'scripts/i18n-literals.json';
const args = new Set(process.argv.slice(2));
const cfg = fs.existsSync(CFG) ? JSON.parse(fs.readFileSync(CFG, 'utf8')) : { allow: {}, allowText: [] };
cfg.allow ??= {}; cfg.allowText ??= [];

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name).split(path.sep).join('/');
    if (e.isDirectory()) { if (p !== 'src/i18n') yield* walk(p); } else if (p.endsWith('.js') || p.endsWith('.css')) yield p;
  }
}
const items = [];
for (const f of walk('src')) items.push(...(f.endsWith('.css') ? scanCss : scan)(fs.readFileSync(f, 'utf8'), f));

const res = classify(items, cfg), nTodo = sum(res.todo);
const cfgErrs = validateConfig(cfg);

if (args.has('--report')) {
  console.log('khai báo'.padEnd(46) + 'todo  log name state event cmp');
  for (const [at, r] of Object.entries(res.per).sort((a, b) => b[1].todo - a[1].todo || a[0].localeCompare(b[0])))
    if (r.todo) console.log(at.padEnd(46) + [r.todo, r.log, r.name, r.state, r.event, r.cmp].map(v => String(v).padStart(4)).join(' '));
  console.log(`Tiến độ: ${res.total - nTodo}/${res.total} đã phân loại (todo ${nTodo}; log/name/state/event/cmp tính vào đã phân loại)`);
  console.log('Được miễn theo allow/allowText: ' + (JSON.stringify(res.exempt)));
  if (res.cmpBad.length) console.log(`CẢNH BÁO: ${res.cmpBad.length} literal so sánh chưa vào allowText`);
  for (const e of [...cfgErrs, ...res.stale]) console.log('CẢNH BÁO: ' + e);
  process.exit(0);
}

if (args.has('--update')) {
  const old = cfg.todo ?? {};
  const d = decideUpdate(res, cfg, { force: args.has('--force'), envForce: process.env.I18N_LITERALS_FORCE === '1' });
  if (!d.ok) { console.error(d.msg); process.exit(1); }
  cfg.todo = d.next.todo; cfg.allowCount = d.next.allowCount;
  fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`Đã ghi todo: ${nTodo} chuỗi ở ${Object.keys(res.todo).length} khai báo (trước: ${sum(old)}); miễn: ${JSON.stringify(d.next.allowCount)}`);
  process.exit(0);
}

const errs = [...cfgErrs, ...res.stale, ...res.cmpBad.map(x => `${x.at}: literal dùng để so sánh logic phải vào allowText (kind cmp, kèm why): "${x.text}"`), ...checkBaseline(res, cfg)];
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`OK: todo ${nTodo}, miễn ${sum(res.exempt)}, tổng ${res.total} literal tiếng Việt`);
