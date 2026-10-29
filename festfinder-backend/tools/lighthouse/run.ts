/**
 * Lighthouse 13.4.1 (the owner's version, pinned in this folder's package.json so its ~175 MB stay
 * out of every other install) on FeestFinder's pages, as medians a change can be judged by.
 *
 *   npm run lighthouse -- --base https://feestfinder.com            # production
 *   npm run lighthouse -- --serve                                    # this checkout, on :4500 / :3200
 *   npm run lighthouse -- --base … --pages home-en,event --form mobile --runs 3
 *
 * Each run gets a fresh Chrome profile (a first visit; repeated runs in one profile drift into
 * second visits), each page is warmed with two plain GETs first (ISR, the CDN), and the median run
 * is Lighthouse's own (computeMedianRun: the run closest to the median FCP and TTI). Per page it
 * prints the points each metric loses (weight × (1 − score) × 100), the LCP element and its request,
 * the KB of pictures, the redirects and the machine's benchmarkIndex, and writes every report, the
 * median's HTML, summary.json and summary.md under .lighthouse/<stamp>/.
 *
 * It exits 1 when a run has a runWarning (such as "The page loaded too slowly to finish": its trace
 * and devtools log are saved beside the report) or a median scores under --min-score.
 *
 * --serve builds this checkout's web app into festfinder-web/.next-lh (NEXT_DIST_DIR) and runs it on
 * :3200 against an API on :4500 with its own PGlite directory and the demo data (and the blog's
 * packs), so it never meets the screen checks (3100/4100, .next) or the preview (3000/4300). It
 * reads English on a first visit, as production does, and fetches the real picture hosts.
 *
 * Options: --chrome <path> (else CHROME_PATH, else Playwright's Chromium), --tz <zone> (Asia/Ho_Chi_Minh),
 * --country <code> (sends x-vercel-ip-country, the country Vercel's edge names, so the home page is the one
 * a person from there gets: festfinder-web/src/kd/home-place.ts; only on this machine, Vercel sets its own),
 * --out <dir>, --min-score <n>, --event <slug>, --post <slug>. The signed-in page (studio-artist)
 * signs in as the demo artist with --serve; on another base it needs LH_COOKIE, a session cookie
 * from the environment (never written to the repo).
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { availableParallelism, loadavg } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const HERE = import.meta.dirname;
const BACKEND = join(HERE, '..', '..');
const WEB = join(BACKEND, '..', 'festfinder-web');
const VERSION = '13.4.1';
const METRICS = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'] as const;
const SHORT: Record<string, string> = {
  'first-contentful-paint': 'FCP', 'largest-contentful-paint': 'LCP', 'total-blocking-time': 'TBT', 'cumulative-layout-shift': 'CLS', 'speed-index': 'SI',
};

/** The part of a Lighthouse result (LH.Result) this runner reads. */
export type Lhr = {
  requestedUrl?: string;
  finalDisplayedUrl?: string;
  runWarnings: string[];
  environment: { benchmarkIndex: number };
  configSettings: { formFactor: string };
  categories: { performance: { score: number | null; auditRefs: { id: string; weight: number }[] } };
  audits: Record<string, { score: number | null; numericValue?: number; details?: { items?: unknown[] } }>;
};
type Request = { url: string; statusCode: number; resourceType?: string; transferSize?: number; priority?: string };
type Node = { type: 'node'; selector?: string; snippet?: string };
type Checklist = { type: 'checklist'; items: Record<string, { value: boolean }> };

export type Lcp = { selector: string; image: boolean; lazy: boolean; hinted: boolean; discoverable: boolean; request?: { url: string; kb: number; priority?: string } };
export type Row = {
  page: string;
  form: string;
  url: string;
  runs: number;
  score: number;
  min: number;
  max: number;
  metrics: Record<string, number>;
  lost: Record<string, number>;
  lcp: Lcp | null;
  imageKb: number;
  requests: number;
  redirects: string[];
  benchmarkIndex: number;
  warnings: string[];
};

const requests = (lhr: Lhr) => (lhr.audits['network-requests']?.details?.items ?? []) as Request[];
const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

/** Points each weighted metric costs the score: weight × (1 − its score) × 100, over the category's total weight. */
export function pointsLost(lhr: Lhr): Record<string, number> {
  const refs = lhr.categories.performance.auditRefs.filter((r) => r.weight > 0);
  const total = refs.reduce((s, r) => s + r.weight, 0);
  const lost: Record<string, number> = {};
  for (const r of refs) lost[SHORT[r.id] ?? r.id] = round((r.weight * (1 - (lhr.audits[r.id]?.score ?? 0)) * 100) / total, 1);
  return lost;
}

