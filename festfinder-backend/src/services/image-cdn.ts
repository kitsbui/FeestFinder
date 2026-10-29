import { dangerouslyDeleteByTag } from '@vercel/functions';
import type { Ctx } from '../context.ts';
import type { Config } from '../config.ts';
import { many } from '../db/index.ts';
import { imgHeight, imgKey, isHttpsLink, type ImgShape } from '../lib/remote-image.ts';
import { inBackground } from '../lib/background.ts';
import { imgTag, knownImage, uploadKeyOf } from './remote-images.ts';

/*
 * The CDN's side of GET /img (routes/images.ts). A resized copy is kept a year by Vercel's CDN, in
 * the API's project and in the web app's (whose rewrite caching keeps what /img answers), so:
 *
 * Takedown: when a row stops showing a picture (replaced, cleared, hidden, removed, deleted),
 * migration 067's triggers queue its link in img_purges; once no other row shows it, its copies
 * are deleted by their cache tag (imgTag, sent as Vercel-Cache-Tag): this deployment's own CDN
 * through the function's runtime (no token), the web app's through Vercel's REST API with
 * VERCEL_PURGE_TOKEN. GET /img itself already refuses the link (knownImage), so a deleted copy is
 * never made again. Browsers that already hold a copy keep it: nothing reaches them.
 *
 * Warming: when an event goes public or changes its cover, img_warms queues the cover, and its
 * common copies are asked for through the public origin, a few at a time, after the write, so its
 * first visitor is not the one who waits for the resize.
 *
 * Both run from the imageCdn job every minute, and right after a signed-in write (app.ts).
 */

export interface ImageCdn {
  /** Deletes the CDN's copies that carry these tags (at most PURGE_BATCH per call). */
  purge: ((tags: string[]) => Promise<void>) | null;
  /** Asks the public origin for one /img path, so the CDN keeps the copy. */
  warm: ((path: string) => Promise<void>) | null;
}

/** Vercel takes at most 16 tags in one REST call. */
export const PURGE_BATCH = 16;
/** Links read from the queue per run. */
const PURGES_PER_RUN = 64;
const WARMS_PER_RUN = 4;
/** Copies asked for at once: GET /img decodes two pictures at a time per instance (remote-images.ts AT_ONCE). */
const WARM_AT_ONCE = 3;

/**
 * The copies a cover is drawn at first, from the web's boxes: the event page's eager 16:9 hero
 * (kd/fits.ts FIT.hero: 640 its src, 828 a phone at 2×, 1280 at 3×), a card in a grid or the
 * list's days (web/card-fit.ts CARD and DAY: 16:10 at 384, 640 and 828) and a phone's 88px row
 * (192, square). A framing's zoom asks for wider copies; those are made on their first visit.
 */
export const WARM_BOXES: [number, ImgShape][] = [[640, 'wide'], [828, 'wide'], [1280, 'wide'], [384, 'card'], [640, 'card'], [828, 'card'], [192, 'square']];

/** The /img paths warmed for a stored link. */
export const warmPaths = (link: string): string[] => WARM_BOXES.map(([w, s]) => `/img/${w}x${imgHeight(w, s)}/${imgKey(link)}.webp`);

