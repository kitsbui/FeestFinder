import { sha256 } from '../../../lib/crypto.ts';
import { slugify } from '../../../lib/contact.ts';
import { draftFromJsonLd, jsonLdEvents } from '../jsonld.ts';
import { cleanUrl, finalize, hostOf } from '../normalize.ts';
import type { DiscoverResult, IngestIO, IngestSource, NormalizeContext, RawRecord, SourceAdapter } from '../types.ts';

/*
 * A web page that carries schema.org Event data: a ticket page, a venue's or festival's
 * programme, a promoter's site. The source's URL is read; with `follow` set to a pattern, the
 * event pages it links to (same site only) are read too, up to `maxPages` a run: pages never
 * read come first, then the ones read longest ago, so a long listing is covered over a few
 * runs. `skip` (a pattern on the title and venue) drops what is not a night out.
 *
 *   { "follow": "^/events/[^/]+$", "maxPages": 20, "skip": "brunch|day pass|kids" }
 */

interface WebsiteConfig { follow?: string; maxPages?: number }

/** Query parameters that only say where a click came from. */
const TRACKING = /^(utm_[a-z]+|source|ref|fbclid|gclid)$/i;

const MAX_PAGES = 50;

/**
 * Links on a page that match the pattern and stay on the page's own site: its <a href>s, then
 * paths quoted in the page's embedded data (sites built with Next or Nuxt keep part of their
 * listing there and draw it in the browser).
 */
export function eventLinks(html: string, pageUrl: string, pattern: string, max: number): string[] {
  let re: RegExp;
  try { re = new RegExp(pattern, 'i'); } catch { return []; }
  const host = hostOf(pageUrl);
  const out = new Set<string>();
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["']/gi)].map((m) => m[1]);
  const quoted = [...html.matchAll(/["'](\/[A-Za-z0-9][^"'\s<>#\\]{1,200})["']/g)].map((m) => m[1]);
  for (const href of [...hrefs, ...quoted]) {
    const raw = cleanUrl(href, pageUrl);
    if (!raw) continue;
    const u = new URL(raw);
    for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
    const url = u.toString();
    if (hostOf(url) !== host || url === pageUrl || !re.test(u.pathname)) continue;
    out.add(url);
    if (out.size >= max) break;
  }
  return [...out];
}

function recordsFrom(html: string, pageUrl: string): RawRecord[] {
  const nodes = jsonLdEvents(html);
  return nodes.map((node) => {
    const url = cleanUrl(node.url, pageUrl) ?? (nodes.length === 1 ? pageUrl : null);
    // Several events on one page without their own URL: tell them apart by name and start.
    const id = url && (url !== pageUrl || nodes.length === 1) ? url : `${pageUrl}#${slugify(String(node.name ?? '')).slice(0, 60)}-${String(node.startDate ?? '').slice(0, 16)}`;
    return { externalId: id, url: url ?? pageUrl, payload: { node, pageUrl } };
  });
}

export const websiteAdapter: SourceAdapter = {
  id: 'website',

  async discover(source: IngestSource, io: IngestIO): Promise<DiscoverResult> {
    if (!source.url) return { records: [], errors: ['no_url'] };
    const config = source.config as WebsiteConfig;
    const headers: Record<string, string> = {};
    if (source.etag) headers['if-none-match'] = source.etag;
    if (source.last_modified) headers['if-modified-since'] = source.last_modified;
    const page = await io.fetchText(source.url, { headers, accept: 'text/html,application/xhtml+xml' });
    if (page.status === 304) return { records: [], notModified: true };
    const contentHash = sha256(page.text);
    const meta = { etag: page.etag, lastModified: page.lastModified, contentHash };
    // The same bytes as last time: nothing new on this page.
    if (contentHash === source.content_hash && !config.follow) return { records: [], notModified: true, ...meta };

    const records = recordsFrom(page.text, page.url);
    const errors: string[] = [];
    if (config.follow) {
      const max = Math.min(Math.max(1, Number(config.maxPages) || 20), MAX_PAGES);
      let links = eventLinks(page.text, page.url, config.follow, 500);
      if (io.lastFetched) {
        const seen = await io.lastFetched(links);
        links = links.map((l, i) => ({ l, i, at: seen.get(l) ?? -1 })).sort((a, b) => a.at - b.at || a.i - b.i).map((x) => x.l);
      }
      for (const link of links.slice(0, max)) {
        // Leave time to store what was read; the rest waits for the next run.
        if (io.deadline && Date.now() > io.deadline - 8_000) { errors.push('time budget spent; more pages next run'); break; }
        try {
          const sub = await io.fetchPage(link);
          records.push(...recordsFrom(sub.html, sub.url));
        } catch (e) {
          errors.push(`${link}: ${(e as Error).message}`.slice(0, 300));
        }
      }
    }
    // One event linked from several places is still one record.
    const seen = new Set<string>();
    return { records: records.filter((r) => (seen.has(r.externalId) ? false : (seen.add(r.externalId), true))), errors, ...meta };
  },

  normalize(raw: RawRecord, ctx: NormalizeContext) {
    const { node, pageUrl } = raw.payload as { node: any; pageUrl: string };
    return finalize(draftFromJsonLd(node, pageUrl), { now: ctx.now, fallbackCity: ctx.source.city, wallClock: ctx.source.config.wallClock === true });
  },
};
