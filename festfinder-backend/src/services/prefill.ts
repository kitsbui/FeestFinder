import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { CITY_SLUGS, GENRES, type City } from '../lib/i18n.ts';

/*
 * "Let AI fill it in": someone sending an event in pastes the link where they saw it, or a
 * photo of the poster, and the form fills itself. A page that carries schema.org Event data
 * (ticket sites do) is read directly, for free; anything else goes to Claude, which returns
 * the same fields and leaves out what it cannot see.
 */

export const PrefillSchema = z.object({
  title: z.string().nullable(),
  genre: z.enum(GENRES).nullable(),
  startsOn: z.string().nullable().describe('YYYY-MM-DD'),
  endsOn: z.string().nullable().describe('YYYY-MM-DD, the last day for a multi-day event'),
  startTime: z.string().nullable().describe('HH:MM, 24-hour, Vietnam time'),
  endTime: z.string().nullable().describe('HH:MM, 24-hour, Vietnam time'),
  venueName: z.string().nullable(),
  address: z.string().nullable(),
  area: z.string().nullable().describe('ward or district, as written'),
  city: z.enum(CITY_SLUGS).nullable(),
  entryMode: z.enum(['free', 'paid']).nullable(),
  priceFrom: z.number().int().nullable().describe('lowest ticket price in VND'),
  lineup: z.array(z.string()),
  description: z.string().nullable().describe('two or three plain sentences, in the language of the source'),
  ticketUrl: z.string().nullable(),
});
export type Prefill = z.infer<typeof PrefillSchema>;

export class PrefillUnavailable extends Error {
  readonly reason: 'disabled' | 'refused' | 'truncated' | 'unparseable' | 'upstream';
  constructor(reason: PrefillUnavailable['reason'], message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}

export interface PrefillInput {
  /** Today in Ho Chi Minh City, so "this Saturday" and a date without a year resolve. */
  today: string;
  sourceUrl?: string;
  text?: string;
  image?: { data: Buffer; mime: 'image/png' | 'image/jpeg' | 'image/webp' };
}

export interface PrefillGenerator {
  readonly model: string;
  extract(input: PrefillInput): Promise<Prefill>;
}

export const EMPTY_PREFILL: Prefill = {
  title: null, genre: null, startsOn: null, endsOn: null, startTime: null, endTime: null, venueName: null, address: null,
  area: null, city: null, entryMode: null, priceFrom: null, lineup: [], description: null, ticketUrl: null,
};

// ---- what is safe to put in the form -------------------------------------------------

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const clean = (s: string | null | undefined, max: number) => (s && s.trim() ? s.replace(/\s+/g, ' ').trim().slice(0, max) : null);

/** Drops anything malformed, whoever produced it: a date that is not a date stays empty. */
export function sanitizePrefill(p: Partial<Prefill>): Prefill {
  const url = clean(p.ticketUrl, 500);
  const description = p.description && p.description.trim() ? p.description.trim().slice(0, 1500) : null;
  return {
    title: clean(p.title, 120),
    genre: p.genre && (GENRES as readonly string[]).includes(p.genre) ? p.genre : null,
    startsOn: p.startsOn && DATE.test(p.startsOn) ? p.startsOn : null,
    endsOn: p.endsOn && DATE.test(p.endsOn) && (!p.startsOn || p.endsOn >= p.startsOn) ? p.endsOn : null,
    startTime: p.startTime && TIME.test(p.startTime) ? p.startTime : null,
    endTime: p.endTime && TIME.test(p.endTime) ? p.endTime : null,
    venueName: clean(p.venueName, 160),
    address: clean(p.address, 240),
    area: clean(p.area, 60),
    city: p.city && (CITY_SLUGS as readonly string[]).includes(p.city) ? p.city : null,
    entryMode: p.entryMode === 'free' || p.entryMode === 'paid' ? p.entryMode : null,
    priceFrom: typeof p.priceFrom === 'number' && Number.isFinite(p.priceFrom) && p.priceFrom >= 0 && p.priceFrom <= 100_000_000 ? Math.round(p.priceFrom) : null,
    lineup: (p.lineup ?? []).map((a) => clean(a, 100)).filter((a): a is string => !!a).slice(0, 40),
    description,
    ticketUrl: url && /^https?:\/\/\S+\.\S+/.test(url) ? url : null,
  };
}

/** Which of our cities an address is in, from the way Vietnamese and English write them. */
export function cityFrom(text: string | null | undefined): City | null {
  if (!text) return null;
  const t = text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
  if (/ha noi|hanoi/.test(t)) return 'ha-noi';
  if (/da nang|danang|hoi an/.test(t)) return 'da-nang';
  if (/nha trang|khanh hoa|cam ranh/.test(t)) return 'nha-trang';
  if (/ho chi minh|hcm|sai gon|saigon|thu duc/.test(t)) return 'ho-chi-minh';
  return null;
}

// ---- schema.org Event data, read directly ----------------------------------------------

const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** An instant as it reads on a wall clock in Ho Chi Minh City. */
function vnParts(iso: string): { date: string; time: string } | null {
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
  if (!m) return null;
  const zoned = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  if (!zoned || !m[2]) return { date: m[1], time: m[2] ? `${m[2]}:${m[3]}` : '' };
  const d = new Date(new Date(iso).getTime() + 7 * 3600_000);
  if (Number.isNaN(d.getTime())) return null;
  return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) };
}

function eventNodes(data: unknown): any[] {
  const out: any[] = [];
  const walk = (n: any) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    const type = ([] as string[]).concat(n['@type'] ?? []);
    if (type.some((t) => /Event$|^Festival$/.test(String(t)))) out.push(n);
    if (n['@graph']) walk(n['@graph']);
  };
  walk(data);
  return out;
}

