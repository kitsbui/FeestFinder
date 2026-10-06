import type { MetadataRoute } from 'next';
import { apiOr, SITE_URL, type EventCard } from '@/lib/api';

// Rebuilt at most every 15 minutes: new listings reach search engines the same hour.
export const revalidate = 900;

/** Every live listing, every organiser and artist with one, in both languages. */
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
    ...events.filter((e) => !e.past).flatMap((e) => {
      const vi = `${SITE_URL}/e/${e.slug}`, en = `${vi}?lang=en`;
      const alternates = { languages: { vi, en, 'x-default': vi } };
      return [
        { url: vi, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9, alternates },
        { url: en, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7, alternates },
      ];
    }),
    ...[...organizers.values()].flatMap((o) => {
      const vi = `${SITE_URL}/o/${o.slug}`, en = `${vi}?lang=en`;
      const alternates = { languages: { vi, en, 'x-default': vi } };
      return [
        { url: vi, changeFrequency: 'weekly' as const, priority: 0.6, alternates },
        { url: en, changeFrequency: 'weekly' as const, priority: 0.4, alternates },
      ];
    }),
    ...artists.flatMap((a) => {
      const vi = `${SITE_URL}/a/${a.slug}`, en = `${vi}?lang=en`;
      const alternates = { languages: { vi, en, 'x-default': vi } };
      return [
        { url: vi, changeFrequency: 'weekly' as const, priority: 0.6, alternates },
        { url: en, changeFrequency: 'weekly' as const, priority: 0.4, alternates },
      ];
    }),
    ...directories.flatMap((path) => {
      const vi = `${SITE_URL}${path}`, en = `${vi}?lang=en`;
      const alternates = { languages: { vi, en, 'x-default': vi } };
      return [
        { url: vi, changeFrequency: 'daily' as const, priority: 0.5, alternates },
        { url: en, changeFrequency: 'daily' as const, priority: 0.4, alternates },
      ];
    }),
  ];
}
