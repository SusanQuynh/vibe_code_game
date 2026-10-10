// Chính sách allowlist + bánh cóc cho check:literals. Thuần (không IO) để test được: items = kết quả scan/scanCss.
// Sink (cfg.sinks): literal đi vào S/log qua tham số hàm / thuộc tính object / bảng dữ liệu. Không tính vào allowCount của allow thủ công nhưng tổng theo từng sink bị khoá (cfg.sinkCount) như bánh cóc.
// Cấu hình: allow {at → {kind, why}} (khai báo; không miễn toast/css/cmp), allowText [{at, text, kind, why, n?}], allowCount {kind → n}, todo {at → n}.
export const DECL_KINDS = ['state', 'name', 'event', 'log'];
export const SINK_KINDS = ['call', 'prop', 'data'];
export const TEXT_KINDS = ['cmp', 'state', 'name', 'event', 'log'];
// Wildcard "file#*" chỉ cho file dữ liệu tên riêng thuần
export const WILDCARD_FILES = ['src/data/names.js'];
// ctx không bao giờ được miễn theo khai báo / allowText không-cmp: toast UI và CSS content
const NEVER_DECL = new Set(['toast', 'css']);

const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
export { sum };
const tk = (at, text) => at + '\u0000' + text;
const declOf = (cfg, at) => cfg.allow[at] ?? cfg.allow[at.split('#')[0] + '#*'];

