import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { formatMoney } from '../lib/money.ts';
import { cityBySlug } from '../lib/places.ts';
import { llmsTxt } from '../services/seo/text.ts';

/*
 * FeestFinder for AI agents (growth plan card 6, decision D6): read only, no account, no session,
 * nothing of the person asking.
 *
 *   GET  /list.md?city=&time=&style=&type=&priceMax=&q=&lang=&cursor=   the list as Markdown
 *   POST /mcp                                                            Model Context Protocol, Streamable HTTP, stateless
 *
 * Both read through the public routes (/events, /events/:slug, /artists, /meta/discovery) with an
 * internal request, so an agent sees exactly what a signed-out visitor sees. Ticket links go
 * through /go?src=agent, so a click an agent sends is counted like any other.
 */

const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const LIMIT = 60; // requests a minute, per address
const TIMES = ['tonight', 'weekend', '7days', 'month', 'all'] as const;

const Search = z.object({
  city: z.string().max(60).optional(),
  time: z.enum(TIMES).optional(),
  style: z.string().max(60).optional(),
  type: z.string().max(30).optional(),
  q: z.string().optional().transform((s) => (s ? s.slice(0, 100) : s)),
  priceMax: z.coerce.number().min(0).max(1e12).optional(),
  cursor: z.string().max(200).optional(),
  lang: z.enum(['vi', 'en']).optional(),
});
type SearchInput = z.infer<typeof Search>;

interface Card {
  slug: string; title: string; startsOn: string | null; startTime: string | null; endTime: string | null; city: string; cityLabel: { en: string; vi: string } | string;
  venue: { name: string | null; area: string | null }; isFree: boolean; priceUnknown: boolean; priceFrom: number; currency: string; styles: string[]; eventType: string | null; origin: 'posted' | 'radar'; past: boolean;
}

class AgentError extends Error {
  readonly code: number;
  constructor(code: number, message: string) { super(message); this.code = code; }
}

