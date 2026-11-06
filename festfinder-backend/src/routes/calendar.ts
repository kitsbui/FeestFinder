import type { FastifyInstance } from 'fastify';
import { many } from '../db/index.ts';
import { L } from '../lib/i18n.ts';
import { launchedCities } from '../lib/places.ts';
import { badRequest } from '../lib/errors.ts';
import { SqlParams } from '../http/sql.ts';
import { buildIcs } from '../services/ics.ts';
import { parse } from '../lib/validate.ts';
import { z } from 'zod';

/*
 * A public calendar feed of upcoming EDM events, so Google Calendar can subscribe to it via
 * https://calendar.google.com/calendar/r?cid=webcal://feestfinder.com/calendar.ics
 *
 *   GET /calendar.ics?city=<slug>&lang=en|vi
 * All public, live, upcoming events (reuses the logic from /events).
 */

const CalendarQuery = z.object({
  city: z.string().max(60).optional(),
  lang: z.enum(['en', 'vi']).default('vi'),
});

const CALENDAR_LIMIT = 500;

export default async function calendarRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const base = () => ctx.config.publicBaseUrl.replace(/\/$/, '');

  app.get<{ Querystring: { city?: string; lang?: string } }>('/calendar.ics', async (req, reply) => {
    const f = parse(CalendarQuery, req.query);
    const now = ctx.clock.now();

    // Validate city if provided
    if (f.city) {
      const cities = launchedCities();
      if (!cities.some((c) => c.slug === f.city)) {
        throw badRequest('invalid_input', L('City not found', 'Không tìm thấy thành phố'));
      }
    }

    // Query: reuse the public events logic (status = 'live', not held_for_reports, upcoming, launched cities)
    const sql = new SqlParams();
    const where = [
      `e.status = 'live'`,
      'not e.held_for_reports',
      `(e.ends_at is null or e.ends_at >= ${sql.p(now)})`,
      `(e.city = any(${sql.p(launchedCities().map((c) => c.slug))}::text[]) or e.festival is not null)`,
    ];

    if (f.city) {
      where.push(`e.city = ${sql.p(f.city)}`);
    }

    type Row = {
      id: string;
      slug: string;
      title: string;
      city: string;
      venue_name: string | null;
      address: string | null;
      area: string | null;
      starts_at: Date;
      ends_at: Date;
      updated_at: Date | null;
      description: { vi?: string; en?: string } | null;
    };

    const events = await many<Row>(ctx.db,
      `select id, slug, title, city, venue_name, address, area, starts_at, ends_at, updated_at, description
         from events e
        where ${where.join(' and ')}
        order by e.starts_at, e.id
        limit ${sql.p(CALENDAR_LIMIT)}`,
      sql.values);

    // Build calendar name
    let calendarName = f.lang === 'en'
      ? 'FeestFinder: EDM events'
      : 'FeestFinder: sự kiện EDM';

    if (f.city) {
      const cityObj = launchedCities().find((c) => c.slug === f.city);
      if (cityObj) {
        const cityName = cityObj.name[f.lang];
        calendarName += f.lang === 'en' ? ` in ${cityName}` : ` tại ${cityName}`;
      }
    }

    const icsContent = buildIcs({
      events,
      calendarName,
      baseUrl: base(),
      now,
      refreshable: true,
      lang: f.lang,
    });

    return reply
      .type('text/calendar; charset=utf-8')
      .header('cache-control', 'public, max-age=300')
      .header('access-control-allow-origin', '*')
      .send(icsContent);
  });
}
