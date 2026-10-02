import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { CITIES, type City, type Lang, type Localized } from '../lib/i18n.ts';
import { presentTiers } from '../presenters/event.ts';
import { loadTimetable } from '../presenters/timetable.ts';
import { faqFor } from '../routes/discussion.ts';
import { latestUpdates } from '../routes/night.ts';
import { OG_HEIGHT, OG_WIDTH, toneOf } from './ogimage.ts';

/*
 * What search engines and AI assistants read on an event page. The screens draw themselves
 * with JavaScript, which most AI crawlers never run, so each event page also arrives with
 * its facts as plain HTML (an answer first, then the details), one block of structured
 * data, and its link-preview tags. Both fronts build the page from the same EventSeo:
 * the API's own pages through buildEventSeo, the Next.js app through GET /seo/events/:slug.
 */

const esc = (s: unknown) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Structured data goes in as a JSON data block, never as script the browser runs. */
export const jsonLdHtml = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

const baseOf = (ctx: Ctx) => ctx.config.publicBaseUrl.replace(/\/$/, '');
const abs = (ctx: Ctx, url: string | null | undefined) => (url ? new URL(url, baseOf(ctx) + '/').href : null);

/** schema.org's closest type for each genre. */
const SCHEMA_TYPE: Record<string, string> = {
  EDM: 'MusicEvent', Festival: 'Festival', Indie: 'MusicEvent', 'Hip-Hop': 'MusicEvent', Pop: 'MusicEvent', Jazz: 'MusicEvent',
  Food: 'FoodEvent', Culture: 'Festival',
};

/** Where each city sits in a Vietnamese postal address. */
const ADDRESS: Record<City, { locality: string; region: string }> = {
  'ho-chi-minh': { locality: 'Thành phố Hồ Chí Minh', region: 'Thành phố Hồ Chí Minh' },
  'ha-noi': { locality: 'Hà Nội', region: 'Hà Nội' },
  'da-nang': { locality: 'Đà Nẵng', region: 'Đà Nẵng' },
  'nha-trang': { locality: 'Nha Trang', region: 'Khánh Hòa' },
};

const WEEKDAY = {
  vi: ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const T = {
  facts: { vi: 'Thông tin chính', en: 'Key facts' }, about: { vi: 'Giới thiệu', en: 'About' }, lineup: { vi: 'Đội hình', en: 'Lineup' },
  timetable: { vi: 'Lịch diễn', en: 'Set times' }, tickets: { vi: 'Vé', en: 'Tickets' }, updates: { vi: 'Tin từ BTC', en: 'From the organiser' },
  faq: { vi: 'Câu hỏi thường gặp', en: 'Frequently asked' }, editions: { vi: 'Các mùa khác', en: 'Other editions' },
  related: { vi: 'Sự kiện liên quan', en: 'Related events' }, updated: { vi: 'Cập nhật', en: 'Updated' },
  when: { vi: 'Thời gian', en: 'When' }, venue: { vi: 'Địa điểm', en: 'Venue' }, address: { vi: 'Địa chỉ', en: 'Address' },
  price: { vi: 'Giá vé', en: 'Price' }, status: { vi: 'Tình trạng', en: 'Status' }, age: { vi: 'Độ tuổi', en: 'Age' },
  genre: { vi: 'Thể loại', en: 'Genre' }, organiser: { vi: 'Ban tổ chức', en: 'Organiser' }, buy: { vi: 'Mua vé', en: 'Tickets' },
  site: { vi: 'Trang chính thức', en: 'Official site' }, free: { vi: 'Miễn phí', en: 'Free' }, from: { vi: 'Từ', en: 'From' },
  donation: { vi: 'Tuỳ tâm', en: 'Pay what you like' }, allAges: { vi: 'Mọi lứa tuổi', en: 'All ages' },
  onSale: { vi: 'Còn vé', en: 'On sale' }, low: { vi: 'Sắp hết vé', en: 'Few tickets left' }, soldOut: { vi: 'Hết vé', en: 'Sold out' },
  soon: { vi: 'Sắp mở bán', en: 'On sale soon' }, cancelled: { vi: 'Đã huỷ', en: 'Cancelled' }, past: { vi: 'Đã diễn ra', en: 'Took place' },
  nextDay: { vi: 'hôm sau', en: 'next day' }, previous: { vi: 'Mùa trước', en: 'Previous edition' }, next: { vi: 'Mùa tiếp theo', en: 'Next edition' },
  eventsIn: { vi: 'Sự kiện ở', en: 'Events in' }, otherLang: { vi: 'English', en: 'Tiếng Việt' },
  upcoming: { vi: 'Sự kiện sắp diễn ra', en: 'Upcoming events' }, pastEvents: { vi: 'Đã tổ chức', en: 'Past events' },
  type: { vi: 'Loại', en: 'Type' }, cities: { vi: 'Thành phố', en: 'Cities' }, genres: { vi: 'Thể loại', en: 'Genres' },
  since: { vi: 'Hoạt động từ', en: 'Active since' }, followers: { vi: 'Người theo dõi', en: 'Followers' },
  verified: { vi: 'Xác minh', en: 'Verified' }, yes: { vi: 'Đã xác minh với FeestFinder', en: 'Verified by FeestFinder' },
  no: { vi: 'Chưa xác minh', en: 'Not verified yet' }, source: { vi: 'Nguồn', en: 'Source' }, verifiedShort: { vi: 'Đã xác minh', en: 'Verified' },
};
const ORG_TYPE: Record<string, Localized> = {
  promoter: { vi: 'đơn vị tổ chức sự kiện', en: 'event promoter' }, venue: { vi: 'địa điểm tổ chức', en: 'venue' },
  company: { vi: 'công ty', en: 'company' }, agency: { vi: 'agency', en: 'agency' }, public: { vi: 'đơn vị công', en: 'public body' },
};
type Key = keyof typeof T;
const t = (k: Key, lang: Lang) => T[k][lang];

/** "Thứ Bảy, 19/9/2026" / "Saturday 19 September 2026" */
function longDate(date: string, lang: Lang) {
  const [y, m, d] = date.split('-').map(Number);
  const wd = WEEKDAY[lang][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return lang === 'vi' ? `${wd}, ${d}/${m}/${y}` : `${wd} ${d} ${MONTH_EN[m - 1]} ${y}`;
}
const shortDay = (date: string, lang: Lang) => {
  const [, m, d] = date.split('-').map(Number);
  return lang === 'vi' ? `${d}/${m}` : `${d} ${MONTH_EN[m - 1].slice(0, 3)}`;
};
const money = (n: number, lang: Lang) => `${Number(n).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}₫`;
const text = (l: Localized | null | undefined, lang: Lang) => (l ? (l[lang] || l.vi || l.en || '').trim() : '');
const hostOf = (u: string) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };
const vnTime = (ts: Date | string) => new Date(new Date(ts).getTime() + 7 * 3600_000).toISOString().slice(11, 16);
const vnIso = (ts: Date | string | null | undefined) =>
  (ts ? new Date(new Date(ts).getTime() + 7 * 3600_000).toISOString().replace(/\.\d{3}Z$/, '+07:00') : undefined);
/** Cut at a word, under the length search results show. */
const clip = (s: string, max: number) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,.;:·–-]\s*$/, '') + '…');

