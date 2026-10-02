import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { badRequest, conflict, forbidden, notFound, tooMany } from '../lib/errors.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { initialsOf } from '../lib/contact.ts';
import { vnDate, vnTime } from '../lib/time.ts';
import { limit, parse, uuid } from '../lib/validate.ts';
import { decodeCursor, isUuid, page } from '../http/sql.ts';
import { requireAdmin, requireUser, requireWriter } from '../http/guards.ts';
import { notifyOrganizer, notifyUser } from '../services/notify.ts';
import {
  badgesFor, BADGE_LABEL, checkPostText, isEventTeam, KIND_LABEL, kindOpen, kindsShown, nameOf, phaseOf, POST_KINDS, type Badge, type PostKind,
} from '../services/community.ts';

/** Reports that hide a post until someone on the team looks at it. */
export const HIDE_AFTER_REPORTS = 3;
const POSTS_PER_10_MIN = 6;

const REPORT_CODES = ['spam', 'scalping', 'abuse', 'drugs', 'personal', 'other'] as const;

type Viewer = { id: string; role: string } | null;

async function eventFor(ctx: Ctx, idOrSlug: string) {
  const ev = await one<any>(ctx.db,
    `select id, slug, title, status, held_for_reports, organizer_id, submitted_by, starts_at, ends_at from events where ${isUuid(idOrSlug) ? 'id' : 'slug'} = $1`, [idOrSlug]);
  if (!ev || ev.status !== 'live' || ev.held_for_reports) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
  return ev;
}

const POST_COLUMNS = `
  p.id, p.event_id, p.user_id, p.parent_id, p.kind, p.body, p.set_id, p.heard_at, p.status, p.pinned, p.official,
  p.helpful_count, p.reply_count, p.report_count, p.created_at, p.edited_at, p.photo_url,
  u.name as author_name, u.photo_url as author_photo, st.artist as set_artist, st.starts_at as set_starts_at`;
const POST_FROM = `from event_posts p join users u on u.id = p.user_id left join sets st on st.id = p.set_id`;

/** What a viewer may see: visible posts, plus their own and (for the team) hidden ones. */
function visibility(viewer: Viewer, team: boolean, at: number): { sql: string; values: unknown[] } {
  if (team) return { sql: `p.status <> 'removed'`, values: [] };
  if (viewer) return { sql: `(p.status = 'visible' or (p.status = 'hidden' and p.user_id = $${at}))`, values: [viewer.id] };
  return { sql: `p.status = 'visible'`, values: [] };
}

function present(r: any, o: { badges: Map<string, Badge[]>; helped: Set<string>; viewer: Viewer; team: boolean; replies?: any[] }) {
  const removed = r.status === 'removed';
  const badges = o.badges.get(r.user_id) ?? [];
  return {
    id: r.id as string,
    kind: r.kind as PostKind,
    parentId: r.parent_id as string | null,
    body: removed ? null : (r.body as string),
    removed,
    hidden: r.status === 'hidden',
    // No name set yet: the screens say "a FeestFinder member" in the reader's language.
    author: removed ? null : {
      name: (r.author_name as string | null)?.trim() || null, initials: r.author_name?.trim() ? initialsOf(r.author_name) : 'FF', photoUrl: r.author_photo as string | null,
      badges: badges.map((b) => ({ key: b, label: BADGE_LABEL[b] })),
    },
    set: r.set_artist ? { id: r.set_id, artist: r.set_artist as string, startsAt: r.set_starts_at } : null,
    heardAt: r.heard_at as string | null,
    photoUrl: removed ? null : (r.photo_url as string | null),
    pinned: r.pinned as boolean,
    official: r.official as boolean,
    helpfulCount: r.helpful_count as number,
    replyCount: r.reply_count as number,
    createdAt: r.created_at as Date,
    edited: !!r.edited_at,
    me: o.viewer ? { mine: r.user_id === o.viewer.id, helped: o.helped.has(r.id) } : null,
    canModerate: o.team,
    replies: o.replies,
  };
}

