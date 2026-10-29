import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import type { Row } from '../db/rows.ts';
import { many, one } from '../db/index.ts';
import { initialsOf, slugify } from '../lib/contact.ts';
import { randomCode } from '../lib/crypto.ts';
import { badRequest } from '../lib/errors.ts';
import { L, type Localized } from '../lib/i18n.ts';
import {
  EMBED_HOSTS, embedFrom, MIX_PROVIDERS, playerHeight, TRACK_LABEL, youtubeEmbed, youtubeId, youtubeOembed, youtubeWatch,
  type MixKind, type TrackProvider,
} from '../lib/mixes.ts';
import { cityLabel } from '../lib/places.ts';
import { styleItem } from './artists.ts';
import { resolveMix } from './mixes.ts';
import { PageUnavailable } from './fetchpage.ts';

/*
 * The blog (migration 060): posts about music styles, music news, shared playlists, DJ skills,
 * and round-ups and reviews of clubs and cafés, in Vietnamese and English. Anyone signed in writes,
 * the team reviews a post before it is public, and a post the team writes is public at once.
 * Guides (a genre's page) add quick facts, questions and answers and their sources. A post's
 * tracks are players from SoundCloud, Mixcloud, Spotify and YouTube, rebuilt by FeestFinder from a
 * link or a pasted embed code (lib/mixes.ts): no service's HTML is kept, and nothing loads before
 * someone presses play.
 */

export const BLOG_CATEGORIES = ['styles', 'news', 'playlist', 'dj', 'venues'] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<BlogCategory, Localized> = {
  styles: L('Music styles', 'Dòng nhạc'),
  news: L('News', 'Tin tức'),
  playlist: L('Playlists', 'Playlist'),
  dj: L('DJ skills', 'Kỹ năng DJ'),
  venues: L('Clubs & cafés', 'Club & cafe'),
};

export const TRACKS_MAX = 20;
export const EDITORIAL = 'FeestFinder';

/** The pages a post's slug cannot take (they are /blog's own). */
const RESERVED = new Set(['new', 'mine', 'en', 'th', 'ja', 'id', 'category']);

export async function newPostSlug(q: Queryable, title: string): Promise<string> {
  const base = slugify(title).slice(0, 80).replace(/-+$/, '') || 'bai-viet';
  let slug = RESERVED.has(base) || base.length < 3 ? `${base}-bai-viet` : base;
  while (await one(q, 'select 1 from blog_posts where slug = $1', [slug])) slug = `${base}-${randomCode(4).toLowerCase()}`;
  return slug;
}

export const pairOf = (v: unknown): Localized => {
  const o = (v ?? {}) as Partial<Localized>;
  return { en: typeof o.en === 'string' ? o.en : '', vi: typeof o.vi === 'string' ? o.vi : '' };
};
/** The longer of a pair's two languages: what "is it written" measures. */
const longest = (p: Localized) => (p.vi.trim().length >= p.en.trim().length ? p.vi : p.en);

/** Why a draft cannot go to review yet, or an empty list. One language is enough to send it. */
export function missingForReview(p: { title: unknown; body: unknown; category: string }, tracks: number): Localized[] {
  const out: Localized[] = [];
  const title = longest(pairOf(p.title)), body = longest(pairOf(p.body));
  if (title.trim().length < 8) out.push(L('A title of 8 characters or more', 'Tiêu đề từ 8 ký tự'));
  // A playlist can be mostly its tracks; every other post is mostly words.
  if (p.category === 'playlist' ? !tracks && body.trim().length < 80 : body.trim().length < 300) {
    out.push(p.category === 'playlist' ? L('A track, or a few lines about the playlist', 'Một bài nhạc, hoặc vài dòng về playlist') : L('The post, in 300 characters or more', 'Nội dung bài, từ 300 ký tự'));
  }
  return out;
}

/** A post as `POST` reads it: the row, its author's name and how many tracks it has. */
export type PostRow = Row<'blog_posts'> & { author_name?: string | null; author_email?: string | null; track_count?: number };
export type TrackRow = Row<'blog_tracks'>;

export interface PostViewer { userId: string | null; isAdmin: boolean }
export interface Fact { label: Localized; value: Localized }
export interface Faq { q: Localized; a: Localized }
export interface Source { title: string; url: string; publisher?: string }

