import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { matchScore, MATCH_WEIGHTS } from '../src/services/gigs.ts';

describe('the gig marketplace', () => {
  let env: TestEnv;
  let org: string;
  let fit: string;
  let far: string;
  let fan: string;
  let gig: any;
  before(async () => {
    env = await setup();
    org = await env.organizer();
    fit = await emailUser(env, 'fit.dj@example.com');
    far = await emailUser(env, 'far.dj@example.com');
    fan = await emailUser(env, 'gig.fan@example.com');
    await env.as(fit).post('/me/roles/artist', { stageName: 'Fit DJ', roles: ['dj'], basedCity: 'ho-chi-minh', styles: ['hard-techno'] });
    await env.as(fit).patch('/me/artist', { gigTypes: ['club'], bookingStatus: 'available' });
    await env.as(far).post('/me/roles/artist', { stageName: 'Far DJ', roles: ['dj'], basedCity: 'tokyo', styles: ['deep-house'] });
  });
  after(async () => { await env.close(); });

  const future = (days: number) => new Date(env.clock.now().getTime() + days * 86400_000).toISOString().slice(0, 10);

  it('scores fit from fixed rules that add up to 100, with nothing about followers', () => {
    assert.equal(Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0), 100);
    const g = { city: 'ho-chi-minh', starts_on: '2027-01-10', styles: ['hard-techno'], gig_type: 'club' };
    const best = matchScore({ styles: ['hard-techno'], based_city: 'ho-chi-minh', based_country: 'VN', travel_scope: 'local', gig_types: ['club'], booking_status: 'available' }, g,
      [{ from_on: '2027-01-01', to_on: '2027-01-31', kind: 'available', city: null }]);
    assert.equal(best.score, 100);
    const away = matchScore({ styles: ['hard-techno'], based_city: 'ho-chi-minh', based_country: 'VN', travel_scope: 'local', gig_types: ['club'], booking_status: 'available' }, g,
      [{ from_on: '2027-01-09', to_on: '2027-01-11', kind: 'unavailable', city: null }]);
    assert.equal(away.unavailable, true);
    assert.equal(away.because.availability, 0);
  });

  it('lets an organiser post a gig in its city’s currency, and not in the past', async () => {
    assert.equal((await env.as(fan).post('/organizer/gigs', { title: 'Warm-up slot', city: 'ho-chi-minh', startsOn: future(20) })).status, 403);
    assert.equal((await env.as(org).post('/organizer/gigs', { title: 'Old slot', city: 'ho-chi-minh', startsOn: '2020-01-01' })).body.error.code, 'past_date');
    assert.equal((await env.as(org).post('/organizer/gigs', { title: 'Bad fee', city: 'ho-chi-minh', startsOn: future(20), feeMin: 10, feeMax: 5 })).body.error.code, 'fee_range');
    const res = await env.as(org).post('/organizer/gigs', {
      title: 'Hard techno warm-up', city: 'ho-chi-minh', startsOn: future(20), styles: ['hard-techno'], gigType: 'club', setLength: '90', feeMin: 3000000, feeMax: 5000000,
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.currency, 'VND');
    gig = res.body;
  });

  it('shows artists the best fit first, takes applications once, and the organiser sees them by fit', async () => {
    const list = (await env.as(fit).get('/gigs')).body.items;
    const mine = list.find((g: any) => g.id === gig.id);
    assert.ok(mine.match.score >= 80, JSON.stringify(mine.match));
    assert.equal((await env.as().get('/gigs')).status, 401);
    assert.equal((await env.as(fan).post(`/gigs/${gig.id}/apply`, {})).status, 404, 'needs an artist profile');
    const a1 = await env.as(fit).post(`/gigs/${gig.id}/apply`, { message: 'Hard techno is my thing.' });
    assert.equal(a1.status, 201, JSON.stringify(a1.body));
    assert.equal((await env.as(fit).post(`/gigs/${gig.id}/apply`, { message: 'Again' })).status, 200, 'applying twice updates the one application');
    await env.as(far).post(`/gigs/${gig.id}/apply`, {});
    const apps = (await env.as(org).get(`/organizer/gigs/${gig.id}/applications`)).body.items;
    assert.deepEqual(apps.map((x: any) => x.artist.name), ['Fit DJ', 'Far DJ']);
    assert.ok(apps[0].matchScore > apps[1].matchScore);
    const note = await env.ctx.db.query<any>(`select count(*)::int as n from notifications where kind = 'gig'`);
    assert.equal(note.rows[0].n, 2, 'the organiser hears about each new application once');
  });

  it('books an artist, fills the gig and tells them', async () => {
    const apps = (await env.as(org).get(`/organizer/gigs/${gig.id}/applications`)).body.items;
    const res = await env.as(org).post(`/organizer/gigs/${gig.id}/applications/${apps[0].id}`, { status: 'booked' });
    assert.equal(res.body.status, 'booked');
    assert.equal((await env.as(org).get('/organizer/gigs')).body.items.find((g: any) => g.id === gig.id).status, 'filled');
    const mine = (await env.as(fit).get('/me/artist/applications')).body.items;
    assert.deepEqual([mine[0].status, mine[0].gig.title], ['booked', 'Hard techno warm-up']);
    assert.equal((await env.as(fit).post(`/gigs/${gig.id}/apply`, {})).body.error.code, 'gig_closed');
    const told = await env.ctx.db.query<any>(`select n.title from notifications n join users u on u.id = n.user_id where u.email = 'fit.dj@example.com' and n.kind = 'gig_application'`);
    assert.equal(told.rows.length, 1);
  });

  it('sends a booking request to a claimed artist, who answers once', async () => {
    const fitId = (await env.ctx.db.query<any>(`select id from artists where slug = 'fit-dj'`)).rows[0].id;
    const hoaprox = (await env.ctx.db.query<any>(`select id from artists where slug = 'hoaprox'`)).rows[0].id;
    assert.equal((await env.as(org).post('/organizer/inquiries', { artistId: hoaprox, eventOn: future(30), city: 'ho-chi-minh', message: 'Would you play our NYE party?' })).body.error.code, 'not_claimed');
    const sent = await env.as(org).post('/organizer/inquiries', { artistId: fitId, eventOn: future(30), city: 'ha-noi', message: 'Would you play our NYE party?', feeOffer: 8000000 });
    assert.equal(sent.status, 201, JSON.stringify(sent.body));
    const inbox = (await env.as(fit).get('/me/artist/inquiries')).body.items;
    assert.equal(inbox[0].organizer.slug, 'ravoent');
    assert.equal(inbox[0].currency, 'VND');
    assert.equal((await env.as(fit).post(`/me/artist/inquiries/${inbox[0].id}`, { accept: true, reply: 'Yes, let us talk.' })).body.status, 'accepted');
    assert.equal((await env.as(fit).post(`/me/artist/inquiries/${inbox[0].id}`, { accept: false })).status, 409);
    assert.equal((await env.as(org).get('/organizer/inquiries')).body.items[0].reply, 'Yes, let us talk.');
  });

  it('sends gig alerts under their own topic, which the organiser can switch off alone', async () => {
    const prefs = (await env.as(org).get('/organizer/notification-preferences')).body.topics;
    assert.equal(prefs.find((t: any) => t.key === 'bookings').enabled, true);
    assert.equal((await env.as(org).put('/organizer/notification-preferences', { bookings: false })).status, 200);
    const g3 = (await env.as(org).post('/organizer/gigs', { title: 'Third slot', city: 'ho-chi-minh', startsOn: future(50) })).body;
    const before = (await env.ctx.db.query<any>(`select count(*)::int as n from notifications where kind = 'gig'`)).rows[0].n;
    await env.as(far).post(`/gigs/${g3.id}/apply`, {});
    assert.equal((await env.ctx.db.query<any>(`select count(*)::int as n from notifications where kind = 'gig'`)).rows[0].n, before);
    assert.equal((await env.as(org).get('/organizer/notification-preferences')).body.topics.find((t: any) => t.key === 'moderation').enabled, true);
    await env.as(org).put('/organizer/notification-preferences', { bookings: true });
  });

  it('keeps availability windows, and a busy date lowers the fit', async () => {
    const g2 = (await env.as(org).post('/organizer/gigs', { title: 'Second slot', city: 'ho-chi-minh', startsOn: future(40), styles: ['hard-techno'], gigType: 'club' })).body;
    const before = (await env.as(fit).get('/gigs')).body.items.find((g: any) => g.id === g2.id).match.score;
    assert.equal((await env.as(fit).put('/me/artist/availability', { items: [{ from: future(39), to: future(41), kind: 'unavailable' }] })).status, 200);
    const after = (await env.as(fit).get('/gigs')).body.items.find((g: any) => g.id === g2.id).match;
    assert.ok(after.score < before && after.unavailable);
    assert.equal((await env.as(fit).get('/me/artist/availability')).body.items.length, 1);
    const page = (await env.as().get('/artists/fit-dj')).body;
    assert.deepEqual(page.availability.map((w: any) => [w.from, w.kind]), [[future(39), 'unavailable']], 'the artist page shows dates to come');
    assert.ok(!('note' in page.availability[0]), 'notes stay private');
    assert.equal((await env.as(fit).put('/me/artist/availability', { items: [{ from: future(5), to: future(1), kind: 'available' }] })).body.error.code, 'bad_window');
  });
});
