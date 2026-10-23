import Anthropic from '@anthropic-ai/sdk';
import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import { json, many, one } from '../db/index.ts';
import { AppError } from '../lib/errors.ts';
import { classifyStyles } from '../lib/styles.ts';
import { styleItem } from './artists.ts';
import { PageUnavailable } from './fetchpage.ts';
import { politeIO } from './ingest/fetch.ts';
import type { IngestIO } from './ingest/types.ts';
import { probeImage } from './remote-images.ts';

/*
 * The news feed (migration 063, owner 2026-10-22): the latest headlines of reputable EDM
 * publications, read from the RSS and Atom feeds they publish for syndication, and shown on
 * the blog's news page with the picture each feed carries, every item linking to the publisher.
 *
 *   - `fetchDueNews` (the fetchNews job) reads each enabled source on its own interval with
 *     conditional headers (an unchanged feed costs nothing), through the same polite fetcher as
 *     ingestion, and keeps every item by (source, guid): the title and the feed's own summary,
 *     clipped to 300 characters, never the article's text. A feed is published to be read by
 *     feed readers, so robots.txt (written for crawlers) is not asked for it; the article's page
 *     is read only for its preview picture, through the same checks as every linked image.
 *   - Each item is sorted by topic (festival, artist, industry, tech, scene) and region
 *     (vietnam, asia, global) from its words, and by the site's styles (lib/styles.ts).
 *   - `digestPending` (the digestNews job) writes a two-sentence digest in English and
 *     Vietnamese from the title and summary alone when Claude is configured (ANTHROPIC_API_KEY),
 *     and the page says it is machine-written. Without it the page shows the feed's summary.
 *   - The team switches a source on or off and hides an item (/console/news). Items older than
 *     six months are purged: they are headlines that point elsewhere, not FeestFinder's words.
 */

export const NEWS_TOPICS = ['festival', 'artist', 'industry', 'tech', 'scene'] as const;
export type NewsTopic = (typeof NEWS_TOPICS)[number];
export const NEWS_REGIONS = ['global', 'asia', 'vietnam'] as const;
export type NewsRegion = (typeof NEWS_REGIONS)[number];

/** How long an item stays: after this it is purged. */
export const KEEP_DAYS = 180;
/** The feed's summary is clipped to this many characters. */
export const SUMMARY_MAX = 300;
/** Pictures looked up per fetch run (one request each; the rest wait for the next run). */
const PICTURES_PER_RUN = 30;

// ---- reading a feed ------------------------------------------------------------------------

export interface FeedItem {
  guid: string;
  url: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  author: string | null;
  publishedAt: Date | null;
  categories: string[];
}
export interface Feed { title: string | null; items: FeedItem[] }

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  copy: '©', reg: '®', trade: '™', eacute: 'é', egrave: 'è', agrave: 'à', aacute: 'á', ouml: 'ö', uuml: 'ü', auml: 'ä', ntilde: 'ñ', ccedil: 'ç', oacute: 'ó', iacute: 'í', uacute: 'ú',
};
/** XML and HTML entities as characters (numeric ones, and the named ones feeds use). */
export const decodeEntities = (s: string) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n: string) => NAMED[n.toLowerCase()] ?? m);

