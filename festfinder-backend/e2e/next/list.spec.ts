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
  /** A night's stamps in the month, by the name they are read by (its time and title). */
  const night = (page: Page, name: string) => cal(page).locator('table').getByRole('link', { name: new RegExp(name) });

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
    await expect(night(page, 'HOZO Super Fest')).toHaveCount(3);
    await cal(page).getByRole('button', { name: 'Tháng sau' }).click();
    await expect(title).not.toHaveText(september!);
    await expect(night(page, 'HOZO Super Fest')).toHaveCount(0);
    await cal(page).getByRole('button', { name: 'Tháng trước' }).click();
    await cal(page).getByRole('button', { name: 'Tháng trước' }).click();
    await cal(page).getByRole('button', { name: 'Hôm nay' }).click();
    await expect(title).toHaveText(september!);
    expect(problems).toEqual([]);
  });

  test('a chip opens the night beside it, with its page and Google Calendar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const problems = await open(page, '/');
    await night(page, 'Ravolution Warm-up').click();
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

  test('"Tối nay" over the map leads to tonight’s nights, listed under the calendar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const problems = await open(page, '/');
    // The demo clock is 2026-09-14 10:00: tonight's nights have not started.
    const tonight = page.getByRole('region', { name: 'Bản đồ sự kiện' }).getByRole('link', { name: /^Tối nay · \d+ sự kiện$/ });
    await expect(tonight).toBeInViewport();
    await tonight.click();
    const list = page.locator('#tonight');
    await expect(list).toBeInViewport();
    await expect(list.getByRole('heading', { name: 'Tối nay' })).toBeVisible();
    await expect(list.getByRole('link')).toHaveCount(Number(/(\d+) sự kiện/.exec((await tonight.innerText()))![1]));
    expect(problems).toEqual([]);
  });

  test('"Cuối tuần" over the map leads to the weekend’s nights, listed under the calendar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const problems = await open(page, '/');
    const weekend = page.getByRole('region', { name: 'Bản đồ sự kiện' }).getByRole('link', { name: /^Cuối tuần · \d+ sự kiện$/ });
    await expect(weekend).toBeInViewport();
    await weekend.click();
    const list = page.locator('#weekend');
    await expect(list).toBeInViewport();
    await expect(list.getByRole('heading', { name: 'Cuối tuần' })).toBeVisible();
    await expect(list.getByRole('link')).toHaveCount(Number(/(\d+) sự kiện/.exec((await weekend.innerText()))![1]));
    expect(problems).toEqual([]);
  });

  test('"Miễn phí" over the map leads to the free nights still to come, listed under the calendar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const problems = await open(page, '/');
    const free = page.getByRole('region', { name: 'Bản đồ sự kiện' }).getByRole('link', { name: /^Miễn phí · \d+ sự kiện$/ });
    await expect(free).toBeInViewport();
    await free.click();
    const list = page.locator('#free');
    await expect(list).toBeInViewport();
    await expect(list.getByRole('heading', { name: 'Miễn phí' })).toBeVisible();
    await expect(list.getByRole('link')).toHaveCount(Number(/(\d+) sự kiện/.exec((await free.innerText()))![1]));
    expect(problems).toEqual([]);
  });

  test('on a phone the next seven days are rows under the month, at most eight; a computer has none of them', async ({ page, request }) => {
    // The server draws the rows before any script runs.
    expect(await (await request.get('/')).text()).toContain('id="week"');
    await page.setViewportSize({ width: 390, height: 844 });
    const problems = await open(page, '/');
    const week = page.locator('#week');
    await expect(week.getByRole('heading', { name: '7 ngày tới' })).toBeVisible();
    const rows = await week.getByRole('link').count();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(8);
    expect(problems).toEqual([]);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(week).toBeHidden();
  });

  test('a search names up to three of its artists under the chips, each a link to the artist page', async ({ page }) => {
    await page.route(/\/artists\/suggest\?/, (route) => route.fulfill({ json: { items: [
      { slug: 'dtap', name: 'DTAP', imageUrl: null, claimed: true },
      { slug: 'dj-mie', name: 'DJ Mie', imageUrl: null, claimed: true },
      { slug: 'slimv', name: 'SlimV', imageUrl: null, claimed: true },
      { slug: 'triple-d', name: 'Triple D', imageUrl: null, claimed: true },
      { slug: 'radar-only', name: 'Radar Only', imageUrl: null, claimed: false },
    ] } }));
    const problems = await open(page, '/?q=ravolution');
    const names = page.getByRole('region', { name: 'Bản đồ sự kiện' }).getByRole('navigation', { name: 'Nghệ sĩ' });
    await expect(names).toBeVisible();
    await expect(names.getByRole('link')).toHaveCount(3);
    await expect(names.getByRole('link', { name: 'DTAP' })).toHaveAttribute('href', '/a/dtap');
    await expect(names.getByRole('link', { name: 'Triple D' })).toHaveCount(0);
    await expect(names.getByRole('link', { name: 'Radar Only' })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('nights at one place stay one cluster at any zoom: a tap on it lists them', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // Every night of the search at one venue, as a club's coming nights are.
    await page.route(/\/events\/map\?.*q=ravolution/, async (route) => {
      const body = await (await route.fetch()).json();
      const [a] = body.items as { lat: number; lng: number }[];
      body.items = body.items.map((e: object) => ({ ...e, lat: a.lat, lng: a.lng, approx: false }));
      await route.fulfill({ json: body });
    });
    const problems = await open(page, '/?q=ravolution');
    const map = page.getByRole('region', { name: 'Bản đồ sự kiện' });
    await map.hover();
    const count = map.locator('.maplibregl-marker.kd-mb').first();
    await expect(count).toBeAttached({ timeout: 15_000 });
    const n = Number(await count.innerText());
    expect(n).toBeGreaterThan(1);
    const b = (await count.boundingBox())!;
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    const card = map.getByRole('dialog');
    await expect(card.getByRole('link')).toHaveCount(n);
    await expect(card.getByRole('link', { name: /Ravolution Music Festival/ })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a search from the address narrows the map and the calendar, and its chip clears it', async ({ page }) => {
    const problems = await open(page, '/?q=hozo');
    await expect(night(page, 'Ravolution')).toHaveCount(0);
    await expect(night(page, 'HOZO Super Fest')).toHaveCount(3);
    await expect(page.locator('[data-surface]')).toHaveCount(0);
    await page.getByRole('button', { name: /“hozo”/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(night(page, 'Ravolution').first()).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a search with no answer says so and offers the way back; one that fails offers to try again', async ({ page }) => {
    const map = page.getByRole('region', { name: 'Bản đồ sự kiện' });
    let fail = true;
    await page.route(/\/events\/map\?.*q=ravolution/, (route) => (fail ? (fail = false, route.fulfill({ status: 500, json: { error: { code: 'internal', message: 'x' } } })) : route.continue()));
    const problems = await open(page, '/?q=ravolution');
    await expect(map.getByText('Không tải được sự kiện')).toBeVisible();
    await map.getByRole('button', { name: 'Thử lại' }).click();
    await expect(night(page, 'Ravolution Music Festival')).toHaveCount(1);
    await expect(map.getByText('Không tải được sự kiện')).toHaveCount(0);
    expect(problems.filter((p) => !/500/.test(p))).toEqual([]);

    await open(page, '/?q=khongcosukiennao');
    await expect(map.getByText('Không có sự kiện nào khớp')).toBeVisible();
    await map.getByRole('button', { name: 'Bỏ lọc' }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(night(page, 'HOZO Super Fest')).toHaveCount(3);
  });

  test('each night is a stamp: a day’s stamps share its box, and a night under way bounces on the calendar and the map', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // Ravolution Music Festival under way whatever the clock says.
    await page.route(/\/events\/map\?.*q=ravolution/, async (route) => {
      const body = await (await route.fetch()).json();
      body.items = body.items.map((e: { slug: string }) => (e.slug === 'ravo' ? { ...e, startsAt: '2000-01-01T00:00:00Z', endsAt: '2100-01-01T00:00:00Z' } : e));
      await route.fulfill({ json: body });
    });
    const problems = await open(page, '/');
    // 19 September holds three nights: three stamps side by side, inside the day.
    const day = cal(page).locator('td').filter({ has: page.locator('a[href="/e/ravo"]') }).first();
    const box = (await day.boundingBox())!;
    const stamps = day.locator('a[href^="/e/"]');
    await expect(stamps).toHaveCount(3);
    for (const st of await stamps.all()) {
      const b = (await st.boundingBox())!;
      expect(b.width).toBeLessThanOrEqual(box.width / 3);
      expect(b.x).toBeGreaterThanOrEqual(box.x - 4);
      expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height + 4);
    }
    await expect(cal(page).locator('.kd-bounce')).toHaveCount(0);

    await open(page, '/?q=ravolution');
    await expect(night(page, 'Ravolution Music Festival').locator('.kd-bounce')).toHaveCount(1);
    await expect(page.getByRole('region', { name: 'Bản đồ sự kiện' }).locator('.kd-ppin-live .kd-bounce')).toHaveCount(1);
    expect(problems).toEqual([]);
  });

  test('a style’s link narrows to its nights', async ({ page }) => {
    const problems = await open(page, '/?style=techno');
    await expect(night(page, 'Ravolution Music Festival')).toHaveCount(1);
    await expect(night(page, 'HOZO Super Fest')).toHaveCount(0);
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
