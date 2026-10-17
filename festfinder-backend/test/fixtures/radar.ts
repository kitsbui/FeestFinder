/**
 * Feest Radar's share of the demo, for the local preview only (scripts/preview.sh sets
 * SEED_RADAR=1 for test/fixtures/reset.ts; the screen tests leave it out, so their counts hold).
 * The ingestion tests' fixture pages go through the real pipeline as if Radar had read them on
 * those sites, and what it files is approved, so the Radar tabs and tags have something to show.
 * Nothing is fetched: every page comes from test/fixtures/ingest.
 */
import { readFileSync } from 'node:fs';
import type { Ctx } from '../../src/context.ts';
import { many, one, type Db } from '../../src/db/index.ts';
import type { Clock } from '../../src/lib/time.ts';
import { PageUnavailable } from '../../src/services/fetchpage.ts';
import { refreshConfidence } from '../../src/services/ingest/confidence.ts';
import { runSource } from '../../src/services/ingest/run.ts';
import type { IngestIO } from '../../src/services/ingest/types.ts';

const fixture = (name: string) => readFileSync(new URL(`./ingest/${name}`, import.meta.url), 'utf8');

const PAGES: Record<string, string> = {
  'https://warehouse-bkk.example/programme': fixture('bangkok-venue.html'),
  'https://warehouse-bkk.example/events/hard-techno-night': fixture('bangkok-hard-techno-night.html'),
  'https://warehouse-bkk.example/events/dnb-sunday': fixture('bangkok-dnb-sunday.html'),
  'https://contact-tokyo.example/calendar.ics': fixture('tokyo.ics'),
  'https://islandpulse.example/': fixture('bali-festival.html'),
  'https://app.ticketmaster.com/discovery/v2/events.json': fixture('ticketmaster-sg.json'),
};

const SOURCES = [
  { adapter: 'website', name: 'The Warehouse BKK', url: 'https://warehouse-bkk.example/programme', city: 'bangkok', authority: 'official', config: { follow: '/events/' } },
  { adapter: 'ics', name: 'Contact Tokyo calendar', url: 'https://contact-tokyo.example/calendar.ics', city: 'tokyo', authority: 'listing', config: {} },
  { adapter: 'website', name: 'Island Pulse', url: 'https://islandpulse.example/', city: 'bali', authority: 'official', config: {} },
  { adapter: 'ticketmaster', name: 'Ticketmaster SG', url: null, city: 'singapore', authority: 'ticketing', config: { countryCode: 'SG' } },
];

export async function seedRadar(db: Db, clock: Clock): Promise<{ radarEvents: number }> {
  const now = clock.now();
  const fetchText: IngestIO['fetchText'] = async (url) => {
    const key = Object.keys(PAGES).find((k) => url === k || url.startsWith(k + '?'));
    if (!key) throw new PageUnavailable('upstream', 'status 404');
    return { status: 200, url, text: PAGES[key], etag: null, lastModified: null };
  };
  const io: IngestIO = { now, secrets: { ticketmasterKey: 'demo' }, fetchText, fetchPage: async (url) => ({ url, html: (await fetchText(url)).text }) };
  // What runSource reads of the app: the database, the clock and a log line.
  const ctx = { db, clock, log: () => {} } as unknown as Ctx;
  const ids: string[] = [];
  for (const s of SOURCES) {
    // Read once here, never on a schedule: the preview has no network to give them.
    const row = await one<{ id: string }>(db,
      `insert into ingest_sources (adapter, name, url, city, authority, config, enabled) values ($1,$2,$3,$4,$5,$6,false) returning id`,
      [s.adapter, s.name, s.url, s.city, s.authority, JSON.stringify(s.config)]);
    await runSource(ctx, row!.id, { io, trigger: 'manual' });
    ids.push(row!.id);
  }
  // A moderator's yes on everything Radar filed, as EDM.
  const filed = await many<{ id: string }>(db,
    `update events set status = 'live', genre = coalesce(genre, 'EDM'), published_at = $2, decided_at = $2
      where status = 'in_review' and id in (select event_id from raw_events where source_id = any($1::uuid[]) and event_id is not null)
      returning id`, [ids, now]);
  await refreshConfidence(db, now, filed.map((e) => e.id));
  return { radarEvents: filed.length };
}
