import { sha256 } from '../../../lib/crypto.ts';
import { cleanText, cleanUrl, decodeEntities, finalize, hostOf } from '../normalize.ts';
import type { DiscoverResult, IngestIO, IngestSource, NormalizeContext, RawRecord, SourceAdapter } from '../types.ts';

/*
 * A venue's or festival's WordPress site that posts each night as a post of its own kind
 * ("event", "events"…), read through the REST API every WordPress serves at
 * /wp-json/wp/v2/<kind> (public by design; robots.txt is honoured all the same). Ciné Saigon
 * and 1900 Le Théâtre write their nights this way (checked 2026-10-19): the date sits in the
 * title ("… | Saturday, 17.10") or in the text ("on October 20th"), never in a field, so it is
 * read from there and its year from when the post was written. The venue is the source itself.
 *
 *   { "type": "event", "query": "event-types=2", "perPage": 20, "venue": "Ciné Saigon", "address": "148 Cống Quỳnh, Quận 1" }
 */

interface WordPressConfig { type?: string; query?: string; perPage?: number; venue?: string; address?: string }

export interface WpPost {
  id: number;
  link: string;
  title: string;
  /** When the post was written, the site's local time: the year of a date that names none. */
  date: string;
  modified: string | null;
  /** The post's HTML, capped. */
  content: string;
  image: string | null;
}

const MAX_PER_PAGE = 50;
const MAX_CONTENT = 20_000;

/** The REST address of a site's posts of one kind, with the fields a night needs and its cover embedded. */
export function postsUrl(siteUrl: string, config: WordPressConfig): string | null {
  let origin: string;
  try { origin = new URL(siteUrl).origin; } catch { return null; }
  const type = String(config.type ?? 'event');
  if (!/^[a-z0-9_-]{1,40}$/i.test(type)) return null;
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(config.perPage) || 20));
  const u = new URL(`${origin}/wp-json/wp/v2/${type}`);
  u.searchParams.set('per_page', String(perPage));
  u.searchParams.set('_embed', 'wp:featuredmedia');
  u.searchParams.set('_fields', 'id,link,title,date,modified,content,_links,_embedded');
  // A taxonomy filter such as "event-types=2": only names and numbers reach the address.
  for (const part of String(config.query ?? '').split('&')) {
    const [k, v] = part.split('=');
    if (k && v && /^[a-z0-9_-]+$/i.test(k) && /^[a-z0-9_,-]+$/i.test(v)) u.searchParams.set(k, v);
  }
  return u.toString();
}

/** The posts in a REST answer, as records. Anything that is not a list of posts is none. */
export function parsePosts(text: string): WpPost[] | null {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return null; }
  if (!Array.isArray(data)) return null;
  const out: WpPost[] = [];
  const rendered = (v: unknown) => (typeof v === 'string' ? v : typeof (v as { rendered?: unknown })?.rendered === 'string' ? (v as { rendered: string }).rendered : '');
  for (const p of data as Record<string, unknown>[]) {
    if (!p || typeof p !== 'object' || !Number.isInteger(p.id) || typeof p.link !== 'string') continue;
    const media = (p._embedded as { 'wp:featuredmedia'?: unknown } | undefined)?.['wp:featuredmedia'];
    const first = Array.isArray(media) ? (media[0] as { source_url?: unknown } | undefined) : undefined;
    const image = typeof first?.source_url === 'string' ? first.source_url : null;
    out.push({ id: p.id as number, link: p.link, title: rendered(p.title), date: typeof p.date === 'string' ? p.date : '', modified: typeof p.modified === 'string' ? p.modified : null, content: rendered(p.content).slice(0, MAX_CONTENT), image });
  }
  return out;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?';
const WEEKDAY = '(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*|thứ ?[2-7]|t[2-7]|chủ nhật|cn)';

const pad = (n: number) => String(n).padStart(2, '0');
const realDate = (y: number, m: number, d: number) => m >= 1 && m <= 12 && d >= 1 && d <= 31 && new Date(Date.UTC(y, m - 1, d)).getUTCDate() === d;

export interface FoundDate { date: string; index: number; length: number }

/**
 * The first calendar date written in a text: "17.10.2026", "Saturday, 17.10", "October 20th",
 * "20 Oct 2026", "ngày 4 tháng 10". Day before month, as Vietnam writes it. Without a year, the
 * night is the next such date from a week before the post was written (a post announces a
 * night to come; a day or two after it the post is still on the site).
 */
