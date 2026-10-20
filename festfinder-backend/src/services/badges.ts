/**
 * Raver badges (growth plan card E, owner 2026-10-20: "keep it fun"): 53 achievements read from
 * what people already did on FeestFinder: the nights they went to (services/attendance.ts),
 * where and what, what they said, shared, planned and followed; artists and organisers have a
 * set of their craft. Nothing is scored or ranked: rarity is the share of people who hold a badge,
 * and no badge unlocks anything.
 *
 * Awarding: after the actions that can reach one (awardSoon), and by the hourly job for people
 * active in the last seven days and for the badges that stand for a state (verified, calendar).
 * Reading a subject's badges awards what is newly reached too. The first time a badge is met its
 * date is written (badge_awards); a person is told, at most three a hour.
 */
import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { festivalByKey } from '../lib/festivals.ts';
import { cityOf } from '../lib/places.ts';
import { attendedEvents } from './attendance.ts';
import { artistKey } from './artists.ts';
import { notifyUser } from './notify.ts';

export type BadgeRole = 'user' | 'artist' | 'organizer';
/** The emblem's dot: the site's genre palette (festfinder-web/src/kd/genre.ts). */
type Family = 'fest' | 'live' | 'edm' | 'cult' | 'free';
export type BadgeGroup = 'night' | 'explore' | 'community' | 'spread' | 'plan' | 'profile' | 'artist' | 'organizer';
/** Common, rare, legendary: the ring's colour (decision D15). */
export type BadgeTier = 'common' | 'rare' | 'legendary';

interface BadgeDef {
  code: string;
  role: BadgeRole;
  group: BadgeGroup;
  tier: BadgeTier;
  /** A Phosphor icon's name for the sprite (festfinder-web/public/kd/badges.svg), or null: the number shows. */
  icon: string | null;
  threshold: number;
  label: Localized;
  rule: Localized;
}

const FAMILY: Record<BadgeGroup, Family> = { night: 'edm', explore: 'live', community: 'cult', spread: 'cult', plan: 'free', profile: 'free', artist: 'live', organizer: 'fest' };
export const GROUP_LABEL: Record<BadgeGroup, Localized> = {
  night: L('Nights', 'Đêm'), explore: L('Exploring', 'Khám phá'), community: L('Community', 'Cộng đồng'), spread: L('Spreading', 'Lan toả'),
  plan: L('Plans and follows', 'Kế hoạch và theo dõi'), profile: L('Profile', 'Hồ sơ'), artist: L('Artist', 'Nghệ sĩ'), organizer: L('Organiser', 'Nhà tổ chức'),
};

const T = { c: 'common', r: 'rare', l: 'legendary' } as const;
const d = (role: BadgeRole, group: BadgeGroup, code: string, tier: keyof typeof T, icon: string | null, threshold: number, label: Localized, rule: Localized): BadgeDef =>
  ({ role, group, code, tier: T[tier], icon, threshold, label, rule });
const u = (group: BadgeGroup, code: string, tier: keyof typeof T, icon: string | null, threshold: number, label: Localized, rule: Localized) => d('user', group, code, tier, icon, threshold, label, rule);