export default async function agentRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const base = () => ctx.config.publicBaseUrl.replace(/\/$/, '');

  /** A public read, as a signed-out visitor would make it. */
  const read = async <T>(url: string, lang: 'vi' | 'en'): Promise<{ status: number; body: T }> => {
    const res = await app.inject({ method: 'GET', url, headers: { 'x-lang': lang } });
    return { status: res.statusCode, body: res.json() as T };
  };
  const track = (tool: string) => { void ctx.analytics.capture('agent_call', 'agent', { kind: tool }); };

  const searchEvents = async (s: SearchInput) => {
    const lang = s.lang ?? 'vi';
    const qs = new URLSearchParams({ time: s.time ?? 'all', upcoming: 'true', limit: '50' });
    for (const k of ['city', 'style', 'type', 'q', 'cursor'] as const) if (s[k]) qs.set(k, String(s[k]));
    const r = await read<{ items?: Card[]; nextCursor?: string | null; error?: { code: string; message: unknown } }>(`/events?${qs}`, lang);
    if (r.status >= 400) throw new AgentError(-32602, `Bad search: ${r.body.error?.code ?? r.status}`);
    // A price nobody gave is never "under" anything: only free nights and known prices pass priceMax.
    const items = (r.body.items ?? []).filter((e) => s.priceMax === undefined || e.isFree || (!e.priceUnknown && e.priceFrom <= s.priceMax));
    return { items, nextCursor: r.body.nextCursor ?? null, lang };
  };

  const labelOf = (l: Card['cityLabel'], lang: 'vi' | 'en') => (typeof l === 'string' ? l : l[lang] ?? l.en);
  const priceOf = (e: Card, lang: 'vi' | 'en') => e.isFree ? (lang === 'vi' ? 'Miễn phí' : 'Free')
    : e.priceUnknown ? (lang === 'vi' ? 'Chưa rõ giá' : 'Price not given')
    : `${lang === 'vi' ? 'từ' : 'from'} ${formatMoney(e.priceFrom, e.currency, lang)}`;
  const brief = (e: Card, lang: 'vi' | 'en') => ({
    slug: e.slug, title: e.title, date: e.startsOn, time: e.startTime ? `${e.startTime}${e.endTime ? '–' + e.endTime : ''}` : null,
    city: e.city, cityName: labelOf(e.cityLabel, lang), venue: e.venue.name, price: priceOf(e, lang), styles: e.styles, kind: e.eventType,
    origin: e.origin, page: `${base()}/e/${e.slug}`, markdown: `${base()}/e/${e.slug}.md`, tickets: e.isFree ? null : `${base()}/go/${e.slug}?src=agent`,
  });

  // ---- /list.md --------------------------------------------------------------------------------

  app.get('/list.md', { config: { rateLimit: { max: LIMIT, timeWindow: '1 minute' } } }, async (req, reply) => {
    const parsed = Search.safeParse(req.query);
    if (!parsed.success) return reply.code(400).type('text/markdown; charset=utf-8').send('# Bad request\n\nCheck the parameters: city, time, style, type, priceMax, q, lang, cursor.\n');
    const s = parsed.data;
    let out;
    try { out = await searchEvents(s); } catch (e) {
      return reply.code(400).type('text/markdown; charset=utf-8').send(`# Bad request\n\n${(e as Error).message}\n`);
    }
    track('list_md');
    const lang = out.lang;
    const city = s.city ? cityBySlug(s.city) : null;
    const title = lang === 'vi' ? `# Sự kiện EDM${city ? ' ở ' + city.name.vi : ''} · FeestFinder` : `# EDM events${city ? ' in ' + city.name.en : ''} · FeestFinder`;
    const md = (t: string) => t.replace(/([\\`*_[\]])/g, '\\$1');
    const lines = out.items.map((e) => {
      const b = brief(e, lang);
      const parts = [b.date, b.time, b.venue ? md(b.venue) : null, b.cityName, b.price, b.styles.join(', ') || null, e.origin === 'radar' ? 'Radar' : (lang === 'vi' ? 'Đã đăng' : 'Posted')].filter(Boolean);
      return `- [${md(b.title)}](${b.page}) · ${parts.join(' · ')} · [Markdown](${b.markdown})${b.tickets ? ` · [${lang === 'vi' ? 'Mua vé' : 'Tickets'}](${b.tickets})` : ''}`;
    });
    const next = out.nextCursor ? (() => { const q = new URLSearchParams(req.query as Record<string, string>); q.set('cursor', out.nextCursor!); return `\n[${lang === 'vi' ? 'Tiếp' : 'Next'}](${base()}/list.md?${q})\n`; })() : '';
    const body = [title, '', lines.length ? lines.join('\n') : (lang === 'vi' ? 'Không có sự kiện nào khớp.' : 'No events match.'), next].join('\n');
    return reply.type('text/markdown; charset=utf-8').header('x-robots-tag', 'noindex').header('cache-control', 'public, max-age=60').send(body + '\n');
  });

  // ---- /mcp --------------------------------------------------------------------------------------

  const TOOLS = [
    { name: 'search_events', description: 'Upcoming EDM events (club nights, raves, festivals) in Vietnam and Asia, filtered by city, time, music style, kind, price ceiling and text. Prices are whole units of the city\'s currency.',
      inputSchema: { type: 'object', properties: {
        city: { type: 'string', description: 'City slug from list_places, e.g. ho-chi-minh, ha-noi, bangkok' },
        time: { type: 'string', enum: [...TIMES] }, style: { type: 'string', description: 'Style key from list_styles, e.g. techno' },
        type: { type: 'string', description: 'club, festival, concert, rave, party, show or day' }, q: { type: 'string' },
        priceMax: { type: 'number', description: 'Highest price in the city\'s currency' }, cursor: { type: 'string' }, lang: { type: 'string', enum: ['vi', 'en'] },
      } } },
    { name: 'get_event', description: 'One event by its slug: date, venue, price, lineup, organiser, ticket link.',
      inputSchema: { type: 'object', properties: { slug: { type: 'string' }, lang: { type: 'string', enum: ['vi', 'en'] } }, required: ['slug'] } },
    { name: 'search_artists', description: 'DJs and artists listed on FeestFinder, by name, city or style.',
      inputSchema: { type: 'object', properties: { q: { type: 'string' }, city: { type: 'string' }, style: { type: 'string' } } } },
    { name: 'get_artist', description: 'One artist by slug, with upcoming shows.',
      inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] } },
    { name: 'list_places', description: 'The cities FeestFinder covers, with their country, timezone and currency.', inputSchema: { type: 'object', properties: {} } },
    { name: 'list_styles', description: 'The music styles events are filtered by.', inputSchema: { type: 'object', properties: {} } },
  ];

  const slugArg = z.object({ slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,159}$/), lang: z.enum(['vi', 'en']).optional() });

  const call = async (name: string, args: unknown): Promise<unknown> => {
    switch (name) {
      case 'search_events': {
        const s = Search.safeParse(args ?? {});
        if (!s.success) throw new AgentError(-32602, 'Invalid arguments for search_events');
        const out = await searchEvents(s.data);
        return { events: out.items.map((e) => brief(e, out.lang)), nextCursor: out.nextCursor };
      }
      case 'get_event': {
        const a = slugArg.safeParse(args ?? {});
        if (!a.success) throw new AgentError(-32602, 'get_event needs a slug');
        const lang = a.data.lang ?? 'vi';
        const r = await read<Card & { lineup?: string[]; organizer?: { name: string } | null; venue: Card['venue'] & { address?: string | null }; age?: string | null; soldOut?: boolean; description?: { vi?: string; en?: string } | null }>(`/events/${a.data.slug}`, lang);
        if (r.status !== 200) throw new AgentError(-32602, `No event "${a.data.slug}"`);
        const e = r.body;
        return {
          ...brief(e, lang), lineup: e.lineup ?? [], organiser: e.organizer?.name ?? null,
          address: e.venue?.address ?? null, age: e.age ?? null, soldOut: !!e.soldOut,
          description: e.description ? e.description[lang] || e.description.en || null : null,
        };
      }
      case 'search_artists': {
        const a = z.object({ q: z.string().max(80).optional(), city: z.string().max(60).optional(), style: z.string().max(60).optional() }).safeParse(args ?? {});
        if (!a.success) throw new AgentError(-32602, 'Invalid arguments for search_artists');
        const qs = new URLSearchParams();
        for (const k of ['q', 'city', 'style'] as const) if (a.data[k]) qs.set(k, a.data[k]!);
        const r = await read<{ items?: { slug: string; name: string; city?: string | null; styles?: string[] }[] }>(`/artists?${qs}`, 'vi');
        if (r.status !== 200) throw new AgentError(-32602, 'Bad artist search');
        return { artists: (r.body.items ?? []).slice(0, 50).map((x) => ({ slug: x.slug, name: x.name, city: x.city ?? null, styles: x.styles ?? [], page: `${base()}/a/${x.slug}` })) };
      }
      case 'get_artist': {
        const a = slugArg.safeParse(args ?? {});
        if (!a.success) throw new AgentError(-32602, 'get_artist needs a slug');
        type ArtistPage = { slug: string; name: string; city?: string | null; styles?: string[] };
        const r = await read<ArtistPage & { artist?: ArtistPage; upcoming?: Card[]; events?: Card[] }>(`/artists/${a.data.slug}`, 'vi');
        if (r.status !== 200) throw new AgentError(-32602, `No artist "${a.data.slug}"`);
        const x = r.body.artist ?? r.body;
        const upcoming = r.body.upcoming ?? r.body.events ?? [];
        return { slug: x.slug, name: x.name, city: x.city ?? null, styles: x.styles ?? [], page: `${base()}/a/${x.slug}`, upcoming: upcoming.slice(0, 20).map((e) => brief(e, 'vi')) };
      }
      case 'list_places': {
        const r = await read<{ cities?: { key?: string; slug?: string; label?: unknown; country?: string; currency?: string; timezone?: string }[] }>('/meta/discovery', 'en');
        return { cities: r.body.cities ?? [] };
      }
      case 'list_styles': {
        const r = await read<{ styles?: unknown[] }>('/meta/discovery', 'en');
        return { styles: r.body.styles ?? [] };
      }
      default: throw new AgentError(-32602, `Unknown tool: ${name}`);
    }
  };

  type Msg = { jsonrpc?: string; id?: string | number | null; method?: string; params?: { protocolVersion?: unknown; name?: unknown; arguments?: unknown; uri?: unknown } };
  const answer = async (m: Msg): Promise<object | null> => {
    const isNote = m.id === undefined || m.id === null;
    const ok = (result: unknown) => ({ jsonrpc: '2.0', id: m.id, result });
    const fail = (code: number, message: string) => ({ jsonrpc: '2.0', id: m.id ?? null, error: { code, message } });
    if (m.jsonrpc !== '2.0' || typeof m.method !== 'string') return fail(-32600, 'Invalid request');
    if (isNote) return null; // notifications/initialized and the like: nothing to answer
    try {
      switch (m.method) {
        case 'initialize': {
          const asked = typeof m.params?.protocolVersion === 'string' ? m.params.protocolVersion : '';
          return ok({
            protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
            capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
            serverInfo: { name: 'feestfinder', title: 'FeestFinder', version: '1.0.0' },
            instructions: 'EDM events in Vietnam and Asia. Read only. Link people to the event page; ticket links go through FeestFinder (/go) to the seller, FeestFinder sells no tickets.',
          });
        }
        case 'ping': return ok({});
        case 'tools/list': return ok({ tools: TOOLS });
        case 'tools/call': {
          const name = typeof m.params?.name === 'string' ? m.params.name : '';
          if (!TOOLS.some((t) => t.name === name)) return fail(-32602, `Unknown tool: ${name}`);
          track(name);
          try {
            const data = await call(name, m.params?.arguments);
            return ok({ content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data, isError: false });
          } catch (e) {
            if (e instanceof AgentError) return fail(e.code, e.message);
            throw e;
          }
        }
        case 'resources/list': return ok({ resources: [{ uri: 'feestfinder://llms.txt', name: 'llms.txt', title: 'What FeestFinder is and where its pages are', mimeType: 'text/markdown' }] });
        case 'resources/read': {
          if (m.params?.uri !== 'feestfinder://llms.txt') return fail(-32602, 'Unknown resource');
          return ok({ contents: [{ uri: 'feestfinder://llms.txt', mimeType: 'text/markdown', text: await llmsTxt(ctx) }] });
        }
        default: return fail(-32601, `Method not found: ${m.method}`);
      }
    } catch (e) {
      ctx.log(`mcp ${m.method} failed: ${(e as Error).message}`);
      return fail(-32603, 'Internal error');
    }
  };

  const rpc = async (req: FastifyRequest, reply: FastifyReply) => {
    reply.header('cache-control', 'no-store').header('x-robots-tag', 'noindex');
    const body = req.body as unknown;
    if (body === undefined || body === null || typeof body !== 'object') return reply.code(400).send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    const batch = Array.isArray(body);
    const msgs = (batch ? body : [body]) as Msg[];
    if (!msgs.length || msgs.length > 20) return reply.code(400).send({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid request' } });
    const out = (await Promise.all(msgs.map(answer))).filter((x): x is object => x !== null);
    if (!out.length) return reply.code(202).send();
    return reply.type('application/json').send(batch ? out : out[0]);
  };

  app.post('/mcp', { config: { rateLimit: { max: LIMIT, timeWindow: '1 minute' } } }, rpc);
  // Stateless: no stream to open and no session to end.
  app.route({ method: ['GET', 'DELETE'], url: '/mcp', handler: async (_req, reply) => reply.code(405).header('allow', 'POST').send({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Method not allowed: POST JSON-RPC to /mcp' } }) });
}
