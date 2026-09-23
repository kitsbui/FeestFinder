import type { Ctx } from './context.ts';
import { many, one } from './db/index.ts';
import { L } from './lib/i18n.ts';
import { vnTime } from './lib/time.ts';
import { deliverDue } from './services/messaging.ts';
import { notifyOrganizer, notifyUser } from './services/notify.ts';
import { dispatchAnnouncement } from './routes/organizer/audience.ts';
import { checkTicketLink } from './routes/organizer/events.ts';

/** One pass of every scheduled task. Tests call this directly with a controlled clock. */
export const jobs = {
  async deliverOutbox(ctx: Ctx) {
    return deliverDue(ctx.db, ctx.clock, ctx.transport);
  },

  async sendScheduledAnnouncements(ctx: Ctx) {
    const now = ctx.clock.now();
    const due = await many<{ id: string }>(ctx.db, `select id from announcements where status = 'scheduled' and send_at <= $1 order by send_at`, [now]);
    for (const a of due) await ctx.db.tx((q) => dispatchAnnouncement(q, a.id, now));
    return due.length;
  },

  /** Unpaid holds release their seats after 15 minutes. */
  async expireOrders(ctx: Ctx) {
    const rows = await many(ctx.db, `update orders set status = 'expired' where status = 'pending' and expires_at < $1 returning 1`, [ctx.clock.now()]);
    return rows.length;
  },

  async expireAppeals(ctx: Ctx) {
    const rows = await many(ctx.db, `update appeals set state = 'expired' where state in ('open', 'replied') and closes_at < $1 returning 1`, [ctx.clock.now()]);
    return rows.length;
  },

  /** Saved events a day out, picked sets 15 minutes out, and tiers that just opened. */
  async reminders(ctx: Ctx) {
    const now = ctx.clock.now();
    let sent = 0;
    const saved = await many<any>(ctx.db,
      `select s.user_id, e.id, e.title, e.start_time, e.venue_name from saves s join events e on e.id = s.event_id
        where e.status = 'live' and e.starts_at between $1 and $2`, [now, new Date(now.getTime() + 24 * 3600_000)]);
    for (const r of saved) {
      await ctx.db.tx(async (q) => {
        if (await notifyUser(q, now, {
          userId: r.user_id, topic: 'saved', kind: 'saved_reminder', dedupeKey: `saved-reminder:${r.id}`,
          title: L(`Tomorrow: ${r.title}`, `Ngày mai: ${r.title}`),
          body: L(`Doors ${r.start_time} · ${r.venue_name}`, `Mở cửa ${r.start_time} · ${r.venue_name}`),
          link: { screen: 'event', eventId: r.id },
        })) sent++;
      });
    }
    const sets = await many<any>(ctx.db,
      `select p.user_id, st.id, st.artist, st.starts_at, st.event_id, sg.name as stage from plan_picks p
         join sets st on st.id = p.set_id join stages sg on sg.id = st.stage_id
        where p.remind and p.reminded_at is null and st.starts_at between $1 and $2`, [now, new Date(now.getTime() + 15 * 60_000)]);
    for (const r of sets) {
      await ctx.db.tx(async (q) => {
        await q.query('update plan_picks set reminded_at = $3 where user_id = $1 and set_id = $2', [r.user_id, r.id, now]);
        if (await notifyUser(q, now, {
          userId: r.user_id, topic: 'sets', kind: 'set_reminder', urgent: true, dedupeKey: `set-reminder:${r.id}`,
          title: L(`${r.artist} at ${vnTime(new Date(r.starts_at))}`, `${r.artist} lúc ${vnTime(new Date(r.starts_at))}`),
          body: { en: r.stage.en, vi: r.stage.vi }, link: { screen: 'live', eventId: r.event_id },
        })) sent++;
      });
    }
    const tiers = await many<any>(ctx.db,
      `select w.user_id, w.tier_id, t.name, e.id as event_id, e.title from tier_watchers w join ticket_tiers t on t.id = w.tier_id join events e on e.id = t.event_id
        where w.notified_at is null and t.sales_open_at <= $1 and t.sold < t.capacity`, [now]);
    for (const r of tiers) {
      await ctx.db.tx(async (q) => {
        await q.query('update tier_watchers set notified_at = $3 where user_id = $1 and tier_id = $2', [r.user_id, r.tier_id, now]);
        if (await notifyUser(q, now, {
          userId: r.user_id, topic: 'tickets', kind: 'tier_open', dedupeKey: `tier-open:${r.tier_id}`,
          title: L(`${r.name.en} is on sale`, `${r.name.vi} đã mở bán`), body: { en: r.title, vi: r.title },
          link: { screen: 'event', eventId: r.event_id },
        })) sent++;
      });
    }
    return sent;
  },

  /** Tells the organiser once when a tier passes 90% sold. */
  async lowTicketAlerts(ctx: Ctx) {
    const now = ctx.clock.now();
    const rows = await many<any>(ctx.db,
      `select t.id, t.name, t.capacity, t.sold, e.id as event_id, e.organizer_id, e.starts_on from ticket_tiers t join events e on e.id = t.event_id
        where e.status = 'live' and e.ends_at > $1 and t.capacity > 0 and t.sold < t.capacity and t.sold::float / t.capacity >= 0.9`, [now]);
    let sent = 0;
    for (const t of rows) {
      const left = t.capacity - t.sold;
      const pct = Math.round((t.sold / t.capacity) * 100);
      const ok = await ctx.db.tx((q) => notifyOrganizer(q, now, {
        organizerId: t.organizer_id, topic: 'tickets', kind: 'tickets', dedupeKey: `low-tier:${t.id}`,
        title: L(`${t.name.en} tickets running low`, `Vé ${t.name.vi} gần hết`),
        body: L(`${left} of ${t.capacity.toLocaleString('en-US')} ${t.name.en} left — ${pct}% sold.`, `Còn ${left} trong ${t.capacity.toLocaleString('vi-VN')} vé ${t.name.vi} — đã bán ${pct}%.`),
        cta: L('See ticket tiers', 'Xem loại vé'), link: { screen: 'money', eventId: t.event_id },
      }));
      if (ok) sent++;
    }
    return sent;
  },

  async checkTicketLinks(ctx: Ctx) {
    if (!ctx.config.linkChecksEnabled) return 0;
    const rows = await many<any>(ctx.db,
      `select id, ticket_url from events where status = 'in_review' and entry_mode = 'paid' and ticket_url is not null and coalesce(ticket_link_status, 'unchecked') = 'unchecked' limit 20`);
    for (const r of rows) await checkTicketLink(ctx, r.id, r.ticket_url).catch((e) => ctx.log(`link check ${r.id}: ${e}`));
    return rows.length;
  },
};

