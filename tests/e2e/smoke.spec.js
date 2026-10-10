import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource|ERR_/.test(m.text())) errors.push('console: ' + m.text()); });
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('__golden', '1'); });
  // font ngoài không cần cho test
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
});

test('trang tải không lỗi và mọi phòng trong dock mở/đóng được', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  await expect(page.locator('#date')).not.toBeEmpty();
  const n = await page.locator('#dock button').count();
  expect(n).toBeGreaterThanOrEqual(10);
  for (let i = 0; i < n; i++) {
    await page.locator('#dock button').nth(i).click();
    await expect(page.locator('#sheet')).toHaveClass(/on/);
    await page.locator('#sheet .x').first().click();
    await expect(page.locator('#sheet')).not.toHaveClass(/on/);
  }
  expect(errors).toEqual([]);
});

test('vòng tuần: kết thúc tuần 10 lần, ngày thay đổi, autosave qua reload', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  const d0 = await page.locator('#date').innerText();
  for (let i = 0; i < 10; i++) {
    await page.locator('#nextBtn').click();
    // xử lý modal kế hoạch / báo cáo / sự kiện bằng nút chính cho đến khi đóng
    for (let k = 0; k < 8; k++) {
      const on = await page.locator('#sheet.on').count();
      if (!on) break;
      const pri = page.locator('#sheet .btn.pri:not([disabled]), #sheet .btn.pink:not([disabled])').last();
      if (await pri.count()) await pri.click(); else await page.locator('#sheet .x').first().click();
    }
    // nếu còn modal (vd cảnh báo bỏ qua sự kiện) thì đóng cưỡng bức
    await page.evaluate(() => window.closeM());
  }
  const d1 = await page.locator('#date').innerText();
  expect(d1).not.toBe(d0);
  await page.reload();
  expect(await page.locator('#date').innerText()).toBe(d1);
  expect(errors).toEqual([]);
});

test('mobile 375x812: không cuộn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('./');
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(w).toBeLessThanOrEqual(375);
});

test('đổi ngôn ngữ tại chỗ, nhớ qua reload, không cuộn ngang ở 375px', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  await page.evaluate(() => { for (let i = 0; i < 2; i++) window.__game.nextWeek(true, true); });
  await page.evaluate(() => window.closeM());
  await page.locator('.hbtns .r4').click();
  await page.getByRole('button', { name: /English/ }).click();
  await expect(page.locator('#nextBtn')).toHaveText('End week 3');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(await page.evaluate(() => __game.state().week)).toBe(3);
  await page.reload();
  await expect(page.locator('#nextBtn')).toHaveText('End week 3');
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.locator('.hbtns .r4').click();
  await page.getByRole('button', { name: 'Tiếng Việt' }).click();
  await expect(page.locator('#nextBtn')).toHaveText('Kết thúc tuần 3');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  expect(errors).toEqual([]);
});

test('xuất mã → xoá dữ liệu → nhập lại mã khôi phục đúng tiến trình', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__game.nextWeek(true, true); });
  await page.evaluate(() => { window.closeM(); });
  const before = await page.evaluate(() => ({ w: __game.state().week, m: __game.state().money }));
  expect(before.w).toBe(4);

  await page.locator('.hbtns .r1').click();
  const code = await expect.poll(async () => page.locator('#codeShow').inputValue()).toMatch(/^SL1\./).then(() => page.locator('#codeShow').inputValue());

  // máy khác: xoá sạch rồi nạp lại
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('__golden', '1'); });
  await page.reload();
  expect(await page.evaluate(() => __game.state().week)).toBe(1);

  await page.locator('.hbtns .r1').click();
  await page.locator('#codeIn').fill(code);
  await page.getByRole('button', { name: 'Xem trước' }).click();
  await expect(page.locator('#sheet')).toContainText('Tuần 4');
  await page.getByRole('button', { name: 'Ghi đè game hiện tại' }).click();
  const after = await page.evaluate(() => ({ w: __game.state().week, m: __game.state().money }));
  expect(after).toEqual(before);

  // mã rác bị từ chối, game không đổi (cửa sổ vẫn mở sau khi nạp)
  await page.locator('#codeIn').fill('SL1.rac-ruoi');
  await page.getByRole('button', { name: 'Xem trước' }).click();
  await expect(page.locator('#sheet')).toContainText('❌');
  expect(await page.evaluate(() => __game.state().week)).toBe(4);
  expect(errors).toEqual([]);
});

