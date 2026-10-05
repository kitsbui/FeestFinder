import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setup, type TestEnv } from './helpers.ts';
import { cityAt, cityFromText } from '../src/lib/places.ts';
import { classifyStyles, inferEventType } from '../src/lib/styles.ts';
import { atZone, dateIn, eventBounds, isoIn, timeIn } from '../src/lib/time.ts';
import { formatMoney } from '../src/lib/money.ts';
import { PageUnavailable } from '../src/services/fetchpage.ts';
import { parseRobots, robotsAllows } from '../src/services/ingest/fetch.ts';
import { jsonLdEvents, draftFromJsonLd } from '../src/services/ingest/jsonld.ts';
import { finalize } from '../src/services/ingest/normalize.ts';
import { parseIcs, icsAdapter } from '../src/services/ingest/adapters/ics.ts';
import { ticketmasterAdapter } from '../src/services/ingest/adapters/ticketmaster.ts';
import { eventLinks, websiteAdapter } from '../src/services/ingest/adapters/website.ts';
import { scoreMatch, titleLikeness, venueLikeness } from '../src/services/ingest/resolve.ts';
import { confidenceLabel, scoreConfidence, type SourceFact } from '../src/services/ingest/confidence.ts';
import { isRejection, type IngestIO, type IngestSource, type NormalizedEvent } from '../src/services/ingest/types.ts';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/ingest/${name}`, import.meta.url), 'utf8');
const NOW = new Date('2026-09-14T03:00:00Z');

const source = (over: Partial<IngestSource> = {}): IngestSource => ({
  id: '00000000-0000-0000-0000-000000000001', adapter: 'website', name: 'Test', url: 'https://warehouse-bkk.example/programme',
  city: null, authority: 'official', config: {}, interval_minutes: 720, etag: null, last_modified: null, content_hash: null, ...over,
});

/** The network as fixtures: each URL answers with its file, anything else is a 404. */
function fakeIO(pages: Record<string, string>, opts: { secrets?: IngestIO['secrets']; etag?: string } = {}): IngestIO & { hits: string[] } {
  const hits: string[] = [];
  const fetchText = async (url: string, init: { headers?: Record<string, string> } = {}) => {
    hits.push(url.replace(/apikey=[^&]+/, 'apikey=***'));
    const key = Object.keys(pages).find((k) => url === k || url.startsWith(k + '?'));
    if (!key) throw new PageUnavailable('upstream', 'status 404');
    if (opts.etag && init.headers?.['if-none-match'] === opts.etag) return { status: 304, url, text: '', etag: opts.etag, lastModified: null };
    return { status: 200, url, text: pages[key], etag: opts.etag ?? null, lastModified: null };
  };
  return { now: NOW, secrets: opts.secrets ?? {}, hits, fetchText, fetchPage: async (url) => ({ url, html: (await fetchText(url)).text }) };
}

describe('places, time and money', () => {
  it('finds a city from coordinates or from the way an address names it', () => {
    assert.equal(cityAt(13.7246, 100.5698), 'bangkok');
    assert.equal(cityAt(35.658, 139.696), 'tokyo');
    assert.equal(cityAt(48.85, 2.35), null);
    assert.equal(cityFromText('Jl. Pantai Batu Bolong, Canggu'), 'bali');
    assert.equal(cityFromText('2-10-12 Dogenzaka, Shibuya, 東京'), 'tokyo');
    assert.equal(cityFromText('Thủ Dầu Một, Bình Dương'), 'ho-chi-minh', 'Bình Dương is part of HCM since the 2025 reform');
    assert.equal(cityFromText('Seoul'), 'seoul');
    assert.equal(cityFromText('Seoul', { launchedOnly: true }), null);
  });

  it("puts wall-clock times in each city's own timezone", () => {
    assert.equal(atZone('2026-10-24', '23:00', 'Asia/Tokyo').toISOString(), '2026-10-24T14:00:00.000Z');
    assert.equal(isoIn(new Date('2026-10-24T14:00:00Z'), 'Asia/Tokyo'), '2026-10-24T23:00:00+09:00');
    assert.equal(isoIn(new Date('2026-11-20T06:00:00Z'), 'Asia/Makassar'), '2026-11-20T14:00:00+08:00');
    assert.equal(dateIn(new Date('2026-10-24T16:30:00Z'), 'Asia/Tokyo'), '2026-10-25');
    assert.equal(timeIn(new Date('2026-10-24T16:30:00Z'), 'Asia/Singapore'), '00:30');
    const b = eventBounds('2026-10-17', '2026-10-17', '22:00', '05:00', 'Asia/Bangkok');
    assert.deepEqual([b.startsAt.toISOString(), b.endsAt.toISOString()], ['2026-10-17T15:00:00.000Z', '2026-10-17T22:00:00.000Z']);
  });

  it("writes prices in the event's currency", () => {
    assert.equal(formatMoney(1_200_000, 'VND', 'vi'), '1.200.000₫');
    assert.match(formatMoney(5000, 'JPY', 'en'), /¥\s?5,000/);
    assert.match(formatMoney(900, 'THB', 'en'), /900/);
  });
});

describe('music styles', () => {
  it('reads styles from source tags first, then safe phrases in the text', () => {
    assert.deepEqual(classifyStyles({ tags: ['Hard Techno / Acid'] }), ['hard-techno', 'acid-techno']);
    assert.deepEqual(classifyStyles({ title: 'Drum & Bass Sunday' }), ['drum-and-bass']);
    assert.deepEqual(classifyStyles({ title: 'Jazz at the Opera House' }), ['jazz'], '"Opera House" is not house music');
    assert.deepEqual(classifyStyles({ title: 'Pop-up market' }), [], '"pop-up" is not pop');
    assert.ok(classifyStyles({ tags: ['Techno'], title: 'Hard Techno Night' }).includes('hard-techno'));
    assert.ok(!classifyStyles({ tags: ['Techno'], title: 'Hard Techno Night' }).includes('techno'), 'hard techno already says techno');
  });

  it('infers what kind of night it is', () => {
    assert.equal(inferEventType({ schemaType: 'Festival', title: 'Island Pulse' }), 'festival');
    assert.equal(inferEventType({ title: 'Warehouse Rave Vol. 3' }), 'rave');
    assert.equal(inferEventType({ title: 'Contact All Night Long: Techno & House' }), 'club');
    assert.equal(inferEventType({ title: 'Something', schemaType: 'MusicEvent' }), 'concert');
  });
});

describe('reading sources', () => {
  it('finds every Event in a page, inside @graph or an array, and skips broken JSON', () => {
    const nodes = jsonLdEvents(fixture('bangkok-venue.html'));
    assert.deepEqual(nodes.map((n) => n.name), ['Warehouse Sessions: Hard Techno Night', 'Last Month Closing', 'Paris Pop-up']);
    assert.equal(jsonLdEvents(fixture('bali-festival.html'))[0].name, 'Island Pulse Festival 2026');
  });

  it('normalises an event into its city, times, styles and price, and refuses what cannot be listed', () => {
    const [night, past, paris] = jsonLdEvents(fixture('bangkok-venue.html'));
    const n = finalize(draftFromJsonLd(night, 'https://warehouse-bkk.example/programme'), { now: NOW }) as NormalizedEvent;
    assert.equal(n.city, 'bangkok');
    assert.deepEqual([n.startsOn, n.endsOn, n.startTime, n.endTime], ['2026-10-17', '2026-10-17', '22:00', '05:00'], 'one night, closing after midnight');
    assert.deepEqual(n.styles, ['hard-techno', 'industrial-techno']);
    assert.equal(n.genre, 'EDM');
    assert.deepEqual([n.priceFrom, n.free], [900, false]);
    assert.deepEqual(n.lineup, ['Sara Landry', 'Kobosil']);
    assert.equal(n.description, 'Two of the hardest selectors on one night.');
    assert.equal(n.ticketUrl, 'https://warehouse-bkk.example/tickets/htn');
    assert.deepEqual(finalize(draftFromJsonLd(past), { now: NOW }), { rejected: 'past' });
    assert.equal((finalize(draftFromJsonLd(paris), { now: NOW }) as any).rejected, 'out_of_area');
    assert.deepEqual(finalize({ title: '', start: '2026-10-01' }, { now: NOW }), { rejected: 'no_title' });
    assert.deepEqual(finalize({ title: 'X', start: '2026-10-01', end: '2026-12-01', address: 'Bangkok' }, { now: NOW }), { rejected: 'too_long' });
  });

  it('keeps a multi-day festival on its local dates, and drops a price in another currency', () => {
    const fest = finalize(draftFromJsonLd(jsonLdEvents(fixture('bali-festival.html'))[0]), { now: NOW }) as NormalizedEvent;
    assert.deepEqual([fest.city, fest.startsOn, fest.endsOn, fest.startTime, fest.endTime], ['bali', '2026-11-20', '2026-11-22', '14:00', '23:00']);
    assert.equal(fest.eventType, 'festival');
    assert.deepEqual(fest.styles, ['techno', 'house', 'psytrance']);
    assert.equal(fest.priceFrom, 1_500_000);
    const usd = finalize({ title: 'Gig', start: '2026-10-10T20:00', address: 'Bangkok', price: 30, currency: 'USD' }, { now: NOW }) as NormalizedEvent;
    assert.equal(usd.priceFrom, null);
  });

  it('follows event links on the same site only', () => {
    assert.deepEqual(eventLinks(fixture('bangkok-venue.html'), 'https://warehouse-bkk.example/programme', '/events/', 10),
      ['https://warehouse-bkk.example/events/hard-techno-night', 'https://warehouse-bkk.example/events/dnb-sunday']);
  });

  it('reads a website and the pages it links to, once each', async () => {
    const io = fakeIO({
      'https://warehouse-bkk.example/programme': fixture('bangkok-venue.html'),
      'https://warehouse-bkk.example/events/hard-techno-night': fixture('bangkok-hard-techno-night.html'),
      'https://warehouse-bkk.example/events/dnb-sunday': fixture('bangkok-dnb-sunday.html'),
    });
    const out = await websiteAdapter.discover(source({ config: { follow: '/events/' } }), io);
    assert.deepEqual(out.records.map((r) => r.externalId), [
      'https://warehouse-bkk.example/events/hard-techno-night',
      'https://warehouse-bkk.example/programme#last-month-closing-2026-09-01T22:00',
      'https://warehouse-bkk.example/programme#paris-pop-up-2026-11-01T20:00',
      'https://warehouse-bkk.example/events/dnb-sunday',
    ]);
    const dnb = websiteAdapter.normalize(out.records[3], { source: source(), now: NOW }) as NormalizedEvent;
    assert.deepEqual([dnb.city, dnb.free, dnb.priceFrom, dnb.styles[0]], ['bangkok', true, 0, 'drum-and-bass']);
  });

  it('parses an ICS feed: folded lines, zones, alarms, cancellations', async () => {
    const events = parseIcs(fixture('tokyo.ics'));
    assert.equal(events.length, 2);
    assert.equal(events[0].start, '2026-10-24T14:00:00.000Z');
    assert.match(events[0].description!, /the calendar folded it\.\nDoors 23:00\./);
    assert.deepEqual(events[0].geo, [35.658, 139.696]);
    const out = await icsAdapter.discover(source({ adapter: 'ics', url: 'https://contact-tokyo.example/cal.ics' }), fakeIO({ 'https://contact-tokyo.example/cal.ics': fixture('tokyo.ics') }));
    const [allNight, halloween] = out.records.map((r) => icsAdapter.normalize(r, { source: source(), now: NOW }) as NormalizedEvent);
    assert.equal(out.records[0].externalId, 'contact-tokyo.example:contact-2026-10-24@contact-tokyo.example');
    assert.deepEqual([allNight.city, allNight.startsOn, allNight.startTime, allNight.endsOn, allNight.endTime], ['tokyo', '2026-10-24', '23:00', '2026-10-24', '05:00']);
    assert.deepEqual(allNight.styles, ['techno', 'house']);
    assert.equal(allNight.venueName, 'Contact Tokyo');
    assert.deepEqual([halloween.cancelled, halloween.startTime], [true, '22:00']);
  });

  it('reads Ticketmaster with its key, without putting the key in what it logs', async () => {
    const empty = await ticketmasterAdapter.discover(source({ adapter: 'ticketmaster', url: null }), fakeIO({}));
    assert.deepEqual(empty.errors, ['TICKETMASTER_API_KEY is not set']);
    const io = fakeIO({ 'https://app.ticketmaster.com/discovery/v2/events.json': fixture('ticketmaster-sg.json') }, { secrets: { ticketmasterKey: 'k-123' } });
    const out = await ticketmasterAdapter.discover(source({ adapter: 'ticketmaster', url: null, config: { countryCode: 'SG' } }), io);
    assert.equal(out.records.length, 2);
    assert.ok(io.hits.every((h) => !h.includes('k-123')));
    const [marathon, pop] = out.records.map((r) => ticketmasterAdapter.normalize(r, { source: source(), now: NOW }) as NormalizedEvent);
    assert.deepEqual([marathon.city, marathon.startsOn, marathon.startTime, marathon.priceFrom], ['singapore', '2026-11-07', '22:00', 48]);
    assert.deepEqual(marathon.styles, ['techno', 'edm']);
    assert.equal(marathon.imageUrl, 'https://img.example/b.jpg');
    assert.deepEqual(marathon.lineup, ['Charlotte de Witte', 'Amelie Lens']);
    assert.equal(pop.cancelled, true);
  });


  it('follows robots.txt for FeestFinderBot, or for every crawler when it is not named', () => {
    const rules = parseRobots('User-agent: *\nDisallow: /private\nAllow: /private/events\n\nUser-agent: OtherBot\nDisallow: /');
    assert.ok(robotsAllows(rules, '/events/1'));
    assert.ok(!robotsAllows(rules, '/private/x'));
    assert.ok(robotsAllows(rules, '/private/events/2'));
    assert.ok(!robotsAllows(parseRobots('User-agent: FeestFinderBot\nDisallow: /\n\nUser-agent: *\nAllow: /'), '/a'));
  });
});

describe('what real sources send', () => {
  it('drops a city put in front of the title, and a venue that is only the city', () => {
    const n = finalize({ title: 'TP.HỒ CHÍ MINH | Musique de salon 22', start: '2026-10-10T20:15:00+07:00', venueName: 'TP.HỒ CHÍ MINH',
      address: 'Nhà Hát Hòa Bình, 240 Đường Ba Tháng Hai, Hồ Chí Minh' }, { now: NOW }) as NormalizedEvent;
    assert.deepEqual([n.title, n.venueName, n.city], ['Musique de salon 22', 'Nhà Hát Hòa Bình', 'ho-chi-minh']);
    const keep = finalize({ title: 'Saigon Soul Pool Party | Vol. 3', start: '2026-10-10', address: 'Quận 1, Hồ Chí Minh' }, { now: NOW }) as NormalizedEvent;
    assert.equal(keep.title, 'Saigon Soul Pool Party | Vol. 3');
  });

  it('counts one ticket seller once, whatever country site lists the event', async () => {
    const { brandOf, independentSources } = await import('../src/services/ingest/confidence.ts');
    assert.deepEqual(['megatix.com.sg', 'megatix.vn', 'megatix.in.th', 'www.womb.co.jp', 'ticketbox.vn'].map(brandOf), ['megatix', 'megatix', 'megatix', 'womb', 'ticketbox']);
    assert.equal(independentSources([{ provider: 'website', host: 'megatix.com.sg' }, { provider: 'website', host: 'megatix.vn' }, { provider: 'organizer', host: null }]), 2);
  });

  it('finds event links in embedded page data, without tracking parameters', () => {
    const html = '<a href="/events/one?source=home">1</a><script>{"path":"/events/two","asset":"/_nuxt/x.css"}</script>';
    assert.deepEqual(eventLinks(html, 'https://tix.example/', '^/events/[^/]+$', 10), ['https://tix.example/events/one', 'https://tix.example/events/two']);
  });

  it('reads pages never seen first, and stops when the run is out of time', async () => {
    const page = (n: number) => `<script type="application/ld+json">{"@type":"Event","name":"Night ${n}","startDate":"2026-10-1${n}T22:00:00+07:00","location":{"@type":"Place","name":"Club","address":"Bangkok"}}</script>`;
    const pages: Record<string, string> = { 'https://club.example/': '<a href="/events/1">1</a><a href="/events/2">2</a><a href="/events/3">3</a>' };
    for (const n of [1, 2, 3]) pages[`https://club.example/events/${n}`] = page(n);
    const io = fakeIO(pages);
    io.lastFetched = async () => new Map([['https://club.example/events/1', 1000], ['https://club.example/events/2', 2000]]);
    const out = await websiteAdapter.discover(source({ url: 'https://club.example/', config: { follow: '^/events/', maxPages: 2 } }), io);
    assert.deepEqual(out.records.map((r) => r.externalId), ['https://club.example/events/3', 'https://club.example/events/1'], 'the new page, then the oldest');
    const late = await websiteAdapter.discover(source({ url: 'https://club.example/', config: { follow: '^/events/' } }), { ...fakeIO(pages), deadline: Date.now() });
    assert.deepEqual([late.records.length, late.errors], [0, ['time budget spent; more pages next run']]);
  });
});