export const BADGE_CATALOGUE: BadgeDef[] = [
  // ---- nights (9)
  u('night', 'first', 'c', 'Sparkle', 1, L('First night', 'Lần đầu'), L('Go to a first night listed on FeestFinder.', 'Đi đêm đầu tiên đăng trên FeestFinder.')),
  u('night', 'passport_10', 'c', null, 10, L('Passport 10', 'Hộ chiếu 10'), L('Go to 10 nights.', 'Đi 10 đêm.')),
  u('night', 'passport_25', 'c', null, 25, L('Passport 25', 'Hộ chiếu 25'), L('Go to 25 nights.', 'Đi 25 đêm.')),
  u('night', 'passport_50', 'r', null, 50, L('Fifty', 'Nửa trăm'), L('Go to 50 nights.', 'Đi 50 đêm.')),
  u('night', 'passport_100', 'l', null, 100, L('A hundred nights', 'Trăm đêm'), L('Go to 100 nights.', 'Đi 100 đêm.')),
  u('night', 'night_owl', 'c', 'Moon', 5, L('Night owl', 'Cú đêm'), L('Go to 5 nights that end after midnight.', 'Đi 5 đêm kết thúc sau nửa đêm.')),
  u('night', 'sunrise', 'r', 'SunHorizon', 3, L('Sunrise', 'Đón bình minh'), L('Go to 3 nights that end after 05:00.', 'Đi 3 đêm kết thúc sau 05:00.')),
  u('night', 'daylight', 'c', 'Sun', 3, L('Day party', 'Ban ngày'), L('Go to 3 daytime parties.', 'Đi 3 sự kiện ban ngày.')),
  u('night', 'streak_3', 'r', 'Repeat', 3, L('Three months running', 'Đều nhịp'), L('Go out in 3 months in a row.', 'Đi ít nhất một đêm trong 3 tháng liền nhau.')),
  // ---- exploring (9)
  u('explore', 'four_styles', 'c', 'Waveform', 4, L('Four styles', 'Đủ 4 dòng'), L('Go to nights in 4 different styles.', 'Đi đêm thuộc 4 dòng nhạc khác nhau.')),
  u('explore', 'local', 'c', 'MapPin', 5, L('Local', 'Thổ địa'), L('Go out in 5 districts of one city.', 'Đi đêm ở 5 quận của một thành phố.')),
  u('explore', 'two_cities', 'c', 'Buildings', 2, L('Two cities', 'Hai thành phố'), L('Go to nights in 2 cities.', 'Đi đêm ở 2 thành phố.')),
  u('explore', 'five_cities', 'r', 'GlobeHemisphereEast', 5, L('Five cities', 'Năm thành phố'), L('Go to nights in 5 cities.', 'Đi đêm ở 5 thành phố.')),
  u('explore', 'abroad', 'r', 'Airplane', 2, L('Abroad', 'Xuất ngoại'), L('Go to nights in 2 countries.', 'Đi đêm ở 2 nước.')),
  u('explore', 'festival_first', 'c', 'Tent', 1, L('First festival', 'Lễ hội đầu'), L('Go to a festival.', 'Đi một lễ hội.')),
  u('explore', 'festival_5', 'r', 'Flag', 5, L('Festival regular', 'Dân lễ hội'), L('Go to 5 festivals.', 'Đi 5 lễ hội.')),
  u('explore', 'flagship', 'r', 'Crown', 1, L('World stage', 'Lễ hội lớn'), L('Go to one of the world’s biggest festivals.', 'Đi một lễ hội lớn thế giới.')),
  u('explore', 'radar_first', 'r', 'Broadcast', 1, L('Before the crowd', 'Đi trước Radar'), L('Go to a night while only Feest Radar had found it.', 'Đi một đêm khi nó mới chỉ được Feest Radar tìm thấy.')),
  // ---- community (8)
  u('community', 'comment_first', 'c', 'ChatCircle', 1, L('First comment', 'Lên tiếng'), L('Write a first comment.', 'Viết bình luận đầu tiên.')),
  u('community', 'comments_25', 'c', 'ChatsCircle', 25, L('Talker', 'Hay chuyện'), L('Write 25 comments or replies.', 'Viết 25 bình luận hoặc trả lời.')),
  u('community', 'comments_100', 'r', null, 100, L('Commentator', 'Cây bình luận'), L('Write 100 comments or replies.', 'Viết 100 bình luận hoặc trả lời.')),
  u('community', 'replies_10', 'c', 'ArrowBendUpLeft', 10, L('Replied to', 'Được hồi âm'), L('Get 10 replies to what you wrote.', 'Nhận 10 trả lời cho điều bạn viết.')),
  u('community', 'likes_25', 'c', 'Heart', 25, L('Liked 25', 'Được thích 25'), L('Get 25 likes on your comments.', 'Nhận 25 lượt thích cho bình luận của bạn.')),
  u('community', 'photo_first', 'c', 'Camera', 1, L('First shot', 'Khoảnh khắc'), L('Share a photo from a night.', 'Chia sẻ một ảnh từ một đêm.')),
  u('community', 'question_answered', 'c', 'Question', 1, L('Good question', 'Câu hỏi hay'), L('Ask something the organiser answers.', 'Hỏi một câu được nhà tổ chức trả lời.')),
  u('community', 'friends_5', 'c', 'UsersThree', 5, L('Crew of five', 'Có hội'), L('Have 5 friends on FeestFinder.', 'Có 5 bạn trên FeestFinder.')),
  // ---- spreading (8)
  u('spread', 'spread', 'c', 'MegaphoneSimple', 10, L('Spreads the word', 'Lan toả'), L('Your links are opened 10 times.', 'Link bạn chia sẻ được mở 10 lần.')),
  u('spread', 'spread_100', 'r', null, 100, L('Loudspeaker', 'Loa phường'), L('Your links are opened 100 times.', 'Link bạn chia sẻ được mở 100 lần.')),
  u('spread', 'referrer_10', 'c', 'Signpost', 10, L('Guide', 'Dẫn đường'), L('10 people tap Buy tickets through your links.', '10 người bấm Mua vé qua link của bạn.')),
  u('spread', 'referral_first', 'r', 'Handshake', 1, L('Closer', 'Chốt'), L('Someone buys a ticket through your link.', 'Có người mua vé qua link của bạn.')),
  u('spread', 'commission_first', 'r', 'Coins', 1, L('First đồng', 'Đồng đầu'), L('Earn your first commission.', 'Nhận hoa hồng đầu tiên.')),
  u('spread', 'submit_first', 'c', 'Eye', 1, L('Sharp eye', 'Mắt tinh'), L('A night you sent in goes live.', 'Một đêm bạn gửi lên được duyệt.')),
  u('spread', 'submit_10', 'r', 'Binoculars', 10, L('Feest Scout', 'Feest Scout'), L('10 nights you sent in go live.', '10 đêm bạn gửi lên được duyệt.')),
  u('spread', 'hype_25', 'c', 'Fire', 25, L('Hype hand', 'Tay hype'), L('Hype 25 nights.', 'Hype 25 đêm.')),
  // ---- plans and follows (6)
  u('plan', 'saved_50', 'c', 'BookmarkSimple', 50, L('Collector', 'Sưu tầm'), L('Save 50 nights.', 'Lưu 50 đêm.')),
  u('plan', 'follow_artists_10', 'c', 'MusicNotes', 10, L('Devoted', 'Fan ruột'), L('Follow 10 artists.', 'Theo dõi 10 nghệ sĩ.')),
  u('plan', 'superfan', 'r', 'Star', 3, L('Superfan', 'Fan cứng'), L('See 3 shows of one artist you follow.', 'Xem 3 show của cùng một nghệ sĩ bạn theo dõi.')),
  u('plan', 'plan_first', 'c', 'UsersFour', 1, L('Ringleader', 'Rủ rê'), L('Make a plan a friend says yes to.', 'Lập một kế hoạch có bạn nhận lời.')),
  u('plan', 'alert_set', 'c', 'BellRinging', 1, L('Own radar', 'Radar riêng'), L('Switch on a Smart Alert.', 'Bật một Smart Alert.')),
  u('plan', 'going_10', 'c', 'CheckCircle', 10, L('Shows up', 'Hứa là đi'), L('Say you are going to 10 nights that then happen.', 'Bấm Đi cho 10 đêm và đêm đã diễn ra.')),
  // ---- profile (2)
  u('profile', 'profile_complete', 'c', 'IdentificationCard', 1, L('Present', 'Có mặt'), L('Add your photo, name and city.', 'Thêm ảnh, tên và thành phố.')),
  u('profile', 'early_bird', 'l', 'Lightning', 1, L('Early', 'Người đầu'), L('One of the first 1,000 people to go out with FeestFinder.', 'Một trong 1.000 người đầu tiên đi đêm cùng FeestFinder.')),
  // ---- artists (6)
  d('artist', 'artist', 'debut', 'c', 'MicrophoneStage', 1, L('Debut', 'Ra mắt'), L('A first show listed on FeestFinder.', 'Show đầu tiên đăng trên FeestFinder.')),
  d('artist', 'artist', 'shows_25', 'c', null, 25, L('25 shows', '25 show'), L('Play 25 shows.', 'Diễn 25 show.')),
  d('artist', 'artist', 'shows_50', 'r', null, 50, L('50 shows', '50 show'), L('Play 50 shows.', 'Diễn 50 show.')),
  d('artist', 'artist', 'touring', 'r', 'Van', 5, L('On tour', 'Lưu diễn'), L('Play in 5 cities.', 'Diễn ở 5 thành phố.')),
  d('artist', 'artist', 'closer', 'r', 'MoonStars', 10, L('Closer', 'Khép đêm'), L('Play the last set of the night 10 times.', 'Chơi set cuối đêm 10 lần.')),
  d('artist', 'artist', 'mix_first', 'c', 'VinylRecord', 1, L('First mix', 'Có mix'), L('Add a mix to your profile.', 'Thêm một mix vào hồ sơ.')),
  // ---- organisers (5)
  d('organizer', 'organizer', 'verified', 'c', 'SealCheck', 1, L('Verified', 'Đã xác minh'), L('Business licence and contacts checked by FeestFinder.', 'Giấy phép kinh doanh và liên hệ đã được FeestFinder đối chiếu.')),
  d('organizer', 'organizer', 'first_live', 'c', 'CalendarCheck', 1, L('First listing', 'Tin đầu'), L('A first listing goes live.', 'Tin đầu tiên được duyệt.')),
  d('organizer', 'organizer', 'events_50', 'r', null, 50, L('50 events', '50 sự kiện'), L('List 50 events.', 'Đăng 50 sự kiện.')),
  d('organizer', 'organizer', 'calendar', 'c', 'CalendarPlus', 1, L('Connected', 'Lịch nối'), L('Your calendar is connected to FeestFinder.', 'Lịch của bạn đang nối với FeestFinder.')),
  d('organizer', 'organizer', 'clicks_1000', 'r', null, 1000, L('Thousand clicks', 'Nghìn click'), L('1,000 taps on Buy tickets on your listings.', '1.000 lượt bấm Mua vé trên các tin của bạn.')),
];

