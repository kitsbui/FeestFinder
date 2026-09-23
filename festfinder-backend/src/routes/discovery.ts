import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { badRequest, notFound } from '../lib/errors.ts';
import { GENRES, L, type Genre, type Lang } from '../lib/i18n.ts';
import { isEmail, normalizeEmail, slugify } from '../lib/contact.ts';
import { addDays, monthEnd, timeWindow, vnDate, type TimeKey } from '../lib/time.ts';
import { parse, uuid } from '../lib/validate.ts';
import { requireUser } from '../http/guards.ts';
import { SqlParams } from '../http/sql.ts';
import { CARD_COLUMNS, presentCard } from '../presenters/event.ts';

const CITY = { slug: 'ho-chi-minh', en: 'Ho Chi Minh City', vi: 'TP.HCM' };
const TIMEFRAMES: Record<string, TimeKey> = { tonight: 'tonight', 'this-weekend': 'weekend', 'next-7-days': '7days', 'this-month': 'month' };
const GENRE_SLUGS: Record<string, Genre[]> = {
  ...Object.fromEntries(GENRES.map((g) => [slugify(g), [g]])),
  'night-market': ['Food'],
  'live-music': ['Indie', 'Pop', 'Jazz', 'Hip-Hop', 'EDM'],
};
const TIME_WORDS: Record<TimeKey, { en: string; vi: string }> = {
  tonight: { en: ' tonight', vi: ' tối nay' },
  weekend: { en: ' this weekend', vi: ' cuối tuần này' },
  '7days': { en: ' in the next 7 days', vi: ' trong 7 ngày tới' },
  month: { en: ' this month', vi: ' tháng này' },
};
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default async function discoveryRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  /**
   * Programmatic landing pages: /{locale}/{city}/{facets…}. Facets are any of a genre
   * (edm, night-market, live-music…), a district (quan-1, thao-dien…), `free`, and a
   * timeframe (tonight, this-weekend, next-7-days, this-month, 2026-09). The web app
   * renders this with ISR (revalidate 900s) and uses `meta` in generateMetadata().
   */
  app.get<{ Params: { locale: string; city: string; '*': string } }>('/seo/landing/:locale/:city/*', async (req) => {
    const lang = parse(z.enum(['en', 'vi']), req.params.locale) as Lang;
    if (req.params.city !== CITY.slug) throw notFound(L('We do not cover that city yet', 'Chúng tôi chưa có thành phố này'));
    const segments = req.params['*'].split('/').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const now = ctx.clock.now();
    const today = vnDate(now);

    const areas = await many<{ area: string }>(ctx.db, `select distinct area from events where status = 'live' and area is not null`);
    const areaBySlug = new Map(areas.map((a) => [slugify(a.area), a.area]));

    let genres: Genre[] | null = null;
    let genreSlug: string | null = null;
    let area: string | null = null;
    let free = false;
    let window: { from: string; to: string } | null = null;
    let timeKey: TimeKey | null = null;
    let monthLabel: { en: string; vi: string } | null = null;

    for (const seg of segments) {
      if (TIMEFRAMES[seg] && !window) { timeKey = TIMEFRAMES[seg]; window = timeWindow(timeKey, today); continue; }
      const ym = /^(\d{4})-(\d{2})$/.exec(seg);
      if (ym && !window && Number(ym[2]) >= 1 && Number(ym[2]) <= 12) {
        const first = `${ym[1]}-${ym[2]}-01`;
        window = { from: first, to: monthEnd(first) };
        monthLabel = { en: ` in ${MONTHS_EN[Number(ym[2]) - 1]} ${ym[1]}`, vi: ` tháng ${Number(ym[2])}/${ym[1]}` };
        continue;
      }
      if (seg === 'free' && !free) { free = true; continue; }
      if (GENRE_SLUGS[seg] && !genres) { genres = GENRE_SLUGS[seg]; genreSlug = seg; continue; }
      if (areaBySlug.has(seg) && !area) { area = areaBySlug.get(seg)!; continue; }
      throw notFound(L('Page not found', 'Không tìm thấy trang'));
    }

    const sql = new SqlParams();
    const where = [`e.status = 'live'`, 'not e.held_for_reports', `e.ends_at >= ${sql.p(now)}`];
    if (window) where.push(`e.starts_on <= ${sql.p(window.to)} and e.ends_on >= ${sql.p(window.from)}`);
    else where.push(`e.starts_on <= ${sql.p(addDays(today, 60))}`);
    if (genres) where.push(`e.genre = any(${sql.p(genres)}::text[])`);
    if (area) where.push(`e.area = ${sql.p(area)}`);
    if (free) where.push(`(e.entry_mode = 'free' or e.price_from = 0)`);
    const rows = await many<any>(ctx.db,
      `select ${CARD_COLUMNS} from events e join organizers o on o.id = e.organizer_id where ${where.join(' and ')} order by e.starts_at limit 50`, sql.values);
    const events = rows.map((r) => presentCard(r, { now, viewer: null }));

    const genreName = genreSlug === 'night-market' ? { en: 'Night markets', vi: 'Chợ đêm' }
      : genreSlug === 'live-music' ? { en: 'Live music', vi: 'Nhạc sống' }
      : genres ? { en: `${genres[0]} events`, vi: `Sự kiện ${genres[0]}` } : null;
    const subject = free ? (genreName ? { en: `Free ${genreName.en.toLowerCase()}`, vi: `${genreName.vi} miễn phí` } : { en: 'Free events', vi: 'Sự kiện miễn phí' })
      : genreName ?? { en: 'Events', vi: 'Sự kiện' };
    const place = { en: ` in ${area ?? CITY.en}`, vi: ` ở ${area ?? CITY.vi}` };
    const when = monthLabel ?? (timeKey ? TIME_WORDS[timeKey] : { en: '', vi: '' });
    const h1 = `${subject[lang]}${place[lang]}${when[lang]}`;

    const base = ctx.config.publicBaseUrl.replace(/\/$/, '');
    const suffix = segments.length ? `/${segments.join('/')}` : '';
    const url = (l: Lang) => `${base}/${l}/${CITY.slug}${suffix}`;

    const freeNames = events.filter((e) => e.isFree).map((e) => e.title);
    const biggest = [...events].sort((a, b) => b.hypeCount - a.hypeCount)[0];
    const soldOut = events.filter((e) => e.soldOut);
    const fmt = (n: number) => n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
    const answers = [
      { label: lang === 'vi' ? 'Miễn phí' : 'Free', value: freeNames.join(', ') || '—' },
      { label: lang === 'vi' ? 'Lớn nhất' : 'Biggest', value: biggest ? `${biggest.title} · ${fmt(biggest.hypeCount)} ${lang === 'vi' ? 'người quan tâm' : 'hyped'}` : '—' },
      { label: lang === 'vi' ? 'Đã hết vé' : 'Sold out', value: soldOut.map((e) => `${e.title} (${e.startsOn!.slice(8, 10)}/${e.startsOn!.slice(5, 7)})`).join(', ') || '—' },
    ];

    const faqKey = `${CITY.slug}${suffix}`;
    const faqRows = await many<any>(ctx.db, 'select question, answer from seo_faqs where path = $1 order by sort', [faqKey]);
    const faqs = faqRows.map((f) => ({ q: f.question[lang], a: f.answer[lang] }));

    const related = [
      ...GENRES.filter((g) => !genres?.includes(g)).slice(0, 4).map((g) => ({
        label: lang === 'vi' ? `Sự kiện ${g} ở ${CITY.vi}` : `${g} events in ${CITY.en}`, href: `/${lang}/${CITY.slug}/${slugify(g)}`,
      })),
      { label: lang === 'vi' ? 'Sự kiện miễn phí cuối tuần này' : 'Free events this weekend', href: `/${lang}/${CITY.slug}/free/this-weekend` },
      ...[...areaBySlug.entries()].filter(([, a]) => a !== area).slice(0, 3).map(([slug, a]) => ({
        label: lang === 'vi' ? `Sự kiện ở ${a}` : `Events in ${a}`, href: `/${lang}/${CITY.slug}/${slug}`,
      })),
    ];

    const description = lang === 'vi'
      ? `${events.length} sự kiện${place.vi}${when.vi}: giờ diễn, địa điểm, giá vé và ai sẽ đi. Cập nhật mỗi 15 phút.`
      : `${events.length} events${place.en}${when.en}: times, venues, ticket prices and who is going. Updated every 15 minutes.`;

    return {
      locale: lang,
      path: `/${lang}/${CITY.slug}${suffix}`,
      revalidateSeconds: 900,
      meta: {
        title: `${h1} | FeestFinder`,
        description,
        canonical: url(lang),
        alternates: { vi: url('vi'), en: url('en'), 'x-default': url('vi') },
      },
      kicker: lang === 'vi' ? `${CITY.vi} · cập nhật hôm nay` : `${CITY.en} · updated today`,
      h1,
      intro: description,
      count: events.length,
      answers,
      events,
      faqs,
      related,
      jsonLd: [
        {
          '@context': 'https://schema.org', '@type': 'ItemList', name: h1,
          itemListElement: events.map((e, i) => ({
            '@type': 'ListItem', position: i + 1,
            item: {
              '@type': 'Event', name: e.title, url: `${base}/e/${e.slug}`,
              startDate: e.startsAt, endDate: e.endsAt,
              eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              location: { '@type': 'Place', name: e.venue.name, address: [e.venue.address, e.venue.area, CITY.en].filter(Boolean).join(', ') },
              organizer: { '@type': 'Organization', name: e.organizer.name },
              offers: { '@type': 'Offer', price: e.priceFrom, priceCurrency: 'VND', availability: e.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' },
              ...(e.coverUrl ? { image: e.coverUrl } : {}),
            },
          })),
        },
        ...(faqs.length ? [{
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }] : []),
        {
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'FeestFinder', item: `${base}/${lang}` },
            { '@type': 'ListItem', position: 2, name: CITY[lang], item: `${base}/${lang}/${CITY.slug}` },
            ...(suffix ? [{ '@type': 'ListItem', position: 3, name: h1, item: url(lang) }] : []),
          ],
        },
      ],
    };
  });

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