/** A tag's text: the CDATA inside it, else its entities decoded. */
const unwrap = (s: string) => {
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(s);
  return cdata ? cdata[1] : decodeEntities(s);
};
const esc = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The inner text of the first <name> element in a block (CDATA unwrapped, entities decoded). */
function tag(block: string, name: string): string | null {
  const m = new RegExp(`<${esc(name)}(?:\\s[^>]*)?>([\\s\\S]*?)</${esc(name)}\\s*>`, 'i').exec(block);
  return m ? unwrap(m[1]) : null;
}
/** Every <name …> tag (opening or self-closing) in a block, as written. */
function tags(block: string, name: string): string[] {
  return [...block.matchAll(new RegExp(`<${esc(name)}(?:\\s[^>]*)?/?>`, 'gi'))].map((m) => m[0]);
}
function attr(tagText: string, name: string): string | null {
  const m = new RegExp(`\\s${esc(name)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tagText);
  return m ? decodeEntities(m[1] ?? m[2] ?? '') : null;
}
/** HTML as one line of plain text. */
export const plainText = (html: string) => decodeEntities(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
/** The first `max` characters, cut at a word. */
export const clipText = (s: string, max: number) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1) > max / 2 ? s.lastIndexOf(' ', max - 1) : max - 1).replace(/[,;:·–-]\s*$/, '') + '…');

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;
const httpsOnly = (u: string | null) => (u && /^https:\/\/\S+$/.test(u.trim()) ? u.trim() : null);

/** The picture a feed item carries: media:content, media:thumbnail, an image enclosure, else the first <img> in its words. */
function imageOf(block: string, html: string): string | null {
  const media = tags(block, 'media:content').map((t) => ({ url: attr(t, 'url'), medium: attr(t, 'medium'), type: attr(t, 'type') }))
    .filter((m) => m.url && (m.medium === 'image' || (m.type ?? '').startsWith('image/') || IMAGE_EXT.test(m.url)));
  const thumb = tags(block, 'media:thumbnail').map((t) => attr(t, 'url'));
  const enclosure = tags(block, 'enclosure').map((t) => ({ url: attr(t, 'url'), type: attr(t, 'type') })).filter((e) => e.url && ((e.type ?? '').startsWith('image/') || IMAGE_EXT.test(e.url)));
  const itunes = tags(block, 'itunes:image').map((t) => attr(t, 'href'));
  const img = /<img\s[^>]*src\s*=\s*["']([^"']+)["']/i.exec(html)?.[1] ?? null;
  for (const u of [media[0]?.url, enclosure[0]?.url, thumb[0], itunes[0], img]) {
    const ok = httpsOnly(u ?? null);
    if (ok) return ok;
  }
  return null;
}

function linkOf(block: string): string | null {
  // RSS: <link>text</link>. Atom: <link rel="alternate" href="…"/>, or the first <link href>.
  const text = tag(block, 'link');
  if (text && /^https?:\/\//.test(text.trim())) return text.trim();
  const links = tags(block, 'link').map((t) => ({ href: attr(t, 'href'), rel: attr(t, 'rel') ?? 'alternate' }));
  return links.find((l) => l.href && l.rel === 'alternate')?.href ?? links.find((l) => l.href)?.href ?? null;
}

function dateOf(block: string): Date | null {
  for (const n of ['pubDate', 'published', 'dc:date', 'updated', 'lastBuildDate']) {
    const s = tag(block, n);
    if (!s) continue;
    const d = new Date(s.trim());
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/** An RSS 2.0 or Atom document as its items; an empty list when it is neither. */
export function parseFeed(xml: string): Feed {
  const src = xml.replace(/^﻿/, '');
  const blocks = [...src.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1\s*>/gi)].map((m) => m[2]);
  const first = src.search(/<(item|entry)(?:\s[^>]*)?>/i);
  const head = first < 0 ? src : src.slice(0, first);
  const title = tag(head, 'title');
  const items: FeedItem[] = [];
  for (const b of blocks) {
    const url = linkOf(b);
    const rawTitle = tag(b, 'title');
    if (!url || !rawTitle || !/^https?:\/\//.test(url)) continue;
    const content = tag(b, 'content:encoded') ?? tag(b, 'content') ?? '';
    const description = tag(b, 'description') ?? tag(b, 'summary') ?? '';
    const words = plainText(description || content);
    const author = tag(b, 'dc:creator') ?? tag(b, 'author')?.replace(/^.*\((.*)\)\s*$/, '$1') ?? null;
    const categories = [...tags(b, 'category').map((t) => attr(t, 'term')), ...(b.match(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi) ?? []).map((t) => plainText(unwrap(t.replace(/^<category[^>]*>/i, '').replace(/<\/category>$/i, ''))))]
      .filter((c): c is string => !!c && c.trim().length > 0).map((c) => c.trim());
    items.push({
      guid: (tag(b, 'guid') ?? tag(b, 'id') ?? url).trim(),
      url: url.trim(),
      title: plainText(rawTitle).slice(0, 300),
      summary: words ? clipText(words, SUMMARY_MAX) : null,
      imageUrl: imageOf(b, `${content}\n${description}`),
      author: author ? plainText(author).slice(0, 120) || null : null,
      publishedAt: dateOf(b),
      categories: [...new Set(categories)].slice(0, 12),
    });
  }
  return { title: title ? plainText(title) : null, items };
}

// ---- sorting an item -----------------------------------------------------------------------

const TOPIC_WORDS: [NewsTopic, string[]][] = [
  ['festival', ['festival', 'festivals', 'lineup', 'lineups', 'line up', 'headliner', 'headliners', 'headline', 'headlines', 'tomorrowland', 'ultra', 'edc', 'creamfields', 'amsterdam dance event', 'ade', 'awakenings', 'defqon', 'coachella', 'mysteryland', 'sónar', 'sonar', 'wonderfruit', 'epizode', 'djakarta warehouse project', 'dwp', 'zoukout', 'rave', 'raves', 'open air', 'stages', 'tickets on sale', 'sold out', 'weekender', 'movement', 'lễ hội', 'đại nhạc hội', 'sân khấu']],
  ['tech', ['artificial intelligence', 'ai', 'cdj', 'cdjs', 'controller', 'controllers', 'rekordbox', 'serato', 'traktor', 'pioneer dj', 'alphatheta', 'native instruments', 'ableton', 'fl studio', 'plugin', 'plugins', 'plug in', 'synth', 'synths', 'synthesizer', 'software', 'spotify', 'apple music', 'streaming', 'stems', 'stem separation', 'headphones', 'mixer', 'mixers', 'gear', 'firmware', 'turntable', 'turntables', 'sampler', 'daw', 'tiktok', 'youtube', 'app', 'apps', 'trí tuệ nhân tạo', 'công nghệ', 'ứng dụng', 'phần mềm']],
  ['industry', ['label', 'labels', 'signs to', 'acquisition', 'acquires', 'acquired', 'lawsuit', 'court', 'royalties', 'royalty', 'ticketmaster', 'live nation', 'revenue', 'report', 'ims business report', 'beatport', 'bandcamp', 'soundcloud', 'ceo', 'layoffs', 'funding', 'partnership', 'deal', 'regulation', 'ban', 'banned', 'licence', 'license', 'tax', 'visa', 'police', 'arrest', 'arrested', 'drug', 'drugs', 'safety', 'closes', 'closing', 'closure', 'shut', 'shuts', 'reopen', 'reopens', 'opens', 'opening', 'quy định', 'nghị định', 'giấy phép', 'thí điểm', 'giờ mở cửa', 'đóng cửa', 'công an', 'ma túy', 'doanh thu', 'bán vé', 'vé']],
  ['artist', ['album', 'albums', 'ep', 'single', 'remix', 'remixes', 'release', 'releases', 'released', 'drops', 'tour', 'tours', 'residency', 'b2b', 'collab', 'collaboration', 'interview', 'essential mix', 'boiler room', 'announces', 'announced', 'retires', 'retirement', 'dies', 'death', 'died', 'rip', 'new track', 'premiere', 'video', 'mix', 'podcast', 'set', 'live from', 'debut', 'debuts', 'ra mắt', 'phát hành', 'lưu diễn', 'nghệ sĩ', 'ca sĩ']],
];
const VIETNAM = ['vietnam', 'việt nam', 'viet nam', 'saigon', 'sài gòn', 'sai gon', 'ho chi minh', 'hồ chí minh', 'hanoi', 'hà nội', 'ha noi', 'da nang', 'đà nẵng', 'danang', 'phu quoc', 'phú quốc', 'nha trang', 'vinahouse', 'hcmc', 'vietnamese'];
const ASIA = ['asia', 'asian', 'bangkok', 'thailand', 'thai', 'pattaya', 'phuket', 'singapore', 'tokyo', 'japan', 'japanese', 'osaka', 'seoul', 'korea', 'korean', 'bali', 'jakarta', 'indonesia', 'kuala lumpur', 'malaysia', 'hong kong', 'shanghai', 'beijing', 'shenzhen', 'china', 'chinese', 'taipei', 'taiwan', 'manila', 'philippines', 'india', 'goa', 'mumbai', 'macau', 'cambodia', 'laos'];

/** Words as whole words: lower case, every run of punctuation one space, a space at each end. */
const padded = (s: string) => ` ${s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
const hasWord = (t: string, w: string) => t.includes(padded(w));

/** The topic an item's words name, the first of the list that matches; `scene` when none does. */
export function topicOf(text: string): NewsTopic {
  const t = padded(text);
  for (const [topic, words] of TOPIC_WORDS) if (words.some((w) => hasWord(t, w))) return topic;
  return 'scene';
}
/** Vietnam when the words name it, Asia when they name the region, else where the publication writes from. */
export function regionOf(text: string, sourceRegion: NewsRegion): NewsRegion {
  const t = padded(text);
  if (VIETNAM.some((w) => hasWord(t, w))) return 'vietnam';
  if (ASIA.some((w) => hasWord(t, w))) return 'asia';
  return sourceRegion;
}

// ---- the digest ----------------------------------------------------------------------------

export interface Digest { en: string; vi: string }
export interface NewsDigester {
  readonly enabled: boolean;
  digest(input: { title: string; summary: string | null; publisher: string }): Promise<Digest>;
}
export class DisabledDigester implements NewsDigester {
  readonly enabled = false;
  async digest(): Promise<Digest> { throw new Error('digests are off'); }
}

export const DIGEST_SYSTEM = `You write FeestFinder's news digest. FeestFinder lists electronic dance music events in Vietnam and Asia. From a headline and the publisher's own summary, write what the news is in two short sentences in English and the same in natural Vietnamese, for people who go out to EDM nights. Use only what the headline and summary say: add no fact, no date, no name and no opinion, and do not copy the summary word for word. Keep artist, festival, venue and company names as written. Answer with JSON only: {"en": "...", "vi": "..."}.`;

export class ClaudeDigester implements NewsDigester {
  readonly enabled = true;
  private readonly model: string;
  private readonly client: Anthropic;
  constructor(model: string, client = new Anthropic()) { this.model = model; this.client = client; }

  async digest(input: { title: string; summary: string | null; publisher: string }): Promise<Digest> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 600,
      system: DIGEST_SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify({ publisher: input.publisher, headline: input.title, summary: input.summary ?? '' }) }],
    });
    const out = res.content.filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
    const m = /\{[\s\S]*\}/.exec(out);
    if (!m) throw new Error('digest: no JSON');
    const parsed = JSON.parse(m[0]) as Partial<Digest>;
    const en = (parsed.en ?? '').trim(), vi = (parsed.vi ?? '').trim();
    if (!en || !vi || en.length > 600 || vi.length > 600) throw new Error('digest: empty or too long');
    return { en, vi };
  }
}

