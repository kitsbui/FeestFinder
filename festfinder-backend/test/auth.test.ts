import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';

describe('sign-up and sign-in', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  it('signs up by email: code, then password, then a session', async () => {
    const api = env.as();
    const bad = await api.post('/auth/otp/start', { channel: 'email', identifier: 'not-an-email' });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.code, 'invalid_email');

    const start = await api.post('/auth/otp/start', { channel: 'email', identifier: 'New.Person@Example.com' });
    assert.equal(start.status, 200);
    assert.equal(start.body.resendIn, 30);
    assert.match(start.body.devCode, /^\d{6}$/);
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(env.transport.sent.some((m) => m.template === 'otp' && m.address === 'new.person@example.com'), 'code went out by email');

    const verify = await api.post('/auth/otp/verify', { challengeId: start.body.challengeId, code: start.body.devCode });
    assert.equal(verify.body.next, 'set_password');

    const short = await api.post('/auth/password', { token: verify.body.signupToken, password: 'short' });
    assert.equal(short.body.error.code, 'password_too_short');
    const mismatch = await api.post('/auth/password', { token: verify.body.signupToken, password: 'longenough1', passwordConfirm: 'different1' });
    assert.equal(mismatch.body.error.code, 'password_mismatch');

    const done = await api.post('/auth/password', { token: verify.body.signupToken, password: 'longenough1', passwordConfirm: 'longenough1' });
    assert.equal(done.status, 200);
    assert.equal(done.body.created, true);
    assert.equal(done.body.user.email, 'new.person@example.com');
    assert.match(String(done.headers['set-cookie']), /ff_session=.*HttpOnly/i);

    const me = await env.as(done.body.token).get('/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.user.signupMethod, 'email');

    const reuse = await api.post('/auth/password', { token: verify.body.signupToken, password: 'longenough1' });
    assert.equal(reuse.body.error.code, 'token_expired');
  });

  it('signs in by Zalo number, creating the account and the Zalo connection', async () => {
    const api = env.as();
    const start = await api.post('/auth/otp/start', { channel: 'zalo', identifier: '0912 345 678' });
    assert.equal(start.status, 200);
    const again = await api.post('/auth/otp/start', { channel: 'zalo', identifier: '0912345678' });
    assert.equal(again.status, 429);
    assert.equal(again.body.error.code, 'otp_cooldown');

    const wrong = await api.post('/auth/otp/verify', { challengeId: start.body.challengeId, code: '000000' === start.body.devCode ? '111111' : '000000' });
    assert.equal(wrong.body.error.code, 'otp_wrong');
    assert.equal(wrong.body.error.details.attemptsLeft, 4);

    const ok = await api.post('/auth/otp/verify', { challengeId: start.body.challengeId, code: start.body.devCode });
    assert.equal(ok.body.created, true);
    assert.equal(ok.body.user.phone, '+84912345678');
    const me = await env.as(ok.body.token).get('/me');
    assert.deepEqual(me.body.connections.map((c: any) => c.provider), ['zalo']);

    env.clock.advance(31_000);
    const again2 = await api.post('/auth/otp/start', { channel: 'zalo', identifier: '0912345678' });
    const back = await api.post('/auth/otp/verify', { challengeId: again2.body.challengeId, code: again2.body.devCode });
    assert.equal(back.body.created, false);
    assert.equal(back.body.user.id, ok.body.user.id);
  });

  it('locks a code after five wrong tries', async () => {
    const api = env.as();
    const start = await api.post('/auth/otp/start', { channel: 'wa', identifier: '+84 977 000 111' });
    const wrongCode = start.body.devCode === '999999' ? '888888' : '999999';
    for (let i = 0; i < 5; i++) await api.post('/auth/otp/verify', { challengeId: start.body.challengeId, code: wrongCode });
    const locked = await api.post('/auth/otp/verify', { challengeId: start.body.challengeId, code: start.body.devCode });
    assert.equal(locked.status, 429);
    assert.equal(locked.body.error.code, 'otp_locked');
  });

  it('logs in with a password and rejects a wrong one', async () => {
    const wrong = await env.as().post('/auth/login', { identifier: 'minh@example.com', password: 'nope' });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.body.error.code, 'invalid_credentials');
    const token = await env.attendee();
    const session = await env.as(token).get('/auth/session');
    assert.equal(session.body.user.name, 'Minh Anh');
    const out = await env.as(token).delete('/auth/session');
    assert.equal(out.status, 200);
    assert.equal((await env.as(token).get('/me')).status, 401);
  });

  it('resets a forgotten password by email code', async () => {
    env.clock.advance(60_000);
    const start = await env.as().post('/auth/password/reset', { email: 'minh@example.com' });
    const verified = await env.as().post('/auth/password/reset/verify', { challengeId: start.body.challengeId, code: start.body.devCode });
    const set = await env.as().post('/auth/password', { token: verified.body.resetToken, password: 'brand-new-pass' });
    assert.equal(set.body.created, false);
    const token = await env.login('minh@example.com', 'brand-new-pass');
    assert.ok(token);
    const unknown = await env.as().post('/auth/password/reset', { email: 'nobody@example.com' });
    assert.equal(unknown.status, 200, 'does not reveal whether an account exists');
  });

  /** Start a provider's sign-in, follow it back to /return, and say where the browser lands. */
  const roundTrip = async (e: TestEnv, provider: string, opts: { token?: string; from?: string; cookie?: boolean; error?: string; code?: string } = {}) => {
    const start = await e.as(opts.token).get(`/auth/oauth/${provider}/start?redirectUri=${encodeURIComponent(opts.from ?? 'http://localhost:3000/e/ravo?lang=en')}`);
    assert.equal(start.status, 200, JSON.stringify(start.body));
    const stateCookie = String(start.headers['set-cookie']).match(/ff_oauth=([^;]+)/)?.[1];
    // The mock provider sends the browser straight back with a code; a real one asks first.
    const ret = new URL(start.body.url);
    const qs = new URLSearchParams({ state: ret.searchParams.get('state')!, ...(opts.error ? { error: opts.error } : { code: opts.code ?? ret.searchParams.get('code')! }) });
    const res = await e.app.inject({
      method: 'GET', url: `${ret.pathname}?${qs}`,
      headers: { ...(opts.cookie === false ? {} : { cookie: `ff_oauth=${stateCookie}` }), ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}) },
    });
    const session = String(res.headers['set-cookie'] ?? '').match(/ff_session=([^;]+)/)?.[1] ?? null;
    return { start, status: res.statusCode, location: new URL(String(res.headers.location)), session, qs };
  };
  const whoIs = async (e: TestEnv, session: string | null) =>
    (await e.app.inject({ method: 'GET', url: '/auth/session', headers: { cookie: `ff_session=${session}` } })).json().user;

  it('lists the ways in that work here, Google first', async () => {
    const r = await env.as().get('/auth/providers');
    assert.deepEqual(Object.keys(r.body), ['google', 'fb', 'ig', 'zalo', 'wa', 'email', 'password']);
    assert.equal(r.body.google, true);
  });

  it('signs in with Google: one fixed return address, and the Gmail account becomes the FeestFinder account', async () => {
    const fresh = await setup();
    try {
      const first = await roundTrip(fresh, 'google');
      assert.equal(first.status, 302);
      assert.equal(new URL(first.start.body.url).pathname, '/auth/oauth/google/return', 'the provider returns to the API, not to the page');
      assert.equal(first.location.toString(), 'http://localhost:3000/e/ravo?lang=en&auth=google&via=signup', 'back to the page, in its language');
      const user = await whoIs(fresh, first.session);
      assert.deepEqual([user.signupMethod, user.email, user.name], ['google', 'google.demo@gmail.com', 'Minh Anh']);
      const again = await roundTrip(fresh, 'google');
      assert.equal(again.location.searchParams.get('via'), 'signin');
      assert.equal((await whoIs(fresh, again.session)).id, user.id, 'the same Google account signs in again');
    } finally { await fresh.close(); }
  });

  it('finds the account that already has the confirmed Gmail address', async () => {
    const existing = await emailUser(env, 'google.demo@gmail.com');
    const owner = (await env.as(existing).get('/me')).body.user.id;
    const viaGoogle = await roundTrip(env, 'google', { from: 'http://localhost:3000/' });
    assert.equal(viaGoogle.location.toString(), 'http://localhost:3000/?auth=google&via=signin');
    assert.equal((await whoIs(env, viaGoogle.session)).id, owner);
  });

  it('refuses a return it did not start, a replay, and a cancelled sign-in, and says so', async () => {
    const noCookie = await roundTrip(env, 'fb', { cookie: false });
    assert.equal(noCookie.location.searchParams.get('auth_error'), 'oauth_state_invalid', 'a link from someone else cannot sign this browser in');
    assert.equal(noCookie.session, null);
    const ok = await roundTrip(env, 'fb');
    assert.equal(ok.location.searchParams.get('via'), 'signup');
    const replay = await env.app.inject({ method: 'GET', url: `/auth/oauth/fb/return?${ok.qs}`, headers: { cookie: `ff_oauth=${ok.qs.get('state')}` } });
    assert.equal(new URL(String(replay.headers.location)).searchParams.get('auth_error'), 'oauth_state_invalid');
    const cancelled = await roundTrip(env, 'google', { error: 'access_denied' });
    assert.equal(cancelled.location.searchParams.get('auth_error'), 'cancelled');
    const evil = await env.as().get('/auth/oauth/fb/start?redirectUri=https://evil.example/steal');
    assert.equal(evil.body.error.code, 'redirect_not_allowed');
  });

  it('links Google to the account that is signed in', async () => {
    const minh = await emailUser(env, 'linker@example.com');
    const linked = await roundTrip(env, 'google', { token: minh, code: 'mock:minh.linked:Minh' });
    assert.equal(linked.location.searchParams.get('via'), 'connect');
    assert.equal(linked.session, null, 'the session stays the one that started it');
    const me = await env.as(minh).get('/me');
    assert.ok(me.body.connections.some((c: any) => c.provider === 'google'));
    // Another FeestFinder account cannot take the same Google account.
    const other = await roundTrip(env, 'google', { token: await emailUser(env, 'someone.else@example.com'), code: 'mock:minh.linked:Minh' });
    assert.equal(other.location.searchParams.get('auth_error'), 'connection_taken');
  });

  it('slows down password guessing', async () => {
    for (let i = 0; i < 10; i++) await env.as().post('/auth/login', { identifier: 'team@ravolution.vn', password: `guess-${i}` });
    const blocked = await env.as().post('/auth/login', { identifier: 'team@ravolution.vn', password: 'ravolution2026' });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.error.code, 'login_rate_limited');
    env.clock.advance(16 * 60_000);
    assert.ok(await env.organizer());
  });
});
