import type { MetadataRoute } from 'next';
import { apiOr, SITE_URL, type EventCard, type Landing } from '@/lib/api';

// Rebuilt at most every 15 minutes: new listings reach search engines the same hour.
export const revalidate = 900;

/** Every live listing, every organiser with one, and the city landing pages. */
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

  // The landing pages link to each other; one of them lists the rest.
  const landing = await apiOr<Landing | null>('/seo/landing/vi/ho-chi-minh/this-weekend', null, { revalidate: 900 });
  const landingPaths = new Set(['/vi/ho-chi-minh/this-weekend', '/en/ho-chi-minh/this-weekend']);
  for (const r of landing?.related ?? []) {
    if (!r.href.startsWith('/vi/')) continue;
    landingPaths.add(r.href);
    landingPaths.add(r.href.replace(/^\/vi\//, '/en/')); // every landing page exists in both languages
  }

  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/map`, lastModified: now, changeFrequency: 'hourly', priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
    ...[...landingPaths].map((p) => ({ url: SITE_URL + p, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...events.filter((e) => !e.past).map((e) => ({ url: `${SITE_URL}/e/${e.slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 })),
    ...[...organizers.values()].map((o) => ({ url: `${SITE_URL}/o/${o.slug}`, changeFrequency: 'weekly' as const, priority: 0.5 })),
  ];
}