export type PresentedPost = ReturnType<typeof present>;

/** Posts with their authors' badges and the viewer's own votes, in a fixed number of queries. */
async function decorate(q: Queryable, ev: any, rows: any[], viewer: Viewer) {
  const ids = rows.map((r) => r.id);
  const [badges, helped] = await Promise.all([
    badgesFor(q, ev, rows.filter((r) => r.status !== 'removed').map((r) => r.user_id)),
    viewer && ids.length
      ? many<{ post_id: string }>(q, 'select post_id from event_post_votes where user_id = $1 and post_id = any($2::uuid[])', [viewer.id, ids])
      : Promise.resolve([]),
  ]);
  return { badges, helped: new Set(helped.map((h) => h.post_id)) };
}

/** The organiser's answers to questions: the page's FAQ, for people and for search engines. */
export async function faqFor(q: Queryable, eventId: string, max = 10): Promise<{ question: string; answer: string; askedAt: Date }[]> {
  const rows = await many<any>(q,
    `select distinct on (parent.id) parent.body as question, a.body as answer, parent.created_at as asked_at, parent.helpful_count
       from event_posts a join event_posts parent on parent.id = a.parent_id
      where a.event_id = $1 and a.official and a.status = 'visible' and parent.status = 'visible' and parent.kind = 'qa'
      order by parent.id, a.created_at`, [eventId]);
  return rows.sort((x, y) => y.helpful_count - x.helpful_count).slice(0, max)
    .map((r) => ({ question: r.question, answer: r.answer, askedAt: r.asked_at }));
}

/** How many threads each tab has, as everyone sees them. */
export async function discussionCounts(q: Queryable, eventId: string): Promise<Record<PostKind, number> & { total: number }> {
  const rows = await many<{ kind: PostKind; n: number }>(q,
    `select kind, count(*)::int as n from event_posts where event_id = $1 and parent_id is null and status = 'visible' group by kind`, [eventId]);
  const out = Object.fromEntries(POST_KINDS.map((k) => [k, 0])) as Record<PostKind, number>;
  for (const r of rows) out[r.kind] = r.n;
  return { ...out, total: rows.reduce((n, r) => n + r.n, 0) };
}

function canWrite(req: FastifyRequest): 'ok' | 'signin' | 'verify_phone' {
  const u = req.session?.user;
  if (!u) return 'signin';
  return u.phoneVerified ? 'ok' : 'verify_phone';
}

