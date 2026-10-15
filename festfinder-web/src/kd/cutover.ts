/**
 * The paths this app renders as pages (src/app/(kd)). src/proxy.ts sends every other path to
 * the API, and KdLink makes only these client navigations.
 *
 * Add a route here in the same change that moves it to (kd).
 */
export const CUTOVER: readonly RegExp[] = [
  /^\/kit$/,
  // The home page, both languages.
  /^\/(en)?$/,
  // Every event as a table, a grid or a map.
  /^\/list(\/en)?$/,
  // The event pages, both languages (/e/<slug>/en is where ?lang=en is rewritten to).
  /^\/e\/[^/]+(\/en)?$/,
  // The organiser pages, both languages.
  /^\/o\/[^/]+(\/en)?$/,
  // The artist pages and the artist directory (/a, /a/style/<style>, /a/city/<city>), both languages.
  /^\/a(\/en)?$/,
  /^\/a\/(style|city)\/[^/]+(\/en)?$/,
  /^\/a\/(?!(en|style|city)(\/|$))[^/]+(\/en)?$/,
  // Public collections, both languages.
  /^\/c\/[^/]+(\/en)?$/,
  // Saved events and collections, the about and advertising pages, one explore stat.
  /^\/saved$/,
  /^\/(about|advertise)$/,
  /^\/stats\/[^/]+$/,
  // The app: every screen of it.
  /^\/app(\/.*)?$/,
  // Studio, the organisers' back office: every screen of it.
  /^\/studio(\/.*)?$/,
  // The signed-in person's own profile on the web.
  /^\/profile$/,
  // The Console, the team's back office: every tab of it.
  /^\/console(\/.*)?$/,
];

/** Whether a path (with or without its query) is served by a rebuilt page. */
export function isCutOver(path: string): boolean {
  const p = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return CUTOVER.some((r) => r.test(p));
}
