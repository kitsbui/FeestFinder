import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { cityBySlug, launchedCity } from '../lib/places.ts';
import { EVENT_TYPES, isStyle } from '../lib/styles.ts';
import { dateStr, limit, parse, uuid } from '../lib/validate.ts';
import { requireAdmin, requireUser, requireWriter } from '../http/guards.ts';
import { personId } from '../services/analytics.ts';
import { appendAudit } from '../services/audit.ts';
import { notifyUser } from '../services/notify.ts';
import {
  ANSWERS, loadProject, missingForReview, newSlug, OFFER_KINDS, OFFER_LABEL, presentProject, PROJECT, SEEKING, type OfferKind, type Seeking,
} from '../services/projects.ts';

/*
 * Projects (migration 034, services/projects.ts).
 *
 *   anyone    GET /projects (open ones; ?city= &style= &seeking=), GET /projects/:slug
 *   owner     GET/POST /me/projects, GET/PATCH /me/projects/:id, PUT /me/projects/:id/packages,
 *             POST /me/projects/:id/submit | close | event, GET /me/projects/:id/offers,
 *             POST /me/projects/:id/offers/:offerId { accept }
 *   others    POST /projects/:slug/offers, GET /me/offers, POST /me/offers/:id/withdraw
 *   team      GET /admin/projects?status=, POST /admin/projects/:id/decision { approve | close }
 *
 * A project is public once the team approved it (open), and stays so when it became an event
 * (realized). Contacts change hands only through an accepted offer.
 */

const amount = z.coerce.number().int().min(0).max(1e13);
const Fields = {
  title: z.string().trim().min(3).max(120),
  pitch: z.string().trim().max(200),
  story: z.string().trim().max(6000),
  city: launchedCity,
  styles: z.array(z.string().refine(isStyle, 'unknown style')).max(6),
  eventType: z.enum(EVENT_TYPES).nullable(),
  targetOn: dateStr.nullable(),
  capacity: z.coerce.number().int().min(1).max(1_000_000).nullable(),
  budget: amount.nullable(),
  raiseAmount: amount.nullable(),
  seeking: z.array(z.enum(SEEKING)).max(SEEKING.length),
  coverUrl: z.string().max(500).regex(/^(https:\/\/|\/files\/)/).nullable(),
};
const Create = z.object({
  ...Fields,
  pitch: Fields.pitch.default(''), story: Fields.story.default(''), styles: Fields.styles.default([]), eventType: Fields.eventType.default(null),
  targetOn: Fields.targetOn.default(null), capacity: Fields.capacity.default(null), budget: Fields.budget.default(null),
  raiseAmount: Fields.raiseAmount.default(null), seeking: Fields.seeking.default([]), coverUrl: Fields.coverUrl.default(null),
});
const Update = z.object(Fields).partial();
const COLUMN: Record<string, string> = {
  title: 'title', pitch: 'pitch', story: 'story', city: 'city', styles: 'styles', eventType: 'event_type', targetOn: 'target_on',
  capacity: 'capacity', budget: 'budget', raiseAmount: 'raise_amount', seeking: 'seeking', coverUrl: 'cover_url',
};
const Package = z.object({ title: z.string().trim().min(2).max(80), amount, perks: z.string().trim().max(600).default(''), slots: z.coerce.number().int().min(1).max(1000).nullable().default(null) });
const Offer = z.object({
  kind: z.enum(OFFER_KINDS),
  orgName: z.string().trim().max(120).default(''),
  packageId: uuid.nullable().default(null),
  amount: amount.nullable().default(null),
  message: z.string().trim().max(2000).default(''),
});

const EDITABLE = ['draft', 'rejected', 'open'];
const PUBLIC = ['open', 'realized'];

