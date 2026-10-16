import { expect, test, type Page } from '@playwright/test';
import { signInWith } from '../checks.ts';

/*
 * Every screen fills the width and never scrolls sideways (the owner's rule, 2026-10-16), on a
 * phone (390) and a desktop (1440), for every role that has screens: no page wider than the
 * window, and no box inside it that scrolls sideways behind a hidden scrollbar (kd.css hides them
 * all, so nobody would know) unless it fades at its edge: a row of tabs (.kd-tabs), of chips
 * (.kd-hscroll) or anything marked data-scroll-x. Each test walks its routes and lists every offender, so one run shows them all.
 */

const ACCOUNTS = {
  fan: { identifier: 'minh@example.com', password: 'festfinder123' },
  organizer: { identifier: 'team@ravolution.vn', password: 'ravolution2026' },
  artist: { identifier: 'slimv@example.com', password: 'festfinder123' },
  admin: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' },
};

const ROUTES: Record<'visitor' | keyof typeof ACCOUNTS, string[]> = {
  visitor: ['/', '/list', '/list?view=table', '/list?view=grid', '/e/ravo', '/a', '/a/radar', '/a/slimv', '/a/hoaprox', '/a/style/techno', '/a/city/ho-chi-minh',
    '/o/ravoent', '/about', '/advertise', '/p', '/stats/venues', '/kit'],
  fan: ['/profile', '/saved', '/app', '/app/list', '/app/saved', '/app/tickets', '/app/profile', '/app/notifications', '/app/alerts', '/app/settings',
    '/app/following', '/app/hyped', '/app/e/ravo', '/app/checkout/ravo', '/app/plan/ravo', '/app/guide/ravo', '/app/live/hozo', '/app/recap/ravo-2025', '/p/mine', '/p/new'],
  organizer: ['/studio', '/studio/events', '/studio/new', '/studio/attendees', '/studio/door', '/studio/revenue', '/studio/inbox', '/studio/announce',
    '/studio/promos', '/studio/ads', '/studio/gigs', '/studio/profile', '/studio/events/:first'],
  artist: ['/studio/artist', '/studio/artist/mixes', '/studio/artist/gigs', '/studio/artist/opportunities', '/studio/artist/gear'],
  admin: ['/console', '/console/overview', '/console/claims', '/console/reports', '/console/feedback', '/console/events', '/console/events/new',
    '/console/organizers', '/console/venues', '/console/artists', '/console/sources', '/console/partners', '/console/affiliate', '/console/brands',
    '/console/projects', '/console/featured', '/console/users', '/console/orders', '/console/insights', '/console/audit', '/console/verification'],
};

/** What overflows on this page: the page itself, and boxes that scroll sideways without saying so. */
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
      if (el.scrollWidth <= el.clientWidth + 1 || el.closest('[data-scroll-x], .kd-tabs, .kd-hscroll')) continue;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'PRE' || el.closest('dialog:not([open])')) continue;
      const label = el.getAttribute('aria-label') || el.getAttribute('role') || '';
      out.push(`scrolls sideways: ${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')}${label ? ` [${label}]` : ''} ${el.scrollWidth}px in ${el.clientWidth}px`);
    }
    return out;
  });
}

for (const [role, routes] of Object.entries(ROUTES) as [keyof typeof ROUTES, string[]][]) {
  for (const size of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
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
