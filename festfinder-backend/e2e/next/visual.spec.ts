import { expect, test } from '@playwright/test';

/*
 * Visual baselines of the main screens at a phone, a tablet and a desktop width (design phase 0).
 * Opt-in: fonts and image decoding differ between machines, so the baselines here are for the
 * machine that made them. CI does not use them: on every pull request that touches the front it
 * shoots these screens on the base branch and on the PR, on the same runner, and compares
 * (.github/workflows/visual.yml, the design v2 phase 6 gate); the "visual-ok" label accepts a change.
 *
 *   npm run test:visual                       compare with the baselines
 *   npm run test:visual -- --update-snapshots make new baselines after an intended change (fresh build)
 *
 * A diff is reviewed in the PR like code: the report shows the expected, actual and diff images.
 */
test.skip(!process.env.FF_VISUAL, 'set FF_VISUAL=1 (npm run test:visual)');

/**
 * The home page (owner, 2026-11-06: map + calendar), the event page, the artists, the kit;
 * and two regions on their own (design v2 phase 14), because a full page's 1 % misses a change
 * in a small place: the event hero and the home page's calendar toolbar.
 */
const screens: { path: string; region?: string; name?: string }[] = [
  { path: '/' }, { path: '/e/ravo' }, { path: '/a' }, { path: '/kit' },
  { path: '/e/ravo', region: 'section.kd-wrap', name: 'event-hero' },
  { path: '/', region: 'section[aria-labelledby="cal-h"]', name: 'home-calendar' },
];
const SIZES = [{ name: 'phone', width: 390, height: 844 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 900 }];

for (const size of SIZES) {
  for (const { path, region, name: label } of screens) {
    test(`${label ?? path} · ${size.name}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(path);
      await page.locator('html[data-kd-session]').waitFor({ state: 'attached', timeout: 15_000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      // A region the base branch does not have yet is not shot there: the PR's shot then arrives with no
      // expectation, fails, and lands in the visual-diff artifact to be looked at.
      if (region && !(await page.locator(region).count())) test.skip(true, `${region} is not on this branch`);
      // The home page's map: MapLibre in place of the board (a pointer over it wakes it), and its
      // canvas masked, since WebGL draws differently from run to run; the pins stay in the shot.
      const map = page.getByRole('region', { name: 'Bản đồ sự kiện' });
      if (await map.count()) {
        await map.hover();
        await map.locator('.maplibregl-marker').first().waitFor({ timeout: 15_000 }).catch(() => {});
      }
      const opts = { animations: 'disabled' as const, caret: 'hide' as const, maxDiffPixelRatio: 0.01, mask: [page.locator('canvas.maplibregl-canvas')] };
      const name = `${label ?? (path === '/' ? 'home' : path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''))}-${size.name}.png`;
      if (region) await expect(page.locator(region).first()).toHaveScreenshot(name, opts);
      else await expect(page).toHaveScreenshot(name, { ...opts, fullPage: true });
    });
  }
}
