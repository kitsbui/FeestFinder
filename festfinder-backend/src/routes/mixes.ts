import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { badRequest, conflict, forbidden, notFound, tooMany } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { initialsOf } from '../lib/contact.ts';
import { vnDate } from '../lib/time.ts';
import { MIXES_MAX, parseAt } from '../lib/mixes.ts';
import { limit, parse, uuid } from '../lib/validate.ts';
import { decodeCursor, page } from '../http/sql.ts';
import { requireAdmin, requireUser, requireWriter } from '../http/guards.ts';
import { personId } from '../services/analytics.ts';
import { appendAudit } from '../services/audit.ts';
import { checkPostText } from '../services/community.ts';
import { MIX_COLUMNS, MIX_FROM, mixesOf, presentMix, recount, resolveMix } from '../services/mixes.ts';
import { notifyUser } from '../services/notify.ts';
import { HIDE_AFTER_REPORTS } from './discussion.ts';

/*
 * Mixes on an artist's page (lib/mixes.ts, services/mixes.ts): the artist adds their sets from
 * SoundCloud, Mixcloud or Spotify; anyone signed in likes them; people with a confirmed phone
 * comment, optionally at a moment of the set ("at 45:30"). Likes and comments never rank anyone.
 *
 *   GET    /artists/:slug/mixes/me        which of the page's mixes this person liked
 *   GET    /me/artist/mixes               the owner's list, and the nights they played (for "recorded at")
 *   POST   /me/artist/mixes/preview       what a pasted link would add, without adding it
 *   POST   /me/artist/mixes               add one (needs a confirmed phone: it is public)
 *   PATCH  /me/artist/mixes/:id           title, recorded at, pinned
 *   DELETE /me/artist/mixes/:id
 *   PUT    /me/artist/mixes/order
 *   PUT|DELETE /mixes/:id/like
 *   GET    /mixes/:id/comments            newest first, with their replies
 *   POST   /mixes/:id/comments
 *   DELETE /mix-comments/:id              its author, the artist, or the team
 *   POST   /mix-comments/:id/reports
 *   POST   /admin/artists/:id/mixes       the team adds one to a profile nobody runs (audited)
 *   GET    /admin/mix-comments/reported, POST /admin/mix-comments/:id/remove|keep (audited)
 */

const COMMENTS_PER_10_MIN = 6;
const REASONS = ['spam', 'abuse', 'personal', 'other'] as const;
const REASON_LABEL = {
  spam: L('Spam or advertising', 'Spam hoặc quảng cáo'), abuse: L('Abuse or harassment', 'Xúc phạm hoặc quấy rối'),
  personal: L('Someone’s personal details', 'Thông tin cá nhân của người khác'), other: L('Something else', 'Lý do khác'),
};

type Viewer = { id: string; role: string } | null;

function presentComment(r: any, viewer: Viewer, canModerate: boolean, replies?: any[]) {
  const removed = r.status === 'removed';
  return {
    id: r.id as string,
    parentId: r.parent_id as string | null,
    body: removed ? null : (r.body as string),
    atS: r.at_s as number | null,
    removed,
    hidden: r.status === 'hidden',
    author: removed ? null : { name: (r.author_name as string | null)?.trim() || null, initials: r.author_name?.trim() ? initialsOf(r.author_name) : 'FF', photoUrl: r.author_photo as string | null },
    createdAt: r.created_at as Date,
    me: viewer ? { mine: r.user_id === viewer.id } : null,
    canModerate,
    replies,
  };
}

const COMMENT_COLUMNS = `c.id, c.mix_id, c.user_id, c.parent_id, c.body, c.at_s, c.status, c.created_at, u.name as author_name, u.photo_url as author_photo`;

