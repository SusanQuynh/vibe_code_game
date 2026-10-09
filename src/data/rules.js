export const STATS={vocal:'Vocal',dance:'Nhảy',rap:'Rap',acting:'Diễn xuất',variety:'Tạp kỹ',visual:'Visual',stamina:'Thể lực'};
export const TRAIN_COST=3e6;
export const TRAIN={
  vocal:{n:'Vocal',room:'vocal',g:{vocal:3},e:-12},
  dance:{n:'Nhảy',room:'dance',g:{dance:3,stamina:.5},e:-15},
  rap:{n:'Rap',room:'studio',g:{rap:3},e:-10},
  acting:{n:'Diễn xuất',room:'acting',g:{acting:3},e:-12},
  variety:{n:'Tạp kỹ & MC',room:'pr',g:{variety:3},e:-8},
  gym:{n:'Gym & làm đẹp',room:'gym',g:{stamina:2.4,visual:1.2},e:-14},
  rest:{n:'Nghỉ ngơi',room:'dorm',g:{},e:35}
};
export const ROOMS=[
  {id:'ceo',n:'Phòng Giám đốc',ic:'💼',f:5,s:'Tài chính, lịch tập'},
  {id:'meet',n:'Phòng Họp',ic:'📨',f:5,s:'Lời mời & sự kiện'},
  {id:'studio',n:'Phòng Thu âm',ic:'🎙️',f:4,s:'Single, concert, rap'},
  {id:'acting',n:'Phòng Diễn xuất',ic:'🎬',f:4,s:'Luyện diễn, làm phim'},
  {id:'vocal',n:'Phòng Vocal',ic:'🎤',f:3,s:'Luyện thanh nhạc'},
  {id:'dance',n:'Phòng Nhảy',ic:'🪩',f:3,s:'Vũ đạo, thể lực'},
  {id:'gym',n:'Gym & Làm đẹp',ic:'🏋️',f:2,s:'Thể lực, visual'},
  {id:'pr',n:'Phòng Truyền thông',ic:'📰',f:2,s:'Tạp kỹ, xử lý scandal'},
  {id:'lobby',n:'Sảnh Tuyển dụng',ic:'🌟',f:1,s:'Tuyển TTS, debut'},
  {id:'dorm',n:'Ký túc xá',ic:'🛏️',f:1,s:'Nghỉ ngơi, quan hệ'},
  {id:'mgr',n:'Văn phòng Quản lý',ic:'📋',f:6,s:'Tuyển & phân công quản lý'},
  {id:'roof',n:'Sân thượng',ic:'☕',f:6,s:'Thư giãn, ngắm thành phố'},
  {id:'invest',n:'Phòng Đầu tư',ic:'📈',f:7,s:'Kinh doanh ngoài giải trí'},
  {id:'market',n:'Phòng Thị trường',ic:'📊',f:7,s:'Xu hướng & đối thủ'},
  {id:'sales',n:'Phòng Kinh doanh',ic:'💹',f:8,s:'Doanh thu & nhạc số'},
  {id:'hr',n:'Phòng Nhân sự',ic:'🗂️',f:8,s:'Hợp đồng, tiền bối, tuyển dụng'}
];
export const MSK={nego:'Đàm phán',care:'Chăm sóc',pr:'Truyền thông',plan:'Kế hoạch'};
export const MSKD={nego:'+4% thù lao và giảm 1,5% yêu cầu mỗi điểm',care:'Tăng tâm trạng, giảm hao năng lượng, giảm nguy cơ đòi rời đi',pr:'Giảm nguy cơ scandal, xử lý scandal hiệu quả hơn',plan:'+4% hiệu quả luyện tập mỗi điểm'};
export const GENRES={
  romance:{n:'Tình cảm',w:{acting:.5,visual:.4,vocal:.1}},
  action:{n:'Hành động',w:{acting:.4,stamina:.4,dance:.2}},
  horror:{n:'Kinh dị',w:{acting:.7,stamina:.3}},
  comedy:{n:'Hài',w:{acting:.4,variety:.6}},
  historical:{n:'Cổ trang',w:{acting:.5,visual:.3,stamina:.2}},
  drama:{n:'Tâm lý',w:{acting:.9,visual:.1}},
  musical:{n:'Âm nhạc',w:{acting:.4,vocal:.3,dance:.3}}
};
export const CONCEPTS={
  cute:{n:'Dễ thương',w:{vocal:.3,dance:.3,visual:.4}},
  crush:{n:'Mạnh mẽ (Crush)',w:{dance:.4,rap:.3,visual:.3}},
  ballad:{n:'Ballad',w:{vocal:.7,acting:.2,visual:.1}},
  hiphop:{n:'Hip-hop',w:{rap:.6,dance:.3,visual:.1}},
  edm:{n:'EDM',w:{dance:.5,vocal:.3,stamina:.2}},
  retro:{n:'Retro',w:{vocal:.4,dance:.3,variety:.3}},
  fantasy:{n:'Dark Fantasy',w:{dance:.4,visual:.4,acting:.2}}
};