function whenLine(ev: any, lang: Lang) {
  const days = ev.ends_on && ev.ends_on !== ev.starts_on ? `${longDate(ev.starts_on, lang)} – ${longDate(ev.ends_on, lang)}` : longDate(ev.starts_on, lang);
  if (!ev.start_time) return days;
  const overnight = ev.end_time && ev.end_time < ev.start_time;
  return `${days} · ${ev.start_time}${ev.end_time ? ` – ${ev.end_time}${overnight ? ` (${t('nextDay', lang)})` : ''}` : ''}`;
}

function priceLine(ev: any, lang: Lang) {
  if (ev.entry_mode === 'donation') return t('donation', lang);
  if (ev.entry_mode === 'free' || !ev.price_from) return t('free', lang);
  return `${t('from', lang)} ${money(ev.price_from, lang)}`;
}

type Fact = { label: string; value: string; href?: string; datetime?: string };
type Link = { title: string; path: string; line: string };

/** What every public page says to search engines and AI assistants: its head, its graph, its facts. */
export interface PageSeo {
  kind: 'event' | 'organizer';
  lang: Lang;
  url: string;
  canonical: string;
  alternates: { vi: string; en: string; 'x-default': string };
  /** The same page as Markdown, for AI agents that fetch text. */
  markdown: string;
  title: string;
  description: string;
  robots: string;
  image: { url: string; width: number; height: number; alt: string; type: string };
  publishedAt: string | null;
  updatedAt: string;
  page: {
    crumbs: { name: string; path: string }[];
    kicker: string;
    h1: string;
    summary: string;
    facts: Fact[];
    about: string;
    otherLang: { label: string; path: string };
  };
  /** One schema.org graph: the site, the page, what it is about, its breadcrumbs. */
  jsonLd: { '@context': string; '@graph': unknown[] };
}

export interface EventSeo extends PageSeo {
  kind: 'event';
  headings: Record<'facts' | 'about' | 'lineup' | 'timetable' | 'tickets' | 'updates' | 'faq' | 'editions' | 'related' | 'updated', string>;
  page: PageSeo['page'] & {
    lineup: string[];
    timetable: { day: string; sets: { time: string; artist: string; stage: string }[] }[];
    tickets: { name: string; price: string; state: string }[];
    updates: { kind: string; body: string; at: string; atLabel: string }[];
    faq: { question: string; answer: string }[];
    editions: (Link & { label: string })[];
    related: Link[];
  };
}

export interface OrganizerSeo extends PageSeo {
  kind: 'organizer';
  headings: Record<'facts' | 'about' | 'upcoming' | 'past' | 'updated', string>;
  page: PageSeo['page'] & { upcoming: Link[]; past: Link[] };
}

const ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

/** FeestFinder itself, at the top of every page's graph. */
const siteNodes = (base: string) => [
  { '@type': 'Organization', '@id': `${base}/#organization`, name: 'FeestFinder', url: `${base}/`, logo: { '@type': 'ImageObject', url: `${base}/ui/assets/apple-touch-icon.png`, width: 180, height: 180 } },
  { '@type': 'WebSite', '@id': `${base}/#website`, url: `${base}/`, name: 'FeestFinder', inLanguage: ['vi', 'en'], publisher: { '@id': `${base}/#organization` } },
];

const crumbList = (base: string, id: string, crumbs: { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList', '@id': id,
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: base + c.path })),
});

/** A link to another page on the site, in this page's language. */
const inLang = (path: string, lang: Lang) => (lang === 'vi' ? path : `${path}${path.includes('?') ? '&' : '?'}lang=en`);

/** "19/9 20:00 · SECC, TP.HCM · Từ 1.200.000₫": one line about an event in a list. */
const eventLine = (r: any, lang: Lang) => [shortDay(r.starts_on, lang) + (r.start_time ? ` ${r.start_time}` : ''),
  [r.venue_name, text(CITIES[(r.city ?? 'ho-chi-minh') as City], lang)].filter(Boolean).join(', '), priceLine(r, lang)].join(' · ');

