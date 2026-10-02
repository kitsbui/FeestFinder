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
