import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { one } from '../src/db/index.ts';

/*
 * Followers and following, from real follows only (migration 042): people follow profiles and
 * people; a profile's "following" is what the accounts that run it follow.
 */
describe('followers and following', () => {
  let env: TestEnv;
  let fan: string;
  let fanId: string;
  let other: string;
  let otherId: string;
  let organizer: string;
  const idOf = async (token: string) => (await env.as(token).get('/me')).body.user.id as string;

  before(async () => {
    env = await setup();
    fan = await emailUser(env, 'follow.fan@example.com');
    other = await emailUser(env, 'follow.other@example.com');
    fanId = await idOf(fan);
    otherId = await idOf(other);
    organizer = await env.organizer();
  });
  after(async () => { await env.close(); });

  it('a person follows a person, never themselves or nobody, and both sides see it', async () => {
    assert.equal((await env.as().put(`/me/follows/people/${otherId}`)).status, 401);
    assert.equal((await env.as(fan).put(`/me/follows/people/${fanId}`)).body.error.code, 'own_profile');
    assert.equal((await env.as(fan).put('/me/follows/people/00000000-0000-4000-8000-000000000000')).status, 404);
    assert.equal((await env.as(fan).put('/me/follows/people/not-an-id')).status, 400);

    assert.equal((await env.as(fan).put(`/me/follows/people/${otherId}`)).status, 200);
    assert.equal((await env.as(fan).put(`/me/follows/people/${otherId}`)).status, 200, 'following twice is still one follow');
    const mine = (await env.as(fan).get('/me/follows')).body;
    assert.deepEqual(mine.people.map((p: { id: string }) => p.id), [otherId]);
    assert.equal(mine.counts.following >= 1, true);
    const theirs = (await env.as(other).get('/me/follows')).body;
    assert.equal(theirs.counts.followers, 1);
    assert.deepEqual(theirs.followers.map((p: { id: string; following: boolean }) => [p.id, p.following]), [[fanId, false]]);
    // Following back shows on the follower's row.
    await env.as(other).put(`/me/follows/people/${fanId}`);
    assert.equal((await env.as(other).get('/me/follows')).body.followers[0].following, true);

    assert.equal((await env.as(fan).delete(`/me/follows/people/${otherId}`)).status, 200);
    assert.equal((await env.as(other).get('/me/follows')).body.counts.followers, 0);
  });

  it('an organiser’s followers are its real follows; demo or imported numbers never show', async () => {
    const org = env.ids.org.ravoent;
    const page = async () => (await env.as().get('/organizers/ravoent')).body.stats;
    const start = await page();
    const real = await one<{ n: number }>(env.ctx.db, 'select count(*)::int as n from organizer_follows where organizer_id = $1', [org]);
    assert.equal(start.followers, real!.n);
    assert.equal((await env.as(fan).put(`/me/follows/organizers/${org}`)).status, 200);
    assert.equal((await page()).followers, start.followers + 1);
    // A follow a deleted account takes with it is not counted any more (the stored counter too).
    await env.ctx.db.query('delete from users where id = $1', [fanId]);
    assert.equal((await page()).followers, start.followers);
    const stored = await one<{ followers_count: number }>(env.ctx.db, 'select followers_count from organizers where id = $1', [org]);
    assert.equal(stored!.followers_count, start.followers);
    // Nobody follows their own page.
    assert.equal((await env.as(organizer).put(`/me/follows/organizers/${org}`)).body.error.code, 'own_profile');
  });

  it('a profile’s following is what the account that runs it follows', async () => {
    const owner = await env.login('slimv@example.com', 'festfinder123');
    const before = (await env.as().get('/artists/slimv')).body.artist;
    assert.equal(typeof before.followingCount, 'number');
    await env.as(owner).put(`/me/follows/organizers/${env.ids.org.hozoco}`);
    await env.as(owner).put(`/me/follows/people/${otherId}`);
    const after = (await env.as().get('/artists/slimv')).body.artist;
    assert.equal(after.followingCount, before.followingCount + 2);
    // An organiser's following: what its owners follow.
    const orgBefore = (await env.as().get('/organizers/ravoent')).body.stats.following;
    await env.as(organizer).put(`/me/follows/people/${otherId}`);
    assert.equal((await env.as().get('/organizers/ravoent')).body.stats.following, orgBefore + 1);
  });
});
