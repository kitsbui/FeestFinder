import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { badRequest } from '../lib/errors.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { randomCode } from '../lib/crypto.ts';
import { notifyOrganizer, notifyUser } from './notify.ts';

/** The organiser that holds events the community submits, until their real organiser claims them. */
export const COMMUNITY_ORG = {
  slug: 'cong-dong',
  name: 'Cộng đồng FeestFinder',
  initials: 'CĐ',
  bio: L('Events people found and sent in. Each one is checked by a moderator before it goes live.',
    'Sự kiện do mọi người phát hiện và gửi lên. Mỗi tin đều được kiểm duyệt trước khi lên sóng.'),
  art: 'linear-gradient(135deg,#0AE448,#ABFF84)',
};

export async function communityOrganizerId(q: Queryable): Promise<string> {
  const found = await one<{ id: string }>(q, 'select id from organizers where is_community limit 1');
  if (found) return found.id;
  const row = await one<{ id: string }>(q,
    `insert into organizers (slug, name, initials, type, bio, art, is_community) values ($1,$2,$3,'public',$4,$5,true)
     on conflict (slug) do update set is_community = true returning id`,
    [COMMUNITY_ORG.slug, COMMUNITY_ORG.name, COMMUNITY_ORG.initials, JSON.stringify(COMMUNITY_ORG.bio), COMMUNITY_ORG.art]);
  return row!.id;
}

// ---- where the event is in its life -------------------------------------------------

export type Phase = 'before' | 'live' | 'after';

export function phaseOf(ev: { starts_at: Date | string | null; ends_at: Date | string | null }, now: Date): Phase {
  const t = now.getTime();
  if (ev.ends_at && new Date(ev.ends_at).getTime() < t) return 'after';
  if (ev.starts_at && new Date(ev.starts_at).getTime() <= t) return 'live';
  return 'before';
}

export const POST_KINDS = ['qa', 'talk', 'crew', 'trackid', 'memory'] as const;
export type PostKind = (typeof POST_KINDS)[number];

export const KIND_LABEL: Record<PostKind, Localized> = {
  qa: L('Questions', 'Hỏi đáp'),
  talk: L('Talk', 'Bàn luận'),
  crew: L('Find a crew', 'Tìm crew'),
  trackid: L('Track ID', 'Track ID'),
  memory: L('Memories', 'Kỷ niệm'),
};

/**
 * Which threads a phase opens for new posts. Crews form before the night; track IDs start
 * with the first set and stay open a week after; memories come once it has begun.
 */
export function kindOpen(kind: PostKind, phase: Phase, ev: { ends_at: Date | string | null }, now: Date): boolean {
  if (kind === 'crew') return phase !== 'after';
  if (kind === 'trackid') return phase === 'live' || (phase === 'after' && !!ev.ends_at && now.getTime() - new Date(ev.ends_at).getTime() < 7 * 86400_000);
  if (kind === 'memory') return phase !== 'before';
  return true;
}

/** Which tabs a page shows: the open ones, plus any closed one that already has posts. */
export function kindsShown(phase: Phase): PostKind[] {
  if (phase === 'before') return ['qa', 'talk', 'crew'];
  if (phase === 'live') return ['qa', 'talk', 'crew', 'trackid', 'memory'];
  return ['memory', 'trackid', 'qa', 'talk'];
}

// ---- who someone is on this page ------------------------------------------------------

export type Badge = 'team' | 'ff' | 'ticket' | 'submitter';

export const BADGE_LABEL: Record<Badge, Localized> = {
  team: L('Organiser', 'BTC'),
  ff: L('FeestFinder', 'FeestFinder'),
  ticket: L('Has a ticket', 'Có vé'),
  submitter: L('Posted this event', 'Người đăng sự kiện'),
};

/** The organiser's own team for this event, or the FeestFinder team. */
export async function isEventTeam(q: Queryable, eventId: string, user: { id: string; role: string } | null | undefined): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const row = await one(q,
    `select 1 from events e join organizer_members m on m.organizer_id = e.organizer_id where e.id = $1 and m.user_id = $2`, [eventId, user.id]);
  return !!row;
}

