import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { badRequest, conflict, notFound } from '../lib/errors.ts';
import { fill, GENRES, L, NOTIFICATION_TOPICS, QUIET_HOURS_RULE } from '../lib/i18n.ts';
import { isEmail, normalizeEmail, normalizeVnPhone } from '../lib/contact.ts';
import { limit, parse, uuid } from '../lib/validate.ts';
import { BANKS } from '../lib/vietqr.ts';
import { requireUser } from '../http/guards.ts';
import { decodeCursor, page } from '../http/sql.ts';
import { CARD_COLUMNS, loadViewer, presentCard } from '../presenters/event.ts';
import { findClashes } from '../presenters/timetable.ts';
import { loadPrefs } from '../services/notify.ts';
import { deliverDue } from '../services/messaging.ts';
import { checkOtp, identifierFor, publicUser, startOtp } from './auth.ts';

const INTERESTS = ['EDM', 'Pop', 'Indie', 'Hip-Hop', 'Jazz', 'Theatre', 'Art', 'Food', 'Markets', 'Nightlife', 'Culture'] as const;

export default async function meRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.get('/me', async (req) => {
    const s = requireUser(req);
    const [user, connections, counts] = await Promise.all([
      one<any>(ctx.db, 'select * from users where id = $1', [s.user.id]),
      many<any>(ctx.db, 'select provider, display_name, connected_at from social_connections where user_id = $1 order by connected_at', [s.user.id]),
      one<any>(ctx.db,
        `select (select count(*)::int from saves where user_id = $1) as saved,
                (select count(*)::int from hypes where user_id = $1) as hyped,
                (select count(*)::int from organizer_follows where user_id = $1) as following,
                (select count(*)::int from tickets where user_id = $1 and status in ('valid','used')) as tickets,
                (select count(*)::int from friendships where user_id = $1) as friends,
                (select count(*)::int from notifications where user_id = $1 and read_at is null) as unread`, [s.user.id]),
    ]);
    const prefs = await loadPrefs(ctx.db, s.user.id);
    const channelsOn = Object.values(prefs).reduce((n, p) => n + (p.push ? 1 : 0) + (p.zalo ? 1 : 0) + (p.email ? 1 : 0), 0);
    return {
      user: publicUser(user),
      connections: connections.map((c) => ({ provider: c.provider, displayName: c.display_name, connectedAt: c.connected_at })),
      counts: { ...counts, notificationChannelsOn: channelsOn },
      payee: user.payee_account_no ? {
        bankBin: user.payee_bank_bin, bankName: user.payee_bank_name, accountNo: user.payee_account_no, accountName: user.payee_account_name,
      } : null,
    };
  });

  app.patch('/me', async (req) => {
    const s = requireUser(req);
    const body = parse(z.object({
      name: z.string().max(80).optional(),
      email: z.string().max(200).optional(),
      zalo: z.string().max(30).optional(),
      city: z.string().max(80).optional(),
      photoUrl: z.string().url().nullable().optional(),
      locale: z.enum(['en', 'vi']).optional(),
      interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length).optional(),
      birthYear: z.number().int().min(1900).max(2030).nullable().optional(),
    }), req.body);
    const current = await one<any>(ctx.db, 'select * from users where id = $1', [s.user.id]);
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name.trim();
    if (body.city !== undefined) patch.city = body.city.trim();
    if (body.photoUrl !== undefined) patch.photo_url = body.photoUrl;
    if (body.locale) patch.locale = body.locale;
    if (body.interests) patch.interests = body.interests;
    if (body.birthYear !== undefined) patch.birth_year = body.birthYear;
    if (body.email !== undefined) {
      const email = body.email.trim();
      if (email && !isEmail(email)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
      // The address you sign in with can only change through a verified flow.
      if (current.signup_method === 'email' && normalizeEmail(email) !== current.email) {
        throw badRequest('login_email_locked', L('This is the email you sign in with', 'Đây là email bạn dùng để đăng nhập'));
      }
      patch.email = email ? normalizeEmail(email) : null;
    }
    if (body.zalo !== undefined) {
      const raw = body.zalo.trim();
      const phone = raw ? normalizeVnPhone(raw) : null;
      if (raw && !phone) throw badRequest('invalid_phone', L('Enter a valid Vietnamese phone number', 'Nhập số điện thoại Việt Nam hợp lệ'));
      if (['zalo', 'wa'].includes(current.signup_method) && phone !== current.phone) {
        throw badRequest('login_phone_locked', L('This is the number you sign in with', 'Đây là số bạn dùng để đăng nhập'));
      }
      patch.phone = phone;
    }
    const keys = Object.keys(patch);
    if (keys.length) {
      try {
        await ctx.db.query(`update users set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1`, [s.user.id, ...keys.map((k) => patch[k])]);
      } catch (e: any) {
        if (e.code === '23505') throw conflict('contact_taken', L('That email or number belongs to another account', 'Email hoặc số này đã thuộc tài khoản khác'));
        throw e;
      }
    }
    const user = await one<any>(ctx.db, 'select * from users where id = $1', [s.user.id]);
    return { user: publicUser(user), message: L('Profile saved', 'Đã lưu hồ sơ') };
  });

  /** Bank account used as the payee on group-plan VietQR requests. */
  app.put('/me/payee', async (req) => {
    const s = requireUser(req);
    const body = parse(z.object({
      bankBin: z.string().regex(/^\d{6}$/),
      accountNo: z.string().regex(/^[0-9A-Za-z]{4,19}$/),
      accountName: z.string().min(2).max(60),
    }), req.body);
    await ctx.db.query(
      'update users set payee_bank_bin = $2, payee_bank_name = $3, payee_account_no = $4, payee_account_name = $5 where id = $1',
      [s.user.id, body.bankBin, BANKS[body.bankBin] ?? null, body.accountNo, body.accountName.toUpperCase()]);
    return { ok: true, bankName: BANKS[body.bankBin] ?? null };
  });

  // ---- saves, hypes, going -------------------------------------------------

  const toggles = [
    { path: 'saves', table: 'saves', counter: 'save_count' },
    { path: 'hypes', table: 'hypes', counter: 'hype_count' },
    { path: 'going', table: 'going', counter: null },
  ] as const;

  for (const t of toggles) {
    app.put<{ Params: { eventId: string } }>(`/me/${t.path}/:eventId`, async (req) => {
      const s = requireUser(req);
      const eventId = parse(uuid, req.params.eventId);
      const changed = await ctx.db.tx(async (q) => {
        const ev = await one(q, `select 1 from events where id = $1 and status = 'live'`, [eventId]);
        if (!ev) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
        const ins = await one(q, `insert into ${t.table} (user_id, event_id, created_at) values ($1,$2,$3) on conflict do nothing returning 1`, [s.user.id, eventId, ctx.clock.now()]);
        if (ins && t.counter) await q.query(`update events set ${t.counter} = ${t.counter} + 1 where id = $1`, [eventId]);
        return !!ins;
      });
      const extra = t.path === 'going'
        ? { note: L('Marking yourself going shows you to friends on the map.', 'Đánh dấu sẽ đi sẽ hiện bạn cho bạn bè trên bản đồ.') }
        : {};
      return { [t.path === 'saves' ? 'saved' : t.path === 'hypes' ? 'hyped' : 'going']: true, changed, ...extra };
    });

    app.delete<{ Params: { eventId: string } }>(`/me/${t.path}/:eventId`, async (req) => {
      const s = requireUser(req);
      const eventId = parse(uuid, req.params.eventId);
      const changed = await ctx.db.tx(async (q) => {
        const del = await one(q, `delete from ${t.table} where user_id = $1 and event_id = $2 returning 1`, [s.user.id, eventId]);
        if (del && t.counter) await q.query(`update events set ${t.counter} = greatest(${t.counter} - 1, 0) where id = $1`, [eventId]);
        return !!del;
      });
      return { [t.path === 'saves' ? 'saved' : t.path === 'hypes' ? 'hyped' : 'going']: false, changed };
    });

    app.get(`/me/${t.path}`, async (req) => {
      const s = requireUser(req);
      const { cursor, limit: lim, past } = parse(z.object({ cursor: z.string().optional(), limit: limit(100, 50), past: z.enum(['include', 'only', 'exclude']).default('include') }), req.query);
      const now = ctx.clock.now();
      const offset = decodeCursor(cursor);
      const pastClause = past === 'only' ? 'and e.ends_at < $2' : past === 'exclude' ? 'and e.ends_at >= $2' : 'and $2::timestamptz is not null';
      const rows = await many<any>(ctx.db,
        `select ${CARD_COLUMNS} from ${t.table} x join events e on e.id = x.event_id join organizers o on o.id = e.organizer_id
          where x.user_id = $1 ${pastClause}
          order by (e.ends_at < $2), case when e.ends_at < $2 then -extract(epoch from e.starts_at) else extract(epoch from e.starts_at) end
          limit $3 offset $4`, [s.user.id, now, lim + 1, offset]);
      const viewer = await loadViewer(ctx.db, s.user.id, rows.map((r) => r.id));
      const p = page(rows, offset, lim);
      return { items: p.items.map((r) => presentCard(r, { now, viewer })), nextCursor: p.nextCursor };
    });
  }

  // ---- follows ---------------------------------------------------------------

  app.put<{ Params: { organizerId: string } }>('/me/follows/organizers/:organizerId', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.organizerId);
    const org = await one<any>(ctx.db, 'select name from organizers where id = $1', [id]);
    if (!org) throw notFound();
    await ctx.db.tx(async (q) => {
      const ins = await one(q, 'insert into organizer_follows (user_id, organizer_id) values ($1,$2) on conflict do nothing returning 1', [s.user.id, id]);
      if (ins) await q.query('update organizers set followers_count = followers_count + 1 where id = $1', [id]);
    });
    return { following: true, message: fill(L('Following {n}', 'Đang theo dõi {n}'), { n: org.name }) };
  });

  app.delete<{ Params: { organizerId: string } }>('/me/follows/organizers/:organizerId', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.organizerId);
    const org = await one<any>(ctx.db, 'select name from organizers where id = $1', [id]);
    if (!org) throw notFound();
    await ctx.db.tx(async (q) => {
      const del = await one(q, 'delete from organizer_follows where user_id = $1 and organizer_id = $2 returning 1', [s.user.id, id]);
      if (del) await q.query('update organizers set followers_count = greatest(followers_count - 1, 0) where id = $1', [id]);
    });
    return { following: false, message: fill(L('Unfollowed {n}', 'Đã bỏ theo dõi {n}'), { n: org.name }) };
  });

  app.put<{ Params: { artist: string } }>('/me/follows/artists/:artist', async (req) => {
    const s = requireUser(req);
    const artist = parse(z.string().min(1).max(100), decodeURIComponent(req.params.artist)).trim();
    await ctx.db.query('insert into artist_follows (user_id, artist) values ($1,$2) on conflict do nothing', [s.user.id, artist]);
    return { following: true, message: fill(L('Following {n}', 'Đang theo dõi {n}'), { n: artist }) };
  });

  app.delete<{ Params: { artist: string } }>('/me/follows/artists/:artist', async (req) => {
    const s = requireUser(req);
    const artist = decodeURIComponent(req.params.artist).trim();
    await ctx.db.query('delete from artist_follows where user_id = $1 and artist = $2', [s.user.id, artist]);
    return { following: false, message: fill(L('Unfollowed {n}', 'Đã bỏ theo dõi {n}'), { n: artist }) };
  });

  /** Organisers panel: followed first, then others to discover, each with their next event. */
  app.get('/me/follows', async (req) => {
    const s = requireUser(req);
    const now = ctx.clock.now();
    const orgs = await many<any>(ctx.db,
      `select o.id, o.slug, o.name, o.initials, o.art, o.logo_url, o.verification_state, o.followers_count,
              exists (select 1 from organizer_follows f where f.user_id = $1 and f.organizer_id = o.id) as following,
              (select count(*)::int from events e where e.organizer_id = o.id and e.status = 'live') as events,
              (select array_agg(distinct e.genre) from events e where e.organizer_id = o.id and e.status = 'live' and e.genre is not null) as genres,
              (select json_build_object('id', e.id, 'slug', e.slug, 'title', e.title, 'startsOn', e.starts_on)
                 from events e where e.organizer_id = o.id and e.status = 'live' and e.ends_at >= $2 order by e.starts_at limit 1) as next
         from organizers o
        where exists (select 1 from events e where e.organizer_id = o.id and e.status = 'live')
           or exists (select 1 from organizer_follows f where f.user_id = $1 and f.organizer_id = o.id)
        order by events desc, o.name`, [s.user.id, now]);
    const artists = await many<any>(ctx.db, 'select artist, created_at from artist_follows where user_id = $1 order by created_at desc', [s.user.id]);
    const shape = (o: any) => ({
      id: o.id, slug: o.slug, name: o.name, initials: o.initials, art: o.art, logoUrl: o.logo_url,
      verified: o.verification_state === 'verified', followersCount: o.followers_count,
      eventCount: o.events, genres: (o.genres ?? []).slice(0, 2), next: o.next,
    });
    return {
      organizers: { following: orgs.filter((o) => o.following).map(shape), discover: orgs.filter((o) => !o.following).map(shape) },
      artists: artists.map((a) => a.artist),
    };
  });

  // ---- clash-finder plan -----------------------------------------------------

  app.put<{ Params: { setId: string } }>('/me/plan/sets/:setId', async (req) => {
    const s = requireUser(req);
    const setId = parse(uuid, req.params.setId);
    const { remind } = parse(z.object({ remind: z.boolean().optional() }), req.body ?? {});
    const set = await one<any>(ctx.db, 'select event_id from sets where id = $1', [setId]);
    if (!set) throw notFound();
    await ctx.db.query(
      `insert into plan_picks (user_id, set_id, remind) values ($1,$2,$3)
       on conflict (user_id, set_id) do update set remind = coalesce($4, plan_picks.remind)`,
      [s.user.id, setId, remind ?? false, remind ?? null]);
    return planFor(s.user.id, set.event_id);
  });

  app.delete<{ Params: { setId: string } }>('/me/plan/sets/:setId', async (req) => {
    const s = requireUser(req);
    const setId = parse(uuid, req.params.setId);
    const set = await one<any>(ctx.db, 'select event_id from sets where id = $1', [setId]);
    if (!set) throw notFound();
    await ctx.db.query('delete from plan_picks where user_id = $1 and set_id = $2', [s.user.id, setId]);
    return planFor(s.user.id, set.event_id);
  });

  /** "Clear" on the timetable, and "Remind me 15 min before" for every pick. */
  app.patch<{ Params: { eventId: string } }>('/me/plan/events/:eventId', async (req) => {
    const s = requireUser(req);
    const eventId = parse(uuid, req.params.eventId);
    const body = parse(z.object({ clear: z.boolean().optional(), remindAll: z.boolean().optional() }), req.body);
    if (body.clear) {
      await ctx.db.query('delete from plan_picks p using sets st where p.set_id = st.id and p.user_id = $1 and st.event_id = $2', [s.user.id, eventId]);
    }
    if (body.remindAll !== undefined) {
      await ctx.db.query('update plan_picks p set remind = $3 from sets st where p.set_id = st.id and p.user_id = $1 and st.event_id = $2', [s.user.id, eventId, body.remindAll]);
    }
    const out = await planFor(s.user.id, eventId);
    return body.remindAll ? { ...out, message: L('We will remind you 15 minutes before each set', 'Chúng tôi sẽ nhắc bạn 15 phút trước mỗi set') } : out;
  });

  async function planFor(userId: string, eventId: string) {
    const picks = await many<any>(ctx.db,
      `select st.id, st.artist, st.starts_at, st.ends_at, p.remind from plan_picks p join sets st on st.id = p.set_id
        where p.user_id = $1 and st.event_id = $2 order by st.starts_at`, [userId, eventId]);
    return {
      setIds: picks.map((p) => p.id),
      remindSetIds: picks.filter((p) => p.remind).map((p) => p.id),
      clashes: findClashes(picks.map((p) => ({ id: p.id, artist: p.artist, startsAt: p.starts_at, endsAt: p.ends_at }))),
    };
  }

  // ---- notification preferences & smart alerts --------------------------------

  app.get('/me/notification-preferences', async (req) => {
    const s = requireUser(req);
    const prefs = await loadPrefs(ctx.db, s.user.id);
    const on = Object.values(prefs).reduce((n, p) => n + +p.push + +p.zalo + +p.email, 0);
    return { matrix: prefs, channelsOn: on, quietHours: { start: '23:00', end: '08:00', rule: QUIET_HOURS_RULE } };
  });

  app.put('/me/notification-preferences', async (req) => {
    const s = requireUser(req);
    const cell = z.object({ push: z.boolean(), zalo: z.boolean(), email: z.boolean() }).partial();
    const body = parse(z.object({ matrix: z.partialRecord(z.enum(NOTIFICATION_TOPICS), cell) }), req.body);
    const current = await loadPrefs(ctx.db, s.user.id);
    await ctx.db.tx(async (q) => {
      for (const [topic, v] of Object.entries(body.matrix)) {
        const merged = { ...current[topic as keyof typeof current], ...v };
        await q.query(
          `insert into notification_prefs (user_id, topic, push, zalo, email) values ($1,$2,$3,$4,$5)
           on conflict (user_id, topic) do update set push = excluded.push, zalo = excluded.zalo, email = excluded.email`,
          [s.user.id, topic, merged.push, merged.zalo, merged.email]);
      }
    });
    const prefs = await loadPrefs(ctx.db, s.user.id);
    return { matrix: prefs, message: L('Notification settings saved', 'Đã lưu cài đặt thông báo') };
  });

  const alertShape = async (userId: string) => {
    const a = await one<any>(ctx.db, 'select * from smart_alerts where user_id = $1', [userId]);
    const alert = a ?? { enabled: true, genres: ['EDM'], artists: [], organizer_ids: [], areas: [], price_cap: 1000000 };
    const params: unknown[] = [ctx.clock.now()];
    const cond: string[] = [];
    const add = (v: unknown) => { params.push(v); return `$${params.length}`; };
    if (alert.genres.length) cond.push(`e.genre = any(${add(alert.genres)}::text[])`);
    if (alert.artists.length) cond.push(`e.artists && ${add(alert.artists)}::text[]`);
    if (alert.organizer_ids.length) cond.push(`e.organizer_id = any(${add(alert.organizer_ids)}::uuid[])`);
    if (alert.areas.length) cond.push(`e.area = any(${add(alert.areas)}::text[])`);
    if (alert.price_cap === 0) cond.push(`(e.entry_mode = 'free' or e.price_from = 0)`);
    else if (alert.price_cap !== null) cond.push(`e.price_from <= ${add(alert.price_cap)}`);
    const m = await one<any>(ctx.db,
      `select count(*)::int as n from events e where e.status = 'live' and not e.held_for_reports and e.ends_at >= $1 ${cond.map((c) => `and ${c}`).join(' ')}`, params);
    return {
      enabled: alert.enabled, genres: alert.genres, artists: alert.artists, organizerIds: alert.organizer_ids,
      areas: alert.areas, priceCap: alert.price_cap, matches: m.n,
    };
  };

  app.get('/me/alert', async (req) => alertShape(requireUser(req).user.id));

  app.put('/me/alert', async (req) => {
    const s = requireUser(req);
    const body = parse(z.object({
      enabled: z.boolean(),
      genres: z.array(z.enum(GENRES)).max(8),
      artists: z.array(z.string().max(100)).max(30),
      organizerIds: z.array(uuid).max(30),
      areas: z.array(z.string().max(60)).max(20),
      priceCap: z.number().int().min(0).nullable(),
    }), req.body);
    await ctx.db.query(
      `insert into smart_alerts (user_id, enabled, genres, artists, organizer_ids, areas, price_cap, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (user_id) do update set enabled = excluded.enabled, genres = excluded.genres, artists = excluded.artists,
         organizer_ids = excluded.organizer_ids, areas = excluded.areas, price_cap = excluded.price_cap, updated_at = excluded.updated_at`,
      [s.user.id, body.enabled, body.genres, body.artists, body.organizerIds, body.areas, body.priceCap, ctx.clock.now()]);
    return { ...(await alertShape(s.user.id)), message: body.enabled ? L('Smart Alert saved', 'Đã lưu Smart Alert') : L('Smart Alert off', 'Đã tắt Smart Alert') };
  });

  // ---- devices & notification centre -----------------------------------------

  app.post('/me/devices', async (req) => {
    const s = requireUser(req);
    const body = parse(z.object({ token: z.string().min(10).max(4096), platform: z.enum(['ios', 'android', 'web']) }), req.body);
    await ctx.db.query(
      `insert into devices (token, user_id, platform, updated_at) values ($1,$2,$3,$4)
       on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, updated_at = excluded.updated_at`,
      [body.token, s.user.id, body.platform, ctx.clock.now()]);
    return { ok: true };
  });

  app.delete<{ Params: { token: string } }>('/me/devices/:token', async (req) => {
    const s = requireUser(req);
    await ctx.db.query('delete from devices where token = $1 and user_id = $2', [req.params.token, s.user.id]);
    return { ok: true };
  });

  app.get('/me/notifications', async (req) => {
    const s = requireUser(req);
    const { cursor, limit: lim } = parse(z.object({ cursor: z.string().optional(), limit: limit(50, 20) }), req.query);
    const offset = decodeCursor(cursor);
    const rows = await many<any>(ctx.db,
      `select id, kind, title, body, cta, link, read_at, created_at from notifications where user_id = $1
        order by created_at desc limit $2 offset $3`, [s.user.id, lim + 1, offset]);
    const unread = await one<any>(ctx.db, 'select count(*)::int as n from notifications where user_id = $1 and read_at is null', [s.user.id]);
    const p = page(rows, offset, lim);
    return {
      unread: unread.n,
      nextCursor: p.nextCursor,
      items: p.items.map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, cta: n.cta, link: n.link, unread: !n.read_at, createdAt: n.created_at })),
    };
  });

  app.post<{ Params: { id: string } }>('/me/notifications/:id/read', async (req) => {
    const s = requireUser(req);
    await ctx.db.query('update notifications set read_at = coalesce(read_at, $3) where id = $1 and user_id = $2', [parse(uuid, req.params.id), s.user.id, ctx.clock.now()]);
    return { ok: true };
  });

  app.post('/me/notifications/read-all', async (req) => {
    const s = requireUser(req);
    await ctx.db.query('update notifications set read_at = $2 where user_id = $1 and read_at is null', [s.user.id, ctx.clock.now()]);
    return { ok: true };
  });

  // ---- connected accounts (Zalo / WhatsApp by OTP; Facebook / Instagram via /auth/oauth) --

  app.post<{ Params: { provider: string } }>('/me/connections/:provider/start', async (req) => {
    const s = requireUser(req);
    const provider = parse(z.enum(['zalo', 'wa']), req.params.provider);
    const { phone } = parse(z.object({ phone: z.string().min(8).max(30) }), req.body);
    const identifier = identifierFor(provider, phone);
    const out = await ctx.db.tx((q) => startOtp(ctx, q, { purpose: 'connect', channel: provider, identifier, userId: s.user.id }));
    deliverDue(ctx.db, ctx.clock, ctx.transport).catch(() => {});
    return out;
  });

  app.post<{ Params: { provider: string } }>('/me/connections/:provider/verify', async (req) => {
    const s = requireUser(req);
    const provider = parse(z.enum(['zalo', 'wa']), req.params.provider);
    const body = parse(z.object({ challengeId: uuid, code: z.string() }), req.body);
    const ch = await checkOtp(ctx, body.challengeId, body.code, 'connect');
    if (ch.user_id !== s.user.id) throw notFound();
    const holder = await one<any>(ctx.db, 'select user_id from social_connections where provider = $1 and external_id = $2', [provider, ch.identifier]);
    if (holder && holder.user_id !== s.user.id) {
      throw conflict('connection_taken', L('That number is already linked to another FestFinder user', 'Số này đã liên kết với người dùng khác'));
    }
    await ctx.db.query(
      `insert into social_connections (user_id, provider, external_id) values ($1,$2,$3)
       on conflict (user_id, provider) do update set external_id = excluded.external_id, connected_at = now()`,
      [s.user.id, provider, ch.identifier]);
    return { connected: provider, message: L(`Connected · ${provider === 'wa' ? 'WhatsApp' : 'Zalo'}`, `Đã liên kết · ${provider === 'wa' ? 'WhatsApp' : 'Zalo'}`) };
  });

  app.delete<{ Params: { provider: string } }>('/me/connections/:provider', async (req) => {
    const s = requireUser(req);
    const provider = parse(z.enum(['fb', 'ig', 'zalo', 'wa']), req.params.provider);
    const user = await one<any>(ctx.db, 'select signup_method from users where id = $1', [s.user.id]);
    const others = await one<any>(ctx.db, 'select count(*)::int as n from social_connections where user_id = $1 and provider <> $2', [s.user.id, provider]);
    if (user.signup_method === provider && others.n === 0) {
      throw badRequest('last_login_method', L('This is how you sign in. Connect another account first.', 'Đây là cách bạn đăng nhập. Hãy liên kết tài khoản khác trước.'));
    }
    await ctx.db.tx(async (q) => {
      await q.query('delete from social_connections where user_id = $1 and provider = $2', [s.user.id, provider]);
      // Friendships that only came through this provider go with it.
      await q.query('delete from friendships where (user_id = $1 or friend_id = $1) and source = $2', [s.user.id, provider]);
    });
    return { connected: false, provider };
  });
}
