import { expect, test, type Page } from '@playwright/test';
import { signInWith } from '../checks.ts';
import { ACCOUNTS, ROUTES } from './routes.ts';

/*
 * Every screen fits the width of the device and nothing scrolls sideways, anywhere (the owner's rule,
 * 2026-10-16, made absolute 2026-10-17): on a phone (390), a tablet (768) and a desktop (1440), for
 * every role that has screens, no page is wider than the window and no box inside it scrolls
 * sideways, not even a row of tabs or chips (they wrap). Each test walks its routes and lists every
 * offender, so one run shows them all.
 */

/** What overflows on this page: the page itself, and any box that scrolls sideways. */
async function overflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const W = window.innerWidth;
    const out: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > W + 1) {
      // The widest culprit: the deepest element whose right edge passes the window and whose box is not clipped by an ancestor.
      let worst: { w: number; d: string } | null = null;
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= W + 1) continue;
        let clipped = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if (o !== 'visible') { clipped = true; break; }
        }
        if (clipped) continue;
        if (!worst || r.right > worst.w) worst = { w: Math.round(r.right), d: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 3).join('.') : '') };
      }
      out.push(`page ${doc.scrollWidth}px > ${W}px` + (worst ? ` (${worst.d} reaches ${worst.w}px)` : ''));
    }
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      const s = getComputedStyle(el);
      if (!(s.overflowX === 'auto' || s.overflowX === 'scroll')) continue;
      if (el.scrollWidth <= el.clientWidth + 1) continue;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'PRE' || el.closest('dialog:not([open])')) continue;
      const label = el.getAttribute('aria-label') || el.getAttribute('role') || '';
      out.push(`scrolls sideways: ${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')}${label ? ` [${label}]` : ''} ${el.scrollWidth}px in ${el.clientWidth}px`);
    }
    return out;
  });
}

for (const [role, routes] of Object.entries(ROUTES) as [keyof typeof ROUTES, string[]][]) {
  for (const size of [{ name: 'phone', width: 390, height: 844 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 900 }]) {
    test(`${role} · ${size.name}: no screen scrolls sideways`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: size.width, height: size.height });
      if (role !== 'visitor') await signInWith(page, ACCOUNTS[role]);
      const failures: string[] = [];
      for (let path of routes) {
        if (path.includes(':first')) {
          const { items } = await (await page.request.get('/organizer/events')).json();
          path = path.replace(':first', items[0].id);
        }
        await page.goto(path);
        await page.locator('html[data-kd-session]').waitFor({ state: 'attached', timeout: 15_000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
        for (const f of await overflow(page)) failures.push(`${path}: ${f}`);
      }
      expect(failures, failures.join('\n')).toEqual([]);
    });
  }
}