export const BADGE_CODES = new Set(BADGE_CATALOGUE.map((b) => b.code));
/** Badges that stand for a state rather than a milestone: shown only while the state holds. */
const LIVE_STATE = new Set(['verified', 'calendar']);
/** At most this many badge notices an hour to one person; the rest only show as new. */
const NOTICES_PER_HOUR = 3;
/** How many people count as "early". */
const EARLY = 1000;

const ringNumber = (b: BadgeDef) => (b.icon ? null : String(b.threshold));
const styleCount = (rows: { styles: string[] | null }[]) => new Set(rows.map((r) => r.styles?.[0]).filter(Boolean)).size;
const n = (r: { n: number | string | null } | null | undefined) => Number(r?.n ?? 0);

/** How far one subject is towards each of its role's badges. */
export async function progressFor(q: Queryable, role: BadgeRole, id: string, now: Date): Promise<Record<string, number>> {
  if (role === 'user') return userProgress(q, id, now);
  if (role === 'artist') return artistProgress(q, id, now);
  return organizerProgress(q, id);
}

/** The longest run of consecutive months among some dates (YYYY-MM-DD). */
function longestMonthRun(days: string[]): number {
  const months = [...new Set(days.map((x) => x.slice(0, 7)))].map((m) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1).sort((a, b) => a - b);
  let best = 0, run = 0, prev = Number.NaN;
  for (const m of months) { run = m === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = m; }
  return best;
}

