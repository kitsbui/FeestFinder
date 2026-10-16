import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { searchNormalize } from '../../lib/contact.ts';
import { vnDate } from '../../lib/time.ts';
import { bool, parse, uuid } from '../../lib/validate.ts';
import { requireAdmin } from '../../http/guards.ts';
import { appendAudit, type DiffRow } from '../../services/audit.ts';
import { refreshDerived } from '../../services/events.ts';
import { cityOf, citySlug, DEFAULT_CITY } from '../../lib/places.ts';
import { STATUS_LABEL } from '../organizer/events.ts';

import { short, actorOf, venueLikeness } from './ops-shared.ts';

/* The team's venues: the list, a new venue, an edit and its pin. */

export default async function adminVenueRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- venues ------------------------------------------------------------------------------

  const VenueInput = z.object({
    name: z.string().trim().min(2).max(160),
    address: z.string().trim().min(3).max(240),
    area: z.string().trim().min(2).max(60),
    city: citySlug.default(DEFAULT_CITY),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    aliases: z.array(z.string().trim().min(2).max(160)).max(10).default([]),
    website: z.string().url().max(300).nullable().default(null),
    venueType: z.enum(['club', 'bar', 'concert_hall', 'arena', 'outdoor', 'gallery', 'other']).nullable().default(null),
    verified: z.boolean().default(true),
    permitOnFile: z.boolean().default(false),
  });
  /** A pin belongs inside its city's box, so a typo in a coordinate is caught before it is saved. */
  const pinInCity = (lat: number, lng: number, city: string) => {
    const [w, so, e, n] = cityOf(city).bbox;
    if (lat < so || lat > n || lng < w || lng > e) throw badRequest('pin_outside_city', L(`That pin is outside ${cityOf(city).name.en}`, `Ghim nằm ngoài ${cityOf(city).name.vi}`));
  };
  const presentVenue = (v: any) => ({
    id: v.id, name: v.name, address: v.address, area: v.area, city: v.city, lat: v.lat, lng: v.lng, aliases: v.aliases ?? [], website: v.website,
    venueType: v.venue_type, verified: v.verified, permitOnFile: v.permit_on_file,
  });

  app.get('/admin/venues', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({ q: z.string().max(80).optional(), area: z.string().max(60).optional(), verified: bool.optional(), permit: bool.optional() }), req.query);
    const now = ctx.clock.now();
    const today = vnDate(now);
    const [rows, unresolved] = await Promise.all([
      many<any>(ctx.db,
        `select v.*, (select count(*)::int from events e where e.venue_id = v.id) as events,
                (select count(*)::int from events e where e.venue_id = v.id and e.status = 'live' and coalesce(e.ends_on, e.starts_on) >= $1) as upcoming,
                (select max(e.starts_on) from events e where e.venue_id = v.id and e.published_at is not null) as last_event
           from venues v order by v.name`, [today]),
      many<any>(ctx.db,
        `select e.id, e.title, e.status, e.starts_on, e.venue_name, e.address, e.area, o.name as org_name
           from events e join organizers o on o.id = e.organizer_id
          where e.venue_id is null and e.lat is null and e.venue_name is not null and e.status in ('in_review','live')
            and coalesce(e.ends_on, e.starts_on, $1) >= $1
          order by (e.status = 'in_review') desc, e.starts_on`, [today]),
    ]);
    const needle = f.q ? searchNormalize(f.q) : '';
    const items = rows
      .filter((v) => !needle || searchNormalize(`${v.name} ${v.address} ${v.area}`).includes(needle))
      .filter((v) => !f.area || v.area === f.area)
      .filter((v) => f.verified === undefined || v.verified === f.verified)
      .filter((v) => f.permit === undefined || v.permit_on_file === f.permit)
      .map((v) => ({ ...presentVenue(v), events: v.events, upcoming: v.upcoming, lastEvent: v.last_event }));
    return {
      items, total: rows.length,
      unresolved: unresolved.map((e) => ({
        id: e.id, title: e.title, status: e.status, statusLabel: STATUS_LABEL[e.status], startsOn: e.starts_on, organizer: e.org_name,
        venueName: e.venue_name, address: e.address, area: e.area,
        suggestions: rows.map((v) => ({ id: v.id, name: v.name, area: v.area, score: Math.max(venueLikeness(`${e.venue_name}`, v.name), venueLikeness(`${e.address ?? ''}`, v.address) * 0.9) }))
          .filter((x) => x.score >= 0.5).sort((a, b) => b.score - a.score).slice(0, 3),
      })),
    };
  });

  app.post('/admin/venues', async (req, reply) => {
    const s = requireAdmin(req);
    const body = parse(VenueInput, req.body);
    pinInCity(body.lat, body.lng, body.city);
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      // The same name in another city is another venue.
      const all = await many<any>(q, 'select id, name from venues where city = $1', [body.city]);
      const dupe = all.find((v) => searchNormalize(v.name) === searchNormalize(body.name));
      if (dupe) throw conflict('venue_exists', L('A venue with this name already exists', 'Đã có địa điểm trùng tên'), { id: dupe.id });
      const v = await one<any>(q,
        `insert into venues (name, address, area, city, lat, lng, aliases, website, venue_type, verified, permit_on_file)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
        [body.name, body.address, body.area, body.city, body.lat, body.lng, body.aliases, body.website, body.venueType, body.verified, body.permitOnFile]);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'venue.created', targetType: 'venue', targetId: v.id, targetLabel: v.name,
        diff: [{ f: 'area', a: '—', b: v.area }, { f: 'pin', a: '—', b: `${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}` }] });
      return v;
    });
    return reply.code(201).send({ ...presentVenue(row), message: L('Venue added', 'Đã thêm địa điểm') });
  });

  app.patch<{ Params: { id: string } }>('/admin/venues/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    // A partial edit: only what was sent changes, defaults included.
    const body = parse(VenueInput.partial(), req.body);
    const raw = (req.body ?? {}) as Record<string, unknown>;
    const now = ctx.clock.now();
    return ctx.db.tx(async (q) => {
      const old = await one<any>(q, 'select * from venues where id = $1 for update', [id]);
      if (!old) throw notFound();
      pinInCity(body.lat ?? old.lat, body.lng ?? old.lng, body.city ?? old.city);
      const v = await one<any>(q,
        `update venues set name = coalesce($2, name), address = coalesce($3, address), area = coalesce($4, area), lat = coalesce($5, lat), lng = coalesce($6, lng),
                verified = coalesce($7, verified), permit_on_file = coalesce($8, permit_on_file), city = coalesce($9, city),
                aliases = coalesce($10, aliases), website = case when $11 then $12 else website end, venue_type = case when $13 then $14 else venue_type end
          where id = $1 returning *`,
        [id, body.name ?? null, body.address ?? null, body.area ?? null, body.lat ?? null, body.lng ?? null, body.verified ?? null, body.permitOnFile ?? null,
          'city' in raw ? body.city : null, 'aliases' in raw ? body.aliases : null, 'website' in raw, body.website ?? null, 'venueType' in raw, body.venueType ?? null]);
      // Listings copy the venue's details; keep the ones still to come in step.
      const moved = await many<any>(q,
        `update events set venue_name = $2, address = $3, area = $4, lat = $5, lng = $6, city = $8
          where venue_id = $1 and coalesce(ends_on, starts_on, $7) >= $7 returning id`, [id, v.name, v.address, v.area, v.lat, v.lng, vnDate(now), v.city]);
      for (const e of moved) await refreshDerived(q, e.id, now);
      const diff: DiffRow[] = [];
      for (const [col, f] of [['name', 'name'], ['address', 'address'], ['area', 'area'], ['verified', 'verified'], ['permit_on_file', 'permit']] as const) {
        if (old[col] !== v[col]) diff.push({ f, a: short(old[col]), b: short(v[col]) });
      }
      if (old.lat !== v.lat || old.lng !== v.lng) diff.push({ f: 'pin', a: `${old.lat.toFixed(4)}, ${old.lng.toFixed(4)}`, b: `${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}` });
      if (diff.length) await appendAudit(q, { at: now, ...actorOf(s), action: 'venue.updated', targetType: 'venue', targetId: id, targetLabel: v.name, diff });
      return {
        ...presentVenue(v),
        message: moved.length ? L(`Saved · ${moved.length} upcoming listings updated`, `Đã lưu · cập nhật ${moved.length} tin sắp diễn ra`) : L('Saved', 'Đã lưu'),
      };
    });
  });

}
