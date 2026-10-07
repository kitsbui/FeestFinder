import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { forbidden, notFound, tooMany } from '../lib/errors.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { cityOf } from '../lib/places.ts';
import { initialsOf } from '../lib/contact.ts';
import { vnDate } from '../lib/time.ts';
import { parse, uuid } from '../lib/validate.ts';
import { isUuid } from '../http/sql.ts';
import { requireOrganizer, requireOwnEvent, requireUser } from '../http/guards.ts';
import { notifyUser } from '../services/notify.ts';
import { nameOf, phaseOf } from '../services/community.ts';
import { badgesOf } from '../services/badges.ts';

/*
 * The night itself and what stays after it: the organiser's live updates, the photo wall,
 * each attendee's raver passport of stamps, and their year in review.
 */

export const UPDATE_KINDS = ['info', 'delay', 'gate', 'safety', 'lineup'] as const;
const UPDATE_LABEL: Record<(typeof UPDATE_KINDS)[number], Localized> = {
  info: L('Update', 'Cập nhật'), delay: L('Schedule change', 'Đổi giờ'), gate: L('Entry', 'Cổng vào'), safety: L('Safety', 'An toàn'), lineup: L('Lineup', 'Đội hình'),
};
/** Updates that also go out as a notification, per event per day. */
const NOTIFIED_PER_DAY = 10;

export function presentUpdate(u: any) {
  return { id: u.id as string, kind: u.kind as string, kindLabel: UPDATE_LABEL[u.kind as keyof typeof UPDATE_LABEL], body: u.body as string, createdAt: u.created_at as Date, notified: u.notified as boolean };
}

export async function latestUpdates(q: Queryable, eventId: string, max = 20) {
  const rows = await many<any>(q, 'select * from event_updates where event_id = $1 and removed_at is null order by created_at desc limit $2', [eventId, max]);
  return rows.map(presentUpdate);
}

// ---- stamps: the nights someone was actually there --------------------------------------

/** A night counts once the door scanned your ticket, or you checked in on the site. */
async function stamps(q: Queryable, userId: string, now: Date) {
  return many<any>(q,
    `select e.id, e.slug, e.title, e.genre, e.art, e.cover_url, e.starts_on, e.start_time, e.end_time, e.venue_name, e.area, e.city, e.lineup,
            bool_or(x.via = 'door') as by_door
       from (select event_id, 'door' as via from tickets where user_id = $1 and status = 'used'
             union all select event_id, 'checkin' as via from presence where user_id = $1) x
       join events e on e.id = x.event_id
      where e.starts_at <= $2
      group by e.id order by e.starts_on desc`, [userId, now]);
}

const overnight = (r: any) => !!(r.start_time && r.end_time && r.end_time < r.start_time);

const BADGES: { key: string; icon: string; label: Localized; need: Localized }[] = [
  { key: 'first', icon: 'ph-fill ph-ticket', label: L('First night', 'Đêm đầu tiên'), need: L('Get your first stamp', 'Có con dấu đầu tiên') },
  { key: 'five', icon: 'ph-fill ph-fire', label: L('Five nights', 'Năm đêm'), need: L('5 nights out', '5 đêm đi chơi') },
  { key: 'ten', icon: 'ph-fill ph-crown-simple', label: L('Ten nights', 'Mười đêm'), need: L('10 nights out', '10 đêm đi chơi') },
  { key: 'hopper', icon: 'ph-fill ph-shuffle', label: L('Genre hopper', 'Đa thể loại'), need: L('3 different genres', '3 thể loại khác nhau') },
  { key: 'afterdark', icon: 'ph-fill ph-moon-stars', label: L('After dark', 'Thức tới sáng'), need: L('A night that ran past midnight', 'Một đêm kéo qua nửa đêm') },
  { key: 'traveller', icon: 'ph-fill ph-airplane-tilt', label: L('On tour', 'Đi tour'), need: L('Nights in 2 cities', 'Đi chơi ở 2 thành phố') },
  { key: 'voice', icon: 'ph-fill ph-megaphone', label: L('Helpful voice', 'Người chia sẻ'), need: L('5 helpful votes on your posts', '5 lượt "hữu ích" cho bài của bạn') },
  { key: 'ambassador', icon: 'ph-fill ph-share-network', label: L('Ambassador', 'Đại sứ'), need: L('Bring 10 people with your links', 'Mang về 10 người qua link của bạn') },
];

