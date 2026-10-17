import { devices, expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The owner's changes of 2026-10-17 on the event page and around Feest Radar: "Chỉ đường" goes
 * straight to Google Maps, "Thêm lịch" straight to the person's own Google Calendar with the night
 * filled in (Android: the calendar app; .ics in the menu), "Đặt xe" remembers the app a phone
 * chose and opens it at once, the organiser of Radar's finds is Feest Radar, and the review queue
 * sorts and filters by fit.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test('"Chỉ đường" opens Google Maps’ route to the venue at once, from the top and from the venue', async ({ page }) => {
  const problems = await open(page, '/e/ravo');
  const links = page.getByRole('link', { name: 'Chỉ đường' });
  await expect(links).toHaveCount(2);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('href', /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
    await expect(link).toHaveAttribute('target', '_blank');
  }
  await expect(page.locator('a[href="#venue"]', { hasText: 'Chỉ đường' })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('"Thêm lịch" fills in the night in the person’s own Google Calendar, and offers the .ics', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  const problems = await open(page, '/e/ravo');
  const ev = await (await page.request.get('/events/ravo')).json();
  const link = page.locator('a[data-calendar="google"]:visible').first();
  const href = new URL((await link.getAttribute('href'))!);
  expect(href.origin + href.pathname).toBe('https://calendar.google.com/calendar/render');
  expect(href.searchParams.get('action')).toBe('TEMPLATE');
  expect(href.searchParams.get('text')).toBe(ev.title);
  expect(href.searchParams.get('authuser')).toBe('minh@example.com');
  expect(href.searchParams.get('ctz')).toBe(ev.timezone);
  const start = new Date(ev.startsAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  expect(href.searchParams.get('dates')?.startsWith(start + '/')).toBe(true);
  expect(href.searchParams.get('location')).toContain(ev.venue.name);
  expect(href.searchParams.get('details')).toContain('/e/ravo');
  await expect(link).toHaveAttribute('target', '_blank');
  await page.locator('button[aria-label="Lịch khác"]:visible').first().click();
  await expect(page.getByRole('menuitem', { name: 'Lịch Apple, Outlook (.ics)' })).toHaveAttribute('href', `/events/${ev.id}/calendar.ics`);
  expect(problems).toEqual([]);
});

test('signed out, "Thêm lịch" still opens Google Calendar, in whatever account Google has', async ({ page }) => {
  await open(page, '/e/ravo');
  const href = new URL((await page.locator('a[data-calendar="google"]').first().getAttribute('href'))!);
  expect(href.searchParams.get('authuser')).toBeNull();
});

const { defaultBrowserType: _browser, ...IPHONE } = devices['iPhone 13'];

test.describe('"Đặt xe" on an iPhone', () => {
  test.use(IPHONE);

  test('the app chosen before opens at once, with the address copied and "Đổi app" to choose another', async ({ page }) => {
    // Be opens through its universal link; here that page answers instead of the App Store.
    await page.route('https://begroup.onelink.me/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>Be</p>' }));
    await open(page, '/e/ravo');
    await page.evaluate(() => localStorage.setItem('ff:ride-app', 'be'));
    const opened = page.waitForURL('https://begroup.onelink.me/**');
    await page.getByRole('button', { name: 'Đặt xe', exact: true }).first().click();
    await opened;
    expect(page.url()).toBe('https://begroup.onelink.me/ZOqn/becustomerapp');
  });

  test('the first time, the sheet lists the city’s apps and the one chosen comes first next time', async ({ page }) => {
    await open(page, '/e/ravo');
    await page.evaluate(() => localStorage.removeItem('ff:ride-app'));
    await page.getByRole('button', { name: 'Đặt xe', exact: true }).first().click();
    const sheet = page.getByRole('dialog', { name: 'Đặt xe tới đây' });
    await expect(sheet.locator('li button .kd-h')).toHaveText(['Grab', 'Be', 'Green SM']);
    await page.evaluate(() => localStorage.setItem('ff:ride-app', 'greensm'));
    await page.reload();
    await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
    await page.goto('/e/ravo?ride=1');
    const again = page.getByRole('dialog', { name: 'Đặt xe tới đây' });
    await expect(again.locator('li button .kd-h')).toHaveText(['Green SM', 'Grab', 'Be']);
    await expect(again.getByText('Lần trước')).toBeVisible();
  });
});

test('Radar’s finds and what the community sends in have an organiser page each', async ({ page }) => {
  await page.goto('/o/feest-radar');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Feest Radar');
  await page.goto('/o/cong-dong');
  await expect(page).toHaveURL(/\/o\/cong-dong$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cộng đồng FeestFinder');
});

test('the review queue filters by source and fit, and sorts by fit', async ({ page }) => {
  await signInWith(page, ADMIN);
  const problems = await open(page, '/console');
  await page.getByRole('button', { name: /^Sắp xếp/ }).click();
  await page.getByRole('menuitemradio', { name: 'Phù hợp nhất' }).click();
  await expect(page).toHaveURL(/sort=fit/);
  await page.getByRole('button', { name: /^Nguồn/ }).click();
  await page.getByRole('menuitemradio', { name: 'Feest Radar' }).click();
  await expect(page).toHaveURL(/source=radar/);
  await page.getByRole('button', { name: /^Độ phù hợp/ }).click();
  await expect(page.getByRole('menuitemradio', { name: 'Nên đăng' })).toBeVisible();
  expect(problems).toEqual([]);
});