export default async function projectRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const viewerOf = (req: FastifyRequest) => ({ userId: req.session?.user?.id ?? null, isAdmin: req.session?.user?.role === 'admin' && !req.session?.impersonatorId });

  /** The owner's own project, or a 404 for anyone else (no hint that it exists). */
  const ownProject = async (userId: string, id: string) => {
    const p = await one<any>(ctx.db, `${PROJECT} where p.id = $1 and p.owner_user_id = $2`, [parse(uuid, id), userId]);
    if (!p) throw notFound(L('Project not found', 'Không tìm thấy dự án'));
    return p;
  };
  const full = async (id: string, req: FastifyRequest) => {
    const x = (await loadProject(ctx.db, { id }))!;
    return presentProject(x.p, { packages: x.packages, counts: x.counts, event: x.event, viewer: viewerOf(req) });
  };
  const contactOf = async (userId: string) => one<{ name: string | null; email: string | null; phone: string | null }>(ctx.db, 'select name, email, phone from users where id = $1', [userId]);

  // ---- anyone ----------------------------------------------------------------------------------

  app.get('/projects', async (req) => {
    const f = parse(z.object({
      city: launchedCity.optional(), style: z.string().refine(isStyle, 'unknown style').optional(), seeking: z.enum(SEEKING).optional(),
      limit: limit(60, 24), offset: z.coerce.number().int().min(0).max(10_000).default(0),
    }), req.query);
    const params: unknown[] = [];
    const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
    const where = [`p.status = 'open'`];
    if (f.city) where.push(`p.city = ${p(f.city)}`);
    if (f.style) where.push(`${p(f.style)} = any(p.styles)`);
    const base = [...params];
    const all = [...where];
    if (f.seeking) where.push(`${p(f.seeking)} = any(p.seeking)`);
    const [rows, kinds] = await Promise.all([
      many<any>(ctx.db, `${PROJECT} where ${where.join(' and ')} order by p.published_at desc, p.id limit ${p(f.limit)} offset ${p(f.offset)}`, params),
      many<{ k: string; n: number }>(ctx.db, `select k, count(*)::int as n from projects p cross join lateral unnest(p.seeking) k where ${all.join(' and ')} group by k`, base),
    ]);
    const total = await one<{ n: number }>(ctx.db, `select count(*)::int as n from projects p where ${where.join(' and ')}`, params.slice(0, params.length - 2));
    return {
      items: rows.map((r) => presentProject(r)),
      total: total?.n ?? 0,
      seeking: Object.fromEntries(SEEKING.map((k) => [k, kinds.find((x) => x.k === k)?.n ?? 0])),
      nextOffset: f.offset + rows.length < (total?.n ?? 0) ? f.offset + rows.length : null,
    };
  });

  app.get<{ Params: { slug: string } }>('/projects/:slug', async (req) => {
    const x = await loadProject(ctx.db, { slug: req.params.slug });
    const viewer = viewerOf(req);
    if (!x || (!PUBLIC.includes(x.p.status) && viewer.userId !== x.p.owner_user_id && !viewer.isAdmin)) throw notFound(L('Project not found', 'Không tìm thấy dự án'));
    const mine = viewer.userId
      ? await many<any>(ctx.db, `select id, kind, status from project_offers where project_id = $1 and user_id = $2 and status in ('sent', 'accepted') order by created_at`, [x.p.id, viewer.userId])
      : [];
    return { ...presentProject(x.p, { packages: x.packages, counts: x.counts, event: x.event, viewer }), myOffers: mine.map((o) => ({ id: o.id, kind: o.kind, status: o.status })) };
  });

  // ---- the owner -------------------------------------------------------------------------------

  app.get('/me/projects', async (req) => {
    const s = requireUser(req);
    const rows = await many<any>(ctx.db,
      `${PROJECT.replace('select p.*', `select p.*, (select count(*)::int from project_offers o where o.project_id = p.id and o.status = 'sent') as waiting`)}
        where p.owner_user_id = $1 order by p.updated_at desc limit 50`, [s.user.id]);
    return { items: rows.map((r) => ({ ...presentProject(r, { viewer: viewerOf(req) }), waiting: r.waiting })) };
  });

  app.post('/me/projects', async (req, reply) => {
    const s = requireUser(req);
    const b = parse(Create, req.body);
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      const slug = await newSlug(q, b.title);
      return one<{ id: string; slug: string }>(q,
        `insert into projects (slug, owner_user_id, title, pitch, story, city, styles, event_type, target_on, capacity, budget, raise_amount, currency, seeking, cover_url, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16) returning id, slug`,
        [slug, s.user.id, b.title, b.pitch, b.story, b.city, b.styles, b.eventType, b.targetOn, b.capacity, b.budget, b.raiseAmount,
          cityBySlug(b.city)!.currency, b.seeking, b.coverUrl, now]);
    });
    void ctx.analytics.capture('project_created', personId(s.user.id), { city: b.city });
    return reply.code(201).send({ ...(await full(row!.id, req)), message: L('Draft saved', 'Đã lưu bản nháp') });
  });

  app.get<{ Params: { id: string } }>('/me/projects/:id', async (req) => {
    const s = requireUser(req);
    const p = await ownProject(s.user.id, req.params.id);
    return full(p.id, req);
  });

  app.patch<{ Params: { id: string } }>('/me/projects/:id', async (req) => {
    const s = requireUser(req);
    const p = await ownProject(s.user.id, req.params.id);
    if (!EDITABLE.includes(p.status)) throw conflict('not_editable', L('This project can no longer be edited', 'Dự án này không còn sửa được'));
    const b = parse(Update, req.body);
    const keys = Object.keys(b).filter((k) => k in COLUMN);
    if (keys.length) {
      const set = keys.map((k, i) => `${COLUMN[k]} = $${i + 2}`);
      const values = keys.map((k) => (b as Record<string, unknown>)[k]);
      // Amounts follow the city: a project that moves city changes currency with it.
      if (b.city) { set.push(`currency = $${keys.length + 2}`); values.push(cityBySlug(b.city)!.currency); }
      await ctx.db.query(`update projects set ${set.join(', ')}, updated_at = $${values.length + 2} where id = $1`, [p.id, ...values, ctx.clock.now()]);
    }
    return full(p.id, req);
  });

  app.put<{ Params: { id: string } }>('/me/projects/:id/packages', async (req) => {
    const s = requireUser(req);
    const p = await ownProject(s.user.id, req.params.id);
    if (!EDITABLE.includes(p.status)) throw conflict('not_editable', L('This project can no longer be edited', 'Dự án này không còn sửa được'));
    const { items } = parse(z.object({ items: z.array(Package).max(8) }), req.body);
    await ctx.db.tx(async (q) => {
      await q.query('delete from project_packages where project_id = $1', [p.id]);
      for (const [i, k] of items.entries()) {
        await q.query('insert into project_packages (project_id, title, amount, perks, slots, sort) values ($1,$2,$3,$4,$5,$6)', [p.id, k.title, k.amount, k.perks, k.slots, i]);
      }
      await q.query('update projects set updated_at = $2 where id = $1', [p.id, ctx.clock.now()]);
    });
    return full(p.id, req);
  });

  /** To the team's queue. Public writing needs a confirmed phone, as every post does (guards.ts). */
  app.post<{ Params: { id: string } }>('/me/projects/:id/submit', async (req) => {
    const s = requireWriter(req);
    const p = await ownProject(s.user.id, req.params.id);
    if (p.status !== 'draft' && p.status !== 'rejected') throw conflict('not_a_draft', L('Only a draft goes to review', 'Chỉ bản nháp mới gửi duyệt được'));
    const missing = missingForReview(p);
    if (missing.length) throw badRequest('incomplete', L('Fill in what is missing first', 'Hãy điền đủ phần còn thiếu trước'), { missing });
    await ctx.db.query(`update projects set status = 'in_review', updated_at = $2 where id = $1`, [p.id, ctx.clock.now()]);
    return { ...(await full(p.id, req)), message: L('Sent for review. The team usually answers within a day.', 'Đã gửi duyệt. Đội ngũ thường trả lời trong một ngày.') };
  });

  app.post<{ Params: { id: string } }>('/me/projects/:id/close', async (req) => {
    const s = requireUser(req);
    const p = await ownProject(s.user.id, req.params.id);
    if (p.status !== 'open') throw conflict('not_open', L('Only an open project closes', 'Chỉ dự án đang mở mới đóng được'));
    await ctx.db.query(`update projects set status = 'closed', updated_at = $2 where id = $1`, [p.id, ctx.clock.now()]);
    return full(p.id, req);
  });

  /**
   * The night happened (or is listed): the project points at its event, which then shows the
   * accepted sponsors. The owner links an event of an organiser they belong to.
   */
  app.post<{ Params: { id: string } }>('/me/projects/:id/event', async (req) => {
    const s = requireUser(req);
    const p = await ownProject(s.user.id, req.params.id);
    if (p.status !== 'open' && p.status !== 'closed' && p.status !== 'realized') throw conflict('not_public', L('Link an event once the project is approved', 'Gắn sự kiện sau khi dự án được duyệt'));
    const { slug } = parse(z.object({ slug: z.string().max(120) }), req.body);
    const ev = await one<{ id: string; title: string }>(ctx.db,
      `select e.id, e.title from events e join organizer_members m on m.organizer_id = e.organizer_id
        where e.slug = $1 and m.user_id = $2 and e.status in ('live', 'in_review', 'draft')`, [slug, s.user.id]);
    if (!ev) throw notFound(L('No event of yours with that address', 'Không có sự kiện nào của bạn ở địa chỉ đó'));
    await ctx.db.query(`update projects set status = 'realized', event_id = $2, updated_at = $3 where id = $1`, [p.id, ev.id, ctx.clock.now()]);
    return full(p.id, req);
  });

  app.get<{ Params: { id: string } }>('/me/projects/:id/offers', async (req) => {
    const s = requireUser(req);
    const p = await ownProject(s.user.id, req.params.id);
    const rows = await many<any>(ctx.db,
      `select o.*, u.name as user_name, u.email as user_email, u.phone as user_phone, a.slug as artist_slug, a.name as artist_name, k.title as package_title
         from project_offers o join users u on u.id = o.user_id left join artists a on a.id = o.artist_id left join project_packages k on k.id = o.package_id
        where o.project_id = $1 and o.status <> 'withdrawn' order by o.status = 'sent' desc, o.created_at desc`, [p.id]);
    return {
      items: rows.map((o) => ({
        id: o.id, kind: o.kind, kindLabel: OFFER_LABEL[o.kind as OfferKind], status: o.status, message: o.message, createdAt: o.created_at,
        from: o.org_name || o.artist_name || o.user_name || null,
        person: o.user_name, orgName: o.org_name || null,
        artist: o.artist_slug ? { slug: o.artist_slug, name: o.artist_name } : null,
        package: o.package_title, amount: o.amount == null ? null : Number(o.amount), currency: p.currency,
        // Only an accepted offer shows how to reach the person.
        contact: o.status === 'accepted' ? { email: o.user_email, phone: o.user_phone } : null,
      })),
    };
  });

  app.post<{ Params: { id: string; offerId: string } }>('/me/projects/:id/offers/:offerId', async (req) => {
    const s = requireUser(req);
    const p = await ownProject(s.user.id, req.params.id);
    const { accept } = parse(z.object({ accept: z.boolean() }), req.body);
    const now = ctx.clock.now();
    const o = await one<any>(ctx.db, `select * from project_offers where id = $1 and project_id = $2`, [parse(uuid, req.params.offerId), p.id]);
    if (!o || o.status === 'withdrawn') throw notFound(L('Offer not found', 'Không tìm thấy đề nghị'));
    if (o.status !== 'sent') throw conflict('already_decided', L('This offer was already answered', 'Đề nghị này đã được trả lời'));
    const owner = await contactOf(s.user.id);
    await ctx.db.tx(async (q) => {
      await q.query(`update project_offers set status = $2, decided_at = $3 where id = $1`, [o.id, accept ? 'accepted' : 'declined', now]);
      const reach = [owner?.email, owner?.phone].filter(Boolean).join(' · ');
      await notifyUser(q, now, {
        userId: o.user_id, topic: null, kind: 'project_offer',
        title: accept ? L(`${p.title}: your offer was accepted`, `${p.title}: đề nghị của bạn đã được nhận`) : L(`${p.title}: your offer was declined`, `${p.title}: đề nghị của bạn chưa được nhận`),
        body: accept
          ? L(`Reach ${owner?.name || 'the owner'}${reach ? ` at ${reach}` : ''} to agree the rest. FeestFinder never handles the money.`, `Liên hệ ${owner?.name || 'chủ dự án'}${reach ? ` qua ${reach}` : ''} để thoả thuận tiếp. FeestFinder không xử lý tiền.`)
          : L('Thank you for offering. Other projects may need you.', 'Cảm ơn bạn đã đề nghị. Các dự án khác có thể cần bạn.'),
        link: { url: `/p/${p.slug}` },
      });
    });
    return { id: o.id, status: accept ? 'accepted' : 'declined', message: accept ? L('Accepted: you can now see how to reach them', 'Đã nhận: giờ bạn thấy cách liên hệ') : L('Declined', 'Đã từ chối') };
  });

  // ---- people who offer ------------------------------------------------------------------------

  app.post<{ Params: { slug: string } }>('/projects/:slug/offers', async (req, reply) => {
    const s = requireUser(req);
    const b = parse(Offer, req.body);
    const p = await one<any>(ctx.db, `${PROJECT} where p.slug = $1`, [req.params.slug]);
    if (!p || !PUBLIC.includes(p.status)) throw notFound(L('Project not found', 'Không tìm thấy dự án'));
    if (p.status !== 'open') throw conflict('project_closed', L('This project takes no more offers', 'Dự án này không nhận thêm đề nghị'));
    if (p.owner_user_id === s.user.id) throw forbidden('own_project', L('This is your own project', 'Đây là dự án của bạn'));
    if (!p.seeking.includes(ANSWERS[b.kind] as Seeking)) throw badRequest('not_needed', L('The project does not ask for that', 'Dự án không cần điều này'));
    // A performer offers as their own artist profile, with that craft on.
    let artistId: string | null = null;
    if (b.kind === 'perform') {
      const a = await one<{ id: string }>(ctx.db,
        `select a.id from artists a join user_roles r on r.user_id = a.owner_user_id and r.role = 'artist' and r.status = 'active' where a.owner_user_id = $1`, [s.user.id]);
      if (!a) throw forbidden('no_artist', L('Offer to perform from your artist profile', 'Hãy đề nghị biểu diễn bằng hồ sơ nghệ sĩ của bạn'));
      artistId = a.id;
    }
    if ((b.kind === 'sponsor' || b.kind === 'venue') && b.orgName.length < 2) throw badRequest('org_name', L('Name the brand or the venue', 'Hãy ghi tên thương hiệu hoặc địa điểm'));
    if (b.packageId && !(await one(ctx.db, 'select 1 from project_packages where id = $1 and project_id = $2', [b.packageId, p.id]))) throw badRequest('package', L('No such package', 'Không có gói này'));
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      const r = await one<{ id: string }>(q,
        `insert into project_offers (project_id, user_id, kind, org_name, artist_id, package_id, amount, message, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (project_id, user_id, kind) where status in ('sent', 'accepted') do nothing returning id`,
        [p.id, s.user.id, b.kind, b.orgName || null, artistId, b.packageId, b.amount, b.message, now]);
      if (!r) throw conflict('offer_exists', L('You already made this offer', 'Bạn đã gửi đề nghị này rồi'));
      await notifyUser(q, now, {
        userId: p.owner_user_id, topic: null, kind: 'project_offer',
        title: L(`${p.title}: a new offer to ${OFFER_LABEL[b.kind].en.toLowerCase()}`, `${p.title}: có đề nghị ${OFFER_LABEL[b.kind].vi.toLowerCase()} mới`),
        body: L('Open the project to accept or decline it.', 'Mở dự án để nhận hoặc từ chối.'),
        link: { url: `/p/${p.slug}/manage` },
      });
      return r;
    });
    void ctx.analytics.capture('project_offer_sent', personId(s.user.id), { kind: b.kind, city: p.city });
    return reply.code(201).send({ id: row.id, message: L('Offer sent. You hear back here when the owner answers.', 'Đã gửi đề nghị. Bạn sẽ nhận thông báo khi chủ dự án trả lời.') });
  });

  app.get('/me/offers', async (req) => {
    const s = requireUser(req);
    const rows = await many<any>(ctx.db,
      `select o.*, p.slug, p.title, p.currency, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
         from project_offers o join projects p on p.id = o.project_id join users u on u.id = p.owner_user_id
        where o.user_id = $1 order by o.created_at desc limit 100`, [s.user.id]);
    return {
      items: rows.map((o) => ({
        id: o.id, kind: o.kind, kindLabel: OFFER_LABEL[o.kind as OfferKind], status: o.status, createdAt: o.created_at,
        amount: o.amount == null ? null : Number(o.amount), currency: o.currency,
        project: { slug: o.slug, title: o.title },
        contact: o.status === 'accepted' ? { name: o.owner_name, email: o.owner_email, phone: o.owner_phone } : null,
      })),
    };
  });

  app.post<{ Params: { id: string } }>('/me/offers/:id/withdraw', async (req) => {
    const s = requireUser(req);
    const out = await ctx.db.query(`update project_offers set status = 'withdrawn', decided_at = $3 where id = $1 and user_id = $2 and status = 'sent' returning id`,
      [parse(uuid, req.params.id), s.user.id, ctx.clock.now()]);
    if (!out.rows.length) throw notFound(L('No offer waiting with that id', 'Không có đề nghị đang chờ với mã này'));
    return { id: req.params.id, status: 'withdrawn', message: L('Offer withdrawn', 'Đã rút đề nghị') };
  });

  // ---- the team --------------------------------------------------------------------------------

  app.get('/admin/projects', async (req) => {
    requireAdmin(req);
    const { status } = parse(z.object({ status: z.enum(['in_review', 'open', 'closed', 'realized', 'rejected', 'draft']).default('in_review') }), req.query);
    const [rows, counts] = await Promise.all([
      many<any>(ctx.db,
        `${PROJECT.replace('select p.*, u.name as owner_name', `select p.*, u.name as owner_name, u.email as owner_email,
            (select count(*)::int from project_offers o where o.project_id = p.id and o.status in ('sent', 'accepted')) as offers`)}
          where p.status = $1 order by p.updated_at ${status === 'in_review' ? 'asc' : 'desc'} limit 200`, [status]),
      many<{ status: string; n: number }>(ctx.db, 'select status, count(*)::int as n from projects group by status'),
    ]);
    return {
      items: rows.map((r) => ({ ...presentProject(r, { viewer: { userId: null, isAdmin: true } }), ownerEmail: r.owner_email, offers: r.offers })),
      counts: Object.fromEntries(counts.map((c) => [c.status, c.n])),
    };
  });

  app.post<{ Params: { id: string } }>('/admin/projects/:id/decision', async (req) => {
    const s = requireAdmin(req);
    const b = parse(z.object({ action: z.enum(['approve', 'reject', 'close']), note: z.string().trim().max(1000).default('') }), req.body);
    const p = await one<any>(ctx.db, `${PROJECT} where p.id = $1`, [parse(uuid, req.params.id)]);
    if (!p) throw notFound(L('Project not found', 'Không tìm thấy dự án'));
    const from = { approve: ['in_review'], reject: ['in_review'], close: ['open'] }[b.action];
    if (!from.includes(p.status)) throw conflict('wrong_status', L('This project is not in a state for that', 'Dự án không ở trạng thái phù hợp'));
    if (b.action === 'reject' && !b.note) throw badRequest('note_required', L('Say why, for the owner', 'Hãy ghi lý do cho chủ dự án'));
    const now = ctx.clock.now();
    const status = { approve: 'open', reject: 'rejected', close: 'closed' }[b.action];
    await ctx.db.tx(async (q) => {
      await q.query(
        `update projects set status = $2, decision_note = $3, decided_by = $4, decided_at = $5, updated_at = $5,
                published_at = case when $2 = 'open' then coalesce(published_at, $5) else published_at end where id = $1`,
        [p.id, status, b.note || null, s.user.id, now]);
      await appendAudit(q, {
        at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: `project.${b.action === 'approve' ? 'approved' : b.action === 'reject' ? 'rejected' : 'closed'}`,
        targetType: 'project', targetId: p.id, targetLabel: p.title, diff: [{ f: 'status', a: p.status, b: status }],
      });
      await notifyUser(q, now, {
        userId: p.owner_user_id, topic: null, kind: 'project_review',
        title: b.action === 'approve' ? L(`${p.title} is public`, `${p.title} đã được đăng`) : b.action === 'reject' ? L(`${p.title} needs changes`, `${p.title} cần chỉnh sửa`) : L(`${p.title} was closed by the team`, `${p.title} đã được đội ngũ đóng lại`),
        body: b.note ? L(b.note, b.note) : L('People can now offer to take part.', 'Mọi người giờ có thể đề nghị tham gia.'),
        link: { url: b.action === 'approve' ? `/p/${p.slug}` : `/p/${p.slug}/manage` },
      });
    });
    return { id: p.id, status, message: b.action === 'approve' ? L('Approved: the project is public', 'Đã duyệt: dự án đã công khai') : b.action === 'reject' ? L('Sent back to the owner', 'Đã gửi lại chủ dự án') : L('Closed', 'Đã đóng') };
  });
}
