import { expect, test, type Page } from '@playwright/test';

/*
 * Installing FeestFinder and keeping the installed app new (growth plan card F): the manifest and
 * the per-build worker, the Apple meta on every page, the strip on a phone after the first visit,
 * the steps for each browser and "Cài ứng dụng" in "Tôi".
 */

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

test('the manifest, its icons and shortcuts, and a worker named after this build', async ({ request }) => {
  const m = await (await request.get('/manifest.webmanifest')).json();
  expect([m.id, m.start_url, m.display]).toEqual(['/app', '/?source=app', 'standalone']);
  expect(JSON.stringify(m)).not.toMatch(/vé|ticket/i);
  for (const icon of m.icons as { src: string }[]) expect((await request.get(icon.src)).status(), icon.src).toBe(200);
  for (const s of m.shortcuts as { url: string }[]) expect((await request.get(s.url)).status(), s.url).toBe(200);
  const sw = await request.get('/sw.js');
  expect(sw.headers()['cache-control']).toContain('no-cache');
  const body = await sw.text();
  expect(body).toMatch(/const VERSION = 'ff-[0-9a-f]{7,12}';/);
  expect(body).not.toContain('__BUILD_ID__');
  const html = await (await request.get('/')).text();
  expect(html).toMatch(/<meta name="apple-mobile-web-app-title" content="FeestFinder"/);
  expect(html).toMatch(/<meta name="(apple-)?mobile-web-app-capable" content="yes"/);
  expect(html).toMatch(/<link rel="apple-touch-icon" href="\/ui\/assets\/apple-touch-icon\.png" sizes="180x180"/);
});

async function phone(browser: import('@playwright/test').Browser, ua: string) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: ua, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  return { context, page: await context.newPage() };
}
const strip = (page: Page) => page.getByRole('region', { name: 'Cài FeestFinder' });

test('the strip waits for a second visit, sits above the tab bar, and "✕" puts it away', async ({ browser }) => {
  const { context, page } = await phone(browser, IPHONE);
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(strip(page)).toHaveCount(0);
  await page.goto('/saved');
  await expect(strip(page)).toBeVisible();
  const bar = await strip(page).boundingBox();
  const tabs = await page.getByRole('navigation', { name: 'Chính', exact: true }).boundingBox();
  expect(Math.round(bar!.y + bar!.height)).toBeLessThanOrEqual(Math.round(tabs!.y) + 1);
  // iPhone: the steps through Share.
  await strip(page).getByRole('button', { name: 'Cài', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Cài FeestFinder' });
  await expect(sheet.getByText('Bấm Chia sẻ ở thanh dưới')).toBeVisible();
  await sheet.getByRole('button', { name: 'Đóng' }).click();
  await strip(page).getByRole('button', { name: 'Để sau' }).click();
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(strip(page)).toHaveCount(0);
  await context.close();
});

test('on Android a tap shows Chrome’s own prompt when it has one', async ({ browser }) => {
  const { context, page } = await phone(browser, ANDROID);
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await page.goto('/saved');
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt') as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    e.prompt = async () => { (window as unknown as { prompted: boolean }).prompted = true; };
    e.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(e);
  });
  await strip(page).getByRole('button', { name: 'Cài', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { prompted?: boolean }).prompted === true)).toBe(true);
  await expect(page.getByRole('dialog', { name: 'Cài FeestFinder' })).toHaveCount(0);
  await context.close();
});

test('"Tôi" offers "Cài ứng dụng" in a browser and says "Đã cài" in the installed app', async ({ browser }) => {
  const { context, page } = await phone(browser, ANDROID);
  await page.goto('/profile');
  await expect(page.getByRole('button', { name: 'Cài ứng dụng' })).toBeVisible();
  await page.goto('/profile?source=app');
  await expect(page.getByText('Đã cài')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cài ứng dụng' })).toHaveCount(0);
  await context.close();
});
