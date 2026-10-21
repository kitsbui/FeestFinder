/** Which public pages a save of an event, an artist, an organiser, a project, a featured shelf or a blog post changes (kd/fresh.ts). */
export type FreshKind = 'e' | 'a' | 'o' | 'p' | 's' | 'blog';

/** The lists that show each kind's cover or photo, besides its own page. */
const LISTS: Record<FreshKind, string[]> = {
  e: ['/'],
  a: ['/a', '/a/radar'],
  o: [],
  p: ['/p'],
  // A shelf has no page of its own: the home page draws it.
  s: ['/'],
  blog: ['/blog'],
};

const NO_PAGE = new Set<FreshKind>(['s']);

const SLUG = /^[a-z0-9][a-z0-9-]{0,159}$/;
const en = (path: string) => (path === '/' ? '/en' : path + '/en');

/** Each page in both languages (the English ones are rewritten to /…/en); none for anything else. */
export function pathsToFreshen(kind: unknown, slug: unknown): string[] {
  if (typeof kind !== 'string' || !Object.hasOwn(LISTS, kind) || typeof slug !== 'string' || !SLUG.test(slug)) return [];
  const own = NO_PAGE.has(kind as FreshKind) ? [] : [`/${kind}/${slug}`];
  return [...own, ...LISTS[kind as FreshKind]].flatMap((p) => [p, en(p)]);
}