export function validateConfig(cfg) {
  const errs = [];
  for (const [at, v] of Object.entries(cfg.allow)) {
    if (!v || typeof v !== 'object') { errs.push(`allow ${at}: phải là {kind, why}`); continue; }
    if (!DECL_KINDS.includes(v.kind)) errs.push(`allow ${at}: kind lạ "${v.kind}" (hợp lệ: ${DECL_KINDS.join(', ')})`);
    if (!v.why || typeof v.why !== 'string' || !v.why.trim()) errs.push(`allow ${at}: thiếu why`);
    if (at.endsWith('#*') && !WILDCARD_FILES.includes(at.slice(0, -2))) errs.push(`allow ${at}: wildcard #* chỉ cho ${WILDCARD_FILES.join(', ')}`);
  }
  for (const e of cfg.allowText) {
    const id = `allowText ${e.at} | ${e.text}`;
    if (!TEXT_KINDS.includes(e.kind)) errs.push(`${id}: kind lạ "${e.kind}" (hợp lệ: ${TEXT_KINDS.join(', ')})`);
    if (!e.why || typeof e.why !== 'string' || !e.why.trim()) errs.push(`${id}: thiếu why`);
    if (e.kind === 'cmp') { if (e.n != null) errs.push(`${id}: kind cmp chỉ miễn literal so sánh, không có n`); }
    else if (!Number.isInteger(e.n) || e.n < 1) errs.push(`${id}: kind ${e.kind} cần n (số lần xuất hiện được miễn, nguyên >= 1)`);
  }
  const ids = new Set();
  for (const k of cfg.sinks ?? []) {
    const id = `sink ${k.id}`;
    if (!k.id || typeof k.id !== 'string') { errs.push('sink thiếu id'); continue; }
    if (ids.has(k.id)) errs.push(`${id}: trùng id`); ids.add(k.id);
    if (!SINK_KINDS.includes(k.kind)) errs.push(`${id}: kind lạ "${k.kind}" (hợp lệ: ${SINK_KINDS.join(', ')})`);
    if (!k.why || typeof k.why !== 'string' || !k.why.trim()) errs.push(`${id}: thiếu why`);
    if (k.kind === 'call') { if (!k.fn || !Number.isInteger(k.arg) || k.arg < 0) errs.push(`${id}: call cần fn và arg (nguyên >= 0)`); }
    else if (k.kind === 'prop') { if (!k.key) errs.push(`${id}: prop cần key`); if (!Array.isArray(k.in) || !k.in.length) errs.push(`${id}: prop cần in (danh sách file#khai báo)`); }
    else if (k.kind === 'data') { if (!Array.isArray(k.in) || !k.in.length) errs.push(`${id}: data cần in (danh sách file#khai báo)`); }
    for (const at of k.in ?? []) if (!/^src\/.+\.js#[\w.$]+$/.test(at)) errs.push(`${id}: in "${at}" phải dạng src/…js#khai báo`);
  }
  return errs;
}

// Phân loại từng literal. Trả về todo, exempt (số literal được miễn theo kind), cmpBad, stale, per, total.
export function classify(items, cfg, { declared } = {}) {
  // Một (khai báo, chữ) có thể có nhiều mục (vd một mục cmp + một mục state n=2); mục cmp thử trước
  const T = new Map(), TL = [];
  for (const e of [...cfg.allowText].sort((a, b) => (b.kind === 'cmp') - (a.kind === 'cmp'))) { const r = { e, used: 0, seen: 0 }; TL.push(r); const k = tk(e.at, e.text); T.set(k, [...(T.get(k) ?? []), r]); }
  const declHit = new Set(), todoItems = [], todo = {}, exempt = {}, cmpBad = [], per = {}, sink = {}, sinkAt = {};
  let total = 0;
  const bump = (row, k) => { row[k] = (row[k] ?? 0) + 1; };
  for (const x of items) {
    total++;
    const row = per[x.at] ??= { todo: 0, log: 0, name: 0, state: 0, event: 0, cmp: 0, sink: 0 };
    const d = declOf(cfg, x.at);
    if (d) declHit.add(cfg.allow[x.at] ? x.at : x.at.split('#')[0] + '#*');
    const ts = T.get(tk(x.at, x.text));
    if (ts) {
      for (const t of ts) t.seen++;
      const t = ts.find(t => t.e.kind === 'cmp' ? x.cmp : t.used < t.e.n && !NEVER_DECL.has(x.ctx));
      if (t) { t.used++; bump(exempt, t.e.kind); bump(row, t.e.kind); continue; }
    }
    if (x.cmp) { cmpBad.push(x); row.todo++; continue; }
    if (x.ctx === 'log') { row.log++; continue; }
    if (x.ctx === 'name') { row.name++; continue; }
    if (d && !NEVER_DECL.has(x.ctx)) { bump(exempt, d.kind); bump(row, d.kind); continue; }
    if (x.sink && !NEVER_DECL.has(x.ctx)) { bump(sink, x.sink); bump(row, 'sink'); (sinkAt[x.sink] ??= {})[x.at] = 1; continue; }
    todo[x.at] = (todo[x.at] ?? 0) + 1; row.todo++; todoItems.push(x);
  }
  const stale = [];
  for (const at of Object.keys(cfg.allow)) if (!declHit.has(at)) stale.push(`allow ${at}: không còn khớp literal nào, xoá mục`);
  for (const { e, used, seen } of TL) {
    if (!seen) stale.push(`allowText ${e.at} | ${e.text}: không còn khớp literal nào, xoá mục`);
    else if (e.kind !== 'cmp' && used < e.n) stale.push(`allowText ${e.at} | ${e.text}: n=${e.n} nhưng chỉ còn ${used} lần miễn được, giảm n`);
    else if (e.kind === 'cmp' && !used) stale.push(`allowText ${e.at} | ${e.text}: kind cmp nhưng không còn literal so sánh nào khớp, xoá hoặc đổi kind`);
  }
  for (const k of cfg.sinks ?? []) {
    if (!sink[k.id]) stale.push(`sink ${k.id}: không bắt được literal nào, xoá mục`);
    for (const at of k.in ?? []) if (!sinkAt[k.id]?.[at]) stale.push(`sink ${k.id}: khai báo ${at} không có literal nào khớp, xoá khỏi in`);
    if (k.kind === 'call' && declared && !k.fn.includes('.') && !declared.has(k.fn)) stale.push(`sink ${k.id}: không có hàm ${k.fn} khai báo trong src/`);
  }
  return { todo, todoItems, exempt, cmpBad, stale, per, total, sink };
}

// So với baseline (cfg.todo, cfg.allowCount). Trả về lỗi; rỗng = khớp.
export function checkBaseline(res, cfg) {
  const errs = [];
  if (!cfg.todo) { for (const [at, n] of Object.entries(res.todo)) errs.push(`${at}: ${n} chuỗi tiếng Việt chưa phân loại`); } // chế độ chặt (không có khoá todo): mọi chuỗi phải dịch hoặc có allow/sink; allowCount và sinkCount vẫn khoá bánh cóc
  else for (const at of new Set([...Object.keys(res.todo), ...Object.keys(cfg.todo)])) {
    const n = res.todo[at] ?? 0, m = cfg.todo[at] ?? 0;
    if (n > m) errs.push(`chuỗi viết cứng mới ở ${at}: ${n} > ${m}`);
    else if (n < m) errs.push(`${at}: todo giảm ${m} → ${n}, chạy: npm run check:literals -- --update`);
  }
  if (!cfg.allowCount) errs.push('thiếu allowCount trong cấu hình (cần ghi baseline: --update --force với I18N_LITERALS_FORCE=1)');
  else for (const k of new Set([...Object.keys(res.exempt), ...Object.keys(cfg.allowCount)])) {
    const n = res.exempt[k] ?? 0, m = cfg.allowCount[k] ?? 0;
    if (n > m) errs.push(`số literal được miễn (${k}) tăng ${m} → ${n}: không thêm allow/allowText để lách, dịch chuỗi`);
    else if (n < m) errs.push(`số literal được miễn (${k}) giảm ${m} → ${n}, chạy: npm run check:literals -- --update`);
  }
  if (!cfg.sinkCount) { if (Object.keys(res.sink).length) errs.push('thiếu sinkCount trong cấu hình (cần ghi baseline: --update --force với I18N_LITERALS_FORCE=1)'); }
  else for (const k of new Set([...Object.keys(res.sink), ...Object.keys(cfg.sinkCount)])) {
    const n = res.sink[k] ?? 0, m = cfg.sinkCount[k] ?? 0;
    if (n > m) errs.push(`số literal của sink ${k} tăng ${m} → ${n}: literal mới đi vào S/log phải có lý do, hoặc dịch nếu là chữ UI`);
    else if (n < m) errs.push(`số literal của sink ${k} giảm ${m} → ${n}, chạy: npm run check:literals -- --update`);
  }
  return errs;
}

// Quyết định --update. env = process.env.I18N_LITERALS_FORCE === '1'. Trả {ok, msg, next} (next = phần todo/allowCount mới).
export function decideUpdate(res, cfg, { force = false, envForce = false } = {}) {
  const bad = [...validateConfig(cfg), ...res.stale, ...res.cmpBad.map(x => `${x.at}: literal dùng để so sánh logic phải vào allowText (kind cmp, kèm why): "${x.text}"`)];
  if (bad.length) return { ok: false, msg: bad.join('\n') };
  const next = { todo: Object.fromEntries(Object.entries(res.todo).sort((a, b) => a[0].localeCompare(b[0]))), allowCount: Object.fromEntries(Object.entries(res.exempt).sort()), sinkCount: Object.fromEntries(Object.entries(res.sink).sort()) };
  const strict = !cfg.todo && !!cfg.allowCount; // chế độ chặt: đã xoá todo, không bao giờ ghi lại todo
  if (strict && Object.keys(res.todo).length) return { ok: false, msg: 'Chế độ chặt: không còn baseline todo, dịch hoặc phân loại các chuỗi sau (không ghi được): ' + Object.keys(res.todo).join(', ') };
  if (cfg.todo || strict) {
    const ups = Object.keys(res.todo).filter(k => res.todo[k] > (cfg.todo?.[k] ?? 0)).map(k => 'todo ' + k);
    for (const k of Object.keys(res.exempt)) if (res.exempt[k] > (cfg.allowCount?.[k] ?? 0)) ups.push('miễn ' + k);
    for (const k of Object.keys(res.sink)) if (res.sink[k] > (cfg.sinkCount?.[k] ?? 0)) ups.push('sink ' + k);
    if (ups.length) {
      if (!force) return { ok: false, msg: 'Từ chối --update: số tăng ở ' + ups.join(', ') };
      if (!envForce) return { ok: false, msg: 'Từ chối --force: đã có baseline. Chỉ ghi tăng được khi đặt I18N_LITERALS_FORCE=1 (và nêu lý do trong commit). Tăng ở ' + ups.join(', ') };
    }
  }
  if (strict) delete next.todo;
  return { ok: true, next };
}
