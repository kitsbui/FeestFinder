import type { Ctx } from './context.ts';
import { many, one, type Db } from './db/index.ts';
import { L } from './lib/i18n.ts';
import { vnTime } from './lib/time.ts';
import { deliverDue } from './services/messaging.ts';
import { notifyUser } from './services/notify.ts';
import { dispatchAnnouncement } from './routes/organizer/audience.ts';
import { checkTicketLink } from './routes/organizer/events.ts';
import { pingIndexNow } from './services/seo.ts';
import { refreshConfidence } from './services/ingest/confidence.ts';
import { awardAll } from './services/badges.ts';
import { runDueSources } from './services/ingest/run.ts';
import { expireRadar } from './services/ingest/expire.ts';
import { translatePending } from './services/translate.ts';
import { refreshAllFit } from './services/ingest/fit.ts';
import { checkRemoteImages } from './services/remote-images.ts';
import { purgeFeedbackAttachments } from './routes/feedback.ts';
import { webHealth } from './services/web-signals.ts';

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

  /** Tells IndexNow about event pages that went live or changed. */
  async pingIndexNow(ctx: Ctx) {
    return pingIndexNow(ctx);
  },

  async expireAppeals(ctx: Ctx) {
    const rows = await many(ctx.db, `update appeals set state = 'expired' where state in ('open', 'replied') and closes_at < $1 returning 1`, [ctx.clock.now()]);
    return rows.length;
  },

  /** Saved events a day out and picked sets 15 minutes out. */
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
    return sent;
  },

  /** Sources whose interval has come round, within a time budget per call. */
  async ingest(ctx: Ctx) {
    const runs = await runDueSources(ctx, { budgetMs: 35_000 });
    return runs.map((r) => ({ source: r.name, created: r.created, merged: r.merged, rejected: r.rejected, failed: r.failed }));
  },

  /** Badges reached since the last run, for everyone who could have reached one. */
  async awardBadges(ctx: Ctx) {
    return awardAll(ctx.db, ctx.clock.now());
  },

  /** Confidence decays when sources stop listing an event, so it is recomputed for every upcoming one. */
  /** A live listing's description in the other language, machine-written and marked (services/translate.ts). */
  async translateDescriptions(ctx: Ctx) {
    return translatePending(ctx, 10);
  },

  /** Feest Radar's finds go a day after they end (services/ingest/expire.ts). */
  async expireRadar(ctx: Ctx) {
    return ctx.db.tx((q) => expireRadar(q, ctx.clock.now()));
  },

  /** The fit of what waits for review and of upcoming Radar finds, as people's follows and alerts change. */
  async refreshFit(ctx: Ctx) {
    return ctx.db.tx((q) => refreshAllFit(q, ctx.clock.now()));
  },

  async refreshConfidence(ctx: Ctx) {
    return refreshConfidence(ctx.db, ctx.clock.now());
  },

  /** Linked pictures checked again every week; one that keeps failing is marked broken and its owner told. */
  async checkRemoteImages(ctx: Ctx) {
    if (!ctx.config.linkChecksEnabled) return 0;
    return checkRemoteImages(ctx);
  },

  /** Feedback screenshots are deleted after 90 days (routes/feedback.ts). */
  async purgeFeedbackAttachments(ctx: Ctx) {
    return purgeFeedbackAttachments(ctx);
  },

  /** The browsers' hour: too many uncaught errors tell the admins; reports older than 30 days go (design v2 phase 19). */
  async webHealth(ctx: Ctx) {
    return webHealth(ctx.db, ctx.clock.now());
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
  ['reminders', 5 * 60_000],
  ['expireAppeals', 10 * 60_000],
  ['checkTicketLinks', 15 * 60_000],
  ['checkRemoteImages', 10 * 60_000],
  ['purgeFeedbackAttachments', 4 * 60 * 60_000],
  ['pingIndexNow', 5 * 60_000],
  ['refreshConfidence', 60 * 60_000],
  ['expireRadar', 60 * 60_000],
  ['translateDescriptions', 10 * 60_000],
  ['refreshFit', 60 * 60_000],
  ['awardBadges', 60 * 60_000],
  ['webHealth', 60 * 60_000],
  // Last: it spends whatever time the call has left.
  ['ingest', 5 * 60_000],
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
    const tick = async () => {
      if (running.has(name)) return;
      running.add(name);
      try {
        await withJobLock(ctx, name, () => jobs[name](ctx));
      } catch (e) {
        ctx.log(`job ${name} failed: ${(e as Error).stack ?? e}`);
      } finally {
        running.delete(name);
      }
    };
    // tick catches its own errors, so nothing is left unhandled.
    timers.push(setInterval(() => void tick(), every));
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

/**
 * One call of POST /internal/jobs, made every minute by a scheduler outside the process
 * (pg_cron on Supabase). Each job keeps roughly its interval: those under a minute run on
 * every call, the others when the wall-clock minute is a multiple of theirs. Each still
 * takes its lock, so an overlapping call skips what is already running.
 */
export async function runDueJobs(ctx: Ctx, at = new Date()) {
  const minute = Math.floor(at.getTime() / 60_000);
  const out: Record<string, unknown> = {};
  for (const [name, every] of SCHEDULE) {
    const minutes = Math.max(1, Math.round(every / 60_000));
    if (minute % minutes !== 0) continue;
    try {
      out[name] = await withJobLock(ctx, name, () => jobs[name](ctx));
    } catch (e) {
      ctx.log(`job ${name} failed: ${(e as Error).stack ?? e}`);
      out[name] = 'failed';
    }
  }
  return out;
}

/**
 * On Supabase: pg_cron posts to /internal/jobs every minute through pg_net, so the jobs run
 * without a long-lived process. Called at startup; scheduling by name replaces the entry, so
 * a new URL or secret takes effect on the next start. Elsewhere pg_cron is not available and
 * this does nothing. The secret sits in cron.job, readable only by the database's owners.
 */
export async function scheduleSupabaseCron(db: Db, url: string, secret: string, log: (msg: string) => void) {
  const available = await one<{ ok: boolean }>(db, `select count(*) = 2 as ok from pg_available_extensions where name in ('pg_cron', 'pg_net')`);
  if (!available?.ok) return;
  await db.query('create extension if not exists pg_cron');
  await db.query('create extension if not exists pg_net with schema extensions');
  const lit = (v: string) => `'${v.replaceAll("'", "''")}'`;
  const call = `select net.http_post(url := ${lit(url)}, headers := jsonb_build_object('Authorization', ${lit(`Bearer ${secret}`)}, 'Content-Type', 'application/json'), body := '{}'::jsonb, timeout_milliseconds := 55000)`;
  await db.query(`select cron.schedule('feestfinder-jobs', '* * * * *', $1)`, [call]);
  log(`pg_cron calls ${url} every minute`);
}
