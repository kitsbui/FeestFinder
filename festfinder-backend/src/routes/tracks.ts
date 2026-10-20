import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, json } from '../db/index.ts';
import type { Row } from '../db/rows.ts';
import { conflict, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { parse, uuid } from '../lib/validate.ts';
import { requireUser, requireWriter } from '../http/guards.ts';
import { presentTrack, readTrack, tracksOf, TRACKS_MAX } from '../services/audio.ts';

/*
 * An artist's MP3 playlist (migration 061, services/audio.ts): up to ten tracks, each an https
 * link to an MP3 the artist hosts, measured once when added. The page plays them in its own
 * waveform player (festfinder-web kd/web/artist/playlist.tsx).
 *
 *   GET    /me/artist/tracks           the owner's list
 *   POST   /me/artist/tracks           { url, title } add one (public: a sign-in is enough, as for mixes)
 *   PATCH  /me/artist/tracks/:id       { title }
 *   DELETE /me/artist/tracks/:id
 *   PUT    /me/artist/tracks/order     { ids }
 */

const Url = z.string().trim().max(1000).regex(/^https:\/\/[^\s"'<>]+$/, 'an https link');

export default async function trackRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const ownArtist = async (userId: string) => {
    const a = await one<{ id: string }>(ctx.db, 'select id from artists where owner_user_id = $1', [userId]);
    if (!a) throw notFound(L('You have no artist profile yet', 'Bạn chưa có hồ sơ nghệ sĩ'));
    return a;
  };
  const ownTrack = async (artistId: string, id: string) => {
    const t = await one<Row<'artist_tracks'>>(ctx.db, 'select * from artist_tracks where id = $1 and artist_id = $2', [parse(uuid, id), artistId]);
    if (!t) throw notFound(L('This track is not on your playlist', 'Bài này không có trong playlist của bạn'));
    return t;
  };

  app.get('/me/artist/tracks', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    return { items: await tracksOf(ctx.db, a.id), max: TRACKS_MAX };
  });

  app.post('/me/artist/tracks', async (req, reply) => {
    const s = requireWriter(req);
    const a = await ownArtist(s.user.id);
    const b = parse(z.object({ url: Url, title: z.string().trim().min(1).max(200) }), req.body);
    const n = await one<{ n: number }>(ctx.db, 'select count(*)::int as n from artist_tracks where artist_id = $1', [a.id]);
    if (n!.n >= TRACKS_MAX) throw conflict('tracks_full', L(`Up to ${TRACKS_MAX} tracks; remove one first`, `Tối đa ${TRACKS_MAX} bài; hãy xoá bớt một bài`));
    if (await one(ctx.db, 'select 1 from artist_tracks where artist_id = $1 and url = $2', [a.id, b.url])) throw conflict('track_exists', L('This track is on your playlist already', 'Bài này đã có trong playlist'));
    // Measured before the row is written: a file that cannot be read never reaches the page.
    const m = await readTrack(ctx, b.url);
    const row = await one<Row<'artist_tracks'>>(ctx.db,
      `insert into artist_tracks (artist_id, sort, url, title, duration_s, peaks, bytes, created_at)
       values ($1, (select coalesce(max(sort) + 1, 0) from artist_tracks where artist_id = $1), $2, $3, $4, $5, $6, $7)
       on conflict (artist_id, url) do nothing returning *`,
      [a.id, b.url, b.title, m.durationS, json(m.peaks), m.bytes, ctx.clock.now()]);
    if (!row) throw conflict('track_exists', L('This track is on your playlist already', 'Bài này đã có trong playlist'));
    return reply.code(201).send({ ...presentTrack(row), message: L('Track added', 'Đã thêm bài') });
  });

  app.patch<{ Params: { id: string } }>('/me/artist/tracks/:id', async (req) => {
    const s = requireWriter(req);
    const a = await ownArtist(s.user.id);
    const t = await ownTrack(a.id, req.params.id);
    const { title } = parse(z.object({ title: z.string().trim().min(1).max(200) }), req.body);
    return presentTrack((await one<Row<'artist_tracks'>>(ctx.db, 'update artist_tracks set title = $2 where id = $1 returning *', [t.id, title]))!);
  });

  app.delete<{ Params: { id: string } }>('/me/artist/tracks/:id', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const t = await ownTrack(a.id, req.params.id);
    await ctx.db.query('delete from artist_tracks where id = $1', [t.id]);
    return { ok: true, message: L('Track removed', 'Đã xoá bài') };
  });

  app.put('/me/artist/tracks/order', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const { ids } = parse(z.object({ ids: z.array(uuid).max(TRACKS_MAX) }), req.body);
    await ctx.db.tx(async (q) => {
      for (const [i, id] of ids.entries()) await q.query('update artist_tracks set sort = $3 where id = $1 and artist_id = $2', [id, a.id, i]);
    });
    return { items: await tracksOf(ctx.db, a.id) };
  });
}
