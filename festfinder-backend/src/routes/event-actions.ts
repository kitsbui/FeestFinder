import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one } from '../db/index.ts';
import { AppError, badRequest, conflict, notFound, tooMany } from '../lib/errors.ts';
import { L, REPORT_CODES } from '../lib/i18n.ts';
import { parse, uuid } from '../lib/validate.ts';
import { requireUser } from '../http/guards.ts';
import { appendAudit } from '../services/audit.ts';
import { GuideUnavailable, trimGuide } from '../services/guide.ts';
import { notifyOrganizer } from '../services/notify.ts';

/** Listings with this many separate reporters are pulled from the feed while moderators check. */
export const REPORT_HOLD_THRESHOLD = 2;
const GUIDE_TTL_MS = 24 * 3600_000;

const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export default async function eventActionRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const guideCalls = new Map<string, number[]>();

  const liveEvent = async (id: string) => {
    const ev = await one<any>(ctx.db, `select * from events where id = $1 and status = 'live'`, [parse(uuid, id)]);
    if (!ev) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    return ev;
  };

  app.post<{ Params: { id: string } }>('/events/:id/reports', async (req, reply) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    const body = parse(z.object({
      code: z.enum(Object.keys(REPORT_CODES) as [string, ...string[]]),
      note: z.string().max(1000).default(''),
    }), req.body);
    const now = ctx.clock.now();
    const held = await ctx.db.tx(async (q) => {
      const ins = await one(q,
        `insert into listing_reports (event_id, user_id, code, note, created_at) values ($1,$2,$3,$4,$5)
         on conflict (event_id, user_id) do nothing returning 1`, [ev.id, s.user.id, body.code, body.note.trim(), now]);
      if (!ins) throw conflict('already_reported', L('You already reported this listing', 'Bạn đã báo cáo tin này'));
      const open = await one<any>(q, 'select count(distinct user_id)::int as n from listing_reports where event_id = $1 and resolved_at is null', [ev.id]);
      if (open.n >= REPORT_HOLD_THRESHOLD && !ev.held_for_reports) {
        await q.query('update events set held_for_reports = true where id = $1', [ev.id]);
        await appendAudit(q, {
          at: now, actorType: 'system', actorId: null, actorLabel: 'System', action: 'listing.held_by_reports',
          targetType: 'event', targetId: ev.id, targetLabel: ev.title,
          diff: [{ f: 'visible_in_feed', a: 'true', b: 'false' }, { f: 'reports_open', a: String(open.n - 1), b: String(open.n) }],
        });
        await notifyOrganizer(q, now, {
          organizerId: ev.organizer_id, topic: 'moderation', kind: 'reject',
          title: L('Listing paused while we check reports', 'Tin tạm ẩn trong lúc kiểm tra báo cáo'),
          body: L(`${ev.title} was reported by ${open.n} people and is hidden from the feed until a moderator reviews it.`,
            `${ev.title} bị ${open.n} người báo cáo và tạm ẩn khỏi feed cho tới khi được kiểm duyệt.`),
          cta: L('Open moderation thread', 'Mở thư kiểm duyệt'),
          link: { screen: 'inbox' }, dedupeKey: `held:${ev.id}`,
        });
        return true;
      }
      return false;
    });
    return reply.code(201).send({
      ok: true, heldFromFeed: held,
      message: L('Report sent. We usually come back within a day.', 'Đã gửi báo cáo. Chúng tôi thường phản hồi trong một ngày.'),
      policy: L('Listings with two or more reports are pulled from the feed while we check.', 'Tin có từ hai báo cáo trở lên sẽ tạm ẩn khỏi feed trong lúc kiểm tra.'),
    });
  });

  /** "Notify me" on a tier that is not on sale yet. */
  app.put<{ Params: { id: string; tierId: string } }>('/events/:id/tiers/:tierId/watch', async (req) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    const tier = await one(ctx.db, 'select 1 from ticket_tiers where id = $1 and event_id = $2', [parse(uuid, req.params.tierId), ev.id]);
    if (!tier) throw notFound();
    await ctx.db.query('insert into tier_watchers (user_id, tier_id) values ($1,$2) on conflict do nothing', [s.user.id, req.params.tierId]);
    return { watching: true, message: L('We will tell you when this tier opens', 'Chúng tôi sẽ báo khi loại vé này mở bán') };
  });

  /** "Remind me 24h before": saving the event is what drives that reminder. */
  app.post<{ Params: { id: string } }>('/events/:id/remind', async (req) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    await ctx.db.tx(async (q) => {
      const ins = await one(q, 'insert into saves (user_id, event_id) values ($1,$2) on conflict do nothing returning 1', [s.user.id, ev.id]);
      if (ins) await q.query('update events set save_count = save_count + 1 where id = $1', [ev.id]);
      await q.query(`insert into notification_prefs (user_id, topic, push) values ($1, 'saved', true)
                     on conflict (user_id, topic) do update set push = true`, [s.user.id]);
    });
    return { ok: true, message: L('We will remind you 24h before', 'Sẽ nhắc bạn trước 24 giờ') };
  });

  app.get<{ Params: { id: string } }>('/events/:id/calendar.ics', async (req, reply) => {
    const ev = await liveEvent(req.params.id);
    const url = `${ctx.config.publicBaseUrl.replace(/\/$/, '')}/e/${ev.slug}`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FestFinder//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${ev.id}@festfinder.vn`,
      `DTSTAMP:${icsDate(ctx.clock.now())}`,
      `DTSTART:${icsDate(new Date(ev.starts_at))}`,
      `DTEND:${icsDate(new Date(ev.ends_at))}`,
      `SUMMARY:${icsEscape(ev.title)}`,
      `LOCATION:${icsEscape([ev.venue_name, ev.address, ev.area].filter(Boolean).join(', '))}`,
      ...(ev.lat !== null ? [`GEO:${ev.lat};${ev.lng}`] : []),
      `URL:${url}`,
      `DESCRIPTION:${icsEscape(`${ev.description?.vi || ev.description?.en || ''}\n${url}`)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(ev.title)}`, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR', '',
    ].join('\r\n');
    return reply.type('text/calendar; charset=utf-8').header('content-disposition', `attachment; filename="${ev.slug}.ics"`).send(ics);
  });

  /** Numbers for the post-event recap screen. */
  app.get<{ Params: { id: string } }>('/events/:id/recap', async (req) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    const now = ctx.clock.now();
    const [ticket, presence, setsSeen, friends, next, existing] = await Promise.all([
      one<any>(ctx.db, 'select checked_in_at from tickets where user_id = $1 and event_id = $2 and checked_in_at is not null order by checked_in_at limit 1', [s.user.id, ev.id]),
      one<any>(ctx.db, 'select updated_at from presence where user_id = $1 and event_id = $2', [s.user.id, ev.id]),
      one<any>(ctx.db, 'select count(*)::int as n from plan_picks p join sets st on st.id = p.set_id where p.user_id = $1 and st.event_id = $2 and st.starts_at <= $3', [s.user.id, ev.id, now]),
      one<any>(ctx.db, 'select count(*)::int as n from friendships f join going g on g.user_id = f.friend_id where f.user_id = $1 and g.event_id = $2', [s.user.id, ev.id]),
      one<any>(ctx.db,
        `select id, slug, title, art, starts_on, organizer_id = $2 as same_organizer from events
          where status = 'live' and id <> $1 and ends_at >= $3 order by (organizer_id = $2) desc, starts_at limit 1`, [ev.id, ev.organizer_id, now]),
      one<any>(ctx.db, 'select stars, aspects, photo_urls from recaps where user_id = $1 and event_id = $2', [s.user.id, ev.id]),
    ]);
    return {
      event: { id: ev.id, slug: ev.slug, title: ev.title, art: ev.art, startsOn: ev.starts_on },
      aspects: ['sound', 'crowd', 'value', 'org', 'queue', 'food'],
      stats: {
        checkedInAt: ticket?.checked_in_at ?? presence?.updated_at ?? null,
        setsSeen: setsSeen.n,
        friendsThere: friends.n,
      },
      next: next ? {
        id: next.id, slug: next.slug, title: next.title, art: next.art, startsOn: next.starts_on,
        label: next.same_organizer ? L('Next from this organiser', 'Sự kiện tiếp theo của nhà tổ chức') : L('You might like next', 'Có thể bạn thích'),
      } : null,
      submitted: existing ? { stars: existing.stars, aspects: existing.aspects, photoUrls: existing.photo_urls } : null,
    };
  });

  app.post<{ Params: { id: string } }>('/events/:id/recaps', async (req, reply) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    const body = parse(z.object({
      stars: z.number().int().min(1).max(5),
      aspects: z.array(z.enum(['sound', 'crowd', 'value', 'org', 'queue', 'food'])).max(6).default([]),
      photoUrls: z.array(z.string().url()).max(3).default([]),
    }), req.body);
    if (new Date(ev.starts_at) > ctx.clock.now()) throw badRequest('not_started', L('You can rate it once it has started', 'Bạn đánh giá được khi sự kiện đã bắt đầu'));
    const attended = await one(ctx.db,
      `select 1 where exists (select 1 from going where user_id = $1 and event_id = $2)
          or exists (select 1 from tickets where user_id = $1 and event_id = $2)
          or exists (select 1 from presence where user_id = $1 and event_id = $2)`, [s.user.id, ev.id]);
    if (!attended) throw badRequest('not_attended', L('Only people who went can rate this event', 'Chỉ người đã tham dự mới đánh giá được'));
    await ctx.db.query(
      `insert into recaps (user_id, event_id, stars, aspects, photo_urls) values ($1,$2,$3,$4,$5)
       on conflict (user_id, event_id) do update set stars = excluded.stars, aspects = excluded.aspects, photo_urls = excluded.photo_urls`,
      [s.user.id, ev.id, body.stars, body.aspects, body.photoUrls]);
    return reply.code(201).send({ ok: true, message: L('Thanks — your rating helps the next crowd', 'Cảm ơn — đánh giá của bạn giúp người đi sau') });
  });

  /**
   * AI local guide: where to eat before, where to go after, what to wear. Generated by Claude
   * once per event and language, cached for a day. Signed-in users get 20 generations an hour.
   */
  app.get<{ Params: { id: string } }>('/events/:id/guide', async (req) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    const { lang, refresh } = parse(z.object({ lang: z.enum(['en', 'vi']).default(req.lang), refresh: z.enum(['1', 'true']).optional() }), req.query);
    const now = ctx.clock.now();
    const cached = await one<any>(ctx.db, 'select data, model, created_at from ai_guides where event_id = $1 and lang = $2', [ev.id, lang]);
    if (cached && !refresh && now.getTime() - new Date(cached.created_at).getTime() < GUIDE_TTL_MS) {
      return { ...cached.data, cached: true, generatedAt: cached.created_at };
    }
    if (!ctx.config.aiGuideEnabled) {
      if (cached) return { ...cached.data, cached: true, generatedAt: cached.created_at };
      throw new AppError(503, 'guide_unavailable', L('The local guide is taking a break. Try again later.', 'Hướng dẫn địa phương đang tạm nghỉ. Thử lại sau nhé.'));
    }
    const calls = (guideCalls.get(s.user.id) ?? []).filter((t) => now.getTime() - t < 3600_000);
    if (calls.length >= 20) throw tooMany('guide_rate_limited', L('Give the guide a minute and try again', 'Đợi một chút rồi thử lại nhé'));
    guideCalls.set(s.user.id, [...calls, now.getTime()]);
    try {
      const data = trimGuide(await ctx.guide.generate({
        title: ev.title, genre: ev.genre, venueName: ev.venue_name, address: ev.address, area: ev.area,
        startTime: ev.start_time, endTime: ev.end_time, lineup: ev.lineup, age: ev.age, priceFrom: ev.price_from, entryMode: ev.entry_mode,
      }, lang));
      await ctx.db.query(
        `insert into ai_guides (event_id, lang, data, model, created_at) values ($1,$2,$3,$4,$5)
         on conflict (event_id, lang) do update set data = excluded.data, model = excluded.model, created_at = excluded.created_at`,
        [ev.id, lang, JSON.stringify(data), ctx.guide.model, now]);
      return { ...data, cached: false, generatedAt: now };
    } catch (e) {
      if (e instanceof GuideUnavailable) {
        ctx.log(`guide unavailable for ${ev.slug}/${lang}: ${e.reason} ${e.message}`);
        if (cached) return { ...cached.data, cached: true, stale: true, generatedAt: cached.created_at };
        throw new AppError(503, 'guide_unavailable', L('The local guide is taking a break. Try again later.', 'Hướng dẫn địa phương đang tạm nghỉ. Thử lại sau nhé.'), { reason: e.reason });
      }
      throw e;
    }
  });
}
