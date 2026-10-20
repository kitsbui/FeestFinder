import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The home page is the list of every event (owner, 2026-10-17; festfinder-web/src/kd/web/list):
 * no "Khám phá" page any more, /list and /map lead here with their filters, the banner and the
 * questions sit below the list, and the logo and icons both fronts serve load. The list itself is
 * checked in list.spec.ts.
 */

async function open(page: Page, path = '/') {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the home page', () => {
  test('arrives as HTML with every event and its other language (the questions are on /about)', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<h1[^>]*>Tất cả sự kiện<\/h1>/);
    for (const title of ['HOZO Super Fest', 'Ravolution Music Festival']) expect(html).toContain(title);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="[^"]*\/\?lang=en"/);
    expect(html).toMatch(/<link rel="canonical" href="https?:\/\/[^/"]+\/?"/);
    const en = await (await request.get('/?lang=en')).text();
    expect(en).toMatch(/<h1[^>]*>Every event<\/h1>/);
    expect(en).toContain('<title>FeestFinder — EDM club nights, raves and festivals</title>');
  });

  test('has no "Khám phá": the nav names Sự kiện for the home page, on a computer and a phone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const problems = await open(page);
    const nav = page.getByRole('navigation', { name: 'Chính' });
    await expect(nav.getByRole('link', { name: 'Khám phá' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Sự kiện' })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'Sự kiện' })).toHaveAttribute('aria-current', 'page');
    // On a phone the tab bar is the nav.
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(nav.getByRole('link', { name: 'Khám phá' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Sự kiện', exact: true })).toHaveAttribute('aria-current', 'page');
    expect(problems).toEqual([]);
  });

  test('the old addresses of the list and the map lead here with their filters', async ({ page }) => {
    await page.goto('/list?style=techno&view=grid');
    await expect(page).toHaveURL(/\/\?style=techno&view=grid$/);
    await expect(page.getByRole('button', { name: /, Loại$/ })).toHaveText('Techno');
    await page.goto('/list?lang=en');
    await expect(page).toHaveURL(/\/\?lang=en$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Every event' })).toBeVisible();
    await page.goto('/map');
    await expect(page).toHaveURL(/\/\?view=map$/);
  });

  test('the search and its styles land on the home page’s list', async ({ page }) => {
    // A computer: the bar's field, reached with Ctrl+K (⌘K on a Mac).
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, '/a');
    await page.keyboard.press('Control+k');
    const field = page.getByRole('banner').getByRole('searchbox', { name: 'Tìm kiếm' });
    await expect(field).toBeFocused();
    await field.fill('ravolution');
    await field.press('Enter');
    await expect(page).toHaveURL(/\/\?q=ravolution$/);
    // A phone: the search on top; its styles count every upcoming event.
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '/a');
    await page.getByRole('banner').getByRole('button', { name: 'Tìm kiếm' }).click();
    const sheet = page.getByRole('dialog', { name: 'Tìm kiếm' });
    const house = sheet.getByRole('link', { name: /^House\b/ });
    await expect(house).toContainText(/\d/);
    const counted = Number(((await house.innerText()).match(/\d+/) ?? ['0'])[0]);
    await house.click();
    // A phone opens the list on its cards, and the address says so.
    await expect(page).toHaveURL(/\/\?style=house(&view=grid)?$/);
    await expect(page.getByText('Không có sự kiện nào khớp')).toHaveCount(0);
    const listed = (await (await page.request.get('/events?time=all&upcoming=1&style=house&limit=1')).json()).total;
    expect(listed).toBe(counted);
  });

  test('no line counts the events or says when the list was updated', async ({ page }) => {
    await open(page);
    await expect(page.getByText(/sự kiện · Cập nhật/)).toHaveCount(0);
    await expect(page.getByText(/^Cập nhật \d/)).toHaveCount(0);
  });

  test('the logo and every icon the page links to load', async ({ page, request }) => {
    await open(page);
    const logo = page.locator('img[src="/kd/ff-wordmark.svg"]').first();
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const icons = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll((links) => links.map((l) => l.getAttribute('href') ?? ''));
    expect(icons.length).toBeGreaterThanOrEqual(3);
    for (const href of [...icons, '/favicon.ico']) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
      expect(res.headers()['content-type'], href).toMatch(/^image\//);
    }
  });
});

/*
 * A featured shelf the team switched on takes the home page's one highlight slot (growth plan
 * card 5), with "Được tài trợ" when it was paid for. The demo shelves are outside their dates on
 * the test clock, so this turns one on and puts it back.
 */
test('a featured shelf takes the highlight slot, and says when it is paid for', async ({ page }) => {
  await page.request.post('/auth/login', { data: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' } });
  type Shelf = { id: string; slug: string; enabled: boolean; sponsored: boolean; startsOn: string | null; endsOn: string | null; items: { id: string }[] };
  const shelf = ((await (await page.request.get('/admin/shelves')).json()).items as Shelf[]).find((s) => s.slug === 'quiet-nights')!;
  const ids = (await (await page.request.get('/events?time=all&upcoming=true&city=ho-chi-minh&limit=3')).json()).items.map((e: { id: string }) => e.id);
  const fresh = () => page.request.post('/kd-fresh', { data: { kind: 's', slug: shelf.slug } });
  try {
    await page.request.put(`/admin/shelves/${shelf.id}/items`, { data: { eventIds: ids } });
    await page.request.patch(`/admin/shelves/${shelf.id}`, { data: { enabled: true, sponsored: true, startsOn: null, endsOn: null } });
    await fresh();
    await page.goto('/');
    const slot = page.getByRole('region', { name: 'Đêm nhạc nhẹ' });
    await expect(slot).toBeVisible();
    await expect(slot.getByText('Được tài trợ', { exact: true })).toBeVisible();
    await expect(slot.locator('a[href^="/e/"]').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lễ hội lớn thế giới' })).toHaveCount(0);
  } finally {
    await page.request.put(`/admin/shelves/${shelf.id}/items`, { data: { eventIds: shelf.items.map((i) => i.id) } });
    await page.request.patch(`/admin/shelves/${shelf.id}`, { data: { enabled: shelf.enabled, sponsored: shelf.sponsored, startsOn: shelf.startsOn, endsOn: shelf.endsOn } });
    await fresh();
  }
});
