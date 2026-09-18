import type { Queryable } from '../db/index.ts';
import { json, many, one } from '../db/index.ts';
import { sha256 } from '../lib/crypto.ts';
import { L, type Lang, type Localized, REJECT_REASONS } from '../lib/i18n.ts';

export interface DiffRow { f: string; a: string; b: string }

export interface AuditEntry {
  at: Date;
  actorType: 'admin' | 'system' | 'organizer';
  actorId: string | null;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string;
  diff?: DiffRow[] | null;
}

const GENESIS = 'genesis';

/** JSON with object keys sorted, because jsonb does not preserve the order they were written in. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function digest(prevHash: string, e: AuditEntry): string {
  return sha256(canonical([
    prevHash, e.at.toISOString(), e.actorType, e.actorId, e.actorLabel, e.action,
    e.targetType, e.targetId, e.targetLabel, e.diff ?? null,
  ]));
}

/**
 * Appends one entry to the hash chain. Must run inside a transaction: the advisory
 * lock serialises writers so two appends never share a previous hash.
 */
export async function appendAudit(q: Queryable, e: AuditEntry): Promise<void> {
  await q.query('select pg_advisory_xact_lock(727274)');
  const prev = await one<{ hash: string }>(q, 'select hash from audit_log order by seq desc limit 1');
  const prevHash = prev?.hash ?? GENESIS;
  await q.query(
    `insert into audit_log (at, actor_type, actor_id, actor_label, action, target_type, target_id, target_label, diff, prev_hash, hash)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [e.at, e.actorType, e.actorId, e.actorLabel, e.action, e.targetType, e.targetId, e.targetLabel,
      json(e.diff), prevHash, digest(prevHash, e)],
  );
}

/** Recomputes every hash; returns the first sequence number that doesn't match. */
export async function verifyAuditChain(q: Queryable): Promise<{ ok: boolean; entries: number; brokenAt: number | null }> {
  const rows = await many<any>(q, 'select * from audit_log order by seq');
  let prev = GENESIS;
  for (const r of rows) {
    const e: AuditEntry = {
      at: new Date(r.at), actorType: r.actor_type, actorId: r.actor_id, actorLabel: r.actor_label, action: r.action,
      targetType: r.target_type, targetId: r.target_id, targetLabel: r.target_label, diff: r.diff,
    };
    if (r.prev_hash !== prev || r.hash !== digest(prev, e)) return { ok: false, entries: rows.length, brokenAt: Number(r.seq) };
    prev = r.hash;
  }
  return { ok: true, entries: rows.length, brokenAt: null };
}

const ACTIONS: Record<string, Localized> = {
  'listing.submitted': L('Listing submitted for review', 'Tin được gửi duyệt'),
  'listing.approved': L('Approved listing', 'Đã duyệt tin đăng'),
  'listing.approved_bulk': L('Approved listing (bulk)', 'Đã duyệt tin đăng (theo lô)'),
  'listing.rejected': L('Rejected', 'Đã từ chối'),
  'listing.taken_down': L('Took listing down', 'Đã hạ tin đăng'),
  'listing.held_by_reports': L('Pulled from the feed after reports', 'Tạm ẩn khỏi feed do bị báo cáo'),
  'listing.auto_held': L('Auto-check held a listing', 'Tự động giữ lại tin đăng'),
  'report.dismissed': L('Dismissed report', 'Đã bỏ qua báo cáo'),
  'organizer.warned': L('Warned organizer', 'Đã cảnh báo nhà tổ chức'),
  'organizer.verified': L('Verified organizer', 'Đã xác minh nhà tổ chức'),
  'organizer.revoked': L('Revoked verification', 'Đã thu hồi xác minh'),
  'organizer.messaged': L('Messaged the organizer', 'Đã nhắn cho nhà tổ chức'),
  'appeal.replied': L('Organizer replied to an appeal', 'Nhà tổ chức phản hồi khiếu nại'),
  'appeal.overturned': L('Overturned rejection, approved', 'Lật lại quyết định, đã duyệt'),
  'appeal.upheld': L('Upheld rejection', 'Giữ quyết định từ chối'),
  'shelf.published': L('Published featured shelf', 'Đã bật mục nổi bật'),
  'shelf.hidden': L('Hid featured shelf', 'Đã ẩn mục nổi bật'),
  'shelf.window_changed': L('Changed shelf dates', 'Đã đổi lịch mục nổi bật'),
  'shelf.item_added': L('Added to shelf', 'Đã thêm vào mục nổi bật'),
  'shelf.item_removed': L('Removed from shelf', 'Đã bỏ khỏi mục nổi bật'),
  'ads.campaign_created': L('Created ad campaign', 'Đã tạo chiến dịch quảng cáo'),
  'ads.inquiry_declined': L('Declined ad partner', 'Đã từ chối đối tác quảng cáo'),
  'ads.campaign_paused': L('Paused campaign', 'Đã tạm dừng chiến dịch'),
  'ads.campaign_resumed': L('Resumed campaign', 'Đã chạy lại chiến dịch'),
  'ads.rates_changed': L('Changed ad rates', 'Đã đổi giá quảng cáo'),
  'impersonation.started': L('Started impersonated session', 'Mở phiên xem hộ'),
  'impersonation.ended': L('Ended impersonated session', 'Kết thúc phiên xem hộ'),
  'payout.marked_paid': L('Recorded a payout transfer', 'Đã ghi nhận chuyển tiền'),
};

export function actionLabel(action: string, diff: DiffRow[] | null, lang: Lang): string {
  const base = ACTIONS[action]?.[lang] ?? action;
  const code = diff?.find((d) => d.f === 'reason_code')?.b;
  if (action === 'listing.rejected' && code && REJECT_REASONS[code]) return `${base} · ${REJECT_REASONS[code].label[lang]}`;
  return base;
}
