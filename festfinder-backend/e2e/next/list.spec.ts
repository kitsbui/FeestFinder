import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The home page (festfinder-web/src/kd/web/list; /list redirects here): a dashboard (owner, 2026-11-06)
 * with a map, a calendar of upcoming events, and a highlight shelf or festival. No filters or list
 * view; the address supports ?q= and ?style= to narrow the events shown.
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the home page: map and calendar', () => {
  const cal = (page: Page) => page.locator('section[aria-labelledby="cal-h"]');
  const chips = (page: Page) => cal(page).locator('table a[href^="/e/"]');

  test('the map holds its place before it loads, then frames the pins; the calendar arrives in the HTML', async ({ page, request }) => {
    const html = await (await request.get('/')).text();
    // The calendar's chips are the events' links before any script runs (the demo clock is 2026-09-14).
    expect(html).toContain('href="/e/ravo-warmup"');
    expect(html).toContain('href="/e/hozo"');
    const problems = await open(page, '/');
    const map = page.getByRole('region', { name: 'Bản đồ sự kiện' });
    expect((await map.boundingBox())!.height).toBeGreaterThan(300);
    await expect(map.locator('.maplibregl-marker').first()).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('.kd-cmd')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Chế độ xem' })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('the old /list and /map addresses redirect here', async ({ page }) => {
    const moved = await page.request.get('/list?style=techno', { maxRedirects: 0 });
    expect(moved.headers().location).toBe('/?style=techno');
    await page.goto('/list?style=techno');
    await expect(page).toHaveURL(/\?style=techno/);
  });

  test('a festival fills every day it spans; prev, next and Today move the month', async ({ page }) => {
    const problems = await open(page, '/');
    const title = cal(page).locator('#cal-h');
    const september = await title.textContent();
    // HOZO Super Fest runs 18–20 September: one chip a day.
    await expect(chips(page).filter({ hasText: 'HOZO Super Fest' })).toHaveCount(3);
    await cal(page).getByRole('button', { name: 'Tháng sau' }).click();
    await expect(title).not.toHaveText(september!);
    await expect(chips(page).filter({ hasText: 'HOZO Super Fest' })).toHaveCount(0);
    await cal(page).getByRole('button', { name: 'Tháng trước' }).click();
    await cal(page).getByRole('button', { name: 'Tháng trước' }).click();
    await cal(page).getByRole('button', { name: 'Hôm nay' }).click();
    await expect(title).toHaveText(september!);
    expect(problems).toEqual([]);
  });

  test('a chip opens the night beside it, with its page and Google Calendar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const problems = await open(page, '/');
    await chips(page).filter({ hasText: 'Ravolution Warm-up' }).click();
    const card = page.getByRole('dialog', { name: /Ravolution Warm-up/ });
    await expect(card).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await expect(card.getByRole('link', { name: 'Xem chi tiết' })).toHaveAttribute('href', '/e/ravo-warmup');
    await expect(card.getByRole('link', { name: 'Thêm lịch' })).toHaveAttribute('href', /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('on a phone a day is one tap, listing its nights', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const problems = await open(page, '/');
    await cal(page).getByRole('button', { name: /18.*2 sự kiện/ }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('link', { name: /HOZO Super Fest/ })).toBeVisible();
    await expect(sheet.getByRole('link', { name: /Ravolution Warm-up/ })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a search from the address narrows the map and the calendar, and its chip clears it', async ({ page }) => {
    const problems = await open(page, '/?q=hozo');
    await expect(chips(page).filter({ hasText: 'Ravolution' })).toHaveCount(0);
    await expect(chips(page).filter({ hasText: 'HOZO Super Fest' })).toHaveCount(3);
    await expect(page.locator('[data-surface]')).toHaveCount(0);
    await page.getByRole('button', { name: /“hozo”/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(chips(page).filter({ hasText: 'Ravolution' }).first()).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a style’s link narrows to its nights', async ({ page }) => {
    const problems = await open(page, '/?style=techno');
    await expect(chips(page).filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await expect(chips(page).filter({ hasText: 'HOZO Super Fest' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Techno/ })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('the calendar subscribes Google Calendar to the feed, a city page to its own', async ({ page }) => {
    const problems = await open(page, '/');
    const subscribe = (p: Page) => cal(p).getByRole('link', { name: 'Thêm vào Google Calendar' });
    const href = await subscribe(page).getAttribute('href');
    expect(href).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/r\?cid=webcal%3A%2F%2F/);
    expect(decodeURIComponent(href!)).toMatch(/\/calendar\.ics$/);
    await open(page, '/?city=ho-chi-minh');
    expect(decodeURIComponent((await subscribe(page).getAttribute('href'))!)).toMatch(/\/calendar\.ics\?city=ho-chi-minh$/);
    // A city's page has no highlight.
    await expect(page.locator('[data-surface]')).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('in English at ?lang=en, and its links stay in English', async ({ page }) => {
    const problems = await open(page, '/?lang=en');
    await expect(cal(page).getByRole('button', { name: 'Today' })).toBeVisible();
    await expect(chips(page).first()).toHaveAttribute('href', /\?lang=en$/);
    expect(decodeURIComponent((await cal(page).getByRole('link', { name: 'Add to Google Calendar' }).getAttribute('href'))!)).toMatch(/\/calendar\.ics\?lang=en$/);
    expect(problems).toEqual([]);
  });

  test('no "Khám phá" page: the nav names Sự kiện for the home page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const problems = await open(page, '/a');
    const nav = page.getByRole('navigation', { name: 'Chính' });
    await expect(nav.getByRole('link', { name: 'Khám phá' })).toHaveCount(0);
    await nav.getByRole('link', { name: 'Sự kiện' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(problems).toEqual([]);
  });
});