async function userProgress(q: Queryable, userId: string, now: Date): Promise<Record<string, number>> {
  type Night = { id: string; styles: string[] | null; area: string | null; city: string; start_time: string | null; end_time: string | null; starts_on: string; event_type: string | null; festival: string | null };
  const [nights, me, posts, replies, likes, photos, answered, friends, visits, clicks, conversions, earned, submitted, hypes, saves, follows, plans, alert, goingDone, radarGoing] = await Promise.all([
    many<Night>(q,
      `select e.id, e.styles, e.area, e.city, e.start_time, e.end_time, e.starts_on::text as starts_on, e.event_type, e.festival
         from ${attendedEvents('$1', '$2')} x join events e on e.id = x.event_id where e.starts_at <= $2`, [userId, now]),
    one<{ photo_url: string | null; name: string | null; city: string | null; created_at: Date }>(q, 'select photo_url, name, city, created_at from users where id = $1', [userId]),
    one<{ n: number }>(q, `select count(*)::int as n from event_posts where user_id = $1 and status <> 'removed'`, [userId]),
    one<{ n: number }>(q,
      `select count(*)::int as n from event_posts r left join event_posts p on p.id = r.parent_id
        where r.user_id <> $1 and r.status <> 'removed' and (r.reply_to_user_id = $1 or (r.reply_to_user_id is null and p.user_id = $1))`, [userId]),
    one<{ n: number }>(q, `select coalesce(sum(helpful_count), 0)::int as n from event_posts where user_id = $1 and status <> 'removed'`, [userId]),
    one<{ n: number }>(q,
      `select (select count(*) from event_posts where user_id = $1 and photo_url is not null and status <> 'removed')
            + (select count(*) from moments where created_by = $1 and removed_at is null) as n`, [userId]),
    one<{ n: number }>(q,
      `select count(*)::int as n from event_posts p where p.user_id = $1 and p.parent_id is null and p.status <> 'removed'
          and exists (select 1 from event_posts a where a.parent_id = p.id and a.official and a.status <> 'removed')`, [userId]),
    one<{ n: number }>(q, 'select count(*)::int as n from friendships where user_id = $1', [userId]),
    one<{ n: number }>(q, 'select count(*)::int as n from share_visits where ref_user = $1', [userId]),
    one<{ n: number }>(q, 'select count(*)::int as n from outbound_clicks where ref_user = $1', [userId]),
    one<{ n: number }>(q, `select count(*)::int as n from partner_conversions where ref_user = $1 and status in ('approved', 'paid')`, [userId]),
    one<{ n: number }>(q, `select count(*)::int as n from ambassador_earnings where user_id = $1 and status in ('payable', 'paid')`, [userId]),
    one<{ n: number }>(q, `select count(*)::int as n from events where submitted_by = $1 and status = 'live' and published_at is not null`, [userId]),
    one<{ n: number }>(q, 'select count(*)::int as n from hypes where user_id = $1', [userId]),
    one<{ n: number }>(q, 'select count(*)::int as n from saves where user_id = $1', [userId]),
    many<{ artist_id: string | null }>(q, 'select artist_id from artist_follows where user_id = $1', [userId]),
    one<{ n: number }>(q,
      `select count(*)::int as n from group_plans g where g.owner_id = $1
          and exists (select 1 from group_plan_members m where m.plan_id = g.id and m.user_id <> $1 and m.status = 'going')`, [userId]),
    one<{ n: number }>(q, 'select count(*)::int as n from smart_alerts where user_id = $1 and enabled', [userId]),
    one<{ n: number }>(q, 'select count(*)::int as n from going g join events e on e.id = g.event_id where g.user_id = $1 and e.ends_at < $2', [userId, now]),
    one<{ n: number }>(q,
      `select count(*)::int as n from going g where g.user_id = $1 and g.origin_at_time = 'radar'
          and g.event_id in (select event_id from ${attendedEvents('$1', '$2')} z)`, [userId, now]),
  ]);
  const count = nights.length;
  const crosses = (x: Night) => !!x.start_time && !!x.end_time && x.end_time < x.start_time;
  const areas = new Map<string, Set<string>>();
  for (const x of nights) if (x.area) areas.set(x.city, (areas.get(x.city) ?? new Set()).add(x.area));
  const ids = follows.map((f) => f.artist_id).filter((x): x is string => !!x);
  let superfan = 0;
  if (ids.length && count) {
    const rows = await many<{ artist_id: string; n: number }>(q,
      `select artist_id, count(distinct event_id)::int as n from event_artists where event_id = any($1::uuid[]) and artist_id = any($2::uuid[]) group by artist_id`,
      [nights.map((x) => x.id), ids]);
    superfan = Math.max(0, ...rows.map((r) => r.n));
  }
  let early = 0;
  if (count && me) {
    const before = await one<{ n: number }>(q,
      `select count(*)::int as n from users u where u.created_at < $2 and u.id <> $1
          and (exists (select 1 from presence p where p.user_id = u.id)
               or exists (select 1 from going g join events e on e.id = g.event_id where g.user_id = u.id and e.ends_at < $3))`,
      [userId, me.created_at, now]);
    early = n(before) < EARLY ? 1 : 0;
  }
  return {
    first: count, passport_10: count, passport_25: count, passport_50: count, passport_100: count,
    night_owl: nights.filter(crosses).length,
    sunrise: nights.filter((x) => crosses(x) && x.end_time! >= '05:00').length,
    daylight: nights.filter((x) => x.event_type === 'day').length,
    streak_3: longestMonthRun(nights.map((x) => x.starts_on)),
    four_styles: styleCount(nights),
    local: Math.max(0, ...[...areas.values()].map((s) => s.size)),
    two_cities: new Set(nights.map((x) => x.city)).size,
    five_cities: new Set(nights.map((x) => x.city)).size,
    abroad: new Set(nights.map((x) => cityOf(x.city).countryCode)).size,
    festival_first: nights.filter((x) => x.event_type === 'festival').length,
    festival_5: nights.filter((x) => x.event_type === 'festival').length,
    flagship: nights.filter((x) => festivalByKey(x.festival)?.tier === 'world').length,
    radar_first: n(radarGoing),
    comment_first: n(posts), comments_25: n(posts), comments_100: n(posts),
    replies_10: n(replies), likes_25: n(likes), photo_first: n(photos), question_answered: n(answered), friends_5: n(friends),
    spread: n(visits), spread_100: n(visits), referrer_10: n(clicks), referral_first: n(conversions), commission_first: n(earned),
    submit_first: n(submitted), submit_10: n(submitted), hype_25: n(hypes),
    saved_50: n(saves), follow_artists_10: follows.length, superfan, plan_first: n(plans), alert_set: n(alert), going_10: n(goingDone),
    profile_complete: me?.photo_url && me.name?.trim() && me.city ? 1 : 0,
    early_bird: early,
  };
}

