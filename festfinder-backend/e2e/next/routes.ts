/**
 * Every screen, by who can open it: the routes the layout and health checks walk
 * (layout.spec.ts, health.spec.ts). Add a screen here when you add it.
 */
export const ACCOUNTS = {
  fan: { identifier: 'minh@example.com', password: 'festfinder123' },
  organizer: { identifier: 'team@ravolution.vn', password: 'ravolution2026' },
  artist: { identifier: 'slimv@example.com', password: 'festfinder123' },
  admin: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' },
};

export type Role = 'visitor' | keyof typeof ACCOUNTS;
export const ROUTES: Record<Role, string[]> = {
  visitor: ['/', '/?view=table', '/?view=grid', '/e/ravo', '/a', '/a/radar', '/a/slimv', '/a/hoaprox', '/a/style/techno', '/a/city/ho-chi-minh',
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
