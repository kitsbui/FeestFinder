/**
 * Real phone delivery for one-time codes and notifications (phase 17, owner 2026-10-19): SMS
 * through Twilio or eSMS.vn, and Zalo through ZNS (Zalo Notification Service), straight from the
 * API instead of the generic messaging webhook. Each transport speaks its provider's HTTP API with
 * a 10 s timeout; an answer that means "this number can never get it" is a PermanentDeliveryError
 * (the outbox stops), anything else is retried with backoff by deliverDue. The code itself is never
 * logged: errors carry the provider's result code only.
 *
 * Numbers are stored as E.164 (+84…); Twilio takes that, eSMS and Zalo take 84… without the plus.
 */
import { PermanentDeliveryError, type OutboundMessage, type Transport } from './messaging.ts';
import type { Queryable } from '../db/index.ts';
import { one } from '../db/index.ts';

type Fetch = typeof fetch;
const TIMEOUT_MS = 10_000;

/** What the message says on a phone: short, and without accents for SMS (every gateway and handset shows them). */
export function phoneText(msg: OutboundMessage, accents: boolean): string {
  const lang = msg.payload.lang === 'en' ? 'en' : 'vi';
  if (msg.template === 'otp' && msg.payload.code) {
    return lang === 'en'
      ? `FeestFinder: your code is ${msg.payload.code}. It expires in 10 minutes. Never share it.`
      : accents
        ? `FeestFinder: mã xác nhận của bạn là ${msg.payload.code}. Mã hết hạn sau 10 phút. Không chia sẻ mã này.`
        : `FeestFinder: ma xac nhan cua ban la ${msg.payload.code}. Ma het han sau 10 phut. Khong chia se ma nay.`;
  }
  const title = msg.payload.title?.[lang] ?? msg.payload.title?.vi ?? '';
  const body = msg.payload.body?.[lang] ?? msg.payload.body?.vi ?? '';
  const text = [title, body].filter(Boolean).join(': ');
  return (accents ? text : stripAccents(text)).slice(0, 300);
}

/** Vietnamese without its marks, the way SMS gateways price and handsets show it safely. */
export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/** +84912345678 → 84912345678, as eSMS and Zalo want it. */
export const localDigits = (e164: string) => e164.replace(/^\+/, '');

