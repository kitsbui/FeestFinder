import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { cleanProps, MemoryAnalytics, NoopAnalytics, personId } from '../src/services/analytics.ts';

const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130';

describe('analytics', () => {
  let env: TestEnv;
  const sink = new MemoryAnalytics();
  before(async () => { env = await setup({ analytics: sink }); });
  after(async () => { await env.close(); });

  const collect = (body: unknown, headers: Record<string, string> = {}) =>
    env.call('POST', '/analytics/collect', { body, headers: { 'user-agent': BROWSER, ...headers } });

  it('keeps only listed properties, and drops query strings from paths', () => {
    assert.deepEqual(cleanProps({ path: '/e/ravo?token=secret', email: 'x@example.com', city: 'tokyo', n: 3 }), { path: '/e/ravo', city: 'tokyo' });
    assert.match(personId('abc'), /^u_[0-9a-f]{24}$/);
    assert.notEqual(personId('abc'), 'abc');
  });

  it('takes a known event from a visitor and answers 204 to anything', async () => {
    const res = await collect({ name: 'page_view', anonId: 'abcdef0123456789abcd', props: { path: '/a', email: 'no@example.com' } });
    assert.equal(res.status, 204);
    assert.deepEqual(sink.events.at(-1), { event: 'page_view', distinctId: 'a_abcdef0123456789abcd', props: { path: '/a' } });
    const n = sink.events.length;
    assert.equal((await collect({ name: 'drop_table', anonId: 'abcdef0123456789abcd' })).status, 204);
    assert.equal((await collect({ name: 'page_view', anonId: 'abcdef0123456789abcd' }, { dnt: '1' })).status, 204);
    assert.equal((await collect({ name: 'page_view', anonId: 'abcdef0123456789abcd' }, { 'sec-gpc': '1' })).status, 204);
    assert.equal((await collect({ name: 'page_view', anonId: 'abcdef0123456789abcd' }, { 'user-agent': 'Googlebot/2.1' })).status, 204);
    assert.equal((await collect({ name: 'page_view' })).status, 204, 'no id at all');
    assert.equal(sink.events.length, n, 'unknown names, Do Not Track, GPC, robots and anonymous calls are dropped');
  });

  it('knows a signed-in person only by a hash, and records server events the same way', async () => {
    const token = await emailUser(env, 'tracked@example.com');
    await env.as(token).post('/analytics/collect', { name: 'search', props: { city: 'ho-chi-minh' } });
    const id = (await env.ctx.db.query<any>(`select id from users where email = 'tracked@example.com'`)).rows[0].id;
    assert.equal(sink.events.at(-1)!.distinctId, personId(id));
    await env.as(token).post('/me/roles/artist', { stageName: 'Tracked Act' });
    assert.deepEqual(sink.events.at(-1), { event: 'role_chosen', distinctId: personId(id), props: { role: 'artist' } });
    assert.ok(!JSON.stringify(sink.events).includes('tracked@example.com'));
  });

  it('sends nothing without a provider', async () => {
    const quiet = await setup({ analytics: new NoopAnalytics(), seed: false });
    assert.equal((await quiet.call('POST', '/analytics/collect', { body: { name: 'page_view', anonId: 'abcdef0123456789abcd' }, headers: { 'user-agent': BROWSER } })).status, 204);
    await quiet.close();
  });
});
