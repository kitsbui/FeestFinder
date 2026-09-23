import { createHmac } from 'node:crypto';
import type { Db } from '../db/index.ts';
import { many } from '../db/index.ts';
import type { Clock } from '../lib/time.ts';

export type Channel = 'push' | 'zalo' | 'email' | 'sms' | 'whatsapp';

export interface OutboundMessage {
  id: string;
  channel: Channel;
  address: string;
  template: string;
  payload: Record<string, any>;
}

/**
 * Delivers one message on one channel: SMTP for email, Web Push for browsers, and a
 * signed webhook for the rest (FCM/APNs, Zalo ZNS, SMS).
 */
export interface Transport {
  send(msg: OutboundMessage): Promise<void>;
}

/** A message that can never be delivered (an expired subscription): the outbox stops retrying it. */
export class PermanentDeliveryError extends Error {
  readonly permanent = true;
}

/** Logs instead of sending, and keeps the last messages for tests and local debugging. */
export class ConsoleTransport implements Transport {
  readonly sent: OutboundMessage[] = [];
  private readonly log: (line: string) => void;

  constructor(log: (line: string) => void = (l) => console.log(l)) {
    this.log = log;
  }

  async send(msg: OutboundMessage) {
    this.sent.push(msg);
    if (this.sent.length > 500) this.sent.shift();
    const lang = msg.payload.lang === 'en' ? 'en' : 'vi';
    const text = msg.payload.code
      ? `code ${msg.payload.code}`
      : [msg.payload.title?.[lang], msg.payload.body?.[lang]].filter(Boolean).join(' — ');
    this.log(`[${msg.channel} → ${msg.address}] ${msg.template}: ${text}`);
  }
}

export interface SmtpConfig { host: string; port: number; secure: boolean; user: string; pass: string; from: string }

/** Email through an SMTP relay (SES, Postmark, Resend, a VPS relay…). */
export class SmtpTransport implements Transport {
  private readonly cfg: SmtpConfig;
  private mailer: any = null;

  constructor(cfg: SmtpConfig) {
    this.cfg = cfg;
  }

  async send(msg: OutboundMessage) {
    if (!this.mailer) {
      const nodemailer = await import('nodemailer');
      this.mailer = nodemailer.createTransport({
        host: this.cfg.host,
        port: this.cfg.port,
        secure: this.cfg.secure,
        auth: this.cfg.user ? { user: this.cfg.user, pass: this.cfg.pass } : undefined,
      });
    }
    const lang = msg.payload.lang === 'en' ? 'en' : 'vi';
    const pick = (v: any) => (v && typeof v === 'object' ? v[lang] ?? v.vi ?? v.en : v);
    const subject = msg.payload.code
      ? (lang === 'en' ? `${msg.payload.code} is your FeestFinder code` : `${msg.payload.code} là mã FeestFinder của bạn`)
      : pick(msg.payload.title) || 'FeestFinder';
    const body = msg.payload.code
      ? (lang === 'en'
        ? `Your code is ${msg.payload.code}. It expires in 10 minutes.`
        : `Mã của bạn là ${msg.payload.code}. Mã hết hạn sau 10 phút.`)
      : pick(msg.payload.body) || '';
    await this.mailer.sendMail({ from: this.cfg.from, to: msg.address, subject, text: body });
  }
}

/**
 * Push, Zalo and SMS through one endpoint.
 *
 * Each of those needs a provider contract of its own (FCM/APNs, Zalo ZNS, an SMS
 * gateway), and which one a deployment uses is an operations decision. So the API posts
 * a signed, provider-neutral message and lets that endpoint fan it out.
 */
export class WebhookTransport implements Transport {
  private readonly url: string;
  private readonly secret: string;

  constructor(url: string, secret = '') {
    this.url = url;
    this.secret = secret;
  }

  async send(msg: OutboundMessage) {
    const body = JSON.stringify({
      id: msg.id, channel: msg.channel, to: msg.address, template: msg.template, payload: msg.payload,
    });
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.secret) headers['x-ff-signature'] = createHmac('sha256', this.secret).update(body).digest('hex');
    const res = await fetch(this.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(10_000) });
    // A non-2xx leaves the row pending, so the outbox retries it with backoff.
    if (!res.ok) throw new Error(`messaging webhook ${res.status}`);
  }
}

export interface WebPushConfig { publicKey: string; privateKey: string; subject: string }

/** A browser registers its PushSubscription (endpoint + keys) as its device token. */
export const isWebPushToken = (token: string) => token.startsWith('{') && token.includes('"endpoint"');

