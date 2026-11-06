import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The home page (owner, 2026-11-06) shows a map and calendar. The event page keeps "Mua vé" within reach;
 * the organiser's answers and everyone's comments are one "Bình luận". Questions live on /about
 * with their FAQPage JSON-LD.
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

for (const size of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
  test(`${size.name}: the home page shows a map and calendar`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    const problems = await open(page, '/');
    const main = page.getByRole('main');
    // Map section
    await expect(main.locator('section[aria-label*="Bản đồ"]')).toBeVisible();
    // Calendar section (which is a table)
    await expect(main.locator('section[aria-labelledby="cal-h"] table')).toBeVisible();
    expect(problems).toEqual([]);
  });
}

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
  await page.getByRole('heading', { name: 'Thêm', exact: true }).scrollIntoViewIfNeeded();
  await expect(dock).not.toHaveAttribute('data-away', 'true');
  await expect(dock.getByRole('link', { name: 'Mua vé' })).toBeInViewport();
  expect(problems).toEqual([]);
});

test('one "Bình luận": the organiser’s answers, then the comments; the rules behind "Quy tắc"', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/e/ravo');
  // Under "Thêm" (design v2 phase 12): its row opens it.
  await page.locator('summary', { hasText: /^Bình luận/ }).click();
  const qa = page.locator('#discussion');
  await expect(qa).toBeVisible();
  await expect(qa.getByRole('heading', { level: 3, name: 'Câu hỏi thường gặp' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Thảo luận' })).toHaveCount(0);
  await expect(qa.getByText(/Hãy tử tế/)).toHaveCount(0);
  await qa.getByRole('button', { name: 'Quy tắc' }).click();
  await expect(qa.getByText(/Hãy tử tế/)).toBeVisible();
});
