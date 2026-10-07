import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { classifyStyles, genreFromStyles } from '../src/lib/styles.ts';
import { ensureArtists } from '../src/services/artists.ts';

describe('the artist network', () => {
  let env: TestEnv;
  let admin: string;
  let owner: string;
  before(async () => {
    env = await setup();
    admin = await env.admin();
    owner = await emailUser(env, 'dj.owner@example.com');
    await env.as(owner).post('/me/roles/artist', { stageName: 'Mây Đêm', roles: ['dj'], basedCity: 'bangkok', styles: ['hard-techno'] });
  });
  after(async () => { await env.close(); });

  it('lists artists who play soonest first, then fuller profiles, never by followers', async () => {
    const all = await env.as().get('/artists?limit=60');
    assert.equal(all.status, 200, JSON.stringify(all.body));
    const slugs = all.body.items.map((a: any) => a.slug);
    const firstWithout = all.body.items.findIndex((a: any) => a.upcoming === 0);
    assert.ok(firstWithout > 0 && all.body.items.slice(firstWithout).every((a: any) => a.upcoming === 0), 'those with a show come first');
    assert.ok(slugs.includes('may-dem'), 'a claimed profile is listed without any event yet');
    assert.equal(all.body.total, all.body.items.length);
    const hoaprox = all.body.items.find((a: any) => a.slug === 'hoaprox');
    assert.equal(hoaprox.nextShow.slug, 'ravo');
    assert.equal(typeof hoaprox.genre, 'string', 'the genre they play most colours their card');
    assert.equal(all.body.items.find((a: any) => a.slug === 'may-dem').genre, null);
    assert.ok(all.body.filters.roles.some((r: any) => r.key === 'dj'));
  });

  it('filters by role, style, city, travel and upcoming shows', async () => {
    const djs = await env.as().get('/artists?role=dj');
    assert.deepEqual(djs.body.items.map((a: any) => a.slug), ['may-dem']);
    const hard = await env.as().get('/artists?style=hard-techno');
    assert.deepEqual(hard.body.items.map((a: any) => a.slug), ['may-dem']);
    const bkk = await env.as().get('/artists?city=bangkok');
    assert.deepEqual(bkk.body.items.map((a: any) => a.slug), ['may-dem']);
    const hcm = await env.as().get('/artists?city=ho-chi-minh&upcoming=1');
    assert.ok(hcm.body.items.length > 0 && hcm.body.items.every((a: any) => a.upcoming > 0));
    await env.as(owner).patch('/me/artist', { travelScope: 'asia', bookingStatus: 'available' });
    assert.deepEqual((await env.as().get('/artists?travel=southeast_asia')).body.items.map((a: any) => a.slug), ['may-dem'], 'Asia covers Southeast Asia');
    assert.equal((await env.as().get('/artists?travel=worldwide')).body.items.length, 0);
    assert.deepEqual((await env.as().get('/artists?booking=available')).body.items.map((a: any) => a.slug), ['may-dem']);
    assert.deepEqual((await env.as().get('/artists?q=may dem')).body.items.map((a: any) => a.slug), ['may-dem'], 'without accents');
    assert.equal((await env.as().get('/artists?style=polka')).status, 400);
  });

  it('lets the owner edit their profile, with links on the right sites and old names kept', async () => {
    const bad = await env.as(owner).patch('/me/artist', { links: { spotify: 'https://evil.example/track' } });
    assert.equal(bad.body.error.code, 'invalid_link');
    const ok = await env.as(owner).patch('/me/artist', {
      name: 'May Dem', bio: { en: 'Hard techno from Bangkok.', vi: 'Hard techno từ Bangkok.' },
      links: { spotify: 'http://open.spotify.com/artist/abc', instagram: 'https://www.instagram.com/maydem' },
      gigTypes: ['club', 'rave'], setLengths: ['120'], languages: ['vi', 'en'], activeSince: 2019,
    });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.profile.links.spotify, 'https://open.spotify.com/artist/abc');
    assert.deepEqual(ok.body.profile.aliases, ['Mây Đêm'], 'the old spelling stays an alias');
    const taken = await env.as(owner).patch('/me/artist', { name: 'Hoaprox' });
    assert.equal(taken.body.error.code, 'name_taken');
    const page = (await env.as(owner).get('/artists/may-dem')).body;
    assert.deepEqual([page.artist.editable, page.artist.basedIn.city, page.artist.booking.key, page.artist.links.map((l: any) => l.kind)], [true, 'bangkok', 'available', ['spotify', 'instagram']]);
    assert.equal((await env.as().get('/artists/may-dem')).body.artist.editable, false);
    assert.equal((await env.as(await env.attendee()).patch('/me/artist', { name: 'X' })).status, 404, 'no profile, nothing to edit');
  });

  it('shows the organisers, venues and lineups an artist shares, each with the events behind it', async () => {
    const r = (await env.as().get('/artists/hoaprox')).body.relationships;
    assert.equal(r.organizers[0].slug, 'ravoent');
    assert.equal(r.organizers[0].events, 2);
    assert.deepEqual(r.organizers[0].examples.map((e: any) => e.slug), ['ravo', 'ravo-2025']);
    assert.ok(r.venues[0].name.startsWith('SECC'));
    assert.ok(r.sharedLineups.some((a: any) => a.slug === 'dj-mie'));
    const mie = r.similar.find((a: any) => a.slug === 'dj-mie');
    assert.ok(mie.score > 0 && mie.because.sharedLineups > 0 && mie.because.organizers > 0, JSON.stringify(mie));
    assert.equal(Object.values(mie.because).reduce((a: any, b: any) => a + b, 0), mie.score, 'the score is its reasons added up');
  });

  it('lets the team verify an artist and add the other names lineups use', async () => {
    const mie = (await env.as(admin).get('/admin/artists?q=mie')).body.items.find((a: any) => a.slug === 'dj-mie');
    const res = await env.as(admin).patch(`/admin/artists/${mie.id}`, { verified: true, aliases: ['Mie', 'Mie DJ'] });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const ids = await ensureArtists(env.ctx.db, ['MIE']);
    assert.equal(ids.get('mie'), mie.id, 'a lineup that writes "MIE" links to DJ Mie');
    assert.deepEqual((await env.as().get('/artists?verified=1')).body.items.map((a: any) => a.slug), ['dj-mie']);
    assert.equal((await env.as(owner).patch(`/admin/artists/${mie.id}`, { verified: true })).status, 403);
  });

  it('files metal and punk under Rock, apart from Indie', () => {
    assert.deepEqual(classifyStyles({ tags: ['Death Metal'] }), ['death-metal']);
    assert.equal(genreFromStyles(['death-metal']), 'Rock');
    assert.deepEqual(classifyStyles({ title: 'Saigon Pop Punk Night' }), ['pop-punk']);
    assert.deepEqual(classifyStyles({ tags: ['Indie Rock'] }), ['indie-rock']);
    assert.equal(genreFromStyles(['indie']), 'Indie');
  });
});

