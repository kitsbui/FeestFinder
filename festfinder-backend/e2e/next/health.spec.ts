import { expect, test, type Page } from '@playwright/test';
import { signInWith } from '../checks.ts';
import { ACCOUNTS, ROUTES, type Role } from './routes.ts';

/*
 * Every screen, for every role, opens cleanly (the tech lead's corner-case pass, 2026-10-17): no
 * uncaught exception, no error in the console, no server error, and no request the screen
 * itself got wrong (a 400, or a 404 or 405 on an API path the screen calls while it opens).
 * Linked pictures come from hosts the test browser cannot reach; their load errors are the art's
 * business (ui/covers.tsx), not a fault.
 */

const IGNORED_CONSOLE = [
  /Failed to load resource: net::ERR_(NAME_NOT_RESOLVED|CONNECTION_REFUSED|ADDRESS_UNREACHABLE)/,
  // A signed-out or not-allowed probe the screen expects and handles (FF.maybe).
  /Failed to load resource: the server responded with a status of 40[13]/,
];

function collect(page: Page, path: () => string) {
  const out: string[] = [];
  page.on('pageerror', (e) => out.push(`${path()}: uncaught ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (IGNORED_CONSOLE.some((r) => r.test(text))) return;
    // A 404 the screen asked for shows as a console line too; the response handler says which.
    if (/Failed to load resource: the server responded with a status of 404/.test(text)) return;
    out.push(`${path()}: console ${text.slice(0, 200)}`);
  });
  page.on('response', (r) => {
    const url = new URL(r.url());
    if (url.origin !== new URL(page.url() || 'http://x').origin) return;
    const s = r.status();
    const api = !url.pathname.startsWith('/_next/') && r.request().resourceType() === 'fetch';
    if (s >= 500 || (api && (s === 400 || s === 404 || s === 405 || s === 422))) out.push(`${path()}: ${s} ${r.request().method()} ${url.pathname}${url.search}`);
  });
  return out;
}

for (const [role, routes] of Object.entries(ROUTES) as [Role, string[]][]) {
  for (const size of [{ name: 'desktop', width: 1280, height: 860 }, { name: 'phone', width: 390, height: 844 }]) {
    test(`${role} · ${size.name}: every screen opens with no error and no request it got wrong`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.setViewportSize({ width: size.width, height: size.height });
      if (role !== 'visitor') await signInWith(page, ACCOUNTS[role]);
      let current = '';
      const problems = collect(page, () => current);
      for (let path of routes) {
        if (path.includes(':first')) {
          const { items } = await (await page.request.get('/organizer/events')).json();
          path = path.replace(':first', items[0].id);
        }
        current = path;
        await page.goto(path);
        await page.locator('html[data-kd-session]').waitFor({ state: 'attached', timeout: 15_000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
      }
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
}
