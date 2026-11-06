/**
 * Every screen, by who can open it: the routes the layout and health checks walk
 * (layout.spec.ts, wcag.spec.ts, health.spec.ts). Add a screen here when you add it.
 */
export const ACCOUNTS = {
  fan: { identifier: 'minh@example.com', password: 'festfinder123' },
  organizer: { identifier: 'team@ravolution.vn', password: 'ravolution2026' },
  artist: { identifier: 'slimv@example.com', password: 'festfinder123' },
  admin: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' },
};

export type Role = 'visitor' | keyof typeof ACCOUNTS;
/** The site's other languages: the public pages are walked in each (design v2 phase 15; English runs 20–30 % longer than Vietnamese). */
export const OTHER_LANGS = ['en', 'th', 'ja', 'id'] as const;
/** A route in another language (`?lang=`), whatever its query already says. */
export const inLang = (path: string, lang: string) => path + (path.includes('?') ? '&' : '?') + 'lang=' + lang;
export const ROUTES: Record<Role, string[]> = {
  visitor: ['/', '/?city=ho-chi-minh', '/e/ravo', '/a', '/a/radar', '/a/slimv', '/a/hoaprox', '/a/style/techno', '/a/city/ho-chi-minh',
    '/o/ravoent', '/about', '/advertise', '/p', '/blog', '/stats/venues', '/kit'],
  // /app, /app/list, /app/saved, /app/profile and /app/e/… lead to the site's pages since design v2 phase 4.
  fan: ['/profile', '/saved', '/app/notifications', '/app/alerts', '/app/settings',
    '/app/following', '/app/hyped', '/app/commission', '/app/plan/ravo', '/app/guide/ravo', '/app/live/hozo', '/app/recap/ravo-2025', '/p/mine', '/p/new', '/blog/mine', '/blog/new'],
  organizer: ['/studio', '/studio/events', '/studio/new', '/studio/inbox', '/studio/announce',
    '/studio/ads', '/studio/gigs', '/studio/profile', '/studio/events/:first'],
  artist: ['/studio/artist', '/studio/artist/mixes', '/studio/artist/gigs', '/studio/artist/opportunities', '/studio/artist/gear'],
  admin: ['/console', '/console/overview', '/console/claims', '/console/reports', '/console/feedback', '/console/events', '/console/events/new',
    '/console/organizers', '/console/venues', '/console/artists', '/console/partners', '/console/affiliate', '/console/brands',
    '/console/projects', '/console/blog', '/console/news', '/console/featured', '/console/users', '/console/insights', '/console/audit', '/console/verification'],
};
