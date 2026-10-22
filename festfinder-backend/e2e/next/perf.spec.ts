import { expect, test, type Browser, type Page } from '@playwright/test';
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
 * - The JS a screen boots with: the chunks its HTML names, gzipped (what a phone downloads before
 *   the page works), at most its budget below. Next prefetches the five places' pages on top (every
 *   other link waits until someone reaches for it: festfinder-web/src/kd/link-client.tsx); that is
 *   not counted.
 *
 * Budgets only go down: when a change makes a screen lighter, lower its number in the same PR.
 * docs/DESIGN_GOVERNANCE.md has the gates.
 */

type Who = 'visitor' | 'fan' | 'organizer' | 'admin';
const CLS_MAX = 0.05;
const LCP_MAX = 2500;
const LCP_SIGNED_IN = 3500;
/** The newcomer's first two screens, held tighter. */
const LCP_TIGHT: Record<string, number> = { '/': 2000, '/e/ravo': 2000 };
/** KB of gzipped boot JS per screen (2026-10-19, after design v2 phase 14; React and Next are about 127 of them). A screen measured twice within 1 KB keeps the higher number: gzip rounds. */
const SCREENS: [Who, string, number][] = [
  // Phase 19 moved the sign-in sheet's own lines out of the boot JS: phase 17's kilobyte on /, the map and the wizard is back.
  // 2026-10-21: the nav's icons are drawn by CSS (one navigation for both devices): 3–5 KB less on every public screen (measured +1 for gzip rounding).
  // 2026-10-20 (later): the wizard measured 210 twice after the owner's requests (breadcrumbs left the client bundle).
  // 2026-10-20: the story images left the runtime for a chunk of their own (runtime/story.ts), which paid for the install strip and the worker (growth plan card F) and lowered the event page, an organiser, the artists and Studio.
  ['visitor', '/', 193], ['visitor', '/e/ravo', 192], ['visitor', '/a', 198], ['visitor', '/a/slimv', 194],
  ['visitor', '/o/ravoent', 192], ['visitor', '/p', 179], ['visitor', '/?view=map', 193], ['visitor', '/about', 171],
  // 2026-10-22: a city with no night here (the browser swaps every row for the empty panel after the first paint; the footer must not rise).
  ['visitor', '/?city=ha-noi', 193],
  ['fan', '/profile', 196], ['fan', '/saved', 196],
  ['organizer', '/studio', 196], ['organizer', '/studio/new', 210], ['admin', '/console', 200],
];

async function phone(browser: Browser, who: Who) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  if (who !== 'visitor') await signInWith(page, ACCOUNTS[who]);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  return { ctx, page };
}

/** The layout shift of a screen's load, with the elements that moved, and when its largest content painted. */
async function cls(page: Page, path: string) {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: { v: number; what: string[] }; __lcp: number };
    w.__cls = { v: 0, what: [] };
    w.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: { node: Node | null }[] })[]) {
        if (e.hadRecentInput) continue;
        w.__cls.v += e.value;
        for (const s of e.sources ?? []) {
          const n = s.node as Element | null;
          if (n?.tagName) w.__cls.what.push(`${n.tagName.toLowerCase()}.${String(n.className).split(/\s+/).slice(0, 3).join('.')} (${e.value.toFixed(3)})`);
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(path, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return page.evaluate(() => { const w = window as unknown as { __cls: { v: number; what: string[] }; __lcp: number }; return { ...w.__cls, lcp: Math.round(w.__lcp) }; });
}

/** KB of gzipped JS named by the screen's HTML (scripts for old browsers left out). */
async function bootJs(page: Page, path: string) {
  const html = await (await page.request.get(path)).text();
  const srcs = [...html.matchAll(/<script\b([^>]*)>/g)]
    .filter((m) => !/\bnomodule\b/i.test(m[1]))
    .map((m) => /\bsrc="([^"]+\.js[^"]*)"/.exec(m[1])?.[1])
    .filter((s): s is string => !!s);
  let bytes = 0;
  for (const src of new Set(srcs)) bytes += gzipSync(await (await page.request.get(src)).body()).length;
  return Math.round(bytes / 1024);
}

test('every screen loads without jumping and within its JS budget', async ({ browser }) => {
  test.setTimeout(600_000);
  const over: string[] = [];
  const table: string[] = [];
  for (const [who, path, budget] of SCREENS) {
    const { ctx, page } = await phone(browser, who);
    let shift = await cls(page, path);
    const lcpMax = LCP_TIGHT[path] ?? (who === 'visitor' ? LCP_MAX : LCP_SIGNED_IN);
    if (shift.lcp > lcpMax) {
      // Once more: a slow moment on the runner is not the screen's fault; two slow loads are.
      const again = await cls(page, path);
      if (again.lcp < shift.lcp) shift = again;
    }
    const js = await bootJs(page, path);
    table.push(`${path} (${who}): CLS ${shift.v.toFixed(3)}, LCP ${shift.lcp} ms / ${lcpMax}, JS ${js} KB / ${budget}`);
    if (shift.v > CLS_MAX) over.push(`${path}: CLS ${shift.v.toFixed(3)} > ${CLS_MAX} — ${[...new Set(shift.what)].slice(0, 4).join(', ')}`);
    if (shift.lcp > lcpMax) over.push(`${path}: LCP ${shift.lcp} ms > ${lcpMax} ms`);
    if (js > budget) over.push(`${path}: ${js} KB of JS > its budget of ${budget} KB`);
    await ctx.close();
  }
  console.log(table.join('\n'));
  expect(over, over.join('\n')).toEqual([]);
});
