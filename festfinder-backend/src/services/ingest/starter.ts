import type { Queryable } from '../../db/index.ts';
import { json, one } from '../../db/index.ts';

/*
 * The sources FeestFinder starts with: public pages checked on 2026-10-05 to carry schema.org
 * Event data on pages robots.txt lets FeestFinderBot read. Production adds the missing ones
 * when it starts; elsewhere the team adds them from /ops/sources. Once added, a source is the
 * team's: it is never changed or re-enabled from here.
 *
 * Not here, and why: Ticketbox, Ticketmelon and Zaiko draw their listings in the browser
 * (nothing to read without their private APIs); Clubberia has no structured data; Bali
 * Buddies and The Observatory disallow crawlers; Resident Advisor and Facebook forbid it.
 */

/** What a ticket seller also sells that is not a night out. */
const NOT_A_NIGHT_OUT = 'brunch|buffet|dinner|breakfast|lunch|day ?pass|meeting|package|\\bspa\\b|yoga|kids|daycare|bird park|watersport|surf|transfer|cooking|masterclass|hotel|resort|creative space|\\btour\\b|cruise|\\bclass\\b|workshop|comedy|stand-?up|poetry';

export interface StarterSource {
  adapter: 'website' | 'ics' | 'ticketmaster';
  name: string;
  url: string | null;
  city: string | null;
  authority: 'official' | 'ticketing' | 'listing';
  config: Record<string, unknown>;
  intervalMinutes: number;
  /** Only with this environment variable set (an API key). */
  needs?: string;
}

// Megatix writes every time with +08:00, the Bali/Singapore offset, even for Bangkok and
// Saigon: its times are read as the city's wall clock.
const megatix = (name: string, url: string): StarterSource => ({
  adapter: 'website', name, url, city: null, authority: 'ticketing', intervalMinutes: 360,
  config: { follow: '^/events/[^/]+$', maxPages: 30, skip: NOT_A_NIGHT_OUT, wallClock: true },
});

export const STARTER_SOURCES: StarterSource[] = [
  megatix('Megatix Singapore', 'https://megatix.com.sg/'),
  megatix('Megatix Indonesia', 'https://megatix.co.id/'),
  megatix('Megatix Thailand', 'https://megatix.in.th/'),
  megatix('Megatix Việt Nam', 'https://megatix.vn/'),
  {
    adapter: 'website', name: 'WOMB Tokyo', url: 'https://www.womb.co.jp/en', city: 'tokyo', authority: 'official', intervalMinutes: 720,
    config: { follow: '^/en/events/[0-9]+$', maxPages: 20, eventType: 'club' },
  },
  {
    adapter: 'website', name: 'Savaya Bali', url: 'https://www.savaya.com/', city: 'bali', authority: 'official', intervalMinutes: 720,
    config: { follow: '^/event-calendar/[a-z]+-[0-9]{1,2}-[0-9]{4}$', maxPages: 20, eventType: 'club' },
  },
  {
    adapter: 'website', name: 'TicketGo · Âm nhạc', url: 'https://ticketgo.vn/event/category/am-nhac', city: null, authority: 'ticketing', intervalMinutes: 720,
    config: { follow: '^/event/[a-z0-9-]+$', maxPages: 20 },
  },
  {
    adapter: 'ticketmaster', name: 'Ticketmaster Singapore', url: null, city: 'singapore', authority: 'ticketing', intervalMinutes: 360,
    config: { countryCode: 'SG', pages: 2 }, needs: 'TICKETMASTER_API_KEY',
  },
];

/** Adds the starter sources that are missing. Returns how many were added. */
export async function addStarterSources(q: Queryable, now: Date, env: Record<string, string | undefined> = process.env): Promise<number> {
  let added = 0;
  for (const s of STARTER_SOURCES) {
    const exists = s.url
      ? await one(q, 'select 1 from ingest_sources where url = $1', [s.url])
      : await one(q, `select 1 from ingest_sources where adapter = $1 and config->>'countryCode' = $2`, [s.adapter, String(s.config.countryCode ?? '')]);
    if (exists) continue;
    await q.query(
      `insert into ingest_sources (adapter, name, url, city, authority, config, interval_minutes, enabled, next_run_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [s.adapter, s.name, s.url, s.city, s.authority, json(s.config), s.intervalMinutes, !s.needs || !!env[s.needs], now]);
    added++;
  }
  return added;
}
