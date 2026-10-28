import { expect, test, type Browser, type CDPSession, type Page } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { signInWith } from '../checks.ts';
import { ACCOUNTS } from './routes.ts';

/*
 * Performance budgets (design v2 phase 7, the gate of artboard 23 "Trên 9"), on a phone with a
 * slow CPU (4×) and 4G (9 Mbps, 150 ms):
 *
 * - CLS, how much the layout jumps while a screen loads: 0.05 at most on every screen here.
 * - LCP, when the screen's largest picture or text is on (design v2 phase 14): 2.5 s at most on a
 *   public page, 2.0 s on the home and event pages (the ones a newcomer opens first), and 3.5 s on a
 *   signed-in screen, which waits for its session before it draws. A screen over its limit is loaded
 *   once more and the better of the two counts: the throttled browser is noisy.
 * - The LCP element (2026-10-28, what Lighthouse marked down in production): a picture that is the
 *   screen's largest content is never lazy, asks for `fetchpriority="high"` and is in the HTML the
 *   server sent (festfinder-web's `Art` `eager`), so the browser fetches it before any script runs.
 * - No redirect while a screen loads (2026-10-28): every 3xx is a round trip a phone waits for, as the
 *   router's prefetches moved to another language were (festfinder-web/src/proxy.ts answers those
 *   with 204). The English screens carry the `ff_lang=en` cookie a reader of English has. /img's 302 to
 *   a picture's own link (its fallback when it cannot fetch one) is not counted.
 * - TBT-lite (2026-10-28): the main thread's blocking time, the sum of every long task's time over
 *   50 ms from the first paint to 5 s after it, under the same 4× CPU; the best of up to three loads,
 *   each on a fresh phone (a second load in the same one finds its scripts compiled).
 *   Lighthouse weighs TBT most (30 of 100).
 * - Image KB (2026-10-28): the bytes of every picture the screen loads (CDP sees a cross-origin
 *   picture's size, which the page's own timing reports as 0), so a picture drawn at full size
 *   where a copy its size would do (/img, festfinder-web/src/kd/img.ts) shows.
 * - The JS a screen boots with: the chunks its HTML names, gzipped (what a phone downloads before
 *   the page works), at most its budget below. Next prefetches the five places' pages on top (every
 *   other link waits until someone reaches for it: festfinder-web/src/kd/link-client.tsx); that is
 *   not counted.
 *
 * Budgets only go down: when a change makes a screen lighter, lower its number in the same PR.
 * docs/DESIGN_GOVERNANCE.md has the gates; `npm run lighthouse` (tools/lighthouse) measures the real
 * thing, Lighthouse 13.4.1 itself, locally or on production.
 */

type Who = 'visitor' | 'fan' | 'organizer' | 'artist' | 'admin';
const CLS_MAX = 0.05;
const LCP_MAX = 2500;
const LCP_SIGNED_IN = 3500;
/** The newcomer's first two screens, held tighter. */
const LCP_TIGHT: Record<string, number> = { '/': 2000, '/e/ravo': 2000 };
/** Screens whose network must go quiet within 15 s: nothing on them polls or streams. */
const QUIET = new Set(['/', '/e/ravo']);
/**
 * Each screen: who opens it, its address, then its budgets: KB of gzipped boot JS (2026-10-19,
 * after design v2 phase 14; React and Next are about 127 of them; a screen measured twice within
 * 1 KB keeps the higher number: gzip rounds), ms of TBT-lite and KB of pictures (both 2026-10-28:
 * the first measurement on a developer's laptop, doubled and rounded up to 50 ms with 100 at least
 * for TBT, since the CI runner's cores are slower; the pictures measured +1: the seed draws text
 * tiles, so they are the logo and the avatars). An optional zone and locale load the screen as a
 * phone set there.
 */
