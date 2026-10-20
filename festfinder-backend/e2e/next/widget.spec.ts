import { expect, test } from '@playwright/test';

/*
 * The calendar widget on an organiser's own website (growth plan card 1): a page elsewhere loads
 * /ui/widget/ff-widget.js, which reads /embed/organizers/<slug> and draws in a Shadow DOM; each row
 * opens the event with ?src=widget.
 */
test('the widget draws an organiser’s upcoming nights on another site', async ({ page, baseURL }) => {
  const org = await (await page.request.get('/events/ravo')).json();
  const slug = org.organizer.slug as string;
  await page.goto('about:blank');
  await page.setContent(`<!doctype html><meta charset="utf-8"><title>Club site</title><h1>Our nights</h1>
    <div id="ff" data-ff-org="${slug}" data-ff-lang="vi" data-ff-theme="light" data-ff-limit="3"></div>
    <script src="${baseURL}/ui/widget/ff-widget.js" async></script>`);
  const rows = page.locator('#ff').locator('a[role="listitem"]');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(0);
  expect(await rows.count()).toBeLessThanOrEqual(3);
  await expect(rows.first()).toHaveAttribute('href', /\/e\/[^?]+\?src=widget$/);
  await expect(page.locator('#ff').getByRole('link', { name: /Xem tất cả trên FeestFinder/ })).toBeVisible();
  // The page's own styles never reach inside.
  expect(await page.evaluate(() => !!document.querySelector('#ff')!.shadowRoot)).toBe(true);
});
