import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { MIN_PAYOUT, shareOf } from '../lib/affiliate.ts';
import { toVnd } from '../lib/money.ts';

/*
 * Ambassadors: people whose share links bring buyers to a partner seller. A partner's sale
 * (partner_conversions) carries the referrer copied from its click; this keeps one earning per
 * such sale, in step with the sale's state:
 *   pending   the partner has not approved the sale yet (or its currency has no rate)
 *   payable   approved: the referrer's share is owed
 *   paid      the team paid it (in a payout)
 *   void      the sale was rejected
 */

export type EarningStatus = 'pending' | 'payable' | 'paid' | 'void';

/** Brings a sale's earning in line with the sale. A sale nobody referred earns nothing. */
export async function settleEarning(q: Queryable, conversionId: string, now: Date): Promise<EarningStatus | null> {
  const c = await one<{ id: string; ref_user: string | null; event_id: string | null; partner_id: string; status: string; commission: string | number; currency: string }>(q,
    'select id, ref_user, event_id, partner_id, status, commission, currency from partner_conversions where id = $1', [conversionId]);
  if (!c || !c.ref_user) return null;
  const src = shareOf(Number(c.commission));
  const vnd = toVnd(src, c.currency);
  const status: EarningStatus = c.status === 'rejected' ? 'void'
    : vnd === null ? 'pending'
    : c.status === 'approved' || c.status === 'paid' ? 'payable' : 'pending';
  const reason = vnd === null ? 'no_rate' : null;
  const row = await one<{ status: EarningStatus }>(q,
    `insert into ambassador_earnings (conversion_id, user_id, event_id, partner_id, currency, amount_src, amount, status, reason, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
     on conflict (conversion_id) do update set
       amount_src = excluded.amount_src, amount = excluded.amount, currency = excluded.currency, reason = excluded.reason,
       status = case when ambassador_earnings.status = 'paid' then 'paid' else excluded.status end,
       updated_at = excluded.updated_at
     returning status`,
    [c.id, c.ref_user, c.event_id, c.partner_id, c.currency, src, vnd, status, reason, now]);
  return row?.status ?? null;
}

export interface CommissionRow {
  eventId: string; slug: string; title: string; startsOn: string | null;
  opens: number; clicks: number; conversions: number; pending: number; payable: number; paid: number;
}

/** A person's referrals per event: who opened their links, clicked Mua vé, bought, and what it earned (VND). */
export async function commissionOf(q: Queryable, userId: string): Promise<{ items: CommissionRow[]; totals: { opens: number; clicks: number; conversions: number; pending: number; payable: number; paid: number }; minPayout: number }> {
  type R = { id: string; slug: string; title: string; starts_on: string | null; opens: number; clicks: number; conversions: number; pending: string; payable: string; paid: string };
  const rows = await many<R>(q,
    `with ev as (
       select event_id from share_visits where ref_user = $1
       union select event_id from outbound_clicks where ref_user = $1 and event_id is not null
       union select event_id from ambassador_earnings where user_id = $1 and event_id is not null
     )
     select e.id, e.slug, e.title, e.starts_on::text as starts_on,
            (select count(*)::int from share_visits v where v.ref_user = $1 and v.event_id = e.id) as opens,
            (select count(*)::int from outbound_clicks c where c.ref_user = $1 and c.event_id = e.id) as clicks,
            (select count(*)::int from ambassador_earnings a where a.user_id = $1 and a.event_id = e.id and a.status <> 'void') as conversions,
            (select coalesce(sum(a.amount), 0)::bigint from ambassador_earnings a where a.user_id = $1 and a.event_id = e.id and a.status = 'pending') as pending,
            (select coalesce(sum(a.amount), 0)::bigint from ambassador_earnings a where a.user_id = $1 and a.event_id = e.id and a.status = 'payable') as payable,
            (select coalesce(sum(a.amount), 0)::bigint from ambassador_earnings a where a.user_id = $1 and a.event_id = e.id and a.status = 'paid') as paid
       from ev join events e on e.id = ev.event_id
      order by e.starts_on desc nulls last, e.title
      limit 200`, [userId]);
  const items: CommissionRow[] = rows.map((r) => ({
    eventId: r.id, slug: r.slug, title: r.title, startsOn: r.starts_on,
    opens: r.opens, clicks: r.clicks, conversions: r.conversions, pending: Number(r.pending), payable: Number(r.payable), paid: Number(r.paid),
  }));
  const sum = (k: keyof CommissionRow) => items.reduce((n, r) => n + Number(r[k]), 0);
  return { items, totals: { opens: sum('opens'), clicks: sum('clicks'), conversions: sum('conversions'), pending: sum('pending'), payable: sum('payable'), paid: sum('paid') }, minPayout: MIN_PAYOUT };
}
