import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Queryable } from '../../db/index.ts';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.ts';
import { fill, L, type Localized } from '../../lib/i18n.ts';
import { formatVnPhone, maskPhone } from '../../lib/contact.ts';
import { toCsv } from '../../lib/csv.ts';
import { inQuietHours, quietHoursEnd, vnDate } from '../../lib/time.ts';
import { csv, limit, parse, uuid } from '../../lib/validate.ts';
import { requireOrganizer, requireOwnEvent, requireUser } from '../../http/guards.ts';
import { decodeCursor, page } from '../../http/sql.ts';
import { enqueue, loadPrefs } from '../../services/notify.ts';
import { qrToken } from '../../services/tickets.ts';
import { refundOrder } from '../../services/orders.ts';

type Audience = 'saved' | 'holders' | 'vip' | 'past';
type Channel = 'push' | 'zalo' | 'email';
const TOPIC: Record<Audience, 'saved' | 'tickets' | 'orgs'> = { saved: 'saved', holders: 'tickets', vip: 'tickets', past: 'orgs' };
const AUDIENCE_LABEL: Record<Audience, Localized> = {
  saved: L('everyone who saved', 'người đã lưu'), holders: L('ticket holders', 'khách đã mua vé'),
  vip: L('VIP holders', 'khách VIP'), past: L('past attendees', 'khách kỳ trước'),
};

const STATE_OF = (status: string) => (status === 'used' ? 'in' : status === 'refunded' ? 'refunded' : 'out');
const METHOD_LABEL: Record<string, Localized> = {
  momo: L('Momo', 'Momo'), zalopay: L('Zalo Pay', 'Zalo Pay'), vietqr: L('VietQR', 'VietQR'), card: L('card', 'thẻ'), mock: L('card', 'thẻ'),
};