async function post(fetchFn: Fetch, url: string, init: RequestInit): Promise<Response> {
  return fetchFn(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

// ---- Twilio -----------------------------------------------------------------------------------

export interface TwilioConfig { accountSid: string; authToken: string; from: string; base?: string }

/** Twilio error codes for a number that will never take the message. */
const TWILIO_PERMANENT = new Set([21211, 21214, 21217, 21408, 21610, 21612, 21614, 30003, 30004, 30005, 30006]);

export class TwilioSmsTransport implements Transport {
  private readonly cfg: TwilioConfig;
  private readonly fetchFn: Fetch;
  constructor(cfg: TwilioConfig, fetchFn: Fetch = fetch) { this.cfg = cfg; this.fetchFn = fetchFn; }

  async send(msg: OutboundMessage) {
    const base = this.cfg.base ?? 'https://api.twilio.com';
    const form = new URLSearchParams({ To: msg.address, Body: phoneText(msg, false) });
    // A Messaging Service SID (MG…) or a sender number.
    form.set(this.cfg.from.startsWith('MG') ? 'MessagingServiceSid' : 'From', this.cfg.from);
    const res = await post(this.fetchFn, `${base}/2010-04-01/Accounts/${encodeURIComponent(this.cfg.accountSid)}/Messages.json`, {
      method: 'POST',
      headers: { authorization: 'Basic ' + Buffer.from(`${this.cfg.accountSid}:${this.cfg.authToken}`).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (res.ok) return;
    const body = await res.json().catch(() => ({})) as { code?: number; message?: string };
    if (res.status === 400 && body.code && TWILIO_PERMANENT.has(body.code)) throw new PermanentDeliveryError(`twilio ${body.code}: ${body.message ?? 'rejected'}`);
    throw new Error(`twilio ${res.status}${body.code ? ` (${body.code})` : ''}`);
  }
}

// ---- eSMS.vn ----------------------------------------------------------------------------------

export interface EsmsConfig { apiKey: string; secretKey: string; brandname: string; base?: string }

/** eSMS result codes that no retry will change (a wrong brandname, template or number). */
const ESMS_PERMANENT = new Set(['99', '104', '118', '119', '131', '146']);

export class EsmsTransport implements Transport {
  private readonly cfg: EsmsConfig;
  private readonly fetchFn: Fetch;
  constructor(cfg: EsmsConfig, fetchFn: Fetch = fetch) { this.cfg = cfg; this.fetchFn = fetchFn; }

  async send(msg: OutboundMessage) {
    const base = this.cfg.base ?? 'https://rest.esms.vn';
    const res = await post(this.fetchFn, `${base}/MainService.svc/json/SendMultipleMessage_V4_post_json/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // SmsType 2: a brandname message (the kind OTP goes by in Vietnam); IsUnicode 0: no accents.
      body: JSON.stringify({ ApiKey: this.cfg.apiKey, SecretKey: this.cfg.secretKey, Phone: localDigits(msg.address), Content: phoneText(msg, false), SmsType: 2, Brandname: this.cfg.brandname, IsUnicode: 0, RequestId: msg.id }),
    });
    if (!res.ok) throw new Error(`esms ${res.status}`);
    const out = await res.json().catch(() => ({})) as { CodeResult?: string; ErrorMessage?: string };
    if (out.CodeResult === '100') return;
    const code = out.CodeResult ?? '?';
    if (ESMS_PERMANENT.has(code)) throw new PermanentDeliveryError(`esms ${code}: ${out.ErrorMessage ?? 'rejected'}`);
    throw new Error(`esms ${code}: ${out.ErrorMessage ?? 'failed'}`);
  }
}

// ---- Zalo ZNS ---------------------------------------------------------------------------------

export interface ZnsConfig { appId: string; secretKey: string; refreshToken: string; otpTemplateId: string; base?: string; oauthBase?: string }
export interface ProviderToken { accessToken: string; refreshToken: string; expiresAt: Date }

/** Where a provider's rotating tokens live: the database in production, memory in tests. */
export interface TokenStore {
  load(provider: string): Promise<ProviderToken | null>;
  save(provider: string, token: ProviderToken): Promise<void>;
}

export class MemoryTokenStore implements TokenStore {
  readonly tokens = new Map<string, ProviderToken>();
  async load(provider: string) { return this.tokens.get(provider) ?? null; }
  async save(provider: string, token: ProviderToken) { this.tokens.set(provider, token); }
}

export class DbTokenStore implements TokenStore {
  private readonly db: Queryable;
  constructor(db: Queryable) { this.db = db; }
  async load(provider: string) {
    const r = await one<{ access_token: string; refresh_token: string; expires_at: Date }>(this.db, 'select access_token, refresh_token, expires_at from provider_tokens where provider = $1', [provider]);
    return r ? { accessToken: r.access_token, refreshToken: r.refresh_token, expiresAt: new Date(r.expires_at) } : null;
  }
  async save(provider: string, t: ProviderToken) {
    await this.db.query(
      `insert into provider_tokens (provider, access_token, refresh_token, expires_at, updated_at) values ($1,$2,$3,$4,now())
       on conflict (provider) do update set access_token = excluded.access_token, refresh_token = excluded.refresh_token, expires_at = excluded.expires_at, updated_at = now()`,
      [provider, t.accessToken, t.refreshToken, t.expiresAt]);
  }
}

/** ZNS errors for a number that will never take the message, or a template that cannot send it. */
const ZNS_PERMANENT = new Set([-108, -109, -111, -114, -117, -201, -211, -213, -214]);
/** The access token is no good: refresh it once and try again. */
const ZNS_TOKEN_EXPIRED = new Set([-124, -216]);

export class ZaloZnsTransport implements Transport {
  private readonly cfg: ZnsConfig;
  private readonly store: TokenStore;
  private readonly fetchFn: Fetch;
  private readonly now: () => Date;
  private token: ProviderToken | null = null;
  constructor(cfg: ZnsConfig, store: TokenStore, fetchFn: Fetch = fetch, now: () => Date = () => new Date()) {
    this.cfg = cfg; this.store = store; this.fetchFn = fetchFn; this.now = now;
  }

  /** The newest refresh token wins: the store's (rotated on a refresh), else the one configured. */
  private async refresh(): Promise<ProviderToken> {
    const current = this.token ?? await this.store.load('zalo');
    const res = await post(this.fetchFn, `${this.cfg.oauthBase ?? 'https://oauth.zaloapp.com'}/v4/oa/access_token`, {
      method: 'POST',
      headers: { secret_key: this.cfg.secretKey, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ refresh_token: current?.refreshToken ?? this.cfg.refreshToken, app_id: this.cfg.appId, grant_type: 'refresh_token' }).toString(),
    });
    const out = await res.json().catch(() => ({})) as { access_token?: string; refresh_token?: string; expires_in?: string | number; error?: number; error_name?: string };
    if (!res.ok || !out.access_token || !out.refresh_token) throw new Error(`zalo oauth ${res.status}${out.error ? ` (${out.error} ${out.error_name ?? ''})` : ''}`);
    const ttl = Math.max(60, Number(out.expires_in) || 3600);
    this.token = { accessToken: out.access_token, refreshToken: out.refresh_token, expiresAt: new Date(this.now().getTime() + (ttl - 60) * 1000) };
    await this.store.save('zalo', this.token);
    return this.token;
  }

  private async accessToken(): Promise<string> {
    if (!this.token) this.token = await this.store.load('zalo');
    if (this.token && this.token.expiresAt.getTime() > this.now().getTime()) return this.token.accessToken;
    return (await this.refresh()).accessToken;
  }

  async send(msg: OutboundMessage) {
    const attempt = async (token: string) => {
      const res = await post(this.fetchFn, `${this.cfg.base ?? 'https://business.openapi.zalo.me'}/message/template`, {
        method: 'POST',
        headers: { access_token: token, 'content-type': 'application/json' },
        body: JSON.stringify({ phone: localDigits(msg.address), template_id: this.cfg.otpTemplateId, template_data: this.templateData(msg), tracking_id: msg.id }),
      });
      if (!res.ok) throw new Error(`zalo zns ${res.status}`);
      return await res.json().catch(() => ({})) as { error?: number; message?: string };
    };
    let out = await attempt(await this.accessToken());
    if (out.error && ZNS_TOKEN_EXPIRED.has(out.error)) out = await attempt((await this.refresh()).accessToken);
    if (!out.error) return;
    if (ZNS_PERMANENT.has(out.error)) throw new PermanentDeliveryError(`zalo zns ${out.error}: ${out.message ?? 'rejected'}`);
    throw new Error(`zalo zns ${out.error}: ${out.message ?? 'failed'}`);
  }

  /** The approved template's fields: an OTP template takes `otp`; a notice takes a title and a text. */
  private templateData(msg: OutboundMessage): Record<string, string> {
    if (msg.template === 'otp' && msg.payload.code) return { otp: String(msg.payload.code) };
    const lang = msg.payload.lang === 'en' ? 'en' : 'vi';
    return { title: String(msg.payload.title?.[lang] ?? msg.payload.title?.vi ?? ''), text: phoneText(msg, true) };
  }
}
