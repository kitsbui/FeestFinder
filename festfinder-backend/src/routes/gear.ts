import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { badRequest, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { GEAR_CATEGORY, GEAR_USE } from '../lib/network.ts';
import { limit, parse, uuid } from '../lib/validate.ts';
import { requireAdmin, requireUser } from '../http/guards.ts';
import { appendAudit } from '../services/audit.ts';
import { ensureGear, gearOf, presentGear, searchGear } from '../services/gear.ts';

/*
 * Gear and software (services/gear.ts).
 *
 *   GET   /gear?q=&category=           the approved catalogue
 *   GET   /me/artist/gear              what the artist uses, waiting items included
 *   PUT   /me/artist/gear              replaces it: catalogue ids, or a new name that waits for the team
 *   GET   /admin/gear?pending=1        the catalogue, suggestions first
 *   PATCH /admin/gear/:id              approve, rename, recategorise, attach an affiliate link
 */

const category = z.enum(GEAR_CATEGORY.keys as [string, ...string[]]);
const usedFor = z.enum(GEAR_USE.keys as [string, ...string[]]);

const GearList = z.object({
  items: z.array(z.union([
    z.object({ gearId: uuid, usedFor: usedFor.default('both') }),
    z.object({ name: z.string().trim().min(2).max(80), brand: z.string().trim().max(60).default(''), category, usedFor: usedFor.default('both') }),
  ])).max(30),
});

export default async function gearRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const base = () => ctx.config.publicBaseUrl.replace(/\/$/, '');

  app.get('/gear', async (req) => {
    const f = parse(z.object({ q: z.string().trim().max(80).optional(), category: category.optional(), limit: limit(100, 40) }), req.query);
    const rows = await searchGear(ctx.db, f);
    return { items: rows.map((g) => presentGear(g, base())), categories: GEAR_CATEGORY.keys.map((k) => ({ key: k, label: GEAR_CATEGORY.label[k as keyof typeof GEAR_CATEGORY.label] })) };
  });

  const ownArtist = async (userId: string) => {
    const a = await one<{ id: string }>(ctx.db, 'select id from artists where owner_user_id = $1', [userId]);
    if (!a) throw notFound(L('You have no artist profile yet', 'Bạn chưa có hồ sơ nghệ sĩ'));
    return a;
  };

  app.get('/me/artist/gear', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    return { items: (await gearOf(ctx.db, a.id, { includePending: true })).map((g) => presentGear(g, base())) };
  });

  app.put('/me/artist/gear', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const b = parse(GearList, req.body);
    await ctx.db.tx(async (q) => {
      const ids: { id: string; usedFor: string }[] = [];
      for (const it of b.items) {
        if ('gearId' in it) {
          if (!(await one(q, 'select 1 from gear_items where id = $1', [it.gearId]))) throw badRequest('unknown_gear', L('That item is not in the catalogue', 'Không có món này trong danh mục'));
          ids.push({ id: it.gearId, usedFor: it.usedFor });
        } else {
          ids.push({ id: await ensureGear(q, { name: it.name, brand: it.brand, category: it.category as any }, s.user.id), usedFor: it.usedFor });
        }
      }
      await q.query('delete from artist_gear where artist_id = $1', [a.id]);
      const seen = new Set<string>();
      for (const [i, x] of ids.entries()) {
        if (seen.has(x.id)) continue;
        seen.add(x.id);
        await q.query('insert into artist_gear (artist_id, gear_id, used_for, position) values ($1,$2,$3,$4)', [a.id, x.id, x.usedFor, i]);
      }
    });
    return { items: (await gearOf(ctx.db, a.id, { includePending: true })).map((g) => presentGear(g, base())), message: L('Gear saved', 'Đã lưu thiết bị') };
  });

  app.get('/admin/gear', async (req) => {
    requireAdmin(req);
    const { pending } = parse(z.object({ pending: z.enum(['0', '1']).default('0') }), req.query);
    const rows = await many<any>(ctx.db,
      `select g.*, l.code as link_code, u.email as suggested_by_email, (select count(*)::int from artist_gear ag where ag.gear_id = g.id) as artists
         from gear_items g left join affiliate_links l on l.id = g.affiliate_link_id left join users u on u.id = g.suggested_by
        where ($1 = '0' or not g.approved) order by g.approved, artists desc, g.name limit 500`, [pending]);
    return {
      items: rows.map((g) => ({ ...presentGear(g, base()), artists: g.artists, website: g.website, affiliateLinkId: g.affiliate_link_id, linkCode: g.link_code, suggestedBy: g.suggested_by_email })),
      categories: GEAR_CATEGORY.keys,
    };
  });

  app.patch<{ Params: { id: string } }>('/admin/gear/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const b = parse(z.object({
      approved: z.boolean(), name: z.string().trim().min(2).max(80), brand: z.string().trim().max(60), category,
      website: z.string().url().max(500).refine((u) => u.startsWith('https://'), 'An https link').nullable(),
      affiliateLinkId: uuid.nullable(),
    }).partial(), req.body);
    const before = await one<any>(ctx.db, 'select * from gear_items where id = $1', [id]);
    if (!before) throw notFound();
    const map: Record<string, string> = { approved: 'approved', name: 'name', brand: 'brand', category: 'category', website: 'website', affiliateLinkId: 'affiliate_link_id' };
    const keys = Object.keys(map).filter((k) => (b as any)[k] !== undefined);
    if (!keys.length) throw badRequest('nothing_to_change', L('Nothing to change', 'Không có gì để thay đổi'));
    await ctx.db.query(`update gear_items set ${keys.map((k, i) => `${map[k]} = $${i + 2}`).join(', ')} where id = $1`, [id, ...keys.map((k) => (b as any)[k])]);
    await appendAudit(ctx.db, {
      at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'gear.edited_by_team',
      targetType: 'gear', targetId: id, targetLabel: before.name, diff: keys.map((k) => ({ f: k, a: JSON.stringify(before[map[k]] ?? null).slice(0, 80), b: JSON.stringify((b as any)[k] ?? null).slice(0, 80) })),
    });
    return { ok: true };
  });
}