/** Items without a digest, the newest first, a few per run. */
export async function digestPending(ctx: Ctx, limit = 20): Promise<{ written: number; failed: number }> {
  if (!ctx.digester.enabled) return { written: 0, failed: 0 };
  const rows = await many<{ id: string; title: string; summary: string | null; publisher: string }>(ctx.db,
    `select i.id, i.title, i.summary, s.name as publisher from news_items i join news_sources s on s.id = i.source_id
      where i.digest is null and i.hidden_at is null order by i.published_at desc limit $1`, [limit]);
  let written = 0, failed = 0;
  for (const r of rows) {
    try {
      const d = await ctx.digester.digest(r);
      await ctx.db.query(`update news_items set digest = $2, updated_at = $3 where id = $1 and digest is null`, [r.id, json(d), ctx.clock.now()]);
      written++;
    } catch (e) {
      failed++;
      ctx.log(`news digest ${r.id}: ${(e as Error).message}`);
    }
  }
  return { written, failed };
}

// ---- fetching ------------------------------------------------------------------------------

export interface NewsSourceRow {
  id: string; name: string; site_url: string; feed_url: string; lang: string; region: NewsRegion; enabled: boolean; interval_minutes: number;
  etag: string | null; last_modified: string | null; next_run_at: Date; last_run_at: Date | null; last_error: string | null; last_count: number | null;
}
export interface FetchSummary { sourceId: string; name: string; fetched: number; added: number; updated: number; notModified: boolean; pictures: number; error: string | null }

