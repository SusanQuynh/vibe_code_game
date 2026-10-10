// Quét AST tìm literal tiếng Việt. Thuần: scan(code, file) → [{at, text, ctx, cmp, plain?}]; scanCss(code, file) cho content: trong CSS.
// ctx: ui | toast (đối số toast(), không bao giờ được miễn theo khai báo) | log (addLog/pushEv hoặc biến cục bộ chảy vào chúng) | name (data/names.js) | css.
// sink (tuỳ chọn, cần cfg.sinks): id của sink cấu hình bắt được literal (đi vào S/log qua tham số hàm, thuộc tính object ghi vào S, hoặc bảng dữ liệu mà log đọc). Xem scripts/i18n-literals.json#sinks.
// cmp: literal dùng để so sánh logic (===, switch, includes/startsWith/indexOf/has, khoá object tra bằng [x], regex). plain: tiếng Việt không dấu (TTS, QL, "80 tr", nhãn tuần N<năm>/T<tuần>).
let parseAst;
try { ({ parseAst } = await import('rollup/parseAst')); }
catch { console.error("Không nạp được 'rollup/parseAst' (phụ thuộc bắc cầu của Vite). Cài lại: npm i, hoặc chuyển sang acorn (devDependencies)."); process.exit(2); }

const VI = /[À-ỹĐđ]/;
const CMP_OPS = new Set(['===', '!==', '==', '!=']);
const CMP_FN = new Set(['includes', 'startsWith', 'endsWith', 'indexOf', 'lastIndexOf', 'has']);
const LOG_FN = new Set(['addLog', 'pushEv']);
// Tiếng Việt không dấu đặc trưng: TTS, QL, "80 tr" (triệu); quasi "tr"/"N"/"T" đứng sau/trước ${..} (nhãn tuần N2025·T3). Không bắt "tr" đơn lẻ (<tr>, key).
const PLAIN = [/\bTTS\b/, /\bQL\b/, /\d\s*tr\b/];
const plainOf = (raw, first, last) => PLAIN.some(r => r.test(raw)) || (!first && /^\s*tr\b/.test(raw)) || (!last && /(^|[^\p{L}\p{N}_])[NT]$/u.test(raw));
const norm = s => s.replace(/\s+/g, ' ').trim();
const memberName = n => n.type === 'Identifier' ? n.name : n.type === 'MemberExpression' && !n.computed ? memberName(n.object) + '.' + n.property.name : null;
const kids = n => { const o = []; for (const k in n) { if (k === 'type' || k === 'start' || k === 'end') continue; const v = n[k]; if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') o.push(c); } else if (v && typeof v.type === 'string') o.push(v); } return o; };

// Danh sách đơn vị top-level: [{name, node}]. RV (object) được mở rộng thành RV.<prop>
function units(prog) {
  const out = [];
  for (let st of prog.body) {
    if (st.type === 'ExportNamedDeclaration' || st.type === 'ExportDefaultDeclaration') { if (!st.declaration) continue; st = st.declaration; }
    if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') out.push({ name: st.id?.name ?? 'default', node: st });
    else if (st.type === 'VariableDeclaration') {
      for (const d of st.declarations) {
        const nm = d.id.type === 'Identifier' ? d.id.name : 'destructure';
        if (nm === 'RV' && d.init?.type === 'ObjectExpression') for (const p of d.init.properties) out.push({ name: 'RV.' + (p.key?.name ?? p.key?.value ?? '?'), node: p });
        else out.push({ name: nm, node: d });
      }
    } else if (st.type === 'ExpressionStatement') {
      const e = st.expression;
      if (e.type === 'AssignmentExpression') { const nm = memberName(e.left); out.push({ name: nm ?? 'assign', node: st }); }
      else out.push({ name: '(top)', node: st });
    } else out.push({ name: '(top)', node: st });
  }
  return out;
}

const idents = (n, out = new Set()) => {
  if (n.type === 'Identifier') out.add(n.name);
  else if (n.type === 'MemberExpression') { idents(n.object, out); if (n.computed) idents(n.property, out); }
  else if (n.type === 'Property') { if (n.computed) idents(n.key, out); idents(n.value, out); }
  else for (const c of kids(n)) idents(c, out);
  return out;
};
// Biến cục bộ (trong cùng đơn vị) có giá trị chảy vào addLog/pushEv: các literal gán cho chúng là log
function logVars(root) {
  const vars = new Set(), asg = [];
  const w = n => {
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && LOG_FN.has(n.callee.name)) for (const a of n.arguments) idents(a, vars);
    else if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) asg.push([n.id.name, n.init]);
    else if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier') asg.push([n.left.name, n.right]);
    for (const c of kids(n)) w(c);
  };
  w(root);
  for (let ch = true; ch;) { ch = false; for (const [nm, rhs] of asg) if (vars.has(nm)) { const ids = idents(rhs); for (const i of ids) if (!vars.has(i)) { vars.add(i); ch = true; } } }
  return vars;
}
// Tên dùng làm máy thu của includes/has/indexOf (memb) hoặc object tra khoá [x] (keyed) trong cả file
function recvSets(prog) {
  const memb = new Set(), keyed = new Set();
  const w = n => {
    if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && CMP_FN.has(n.callee.property.name) && n.callee.object.type === 'Identifier') memb.add(n.callee.object.name);
    else if (n.type === 'MemberExpression' && n.computed && n.object.type === 'Identifier') keyed.add(n.object.name);
    for (const c of kids(n)) w(c);
  };
  w(prog);
  return { memb, keyed };
}
// Literal (hoặc TemplateElement của template không biểu thức) nằm ở vị trí so sánh logic?
function cmpPos(n, anc, rs) {
  let cur = n, i = anc.length - 1, viaKey = false;
  if (n.type === 'TemplateElement') { if (anc[i].expressions.length) return false; cur = anc[i--]; }
  for (; i >= 0; i--) {
    const p = anc[i];
    switch (p.type) {
      case 'ConditionalExpression': if (p.test === cur) return false; cur = p; break;
      case 'LogicalExpression': case 'ArrayExpression': case 'ObjectExpression': cur = p; break;
      case 'NewExpression': if (!p.arguments.includes(cur)) return false; cur = p; break;
      case 'Property': if (p.key !== cur || p.computed) return false; viaKey = true; cur = anc[--i]; break;
      case 'BinaryExpression': return CMP_OPS.has(p.operator);
      case 'SwitchCase': return p.test === cur;
      case 'MemberExpression': return p.object === cur && (p.computed || CMP_FN.has(p.property.name));
      case 'CallExpression': return p.callee.type === 'MemberExpression' && CMP_FN.has(p.callee.property.name) && (p.arguments.includes(cur) || p.callee.object === cur);
      case 'VariableDeclarator': return p.init === cur && p.id.type === 'Identifier' && (viaKey ? rs.keyed : rs.memb).has(p.id.name);
      case 'AssignmentExpression': return p.right === cur && p.left.type === 'Identifier' && (viaKey ? rs.keyed : rs.memb).has(p.left.name);
      default: return false;
    }
  }
  return false;
}


