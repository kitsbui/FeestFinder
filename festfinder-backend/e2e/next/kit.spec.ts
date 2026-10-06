import { expect, test } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * Kính đêm: the component kit at /kit, and the line between the two looks. The rebuilt
 * pages and the compiled legacy screens have root layouts of their own, so neither page
 * ever carries the other's stylesheet.
 */

test('the kit renders every part and loads cleanly', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/kit');
  await expect(page.getByRole('heading', { level: 1, name: 'Kính đêm' })).toBeVisible();
  for (const name of ['Màu', 'Thể loại = màu + hình', 'Chữ', 'Thành phần', 'Kính', 'Mở & gập', 'Điều hướng', 'Hồ sơ', 'Biểu đồ']) {
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  }
  // Nothing wider than a phone.
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(problems).toEqual([]);
});

test('a dropdown opens, moves with the arrow keys, chooses, and closes on Escape or outside', async ({ page }) => {
  await page.goto('/kit');
  const trigger = page.getByRole('button', { name: /Cuối tuần này/ });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const menu = page.getByRole('menu', { name: 'Thời gian' });
  await expect(menu.getByRole('menuitemradio', { name: /Cuối tuần này/ })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  // Keyboard: open with ArrowDown, move, choose with Enter.
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitemradio').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /7 ngày tới/ })).toBeVisible();

  // A click outside closes it: the page behind is covered by a transparent scrim.
  await page.getByRole('button', { name: 'Sắp xếp' }).click();
  await expect(page.getByRole('menu')).toHaveCount(1);
  await page.mouse.click(5, 5);
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sắp xếp' })).toHaveAttribute('aria-expanded', 'false');
});

test('toggles announce their state', async ({ page }) => {
  await page.goto('/kit');
  const sw = page.getByRole('switch', { name: 'Công tắc' });
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  const save = page.getByRole('button', { name: 'Lưu', exact: true });
  await save.click();
  await expect(page.getByRole('button', { name: 'Đã lưu', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const acc = page.locator('details', { hasText: 'Cài đặt' }).first();
  await acc.locator('summary').click();
  await expect(acc).toHaveAttribute('open', '');
  // Exclusive group: opening one closed the other.
  await expect(page.locator('details', { hasText: 'Đã diễn' }).first()).not.toHaveAttribute('open', '');
});

test('the sign-in sheet opens from the kit with the ways in the server has', async ({ page }) => {
  await page.goto('/kit');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  const sheet = page.getByRole('dialog', { name: 'Đăng nhập' });
  await expect(sheet.getByRole('button', { name: 'Tiếp tục với Google' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
});

test('each look keeps its own stylesheet', async ({ page }) => {
  const sheets = () => page.evaluate(() => [...document.styleSheets].map((s) => s.href ?? '(inline)'));
  await page.goto('/kit');
  expect((await sheets()).some((h) => h.includes('/ui/theme.css'))).toBe(false);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(8, 9, 10)');
  // A screen that is still the compiled one.
  await page.goto('/console');
  expect((await sheets()).some((h) => h.includes('/ui/theme.css'))).toBe(true);
  // Tailwind's preflight would zero this margin; the legacy screens rely on the browser's.
  expect(await page.evaluate(() => [...document.styleSheets].some((s) => {
    try { return [...s.cssRules].some((r) => r.cssText.includes('--color-acc')); } catch { return false; }
  }))).toBe(false);
});
