/**
 * Badges: milestones read from what already happened on FeestFinder (door scans and check-ins,
 * shares people opened, published shows and events, sold-out nights, timetables). The catalogue
 * is the Kính đêm boards' starter set, without the badges that would count followers (follower
 * counts never rank anyone here) and without an organiser rating or response time (there is no
 * source for either).
 *
 * Progress is computed for one subject when its page is read, and for everyone by the hourly
 * job; the first time a threshold is met the award is written with its date. Rarity is the share
 * of the role that holds the badge.
 */
import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { GENRE_FAMILIES, L, type GenreFamily, type Localized } from '../lib/i18n.ts';
import { artistKey } from './artists.ts';

export type BadgeRole = 'user' | 'artist' | 'organizer';
type Family = GenreFamily | 'free';

interface BadgeDef {
  code: string;
  role: BadgeRole;
  family: Family;
  /** A shape emblem, or a number on the ring. */
  emblem: 'shape' | 'num';
  threshold: number;
  label: Localized;
  rule: Localized;
}

const b = (role: BadgeRole, code: string, family: Family, emblem: 'shape' | 'num', threshold: number, label: Localized, rule: Localized): BadgeDef =>
  ({ role, code, family, emblem, threshold, label, rule });

export const BADGE_CATALOGUE: BadgeDef[] = [
  b('user', 'first', 'free', 'shape', 1, L('First night', 'Lần đầu'), L('Go to your first event listed on FeestFinder.', 'Tham dự sự kiện đầu tiên qua FeestFinder.')),
  b('user', 'four_families', 'free', 'num', 4, L('All four', 'Đủ 4 gu'), L('Go to all four kinds: festival, live music, EDM and culture.', 'Đi đủ 4 thể loại: Lễ hội, Nhạc sống, EDM và Văn hoá.')),
  b('user', 'passport_10', 'fest', 'num', 10, L('Passport 10', 'Hộ chiếu 10'), L('Go to 10 events listed on FeestFinder.', 'Tham dự 10 sự kiện đăng trên FeestFinder.')),
  b('user', 'night_owl', 'edm', 'shape', 5, L('Night owl', 'Cú đêm'), L('Go to 5 events that end after midnight.', 'Đi 5 sự kiện kết thúc sau nửa đêm.')),
  b('user', 'doors', 'live', 'shape', 3, L('Doors open', 'Mở cửa'), L('Check in within the first hour at 3 events.', 'Check-in trong giờ đầu tiên ở 3 sự kiện.')),
  b('user', 'local', 'cult', 'shape', 5, L('Local', 'Thổ địa'), L('Go to events in 5 different districts.', 'Đi sự kiện ở 5 quận khác nhau.')),
  b('user', 'passport_25', 'fest', 'num', 25, L('Passport 25', 'Hộ chiếu 25'), L('Go to 25 events listed on FeestFinder.', 'Tham dự 25 sự kiện đăng trên FeestFinder.')),
  b('user', 'superfan', 'edm', 'shape', 3, L('Superfan', 'Fan cứng'), L('See 3 shows of the same artist you follow.', 'Xem 3 show của cùng một nghệ sĩ bạn theo dõi.')),
  b('user', 'spread', 'live', 'shape', 10, L('Spreads the word', 'Lan toả'), L('Share 10 events that someone opens.', 'Chia sẻ 10 sự kiện và có người mở link.')),

  b('artist', 'debut', 'free', 'shape', 1, L('Debut', 'Ra mắt'), L('A first show listed on FeestFinder.', 'Đăng show đầu tiên trên FeestFinder.')),
  b('artist', 'shows_25', 'fest', 'num', 25, L('25 shows', '25 show'), L('Play 25 shows listed on FeestFinder.', 'Diễn 25 show được đăng trên FeestFinder.')),
  b('artist', 'touring', 'live', 'shape', 5, L('On tour', 'Lưu diễn'), L('Play in 5 different cities.', 'Diễn ở 5 thành phố khác nhau.')),
  b('artist', 'closer', 'edm', 'shape', 10, L('Closer', 'Khép đêm'), L('Play the last set of the night at 10 events.', 'Chơi set cuối đêm ở 10 sự kiện.')),
  b('artist', 'sold_out', 'fest', 'shape', 1, L('Sold out', 'Cháy vé'), L('A show with you on the line-up sells out.', 'Một show có tên bạn trong line-up bán hết vé.')),
  b('artist', 'shows_50', 'edm', 'num', 50, L('50 shows', '50 show'), L('Play 50 shows listed on FeestFinder.', 'Diễn 50 show được đăng trên FeestFinder.')),

  b('organizer', 'verified', 'free', 'shape', 1, L('Verified', 'Đã xác minh'), L('Business licence and contacts checked by FeestFinder.', 'Giấy phép kinh doanh và thông tin liên hệ đã được FeestFinder đối chiếu.')),
  b('organizer', 'events_50', 'fest', 'num', 50, L('50 events', '50 sự kiện'), L('List 50 events on FeestFinder.', 'Đăng 50 sự kiện trên FeestFinder.')),
  b('organizer', 'sold_out_5', 'fest', 'shape', 5, L('Sold out ×5', 'Cháy vé ×5'), L('5 events sell out.', '5 sự kiện bán hết vé.')),
  b('organizer', 'all_families', 'free', 'num', 4, L('Every kind', 'Đa thể loại'), L('Run all four kinds: festival, live music, EDM and culture.', 'Tổ chức đủ 4 thể loại: Lễ hội, Nhạc sống, EDM và Văn hoá.')),
  b('organizer', 'events_100', 'fest', 'num', 100, L('100 events', '100 sự kiện'), L('List 100 events on FeestFinder.', 'Đăng 100 sự kiện trên FeestFinder.')),
];

