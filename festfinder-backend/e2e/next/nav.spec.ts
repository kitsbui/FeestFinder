import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';
import { ACCOUNTS, ROUTES } from './routes.ts';

/*
 * One frame for the public site (design v2 phase 1, artboard 03 of the design review): on a
 * computer one bar with four places, the search and "Đăng sự kiện"; on a phone the tab bar on every
 * public screen; Dự án, Vé and Đã lưu at most two taps from anywhere; every logo a link home; the
 * breadcrumbs of a detail page without the EDM level.
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test('a computer: four places, the search, the languages, "Đăng sự kiện"; no styles menu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const problems = await open(page, '/a');
  const nav = page.getByRole('navigation', { name: 'Chính' });
  await expect(nav.getByRole('link')).toHaveText(['Sự kiện', 'Nghệ sĩ', 'Dự án', 'Nhà tổ chức']);
  await expect(nav.getByRole('link', { name: 'Nghệ sĩ' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Dòng nhạc' })).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng sự kiện' })).toHaveAttribute('href', '/studio/new');
  await expect(page.getByRole('banner').getByRole('link', { name: /^VI\s*·?\s*EN/ })).toHaveAttribute('href', '/a?lang=en');
  // No tab bar on a computer.
  await expect(page.getByRole('navigation', { name: 'Chính' }).getByRole('button', { name: 'Tìm' })).toBeHidden();
  // Between 900 and 1200px the field is an icon that opens the search sheet; ⌘K / Ctrl+K opens it too.
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'Tìm kiếm' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('a phone: the tab bar on every public screen, and the bar on top keeps the logo and "Đăng sự kiện"', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const missing: string[] = [];
  // The kit is the parts' catalogue, not a page of the site.
  for (const path of ROUTES.visitor.filter((p) => p !== '/kit')) {
    await open(page, path);
    const tabs = page.getByRole('navigation', { name: 'Chính' });
    for (const name of ['Sự kiện', 'Bản đồ', 'Tìm', 'Đã lưu', 'Tôi']) {
      if (!(await tabs.getByText(name, { exact: true }).isVisible())) missing.push(`${path}: ${name}`);
    }
    if (!(await page.getByRole('banner').getByRole('link', { name: 'Đăng sự kiện' }).isVisible())) missing.push(`${path}: Đăng sự kiện`);
  }
  expect(missing, missing.join('\n')).toEqual([]);
});

test('Dự án, Vé and Đã lưu are at most two taps from any page on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWith(page, ACCOUNTS.fan);
  // Dự án: Tìm, then Dự án.
  await open(page, '/e/ravo');
  const tabs = page.getByRole('navigation', { name: 'Chính' });
  await tabs.getByRole('button', { name: 'Tìm' }).click();
  await page.getByRole('dialog', { name: 'Tìm kiếm' }).getByRole('link', { name: 'Dự án' }).click();
  await expect(page).toHaveURL(/\/p$/);
  // Đã lưu: one tap.
  await tabs.getByRole('link', { name: 'Đã lưu' }).click();
  await expect(page).toHaveURL(/\/saved$/);
  await expect(tabs.getByRole('link', { name: 'Đã lưu' })).toHaveAttribute('aria-current', 'page');
  // Vé: Tôi, then Vé của tôi (the hub on /profile).
  await tabs.getByRole('link', { name: 'Tôi' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  const hub = page.getByRole('navigation', { name: 'Tôi' });
  await expect(hub.getByRole('link', { name: /^Vé của tôi/ })).toHaveAttribute('href', '/app/tickets');
  // The hub holds the workspaces, the language and signing out too.
  await expect(hub.getByRole('link', { name: /^Người tham dự/ })).toBeVisible();
  await expect(hub.getByRole('link', { name: /^Ngôn ngữ/ })).toHaveAttribute('href', '/profile?lang=en');
  await expect(hub.getByRole('button', { name: 'Đăng xuất' })).toBeVisible();
});

test('every logo is a link home; a detail page’s breadcrumbs skip the EDM level', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/e/ravo');
  const logos = page.getByRole('link', { name: 'FeestFinder, trang chủ' });
  await expect(logos).toHaveCount(2);
  for (const logo of await logos.all()) await expect(logo).toHaveAttribute('href', '/');
  const crumbs = page.getByRole('navigation', { name: 'Đường dẫn' });
  await expect(crumbs.getByRole('link')).toHaveText([/^Sự kiện ở /]);
  await expect(crumbs.getByText('EDM', { exact: true })).toHaveCount(0);
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Ravolution Music Festival');
});

test('the back offices: the logo leads home and the switcher to the other workspaces', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInWith(page, ACCOUNTS.organizer);
  await open(page, '/studio');
  const rail = page.getByRole('navigation', { name: 'Studio' });
  await expect(rail.getByRole('link', { name: 'FeestFinder, trang chủ' })).toHaveAttribute('href', '/');
  await rail.getByRole('button', { name: /Không gian/ }).click();
  const menu = page.getByRole('menu', { name: 'Không gian làm việc' });
  await expect(menu.getByRole('menuitemradio', { name: 'Nhà tổ chức' })).toHaveAttribute('aria-checked', 'true');
  await expect(menu.getByRole('menuitem', { name: 'Người tham dự' })).toHaveAttribute('href', '/');
});
