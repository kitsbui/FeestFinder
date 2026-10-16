import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { formatMoney } from '../../lib/money.ts';
import { cityLabel, timezoneOf } from '../../lib/places.ts';
import { dateIn } from '../../lib/time.ts';
import { dateStr, parse, uuid } from '../../lib/validate.ts';
import { AD_CURRENCY, EVENT_AD_PLACEMENT_LABEL, EVENT_AD_PLACEMENTS, MIN_EVENT_AD_BUDGET, type EventAdPlacement } from '../../lib/ads.ts';
import { requireOrganizer } from '../../http/guards.ts';
import { appendAudit } from '../../services/audit.ts';
import { notifyAdmins } from '../../services/notify.ts';

/*
 * Advertising an event an organiser posted (lib/ads.ts). Posting is free and goes through review;
 * promoting it is a request the team answers in the Console (/admin/boosts): which placements,
 * the budget, from when to when, and a note. One open request per event; an open one can be
 * withdrawn. Every admin is told of a new request.
 *
 *   GET    /organizer/ads            the organiser's requests, and the events they can promote
 *   POST   /organizer/ads            ask
 *   DELETE /organizer/ads/:id        withdraw an open request
 */

const STATUS_LABEL = {
  open: L('Waiting', 'Đang chờ'), approved: L('Approved', 'Đã duyệt'), done: L('Approved', 'Đã duyệt'),
  declined: L('Declined', 'Từ chối'), withdrawn: L('Withdrawn', 'Đã rút'),
} as const;

export function presentAdRequest(r: any) {
  const placements = (r.placements ?? ['featured']) as EventAdPlacement[];
  return {
    id: r.id as string,
    status: r.status as keyof typeof STATUS_LABEL,
    statusLabel: STATUS_LABEL[r.status as keyof typeof STATUS_LABEL],
    event: { id: r.event_id as string, slug: r.slug as string, title: r.title as string, startsOn: r.starts_on_event as string | null, city: r.city as string | null },
    placements: placements.map((k) => ({ key: k, label: EVENT_AD_PLACEMENT_LABEL[k] })),
    budget: r.budget == null ? null : Number(r.budget),
    currency: (r.currency ?? AD_CURRENCY) as string,
    startsOn: r.starts_on ? String(r.starts_on).slice(0, 10) : null,
    endsOn: r.ends_on ? String(r.ends_on).slice(0, 10) : null,
    message: r.message as string | null,
    reply: r.reply as string | null,
    requestedAt: r.created_at as Date,
    answeredAt: r.answered_at as Date | null,
  };
}

export const AD_REQUEST_COLUMNS = `b.*, e.slug, e.title, e.city, e.starts_on::text as starts_on_event`;

const AdRequest = z.object({
  eventId: uuid,
  placements: z.array(z.enum(EVENT_AD_PLACEMENTS)).min(1).max(EVENT_AD_PLACEMENTS.length),
  budget: z.number().int().min(MIN_EVENT_AD_BUDGET).max(100_000_000_000),
  startsOn: dateStr,
  endsOn: dateStr,
  message: z.string().trim().max(2000).optional(),
});

