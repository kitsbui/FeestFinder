import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The home page (festfinder-web/src/kd/web/list; /list redirects here): every upcoming event by
 * day (the default since design v2 phase 2), as a table or on a map, with the legacy address (city,
 * genre, time, style, type, view, bbox, q).
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

/** The events the list shows by day (not the highlight of world festivals above it). */
const cards = (page: Page) => page.getByRole('main').locator('.kd-days:not([data-surface]) article.kd-ev');

test.describe('the list, the home page', () => {
  test('a phone opens the list on its rows by day, not on a table wider than the screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const problems = await open(page, '/');
    await expect(page.getByRole('link', { name: 'Ravolution Music Festival' }).first()).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(0);
    // An address that names the table keeps it.
    await open(page, '/?view=table');
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    expect(problems).toEqual([]);
  });

  test('shows every event by day or as a table, by city', async ({ page }) => {
    const problems = await open(page, '/');
    await expect(page.getByRole('heading', { level: 1, name: 'Tất cả sự kiện' })).toBeVisible();
    await expect(cards(page).filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(0);
    await page.getByRole('button', { name: 'Bảng', exact: true }).click();
    await expect(page).toHaveURL(/\/\?view=table$/);
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await page.getByRole('button', { name: /^Thành phố/ }).click();
    await page.getByRole('menuitemradio', { name: /Hà Nội/ }).click();
    await expect(page.getByText('Không có sự kiện nào khớp')).toBeVisible();
    await expect(page).toHaveURL(/city=ha-noi/);
    expect(problems).toEqual([]);
  });

  test('filters by kind of night and style, and the same choice again turns it off', async ({ page }) => {
    await open(page, '/');
    await page.getByRole('button', { name: 'Kiểu đêm' }).click();
    await page.getByRole('menuitemradio', { name: 'Techno', exact: true }).click();
    await expect(page).toHaveURL(/style=techno/);
    await expect(cards(page).filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: 'HOZO' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Kiểu đêm' }).click();
    await page.getByRole('menuitemradio', { name: 'Techno', exact: true }).click();
    await expect(cards(page).filter({ hasText: 'HOZO' })).toHaveCount(1);
  });

  test('the old city landing pages land on the list with their filters', async ({ page }) => {
    await page.goto('/vi/ho-chi-minh/edm/this-weekend');
    await expect(page).toHaveURL(/\/\?city=ho-chi-minh&genre=EDM&time=weekend(&lang=vi)?$/);
    // Every event is EDM: the genre narrows nothing.
    await expect(cards(page).filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: 'HOZO' })).toHaveCount(1);
    await page.goto('/vi/ho-chi-minh/night-market');
    await expect(page).toHaveURL(/\/\?city=ho-chi-minh(&lang=vi)?$/);
  });

  test('a search from anywhere lands here with the words in the address, as a choice to take back', async ({ page }) => {
    await open(page, '/?q=ravolution');
    const chip = page.getByRole('group', { name: 'Bộ lọc' }).getByRole('button', { name: /Bỏ tìm “ravolution”/ });
    await expect(chip).toBeVisible();
    await expect(cards(page).filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: 'HOZO' })).toHaveCount(0);
    await chip.click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(cards(page).filter({ hasText: 'HOZO' })).toHaveCount(1);
  });

  test('is Sự kiện in the nav in every view, and a filter stays chosen and shown on the map', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, '/a');
    const nav = page.getByRole('navigation', { name: 'Chính' });
    await expect(nav.getByRole('link', { name: 'Bản đồ' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Khám phá' })).toHaveCount(0);
    await nav.getByRole('link', { name: 'Sự kiện' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(nav.getByRole('link', { name: 'Sự kiện' })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: 'Kiểu đêm' }).click();
    await page.getByRole('menuitemradio', { name: 'Techno', exact: true }).click();
    await page.getByRole('button', { name: 'Bản đồ', exact: true }).click();
    await expect(page).toHaveURL(/style=techno&view=map/);
    // One title for the page, one name per view: "Bản đồ" is the pressed view, nothing else.
    await expect(page.getByRole('heading', { level: 1, name: 'Tất cả sự kiện' })).toBeAttached();
    // (The phone's tab bar, hidden on a computer, names its map tab too.)
    await expect(page.getByRole('main').getByText('Bản đồ', { exact: true })).toHaveCount(1);
    await expect(nav.getByRole('link', { name: 'Sự kiện' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: 'Kiểu đêm' })).toHaveText('Techno');
    await expect(page.getByRole('button', { name: /Ravolution Music Festival/ })).toHaveCount(1);
    await expect(page.getByRole('button', { name: /HOZO/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Bảng', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Kiểu đêm' })).toHaveText('Techno');
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
  });

  test('on a phone, the tab bar holds the places, and "Tìm" the others and the styles', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, '/');
    const tabs = page.getByRole('navigation', { name: 'Chính' });
    await expect(tabs.getByRole('link', { name: 'Sự kiện', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(tabs.getByRole('link', { name: 'Bản đồ' })).toHaveAttribute('href', '/?view=map');
    await expect(tabs.getByRole('link', { name: 'Đã lưu' })).toHaveAttribute('href', '/saved');
    await expect(tabs.getByRole('link', { name: 'Tôi' })).toHaveAttribute('href', '/profile');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng sự kiện' })).toHaveAttribute('href', '/studio/new');
    await tabs.getByRole('button', { name: 'Tìm' }).click();
    const sheet = page.getByRole('dialog', { name: 'Tìm kiếm' });
    await expect(sheet.getByRole('link', { name: /^Techno/ })).toHaveAttribute('href', '/?style=techno');
    await expect(sheet.getByRole('link', { name: 'Dự án' })).toHaveAttribute('href', '/p');
    await expect(sheet.getByRole('link', { name: 'Nhà tổ chức' })).toHaveAttribute('href', '/studio');
    await sheet.getByRole('link', { name: 'Nghệ sĩ' }).click();
    await expect(page).toHaveURL(/\/a$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // The map's tab is lit on the map.
    await open(page, '/?view=map');
    await expect(tabs.getByRole('link', { name: 'Bản đồ' })).toHaveAttribute('aria-current', 'page');
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(tabs.getByRole('link', { name: 'Bản đồ' })).toBeHidden();
  });

  test('splits what someone posted from what Feest Radar found, and tags the Radar ones', async ({ page }) => {
    await open(page, '/');
    const source = page.getByRole('group', { name: 'Bộ lọc' }).getByRole('button', { name: /^Nguồn/ });
    await expect(source).toContainText('Mọi nguồn');
    // The demo data is all posted; a Radar find as the API sends one: the first event, found on another site.
    await page.route(/\/events\?.*origin=radar/, async (route) => {
      const real = await route.fetch({ url: route.request().url().replace('origin=radar', 'origin=posted') });
      const body = await real.json();
      await route.fulfill({ json: { ...body, total: 1, items: body.items.slice(0, 1).map((e: any) => ({ ...e, origin: 'radar' })) } });
    });
    await source.click();
    await page.getByRole('menuitemradio', { name: /^Radar/ }).click();
    await expect(page).toHaveURL(/origin=radar/);
    await expect(source).toContainText('Radar');
    await expect(cards(page).first().getByText('Do Feest Radar tìm thấy').first()).toBeAttached();
    await page.getByRole('button', { name: 'Bảng', exact: true }).click();
    await expect(page.getByRole('row').nth(1).getByText('Do Feest Radar tìm thấy')).toBeAttached();
    // The address keeps the choice; "Mọi nguồn" drops it.
    await page.goto('/?origin=posted');
    await expect(source).toContainText('Đã đăng');
    await source.click();
    await page.getByRole('menuitemradio', { name: /^Mọi nguồn/ }).click();
    await expect(page).not.toHaveURL(/origin=/);
  });

  test('the map asks for the events in view once, and again only on "search this area"', async ({ page }) => {
    const problems = watch(page);
    const asked: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/events/map?')) asked.push(r.url()); });
    await page.goto('/?city=ho-chi-minh&view=map');
    const map = page.locator('[data-kd-map]');
    await expect(map.locator('canvas')).toBeVisible();
    // With no basemap configured, the city names are what there is to see where things are.
    await expect(map.locator('.kd-area', { hasText: 'TP.HCM' })).toBeVisible();
    await expect(map.locator('.kd-area', { hasText: 'Hà Nội' })).toBeAttached();
    await expect.poll(() => asked.length).toBe(1);
    await expect(page.locator('[data-map-rows] > button').first()).toBeVisible();
    const box = (await map.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 120);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height / 2 + 40, { steps: 10 });
    await page.mouse.up();
    await expect(page.getByRole('button', { name: 'Tìm trong khu vực này' })).toBeVisible();
    expect(asked).toHaveLength(1);
    await page.getByRole('button', { name: 'Tìm trong khu vực này' }).click();
    await expect.poll(() => asked.length).toBe(2);
    await expect(page.getByRole('button', { name: 'Tìm trong khu vực này' })).toHaveCount(0);
    await expect(page).toHaveURL(/view=map&bbox=/);
    expect(problems).toEqual([]);
  });

  test('a row and its pin are chosen together, and the card opens the event', async ({ page }) => {
    await page.goto('/?city=ho-chi-minh&view=map');
    const row = page.getByRole('button', { name: /Ravolution Music Festival/ }).first();
    await row.click();
    await expect(row).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.kd-ppin[aria-pressed="true"]')).toHaveCount(1);
    await page.getByRole('link', { name: 'Xem chi tiết' }).click();
    await expect(page).toHaveURL(/\/e\/ravo$/);
  });

  test('free and nearby narrow the map list, and clearing brings it back', async ({ page }) => {
    await page.goto('/?city=ho-chi-minh&view=map');
    const n = () => page.locator('[data-map-rows] > button').count();
    // Chosen before the map has answered, too: the answer must not undo it.
    await page.getByRole('button', { name: 'Miễn phí', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Miễn phí', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(n).toBeGreaterThan(0);
    const free = await n();
    await page.getByRole('button', { name: 'Miễn phí', exact: true }).click();
    await expect.poll(n).toBeGreaterThan(free);
    const all = await n();
    await page.getByRole('button', { name: 'Miễn phí', exact: true }).click();
    await expect(page).toHaveURL(/price=free/);
    await expect.poll(n).toBe(free);
    await expect(page).toHaveURL(/price=free/);
    await page.getByRole('button', { name: 'Miễn phí', exact: true }).click();
    await page.getByRole('button', { name: 'Dưới 5 km' }).click();
    await expect.poll(n).toBeLessThan(all);
  });

  test('in English at ?lang=en, and its links stay in English', async ({ page }) => {
    await open(page, '/?lang=en');
    await expect(page.getByRole('heading', { level: 1, name: 'Every event' })).toBeVisible();
    await expect(cards(page).filter({ hasText: 'Ravolution Music Festival' }).getByRole('link', { name: 'Ravolution Music Festival' })).toHaveAttribute('href', '/e/ravo?lang=en');
    await page.getByRole('button', { name: 'Table', exact: true }).click();
    await expect(page).toHaveURL(/\/\?view=table&lang=en$/);
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveAttribute('href', '/e/ravo?lang=en');
    await expect(page.locator('link[rel="alternate"][hreflang="vi"]')).toHaveAttribute('href', /^https?:\/\/[^/]+\/?$/);
  });
});
