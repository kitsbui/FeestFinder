/**
 * The city landing pages (/vi/ho-chi-minh/edm/this-weekend…) are gone: each event page now
 * answers search engines itself. Their links land on the list with the same filters, the
 * same way the API's own pages redirect them (legacyListPath in festfinder-backend).
 */
const CITIES = ['ho-chi-minh', 'ha-noi', 'da-nang', 'nha-trang'];
const GENRES: Record<string, string> = {
  edm: 'EDM', festival: 'Festival', indie: 'Indie', rock: 'Rock', 'hip-hop': 'Hip-Hop', pop: 'Pop', jazz: 'Jazz', food: 'Food', culture: 'Culture', 'night-market': 'Food',
};
const TIMES: Record<string, string> = { tonight: 'tonight', 'this-weekend': 'weekend', 'next-7-days': '7days', 'this-month': 'month' };

export function legacyListPath(lang: 'vi' | 'en', city: string, facets: string[]): string {
  const q = new URLSearchParams();
  if (CITIES.includes(city)) q.set('city', city);
  for (const f of facets.map((x) => x.toLowerCase())) {
    if (GENRES[f] && !q.has('genre')) q.set('genre', GENRES[f]);
    if (TIMES[f] && !q.has('time')) q.set('time', TIMES[f]);
  }
  q.set('lang', lang);
  const qs = q.toString();
  return '/list' + (qs ? `?${qs}` : '');
}

type Ctx = { params: Promise<{ city: string; facets?: string[] }> };

/** A GET handler that sends an old landing URL on, for good. */
export const legacyRedirect = (lang: 'vi' | 'en') => async (req: Request, { params }: Ctx) => {
  const { city, facets } = await params;
  return Response.redirect(new URL(legacyListPath(lang, city, facets ?? []), req.url), 301);
};