/** User ids in an announcement audience. */
async function audienceIds(q: Queryable, ev: any, audience: Audience, now: Date): Promise<string[]> {
  const sql = {
    saved: `select distinct user_id from saves where event_id = $1`,
    holders: `select distinct user_id from tickets where event_id = $1 and status in ('valid','used') and user_id is not null`,
    vip: `select distinct t.user_id from tickets t join ticket_tiers tt on tt.id = t.tier_id where t.event_id = $1 and tt.key = 'vip' and t.status in ('valid','used') and t.user_id is not null`,
    past: `select distinct x.user_id from (
             select t.user_id, t.event_id from tickets t where t.status = 'used'
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

  // ---- attendees -----------------------------------------------------------

  const ATTENDEE_SQL = `
    select t.id, t.code, t.holder_name, t.holder_phone, t.kind, t.status, t.checked_in_at, t.resent_at, t.created_at,
           o.id as order_id, o.code as order_code, o.payment_method, o.paid_at, tt.key as tier_key, tt.name as tier_name
      from tickets t left join orders o on o.id = t.order_id left join ticket_tiers tt on tt.id = t.tier_id
     where t.event_id = $1`;

  function filterSql(filter: string, q: string | undefined, params: unknown[]) {
    const where: string[] = [];
    if (filter === 'in') where.push(`t.status = 'used'`);
    if (filter === 'out') where.push(`t.status = 'valid'`);
    if (filter === 'refunded') where.push(`t.status = 'refunded'`);
    if (filter === 'vip') where.push(`tt.key = 'vip'`);
    if (q?.trim()) {
      // Phones are stored as +84…; "0903 118" should still match, so drop the local leading zero.
      const digits = q.replace(/\D/g, '').replace(/^0/, '');
      params.push(`%${q.trim().toLowerCase()}%`, digits.length >= 3 ? `%${digits}%` : 'no-match');
      where.push(`(lower(t.holder_name) like $${params.length - 1} or lower(coalesce(o.code, t.code)) like $${params.length - 1} or regexp_replace(coalesce(t.holder_phone,''), '\\D', '', 'g') like $${params.length})`);
    }
    return where.map((w) => ` and ${w}`).join('');
  }

  function attendeeRow(r: any, canSeePhone: boolean) {
    const phone = r.holder_phone ? (canSeePhone ? formatVnPhone(r.holder_phone) : maskPhone(r.holder_phone)) : null;
    const bought: Localized = r.kind === 'guest' ? L('Guest list', 'Khách mời')
      : L(`${r.paid_at ? new Date(r.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Ho_Chi_Minh' }) : ''} · ${METHOD_LABEL[r.payment_method]?.en ?? ''}`,
        `${r.paid_at ? new Date(r.paid_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }) : ''} · ${METHOD_LABEL[r.payment_method]?.vi ?? ''}`);
    return {
      ticketId: r.id, ticketCode: r.code, name: r.holder_name, phone, orderId: r.order_id, orderCode: r.order_code ?? r.code, bought,
      checkedInAt: r.checked_in_at, tier: r.kind === 'guest' ? 'guest' : r.tier_key, tierName: r.tier_name ?? L('Guest', 'Khách mời'),
      state: STATE_OF(r.status), resent: !!r.resent_at,
    };
  }

  app.get<{ Params: { id: string } }>('/organizer/events/:id/attendees', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const f = parse(z.object({ q: z.string().max(60).optional(), filter: z.enum(['all', 'in', 'out', 'vip', 'refunded']).default('all'), limit: limit(100, 10), cursor: z.string().optional() }), req.query);
    const offset = decodeCursor(f.cursor);
    const params: unknown[] = [ev.id];
    const where = filterSql(f.filter, f.q, params);
    params.push(f.limit + 1, offset);
    const rows = await many<any>(ctx.db, `${ATTENDEE_SQL} ${where} order by t.created_at, t.code limit $${params.length - 1} offset $${params.length}`, params);
    const k = await one<any>(ctx.db,
      `select count(*) filter (where t.status in ('valid','used'))::int as sold,
              count(*) filter (where t.status = 'used')::int as checked_in,
              count(*) filter (where t.status = 'valid')::int as not_in,
              count(*) filter (where t.status = 'refunded')::int as refunded,
              count(*)::int as all_rows,
              count(*) filter (where tt.key = 'vip')::int as vip
         from tickets t left join ticket_tiers tt on tt.id = t.tier_id where t.event_id = $1`, [ev.id]);
    // The venue capacity the organiser declared, the same number the door screen counts against.
    const capacity = ev.capacity ?? (await one<any>(ctx.db, 'select coalesce(sum(capacity),0)::int as n from ticket_tiers where event_id = $1', [ev.id])).n;
    const p = page(rows, offset, f.limit);
    return {
      kpis: {
        sold: k.sold, capacity, checkedIn: k.checked_in, checkedInPct: k.sold ? Math.round((k.checked_in / k.sold) * 100) : 0,
        notIn: k.not_in, refunded: k.refunded, refundedPct: k.sold + k.refunded ? Math.round((k.refunded / (k.sold + k.refunded)) * 1000) / 10 : 0,
      },
      filters: { all: k.all_rows, in: k.checked_in, out: k.not_in, vip: k.vip, refunded: k.refunded },
      items: p.items.map((r) => attendeeRow(r, org.role === 'owner')),
      nextCursor: p.nextCursor,
      privacy: L('Phone numbers are visible to the account owner and gate leads only', 'Số điện thoại chỉ hiện với chủ tài khoản và trưởng cửa'),
    };
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/attendees.csv', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const rows = await many<any>(ctx.db, `${ATTENDEE_SQL} order by t.created_at, t.code`, [ev.id]);
    const body = toCsv(
      ['ticket_code', 'order_code', 'name', 'phone', 'tier', 'status', 'checked_in_at', 'payment_method', 'paid_at'],
      rows.map((r) => {
        const a = attendeeRow(r, org.role === 'owner');
        return [a.ticketCode, a.orderCode, a.name, a.phone, a.tier, a.state, r.checked_in_at?.toISOString?.() ?? '', r.payment_method ?? 'guest', r.paid_at?.toISOString?.() ?? ''];
      }));
    return reply.type('text/csv; charset=utf-8').header('content-disposition', `attachment; filename="${ev.slug}-attendees.csv"`).send(body);
  });

  app.post<{ Params: { ticketId: string } }>('/organizer/tickets/:ticketId/resend', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const t = await one<any>(ctx.db, 'select t.*, e.organizer_id, e.title from tickets t join events e on e.id = t.event_id where t.id = $1', [parse(uuid, req.params.ticketId)]);
    if (!t || t.organizer_id !== org.organizerId) throw notFound();
    if (t.status === 'refunded') throw conflict('ticket_refunded', L('That ticket was refunded — nothing to resend', 'Vé này đã hoàn tiền — không gửi lại được'));
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      await q.query('update tickets set resent_at = $2 where id = $1', [t.id, now]);
      const user = t.user_id ? await one<any>(q, 'select email, phone, locale from users where id = $1', [t.user_id]) : null;
      const payload = { lang: user?.locale ?? 'vi', title: { en: `Your ticket · ${t.title}`, vi: `Vé của bạn · ${t.title}` }, body: { en: t.code, vi: t.code }, qr: qrToken(ctx.config.ticketSigningSecret, t.event_id, t.code) };
      const phone = user?.phone ?? t.holder_phone;
      if (phone) await enqueue(q, t.user_id, 'zalo', phone, 'ticket_resend', payload, now);
      if (user?.email) await enqueue(q, t.user_id, 'email', user.email, 'ticket_resend', payload, now);
    });
    return { ok: true, state: 'resent', message: fill(L('Ticket resent to {n}', 'Đã gửi lại vé cho {n}'), { n: t.holder_name }) };
  });

  /** Refund a whole order: tickets stop scanning and seats go back on sale. */
  app.post<{ Params: { orderId: string } }>('/organizer/orders/:orderId/refund', async (req) => {
    const org = await requireOrganizer(ctx, req);
    if (org.role !== 'owner') throw forbidden('owner_only', L('Only the account owner can refund', 'Chỉ chủ tài khoản hoàn tiền được'));
    const now = ctx.clock.now();
    const out = await ctx.db.tx((q) => refundOrder(q, parse(uuid, req.params.orderId), now, (o) => o.organizer_id === org.organizerId));
    return { ok: true, orderCode: out.code, message: L('Refunded', 'Đã hoàn tiền') };
  });

  // ---- announcements ---------------------------------------------------------

  const AnnouncementInput = z.object({
    audience: z.enum(['saved', 'holders', 'vip', 'past']),
    channels: z.array(z.enum(['push', 'zalo', 'email'])),
    subject: z.string().max(120),
    body: z.string().max(2000),
    sendAt: z.string().datetime({ offset: true }).nullable().optional(),
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/announcements/estimate', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const f = parse(z.object({ audience: z.enum(['saved', 'holders', 'vip', 'past']).default('saved'), channels: csv(z.enum(['push', 'zalo', 'email'])).default([]) }), req.query);
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
