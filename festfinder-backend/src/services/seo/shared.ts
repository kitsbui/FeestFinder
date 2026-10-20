import type { Ctx } from '../../context.ts';
import type { Row } from '../../db/rows.ts';
import type { Lang, Localized } from '../../lib/i18n.ts';
import { formatMoney } from '../../lib/money.ts';
import { cityLabel, cityOf } from '../../lib/places.ts';
import { presentOrgLinks } from '../organizers.ts';

/* What every SEO page builder shares: the words in both languages, dates and prices, the page types, the site's own nodes. Part of services/seo.ts. */

/**
 * The picture a link preview shows for a page without a cover: logo pack v2's share image (the
 * wordmark on the night ground, 1200×630), served with the site's assets. /og/v1/<tone>.png, the
 * genre art before design v2, still answers for the previews cached with it.
 */
export const ogFallback = (base: string) => `${base}/ui/assets/og.png`;


export const esc = (s: unknown) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const baseOf = (ctx: Ctx) => ctx.config.publicBaseUrl.replace(/\/$/, '');
// A picture's framing (lib/frame.ts) is for FeestFinder's screens; search engines get the file.
export const abs = (ctx: Ctx, url: string | null | undefined) => (url ? new URL(url.replace(/#ff=[^#]*$/, ''), baseOf(ctx) + '/').href : null);

/** schema.org's type for an event: every event is electronic music. */
export const SCHEMA_TYPE: Record<string, string> = { EDM: 'MusicEvent' };

/** Where each Vietnamese city sits in a postal address; elsewhere the city's English name serves. */
export const VN_ADDRESS: Record<string, { locality: string; region: string }> = {
  'ho-chi-minh': { locality: 'Thành phố Hồ Chí Minh', region: 'Thành phố Hồ Chí Minh' },
  'ha-noi': { locality: 'Hà Nội', region: 'Hà Nội' },
  'da-nang': { locality: 'Đà Nẵng', region: 'Đà Nẵng' },
  'nha-trang': { locality: 'Nha Trang', region: 'Khánh Hòa' },
};
export function addressOf(slug: string | null | undefined) {
  const c = cityOf(slug);
  return { ...(VN_ADDRESS[c.slug] ?? { locality: c.name.en, region: c.name.en }), country: c.countryCode };
}

export const WEEKDAY = {
  vi: ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
export const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const T = {
  facts: { vi: 'Thông tin chính', en: 'Key facts' }, about: { vi: 'Giới thiệu', en: 'About' }, lineup: { vi: 'Đội hình', en: 'Lineup' },
  timetable: { vi: 'Lịch diễn', en: 'Set times' }, tickets: { vi: 'Vé', en: 'Tickets' }, updates: { vi: 'Tin từ BTC', en: 'From the organiser' },
  faq: { vi: 'Câu hỏi thường gặp', en: 'Frequently asked' }, editions: { vi: 'Các mùa khác', en: 'Other editions' },
  related: { vi: 'Sự kiện liên quan', en: 'Related events' }, updated: { vi: 'Cập nhật', en: 'Updated' },
  when: { vi: 'Thời gian', en: 'When' }, venue: { vi: 'Địa điểm', en: 'Venue' }, address: { vi: 'Địa chỉ', en: 'Address' },
  price: { vi: 'Giá vé', en: 'Price' }, status: { vi: 'Tình trạng', en: 'Status' }, age: { vi: 'Độ tuổi', en: 'Age' },
  genre: { vi: 'Thể loại', en: 'Genre' }, kind: { vi: 'Loại', en: 'Kind' }, organiser: { vi: 'Ban tổ chức', en: 'Organiser' }, buy: { vi: 'Mua vé', en: 'Tickets' },
  site: { vi: 'Trang chính thức', en: 'Official site' }, free: { vi: 'Miễn phí', en: 'Free' }, from: { vi: 'Từ', en: 'From' },
  donation: { vi: 'Tuỳ tâm', en: 'Pay what you like' }, allAges: { vi: 'Mọi lứa tuổi', en: 'All ages' },
  priceAtSeller: { vi: 'Giá ở trang bán vé', en: 'Price on the ticket page' },
  onSale: { vi: 'Còn vé', en: 'On sale' }, low: { vi: 'Sắp hết vé', en: 'Few tickets left' }, soldOut: { vi: 'Hết vé', en: 'Sold out' },
  soon: { vi: 'Sắp mở bán', en: 'On sale soon' }, cancelled: { vi: 'Đã huỷ', en: 'Cancelled' }, past: { vi: 'Đã diễn ra', en: 'Took place' },
  nextDay: { vi: 'hôm sau', en: 'next day' }, previous: { vi: 'Mùa trước', en: 'Previous edition' }, next: { vi: 'Mùa tiếp theo', en: 'Next edition' },
  eventsIn: { vi: 'Sự kiện ở', en: 'Events in' }, otherLang: { vi: 'English', en: 'Tiếng Việt' },
  upcoming: { vi: 'Sự kiện sắp diễn ra', en: 'Upcoming events' }, pastEvents: { vi: 'Đã tổ chức', en: 'Past events' },
  type: { vi: 'Loại', en: 'Type' }, cities: { vi: 'Thành phố', en: 'Cities' }, genres: { vi: 'Thể loại', en: 'Genres' },
  since: { vi: 'Hoạt động từ', en: 'Active since' }, followers: { vi: 'Người theo dõi', en: 'Followers' },
  verified: { vi: 'Xác minh', en: 'Verified' }, yes: { vi: 'Đã xác minh với FeestFinder', en: 'Verified by FeestFinder' },
  no: { vi: 'Chưa xác minh', en: 'Not verified yet' }, source: { vi: 'Nguồn', en: 'Source' }, verifiedShort: { vi: 'Đã xác minh', en: 'Verified' },
  collection: { vi: 'Bộ sưu tập', en: 'Collection' }, madeBy: { vi: 'Người tạo', en: 'Made by' }, eventCount: { vi: 'Số sự kiện', en: 'Events' },
  member: { vi: 'Thành viên FeestFinder', en: 'A FeestFinder member' },
  artist: { vi: 'Nghệ sĩ', en: 'Artist' }, mixes: { vi: 'Nghe', en: 'Listen' }, styles: { vi: 'Phong cách', en: 'Styles' }, playsIn: { vi: 'Diễn ở', en: 'Plays in' },
  nextShow: { vi: 'Show gần nhất', en: 'Next show' },
  artistsWorked: { vi: 'Nghệ sĩ đã hợp tác', en: 'Artists worked with' }, basedIn: { vi: 'Hoạt động tại', en: 'Based in' },
  roles: { vi: 'Vai trò', en: 'Roles' }, booking: { vi: 'Booking', en: 'Booking' }, organizersWorked: { vi: 'Nhà tổ chức đã hợp tác', en: 'Organisers worked with' },
  directory: { vi: 'Nghệ sĩ', en: 'Artists' }, withShows: { vi: 'Có show sắp tới', en: 'With shows coming up' }, others: { vi: 'Nghệ sĩ khác', en: 'More artists' },
  artistCount: { vi: 'Số nghệ sĩ', en: 'Artists' },
  project: { vi: 'Dự án', en: 'Project' }, projects: { vi: 'Dự án', en: 'Projects' }, seeking: { vi: 'Đang tìm', en: 'Looking for' },
  target: { vi: 'Dự kiến', en: 'Planned for' }, budget: { vi: 'Ngân sách', en: 'Budget' }, raise: { vi: 'Cần gọi', en: 'Raising' },
  capacity: { vi: 'Sức chứa', en: 'Capacity' }, by: { vi: 'Người khởi xướng', en: 'Started by' }, onBoard: { vi: 'Đã đồng hành', en: 'On board' },
  realized: { vi: 'Đã thành sự kiện', en: 'Became an event' },
};
export const ORG_TYPE: Record<string, Localized> = {
  promoter: { vi: 'đơn vị tổ chức sự kiện', en: 'event promoter' }, venue: { vi: 'địa điểm tổ chức', en: 'venue' },
  company: { vi: 'công ty', en: 'company' }, agency: { vi: 'agency', en: 'agency' }, public: { vi: 'đơn vị công', en: 'public body' },
};
export type Key = keyof typeof T;
export const t = (k: Key, lang: Lang) => T[k][lang];

/** "Thứ Bảy, 19/9/2026" / "Saturday 19 September 2026" */
export function longDate(date: string | null, lang: Lang) {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  const wd = WEEKDAY[lang][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return lang === 'vi' ? `${wd}, ${d}/${m}/${y}` : `${wd} ${d} ${MONTH_EN[m - 1]} ${y}`;
}
export const shortDay = (date: string | null, lang: Lang) => {
  if (!date) return '';
  const [, m, d] = date.split('-').map(Number);
  return lang === 'vi' ? `${d}/${m}` : `${d} ${MONTH_EN[m - 1].slice(0, 3)}`;
};
export const text = (l: Localized | null | undefined, lang: Lang) => (l ? (l[lang] || l.vi || l.en || '').trim() : '');
export const hostOf = (u: string) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };
export const vnIso = (ts: Date | string | null | undefined) =>
  (ts ? new Date(new Date(ts).getTime() + 7 * 3600_000).toISOString().replace(/\.\d{3}Z$/, '+07:00') : undefined);
/** Cut at a word, under the length search results show. */
export const clip = (s: string, max: number) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,.;:·–-]\s*$/, '') + '…');

/** The columns of an event the lines about it read. */
export type DatedRow = Pick<Row<'events'>, 'starts_on' | 'ends_on' | 'start_time' | 'end_time'>;
export type PricedRow = Pick<Row<'events'>, 'entry_mode' | 'price_from' | 'currency'>;
export type LineRow = PricedRow & Pick<Row<'events'>, 'starts_on' | 'start_time' | 'venue_name' | 'city'>;

export function whenLine(ev: DatedRow, lang: Lang) {
  const days = ev.ends_on && ev.ends_on !== ev.starts_on ? `${longDate(ev.starts_on, lang)} – ${longDate(ev.ends_on, lang)}` : longDate(ev.starts_on, lang);
  if (!ev.start_time) return days;
  const overnight = ev.end_time && ev.end_time < ev.start_time;
  return `${days} · ${ev.start_time}${ev.end_time ? ` – ${ev.end_time}${overnight ? ` (${t('nextDay', lang)})` : ''}` : ''}`;
}

export function priceLine(ev: PricedRow, lang: Lang) {
  if (ev.entry_mode === 'donation') return t('donation', lang);
  if (ev.entry_mode === 'free') return t('free', lang);
  // Sold, at a price nobody gave yet: never "free".
  if (!ev.price_from) return t('priceAtSeller', lang);
  return `${t('from', lang)} ${formatMoney(ev.price_from, ev.currency, lang)}`;
}

export type Fact = { label: string; value: string; href?: string; datetime?: string };
export type Link = { title: string; path: string; line: string };

/** What every public page says to search engines and AI assistants: its head, its graph, its facts. */
export interface PageSeo {
  kind: 'event' | 'organizer' | 'collection' | 'artist' | 'directory' | 'project';
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

/** A collection someone made public: the same lists as an organiser page. */
export interface CollectionSeo extends Omit<OrganizerSeo, 'kind'> {
  kind: 'collection';
}

/** An artist: where they play next and where they have played, the same lists again, and their mixes. */
export interface ArtistSeo extends Omit<OrganizerSeo, 'kind' | 'headings' | 'page'> {
  kind: 'artist';
  headings: OrganizerSeo['headings'] & { mixes: string };
  page: OrganizerSeo['page'] & { mixes: { title: string; url: string; line: string }[] };
}

export const ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

/** FeestFinder itself, at the top of every page's graph. */
export const siteNodes = (base: string) => [
  { '@type': 'Organization', '@id': `${base}/#organization`, name: 'FeestFinder', url: `${base}/`, logo: { '@type': 'ImageObject', url: `${base}/ui/assets/apple-touch-icon.png`, width: 180, height: 180 } },
  { '@type': 'WebSite', '@id': `${base}/#website`, url: `${base}/`, name: 'FeestFinder', inLanguage: ['vi', 'en'], publisher: { '@id': `${base}/#organization` } },
];

export const crumbList = (base: string, id: string, crumbs: { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList', '@id': id,
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: base + c.path })),
});

