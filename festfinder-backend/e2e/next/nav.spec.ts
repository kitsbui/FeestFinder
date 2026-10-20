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

test('a computer: five places, the search, the languages, "Đăng sự kiện"; no styles menu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const problems = await open(page, '/a');
  const nav = page.getByRole('navigation', { name: 'Chính' });
  await expect(nav.getByRole('link')).toHaveText(['Sự kiện', 'Nghệ sĩ', 'Dự án', 'Blog', 'Nhà tổ chức']);
  await expect(nav.getByRole('link', { name: 'Nghệ sĩ' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Dòng nhạc' })).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng sự kiện' })).toHaveAttribute('href', '/studio/new');
  // The language switch is two flags, the page's own ringed (owner, 2026-10-20).
  const flags = page.getByRole('banner').getByRole('group', { name: 'Ngôn ngữ' });
  await expect(flags.getByRole('link', { name: 'Tiếng Việt' })).toHaveAttribute('aria-current', 'true');
  await expect(flags.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/a?setlang=en');
  // No tab bar on a computer.
  await expect(page.getByRole('navigation', { name: 'Chính' }).getByRole('link', { name: 'Đã lưu' })).toBeHidden();
  // Between 900 and 1200px the field is an icon that opens the search sheet; ⌘K / Ctrl+K opens it too.
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'Tìm kiếm' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('a phone: four places in the tab bar on every public screen; the bar on top keeps the logo and the search, "Đăng sự kiện" is in "Tôi"', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const missing: string[] = [];
  // The kit is the parts' catalogue, not a page of the site.
  for (const path of ROUTES.visitor.filter((p) => p !== '/kit')) {
    await open(page, path);
    const tabs = page.getByRole('navigation', { name: 'Chính' });
    for (const name of ['Sự kiện', 'Bản đồ', 'Đã lưu', 'Tôi']) {
      if (!(await tabs.getByText(name, { exact: true }).isVisible())) missing.push(`${path}: ${name}`);
    }
    // Search left the tab bar for the top (design v2 phase 12, owner 2026-10-18).
    if (await tabs.getByText('Tìm', { exact: true }).count()) missing.push(`${path}: Tìm in the tab bar`);
    if (!(await page.getByRole('banner').getByRole('button', { name: 'Tìm kiếm' }).isVisible())) missing.push(`${path}: search on top`);
    // The top is the newcomer's on a phone (owner, 2026-10-18): "Đăng sự kiện" lives in "Tôi" and the footer.
    if (await page.getByRole('banner').getByRole('link', { name: 'Đăng sự kiện' }).isVisible()) missing.push(`${path}: Đăng sự kiện on top`);
  }
  expect(missing, missing.join('\n')).toEqual([]);
});

test('Dự án, Vé and Đã lưu are at most two taps from any page on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWith(page, ACCOUNTS.fan);
  // Dự án: the search on top, then Dự án.
  await open(page, '/e/ravo');
  const tabs = page.getByRole('navigation', { name: 'Chính' });
  await page.getByRole('banner').getByRole('button', { name: 'Tìm kiếm' }).click();
  await page.getByRole('dialog', { name: 'Tìm kiếm' }).getByRole('link', { name: 'Dự án' }).click();
  await expect(page).toHaveURL(/\/p$/);
  // Đã lưu: one tap.
  await tabs.getByRole('link', { name: 'Đã lưu' }).click();
  await expect(page).toHaveURL(/\/saved$/);
  await expect(tabs.getByRole('link', { name: 'Đã lưu' })).toHaveAttribute('aria-current', 'page');
  // Tôi: the hub on /profile; FeestFinder sells no tickets, so there is no "Vé của tôi".
  await tabs.getByRole('link', { name: 'Tôi' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  const hub = page.getByRole('navigation', { name: 'Tôi' });
  await expect(hub.getByRole('link', { name: /^Vé của tôi/ })).toHaveCount(0);
  await expect(hub.getByRole('link', { name: /^Đã lưu/ })).toHaveAttribute('href', '/saved');
  // The hub holds the workspaces, the language and signing out too.
  await expect(hub.getByRole('link', { name: /^Người tham dự/ })).toBeVisible();
  await expect(hub.getByRole('link', { name: /^Ngôn ngữ/ })).toHaveAttribute('href', '/profile?setlang=en');
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

test('a phone: scrolling down hides the frame, scrolling up brings it back (ui/immersive.tsx)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  // The frame stays still under automation; this check is a person.
  await ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
  const page = await ctx.newPage();
  const problems = await open(page, '/');
  const away = page.locator('html[data-chrome-away]');
  await page.mouse.wheel(0, 600);
  await expect(away).toHaveCount(1);
  await expect.poll(async () => (await page.getByRole('banner').boundingBox())?.y ?? 0).toBeLessThan(-40);
  await page.mouse.wheel(0, -200);
  await expect(away).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Chính' }).getByText('Đã lưu', { exact: true })).toBeInViewport();
  expect(problems).toEqual([]);
  await ctx.close();
});
