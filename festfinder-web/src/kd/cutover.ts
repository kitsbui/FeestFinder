/**
 * The paths whose pages are rebuilt in Kính đêm (src/app/(kd)). The legacy screens are each a
 * single-page app that draws its own screen for every path below its base; their router
 * (FF.navigate in src/runtime/ff.ts) asks this list first and loads a rebuilt path as a page
 * of its own instead. The Next Playwright run reads it too, to leave these paths to e2e/next.
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
