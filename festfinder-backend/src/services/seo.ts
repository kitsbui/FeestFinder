import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { GENRES, type Lang, type Localized } from '../lib/i18n.ts';
import { slugify } from '../lib/contact.ts';
import { shortDate } from '../lib/format.ts';
import { presentTiers } from '../presenters/event.ts';
import { faqFor } from '../routes/discussion.ts';

/*
 * What search engines and AI assistants read. The screens draw themselves with JavaScript,
 * which most AI crawlers never run, so every event page also arrives with its facts as plain
 * HTML, its structured data and its link-preview tags already in place.
 */

const esc = (s: unknown) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Structured data goes in as a JSON data block, never as script the browser runs. */
const jsonLd = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const baseOf = (ctx: Ctx) => ctx.config.publicBaseUrl.replace(/\/$/, '');
const abs = (ctx: Ctx, url: string | null | undefined) => (url ? new URL(url, baseOf(ctx) + '/').href : null);

/** schema.org's closest type for each genre. */
const SCHEMA_TYPE: Record<string, string> = {
  EDM: 'MusicEvent', Festival: 'MusicEvent', Indie: 'MusicEvent', 'Hip-Hop': 'MusicEvent', Pop: 'MusicEvent', Jazz: 'MusicEvent',
  Food: 'FoodEvent', Culture: 'Festival',
};

const offset = (ts: Date | string | null) => {
  if (!ts) return undefined;
  // Vietnam time with its offset, the way the page states it.
  const d = new Date(new Date(ts).getTime() + 7 * 3600_000);
  return d.toISOString().replace(/\.\d{3}Z$/, '+07:00');
};

export interface EventPage {
  ev: any;
  org: any;
  tiers: ReturnType<typeof presentTiers> | null;
  faq: { question: string; answer: string }[];
  url: string;
}

/** The event as a page about it needs it, or null if it is not public. */
export async function loadEventPage(ctx: Ctx, slug: string): Promise<EventPage | null> {
  const ev = await one<any>(ctx.db,
    `select e.* from events e where e.slug = $1 and e.status in ('live', 'cancelled') and not e.held_for_reports and e.published_at is not null`, [slug]);
  if (!ev) return null;
  const [org, tierRows, faq] = await Promise.all([
    one<any>(ctx.db, 'select slug, name, website, verification_state from organizers where id = $1', [ev.organizer_id]),
    many<any>(ctx.db, 'select * from ticket_tiers where event_id = $1 order by sort, price', [ev.id]),
    faqFor(ctx.db, ev.id, 10),
  ]);
  return {
    ev, org, faq,
    tiers: ev.entry_mode === 'paid' && tierRows.length ? presentTiers(tierRows, ctx.clock.now()) : null,
    url: `${baseOf(ctx)}/e/${ev.slug}`,
  };
}

const whenLine = (ev: any, lang: Lang) => {
  const days = ev.starts_on === ev.ends_on || !ev.ends_on ? shortDate(ev.starts_on, lang) : `${shortDate(ev.starts_on, lang)} – ${shortDate(ev.ends_on, lang)}`;
  return `${days} · ${ev.start_time ?? ''}${ev.end_time ? `–${ev.end_time}` : ''}`;
};

const priceLine = (ev: any, lang: Lang) => (ev.entry_mode === 'free' || !ev.price_from
  ? (lang === 'vi' ? 'Vào cửa miễn phí' : 'Free entry')
  : `${lang === 'vi' ? 'Từ' : 'From'} ${Number(ev.price_from).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}₫`);

const text = (l: Localized | null | undefined, lang: Lang) => (l ? (l[lang] || l.vi || l.en || '').trim() : '');

export function eventJsonLd(ctx: Ctx, p: EventPage) {
  const { ev, org, tiers } = p;
  const cancelled = ev.status === 'cancelled';
  const offers = (tiers?.tiers ?? []).map((t) => ({
    '@type': 'Offer',
    name: t.name.vi || t.name.en,
    price: t.price,
    priceCurrency: 'VND',
    availability: t.state === 'soldout' ? 'https://schema.org/SoldOut' : t.state === 'soon' ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
    url: ev.ticket_url || p.url,
  }));
  return {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[ev.genre] ?? 'Event',
    name: ev.title,
    description: text(ev.description, 'vi') || undefined,
    startDate: offset(ev.starts_at) ?? `${ev.starts_on}T${ev.start_time ?? '00:00'}:00+07:00`,
    endDate: offset(ev.ends_at),
    eventStatus: cancelled ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: ev.cover_url ? [abs(ctx, ev.cover_url)] : undefined,
    url: p.url,
    inLanguage: 'vi',
    isAccessibleForFree: ev.entry_mode === 'free' || !ev.price_from,
    typicalAgeRange: ev.age === '18+' ? '18-' : ev.age === '16+' ? '16-' : undefined,
    location: {
      '@type': 'Place',
      name: ev.venue_name ?? undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: ev.address ?? undefined,
        addressLocality: ev.area ?? undefined,
        addressRegion: 'Hồ Chí Minh',
        addressCountry: 'VN',
      },
      geo: ev.lat !== null && ev.lng !== null ? { '@type': 'GeoCoordinates', latitude: ev.lat, longitude: ev.lng } : undefined,
    },
    organizer: org ? { '@type': 'Organization', name: org.name, url: `${baseOf(ctx)}/o/${org.slug}`, sameAs: org.website ? [org.website] : undefined } : undefined,
    performer: (ev.lineup ?? []).slice(0, 20).map((name: string) => ({ '@type': 'PerformingGroup', name })),
    offers: offers.length ? offers : ev.entry_mode === 'free'
      ? [{ '@type': 'Offer', price: 0, priceCurrency: 'VND', availability: 'https://schema.org/InStock', url: p.url }]
      : undefined,
    interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: ev.hype_count },
  };
}