/** The badges each author carries on one event's page, in four queries for the whole list. */
export async function badgesFor(q: Queryable, ev: { id: string; organizer_id: string; submitted_by: string | null }, userIds: string[]): Promise<Map<string, Badge[]>> {
  const ids = [...new Set(userIds)];
  const out = new Map<string, Badge[]>(ids.map((id) => [id, []]));
  if (!ids.length) return out;
  const [team, admins, holders] = await Promise.all([
    many<{ user_id: string }>(q, 'select user_id from organizer_members where organizer_id = $1 and user_id = any($2::uuid[])', [ev.organizer_id, ids]),
    many<{ id: string }>(q, `select id from users where role = 'admin' and id = any($1::uuid[])`, [ids]),
    many<{ user_id: string }>(q, `select distinct user_id from tickets where event_id = $1 and status in ('valid', 'used') and user_id = any($2::uuid[])`, [ev.id, ids]),
  ]);
  for (const r of team) out.get(r.user_id)!.push('team');
  for (const r of admins) out.get(r.id)!.push('ff');
  for (const r of holders) out.get(r.user_id)!.push('ticket');
  if (ev.submitted_by && out.has(ev.submitted_by)) out.get(ev.submitted_by)!.push('submitter');
  return out;
}

// ---- what a post may say --------------------------------------------------------------

const PHONE = /(?:\+?84|\b0)(?:[\s.-]?\d){8,10}\b/;
const LINK = /(https?:\/\/|www\.)\S+/i;
// \b only knows ASCII letters, so Vietnamese words are bounded by "not a letter or digit".
const B = '(?<![\\p{L}\\p{N}])';
const E = '(?![\\p{L}\\p{N}])';
const TRADE_ACCENTED = new RegExp(
  `${B}(?:bán|pass|nhượng|thanh lý|sang|cần mua|mua lại|wts|wtb|selling|buying)${E}[^.!?\\n]{0,24}?${B}(?:vé|tickets?)${E}`
  + `|${B}vé${E}[^.!?\\n]{0,12}?${B}(?:pass|thanh lý|nhượng)${E}`
  + `|${B}tickets? (?:for sale|to sell)${E}`, 'iu');
// Typed without accents, "ve" is too common a syllable to search loosely: only right after the
// verb, and only in text with no accents at all (with accents, "về" is not "vé").
const TRADE_PLAIN = new RegExp(`${B}(?:ban|pass|nhuong|thanh ly|can mua|mua lai)(?: lai)? ve${E}`, 'iu');

/**
 * Keeps phone numbers out (personal data, and how off-platform ticket deals start), keeps
 * links to the organiser's team, and sends ticket trading to the resale section, where the
 * price is capped at face value and the QR changes hands safely.
 */
export function checkPostText(body: string, team: boolean): string {
  const text = body.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 2) throw badRequest('post_too_short', L('Write a little more', 'Viết thêm một chút'));
  if (text.length > 1000) throw badRequest('post_too_long', L('Keep it under 1,000 characters', 'Tối đa 1.000 ký tự'));
  if (team) return text;
  if (PHONE.test(text)) throw badRequest('post_has_phone', L('Leave phone numbers out — message people in the app instead', 'Đừng đăng số điện thoại — hãy nhắn trong app'));
  if (LINK.test(text)) throw badRequest('post_has_link', L('Links can only be posted by the organiser', 'Chỉ BTC được đăng link'));
  const nfc = text.normalize('NFC');
  if (TRADE_ACCENTED.test(nfc) || (/^[\x00-\x7F]*$/.test(nfc) && TRADE_PLAIN.test(nfc))) {
    throw badRequest('use_resale', L('Buy and sell tickets in Resale — capped at face value, and the QR changes hands safely',
      'Mua bán vé ở mục Pass vé — không quá giá gốc, mã QR được chuyển an toàn'));
  }
  return text;
}

