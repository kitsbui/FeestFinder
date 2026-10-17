import type { Queryable } from '../../db/index.ts';
import { json, many, one } from '../../db/index.ts';
import { festivalByKey, festivalOf } from '../../lib/festivals.ts';
import { fill, L, type Localized } from '../../lib/i18n.ts';
import { knownOnLineup } from '../../lib/known-artists.ts';
import { cityBySlug, plainText } from '../../lib/places.ts';
import { styleByKey } from '../../lib/styles.ts';
import { artistKey } from '../artists.ts';

/*
 * How well a night suits FeestFinder, 0–100, with its reasons, for the team deciding whether to
 * list it (owner, 2026-10-17). Two kinds of reasons:
 *
 *   The project's: electronic music by a style FeestFinder follows, artists known for it, a
 *   festival brand it watches, the kind of night, a listing complete enough to act on (picture,
 *   ticket link, time, place, words, price), a city it serves, and how soon it is.
 *   Its people's: how many follow the lineup's profiles, artists who run their profile here,
 *   Smart Alerts that would match, and a venue people already save nights at.
 *
 * Things that are not a night out (karaoke, happy hours, workshops, live bands) take most of it
 * away. A new Radar find under FIT_FLOOR is not kept at all, unless it is a festival Feest Radar
 * watches. Follower numbers only weigh the night, never rank an artist.
 */

export type FitBand = 'recommend' | 'consider' | 'skip';
export interface FitReason { key: string; points: number; label: Localized }
export interface Fit { score: number; band: FitBand; reasons: FitReason[]; festival: string | null }

/** Below this, a new Radar find is dropped instead of waiting for review. */
export const FIT_FLOOR = 25;
export const bandOf = (score: number): FitBand => (score >= 70 ? 'recommend' : score >= 45 ? 'consider' : 'skip');
export const FIT_BAND_LABEL: Record<FitBand, Localized> = {
  recommend: L('Worth listing', 'Nên đăng'),
  consider: L('Take a look', 'Cân nhắc'),
  skip: L('Probably not', 'Không nên'),
};

/** The styles at the heart of what FeestFinder lists. */
const CORE = new Set(['techno', 'hard-techno', 'melodic-techno', 'house', 'tech-house', 'afro-house', 'trance', 'psytrance', 'hardstyle', 'dubstep', 'drum-and-bass', 'mainstage', 'edm']);

/** Words that say it is not a night out, as phrases in plain text. */
const NOT_A_NIGHT = /\s(karaoke|happy hour|ladies night|live band|acoustic|open mic|trivia|quiz night|bingo|brunch|pub crawl|bar crawl|workshop|masterclass|master class|lesson|course|speed dating|wine tasting|cocktail class|yoga|sound bath|sound healing|kids|family day|tribute band|cover band|watch party|screening|book club|meet and greet only)\s/;

export interface FitInput {
  title: string;
  description: string | null;
  styles: string[];
  lineup: string[];
  eventType: string | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  startTime: string | null;
  venueName: string | null;
  address: string | null;
  venueId: string | null;
  priceFrom: number | null;
  free: boolean | null;
  city: string;
  startsOn: string;
  festival: string | null;
}

const r = (key: string, points: number, en: string, vi: string): FitReason => ({ key, points, label: L(en, vi) });

