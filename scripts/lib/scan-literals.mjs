// Quét AST tìm literal tiếng Việt (có dấu). Thuần: scan(code, file) → [{at, text, ctx, cmp}]. Dùng bởi check-literals và test.
let parseAst;
try { ({ parseAst } = await import('rollup/parseAst')); }
catch { console.error("Không nạp được 'rollup/parseAst' (phụ thuộc bắc cầu của Vite). Cài lại: npm i, hoặc chuyển sang acorn (devDependencies)."); process.exit(2); }

const VI = /[À-ỹĐđ]/;
const CMP_OPS = new Set(['===', '!==', '==', '!=']);
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

export function scan(code, file) {
  const prog = parseAst(code), res = [];
  const isName = /(^|\/)src\/data\/names\.js$/.test(file);
  for (const u of units(prog)) {
    const at = `${file}#${u.name}`;
    const walk = (n, anc) => {
      let lits = null;
      if (n.type === 'Literal' && typeof n.value === 'string') lits = [n.value];
      else if (n.type === 'TemplateElement') lits = [n.value.cooked ?? n.value.raw];
      if (lits) {
        const raw = lits[0];
        if (raw && VI.test(raw)) {
          // cha thực sự (bỏ qua TemplateLiteral để nhìn cha của nó)
          const pi = n.type === 'TemplateElement' ? anc.length - 2 : anc.length - 1;
          const par = anc[pi];
          const parent = anc[pi + (n.type === 'TemplateElement' ? 0 : 0)];
          let cmp = false;
          if (n.type === 'Literal') {
            if (par?.type === 'BinaryExpression' && CMP_OPS.has(par.operator)) cmp = true;
            else if (par?.type === 'SwitchCase' && par.test === n) cmp = true;
            else if (par?.type === 'CallExpression' && par.callee.type === 'MemberExpression' && par.callee.property.name === 'includes' && par.arguments.includes(n)) cmp = true;
          }
          void parent;
          const ctx = isName ? 'name' : anc.some(a => a.type === 'CallExpression' && a.callee.type === 'Identifier' && a.callee.name === 'addLog') ? 'log' : 'ui';
          res.push({ at, text: norm(raw), ctx, cmp });
        }
      }
      anc.push(n); for (const c of kids(n)) walk(c, anc); anc.pop();
    };
    walk(u.node, []);
  }
  return res;
}