const SCREENS: [Who, string, number, number, number, Place?][] = [
  // Phase 19 moved the sign-in sheet's own lines out of the boot JS: phase 17's kilobyte on /, the map and the wizard is back.
  // 2026-10-21: the nav's icons are drawn by CSS (one navigation for both devices): 3–5 KB less on every public screen (measured +1 for gzip rounding).
  // 2026-10-20 (later): the wizard measured 210 twice after the owner's requests (breadcrumbs left the client bundle).
  // 2026-10-20: the story images left the runtime for a chunk of their own (runtime/story.ts), which paid for the install strip and the worker (growth plan card F) and lowered the event page, an organiser, the artists and Studio.
  // 2026-10-23: the map view, the worker's registration, the account menu's items and the install strip load when they are needed, and the public frame's tab bar left the back offices' shell (ui/tabbar.tsx): 2–10 KB less on every public screen (measured +1).
  ['visitor', '/', 183, 100, 6], ['visitor', '/e/ravo', 189, 200, 6], ['visitor', '/a', 196, 150, 6], ['visitor', '/a/slimv', 192, 150, 6],
  ['visitor', '/o/ravoent', 190, 200, 6], ['visitor', '/p', 177, 150, 6], ['visitor', '/?view=map', 183, 350, 6], ['visitor', '/about', 167, 150, 6],
  // 2026-10-28: the home page as a phone in Vietnam opens it: its country's nights lead (festfinder-web/src/kd/web/list/city-first.tsx, data-place-first).
  ['visitor', '/', 183, 150, 6, { timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN' }],
  // 2026-10-28: the home page in English, as Lighthouse and a first visit in production read it.
  ['visitor', '/?lang=en', 183, 150, 6],
  // 2026-10-28: a filtered address: the list waits for its answer and never paints the highlight (city-first.tsx, data-asked).
  ['visitor', '/?time=tonight', 183, 200, 6],
  // 2026-10-22: a city with no night here (since 2026-10-23 drawn on the server as the empty panel; the footer must not rise).
  ['visitor', '/?city=ha-noi', 183, 150, 6],
  // 2026-10-23: one city's list is drawn on the server (festfinder-web/src/kd/web/list/city.tsx): the address Lighthouse measured in production.
  ['visitor', '/?city=ho-chi-minh&lang=en', 183, 150, 6],
  // 2026-10-23 (later): the skip link is drawn by each frame without a store of its own (ui/skip-link.tsx): /saved a kilobyte lighter (measured +1).
  ['fan', '/profile', 196, 150, 6], ['fan', '/saved', 192, 150, 6],
  // 2026-10-28: the wizard reads its price line from web/price.ts, without the event card (and its save toggle and links): 4 KB less (measured +1).
  ['organizer', '/studio', 196, 100, 8], ['organizer', '/studio/new', 207, 100, 4],
  // 2026-10-28: the artist studio, which production showed shifting on its profile form (fixed with /me/artist's form options).
  ['artist', '/studio/artist', 207, 100, 8],
  ['admin', '/console', 200, 100, 8],
];

/** A phone's own zone and language. */
type Place = { timezoneId: string; locale: string };

/** What one load of a screen measured. */
type Load = {
  cls: number;
  moved: string[];
  lcp: number;
  /** The largest content's element: its tag and, for a picture, how it was asked for. */
  el: { tag: string; loading: string | null; priority: string | null; src: string | null } | null;
  tbt: number;
  imgKb: number;
  redirects: string[];
};

async function phone(browser: Browser, baseURL: string, who: Who, path: string, place?: Place) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, ...place });
  // The screens' build reads Vietnamese on a first visit (NEXT_PUBLIC_DEFAULT_LANG): an English screen is a reader who chose English.
  if (/[?&]lang=en\b/.test(path)) await ctx.addCookies([{ name: 'ff_lang', value: 'en', url: baseURL }]);
  const page = await ctx.newPage();
  if (who !== 'visitor') await signInWith(page, ACCOUNTS[who]);
  await page.addInitScript(() => {
    type El = { tag: string; loading: string | null; priority: string | null; src: string | null };
    const w = window as unknown as { __perf: { cls: number; moved: string[]; lcp: number; el: El | null; long: [number, number][] } };
    w.__perf = { cls: 0, moved: [], lcp: 0, el: null, long: [] };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { element: Element | null })[]) {
        w.__perf.lcp = e.startTime;
        const n = e.element;
        w.__perf.el = n ? { tag: n.tagName, loading: n.getAttribute('loading'), priority: n.getAttribute('fetchpriority'), src: n.getAttribute('src') } : null;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) w.__perf.long.push([e.startTime, e.duration]);
    }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: { node: Node | null }[] })[]) {
        if (e.hadRecentInput) continue;
        w.__perf.cls += e.value;
        for (const s of e.sources ?? []) {
          const n = s.node as Element | null;
          if (n?.tagName) w.__perf.moved.push(`${n.tagName.toLowerCase()}.${String(n.className).split(/\s+/).slice(0, 3).join('.')} (${e.value.toFixed(3)})`);
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  return { ctx, page, cdp };
}

/** One load of a screen: how far its layout moved, its largest content, the main thread's blocking, its pictures and redirects. */
async function load(page: Page, cdp: CDPSession, path: string): Promise<Load> {
  const images = new Set<string>();
  let imgBytes = 0;
  const redirects: string[] = [];
  const onResponse = (e: { requestId: string; type: string }) => { if (e.type === 'Image') images.add(e.requestId); };
  const onFinished = (e: { requestId: string; encodedDataLength: number }) => { if (images.has(e.requestId)) imgBytes += e.encodedDataLength; };
  // CDP reports a redirect as the next request's redirectResponse (Playwright's own events would too, minus the service worker's).
  // /img's 302 to a picture's own link is its fallback for a link it cannot fetch (what earlier specs store on hosts that
  // do not answer here): the browser would have asked that link anyway, so it is not a redirect a screen makes.
  const onRequest = (e: { redirectResponse?: { status: number; url: string } }) => {
    const from = e.redirectResponse ? new URL(e.redirectResponse.url) : null;
    if (!from || (e.redirectResponse!.status === 302 && from.pathname.startsWith('/img/'))) return;
    redirects.push(`${e.redirectResponse!.status} ${from.pathname}${from.search}`);
  };
  cdp.on('Network.responseReceived', onResponse);
  cdp.on('Network.loadingFinished', onFinished);
  cdp.on('Network.requestWillBeSent', onRequest);
  try {
    await page.goto(path, { waitUntil: 'load' });
    const idle = page.waitForLoadState('networkidle', { timeout: 15_000 });
    // A screen that never goes quiet is a finding on the newcomer's two screens; elsewhere a back office may keep asking.
    if (QUIET.has(path)) await idle.catch(() => { throw new Error(`${path}: the network never went quiet within 15 s of the load`); });
    else await idle.catch(() => {});
    await page.waitForTimeout(1500);
    // TBT-lite reads until 5 s after the first paint.
    await page.waitForFunction(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
      return fcp !== undefined && performance.now() >= fcp + 5000;
    }, undefined, { timeout: 20_000, polling: 250 });
    const m = await page.evaluate(() => {
      const w = window as unknown as { __perf: { cls: number; moved: string[]; lcp: number; el: Load['el']; long: [number, number][] } };
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
      let tbt = 0;
      for (const [start, duration] of w.__perf.long) {
        // The part of a task past its first 50 ms that falls between the first paint and 5 s after (as Lighthouse clips it).
        const from = Math.max(start + 50, fcp);
        const end = Math.min(start + duration, fcp + 5000);
        if (end > from) tbt += end - from;
      }
      return { cls: w.__perf.cls, moved: w.__perf.moved, lcp: Math.round(w.__perf.lcp), el: w.__perf.el, tbt: Math.round(tbt) };
    });
    return { ...m, imgKb: Math.round(imgBytes / 1024), redirects };
  } finally {
    cdp.off('Network.responseReceived', onResponse);
    cdp.off('Network.loadingFinished', onFinished);
    cdp.off('Network.requestWillBeSent', onRequest);
  }
}