// ---- share links ------------------------------------------------------------------------

export const SHARE_CHANNELS = ['zalo', 'facebook', 'messenger', 'threads', 'x', 'telegram', 'copy', 'native', 'story'] as const;
/** The code a person's share links carry, made the first time they share. */
export async function refCodeFor(q: Queryable, userId: string): Promise<string> {
  const row = await one<{ ref_code: string | null }>(q, 'select ref_code from users where id = $1', [userId]);
  if (row?.ref_code) return row.ref_code;
  for (let i = 0; ; i++) {
    const code = randomCode(6);
    const set = await one<{ ref_code: string }>(q,
      `update users set ref_code = $2 where id = $1 and ref_code is null
         and not exists (select 1 from users where ref_code = $2) returning ref_code`, [userId, code]);
    if (set) return set.ref_code;
    const again = await one<{ ref_code: string | null }>(q, 'select ref_code from users where id = $1', [userId]);
    if (again?.ref_code) return again.ref_code;
    if (i > 5) throw new Error('could not allocate a ref code');
  }
}

// ---- hype goals ----------------------------------------------------------------------------

/** Marks every goal the hype count has passed. Returns the ones reached just now. */
export async function reachHypeGoals(q: Queryable, eventId: string, now: Date): Promise<{ threshold: number; reward: Localized }[]> {
  return many<any>(q,
    `update hype_goals g set reached_at = $2
       from events e
      where g.event_id = $1 and e.id = g.event_id and g.reached_at is null and e.hype_count >= g.threshold
      returning g.threshold, g.reward`, [eventId, now]);
}

/** Unlocks goals the count just passed, and tells the organiser so they can deliver. */
export async function hypeGoalsReached(q: Queryable, eventId: string, now: Date) {
  const reached = await reachHypeGoals(q, eventId, now);
  if (!reached.length) return reached;
  const ev = await one<any>(q, 'select title, organizer_id from events where id = $1', [eventId]);
  for (const g of reached) {
    await notifyOrganizer(q, now, {
      organizerId: ev.organizer_id, topic: 'tickets', kind: 'hype', dedupeKey: `hype-goal:${eventId}:${g.threshold}`,
      title: L(`${ev.title} reached ${g.threshold.toLocaleString('en-US')} hype`, `${ev.title} đạt ${g.threshold.toLocaleString('vi-VN')} hype`),
      body: L(`Time to unlock: ${g.reward.en || g.reward.vi}`, `Đến lúc mở khoá: ${g.reward.vi}`),
      link: { screen: 'dash', eventId },
    });
  }
  return reached;
}

/** Tells whoever sent in a community event what the moderators decided. */
export async function notifySubmitter(q: Queryable, ev: { id: string; title: string; submitted_by: string | null; slug: string }, now: Date, decision: 'live' | 'rejected', reason?: Localized) {
  if (!ev.submitted_by) return;
  await notifyUser(q, now, {
    userId: ev.submitted_by, topic: null, kind: decision === 'live' ? 'submission_live' : 'submission_rejected',
    dedupeKey: `submission:${ev.id}:${decision}:${now.toISOString().slice(0, 13)}`,
    title: decision === 'live' ? L(`${ev.title} is live — thank you`, `${ev.title} đã lên sóng — cảm ơn bạn`) : L(`${ev.title} was not published`, `${ev.title} chưa được đăng`),
    body: decision === 'live'
      ? L('People can now find it, hype it and talk about it.', 'Mọi người đã có thể tìm, hype và thảo luận về sự kiện.')
      : reason ?? L('A moderator could not confirm the details.', 'Kiểm duyệt viên chưa xác nhận được thông tin.'),
    link: { screen: 'event', eventId: ev.id },
  });
}

/** A display name that is never empty. */
export const nameOf = (name: string | null | undefined) => (name && name.trim()) || 'FeestFinder member';
