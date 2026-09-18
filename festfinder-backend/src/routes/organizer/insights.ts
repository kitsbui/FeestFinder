import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../../db/index.ts';
import { L, type Localized } from '../../lib/i18n.ts';
import { addDays, daysBetween, vnDate } from '../../lib/time.ts';
import { parse } from '../../lib/validate.ts';
import { requireOrganizer, requireOwnEvent } from '../../http/guards.ts';

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n))}%`;

export default async function organizerInsightRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  /** Views / saves / ticket clicks for a window, all of this organiser's events. */
  async function totals(orgId: string, from: string | null, to: string) {
    const m = await one<any>(ctx.db,
      `select coalesce(sum(m.views), 0)::int as views, coalesce(sum(m.ticket_clicks), 0)::int as clicks
         from event_metrics_daily m join events e on e.id = m.event_id
        where e.organizer_id = $1 and ($2::date is null or m.day >= $2) and m.day <= $3`, [orgId, from, to]);
    const s = await one<any>(ctx.db,
      `select count(*)::int as saves from saves s join events e on e.id = s.event_id
        where e.organizer_id = $1 and ($2::timestamptz is null or s.created_at >= $2) and s.created_at < $3`,
      [orgId, from ? new Date(`${from}T00:00:00+07:00`) : null, new Date(`${addDays(to, 1)}T00:00:00+07:00`)]);
    return { views: m.views, clicks: m.clicks, saves: s.saves };
  }

  app.get('/organizer/dashboard', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const { range } = parse(z.object({ range: z.enum(['7d', '30d', 'all']).default('30d') }), req.query);
    const now = ctx.clock.now();
    const today = vnDate(now);
    const days = range === '7d' ? 7 : range === '30d' ? 30 : null;
    const cur = await totals(org.organizerId, days ? addDays(today, -(days - 1)) : null, today);
    const prev = days ? await totals(org.organizerId, addDays(today, -(2 * days - 1)), addDays(today, -days)) : null;

    const buyers = await one<any>(ctx.db,
      `select count(*)::int as n, count(*) filter (where exists (select 1 from saves s where s.user_id = o.user_id and s.event_id = o.event_id and s.created_at < o.paid_at))::int as saved_first
         from orders o join events e on e.id = o.event_id where e.organizer_id = $1 and o.status = 'paid'`, [org.organizerId]);
    const review = await one<any>(ctx.db,
      `select count(*)::int as n, max(submitted_at) as last from events where organizer_id = $1 and status = 'in_review'`, [org.organizerId]);
    const published = await one<any>(ctx.db, `select count(*)::int as n from events where organizer_id = $1 and published_at is not null`, [org.organizerId]);
    const hoursAgo = review.last ? Math.max(0, Math.round((now.getTime() - new Date(review.last).getTime()) / 3600_000)) : null;

    const viewsDelta: Localized = prev && prev.views === 0
      ? L('No views in the previous period', 'Kỳ trước chưa có lượt xem')
      : prev
      ? L(`${signed(prev.views ? ((cur.views - prev.views) / prev.views) * 100 : 0)} vs ${range === '7d' ? 'previous week' : 'last period'}`,
        `${signed(prev.views ? ((cur.views - prev.views) / prev.views) * 100 : 0)} so với ${range === '7d' ? 'tuần trước' : 'kỳ trước'}`)
      : L(`Across ${published.n} published events`, `Trên ${published.n} sự kiện đã đăng`);
    const saveRate = pct(cur.saves, cur.views);
    const savedFirst = pct(buyers.saved_first, buyers.n);

    // Suggested next steps from what the listings are actually missing.
    const listings = await many<any>(ctx.db,
      `select id, title, status, cover_url, lineup, entry_mode, price_from, starts_on from events where organizer_id = $1 and status in ('draft','in_review','live','rejected')`, [org.organizerId]);
    const todo: { kind: string; eventId: string; text: Localized }[] = [];
    for (const e of listings) {
      if (e.status !== 'live' && !e.cover_url) {
        todo.push({ kind: 'image', eventId: e.id, text: L(`Add a 1600×900 landscape image to ${e.title} — cards without art lose 40% of clicks.`, `Thêm ảnh ngang 1600×900 cho ${e.title} — thẻ không ảnh mất 40% lượt bấm.`) });
      }
      if (e.status === 'live' && e.lineup.length < 3 && e.starts_on && daysBetween(today, e.starts_on) >= 7) {
        todo.push({ kind: 'lineup', eventId: e.id, text: L(`Announce the ${e.title} lineup 7 days out to qualify for the Trending shelf.`, `Công bố đội hình ${e.title} trước 7 ngày để lên mục Đang hot.`) });
      }
      if (e.status === 'draft' && e.entry_mode === 'paid' && !e.price_from) {
        todo.push({ kind: 'price', eventId: e.id, text: L(`Set a ticket price on ${e.title} to move it out of draft.`, `Điền giá vé cho ${e.title} để thoát trạng thái nháp.`) });
      }
    }

    return {
      range,
      kpis: [
        { key: 'views', value: cur.views, delta: viewsDelta },
        { key: 'saves', value: cur.saves, delta: L(`${saveRate}% of viewers save`, `${String(saveRate).replace('.', ',')}% người xem lưu lại`) },
        { key: 'ticketClicks', value: cur.clicks, delta: L(`${savedFirst}% of buyers saved first`, `${String(savedFirst).replace('.', ',')}% người mua đã lưu trước`) },
        { key: 'inReview', value: review.n, delta: hoursAgo === null ? L('Nothing waiting', 'Không có tin chờ') : L(`Submitted ${hoursAgo}h ago`, `Gửi ${hoursAgo} giờ trước`) },
      ],
      todo: todo.slice(0, 5),
    };
  });

  /** Who saved this organiser's events, for the dashboard sidebar. */
  app.get('/organizer/audience', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const year = Number(vnDate(ctx.clock.now()).slice(0, 4));
    const r = await one<any>(ctx.db,
      `with savers as (select distinct u.* from saves s join events e on e.id = s.event_id join users u on u.id = s.user_id where e.organizer_id = $1),
            top_genre as (select genre from events where organizer_id = $1 and genre is not null group by genre order by count(*) desc limit 1)
       select count(*)::int as total,
              count(*) filter (where city ilike any (array['%hcm%', '%hồ chí minh%', '%sài gòn%', '%saigon%']))::int as hcmc,
              count(*) filter (where birth_year between $2 - 24 and $2 - 18)::int as young,
              count(*) filter (where (select genre from top_genre) = any(interests))::int as into_genre,
              count(*) filter (where exists (select 1 from going g join events e2 on e2.id = g.event_id where g.user_id = savers.id and e2.organizer_id = $1 and e2.ends_at < $3))::int as returning,
              (select genre from top_genre) as genre
         from savers`, [org.organizerId, year, ctx.clock.now()]);
    return {
      total: r.total,
      rows: [
        { key: 'city', label: L('Ho Chi Minh City', 'TP.HCM'), pct: pct(r.hcmc, r.total) },
        { key: 'age', label: L('Aged 18–24', '18–24 tuổi'), pct: pct(r.young, r.total) },
        { key: 'genre', label: L(`Into ${r.genre ?? 'your genre'}`, `Thích ${r.genre ?? 'thể loại này'}`), pct: pct(r.into_genre, r.total) },
        { key: 'returning', label: L('Came to a past event', 'Đã dự sự kiện trước'), pct: pct(r.returning, r.total) },
      ],
    };
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/performance', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const now = ctx.clock.now();
    const today = vnDate(now);
    const [tiers, metrics, daily, prevEv] = await Promise.all([
      many<any>(ctx.db, 'select name, capacity, sold from ticket_tiers where event_id = $1 order by sort, price', [ev.id]),
      one<any>(ctx.db, `select coalesce(sum(views),0)::int as views, coalesce(sum(ticket_clicks),0)::int as clicks from event_metrics_daily where event_id = $1`, [ev.id]),
      many<any>(ctx.db,
        `select to_char(paid_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') as day, sum(qty)::int as n
           from orders where event_id = $1 and status = 'paid' and paid_at >= $2 group by 1`, [ev.id, new Date(`${addDays(today, -13)}T00:00:00+07:00`)]),
      ev.previous_edition_id ? one<any>(ctx.db, 'select id, title, save_count, starts_on from events where id = $1', [ev.previous_edition_id]) : null,
    ]);
    const sources = await many<any>(ctx.db, `select key, sum(value::int)::int as n from event_metrics_daily, jsonb_each_text(sources) where event_id = $1 group by key order by n desc`, [ev.id]);

    const cap = tiers.reduce((n, t) => n + t.capacity, 0) || ev.capacity || 0;
    const sold = tiers.reduce((n, t) => n + t.sold, 0);
    const daysLeft = ev.starts_on ? Math.max(0, daysBetween(today, ev.starts_on)) : 0;
    const byDay = new Map(daily.map((d) => [d.day, d.n]));
    const trend = Array.from({ length: 14 }, (_, i) => { const d = addDays(today, i - 13); return { day: d, sold: byDay.get(d) ?? 0 }; });
    const pace = Math.round(trend.slice(-7).reduce((n, d) => n + d.sold, 0) / 7);
    const need = Math.ceil(Math.max(0, cap - sold) / Math.max(daysLeft, 1));
    const projected = Math.min(cap, sold + pace * daysLeft);
    const onPace = pace >= need;
    const funnel = [metrics.views, ev.save_count, metrics.clicks, sold];
    const totalSources = sources.reduce((n, s) => n + s.n, 0);

    let vsPrevious = null;
    if (prevEv) {
      const pm = await one<any>(ctx.db, `select coalesce(sum(views),0)::int as views from event_metrics_daily where event_id = $1`, [prevEv.id]);
      const ps = await one<any>(ctx.db, `select coalesce(sum(sold),0)::int as sold from ticket_tiers where event_id = $1`, [prevEv.id]);
      const change = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
      const convNow = pct(sold, metrics.views);
      const convPrev = pct(ps.sold, pm.views);
      const pp = Math.round((convNow - convPrev) * 10) / 10;
      vsPrevious = {
        label: L(`vs ${prevEv.title}`, `so với ${prevEv.title}`),
        rows: [
          { key: 'views', label: L('Views', 'Lượt xem'), value: signed(change(metrics.views, pm.views)), good: metrics.views >= pm.views },
          { key: 'saves', label: L('Saves', 'Lượt lưu'), value: signed(change(ev.save_count, prevEv.save_count)), good: ev.save_count >= prevEv.save_count },
          { key: 'conversion', label: L('View → sale', 'Xem → mua'), value: `${pp >= 0 ? '+' : '−'}${Math.abs(pp)}pp`, good: pp >= 0 },
          { key: 'sold', label: L('Tickets sold', 'Vé đã bán'), value: signed(change(sold, ps.sold)), good: sold >= ps.sold },
        ],
      };
    }

    return {
      event: { id: ev.id, title: ev.title, startsOn: ev.starts_on, status: ev.status },
      sold, capacity: cap, soldPct: pct(sold, cap),
      daysLeft, pacePerDay: pace, needPerDay: need,
      projection: { tickets: projected, pct: pct(projected, cap) },
      verdict: onPace ? { key: 'on_pace', label: L('On pace to sell out', 'Đúng nhịp để bán hết') } : { key: 'behind', label: L('Behind pace', 'Chậm hơn nhịp cần') },
      funnel: funnel.map((v, i) => ({
        key: ['views', 'saves', 'ticketClicks', 'sold'][i],
        value: v,
        shareOfViews: pct(v, funnel[0]),
        stepConversion: i === 0 ? null : pct(v, funnel[i - 1]),
      })),
      trend,
      sources: sources.map((s) => ({ key: s.key, pct: Math.round((s.n / Math.max(totalSources, 1)) * 100) })),
      tiers: tiers.map((t) => ({ name: t.name, sold: t.sold, capacity: t.capacity, pct: pct(t.sold, t.capacity), soldOut: t.sold >= t.capacity })),
      vsPrevious,
    };
  });
}