/** Everything an event page says to search engines and AI assistants, or null if it is not public. */
export async function buildEventSeo(ctx: Ctx, slug: string, lang: Lang = 'vi'): Promise<EventSeo | null> {
  const ev = await one<any>(ctx.db,
    `select e.* from events e where e.slug = $1 and e.status in ('live', 'cancelled') and not e.held_for_reports and e.published_at is not null`, [slug]);
  if (!ev) return null;
  const now = ctx.clock.now();
  const relatedSql = `select e.slug, e.title, e.genre, e.starts_on, e.ends_on, e.start_time, e.end_time, e.venue_name, e.area, e.city, e.entry_mode, e.price_from
      from events e where e.status = 'live' and not e.held_for_reports and e.published_at is not null`;
  const [org, tierRows, faq, updates, timetable, related, nextEdition, prevEdition] = await Promise.all([
    one<any>(ctx.db, 'select slug, name, website from organizers where id = $1', [ev.organizer_id]),
    many<any>(ctx.db, 'select * from ticket_tiers where event_id = $1 order by sort, price', [ev.id]),
    faqFor(ctx.db, ev.id, 10),
    latestUpdates(ctx.db, ev.id, 5),
    loadTimetable(ctx.db, ev),
    // What else is on: the same city first, then the same genre, venue or organiser.
    many<any>(ctx.db,
      `${relatedSql} and e.id <> $1 and e.ends_at >= $2
        order by (case when e.city = $3 then 4 else 0 end) + (case when e.genre = $4 then 2 else 0 end)
               + (case when e.venue_name = $5 or e.organizer_id = $6 then 1 else 0 end) desc, e.starts_at
        limit 6`, [ev.id, now, ev.city, ev.genre, ev.venue_name, ev.organizer_id]),
    one<any>(ctx.db, `${relatedSql} and e.previous_edition_id = $1 order by e.starts_at limit 1`, [ev.id]),
    ev.previous_edition_id ? one<any>(ctx.db, `${relatedSql} and e.id = $1`, [ev.previous_edition_id]) : null,
  ]);
  const tiers = ev.entry_mode === 'paid' && tierRows.length ? presentTiers(tierRows, now).tiers : [];

  const base = baseOf(ctx);
  const path = `/e/${ev.slug}`;
  const alternates = { vi: `${base}${path}`, en: `${base}${path}?lang=en`, 'x-default': `${base}${path}` };
  const url = alternates[lang];
  const city = (ev.city ?? 'ho-chi-minh') as City;
  const cityName = text(CITIES[city], lang);
  const cityFull = ADDRESS[city] ?? ADDRESS['ho-chi-minh'];
  const cancelled = ev.status === 'cancelled';
  const past = !cancelled && ev.ends_at && new Date(ev.ends_at) < now;
  const soldOut = !!ev.sold_out || (tiers.length > 0 && tiers.every((x) => x.state === 'soldout'));
  const low = !soldOut && (ev.badge === 'low_tickets' || tiers.some((x) => x.state === 'last'));
  const soon = !soldOut && tiers.length > 0 && tiers.every((x) => x.state === 'soon' || x.state === 'soldout');
  const statusLabel = t(cancelled ? 'cancelled' : past ? 'past' : soldOut ? 'soldOut' : low ? 'low' : soon ? 'soon' : 'onSale', lang);
  const lineup = ((ev.lineup ?? []) as string[]).filter(Boolean);
  const about = text(ev.description, lang);
  const venueLine = [ev.venue_name, ev.area, cityName].filter(Boolean).join(', ');
  const street = [ev.address, ev.address && ev.area && ev.address.includes(ev.area) ? null : ev.area].filter(Boolean).join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.lat != null && ev.lng != null ? `${ev.lat},${ev.lng}` : [ev.venue_name, ev.address, ev.area, cityName].filter(Boolean).join(', '))}`;
  const ageLabel = ev.age === 'All ages' ? t('allAges', lang) : ev.age;
  const startIso = vnIso(ev.starts_at) ?? `${ev.starts_on}T${ev.start_time ?? '00:00'}:00+07:00`;
  const updatedAt = [ev.updated_at, ...updates.map((u) => u.createdAt)].map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime())[0];
  const vi = lang === 'vi';

  // The answer first: what, when, where, how much, who. Facts only, the way an assistant would quote it.
  const summary = [
    cancelled
      ? (vi ? `${ev.title} đã bị huỷ.` : `${ev.title} has been cancelled.`)
      : vi
        ? `${ev.title} là sự kiện ${ev.genre ?? ''} ${past ? 'đã diễn ra' : 'diễn ra'} vào ${whenLine(ev, lang).replace(' · ', ', từ ')} tại ${[ev.venue_name, street, cityName].filter(Boolean).join(', ')}.`.replace(/\s+/g, ' ')
        : `${ev.title} is ${/^[aeiou]/i.test(ev.genre ?? '') ? 'an' : 'a'} ${ev.genre ?? ''} event ${past ? 'that took place' : 'taking place'} on ${whenLine(ev, lang).replace(' · ', ', ')} at ${[ev.venue_name, street, cityName].filter(Boolean).join(', ')}.`.replace(/\s+/g, ' '),
    ev.entry_mode === 'paid' && ev.price_from
      ? (vi ? `Vé từ ${money(ev.price_from, lang)}${tiers.length > 1 ? ` (${tiers.length} hạng vé)` : ''}, ${statusLabel.toLowerCase()}.` : `Tickets from ${money(ev.price_from, lang)}${tiers.length > 1 ? ` (${tiers.length} tiers)` : ''}, ${statusLabel.toLowerCase()}.`)
      : ev.entry_mode === 'donation' ? (vi ? 'Vào cửa tuỳ tâm.' : 'Pay what you like.') : (vi ? 'Vào cửa miễn phí.' : 'Free entry.'),
    ev.age !== 'All ages' ? (vi ? `Dành cho khách ${ev.age}.` : `Ages ${ev.age}.`) : '',
    lineup.length ? `${vi ? 'Đội hình' : 'Lineup'}: ${lineup.slice(0, 8).join(', ')}${lineup.length > 8 ? '…' : ''}.` : '',
    org ? (vi ? `Tổ chức bởi ${org.name}.` : `Organised by ${org.name}.`) : '',
  ].filter(Boolean).join(' ');

  const description = clip([
    `${ev.title}: ${[ev.genre, whenLine(ev, lang)].filter(Boolean).join(', ')}`,
    venueLine,
    cancelled ? statusLabel : priceLine(ev, lang),
    lineup.length ? `${vi ? 'Đội hình' : 'Lineup'}: ${lineup.slice(0, 4).join(', ')}` : '',
  ].filter(Boolean).join('. ') + '.', 160);
  // The longest title that still fits a search result: the venue's short name, then without it.
  const venueShort = String(ev.venue_name ?? '').split(/\s[—–-]\s/)[0];
  const title = [
    `${ev.title} – ${shortDay(ev.starts_on, lang)} · ${[venueShort, cityName].filter(Boolean).join(', ')}`,
    `${ev.title} – ${shortDay(ev.starts_on, lang)} · ${cityName}`,
    ev.title,
  ].find((x) => x.length <= 62) ?? clip(ev.title, 62);
  const fullTitle = `${title} | FeestFinder`;

  const image = ev.cover_url
    ? { url: abs(ctx, ev.cover_url)!, width: 1600, height: 900, type: 'image/jpeg' }
    : { url: `${base}/og/v1/${toneOf(ev.genre)}.png`, width: OG_WIDTH, height: OG_HEIGHT, type: 'image/png' };
  const imageAlt = `${ev.title} · ${venueLine}`;

  const listPath = `/list?city=${city}`;
  const crumbs = [
    { name: 'FeestFinder', path: inLang('/', lang) },
    { name: `${t('eventsIn', lang)} ${cityName}`, path: inLang(listPath, lang) },
    ...(ev.genre ? [{ name: ev.genre, path: inLang(`${listPath}&genre=${encodeURIComponent(ev.genre)}`, lang) }] : []),
    { name: ev.title, path: inLang(path, lang) },
  ];

  const facts: EventSeo['page']['facts'] = [
    { label: t('when', lang), value: whenLine(ev, lang), datetime: startIso },
    { label: t('venue', lang), value: ev.venue_name ?? '', href: mapsUrl },
    { label: t('address', lang), value: [street, cityName].filter(Boolean).join(', ') },
    { label: t('price', lang), value: priceLine(ev, lang) },
    { label: t('status', lang), value: statusLabel },
    { label: t('age', lang), value: ageLabel },
    ...(ev.genre ? [{ label: t('genre', lang), value: ev.genre }] : []),
    ...(lineup.length ? [{ label: t('lineup', lang), value: lineup.join(', ') }] : []),
    ...(org ? [{ label: t('organiser', lang), value: org.name, href: inLang(`/o/${org.slug}`, lang) }] : []),
    ...(ev.ticket_url ? [{ label: t('buy', lang), value: hostOf(ev.ticket_url), href: ev.ticket_url }] : []),
    ...(ev.event_url ? [{ label: t('site', lang), value: hostOf(ev.event_url), href: ev.event_url }] : []),
  ].filter((f) => f.value);

  const tierState = (s: string) => t(s === 'soldout' ? 'soldOut' : s === 'last' ? 'low' : s === 'soon' ? 'soon' : 'onSale', lang);
  const line = (r: any) => eventLine(r, lang);

  const page: EventSeo['page'] = {
    crumbs,
    kicker: [ev.genre, cityName, statusLabel].filter(Boolean).join(' · '),
    h1: ev.title,
    summary,
    facts,
    about,
    lineup,
    timetable: (timetable?.days ?? []).map((d) => ({
      day: longDate(d.date, lang),
      sets: d.stages.flatMap((st) => st.sets.map((x) => ({ time: vnTime(x.startsAt), artist: x.artist, stage: text(st.name, lang), at: new Date(x.startsAt).getTime() })))
        .sort((a, b) => a.at - b.at).map(({ time, artist, stage }) => ({ time, artist, stage })),
    })),
    tickets: tiers.map((x) => ({ name: text(x.name, lang), price: money(x.price, lang), state: tierState(x.state) })),
    updates: updates.map((u) => ({ kind: text(u.kindLabel, lang), body: u.body, at: vnIso(u.createdAt)!, atLabel: `${vnTime(u.createdAt)} ${shortDay(vnIso(u.createdAt)!.slice(0, 10), lang)}` })),
    faq: faq.map((f) => ({ question: f.question, answer: f.answer })),
    editions: [
      ...(prevEdition ? [{ label: t('previous', lang), title: prevEdition.title, path: inLang(`/e/${prevEdition.slug}`, lang), line: line(prevEdition) }] : []),
      ...(nextEdition ? [{ label: t('next', lang), title: nextEdition.title, path: inLang(`/e/${nextEdition.slug}`, lang), line: line(nextEdition) }] : []),
    ],
    related: related.map((r) => ({ title: r.title, path: inLang(`/e/${r.slug}`, lang), line: line(r) })),
    otherLang: { label: t('otherLang', lang), path: vi ? `${path}?lang=en` : path },
  };

  // ---- structured data ----
  const offers = tiers.map((x) => ({
    '@type': 'Offer',
    name: text(x.name, 'vi'),
    price: x.price,
    priceCurrency: 'VND',
    availability: x.state === 'soldout' ? 'https://schema.org/SoldOut' : x.state === 'soon' ? 'https://schema.org/PreOrder'
      : x.state === 'last' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
    url: ev.ticket_url || url,
    validFrom: vnIso(ev.published_at),
  }));
  const prices = tiers.map((x) => x.price);
  const ids = { site: `${base}/#website`, page: url, event: `${url}#event`, crumbs: `${url}#breadcrumb`, faq: `${url}#faq` };
  const event = {
    '@type': SCHEMA_TYPE[ev.genre] ?? 'Event',
    '@id': ids.event,
    name: ev.title,
    description: about || summary,
    url,
    mainEntityOfPage: { '@id': ids.page },
    image: [image.url],
    startDate: startIso,
    endDate: vnIso(ev.ends_at),
    eventStatus: cancelled ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    inLanguage: lang,
    isAccessibleForFree: ev.entry_mode !== 'paid' || !ev.price_from,
    typicalAgeRange: ev.age === '18+' ? '18-' : ev.age === '16+' ? '16-' : undefined,
    maximumAttendeeCapacity: ev.capacity ?? undefined,
    location: {
      '@type': 'Place',
      name: ev.venue_name ?? undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: street || undefined,
        addressLocality: cityFull.locality,
        addressRegion: cityFull.region,
        addressCountry: 'VN',
      },
      geo: ev.lat != null && ev.lng != null ? { '@type': 'GeoCoordinates', latitude: ev.lat, longitude: ev.lng } : undefined,
      hasMap: mapsUrl,
    },
    organizer: org ? { '@type': 'Organization', name: org.name, url: base + inLang(`/o/${org.slug}`, lang), sameAs: org.website ? [org.website] : undefined } : undefined,
    performer: lineup.length ? lineup.slice(0, 30).map((name) => ({ '@type': 'PerformingGroup', name })) : undefined,
    offers: offers.length > 1
      ? { '@type': 'AggregateOffer', priceCurrency: 'VND', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: offers.length, offers, url: ev.ticket_url || url,
          availability: soldOut ? 'https://schema.org/SoldOut' : low ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock' }
      : offers.length ? offers[0]
      : ev.entry_mode !== 'paid' || !ev.price_from
        ? { '@type': 'Offer', price: 0, priceCurrency: 'VND', availability: 'https://schema.org/InStock', url }
        : { '@type': 'Offer', price: ev.price_from, priceCurrency: 'VND', availability: soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', url: ev.ticket_url || url },
    interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: ev.hype_count },
  };
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'WebPage', '@id': ids.page, url, name: fullTitle, description, inLanguage: lang,
      isPartOf: { '@id': ids.site }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.event },
      primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height },
      datePublished: vnIso(ev.published_at), dateModified: vnIso(updatedAt),
    },
    event,
    crumbList(base, ids.crumbs, crumbs),
    // Only the organiser's own answers: they are shown on the page as its FAQ.
    ...(faq.length ? [{
      '@type': 'FAQPage', '@id': ids.faq, isPartOf: { '@id': ids.page },
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    }] : []),
  ];

  return {
    kind: 'event', lang, url, canonical: url, alternates, markdown: `${path}.md${vi ? '' : '?lang=en'}`, title: fullTitle, description,
    robots: ROBOTS,
    image: { ...image, alt: imageAlt },
    publishedAt: vnIso(ev.published_at) ?? null,
    updatedAt: vnIso(updatedAt)!,
    headings: Object.fromEntries((['facts', 'about', 'lineup', 'timetable', 'tickets', 'updates', 'faq', 'editions', 'related', 'updated'] as const).map((k) => [k, t(k, lang)])) as EventSeo['headings'],
    page,
    jsonLd: { '@context': 'https://schema.org', '@graph': JSON.parse(JSON.stringify(graph)) },
  };
}

