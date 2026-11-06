import type { FastifyInstance } from 'fastify';
import { many, one } from '../db/index.ts';
import { notFound } from '../lib/errors.ts';
import { L, type Lang } from '../lib/i18n.ts';
import { formatMoney } from '../lib/money.ts';
import { cityOf } from '../lib/places.ts';
import { isoIn } from '../lib/time.ts';
import { buildIcs } from '../services/ics.ts';

/*
 * An organiser's calendar on their own website (growth plan card 1): the public feed the widget
 * (festfinder-frontend/ui/widget/ff-widget.js) reads, open to every site (CORS *), and the same
 * nights as an .ics feed. Only live upcoming events, nothing of whoever is looking.
 *
 *   GET /embed/organizers/<slug>?lang=vi&limit=6     JSON with the labels written here
 *   GET /embed/organizers/<slug>.ics                 a calendar to subscribe to
 */

const LIMIT = 20;
const WEEKDAY: Record<Lang, string[]> = { vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };

export default async function embedRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const base = () => ctx.config.publicBaseUrl.replace(/\/$/, '');

  const load = async (slug: string, limit: number) => {
    const org = await one<{ id: string; slug: string; name: string }>(ctx.db,
      'select id, slug, name from organizers where slug = $1 and suspended_at is null', [slug]);
    if (!org) throw notFound(L('Organiser not found', 'Không tìm thấy nhà tổ chức'));
    type Row = { id: string; slug: string; title: string; city: string; venue_name: string | null; address: string | null; area: string | null; starts_at: Date; ends_at: Date; entry_mode: string; price_from: number | null; currency: string; updated_at: Date | null; description: { vi?: string; en?: string } | null };
    const events = await many<Row>(ctx.db,
      `select id, slug, title, city, venue_name, address, area, starts_at, ends_at, starts_on, start_time, entry_mode, price_from, currency, updated_at, description
         from events where organizer_id = $1 and status = 'live' and not held_for_reports and ends_at >= $2
        order by starts_at limit $3`, [org.id, ctx.clock.now(), limit]);
    return { org, events };
  };

  app.get<{ Params: { slug: string }; Querystring: { lang?: string; limit?: string } }>('/embed/organizers/:slug', async (req, reply) => {
    const lang: Lang = req.query.lang === 'en' ? 'en' : 'vi';
    const limit = Math.min(LIMIT, Math.max(1, Number(req.query.limit) || 6));
    reply.header('access-control-allow-origin', '*').header('x-robots-tag', 'noindex');
    if (req.params.slug.endsWith('.ics')) return ics(req.params.slug.slice(0, -4), reply);
    const { org, events } = await load(req.params.slug, limit);
    return {
      organizer: { slug: org.slug, name: org.name, url: `${base()}/o/${org.slug}${lang === 'en' ? '?lang=en' : ''}` },
      events: events.map((e) => {
        const tz = cityOf(e.city).timezone;
        const local = isoIn(new Date(e.starts_at), tz); // 2026-10-24T23:00:00+09:00
        const d = new Date(`${local.slice(0, 10)}T00:00:00Z`);
        return {
          slug: e.slug, title: e.title,
          dateLabel: `${WEEKDAY[lang][d.getUTCDay()]} ${local.slice(8, 10)}/${local.slice(5, 7)}`,
          timeLabel: local.slice(11, 16),
          place: [e.venue_name, cityOf(e.city).name[lang]].filter(Boolean).join(' · '),
          price: e.entry_mode === 'free' ? (lang === 'vi' ? 'Miễn phí' : 'Free')
            : !e.price_from ? (lang === 'vi' ? 'Chưa rõ giá' : 'Price to be announced')
            : `${lang === 'vi' ? 'từ' : 'from'} ${formatMoney(e.price_from, e.currency, lang)}`,
          url: `${base()}/e/${e.slug}?src=widget${lang === 'en' ? '&lang=en' : ''}`,
        };
      }),
      all: { label: lang === 'vi' ? 'Xem tất cả trên FeestFinder' : 'See all on FeestFinder', url: `${base()}/o/${org.slug}?src=widget${lang === 'en' ? '&lang=en' : ''}` },
    };
  });

  const ics = async (slug: string, reply: import('fastify').FastifyReply) => {
    const { org, events } = await load(slug, LIMIT * 5);
    const icsContent = buildIcs({
      events,
      calendarName: `${org.name} · FeestFinder`,
      baseUrl: base(),
      now: ctx.clock.now(),
      refreshable: false,
      productId: 'Organiser calendar',
    });
    return reply.type('text/calendar; charset=utf-8').header('cache-control', 'public, max-age=300').send(icsContent);
  };
}