describe('the organiser network', () => {
  let env: TestEnv;
  let org: string;
  before(async () => { env = await setup(); org = await env.organizer(); });
  after(async () => { await env.close(); });

  it('shows the artists and venues an organiser has worked with, and where it runs events', async () => {
    const o = (await env.as().get('/organizers/ravoent')).body;
    assert.ok(o.artists.some((a: any) => a.slug === 'hoaprox' && a.events >= 1));
    assert.ok(o.venues.length > 0);
    assert.deepEqual(o.markets.map((m: any) => m.slug), ['ho-chi-minh']);
    assert.equal(o.typeLabel.en, 'Promoter');
    assert.equal(o.openForSubmissions, false);
  });

  it('lets the organiser describe its markets, styles and channels, and say it takes submissions', async () => {
    const bad = await env.as(org).patch('/organizer/profile', { links: { instagram: 'https://example.com/ravo' } });
    assert.equal(bad.body.error.code, 'invalid_link');
    const ok = await env.as(org).patch('/organizer/profile', {
      type: 'festival', markets: ['ho-chi-minh', 'ha-noi'], styles: ['hard-techno', 'trance'], openForSubmissions: true,
      links: { instagram: 'https://instagram.com/ravolution' },
    });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    const o = (await env.as().get('/organizers/ravoent')).body;
    assert.deepEqual([o.type, o.markets.map((m: any) => m.slug), o.styles.slice(0, 2).map((s: any) => s.key), o.openForSubmissions, o.links[0].kind],
      ['festival', ['ho-chi-minh', 'ha-noi'], ['hard-techno', 'trance'], true, 'instagram']);
    const seo = (await env.as().get('/seo/organizers/ravoent')).body;
    const graphOrg = seo.jsonLd['@graph'].find((n: any) => n['@type'] === 'Organization' && String(n['@id']).endsWith('/o/ravoent#organization'));
    assert.ok(graphOrg.sameAs.includes('https://instagram.com/ravolution'));
    assert.ok(seo.page.facts.some((f: any) => f.label === 'Nghệ sĩ đã hợp tác' && f.value.includes('Hoaprox')));
  });
});

describe('artist directory pages for search engines', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  it('serves the directory and curated style and city pages, indexed only when they list enough artists', async () => {
    const all = await env.as().get('/seo/directory/all');
    assert.equal(all.status, 200);
    assert.equal(all.body.robots.startsWith('index'), true);
    assert.ok(all.body.jsonLd['@graph'].some((n: any) => n['@type'] === 'ItemList' && n.itemListElement.some((i: any) => i.url.endsWith('/a/hoaprox'))));
    const city = await env.as().get('/seo/directory/city:ho-chi-minh?lang=en');
    assert.match(city.body.page.h1, /^Artists in Ho Chi Minh City$/);
    const thin = await env.as().get('/seo/directory/style:visual-kei');
    assert.equal(thin.body.robots, 'noindex, follow');
    assert.equal((await env.as().get('/seo/directory/style:polka')).status, 404);
    assert.equal((await env.as().get('/seo/directory/city:paris')).status, 404);
    const md = await env.as().get('/a/city/ho-chi-minh.md');
    assert.match(md.body, /^# Nghệ sĩ ở TP\.HCM/);
    const html = await env.as().get('/a', { accept: 'text/html' });
    assert.match(html.body, /<link rel="canonical" href="http:\/\/test\.local\/a">/);
    const map = (await env.as().get('/sitemap.xml')).body;
    assert.match(map, /\/a<\/loc>/);
    assert.match(map, /\/a\/city\/ho-chi-minh<\/loc>/);
    assert.doesNotMatch(map, /\/a\/style\/visual-kei</);
  });

  it('gives an artist page the profile’s own channels once someone owns it', async () => {
    const before = (await env.as().get('/seo/artists/hoaprox')).body.jsonLd['@graph'].find((n: any) => n['@type'] === 'MusicGroup');
    assert.equal(before.sameAs, undefined);
    await env.ctx.db.query(`update artists set links = '{"instagram":"https://instagram.com/hoaprox"}', verified = true where slug = 'hoaprox'`);
    const after_ = (await env.as().get('/seo/artists/hoaprox')).body.jsonLd['@graph'].find((n: any) => n['@type'] === 'MusicGroup');
    assert.deepEqual(after_.sameAs, ['https://instagram.com/hoaprox']);
  });
});