/** The tags that go into <head>: title, description, robots, canonical and language versions, link previews, structured data. */
export function seoHead(seo: PageSeo): { title: string; head: string } {
  const tags = [
    `<meta name="description" content="${esc(seo.description)}">`,
    `<meta name="robots" content="${esc(seo.robots)}">`,
    `<link rel="canonical" href="${esc(seo.canonical)}">`,
    ...(['vi', 'en', 'x-default'] as const).map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(seo.alternates[l])}">`),
    `<link rel="alternate" type="text/markdown" href="${esc(seo.markdown)}">`,
    `<meta property="og:type" content="${seo.kind === 'organizer' ? 'profile' : 'website'}">`,
    `<meta property="og:site_name" content="FeestFinder">`,
    `<meta property="og:locale" content="${seo.lang === 'vi' ? 'vi_VN' : 'en_US'}">`,
    `<meta property="og:locale:alternate" content="${seo.lang === 'vi' ? 'en_US' : 'vi_VN'}">`,
    `<meta property="og:url" content="${esc(seo.url)}">`,
    `<meta property="og:title" content="${esc(seo.page.h1)}">`,
    `<meta property="og:description" content="${esc(seo.description)}">`,
    `<meta property="og:image" content="${esc(seo.image.url)}">`,
    `<meta property="og:image:type" content="${esc(seo.image.type)}">`,
    `<meta property="og:image:width" content="${seo.image.width}">`,
    `<meta property="og:image:height" content="${seo.image.height}">`,
    `<meta property="og:image:alt" content="${esc(seo.image.alt)}">`,
    `<meta property="og:updated_time" content="${esc(seo.updatedAt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(seo.page.h1)}">`,
    `<meta name="twitter:description" content="${esc(seo.description)}">`,
    `<meta name="twitter:image" content="${esc(seo.image.url)}">`,
    `<meta name="twitter:image:alt" content="${esc(seo.image.alt)}">`,
    `<script type="application/ld+json">${jsonLdHtml(seo.jsonLd)}</script>`,
    // Shown only until the screen takes over; crawlers that run no script read it as the page.
    `<style>.ff-ssr{max-width:880px;margin:0 auto;padding:72px 24px 96px;color:#e6e3c8;background:#0e100f;font:400 16px/1.6 'Be Vietnam Pro',system-ui,sans-serif}.ff-ssr h1{color:#fffce1;font-size:clamp(34px,6vw,64px);line-height:1;margin:0 0 14px}.ff-ssr h2{color:#fffce1;font-size:24px;margin:40px 0 12px}.ff-ssr h3{color:#fffce1;font-size:17px;margin:20px 0 6px}.ff-ssr a{color:#abff84}.ff-ssr .meta,.ff-ssr nav{color:#a5a493;font-size:14px}.ff-ssr .lede{font-size:18px;color:#fffce1}.ff-ssr dt{color:#fffce1;font-weight:600;margin-top:14px}.ff-ssr dd{margin:4px 0 0}</style>`,
  ];
  return { title: seo.title, head: tags.join('\n') };
}

