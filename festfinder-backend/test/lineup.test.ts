import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { many, one } from '../src/db/index.ts';

/*
 * The lineup handshake (D13, migration 041): a profile an artist runs is the official one for its
 * name; listing it asks the artist to confirm, an artist's report on someone's night asks the
 * organiser to add them, and nobody lands on a lineup without the other side.
 */

describe('the lineup handshake', () => {
  let env: TestEnv;
  let organizer: string;
  let artist: string;
  let artistUserId: string;
  let artistId: string;
  before(async () => {
    env = await setup();
    organizer = await env.organizer();
    artist = await emailUser(env, 'ngoc.nhip@example.com');
    const made = await env.as(artist).post('/me/roles/artist', { stageName: 'Ngọc Nhịp', roles: ['dj'] });
    assert.ok(made.status < 300, JSON.stringify(made.body));
    artistUserId = (await one<{ id: string }>(env.ctx.db, `select id from users where email = 'ngoc.nhip@example.com'`))!.id;
    artistId = (await one<{ id: string }>(env.ctx.db, 'select id from artists where owner_user_id = $1', [artistUserId]))!.id;
  });
  after(async () => { await env.close(); });

  const notes = (kind: string, userId = artistUserId) => many<any>(env.ctx.db, 'select title, link from notifications where user_id = $1 and kind = $2', [userId, kind]);

  /** A listing of Ravolution's copied from Warm-up, with this lineup, sent for review. */
  async function listing(lineup: string[]) {
    const src = (await one<{ id: string }>(env.ctx.db, `select id from events where slug = 'ravo-warmup'`))!.id;
    const copy = (await env.as(organizer).post(`/organizer/events/${src}/duplicate`)).body;
    await env.as(organizer).patch(`/organizer/events/${copy.id}`, { startsOn: '2026-10-24', endsOn: '2026-10-24', lineup });
    const sent = await env.as(organizer).post(`/organizer/events/${copy.id}/submit`);
    assert.equal(sent.status, 200, JSON.stringify(sent.body));
    return copy.id as string;
  }

  it('listing an artist who runs their profile asks them once; confirming puts the show on their profile', async () => {
    const id = await listing(['Ngọc Nhịp', 'Someone Else']);
    await env.as(organizer).patch(`/organizer/events/${id}`, { lineup: ['Ngọc Nhịp', 'Someone Else', 'A Third'] });
    const asked = await notes('lineup_added');
    assert.equal(asked.length, 1, 'once, however often the lineup is saved');
    assert.match(asked[0].title.vi, /đã đưa bạn vào lineup/);
    const mine = (await env.as(artist).get('/me/artist/lineup')).body.items.find((x: any) => x.event.id === id);
    assert.equal(mine.confirmed, false);

    // The team publishes it; still unconfirmed, it is not on the profile.
    const admin = await env.admin();
    await env.as(admin).post('/admin/listings/approve', { ids: [id] });
    const slug = (await one<{ slug: string }>(env.ctx.db, 'select slug from artists where id = $1', [artistId]))!.slug;
    assert.ok(!(await env.as().get(`/artists/${slug}`)).body.upcoming.some((c: any) => c.id === id), 'an unconfirmed show stays off the profile');
    assert.equal((await env.as(artist).post(`/me/artist/lineup/${id}/confirm`)).status, 200);
    const row = await one<any>(env.ctx.db, 'select confirmed_by from event_artists where event_id = $1 and artist_id = $2', [id, artistId]);
    assert.equal(row.confirmed_by, 'artist');
    assert.ok((await env.as().get(`/artists/${slug}`)).body.upcoming.some((c: any) => c.id === id), 'confirmed: on the profile');
    // An edit of the lineup keeps the confirmation.
    await env.as(organizer).patch(`/organizer/events/${id}`, { lineup: ['A Third', 'Ngọc Nhịp'] });
    assert.ok((await one<any>(env.ctx.db, 'select confirmed_at from event_artists where event_id = $1 and artist_id = $2', [id, artistId])).confirmed_at);
  });

  it('"Không phải tôi" unlinks the profile, keeps the name, tells the organiser, and an edit does not link it again', async () => {
    const id = await listing(['Ngọc Nhịp']);
    const out = await env.as(artist).post(`/me/artist/lineup/${id}/dispute`, { note: 'Another DJ with my name' });
    assert.equal(out.status, 200, JSON.stringify(out.body));
    assert.equal(await one(env.ctx.db, 'select 1 from event_artists where event_id = $1 and artist_id = $2', [id, artistId]), null);
    assert.deepEqual((await one<any>(env.ctx.db, 'select artists from events where id = $1', [id])).artists, ['Ngọc Nhịp'], 'the name stays on the lineup');
    const orgId = (await one<{ id: string }>(env.ctx.db, `select id from organizers where slug = 'ravoent'`))!.id;
    const told = await many<any>(env.ctx.db, `select title from notifications where organizer_id = $1 and kind = 'gig'`, [orgId]);
    assert.ok(told.some((n) => /không diễn ở/.test(n.title.vi)));
    await env.as(organizer).patch(`/organizer/events/${id}`, { lineup: ['Ngọc Nhịp', 'B2B Guest'] });
    assert.equal(await one(env.ctx.db, 'select 1 from event_artists where event_id = $1 and artist_id = $2', [id, artistId]), null, 'not linked again');
  });

  it('an artist who says they play an organiser’s night asks the organiser; accepting puts them on the lineup, both confirmed', async () => {
    const ravo = (await one<any>(env.ctx.db, `select id, title, starts_on::text as starts_on, city, venue_name from events where slug = 'ravo'`))!;
    const report = await env.as(artist).post('/me/artist/gigs', { title: ravo.title, startsOn: ravo.starts_on, startTime: '16:00', city: ravo.city, venueName: ravo.venue_name });
    assert.equal(report.status, 200, JSON.stringify(report.body));
    assert.equal(report.body.outcome, 'merged');
    assert.equal(report.body.onLineup, false, 'a report never adds the artist by itself');
    const claims = (await env.as(organizer).get('/organizer/lineup-claims')).body.items;
    const claim = claims.find((c: any) => c.artist.id === artistId && c.event.id === ravo.id);
    assert.ok(claim, 'the organiser sees it');
    assert.equal((await env.as(organizer).post(`/organizer/lineup-claims/${claim.id}/accept`)).status, 200);
    const row = await one<any>(env.ctx.db, 'select confirmed_by from event_artists where event_id = $1 and artist_id = $2', [ravo.id, artistId]);
    assert.equal(row.confirmed_by, 'both');
    assert.ok((await one<any>(env.ctx.db, 'select artists from events where id = $1', [ravo.id])).artists.includes('Ngọc Nhịp'));
    assert.equal((await notes('lineup_accepted')).length, 1);
    assert.ok(!(await env.as(organizer).get('/organizer/lineup-claims')).body.items.some((c: any) => c.id === claim.id), 'answered');
  });

  it('declining a report tells the artist, and the report is closed', async () => {
    const hozo = (await one<any>(env.ctx.db, `select id, title, starts_on::text as starts_on, city, venue_name, organizer_id from events where slug = 'hozo'`))!;
    const report = await env.as(artist).post('/me/artist/gigs', { title: hozo.title, startsOn: hozo.starts_on, city: hozo.city, venueName: hozo.venue_name });
    assert.equal(report.body.outcome, 'merged');
    // Ravolution cannot answer for HOZO's night.
    const g = await one<{ id: string }>(env.ctx.db, 'select id from artist_gig_reports where artist_id = $1 and event_id = $2', [artistId, hozo.id]);
    assert.equal((await env.as(organizer).post(`/organizer/lineup-claims/${g!.id}/decline`, {})).status, 404);
    // As HOZO's organiser (made one for this test).
    const member = await emailUser(env, 'hozo.staff@example.com');
    const memberId = (await one<{ id: string }>(env.ctx.db, `select id from users where email = 'hozo.staff@example.com'`))!.id;
    await env.ctx.db.query(`insert into organizer_members (organizer_id, user_id, role) values ($1,$2,'manager')`, [hozo.organizer_id, memberId]);
    await env.ctx.db.query(`insert into user_roles (user_id, role, status) values ($1,'organizer','active') on conflict (user_id, role) do update set status = 'active'`, [memberId]);
    const declined = await env.as(member).post(`/organizer/lineup-claims/${g!.id}/decline`, { reason: 'Not booked for this one' });
    assert.equal(declined.status, 200, JSON.stringify(declined.body));
    assert.equal((await one<any>(env.ctx.db, 'select outcome from artist_gig_reports where id = $1', [g!.id])).outcome, 'rejected');
    assert.equal((await notes('lineup_declined')).length, 1);
  });

  it('taking over a name already on lineups to come: one notice with how many, and the organisers hear', async () => {
    const someone = await emailUser(env, 'wukong.real@example.com');
    const wukong = (await one<{ id: string }>(env.ctx.db, `select id from artists where slug = 'wukong'`))!.id;
    const shows = (await one<{ n: number }>(env.ctx.db,
      `select count(*)::int as n from event_artists ea join events e on e.id = ea.event_id where ea.artist_id = $1 and e.status = 'live' and e.ends_at >= $2`, [wukong, env.clock.now()]))!.n;
    assert.ok(shows > 0);
    await env.as(someone).post('/me/roles/artist', { claimArtistId: wukong, note: 'Me', proofUrl: 'https://instagram.com/wukong' });
    const claim = await one<{ id: string }>(env.ctx.db, `select id from artist_claims where artist_id = $1 and status = 'pending'`, [wukong]);
    const admin = await env.admin();
    assert.equal((await env.as(admin).post(`/admin/profile-claims/artist/${claim!.id}/decision`, { approve: true })).status, 200);
    const uid = (await one<{ id: string }>(env.ctx.db, `select id from users where email = 'wukong.real@example.com'`))!.id;
    const pending = await notes('lineup_pending', uid);
    assert.equal(pending.length, 1);
    assert.match(pending[0].title.vi, new RegExp(`Có ${shows} show`));
    assert.equal((await env.as().get('/artists?kind=unclaimed&limit=60')).body.items.some((a: any) => a.slug === 'wukong'), false, 'out of the unclaimed list');
  });

  it('a name Radar finds that an artist runs points at their profile, never the unclaimed list', async () => {
    const { syncEventArtists } = await import('../src/services/artists.ts');
    const ev = (await one<{ id: string }>(env.ctx.db, `select id from events where slug = 'hozo'`))!.id;
    await env.ctx.db.tx((q) => syncEventArtists(q, ev, ['NGỌC NHỊP', 'Mỹ Tâm']));
    assert.ok(await one(env.ctx.db, 'select 1 from event_artists where event_id = $1 and artist_id = $2', [ev, artistId]), 'any spelling points at the official profile');
    assert.equal((await env.as().get('/artists?kind=unclaimed&limit=60')).body.items.some((a: any) => a.id === artistId), false);
  });
});