/** The screen's HTML as the server sends it, and the KB of gzipped JS it names (scripts for old browsers left out). */
async function served(page: Page, path: string) {
  const html = await (await page.request.get(path)).text();
  const srcs = [...html.matchAll(/<script\b([^>]*)>/g)]
    .filter((m) => !/\bnomodule\b/i.test(m[1]))
    .map((m) => /\bsrc="([^"]+\.js[^"]*)"/.exec(m[1])?.[1])
    .filter((s): s is string => !!s);
  let bytes = 0;
  for (const src of new Set(srcs)) bytes += gzipSync(await (await page.request.get(src)).body()).length;
  return { html, js: Math.round(bytes / 1024) };
}

/** The load whose largest content painted first; the first load's blocking and pictures (the second meets a warm cache), the redirects of both. */
const better = (a: Load, b: Load): Load => ({
  ...(b.lcp < a.lcp ? b : a), tbt: a.tbt, imgKb: a.imgKb, redirects: [...new Set([...a.redirects, ...b.redirects])],
});
const describe = (el: Load['el']) => !el ? 'none' : el.tag !== 'IMG' ? el.tag.toLowerCase()
  : `img ${el.loading ?? 'eager'} ${el.priority ?? 'auto'} ${(el.src ?? '').slice(0, 48)}`;

