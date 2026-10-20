import { expect, test } from '@playwright/test';

/*
 * The calendar widget on an organiser's own website (growth plan card 1): a page elsewhere loads
 * /ui/widget/ff-widget.js, which reads /embed/organizers/<slug> and draws in a Shadow DOM; each row
 * opens the event with ?src=widget.
 */
test('the widget draws an organiser’s upcoming nights on another site', async ({ page, baseURL }) => {
  const org = await (await page.request.get('/events/ravo')).json();
  const slug = org.organizer.slug as string;
  // Drawn into a page as an organiser's site would host it (the open CORS of /embed for other sites is
  // checked in test/calendar.test.ts: Chrome keeps a test page elsewhere from loading localhost).
  await page.goto('/about');
  await page.evaluate(({ slug, src }) => {
    const host = document.createElement('div');
    host.id = 'ff';
    Object.assign(host.dataset, { ffOrg: slug, ffLang: 'vi', ffTheme: 'light', ffLimit: '3' });
    document.body.appendChild(host);
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }, { slug, src: `${baseURL}/ui/widget/ff-widget.js` });
  const rows = page.locator('#ff').locator('a[role="listitem"]');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(0);
  expect(await rows.count()).toBeLessThanOrEqual(3);
  await expect(rows.first()).toHaveAttribute('href', /\/e\/[^?]+\?src=widget$/);
  await expect(page.locator('#ff').getByRole('link', { name: /Xem tất cả trên FeestFinder/ })).toBeVisible();
  // The page's own styles never reach inside.
  expect(await page.evaluate(() => !!document.querySelector('#ff')!.shadowRoot)).toBe(true);
});
