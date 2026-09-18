import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { forbidden, notFound } from '../lib/errors.ts';
import { fill, L } from '../lib/i18n.ts';
import { initialsOf } from '../lib/contact.ts';
import { limit, parse, uuid } from '../lib/validate.ts';
import { requireUser } from '../http/guards.ts';
import { notifyUser } from '../services/notify.ts';

const ONLINE_WINDOW_MS = 5 * 60_000;

export default async function socialRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const assertFriend = async (me: string, other: string) => {
    const f = await one(ctx.db, 'select 1 from friendships where user_id = $1 and friend_id = $2', [me, other]);
    if (!f) throw forbidden('not_friends', L('You can only message friends', 'Bạn chỉ nhắn được cho bạn bè'));
  };

  app.get('/me/friends', async (req) => {
    const s = requireUser(req);
    const now = ctx.clock.now();
    const rows = await many<any>(ctx.db,
      `select u.id, u.name, u.photo_url, u.last_active_at, f.source,
              (select json_agg(json_build_object('id', e.id, 'slug', e.slug, 'title', e.title, 'startsOn', e.starts_on) order by e.starts_at)
                 from going g join events e on e.id = g.event_id
                where g.user_id = u.id and e.status = 'live' and e.ends_at >= $2) as going,
              (select count(*)::int from saves sv join events e on e.id = sv.event_id where sv.user_id = u.id and e.ends_at >= $2) as interested,
              (select json_build_object('kind', m.kind, 'body', m.body, 'fromMe', m.sender_id = $1, 'eventId', m.event_id, 'at', m.created_at)
                 from direct_messages m
                where (m.sender_id = $1 and m.recipient_id = u.id) or (m.sender_id = u.id and m.recipient_id = $1)
                order by m.created_at desc, m.seq desc limit 1) as last_message,
              (select count(*)::int from direct_messages m where m.sender_id = u.id and m.recipient_id = $1 and m.read_at is null) as unread
         from friendships f join users u on u.id = f.friend_id
        where f.user_id = $1
        order by u.name`, [s.user.id, now]);
    return {
      items: rows.map((r) => ({
        id: r.id, name: r.name, initials: initialsOf(r.name), photoUrl: r.photo_url, source: r.source,
        online: !!r.last_active_at && now.getTime() - new Date(r.last_active_at).getTime() < ONLINE_WINDOW_MS,
        going: r.going ?? [], interestedCount: r.interested, lastMessage: r.last_message, unread: r.unread,
      })),
    };
  });

  /** Friend sheet: what they're going to, and how much you overlap. */
  app.get<{ Params: { id: string } }>('/friends/:id', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    await assertFriend(s.user.id, id);
    const now = ctx.clock.now();
    const u = await one<any>(ctx.db,
      `select u.id, u.name, u.photo_url, u.last_active_at, f.source from users u join friendships f on f.friend_id = u.id
        where u.id = $1 and f.user_id = $2`, [id, s.user.id]);
    const going = await many<any>(ctx.db,
      `select e.id, e.slug, e.title, e.starts_on, e.ends_on, e.start_time from going g join events e on e.id = g.event_id
        where g.user_id = $1 and e.status = 'live' and e.ends_at >= $2 order by e.starts_at`, [id, now]);
    const interested = await one<any>(ctx.db,
      `select count(*)::int as n from saves sv join events e on e.id = sv.event_id where sv.user_id = $1 and e.ends_at >= $2`, [id, now]);
    const mutual = going.length + interested.n;
    return {
      id: u.id, name: u.name, initials: initialsOf(u.name), photoUrl: u.photo_url, source: u.source,
      online: !!u.last_active_at && now.getTime() - new Date(u.last_active_at).getTime() < ONLINE_WINDOW_MS,
      mutualLine: fill(L('{n} events in common', '{n} sự kiện chung'), { n: mutual }),
      going: going.map((e) => ({ id: e.id, slug: e.slug, title: e.title, startsOn: e.starts_on, endsOn: e.ends_on, startTime: e.start_time })),
    };
  });

  app.get<{ Params: { friendId: string } }>('/me/chats/:friendId', async (req) => {
    const s = requireUser(req);
    const friendId = parse(uuid, req.params.friendId);
    await assertFriend(s.user.id, friendId);
    const { limit: lim } = parse(z.object({ limit: limit(200, 100) }), req.query);
    const rows = await many<any>(ctx.db,
      `select m.id, m.sender_id, m.kind, m.body, m.event_id, m.created_at, m.read_at,
              e.slug as event_slug, e.title as event_title, e.starts_on as event_starts_on
         from direct_messages m left join events e on e.id = m.event_id
        where (m.sender_id = $1 and m.recipient_id = $2) or (m.sender_id = $2 and m.recipient_id = $1)
        order by m.created_at desc, m.seq desc limit $3`, [s.user.id, friendId, lim]);
    await ctx.db.query('update direct_messages set read_at = $3 where sender_id = $2 and recipient_id = $1 and read_at is null', [s.user.id, friendId, ctx.clock.now()]);
    return {
      items: rows.reverse().map((m) => ({
        id: m.id, fromMe: m.sender_id === s.user.id, kind: m.kind, body: m.body, createdAt: m.created_at,
        invite: m.kind === 'invite' && m.event_id ? { eventId: m.event_id, slug: m.event_slug, title: m.event_title, startsOn: m.event_starts_on } : null,
      })),
    };
  });

  app.post<{ Params: { friendId: string } }>('/me/chats/:friendId', async (req) => {
    const s = requireUser(req);
    const friendId = parse(uuid, req.params.friendId);
    const { body } = parse(z.object({ body: z.string().trim().min(1).max(1000) }), req.body);
    await assertFriend(s.user.id, friendId);
    const now = ctx.clock.now();
    const msg = await ctx.db.tx(async (q) => {
      const m = await one<any>(q,
        `insert into direct_messages (sender_id, recipient_id, kind, body, created_at) values ($1,$2,'text',$3,$4) returning id, created_at`,
        [s.user.id, friendId, body, now]);
      const me = await one<any>(q, 'select name from users where id = $1', [s.user.id]);
      await notifyUser(q, now, {
        userId: friendId, topic: null, kind: 'chat', inApp: false,
        title: { en: me.name || 'FestFinder', vi: me.name || 'FestFinder' }, body: { en: body.slice(0, 120), vi: body.slice(0, 120) },
        link: { screen: 'chat', friendId: s.user.id },
      });
      return m;
    });
    return { id: msg.id, fromMe: true, kind: 'text', body, createdAt: msg.created_at };
  });

  app.get('/me/chats', async (req) => {
    const s = requireUser(req);
    const rows = await many<any>(ctx.db,
      `select distinct on (other) other, kind, body, created_at, sender_id
         from (select case when sender_id = $1 then recipient_id else sender_id end as other, kind, body, created_at, sender_id, seq
                 from direct_messages where sender_id = $1 or recipient_id = $1) t
        order by other, created_at desc, seq desc`, [s.user.id]);
    const users = await many<any>(ctx.db, 'select id, name, photo_url from users where id = any($1::uuid[])', [rows.map((r) => r.other)]);
    const byId = new Map(users.map((u) => [u.id, u]));
    return {
      items: rows
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((r) => ({
          friendId: r.other, name: byId.get(r.other)?.name ?? '', initials: initialsOf(byId.get(r.other)?.name ?? ''),
          lastMessage: { kind: r.kind, body: r.body, fromMe: r.sender_id === s.user.id, at: r.created_at },
        })),
    };
  });
}
