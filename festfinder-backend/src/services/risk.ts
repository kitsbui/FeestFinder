import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { L, type Localized } from '../lib/i18n.ts';

export interface RiskFactor { bad: boolean; weight: number; label: Localized }
export interface Signal { ok: boolean; label: Localized }

export const SLA_HOURS = 4;

export function riskBand(score: number): 'high' | 'medium' | 'low' {
  return score >= 60 ? 'high' : score >= 25 ? 'medium' : 'low';
}

/**
 * Advisory risk score for a listing awaiting review. Nothing is auto-rejected;
 * the moderation queue shows these factors so a human can decide faster.
 */
export async function assessRisk(q: Queryable, eventId: string, now: Date): Promise<{
  score: number; factors: RiskFactor[]; signals: Signal[]; flag: string | null; newOrganizer: boolean;
}> {
  const ev = await one<any>(q,
    `select e.*, o.verification_state, o.since_year, o.bank_added_at
       from events e join organizers o on o.id = e.organizer_id where e.id = $1`, [eventId]);
  if (!ev) throw new Error(`event ${eventId} not found`);

  const factors: RiskFactor[] = [];
  const signals: Signal[] = [];
  let flag: string | null = null;

  const prior = await one<{ n: number; reported: number }>(q,
    `select count(*)::int as n,
            coalesce(sum((select count(*) from listing_reports r where r.event_id = e.id)), 0)::int as reported
       from events e where e.organizer_id = $1 and e.id <> $2 and e.published_at is not null`,
    [ev.organizer_id, eventId]);
  const newOrganizer = (prior?.n ?? 0) === 0;
  if (newOrganizer) {
    factors.push({ bad: true, weight: 30, label: L('First listing from this account', 'Tin đầu tiên của tài khoản này') });
    signals.push({ ok: false, label: L('First listing from this account', 'Tin đầu tiên của tài khoản') });
  } else if (prior!.reported === 0) {
    signals.push({ ok: true, label: L(`${prior!.n} listings, no reports`, `${prior!.n} tin đăng, không bị báo cáo`) });
  }

  if (ev.verification_state === 'verified') {
    factors.push({ bad: false, weight: 0, label: L('Organizer verified', 'Nhà tổ chức đã xác minh') });
    signals.push({ ok: true, label: L('Organizer verified', 'Nhà tổ chức đã xác minh') });
  }

  const venueResolved = !!ev.venue_id || (ev.lat !== null && ev.lng !== null);
  if (!venueResolved) {
    factors.push({ bad: true, weight: 26, label: L('Address does not resolve to a pin', 'Địa chỉ không định vị được trên bản đồ') });
    signals.push({ ok: false, label: L('No map pin for this address', 'Địa chỉ không có định vị trên bản đồ') });
    flag = 'venue';
  } else {
    const pastAtVenue = ev.venue_id
      ? (await one<{ n: number }>(q, `select count(*)::int as n from events where venue_id = $1 and id <> $2 and published_at is not null`, [ev.venue_id, eventId]))!.n
      : 0;
    factors.push({ bad: false, weight: 0, label: pastAtVenue
      ? L(`Venue appears in ${pastAtVenue} past listings`, `Địa điểm đã có ở ${pastAtVenue} tin trước`)
      : L('Venue and pin match', 'Địa điểm khớp định vị') });
    signals.push({ ok: true, label: L('Venue resolves to a pin', 'Địa điểm có định vị trên bản đồ') });
  }

  // Flag priority when several apply: venue, then ticket link, then image.
  if (ev.entry_mode === 'paid' && ev.ticket_url) {
    if (ev.ticket_link_status === 'broken') {
      factors.push({ bad: true, weight: 22, label: L('Ticket URL returns 404', 'Link vé trả về 404') });
      signals.push({ ok: false, label: L('Ticket URL returns 404', 'Link vé trả về 404') });
      flag ??= 'ticket';
    } else if (ev.ticket_link_status === 'ok') {
      factors.push({ bad: false, weight: 0, label: L('Ticket link resolves', 'Link vé hoạt động') });
    }
  }

  if (ev.cover_sha256) {
    const reused = await one<{ starts_on: string }>(q,
      `select starts_on from events where cover_sha256 = $1 and id <> $2 order by starts_on limit 1`,
      [ev.cover_sha256, eventId]);
    if (reused) {
      const year = reused.starts_on?.slice(0, 4) ?? '';
      factors.push({ bad: true, weight: 24, label: L(`Image reused from a ${year} listing`, `Ảnh dùng lại từ tin năm ${year}`) });
      signals.push({ ok: false, label: L(`Image reused from ${year} listing`, `Ảnh dùng lại từ tin ${year}`) });
      flag ??= 'image';
    } else {
      signals.push({ ok: true, label: L('Image is original', 'Ảnh không trùng') });
    }
  }

  const refundReports = (await one<{ n: number }>(q,
    `select count(*)::int as n from listing_reports r join events e on e.id = r.event_id
      where e.organizer_id = $1 and r.code in ('refund', 'scam') and r.created_at > $2`,
    [ev.organizer_id, new Date(now.getTime() - 90 * 86400_000)]))!.n;
  if (refundReports >= 5) {
    factors.push({ bad: true, weight: 18, label: L(`${refundReports} refund reports against this organizer`, `${refundReports} báo cáo hoàn tiền với nhà tổ chức này`) });
  }

  if (ev.entry_mode === 'paid' && ev.price_from > 0 && ev.area) {
    const prices = (await many<{ price_from: number }>(q,
      `select price_from from events where status = 'live' and area = $1 and entry_mode = 'paid' and price_from > 0 and id <> $2`,
      [ev.area, eventId])).map((r) => r.price_from).sort((a, b) => a - b);
    if (prices.length >= 3) {
      const median = prices[Math.floor(prices.length / 2)];
      const over = Math.round((ev.price_from / median - 1) * 100);
      if (over > 15) factors.push({ bad: true, weight: 14, label: L(`Price ${over}% above district median`, `Giá cao hơn trung vị khu vực ${over}%`) });
    }
  }

  if (ev.bank_added_at && now.getTime() - new Date(ev.bank_added_at).getTime() < 7 * 86400_000) {
    const days = Math.max(1, Math.round((now.getTime() - new Date(ev.bank_added_at).getTime()) / 86400_000));
    factors.push({ bad: true, weight: 14, label: L(`Payout account added ${days} days ago`, `Tài khoản nhận tiền thêm ${days} ngày trước`) });
  }

  if (!ev.capacity) {
    factors.push({ bad: true, weight: 6, label: L('Capacity not stated', 'Chưa ghi sức chứa') });
  }

  const score = Math.min(100, factors.reduce((n, f) => n + (f.bad ? f.weight : 0), 0));
  factors.sort((a, b) => (b.bad ? b.weight : -1) - (a.bad ? a.weight : -1));
  return { score, factors, signals: signals.slice(0, 3), flag, newOrganizer };
}

/** HEAD then GET, five seconds each, following redirects. 404/410 or a dead host counts as broken. */
export async function checkLink(url: string): Promise<'ok' | 'broken'> {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(5000) });
      if (res.status === 404 || res.status === 410) return 'broken';
      if (res.status < 400) return 'ok';
      if (method === 'GET') return res.status >= 500 ? 'broken' : 'ok';
    } catch {
      if (method === 'GET') return 'broken';
    }
  }
  return 'broken';
}
