import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Queryable } from '../../db/index.ts';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { initialsOf, isEmail, normalizeEmail, slugify } from '../../lib/contact.ts';
import { randomCode } from '../../lib/crypto.ts';
import { ORGANIZER_TYPE, type OrganizerType } from '../../lib/network.ts';
import { vnDate } from '../../lib/time.ts';
import { localized, parse, uuid } from '../../lib/validate.ts';
import { requireAdmin } from '../../http/guards.ts';
import { appendAudit } from '../../services/audit.ts';
import { notifyOrganizer } from '../../services/notify.ts';
import { activateRole } from '../../services/roles.ts';
import { imageChange } from '../../services/remote-images.ts';
import { STATUS_LABEL } from '../organizer/events.ts';

import { ORG_TYPES, ARTS, short, actorOf } from './ops-shared.ts';

/* Organisers as the team sees them: profile, standing, team members, onboarding. */

export default async function adminOrganizerRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- organisers: profile, standing, team, onboarding -----------------------------------------

  app.get<{ Params: { id: string } }>('/admin/organizers/:id', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const now = ctx.clock.now();
    const o = await one<any>(ctx.db, 'select * from organizers where id = $1', [id]);
    if (!o) throw notFound();
    const [members, events, stats, decisions] = await Promise.all([
      many<any>(ctx.db, `select u.id, u.name, u.email, u.phone, u.last_active_at, u.password_hash is not null as has_password, m.role
                           from organizer_members m join users u on u.id = m.user_id where m.organizer_id = $1 order by m.role = 'owner' desc, u.name`, [id]),
      many<any>(ctx.db, `select id, slug, title, status, starts_on, genre, quality_score from events where organizer_id = $1 order by starts_on desc nulls first limit 60`, [id]),
      one<any>(ctx.db,
        `select (select count(*)::int from events where organizer_id = $1 and status = 'live' and (ends_at is null or ends_at >= $2)) as live,
                (select count(*)::int from listing_reports r join events e on e.id = r.event_id where e.organizer_id = $1) as reports,
                coalesce((select sum(x.total - x.fee) from orders x join events e on e.id = x.event_id where e.organizer_id = $1 and x.status = 'paid'), 0)::bigint as gmv`, [id, now]),
      many<any>(ctx.db, `select d.decision, count(*)::int as n from moderation_decisions d join events e on e.id = d.event_id where e.organizer_id = $1 group by d.decision`, [id]),
    ]);
    return {
      id: o.id, slug: o.slug, name: o.name, initials: o.initials, type: o.type, typeLabel: ORG_TYPES[o.type], bio: o.bio, art: o.art, logoUrl: o.logo_url,
      website: o.website, legalName: o.legal_name, taxCode: o.tax_code, address: o.address, email: o.email, hotline: o.hotline, zalo: o.zalo,
      contactName: o.contact_name, contactRole: o.contact_role, since: o.since_year, followers: o.followers_count, createdAt: o.created_at,
      state: o.verification_state, docs: { id: o.doc_id, tax: o.doc_tax, bank: o.doc_bank }, strikes: o.strikes, suspended: !!o.suspended_at, suspendedAt: o.suspended_at,
      bank: o.bank_account_no ? { bin: o.bank_bin, bankName: o.bank_name, accountNo: o.bank_account_no, accountName: o.bank_account_name, verified: o.bank_verified, addedAt: o.bank_added_at } : null,
      members: members.map((m) => ({ id: m.id, name: m.name, email: m.email, phone: m.phone, role: m.role, lastActiveAt: m.last_active_at, hasPassword: m.has_password })),
      events: events.map((e) => ({ id: e.id, slug: e.slug, title: e.title, status: e.status, statusLabel: STATUS_LABEL[e.status], startsOn: e.starts_on, genre: e.genre, qualityScore: e.quality_score })),
      stats: { live: stats.live, reports: stats.reports, gmv: Number(stats.gmv), decisions: Object.fromEntries(decisions.map((d) => [d.decision, d.n])) },
    };
  });

  /** Finds the account for an email, or opens one with no password: the person sets it with "Forgot password". */
  async function accountFor(q: Queryable, email: string, name: string | undefined, now: Date): Promise<{ id: string; created: boolean }> {
    const e = normalizeEmail(email);
    if (!isEmail(e)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
    const u = await one<any>(q, 'select id from users where email = $1', [e]);
    if (u) return { id: u.id, created: false };
    const row = await one<any>(q, `insert into users (email, name, signup_method, locale, created_at) values ($1,$2,'email','vi',$3) returning id`, [e, name?.trim() ?? '', now]);
    return { id: row.id, created: true };
  }

  const ProfileInput = z.object({
    name: z.string().trim().min(2).max(80), type: z.enum(ORGANIZER_TYPE.keys as [OrganizerType, ...OrganizerType[]]), bio: localized,
    // A link, checked when it changes (services/remote-images.ts): an organiser's logo is not uploaded.
    logoUrl: z.string().max(2048).nullable(), website: z.string().url().nullable().or(z.literal('')), legalName: z.string().max(160),
    taxCode: z.string().max(20), address: z.string().max(240), email: z.string().max(200), hotline: z.string().max(30),
    zalo: z.string().max(80), contactName: z.string().max(80), contactRole: z.string().max(80),
  }).partial();

  const PROFILE_COLUMNS: Record<string, string> = {
    name: 'name', type: 'type', website: 'website', legalName: 'legal_name', taxCode: 'tax_code', address: 'address',
    email: 'email', hotline: 'hotline', zalo: 'zalo', contactName: 'contact_name', contactRole: 'contact_role',
  };

  /** `logo` is the checked link (imageChange), worked out before the transaction: checking fetches it. */
  function profileSet(body: z.infer<typeof ProfileInput>, logo: string | null | undefined): Record<string, unknown> {
    if (body.email && !isEmail(body.email)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
    if (body.taxCode && !/^\d{10,14}$/.test(body.taxCode.replace(/[\s-]/g, ''))) throw badRequest('invalid_tax_code', L('Tax codes are 10 to 14 digits', 'Mã số thuế gồm 10 đến 14 chữ số'));
    const set: Record<string, unknown> = {};
    for (const [k, col] of Object.entries(PROFILE_COLUMNS)) {
      const v = (body as any)[k];
      if (v !== undefined) set[col] = typeof v === 'string' ? v.trim() || null : v;
    }
    if (body.name) { set.name = body.name.trim(); set.initials = initialsOf(body.name.replace(/[^\p{L}\p{N}\s]/gu, '')) || 'FF'; }
    if (body.email) set.email = normalizeEmail(body.email);
    if (body.taxCode) set.tax_code = body.taxCode.replace(/[\s-]/g, '');
    if (body.bio) set.bio = json(body.bio);
    if (logo !== undefined) set.logo_url = logo;
    return set;
  }

  app.post('/admin/organizers', async (req, reply) => {
    const s = requireAdmin(req);
    const body = parse(ProfileInput.extend({
      name: z.string().trim().min(2).max(80), type: z.enum(ORGANIZER_TYPE.keys as [OrganizerType, ...OrganizerType[]]),
      ownerEmail: z.string().max(200), ownerName: z.string().max(80).optional(),
    }), req.body);
    const now = ctx.clock.now();
    const logo = await imageChange(ctx, null, body.logoUrl, 'logo');
    const out = await ctx.db.tx(async (q) => {
      const set = profileSet(body, logo);
      let slug = slugify(body.name) || 'organizer';
      if (await one(q, 'select 1 from organizers where slug = $1', [slug])) slug = `${slug}-${randomCode(4).toLowerCase()}`;
      const cols = ['slug', 'art', 'since_year', 'verification_state', ...Object.keys(set)];
      const vals = [slug, ARTS[Math.floor(Math.random() * ARTS.length)], Number(vnDate(now).slice(0, 4)), 'pending', ...Object.values(set)];
      if (!set.bio) { cols.push('bio'); vals.push(json({ en: '', vi: '' })); }
      const org = await one<any>(q, `insert into organizers (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')}) returning *`, vals);
      const owner = await accountFor(q, body.ownerEmail, body.ownerName ?? body.contactName, now);
      await q.query(`insert into organizer_members (organizer_id, user_id, role) values ($1,$2,'owner') on conflict do nothing`, [org.id, owner.id]);
      await activateRole(q, owner.id, 'organizer', now);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.created', targetType: 'organizer', targetId: org.id, targetLabel: org.name,
        diff: [{ f: 'type', a: '—', b: org.type }, { f: 'owner', a: '—', b: normalizeEmail(body.ownerEmail) }, { f: 'account', a: '—', b: owner.created ? 'new' : 'existing' }] });
      return { org, owner };
    });
    return reply.code(201).send({
      id: out.org.id, slug: out.org.slug, name: out.org.name, ownerCreated: out.owner.created,
      message: out.owner.created
        ? L(`${out.org.name} created. The owner sets a password from "Forgot password" on the sign-in screen.`, `Đã tạo ${out.org.name}. Chủ tài khoản đặt mật khẩu qua "Quên mật khẩu" ở màn hình đăng nhập.`)
        : L(`${out.org.name} created and linked to the existing account.`, `Đã tạo ${out.org.name} và gắn với tài khoản sẵn có.`),
    });
  });

  app.patch<{ Params: { id: string } }>('/admin/organizers/:id/profile', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(ProfileInput, req.body);
    const now = ctx.clock.now();
    const was = await one<{ logo_url: string | null }>(ctx.db, 'select logo_url from organizers where id = $1', [id]);
    const logo = was ? await imageChange(ctx, was.logo_url, body.logoUrl, 'logo') : undefined;
    await ctx.db.tx(async (q) => {
      const old = await one<any>(q, 'select * from organizers where id = $1 for update', [id]);
      if (!old) throw notFound();
      const set = profileSet(body, logo);
      const keys = Object.keys(set);
      if (!keys.length) return;
      await q.query(`update organizers set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1`, [id, ...keys.map((k) => set[k])]);
      const diff = keys.filter((k) => k !== 'initials' && JSON.stringify(old[k] ?? null) !== JSON.stringify(k === 'bio' ? JSON.parse(set[k] as string) : set[k]))
        .map((k) => ({ f: k, a: k === 'bio' ? '…' : short(old[k]), b: k === 'bio' ? '…' : short(set[k]) }));
      if (diff.length) await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.updated', targetType: 'organizer', targetId: id, targetLabel: (set.name as string) ?? old.name, diff });
    });
    return { ok: true, message: L('Profile saved', 'Đã lưu hồ sơ') };
  });

  app.post<{ Params: { id: string } }>('/admin/organizers/:id/standing', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(z.object({ strikes: z.number().int().min(0).max(3).optional(), suspended: z.boolean().optional(), note: z.string().trim().max(500).optional() }), req.body);
    const now = ctx.clock.now();
    return ctx.db.tx(async (q) => {
      const o = await one<any>(q, 'select * from organizers where id = $1 for update', [id]);
      if (!o) throw notFound();
      const strikes = body.strikes ?? o.strikes;
      const suspended = body.suspended ?? !!o.suspended_at;
      await q.query('update organizers set strikes = $2, suspended_at = $3 where id = $1', [id, strikes, suspended ? (o.suspended_at ?? now) : null]);
      if (suspended !== !!o.suspended_at) {
        await appendAudit(q, { at: now, ...actorOf(s), action: suspended ? 'organizer.suspended' : 'organizer.reinstated', targetType: 'organizer', targetId: id, targetLabel: o.name,
          diff: [{ f: 'suspended', a: String(!!o.suspended_at), b: String(suspended) }, ...(body.note ? [{ f: 'note', a: '—', b: short(body.note) }] : [])] });
        await notifyOrganizer(q, now, {
          organizerId: id, topic: 'moderation', kind: 'reject',
          title: suspended ? L('Account suspended', 'Tài khoản bị tạm dừng') : L('Account reinstated', 'Tài khoản đã được mở lại'),
          body: suspended ? L('New listings cannot be submitted until FeestFinder lifts the suspension.', 'Không gửi được tin mới cho tới khi FeestFinder mở lại tài khoản.') : L('You can submit listings again.', 'Bạn có thể gửi tin trở lại.'),
          link: { screen: 'inbox' },
        });
      }
      if (strikes !== o.strikes) {
        await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.strikes_changed', targetType: 'organizer', targetId: id, targetLabel: o.name, diff: [{ f: 'strikes', a: String(o.strikes), b: String(strikes) }] });
      }
      return { ok: true, strikes, suspended, message: L('Standing updated', 'Đã cập nhật') };
    });
  });

  app.post<{ Params: { id: string } }>('/admin/organizers/:id/members', async (req, reply) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(z.object({ email: z.string().max(200), name: z.string().max(80).optional(), role: z.enum(['owner', 'manager']).default('manager') }), req.body);
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const o = await one<any>(q, 'select id, name from organizers where id = $1', [id]);
      if (!o) throw notFound();
      const u = await accountFor(q, body.email, body.name, now);
      await q.query(`insert into organizer_members (organizer_id, user_id, role) values ($1,$2,$3) on conflict (organizer_id, user_id) do update set role = excluded.role`, [id, u.id, body.role]);
      await activateRole(q, u.id, 'organizer', ctx.clock.now());
      await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.member_added', targetType: 'organizer', targetId: id, targetLabel: o.name,
        diff: [{ f: 'member', a: '—', b: normalizeEmail(body.email) }, { f: 'role', a: '—', b: body.role }] });
      return u;
    });
    return reply.code(201).send({ ok: true, userId: out.id, created: out.created, message: out.created ? L('Added. They set a password with "Forgot password".', 'Đã thêm. Người này đặt mật khẩu qua "Quên mật khẩu".') : L('Added to the team', 'Đã thêm vào nhóm') });
  });

  app.delete<{ Params: { id: string; userId: string } }>('/admin/organizers/:id/members/:userId', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const userId = parse(uuid, req.params.userId);
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const m = await one<any>(q, `select m.role, u.email, o.name from organizer_members m join users u on u.id = m.user_id join organizers o on o.id = m.organizer_id where m.organizer_id = $1 and m.user_id = $2`, [id, userId]);
      if (!m) throw notFound();
      if (m.role === 'owner') {
        const owners = await one<any>(q, `select count(*)::int as n from organizer_members where organizer_id = $1 and role = 'owner'`, [id]);
        if (owners.n <= 1) throw conflict('last_owner', L('Every organizer keeps at least one owner', 'Mỗi nhà tổ chức cần ít nhất một chủ tài khoản'));
      }
      await q.query('delete from organizer_members where organizer_id = $1 and user_id = $2', [id, userId]);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.member_removed', targetType: 'organizer', targetId: id, targetLabel: m.name, diff: [{ f: 'member', a: m.email ?? userId, b: '—' }] });
    });
    return { ok: true, message: L('Removed from the team', 'Đã gỡ khỏi nhóm') };
  });

}
