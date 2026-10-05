import { finalize } from '../normalize.ts';
import type { DiscoverResult, IngestIO, IngestSource, NormalizeContext, RawRecord, SourceAdapter } from '../types.ts';

/*
 * Ticketmaster's Discovery API v2, its official public API: music events by country and
 * city. Needs TICKETMASTER_API_KEY. The key stays on the server and is never stored with
 * the source.
 *
 *   { "countryCode": "SG", "city": "Singapore", "pages": 2 }
 */

interface TicketmasterConfig { countryCode?: string; city?: string; keyword?: string; classificationName?: string; pages?: number }

const API = 'https://app.ticketmaster.com/discovery/v2/events.json';
const PAGE_SIZE = 100;
const MAX_PAGES = 5;

export const ticketmasterAdapter: SourceAdapter = {
  id: 'ticketmaster',

  async discover(source: IngestSource, io: IngestIO): Promise<DiscoverResult> {
    const key = io.secrets.ticketmasterKey;
    if (!key) return { records: [], errors: ['TICKETMASTER_API_KEY is not set'] };
    const c = source.config as TicketmasterConfig;
    const pages = Math.min(Math.max(1, Number(c.pages) || 1), MAX_PAGES);
    const records: RawRecord[] = [];
    const errors: string[] = [];
    for (let page = 0; page < pages; page++) {
      const q = new URLSearchParams({
        apikey: key, size: String(PAGE_SIZE), page: String(page), sort: 'date,asc',
        classificationName: c.classificationName ?? 'music',
        startDateTime: io.now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      });
      if (c.countryCode) q.set('countryCode', c.countryCode);
      if (c.city) q.set('city', c.city);
      if (c.keyword) q.set('keyword', c.keyword);
      let body: any;
      try {
        const res = await io.fetchText(`${API}?${q}`, { accept: 'application/json', api: true });
        body = JSON.parse(res.text);
      } catch (e) {
        // The message never carries the URL, so the key does not reach the logs.
        errors.push(`page ${page}: ${(e as Error).message}`.slice(0, 200));
        break;
      }
      for (const ev of body?._embedded?.events ?? []) {
        if (typeof ev?.id !== 'string') continue;
        records.push({ externalId: ev.id, url: typeof ev.url === 'string' ? ev.url : null, payload: ev });
      }
      if ((body?.page?.totalPages ?? 1) <= page + 1) break;
    }
    return { records, errors };
  },

  normalize(raw: RawRecord, ctx: NormalizeContext) {
    const ev = raw.payload as any;
    const venue = ev._embedded?.venues?.[0] ?? {};
    const start = ev.dates?.start ?? {};
    const end = ev.dates?.end ?? {};
    const local = (d: any) => (d?.localDate ? `${d.localDate}${d.localTime ? `T${String(d.localTime).slice(0, 5)}` : ''}` : null);
    const classes = ([] as any[]).concat(ev.classifications ?? []);
    const tags = classes.flatMap((x) => [x?.genre?.name, x?.subGenre?.name]).filter((n) => n && n !== 'Undefined' && n !== 'Other');
    const images = ([] as any[]).concat(ev.images ?? []).filter((i) => typeof i?.url === 'string');
    const image = images.filter((i) => i.ratio === '16_9').sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0] ?? images[0];
    const price = ([] as any[]).concat(ev.priceRanges ?? [])[0];
    return finalize({
      title: ev.name,
      description: ev.info ?? ev.description ?? null,
      // Ticketmaster gives the instant (UTC) and the local wall clock; the instant is exact.
      start: start.dateTime ?? local(start),
      end: end.dateTime ?? local(end),
      venueName: venue.name ?? null,
      address: [venue.address?.line1, venue.city?.name].filter(Boolean).join(', ') || null,
      area: venue.address?.line2 ?? null,
      cityTexts: [venue.city?.name, venue.state?.name],
      country: venue.country?.countryCode ?? null,
      lat: venue.location?.latitude != null ? Number(venue.location.latitude) : null,
      lng: venue.location?.longitude != null ? Number(venue.location.longitude) : null,
      lineup: ([] as any[]).concat(ev._embedded?.attractions ?? []).map((a) => a?.name).filter(Boolean),
      tags,
      schemaType: classes.some((x) => x?.segment?.name === 'Music') ? 'MusicEvent' : null,
      imageUrl: image?.url ?? null,
      ticketUrl: ev.url ?? null,
      eventUrl: ev.url ?? null,
      price: typeof price?.min === 'number' ? price.min : null,
      currency: price?.currency ?? null,
      cancelled: ev.dates?.status?.code === 'cancelled',
      organizerName: ev.promoter?.name ?? null,
    }, { now: ctx.now, fallbackCity: ctx.source.city, wallClock: ctx.source.config.wallClock === true });
  },
};
