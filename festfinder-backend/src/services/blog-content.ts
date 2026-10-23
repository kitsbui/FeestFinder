import type { Ctx } from '../context.ts';
import { json, many, one } from '../db/index.ts';
import { sha256 } from '../lib/crypto.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { isStyle } from '../lib/styles.ts';
import { youtubeEmbed, youtubeWatch } from '../lib/mixes.ts';
import { PACKS } from '../content/blog/index.ts';
import { EDITORIAL, newPostSlug, type BlogCategory, type Faq, type Fact, type Source } from './blog.ts';
import { appendAudit } from './audit.ts';
import { notifyAdmins } from './notify.ts';

/*
 * The team's editorial posts live in the database like every post, so the admins edit them in the
 * Console and the site reads them without a deploy. They are written as content packs in the
 * repository (src/content/blog, one file per document the owner sends) and arrive through the
 * `importBlogContent` job:
 *
 *   - a post new to the database is added for the team's review (`in_review`; every admin is told),
 *     unless its pack is `publish`: the owner approved the pack as written, so its posts go public
 *     when they arrive, and one still waiting that nobody decided on or edited is published too;
 *   - a post nobody has edited takes the pack's newer words (`import_hash` changes) and keeps its status;
 *   - a post someone edited (`edited_at`) is never written over again;
 *   - nothing is ever deleted: a post the team took down stays down.
 */

export interface PackTrack {
  /** A YouTube video checked through YouTube's oEmbed when the pack was written (only YouTube in packs). */
  youtube: string;
  title: string;
  artist: string;
  channel?: string;
  year?: number;
  /** YouTube's own picture of the video by default (what its oEmbed answers). */
  thumbnail?: string;
  note: Localized;
}

export interface PackPost {
  /** The post's lasting name in the pack ("edm-genres/techno"); the slug may change, this may not. */
  key: string;
  slug: string;
  category: BlogCategory;
  lang: 'vi' | 'en';
  /** The key of the guide this one sits under. */
  parent?: string;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  cover?: { url: string; credit: string };
  styles: string[];
  facts: Fact[];
  faq: Faq[];
  sources: Source[];
  tracks: PackTrack[];
}

export interface BlogPack {
  pack: string;
  byline: string;
  posts: PackPost[];
  /** The owner approved the pack as written (who and when in its index.ts): its posts skip the review queue. */
  publish?: true;
}

const hashOf = (p: PackPost) => sha256(JSON.stringify(p));

/** What a pack post writes into its row, the same on insert and on update. */
function columns(p: PackPost) {
  return {
    category: p.category, lang: p.lang, title: json(p.title), excerpt: json(p.excerpt), body: json(p.body),
    cover_url: p.cover?.url ?? null, cover_credit: p.cover?.credit ?? null, styles: p.styles.filter(isStyle),
    facts: json(p.facts), faq: json(p.faq), sources: json(p.sources),
  };
}

export async function importBlogContent(ctx: Ctx, packs: BlogPack[] = PACKS): Promise<{ added: number; updated: number }> {
  const now = ctx.clock.now();
  let added = 0, updated = 0, waiting = 0;
  for (const pack of packs) {
    const status = pack.publish ? 'published' : 'in_review';
    for (const post of pack.posts) {
      const hash = hashOf(post);
      const row = await one<{ id: string; import_hash: string | null; edited_at: Date | null }>(ctx.db, 'select id, import_hash, edited_at from blog_posts where import_key = $1', [post.key]);
      if (row && (row.edited_at || row.import_hash === hash)) continue;
      const c = columns(post);
      await ctx.db.tx(async (q) => {
        let id = row?.id;
        if (!id) {
          const taken = await one(q, 'select 1 from blog_posts where slug = $1', [post.slug]);
          const slug = taken ? await newPostSlug(q, post.slug) : post.slug;
          const made = await one<{ id: string }>(q,
            `insert into blog_posts (slug, byline, category, lang, title, excerpt, body, cover_url, cover_credit, styles, facts, faq, sources, import_key, import_hash, status, published_at, decided_at, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17,$18,$18) returning id`,
            [slug, pack.byline || EDITORIAL, c.category, c.lang, c.title, c.excerpt, c.body, c.cover_url, c.cover_credit, c.styles, c.facts, c.faq, c.sources, post.key, hash, status, pack.publish ? now : null, now]);
          id = made!.id;
          added++;
          if (!pack.publish) waiting++;
        } else {
          await q.query(
            `update blog_posts set category = $2, lang = $3, title = $4, excerpt = $5, body = $6, cover_url = $7, cover_credit = $8, styles = $9,
                    facts = $10, faq = $11, sources = $12, import_hash = $13, updated_at = $14 where id = $1`,
            [id, c.category, c.lang, c.title, c.excerpt, c.body, c.cover_url, c.cover_credit, c.styles, c.facts, c.faq, c.sources, hash, now]);
          await q.query('delete from blog_tracks where post_id = $1', [id]);
          updated++;
        }
        for (const [i, t] of post.tracks.entries()) {
          await q.query(
            `insert into blog_tracks (post_id, sort, provider, kind, url, embed_src, title, author_name, thumbnail_url, year, note, created_at)
             values ($1,$2,'youtube','video',$3,$4,$5,$6,$7,$8,$9,$10)`,
            [id, i, youtubeWatch(t.youtube), youtubeEmbed(t.youtube), `${t.artist} – ${t.title}`, t.channel ?? null, t.thumbnail ?? `https://i.ytimg.com/vi/${t.youtube}/hqdefault.jpg`, t.year ?? null, json(t.note), now]);
        }
      });
    }
    // Guides under guides, once every post of the pack has a row.
    for (const post of pack.posts.filter((p) => p.parent)) {
      await ctx.db.query(
        `update blog_posts c set parent_id = p.id from blog_posts p where c.import_key = $1 and p.import_key = $2 and c.edited_at is null and c.parent_id is distinct from p.id`,
        [post.key, post.parent]);
    }
    // What came in for review before the owner approved the pack, and nobody has touched since.
    if (pack.publish) {
      const out = await many<{ id: string }>(ctx.db,
        `update blog_posts set status = 'published', published_at = coalesce(published_at, $2), decided_at = $2, updated_at = $2
          where import_key = any($1) and status = 'in_review' and decided_at is null and edited_at is null returning id`,
        [pack.posts.map((p) => p.key), now]);
      if (out.length) {
        await ctx.db.tx((q) => appendAudit(q, {
          at: now, actorType: 'system', actorId: null, actorLabel: 'importBlogContent', action: 'blog.publish_pack',
          targetType: 'blog_pack', targetId: null, targetLabel: pack.pack, diff: [{ f: 'published', a: '0', b: String(out.length) }],
        }));
      }
    }
  }
  if (waiting) {
    await ctx.db.tx((q) => notifyAdmins(q, now, {
      kind: 'blog_review',
      title: L(`${waiting} new editorial ${waiting === 1 ? 'post' : 'posts'} to review`, `${waiting} bài biên tập mới chờ duyệt`),
      body: L('They are in the blog queue: read, edit and publish them.', 'Bài đang ở hàng chờ Blog: đọc, sửa và đăng.'),
      link: { url: '/console/blog' },
    }));
  }
  return { added, updated };
}

/** The keys every pack names, for the check that a pack's parents exist (test/blog.test.ts). */
export const packKeys = (packs: BlogPack[] = PACKS) => new Set(packs.flatMap((p) => p.posts.map((x) => x.key)));