/** The number a badge shows on its ring. */
const ringNumber = (d: BadgeDef) => (d.emblem === 'num' ? String(d.threshold) : null);

const FAMILY_OF: Record<string, GenreFamily> = Object.fromEntries(
  (Object.entries(GENRE_FAMILIES) as [GenreFamily, readonly string[]][]).flatMap(([f, gs]) => gs.map((g) => [g, f])),
);
const families = (genres: (string | null)[]) => new Set(genres.map((g) => (g ? FAMILY_OF[g] : undefined)).filter(Boolean)).size;

/** How far one subject is towards each of its role's badges. */
export async function progressFor(q: Queryable, role: BadgeRole, id: string, now: Date): Promise<Record<string, number>> {
  if (role === 'user') return userProgress(q, id, now);
  if (role === 'artist') return artistProgress(q, id, now);
  return organizerProgress(q, id);
}

async function userProgress(q: Queryable, userId: string, now: Date): Promise<Record<string, number>> {
  // A night counts once the door scanned the ticket or the person checked in on the site (as the passport does).
  const [nights, follows, shared] = await Promise.all([
    many<any>(q,
      `select e.id, e.genre, e.area, e.start_time, e.end_time, e.starts_at, min(x.checked_in_at) as checked_in_at
         from (select event_id, checked_in_at from tickets where user_id = $1 and status = 'used'
               union all select event_id, null from presence where user_id = $1) x
         join events e on e.id = x.event_id
        where e.starts_at <= $2
        group by e.id`, [userId, now]),
    many<{ artist: string }>(q, 'select artist from artist_follows where user_id = $1', [userId]),
    one<{ n: number }>(q, 'select count(distinct event_id)::int as n from share_visits where ref_user = $1', [userId]),
  ]);
  const count = nights.length;
  let superfan = 0;
  if (follows.length && count) {
    const keys = follows.map((f) => artistKey(f.artist));
    const rows = await many<{ artist_id: string }>(q,
      `select ea.artist_id from event_artists ea join artists a on a.id = ea.artist_id
        where ea.event_id = any($1::uuid[]) and (a.normalized_name = any($2::text[]) or a.alias_keys && $2::text[])`,
      [nights.map((n) => n.id), keys]);
    const per = new Map<string, number>();
    for (const r of rows) per.set(r.artist_id, (per.get(r.artist_id) ?? 0) + 1);
    superfan = Math.max(0, ...per.values());
  }
  return {
    first: count, passport_10: count, passport_25: count,
    four_families: families(nights.map((n) => n.genre)),
    night_owl: nights.filter((n) => n.start_time && n.end_time && n.end_time < n.start_time).length,
    doors: nights.filter((n) => n.checked_in_at && new Date(n.checked_in_at).getTime() - new Date(n.starts_at).getTime() <= 3600_000).length,
    local: new Set(nights.map((n) => n.area).filter(Boolean)).size,
    superfan,
    spread: shared!.n,
  };
}

async function artistProgress(q: Queryable, artistId: string, now: Date): Promise<Record<string, number>> {
  const [shows, me] = await Promise.all([
    many<any>(q,
      `select e.id, e.city, e.sold_out from event_artists ea join events e on e.id = ea.event_id
        where ea.artist_id = $1 and e.status = 'live' and e.published_at is not null`, [artistId]),
    one<{ normalized_name: string; alias_keys: string[] | null }>(q, 'select normalized_name, alias_keys from artists where id = $1', [artistId]),
  ]);
  const played = shows;
  // The last set of each day of each event this artist was billed on, from the timetables.
  const lasts = played.length ? await many<{ artist: string }>(q,
    `select s.artist from sets s
      where s.event_id = any($1::uuid[]) and s.starts_at <= $2
        and s.ends_at = (select max(s2.ends_at) from sets s2 where s2.event_id = s.event_id and s2.day = s.day)`,
    [played.map((s) => s.id), now]) : [];
  const keys = new Set([me?.normalized_name, ...(me?.alias_keys ?? [])].filter(Boolean));
  const n = played.length;
  return {
    debut: n, shows_25: n, shows_50: n,
    touring: new Set(played.map((s) => s.city)).size,
    closer: lasts.filter((s) => keys.has(artistKey(s.artist))).length,
    sold_out: played.filter((s) => s.sold_out).length,
  };
}

