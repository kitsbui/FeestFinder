/**
 * Blog posts as GET /posts and /posts/:slug give them (festfinder-backend src/services/blog.ts
 * presentPost). A track's player loads only when someone presses play.
 */
import { type Lang, type Pair, tx } from '../../copy';

export const CATEGORIES = ['styles', 'news', 'playlist', 'dj', 'venues'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Track {
  id: string; provider: 'soundcloud' | 'mixcloud' | 'spotify' | 'youtube'; providerLabel: string; kind: string; url: string | null;
  /** The player's height; null for a video, which plays 16:9 across the column. */
  playSrc: string; height: number | null; title: string; authorName: string | null; thumbnailUrl: string | null;
  year: number | null; note: Pair;
}
export interface Fact { label: Pair; value: Pair }
export interface Faq { q: Pair; a: Pair }
export interface Source { title: string; url: string; publisher?: string }

export interface Post {
  id: string;
  slug: string;
  category: { key: Category; label: Pair };
  /** The language it was first written in. */
  lang: 'vi' | 'en';
  title: Pair;
  excerpt: Pair;
  body?: Pair;
  coverUrl: string | null;
  /** The cover's credit (its author, licence, a link): a line of the post's marks. */
  coverCredit: string | null;
  styles: { key: string; label: Pair; genre: string | null }[];
  city: { slug: string; label: Pair | null } | null;
  status: 'draft' | 'in_review' | 'published' | 'rejected' | 'hidden';
  /** `editorial`: the team wrote it (no author account). */
  author: { name: string; initials: string; editorial: boolean };
  minutes: { en: number; vi: number };
  trackCount: number;
  tracks: Track[];
  facts: Fact[];
  faq: Faq[];
  sources: Source[];
  /** The guide this one sits under, and the published ones under it. */
  parent: { slug: string; title: Pair } | null;
  children: { slug: string; title: Pair }[];
  publishedAt: string | null;
  updatedAt: string;
  mine?: boolean;
  decisionNote?: string | null;
  missing?: Pair[];
}

/** A post in GET /posts (presentCard): what a card draws, in both languages. */
export type ListedPost = Pick<Post, 'id' | 'slug' | 'category' | 'lang' | 'title' | 'excerpt' | 'coverUrl' | 'author' | 'minutes' | 'trackCount' | 'publishedAt'>;
export interface PostList<T = ListedPost> { items: T[]; total: number; categories: Record<Category, number>; nextOffset: number | null }

export const text = (v: Pair | null | undefined, lang: Lang) => (v ? tx(v, lang) || v.vi || v.en || '' : '');

/** A pair's words in a language, else the other's: a post may be written in one language only. */
export const say = (p: Pair | null | undefined, lang: Lang) => (p ? (lang === 'vi' ? p.vi || p.en : p.en || p.vi) : '');
/** The language a post reads in for a page in `lang`: that one if written, else the other. */
export const readIn = (post: Pick<Post, 'body' | 'title'>, lang: Lang): 'vi' | 'en' => {
  const want = lang === 'vi' ? 'vi' : 'en';
  const other = want === 'vi' ? 'en' : 'vi';
  return (post.body ? post.body[want] : post.title[want]).trim() ? want : other;
};

// ---- the news feed (festfinder-backend src/services/news.ts, GET /news) --------------------

export const NEWS_TOPICS = ['festival', 'artist', 'industry', 'tech', 'scene'] as const;
export type NewsTopic = (typeof NEWS_TOPICS)[number];

/** A headline of the EDM press: it links to its publisher, and reads here as the feed's summary or a machine-written digest. */
export interface NewsItem {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  digest: Pair | null;
  imageUrl: string | null;
  author: string | null;
  topic: NewsTopic;
  region: 'global' | 'asia' | 'vietnam';
  styles: { key: string; label: Pair; genre: string | null }[];
  publishedAt: string;
  source: { name: string; siteUrl: string; host: string; lang: string };
}
export interface NewsList { items: NewsItem[]; total: number; nextOffset: number | null; topics: Record<NewsTopic, number> }