const ACCEPT = 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.5';
export const ioFor = (ctx: Ctx): IngestIO => ctx.ingestIO?.() ?? politeIO(ctx.clock.now());

/** One source read now: its new and changed items kept, its pictures looked up, its run recorded. */
export async function fetchNewsSource(ctx: Ctx, sourceId: string, opts: { io?: IngestIO } = {}): Promise<FetchSummary> {
  const now = ctx.clock.now();
  const s = await one<NewsSourceRow>(ctx.db, 'select * from news_sources where id = $1', [sourceId]);
  if (!s) throw new Error(`news source ${sourceId} not found`);
  const io = opts.io ?? ioFor(ctx);
  const sum: FetchSummary = { sourceId, name: s.name, fetched: 0, added: 0, updated: 0, notModified: false, pictures: 0, error: null };
  const next = new Date(now.getTime() + s.interval_minutes * 60_000);
  try {
    const headers: Record<string, string> = {};
    if (s.etag) headers['if-none-match'] = s.etag;
    if (s.last_modified) headers['if-modified-since'] = s.last_modified;
    const res = await io.fetchText(s.feed_url, { accept: ACCEPT, headers, api: true });
    if (res.status === 304) {
      sum.notModified = true;
    } else {
      const feed = parseFeed(res.text);
      if (!feed.items.length && !/<(rss|feed|rdf:RDF)[\s>]/i.test(res.text)) throw new PageUnavailable('upstream', 'not a feed');
      sum.fetched = feed.items.length;
      const oldest = new Date(now.getTime() - KEEP_DAYS * 24 * 3600_000);
      for (const [i, it] of feed.items.entries()) {
        // A feed without dates (Mixmag's) keeps its order: the first item is the newest.
        const at = it.publishedAt ?? new Date(now.getTime() - i * 1000);
        if (at < oldest) continue;
        const words = `${it.title}. ${it.summary ?? ''} ${it.categories.join(' ')}`;
        const topic = topicOf(words), region = regionOf(words, s.region);
        const styles = classifyStyles({ title: it.title, description: it.summary, tags: it.categories });
        // A headline the publisher rewrote keeps its place and loses its digest, which is written again.
        const old = await one<{ title: string; summary: string | null }>(ctx.db, 'select title, summary from news_items where source_id = $1 and guid = $2', [s.id, it.guid]);
        const changed = !!old && (old.title !== it.title || (!!it.summary && old.summary !== it.summary));
        await ctx.db.query(
          `insert into news_items (source_id, guid, url, title, summary, image_url, image_from, author, topic, region, styles, published_at, fetched_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,null,$7,$8,$9,$10,$11,$12,$12)
           on conflict (source_id, guid) do update
             set title = excluded.title, summary = coalesce(excluded.summary, news_items.summary), url = excluded.url, author = coalesce(excluded.author, news_items.author),
                 topic = excluded.topic, region = excluded.region, styles = excluded.styles, image_url = coalesce(news_items.image_url, excluded.image_url),
                 digest = case when $13 then null else news_items.digest end,
                 updated_at = case when $13 then excluded.updated_at else news_items.updated_at end`,
          [s.id, it.guid, it.url, it.title, it.summary, it.imageUrl, it.author, topic, region, styles, at, now, changed]);
        if (!old) sum.added++;
        else if (changed) sum.updated++;
      }
      await ctx.db.query(`update news_sources set etag = $2, last_modified = $3 where id = $1`, [s.id, res.etag ?? null, res.lastModified ?? null]);
    }
    await ctx.db.query(`update news_sources set last_run_at = $2, next_run_at = $3, last_error = null, last_count = $4, updated_at = $2 where id = $1`, [s.id, now, next, sum.notModified ? s.last_count : sum.fetched]);
  } catch (e) {
    sum.error = (e as Error).message.slice(0, 300);
    // A source that failed waits a full interval too, and says why in the Console.
    await ctx.db.query(`update news_sources set last_run_at = $2, next_run_at = $3, last_error = $4, updated_at = $2 where id = $1`, [s.id, now, next, sum.error]);
    ctx.log(`news ${s.name}: ${sum.error}`);
  }
  sum.pictures = await pictureItems(ctx, s.id);
  return sum;
}

