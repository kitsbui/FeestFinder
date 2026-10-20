import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Queryable } from '../../db/index.ts';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L, type Localized } from '../../lib/i18n.ts';
import { inQuietHours, quietHoursEnd, vnDate } from '../../lib/time.ts';
import { csv, parse, uuid } from '../../lib/validate.ts';
import { requireOrganizer, requireOwnEvent, requireUser } from '../../http/guards.ts';
import { enqueue, loadPrefs } from '../../services/notify.ts';

/** Who an announcement reaches: people who saved the night, who said they are going, who went to this organiser's nights before. */
type Audience = 'saved' | 'going' | 'past';
type Channel = 'push' | 'zalo' | 'email';
const AUDIENCES = ['saved', 'going', 'past'] as const;
const TOPIC: Record<Audience, 'saved' | 'orgs'> = { saved: 'saved', going: 'saved', past: 'orgs' };
const AUDIENCE_LABEL: Record<Audience, Localized> = {
  saved: L('everyone who saved', 'người đã lưu'), going: L('everyone going', 'người sẽ đi'), past: L('past attendees', 'khách kỳ trước'),
};

/** User ids in an announcement audience. */
async function audienceIds(q: Queryable, ev: any, audience: Audience, now: Date): Promise<string[]> {
  const sql = {
    saved: `select distinct user_id from saves where event_id = $1`,
    going: `select distinct user_id from going where event_id = $1`,
    past: `select distinct x.user_id from (
             select p.user_id, p.event_id from presence p
             union select g.user_id, g.event_id from going g) x
           join events e on e.id = x.event_id
           where e.organizer_id = $2 and e.id <> $1 and e.ends_at < $3 and x.user_id is not null`,
  }[audience];
  const params = audience === 'past' ? [ev.id, ev.organizer_id, now] : [ev.id];
  return (await many<{ user_id: string }>(q, sql, params)).map((r) => r.user_id);
}

/** For each person, which of the chosen channels actually reach them (switched on + an address). */
async function reachable(q: Queryable, userIds: string[], audience: Audience, channels: Channel[]) {
  if (!userIds.length) return new Map<string, { channel: Channel; address: string }[]>();
  const [users, devices, zalo] = await Promise.all([
    many<any>(q, 'select id, email, phone, locale from users where id = any($1::uuid[])', [userIds]),
    many<any>(q, 'select user_id, token from devices where user_id = any($1::uuid[])', [userIds]),
    many<any>(q, `select user_id, external_id from social_connections where provider = 'zalo' and user_id = any($1::uuid[])`, [userIds]),
  ]);
  const topic = TOPIC[audience];
  const out = new Map<string, { channel: Channel; address: string }[]>();
  for (const u of users) {
    const prefs = (await loadPrefs(q, u.id))[topic];
    const targets: { channel: Channel; address: string }[] = [];
    if (channels.includes('push') && prefs.push) for (const d of devices.filter((x) => x.user_id === u.id)) targets.push({ channel: 'push', address: d.token });
    if (channels.includes('zalo') && prefs.zalo) {
      const addr = zalo.find((x) => x.user_id === u.id)?.external_id ?? u.phone;
      if (addr) targets.push({ channel: 'zalo', address: addr });
    }
    if (channels.includes('email') && prefs.email && u.email) targets.push({ channel: 'email', address: u.email });
    out.set(u.id, targets);
  }
  return out;
}

async function estimate(q: Queryable, ev: any, audience: Audience, channels: Channel[], now: Date) {
  const ids = await audienceIds(q, ev, audience, now);
  const all = await reachable(q, ids, audience, ['push', 'zalo', 'email']);
  const size = ids.length;
  const per = (['push', 'zalo', 'email'] as Channel[]).map((c) => {
    const n = [...all.values()].filter((t) => t.some((x) => x.channel === c)).length;
    return { channel: c, reachable: n, rate: size ? Math.round((n / size) * 100) : 0, selected: channels.includes(c) };
  });
  const union = [...all.values()].filter((t) => t.some((x) => channels.includes(x.channel))).length;
  return { audience, audienceSize: size, reach: union, channels: per, note: L('Based on who has each channel switched on. Nobody is counted twice.', 'Tính từ số người đã bật từng kênh. Một người chỉ được tính một lần.') };
}

/** Sends an announcement now: in-app notice plus each reachable channel. Returns people reached. */
export async function dispatchAnnouncement(q: Queryable, announcementId: string, now: Date): Promise<number> {
  const a = await one<any>(q, `select a.*, e.title, e.starts_on, e.organizer_id, e.id as event_id from announcements a join events e on e.id = a.event_id where a.id = $1`, [announcementId]);
  if (!a || a.status !== 'scheduled') return 0;
  const ids = await audienceIds(q, { id: a.event_id, organizer_id: a.organizer_id }, a.audience, now);
  const targets = await reachable(q, ids, a.audience, a.channels);
  const urgent = a.starts_on === vnDate(now);
  const notBefore = !urgent && inQuietHours(now) ? quietHoursEnd(now) : now;
  let reached = 0;
  for (const userId of ids) {
    const t = targets.get(userId) ?? [];
    await q.query(
      `insert into notifications (user_id, kind, title, body, link, dedupe_key, created_at) values ($1,'announcement',$2,$3,$4,$5,$6)
       on conflict (coalesce(user_id, organizer_id), dedupe_key) where dedupe_key is not null do nothing`,
      [userId, json({ en: a.subject, vi: a.subject }), json({ en: a.body, vi: a.body }), json({ screen: 'event', eventId: a.event_id, announcementId }), `announcement:${announcementId}`, now]);
    for (const x of t) {
      await enqueue(q, userId, x.channel, x.address, 'announcement', { lang: 'vi', title: { en: a.subject, vi: a.subject }, body: { en: a.body, vi: a.body }, link: { screen: 'event', eventId: a.event_id } }, notBefore, announcementId);
    }
    if (t.length) reached++;
  }
  await q.query(`update announcements set status = 'sent', sent_at = $2, reach = $3 where id = $1`, [announcementId, now, reached]);
  return reached;
}

