// Stored-text keys of ext2.js keep the exact Vietnamese the pools had (legacy saves and the golden rely on it).
import { describe, it, expect } from 'vitest';
import { tVi } from '../../src/i18n/index.js';
import { SCOUT_N } from '../../src/systems/ext2.js';

const SCOUT_VI = ['ở quán cà phê gần phim trường', 'trong buổi fan meeting', 'ở một lễ hội âm nhạc trường học', 'tại cuộc thi hát karaoke khu phố', 'trên chuyến tàu đi quay ngoại cảnh', 'khi xem một buổi diễn đường phố'];

describe('ext2 stored keys', () => {
  it('ev.why.scout.* keeps the legacy pool in order and SCOUT_N counts it', () => {
    expect(SCOUT_N).toBe(SCOUT_VI.length);
    expect(SCOUT_VI.map((_, i) => tVi(`ev.why.scout.${i}`))).toEqual(SCOUT_VI);
  });
  it('ev.why.disband.* keep the four reasons in condition order', () => {
    expect([0, 1, 2, 3].map(i => tVi(`ev.why.disband.${i}`))).toEqual(['mâu thuẫn nội bộ kéo dài', 'các thành viên kiệt sức, tâm trạng sa sút', 'các thành viên muốn theo đuổi con đường riêng', 'bất đồng về định hướng âm nhạc']);
  });
});