async function artistProgress(q: Queryable, artistId: string, now: Date): Promise<Record<string, number>> {
  const [shows, me, mixes] = await Promise.all([
    many<{ id: string; city: string; past: boolean }>(q,
      `select e.id, e.city, e.starts_at <= $2 as past from event_artists ea join events e on e.id = ea.event_id
        where ea.artist_id = $1 and ea.disputed_at is null and e.status = 'live' and not e.held_for_reports and e.published_at is not null`, [artistId, now]),
    one<{ normalized_name: string; alias_keys: string[] | null }>(q, 'select normalized_name, alias_keys from artists where id = $1', [artistId]),
    one<{ n: number }>(q, 'select count(*)::int as n from artist_mixes where artist_id = $1 and removed_at is null', [artistId]),
  ]);
  const played = shows.filter((s) => s.past);
  const lasts = played.length ? await many<{ event_id: string; artist: string }>(q,
    `select distinct s.event_id, s.artist from sets s
      where s.event_id = any($1::uuid[]) and s.starts_at <= $2
        and s.ends_at = (select max(s2.ends_at) from sets s2 where s2.event_id = s.event_id and s2.day = s.day)`,
    [played.map((s) => s.id), now]) : [];
  const keys = new Set([me?.normalized_name, ...(me?.alias_keys ?? [])].filter(Boolean));
  return {
    // A show listed and not disputed (an artist who runs the profile confirms theirs by handshake, services/lineup.ts).
    debut: shows.length,
    shows_25: played.length, shows_50: played.length,
    touring: new Set(played.map((s) => s.city)).size,
    closer: new Set(lasts.filter((s) => keys.has(artistKey(s.artist))).map((s) => s.event_id)).size,
    mix_first: n(mixes),
  };
}