/** The LCP element, how it was asked for, and the request that brought it (matched on its src, which Lighthouse's snippet cuts short). */
export function lcpOf(lhr: Lhr): Lcp | null {
  const items = (lhr.audits['lcp-discovery-insight']?.details?.items ?? lhr.audits['lcp-breakdown-insight']?.details?.items ?? []) as (Node | Checklist | { type: string })[];
  const node = items.find((i): i is Node => i.type === 'node');
  if (!node) return null;
  const check = items.find((i): i is Checklist => i.type === 'checklist')?.items ?? {};
  const src = /\bsrc="([^"]*)"/.exec(node.snippet ?? '')?.[1]?.replace(/…$/, '');
  const req = src ? requests(lhr).find((r) => r.url.startsWith(new URL(src, lhr.finalDisplayedUrl ?? lhr.requestedUrl).href)) : undefined;
  return {
    selector: node.selector ?? '',
    image: /^<img\b/i.test(node.snippet ?? ''),
    lazy: /\bloading="lazy"/.test(node.snippet ?? ''),
    hinted: check.priorityHinted?.value ?? false,
    discoverable: check.requestDiscoverable?.value ?? false,
    ...(req ? { request: { url: req.url, kb: round((req.transferSize ?? 0) / 1024), priority: req.priority } } : {}),
  };
}

/** KB of pictures the page loaded (what crossed the network). */
export const imageKb = (lhr: Lhr) => round(requests(lhr).filter((r) => r.resourceType === 'Image').reduce((s, r) => s + (r.transferSize ?? 0), 0) / 1024);
/** Every 3xx the page met, its status and address. */
export const redirectsOf = (lhr: Lhr) => requests(lhr).filter((r) => r.statusCode >= 300 && r.statusCode < 400).map((r) => `${r.statusCode} ${r.url}`);

/** Lighthouse's median run: the one closest to the median FCP and TTI. */
export async function medianRun(runs: Lhr[]): Promise<Lhr> {
  const { computeMedianRun } = await import('lighthouse/core/lib/median-run.js');
  return computeMedianRun(runs as unknown as Parameters<typeof computeMedianRun>[0]) as unknown as Lhr;
}

/** One page and form factor, from its runs. */
export async function summarise(page: string, form: string, runs: Lhr[]): Promise<Row> {
  const median = await medianRun(runs);
  const scores = runs.map((r) => Math.round((r.categories.performance.score ?? 0) * 100));
  const metrics: Record<string, number> = {};
  for (const id of METRICS) metrics[SHORT[id]] = round(median.audits[id]?.numericValue ?? NaN, id === 'cumulative-layout-shift' ? 3 : 0);
  return {
    page,
    form,
    url: median.requestedUrl ?? '',
    runs: runs.length,
    score: Math.round((median.categories.performance.score ?? 0) * 100),
    min: Math.min(...scores),
    max: Math.max(...scores),
    metrics,
    lost: pointsLost(median),
    lcp: lcpOf(median),
    imageKb: imageKb(median),
    requests: requests(median).length,
    redirects: redirectsOf(median),
    benchmarkIndex: round(median.environment.benchmarkIndex),
    warnings: [...new Set(runs.flatMap((r) => r.runWarnings))],
  };
}

const cell = (s: string) => s.replaceAll('|', '\\|').replaceAll('\n', ' ');
/** The LCP element; a picture also says how it was asked for (text has no request to hint). */
const lcpCell = (l: Lcp | null) => !l ? '—'
  : `${l.selector}${!l.image ? '' : `${l.lazy ? ' **lazy**' : ''}${l.hinted ? ' high' : ' **no fetchpriority**'}${l.discoverable ? '' : ' **not in HTML**'}`}`
    + (l.request ? ` · ${l.request.kb} KB ${l.request.priority ?? ''} ${l.request.url.slice(0, 80)}` : '');

