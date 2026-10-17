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
  test('arrives as HTML with every event, the questions and its other language', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<h1[^>]*>Tất cả sự kiện<\/h1>/);
    for (const title of ['HOZO Super Fest', 'Ravolution Music Festival']) expect(html).toContain(title);
    expect(html).toContain('Câu hỏi thường gặp');
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
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Menu' }).click();
    const sheet = page.getByRole('dialog', { name: 'Menu' });
    await expect(sheet.getByRole('link', { name: 'Khám phá' })).toHaveCount(0);
    await expect(sheet.getByRole('link', { name: 'Sự kiện', exact: true })).toHaveAttribute('aria-current', 'page');
    expect(problems).toEqual([]);
  });

  test('the old addresses of the list and the map lead here with their filters', async ({ page }) => {
    await page.goto('/list?style=techno&view=grid');
    await expect(page).toHaveURL(/\/\?style=techno&view=grid$/);
    await expect(page.getByRole('button', { name: 'Kiểu đêm' })).toHaveText('Techno');
    await page.goto('/list?lang=en');
    await expect(page).toHaveURL(/\/\?lang=en$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Every event' })).toBeVisible();
    await page.goto('/map');
    await expect(page).toHaveURL(/\/\?view=map$/);
  });

  test('the nav’s style menu and search land on the home page’s list', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, '/a');
    await page.getByRole('button', { name: 'Dòng nhạc' }).click();
    await expect(page.getByRole('menuitem', { name: /Miễn phí/ })).toHaveCount(0);
    const counted = Number(((await page.getByRole('menuitem', { name: /House/ }).innerText()).match(/\d+/) ?? ['0'])[0]);
    await page.getByRole('menuitem', { name: /House/ }).click();
    await expect(page).toHaveURL(/\/\?style=house$/);
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
