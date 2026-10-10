import { test, expect } from '@playwright/test';

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource|ERR_/.test(m.text())) errors.push('console: ' + m.text()); });
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('__golden', '1'); });
  // external fonts are not needed for tests
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
    // click through plan / report / event modals with the primary button until closed
    for (let k = 0; k < 8; k++) {
      const on = await page.locator('#sheet.on').count();
      if (!on) break;
      const pri = page.locator('#sheet .btn.pri:not([disabled]), #sheet .btn.pink:not([disabled])').last();
      if (await pri.count()) await pri.click(); else await page.locator('#sheet .x').first().click();
    }
    // if a modal remains (e.g. skip-events warning), force close it
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

  // another device: wipe everything, then import
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

  // a junk code is rejected and the game is unchanged (the sheet stays open after import)
  await page.locator('#codeIn').fill('SL1.rac-ruoi');
  await page.getByRole('button', { name: 'Xem trước' }).click();
  await expect(page.locator('#sheet')).toContainText('❌');
  expect(await page.evaluate(() => __game.state().week)).toBe(4);
  expect(errors).toEqual([]);
});