async function organizerProgress(q: Queryable, organizerId: string): Promise<Record<string, number>> {
  const [o, events] = await Promise.all([
    one<{ verification_state: string }>(q, 'select verification_state from organizers where id = $1', [organizerId]),
    many<{ genre: string | null; sold_out: boolean }>(q, 'select genre, sold_out from events where organizer_id = $1 and published_at is not null', [organizerId]),
  ]);
  const n = events.length;
  return {
    verified: o?.verification_state === 'verified' ? 1 : 0,
    events_50: n, events_100: n,
    sold_out_5: events.filter((e) => e.sold_out).length,
    all_families: families(events.map((e) => e.genre)),
  };
}

/** Writes the awards a subject has newly reached. Returns how many were new. */
export async function award(q: Queryable, role: BadgeRole, id: string, progress: Record<string, number>, now: Date): Promise<number> {
  const met = BADGE_CATALOGUE.filter((d) => d.role === role && (progress[d.code] ?? 0) >= d.threshold).map((d) => d.code);
  if (!met.length) return 0;
  const rows = await many(q,
    `insert into badge_awards (subject_kind, subject_id, code, earned_at)
     select $1, $2, code, $4 from unnest($3::text[]) as code
     on conflict do nothing returning 1`, [role, id, met, now]);
  return rows.length;
}

const ROLE_SIZE: Record<BadgeRole, string> = {
  user: `select count(*)::int as n from users where role = 'user'`,
  artist: 'select count(*)::int as n from artists',
  organizer: 'select count(*)::int as n from organizers',
};

export interface BadgeView {
  code: string; family: Family; emblem: 'shape' | 'num'; ring: string | null; label: Localized; rule: Localized;
  threshold: number; value: number; earned: boolean; earnedAt: Date | null; isNew: boolean; rarityPct: number | null;
}

/**
 * A subject's badges, earned first (newest first), then the ones in progress (closest first).
 * Reading them awards what is newly reached. `own` marks the new ones as seen.
 */
export async function badgesOf(q: Queryable, role: BadgeRole, id: string, now: Date, opts: { own?: boolean } = {}): Promise<BadgeView[]> {
  const progress = await progressFor(q, role, id, now);
  await award(q, role, id, progress, now);
  const [awards, held, size] = await Promise.all([
    many<{ code: string; earned_at: Date; seen_at: Date | null }>(q, 'select code, earned_at, seen_at from badge_awards where subject_kind = $1 and subject_id = $2', [role, id]),
    many<{ code: string; n: number }>(q, 'select code, count(*)::int as n from badge_awards where subject_kind = $1 group by code', [role]),
    one<{ n: number }>(q, ROLE_SIZE[role]),
  ]);
  const byCode = new Map(awards.map((a) => [a.code, a]));
  const holders = new Map(held.map((h) => [h.code, h.n]));
  const views = BADGE_CATALOGUE.filter((d) => d.role === role).map((d): BadgeView => {
    const a = byCode.get(d.code);
    const share = size?.n ? ((holders.get(d.code) ?? 0) / size.n) * 100 : null;
    return {
      code: d.code, family: d.family, emblem: d.emblem, ring: ringNumber(d), label: d.label, rule: d.rule,
      threshold: d.threshold, value: Math.min(progress[d.code] ?? 0, d.threshold), earned: !!a, earnedAt: a?.earned_at ?? null,
      isNew: !!a && !a.seen_at && now.getTime() - new Date(a.earned_at).getTime() < 14 * 86400_000,
      rarityPct: share === null ? null : share < 1 && share > 0 ? Math.round(share * 10) / 10 : Math.round(share),
    };
  });
  if (opts.own && views.some((v) => v.isNew)) {
    await q.query('update badge_awards set seen_at = $3 where subject_kind = $1 and subject_id = $2 and seen_at is null', [role, id, now]);
  }
  return [
    ...views.filter((v) => v.earned).sort((x, y) => new Date(y.earnedAt!).getTime() - new Date(x.earnedAt!).getTime()),
    ...views.filter((v) => !v.earned).sort((x, y) => y.value / y.threshold - x.value / x.threshold),
  ];
}

/** The hourly job: everyone who could have reached something since the last run. */
export async function awardAll(q: Queryable, now: Date): Promise<number> {
  const [users, artists, orgs] = await Promise.all([
    many<{ id: string }>(q,
      `select distinct user_id as id from tickets where status = 'used' and user_id is not null
       union select user_id from presence union select ref_user from share_visits`),
    many<{ id: string }>(q, `select distinct ea.artist_id as id from event_artists ea join events e on e.id = ea.event_id where e.published_at is not null`),
    many<{ id: string }>(q, `select id from organizers where verification_state = 'verified' or exists (select 1 from events e where e.organizer_id = organizers.id and e.published_at is not null)`),
  ]);
  let made = 0;
  for (const [role, list] of [['user', users], ['artist', artists], ['organizer', orgs]] as [BadgeRole, { id: string }[]][]) {
    for (const s of list) made += await award(q, role, s.id, await progressFor(q, role, s.id, now), now);
  }
  return made;
}