/** An organiser's events that count: listed and live, as its public page shows them. */
const COUNTED_EVENT = `status = 'live' and not held_for_reports and published_at is not null`;

async function organizerProgress(q: Queryable, organizerId: string): Promise<Record<string, number>> {
  const [o, events, calendar, clicks] = await Promise.all([
    one<{ verification_state: string }>(q, 'select verification_state from organizers where id = $1', [organizerId]),
    one<{ n: number }>(q, `select count(*)::int as n from events where organizer_id = $1 and ${COUNTED_EVENT}`, [organizerId]),
    one<{ n: number }>(q, 'select count(*)::int as n from ingest_sources where organizer_id = $1 and enabled', [organizerId]),
    one<{ n: number }>(q, 'select count(*)::int as n from outbound_clicks k join events e on e.id = k.event_id where e.organizer_id = $1', [organizerId]),
  ]);
  return {
    verified: o?.verification_state === 'verified' ? 1 : 0,
    first_live: n(events), events_50: n(events),
    calendar: n(calendar) ? 1 : 0,
    clicks_1000: n(clicks),
  };
}

/** The people behind a subject: who hears about its new badges. */
async function peopleOf(q: Queryable, role: BadgeRole, id: string): Promise<string[]> {
  if (role === 'user') return [id];
  if (role === 'artist') return (await many<{ id: string }>(q, 'select owner_user_id as id from artists where id = $1 and owner_user_id is not null', [id])).map((r) => r.id);
  return (await many<{ id: string }>(q, `select user_id as id from organizer_members where organizer_id = $1 and role = 'owner'`, [id])).map((r) => r.id);
}

