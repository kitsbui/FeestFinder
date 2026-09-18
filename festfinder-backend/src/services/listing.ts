import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { L } from '../lib/i18n.ts';
import { notifyUser } from './notify.ts';

/**
 * A listing just went live. Tell, once each: people following one of its artists,
 * people following the organiser, and people whose Smart Alert it matches.
 */
export async function announceNewListing(q: Queryable, eventId: string, now: Date): Promise<number> {
  const ev = await one<any>(q,
    `select e.id, e.title, e.genre, e.area, e.artists, e.price_from, e.entry_mode, e.organizer_id, o.name as org_name
       from events e join organizers o on o.id = e.organizer_id where e.id = $1`, [eventId]);
  if (!ev) return 0;
  const told = new Set<string>();
  const link = { screen: 'event', eventId: ev.id };

  const artistFans = await many<any>(q, 'select user_id, artist from artist_follows where artist = any($1::text[])', [ev.artists]);
  for (const f of artistFans) {
    if (told.has(f.user_id)) continue;
    told.add(f.user_id);
    await notifyUser(q, now, {
      userId: f.user_id, topic: 'artists', kind: 'artist_show', link, dedupeKey: `new-listing:${ev.id}`,
      title: L(`${f.artist} announced a show in Ho Chi Minh City`, `${f.artist} có show ở TP.HCM`),
      body: { en: ev.title, vi: ev.title },
    });
  }

  const orgFans = await many<any>(q, 'select user_id from organizer_follows where organizer_id = $1', [ev.organizer_id]);
  for (const f of orgFans) {
    if (told.has(f.user_id)) continue;
    told.add(f.user_id);
    await notifyUser(q, now, {
      userId: f.user_id, topic: 'orgs', kind: 'organizer_listing', link, dedupeKey: `new-listing:${ev.id}`,
      title: L(`New from ${ev.org_name}`, `Sự kiện mới từ ${ev.org_name}`),
      body: { en: ev.title, vi: ev.title },
    });
  }

  const alerts = await many<any>(q,
    `select user_id from smart_alerts
      where enabled
        and (cardinality(genres) = 0 or $1 = any(genres))
        and (cardinality(artists) = 0 or artists && $2::text[])
        and (cardinality(organizer_ids) = 0 or $3 = any(organizer_ids))
        and (cardinality(areas) = 0 or $4 = any(areas))
        and (price_cap is null or (price_cap = 0 and ($5 = 'free' or $6 = 0)) or (price_cap > 0 and $6 <= price_cap))`,
    [ev.genre, ev.artists, ev.organizer_id, ev.area, ev.entry_mode, ev.price_from]);
  for (const a of alerts) {
    if (told.has(a.user_id)) continue;
    told.add(a.user_id);
    await notifyUser(q, now, {
      userId: a.user_id, topic: null, kind: 'smart_alert', link, dedupeKey: `new-listing:${ev.id}`,
      title: L('Smart Alert · new match', 'Smart Alert · sự kiện mới khớp'),
      body: { en: ev.title, vi: ev.title },
    });
  }
  return told.size;
}
