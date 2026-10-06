import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { slugify } from '../../lib/contact.ts';
import { randomToken, sha256 } from '../../lib/crypto.ts';
import { limit, parse, uuid } from '../../lib/validate.ts';
import { requireAdmin } from '../../http/guards.ts';
import { appendAudit } from '../../services/audit.ts';
import { CONVERSION_STATUS, normalizeHost, partnerLink } from '../../services/partners.ts';

/*
 * The team's ticket partners: which sites they sell on, how a link to them is tracked, what
 * a sale earns, and what each one has reported. The postback token is shown once, when it is
 * made; only its hash is kept.
 */

const HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

const fields = {
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,40}$/),
  hosts: z.array(z.string().max(120)).max(20).transform((hs) => [...new Set(hs.map(normalizeHost).filter((h) => HOST.test(h)))]),
  linkTemplate: z.string().trim().max(1000).nullable().transform((v) => v || null)
    .refine((v) => !v || (/^https:\/\/\S+$/.test(v) && v.includes('{url}')), 'An https link containing {url}'),
  linkParams: z.record(z.string().regex(/^[A-Za-z0-9_.-]{1,40}$/), z.string().max(200)),
  commissionPct: z.coerce.number().min(0).max(100),
  enabled: z.boolean(),
  notes: z.string().max(2000),
};
const CreateInput = z.object({
  ...fields,
  slug: fields.slug.optional(),
  hosts: fields.hosts.default([]),
  linkTemplate: fields.linkTemplate.optional().default(null),
  linkParams: fields.linkParams.default({}),
  commissionPct: fields.commissionPct.default(0),
  enabled: fields.enabled.default(true),
  notes: fields.notes.default(''),
});
const UpdateInput = z.object(fields).partial();

const COLUMN: Record<string, string> = {
  name: 'name', slug: 'slug', hosts: 'hosts', linkTemplate: 'link_template', linkParams: 'link_params', commissionPct: 'commission_pct', enabled: 'enabled', notes: 'notes',
};