const section = (title: string, body: string) => (body ? `<section><h2>${esc(title)}</h2>${body}</section>` : '');
const link = (href: string, label: string) => `<a href="${esc(href)}"${/^https?:/.test(href) ? ' rel="noopener"' : ''}>${esc(label)}</a>`;
const stamp = (iso: string) => `${iso.slice(11, 16)} ${iso.slice(8, 10)}/${Number(iso.slice(5, 7))}/${iso.slice(0, 4)}`;

/** The opening every page shares: breadcrumbs, the answer first, the key facts, what it is about. */
function ssrTop(seo: PageSeo, h: { facts: string; about: string }) {
  const p = seo.page;
  return [
    `<main class="ff-ssr" lang="${seo.lang}">`,
    `<nav aria-label="Breadcrumb">${p.crumbs.slice(0, -1).map((c) => link(c.path, c.name)).join(' › ')}</nav>`,
    '<article>',
    `<p class="meta">${esc(p.kicker)}</p>`,
    `<h1>${esc(p.h1)}</h1>`,
    `<p class="lede">${esc(p.summary)}</p>`,
    section(h.facts, `<dl>${p.facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${f.datetime ? `<time datetime="${esc(f.datetime)}">${esc(f.value)}</time>` : f.href ? link(f.href, f.value) : esc(f.value)}</dd>`).join('')}</dl>`),
    section(h.about, p.about ? `<p>${esc(p.about)}</p>` : ''),
  ];
}
const ssrBottom = (seo: PageSeo, updated: string) => [
  `<p class="meta">${esc(updated)} <time datetime="${esc(seo.updatedAt)}">${esc(stamp(seo.updatedAt))}</time> · ${link(seo.page.otherLang.path, seo.page.otherLang.label)}</p>`,
  '</article></main>',
];

/** An event page's facts as readable HTML: what search engines index, what AI assistants quote, what a slow phone shows first. */
export function eventSsr(seo: EventSeo): string {
  const p = seo.page, h = seo.headings;
  return [
    ...ssrTop(seo, h),
    section(h.lineup, p.lineup.length ? `<ul>${p.lineup.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''),
    section(h.timetable, p.timetable.map((d) => `<h3>${esc(d.day)}</h3><ul>${d.sets.map((x) => `<li>${esc(x.time)} · ${esc(x.artist)}${x.stage ? ` · ${esc(x.stage)}` : ''}</li>`).join('')}</ul>`).join('')),
    section(h.tickets, p.tickets.length ? `<ul>${p.tickets.map((x) => `<li>${esc(x.name)}: ${esc(x.price)} · ${esc(x.state)}</li>`).join('')}</ul>` : ''),
    section(h.updates, p.updates.length ? `<ul>${p.updates.map((u) => `<li><time datetime="${esc(u.at)}">${esc(u.atLabel)}</time> · ${esc(u.kind)}: ${esc(u.body)}</li>`).join('')}</ul>` : ''),
    section(h.faq, p.faq.length ? `<dl>${p.faq.map((f) => `<dt>${esc(f.question)}</dt><dd>${esc(f.answer)}</dd>`).join('')}</dl>` : ''),
    section(h.editions, p.editions.length ? `<ul>${p.editions.map((x) => `<li>${esc(x.label)}: ${link(x.path, x.title)} · ${esc(x.line)}</li>`).join('')}</ul>` : ''),
    section(h.related, p.related.length ? `<ul>${p.related.map((x) => `<li>${link(x.path, x.title)} · ${esc(x.line)}</li>`).join('')}</ul>` : ''),
    ...ssrBottom(seo, h.updated),
  ].join('');
}

/** An organiser page's facts as readable HTML. */
export function organizerSsr(seo: OrganizerSeo): string {
  const p = seo.page, h = seo.headings;
  const list = (items: Link[]) => (items.length ? `<ul>${items.map((x) => `<li>${link(x.path, x.title)} · ${esc(x.line)}</li>`).join('')}</ul>` : '');
  return [...ssrTop(seo, h), section(h.upcoming, list(p.upcoming)), section(h.past, list(p.past)), ...ssrBottom(seo, h.updated)].join('');
}

// ---- organiser pages ---------------------------------------------------------------------

