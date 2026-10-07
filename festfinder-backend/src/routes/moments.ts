import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { dateStr, limit, parse, uuid } from '../lib/validate.ts';
import { requireAdmin, requireOrganizer, requireUser, requireWriter } from '../http/guards.ts';
import { appendAudit } from '../services/audit.ts';

/*
 * Moments: up to nine pictures on a profile, each an image uploaded to FeestFinder (purpose
 * `moment`), with a caption and a date. A fan's are on their own profile only; an artist's and an
 * organiser's are public, so adding one needs a confirmed phone like any other publishing.
 * Anyone signed in can report one; a moderator removes it or keeps it, and both are audited.
 */

export const MOMENTS_MAX = 9;
type Kind = 'user' | 'artist' | 'organizer';
const Kind = z.enum(['user', 'artist', 'organizer']);
const REASONS = ['not_mine', 'offensive', 'unsafe', 'spam'] as const;
const REASON_LABEL: Record<(typeof REASONS)[number], Localized> = {
  not_mine: L('Not theirs to post', 'Không phải ảnh của họ'), offensive: L('Offensive', 'Phản cảm'),
  unsafe: L('Unsafe or illegal', 'Nguy hiểm hoặc trái phép'), spam: L('Spam or advertising', 'Spam hoặc quảng cáo'),
};

export function presentMoment(m: any) {
  return { id: m.id as string, url: m.url as string, caption: m.caption as string | null, takenOn: m.taken_on ? String(m.taken_on).slice(0, 10) : null, createdAt: m.created_at };
}

/** A profile's moments as everyone sees them, in the owner's order. */
export async function momentsOf(q: Queryable, kind: Kind, ownerId: string) {
  const rows = await many<any>(q,
    `select id, url, caption, taken_on::text as taken_on, created_at from moments
      where owner_kind = $1 and owner_id = $2 and removed_at is null order by sort, created_at limit $3`, [kind, ownerId, MOMENTS_MAX]);
  return rows.map(presentMoment);
}