export default async function nightRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const liveEvent = async (idOrSlug: string) => {
    const ev = await one<any>(ctx.db,
      `select id, slug, title, status, held_for_reports, starts_at, ends_at, organizer_id from events where ${isUuid(idOrSlug) ? 'id' : 'slug'} = $1`, [idOrSlug]);
    if (!ev || ev.status !== 'live' || ev.held_for_reports) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    return ev;
  };

  // ---- the organiser's live updates --------------------------------------------------------

  app.get<{ Params: { idOrSlug: string } }>('/events/:idOrSlug/updates', async (req) => {
    const ev = await liveEvent(req.params.idOrSlug);
    return { phase: phaseOf(ev, ctx.clock.now()), items: await latestUpdates(ctx.db, ev.id, 30) };
  });

  /**
   * What the organiser tells everyone on the night. With `notify`, ticket holders and people
   * going hear it straight away, through quiet hours, up to ten times a day.
   */
  app.post<{ Params: { id: string } }>('/organizer/events/:id/updates', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const body = parse(z.object({ kind: z.enum(UPDATE_KINDS).default('info'), body: z.string().trim().min(2).max(500), notify: z.boolean().default(true) }), req.body);
    const now = ctx.clock.now();
    if (ev.status !== 'live') throw forbidden('event_not_live', L('Post updates once the listing is live', 'Đăng bảng tin khi sự kiện đã lên sóng'));
    const out = await ctx.db.tx(async (q) => {
      const today = await one<{ n: number }>(q,
        `select count(*)::int as n from event_updates where event_id = $1 and notified and created_at > $2`, [ev.id, new Date(now.getTime() - 86400_000)]);
      const notify = body.notify && !(ev.ends_at && new Date(ev.ends_at) < now);
      if (notify && today!.n >= NOTIFIED_PER_DAY) {
        throw tooMany('updates_limit', L('Ten notified updates a day — post this one without a notification', 'Tối đa 10 bảng tin có thông báo mỗi ngày — hãy đăng không kèm thông báo'));
      }
      const u = await one<any>(q,
        `insert into event_updates (event_id, author_id, kind, body, notified, created_at) values ($1,$2,$3,$4,$5,$6) returning *`,
        [ev.id, org.userId, body.kind, body.body, notify, now]);
      // The update shows on the event page, so search engines hear the page changed.
      await q.query('update events set updated_at = now() where id = $1', [ev.id]);
      let reached = 0;
      if (notify) {
        const people = await many<{ user_id: string }>(q,
          `select user_id from tickets where event_id = $1 and status in ('valid', 'used') and user_id is not null
           union select user_id from going where event_id = $1`, [ev.id]);
        for (const p of people) {
          if (await notifyUser(q, now, {
            userId: p.user_id, topic: null, kind: 'event_update', urgent: true, dedupeKey: `update:${u.id}`,
            title: { en: `${ev.title} · ${UPDATE_LABEL[body.kind].en}`, vi: `${ev.title} · ${UPDATE_LABEL[body.kind].vi}` },
            body: { en: body.body, vi: body.body },
            link: { screen: 'event', eventId: ev.id, section: 'updates' },
          })) reached++;
        }
      }
      return { u, reached };
    });
    return reply.code(201).send({
      update: presentUpdate(out.u), reached: out.reached,
      message: out.u.notified ? L(`Posted · sent to ${out.reached} people`, `Đã đăng · đã báo ${out.reached} người`) : L('Posted', 'Đã đăng'),
    });
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/updates', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    return { items: await latestUpdates(ctx.db, ev.id, 50) };
  });

  app.delete<{ Params: { id: string; updateId: string } }>('/organizer/events/:id/updates/:updateId', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const row = await one(ctx.db, 'update event_updates set removed_at = $3 where id = $1 and event_id = $2 and removed_at is null returning 1',
      [parse(uuid, req.params.updateId), ev.id, ctx.clock.now()]);
    if (!row) throw notFound();
    return { ok: true, message: L('Removed', 'Đã gỡ') };
  });

  // ---- the photo wall -----------------------------------------------------------------------

  /** Photos attendees posted with their memories, newest first; hidden posts take theirs with them. */
  app.get<{ Params: { idOrSlug: string } }>('/events/:idOrSlug/photos', async (req) => {
    const ev = await liveEvent(req.params.idOrSlug);
    const rows = await many<any>(ctx.db,
      `select p.id, p.photo_url, p.body, p.helpful_count, p.created_at, u.name from event_posts p join users u on u.id = p.user_id
        where p.event_id = $1 and p.status = 'visible' and p.photo_url is not null order by p.created_at desc limit 60`, [ev.id]);
    return {
      items: rows.map((r) => ({ id: r.id, url: r.photo_url, caption: r.body, helpfulCount: r.helpful_count, createdAt: r.created_at, author: { name: r.name?.trim() || null, initials: r.name?.trim() ? initialsOf(r.name) : 'FF' } })),
    };
  });

  // ---- the raver passport ---------------------------------------------------------------------

  app.get('/me/passport', async (req) => {
    const s = requireUser(req);
    const now = ctx.clock.now();
    const [rows, helpful, brought] = await Promise.all([
      stamps(ctx.db, s.user.id, now),
      one<{ n: number }>(ctx.db, 'select coalesce(sum(helpful_count), 0)::int as n from event_posts where user_id = $1 and status = $2', [s.user.id, 'visible']),
      one<{ n: number }>(ctx.db, 'select count(*)::int as n from share_visits where ref_user = $1', [s.user.id]),
    ]);
    const nights = new Set(rows.map((r) => r.starts_on)).size;
    const genres = new Set(rows.map((r) => r.genre).filter(Boolean));
    const cities = new Set(rows.map((r) => cityOf(r.city).slug));
    const venues = new Set(rows.map((r) => r.venue_name).filter(Boolean));
    const earned: Record<string, boolean> = {
      first: nights >= 1, five: nights >= 5, ten: nights >= 10, hopper: genres.size >= 3, afterdark: rows.some(overnight),
      traveller: cities.size >= 2, voice: helpful!.n >= 5, ambassador: brought!.n >= 10,
    };
    return {
      stats: { nights, events: rows.length, genres: genres.size, venues: venues.size, cities: cities.size },
      stamps: rows.map((r) => ({
        eventId: r.id, slug: r.slug, title: r.title, genre: r.genre, art: r.art, coverUrl: r.cover_url, date: r.starts_on,
        venue: r.venue_name, area: r.area, city: cityOf(r.city).name, via: r.by_door ? 'door' : 'checkin',
      })),
      badges: BADGES.map((b) => ({ key: b.key, icon: b.icon, label: b.label, need: b.need, earned: !!earned[b.key] })),
    };
  });

  /** The fan's own badges: earned, then in progress; the new ones count as seen once read. */
  app.get('/me/badges', async (req) => {
    const s = requireUser(req);
    return { items: await badgesOf(ctx.db, 'user', s.user.id, ctx.clock.now(), { own: true }) };
  });

  // ---- the year in review -----------------------------------------------------------------------

  app.get('/me/wrapped', async (req) => {
    const s = requireUser(req);
    const now = ctx.clock.now();
    const { year } = parse(z.object({ year: z.coerce.number().int().min(2020).max(2100).default(Number(vnDate(now).slice(0, 4))) }), req.query);
    const from = `${year}-01-01`, to = `${year}-12-31`;
    const all = await stamps(ctx.db, s.user.id, now);
    const rows = all.filter((r) => r.starts_on >= from && r.starts_on <= to).reverse();
    const ids = rows.map((r) => r.id);
    const count = <T extends string>(xs: T[]) => {
      const m = new Map<T, number>();
      for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
    };
    const yearRange = [new Date(`${from}T00:00:00+07:00`), new Date(`${to}T23:59:59+07:00`)];
    const [hypes, posts, helpful, brought, passed, friends] = await Promise.all([
      one<{ n: number }>(ctx.db, 'select count(*)::int as n from hypes where user_id = $1 and created_at between $2 and $3', [s.user.id, ...yearRange]),
      one<{ n: number }>(ctx.db, `select count(*)::int as n from event_posts where user_id = $1 and status <> 'removed' and created_at between $2 and $3`, [s.user.id, ...yearRange]),
      one<{ n: number }>(ctx.db, 'select coalesce(sum(helpful_count), 0)::int as n from event_posts where user_id = $1 and created_at between $2 and $3', [s.user.id, ...yearRange]),
      one<{ n: number }>(ctx.db, 'select count(*)::int as n from share_visits where ref_user = $1 and created_at between $2 and $3', [s.user.id, ...yearRange]),
      one<{ n: number }>(ctx.db, 'select count(*)::int as n from ticket_transfers where from_user = $1 and created_at between $2 and $3', [s.user.id, ...yearRange]),
      ids.length ? many<any>(ctx.db,
        `select distinct u.id, u.name from friendships f join users u on u.id = f.friend_id
          where f.user_id = $1 and (exists (select 1 from presence p where p.user_id = u.id and p.event_id = any($2::uuid[]))
                                    or exists (select 1 from tickets t where t.user_id = u.id and t.status = 'used' and t.event_id = any($2::uuid[]))
                                    or exists (select 1 from going g where g.user_id = u.id and g.event_id = any($2::uuid[])))`, [s.user.id, ids]) : Promise.resolve([]),
    ]);
    const genre = count(rows.map((r) => r.genre).filter(Boolean));
    const artist = count(rows.flatMap((r) => (r.lineup ?? []) as string[]).filter((a) => !/vendors|gian hàng|DJ set \d/i.test(a)));
    const venue = count(rows.map((r) => r.venue_name).filter(Boolean));
    const latest = rows.filter(overnight).sort((a, b) => a.end_time.localeCompare(b.end_time)).pop() ?? null;
    const brief = (r: any) => (r ? { title: r.title, date: r.starts_on, venue: r.venue_name, slug: r.slug, genre: r.genre } : null);
    return {
      year,
      empty: rows.length === 0,
      nights: new Set(rows.map((r) => r.starts_on)).size,
      events: rows.length,
      topGenre: genre ? { genre: genre[0], nights: genre[1] } : null,
      topArtist: artist ? { name: artist[0], times: artist[1] } : null,
      topVenue: venue ? { name: venue[0], times: venue[1] } : null,
      first: brief(rows[0] ?? null),
      last: brief(rows[rows.length - 1] ?? null),
      latestNight: latest ? { ...brief(latest), until: latest.end_time } : null,
      friends: friends.map((f) => ({ name: nameOf(f.name), initials: initialsOf(nameOf(f.name)) })).slice(0, 8),
      friendsCount: friends.length,
      hypes: hypes!.n, posts: posts!.n, helpful: helpful!.n, brought: brought!.n, passedOn: passed!.n,
      cities: [...new Set(rows.map((r) => cityOf(r.city).slug))].map((c) => cityOf(c).name),
    };
  });
}
