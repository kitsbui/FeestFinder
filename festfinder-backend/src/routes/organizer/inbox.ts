import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Queryable } from '../../db/index.ts';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L, type Localized } from '../../lib/i18n.ts';
import { limit, parse, uuid } from '../../lib/validate.ts';
import { requireOrganizer } from '../../http/guards.ts';
import { decodeCursor, page } from '../../http/sql.ts';
import { appendAudit } from '../../services/audit.ts';
import { DEFAULT_ORG_PREFS, loadOrgPrefs, notifyOrganizer } from '../../services/notify.ts';

const TOPIC_WHO: Record<string, Localized> = {
  moderation: L('FeestFinder · Moderation', 'FeestFinder · Kiểm duyệt'),
  partnerships: L('FeestFinder · Partnerships', 'FeestFinder · Đối tác'),
  support: L('FeestFinder · Support', 'FeestFinder · Hỗ trợ'),
};

const AUTO_ACK = L('Got it — we will review and come back within two working hours.', 'Đã nhận. Chúng tôi xem lại và phản hồi trong 2 giờ làm việc.');

/** Finds or opens the moderation thread for a listing. */
export async function moderationThread(q: Queryable, ev: { id: string; organizer_id: string; title: string }, now: Date): Promise<string> {
  const existing = await one<any>(q, `select id from inbox_threads where event_id = $1 and topic = 'moderation' order by created_at desc limit 1`, [ev.id]);
  if (existing) return existing.id;
  const t = await one<any>(q,
    `insert into inbox_threads (organizer_id, event_id, topic, subject, organizer_unread, updated_at, created_at) values ($1,$2,'moderation',$3,false,$4,$4) returning id`,
    [ev.organizer_id, ev.id, json(L(`About ${ev.title}`, `Về ${ev.title}`)), now]);
  return t.id;
}