export default async function momentRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  /** Whose moments this person is managing: their own, the artist profile they own, or their organiser. */
  const ownerFor = async (req: FastifyRequest, kind: Kind): Promise<{ userId: string; id: string }> => {
    if (kind === 'user') { const me = requireUser(req).user.id; return { userId: me, id: me }; }
    const s = requireWriter(req);
    if (kind === 'artist') {
      const a = await one<{ id: string }>(ctx.db, 'select id from artists where owner_user_id = $1', [s.user.id]);
      if (!a) throw notFound(L('You have no artist profile yet', 'Bạn chưa có hồ sơ nghệ sĩ'));
      return { userId: s.user.id, id: a.id };
    }
    const org = await requireOrganizer(ctx, req);
    return { userId: s.user.id, id: org.organizerId };
  };

  /** The moment, if this person may change it. */
  const managed = async (req: FastifyRequest, id: string) => {
    const s = requireUser(req);
    const m = await one<any>(ctx.db, 'select * from moments where id = $1 and removed_at is null', [parse(uuid, id)]);
    if (!m) throw notFound();
    const mine = m.owner_kind === 'user' ? m.owner_id === s.user.id
      : m.owner_kind === 'artist' ? !!(await one(ctx.db, 'select 1 from artists where id = $1 and owner_user_id = $2', [m.owner_id, s.user.id]))
      : !!(await one(ctx.db, 'select 1 from organizer_members where organizer_id = $1 and user_id = $2', [m.owner_id, s.user.id]));
    if (!mine) throw forbidden('not_yours', L('Only the profile’s owner can change its photos', 'Chỉ chủ hồ sơ mới sửa được ảnh'));
    return { s, m };
  };

  app.get('/me/moments', async (req) => {
    const { as } = parse(z.object({ as: Kind.default('user') }), req.query);
    const owner = await ownerFor(req, as);
    return { items: await momentsOf(ctx.db, as, owner.id), max: MOMENTS_MAX };
  });

  app.post('/me/moments', async (req, reply) => {
    const body = parse(z.object({
      as: Kind.default('user'), url: z.string().max(2048), caption: z.string().trim().max(140).nullable().optional(), takenOn: dateStr.nullable().optional(),
    }), req.body);
    const owner = await ownerFor(req, body.as);
    // Only a picture this person uploaded as a moment: no other host gets past the CSP, and no one else's upload.
    const up = await one(ctx.db, `select 1 from uploads where url = $1 and owner_id = $2 and purpose = 'moment'`, [body.url, owner.userId]);
    if (!up) throw badRequest('upload_required', L('Upload the photo first', 'Hãy tải ảnh lên trước'));
    const row = await ctx.db.tx(async (q) => {
      await q.query('select pg_advisory_xact_lock(hashtext($1))', [`moments:${body.as}:${owner.id}`]);
      const n = await one<{ n: number; top: number }>(q,
        'select count(*)::int as n, coalesce(max(sort), -1)::int as top from moments where owner_kind = $1 and owner_id = $2 and removed_at is null', [body.as, owner.id]);
      if (n!.n >= MOMENTS_MAX) throw conflict('moments_full', L(`Up to ${MOMENTS_MAX} photos; remove one first`, `Tối đa ${MOMENTS_MAX} ảnh; hãy xoá bớt một ảnh`));
      return one<any>(q,
        `insert into moments (owner_kind, owner_id, url, caption, taken_on, sort, created_by, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8)
         returning id, url, caption, taken_on::text as taken_on, created_at`,
        [body.as, owner.id, body.url, body.caption || null, body.takenOn ?? null, n!.top + 1, owner.userId, ctx.clock.now()]);
    });
    return reply.code(201).send(presentMoment(row));
  });

  app.patch<{ Params: { id: string } }>('/me/moments/:id', async (req) => {
    const { m } = await managed(req, req.params.id);
    const body = parse(z.object({ caption: z.string().trim().max(140).nullable(), takenOn: dateStr.nullable() }).partial(), req.body);
    const row = await one<any>(ctx.db,
      `update moments set caption = case when $2::boolean then $3 else caption end, taken_on = case when $4::boolean then $5::date else taken_on end
        where id = $1 returning id, url, caption, taken_on::text as taken_on, created_at`,
      [m.id, body.caption !== undefined, body.caption || null, body.takenOn !== undefined, body.takenOn ?? null]);
    return presentMoment(row);
  });

  app.delete<{ Params: { id: string } }>('/me/moments/:id', async (req) => {
    const { s, m } = await managed(req, req.params.id);
    await ctx.db.query(`update moments set removed_at = $2, removed_by = $3, removed_reason = 'owner' where id = $1`, [m.id, ctx.clock.now(), s.user.id]);
    return { ok: true, message: L('Photo removed', 'Đã xoá ảnh') };
  });

  app.put('/me/moments/order', async (req) => {
    const { as, ids } = parse(z.object({ as: Kind.default('user'), ids: z.array(uuid).max(MOMENTS_MAX) }), req.body);
    const owner = await ownerFor(req, as);
    await ctx.db.tx(async (q) => {
      for (const [i, id] of ids.entries()) {
        await q.query('update moments set sort = $4 where id = $1 and owner_kind = $2 and owner_id = $3 and removed_at is null', [id, as, owner.id, i]);
      }
    });
    return { items: await momentsOf(ctx.db, as, owner.id) };
  });

  app.post<{ Params: { id: string } }>('/moments/:id/report', async (req, reply) => {
    const s = requireUser(req);
    const { reason } = parse(z.object({ reason: z.enum(REASONS) }), req.body);
    const m = await one<any>(ctx.db, 'select id, owner_kind, owner_id from moments where id = $1 and removed_at is null', [parse(uuid, req.params.id)]);
    if (!m) throw notFound();
    const made = await one(ctx.db,
      `insert into moment_reports (moment_id, user_id, reason, created_at) values ($1,$2,$3,$4) on conflict do nothing returning 1`,
      [m.id, s.user.id, reason, ctx.clock.now()]);
    return reply.code(made ? 201 : 200).send({ ok: true, message: L('Thanks, a moderator will look at it', 'Cảm ơn bạn, kiểm duyệt viên sẽ xem') });
  });

  // ---- moderators -----------------------------------------------------------------------------

  app.get('/admin/moments/reports', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({ limit: limit(100, 40) }), req.query);
    const rows = await many<any>(ctx.db,
      `select m.id, m.url, m.caption, m.owner_kind, m.owner_id, min(r.created_at) as first_at, count(*)::int as reports, array_agg(distinct r.reason) as reasons,
              coalesce(a.name, o.name, u.name, u.email) as owner_name, coalesce(a.slug, o.slug) as owner_slug
         from moment_reports r join moments m on m.id = r.moment_id
         left join artists a on m.owner_kind = 'artist' and a.id = m.owner_id
         left join organizers o on m.owner_kind = 'organizer' and o.id = m.owner_id
         left join users u on m.owner_kind = 'user' and u.id = m.owner_id
        where r.resolved_at is null and m.removed_at is null
        group by m.id, a.name, a.slug, o.name, o.slug, u.name, u.email order by count(*) desc, min(r.created_at) limit $1`, [f.limit]);
    return {
      items: rows.map((r) => ({
        id: r.id, url: r.url, caption: r.caption, reports: r.reports, firstAt: r.first_at,
        reasons: (r.reasons as (typeof REASONS)[number][]).map((k) => ({ key: k, label: REASON_LABEL[k] })),
        owner: { kind: r.owner_kind, name: r.owner_name, href: r.owner_kind === 'artist' ? `/a/${r.owner_slug}` : r.owner_kind === 'organizer' ? `/o/${r.owner_slug}` : null },
      })),
    };
  });

  const decide = (verdict: 'removed' | 'kept') => async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const s = requireAdmin(req);
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const m = await one<any>(q, 'select * from moments where id = $1 for update', [parse(uuid, req.params.id)]);
      if (!m) throw notFound();
      if (m.removed_at) throw conflict('already_removed', L('This photo is already removed', 'Ảnh này đã được gỡ'));
      if (verdict === 'removed') await q.query(`update moments set removed_at = $2, removed_by = $3, removed_reason = 'moderation' where id = $1`, [m.id, now, s.user.id]);
      const open = await many(q, `update moment_reports set resolved_at = $2, resolution = $3 where moment_id = $1 and resolved_at is null returning 1`, [m.id, now, verdict]);
      await appendAudit(q, {
        at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: `moment.${verdict}`,
        targetType: 'moment', targetId: m.id, targetLabel: m.caption || m.url,
        diff: [{ f: 'reports_open', a: String(open.length), b: '0' }, ...(verdict === 'removed' ? [{ f: 'visible', a: 'true', b: 'false' }] : [])],
      });
    });
    return { ok: true, message: verdict === 'removed' ? L('Photo removed', 'Đã gỡ ảnh') : L('Photo kept', 'Đã giữ ảnh') };
  };
  app.post<{ Params: { id: string } }>('/admin/moments/:id/remove', decide('removed'));
  app.post<{ Params: { id: string } }>('/admin/moments/:id/keep', decide('kept'));
}