export async function fitOf(q: Queryable, ev: FitInput, now: Date): Promise<Fit> {
  const reasons: FitReason[] = [];
  const brand = festivalByKey(ev.festival) ?? festivalOf(ev.title);

  // ---- the project's criteria -------------------------------------------------------
  if (ev.styles.length) {
    const core = ev.styles.some((s) => CORE.has(s));
    const names = ev.styles.map((s) => styleByKey(s)?.label).filter((x): x is Localized => !!x);
    reasons.push(r('style', core ? 30 : 25, `Style: ${names.map((n) => n.en).join(', ')}`, `Dòng nhạc: ${names.map((n) => n.vi).join(', ')}`));
  } else {
    reasons.push(r('no_style', 0, 'No electronic style named', 'Chưa rõ dòng nhạc điện tử'));
  }
  const known = knownOnLineup(ev.lineup);
  if (known.length) reasons.push({ key: 'known_artists', points: Math.min(18, known.length * 6), label: fill(L('Known artists: {a}', 'Nghệ sĩ có tiếng: {a}'), { a: known.slice(0, 4).join(', ') }) });
  if (brand?.tier === 'world') reasons.push({ key: 'festival_world', points: 35, label: fill(L('World-class festival: {f}', 'Lễ hội lớn thế giới: {f}'), { f: brand.name }) });
  else if (brand) reasons.push({ key: 'festival_asia', points: 15, label: fill(L('A major festival in Asia: {f}', 'Lễ hội lớn ở châu Á: {f}'), { f: brand.name }) });
  const type = ev.eventType;
  if (type === 'festival' || type === 'rave') reasons.push(r('type', 8, 'A festival or a rave', 'Lễ hội hoặc rave'));
  else if (type === 'club') reasons.push(r('type', 5, 'A club night', 'Đêm club'));
  else if (type === 'concert') reasons.push(r('type', 3, 'A concert', 'Concert'));
  else if (type === 'other') reasons.push(r('type', -5, 'Not a kind of night FeestFinder lists', 'Không phải kiểu đêm FeestFinder đăng'));

  const complete: [boolean, number, string, string][] = [
    [!!ev.imageUrl, 5, 'picture', 'ảnh'],
    [!!ev.ticketUrl, 8, 'ticket link', 'link vé'],
    [!!ev.startTime, 3, 'time', 'giờ'],
    [!!(ev.venueName || ev.address || ev.venueId), 3, 'place', 'địa điểm'],
    [(ev.description ?? '').trim().length >= 80, 2, 'description', 'mô tả'],
    [ev.priceFrom !== null || ev.free === true, 2, 'price', 'giá'],
  ];
  const has = complete.filter((c) => c[0]);
  const missing = complete.filter((c) => !c[0]);
  if (has.length) reasons.push({ key: 'complete', points: has.reduce((n, c) => n + c[1], 0), label: L(`Has its ${has.map((c) => c[2]).join(', ')}`, `Có ${has.map((c) => c[3]).join(', ')}`) });
  if (missing.length) reasons.push({ key: 'missing', points: 0, label: L(`No ${missing.map((c) => c[2]).join(', ')}`, `Thiếu ${missing.map((c) => c[3]).join(', ')}`) });

  const city = cityBySlug(ev.city);
  if (city?.launched) reasons.push(r('city', 5, 'In a city FeestFinder serves', 'Ở thành phố FeestFinder đang phục vụ'));
  else reasons.push(r('city_new', 0, `${city?.name.en ?? ev.city} is not launched yet`, `${city?.name.vi ?? ev.city} chưa mở trên FeestFinder`));
  const days = Math.round((Date.parse(ev.startsOn + 'T00:00:00Z') - Date.parse(now.toISOString().slice(0, 10) + 'T00:00:00Z')) / 86_400_000);
  if (days >= 0 && days <= 60) reasons.push(r('soon', 3, 'Within the next two months', 'Diễn ra trong hai tháng tới'));
  else if (days > 240 && !brand) reasons.push(r('far', -8, 'More than eight months away', 'Còn hơn tám tháng'));

  const text = ` ${plainText(`${ev.title} ${ev.description ?? ''}`)} `;
  const nightOff = NOT_A_NIGHT.exec(text);
  if (nightOff && !brand) reasons.push({ key: 'not_a_night', points: -30, label: fill(L('Not a night out: “{w}”', 'Không phải đêm nhạc: “{w}”'), { w: nightOff[1] }) });

  // ---- its people's ------------------------------------------------------------------
  const keys = [...new Set(ev.lineup.map(artistKey).filter(Boolean))];
  if (keys.length) {
    const artists = await many<{ id: string; owner_user_id: string | null }>(q,
      'select id, owner_user_id from artists where normalized_name = any($1::text[]) or alias_keys && $1::text[]', [keys]);
    const ids = artists.map((a) => a.id);
    const fans = ids.length ? (await one<{ n: number }>(q, 'select count(distinct user_id)::int as n from artist_follows where artist_id = any($1::uuid[])', [ids]))?.n ?? 0 : 0;
    if (fans >= 20) reasons.push(r('followers', 12, `${fans} people here follow the lineup`, `${fans} người trên FeestFinder theo dõi nghệ sĩ trong lineup`));
    else if (fans >= 5) reasons.push(r('followers', 8, `${fans} people here follow the lineup`, `${fans} người trên FeestFinder theo dõi nghệ sĩ trong lineup`));
    else if (fans >= 1) reasons.push(r('followers', 4, `${fans} people here follow the lineup`, `${fans} người trên FeestFinder theo dõi nghệ sĩ trong lineup`));
    if (artists.some((a) => a.owner_user_id)) reasons.push(r('owned_artists', 6, 'An artist on the lineup runs their profile here', 'Có nghệ sĩ trong lineup tự quản lý hồ sơ trên FeestFinder'));
  }
  if (ev.styles.length) {
    const alerts = (await one<{ n: number }>(q,
      `select count(*)::int as n from smart_alerts
        where enabled and styles && $1::text[] and (cardinality(cities) = 0 or $2 = any(cities))`, [ev.styles, ev.city]))?.n ?? 0;
    if (alerts >= 10) reasons.push(r('alerts', 6, `${alerts} Smart Alerts would match`, `${alerts} người đặt Nhắc khi có show sẽ khớp`));
    else if (alerts >= 1) reasons.push(r('alerts', 3, `${alerts} Smart Alerts would match`, `${alerts} người đặt Nhắc khi có show sẽ khớp`));
  }
  if (ev.venueId) {
    const saves = (await one<{ n: number }>(q,
      `select count(*)::int as n from saves s join events e on e.id = s.event_id
        where e.venue_id = $1 and e.starts_at > $2`, [ev.venueId, new Date(now.getTime() - 365 * 86_400_000)]))?.n ?? 0;
    if (saves >= 10) reasons.push(r('venue', 4, `People saved ${saves} nights at this venue this year`, `Địa điểm này có ${saves} lượt lưu trong năm`));
  }

  const score = Math.max(0, Math.min(100, reasons.reduce((n, x) => n + x.points, 0)));
  return { score, band: bandOf(score), reasons: reasons.sort((a, b) => b.points - a.points), festival: brand?.key ?? null };
}


