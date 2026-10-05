import { sha256 } from '../../../lib/crypto.ts';
import { slugify } from '../../../lib/contact.ts';
import { draftFromJsonLd, jsonLdEvents } from '../jsonld.ts';
import { cleanUrl, finalize, hostOf } from '../normalize.ts';
import type { DiscoverResult, IngestIO, IngestSource, NormalizeContext, RawRecord, SourceAdapter } from '../types.ts';

/*
 * A web page that carries schema.org Event data: a ticket page (Ticketbox), a venue's or
 * festival's programme, a promoter's site. The source's URL is read; with `follow` set to a
 * pattern, the event pages it links to (same site only) are read too, up to `maxPages`.
 *
 *   { "follow": "/event/", "maxPages": 20 }
 */

interface WebsiteConfig { follow?: string; maxPages?: number }

const MAX_PAGES = 50;

/** Links on a page that match the pattern and stay on the page's own site. */
export function eventLinks(html: string, pageUrl: string, pattern: string, max: number): string[] {
  let re: RegExp;
  try { re = new RegExp(pattern, 'i'); } catch { return []; }
  const host = hostOf(pageUrl);
  const out = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["']/gi)) {
    const url = cleanUrl(m[1], pageUrl);
    if (!url || hostOf(url) !== host || url === pageUrl || !re.test(new URL(url).pathname)) continue;
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
      for (const link of eventLinks(page.text, page.url, config.follow, max)) {
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
    return finalize(draftFromJsonLd(node, pageUrl), { now: ctx.now, fallbackCity: ctx.source.city });
  },
};
