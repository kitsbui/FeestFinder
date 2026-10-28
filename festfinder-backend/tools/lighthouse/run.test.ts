/**
 * The runner's arithmetic on two saved reports from production (2026-10-22, Lighthouse 13.4.1,
 * trimmed to what the runner reads): the mobile home of one city, which scored 50 and ran into the
 * 45 s limit, and an event page on a computer, which scored 99.
 *
 *   npm run lighthouse:test   (from festfinder-backend; installs this folder first)
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { failures, imageKb, lcpOf, medianRun, noisy, pointsLost, redirectsOf, summarise, table, type Lhr } from './run.ts';

const load = (name: string) => JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures', `${name}.json`), 'utf8')) as Lhr;
const home = load('home-hcm-mobile');
const event = load('event-desktop');

test('points lost: weight × (1 − score) × 100, and they add up to what the score misses', () => {
  // FCP 0.99, LCP 0.23, TBT 0.51, CLS 0.37, SI 1 against the weights 10 / 25 / 30 / 25 / 10.
  assert.deepEqual(pointsLost(home), { FCP: 0.1, LCP: 19.3, TBT: 14.7, CLS: 15.8, SI: 0 });
  const lost = Object.values(pointsLost(home)).reduce((s, v) => s + v, 0);
  assert.ok(Math.abs(100 - lost - home.categories.performance.score! * 100) < 1);
  assert.deepEqual(pointsLost(event), { FCP: 0, LCP: 1, TBT: 0, CLS: 0, SI: 0 });
});

test('the LCP element, how it was asked for, and its request', () => {
  const lazy = lcpOf(home)!;
  assert.equal(lazy.selector, 'div.kd-ev-art > a > div.kd-art > img.kd-cover');
  assert.equal(lazy.image, true);
  assert.equal(lazy.lazy, true);
  assert.equal(lazy.hinted, false);
  assert.equal(lazy.discoverable, true);
  assert.match(lazy.request!.url, /^https:\/\/d3vhc53cl8e8km\.cloudfront\.net\//);
  assert.equal(lazy.request!.kb, 265);
  const eager = lcpOf(event)!;
  assert.equal(eager.lazy, false);
  assert.equal(eager.hinted, true);
  assert.equal(eager.request!.priority, 'High');
});

test('a text LCP names its element without the picture checks', async () => {
  const text = structuredClone(home);
  const items = text.audits['lcp-discovery-insight']!.details!.items as { type: string; snippet?: string }[];
  for (const i of items) if (i.type === 'node') i.snippet = '<span class="kd-h">Every event</span>';
  const l = lcpOf(text)!;
  assert.equal(l.image, false);
  assert.equal(l.request, undefined);
  const md = table([await summarise('home-en', 'mobile', [text])]);
  assert.doesNotMatch(md, /lazy|no fetchpriority|not in HTML/);
});

test('pictures and redirects', () => {
  assert.equal(imageKb(home), 2615);
  // The router's prefetches that the proxy moved to English (answered with 204 since).
  assert.equal(redirectsOf(home).length, 7);
  assert.ok(redirectsOf(home).every((r) => r.startsWith('307 https://feestfinder.com/') && r.includes('_rsc=')));
});

test("the median is Lighthouse's: the run closest to the median FCP and TTI", async () => {
  const at = (fcp: number, tti: number, score: number) => {
    const r = structuredClone(event);
    r.audits['first-contentful-paint'].numericValue = fcp;
    r.audits.interactive.numericValue = tti;
    r.categories.performance.score = score;
    return r;
  };
  const runs = [at(300, 900, 1), at(500, 1400, 0.9), at(420, 1100, 0.97), at(900, 3000, 0.7), at(410, 1000, 0.98)];
  assert.equal(await medianRun(runs), runs[2]);
  const row = await summarise('event', 'desktop', runs);
  assert.deepEqual([row.score, row.min, row.max, row.runs], [97, 70, 100, 5]);
});

test('a run with a warning fails the session, and so does a median under the floor', async () => {
  const bad = await summarise('home-hcm', 'mobile', [home]);
  const good = await summarise('event', 'desktop', [event]);
  assert.deepEqual(failures([good]), []);
  assert.deepEqual(failures([bad, good]), ['home-hcm mobile: The page loaded too slowly to finish within the time limit. Results may be incomplete.']);
  assert.deepEqual(failures([good], 100), ['event desktop: median 99 < 100']);
});

test('the summary table', async () => {
  const md = table([await summarise('home-hcm', 'mobile', [home]), await summarise('event', 'desktop', [event])]).split('\n');
  assert.equal(md.length, 4);
  assert.match(md[0], /^\| page \| form \| score \(min–max\) \| FCP \| LCP \| TBT \| CLS \| SI \| points lost \|/);
  assert.match(md[2], /^\| home-hcm \| mobile \| 50 \(50–50, n=1\) \| 1099 ms \| 5216 ms \| 582 ms \| 0\.313 \| 1470 ms \| FCP 0\.1, LCP 19\.3, TBT 14\.7, CLS 15\.8 \|/);
  assert.match(md[2], /img\.kd-cover \*\*lazy\*\* \*\*no fetchpriority\*\* · 265 KB/);
  assert.match(md[2], /\| 2615 \| 7 \| 2296 \| The page loaded too slowly/);
  assert.match(md[3], /^\| event \| desktop \| 99 \(99–99, n=1\) \|.*\| LCP 1 \|.*\| — \|$/);
});

test('a busy machine shows in the benchmarkIndex', () => {
  assert.deepEqual(noisy([{ name: 'a', benchmarkIndex: 2300 }, { name: 'b', benchmarkIndex: 2350 }, { name: 'c', benchmarkIndex: 1500 }]), ['c: benchmarkIndex 1500 vs 2300']);
});
