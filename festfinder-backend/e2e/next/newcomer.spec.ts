import { expect, test } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * A newcomer on a phone (design v2 phase 11, artboard 24 of the design review): what someone who
 * has never used FeestFinder sees and can do, on data like Feest Radar's (no price, no age, no
 * cover, English text). Every check here is a promise to that person.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('a night sold at a price nobody gave is never "free"', async ({ page }) => {
  const problems = watch(page);
  // As the API answers for a Radar find whose page gives no price (test/public.test.ts checks the API itself).
  await page.route(/\/events\/map\?/, async (route) => {
    const body = (await (await route.fetch()).json()) as { items: { title: string; isFree: boolean; priceFrom: number; priceUnknown?: boolean }[] };
    const items = body.items.map((e, i) => (i === 0 ? { ...e, isFree: false, priceFrom: 0, priceUnknown: true } : e));
    await route.fulfill({ json: { ...body, items } });
  });
  await page.goto('/?city=ho-chi-minh&view=map');
  const first = page.locator('[data-map-rows] > button').first();
  await expect(first).toBeVisible();
  const rows = page.locator('[data-map-rows] > button', { hasText: 'Chưa rõ giá' });
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).not.toContainText('Miễn phí');
  expect(problems).toEqual([]);
});