describe('matching and confidence', () => {
  it('scores two listings of one event above the merge line, and explains why', () => {
    assert.equal(titleLikeness('Boiler Room Bangkok', 'Boiler Room Bangkok: Sara Landry'), 1);
    assert.equal(venueLikeness('THE WAREHOUSE BKK', 'The Warehouse'), 1);
    const s = scoreMatch(
      { title: 'Ravolution Music Festival 2026', startsOn: '2026-09-19', startTime: '16:00', city: 'ho-chi-minh', venueName: 'SECC Sài Gòn', lat: null, lng: null, lineup: ['Hoaprox'] },
      { id: 'x', title: 'Ravolution Music Festival', starts_on: '2026-09-19', start_time: '16:00', venue_id: null, venue_name: 'SECC — TT Hội chợ & Triển lãm Sài Gòn', lat: 10.7295, lng: 106.7217, lineup: ['Hoaprox', 'DJ Mie'], artists: null, status: 'live' });
    assert.deepEqual(s, { score: 100, reasons: ['title', 'venue', 'date', 'time', 'artist'] });
    const other = scoreMatch(
      { title: 'Techno Garden', startsOn: '2026-09-20', startTime: '20:00', city: 'ho-chi-minh', venueName: 'The Garden', lat: null, lng: null, lineup: [] },
      { id: 'y', title: 'Ravolution Music Festival', starts_on: '2026-09-19', start_time: '16:00', venue_id: null, venue_name: 'SECC', lat: null, lng: null, lineup: [], artists: [], status: 'live' });
    assert.equal(other.score, 0);
  });

  it('scores confidence from configurable rules, with labels', () => {
    const now = new Date('2026-10-01T00:00:00Z');
    const src = (over: Partial<SourceFact>): SourceFact => ({ provider: 'organizer', authority: 'official', host: null, conflicts: [], lastSeenAt: now, ...over });
    const organiser = scoreConfidence({ sources: [src({})], organizerVerified: true, approved: true, venueVerified: true, venuePinned: true, ticketLinkOk: true, upcoming: true, now });
    assert.deepEqual([organiser.score, organiser.label], [80, 'verified']);
    const community = scoreConfidence({ sources: [src({ provider: 'community', authority: 'community' })], organizerVerified: false, approved: true, venueVerified: true, venuePinned: true, ticketLinkOk: false, upcoming: true, now });
    assert.deepEqual([community.score, community.label], [40, 'likely']);
    const conflicted = scoreConfidence({
      sources: [src({ provider: 'website', authority: 'ticketing', host: 'a.example' }), src({ provider: 'ics', authority: 'listing', host: 'b.example', conflicts: [{ field: 'starts_on' }] })],
      organizerVerified: false, approved: false, venueVerified: false, venuePinned: false, ticketLinkOk: false, upcoming: true, now,
    });
    assert.deepEqual(conflicted.breakdown.map((l) => [l.rule, l.points]), [['base:ticketing', 25], ['second_source', 10], ['date_conflict', -20]]);
    const stale = scoreConfidence({ sources: [src({ provider: 'website', authority: 'ticketing', host: 'a.example', lastSeenAt: new Date('2026-09-01T00:00:00Z') })], organizerVerified: false, approved: true, venueVerified: false, venuePinned: false, ticketLinkOk: false, upcoming: true, now });
    assert.ok(stale.breakdown.some((l) => l.rule === 'stale'));
    assert.deepEqual([39, 40, 70, 90].map(confidenceLabel), ['low', 'likely', 'verified', 'highly_verified']);
  });
});

