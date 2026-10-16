import { expect, test, type Page } from '@playwright/test';

/*
 * One type family, Noto Sans, and only the files a page shows (festfinder-web/scripts/fonts-css.ts):
 * a Vietnamese page fetches the latin and vietnamese files, never latin-ext, Thai or Japanese;
 * Thai text fetches the Thai file; Japanese text adds Noto Sans JP's stylesheet and its slices.
 */

const fontFiles = (page: Page) => page.evaluate(() =>
  performance.getEntriesByType('resource')
    .filter((e) => /\.woff2(\?|$)/.test(e.name))
    .map((e) => ({ name: e.name.split('/').pop()!.split('?')[0], bytes: (e as PerformanceResourceTiming).encodedBodySize })));

async function settle(page: Page, path: string) {
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
}

test('a Vietnamese page fetches about 50 KB of Noto Sans and nothing else', async ({ page }) => {
  await settle(page, '/');
  expect(await page.evaluate(() => document.fonts.check('500 16px "Noto Sans Variable"', 'Tối nay ư ơ đ ₫'))).toBe(true);
  const files = await fontFiles(page);
  const names = files.map((f) => f.name).join(' ');
  expect(names).toMatch(/noto-sans-vietnamese/);
  expect(names).toMatch(/noto-sans-latin-wght/);
  expect(names, 'latin-ext no longer comes for ă đ ơ ư ₫').not.toMatch(/latin-ext/);
  expect(names).not.toMatch(/thai|jp-/);
  expect(files.reduce((n, f) => n + f.bytes, 0)).toBeLessThan(60_000);
  await expect(page.locator('link[href="/fonts/noto-sans-jp.css"]')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/^"Noto Sans Variable"/);
});

test('the English page needs no latin-ext either', async ({ page }) => {
  await settle(page, '/en');
  expect((await fontFiles(page)).map((f) => f.name).join(' ')).not.toMatch(/latin-ext|thai|jp-/);
});

test('Thai text fetches the Thai file; Japanese text adds Noto Sans JP', async ({ page }) => {
  await settle(page, '/');
  await page.evaluate(async () => {
    const p = document.createElement('p');
    p.textContent = 'สวัสดี กรุงเทพ';
    document.querySelector('main, ff-app')!.append(p);
    await document.fonts.load('16px "Noto Sans Thai Variable"', 'สวัสดี');
  });
  await expect.poll(async () => (await fontFiles(page)).map((f) => f.name).join(' ')).toMatch(/noto-sans-thai-thai/);

  await page.evaluate(() => {
    const p = document.createElement('p');
    p.textContent = '東京のテクノ';
    document.querySelector('main, ff-app')!.append(p);
  });
  await expect(page.locator('link[href="/fonts/noto-sans-jp.css"]')).toHaveCount(1);
  await page.evaluate(() => document.fonts.load('16px "Noto Sans JP Variable"', '東京のテクノ'));
  await expect.poll(async () => (await fontFiles(page)).map((f) => f.name).join(' ')).toMatch(/noto-sans-jp-\d+-wght/);
});
