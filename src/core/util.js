export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const $=s=>document.querySelector(s);
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const FMT_VI={b:' tỷ',m:' tr',k:'k'};
export function fmt(m,u=FMT_VI){const s=m<0?'-':'';m=Math.abs(m);if(m>=1e9)return s+(m/1e9).toFixed(2).replace(/\.?0+$/,'')+u.b;if(m>=1e6)return s+Math.round(m/1e6)+u.m;return s+Math.round(m/1e3)+u.k}
export function fmtN(n){n=Math.round(n);return n>=1e6?(n/1e6).toFixed(2).replace(/\.?0+$/,'')+'M':n>=1e3?(n/1e3).toFixed(1).replace(/\.0$/,'')+'K':''+n}
