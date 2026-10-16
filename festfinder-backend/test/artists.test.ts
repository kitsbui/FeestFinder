import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { artistKey, backfillArtists, ensureArtists } from '../src/services/artists.ts';
import { refreshDerived } from '../src/services/events.ts';
import { one } from '../src/db/index.ts';

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

  it('shows where an artist plays next; only a profile an artist runs can be followed', async () => {
    const page = await env.as(minh).get('/artists/hoaprox');
    assert.equal(page.status, 200);
    assert.equal(page.body.artist.name, 'Hoaprox');
    assert.equal(page.body.artist.kind, 'unclaimed', 'a lineup name nobody runs');
    assert.ok(page.body.upcoming.some((c: any) => c.slug === 'ravo'));
    assert.deepEqual(page.body.artist.cities.map((c: any) => c.slug), ['ho-chi-minh']);
    assert.equal((await env.as(minh).put('/me/follows/artists/hoaprox')).body.error.code, 'not_claimed');

    const slimv = await env.as(minh).get('/artists/slimv');
    assert.equal(slimv.body.artist.kind, 'owned');
    await env.as(minh).delete('/me/follows/artists/slimv');
    assert.equal((await env.as(minh).get('/artists/slimv')).body.artist.following, false);
    assert.equal((await env.as(minh).put(`/me/follows/artists/${slimv.body.artist.id}`)).body.following, true, 'by id');
    const followed = await env.as(minh).get('/artists/slimv');
    assert.equal(followed.body.artist.following, true);
    assert.ok(followed.body.artist.followers >= 1);
    assert.equal((await env.as().get('/artists/nobody-here')).status, 404);
  });

  it('the directory lists the artists who run their profile; unclaimed names wait apart, with where they were seen', async () => {
    const owned = await env.as().get('/artists?limit=60');
    assert.ok(owned.body.items.length >= 2);
    assert.ok(owned.body.items.every((a: any) => a.kind === 'owned'));
    assert.ok(owned.body.items.some((a: any) => a.slug === 'slimv') && owned.body.items.some((a: any) => a.slug === 'tran-duy'));
    assert.ok(!owned.body.items.some((a: any) => a.slug === 'hoaprox'));
    assert.ok(owned.body.kinds.owned >= 2 && owned.body.kinds.unclaimed > 0);
    const unclaimed = await env.as().get('/artists?kind=unclaimed&limit=60');
    const hoaprox = unclaimed.body.items.find((a: any) => a.slug === 'hoaprox');
    assert.equal(hoaprox.kind, 'unclaimed');
    assert.equal(hoaprox.source.kind, 'lineup');
    assert.ok(hoaprox.source.event.slug);
    assert.ok(unclaimed.body.items.every((a: any) => a.kind !== 'owned'));
  });

  it('an artist cannot follow their own profile, and a rename keeps the followers', async () => {
    const slimvUser = await env.login('slimv@example.com', 'festfinder123');
    assert.equal((await env.as(slimvUser).put('/me/follows/artists/slimv')).body.error.code, 'own_profile');
    const before = (await env.as().get('/artists/slimv')).body.artist.followers;
    await env.ctx.db.query(`update artists set name = 'Slim V' where slug = 'slimv'`);
    assert.equal((await env.as().get('/artists/slimv')).body.artist.followers, before, 'followers follow the profile, not the spelling');
    await env.ctx.db.query(`update artists set name = 'SlimV' where slug = 'slimv'`);
  });

  it('a follow made by name joins the profile at boot, and a claim takes over follows and Smart Alerts of the name', async () => {
    const minhId = (await one<{ id: string }>(env.ctx.db, `select id from users where email = 'minh@example.com'`))!.id;
    const legacy = await one<any>(env.ctx.db, `select artist_id from artist_follows where user_id = $1 and artist = 'Hoaprox'`, [minhId]);
    assert.ok(legacy.artist_id, 'the seed follow by name was linked to the Hoaprox record');

    // Someone asks to be told about DJ Mie (unclaimed); DJ Mie takes over the profile.
    const fan = await emailUser(env, 'mie-fan@example.com');
    const fanId = (await one<{ id: string }>(env.ctx.db, `select id from users where email = 'mie-fan@example.com'`))!.id;
    await env.ctx.db.query(`insert into smart_alerts (user_id, enabled, artists) values ($1, true, '{DJ Mie}') on conflict (user_id) do update set artists = '{DJ Mie}'`, [fanId]);
    const mie = await one<{ id: string }>(env.ctx.db, `select id from artists where slug = 'dj-mie'`);
    const owner = await emailUser(env, 'dj-mie-herself@example.com');
    const claim = await env.as(owner).post('/me/roles/artist', { claimArtistId: mie!.id, note: 'Me', proofUrl: 'https://instagram.com/djmie' });
    assert.ok(claim.status < 300, JSON.stringify(claim.body));
    const pending = await one<{ id: string }>(env.ctx.db, `select id from artist_claims where artist_id = $1 and status = 'pending'`, [mie!.id]);
    const admin = await env.admin();
    const decided = await env.as(admin).post(`/admin/profile-claims/artist/${pending!.id}/decision`, { approve: true });
    assert.equal(decided.status, 200, JSON.stringify(decided.body));
    assert.ok(await one(env.ctx.db, 'select 1 from artist_follows where user_id = $1 and artist_id = $2', [fanId, mie!.id]), 'the alert became a follow');
    const alerts = await one<any>(env.ctx.db, 'select artists from smart_alerts where user_id = $1', [fanId]);
    assert.deepEqual(alerts.artists, []);
    assert.equal((await env.as().get('/artists/dj-mie')).body.artist.kind, 'owned');
    assert.ok((await env.as().get('/artists?limit=60')).body.items.some((a: any) => a.slug === 'dj-mie'), 'now in the directory');
    void fan;
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

  it('gives a claimed profile with no show yet a page, kept out of search results', async () => {
    const token = await emailUser(env, 'first.timer@example.com');
    await env.as(token).post('/me/roles/artist', { stageName: 'First Timer', styles: ['hard-techno'] });
    const seo = await env.as().get('/seo/artists/first-timer');
    assert.equal(seo.status, 200, JSON.stringify(seo.body));
    assert.equal(seo.body.robots, 'noindex, follow');
    assert.match(seo.body.page.kicker, /Hard techno/i);
    const lone = await ensureArtists(env.ctx.db, ['Never Claimed']);
    assert.ok(lone.size);
    assert.equal((await env.as().get('/seo/artists/never-claimed')).status, 404, 'a name nobody claimed and no event lists has no page');
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
