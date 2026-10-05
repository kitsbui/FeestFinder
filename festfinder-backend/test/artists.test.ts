import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { artistKey, backfillArtists, ensureArtists } from '../src/services/artists.ts';
import { refreshDerived } from '../src/services/events.ts';

describe('artists', () => {
  let env: TestEnv;
  let minh: string;
  before(async () => {
    env = await setup();
    minh = await env.attendee();
  });
  after(async () => { await env.close(); });

  it('makes one artist however a listing spells the name', async () => {
    assert.equal(artistKey('Hà  Myo'), artistKey('ha myo'));
    const ids = await ensureArtists(env.ctx.db, ['HOAPROX', 'Hoaprox', 'hoaprox ']);
    assert.equal(new Set(ids.values()).size, 1);
    const rows = await env.ctx.db.query<{ n: number }>(`select count(*)::int as n from artists where normalized_name = 'hoaprox'`);
    assert.equal(rows.rows[0].n, 1);
    assert.equal(await backfillArtists(env.ctx.db), 0, 'the seed linked its events already');
  });

  it('links an event lineup to artist pages, and keeps it in step when the lineup changes', async () => {
    const ravo = (await env.as().get('/events/ravo')).body;
    assert.deepEqual(ravo.artistLinks.map((a: any) => a.slug), ['hoaprox', 'dj-mie', 'wukong']);
    await env.ctx.db.query(`update events set artists = array['Hoaprox', 'Kobosil'] where slug = 'ravo'`);
    await refreshDerived(env.ctx.db, ravo.id, env.clock.now());
    const again = (await env.as().get('/events/ravo')).body;
    assert.deepEqual(again.artistLinks.map((a: any) => a.name), ['Hoaprox', 'Kobosil']);
  });

  it('shows where an artist plays next and who follows them', async () => {
    // The demo attendee follows Hoaprox already.
    await env.as(minh).delete('/me/follows/artists/Hoaprox');
    const page = await env.as(minh).get('/artists/hoaprox');
    assert.equal(page.status, 200);
    assert.equal(page.body.artist.name, 'Hoaprox');
    assert.ok(page.body.upcoming.some((c: any) => c.slug === 'ravo'));
    assert.equal(page.body.artist.following, false);
    assert.deepEqual(page.body.artist.cities.map((c: any) => c.slug), ['ho-chi-minh']);
    await env.as(minh).put('/me/follows/artists/Hoaprox');
    const followed = await env.as(minh).get('/artists/hoaprox');
    assert.equal(followed.body.artist.following, true);
    assert.ok(followed.body.artist.followers >= 1);
    assert.equal((await env.as().get('/artists/nobody-here')).status, 404);
  });

  it('gives search engines an artist page with their shows, a Markdown copy and a sitemap entry', async () => {
    const seo = await env.as().get('/seo/artists/hoaprox');
    assert.equal(seo.status, 200);
    const group = seo.body.jsonLd['@graph'].find((n: any) => n['@type'] === 'MusicGroup');
    assert.equal(group.name, 'Hoaprox');
    assert.ok(group.event.some((e: any) => e.url.endsWith('/e/ravo') && e.startDate === '2026-09-19T16:00:00+07:00'));
    assert.equal(seo.body.robots.startsWith('index'), true);
    const md = await env.as().get('/a/hoaprox.md?lang=en');
    assert.match(md.body, /^# Hoaprox/);
    assert.match(md.body, /## Upcoming events/);
    const map = await env.as().get('/sitemap.xml');
    assert.match(map.body, /\/a\/hoaprox</);
    assert.ok((await env.as().get('/meta/artists')).body.items.some((a: any) => a.slug === 'hoaprox'));
    assert.equal((await env.as().get('/seo/artists/nobody-here')).status, 404);
  });
});

describe('Smart Alerts by city and style', () => {
  let env: TestEnv;
  let minh: string;
  before(async () => {
    env = await setup();
    minh = await env.attendee();
  });
  after(async () => { await env.close(); });

  it('keeps the cities and styles someone picks, and counts what matches them', async () => {
    const base = { enabled: true, genres: [], artists: [], organizerIds: [], areas: [], priceCap: null };
    const hcm = await env.as(minh).put('/me/alert', { ...base, cities: ['ho-chi-minh'], styles: [] });
    assert.equal(hcm.status, 200, JSON.stringify(hcm.body));
    assert.deepEqual(hcm.body.cities, ['ho-chi-minh']);
    assert.ok(hcm.body.matches > 0);
    const bkk = await env.as(minh).put('/me/alert', { ...base, cities: ['bangkok'], styles: [] });
    assert.equal(bkk.body.matches, 0);
    const techno = await env.as(minh).put('/me/alert', { ...base, cities: [], styles: ['hard-techno'] });
    assert.deepEqual([techno.body.styles, techno.body.matches], [['hard-techno'], 0]);
    assert.equal((await env.as(minh).put('/me/alert', { ...base, cities: ['paris'], styles: [] })).status, 400);
    assert.equal((await env.as(minh).put('/me/alert', { ...base, cities: [], styles: ['polka'] })).status, 400);
  });

  it('tells someone when a new listing matches their city and style', async () => {
    const base = { enabled: true, genres: [], artists: [], organizerIds: [], areas: [], priceCap: null };
    await env.as(minh).put('/me/alert', { ...base, cities: ['ho-chi-minh'], styles: ['house'] });
    const { announceNewListing } = await import('../src/services/listing.ts');
    const ev = (await env.ctx.db.query<{ id: string }>(`select id from events where slug = 'ravo'`)).rows[0];
    await env.ctx.db.query(`update events set styles = array['techno'] where id = $1`, [ev.id]);
    const missed = await announceNewListing(env.ctx.db, ev.id, env.clock.now());
    await env.ctx.db.query(`update events set styles = array['house'] where id = $1`, [ev.id]);
    const told = await announceNewListing(env.ctx.db, ev.id, env.clock.now());
    const alerts = await env.ctx.db.query<{ n: number }>(
      `select count(*)::int as n from notifications n join users u on u.id = n.user_id where u.email = 'minh@example.com' and n.kind = 'smart_alert'`);
    assert.ok(told >= 1 && told >= missed);
    assert.equal(alerts.rows[0].n, 1, 'one alert, for the style that matched');
  });
});
