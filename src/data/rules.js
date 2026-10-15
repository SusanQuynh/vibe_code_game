export const STATS={vocal:1,dance:1,rap:1,acting:1,variety:1,visual:1,stamina:1};
export const TRAIN_COST=3e6;
export const TRAIN={
  vocal:{room:'vocal',g:{vocal:3},e:-12},
  dance:{room:'dance',g:{dance:3,stamina:.5},e:-15},
  rap:{room:'studio',g:{rap:3},e:-10},
  acting:{room:'acting',g:{acting:3},e:-12},
  variety:{room:'pr',g:{variety:3},e:-8},
  gym:{room:'gym',g:{stamina:2.4,visual:1.2},e:-14},
  rest:{room:'dorm',g:{},e:35}
};
export const ROOMS=[
  {id:'ceo',ic:'💼',f:5},
  {id:'meet',ic:'📨',f:5},
  {id:'studio',ic:'🎙️',f:4},
  {id:'acting',ic:'🎬',f:4},
  {id:'vocal',ic:'🎤',f:3},
  {id:'dance',ic:'🪩',f:3},
  {id:'gym',ic:'🏋️',f:2},
  {id:'pr',ic:'📰',f:2},
  {id:'lobby',ic:'🌟',f:1},
  {id:'dorm',ic:'🛏️',f:1},
  {id:'mgr',ic:'📋',f:6},
  {id:'roof',ic:'☕',f:6},
  {id:'invest',ic:'📈',f:7},
  {id:'market',ic:'📊',f:7},
  {id:'sales',ic:'💹',f:8},
  {id:'hr',ic:'🗂️',f:8}
];
export const MSK={nego:1,care:1,pr:1,plan:1};
export const MSKD={nego:1,care:1,pr:1,plan:1};
export const GENRES={
  romance:{w:{acting:.5,visual:.4,vocal:.1}},
  action:{w:{acting:.4,stamina:.4,dance:.2}},
  horror:{w:{acting:.7,stamina:.3}},
  comedy:{w:{acting:.4,variety:.6}},
  historical:{w:{acting:.5,visual:.3,stamina:.2}},
  drama:{w:{acting:.9,visual:.1}},
  musical:{w:{acting:.4,vocal:.3,dance:.3}}
};
export const CONCEPTS={
  cute:{w:{vocal:.3,dance:.3,visual:.4}},
  crush:{w:{dance:.4,rap:.3,visual:.3}},
  ballad:{w:{vocal:.7,acting:.2,visual:.1}},
  hiphop:{w:{rap:.6,dance:.3,visual:.1}},
  edm:{w:{dance:.5,vocal:.3,stamina:.2}},
  retro:{w:{vocal:.4,dance:.3,variety:.3}},
  fantasy:{w:{dance:.4,visual:.4,acting:.2}}
};
export const CB=[3,2,1]; // contest stat bonus for ranks 1-3, scaled by skill weight
export const MDOM={group:1,solo:1,actor:1,trainee:1}; // manager domains
export const DOM_KEYS=Object.keys(MDOM);
