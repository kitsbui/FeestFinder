import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { initialsOf } from '../lib/contact.ts';
import type { Localized } from '../lib/i18n.ts';
import { discussionCounts, faqFor } from '../routes/discussion.ts';
import { kindsShown, nameOf, phaseOf, type Phase } from './community.ts';
import { RESALE_FEE_PCT } from './resale.ts';
import { latestUpdates } from '../routes/night.ts';

const firstName = (name: string | null) => nameOf(name).split(/\s+/).slice(-1)[0];

/**
 * Everything on an event page that the community and the organiser add to the listing
 * itself: who sent it in, the hype meter and its goals, the discussion, tickets being
 * passed on, and the people whose share links brought others here.
 */
export async function eventExtras(q: Queryable, ev: any, viewerId: string | null, now: Date) {
  const phase: Phase = phaseOf(ev, now);
  const [submitter, goals, hype24, counts, faq, resale, ambassadors, mine, updates, claim] = await Promise.all([
    ev.submitted_by ? one<any>(q, 'select name from users where id = $1', [ev.submitted_by]) : null,
    many<any>(q, 'select threshold, reward, reached_at from hype_goals where event_id = $1 order by threshold', [ev.id]),
    one<{ n: number }>(q, 'select count(*)::int as n from hypes where event_id = $1 and created_at > $2', [ev.id, new Date(now.getTime() - 86400_000)]),
    discussionCounts(q, ev.id),
    faqFor(q, ev.id, 6),
    one<any>(q,
      `select count(*)::int as n, min(l.price) as from_price from ticket_listings l join tickets t on t.id = l.ticket_id
        where l.event_id = $1 and l.status = 'active' and t.status = 'valid'`, [ev.id]),
    many<any>(q,
      `select u.name, count(*)::int as visits from share_visits v join users u on u.id = v.ref_user
        where v.event_id = $1 group by u.id, u.name order by visits desc, min(v.created_at) limit 5`, [ev.id]),
    viewerId ? Promise.all([
      one<any>(q, 'select ref_code from users where id = $1', [viewerId]),
      one<{ n: number }>(q, 'select count(*)::int as n from share_visits where event_id = $1 and ref_user = $2', [ev.id, viewerId]),
      one(q, 'select 1 from resale_watchers where user_id = $1 and event_id = $2', [viewerId, ev.id]),
      one<{ n: number }>(q, `select count(*)::int as n from tickets where event_id = $1 and user_id = $2 and status = 'valid'`, [ev.id, viewerId]),
    ]) : null,
    latestUpdates(q, ev.id, 5),
    // Whether the community still holds the event, and whether this viewer can ask to take it over.
    one<any>(q,
      `select o.is_community as community,
              exists (select 1 from organizer_members m where m.user_id = $1) as organiser,
              exists (select 1 from event_claims c join organizer_members m on m.organizer_id = c.organizer_id
                       where c.event_id = $3 and m.user_id = $1 and c.status = 'pending') as pending
         from organizers o where o.id = $2`, [viewerId, ev.organizer_id, ev.id]),
  ]);

  const count = ev.hype_count as number;
  const shaped = goals.map((g) => ({ threshold: g.threshold as number, reward: g.reward as Localized, reached: !!g.reached_at }));
  const next = shaped.find((g) => !g.reached) ?? null;
  const prev = [...shaped].reverse().find((g) => g.reached);
  const resaleOpen = ev.entry_mode === 'paid' && ev.resale_enabled && phase !== 'after';

  return {
    phase,
    community: ev.submitted_by ? {
      submittedBy: submitter ? { name: submitter.name?.trim() ? firstName(submitter.name) : null } : null,
      // Still run by the community, so its organiser can ask to take it over.
      claimable: !!claim?.community,
    } : null,
    hype: {
      count,
      last24h: hype24!.n,
      goals: shaped,
      next: next ? { threshold: next.threshold, left: Math.max(0, next.threshold - count), reward: next.reward,
        // How far along the way from the last goal (or zero) to the next one.
        progress: Math.min(1, Math.max(0, (count - (prev?.threshold ?? 0)) / Math.max(1, next.threshold - (prev?.threshold ?? 0)))) } : null,
    },
    discussion: { ...counts, kinds: kindsShown(phase), faqCount: faq.length },
    faq,
    resale: { enabled: resaleOpen, count: resaleOpen ? resale!.n : 0, fromPrice: resaleOpen ? resale!.from_price : null, feePct: RESALE_FEE_PCT },
    ambassadors: ambassadors.map((a) => ({ name: firstName(a.name), initials: initialsOf(nameOf(a.name)), visits: a.visits })),
    updates,
    mine: mine ? {
      refCode: mine[0]?.ref_code ?? null,
      broughtVisits: mine[1]!.n,
      watchingResale: !!mine[2],
      validTickets: mine[3]!.n,
      claim: claim?.community ? { organiser: !!claim.organiser, canClaim: !!claim.organiser && !claim.pending, pending: !!claim.pending } : null,
    } : null,
  };
}

