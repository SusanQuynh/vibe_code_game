export const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
export const rnd=(a,b)=>a+Math.random()*(b-a);
export const pick=a=>a[Math.floor(Math.random()*a.length)];
// index pick: same single Math.random() draw as pick(arr) when arr.length === n (stored text picks keys, not strings)
export const pickI=n=>Math.floor(Math.random()*n);
