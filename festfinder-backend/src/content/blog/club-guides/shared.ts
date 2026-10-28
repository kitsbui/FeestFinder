/**
 * What the club guides share (owner, 2026-10-22, from the "Club Guide" handoff): a city guide is
 * data (the city's facts, its clubs with their verified address, hours, music, dress code, prices
 * and official page, the tips, the questions, the sources) that `cityGuide` turns into one pack
 * post in Vietnamese and English with the same shape every time: the answer first, the city's
 * nightlife in a minute, a comparison table, one section per club (its facts as a list, then why
 * it matters), tips, and what to read next. `services/seo/blog.ts` reads each club section back as
 * a NightClub in an ItemList (the list under the heading gives the address and the official link).
 */
import type { Localized } from '../../../lib/i18n.ts';
import type { PackPost } from '../../../services/blog-content.ts';
import type { Faq, Fact, Source } from '../../../services/blog.ts';
import { figure, guide, type Media } from '../edm-genres/media.ts';

export { guide, nights, wiki } from '../edm-genres/media.ts';

type Lang = 'vi' | 'en';

export const PILLAR = 'club-guides/club-edm-chau-a';

/** The site's list of coming nights in a launched city, in the post's language. */
export const cityNights = (city: string, lang: Lang) => `/?city=${city}${lang === 'en' ? '&lang=en' : ''}`;

/** A post's cover with its credit, as a pack post carries it. */
export const coverOf = (m: Media) => ({ url: m.url, credit: `[${m.author}](${m.page}) · ${m.license} · Wikimedia Commons` });

export interface Club {
  name: string;
  /** What it is in a few words, after its name in the heading. */
  tagline: Localized;
  area: Localized;
  /** As the venue gives it; Vietnamese for a Vietnamese city. */
  address: string;
  hours: Localized;
  music: Localized;
  vibe: Localized;
  dress: Localized;
  price: Localized;
  /** The official page: its own site, else its Instagram or Facebook page. */
  url: string;
  /** 80–130 words in each language: what makes it the club it is, only what the sources say. */
  why: Localized;
}

export interface CityGuide {
  key: string;
  slug: string;
  /** The launched city on the site, for the link to its nights; null for a city the site does not list yet. */
  city: string | null;
  name: Localized;
  title: Localized;
  excerpt: Localized;
  cover: Media;
  /** A second picture, placed after the second club. */
  figure?: { media: Media; alt: Localized; caption: Localized };
  styles: string[];
  /** The opening paragraph: starts with the bold answer, 40–60 words. */
  lead: Localized;
  quick: { areas: Localized; hours: Localized; music: Localized; prices: Localized; home: Localized; safety: Localized };
  clubs: Club[];
  tips: { vi: string[]; en: string[] };
  /** One more section after the tips, in markdown, when the city needs it (a scene's history, a rule). */
  extra?: Localized;
  /** Guides to read next, by slug, with a line about each. */
  related: { slug: string; line: Localized }[];
  facts: Fact[];
  faq: Faq[];
  sources: Source[];
}

const T = {
  minute: { vi: (c: string) => `Nightlife ${c} trong một phút`, en: (c: string) => `${c} nightlife in a minute` },
  areas: { vi: 'Khu vực tập trung', en: 'Where it happens' },
  hours: { vi: 'Giờ cao điểm và giờ đóng cửa', en: 'Peak hours and closing time' },
  music: { vi: 'Nhạc', en: 'Music' },
  prices: { vi: 'Giá tham khảo', en: 'What it costs' },
  home: { vi: 'Về nhà', en: 'Getting home' },
  safety: { vi: 'An toàn', en: 'Staying safe' },
  table: { vi: 'Bảng so sánh nhanh', en: 'At a glance' },
  head: { vi: ['Club', 'Khu vực', 'Nhạc', 'Vibe', 'Giá tham khảo'], en: ['Club', 'Area', 'Music', 'Vibe', 'Entry'] },
  address: { vi: 'Địa chỉ', en: 'Address' },
  open: { vi: 'Giờ mở', en: 'Hours' },
  dress: { vi: 'Dress code', en: 'Dress code' },
  price: { vi: 'Giá tham khảo', en: 'Entry' },
  site: { vi: 'Trang chính thức', en: 'Official page' },
  tips: { vi: (c: string) => `Mẹo đi club ở ${c}`, en: (c: string) => `Tips for a night out in ${c}` },
  next: { vi: 'Đọc tiếp', en: 'Read next' },
  nightsIn: { vi: (c: string) => `Lịch đêm nhạc ở ${c} trên FeestFinder`, en: (c: string) => `Coming nights in ${c} on FeestFinder` },
  nightsLine: { vi: 'Lịch club, rave và festival đang mở bán, lọc theo dòng nhạc.', en: 'Club nights, raves and festivals on sale, filtered by style.' },
} as const;