/** A path on this site. `//host/…` and `/\\host/…` are other sites to a browser. */
const isSitePath = (url: unknown): url is string => typeof url === 'string' && /^\/(?![/\\])/.test(url);

/** Where a notification's link opens in the attendee app. */
export function linkUrl(link: any): string {
  if (!link || typeof link !== 'object') return '/app';
  if (isSitePath(link.url)) return link.url;
  const ev = link.slug ?? link.eventId;
  if (link.screen === 'live' && ev) return `/app/live/${encodeURIComponent(ev)}`;
  if (link.screen === 'tickets') return '/app/tickets';
  if (link.screen === 'event' && ev) return `/app/e/${encodeURIComponent(ev)}`;
  return '/app/notifications';
}

/**
 * Browser push, sent straight to the browser's push service (Chrome, Firefox, Safari)
 * with VAPID. The service worker (festfinder-web/public/sw.js) shows it.
 */
export class WebPushTransport implements Transport {
  private readonly cfg: WebPushConfig;
  private readonly onGone: (token: string) => Promise<void>;
  private lib: Pick<typeof import('web-push'), 'sendNotification'> | null;

  constructor(cfg: WebPushConfig, onGone: (token: string) => Promise<void>, lib: Pick<typeof import('web-push'), 'sendNotification'> | null = null) {
    this.cfg = cfg;
    this.onGone = onGone;
    this.lib = lib;
  }

  async send(msg: OutboundMessage) {
    this.lib ??= (await import('web-push')).default;
    const lang = msg.payload.lang === 'en' ? 'en' : 'vi';
    const pick = (v: any) => (v && typeof v === 'object' ? v[lang] ?? v.vi ?? v.en : v);
    const body = JSON.stringify({
      title: pick(msg.payload.title) || 'FeestFinder',
      body: pick(msg.payload.body) || '',
      url: linkUrl(msg.payload.link),
      tag: msg.template,
    });
    try {
      await this.lib.sendNotification(JSON.parse(msg.address), body, {
        TTL: 6 * 3600,
        urgency: 'normal',
        vapidDetails: { subject: this.cfg.subject, publicKey: this.cfg.publicKey, privateKey: this.cfg.privateKey },
        timeout: 10_000,
      });
    } catch (err: any) {
      // 404/410: the person unsubscribed or cleared site data. Forget the device.
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await this.onGone(msg.address);
        throw new PermanentDeliveryError(`push subscription gone (${err.statusCode})`);
      }
      throw err;
    }
  }
}

/** Sends each channel wherever it is configured to go, and logs whatever has no provider. */
export class RoutingTransport implements Transport {
  private readonly email: Transport | null;
  private readonly webPush: Transport | null;
  private readonly webhook: Transport | null;
  private readonly fallback: Transport;

  constructor(opts: { email?: Transport | null; webPush?: Transport | null; webhook?: Transport | null; fallback: Transport }) {
    this.email = opts.email ?? null;
    this.webPush = opts.webPush ?? null;
    this.webhook = opts.webhook ?? null;
    this.fallback = opts.fallback;
  }

  async send(msg: OutboundMessage) {
    const target = msg.channel === 'email' ? this.email ?? this.webhook
      : msg.channel === 'push' && isWebPushToken(msg.address) ? this.webPush ?? this.webhook
      : this.webhook;
    await (target ?? this.fallback).send(msg);
  }
}

const MAX_ATTEMPTS = 5;

/** Sends due outbox rows. Failed rows back off exponentially and give up after five tries. */
export async function deliverDue(db: Db, clock: Clock, transport: Transport, batch = 50): Promise<{ sent: number; failed: number }> {
  const now = clock.now();
  const rows = await many<any>(db,
    `select id, channel, address, template, payload, attempts from outbox
     where status = 'pending' and not_before <= $1 order by not_before limit $2`, [now, batch]);
  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    try {
      await transport.send({ id: r.id, channel: r.channel, address: r.address, template: r.template, payload: r.payload });
      await db.query(`update outbox set status = 'sent', sent_at = $2, attempts = attempts + 1 where id = $1`, [r.id, now]);
      sent++;
    } catch (err) {
      const attempts = r.attempts + 1;
      const retryAt = new Date(now.getTime() + 2 ** attempts * 30_000);
      const giveUp = attempts >= MAX_ATTEMPTS || (err as PermanentDeliveryError).permanent === true;
      await db.query(
        `update outbox set attempts = $2, error = $3, status = $4, not_before = $5 where id = $1`,
        [r.id, attempts, String((err as Error).message).slice(0, 500), giveUp ? 'failed' : 'pending', retryAt],
      );
      failed++;
    }
  }
  return { sent, failed };
}