/**
 * The picture of each item that has none yet: the feed's, checked, else the preview picture of the
 * article's page, through the checks every linked image passes (services/remote-images.ts). An item
 * whose picture cannot be found or opened is marked, so it is never looked up again.
 */
async function pictureItems(ctx: Ctx, sourceId: string, max = PICTURES_PER_RUN): Promise<number> {
  const rows = await many<{ id: string; url: string; image_url: string | null; image_from: string | null }>(ctx.db,
    `select id, url, image_url, image_from from news_items where source_id = $1 and hidden_at is null and image_from is null
     order by published_at desc limit $2`, [sourceId, max]);
  let found = 0;
  for (const r of rows) {
    const candidates = [r.image_url, r.url].filter((u): u is string => !!u);
    let picked: string | null = null;
    for (const u of candidates) {
      try {
        picked = (await probeImage(ctx, u, 'news')).url;
        break;
      } catch (e) {
        if (!(e instanceof AppError) && !(e instanceof PageUnavailable)) throw e;
      }
    }
    await ctx.db.query(`update news_items set image_url = $2, image_from = $3 where id = $1`, [r.id, picked, picked ? (picked === r.image_url ? 'feed' : 'page') : 'none']);
    if (picked) found++;
  }
  return found;
}

/** Sources due now, one after another until the time budget is spent; then the purge. */
export async function fetchDueNews(ctx: Ctx, opts: { budgetMs?: number; io?: IngestIO } = {}): Promise<FetchSummary[]> {
  const started = Date.now();
  const budget = opts.budgetMs ?? 40_000;
  const due = await many<{ id: string }>(ctx.db, `select id from news_sources where enabled and next_run_at <= $1 order by next_run_at limit 10`, [ctx.clock.now()]);
  const out: FetchSummary[] = [];
  for (const s of due) {
    if (budget - (Date.now() - started) < 5_000) break;
    out.push(await fetchNewsSource(ctx, s.id, { io: opts.io }));
  }
  await purgeNews(ctx.db, ctx.clock.now());
  return out;
}

