import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { many, one, json } from '../db/index.ts';
import { badRequest, conflict, notFound } from '../lib/errors.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { launchedCity } from '../lib/places.ts';
import { isStyle } from '../lib/styles.ts';
import { limit, parse, uuid } from '../lib/validate.ts';
import { requireAdmin, requireUser, requireWriter, teamSession } from '../http/guards.ts';
import { imageChange, probeImage } from '../services/remote-images.ts';
import { personId } from '../services/analytics.ts';
import { appendAudit } from '../services/audit.ts';
import { notifyAdmins, notifyUser } from '../services/notify.ts';
import { importBlogContent } from '../services/blog-content.ts';
import { BLOG_CATEGORIES, loadPost, missingForReview, newPostSlug, pairOf, POST, type PostRow, presentCard, presentPost, resolveTrack, type TrackRow, TRACKS_MAX } from '../services/blog.ts';

/*
 * The blog (migration 060, services/blog.ts). The API's addresses are /posts because /blog is
 * the site's page (as /artists is the API and /a the page).
 *
 *   anyone   GET /posts (published, as cards: no body, facts, questions or sources; ?category= &style= &city=), GET /posts/:slug
 *   author   GET/POST /me/posts, GET/PATCH /me/posts/:id, POST /me/posts/:id/submit,
 *            POST /me/posts/:id/tracks { source, title, year, note }, DELETE /me/posts/:id/tracks/:trackId
 *   team     the same on any post, GET /admin/posts?status=, POST /admin/posts/:id/decision { approve | reject | hide | restore },
 *            POST /admin/posts/import (the content packs now, as the job does every ten minutes)
 *
 * A post is public once the team approved it; what the team writes is public when sent. An
 * author's change to a public post takes it back to review. Any change made here marks the post
 * as edited by a person, so a content pack never writes over it again (services/blog-content.ts).
 */