/** An event row as fitOf reads it. */
const FIT_COLUMNS = `e.id, e.title, e.description, e.styles, e.lineup, e.event_type, e.cover_url, e.ticket_url, e.start_time, e.venue_name,
  e.address, e.venue_id, e.price_from, e.entry_mode, e.city, e.starts_on::text as starts_on, e.festival`;

/** Scores these events again and keeps the score, its reasons and the festival on each. */
export async function refreshFit(q: Queryable, eventIds: string[], now: Date): Promise<number> {
  if (!eventIds.length) return 0;
  type Row = {
    id: string; title: string; description: { en?: string; vi?: string } | null; styles: string[] | null; lineup: string[] | null;
    event_type: string | null; cover_url: string | null; ticket_url: string | null; start_time: string | null; venue_name: string | null;
    address: string | null; venue_id: string | null; price_from: number | null; entry_mode: string; city: string; starts_on: string; festival: string | null;
  };
  const rows = await many<Row>(q, `select ${FIT_COLUMNS} from events e where e.id = any($1::uuid[])`, [eventIds]);
  for (const e of rows) {
    const fit = await fitOf(q, {
      title: e.title, description: e.description?.vi || e.description?.en || null, styles: e.styles ?? [], lineup: e.lineup ?? [],
      eventType: e.event_type, imageUrl: e.cover_url, ticketUrl: e.ticket_url, startTime: e.start_time, venueName: e.venue_name,
      address: e.address, venueId: e.venue_id, priceFrom: e.entry_mode === 'free' ? 0 : e.price_from || null, free: e.entry_mode === 'free',
      city: e.city, startsOn: e.starts_on, festival: e.festival,
    }, now);
    await q.query('update events set fit_score = $2, fit_reasons = $3, fit_at = $4, festival = coalesce(festival, $5) where id = $1',
      [e.id, fit.score, json(fit.reasons), now, fit.festival]);
  }
  return rows.length;
}

/** The fit of the events still waiting for review and of upcoming Radar finds: what people do here changes it. */
export async function refreshAllFit(q: Queryable, now: Date): Promise<number> {
  const ids = await many<{ id: string }>(q,
    `select id from events where (status = 'in_review' or (status = 'live' and origin = 'radar')) and (ends_at is null or ends_at >= $1)
      order by fit_at nulls first limit 500`, [now]);
  return refreshFit(q, ids.map((x) => x.id), now);
}
