import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { json, many, one } from '../db/index.ts';
import { badRequest } from '../lib/errors.ts';
import { GENRES, L } from '../lib/i18n.ts';
import { isEmail, normalizeEmail } from '../lib/contact.ts';
import { vnDate } from '../lib/time.ts';
import { dateStr, parse, uuid } from '../lib/validate.ts';
import { citySlug, cityLabel } from '../lib/places.ts';
import { AD_CATEGORIES, AD_CATEGORY_LABEL, AD_CURRENCY, BRAND_AD_PLACEMENT_LABEL, BRAND_AD_PLACEMENTS, BRAND_LINKS, type AdCategory, type BrandAdPlacement } from '../lib/ads.ts';
import { requireUser } from '../http/guards.ts';
import { imageChange } from '../services/remote-images.ts';
import { notifyAdmins } from '../services/notify.ts';
import { SqlParams } from '../http/sql.ts';

export default async function discoveryRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- sponsored placements -------------------------------------------------

  app.get('/ads', async (req) => {
    const f = parse(z.object({
      placement: z.enum(['feed', 'banner', 'live']),
      genre: z.enum(GENRES).optional(),
      area: z.string().max(60).optional(),
      city: citySlug.optional(),
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
    where.push(f.city ? `(cardinality(c.cities) = 0 or ${sql.p(f.city)} = any(c.cities))` : 'true');
    // Inside the campaign's dates, when it has them (Vietnam's day: the rate card is sold there).
    const today = sql.p(vnDate(ctx.clock.now()));
    where.push(`(c.starts_on is null or c.starts_on <= ${today}::date) and (c.ends_on is null or c.ends_on >= ${today}::date)`);
    const ad = await one<any>(ctx.db,
      `select c.* from ad_campaigns c where ${where.join(' and ')}
        order by case when c.budget_total > 0 then c.spend::float / c.budget_total else 0 end, random() limit 1`, sql.values);
    if (!ad) return { ad: null };
    return {
      ad: {
        id: ad.id, brand: ad.brand, category: ad.category, logo: ad.logo, logoUrl: ad.logo_url as string | null, image: (ad.images?.[0] ?? null) as string | null,
        art: ad.art, placement: ad.placement, headline: ad.headline, body: ad.body, cta: ad.cta, url: ad.url,
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

  /**
   * The advertising form on the web (/advertise): the brand (name, logo, website and social pages,
   * what it sells, product images and a description), a contact, the budget, the dates, the
   * placements and cities wanted. Pictures are links, checked like every other one
   * (services/remote-images.ts). Every admin is told; the team answers in the Console.
   */
  app.post('/ad-inquiries', async (req, reply) => {
    const s = requireUser(req);
    const body = parse(z.object({
      brand: z.string().trim().min(1).max(80),
      category: z.enum(AD_CATEGORIES),
      logoUrl: z.string().max(2048).nullable().optional(),
      website: z.string().url().max(500).nullable().optional(),
      links: z.partialRecord(z.enum(BRAND_LINKS), z.string().url().max(500)).default({}),
      description: z.string().trim().max(2000).default(''),
      productImages: z.array(z.string().max(2048)).max(4).default([]),
      contactName: z.string().trim().min(1).max(80),
      email: z.string().max(200),
      phone: z.string().trim().max(30).optional(),
      budgetAmount: z.number().int().min(1_000_000).max(100_000_000_000),
      startsOn: dateStr,
      endsOn: dateStr,
      placements: z.array(z.enum(BRAND_AD_PLACEMENTS)).min(1),
      cities: z.array(citySlug).max(20).default([]),
      isAlcohol: z.boolean().default(false),
      message: z.string().max(2000).default(''),
    }), req.body);
    if (!isEmail(body.email)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
    if (body.endsOn < body.startsOn) throw badRequest('dates_order', L('The end date is before the start date', 'Ngày kết thúc trước ngày bắt đầu'));
    if (body.startsOn < vnDate(ctx.clock.now())) throw badRequest('starts_in_past', L('Start today or later', 'Hãy bắt đầu từ hôm nay trở đi'));
    if (!body.website && !Object.keys(body.links).length) throw badRequest('link_required', L('Add your website or a social page', 'Thêm website hoặc một trang mạng xã hội'));
    // The logo and product images are links (only an event's own media is uploaded).
    const logo = (await imageChange(ctx, null, body.logoUrl, 'logo')) ?? null;
    const images: string[] = [];
    for (const raw of body.productImages) { const u = await imageChange(ctx, null, raw, 'moment'); if (u) images.push(u); }
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      const r = await one<{ id: string }>(q,
        `insert into ad_inquiries (user_id, brand, category, email, placements, message, logo_url, website, links, product_images, description, contact_name, phone,
                                   budget_amount, currency, starts_on, ends_on, cities, is_alcohol, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) returning id`,
        [s.user.id, body.brand, body.category, normalizeEmail(body.email), [...new Set(body.placements)], body.message.trim(), logo, body.website ?? null, json(body.links),
          images, body.description, body.contactName, body.phone || null, body.budgetAmount, AD_CURRENCY, body.startsOn, body.endsOn, [...new Set(body.cities)], body.isAlcohol, now]);
      await notifyAdmins(q, now, {
        kind: 'ad_inquiry', dedupeKey: `ad-inquiry:${r!.id}`,
        title: L(`Brand ad request: ${body.brand}`, `Yêu cầu quảng cáo thương hiệu: ${body.brand}`),
        body: L(`${AD_CATEGORY_LABEL[body.category].en} · ${body.startsOn} → ${body.endsOn}`, `${AD_CATEGORY_LABEL[body.category].vi} · ${body.startsOn} → ${body.endsOn}`),
        cta: L('Answer it', 'Trả lời'), link: { url: '/console/featured#ads' },
      });
      return r!;
    });
    return reply.code(201).send({
      ok: true, id: row.id,
      message: L('Thanks — our partnerships team replies within two working days.', 'Cảm ơn — đội đối tác sẽ phản hồi trong hai ngày làm việc.'),
    });
  });

  /** What the form offers: categories, placements, links and cities, with their labels. */
  app.get('/ad-inquiries/options', async () => ({
    categories: AD_CATEGORIES.map((k) => ({ key: k, label: AD_CATEGORY_LABEL[k] })),
    placements: BRAND_AD_PLACEMENTS.map((k) => ({ key: k, label: BRAND_AD_PLACEMENT_LABEL[k] })),
    links: BRAND_LINKS,
    currency: AD_CURRENCY,
    minBudget: 1_000_000,
  }));

  /** The signed-in person's own requests, with the team's answer. */
  app.get('/me/ad-inquiries', async (req) => {
    const s = requireUser(req);
    const rows = await many<any>(ctx.db, `select * from ad_inquiries where user_id = $1 order by created_at desc limit 30`, [s.user.id]);
    return {
      items: rows.map((r) => ({
        id: r.id, brand: r.brand, category: r.category, categoryLabel: AD_CATEGORY_LABEL[r.category as AdCategory] ?? null, status: r.status,
        budgetAmount: r.budget_amount == null ? null : Number(r.budget_amount), currency: r.currency,
        startsOn: r.starts_on ? String(r.starts_on).slice(0, 10) : null, endsOn: r.ends_on ? String(r.ends_on).slice(0, 10) : null,
        placements: (r.placements as BrandAdPlacement[]).map((k) => ({ key: k, label: BRAND_AD_PLACEMENT_LABEL[k] ?? L(k, k) })),
        cities: (r.cities as string[]).map((c) => ({ slug: c, label: cityLabel(c) })),
        reply: r.reply, createdAt: r.created_at, decidedAt: r.decided_at,
      })),
    };
  });
}
