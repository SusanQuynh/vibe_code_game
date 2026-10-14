// Stored-text keys of ext2.js keep the exact Vietnamese the pools had (legacy saves and the golden rely on it).
import { describe, it, expect } from 'vitest';
import { tVi } from '../../src/i18n/index.js';
import { SCOUT_W } from '../../src/systems/ext2.js';

describe('ext2 stored keys', () => {
  it('ev.why.scout.* copies SCOUT_W in order', () => {
    expect(SCOUT_W.map((_, i) => tVi(`ev.why.scout.${i}`))).toEqual(SCOUT_W);
  });
  it('ev.why.disband.* keep the four reasons in condition order', () => {
    expect([0, 1, 2, 3].map(i => tVi(`ev.why.disband.${i}`))).toEqual(['mâu thuẫn nội bộ kéo dài', 'các thành viên kiệt sức, tâm trạng sa sút', 'các thành viên muốn theo đuổi con đường riêng', 'bất đồng về định hướng âm nhạc']);
  });
});