export function dateInText(text: string, posted: string): FoundDate | null {
  const t = text.toLowerCase();
  const postedAt = /^(\d{4})-(\d{2})-(\d{2})/.exec(posted);
  const year = postedAt ? Number(postedAt[1]) : new Date().getUTCFullYear();
  const floor = postedAt ? new Date(Date.UTC(year, Number(postedAt[2]) - 1, Number(postedAt[3]) - 7)).toISOString().slice(0, 10) : '0000-00-00';
  // "October 20th, 1900 Le Théâtre": a number after the date is its year only when it reads as one.
  const yearOf = (m: number, d: number, named: string | undefined) => {
    if (named && /^20\d\d$/.test(named)) return Number(named);
    const same = `${year}-${pad(m)}-${pad(d)}`;
    return same >= floor ? year : year + 1;
  };
  const found: FoundDate[] = [];
  const push = (index: number, length: number, y: number, m: number, d: number) => { if (realDate(y, m, d)) found.push({ date: `${y}-${pad(m)}-${pad(d)}`, index, length }); };
  // 17.10.2026, 17/10/2026, 17-10-2026
  for (const m of t.matchAll(/(?<![\d.])(\d{1,2})[./-](\d{1,2})[./-](20\d{2})(?![\d.])/g)) push(m.index, m[0].length, Number(m[3]), Number(m[2]), Number(m[1]));
  // Saturday, 17.10 · thứ 7 17/10 · 17.10 alone (not a price such as 2.900 or a time)
  for (const m of t.matchAll(new RegExp(`(?:${WEEKDAY}[,\\s]+)?(?<![\\d.:/])(\\d{1,2})[./](\\d{1,2})(?![\\d.:/%])`, 'g'))) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    push(m.index, m[0].length, yearOf(mo, d, undefined), mo, d);
  }
  // October 20th, 2026 · Oct 16 · (OCT 16)
  for (const m of t.matchAll(new RegExp(`\\b${MONTH}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, 'g'))) {
    const mo = MONTHS.indexOf(m[1]) + 1;
    const d = Number(m[2]);
    push(m.index, m[0].length, yearOf(mo, d, m[3]), mo, d);
  }
  // 20th October 2026 · 16 Oct
  for (const m of t.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}(?:,?\\s+(\\d{4}))?\\b`, 'g'))) {
    const mo = MONTHS.indexOf(m[2]) + 1;
    const d = Number(m[1]);
    push(m.index, m[0].length, yearOf(mo, d, m[3]), mo, d);
  }
  // ngày 4 tháng 10 (năm 2026)
  for (const m of t.matchAll(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?/g)) push(m.index, m[0].length, yearOf(Number(m[2]), Number(m[1]), m[3]), Number(m[2]), Number(m[1]));
  if (!found.length) return null;
  // The first in the text; of two readings of the same characters, the longer (the one with its year or its weekday).
  found.sort((a, b) => a.index - b.index || b.length - a.length);
  return found[0];
}

/** "Doors 22:00", "from 10pm", "mở cửa 21h30": a start time named next to such a word. */
export function timeInText(text: string): string | null {
  const m = /(?<![\p{L}])(?:doors?|open(?:s|ing)?|from|start(?:s|ing)?|mở cửa|bắt đầu|từ|time|giờ)(?![\p{L}])[^\d\n]{0,20}(\d{1,2})(?:[:h.](\d{2}))?\s*(am|pm)?(?![\p{L}\d])/iu.exec(text)
    ?? /(?<![\d.])(\d{1,2}):(\d{2})\s*(am|pm)?(?![\d.])/.exec(text);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ?? '00';
  const ampm = m[3]?.toLowerCase();
  if (h > 24 || Number(min) > 59 || (!m[2] && !ampm)) return null;
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return `${pad(h % 24)}:${min}`;
}

// Letters outside ASCII ("vé", "đ") have no \b in JavaScript: the edges are spelt out.
const TICKET_WORD = /(?<![\p{L}\d])(coupon|tickets?|vé|entrance|entry|door|cover|early ?bird|presale|pre-sale|giá vé|price)(?![\p{L}\d])/giu;
const AMOUNT = /(?<![\d.,])(\d{1,3}(?:[.,]\d{3})+|\d{2,4})\s?(k|vnd|vnđ|đ|d)(?![\p{L}\d])/giu;

/**
 * The cheapest way in, in the site's own currency: "350K", "300.000đ" or "1,500,000 VND"
 * written within a few words of "ticket", "entrance", "vé"… A bottle combo's price is not
 * a ticket, so amounts away from those words are ignored. Free when the text says so and
 * names no paid way in.
 */
export function priceInText(text: string): { price: number | null; free: boolean } {
  const amounts: number[] = [];
  for (const m of text.matchAll(TICKET_WORD)) {
    const near = text.slice(m.index, m.index + 90);
    for (const a of near.matchAll(AMOUNT)) {
      const n = Number(a[1].replace(/[.,]/g, ''));
      const v = /^k$/i.test(a[2]) ? n * 1000 : n;
      if (v >= 10_000 && v <= 50_000_000) amounts.push(v);
    }
  }
  const free = /(?<![\p{L}])(free (?:entry|entrance|admission)|miễn phí vé|vào cửa miễn phí|miễn phí vào cửa|no cover)(?![\p{L}])/iu.test(text);
  const price = amounts.length ? Math.min(...amounts) : null;
  return { price, free: free && price === null };
}

