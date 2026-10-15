// Pure source scanner shared by tests and scripts/i18n-literals.mjs (no fs access except walk()).
import fs from 'node:fs';
import path from 'node:path';

const ID = /[\w$]/;
const CLOSE = { '(': ')', '[': ']', '{': '}' };

// index just past the string literal that starts at i ('...' or "...")
function skipStr(s, i) {
  const q = s[i];
  for (i++; i < s.length; i++) { if (s[i] === '\\') i++; else if (s[i] === q) return i + 1; }
  return i;
}
// index just past the template literal that starts at i (handles ${ ... } nesting)
function skipTpl(s, i) {
  for (i++; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') i++;
    else if (c === '`') return i + 1;
    else if (c === '$' && s[i + 1] === '{') i = skipBal(s, i + 1) - 1;
  }
  return i;
}
// index just past the balanced group whose opening bracket is at s[i]
function skipBal(s, i) {
  const st = [CLOSE[s[i]]];
  for (i++; i < s.length && st.length; i++) {
    const c = s[i];
    if (c === "'" || c === '"') i = skipStr(s, i) - 1;
    else if (c === '`') i = skipTpl(s, i) - 1;
    else if (c === '/' && s[i + 1] === '/') { while (i < s.length && s[i] !== '\n') i++; }
    else if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i + 2); if (i < 0) return s.length; i++; }
    else if (CLOSE[c]) st.push(CLOSE[c]);
    else if (c === st[st.length - 1]) st.pop();
  }
  return i;
}
// index just past the value expression that starts at i: stops at a top-level , ; ) ] } (for sink tokens that end in = or :)
function skipExpr(s, i) {
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === "'" || c === '"') i = skipStr(s, i) - 1;
    else if (c === '`') i = skipTpl(s, i) - 1;
    else if (CLOSE[c]) i = skipBal(s, i) - 1;
    else if (c === ',' || c === ';' || c === ')' || c === ']' || c === '}') return i;
  }
  return i;
}
export { skipBal, skipStr, skipTpl, skipExpr };

// Calls and assignments whose text lands in S (log, history, lessons, busy title, PR history, GM problems, events, reasons…).
export const SINK_STARTS = ['addLog(', 'recLog(', 'pushEv(', '.hist.unshift(', '.lessons.unshift(', 'busy={', 'S.prHist.unshift(', 'prob.push(',
  // phase 3: helpers and fields whose text lands in S
  'removeArtist(', 'disbandGroup(', 'restDo(', 'setMod(', 'give(', '.last=', 'scandal={', 'S.loan={', 'hsF={', '.dw={', 'why2=', '.why=', 'c.by=', 'path.push(',
  'status:', 'film.status=', 'f.status=', 'concept:', 'S.comps.push(', 'S.batches=[', 'b={id:uid(),'];

// [{start, text}] for each occurrence of a start token (the token ends with its opening bracket).
// Occurrences preceded by an identifier character are skipped (`recLog(` is not matched inside `xrecLog(`).
export function spans(src, starts) {
  const out = [];
  for (const tok of starts) {
    let at = 0;
    while ((at = src.indexOf(tok, at)) >= 0) {
      const prev = src[at - 1];
      if (!(ID.test(tok[0]) && prev !== undefined && ID.test(prev))) {
        const open = at + tok.length - 1, last = tok[tok.length - 1];
        if (last === '=' && src[at + tok.length] === '=') { at += tok.length; continue; } // a comparison, not an assignment
        out.push({ start: at, text: src.slice(at, '([{'.includes(last) ? skipBal(src, open) : skipExpr(src, open + 1)) });
      }
      at += tok.length;
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

export function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p); else if (p.endsWith('.js')) yield p;
  }
}
