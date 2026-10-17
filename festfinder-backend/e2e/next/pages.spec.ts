import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The home page and the event page of design v2 phase 2 (artboards 04–07 of the design review):
 * the list by day is the default and its first event is in the first screen at 390 and 1440px;
 * the table is a view to ask for; the questions live on /about with their FAQPage JSON-LD; on a
 * phone the event page keeps "Mua vé" within reach and puts the tickets right after the hero;
 * the organiser's answers and everyone's questions are one "Hỏi đáp".
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

for (const size of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
  test(`${size.name}: the home page lists by day, its first event in the first screen`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    const problems = await open(page, '/');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 2, name: /^(Thứ|Chủ nhật)/ }).first()).toBeVisible();
    await expect(main.getByRole('table')).toHaveCount(0);
    const first = await main.locator('article.kd-ev').first().boundingBox();
    expect(first, 'an event card').toBeTruthy();
    expect(first!.y + 48, 'its top and title in the first screen').toBeLessThan(size.height);
    expect(problems).toEqual([]);
  });
}

test('the table is the view to ask for; the bar keeps the filters on screen while the list scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/?view=table');
  await expect(page.getByRole('main').getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: 'Lưới', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.mouse.wheel(0, 1200);
  const bar = page.getByRole('group', { name: 'Bộ lọc' });
  await expect(bar).toBeInViewport();
});

test('a phone filters from "Lọc", a sheet of every filter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/');
  await page.getByRole('button', { name: /^Lọc/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Bộ lọc' });
  await sheet.getByRole('group', { name: 'Thời gian' }).getByRole('button', { name: 'Cuối tuần này' }).click();
  await expect(page).toHaveURL(/time=weekend/);
  await sheet.getByRole('button', { name: 'Xem sự kiện' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuối tuần này');
  await expect(page.getByRole('button', { name: /^Lọc\s*1/ })).toBeVisible();
});

test('the questions are on /about with their FAQPage JSON-LD, no longer on the home page', async ({ request }) => {
  const home = await (await request.get('/')).text();
  expect(home).not.toContain('Câu hỏi thường gặp');
  const about = await (await request.get('/about')).text();
  expect(about).toContain('FeestFinder là gì?');
  const blocks = [...about.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const faq = blocks.find((b) => b['@type'] === 'FAQPage');
  expect(faq?.mainEntity?.length).toBe(4);
});

test('a phone: the facts, the tickets right after the hero, and "Mua vé" always within reach', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const problems = await open(page, '/e/ravo');
  const facts = page.locator('[data-facts]');
  for (const label of ['Thời gian', 'Địa điểm', 'Giá', 'Độ tuổi']) await expect(facts.getByText(label, { exact: true })).toBeVisible();
  // The dock above the tab bar, on the first screen.
  const dock = page.locator('.kd-buy-dock');
  await expect(dock.getByRole('link', { name: 'Mua vé' })).toBeInViewport();
  // The ticket panel comes before the page's sections; while it is on screen the dock steps aside.
  const panel = page.locator('#tickets');
  const about = page.getByRole('heading', { name: 'Giới thiệu' });
  expect((await panel.boundingBox())!.y).toBeLessThan((await about.boundingBox())!.y);
  await panel.scrollIntoViewIfNeeded();
  await expect(dock).toHaveAttribute('data-away', 'true');
  // Further down it is back.
  await page.getByRole('heading', { name: /^Hỏi đáp/ }).scrollIntoViewIfNeeded();
  await expect(dock).not.toHaveAttribute('data-away', 'true');
  await expect(dock.getByRole('link', { name: 'Mua vé' })).toBeInViewport();
  expect(problems).toEqual([]);
});

test('one "Hỏi đáp": the organiser’s answers, then the questions; the rules behind "Quy tắc"', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/e/ravo');
  const qa = page.locator('#discussion');
  await expect(qa.getByRole('heading', { level: 2, name: /^Hỏi đáp/ })).toBeVisible();
  await expect(qa.getByRole('heading', { level: 3, name: 'Câu hỏi thường gặp' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Thảo luận' })).toHaveCount(0);
  await expect(qa.getByText(/Hãy tử tế/)).toHaveCount(0);
  await qa.getByRole('button', { name: 'Quy tắc' }).click();
  await expect(qa.getByText(/Hãy tử tế/)).toBeVisible();
});
