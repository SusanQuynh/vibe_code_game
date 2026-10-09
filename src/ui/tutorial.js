import { $ } from '../core/util.js';
import { save } from '../save/storage.js';
import { S } from '../state.js';
import { closeM } from './modal.js';

/* ---- Hướng dẫn người mới ---- */
export const TUT=[
 {t:'👋 Chào mừng Giám đốc!',d:'Bạn vừa tiếp quản <b>Starlight Ent.</b> với 600 triệu và 2 thực tập sinh. Mục tiêu: đào tạo, debut và đưa nghệ sĩ lên đỉnh. Bạn đã biết chơi rồi thì có thể bỏ qua hướng dẫn.',first:1},
 {sel:'.top',t:'Thanh thông tin',d:'Tuần & năm, quỹ tiền, số nghệ sĩ và tổng fan. 🔑 lưu/tải bằng mã, 🔔 sự kiện cần xử lý, ❓ mở lại hướng dẫn này bất cứ lúc nào.'},
 {sel:'.bld',t:'Tòa nhà công ty',d:'Mỗi phòng là một chức năng. Nhân vật đi lại theo lịch tập. Chạm vào phòng để mở, chạm vào nhân vật để xem hồ sơ (chỉ số, quan hệ, tiền bối, trợ lý…).'},
 {sel:'#dock',t:'Thanh phòng ban',d:'Mở nhanh từng phòng. Số đỏ trên phòng là việc đang chờ bạn.'},
 {sel:'#dock button[onclick*="lobby"]',t:'🌟 Sảnh Tuyển dụng',d:'Ký thực tập sinh (TTS), chia lứa, cho thi đấu và <b>debut</b> nhóm, solo hoặc diễn viên. TTS đủ điều kiện được ưu tiên hiện trên cùng.'},
 {sel:'#dock button[onclick*="ceo"]',t:'💼 Lịch tập',d:'Mỗi người có lịch 7 ngày. Ngày tập tăng chỉ số nhưng tốn năng lượng và tiền; ngày nghỉ hồi sức. Cuối mỗi tuần bạn sẽ được nhắc xếp lịch.'},
 {sel:'#dock button[onclick*="meet"]',t:'📨 Phòng Họp',d:'Lời mời phim, tạp kỹ, show… để kiếm tiền, fan và kinh nghiệm. Có cả việc nhỏ cho TTS. Tiền bối có thể giới thiệu đàn em vào dự án.'},
 {sel:'#dock button[onclick*="mgr"]',t:'📋 Văn phòng Quản lý',d:'Tuyển quản lý để tự xếp lịch, tự nhận việc và xử lý tình huống. Quản lý giỏi có thể <b>kèm cặp quản lý khác</b>; tên quản lý cấp dưới hiện màu theo cấp.'},
 {sel:'#dock button[onclick*="studio"]',t:'🎙️ Phòng Thu âm',d:'Phát hành single, concert. GĐ Âm nhạc chấm bài và thỉnh thoảng tự sáng tác rồi đề xuất nghệ sĩ hợp nhất.'},
 {sel:'#dock button[onclick*="gym"]',t:'🏋️ Gym & Chuyên gia sức khỏe',d:'Tuyển chuyên gia chăm sóc sức khỏe để phát hiện ai cần nghỉ nhiều hơn, rồi báo quản lý cân nhắc.'},
 {sel:'#nextBtn',t:'Kết thúc tuần',d:'Mọi lịch được thực hiện, nhận báo cáo. <b>Đầu tuần mới</b>, TTS đủ điều kiện debut sẽ hiện để bạn quyết định debut hay tiếp tục làm TTS. Ai đủ điều kiện cả nhóm lẫn solo sẽ được hỏi ý kiến.'},
 {sel:'.logbox',t:'Nhật ký & tương tác',d:'Mọi chuyện xảy ra đều ghi ở đây: nghệ sĩ giao lưu với idol công ty khác, quản lý đi cà phê hay tranh cãi, nghệ sĩ giới thiệu bạn bè làm TTS… Chúc bạn thành công! 🌟'}
];
export let tutI=-1;
export function tutStart(i){closeM();tutI=i||0;tutShow()}
export function tutShow(){document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl'));let el=$('#tut');
  if(tutI<0||tutI>=TUT.length){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='tut';el.setAttribute('role','dialog');document.body.appendChild(el)}
  const s=TUT[tutI],tg=s.sel?document.querySelector(s.sel):null;if(tg){tg.classList.add('tut-hl');try{tg.scrollIntoView({behavior:'smooth',block:'center',inline:'center'})}catch(e){}}
  el.innerHTML=`<div class="tutc">${s.first?'':`<div class="small muted">Hướng dẫn · ${tutI}/${TUT.length-1}</div>`}<h3>${s.t}</h3><div class="small">${s.d}</div>
  <div class="row" style="margin-top:10px">${s.first?`<button class="btn" onclick="tutEnd()">Bỏ qua, tôi đã biết chơi</button><span class="sp"></span><button class="btn pri" onclick="tutGo(1)">Xem hướng dẫn ➜</button>`:`<button class="btn sm" onclick="tutEnd()">Bỏ qua</button><span class="sp"></span>${tutI>1?'<button class="btn sm" onclick="tutGo(-1)">← Trước</button>':''}<button class="btn sm pri" onclick="tutGo(1)">${tutI===TUT.length-1?'Hoàn thành ✓':'Tiếp ➜'}</button>`}</div>
  ${s.first?'':`<div class="tutdots">${TUT.slice(1).map((_,i)=>`<i class="${i+1===tutI?'on':''}"></i>`).join('')}</div>`}</div>`}
export function tutGo(d){tutI+=d;if(tutI>=TUT.length)return tutEnd();if(tutI<1)tutI=1;tutShow()}
export function tutEnd(){tutI=-1;S.tut=1;save();tutShow()}
export const setTutI=v=>{tutI=v};