const PUBLIC_EVENT = `e.status in ('live', 'cancelled') and not e.held_for_reports and e.published_at is not null`;

/** Everything an organiser page says to search engines and AI assistants, or null if there is no such page. */
export async function buildOrganizerSeo(ctx: Ctx, slug: string, lang: Lang = 'vi'): Promise<OrganizerSeo | null> {
  const org = await one<any>(ctx.db, 'select * from organizers where slug = $1 and suspended_at is null', [slug]);
  if (!org) return null;
  const now = ctx.clock.now();
  const events = await many<any>(ctx.db,
    `select e.slug, e.title, e.genre, e.starts_on, e.ends_on, e.start_time, e.end_time, e.starts_at, e.ends_at, e.status, e.venue_name, e.address,
            e.area, e.city, e.lat, e.lng, e.entry_mode, e.price_from, e.cover_url, e.updated_at, e.published_at
       from events e where e.organizer_id = $1 and ${PUBLIC_EVENT} order by e.starts_at`, [org.id]);
  const upcoming = events.filter((e) => new Date(e.ends_at) >= now && e.status === 'live');
  const past = events.filter((e) => new Date(e.ends_at) < now).reverse().slice(0, 12);
  const vi = lang === 'vi';
  const base = baseOf(ctx);
  const path = `/o/${org.slug}`;
  const alternates = { vi: `${base}${path}`, en: `${base}${path}?lang=en`, 'x-default': `${base}${path}` };
  const url = alternates[lang];

  // What they put on, most first, and where.
  const rank = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).map(([x]) => x);
  const genres = rank(events.map((e) => e.genre).filter(Boolean)).slice(0, 4);
  const cityKeys = rank(events.map((e) => e.city ?? 'ho-chi-minh')) as City[];
  const cities = cityKeys.map((c) => text(CITIES[c], lang));
  const mainCity = cityKeys[0] ?? 'ho-chi-minh';
  const verified = org.verification_state === 'verified';
  const kind = org.is_community ? (vi ? 'trang cộng đồng' : 'community page') : text(ORG_TYPE[org.type] ?? ORG_TYPE.promoter, lang);
  const about = text(org.bio, lang);
  const next = upcoming[0];
  const n = (x: number) => x.toLocaleString(vi ? 'vi-VN' : 'en-US');
  const updatedAt = [org.created_at, ...events.map((e) => e.updated_at)].map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime())[0];

  const summary = [
    vi
      ? `${org.name} là ${kind}${verified ? ' đã được FeestFinder xác minh' : ''}${genres.length ? `, tổ chức các sự kiện ${genres.join(', ')}` : ''}${cities.length ? ` ở ${cities.join(', ')}` : ''}${org.since_year ? `, hoạt động từ năm ${org.since_year}` : ''}.`
      : `${org.name} is ${/^[aeiou]/i.test(kind) ? 'an' : 'a'} ${kind}${verified ? ' verified by FeestFinder' : ''}${genres.length ? `, putting on ${genres.join(', ')} events` : ''}${cities.length ? ` in ${cities.join(', ')}` : ''}${org.since_year ? `, active since ${org.since_year}` : ''}.`,
    upcoming.length
      ? (vi ? `Có ${upcoming.length} sự kiện sắp diễn ra; gần nhất là ${next.title} (${eventLine(next, lang)}).` : `${upcoming.length} upcoming ${upcoming.length === 1 ? 'event' : 'events'}; next is ${next.title} (${eventLine(next, lang)}).`)
      : (vi ? 'Hiện chưa có sự kiện sắp diễn ra.' : 'No upcoming events right now.'),
    org.followers_count ? (vi ? `${n(org.followers_count)} người theo dõi trên FeestFinder.` : `${n(org.followers_count)} followers on FeestFinder.`) : '',
  ].filter(Boolean).join(' ');

  const description = clip([
    vi ? `${org.name}: ${kind}${genres.length ? ` ${genres.join(', ')}` : ''}${cities.length ? ` ở ${cities.join(', ')}` : ''}` : `${org.name}: ${kind}${genres.length ? `, ${genres.join(', ')}` : ''}${cities.length ? ` in ${cities.join(', ')}` : ''}`,
    upcoming.length ? `${t('upcoming', lang)}: ${upcoming.slice(0, 3).map((e) => `${e.title} (${shortDay(e.starts_on, lang)})`).join(', ')}` : '',
  ].filter(Boolean).join('. ') + '.', 160);
  const title = [`${org.name} – ${t('upcoming', lang).toLowerCase()}${cities[0] ? ` · ${cities[0]}` : ''}`, org.name].find((x) => x.length <= 62) ?? clip(org.name, 62);

  // A link preview needs a wide picture: the next event's cover, else the genre art.
  const cover = upcoming.find((e) => e.cover_url) ?? events.find((e) => e.cover_url);
  const image = cover
    ? { url: abs(ctx, cover.cover_url)!, width: 1600, height: 900, type: 'image/jpeg' }
    : { url: `${base}/og/v1/${toneOf(genres[0])}.png`, width: OG_WIDTH, height: OG_HEIGHT, type: 'image/png' };

  const crumbs = [
    { name: 'FeestFinder', path: inLang('/', lang) },
    { name: `${t('eventsIn', lang)} ${text(CITIES[mainCity], lang)}`, path: inLang(`/list?city=${mainCity}`, lang) },
    { name: org.name, path: inLang(path, lang) },
  ];
  const facts: Fact[] = [
    { label: t('type', lang), value: kind.charAt(0).toUpperCase() + kind.slice(1) },
    { label: t('cities', lang), value: cities.join(', ') },
    { label: t('genres', lang), value: genres.join(', ') },
    { label: t('upcoming', lang), value: String(upcoming.length) },
    { label: t('since', lang), value: org.since_year ? String(org.since_year) : '' },
    { label: t('followers', lang), value: org.followers_count ? n(org.followers_count) : '' },
    { label: t('verified', lang), value: t(verified ? 'yes' : 'no', lang) },
    ...(org.website ? [{ label: t('site', lang), value: hostOf(org.website), href: org.website }] : []),
  ].filter((f) => f.value);

  const ids = { page: url, org: `${url}#organization`, crumbs: `${url}#breadcrumb` };
  const place = (e: any) => {
    const a = ADDRESS[(e.city ?? 'ho-chi-minh') as City] ?? ADDRESS['ho-chi-minh'];
    return { '@type': 'Place', name: e.venue_name ?? undefined,
      address: { '@type': 'PostalAddress', streetAddress: [e.address, e.area].filter(Boolean).join(', ') || undefined, addressLocality: a.locality, addressRegion: a.region, addressCountry: 'VN' } };
  };
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'ProfilePage', '@id': ids.page, url, name: `${title} | FeestFinder`, description, inLanguage: lang,
      isPartOf: { '@id': `${base}/#website` }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.org },
      primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height },
      dateCreated: vnIso(org.created_at), dateModified: vnIso(updatedAt),
    },
    {
      '@type': 'Organization', '@id': ids.org, name: org.name, url, description: about || summary,
      logo: org.logo_url ? abs(ctx, org.logo_url) : undefined,
      sameAs: org.website ? [org.website] : undefined,
      foundingDate: org.since_year ? String(org.since_year) : undefined,
      areaServed: cities.length ? cityKeys.map((c) => ({ '@type': 'City', name: (ADDRESS[c] ?? ADDRESS['ho-chi-minh']).locality })) : undefined,
      interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/FollowAction', userInteractionCount: org.followers_count },
      // Their upcoming events, each with its own page.
      event: upcoming.slice(0, 30).map((e) => ({
        '@type': SCHEMA_TYPE[e.genre] ?? 'Event', name: e.title, url: `${base}/e/${e.slug}${vi ? '' : '?lang=en'}`,
        startDate: vnIso(e.starts_at), endDate: vnIso(e.ends_at),
        eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: place(e), image: [e.cover_url ? abs(ctx, e.cover_url) : `${base}/og/v1/${toneOf(e.genre)}.png`],
        organizer: { '@id': ids.org },
      })),
    },
    crumbList(base, ids.crumbs, crumbs),
  ];

  const links = (xs: any[]) => xs.map((e) => ({ title: e.title, path: inLang(`/e/${e.slug}`, lang), line: eventLine(e, lang) }));
  return {
    kind: 'organizer', lang, url, canonical: url, alternates, markdown: `${path}.md${vi ? '' : '?lang=en'}`,
    title: `${title} | FeestFinder`, description, robots: ROBOTS,
    image: { ...image, alt: org.name },
    publishedAt: vnIso(org.created_at) ?? null,
    updatedAt: vnIso(updatedAt)!,
    headings: { facts: t('facts', lang), about: t('about', lang), upcoming: t('upcoming', lang), past: t('pastEvents', lang), updated: t('updated', lang) },
    page: {
      crumbs, kicker: [kind.charAt(0).toUpperCase() + kind.slice(1), cities[0], verified ? t('verifiedShort', lang) : null].filter(Boolean).join(' · '), h1: org.name, summary, facts, about,
      upcoming: links(upcoming), past: links(past),
      otherLang: { label: t('otherLang', lang), path: vi ? `${path}?lang=en` : path },
    },
    jsonLd: { '@context': 'https://schema.org', '@graph': JSON.parse(JSON.stringify(graph)) },
  };
}

