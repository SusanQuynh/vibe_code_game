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

test('mã ngắn SL2: xuất → máy mới nhập → tuần và tiền khớp, ứng viên được tạo lại', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__game.nextWeek(true, true); });
  await page.evaluate(() => { window.closeM(); });
  const before = await page.evaluate(() => ({ w: __game.state().week, m: __game.state().money, a: __game.state().artists.length }));

  await page.locator('.hbtns .r1').click();
  await expect.poll(async () => page.locator('#codeShort').inputValue()).toMatch(/^SL2\./);
  const code = await page.locator('#codeShort').inputValue();
  const full = await page.locator('#codeShow').inputValue();
  expect(code.length).toBeLessThan(full.length * 0.8);

  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('__golden', '1'); });
  await page.reload();
  await page.locator('.hbtns .r1').click();
  await page.locator('#codeIn').fill(code);
  await page.getByRole('button', { name: 'Xem trước' }).click();
  await expect(page.locator('#sheet')).toContainText('Tuần 4');
  await page.getByRole('button', { name: 'Ghi đè game hiện tại' }).click();
  const after = await page.evaluate(() => { const s = __game.state(); return { w: s.week, m: s.money, a: s.artists.length, pool: s.pool.length, off: s.offers.length, mg: s.mgrPool.length }; });
  expect({ w: after.w, m: after.m, a: after.a }).toEqual(before);
  expect(after.pool).toBeGreaterThan(0);
  expect(after.off).toBeGreaterThan(0);
  expect(after.mg).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('sao lưu đầy đủ → làm hỏng bản chính → tải lại khôi phục từ bản sao lưu', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__game.nextWeek(true, true); window.closeM(); });
  await page.locator('.hbtns .r1').click();
  await expect(page.locator('#sheet')).toContainText('Bản đầy đủ (sao lưu)');
  await page.getByRole('button', { name: 'Sao lưu đầy đủ ngay' }).click();
  await expect(page.locator('#sheet')).toContainText(/Bản đầy đủ \(sao lưu\)Năm 1 · Tuần 4/);
  await page.evaluate(() => { localStorage.setItem('starlight_idol_save_v1', '{hỏng'); });
  await page.reload();
  expect(await page.evaluate(() => __game.state().week)).toBe(4);
  await expect(page.locator('#log')).toContainText('🛟');
  expect(errors).toEqual([]);
});

test('every room in English at 375px: no error, no horizontal scroll, no Vietnamese chrome', async ({ page }) => {
  const errors = trackErrors(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => { localStorage.setItem('starlight_lang', 'en'); });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__game.nextWeek(true, true); });
  await page.evaluate(() => window.closeM());
  const n = await page.locator('#dock button').count();
  expect(n).toBeGreaterThanOrEqual(10);
  for (let i = 0; i < n; i++) {
    await page.locator('#dock button').nth(i).click();
    await expect(page.locator('#sheet')).toHaveClass(/on/);
    const r = await page.evaluate(() => {
      const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
      // text stored in the state (names, log lines…) stays Vietnamese until phase 3: strip it, longest first
      const stored = new Set();
      const walk = (v) => { if (typeof v === 'string') { if (VI.test(v)) stored.add(v); } else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x); };
      walk(window.__game.state());
      let txt = document.querySelector('#sheet').innerText;
      for (const s of [...stored].sort((a, b) => b.length - a.length)) txt = txt.split(s).join(' ');
      const left = (txt.match(/\p{L}+/gu) || []).filter((w) => VI.test(w) && ![...stored].some((s) => s.includes(w)));
      return { w: document.documentElement.scrollWidth, sw: document.querySelector('#sheet .panel').scrollWidth, left };
    });
    expect(r.w, `room ${i}: page scrollWidth`).toBeLessThanOrEqual(375);
    expect(r.sw, `room ${i}: sheet scrollWidth`).toBeLessThanOrEqual(375);
    expect(r.left, `room ${i}: Vietnamese words`).toEqual([]);
    await page.locator('#sheet .x').first().click();
    await expect(page.locator('#sheet')).not.toHaveClass(/on/);
  }
  expect(errors).toEqual([]);
});

test('English log after 3 weeks: no Vietnamese outside names and titles', async ({ page }) => {
  const errors = trackErrors(page);
  await page.addInitScript(() => { localStorage.setItem('starlight_lang', 'en'); });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__game.nextWeek(true, true); });
  await page.evaluate(() => window.closeM());
  const r = await page.evaluate(() => {
    const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    // short Vietnamese strings in the state are proper nouns (artist names, project titles): their words may appear
    const names = new Set();
    const walk = (v) => { if (typeof v === 'string') { if (VI.test(v) && v.length <= 40) for (const w of v.match(/\p{L}+/gu) || []) names.add(w); } else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x); };
    walk(window.__game.state());
    const log = document.querySelector('#log');
    const txt = log ? log.textContent : '';
    return { n: log ? log.children.length : 0, left: (txt.match(/\p{L}+/gu) || []).filter((w) => VI.test(w) && !names.has(w)) };
  });
  expect(r.n, 'log rows').toBeGreaterThan(0);
  expect(r.left, 'Vietnamese words in #log').toEqual([]);
  expect(errors).toEqual([]);
});
