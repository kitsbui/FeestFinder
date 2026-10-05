import type { Queryable } from '../../db/index.ts';
import { many } from '../../db/index.ts';
import { L, type Localized } from '../../lib/i18n.ts';

/*
 * How sure FeestFinder is that an event is real and its facts current: 0–100, from where its
 * facts came from and who checked them. Every rule and weight is in CONFIDENCE_RULES, and each
 * event keeps the breakdown that produced its score, so /ops can show why.
 *
 * This is a different question from the quality score (is the listing complete?) and the
 * risk score (should a moderator look twice?).
 */

export type Authority = 'official' | 'ticketing' | 'listing' | 'community';
export const AUTHORITIES: Authority[] = ['official', 'ticketing', 'listing', 'community'];

export const CONFIDENCE_RULES = {
  /** The most authoritative source listing the event. */
  base: { official: 30, ticketing: 25, listing: 15, community: 10 } as Record<Authority, number>,
  organizerVerified: 15,
  moderatorApproved: 20,
  secondSource: 10,
  thirdSource: 10,
  venueVerified: 10,
  venuePinned: 5,
  ticketLinkOk: 5,
  /** Every outside source stopped listing the event this many days ago. */
  staleAfterDays: 14,
  stale: -10,
  dateConflict: -20,
  venueConflict: -20,
};

export type ConfidenceLabel = 'low' | 'likely' | 'verified' | 'highly_verified';

export const CONFIDENCE_LABEL: Record<ConfidenceLabel, Localized> = {
  low: L('Low confidence', 'Độ tin cậy thấp'),
  likely: L('Likely', 'Có khả năng'),
  verified: L('Verified', 'Đã xác minh'),
  highly_verified: L('Highly verified', 'Xác minh cao'),
};

export function confidenceLabel(score: number): ConfidenceLabel {
  return score >= 90 ? 'highly_verified' : score >= 70 ? 'verified' : score >= 40 ? 'likely' : 'low';
}

/** Sources that live inside FeestFinder rather than on another site. */
export const ORIGIN_PROVIDERS = ['organizer', 'community', 'team'];

export interface SourceFact {
  provider: string;
  authority: Authority;
  host: string | null;
  conflicts: { field: string }[];
  lastSeenAt: Date;
}

export interface ConfidenceFacts {
  sources: SourceFact[];
  organizerVerified: boolean;
  approved: boolean;
  venueVerified: boolean;
  venuePinned: boolean;
  ticketLinkOk: boolean;
  upcoming: boolean;
  now: Date;
}

export interface ConfidenceLine { rule: string; points: number; label: Localized }

/** Endings that name a kind of site or a country, not who runs it. */
const SUFFIX = new Set(['com', 'net', 'org', 'co', 'io', 'info', 'biz', 'app', 'events', 'asia', 'in', 'gov', 'edu', 'ac', 'or', 'ne', 'example', 'test', 'local']);

/** Who runs a site: megatix.com.sg, megatix.vn and megatix.in.th are all "megatix". */
export function brandOf(host: string | null | undefined): string | null {
  if (!host) return null;
  const labels = host.replace(/^www\./, '').toLowerCase().split('.');
  while (labels.length > 1 && (SUFFIX.has(labels[labels.length - 1]) || /^[a-z]{2}$/.test(labels[labels.length - 1]))) labels.pop();
  return labels[labels.length - 1] || host;
}

/** One source per brand: a venue's page and its calendar feed, or one ticket seller's country sites, are the same voice. */
export function independentSources(sources: { provider: string; host: string | null }[]): number {
  return new Set(sources.map((s) => brandOf(s.host) ?? s.provider)).size;
}

export function scoreConfidence(f: ConfidenceFacts): { score: number; label: ConfidenceLabel; breakdown: ConfidenceLine[] } {
  const R = CONFIDENCE_RULES;
  const lines: ConfidenceLine[] = [];
  const add = (rule: string, points: number, label: Localized) => { if (points) lines.push({ rule, points, label }); };

  const best = AUTHORITIES.find((a) => f.sources.some((s) => s.authority === a));
  if (best) add(`base:${best}`, R.base[best], {
    official: L('Official source', 'Nguồn chính thức'),
    ticketing: L('Ticket seller', 'Trang bán vé'),
    listing: L('Event listing', 'Trang đăng sự kiện'),
    community: L('Sent in by the community', 'Cộng đồng gửi'),
  }[best]);
  if (f.organizerVerified) add('organizer_verified', R.organizerVerified, L('Verified organiser', 'Nhà tổ chức đã xác minh'));
  if (f.approved) add('approved', R.moderatorApproved, L('Checked by a moderator', 'Đã kiểm duyệt'));
  const n = independentSources(f.sources);
  if (n >= 2) add('second_source', R.secondSource, L('A second source', 'Nguồn thứ hai'));
  if (n >= 3) add('third_source', R.thirdSource, L('A third source', 'Nguồn thứ ba'));
  if (f.venueVerified) add('venue_verified', R.venueVerified, L('Known venue', 'Địa điểm đã xác minh'));
  else if (f.venuePinned) add('venue_pinned', R.venuePinned, L('Venue on the map', 'Có định vị địa điểm'));
  if (f.ticketLinkOk) add('ticket_link', R.ticketLinkOk, L('Ticket link works', 'Link vé hoạt động'));

  const outside = f.sources.filter((s) => !ORIGIN_PROVIDERS.includes(s.provider));
  const staleBefore = f.now.getTime() - R.staleAfterDays * 86400_000;
  if (f.upcoming && outside.length && outside.every((s) => s.lastSeenAt.getTime() < staleBefore)) {
    add('stale', R.stale, L(`No source has listed it for ${R.staleAfterDays} days`, `${R.staleAfterDays} ngày không nguồn nào còn đăng`));
  }
  const conflicted = (field: string) => f.sources.some((s) => s.conflicts.some((c) => c.field === field));
  if (conflicted('starts_on')) add('date_conflict', R.dateConflict, L('Sources disagree on the date', 'Các nguồn ghi ngày khác nhau'));
  if (conflicted('venue')) add('venue_conflict', R.venueConflict, L('Sources disagree on the venue', 'Các nguồn ghi địa điểm khác nhau'));

  const score = Math.max(0, Math.min(100, lines.reduce((s, l) => s + l.points, 0)));
  return { score, label: confidenceLabel(score), breakdown: lines };
}

