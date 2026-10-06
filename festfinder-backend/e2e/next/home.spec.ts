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

  test('the time in the headline, the family chips and the sort change the list and the address', async ({ page }) => {
    const problems = await open(page);
    await expect(headings(page)).toHaveText(/\d+ sự kiện cuối tuần này/);
    await page.getByRole('group', { name: 'Thời gian' }).getByRole('button', { name: /Tối nay/ }).click();
    await expect(page).toHaveURL(/\/\?time=tonight$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tối nay');
    await expect(headings(page)).toHaveText(/\d+ sự kiện tối nay/);

    await page.getByRole('button', { name: /Tháng này/ }).first().click();
    await page.getByRole('group', { name: 'Thể loại' }).getByRole('button', { name: /EDM/ }).click();
    await expect(page).toHaveURL(/time=month&family=edm/);
    // Every card left is of the family (cards wear their family's class), whichever events are live.
    await expect.poll(async () => {
      const classes = await page.locator('.kd-ev').evaluateAll((els) => els.map((e) => e.className));
      return classes.length > 0 && classes.every((c) => c.includes('kd-g-edm'));
    }).toBe(true);

    await page.getByRole('button', { name: 'Sắp xếp' }).click();
    await page.getByRole('menuitemradio', { name: 'Giá thấp trước' }).click();
    await expect(page).toHaveURL(/sort=price/);
    expect(problems).toEqual([]);
  });

  test('the nav’s genre menu lands on the family it names', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Thể loại' }).click();
    await page.getByRole('menuitem', { name: /Miễn phí/ }).click();
    await expect(page).toHaveURL(/\/\?price=free$/);
    await expect(page.getByRole('group', { name: 'Thể loại' }).getByRole('button', { name: /Miễn phí/ })).toHaveAttribute('aria-pressed', 'true');
    for (const price of await page.locator('.kd-ev .kd-mb').allInnerTexts()) expect(price).toBe('Miễn phí');
  });

  test('a city with no events yet is shown as coming soon', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: /TP\.HCM/ }).click();
    const menu = page.getByRole('menu', { name: 'Thành phố' });
    await expect(menu.getByRole('menuitemradio', { name: /TP\.HCM/ })).toHaveAttribute('aria-checked', 'true');
    await expect(menu.getByRole('menuitemradio', { name: /Sắp có/ }).first()).toHaveAttribute('aria-disabled', 'true');
  });

  test('nothing in a family this weekend offers the way out', async ({ page }) => {
    await open(page, '/?time=tonight&family=fest');
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
