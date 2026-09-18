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
 * Delivers one message on one channel. Production wires real providers here
 * (FCM/APNs for push, Zalo ZNS, an SMTP/SES mailer, an SMS gateway).
 */
export interface Transport {
  send(msg: OutboundMessage): Promise<void>;
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
      await db.query(
        `update outbox set attempts = $2, error = $3, status = $4, not_before = $5 where id = $1`,
        [r.id, attempts, String((err as Error).message).slice(0, 500), attempts >= MAX_ATTEMPTS ? 'failed' : 'pending', retryAt],
      );
      failed++;
    }
  }
  return { sent, failed };
}
