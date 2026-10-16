import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { fill, L } from '../lib/i18n.ts';
import { cityLabel } from '../lib/places.ts';
import { notifyOrganizer, notifyUser } from './notify.ts';

/*
 * The lineup handshake (D13, migration 041). A profile an artist runs is the official one for its
 * name: every lineup that names it points at it. Nothing lands on anyone's lineup without the
 * other side: an organiser who lists such an artist asks them to confirm ("Đây là tôi" or "Không
 * phải tôi"), and an artist who says they play a listed night asks the organiser to add them.
 * Each side is told in the app once per event (the notification's dedupe key).
 */

const when = (e: { starts_on: string | null; city: string | null }) => {
  const c = cityLabel(e.city);
  const d = e.starts_on ? String(e.starts_on).slice(0, 10) : null;
  return { en: [d, c?.en].filter(Boolean).join(' · '), vi: [d, c?.vi].filter(Boolean).join(' · ') };
};

/**
 * After an organiser submits or publishes a listing (or changes the lineup of a live one): each
 * artist on it who runs their profile and has not answered yet is asked to confirm.
 */
export async function askArtistsToConfirm(q: Queryable, eventId: string, now: Date): Promise<number> {
  const rows = await many<any>(q,
    `select a.id as artist_id, a.owner_user_id, e.id, e.title, e.starts_on::text as starts_on, e.city, o.name as org_name
       from event_artists ea join artists a on a.id = ea.artist_id join events e on e.id = ea.event_id join organizers o on o.id = e.organizer_id
      where ea.event_id = $1 and a.owner_user_id is not null and ea.confirmed_at is null and ea.disputed_at is null
        and e.status in ('in_review', 'live') and (e.submitted_by is null or e.submitted_by <> a.owner_user_id)`, [eventId]);
  let sent = 0;
  for (const r of rows) {
    const w = when(r);
    const ok = await notifyUser(q, now, {
      userId: r.owner_user_id, topic: 'artists', kind: 'lineup_added', dedupeKey: `lineup:${r.id}:${r.artist_id}`,
      title: L(`${r.org_name} put you on the lineup of ${r.title}`, `${r.org_name} đã đưa bạn vào lineup ${r.title}`),
      body: w,
      cta: L('Confirm or say it is not you', 'Xác nhận hoặc báo không phải bạn'),
      link: { url: `/studio/artist/gigs?confirm=${r.id}` },
    });
    if (ok) sent++;
  }
  return sent;
}

/** What the artist answers: "Đây là tôi" (confirm) or "Không phải tôi" (dispute). */
export async function confirmLineup(q: Queryable, artistId: string, eventId: string, now: Date): Promise<boolean> {
  const r = await one(q,
    `update event_artists set confirmed_at = coalesce(confirmed_at, $3),
            confirmed_by = case when confirmed_by in ('organizer', 'both') then 'both' else 'artist' end, disputed_at = null, disputed_note = null
      where event_id = $1 and artist_id = $2 returning 1`, [eventId, artistId, now]);
  return !!r;
}

export async function disputeLineup(q: Queryable, artistId: string, eventId: string, note: string | null, now: Date): Promise<boolean> {
  const row = await one<any>(q,
    `select a.normalized_name, a.name, e.organizer_id, e.title from event_artists ea join artists a on a.id = ea.artist_id join events e on e.id = ea.event_id
      where ea.event_id = $1 and ea.artist_id = $2`, [eventId, artistId]);
  if (!row) return false;
  // The name stays in the lineup the organiser typed; it just is not this artist, and is not linked to them again here.
  await q.query('delete from event_artists where event_id = $1 and artist_id = $2', [eventId, artistId]);
  await q.query(
    `insert into lineup_disputes (event_id, normalized_name, artist_id, note, created_at) values ($1,$2,$3,$4,$5)
     on conflict (event_id, normalized_name) do update set note = excluded.note, created_at = excluded.created_at`,
    [eventId, row.normalized_name, artistId, note, now]);
  await notifyOrganizer(q, now, {
    organizerId: row.organizer_id, topic: 'bookings', kind: 'gig',
    title: L(`${row.name} says they are not on ${row.title}`, `${row.name} báo không diễn ở ${row.title}`),
    body: note ? { en: note, vi: note } : L('Their profile is no longer linked to this listing.', 'Hồ sơ của họ không còn gắn với tin này.'),
    link: { screen: 'dash', eventId },
  });
  return true;
}

