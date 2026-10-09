import { $, fmt } from '../../core/util.js';
import { S, byId } from '../../state.js';
import { acceptCast, bestCast, chem, effPay, slotsOf } from '../../systems/offers.js';
import { toast } from '../modal.js';

export const chemTxt=c=>c>0?`ăn ý +${Math.round(c*100)}%`:c<0?`<span class="bad">lục đục ${Math.round(c*100)}%</span>`:'';
export function acceptSel(ofId){const ids=[...document.querySelectorAll('.oc'+ofId+':checked')].map(x=>+x.value);acceptCast(ofId,ids)}
export function ocPrev(ofId,el){const of=S.offers.find(o=>o.id===ofId);if(!of)return;const bx=[...document.querySelectorAll('.oc'+ofId+':checked')];
  if(el&&bx.length>slotsOf(of)){el.checked=false;toast(`Tối đa ${slotsOf(of)} người`);return ocPrev(ofId)}
  const ids=bx.map(x=>+x.value),pay=ids.reduce((t,i)=>t+effPay(of,byId(i)),0),c=ids.length>1?chem(ids):0,o=$('#ocp'+ofId);
  if(o)o.innerHTML=ids.length?`${ids.length}/${slotsOf(of)} người · tổng ${fmt(pay)}${c?' · '+chemTxt(c):''}`:`Chọn tối đa ${slotsOf(of)} người`}
export function ocPick(ofId){const of=S.offers.find(o=>o.id===ofId);if(!of)return;const c=bestCast(of,S.artists.filter(a=>!a.busy))||[];document.querySelectorAll('.oc'+ofId).forEach(x=>x.checked=c.includes(+x.value));ocPrev(ofId)}