export default async function organizerAdRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.get('/organizer/ads', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const now = ctx.clock.now();
    const [rows, events] = await Promise.all([
      many<any>(ctx.db,
        `select ${AD_REQUEST_COLUMNS} from boost_requests b join events e on e.id = b.event_id where b.organizer_id = $1 order by b.created_at desc limit 100`,
        [org.organizerId]),
      // What can be promoted: posted (live or in review) and not over yet.
      many<any>(ctx.db,
        `select id, slug, title, status, city, starts_on::text as starts_on, coalesce(ends_on, starts_on)::text as ends_on from events
          where organizer_id = $1 and status in ('live', 'in_review') and (ends_at is null or ends_at >= $2) order by starts_at nulls last limit 100`,
        [org.organizerId, now]),
    ]);
    return {
      items: rows.map(presentAdRequest),
      events: events.map((e) => ({ id: e.id, slug: e.slug, title: e.title, status: e.status, startsOn: e.starts_on, endsOn: e.ends_on, cityLabel: cityLabel(e.city) })),
      placements: EVENT_AD_PLACEMENTS.map((k) => ({ key: k, label: EVENT_AD_PLACEMENT_LABEL[k] })),
      minBudget: MIN_EVENT_AD_BUDGET,
      currency: AD_CURRENCY,
    };
  });

  app.post('/organizer/ads', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const b = parse(AdRequest, req.body);
    const ev = await one<any>(ctx.db,
      `select id, slug, title, status, city, organizer_id, starts_on::text as starts_on, coalesce(ends_on, starts_on)::text as last_day, ends_at from events where id = $1`, [b.eventId]);
    if (!ev || ev.organizer_id !== org.organizerId) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    if (!['live', 'in_review'].includes(ev.status)) throw badRequest('not_posted', L('Post the event first: only a submitted or live listing can be advertised', 'Hãy đăng sự kiện trước: chỉ tin đã gửi duyệt hoặc đang đăng mới quảng cáo được'));
    const now = ctx.clock.now();
    const today = dateIn(now, timezoneOf(ev.city));
    if (ev.ends_at && new Date(ev.ends_at) < now) throw badRequest('event_over', L('This event is over', 'Sự kiện này đã kết thúc'));
    if (b.endsOn < b.startsOn) throw badRequest('dates_order', L('The end date is before the start date', 'Ngày kết thúc trước ngày bắt đầu'));
    if (b.startsOn < today) throw badRequest('starts_in_past', L('Start today or later', 'Hãy bắt đầu từ hôm nay trở đi'));
    if (ev.last_day && b.endsOn > ev.last_day) throw badRequest('after_event', L('End the advertising by the event’s last day', 'Kết thúc quảng cáo trước hoặc vào ngày cuối của sự kiện'), { lastDay: ev.last_day });

    const row = await ctx.db.tx(async (q) => {
      const made = await one<{ id: string }>(q,
        `insert into boost_requests (event_id, organizer_id, requested_by, placements, budget, currency, starts_on, ends_on, message, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (event_id) where status = 'open' do nothing returning id`,
        [ev.id, org.organizerId, org.userId, [...new Set(b.placements)], b.budget, AD_CURRENCY, b.startsOn, b.endsOn, b.message || null, now]);
      if (!made) throw conflict('ad_request_open', L('This event already has a request waiting; withdraw it to send another', 'Sự kiện này đã có yêu cầu đang chờ; hãy rút yêu cầu đó để gửi yêu cầu mới'));
      const who = await one<{ name: string }>(q, 'select name from organizers where id = $1', [org.organizerId]);
      await appendAudit(q, {
        at: now, actorType: 'organizer', actorId: org.userId, actorLabel: who?.name || 'Organiser', action: 'boost.requested', targetType: 'event', targetId: ev.id, targetLabel: ev.title,
        diff: [{ f: 'placements', a: '—', b: b.placements.join(', ') }, { f: 'budget', a: '—', b: String(b.budget) }, { f: 'window', a: '—', b: `${b.startsOn} → ${b.endsOn}` }],
      });
      await notifyAdmins(q, now, {
        kind: 'ad_request', dedupeKey: `ad-request:${made.id}`,
        title: L(`Ad request: ${ev.title}`, `Yêu cầu quảng cáo: ${ev.title}`),
        body: L(`${who?.name ?? ''} · ${formatMoney(b.budget, AD_CURRENCY, 'en')} · ${b.startsOn} → ${b.endsOn}`, `${who?.name ?? ''} · ${formatMoney(b.budget, AD_CURRENCY, 'vi')} · ${b.startsOn} → ${b.endsOn}`),
        cta: L('Answer it', 'Trả lời'), link: { url: '/console/featured' },
      });
      return one<any>(q, `select ${AD_REQUEST_COLUMNS} from boost_requests b join events e on e.id = b.event_id where b.id = $1`, [made.id]);
    });
    return reply.code(201).send({ ...presentAdRequest(row), message: L('Sent to FeestFinder · we reply within two working days', 'Đã gửi FeestFinder · chúng tôi trả lời trong hai ngày làm việc') });
  });

  app.delete<{ Params: { id: string } }>('/organizer/ads/:id', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const r = await one<any>(ctx.db, `update boost_requests set status = 'withdrawn', answered_at = $3 where id = $1 and organizer_id = $2 and status = 'open' returning id`,
      [parse(uuid, req.params.id), org.organizerId, ctx.clock.now()]);
    if (!r) throw notFound(L('No waiting request to withdraw', 'Không có yêu cầu đang chờ để rút'));
    return { ok: true, message: L('Request withdrawn', 'Đã rút yêu cầu') };
  });
}
