import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The home page in Kính đêm (festfinder-web/src/kd/web/home): this weekend by default, the
 * time in the headline, the family chips and sort, all kept in the address; the featured card,
 * nearby tonight, the FAQ; and the logo and icons both fronts serve.
 */

async function open(page: Page, path = '/') {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const headings = (page: Page) => page.getByRole('heading', { level: 2 }).first();

test.describe('the home page', () => {
  test('arrives as HTML with this weekend’s events and its other language', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<h1[^>]*>[\s\S]*Cuối tuần này[\s\S]*có gì chơi\?<\/h1>/);
    for (const title of ['HOZO Super Fest', 'Ravolution Music Festival']) expect(html).toContain(title);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="[^"]*\/\?lang=en"/);
    expect(html).not.toContain('/ui/theme.css');
    const en = await (await request.get('/?lang=en')).text();
    expect(en).toMatch(/This weekend[\s\S]*what’s on\?/);
  });

  test('the time in the headline, the style chips and the sort change the list and the address', async ({ page }) => {
    const problems = await open(page);
    await expect(headings(page)).toHaveText(/\d+ sự kiện cuối tuần này/);
    await page.getByRole('group', { name: 'Thời gian' }).getByRole('button', { name: /Tối nay/ }).click();
    await expect(page).toHaveURL(/\/\?time=tonight$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tối nay');
    await expect(headings(page)).toHaveText(/\d+ sự kiện tối nay/);

    await page.getByRole('button', { name: /Tháng này/ }).first().click();
    // The chips name the styles there are events in: the seed's techno night and its house warm-up.
    await page.getByRole('group', { name: 'Dòng nhạc' }).getByRole('button', { name: /^Techno/ }).click();
    await expect(page).toHaveURL(/time=month&style=techno/);
    await expect.poll(() => page.locator('.kd-ev .kd-h').allInnerTexts()).toEqual(['Ravolution Music Festival']);

    await page.getByRole('button', { name: 'Sắp xếp' }).click();
    await page.getByRole('menuitemradio', { name: 'Giá thấp trước' }).click();
    await expect(page).toHaveURL(/sort=price/);
    expect(problems).toEqual([]);
  });

  test('the nav’s style menu lands on what it names', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Dòng nhạc' }).click();
    // Styles only: the price is a filter, not a style.
    await expect(page.getByRole('menuitem', { name: /Miễn phí/ })).toHaveCount(0);
    await page.getByRole('menuitem', { name: /House/ }).click();
    await expect(page).toHaveURL(/\/\?style=house$/);
    await expect(page.getByRole('group', { name: 'Dòng nhạc' }).getByRole('button', { name: /House/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('group', { name: 'Dòng nhạc' }).getByRole('button', { name: /Miễn phí/ })).toHaveCount(0);
  });

  test('free stands apart from the styles and narrows the one chosen', async ({ page }) => {
    await open(page, '/?time=month&style=techno');
    const free = page.getByRole('button', { name: /^Miễn phí/ });
    await free.click();
    await expect(page).toHaveURL(/style=techno&price=free/);
    await expect(free).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('group', { name: 'Dòng nhạc' }).getByRole('button', { name: /Techno/ })).toHaveAttribute('aria-pressed', 'true');
    await page.goto('/?time=month&price=free');
    await expect(page.getByRole('button', { name: /^Miễn phí/ })).toHaveAttribute('aria-pressed', 'true');
    for (const price of await page.locator('.kd-ev .kd-mb').allInnerTexts()) expect(price).toBe('Miễn phí');
  });

  test('shows every city at once: no city menu, and the heading only says the time the chips chose', async ({ page }) => {
    await open(page);
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 }).getByRole('button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /TP\.HCM/ })).toHaveCount(0);
    // The cards name their city instead.
    await expect(page.locator('.kd-ev').first()).toContainText('TP.HCM');
    await page.getByRole('group', { name: 'Thời gian' }).getByRole('button', { name: /7 ngày tới/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('7 ngày tới có gì chơi?');
  });

  test('nothing in a style tonight offers the way out', async ({ page }) => {
    await open(page, '/?time=tonight&style=trance');
    await expect(page.getByText('Chưa có sự kiện phù hợp')).toBeVisible();
    await page.getByRole('button', { name: 'Bỏ lọc' }).click();
    await expect(page).toHaveURL(/\/\?time=tonight$/);
  });

  test('search leads to the list, and the featured card to its event', async ({ page }) => {
    await open(page);
    await page.getByRole('searchbox', { name: 'Tìm sự kiện' }).fill('ravolution');
    await page.getByRole('button', { name: 'Tìm', exact: true }).click();
    await expect(page).toHaveURL(/\/list\?(.+&)?q=ravolution/);
    await open(page);
    await page.getByRole('link', { name: /^Nổi bật:/ }).click();
    await expect(page).toHaveURL(/\/e\/[a-z0-9-]+$/);
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
