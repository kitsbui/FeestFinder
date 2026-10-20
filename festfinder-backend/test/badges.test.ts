import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { many, one } from '../src/db/index.ts';
import { awardAll, BADGE_CATALOGUE, progressFor } from '../src/services/badges.ts';

describe('badges', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  it('has no badge that counts followers, rates organisers or times their replies', () => {
    const codes = BADGE_CATALOGUE.map((b) => b.code).join(' ');
    // Following artists and replies received are things a person does or gets; nothing counts a profile's followers.
    assert.doesNotMatch(codes, /followers|rating|satisf|response/);
    assert.equal(BADGE_CATALOGUE.length, 53);
    assert.equal(new Set(BADGE_CATALOGUE.map((b) => b.code)).size, 53, 'every code once, across the roles');
    assert.deepEqual([BADGE_CATALOGUE.filter((b) => b.role === 'user').length, BADGE_CATALOGUE.filter((b) => b.role === 'artist').length, BADGE_CATALOGUE.filter((b) => b.role === 'organizer').length], [42, 6, 5]);
    assert.deepEqual([...new Set(BADGE_CATALOGUE.map((b) => b.role))].sort(), ['artist', 'organizer', 'user']);
  });

  it('a fan earns from the nights they were there, once, and sees "new" only the first time', async () => {
    const token = await env.attendee();
    const me = (await env.as(token).get('/auth/session')).body.user;
    // Nights already over, one of each style, each checked in on the site.
    const past = await many<{ id: string; style: string }>(env.ctx.db,
      `select distinct on (styles[1]) id, styles[1] as style from events
        where status = 'live' and starts_at <= $1 and cardinality(styles) > 0 order by styles[1], starts_at`, [env.clock.now()]);
    assert.ok(past.length >= 4, 'the seed has past nights in four styles');
    const before = await progressFor(env.ctx.db, 'user', me.id, env.clock.now());
    assert.ok(before.four_styles < 4);
    for (const e of past) await env.ctx.db.query('insert into presence (user_id, event_id) values ($1, $2) on conflict do nothing', [me.id, e.id]);

    const first = await env.as(token).get('/me/badges');
    assert.equal(first.status, 200);
    const by = Object.fromEntries(first.body.items.map((b: any) => [b.code, b]));
    assert.equal(by.first.earned, true);
    assert.equal(by.first.isNew, true);
    assert.equal(by.four_styles.earned, true, 'the new nights count');
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

describe('raver badges v2: 53 achievements, pins and notices', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  const userCodes = BADGE_CATALOGUE.filter((b) => b.role === 'user').map((b) => b.code);

  it('draws every badge’s sign from the web’s sprite', () => {
    const sprite = readFileSync(new URL('../../festfinder-web/public/kd/badges.svg', import.meta.url), 'utf8');
    const missing = BADGE_CATALOGUE.filter((b) => b.icon && !sprite.includes(`<symbol id="${b.icon}"`)).map((b) => b.icon);
    assert.deepEqual(missing, [], 'run node scripts/badge-sprite.ts in festfinder-web');
  });

  it('a person who did nothing has none of the 42, and nothing breaks on empty data', async () => {
    const token = await emailUser(env, 'nobody.yet@example.com');
    const me = (await env.as(token).get('/auth/session')).body.user;
    const p = await progressFor(env.ctx.db, 'user', me.id, env.clock.now());
    assert.deepEqual(userCodes.filter((c) => (p[c] ?? 0) > 0), []);
    const out = (await env.as(token).get('/me/badges')).body;
    assert.equal(out.total, 42);
    assert.equal(out.items.filter((b: { earned: boolean }) => b.earned).length, 0);
    assert.deepEqual(out.pins, []);
  });

  it('earns from nights, comments, shares, plans and the profile, each badge once', async () => {
    const token = await emailUser(env, 'raver.one@example.com');
    const me = (await env.as(token).get('/auth/session')).body.user as { id: string };
    const db = env.ctx.db;
    const others = (await db.query<{ id: string }>(`select id from users where id <> $1 and role = 'user' order by created_at limit 6`, [me.id])).rows.map((r) => r.id);
    const past = (await db.query<{ id: string }>(`select id from events where status = 'live' and starts_at <= $1 order by starts_at limit 2`, [env.clock.now()])).rows;
    assert.equal(past.length, 2);
    for (const e of past) await db.query('insert into presence (user_id, event_id) values ($1,$2) on conflict do nothing', [me.id, e.id]);
    // Said going to a night only Feest Radar had found.
    await db.query(`insert into going (user_id, event_id, origin_at_time) values ($1,$2,'radar') on conflict do nothing`, [me.id, past[0].id]);
    const root = (await db.query<{ id: string }>(`insert into event_posts (event_id, user_id, kind, body, photo_url, helpful_count) values ($1,$2,'qa','Có tủ gửi đồ không?','https://img.example/a.jpg',3) returning id`, [past[0].id, me.id])).rows[0].id;
    await db.query(`insert into event_posts (event_id, user_id, parent_id, kind, body, official) values ($1,$2,$3,'qa','Có ạ',true)`, [past[0].id, others[0], root]);
    for (const f of others.slice(0, 5)) await db.query(`insert into friendships (user_id, friend_id, source) values ($1,$2,'zalo') on conflict do nothing`, [me.id, f]);
    for (let i = 0; i < 10; i++) await db.query(`insert into share_visits (event_id, ref_user, visitor, channel) values ($1,$2,$3,'copy')`, [past[1].id, me.id, 'v' + i]);
    await db.query(`insert into smart_alerts (user_id, enabled) values ($1, true) on conflict (user_id) do update set enabled = true`, [me.id]);
    const plan = (await db.query<{ id: string }>('insert into group_plans (event_id, owner_id) values ($1,$2) returning id', [past[1].id, me.id])).rows[0].id;
    await db.query(`insert into group_plan_members (plan_id, user_id, status) values ($1,$2,'going')`, [plan, others[1]]);
    await db.query(`update users set photo_url = 'https://img.example/me.jpg', name = 'Raver One', city = 'ho-chi-minh' where id = $1`, [me.id]);

    const p = await progressFor(db, 'user', me.id, env.clock.now());
    assert.equal(p.first, 2);
    assert.equal(p.comment_first, 1);
    assert.equal(p.replies_10, 1, 'the organiser’s answer is a reply received');
    assert.equal(p.photo_first, 1);
    assert.equal(p.question_answered, 1);
    assert.equal(p.likes_25, 3);
    assert.equal(p.friends_5, 5);
    assert.equal(p.spread, 10);
    assert.equal(p.alert_set, 1);
    assert.equal(p.plan_first, 1);
    assert.equal(p.profile_complete, 1);
    assert.equal(p.radar_first, 1);
    assert.equal(p.early_bird, 1, 'among the first thousand who went out');

    const out = (await env.as(token).get('/me/badges')).body;
    const earned = new Set(out.items.filter((b: { earned: boolean }) => b.earned).map((b: { code: string }) => b.code));
    for (const c of ['first', 'comment_first', 'photo_first', 'question_answered', 'friends_5', 'spread', 'alert_set', 'plan_first', 'profile_complete', 'radar_first', 'early_bird']) {
      assert.ok(earned.has(c), c);
    }
    for (const c of ['passport_10', 'likes_25', 'replies_10', 'spread_100', 'referrer_10', 'commission_first', 'saved_50']) assert.ok(!earned.has(c), c);
    const early = out.items.find((b: { code: string }) => b.code === 'early_bird');
    assert.deepEqual([early.tier, early.group, early.icon], ['legendary', 'profile', 'Lightning']);
    assert.equal(out.items.find((b: { code: string }) => b.code === 'passport_100').ring, '100', 'a counted badge shows its number');

    // A person is told, at most three an hour; the rest only show as new.
    const told = (await db.query<{ n: number }>(`select count(*)::int as n from notifications where user_id = $1 and kind = 'badge'`, [me.id])).rows[0].n;
    assert.ok(told >= 1 && told <= 3, String(told));
    const again = await db.query<{ n: number }>(`select count(*)::int as n from badge_awards where subject_kind = 'user' and subject_id = $1 and code = 'first'`, [me.id]);
    assert.equal(again.rows[0].n, 1);

    // Pins: at most six, only badges one has.
    assert.equal((await env.as(token).put('/me/badges/pins', { codes: ['first', 'passport_100'] })).body.error.code, 'not_earned');
    assert.equal((await env.as(token).put('/me/badges/pins', { codes: ['first', 'spread', 'alert_set', 'plan_first', 'friends_5', 'early_bird', 'photo_first'] })).status, 400);
    const pinned = await env.as(token).put('/me/badges/pins', { codes: ['early_bird', 'first'] });
    assert.deepEqual(pinned.body.pins, ['early_bird', 'first']);
    assert.deepEqual((await env.as(token).get('/me/badges')).body.pins, ['early_bird', 'first']);
    const shown = (await env.as().get(`/users/${me.id}/badges`)).body;
    assert.deepEqual(shown.items.slice(0, 2).map((b: { code: string }) => b.code).sort(), ['early_bird', 'first']);
    assert.ok(shown.items.every((b: { earned: boolean; isNew: boolean }) => b.earned && !b.isNew), 'others see only what was earned, nothing new');
    assert.equal((await env.as().get('/users/00000000-0000-4000-8000-000000000000/badges')).status, 404);
  });

  it('a person who runs an organiser shows its badges on their own profile too', async () => {
    const token = await env.organizer();
    const out = (await env.as(token).get('/me/badges')).body;
    const roles = new Set(out.items.map((b: { role: string }) => b.role));
    assert.ok(roles.has('user') && roles.has('organizer'));
    assert.ok(out.items.find((b: { code: string; earned: boolean }) => b.code === 'verified')?.earned);
    assert.ok(out.items.find((b: { code: string; earned: boolean }) => b.code === 'first_live')?.earned, 'Tin đầu');
  });
});