/** Writes the awards a subject has newly reached, and tells its people. Returns how many were new. */
export async function award(q: Queryable, role: BadgeRole, id: string, progress: Record<string, number>, now: Date): Promise<number> {
  const met = BADGE_CATALOGUE.filter((b) => b.role === role && (progress[b.code] ?? 0) >= b.threshold).map((b) => b.code);
  if (!met.length) return 0;
  const rows = await many<{ code: string }>(q,
    `insert into badge_awards (subject_kind, subject_id, code, earned_at)
     select $1, $2, code, $4 from unnest($3::text[]) as code
     on conflict do nothing returning code`, [role, id, met, now]);
  if (rows.length) {
    for (const person of await peopleOf(q, role, id)) {
      const sent = n(await one<{ n: number }>(q, `select count(*)::int as n from notifications where user_id = $1 and kind = 'badge' and created_at > $2`,
        [person, new Date(now.getTime() - 3600_000)]));
      for (const r of rows.slice(0, Math.max(0, NOTICES_PER_HOUR - sent))) {
        const b = BADGE_CATALOGUE.find((x) => x.code === r.code)!;
        await notifyUser(q, now, {
          userId: person, topic: null, kind: 'badge', dedupeKey: `badge:${role}:${id}:${b.code}`,
          title: L(`New badge: ${b.label.en}`, `Huy hiệu mới: ${b.label.vi}`), body: b.rule,
          cta: L('See it', 'Xem'), link: { url: role === 'user' ? '/profile#badges' : role === 'artist' ? '/studio/artist' : '/studio' },
        });
      }
    }
  }
  return rows.length;
}

/** Awards one subject now (after an action that can reach a badge). Never fails the action. */
export async function awardNow(q: Queryable, role: BadgeRole, id: string | null | undefined, now: Date): Promise<number> {
  if (!id) return 0;
  try { return await award(q, role, id, await progressFor(q, role, id, now), now); } catch { return 0; }
}

/** The same, after the response: what a route calls once its write is done. */
export function awardSoon(ctx: Ctx, role: BadgeRole, id: string | null | undefined): void {
  if (!id) return;
  void awardNow(ctx.db, role, id, ctx.clock.now()).catch((e: unknown) => ctx.log(`badges for ${role} ${id}: ${(e as Error).message}`));
}

const ROLE_SIZE: Record<BadgeRole, string> = {
  user: `select count(*)::int as n from users where role = 'user'`,
  artist: 'select count(*)::int as n from artists',
  organizer: 'select count(*)::int as n from organizers',
};

export interface BadgeView {
  code: string; role: BadgeRole; group: BadgeGroup; groupLabel: Localized; tier: BadgeTier; family: Family; icon: string | null;
  /** Kept for the older parts of the site: a shape, or a number on the ring. */
  emblem: 'shape' | 'num'; ring: string | null; label: Localized; rule: Localized;
  threshold: number; value: number; earned: boolean; earnedAt: Date | null; isNew: boolean; rarityPct: number | null; pinned: boolean;
}

/**
 * A subject's badges, earned first (newest first), then the ones in progress (closest first).
 * Reading them awards what is newly reached. `own` marks the new ones as seen.
 */