export default async function adminPartnerRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const base = () => ctx.config.publicBaseUrl.replace(/\/$/, '');

  const present = async (p: any) => {
    const since = new Date(ctx.clock.now().getTime() - 30 * 86400_000);
    const [clicks, totals] = await Promise.all([
      one<{ n: number }>(ctx.db, 'select count(*)::int as n from outbound_clicks where partner_id = $1 and created_at >= $2', [p.id, since]),
      many<any>(ctx.db,
        `select currency, count(*)::int as orders,
                coalesce(sum(amount) filter (where status in ('approved', 'paid')), 0)::bigint as sales,
                coalesce(sum(commission) filter (where status in ('approved', 'paid')), 0)::bigint as earned,
                coalesce(sum(commission) filter (where status = 'pending'), 0)::bigint as pending
           from partner_conversions where partner_id = $1 group by currency order by orders desc`, [p.id]),
    ]);
    return {
      id: p.id, slug: p.slug, name: p.name, hosts: p.hosts, linkTemplate: p.link_template, linkParams: p.link_params,
      commissionPct: Number(p.commission_pct), enabled: p.enabled, notes: p.notes, hasToken: !!p.postback_token_hash, createdAt: p.created_at,
      // What to give the partner: their own macros go where the braces are.
      postbackUrl: `${base()}/partners/${p.slug}/postback?token=TOKEN&order={order_id}&amount={sale_amount}&currency=VND&status={status}&click={sub1}`,
      example: partnerLink('https://tickets.example/event', { link_template: p.link_template, link_params: p.link_params }, 'CLICK-ID'),
      clicks30: clicks!.n,
      totals: totals.map((t) => ({ currency: t.currency, orders: t.orders, sales: Number(t.sales), earned: Number(t.earned), pending: Number(t.pending) })),
    };
  };
  const row = (id: string) => one<any>(ctx.db, 'select * from ticket_partners where id = $1', [id]);
  const audit = (s: { user: { id: string; name: string | null } }, action: string, p: { id: string; name: string }, diff: { f: string; a: string; b: string }[]) =>
    appendAudit(ctx.db, {
      at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action,
      targetType: 'ticket_partner', targetId: p.id, targetLabel: p.name, diff,
    });

  app.get('/admin/partners', async (req) => {
    requireAdmin(req);
    const rows = await many<any>(ctx.db, 'select * from ticket_partners order by enabled desc, name');
    const since = new Date(ctx.clock.now().getTime() - 30 * 86400_000);
    // Where ticket buttons sent people in the last 30 days, partner or not.
    const outbound = await many<any>(ctx.db,
      `select target, count(*)::int as n from outbound_clicks where created_at >= $1 group by target`, [since]);
    const unclaimed = await many<any>(ctx.db,
      `select target_host as host, count(*)::int as n from outbound_clicks
        where created_at >= $1 and target = 'organizer' and target_host is not null group by target_host order by n desc limit 10`, [since]);
    return {
      items: await Promise.all(rows.map(present)),
      outbound: Object.fromEntries(outbound.map((o) => [o.target, o.n])),
      // Sites people buy on that no partner covers yet: who to talk to next.
      topUncovered: unclaimed,
      statuses: CONVERSION_STATUS,
    };
  });

  app.post('/admin/partners', async (req, reply) => {
    const s = requireAdmin(req);
    const b = parse(CreateInput, req.body);
    const slug = b.slug ?? (slugify(b.name).slice(0, 40) || 'partner');
    if (await one(ctx.db, 'select 1 from ticket_partners where slug = $1', [slug])) {
      throw conflict('slug_taken', L('Another partner has this short name', 'Đã có đối tác dùng tên ngắn này'));
    }
    const token = randomToken(24);
    const p = await one<any>(ctx.db,
      `insert into ticket_partners (slug, name, hosts, link_template, link_params, commission_pct, enabled, notes, postback_token_hash)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
      [slug, b.name, b.hosts, b.linkTemplate, json(b.linkParams), b.commissionPct, b.enabled, b.notes, sha256(token)]);
    await audit(s, 'partner.created', p, [{ f: 'hosts', a: '—', b: b.hosts.join(', ') || '—' }]);
    return reply.code(201).send({ ...(await present(p)), token });
  });

  app.patch<{ Params: { id: string } }>('/admin/partners/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const before = await row(id);
    if (!before) throw notFound();
    const b = parse(UpdateInput, req.body);
    const keys = Object.keys(b).filter((k) => (b as any)[k] !== undefined);
    if (!keys.length) throw badRequest('nothing_to_change', L('Nothing to change', 'Không có gì để thay đổi'));
    if (b.slug && b.slug !== before.slug && await one(ctx.db, 'select 1 from ticket_partners where slug = $1', [b.slug])) {
      throw conflict('slug_taken', L('Another partner has this short name', 'Đã có đối tác dùng tên ngắn này'));
    }
    const values = keys.map((k) => (k === 'linkParams' ? json((b as any)[k]) : (b as any)[k]));
    const sets = keys.map((k, i) => `${COLUMN[k]} = $${i + 2}`);
    const p = await one<any>(ctx.db, `update ticket_partners set ${sets.join(', ')}, updated_at = now() where id = $1 returning *`, [id, ...values]);
    await audit(s, 'partner.updated', p, keys.map((k) => ({ f: k, a: JSON.stringify(before[COLUMN[k]] ?? null).slice(0, 80), b: JSON.stringify((b as any)[k] ?? null).slice(0, 80) })));
    return present(p);
  });

  /** A new postback token; the old one stops working. */
  app.post<{ Params: { id: string } }>('/admin/partners/:id/token', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const p = await row(id);
    if (!p) throw notFound();
    const token = randomToken(24);
    await ctx.db.query('update ticket_partners set postback_token_hash = $2, updated_at = now() where id = $1', [id, sha256(token)]);
    await audit(s, 'partner.token_rotated', p, [{ f: 'token', a: '•••', b: '•••' }]);
    return { token, message: L('New token made. The old one no longer works.', 'Đã tạo mã mới. Mã cũ không còn dùng được.') };
  });

  app.get<{ Params: { id: string } }>('/admin/partners/:id/conversions', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const { status, limit: max } = parse(z.object({ status: z.enum(CONVERSION_STATUS).optional(), limit: limit(200, 50) }), req.query);
    const rows = await many<any>(ctx.db,
      `select c.*, e.slug as event_slug, e.title as event_title from partner_conversions c left join events e on e.id = c.event_id
        where c.partner_id = $1 ${status ? 'and c.status = $3' : ''} order by c.occurred_at desc limit $2`, status ? [id, max, status] : [id, max]);
    const top = await many<any>(ctx.db,
      `select e.id, e.slug, e.title, count(*)::int as clicks from outbound_clicks k join events e on e.id = k.event_id
        where k.partner_id = $1 and k.created_at >= $2 group by e.id order by clicks desc limit 10`,
      [id, new Date(ctx.clock.now().getTime() - 30 * 86400_000)]);
    return {
      items: rows.map((c) => ({
        id: c.id, orderRef: c.order_ref, amount: Number(c.amount), currency: c.currency, commission: Number(c.commission), status: c.status,
        occurredAt: c.occurred_at, receivedAt: c.received_at, matchedClick: !!c.click_id,
        event: c.event_id ? { id: c.event_id, slug: c.event_slug, title: c.event_title } : null,
      })),
      topEvents: top,
    };
  });

  /** The team settles a sale: approved by the partner's report, paid when the money arrives. */
  app.patch<{ Params: { id: string } }>('/admin/conversions/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const b = parse(z.object({ status: z.enum(CONVERSION_STATUS) }), req.body);
    const c = await one<any>(ctx.db,
      `select c.id, c.status, c.order_ref, p.id as partner_id, p.name as partner_name from partner_conversions c join ticket_partners p on p.id = c.partner_id where c.id = $1`, [id]);
    if (!c) throw notFound();
    await ctx.db.query('update partner_conversions set status = $2 where id = $1', [id, b.status]);
    await audit(s, 'partner.conversion_status', { id: c.partner_id, name: c.partner_name }, [{ f: `order ${c.order_ref}`, a: c.status, b: b.status }]);
    return { id, status: b.status };
  });
}
