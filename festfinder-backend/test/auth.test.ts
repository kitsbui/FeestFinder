import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';

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

  it('signs in with Facebook through the OAuth round trip', async () => {
    const start = await env.as().get('/auth/oauth/fb/start?redirectUri=http://localhost:3000/auth/callback');
    assert.equal(start.status, 200);
    const url = new URL(start.body.url);
    const cb = await env.as().post('/auth/oauth/fb/callback', { code: url.searchParams.get('code'), state: url.searchParams.get('state') });
    assert.equal(cb.status, 200);
    assert.equal(cb.body.user.signupMethod, 'fb');
    const replay = await env.as().post('/auth/oauth/fb/callback', { code: url.searchParams.get('code'), state: url.searchParams.get('state') });
    assert.equal(replay.body.error.code, 'oauth_state_invalid');
    const evil = await env.as().get('/auth/oauth/fb/start?redirectUri=https://evil.example/steal');
    assert.equal(evil.body.error.code, 'redirect_not_allowed');
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
