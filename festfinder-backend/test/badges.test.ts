import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { many, one } from '../src/db/index.ts';
import { awardAll, BADGE_CATALOGUE, progressFor } from '../src/services/badges.ts';
import { GENRE_FAMILIES } from '../src/lib/i18n.ts';

describe('badges', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  it('has no badge that counts followers, rates organisers or times their replies', () => {
    const codes = BADGE_CATALOGUE.map((b) => b.code).join(' ');
    assert.doesNotMatch(codes, /follow|rating|satisf|response|reply/);
    assert.deepEqual([...new Set(BADGE_CATALOGUE.map((b) => b.role))].sort(), ['artist', 'organizer', 'user']);
  });

  it('a fan earns from the nights they were there, once, and sees "new" only the first time', async () => {
    const token = await env.attendee();
    const me = (await env.as(token).get('/auth/session')).body.user;
    // Four nights already over, one of each family, each checked in on the site.
    const byGenre = await many<{ id: string; genre: string }>(env.ctx.db,
      `select distinct on (genre) id, genre from events where status = 'live' and starts_at <= $1 and genre = any($2::text[]) order by genre, starts_at`,
      [env.clock.now(), Object.values(GENRE_FAMILIES).flat()]);
    const past = Object.values(GENRE_FAMILIES).map((gs) => byGenre.find((e) => (gs as readonly string[]).includes(e.genre))).filter((e) => !!e);
    assert.equal(past.length, 4, 'the seed has a past night of each family');
    const before = await progressFor(env.ctx.db, 'user', me.id, env.clock.now());
    assert.ok(before.four_families < 4);
    for (const e of past) await env.ctx.db.query('insert into presence (user_id, event_id) values ($1, $2) on conflict do nothing', [me.id, e.id]);

    const first = await env.as(token).get('/me/badges');
    assert.equal(first.status, 200);
    const by = Object.fromEntries(first.body.items.map((b: any) => [b.code, b]));
    assert.equal(by.first.earned, true);
    assert.equal(by.first.isNew, true);
    assert.equal(by.four_families.earned, true, 'the new nights count');
    assert.equal(by.passport_10.earned, false);
    assert.ok(by.passport_10.value >= past.length && by.passport_10.value < 10);
    assert.equal(by.passport_10.ring, '10');
    assert.ok(by.first.rarityPct > 0);
    // Earned first, then the closest to done.
    const earnedAt = first.body.items.findIndex((b: any) => !b.earned);
    assert.ok(first.body.items.slice(earnedAt).every((b: any) => !b.earned));

    const again = await env.as(token).get('/me/badges');
    assert.equal(again.body.items.find((b: any) => b.code === 'first').isNew, false);
    const rows = await one<{ n: number }>(env.ctx.db, `select count(*)::int as n from badge_awards where subject_kind = 'user' and subject_id = $1 and code = 'first'`, [me.id]);
    assert.equal(rows!.n, 1);
    assert.equal((await env.as().get('/me/badges')).status, 401);
  });

  it('organiser and artist pages carry theirs, never marked new for visitors', async () => {
    const org = await env.as().get('/organizers/ravoent');
    const verified = org.body.badges.find((b: any) => b.code === 'verified');
    assert.equal(verified.earned, true);
    assert.ok(org.body.badges.every((b: any) => b.label.vi && b.rule.en && b.isNew === false));

    const shown = await one<{ slug: string }>(env.ctx.db,
      `select a.slug from artists a join event_artists ea on ea.artist_id = a.id join events e on e.id = ea.event_id where e.status = 'live' and not e.held_for_reports and e.published_at is not null limit 1`);
    const artist = await env.as().get('/artists/' + shown!.slug);
    assert.equal(artist.body.badges.find((b: any) => b.code === 'debut').earned, true);
    assert.ok(artist.body.badges.every((b: any) => b.isNew === false));
  });

  it('"Verified" goes with the verification', async () => {
    const admin = await env.admin();
    const id = (await env.as().get('/organizers/ravoent')).body.id;
    assert.equal((await env.as(admin).patch('/admin/organizers/' + id, { state: 'flagged' })).status, 200);
    const flagged = await env.as().get('/organizers/ravoent');
    assert.equal(flagged.body.badges.find((b: any) => b.code === 'verified').earned, false);
    assert.equal(await one(env.ctx.db, `select 1 from badge_awards where subject_kind = 'organizer' and subject_id = $1 and code = 'verified'`, [id]), null);
    assert.equal((await env.as(admin).patch('/admin/organizers/' + id, { state: 'verified' })).status, 200);
    assert.equal((await env.as().get('/organizers/ravoent')).body.badges.find((b: any) => b.code === 'verified').earned, true);
  });

  it('an artist’s shows count once they have happened, and closing counts events, not nights', async () => {
    const a = await one<{ id: string; name: string; event_id: string }>(env.ctx.db,
      `select a.id, a.name, e.id as event_id from artists a join event_artists ea on ea.artist_id = a.id join events e on e.id = ea.event_id
        where e.status = 'live' and not e.held_for_reports and e.published_at is not null and e.starts_at <= $1 order by e.starts_at limit 1`, [env.clock.now()]);
    // Before any show: listed (a debut), none played.
    const early = await progressFor(env.ctx.db, 'artist', a!.id, new Date('2000-01-01T00:00:00Z'));
    assert.ok(early.debut >= 1);
    assert.equal(early.shows_25, 0);
    assert.equal(early.touring, 0);

    const before = await progressFor(env.ctx.db, 'artist', a!.id, env.clock.now());
    const stage = await one<{ id: string }>(env.ctx.db, `insert into stages (event_id, name) values ($1, '{"en":"Late","vi":"Khuya"}') returning id`, [a!.event_id]);
    // The last set of three nights of the same event.
    for (const d of ['2000-01-01', '2000-01-02', '2000-01-03']) {
      await env.ctx.db.query(`insert into sets (event_id, stage_id, day, artist, starts_at, ends_at) values ($1, $2, $3, $4, $5, $6)`,
        [a!.event_id, stage!.id, d, a!.name, `${d}T22:00:00Z`, `${d}T23:30:00Z`]);
    }
    const after = await progressFor(env.ctx.db, 'artist', a!.id, env.clock.now());
    assert.ok(after.closer >= 1);
    assert.ok(after.closer - before.closer <= 1, 'three closing nights of one event are one event');
  });

  it('the hourly job awards everyone who reached something, and only once', async () => {
    // A fan whose badges nobody has read yet, with a night they were at.
    const fan = await one<{ id: string }>(env.ctx.db,
      `select id from users where role = 'user' and not exists (select 1 from badge_awards b where b.subject_kind = 'user' and b.subject_id = users.id) limit 1`);
    const night = await one<{ id: string }>(env.ctx.db, `select id from events where status = 'live' and starts_at <= $1 limit 1`, [env.clock.now()]);
    await env.ctx.db.query('insert into presence (user_id, event_id) values ($1, $2) on conflict do nothing', [fan!.id, night!.id]);
    const made = await awardAll(env.ctx.db, env.clock.now());
    assert.ok(made > 0);
    assert.ok(await one(env.ctx.db, `select 1 from badge_awards where subject_kind = 'user' and subject_id = $1 and code = 'first'`, [fan!.id]));
    const debuts = await one<{ n: number }>(env.ctx.db, `select count(*)::int as n from badge_awards where subject_kind = 'artist' and code = 'debut'`);
    assert.ok(debuts!.n >= 2, 'artists nobody opened get theirs from the job');
    assert.equal(await awardAll(env.ctx.db, env.clock.now()), 0, 'a second run finds nothing new');
    const orgs = await one<{ n: number }>(env.ctx.db, `select count(*)::int as n from badge_awards where subject_kind = 'organizer' and code = 'verified'`);
    assert.ok(orgs!.n >= 2);
  });
});