const SCHEDULE: [keyof typeof jobs, number][] = [
  ['deliverOutbox', 5_000],
  ['sendScheduledAnnouncements', 30_000],
  ['expireOrders', 60_000],
  ['reminders', 5 * 60_000],
  ['lowTicketAlerts', 10 * 60_000],
  ['expireAppeals', 10 * 60_000],
  ['checkTicketLinks', 15 * 60_000],
];

/**
 * One scheduler per job name across the whole fleet.
 *
 * Every instance may run with JOBS_ENABLED=true: each tick takes a Postgres advisory
 * lock named after the job and skips the run if another instance holds it. So scaling the
 * API out does not send an announcement twice, and losing the instance that happened to
 * hold a lock only delays that job by one interval.
 */
export function startJobs(ctx: Ctx): () => void {
  const timers: NodeJS.Timeout[] = [];
  const running = new Set<string>();
  for (const [name, every] of SCHEDULE) {
    timers.push(setInterval(async () => {
      if (running.has(name)) return;
      running.add(name);
      try {
        await withJobLock(ctx, name, () => jobs[name](ctx));
      } catch (e) {
        ctx.log(`job ${name} failed: ${(e as Error).stack ?? e}`);
      } finally {
        running.delete(name);
      }
    }, every));
  }
  return () => timers.forEach(clearInterval);
}

/**
 * Runs `fn` only if no other instance is running this job. The lock lives for the length
 * of the transaction, so a crash releases it with the connection.
 */
export async function withJobLock(ctx: Ctx, name: string, fn: () => Promise<unknown>): Promise<unknown> {
  // PGlite is in-process, so there is only ever one instance — and it has one connection,
  // which a held transaction would starve the job of.
  if (ctx.db.kind === 'pglite') return fn();
  return ctx.db.tx(async (q) => {
    const got = await one<{ locked: boolean }>(q, 'select pg_try_advisory_xact_lock(hashtext($1)) as locked', [`ff:job:${name}`]);
    if (!got?.locked) return 'locked';
    return fn();
  });
}

export async function runAllJobsOnce(ctx: Ctx) {
  const out: Record<string, unknown> = {};
  for (const [name] of SCHEDULE) out[name] = await jobs[name](ctx);
  return out;
}