const pair = (max: number) => z.object({ en: z.string().max(max).default(''), vi: z.string().max(max).default('') });
const Fields = {
  category: z.enum(BLOG_CATEGORIES),
  lang: z.enum(['vi', 'en']),
  title: pair(140).refine((t) => Math.max(t.en.trim().length, t.vi.trim().length) >= 3, 'a title of 3 characters or more'),
  excerpt: pair(320),
  body: pair(40_000),
  // A link, checked when it changes (services/remote-images.ts): only event media is uploaded.
  coverUrl: z.string().max(2048).nullable(),
  coverCredit: z.string().trim().max(300).nullable(),
  styles: z.array(z.string().refine(isStyle, 'unknown style')).max(6),
  city: launchedCity.nullable(),
  facts: z.array(z.object({ label: pair(60), value: pair(240) })).max(12),
  faq: z.array(z.object({ q: pair(300), a: pair(2000) })).max(12),
  sources: z.array(z.object({ title: z.string().trim().min(2).max(200), url: z.string().trim().max(500).regex(/^https:\/\/[^\s"'<>]+$/, 'an https link'), publisher: z.string().trim().max(100).optional() })).max(20),
  /** The guide this one sits under (a sub-genre under its genre): a published post's address. */
  parentSlug: z.string().max(90).nullable(),
};
const Create = z.object({
  ...Fields,
  lang: Fields.lang.default('vi'), excerpt: Fields.excerpt.default({ en: '', vi: '' }), body: Fields.body.default({ en: '', vi: '' }),
  coverUrl: Fields.coverUrl.default(null), coverCredit: Fields.coverCredit.default(null), styles: Fields.styles.default([]), city: Fields.city.default(null),
  facts: Fields.facts.default([]), faq: Fields.faq.default([]), sources: Fields.sources.default([]), parentSlug: Fields.parentSlug.default(null),
});
const Update = z.object(Fields).partial();
/** Columns written from the fields of the same name; the JSON ones go in as JSON. */
const COLUMN: Record<string, string> = {
  category: 'category', lang: 'lang', title: 'title', excerpt: 'excerpt', body: 'body', coverUrl: 'cover_url', coverCredit: 'cover_credit',
  styles: 'styles', city: 'city', facts: 'facts', faq: 'faq', sources: 'sources',
};
const JSON_COLUMNS = new Set(['title', 'excerpt', 'body', 'facts', 'faq', 'sources']);
const Track = z.object({
  source: z.string().trim().min(8).max(4000), title: z.string().trim().max(200).default(''),
  year: z.coerce.number().int().min(1950).max(2100).nullable().default(null), note: pair(400).default({ en: '', vi: '' }),
});

const EDITABLE = ['draft', 'rejected', 'in_review', 'published'];
/** The pictures a post's words show (`![alt](https://…)`), in both languages. */
const imagesIn = (body: Localized | undefined) => new Set([...`${body?.en ?? ''}\n${body?.vi ?? ''}`.matchAll(/!\[[^\]]*\]\((https:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/g)].map((m) => m[1]));
const longest = (p: Localized) => (p.vi.trim().length >= p.en.trim().length ? p.vi : p.en);

export default async function blogRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const viewerOf = (req: FastifyRequest) => ({ userId: req.session?.user?.id ?? null, isAdmin: req.session?.user?.role === 'admin' && !req.session?.impersonatorId });
  const missing = () => notFound(L('Post not found', 'Không tìm thấy bài viết'));

  /** The author's own post (or any, for the team), else a 404 that says nothing of it. */
  const ownPost = async (req: FastifyRequest, id: string) => {
    const s = requireUser(req);
    const p = await one<PostRow>(ctx.db, `${POST} where b.id = $1`, [parse(uuid, id)]);
    if (!p || (p.author_user_id !== s.user.id && !teamSession(req))) throw missing();
    return { s, p };
  };
  const full = async (id: string, req: FastifyRequest) => {
    const x = (await loadPost(ctx.db, { id }))!;
    return presentPost(x.p, { tracks: x.tracks, parent: x.parent, children: x.children, viewer: viewerOf(req), full: true });
  };
  /** Every new picture in the words is checked as a linked image is (its host answers with an image). */
  const checkImages = async (before: Localized | undefined, after: Localized | undefined) => {
    const had = imagesIn(before);
    const added = [...imagesIn(after)].filter((u) => !had.has(u));
    if (added.length > 20) throw badRequest('too_many_images', L('A post shows 20 pictures at most', 'Một bài có tối đa 20 ảnh'));
    for (const u of added) await probeImage(ctx, u, 'moment');
  };
  const parentId = async (slug: string | null | undefined, self: string | null) => {
    if (slug === undefined) return undefined;
    if (!slug) return null;
    const p = await one<{ id: string }>(ctx.db, `select id from blog_posts where slug = $1 and status = 'published' and id is distinct from $2`, [slug, self]);
    if (!p) throw badRequest('parent', L('No published post with that address', 'Không có bài đã đăng ở địa chỉ đó'));
    return p.id;
  };
  /**
   * After an author's change: a public post goes back to the team's queue (the team's own changes
   * stay public). Every admin is told.
   */
  const backToReview = async (req: FastifyRequest, p: PostRow) => {
    if (p.status !== 'published' || teamSession(req)) return;
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      await q.query(`update blog_posts set status = 'in_review', updated_at = $2 where id = $1`, [p.id, now]);
      await notifyAdmins(q, now, {
        kind: 'blog_review', title: L(`Changed post to review: ${longest(pairOf(p.title)).slice(0, 80)}`, `Bài viết sửa cần duyệt: ${longest(pairOf(p.title)).slice(0, 80)}`),
        body: L('An author changed a public post.', 'Tác giả đã sửa một bài đang công khai.'), link: { url: '/console/blog' },
      });
    });
  };

  // ---- anyone ----------------------------------------------------------------------------------

  app.get('/posts', async (req) => {
    const f = parse(z.object({
      category: z.enum(BLOG_CATEGORIES).optional(), style: z.string().refine(isStyle, 'unknown style').optional(), city: launchedCity.optional(),
      limit: limit(48, 24), offset: z.coerce.number().int().min(0).max(10_000).default(0),
    }), req.query);
    const params: unknown[] = [];
    const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
    const where = [`b.status = 'published'`];
    if (f.style) where.push(`${p(f.style)} = any(b.styles)`);
    if (f.city) where.push(`b.city = ${p(f.city)}`);
    const base = [...params];
    const all = [...where];
    if (f.category) where.push(`b.category = ${p(f.category)}`);
    const [rows, kinds, total] = await Promise.all([
      many<PostRow>(ctx.db, `${POST} where ${where.join(' and ')} order by b.published_at desc, b.id limit ${p(f.limit)} offset ${p(f.offset)}`, params),
      many<{ category: string; n: number }>(ctx.db, `select category, count(*)::int as n from blog_posts b where ${all.join(' and ')} group by category`, base),
      one<{ n: number }>(ctx.db, `select count(*)::int as n from blog_posts b where ${where.join(' and ')}`, params.slice(0, params.length - 2)),
    ]);
    const n = total?.n ?? 0;
    return {
      items: rows.map(presentCard),
      total: n,
      categories: Object.fromEntries(BLOG_CATEGORIES.map((k) => [k, kinds.find((x) => x.category === k)?.n ?? 0])),
      nextOffset: f.offset + rows.length < n ? f.offset + rows.length : null,
    };
  });

  app.get<{ Params: { slug: string } }>('/posts/:slug', async (req) => {
    const x = await loadPost(ctx.db, { slug: req.params.slug });
    const viewer = viewerOf(req);
    if (!x || (x.p.status !== 'published' && (!x.p.author_user_id || viewer.userId !== x.p.author_user_id) && !viewer.isAdmin)) throw missing();
    return presentPost(x.p, { tracks: x.tracks, parent: x.parent, children: x.children, viewer, full: true });
  });

  // ---- the author ------------------------------------------------------------------------------

  app.get('/me/posts', async (req) => {
    const s = requireUser(req);
    const rows = await many<PostRow>(ctx.db, `${POST} where b.author_user_id = $1 order by b.updated_at desc limit 100`, [s.user.id]);
    return { items: rows.map((r) => presentPost(r, { viewer: viewerOf(req) })) };
  });

  app.post('/me/posts', async (req, reply) => {
    const s = requireUser(req);
    const b = parse(Create, req.body);
    const now = ctx.clock.now();
    const cover = (await imageChange(ctx, null, b.coverUrl, 'profile_cover')) ?? null;
    await checkImages(undefined, b.body);
    const parent = await parentId(b.parentSlug, null);
    const row = await ctx.db.tx(async (q) => {
      const slug = await newPostSlug(q, longest(b.title));
      return one<{ id: string }>(q,
        `insert into blog_posts (slug, author_user_id, category, lang, title, excerpt, body, cover_url, cover_credit, styles, city, facts, faq, sources, parent_id, edited_at, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16,$16) returning id`,
        [slug, s.user.id, b.category, b.lang, json(b.title), json(b.excerpt), json(b.body), cover, b.coverCredit, b.styles, b.city,
          json(b.facts), json(b.faq), json(b.sources), parent, now]);
    });
    void ctx.analytics.capture('blog_post_created', personId(s.user.id), { kind: b.category });
    return reply.code(201).send({ ...(await full(row!.id, req)), message: L('Draft saved', 'Đã lưu bản nháp') });
  });

  app.get<{ Params: { id: string } }>('/me/posts/:id', async (req) => {
    const { p } = await ownPost(req, req.params.id);
    return full(p.id, req);
  });

  app.patch<{ Params: { id: string } }>('/me/posts/:id', async (req) => {
    const { p } = await ownPost(req, req.params.id);
    if (!EDITABLE.includes(p.status)) throw conflict('not_editable', L('This post can no longer be edited', 'Bài này không còn sửa được'));
    const b = parse(Update, req.body);
    if (b.coverUrl !== undefined) {
      const cover = await imageChange(ctx, p.cover_url, b.coverUrl, 'profile_cover');
      if (cover === undefined) delete b.coverUrl; else b.coverUrl = cover;
    }
    if (b.body) await checkImages(pairOf(p.body), b.body);
    const parent = await parentId(b.parentSlug, p.id);
    const keys = Object.keys(b).filter((k) => k in COLUMN);
    if (keys.length || parent !== undefined) {
      const set = keys.map((k, i) => `${COLUMN[k]} = $${i + 2}`);
      const values: unknown[] = keys.map((k) => { const v = (b as Record<string, unknown>)[k]; return JSON_COLUMNS.has(k) ? json(v) : v; });
      if (parent !== undefined) { set.push(`parent_id = $${values.length + 2}`); values.push(parent); }
      // A person's change: a content pack never writes over this post again.
      await ctx.db.query(`update blog_posts set ${set.join(', ')}, edited_at = $${values.length + 2}, updated_at = $${values.length + 2} where id = $1`, [p.id, ...values, ctx.clock.now()]);
      await backToReview(req, p);
    }
    return full(p.id, req);
  });

  /** A track from a link or an embed code (services/blog.ts resolveTrack), at the end of the post's list. */
  app.post<{ Params: { id: string } }>('/me/posts/:id/tracks', async (req, reply) => {
    const { p } = await ownPost(req, req.params.id);
    if (!EDITABLE.includes(p.status)) throw conflict('not_editable', L('This post can no longer be edited', 'Bài này không còn sửa được'));
    const b = parse(Track, req.body);
    if (Number(p.track_count) >= TRACKS_MAX) throw badRequest('too_many_tracks', L(`A post holds ${TRACKS_MAX} tracks at most`, `Một bài có tối đa ${TRACKS_MAX} bài nhạc`));
    const t = await resolveTrack(ctx, b.source, b.title || null);
    if (await one(ctx.db, 'select 1 from blog_tracks where post_id = $1 and embed_src = $2', [p.id, t.embedSrc])) throw conflict('track_exists', L('This track is in the post already', 'Bài nhạc này đã có trong bài viết'));
    const now = ctx.clock.now();
    await ctx.db.query(
      `insert into blog_tracks (post_id, sort, provider, kind, url, embed_src, title, author_name, thumbnail_url, year, note, created_at)
       values ($1, (select coalesce(max(sort) + 1, 0) from blog_tracks where post_id = $1), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [p.id, t.provider, t.kind, t.url, t.embedSrc, t.title, t.authorName, t.thumbnailUrl, b.year, json(b.note), now]);
    await ctx.db.query('update blog_posts set edited_at = $2, updated_at = $2 where id = $1', [p.id, now]);
    await backToReview(req, p);
    return reply.code(201).send(await full(p.id, req));
  });

  app.delete<{ Params: { id: string; trackId: string } }>('/me/posts/:id/tracks/:trackId', async (req) => {
    const { p } = await ownPost(req, req.params.id);
    if (!EDITABLE.includes(p.status)) throw conflict('not_editable', L('This post can no longer be edited', 'Bài này không còn sửa được'));
    const now = ctx.clock.now();
    await ctx.db.query('delete from blog_tracks where id = $1 and post_id = $2', [parse(uuid, req.params.trackId), p.id]);
    await ctx.db.query('update blog_posts set edited_at = $2, updated_at = $2 where id = $1', [p.id, now]);
    return full(p.id, req);
  });

  /** To the team's queue; what the team writes is public at once. */
  app.post<{ Params: { id: string } }>('/me/posts/:id/submit', async (req) => {
    const s = requireWriter(req);
    const { p } = await ownPost(req, req.params.id);
    if (p.status !== 'draft' && p.status !== 'rejected') throw conflict('not_a_draft', L('Only a draft goes to review', 'Chỉ bản nháp mới gửi duyệt được'));
    const gaps = missingForReview(p, Number(p.track_count));
    if (gaps.length) throw badRequest('incomplete', L('Fill in what is missing first', 'Hãy điền đủ phần còn thiếu trước'), { missing: gaps });
    const now = ctx.clock.now();
    const team = !!teamSession(req);
    await ctx.db.tx(async (q) => {
      await q.query(
        `update blog_posts set status = $2, updated_at = $3, published_at = case when $2 = 'published' then coalesce(published_at, $3) else published_at end where id = $1`,
        [p.id, team ? 'published' : 'in_review', now]);
      if (!team) {
        await notifyAdmins(q, now, {
          kind: 'blog_review', title: L(`Post to review: ${longest(pairOf(p.title)).slice(0, 80)}`, `Bài viết cần duyệt: ${longest(pairOf(p.title)).slice(0, 80)}`),
          body: L(`From ${s.user.name || 'a member'}`, `Từ ${s.user.name || 'một thành viên'}`), link: { url: '/console/blog' },
        });
      }
    });
    return {
      ...(await full(p.id, req)),
      message: team ? L('Published', 'Đã đăng') : L('Sent for review. The team usually answers within a day.', 'Đã gửi duyệt. Đội ngũ thường trả lời trong một ngày.'),
    };
  });

  // ---- the team --------------------------------------------------------------------------------

  app.get('/admin/posts', async (req) => {
    requireAdmin(req);
    const { status } = parse(z.object({ status: z.enum(['in_review', 'published', 'rejected', 'hidden', 'draft']).default('in_review') }), req.query);
    const [rows, counts] = await Promise.all([
      many<PostRow>(ctx.db, `${POST.replace('u.name as author_name', 'u.name as author_name, u.email as author_email')} where b.status = $1 order by b.updated_at ${status === 'in_review' ? 'asc' : 'desc'} limit 200`, [status]),
      many<{ status: string; n: number }>(ctx.db, 'select status, count(*)::int as n from blog_posts group by status'),
    ]);
    const tracks = rows.length ? await many<TrackRow>(ctx.db, 'select * from blog_tracks where post_id = any($1::uuid[]) order by sort, created_at', [rows.map((r) => r.id)]) : [];
    return {
      items: rows.map((r) => ({ ...presentPost(r, { viewer: { userId: null, isAdmin: true }, full: true, tracks: tracks.filter((t) => t.post_id === r.id) }), authorEmail: r.author_email ?? null, imported: !!r.import_key, edited: !!r.edited_at })),
      counts: Object.fromEntries(counts.map((c) => [c.status, c.n])),
    };
  });

  /** The repository's content packs into the database now (the `importBlogContent` job does it every ten minutes). */
  app.post('/admin/posts/import', async (req) => {
    requireAdmin(req);
    const out = await importBlogContent(ctx);
    return { ...out, message: L(`${out.added} new, ${out.updated} updated`, `${out.added} bài mới, ${out.updated} bài cập nhật`) };
  });

  app.post<{ Params: { id: string } }>('/admin/posts/:id/decision', async (req) => {
    const s = requireAdmin(req);
    const b = parse(z.object({ action: z.enum(['approve', 'reject', 'hide', 'restore']), note: z.string().trim().max(1000).default('') }), req.body);
    const p = await one<PostRow>(ctx.db, `${POST} where b.id = $1`, [parse(uuid, req.params.id)]);
    if (!p) throw missing();
    const from = { approve: ['in_review', 'draft'], reject: ['in_review'], hide: ['published', 'in_review'], restore: ['hidden'] }[b.action];
    if (!from.includes(p.status)) throw conflict('wrong_status', L('This post is not in a state for that', 'Bài viết không ở trạng thái phù hợp'));
    if (b.action === 'reject' && !b.note) throw badRequest('note_required', L('Say why, for the author', 'Hãy ghi lý do cho tác giả'));
    const now = ctx.clock.now();
    const status = { approve: 'published', reject: 'rejected', hide: 'hidden', restore: 'published' }[b.action];
    const title = longest(pairOf(p.title)).slice(0, 80);
    await ctx.db.tx(async (q) => {
      await q.query(
        `update blog_posts set status = $2, decision_note = $3, decided_by = $4, decided_at = $5, updated_at = $5,
                published_at = case when $2 = 'published' then coalesce(published_at, $5) else published_at end where id = $1`,
        [p.id, status, b.note || null, s.user.id, now]);
      await appendAudit(q, {
        at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: `blog.${b.action}`,
        targetType: 'blog_post', targetId: p.id, targetLabel: title, diff: [{ f: 'status', a: p.status, b: status }],
      });
      // An editorial post has no author to tell.
      if (b.action !== 'restore' && p.author_user_id) {
        await notifyUser(q, now, {
          userId: p.author_user_id, topic: null, kind: 'blog_review',
          title: b.action === 'approve' ? L(`${title} is public`, `${title} đã được đăng`) : b.action === 'reject' ? L(`${title} needs changes`, `${title} cần chỉnh sửa`) : L(`${title} was taken down by the team`, `${title} đã được đội ngũ gỡ xuống`),
          body: b.note ? L(b.note, b.note) : L('Thank you for writing.', 'Cảm ơn bạn đã viết.'),
          link: { url: b.action === 'approve' ? `/blog/${p.slug}` : `/blog/${p.slug}/edit` },
        });
      }
    });
    return { id: p.id, status, message: { approve: L('Approved: the post is public', 'Đã duyệt: bài đã công khai'), reject: L('Sent back to the author', 'Đã gửi lại tác giả'), hide: L('Taken down', 'Đã gỡ'), restore: L('Public again', 'Đã đăng lại') }[b.action] };
  });
}
