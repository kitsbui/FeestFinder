import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../../db/index.ts';
import { notFound } from '../../lib/errors.ts';
import { csv, limit, parse, uuid } from '../../lib/validate.ts';
import { requireAdmin } from '../../http/guards.ts';
import { SqlParams } from '../../http/sql.ts';

import { ORDER_STATUS, SIGNUP } from './ops-shared.ts';

/* Accounts as the team sees them. Admin rights are never granted here: they come only from the ADMIN_EMAIL allowlist on a Google sign-in. */

export default async function adminUserRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- accounts -------------------------------------------------------------------------------

  app.get('/admin/users', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({
      q: z.string().max(80).optional(),
      kind: z.enum(['all', 'attendee', 'organizer', 'admin']).default('all'),
      method: csv(z.enum(['email', 'google', 'zalo', 'wa', 'fb', 'ig', 'staff'])).optional(),
      city: z.string().max(60).optional(),
      active: z.enum(['all', '7d', '30d', 'dormant']).default('all'),
      sort: z.enum(['new', 'active', 'tickets', 'name']).default('new'),
      limit: limit(200, 25),
      offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
    }), req.query);
    const now = ctx.clock.now();
    const sql = new SqlParams();
    const where: string[] = ['true'];
    if (f.q?.trim()) {
      const raw = f.q.trim().replace(/[%_\\]/g, '');
      const digits = raw.replace(/\D/g, '');
      const r = sql.p(raw);
      where.push(`(u.name ilike '%' || ${r} || '%' or u.email ilike '%' || ${r} || '%'${digits.length >= 4 ? ` or u.phone like '%' || ${sql.p(digits.replace(/^0/, ''))} || '%'` : ''} or u.id::text = ${r})`);
    }
    if (f.kind === 'admin') where.push(`u.role = 'admin'`);
    if (f.kind === 'organizer') where.push('exists (select 1 from organizer_members m where m.user_id = u.id)');
    if (f.kind === 'attendee') where.push(`u.role = 'user' and not exists (select 1 from organizer_members m where m.user_id = u.id)`);
    if (f.method?.length) where.push(`u.signup_method = any(${sql.p(f.method)}::text[])`);
    if (f.city) where.push(`u.city = ${sql.p(f.city)}`);
    if (f.active === '7d') where.push(`u.last_active_at >= ${sql.p(new Date(now.getTime() - 7 * 86400_000))}`);
    if (f.active === '30d') where.push(`u.last_active_at >= ${sql.p(new Date(now.getTime() - 30 * 86400_000))}`);
    if (f.active === 'dormant') where.push(`(u.last_active_at is null or u.last_active_at < ${sql.p(new Date(now.getTime() - 30 * 86400_000))})`);
    const order = { new: 'u.created_at desc', active: 'u.last_active_at desc nulls last', tickets: 'tickets desc, u.created_at desc', name: 'u.name' }[f.sort];
    const w = where.join(' and ');
    const [rows, total, cities] = await Promise.all([
      many<any>(ctx.db,
        `select u.id, u.name, u.email, u.phone, u.city, u.role, u.signup_method, u.created_at, u.last_active_at, u.photo_url,
                (select count(*)::int from tickets t where t.user_id = u.id and t.status in ('valid','used')) as tickets,
                (select count(*)::int from saves s where s.user_id = u.id) as saves,
                (select coalesce(json_agg(json_build_object('id', o.id, 'name', o.name, 'role', m.role)), '[]'::json)
                   from organizer_members m join organizers o on o.id = m.organizer_id where m.user_id = u.id) as orgs
           from users u where ${w} order by ${order} limit ${f.limit} offset ${f.offset}`, sql.values),
      one<any>(ctx.db, `select count(*)::int as n from users u where ${w}`, sql.values),
      many<any>(ctx.db, `select city, count(*)::int as n from users where city <> '' group by city order by n desc limit 12`),
    ]);
    return {
      items: rows.map((u) => ({
        id: u.id, name: u.name, email: u.email, phone: u.phone, city: u.city, role: u.role, signupMethod: u.signup_method, signupLabel: SIGNUP[u.signup_method],
        createdAt: u.created_at, lastActiveAt: u.last_active_at, photoUrl: u.photo_url, tickets: u.tickets, saves: u.saves, organizers: u.orgs,
      })),
      total: total.n, offset: f.offset, limit: f.limit,
      cities: cities.map((c) => ({ value: c.city, count: c.n })),
    };
  });

  app.get<{ Params: { id: string } }>('/admin/users/:id', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const u = await one<any>(ctx.db, 'select * from users where id = $1', [id]);
    if (!u) throw notFound();
    const [counts, orgs, orders, connections] = await Promise.all([
      one<any>(ctx.db,
        `select (select count(*)::int from saves where user_id = $1) as saves, (select count(*)::int from hypes where user_id = $1) as hypes,
                (select count(*)::int from going where user_id = $1) as going, (select count(*)::int from tickets where user_id = $1 and status in ('valid','used')) as tickets,
                (select count(*)::int from friendships where user_id = $1) as friends, (select count(*)::int from listing_reports where user_id = $1) as reports,
                (select count(*)::int from orders where user_id = $1) as orders, (select count(*)::int from user_activity_days where user_id = $1) as active_days`, [id]),
      many<any>(ctx.db, `select o.id, o.name, m.role from organizer_members m join organizers o on o.id = m.organizer_id where m.user_id = $1`, [id]),
      many<any>(ctx.db, `select x.id, x.code, x.status, x.total, x.qty, x.created_at, e.title from orders x join events e on e.id = x.event_id where x.user_id = $1 order by x.created_at desc limit 8`, [id]),
      many<any>(ctx.db, `select provider, display_name, connected_at from social_connections where user_id = $1`, [id]),
    ]);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone, city: u.city, role: u.role, locale: u.locale, signupMethod: u.signup_method, signupLabel: SIGNUP[u.signup_method],
      interests: u.interests, birthYear: u.birth_year, createdAt: u.created_at, lastActiveAt: u.last_active_at, photoUrl: u.photo_url, hasPassword: !!u.password_hash,
      counts: { saves: counts.saves, hypes: counts.hypes, going: counts.going, tickets: counts.tickets, friends: counts.friends, reports: counts.reports, orders: counts.orders, activeDays: counts.active_days },
      organizers: orgs, connections: connections.map((c) => ({ provider: c.provider, label: SIGNUP[c.provider] ?? c.provider, name: c.display_name, at: c.connected_at })),
      orders: orders.map((o) => ({ id: o.id, code: o.code, status: o.status, statusLabel: ORDER_STATUS[o.status], total: Number(o.total), qty: o.qty, createdAt: o.created_at, event: o.title })),
    };
  });

}