const WEEKDAY_WORD = new RegExp(`^${WEEKDAY}[,\\s]*`, 'i');
const EDGE = /^\s*[|–—-]\s*|\s*[|–—-]\s*$/g;

/**
 * "AFTER HOURS #3: NUSHA | Saturday, 17.10" → "AFTER HOURS #3: NUSHA"; "FRIDAY (OCT 16) - TUNE
 * IN…" → "TUNE IN…": the title without its date, the weekday and brackets that held it, and
 * the separator left hanging.
 */
export function withoutDate(heading: string, at: FoundDate): string {
  let s = heading.slice(0, at.index) + heading.slice(at.index + at.length);
  s = s.replace(/\(\s*\)|\[\s*\]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(EDGE, '').trim();
  const lead = WEEKDAY_WORD.exec(s);
  if (lead && lead[0].length < s.length) s = s.slice(lead[0].length).replace(EDGE, '').trim();
  s = s.replace(new RegExp(`[|–—,-]?\\s*${WEEKDAY}[,\\s]*$`, 'i'), '').replace(EDGE, '').trim();
  return s || heading;
}

/**
 * "AFTER HOURS #3: NUSHA" → ["NUSHA"]; "CHINOIS #5: CASPER YU & MICHAEL" → both; "Special
 * Guest: Michael" → ["Michael"]; "RADARVERSE #04 WITH NUSHA" → ["NUSHA"]. The names after the
 * title's last colon, or after "with", when they read as names: a few words each, none only numbers.
 */
export function lineupInTitle(title: string): string[] {
  const colon = title.lastIndexOf(':');
  const cue = colon < 0 ? /\b(?:with|w\/|ft\.?|feat\.?)\s+(.+)$/i.exec(title) : null;
  if (colon < 0 && !cue) return [];
  const tail = (colon >= 0 ? title.slice(colon + 1) : cue![1]).trim();
  if (!tail || tail.length > 80) return [];
  const names = tail.split(/\s*(?:&|,|\+|\bb2b\b|\bx\b|\bvs\.?\b|\band\b|\bft\.?\b|\bfeat\.?\b)\s*/i).map((n) => n.trim()).filter(Boolean);
  if (!names.length || names.length > 6) return [];
  if (!names.every((n) => n.length >= 2 && n.length <= 40 && !/^\d+$/.test(n) && n.split(/\s+/).length <= 4)) return [];
  return [...new Set(names)];
}

export const wordpressAdapter: SourceAdapter = {
  id: 'wordpress',

  async discover(source: IngestSource, io: IngestIO): Promise<DiscoverResult> {
    if (!source.url) return { records: [], errors: ['no_url'] };
    const config = source.config as WordPressConfig;
    const url = postsUrl(source.url, config);
    if (!url) return { records: [], errors: ['bad_config'] };
    const headers: Record<string, string> = {};
    if (source.etag) headers['if-none-match'] = source.etag;
    if (source.last_modified) headers['if-modified-since'] = source.last_modified;
    const res = await io.fetchText(url, { headers, accept: 'application/json' });
    if (res.status === 304) return { records: [], notModified: true };
    const contentHash = sha256(res.text);
    const meta = { etag: res.etag, lastModified: res.lastModified, contentHash };
    if (contentHash === source.content_hash) return { records: [], notModified: true, ...meta };
    const posts = parsePosts(res.text);
    if (!posts) return { records: [], errors: ['not_wordpress'], ...meta };
    const host = hostOf(source.url) ?? 'wordpress';
    const type = String(config.type ?? 'event');
    return { records: posts.map((p) => ({ externalId: `${host}:${type}:${p.id}`, url: p.link, payload: p })), ...meta };
  },

  normalize(raw: RawRecord, ctx: NormalizeContext) {
    const post = raw.payload as WpPost;
    const config = ctx.source.config as WordPressConfig;
    const heading = cleanText(post.title, 200) ?? '';
    const body = cleanText(post.content, 6000) ?? '';
    // The date from the title first ("… | Saturday, 17.10"), and that part leaves the title.
    const inTitle = dateInText(heading, post.date);
    const title = inTitle ? withoutDate(heading, inTitle) : heading;
    const when = inTitle ?? dateInText(body, post.date);
    const time = timeInText(heading) ?? timeInText(body);
    const { price, free } = priceInText(body);
    const venue = cleanText(config.venue, 160) ?? ctx.source.name;
    const address = cleanText(config.address, 240);
    return finalize({
      title: decodeEntities(title),
      description: body,
      start: when ? (time ? `${when.date}T${time}` : when.date) : null,
      venueName: venue,
      address,
      cityTexts: [address],
      lineup: lineupInTitle(title),
      imageUrl: cleanUrl(post.image, post.link),
      ticketUrl: post.link,
      eventUrl: post.link,
      price,
      free: free || null,
      cancelled: /(?<![\p{L}])(cancell?ed|postponed|hủy|huỷ|hoãn)(?![\p{L}])/iu.test(heading),
      organizerName: venue,
    }, { now: ctx.now, fallbackCity: ctx.source.city });
  },
};