// ---- Markdown and llms.txt, for AI agents that read text ---------------------------------

/** A page as Markdown: the same answer, facts and lists as its HTML, with links made absolute. */
export function pageMarkdown(ctx: Ctx, seo: EventSeo | OrganizerSeo): string {
  const base = baseOf(ctx);
  const absUrl = (href: string) => (/^https?:/.test(href) ? href : base + href);
  const md = (s: string) => s.replace(/([\\`*_[\]])/g, '\\$1');
  const p = seo.page;
  const out: string[] = [`# ${md(p.h1)}`, '', `> ${md(p.summary)}`, ''];
  const sec = (title: string, lines: string[]) => { if (lines.length) out.push(`## ${title}`, '', ...lines, ''); };
  const linkLine = (x: { title: string; path: string; line: string }) => `- [${md(x.title)}](${absUrl(x.path)}) · ${md(x.line)}`;
  sec(seo.headings.facts, p.facts.map((f) => `- **${md(f.label)}:** ${f.href ? `[${md(f.value)}](${absUrl(f.href)})` : md(f.value)}`));
  sec(seo.headings.about, p.about ? [md(p.about)] : []);
  if (seo.kind === 'event') {
    const e = seo.page, h = seo.headings;
    sec(h.lineup, e.lineup.map((a) => `- ${md(a)}`));
    sec(h.timetable, e.timetable.flatMap((d) => [`### ${d.day}`, '', ...d.sets.map((x) => `- ${x.time} · ${md(x.artist)}${x.stage ? ` · ${md(x.stage)}` : ''}`), '']));
    sec(h.tickets, e.tickets.map((x) => `- ${md(x.name)}: ${x.price} · ${x.state}`));
    sec(h.updates, e.updates.map((u) => `- ${u.atLabel} · ${md(u.kind)}: ${md(u.body)}`));
    sec(h.faq, e.faq.flatMap((f) => [`**${md(f.question)}**`, '', md(f.answer), '']));
    sec(h.editions, e.editions.map((x) => `- ${md(x.label)}: [${md(x.title)}](${absUrl(x.path)}) · ${md(x.line)}`));
    sec(h.related, e.related.map(linkLine));
  } else {
    sec(seo.headings.upcoming, seo.page.upcoming.map(linkLine));
    sec(seo.headings.past, seo.page.past.map(linkLine));
  }
  // The other language's Markdown: /e/<slug>.md and /e/<slug>.md?lang=en.
  const other = `${absUrl(p.otherLang.path.split('?')[0])}.md${seo.lang === 'vi' ? '?lang=en' : ''}`;
  out.push('---', '', `${seo.headings.updated} ${stamp(seo.updatedAt)} · ${t('source', seo.lang)}: ${seo.canonical} · [${p.otherLang.label}](${other})`, '');
  return out.join('\n');
}

/**
 * /llms.txt (llmstxt.org): what FeestFinder is, and where its pages are as Markdown. Search
 * engines do not use it yet; AI agents that browse on someone's behalf read it to find pages
 * without crawling the site.
 */
export async function llmsTxt(ctx: Ctx): Promise<string> {
  const now = ctx.clock.now();
  const base = baseOf(ctx);
  const [events, orgs] = await Promise.all([
    many<any>(ctx.db,
      `select e.slug, e.title, e.genre, e.starts_on, e.start_time, e.venue_name, e.city, e.entry_mode, e.price_from
         from events e where ${PUBLIC_EVENT} and e.status = 'live' and e.ends_at >= $1 order by e.starts_at limit 300`, [now]),
    many<any>(ctx.db,
      `select o.slug, o.name, count(*)::int as n, array_agg(distinct e.genre) filter (where e.genre is not null) as genres
         from organizers o join events e on e.organizer_id = o.id
        where ${PUBLIC_EVENT} and e.status = 'live' and e.ends_at >= $1 and o.suspended_at is null
        group by o.slug, o.name order by count(*) desc, o.name limit 200`, [now]),
  ]);
  const md = (s: string) => s.replace(/([\\`*_[\]])/g, '\\$1');
  return [
    '# FeestFinder',
    '',
    '> FeestFinder lists festivals, club nights, gigs, night markets and cultural events in Vietnam (Ho Chi Minh City, Hanoi, Da Nang, Nha Trang): dates, venues, ticket prices, lineups and organisers. Organisers and the community send events in; moderators check each one before it goes live.',
    '',
    'Every event and organiser page exists in Vietnamese (`/e/<slug>`, `/o/<slug>`) and English (add `?lang=en`), carries schema.org data in its HTML, and has a Markdown version at the same address plus `.md`. Prices are in Vietnamese đồng (₫); dates and times are Vietnam time (UTC+7). Ticket links go to the organiser\'s own ticket seller.',
    '',
    '## Upcoming events',
    '',
    ...(events.length ? events.map((e) => `- [${md(e.title)}](${base}/e/${e.slug}.md): ${[e.genre, eventLine(e, 'en')].filter(Boolean).join(' · ')}`) : ['- Nothing is listed right now.']),
    '',
    '## Organisers',
    '',
    ...orgs.map((o) => `- [${md(o.name)}](${base}/o/${o.slug}.md): ${o.n} upcoming ${o.n === 1 ? 'event' : 'events'}${o.genres?.length ? ` · ${o.genres.join(', ')}` : ''}`),
    '',
    '## Optional',
    '',
    `- [Every event, by city](${base}/list): the list as people see it; filters \`?city=ho-chi-minh|ha-noi|da-nang|nha-trang\`, \`&genre=EDM\`, \`&time=tonight|weekend|7days|month\``,
    `- [Sitemap](${base}/sitemap.xml): every public page in both languages, with the date it last changed`,
    `- [About FeestFinder](${base}/about)`,
    '',
  ].join('\n');
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
  lines.push(`Sitemap: ${baseOf(ctx)}/sitemap.xml`, `# For AI agents: an index of every page as Markdown at ${baseOf(ctx)}/llms.txt`, '');
  return lines.join('\n');
}

/** Event pages (upcoming, and the last six months' for their recaps and next editions) and organiser pages, in both languages; the list. */
export async function sitemapXml(ctx: Ctx): Promise<string> {
  const now = ctx.clock.now();
  const since = new Date(now.getTime() - 183 * 86400_000);
  const [events, orgs] = await Promise.all([
    many<any>(ctx.db,
      `select slug, updated_at from events where status in ('live', 'cancelled') and not held_for_reports and published_at is not null and ends_at >= $1
        order by starts_at limit 20000`, [since]),
    many<any>(ctx.db,
      `select o.slug, max(e.updated_at) as updated_at from organizers o join events e on e.organizer_id = o.id
        where e.status = 'live' and not e.held_for_reports and e.ends_at >= $1 group by o.slug`, [now]),
  ]);
  const base = baseOf(ctx);
  const day = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : now.toISOString().slice(0, 10));
  const alt = (vi: string, en: string) => [['vi', vi], ['en', en], ['x-default', vi]]
    .map(([l, href]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(href)}"/>`).join('');
  const urls: { loc: string; lastmod?: string; priority: string; alternates?: string }[] = [
    { loc: `${base}/`, lastmod: day(now), priority: '1.0' },
    { loc: `${base}/list`, lastmod: day(now), priority: '0.6' },
    ...events.flatMap((e) => {
      const vi = `${base}/e/${e.slug}`, en = `${vi}?lang=en`, links = alt(vi, en);
      return [{ loc: vi, lastmod: day(e.updated_at), priority: '0.9', alternates: links }, { loc: en, lastmod: day(e.updated_at), priority: '0.7', alternates: links }];
    }),
    ...orgs.flatMap((o) => {
      const vi = `${base}/o/${o.slug}`, en = `${vi}?lang=en`, links = alt(vi, en);
      return [{ loc: vi, lastmod: day(o.updated_at), priority: '0.6', alternates: links }, { loc: en, lastmod: day(o.updated_at), priority: '0.4', alternates: links }];
    }),
    { loc: `${base}/about`, priority: '0.3' },
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority>${u.alternates ?? ''}</url>`).join('\n')
    + '\n</urlset>\n';
}

// ---- IndexNow ----------------------------------------------------------------------------

/** Notes an event page to announce. A no-op without INDEXNOW_KEY. */
export async function queueIndexNow(q: Queryable, ctx: Ctx, slug: string) {
  if (!ctx.config.indexNowKey) return;
  await q.query(`insert into indexnow_queue (url, queued_at) values ($1, $2) on conflict (url) do update set queued_at = excluded.queued_at`,
    [`${baseOf(ctx)}/e/${slug}`, ctx.clock.now()]);
}

/**
 * Announces, in one batch, every event and organiser page whose content changed since it was
 * last announced (the events_touch trigger keeps updated_at to real changes; an organiser page
 * changes with its events), in both languages, and any queued by hand. Bing shares IndexNow
 * submissions with Yandex, Naver and Seznam; ChatGPT search and Copilot read Bing's index.
 */
export async function pingIndexNow(ctx: Ctx, send: typeof fetch = fetch): Promise<number> {
  const key = ctx.config.indexNowKey;
  if (!key) return 0;
  const base = baseOf(ctx);
  const [changed, queued] = await Promise.all([
    many<{ url: string }>(ctx.db,
      `select $1 || e.slug as url, e.updated_at as at from events e left join indexnow_sent s on s.url = $1 || e.slug
        where ${PUBLIC_EVENT} and (s.sent_at is null or e.updated_at > s.sent_at)
       union all
       select $2 || o.slug, max(e.updated_at) from organizers o join events e on e.organizer_id = o.id left join indexnow_sent s on s.url = $2 || o.slug
        where ${PUBLIC_EVENT} and o.suspended_at is null
        group by o.slug, s.sent_at having s.sent_at is null or max(e.updated_at) > s.sent_at
       order by at desc limit 4000`, [`${base}/e/`, `${base}/o/`]),
    many<{ url: string }>(ctx.db, 'select url from indexnow_queue order by queued_at limit 1000'),
  ]);
  // Each page goes out in both languages; the record keeps the Vietnamese address.
  const pages = [...new Set([...queued, ...changed].map((r) => r.url.replace(/\?lang=en$/, '')))].slice(0, 5_000);
  if (!pages.length) return 0;
  const urls = pages.flatMap((u) => [u, `${u}?lang=en`]);
  const res = await send('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(base).host, key, keyLocation: `${base}/${key}.txt`, urlList: urls }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok && res.status !== 202) throw new Error(`IndexNow answered ${res.status}`);
  await ctx.db.tx(async (q) => {
    await q.query('delete from indexnow_queue where url = any($1::text[])', [pages]);
    await q.query(`insert into indexnow_sent (url, sent_at) select u, now() from unnest($1::text[]) u
                   on conflict (url) do update set sent_at = excluded.sent_at`, [pages]);
  });
  return pages.length;
}