/** What production has: the runtime's purge of this project, Vercel's REST API for the others, and the public origin. */
export function imageCdnFrom(config: Config, log: (msg: string) => void): ImageCdn {
  const onVercel = !!process.env.VERCEL;
  const rest = config.imgPurge;
  const purge = onVercel || rest
    ? async (tags: string[]) => {
      // This deployment's own CDN: a no-op outside a Vercel function.
      if (onVercel) await dangerouslyDeleteByTag(tags);
      for (const project of rest?.projects ?? []) {
        const q = new URLSearchParams({ projectIdOrName: project, ...(rest!.teamId ? { teamId: rest!.teamId } : {}) });
        const res = await fetch(`https://api.vercel.com/v1/edge-cache/dangerously-delete-by-tags?${q}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${rest!.token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ tags }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw new Error(`Vercel refused the purge of ${project}: ${res.status} ${(await res.text()).slice(0, 200)}`);
      }
    }
    : null;
  const origin = config.imgWarmOrigin;
  const warm = origin
    ? async (path: string) => {
      const res = await fetch(origin + path, { headers: { accept: 'image/webp' }, signal: AbortSignal.timeout(20_000) });
      // Read to the end, so the CDN stores the whole copy.
      await res.arrayBuffer();
      if (res.status >= 400) throw new Error(`${res.status}`);
    }
    : null;
  if (config.env === 'production' && !rest) log('note: VERCEL_PURGE_TOKEN is not set, so a taken-down picture stays in the web app\'s CDN until its copy expires');
  return { purge, warm };
}

/** Whether GET /img serves this link at all (an https link or one of the uploads). */
const servable = (ctx: Ctx, link: string) => isHttpsLink(link) || !!uploadKeyOf(ctx, link);

/**
 * One pass of the takedown queue: the links no row shows any more lose their copies on the CDN.
 * A purge that fails puts its links back for the next run.
 */
export async function purgeTakedowns(ctx: Ctx): Promise<{ purged: number; kept: number }> {
  const rows = await many<{ link: string }>(ctx.db,
    `delete from img_purges where link in (select link from img_purges order by at limit $1 for update skip locked) returning link`, [PURGES_PER_RUN]);
  const purge = ctx.imageCdn?.purge;
  if (!purge || !rows.length) return { purged: 0, kept: 0 };
  const byTag = new Map<string, string[]>();
  let kept = 0;
  for (const { link } of rows) {
    if (!servable(ctx, link)) continue;
    // Another row still shows the same picture: its copies stay.
    if (await knownImage(ctx, link)) { kept++; continue; }
    const tag = imgTag(ctx, link);
    byTag.set(tag, [...(byTag.get(tag) ?? []), link]);
  }
  const tags = [...byTag.keys()];
  let purged = 0;
  for (let i = 0; i < tags.length; i += PURGE_BATCH) {
    const batch = tags.slice(i, i + PURGE_BATCH);
    try {
      await purge(batch);
      purged += batch.length;
    } catch (e) {
      ctx.log(`img: the CDN purge failed, tried again next minute (${(e as Error).message})`);
      await ctx.db.query(`insert into img_purges (link) select unnest($1::text[]) on conflict (link) do nothing`, [batch.flatMap((t) => byTag.get(t) ?? [])]);
    }
  }
  return { purged, kept };
}

/** One pass of the warming queue: each new cover's common copies, asked for a few at a time. Never throws. */
export async function warmCovers(ctx: Ctx): Promise<number> {
  const rows = await many<{ link: string }>(ctx.db,
    `delete from img_warms where link in (select link from img_warms order by at limit $1 for update skip locked) returning link`, [WARMS_PER_RUN]);
  const warm = ctx.imageCdn?.warm;
  if (!warm) return 0;
  const paths = rows.filter((r) => servable(ctx, r.link)).flatMap((r) => warmPaths(r.link));
  let next = 0;
  let warmed = 0;
  const worker = async () => {
    while (next < paths.length) {
      const path = paths[next++];
      try {
        await warm(path);
        warmed++;
      } catch (e) {
        ctx.log(`img: warming ${path.slice(0, 40)}… failed (${(e as Error).message})`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(WARM_AT_ONCE, paths.length) }, worker));
  return warmed;
}

/** The imageCdn job: the purges, then the warming in the background (it reads the network). */
export async function runImageCdn(ctx: Ctx): Promise<number> {
  const { purged } = await purgeTakedowns(ctx);
  if (ctx.imageCdn?.warm) inBackground(warmCovers(ctx), (e) => ctx.log(`img: warming failed (${(e as Error).message})`));
  else await warmCovers(ctx);
  return purged;
}

let kicked = false;
/**
 * After a signed-in write (an event approved, a cover changed, a comment hidden): the queues are
 * read at once rather than at the next minute, in the background, one pass at a time per instance.
 * Never in the tests, which call the passes themselves.
 */
export function kickImageCdn(ctx: Ctx): void {
  if (kicked || ctx.config.env === 'test' || !(ctx.imageCdn?.purge || ctx.imageCdn?.warm)) return;
  kicked = true;
  inBackground(runImageCdn(ctx).finally(() => { kicked = false; }), (e) => ctx.log(`img: the CDN pass failed (${(e as Error).message})`));
}
