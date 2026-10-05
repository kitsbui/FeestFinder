import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { REPORTS_PER_DAY } from '../src/services/ingest/report.ts';

describe('gigs an artist reports', () => {
  let env: TestEnv;
  let artist: string;
  let fan: string;
  let ravo: any;
  before(async () => {
    env = await setup();
    artist = await emailUser(env, 'night.owl@example.com');
    fan = await emailUser(env, 'just.a.fan@example.com');
    await env.as(artist).post('/me/roles/artist', { stageName: 'Night Owl', roles: ['dj'], basedCity: 'ho-chi-minh' });
    ravo = (await env.as().get('/events/ravo')).body;
  });
  after(async () => { await env.close(); });

  const future = (days: number) => new Date(env.clock.now().getTime() + days * 86400_000).toISOString().slice(0, 10);

  it('needs an artist profile', async () => {
    const res = await env.as(fan).post('/me/artist/gigs', { title: 'Warehouse night', startsOn: future(10), city: 'ho-chi-minh', venueName: 'Lot 9' });
    assert.equal(res.status, 404);
    assert.equal((await env.as().post('/me/artist/gigs', {})).status, 401);
  });

  it('a gig nobody listed waits in the review queue, held by the community, not published', async () => {
    const res = await env.as(artist).post('/me/artist/gigs', {
      title: 'Night Owl all night long', startsOn: future(12), startTime: '22:00', city: 'ho-chi-minh', venueName: 'The Observatory', with: ['Mie'],
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.outcome, 'created');
    assert.equal(res.body.event.status, 'in_review');
    const ev = await env.ctx.db.query<any>('select e.status, e.published_at, e.lineup, o.is_community from events e join organizers o on o.id = e.organizer_id where e.id = $1', [res.body.event.id]);
    assert.equal(ev.rows[0].published_at, null);
    assert.equal(ev.rows[0].is_community, true);
    assert.deepEqual(ev.rows[0].lineup, ['Night Owl', 'Mie']);
    const src = await env.ctx.db.query<any>('select provider, authority from event_sources where event_id = $1', [res.body.event.id]);
    assert.deepEqual(src.rows.map((r) => [r.provider, r.authority]), [['artist', 'community']], 'an artist report weighs what a community submission does');
    assert.equal((await env.as().get(`/events/${res.body.event.slug}`)).status, 404, 'the public cannot see it yet');
  });

  it('a gig already listed gets a source, without putting the artist on the organiser lineup', async () => {
    const before = await env.ctx.db.query<any>('select lineup, title from events where slug = $1', ['ravo']);
    const res = await env.as(artist).post('/me/artist/gigs', {
      title: ravo.title, startsOn: ravo.startsOn, startTime: ravo.startTime, city: ravo.city, venueName: ravo.venue?.name ?? ravo.venueName,
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.outcome, 'merged');
    assert.equal(res.body.event.slug, 'ravo');
    assert.equal(res.body.onLineup, false);
    const after = await env.ctx.db.query<any>('select lineup, title, status from events where slug = $1', ['ravo']);
    assert.deepEqual(after.rows[0].lineup, before.rows[0].lineup, 'an organiser lineup is theirs to change');
    assert.equal(after.rows[0].status, 'live');
    const mine = (await env.as(artist).get('/me/artist/gigs')).body.items.find((x: any) => x.event?.slug === 'ravo');
    assert.equal(mine.outcome, 'merged');
    assert.equal(mine.onLineup, false);
  });

  it('turns down past dates and cities FeestFinder does not list, and limits how many a day', async () => {
    const past = await env.as(artist).post('/me/artist/gigs', { title: 'Old night', startsOn: '2020-01-01', city: 'ho-chi-minh', venueName: 'Somewhere' });
    assert.equal(past.body.error.code, 'gig_past');
    assert.equal((await env.as(artist).post('/me/artist/gigs', { title: 'Far away', startsOn: future(5), city: 'atlantis', venueName: 'X' })).status, 400);
    const sent = (await env.ctx.db.query<any>('select count(*)::int as n from artist_gig_reports')).rows[0].n;
    for (let i = sent; i < REPORTS_PER_DAY; i++) {
      await env.as(artist).post('/me/artist/gigs', { title: `Night ${i}`, startsOn: future(20 + i), city: 'ho-chi-minh', venueName: `Club ${i}` });
    }
    const over = await env.as(artist).post('/me/artist/gigs', { title: 'One more', startsOn: future(40), city: 'ho-chi-minh', venueName: 'Club Z' });
    assert.equal(over.status, 429);
  });
});