/** The tags that go into <head>: title, description, canonical, link previews and structured data. */
export function eventHead(ctx: Ctx, p: EventPage, lang: Lang = 'vi'): { title: string; head: string } {
  const { ev } = p;
  const title = `${ev.title} · ${shortDate(ev.starts_on, lang)} · ${ev.venue_name ?? ''} | FeestFinder`;
  const description = [whenLine(ev, lang), [ev.venue_name, ev.area].filter(Boolean).join(', '), priceLine(ev, lang), text(ev.description, lang)]
    .filter(Boolean).join(' · ').slice(0, 300);
  const image = abs(ctx, ev.cover_url);
  const tags = [
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(p.url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="FeestFinder">`,
    `<meta property="og:locale" content="${lang === 'vi' ? 'vi_VN' : 'en_US'}">`,
    `<meta property="og:url" content="${esc(p.url)}">`,
    `<meta property="og:title" content="${esc(ev.title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    ...(image ? [`<meta property="og:image" content="${esc(image)}">`, `<meta property="og:image:width" content="1600">`, `<meta property="og:image:height" content="900">`] : []),
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${esc(ev.title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    jsonLd(eventJsonLd(ctx, p)),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'FeestFinder', item: `${baseOf(ctx)}/` },
        { '@type': 'ListItem', position: 2, name: 'TP.HCM', item: `${baseOf(ctx)}/vi/ho-chi-minh/this-weekend` },
        { '@type': 'ListItem', position: 3, name: ev.title, item: p.url },
      ],
    }),
    ...(p.faq.length ? [jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    })] : []),
    // Shown only until the screen takes over; crawlers that run no script read it as the page.
    `<style>.ff-ssr{max-width:880px;margin:0 auto;padding:72px 24px 96px;color:#e6e3c8;background:#0e100f;font:400 16px/1.6 'Be Vietnam Pro',system-ui,sans-serif}.ff-ssr h1{color:#fffce1;font-size:clamp(34px,6vw,64px);line-height:1;margin:0 0 14px}.ff-ssr h2{color:#fffce1;font-size:24px;margin:40px 0 12px}.ff-ssr a{color:#abff84}.ff-ssr .meta{color:#a5a493;font-size:14px}.ff-ssr dt{color:#fffce1;font-weight:600;margin-top:14px}.ff-ssr dd{margin:4px 0 0}</style>`,
  ];
  return { title, head: tags.join('\n') };
}

/** The page's facts as readable HTML: what search engines index and what a phone shows first. */
export function eventSsr(p: EventPage, lang: Lang = 'vi'): string {
  const { ev, org, tiers, faq } = p;
  const vi = lang === 'vi';
  const lineup = (ev.lineup ?? []) as string[];
  return [
    '<main class="ff-ssr"><article>',
    `<p class="meta">${esc([ev.genre, ev.status === 'cancelled' ? (vi ? 'Đã huỷ' : 'Cancelled') : null].filter(Boolean).join(' · '))}</p>`,
    `<h1>${esc(ev.title)}</h1>`,
    `<p><time datetime="${esc(offset(ev.starts_at) ?? ev.starts_on)}">${esc(whenLine(ev, lang))}</time></p>`,
    `<p>${esc([ev.venue_name, ev.address, ev.area].filter(Boolean).join(', '))}</p>`,
    `<p>${esc(priceLine(ev, lang))}</p>`,
    text(ev.description, lang) ? `<p>${esc(text(ev.description, lang))}</p>` : '',
    lineup.length ? `<h2>${vi ? 'Đội hình' : 'Lineup'}</h2><p>${esc(lineup.join(' · '))}</p>` : '',
    tiers?.tiers.length ? `<h2>${vi ? 'Vé' : 'Tickets'}</h2><ul>${tiers.tiers.map((t) => `<li>${esc(t.name[lang] || t.name.vi)} — ${t.price.toLocaleString(vi ? 'vi-VN' : 'en-US')}₫</li>`).join('')}</ul>` : '',
    faq.length ? `<h2>${vi ? 'Câu hỏi thường gặp' : 'Frequently asked'}</h2><dl>${faq.map((f) => `<dt>${esc(f.question)}</dt><dd>${esc(f.answer)}</dd>`).join('')}</dl>` : '',
    org ? `<p class="meta">${vi ? 'Tổ chức bởi' : 'Organised by'} <a href="/o/${esc(org.slug)}">${esc(org.name)}</a></p>` : '',
    '</article></main>',
  ].join('');
}

