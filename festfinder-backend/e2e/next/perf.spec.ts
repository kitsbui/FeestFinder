import { expect, test, type Browser, type Page } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { signInWith } from '../checks.ts';
import { ACCOUNTS } from './routes.ts';

/*
 * Performance budgets (design v2 phase 7, the gate of artboard 23 "Trên 9"), on a phone with a
 * slow CPU (4×) and 4G (9 Mbps, 150 ms):
 *
 * - CLS, how much the layout jumps while a screen loads: 0.05 at most on every screen here.
 * - The JS a screen boots with: the chunks its HTML names, gzipped (what a phone downloads before
 *   the page works), at most its budget below. Next prefetches the pages a screen links to on top;
 *   that is not counted.
 *
 * Budgets only go down: when a change makes a screen lighter, lower its number in the same PR.
 * docs/DESIGN_GOVERNANCE.md has the gates.
 */

type Who = 'visitor' | 'fan' | 'organizer' | 'admin';
const CLS_MAX = 0.05;
/** KB of gzipped boot JS per screen (2026-10-18: React and Next are about 127 of them). */
const SCREENS: [Who, string, number][] = [
  ['visitor', '/', 198], ['visitor', '/e/ravo', 222], ['visitor', '/a', 204], ['visitor', '/a/slimv', 198],
  ['visitor', '/o/ravoent', 197], ['visitor', '/p', 183], ['visitor', '/?view=map', 198], ['visitor', '/about', 176],
  ['fan', '/profile', 199], ['fan', '/app/tickets', 231], ['fan', '/saved', 199],
  ['organizer', '/studio', 202], ['organizer', '/studio/new', 216], ['admin', '/console', 203],
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

/** The layout shift of a screen's load, with the elements that moved. */
async function cls(page: Page, path: string) {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: { v: number; what: string[] } };
    w.__cls = { v: 0, what: [] };
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
  return page.evaluate(() => (window as unknown as { __cls: { v: number; what: string[] } }).__cls);
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
    const shift = await cls(page, path);
    const js = await bootJs(page, path);
    table.push(`${path} (${who}): CLS ${shift.v.toFixed(3)}, JS ${js} KB / ${budget}`);
    if (shift.v > CLS_MAX) over.push(`${path}: CLS ${shift.v.toFixed(3)} > ${CLS_MAX} — ${[...new Set(shift.what)].slice(0, 4).join(', ')}`);
    if (js > budget) over.push(`${path}: ${js} KB of JS > its budget of ${budget} KB`);
    await ctx.close();
  }
  console.log(table.join('\n'));
  expect(over, over.join('\n')).toEqual([]);
});