const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');

function clubSection(c: Club, lang: Lang): string {
  const name = `## ${c.name} — ${c.tagline[lang]}`;
  const facts = [
    `- **${T.address[lang]}:** ${c.address}`,
    `- **${T.open[lang]}:** ${c.hours[lang]}`,
    `- **${T.music[lang]}:** ${c.music[lang]}`,
    `- **${T.dress[lang]}:** ${c.dress[lang]}`,
    `- **${T.price[lang]}:** ${c.price[lang]}`,
    // The blog draws only https links: a site without https is named, not linked.
    `- **${T.site[lang]}:** ${c.url.startsWith('https://') ? `[${host(c.url)}](${c.url})` : host(c.url)}`,
  ].join('\n');
  return `${name}\n\n${facts}\n\n${c.why[lang]}`;
}

function body(g: CityGuide, lang: Lang): string {
  const city = g.name[lang];
  const q = g.quick;
  const minute = [
    `- **${T.areas[lang]}:** ${q.areas[lang]}`,
    `- **${T.hours[lang]}:** ${q.hours[lang]}`,
    `- **${T.music[lang]}:** ${q.music[lang]}`,
    `- **${T.prices[lang]}:** ${q.prices[lang]}`,
    `- **${T.home[lang]}:** ${q.home[lang]}`,
    `- **${T.safety[lang]}:** ${q.safety[lang]}`,
  ].join('\n');
  const table = [
    `| ${T.head[lang].join(' | ')} |`,
    `| ${T.head[lang].map(() => '---').join(' | ')} |`,
    ...g.clubs.map((c) => `| ${c.name} | ${c.area[lang]} | ${c.music[lang]} | ${c.vibe[lang]} | ${c.price[lang]} |`),
  ].join('\n');
  const sections = g.clubs.map((c, i) => {
    const s = clubSection(c, lang);
    return g.figure && i === 1 ? `${s}\n\n${figure(g.figure.media, g.figure.alt, g.figure.caption, lang)}` : s;
  });
  const next = [
    ...(g.city ? [`- [${T.nightsIn[lang](city)}](${cityNights(g.city, lang)}) ${T.nightsLine[lang]}`] : []),
    ...g.related.map((r) => `- [${r.line[lang].split(' · ')[0]}](${guide(r.slug, lang)}) ${r.line[lang].split(' · ').slice(1).join(' · ')}`),
  ].join('\n');
  return [
    g.lead[lang],
    `## ${T.minute[lang](city)}\n\n${minute}`,
    `## ${T.table[lang]}\n\n${table}`,
    ...sections,
    `## ${T.tips[lang](city)}\n\n${g.tips[lang].map((t) => `- ${t}`).join('\n')}`,
    ...(g.extra ? [g.extra[lang]] : []),
    `## ${T.next[lang]}\n\n${next}`,
  ].join('\n\n');
}

/** A city guide as a pack post, under the pillar. */
export function cityGuide(g: CityGuide): PackPost {
  return {
    key: g.key, slug: g.slug, category: 'venues', lang: 'vi', parent: PILLAR,
    title: g.title, excerpt: g.excerpt, cover: coverOf(g.cover), styles: g.styles,
    facts: g.facts, faq: g.faq, sources: g.sources, tracks: [],
    body: { vi: body(g, 'vi'), en: body(g, 'en') },
  };
}
