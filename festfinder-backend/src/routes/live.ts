import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { json, many, one } from '../db/index.ts';
import { badRequest, notFound, tooMany } from '../lib/errors.ts';
import { fill, L } from '../lib/i18n.ts';
import { initialsOf } from '../lib/contact.ts';
import { atVn, toMinutes, vnDate, vnTime, addDays } from '../lib/time.ts';
import { parse, uuid } from '../lib/validate.ts';
import { requireUser } from '../http/guards.ts';
import { areFriends } from '../services/friends.ts';
import { notifyUser } from '../services/notify.ts';

/** Friend positions older than this are treated as "left the site". */
const PRESENCE_TTL_MS = 3 * 3600_000;

export default async function liveRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const waves = new Map<string, number>();

  const liveEvent = async (id: string) => {
    const ev = await one<any>(ctx.db, `select * from events where id = $1 and status = 'live'`, [parse(uuid, id)]);
    if (!ev) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    return ev;
  };

  /** On-site mode: what's playing on each stage right now, the site map, and friends inside. */
  app.get<{ Params: { id: string } }>('/events/:id/live', async (req) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    const now = ctx.clock.now();

    // The festival "day" runs from doors to close; for 16:00–02:00 events, 01:30 still belongs to yesterday.
    const today = vnDate(now);
    const overnight = !!ev.start_time && !!ev.end_time && toMinutes(ev.end_time) <= toMinutes(ev.start_time);
    const dayOf = overnight && toMinutes(vnTime(now)) < toMinutes(ev.end_time) + 60 ? addDays(today, -1) : today;

    const [stages, sets, picks, zones, friends] = await Promise.all([
      many<any>(ctx.db, 'select id, name from stages where event_id = $1 order by sort, id', [ev.id]),
      many<any>(ctx.db, 'select id, stage_id, day, artist, starts_at, ends_at from sets where event_id = $1 order by starts_at', [ev.id]),
      many<any>(ctx.db, 'select p.set_id, p.remind from plan_picks p join sets st on st.id = p.set_id where p.user_id = $1 and st.event_id = $2', [s.user.id, ev.id]),
      many<any>(ctx.db, 'select id, label, kind, x, y, w from site_zones where event_id = $1', [ev.id]),
      many<any>(ctx.db,
        `select u.id, u.name, u.photo_url, p.zone_id, z.label as zone_label, p.updated_at
           from presence p join friendships f on f.friend_id = p.user_id join users u on u.id = p.user_id
           left join site_zones z on z.id = p.zone_id
          where f.user_id = $1 and p.event_id = $2 and p.updated_at > $3`, [s.user.id, ev.id, new Date(now.getTime() - PRESENCE_TTL_MS)]),
    ]);
    const days = [...new Set(sets.map((x) => x.day as string))];
    const day = days.includes(dayOf) ? dayOf : days.find((d) => d >= today) ?? days[days.length - 1];
    const picked = new Map(picks.map((p) => [p.set_id, p.remind]));

    const stageViews = stages.map((st) => {
      const list = sets.filter((x) => x.stage_id === st.id && x.day === day);
      const nowIdx = list.findIndex((x) => new Date(x.starts_at) <= now && new Date(x.ends_at) > now);
      const nextIdx = nowIdx >= 0 ? nowIdx + 1 : list.findIndex((x) => new Date(x.starts_at) > now);
      const view = (x: any) => ({ setId: x.id, artist: x.artist, startsAt: x.starts_at, endsAt: x.ends_at, time: vnTime(new Date(x.starts_at)) });
      const cur = nowIdx >= 0 ? list[nowIdx] : null;
      const minutesLeft = cur ? Math.max(0, Math.round((new Date(cur.ends_at).getTime() - now.getTime()) / 60000)) : null;
      const length = cur ? (new Date(cur.ends_at).getTime() - new Date(cur.starts_at).getTime()) / 60000 : 0;
      return {
        id: st.id,
        name: st.name,
        now: cur ? { ...view(cur), minutesLeft, progressPct: Math.round(100 - (minutesLeft! / length) * 100),
          leftLine: fill(L('{n} minutes left', 'còn {n} phút'), { n: minutesLeft! }) } : null,
        next: nextIdx >= 0 && list[nextIdx] ? view(list[nextIdx]) : null,
        sets: list.map((x, i) => ({
          ...view(x),
          state: new Date(x.ends_at) <= now ? 'played' : i === nowIdx ? 'now' : i === nextIdx ? 'next' : 'later',
          inPlan: picked.has(x.id),
          reminded: picked.get(x.id) === true,
        })),
      };
    }).filter((st) => st.sets.length);

    return {
      event: { id: ev.id, slug: ev.slug, title: ev.title, art: ev.art, venueName: ev.venue_name },
      day,
      stages: stageViews,
      zones,
      friendsOnSite: friends.map((f) => ({
        id: f.id, name: f.name, initials: initialsOf(f.name), photoUrl: f.photo_url,
        zoneId: f.zone_id, zoneLabel: f.zone_label, updatedAt: f.updated_at,
      })),
      friendsLine: fill(L('{n} friends on the site', '{n} bạn đang ở đây'), { n: friends.length }),
      offline: {
        online: L('Set times and the site map are saved on this device.', 'Giờ diễn và bản đồ đã lưu trên máy.'),
        offline: L('No signal. Set times and the site map are cached; friend positions resume when you reconnect.',
          'Mất sóng. Giờ diễn và bản đồ vẫn dùng được; vị trí bạn bè cập nhật lại khi có mạng.'),
      },
    };
  });

  /** "Check in" in the app: you're on site, optionally in a zone. Friends see you on the site map. */
  app.put<{ Params: { id: string } }>('/events/:id/presence', async (req) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    const { zoneId } = parse(z.object({ zoneId: uuid.nullable().optional() }), req.body ?? {});
    const now = ctx.clock.now();
    if (now < atVn(ev.starts_on, '00:00') || now > new Date(new Date(ev.ends_at).getTime() + 6 * 3600_000)) {
      throw badRequest('not_on_now', L('Live mode opens on the day of the event', 'Chế độ trực tiếp mở vào ngày diễn ra sự kiện'));
    }
    if (zoneId && !(await one(ctx.db, 'select 1 from site_zones where id = $1 and event_id = $2', [zoneId, ev.id]))) throw notFound();
    await ctx.db.query(
      `insert into presence (user_id, event_id, zone_id, updated_at) values ($1,$2,$3,$4)
       on conflict (user_id, event_id) do update set zone_id = excluded.zone_id, updated_at = excluded.updated_at`,
      [s.user.id, ev.id, zoneId ?? null, now]);
    await ctx.db.query('insert into going (user_id, event_id) values ($1,$2) on conflict do nothing', [s.user.id, ev.id]);
    return { onSite: true, message: L('Checked in — enjoy the show', 'Đã check-in — chúc bạn vui') };
  });

  app.delete<{ Params: { id: string } }>('/events/:id/presence', async (req) => {
    const s = requireUser(req);
    await ctx.db.query('delete from presence where user_id = $1 and event_id = $2', [s.user.id, parse(uuid, req.params.id)]);
    return { onSite: false };
  });

  app.post<{ Params: { id: string; friendId: string } }>('/events/:id/waves/:friendId', async (req) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    const friendId = parse(uuid, req.params.friendId);
    if (!(await areFriends(ctx, s.user.id, friendId))) throw notFound();
    const now = ctx.clock.now();
    const key = `${s.user.id}:${friendId}`;
    if (now.getTime() - (waves.get(key) ?? 0) < 60_000) throw tooMany('wave_cooldown', L('You just waved', 'Bạn vừa vẫy tay'));
    waves.set(key, now.getTime());
    const [me, friend] = await Promise.all([
      one<any>(ctx.db, 'select name from users where id = $1', [s.user.id]),
      one<any>(ctx.db, 'select name from users where id = $1', [friendId]),
    ]);
    await ctx.db.tx(async (q) => {
      await q.query(`insert into direct_messages (sender_id, recipient_id, kind, event_id, created_at) values ($1,$2,'wave',$3,$4)`, [s.user.id, friendId, ev.id, now]);
      await notifyUser(q, now, {
        userId: friendId, topic: null, kind: 'wave', urgent: true,
        title: fill(L('{n} waved at you', '{n} vẫy tay chào bạn'), { n: me.name || 'A friend' }),
        body: { en: ev.title, vi: ev.title }, link: { screen: 'live', eventId: ev.id },
      });
    });
    const first = String(friend.name).split(' ')[0];
    return { ok: true, message: fill(L('Waved at {n}', 'Đã vẫy tay chào {n}'), { n: first }) };
  });

  /** "Send my location" to everyone in your group plan for this event. */
  app.post<{ Params: { id: string } }>('/events/:id/share-location', async (req) => {
    const s = requireUser(req);
    const ev = await liveEvent(req.params.id);
    const { zoneId } = parse(z.object({ zoneId: uuid }), req.body);
    const zone = await one<any>(ctx.db, 'select id, label from site_zones where id = $1 and event_id = $2', [zoneId, ev.id]);
    if (!zone) throw notFound();
    const plan = await one<any>(ctx.db,
      `select gp.id from group_plans gp where gp.event_id = $1
          and (gp.owner_id = $2 or exists (select 1 from group_plan_members m where m.plan_id = gp.id and m.user_id = $2 and m.status = 'going'))
        limit 1`, [ev.id, s.user.id]);
    if (!plan) throw badRequest('no_group', L('Make a group plan to share your location', 'Tạo kế hoạch nhóm để chia sẻ vị trí'));
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      await q.query(`insert into group_plan_messages (plan_id, user_id, kind, body, payload, created_at) values ($1,$2,'system',$3,$4,$5)`,
        [plan.id, s.user.id, zone.label, json({ location: { zoneId: zone.id, label: zone.label } }), now]);
      await q.query(
        `insert into presence (user_id, event_id, zone_id, updated_at) values ($1,$2,$3,$4)
         on conflict (user_id, event_id) do update set zone_id = excluded.zone_id, updated_at = excluded.updated_at`,
        [s.user.id, ev.id, zone.id, now]);
    });
    return { ok: true, message: L('Location sent to your group', 'Đã gửi vị trí cho nhóm') };
  });
}
