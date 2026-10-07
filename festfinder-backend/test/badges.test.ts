import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { many, one } from '../src/db/index.ts';
import { awardAll, BADGE_CATALOGUE } from '../src/services/badges.ts';

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
    const past = await many<{ id: string; genre: string }>(env.ctx.db,
      `select distinct on (genre) id, genre from events where status = 'live' and starts_at <= $1 and genre in ('Festival', 'Rock', 'EDM', 'Culture') order by genre, starts_at`,
      [env.clock.now()]);
    for (const e of past) await env.ctx.db.query('insert into presence (user_id, event_id) values ($1, $2) on conflict do nothing', [me.id, e.id]);

    const first = await env.as(token).get('/me/badges');
    assert.equal(first.status, 200);
    const by = Object.fromEntries(first.body.items.map((b: any) => [b.code, b]));
    assert.equal(by.first.earned, true);
    assert.equal(by.first.isNew, true);
    if (past.length === 4) assert.equal(by.four_families.earned, true);
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

  it('organiser and artist pages carry theirs', async () => {
    const org = await env.as().get('/organizers/ravoent');
    const verified = org.body.badges.find((b: any) => b.code === 'verified');
    assert.equal(verified.earned, true);
    assert.ok(org.body.badges.every((b: any) => b.label.vi && b.rule.en));

    const shown = await one<{ slug: string }>(env.ctx.db,
      `select a.slug from artists a join event_artists ea on ea.artist_id = a.id join events e on e.id = ea.event_id where e.status = 'live' and e.published_at is not null limit 1`);
    const artist = await env.as().get('/artists/' + shown!.slug);
    assert.equal(artist.body.badges.find((b: any) => b.code === 'debut').earned, true);
  });

  it('the hourly job awards everyone who reached something, and only once', async () => {
    const made = await awardAll(env.ctx.db, env.clock.now());
    assert.ok(made >= 0);
    assert.equal(await awardAll(env.ctx.db, env.clock.now()), 0, 'a second run finds nothing new');
    const orgs = await one<{ n: number }>(env.ctx.db, `select count(*)::int as n from badge_awards where subject_kind = 'organizer' and code = 'verified'`);
    assert.ok(orgs!.n >= 2);
  });
});
