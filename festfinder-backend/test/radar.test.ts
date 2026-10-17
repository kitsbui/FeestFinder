import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setup, type TestEnv } from './helpers.ts';
import { one } from '../src/db/index.ts';
import { migrate } from '../src/db/migrate.ts';
import { festivalOf } from '../src/lib/festivals.ts';
import { knownOnLineup, stylesOfLineup } from '../src/lib/known-artists.ts';
import { classifyStyles, STYLES } from '../src/lib/styles.ts';
import { PageUnavailable } from '../src/services/fetchpage.ts';
import { expireRadar } from '../src/services/ingest/expire.ts';
import { bandOf } from '../src/services/ingest/fit.ts';
import type { IngestIO } from '../src/services/ingest/types.ts';

/*
 * Feest Radar (owner, 2026-10-17): the festivals it watches, the styles and artists it knows
 * after Beatport, the fit it gives the team, the finds it drops, and the day-after cleanup.
 */

const NOW = new Date('2026-09-14T03:00:00Z');

function fakeIO(pages: Record<string, string>): IngestIO {
  const fetchText = async (url: string) => {
    const key = Object.keys(pages).find((k) => url === k || url.startsWith(k + '?'));
    if (!key) throw new PageUnavailable('upstream', 'status 404');
    return { status: 200, url, text: pages[key], etag: null, lastModified: null };
  };
  return { now: NOW, secrets: {}, fetchText, fetchPage: async (url) => ({ url, html: (await fetchText(url)).text }) };
}

type Reason = { key: string };
type EventRow = { id: string; city: string; festival: string | null; event_type: string; status: string; origin: string; starts_on: string; ends_on: string; ticket_url: string | null; fit_score: number; fit_reasons: Reason[]; styles: string[] };
type CardLike = { id: string; festival: { key: string; flagship: boolean; label: { vi: string } } };

const page = (node: Record<string, unknown>) => `<html><head><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...node })}</script></head><body></body></html>`;

/** EDC Thailand's home page as it carries its edition (checked 2026-10-17), the address key spelt as they spell it. */
const EDC_THAILAND = page({
  '@type': 'Festival', name: 'EDC Thailand TH 2026', eventStatus: 'EventScheduled',
  description: 'Electric Daisy Carnival comes to Thailand with the best in electronic dance music, full-size carnival rides, performers and art.',
  startDate: '2026-12-18', endDate: '2026-12-20', url: 'https://thailand.electricdaisycarnival.com/',
  image: 'https://cdn.example/edth_2026.jpg',
  offers: [{ '@type': 'Offer', name: '3-Day General Admission Tickets', url: 'https://thailand.edc.com/tickets/#3-day-tickets', price: '279', priceCurrency: 'USD' }],
  location: { '@type': 'Place', name: 'Rhythm Park, Phuket', 'address ': 'Bandon-Cherngtalay Rd, Thalang District, Phuket, 83110' },
});

const KARAOKE = page({
  '@type': 'Event', name: 'Karaoke Thursday', startDate: '2026-10-01T20:00:00+07:00', url: 'https://bar.example/karaoke',
  location: { '@type': 'Place', name: 'Some Bar', address: { '@type': 'PostalAddress', streetAddress: '12 Lê Lợi', addressLocality: 'Ho Chi Minh City' } },
});

const TECHNO = page({
  '@type': 'MusicEvent', name: 'Warehouse: Charlotte de Witte all night', startDate: '2026-10-10T22:00:00+07:00', endDate: '2026-10-11T04:00:00+07:00',
  url: 'https://club.example/cdw', image: 'https://cdn.example/cdw.jpg', description: 'A night of techno in the warehouse.'.repeat(4),
  performer: [{ '@type': 'MusicGroup', name: 'Charlotte de Witte' }, { '@type': 'MusicGroup', name: 'Amelie Lens' }],
  offers: { '@type': 'Offer', url: 'https://tickets.example/cdw', price: '600000', priceCurrency: 'VND' },
  location: { '@type': 'Place', name: 'The Warehouse', address: { '@type': 'PostalAddress', streetAddress: '9 Đường Số 1, Quận 4', addressLocality: 'Ho Chi Minh City' } },
});

