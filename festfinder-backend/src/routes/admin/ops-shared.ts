import type { Queryable } from '../../db/index.ts';
import { L, type Localized } from '../../lib/i18n.ts';
import { searchNormalize } from '../../lib/contact.ts';
import { PROFILE_ARTS } from '../../lib/format.ts';
import { ORGANIZER_TYPE } from '../../lib/network.ts';
import { type UserSession } from '../../http/guards.ts';
import { appendAudit, type DiffRow } from '../../services/audit.ts';
import { refreshConfidence } from '../../services/ingest/confidence.ts';
import { cityOf } from '../../lib/places.ts';
import { announceNewListing } from '../../services/listing.ts';
import { notifyOrganizer } from '../../services/notify.ts';
import { missingForSubmit } from '../organizer/events.ts';


/*
 * What the team's catalogue routes share (admin/ops, venues, organizers, users, orders): the labels
 * every form and list uses, how a team edit is diffed for the audit log, and publishing by the team.
 */

export const STATUSES = ['draft', 'in_review', 'live', 'rejected', 'removed', 'cancelled'] as const;

export const GENRE_LABEL: Record<string, { label: Localized; hint: Localized }> = {
  EDM: { label: L('EDM & electronic', 'EDM & điện tử'), hint: L('Raves, club nights, DJ sets', 'Rave, club night, DJ set') },
};

export const ORG_TYPES: Record<string, Localized> = ORGANIZER_TYPE.label;

