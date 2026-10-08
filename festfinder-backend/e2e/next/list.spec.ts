import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * /list in Kính đêm (festfinder-web/src/kd/web/list): every upcoming event as a table, a grid
 * or a map, with the legacy address (city, genre, time, style, type, view, bbox, q).
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the list', () => {
  test('shows every event as a table or a grid, by city', async ({ page }) => {
    const problems = await open(page, '/list');
    await expect(page.getByRole('heading', { level: 1, name: 'Tất cả sự kiện' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await page.getByRole('button', { name: 'Lưới', exact: true }).click();
    await expect(page).toHaveURL(/\/list\?view=grid$/);
    await expect(page.getByRole('row')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Ravolution Music Festival' })).toBeVisible();
    await page.getByRole('button', { name: /^Thành phố/ }).click();
    await page.getByRole('menuitemradio', { name: /Hà Nội/ }).click();
    await expect(page.getByText('Không có sự kiện nào khớp')).toBeVisible();
    await expect(page).toHaveURL(/city=ha-noi/);
    expect(problems).toEqual([]);
  });

  test('filters by kind of night and style, and the same choice again turns it off', async ({ page }) => {
    await open(page, '/list');
    await page.getByRole('button', { name: 'Kiểu đêm' }).click();
    await page.getByRole('menuitemradio', { name: 'Techno', exact: true }).click();
    await expect(page).toHaveURL(/style=techno/);
    await expect(page.getByText('Không có sự kiện nào khớp')).toBeVisible();
    await page.getByRole('button', { name: 'Kiểu đêm' }).click();
    await page.getByRole('menuitemradio', { name: 'Techno', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
  });

  test('the old city landing pages land on the list with their filters', async ({ page }) => {
    await page.goto('/vi/ho-chi-minh/edm/this-weekend');
    await expect(page).toHaveURL(/\/list\?city=ho-chi-minh&genre=EDM&time=weekend(&lang=vi)?$/);
    await expect(page.getByRole('main').getByRole('button', { name: 'Thể loại' })).toContainText('EDM');
    const rows = page.getByRole('row');
    await expect(rows.filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'HOZO' })).toHaveCount(0);
  });

  test('a search from anywhere lands here with the words in the address', async ({ page }) => {
    await open(page, '/list?q=ravolution');
    await expect(page.getByRole('searchbox', { name: 'Tìm sự kiện' })).toHaveValue('ravolution');
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await expect(page.getByRole('row').filter({ hasText: 'HOZO' })).toHaveCount(0);
  });

  test('the map asks for the events in view once, and again only on "search this area"', async ({ page }) => {
    const problems = watch(page);
    const asked: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/events/map?')) asked.push(r.url()); });
    await page.goto('/list?city=ho-chi-minh&view=map');
    const map = page.locator('[data-kd-map]');
    await expect(map.locator('canvas')).toBeVisible();
    // With no basemap configured, the city names are what there is to see where things are.
    await expect(map.locator('.kd-area', { hasText: 'TP.HCM' })).toBeVisible();
    await expect(map.locator('.kd-area', { hasText: 'Hà Nội' })).toBeAttached();
    await expect.poll(() => asked.length).toBe(1);
    await expect(page.getByText(/\d+ sự kiện · gần nhất trước/)).toBeVisible();
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
    await page.goto('/list?city=ho-chi-minh&view=map');
    const row = page.getByRole('button', { name: /Ravolution Music Festival/ }).first();
    await row.click();
    await expect(row).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.kd-ppin[aria-pressed="true"]')).toHaveCount(1);
    await page.getByRole('link', { name: 'Xem chi tiết' }).click();
    await expect(page).toHaveURL(/\/e\/ravo$/);
  });

  test('free and nearby narrow the map list, and clearing brings it back', async ({ page }) => {
    await page.goto('/list?city=ho-chi-minh&view=map');
    const line = page.getByText(/\d+ sự kiện · gần nhất trước/);
    const n = async () => Number((await line.innerText()).match(/\d+/)![0]);
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
    await open(page, '/list?lang=en');
    await expect(page.getByRole('heading', { level: 1, name: 'Every event' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveAttribute('href', '/e/ravo?lang=en');
    await page.getByRole('button', { name: 'Grid', exact: true }).click();
    await expect(page).toHaveURL(/\/list\?view=grid&lang=en$/);
    await expect(page.locator('link[rel="alternate"][hreflang="vi"]')).toHaveAttribute('href', /\/list$/);
  });
});
