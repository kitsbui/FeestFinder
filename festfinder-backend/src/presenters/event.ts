import type { Queryable } from '../db/index.ts';
import { many } from '../db/index.ts';
import { initialsOf } from '../lib/contact.ts';
import { haversineKm, round1 } from '../lib/geo.ts';
import { BADGES, L, TIER_NAMES, type Localized } from '../lib/i18n.ts';
import { cityOf } from '../lib/places.ts';
import { CONFIDENCE_LABEL, freshness, type ConfidenceLabel } from '../services/ingest/confidence.ts';
import { PROVIDER_LABEL } from '../services/ingest/providers.ts';

/** Organiser columns a card shows. Alias the organizers table as `o`. */
export const ORG_COLUMNS = `
  o.slug as org_slug, o.name as org_name, o.initials as org_initials, o.verification_state as org_state,
  o.art as org_art, o.logo_url as org_logo`;

/** Columns every card needs, joined with its organiser. Alias the events table as `e`. */
export const CARD_COLUMNS = `
  e.id, e.slug, e.title, e.genre, e.art, e.cover_url, e.logo_url, e.badge, e.featured, e.sold_out, e.status,
  e.starts_on, e.ends_on, e.start_time, e.end_time, e.starts_at, e.ends_at,
  e.venue_id, e.venue_name, e.area, e.address, e.lat, e.lng, e.city,
  e.entry_mode, e.price_from, e.currency, e.hype_count, e.save_count, e.lineup, e.artists, e.organizer_id,
  e.styles, e.event_type, e.confidence_score, e.confidence, e.source_count, e.last_verified_at, ${ORG_COLUMNS}`;

export interface FriendFace { id: string; name: string; initials: string; photoUrl: string | null; source: string }

export interface Viewer {
  userId: string;
  saved: Set<string>;
  hyped: Set<string>;
  going: Set<string>;
  friendsGoing: Map<string, FriendFace[]>;
  friendsInterested: Map<string, FriendFace[]>;
}

/** Loads the viewer's own state and their friends' activity for a batch of events in four queries. */
export async function loadViewer(q: Queryable, userId: string | null, eventIds: string[]): Promise<Viewer | null> {
  if (!userId) return null;
  const ids = eventIds.length ? eventIds : ['00000000-0000-0000-0000-000000000000'];
  const [saved, hyped, going, friends] = await Promise.all([
    many<any>(q, 'select event_id from saves where user_id = $1 and event_id = any($2::uuid[])', [userId, ids]),
    many<any>(q, 'select event_id from hypes where user_id = $1 and event_id = any($2::uuid[])', [userId, ids]),
    many<any>(q, 'select event_id from going where user_id = $1 and event_id = any($2::uuid[])', [userId, ids]),
    many<any>(q,
      `select 'going' as rel, g.event_id, u.id, u.name, u.photo_url, f.source, g.created_at
         from friendships f join going g on g.user_id = f.friend_id join users u on u.id = f.friend_id
        where f.user_id = $1 and g.event_id = any($2::uuid[])
       union all
       select 'saved' as rel, s.event_id, u.id, u.name, u.photo_url, f.source, s.created_at
         from friendships f join saves s on s.user_id = f.friend_id join users u on u.id = f.friend_id
        where f.user_id = $1 and s.event_id = any($2::uuid[])
       order by created_at`, [userId, ids]),
  ]);
  const friendsGoing = new Map<string, FriendFace[]>();
  const friendsInterested = new Map<string, FriendFace[]>();
  for (const r of friends) {
    const face: FriendFace = { id: r.id, name: r.name, initials: initialsOf(r.name), photoUrl: r.photo_url, source: r.source };
    const target = r.rel === 'going' ? friendsGoing : friendsInterested;
    const list = target.get(r.event_id) ?? [];
    if (!list.some((f) => f.id === face.id)) list.push(face);
    target.set(r.event_id, list);
  }
  // Someone going isn't also "interested".
  for (const [eventId, list] of friendsInterested) {
    const goingIds = new Set((friendsGoing.get(eventId) ?? []).map((f) => f.id));
    friendsInterested.set(eventId, list.filter((f) => !goingIds.has(f.id)));
  }
  return {
    userId,
    saved: new Set(saved.map((r) => r.event_id)),
    hyped: new Set(hyped.map((r) => r.event_id)),
    going: new Set(going.map((r) => r.event_id)),
    friendsGoing,
    friendsInterested,
  };
}

export interface PresentOpts { now: Date; viewer: Viewer | null; origin?: { lat: number; lng: number } }