/** Items past their keep: headlines that point elsewhere, gone after six months. */
export async function purgeNews(q: Queryable, now: Date): Promise<number> {
  const rows = await many(q, `delete from news_items where published_at < $1 returning 1`, [new Date(now.getTime() - KEEP_DAYS * 24 * 3600_000)]);
  return rows.length;
}

// ---- presenting ----------------------------------------------------------------------------

export interface NewsItemRow {
  id: string; source_id: string; guid: string; url: string; title: string; summary: string | null; digest: Digest | null; image_url: string | null; image_from: string | null;
  author: string | null; topic: NewsTopic; region: NewsRegion; styles: string[]; published_at: Date; fetched_at: Date; updated_at: Date; hidden_at: Date | null;
  source_name: string; site_url: string; source_lang: string;
}

export const NEWS_ITEM = `select i.*, s.name as source_name, s.site_url, s.lang as source_lang from news_items i join news_sources s on s.id = i.source_id`;

const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

export function presentNewsItem(r: NewsItemRow) {
  return {
    id: r.id,
    title: r.title,
    url: r.url,
    summary: r.summary,
    /** Machine-written from the title and summary (the page says so); null until written. */
    digest: r.digest,
    /** The feed's picture or the article's own preview, once checked (services/remote-images.ts); null before that or when none opens. */
    imageUrl: r.image_from === 'feed' || r.image_from === 'page' ? r.image_url : null,
    author: r.author,
    topic: r.topic,
    region: r.region,
    styles: r.styles.map(styleItem),
    publishedAt: r.published_at,
    hidden: !!r.hidden_at,
    source: { name: r.source_name, siteUrl: r.site_url, host: hostOf(r.url), lang: r.source_lang },
  };
}
export type NewsItem = ReturnType<typeof presentNewsItem>;

export function presentNewsSource(r: NewsSourceRow & { items?: number; hidden?: number }) {
  return {
    id: r.id, name: r.name, siteUrl: r.site_url, feedUrl: r.feed_url, lang: r.lang, region: r.region, enabled: r.enabled, intervalMinutes: r.interval_minutes,
    nextRunAt: r.next_run_at, lastRunAt: r.last_run_at, lastError: r.last_error, lastCount: r.last_count, items: r.items ?? 0, hidden: r.hidden ?? 0,
  };
}