describe('Feest Radar, pure', () => {
  it('knows the festival brands it watches by their title, and nothing that only sounds like one', () => {
    assert.equal(festivalOf('EDC Thailand TH 2026')?.key, 'edc');
    assert.equal(festivalOf('EDC Thailand TH 2026')?.tier, 'world');
    assert.equal(festivalOf('Ultra Japan 2026')?.key, 'ultra');
    assert.equal(festivalOf('Road to Ultra: Bali')?.key, 'ultra');
    assert.equal(festivalOf('Tomorrowland Thailand')?.key, 'tomorrowland');
    assert.equal(festivalOf('Defqon.1 Weekend Festival')?.key, 'defqon');
    assert.equal(festivalOf('Verknipt Asia Tour')?.key, 'verknipt');
    assert.equal(festivalOf('S2O Songkran Music Festival')?.tier, 'asia');
    assert.equal(festivalOf('Ultra Lounge Thursdays'), null);
    assert.equal(festivalOf('Awakening night at the beach'), null);
  });

  it('reads Beatport’s dance genres, and a lineup of known artists when a source names no style', () => {
    assert.deepEqual(classifyStyles({ tags: ['Melodic House & Techno'] }), ['melodic-techno']);
    assert.deepEqual(classifyStyles({ tags: ['Afro House'] }), ['afro-house']);
    assert.deepEqual(classifyStyles({ tags: ['Hard Dance / Hardcore / Neo Rave'] }).includes('hard-dance'), true);
    assert.deepEqual(classifyStyles({ tags: ['UK Garage / Bassline'] }), ['uk-garage']);
    assert.deepEqual(classifyStyles({ title: 'Saturday', lineup: ['Charlotte de Witte', 'Amelie Lens'] }), ['techno']);
    assert.deepEqual(classifyStyles({ title: 'Saturday', lineup: ['Somebody Local'] }), []);
    assert.deepEqual(knownOnLineup(['Sub Focus', 'Trace', 'Felix']), ['Sub Focus'], 'names that are ordinary words are not artists');
    assert.deepEqual(stylesOfLineup(['Headhunterz', 'Brennan Heart', 'Angerfist']), ['hardstyle', 'hardcore']);
    assert.deepEqual([bandOf(85), bandOf(55), bandOf(20)], ['recommend', 'consider', 'skip']);
  });

  it('the web knows every style the API does, by the same key', () => {
    const web = readFileSync(new URL('../../festfinder-web/src/kd/genre.ts', import.meta.url), 'utf8');
    const keys = [...web.matchAll(/\['([a-z-]+)', '[^']+'\]/g)].map((m) => m[1]);
    assert.deepEqual([...keys].sort(), STYLES.map((s) => s.key).sort());
  });
});

describe('Feest Radar, running', () => {
  let env: TestEnv;
  let admin: string;
  before(async () => {
    env = await setup({
      ingestIO: () => fakeIO({
        'https://thailand.electricdaisycarnival.com/': EDC_THAILAND,
        'https://bar.example/': KARAOKE,
        'https://club.example/': TECHNO,
      }),
    });
    admin = await env.admin();
  });
  after(async () => { await env.close(); });

  const run = async (name: string, url: string, config: Record<string, unknown> = {}) => {
    const made = await env.as(admin).post('/admin/sources', { adapter: 'website', name, url, authority: 'official', config });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    const r = await env.as(admin).post(`/admin/sources/${made.body.id}/run`);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return { id: made.body.id as string, summary: r.body.summary };
  };

  it('keeps a world festival’s edition in a city not launched yet, as a festival of several days', async () => {
    const { summary } = await run('EDC Thailand', 'https://thailand.electricdaisycarnival.com/', { eventType: 'festival' });
    assert.equal(summary.created, 1, JSON.stringify(summary));
    const ev = (await one<EventRow>(env.ctx.db, `select * from events where title like 'EDC Thailand%'`))!;
    assert.deepEqual([ev.city, ev.festival, ev.event_type, ev.status, ev.origin], ['phuket', 'edc', 'festival', 'in_review', 'radar']);
    assert.deepEqual([String(ev.starts_on).slice(0, 10), new Date(ev.ends_on).toISOString().slice(0, 10)], ['2026-12-18', '2026-12-20']);
    assert.equal(ev.ticket_url, 'https://thailand.edc.com/tickets/', 'the ticket page, as the festival names it');
    assert.ok(ev.fit_score >= 70, `a world festival is worth listing (${ev.fit_score})`);
    assert.ok(ev.fit_reasons.some((r) => r.key === 'festival_world'));
  });

  it('drops what is not worth a night out, and scores a strong club night high with its reasons', async () => {
    const bar = await run('Some Bar', 'https://bar.example/');
    assert.equal(bar.summary.created, 0);
    assert.equal(bar.summary.rejected, 1);
    const raw = await env.as(admin).get(`/admin/sources/${bar.id}/raw?status=rejected`);
    assert.match(raw.body.items[0].error, /^low_fit: \d+$/);

    await run('The Club', 'https://club.example/');
    const ev = (await one<EventRow>(env.ctx.db, `select * from events where title like 'Warehouse: Charlotte%'`))!;
    assert.deepEqual(ev.styles, ['techno']);
    const keys = ev.fit_reasons.map((r) => r.key);
    for (const k of ['style', 'known_artists', 'complete', 'city', 'soon']) assert.ok(keys.includes(k), k);
    assert.ok(ev.fit_score >= 70, String(ev.fit_score));
  });

  it('puts world festivals first in the review queue, with each listing’s fit, and filters Radar finds', async () => {
    const q = await env.as(admin).get('/admin/queue?sort=fit');
    assert.equal(q.status, 200, JSON.stringify(q.body));
    assert.equal(q.body.items[0].festival.key, 'edc');
    assert.equal(q.body.items[0].festival.flagship, true);
    assert.equal(typeof q.body.items[0].fit.score, 'number');
    assert.ok(q.body.items[0].fit.reasons.length > 2);
    assert.ok(q.body.counts.radar >= 2);
    const radar = await env.as(admin).get('/admin/queue?filter=radar');
    assert.ok(radar.body.items.every((i: { origin: string }) => i.origin === 'radar'));
  });

  it('lists an approved world festival wherever in Asia it lands, highlighted, and on its own filter', async () => {
    const ev = await one<{ id: string; slug: string }>(env.ctx.db, `select id, slug from events where festival = 'edc'`);
    assert.equal((await env.as(admin).post('/admin/listings/approve', { ids: [ev!.id] })).status, 200);
    const all = await env.as().get('/events?time=all&upcoming=true&limit=60');
    const card = (all.body.items as CardLike[]).find((e) => e.id === ev!.id)!;
    assert.ok(card, 'listed though Phuket is not launched');
    assert.deepEqual([card.festival.key, card.festival.flagship, card.festival.label.vi], ['edc', true, 'Lễ hội lớn thế giới']);
    const flagship = await env.as().get('/events?time=all&upcoming=true&flagship=true');
    assert.deepEqual((flagship.body.items as CardLike[]).map((e) => e.id), [ev!.id]);
    // The city filter still only takes launched cities.
    assert.equal((await env.as().get('/events?city=phuket')).status, 400);
  });

  it('clears Radar finds a day after they end, a festival after its last day, and never what someone posted', async () => {
    const day = 86_400_000;
    const past = new Date(NOW.getTime() - 2 * day);
    const radarNight = await one<{ id: string }>(env.ctx.db, `select id from events where title like 'Warehouse: Charlotte%'`);
    await env.ctx.db.query('update events set ends_at = $2 where id = $1', [radarNight!.id, past]);
    const festival = await one<{ id: string }>(env.ctx.db, `select id from events where festival = 'edc'`);
    // Its last day ended twelve hours ago: kept until a full day has passed.
    await env.ctx.db.query('update events set ends_at = $2 where id = $1', [festival!.id, new Date(NOW.getTime() - day / 2)]);
    const posted = await one<{ id: string }>(env.ctx.db, `select id from events where origin = 'posted' and status = 'live' limit 1`);
    await env.ctx.db.query('update events set ends_at = $2 where id = $1', [posted!.id, past]);

    assert.equal(await expireRadar(env.ctx.db, NOW), 1);
    const status = async (id: string) => (await one<{ status: string }>(env.ctx.db, 'select status from events where id = $1', [id]))!.status;
    assert.equal(await status(radarNight!.id), 'expired');
    assert.equal(await status(festival!.id), 'live');
    assert.equal(await status(posted!.id), 'live');
    assert.equal((await env.as().get(`/events/${radarNight!.id}`)).status, 404, 'an expired find has no page');
    assert.equal(await expireRadar(env.ctx.db, new Date(NOW.getTime() + day)), 1, 'the festival goes a day after its last');
  });

  it('calls the organiser that holds Radar finds Feest Radar, at /organizers/feest-radar', async () => {
    const org = await env.as().get('/organizers/feest-radar');
    assert.equal(org.status, 200, JSON.stringify(org.body));
    assert.equal(org.body.name, 'Feest Radar');
  });
});

describe('Feest Radar and the community, two organisers (migration 044)', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  it('splits the one organiser production had: Radar keeps its finds, the community gets back what people posted', async () => {
    const db = env.ctx.db;
    const idOf = async (slug: string) => (await one<{ id: string }>(db, 'select id from organizers where slug = $1', [slug]))!.id;
    // Production before 043: one placeholder, "Cộng đồng FeestFinder" at /o/cong-dong, holding both kinds.
    const community = await idOf('cong-dong');
    await db.query(`delete from organizers where slug = 'feest-radar'`);
    await db.query('update organizers set placeholder = null where id = $1', [community]);
    const [found, posted] = (await db.query<{ id: string }>(`select id from events where status = 'live' order by starts_at limit 2`)).rows;
    await db.query(`update events set organizer_id = $1, origin = 'radar' where id = $2`, [community, found.id]);
    await db.query(`update events set organizer_id = $1, origin = 'posted' where id = $2`, [community, posted.id]);

    await db.query(`delete from schema_migrations where name in ('043_feest_radar.sql', '044_split_community_radar.sql')`);
    assert.deepEqual(await migrate(db), ['043_feest_radar.sql', '044_split_community_radar.sql']);

    const orgs = (await db.query<{ slug: string; name: string; placeholder: string; is_community: boolean }>(
      'select slug, name, placeholder, is_community from organizers where is_community order by placeholder')).rows;
    assert.deepEqual(orgs.map((o) => [o.placeholder, o.slug, o.name]), [['community', 'cong-dong', 'Cộng đồng FeestFinder'], ['radar', 'feest-radar', 'Feest Radar']]);
    const holder = async (id: string) => (await one<{ slug: string }>(db, 'select o.slug from events e join organizers o on o.id = e.organizer_id where e.id = $1', [id]))!.slug;
    assert.equal(await holder(found.id), 'feest-radar');
    assert.equal(await holder(posted.id), 'cong-dong');
    assert.equal((await env.as().get('/organizers/cong-dong')).body.name, 'Cộng đồng FeestFinder');
    assert.equal((await env.as().get('/organizers/feest-radar')).body.name, 'Feest Radar');
    // Run again, nothing moves.
    await db.query(`delete from schema_migrations where name in ('043_feest_radar.sql', '044_split_community_radar.sql')`);
    await migrate(db);
    assert.equal(await holder(found.id), 'feest-radar');
    assert.equal(await holder(posted.id), 'cong-dong');
  });

  it('sends a new Radar find to Feest Radar and an artist’s report or a community submission to the community', async () => {
    const { createCandidate } = await import('../src/services/ingest/run.ts');
    const n = {
      title: 'Split test night', description: null, startsOn: '2026-10-20', endsOn: '2026-10-20', startTime: '22:00', endTime: null, city: 'ho-chi-minh',
      venueName: 'Somewhere', address: null, area: null, lat: null, lng: null, lineup: [], genre: 'EDM' as const, styles: ['techno'], otherGenre: null,
      eventType: 'club' as const, imageUrl: null, ticketUrl: null, eventUrl: null, priceFrom: null, free: null, cancelled: false, organizerName: null, festival: null,
    };
    const src = { name: 'Test', url: null };
    const radar = await env.ctx.db.tx((q) => createCandidate(q, src, n, null, null, NOW));
    const person = await env.ctx.db.tx((q) => createCandidate(q, src, { ...n, title: 'Split test report' }, null, null, NOW, 'community'));
    const slugOf = async (id: string) => (await one<{ slug: string }>(env.ctx.db, 'select o.slug from events e join organizers o on o.id = e.organizer_id where e.id = $1', [id]))!.slug;
    assert.equal(await slugOf(radar), 'feest-radar');
    assert.equal(await slugOf(person), 'cong-dong');
  });
});