export default async function organizerInboxRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.get('/organizer/inbox', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const rows = await many<any>(ctx.db,
      `select t.*, e.title as event_title, e.starts_on as event_starts_on,
              (select json_build_object('sender', m.sender, 'body', m.body, 'at', m.created_at) from inbox_messages m where m.thread_id = t.id order by m.created_at desc, m.seq desc limit 1) as last
         from inbox_threads t left join events e on e.id = t.event_id
        where t.organizer_id = $1 order by t.updated_at desc`, [org.organizerId]);
    return {
      unread: rows.filter((r) => r.organizer_unread).length,
      items: rows.map((t) => ({
        id: t.id, topic: t.topic, who: TOPIC_WHO[t.topic], subject: t.subject, unread: t.organizer_unread, updatedAt: t.updated_at,
        about: t.event_title ? { eventId: t.event_id, title: t.event_title, startsOn: t.event_starts_on } : null,
        snippet: t.last ? { en: String(t.last.body.en).slice(0, 76), vi: String(t.last.body.vi).slice(0, 76) } : null,
      })),
      responseNote: L('The moderation team replies within two working hours, 09:00–18:00.', 'Đội kiểm duyệt phản hồi trong 2 giờ làm việc, 09:00–18:00.'),
    };
  });

  app.get<{ Params: { threadId: string } }>('/organizer/inbox/:threadId', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const t = await one<any>(ctx.db, 'select * from inbox_threads where id = $1 and organizer_id = $2', [parse(uuid, req.params.threadId), org.organizerId]);
    if (!t) throw notFound();
    const msgs = await many<any>(ctx.db, 'select id, sender, body, created_at from inbox_messages where thread_id = $1 order by created_at, seq', [t.id]);
    await ctx.db.query('update inbox_threads set organizer_unread = false where id = $1', [t.id]);
    return {
      id: t.id, topic: t.topic, who: TOPIC_WHO[t.topic], subject: t.subject,
      messages: msgs.map((m) => ({ id: m.id, fromMe: m.sender === 'org', body: m.body, createdAt: m.created_at })),
    };
  });

  app.post<{ Params: { threadId: string } }>('/organizer/inbox/:threadId/messages', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const { body } = parse(z.object({ body: z.string().trim().min(1).max(2000) }), req.body);
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const t = await one<any>(q, 'select * from inbox_threads where id = $1 and organizer_id = $2', [parse(uuid, req.params.threadId), org.organizerId]);
      if (!t) throw notFound();
      const prev = await one<any>(q, 'select sender from inbox_messages where thread_id = $1 order by created_at desc, seq desc limit 1', [t.id]);
      const m = await one<any>(q,
        `insert into inbox_messages (thread_id, sender, author_id, body, created_at) values ($1,'org',$2,$3,$4) returning id, created_at`,
        [t.id, org.userId, json({ en: body, vi: body }), now]);
      await q.query('update inbox_threads set admin_unread = true, updated_at = $2 where id = $1', [t.id, now]);
      // One acknowledgement per turn, so the organiser knows the message landed.
      if (prev?.sender === 'ff') {
        await q.query(`insert into inbox_messages (thread_id, sender, body, created_at) values ($1,'ff',$2,$3)`, [t.id, json(AUTO_ACK), new Date(now.getTime() + 1000)]);
      }
      return m;
    });
    return reply.code(201).send({ id: out.id, fromMe: true, body: { en: body, vi: body }, createdAt: out.created_at, message: L('Reply sent', 'Đã gửi trả lời') });
  });

  /** An organiser can answer a rejection once, within the appeal window. */
  app.post<{ Params: { eventId: string } }>('/organizer/events/:eventId/appeal', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const { reply: text } = parse(z.object({ reply: z.string().trim().min(10).max(2000) }), req.body);
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const a = await one<any>(q,
        `select a.*, e.title, e.organizer_id from appeals a join events e on e.id = a.event_id
          where a.event_id = $1 order by a.created_at desc limit 1 for update of a`, [parse(uuid, req.params.eventId)]);
      if (!a || a.organizer_id !== org.organizerId) throw notFound(L('No appeal is open for this listing', 'Tin này không có khiếu nại đang mở'));
      if (a.state !== 'open') throw conflict('appeal_not_open', L('You have already replied to this appeal', 'Bạn đã trả lời khiếu nại này'));
      if (new Date(a.closes_at) <= now) throw badRequest('appeal_closed', L('The seven-day appeal window has closed', 'Đã hết hạn 7 ngày khiếu nại'));
      await q.query(`update appeals set state = 'replied', reply = $2, replied_at = $3 where id = $1`, [a.id, text, now]);
      const name = await one<any>(q, 'select name from organizers where id = $1', [org.organizerId]);
      await appendAudit(q, {
        at: now, actorType: 'organizer', actorId: org.userId, actorLabel: name.name, action: 'appeal.replied',
        targetType: 'event', targetId: a.event_id, targetLabel: a.title, diff: [{ f: 'appeal', a: 'open', b: 'replied' }],
      });
    });
    return { ok: true, message: L('Appeal sent. A moderator will look at it within a day.', 'Đã gửi khiếu nại. Kiểm duyệt viên sẽ xem trong một ngày.') };
  });

  // ---- notification bell ---------------------------------------------------------

  app.get('/organizer/notifications', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const { cursor, limit: lim } = parse(z.object({ cursor: z.string().optional(), limit: limit(50, 20) }), req.query);
    const offset = decodeCursor(cursor);
    const rows = await many<any>(ctx.db,
      'select * from notifications where organizer_id = $1 order by created_at desc limit $2 offset $3', [org.organizerId, lim + 1, offset]);
    const unread = await one<any>(ctx.db, 'select count(*)::int as n from notifications where organizer_id = $1 and read_at is null', [org.organizerId]);
    const p = page(rows, offset, lim);
    return {
      unread: unread.n, nextCursor: p.nextCursor,
      items: p.items.map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, cta: n.cta, link: n.link, unread: !n.read_at, createdAt: n.created_at })),
    };
  });

  app.post<{ Params: { id: string } }>('/organizer/notifications/:id/read', async (req) => {
    const org = await requireOrganizer(ctx, req);
    await ctx.db.query('update notifications set read_at = coalesce(read_at, $3) where id = $1 and organizer_id = $2', [parse(uuid, req.params.id), org.organizerId, ctx.clock.now()]);
    return { ok: true };
  });

  app.post('/organizer/notifications/read-all', async (req) => {
    const org = await requireOrganizer(ctx, req);
    await ctx.db.query('update notifications set read_at = $2 where organizer_id = $1 and read_at is null', [org.organizerId, ctx.clock.now()]);
    return { ok: true, message: L('All marked as read', 'Đã đánh dấu đã đọc tất cả') };
  });

  app.get('/organizer/notification-preferences', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const prefs = await loadOrgPrefs(ctx.db, org.organizerId);
    return {
      topics: (Object.keys(DEFAULT_ORG_PREFS) as (keyof typeof DEFAULT_ORG_PREFS)[]).map((k) => ({
        key: k, enabled: prefs[k],
        channels: !prefs[k] ? L('Off', 'Tắt') : k === 'moderation' || k === 'tickets' ? L('Push, email & SMS', 'Push, email & SMS') : L('Push & email', 'Push & email'),
      })),
    };
  });

  app.put('/organizer/notification-preferences', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const body = parse(z.object({ moderation: z.boolean(), tickets: z.boolean(), payouts: z.boolean(), crew: z.boolean() }).partial(), req.body);
    for (const [topic, enabled] of Object.entries(body)) {
      await ctx.db.query(
        `insert into organizer_notification_prefs (organizer_id, topic, enabled) values ($1,$2,$3)
         on conflict (organizer_id, topic) do update set enabled = excluded.enabled`, [org.organizerId, topic, enabled]);
    }
    return { ok: true };
  });

  /** "Send a test push" in the bell dropdown. */
  app.post('/organizer/notifications/test', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const sent = await ctx.db.tx((q) => notifyOrganizer(q, ctx.clock.now(), {
      organizerId: org.organizerId, topic: 'crew', kind: 'crew',
      title: L('Test notification', 'Thông báo thử'),
      body: L('This is how gate crew alerts will look on your phone.', 'Cảnh báo từ crew cổng sẽ hiện như thế này trên điện thoại.'),
      cta: L('View gate crew', 'Xem crew cổng'), link: { screen: 'door' },
    }));
    return { sent, ...(sent ? {} : { message: L('Gate crew alerts are switched off', 'Cảnh báo crew cổng đang tắt') }) };
  });
}