export async function badgesOf(q: Queryable, role: BadgeRole, id: string, now: Date, opts: { own?: boolean; pins?: string[] } = {}): Promise<BadgeView[]> {
  const progress = await progressFor(q, role, id, now);
  await award(q, role, id, progress, now);
  const [awards, held, size] = await Promise.all([
    many<{ code: string; earned_at: Date; seen_at: Date | null }>(q, 'select code, earned_at, seen_at from badge_awards where subject_kind = $1 and subject_id = $2', [role, id]),
    many<{ code: string; n: number }>(q, 'select code, count(*)::int as n from badge_awards where subject_kind = $1 group by code', [role]),
    one<{ n: number }>(q, ROLE_SIZE[role]),
  ]);
  const byCode = new Map(awards.map((a) => [a.code, a]));
  const holders = new Map(held.map((h) => [h.code, h.n]));
  const pins = new Set(opts.pins ?? []);
  const views = BADGE_CATALOGUE.filter((b) => b.role === role).map((b): BadgeView => {
    const a = LIVE_STATE.has(b.code) && (progress[b.code] ?? 0) < b.threshold ? undefined : byCode.get(b.code);
    const share = size?.n ? ((holders.get(b.code) ?? 0) / size.n) * 100 : null;
    return {
      code: b.code, role, group: b.group, groupLabel: GROUP_LABEL[b.group], tier: b.tier, family: FAMILY[b.group], icon: b.icon,
      emblem: b.icon ? 'shape' : 'num', ring: ringNumber(b), label: b.label, rule: b.rule,
      threshold: b.threshold, value: Math.min(progress[b.code] ?? 0, b.threshold), earned: !!a, earnedAt: a?.earned_at ?? null,
      isNew: !!opts.own && !!a && !a.seen_at && now.getTime() - new Date(a.earned_at).getTime() < 14 * 86400_000,
      // A badge someone holds is never "0%".
      rarityPct: share === null ? null : share > 0 && share < 1 ? Math.max(0.1, Math.round(share * 10) / 10) : Math.round(share),
      pinned: !!a && pins.has(b.code),
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

/** A person's badges on their profile, whatever their craft: theirs, plus the artist profile and organiser they run. */
export async function personBadges(q: Queryable, userId: string, now: Date, opts: { own?: boolean } = {}): Promise<{ items: BadgeView[]; pins: string[]; total: number }> {
  const [me, artist, org] = await Promise.all([
    one<{ badge_pins: string[] | null }>(q, 'select badge_pins from users where id = $1', [userId]),
    one<{ id: string }>(q, 'select id from artists where owner_user_id = $1 order by created_at limit 1', [userId]),
    one<{ id: string }>(q, `select organizer_id as id from organizer_members where user_id = $1 order by role = 'owner' desc limit 1`, [userId]),
  ]);
  const pins = me?.badge_pins ?? [];
  const lists = await Promise.all([
    badgesOf(q, 'user', userId, now, { ...opts, pins }),
    artist ? badgesOf(q, 'artist', artist.id, now, { ...opts, pins }) : [],
    org ? badgesOf(q, 'organizer', org.id, now, { ...opts, pins }) : [],
  ]);
  const items = lists.flat();
  const earned = new Set(items.filter((b) => b.earned).map((b) => b.code));
  return { items, pins: pins.filter((p) => earned.has(p)), total: items.length };
}

/** The hourly job: people active in the last seven days, and every subject a state badge may have changed for. */
export async function awardAll(q: Queryable, now: Date): Promise<number> {
  const week = new Date(now.getTime() - 7 * 86400_000);
  const [users, artists, orgs] = await Promise.all([
    many<{ id: string }>(q,
      `select user_id as id from presence where updated_at >= $1
       union select g.user_id from going g join events e on e.id = g.event_id where g.created_at >= $1 or (e.ends_at >= $1 and e.ends_at < $2)
       union select user_id from event_posts where created_at >= $1
       union select ref_user from share_visits where created_at >= $1
       union select ref_user from outbound_clicks where ref_user is not null and created_at >= $1
       union select user_id from hypes where created_at >= $1
       union select user_id from saves where created_at >= $1
       union select id from users where last_active_at >= $1`, [week, now]),
    many<{ id: string }>(q, `select distinct ea.artist_id as id from event_artists ea join events e on e.id = ea.event_id where e.published_at is not null and e.ends_at >= $1`, [week]),
    many<{ id: string }>(q,
      `select id from organizers where verification_state = 'verified'
       union select organizer_id from ingest_sources where organizer_id is not null
       union select organizer_id from events where published_at >= $1`, [week]),
  ]);
  let made = 0;
  for (const [role, list] of [['user', users], ['artist', artists], ['organizer', orgs]] as [BadgeRole, { id: string }[]][]) {
    for (const s of list) made += await award(q, role, s.id, await progressFor(q, role, s.id, now), now);
  }
  return made;
}