test('every screen loads without jumping and within its budgets', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const over: string[] = [];
  const table: string[] = [];
  // One load nobody measures first: the browser's own start (its GPU process, its caches) is not the first screen's.
  const warm = await phone(browser, baseURL!, 'visitor', '/');
  await load(warm.page, warm.cdp, '/');
  await warm.ctx.close();
  for (const [who, path, budget, tbtMax, imgMax, place] of SCREENS) {
    const name = place ? `${path} (${place.locale}, ${place.timezoneId})` : path;
    const { ctx, page, cdp } = await phone(browser, baseURL!, who, path, place);
    // Warm: the server's first render of a route after it starts is not what a visitor meets (ISR and the CDN keep it in production).
    await page.request.get(path);
    let m = await load(page, cdp, path);
    const lcpMax = LCP_TIGHT[path] ?? (who === 'visitor' ? LCP_MAX : LCP_SIGNED_IN);
    // Once more: a slow moment on the runner is not the screen's fault; two slow loads are.
    if (m.lcp > lcpMax) m = better(m, await load(page, cdp, path));
    // On a fresh phone, up to twice more: a load in the same one meets its scripts compiled and blocks for nothing,
    // and a busy runner stalls one load now and then (a screen over its budget three times is the screen's fault).
    for (let more = 0; more < 2 && m.tbt > tbtMax; more++) {
      const cold = await phone(browser, baseURL!, who, path, place);
      m = { ...m, tbt: Math.min(m.tbt, (await load(cold.page, cold.cdp, path)).tbt) };
      await cold.ctx.close();
    }
    const { html, js } = await served(page, path);
    table.push(`${name} (${who}): CLS ${m.cls.toFixed(3)}, LCP ${m.lcp} ms / ${lcpMax} (${describe(m.el)}), TBT ${m.tbt} ms / ${tbtMax}, `
      + `img ${m.imgKb} KB / ${imgMax}, JS ${js} KB / ${budget}, redirects ${m.redirects.length}`);
    if (m.cls > CLS_MAX) over.push(`${name}: CLS ${m.cls.toFixed(3)} > ${CLS_MAX} — ${[...new Set(m.moved)].slice(0, 4).join(', ')}`);
    if (m.lcp > lcpMax) over.push(`${name}: LCP ${m.lcp} ms > ${lcpMax} ms (${describe(m.el)})`);
    if (m.el?.tag === 'IMG') {
      const src = m.el.src ?? '';
      if (m.el.loading === 'lazy') over.push(`${name}: the LCP picture is lazy (${src})`);
      if (m.el.priority !== 'high') over.push(`${name}: the LCP picture does not ask for fetchpriority="high" (${src})`);
      if (!src || !html.includes(`src="${src.replaceAll('&', '&amp;')}"`)) over.push(`${name}: the LCP picture is not in the server's HTML (${src})`);
    }
    if (m.redirects.length) over.push(`${name}: ${m.redirects.length} redirects while loading — ${m.redirects.slice(0, 4).join(', ')}`);
    if (m.tbt > tbtMax) over.push(`${name}: TBT-lite ${m.tbt} ms > ${tbtMax} ms`);
    if (m.imgKb > imgMax) over.push(`${name}: ${m.imgKb} KB of pictures > its budget of ${imgMax} KB`);
    if (js > budget) over.push(`${name}: ${js} KB of JS > its budget of ${budget} KB`);
    await ctx.close();
  }
  console.log(table.join('\n'));
  expect(over, over.join('\n')).toEqual([]);
});