export function presentCard(r: any, o: PresentOpts) {
  const city = cityOf(r.city);
  // Without the viewer's position, distance is from the centre of the event's own city.
  const origin = o.origin ?? { lat: city.lat, lng: city.lng };
  const hasPin = r.lat !== null && r.lng !== null;
  const past = r.ends_at ? new Date(r.ends_at).getTime() < o.now.getTime() : false;
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    genre: r.genre as string | null,
    art: r.art as string | null,
    coverUrl: r.cover_url as string | null,
    logoUrl: r.logo_url as string | null,
    badge: r.badge && !past && !r.sold_out ? { key: r.badge as string, label: BADGES[r.badge] } : null,
    featured: r.featured as boolean,
    soldOut: r.sold_out as boolean,
    past,
    status: r.status as string,
    startsOn: r.starts_on as string | null,
    endsOn: r.ends_on as string | null,
    startTime: r.start_time as string | null,
    endTime: r.end_time as string | null,
    startsAt: r.starts_at as Date | null,
    endsAt: r.ends_at as Date | null,
    venue: { id: r.venue_id, name: r.venue_name, area: r.area, address: r.address, lat: r.lat, lng: r.lng },
    city: city.slug,
    cityLabel: city.name,
    country: city.countryCode,
    timezone: city.timezone,
    distanceKm: hasPin ? round1(haversineKm(origin.lat, origin.lng, r.lat, r.lng)) : null,
    entryMode: r.entry_mode as 'free' | 'paid' | 'donation',
    priceFrom: r.price_from as number,
    currency: (r.currency ?? 'VND') as string,
    styles: (r.styles ?? []) as string[],
    eventType: (r.event_type ?? null) as string | null,
    confidence: presentConfidence(r, o.now),
    isFree: r.entry_mode === 'free' || r.price_from === 0,
    hypeCount: r.hype_count as number,
    saveCount: r.save_count as number,
    lineup: r.lineup as string[],
    artists: r.artists as string[],
    organizer: {
      id: r.organizer_id, slug: r.org_slug, name: r.org_name, initials: r.org_initials,
      verified: r.org_state === 'verified', art: r.org_art, logoUrl: r.org_logo,
    },
    viewer: o.viewer ? { saved: o.viewer.saved.has(r.id), hyped: o.viewer.hyped.has(r.id), going: o.viewer.going.has(r.id) } : null,
    friends: o.viewer ? {
      going: o.viewer.friendsGoing.get(r.id) ?? [],
      interested: o.viewer.friendsInterested.get(r.id) ?? [],
    } : null,
  };
}

/** Where an event's facts came from, as the public page lists them: one line per site. */
export async function loadPublicSources(q: Queryable, eventId: string) {
  const rows = await many<any>(q,
    `select provider, source_url, source_host, last_seen_at, cancelled from event_sources where event_id = $1 order by first_seen_at`, [eventId]);
  const seen = new Set<string>();
  const out: { provider: string; label: Localized; host: string | null; url: string | null; lastSeenAt: Date }[] = [];
  for (const r of rows) {
    const key = r.source_host ?? r.provider;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      provider: r.provider,
      label: r.source_host ? L(r.source_host, r.source_host) : (PROVIDER_LABEL[r.provider] ?? L(r.provider, r.provider)),
      host: r.source_host, url: r.provider === 'team' ? null : r.source_url, lastSeenAt: r.last_seen_at,
    });
  }
  return out;
}

/** How sure we are of an event, in the few words a card has room for. */
export function presentConfidence(r: any, now: Date) {
  if (r.confidence_score == null) return null;
  const label = r.confidence as ConfidenceLabel;
  const fresh = freshness({ status: r.status, last_verified_at: r.last_verified_at }, now);
  return {
    score: r.confidence_score as number, label, labelText: CONFIDENCE_LABEL[label],
    sources: (r.source_count ?? 0) as number,
    sourcesLine: (r.source_count ?? 0) >= 2 ? L(`Verified from ${r.source_count} sources`, `Xác minh từ ${r.source_count} nguồn`) : null,
    freshness: fresh.key, verifiedDaysAgo: fresh.days,
  };
}

export type TierState = 'onsale' | 'last' | 'soldout' | 'soon';

export const TIER_NOTES: Record<string, Localized> = {
  early: L('First 500 tickets, gone in 40 hours', '500 vé đầu tiên, hết sau 40 giờ'),
  ga: L('Standing, re-entry until 22:00', 'Vé đứng, ra vào lại tới 22:00'),
  vip: L('Raised deck, separate bar and entrance', 'Khu cao, quầy bar và cổng riêng'),
  table: L('Opens when VIP sells out', 'Mở bán khi VIP hết vé'),
};

export const REFUND_POLICY = L(
  'Refunds up to 7 days before the event, minus the payment fee. After that the organiser decides case by case.',
  'Hoàn tiền tới trước sự kiện 7 ngày, trừ phí thanh toán. Sau thời điểm đó nhà tổ chức xét từng trường hợp.');

export function tierState(t: { capacity: number; sold: number; is_last: boolean; sales_open_at: Date | null }, now: Date): TierState {
  if (t.sold >= t.capacity) return 'soldout';
  if (t.sales_open_at && new Date(t.sales_open_at).getTime() > now.getTime()) return 'soon';
  return t.is_last ? 'last' : 'onsale';
}

function riseLine(t: any): Localized | null {
  if (!t.price_rise_on || !t.price_rise_to) return null;
  const [, m, d] = String(t.price_rise_on).split('-').map(Number);
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return L(
    `Price rises to ${t.price_rise_to.toLocaleString('en-US')}₫ on ${d} ${mon}`,
    `Giá lên ${t.price_rise_to.toLocaleString('vi-VN')}₫ từ ${d}/${m}`);
}

export function presentTiers(rows: any[], now: Date) {
  const tiers = rows.map((t) => {
    const state = tierState(t, now);
    const rise = riseLine(t);
    return {
      id: t.id as string,
      key: t.key as string,
      name: (t.name ?? TIER_NAMES[t.key]) as Localized,
      note: (rise ?? t.note ?? TIER_NOTES[t.key] ?? null) as Localized | null,
      price: t.price as number,
      state,
      left: state === 'soldout' ? 0 : t.capacity - t.sold,
      priceRise: t.price_rise_on ? { on: t.price_rise_on as string, to: t.price_rise_to as number } : null,
    };
  });
  const urgent = tiers.find((t) => t.state === 'last');
  return {
    tiers,
    urgency: urgent ? (urgent.priceRise ? urgent.note : L(`${urgent.left} left`, `Còn ${urgent.left}`)) : null,
    refundPolicy: REFUND_POLICY,
  };
}
