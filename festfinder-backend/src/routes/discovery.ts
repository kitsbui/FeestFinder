import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one } from '../db/index.ts';
import { badRequest } from '../lib/errors.ts';
import { GENRES, L } from '../lib/i18n.ts';
import { isEmail, normalizeEmail } from '../lib/contact.ts';
import { vnDate } from '../lib/time.ts';
import { parse, uuid } from '../lib/validate.ts';
import { requireUser } from '../http/guards.ts';
import { SqlParams } from '../http/sql.ts';

export default async function discoveryRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- sponsored placements -------------------------------------------------

  app.get('/ads', async (req) => {
    const f = parse(z.object({
      placement: z.enum(['feed', 'banner', 'live']),
      genre: z.enum(GENRES).optional(),
      area: z.string().max(60).optional(),
    }), req.query);
    const user = req.session?.user ? await one<any>(ctx.db, 'select id, birth_year from users where id = $1', [req.session.user.id]) : null;
    const year = Number(vnDate(ctx.clock.now()).slice(0, 4));
    // Alcohol ads only reach accounts we know are 18+.
    const adultKnown = !!user?.birth_year && year - user.birth_year >= 18;
    const sql = new SqlParams();
    const where = [`c.active`, `c.placement = ${sql.p(f.placement)}`, `(c.budget_total = 0 or c.spend < c.budget_total)`];
    if (!adultKnown) where.push('not c.is_alcohol');
    if (user) where.push(`not exists (select 1 from ad_hides h where h.campaign_id = c.id and h.user_id = ${sql.p(user.id)})`);
    where.push(f.genre ? `(cardinality(c.genres) = 0 or ${sql.p(f.genre)} = any(c.genres))` : 'true');
    where.push(f.area ? `(cardinality(c.areas) = 0 or ${sql.p(f.area)} = any(c.areas))` : 'true');
    const ad = await one<any>(ctx.db,
      `select c.* from ad_campaigns c where ${where.join(' and ')}
        order by case when c.budget_total > 0 then c.spend::float / c.budget_total else 0 end, random() limit 1`, sql.values);
    if (!ad) return { ad: null };
    return {
      ad: {
        id: ad.id, brand: ad.brand, category: ad.category, logo: ad.logo, art: ad.art, placement: ad.placement,
        headline: ad.headline, body: ad.body, cta: ad.cta, url: ad.url,
        sponsoredLabel: L('Sponsored', 'Được tài trợ'),
        why: L('Shown because of the events you are browsing. We never use your saved events or personal data for ads.',
          'Hiện vì các sự kiện bạn đang xem. Chúng tôi không dùng sự kiện đã lưu hay dữ liệu cá nhân của bạn cho quảng cáo.'),
      },
    };
  });

  /** The CPM rates the advertising page shows, as the team set them in the Console. */
  app.get('/ads/rates', async (_req, reply) => {
    const rates = (await one<{ rates: Record<string, number> }>(ctx.db, 'select rates from ad_settings where id = 1'))!.rates;
    reply.header('cache-control', 'public, max-age=300');
    return { rates: { feed: rates.feed, banner: rates.banner, live: rates.live }, currency: 'VND' };
  });

  app.post<{ Params: { id: string } }>('/ads/:id/impression', async (req, reply) => {
    const id = parse(uuid, req.params.id);
    const rates = (await one<any>(ctx.db, 'select rates from ad_settings where id = 1'))!.rates;
    await ctx.db.query(
      `update ad_campaigns set impressions = impressions + 1, spend = spend + ($2::jsonb ->> placement)::bigint / 1000 where id = $1 and active`,
      [id, JSON.stringify(rates)]);
    return reply.code(202).send({ ok: true });
  });

  app.post<{ Params: { id: string } }>('/ads/:id/click', async (req, reply) => {
    await ctx.db.query('update ad_campaigns set clicks = clicks + 1 where id = $1', [parse(uuid, req.params.id)]);
    return reply.code(202).send({ ok: true });
  });

  app.post<{ Params: { id: string } }>('/ads/:id/hide', async (req) => {
    const s = requireUser(req);
    await ctx.db.query('insert into ad_hides (user_id, campaign_id) values ($1,$2) on conflict do nothing', [s.user.id, parse(uuid, req.params.id)]);
    return { ok: true, message: L('Hidden. You will see fewer ads like this.', 'Đã ẩn. Bạn sẽ ít thấy quảng cáo như này hơn.') };
  });

  /** "Advertise" form on the web. */
  app.post('/ad-inquiries', async (req, reply) => {
    const s = requireUser(req);
    const body = parse(z.object({
      brand: z.string().max(80),
      category: z.enum(['F&B', 'Fashion', 'Healthcare']),
      email: z.string().max(200),
      budget: z.enum(['Dưới 50tr₫', '50–150tr₫', '150–400tr₫', '400tr₫+']),
      placements: z.array(z.enum(['feed', 'banner', 'live'])).min(1),
      message: z.string().max(2000).default(''),
    }), req.body);
    if (!body.brand.trim()) throw badRequest('brand_required', L('Add your brand name', 'Nhập tên thương hiệu'));
    if (!isEmail(body.email)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
    await ctx.db.query(
      `insert into ad_inquiries (user_id, brand, category, email, budget, placements, message) values ($1,$2,$3,$4,$5,$6,$7)`,
      [s.user.id, body.brand.trim(), body.category, normalizeEmail(body.email), body.budget, body.placements, body.message.trim()]);
    return reply.code(201).send({
      ok: true,
      message: L('Thanks — our partnerships team replies within two working days.', 'Cảm ơn — đội đối tác sẽ phản hồi trong hai ngày làm việc.'),
    });
  });
}