/** A track as the pages show it: `playSrc` starts on its own, so the page loads it when someone presses play. */
export function presentTrack(t: TrackRow) {
  const provider = t.provider as TrackProvider;
  const src = String(t.embed_src);
  return {
    id: t.id as string,
    provider,
    providerLabel: TRACK_LABEL[provider],
    kind: t.kind as string,
    url: t.url as string | null,
    playSrc: src.replace('{autoplay}', provider === 'mixcloud' || provider === 'youtube' ? '1' : 'true'),
    /** A video plays 16:9 across the column; the music players keep their own height. */
    height: provider === 'youtube' ? null : playerHeight(provider, t.kind as MixKind),
    title: t.title as string,
    authorName: t.author_name as string | null,
    thumbnailUrl: t.thumbnail_url as string | null,
    year: t.year as number | null,
    note: pairOf(t.note),
  };
}

/** Minutes to read, at 200 words a minute; at least one. */
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / 200));

const clipText = (s: string, n: number) => {
  const plain = s.replace(/^#+\s*/gm, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').replace(/^\|.*\|$/gm, '').replace(/\s+/g, ' ').trim();
  return plain.length <= n ? plain : plain.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
};

export function presentPost(p: PostRow, opts: { tracks?: TrackRow[]; viewer?: PostViewer; full?: boolean; parent?: { slug: string; title: unknown } | null; children?: { slug: string; title: unknown }[] } = {}) {
  const mine = !!opts.viewer && ((!!p.author_user_id && opts.viewer.userId === p.author_user_id) || opts.viewer.isAdmin);
  const category = p.category as BlogCategory;
  const title = pairOf(p.title), body = pairOf(p.body), given = pairOf(p.excerpt);
  const excerpt: Localized = { en: given.en || clipText(body.en, 200), vi: given.vi || clipText(body.vi, 200) };
  const trackCount = Number(p.track_count ?? opts.tracks?.length ?? 0);
  return {
    id: p.id as string,
    slug: p.slug as string,
    category: { key: category, label: CATEGORY_LABEL[category] },
    lang: p.lang as 'vi' | 'en',
    title,
    excerpt,
    ...(opts.full ? { body } : {}),
    coverUrl: p.cover_url as string | null,
    coverCredit: (p.cover_credit as string | null) ?? null,
    styles: (p.styles as string[]).map(styleItem),
    city: p.city ? { slug: p.city as string, label: cityLabel(p.city) } : null,
    status: p.status as string,
    author: { name: (p.author_name as string | null)?.trim() || (p.byline as string | null) || EDITORIAL, initials: initialsOf(p.author_name || p.byline || 'FF'), editorial: !p.author_user_id },
    minutes: { en: readingMinutes(body.en), vi: readingMinutes(body.vi) },
    trackCount,
    tracks: (opts.tracks ?? []).map(presentTrack),
    facts: (p.facts as Fact[] ?? []).map((f) => ({ label: pairOf(f.label), value: pairOf(f.value) })),
    faq: (p.faq as Faq[] ?? []).map((f) => ({ q: pairOf(f.q), a: pairOf(f.a) })),
    sources: (p.sources as Source[] ?? []).filter((s) => /^https:\/\//.test(s.url)),
    parent: opts.parent ? { slug: opts.parent.slug, title: pairOf(opts.parent.title) } : null,
    children: (opts.children ?? []).map((c) => ({ slug: c.slug, title: pairOf(c.title) })),
    publishedAt: p.published_at as Date | null,
    updatedAt: p.updated_at as Date,
    ...(mine ? { mine: true, decisionNote: p.decision_note as string | null, missing: p.status === 'draft' || p.status === 'rejected' ? missingForReview(p, trackCount) : [] } : {}),
  };
}

/**
 * A post in GET /posts: only what a card draws (festfinder-web kd/web/blog/card.tsx). The facts,
 * questions and sources, both languages of each, made /blog's first page 137 KB of JSON and its
 * HTML 51 KB; the post's own address gives the rest.
 */
export function presentCard(p: PostRow) {
  const { id, slug, category, lang, title, excerpt, coverUrl, author, minutes, trackCount, publishedAt } = presentPost(p);
  return { id, slug, category, lang, title, excerpt, coverUrl, author, minutes, trackCount, publishedAt };
}

export const POST = `select b.*, u.name as author_name, (select count(*)::int from blog_tracks t where t.post_id = b.id) as track_count
  from blog_posts b left join users u on u.id = b.author_user_id`;

/** A post with its tracks, the guide above it and the published guides under it. */
export async function loadPost(q: Queryable, where: { slug?: string; id?: string }) {
  const p = await one<PostRow>(q, `${POST} where ${where.id ? 'b.id = $1' : 'b.slug = $1'}`, [where.id ?? where.slug]);
  if (!p) return null;
  const [tracks, parent, children] = await Promise.all([
    many<TrackRow>(q, 'select * from blog_tracks where post_id = $1 order by sort, created_at', [p.id]),
    p.parent_id ? one<{ slug: string; title: unknown }>(q, `select slug, title from blog_posts where id = $1 and status = 'published'`, [p.parent_id]) : null,
    many<{ slug: string; title: unknown }>(q, `select slug, title from blog_posts where parent_id = $1 and status = 'published' order by published_at`, [p.id]),
  ]);
  return { p, tracks, parent, children };
}

const notATrack = () => badRequest('invalid_track', L('Paste a SoundCloud, Mixcloud, Spotify or YouTube link, or its embed code', 'Hãy dán link SoundCloud, Mixcloud, Spotify hoặc YouTube, hoặc mã nhúng của nó'));

/** A YouTube video, as YouTube's oEmbed describes it; refused when it cannot be embedded. */
async function youtubeTrack(ctx: Ctx, id: string, title: string | null) {
  let answer: Record<string, unknown>;
  try {
    answer = await ctx.oembed(youtubeOembed(id));
  } catch (e) {
    if (e instanceof PageUnavailable || e instanceof SyntaxError || e instanceof TypeError) {
      throw badRequest('track_unavailable', L('YouTube does not let this video be played elsewhere; check it is public', 'YouTube không cho phát video này ở nơi khác; hãy kiểm tra nó đang công khai'));
    }
    throw e;
  }
  const text = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
  const thumb = typeof answer.thumbnail_url === 'string' && /^https:\/\/i\.ytimg\.com\//.test(answer.thumbnail_url) ? answer.thumbnail_url : null;
  return {
    provider: 'youtube' as const, kind: 'video', url: youtubeWatch(id), embedSrc: youtubeEmbed(id),
    title: title || text(answer.title, 200) || 'YouTube', authorName: text(answer.author_name, 120), thumbnailUrl: thumb,
  };
}

/**
 * A pasted link or embed code as a track. A link is read through the service's oEmbed endpoint
 * (services/mixes.ts); an embed code gives only its player's address, which must be on one of the
 * services' own player hosts and is rebuilt like any other. The HTML itself is never kept.
 */
export async function resolveTrack(ctx: Ctx, raw: string, title: string | null) {
  const input = raw.trim();
  if (/<iframe\b/i.test(input)) {
    const src = input.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]?.replaceAll('&amp;', '&');
    if (!src) throw notATrack();
    const video = youtubeId(src);
    if (video) return youtubeTrack(ctx, video, title);
    let host: string;
    try { host = new URL(src).hostname.toLowerCase(); } catch { throw notATrack(); }
    const provider = MIX_PROVIDERS.find((p) => EMBED_HOSTS[p].includes(host));
    if (!provider) throw notATrack();
    let embed: { src: string; kind: MixKind };
    try { embed = embedFrom(provider, { iframe_url: src }); } catch { throw notATrack(); }
    const page = provider === 'spotify' ? embed.src.replace('/embed/', '/').replace(/\?.*$/, '')
      : provider === 'mixcloud' ? new URL(embed.src).searchParams.get('feed') : null;
    return { provider, kind: embed.kind as string, url: page && /^https:\/\//.test(page) ? page : null, embedSrc: embed.src, title: title || TRACK_LABEL[provider], authorName: null, thumbnailUrl: null };
  }
  const video = youtubeId(input);
  if (video) return youtubeTrack(ctx, video, title);
  const mix = await resolveMix(ctx, input);
  return { ...mix, kind: mix.kind as string, title: title || mix.title };
}