// ---- Sink cấu hình (đi vào S/log mà bộ quét không tự thấy) ----
// call: literal nằm trong đối số arg của lời gọi hàm/method tên fn ('removeArtist', 'hist.unshift'); cả biến cục bộ chảy vào đối số đó.
// prop: literal là giá trị của khoá key trong object literal, vế phải của phép gán vào thuộc tính key, hoặc khởi tạo của biến tên key, trong các khai báo `in`.
// data: mọi literal (hoặc chỉ khoá key nếu có) trong các khai báo `in` (bảng dữ liệu/hàm mà log hoặc S đọc nguyên văn).
const calleeText = c => c.type === 'Identifier' ? c.name : c.type === 'MemberExpression' && !c.computed ? (calleeText(c.object) ?? '') + '.' + c.property.name : null;
const fnMatch = (txt, fn) => txt != null && (txt === fn || txt.endsWith('.' + fn));
const keyName = p => p.type === 'Property' && !p.computed ? (p.key.name ?? p.key.value) : null;
// Biến cục bộ chảy vào đối số `arg` của lời gọi khớp fn (kể cả destructuring trong for-of): literal gán cho chúng thuộc sink
function sinkVars(root, fn, arg) {
  const vars = new Set(), asg = [], forOf = [];
  const w = n => {
    if (n.type === 'CallExpression' && fnMatch(calleeText(n.callee), fn) && n.arguments[arg]) idents(n.arguments[arg], vars);
    else if (n.type === 'VariableDeclarator' && n.init) asg.push([n.id, n.init]);
    else if (n.type === 'AssignmentExpression') asg.push([n.left, n.right]);
    else if (n.type === 'ForOfStatement') forOf.push(n);
    for (const c of kids(n)) w(c);
  };
  w(root);
  const names = (pat, o = new Set()) => { if (pat.type === 'Identifier') o.add(pat.name); else for (const c of kids(pat)) names(c, o); return o; };
  for (let ch = true; ch;) {
    ch = false;
    for (const [l, r] of asg) if (l.type === 'Identifier' && vars.has(l.name)) for (const i of idents(r)) if (!vars.has(i)) { vars.add(i); ch = true; }
    for (const f of forOf) { const L = f.left.type === 'VariableDeclaration' ? f.left.declarations[0].id : f.left; if ([...names(L)].some(x => vars.has(x))) for (const i of idents(f.right)) if (!vars.has(i)) { vars.add(i); ch = true; } }
  }
  return vars;
}
// Trả id sink khớp literal n (tổ tiên anc, khai báo at), hoặc null. sv = { [sinkId]: Set biến } đã tính cho khai báo này
function sinkOf(n, anc, at, sinks, sv) {
  for (const s of sinks) {
    if (s.kind === 'data') {
      if (!s.in.includes(at)) continue;
      if (!s.key || anc.some(a => keyName(a) === s.key)) return s.id;
    } else if (s.kind === 'prop') {
      if (!s.in.includes(at)) continue;
      for (let i = anc.length - 1; i >= 0; i--) {
        const a = anc[i];
        if (a.type === 'Property' && keyName(a) === s.key && (a.value === n || anc.includes(a.value))) return s.id;
        if (a.type === 'VariableDeclarator' && a.id.type === 'Identifier' && a.id.name === s.key && a.init && (a.init === n || anc.includes(a.init))) return s.id;
        if (a.type === 'AssignmentExpression' && a.left.type === 'MemberExpression' && !a.left.computed && a.left.property.name === s.key && (a.right === n || anc.includes(a.right))) return s.id;
      }
    } else if (s.kind === 'call') {
      if (s.in && !s.in.includes(at)) continue;
      for (const a of anc) if (a.type === 'CallExpression' && fnMatch(calleeText(a.callee), s.fn) && a.arguments[s.arg] && (a.arguments[s.arg] === n || anc.includes(a.arguments[s.arg]))) return s.id;
      const vars = sv[s.id];
      if (vars && vars.size) {
        if (anc.some(a => (a.type === 'VariableDeclarator' && a.id.type === 'Identifier' && vars.has(a.id.name) && a.init && (a.init === n || anc.includes(a.init))) || (a.type === 'AssignmentExpression' && a.left.type === 'Identifier' && vars.has(a.left.name) && (a.right === n || anc.includes(a.right))))) return s.id;
        if (anc.some(a => a.type === 'ForOfStatement' && (a.right === n || anc.includes(a.right)) && [...idents(a.left.type === 'VariableDeclaration' ? a.left.declarations[0].id : a.left)].some(x => vars.has(x)))) return s.id;
      }
    }
  }
  return null;
}