/** The rows as a Markdown table. */
export function table(rows: Row[]): string {
  const head = ['page', 'form', 'score (min–max)', 'FCP', 'LCP', 'TBT', 'CLS', 'SI', 'points lost', 'LCP element · its request', 'img KB', 'redirects', 'bench', 'warnings'];
  const lines = [`| ${head.join(' | ')} |`, `|${head.map(() => ' --- ').join('|')}|`];
  for (const r of rows) {
    const lost = Object.entries(r.lost).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${v}`).join(', ') || '0';
    lines.push(`| ${[
      r.page, r.form, `${r.score} (${r.min}–${r.max}, n=${r.runs})`,
      `${r.metrics.FCP} ms`, `${r.metrics.LCP} ms`, `${r.metrics.TBT} ms`, String(r.metrics.CLS), `${r.metrics.SI} ms`,
      lost, lcpCell(r.lcp), String(r.imageKb), String(r.redirects.length), String(r.benchmarkIndex), r.warnings.join(' / ') || '—',
    ].map(cell).join(' | ')} |`);
  }
  return lines.join('\n');
}

/** Why the session fails: a run with a warning, or a median under the floor. */
export function failures(rows: Row[], minScore?: number): string[] {
  const out: string[] = [];
  for (const r of rows) {
    for (const w of r.warnings) out.push(`${r.page} ${r.form}: ${w}`);
    if (minScore !== undefined && r.score < minScore) out.push(`${r.page} ${r.form}: median ${r.score} < ${minScore}`);
  }
  return out;
}

/** Runs whose benchmarkIndex is more than 15 % off the session's median: the machine was busy. */
export function noisy(runs: { name: string; benchmarkIndex: number }[]): string[] {
  const sorted = runs.map((r) => r.benchmarkIndex).sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  return runs.filter((r) => Math.abs(r.benchmarkIndex - mid) > mid * 0.15).map((r) => `${r.name}: benchmarkIndex ${round(r.benchmarkIndex)} vs ${round(mid)}`);
}

// ---------------------------------------------------------------------------------------------
// The command line.

/** Pages by name; {event} and {post} are filled per base. A path given as is is measured as is. */
const PAGES: Record<string, { path: string; signedIn?: boolean }> = {
  'home-en': { path: '/?lang=en' },
  'home-new': { path: '/' },
  'home-hcm': { path: '/?city=ho-chi-minh&lang=en' },
  event: { path: '/e/{event}?lang=en' },
  post: { path: '/blog/{post}?lang=en' },
  blog: { path: '/blog?lang=en' },
  artists: { path: '/a?lang=en' },
  about: { path: '/about?lang=en' },
  'studio-artist': { path: '/studio/artist', signedIn: true },
};
const DEFAULT_PAGES = 'home-en,home-hcm,event,post,artists';
const SERVE = { api: 4500, web: 3200 };

async function answers(url: string) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

async function waitFor(url: string, ms: number, what: string, child?: ChildProcess) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (child && child.exitCode !== null) throw new Error(`${what} exited with ${child.exitCode}`);
    if (await answers(url)) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${what} did not answer ${url} within ${ms / 1000} s`);
}

function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, log: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    child.stdout.on('data', (b: Buffer) => out.push(b));
    child.stderr.on('data', (b: Buffer) => out.push(b));
    child.on('error', reject);
    child.on('exit', (code) => {
      writeFileSync(log, Buffer.concat(out));
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} failed (${code}); see ${log}`));
    });
  });
}

/** This checkout on :4500 (API, demo data) and :3200 (web, built into .next-lh). Returns how to stop both. */
async function serve(out: string) {
  for (const port of [SERVE.api, SERVE.web]) {
    if (await answers(`http://localhost:${port}/`)) throw new Error(`port ${port} is already taken: --serve needs ${SERVE.api} and ${SERVE.web}`);
  }
  const web = `http://localhost:${SERVE.web}`;
  const api = `http://localhost:${SERVE.api}`;
  const { NEXT_PUBLIC_DEFAULT_LANG: _vi, DATABASE_URL: _db, ...base } = process.env;
  const apiEnv = {
    ...base, PORT: String(SERVE.api), PUBLIC_BASE_URL: web, DATABASE_URL: '', DATABASE_URL_FROM: '',
    PGLITE_DIR: './.data/pglite-lh', UPLOAD_DIR: './.data/uploads-lh', JOBS_ENABLED: 'false', LINK_CHECKS_ENABLED: 'false',
    SEED_BLOG: '1', RATE_LIMIT_PER_MINUTE: '10000',
    // The demo data's clock, as the screen checks pin it (playwright.next.config.ts): its nights are
    // still to come, so the home page has cards; linked pictures read from the fake network.
    FF_NOW: '2026-09-14T10:00:00+07:00', FAKE_REMOTE_MEDIA: '1',
  };
  console.log('serve: the demo data into .data/pglite-lh');
  await run(process.execPath, ['test/fixtures/reset.ts'], BACKEND, apiEnv, join(out, 'seed.log'));
  const children: ChildProcess[] = [];
  const stop = () => { for (const c of children) if (c.exitCode === null && c.pid) try { process.kill(-c.pid, 'SIGTERM'); } catch { /* gone */ } };
  process.once('exit', stop);
  for (const sig of ['SIGINT', 'SIGTERM'] as const) process.once(sig, () => { stop(); process.exit(130); });
  const apiProc = spawn(process.execPath, ['src/server.ts'], { cwd: BACKEND, env: apiEnv, detached: true, stdio: 'ignore' });
  children.push(apiProc);
  await waitFor(`${api}/health`, 120_000, 'the API', apiProc);

  const webEnv = { ...base, FF_API_ORIGIN: api, SITE_URL: web, NEXT_DIST_DIR: '.next-lh', NEXT_TELEMETRY_DISABLED: '1' };
  // next build writes its distDir's type globs into tsconfig.json and next-env.d.ts: they go back as they were.
  const kept = ['tsconfig.json', 'next-env.d.ts'].map((f) => [join(WEB, f), existsSync(join(WEB, f)) ? readFileSync(join(WEB, f), 'utf8') : null] as const);
  rmSync(join(WEB, '.next-lh', 'cache', 'fetch-cache'), { recursive: true, force: true });
  console.log('serve: building the web app into festfinder-web/.next-lh (a minute or two)');
  try {
    await run('npm', ['run', 'build'], WEB, webEnv, join(out, 'build.log'));
  } finally {
    for (const [file, text] of kept) if (text !== null && readFileSync(file, 'utf8') !== text) writeFileSync(file, text);
  }
  const webProc = spawn(join(WEB, 'node_modules', '.bin', 'next'), ['start', '--port', String(SERVE.web)], { cwd: WEB, env: webEnv, detached: true, stdio: 'ignore' });
  children.push(webProc);
  await waitFor(`${web}/robots.txt`, 60_000, 'the web app', webProc);
  return { base: web, stop };
}