/** Districts grouped the way people in the city think about them. Areas already in the data are added under "Other". */
export const AREA_GROUPS: { key: string; label: Localized; areas: string[] }[] = [
  { key: 'central', label: L('Central', 'Trung tâm'), areas: ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 10', 'Phú Nhuận', 'Bình Thạnh'] },
  { key: 'east', label: L('East · Thủ Đức', 'Phía Đông · Thủ Đức'), areas: ['Thảo Điền', 'Thủ Đức', 'Quận 2', 'Quận 9'] },
  { key: 'south', label: L('South', 'Phía Nam'), areas: ['Quận 7', 'Quận 8', 'Nhà Bè'] },
  { key: 'west', label: L('West & north', 'Phía Tây & Bắc'), areas: ['Quận 6', 'Quận 11', 'Quận 12', 'Tân Bình', 'Tân Phú', 'Gò Vấp', 'Bình Tân'] },
  { key: 'outside', label: L('Outside the city', 'Ngoài TP.HCM'), areas: ['Vũng Tàu', 'Bình Dương', 'Cần Giờ', 'Đà Lạt'] },
];

export const ENTRY_MODES: Record<string, { label: Localized; hint: Localized }> = {
  free: { label: L('Free entry', 'Miễn phí'), hint: L('No ticket needed', 'Không cần vé') },
  paid: { label: L('Paid tickets', 'Bán vé'), hint: L('Price and a ticket link', 'Có giá và link bán vé') },
  donation: { label: L('Donation', 'Tuỳ tâm'), hint: L('Pay what you want at the door', 'Trả tuỳ ý tại cửa') },
};

export const AGES: Record<string, Localized> = { 'All ages': L('All ages', 'Mọi lứa tuổi'), '16+': L('16+', '16+'), '18+': L('18+ (ID checked)', '18+ (kiểm tra giấy tờ)') };

export const ORDER_STATUS: Record<string, Localized> = {
  pending: L('Awaiting payment', 'Chờ thanh toán'), paid: L('Paid', 'Đã thanh toán'), cancelled: L('Cancelled', 'Đã huỷ'),
  expired: L('Expired', 'Hết hạn'), refunded: L('Refunded', 'Đã hoàn tiền'),
};
export const PAY_METHOD: Record<string, string> = { card: 'Card', momo: 'MoMo', zalopay: 'ZaloPay', vietqr: 'VietQR', mock: 'Demo' };
export const SIGNUP: Record<string, string> = { email: 'Email', google: 'Google', zalo: 'Zalo', wa: 'WhatsApp', fb: 'Facebook', ig: 'Instagram', staff: 'Staff' };

export const ARTS = PROFILE_ARTS;

export const minutesSince = (now: Date, at: Date | string | null) => (at ? Math.max(0, Math.round((now.getTime() - new Date(at).getTime()) / 60000)) : 0);
export const short = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '—';
  const s = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
};
export const actorOf = (s: UserSession) => ({ actorType: 'admin' as const, actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin' });

/** The columns a team edit can touch, with the name the audit diff uses. */
export const EDIT_COLUMNS: [string, string][] = [
  ['title', 'title'], ['genre', 'genre'], ['starts_on', 'starts_on'], ['ends_on', 'ends_on'], ['start_time', 'start_time'], ['end_time', 'end_time'],
  ['venue_name', 'venue'], ['address', 'address'], ['area', 'area'], ['entry_mode', 'entry'], ['price_from', 'price_from'], ['capacity', 'capacity'],
  ['age', 'age'], ['lineup', 'lineup'], ['ticket_url', 'ticket_url'], ['event_url', 'event_url'], ['brand_url', 'brand_url'], ['cover_url', 'cover'],
  ['logo_url', 'logo'], ['featured', 'featured'], ['badge', 'badge'],
];

export function diffRows(before: any, after: any): DiffRow[] {
  const rows: DiffRow[] = [];
  for (const [col, f] of EDIT_COLUMNS) {
    if (JSON.stringify(before[col] ?? null) !== JSON.stringify(after[col] ?? null)) rows.push({ f, a: short(before[col]), b: short(after[col]) });
  }
  if (before.lat !== after.lat || before.lng !== after.lng) {
    const pin = (e: any) => (e.lat === null || e.lng === null ? '—' : `${Number(e.lat).toFixed(4)}, ${Number(e.lng).toFixed(4)}`);
    rows.push({ f: 'pin', a: pin(before), b: pin(after) });
  }
  for (const lang of ['vi', 'en'] as const) {
    if ((before.description?.[lang] ?? '') !== (after.description?.[lang] ?? '')) rows.push({ f: `description_${lang}`, a: `${(before.description?.[lang] ?? '').length} chars`, b: `${(after.description?.[lang] ?? '').length} chars` });
  }
  return rows;
}

/** What the team needs before a listing may go live without the organiser's own submit (the logo and event page are optional here). */
export function missingForPublish(ev: any): string[] {
  return missingForSubmit(ev).filter((m) => m !== 'logo' && m !== 'eventUrl');
}

export async function publishByTeam(q: Queryable, s: UserSession, ev: any, now: Date) {
  await q.query(`update events set status = 'live', genre = coalesce(genre, 'EDM'), published_at = coalesce(published_at, $2), decided_at = $2 where id = $1`, [ev.id, now]);
  await q.query(`insert into moderation_decisions (event_id, decision, decided_by, decided_at) values ($1,'approved',$2,$3)`, [ev.id, s.user.id, now]);
  await appendAudit(q, {
    at: now, ...actorOf(s), action: 'listing.published_by_team', targetType: 'event', targetId: ev.id, targetLabel: ev.title,
    diff: [{ f: 'status', a: ev.status, b: 'live' }, { f: 'visible_in', a: '—', b: `Explore · ${cityOf(ev.city).name.vi}` }],
  });
  await notifyOrganizer(q, now, {
    organizerId: ev.organizer_id, topic: 'moderation', kind: 'live',
    title: L(`${ev.title} is live`, `${ev.title} đã lên sóng`),
    body: L(`Published by the FeestFinder team and now showing in ${cityOf(ev.city).name.en}.`, `Đội FeestFinder đã đăng tin này, đang hiển thị tại ${cityOf(ev.city).name.vi}.`),
    cta: L('View dashboard', 'Xem dashboard'), link: { screen: 'dash', eventId: ev.id },
  });
  if (!ev.published_at) await announceNewListing(q, ev.id, now);
  await refreshConfidence(q, now, [ev.id]);
}

/** Two venue names are probably the same place when most of their longer words match. */
/** Words that name no place: "The Warehouse" and "The Reverie" share nothing. */
const VENUE_STOP = new Set(['the', 'and', 'club', 'bar', 'cua', 'tai']);

export function venueLikeness(a: string, b: string): number {
  const words = (s: string) => new Set(searchNormalize(s).split(/[^a-z0-9]+/).filter((w) => !VENUE_STOP.has(w) && (w.length >= 3 || /^\d+$/.test(w))));
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const w of A) if (B.has(w)) common++;
  return common / Math.min(A.size, B.size);
}
