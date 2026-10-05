import { fetchPublic, PageUnavailable } from '../fetchpage.ts';
import type { FetchedText, IngestIO } from './types.ts';

/*
 * How FeestFinder reads other people's sites: it asks robots.txt first, leaves at least two
 * seconds between requests to one host, sends conditional headers so an unchanged feed costs
 * nothing, and retries a failed request once after a pause. No browser, no evasion.
 */

const BOT = 'feestfinderbot';
const ROBOTS_TTL_MS = 6 * 3600_000;

type Rules = { allow: string[]; disallow: string[] };
const robotsCache = new Map<string, { at: number; rules: Rules }>();
const lastHit = new Map<string, number>();

/** The rules robots.txt gives FeestFinderBot, or every crawler when it is not named. */
export function parseRobots(text: string): Rules {
  const groups: { agents: string[]; rules: Rules }[] = [];
  let current: { agents: string[]; rules: Rules } | null = null;
  let lastWasAgent = false;
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z-]+)\s*:\s*(.*?)\s*(?:#.*)?$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2];
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) { current = { agents: [], rules: { allow: [], disallow: [] } }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === 'allow' && value) current.rules.allow.push(value);
    if (key === 'disallow' && value) current.rules.disallow.push(value);
  }
  const mine = groups.find((g) => g.agents.some((a) => a.includes(BOT))) ?? groups.find((g) => g.agents.includes('*'));
  return mine?.rules ?? { allow: [], disallow: [] };
}

const toRegex = (rule: string) => new RegExp('^' + rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));

/** Longest matching rule wins; Allow wins a tie. */
export function robotsAllows(rules: Rules, path: string): boolean {
  let best = { len: -1, allow: true };
  for (const r of rules.disallow) if (toRegex(r).test(path) && r.length > best.len) best = { len: r.length, allow: false };
  for (const r of rules.allow) if (toRegex(r).test(path) && r.length >= best.len) best = { len: r.length, allow: true };
  return best.allow;
}

async function rulesFor(origin: string): Promise<Rules> {
  const hit = robotsCache.get(origin);
  if (hit && Date.now() - hit.at < ROBOTS_TTL_MS) return hit.rules;
  let rules: Rules = { allow: [], disallow: [] };
  try {
    const res = await fetchPublic(`${origin}/robots.txt`, { accept: 'text/plain', maxBytes: 500_000, timeoutMs: 5000 });
    rules = parseRobots(res.text);
  } catch (e) {
    // No robots.txt means no rules. A site that refuses to answer for it is left alone this time.
    if (!(e instanceof PageUnavailable && /status 4\d\d/.test(e.message))) rules = { allow: [], disallow: ['/'] };
  }
  robotsCache.set(origin, { at: Date.now(), rules });
  return rules;
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The network as an ingestion run sees it. */
export function politeIO(now: Date, opts: { minGapMs?: number; secrets?: IngestIO['secrets'] } = {}): IngestIO {
  const gap = opts.minGapMs ?? 2000;
  const fetchText = async (url: string, init: { headers?: Record<string, string>; accept?: string; api?: boolean } = {}): Promise<FetchedText> => {
    const u = new URL(url);
    if (!init.api && !robotsAllows(await rulesFor(u.origin), u.pathname + u.search)) throw new PageUnavailable('upstream', `robots.txt disallows ${u.pathname}`);
    for (let attempt = 0; ; attempt++) {
      const wait = (lastHit.get(u.host) ?? 0) + gap - Date.now();
      if (wait > 0) await pause(wait);
      lastHit.set(u.host, Date.now());
      try {
        const res = await fetchPublic(url, { accept: init.accept, headers: init.headers, maxBytes: 4_000_000, timeoutMs: 10_000 });
        return { status: res.status, url: res.url, text: res.text, etag: res.etag, lastModified: res.lastModified };
      } catch (e) {
        const retryable = e instanceof PageUnavailable && e.reason === 'upstream' && !/status 4\d\d/.test(e.message);
        if (!retryable || attempt >= 1) throw e;
        await pause(3000);
      }
    }
  };
  return {
    now,
    secrets: opts.secrets ?? {},
    fetchText,
    fetchPage: async (url) => {
      const res = await fetchText(url, { accept: 'text/html,application/xhtml+xml' });
      return { url: res.url, html: res.text };
    },
  };
}