/** A link to another page on the site, in this page's language. */
export const inLang = (path: string, lang: Lang) => (lang === 'vi' ? path : `${path}${path.includes('?') ? '&' : '?'}lang=en`);

/** "19/9 20:00 · SECC, TP.HCM · Từ 1.200.000₫": one line about an event in a list. */
export const eventLine = (r: LineRow, lang: Lang) => [shortDay(r.starts_on, lang) + (r.start_time ? ` ${r.start_time}` : ''),
  [r.venue_name, text(cityLabel(r.city), lang)].filter(Boolean).join(', '), priceLine(r, lang)].join(' · ');

/** An organiser's own website and channels, for `sameAs`: they tie its listings to one organiser. */
export const orgSameAsOf = (o: { website?: string | null; links?: Record<string, string> | null }) => {
  const urls = [o.website, ...presentOrgLinks(o).map((l) => l.url)].filter((u): u is string => !!u);
  return urls.length ? [...new Set(urls)] : undefined;
};


export const PUBLIC_EVENT = `e.status in ('live', 'cancelled') and not e.held_for_reports and e.published_at is not null`;

/** The directory, or one style's or one city's artists: a list search engines may show. */
export interface DirectorySeo extends Omit<OrganizerSeo, 'kind'> {
  kind: 'directory';
}

/** A project looking for backers: its idea and its needs, the same page parts as an organiser. */
export interface ProjectSeo extends Omit<OrganizerSeo, 'kind'> {
  kind: 'project';
}
