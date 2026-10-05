import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../context.ts';
import { many, one, type Queryable } from '../db/index.ts';
import { badRequest, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { initialsOf, slugify } from '../lib/contact.ts';
import { randomCode } from '../lib/crypto.ts';
import { parse, uuid } from '../lib/validate.ts';
import { requireUser } from '../http/guards.ts';
import { CARD_COLUMNS, loadViewer, presentCard } from '../presenters/event.ts';

/** How many lists a person keeps, and how many events one holds. */
export const MAX_COLLECTIONS = 50;
export const MAX_COLLECTION_ITEMS = 300;

/** The events a public collection shows: the ones the public can see. */
const VISIBLE = `e.status in ('live', 'cancelled') and not e.held_for_reports and e.published_at is not null`;

const missing = () => notFound(L('Collection not found', 'Không tìm thấy bộ sưu tập'));
const Name = z.string().trim().min(1).max(60);

/** A collection's link, once it has one, on the site's own address. */
export const collectionUrl = (ctx: Ctx, slug: string) => `${ctx.config.publicBaseUrl.replace(/\/$/, '')}/c/${slug}`;

function present(ctx: Ctx, c: any) {
  return {
    id: c.id as string,
    name: c.name as string,
    isPublic: c.is_public as boolean,
    url: c.is_public && c.slug ? collectionUrl(ctx, c.slug) : null,
    slug: c.is_public ? (c.slug as string | null) : null,
    count: (c.count ?? 0) as number,
    // The newest event's picture stands for the list.
    cover: c.cover_url ? { url: c.cover_url as string, genre: c.cover_genre as string | null } : c.cover_genre ? { url: null, genre: c.cover_genre as string } : null,
    has: c.has === undefined ? undefined : !!c.has,
    updatedAt: c.updated_at as Date,
  };
}

/** One person's collections, with counts and covers, and whether each holds `eventId`. */
async function listFor(q: Queryable, userId: string, eventId: string | null) {
  return many<any>(q,
    `select c.*,
            (select count(*)::int from collection_items i where i.collection_id = c.id) as count,
            cov.cover_url, cov.genre as cover_genre
            ${eventId ? ', exists (select 1 from collection_items i where i.collection_id = c.id and i.event_id = $2) as has' : ''}
       from collections c
       left join lateral (
         select e.cover_url, e.genre from collection_items i join events e on e.id = i.event_id
          where i.collection_id = c.id order by i.added_at desc limit 1) cov on true
      where c.user_id = $1
      order by c.updated_at desc`, eventId ? [userId, eventId] : [userId]);
}

async function ownCollection(q: Queryable, userId: string, rawId: string) {
  const id = parse(uuid, rawId);
  const c = await one<any>(q, 'select * from collections where id = $1 and user_id = $2', [id, userId]);
  if (!c) throw missing();
  return c;
}

/** Collecting an event also saves it, so it gets the same reminders as the heart. */
async function addItem(q: Queryable, collectionId: string, userId: string, eventId: string, now: Date) {
  const ev = await one(q, `select 1 from events where id = $1 and status = 'live'`, [eventId]);
  if (!ev) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
  const n = await one<{ n: number }>(q, 'select count(*)::int as n from collection_items where collection_id = $1', [collectionId]);
  if (n!.n >= MAX_COLLECTION_ITEMS) throw badRequest('collection_full', L(`A collection holds up to ${MAX_COLLECTION_ITEMS} events`, `Mỗi bộ sưu tập có tối đa ${MAX_COLLECTION_ITEMS} sự kiện`));
  const added = await one(q, 'insert into collection_items (collection_id, event_id, added_at) values ($1,$2,$3) on conflict do nothing returning 1', [collectionId, eventId, now]);
  const saved = await one(q, 'insert into saves (user_id, event_id, created_at) values ($1,$2,$3) on conflict do nothing returning 1', [userId, eventId, now]);
  if (saved) await q.query('update events set save_count = save_count + 1 where id = $1', [eventId]);
  if (added) await q.query('update collections set updated_at = $2 where id = $1', [collectionId, now]);
  return !!added;
}

/**
 * Collections: a person's own lists of events. Private by default; a public one has a page
 * at /c/<slug> that anyone can open and share, with its own SEO (services/seo.ts).
 */
export default async function collectionRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.get('/me/collections', async (req) => {
    const s = requireUser(req);
    const { event } = parse(z.object({ event: uuid.optional() }), req.query);
    return { items: (await listFor(ctx.db, s.user.id, event ?? null)).map((c) => present(ctx, c)) };
  });

  app.post('/me/collections', async (req, reply) => {
    const s = requireUser(req);
    const body = parse(z.object({ name: Name, eventId: uuid.optional() }), req.body);
    const now = ctx.clock.now();
    const id = await ctx.db.tx(async (q) => {
      const n = await one<{ n: number }>(q, 'select count(*)::int as n from collections where user_id = $1', [s.user.id]);
      if (n!.n >= MAX_COLLECTIONS) throw badRequest('too_many_collections', L(`Up to ${MAX_COLLECTIONS} collections`, `Tối đa ${MAX_COLLECTIONS} bộ sưu tập`));
      const c = await one<{ id: string }>(q, 'insert into collections (user_id, name, created_at, updated_at) values ($1,$2,$3,$3) returning id', [s.user.id, body.name, now]);
      if (body.eventId) await addItem(q, c!.id, s.user.id, body.eventId, now);
      return c!.id;
    });
    const c = (await listFor(ctx.db, s.user.id, body.eventId ?? null)).find((x) => x.id === id);
    return reply.code(201).send(present(ctx, c));
  });

  app.get<{ Params: { id: string } }>('/me/collections/:id', async (req) => {
    const s = requireUser(req);
    const c = await ownCollection(ctx.db, s.user.id, req.params.id);
    const now = ctx.clock.now();
    const rows = await many<any>(ctx.db,
      `select ${CARD_COLUMNS} from collection_items i join events e on e.id = i.event_id join organizers o on o.id = e.organizer_id
        where i.collection_id = $1 order by i.added_at desc`, [c.id]);
    const viewer = await loadViewer(ctx.db, s.user.id, rows.map((r) => r.id));
    const meta = (await listFor(ctx.db, s.user.id, null)).find((x) => x.id === c.id);
    return { collection: present(ctx, meta), items: rows.map((r) => presentCard(r, { now, viewer })) };
  });

  app.patch<{ Params: { id: string } }>('/me/collections/:id', async (req) => {
    const s = requireUser(req);
    const body = parse(z.object({ name: Name.optional(), isPublic: z.boolean().optional() }), req.body);
    const c = await ownCollection(ctx.db, s.user.id, req.params.id);
    const name = body.name ?? c.name;
    const isPublic = body.isPublic ?? c.is_public;
    // The link is made once and kept, so turning it off and on again keeps the same address.
    let slug = c.slug as string | null;
    if (isPublic && !slug) {
      for (let i = 0; !slug && i < 5; i++) {
        const candidate = `${slugify(name) || 'bo-suu-tap'}-${randomCode(5).toLowerCase()}`;
        if (!(await one(ctx.db, 'select 1 from collections where slug = $1', [candidate]))) slug = candidate;
      }
    }
    await ctx.db.query('update collections set name = $2, is_public = $3, slug = $4, updated_at = $5 where id = $1', [c.id, name, isPublic, slug, ctx.clock.now()]);
    return present(ctx, (await listFor(ctx.db, s.user.id, null)).find((x) => x.id === c.id));
  });

  app.delete<{ Params: { id: string } }>('/me/collections/:id', async (req) => {
    const s = requireUser(req);
    const c = await ownCollection(ctx.db, s.user.id, req.params.id);
    await ctx.db.query('delete from collections where id = $1', [c.id]);
    return { deleted: true };
  });

  app.put<{ Params: { id: string; eventId: string } }>('/me/collections/:id/events/:eventId', async (req) => {
    const s = requireUser(req);
    const eventId = parse(uuid, req.params.eventId);
    const added = await ctx.db.tx(async (q) => {
      const c = await ownCollection(q, s.user.id, req.params.id);
      return addItem(q, c.id, s.user.id, eventId, ctx.clock.now());
    });
    return { collected: true, changed: added, saved: true };
  });

  app.delete<{ Params: { id: string; eventId: string } }>('/me/collections/:id/events/:eventId', async (req) => {
    const s = requireUser(req);
    const eventId = parse(uuid, req.params.eventId);
    const c = await ownCollection(ctx.db, s.user.id, req.params.id);
    const del = await one(ctx.db, 'delete from collection_items where collection_id = $1 and event_id = $2 returning 1', [c.id, eventId]);
    if (del) await ctx.db.query('update collections set updated_at = $2 where id = $1', [c.id, ctx.clock.now()]);
    return { collected: false, changed: !!del };
  });

  /** A public collection, for anyone: its name, who made it, and the events the public can see. */
  app.get<{ Params: { slug: string } }>('/collections/:slug', async (req) => {
    const c = await one<any>(ctx.db,
      `select c.*, u.name as owner_name from collections c join users u on u.id = c.user_id where c.slug = $1 and c.is_public`, [req.params.slug]);
    if (!c) throw missing();
    const now = ctx.clock.now();
    const viewerId = req.session?.user?.id ?? null;
    const rows = await many<any>(ctx.db,
      `select ${CARD_COLUMNS} from collection_items i join events e on e.id = i.event_id join organizers o on o.id = e.organizer_id
        where i.collection_id = $1 and ${VISIBLE} order by (e.ends_at < $2), e.starts_at`, [c.id, now]);
    const viewer = viewerId ? await loadViewer(ctx.db, viewerId, rows.map((r) => r.id)) : null;
    const owner = (c.owner_name as string | null)?.trim() || null;
    return {
      name: c.name, slug: c.slug, url: collectionUrl(ctx, c.slug),
      owner: { name: owner, initials: owner ? initialsOf(owner) : null },
      mine: viewerId === c.user_id,
      count: rows.length,
      items: rows.map((r) => presentCard(r, { now, viewer })),
    };
  });
}
