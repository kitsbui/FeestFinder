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
import { translatePending } from './services/translate.ts';
import { refreshAllFit } from './services/ingest/fit.ts';
import { checkRemoteImages } from './services/remote-images.ts';
import { runImageCdn } from './services/image-cdn.ts';
import { importBlogContent } from './services/blog-content.ts';
import { purgeFeedbackAttachments } from './routes/feedback.ts';
import { webHealth } from './services/web-signals.ts';
import { digestPending, fetchDueNews } from './services/news.ts';
import { refreshDueCharts } from './services/charts.ts';

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

  /** Badges reached since the last run, for everyone who could have reached one. */
  async awardBadges(ctx: Ctx) {
    return awardAll(ctx.db, ctx.clock.now());
  },

  /** Confidence decays when sources stop listing an event, so it is recomputed for every upcoming one. */
  /** A live listing's description in the other language, machine-written and marked (services/translate.ts). */
  async translateDescriptions(ctx: Ctx) {
    return translatePending(ctx, 10);
  },

  /** The fit of what waits for review, as people's follows and alerts change. */
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

  /** A taken-down picture's /img copies deleted from the CDN, a new cover's made ahead of its first visitor (services/image-cdn.ts). */
  async imageCdn(ctx: Ctx) {
    return runImageCdn(ctx);
  },

  /** The team's editorial posts from the repository's content packs: new ones wait for review, edited ones are never written over (services/blog-content.ts). */
  async importBlogContent(ctx: Ctx) {
    return (await importBlogContent(ctx)).added;
  },

  /** Feedback screenshots are deleted after 90 days (routes/feedback.ts). */
  async purgeFeedbackAttachments(ctx: Ctx) {
    return purgeFeedbackAttachments(ctx);
  },

  /** The browsers' hour: too many uncaught errors tell the admins; reports older than 30 days go (design v2 phase 19). */
  async webHealth(ctx: Ctx) {
    return webHealth(ctx.db, ctx.clock.now());
  },

  /** The news feed: each publication's feed read on its interval, new headlines kept with their pictures (services/news.ts). */
  async fetchNews(ctx: Ctx) {
    return (await fetchDueNews(ctx)).reduce((n, s) => n + s.added, 0);
  },

  /** Two-sentence digests of the newest headlines, in both languages, when Claude is configured. */
  async digestNews(ctx: Ctx) {
    return (await digestPending(ctx, 20)).written;
  },

  /** The charts of each style (YouTube Music, Beatport, Spotify) read on their interval, with the keys in the environment (services/charts.ts). */
  async refreshCharts(ctx: Ctx) {
    return (await refreshDueCharts(ctx)).filter((r) => !r.error).length;
  },

  async checkTicketLinks(ctx: Ctx) {
    if (!ctx.config.linkChecksEnabled) return 0;
    const rows = await many<any>(ctx.db,
      `select id, ticket_url from events where status = 'in_review' and entry_mode = 'paid' and ticket_url is not null and coalesce(ticket_link_status, 'unchecked') = 'unchecked' limit 20`);
    for (const r of rows) await checkTicketLink(ctx, r.id, r.ticket_url).catch((e) => ctx.log(`link check ${r.id}: ${e}`));
    return rows.length;
  },
};

/**
 * Every job, how often it runs, and at which minute of its interval (`at`): POST /internal/jobs
 * comes once a minute and runs what is due in one call, so the heavy jobs (those that read the
 * network, call Claude or walk many rows) each have a minute of their own and never share a call
 * (test/deploy.test.ts checks it); the light ones go where they fall. Before 2026-10-28 every
 * job ran at minute 0, and the hourly ones at the end of the list could miss their turn when
 * the call ran out of time.
 */
type Slot = { job: keyof typeof jobs; every: number; at?: number; heavy?: true };
export const SCHEDULE: Slot[] = [
  { job: 'deliverOutbox', every: 5_000 },
  { job: 'sendScheduledAnnouncements', every: 30_000 },
  { job: 'imageCdn', every: 60_000 },
  { job: 'reminders', every: 5 * 60_000 },
  { job: 'pingIndexNow', every: 5 * 60_000, at: 2 },
  { job: 'expireAppeals', every: 10 * 60_000 },
  { job: 'importBlogContent', every: 10 * 60_000, at: 2 },
  { job: 'translateDescriptions', every: 10 * 60_000, at: 1, heavy: true },
  { job: 'checkRemoteImages', every: 10 * 60_000, at: 3, heavy: true },
  { job: 'digestNews', every: 10 * 60_000, at: 6, heavy: true },
  // Every ten minutes: each chart has its own interval, so a run with nothing due is one query.
  { job: 'refreshCharts', every: 10 * 60_000, at: 8, heavy: true },
  { job: 'checkTicketLinks', every: 15 * 60_000 },
  { job: 'fetchNews', every: 15 * 60_000, at: 5, heavy: true },
  { job: 'refreshConfidence', every: 60 * 60_000, at: 10, heavy: true },
  { job: 'refreshFit', every: 60 * 60_000, at: 17, heavy: true },
  { job: 'awardBadges', every: 60 * 60_000, at: 27, heavy: true },
  { job: 'webHealth', every: 60 * 60_000, at: 40 },
  { job: 'purgeFeedbackAttachments', every: 4 * 60 * 60_000, at: 47 },
];

/** The jobs one call of POST /internal/jobs runs in a given minute since the epoch, in order. */
export function dueJobs(minute: number): (keyof typeof jobs)[] {
  return SCHEDULE.filter((s) => {
    const minutes = Math.max(1, Math.round(s.every / 60_000));
    return ((minute - (s.at ?? 0)) % minutes + minutes) % minutes === 0;
  }).map((s) => s.job);
}

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
  for (const { job: name, every } of SCHEDULE) {
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
 * every call, the others at their minute (`dueJobs`). Each still takes its lock, so an
 * overlapping call skips what is already running.
 */
export async function runDueJobs(ctx: Ctx, at = new Date()) {
  const out: Record<string, unknown> = {};
  for (const name of dueJobs(Math.floor(at.getTime() / 60_000))) {
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