export default async function discussionRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const viewerOf = (req: FastifyRequest): Viewer => (req.session?.user ? { id: req.session.user.id, role: req.session.user.role } : null);

  /** One tab of an event's discussion, newest or most helpful first, with the first replies. */
  app.get<{ Params: { idOrSlug: string } }>('/events/:idOrSlug/discussion', async (req) => {
    const ev = await eventFor(ctx, req.params.idOrSlug);
    const now = ctx.clock.now();
    const phase = phaseOf(ev, now);
    const shown = kindsShown(phase);
    const f = parse(z.object({
      kind: z.enum(POST_KINDS).optional(),
      sort: z.enum(['top', 'new']).default('top'),
      cursor: z.string().optional(),
      limit: limit(30, 10),
    }), req.query);
    const kind = f.kind ?? shown[0];
    const viewer = viewerOf(req);
    const team = await isEventTeam(ctx.db, ev.id, viewer);
    const offset = decodeCursor(f.cursor);
    const vis = visibility(viewer, team, 3);
    const order = f.sort === 'new'
      ? 'p.pinned desc, p.created_at desc'
      : `p.pinned desc, (exists (select 1 from event_posts a where a.parent_id = p.id and a.official and a.status = 'visible')) desc, p.helpful_count desc, p.reply_count desc, p.created_at desc`;
    // A deleted first post stays as a placeholder while its thread has replies.
    const rows = await many<any>(ctx.db,
      `select ${POST_COLUMNS} ${POST_FROM}
        where p.event_id = $1 and p.kind = $2 and p.parent_id is null and (${vis.sql} or (p.status = 'removed' and p.reply_count > 0))
        order by ${order} limit ${f.limit + 1} offset ${offset}`, [ev.id, kind, ...vis.values]);
    const p = page(rows, offset, f.limit);
    // The first three replies of each thread, the organiser's answer first.
    const threadIds = p.items.map((r) => r.id);
    const replyVis = visibility(viewer, team, 2);
    const replyRows = threadIds.length ? await many<any>(ctx.db,
      `select * from (
         select ${POST_COLUMNS}, row_number() over (partition by p.parent_id order by p.official desc, p.created_at) as n
           ${POST_FROM} where p.parent_id = any($1::uuid[]) and ${replyVis.sql}) x
        where x.n <= 3 order by x.official desc, x.created_at`, [threadIds, ...replyVis.values]) : [];
    const deco = await decorate(ctx.db, ev, [...p.items, ...replyRows], viewer);
    const counts = await discussionCounts(ctx.db, ev.id);
    const items = p.items.map((r) => present(r, { ...deco, viewer, team, replies: replyRows.filter((x) => x.parent_id === r.id).map((x) => present(x, { ...deco, viewer, team })) }));
    return {
      phase,
      kind,
      kinds: [...new Set([...shown, ...POST_KINDS.filter((k) => counts[k] > 0)])].map((k) => ({
        kind: k, label: KIND_LABEL[k], count: counts[k], open: kindOpen(k, phase, ev, now),
      })),
      items,
      nextCursor: p.nextCursor,
      total: counts.total,
      faq: await faqFor(ctx.db, ev.id),
      me: { canWrite: canWrite(req), isTeam: team },
      rules: L('Be kind. No phone numbers or ticket deals — use Resale for tickets.', 'Hãy tử tế. Không đăng số điện thoại hay mua bán vé — dùng mục Pass vé.'),
    };
  });

  app.get<{ Params: { id: string } }>('/posts/:id/replies', async (req) => {
    const id = parse(uuid, req.params.id);
    const parent = await one<any>(ctx.db, 'select id, event_id from event_posts where id = $1 and parent_id is null', [id]);
    if (!parent) throw notFound();
    const ev = await eventFor(ctx, parent.event_id);
    const viewer = viewerOf(req);
    const team = await isEventTeam(ctx.db, ev.id, viewer);
    const vis = visibility(viewer, team, 2);
    const rows = await many<any>(ctx.db,
      `select ${POST_COLUMNS} ${POST_FROM} where p.parent_id = $1 and ${vis.sql} order by p.official desc, p.created_at limit 200`, [id, ...vis.values]);
    const deco = await decorate(ctx.db, ev, rows, viewer);
    return { items: rows.map((r) => present(r, { ...deco, viewer, team })) };
  });

  /** A new thread, or a reply to one. The organiser's reply to a question is its answer. */
  app.post<{ Params: { id: string } }>('/events/:id/posts', async (req, reply) => {
    const s = requireWriter(req);
    const ev = await eventFor(ctx, parse(uuid, req.params.id));
    const body = parse(z.object({
      kind: z.enum(POST_KINDS).optional(),
      body: z.string().max(4000),
      parentId: uuid.optional(),
      setId: uuid.optional(),
      heardAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
      photoUrl: z.string().max(2048).optional(),
    }), req.body);
    const now = ctx.clock.now();
    const team = await isEventTeam(ctx.db, ev.id, s.user);
    const text = checkPostText(body.body, team);

    const recent = await one<{ n: number }>(ctx.db,
      `select count(*)::int as n from event_posts where user_id = $1 and created_at > $2`, [s.user.id, new Date(now.getTime() - 10 * 60_000)]);
    if (!team && recent!.n >= POSTS_PER_10_MIN) {
      throw tooMany('posting_too_fast', L('You are posting fast — try again in a few minutes', 'Bạn đăng hơi nhanh — thử lại sau vài phút'));
    }

    let parent: any = null;
    if (body.parentId) {
      parent = await one<any>(ctx.db, 'select id, user_id, kind, status, parent_id, body from event_posts where id = $1 and event_id = $2', [body.parentId, ev.id]);
      if (!parent || parent.status === 'removed') throw notFound(L('That post is gone', 'Bài này không còn'));
      if (parent.parent_id) throw badRequest('reply_depth', L('Reply to the first post of the thread', 'Hãy trả lời bài đầu của chủ đề'));
    }
    const kind: PostKind = parent ? parent.kind : (body.kind ?? 'talk');
    if (!parent && !kindOpen(kind, phaseOf(ev, now), ev, now)) {
      throw conflict('thread_closed', L('This section is closed for new posts right now', 'Mục này đang đóng, chưa đăng mới được'));
    }
    let setId: string | null = null;
    if (kind === 'trackid' && body.setId) {
      const set = await one<{ id: string }>(ctx.db, 'select id from sets where id = $1 and event_id = $2', [body.setId, ev.id]);
      if (!set) throw badRequest('set_unknown', L('Pick a set from this event', 'Chọn một set của sự kiện này'));
      setId = set.id;
    }
    const official = !!parent && parent.kind === 'qa' && team;
    // A photo for the wall: one this person uploaded, on a memory or a talk post.
    let photoUrl: string | null = null;
    if (body.photoUrl) {
      if (parent || !['memory', 'talk'].includes(kind)) throw badRequest('photo_kind', L('Photos go with memories', 'Ảnh đi kèm mục Kỷ niệm'));
      const up = await one<{ url: string }>(ctx.db, 'select url from uploads where url = $1 and owner_id = $2', [body.photoUrl, s.user.id]);
      if (!up) throw badRequest('photo_unknown', L('Upload the photo first', 'Hãy tải ảnh lên trước'));
      photoUrl = up.url;
    }

    const row = await ctx.db.tx(async (q) => {
      const p = await one<any>(q,
        `insert into event_posts (event_id, user_id, parent_id, kind, body, set_id, heard_at, official, photo_url, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
        [ev.id, s.user.id, parent?.id ?? null, kind, text, setId, kind === 'trackid' ? body.heardAt ?? null : null, official, photoUrl, now]);
      if (parent) {
        await q.query('update event_posts set reply_count = reply_count + 1 where id = $1', [parent.id]);
        // The organiser's answer joins the page's FAQ: the page has changed for search engines.
        if (official) await q.query('update events set updated_at = now() where id = $1', [ev.id]);
        if (parent.user_id !== s.user.id) {
          await notifyUser(q, now, {
            userId: parent.user_id, topic: null, kind: official ? 'post_answered' : 'post_reply',
            dedupeKey: `post-reply:${parent.id}:${official ? 'official' : vnDate(now)}`,
            title: official ? L(`The organiser answered you · ${ev.title}`, `BTC đã trả lời bạn · ${ev.title}`) : L(`New reply · ${ev.title}`, `Có trả lời mới · ${ev.title}`),
            body: { en: text.slice(0, 140), vi: text.slice(0, 140) },
            link: { screen: 'event', eventId: ev.id, postId: parent.id },
          });
        }
      } else if (kind === 'qa' && !team) {
        await notifyOrganizer(q, now, {
          organizerId: ev.organizer_id, topic: 'moderation', kind: 'question', dedupeKey: `questions:${ev.id}:${vnDate(now)}`,
          title: L(`New questions about ${ev.title}`, `Có câu hỏi mới về ${ev.title}`),
          body: L('People are asking on the event page. Your answer becomes the page’s FAQ.', 'Mọi người đang hỏi trên trang sự kiện. Câu trả lời của bạn sẽ thành FAQ của trang.'),
          link: { screen: 'event', eventId: ev.id },
        });
      }
      return one<any>(q, `select ${POST_COLUMNS} ${POST_FROM} where p.id = $1`, [p!.id]);
    });
    const deco = await decorate(ctx.db, ev, [row], s.user);
    return reply.code(201).send({
      post: present(row, { ...deco, viewer: s.user, team, replies: parent ? undefined : [] }),
      message: official ? L('Answer posted · it now shows in the FAQ', 'Đã trả lời · câu này hiện trong FAQ') : L('Posted', 'Đã đăng'),
    });
  });

  /** Authors take their own posts down; the event's team can take down anyone's. */
  app.delete<{ Params: { id: string } }>('/posts/:id', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    const post = await one<any>(ctx.db, 'select * from event_posts where id = $1', [id]);
    if (!post || post.status === 'removed') throw notFound();
    const team = post.user_id === s.user.id ? false : await isEventTeam(ctx.db, post.event_id, s.user);
    if (post.user_id !== s.user.id && !team) throw forbidden();
    await ctx.db.tx(async (q) => {
      await q.query(`update event_posts set status = 'removed', pinned = false, moderated_by = $2, moderated_at = $3 where id = $1`, [id, team ? s.user.id : null, ctx.clock.now()]);
      if (post.parent_id) await q.query('update event_posts set reply_count = greatest(reply_count - 1, 0) where id = $1', [post.parent_id]);
    });
    return { ok: true, message: L('Deleted', 'Đã xoá') };
  });

  for (const method of ['put', 'delete'] as const) {
    app[method]<{ Params: { id: string } }>('/posts/:id/helpful', async (req) => {
      const s = requireUser(req);
      const id = parse(uuid, req.params.id);
      const post = await one<any>(ctx.db, `select id, user_id from event_posts where id = $1 and status = 'visible'`, [id]);
      if (!post) throw notFound();
      if (post.user_id === s.user.id) throw badRequest('own_post', L('That one is yours', 'Đây là bài của bạn'));
      const count = await ctx.db.tx(async (q) => {
        const changed = method === 'put'
          ? await one(q, 'insert into event_post_votes (post_id, user_id, created_at) values ($1,$2,$3) on conflict do nothing returning 1', [id, s.user.id, ctx.clock.now()])
          : await one(q, 'delete from event_post_votes where post_id = $1 and user_id = $2 returning 1', [id, s.user.id]);
        const r = changed
          ? await one<any>(q, `update event_posts set helpful_count = greatest(helpful_count ${method === 'put' ? '+' : '-'} 1, 0) where id = $1 returning helpful_count`, [id])
          : await one<any>(q, 'select helpful_count from event_posts where id = $1', [id]);
        return r.helpful_count as number;
      });
      return { helped: method === 'put', helpfulCount: count };
    });
  }

  /** Three reports hide a post until the event's team or FeestFinder has looked at it. */
  app.post<{ Params: { id: string } }>('/posts/:id/reports', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    const { code } = parse(z.object({ code: z.enum(REPORT_CODES) }), req.body);
    const post = await one<any>(ctx.db, `select id, user_id, status from event_posts where id = $1 and status <> 'removed'`, [id]);
    if (!post) throw notFound();
    if (post.user_id === s.user.id) throw badRequest('own_post', L('That one is yours', 'Đây là bài của bạn'));
    await ctx.db.tx(async (q) => {
      const ins = await one(q, 'insert into event_post_reports (post_id, user_id, code, created_at) values ($1,$2,$3,$4) on conflict do nothing returning 1', [id, s.user.id, code, ctx.clock.now()]);
      if (!ins) return;
      // Counted among reports nobody has looked at yet: a post the team has kept stays up.
      const open = await one<{ n: number }>(q, 'select count(*)::int as n from event_post_reports where post_id = $1 and resolved_at is null', [id]);
      await q.query('update event_posts set report_count = report_count + 1 where id = $1', [id]);
      if (open!.n >= HIDE_AFTER_REPORTS) await q.query(`update event_posts set status = 'hidden', pinned = false where id = $1 and status = 'visible'`, [id]);
    });
    return { ok: true, message: L('Thanks — we will take a look', 'Cảm ơn — chúng tôi sẽ xem xét') };
  });

  /** The event's team (or FeestFinder) pins, hides, restores, or marks an answer as the official one. */
  app.patch<{ Params: { id: string } }>('/posts/:id', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    const body = parse(z.object({ pinned: z.boolean().optional(), hidden: z.boolean().optional(), official: z.boolean().optional() }), req.body);
    const post = await one<any>(ctx.db, `select * from event_posts where id = $1 and status <> 'removed'`, [id]);
    if (!post) throw notFound();
    if (!(await isEventTeam(ctx.db, post.event_id, s.user))) throw forbidden();
    if (body.official !== undefined && !(post.parent_id && post.kind === 'qa')) {
      throw badRequest('not_an_answer', L('Only an answer to a question can be official', 'Chỉ câu trả lời cho câu hỏi mới đánh dấu chính thức được'));
    }
    if (body.pinned && post.parent_id) throw badRequest('pin_threads', L('Pin the first post of a thread', 'Chỉ ghim bài đầu của chủ đề'));
    const now = ctx.clock.now();
    const status = body.hidden === undefined ? post.status : body.hidden ? 'hidden' : 'visible';
    await ctx.db.tx(async (q) => {
      await q.query(
        `update event_posts set pinned = $2, official = $3, status = $4, moderated_by = $5, moderated_at = $6 where id = $1`,
        [id, status === 'hidden' ? false : body.pinned ?? post.pinned, body.official ?? post.official, status, s.user.id, now]);
      if (body.hidden === false) await q.query('update event_post_reports set resolved_at = $2 where post_id = $1 and resolved_at is null', [id, now]);
    });
    const message: Localized = body.hidden === true ? L('Hidden', 'Đã ẩn') : body.hidden === false ? L('Visible again', 'Đã hiện lại')
      : body.pinned === true ? L('Pinned', 'Đã ghim') : body.pinned === false ? L('Unpinned', 'Đã bỏ ghim')
      : body.official ? L('Marked as the official answer', 'Đã đánh dấu là câu trả lời chính thức') : L('Saved', 'Đã lưu');
    return { ok: true, status, message };
  });

  /** FeestFinder's queue of reported posts, across every event. */
  app.get('/admin/posts/reported', async (req) => {
    requireAdmin(req);
    const rows = await many<any>(ctx.db,
      `select p.id, p.body, p.kind, p.status, p.report_count, p.created_at, p.event_id, e.title as event_title, e.slug as event_slug,
              u.name as author_name, u.id as author_id,
              (select array_agg(distinct r.code) from event_post_reports r where r.post_id = p.id and r.resolved_at is null) as codes
         from event_posts p join events e on e.id = p.event_id join users u on u.id = p.user_id
        where p.status <> 'removed' and exists (select 1 from event_post_reports r where r.post_id = p.id and r.resolved_at is null)
        order by p.report_count desc, p.created_at desc limit 100`);
    return {
      items: rows.map((r) => ({
        id: r.id, body: r.body, kind: r.kind, kindLabel: KIND_LABEL[r.kind as PostKind], status: r.status, reports: r.report_count, codes: r.codes ?? [],
        createdAt: r.created_at, at: vnTime(new Date(r.created_at)),
        event: { id: r.event_id, title: r.event_title, slug: r.event_slug },
        author: { id: r.author_id, name: nameOf(r.author_name) },
      })),
    };
  });

  /** Close the reports on a post without changing it. */
  app.post<{ Params: { id: string } }>('/admin/posts/:id/dismiss', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const now = ctx.clock.now();
    const post = await one<any>(ctx.db, `update event_posts set status = case when status = 'hidden' then 'visible' else status end, moderated_by = $2, moderated_at = $3
                                         where id = $1 returning status`, [id, s.user.id, now]);
    if (!post) throw notFound();
    await ctx.db.query('update event_post_reports set resolved_at = $2 where post_id = $1 and resolved_at is null', [id, now]);
    return { ok: true, status: post.status, message: L('Reports dismissed', 'Đã bỏ qua báo cáo') };
  });
}
