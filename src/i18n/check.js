// Compare key sets between the reference locale (vi) and another locale. Pure; shared by tests and scripts/check-i18n.mjs.
const params = s => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]))].sort().join(',');
export function diffLocales(base, other) {
  const bk = Object.keys(base), ok = Object.keys(other);
  const missing = bk.filter(k => !(k in other)), extra = ok.filter(k => !(k in base));
  const badParams = bk.filter(k => {
    if (!(k in other)) return false;
    const a = base[k], b = other[k];
    if (typeof a !== typeof b) return true;
    // object (e.g. fmt.units): compare child keys; function: compare type only
    if (a && typeof a === 'object') return Object.keys(a).sort().join() !== Object.keys(b ?? {}).sort().join();
    return typeof a === 'string' && params(a) !== params(b);
  });
  return { missing, extra, badParams };
}
