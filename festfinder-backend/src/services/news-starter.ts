import type { Queryable } from '../db/index.ts';
import { one } from '../db/index.ts';
import type { NewsRegion } from './news.ts';

/*
 * The publications the news feed starts from ("Thêm nguồn gợi ý" in /console/news): reputable
 * EDM press with a syndication feed, checked on 2026-10-22 (feeds whose terms restrict
 * syndication to personal use, such as We Rave You's, Pitchfork's and the Vietnamese dailies', are
 * left out). Resident Advisor is not here: it publishes no feed and its terms forbid automated
 * reading; FeestFinder keeps its links as provenance only. A source
 * already listed by its feed address is left as it is, so adding the starters twice changes nothing.
 */

export interface StarterNewsSource { name: string; siteUrl: string; feedUrl: string; lang?: string; region?: NewsRegion; intervalMinutes?: number }

export const STARTER_NEWS_SOURCES: StarterNewsSource[] = [
  // Checked 2026-10-22: each feed answers, names no restriction on syndication, and most carry a picture per item.
  { name: 'Mixmag Asia', siteUrl: 'https://mixmag.asia/', feedUrl: 'https://mixmag.asia/rss.xml', region: 'asia' },
  { name: 'Mixmag', siteUrl: 'https://mixmag.net/', feedUrl: 'https://mixmag.net/rss.xml' },
  { name: 'DJ Mag', siteUrl: 'https://djmag.com/', feedUrl: 'https://djmag.com/rss.xml' },
  { name: 'EDM Identity', siteUrl: 'https://edmidentity.com/', feedUrl: 'https://edmidentity.com/feed/' },
  { name: 'EDMTunes', siteUrl: 'https://www.edmtunes.com/', feedUrl: 'https://www.edmtunes.com/feed/' },
  { name: 'Magnetic Magazine', siteUrl: 'https://magneticmag.com/', feedUrl: 'https://magneticmag.com/feed/' },
  { name: 'Billboard Dance', siteUrl: 'https://www.billboard.com/t/dance/', feedUrl: 'https://www.billboard.com/t/dance/feed/' },
  { name: 'Dancing Astronaut', siteUrl: 'https://dancingastronaut.com/', feedUrl: 'https://dancingastronaut.com/feed/' },
  { name: 'EDM Maniac', siteUrl: 'https://edmmaniac.com/', feedUrl: 'https://edmmaniac.com/feed/' },
  { name: 'Electronic Groove', siteUrl: 'https://electronicgroove.com/', feedUrl: 'https://electronicgroove.com/feed/' },
  { name: 'UKF', siteUrl: 'https://ukf.com/', feedUrl: 'https://ukf.com/feed/' },
  { name: 'Trance Attack', siteUrl: 'https://tranceattack.net/', feedUrl: 'https://tranceattack.net/feed/' },
  { name: 'Data Transmission', siteUrl: 'https://datatransmission.co/', feedUrl: 'https://datatransmission.co/feed/' },
  { name: 'Attack Magazine', siteUrl: 'https://www.attackmagazine.com/', feedUrl: 'https://www.attackmagazine.com/feed/' },
  { name: 'DJ TechTools', siteUrl: 'https://djtechtools.com/', feedUrl: 'https://djtechtools.com/feed/' },
  { name: 'Saigoneer', siteUrl: 'https://saigoneer.com/', feedUrl: 'https://saigoneer.com/?format=feed&type=rss', region: 'vietnam' },
];

export async function addStarterNewsSources(q: Queryable, now: Date, list = STARTER_NEWS_SOURCES): Promise<number> {
  let added = 0;
  for (const s of list) {
    if (await one(q, 'select 1 from news_sources where feed_url = $1', [s.feedUrl])) continue;
    await q.query(
      `insert into news_sources (name, site_url, feed_url, lang, region, enabled, interval_minutes, next_run_at, created_at, updated_at)
       values ($1,$2,$3,$4,$5,true,$6,$7,$7,$7)`,
      [s.name, s.siteUrl, s.feedUrl, s.lang ?? 'en', s.region ?? 'global', s.intervalMinutes ?? 60, now]);
    added++;
  }
  return added;
}
