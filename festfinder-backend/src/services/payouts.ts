import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { addDays, addWorkingDays, vnDate } from '../lib/time.ts';

/** Payout policy. Percentages apply to ticket revenue after promo discounts. */
export const PAYOUT_POLICY = {
  platformFeePct: 4,
  paymentFeePct: 1.8,
  transferFee: 11_000,
  advancePct: 50,
  /** Share of gross kept back until refunds settle. */
  refundHoldPct: 1.5,
  settleWorkingDays: 3,
  refundHoldDays: 7,
  /** The advance can be requested once the event is this close. */
  advanceWindowDays: 14,
};

const fees = (basis: number) => ({
  platform: Math.round((basis * PAYOUT_POLICY.platformFeePct) / 100),
  payment: Math.round((basis * PAYOUT_POLICY.paymentFeePct) / 100),
});

export interface LedgerLine { key: string; label: Localized; amount: number }
export interface LedgerRow {
  kind: 'advance' | 'post_event' | 'refund_hold';
  period: Localized;
  status: 'paid' | 'available' | 'scheduled' | 'held' | 'released';
  settlesOn: string | null;
  settles: Localized;
  lines: LedgerLine[];
  net: number;
  reference: string | null;
}

export async function revenueTotals(q: Queryable, eventId: string) {
  return (await one<any>(q,
    `select coalesce(sum(subtotal - discount) filter (where status in ('paid','refunded')), 0)::bigint as gross_all,
            coalesce(sum(subtotal - discount) filter (where status = 'paid'), 0)::bigint as gross,
            coalesce(sum(subtotal - discount) filter (where status = 'refunded'), 0)::bigint as refunded,
            coalesce(sum(qty) filter (where status = 'paid'), 0)::int as tickets,
            count(*) filter (where status = 'refunded')::int as refund_orders,
            coalesce(sum(qty) filter (where status = 'refunded'), 0)::int as refunded_tickets,
            coalesce(sum(discount) filter (where status = 'paid'), 0)::bigint as discount
       from orders where event_id = $1`, [eventId]))!;
}