/** A session cookie for the signed-in pages: the demo artist on this machine, else LH_COOKIE. */
async function sessionFor(base: string, local: boolean) {
  if (!local) return process.env.LH_COOKIE || null;
  const { ACCOUNTS } = await import('../../e2e/next/routes.ts');
  const res = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ACCOUNTS.artist) });
  if (!res.ok) throw new Error(`sign in as the demo artist: ${res.status}`);
  return res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
}

function chromePath(given?: string) {
  if (given) return given;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const require = createRequire(join(BACKEND, 'package.json'));
  return (require('playwright-core') as { chromium: { executablePath(): string } }).chromium.executablePath();
}

function installed() {
  try {
    return (JSON.parse(readFileSync(join(HERE, 'node_modules', 'lighthouse', 'package.json'), 'utf8')) as { version: string }).version === VERSION;
  } catch {
    return false;
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      base: { type: 'string' }, serve: { type: 'boolean' }, pages: { type: 'string' }, form: { type: 'string', default: 'mobile,desktop' },
      runs: { type: 'string', default: '5' }, tz: { type: 'string', default: 'Asia/Ho_Chi_Minh' }, chrome: { type: 'string' }, out: { type: 'string' },
      country: { type: 'string' },
      'min-score': { type: 'string' }, event: { type: 'string' }, post: { type: 'string', default: 'beatmatch-bang-tai' },
    },
  });
  if (!values.base === !values.serve) throw new Error('say where: --base <url> or --serve');
  const runs = Number(values.runs);
  const forms = values.form.split(',').filter(Boolean);
  const out = values.out ?? join(BACKEND, '.lighthouse', new Date().toISOString().replace(/[:.]/g, '-'));
  mkdirSync(out, { recursive: true });
  if (!installed()) {
    console.log(`installing lighthouse ${VERSION} into tools/lighthouse`);
    await run('npm', ['ci', '--no-audit', '--no-fund'], HERE, process.env, join(out, 'install.log'));
  }
  if (loadavg()[0] > availableParallelism() / 2) console.warn(`warning: the load average is ${loadavg()[0].toFixed(1)} on ${availableParallelism()} cores: something else is running, and TBT will read high`);

  const served = values.serve ? await serve(out) : null;
  const base = (served?.base ?? values.base!).replace(/\/$/, '');
  const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(base);
  const event = values.event ?? (local ? 'ravo' : 'edc-thailand-th-2026-4m5n');
  const chrome = chromePath(values.chrome);
  const { default: lighthouse, desktopConfig, generateReport } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');
  const { default: puppeteer } = await import('puppeteer-core');

  const rows: Row[] = [];
  const benches: { name: string; benchmarkIndex: number }[] = [];
  try {
    for (const name of (values.pages ?? DEFAULT_PAGES).split(',').filter(Boolean)) {
      const def = PAGES[name] ?? { path: name };
      const url = base + def.path.replace('{event}', event).replace('{post}', values.post);
      const cookie = def.signedIn ? await sessionFor(base, local) : null;
      if (def.signedIn && !cookie) {
        console.warn(`${name}: skipped, it needs LH_COOKIE (a session cookie) on ${base}`);
        continue;
      }
      const country: Record<string, string> = values.country ? { 'x-vercel-ip-country': values.country.toUpperCase() } : {};
      const headers: Record<string, string> = { ...(cookie ? { cookie } : {}), ...country };
      // The session goes into the browser's jar for this host only (Lighthouse's extraHeaders would send it to every host the page asks).
      const host = new URL(base);
      const jar = (cookie ?? '').split(';').map((c) => c.trim()).filter(Boolean).map((c) => {
        const at = c.indexOf('=');
        return { name: c.slice(0, at), value: c.slice(at + 1), domain: host.hostname, path: '/', secure: host.protocol === 'https:' };
      });
      // Warm: ISR renders, the CDN keeps its copy.
      for (let i = 0; i < 2; i++) await fetch(url, { headers }).then((r) => r.arrayBuffer()).catch(() => undefined);
      for (const form of forms) {
        const lhrs: Lhr[] = [];
        for (let i = 1; i <= runs; i++) {
          const browser = await chromeLauncher.launch({ chromePath: chrome, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'], envVars: { ...process.env, TZ: values.tz } });
          const driver = await puppeteer.connect({ browserURL: `http://127.0.0.1:${browser.port}`, defaultViewport: null });
          try {
            if (jar.length) await driver.setCookie(...jar);
            const result = await lighthouse(url, { logLevel: 'error', output: 'json', onlyCategories: ['performance'], extraHeaders: country },
              form === 'desktop' ? desktopConfig : undefined, await driver.newPage());
            if (!result) throw new Error(`${url}: Lighthouse gave no result`);
            const lhr = result.lhr as unknown as Lhr;
            const file = join(out, `${name.replace(/[^a-z0-9-]+/gi, '_')}-${form}-${i}`);
            writeFileSync(`${file}.json`, JSON.stringify(result.lhr));
            lhrs.push(lhr);
            benches.push({ name: `${name} ${form} #${i}`, benchmarkIndex: lhr.environment.benchmarkIndex });
            const a = lhr.audits;
            console.log(`${name} ${form} #${i}: ${Math.round((lhr.categories.performance.score ?? 0) * 100)}  `
              + METRICS.map((id) => `${SHORT[id]} ${round(a[id]?.numericValue ?? NaN, id === 'cumulative-layout-shift' ? 3 : 0)}`).join('  '));
            if (lhr.runWarnings.length) {
              // What kept the page from finishing: its trace and devtools log, for the Performance panel.
              const artifacts = result.artifacts as unknown as { Trace?: unknown; DevtoolsLog?: unknown };
              writeFileSync(`${file}.trace.json`, JSON.stringify(artifacts.Trace ?? null));
              writeFileSync(`${file}.devtoolslog.json`, JSON.stringify(artifacts.DevtoolsLog ?? null));
              console.warn(`  ${lhr.runWarnings.join(' / ')} (trace saved: ${file}.trace.json); no more runs of this page`);
              break;
            }
          } finally {
            await driver.disconnect();
            browser.kill();
          }
        }
        const row = await summarise(name, form, lhrs);
        rows.push(row);
        writeFileSync(join(out, `${name.replace(/[^a-z0-9-]+/gi, '_')}-${form}-median.html`), generateReport((await medianRun(lhrs)) as never, 'html'));
        console.log(`${name} ${form}: median ${row.score} (${row.min}–${row.max}); points lost ${JSON.stringify(row.lost)}; LCP ${lcpCell(row.lcp)}; `
          + `img ${row.imageKb} KB; ${row.redirects.length} redirects; benchmarkIndex ${row.benchmarkIndex}`);
      }
    }
  } finally {
    served?.stop();
  }

  const md = `# Lighthouse ${VERSION} on ${base}\n\n${new Date().toISOString()}, ${runs} runs per page, TZ ${values.tz}${values.country ? `, country ${values.country}` : ''}\n\n${table(rows)}\n`;
  writeFileSync(join(out, 'summary.json'), JSON.stringify(rows, null, 2));
  writeFileSync(join(out, 'summary.md'), md);
  console.log(`\n${table(rows)}\n\n${out}`);
  for (const n of noisy(benches)) console.warn(`noisy: ${n}`);
  const failed = failures(rows, values['min-score'] === undefined ? undefined : Number(values['min-score']));
  if (failed.length) {
    console.error(`\n${failed.join('\n')}`);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