/**
 * An artist's gig report matched a night an organiser listed, and the artist is not on its lineup:
 * the organiser is asked to add them (never added by the report itself).
 */
export async function askOrganizerToAdd(q: Queryable, reportId: string, now: Date): Promise<boolean> {
  const r = await one<any>(q,
    `select g.id, g.artist_id, a.name, e.id as event_id, e.title, e.organizer_id, o.is_community
       from artist_gig_reports g join artists a on a.id = g.artist_id join events e on e.id = g.event_id join organizers o on o.id = e.organizer_id
      where g.id = $1 and g.outcome = 'merged'
        and not exists (select 1 from event_artists ea where ea.event_id = e.id and ea.artist_id = g.artist_id)`, [reportId]);
  // Radar and community listings have nobody to ask: the team sees the report in its queue.
  if (!r || r.is_community) return false;
  await notifyOrganizer(q, now, {
    organizerId: r.organizer_id, topic: 'bookings', kind: 'gig',
    title: L(`${r.name} says they play ${r.title}`, `${r.name} báo diễn ở ${r.title}`),
    body: L('Add them to the lineup, or say it is not right.', 'Thêm vào lineup, hoặc báo không đúng.'),
    cta: L('Answer', 'Trả lời'), link: { screen: 'gigs' }, dedupeKey: `lineup-claim:${r.id}`,
  });
  return true;
}

/**
 * When an artist starts or takes over a profile whose name is already on lineups still to come:
 * one notice for them with how many, and a word to each organiser concerned.
 */
export async function announceTakeover(q: Queryable, artistId: string, now: Date): Promise<number> {
  const a = await one<{ name: string; owner_user_id: string | null }>(q, 'select name, owner_user_id from artists where id = $1', [artistId]);
  if (!a?.owner_user_id) return 0;
  const rows = await many<any>(q,
    `select e.id, e.title, e.organizer_id, o.is_community from event_artists ea join events e on e.id = ea.event_id join organizers o on o.id = e.organizer_id
      where ea.artist_id = $1 and ea.confirmed_at is null and e.status = 'live' and e.ends_at >= $2`, [artistId, now]);
  if (!rows.length) return 0;
  await notifyUser(q, now, {
    userId: a.owner_user_id, topic: 'artists', kind: 'lineup_pending', dedupeKey: `lineup-pending:${artistId}:${now.toISOString().slice(0, 10)}`,
    title: fill(L('{n} upcoming shows list your name', 'Có {n} show sắp tới đang ghi tên bạn'), { n: String(rows.length) }),
    body: L('Confirm each one, or say it is not you.', 'Xác nhận từng show, hoặc báo không phải bạn.'),
    link: { url: '/studio/artist/gigs?confirm=all' },
  });
  for (const r of rows) {
    if (r.is_community) continue;
    await notifyOrganizer(q, now, {
      organizerId: r.organizer_id, topic: 'bookings', kind: 'gig', dedupeKey: `artist-joined:${artistId}:${r.id}`,
      title: L(`${a.name} now runs their profile`, `${a.name} vừa mở hồ sơ trên FeestFinder`),
      body: L(`They are on the lineup of ${r.title}.`, `Họ đang có tên trong lineup ${r.title}.`),
      link: { screen: 'dash', eventId: r.id },
    });
  }
  return rows.length;
}

/** The shows an artist's name is on, with where each handshake stands, for their studio. */
export async function lineupOf(q: Queryable, artistId: string, now: Date) {
  const rows = await many<any>(q,
    `select e.id, e.slug, e.title, e.status, e.starts_on::text as starts_on, e.city, o.name as org_name, o.is_community,
            ea.confirmed_at, ea.confirmed_by
       from event_artists ea join events e on e.id = ea.event_id join organizers o on o.id = e.organizer_id
      where ea.artist_id = $1 and e.status in ('in_review', 'live') and (e.ends_at is null or e.ends_at >= $2)
      order by e.starts_at nulls last limit 100`, [artistId, now]);
  return rows.map((r) => ({
    event: { id: r.id, slug: r.slug, title: r.title, status: r.status, startsOn: r.starts_on, city: r.city, cityLabel: cityLabel(r.city) },
    organizer: r.is_community ? null : r.org_name,
    confirmedBy: r.confirmed_by as 'artist' | 'organizer' | 'both' | null,
    confirmed: !!r.confirmed_at,
  }));
}
