import type { MetadataRoute } from 'next';
import { apiOr, SITE_URL, type EventCard } from '@/lib/api';
import { LANGS, type Lang } from '@/kd/copy';

// Rebuilt at most every 15 minutes: new listings reach search engines the same hour.
export const revalidate = 900;

type Entry = Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates' | 'priority'>;

/** A page in its five languages (design v2 phase 10), each address naming the others: Vietnamese first. */
function inEvery(vi: string, entry: Entry, priority: number): MetadataRoute.Sitemap {
  const at = (l: Lang) => (l === 'vi' ? vi : `${vi}?lang=${l}`);
  const alternates = { languages: { ...Object.fromEntries(LANGS.map((l) => [l, at(l)])), 'x-default': vi } };
  return LANGS.map((l) => ({ url: at(l), ...entry, priority: l === 'vi' ? priority : Math.round(priority * (l === 'en' ? 8 : 6)) / 10, alternates }));
}

/** Every live listing, every organiser and artist with one, in every language. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events: EventCard[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 50; page++) {
    const out: { items: EventCard[]; nextCursor: string | null } | null = await apiOr<{ items: EventCard[]; nextCursor: string | null } | null>(
      `/events?time=all&limit=60${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      null,
      { revalidate: 900 },
    );
    if (!out) break;
    events.push(...out.items);
    cursor = out.nextCursor;
    if (!cursor) break;
  }

  const organizers = new Map<string, EventCard['organizer']>();
  for (const e of events) organizers.set(e.organizer.slug, e.organizer);

  // Artists with a show still to come.
  const meta = await apiOr<{ items: { slug: string }[]; directories?: string[] } | null>('/meta/artists', null, { revalidate: 900 });
  const artists = meta?.items ?? [];
  // The artist directory pages that list enough artists to be indexed.
  const directories = meta?.directories ?? [];

  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/list`, lastModified: now, changeFrequency: 'hourly', priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
    ...events.filter((e) => !e.past).flatMap((e) => inEvery(`${SITE_URL}/e/${e.slug}`, { lastModified: now, changeFrequency: 'daily' }, 0.9)),
    ...[...organizers.values()].flatMap((o) => inEvery(`${SITE_URL}/o/${o.slug}`, { changeFrequency: 'weekly' }, 0.6)),
    ...artists.flatMap((a) => inEvery(`${SITE_URL}/a/${a.slug}`, { changeFrequency: 'weekly' }, 0.6)),
    ...directories.flatMap((path) => inEvery(`${SITE_URL}${path}`, { changeFrequency: 'daily' }, 0.5)),
  ];
}