/** The first schema.org Event a page declares, as form fields; null when there is none. */
export function prefillFromJsonLd(html: string, pageUrl?: string): Prefill | null {
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const ev = eventNodes(data)[0];
    if (!ev) continue;
    const start = ev.startDate ? vnParts(String(ev.startDate)) : null;
    const end = ev.endDate ? vnParts(String(ev.endDate)) : null;
    const loc = Array.isArray(ev.location) ? ev.location[0] : ev.location;
    const addr = loc && typeof loc.address === 'object' ? loc.address : null;
    const street = typeof loc?.address === 'string' ? loc.address : addr?.streetAddress ?? null;
    const offers = ([] as any[]).concat(ev.offers ?? []).flatMap((o) => (o?.['@type'] === 'AggregateOffer' ? [{ price: o.lowPrice }] : [o]));
    const prices = offers.map((o) => Number(o?.price)).filter((n) => Number.isFinite(n) && n >= 0);
    const performers = ([] as any[]).concat(ev.performer ?? []).map((p) => (typeof p === 'string' ? p : p?.name)).filter(Boolean);
    const free = ev.isAccessibleForFree === true || ev.isAccessibleForFree === 'true' || (prices.length > 0 && Math.max(...prices) === 0);
    const lowest = prices.filter((n) => n > 0);
    // Ticket sites put their own name in front of the event's.
    const title = String(ev.name ?? '').replace(/^\s*(ticketbox|ticketgo|vé)\s*[|:–-]\s*/i, '');
    const url = typeof ev.url === 'string' ? new URL(ev.url, pageUrl ?? 'https://example.invalid').toString() : pageUrl ?? null;
    return sanitizePrefill({
      title: decode(title),
      startsOn: start?.date ?? null, startTime: start?.time || null,
      endsOn: end && end.date !== start?.date ? end.date : null,
      endTime: end?.time || null,
      venueName: loc?.name ? decode(String(loc.name)) : null,
      address: street ? decode(String(street)) : null,
      // The street address wins over the locality: some ticket sites put the wrong city there.
      city: cityFrom(street) ?? cityFrom(addr?.addressLocality) ?? cityFrom(addr?.addressRegion),
      entryMode: free ? 'free' : lowest.length ? 'paid' : null,
      priceFrom: free ? 0 : lowest.length ? Math.min(...lowest) : null,
      lineup: performers.map((p: unknown) => decode(String(p))),
      description: ev.description ? decode(String(ev.description)).replace(/<[^>]+>/g, ' ') : null,
      ticketUrl: url && pageUrl && !/example\.invalid/.test(url) ? url : null,
    });
  }
  return null;
}

/** A page's readable text for the model: its title, preview tags and visible words, capped. */
export function pageText(html: string, max = 12_000): string {
  const meta = (name: string) => decode(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i').exec(html)?.[1] ?? '');
  const title = decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '').trim();
  const body = decode(html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t\f\v]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  return [`Title: ${title}`, `og:title: ${meta('og:title')}`, `og:description: ${meta('og:description')}`, `description: ${meta('description')}`, '', body]
    .join('\n').slice(0, max);
}

// ---- Claude, for posters and pages without structured data --------------------------------

const SYSTEM = [
  "You read event announcements for FeestFinder, a Vietnamese event-discovery site, and fill in the submission form.",
  'Only state what the announcement says or shows. Leave a field null when it is not there; never guess a date, a time or a price.',
  'Times are 24-hour Vietnam time. Prices are VND numbers (500k = 500000). City must be one of the four slugs, or null.',
  'Genre: EDM for electronic/techno/house/rave; Festival for multi-act festivals; Indie, Hip-Hop, Pop or Jazz for live music; Food or Culture otherwise.',
].join(' ');

export class ClaudePrefill implements PrefillGenerator {
  readonly model: string;
  private readonly client: Anthropic;

  constructor(model: string, client = new Anthropic()) {
    this.model = model;
    this.client = client;
  }

  async extract(input: PrefillInput): Promise<Prefill> {
    const lead = `Today in Ho Chi Minh City is ${input.today}. A date without a year is the next one on or after today.${input.sourceUrl ? ` Source: ${input.sourceUrl}` : ''}`;
    const content: Anthropic.Beta.BetaContentBlockParam[] = input.image
      ? [
        { type: 'image', source: { type: 'base64', media_type: input.image.mime, data: input.image.data.toString('base64') } },
        { type: 'text', text: `${lead}\nThis is the event's poster. Fill in the form from it.` },
      ]
      : [{ type: 'text', text: `${lead}\nThe page where the event was announced:\n\n${input.text ?? ''}` }];
    let response;
    try {
      response = await this.client.beta.messages.parse({
        model: this.model,
        max_tokens: 16000,
        // Reading fields off one page or poster: low effort keeps it quick and cheap.
        output_config: { effort: 'low', format: betaZodOutputFormat(PrefillSchema) },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM,
        messages: [{ role: 'user', content }],
      });
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) throw new PrefillUnavailable('upstream', 'rate limited');
      if (err instanceof Anthropic.APIError) throw new PrefillUnavailable('upstream', `anthropic ${err.status}: ${err.message}`);
      throw err;
    }
    if (response.stop_reason === 'refusal') throw new PrefillUnavailable('refused');
    if (response.stop_reason === 'max_tokens') throw new PrefillUnavailable('truncated');
    if (!response.parsed_output) throw new PrefillUnavailable('unparseable');
    return sanitizePrefill(response.parsed_output);
  }
}

/** When no Anthropic credentials are configured: pages with structured data still work. */
export class DisabledPrefill implements PrefillGenerator {
  readonly model = 'none';
  async extract(): Promise<Prefill> {
    throw new PrefillUnavailable('disabled');
  }
}