// ---- crawlers ----------------------------------------------------------------------------

/**
 * AI companies run two kinds of crawler. Search and answer crawlers (OAI-SearchBot,
 * ChatGPT-User, PerplexityBot, Claude-SearchBot…) fetch a page to answer someone and link
 * back to it: they follow the `*` rules, which let them read every public page. Training
 * crawlers copy pages into the data a future model learns from and send no visitors; they
 * are turned away unless ALLOW_AI_TRAINING is on. Blocking them changes nothing in Google
 * Search or its AI Overviews, which read pages as Googlebot.
 */
export const AI_TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'CCBot', 'Applebot-Extended', 'meta-externalagent', 'Bytespider', 'cohere-training-data-crawler'];

export function robotsTxt(ctx: Ctx): string {
  const privatePaths = ['/app', '/studio', '/console', '/ops', '/door', '/admin/', '/organizer/', '/internal/', '/me/', '/auth/', '/orders', '/resale/', '/payments/', '/checkout/'];
  const lines = ['User-agent: *', 'Allow: /', ...privatePaths.map((p) => `Disallow: ${p}`), ''];
  if (!ctx.config.allowAiTraining) {
    for (const bot of AI_TRAINING_BOTS) lines.push(`User-agent: ${bot}`);
    lines.push('Disallow: /', '');
  }
  lines.push(`Sitemap: ${baseOf(ctx)}/sitemap.xml`, '');
  return lines.join('\n');
}

export async function sitemapXml(ctx: Ctx): Promise<string> {
  const now = ctx.clock.now();
  const [events, orgs] = await Promise.all([
    many<any>(ctx.db,
      `select slug, updated_at from events where status = 'live' and not held_for_reports and ends_at >= $1 order by starts_at limit 5000`, [now]),
    many<any>(ctx.db,
      `select o.slug, max(e.updated_at) as updated_at from organizers o join events e on e.organizer_id = o.id
        where e.status = 'live' and not e.held_for_reports and e.ends_at >= $1 group by o.slug`, [now]),
  ]);
  const base = baseOf(ctx);
  const day = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : now.toISOString().slice(0, 10));
  const landing = ['this-weekend', 'free/this-weekend', ...GENRES.map((g) => slugify(g))];
  const urls: { loc: string; lastmod?: string; priority: string }[] = [
    { loc: `${base}/`, lastmod: day(now), priority: '1.0' },
    ...landing.flatMap((l) => ['vi', 'en'].map((lang) => ({ loc: `${base}/${lang}/ho-chi-minh/${l}`, lastmod: day(now), priority: '0.8' }))),
    ...events.map((e) => ({ loc: `${base}/e/${e.slug}`, lastmod: day(e.updated_at), priority: '0.9' })),
    ...orgs.map((o) => ({ loc: `${base}/o/${o.slug}`, lastmod: day(o.updated_at), priority: '0.5' })),
    { loc: `${base}/about`, priority: '0.3' },
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')
    + '\n</urlset>\n';
}

// ---- IndexNow ----------------------------------------------------------------------------

/** Notes an event page to announce. A no-op without INDEXNOW_KEY. */
export async function queueIndexNow(q: Queryable, ctx: Ctx, slug: string) {
  if (!ctx.config.indexNowKey) return;
  await q.query(`insert into indexnow_queue (url, queued_at) values ($1, $2) on conflict (url) do update set queued_at = excluded.queued_at`,
    [`${baseOf(ctx)}/e/${slug}`, ctx.clock.now()]);
}

/** Announces queued pages in one batch. Bing shares IndexNow submissions with Yandex, Naver and Seznam. */
export async function pingIndexNow(ctx: Ctx, send: typeof fetch = fetch): Promise<number> {
  const key = ctx.config.indexNowKey;
  if (!key) return 0;
  const rows = await many<{ url: string }>(ctx.db, 'select url from indexnow_queue order by queued_at limit 1000');
  if (!rows.length) return 0;
  const base = baseOf(ctx);
  const res = await send('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(base).host, key, keyLocation: `${base}/${key}.txt`, urlList: rows.map((r) => r.url) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok && res.status !== 202) throw new Error(`IndexNow answered ${res.status}`);
  await ctx.db.query('delete from indexnow_queue where url = any($1::text[])', [rows.map((r) => r.url)]);
  return rows.length;
}
