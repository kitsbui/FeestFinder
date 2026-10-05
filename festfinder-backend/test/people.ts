import type { TestEnv } from './helpers.ts';

/** A new account made by email: signed in, but with no proven phone number. */
export async function emailUser(env: TestEnv, email: string): Promise<string> {
  const api = env.as();
  const start = await api.post('/auth/otp/start', { channel: 'email', identifier: email });
  const verify = await api.post('/auth/otp/verify', { challengeId: start.body.challengeId, code: start.body.devCode });
  const done = await api.post('/auth/password', { token: verify.body.signupToken, password: 'longenough1', passwordConfirm: 'longenough1' });
  return done.body.token;
}

/** Signs in with a one-time code to a phone number, the way Zalo sign-in works. */
export async function phoneUser(env: TestEnv, phone: string): Promise<string> {
  const api = env.as();
  const start = await api.post('/auth/otp/start', { channel: 'zalo', identifier: phone });
  env.clock.advance(31_000);
  const verify = await api.post('/auth/otp/verify', { challengeId: start.body.challengeId, code: start.body.devCode });
  return verify.body.token;
}

/** Signs in with the stand-in Google provider; `code` picks the Google account (mock:<id>:<name>). Returns the session cookie value. */
export async function googleUser(env: TestEnv, code: string): Promise<string | null> {
  const start = await env.as().get(`/auth/oauth/google/start?redirectUri=${encodeURIComponent('http://localhost:3000/')}`);
  const state = new URL(start.body.url).searchParams.get('state')!;
  const cookie = String(start.headers['set-cookie']).match(/ff_oauth=([^;]+)/)?.[1];
  const res = await env.app.inject({ method: 'GET', url: `/auth/oauth/google/return?${new URLSearchParams({ state, code })}`, headers: { cookie: `ff_oauth=${cookie}` } });
  return String(res.headers['set-cookie'] ?? '').match(/ff_session=([^;]+)/)?.[1] ?? null;
}