export default async function organizerAudienceRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const AnnouncementInput = z.object({
    audience: z.enum(AUDIENCES),
    channels: z.array(z.enum(['push', 'zalo', 'email'])),
    subject: z.string().max(120),
    body: z.string().max(2000),
    sendAt: z.string().datetime({ offset: true }).nullable().optional(),
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/announcements/estimate', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const f = parse(z.object({ audience: z.enum(AUDIENCES).default('saved'), channels: csv(z.enum(['push', 'zalo', 'email'])).default([]) }), req.query);
    return estimate(ctx.db, ev, f.audience, f.channels as Channel[], ctx.clock.now());
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/announcements', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const rows = await many<any>(ctx.db, `select * from announcements where event_id = $1 and status <> 'cancelled' order by send_at desc`, [ev.id]);
    return {
      items: rows.map((a) => ({
        id: a.id, subject: a.subject, body: a.body, status: a.status, audience: a.audience, audienceLabel: AUDIENCE_LABEL[a.audience as Audience],
        channels: a.channels, sendAt: a.send_at, sentAt: a.sent_at, reach: a.reach,
        openedPct: a.status === 'sent' && a.reach ? Math.round((a.opened / a.reach) * 100) : null,
      })),
      rule: L('One announcement per event per 24 hours. Recipients can switch them off at any time.', 'Giới hạn một thông báo mỗi 24 giờ cho một sự kiện. Người nhận có thể tắt bất kỳ lúc nào.'),
    };
  });

  app.post<{ Params: { id: string } }>('/organizer/events/:id/announcements', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const body = parse(AnnouncementInput, req.body);
    const subject = body.subject.trim();
    const text = body.body.trim();
    if (!subject || !text) throw badRequest('message_required', L('Add a subject and a message', 'Cần tiêu đề và nội dung'));
    if (text.length > 320) throw badRequest('message_too_long', L('Keep it to 320 characters', 'Tối đa 320 ký tự'), { length: text.length });
    if (!body.channels.length) throw badRequest('channel_required', L('Pick at least one channel', 'Chọn ít nhất một kênh'));
    if (ev.status !== 'live') throw conflict('event_not_live', L('Announcements go out once the listing is live', 'Chỉ gửi thông báo khi tin đã lên sóng'));
    const now = ctx.clock.now();
    const sendAt = body.sendAt ? new Date(body.sendAt) : now;
    if (sendAt.getTime() < now.getTime() - 60_000) throw badRequest('send_at_past', L('Pick a time in the future', 'Chọn thời điểm trong tương lai'));
    const out = await ctx.db.tx(async (q) => {
      const clash = await one<any>(q,
        `select send_at from announcements where event_id = $1 and status <> 'cancelled' and abs(extract(epoch from (send_at - $2::timestamptz))) < 86400`, [ev.id, sendAt]);
      if (clash) throw conflict('announcement_cooldown', L('One announcement per event per 24 hours', 'Mỗi sự kiện chỉ một thông báo trong 24 giờ'), { conflictsWith: clash.send_at });
      const a = await one<any>(q,
        `insert into announcements (event_id, audience, channels, subject, body, status, send_at, created_by, created_at) values ($1,$2,$3,$4,$5,'scheduled',$6,$7,$8) returning id`,
        [ev.id, body.audience, body.channels, subject, text, sendAt, org.userId, now]);
      const est = await estimate(q, ev, body.audience, body.channels as Channel[], now);
      await q.query('update announcements set reach = $2 where id = $1', [a.id, est.reach]);
      const reached = sendAt.getTime() <= now.getTime() ? await dispatchAnnouncement(q, a.id, now) : null;
      return { id: a.id, reach: reached ?? est.reach, scheduled: reached === null };
    });
    return reply.code(201).send({
      id: out.id, status: out.scheduled ? 'scheduled' : 'sent', reach: out.reach,
      message: out.scheduled ? L(`Scheduled · ${out.reach} people`, `Đã hẹn gửi · ${out.reach} người`) : L(`Sending to ${out.reach} people`, `Đang gửi tới ${out.reach} người`),
    });
  });

  app.delete<{ Params: { id: string } }>('/organizer/announcements/:id', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const a = await one<any>(ctx.db, 'select a.status, e.organizer_id from announcements a join events e on e.id = a.event_id where a.id = $1', [parse(uuid, req.params.id)]);
    if (!a || a.organizer_id !== org.organizerId) throw notFound();
    if (a.status !== 'scheduled') throw conflict('already_sent', L('It has already gone out', 'Thông báo đã được gửi'));
    await ctx.db.query(`update announcements set status = 'cancelled' where id = $1`, [req.params.id]);
    return { ok: true, message: L('Schedule cancelled', 'Đã huỷ lịch gửi') };
  });

  /** The app calls this when someone opens an announcement, for the "opened" rate. */
  app.post<{ Params: { id: string } }>('/announcements/:id/opened', async (req, reply) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    const first = await one(ctx.db,
      `update notifications set read_at = coalesce(read_at, $3) where user_id = $1 and dedupe_key = $2 and read_at is null returning 1`,
      [s.user.id, `announcement:${id}`, ctx.clock.now()]);
    if (first) await ctx.db.query('update announcements set opened = opened + 1 where id = $1', [id]);
    return reply.code(202).send({ ok: true });
  });
}