// Masthead và nhãn phòng ở màn hẹp: số lớn (12 nghệ sĩ, ~1,2M fan) không được cắt chữ, nhãn phòng không bị kẹp/giao huy hiệu
for (const lang of ['vi', 'en']) for (const [w, h] of [[390, 844], [375, 812]]) {
  test(`${w}px: masthead và nhãn phòng không bị cắt [${lang}]`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.addInitScript(l => localStorage.setItem('starlight_lang', l), lang);
    await page.setViewportSize({ width: w, height: h });
    await page.goto('./');
    await page.evaluate(() => {
      const S = __game.state(), b = S.artists[0];
      while (S.artists.length < 12) S.artists.push({ ...structuredClone(b), id: 9000 + S.artists.length, name: 'Test ' + S.artists.length, fans: 100000 });
      window.act();
    });
    await page.evaluate(() => window.closeM());
    const r = await page.evaluate(() => {
      const box = e => e.getBoundingClientRect(), cash = box(document.querySelector('.cash'));
      const meta = document.querySelector('.meta');
      const rooms = [...document.querySelectorAll('.room')].map(room => {
        const rn = room.querySelector('.rn'), rl = room.querySelector('.rl'), bd = room.querySelector('.badge');
        const a = box(rl), c = bd && box(bd);
        return {
          id: room.getAttribute('onclick'), hasRn: !!rn,
          clipW: rn ? rn.scrollWidth > rn.clientWidth : null, clipH: rn ? rn.scrollHeight > rn.clientHeight + 1 : null,
          hit: c ? !(a.right <= c.left || c.right <= a.left || a.bottom <= c.top || c.bottom <= a.top) : false,
        };
      });
      return {
        metaClip: meta.scrollWidth > meta.clientWidth,
        artRight: box(document.getElementById('artN')).right, fansRight: box(document.getElementById('fansP')).right, cashRight: cash.right,
        topH: box(document.querySelector('.top')).height, scrollW: document.documentElement.scrollWidth, rooms,
      };
    });
    expect(r.metaClip, 'dòng meta bị cắt').toBe(false);
    expect(r.artRight).toBeLessThanOrEqual(r.cashRight + 0.5);
    expect(r.fansRight).toBeLessThanOrEqual(r.cashRight + 0.5);
    expect(r.topH).toBeLessThanOrEqual(80);
    expect(r.scrollW).toBeLessThanOrEqual(w);
    expect(r.rooms.length).toBeGreaterThan(0);
    for (const x of r.rooms) {
      expect(x.hasRn, `${x.id} thiếu .rn`).toBe(true);
      expect(x.clipW, `${x.id} nhãn bị cắt ngang`).toBe(false);
      expect(x.clipH, `${x.id} nhãn bị kẹp dòng`).toBe(false);
      expect(x.hit, `${x.id} nhãn giao huy hiệu`).toBe(false);
    }
    expect(errors).toEqual([]);
  });
}

// Nhãn "Gợi ý" của ô lịch nằm trong CSS content nhưng lấy chữ từ biến --t-rec (từ điển), đổi theo ngôn ngữ
for (const [lang, want] of [['vi', 'Gợi ý'], ['en', 'Suggested']]) {
  test(`nhãn gợi ý trên ô lịch tập [${lang}]`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.addInitScript(l => localStorage.setItem('starlight_lang', l), lang);
    await page.goto('./');
    await page.evaluate(() => window.startPlanOne(__game.state().artists[0].id));
    const got = await page.evaluate(() => { const e = document.querySelector('.tile.rec'); return e ? getComputedStyle(e, '::after').content : null; });
    expect(got).toBe(`"${want}"`);
    expect(errors).toEqual([]);
  });
}

// Mở lần lượt mọi phòng trong dock với save giàu (fixture ui-rich) ở màn hẹp: không lỗi trang, không cuộn ngang (trang lẫn khung phòng), ô tick không tách dòng khỏi nhãn
const RICH = fs.readFileSync(path.join(process.cwd(), 'tests/fixtures/ui-rich.json'), 'utf8');
for (const lang of ['en', 'vi']) {
  test(`390x844: mở mọi phòng với save giàu, không cuộn ngang, ô tick cùng dòng nhãn [${lang}]`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.addInitScript(([l, d]) => { localStorage.setItem('starlight_lang', l); localStorage.setItem('starlight_idol_save_v1', d); }, [lang, RICH]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    await page.evaluate(() => window.closeM());
    const n = await page.locator('#dock button').count();
    expect(n).toBeGreaterThanOrEqual(10);
    for (let i = 0; i < n; i++) {
      await page.locator('#dock button').nth(i).click();
      await expect(page.locator('#sheet')).toHaveClass(/on/);
      const r = await page.evaluate(() => {
        const sh = document.querySelector('#sheet .panel') || document.querySelector('#sheet');
        const bad = [...document.querySelectorAll('#sheet label.row')].filter(l => { const c = l.querySelector('input[type=checkbox]'); if (!c) return false; const tn = [...l.childNodes].filter(x => x.nodeType === 3 && x.textContent.trim()).pop(); if (!tn) return false; const rg = document.createRange(); rg.selectNodeContents(tn); const a = rg.getClientRects()[0], b = c.getBoundingClientRect(); return !a || a.top > b.bottom; }).map(l => l.textContent.trim().slice(0, 40));
        return { page: document.documentElement.scrollWidth, sheet: sh.scrollWidth - sh.clientWidth, bad, title: (document.querySelector('#sheet h2') || {}).textContent };
      });
      expect(r.page, `trang cuộn ngang ở phòng #${i} (${r.title})`).toBeLessThanOrEqual(390);
      expect(r.sheet, `khung phòng #${i} (${r.title}) tràn ngang`).toBeLessThanOrEqual(1);
      expect(r.bad, `ô tick tách dòng khỏi nhãn ở phòng #${i}`).toEqual([]);
      await page.locator('#sheet .x').first().click();
      await expect(page.locator('#sheet')).not.toHaveClass(/on/);
    }
    expect(errors).toEqual([]);
  });
}
