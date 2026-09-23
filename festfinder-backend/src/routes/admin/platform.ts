import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L, type Localized } from '../../lib/i18n.ts';
import { toCsv } from '../../lib/csv.ts';
import { atVn, vnDate, addDays } from '../../lib/time.ts';
import { limit, parse, uuid } from '../../lib/validate.ts';
import { requireAdmin } from '../../http/guards.ts';
import { createSession } from '../../http/session.ts';
import { decodeCursor, page } from '../../http/sql.ts';
import { actionLabel, appendAudit, verifyAuditChain } from '../../services/audit.ts';
import { payoutLedger } from '../../services/payouts.ts';

const IMPERSONATION_TTL_MS = 60 * 60_000;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export default async function adminPlatformRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  /** Badge counts for the admin tab bar. */
  app.get('/admin/counts', async (req) => {
    requireAdmin(req);
    const r = await one<any>(ctx.db,
      `select (select count(*)::int from events where status = 'in_review') as queue,
              (select count(*)::int from organizers where verification_state <> 'verified') as verification,
              (select count(distinct event_id)::int from listing_reports where resolved_at is null) as reports,
              (select count(*)::int from ad_inquiries where status = 'new') as ads,
              (select count(*)::int from appeals where state in ('open','replied') and closes_at > $1) as appeals`, [ctx.clock.now()]);
    return r;
  });

  app.get('/admin/insights', async (req) => {
    requireAdmin(req);
    const now = ctx.clock.now();
    const today = vnDate(now);
    const dayStart = atVn(today);
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);

    const [queue, approved, flagged, reports, orgs, users, cities, genres, accounts] = await Promise.all([
      one<any>(ctx.db, `select count(*)::int as n, min(submitted_at) as oldest from events where status = 'in_review'`),
      one<any>(ctx.db,
        `select count(*)::int as n, percentile_cont(0.5) within group (order by extract(epoch from (d.decided_at - e.submitted_at)) / 60) as median
           from moderation_decisions d join events e on e.id = d.event_id where d.decision = 'approved' and d.decided_at >= $1 and e.submitted_at is not null`, [dayStart]),
      one<any>(ctx.db, `select count(*)::int as n from events where status = 'in_review' and flag is not null`),
      one<any>(ctx.db, `select count(distinct event_id)::int as threads, count(distinct user_id)::int as reporters from listing_reports where resolved_at is null`),
      many<any>(ctx.db,
        `select o.id, o.name, o.initials, o.verification_state,
                (select count(*)::int from events e where e.organizer_id = o.id and e.status = 'live' and e.ends_at >= $1) as live,
                coalesce((select sum(m.views) from event_metrics_daily m join events e on e.id = m.event_id where e.organizer_id = o.id), 0)::int as views,
                coalesce((select sum(m.ticket_clicks) from event_metrics_daily m join events e on e.id = m.event_id where e.organizer_id = o.id), 0)::int as clicks,
                (select count(*)::int from listing_reports r join events e on e.id = r.event_id where e.organizer_id = o.id) as reports,
                coalesce((select sum(total - fee) from orders x join events e on e.id = x.event_id where e.organizer_id = o.id and x.status = 'paid'), 0)::bigint as gmv
           from organizers o order by gmv desc, views desc limit 20`, [now]),
      one<any>(ctx.db,
        `select count(*)::int as total,
                count(*) filter (where created_at >= $1)::int as new7,
                (select count(distinct user_id)::int from user_activity_days where day > $2) as wau,
                (select count(*)::int from saves) as saves,
                (select count(*)::int from hypes) as hypes,
                (select count(distinct a.user_id)::int from user_activity_days a where a.day > $2
                   and exists (select 1 from user_activity_days b where b.user_id = a.user_id and b.day between $3 and $2)) as returned,
                (select count(distinct user_id)::int from user_activity_days where day between $3 and $2) as prior_week
           from users where role = 'user'`, [weekAgo, addDays(today, -7), addDays(today, -14)]),
      many<any>(ctx.db, `select coalesce(nullif(city, ''), '—') as city, count(*)::int as n from users where role = 'user' group by 1 order by n desc`),
      many<any>(ctx.db, `select e.genre, count(*)::int as n from saves s join events e on e.id = s.event_id where e.genre is not null group by 1 order by n desc`),
      many<any>(ctx.db,
        `select u.id, u.name, u.email, u.phone, u.city, u.created_at,
                (select count(*)::int from saves where user_id = u.id) as saved,
                (select count(*)::int from hypes where user_id = u.id) as hyped,
                (select count(*)::int from tickets where user_id = u.id) as tickets
           from users u where u.role = 'user' order by u.created_at desc limit 5`),
    ]);
    const oldestMin = queue.oldest ? Math.round((now.getTime() - new Date(queue.oldest).getTime()) / 60000) : 0;
    const totalCity = cities.reduce((n, c) => n + c.n, 0);
    const totalGenre = genres.reduce((n, g) => n + g.n, 0);
    return {
      health: [
        { key: 'queue', value: queue.n, note: L(`Oldest waiting: ${Math.floor(oldestMin / 60)}h ${oldestMin % 60}m`, `Cũ nhất: ${Math.floor(oldestMin / 60)} giờ ${oldestMin % 60} phút`) },
        { key: 'approved', value: approved.n, note: L(`Median ${Math.round(approved.median ?? 0)} minutes to decision`, `Trung bình ${Math.round(approved.median ?? 0)} phút mỗi tin`) },
        { key: 'flagged', value: flagged.n, note: L('Need a human decision', 'Cần người xem trực tiếp') },
        { key: 'reports', value: reports.threads, note: L(`From ${reports.reporters} separate users`, `${reports.reporters} người dùng liên quan`) },
      ],
      organizers: orgs.map((o) => ({
        id: o.id, name: o.name, initials: o.initials, verified: o.verification_state === 'verified',
        live: o.live, views: o.views, ctrPct: pct(o.clicks, o.views), reports: o.reports, gmv: o.gmv,
      })),
      users: {
        accounts: users.total, newLast7Days: users.new7, weeklyActive: users.wau, weeklyActivePct: pct(users.wau, users.total),
        savesPerUser: users.total ? Math.round((users.saves / users.total) * 10) / 10 : 0,
        hypesPerUser: users.total ? Math.round((users.hypes / users.total) * 10) / 10 : 0,
        sevenDayReturnPct: pct(users.returned, users.prior_week),
      },
      // Top three cities, then everyone else in one bucket, so the column adds up to 100%.
      cities: cities.slice(0, 3).map((c) => ({ label: c.city, pct: pct(c.n, totalCity) }))
        .concat(cities.length > 3
          ? [{ label: L('Elsewhere', 'Khác'), pct: pct(cities.slice(3).reduce((n, c) => n + c.n, 0), totalCity) }]
          : []),
      genres: genres.slice(0, 5).map((g) => ({ label: g.genre, pct: pct(g.n, totalGenre) })),
      recentAccounts: accounts.map((a) => ({
        id: a.id, handle: a.name || a.email || a.phone, city: a.city, joined: a.created_at, saved: a.saved, hyped: a.hyped, tickets: a.tickets,
      })),
      privacy: L('The admin sees aggregate numbers and on-platform activity. Private messages, contacts and location history stay out of reach.',
        'Admin xem được số liệu tổng hợp và hoạt động trên nền tảng. Không xem được tin nhắn riêng, danh bạ hay lịch sử vị trí của người dùng.'),
    };
  });

  // ---- audit log --------------------------------------------------------------------

  /** `area` is the part of an action before the dot (listing, organizer, shelf…); `q` matches who or what. */
  const auditRows = async (actor: string, lim: number, offset: number, area = '', q = '', targetId = '') => many<any>(ctx.db,
    `select * from audit_log
      where ($1 = 'all' or actor_type = $1) and ($4 = '' or split_part(action, '.', 1) = $4)
        and ($5 = '' or actor_label ilike '%' || $5 || '%' or target_label ilike '%' || $5 || '%') and ($6 = '' or target_id = $6)
      order by seq desc limit $2 offset $3`, [actor, lim, offset, area, q, targetId]);

  app.get('/admin/audit', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({
      actor: z.enum(['all', 'admin', 'system', 'organizer']).default('all'), limit: limit(100, 18), cursor: z.string().optional(),
      area: z.string().regex(/^[a-z_]{0,24}$/).default(''), q: z.string().max(60).default(''), targetId: z.string().max(60).default(''),
    }), req.query);
    const offset = decodeCursor(f.cursor);
    const rows = await auditRows(f.actor, f.limit + 1, offset, f.area, f.q.replace(/[%_\\]/g, ''), f.targetId);
    const p = page(rows, offset, f.limit);
    return {
      items: p.items.map((a) => ({
        seq: Number(a.seq), at: a.at, action: a.action,
        label: { en: actionLabel(a.action, a.diff, 'en'), vi: actionLabel(a.action, a.diff, 'vi') } as Localized,
        actorType: a.actor_type, actor: a.actor_type === 'system' ? L('System', 'Hệ thống') : { en: a.actor_label, vi: a.actor_label },
        target: { type: a.target_type, id: a.target_id, label: a.target_label },
        diff: (a.diff ?? []).map((d: any) => ({ field: d.f, before: d.a, after: d.b })),
        hash: `sha256:${a.hash.slice(0, 10)}`,
      })),
      nextCursor: p.nextCursor,
      note: L('Every moderation decision is recorded against the person who made it. Nothing can be deleted.', 'Mọi quyết định kiểm duyệt đều được ghi lại kèm người thực hiện. Không thể xoá.'),
    };
  });

  app.get('/admin/audit.csv', async (req, reply) => {
    requireAdmin(req);
    const { actor, days } = parse(z.object({ actor: z.enum(['all', 'admin', 'system', 'organizer']).default('all'), days: z.coerce.number().int().min(1).max(365).default(30) }), req.query);
    const since = new Date(ctx.clock.now().getTime() - days * 86400_000);
    const rows = await many<any>(ctx.db, `select * from audit_log where at >= $1 and ($2 = 'all' or actor_type = $2) order by seq`, [since, actor]);
    const csv = toCsv(['seq', 'at', 'actor_type', 'actor', 'action', 'target_type', 'target', 'diff', 'hash'],
      rows.map((a) => [a.seq, new Date(a.at).toISOString(), a.actor_type, a.actor_label, a.action, a.target_type, a.target_label,
        (a.diff ?? []).map((d: any) => `${d.f}: ${d.a} → ${d.b}`).join('; '), a.hash]));
    return reply.type('text/csv; charset=utf-8').header('content-disposition', `attachment; filename="audit-${vnDate(ctx.clock.now())}.csv"`).send(csv);
  });

  app.get('/admin/audit/verify', async (req) => {
    requireAdmin(req);
    return verifyAuditChain(ctx.db);
  });

  // ---- impersonation ("View as") -------------------------------------------------------

  app.get('/admin/impersonation/options', async (req) => {
    requireAdmin(req);
    const [users, orgs] = await Promise.all([
      many<any>(ctx.db,
        `select u.id, u.name, u.email, u.city, (select count(*)::int from saves s where s.user_id = u.id) as saved
           from users u where u.role = 'user' and not exists (select 1 from organizer_members m where m.user_id = u.id)
          order by u.last_active_at desc nulls last limit 5`),
      many<any>(ctx.db,
        `select o.id, o.name, o.verification_state, (select count(*)::int from events e where e.organizer_id = o.id and e.status = 'live') as live
           from organizers o where exists (select 1 from organizer_members m where m.organizer_id = o.id) order by live desc limit 5`),
    ]);
    return {
      items: [
        ...users.map((u) => ({ targetType: 'user', id: u.id, name: u.name || u.email, role: L(`User · ${u.city || '—'} · ${u.saved} saved`, `Người dùng · ${u.city || '—'} · ${u.saved} đã lưu`) })),
        ...orgs.map((o) => ({ targetType: 'organizer', id: o.id, name: o.name,
          role: o.verification_state === 'verified' ? L(`Organizer · ${o.live} live listings`, `Nhà tổ chức · ${o.live} tin đang chạy`) : L('Organizer · pending verification', 'Nhà tổ chức · chờ xác minh') })),
      ],
      note: L('An impersonated session is read-only and is written to the audit log against your name.', 'Phiên xem hộ là chỉ đọc và được ghi vào sổ hoạt động kèm tên người mở.'),
    };
  });

  /**
   * Opens a read-only session as a user, or as an organiser's owner. The returned token only
   * serves GETs; while it is live the admin's own writes are blocked too, until DELETE ends it.
   */
  app.post('/admin/impersonation', async (req) => {
    const s = requireAdmin(req);
    const body = parse(z.object({ targetType: z.enum(['user', 'organizer']), targetId: uuid }), req.body);
    const now = ctx.clock.now();
    return ctx.db.tx(async (q) => {
      const active = await one(q, 'select 1 from sessions where impersonator_id = $1 and expires_at > $2', [s.user.id, now]);
      if (active) throw conflict('already_impersonating', L('End the current impersonation first', 'Hãy kết thúc phiên xem hộ hiện tại trước'));
      let userId: string;
      let label: string;
      if (body.targetType === 'user') {
        const u = await one<any>(q, `select id, name, email, phone, role from users where id = $1`, [body.targetId]);
        if (!u) throw notFound();
        if (u.role === 'admin') throw badRequest('cannot_impersonate_admin', L('Admin accounts cannot be impersonated', 'Không thể xem hộ tài khoản admin'));
        userId = u.id;
        label = u.name || u.email || u.phone;
      } else {
        const o = await one<any>(q,
          `select o.name, m.user_id from organizers o join organizer_members m on m.organizer_id = o.id where o.id = $1 order by m.role = 'owner' desc limit 1`, [body.targetId]);
        if (!o) throw notFound();
        userId = o.user_id;
        label = o.name;
      }
      const { token, expiresAt } = await createSession(q, now, { kind: 'user', userId, readOnly: true, impersonatorId: s.user.id, ttlMs: IMPERSONATION_TTL_MS });
      await appendAudit(q, {
        at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'impersonation.started',
        targetType: body.targetType, targetId: body.targetId, targetLabel: label,
        diff: [{ f: 'session', a: 'admin', b: 'impersonate' }, { f: 'scope', a: 'read+write', b: 'read-only' }],
      });
      return {
        token, expiresAt, viewingAs: { targetType: body.targetType, id: body.targetId, name: label },
        banner: { label: L(`Viewing as ${label}`, `Đang xem dưới ${label}`), note: L('Read-only · every action is logged', 'Chỉ đọc · mọi hành động đều được ghi lại') },
      };
    });
  });

  app.delete('/admin/impersonation', async (req) => {
    const s = requireAdmin(req);
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const ended = await many<any>(q,
        `delete from sessions where impersonator_id = $1 returning user_id`, [s.user.id]);
      if (!ended.length) throw notFound(L('No impersonation is running', 'Không có phiên xem hộ nào'));
      const u = await one<any>(q, 'select name, email, phone from users where id = $1', [ended[0].user_id]);
      await appendAudit(q, {
        at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'impersonation.ended',
        targetType: 'user', targetId: ended[0].user_id, targetLabel: u?.name || u?.email || u?.phone || '—',
        diff: [{ f: 'session', a: 'impersonate', b: 'admin' }, { f: 'scope', a: 'read-only', b: 'read+write' }],
      });
    });
    return { ok: true, message: L('Impersonation ended', 'Đã thoát phiên xem hộ') };
  });

  // ---- payouts --------------------------------------------------------------------------

  /** Finance records a transfer it has made; the organiser's ledger row flips to paid. */
  app.post<{ Params: { eventId: string; kind: string } }>('/admin/payouts/:eventId/:kind', async (req, reply) => {
    const s = requireAdmin(req);
    const kind = parse(z.enum(['advance', 'post_event', 'refund_hold']), req.params.kind);
    const { reference } = parse(z.object({ reference: z.string().min(3).max(60) }), req.body);
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      const ev = await one<any>(q, 'select id, title, starts_on, ends_on from events where id = $1', [parse(uuid, req.params.eventId)]);
      if (!ev) throw notFound();
      const ledger = (await payoutLedger(q, ev, now)).find((r) => r.kind === kind)!;
      if (ledger.status === 'paid' || ledger.status === 'released') throw conflict('already_paid', L('This payout is already recorded', 'Khoản chi trả này đã được ghi nhận'));
      if (ledger.net <= 0) throw badRequest('nothing_to_pay', L('Nothing to pay out yet', 'Chưa có gì để chi trả'));
      const basis = ledger.lines.find((l) => l.key === 'gross_share' || l.key === 'held')?.amount ?? 0;
      await q.query('insert into payout_transfers (event_id, kind, amount, gross_basis, reference, paid_at) values ($1,$2,$3,$4,$5,$6)', [ev.id, kind, ledger.net, basis, reference, now]);
      await appendAudit(q, {
        at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'payout.marked_paid',
        targetType: 'event', targetId: ev.id, targetLabel: ev.title, diff: [{ f: kind, a: ledger.status, b: 'paid' }, { f: 'amount', a: '—', b: String(ledger.net) }],
      });
      return (await payoutLedger(q, ev, now)).find((r) => r.kind === kind);
    });
    return reply.code(201).send(row);
  });
}
