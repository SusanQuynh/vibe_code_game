/* ================= DATA ================= */
const KEY='starlight_idol_save_v1';
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(m){const s=m<0?'-':'';m=Math.abs(m);if(m>=1e9)return s+(m/1e9).toFixed(2).replace(/\.?0+$/,'')+' tỷ';if(m>=1e6)return s+Math.round(m/1e6)+' tr';return s+Math.round(m/1e3)+'k'}
function fmtN(n){n=Math.round(n);return n>=1e6?(n/1e6).toFixed(2).replace(/\.?0+$/,'')+'M':n>=1e3?(n/1e3).toFixed(1).replace(/\.0$/,'')+'K':''+n}

const STATS={vocal:'Vocal',dance:'Nhảy',rap:'Rap',acting:'Diễn xuất',variety:'Tạp kỹ',visual:'Visual',stamina:'Thể lực'};
const FN=['Hà Linh','Minh Thư','Bảo Ngọc','Khánh Vy','Thảo My','Ngọc Anh','Phương Nhi','Gia Hân','Tuệ Lâm','An Nhiên','Diệp Chi','Mai Phương','Quỳnh Như','Tú Anh','Yến Nhi','Lan Chi','Hải Yến','Kim Ngân','Thanh Trúc','Bảo Hân','Cát Tường','Hạ Vy','Ánh Dương','Thu Hà','Linh Đan','Khả Hân'];
const MN=['Minh Khôi','Gia Huy','Hoàng Nam','Đức Anh','Quang Vinh','Tuấn Kiệt','Bảo Long','Nhật Minh','Thành Đạt','Khải Hưng','Phúc An','Trung Kiên','Duy Khánh','Hải Đăng','Việt Hoàng','Lâm Phong','Thiên Ân','Đăng Khoa','Hữu Phước','Gia Bảo','Tùng Lâm','Minh Quân','Khánh Duy','An Khang'];
const HAIR=['#2b2233','#5a3825','#c98b4b','#f3d27a','#e86a92','#8a6cff','#4aa3df','#d9d4e8','#b23a48','#3a7d5c','#1d1d2b'];
const SKIN=['#ffe0c7','#f8d0b0','#eebf98','#d9a27c'];
const OUT=['#ff4f8b','#6d4bff','#16b98f','#ffb21e','#4aa3df','#ff7a59','#333a56','#e9e9f2','#9b5de5','#00bbf9'];

const TRAIN_COST=3e6;
const TRAIN={
  vocal:{n:'Vocal',room:'vocal',g:{vocal:3},e:-12},
  dance:{n:'Nhảy',room:'dance',g:{dance:3,stamina:.5},e:-15},
  rap:{n:'Rap',room:'studio',g:{rap:3},e:-10},
  acting:{n:'Diễn xuất',room:'acting',g:{acting:3},e:-12},
  variety:{n:'Tạp kỹ & MC',room:'pr',g:{variety:3},e:-8},
  gym:{n:'Gym & làm đẹp',room:'gym',g:{stamina:2.4,visual:1.2},e:-14},
  rest:{n:'Nghỉ ngơi',room:'dorm',g:{},e:35}
};
const ROOMS=[
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
const MSK={nego:'Đàm phán',care:'Chăm sóc',pr:'Truyền thông',plan:'Kế hoạch'};
const MSKD={nego:'+4% thù lao và giảm 1,5% yêu cầu mỗi điểm',care:'Tăng tâm trạng, giảm hao năng lượng, giảm nguy cơ đòi rời đi',pr:'Giảm nguy cơ scandal, xử lý scandal hiệu quả hơn',plan:'+4% hiệu quả luyện tập mỗi điểm'};
const LNM=['Nguyễn','Trần','Lê','Phạm','Hoàng','Vũ','Đặng','Bùi','Đỗ','Hồ'];
const MGN=['Thu Hương','Văn Hải','Minh Tâm','Quốc Huy','Ngọc Lan','Thanh Bình','Hồng Nhung','Đức Thắng','Mỹ Linh','Hoài Nam','Kim Oanh','Tiến Dũng'];

const GENRES={
  romance:{n:'Tình cảm',w:{acting:.5,visual:.4,vocal:.1}},
  action:{n:'Hành động',w:{acting:.4,stamina:.4,dance:.2}},
  horror:{n:'Kinh dị',w:{acting:.7,stamina:.3}},
  comedy:{n:'Hài',w:{acting:.4,variety:.6}},
  historical:{n:'Cổ trang',w:{acting:.5,visual:.3,stamina:.2}},
  drama:{n:'Tâm lý',w:{acting:.9,visual:.1}},
  musical:{n:'Âm nhạc',w:{acting:.4,vocal:.3,dance:.3}}
};
const CONCEPTS={
  cute:{n:'Dễ thương',w:{vocal:.3,dance:.3,visual:.4}},
  crush:{n:'Mạnh mẽ (Crush)',w:{dance:.4,rap:.3,visual:.3}},
  ballad:{n:'Ballad',w:{vocal:.7,acting:.2,visual:.1}},
  hiphop:{n:'Hip-hop',w:{rap:.6,dance:.3,visual:.1}},
  edm:{n:'EDM',w:{dance:.5,vocal:.3,stamina:.2}},
  retro:{n:'Retro',w:{vocal:.4,dance:.3,variety:.3}},
  fantasy:{n:'Dark Fantasy',w:{dance:.4,visual:.4,acting:.2}}
};
const OFFER={
  drama:{sl:[1,3],n:'Phim truyền hình',ic:'📺',film:1,wk:[8,12],pay:[80,240],fans:[8000,40000],fame:6,lesson:{acting:4,visual:1},lt:['Học cách giữ mạch cảm xúc qua nhiều tập','Phối hợp ăn ý hơn với bạn diễn','Quen với lịch quay dày đặc']},
  movie:{sl:[1,3],n:'Phim điện ảnh',ic:'🎞️',film:1,wk:[6,10],pay:[150,480],fans:[10000,60000],fame:15,lesson:{acting:6,stamina:1},lt:['Diễn tiết chế hơn trước ống kính lớn','Biểu cảm bằng ánh mắt tinh tế hơn','Rèn sức bền qua những cảnh quay khó']},
  web:{sl:[1,2],n:'Web drama',ic:'📱',film:1,wk:[3,5],pay:[30,90],fans:[3000,15000],fame:0,lesson:{acting:3,visual:1},lt:['Làm quen với máy quay','Diễn tự nhiên, gần gũi hơn']},
  variety:{sl:[1,4],n:'Tạp kỹ',ic:'🎪',wk:[1,2],req:{variety:1,stamina:.6},pay:[20,80],fans:[2000,15000],fame:3,lesson:{variety:4,stamina:1},lt:['Phản xạ nhanh và hài hước hơn','Biết tạo khoảnh khắc đáng nhớ']},
  music:{sl:[1,5],n:'Show âm nhạc',ic:'🎶',wk:[1,1],req:{vocal:1,dance:.8},pay:[15,60],fans:[2000,12000],fame:2,lesson:{vocal:2,dance:2},lt:['Giữ hơi tốt hơn khi vừa hát vừa nhảy','Tự tin hơn trên sân khấu lớn']},
  survival:{sl:[1,3],n:'Show sống còn',ic:'🔥',wk:[6,8],req:{vocal:.8,dance:.8,rap:.6},pay:[10,40],fans:[20000,90000],fame:0,lesson:{vocal:3,dance:3,rap:2,stamina:2},lt:['Trưởng thành qua áp lực loại trừ','Học hỏi từ các thí sinh giỏi'],trainee:1},
  magazine:{sl:[1,2],n:'Tạp chí',ic:'📸',wk:[1,1],req:{visual:1},pay:[10,50],fans:[1000,8000],fame:5,lesson:{visual:3},lt:['Biết tạo dáng và tìm góc đẹp','Hiểu thêm về thời trang']},
  backup:{sl:[1,4],n:'Vũ công phụ họa',ic:'🩰',wk:[1,2],req:{dance:1,stamina:.6},pay:[4,12],fans:[300,1500],fame:0,lesson:{dance:3,stamina:1},lt:['Học cách nhảy đồng đều với đội','Quen ánh đèn sân khấu lớn'],trainee:1,tj:1},
  guide:{sl:[1,2],n:'Thu âm demo & hát bè',ic:'🎧',wk:[1,1],req:{vocal:1},pay:[3,10],fans:[100,600],fame:0,lesson:{vocal:3},lt:['Hiểu cách làm việc trong phòng thu','Hát bè chuẩn hơn'],trainee:1,tj:1},
  extra:{sl:[1,3],n:'Diễn viên phụ MV',ic:'🎬',wk:[1,1],req:{visual:1,acting:.6},pay:[3,9],fans:[300,1200],fame:0,lesson:{acting:2,visual:1},lt:['Làm quen với máy quay','Biểu cảm tự nhiên hơn'],trainee:1,tj:1},
  model:{sl:[1,2],n:'Người mẫu ảnh online',ic:'👗',wk:[1,1],req:{visual:1},pay:[4,12],fans:[200,1000],fame:0,lesson:{visual:3},lt:['Biết tạo dáng nhanh hơn','Hiểu thêm về thời trang'],trainee:1,tj:1},
  ad:{sl:[1,2],n:'Quảng cáo',ic:'💄',wk:[1,2],req:{visual:1,variety:.6},pay:[40,180],fans:[2000,10000],fame:20,lesson:{visual:2,variety:1},lt:['Truyền tải thông điệp thương hiệu tốt hơn','Tự nhiên hơn trước ống kính quảng cáo']}
};
const PARTNERS={drama:['Đài VTX','Đài HTN','Đài Sóng Xanh'],movie:['Lotus Pictures','Ngân Hà Studio','Phim Mây Trắng'],web:['NetPhim','YouStar','PopTV'],variety:['Đài VTX','Đài HTN','Kênh Vui'],music:['Sân Khấu Sao','Đài Âm Nhạc','Music Weekly'],survival:['Đài HTN','Produce Việt'],backup:['Sân Khấu Sao','Concert Mùa Hè','Lễ hội Âm nhạc'],guide:['Studio Nốt Xanh','Âm Nhạc Mới','Studio Gió'],extra:['MV Factory','Phim Ngắn Việt','YouStar'],model:['Shop Mây','Thời trang Teen','Lụa Online'],magazine:['Tạp chí Mốt','Tạp chí Ngôi Sao','Style VN'],ad:['Mỹ phẩm Hoa Sen','Nước ngọt Bờ Biển','Điện thoại Nova','Thời trang Lụa']};
const COSTARS=['Trần Bảo Châu','Lê Hữu Thắng','Ngô Kiều Anh','Phạm Quốc Bảo','Vũ Diệu Linh','Đỗ Minh Hiếu','Hồ Thu Trang','Lý Gia Bảo','Mai Tuyết Nhung','Tôn Đức Thịnh'];
const FT1=['Mùa Hạ','Hẹn Ước','Thành Phố','Ánh Trăng','Bí Mật','Người Thừa Kế','Đêm Đông','Gió Ngược','Ký Ức','Bản Tình Ca','Hoàng Cung','Cánh Diều','Lời Nguyền','Vệt Nắng'];
const FT2=['Cuối Cùng','Của Em','Không Tên','Rực Lửa','Năm Ấy','Lặng Im','Màu Xanh','Phía Trước','Tan Vỡ','Bất Tận'];
const TT={backup:['Concert cuối năm','Lễ trao giải âm nhạc','Sân khấu đặc biệt'],guide:['Demo bài mới','Hát bè album','Bản thu thử'],extra:['MV ballad','MV học đường','MV mùa hè'],model:['Bộ sưu tập thu','Lookbook học sinh','Ảnh sản phẩm'],variety:['Vui Hết Cỡ','Nhà Chung Mùa Hè','Đường Đến Bếp Ngon','Cuộc Đua Kỳ Thú','Ai Là Vua Trò Chơi'],music:['Sân Khấu Đêm Thứ Sáu','Bảng Xếp Hạng Tuần','Lễ Hội Âm Nhạc Mùa Thu'],survival:['Ngôi Sao Kế Tiếp','Debut Hay Dừng Lại','Thần Tượng 101'],magazine:['Bìa số tháng','Bộ ảnh thời trang','Phỏng vấn trang đôi'],ad:['TVC mùa hè','Đại sứ thương hiệu','Chiến dịch Tết']};
const SONGS=['Butterfly','Neon','Pink Moon','Starlight','Run','Bad Love','Hello Summer','Echo','Midnight','Fever','Cherry','Bloom','Firework','Lucky','Blue Ocean','Galaxy','Sugar Rush','Mirror','Paradise','Wild Heart'];
const RIVALS=[['Hoa Mai Music',60000],['Moonlight Ent.',160000],['Blue Wave',380000],['Galaxy Star',800000],['Titan Media',1500000]];

/* ================= STATE ================= */
let S, curView=null, pos={}, awardToShow=null;
const abs=()=>(S.year-1)*52+S.week;
const uid=()=>S.nid++;
const byId=id=>S.artists.find(a=>a.id===id);
const fame=a=>Math.min(100,Math.round(Math.sqrt(a.fans/100)));
const fit=(a,w)=>{let s=0,t=0;for(const k in w){s+=a.st[k]*w[k];t+=w[k]}return t?s/t:0};
const newYr=()=>({fans:0,actQ:0,variety:0});
function addLog(t,c=''){S.log.unshift({t,c,w:`N${S.year}·T${S.week}`});if(S.log.length>80)S.log.length=80}

function genTitle(type){if(OFFER[type].film)return pick(FT1)+' '+pick(FT2);return pick(TT[type])}
function mkLook(g,out){const style=g==='F'?pick(['long','twin','pony','bun','short','long']):pick(['short','spiky','short','pony']);return{hair:pick(HAIR),skin:pick(SKIN),out,style,long:!['short','spiky'].includes(style),skirt:g==='F'&&Math.random()<.5}}
function ensureLook(o){const L=o.look;if(!L)return;const i=typeof o.id==='number'?o.id:0;if(!L.style)L.style=L.long?['long','twin','pony','bun'][i%4]:['short','spiky'][i%2];if(L.skirt===undefined)L.skirt=o.g==='F'&&i%2===0}
function genArtist(){
  const g=Math.random()<.5?'F':'M';
  const used=new Set(S.artists.map(a=>a.name).concat(S.pool.map(a=>a.name)));
  let name;for(let i=0;i<30;i++){name=pick(g==='F'?FN:MN);if(!used.has(name))break}
  if(used.has(name))name+=' '+R(2,9);
  const base=R(6,24)+Math.floor((S.awards?compRep():0)/12),st={};
  for(const k in STATS)st[k]=clamp(base+R(-6,14),3,55);
  const sp=pick(Object.keys(STATS));st[sp]=clamp(st[sp]+R(10,22),3,68);
  return{id:uid(),name,g,age:R(16,22),look:mkLook(g,pick(OUT)),
    st,talent:+(0.75+Math.random()*.5).toFixed(2),spec:sp,energy:100,mood:70,fans:0,status:'trainee',solo:false,actor:false,
    sched:'vocal',days:defaultDays('vocal'),busy:null,salary:1e6,co:{},rel:{},tag:{},pw:{},scandal:null,yr:newYr(),debutYear:0,lessons:[],hist:[],wantAct:0};
}
function genPool(n){const r=[];for(let i=0;i<n;i++){const a=genArtist();S.pool.push(a);r.push(a)}S.pool=S.pool.filter(x=>r.includes(x));return r}

function genManager(){const sk={};for(const k in MSK)sk[k]=R(1,5);const sp=pick(Object.keys(MSK));sk[sp]=clamp(sk[sp]+R(2,4),1,10);const tot=Object.values(sk).reduce((a,b)=>a+b,0);
  return{id:uid(),name:pick(LNM)+' '+pick(MGN),look:mkLook(Math.random()<.5?'F':'M',pick(['#333a56','#5b6b8c','#2f4f4f','#6b4f3a','#7a7f8c'])),sk,spec:sp,lv:1,exp:0,salary:Math.round(tot*.3)*1e6,fee:tot*3e6,as:null,auto:'off',ps:2}}
function genMgrPool(){S.mgrPool=[];for(let i=0;i<3;i++)S.mgrPool.push(genManager())}
const mTot=m=>Object.values(m.sk).reduce((x,y)=>x+y,0);
function mgrTargets(m){if(!m.as)return[];if(m.as.t==='t')return S.artists.filter(a=>a.status==='trainee');if(m.as.t==='b')return S.artists.filter(a=>a.status==='trainee'&&a.batch===m.as.id);if(m.as.t==='l')return(m.as.ids||[]).map(byId).filter(Boolean);if(m.as.t==='s')return S.artists.filter(a=>a.solo&&!a.pm);if(m.as.t==='d')return S.artists.filter(a=>a.actor);if(m.as.t==='a'){const a=byId(m.as.id);return a?[a]:[]}const g=S.groups.find(x=>x.id===m.as.id);return g?g.members.map(byId).filter(Boolean):[]}
function mgrOf(a){let best=null;for(const m of S.managers)if(m.as&&mgrTargets(m).includes(a)&&(!best||mTot(m)>mTot(best)))best=m;return best}
const mBoss=m=>m.boss?S.managers.find(x=>x.id===m.boss)||null:null;
const mKids=m=>S.managers.filter(x=>x.boss===m.id);
function inSub(root,x){for(const k of mKids(root))if(k===x||inSub(k,x))return true;return false}
const mCap=m=>2+Math.floor(m.lv/2);
const effSk=(m,k)=>{const b=mBoss(m);return Math.min(10,m.sk[k]+(b?Math.floor(b.sk[k]*.2):0)+asstB(m,k))};
const msk=(a,k)=>{const m=mgrOf(a),v=m?effSk(m,k):0,b=a.pm?Math.max(v,a.pm.sk[k]||0):v;return Math.min(10,b+(a.pa&&a.pa.k===k?a.pa.v:0))};
function givePM(a,quiet){if(a.pm)return;const sk={};for(const k in MSK)sk[k]=R(3,7);a.pm={id:-a.id,name:pick(LNM)+' '+pick(MGN),sk,lv:1,ps:1,boss:null};
  for(const m of S.managers){if(m.as&&m.as.t==='a'&&m.as.id===a.id)m.as=null;if(m.as&&m.as.t==='l')m.as.ids=m.as.ids.filter(i=>i!==a.id)}S.props=null;
  if(!quiet)addLog(`🧑‍💼 ${a.name} tách solo và tự chọn quản lý riêng: ${a.pm.name}. Văn phòng Quản lý không cần phụ trách nữa.`)}
function setBoss(id,v){const m=S.managers.find(x=>x.id===id);if(!m)return;
  if(!v){m.boss=null;addLog(`📋 ${m.name} báo cáo trực tiếp Giám đốc.`)}
  else{const b=S.managers.find(x=>x.id===+v);if(!b||b===m||inSub(m,b))return toast('Không thể tạo vòng lặp cấp bậc');if(mKids(b).length>=mCap(b))return toast(`${b.name} chỉ quản được ${mCap(b)} người ở cấp hiện tại`);m.boss=b.id;addLog(`📋 ${m.name} giờ báo cáo cho ${b.name}.`)}
  act()}
function targetName(m){if(!m.as)return'Chưa phân công';if(m.as.t==='t')return'tất cả thực tập sinh';if(m.as.t==='b'){const b=(S.batches||[]).find(x=>x.id===m.as.id);return b?'thực tập sinh '+b.n.toLowerCase():'lứa đã giải tán'}if(m.as.t==='s')return'tất cả nghệ sĩ solo';if(m.as.t==='d')return'tất cả diễn viên';if(m.as.t==='l'){const ts=mgrTargets(m);return ts.length?`${ts.length} nghệ sĩ: ${ts.slice(0,2).map(a=>a.name).join(', ')}${ts.length>2?'…':''}`:'danh sách trống'}if(m.as.t==='g'){const g=S.groups.find(x=>x.id===m.as.id);return g?'nhóm '+g.name:'—'}const a=byId(m.as.id);return a?a.name:'—'}
function mgrExp(m,n=1){const b=mBoss(m);if(b&&n>=.25)mgrExp(b,n*.5);m.exp=+(m.exp+n).toFixed(2);while(m.exp>=m.lv*4){m.exp-=m.lv*4;m.lv++;const ks=Object.keys(MSK).filter(k=>m.sk[k]<10),k=ks.length?pick(ks):null;if(k)m.sk[k]++;m.salary+=1e6;addLog(`📈 Quản lý ${m.name} lên cấp ${m.lv}${k?' ('+MSK[k]+' +1)':''}.`,'good')}}
function mgrAuto(){for(const m of S.managers){if(m.auto==='off'||!m.as)continue;
  const free=()=>mgrTargets(m).filter(a=>!a.busy);
  const mine=o=>o.target&&mgrTargets(m).some(a=>a.id===o.target)?1:0;
  for(const of of S.offers.slice().sort((x,y)=>(mine(y)-mine(x))||y.pay-x.pay)){if(!free().length)break;if(m.auto!=='all'&&of.weeks>2&&!mine(of))continue;
    const c=bestCast(of,free());if(c){addLog(`📋 Quản lý ${m.name} ${mine(of)?'ưu tiên dự án mời đích danh, ':''}nhận giúp ${c.map(i=>byId(i).name).join(', ')}: «${of.title}».`);acceptCast(of.id,c,true)}}}}
function cleanMgr(){for(const m of S.managers)if(m.as&&!'tsdlb'.includes(m.as.t)&&!mgrTargets(m).length&&!(m.as.t==='g'&&S.groups.find(g=>g.id===m.as.id)))m.as=null}
function hireMgr(id){const m=S.mgrPool.find(x=>x.id===id);if(!m)return;if(S.money<m.fee)return toast('Không đủ tiền');S.money-=m.fee;S.mgrPool=S.mgrPool.filter(x=>x!==m);S.managers.push(m);addLog(`🧑‍💼 Tuyển quản lý ${m.name}.`,'good');act()}
function assignMgr(id,v){const m=S.managers.find(x=>x.id===id);if(!m)return;S.props=null;if(!v)m.as=null;else{const t=v[0],tid=+v.slice(1);if(t!=='l'&&S.managers.some(x=>x!==m&&x.as&&x.as.t===t&&x.as.id===tid))return toast('Đã có quản lý phụ trách');m.as=t==='l'?{t,id:0,ids:(m.as&&m.as.t==='l'?m.as.ids:[])}:{t,id:tid};addLog(`📋 ${m.name} phụ trách ${targetName(m)}.`)}act()}
const mCapA=m=>MAX_SA;
function toggleMA(mid,aid,on){const m=S.managers.find(x=>x.id===mid);if(!m||!m.as||m.as.t!=='l')return;S.props=null;const L=m.as.ids;
  if(on){if(L.includes(aid))return;if(L.length>=mCapA(m)){toast(`${m.name} cấp ${m.lv} quản tối đa ${mCapA(m)} người`);return act()}
    const o=S.managers.find(x=>x!==m&&x.as&&x.as.t==='l'&&x.as.ids.includes(aid));if(o){toast(`Đã thuộc danh sách của ${o.name}`);return act()}L.push(aid)}
  else m.as.ids=L.filter(i=>i!==aid);act()}
function setAuto(id,v){const m=S.managers.find(x=>x.id===id);if(m){S.props=null;m.auto=v;act()}}
function fireMgr(id,btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent='Chạm lần nữa để xác nhận';return}const m=S.managers.find(x=>x.id===id);if(m){mKids(m).forEach(k=>k.boss=m.boss||null);S.managers=S.managers.filter(x=>x!==m);S.assts=(S.assts||[]).filter(x=>x.mid!==m.id);S.events=S.events.filter(e=>e.m!==m.id);addLog(`👋 Cho nghỉ việc quản lý ${m.name}.`);act()}}
function rehuntMgr(){if(S.money<15e6)return toast('Không đủ tiền');S.money-=15e6;genMgrPool();act()}
function newGame(){
  S={v:1,year:1,week:1,money:600e6,nid:1,planOn:true,managers:[],mgrPool:[],artists:[],groups:[],offers:[],films:[],events:[],log:[],partners:{},singles:[],concerts:[],awards:[],pool:[]};
  S.assts=[];S.songs=[];S.fin=[];
  genPool(4);genMgrPool();
  for(let i=0;i<2;i++){const a=genArtist();S.artists.push(a)}
  S.artists[1].days=defaultDays('dance');
  initBatches();S.comps=[];S.compRuns=[];genComp();genComp();
  genOffers(3);genOffers(2,1);initWorld();
  addLog('🎉 Chào mừng giám đốc! Starlight Ent. bắt đầu với vốn 600 triệu và 2 thực tập sinh.','gold');
  addLog('Mẹo: chạm vào từng phòng để dùng chức năng, chạm vào nhân vật để xem chi tiết.');
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));$('#saved').textContent='💾 Đã lưu tự động'+(S.saveCode&&DB?' · ☁️ '+fmtCode(S.saveCode):'')}catch(e){$('#saved').textContent='⚠️ Không lưu được'}}
/* ---- lưu bằng mã 16 ký tự ---- */
let DB=null,dbState='loading',cloudBusy=false,cloudMsg='',loadPreview=null;
const CODE_AB='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode(){const r=new Uint32Array(16);crypto.getRandomValues(r);return Array.from(r,x=>CODE_AB[x%32]).join('')}
const fmtCode=c=>c.match(/.{1,4}/g).join('-');
const normCode=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
async function cloudPut(code){
  const body={data:JSON.stringify(S),y:S.year,w:S.week,money:S.money,n:S.artists.length,t:Date.now()};
  await DB.collection('saves').doc(code).set(body);
}
async function cloudSave(fresh){
  if(!DB)return toast('Chỉ lưu bằng mã được khi mở game trên Claude');
  if(cloudBusy)return;cloudBusy=true;
  const code=(!S.saveCode||fresh)?newCode():S.saveCode;
  const old=S.saveCode;S.saveCode=code;
  try{await cloudPut(code);cloudMsg=`✅ Đã lưu lên mã ${fmtCode(code)} lúc ${new Date().toLocaleTimeString('vi-VN')}`;save()}
  catch(e){S.saveCode=old;cloudMsg=e&&e.code==='invalid_argument'?'⚠️ Bạn không có quyền ghi dữ liệu ở trang này (cần quyền Contributor trở lên).':e&&e.code==='quota_exceeded'?'⚠️ Kho lưu đã đầy.':'⚠️ Lưu thất bại, thử lại sau.'}
  cloudBusy=false;if(curView)curView();
}
let autoT=null;
function cloudAuto(){if(!DB||!S.saveCode)return;clearTimeout(autoT);autoT=setTimeout(()=>{if(cloudBusy)return;cloudBusy=true;cloudPut(S.saveCode).then(()=>{cloudMsg=`☁️ Tự động đồng bộ lên mã lúc ${new Date().toLocaleTimeString('vi-VN')}`}).catch(()=>{cloudMsg='⚠️ Đồng bộ tự động thất bại'}).finally(()=>{cloudBusy=false})},1500)}
async function cloudCheck(){
  const code=normCode($('#codeIn').value);
  if(code.length!==16)return toast('Mã cần đúng 16 ký tự');
  if(!DB)return toast('Chỉ tải bằng mã được khi mở game trên Claude');
  try{const s=await DB.collection('saves').doc(code).get();
    if(!s.exists){loadPreview=null;cloudMsg='❌ Không tìm thấy dữ liệu với mã này.'}
    else{const d=s.data();loadPreview={code,y:d.y,w:d.w,money:d.money,n:d.n,t:d.t,data:d.data};cloudMsg=''}}
  catch(e){cloudMsg='⚠️ Không đọc được dữ liệu, thử lại sau.'}
  if(curView)curView();
}
function cloudLoad(){
  if(!loadPreview)return;
  try{const d=JSON.parse(loadPreview.data);if(!d||!d.artists)throw 0;
    S=d;S.saveCode=loadPreview.code;
    localStorage.setItem(KEY,JSON.stringify(S));load();
    pos={};loadPreview=null;cloudMsg=`✅ Đã tải dữ liệu từ mã ${fmtCode(S.saveCode)}.`;
    addLog(`🔑 Đã tải game từ mã lưu ${fmtCode(S.saveCode)}.`,'gold');act();
  }catch(e){toast('Dữ liệu trong mã bị lỗi')}
}
function copyCode(){const c=fmtCode(S.saveCode);(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>toast('Đã sao chép mã'),()=>{const i=$('#codeShow');if(i){i.select();toast('Hãy sao chép mã đang được chọn')}})}
function viewCode(){
  const lp=loadPreview;
  modal(`<h2>🔑 Lưu bằng mã</h2><div class="sub">Lưu toàn bộ tiến trình thành một mã 16 ký tự. Nhập mã ở thiết bị hoặc trình duyệt khác để chơi tiếp.</div>
  ${dbState==='loading'?'<div class="card small muted">Đang kết nối kho lưu…</div>':!DB?'<div class="card small">⚠️ Tính năng mã lưu chỉ hoạt động khi mở game qua đường link trên Claude và đã đăng nhập. Game vẫn tự lưu trên trình duyệt này.</div>':''}
  <h3>Mã của bạn</h3>
  ${S.saveCode?`<div class="card"><input type="text" id="codeShow" readonly value="${fmtCode(S.saveCode)}" style="width:100%;font:800 22px 'JetBrains Mono',monospace;letter-spacing:2px;text-align:center"><div class="row" style="margin-top:8px"><button class="btn pri" onclick="cloudSave(false)" ${!DB||cloudBusy?'disabled':''}>Lưu tiến trình lên mã này</button><button class="btn" onclick="copyCode()">Sao chép</button><button class="btn sm" onclick="cloudSave(true)" ${!DB||cloudBusy?'disabled':''}>Tạo mã mới</button></div><div class="small muted" style="margin-top:6px">Sau mỗi tuần, game tự đồng bộ lên mã này. Giữ mã bí mật: ai có mã đều tải được game của bạn.</div></div>`
  :`<div class="card"><div class="small" style="margin-bottom:8px">Bạn chưa có mã lưu.</div><button class="btn pri" onclick="cloudSave(true)" ${!DB||cloudBusy?'disabled':''}>Tạo mã và lưu</button></div>`}
  ${cloudMsg?`<div class="card small">${cloudMsg}</div>`:''}
  <h3>Tải game bằng mã</h3>
  <div class="card"><div class="row"><input type="text" id="codeIn" placeholder="XXXX-XXXX-XXXX-XXXX" maxlength="19" style="flex:1;min-width:180px;letter-spacing:1px;text-transform:uppercase" value="${lp?fmtCode(lp.code):''}"><button class="btn" onclick="cloudCheck()" ${!DB?'disabled':''}>Kiểm tra</button></div>
  ${lp?`<div class="small" style="margin-top:8px">Tìm thấy: Năm ${lp.y} · Tuần ${lp.w} · ${fmt(lp.money)} · ${lp.n} nghệ sĩ · lưu lúc ${new Date(lp.t).toLocaleString('vi-VN')}</div><div class="small bad" style="margin:4px 0">Tải mã này sẽ thay thế tiến trình hiện tại trên trình duyệt.</div><button class="btn pink" onclick="cloudLoad()">Tải game này</button>`:''}</div>`);
}
function load(){try{const t=localStorage.getItem(KEY);if(!t)return false;const d=JSON.parse(t);if(!d||!d.artists)return false;S=d;
  for(const k of ['groups','offers','films','events','log','singles','concerts','awards','pool'])if(!Array.isArray(S[k]))S[k]=[];
  if(!S.partners)S.partners={};if(!Array.isArray(S.managers)){S.managers=[];genMgrPool();addLog('📋 Văn phòng Quản lý vừa mở ở tầng 6: tuyển quản lý để chia nhau phụ trách nhóm và nghệ sĩ.','gold')}if(!Array.isArray(S.mgrPool))genMgrPool();[...S.artists,...S.pool,...S.managers,...S.mgrPool].forEach(ensureLook);[...S.artists,...S.pool].forEach(ensureDays);S.artists.forEach(a=>{if(a.solo&&groupsOf(a).length&&!a.pm)givePM(a,true)});initWorld();S.managers.forEach(m=>{if(m.ps===true)m.ps=1;else if(m.ps!==1&&m.ps!==0)m.ps=2});if(S.planOn===undefined)S.planOn=true;if(!Array.isArray(S.batches)||!S.batches.length)initBatches();S.artists.forEach(fixBatch);if(!Array.isArray(S.comps)){S.comps=[];genComp();genComp()}if(!Array.isArray(S.compRuns))S.compRuns=[];migrateV2();return true}catch(e){console.error(e);return false}}

/* ================= RELATIONS ================= */
const getRel=(x,y)=>x.rel[y.id]||0;
function setRel(x,y,v){v=clamp(Math.round(v),-100,100);x.rel[y.id]=v;y.rel[x.id]=v}
function setTag(x,y,t){if(t){x.tag[y.id]=t;y.tag[x.id]=t}else{delete x.tag[y.id];delete y.tag[x.id]}}
const datingPartner=a=>{for(const id in a.tag)if(a.tag[id]==='dating'||a.tag[id]==='public')return byId(+id);return null};
const groupsOf=a=>S.groups.filter(g=>g.members.includes(a.id));
const sameGroup=(x,y)=>S.groups.some(g=>g.members.includes(x.id)&&g.members.includes(y.id));
function harmony(ids){let h=0;for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=byId(ids[i]);if(!a)continue;const t=a.tag[ids[j]];if(t==='friend')h+=3;else if(t==='dating'||t==='public')h+=1;else if(t==='enemy')h-=6}return h}

/* ================= OFFERS ================= */
function genOffers(n,tj){
  const types=Object.keys(OFFER).filter(k=>!!OFFER[k].tj===!!tj);
  for(let i=0;i<n;i++){
    const type=pick(types),O=OFFER[type],partner=pick(PARTNERS[type]);
    const L=tj?clamp(R(8,20)+(S.year-1)*4,6,45):clamp(R(12,30)+(S.year-1)*6+Math.floor(S.week/13)*2,10,85);
    let w,genre=null;
    if(O.film){genre=pick(Object.keys(GENRES));w=GENRES[genre].w}else w=O.req;
    const mx=Math.max(...Object.values(w)),req={};
    for(const k in w)if(w[k]/mx>=.5)req[k]=Math.round(L*w[k]/mx);
    const of={id:uid(),type,partner,genre,w,req,L,fame:Math.round(O.fame*(1+(S.year-1)*.3)*Math.random()),
      weeks:R(O.wk[0],O.wk[1]),pay:Math.round(R(O.pay[0],O.pay[1])*(1+(S.year-1)*.15))*1e6,
      costar:(O.film||type==='variety')?pick(COSTARS):null,exp:abs()+R(2,4),title:genTitle(type),target:null,invest:null,invested:false,slots:(O.sl&&O.sl[1]>1&&Math.random()<.45)?R(2,O.sl[1]):1};
    const rel=S.partners[partner]||0;
    const cands=S.artists.filter(a=>a.status==='debuted'||O.trainee);
    if(cands.length&&((rel>=35&&Math.random()<.55)||Math.random()<.1)){
      cands.sort((x,y)=>((y.pw[partner]||0)*20+fame(y)+(y.co[of.costar]||0)/5)-((x.pw[partner]||0)*20+fame(x)+(x.co[of.costar]||0)/5));
      of.target=cands[0].id;of.pay=Math.round(of.pay*1.3/1e6)*1e6;
    }
    if(type==='drama'||type==='movie')of.invest={budget:of.pay*R(8,14),share:pick([.05,.1,.15,.2])};
    S.offers.push(of);
  }
}
function disc(of,a){return clamp((S.partners[of.partner]||0)/100*.3+(of.target===a.id?.2:0)+(of.costar?(a.co[of.costar]||0)/100*.1:0)+msk(a,'nego')*.015,0,.65)}
const effReq=(of,a)=>{const d=disc(of,a),r={};for(const k in of.req)r[k]=Math.round(of.req[k]*(1-d));return r};
const effPay=(of,a)=>Math.round(modV('pay')*of.pay*(1+(S.partners[of.partner]||0)/200)*(1+fame(a)/250)*(1+msk(a,'nego')*.04)/1e6)*1e6;
function canTake(of,a){
  const O=OFFER[of.type];
  if(a.busy)return'Đang bận';
  if(dHold(a))return'Chừa lịch debut';
  if(a.status!=='debuted'&&!O.trainee)return'Chưa ra mắt';
  if(of.target&&of.target!==a.id&&slotsOf(of)<2)return'Mời người khác';
  if(a.scandal&&a.scandal.sev>=2)return'Đang dính scandal';
  {const h=cbHold(a);if(h&&abs()+of.weeks>h.w)return`Chừa lịch comeback ${wkLabel(h.w)}`}
  const d=disc(of,a);if(fame(a)<Math.round(of.fame*(1-d)))return'Chưa đủ danh tiếng';
  const r=effReq(of,a);for(const k in r)if(a.st[k]<r[k])return'Thiếu '+STATS[k];
  return'';
}
const slotsOf=of=>of.slots||1;
const offerOrder=list=>list.slice().reverse().sort((x,y)=>(byId(x.target)?0:1)-(byId(y.target)?0:1));
function cbHold(a){let best=null;for(const p of (S.cbPlan||[])){const x=actByKey(p.k);if(x&&x.m.includes(a.id)&&(!best||p.w<best.w))best=p}return best}
function chem(ids){let c=0;const ms=ids.map(byId).filter(Boolean);for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++){const t=ms[i].tag[ms[j].id];c+=t==='friend'?.08:t==='enemy'?-.12:(t==='dating'||t==='public')?.04:0;if(sameGroup(ms[i],ms[j]))c+=.05}return clamp(+c.toFixed(2),-.3,.3)}
const chemTxt=c=>c>0?`ăn ý +${Math.round(c*100)}%`:c<0?`<span class="bad">lục đục ${Math.round(c*100)}%</span>`:'';
function bestCast(of,pool){
  const el=pool.filter(a=>!canTake(of,a));if(!el.length)return null;
  let first;if(of.target){first=el.find(a=>a.id===of.target);if(!first)return null}
  el.sort((x,y)=>fit(y,of.w)-fit(x,of.w));const pk=[first||el[0]];
  while(pk.length<slotsOf(of)){let bc=null,bs=-1e9;for(const c of el){if(pk.includes(c))continue;const sc=fit(c,of.w)+pk.reduce((t,p)=>t+tagScore(p,c)+(sameGroup(p,c)?2:0),0)*2;if(sc>bs){bs=sc;bc=c}}if(!bc)break;pk.push(bc)}
  return pk.map(a=>a.id);
}
function acceptOffer(ofId,aId,silent){return acceptCast(ofId,[aId],silent)}
function acceptCast(ofId,ids,silent){
  const of=S.offers.find(o=>o.id===ofId);if(!of)return;
  ids=[...new Set(ids)].filter(i=>byId(i));
  if(!ids.length)return toast('Chọn ít nhất 1 nghệ sĩ');
  if(ids.length>slotsOf(of))return toast(`Dự án chỉ nhận tối đa ${slotsOf(of)} người`);
  if(of.target&&!ids.includes(of.target))return toast('Phải có người được mời đích danh');
  for(const i of ids){const why=canTake(of,byId(i));if(why)return toast(byId(i).name+': '+why)}
  const O=OFFER[of.type],c=ids.length>1?chem(ids):0,ms=ids.map(byId);
  for(const a of ms)a.busy={kind:'offer',type:of.type,title:of.title,partner:of.partner,costar:of.costar,left:of.weeks,total:of.weeks,pay:effPay(of,a),genre:of.genre,w:of.w,L:of.L,offerId:of.id,mates:ids,chem:c};
  S.offers=S.offers.filter(o=>o!==of);
  const f=S.films.find(x=>x.offerId===of.id);if(f)ids.forEach(i=>f.cast.push(i));
  addLog(`${O.ic} ${ms.map(a=>a.name).join(', ')} nhận ${O.n} «${of.title}» (${of.partner}), ${of.weeks} tuần${ids.length>1?` · ${ids.length} người${c?(c>0?', ăn ý +':', lục đục ')+Math.round(Math.abs(c)*100)+'%':''}`:''}.`);
  if(!silent)act();
}
function acceptSel(ofId){const ids=[...document.querySelectorAll('.oc'+ofId+':checked')].map(x=>+x.value);acceptCast(ofId,ids)}
function ocPrev(ofId,el){const of=S.offers.find(o=>o.id===ofId);if(!of)return;const bx=[...document.querySelectorAll('.oc'+ofId+':checked')];
  if(el&&bx.length>slotsOf(of)){el.checked=false;toast(`Tối đa ${slotsOf(of)} người`);return ocPrev(ofId)}
  const ids=bx.map(x=>+x.value),pay=ids.reduce((t,i)=>t+effPay(of,byId(i)),0),c=ids.length>1?chem(ids):0,o=$('#ocp'+ofId);
  if(o)o.innerHTML=ids.length?`${ids.length}/${slotsOf(of)} người · tổng ${fmt(pay)}${c?' · '+chemTxt(c):''}`:`Chọn tối đa ${slotsOf(of)} người`}
function ocPick(ofId){const of=S.offers.find(o=>o.id===ofId);if(!of)return;const c=bestCast(of,S.artists.filter(a=>!a.busy))||[];document.querySelectorAll('.oc'+ofId).forEach(x=>x.checked=c.includes(+x.value));ocPrev(ofId)}
function investOffer(ofId){
  const of=S.offers.find(o=>o.id===ofId);if(!of||!of.invest||of.invested)return;
  const cost=Math.round(of.invest.budget*of.invest.share);
  if(S.money<cost)return toast('Không đủ tiền góp vốn');
  S.money-=cost;of.invested=true;
  S.films.push({id:uid(),title:of.title,genre:of.genre,own:false,budget:of.invest.budget,share:of.invest.share,cost,cast:[],offerId:of.id,status:'Sắp chiếu',releaseAt:abs()+of.weeks+R(1,3),done:false,y:S.year});
  addLog(`💰 Góp vốn ${fmt(cost)} (${of.invest.share*100}%) vào phim «${of.title}».`);act();
}

/* ================= WEEK ================= */
const TTS_BOOST=3,TTS_DECAY=.25;
function ttsDecay(a){const tr=new Set();a.days.forEach(k=>{if(TRAIN[k])Object.keys(TRAIN[k].g).forEach(x=>tr.add(x))});
  const rest=a.days.filter(k=>k==='rest').length,p=TTS_DECAY+(rest>=5?.25:0)+(a.mood<30?.15:0)-msk(a,'plan')*.015;let tot=0;
  for(const x in a.st){if(tr.has(x))continue;if(Math.random()<p){const d=+rnd(.3,1).toFixed(1);a.st[x]=clamp(+(a.st[x]-d).toFixed(1),0,100);tot+=d}}
  return +tot.toFixed(1)}
function trainDay(a,k){
  const t=TRAIN[k]||TRAIN.rest,ef=(a.status==='trainee'?TTS_BOOST:1)*(a.energy<25?.4:1)*(1+msk(a,'plan')*.04)*modV('train')*(1+bizLv('academy')*.06);let gs=0;
  for(const s in t.g){const g=t.g[s]*.22*a.talent*ef*(1-a.st[s]/125)*rnd(.8,1.2)*mtB(a,s);a.st[s]=clamp(+(a.st[s]+g).toFixed(2),0,100);gs+=g}
  if(k==='rest'){a.energy=clamp(a.energy+12,0,100);a.mood=clamp(a.mood+1.2,0,100)}
  else{a.energy=clamp(a.energy+t.e*.3*(1-msk(a,'care')*.04),0,100);a.mood=clamp(a.mood-.3,0,100);S.money-=TRAIN_COST/5;book('trn',-TRAIN_COST/5)}
  if(a.energy<20)a.mood=clamp(a.mood-1.2,0,100);
  return +gs.toFixed(2);
}
function qLabel(q){return q>=1.25?'Xuất sắc':q>=1?'Tốt':q>=.8?'Ổn':'Chưa tốt'}
function applyLesson(a,lesson,q){const out=[];for(const k in lesson){const g=lesson[k]*(.8+q*.3);a.st[k]=clamp(+(a.st[k]+g).toFixed(1),0,100);out.push(`${STATS[k]} +${g.toFixed(1)}`)}return out.join(', ')}
function completeBusy(a){
  const b=a.busy;a.busy=null;
  if(b.kind==='offer'){
    const O=OFFER[b.type],f=fit(a,b.w),q=clamp(f/Math.max(b.L,10),.5,1.6)*rnd(.85,1.15)*(1+(b.chem||0));
    const mates=(b.mates||[]).filter(i=>i!==a.id).map(byId).filter(Boolean);for(const m of mates)setRel(a,m,getRel(a,m)+R(2,5));
    const fg=Math.round(R(O.fans[0],O.fans[1])*.4*q*(1+fame(a)/150));
    a.fans+=fg;a.yr.fans+=fg;S.money+=b.pay;book('job',b.pay,[a]);
    const ls=applyLesson(a,O.lesson,q),lt=pick(O.lt);
    a.lessons.unshift({t:`${O.n} «${b.title}»`+(mates.length?' cùng '+mates.map(x=>x.name).join(', '):''),l:lt,s:ls,y:S.year});if(a.lessons.length>12)a.lessons.length=12;
    S.partners[b.partner]=clamp(Math.round((S.partners[b.partner]||0)+R(6,12)*q),0,100);
    a.pw[b.partner]=(a.pw[b.partner]||0)+1;
    if(b.costar)a.co[b.costar]=clamp((a.co[b.costar]||0)+R(10,20),0,100);
    if(O.film){a.yr.actQ=Math.max(a.yr.actQ,Math.round(f*q));a.actor=a.actor||a.status==='debuted';if(a.wantAct){a.wantAct=0;a.mood=clamp(a.mood+10,0,100)}}
    if(b.type==='variety')a.yr.variety++;
    a.wc=(a.wc||0)+1;
    {const m=mgrOf(a);if(m)mgrExp(m)}
    a.mood=clamp(a.mood+6,0,100);a.energy=clamp(a.energy-10,0,100);
    a.hist.unshift(`N${S.year}: ${O.n} «${b.title}» – ${qLabel(q)}`);
    addLog(`✅ ${a.name} hoàn thành «${b.title}» (${qLabel(q)}): +${fmt(b.pay)}, +${fmtN(fg)} fan. Bài học: ${lt} (${ls}).`,'good');
  }else if(b.kind==='shoot'){
    const film=S.films.find(x=>x.id===b.filmId);
    const q=rnd(.9,1.25),ls=applyLesson(a,{acting:5,stamina:1},q);
    a.lessons.unshift({t:`Phim «${b.title}»`,l:'Hiểu cả công việc phía sau máy quay',s:ls,y:S.year});
    if(film){a.yr.actQ=Math.max(a.yr.actQ,Math.round(fit(a,GENRES[film.genre].w)*q));
      if(!S.artists.some(x=>x.busy&&x.busy.filmId===film.id)){film.status='Hậu kỳ';film.releaseAt=abs()+2}}
    a.actor=true;a.wc=(a.wc||0)+1;a.hist.unshift(`N${S.year}: Đóng phim công ty «${b.title}»`);
    addLog(`🎬 ${a.name} đóng máy phim «${b.title}». ${ls}.`,'good');
  }else if(b.kind==='promo'){addLog(`🎤 ${a.name} kết thúc đợt quảng bá.`)}
  else if(b.kind==='concert'){addLog(`🏟️ ${a.name} trở về sau concert.`)}
  else if(b.kind==='leave'){a.mood=clamp(a.mood+10,0,100);addLog(`🌴 ${a.name} quay lại sau kỳ nghỉ.`)}
  else if(b.kind==='comp')compDone(a,b);
}
function releaseFilm(f){
  const cast=f.cast.map(byId).filter(Boolean);
  const w=GENRES[f.genre].w;
  const ft=cast.length?cast.reduce((s,a)=>s+fit(a,w),0)/cast.length:R(35,75);
  const fm=cast.length?cast.reduce((s,a)=>s+fame(a),0)/cast.length:R(10,50);
  const mult=Math.max(.1,.2+ft/100*1.3+fm/100*.6+rnd(-.4,.5)+(f.own?0:.05));
  const rev=Math.round(f.budget*mult),inc=Math.round(rev*f.share);
  S.money+=inc;book('film',inc,cast);f.done=true;f.mult=+mult.toFixed(2);f.rev=rev;f.inc=inc;f.status='Đã chiếu';f.y=S.year;
  for(const a of cast){const g=Math.round(rev/1e6*R(15,30));a.fans+=g;a.yr.fans+=g}
  addLog(`🎞️ Phim «${f.title}» ra rạp: doanh thu ${fmt(rev)} (x${f.mult}), công ty nhận ${fmt(inc)}${f.own?'':' từ phần góp vốn'}.`,mult>=1?'gold':'bad');
}
const DAYS=['T2','T3','T4','T5','T6','T7','CN'];
const DAYN=['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'];
const defaultDays=k=>k==='rest'?Array(7).fill('rest'):[k,k,k,k,k,'rest','rest'];
function ensureDays(a){if(!Array.isArray(a.days)||a.days.length!==7)a.days=defaultDays(a.sched||'vocal');a.days=a.days.map(k=>TRAIN[k]?k:'rest')}
const daysMini=a=>a.days.map(k=>TIC[k]).join('');
const trainDays=a=>a.days.filter(k=>k!=='rest').length;
function weekCost(){return S.artists.reduce((s,a)=>s+a.salary+(a.busy?0:trainDays(a)*TRAIN_COST/5),0)+S.managers.reduce((s,m)=>s+m.salary,0)+(S.assts||[]).reduce((s,x)=>s+x.sal,0)}
const TIC={vocal:'🎤',dance:'🪩',rap:'🎧',acting:'🎭',variety:'😂',gym:'🏋️',rest:'🛌'};
const STAT2T={vocal:'vocal',dance:'dance',rap:'rap',acting:'acting',variety:'variety',visual:'gym',stamina:'gym'};
function focusKeys(a){const idol=groupsOf(a).length||a.solo;if(a.status==='trainee')return['vocal','dance','rap','visual'];if(a.actor&&!idol)return['acting','visual','variety','stamina'];if(a.actor)return['vocal','dance','acting','visual','variety'];return['vocal','dance','rap','visual','variety','stamina']}
function planWeek(a,skill=10){
  let e=a.energy,mo=a.mood;const st={...a.st},out=[],ks0=focusKeys(a);
  for(let d=0;d<7;d++){let k;
    if(e<40||mo<28)k='rest';
    else if(a.wantAct&&d%2===0)k='acting';
    else{let ks=ks0;if(skill<4&&Math.random()<.35)ks=[pick(ks)];k=STAT2T[ks.reduce((m,x)=>st[x]<st[m]?x:m)];for(const g in TRAIN[k].g)st[g]+=TRAIN[k].g[g]*1.2}
    if(k==='rest'){e=Math.min(100,e+12);mo=Math.min(100,mo+1.2)}else{e=Math.max(0,e+TRAIN[k].e*.3);mo-=.3}
    out.push(k)}
  if(!out.includes('rest'))out[6]='rest';
  return out;
}
function planWhy(a){if(a.energy<40)return'năng lượng đang thấp nên cần nghỉ trước';if(a.mood<28)return'tâm trạng đang xấu';if(a.wantAct)return'đang muốn đóng phim';const k=focusKeys(a).reduce((m,x)=>a.st[x]<a.st[m]?x:m);return`ưu tiên ${STATS[k]} đang yếu nhất (${Math.round(a.st[k])}), nghỉ để giữ năng lượng`}
function projEnergy(a){let e=a.energy;return a.days.map(k=>{e=clamp(e+(k==='rest'?12:TRAIN[k].e*.3),0,100);return Math.round(e)})}
const mgrSchedules=a=>{if(a.pm)return a.pm;const m=mgrOf(a);return m&&m.ps===1?m:null};
function mgrScheduleAll(){for(const a of S.artists){if(a.busy)continue;const m=mgrSchedules(a);if(m)a.days=planWeek(a,effSk(m,'plan'))}}
function setPs(id,v){const m=S.managers.find(x=>x.id===id);if(m){S.props=null;m.ps=+v;if(m.ps===1)mgrScheduleAll();act()}}
/* ---- đề xuất của quản lý ---- */
function shortWhy(a){if(a.energy<40)return'năng lượng thấp, nghỉ trước';if(a.mood<28)return'tâm trạng xấu, cho nghỉ';if(a.wantAct)return'muốn đóng phim, tập diễn';const k=focusKeys(a).reduce((m,x)=>a.st[x]<a.st[m]?x:m);return'bù '+STATS[k]+' ('+Math.round(a.st[k])+')'}
function buildProps(){
  if(S.props&&S.props.w===abs()&&S.props.c)return S.props;
  const P={w:abs(),m:{},c:[],st:{auto:0,boss:{},res:0}};
  for(const m of S.managers){if(!m.as)continue;const free=mgrTargets(m).filter(a=>!a.busy);if(!free.length)continue;
    const it={s:[],p:[],d:[]};
    if(m.ps===2)for(const a of free)if(a.appr!==abs()&&!a.pm)it.s.push({a:a.id,days:planWeek(a,effSk(m,'plan')),why:shortWhy(a),ok:0});
    if(m.auto==='off'){const used=new Set();
      const tg=o=>o.target&&free.some(a=>a.id===o.target)?1:0;for(const of of S.offers.slice().sort((x,y)=>(tg(y)-tg(x))||(y.pay*rnd(.6,1.4)-x.pay*rnd(.6,1.4)))){if(it.p.length>=2)break;
        const c=bestCast(of,free.filter(a=>!used.has(a.id)&&a.energy>=35));if(!c)continue;
        c.forEach(i=>used.add(i));it.p.push({of:of.id,ids:c,ok:0})}}
    for(const a of free)if(a.status==='trainee'){const r=debutRec(a);if(r.t!=='wait')it.d.push({a:a.id,t:r.t,txt:r.short})}
    if(it.s.length||it.p.length||it.d.length)P.m[m.id]=it}
  S.props=P;routeProps(P);return P;
}
/* ---- luồng duyệt: quản lý → cấp trên → … → Giám đốc ---- */
const CFT={overlap:'Trùng người',offer:'Tranh cùng lời mời',tired:'Quá sức',enemy:'Bạn diễn mâu thuẫn',scandal:'Đang dính scandal'};
const mById=id=>S.managers.find(m=>m.id===id);
const chainUp=m=>{const r=[];let b=mBoss(m);while(b&&!r.includes(b)){r.push(b);b=mBoss(b)}return r};
const canSolve=(r,c)=>effSk(r,'plan')+r.lv>=c.sev*3;
function itemsOf(P){const L=[];for(const k in P.m){const mid=+k,it=P.m[k];it.s.forEach((x,i)=>L.push({mid,kind:'s',i,x,arts:[x.a]}));it.p.forEach((x,i)=>L.push({mid,kind:'p',i,x,arts:x.ids}))}return L}
const refIt=(P,r)=>{const x=P.m[r.mid]&&P.m[r.mid][r.k][r.i];return x?{mid:r.mid,kind:r.k,i:r.i,x,arts:r.k==='s'?[x.a]:x.ids}:null};
function itDesc(t){const m=mById(t.mid),who=m?m.name:'?';if(t.kind==='s'){const a=byId(t.x.a);return`${who}: lịch tập ${a?a.name:''} ${t.x.days.map(k=>TIC[k]).join('')}`}
  const of=S.offers.find(o=>o.id===t.x.of);return`${who}: «${of?of.title:'?'}» cho ${t.x.ids.map(byId).filter(Boolean).map(a=>a.name).join(', ')}${of?' (+'+fmt(t.x.ids.reduce((s,i)=>s+(byId(i)?effPay(of,byId(i)):0),0))+')':''}`}
function itScore(t){if(t.kind==='p'){const of=S.offers.find(o=>o.id===t.x.of);return 1e13+(of?t.x.ids.reduce((s,i)=>s+(byId(i)?effPay(of,byId(i)):0),0):0)}const a=byId(t.x.a),m=a&&mgrOf(a);return m&&m.id===t.mid?2:1}
function dropIt(t,c){t.x.ok=-2;t.x.why2=CFT[c.type];if(t.kind==='p'){const it=S.props&&S.props.m[t.mid];if(it)it.s.forEach(x=>{if(x.ok===-2&&x.why2==='đã có dự án'&&t.x.ids.includes(x.a)){x.ok=0;delete x.why2}})}}
function fixConf(P,c,keep){
  const its=c.refs.map(r=>refIt(P,r)).filter(t=>t&&t.x.ok!==-2&&t.x.ok!==1);
  if(c.type==='overlap'||c.type==='offer'){const k=keep!=null?refIt(P,c.refs[keep]):its.slice().sort((a,b)=>itScore(b)-itScore(a))[0];for(const t of its)if(!k||t.x!==k.x)dropIt(t,c)}
  else if(c.type==='tired'){for(const t of its){if(t.kind==='p')dropIt(t,c);else{const a=byId(t.x.a);if(a){t.x.days=planWeek(a,10);t.x.why='đã giảm tải'}}}}
  else if(c.type==='enemy'){const t=its[0];if(t){const of=S.offers.find(o=>o.id===t.x.of),ms=t.x.ids.map(byId).filter(Boolean);
    for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++)if(ms[i].tag[ms[j].id]==='enemy'){const out=[ms[i],ms[j]].filter(a=>a.id!==(of&&of.target)).sort((x,y)=>(of?fit(x,of.w)-fit(y,of.w):0))[0];if(out)t.x.ids=t.x.ids.filter(id=>id!==out.id)}
    if(!t.x.ids.length)dropIt(t,c)}}
  else if(c.type==='scandal')its.forEach(t=>dropIt(t,c));
  c.pend=0;c.done=1;
}
function approveIt(P,t,by){if(t.x.ok)return;const pend=(t.x.cf||[]).some(id=>{const c=P.c.find(z=>z.id===id);return c&&c.pend});if(pend)return;
  propOk(t.mid,t.kind,t.i,1);if(t.x.ok===1)t.x.by=by}
function routeProps(P){
  const L=itemsOf(P);
  for(const t of L)if(t.kind==='s'&&L.some(u=>u.kind==='p'&&u.mid===t.mid&&u.arts.includes(t.x.a)))t.x.ok=-2,t.x.why2='đã có dự án';
  const live=L.filter(t=>!t.x.ok);let cid=1;
  const add=(type,sev,ts,txt)=>{const c={id:cid++,type,sev,txt,refs:ts.map(t=>({mid:t.mid,k:t.kind,i:t.i})),path:[]};P.c.push(c);ts.forEach(t=>(t.x.cf=t.x.cf||[]).push(c.id));c._t=ts};
  const byA={};live.forEach(t=>t.arts.forEach(a=>(byA[a]=byA[a]||[]).push(t)));
  for(const a in byA){const ts=byA[a];if(new Set(ts.map(t=>t.mid)).size>1)add('overlap',2,ts,`${byId(+a).name} được ${new Set(ts.map(t=>t.mid)).size} quản lý xếp việc khác nhau`)}
  const byO={};live.filter(t=>t.kind==='p').forEach(t=>(byO[t.x.of]=byO[t.x.of]||[]).push(t));
  for(const o in byO)if(byO[o].length>1){const of=S.offers.find(x=>x.id===+o);add('offer',1,byO[o],`${byO[o].length} quản lý cùng muốn nhận «${of?of.title:'?'}»`)}
  for(const t of live){
    if(t.kind==='p'){const ms=t.arts.map(byId).filter(Boolean),of=S.offers.find(o=>o.id===t.x.of);
      const sc=ms.filter(a=>a.scandal);if(sc.length)add('scandal',3,[t],`${sc[0].name} đang dính scandal mà vẫn được xếp «${of?of.title:''}»`);
      const ti=ms.filter(a=>a.energy<45);if(ti.length)add('tired',1,[t],`${ti.map(a=>a.name).join(', ')} năng lượng thấp (⚡${Math.round(ti[0].energy)}) mà vẫn nhận «${of?of.title:''}»`);
      if(ms.length>1&&chem(t.arts)<0)add('enemy',1,[t],`Đội hình «${of?of.title:''}» có hai người đang mâu thuẫn`)}
    else{const a=byId(t.x.a);let e=a.energy,lo=0;for(const k of t.x.days){e=clamp(e+(k==='rest'?12:TRAIN[k].e*.3),0,100);if(e<20)lo=1}
      if(lo)add('tired',1,[t],`Lịch của ${a.name} quá dày, năng lượng sẽ xuống dưới 20`)}
  }
  for(const c of P.c){
    const ms=[...new Set(c._t.map(t=>t.mid))].map(mById).filter(Boolean),ch=ms.map(chainUp);
    const cand=(ch[0]||[]).filter(r=>ch.every(x=>x.includes(r)));let res=null;
    for(const r of cand){c.path.push(r.name);if(canSolve(r,c)){res=r;break}}
    if(res){fixConf(P,c);c.by=res.name;mgrExp(res,.2);P.st.res++}else{c.pend=1;c.path.push('Giám đốc')}
    delete c._t;
  }
  passAll(P);
  const nb=Object.values(P.st.boss).reduce((a,b)=>a+b,0),pend=P.c.filter(c=>c.pend).length,parts=[];
  if(nb)parts.push(`cấp trên duyệt ${nb} mục (${Object.keys(P.st.boss).join(', ')})`);if(P.st.auto)parts.push(`${P.st.auto} mục tự duyệt`);
  if(P.st.res)parts.push(`${P.st.res} xung đột được quản lý cấp cao xử lý`);if(pend)parts.push(`⚠️ ${pend} xung đột chuyển lên Giám đốc`);
  if(parts.length)addLog(`📨 Đề xuất tuần: ${parts.join(' · ')}.`,pend?'bad':'');
}
function passAll(P,force){
  for(const t of itemsOf(P)){if(t.x.ok)continue;
    const m=mById(t.mid),b=m&&mBoss(m),solved=(t.x.cf||[]).map(id=>P.c.find(c=>c.id===id)).filter(c=>c&&c.by).pop();
    const by=solved?solved.by:b?b.name:(S.autoAppr!==false?'tự duyệt':force||null);if(!by)continue;
    approveIt(P,t,by);if(t.x.ok===1){if(by==='tự duyệt')P.st.auto++;else if(by!=='Giám đốc')P.st.boss[by]=(P.st.boss[by]||0)+1}}
}
function cfPick(cid,keep){const P=S.props;if(!P)return;const c=P.c.find(x=>x.id===cid);if(!c||!c.pend)return;
  if(keep==='as'){c.pend=0;c.done=1}else fixConf(P,c,keep==null?null:keep);c.by='Giám đốc';
  for(const r of c.refs){const t=refIt(P,r);if(t)approveIt(P,t,'Giám đốc')}
  passAll(P);
  addLog(`⚖️ Giám đốc xử lý xung đột: ${c.txt}.`);act()}
const propCount=()=>{const P=buildProps();let n=P.c.filter(c=>c.pend).length;for(const k in P.m){const it=P.m[k];n+=it.s.filter(x=>!x.ok&&!(x.cf||[]).length&&byId(x.a)&&!byId(x.a).busy).length+it.p.filter(x=>!x.ok&&!(x.cf||[]).length&&S.offers.some(o=>o.id===x.of)).length}return n};
function propOk(mid,kind,i,quiet){const it=S.props&&S.props.m[mid];if(!it)return;const x=it[kind][i];if(!x||x.ok)return;
  if((x.cf||[]).some(id=>{const c=S.props.c.find(z=>z.id===id);return c&&c.pend})){if(!quiet)toast('Cần xử lý xung đột trước');return}
  if(kind==='s'){const a=byId(x.a);if(!a||a.busy)return;a.days=x.days.slice();a.appr=abs();x.ok=1;if(!x.by)x.by='Giám đốc'}
  else if(kind==='p'){const of=S.offers.find(o=>o.id===x.of);if(!of){x.ok=-1;if(!quiet)toast('Lời mời đã hết hạn');return}
    if(x.ids.some(id=>{const a=byId(id);return !a||canTake(of,a)})){x.ok=-1;if(!quiet)toast('Đội hình không còn phù hợp');return}
    acceptCast(of.id,x.ids,true);x.ok=1;if(!x.by)x.by='Giám đốc';const mg=S.managers.find(m=>m.id===mid);if(mg)mgrExp(mg,.3)}
  if(!quiet)act()}
function propOkAll(mid){const it=S.props&&S.props.m[mid];if(!it)return;it.p.forEach((x,i)=>propOk(mid,'p',i,1));it.s.forEach((x,i)=>propOk(mid,'s',i,1));act()}
function propAll(){const P=buildProps();for(const k in P.m)propOkAll(+k)}
let propNext=null;
const stTag=x=>x.ok===1?`<span class="tag m">✓ ${esc(x.by||'đã duyệt')}</span>`:x.ok===-2?`<span class="tag">✖ bỏ · ${esc(x.why2||'')}</span>`:x.ok===-1?'<span class="tag">hết hạn</span>':(x.cf||[]).some(id=>S.props.c.find(c=>c.id===id&&c.pend))?'<span class="tag r">⚠️ xung đột</span>':'';
function viewProps(){
  const P=buildProps(),ms=S.managers.filter(m=>P.m[m.id]);
  const pc=P.c.filter(c=>c.pend),dc=P.c.filter(c=>c.done&&c.by&&c.by!=='Giám đốc');
  const cfHTML=pc.map(c=>{const its=c.refs.map(r=>refIt(P,r)).filter(Boolean);const two=c.type==='overlap'||c.type==='offer';
    return`<div class="card" style="border-color:var(--red)"><b>⚠️ ${CFT[c.type]}</b><div class="small">${esc(c.txt)}</div><div class="small muted">Đã chuyển qua: ${c.path.map(esc).join(' → ')}${c.path.length>1?' (cấp trên chưa đủ kỹ năng Kế hoạch để tự xử lý)':' (không có quản lý chung cấp trên)'}</div>
    ${two?its.map((t,i)=>`<div class="prow"><span class="small">${esc(itDesc(t))}</span><span class="sp"></span><button class="btn sm" onclick="cfPick(${c.id},${c.refs.findIndex(r=>r.mid===t.mid&&r.k===t.kind&&r.i===t.i)})">Giữ cái này</button></div>`).join(''):`<div class="small" style="margin:4px 0">${its.map(t=>esc(itDesc(t))).join('<br>')}</div>`}
    <div class="row" style="margin-top:6px"><button class="btn sm pri" onclick="cfPick(${c.id})">Theo gợi ý${c.type==='tired'?' (giảm tải)':c.type==='enemy'?' (đổi người)':c.type==='scandal'?' (hoãn dự án)':' (giữ phương án lợi nhất)'}</button>${two?'':`<button class="btn sm" onclick="cfPick(${c.id},'as')">Vẫn duyệt</button>`}</div></div>`}).join('');
  const body=ms.map(m=>{const it=P.m[m.id];
    const sl=it.s.map((x,i)=>{const a=byId(x.a);if(!a)return'';return`<div class="prow" style="${x.ok===-2?'opacity:.55':''}">🗓️ <b>${esc(a.name)}</b> <span class="dmini">${x.days.map(k=>TIC[k]).join('')}</span><span class="small muted">${esc(x.why)}</span><span class="sp"></span>${stTag(x)}${!x.ok&&!(x.cf||[]).length?`<button class="btn sm" onclick="propOk(${m.id},'s',${i})">Duyệt</button>`:''}</div>`}).join('');
    const pl=it.p.map((x,i)=>{const of=S.offers.find(o=>o.id===x.of);if(!of&&x.ok!==1&&x.ok!==-2)return'';const nm=x.ids.map(byId).filter(Boolean),O=OFFER[(of||{}).type]||{ic:'🎬'};
      const pay=of?nm.reduce((t,a)=>t+effPay(of,a),0):0;
      return`<div class="prow" style="${x.ok===-2?'opacity:.55':''}">${O.ic} <b>«${esc(of?of.title:'dự án')}»</b><span class="small muted">${esc(nm.map(a=>a.name).join(', '))}${of?` · ${of.weeks}t · +${fmt(pay)}`:''}</span><span class="sp"></span>${stTag(x)}${!x.ok&&!(x.cf||[]).length?`<button class="btn sm pri" onclick="propOk(${m.id},'p',${i})">Nhận</button>`:''}</div>`}).join('');
    const dl=it.d.map(x=>{const a=byId(x.a);if(!a||a.status!=='trainee')return'';return`<div class="prow">🎯 <b>${esc(a.name)}</b><span class="small">${esc(x.txt)}</span><span class="sp"></span><button class="btn sm" onclick="openRoom('lobby')">Xem</button></div>`}).join('');
    if(!sl&&!pl&&!dl)return'';
    const pend=it.s.filter(x=>!x.ok).length+it.p.filter(x=>!x.ok).length,b=mBoss(m);
    return det('pr-'+m.id,`📋 ${esc(m.name)} <span class="small muted" style="font-weight:500">· báo cáo ${b?esc(b.name):'Giám đốc'} · ${pend?pend+' chưa duyệt':'xong'}</span>`,`${pend&&!b?`<div class="row"><span class="sp"></span><button class="btn sm" onclick="propOkAll(${m.id})">Duyệt hết</button></div>`:''}${pl}${sl}${dl}`,pend>0)}).join('');
  const nb=Object.entries(P.st.boss);
  const go=propNext;
  modal(`<h2>📋 Đề xuất của quản lý</h2><div class="sub">Tuần ${S.week}. Quản lý báo cáo lên cấp trên: không xung đột thì được duyệt ngay, có xung đột thì chuyển lên người cao hơn, tới Giám đốc nếu không ai đủ thẩm quyền.</div>
  <div class="card small">📨 ${nb.length?nb.map(([n,v])=>`${esc(n)} duyệt ${v}`).join(' · '):'Chưa có cấp trên nào duyệt'}${P.st.auto?` · ${P.st.auto} tự duyệt`:''}${dc.length?` · ⚖️ ${dc.length} xung đột đã được xử lý`:''}${pc.length?` · <b class="bad">${pc.length} chờ bạn</b>`:''}</div>
  ${pc.length?`<h3>⚠️ Xung đột cần Giám đốc (${pc.length})</h3>${cfHTML}`:''}
  ${(()=>{const L=secPlans(),r=L.filter(p=>!p.wait&&!p.plan);return r.length?`<div class="card small row">🗒️ <span style="flex:1"><b>Thư ký:</b> ${r.map(p=>esc(p.n.slice(2).trim())+' ('+CONCEPTS[p.ck].n+')').join(', ')} sẵn sàng comeback.</span><button class="btn sm" onclick="view(viewSec)">Xem</button></div>`:''})()}
  ${dc.length?det('pr-solved',`⚖️ Xung đột cấp trên đã xử lý (${dc.length})`,dc.map(c=>`<div class="small">• <b>${esc(c.by)}</b>: ${esc(c.txt)} → ${c.type==='tired'?'giảm tải':c.type==='enemy'?'đổi người':c.type==='scandal'?'hoãn dự án':'giữ phương án lợi nhất'}</div>`).join(''),false):''}
  ${body||'<div class="card small muted">Không có đề xuất mới. Giao quản lý phụ trách nghệ sĩ và bật "Đề xuất" để nhận đề xuất mỗi tuần.</div>'}
  <label class="small row" style="margin-top:8px"><input type="checkbox" ${S.autoAppr!==false?'checked':''} onchange="S.autoAppr=this.checked;save()"> Tự duyệt đề xuất không xung đột của quản lý báo cáo trực tiếp cho bạn</label>
  <div class="row" style="margin-top:8px">${propCount()-pc.length>0?'<button class="btn" onclick="propAll()">✓ Duyệt phần còn lại</button>':''}<span class="sp"></span><button class="btn pri" onclick="${go?'propGo()':'closeM()'}">${go?'Tiếp tục ▶':'Đóng'}</button></div>`);
}
function propGo(){const f=propNext;propNext=null;f&&f()}
let plan=null;
function startPlan(force,skipProps){
  mgrScheduleAll();
  if(!skipProps&&propCount()){propNext=()=>startPlan(force,true);return view(viewProps)}
  const list=S.artists.filter(a=>!a.busy&&!mgrSchedules(a)&&a.appr!==abs()).map(a=>a.id);
  if(skipProps&&S.planOn===false){closeM();return nextWeek(force,true)}
  plan={list,i:0,day:0,force:!!force};
  view(viewPlan);
}
function startPlanOne(id){plan={list:[id],i:0,day:0,single:true};view(viewPlan)}
const curPA=()=>byId(plan.list[plan.i]);
function planSel(d){plan.day=d;viewPlan()}
function planSet(k){const a=curPA();if(!a)return;a.days[plan.day]=k;if(plan.day<6)plan.day++;save();render();viewPlan()}
function planRec(){const a=curPA();if(a){a.days=planWeek(a,10);save();render();viewPlan()}}
function planMgr(){const a=curPA(),m=a&&mgrOf(a),pr=m&&S.props&&S.props.m[m.id]&&S.props.m[m.id].s.find(x=>x.a===a.id);if(pr){a.days=pr.days.slice();pr.ok=1;save();render();viewPlan()}}
function planFill(){const a=curPA();if(a){const k=a.days[plan.day];a.days=k==='rest'?Array(7).fill('rest'):defaultDays(k);save();render();viewPlan()}}
function planNext(){plan.i++;plan.day=0;if(plan.single&&plan.i>=plan.list.length){plan=null;closeM();act();return}viewPlan()}
function planBack(){if(plan.i>0)plan.i--;plan.day=0;viewPlan()}
function planSkip(){plan.i=plan.list.length;viewPlan()}
function planGo(){const f=plan.force;plan=null;closeM();nextWeek(f,true)}
function meter(ic,v,col){return`<div class="meterrow"><span>${ic}</span><div class="mbar"><i style="width:${v}%;background:${col}"></i></div><b>${Math.round(v)}</b></div>`}
function viewPlan(){
  if(!plan)return closeM();
  const P=plan,n=P.list.length;
  if(P.i>=n){
    const busy=S.artists.filter(a=>a.busy),isMg=a=>mgrSchedules(a)||a.appr===abs(),mg=S.artists.filter(a=>!a.busy&&isMg(a)),me=S.artists.filter(a=>!a.busy&&!isMg(a));
    const cost=weekCost();
    const line=a=>`<div class="card row small"><div class="chibi mini" style="transform:scale(.8);margin:-6px 4px -6px 0">${chibiHTML(a)}</div><b>${esc(a.name)}</b><span class="sp"></span><span class="dmini">${daysMini(a)}</span></div>`;
    modal(`<h2>📅 Lịch tuần ${S.week}</h2><div class="sub">Kiểm tra lại rồi bắt đầu tuần. Chi phí dự kiến ${fmt(cost)}.</div>
    ${me.length?det('pl-me',`Bạn xếp (${me.length})`,me.map(line).join(''),true):''}
    ${mg.length?det('pl-mg',`📋 Quản lý xếp / đã duyệt (${mg.length})`,mg.map(a=>line(a).replace('<span class="sp"></span>',`<span class="small muted">📋 ${esc((mgrSchedules(a)||mgrOf(a)||{name:'—'}).name)}</span><span class="sp"></span>`)).join(''),false):''}
    ${busy.length?det('pl-out',`🚶 Bên ngoài (${busy.length})`,`<div class="small">${busy.map(a=>`${esc(a.name)}: ${esc(a.busy.title)} (${a.busy.left} tuần)`).join('<br>')}</div>`,false):''}
    <label class="row small" style="margin:14px 0"><input type="checkbox" ${S.planOn!==false?'checked':''} onchange="S.planOn=this.checked;save()"> Hiện hồ sơ từng nghệ sĩ để xếp lịch mỗi tuần</label>
    <div class="row">${n?'<button class="btn" onclick="planBack()">◀ Sửa lại</button>':''}<span class="sp"></span><button class="btn pink" onclick="planGo()">▶ Bắt đầu tuần ${S.week}</button></div>`);
    return;
  }
  const a=byId(P.list[P.i]);if(!a){P.list.splice(P.i,1);return viewPlan()}
  const recW=planWeek(a,10),d=plan.day,pe=projEnergy(a);
  const cells=DAYS.map((x,i)=>`<button class="dcell${i===d?' on':''}${pe[i]<30?' lo':''}" onclick="planSel(${i})" aria-label="${DAYN[i]}"><small>${x}</small><span>${TIC[a.days[i]]}</span><i>⚡${pe[i]}</i></button>`).join('');
  const tiles=Object.keys(TRAIN).map(k=>{const t=TRAIN[k];const eff=k==='rest'?'+12⚡ · +🙂':Object.keys(t.g).map(s=>'+'+STATS[s]).join(' ')+` · ${Math.round(t.e*.3)}⚡`;
    return`<button class="tile${a.days[d]===k?' on':''}${recW[d]===k?' rec':''}" onclick="planSet('${k}')"><div class="ti">${TIC[k]}</div><b>${t.n}</b><span class="small muted">${eff}</span></button>`}).join('');
  const last=P.i>=n-1;
  modal(`<div class="row" style="padding-right:42px"><h2 style="margin:0">📅 ${P.single?'Lịch tuần':'Lên lịch tuần '+S.week}</h2><span class="sp"></span><span class="small muted">${P.single?'':(P.i+1)+'/'+n}</span></div>
  ${P.single?'':`<div class="prog"><i style="width:${(P.i/n)*100}%"></i></div>`}
  <div class="pstage"><div class="bigwrap"><div class="chibi big" style="${blinkD(a.id)}">${chibiHTML(a)}</div></div>
  <div class="pinfo"><h3 style="margin:0;font-size:22px">${esc(a.name)}</h3><div>${aTags(a)}</div><div class="small muted">💗 ${fmtN(a.fans)} fan · ${trainDays(a)} ngày tập, ${7-trainDays(a)} ngày nghỉ</div>
  ${meter('⚡',a.energy,a.energy<40?'var(--red)':'var(--mint)')}${meter('🙂',a.mood,a.mood<30?'var(--red)':'var(--sun)')}</div></div>
  ${bars(a)}
  <div class="dayrow">${cells}</div>
  <div class="small muted">Chọn một ngày, rồi chạm hoạt động bên dưới. Số ⚡ là năng lượng dự kiến cuối ngày${pe.some(x=>x<30)?' — <b class="bad">có ngày năng lượng quá thấp, nên thêm ngày nghỉ</b>':''}.</div>
  <div class="small" style="margin:8px 0 0"><b>${DAYN[d]}:</b> ${TIC[a.days[d]]} ${TRAIN[a.days[d]].n}</div>
  <div class="tiles">${tiles}</div>
  <div class="card small">💡 Lịch gợi ý: <span class="dmini">${recW.map(k=>TIC[k]).join('')}</span> — ${planWhy(a)}.${a.scandal?' 🚨 Đang dính scandal.':''}
  ${(()=>{const m=mgrOf(a),pr=m&&S.props&&S.props.w===abs()&&S.props.m[m.id]?S.props.m[m.id].s.find(x=>x.a===a.id):null;return pr?`<div style="margin-top:6px">📋 QL ${esc(m.name)} đề xuất: <span class="dmini">${pr.days.map(k=>TIC[k]).join('')}</span> — ${esc(pr.why)} <button class="btn sm" onclick="planMgr()">Dùng</button></div>`:''})()}
  <div class="row" style="margin-top:6px"><button class="btn sm" onclick="planRec()">Dùng lịch gợi ý</button><button class="btn sm" onclick="planFill()">Cả tuần như ${DAYS[d]} (nghỉ cuối tuần)</button></div></div>
  <div class="row">${P.i>0?'<button class="btn" onclick="planBack()">◀ Người trước</button>':''}${!P.single?`<button class="btn sm" onclick="planSkip()">Giữ lịch cũ cho ${n-P.i} người còn lại</button>`:''}<span class="sp"></span><button class="btn pri" onclick="planNext()">${P.single?'Lưu lịch':last?'Xong ▶ Tổng kết':'Người tiếp ▶'}</button></div>
  ${P.single?'':'<div class="small muted" style="margin-top:8px">Mẹo: giao quản lý "Xếp lịch tập & nghỉ" để họ tự lo cho nghệ sĩ mình phụ trách.</div>'}`);
}
function nextWeek(force,planned){
  if(S.events.length&&!force)return view(viewSkipWarn);
  if(!planned)buildProps();
  if(!planned&&((S.planOn!==false&&S.artists.some(a=>!a.busy))||propCount()))return startPlan(force);
  mgrScheduleAll();
  if(force)for(const e of [...S.events]){const inf=evInfo(e);if(inf)resolveEv(e.id,inf.o[inf.o.length-1].k,true);else S.events=S.events.filter(x=>x!==e)}
  const now=abs(),logMark=S.log[0],rep={y:S.year,w:S.week,a:{},ev:[],m0:S.money},f0={};S.artists.forEach(a=>f0[a.id]=a.fans);
  promoWeek();
  for(const a of [...S.artists]){
    if(a.busy){rep.a[a.id]={b:a.busy.title};a.busy.left--;if(a.busy.left<=0){const bk=a.busy.kind,bt=a.busy.title;completeBusy(a);if(bk==='offer'||bk==='shoot')rep.a[a.id].done=bt}}
    else{ensureDays(a);rep.a[a.id]={d:a.days.map(k=>{const g=trainDay(a,k);return[k,g,Math.round(a.energy),Math.round(a.mood)]})}}
    if(a.status==='trainee'&&rep.a[a.id]&&rep.a[a.id].d){const dc=ttsDecay(a);if(dc)rep.a[a.id].dec=dc}
    if(a.scandal){a.fans=Math.round(a.fans*(1-.02*a.scandal.sev));a.scandal.left--;if(a.scandal.left<=0){a.scandal=null;addLog(`🌤️ Scandal của ${a.name} đã lắng xuống.`)}}
    if(a.status==='debuted')a.fans=Math.max(0,Math.round(a.fans*.996+fame(a)*3*modV('fan')*(1+bizLv('media')*.15)));
    if(a.wantAct&&now>=a.wantAct){a.wantAct=0;a.mood=clamp(a.mood-20,0,100);addLog(`😞 ${a.name} thất vọng vì lời hứa tìm vai diễn chưa thành.`,'bad')}
    S.money-=a.salary;book('sal',-a.salary);
    {const c=msk(a,'care');if(c)a.mood=clamp(a.mood+c*.25,0,100)}
    if(S.money<0)a.mood=clamp(a.mood-2,0,100);
  }
  for(const f of S.films)if(!f.done&&f.status!=='Đang quay'&&f.releaseAt&&f.releaseAt<=now)releaseFilm(f);
  S.offers=S.offers.filter(o=>o.exp>now);
  genOffers(R(2,4)+(S.artists.length>6?1:0)+(S.artists.length>12?1:0));
  {const nt=S.artists.filter(a=>a.status==='trainee').length,ho=S.offers.filter(o=>OFFER[o.type].tj).length;if(nt&&ho<Math.min(5,1+Math.ceil(nt/3)))genOffers(R(1,2),1)}
  if(S.offers.length>22)S.offers=S.offers.slice(-22);
  compTick();
  {const dn=S.films.filter(x=>x.done);if(dn.length>40){const keep=new Set(dn.slice(-40));S.films=S.films.filter(x=>!x.done||keep.has(x))}}
  if(S.singles.length>60)S.singles.length=60;if(S.concerts.length>60)S.concerts=S.concerts.slice(-60);
  for(const a of S.artists)if(a.hist.length>30)a.hist.length=30;
  if(S.week%4===0)genPool(poolSize());
  if(S.week%8===0)genMgrPool();
  for(const m of S.managers){S.money-=m.salary;book('mgr',-m.salary)}
  const bizP=weekWorld();
  mgrAuto();
  randomEvents();
  weekV2();
  if(S.money<0)addLog(`⚠️ Công ty đang âm ${fmt(-S.money)}. Nghệ sĩ bắt đầu lo lắng!`,'bad');
  if(abs()%4===0)evalAll();
  finClose();
  S.week++;
  if(S.week>52){awards();S.week=1;S.year++}
  runCbPlans();
  {const ix=S.log.indexOf(logMark);rep.ev=(ix<0?S.log:S.log.slice(0,ix)).slice(0,30).map(l=>l.t);rep.m1=S.money;if(S.lastEval&&S.lastEval.w===abs()-1)rep.evl=1;rep.biz=bizP;for(const a of S.artists)if(rep.a[a.id])rep.a[a.id].f=a.fans-(f0[a.id]||0);S.lastRep=rep}
  act();cloudAuto();
  repDay=0;
  if(awardToShow){const e=awardToShow;awardToShow=null;view(()=>viewAward(e))}
  else if(S.dqOn!==false&&dqList().length)view(viewDebutQ);
  else if(S.repOn!==false)view(viewReport);
}

/* ================= THU GỌN ================= */
function det(k,sum,body,def){S.ui=S.ui||{};const o=S.ui[k],op=o===undefined?def:o;return`<details class="cl" ${op?'open':''} ontoggle="togD('${k}',this.open)"><summary>${sum}</summary><div class="clb">${body}</div></details>`}
function togD(k,v){S.ui=S.ui||{};if(S.ui[k]===v)return;S.ui[k]=v;save()}
function setAllD(pre,v){S.ui=S.ui||{};document.querySelectorAll('details.cl').forEach(d=>{const m=(d.getAttribute('ontoggle')||'').match(/togD\('([^']+)'/);if(m&&m[1].startsWith(pre)){S.ui[m[1]]=v;d.open=v}});save()}

/* ================= THỊ TRƯỜNG: XU HƯỚNG, ĐỐI THỦ, BIẾN CỐ ================= */
const modV=k=>{const m=S.mods&&S.mods[k];return m&&m.until>abs()?m.v:1};
const setMod=(k,v,w,n)=>{S.mods=S.mods||{};S.mods[k]={v,until:abs()+w,n}};
const trendB=k=>S.trend?(S.trend.hot.includes(k)?12:S.trend.cold===k?-8:0):0;
const trendTag=k=>S.trend?(S.trend.hot.includes(k)?' 🔥':S.trend.cold===k?' ❄️':''):'';
const totalFans=()=>S.artists.reduce((t,a)=>t+a.fans,0);
function newTrend(force){const ks=Object.keys(CONCEPTS).sort(()=>Math.random()-.5);
  let hot=[ks[0],ks[1]];if(force)hot=[force,ks.find(k=>k!==force)];const cold=ks.find(k=>!hot.includes(k));
  S.trend={hot,cold,until:abs()+R(6,10)};addLog(`🔥 Xu hướng mới: ${hot.map(k=>CONCEPTS[k].n).join(' và ')} đang thịnh hành, ${CONCEPTS[cold].n} hết thời.`,'gold')}
function initWorld(){
  if(!Array.isArray(S.rivals))S.rivals=RIVALS.map(([n,b],i)=>({id:i+1,n,fans:Math.round(b*Math.pow(1.4,S.year-1)),g:+(.005+Math.random()*.004).toFixed(4),f0:0,last:'',stole:0,cb:null}));
  S.rivals.forEach(r=>{if(!r.f0)r.f0=r.fans});
  if(!S.trend)newTrend();if(!S.mods)S.mods={};if(!Array.isArray(S.biz))S.biz=[];if(!S.camp)S.camp={};if(!S.ui)S.ui={};
}
function rivalPress(){return(S.rivals||[]).filter(r=>r.cb&&r.cb.w>=abs()-1).reduce((t,r)=>t+r.cb.p,0)}
function rivalsTick(){const now=abs();
  for(const r of S.rivals){
    r.fans=Math.round(r.fans*(1+r.g*rnd(.3,1.7))+R(0,600));
    if(Math.random()<.11){const ck=Math.random()<.6?pick(S.trend.hot):pick(Object.keys(CONCEPTS)),p=clamp(Math.round(Math.log10(r.fans+10)*1.6+R(-2,2)),2,10),rank=clamp(Math.round(42-p*3.6+R(-8,14)),1,100);
      r.cb={w:now,t:pick(SONGS),ck,p,rank};r.fans+=Math.round((101-rank)*R(60,160));r.last=`Comeback «${r.cb.t}» (${CONCEPTS[ck].n}) – hạng ${rank}`;
      addLog(`⚔️ ${r.n} comeback với «${r.cb.t}» (${CONCEPTS[ck].n}), hạng ${rank}. Single ra tuần này sẽ bị cạnh tranh.`)}
    if(Math.random()<.02){r.fans=Math.round(r.fans*.9);r.last='Dính scandal, mất 10% fan';addLog(`📰 ${r.n} dính scandal lớn, mất nhiều fan. Cơ hội cho bạn!`,'good')}
  }
  if(S.offers.length>2&&Math.random()<.2){const r=pick(S.rivals),of=S.offers.filter(o=>!o.invested&&!o.target).sort((x,y)=>y.pay-x.pay)[R(0,1)];
    if(of){S.offers=S.offers.filter(o=>o!==of);r.stole=(r.stole||0)+1;r.last=`Giành lời mời «${of.title}»`;addLog(`⚔️ ${r.n} giành mất lời mời «${of.title}» (${OFFER[of.type].n}).`,'bad')}}
  const cand=S.artists.filter(a=>a.status==='debuted'&&a.fans>=6000&&!a.busy&&!hasEv(a.id,'poach'));
  if(cand.length&&Math.random()<.06){const a=pick(cand);if(Math.random()<1.1-a.mood/100-msk(a,'care')*.03){const r=pick(S.rivals);pushEv({kind:'poach',a:a.id,r:r.n,fee:clamp(Math.round(a.fans*1500/1e6)*1e6,30e6,3e9)})}}
}
const SXD={
  fire:{ic:'🔥',t:'Sự cố chập điện phòng tập',d:()=>'Phòng tập hư hỏng. Sửa tạm thì 4 tuần tới luyện tập kém hiệu quả.',o:()=>[{k:'fix',l:'Sửa ngay (60 tr)'},{k:'cheap',l:'Sửa tạm (15 tr)'}]},
  sponsor:{ic:'🤝',t:'Nhà tài trợ bất ngờ',d:e=>`${e.p} muốn tài trợ ${fmt(e.v)} để gắn logo vào hoạt động của công ty. Một số fan có thể chê "thương mại hóa".`,o:()=>[{k:'yes',l:'Nhận tài trợ'},{k:'no',l:'Từ chối'}]},
  tax:{ic:'🧾',t:'Thanh tra thuế',d:()=>'Cơ quan thuế kiểm tra sổ sách. Luật sư giỏi có thể giúp thoát phạt.',o:()=>[{k:'law',l:'Thuê luật sư (40 tr)'},{k:'pay',l:'Nộp phạt luôn'}]},
  festival:{ic:'🌏',t:'Lời mời lễ hội quốc tế',d:e=>`Lễ hội âm nhạc châu Á mời ${e.n} biểu diễn 1 tuần. Chi phí 50 tr, đổi lại nhiều fan quốc tế.`,o:()=>[{k:'yes',l:'Nhận lời (50 tr)'},{k:'no',l:'Từ chối'}]},
  leak:{ic:'💧',t:'Bản demo bị rò rỉ',d:()=>'Một bài hát chưa phát hành lan truyền trên mạng.',o:()=>[{k:'embrace',l:'Biến thành teaser'},{k:'sue',l:'Kiện người phát tán (20 tr)'},{k:'ignore',l:'Lờ đi'}]},
  investor:{ic:'💼',t:'Quỹ đầu tư muốn rót vốn',d:e=>`${e.p} rót ${fmt(e.v)} ngay. Công ty trả lại ${fmt(Math.round(e.v*1.3/26/1e6)*1e6)}/tuần trong 26 tuần.`,o:()=>[{k:'yes',l:'Nhận vốn'},{k:'no',l:'Từ chối'}]}
};
function surprise(){
  if(Math.random()>.24)return;
  const deb=S.artists.filter(a=>a.status==='debuted'),free=acts().filter(actFree);
  const pool=['fire','tax','sponsor','investor','boom','crisis','gift','challenge'];
  if(deb.length)pool.push('viral','viral','leak','injury');if(free.length&&deb.length)pool.push('festival');
  const k=pick(pool),now=abs();
  if(k==='viral'){const a=pick(deb),g=Math.round(R(3000,12000)*(1+fame(a)/50));a.fans+=g;a.yr.fans+=g;a.mood=clamp(a.mood+8,0,100);addLog(`📱 Bất ngờ: clip hậu trường của ${a.name} viral khắp mạng xã hội! +${fmtN(g)} fan.`,'gold')}
  else if(k==='boom'){setMod('fan',1.6,4,'Làn sóng K-pop: fan tăng nhanh');addLog('🌊 Bất ngờ: làn sóng thần tượng bùng nổ, 4 tuần tới fan tăng nhanh hơn 60%!','gold')}
  else if(k==='crisis'){setMod('pay',.8,6,'Suy thoái: thù lao −20%');setMod('econ',.7,6,'Suy thoái: kinh doanh −30%');addLog('📉 Bất ngờ: kinh tế suy thoái. 6 tuần tới thù lao giảm 20%, lợi nhuận kinh doanh giảm 30%.','bad')}
  else if(k==='gift'){S.artists.forEach(a=>a.mood=clamp(a.mood+8,0,100));addLog('🎁 Bất ngờ: fan gửi xe cà phê và quà đến công ty. Ai cũng vui!','good')}
  else if(k==='challenge'){const c=pick(Object.keys(CONCEPTS));newTrend(c);addLog(`🕺 Bất ngờ: một thử thách nhảy trên mạng khiến concept ${CONCEPTS[c].n} hot trở lại!`,'gold')}
  else if(k==='injury'){const c=deb.filter(a=>!a.busy);if(!c.length)return;const a=pick(c);a.busy={kind:'leave',title:'Điều trị chấn thương',left:2,total:2};a.mood=clamp(a.mood-10,0,100);addLog(`🩹 Bất ngờ: ${a.name} bị chấn thương khi tập, phải nghỉ 2 tuần.`,'bad')}
  else if(k==='sponsor')pushEv({kind:'sx',sx:k,p:pick(PARTNERS.ad),v:Math.round(R(40,150)*(1+S.year*.3))*1e6},true);
  else if(k==='investor')pushEv({kind:'sx',sx:k,p:pick(['Quỹ Sao Mai','Lotus Capital','Quỹ Rồng Vàng']),v:Math.round(R(200,500)*(1+S.year*.2))*1e6},true);
  else if(k==='festival'){const x=pick(free);pushEv({kind:'sx',sx:k,act:x.k,n:x.n.slice(2)},true)}
  else pushEv({kind:'sx',sx:k},true);
  toast('⚡ Có sự kiện bất ngờ!');
}
function sxResolve(e,k){
  const D=SXD[e.sx];
  switch(e.sx+':'+k){
    case'fire:fix':S.money-=60e6;addLog('🔧 Đã sửa xong phòng tập.');break;
    case'fire:cheap':S.money-=15e6;setMod('train',.8,4,'Phòng tập sửa tạm: luyện tập −20%');addLog('🔧 Phòng tập được sửa tạm, hiệu quả tập giảm 4 tuần.','bad');break;
    case'sponsor:yes':S.money+=e.v;S.artists.forEach(a=>{if(a.status==='debuted')a.fans=Math.round(a.fans*.99)});addLog(`🤝 Nhận ${fmt(e.v)} tài trợ từ ${e.p}.`,'good');break;
    case'sponsor:no':S.artists.forEach(a=>a.mood=clamp(a.mood+3,0,100));addLog('Từ chối tài trợ, fan khen công ty có tâm.');break;
    case'tax:law':S.money-=40e6;if(Math.random()<.6)addLog('⚖️ Luật sư chứng minh sổ sách hợp lệ, không bị phạt.','good');else{const f=clamp(Math.round(Math.abs(S.money)*.05/1e6)*1e6,30e6,300e6);S.money-=f;addLog(`🧾 Vẫn bị phạt ${fmt(f)}.`,'bad')}break;
    case'tax:pay':{const f=clamp(Math.round(Math.abs(S.money)*.04/1e6)*1e6,20e6,250e6);S.money-=f;addLog(`🧾 Nộp phạt thuế ${fmt(f)}.`,'bad');break}
    case'festival:yes':{const A=actByKey(e.act);if(!A||!actFree(A)||S.money<50e6){addLog('Không thể cử người đi lễ hội lúc này.','bad');break}S.money-=50e6;for(const id of A.m){const a=byId(id),g=R(5000,15000);a.fans+=g;a.yr.fans+=g;a.busy={kind:'concert',title:'Lễ hội quốc tế',left:1,total:1}}addLog(`🌏 ${e.n} biểu diễn ở lễ hội quốc tế, fan nước ngoài tăng mạnh!`,'gold');break}
    case'festival:no':break;
    case'leak:embrace':if(Math.random()<.6){S.artists.filter(a=>a.status==='debuted').forEach(a=>a.fans+=R(500,2500));addLog('💧 Teaser bất đắc dĩ gây sốt, fan háo hức chờ bài mới!','good')}else addLog('💧 Teaser không tạo được tiếng vang.');break;
    case'leak:sue':S.money-=20e6;addLog('⚖️ Đã khởi kiện người phát tán bản demo.');break;
    case'leak:ignore':S.artists.filter(a=>a.status==='debuted').forEach(a=>a.mood=clamp(a.mood-5,0,100));addLog('💧 Nghệ sĩ buồn vì bài hát bị rò rỉ.','bad');break;
    case'investor:yes':S.money+=e.v;S.loan={pay:Math.round(e.v*1.3/26/1e6)*1e6,left:26,n:e.p};addLog(`💼 Nhận ${fmt(e.v)} từ ${e.p}. Trả dần ${fmt(S.loan.pay)}/tuần trong 26 tuần.`,'good');break;
  }
}
/* ---- đầu tư kinh doanh ---- */
const BIZ={
  cafe:{n:'Cà phê thần tượng',ic:'☕',cost:150e6,base:5e6,syn:.8,vol:.3,d:'Fan càng đông càng đắt khách.'},
  food:{n:'Chuỗi nhà hàng',ic:'🍜',cost:350e6,base:11e6,syn:.2,vol:.25,d:'Ổn định, ít phụ thuộc fan.'},
  media:{n:'Studio nội dung số',ic:'📹',cost:250e6,base:5e6,syn:.6,vol:.4,d:'Mỗi cấp giúp nghệ sĩ đã ra mắt tăng fan nhanh hơn.'},
  academy:{n:'Học viện đào tạo',ic:'🏫',cost:500e6,base:8e6,syn:.1,vol:.2,d:'Mỗi cấp tăng 6% hiệu quả luyện tập.'},
  fashion:{n:'Thương hiệu thời trang',ic:'👗',cost:450e6,base:13e6,syn:1,vol:.45,d:'Bán chạy khi nghệ sĩ nổi tiếng.'},
  beauty:{n:'Dòng mỹ phẩm',ic:'💄',cost:700e6,base:19e6,syn:1,vol:.5,d:'Lãi cao, phụ thuộc danh tiếng.'},
  game:{n:'Studio game',ic:'🎮',cost:900e6,base:26e6,syn:.5,vol:1.1,d:'Rủi ro cao: có tuần lãi lớn, có tuần lỗ.'},
  estate:{n:'Bất động sản',ic:'🏢',cost:1200e6,base:22e6,syn:0,vol:.1,d:'Rất ổn định, vốn lớn.'}
};
const bizLv=k=>{const b=(S.biz||[]).find(x=>x.k===k);return b?b.lv:0};
const upCost=b=>Math.round(BIZ[b.k].cost*.7*b.lv);
function bizTick(){const fF=clamp(totalFans()/300000,0,2);let t=0;
  for(const b of S.biz){const B=BIZ[b.k];const p=Math.round(B.base*b.lv*(1+B.syn*fF)*rnd(1-B.vol,1+B.vol)*modV('econ')/1e5)*1e5;const q=Math.round(p*bizOwn(b));b.last=p;b.tot+=q;t+=q}
  S.money+=t;book('biz',t);if(S.loan){S.money-=S.loan.pay;S.loan.left--;if(S.loan.left<=0){addLog(`💼 Đã trả xong khoản vốn của ${S.loan.n}.`,'good');S.loan=null}}
  return t}
function buyBiz(k){const B=BIZ[k];if(bizLv(k))return;if(S.money<B.cost)return toast('Không đủ tiền');S.money-=B.cost;S.biz.push({k,lv:1,inv:B.cost,tot:0,last:0,y:S.year});addLog(`${B.ic} Mở ${B.n} (${fmt(B.cost)}).`,'gold');act()}
function upBiz(k){const b=S.biz.find(x=>x.k===k);if(!b||b.lv>=5)return;const c=upCost(b);if(S.money<c)return toast('Không đủ tiền');S.money-=c;b.inv+=c;b.lv++;addLog(`${BIZ[k].ic} Mở rộng ${BIZ[k].n} lên cấp ${b.lv}.`,'good');act()}
function sellBiz(k,btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent='Chạm lần nữa';return}const b=S.biz.find(x=>x.k===k);if(!b)return;const v=Math.round(b.inv*.6*bizOwn(b));S.money+=v;S.biz=S.biz.filter(x=>x!==b);addLog(`${BIZ[k].ic} Bán ${BIZ[k].n}, thu về ${fmt(v)}.`);act()}
const bizOwn=b=>b.own??1;
const bizVal=b=>{const B=BIZ[b.k],fF=clamp(totalFans()/300000,0,2),exp=B.base*b.lv*(1+B.syn*fF);return Math.round((b.inv+exp*26)/1e6)*1e6};
const bizWait=b=>Math.max(0,8-(abs()-(b.rw??-99)));
function raiseBiz(k,pct){const b=S.biz.find(x=>x.k===k);if(!b)return;if(Math.round((bizOwn(b)-pct)*100)<51)return toast('Phải giữ tối thiểu 51% cổ phần');if(bizWait(b))return toast(`Chờ ${bizWait(b)} tuần nữa mới gọi vốn tiếp`);const v=Math.round(bizVal(b)*pct);S.money+=v;b.own=bizOwn(b)-pct;b.rw=abs();addLog(`💼 ${BIZ[k].n} kêu gọi vốn: bán ${Math.round(pct*100)}% cổ phần cho ${pick(['Quỹ Sao Mai','Lotus Capital','Quỹ Rồng Vàng'])}, nhận ${fmt(v)}.`,'gold');act()}
function buybackBiz(k){const b=S.biz.find(x=>x.k===k);if(!b||bizOwn(b)>=1)return;const c=Math.round(bizVal(b)*(1-bizOwn(b))*1.15);if(S.money<c)return toast('Không đủ tiền');S.money-=c;b.own=1;addLog(`💼 Mua lại toàn bộ cổ phần ${BIZ[k].n} (${fmt(c)}).`,'good');act()}
function weekWorld(){
  if(!S.trend||abs()>=S.trend.until)newTrend();
  rivalsTick();surprise();
  for(const k in S.mods)if(S.mods[k].until<=abs())delete S.mods[k];
  return bizTick();
}
function renderTrend(){const el=$('#trendBar');if(!el||!S.trend)return;const L=S.trend.until-abs(),cb=S.rivals.filter(r=>r.cb&&r.cb.w>=abs()-1);
  const ms=Object.values(S.mods||{}).filter(m=>m.until>abs());
  el.innerHTML=`🔥 Thịnh hành: <b>${S.trend.hot.map(k=>CONCEPTS[k].n).join(', ')}</b> <span class="muted">· ❄️ ${CONCEPTS[S.trend.cold].n} · còn ${L} tuần</span>${cb.length?` · ⚔️ ${cb.length} đối thủ comeback`:''}${ms.length?` · ${ms.map(m=>esc(m.n)).join(' · ')}`:''}`}

/* ================= EVENTS ================= */
const hasEv=(id,k)=>S.events.some(e=>e.a===id&&e.kind===k);
function pushEv(e,force){if(S.events.length>=7&&!force)return;e.id=uid();S.events.push(e)}
function makeScandal(a){
  const dp=datingPartner(a),dating=dp&&a.tag[dp.id]==='dating'&&Math.random()<.6;
  const t=dating?`Bị chụp ảnh hẹn hò với ${dp.name}`:pick(['Tin đồn thái độ với nhân viên','Bị đào lại phát ngôn cũ','Tin đồn chèn ép đồng nghiệp','Lộ ảnh quá khứ gây tranh cãi','Tin đồn đạo nhái vũ đạo']);
  a.scandal={t,sev:R(1,3),left:6,truth:dating||Math.random()<.4,dating:!!dating,other:dating?dp.id:0};
  a.fans=Math.round(a.fans*.95);
  pushEv({kind:'scandal',a:a.id},true);
  addLog(`🚨 Scandal: ${a.name} – ${t}!`,'bad');
}
const LEADS={
  photo:{n:'Ảnh/video gốc',ic:'📷',r:.85,T:'File gốc có dữ liệu ngày giờ khớp, không bị chỉnh sửa.',F:'Phân tích điểm ảnh cho thấy ảnh đã bị ghép.'},
  witness:{n:'Nhân chứng',ic:'🧑‍🤝‍🧑',r:.7,T:'Hai nhân chứng độc lập xác nhận sự việc.',F:'Lời khai mâu thuẫn, có dấu hiệu được trả tiền.'},
  chat:{n:'Tin nhắn',ic:'💬',r:.8,T:'Lịch sử tin nhắn trùng khớp nội dung tin đồn.',F:'Ảnh chụp tin nhắn dùng giao diện giả.'},
  schedule:{n:'Lịch trình',ic:'🗓️',r:.75,T:'Lịch trình có khoảng trống đúng giờ được nhắc tới.',F:'Hôm đó nghệ sĩ đang tập, có camera phòng tập làm chứng.'},
  source:{n:'Nguồn tung tin',ic:'🕵️',r:.65,T:'Nguồn tin là phóng viên uy tín, từng đưa tin chính xác.',F:'Tài khoản tung tin mới lập, liên quan công ty đối thủ.'},
  talk:{n:'Nói chuyện riêng',ic:'🗣️',r:.6,T:'Nghệ sĩ lúng túng và thừa nhận một phần.',F:'Nghệ sĩ bình tĩnh đưa ra lời giải thích hợp lý.'},
  social:{n:'Mạng xã hội',ic:'📱',r:.55,T:'Nhiều tài khoản cũ từng nhắc chuyện tương tự.',F:'Tin đồn chỉ lan từ một cụm tài khoản ảo.'},
  staff:{n:'Nhân viên hậu trường',ic:'🎬',r:.7,T:'Staff xác nhận có chuyện xảy ra.',F:'Staff khẳng định không có chuyện đó.'}
};
function invFix(sc){if(sc&&sc.inv&&!sc.inv.leads)sc.inv=null}
function invStart(aId){
  const a=byId(aId),sc=a&&a.scandal;if(!sc)return;invFix(sc);
  if(!sc.inv){
    if(S.money<10e6)return toast('Cần 10 tr để mở hồ sơ');
    S.money-=10e6;const pr=msk(a,'pr');
    const ks=Object.keys(LEADS).sort(()=>Math.random()-.5).slice(0,6);
    sc.inv={leads:ks.map(k=>{const r=Math.min(.95,LEADS[k].r+pr*.02);return{k,r:+r.toFixed(2),says:Math.random()<r?sc.truth:!sc.truth,open:false}}),ap:3+Math.floor(pr/3),p:.5};
    addLog(`🕵️ Mở hồ sơ điều tra scandal của ${a.name}.`);save();render();
  }
  curRC='var(--r-pr)';curView=()=>viewInv(aId);curView();
}
function invOpen(aId,i){
  const a=byId(aId),inv=a&&a.scandal&&a.scandal.inv;if(!inv)return;const L=inv.leads[i];if(!L||L.open)return;
  if(inv.ap<=0)return toast('Hết lượt điều tra. Mua thêm lượt hoặc đưa ra quyết định.');
  inv.ap--;L.open=true;L.fresh=true;const r=L.r,p=inv.p;
  inv.p=L.says?p*r/(p*r+(1-p)*(1-r)):p*(1-r)/(p*(1-r)+(1-p)*r);
  act();
}
function invBuy(aId){const inv=byId(aId)?.scandal?.inv;if(!inv)return;if(S.money<8e6)return toast('Không đủ tiền');S.money-=8e6;inv.ap++;act()}
function invVerdict(p){return p>=.75?{t:'Nhiều khả năng là SỰ THẬT',c:'bad',v:1}:p<=.25?{t:'Nhiều khả năng là TIN SAI',c:'good',v:0}:{t:'Chưa đủ bằng chứng',c:'muted',v:-1}}
function invRec(v,dating){return v===1?(dating?'Nên xin lỗi hoặc công khai hẹn hò. Phủ nhận và kiện tụng rất dễ bị lật lại.':'Nên xin lỗi công khai. Phủ nhận hay kiện tụng dễ phản tác dụng.'):v===0?'Nên kiện tụng hoặc phủ nhận. Xin lỗi lúc này khiến fan tin rằng tin đồn là thật.':'Hãy mở thêm hồ sơ để chắc chắn hơn trước khi quyết định.'}
function viewInv(aId){
  const a=byId(aId);
  if(!a||!a.scandal||!a.scandal.inv){modal(`<h2>🗂️ Hồ sơ đã đóng</h2><div class="sub">Scandal này đã được xử lý.</div><button class="btn pri" onclick="openRoom('pr')">Về Phòng Truyền thông</button>`);return}
  const sc=a.scandal,inv=sc.inv,pct=Math.round(inv.p*100),vd=invVerdict(inv.p),e=S.events.find(x=>x.kind==='scandal'&&x.a===a.id),info=e&&evInfo(e);
  const files=inv.leads.map((L,i)=>{const D=LEADS[L.k],rot=`--rot:${(i%3-1)*1.6}deg`;
    if(L.open){const fr=L.fresh?' flip':'';L.fresh=false;return`<div class="file open ${L.says?'t':'f'}${fr}" style="${rot}"><b>${D.ic} ${D.n}</b>${L.says?D.T:D.F}<br><span class="stamp" style="color:${L.says?'var(--red)':'var(--mint)'}">${L.says?'→ THẬT':'→ SAI'}</span> <span class="small" style="opacity:.7">tin cậy ${Math.round(L.r*100)}%</span></div>`}
    return`<button class="file" style="${rot}" onclick="invOpen(${a.id},${i})" ${inv.ap<=0?'aria-disabled="true"':''}><b>${D.ic} ${D.n}</b>Độ tin cậy ${'★'.repeat(Math.round(L.r*5))}${'☆'.repeat(5-Math.round(L.r*5))}<div style="margin-top:14px;font-weight:700">🔎 Chạm để điều tra</div></button>`}).join('');
  modal(`<h2>🕵️ Hồ sơ: ${esc(a.name)}</h2><div class="sub">${esc(sc.t)} · mức ${'🔥'.repeat(sc.sev)} · còn ${sc.left} tuần</div>
  <div class="card"><div class="row"><b>Lượt điều tra:</b><span style="font-size:18px">${'🔎'.repeat(inv.ap)||'<span class="small muted">hết lượt</span>'}</span><span class="sp"></span><button class="btn sm" onclick="invBuy(${a.id})">+1 lượt (8 tr)</button></div>
  <div class="meter"><div class="needle" style="left:${pct}%" data-p="${pct}% thật"></div></div><div class="mlab"><span>Tin sai</span><span>Chưa rõ</span><span>Sự thật</span></div></div>
  <div class="small muted">Mỗi hồ sơ cho một manh mối nghiêng về "thật" hoặc "sai". Hồ sơ nhiều sao đáng tin hơn, nhưng manh mối nào cũng có thể sai. Kỹ năng Truyền thông của quản lý giúp tăng lượt và độ tin cậy.</div>
  <div class="case">${files}</div>
  <div class="card" style="border-color:${vd.v===1?'var(--red)':vd.v===0?'var(--mint)':'var(--line)'}"><b class="${vd.c}">Kết luận hiện tại: ${vd.t}</b><div class="small" style="margin:4px 0 8px">👉 ${invRec(vd.v,sc.dating)}</div>
  ${info?`<div class="row">${info.o.map(o=>`<button class="btn sm ${(vd.v===1&&(o.k==='sorry'||o.k==='public'))||(vd.v===0&&(o.k==='sue'||o.k==='deny'))?'pri':''}" onclick="resolveEv(${e.id},'${o.k}');openRoom('pr')">${o.l}</button>`).join('')}</div>`:'<div class="small muted">Công ty đã chọn im lặng. Chờ dư luận lắng xuống.</div>'}</div>`);
}
function invBlock(a){
  const sc=a.scandal;if(!sc)return'';invFix(sc);
  if(!sc.inv)return`<div class="row" style="margin:6px 0"><button class="btn sm pri" onclick="invStart(${a.id})">🕵️ Mở hồ sơ điều tra (10 tr)</button><span class="small muted">Tìm manh mối trước khi chọn cách xử lý</span></div>`;
  const vd=invVerdict(sc.inv.p);
  return`<div class="row" style="margin:6px 0"><button class="btn sm pri" onclick="invStart(${a.id})">🕵️ Tiếp tục điều tra</button><span class="small ${vd.c}">${Math.round(sc.inv.p*100)}% thật · ${vd.t}</span></div>`;
}
function randomEvents(){
  const A=S.artists;
  for(const a of A){
    if(a.mood<22&&Math.random()<.3*(1-msk(a,'care')*.06)&&!hasEv(a.id,'req_leave'))pushEv({kind:'req_leave',a:a.id});
    else if(Math.random()<.035&&!S.events.some(e=>e.a===a.id)){
      const o=['req_rest','req_raise'];
      if(a.status==='debuted'&&!a.wantAct)o.push('req_acting');
      if(groupsOf(a).length&&!a.solo)o.push('req_solo');
      pushEv({kind:pick(o),a:a.id});
    }
    if(a.status==='debuted'&&!a.scandal&&Math.random()<(.012+(datingPartner(a)&&a.tag[datingPartner(a).id]==='dating'?.05:0))*(1-msk(a,'pr')*.07))makeScandal(a);
  }
  if(A.length>=2){
    const n=Math.min(8,Math.ceil(A.length/2)+1);
    for(let i=0;i<n;i++){
      const x=pick(A),y=pick(A);if(x===y)continue;
      const same=sameGroup(x,y)||(!x.busy&&!y.busy&&roomOf(x)===roomOf(y));
      setRel(x,y,getRel(x,y)+R(-7,8)+(same?3:0));
      const r=getRel(x,y),t=x.tag[y.id];
      if(!t&&r>=60){setTag(x,y,'friend');addLog(`🤝 ${x.name} và ${y.name} trở thành bạn thân.`,'good')}
      else if(t==='friend'&&r>=85&&Math.random()<.35&&!datingPartner(x)&&!datingPartner(y)&&!S.events.some(e=>e.kind==='rel_dating'))pushEv({kind:'rel_dating',a:x.id,b:y.id});
      else if(t!=='enemy'&&r<=-40&&!S.events.some(e=>e.kind==='rel_conflict'&&(e.a===x.id||e.a===y.id)))pushEv({kind:'rel_conflict',a:x.id,b:y.id});
    }
  }
}
function evInfo(e){
  {const x=xInfo(e);if(x!==undefined)return x}
  if(e.kind==='sx'){const D=SXD[e.sx];return D?{ic:D.ic,t:D.t,d:D.d(e),o:D.o(e)}:null}
  const a=byId(e.a),b=e.b?byId(e.b):null;if(!a||(e.b&&!b))return null;
  switch(e.kind){
    case'req_rest':return{ic:'😮‍💨',t:`${a.name} xin nghỉ phép`,d:'Lịch trình dày khiến cậu ấy kiệt sức và muốn nghỉ 2 tuần.',o:[{k:'yes',l:'Cho nghỉ 2 tuần'},{k:'no',l:'Từ chối'}]};
    case'req_raise':return{ic:'💸',t:`${a.name} muốn tăng lương`,d:`Lương hiện tại ${fmt(a.salary)}/tuần.`,o:[{k:'yes',l:'Tăng 3 tr/tuần'},{k:'no',l:'Từ chối'}]};
    case'req_acting':return{ic:'🎭',t:`${a.name} muốn thử sức diễn xuất`,d:'Cậu ấy mong được nhận vai trong 10 tuần tới.',o:[{k:'yes',l:'Hứa sẽ tìm vai'},{k:'no',l:'Từ chối'}]};
    case'req_solo':return{ic:'🎤',t:`${a.name} muốn ra mắt solo`,d:'Hoạt động solo song song với nhóm. Chi phí 80 tr.',o:[{k:'yes',l:'Cho ra solo (80 tr)'},{k:'no',l:'Để sau'}]};
    case'req_leave':return{ic:'🚪',t:`${a.name} đòi rời công ty!`,d:`Tâm trạng chỉ còn ${Math.round(a.mood)}. Nếu không giữ chân, cậu ấy sẽ đi.`,o:[{k:'talk',l:'Thuyết phục (30 tr)'},{k:'raise',l:'Tăng lương 10 tr/tuần'},{k:'go',l:'Để rời đi'}]};
    case'rel_conflict':return{ic:'⚡',t:`${a.name} và ${b.name} mâu thuẫn`,d:'Không khí trong công ty căng thẳng. Mâu thuẫn trong nhóm làm giảm chất lượng single.',o:[{k:'fix',l:'Hòa giải (10 tr)'},{k:'no',l:'Mặc kệ'}]};
    case'poach':return{ic:'🕵️',t:`${e.r} muốn chiêu mộ ${a.name}`,d:`Họ đề nghị lương gấp đôi. Tâm trạng hiện tại ${Math.round(a.mood)}. Để đi thì nhận phí chuyển nhượng ${fmt(e.fee)}.`,o:[{k:'raise',l:`Giữ chân: tăng lương ${fmt(Math.max(5e6,Math.round(a.salary*.5/1e6)*1e6))}/tuần`},{k:'talk',l:'Nói chuyện (40 tr)'},{k:'go',l:`Để đi (+${fmt(e.fee)})`}]};
    case'rel_dating':return{ic:'💞',t:`${a.name} và ${b.name} muốn hẹn hò`,d:'Hai người đã rất thân. Hẹn hò làm họ vui hơn nhưng có nguy cơ bị lộ.',o:[{k:'yes',l:'Cho phép (bí mật)'},{k:'no',l:'Cấm'}]};
    case'scandal':{if(!a.scandal)return null;const o=[{k:'deny',l:'Phủ nhận'},{k:'sorry',l:'Xin lỗi công khai'},{k:'sue',l:'Kiện tụng (30 tr)'}];if(a.scandal.dating)o.push({k:'public',l:'Công khai hẹn hò'});o.push({k:'silent',l:'Im lặng chờ lắng'});
      return{ic:'🚨',t:`Scandal: ${a.name}`,d:`${a.scandal.t}. Mức độ ${'🔥'.repeat(a.scandal.sev)}. Fan giảm mỗi tuần cho đến khi được xử lý.`,o}}
  }
  return null;
}
function removeArtist(a,why){
  for(const m of S.managers)if(m.as&&m.as.t==='l')m.as.ids=m.as.ids.filter(i=>i!==a.id);
  S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!=='s'+a.id);
  S.artists=S.artists.filter(x=>x!==a);S.artists.forEach(x=>{if(x.mt===a.id)x.mt=0});
  for(const g of S.groups)g.members=g.members.filter(id=>id!==a.id);
  const gone=S.groups.filter(g=>!g.members.length);S.groups=S.groups.filter(g=>g.members.length);
  for(const x of S.artists){delete x.rel[a.id];delete x.tag[a.id]}
  S.events=S.events.filter(e=>e.a!==a.id&&e.b!==a.id);
  for(const m of S.managers)if(m.as&&((m.as.t==='a'&&m.as.id===a.id)||(m.as.t==='g'&&!S.groups.find(g=>g.id===m.as.id))))m.as=null;
  addLog(`👋 ${a.name} ${why}.`+(gone.length?` Nhóm ${gone.map(g=>g.name).join(', ')} tan rã.`:''),'bad');
}
function resolveEv(id,k,silent){
  const e=S.events.find(x=>x.id===id);if(!e)return;S.events=S.events.filter(x=>x!==e);
  if(e.kind==='sx'){sxResolve(e,k);if(!silent)act();return}
  if(XK.includes(e.kind)){xResolve(e,k);if(!silent)act();return}
  const a=byId(e.a),b=e.b?byId(e.b):null;if(!a||(e.b&&!b)){if(!silent)act();return}
  const M=(x,d)=>x.mood=clamp(x.mood+d,0,100);
  switch(e.kind+':'+k){
    case'req_rest:yes':if(!a.busy)a.busy={kind:'leave',title:'Nghỉ phép',left:2,total:2};a.energy=100;M(a,20);addLog(`🌴 ${a.name} đi nghỉ phép 2 tuần.`);break;
    case'req_rest:no':M(a,-15);break;
    case'req_raise:yes':a.salary+=3e6;M(a,20);addLog(`💸 Lương ${a.name} tăng lên ${fmt(a.salary)}/tuần.`);break;
    case'req_raise:no':M(a,-15);break;
    case'req_acting:yes':a.wantAct=abs()+10;M(a,10);addLog(`🎭 Bạn hứa tìm vai cho ${a.name} trong 10 tuần.`);break;
    case'req_acting:no':M(a,-12);break;
    case'req_solo:yes':if(S.money<80e6){M(a,-10);addLog(`Không đủ tiền cho ${a.name} ra solo.`,'bad');break}S.money-=80e6;a.solo=true;givePM(a);M(a,25);a.fans+=R(3000,8000);addLog(`🎤 ${a.name} chính thức ra mắt solo!`,'gold');break;
    case'req_solo:no':M(a,-15);break;
    case'req_leave:talk':S.money-=30e6;if(Math.random()<.35+a.mood/100){a.mood=50;addLog(`🤝 ${a.name} đồng ý ở lại sau buổi nói chuyện.`,'good')}else removeArtist(a,'vẫn quyết định rời công ty');break;
    case'req_leave:raise':a.salary+=10e6;a.mood=60;addLog(`💸 ${a.name} ở lại với mức lương ${fmt(a.salary)}/tuần.`);break;
    case'req_leave:go':removeArtist(a,'đã rời công ty');break;
    case'poach:raise':a.salary+=Math.max(5e6,Math.round(a.salary*.5/1e6)*1e6);M(a,15);addLog(`💸 Giữ chân ${a.name} trước lời mời của ${e.r}.`,'good');break;
    case'poach:talk':S.money-=40e6;if(Math.random()<.3+a.mood/120+msk(a,'care')*.04){M(a,10);addLog(`🤝 ${a.name} từ chối ${e.r}, ở lại công ty.`,'good')}else{S.money+=e.fee;const r=S.rivals.find(x=>x.n===e.r);if(r)r.fans+=Math.round(a.fans*.5);removeArtist(a,`chuyển sang ${e.r}`)}break;
    case'poach:go':{S.money+=e.fee;const r=S.rivals.find(x=>x.n===e.r);if(r)r.fans+=Math.round(a.fans*.5);removeArtist(a,`chuyển sang ${e.r} (phí ${fmt(e.fee)})`);break}
    case'rel_conflict:fix':S.money-=10e6;setRel(a,b,0);if(a.tag[b.id]==='enemy')setTag(a,b,null);M(a,-3);M(b,-3);addLog(`🕊️ ${a.name} và ${b.name} đã làm hòa.`,'good');break;
    case'rel_conflict:no':setTag(a,b,'enemy');addLog(`⚡ ${a.name} và ${b.name} trở thành đối thủ.`,'bad');break;
    case'rel_dating:yes':setTag(a,b,'dating');M(a,15);M(b,15);addLog(`💞 ${a.name} và ${b.name} bí mật hẹn hò.`);break;
    case'rel_dating:no':setRel(a,b,getRel(a,b)-20);M(a,-20);M(b,-20);addLog(`💔 ${a.name} và ${b.name} bị cấm hẹn hò.`,'bad');break;
    case'scandal:deny':if(a.scandal.truth&&Math.random()<.6-msk(a,'pr')*.04){a.fans=Math.round(a.fans*.85);a.scandal.sev=Math.min(3,a.scandal.sev+1);a.scandal.left=4;addLog(`📉 Phủ nhận thất bại! Bằng chứng mới khiến scandal của ${a.name} nặng hơn.`,'bad')}else{a.fans=Math.round(a.fans*.98);a.scandal=null;addLog(`🛡️ Phủ nhận thành công, ${a.name} thoát scandal.`,'good')}break;
    case'scandal:sorry':a.fans=Math.round(a.fans*(a.scandal.truth?.96:.91));M(a,-10);a.scandal=null;addLog(`🙇 ${a.name} xin lỗi công khai, dư luận dần dịu lại.`);break;
    case'scandal:sue':S.money-=30e6;if(!a.scandal.truth&&Math.random()<.8+msk(a,'pr')*.015){a.fans=Math.round(a.fans*1.03);a.scandal=null;addLog(`⚖️ Thắng kiện! Fan càng ủng hộ ${a.name}.`,'good')}else{a.fans=Math.round(a.fans*.9);a.scandal=null;addLog(`⚖️ Thua kiện, hình ảnh ${a.name} bị ảnh hưởng.`,'bad')}break;
    case'scandal:public':{const o=byId(a.scandal.other);a.fans=Math.round(a.fans*.92);if(o){setTag(a,o,'public');o.fans=Math.round(o.fans*.95)}a.scandal=null;M(a,10);addLog(`💌 ${a.name} công khai hẹn hò. Một phần fan rời đi, nhưng không còn rủi ro bị "khui".`);break}
    case'scandal:silent':addLog(`🤐 Công ty im lặng về scandal của ${a.name}.`);break;
  }
  if(!silent)act();
}

/* ================= SINGLES / CONCERTS / FILMS / DEBUT ================= */
function acts(){const r=[];S.groups.forEach(g=>r.push({k:'g'+g.id,n:'👥 '+g.name,m:g.members}));S.artists.filter(a=>a.solo).forEach(a=>r.push({k:'s'+a.id,n:'🎤 '+a.name+' (solo)',m:[a.id]}));return r}
const actFree=x=>x.m.length&&!gHiatus(x.k)&&x.m.every(id=>{const a=byId(id);return a&&!a.busy});
function conceptRec(x){const m=x.m.map(byId).filter(Boolean);return Object.keys(CONCEPTS).map(k=>{const f=avgFit(m,CONCEPTS[k].w);return{k,f,s:f+trendB(k)}}).sort((a,b)=>b.s-a.s)}
function studioPick(k,c){if(!$('#sAct'))return;$('#sAct').value=k;$('#sCon').value=c;$('#sCon').onchange();$('#sAct').scrollIntoView({behavior:'smooth',block:'center'})}
/* ---- Thư ký: kế hoạch comeback ---- */
const BUDN={30e6:'Tiết kiệm',80e6:'Tiêu chuẩn',200e6:'Bom tấn'};
function lastSingleW(x){const s=S.singles.find(z=>z.k?z.k===x.k:z.act===x.n);return s?(s.w||(s.y-1)*52+1):null}
function estRank(x,ck,bud,rp){const mem=x.m.map(byId).filter(Boolean);if(!mem.length)return 100;const ft=avgFit(mem,CONCEPTS[ck].w),fm=mem.reduce((t,a)=>t+fame(a),0)/mem.length,bb=bud>=200e6?16:bud>=80e6?8:0;
  return clamp(Math.round(118-(ft*.6+fm*.3+bb+10+harmony(x.m)+trendB(ck)-(rp==null?rivalPress():rp))),1,100)}
function secPlan(x){
  const mem=x.m.map(byId).filter(Boolean);if(!mem.length)return null;
  const now=abs(),busyL=Math.max(0,...mem.map(a=>a.busy?a.busy.left:0)),lw=lastSingleW(x),gap=lw==null?99:now-lw;
  const rec=conceptRec(x),fm=mem.reduce((t,a)=>t+fame(a),0)/mem.length,e=mem.reduce((t,a)=>t+a.energy,0)/mem.length;
  const bud=S.money>1.5e9&&fm>=25?200e6:S.money>400e6?80e6:30e6;
  let wait=0,ck=rec[0].k;const why=[];
  if(busyL){wait=busyL;why.push(`còn bận ${busyL} tuần`)}
  if(gap<4){wait=Math.max(wait,4-gap);why.push(`vừa comeback ${gap} tuần trước, nên cách ít nhất 4 tuần`)}
  if(!busyL&&e<45){wait=Math.max(wait,1);why.push(`năng lượng TB ${Math.round(e)}, cho nghỉ 1 tuần`)}
  if(rivalPress()>0&&wait<2){const d=estRank(x,ck,bud)-estRank(x,ck,bud,0);if(d>=4){wait=2;why.push(`đối thủ đang comeback, ra lúc này tụt ~${d} hạng`)}}
  if(wait>=S.trend.until-now&&S.trend.hot.includes(ck)){ck=rec.slice().sort((a,b)=>b.f-a.f)[0].k;why.push('xu hướng sắp đổi nên chọn concept hợp nhất thay vì concept hot')}
  if(S.money<bud+50e6)why.push('quỹ đang eo hẹp');
  if(!why.length)why.push(gap>=99?'chưa có single nào, nên ra mắt sớm':`đã ${gap} tuần chưa comeback, đội hình khỏe`);
  const tf=mem.reduce((t,a)=>t+a.fans,0),lc=S.concerts.slice().reverse().find(c=>c.k?c.k===x.k:c.act===x.n),cg=lc?(lc.w?now-lc.w:(S.year-lc.y)*52):99;
  return{k:x.k,n:x.n,wait,ck,bud,rank:estRank(x,ck,bud,wait>=2?0:null),fit:rec.find(r=>r.k===ck).f,why,gap,concert:tf>=30000&&cg>=26&&!busyL,tf,plan:(S.cbPlan||[]).find(p=>p.k===x.k)}
}
function secPlans(){return acts().map(secPlan).filter(Boolean).sort((a,b)=>(a.plan?1:0)-(b.plan?1:0)||a.wait-b.wait||a.rank-b.rank)}
function secSchedRec(){return secPlans().filter(p=>!p.plan&&!(S.camp[p.k]&&S.camp[p.k].ph==='post')&&p.wait>=1&&p.wait<=6&&S.money>=p.bud).sort((a,b)=>a.rank-b.rank||a.wait-b.wait).slice(0,3).map(p=>(p.recWhy=`hạng dự kiến ~${p.rank}, ${p.wait} tuần nữa sẵn sàng; ${p.why[0]}`,p))}
function cbSchedRec(){const L=secSchedRec();if(!L.length)return;L.forEach(p=>cbSched(p.k));addLog(`🗒️ Thư ký hẹn comeback theo khuyến nghị cho: ${L.map(p=>p.n.slice(2).trim()).join(', ')}.`);act()}
function cbNow(k){const p=secPlan(actByKey(k));if(!p)return;if(doSingle(k,p.ck,p.bud,null,true)){addLog(`🗒️ Thư ký triển khai comeback theo kế hoạch.`);act()}else toast('Chưa thể comeback (bận hoặc thiếu tiền)')}
function cbSched(k){const x=actByKey(k),p=secPlan(x);if(!p)return;S.cbPlan=(S.cbPlan||[]).filter(z=>z.k!==k);const w=abs()+Math.max(1,p.wait);S.cbPlan.push({k,n:p.n,w,ck:p.ck,bud:p.bud,tries:0});
  addLog(`🗒️ Hẹn comeback cho ${p.n.slice(2).trim()} vào tuần ${((w-1)%52)+1}. Đã tự chừa lịch: thành viên không nhận dự án hay cuộc thi kéo dài qua tuần này.`);
  const late=x.m.map(byId).filter(a=>a&&a.busy&&abs()+a.busy.left>w);if(late.length)addLog(`⚠️ ${late.map(a=>a.name).join(', ')} đang bận ${late.map(a=>'«'+a.busy.title+'»').join(', ')} quá tuần comeback, có thể phải lùi lịch.`,'bad');act()}
function cbCancel(k){S.cbPlan=(S.cbPlan||[]).filter(x=>x.k!==k);act()}
const wkLabel=w=>`T${((w-1)%52)+1}${Math.ceil(w/52)!==S.year?' N'+Math.ceil(w/52):''}`;
function runCbPlans(){if(!S.cbPlan||!S.cbPlan.length)return;const now=abs();
  for(const p of [...S.cbPlan]){if(p.w>now)continue;const x=actByKey(p.k);if(!x){S.cbPlan=S.cbPlan.filter(z=>z!==p);continue}
    const q=secPlan(x),ck=q?q.ck:p.ck;
    if(actFree(x)&&S.money>=p.bud&&doSingle(p.k,ck,p.bud,null,true))addLog(`🗒️ Thư ký triển khai comeback đã hẹn cho ${p.n.slice(2).trim()} (${CONCEPTS[ck].n}).`,'good');
    else{p.tries++;p.w=now+1;if(p.tries>3){S.cbPlan=S.cbPlan.filter(z=>z!==p);addLog(`🗒️ Hủy lịch comeback của ${p.n.slice(2).trim()} vì hoãn quá 3 lần.`,'bad')}else addLog(`🗒️ Lùi comeback của ${p.n.slice(2).trim()} 1 tuần (${actFree(x)?'thiếu tiền':'thành viên đang bận'}).`)}}}
function secCard(p,rec){const name=esc(p.n);
  const st=p.plan?`<span class="tag v">📅 Đã hẹn ${wkLabel(p.plan.w)}</span>`:p.wait?`<span class="tag">⏳ Chờ ${p.wait} tuần</span>`:'<span class="tag m">✅ Sẵn sàng</span>';
  const body=`<div class="small">⭐ ${CONCEPTS[p.ck].n}${trendTag(p.ck)} (${Math.round(p.fit)}%) · ${BUDN[p.bud]} ${fmt(p.bud)} · dự kiến hạng ~<b>${p.rank}</b></div>
  <div class="small muted">💬 ${esc(p.why.join('; '))}.</div>
  ${(()=>{const c=S.camp[p.k];return c&&c.ph==='post'?`<div class="small">📣 Đang quảng bá «${esc(c.t)}»: hạng #${c.rank}, ${c.wins} cúp, tuần ${c.wn+1}/${PROMO_WK}.</div>`:(p.wait||p.plan)?`<div class="small">📣 ${c?`Hype ${c.hype}.`:'Chưa teaser.'} Tận dụng thời gian chờ để tung teaser, tạo hype trước comeback.</div>`:c&&c.hype?`<div class="small">📣 Hype ${c.hype} sẵn sàng cho comeback.</div>`:''})()}
  ${p.concert?`<div class="small">🏟️ Đủ ${fmtN(p.tf)} fan và lâu rồi chưa diễn: nên tổ chức concert (200 tr). <button class="btn sm" onclick="holdConcert('${p.k}')">Tổ chức</button></div>`:''}
  <div class="row" style="margin-top:6px"><button class="btn sm" onclick="view(()=>viewCamp('${p.k}'))">📣 Quảng bá</button><span class="sp"></span>${p.plan?`<button class="btn sm" onclick="cbCancel('${p.k}')">Hủy hẹn</button>`:p.wait?`<button class="btn sm pri" onclick="cbSched('${p.k}')">Hẹn tuần ${wkLabel(abs()+p.wait)}</button>`:`<button class="btn sm" onclick="cbSched('${p.k}')">Hẹn tuần sau</button><button class="btn sm pink" onclick="cbNow('${p.k}')">Comeback ngay</button>`}</div>`;
  return det('sec-c'+p.k,`<b>${name}</b> ${st} <span class="small muted">· hạng ~${p.rank}${rec?' ⭐':''}</span>`,body,rec||(!p.wait&&!p.plan))}
function viewSec(){const L=secPlans(),R=secSchedRec(),rk=new Set(R.map(p=>p.k)),due=L.filter(p=>rk.has(p.k)||(!p.wait&&!p.plan)),rest=L.filter(p=>!due.includes(p)),ready=L.filter(p=>!p.wait&&!p.plan).length,cb=S.rivals.filter(r=>r.cb&&r.cb.w>=abs()-1);
  modal(`<div class="row" style="padding-right:42px"><div class="chibi mini">${chibiHTML(NPC[1])}</div><div><h2 style="margin:0;font-size:21px">🗒️ Kế hoạch comeback</h2><div class="small muted">Thư ký tổng hợp: xu hướng, đối thủ, năng lượng, quỹ.</div></div></div>
  <div class="card small">🔥 Hot: <b>${S.trend.hot.map(k=>CONCEPTS[k].n).join(', ')}</b> (còn ${S.trend.until-abs()} tuần)${cb.length?` · ⚔️ ${cb.map(r=>esc(r.n)).join(', ')} đang comeback`:' · Không có đối thủ comeback'} · 💰 Quỹ ${fmt(S.money)}<br>${L.length?`👉 ${ready?`<b>${ready}</b> nhóm/solo nên comeback ngay.`:'Chưa ai nên comeback ngay, xem lịch hẹn bên dưới.'}`:'Chưa có nhóm hay solo nào. Debut ở Sảnh Tuyển dụng trước nhé.'}</div>
  <div class="card small">🗒️ ${R.length?`<b>Thư ký khuyến nghị hẹn:</b> ${R.map(p=>`${esc(p.n.slice(2).trim())} (${wkLabel(abs()+p.wait)}, ${esc(p.recWhy)})`).join(' · ')} <button class="btn sm pri" onclick="cbSchedRec()">Hẹn theo khuyến nghị</button>`:'Chưa cần hẹn thêm ai.'}</div>
  ${L.length?`<div class="row" style="margin-bottom:6px"><span class="sp"></span><button class="btn sm" onclick="setAllD('sec-',false)">Thu gọn hết</button><button class="btn sm" onclick="setAllD('sec-',true)">Mở hết</button></div>`:''}
  ${due.length?det('sec-due',`✅ Nên xử lý (${due.length})`,due.map(p=>secCard(p,rk.has(p.k))).join(''),true):''}
  ${rest.length?det('sec-rest',`📅 Đã hẹn & đang chờ (${rest.length})`,rest.map(p=>secCard(p,rk.has(p.k))).join(''),false):''}
  ${det('sec-fan','💬 Đề xuất giao lưu fan (fan meeting, livestream)',fanHTML(),true)}
  <div class="small muted">Lịch đã hẹn sẽ được thư ký tự triển khai vào đầu tuần đó, concept được chọn lại theo xu hướng lúc ấy. Nếu thành viên bận hoặc thiếu tiền, lịch tự lùi 1 tuần (tối đa 3 lần).</div>`)}
/* ---- Chiến dịch quảng bá trước & sau comeback ---- */
const PROMO_WK=3;
const PRE={
  sched:{n:'Lịch trình comeback',ic:'🗓️',c:3e6,h:4,e:0,d:'Công bố ngày ra mắt'},
  photo:{n:'Ảnh teaser',ic:'📸',c:10e6,h:6,e:3,d:'Bộ ảnh concept'},
  medley:{n:'Highlight medley',ic:'🎧',c:15e6,h:8,e:2,d:'Nghe thử các bài'},
  mvt:{n:'MV teaser',ic:'🎬',c:30e6,h:12,e:6,d:'Đoạn MV 30 giây'},
  pre:{n:'Pre-release',ic:'🎵',c:40e6,h:14,e:8,d:'Tung trước 1 bài, thêm fan'},
  vpre:{n:'Tạp kỹ quảng bá',ic:'📺',c:0,h:10,e:10,d:'Lên show, tăng Tạp kỹ'},
  showcase:{n:'Showcase báo chí',ic:'🎤',c:50e6,h:15,e:12,d:'Ra mắt trước truyền thông'}
};
const POST={
  s1:{n:'Sân khấu Music Weekly',ic:'🎤',stage:1,e:8},
  s2:{n:'Sân khấu Sân Khấu Sao',ic:'🎤',stage:1,e:8},
  s3:{n:'Sân khấu Đài Âm Nhạc',ic:'🎤',stage:1,e:8},
  s4:{n:'Bảng Xếp Hạng Tuần',ic:'🎤',stage:1,e:8},
  radio:{n:'Radio',ic:'📻',e:3},
  variety:{n:'Tạp kỹ',ic:'📺',e:8},
  fansign:{n:'Ký tặng (fansign)',ic:'✍️',e:6},
  challenge:{n:'Dance challenge',ic:'🕺',e:4},
  live:{n:'Livestream cùng fan',ic:'📱',e:3}
};
const campMem=k=>{const x=actByKey(k);return x?x.m.map(byId).filter(Boolean):[]};
const avgE=ms=>ms.length?ms.reduce((t,a)=>t+a.energy,0)/ms.length:0;
const avgFm=ms=>ms.length?ms.reduce((t,a)=>t+fame(a),0)/ms.length:0;
function preDo(k,id,quiet){const x=actByKey(k),P=PRE[id];if(!x||!P)return;
  if(!actFree(x))return quiet||toast('Đang bận, chưa thể teaser');
  let c=S.camp[k];if(c&&c.ph==='post')return quiet||toast('Đang trong đợt quảng bá');
  if(!c)c=S.camp[k]={k,n:x.n,ph:'pre',hype:0,done:{}};
  if(c.done[id])return quiet||toast('Đã làm rồi');if(S.money<P.c)return quiet||toast('Không đủ tiền');
  const ms=campMem(k);if(ms.some(a=>a.energy<P.e+5))return quiet||toast('Có thành viên quá mệt');
  S.money-=P.c;c.done[id]=abs();const h=Math.round(P.h*(1+avgFm(ms)/150));c.hype=Math.min(80,c.hype+h);
  for(const a of ms){a.energy=clamp(a.energy-P.e,0,100);if(id==='vpre')a.st.variety=clamp(+(a.st.variety+1.5).toFixed(1),0,100);if(id==='pre'){const g=R(300,1500);a.fans+=g;a.yr.fans+=g}}
  addLog(`📣 ${x.n.slice(2).trim()}: ${P.ic} ${P.n} (+${h} hype, tổng ${c.hype}).`);if(!quiet)act()}
function postDo(k,id,quiet){const c=S.camp[k],P=POST[id],x=actByKey(k);if(!c||c.ph!=='post'||!P||!x)return;
  if(c.used.wk!==abs())c.used={wk:abs(),l:[]};if(c.used.l.includes(id))return quiet||toast('Tuần này đã làm');
  const ms=campMem(k);if(ms.some(a=>a.energy<P.e+3))return quiet||toast('Có thành viên quá mệt, nên nghỉ');
  c.used.l.push(id);const fm=avgFm(ms),nm=x.n.slice(2).trim();let msg='';
  for(const a of ms)a.energy=clamp(a.energy-P.e,0,100);
  const gF=n=>{for(const a of ms){const g=Math.round(n*(1+fm/100));a.fans+=g;a.yr.fans+=g}};
  if(P.stage){c.stages++;gF(R(400,1200));c.rank=Math.max(1,c.rank-R(0,3));
    const pw=clamp(((101-c.rank)*.75+c.hype*.3+fm*.3-62)/40,.02,.85);
    if(Math.random()<pw){c.wins++;gF(R(2500,6000));ms.forEach(a=>a.mood=clamp(a.mood+10,0,100));const sg=S.singles.find(z=>z.k===k&&z.title===c.t);if(sg)sg.wins=(sg.wins||0)+1;msg=`🏆 «${c.t}» giành cúp #1 tại ${P.n.replace('Sân khấu ','')}!`;addLog(`${msg} (${nm}, cúp thứ ${c.wins})`,'gold')}
    else msg=`${P.ic} ${nm} biểu diễn ${P.n}.`}
  else if(id==='radio'){gF(R(200,600));ms.forEach(a=>a.st.variety=clamp(+(a.st.variety+.5).toFixed(1),0,100));msg=`📻 ${nm} lên radio.`}
  else if(id==='variety'){gF(R(600,1800));ms.forEach(a=>a.st.variety=clamp(+(a.st.variety+1.5).toFixed(1),0,100));c.rank=Math.max(1,c.rank-R(0,2));msg=`📺 ${nm} quảng bá trên tạp kỹ.`}
  else if(id==='fansign'){const tf=ms.reduce((t,a)=>t+a.fans,0),v=Math.round(Math.min(tf*.01,4000)*R(150,250))*1e3;S.money+=v;book('live',v,ms);c.inc+=v;ms.forEach(a=>a.mood=clamp(a.mood+6,0,100));gF(R(200,500));msg=`✍️ Fansign của ${nm}: bán thêm album, +${fmt(v)}.`}
  else if(id==='challenge'){if(Math.random()<.25){gF(R(3000,8000));c.rank=Math.max(1,c.rank-R(3,8));msg=`🕺 Dance challenge của «${c.t}» viral! Bài hát leo hạng mạnh.`}else{gF(R(300,900));msg=`🕺 ${nm} tung dance challenge.`}}
  else if(id==='live'){gF(R(200,700));const v=ms.reduce((t,a)=>t+liveInc(a),0);S.money+=v;book('live',v,ms);c.inc+=v;ms.forEach(a=>{a.mood=clamp(a.mood+6,0,100);a.lastLive=abs()});msg=`📱 ${nm} livestream giao lưu fan sau sân khấu, thu ${fmt(v)}.`}
  c.best=Math.min(c.best,c.rank);if(!P.stage||!msg.startsWith('🏆'))addLog(msg);
  if(!quiet)act()}
function postRec(k){const c=S.camp[k],ms=campMem(k);if(!c)return[];let e=Math.min(...ms.map(a=>a.energy)),out=[];const u=c.used.wk===abs()?c.used.l:[];
  for(const id of ['s1','s2','s3','s4','fansign','radio','challenge','variety','live']){if(out.length>=4)break;if(u.includes(id))continue;const P=POST[id];if(e-P.e<30)continue;out.push(id);e-=P.e}
  return out}
function postAuto(k,quiet){const L=postRec(k);L.forEach(id=>postDo(k,id,true));if(!quiet){if(!L.length)toast('Thành viên đã mệt, nên để nghỉ');act()}return L.length}
function preRec(k){const c=S.camp[k]||{done:{}},ms=campMem(k);let e=Math.min(...ms.map(a=>a.energy)),m=S.money,out=[];
  for(const id of ['sched','photo','medley','vpre','mvt','pre','showcase']){const P=PRE[id];if(c.done&&c.done[id])continue;if(e-P.e<40||m-P.c<100e6)continue;out.push(id);e-=P.e;m-=P.c;if(out.length>=3)break}return out}
function preAuto(k){const L=preRec(k);if(!L.length)return toast('Chưa có hoạt động phù hợp (mệt hoặc thiếu tiền)');L.forEach(id=>preDo(k,id,true));act()}
function promoWeek(){
  for(const k of Object.keys(S.camp)){const c=S.camp[k],x=actByKey(k);if(!x){delete S.camp[k];continue}
    if(c.ph==='pre'){const pl=(S.cbPlan||[]).find(p=>p.k===k);if(!pl&&Object.values(c.done).every(w=>abs()-w>6)){c.hype=Math.max(0,c.hype-5);if(!c.hype)delete S.camp[k]}continue}
    if(S.autoPromo!==false&&(c.used.wk!==abs()||!c.used.l.length)){const n=postAuto(k,true);if(n)addLog(`🗒️ Thư ký tự xếp ${n} hoạt động quảng bá cho ${x.n.slice(2).trim()}.`)}
    const ms=campMem(k),fm=avgFm(ms),inc=Math.round(Math.pow(101-c.rank,1.6)*15000*(1+fm/100)/1e5)*1e5;S.money+=inc;book('live',inc,ms);c.inc+=inc;
    c.wn++;
    if(c.wn>=PROMO_WK){S.fmHint=S.fmHint||{};S.fmHint[k]=abs();addLog(`📣 Kết thúc quảng bá «${c.t}» (${x.n.slice(2).trim()}): ${c.stages} sân khấu, ${c.wins} cúp, hạng cao nhất #${c.best}, thu thêm ${fmt(c.inc)}.`,c.wins?'gold':'good');delete S.camp[k]}
    else c.rank=Math.min(100,c.rank+R(1,5));
  }}
/* ---- Đánh giá định kỳ 4 tuần ---- */
const EV_TTS=5,EV_ART=10,EV_PCT=20;
const stSum=a=>Object.values(a.st).reduce((t,v)=>t+v,0);
const evSnap=a=>{a.ev={st:stSum(a),f:a.fans,wc:a.wc||0,w:abs()}};
const evNext=()=>4-(abs()%4)||4;
function evalAll(){const R0={w:abs(),y:S.year,wk:S.week,t:[],a:[]};
  for(const a of [...S.artists]){
    if(!a.ev){evSnap(a);continue}
    if(a.status==='trainee'){
      const p=+((stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100).toFixed(1),rd=Math.max(bestOf(a,CONCEPTS)[0].f,bestOf(a,GENRES)[0].f)>DEBUT_MIN;
      const g=p>=35?'Xuất sắc':p>=27?'Tốt':(p>EV_PCT||rd)?'Đạt':'Không đạt';
      a.ttsFail=g==='Không đạt'?(a.ttsFail||0)+1:0;
      R0.t.push({id:a.id,n:a.name,g,p,f:a.ttsFail});a.evG=g;
      if(g==='Không đạt'){a.mood=clamp(a.mood-5,0,100);
        if(a.ttsFail>=EV_TTS){removeArtist(a,`bị loại khỏi chương trình đào tạo sau ${EV_TTS} lần đánh giá không đạt liên tiếp`);R0.t[R0.t.length-1].out=1;continue}
        if(a.ttsFail>=3)addLog(`⚠️ TTS ${a.name} không đạt đánh giá lần ${a.ttsFail}/${EV_TTS} liên tiếp. Thêm ${EV_TTS-a.ttsFail} lần nữa sẽ bị loại.`,'bad')}
      else if(g==='Xuất sắc')a.mood=clamp(a.mood+5,0,100);
    }else{
      const pct=(a.fans-a.ev.f)/Math.max(a.ev.f,2000)*100,wk=(a.wc||0)-a.ev.wc,pts=Math.round(pct+wk*6-(a.scandal?8:0));
      const g=pts>=20?'Xuất sắc':pts>=5?'Đạt':'Không đạt';let money=0;
      if(g==='Xuất sắc'){money=-Math.max(5e6,Math.round(a.salary*2/1e6)*1e6);S.money+=money;a.mood=clamp(a.mood+10,0,100);a.evFail=0}
      else if(g==='Đạt')a.evFail=0;
      else{money=Math.max(1e6,Math.round(a.salary/1e6)*1e6);S.money+=money;a.mood=clamp(a.mood-6,0,100);a.evFail=(a.evFail||0)+1}
      R0.a.push({id:a.id,n:a.name,g,pts,f:a.evFail||0,money});a.evG=g;
      if(g==='Không đạt'){if(a.evFail>=EV_ART){removeArtist(a,`bị chấm dứt hợp đồng sau ${EV_ART} lần đánh giá không đạt liên tiếp`);R0.a[R0.a.length-1].out=1;continue}
        if(a.evFail>=7)addLog(`⚠️ ${a.name} không đạt đánh giá ${a.evFail}/${EV_ART} lần liên tiếp. Sắp bị chấm dứt hợp đồng!`,'bad')}
    }
    evSnap(a);
  }
  if(!R0.t.length&&!R0.a.length)return;
  S.lastEval=R0;
  const ex=R0.a.filter(x=>x.g==='Xuất sắc'),fa=R0.a.filter(x=>x.g==='Không đạt'),tf=R0.t.filter(x=>x.g==='Không đạt');
  addLog(`📋 Đánh giá định kỳ: TTS ${R0.t.length-tf.length}/${R0.t.length} đạt · Nghệ sĩ ${ex.length} xuất sắc${ex.length?` (thưởng ${fmt(-ex.reduce((t,x)=>t+x.money,0))})`:''}, ${fa.length} không đạt${fa.length?` (trừ ${fmt(fa.reduce((t,x)=>t+x.money,0))})`:''}.`,fa.length||tf.length?'':'good');
}
function evalBrief(E){if(!E)return'';const tf=E.t.filter(x=>x.g==='Không đạt'),ex=E.a.filter(x=>x.g==='Xuất sắc'),fa=E.a.filter(x=>x.g==='Không đạt');
  return`<div class="card rep">📋 <b>Đánh giá định kỳ</b> (T${E.wk} N${E.y})<br>🌱 TTS: ${E.t.length-tf.length}/${E.t.length} đạt${tf.length?` · <span class="w">${tf.map(x=>esc(x.n)+(x.out?' bị loại':` ${x.f}/${EV_TTS}`)).join(', ')}</span>`:''}<br>⭐ Nghệ sĩ: ${ex.length?`🏅 ${ex.map(x=>esc(x.n)).join(', ')} (+thưởng)`:'không ai xuất sắc'}${fa.length?` · <span class="w">${fa.map(x=>esc(x.n)+(x.out?' bị chấm dứt HĐ':` ${x.f}/${EV_ART}`)).join(', ')}</span>`:''}</div>`}
function evalTable(E){if(!E)return'<div class="small muted">Chưa có kỳ đánh giá nào.</div>';const gc=g=>g==='Xuất sắc'?'tag s':g==='Tốt'||g==='Đạt'?'tag m':'tag r';
  return`${E.t.length?`<div class="small"><b>🌱 Thực tập sinh</b> (tổng chỉ số phải tăng trên ${EV_PCT}% so với 4 tuần trước; bản thân đã đủ điểm debut trên ${DEBUT_MIN}% cũng tính đạt)</div>${E.t.map(x=>`<div class="prow"><b>${esc(x.n)}</b><span class="${gc(x.g)}">${x.g}</span><span class="small muted">${x.p>=0?'+':''}${x.p}%${x.g==='Không đạt'?` · ${x.out?'đã bị loại':`trượt ${x.f}/${EV_TTS} liên tiếp`}`:''}</span></div>`).join('')}`:''}
  ${E.a.length?`<div class="small" style="margin-top:6px"><b>⭐ Nghệ sĩ</b> (điểm = % fan tăng + 6/hoạt động − scandal; ≥20 xuất sắc, ≥5 đạt)</div>${E.a.map(x=>`<div class="prow"><b>${esc(x.n)}</b><span class="${gc(x.g)}">${x.g}</span><span class="small muted">${x.pts} điểm${x.money<0?` · thưởng ${fmt(-x.money)}`:x.money>0?` · trừ ${fmt(x.money)}`:''}${x.g==='Không đạt'?` · ${x.out?'đã chấm dứt HĐ':`trượt ${x.f}/${EV_ART} liên tiếp`}`:''}</span></div>`).join('')}`:''}`}


/* ---- Phòng Truyền thông: đề xuất kế hoạch quảng bá ---- */
const PRP={
  sns:{n:'Chạy quảng cáo SNS',ic:'📱',c:15e6},
  press:{n:'Phỏng vấn & thông cáo báo chí',ic:'📰',c:5e6},
  mag:{n:'Chụp ảnh tạp chí',ic:'📷',c:8e6},
  tts:{n:'Clip đời sống thực tập sinh',ic:'🎥',c:8e6},
  actor:{n:'Quảng bá hình ảnh diễn viên',ic:'🎬',c:12e6}
};
const PR_CD=4;
function prSk(){return S.managers.reduce((m,x)=>Math.max(m,effSk(x,'pr')),0)}
function prCool(t,k){const u=(S.prUsed||{})[t+':'+k];return u!=null&&abs()-u<PR_CD}
function prMem(k){return k==='tts'?S.artists.filter(a=>a.status==='trainee'):k[0]==='a'?[byId(+k.slice(1))].filter(Boolean):campMem(k)}
function prName(k){if(k==='tts')return'tất cả thực tập sinh';if(k[0]==='a'){const a=byId(+k.slice(1));return a?a.name:'?'}const x=actByKey(k);return x?x.n.slice(2).trim():'?'}
function prPlans(){const L=[],now=abs();
  for(const x of acts()){const k=x.k,c=S.camp[k],nm=esc(x.n.slice(2).trim()),ms=campMem(k);if(!ms.length)continue;
    if(c&&c.ph==='post'){const r=postRec(k);if(r.length&&!(c.used.wk===now&&c.used.l.length))L.push({hot:1,pri:9,ic:'🎤',t:`Lịch quảng bá tuần này cho ${nm}`,why:`Đang quảng bá «${esc(c.t)}», hạng #${c.rank}. Đề xuất: ${r.map(id=>POST[id].n).join(', ')}.`,cost:0,go:`postAuto('${k}')`});continue}
    if(!actFree(x))continue;
    const pl=(S.cbPlan||[]).find(p=>p.k===k),sp=secPlan(x),soon=pl||(c&&c.ph==='pre')||(sp&&!sp.wait);
    if(soon){const r=preRec(k);if(r.length)L.push({hot:1,pri:8,ic:'📣',t:`Gói teaser trước comeback cho ${nm}`,why:`${pl?`Đã hẹn comeback ${wkLabel(pl.w)}.`:'Sắp đến thời điểm comeback.'} Hype hiện tại ${c?c.hype:0}/80. Đề xuất: ${r.map(id=>PRE[id].n).join(', ')}.`,cost:r.reduce((t,id)=>t+PRE[id].c,0),go:`preAuto('${k}')`})}
    const lw=lastSingleW(x),gap=lw?now-lw:99;
    if(!soon&&gap>=8&&!prCool('sns',k))L.push({pri:5,ic:PRP.sns.ic,t:`${PRP.sns.n} cho ${nm}`,why:gap>=99?'Chưa có hoạt động nổi bật nào, cần tăng độ nhận diện.':`${gap} tuần chưa có bài mới, fan đang nguội dần.`,cost:PRP.sns.c,go:`prDo('sns','${k}')`});
    if(soon&&!prCool('sns',k))L.push({pri:6,ic:PRP.sns.ic,t:`${PRP.sns.n} trước comeback cho ${nm}`,why:'Quảng cáo trước ngày phát hành cộng thêm hype.',cost:PRP.sns.c,go:`prDo('sns','${k}')`});
    if(ms.some(a=>a.scandal)&&!prCool('press',k))L.push({hot:1,pri:7,ic:PRP.press.ic,t:`${PRP.press.n} cho ${nm}`,why:'Đang có tin đồn, cần bài phỏng vấn tích cực để kéo dư luận.',cost:PRP.press.c,go:`prDo('press','${k}')`});
    else if(!prCool('mag',k)&&!prCool('press',k)&&gap>=5&&gap<99&&Math.min(...ms.map(a=>a.st.visual))>=45)L.push({pri:3,ic:PRP.mag.ic,t:`${PRP.mag.n} cùng ${nm}`,why:'Giữ hình ảnh giữa hai lần comeback, tăng Visual.',cost:PRP.mag.c,go:`prDo('mag','${k}')`});
  }
  for(const a of S.artists.filter(a=>a.actor&&!a.busy)){const k='a'+a.id;if(prCool('actor',k))continue;const gap=a.lastFan?now-a.lastFan:99;
    if(gap>=4||a.wantAct)L.push({pri:4,ic:PRP.actor.ic,t:`${PRP.actor.n}: ${esc(a.name)}`,why:a.wantAct?'Đang muốn đóng phim, cần được đạo diễn chú ý.':'Lâu chưa xuất hiện trên truyền thông.',cost:PRP.actor.c,go:`prDo('actor','${k}')`})}
  const tts=S.artists.filter(a=>a.status==='trainee');
  if(tts.length>=2&&!prCool('tts','tts'))L.push({pri:4,ic:PRP.tts.ic,t:`${PRP.tts.n} (tất cả ${tts.length} thực tập sinh)`,why:'Xây fan cho cả lứa trước khi debut, các bạn cũng vui hơn.',cost:PRP.tts.c,go:`prDo('tts','tts')`});
  for(const f of fanSugs().slice(0,3))L.push(f.t==='fm'?{pri:6,ic:'💝',t:`Fan meeting: ${esc(f.n.slice(2).trim())}`,why:`${esc(f.why)}. Ước tính ~${fmtN(f.est)} chỗ.`,cost:f.cost,go:`doFM('${f.k}')`}:{pri:2,ic:'📱',t:`Livestream: ${esc(f.n)}`,why:`${esc(f.why)}. Dự kiến thu ~${fmt(liveEst([byId(f.id)]))}.`,cost:1e6,go:`doLive([${f.id}])`});
  return L.sort((a,b)=>b.pri-a.pri)}
function prHTML(L){const sk=prSk();
  return`<div class="small muted" style="margin-bottom:6px">Phòng Truyền thông đề xuất dựa trên lịch comeback, tin đồn và mức độ chú ý của từng nhóm, solo, diễn viên. Kỹ năng Truyền thông cao nhất trong đội quản lý: <b>${sk}</b> (+${Math.round(sk*4)}% hiệu quả).</div>`+
  (L.map(p=>`<div class="card prp ${p.hot?'hot':''}"><div class="row"><b>${p.ic} ${p.t}</b><span class="sp"></span><span class="small muted">${p.cost?fmt(p.cost):'miễn phí'}</span></div><div class="small muted">${p.why}</div><div class="row" style="margin-top:6px"><span class="sp"></span><button class="btn sm pri" onclick="prGo(this)" data-t="${p.t}" data-go="${p.go}">Duyệt</button></div></div>`).join('')||'<div class="small muted">Chưa có kế hoạch mới. Các nhóm đang được quảng bá đúng nhịp.</div>')}
function prGo(btn){const f=btn.dataset.go,t=btn.dataset.t||'';S.prHist=S.prHist||[];S.prHist.unshift(`${wkLabel(abs())}: ${t.replace(/<[^>]+>/g,'')}`);if(S.prHist.length>40)S.prHist.length=40;new Function(f)()}
function prDo(t,k){const P=PRP[t];if(!P)return;if(S.money<P.c)return toast('Không đủ tiền');const ms=prMem(k);if(!ms.length)return;
  S.money-=P.c;S.prUsed=S.prUsed||{};S.prUsed[t+':'+k]=abs();const mu=1+prSk()*.04,nm=prName(k);let tf=0;
  const gF=n=>ms.forEach(a=>{const g=Math.round(R(n[0],n[1])*mu*(1+fame(a)/100));a.fans+=g;if(a.yr)a.yr.fans+=g;tf+=g});
  let msg='';
  if(t==='sns'){gF([600,2000]);const c=S.camp[k];let h='';if(c&&c.ph==='pre'){const d=Math.round(6*mu);c.hype=Math.min(80,c.hype+d);h=`, +${d} hype`}msg=`${P.ic} Quảng cáo SNS cho ${nm}: +${fmtN(tf)} fan${h}.`}
  else if(t==='press'){gF([200,700]);ms.forEach(a=>{if(a.scandal&&a.scandal.left>1)a.scandal.left--;a.mood=clamp(a.mood+3,0,100)});msg=`${P.ic} ${nm} trả lời phỏng vấn, dư luận dịu lại (+${fmtN(tf)} fan).`}
  else if(t==='mag'){gF([300,900]);ms.forEach(a=>a.st.visual=clamp(+(a.st.visual+1).toFixed(1),0,100));msg=`${P.ic} ${nm} lên tạp chí: +${fmtN(tf)} fan, Visual +1.`}
  else if(t==='tts'){gF([80,300]);ms.forEach(a=>a.mood=clamp(a.mood+5,0,100));msg=`${P.ic} Clip của ${ms.length} thực tập sinh lan truyền: +${fmtN(tf)} fan, cả lứa vui hơn.`}
  else if(t==='actor'){gF([300,1000]);ms.forEach(a=>{a.st.acting=clamp(+(a.st.acting+.5).toFixed(1),0,100);a.lastFan=abs()});msg=`${P.ic} ${nm} quảng bá hình ảnh: +${fmtN(tf)} fan, Diễn xuất +0.5.`}
  if(t!=='tts')ms.forEach(a=>a.wc=(a.wc||0)+1);
  addLog(msg,'good');act()}


/* ---- Lứa thực tập sinh ---- */
function initBatches(){S.bno=1;S.batches=[{id:uid(),n:'Lứa 1',w:abs()}];S.curBatch=S.batches[0].id;S.artists.filter(a=>a.status==='trainee').forEach(a=>a.batch=S.curBatch)}
const batchOf=a=>(S.batches||[]).find(b=>b.id===a.batch)||null;
const bMem=b=>S.artists.filter(a=>a.status==='trainee'&&a.batch===b.id);
function fixBatch(a){if(a.status==='trainee'&&!S.batches.some(b=>b.id===a.batch))a.batch=S.curBatch}
function newBatch(){const n='Lứa '+(++S.bno),b={id:uid(),n,w:abs()};S.batches.push(b);S.curBatch=b.id;S.ui=S.ui||{};S.ui['lb-b'+b.id]=true;addLog(`🌱 Mở ${n}. Thực tập sinh ký mới sẽ vào lứa này.`,'good');act()}
function setCurBatch(id){S.curBatch=+id;act()}
function moveBatch(aid,bid){const a=byId(aid),b=S.batches.find(x=>x.id===+bid);if(a&&b){a.batch=b.id;addLog(`🔀 Chuyển ${a.name} sang ${b.n}.`);act()}}
function batchSched(bid,v){if(!v)return;S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).forEach(a=>a.days=defaultDays(v));toast('Đã xếp lịch cho cả lứa');act()}
function batchLive(bid){const ids=S.artists.filter(a=>a.status==='trainee'&&a.batch===bid&&!a.busy).map(a=>a.id);if(!ids.length)return toast('Không có ai rảnh');doLive(ids)}
function batchHTML(){const cur=S.curBatch;
  return`<div class="row" style="margin-bottom:6px"><span class="small">Ký mới vào:</span><select onchange="setCurBatch(this.value)">${S.batches.length?'':'<option>Tự mở lứa mới khi ký</option>'}${S.batches.map(b=>`<option value="${b.id}" ${b.id===cur?'selected':''}>${esc(b.n)}</option>`).join('')}</select><span class="sp"></span><button class="btn sm pri" onclick="newBatch()">+ Mở lứa mới</button></div>
  <div class="small muted" style="margin-bottom:6px">Mỗi lứa có thể xếp lịch tập chung, livestream chung và giao cho một quản lý riêng ở Văn phòng Quản lý. Lứa không còn thực tập sinh sẽ tự xoá.</div>`+
  S.batches.slice().reverse().map(b=>{const ms=bMem(b).sort(eligSort),grad=S.artists.filter(a=>a.batch===b.id&&a.status==='debuted').length;
    const m=S.managers.find(x=>x.as&&x.as.t==='b'&&x.as.id===b.id);
    const pr=ms.filter(a=>a.ev).map(a=>(stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100),ap=pr.length?pr.reduce((x,y)=>x+y,0)/pr.length:0,free=ms.filter(a=>!a.busy);
    const body=`<div class="small muted">Mở ${wkLabel(b.w)} · ${grad} đã debut · 📋 ${m?esc(m.name):'chưa có quản lý'}${pr.length?` · tiến bộ trung bình ${ap.toFixed(1)}% (cần trên ${EV_PCT}%)`:''} · 💗 ${fmtN(ms.reduce((t,a)=>t+a.fans,0))} fan</div>
    ${ms.length?`<div class="row" style="margin:6px 0"><select onchange="batchSched(${b.id},this.value)"><option value="">📅 Lịch tập cả lứa…</option>${Object.keys(TRAIN).map(k=>`<option value="${k}">${TRAIN[k].n}</option>`).join('')}</select><button class="btn sm" onclick="batchLive(${b.id})" ${free.length?'':'disabled'}>📱 Livestream cả lứa (chi 1 tr, thu ~${fmt(liveEst(free))})</button></div>`:''}
    ${ms.map(a=>`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button>${dHold(a)?'<span class="tag s">🎊 sẵn sàng debut</span>':''}${a.mt&&byId(a.mt)?`<span class="tag v">👩‍🏫 ${esc(byId(a.mt).name)}</span>`:''}<span class="small muted">${a.busy?'🚶 '+esc(a.busy.title):'tổng '+Math.round(stSum(a))}${a.ev?' · '+((stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100).toFixed(1)+'%':''} · trượt ${a.ttsFail||0}/${EV_TTS} · 💗${fmtN(a.fans)}</span><span class="sp"></span>${S.batches.length>1?`<select onchange="moveBatch(${a.id},this.value)" aria-label="Chuyển lứa">${S.batches.map(x=>`<option value="${x.id}" ${x.id===b.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select>`:''}</div>`).join('')||'<div class="small muted">Lứa này không còn thực tập sinh.</div>'}`;
    return det('lb-b'+b.id,`${esc(b.n)} (${ms.length} TTS)${b.id===cur?' <span class="tag v">đang tuyển</span>':''}`,body,ms.length>0)}).join('')}

/* ---- Cuộc thi cho thực tập sinh ---- */
const COMP=[
  {n:'Giọng hát Tân binh',ic:'🎙️',w:{vocal:1},t:[1,1]},
  {n:'Đấu trường Rap Trẻ',ic:'🎤',w:{rap:1,variety:.3},t:[1,1]},
  {n:'Liên hoan Nhảy đường phố',ic:'🕺',w:{dance:1,stamina:.5},t:[2,5]},
  {n:'Cover Dance Idol',ic:'💃',w:{dance:.8,vocal:.4,visual:.4},t:[3,6]},
  {n:'Gương mặt Teen',ic:'📸',w:{visual:1,variety:.4},t:[1,1]},
  {n:'Tài năng Diễn xuất Trẻ',ic:'🎭',w:{acting:1,visual:.3},t:[1,2]},
  {n:'Ban nhạc Học đường',ic:'🎸',w:{vocal:.8,rap:.4,dance:.4},t:[2,4]}
];
function genComp(){const T=pick(COMP.filter(c=>!(S.comps||[]).some(x=>x.n===c.n)));if(!T)return;
  const lvl=clamp(R(18,36)+(S.year-1)*6+Math.floor(S.week/13)*2,12,85),p1=Math.round(R(30,70)*(1+lvl/40))*1e6;
  S.comps.push({id:uid(),n:T.n,ic:T.ic,w:T.w,t:T.t,lvl,wk:R(1,2),fee:R(2,6)*1e6*T.t[0],prize:[p1,Math.round(p1*.45/1e6)*1e6,Math.round(p1*.2/1e6)*1e6],exp:abs()+R(3,5)})}
function compTick(){S.comps=(S.comps||[]).filter(c=>c.exp>abs());if(S.comps.length<2||(S.comps.length<4&&Math.random()<.35))genComp()}
function compOdds(c,ids){const ms=ids.map(byId).filter(Boolean);if(!ms.length)return 0;const f=ms.reduce((t,a)=>t+fit(a,c.w),0)/ms.length*(1+(ms.length>1?chem(ids):0));
  let n=0;for(let i=0;i<300;i++){const sc=f+rnd(-8,8);let r=1;for(let j=0;j<7;j++)if(c.lvl+rnd(-12,14)>sc)r++;if(r<=3)n++}return Math.round(n/3)}
function compSel(cid){return[...document.querySelectorAll('.cp'+cid+':checked')].map(x=>+x.value)}
function compPrev(cid){const c=S.comps.find(x=>x.id===cid),el=$('#cpo'+cid);if(!c||!el)return;const ids=compSel(cid);
  el.textContent=ids.length?`Đã chọn ${ids.length} người · cơ hội vào top 3 khoảng ${compOdds(c,ids)}%`:`Chọn ${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} thực tập sinh`}
function compPick(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const n=c.t[1]>1?clamp(3,c.t[0],c.t[1]):1;
  const L=S.artists.filter(a=>a.status==='trainee'&&!a.busy).sort((x,y)=>fit(y,c.w)-fit(x,c.w)).slice(0,n).map(a=>a.id);
  document.querySelectorAll('.cp'+cid).forEach(x=>x.checked=L.includes(+x.value));compPrev(cid)}
function enterComp(cid){const c=S.comps.find(x=>x.id===cid);if(!c)return;const ids=compSel(cid),ms=ids.map(byId).filter(a=>a&&a.status==='trainee'&&!a.busy);
  {const h=ms.find(dHold);if(h)return toast(`${h.name} đang chừa lịch debut`)}
  {const h=ms.find(a=>{const p=cbHold(a);return p&&abs()+c.wk>p.w});if(h)return toast(`${h.name} đang chừa lịch comeback ${wkLabel(cbHold(h).w)}`)}
  if(ms.length<c.t[0]||ms.length>c.t[1])return toast(`Cần ${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} thực tập sinh`);
  if(S.money<c.fee)return toast('Không đủ tiền lệ phí');S.money-=c.fee;
  const run={id:uid(),c,ids:ms.map(a=>a.id),res:null};S.compRuns=S.compRuns||[];S.compRuns.push(run);
  ms.forEach(a=>a.busy={kind:'comp',title:'Cuộc thi «'+c.n+'»',left:c.wk,total:c.wk,run:run.id});
  S.comps=S.comps.filter(x=>x!==c);addLog(`🏅 ${ms.map(a=>a.name).join(', ')} lên đường dự thi «${c.n}» (${c.wk} tuần, lệ phí ${fmt(c.fee)}).`,'good');act()}
function compDone(a,b){const run=(S.compRuns||[]).find(r=>r.id===b.run);if(!run)return;const c=run.c;
  if(!run.res){const ms=run.ids.map(byId).filter(Boolean),f=ms.reduce((t,x)=>t+fit(x,c.w),0)/Math.max(ms.length,1)*(1+(ms.length>1?chem(run.ids):0)),sc=f+rnd(-8,8);
    let rank=1;for(let j=0;j<7;j++)if(c.lvl+rnd(-12,14)>sc)rank++;const prize=rank<=3?c.prize[rank-1]:0;S.money+=prize;run.res={rank,prize};
    const who=ms.map(x=>x.name).join(', ');
    addLog(rank<=3?`🏅 ${c.ic} ${who} giành hạng ${rank} tại «${c.n}», nhận ${fmt(prize)}!`:`${c.ic} ${who} dừng ở hạng ${rank}/8 tại «${c.n}». Kinh nghiệm quý cho lần sau.`,rank<=3?'gold':'');
    {const m=ms.map(mgrOf).find(Boolean);if(m)mgrExp(m,rank===1?2:1)}}
  const r=run.res,q=r.rank===1?1.4:r.rank<=3?1.15:.9,fg=r.rank===1?R(3000,7000):r.rank<=3?R(1000,3000):R(200,800);a.fans+=fg;a.yr.fans+=fg;
  const les={};for(const k in c.w)les[k]=c.w[k]*3;const ls=applyLesson(a,les,q);
  a.lessons.unshift({t:`Cuộc thi «${c.n}»`,l:r.rank<=3?'Tự tin hơn khi thi đấu':'Học được nhiều từ đối thủ',s:ls,y:S.year});if(a.lessons.length>12)a.lessons.length=12;
  a.mood=clamp(a.mood+(r.rank<=3?12:-4),0,100);a.hist.unshift(`N${S.year}: Cuộc thi «${c.n}» – hạng ${r.rank}`);a.wc=(a.wc||0)+1;
  if(!S.artists.some(x=>x.busy&&x.busy.run===run.id))S.compRuns=S.compRuns.filter(x=>x!==run)}
function compHTML(){const free=S.artists.filter(a=>a.status==='trainee'&&!a.busy),going=S.artists.filter(a=>a.busy&&a.busy.kind==='comp');
  return`<div class="small muted" style="margin-bottom:6px">Chỉ thực tập sinh được dự thi. Top 3 nhận tiền thưởng, ai cũng có thêm fan và bài học theo kỹ năng thi. ${going.length?`Đang thi: <b>${going.map(a=>esc(a.name)).join(', ')}</b>.`:''}</div>`+
  (S.comps.map(c=>{const team=c.t[1]===1?'Thi cá nhân':c.t[0]===c.t[1]?`Đội ${c.t[0]} người`:`Đội ${c.t[0]}–${c.t[1]} người`,L=free.slice().sort((x,y)=>fit(y,c.w)-fit(x,c.w)),multi=c.t[1]>1;
    const list=x=>x.map(a=>{const bt=batchOf(a);return`<label><input type="${multi?'checkbox':'radio'}" name="cp${c.id}" class="cp${c.id}" value="${a.id}" onchange="compPrev(${c.id})"> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">${bt&&S.batches.length>1?esc(bt.n)+' · ':''}điểm kỹ năng ${Math.round(fit(a,c.w))}</span></span></label>`}).join('');
    return`<div class="card"><div class="row"><b>${c.ic} ${esc(c.n)}</b><span class="sp"></span><span class="small muted">hạn đăng ký ${c.exp-abs()} tuần</span></div>
    <div class="small">${team} · ${c.wk} tuần · lệ phí ${fmt(c.fee)} · đối thủ khoảng ${c.lvl} điểm<br>🥇 ${fmt(c.prize[0])} · 🥈 ${fmt(c.prize[1])} · 🥉 ${fmt(c.prize[2])}</div>
    <div class="req">Chấm điểm: ${Object.keys(c.w).map(k=>STATS[k]).join(', ')}</div>
    ${L.length?det('cp-l'+c.id,`Chọn thực tập sinh (${L.length} người rảnh)`,`<div class="list">${list(L)}</div>`,true)+`<div class="row" style="margin-top:6px"><span class="small muted" id="cpo${c.id}" style="flex:1">Chọn ${c.t[0]===c.t[1]?c.t[0]:c.t[0]+'–'+c.t[1]} thực tập sinh</span><button class="btn sm" onclick="compPick(${c.id})">💡 Gợi ý</button><button class="btn sm pri" onclick="enterComp(${c.id})">Đăng ký</button></div>`:'<div class="small muted">Không có thực tập sinh rảnh.</div>'}</div>`}).join('')||'<div class="small muted">Chưa có cuộc thi nào mở đăng ký. Sang tuần mới để xem thêm.</div>')}

/* ---- Giao lưu fan: livestream & fan meeting ---- */
function liveInc(a){return Math.round((a.fans*300+1.2e6)*(1+fame(a)/200)*rnd(.7,1.3)/1e5)*1e5}
function liveEst(ms){return ms.reduce((t,a)=>t+Math.round((a.fans*300+1.2e6)*(1+fame(a)/200)/1e5)*1e5,0)}
function doLive(ids,quiet){const ms=ids.map(byId).filter(Boolean).filter(a=>a.lastLive!==abs());if(!ms.length)return quiet||toast('Tuần này đã livestream');if(S.money<1e6)return quiet||toast('Không đủ tiền');
  S.money-=1e6;let inc=0;for(const a of ms){inc+=liveInc(a);const g=Math.round(a.fans*.01+R(200,800)*(1+fame(a)/60));a.fans+=g;a.yr.fans+=g;a.mood=clamp(a.mood+8,0,100);a.energy=clamp(a.energy-4,0,100);a.lastLive=abs();a.lastFan=abs()}
  S.money+=inc;book('live',inc,ms);addLog(`📱 ${ms.length>3?ms.length+' người':ms.map(a=>a.name).join(', ')} livestream trò chuyện với fan, thu ${fmt(inc)} tiền donate và quảng cáo (chi 1 tr).`,inc>1e6?'good':'');if(!quiet)toast(`Livestream thu ${fmt(inc)}`);
  if(Math.random()<.03){const a=pick(ms);if(!a.scandal&&a.status==='debuted'){a.scandal={t:'Lỡ lời khi livestream',sev:1,left:2,truth:true,dating:false,other:0};pushEv({kind:'scandal',a:a.id},true);addLog(`😬 ${a.name} lỡ lời khi livestream, dân mạng bàn tán.`,'bad')}}
  if(!quiet)act()}
const fmCost=x=>40e6+x.m.length*10e6;
function doFM(k){const x=actByKey(k);if(!x)return;if(!actFree(x))return toast('Đang bận');const ms=campMem(k),tf=ms.reduce((t,a)=>t+a.fans,0);if(tf<10000)return toast('Cần tổng 10K fan');const c=fmCost(x);if(S.money<c)return toast('Không đủ tiền');
  S.money-=c;book('prod',-c);const seats=Math.round(Math.min(tf*.03,8000)*rnd(.8,1.1)),inc=seats*150000;S.money+=inc;book('con',inc,ms);
  for(const a of ms){a.fans=Math.round(a.fans*1.03);a.mood=clamp(a.mood+12,0,100);a.energy=clamp(a.energy-10,0,100);a.lastFan=abs();a.wc=(a.wc||0)+1;a.busy={kind:'concert',title:'Fan meeting',left:1,total:1}}
  S.fmLast=S.fmLast||{};S.fmLast[k]=abs();if(S.fmHint)delete S.fmHint[k];
  addLog(`💝 Fan meeting của ${x.n.slice(2).trim()}: ${fmtN(seats)} fan tham dự, thu ${fmt(inc)} (chi ${fmt(c)}).`,'gold');act()}
function fanSugs(){const now=abs(),L=[];
  for(const x of acts()){if(!actFree(x))continue;const ms=campMem(x.k),tf=ms.reduce((t,a)=>t+a.fans,0),last=(S.fmLast||{})[x.k],gap=last?now-last:99;
    if(tf<10000||gap<16)continue;const why=(S.fmHint||{})[x.k]&&now-S.fmHint[x.k]<=4?'vừa kết thúc quảng bá, cảm ơn fan đúng lúc':ms.some(a=>a.mood<45)?'thành viên đang buồn, gặp fan sẽ vui lên':gap>=99?'chưa từng tổ chức fan meeting':`${gap} tuần chưa gặp fan`;
    L.push({t:'fm',k:x.k,n:x.n,why,est:Math.round(Math.min(tf*.03,8000)),cost:fmCost(x),pri:(S.fmHint||{})[x.k]?3:2})}
  for(const a of S.artists){if(a.status!=='debuted'||a.lastLive===now)continue;const gap=a.lastFan?now-a.lastFan:99;let why='';
    if(a.mood<45)why='tâm trạng thấp, fan động viên sẽ đỡ hơn';else if(a.scandal)why='đang có tin đồn, livestream để giữ fan';else if(gap>=6)why=gap>=99?'chưa từng livestream':`${gap} tuần chưa giao lưu fan`;
    if(why)L.push({t:'live',id:a.id,n:a.name,why,pri:a.mood<45?2.5:1})}
  return L.sort((a,b)=>b.pri-a.pri).slice(0,8)}
function fanHTML(){const L=fanSugs();if(!L.length)return'<div class="small muted">Fan đang được chăm sóc tốt, chưa cần thêm hoạt động.</div>';
  return L.map(f=>f.t==='fm'?`<div class="prow">💝 <b>${esc(f.n)}</b><span class="small">Fan meeting · ~${fmtN(f.est)} chỗ, lãi ~${fmt(f.est*150000-f.cost)}<br><span class="muted">${esc(f.why)}</span></span><span class="sp"></span><button class="btn sm pri" onclick="doFM('${f.k}')">Tổ chức (${fmt(f.cost)})</button></div>`
    :`<div class="prow">📱 <b>${esc(f.n)}</b><span class="small muted">${esc(f.why)}</span><span class="sp"></span><button class="btn sm" onclick="doLive([${f.id}])">Livestream (thu ~${fmt(liveEst([byId(f.id)]))})</button></div>`).join('')}
function viewCamp(k){const x=actByKey(k);if(!x)return closeM();const c=S.camp[k],ms=campMem(k),nm=esc(x.n),free=actFree(x),pl=(S.cbPlan||[]).find(p=>p.k===k);
  const eRow=`<div class="small">⚡ Năng lượng: ${ms.map(a=>`${esc(a.name)} <b class="${a.energy<35?'bad':''}">${Math.round(a.energy)}</b>`).join(' · ')}</div>`;
  let body='';
  if(c&&c.ph==='post'){const u=c.used.wk===abs()?c.used.l:[],rec=postRec(k);
    body=`<div class="grid2"><div class="card small">📈 Hạng hiện tại <b>#${c.rank}</b><br><span class="muted">cao nhất #${c.best}</span></div><div class="card small">🏆 <b>${c.wins}</b> cúp · 🎤 ${c.stages} sân khấu<br><span class="muted">Tuần ${c.wn+1}/${PROMO_WK} · thu ${fmt(c.inc)}</span></div></div>${eRow}
    <h3>Hoạt động tuần này</h3><div class="card">${Object.keys(POST).map(id=>{const P=POST[id],dn=u.includes(id);return`<div class="prow" style="${dn?'opacity:.55':''}">${P.ic} <b>${P.n}</b><span class="small muted">−${P.e}⚡${P.stage?' · cơ hội giành cúp':id==='fansign'?' · bán album':id==='challenge'?' · có thể viral':''}</span><span class="sp"></span>${dn?'<span class="tag m">✓</span>':`<button class="btn sm${rec.includes(id)?' pri':''}" onclick="postDo('${k}','${id}')">Làm</button>`}</div>`}).join('')}</div>
    <div class="card small">🗒️ <b>Thư ký gợi ý:</b> ${rec.length?rec.map(id=>POST[id].n).join(', ')+' (giữ năng lượng trên 30).':'thành viên đã mệt, để họ nghỉ.'} ${rec.length?`<button class="btn sm pri" onclick="postAuto('${k}')">Làm theo gợi ý</button>`:''}</div>
    <label class="small row"><input type="checkbox" ${S.autoPromo!==false?'checked':''} onchange="S.autoPromo=this.checked;save()"> Tuần nào bạn chưa xếp, thư ký tự làm theo gợi ý</label>`}
  else{const rec=free?preRec(k):[],h=c?c.hype:0;
    body=`<div class="card small">🔥 Hype hiện tại <b>${h}</b>/80 — mỗi 4 hype ≈ +1 điểm xếp hạng và thêm fan khi phát hành. Hype giảm dần nếu lâu không comeback.${pl?`<br>📅 Đã hẹn comeback ${wkLabel(pl.w)}.`:''}</div>
    <div class="bar" style="margin:6px 0"><i style="width:${h/.8}%;background:var(--pink)"></i></div>${eRow}
    <h3>Hoạt động trước comeback</h3>${free?`<div class="card">${Object.keys(PRE).map(id=>{const P=PRE[id],dn=c&&c.done[id];return`<div class="prow" style="${dn?'opacity:.55':''}">${P.ic} <b>${P.n}</b><span class="small muted">${P.d} · +${P.h} hype · ${P.c?fmt(P.c):'miễn phí'}${P.e?' · −'+P.e+'⚡':''}</span><span class="sp"></span>${dn?'<span class="tag m">✓</span>':`<button class="btn sm${rec.includes(id)?' pri':''}" onclick="preDo('${k}','${id}')">Làm</button>`}</div>`}).join('')}</div>
    <div class="card small">🗒️ <b>Thư ký gợi ý:</b> ${rec.length?rec.map(id=>PRE[id].n).join(', '):'chưa nên làm thêm (mệt hoặc quỹ thấp)'}. ${rec.length?`<button class="btn sm pri" onclick="preAuto('${k}')">Làm theo gợi ý</button>`:''}</div>
    <div class="row"><button class="btn" onclick="view(viewSec)">🗒️ Kế hoạch comeback</button><span class="sp"></span>${pl?'':`<button class="btn pink" onclick="cbNow('${k}')">Comeback ngay</button>`}</div>`:'<div class="card small muted">Thành viên đang bận. Khi rảnh có thể làm teaser trước comeback.</div>'}`}
  modal(`<h2>📣 Quảng bá: ${nm}</h2><div class="sub">${c&&c.ph==='post'?`Đang quảng bá «${esc(c.t)}». Mỗi tuần chọn sân khấu và hoạt động; ${PROMO_WK} tuần sau khi phát hành.`:'Giai đoạn trước comeback: teaser để tạo hype.'}</div>${body}
  <h3>💬 Giao lưu fan</h3><div class="card">${fanHTML()}</div>`)}
function actByKey(k){return acts().find(x=>x.k===k)}
function releaseSingle(){doSingle($('#sAct').value,$('#sCon').value,+$('#sBud').value,$('#sTitle').value,false,+($('#sSong')?.value||0))}
function doSingle(ak,ck,bud,title,silent,sid){
  title=(title||pick(SONGS)).trim().slice(0,40);
  const A=actByKey(ak);if(!A){if(!silent)toast('Chọn nghệ sĩ');return false}
  if(gHiatus(ak)){if(!silent)toast('Nhóm đang tạm ngừng hoạt động');return false}
  const sg=sid?(S.songs||[]).find(x=>x.id===sid&&x.st==='ok'):null;if(sg){ck=sg.ck;title=sg.t}
  const mem=A.m.map(byId).filter(Boolean);
  if(mem.some(a=>a.busy)){if(!silent)toast('Có thành viên đang bận');return false}
  if(S.money<bud){if(!silent)toast('Không đủ tiền');return false}
  S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!==ak);
  S.money-=bud;book('prod',-bud);
  const w=CONCEPTS[ck].w,ft=mem.reduce((s,a)=>s+fit(a,w),0)/mem.length,fm=mem.reduce((s,a)=>s+fame(a),0)/mem.length;
  const h=harmony(A.m),bb=bud>=200e6?16:bud>=80e6?8:0;
  const pc=S.camp[ak],hp=pc&&pc.ph==='pre'?pc.hype:0;
  const tb=trendB(ck),rp=rivalPress(),score=ft*.6+fm*.3+bb+R(0,20)+h+tb-rp+hp*.25+sgBonus(sg,A.m);
  const rank=clamp(Math.round(118-score),1,100);
  const sales=Math.round(Math.pow(101-rank,1.8)*30*(1+fm/100));
  const inc=sales*5000;S.money+=inc;book('sgl',inc,mem);
  for(const a of mem){const g=Math.round((101-rank)*R(60,130)*(1+fm/100)*(1+hp/100));a.fans+=g;a.yr.fans+=g;a.busy={kind:'promo',title:'Quảng bá «'+title+'»',left:PROMO_WK,total:PROMO_WK};a.mood=clamp(a.mood+5,0,100);a.hist.unshift(`N${S.year}: Single «${title}» – hạng ${rank}`);a.wc=(a.wc||0)+1}
  {const ms=new Set(mem.map(mgrOf).filter(Boolean));ms.forEach(m=>mgrExp(m))}
  S.singles.unshift({title,act:A.n,m:A.m,rank,y:S.year,concept:CONCEPTS[ck].n,k:ak,w:abs(),dig:Math.round(inc*.08/1e4)*1e4,dk:rank<=10?.93:rank<=40?.9:.86,dt:0,roy:sg?0:.15,sg:sg?sg.id:0});
  if(sg){sg.st='used';sg.rank=rank;sg.act=A.n;const ws=sg.by.map(byId).filter(Boolean);ws.forEach(a=>{const g=Math.round((101-rank)*R(20,50));a.fans+=g;a.yr.fans+=g;MOOD(a,10);a.hist.unshift(`N${S.year}: Sáng tác «${title}» – hạng ${rank}`)});addLog(`✍️ «${title}» do ${ws.map(a=>a.name).join(', ')} sáng tác, công ty giữ trọn doanh thu nhạc số.`,'good')}
  addLog(`💿 Single «${title}» của ${A.n.slice(2).trim()} (${CONCEPTS[ck].n}) đạt hạng ${rank}! Doanh thu ${fmt(inc)}.${tb>0?' 🔥 Hợp xu hướng.':tb<0?' ❄️ Concept đã hết thời.':''}${rp?' ⚔️ Bị đối thủ cạnh tranh.':''}${h<0?' Mâu thuẫn nội bộ kéo điểm xuống.':''}`,rank<=10?'gold':'good');
  if(hp)addLog(`📣 Hype ${hp} từ hoạt động teaser giúp «${title}» ra mắt mạnh hơn.`,'good');
  S.camp[ak]={k:ak,n:A.n,ph:'post',t:title,ck,rank,best:rank,wins:0,stages:0,wn:0,used:{wk:abs(),l:[]},hype:hp,inc:0};
  if(!silent)act();return true;
}
function holdConcert(k){
  const A=actByKey(k||$('#cAct').value);if(!A)return toast('Chọn nghệ sĩ');
  const mem=A.m.map(byId).filter(Boolean),tf=mem.reduce((s,a)=>s+a.fans,0);
  if(tf<30000)return toast('Cần tổng 30K fan');
  if(mem.some(a=>a.busy))return toast('Có thành viên đang bận');
  if(gHiatus(A.k))return toast('Nhóm đang tạm ngừng hoạt động');
  if(S.money<200e6)return toast('Không đủ 200 tr');
  S.money-=200e6;book('prod',-200e6);
  const aud=Math.round(Math.min(tf*.04*rnd(.8,1.2),60000)),inc=aud*500000;S.money+=inc;book('con',inc,mem);
  for(const a of mem){a.fans=Math.round(a.fans*1.08);a.mood=clamp(a.mood+10,0,100);a.energy=clamp(a.energy-25,0,100);a.busy={kind:'concert',title:'Concert',left:1,total:1}}
  S.concerts.push({act:A.n,aud,y:S.year,m:A.m,k:A.k,w:abs()});
  addLog(`🏟️ Concert của ${A.n.slice(2).trim()}: ${fmtN(aud)} khán giả, doanh thu ${fmt(inc)}.`,'gold');act();
}
function produceFilm(){
  const genre=$('#fGen').value,bud=+$('#fBud').value,title=($('#fTitle').value||pick(FT1)+' '+pick(FT2)).trim().slice(0,40);
  const cast=[...document.querySelectorAll('.fcast:checked')].map(x=>+x.value);
  if(!cast.length)return toast('Chọn ít nhất 1 diễn viên');
  if(cast.length>3)return toast('Tối đa 3 vai chính');
  if(S.money<bud)return toast('Không đủ tiền');
  S.money-=bud;book('prod',-bud);
  const f={id:uid(),title,genre,own:true,budget:bud,share:1,cost:bud,cast,status:'Đang quay',releaseAt:0,done:false,y:S.year};
  S.films.push(f);
  for(const id of cast){const a=byId(id);a.busy={kind:'shoot',filmId:f.id,title,left:8,total:8}}
  addLog(`🎬 Khởi quay phim ${GENRES[genre].n} «${title}», kinh phí ${fmt(bud)}.`,'gold');act();
}
const GNAMES=['Lumina','Nova','Seraph','Velvet Moon','StarPop','Aurora','Mirage','Sunday Club','Prism','Crimson','Blossom','Eclipse','Halo','Neon Tide','Petal Nine','Orbit'];
const tagScore=(p,c)=>{const t=p.tag[c.id];return t==='friend'?3:t==='dating'||t==='public'?1:t==='enemy'?-6:0};
const avgFit=(ms,w)=>ms.reduce((s,a)=>s+fit(a,w),0)/ms.length;
function bestLineup(pool,w){
  const sorted=pool.slice().sort((a,b)=>fit(b,w)-fit(a,w));let best=null;
  for(let n=2;n<=Math.min(5,sorted.length);n++){
    const pk=[sorted[0]];
    while(pk.length<n){let bc=null,bs=-1e9;for(const c of sorted){if(pk.includes(c))continue;const s=fit(c,w)+pk.reduce((t,p)=>t+tagScore(p,c),0)*3;if(s>bs){bs=s;bc=c}}pk.push(bc)}
    const ids=pk.map(a=>a.id),f=avgFit(pk,w),hm=harmony(ids),sc=f+hm*1.5+n*2;
    if(!best||sc>best.sc)best={ids,f,hm,sc,n};
  }
  return best;
}
function roleTags(ms){const r={},add=(a,t)=>(r[a.id]=r[a.id]||[]).push(t),top=k=>ms.reduce((m,x)=>x.st[k]>m.st[k]?x:m);
  add(top('vocal'),'Main Vocal');add(top('dance'),'Main Dancer');const rp=top('rap');if(rp.st.rap>=20)add(rp,'Rapper');add(top('visual'),'Visual');
  add(ms.reduce((m,x)=>(x.st.variety+x.mood/2)>(m.st.variety+m.mood/2)?x:m),'Leader');
  add(ms.reduce((m,x)=>(x.st.visual+x.st.dance+fame(x))>(m.st.visual+m.st.dance+fame(m))?x:m),'Center');return r}
const bestOf=(a,tbl)=>Object.keys(tbl).map(k=>({k,f:fit(a,tbl[k].w)})).sort((x,y)=>y.f-x.f);
function fitRows(rows,tbl){const mx=rows[0].f;return`<div class="cfit">${rows.map(r=>`<span class="${r.f===mx?'best':''}">${r.f===mx?'⭐ ':''}${tbl[r.k].n}</span><div class="bar"><i style="width:${r.f}%"></i></div><b>${Math.round(r.f)}%</b>`).join('')}</div>`}
function debutAnalysis(){
  const t=$('#dType').value,ids=[...document.querySelectorAll('.dsel:checked')].map(x=>+x.value),sel=ids.map(byId).filter(Boolean);
  if(t==='group'){
    if(sel.length<2)return'<div class="small muted">Chọn từ 2 người (hoặc bấm một đội hình gợi ý) để xem nhóm hợp concept nào.</div>';
    const rows=Object.keys(CONCEPTS).map(k=>({k,f:avgFit(sel,CONCEPTS[k].w)})).sort((a,b)=>b.f-a.f),hm=harmony(ids),roles=roleTags(sel);
    const enem=[];for(let i=0;i<sel.length;i++)for(let j=i+1;j<sel.length;j++)if(sel[i].tag[sel[j].id]==='enemy')enem.push(sel[i].name+' & '+sel[j].name);
    return`<b>Đội hình đang chọn (${sel.length} người)</b> · hòa hợp <b class="${hm<0?'bad':'good'}">${hm>=0?'+':''}${hm}</b>${enem.length?` · <span class="bad">⚠️ mâu thuẫn: ${esc(enem.join(', '))}</span>`:''}
    ${fitRows(rows,CONCEPTS)}<div class="small">👉 Hợp nhất với concept <b>${CONCEPTS[rows[0].k].n}</b>${rows[0].f-rows[1].f<3?`, gần bằng ${CONCEPTS[rows[1].k].n}`:''}.</div>
    <div class="small" style="margin-top:6px"><b>Vị trí gợi ý:</b><br>${sel.map(a=>`${esc(a.name)}: ${(roles[a.id]||['Thành viên']).join(', ')}`).join('<br>')}</div>`;
  }
  if(!sel.length)return'<div class="small muted">Chọn một người để xem phân tích.</div>';
  const a=sel[0],rc=debutRec(a),cmp=a.status==='trainee'?`<div class="small" style="margin-top:6px">🎯 Đề xuất chung: <b>${rc.t==='wait'?'chưa nên debut':DR[rc.t]}</b>${rc.t!==t&&rc.t!=='wait'?' <span class="bad">(khác lựa chọn hiện tại)</span>':''}</div>`:'';
  if(t==='solo')return`<b>${esc(a.name)} khi ra solo</b>${fitRows(bestOf(a,CONCEPTS),CONCEPTS)}<div class="small">👉 Nên ra mắt với concept <b>${CONCEPTS[bestOf(a,CONCEPTS)[0].k].n}</b>.</div>`+cmp;
  if(t==='actor')return`<b>${esc(a.name)} khi làm diễn viên</b> · Diễn xuất ${Math.round(a.st.acting)}${fitRows(bestOf(a,GENRES),GENRES)}<div class="small">👉 Hợp nhất thể loại <b>${GENRES[bestOf(a,GENRES)[0].k].n}</b>.</div>`+cmp;
  if(t==='solo')return`<b>${esc(a.name)} khi ra solo</b>${fitRows(bestOf(a,CONCEPTS),CONCEPTS)}<div class="small">👉 Nên ra mắt với concept <b>${CONCEPTS[bestOf(a,CONCEPTS)[0].k].n}</b>.</div>`;
  return`<b>${esc(a.name)} khi làm diễn viên</b> · Diễn xuất ${Math.round(a.st.acting)}${fitRows(bestOf(a,GENRES),GENRES)}<div class="small">👉 Hợp nhất thể loại <b>${GENRES[bestOf(a,GENRES)[0].k].n}</b>${a.st.acting<25?'. Diễn xuất còn yếu, nên tập thêm ở Phòng Diễn xuất trước khi debut':''}.</div>`;
}
const DR={group:'👥 Nhóm nhạc',solo:'🎤 Solo',actor:'🎬 Diễn viên'},DRT={group:'nhóm nhạc',solo:'solo',actor:'diễn viên'};
function lineupWith(a,pool,w){const others=pool.filter(x=>x!==a);if(!others.length)return null;let best=null;
  for(let n=2;n<=Math.min(5,others.length+1);n++){const pk=[a];while(pk.length<n){let bc=null,bs=-1e9;for(const c of others){if(pk.includes(c))continue;const sc=fit(c,w)+pk.reduce((t,p)=>t+tagScore(p,c),0)*3;if(sc>bs){bs=sc;bc=c}}pk.push(bc)}
    const ids=pk.map(x=>x.id),f=avgFit(pk,w),hm=harmony(ids),sc=f+hm*1.5+n*2;if(!best||sc>best.sc)best={ids,f,hm,sc}}return best}
const DEBUT_MIN=50;
function debutRec(a){
  const so=bestOf(a,CONCEPTS)[0],ac=bestOf(a,GENRES)[0],music=Math.max(a.st.vocal,a.st.dance,a.st.rap);
  const soloS=so.f*.85+music*.25+(a.st.visual>=50?3:0)-(a.mood<30?5:0);
  const actS=ac.f*.9+(a.st.acting-(a.st.vocal+a.st.dance)/2)*.3;
  const pool=S.artists.filter(x=>x.status==='trainee'&&!x.busy&&!groupsOf(x).length);
  let grp=null,gk=null;if(a.status==='trainee')for(const k in CONCEPTS){const l=lineupWith(a,pool,CONCEPTS[k].w);if(l&&(!grp||l.sc>grp.sc)){grp=l;gk=k}}
  const grpS=grp?grp.f+grp.hm*1.5+6:-99;
  const sc={solo:Math.round(soloS),actor:Math.round(actS),group:grp?Math.round(grpS):null};
  let t='solo';if(actS>soloS)t='actor';if(grpS>Math.max(soloS,actS))t='group';
  const r={t,sc,k:t==='group'?gk:t==='solo'?so.k:ac.k,ids:grp?grp.ids:[a.id],f:t==='group'?grp.f:t==='solo'?so.f:ac.f};
  const lbl=t==='actor'?GENRES[r.k].n:CONCEPTS[r.k].n;
  if(t==='group'){const mates=grp.ids.filter(i=>i!==a.id).map(i=>byId(i).name);r.why=`Hợp nhất khi debut cùng ${mates.join(', ')}, concept ${lbl} ${Math.round(grp.f)}%${grp.hm>0?', nhóm hòa hợp':''}. Kỹ năng bổ trợ nhau tốt hơn đứng một mình.`}
  else if(t==='solo')r.why=`${STATS[['vocal','dance','rap'].reduce((m,k)=>a.st[k]>a.st[m]?k:m,'vocal')]} ${Math.round(music)} đủ nổi bật để đứng sân khấu một mình, hợp concept ${lbl} ${Math.round(so.f)}%.`;
  else r.why=`Diễn xuất ${Math.round(a.st.acting)} mạnh hơn kỹ năng âm nhạc, hợp phim ${lbl} ${Math.round(ac.f)}%.`;
  r.short=`nên debut ${DRT[t]} · ${lbl} ${Math.round(r.f)}%`;
  if(a.status==='trainee'&&r.f<=DEBUT_MIN){const W=t==='actor'?GENRES[r.k].w:CONCEPTS[r.k].w,k=Object.keys(W).reduce((m,x)=>W[x]*(100-a.st[x])>W[m]*(100-a.st[m])?x:m);
    r.best=t;r.t='wait';r.why=`Độ phù hợp mới ${Math.round(r.f)}% (cần trên ${DEBUT_MIN}%). Tập thêm ${STATS[k]} rồi debut ${DRT[t]} (${lbl}).`;r.short=`chưa đủ điểm (${Math.round(r.f)}/${DEBUT_MIN})`}
  return r;
}
function recLine(a){const r=debutRec(a);const s=r.sc;return`<div class="prow"><b>${esc(a.name)}</b><span class="small">${r.t==='wait'?'⏳ Chưa nên debut':`<b>${DR[r.t]}</b>`}<br><span class="muted">${esc(r.why)}</span><br><span class="muted">Phù hợp ${Math.round(r.f)}% / cần trên ${DEBUT_MIN}% · Điểm: Solo ${s.solo} · Diễn viên ${s.actor}${s.group!=null?' · Nhóm '+s.group:''}</span></span><span class="sp"></span>${r.t==='wait'?'':`<button class="btn sm pri" onclick="applyRec(${a.id})">Áp dụng</button>`}</div>`}
function applyRec(id){const a=byId(id);if(!a)return;const r=debutRec(a);if(r.t==='wait')return;$('#dType').value=r.t;$('#dType').onchange();
  if(r.t==='group')applyLineup(r.ids);else{const x=[...document.querySelectorAll('.dsel')].find(e=>+e.value===id);if(x){x.checked=true;x.onchange&&x.onchange()}}
  $('#dAna')?.scrollIntoView({behavior:'smooth',block:'center'})}
function applyLineup(ids){document.querySelectorAll('.dsel').forEach(x=>x.checked=ids.includes(+x.value));if(!$('#dName').value)$('#dName').value=pick(GNAMES.filter(n=>!S.groups.some(g=>g.name===n)).concat(['Starlight '+R(2,9)]));document.querySelectorAll('.dsel')[0]?.onchange?.()}
const DEBUT_COST={group:n=>120e6+n*20e6,solo:()=>80e6,actor:()=>50e6};
function debut(){const type=$('#dType').value,ids=[...document.querySelectorAll('.dsel:checked')].map(x=>+x.value);debutIds(type,ids,type==='group'?($('#dName').value||''):'')}
function debutIds(type,ids,name){
  const cost=DEBUT_COST[type](ids.length);
  if(type==='group'&&ids.length<2){toast('Nhóm cần ít nhất 2 người');return false}
  if(type!=='group'&&ids.length!==1){toast('Chọn đúng 1 người');return false}
  if(S.money<cost){toast('Không đủ tiền');return false}
  const mem=ids.map(byId);if(mem.some(a=>!a||a.busy)){toast('Có người đang bận');return false}
  name=type==='group'?String(name||'').trim().slice(0,24):'';
  if(type==='group'&&!name){toast('Đặt tên nhóm');return false}
  S.money-=cost;book('prod',-cost);
  for(const a of mem){
    if(a.status==='trainee'){a.status='debuted';a.debutYear=S.year;a.salary=Math.max(a.salary,4e6);a.ce=abs()+CT_WK;a.cs0=abs();a.earnC=0;a.dReady=0}
    const g=R(2000,7000)*(type==='actor'?.5:1);a.fans+=g;a.yr.fans+=g;a.mood=clamp(a.mood+15,0,100);if(a.cf0==null||a.cs0===abs())a.cf0=a.fans;
    if(a.mt){const mt=byId(a.mt);if(mt){const b=Math.round(g*.3)+500;mt.fans+=b;MOOD(mt,10);setRel(a,mt,getRel(a,mt)+10);addLog(`👩‍🏫 Tiền bối ${mt.name} tự hào khi đàn em ${a.name} debut (+${fmtN(b)} fan).`,'good')}a.mtd=a.mt;a.mt=0}
    if(type==='solo'){if(groupsOf(a).length)givePM(a);a.solo=true}if(type==='actor')a.actor=true;
    if(type!=='actor')a.busy={kind:'promo',title:'Showcase debut',left:2,total:2};
  }
  if(type==='group'){const ck=Object.keys(CONCEPTS).sort((x,y)=>avgFit(mem,CONCEPTS[y].w)-avgFit(mem,CONCEPTS[x].w))[0];S.groups.push({id:uid(),name,members:ids,y:S.year,concept:ck});addLog(`🎊 Nhóm ${name} chính thức debut với ${ids.length} thành viên, hợp nhất concept ${CONCEPTS[ck].n}!`,'gold')}
  else addLog(`🎊 ${mem[0].name} debut ${type==='solo'?'solo':'diễn viên'}!`,'gold');
  act();return true;
}
function sign(id){const a=S.pool.find(x=>x.id===id);if(!a)return;if(S.money<20e6)return toast('Không đủ 20 tr');S.money-=20e6;book('hr',-20e6);S.pool=S.pool.filter(x=>x!==a);a.batch=ensureCurBatch();S.artists.push(a);addLog(`✍️ Ký hợp đồng thực tập sinh ${a.name} vào ${(S.batches.find(b=>b.id===a.batch)||{n:'lứa mới'}).n}.`,'good');act()}
function recast(){if(S.money<10e6)return toast('Không đủ tiền');S.money-=10e6;book('hr',-10e6);genPool(poolSize());act()}
function setSched(id,v){const a=byId(id);if(a){a.days=a.days.some(k=>k!=='rest')?a.days.map(k=>k==='rest'?'rest':v):defaultDays(v);act()}}
function setAll(v){if(!v)return;S.artists.forEach(a=>a.days=defaultDays(v));act()}
function fire(id,btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent='Chạm lần nữa để xác nhận';return}const a=byId(id);if(a){removeArtist(a,'đã chấm dứt hợp đồng');closeM();act()}}
function resetGame(btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent='Chạm lần nữa: xoá toàn bộ dữ liệu';return}newGame();closeM();act()}

/* ================= AWARDS ================= */
function awards(){
  const y=S.year,A=S.artists,res=[],gr=1+.35*(y-1);
  const best=(arr,f)=>arr.reduce((m,a)=>!m||f(a)>f(m)?a:m,null);
  const give=(cat,names,ok,ids,note)=>{res.push({cat,names,ok,note});if(ok)for(const id of ids){const a=byId(id);if(a){a.fans=Math.round(a.fans*1.15)+5000;a.mood=clamp(a.mood+15,0,100);a.hist.unshift(`N${y}: 🏆 ${cat}`)}};if(ok)S.money+=30e6};
  let c=best(A.filter(a=>a.status==='debuted'),a=>a.yr.fans);
  if(c)give('Nghệ sĩ của năm',c.name,c.yr.fans>=120000*gr*rnd(.7,1.2),[c.id],`+${fmtN(c.yr.fans)} fan trong năm`);
  c=best(A.filter(a=>a.debutYear===y),a=>a.yr.fans);
  if(c)give('Tân binh của năm',c.name,c.yr.fans>=25000*rnd(.7,1.3),[c.id],`+${fmtN(c.yr.fans)} fan`);
  const sg=S.singles.filter(s=>s.y===y).sort((a,b)=>a.rank-b.rank)[0];
  if(sg)give('Bài hát của năm',`«${sg.title}» – ${sg.act.slice(2)}`,sg.rank<=R(1,7),sg.m,`hạng cao nhất ${sg.rank}`);
  for(const [g,lab] of [['M','Nam'],['F','Nữ']]){c=best(A.filter(a=>a.g===g&&a.yr.actQ>0),a=>a.yr.actQ);if(c)give(`${lab} diễn viên xuất sắc`,c.name,c.yr.actQ>=clamp(42+y*4,0,88)+R(-8,8),[c.id],`điểm diễn ${c.yr.actQ}`)}
  c=best(A.filter(a=>a.yr.variety>0),a=>a.yr.variety*10+a.st.variety);
  if(c)give('Ngôi sao tạp kỹ',c.name,c.yr.variety>=3&&c.st.variety>=30+y*3+R(-5,5),[c.id],`${c.yr.variety} show`);
  const fb=S.films.filter(f=>f.done&&f.y===y).sort((a,b)=>b.mult-a.mult)[0];
  if(fb)give('Phim của năm',`«${fb.title}»`,fb.mult>=2+rnd(-.3,.3),fb.cast,`x${fb.mult} doanh thu`);
  const cc=S.concerts.filter(x=>x.y===y).sort((a,b)=>b.aud-a.aud)[0];
  if(cc)give('Concert của năm',cc.act.slice(2),cc.aud>=4000*gr*rnd(.7,1.3),cc.m,`${fmtN(cc.aud)} khán giả`);
  const total=S.artists.reduce((s,a)=>s+a.fans,0);
  const board=S.rivals.map(r=>({n:r.n,f:r.fans})).concat([{n:'⭐ Starlight Ent. (bạn)',f:total,me:1}]).sort((a,b)=>b.f-a.f);
  const rank=board.findIndex(x=>x.me)+1;
  const entry={y,res,board,rank};S.awards.push(entry);
  addLog(`🏆 Lễ trao giải năm ${y}: thắng ${res.filter(r=>r.ok).length}/${res.length} hạng mục. Công ty xếp hạng ${rank}/${board.length}.`,'gold');
  for(const a of A)a.yr=newYr();S.rivals.forEach(r=>r.f0=r.fans);
  awardToShow=entry;
}

/* ================= RENDER: BUILDING ================= */
function chibiHTML(a,extra=''){
  const L=a.look,st=L.style||(L.long?'long':'short'),c=L.hair;
  const back=st==='long'?`<div class="hb" style="background:${c}"></div>`:st==='twin'?`<div class="tw l" style="background:${c}"></div><div class="tw r" style="background:${c}"></div>`:st==='pony'?`<div class="po" style="background:${c}"></div>`:st==='bun'?`<div class="bn" style="background:${c}"></div>`:'';
  const ar=`--o:${L.out};--s:${L.skin}`;
  return`<div class="cw"><div class="cb"><div class="shd"></div>${back}<div class="lg l"></div><div class="lg r"></div>${L.skirt?`<div class="sk" style="background:${L.out}"></div>`:''}<div class="ar l" style="${ar}"></div><div class="ar r" style="${ar}"></div><div class="bd" style="background:${L.out}"><i></i></div><div class="hd" style="background:${L.skin}"><div class="hf${st==='spiky'?' spk':''}" style="background:${c}"></div><i class="e l"></i><i class="e r"></i><i class="bl l"></i><i class="bl r"></i><i class="mo"></i></div></div></div>${extra}`;
}
const blinkD=id=>`--d:-${(String(id).split('').reduce((s,ch)=>s+ch.charCodeAt(0),0)%50)/10}s`;
const PROPS={
  ceo:`<i class="win" style="left:38%"></i><i class="desk" style="right:8%;width:40%"></i><i class="pp" style="right:20%;bottom:37px;font-size:17px">🖥️</i><i class="pp" style="left:8px;bottom:22px;font-size:26px">🪴</i><i class="pp" style="left:14%;top:38px;font-size:16px">🏆</i>`,
  meet:`<i class="board" style="left:24%;width:44%">📊</i><i class="desk" style="left:14%;width:72%"></i><i class="pp" style="left:28%;bottom:37px;font-size:13px">☕</i><i class="pp" style="right:24%;bottom:37px;font-size:13px">📄</i>`,
  studio:`<i class="booth"></i><i class="pp" style="right:15%;bottom:24px;font-size:24px">🎙️</i><i class="desk" style="left:6%;width:38%"></i><i class="pp" style="left:12%;bottom:37px;font-size:18px">🎚️</i><i class="pp" style="left:12%;top:36px;font-size:16px">🎧</i>`,
  acting:`<i class="curtain" style="left:0"></i><i class="curtain" style="right:0"></i><i class="pp" style="right:20px;bottom:22px;font-size:26px">🎥</i><i class="pp" style="left:22px;top:30px;font-size:18px">💡</i><i class="pp" style="left:46%;top:36px;font-size:16px">🎬</i>`,
  vocal:`<i class="pp" style="left:6px;bottom:20px;font-size:32px">🎹</i><i class="pp" style="left:40%;top:36px;font-size:18px">🎼</i><i class="pp" style="right:12px;bottom:22px;font-size:24px">🎤</i>`,
  dance:`<i class="mirror"></i><i class="pp" style="left:48%;top:26px;font-size:18px">🪩</i><i class="pp" style="right:6px;bottom:22px;font-size:22px">🔊</i>`,
  gym:`<i class="pp" style="left:8px;bottom:22px;font-size:26px">🏋️</i><i class="desk" style="right:6%;width:30%"></i><i class="pp" style="right:12%;bottom:37px;font-size:16px">💄</i><i class="pp" style="left:42%;top:36px;font-size:16px">🪞</i>`,
  pr:`<i class="board" style="left:30%;width:36%;background:#222;border-color:#555">📺</i><i class="pp" style="left:8px;top:38px;font-size:16px">📰</i><i class="pp" style="right:10px;bottom:22px;font-size:22px">📷</i>`,
  lobby:`<i class="pp" style="left:40%;top:30px;font-size:30px;opacity:.35">⭐</i><i class="desk" style="left:6%;width:34%;height:22px"></i><i class="pp" style="left:18%;bottom:44px;font-size:13px">🛎️</i><i class="pp" style="right:8px;bottom:22px;font-size:26px">🪴</i>`,
  dorm:`<i class="win" style="left:44%;background:linear-gradient(#2b2f6b,#6b5ca8)"></i><i class="pp" style="left:47%;top:38px;font-size:14px">🌙</i><i class="bed" style="left:6px"></i><i class="bed" style="right:6px"></i><i class="pp" style="left:22px;bottom:36px;font-size:13px">🧸</i>`,
  mgr:`<i class="board" style="left:36%;width:30%">📋</i><i class="desk" style="left:6%;width:28%"></i><i class="desk" style="right:6%;width:28%"></i><i class="pp" style="left:12%;bottom:37px;font-size:15px">💻</i><i class="pp" style="right:12%;bottom:37px;font-size:15px">💻</i>`,
  invest:`<i class="desk" style="left:8%;width:40%"></i><i class="pp" style="left:16%;bottom:37px;font-size:16px">💹</i><i class="pp" style="right:10%;bottom:22px;font-size:26px">🏦</i><i class="pp" style="left:46%;top:34px;font-size:18px">💰</i>`,
  market:`<i class="board" style="left:24%;width:50%">📊</i><i class="pp" style="left:8px;bottom:22px;font-size:22px">🗞️</i><i class="pp" style="right:10px;bottom:22px;font-size:22px">🔭</i>`,
  sales:`<i class="board" style="left:30%;width:40%">📈</i><i class="desk" style="left:6%;width:30%"></i><i class="pp" style="left:12%;bottom:37px;font-size:15px">🧮</i><i class="pp" style="right:10px;bottom:22px;font-size:24px">💹</i>`,
  hr:`<i class="desk" style="right:8%;width:36%"></i><i class="pp" style="right:18%;bottom:37px;font-size:15px">📄</i><i class="pp" style="left:10px;bottom:22px;font-size:26px">🗄️</i><i class="pp" style="left:42%;top:34px;font-size:16px">🤝</i>`,
  roof:`<i class="city"></i><i class="fence"></i><i class="pp" style="left:12%;bottom:22px;font-size:30px">⛱️</i><i class="pp" style="right:8px;bottom:22px;font-size:22px">🪴</i><i class="pp" style="left:34%;bottom:24px;font-size:14px">🍹</i>`
};
function roomOf(a){if(a.busy)return null;const k=a.days?a.days[0]:a.sched;if(k==='rest')return['lobby','roof','dorm'][a.id%3];return TRAIN[k].room}
function mgrRoom(m){if(!m.as)return'mgr';for(const a of mgrTargets(m)){const r=roomOf(a);if(r)return r}return null}
const NPC=[{id:'n1',room:'ceo',name:'Bạn (GĐ)',look:{hair:'#2b2233',skin:'#f8d0b0',out:'#333a56',style:'short'}},{id:'n2',room:'meet',name:'🗒️ Thư ký',look:{hair:'#5a3825',skin:'#ffe0c7',out:'#e9e9f2',style:'bun',skirt:true}},{id:'n3',room:'lobby',name:'Lễ tân',look:{hair:'#c98b4b',skin:'#eebf98',out:'#16b98f',style:'pony',skirt:true}},{id:'n4',room:'studio',name:'🎼 GĐ Âm nhạc',look:{hair:'#1d1d2b',skin:'#eebf98',out:'#9b5de5',style:'spiky'}}];
function roomBadge(id){
  if(id==='meet'){const n=S.offers.length+S.events.length;return n?`<span class="badge">${n}</span>`:''}
  if(id==='pr'){const n=S.artists.filter(a=>a.scandal).length,p=prPlans().length;return n?`<span class="badge">${n}🚨</span>`:p?`<span class="badge" style="background:var(--violet)">${p} 📣</span>`:''}
  if(id==='mgr'){const n=S.managers.filter(m=>!m.as).length;return n?`<span class="badge" style="background:var(--violet)">${n} rảnh</span>`:''}
  if(id==='studio'){const n=(S.songs||[]).filter(s=>s.st==='review').length;return n?`<span class="badge" style="background:var(--violet)">${n} 🎼</span>`:''}
  if(id==='hr'){const n=S.artists.filter(a=>a.status==='debuted'&&a.ce&&a.ce-abs()<=8&&!a.ceNo).length;return n?`<span class="badge">${n} 📄</span>`:''}
  if(id==='sales'){const n=S.singles.filter(s=>s.dig&&!s.end).length;return n?`<span class="badge" style="background:var(--mint)">${n} 🎧</span>`:''}
  if(id==='invest'){const n=(S.biz||[]).length;return n?`<span class="badge" style="background:var(--mint)">${n}</span>`:''}
  if(id==='market'){const n=(S.rivals||[]).filter(r=>r.cb&&r.cb.w>=abs()-1).length;return n?`<span class="badge">⚔️${n}</span>`:''}
  if(id==='lobby'){const n=S.artists.filter(a=>a.status==='trainee').length,c=(S.comps||[]).length;return n?`<span class="badge" style="background:var(--violet)">${n} TTS${c?' · 🏅'+c:''}</span>`:''}
  return'';
}
function renderBuilding(){
  let h='<div class="shaft"><i class="car"></i></div>';
  for(let f=Math.max(...ROOMS.map(r=>r.f));f>=1;f--){
    h+=`<div class="floor"><span class="fno">${f}F</span>`;
    for(const r of ROOMS.filter(x=>x.f===f)){
      let ch='';
      for(const n of NPC.filter(x=>x.room===r.id)){const p=pos[n.id]??=R(15,80);ch+=`<div class="chibi npc" data-id="${n.id}" style="left:${p}%;${blinkD(n.id)}"${n.id==='n2'?` onclick="event.stopPropagation();view(viewSec)"`:n.id==='n4'?` onclick="event.stopPropagation();view(viewSongs)"`:''}>${chibiHTML(n,`<div class="nm"><span>${n.name}</span></div>`)}</div>`}
      for(const m of S.managers.filter(x=>mgrRoom(x)===r.id)){const k='m'+m.id,p=pos[k]??=R(10,88);ch+=`<div class="chibi npc" data-id="${k}" style="left:${p}%;${blinkD(k)}" onclick="event.stopPropagation();openRoom('mgr')">${chibiHTML(m,`<div class="nm"><span>📋${esc(m.name.split(' ').pop())}</span></div>`)}</div>`}
      for(const a of S.artists.filter(x=>roomOf(x)===r.id)){
        const p=pos[a.id]??=R(10,88);
        const bub=a.scandal?'🚨':a.mood<30?'💢':a.energy<25?'💤':(datingPartner(a)?'💗':'');
        ch+=`<div class="chibi" data-id="${a.id}" style="left:${p}%;${blinkD(a.id)}" onclick="event.stopPropagation();view(()=>viewArtist(${a.id}))" title="${esc(a.name)}">${chibiHTML(a,`<div class="nm"><span>${esc(a.name)}</span></div>${bub?`<span class="bub">${bub}</span>`:''}`)}</div>`;
      }
      h+=`<button class="room" style="--rc:var(--r-${r.id})" onclick="openRoom('${r.id}')" aria-label="${r.n}" title="${r.n}: ${r.s}"><span class="rl"><span class="ri">${r.ic}</span>${r.n}</span>${PROPS[r.id]||''}${roomBadge(r.id)}${ch}</button>`;
    }
    h+='</div>';
  }
  $('#facade').innerHTML=h;
}
setInterval(()=>{
  document.querySelectorAll('.chibi').forEach(el=>{
    if(Math.random()<.45){
      const id=el.dataset.id,old=pos[id]??50,nw=clamp(old+R(-35,35),8,90);
      pos[id]=nw;el.classList.toggle('flip',nw<old);el.classList.add('walk');el.style.left=nw+'%';
      clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('walk'),2200);
    }
  });
},2600);

function renderTop(){
  $('#money').textContent=fmt(S.money).replace(' ','');$('#money').classList.toggle('neg',S.money<0);
  $('#date').innerHTML=`<small>Tuần</small>${S.week}`;$('#yearL').textContent=`Năm ${S.year}`;$('#nextBtn').textContent=`Kết thúc tuần ${S.week}`;
  const tf=S.artists.reduce((s,a)=>s+a.fans,0);
  $('#fansP').textContent=`💗 ${fmtN(tf)} fan`;$('#artN').textContent=`${S.artists.length} nghệ sĩ`;
  const n=S.events.length;$('#evn').hidden=!n;$('#evn').textContent=n;
  $('#roofInfo').textContent=`${S.groups.length} nhóm · ${S.artists.filter(a=>a.solo).length} solo · ${S.artists.filter(a=>a.actor).length} diễn viên`;
  const out=S.artists.filter(a=>a.busy),mo=S.managers.filter(m=>m.as&&!mgrRoom(m));
  $('#outside').innerHTML=out.length?`<span class="lbl">🚐 Đang làm việc bên ngoài</span>`+mo.map(m=>`<button class="chip" onclick="openRoom('mgr')"><span class="dot" style="background:${m.look.out}">📋</span>QL ${esc(m.name)} đi cùng ${esc(targetName(m))}</button>`).join('')+out.map(a=>`<button class="chip" onclick="${a.busy.kind==='promo'&&campKeyOf(a)?`view(()=>viewCamp('${campKeyOf(a)}'))`:`view(()=>viewArtist(${a.id}))`}"><span class="dot" style="background:${a.look.out}">${a.busy.kind==='offer'?OFFER[a.busy.type].ic:a.busy.kind==='shoot'?'🎬':a.busy.kind==='leave'?'🌴':a.busy.kind==='write'?'✍️':'🎤'}</span>${esc(a.name)} · ${esc(a.busy.title)} (${a.busy.left}t)</button>`).join(''):'';
  $('#log').innerHTML=S.log.map(l=>`<div class="${l.c}"><span class="w">${l.w}</span>${esc(l.t)}</div>`).join('');
}
const campKeyOf=a=>Object.keys(S.camp||{}).find(k=>S.camp[k].ph==='post'&&campMem(k).includes(a));
let lastRoom='ceo';
function renderDock(){const d=$('#dock');if(!d)return;d.innerHTML=ROOMS.map(r=>`<button class="${r.id===lastRoom?'on':''}" onclick="openRoom('${r.id}')"><span class="di">${r.ic}</span><span>${r.n.replace(/^Phòng /,'')}</span>${roomBadge(r.id)}</button>`).join('')}
function render(){renderTop();renderTrend();renderBuilding();renderDock()}
function act(){cleanBatches();save();render();if(curView&&$('#sheet').classList.contains('on'))curView()}
let curRC=null;
function view(fn){curRC=null;curView=fn;fn()}
function modal(h){const sh=$('#sheet'),st=sh.querySelector('.panel')?.scrollTop||0,keep=sh.classList.contains('on');sh.innerHTML=`<div class="panel" style="--hc:${curRC||'var(--line)'}"><button class="x" onclick="closeM()" aria-label="Đóng">✕</button>${h}</div>`;sh.classList.add('on');if(keep)sh.querySelector('.panel').scrollTop=st}
function closeM(){$('#sheet').classList.remove('on');curView=null}
let toastT;function toast(t){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.style.cssText='position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:9px 15px;border-radius:10px;z-index:99;font-weight:600;font-size:13.5px;max-width:90%;box-shadow:0 14px 30px -10px rgba(0,0,0,.8)';document.body.appendChild(el)}el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2200)}

/* ================= VIEWS ================= */
function bars(a){return`<div class="bars">${Object.keys(STATS).map(k=>`<span>${STATS[k]}</span><div class="bar"><i style="width:${a.st[k]}%"></i></div><b>${Math.round(a.st[k])}</b>`).join('')}</div>`}
function aTags(a){let t=a.status==='trainee'?'<span class="tag">Thực tập sinh</span>':'';groupsOf(a).forEach(g=>t+=`<span class="tag v">👥 ${esc(g.name)}</span>`);if(a.solo)t+='<span class="tag p">Solo</span>';if(a.actor)t+='<span class="tag m">Diễn viên</span>';if(a.scandal)t+='<span class="tag r">Scandal</span>';if(dHold(a))t+='<span class="tag s">🎊 Chừa lịch debut</span>';if(a.mt&&byId(a.mt))t+=`<span class="tag v">👩‍🏫 ${esc(byId(a.mt).name)}</span>`;if(a.status==='debuted'&&a.ce&&a.ce-abs()<=8)t+=`<span class="tag r">📄 HĐ còn ${a.ce-abs()}t</span>`;{const h=cbHold(a);if(h)t+=`<span class="tag p">📅 Chừa lịch comeback ${wkLabel(h.w)}</span>`}return t}
function schedSel(a){const m=mgrSchedules(a);return`<span class="dmini" title="${a.days.map((k,i)=>DAYS[i]+': '+TRAIN[k].n).join(', ')}">${daysMini(a)}</span>`+(m?`<span class="tag v">📋 QL xếp</span>`:`<button class="btn sm" onclick="startPlanOne(${a.id})">Sửa</button>`)}
function wTable(obj){const ks=Object.keys(STATS);return`<div class="tbl"><table><tr><th></th>${ks.map(k=>`<th>${STATS[k]}</th>`).join('')}</tr>${Object.values(obj).map(c=>`<tr><td><b>${c.n}</b></td>${ks.map(k=>{const v=c.w[k]||0;return`<td>${v?`<span class="hm" style="padding:1px 5px;background:rgba(242,85,127,${v*.75})">${Math.round(v*100)}%</span>`:'·'}</td>`}).join('')}</tr>`).join('')}</table></div>`}
function artistLine(a,right=''){return`<div class="card row"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">${a.busy?'🚶 '+esc(a.busy.title):daysMini(a)+' · '+TRAIN[a.days[0]].n+' hôm nay'} · ⚡${Math.round(a.energy)} · 🙂${Math.round(a.mood)}</span><span class="sp"></span>${right}</div>`}

function viewArtist(id){
  const a=byId(id);if(!a)return closeM();
  const rels=Object.keys(a.rel).map(i=>({o:byId(+i),v:a.rel[i],t:a.tag[i]})).filter(x=>x.o).sort((x,y)=>Math.abs(y.v)-Math.abs(x.v)).slice(0,8);
  const TN={friend:'🤝 Bạn thân',enemy:'⚡ Mâu thuẫn',dating:'💞 Hẹn hò (bí mật)',public:'💌 Hẹn hò (công khai)'};
  const pws=Object.keys(a.pw).map(p=>`${esc(p)} (${a.pw[p]} lần, quan hệ ${S.partners[p]||0})`);
  const cos=Object.keys(a.co).map(c=>`${esc(c)} ${a.co[c]}`);
  modal(`<div class="big"><div class="bigwrap"><div class="chibi big" style="${blinkD(a.id)}">${chibiHTML(a)}</div></div><div><h2>${esc(a.name)}</h2><div>${aTags(a)}</div><div class="small muted">${a.g==='F'?'Nữ':'Nam'}, ${a.age} tuổi · Năng khiếu: ${STATS[a.spec]} · Tố chất x${a.talent}</div></div></div>
  <div class="grid2" style="margin:10px 0"><div class="card">💗 <b>${fmtN(a.fans)}</b> fan<br><span class="small muted">Danh tiếng ${fame(a)}/100</span></div><div class="card">⚡ Năng lượng <b>${Math.round(a.energy)}</b><br>🙂 Tâm trạng <b class="${a.mood<30?'bad':''}">${Math.round(a.mood)}</b></div><div class="card">💵 Lương <b>${fmt(a.salary)}</b>/tuần<br><span class="small muted">${a.busy?'Đang: '+esc(a.busy.title)+` (${a.busy.left} tuần)`:'Ở công ty'}</span></div></div>
  <div class="card small">${a.pm?`🧑‍💼 Quản lý riêng (tự chọn khi tách solo): <b>${esc(a.pm.name)}</b> · ${Object.keys(MSK).map(k=>MSK[k]+' '+a.pm.sk[k]).join(' · ')} · tự xếp lịch, không thuộc Văn phòng Quản lý<br>`:''}📋 Quản lý công ty: ${(()=>{const m=mgrOf(a);return m?`<b>${esc(m.name)}</b> (cấp ${m.lv}) · ${Object.keys(MSK).map(k=>MSK[k]+' '+m.sk[k]).join(' · ')}`:'<span class="muted">Chưa có. Tuyển ở Văn phòng Quản lý (tầng 6).</span>'})()}</div>
  ${a.scandal?`<div class="card tg">🚨 <b>${esc(a.scandal.t)}</b> · mức ${a.scandal.sev} · còn ${a.scandal.left} tuần. Xử lý ở Phòng Truyền thông.</div>`:''}
  ${a.wantAct?`<div class="card">🎭 Đã hứa tìm vai trước tuần tuyệt đối ${a.wantAct} (còn ${a.wantAct-abs()} tuần).</div>`:''}
  ${(()=>{const r=debutRec(a);if(a.status==='trainee')return`<div class="card small">🎯 <b>Hướng debut:</b> ${r.t==='wait'?'chưa nên debut':DR[r.t]} — ${esc(r.why)}</div>`;
    const ex=[];if(!a.solo&&bestOf(a,CONCEPTS)[0].f>DEBUT_MIN)ex.push('ra thêm solo (concept '+CONCEPTS[bestOf(a,CONCEPTS)[0].k].n+')');if(!a.actor&&bestOf(a,GENRES)[0].f>DEBUT_MIN)ex.push('lấn sân diễn xuất (phim '+GENRES[bestOf(a,GENRES)[0].k].n+')');
    return ex.length?`<div class="card small">🎯 <b>Hướng phát triển:</b> có thể ${ex.join(' hoặc ')}.</div>`:''})()}
  ${a.status==='trainee'?`<div class="card small">👩‍🏫 <b>Tiền bối dẫn dắt:</b> ${mentorSel(a)}<br><span class="muted">Tập nhanh hơn ở kỹ năng tiền bối giỏi hơn (tối đa +40%).</span>${a.dReady?`<br>🎊 <b>Đủ điều kiện debut.</b> ${a.noHold?'Đang mở lịch nhận dự án.':'Đang chừa lịch, không nhận dự án ngoài.'} <button class="btn sm" onclick="toggleHold(${a.id})">${a.noHold?'Chừa lịch debut':'Mở lịch nhận dự án'}</button>`:''}</div>`:`<div class="card small">📄 <b>Hợp đồng:</b> còn ${a.ce?a.ce-abs():'?'} tuần${a.ceNo?' · <span class="bad">không tái ký</span>':''} · doanh thu mang về ${fmt(a.earn||0)} <button class="btn sm" onclick="view(()=>viewRenew(${a.id}))">Đánh giá tái ký</button><br>👩‍🏫 <b>Dẫn dắt TTS (${menteesOf(a).length}/2):</b> ${menteesOf(a).map(x=>`${esc(x.name)} <button class="btn sm" onclick="setMentor(${x.id},0)">✕</button>`).join(' ')||'<span class="muted">chưa có</span>'}${menteesOf(a).length<2&&S.artists.some(x=>x.status==='trainee'&&!x.mt)?` <select onchange="if(this.value)setMentor(+this.value,${a.id})"><option value="">+ Nhận TTS…</option>${S.artists.filter(x=>x.status==='trainee'&&!x.mt).sort((x,y)=>mentorScore(a,y)-mentorScore(a,x)).map(x=>`<option value="${x.id}">${esc(x.name)} (+${Math.round(mentorScore(a,x))})</option>`).join('')}</select>`:''}${a.cs?`<br>✍️ Đã sáng tác ${a.cs} bài · bút lực ${Math.round(wp(a))}`:''}</div>`}
  <div class="card small">📋 <b>Đánh giá định kỳ:</b> ${a.evG?`kỳ trước <b>${a.evG}</b>`:'chưa đánh giá'}${a.status==='trainee'?` · không đạt liên tiếp <b class="${(a.ttsFail||0)>=3?'bad':''}">${a.ttsFail||0}/${EV_TTS}</b>${a.ev?` · tiến bộ kỳ này ${((stSum(a)-a.ev.st)/Math.max(a.ev.st,1)*100).toFixed(1)}% (cần >${EV_PCT}%)`:''}`:` · không đạt liên tiếp <b class="${(a.evFail||0)>=7?'bad':''}">${a.evFail||0}/${EV_ART}</b>`} · kỳ tới sau ${evNext()} tuần</div>
  ${v3ArtistHTML(a)}
  <h3>Chỉ số</h3>${bars(a)}
  <h3>Lịch tập tuần</h3><div class="row">${schedSel(a)}${mgrSchedules(a)?`<span class="small muted">Quản lý ${esc(mgrSchedules(a).name)} đang xếp lịch</span>`:''}<span class="small muted">${trainDays(a)} ngày tập · chi phí ${fmt(trainDays(a)*TRAIN_COST/5)}/tuần</span></div>
  ${det('ap-rel','Quan hệ nội bộ',`${rels.length?rels.map(r=>`<div class="small">${esc(r.o.name)}: <b class="${r.v<0?'bad':'good'}">${r.v}</b> ${r.t?TN[r.t]:''}</div>`).join(''):'<div class="small muted">Chưa có.</div>'}`,false)}
  ${det('ap-par','Đối tác & bạn diễn',`<div class="small">${pws.length?'🏢 '+pws.join(', '):'<span class="muted">Chưa hợp tác.</span>'}</div>${cos.length?`<div class="small">🎭 ${cos.join(', ')}</div>`:''}`,false)}
  ${det('ap-les','Bài học rút ra',`${a.lessons.length?a.lessons.map(l=>`<div class="card small"><b>${esc(l.t)}</b> (N${l.y})<br>${esc(l.l)} · <span class="good">${l.s}</span></div>`).join(''):'<div class="small muted">Hoàn thành dự án để rút ra bài học.</div>'}`,false)}
  ${det('ap-his','Lịch sử',`<div class="small">${a.hist.slice(0,12).map(esc).join('<br>')||'<span class="muted">Trống.</span>'}</div>`,false)}
  <div class="row" style="margin-top:16px">${!a.busy?`<button class="btn" onclick="doLive([${a.id}])" ${a.lastLive===abs()?'disabled':''}>📱 Livestream (chi 1 tr, thu ~${fmt(liveEst([a]))})</button>`:''}${campKeyOf(a)?`<button class="btn pri" onclick="view(()=>viewCamp('${campKeyOf(a)}'))">📣 Lịch quảng bá</button>`:''}<span class="sp"></span><button class="btn warn" onclick="fire(${a.id},this)">Chấm dứt hợp đồng</button></div>`);
}

function viewEvents(){
  const list=S.events.map(e=>({e,i:evInfo(e)})).filter(x=>x.i);
  modal(`<h2>🔔 Sự kiện</h2><div class="sub">Yêu cầu của nghệ sĩ, tình huống quản lý báo lên, đề xuất, hợp đồng, quan hệ nội bộ và scandal.</div>${list.length?list.map(({e,i})=>`<div class="card"><b>${i.ic} ${esc(i.t)}</b><div class="small muted" style="margin:4px 0 8px">${esc(i.d)}</div>${e.kind==='scandal'?invBlock(byId(e.a)):''}${e.kind==='renew'?renewBlock(byId(e.a),e.mul):''}${(e.kind==='mp'||e.kind==='v3')&&e.cand?candBlock(e.cand):''}<div class="row">${i.o.map(o=>`<button class="btn sm ${o.k==='yes'||o.k==='fix'||o.k==='talk'||o.k==='r1'?'pri':o.k==='end'||o.k==='split'?'warn':''}" onclick="resolveEv(${e.id},'${o.k}')">${o.l}</button>`).join('')}</div></div>`).join(''):'<div class="card muted">Không có sự kiện nào. Mọi thứ đang yên bình.</div>'}`);
}
function viewSkipWarn(){
  modal(`<h2>Còn ${S.events.length} sự kiện chưa xử lý</h2><div class="sub">Nếu sang tuần, các sự kiện sẽ tự chọn phương án cuối (thường là bất lợi).</div><div class="row"><button class="btn pri" onclick="view(viewEvents)">Xử lý ngay</button><button class="btn" onclick="closeM();nextWeek(true)">Bỏ qua & sang tuần</button></div>`);
}
function viewAward(e){
  modal(`<div class="stage">🏆</div><h2 style="text-align:center">Lễ trao giải năm ${e.y}</h2><div class="sub" style="text-align:center">Năm mới bắt đầu, trò chơi tiếp tục không giới hạn.</div>
  ${e.res.length?e.res.map(r=>`<div class="card row"><b>${r.ok?'🥇':'—'} ${r.cat}</b><span class="sp"></span><span class="small">${esc(r.names)} <span class="muted">(${r.note})</span> ${r.ok?'<span class="tag s">Thắng</span>':'<span class="tag">Đề cử</span>'}</span></div>`).join(''):'<div class="card muted">Năm nay công ty chưa có đề cử nào.</div>'}
  <h3>Xếp hạng công ty cuối năm</h3>${e.board.map((b,i)=>`<div class="card row" style="${b.me?'border-color:var(--pink)':''}"><b>#${i+1}</b> ${esc(b.n)}<span class="sp"></span>${fmtN(b.f)} fan</div>`).join('')}
  <button class="btn pri" onclick="${S.repOn!==false&&S.lastRep?'view(viewReport)':'closeM()'}">Tiếp tục</button>`);
}
function openRoom(id){if(lastRoom!==id){lastRoom=id;renderDock()}curRC=`var(--r-${id})`;curView=()=>RV[id]();curView()}
function ttsSplit(arr,fn,key,empty,ttsBtn){const tt=arr.filter(a=>a.status==='trainee').sort(eligSort),ot=arr.filter(a=>a.status!=='trainee');
  const byB=(S.batches||[]).length>1?S.batches.map(b=>({b,l:tt.filter(a=>a.batch===b.id)})).filter(x=>x.l.length):null;
  return(ot.map(fn).join('')||(tt.length?'':`<div class="small muted">${empty}</div>`))+(tt.length?det(key,`🌱 Tất cả thực tập sinh (${tt.length})`,(ttsBtn||'')+(byB?byB.map(x=>det(key+'-b'+x.b.id,`${esc(x.b.n)} (${x.l.length})`,x.l.map(fn).join(''),true)).join(''):tt.map(fn).join('')),false):'')}
function setSchedTTS(v){S.artists.filter(a=>a.status==='trainee'&&!a.busy).forEach(a=>{a.days=a.days.some(k=>k!=='rest')?a.days.map(k=>k==='rest'?'rest':v):defaultDays(v)});act()}
function trainRoom(r,key,extra=''){
  const here=S.artists.filter(a=>!a.busy&&a.days.includes(key)),others=S.artists.filter(a=>!a.busy&&!a.days.includes(key));
  const t=TRAIN[key];
  return`<h2>${r.ic} ${r.n}</h2><div class="sub">${key==='rest'?'Mỗi ngày nghỉ hồi +12 năng lượng và tâm trạng, miễn phí.':`Mỗi ngày tập tăng ${Object.keys(t.g).map(k=>STATS[k]).join(', ')}, tốn khoảng ${Math.abs(Math.round(t.e*.3))} năng lượng và ${fmt(TRAIN_COST/5)}. Năng lượng dưới 25 thì tập kém hiệu quả.`}</div>${extra}
  ${det('rm-'+key+'-in',`Đang ở đây (${here.length})`,ttsSplit(here,a=>artistLine(a,`<span class="small">${a.days.filter(k=>k===key).length} ngày · ${Object.keys(t.g).map(k=>STATS[k]+' '+Math.round(a.st[k])).join(' · ')}</span>`),'rm-'+key+'-in-t','Trống.',''),true)}
  ${det('rm-'+key+'-out',`Chuyển nghệ sĩ vào phòng (${others.length})`,ttsSplit(others,a=>artistLine(a,`<button class="btn sm pri" onclick="setSched(${a.id},'${key}')">Chuyển vào</button>`),'rm-'+key+'-out-t','Không còn ai rảnh.',`<button class="btn sm pri" onclick="setSchedTTS('${key}')">Chuyển cả lứa thực tập sinh vào</button>`),false)}`;
}
let repDay=0;
function tnode(m){const ts=mgrTargets(m);return`<div class="tnode"><div class="chibi mini">${chibiHTML(m)}</div><div style="min-width:0">${mNameH(m)} <span class="tag v">Cấp ${m.lv}</span><div class="small muted">${m.as?'Phụ trách '+esc(targetName(m))+` (${ts.length})`:'Chưa phân công'}${m.ps===1?' · tự xếp lịch':m.ps===2?' · đề xuất lịch':''}${m.auto!=='off'?' · tự nhận việc':''}</div></div></div>`}
function orgTree(){
  const sub=m=>{const k=mKids(m);if(!k.length)return`<li>${tnode(m)}</li>`;const op=!(S.ui&&S.ui['ot-'+m.id]===false);
    return`<li><details class="tdet" ${op?'open':''} ontoggle="togD('ot-${m.id}',this.open)"><summary>${tnode(m)}<span class="tcnt">${teamOf(m).length} người · ${k.length} cấp dưới</span></summary><ul>${k.map(sub).join('')}</ul></details></li>`};
  const top=S.managers.filter(m=>!mBoss(m));
  const free=S.artists.filter(a=>!mgrOf(a)&&!a.pm);
  return`<div class="tnode ceo"><span style="font-size:24px;padding:0 6px">👔</span><div><b>Giám đốc (bạn)</b><div class="small muted">${S.managers.length} quản lý · ${free.length} nghệ sĩ báo cáo trực tiếp</div></div></div>${top.length?`<ul>${top.map(sub).join('')}</ul>`:'<div class="small muted" style="margin:6px 0 0 20px">Chưa có quản lý.</div>'}`;
}
function artDayLine(a,d){
  const r=S.lastRep&&S.lastRep.a[a.id];
  if(!r)return`<div>🆕 <b>${esc(a.name)}</b>: mới gia nhập, chưa có số liệu.</div>`;
  if(r.b)return`<div>🚶 <b>${esc(a.name)}</b>: làm việc bên ngoài – ${esc(r.b)}.</div>`;
  if(d===7){const g=r.d.reduce((s,x)=>s+x[1],0),tr=r.d.filter(x=>x[0]!=='rest').length,end=r.d[6];
    return`<div>${daysMini({days:r.d.map(x=>x[0])})} <b>${esc(a.name)}</b>: ${tr} ngày tập, +${g.toFixed(1)} điểm chỉ số · cuối tuần ⚡${end[2]} 🙂${end[3]}${end[2]<30?' <span class="w">⚠️ kiệt sức</span>':''}</div>`}
  const [k,g,e,mo]=r.d[d];
  const warn=(e<30?' <span class="w">⚠️ cần nghỉ</span>':'')+(mo<30?' <span class="w">💢 tâm trạng xấu</span>':'');
  return`<div>${TIC[k]} <b>${esc(a.name)}</b>: ${TRAIN[k].n}${g?` (+${g.toFixed(1)})`:''} · ⚡${e} · 🙂${mo}${warn}</div>`;
}
function teamOf(m){let r=[...mgrTargets(m)];for(const k of mKids(m))r=r.concat(teamOf(k));return[...new Set(r)]}
function warnCount(arts,d){if(!S.lastRep)return 0;return arts.filter(a=>{const r=S.lastRep.a[a.id];if(!r||!r.d)return false;const x=r.d[d===7?6:d];return x[2]<30||x[3]<30}).length}
function briefOf(arts){const L=S.lastRep;let g=0,tr=0,fans=0;const warn=[],wn=[],done=[],out=[];
  for(const a of arts){const r=L.a[a.id];if(!r)continue;fans+=r.f||0;if(r.done)done.push(`${a.name} «${r.done}»`);
    if(r.d){g+=r.d.reduce((t,x)=>t+x[1],0);tr++;const e=r.d[6];if(e[2]<30){warn.push(`${a.name} kiệt sức`);wn.push(a.name)}else if(e[3]<30){warn.push(`${a.name} tâm trạng xấu`);wn.push(a.name)}}else if(!r.done)out.push(a.name)}
  return{g,tr,fans,warn,wn,done,out,dec:arts.reduce((t,a)=>t+((L.a[a.id]||{}).dec||0),0)}}
function briefCard(title,arts,m){const b=briefOf(arts);
  let tip='';if(b.wn.length)tip=`cho ${b.wn.join(', ')} nghỉ 2–3 ngày`;
  else{const t=arts.find(a=>a.status==='trainee'&&!a.busy&&debutRec(a).t!=='wait');if(t)tip=`${t.name} ${debutRec(t).short}`}
  const l1=`${arts.length} người · 📈 +${(b.g/Math.max(b.tr,1)).toFixed(1)}/người${b.dec?` · 📉 −${b.dec.toFixed(1)} (TTS sa sút)`:''} · 💗 ${b.fans>=0?'+':''}${fmtN(b.fans)}${b.out.length?` · 🚶 ${b.out.length} đi làm`:''}`;
  return`<div class="card rep" style="margin:0 0 6px">${title}<div>${l1}</div><div>${b.warn.length?`<span class="w">⚠️ ${esc(b.warn.join(', '))}</span>`:'✅ Ổn định'}${b.done.length?` · 🎬 Xong ${esc(b.done.join(', '))}`:''}</div>${tip?`<div class="muted">💡 ${esc(tip)}</div>`:''}</div>`}
function viewReport(){
  const L=S.lastRep;if(!L){modal('<h2>📑 Báo cáo</h2><div class="sub">Chưa có báo cáo. Hãy chơi qua một tuần.</div>');return}
  const dm=L.m1!=null?L.m1-L.m0:null,fans=Object.values(L.a).reduce((t,r)=>t+(r.f||0),0),dn=Object.values(L.a).filter(r=>r.done).length,wc=warnCount(S.artists,7);
  const lst=[],walk=(m,d)=>{lst.push([m,d]);mKids(m).forEach(k=>walk(k,d+1))};S.managers.filter(m=>!mBoss(m)).forEach(m=>walk(m,0));
  const free=S.artists.filter(a=>!mgrOf(a)&&!a.pm);
  const cards=lst.map(([m,d])=>{const ts=mgrTargets(m);if(!ts.length)return'';return`<div style="margin-left:${d*14}px">${briefCard(`<b>📋 ${esc(m.name)}</b> <span class="muted">· ${esc(targetName(m))}</span>`,ts,m)}</div>`}).join('');
  const pc=propCount();
  modal(`<h2>📑 Báo cáo tuần ${L.w} · Năm ${L.y}</h2>
  <div class="grid2" style="margin-bottom:8px"><div class="card small">💰 <b class="${dm<0?'bad':'good'}">${dm==null?'—':(dm>=0?'+':'')+fmt(dm)}</b></div><div class="card small">💗 <b>${fans>=0?'+':''}${fmtN(fans)}</b> fan</div><div class="card small">🎬 <b>${dn}</b> dự án xong</div><div class="card small">⚠️ <b class="${wc?'bad':''}">${wc}</b> cần chú ý</div>${L.biz?`<div class="card small">📈 Kinh doanh <b class="${L.biz<0?'bad':'good'}">${L.biz>=0?'+':''}${fmt(L.biz)}</b></div>`:''}</div>
  ${L.evl?evalBrief(S.lastEval):''}
  ${cards}${free.length?briefCard('<b>👔 Chưa có quản lý</b>',free):''}
  ${(()=>{const P=S.props&&S.props.w===abs()?S.props:null;if(!P)return'';const nb=Object.values(P.st.boss).reduce((a,b)=>a+b,0),pd=P.c.filter(c=>c.pend).length;return(nb||P.st.auto||P.st.res||pd)?`<div class="card small rep">📨 Duyệt tuần mới: ${nb?`cấp trên duyệt ${nb}`:''}${P.st.auto?` · tự duyệt ${P.st.auto}`:''}${P.st.res?` · ⚖️ ${P.st.res} xung đột đã xử lý`:''}${pd?` · <span class="w">⚠️ ${pd} xung đột chờ bạn</span>`:''}</div>`:''})()}
  ${L.ev.length?`<h3>Đáng chú ý</h3><div class="card rep">${L.ev.slice(0,5).map(t=>`<div>${esc(t)}</div>`).join('')}${L.ev.length>5?`<div class="muted">+${L.ev.length-5} sự kiện khác trong Nhật ký</div>`:''}</div>`:''}
  <div class="row" style="margin-top:10px"><button class="btn" onclick="repDay=7;view(viewReportFull)">Chi tiết theo ngày</button>${pc?`<button class="btn" onclick="propNext=null;view(viewProps)">📋 ${pc} đề xuất</button>`:''}<span class="sp"></span><button class="btn pri" onclick="closeM()">Đóng</button></div>`);
}
function viewReportFull(){
  const R=S.lastRep;if(!R){modal('<h2>📑 Báo cáo</h2><div class="sub">Chưa có báo cáo. Hãy chơi qua một tuần.</div>');return}
  const d=repDay;
  const node=m=>{const ts=mgrTargets(m),kids=mKids(m),team=teamOf(m),wc=warnCount(team,d);
    return`<li><div class="card" style="margin:0"><div class="row"><div class="chibi mini" style="transform:scale(.72);margin:-8px 0 -8px 0">${chibiHTML(m)}</div><div><b>📋 ${esc(m.name)}</b> <span class="small muted">cấp ${m.lv}${mBoss(m)?' · báo cáo lên '+esc(mBoss(m).name):' · báo cáo Giám đốc'}</span></div></div>
    <div class="rep" style="margin-top:4px">${ts.length?ts.map(a=>artDayLine(a,d)).join(''):'<div class="muted">Không trực tiếp phụ trách nghệ sĩ nào.</div>'}
    ${kids.length?`<div style="margin-top:4px">👥 <b>Tóm tắt đội:</b> ${team.length} nghệ sĩ dưới quyền${wc?`, <span class="w">${wc} cần chú ý</span>`:', mọi người ổn định'}.</div>`:''}</div></div>
    ${kids.length?`<ul>${kids.map(node).join('')}</ul>`:''}</li>`};
  const top=S.managers.filter(m=>!mBoss(m)),free=S.artists.filter(a=>!mgrOf(a)&&!a.pm);
  modal(`<h2>📑 Báo cáo tuần ${R.w} · Năm ${R.y}</h2><div class="sub">${d===7?'Tổng kết cả tuần':'Báo cáo cuối ngày '+DAYN[d]} theo sơ đồ quản lý.</div>
  <div class="tabs">${DAYS.map((x,i)=>`<button class="${i===d?'on':''}" onclick="repDay=${i};viewReportFull()">${x}</button>`).join('')}<button class="${d===7?'on':''}" onclick="repDay=7;viewReportFull()">Cả tuần</button></div>
  <div class="tree"><div class="tnode ceo"><span style="font-size:24px;padding:0 6px">👔</span><div><b>Gửi Giám đốc</b><div class="small muted">${warnCount(S.artists,d)} nghệ sĩ cần chú ý ${d===7?'cuối tuần':'hôm nay'}</div></div></div>
  <ul>${top.map(node).join('')}${free.length?`<li><div class="card" style="margin:0"><b>👔 Báo cáo trực tiếp (chưa có quản lý)</b><div class="rep" style="margin-top:4px">${free.map(a=>artDayLine(a,d)).join('')}</div></div></li>`:''}</ul></div>
  ${d===7&&R.ev.length?`<h3>Sự kiện trong tuần</h3><div class="card rep">${R.ev.map(t=>`<div>${esc(t)}</div>`).join('')}</div>`:''}
  <div class="row" style="margin-top:10px">${d>0?`<button class="btn" onclick="repDay=${d-1};viewReportFull()">◀ Hôm trước</button>`:''}<span class="sp"></span>${d<7?`<button class="btn pri" onclick="repDay=${d+1};viewReportFull()">${d===6?'Tổng kết tuần ▶':'Hôm sau ▶'}</button>`:'<button class="btn" onclick="view(viewReport)">◀ Bản gọn</button><button class="btn pri" onclick="closeM()">Đóng</button>'}</div>`);
}
function mgrBars(m){return`<div class="bars">${Object.keys(MSK).map(k=>`<span>${MSK[k]}</span><div class="bar"><i style="width:${m.sk[k]*10}%"></i></div><b>${m.sk[k]}</b>`).join('')}</div>`}
const RV={
  mgr(){
    const taken=(t,id,m)=>S.managers.some(x=>x!==m&&x.as&&x.as.t===t&&x.as.id===id);
    const noMgr=S.artists.filter(a=>!mgrOf(a)&&!a.pm&&a.status!=='trainee'),tts=S.artists.filter(a=>a.status==='trainee'),ttsNo=tts.filter(a=>!mgrOf(a)),pmA=S.artists.filter(a=>a.pm);
    const PS=['Tắt','Tự xếp','Đề xuất'];
    const card=m=>{const sum=`📋 ${mNameH(m)} <span class="tag v">Cấp ${m.lv}</span><span class="small muted" style="font-weight:500">${esc(targetName(m))} (${mgrTargets(m).length}) · lịch: ${PS[m.ps]||'—'}${m.auto!=='off'?' · tự nhận việc':''}</span>`;
      const body=`<div class="row"><div class="chibi mini">${chibiHTML(m)}</div><div class="small muted">Lương ${fmt(m.salary)}/tuần · kinh nghiệm ${Math.floor(m.exp*10)/10}/${m.lv*4} · cấp dưới ${mKids(m).length}/${mCap(m)}${mBoss(m)?`<br>Được ${esc(mBoss(m).name)} kèm cặp: +20% kỹ năng cấp trên`:''}</div></div>${mgrBars(m)}
      <div class="small" style="margin-top:6px">🧑‍💻 Trợ lý (${asstOf(m).length}/2): ${asstOf(m).map(x=>`${esc(x.name)} <span class="muted">${MSK[x.k]} +${x.v}, ${fmt(x.sal)}/t</span> <button class="btn sm" onclick="fireAsst(${x.id})">✕</button>`).join(' · ')||'<span class="muted">chưa có, quản lý sẽ tự đề xuất khi cần</span>'}</div>
      <div class="row" style="margin-top:8px"><span class="small">Báo cáo cho:</span><select onchange="setBoss(${m.id},this.value)" style="flex:1;min-width:150px"><option value="">👔 Giám đốc (bạn)</option>${S.managers.filter(x=>x!==m).map(x=>`<option value="${x.id}" ${m.boss===x.id?'selected':''} ${inSub(m,x)||(m.boss!==x.id&&mKids(x).length>=mCap(x))?'disabled':''}>📋 ${esc(x.name)} (cấp ${x.lv})${inSub(m,x)?' – cấp dưới':''}</option>`).join('')}</select></div>
      <div class="row" style="margin-top:8px"><span class="small">Phụ trách:</span><select onchange="assignMgr(${m.id},this.value)" style="flex:1;min-width:160px"><option value="">— Chưa phân công —</option>
      ${(()=>{const bs=(S.batches||[]).filter(b=>!taken('b',b.id,m));return bs.length?`<optgroup label="Lứa thực tập sinh">${bs.map(b=>`<option value="b${b.id}" ${m.as&&m.as.t==='b'&&m.as.id===b.id?'selected':''}>🌱 ${esc(b.n)} (${bMem(b).length} TTS)</option>`).join('')}</optgroup>`:''})()}
      <optgroup label="Nghệ sĩ solo / diễn viên"><option value="l0" ${m.as&&m.as.t==='l'?'selected':''}>🗂️ Danh sách tự chọn (tối đa ${MAX_SA} người)</option></optgroup>
      ${(()=>{const gs=S.groups.filter(g=>!taken('g',g.id,m));return gs.length?`<optgroup label="Nhóm">${gs.map(g=>`<option value="g${g.id}" ${m.as&&m.as.t==='g'&&m.as.id===g.id?'selected':''}>👥 ${esc(g.name)} (${g.members.length})${g.hiatus>abs()?' ⏸️':''}</option>`).join('')}</optgroup>`:''})()}
      ${(()=>{const as=S.artists.filter(a=>(!a.pm&&a.status!=='trainee'&&!otherMgr(a,m))||(m.as&&m.as.t==='a'&&m.as.id===a.id));return as.length?`<optgroup label="Một nghệ sĩ">${as.map(a=>`<option value="a${a.id}" ${m.as&&m.as.t==='a'&&m.as.id===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</optgroup>`:''})()}</select></div>
      <div class="small muted">Chỉ hiện nhóm, lứa và nghệ sĩ chưa có quản lý.</div>
      ${m.as&&m.as.t==='l'?(()=>{const own=m.as.ids,inOther=a=>S.managers.find(x=>x!==m&&x.as&&x.as.t==='l'&&x.as.ids.includes(a.id)),row=a=>{const o=inOther(a);return`<label><input type="checkbox" ${own.includes(a.id)?'checked':''} ${o?'disabled':''} onchange="toggleMA(${m.id},${a.id},this.checked)"> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">${[a.solo?'Solo':'',a.actor?'Diễn viên':'',groupsOf(a).length?'Nhóm':'',a.status==='trainee'?'TTS':''].filter(Boolean).join(' · ')}${o?' – thuộc '+esc(o.name):''}</span></span></label>`};
        const vis=a=>own.includes(a.id)||(!inOther(a)&&!otherMgr(a,m));const main=S.artists.filter(a=>(a.solo||a.actor)&&!a.pm&&vis(a)),rest=S.artists.filter(a=>!a.solo&&!a.actor&&!a.pm&&a.status!=='trainee'&&vis(a));
        return`<div class="small" style="margin-top:6px">Đã chọn <b>${own.length}/${MAX_SA}</b> người. Mỗi quản lý chỉ lo tối đa ${MAX_SA} nghệ sĩ solo/diễn viên; muốn quản lý nhiều hơn hãy để quản lý cấp cao kèm cặp các quản lý khác.</div><div class="list">${main.map(row).join('')||'<div class="small muted">Không còn nghệ sĩ solo hay diễn viên nào chưa có quản lý.</div>'}</div>${rest.length?det('mg-lo-'+m.id,`Nghệ sĩ khác (${rest.length})`,`<div class="list">${rest.map(row).join('')}</div>`,false):''}`})():''}
      <div class="row" style="margin-top:6px"><span class="small">Lịch tập & nghỉ:</span><select onchange="setPs(${m.id},this.value)"><option value="0" ${m.ps===0?'selected':''}>Tắt</option><option value="2" ${m.ps===2?'selected':''}>Đề xuất để bạn duyệt</option><option value="1" ${m.ps===1?'selected':''}>Tự xếp luôn</option></select></div>
      <div class="row" style="margin-top:6px"><span class="small">Tự nhận lời mời:</span><select onchange="setAuto(${m.id},this.value)"><option value="off" ${m.auto==='off'?'selected':''}>Tắt</option><option value="short" ${m.auto==='short'?'selected':''}>Chỉ việc ngắn (≤ 2 tuần)</option><option value="all" ${m.auto==='all'?'selected':''}>Mọi lời mời</option></select><span class="sp"></span><button class="btn sm warn" onclick="fireMgr(${m.id},this)">Cho nghỉ</button></div>`;
      return det('mg-'+m.id,sum,body,false)};
    modal(`<h2>📋 Văn phòng Quản lý</h2><div class="sub">Chạm vào từng mục để mở hoặc thu gọn.</div>
    <div class="row" style="margin-bottom:4px"><button class="btn pri" onclick="view(viewReport)" ${S.lastRep?'':'disabled'}>📑 Báo cáo tuần trước</button><button class="btn" onclick="propNext=null;view(viewProps)">📋 Đề xuất tuần này</button></div>
    <label class="small row"><input type="checkbox" ${S.repOn!==false?'checked':''} onchange="S.repOn=this.checked;save()"> Tự hiện báo cáo sau mỗi tuần</label>
    <label class="small row"><input type="checkbox" ${S.autoAppr!==false?'checked':''} onchange="S.autoAppr=this.checked;save()"> Tự duyệt đề xuất không xung đột của quản lý báo cáo trực tiếp cho bạn</label>
    ${(()=>{const nb=(S.batches||[]).filter(b=>bMem(b).length&&!S.managers.some(m=>m.as&&m.as.t==='b'&&m.as.id===b.id));return nb.length?`<div class="card small">🌱 ${nb.map(b=>esc(b.n)).join(', ')} chưa có quản lý. Quản lý thực tập sinh giờ phụ trách theo từng lứa.</div>`:''})()}
    ${det('mg-help','ℹ️ Cách quản lý hoạt động',`<div class="small">${Object.keys(MSK).map(k=>`<b>${MSK[k]}:</b> ${MSKD[k]}`).join('<br>')}<br><b>Phụ trách:</b> một nhóm, một lứa thực tập sinh, một nghệ sĩ, hoặc danh sách tối đa ${MAX_SA} nghệ sĩ solo/diễn viên. Quản lý có thể kèm cặp các quản lý khác qua mục "Báo cáo cho".<br><b>Ưu tiên:</b> khi tự nhận việc, quản lý luôn ưu tiên dự án mời đích danh nghệ sĩ mình phụ trách.<br><b>Tình huống:</b> quản lý sẽ báo lên các tình huống với nghệ sĩ/TTS kèm nhiều phương án; kỹ năng quản lý quyết định tỉ lệ thành công. Quản lý cũng đề xuất tuyển trợ lý (tăng kỹ năng) và giới thiệu người có năng khiếu làm TTS.<br><b>Lịch tập:</b> "Đề xuất" gửi lịch cho bạn duyệt mỗi tuần, "Tự xếp" áp dụng luôn.<br><b>Tự nhận lời mời:</b> chọn lời mời trả cao nhất, biết ghép nhiều người vào một dự án.<br><b>Luồng duyệt:</b> đề xuất được báo cáo lên cấp trên. Không xung đột thì cấp trên duyệt ngay. Xung đột (trùng người, tranh lời mời, quá sức, bạn diễn mâu thuẫn, scandal) thì chuyển lên người cao hơn có kỹ năng Kế hoạch + cấp đủ cao (≥ 3, 6, 9 theo độ khó), cuối cùng là Giám đốc.<br><b>Cấp bậc:</b> cấp dưới được cộng 20% kỹ năng cấp trên, cấp trên nhận một nửa kinh nghiệm cấp dưới. Mỗi trưởng nhóm quản được 2 người, cứ 2 cấp thêm 1.</div>`,false)}
    ${mgrBossHTML()}
    ${det('mg-tree','🌳 Sơ đồ tổ chức',`<div class="tree">${orgTree()}</div>`,true)}
    <div class="row" style="margin:12px 0 0"><h3 style="margin:0">Đội ngũ quản lý theo cấp (${S.managers.length})</h3><span class="sp"></span>${S.managers.length?`<button class="btn sm" onclick="setAllD('mg-',false)">Thu gọn hết</button><button class="btn sm" onclick="setAllD('mg-',true)">Mở hết</button>`:''}</div>
    ${S.managers.length?[...new Set(S.managers.map(m=>m.lv))].sort((x,y)=>y-x).map(lv=>{const ms=S.managers.filter(m=>m.lv===lv);
      return det('mg-lv-'+lv,`⭐ Cấp ${lv} <span class="small muted" style="font-weight:500">${ms.length} quản lý · ${ms.reduce((t,m)=>t+mgrTargets(m).length,0)} nghệ sĩ phụ trách</span>`,ms.map(card).join(''),true)}).join(''):'<div class="card small muted">Chưa có quản lý nào. Tuyển ứng viên bên dưới.</div>'}
    ${det('mg-free',`Chưa có quản lý (${noMgr.length+(ttsNo.length?1:0)})`,`<div class="small">${noMgr.map(a=>esc(a.name)).join(', ')}${ttsNo.length?`${noMgr.length?'<br>':''}🌱 <b>${ttsNo.length} thực tập sinh</b> — giao quản lý theo lứa`:''}${!noMgr.length&&!ttsNo.length?'<span class="muted">Tất cả đã có người phụ trách.</span>':''}</div>${pmA.length?`<div class="small muted" style="margin-top:6px">🧑‍💼 ${pmA.map(a=>esc(a.name)).join(', ')} đã tách solo và tự chọn quản lý riêng nên không hiện ở đây.</div>`:''}`,noMgr.length+ttsNo.length>0)}
    ${det('mg-pool',`Ứng viên quản lý (${S.mgrPool.length})`,`<div class="small muted" style="margin-bottom:6px">Danh sách mới mỗi 8 tuần.</div>${S.mgrPool.map(m=>`<div class="card"><div class="row"><div class="chibi mini">${chibiHTML(m)}</div><div><b>${esc(m.name)}</b><div class="small muted">Giỏi nhất: ${MSK[m.spec]} · Lương ${fmt(m.salary)}/tuần</div></div><span class="sp"></span><button class="btn sm pri" onclick="hireMgr(${m.id})">Tuyển (${fmt(m.fee)})</button></div>${mgrBars(m)}</div>`).join('')||'<div class="small muted">Hết ứng viên.</div>'}<button class="btn" onclick="rehuntMgr()">Tìm ứng viên mới (15 tr)</button>`,!S.managers.length)}`);
  },
  invest(){
    const own=S.biz,tot=own.reduce((t,b)=>t+Math.round(b.last*bizOwn(b)),0),fF=clamp(totalFans()/300000,0,2);
    modal(`<h2>📈 Phòng Đầu tư</h2><div class="sub">Mở thêm ngành kinh doanh để có thu nhập đều mỗi tuần. Lãi phụ thuộc tổng fan của công ty (hiện hệ số ×${(1+fF).toFixed(2)} cho ngành ăn theo fan). Doanh nghiệp có thể bán bớt cổ phần để kêu gọi vốn (giữ tối thiểu 51%), đổi lại chỉ hưởng lãi theo tỷ lệ còn giữ.</div>
    <div class="grid2"><div class="card">💼 Đang sở hữu<br><b>${own.length}</b> ngành</div><div class="card">💵 Lãi tuần trước<br><b class="${tot<0?'bad':'good'}">${fmt(tot)}</b></div></div>
    ${modV('econ')<1?'<div class="card small bad">📉 Đang suy thoái: lợi nhuận kinh doanh giảm.</div>':''}
    ${S.loan?`<div class="card small">💼 Đang trả vốn ${esc(S.loan.n)}: ${fmt(S.loan.pay)}/tuần, còn ${S.loan.left} tuần.</div>`:''}
    ${det('iv-own',`💼 Doanh nghiệp của bạn (${own.length})`,own.map(b=>{const B=BIZ[b.k];return`<div class="card"><div class="row"><b>${B.ic} ${B.n}</b><span class="tag v">Cấp ${b.lv}/5</span><span class="tag s">Cổ phần ${Math.round(bizOwn(b)*100)}%</span><span class="sp"></span><span class="small ${b.last<0?'bad':'good'}">${b.last>=0?'+':''}${fmt(bizOwn(b)<1?b.last*bizOwn(b):b.last)}/tuần</span></div><div class="small muted">${B.d} · Tổng lãi ${fmt(b.tot)} · đã đầu tư ${fmt(b.inv)}${bizOwn(b)<1?` · phần của bạn (toàn DN ${fmt(b.last)})`:''}</div><div class="row" style="margin-top:6px;flex-wrap:wrap"><span class="small">💼 Kêu gọi vốn · định giá ${fmt(bizVal(b))}</span><span class="sp"></span>${[.1,.2,.3].map(p=>`<button class="btn sm" ${Math.round((bizOwn(b)-p)*100)<51||bizWait(b)?'disabled':''} onclick="raiseBiz('${b.k}',${p})">Bán ${p*100}% (+${fmt(bizVal(b)*p)})</button>`).join('')}${bizOwn(b)<1?`<button class="btn sm pri" onclick="buybackBiz('${b.k}')">Mua lại (${fmt(bizVal(b)*(1-bizOwn(b))*1.15)})</button>`:''}</div>${bizWait(b)?`<div class="small muted">Vừa gọi vốn, còn ${bizWait(b)} tuần mới gọi tiếp được.</div>`:''}<div class="row" style="margin-top:6px">${b.lv<5?`<button class="btn sm pri" onclick="upBiz('${b.k}')">Mở rộng (${fmt(upCost(b))})</button>`:'<span class="tag s">Tối đa</span>'}<span class="sp"></span><button class="btn sm warn" onclick="sellBiz('${b.k}',this)">Bán (${fmt(b.inv*.6*bizOwn(b))})</button></div></div>`}).join('')||'<div class="card small muted">Chưa đầu tư ngành nào.</div>',true)}
    ${det('iv-shop','🏪 Ngành có thể đầu tư',Object.keys(BIZ).filter(k=>!bizLv(k)).map(k=>{const B=BIZ[k],est=B.base*(1+B.syn*fF);return`<div class="prow"><b>${B.ic} ${B.n}</b><span class="small muted">${B.d} Ước tính ~${fmt(est)}/tuần${B.vol>.6?' (dao động mạnh)':''}</span><span class="sp"></span><button class="btn sm pri" onclick="buyBiz('${k}')">Mở (${fmt(B.cost)})</button></div>`}).join('')||'<div class="small muted">Đã mở mọi ngành.</div>',true)}`);
  },
  market(){
    const me={n:'⭐ Starlight Ent. (bạn)',fans:totalFans(),me:1},list=S.rivals.concat([me]).sort((a,b)=>b.fans-a.fans),mx=list[0].fans||1;
    const ms=Object.values(S.mods||{}).filter(m=>m.until>abs());
    const free=acts().filter(actFree).map(x=>({x,r:conceptRec(x).find(c=>S.trend.hot.includes(c.k))})).sort((a,b)=>b.r.f-a.r.f).slice(0,4);
    modal(`<h2>📊 Phòng Thị trường</h2><div class="sub">Xu hướng âm nhạc, biến động thị trường và các công ty đối thủ.</div>
    <h3>🔥 Concept đang thịnh hành</h3><div class="card"><div class="cfit">${Object.keys(CONCEPTS).map(k=>({k,v:S.trend.hot.includes(k)?95:S.trend.cold===k?15:50})).sort((a,b)=>b.v-a.v).map(r=>`<span class="${r.v>90?'best':''}">${CONCEPTS[r.k].n}${trendTag(r.k)}</span><div class="bar"><i style="width:${r.v}%"></i></div><b>${r.v>90?'Hot':r.v<20?'Nguội':'·'}</b>`).join('')}</div>
    <div class="small muted">Còn khoảng ${S.trend.until-abs()} tuần trước khi xu hướng đổi. Single concept hot +12 điểm, concept nguội −8.</div>
    ${free.length?`<div class="small" style="margin-top:6px"><b>Ai hợp xu hướng:</b><br>${free.map(o=>`${esc(o.x.n)}: ${CONCEPTS[o.r.k].n} ${Math.round(o.r.f)}%`).join('<br>')}</div>`:''}</div>
    ${ms.length?`<h3>⚡ Biến động đang diễn ra</h3><div class="card small">${ms.map(m=>`${esc(m.n)} · còn ${m.until-abs()} tuần`).join('<br>')}</div>`:''}
    ${det('mk-rank','⚔️ Bảng xếp hạng công ty',list.map((r,i)=>`<div class="card" style="${r.me?'border-color:var(--pink)':''}"><div class="row"><b>#${i+1} ${esc(r.n)}</b><span class="sp"></span><b>${fmtN(r.fans)}</b> fan</div><div class="bar" style="margin:4px 0"><i style="width:${r.fans/mx*100}%;${r.me?'background:var(--pink)':''}"></i></div>${r.me?'':`<div class="small muted">Năm nay ${r.fans>=r.f0?'+':''}${fmtN(r.fans-r.f0)} fan${r.stole?` · đã giành ${r.stole} lời mời`:''}${r.last?' · '+esc(r.last):''}${r.cb&&r.cb.w>=abs()-1?' · <b class="bad">đang comeback</b>':''}</div>`}</div>`).join(''),true)}
    <div class="small muted">Đối thủ có thể comeback cùng lúc với bạn (làm single khó lên hạng), giành lời mời béo bở và chiêu mộ nghệ sĩ tâm trạng kém. Xếp hạng cuối năm dựa trên tổng fan.</div>`);
  },
  roof(){modal(trainRoom(ROOMS.find(r=>r.id==='roof'),'rest','<div class="small muted">Nghệ sĩ nghỉ ngơi sẽ tản ra Ký túc xá, Sảnh và Sân thượng.</div>'))},
  ceo(){
    const wk=weekCost();
    const last=S.awards[S.awards.length-1];
    modal(`<h2>💼 Phòng Giám đốc</h2><div class="sub">Quản lý tài chính, lịch tập hằng tuần và thành tích.</div>
    <div class="grid2"><div class="card">💰 Quỹ<br><b>${fmt(S.money)}</b></div><div class="card">📉 Chi phí tuần<br><b>${fmt(wk)}</b></div><div class="card">🏆 Giải đã thắng<br><b>${S.awards.reduce((s,e)=>s+e.res.filter(r=>r.ok).length,0)}</b></div><div class="card">📊 Hạng năm trước<br><b>${last?'#'+last.rank:'—'}</b></div></div>
    ${det('ceo-sched',`📅 Lịch tập tuần (${S.artists.filter(a=>!a.busy).length} ở công ty, ${S.artists.filter(a=>a.busy).length} bên ngoài)`,`<div class="row" style="margin-bottom:8px"><span class="small">Áp dụng cho tất cả (5 ngày tập + 2 ngày nghỉ):</span><select onchange="setAll(this.value)"><option value="">Chọn…</option>${Object.keys(TRAIN).map(k=>`<option value="${k}">${TRAIN[k].n}</option>`).join('')}</select></div>
    ${S.artists.length?ttsSplit(S.artists,a=>artistLine(a,a.busy?'<span class="tag">Bên ngoài</span>':schedSel(a)),'ceo-tts','',''):'<div class="muted small">Chưa có nghệ sĩ. Xuống Sảnh Tuyển dụng nhé.</div>'}`,true)}
    ${det('ceo-grp',`👥 Nhóm nhạc (${S.groups.length})`,S.groups.map(g=>`<div class="card"><b>👥 ${esc(g.name)}</b> <span class="small muted">debut năm ${g.y} · hòa hợp ${harmony(g.members)>=0?'+':''}${harmony(g.members)} · 📋 ${esc((S.managers.find(m=>m.as&&m.as.t==='g'&&m.as.id===g.id)||{name:'chưa có quản lý'}).name)}</span><div class="small">${g.members.map(i=>byId(i)).filter(Boolean).map(a=>esc(a.name)).join(', ')} · ${fmtN(g.members.reduce((s,i)=>s+(byId(i)?.fans||0),0))} fan</div></div>`).join('')||'<div class="small muted">Chưa có nhóm.</div>',false)}
    ${det('ceo-par',`🤝 Quan hệ đối tác (${Object.keys(S.partners).length})`,`<div class="small">${Object.keys(S.partners).sort((x,y)=>S.partners[y]-S.partners[x]).map(p=>`${esc(p)}: <b>${S.partners[p]}</b>`).join(' · ')||'<span class="muted">Hoàn thành dự án để xây dựng quan hệ. Quan hệ cao giúp giảm yêu cầu, tăng thù lao và nhận lời mời đích danh.</span>'}</div>`,false)}
    ${det('ceo-eval',`📋 Đánh giá định kỳ · kỳ tới sau ${evNext()} tuần`,`<div class="small muted" style="margin-bottom:6px">Mỗi 4 tuần. TTS phải tăng tổng chỉ số trên ${EV_PCT}% so với kỳ trước; không đạt ${EV_TTS} lần liên tiếp bị loại. TTS lười tập hoặc buồn có thể bị sa sút chỉ số. Nghệ sĩ xuất sắc được thưởng 2 tuần lương, không đạt bị trừ 1 tuần lương; ${EV_ART} lần liên tiếp không đạt sẽ bị chấm dứt hợp đồng.</div>${evalTable(S.lastEval)}`,true)}
    ${det('ceo-aw',`🏆 Lịch sử lễ trao giải (${S.awards.length})`,S.awards.slice().reverse().map(e=>`<div class="card small"><b>Năm ${e.y}</b> · hạng #${e.rank} · ${e.res.filter(r=>r.ok).map(r=>r.cat).join(', ')||'chưa có giải'}</div>`).join('')||'<div class="small muted">Lễ trao giải diễn ra sau tuần 52 mỗi năm.</div>',false)}
    <h3>Dữ liệu</h3><div class="small muted" style="margin-bottom:6px">Game tự lưu trên trình duyệt này sau mỗi thao tác. Muốn chơi ở thiết bị khác, hãy lưu bằng mã 16 ký tự.</div><button class="btn pri" onclick="view(viewCode)">🔑 Lưu / tải bằng mã</button> <button class="btn warn" onclick="resetGame(this)">Chơi lại từ đầu</button>`);
  },
  meet(){
    const now=abs();
    const avail=S.artists.filter(a=>!a.busy);
    modal(`<h2>📨 Phòng Họp</h2><div class="sub">Lời mời hợp tác. Quan hệ tốt với đối tác/bạn diễn giúp giảm yêu cầu và tăng thù lao.</div>
    ${S.events.length?`<button class="btn pink" onclick="view(viewEvents)">🔔 ${S.events.length} sự kiện cần xử lý</button>`:''}
    ${(()=>{const L=secPlans();if(!L.length)return'';const r=L.filter(p=>!p.wait&&!p.plan),pl=L.filter(p=>p.plan),sr=secSchedRec();return`<div class="card row"><div class="chibi mini">${chibiHTML(NPC[1])}</div><div class="small" style="flex:1"><b>🗒️ Thư ký:</b> ${r.length?`${r.map(p=>esc(p.n.slice(2).trim())).join(', ')} nên comeback ngay (concept ${CONCEPTS[r[0].ck].n}${trendTag(r[0].ck)}).`:'chưa có ai nên comeback tuần này.'}${sr.length?` Nên hẹn: ${sr.map(p=>esc(p.n.slice(2).trim())).join(', ')}.`:''}${pl.length?` ${pl.length} lịch đã hẹn.`:''}${Object.values(S.camp).some(c=>c.ph==='post')?` 📣 ${Object.values(S.camp).filter(c=>c.ph==='post').length} đang quảng bá.`:''}${fanSugs().length?` 💬 ${fanSugs().length} gợi ý giao lưu fan.`:''}</div>${sr.length?`<button class="btn sm" onclick="cbSchedRec()">Hẹn theo khuyến nghị</button>`:''}<button class="btn sm pri" onclick="view(viewSec)">Kế hoạch</button></div>`})()}
    ${(()=>{const offCard=of=>{const O=OFFER[of.type],tg=of.target?byId(of.target):null;
      const opts=avail.slice().sort((x,y)=>(canTake(of,x)?1:0)-(canTake(of,y)?1:0)||(y.id===of.target)-(x.id===of.target)).map(a=>{const why=canTake(of,a);return`<option value="${a.id}" ${why?'disabled':''}>${esc(a.name)} – ${why||'phù hợp '+Math.round(fit(a,of.w))+'% · '+fmt(effPay(of,a))}</option>`}).join('');
      return`<div class="card ${tg?'tg':''}"><div class="row"><b>${O.ic} ${O.n}: «${esc(of.title)}»</b>${slotsOf(of)>1?` <span class="tag v">👥 ${slotsOf(of)} người</span>`:''}<span class="sp"></span><span class="small muted">hết hạn ${of.exp-now} tuần</span></div>
      <div class="small">${esc(of.partner)} (quan hệ ${S.partners[of.partner]||0})${of.genre?' · Thể loại '+GENRES[of.genre].n:''} · ${of.weeks} tuần · Thù lao gốc ${fmt(of.pay)}${of.costar?' · Bạn diễn: '+esc(of.costar):''}</div>
      ${tg?`<div class="small" style="color:var(--sun);font-weight:700">⭐ Mời đích danh: ${esc(tg.name)} (yêu cầu giảm thêm 20%)${slotsOf(of)>1?' · có thể mời thêm bạn diễn':''}</div>`:''}
      <div class="req">Yêu cầu: ${Object.keys(of.req).map(k=>`${STATS[k]} ≥ ${of.req[k]}`).join(', ')}${of.fame?` · Danh tiếng ≥ ${of.fame}`:''}${O.trainee?' · Nhận cả thực tập sinh':''}</div>
      ${slotsOf(of)>1?(()=>{const ok=avail.filter(a=>!canTake(of,a));return`<div class="small" style="margin-top:6px">👥 Tối đa <b>${slotsOf(of)} người</b> · bạn thân, cùng nhóm làm chung sẽ ăn ý hơn.</div>
      <div class="list">${ok.map(a=>`<label><input type="checkbox" class="oc${of.id}" value="${a.id}" onchange="ocPrev(${of.id},this)" ${a.id===of.target?'checked':''}> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">phù hợp ${Math.round(fit(a,of.w))}% · ${fmt(effPay(of,a))}</span></span></label>`).join('')||'<div class="small muted">Chưa có ai đủ điều kiện.</div>'}</div>
      ${avail.length>ok.length?`<div class="small muted">${avail.length-ok.length} người rảnh chưa đủ điều kiện.</div>`:''}
      <div class="row" style="margin-top:6px"><span class="small muted" id="ocp${of.id}">Chọn tối đa ${slotsOf(of)} người</span><span class="sp"></span>${ok.length?`<button class="btn sm" onclick="ocPick(${of.id})">💡 Gợi ý đội hình</button><button class="btn sm pri" onclick="acceptSel(${of.id})">Nhận</button>`:''}</div>`})():`<div class="row" style="margin-top:6px"><select id="ofs${of.id}" style="flex:1;min-width:180px">${opts||'<option disabled>Không có ai rảnh</option>'}</select><button class="btn sm pri" onclick="acceptOffer(${of.id},+$('#ofs${of.id}').value)">Nhận</button></div>`}
      ${of.invest?`<div class="row" style="margin-top:6px"><span class="small">💰 Góp vốn ${Math.round(of.invest.share*100)}% / kinh phí ${fmt(of.invest.budget)}</span><span class="sp"></span><button class="btn sm" ${of.invested?'disabled':''} onclick="investOffer(${of.id})">${of.invested?'Đã góp vốn':'Góp '+fmt(of.invest.budget*of.invest.share)}</button></div>`:''}</div>`},tO=offerOrder(S.offers).filter(o=>OFFER[o.type].trainee),oO=offerOrder(S.offers).filter(o=>!OFFER[o.type].trainee),tgT=n=>{const k=n.filter(o=>byId(o.target)).length;return k?` · ⭐ ${k} mời đích danh`:''},nt=S.artists.filter(a=>a.status==='trainee').length;
      return det('mt-tts',`🌱 Dự án nhận thực tập sinh (${tO.length})${tgT(tO)}`,`<div class="small muted" style="margin-bottom:6px">Việc ngắn để thực tập sinh kiếm tiền, thêm fan và học kinh nghiệm. Tuần đi làm sẽ không tập ở công ty, nên cân nhắc với mục tiêu tăng ${EV_PCT}% chỉ số mỗi kỳ.</div>`+(tO.map(offCard).join('')||'<div class="card muted">Chưa có dự án cho thực tập sinh.</div>'),nt>0)
        +det('mt-off',`📨 Lời mời cho nghệ sĩ (${oO.length})${tgT(oO)}`,oO.map(offCard).join('')||'<div class="card muted">Chưa có lời mời. Sang tuần mới để nhận thêm.</div>',true)})()}`);
  },
  studio(){
    const all=acts(),A=all.filter(actFree),busyN=all.length-A.length;
    const opt=A.map(x=>`<option value="${x.k}">${esc(x.n)}</option>`).join('');const hiat=S.groups.filter(g=>g.hiatus>abs());
    const rp=rivalPress(),cb=S.rivals.filter(r=>r.cb&&r.cb.w>=abs()-1);
    const recs=A.map(x=>{const r=conceptRec(x);const b=r[0],c=r[1];return`<div class="prow"><b>${esc(x.n)}</b><span class="small">⭐ ${CONCEPTS[b.k].n}${trendTag(b.k)} ${Math.round(b.f)}% <span class="muted">· ${CONCEPTS[c.k].n}${trendTag(c.k)} ${Math.round(c.f)}%</span></span><span class="sp"></span><button class="btn sm" onclick="view(()=>viewCamp('${x.k}'))">📣</button><button class="btn sm pri" onclick="studioPick('${x.k}','${b.k}')">Chọn</button></div>`}).join('');
    modal(trainRoom(ROOMS[2],'rap',`
    <div class="card small">🔥 Thịnh hành: <b>${S.trend.hot.map(k=>CONCEPTS[k].n).join(', ')}</b> (+12 điểm) · ❄️ ${CONCEPTS[S.trend.cold].n} (−8) · còn ${S.trend.until-abs()} tuần${cb.length?`<br>⚔️ Đang comeback: ${cb.map(r=>esc(r.n)+' ('+CONCEPTS[r.cb.ck].n+')').join(', ')} → single ra lúc này bị trừ ${rp} điểm`:''}</div>
    <button class="btn" onclick="view(viewSec)">🗒️ Kế hoạch comeback của thư ký</button>
    ${songCard()}
    ${(()=>{const L=Object.values(S.camp).filter(c=>c.ph==='post');return L.length?`<h3>📣 Đang quảng bá (${L.length})</h3>${L.map(c=>`<div class="card row small"><b>${esc(c.n)}</b> «${esc(c.t)}» · #${c.rank} · 🏆${c.wins} · tuần ${c.wn+1}/${PROMO_WK}<span class="sp"></span><button class="btn sm pri" onclick="view(()=>viewCamp('${c.k}'))">Lịch sân khấu</button></div>`).join('')}`:''})()}
    ${hiat.length?`<div class="card small">⏸️ Tạm ngừng hoạt động: ${hiat.map(g=>`${esc(g.name)} (còn ${g.hiatus-abs()} tuần)`).join(', ')}</div>`:''}
    ${det('st-rec',`🎯 Đề xuất concept cho người rảnh (${A.length})`,(recs||'<div class="small muted">Không có nhóm/solo nào đang rảnh.</div>')+(busyN?`<div class="small muted">Ẩn ${busyN} nhóm/solo đang bận.</div>`:''),true)}
    <h3>💿 Phát hành single</h3>${A.length?`<div class="card"><div class="row"><select id="sAct">${opt}</select><select id="sCon">${Object.keys(CONCEPTS).map(k=>`<option value="${k}">${CONCEPTS[k].n}${trendTag(k)}</option>`).join('')}</select></div>
    <div class="row" style="margin-top:6px"><select id="sBud"><option value="30000000">Tiết kiệm – 30 tr</option><option value="80000000" selected>Tiêu chuẩn – 80 tr</option><option value="200000000">Bom tấn – 200 tr</option></select><input type="text" id="sTitle" placeholder="Tên bài hát (tuỳ chọn)" style="flex:1"></div>
    <div class="row" style="margin-top:6px"><select id="sSong" style="flex:1;min-width:0">${songOpts()}</select></div>
    <div class="small muted" id="sPrev" style="margin:6px 0"></div><button class="btn pink" onclick="releaseSingle()">Phát hành</button></div>`:`<div class="card small muted">${all.length?'Tất cả nhóm/solo đang bận. Chờ họ quay về nhé.':'Cần debut nhóm hoặc solo trước (Sảnh Tuyển dụng).'}</div>`}
    ${det('st-tbl','📋 Bảng chỉ số theo concept',`<div class="small muted">Tỉ trọng chỉ số quyết định điểm concept. Bạn bè trong nhóm cộng điểm, mâu thuẫn trừ điểm.</div>${wTable(CONCEPTS)}`,false)}
    <h3>🏟️ Tổ chức concert</h3>${A.length?`<div class="card"><div class="row"><select id="cAct">${opt}</select><button class="btn pri" onclick="holdConcert()">Tổ chức (200 tr)</button></div><div class="small muted">Cần tổng ≥ 30K fan. Doanh thu theo số vé bán.</div></div>`:'<div class="small muted">Không có ai rảnh.</div>'}
    ${det('st-hist','💿 Single đã phát hành',`<div class="small">${S.singles.slice(0,10).map(s=>`N${s.y} «${esc(s.title)}» – ${esc(s.act.slice(2))} – ${s.concept} – hạng ${s.rank}`).join('<br>')||'<span class="muted">Chưa có.</span>'}</div>`,false)}`));
    const up=()=>{const a=actByKey($('#sAct')?.value);if(!a)return;const m=a.m.map(byId).filter(Boolean),k=$('#sCon').value,w=CONCEPTS[k].w,tb=trendB(k);$('#sPrev').innerHTML=`Độ hợp concept: <b>${Math.round(m.reduce((s,x)=>s+fit(x,w),0)/m.length)}%</b> · Hòa hợp ${harmony(a.m)}${tb?` · ${tb>0?'🔥 hợp xu hướng +'+tb:'❄️ hết thời '+tb}`:''}${rp?` · ⚔️ đối thủ −${rp}`:''}${songPrev(a)}`};
    const pre=()=>{const A2=actByKey($('#sAct').value);if(!A2)return;const s=curSong();$('#sCon').value=s?s.ck:conceptRec(A2)[0].k;up()};
    if($('#sAct')){$('#sAct').onchange=pre;$('#sCon').onchange=up;$('#sSong').onchange=()=>{const s=curSong();if(s){$('#sCon').value=s.ck;$('#sTitle').value=s.t}else $('#sTitle').value='';up()};pre()}
  },
  acting(){
    const cands=S.artists.filter(a=>a.status==='debuted'&&!a.busy);
    modal(trainRoom(ROOMS[3],'acting',`
    <h3>🎬 Tự sản xuất phim</h3><div class="card"><div class="row"><select id="fGen">${Object.keys(GENRES).map(k=>`<option value="${k}">${GENRES[k].n}</option>`).join('')}</select><select id="fBud"><option value="300000000">Kinh phí thấp – 300 tr</option><option value="800000000">Trung bình – 800 tr</option><option value="2000000000">Bom tấn – 2 tỷ</option></select></div>
    <input type="text" id="fTitle" placeholder="Tên phim (tuỳ chọn)" style="width:100%;margin-top:6px">
    <div class="small" style="margin-top:6px">Chọn 1–3 vai chính (quay 8 tuần, ra rạp sau 2 tuần hậu kỳ):</div>
    <div class="list" id="fList">${cands.map(a=>`<label><input type="checkbox" class="fcast" value="${a.id}"> ${esc(a.name)} <span class="small muted" data-f="${a.id}"></span></label>`).join('')||'<div class="small muted">Không có nghệ sĩ đã ra mắt nào rảnh.</div>'}</div>
    <button class="btn pink" style="margin-top:6px" onclick="produceFilm()">Bấm máy</button></div>
    <div class="small muted">Góp vốn vào phim được mời tại Phòng Họp (phim truyền hình & điện ảnh).</div>
    ${det('fl-tbl','📋 Bảng chỉ số theo thể loại phim',wTable(GENRES),false)}
    ${det('fl-list',`🎞️ Phim của công ty (${S.films.length})`,S.films.slice().reverse().map(f=>`<div class="card small"><b>«${esc(f.title)}»</b> ${GENRES[f.genre].n} · ${f.own?'Tự sản xuất':'Góp vốn '+Math.round(f.share*100)+'%'} · Vốn ${fmt(f.cost)}<br>${f.done?`Doanh thu ${fmt(f.rev)} (x${f.mult}) · Nhận ${fmt(f.inc)}`:f.status+(f.releaseAt?` · chiếu sau ${f.releaseAt-abs()} tuần`:'')}${f.cast.length?' · Cast: '+f.cast.map(byId).filter(Boolean).map(a=>esc(a.name)).join(', '):''}</div>`).join('')||'<div class="small muted">Chưa có phim.</div>',true)}`));
    const up=()=>{const w=GENRES[$('#fGen').value].w;document.querySelectorAll('[data-f]').forEach(el=>{const a=byId(+el.dataset.f);el.textContent=`phù hợp ${Math.round(fit(a,w))}% · danh tiếng ${fame(a)}`})};
    $('#fGen').onchange=up;up();
  },
  vocal(){modal(trainRoom(ROOMS[4],'vocal'))},
  dance(){modal(trainRoom(ROOMS[5],'dance'))},
  gym(){modal(trainRoom(ROOMS[6],'gym'))},
  pr(){
    const sc=S.artists.filter(a=>a.scandal);
    const pl=prPlans();
    modal(trainRoom(ROOMS[7],'variety',`${det('pr-plan',`📣 Kế hoạch quảng bá đề xuất (${pl.length})`,prHTML(pl),true)}${det('pr-sc',`🚨 Scandal đang diễn ra (${sc.length})`,`${sc.map(a=>{const e=S.events.find(x=>x.kind==='scandal'&&x.a===a.id);return`<div class="card"><b>${esc(a.name)}</b>: ${esc(a.scandal.t)} · mức ${'🔥'.repeat(a.scandal.sev)} · còn ${a.scandal.left} tuần<div class="small muted">Fan giảm ${2*a.scandal.sev}%/tuần. Mức 2+ không thể nhận dự án.</div>${e?invBlock(a):''}${e?`<div class="row" style="margin-top:6px">${evInfo(e).o.map(o=>`<button class="btn sm" onclick="resolveEv(${e.id},'${o.k}')">${o.l}</button>`).join('')}</div>`:'<div class="small">Đã chọn im lặng, chờ dư luận lắng xuống.</div>'}</div>`}).join('')||'<div class="card small muted">Không có scandal nào. Truyền thông đang êm đẹp.</div>'}
    <div class="small muted">Hẹn hò bí mật làm tăng nguy cơ bị "khui". Công khai hẹn hò giúp loại bỏ rủi ro này.</div>`,sc.length>0)}${det('pr-hist',`🗂️ Kế hoạch đã duyệt (${(S.prHist||[]).length})`,(S.prHist||[]).slice(0,20).map(h=>`<div class="small">${esc(h)}</div>`).join('')||'<div class="small muted">Chưa duyệt kế hoạch nào.</div>',false)}`));
  },
  lobby(){
    const tr=S.artists.filter(a=>!a.busy);
    modal(`<h2>🌟 Sảnh Tuyển dụng</h2><div class="sub">Tuyển thực tập sinh và cho ra mắt nhóm, solo hoặc diễn viên. Không giới hạn số nghệ sĩ.</div>${dqBanner()}
    ${det('lb-cast',`🧑‍🎤 Ứng viên casting (${S.pool.length})`,`<div class="small muted" style="margin-bottom:6px">Ký hợp đồng 20 tr/người. Danh sách mới mỗi 4 tuần.</div>${repCard()}
    ${S.pool.map(a=>`<div class="card"><div class="row"><div class="chibi mini">${chibiHTML(a)}</div><div><b>${esc(a.name)}</b> <span class="small muted">${a.g==='F'?'Nữ':'Nam'}, ${a.age} · năng khiếu ${STATS[a.spec]} · tố chất x${a.talent}</span></div><span class="sp"></span><button class="btn sm pri" onclick="sign(${a.id})">Ký hợp đồng</button></div>${bars(a)}</div>`).join('')||'<div class="small muted">Hết ứng viên.</div>'}
    <button class="btn" onclick="recast()">Tổ chức casting mới (10 tr)</button>`,true)}
    ${det('lb-batches',`🌱 Các lứa thực tập sinh (${S.batches.length} lứa, ${S.artists.filter(a=>a.status==='trainee').length} TTS)`,batchHTML(),true)}
    ${det('lb-comp',`🏅 Cuộc thi cho thực tập sinh (${S.comps.length} đang mở)`,compHTML(),true)}
    ${(()=>{const ts=S.artists.filter(a=>a.status==='trainee'&&!a.busy).sort(eligSort);return ts.length?det('lb-rec',`🎯 Đề xuất hướng debut: tất cả thực tập sinh (${ts.length})`,`<div class="small muted" style="margin-bottom:4px">So sánh từng thực tập sinh khi ra solo, làm diễn viên hay vào nhóm. Chỉ đề xuất debut khi độ phù hợp trên ${DEBUT_MIN}%. Bấm "Áp dụng" để điền sẵn vào form bên dưới.</div><div class="card">${ts.map(recLine).join('')}</div>`,false):''})()}
    <h3>🎊 Debut</h3><div class="card"><div class="row"><select id="dType"><option value="group">Nhóm nhạc</option><option value="solo">Solo</option><option value="actor">Diễn viên</option></select><input type="text" id="dName" placeholder="Tên nhóm" style="flex:1"></div>
    <div id="dSug"></div><h3 style="margin-top:10px">Chọn nghệ sĩ</h3><div class="list" id="dList"></div><div class="card" id="dAna" style="margin-top:10px;background:var(--bg)"></div><div class="small muted" id="dCost" style="margin:6px 0"></div><button class="btn pink" onclick="debut()">Ra mắt</button></div>
    <div class="small muted">Một nghệ sĩ có thể vừa ở nhóm, vừa solo, vừa làm diễn viên. Idol đã ra mắt nhận được mọi loại dự án.</div>`);
    const up=()=>{const t=$('#dType').value;$('#dName').style.display=t==='group'?'':'none';
      let list=tr.filter(a=>t==='group'?!groupsOf(a).length:t==='solo'?!a.solo:!a.actor);
      const tbl=t==='actor'?GENRES:CONCEPTS,bf=a=>bestOf(a,tbl)[0];
      if(t!=='group')list.sort((x,y)=>bf(y).f-bf(x).f);list.sort((x,y)=>(dElig(y,t)?1:0)-(dElig(x,t)?1:0));
      let sug='';
      if(t==='group'&&list.length>=2){
        const L=Object.keys(CONCEPTS).map(k=>({k,...bestLineup(list,CONCEPTS[k].w)})).sort((a,b)=>b.sc-a.sc);
        sug=`<h3 style="margin-top:8px">💡 Đội hình gợi ý theo concept</h3>${L.map((x,i)=>`<div class="lineup"><div style="flex:1;min-width:0"><b>${i===0?'⭐ ':''}${CONCEPTS[x.k].n}</b> · hợp ${Math.round(x.f)}% · hòa hợp ${x.hm>=0?'+':''}${x.hm}<br><span class="muted">${x.ids.map(id=>esc(byId(id).name)).join(', ')}</span></div><button class="btn sm${i===0?' pri':''}" onclick="applyLineup([${x.ids}])">Chọn</button></div>`).join('')}`;
      }else if(t!=='group'&&list.length)sug=`<div class="small muted" style="margin-top:8px">Danh sách đã xếp theo độ hợp ${t==='solo'?'concept solo':'thể loại phim'}. ⭐ là 3 người hợp nhất.</div>`;
      $('#dSug').innerHTML=sug;
      $('#dList').innerHTML=list.map((a,i)=>{const b=bf(a);return`<label><input type="${t==='group'?'checkbox':'radio'}" name="dsel" class="dsel" value="${a.id}"> <span style="flex:1">${t!=='group'&&i<3?'⭐ ':''}${dElig(a,t)?'<span class="tag s">✅ Đủ ĐK</span> ':''}<b>${esc(a.name)}</b> <span class="small muted">${a.status==='trainee'?'TTS':'Đã ra mắt'} · V${Math.round(a.st.vocal)} N${Math.round(a.st.dance)} R${Math.round(a.st.rap)} D${Math.round(a.st.acting)} Vs${Math.round(a.st.visual)}<br>hợp nhất: ${tbl[b.k].n} ${Math.round(b.f)}%</span></span></label>`}).join('')||'<div class="small muted">Không có ai phù hợp đang rảnh.</div>';
      const cnt=()=>{const n=document.querySelectorAll('.dsel:checked').length;$('#dCost').textContent=`Chi phí: ${fmt(DEBUT_COST[t](Math.max(n,t==='group'?2:1)))}${t==='group'?' (120 tr + 20 tr/thành viên)':''}`;$('#dAna').innerHTML=debutAnalysis()};
      document.querySelectorAll('.dsel').forEach(x=>x.onchange=cnt);cnt()};
    $('#dType').onchange=up;up();
  },
  dorm(){
    const pairs=[];const seen=new Set();
    for(const a of S.artists)for(const id in a.tag){const k=[a.id,+id].sort().join('-');if(seen.has(k))continue;seen.add(k);const b=byId(+id);if(b)pairs.push({a,b,t:a.tag[id],v:getRel(a,b)})}
    const TN={friend:'🤝 Bạn thân',enemy:'⚡ Mâu thuẫn',dating:'💞 Hẹn hò bí mật',public:'💌 Hẹn hò công khai'};
    modal(trainRoom(ROOMS[9],'rest',`${det('dm-rel',`💞 Quan hệ nội bộ (${pairs.length})`,`<div class="small muted" style="margin-bottom:6px">Nghệ sĩ cùng nhóm hoặc cùng phòng tập dễ thân nhau hơn. Quan hệ tạo ra sự kiện bạn bè, mâu thuẫn, hẹn hò.</div>${pairs.map(p=>`<div class="card small row"><b>${esc(p.a.name)} & ${esc(p.b.name)}</b><span class="sp"></span>${TN[p.t]} <span class="muted">(${p.v})</span></div>`).join('')||'<div class="card small muted">Chưa có mối quan hệ đặc biệt nào.</div>'}`,true)}`));
  }
};

/* ================= MỞ RỘNG v2 ================= */
const MAX_SA=4,CT_WK=52;
const pct=p=>Math.round(p*100)+'%';
const MOOD=(a,d)=>a.mood=clamp(a.mood+d,0,100);
const asstOf=m=>(S.assts||[]).filter(x=>x.mid===m.id);
const asstB=(m,k)=>asstOf(m).filter(x=>x.k===k).reduce((t,x)=>t+x.v,0);
const otherMgr=(a,m)=>S.managers.find(x=>x!==m&&x.as&&mgrTargets(x).includes(a));

/* ---- Sổ thu chi ---- */
const FIN_I={dig:'🎧 Nhạc số',sgl:'💿 Bán single',job:'📨 Thù lao dự án',con:'🏟️ Concert & fan meeting',film:'🎞️ Phim',live:'📱 Livestream & quảng bá',biz:'📈 Đầu tư',oth:'➕ Khác'};
const FIN_X={sal:'💵 Lương nghệ sĩ',mgr:'📋 Lương quản lý & trợ lý',trn:'🏫 Đào tạo',prod:'🎬 Sản xuất & debut',hr:'🗂️ Hợp đồng & tuyển dụng',oth:'➖ Khác'};
function fcEnsure(){if(!S.fc)S.fc={w:abs(),m0:S.money,i:{},x:{}};return S.fc}
function book(c,v,arts){const f=fcEnsure();v=Math.round(v);if(!v)return;if(v>0)f.i[c]=(f.i[c]||0)+v;else f.x[c]=(f.x[c]||0)-v;
  if(arts&&arts.length&&v>0){const p=v/arts.length;arts.forEach(a=>{if(a){a.earn=(a.earn||0)+p;a.earnC=(a.earnC||0)+p}})}}
const fsum=o=>Object.values(o||{}).reduce((t,v)=>t+v,0);
function finClose(){const f=fcEnsure(),o=Math.round((S.money-f.m0)-(fsum(f.i)-fsum(f.x)));
  if(o>0)f.i.oth=(f.i.oth||0)+o;else if(o<0)f.x.oth=(f.x.oth||0)-o;
  S.fin=S.fin||[];S.fin.push({w:abs(),y:S.year,wk:S.week,i:f.i,x:f.x});if(S.fin.length>104)S.fin=S.fin.slice(-104);
  S.fc={w:abs()+1,m0:S.money,i:{},x:{}}}

/* ---- Nhạc số ---- */
function digTick(){let t=0;for(const s of S.singles){if(!s.dig||s.end)continue;const wk=abs()-s.w;if(wk<1)continue;
  const v=Math.round(s.dig*Math.pow(s.dk||.88,wk-1)*(1+bizLv('media')*.05)/1e4)*1e4;if(v<1e5||wk>52){s.end=1;continue}
  const net=Math.round(v*(1-(s.roy||0))/1e4)*1e4;s.dt=(s.dt||0)+net;s.dl=net;s.dlw=abs();t+=net;S.money+=net;book('dig',net,(s.m||[]).map(byId).filter(Boolean))}
  if(t)addLog(`🎧 Doanh thu nhạc số tuần này: ${fmt(t)}.`,'good');return t}
const digNext=s=>{if(!s.dig||s.end)return 0;const wk=abs()-s.w+1;const v=s.dig*Math.pow(s.dk||.88,wk-1);return v<1e5||wk>52?0:Math.round(v*(1-(s.roy||0)))};

/* ---- Danh tiếng & tuyển TTS ---- */
function compRep(){const tf=S.artists.reduce((t,a)=>t+a.fans,0),aw=(S.awards||[]).reduce((s,e)=>s+e.res.filter(r=>r.ok).length,0),hit=(S.singles||[]).filter(s=>s.rank<=10).length,lr=(S.awards||[]).length?S.awards[S.awards.length-1].rank:0;
  return clamp(Math.round(Math.min(55,Math.sqrt(tf/1500))+Math.min(20,aw*4)+Math.min(15,hit*3)+(lr===1?10:lr===2?6:lr===3?3:0)),0,100)}
const poolSize=()=>3+Math.floor(compRep()/15);
const repStars=r=>'★'.repeat(1+Math.floor(Math.min(r,99)/25))+'☆'.repeat(4-Math.floor(Math.min(r,99)/25));
function repCard(){const r=compRep();return`<div class="card small">🏢 <b>Danh tiếng công ty: ${r}/100</b> <span style="color:var(--sun)">${repStars(r)}</span><br>Mỗi đợt casting nhận <b>${poolSize()} hồ sơ</b> · mỗi tuần ~${Math.round(r/1.2)}% có TTS tự gửi đơn · chất lượng hồ sơ +${Math.floor(r/12)} chỉ số khởi điểm.<br><span class="muted">Tăng nhờ tổng fan, giải thưởng, single top 10 và hạng công ty cuối năm.</span></div>`}

/* ---- Lứa TTS tự xoá ---- */
function cleanBatches(){if(!Array.isArray(S.batches))return;for(const b of S.batches)if(bMem(b).length)b.had=1;
  const gone=S.batches.filter(b=>b.had&&!bMem(b).length);if(!gone.length)return;
  S.batches=S.batches.filter(b=>!gone.includes(b));
  for(const b of gone){addLog(`🗑️ ${b.n} không còn thực tập sinh nên đã tự xoá.`);for(const m of S.managers)if(m.as&&m.as.t==='b'&&m.as.id===b.id){m.as=null;addLog(`📋 ${m.name} rảnh việc vì ${b.n} đã giải thể, hãy giao lứa khác.`)}}
  if(!S.batches.some(b=>b.id===S.curBatch))S.curBatch=S.batches.length?S.batches[S.batches.length-1].id:0;S.props=null}
function ensureCurBatch(){if(!S.batches.some(b=>b.id===S.curBatch)){const b={id:uid(),n:'Lứa '+(++S.bno),w:abs()};S.batches.push(b);S.curBatch=b.id;addLog(`🌱 Tự mở ${b.n} cho thực tập sinh mới.`,'good')}return S.curBatch}

/* ---- Chừa lịch debut ---- */
const dHold=a=>a.status==='trainee'&&a.dReady&&!a.noHold;
function debutHoldTick(){for(const a of S.artists){if(a.status!=='trainee')continue;const r=debutRec(a),ok=r.t!=='wait';
  if(ok&&!a.dReady){a.dReady=1;addLog(`🎊 TTS ${a.name} đủ điều kiện debut (${r.short}). Công ty chừa lịch, không nhận dự án ngoài để ưu tiên debut.`,'gold')}else if(!ok)a.dReady=0}}
function toggleHold(id){const a=byId(id);if(a){a.noHold=!a.noHold;addLog(a.noHold?`📅 Mở lịch cho ${a.name} nhận dự án dù đã đủ điều kiện debut.`:`📅 Chừa lịch debut cho ${a.name}.`);act()}}

/* ---- Tiền bối dẫn dắt ---- */
const menteesOf=m=>S.artists.filter(a=>a.status==='trainee'&&a.mt===m.id);
function mtB(a,s){if(!a.mt)return 1;const m=byId(a.mt);if(!m||m.busy)return 1;return 1+clamp((m.st[s]-a.st[s])/150,0,.4)}
function mentorScore(m,a){return focusKeys(a).reduce((t,k)=>t+Math.max(0,m.st[k]-a.st[k]),0)/4+(a.tag[m.id]==='friend'?6:a.tag[m.id]==='enemy'?-20:0)}
function mentorSug(a){return S.artists.filter(m=>m.status==='debuted'&&(menteesOf(m).length<2||a.mt===m.id)).sort((x,y)=>mentorScore(y,a)-mentorScore(x,a))[0]}
function setMentor(tid,mid){const a=byId(tid);if(!a||a.status!=='trainee')return;mid=+mid;
  if(!mid){if(a.mt){const o=byId(a.mt);addLog(`👩‍🏫 ${o?o.name:'Tiền bối'} thôi dẫn dắt ${a.name}.`)}a.mt=0;return act()}
  const m=byId(mid);if(!m||m.status!=='debuted')return act();if(menteesOf(m).filter(x=>x!==a).length>=2){toast(`${m.name} đã dẫn dắt đủ 2 TTS`);return act()}
  a.mt=m.id;setRel(a,m,getRel(a,m)+10);addLog(`👩‍🏫 ${m.name} nhận dẫn dắt thực tập sinh ${a.name}.`,'good');act()}
function mentorSel(a){const s=mentorSug(a);return`<select onchange="setMentor(${a.id},this.value)" aria-label="Tiền bối dẫn dắt"><option value="0">— Chưa có tiền bối —</option>${S.artists.filter(m=>m.status==='debuted').sort((x,y)=>((menteesOf(x).length>=2&&a.mt!==x.id)-(menteesOf(y).length>=2&&a.mt!==y.id))||mentorScore(y,a)-mentorScore(x,a)).map(m=>{const full=menteesOf(m).length>=2&&a.mt!==m.id;return`<option value="${m.id}" ${a.mt===m.id?'selected':''} ${full?'disabled':''}>${s===m?'💡 ':''}${esc(m.name)} (+${Math.round(mentorScore(m,a))})${full?' – đủ 2 TTS':''}</option>`}).join('')}</select>`}
function mentorTick(){for(const a of S.artists){if(a.status!=='trainee'||!a.mt)continue;const m=byId(a.mt);if(!m||m.status!=='debuted'){a.mt=0;continue}
  if(m.busy)continue;m.energy=clamp(m.energy-3,0,100);MOOD(m,1);MOOD(a,2);setRel(a,m,getRel(a,m)+R(1,4));
  if(!a.tag[m.id]&&getRel(a,m)>=60){setTag(a,m,'friend');addLog(`🤝 ${a.name} và tiền bối ${m.name} trở nên thân thiết.`,'good')}}}

/* ---- Trợ lý quản lý ---- */
function hireAsst(mid,k,v,name,fee,sal){const m=S.managers.find(x=>x.id===mid);if(!m)return false;if(asstOf(m).length>=2){toast('Mỗi quản lý tối đa 2 trợ lý');return false}if(S.money<fee){toast('Không đủ tiền');return false}
  S.money-=fee;book('hr',-fee);S.assts=S.assts||[];S.assts.push({id:uid(),mid,k,v,name,sal});addLog(`🧑‍💻 Tuyển trợ lý ${name} cho QL ${m.name}: ${MSK[k]} +${v}.`,'good');return true}
function fireAsst(id){const x=(S.assts||[]).find(z=>z.id===id);if(!x)return;S.assts=S.assts.filter(z=>z!==x);addLog(`👋 Cho trợ lý ${x.name} nghỉ việc.`);act()}

/* ---- Tình huống quản lý & nghệ sĩ ---- */
const mxP=(m,k,b)=>clamp(b+(m?effSk(m,k):0)*.06,.05,.95);
const lowK=a=>focusKeys(a).reduce((m,x)=>a.st[x]<a.st[m]?x:m);
const SCOUT_W=['ở quán cà phê gần phim trường','trong buổi fan meeting','ở một lễ hội âm nhạc trường học','tại cuộc thi hát karaoke khu phố','trên chuyến tàu đi quay ngoại cảnh','khi xem một buổi diễn đường phố'];
const MXS={
 fan:{who:'d',ic:'🕵️',t:(a,m)=>`Fan cuồng bám theo ${a.name}`,d:(a,m)=>`Quản lý ${m.name} báo: vài fan cuồng theo dõi ${a.name} tới tận ký túc xá và chụp lén. ${a.name} rất hoảng sợ.`,
  o:(a,m)=>[{k:'guard',l:'Thuê vệ sĩ (20 tr)'},{k:'mgr',l:`QL tự nói chuyện với fan (~${pct(mxP(m,'care',.35))})`},{k:'police',l:`Báo công an & cảnh báo fan (~${pct(mxP(m,'pr',.4))})`},{k:'no',l:'Mặc kệ'}],
  r:{guard:(a,m)=>{S.money-=20e6;MOOD(a,10);return[`🛡️ Vệ sĩ hộ tống ${a.name}, cậu ấy yên tâm trở lại.`,'good']},
   mgr:(a,m)=>Math.random()<mxP(m,'care',.35)?(MOOD(a,12),mgrExp(m,1),[`🤝 ${m.name} khéo léo nói chuyện với nhóm fan, ${a.name} rất cảm động.`,'good']):(MOOD(a,-10),[`😰 ${m.name} xử lý vụng về, fan cuồng vẫn bám theo ${a.name}.`,'bad']),
   police:(a,m)=>Math.random()<mxP(m,'pr',.4)?(a.fans=Math.round(a.fans*1.02),MOOD(a,8),[`🚓 Công ty lên tiếng cứng rắn, fan chân chính ủng hộ ${a.name}.`,'good']):(a.fans=Math.round(a.fans*.98),[`📰 Thông báo bị cho là "làm quá", một số fan phật ý.`,'bad']),
   no:(a,m)=>{MOOD(a,-15);a.energy=clamp(a.energy-15,0,100);return[`😞 ${a.name} mất ngủ vì bị theo dõi.`,'bad']}}},
 late:{who:'x',ic:'⏰',t:(a,m)=>`${a.name} đến muộn ${a.status==='trainee'?'buổi tập':'buổi ghi hình'}`,d:(a,m)=>a.status==='trainee'?`Huấn luyện viên phàn nàn với QL ${m.name}: ${a.name} đến muộn 40 phút, cả lứa phải chờ.`:`Đối tác gọi cho QL ${m.name} phàn nàn vì ${a.name} đến muộn, cả ê-kíp phải chờ.`,
  o:(a,m)=>[{k:'apol',l:a.status==='trainee'?`QL kèm riêng để bù buổi (~${pct(mxP(m,'plan',.4))})`:`QL xin lỗi & dàn xếp (~${pct(mxP(m,'nego',.4))})`},{k:'talk',l:`Hỏi rõ lý do (~${pct(mxP(m,'care',.4))})`},{k:'fine',l:'Phạt nghệ sĩ'},{k:'no',l:'Bỏ qua'}],
  r:{apol:(a,m)=>{const tts=a.status==='trainee',ok=Math.random()<mxP(m,tts?'plan':'nego',.4);if(tts){if(ok){const k=lowK(a);a.st[k]=clamp(+(a.st[k]+1.5).toFixed(1),0,100);mgrExp(m,1);return[`📚 ${m.name} kèm riêng, ${a.name} bù được buổi tập (${STATS[k]} +1.5).`,'good']}MOOD(a,-4);return[`😓 Buổi kèm riêng không hiệu quả, ${a.name} vẫn chậm tiến độ.`,'bad']}
    const p=Object.keys(a.pw)[0];if(ok){mgrExp(m,1);return[`🙏 ${m.name} dàn xếp êm đẹp với đối tác, không ảnh hưởng quan hệ.`,'good']}if(p)S.partners[p]=clamp((S.partners[p]||0)-6,0,100);return[`😬 Đối tác vẫn không hài lòng${p?`, quan hệ với ${p} −6`:''}.`,'bad']},
   talk:(a,m)=>Math.random()<mxP(m,'care',.4)?(a.energy=clamp(a.energy+20,0,100),MOOD(a,8),[`💬 ${m.name} phát hiện ${a.name} kiệt sức vì lịch dày, điều chỉnh để cậu ấy hồi sức.`,'good']):(MOOD(a,-3),[`💬 ${a.name} không chịu chia sẻ, ${m.name} chưa tìm ra nguyên nhân.`]),
   fine:(a,m)=>{MOOD(a,-10);const k=lowK(a);a.st[k]=clamp(+(a.st[k]+.8).toFixed(1),0,100);return[`📏 ${a.name} bị phạt, nghiêm túc hơn nhưng buồn bã.`]},
   no:(a,m)=>{if(a.status!=='trainee'){const p=Object.keys(a.pw)[0];if(p)S.partners[p]=clamp((S.partners[p]||0)-4,0,100)}return[`🤷 Bỏ qua chuyện ${a.name} đến muộn.`]}}},
 cry:{who:'t',ic:'😢',t:(a,m)=>`TTS ${a.name} muốn bỏ cuộc`,d:(a,m)=>`QL ${m.name} thấy ${a.name} khóc sau buổi tập. Áp lực đánh giá khiến em muốn rời chương trình đào tạo.`,
  o:(a,m)=>{const s=a.mt?byId(a.mt):S.artists.find(x=>x.status==='debuted'&&!x.busy);return[{k:'rest',l:'Cho nghỉ 1 tuần'},{k:'mgr',l:`QL tâm sự (~${pct(mxP(m,'care',.4))})`},...(s?[{k:'senior',l:`Nhờ tiền bối ${s.name} động viên`}]:[]),{k:'no',l:'Mặc kệ'}]},
  r:{rest:(a,m)=>{if(!a.busy)a.busy={kind:'leave',title:'Nghỉ lấy lại tinh thần',left:1,total:1};a.energy=100;MOOD(a,15);return[`🌴 ${a.name} được nghỉ 1 tuần để lấy lại tinh thần.`]},
   mgr:(a,m)=>Math.random()<mxP(m,'care',.4)?(MOOD(a,22),mgrExp(m,1),[`🫂 ${m.name} tâm sự cả buổi tối, ${a.name} quyết tâm tiếp tục.`,'good']):(MOOD(a,-5),[`😔 ${a.name} vẫn chưa nguôi sau buổi nói chuyện.`,'bad']),
   senior:(a,m)=>{const s=a.mt?byId(a.mt):S.artists.find(x=>x.status==='debuted'&&!x.busy);if(!s)return[`Không tìm được tiền bối nào rảnh.`];MOOD(a,18);setRel(a,s,getRel(a,s)+15);s.energy=clamp(s.energy-8,0,100);return[`🌟 ${s.name} kể lại thời TTS của mình, ${a.name} được tiếp thêm động lực.`,'good']},
   no:(a,m)=>{MOOD(a,-15);if(a.mood<12){removeArtist(a,'xin rút khỏi chương trình đào tạo');return null}return[`😞 ${a.name} càng thêm chán nản.`,'bad']}}},
 clash:{who:'x',ic:'🗯️',t:(a,m)=>`QL ${m.name} và ${a.name} bất đồng lịch trình`,d:(a,m)=>`${m.name} muốn ${a.name} tập thêm ${STATS[lowK(a)]} đang yếu, còn ${a.name} muốn được nghỉ ngơi. Hai bên nhờ Giám đốc phân xử.`,
  o:(a,m)=>[{k:'mgr',l:'Nghe theo quản lý'},{k:'mix',l:`Thỏa hiệp (~${pct(mxP(m,'plan',.35))})`},{k:'art',l:'Nghe theo nghệ sĩ'}],
  r:{mgr:(a,m)=>{const k=lowK(a);a.st[k]=clamp(+(a.st[k]+1.5).toFixed(1),0,100);MOOD(a,-8);a.energy=clamp(a.energy-10,0,100);return[`📋 ${a.name} tập thêm theo QL (${STATS[k]} +1.5) nhưng không vui.`]},
   mix:(a,m)=>{if(Math.random()<mxP(m,'plan',.35)){const k=lowK(a);a.st[k]=clamp(+(a.st[k]+1).toFixed(1),0,100);MOOD(a,4);mgrExp(m,1);return[`🤝 ${m.name} và ${a.name} tìm được lịch cân bằng (${STATS[k]} +1).`,'good']}MOOD(a,-3);return[`😐 Thỏa hiệp không thành, cả hai đều chưa hài lòng.`]},
   art:(a,m)=>{MOOD(a,10);a.energy=clamp(a.energy+10,0,100);return[`😌 ${a.name} được nghỉ ngơi như mong muốn.`]}}},
 injury:{who:'x',ic:'🩹',t:(a,m)=>`${a.name} bị chấn thương khi tập`,d:(a,m)=>`QL ${m.name} báo ${a.name} bị bong gân khi tập vũ đạo. Bác sĩ khuyên nên nghỉ.`,
  o:(a,m)=>[{k:'vip',l:'Vật lý trị liệu cao cấp, nghỉ 1 tuần (30 tr)'},{k:'push',l:`Tập nhẹ tiếp (~${pct(mxP(m,'care',.4))} ổn)`},{k:'treat',l:'Điều trị & nghỉ 2 tuần (10 tr)'}],
  r:{vip:(a,m)=>{S.money-=30e6;if(!a.busy)a.busy={kind:'leave',title:'Trị liệu chấn thương',left:1,total:1};a.energy=100;return[`🏥 ${a.name} hồi phục nhanh nhờ trị liệu cao cấp.`,'good']},
   push:(a,m)=>{if(Math.random()<mxP(m,'care',.4)){a.energy=clamp(a.energy-10,0,100);return[`💪 ${a.name} tập nhẹ, chấn thương không nặng thêm.`]}if(!a.busy)a.busy={kind:'leave',title:'Chấn thương nặng hơn',left:3,total:3};MOOD(a,-15);return[`🚑 Chấn thương của ${a.name} nặng hơn, phải nghỉ 3 tuần!`,'bad']},
   treat:(a,m)=>{S.money-=10e6;if(!a.busy)a.busy={kind:'leave',title:'Điều trị chấn thương',left:2,total:2};a.energy=100;return[`🩹 ${a.name} nghỉ 2 tuần điều trị.`]}}},
 leak:{who:'d',ic:'📸',t:(a,m)=>`Ảnh hậu trường của ${a.name} bị lộ`,d:(a,m)=>`Một loạt ảnh hậu trường của ${a.name} lan truyền trên mạng. Dư luận đang chia hai phe.`,
  o:(a,m)=>[{k:'pr',l:`QL xử lý truyền thông (~${pct(mxP(m,'pr',.4))})`},{k:'content',l:`Biến thành nội dung quảng bá (~${pct(clamp(.2+a.st.variety/100,.1,.9))})`},{k:'silent',l:'Im lặng'}],
  r:{pr:(a,m)=>{if(Math.random()<mxP(m,'pr',.4)){a.fans=Math.round(a.fans*1.03)+500;mgrExp(m,1);return[`📰 ${m.name} xoay chuyển dư luận, ${a.name} được khen "đời thường dễ thương".`,'good']}if(!a.scandal){a.scandal={t:'Ảnh hậu trường gây tranh cãi',sev:1,left:3,truth:true,dating:false,other:0};pushEv({kind:'scandal',a:a.id},true)}return[`🚨 Xử lý thất bại, chuyện ảnh lộ thành scandal nhỏ.`,'bad']},
   content:(a,m)=>{if(Math.random()<clamp(.2+a.st.variety/100,.1,.9)){const g=R(1500,5000)+Math.round(a.fans*.02);a.fans+=g;a.yr.fans+=g;return[`😂 ${a.name} tự trêu mình trên mạng, viral! +${fmtN(g)} fan.`,'good']}a.fans=Math.round(a.fans*.97);return[`😬 Màn "biến khủng hoảng thành cơ hội" bị chê gượng gạo.`,'bad']},
   silent:(a,m)=>{a.fans=Math.round(a.fans*.99);return[`🤐 Công ty im lặng, chuyện ảnh lộ dần chìm.`]}}},
 brand:{who:'d',ic:'🛍️',t:(a,m)=>`Nhãn hàng muốn ký gấp với ${a.name}`,d:(a,m)=>`Một nhãn hàng liên hệ QL ${m.name}, muốn ${a.name} quay quảng cáo ngay tuần này dù trùng lịch tập. Thù lao ${fmt(Math.round((5+fame(a)*.6))*1e6)}.`,
  o:(a,m)=>[{k:'take',l:'Nhận ngay'},{k:'nego',l:`QL đàm phán dời lịch (~${pct(mxP(m,'nego',.35))})`},{k:'no',l:'Từ chối'}],
  r:{take:(a,m)=>{const p=Math.round((5+fame(a)*.6))*1e6;S.money+=p;book('job',p,[a]);a.energy=clamp(a.energy-20,0,100);MOOD(a,-5);a.fans+=R(300,1500);return[`🛍️ ${a.name} quay quảng cáo gấp, nhận ${fmt(p)} nhưng khá mệt.`,'good']},
   nego:(a,m)=>{const p=Math.round((5+fame(a)*.6)*1.2)*1e6;if(Math.random()<mxP(m,'nego',.35)){S.money+=p;book('job',p,[a]);a.fans+=R(300,1500);mgrExp(m,1);return[`🤝 ${m.name} dời được lịch quay và nâng thù lao lên ${fmt(p)}.`,'good']}MOOD(a,-3);return[`💨 Nhãn hàng chọn người khác vì không chờ được.`,'bad']},
   no:(a,m)=>{MOOD(a,2);return[`🙅 Từ chối quảng cáo để ${a.name} tập trung luyện tập.`]}}},
 burn:{who:'x',ic:'🥵',ok:(a,m)=>mgrTargets(m).length>=2,t:(a,m)=>`QL ${m.name} kiệt sức`,d:(a,m)=>`${m.name} ôm ${mgrTargets(m).length} người, chạy lịch cả cuối tuần. ${a.name} lo lắng vì quản lý hay quên việc.`,
  o:(a,m)=>[{k:'raise',l:'Tăng lương QL 2 tr/tuần'},...(asstOf(m).length<2?[{k:'asst',l:`Tuyển trợ lý ngay (15 tr)`}]:[]),{k:'talk',l:'Động viên tinh thần'}],
  r:{raise:(a,m)=>{m.salary+=2e6;mgrExp(m,2);return[`💸 ${m.name} được tăng lương, làm việc hăng hái hơn.`,'good']},
   asst:(a,m)=>{const k=Object.keys(MSK).reduce((x,y)=>m.sk[y]<m.sk[x]?y:x);hireAsst(m.id,k,1,pick(LNM)+' '+pick(FN.concat(MN)),15e6,1e6);return null},
   talk:(a,m)=>{if(Math.random()<.5)return[`☕ ${m.name} được động viên, tạm ổn trở lại.`];const ks=Object.keys(MSK).filter(k=>m.sk[k]>1),k=ks.length?pick(ks):null;if(k)m.sk[k]--;return[`😵 ${m.name} vẫn quá tải${k?`, kỹ năng ${MSK[k]} −1`:''}.`,'bad']}}},
 song:{who:'d',ic:'✍️',ok:(a,m)=>a.st.vocal+a.st.rap>=60,t:(a,m)=>`${a.name} muốn tự sáng tác`,d:(a,m)=>`${a.name} nhờ QL ${m.name} xin phép Giám đốc: cậu ấy đã viết sẵn một bản demo và muốn gửi cho GĐ Âm nhạc nghe thử.`,
  o:(a,m)=>[{k:'yes',l:'Ủng hộ, gửi demo cho GĐ Âm nhạc'},{k:'no',l:'Để lần sau'}],
  r:{yes:(a,m)=>{const ck=bestOf(a,CONCEPTS)[0].k,s=mkSong([a.id],ck,'',false);a.cs=(a.cs||0)+1;MOOD(a,10);return[`🎼 Demo «${s.t}» của ${a.name} đã gửi GĐ Âm nhạc chờ duyệt (Phòng Thu âm).`,'good']},
   no:(a,m)=>{MOOD(a,-6);return[`😕 ${a.name} hơi buồn vì chưa được thử sức sáng tác.`]}}},
 fight:{who:'t',ic:'⚡',pre:(a,m)=>{const ms=S.artists.filter(x=>x!==a&&x.status==='trainee'&&x.batch===a.batch);return ms.length?{b:pick(ms).id}:null},
  t:(a,m,e)=>`TTS ${a.name} cãi nhau với ${byId(e.b)?.name||'bạn cùng lứa'}`,d:(a,m,e)=>`QL ${m.name} báo hai TTS cùng lứa to tiếng trong phòng tập vì tranh vị trí center.`,
  o:(a,m)=>[{k:'mgr',l:`QL hòa giải (~${pct(mxP(m,'care',.4))})`},{k:'both',l:'Phạt cả hai'},{k:'no',l:'Để tự giải quyết'}],
  r:{mgr:(a,m,e)=>{const b=byId(e.b);if(!b)return null;if(Math.random()<mxP(m,'care',.4)){setRel(a,b,getRel(a,b)+20);MOOD(a,3);MOOD(b,3);mgrExp(m,1);return[`🕊️ ${a.name} và ${b.name} làm hòa nhờ ${m.name}.`,'good']}setRel(a,b,getRel(a,b)-10);return[`💢 Hòa giải thất bại, ${a.name} và ${b.name} càng xa cách.`,'bad']},
   both:(a,m,e)=>{const b=byId(e.b);if(!b)return null;MOOD(a,-8);MOOD(b,-8);setRel(a,b,getRel(a,b)+5);return[`📏 Cả hai bị phạt dọn phòng tập, cùng chịu phạt nên dần thông cảm.`]},
   no:(a,m,e)=>{const b=byId(e.b);if(!b)return null;setRel(a,b,getRel(a,b)+R(-20,10));if(getRel(a,b)<=-40&&a.tag[b.id]!=='enemy'){setTag(a,b,'enemy');return[`⚡ ${a.name} và ${b.name} trở thành đối thủ.`,'bad']}return[`🤷 ${a.name} và ${b.name} tự giải quyết với nhau.`]}}}
};
function mxTick(){for(const m of S.managers){if(!m.as)continue;const ts=mgrTargets(m);if(!ts.length)continue;
  if(Math.random()<.07){const a=pick(ts);if(!S.events.some(e=>e.a===a.id)){const ks=Object.keys(MXS).filter(k=>{const D=MXS[k],w=D.who;return(w==='x'||(w==='d'&&a.status==='debuted')||(w==='t'&&a.status==='trainee'))&&(!D.ok||D.ok(a,m))});
    if(ks.length){const k=pick(ks),D=MXS[k],ex=D.pre?D.pre(a,m):{};if(ex)pushEv({kind:'mx',mx:k,a:a.id,m:m.id,...ex})}}}
  if(Math.random()<.045&&asstOf(m).length<2&&!S.events.some(e=>e.kind==='mp'&&e.m===m.id)){const k=Object.keys(MSK).reduce((x,y)=>m.sk[y]<m.sk[x]?y:x),v=R(1,3);pushEv({kind:'mp',t:'asst',m:m.id,k,v,name:pick(LNM)+' '+pick(FN.concat(MN)),fee:v*8e6,sal:v*1e6})}
  else if(Math.random()<.035&&!S.events.some(e=>e.kind==='mp'&&e.t==='scout')){const a=pick(ts),c=genArtist();c.talent=+rnd(1.05,1.3).toFixed(2);c.st[c.spec]=clamp(c.st[c.spec]+R(8,15),0,80);pushEv({kind:'mp',t:'scout',m:m.id,a:a.id,cand:c,where:pick(SCOUT_W)})}}}
function candBlock(c){return`<div class="card" style="background:var(--bg)"><div class="row"><div class="chibi mini">${chibiHTML(c)}</div><div class="small"><b>${esc(c.name)}</b> · ${c.g==='F'?'Nữ':'Nam'}, ${c.age} · năng khiếu ${STATS[c.spec]} · tố chất x${c.talent}</div></div>${bars(c)}</div>`}

/* ---- Nhóm giải tán ---- */
const gMgr=g=>S.managers.find(m=>m.as&&m.as.t==='g'&&m.as.id===g.id);
const gHiatus=k=>{if(!k||k[0]!=='g')return false;const g=S.groups.find(x=>'g'+x.id===k);return!!(g&&g.hiatus>abs())};
function disbandTick(){for(const g of S.groups){if(g.hiatus){if(g.hiatus<=abs()){g.hiatus=0;addLog(`🎉 Nhóm ${g.name} kết thúc thời gian tạm ngừng, sẵn sàng hoạt động trở lại.`,'good')}else continue}
  if(g.members.length<2||S.events.some(e=>e.kind==='disband'&&e.g===g.id))continue;
  const ms=g.members.map(byId).filter(Boolean),h=harmony(g.members),am=ms.reduce((t,a)=>t+a.mood,0)/ms.length,age=S.year-g.y;
  const p=.002+(h<0?.025:0)+(h<-6?.03:0)+(am<35?.03:0)+(age>=4?.01:0);
  if(Math.random()<p){const why=h<0?'mâu thuẫn nội bộ kéo dài':am<35?'các thành viên kiệt sức, tâm trạng sa sút':age>=4?'các thành viên muốn theo đuổi con đường riêng':'bất đồng về định hướng âm nhạc';pushEv({kind:'disband',g:g.id,a:ms[0].id,why},true);addLog(`⚠️ Nhóm ${g.name} có nguy cơ tan rã: ${why}.`,'bad')}}}
function disbandGroup(g,why){const ms=g.members.map(byId).filter(Boolean);S.groups=S.groups.filter(x=>x!==g);
  for(const m of S.managers)if(m.as&&m.as.t==='g'&&m.as.id===g.id)m.as=null;
  if(S.camp)delete S.camp['g'+g.id];S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!=='g'+g.id);
  ms.forEach(a=>{a.fans=Math.round(a.fans*.88);MOOD(a,-8);a.hist.unshift(`N${S.year}: Nhóm ${g.name} giải tán`)});
  S.props=null;addLog(`💔 Nhóm ${g.name} chính thức giải tán (${why}). Các thành viên vẫn ở lại công ty, có thể ra solo, làm diễn viên hoặc vào nhóm mới.`,'bad')}
const fixP=g=>{const m=gMgr(g);return clamp(.35+(m?effSk(m,'care')*.05:0)+(harmony(g.members)>=0?.15:0),.1,.92)};

/* ---- Hợp đồng & tái ký ---- */
function ctInit(a){if(a.status==='debuted'&&!a.ce){a.ce=abs()+R(10,40);a.cs0=abs()-R(5,30);a.earnC=a.earnC||0;if(a.cf0==null)a.cf0=Math.round(a.fans*.7)}}
function renewEval(a,mul=1){const wk=Math.max(1,abs()-(a.cs0||abs()-26)),cost=a.salary*wk,earn=Math.round(a.earnC||0),roi=earn/Math.max(cost,1),grow=a.fans-(a.cf0||0),gp=grow/Math.max(a.cf0||0,3000)*100,L=[];let sc=50;
  sc+=clamp((roi-1)*20,-25,25);L.push(`💰 Doanh thu mang về ${fmt(earn)} so với lương đã trả ~${fmt(cost)} (x${roi.toFixed(2)})`);
  sc+=clamp(gp/5,-10,15);L.push(`💗 Fan ${grow>=0?'+':''}${fmtN(grow)} trong hợp đồng (${gp>=0?'+':''}${Math.round(gp)}%)`);
  sc+=fame(a)*.15;L.push(`⭐ Danh tiếng ${fame(a)}/100`);
  if(a.evG){sc+=a.evG==='Xuất sắc'?8:a.evG==='Không đạt'?-12:0;L.push(`📋 Đánh giá gần nhất: ${a.evG}${a.evFail?` (trượt ${a.evFail} lần liên tiếp)`:''}`)}
  sc-=(a.evFail||0)*2;if(a.scandal){sc-=10;L.push('🚨 Đang dính scandal')}
  if(a.mood<35)L.push(`🙁 Tâm trạng thấp (${Math.round(a.mood)}), dễ từ chối tái ký`);
  sc=clamp(Math.round(sc),0,100);
  const rec=sc>=58?['Nên tái ký','m']:sc>=40?['Cân nhắc kỹ','s']:['Nên kết thúc hợp đồng','r'];
  const dem=Math.round(Math.max(a.salary*1.1,1e6+fame(a)*.5e6)*(1-msk(a,'nego')*.02)*mul/1e6)*1e6;
  const p=clamp(.5+(a.mood-50)/120+msk(a,'care')*.03+(fame(a)>60?-.1:0)+(mul>1?.25:0),.08,.97);
  return{sc,rec,L,dem,p}}
function renewBlock(a,mul=1){if(!a)return'';const E=renewEval(a,mul);return`<div class="card" style="background:var(--bg);margin-bottom:8px"><div class="row"><b>📊 Đánh giá tái ký</b><span class="sp"></span><span class="tag ${E.rec[1]}">${E.rec[0]}</span></div>
  <div class="bar" style="margin:4px 0"><i style="width:${E.sc}%"></i></div><div class="small muted">Điểm ${E.sc}/100 (≥58 nên tái ký, &lt;40 nên kết thúc)</div>
  <div class="small" style="margin-top:4px">${E.L.join('<br>')}</div>
  <div class="small" style="margin-top:6px">Nghệ sĩ đòi lương <b>${fmt(E.dem)}</b>/tuần (hiện ${fmt(a.salary)}) · Khả năng đồng ý ~<b>${pct(E.p)}</b> · Phí ký ${fmt(E.dem*4)}/năm · Hết hạn sau <b>${a.ce-abs()}</b> tuần${mul>1?'<br>⚠️ Lần đàm phán thứ hai, nghệ sĩ đòi cao hơn 30%.':''}</div></div>`}
function renewOpts(a,mul=1){const E=renewEval(a,mul);return[1,2,3].map(y=>({k:'r'+y,l:`Tái ký ${y} năm (phí ${fmt(E.dem*4*y)})`})).concat([{k:'end',l:'Kết thúc hợp đồng'},{k:'later',l:'Để sau'}])}
function renewDo(id,k,mul=1,quiet){const a=byId(id);if(!a)return true;
  if(k[0]==='r'){const y=+k.slice(1),E=renewEval(a,mul),bonus=E.dem*4*y;if(S.money<bonus){toast('Không đủ tiền phí ký hợp đồng');return false}
    S.events=S.events.filter(e=>!(e.kind==='renew'&&e.a===id));
    if(Math.random()<E.p+(y===1?.05:y===3?-.05:0)){S.money-=bonus;book('hr',-bonus);a.salary=E.dem;a.ce=Math.max(a.ce,abs())+y*52;a.cs0=abs();a.earnC=0;a.cf0=a.fans;a.ceNo=0;MOOD(a,10);addLog(`✍️ ${a.name} tái ký ${y} năm: lương ${fmt(a.salary)}/tuần, phí ký ${fmt(bonus)}.`,'good')}
    else{MOOD(a,-5);if(mul<1.3){addLog(`🙅 ${a.name} từ chối đề nghị tái ký, muốn mức đãi ngộ cao hơn.`,'bad');pushEv({kind:'renew',a:a.id,mul:1.3},true)}else{a.ceNo=1;addLog(`🚪 ${a.name} từ chối tái ký lần nữa và sẽ rời công ty khi hết hạn hợp đồng.`,'bad')}}}
  else{S.events=S.events.filter(e=>!(e.kind==='renew'&&e.a===id));if(k==='end'){a.ceNo=1;addLog(`📄 Công ty quyết định không tái ký với ${a.name}. ${a.name} sẽ rời đi khi hết hạn (${a.ce-abs()} tuần nữa).`)}}
  if(!quiet)act();return true}
function contractTick(){for(const a of [...S.artists]){if(a.status!=='debuted')continue;ctInit(a);const left=a.ce-abs();
  if(left<=0){S.events=S.events.filter(e=>!(e.kind==='renew'&&e.a===a.id));removeArtist(a,'đã hết hạn hợp đồng và rời công ty');continue}
  if(left<=8&&!a.ceNo&&!hasEv(a.id,'renew')){pushEv({kind:'renew',a:a.id,mul:1},true);if(left===8)addLog(`📄 Hợp đồng của ${a.name} còn 8 tuần. Xem đánh giá tái ký ở Phòng Nhân sự.`)}}}
function viewRenew(id){const a=byId(id);if(!a)return closeM();const e=S.events.find(x=>x.kind==='renew'&&x.a===id),mul=e?e.mul:1;curRC='var(--r-hr)';
  modal(`<h2>📄 Hợp đồng: ${esc(a.name)}</h2><div class="sub">${aTags(a)} · Lương ${fmt(a.salary)}/tuần</div>${renewBlock(a,mul)}${a.ceNo?'<div class="card small bad">Đã quyết định không tái ký. Vẫn có thể đề nghị lại bên dưới.</div>':''}
  <div class="row">${renewOpts(a,mul).filter(o=>o.k!=='later').map(o=>`<button class="btn sm ${o.k==='end'?'warn':'pri'}" onclick="if(renewDo(${a.id},'${o.k}',${mul},1)){view(()=>RV.hr());act()}">${o.l}</button>`).join('')}</div>
  <button class="btn" style="margin-top:10px" onclick="openRoom('hr')">← Phòng Nhân sự</button>`)}

/* ---- Sáng tác & Giám đốc âm nhạc ---- */
const SONGW=['Ngày Mai Sẽ Khác','Gửi Em Mùa Hạ','Không Thể Quên','Bước Qua Đêm Tối','Nắng Ấm','Thanh Xuân','Lạc Lối','Tự Do','Hẹn Mùa Thu','Sóng Vỗ','Đường Về','Thành Phố Ngủ Quên','Một Lần Nữa','Bay Lên','Chạm','Ánh Sao Cuối Trời'];
const wp=a=>a.st.vocal*.3+a.st.rap*.3+a.st.variety*.1+a.st.dance*.05+(a.cs||0)*4+a.talent*12;
function mkSong(ids,ck,title,writing){const ws=ids.map(byId).filter(Boolean);if(!ws.length)return null;const main=ws[0],co=ws.slice(1);
  let q=wp(main)*.75+(co.length?co.reduce((t,a)=>t+wp(a),0)/co.length*.25+co.length*3+chem(ids)*30:wp(main)*.2)+(fit(main,CONCEPTS[ck].w)-40)*.15+R(-8,12);
  q=clamp(Math.round(q),5,98);
  const s={id:uid(),t:(title||pick(SONGW.concat(SONGS))).slice(0,40),ck,q,by:ids,st:writing?'writing':'review',w:abs(),doneAt:abs(),y:S.year};
  S.songs=S.songs||[];S.songs.unshift(s);if(S.songs.length>40)S.songs.length=40;return s}
function songTick(){for(const s of (S.songs||[]))if(s.st==='writing'&&s.doneAt<=abs()){s.st='review';s.by.map(byId).filter(Boolean).forEach(a=>{a.cs=(a.cs||0)+1;MOOD(a,3)});addLog(`🎼 Demo «${s.t}» hoàn thành, chờ GĐ Âm nhạc duyệt tại Phòng Thu âm.`,'good')}}
function mdReview(s){const tb=trendB(s.ck),rp=rivalPress(),mk=clamp(Math.round(s.q+tb*1.2-rp*.4),1,99);
  const g=mk>=82?'S':mk>=68?'A':mk>=54?'B':mk>=40?'C':'D';
  const cm={S:'Bản hit tiềm năng! Giai điệu bắt tai, đủ sức cạnh tranh top 10.',A:'Chất lượng cao, vượt mặt bằng chung thị trường.',B:'Ngang mặt bằng thị trường. Cần nghệ sĩ hợp concept để tỏa sáng.',C:'Dưới mặt bằng, điệp khúc chưa đủ ấn tượng. Có thể làm bài B-side.',D:'Chưa đạt chuẩn phát hành, nên viết lại.'}[g];
  const tr=tb>0?`Concept ${CONCEPTS[s.ck].n} đang hot 🔥 (+${tb}).`:tb<0?`Concept ${CONCEPTS[s.ck].n} đang nguội ❄️ (${tb}).`:`Concept ${CONCEPTS[s.ck].n} ở mức bình thường.`;
  const sug=acts().map(x=>{const ms=x.m.map(byId).filter(Boolean);if(!ms.length)return null;const own=s.by.some(i=>x.m.includes(i));return{k:x.k,n:x.n,f:Math.round(avgFit(ms,CONCEPTS[s.ck].w)+(own?6:0)),own,free:actFree(x)}}).filter(Boolean).sort((a,b)=>b.f-a.f).slice(0,3);
  return{mk,g,better:clamp(Math.round(mk*1.05-8),1,99),cm,tr,rp,sug}}
const GC={S:'s',A:'m',B:'v',C:'',D:'r'};
const curSong=()=>(S.songs||[]).find(x=>x.id===+($('#sSong')?.value||0)&&x.st==='ok');
const sgBonus=(s,m)=>s?(s.q-50)*.35+(s.by.some(i=>m.includes(i))?4:0):0;
function songPrev(x){const s=curSong();if(!s)return' · 🎵 Bài mua ngoài (trả 15% bản quyền nhạc số)';const own=s.by.some(i=>x.m.includes(i)),b=Math.round(sgBonus(s,x.m));return` · ✍️ Bài nội bộ hạng ${s.rv?s.rv.g:'?'} (${b>=0?'+':''}${b} điểm${own?', có tự sáng tác':''}, giữ 100% nhạc số)`}
function songOpts(){const L=(S.songs||[]).filter(s=>s.st==='ok');return`<option value="0">🎵 Mua bài nhạc sĩ ngoài</option>${L.map(s=>`<option value="${s.id}">${s.md?'🎼':'✍️'} «${esc(s.t)}»${s.for&&actByKey(s.for)?' · dành cho '+esc(actByKey(s.for).n.slice(2).trim()):''} · hạng ${s.rv?s.rv.g:'?'} · ${CONCEPTS[s.ck].n}</option>`).join('')}`}
function songCard(){const n=(S.songs||[]).filter(s=>s.st==='review').length,ok=(S.songs||[]).filter(s=>s.st==='ok').length,wr=(S.songs||[]).filter(s=>s.st==='writing').length;
  return`<div class="card row"><div class="chibi mini">${chibiHTML(NPC[3])}</div><div class="small" style="flex:1"><b>🎼 GĐ Âm nhạc:</b> ${n?`có <b>${n} demo</b> chờ tôi duyệt.`:'chưa có demo mới.'} ${ok?`${ok} bài đã duyệt sẵn sàng phát hành.`:''}${wr?` ${wr} bài đang sáng tác.`:''}</div><button class="btn sm pri" onclick="view(viewSongs)">Sáng tác</button></div>`}
function writeSong(){const main=+$('#wMain').value,co=[...document.querySelectorAll('.wco:checked')].map(x=>+x.value).filter(i=>i!==main),ck=$('#wCon').value,t=($('#wTitle').value||'').trim().slice(0,40);
  if(!main)return toast('Chọn nhạc sĩ chính');if(co.length>2)return toast('Tối đa 2 người hợp tác');
  const ids=[main,...co],ws=ids.map(byId);if(ws.some(a=>!a||a.busy))return toast('Có người đang bận');
  if(S.money<5e6)return toast('Không đủ tiền');S.money-=5e6;book('prod',-5e6);
  const s=mkSong(ids,ck,t,true);ws.forEach(a=>a.busy={kind:'write',title:'Sáng tác «'+s.t+'»',left:1,total:1});
  addLog(`✍️ ${ws.map(a=>a.name).join(', ')} vào phòng thu sáng tác «${s.t}» (${CONCEPTS[ck].n}). Demo xong sau 1 tuần.`);act()}
function wPrev(){const el=$('#wPrev');if(!el)return;const main=byId(+$('#wMain').value);if(!main){el.textContent='';return}
  const co=[...document.querySelectorAll('.wco:checked')].map(x=>+x.value).filter(i=>i!==main.id);if(co.length>2){el.innerHTML='<span class="bad">Tối đa 2 người hợp tác</span>';return}
  const ids=[main.id,...co],c=co.length?chem(ids):0,ck=$('#wCon').value,base=wp(main)*.75+(co.length?co.reduce((t,i)=>t+wp(byId(i)),0)/co.length*.25+co.length*3+c*30:wp(main)*.2)+(fit(main,CONCEPTS[ck].w)-40)*.15;
  el.innerHTML=`Chất lượng dự kiến <b>${Math.round(clamp(base-8,5,98))}–${Math.round(clamp(base+12,5,98))}</b>/100${co.length?` · ${co.length} người hợp tác${c?' · '+chemTxt(c):''}`:''}${trendTag(ck)?` · concept${trendTag(ck)}`:''}`}
function songAct(id,k){const s=(S.songs||[]).find(x=>x.id===id);if(!s)return;
  if(k==='ok'){const r=mdReview(s);s.rv={g:r.g,mk:r.mk};s.st='ok';s.by.map(byId).filter(Boolean).forEach(a=>MOOD(a,8));addLog(`✅ GĐ Âm nhạc duyệt «${s.t}» (hạng ${r.g}, điểm thị trường ${r.mk}).`,'good')}
  else if(k==='redo'){if(S.money<3e6)return toast('Không đủ tiền');if((s.rw||0)>=2)return toast('Đã chỉnh sửa tối đa 2 lần');S.money-=3e6;s.rw=(s.rw||0)+1;const d=R(2,9);s.q=clamp(s.q+d,5,98);addLog(`🔁 Chỉnh sửa «${s.t}» theo góp ý của GĐ Âm nhạc: chất lượng +${d}.`)}
  else if(k==='drop'){S.songs=S.songs.filter(x=>x!==s);s.by.map(byId).filter(Boolean).forEach(a=>MOOD(a,-5));addLog(`🗑️ Bỏ bài «${s.t}».`)}
  act()}
function songRelease(id,k){const s=(S.songs||[]).find(x=>x.id===id);if(!s)return;if(s.st==='review')songAct(id,'ok');const x=actByKey(k);if(!x||!actFree(x))return toast('Nghệ sĩ này đang bận');
  openRoom('studio');setTimeout(()=>{if(!$('#sSong'))return;$('#sAct').value=k;$('#sSong').value=id;$('#sSong').onchange&&$('#sSong').onchange();$('#sSong').scrollIntoView({behavior:'smooth',block:'center'})},30)}
function viewSong(id){const s=(S.songs||[]).find(x=>x.id===id);if(!s)return view(viewSongs);curRC='var(--r-studio)';const r=mdReview(s),by=s.by.map(byId).filter(Boolean);
  modal(`<div class="row"><div class="chibi mini">${chibiHTML(NPC[3])}</div><div><h2 style="margin:0">«${esc(s.t)}»</h2><div class="small muted">${CONCEPTS[s.ck].n}${trendTag(s.ck)} · sáng tác: ${by.map(a=>esc(a.name)).join(', ')||(s.md?'🎼 GĐ Âm nhạc':'—')} · ${s.st==='ok'?'đã duyệt':s.st==='used'?'đã phát hành':'chờ duyệt'}</div></div></div>
  <div class="card" style="margin-top:10px"><div class="row"><b>🎼 Đánh giá của GĐ Âm nhạc</b><span class="sp"></span><span class="tag ${GC[r.g]}" style="font-size:14px">Hạng ${r.g}</span></div>
  <div class="small">Chất lượng bài: <b>${s.q}</b>/100 · Điểm so với thị trường: <b>${r.mk}</b>/100</div><div class="bar" style="margin:4px 0"><i style="width:${r.mk}%"></i></div>
  <div class="small">📈 Tốt hơn khoảng <b>${r.better}%</b> bài đang phát hành trên thị trường. ${r.tr}${r.rp?` Đối thủ đang comeback (−${Math.round(r.rp*.4)}).`:''}</div>
  <div class="small" style="margin-top:6px">💬 "${r.cm}"</div></div>
  ${s.st!=='used'?`<h3>🎯 Nghệ sĩ hợp với bài</h3>${r.sug.length?r.sug.map((x,i)=>`<div class="prow"><b>${i===0?'⭐ ':''}${esc(x.n)}</b><span class="small muted">hợp ${x.f}%${x.own?' · tự sáng tác':''}${x.free?'':' · đang bận'}</span><span class="sp"></span>${x.free&&r.g!=='D'?`<button class="btn sm ${i===0?'pri':''}" onclick="songRelease(${s.id},'${x.k}')">Giao bài</button>`:''}</div>`).join(''):'<div class="small muted">Chưa có nhóm hay solo nào. Debut trước rồi giao bài sau.</div>'}`:`<div class="card small">Đã phát hành, hạng ${s.rank||'?'} (${esc(s.act||'')}).</div>`}
  <div class="row" style="margin-top:10px">${s.st==='review'?`<button class="btn pri" onclick="songAct(${s.id},'ok');view(viewSongs)">✅ Duyệt vào kho</button>`:''}${s.st!=='used'?`<button class="btn" onclick="songAct(${s.id},'redo')" ${(s.rw||0)>=2?'disabled':''}>🔁 Chỉnh sửa theo góp ý (3 tr, còn ${2-(s.rw||0)} lần)</button><button class="btn warn" onclick="songAct(${s.id},'drop');view(viewSongs)">Bỏ bài</button>`:''}</div>
  <button class="btn" style="margin-top:10px" onclick="view(viewSongs)">← Danh sách bài</button>`)}
function viewSongs(){curRC='var(--r-studio)';const L=S.songs||[],rv=L.filter(s=>s.st==='review'),ok=L.filter(s=>s.st==='ok'),wr=L.filter(s=>s.st==='writing'),us=L.filter(s=>s.st==='used');
  const free=S.artists.filter(a=>!a.busy).sort((x,y)=>wp(y)-wp(x));
  const row=s=>{const r=mdReview(s);return`<div class="prow"><b>«${esc(s.t)}»</b><span class="small muted">${CONCEPTS[s.ck].n}${trendTag(s.ck)} · ${s.by.map(byId).filter(Boolean).map(a=>esc(a.name)).join(', ')||(s.md?'🎼 GĐ Âm nhạc':'')}${s.for&&actByKey(s.for)?' · dành cho '+esc(actByKey(s.for).n.slice(2).trim()):''}</span><span class="tag ${GC[s.rv?s.rv.g:r.g]}">${s.rv?s.rv.g:r.g}</span><span class="sp"></span><button class="btn sm ${s.st==='review'?'pri':''}" onclick="view(()=>viewSong(${s.id}))">${s.st==='review'?'Duyệt':'Xem'}</button></div>`};
  modal(`<div class="row"><div class="chibi mini">${chibiHTML(NPC[3])}</div><div><h2 style="margin:0">🎼 Sáng tác & GĐ Âm nhạc</h2><div class="sub" style="margin:0">Nghệ sĩ tự sáng tác hoặc hợp tác. GĐ Âm nhạc chấm bài so với thị trường và gợi ý người hát hợp nhất.</div></div></div>
  <div class="card small" style="margin-top:8px">Bài nội bộ: không mất 15% bản quyền nhạc số, cộng điểm xếp hạng theo chất lượng, người sáng tác được thêm fan. Nghệ sĩ càng sáng tác nhiều càng viết hay hơn.</div>
  ${det('sg-rv',`📥 Chờ duyệt (${rv.length})`,rv.map(row).join('')||'<div class="small muted">Không có demo nào chờ duyệt.</div>',true)}
  ${det('sg-ok',`✅ Kho bài đã duyệt (${ok.length})`,ok.map(row).join('')||'<div class="small muted">Chưa có. Bài đã duyệt sẽ hiện trong mục Phát hành single.</div>',true)}
  ${wr.length?det('sg-wr',`✍️ Đang sáng tác (${wr.length})`,wr.map(s=>`<div class="small">«${esc(s.t)}» · ${s.by.map(byId).filter(Boolean).map(a=>esc(a.name)).join(', ')} · xong vào tuần tới</div>`).join(''),true):''}
  ${det('sg-new','✍️ Sáng tác bài mới (5 tr, 1 tuần)',free.length?`<div class="row"><span class="small">Nhạc sĩ chính:</span><select id="wMain" style="flex:1">${free.map(a=>`<option value="${a.id}">${esc(a.name)} · bút lực ${Math.round(wp(a))}${a.cs?` · ${a.cs} bài`:''}</option>`).join('')}</select></div>
    <div class="row" style="margin-top:6px"><span class="small">Concept:</span><select id="wCon">${Object.keys(CONCEPTS).map(k=>`<option value="${k}">${CONCEPTS[k].n}${trendTag(k)}</option>`).join('')}</select><input type="text" id="wTitle" placeholder="Tên bài (tuỳ chọn)" style="flex:1"></div>
    <div class="small" style="margin-top:6px">Hợp tác cùng (tối đa 2 nghệ sĩ trong công ty):</div><div class="list">${free.map(a=>`<label><input type="checkbox" class="wco" value="${a.id}" onchange="wPrev()"> <span style="flex:1"><b>${esc(a.name)}</b> <span class="small muted">bút lực ${Math.round(wp(a))} · V${Math.round(a.st.vocal)} R${Math.round(a.st.rap)}</span></span></label>`).join('')}</div>
    <div class="small muted" id="wPrev" style="margin:6px 0"></div><button class="btn pink" onclick="writeSong()">Bắt đầu sáng tác</button>`:'<div class="small muted">Không có nghệ sĩ nào rảnh.</div>',!rv.length)}
  ${us.length?det('sg-us',`💿 Đã phát hành (${us.length})`,us.map(s=>`<div class="small">«${esc(s.t)}» · ${esc((s.act||'').slice(2))} · hạng ${s.rank} · GĐ chấm ${s.rv?s.rv.g:'?'}</div>`).join(''),false):''}
  <button class="btn" style="margin-top:8px" onclick="openRoom('studio')">← Phòng Thu âm</button>`);
  if($('#wMain')){$('#wMain').onchange=wPrev;$('#wCon').onchange=wPrev;wPrev()}}

/* ---- Thông tin & xử lý sự kiện mới ---- */
const XK=['mx','mp','disband','renew'];
function xInfo(e){
  if(e.kind==='mx'){const D=MXS[e.mx],a=byId(e.a),m=S.managers.find(x=>x.id===e.m);if(!D||!a||!m)return null;return{ic:D.ic,t:D.t(a,m,e),d:D.d(a,m,e),o:D.o(a,m,e)}}
  if(e.kind==='mp'){const m=S.managers.find(x=>x.id===e.m);if(!m)return null;
    if(e.t==='asst')return{ic:'🧑‍💻',t:`QL ${m.name} đề xuất tuyển trợ lý`,d:`${m.name} muốn tuyển trợ lý ${e.name} chuyên ${MSK[e.k]} để san sẻ việc. Kỹ năng ${MSK[e.k]} của quản lý ${effSk(m,e.k)} → ${Math.min(10,effSk(m,e.k)+e.v)} (giúp mọi nghệ sĩ QL phụ trách). Phí tuyển ${fmt(e.fee)}, lương ${fmt(e.sal)}/tuần.`,o:[{k:'yes',l:`Tuyển (${fmt(e.fee)})`},{k:'no',l:'Từ chối'}]};
    if(e.t==='scout'){const a=byId(e.a),c=e.cand;return{ic:'🔎',t:`QL ${m.name} phát hiện một tài năng`,d:`Khi đi cùng ${a?a.name:'nghệ sĩ'} ${e.where}, ${m.name} để ý ${c.name} có năng khiếu ${STATS[c.spec]} nổi bật, tố chất x${c.talent}. Đề xuất mời về làm thực tập sinh.`,o:[{k:'yes',l:'Mời làm TTS (10 tr)'},{k:'no',l:'Bỏ qua'}]}}
    return null}
  if(e.kind==='disband'){const g=S.groups.find(x=>x.id===e.g);if(!g)return null;const m=gMgr(g);return{ic:'💔',t:`Nhóm ${g.name} đứng trước nguy cơ tan rã`,d:`Lý do: ${e.why}. Hòa hợp nhóm ${harmony(g.members)}${m?`, QL ${m.name} (Chăm sóc ${effSk(m,'care')})`:', chưa có quản lý'}. Tạm ngừng 8 tuần giúp các thành viên hồi phục nhưng không thể ra single hay concert.`,o:[{k:'fix',l:`Hòa giải (50 tr, ~${pct(fixP(g))})`},{k:'split',l:'Chấp nhận giải tán'},{k:'pause',l:'Tạm ngừng 8 tuần'}]}}
  if(e.kind==='renew'){const a=byId(e.a);if(!a)return null;return{ic:'📄',t:`Tái ký hợp đồng: ${a.name}`,d:`Hợp đồng của ${a.name} hết hạn sau ${a.ce-abs()} tuần. Nếu không tái ký, nghệ sĩ sẽ rời công ty.`,o:renewOpts(a,e.mul)}}
  return undefined}
function xResolve(e,k){
  if(e.kind==='mx'){const D=MXS[e.mx],a=byId(e.a),m=S.managers.find(x=>x.id===e.m);if(!D||!a||!m||!D.r[k])return;const r=D.r[k](a,m,e);if(r)addLog(r[0],r[1]||'');return}
  if(e.kind==='mp'){const m=S.managers.find(x=>x.id===e.m);if(!m)return;
    if(e.t==='asst'){if(k==='yes'){if(!hireAsst(m.id,e.k,e.v,e.name,e.fee,e.sal))S.events.push(e)}else addLog(`🙅 Từ chối đề xuất tuyển trợ lý của ${m.name}.`);return}
    if(e.t==='scout'){if(k==='yes'){if(S.money<10e6){toast('Không đủ tiền');S.events.push(e);return}S.money-=10e6;book('hr',-10e6);const c=e.cand;if(S.artists.some(x=>x.id===c.id))return;c.batch=ensureCurBatch();S.artists.push(c);mgrExp(m,1);addLog(`🌟 ${c.name} được ${m.name} phát hiện, ký hợp đồng TTS vào ${(S.batches.find(b=>b.id===c.batch)||{n:''}).n}.`,'gold')}return}}
  if(e.kind==='disband'){const g=S.groups.find(x=>x.id===e.g);if(!g)return;const ms=g.members.map(byId).filter(Boolean);
    if(k==='fix'){S.money-=50e6;if(Math.random()<fixP(g)){for(const a of ms)for(const b of ms)if(a!==b){if(a.tag[b.id]==='enemy')setTag(a,b,null);if(getRel(a,b)<10)setRel(a,b,10)}ms.forEach(a=>MOOD(a,10));const m=gMgr(g);if(m)mgrExp(m,2);addLog(`🕊️ Buổi hòa giải thành công, nhóm ${g.name} đoàn kết trở lại!`,'good')}else disbandGroup(g,'hòa giải thất bại')}
    else if(k==='split')disbandGroup(g,e.why);
    else{g.hiatus=abs()+8;ms.forEach(a=>MOOD(a,15));for(const a of ms)for(const b of ms)if(a!==b&&a.tag[b.id]==='enemy'&&Math.random()<.5){setTag(a,b,null);setRel(a,b,0)}S.cbPlan=(S.cbPlan||[]).filter(p=>p.k!=='g'+g.id);addLog(`⏸️ Nhóm ${g.name} tạm ngừng hoạt động 8 tuần để các thành viên nghỉ ngơi.`)}
    return}
  if(e.kind==='renew'){if(!renewDo(e.a,k,e.mul,true))S.events.push(e)}}

/* ---- Tick tuần ---- */
function weekV2(){mentorTick();songTick();digTick();
  {const t=(S.assts||[]).reduce((s,x)=>s+x.sal,0);if(t){S.money-=t;book('mgr',-t)}}
  contractTick();debutHoldTick();disbandTick();mxTick();
  if(Math.random()<compRep()/120&&S.pool.length<poolSize()+4){const a=genArtist();S.pool.push(a);addLog(`📨 ${a.name} (${a.g==='F'?'nữ':'nam'}, ${a.age}) tự gửi đơn ứng tuyển thực tập sinh nhờ danh tiếng công ty.`,'good')}}
function migrateV2(){S.assts=S.assts||[];S.songs=S.songs||[];S.fin=S.fin||[];
  if(!S.bno)S.bno=Math.max(S.batches.length,...S.batches.map(b=>+((b.n.match(/\d+/)||[0])[0])));
  for(const m of S.managers){if(!m.as)continue;const t=m.as.t;
    if(t==='t'){const b=S.batches.find(b=>bMem(b).length&&!S.managers.some(x=>x.as&&x.as.t==='b'&&x.as.id===b.id));m.as=b?{t:'b',id:b.id}:null;addLog(`📋 Quản lý TTS giờ chỉ theo lứa: ${m.name} ${b?'chuyển sang phụ trách '+b.n:'chờ được giao lứa mới'}.`)}
    else if(t==='s'||t==='d'){const pool=S.artists.filter(a=>(t==='s'?a.solo&&!a.pm:a.actor)&&!S.managers.some(x=>x!==m&&x.as&&x.as.t!=='s'&&x.as.t!=='d'&&mgrTargets(x).includes(a))).slice(0,MAX_SA);m.as={t:'l',id:0,ids:pool.map(a=>a.id)};addLog(`📋 ${m.name} giờ quản lý danh sách tối đa ${MAX_SA} nghệ sĩ solo/diễn viên.`)}
    else if(t==='l'&&m.as.ids.length>MAX_SA)m.as.ids=m.as.ids.slice(0,MAX_SA)}
  S.artists.forEach(ctInit);S.batches.forEach(b=>{if(bMem(b).length)b.had=1})}

/* ---- Phòng Kinh doanh ---- */
function finChart(L){if(!L.length)return'<div class="small muted">Chưa có dữ liệu. Sang tuần mới để bắt đầu ghi sổ.</div>';const W=320,H=140,n=L.length,bw=W/n,mx=Math.max(1,...L.map(f=>Math.max(fsum(f.i),fsum(f.x))));
  const bars=L.map((f,i)=>{const hi=fsum(f.i)/mx*(H-26),hx=fsum(f.x)/mx*(H-26),x=i*bw+bw*.15,w=bw*.33;return`<rect x="${x.toFixed(1)}" y="${(H-16-hi).toFixed(1)}" width="${w.toFixed(1)}" height="${hi.toFixed(1)}" rx="2" style="fill:var(--mint)"/><rect x="${(x+w+1).toFixed(1)}" y="${(H-16-hx).toFixed(1)}" width="${w.toFixed(1)}" height="${hx.toFixed(1)}" rx="2" style="fill:var(--red)"/><text x="${(i*bw+bw/2).toFixed(1)}" y="${H-3}" text-anchor="middle" style="fill:var(--muted);font-size:8px">T${f.wk}</text>`}).join('');
  return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Biểu đồ thu chi 12 tuần"><line x1="0" y1="${H-16}" x2="${W}" y2="${H-16}" style="stroke:var(--line)"/>${bars}</svg><div class="small muted"><span style="color:var(--mint)">■</span> Thu · <span style="color:var(--red)">■</span> Chi</div>`}
function catRows(o,lab,col){const ks=Object.keys(o).filter(k=>o[k]>0).sort((a,b)=>o[b]-o[a]),mx=Math.max(1,...ks.map(k=>o[k])),t=fsum(o);return ks.map(k=>`<div class="small" style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:6px;align-items:center;margin:2px 0"><span>${lab[k]||k}</span><div class="bar"><i style="width:${o[k]/mx*100}%;background:${col}"></i></div><b>${fmt(o[k])} <span class="muted">${Math.round(o[k]/t*100)}%</span></b></div>`).join('')||'<div class="small muted">Chưa có.</div>'}
function aggr(L,f){const o={};L.forEach(e=>{for(const k in e[f])o[k]=(o[k]||0)+e[f][k]});return o}

RV.sales=function(){
  const F=S.fin||[],L=F.slice(-12),last=F[F.length-1],fc=fcEnsure(),yr=F.filter(f=>f.y===S.year),yi=yr.reduce((t,f)=>t+fsum(f.i),0),yx=yr.reduce((t,f)=>t+fsum(f.x),0);
  const l4=F.slice(-4),ai=aggr(l4,'i'),ax=aggr(l4,'x');
  const dg=S.singles.filter(s=>s.dig),act=dg.filter(s=>!s.end).sort((a,b)=>(b.dl||0)-(a.dl||0)),nx=act.reduce((t,s)=>t+digNext(s),0),dgT=dg.reduce((t,s)=>t+(s.dt||0),0),roy=dg.filter(s=>s.roy).reduce((t,s)=>t+Math.round((s.dt||0)/(1-s.roy)*s.roy),0);
  const top=S.artists.filter(a=>a.earn).sort((a,b)=>b.earn-a.earn).slice(0,8),mxE=top.length?top[0].earn:1;
  const net=last?fsum(last.i)-fsum(last.x):0;
  modal(`<h2>💹 Phòng Kinh doanh</h2><div class="sub">Theo dõi thu nhập, chi phí và doanh thu nhạc số của công ty.</div>
  <div class="grid2"><div class="card">📥 Thu tuần trước<br><b class="good">${fmt(last?fsum(last.i):0)}</b></div><div class="card">📤 Chi tuần trước<br><b class="bad">${fmt(last?fsum(last.x):0)}</b></div><div class="card">📊 Lãi ròng tuần trước<br><b class="${net<0?'bad':'good'}">${net>=0?'+':''}${fmt(net)}</b></div><div class="card">🗓️ Năm ${S.year} đến nay<br><b class="${yi-yx<0?'bad':'good'}">${yi-yx>=0?'+':''}${fmt(yi-yx)}</b><br><span class="small muted">thu ${fmt(yi)} · chi ${fmt(yx)}</span></div></div>
  ${det('sl-chart','📈 Thu chi 12 tuần gần nhất',finChart(L),true)}
  ${det('sl-cat','🧾 Cơ cấu 4 tuần gần nhất',`<h3 style="margin-top:0">Nguồn thu (${fmt(fsum(ai))})</h3>${catRows(ai,FIN_I,'var(--mint)')}<h3>Khoản chi (${fmt(fsum(ax))})</h3>${catRows(ax,FIN_X,'var(--red)')}`,true)}
  ${det('sl-dig',`🎧 Nhạc số (${act.length} bài đang có doanh thu)`,`<div class="grid2" style="margin-bottom:6px"><div class="card small">Tổng doanh thu nhạc số<br><b>${fmt(dgT)}</b></div><div class="card small">Dự báo tuần tới<br><b>${fmt(nx)}</b></div><div class="card small">Đã trả bản quyền nhạc sĩ ngoài<br><b>${fmt(roy)}</b></div></div>
    <div class="small muted" style="margin-bottom:4px">Mỗi single thu tiền stream hằng tuần, giảm dần theo thời gian (bài top 10 giữ nhiệt lâu hơn), tối đa 52 tuần. Bài mua ngoài trả 15% bản quyền, bài tự sáng tác giữ trọn.</div>
    ${act.map(s=>`<div class="prow"><b>«${esc(s.title)}»</b><span class="small muted">${esc(s.act.slice(2))} · hạng ${s.rank} · tuần ${abs()-s.w}/52 · ${s.roy?'bài ngoài':'✍️ nội bộ'}</span><span class="sp"></span><span class="small">+${fmt(s.dl||0)}/tuần · tổng ${fmt(s.dt||0)}</span></div>`).join('')||'<div class="small muted">Chưa có single nào đang có doanh thu stream. Phát hành single ở Phòng Thu âm.</div>'}`,true)}
  ${det('sl-art',`🌟 Nghệ sĩ mang về doanh thu (${top.length})`,top.map(a=>`<div class="small" style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) auto;gap:6px;align-items:center;margin:3px 0"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><div class="bar"><i style="width:${a.earn/mxE*100}%"></i></div><b>${fmt(a.earn)}</b></div>`).join('')||'<div class="small muted">Chưa có dữ liệu. Thù lao dự án, single, nhạc số, concert đều được ghi nhận cho nghệ sĩ.</div>',false)}
  ${det('sl-now',`⏳ Tuần này (đang diễn ra)`,`<div class="small">Thu: <b class="good">${fmt(fsum(fc.i))}</b> · Chi: <b class="bad">${fmt(fsum(fc.x))}</b> (chưa gồm lương & đào tạo cuối tuần)</div>${catRows(fc.i,FIN_I,'var(--mint)')}${catRows(fc.x,FIN_X,'var(--red)')}`,false)}
  ${det('sl-hist','📒 Sổ thu chi theo tuần',F.slice(-16).reverse().map(f=>{const n=fsum(f.i)-fsum(f.x);return`<div class="prow"><b>N${f.y}·T${f.wk}</b><span class="small muted">thu ${fmt(fsum(f.i))} · chi ${fmt(fsum(f.x))}</span><span class="sp"></span><b class="${n<0?'bad':'good'}">${n>=0?'+':''}${fmt(n)}</b></div>`}).join('')||'<div class="small muted">Trống.</div>',false)}`);
};
RV.hr=function(){
  const deb=S.artists.filter(a=>a.status==='debuted').sort((a,b)=>(a.ce||1e9)-(b.ce||1e9)),tts=S.artists.filter(a=>a.status==='trainee'),mentors=S.artists.filter(a=>menteesOf(a).length);
  modal(`<h2>🗂️ Phòng Nhân sự</h2><div class="sub">Hợp đồng nghệ sĩ, tiền bối dẫn dắt thực tập sinh, trợ lý và danh tiếng tuyển dụng.</div>
  ${repCard()}
  ${det('hr-ct',`📄 Hợp đồng nghệ sĩ (${deb.length})`,`<div class="small muted" style="margin-bottom:6px">Hợp đồng debut 1 năm. Còn 8 tuần sẽ có đánh giá tái ký: doanh thu mang về so với lương, tăng trưởng fan, danh tiếng, kết quả đánh giá, tâm trạng.</div>`+deb.map(a=>{const E=renewEval(a),l=a.ce-abs();return`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">còn <b class="${l<=8?'bad':''}">${l}</b> tuần · ${fmt(a.salary)}/t</span><span class="tag ${E.rec[1]}">${a.ceNo?'Không tái ký':E.rec[0]}</span><span class="sp"></span><button class="btn sm ${l<=8?'pri':''}" onclick="view(()=>viewRenew(${a.id}))">Đánh giá</button></div>`}).join('')||'<div class="small muted">Chưa có nghệ sĩ đã ra mắt.</div>',true)}
  ${det('hr-mt',`👩‍🏫 Tiền bối dẫn dắt TTS (${tts.filter(a=>a.mt).length}/${tts.length})`,`<div class="small muted" style="margin-bottom:6px">Mỗi nghệ sĩ dẫn dắt tối đa 2 TTS. TTS tập nhanh hơn ở kỹ năng tiền bối giỏi hơn mình (tối đa +40%), vui hơn và thân với tiền bối. Tiền bối tốn ít năng lượng mỗi tuần, được cộng fan khi đàn em debut. 💡 là người hợp nhất.</div>`+(tts.map(a=>`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">${esc((batchOf(a)||{n:''}).n)}</span><span class="sp"></span>${mentorSel(a)}</div>`).join('')||'<div class="small muted">Không có thực tập sinh.</div>')+(mentors.length?`<div class="small" style="margin-top:6px"><b>Đang dẫn dắt:</b> ${mentors.map(m=>`${esc(m.name)} → ${menteesOf(m).map(x=>esc(x.name)).join(', ')}`).join(' · ')}</div>`:''),true)}
  ${det('hr-as',`🧑‍💻 Trợ lý quản lý (${(S.assts||[]).length})`,(S.assts||[]).map(x=>{const m=S.managers.find(z=>z.id===x.mid);return`<div class="prow"><b>${esc(x.name)}</b><span class="small muted">trợ lý QL ${esc(m?m.name:'?')} · ${MSK[x.k]} +${x.v} · ${fmt(x.sal)}/tuần</span><span class="sp"></span><button class="btn sm warn" onclick="fireAsst(${x.id})">Cho nghỉ</button></div>`}).join('')||'<div class="small muted">Chưa có trợ lý. Quản lý sẽ tự đề xuất khi cần.</div>',false)}`);
};

/* ================= MỞ RỘNG v3 ================= */
XK.push('v3');
const eligSort=(x,y)=>((y.dReady&&y.status==='trainee')?1:0)-((x.dReady&&x.status==='trainee')?1:0);
function dElig(a,t){if(a.status!=='trainee')return false;const tbl=t==='actor'?GENRES:CONCEPTS;if(t==='group')return!!a.dReady;return bestOf(a,tbl)[0].f>DEBUT_MIN}
function migrateV3(){S.mrel=S.mrel||{};S.ext=S.ext||[];S.artists.forEach(a=>{a.xr=a.xr||{}})}

/* ---- Màu tên quản lý theo cấp & quản lý các quản lý ---- */
const LVC=['#f2557f','#a497d6','#5fd0a0','#efb54d','#6fb3f2','#f2895e','#c49bf0','#4fc8d9','#f07fae','#a8cf5a'];
const lvColor=lv=>LVC[(Math.max(1,lv)-1)%LVC.length];
function mNameH(m){return mBoss(m)?`<b style="color:${lvColor(m.lv)}">${esc(m.name)}</b>`:`<b>${esc(m.name)}</b>`}
const mrK=(x,y)=>x.id<y.id?x.id+'-'+y.id:y.id+'-'+x.id;
const mrel=(x,y)=>(S.mrel||{})[mrK(x,y)]||0;
function setMrel(x,y,v){S.mrel=S.mrel||{};S.mrel[mrK(x,y)]=clamp(Math.round(v),-100,100)}
const canKid=(m,x)=>x!==m&&x.boss!==m.id&&!inSub(x,m)&&mKids(m).length<mCap(m);
const relTxt=v=>`<b class="${v<0?'bad':v>0?'good':''}">${v>0?'+':''}${v}</b>`;
function mgrBossHTML(){
  if(!S.managers.length)return'';
  const L=S.managers.slice().sort((a,b)=>mKids(b).length-mKids(a).length||b.lv-a.lv);
  const lvs=[...new Set(S.managers.map(m=>m.lv))].sort((a,b)=>a-b);
  const legend=`<div class="small" style="margin-bottom:6px">Quản lý có cấp trên là quản lý khác sẽ hiện tên màu theo cấp (cùng cấp cùng màu): ${lvs.map(l=>`<b style="color:${lvColor(l)}">● Cấp ${l}</b>`).join(' ')} · tên màu thường là người báo cáo trực tiếp Giám đốc.</div>`;
  const row=m=>{const ks=mKids(m),cand=S.managers.filter(x=>canKid(m,x)).sort((a,b)=>(a.boss?1:0)-(b.boss?1:0)||a.lv-b.lv);
    return`<div class="card"><div class="row"><div class="chibi mini">${chibiHTML(m)}</div><div style="flex:1;min-width:0">${mNameH(m)} <span class="tag v">Cấp ${m.lv}</span>${ks.length?' <span class="tag s">👔 Trưởng nhóm</span>':''}<div class="small muted">${mBoss(m)?'Báo cáo cho '+esc(mBoss(m).name):'Báo cáo trực tiếp Giám đốc'} · kèm cặp ${ks.length}/${mCap(m)} quản lý · cả đội ${teamOf(m).length} nghệ sĩ</div></div></div>
    ${ks.length?ks.map(k=>`<div class="prow">↳ ${mNameH(k)}<span class="small muted">Cấp ${k.lv} · ${esc(targetName(k))} · quan hệ ${relTxt(mrel(m,k))}${mKids(k).length?` · kèm ${mKids(k).length} QL`:''}</span><span class="sp"></span><button class="btn sm" onclick="setBoss(${k.id},'')">Tách ra</button></div>`).join(''):'<div class="small muted" style="margin-top:4px">Chưa kèm cặp quản lý nào.</div>'}
    ${cand.length?`<div class="row" style="margin-top:6px"><select onchange="if(this.value)setBoss(+this.value,${m.id})" style="flex:1;min-width:0" aria-label="Giao quản lý cấp dưới"><option value="">+ Giao quản lý cấp dưới cho ${esc(m.name)}…</option>${cand.map(x=>`<option value="${x.id}">${esc(x.name)} (cấp ${x.lv})${x.boss?' – đang dưới '+esc((mBoss(x)||{}).name||''):''}</option>`).join('')}</select></div>`:(ks.length>=mCap(m)?'<div class="small muted">Đã đủ số cấp dưới ở cấp hiện tại.</div>':'')}</div>`};
  const pairs=[];for(let i=0;i<S.managers.length;i++)for(let j=i+1;j<S.managers.length;j++){const x=S.managers[i],y=S.managers[j],v=mrel(x,y);if(v)pairs.push({x,y,v})}
  pairs.sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
  const rel=`<h3 style="margin-top:10px">🤝 Quan hệ giữa các quản lý</h3>${pairs.slice(0,12).map(p=>`<div class="small">${mNameH(p.x)} & ${mNameH(p.y)}: ${relTxt(p.v)} ${p.v>=50?'· thân thiết, hay chia sẻ kinh nghiệm':p.v<=-30?'· hay bất đồng':''}</div>`).join('')||'<div class="small muted">Các quản lý chưa có tương tác đáng kể. Họ sẽ đi cà phê, tranh luận hoặc kèm cặp nhau theo thời gian.</div>'}`;
  return det('mg-boss',`👔 Quản lý các quản lý (${S.managers.filter(m=>mKids(m).length).length} trưởng nhóm)`,legend+L.map(row).join('')+rel,true);
}

/* ---- Trợ lý cá nhân cho nghệ sĩ quản lý theo nhóm ---- */
const paOK=a=>a.status==='debuted'&&groupsOf(a).length>0&&!a.pm;
const PA_NEED=a=>({care:(100-a.mood)/10+(groupsOf(a).some(g=>harmony(g.members)<0)?3:0),nego:fame(a)/12+2,pr:a.scandal?8:(datingPartner(a)?4:1),plan:(100-a.energy)/12+(a.busy?2:0)});
const PA_WHY={care:'muốn có người lắng nghe, giữ tinh thần ổn định',nego:'muốn được hỗ trợ đàm phán thù lao tốt hơn',pr:'lo truyền thông, muốn có người giữ gìn hình ảnh',plan:'lịch trình dày, cần người sắp xếp thời gian'};
function genPAC(a){const ks=Object.keys(MSK).sort(()=>Math.random()-.5).slice(0,3);a.paC=ks.map(k=>{const v=R(1,3);return{id:uid(),name:pick(LNM)+' '+pick(FN.concat(MN)),k,v,sal:(v+1)*5e5,fee:v*5e6}});a.paW=abs()}
function paPick(a){const n=PA_NEED(a);return(a.paC||[]).slice().sort((x,y)=>(n[y.k]*y.v-y.fee/1e7)-(n[x.k]*x.v-x.fee/1e7))[0]}
function paOpen(id){const a=byId(id);if(!a||!paOK(a))return toast('Chỉ nghệ sĩ được quản lý theo nhóm mới tự chọn trợ lý');if(!a.paC||abs()-(a.paW||0)>=8)genPAC(a);save();view(()=>viewPA(id))}
function viewPA(id){const a=byId(id);if(!a)return closeM();if(!a.paC)genPAC(a);curRC='var(--r-mgr)';const p=paPick(a),gm=groupsOf(a).map(g=>gMgr(g)).find(Boolean);
  const L=a.paC.slice().sort((x,y)=>(y===p)-(x===p));
  modal(`<h2>🧑‍💻 Trợ lý cá nhân · ${esc(a.name)}</h2><div class="sub">Nghệ sĩ được quản lý theo nhóm có thể tự chọn một trợ lý riêng. Kỹ năng trợ lý cộng thêm vào kỹ năng quản lý áp dụng riêng cho ${esc(a.name)}${gm?` (trên nền QL nhóm ${esc(gm.name)})`:''}.</div>
  ${a.pa?`<div class="card row"><span class="small" style="flex:1">Hiện tại: <b>${esc(a.pa.name)}</b> · ${MSK[a.pa.k]} +${a.pa.v} · ${fmt(a.pa.sal)}/tuần</span><button class="btn sm warn" onclick="paFire(${a.id})">Cho nghỉ</button></div>`:''}
  <div class="card row wish"><div class="chibi mini">${chibiHTML(a)}</div><div class="small" style="flex:1">💬 <b>${esc(a.name)}:</b> "${p?`Em muốn chọn ${esc(p.name)} vì em ${PA_WHY[p.k]}.`:'Em chưa thấy ai phù hợp.'}"</div></div>
  ${L.map(c=>`<div class="card"><div class="row"><b>${esc(c.name)}</b>${c===p?' <span class="tag s">💬 Nghệ sĩ tự chọn</span>':''}<span class="sp"></span><span class="tag v">${MSK[c.k]} +${c.v}</span></div><div class="small muted">${MSKD[c.k]} · Phí ${fmt(c.fee)} · lương ${fmt(c.sal)}/tuần</div><div class="row" style="margin-top:6px"><span class="sp"></span><button class="btn sm ${c===p?'pri':''}" onclick="paHire(${a.id},${c.id})">${c===p?'Đồng ý lựa chọn của '+esc(a.name):'Chọn người này thay'}</button></div></div>`).join('')}
  <div class="row"><button class="btn" onclick="paRe(${a.id})">🔄 Ứng viên khác (3 tr)</button><span class="sp"></span><button class="btn" onclick="view(()=>viewArtist(${a.id}))">← Hồ sơ</button></div>`)}
function paHire(aid,cid){const a=byId(aid);if(!a)return;const c=(a.paC||[]).find(x=>x.id===cid);if(!c)return;if(S.money<c.fee)return toast('Không đủ tiền');
  const p=paPick(a);S.money-=c.fee;book('hr',-c.fee);a.pa={name:c.name,k:c.k,v:c.v,sal:c.sal};a.paC=null;
  if(c===p){MOOD(a,6);addLog(`🧑‍💻 ${a.name} tự chọn trợ lý cá nhân ${c.name} (${MSK[c.k]} +${c.v}).`,'good')}else{MOOD(a,-3);addLog(`🧑‍💻 Công ty chọn trợ lý ${c.name} cho ${a.name} thay vì người ${a.name} thích.`)}
  view(()=>viewArtist(aid));act()}
function paRe(aid){const a=byId(aid);if(!a)return;if(S.money<3e6)return toast('Không đủ tiền');S.money-=3e6;book('hr',-3e6);genPAC(a);act()}
function paFire(aid){const a=byId(aid);if(!a||!a.pa)return;addLog(`👋 Trợ lý cá nhân ${a.pa.name} của ${a.name} nghỉ việc.`);a.pa=null;MOOD(a,-3);act()}

/* ---- Chuyên gia chăm sóc sức khoẻ ---- */
function genHSC(){S.hsC=[0,1].map(()=>{const sk=R(1,5);return{id:uid(),name:'BS. '+pick(LNM)+' '+pick(FN.concat(MN)),sk,sal:(sk+1)*1e6,fee:sk*8e6,look:mkLook(Math.random()<.5?'F':'M','#e9e9f2')}})}
function hsHire(id){const c=(S.hsC||[]).find(x=>x.id===id);if(!c)return;if(S.money<c.fee)return toast('Không đủ tiền');S.money-=c.fee;book('hr',-c.fee);S.hs=c;S.hsC=null;addLog(`🩺 Tuyển chuyên gia chăm sóc sức khỏe ${c.name} (chuyên môn ${c.sk}/5).`,'good');act()}
function hsFire(btn){if(btn.dataset.c!=='1'){btn.dataset.c='1';btn.textContent='Chạm lần nữa';return}if(!S.hs)return;addLog(`👋 Chuyên gia ${S.hs.name} nghỉ việc.`);S.hs=null;act()}
const restN=a=>a.days.filter(k=>k==='rest').length;
function hsRisk(a){const td=trainDays(a),r=[];ensureDays(a);if(a.energy<35)r.push(`năng lượng chỉ còn ${Math.round(a.energy)}`);if(a.mood<30)r.push(`tâm trạng xuống ${Math.round(a.mood)}`);if(td>=6&&a.energy<65)r.push(`tập ${td}/7 ngày khi thể lực chưa hồi`);if(a.status==='trainee'&&(a.ttsFail||0)>=2&&a.mood<55)r.push('áp lực vì trượt đánh giá liên tiếp');const pe=projEnergy(a);if(pe[6]<20&&td>=4)r.push('dự báo cạn sức cuối tuần');return r}
function applyRest(a,n){if(a.busy)return;ensureDays(a);const d=a.days.slice();let c=d.filter(k=>k==='rest').length;for(let i=6;i>=0&&c<n;i--)if(d[i]!=='rest'){d[i]='rest';c++}a.days=d}
function restDo(a,n,by){applyRest(a,n);a.restRec=abs()+2;a.restN=n;if(a.hsF)a.hsF.st='ok';MOOD(a,4);addLog(`🛌 ${by} cho ${a.name} nghỉ ${n} ngày/tuần trong 2 tuần theo khuyến nghị sức khỏe.`,'good')}
function hsApply(id){const a=byId(id);if(!a||!a.hsF)return;restDo(a,a.hsF.n,'Giám đốc');S.events=S.events.filter(e=>!(e.kind==='v3'&&e.t==='hs'&&e.a===id));act()}
const _pw=planWeek;planWeek=function(a,skill){const d=_pw(a,skill);if(a.restRec&&a.restRec>abs()){let c=d.filter(k=>k==='rest').length;for(let i=6;i>=0&&c<(a.restN||3);i--)if(d[i]!=='rest'){d[i]='rest';c++}}return d};
function hsTick(){if(!S.hs)return;let n=0;const ch=.4+S.hs.sk*.12;
  const L=S.artists.filter(a=>!a.busy&&!(a.hsF&&a.hsF.w>abs()-3)&&!(a.restRec>abs())).map(a=>({a,r:hsRisk(a)})).filter(x=>x.r.length).sort((x,y)=>y.r.length-x.r.length);
  for(const {a,r} of L){if(Math.random()>ch)continue;const need=clamp(Math.max(restN(a)+1,2+r.length),2,5),m=mgrOf(a)||null;a.hsF={w:abs(),why:r,n:need,st:'new'};
    if(n<2&&!S.events.some(e=>e.t==='hs'&&e.a===a.id)){pushEv({kind:'v3',t:'hs',a:a.id,n:need,m:m?m.id:0});n++}}
  if(L.length&&!n&&Math.random()<.3)addLog(`🩺 ${S.hs.name} đang theo dõi ${L.length} người có dấu hiệu mệt mỏi.`)}
function hsHTML(){const fl=S.artists.filter(a=>a.hsF&&a.hsF.w>=abs()-3).sort((x,y)=>(x.hsF.st==='ok')-(y.hsF.st==='ok')||y.hsF.why.length-x.hsF.why.length);
  let h=`<h3>🩺 Chuyên gia chăm sóc sức khỏe</h3>`;
  if(S.hs)h+=`<div class="card row"><div class="chibi mini">${chibiHTML(S.hs)}</div><div class="small" style="flex:1"><b>${esc(S.hs.name)}</b> · chuyên môn ${S.hs.sk}/5 · lương ${fmt(S.hs.sal)}/tuần<br><span class="muted">Mỗi tuần kiểm tra năng lượng, tâm trạng, lịch tập của nghệ sĩ và TTS. Ai cần nghỉ nhiều hơn sẽ được báo để quản lý cân nhắc. Chuyên môn cao phát hiện chính xác hơn.</span></div><button class="btn sm warn" onclick="hsFire(this)">Cho nghỉ</button></div>`;
  else{if(!S.hsC)genHSC();h+=`<div class="small muted" style="margin-bottom:6px">Chưa có chuyên gia. Chuyên gia sẽ phát hiện nghệ sĩ/TTS cần thêm lịch nghỉ và báo quản lý cân nhắc.</div>${S.hsC.map(c=>`<div class="card row"><div class="chibi mini">${chibiHTML(c)}</div><div class="small" style="flex:1"><b>${esc(c.name)}</b><br>Chuyên môn ${c.sk}/5 · lương ${fmt(c.sal)}/tuần</div><button class="btn sm pri" onclick="hsHire(${c.id})">Tuyển (${fmt(c.fee)})</button></div>`).join('')}`}
  h+=fl.length?`<div class="small" style="margin:6px 0 4px"><b>Cần thêm lịch nghỉ (${fl.length})</b></div>${fl.map(a=>{const m=mgrOf(a);return`<div class="prow"><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">${esc(a.name)}</button><span class="small muted">${a.status==='trainee'?'TTS · ':''}${esc(a.hsF.why.join(', '))} · đề xuất ${a.hsF.n} ngày nghỉ${m?' · QL '+esc(m.name):''}</span><span class="sp"></span>${a.hsF.st==='ok'?'<span class="tag m">✓ đã cho nghỉ</span>':`<button class="btn sm pri" onclick="hsApply(${a.id})">Áp dụng</button>`}</div>`}).join('')}`:(S.hs?'<div class="small muted">Chưa phát hiện ai cần nghỉ thêm.</div>':'');
  return h}
const _gym=RV.gym;RV.gym=function(){modal(trainRoom(ROOMS[6],'gym',hsHTML()))};

/* ---- Debut đầu tuần: hỏi nhóm hay solo ---- */
function dOpts(a){if(a.status!=='trainee')return null;const r=debutRec(a);if(r.t==='wait')return null;const so=bestOf(a,CONCEPTS)[0];
  const pool=S.artists.filter(x=>x.status==='trainee'&&!x.busy&&!groupsOf(x).length);let grp=null,gk=null;
  for(const k in CONCEPTS){const l=lineupWith(a,pool,CONCEPTS[k].w);if(l&&(!grp||l.sc>grp.sc)){grp=l;gk=k}}
  const soloOK=so.f>DEBUT_MIN,grpOK=!!(grp&&grp.f>DEBUT_MIN),actOK=r.t==='actor';
  return{r,so,grp,gk,soloOK,grpOK,actOK,both:soloOK&&grpOK}}
function dWish(a,o){if(a.dw&&a.dw.w>abs()-4)return a.dw;
  const mates=o.grp?o.grp.ids.filter(i=>i!==a.id).map(byId).filter(Boolean):[],fr=mates.filter(x=>a.tag[x.id]==='friend'),en=mates.filter(x=>a.tag[x.id]==='enemy');
  const s=(o.so.f-(o.grp?o.grp.f:0))*.6+(['vocal','rap'].includes(a.spec)?4:0)+(a.mood<40?-5:0)-fr.length*6+en.length*8+R(-4,4),t=s>0?'solo':'group';
  const why=t==='solo'?(en.length?`Em không hợp với ${en[0].name}, em muốn tự đứng trên sân khấu của mình.`:`Em tự tin vào ${STATS[a.spec]} và muốn thử sức solo với concept ${CONCEPTS[o.so.k].n}.`):(fr.length?`Em muốn debut cùng ${fr.map(x=>x.name).join(', ')}, tụi em đã cùng cố gắng rất lâu.`:`Em nghĩ đứng chung nhóm sẽ bổ trợ nhau tốt hơn, concept ${CONCEPTS[o.gk].n} rất hợp.`);
  a.dw={t,why,w:abs()};return a.dw}
const dqList=()=>S.artists.filter(a=>a.status==='trainee'&&a.dReady&&!a.busy&&(a.dqSkip||0)<=abs()).sort((x,y)=>debutRec(y).f-debutRec(x).f);
function dqBanner(){const L=dqList();return L.length?`<div class="card tg row"><span class="small" style="flex:1">🎊 <b>${L.length} TTS đủ điều kiện debut tuần này:</b> ${L.map(a=>esc(a.name)).join(', ')}</span><button class="btn sm pri" onclick="view(viewDebutQ)">Quyết định</button></div>`:''}
function gName(a){if(!a.dqName||S.groups.some(g=>g.name===a.dqName))a.dqName=pick(GNAMES.filter(n=>!S.groups.some(g=>g.name===n)).concat(['Starlight '+R(2,9)]));return a.dqName}
function viewDebutQ(){curRC='var(--r-lobby)';const L=dqList();
  const card=a=>{const o=dOpts(a);if(!o)return'';const w=o.both?dWish(a,o):null,gIds=o.grp?o.grp.ids:[],mates=gIds.filter(i=>i!==a.id).map(byId).filter(Boolean),notR=mates.filter(x=>!x.dReady);
    const btn=(t,lbl,cost)=>`<button class="btn sm ${(w?w.t===t:o.r.t===t)?'pri':''}" onclick="dqDo(${a.id},'${t}')">${lbl} (${fmt(cost)})</button>`;
    return`<div class="card ${o.both?'wish':''}"><div class="row"><div class="chibi mini">${chibiHTML(a)}</div><div style="flex:1;min-width:0"><b>${esc(a.name)}</b> <span class="tag s">✅ Đủ điều kiện</span>${o.both?' <span class="tag v">Nhóm & Solo</span>':''}<div class="small muted">${esc((batchOf(a)||{n:''}).n)} · đề xuất: ${DR[o.r.t]} · ${esc(o.r.why)}</div></div></div>
    ${o.grpOK?`<div class="small" style="margin-top:6px">👥 <b>Nhóm:</b> cùng ${mates.map(x=>esc(x.name)).join(', ')} · concept ${CONCEPTS[o.gk].n}${trendTag(o.gk)} ${Math.round(o.grp.f)}% · hòa hợp ${o.grp.hm>=0?'+':''}${o.grp.hm}${notR.length?` <span class="muted">(${notR.map(x=>esc(x.name)).join(', ')} chưa đủ điều kiện riêng nhưng hợp đội hình)</span>`:''}</div><div class="row" style="margin-top:4px"><span class="small">Tên nhóm:</span><input type="text" id="dqn${a.id}" value="${esc(gName(a))}" onchange="byId(${a.id}).dqName=this.value;save()" style="flex:1;min-width:0"></div>`:''}
    ${o.soloOK?`<div class="small" style="margin-top:4px">🎤 <b>Solo:</b> concept ${CONCEPTS[o.so.k].n}${trendTag(o.so.k)} ${Math.round(o.so.f)}%</div>`:''}
    ${w?`<div class="card row" style="margin:6px 0 0;background:var(--bg)"><span class="small">❓ Công ty hỏi: "Em muốn debut theo nhóm hay solo?"<br>💬 <b>${esc(a.name)}:</b> "${esc(w.why)}" → <b>muốn debut ${DRT[w.t]}</b></span></div>`:''}
    <div class="row" style="margin-top:8px">${o.grpOK?btn('group','👥 Debut nhóm',DEBUT_COST.group(gIds.length)):''}${o.soloOK?btn('solo','🎤 Debut solo',DEBUT_COST.solo()):''}${o.actOK?btn('actor','🎬 Debut diễn viên',DEBUT_COST.actor()):''}</div>
    <div class="row" style="margin-top:6px"><button class="btn sm" onclick="dqKeep(${a.id})">Tiếp tục làm TTS</button><button class="btn sm" onclick="dqLater(${a.id})">Để tuần sau</button><span class="sp"></span><button class="btn sm" onclick="view(()=>viewArtist(${a.id}))">Hồ sơ</button></div></div>`};
  modal(`<h2>🎊 Đầu tuần ${S.week}: quyết định debut</h2><div class="sub">Các TTS đủ điều kiện debut. Chọn cho debut ngay hoặc tiếp tục làm thực tập sinh. Ai đủ điều kiện cả nhóm lẫn solo sẽ được hỏi ý kiến; chọn đúng mong muốn giúp tâm trạng tốt hơn.</div>
  ${L.length?L.map(card).join(''):'<div class="card small">✅ Đã quyết định xong cho tất cả TTS đủ điều kiện tuần này.</div>'}
  <label class="small row"><input type="checkbox" ${S.dqOn!==false?'checked':''} onchange="S.dqOn=this.checked;save()"> Tự hiện danh sách này mỗi đầu tuần</label>
  <div class="row" style="margin-top:8px">${S.lastRep?'<button class="btn pri" onclick="view(viewReport)">📑 Xem báo cáo tuần trước</button>':''}<span class="sp"></span><button class="btn" onclick="closeM()">Đóng</button></div>`)}
function dqDo(id,t){const a=byId(id);if(!a)return;const o=dOpts(a);if(!o)return toast('Không còn đủ điều kiện');const w=o.both?a.dw:null;let ok=false;
  if(t==='group'){if(!o.grp)return toast('Không đủ người lập nhóm');ok=debutIds('group',o.grp.ids,($('#dqn'+id)?.value||gName(a)))}else ok=debutIds(t,[id]);
  if(ok&&w){const h=w.t===t;MOOD(a,h?8:-8);addLog(h?`😊 ${a.name} vui vì được debut ${DRT[t]} đúng mong muốn.`:`😕 ${a.name} tiếc vì muốn debut ${DRT[w.t]} nhưng công ty chọn ${DRT[t]}.`,h?'good':'bad');act()}}
function dqKeep(id){const a=byId(id);if(!a)return;a.dqSkip=abs()+4;a.noHold=true;addLog(`🌱 ${a.name} tiếp tục làm thực tập sinh, mở lịch nhận dự án. Công ty sẽ hỏi lại sau 4 tuần.`);act()}
function dqLater(id){const a=byId(id);if(!a)return;a.dqSkip=abs()+1;act()}

/* ---- Người ngoài công ty ---- */
const EXTN=['Jun Kai','Mina Lê','Rosie Trần','Leo Phạm','Hana Võ','Ryan Đỗ','Yuna Mai','Sky Nguyễn','Luna Hồ','Zen Lâm','Bella Vũ','Tony Lý','Coco Đinh','Nick Huỳnh','Amy Tô','Rin Đào','Kenji Bùi','Mia Cao'];
function extFill(){S.ext=S.ext||[];const used=new Set(S.ext.map(x=>x.name));while(S.ext.length<8){const nm=pick(EXTN.filter(n=>!used.has(n)));if(!nm)break;used.add(nm);const rv=S.rivals&&S.rivals.length?pick(S.rivals):{n:'Indie',fans:5e4};S.ext.push({id:uid(),name:nm,co:rv.n,fans:Math.round(rv.fans*rnd(.04,.25))})}}
const extById=id=>(S.ext||[]).find(x=>x.id===id);
const xRel=(a,x)=>(a.xr||{})[x.id]||0;
function setXr(a,x,v){a.xr=a.xr||{};a.xr[x.id]=clamp(Math.round(v),-100,100)}
function interTick(){extFill();const now=abs(),deb=S.artists.filter(a=>a.status==='debuted'),free=S.artists.filter(a=>!a.busy),evN=()=>S.events.filter(e=>e.kind==='v3').length;
  /* nghệ sĩ ↔ người ngoài */
  if(deb.length&&Math.random()<.45){const a=pick(deb),x=pick(S.ext),r=Math.random();
    if(r<.35){setXr(a,x,xRel(a,x)+R(10,22));addLog(`🎤 ${a.name} làm quen với ${x.name} (${x.co}) ở hậu trường show âm nhạc.${xRel(a,x)>=50?' Hai người đã khá thân.':''}`)}
    else if(r<.55&&x.fans>a.fans){const k=lowK(a);a.st[k]=clamp(+(a.st[k]+2).toFixed(1),0,100);setXr(a,x,xRel(a,x)+8);addLog(`💡 Tiền bối ${x.name} (${x.co}) chỉ cho ${a.name} vài bí quyết: ${STATS[k]} +2.`,'good')}
    else if(r<.78&&!a.busy&&evN()<3)pushEv({kind:'v3',t:'xcollab',a:a.id,x:x.id})
    else if(r<.9&&a.fans>5000&&xRel(a,x)>=25&&!a.scandal&&evN()<3)pushEv({kind:'v3',t:'xrumor',a:a.id,x:x.id})
    else{MOOD(a,-3);setXr(a,x,xRel(a,x)-10);addLog(`😤 ${x.name} (${x.co}) bóng gió chê ${a.name} trên livestream. ${a.name} hơi buồn nhưng có thêm động lực.`)}}
  /* nghệ sĩ ↔ nghệ sĩ trong công ty */
  if(free.length>=2&&Math.random()<.35){const a=pick(free),b=pick(free.filter(x=>x!==a&&x.tag[a.id]!=='enemy'));if(b){setRel(a,b,getRel(a,b)+R(4,10));a.st[b.spec]=clamp(+(a.st[b.spec]+1).toFixed(1),0,100);b.st[a.spec]=clamp(+(b.st[a.spec]+1).toFixed(1),0,100);addLog(`🤝 ${a.name} rủ ${b.name} tập thêm buổi tối: ${STATS[b.spec]} và ${STATS[a.spec]} cùng tiến bộ.`);if(!a.tag[b.id]&&getRel(a,b)>=60){setTag(a,b,'friend');addLog(`🤝 ${a.name} và ${b.name} trở thành bạn thân.`,'good')}}}
  /* nghệ sĩ ↔ quản lý */
  if(Math.random()<.3){const a=pick(S.artists.filter(x=>!x.busy&&mgrOf(x))||[]);if(a){const m=mgrOf(a);
    if(a.energy<45&&trainDays(a)>=5&&evN()<3&&!S.events.some(e=>e.t==='amgr'))pushEv({kind:'v3',t:'amgr',a:a.id,m:m.id});
    else if(a.mood>70&&effSk(m,'care')>=4){mgrExp(m,.5);addLog(`🎁 ${a.name} tặng quà cảm ơn QL ${m.name} vì đã chăm sóc chu đáo.`,'good')}}}
  /* quản lý ↔ quản lý */
  if(S.managers.length>=2&&Math.random()<.4){const x=pick(S.managers),y=pick(S.managers.filter(m=>m!==x)),r=Math.random();
    if(r<.45){setMrel(x,y,mrel(x,y)+R(5,12));if(mrel(x,y)>=40&&x.sk[x.spec]>y.sk[x.spec]&&y.sk[x.spec]<10&&Math.random()<.4){y.sk[x.spec]++;addLog(`☕ QL ${x.name} chia sẻ kinh nghiệm ${MSK[x.spec]} cho QL ${y.name} (+1).`,'good')}else addLog(`☕ QL ${x.name} và QL ${y.name} đi cà phê, trao đổi công việc.`)}
    else if(r<.7&&x.as&&y.as&&evN()<3&&!S.events.some(e=>e.t==='mmclash'))pushEv({kind:'v3',t:'mmclash',m:x.id,m2:y.id,why:pick(['tranh lịch phòng tập cho nghệ sĩ mình phụ trách','tranh lời mời béo bở','bất đồng cách xử lý truyền thông','đổ lỗi cho nhau về lịch trình trùng'])});
    else{const hi=x.lv>=y.lv?x:y,lo=hi===x?y:x;if(hi.lv>lo.lv&&!lo.boss&&canKid(hi,lo)&&evN()<3&&!S.events.some(e=>e.t==='mmcoach'))pushEv({kind:'v3',t:'mmcoach',m:hi.id,m2:lo.id})}}
  for(const m of S.managers){const b=mBoss(m);if(b)setMrel(m,b,mrel(m,b)+1)}
}

/* ---- Tiền bối, giới thiệu TTS, GĐ Âm nhạc ---- */
function v3Tick(){const evN=()=>S.events.filter(e=>e.kind==='v3').length;
  /* nghệ sĩ tự đề xuất dẫn dắt TTS */
  if(!S.events.some(e=>e.t==='mtreq')){const ms=S.artists.filter(m=>m.status==='debuted'&&!m.busy&&m.mood>=45&&menteesOf(m).length<2&&abs()-(m.mtRq||-99)>=6);
    for(const m of ms.sort(()=>Math.random()-.5)){if(Math.random()>.15)continue;const t=S.artists.filter(x=>x.status==='trainee'&&!x.mt&&x.tag[m.id]!=='enemy').sort((x,y)=>mentorScore(m,y)-mentorScore(m,x))[0];if(t&&mentorScore(m,t)>3){m.mtRq=abs();pushEv({kind:'v3',t:'mtreq',a:m.id,b:t.id});break}}}
  /* tiền bối giới thiệu đàn em vào dự án */
  if(!S.events.some(e=>e.t==='mtjob'))for(const t of S.artists.filter(x=>x.status==='trainee'&&x.mt&&!x.busy&&!dHold(x)).sort(()=>Math.random()-.5)){const m=byId(t.mt);if(!m||Math.random()>.3)continue;
    const ofs=S.offers.filter(o=>OFFER[o.type].trainee&&(!o.target||o.target===t.id)&&slotsOf(o)>=1).filter(o=>{const old=o.target;o.target=t.id;const ok=!canTake(o,t);o.target=old;return ok});
    if(ofs.length){const of=ofs.sort((x,y)=>y.pay-x.pay)[0];pushEv({kind:'v3',t:'mtjob',a:m.id,b:t.id,of:of.id});break}}
  /* nghệ sĩ giới thiệu TTS mới */
  {const deb=S.artists.filter(a=>a.status==='debuted');if(deb.length&&Math.random()<.07&&!S.events.some(e=>e.t==='intro')&&evN()<4){const a=pick(deb),c=genArtist();c.talent=+rnd(.95,1.25).toFixed(2);c.st[c.spec]=clamp(c.st[c.spec]+R(4,12),0,75);pushEv({kind:'v3',t:'intro',a:a.id,cand:c,how:pick(['bạn thời cấp ba','đàn em cùng lớp nhảy','người quen ở phòng thu','em họ','bạn cùng xóm','đàn em ở câu lạc bộ âm nhạc'])})}}
  /* trợ lý cá nhân: nghệ sĩ nhóm xin chọn */
  {const L=S.artists.filter(a=>paOK(a)&&!a.pa&&abs()-(a.paAsk||-99)>=10);if(L.length&&Math.random()<.08&&!S.events.some(e=>e.t==='paask')){const a=pick(L);a.paAsk=abs();pushEv({kind:'v3',t:'paask',a:a.id})}}
  /* GĐ Âm nhạc tự sáng tác */
  if(acts().length&&Math.random()<.13&&!S.events.some(e=>e.t==='md')){const ck=S.trend&&Math.random()<.55?pick(S.trend.hot):pick(Object.keys(CONCEPTS));
    const s={id:uid(),t:pick(SONGW.concat(SONGS)),ck,q:clamp(R(40,78)+Math.floor(compRep()/8),20,96),by:[],st:'ok',w:abs(),doneAt:abs(),y:S.year,md:1};const r=mdReview(s);
    if(r.sug.length){s.rv={g:r.g,mk:r.mk};pushEv({kind:'v3',t:'md',song:s,k:r.sug[0].k},true)}}
  hsTick();interTick();
  {const t=S.artists.reduce((x,a)=>x+(a.pa?a.pa.sal:0),0)+(S.hs?S.hs.sal:0);if(t){S.money-=t;book('mgr',-t)}}
  if(S.week%8===0&&!S.hs)genHSC();
}
const _w2=weekV2;weekV2=function(){_w2();migrateV3();v3Tick()};
const _wc=weekCost;weekCost=function(){return _wc()+S.artists.reduce((t,a)=>t+(a.pa?a.pa.sal:0),0)+(S.hs?S.hs.sal:0)};

/* ---- Sự kiện v3 ---- */
function v3Info(e){const a=e.a!=null?byId(e.a):null,b=e.b?byId(e.b):null;
  switch(e.t){
  case'mtreq':{if(!a||!b||b.status!=='trainee'||b.mt)return null;const k=focusKeys(b).reduce((m,x)=>(a.st[x]-b.st[x])>(a.st[m]-b.st[m])?x:m),fr=a.tag[b.id]==='friend';
    return{ic:'🙋',t:`${a.name} muốn dẫn dắt TTS ${b.name}`,d:`${a.name} tự đề xuất làm tiền bối cho ${b.name}: "Em thấy ${b.name} còn yếu ${STATS[k]} (${Math.round(b.st[k])} so với ${Math.round(a.st[k])} của em), em muốn kèm thêm."${fr?' Hai người vốn thân thiết.':''} Tập nhanh hơn tối đa +40%, tiền bối tốn chút năng lượng mỗi tuần. Đang dẫn dắt ${menteesOf(a).length}/2.`,o:[{k:'yes',l:'Đồng ý'},{k:'no',l:'Từ chối'}]}}
  case'mtjob':{const of=S.offers.find(o=>o.id===e.of);if(!a||!b||!of||b.busy)return null;const O=OFFER[of.type];
    return{ic:'🤝',t:`${a.name} giới thiệu đàn em ${b.name} vào dự án`,d:`Tiền bối ${a.name} quen ${of.partner} và tiến cử ${b.name} cho ${O.n} «${of.title}» (${of.weeks} tuần, thù lao gốc ${fmt(of.pay)}). Nhờ được giới thiệu, đối tác mời đích danh nên yêu cầu giảm 20% và quan hệ đối tác tăng.`,o:[{k:'yes',l:'Nhận dự án'},{k:'no',l:'Từ chối'}]}}
  case'intro':{if(!a||!e.cand)return null;const c=e.cand;return{ic:'💌',t:`${a.name} giới thiệu một gương mặt mới`,d:`${a.name} giới thiệu ${c.name} (${e.how}), năng khiếu ${STATS[c.spec]}, tố chất x${c.talent}: "Bạn ấy rất chăm chỉ, em tin sẽ hợp với công ty." Ký hợp đồng TTS 10 tr.`,o:[{k:'yes',l:'Mời làm TTS (10 tr)'},{k:'no',l:'Bỏ qua'}]}}
  case'paask':{if(!a||!paOK(a)||a.pa)return null;const gm=groupsOf(a).map(g=>gMgr(g)).find(Boolean);return{ic:'🧑‍💻',t:`${a.name} muốn tự chọn trợ lý cá nhân`,d:`${a.name} đang được quản lý theo nhóm${gm?' bởi QL '+gm.name:''} và muốn có trợ lý riêng để lo việc cá nhân. ${a.name} sẽ tự chọn trong 3 ứng viên, bạn duyệt chi phí.`,o:[{k:'yes',l:'Cho tự chọn'},{k:'no',l:'Để sau'}]}}
  case'hs':{if(!a||!S.hs||!a.hsF)return null;const m=e.m?S.managers.find(x=>x.id===e.m):null;
    return{ic:'🩺',t:`Chuyên gia: ${a.name} cần nghỉ nhiều hơn`,d:`${S.hs.name} phát hiện ${a.status==='trainee'?'TTS':'nghệ sĩ'} ${a.name}: ${a.hsF.why.join(', ')}. Đề xuất ${e.n} ngày nghỉ/tuần trong 2 tuần (hiện ${restN(a)} ngày). ${m?`Đã gửi QL ${m.name} (Chăm sóc ${effSk(m,'care')}) cân nhắc.`:'Chưa có quản lý, cần Giám đốc quyết định.'}`,o:m?[{k:'yes',l:'Áp dụng ngay'},{k:'no',l:'Giữ lịch hiện tại'},{k:'mgr',l:`Để QL ${m.name} cân nhắc`}]:[{k:'yes',l:'Áp dụng'},{k:'no',l:'Giữ lịch hiện tại'}]}}
  case'md':{const s=e.song,x=actByKey(e.k);if(!s||!x)return null;const r=mdReview(s);
    return{ic:'🎼',t:`GĐ Âm nhạc sáng tác «${s.t}» cho ${x.n.slice(2).trim()}`,d:`GĐ Âm nhạc tự sáng tác một bài ${CONCEPTS[s.ck].n}${trendTag(s.ck)}, chất lượng ${s.q}/100, hạng ${r.g}. "${r.cm}" Đề xuất nghệ sĩ hợp: ${r.sug.map(z=>`${z.n.slice(2).trim()} ${z.f}%${z.free?'':' (đang bận)'}`).join(', ')}.`,o:[{k:'give',l:`Giao cho ${x.n.slice(2).trim()}`},{k:'no',l:'Không dùng'},{k:'keep',l:'Lưu vào kho bài'}]}}
  case'xcollab':{const x=extById(e.x);if(!a||!x||a.busy)return null;return{ic:'🎙️',t:`${x.name} (${x.co}) mời ${a.name} hợp tác`,d:`${x.name} của ${x.co} (${fmtN(x.fans)} fan, quan hệ ${xRel(a,x)}) mời ${a.name} góp giọng một ca khúc. Mất 1 tuần, tiếp cận fan của công ty bạn, nhận thù lao.`,o:[{k:'yes',l:'Nhận lời'},{k:'no',l:'Từ chối'}]}}
  case'xrumor':{const x=extById(e.x);if(!a||!x)return null;return{ic:'📸',t:`Tin đồn hẹn hò: ${a.name} & ${x.name}`,d:`Báo lá cải đăng ảnh ${a.name} đi ăn cùng ${x.name} (${x.co}). Fan hai bên đang tranh cãi.`,o:[{k:'deny',l:'Phủ nhận'},{k:'admit',l:'Xác nhận là bạn thân'},{k:'quiet',l:'Im lặng'}]}}
  case'amgr':{const m=S.managers.find(x=>x.id===e.m);if(!a||!m)return null;return{ic:'😮‍💨',t:`${a.name} than phiền về lịch của QL ${m.name}`,d:`${a.name} (năng lượng ${Math.round(a.energy)}, tập ${trainDays(a)}/7 ngày) nói với Giám đốc rằng QL ${m.name} xếp lịch quá dày.`,o:[{k:'rest',l:'Yêu cầu QL giảm lịch'},{k:'back',l:'Ủng hộ quản lý'}]}}
  case'mmclash':{const x=S.managers.find(z=>z.id===e.m),y=S.managers.find(z=>z.id===e.m2);if(!x||!y)return null;return{ic:'⚡',t:`QL ${x.name} và QL ${y.name} tranh cãi`,d:`Hai quản lý ${e.why}. Quan hệ hiện tại ${mrel(x,y)}.`,o:[{k:'meet',l:'Họp hòa giải (5 tr)'},{k:'x',l:`Đứng về phía ${x.name}`},{k:'y',l:`Đứng về phía ${y.name}`},{k:'none',l:'Để họ tự giải quyết'}]}}
  case'mmcoach':{const x=S.managers.find(z=>z.id===e.m),y=S.managers.find(z=>z.id===e.m2);if(!x||!y||!canKid(x,y)||y.boss)return null;return{ic:'👔',t:`QL ${x.name} đề nghị kèm cặp QL ${y.name}`,d:`${x.name} (cấp ${x.lv}) muốn nhận ${y.name} (cấp ${y.lv}) làm cấp dưới. Cấp dưới được cộng 20% kỹ năng cấp trên, cấp trên nhận một nửa kinh nghiệm cấp dưới.`,o:[{k:'yes',l:'Đồng ý'},{k:'no',l:'Không'}]}}
  }return null}
function v3Resolve(e,k){const a=e.a!=null?byId(e.a):null,b=e.b?byId(e.b):null;
  switch(e.t){
  case'mtreq':if(!a||!b)return;if(k==='yes'){if(b.status!=='trainee'||b.mt||menteesOf(a).length>=2)return toast('Không còn phù hợp');b.mt=a.id;setRel(a,b,getRel(a,b)+10);MOOD(a,6);MOOD(b,4);addLog(`👩‍🏫 ${a.name} tự đề xuất và được duyệt dẫn dắt TTS ${b.name}.`,'good')}else{MOOD(a,-3);addLog(`🙅 Từ chối đề xuất dẫn dắt ${b.name} của ${a.name}.`)}return;
  case'mtjob':{const of=S.offers.find(o=>o.id===e.of);if(!a||!b||!of)return;if(k!=='yes'){addLog(`🙅 Từ chối dự án ${a.name} giới thiệu cho ${b.name}.`);return}
    const old=of.target;of.target=b.id;const why=canTake(of,b);if(why){of.target=old;toast(b.name+': '+why);return}acceptCast(of.id,[b.id],true);
    if(!S.offers.includes(of)){S.partners[of.partner]=(S.partners[of.partner]||0)+2;setRel(a,b,getRel(a,b)+5);MOOD(a,4);MOOD(b,5);addLog(`🤝 Nhờ tiền bối ${a.name} giới thiệu, ${b.name} nhận «${of.title}».`,'good')}return}
  case'intro':{if(!a||!e.cand)return;if(k!=='yes'){MOOD(a,-2);return}if(S.money<10e6){toast('Không đủ tiền');S.events.push(e);return}const c=e.cand;if(S.artists.some(x=>x.id===c.id))return;S.money-=10e6;book('hr',-10e6);c.batch=ensureCurBatch();c.xr={};S.artists.push(c);setRel(a,c,45);setTag(a,c,'friend');MOOD(a,5);addLog(`💌 ${c.name} được ${a.name} giới thiệu, ký hợp đồng TTS vào ${(S.batches.find(x=>x.id===c.batch)||{n:''}).n}.`,'gold');return}
  case'paask':if(!a)return;if(k==='yes')setTimeout(()=>paOpen(a.id),0);else MOOD(a,-3);return;
  case'hs':{if(!a)return;const m=e.m?S.managers.find(x=>x.id===e.m):null;if(k==='yes')restDo(a,e.n,'Giám đốc');
    else if(k==='mgr'&&m){if(Math.random()<mxP(m,'care',.45)){restDo(a,e.n,'QL '+m.name);mgrExp(m,.5)}else{if(a.hsF)a.hsF.st='kept';MOOD(a,-2);addLog(`📋 QL ${m.name} cân nhắc và giữ lịch hiện tại cho ${a.name} vì lịch trình đang quan trọng.`)}}
    else{if(a.hsF)a.hsF.st='kept';MOOD(a,-3);addLog(`⚠️ Giữ nguyên lịch của ${a.name} dù chuyên gia khuyên nghỉ thêm.`,'bad')}return}
  case'md':{const s=e.song;if(!s)return;if(k==='no'){addLog(`🎼 Bài «${s.t}» của GĐ Âm nhạc không được sử dụng.`);return}S.songs=S.songs||[];S.songs.unshift(s);if(S.songs.length>40)S.songs.length=40;
    if(k==='give'){s.for=e.k;const x=actByKey(e.k);addLog(`🎼 GĐ Âm nhạc giao bài «${s.t}» (hạng ${s.rv.g}) cho ${x?x.n.slice(2).trim():''}.`,'good');if(x&&actFree(x))setTimeout(()=>songRelease(s.id,e.k),0)}else addLog(`🎼 Lưu bài «${s.t}» của GĐ Âm nhạc vào kho.`);return}
  case'xcollab':{const x=extById(e.x);if(!a||!x)return;if(k!=='yes'){setXr(a,x,xRel(a,x)-8);return}if(a.busy)return toast('Đang bận');
    const g=Math.round(Math.min(x.fans,a.fans*3+20000)*rnd(.03,.08)),pay=R(10,40)*1e6;a.fans+=g;a.yr.fans+=g;S.money+=pay;book('job',pay,[a]);setXr(a,x,xRel(a,x)+15);a.busy={kind:'promo',title:'Hợp tác với '+x.name,left:1,total:1};a.hist.unshift(`N${S.year} T${S.week}: hợp tác với ${x.name} (${x.co})`);addLog(`🎙️ ${a.name} hợp tác với ${x.name} (${x.co}): +${fmtN(g)} fan, +${fmt(pay)}.`,'good');return}
  case'xrumor':{const x=extById(e.x);if(!a||!x)return;
    if(k==='deny'){if(Math.random()<.7){MOOD(a,-2);addLog(`📰 ${a.name} phủ nhận tin đồn với ${x.name}, dư luận lắng xuống.`)}else{a.fans=Math.round(a.fans*.97);addLog(`📰 Lời phủ nhận của ${a.name} bị nghi ngờ, fan giảm 3%.`,'bad')}}
    else if(k==='admit'){a.fans=Math.round(a.fans*.99);setXr(a,x,xRel(a,x)+10);MOOD(a,5);addLog(`📰 ${a.name} xác nhận chỉ là bạn thân với ${x.name}. Fan thông cảm.`)}
    else if(Math.random()<.5){a.fans=Math.round(a.fans*.96);addLog(`📰 ${a.name} im lặng trước tin đồn với ${x.name}, fan giảm 4%.`,'bad')}else addLog(`📰 Tin đồn ${a.name} & ${x.name} tự lắng xuống.`);return}
  case'amgr':{const m=S.managers.find(x=>x.id===e.m);if(!a||!m)return;if(k==='rest'){restDo(a,3,'QL '+m.name);MOOD(a,4)}else{MOOD(a,-6);mgrExp(m,.3);addLog(`📋 Giám đốc ủng hộ QL ${m.name}, ${a.name} không vui.`,'bad')}return}
  case'mmclash':{const x=S.managers.find(z=>z.id===e.m),y=S.managers.find(z=>z.id===e.m2);if(!x||!y)return;
    if(k==='meet'){if(S.money<5e6){toast('Không đủ tiền');S.events.push(e);return}S.money-=5e6;book('oth',-5e6);setMrel(x,y,mrel(x,y)+20);mgrExp(x,.3);mgrExp(y,.3);addLog(`🕊️ Buổi họp hòa giải giúp QL ${x.name} và ${y.name} hiểu nhau hơn.`,'good')}
    else if(k==='x'||k==='y'){const w=k==='x'?x:y,l=k==='x'?y:x;mgrExp(w,.6);setMrel(x,y,mrel(x,y)-15);addLog(`⚖️ Giám đốc đứng về phía QL ${w.name}; QL ${l.name} không phục.`)}
    else{setMrel(x,y,mrel(x,y)-10);addLog(`⚡ QL ${x.name} và ${y.name} tự giải quyết nhưng vẫn còn khúc mắc.`)}return}
  case'mmcoach':{const x=S.managers.find(z=>z.id===e.m),y=S.managers.find(z=>z.id===e.m2);if(!x||!y)return;if(k==='yes'&&canKid(x,y)){y.boss=x.id;setMrel(x,y,mrel(x,y)+10);addLog(`👔 QL ${x.name} nhận kèm cặp QL ${y.name}.`,'good')}else setMrel(x,y,mrel(x,y)-5);return}
  }}
const _xI=xInfo;xInfo=function(e){return e.kind==='v3'?v3Info(e):_xI(e)};
const _xR=xResolve;xResolve=function(e,k){return e.kind==='v3'?v3Resolve(e,k):_xR(e,k)};

/* ---- Hồ sơ nghệ sĩ & phòng ---- */
const _aT=aTags;aTags=function(a){let t=_aT(a);if(a.pa)t+=`<span class="tag m">🧑‍💻 ${esc(a.pa.name)}</span>`;if(a.restRec>abs())t+='<span class="tag">🛌 Lịch nghỉ thêm</span>';else if(a.hsF&&a.hsF.w>=abs()-3&&a.hsF.st!=='ok')t+='<span class="tag r">🩺 Cần nghỉ</span>';return t};
function v3ArtistHTML(a){let h='';
  if(paOK(a))h+=`<div class="card small">🧑‍💻 <b>Trợ lý cá nhân:</b> ${a.pa?`${esc(a.pa.name)} · ${MSK[a.pa.k]} +${a.pa.v} · ${fmt(a.pa.sal)}/tuần`:'<span class="muted">chưa có</span>'} <button class="btn sm" onclick="paOpen(${a.id})">${a.pa?'Đổi trợ lý':'Để '+esc(a.name)+' tự chọn'}</button><br><span class="muted">Nghệ sĩ được quản lý theo nhóm có thể tự chọn trợ lý riêng.</span></div>`;
  if(a.hsF&&a.hsF.w>=abs()-3)h+=`<div class="card small">🩺 <b>Chuyên gia sức khỏe:</b> ${esc(a.hsF.why.join(', '))}. Đề xuất ${a.hsF.n} ngày nghỉ/tuần. ${a.restRec>abs()?'<span class="good">Đang áp dụng.</span>':`<button class="btn sm pri" onclick="hsApply(${a.id})">Áp dụng</button>`}</div>`;
  if(a.status==='trainee'&&a.dReady){const o=dOpts(a);if(o&&o.both){const w=dWish(a,o);h+=`<div class="card small wish">💬 <b>Mong muốn debut:</b> ${DRT[w.t]} — "${esc(w.why)}" <button class="btn sm pri" onclick="view(viewDebutQ)">Quyết định</button></div>`}}
  if(a.status==='debuted'&&menteesOf(a).length<2){const t=S.artists.filter(x=>x.status==='trainee'&&!x.mt&&x.tag[a.id]!=='enemy').sort((x,y)=>mentorScore(a,y)-mentorScore(a,x))[0];if(t&&mentorScore(a,t)>3)h+=`<div class="card small">🙋 <b>${esc(a.name)} đề xuất dẫn dắt:</b> ${esc(t.name)} (+${Math.round(mentorScore(a,t))}) <button class="btn sm" onclick="setMentor(${t.id},${a.id})">Đồng ý</button></div>`}
  const xs=Object.keys(a.xr||{}).map(id=>({x:extById(+id),v:a.xr[id]})).filter(z=>z.x).sort((p,q)=>q.v-p.v).slice(0,5);
  if(xs.length)h+=`<div class="card small">🌐 <b>Quan hệ ngoài công ty:</b> ${xs.map(z=>`${esc(z.x.name)} (${esc(z.x.co)}) ${relTxt(z.v)}`).join(' · ')}</div>`;
  return h}
const _dorm=RV.dorm;RV.dorm=function(){_dorm();const p=$('#sheet .panel');if(!p)return;
  const L=[];S.artists.forEach(a=>Object.keys(a.xr||{}).forEach(id=>{const x=extById(+id);if(x&&a.xr[id])L.push({a,x,v:a.xr[id]})}));L.sort((p,q)=>Math.abs(q.v)-Math.abs(p.v));
  const ml=S.artists.filter(a=>a.pa);
  p.insertAdjacentHTML('beforeend',det('dm-ext',`🌐 Giao lưu ngoài công ty (${L.length})`,`<div class="small muted" style="margin-bottom:6px">Nghệ sĩ gặp idol công ty khác ở show âm nhạc, hậu trường, livestream. Quan hệ tốt mở ra lời mời hợp tác; thân quá dễ thành tin đồn.</div>${L.slice(0,15).map(z=>`<div class="card small row"><b>${esc(z.a.name)}</b> ↔ ${esc(z.x.name)} <span class="muted">(${esc(z.x.co)})</span><span class="sp"></span>${relTxt(z.v)}</div>`).join('')||'<div class="small muted">Chưa có giao lưu nào.</div>'}`,false)+(ml.length?det('dm-pa',`🧑‍💻 Trợ lý cá nhân (${ml.length})`,ml.map(a=>`<div class="small">${esc(a.name)}: ${esc(a.pa.name)} · ${MSK[a.pa.k]} +${a.pa.v}</div>`).join(''),false):''))};

/* ---- Hướng dẫn người mới ---- */
const TUT=[
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
let tutI=-1;
function tutStart(i){closeM();tutI=i||0;tutShow()}
function tutShow(){document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl'));let el=$('#tut');
  if(tutI<0||tutI>=TUT.length){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='tut';el.setAttribute('role','dialog');document.body.appendChild(el)}
  const s=TUT[tutI],tg=s.sel?document.querySelector(s.sel):null;if(tg){tg.classList.add('tut-hl');try{tg.scrollIntoView({behavior:'smooth',block:'center',inline:'center'})}catch(e){}}
  el.innerHTML=`<div class="tutc">${s.first?'':`<div class="small muted">Hướng dẫn · ${tutI}/${TUT.length-1}</div>`}<h3>${s.t}</h3><div class="small">${s.d}</div>
  <div class="row" style="margin-top:10px">${s.first?`<button class="btn" onclick="tutEnd()">Bỏ qua, tôi đã biết chơi</button><span class="sp"></span><button class="btn pri" onclick="tutGo(1)">Xem hướng dẫn ➜</button>`:`<button class="btn sm" onclick="tutEnd()">Bỏ qua</button><span class="sp"></span>${tutI>1?'<button class="btn sm" onclick="tutGo(-1)">← Trước</button>':''}<button class="btn sm pri" onclick="tutGo(1)">${tutI===TUT.length-1?'Hoàn thành ✓':'Tiếp ➜'}</button>`}</div>
  ${s.first?'':`<div class="tutdots">${TUT.slice(1).map((_,i)=>`<i class="${i+1===tutI?'on':''}"></i>`).join('')}</div>`}</div>`}
function tutGo(d){tutI+=d;if(tutI>=TUT.length)return tutEnd();if(tutI<1)tutI=1;tutShow()}
function tutEnd(){tutI=-1;S.tut=1;save();tutShow()}

/* ================= BOOT ================= */
if(!load())newGame();
migrateV3();render();save();
if(!S.tut&&!localStorage.getItem('__golden'))setTimeout(()=>tutStart(0),400);
(async()=>{try{if(window.claude&&window.claude.use){DB=await window.claude.use('db')}}catch(e){DB=null}dbState='done';save();if(curView)curView()})();
window.__game = { nextWeek: (...a) => nextWeek(...a), state: () => S };