// Tên hàm khai báo trong file (function, const x = () =>, method): để validate sink call trỏ tới hàm có thật
export function declaredFns(code) {
  const out = new Set(), w = n => {
    if (n.type === 'FunctionDeclaration' && n.id) out.add(n.id.name);
    else if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init && /Function/.test(n.init.type)) out.add(n.id.name);
    for (const c of kids(n)) w(c);
  };
  w(parseAst(code));
  return out;
}

export function scan(code, file, sinks = []) {
  const prog = parseAst(code), res = [], rs = recvSets(prog);
  const isName = /(^|\/)src\/data\/names\.js$/.test(file);
  for (const u of units(prog)) {
    const at = `${file}#${u.name}`, lv = logVars(u.node), sv = {};
    for (const sk of sinks) if (sk.kind === 'call' && (!sk.in || sk.in.includes(at))) sv[sk.id] = sinkVars(u.node, sk.fn, sk.arg);
    const walk = (n, anc) => {
      let raw = null, first = true, last = true, cmp = false;
      if (n.type === 'Literal' && typeof n.value === 'string') raw = n.value;
      else if (n.type === 'Literal' && n.regex) { if (VI.test(n.regex.pattern)) { raw = '/' + n.regex.pattern + '/'; cmp = true; } }
      else if (n.type === 'TemplateElement') { raw = n.value.cooked ?? n.value.raw; const q = anc[anc.length - 1].quasis; first = q[0] === n; last = q[q.length - 1] === n; }
      if (raw) {
        const vi = VI.test(raw), plain = !vi && plainOf(raw, first, last);
        if (vi || plain) {
          if (!cmp) cmp = cmpPos(n, anc, rs);
          let ctx = 'ui';
          if (isName) ctx = 'name';
          else {
            for (let i = anc.length - 1; i >= 0; i--) { const a = anc[i]; if (a.type === 'CallExpression' && a.callee.type === 'Identifier') { if (a.callee.name === 'toast') { ctx = 'toast'; break; } if (LOG_FN.has(a.callee.name)) { ctx = 'log'; break; } } }
            if (ctx === 'ui' && anc.some(a => (a.type === 'VariableDeclarator' && a.id.type === 'Identifier' && lv.has(a.id.name) && a.init && (a.init === n || anc.includes(a.init))) || (a.type === 'AssignmentExpression' && a.left.type === 'Identifier' && lv.has(a.left.name)))) ctx = 'log';
          }
          const r = { at, text: norm(raw), ctx, cmp };
          if (plain) r.plain = true;
          if (sinks.length && !isName && ctx !== 'toast') { const sk = sinkOf(n, anc, at, sinks, sv); if (sk) r.sink = sk; }
          res.push(r);
        }
      }
      anc.push(n); for (const c of kids(n)) walk(c, anc); anc.pop();
    };
    walk(u.node, []);
  }
  return res;
}

// CSS: chỉ quét content: "..." có chữ tiếng Việt. at = file#selector
export function scanCss(code, file) {
  const res = [];
  for (const m of code.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const c = /content\s*:\s*(["'])((?:\\.|(?!\1).)*)\1/.exec(m[2]);
    if (c && VI.test(c[2])) res.push({ at: `${file}#${norm(m[1])}`, text: norm(c[2]), ctx: 'css', cmp: false });
  }
  return res;
}
