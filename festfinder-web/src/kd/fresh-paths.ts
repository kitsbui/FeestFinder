/** Which public pages a save of an event, an artist, an organiser or a project changes (kd/fresh.ts). */
export type FreshKind = 'e' | 'a' | 'o' | 'p';

/** The lists that show each kind's cover or photo, besides its own page. */
const LISTS: Record<FreshKind, string[]> = {
  e: ['/'],
  a: ['/a', '/a/radar'],
  o: [],
  p: ['/p'],
};

const SLUG = /^[a-z0-9][a-z0-9-]{0,159}$/;
const en = (path: string) => (path === '/' ? '/en' : path + '/en');

/** Each page in both languages (the English ones are rewritten to /…/en); none for anything else. */
export function pathsToFreshen(kind: unknown, slug: unknown): string[] {
  if (typeof kind !== 'string' || !Object.hasOwn(LISTS, kind) || typeof slug !== 'string' || !SLUG.test(slug)) return [];
  return [`/${kind}/${slug}`, ...LISTS[kind as FreshKind]].flatMap((p) => [p, en(p)]);
}
