import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signInWith } from '../checks.ts';
import { ACCOUNTS, ROUTES, inLang } from './routes.ts';

/*
 * Accessibility, by axe-core, on every screen of every role (routes.ts) at a phone and a desktop
 * width: no serious or critical violation of WCAG 2.1 A/AA (the design phase 0 rule: "axe 0 lỗi
 * nghiêm trọng"). Each test walks its routes and lists every violation with the elements it found,
 * so one run shows them all.
 *
 * Named to run after the flows (files run in name order): opening the pages makes Next prefetch
 * and cache the pages they link to (an artist page from /a/radar), which a flow that changes one
 * of them (artist.spec adds a mix) would then read stale.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** The public pages in English too (phase 15): axe reads the page's language and its labels. */
const WALKS: [string, string[], keyof typeof ACCOUNTS | null][] = [
  ...(Object.entries(ROUTES) as [keyof typeof ROUTES, string[]][]).map(([role, routes]) => [role, routes, role === 'visitor' ? null : role] as [string, string[], keyof typeof ACCOUNTS | null]),
  ['visitor · en', ROUTES.visitor.filter((r) => r !== '/kit').map((r) => inLang(r, 'en')), null],
];

for (const [role, routes, account] of WALKS) {
  for (const size of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
    test(`${role} · ${size.name}: no serious or critical accessibility violation`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.setViewportSize({ width: size.width, height: size.height });
      if (account) await signInWith(page, ACCOUNTS[account]);
      const failures: string[] = [];
      for (let path of routes) {
        if (path.includes(':first')) {
          const { items } = await (await page.request.get('/organizer/events')).json();
          path = path.replace(':first', items[0].id);
        }
        await page.goto(path);
        await page.locator('html[data-kd-session]').waitFor({ state: 'attached', timeout: 15_000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
        // One skip link, first on the page, leading to the one <main id="main"> (ui/skip-link.tsx).
        const skip = await page.evaluate(() => ({
          links: [...document.querySelectorAll('a.kd-skip')].map((a) => a.getAttribute('href')),
          first: document.querySelector('a[href], button')?.classList.contains('kd-skip') ?? false,
          targets: [...document.querySelectorAll('#main')].map((m) => m.tagName),
        }));
        if (skip.links.join() !== '#main' || !skip.first || skip.targets.join() !== 'MAIN') failures.push(`${path}: skip link ${JSON.stringify(skip)}`);
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        for (const v of violations) {
          if (v.impact !== 'serious' && v.impact !== 'critical') continue;
          const where = v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ');
          failures.push(`${path}: [${v.impact}] ${v.id} ×${v.nodes.length} — ${v.help} (${where})`);
        }
      }
      expect(failures, failures.join('\n')).toEqual([]);
    });
  }
}