describe('ingestion runs (API)', () => {
  let env: TestEnv;
  let admin: string;
  let pages: Record<string, string>;
  let tmKey: string | undefined;
  before(async () => {
    pages = {
      'https://warehouse-bkk.example/programme': fixture('bangkok-venue.html'),
      'https://warehouse-bkk.example/events/hard-techno-night': fixture('bangkok-hard-techno-night.html'),
      'https://warehouse-bkk.example/events/dnb-sunday': fixture('bangkok-dnb-sunday.html'),
      'https://warehouse-bkk.example/calendar.ics': fixture('tokyo.ics').replace(/Contact Tokyo/g, 'The Warehouse').replace(/Tokyo/g, 'Bangkok')
        .replace('DTSTART;TZID=Asia/Bangkok:20261024T230000', 'DTSTART;TZID=Asia/Bangkok:20261017T220000')
        .replace('DTEND;TZID=Asia/Bangkok:20261025T050000', 'DTEND;TZID=Asia/Bangkok:20261018T050000')
        .replace('SUMMARY:Contact All Night Long: Techno & House', 'SUMMARY:Warehouse Sessions: Hard Techno Night')
        .replace('GEO:35.6580;139.6960', 'GEO:13.7247;100.5699'),
      'https://ticketbox.vn/ravolution-music-festival-2026': fixture('ticketbox-ravolution.html'),
      'https://app.ticketmaster.com/discovery/v2/events.json': fixture('ticketmaster-sg.json'),
    };
    env = await setup({ ingestIO: () => fakeIO(pages, { secrets: { ticketmasterKey: 'k-123' } }) });
    admin = await env.admin();
    tmKey = process.env.TICKETMASTER_API_KEY;
  });
  after(async () => { await env.close(); if (tmKey === undefined) delete process.env.TICKETMASTER_API_KEY; });

  const addSource = async (body: Record<string, unknown>) => {
    const res = await env.as(admin).post('/admin/sources', body);
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.id as string;
  };

  it('lists no sources on an empty install', async () => {
    const res = await env.as(admin).get('/admin/sources');
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual([res.body.items, res.body.cancelledBySource], [[], []]);
  });

  it('keeps RA and Facebook out of automatic reading', async () => {
    const res = await env.as(admin).post('/admin/sources', { adapter: 'website', name: 'RA Bangkok', url: 'https://ra.co/events/th/bangkok' });
    assert.equal(res.body.error.code, 'source_not_allowed');
    assert.equal((await env.as().get('/admin/sources')).status, 401);
  });

  let venueSource: string;
  it('turns a venue site into candidates in the review queue, never live events', async () => {
    venueSource = await addSource({ adapter: 'website', name: 'The Warehouse BKK', url: 'https://warehouse-bkk.example/programme', city: 'bangkok', authority: 'official', config: { follow: '/events/' } });
    const run = await env.as(admin).post(`/admin/sources/${venueSource}/run`);
    assert.equal(run.status, 200, JSON.stringify(run.body));
    assert.deepEqual(
      [run.body.summary.fetched, run.body.summary.created, run.body.summary.rejected, run.body.summary.merged],
      [4, 2, 2, 0]);
    const raw = await env.as(admin).get(`/admin/sources/${venueSource}/raw?status=rejected`);
    assert.deepEqual(raw.body.items.map((r: any) => r.error.split(':')[0]).sort(), ['out_of_area', 'past']);

    const htn = await env.ctx.db.query<any>(`select e.*, o.is_community from events e join organizers o on o.id = e.organizer_id where e.title = 'Warehouse Sessions: Hard Techno Night'`);
    const ev = htn.rows[0];
    assert.equal(ev.status, 'in_review');
    assert.equal(ev.is_community, true);
    assert.deepEqual([ev.city, ev.currency, ev.event_type], ['bangkok', 'THB', 'club']);
    assert.deepEqual(ev.styles, ['hard-techno', 'industrial-techno']);
    assert.equal(new Date(ev.starts_at).toISOString(), '2026-10-17T15:00:00.000Z');
    const queue = await env.as(admin).get('/admin/queue');
    assert.ok(JSON.stringify(queue.body).includes('Warehouse Sessions: Hard Techno Night'));
  });

  it('changes nothing when a source is read again', async () => {
    const before = await env.ctx.db.query<{ n: number }>('select count(*)::int as n from events');
    const run = await env.as(admin).post(`/admin/sources/${venueSource}/run`);
    assert.deepEqual([run.body.summary.created, run.body.summary.merged, run.body.summary.unchanged, run.body.summary.rejected], [0, 0, 2, 2]);
    const after = await env.ctx.db.query<{ n: number }>('select count(*)::int as n from events');
    assert.equal(after.rows[0].n, before.rows[0].n);
    const runs = await env.as(admin).get(`/admin/sources/${venueSource}/runs`);
    assert.equal(runs.body.items.length, 2);
  });

  let htnId: string;
  it('merges a second source for the same night, and its confidence goes up', async () => {
    const ics = await addSource({ adapter: 'ics', name: 'Warehouse calendar', url: 'https://warehouse-bkk.example/calendar.ics', city: 'bangkok', authority: 'listing' });
    htnId = (await env.ctx.db.query<any>(`select id from events where title = 'Warehouse Sessions: Hard Techno Night'`)).rows[0].id;
    const before = (await env.as(admin).get(`/admin/events/${htnId}/provenance`)).body;
    const run = await env.as(admin).post(`/admin/sources/${ics}/run`);
    assert.equal(run.body.summary.merged, 1, JSON.stringify(run.body.summary));
    const prov = (await env.as(admin).get(`/admin/events/${htnId}/provenance`)).body;
    assert.deepEqual(prov.sources.map((s: any) => s.provider), ['website', 'ics']);
    assert.equal(prov.sources[1].matchReason, 'title+venue+date+time+geo');
    assert.ok(prov.confidence.score > before.confidence.score);
    assert.ok(prov.confidence.breakdown.some((l: any) => l.rule === 'second_source'));
    assert.equal(run.body.summary.rejected, 1, 'a cancelled night nobody listed is not a new event');
  });

  it('merges an import into the event it matches and records the source, never overwriting the organiser', async () => {
    const tb = await addSource({ adapter: 'website', name: 'Ticketbox Ravolution', url: 'https://ticketbox.vn/ravolution-music-festival-2026', city: 'ho-chi-minh', authority: 'ticketing' });
    const run = await env.as(admin).post(`/admin/sources/${tb}/run`);
    assert.equal(run.body.summary.merged, 1, JSON.stringify(run.body.summary));
    const ravo = (await env.as().get('/events/ravo')).body;
    assert.equal(ravo.title, 'Ravolution Music Festival');
    assert.deepEqual(ravo.lineup, ['Hoaprox', 'DJ Mie', 'Wukong']);
    assert.equal(ravo.confidence.sources, 2);
    assert.deepEqual(ravo.confidence.sourcesLine, { en: 'Verified from 2 sources', vi: 'Xác minh từ 2 nguồn' });
    assert.ok(ravo.sources.some((s: any) => s.host === 'ticketbox.vn' && s.url === 'https://ticketbox.vn/ravolution-music-festival-2026'));
  });

  it('lists an approved import in its city, on the map, priced in its own currency', async () => {
    const tm = await addSource({ adapter: 'ticketmaster', name: 'Ticketmaster SG', city: 'singapore', authority: 'ticketing', config: { countryCode: 'SG' } });
    const run = await env.as(admin).post(`/admin/sources/${tm}/run`);
    assert.deepEqual([run.body.summary.created, run.body.summary.rejected], [1, 1], JSON.stringify(run.body.summary));
    const marathon = (await env.ctx.db.query<any>(`select id from events where title = 'ZOUK presents: Techno Marathon'`)).rows[0];
    const ok = await env.as(admin).post('/admin/listings/approve', { ids: [marathon.id] });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));

    const list = await env.as().get('/events?time=all&city=singapore');
    assert.deepEqual(list.body.items.map((e: any) => e.title), ['ZOUK presents: Techno Marathon']);
    const card = list.body.items[0];
    assert.deepEqual([card.currency, card.priceFrom, card.country, card.timezone], ['SGD', 48, 'SG', 'Asia/Singapore']);
    assert.deepEqual(card.styles, ['techno', 'edm']);
    assert.equal(card.confidence.label, 'likely');
    assert.equal((await env.as().get('/events?time=all&city=singapore&style=house')).body.items.length, 0);
    assert.equal((await env.as().get('/events?time=all&country=SG')).body.items.length, 1);
    assert.equal(list.body.facets.city.singapore, 1);

    const map = await env.as().get('/events/map?bbox=103.6,1.2,104.05,1.48');
    assert.deepEqual(map.body.items.map((e: any) => e.title), ['ZOUK presents: Techno Marathon']);
    assert.equal(map.body.truncated, false);
    assert.equal((await env.as().get('/events/map?bbox=100.3,13.45,100.95,14.1')).body.items.length, 0, 'Bangkok candidates are still in review');

    const seo = (await env.as().get(`/seo/events/${card.slug}`)).body;
    const graph = seo.jsonLd['@graph'] ?? [];
    const ev = graph.find((n: any) => n['@type'] === 'MusicEvent');
    assert.equal(ev.startDate, '2026-11-07T22:00:00+08:00');
    assert.equal(ev.offers.priceCurrency, 'SGD');
    assert.equal(ev.location.address.addressCountry, 'SG');
  });

  it('serves the listed cities, styles and event types for the chips', async () => {
    const meta = (await env.as().get('/meta/discovery')).body;
    assert.deepEqual(meta.cities.map((c: any) => c.slug), ['ho-chi-minh', 'ha-noi', 'da-nang', 'nha-trang', 'bangkok', 'tokyo', 'singapore', 'bali']);
    assert.deepEqual(meta.countries.map((c: any) => c.code), ['VN', 'TH', 'SG', 'ID', 'JP']);
    assert.ok(meta.styles.some((s: any) => s.key === 'hard-techno' && s.genre === 'EDM'));
    assert.ok(meta.eventTypes.some((t: any) => t.key === 'festival'));
  });

  it('keeps a pasted RA link as a source without fetching it, and lets a moderator detach a wrong one', async () => {
    const add = await env.as(admin).post(`/admin/events/${htnId}/sources`, { url: 'https://ra.co/events/2200001' });
    assert.equal(add.status, 201);
    assert.equal((await env.as(admin).post(`/admin/events/${htnId}/sources`, { url: 'https://ra.co/events/2200001' })).status, 409);
    let prov = (await env.as(admin).get(`/admin/events/${htnId}/provenance`)).body;
    const ra = prov.sources.find((s: any) => s.provider === 'resident_advisor');
    assert.equal(ra.host, 'ra.co');
    const ics = prov.sources.find((s: any) => s.provider === 'ics');
    assert.equal((await env.as(admin).delete(`/admin/events/${htnId}/sources/${ics.id}`)).status, 200);
    prov = (await env.as(admin).get(`/admin/events/${htnId}/provenance`)).body;
    assert.ok(!prov.sources.some((s: any) => s.provider === 'ics'));
  });

  it('lists every source with its last run', async () => {
    const res = await env.as(admin).get('/admin/sources');
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const venue = res.body.items.find((x: any) => x.name === 'The Warehouse BKK');
    // The test clock stands still, so both of its runs started at the same moment: either may be "last".
    assert.equal(venue.events, 2);
    assert.equal(venue.lastRun.fetched, 4);
    assert.ok(Array.isArray(res.body.cancelledBySource));
  });

  it('skips what a source marks as not a night out, and takes the kind of night from the source', async () => {
    const id = await addSource({ adapter: 'website', name: 'Warehouse (club nights)', url: 'https://warehouse-bkk.example/events/dnb-sunday', city: 'bangkok', authority: 'official', config: { eventType: 'club' } });
    const run = await env.as(admin).post(`/admin/sources/${id}/run`);
    assert.equal(run.body.summary.merged + run.body.summary.created, 1, JSON.stringify(run.body.summary));
    const dnb = (await env.ctx.db.query<any>(`select event_type from events where title = 'DnB Sunday'`)).rows[0];
    assert.equal(dnb.event_type, 'club');
    const skipping = await addSource({ adapter: 'website', name: 'Warehouse (no DnB)', url: 'https://warehouse-bkk.example/events/dnb-sunday', city: 'bangkok', config: { skip: 'dnb' } });
    const skipped = await env.as(admin).post(`/admin/sources/${skipping}/run`);
    assert.equal(skipped.body.summary.rejected, 1);
    const raw = await env.as(admin).get(`/admin/sources/${skipping}/raw?status=rejected`);
    assert.match(raw.body.items[0].error, /^skipped/);
  });

  it('reprocesses stored records without fetching again', async () => {
    const res = await env.as(admin).post(`/admin/sources/${venueSource}/reprocess`);
    assert.equal(res.status, 200);
    assert.deepEqual([res.body.summary.created, res.body.summary.rejected], [0, 2]);
    assert.equal(res.body.summary.merged, 2);
  });

  it('adds the suggested sources once, enabling Ticketmaster only with its key', async () => {
    const { STARTER_SOURCES } = await import('../src/services/ingest/starter.ts');
    delete process.env.TICKETMASTER_API_KEY;
    const first = await env.as(admin).post('/admin/sources/starter');
    // The Ticketmaster SG source added earlier in this file is already there.
    assert.equal(first.body.added, STARTER_SOURCES.length - 1, JSON.stringify(first.body));
    assert.equal((await env.as(admin).post('/admin/sources/starter')).body.added, 0);
    const list = (await env.as(admin).get('/admin/sources')).body.items;
    const megatix = list.find((x: any) => x.name === 'Megatix Thailand');
    assert.deepEqual([megatix.enabled, megatix.config.wallClock, megatix.intervalMinutes], [true, true, 360]);
    // Not due to the scheduled job in this test: they would try the network.
    await env.ctx.db.query(`update ingest_sources set next_run_at = now() + interval '1 day'`);
  });

  it('runs due sources from the scheduled job and skips the ones not due', async () => {
    const { jobs } = await import('../src/jobs.ts');
    const out = await jobs.ingest(env.ctx);
    assert.deepEqual(out, [], 'every source ran moments ago');
  });
});

describe('a record that fails one check', () => {
  it('is a rejection, not an event', () => {
    assert.ok(isRejection(finalize({ title: 'Somewhere', start: 'next friday' , address: 'Bangkok' }, { now: NOW })));
  });
});