export async function payoutLedger(q: Queryable, ev: { id: string; starts_on: string; ends_on: string | null }, now: Date): Promise<LedgerRow[]> {
  const t = await revenueTotals(q, ev.id);
  const transfers = await many<any>(q, 'select kind, amount, gross_basis, reference, paid_at from payout_transfers where event_id = $1', [ev.id]);
  const paid = (k: string) => transfers.find((x) => x.kind === k);
  const today = vnDate(now);
  const endsOn = ev.ends_on ?? ev.starts_on;
  const P = PAYOUT_POLICY;

  const dm = (d: string) => ({ en: `${Number(d.slice(8, 10))} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(d.slice(5, 7)) - 1]}`, vi: `${d.slice(8, 10)}/${d.slice(5, 7)}` });

  // Advance: half of what has sold so far, once the event is near.
  const adv = paid('advance');
  const advBasis = adv ? adv.gross_basis : Math.round((t.gross * P.advancePct) / 100);
  const advFees = fees(advBasis);
  const advNet = advBasis - advFees.platform - advFees.payment - (advBasis ? P.transferFee : 0);
  const advanceOpen = today >= addDays(ev.starts_on, -P.advanceWindowDays);
  const advPaidOn = adv ? vnDate(new Date(adv.paid_at)) : null;

  // Post-event: the rest, less the refund hold, three working days after it ends.
  const post = paid('post_event');
  const hold = Math.round((t.gross * P.refundHoldPct) / 100);
  const postBasis = Math.max(0, t.gross - advBasis);
  const postFees = fees(postBasis);
  const postNet = postBasis - postFees.platform - postFees.payment - hold - (postBasis ? P.transferFee : 0);
  const settleOn = addWorkingDays(endsOn, P.settleWorkingDays);

  // Refund hold: released seven days after the event, less refunds made after it ended.
  const late = await one<any>(q,
    `select coalesce(sum(subtotal - discount), 0)::bigint as amount, count(*)::int as orders, coalesce(sum(qty),0)::int as tickets
       from orders where event_id = $1 and status = 'refunded' and refunded_at >= $2`, [ev.id, new Date(`${endsOn}T23:59:59+07:00`)]);
  const released = paid('refund_hold');
  const releaseOn = addDays(endsOn, P.refundHoldDays);
  const holdNet = Math.max(0, hold - late.amount);

  return [
    {
      kind: 'advance',
      period: L(`Advance ${P.advancePct}%`, `Tạm ứng ${P.advancePct}%`),
      status: adv ? 'paid' : advanceOpen && advBasis > 0 ? 'available' : 'scheduled',
      settlesOn: advPaidOn,
      settles: adv ? L(`Settled ${dm(advPaidOn!).en}`, `Đã về tài khoản ${dm(advPaidOn!).vi}`)
        : advanceOpen ? L('Available now · paid within one working day of request', 'Có thể nhận · chuyển trong một ngày làm việc')
        : L(`Opens ${dm(addDays(ev.starts_on, -P.advanceWindowDays)).en}`, `Mở từ ${dm(addDays(ev.starts_on, -P.advanceWindowDays)).vi}`),
      lines: [
        { key: 'gross_share', label: L(`${P.advancePct}% of tickets sold to date`, `Tạm ứng ${P.advancePct}% doanh thu đã bán`), amount: advBasis },
        { key: 'platform_fee', label: L(`Platform fee ${P.platformFeePct}%`, `Phí nền tảng ${P.platformFeePct}%`), amount: -advFees.platform },
        { key: 'payment_fee', label: L(`Payment fee ${P.paymentFeePct}%`, `Phí thanh toán ${String(P.paymentFeePct).replace('.', ',')}%`), amount: -advFees.payment },
        { key: 'transfer_fee', label: L('Bank transfer fee', 'Phí chuyển khoản'), amount: advBasis ? -P.transferFee : 0 },
      ],
      net: adv ? adv.amount : advNet,
      reference: adv?.reference ?? null,
    },
    {
      kind: 'post_event',
      period: L(`Post-event · ${dm(settleOn).en}`, `Sau sự kiện · ${dm(settleOn).vi}`),
      status: post ? 'paid' : 'scheduled',
      settlesOn: settleOn,
      settles: post ? L(`Settled ${dm(vnDate(new Date(post.paid_at))).en}`, `Đã về tài khoản ${dm(vnDate(new Date(post.paid_at))).vi}`)
        : L(`Settles ${dm(settleOn).en} · three working days after the event`, `Về tài khoản ${dm(settleOn).vi} · 3 ngày làm việc sau sự kiện`),
      lines: [
        { key: 'gross_share', label: L('Remaining ticket revenue', 'Phần còn lại của doanh thu vé'), amount: postBasis },
        { key: 'platform_fee', label: L(`Platform fee ${P.platformFeePct}%`, `Phí nền tảng ${P.platformFeePct}%`), amount: -postFees.platform },
        { key: 'payment_fee', label: L(`Payment fee ${P.paymentFeePct}%`, `Phí thanh toán ${String(P.paymentFeePct).replace('.', ',')}%`), amount: -postFees.payment },
        { key: 'refund_hold', label: L('Held back for refunds', 'Giữ lại cho hoàn tiền'), amount: -hold },
        { key: 'transfer_fee', label: L('Bank transfer fee', 'Phí chuyển khoản'), amount: postBasis ? -P.transferFee : 0 },
      ],
      net: post ? post.amount : postNet,
      reference: post?.reference ?? null,
    },
    {
      kind: 'refund_hold',
      period: L('Refund hold', 'Giữ lại cho hoàn tiền'),
      status: released ? 'released' : 'held',
      settlesOn: releaseOn,
      settles: L(`Released ${dm(releaseOn).en} · seven days after the event`, `Giải phóng ${dm(releaseOn).vi} · 7 ngày sau sự kiện`),
      lines: [
        { key: 'held', label: L('Held under the refund policy', 'Giữ lại theo chính sách hoàn tiền'), amount: hold },
        { key: 'refunded', label: L(`Refunded to guests (${late.tickets} tickets)`, `Đã hoàn cho khách (${late.tickets} vé)`), amount: -late.amount },
        { key: 'balance', label: L('Balance released to you', 'Phần còn lại chuyển cho bạn'), amount: holdNet },
      ],
      net: released ? released.amount : holdNet,
      reference: released?.reference ?? null,
    },
  ];
}
