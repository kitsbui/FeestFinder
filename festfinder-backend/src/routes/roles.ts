import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { conflict, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { citySlug } from '../lib/places.ts';
import { isStyle } from '../lib/styles.ts';
import { ARTIST_ROLE, ORGANIZER_TYPE } from '../lib/network.ts';
import { limit, parse, uuid } from '../lib/validate.ts';
import { requireAdmin, requireUser } from '../http/guards.ts';
import { appendAudit } from '../services/audit.ts';
import { notifyUser } from '../services/notify.ts';
import {
  activateRole, claimArtist, claimOrganizer, claimSuggestions, personasOf, setRole, startArtistProfile, startOrganizer, type Persona,
} from '../services/roles.ts';

/*
 * Personas from the person's side (/me/roles) and the team's (/admin/profile-claims).
 *
 *   GET    /me/roles                 what they are, and claims waiting
 *   POST   /me/roles/artist          a profile of their own, or a claim on a listed one
 *   DELETE /me/roles/artist          hide the artist workspace; the profile and its history stay
 *   POST   /me/roles/organizer       an organiser of their own, or a claim on a listed one
 *   DELETE /me/roles/organizer
 *   POST   /me/onboarding            the role picker was answered (or skipped)
 *   GET    /me/roles/suggestions?q=  listed artists and organisers with that name
 *
 * There is no route that makes anyone an admin.
 */

const proof = z.string().url().max(500).nullable().optional();

const ArtistStart = z.union([
  z.object({
    stageName: z.string().trim().min(2).max(80),
    roles: z.array(z.enum(ARTIST_ROLE.keys as [string, ...string[]])).max(5).default([]),
    basedCity: citySlug.nullable().optional(),
    styles: z.array(z.string().refine(isStyle, 'unknown style')).max(6).default([]),
  }),
  z.object({ claimArtistId: uuid, note: z.string().max(1000).default(''), proofUrl: proof }),
]);

const OrganizerStart = z.union([
  z.object({
    name: z.string().trim().min(2).max(80),
    type: z.enum(ORGANIZER_TYPE.keys as [string, ...string[]]).default('promoter'),
    city: citySlug.nullable().optional(),
  }),
  z.object({ claimOrganizerId: uuid, note: z.string().max(1000).default(''), proofUrl: proof }),
]);

export default async function roleRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const answer = async (userId: string) => personasOf(ctx.db, userId);

  app.get('/me/roles', async (req) => {
    const s = requireUser(req);
    const u = await one<{ onboarded_at: Date | null }>(ctx.db, 'select onboarded_at from users where id = $1', [s.user.id]);
    return { ...(await answer(s.user.id)), onboarded: !!u?.onboarded_at, admin: s.user.role === 'admin' };
  });

  app.post('/me/onboarding', async (req) => {
    const s = requireUser(req);
    await ctx.db.query('update users set onboarded_at = coalesce(onboarded_at, $2) where id = $1', [s.user.id, ctx.clock.now()]);
    return { onboarded: true };
  });

  app.get('/me/roles/suggestions', async (req) => {
    requireUser(req);
    const { q } = parse(z.object({ q: z.string().trim().min(2).max(80) }), req.query);
    return claimSuggestions(ctx.db, q);
  });

  app.post('/me/roles/artist', async (req, reply) => {
    const s = requireUser(req);
    const body = parse(ArtistStart, req.body);
    const now = ctx.clock.now();
    if ('claimArtistId' in body) {
      const claim = await ctx.db.tx((q) => claimArtist(q, s.user.id, body.claimArtistId, body.note, body.proofUrl ?? null, now));
      return reply.code(202).send({ ...(await answer(s.user.id)), claimId: claim.id,
        message: L('Claim sent. The team checks it, usually within a day.', 'Đã gửi yêu cầu. Đội ngũ sẽ kiểm tra, thường trong một ngày.') });
    }
    const artist = await ctx.db.tx((q) => startArtistProfile(q, s.user.id, {
      stageName: body.stageName, roles: body.roles, basedCity: body.basedCity ?? null, styles: body.styles,
    }, now));
    await ctx.db.query('update users set onboarded_at = coalesce(onboarded_at, $2) where id = $1', [s.user.id, now]);
    return reply.code(201).send({ ...(await answer(s.user.id)), slug: artist.slug, message: L('Artist profile ready', 'Đã tạo hồ sơ nghệ sĩ') });
  });

  app.post('/me/roles/organizer', async (req, reply) => {
    const s = requireUser(req);
    const body = parse(OrganizerStart, req.body);
    const now = ctx.clock.now();
    if ('claimOrganizerId' in body) {
      const claim = await ctx.db.tx((q) => claimOrganizer(q, s.user.id, body.claimOrganizerId, body.note, body.proofUrl ?? null, now));
      return reply.code(202).send({ ...(await answer(s.user.id)), claimId: claim.id,
        message: L('Claim sent. The team checks it, usually within a day.', 'Đã gửi yêu cầu. Đội ngũ sẽ kiểm tra, thường trong một ngày.') });
    }
    const org = await ctx.db.tx((q) => startOrganizer(q, s.user.id, { name: body.name, type: body.type as any, city: body.city ?? null }, now));
    await ctx.db.query('update users set onboarded_at = coalesce(onboarded_at, $2) where id = $1', [s.user.id, now]);
    return reply.code(201).send({ ...(await answer(s.user.id)), slug: org.slug,
      message: L('Organiser created. The team verifies it before its events go live.', 'Đã tạo nhà tổ chức. Đội ngũ xác minh trước khi sự kiện được đăng.') });
  });

  /** Turning a persona back on, when the profile or membership is still there. */
  app.put<{ Params: { role: string } }>('/me/roles/:role', async (req) => {
    const s = requireUser(req);
    const role = parse(z.enum(['artist', 'organizer']), req.params.role) as Persona;
    const has = role === 'artist'
      ? await one(ctx.db, 'select 1 from artists where owner_user_id = $1', [s.user.id])
      : await one(ctx.db, 'select 1 from organizer_members where user_id = $1', [s.user.id]);
    if (!has) throw notFound(role === 'artist' ? L('Start or claim an artist profile first', 'Hãy tạo hoặc nhận hồ sơ nghệ sĩ trước') : L('Create or claim an organiser first', 'Hãy tạo hoặc nhận nhà tổ chức trước'));
    await setRole(ctx.db, s.user.id, role, 'active', ctx.clock.now());
    return answer(s.user.id);
  });

  app.delete<{ Params: { role: string } }>('/me/roles/:role', async (req) => {
    const s = requireUser(req);
    const role = parse(z.enum(['artist', 'organizer']), req.params.role) as Persona;
    await ctx.db.query(`update user_roles set status = 'disabled', updated_at = $3 where user_id = $1 and role = $2`, [s.user.id, role, ctx.clock.now()]);
    return { ...(await answer(s.user.id)), message: L('Turned off. Your profile and its history stay.', 'Đã tắt. Hồ sơ và lịch sử vẫn được giữ.') };
  });

  // ---- the team decides claims ------------------------------------------------------------

  app.get('/admin/profile-claims', async (req) => {
    requireAdmin(req);
    const { status, limit: max } = parse(z.object({ status: z.enum(['pending', 'approved', 'rejected']).default('pending'), limit: limit(200, 50) }), req.query);
    const [artists, organizers] = await Promise.all([
      many<any>(ctx.db,
        `select c.*, a.slug, a.name, a.owner_user_id, u.name as user_name, u.email as user_email,
                (select count(*)::int from event_artists ea where ea.artist_id = a.id) as events
           from artist_claims c join artists a on a.id = c.artist_id join users u on u.id = c.user_id
          where c.status = $1 order by c.created_at desc limit $2`, [status, max]),
      many<any>(ctx.db,
        `select c.*, o.slug, o.name, o.verification_state, u.name as user_name, u.email as user_email,
                (select count(*)::int from organizer_members m where m.organizer_id = o.id) as members
           from organizer_claims c join organizers o on o.id = c.organizer_id join users u on u.id = c.user_id
          where c.status = $1 order by c.created_at desc limit $2`, [status, max]),
    ]);
    const base = (c: any) => ({
      id: c.id, status: c.status, note: c.note, proofUrl: c.proof_url, createdAt: c.created_at, decidedAt: c.decided_at, decisionNote: c.decision_note,
      user: { id: c.user_id, name: c.user_name, email: c.user_email },
    });
    return {
      items: [
        ...artists.map((c) => ({ ...base(c), kind: 'artist' as const, target: { id: c.artist_id, slug: c.slug, name: c.name, events: c.events, owned: !!c.owner_user_id } })),
        ...organizers.map((c) => ({ ...base(c), kind: 'organizer' as const, target: { id: c.organizer_id, slug: c.slug, name: c.name, members: c.members, verification: c.verification_state } })),
      ].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()),
    };
  });

  app.post<{ Params: { kind: string; id: string } }>('/admin/profile-claims/:kind/:id/decision', async (req) => {
    const s = requireAdmin(req);
    const kind = parse(z.enum(['artist', 'organizer']), req.params.kind);
    const id = parse(uuid, req.params.id);
    const body = parse(z.object({ approve: z.boolean(), note: z.string().max(1000).default('') }), req.body);
    const now = ctx.clock.now();
    const table = kind === 'artist' ? 'artist_claims' : 'organizer_claims';
    const out = await ctx.db.tx(async (q) => {
      const c = await one<any>(q, `select * from ${table} where id = $1 for update`, [id]);
      if (!c) throw notFound();
      if (c.status !== 'pending') throw conflict('already_decided', L('This claim was already decided', 'Yêu cầu này đã được xử lý'));
      let label = '';
      if (kind === 'artist') {
        const a = await one<any>(q, 'select id, name, owner_user_id from artists where id = $1 for update', [c.artist_id]);
        label = a.name;
        if (body.approve) {
          if (a.owner_user_id && a.owner_user_id !== c.user_id) throw conflict('artist_owned', L('Someone else owns this profile now', 'Hồ sơ này đã có người khác quản lý'));
          if (await one(q, 'select 1 from artists where owner_user_id = $1 and id <> $2', [c.user_id, a.id])) {
            throw conflict('has_profile', L('This person already owns another artist profile', 'Người này đã quản lý một hồ sơ nghệ sĩ khác'));
          }
          await q.query('update artists set owner_user_id = $2, updated_at = $3 where id = $1', [a.id, c.user_id, now]);
          // Other people's claims on the same profile end here.
          await q.query(`update artist_claims set status = 'rejected', decided_at = $2, decided_by = $3, decision_note = 'Another claim was approved'
                          where artist_id = $1 and status = 'pending' and id <> $4`, [a.id, now, s.user.id, id]);
        }
      } else {
        const o = await one<any>(q, 'select id, name from organizers where id = $1', [c.organizer_id]);
        label = o.name;
        if (body.approve) {
          const hasOwner = await one(q, `select 1 from organizer_members where organizer_id = $1 and role = 'owner'`, [o.id]);
          await q.query(`insert into organizer_members (organizer_id, user_id, role) values ($1,$2,$3) on conflict do nothing`, [o.id, c.user_id, hasOwner ? 'manager' : 'owner']);
        }
      }
      await q.query(`update ${table} set status = $2, decided_at = $3, decided_by = $4, decision_note = $5 where id = $1`,
        [id, body.approve ? 'approved' : 'rejected', now, s.user.id, body.note || null]);
      if (body.approve) await activateRole(q, c.user_id, kind, now);
      else {
        // A refused claim leaves the persona pending only if nothing else backs it.
        const backed = kind === 'artist'
          ? await one(q, 'select 1 from artists where owner_user_id = $1', [c.user_id])
          : await one(q, 'select 1 from organizer_members where user_id = $1', [c.user_id]);
        const open = await one(q, `select 1 from ${table} where user_id = $1 and status = 'pending'`, [c.user_id]);
        if (!backed && !open) await q.query(`delete from user_roles where user_id = $1 and role = $2 and status = 'pending'`, [c.user_id, kind]);
      }
      await appendAudit(q, {
        at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: `${kind}.claim_${body.approve ? 'approved' : 'rejected'}`,
        targetType: kind, targetId: kind === 'artist' ? c.artist_id : c.organizer_id, targetLabel: label, diff: [{ f: 'claim', a: 'pending', b: body.approve ? 'approved' : 'rejected' }],
      });
      await notifyUser(q, now, {
        userId: c.user_id, topic: null, kind: 'profile_claim',
        title: body.approve ? L(`You now manage ${label}`, `Bạn đã được quản lý ${label}`) : L(`Your claim on ${label} was not approved`, `Yêu cầu quản lý ${label} chưa được duyệt`),
        body: body.approve ? L('Open your workspace to edit the profile.', 'Mở khu làm việc để chỉnh hồ sơ.') : L(body.note || 'Reply with more proof if you think this is wrong.', body.note || 'Hãy gửi thêm bằng chứng nếu bạn nghĩ đây là nhầm lẫn.'),
        link: { kind: kind === 'artist' ? 'artist_workspace' : 'organizer_workspace' },
      });
      return { label };
    });
    return { id, status: body.approve ? 'approved' : 'rejected', message: body.approve ? L(`${out.label}: approved`, `${out.label}: đã duyệt`) : L(`${out.label}: refused`, `${out.label}: đã từ chối`) };
  });
}
