import type { Queryable } from '../db/index.ts';
import { json, many, one } from '../db/index.ts';
import type { Localized, NotificationTopic } from '../lib/i18n.ts';
import { inQuietHours, quietHoursEnd } from '../lib/time.ts';

export type Prefs = Record<NotificationTopic, { push: boolean; zalo: boolean; email: boolean }>;

export const DEFAULT_PREFS: Prefs = {
  saved: { push: true, zalo: true, email: false },
  tickets: { push: true, zalo: false, email: false },
  artists: { push: true, zalo: false, email: true },
  orgs: { push: false, zalo: true, email: true },
  friends: { push: false, zalo: true, email: false },
  weekly: { push: false, zalo: false, email: true },
  sets: { push: true, zalo: false, email: false },
};

export async function loadPrefs(q: Queryable, userId: string): Promise<Prefs> {
  const rows = await many<any>(q, 'select topic, push, zalo, email from notification_prefs where user_id = $1', [userId]);
  const prefs = structuredClone(DEFAULT_PREFS);
  for (const r of rows) prefs[r.topic as NotificationTopic] = { push: r.push, zalo: r.zalo, email: r.email };
  return prefs;
}

export interface UserNotice {
  userId: string;
  topic: NotificationTopic | null;   // null = transactional (tickets bought, invites), in-app + push only
  kind: string;
  title: Localized;
  body: Localized;
  cta?: Localized;
  link?: Record<string, unknown>;
  dedupeKey?: string;
  /** Changes to an event starting today break through quiet hours. */
  urgent?: boolean;
  /** Skip the in-app row (e.g. OTP-like or pure channel messages). */
  inApp?: boolean;
}

/** Writes the in-app notification and queues channel messages the user has switched on. */
export async function notifyUser(q: Queryable, now: Date, n: UserNotice): Promise<boolean> {
  if (n.inApp !== false) {
    const inserted = await one(q,
      `insert into notifications (user_id, kind, title, body, cta, link, dedupe_key, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (coalesce(user_id, organizer_id), dedupe_key) where dedupe_key is not null do nothing
       returning id`,
      [n.userId, n.kind, json(n.title), json(n.body), json(n.cta), json(n.link), n.dedupeKey ?? null, now]);
    if (!inserted) return false;
  }
  const user = await one<any>(q, 'select id, email, phone, locale from users where id = $1', [n.userId]);
  if (!user) return false;
  const channels = n.topic ? (await loadPrefs(q, n.userId))[n.topic] : { push: true, zalo: false, email: false };
  const notBefore = !n.urgent && inQuietHours(now) ? quietHoursEnd(now) : now;
  const payload = { lang: user.locale, title: n.title, body: n.body, link: n.link ?? null };

  if (channels.push) {
    const devices = await many<{ token: string }>(q, 'select token from devices where user_id = $1', [n.userId]);
    for (const d of devices) await enqueue(q, n.userId, 'push', d.token, n.kind, payload, notBefore);
  }
  if (channels.zalo) {
    const zalo = await one<{ external_id: string }>(q, `select external_id from social_connections where user_id = $1 and provider = 'zalo'`, [n.userId]);
    const address = zalo?.external_id ?? user.phone;
    if (address) await enqueue(q, n.userId, 'zalo', address, n.kind, payload, notBefore);
  }
  if (channels.email && user.email) await enqueue(q, n.userId, 'email', user.email, n.kind, payload, notBefore);
  return true;
}

export async function enqueue(
  q: Queryable, userId: string | null, channel: string, address: string, template: string,
  payload: Record<string, unknown>, notBefore: Date, announcementId: string | null = null,
) {
  await q.query(
    `insert into outbox (user_id, channel, address, template, payload, not_before, announcement_id) values ($1,$2,$3,$4,$5,$6,$7)`,
    [userId, channel, address, template, json(payload), notBefore, announcementId]);
}

export type OrgTopic = 'moderation' | 'tickets' | 'payouts' | 'crew';
export const DEFAULT_ORG_PREFS: Record<OrgTopic, boolean> = { moderation: true, tickets: true, payouts: true, crew: false };

export async function loadOrgPrefs(q: Queryable, organizerId: string): Promise<Record<OrgTopic, boolean>> {
  const rows = await many<any>(q, 'select topic, enabled from organizer_notification_prefs where organizer_id = $1', [organizerId]);
  const prefs = { ...DEFAULT_ORG_PREFS };
  for (const r of rows) prefs[r.topic as OrgTopic] = r.enabled;
  return prefs;
}

export interface OrgNotice {
  organizerId: string;
  topic: OrgTopic;
  kind: 'reject' | 'tickets' | 'payout' | 'live' | 'crew';
  title: Localized;
  body: Localized;
  cta?: Localized;
  link?: Record<string, unknown>;
  dedupeKey?: string;
}

/**
 * Organiser alerts land in the back-office bell. Moderation and ticket alerts also go
 * by email to the team and push to their devices; a switched-off topic is dropped entirely.
 */
export async function notifyOrganizer(q: Queryable, now: Date, n: OrgNotice): Promise<boolean> {
  const prefs = await loadOrgPrefs(q, n.organizerId);
  if (!prefs[n.topic]) return false;
  const inserted = await one(q,
    `insert into notifications (organizer_id, kind, title, body, cta, link, dedupe_key, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (coalesce(user_id, organizer_id), dedupe_key) where dedupe_key is not null do nothing
     returning id`,
    [n.organizerId, n.kind, json(n.title), json(n.body), json(n.cta), json(n.link), n.dedupeKey ?? null, now]);
  if (!inserted) return false;
  const members = await many<any>(q,
    `select u.id, u.email, u.locale from organizer_members m join users u on u.id = m.user_id where m.organizer_id = $1`, [n.organizerId]);
  for (const m of members) {
    const payload = { lang: m.locale, title: n.title, body: n.body, link: n.link ?? null };
    if (m.email) await enqueue(q, m.id, 'email', m.email, `org.${n.kind}`, payload, now);
    const devices = await many<{ token: string }>(q, 'select token from devices where user_id = $1', [m.id]);
    for (const d of devices) await enqueue(q, m.id, 'push', d.token, `org.${n.kind}`, payload, now);
  }
  return true;
}
