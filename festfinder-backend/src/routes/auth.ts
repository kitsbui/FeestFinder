import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one } from '../db/index.ts';
import { AppError, badRequest, conflict, notFound, tooMany, unauthorized } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { hashPassword, randomToken, sha256, sixDigitCode, verifyPassword } from '../lib/crypto.ts';
import { isEmail, normalizeEmail, normalizeVnPhone } from '../lib/contact.ts';
import { parse } from '../lib/validate.ts';
import { createSession, SESSION_COOKIE, setSessionCookie } from '../http/session.ts';
import { requireUser } from '../http/guards.ts';
import { enqueue } from '../services/notify.ts';
import { deliverDue } from '../services/messaging.ts';
import { syncFriends } from '../services/friends.ts';
import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';

const OTP_TTL_MS = 10 * 60_000;
const OTP_RESEND_MS = 30_000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_PER_HOUR = 5;

type OtpChannel = 'email' | 'zalo' | 'wa' | 'sms';

/** Normalises the identifier for a channel, or throws the design's per-channel error. */
export function identifierFor(channel: OtpChannel, raw: string): string {
  if (channel === 'email') {
    if (!isEmail(raw)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
    return normalizeEmail(raw);
  }
  const phone = normalizeVnPhone(raw);
  if (!phone) {
    throw badRequest('invalid_phone', channel === 'wa'
      ? L('Enter the WhatsApp number with its country code', 'Nhập số WhatsApp kèm mã quốc gia')
      : L('Enter a valid Vietnamese phone number', 'Nhập số điện thoại Việt Nam hợp lệ'));
  }
  return phone;
}

/** Creates a challenge and queues the code on its channel. Enforces the resend cooldown and an hourly cap. */
export async function startOtp(
  ctx: Ctx, q: Queryable,
  opts: { purpose: 'auth' | 'reset' | 'connect' | 'staff'; channel: OtpChannel; identifier: string; userId?: string },
) {
  const now = ctx.clock.now();
  const recent = await one<any>(q,
    `select count(*)::int as n, max(resend_at) as resend_at from otp_challenges
      where identifier = $1 and created_at > $2`, [opts.identifier, new Date(now.getTime() - 3600_000)]);
  if (recent.resend_at && new Date(recent.resend_at) > now) {
    const wait = Math.ceil((new Date(recent.resend_at).getTime() - now.getTime()) / 1000);
    throw tooMany('otp_cooldown', L(`Wait ${wait}s before asking for another code`, `Chờ ${wait} giây để gửi lại mã`), { retryIn: wait });
  }
  if (recent.n >= OTP_PER_HOUR) {
    throw tooMany('otp_rate_limited', L('Too many codes requested. Try again in an hour.', 'Bạn đã yêu cầu quá nhiều mã. Thử lại sau một giờ.'));
  }
  const code = sixDigitCode();
  const row = await one<{ id: string }>(q,
    `insert into otp_challenges (purpose, channel, identifier, code_hash, user_id, created_at, expires_at, resend_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [opts.purpose, opts.channel, opts.identifier, sha256(`${opts.identifier}:${code}`), opts.userId ?? null,
      now, new Date(now.getTime() + OTP_TTL_MS), new Date(now.getTime() + OTP_RESEND_MS)]);
  const channel = opts.channel === 'wa' ? 'whatsapp' : opts.channel;
  await enqueue(q, opts.userId ?? null, channel, opts.identifier, 'otp', { code, lang: 'vi' }, now);
  return {
    challengeId: row!.id,
    resendIn: OTP_RESEND_MS / 1000,
    expiresIn: OTP_TTL_MS / 1000,
    ...(ctx.config.exposeDevCodes ? { devCode: code } : {}),
  };
}

/**
 * Checks a code; burns an attempt on failure and consumes the challenge on success.
 * Deliberately not run inside a transaction: the failed-attempt counter must survive the
 * error that follows it, and consumption is a single conditional update so a code can't
 * be redeemed twice by concurrent requests.
 */
export async function checkOtp(ctx: Ctx, challengeId: string, code: string, purpose: string) {
  const now = ctx.clock.now();
  const ch = await one<any>(ctx.db, 'select * from otp_challenges where id = $1 and purpose = $2', [challengeId, purpose]);
  if (!ch || ch.consumed_at) throw notFound(L('That code has already been used. Request a new one.', 'Mã đã được dùng. Hãy yêu cầu mã mới.'));
  if (new Date(ch.expires_at) <= now) throw badRequest('otp_expired', L('That code has expired. Request a new one.', 'Mã đã hết hạn. Hãy yêu cầu mã mới.'));
  if (ch.attempts >= OTP_MAX_ATTEMPTS) throw tooMany('otp_locked', L('Too many wrong codes. Request a new one.', 'Nhập sai quá nhiều lần. Hãy yêu cầu mã mới.'));
  if (!/^\d{6}$/.test(code) || sha256(`${ch.identifier}:${code}`) !== ch.code_hash) {
    const r = await one<any>(ctx.db, 'update otp_challenges set attempts = attempts + 1 where id = $1 returning attempts', [challengeId]);
    throw badRequest('otp_wrong', L('Enter the 6-digit code we sent', 'Nhập mã 6 số chúng tôi đã gửi'), { attemptsLeft: Math.max(0, OTP_MAX_ATTEMPTS - r.attempts) });
  }
  const consumed = await one(ctx.db,
    'update otp_challenges set consumed_at = $2 where id = $1 and consumed_at is null and attempts < $3 returning id', [challengeId, now, OTP_MAX_ATTEMPTS]);
  if (!consumed) throw notFound(L('That code has already been used. Request a new one.', 'Mã đã được dùng. Hãy yêu cầu mã mới.'));
  return ch as { identifier: string; channel: OtpChannel; user_id: string | null };
}

export function publicUser(u: any) {
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, city: u.city, photoUrl: u.photo_url,
    locale: u.locale, role: u.role, signupMethod: u.signup_method, interests: u.interests, hasPassword: !!u.password_hash,
  };
}

export default async function authRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const issue = async (reply: any, userId: string, created: boolean) => {
    const { token, expiresAt } = await createSession(ctx.db, ctx.clock.now(), { kind: 'user', userId });
    setSessionCookie(ctx, reply, token, expiresAt);
    const user = await one<any>(ctx.db, 'select * from users where id = $1', [userId]);
    return { token, expiresAt, created, user: publicUser(user) };
  };

  const kick = () => { deliverDue(ctx.db, ctx.clock, ctx.transport).catch((e) => ctx.log(`otp delivery failed: ${e}`)); };

  // Password guessing: 10 failures per identifier (or per IP) in 15 minutes, then wait.
  const failures = new Map<string, number[]>();
  const LOGIN_WINDOW_MS = 15 * 60_000;
  const LOGIN_MAX_FAILURES = 10;
  const recentFailures = (key: string) => (failures.get(key) ?? []).filter((t) => ctx.clock.now().getTime() - t < LOGIN_WINDOW_MS);
  const noteFailure = (key: string) => {
    failures.set(key, [...recentFailures(key), ctx.clock.now().getTime()]);
    if (failures.size > 50_000) failures.clear();
  };

  const allowedRedirect = (uri: string) => {
    const origin = new URL(uri).origin;
    return [...ctx.config.corsOrigins, ctx.config.publicBaseUrl].some((o) => { try { return new URL(o).origin === origin; } catch { return false; } });
  };

  /** Step 1 of sign-up or phone log-in: send a 6-digit code by email, Zalo or WhatsApp. */
  app.post('/auth/otp/start', async (req) => {
    const body = parse(z.object({ channel: z.enum(['email', 'zalo', 'wa']), identifier: z.string().min(3).max(200) }), req.body);
    const identifier = identifierFor(body.channel, body.identifier);
    const out = await ctx.db.tx((q) => startOtp(ctx, q, { purpose: 'auth', channel: body.channel, identifier }));
    kick();
    return out;
  });

  /**
   * Step 2. Phone channels sign in (creating the account on first use). Email sign-ups
   * get a short-lived token for the password step; existing email accounts are signed in.
   */
  app.post('/auth/otp/verify', async (req, reply) => {
    const body = parse(z.object({ challengeId: z.string().uuid(), code: z.string() }), req.body);
    const ch = await checkOtp(ctx, body.challengeId, body.code, 'auth');
    const now = ctx.clock.now();
    if (ch.channel === 'email') {
      const existing = await one<any>(ctx.db, 'select id, password_hash from users where email = $1', [ch.identifier]);
      if (existing?.password_hash) return issue(reply, existing.id, false);
      const token = randomToken();
      await ctx.db.query(
        `insert into password_tokens (token_hash, purpose, email, user_id, expires_at) values ($1, 'signup', $2, $3, $4)`,
        [sha256(token), ch.identifier, existing?.id ?? null, new Date(now.getTime() + 30 * 60_000)]);
      return { next: 'set_password', signupToken: token };
    }
    const method = ch.channel === 'wa' ? 'wa' : 'zalo';
    const user = await ctx.db.tx(async (q) => {
      const found = await one<any>(q, 'select id from users where phone = $1', [ch.identifier]);
      if (found) return { id: found.id, created: false };
      const created = await one<any>(q, `insert into users (phone, signup_method, created_at) values ($1, $2, $3) returning id`, [ch.identifier, method, now]);
      if (method === 'zalo') {
        await q.query(`insert into social_connections (user_id, provider, external_id) values ($1, 'zalo', $2) on conflict do nothing`, [created!.id, ch.identifier]);
      }
      return { id: created!.id, created: true };
    });
    return issue(reply, user.id, user.created);
  });

  /** Step 3 for email sign-up (and password reset): set a password of 8+ characters. */
  app.post('/auth/password', async (req, reply) => {
    const body = parse(z.object({ token: z.string().min(10), password: z.string().max(200), passwordConfirm: z.string().max(200).optional() }), req.body);
    if (body.password.length < 8) throw badRequest('password_too_short', L('Use at least 8 characters', 'Dùng ít nhất 8 ký tự'));
    if (body.passwordConfirm !== undefined && body.passwordConfirm !== body.password) {
      throw badRequest('password_mismatch', L('The two passwords do not match', 'Hai mật khẩu không khớp'));
    }
    const now = ctx.clock.now();
    const hash = await hashPassword(body.password);
    const result = await ctx.db.tx(async (q) => {
      const t = await one<any>(q, 'select * from password_tokens where token_hash = $1 for update', [sha256(body.token)]);
      if (!t || t.used_at || new Date(t.expires_at) <= now) {
        throw badRequest('token_expired', L('This link has expired. Start again.', 'Liên kết đã hết hạn. Hãy làm lại từ đầu.'));
      }
      await q.query('update password_tokens set used_at = $2 where token_hash = $1', [t.token_hash, now]);
      if (t.user_id) {
        await q.query('update users set password_hash = $2 where id = $1', [t.user_id, hash]);
        return { id: t.user_id, created: false };
      }
      const clash = await one(q, 'select 1 from users where email = $1', [t.email]);
      if (clash) throw conflict('email_taken', L('An account with this email already exists', 'Email này đã có tài khoản'));
      const u = await one<any>(q, `insert into users (email, password_hash, signup_method, created_at) values ($1,$2,'email',$3) returning id`, [t.email, hash, now]);
      return { id: u!.id, created: true };
    });
    return issue(reply, result.id, result.created);
  });

  /** Log in with an email or phone number and a password. */
  app.post('/auth/login', async (req, reply) => {
    const body = parse(z.object({ identifier: z.string().min(3).max(200), password: z.string().min(1).max(200) }), req.body);
    const id = body.identifier.includes('@') ? normalizeEmail(body.identifier) : normalizeVnPhone(body.identifier);
    if (!id) throw badRequest('invalid_identifier', L('Enter your email or phone number', 'Nhập email hoặc số điện thoại'));
    const keys = [`id:${id}`, `ip:${req.ip}`];
    if (keys.some((k) => recentFailures(k).length >= LOGIN_MAX_FAILURES)) {
      throw tooMany('login_rate_limited', L('Too many attempts. Try again in 15 minutes or reset your password.', 'Thử quá nhiều lần. Thử lại sau 15 phút hoặc đặt lại mật khẩu.'));
    }
    const user = await one<any>(ctx.db, 'select id, password_hash from users where email = $1 or phone = $1', [id]);
    const ok = await verifyPassword(body.password, user?.password_hash ?? null);
    if (!user || !ok) {
      keys.forEach(noteFailure);
      throw new AppError(401, 'invalid_credentials', L('Email or password is wrong', 'Email hoặc mật khẩu chưa đúng'));
    }
    failures.delete(`id:${id}`);
    return issue(reply, user.id, false);
  });

  /** Forgot password: email a code, then exchange it for a reset token used with POST /auth/password. */
  app.post('/auth/password/reset', async (req) => {
    const body = parse(z.object({ email: z.string() }), req.body);
    const email = identifierFor('email', body.email);
    const user = await one<any>(ctx.db, 'select id from users where email = $1', [email]);
    // Same response either way so the endpoint can't be used to probe for accounts.
    if (!user) return { challengeId: null, resendIn: OTP_RESEND_MS / 1000, expiresIn: OTP_TTL_MS / 1000 };
    const out = await ctx.db.tx((q) => startOtp(ctx, q, { purpose: 'reset', channel: 'email', identifier: email, userId: user.id }));
    kick();
    return out;
  });

  app.post('/auth/password/reset/verify', async (req) => {
    const body = parse(z.object({ challengeId: z.string().uuid(), code: z.string() }), req.body);
    const ch = await checkOtp(ctx, body.challengeId, body.code, 'reset');
    const token = randomToken();
    await ctx.db.query(
      `insert into password_tokens (token_hash, purpose, email, user_id, expires_at) values ($1, 'reset', $2, $3, $4)`,
      [sha256(token), ch.identifier, ch.user_id, new Date(ctx.clock.now().getTime() + 30 * 60_000)]);
    return { resetToken: token };
  });

  /** Facebook / Instagram: get the provider URL to send the browser to. */
  app.get<{ Params: { provider: string } }>('/auth/oauth/:provider/start', async (req) => {
    const provider = parse(z.enum(['fb', 'ig']), req.params.provider);
    const { redirectUri } = parse(z.object({ redirectUri: z.string().url() }), req.query);
    if (!allowedRedirect(redirectUri)) throw badRequest('redirect_not_allowed', L('That return address is not allowed', 'Địa chỉ quay lại không được phép'));
    const impl = ctx.oauth[provider];
    if (!impl) throw badRequest('provider_unavailable', L('This sign-in option is not available right now', 'Cách đăng nhập này tạm thời chưa dùng được'));
    const state = randomToken(18);
    await ctx.db.query(
      'insert into oauth_states (state, provider, user_id, redirect_uri, expires_at) values ($1,$2,$3,$4,$5)',
      [state, provider, req.session?.user?.id ?? null, redirectUri, new Date(ctx.clock.now().getTime() + 10 * 60_000)]);
    return { url: impl.authorizeUrl(state, redirectUri), state };
  });

  /**
   * The provider redirected back with `code` and `state`. Without a session this signs in
   * (creating the account); with the session that started it, it connects the provider.
   */
  app.post<{ Params: { provider: string } }>('/auth/oauth/:provider/callback', async (req, reply) => {
    const provider = parse(z.enum(['fb', 'ig']), req.params.provider);
    const body = parse(z.object({ code: z.string().min(1), state: z.string().min(1) }), req.body);
    const impl = ctx.oauth[provider];
    if (!impl) throw badRequest('provider_unavailable', L('This sign-in option is not available right now', 'Cách đăng nhập này tạm thời chưa dùng được'));
    const now = ctx.clock.now();
    const st = await one<any>(ctx.db, 'delete from oauth_states where state = $1 and provider = $2 returning *', [body.state, provider]);
    if (!st || new Date(st.expires_at) <= now) throw badRequest('oauth_state_invalid', L('Sign-in took too long. Try again.', 'Đăng nhập quá lâu. Hãy thử lại.'));
    let profile;
    try {
      profile = await impl.exchange(body.code, st.redirect_uri);
    } catch (e) {
      ctx.log(`oauth exchange failed: ${e}`);
      throw badRequest('oauth_failed', L('We could not confirm that account. Try again.', 'Chưa xác nhận được tài khoản. Hãy thử lại.'));
    }
    const holder = await one<any>(ctx.db, 'select user_id from social_connections where provider = $1 and external_id = $2', [provider, profile.externalId]);

    if (st.user_id) {
      if (holder && holder.user_id !== st.user_id) {
        throw conflict('connection_taken', L('That account is already linked to another FeestFinder user', 'Tài khoản này đã liên kết với người dùng khác'));
      }
      await ctx.db.query(
        `insert into social_connections (user_id, provider, external_id, display_name) values ($1,$2,$3,$4)
         on conflict (user_id, provider) do update set external_id = excluded.external_id, display_name = excluded.display_name, connected_at = now()`,
        [st.user_id, provider, profile.externalId, profile.name]);
      await ctx.db.query(`update users set name = $2 where id = $1 and name = ''`, [st.user_id, profile.name]);
      await syncFriends(ctx, st.user_id, provider, profile.accessToken);
      return { connected: provider };
    }

    const user = await ctx.db.tx(async (q) => {
      if (holder) return { id: holder.user_id, created: false };
      const byEmail = profile.email ? await one<any>(q, 'select id from users where email = $1', [normalizeEmail(profile.email)]) : null;
      const u = byEmail ?? await one<any>(q,
        `insert into users (name, email, signup_method, created_at) values ($1,$2,$3,$4) returning id`,
        [profile.name, profile.email ? normalizeEmail(profile.email) : null, provider, now]);
      await q.query(`insert into social_connections (user_id, provider, external_id, display_name) values ($1,$2,$3,$4)`,
        [u!.id, provider, profile.externalId, profile.name]);
      return { id: u!.id, created: !byEmail };
    });
    await syncFriends(ctx, user.id, provider, profile.accessToken);
    return issue(reply, user.id, user.created);
  });

  /** Log out; for an impersonated session this also ends impersonation. */
  app.delete('/auth/session', async (req, reply) => {
    const s = req.session;
    if (!s) throw unauthorized();
    await ctx.db.query('delete from sessions where token_hash = $1', [s.tokenHash]);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/auth/session', async (req) => {
    const s = requireUser(req);
    const user = await one<any>(ctx.db, 'select * from users where id = $1', [s.user.id]);
    const orgs = await ctx.db.query<any>(
      `select o.id, o.slug, o.name, m.role from organizer_members m join organizers o on o.id = m.organizer_id where m.user_id = $1`, [s.user.id]);
    return { user: publicUser(user), organizers: orgs.rows, readOnly: s.readOnly, impersonatedBy: s.impersonatorId };
  });
}
