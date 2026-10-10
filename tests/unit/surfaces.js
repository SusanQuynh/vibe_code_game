// Danh sách bề mặt UI dùng chung cho ui-vi-body (snapshot vi), ui-en-leak (không rò chữ Việt ở en) và lang-invariant.
// open() chạy sau khi state fixture đã nạp. Trả 'n/a' (chuỗi) nếu fixture không có đối tượng cần mở: snapshot ghi rõ n/a.
import { S } from '../../src/state.js';
import { ROOMS } from '../../src/data/rules.js';
import { render } from '../../src/ui/building.js';
import { openRoom } from '../../src/ui/rooms.js';
import { view } from '../../src/ui/modal.js';
import { viewArtist, viewEvents, viewSkipWarn, viewAward, viewReport, viewReportFull } from '../../src/ui/views.js';
import { startPlan } from '../../src/ui/planning.js';
import { viewCode } from '../../src/ui/saveView.js';
import { viewProps } from '../../src/systems/proposals.js';
import { viewSec } from '../../src/systems/secretary.js';
import { viewCamp } from '../../src/systems/releases.js';
import { viewRenew, viewSong, viewSongs } from '../../src/systems/ext2.js';
import { viewDebutQ, viewPA, paOK } from '../../src/systems/ext3.js';
import { viewInv } from '../../src/systems/events.js';

const NA = 'n/a';
const A = f => S.artists.find(f);
const PANEL = '#sheet .panel';
const room = (id, fx, extra) => ({ id: `room.${id}.${fx}`, fx, sel: PANEL, open: () => { openRoom(id); extra?.(); } });
const V = (id, fx, fn, sel = PANEL) => ({ id, fx, sel, open: () => { const r = fn(); return r === NA ? NA : undefined; } });
const lobbyType = t => () => { const e = document.getElementById('dType'); if (e) { e.value = t; e.onchange?.(); } };

export const SURFACES = [
  ...['new', 'rich'].flatMap(fx => ROOMS.map(r => room(r.id, fx))),
  room('lobby', 'rich.group', lobbyType('group')),
  room('lobby', 'rich.actor', lobbyType('actor')),
  V('artist.trainee', 'rich', () => { const a = A(x => x.status === 'trainee'); return a ? view(() => viewArtist(a.id)) : NA; }),
  V('artist.trainee.new', 'new', () => { const a = A(x => x.status === 'trainee'); return a ? view(() => viewArtist(a.id)) : NA; }),
  V('artist.solo', 'rich', () => { const a = A(x => x.solo); return a ? view(() => viewArtist(a.id)) : NA; }),
  V('artist.group', 'rich', () => { const a = A(x => x.status === 'debuted' && !x.solo && !x.actor && S.groups.some(g => g.members.includes(x.id))); return a ? view(() => viewArtist(a.id)) : NA; }),
  V('artist.actor', 'rich', () => { const a = A(x => x.actor); return a ? view(() => viewArtist(a.id)) : NA; }),
  V('report', 'rich', () => view(viewReport)),
  V('reportFull', 'rich', () => view(viewReportFull)),
  V('events', 'rich', () => view(viewEvents)),
  V('events.new', 'new', () => view(viewEvents)),
  V('skipWarn', 'rich', () => view(viewSkipWarn)),
  V('award', 'rich', () => S.awards.length ? view(() => viewAward(S.awards.at(-1))) : NA),
  V('plan', 'rich', () => startPlan(false, true)),
  V('plan.new', 'new', () => startPlan(false, true)),
  V('code', 'rich', () => view(viewCode)),
  V('props', 'rich', () => view(viewProps)),
  V('sec', 'rich', () => view(viewSec)),
  V('sec.new', 'new', () => view(viewSec)),
  V('camp', 'rich', () => { const k = Object.keys(S.camp || {})[0]; return k ? view(() => viewCamp(k)) : NA; }),
  V('songs', 'rich', () => view(viewSongs)),
  V('songs.new', 'new', () => view(viewSongs)),
  V('song', 'rich', () => S.songs?.length ? view(() => viewSong(S.songs[0].id)) : NA),
  V('renew', 'rich', () => { const a = A(x => x.status === 'debuted'); return a ? view(() => viewRenew(a.id)) : NA; }),
  V('debutQ', 'rich', () => view(viewDebutQ)),
  V('pa', 'rich', () => { const a = A(x => x.pa) || A(paOK); return a ? view(() => viewPA(a.id)) : NA; }),
  V('inv', 'rich', () => { const a = A(x => x.scandal?.inv); return a ? view(() => viewInv(a.id)) : NA; }),
  V('outside', 'rich', () => render(), '#outside'),
  V('trendBar', 'rich', () => render(), '#trendBar'),
];

// Bề mặt đã dịch xong (ui-en-leak kiểm không rò chữ Việt). Mỗi task trích chuỗi thêm id vào đây.
export const DONE = new Set(['outside', 'trendBar', 'artist.trainee', 'artist.trainee.new', 'artist.solo', 'artist.group', 'artist.actor', 'report', 'reportFull', 'award', 'skipWarn', 'events.new', 'plan', 'plan.new', 'code', 'props', 'camp', 'sec', 'sec.new', 'songs', 'songs.new', 'song',
  ...['ceo', 'meet', 'studio', 'roof', 'dorm', 'vocal', 'dance', 'acting'].flatMap(r => [`room.${r}.new`, `room.${r}.rich`])]);
// Bề mặt chứa nội dung sự kiện (giai đoạn 3), luôn được loại khỏi kiểm rò chữ Việt ở en.
export const EXCLUDED = new Set(['events', 'inv']);
