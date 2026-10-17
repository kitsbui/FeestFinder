import { expect, test } from '@playwright/test';

/*
 * Visual baselines of the main screens at a phone, a tablet and a desktop width (design phase 0).
 * Opt-in: fonts and image decoding differ between machines, so these run where the baselines were
 * made, not in CI.
 *
 *   npm run test:visual                       compare with the baselines
 *   npm run test:visual -- --update-snapshots make new baselines after an intended change
 *
 * A diff is reviewed in the PR like code: the report shows the expected, actual and diff images.
 */
test.skip(!process.env.FF_VISUAL, 'set FF_VISUAL=1 (npm run test:visual)');

/** The home page in its default view, then in the other one (a phone opens the grid, a wider screen the table). */
const screens = (width: number) => ['/', width < 760 ? '/?view=table' : '/?view=grid', '/e/ravo', '/a', '/kit'];
const SIZES = [{ name: 'phone', width: 390, height: 844 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 900 }];

for (const size of SIZES) {
  for (const path of screens(size.width)) {
    test(`${path} · ${size.name}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(path);
      await page.locator('html[data-kd-session]').waitFor({ state: 'attached', timeout: 15_000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      const name = `${path === '/' ? 'home' : path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-${size.name}.png`;
      await expect(page).toHaveScreenshot(name, { fullPage: true, animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 });
    });
  }
}