export default async function mixRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const viewerOf = (req: FastifyRequest): Viewer => (req.session?.user ? { id: req.session.user.id, role: req.session.user.role } : null);

  /** The artist profile this person runs. */
  const ownArtist = async (userId: string) => {
    const a = await one<{ id: string; slug: string; name: string }>(ctx.db, 'select id, slug, name from artists where owner_user_id = $1', [userId]);
    if (!a) throw notFound(L('You have no artist profile yet', 'Bạn chưa có hồ sơ nghệ sĩ'));
    return a;
  };

  /** A mix still shown, with its artist's slug and owner. */
  const liveMix = async (id: string) => {
    const m = await one<any>(ctx.db,
      `select m.*, a.slug as artist_slug, a.name as artist_name, a.owner_user_id from artist_mixes m join artists a on a.id = m.artist_id where m.id = $1 and m.removed_at is null`,
      [parse(uuid, id)]);
    if (!m) throw notFound(L('This mix is gone', 'Mix này không còn'));
    return m;
  };

  /** A night the artist played, for "recorded at"; null clears it. */
  const playedAt = async (artistId: string, eventId: string | null | undefined): Promise<string | null | undefined> => {
    if (eventId === undefined || eventId === null) return eventId;
    const ok = await one(ctx.db, 'select 1 from event_artists where artist_id = $1 and event_id = $2', [artistId, eventId]);
    if (!ok) throw badRequest('event_not_played', L('Pick a night this artist played', 'Chọn một đêm nghệ sĩ này đã diễn'));
    return eventId;
  };

  /** Adds a resolved mix at the end of the artist's list, within the limit, once per link. */
  const addMix = async (artistId: string, userId: string, raw: string, eventId: string | null) => {
    const r = await resolveMix(ctx, raw);
    const id = await ctx.db.tx(async (q) => {
      await q.query('select pg_advisory_xact_lock(hashtext($1))', [`mixes:${artistId}`]);
      const n = await one<{ n: number; top: number }>(q,
        `select count(*)::int as n, coalesce(max(sort), -1)::int as top from artist_mixes where artist_id = $1 and removed_at is null`, [artistId]);
      if (n!.n >= MIXES_MAX) throw conflict('mixes_full', L(`Up to ${MIXES_MAX} mixes; remove one first`, `Tối đa ${MIXES_MAX} mix; hãy xoá bớt một mix`));
      if (await one(q, 'select 1 from artist_mixes where artist_id = $1 and url = $2 and removed_at is null', [artistId, r.url])) {
        throw conflict('mix_exists', L('This mix is already on the page', 'Mix này đã có trên trang'));
      }
      const row = await one<{ id: string }>(q,
        `insert into artist_mixes (artist_id, provider, kind, url, embed_src, title, author_name, thumbnail_url, event_id, sort, created_by, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
        [artistId, r.provider, r.kind, r.url, r.embedSrc, r.title, r.authorName, r.thumbnailUrl, eventId, n!.top + 1, userId, ctx.clock.now()]);
      return row!.id;
    });
    return presentMix(await one<any>(ctx.db, `select ${MIX_COLUMNS} ${MIX_FROM} where m.id = $1`, [id]));
  };

  // ---- the page -------------------------------------------------------------------------------

  app.get<{ Params: { slug: string } }>('/artists/:slug/mixes/me', async (req) => {
    const s = requireUser(req);
    const rows = await many<{ mix_id: string }>(ctx.db,
      `select l.mix_id from artist_mix_likes l join artist_mixes m on m.id = l.mix_id join artists a on a.id = m.artist_id
        where a.slug = $1 and l.user_id = $2 and m.removed_at is null`, [req.params.slug, s.user.id]);
    return { liked: rows.map((r) => r.mix_id) };
  });

  // ---- the owner ------------------------------------------------------------------------------

  app.get('/me/artist/mixes', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const nights = await many<any>(ctx.db,
      `select e.id, e.slug, e.title, e.starts_on::text as starts_on from event_artists ea join events e on e.id = ea.event_id
        where ea.artist_id = $1 and e.status = 'live' and e.published_at is not null and e.starts_at < $2 order by e.starts_at desc limit 40`,
      [a.id, ctx.clock.now()]);
    return { items: await mixesOf(ctx.db, a.id), max: MIXES_MAX, nights: nights.map((e) => ({ id: e.id, slug: e.slug, title: e.title, startsOn: e.starts_on })) };
  });

  app.post('/me/artist/mixes/preview', async (req) => {
    requireUser(req);
    const { url } = parse(z.object({ url: z.string().trim().min(1).max(2048) }), req.body);
    const r = await resolveMix(ctx, url);
    return presentMix({ id: 'preview', provider: r.provider, kind: r.kind, url: r.url, embed_src: r.embedSrc, title: r.title, author_name: r.authorName, thumbnail_url: r.thumbnailUrl, duration_s: null, pinned: false, like_count: 0, comment_count: 0 });
  });

  app.post('/me/artist/mixes', async (req, reply) => {
    const s = requireWriter(req);
    const a = await ownArtist(s.user.id);
    const body = parse(z.object({ url: z.string().trim().min(1).max(2048), eventId: uuid.nullable().optional() }), req.body);
    const mix = await addMix(a.id, s.user.id, body.url, (await playedAt(a.id, body.eventId)) ?? null);
    return reply.code(201).send({ ...mix, message: L('Mix added', 'Đã thêm mix') });
  });

  app.patch<{ Params: { id: string } }>('/me/artist/mixes/:id', async (req) => {
    const s = requireWriter(req);
    const a = await ownArtist(s.user.id);
    const m = await liveMix(req.params.id);
    if (m.artist_id !== a.id) throw forbidden('not_yours', L('Only the artist can change their mixes', 'Chỉ nghệ sĩ mới sửa được mix của mình'));
    const body = parse(z.object({ title: z.string().trim().min(1).max(200), eventId: uuid.nullable(), pinned: z.boolean() }).partial(), req.body);
    const eventId = await playedAt(a.id, body.eventId);
    await ctx.db.tx(async (q) => {
      if (body.pinned) await q.query('update artist_mixes set pinned = false where artist_id = $1 and pinned and id <> $2', [a.id, m.id]);
      await q.query(
        `update artist_mixes set title = coalesce($2, title), event_id = case when $3::boolean then $4::uuid else event_id end, pinned = coalesce($5, pinned) where id = $1`,
        [m.id, body.title ?? null, eventId !== undefined, eventId ?? null, body.pinned ?? null]);
    });
    return presentMix(await one<any>(ctx.db, `select ${MIX_COLUMNS} ${MIX_FROM} where m.id = $1`, [m.id]));
  });

  app.delete<{ Params: { id: string } }>('/me/artist/mixes/:id', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const m = await liveMix(req.params.id);
    if (m.artist_id !== a.id) throw forbidden('not_yours', L('Only the artist can change their mixes', 'Chỉ nghệ sĩ mới sửa được mix của mình'));
    await ctx.db.query(`update artist_mixes set removed_at = $2, removed_by = $3, removed_reason = 'owner', pinned = false where id = $1`, [m.id, ctx.clock.now(), s.user.id]);
    return { ok: true, message: L('Mix removed', 'Đã xoá mix') };
  });

  app.put('/me/artist/mixes/order', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const { ids } = parse(z.object({ ids: z.array(uuid).max(MIXES_MAX) }), req.body);
    await ctx.db.tx(async (q) => {
      for (const [i, id] of ids.entries()) await q.query('update artist_mixes set sort = $3 where id = $1 and artist_id = $2 and removed_at is null', [id, a.id, i]);
    });
    return { items: await mixesOf(ctx.db, a.id) };
  });

  // ---- likes ----------------------------------------------------------------------------------

  const like = (on: boolean) => async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const s = requireUser(req);
    const m = await liveMix(req.params.id);
    const changed = on
      ? await one(ctx.db, 'insert into artist_mix_likes (mix_id, user_id, created_at) values ($1,$2,$3) on conflict do nothing returning 1', [m.id, s.user.id, ctx.clock.now()])
      : await one(ctx.db, 'delete from artist_mix_likes where mix_id = $1 and user_id = $2 returning 1', [m.id, s.user.id]);
    if (changed) {
      await recount(ctx.db, m.id);
      if (on) void ctx.analytics.capture('mix_liked', personId(s.user.id), { kind: m.provider });
    }
    const n = await one<{ like_count: number }>(ctx.db, 'select like_count from artist_mixes where id = $1', [m.id]);
    return { liked: on, likeCount: n!.like_count };
  };
  app.put<{ Params: { id: string } }>('/mixes/:id/like', like(true));
  app.delete<{ Params: { id: string } }>('/mixes/:id/like', like(false));

  // ---- comments -------------------------------------------------------------------------------

  /** Who may take a comment down besides its author: the artist whose mix it is, and the team. */
  const moderates = (viewer: Viewer, m: any) => !!viewer && (viewer.role === 'admin' || m.owner_user_id === viewer.id);

  app.get<{ Params: { id: string } }>('/mixes/:id/comments', async (req) => {
    const m = await liveMix(req.params.id);
    const viewer = viewerOf(req);
    const team = moderates(viewer, m);
    const f = parse(z.object({ cursor: z.string().optional(), limit: limit(50, 20) }), req.query);
    const offset = decodeCursor(f.cursor);
    // Visible comments, and to their authors their own hidden ones; removed ones stay as a gap only when they have replies.
    const seen = team ? `c.status <> 'removed'` : viewer ? `(c.status = 'visible' or (c.status = 'hidden' and c.user_id = $4))` : `c.status = 'visible'`;
    const values: unknown[] = [m.id, f.limit + 1, offset];
    if (!team && viewer) values.push(viewer.id);
    const top = await many<any>(ctx.db,
      `select ${COMMENT_COLUMNS} from artist_mix_comments c join users u on u.id = c.user_id
        where c.mix_id = $1 and c.parent_id is null and ${seen} order by c.created_at desc limit $2 offset $3`, values);
    const shown = top.slice(0, f.limit);
    const replies = shown.length
      ? await many<any>(ctx.db,
        `select ${COMMENT_COLUMNS} from artist_mix_comments c join users u on u.id = c.user_id
          where c.parent_id = any($1::uuid[]) and ${seen.replaceAll('$4', '$2')} order by c.created_at limit 200`,
        !team && viewer ? [shown.map((r) => r.id), viewer.id] : [shown.map((r) => r.id)])
      : [];
    const out = page(top, offset, f.limit);
    return {
      items: out.items.map((r) => presentComment(r, viewer, team, replies.filter((x) => x.parent_id === r.id).map((x) => presentComment(x, viewer, team)))),
      nextCursor: out.nextCursor,
      total: m.comment_count,
    };
  });

  app.post<{ Params: { id: string } }>('/mixes/:id/comments', async (req, reply) => {
    const s = requireWriter(req);
    const m = await liveMix(req.params.id);
    const body = parse(z.object({ body: z.string().max(4000), parentId: uuid.optional(), at: z.string().max(10).nullable().optional() }), req.body);
    const team = s.user.role === 'admin' || m.owner_user_id === s.user.id;
    const text = checkPostText(body.body, team);
    const now = ctx.clock.now();
    const recent = await one<{ n: number }>(ctx.db, `select count(*)::int as n from artist_mix_comments where user_id = $1 and created_at > $2`, [s.user.id, new Date(now.getTime() - 10 * 60_000)]);
    if (!team && recent!.n >= COMMENTS_PER_10_MIN) throw tooMany('posting_too_fast', L('You are posting fast — try again in a few minutes', 'Bạn đăng hơi nhanh — thử lại sau vài phút'));
    let parent: any = null;
    if (body.parentId) {
      parent = await one<any>(ctx.db, 'select id, user_id, parent_id, status from artist_mix_comments where id = $1 and mix_id = $2', [body.parentId, m.id]);
      if (!parent || parent.status === 'removed') throw notFound(L('That comment is gone', 'Bình luận này không còn'));
      if (parent.parent_id) throw badRequest('reply_depth', L('Reply to the first comment of the thread', 'Hãy trả lời bình luận đầu của chuỗi'));
    }
    let at: number | null = null;
    if (body.at) {
      at = parseAt(body.at);
      if (at == null || (m.duration_s && at > m.duration_s) || at > 24 * 3600) throw badRequest('invalid_time', L('Write the time as 45:30 or 1:02:05', 'Ghi thời điểm dạng 45:30 hoặc 1:02:05'));
    }
    const row = await ctx.db.tx(async (q) => {
      const c = await one<{ id: string }>(q,
        `insert into artist_mix_comments (mix_id, user_id, parent_id, body, at_s, created_at) values ($1,$2,$3,$4,$5,$6) returning id`,
        [m.id, s.user.id, parent?.id ?? null, text, at, now]);
      await recount(q, m.id);
      const link = { url: `/a/${encodeURIComponent(m.artist_slug)}?mix=${m.id}` };
      if (parent && parent.user_id !== s.user.id) {
        await notifyUser(q, now, {
          userId: parent.user_id, topic: null, kind: 'mix_reply', dedupeKey: `mix-reply:${parent.id}:${vnDate(now)}`,
          title: L(`New reply · ${m.title}`, `Có trả lời mới · ${m.title}`), body: { en: text.slice(0, 140), vi: text.slice(0, 140) }, link,
        });
      } else if (!parent && m.owner_user_id && m.owner_user_id !== s.user.id) {
        await notifyUser(q, now, {
          userId: m.owner_user_id, topic: null, kind: 'mix_comment', dedupeKey: `mix-comment:${m.id}:${vnDate(now)}`,
          title: L(`New comments on ${m.title}`, `Có bình luận mới về ${m.title}`), body: { en: text.slice(0, 140), vi: text.slice(0, 140) }, link,
        });
      }
      return one<any>(q, `select ${COMMENT_COLUMNS} from artist_mix_comments c join users u on u.id = c.user_id where c.id = $1`, [c!.id]);
    });
    void ctx.analytics.capture('mix_commented', personId(s.user.id), { kind: m.provider });
    return reply.code(201).send({ comment: presentComment(row, s.user, team, parent ? undefined : []), message: L('Posted', 'Đã đăng') });
  });

  app.delete<{ Params: { id: string } }>('/mix-comments/:id', async (req) => {
    const s = requireUser(req);
    const c = await one<any>(ctx.db,
      `select c.*, a.owner_user_id from artist_mix_comments c join artist_mixes m on m.id = c.mix_id join artists a on a.id = m.artist_id where c.id = $1`,
      [parse(uuid, req.params.id)]);
    if (!c || c.status === 'removed') throw notFound();
    if (c.user_id !== s.user.id && !moderates(s.user, c)) throw forbidden('not_yours', L('Only its author can take this down', 'Chỉ người viết mới gỡ được'));
    await ctx.db.tx(async (q) => {
      await q.query(`update artist_mix_comments set status = 'removed', removed_by = $2 where id = $1`, [c.id, s.user.id]);
      await recount(q, c.mix_id);
      if (c.user_id !== s.user.id && s.user.role === 'admin') {
        await appendAudit(q, { at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'mix_comment.removed', targetType: 'mix_comment', targetId: c.id, targetLabel: c.body.slice(0, 80), diff: [{ f: 'visible', a: 'true', b: 'false' }] });
      }
    });
    return { ok: true, message: L('Comment removed', 'Đã gỡ bình luận') };
  });

  app.post<{ Params: { id: string } }>('/mix-comments/:id/reports', async (req, reply) => {
    const s = requireUser(req);
    const { reason } = parse(z.object({ reason: z.enum(REASONS) }), req.body);
    const c = await one<any>(ctx.db, `select id, mix_id, user_id, status from artist_mix_comments where id = $1 and status <> 'removed'`, [parse(uuid, req.params.id)]);
    if (!c) throw notFound();
    if (c.user_id === s.user.id) throw badRequest('own_comment', L('That is your own comment', 'Đây là bình luận của bạn'));
    const made = await ctx.db.tx(async (q) => {
      const r = await one(q, `insert into artist_mix_comment_reports (comment_id, user_id, reason, created_at) values ($1,$2,$3,$4) on conflict do nothing returning 1`, [c.id, s.user.id, reason, ctx.clock.now()]);
      if (!r) return false;
      const n = await one<{ report_count: number }>(q, 'update artist_mix_comments set report_count = report_count + 1 where id = $1 returning report_count', [c.id]);
      if (n!.report_count >= HIDE_AFTER_REPORTS && c.status === 'visible') {
        await q.query(`update artist_mix_comments set status = 'hidden' where id = $1`, [c.id]);
        await recount(q, c.mix_id);
      }
      return true;
    });
    return reply.code(made ? 201 : 200).send({ ok: true, message: L('Thanks, a moderator will look at it', 'Cảm ơn bạn, kiểm duyệt viên sẽ xem') });
  });

  // ---- the team -------------------------------------------------------------------------------

  app.post<{ Params: { id: string } }>('/admin/artists/:id/mixes', async (req, reply) => {
    const s = requireAdmin(req);
    const a = await one<{ id: string; name: string }>(ctx.db, 'select id, name from artists where id = $1', [parse(uuid, req.params.id)]);
    if (!a) throw notFound();
    const { url } = parse(z.object({ url: z.string().trim().min(1).max(2048) }), req.body);
    const mix = await addMix(a.id, s.user.id, url, null);
    await appendAudit(ctx.db, { at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'artist.mix_added', targetType: 'artist', targetId: a.id, targetLabel: a.name, diff: [{ f: 'mix', a: '—', b: mix.url.slice(0, 80) }] });
    return reply.code(201).send(mix);
  });

  app.get('/admin/mix-comments/reported', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({ limit: limit(100, 40) }), req.query);
    const rows = await many<any>(ctx.db,
      `select c.id, c.body, c.status, c.created_at, u.name as author_name, m.id as mix_id, m.title as mix_title, a.slug as artist_slug, a.name as artist_name,
              count(r.*)::int as reports, array_agg(distinct r.reason) as reasons, min(r.created_at) as first_at
         from artist_mix_comment_reports r join artist_mix_comments c on c.id = r.comment_id join users u on u.id = c.user_id
         join artist_mixes m on m.id = c.mix_id join artists a on a.id = m.artist_id
        where r.resolved_at is null and c.status <> 'removed'
        group by c.id, u.name, m.id, a.slug, a.name order by count(r.*) desc, min(r.created_at) limit $1`, [f.limit]);
    return {
      items: rows.map((r) => ({
        id: r.id, body: r.body, hidden: r.status === 'hidden', reports: r.reports, firstAt: r.first_at, createdAt: r.created_at,
        author: r.author_name?.trim() || null,
        reasons: (r.reasons as (typeof REASONS)[number][]).map((k) => ({ key: k, label: REASON_LABEL[k] })),
        mix: { id: r.mix_id, title: r.mix_title, href: `/a/${r.artist_slug}?mix=${r.mix_id}`, artist: r.artist_name },
      })),
    };
  });

  const decide = (verdict: 'removed' | 'kept') => async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const s = requireAdmin(req);
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const c = await one<any>(q, 'select * from artist_mix_comments where id = $1 for update', [parse(uuid, req.params.id)]);
      if (!c) throw notFound();
      if (c.status === 'removed') throw conflict('already_removed', L('This comment is already removed', 'Bình luận này đã được gỡ'));
      await q.query(`update artist_mix_comments set status = $2, removed_by = case when $2 = 'removed' then $3::uuid else removed_by end where id = $1`,
        [c.id, verdict === 'removed' ? 'removed' : 'visible', s.user.id]);
      const open = await many(q, `update artist_mix_comment_reports set resolved_at = $2, resolution = $3 where comment_id = $1 and resolved_at is null returning 1`, [c.id, now, verdict]);
      await recount(q, c.mix_id);
      await appendAudit(q, {
        at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: `mix_comment.${verdict}`,
        targetType: 'mix_comment', targetId: c.id, targetLabel: String(c.body).slice(0, 80),
        diff: [{ f: 'reports_open', a: String(open.length), b: '0' }, { f: 'visible', a: String(c.status === 'visible'), b: String(verdict === 'kept') }],
      });
    });
    return { ok: true, message: verdict === 'removed' ? L('Comment removed', 'Đã gỡ bình luận') : L('Comment kept', 'Đã giữ bình luận') };
  };
  app.post<{ Params: { id: string } }>('/admin/mix-comments/:id/remove', decide('removed'));
  app.post<{ Params: { id: string } }>('/admin/mix-comments/:id/keep', decide('kept'));
}
