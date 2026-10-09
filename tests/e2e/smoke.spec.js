import { test, expect } from '@playwright/test';

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
  await page.goto('/');
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
  await page.goto('/');
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
  await page.goto('/');
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(w).toBeLessThanOrEqual(375);
});