export type Freshness = 'recent' | 'updated' | 'stale' | 'cancelled';

/** How recently someone or something confirmed the event. */
export function freshness(ev: { status: string; last_verified_at: Date | string | null }, now: Date): { key: Freshness; days: number | null } {
  if (ev.status === 'cancelled') return { key: 'cancelled', days: null };
  if (!ev.last_verified_at) return { key: 'stale', days: null };
  const days = Math.floor((now.getTime() - new Date(ev.last_verified_at).getTime()) / 86400_000);
  return { key: days <= 3 ? 'recent' : days <= CONFIDENCE_RULES.staleAfterDays ? 'updated' : 'stale', days };
}

/**
 * Recomputes confidence, source count and freshness dates for some events (or every one
 * that has not ended) in three queries.
 */
export async function refreshConfidence(q: Queryable, now: Date, eventIds?: string[]): Promise<number> {
  if (eventIds && !eventIds.length) return 0;
  const events = await many<any>(q,
    `select e.id, e.status, e.published_at, e.decided_at, e.ends_at, e.venue_id, e.lat, e.lng, e.ticket_link_status,
            o.verification_state, coalesce(v.verified, false) as venue_verified
       from events e join organizers o on o.id = e.organizer_id left join venues v on v.id = e.venue_id
      where ${eventIds ? 'e.id = any($1::uuid[])' : `(e.ends_at is null or e.ends_at >= $1) and e.status in ('live', 'in_review', 'draft')`}`,
    [eventIds ?? now]);
  if (!events.length) return 0;
  const ids = events.map((e) => e.id);
  const sources = await many<any>(q,
    `select event_id, provider, authority, source_host, conflicts, last_seen_at from event_sources where event_id = any($1::uuid[])`, [ids]);
  const byEvent = new Map<string, SourceFact[]>();
  for (const s of sources) {
    const list = byEvent.get(s.event_id) ?? [];
    list.push({ provider: s.provider, authority: s.authority, host: s.source_host, conflicts: s.conflicts ?? [], lastSeenAt: new Date(s.last_seen_at) });
    byEvent.set(s.event_id, list);
  }
  const rows = events.map((e) => {
    const facts = byEvent.get(e.id) ?? [];
    const out = scoreConfidence({
      sources: facts,
      organizerVerified: e.verification_state === 'verified',
      approved: e.status === 'live' && !!e.published_at,
      venueVerified: !!e.venue_id && e.venue_verified,
      venuePinned: e.lat !== null && e.lng !== null,
      ticketLinkOk: e.ticket_link_status === 'ok',
      upcoming: !e.ends_at || new Date(e.ends_at).getTime() >= now.getTime(),
      now,
    });
    const seen = facts.map((s) => s.lastSeenAt.getTime());
    const outside = facts.filter((s) => !ORIGIN_PROVIDERS.includes(s.provider)).map((s) => s.lastSeenAt.getTime());
    const verified = [...outside, e.decided_at ? new Date(e.decided_at).getTime() : 0].filter(Boolean);
    return {
      id: e.id, score: out.score, label: out.label, breakdown: JSON.stringify(out.breakdown), count: independentSources(facts),
      lastSeen: seen.length ? new Date(Math.max(...seen)) : null,
      lastVerified: verified.length ? new Date(Math.max(...verified)) : null,
    };
  });
  await q.query(
    `update events e set confidence_score = r.score, confidence = r.label, confidence_breakdown = r.breakdown::jsonb, source_count = r.count,
            last_seen_at = coalesce(r.last_seen, e.last_seen_at), last_verified_at = greatest(e.last_verified_at, r.last_verified)
       from unnest($1::uuid[], $2::int[], $3::text[], $4::text[], $5::int[], $6::timestamptz[], $7::timestamptz[])
            as r(id, score, label, breakdown, count, last_seen, last_verified)
      where e.id = r.id`,
    [rows.map((r) => r.id), rows.map((r) => r.score), rows.map((r) => r.label), rows.map((r) => r.breakdown), rows.map((r) => r.count),
      rows.map((r) => r.lastSeen), rows.map((r) => r.lastVerified)]);
  return rows.length;
}
