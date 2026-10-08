import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';

/*
 * The web app as its own Vercel deployment: Vercel overwrites X-Forwarded-For with the web
 * app's address, so the web app's proxy names the visitor in x-ff-* headers signed by
 * WEB_PROXY_SECRET. These run the API as it sees such calls: from one public address.
 */

const SECRET = 'web-proxy-secret-for-the-tests-0123456789';
const WEB = 'https://web.example';
const PHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

describe('the web app as its own deployment', () => {
  let env: TestEnv;
  before(async () => { env = await setup({ config: { rateLimitPerMinute: 3, webProxySecret: SECRET, corsOrigins: [WEB] } }); });
  after(async () => { await env.close(); });

  /** A call from the web app's servers (one public address), signed or not. */
  const via = (headers: Record<string, string>, url = '/genres') => env.app.inject({
    method: 'GET', url, remoteAddress: '198.18.0.5', headers: { 'x-lang': 'en', ...headers },
  });
  const signed = (client: string | null, more: Record<string, string> = {}) =>
    ({ 'x-ff-web-secret': SECRET, ...(client ? { 'x-ff-client-ip': client } : {}), ...more });

  it('limits each visitor it names on their own', async () => {
    for (let i = 0; i < 3; i++) assert.equal((await via(signed('203.0.113.21'))).statusCode, 200);
    assert.equal((await via(signed('203.0.113.21'))).statusCode, 429);
    assert.equal((await via(signed('203.0.113.22'))).statusCode, 200, 'another visitor is not held back');
  });

  it('ignores the visitor headers without the secret', async () => {
    for (let i = 0; i < 3; i++) await via({ 'x-ff-web-secret': 'not-the-secret-not-the-secret-not-the-se', 'x-ff-client-ip': `192.0.2.${i}` });
    assert.equal((await via({ 'x-ff-client-ip': '192.0.2.99' })).statusCode, 429, 'all of them count as the one address they came from');
  });

  it('never limits its server-side renders', async () => {
    for (let i = 0; i < 6; i++) assert.equal((await via(signed(null))).statusCode, 200);
  });

  it('records the visitor’s country on a ticket click, not the web app’s', async () => {
    const res = await via(signed('203.0.113.30', { 'x-ff-client-country': 'SG', 'x-vercel-ip-country': 'JP', 'user-agent': PHONE }), '/go/rapviet?src=card');
    assert.equal(res.statusCode, 302);
    const k = (await env.ctx.db.query<any>(`select k.country from outbound_clicks k join events e on e.id = k.event_id where e.slug = 'rapviet' order by k.created_at desc limit 1`)).rows[0];
    assert.equal(k.country, 'SG');
  });

  it('sends Google sign-in back to the web app that started it, and only to one of ours', async () => {
    const start = (headers: Record<string, string>, remoteAddress = '198.18.0.5') => env.app.inject({
      method: 'GET', url: `/auth/oauth/google/start?redirectUri=${encodeURIComponent(WEB + '/app')}`, remoteAddress, headers,
    });
    const back = (res: Awaited<ReturnType<typeof start>>) => { assert.equal(res.statusCode, 200, res.body); return new URL(res.json().url).origin + new URL(res.json().url).pathname; };
    assert.equal(back(await start(signed('203.0.113.40', { 'x-ff-web-origin': WEB }))), `${WEB}/auth/oauth/google/return`);
    assert.equal(back(await start({ 'x-ff-web-origin': WEB }, '198.18.0.6')), 'http://test.local/auth/oauth/google/return', 'unsigned: the API’s own address');
    assert.equal(back(await start(signed('203.0.113.40', { 'x-ff-web-origin': 'https://evil.example' }))), 'http://test.local/auth/oauth/google/return');

    // The whole round trip through the web app signs the person in there.
    const res = await start(signed('203.0.113.41', { 'x-ff-web-origin': WEB }));
    const u = new URL(res.json().url);
    const cookie = String(res.headers['set-cookie']).match(/ff_oauth=([^;]+)/)?.[1];
    const ret = await env.app.inject({
      method: 'GET', url: `/auth/oauth/google/return?${u.searchParams}`, remoteAddress: '198.18.0.5',
      headers: { ...signed('203.0.113.41', { 'x-ff-web-origin': WEB }), cookie: `ff_oauth=${cookie}` },
    });
    assert.equal(ret.statusCode, 302);
    assert.match(String(ret.headers.location), /^https:\/\/web\.example\/app\?auth=google/);
    assert.match(String(ret.headers['set-cookie']), /ff_session=/);
  });
});
