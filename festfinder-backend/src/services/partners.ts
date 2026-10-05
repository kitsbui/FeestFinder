import type { Queryable } from '../db/index.ts';
import { json, many, one } from '../db/index.ts';
import { vnDate } from '../lib/time.ts';
import { hostOf } from './ingest/normalize.ts';

/*
 * Ticket partners: where a ticket button sends people, and what FeestFinder earns from it.
 * Every press goes through /go/<event>, which counts it, picks the way out (FeestFinder's own
 * checkout, a partner's tracked link, or the organiser's link as it is) and redirects. A
 * partner reports each sale back with the click's id, so a sale is tied to the event it came
 * from.
 */

export interface Partner {
  id: string;
  slug: string;
  name: string;
  hosts: string[];
  link_template: string | null;
  link_params: Record<string, string>;
  commission_pct: string | number;
  enabled: boolean;
}

export const CONVERSION_STATUS = ['pending', 'approved', 'rejected', 'paid'] as const;
export type ConversionStatus = (typeof CONVERSION_STATUS)[number];

/** A site and its subdomains: "ticketbox.vn" covers "www.ticketbox.vn" and "m.ticketbox.vn". */
export const normalizeHost = (h: string) => h.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/:].*$/, '');
export const hostMatches = (host: string, hosts: string[]) => hosts.some((h) => host === h || host.endsWith(`.${h}`));

/** The enabled partner that sells on this link's site, if any. */
export async function partnerForUrl(q: Queryable, url: string): Promise<Partner | null> {
  const host = hostOf(url);
  if (!host) return null;
  const rows = await many<Partner>(q, 'select * from ticket_partners where enabled and cardinality(hosts) > 0 order by created_at');
  return rows.find((p) => hostMatches(host, p.hosts.map(normalizeHost))) ?? null;
}

/**
 * The ticket link as the partner wants it: its parameters added, then wrapped in its tracking
 * link when it has one. `{click}` anywhere becomes the click's id, `{url}` the encoded link.
 */
export function partnerLink(ticketUrl: string, p: Pick<Partner, 'link_template' | 'link_params'>, clickId: string): string {
  const fill = (s: string) => s.replaceAll('{click}', clickId);
  const u = new URL(ticketUrl);
  for (const [k, v] of Object.entries(p.link_params ?? {})) u.searchParams.set(k, fill(String(v)));
  const target = u.toString();
  return p.link_template ? fill(p.link_template).replaceAll('{url}', encodeURIComponent(target)) : target;
}

/** What partners call a sale's state, in FeestFinder's four words. */
export function conversionStatus(v: unknown): ConversionStatus {
  const s = String(v ?? '').trim().toLowerCase();
  if (['approved', 'approve', 'confirmed', 'confirm', 'success', 'successful', 'completed', 'complete', 'valid'].includes(s)) return 'approved';
  if (['rejected', 'reject', 'declined', 'cancelled', 'canceled', 'refunded', 'failed', 'invalid', 'void'].includes(s)) return 'rejected';
  if (s === 'paid') return 'paid';
  return 'pending';
}

export interface ConversionInput {
  orderRef: string;
  amount: number;
  currency: string;
  status: ConversionStatus;
  clickId: string | null;
  commission: number | null;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

/** Keeps a sale a partner reported. The same order again updates it; a paid one stays paid. */
export async function recordConversion(q: Queryable, partner: Partner, c: ConversionInput, now: Date): Promise<{ id: string; created: boolean; matched: boolean }> {
  const click = c.clickId
    ? await one<{ id: string; event_id: string }>(q, 'select id, event_id from outbound_clicks where id = $1 and partner_id = $2', [c.clickId, partner.id])
    : null;
  const commission = c.commission ?? Math.round((c.amount * Number(partner.commission_pct)) / 100);
  const row = await one<{ id: string; created: boolean }>(q,
    `insert into partner_conversions (partner_id, click_id, event_id, order_ref, amount, currency, commission, status, occurred_at, received_at, payload)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (partner_id, order_ref) do update set
       amount = excluded.amount, currency = excluded.currency, commission = excluded.commission,
       status = case when partner_conversions.status = 'paid' then 'paid' else excluded.status end,
       click_id = coalesce(partner_conversions.click_id, excluded.click_id),
       event_id = coalesce(partner_conversions.event_id, excluded.event_id),
       received_at = excluded.received_at, payload = excluded.payload
     returning id, (xmax = 0) as created`,
    [partner.id, click?.id ?? null, click?.event_id ?? null, c.orderRef, c.amount, c.currency, commission, c.status, c.occurredAt, now, json(c.payload)]);
  return { id: row!.id, created: row!.created, matched: !!click };
}

/** One more view or ticket click on an event's daily counters, by where it came from. */
export async function countEventMetric(q: Queryable, eventId: string, kind: 'views' | 'ticket_clicks', source: string, now: Date): Promise<boolean> {
  const bySource = kind === 'views';
  const res = await one(q,
    `insert into event_metrics_daily (event_id, day, ${kind}, sources)
     select id, $2, 1, case when $4 then jsonb_build_object($3::text, 1) else '{}'::jsonb end from events where id = $1
     on conflict (event_id, day) do update set
       ${kind} = event_metrics_daily.${kind} + 1,
       sources = case when $4 then jsonb_set(event_metrics_daily.sources, array[$3::text],
         to_jsonb(coalesce((event_metrics_daily.sources->>$3::text)::int, 0) + 1)) else event_metrics_daily.sources end
     returning 1`,
    [eventId, vnDate(now), source, bySource]);
  return !!res;
}
