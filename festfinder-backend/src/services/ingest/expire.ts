import type { Queryable } from '../../db/index.ts';
import { many } from '../../db/index.ts';
import { appendAudit } from '../audit.ts';

/*
 * Feest Radar clears its finds a day after they end (owner, 2026-10-17): `ends_at` is the end of
 * the last day, so a one-night club show goes the day after and a festival of several days the
 * day after its last one (services/events.ts instantsOf). What nobody posted (origin radar) is
 * marked expired, live or still waiting for review; nothing is deleted, and an event someone
 * posted or claimed keeps its page as a past event.
 */

export const EXPIRE_AFTER_MS = 24 * 3600_000;

export async function expireRadar(q: Queryable, now: Date): Promise<number> {
  const rows = await many<{ id: string; title: string }>(q,
    `update events set status = 'expired', expired_at = $1
      where origin = 'radar' and status in ('live', 'in_review') and ends_at < $2
      returning id, title`,
    [now, new Date(now.getTime() - EXPIRE_AFTER_MS)]);
  for (const r of rows) {
    await appendAudit(q, {
      at: now, actorType: 'system', actorId: null, actorLabel: 'Feest Radar', action: 'listing.expired',
      targetType: 'event', targetId: r.id, targetLabel: r.title, diff: [{ f: 'status', a: '—', b: 'expired' }],
    });
  }
  return rows.length;
}
