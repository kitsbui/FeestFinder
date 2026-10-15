import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { initialsOf, slugify } from '../lib/contact.ts';
import { randomCode } from '../lib/crypto.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { cityLabel } from '../lib/places.ts';
import { EVENT_TYPE_LABEL, type EventType } from '../lib/styles.ts';
import { styleItem } from './artists.ts';

/*
 * Projects (migration 034): an idea for a night and what it needs, from anyone; offers to take
 * part, from anyone else. FeestFinder connects and never handles the money: an accepted offer
 * only shows both sides each other's contact.
 */

export const SEEKING = ['investment', 'sponsorship', 'artists', 'venue', 'partner'] as const;
export type Seeking = (typeof SEEKING)[number];
export const OFFER_KINDS = ['invest', 'sponsor', 'perform', 'venue', 'partner'] as const;
export type OfferKind = (typeof OFFER_KINDS)[number];

/** Which need each kind of offer answers. */
export const ANSWERS: Record<OfferKind, Seeking> = { invest: 'investment', sponsor: 'sponsorship', perform: 'artists', venue: 'venue', partner: 'partner' };

export const SEEKING_LABEL: Record<Seeking, Localized> = {
  investment: L('Investment', 'Đầu tư'),
  sponsorship: L('Sponsors', 'Tài trợ'),
  artists: L('Artists', 'Nghệ sĩ'),
  venue: L('A venue', 'Địa điểm'),
  partner: L('An organising partner', 'Đối tác tổ chức'),
};
export const OFFER_LABEL: Record<OfferKind, Localized> = {
  invest: L('Invest', 'Đầu tư'),
  sponsor: L('Sponsor', 'Tài trợ'),
  perform: L('Perform', 'Biểu diễn'),
  venue: L('Host it', 'Cho mượn địa điểm'),
  partner: L('Run it together', 'Cùng tổ chức'),
};

/** What every project page says once: FeestFinder introduces, it does not invest or hold money. */
export const DISCLAIMER = L(
  'FeestFinder introduces the people behind a project and those who want to back it. It does not take, hold or move money, and nothing here is an offer of securities: agree terms directly, and check who you deal with.',
  'FeestFinder giới thiệu người làm dự án với những ai muốn đồng hành. FeestFinder không nhận, giữ hay chuyển tiền, và nội dung ở đây không phải lời chào bán chứng khoán: các bên tự thoả thuận trực tiếp và tự kiểm chứng đối tác.',
);

/** The pages a project's slug cannot take (they are /p's own). */
const RESERVED = new Set(['new', 'mine', 'en']);

export async function newSlug(q: Queryable, title: string): Promise<string> {
  const base = slugify(title).slice(0, 80).replace(/-+$/, '') || 'project';
  let slug = RESERVED.has(base) || base.length < 3 ? `${base}-du-an` : base;
  while (await one(q, 'select 1 from projects where slug = $1', [slug])) slug = `${base}-${randomCode(4).toLowerCase()}`;
  return slug;
}

/** Why a draft cannot go to review yet, or an empty list. */
export function missingForReview(p: { title: string; pitch: string; story: string; seeking: string[] }): Localized[] {
  const out: Localized[] = [];
  if (p.title.trim().length < 5) out.push(L('A title', 'Tên dự án'));
  if (p.pitch.trim().length < 20) out.push(L('A one-line pitch of 20 characters or more', 'Một câu giới thiệu từ 20 ký tự'));
  if (p.story.trim().length < 120) out.push(L('The idea, in 120 characters or more', 'Ý tưởng, từ 120 ký tự'));
  if (!p.seeking.length) out.push(L('What the project needs', 'Dự án cần gì'));
  return out;
}

export interface ProjectViewer { userId: string | null; isAdmin: boolean }

/** A project as the screens show it; the owner's own fields only to the owner and the team. */
export function presentProject(p: any, opts: { packages?: any[]; counts?: Record<string, number>; viewer?: ProjectViewer; event?: { slug: string; title: string } | null } = {}) {
  const mine = !!opts.viewer && (opts.viewer.userId === p.owner_user_id || opts.viewer.isAdmin);
  return {
    id: p.id as string,
    slug: p.slug as string,
    title: p.title as string,
    pitch: p.pitch as string,
    story: p.story as string,
    city: { slug: p.city as string, label: cityLabel(p.city) },
    styles: (p.styles as string[]).map(styleItem),
    eventType: p.event_type ? { key: p.event_type as string, label: EVENT_TYPE_LABEL[p.event_type as EventType] } : null,
    targetOn: p.target_on ? String(p.target_on).slice(0, 10) : null,
    capacity: p.capacity as number | null,
    budget: p.budget == null ? null : Number(p.budget),
    raiseAmount: p.raise_amount == null ? null : Number(p.raise_amount),
    currency: p.currency as string,
    seeking: (p.seeking as Seeking[]).map((k) => ({ key: k, label: SEEKING_LABEL[k] })),
    coverUrl: p.cover_url as string | null,
    status: p.status as string,
    publishedAt: p.published_at as Date | null,
    updatedAt: p.updated_at as Date,
    owner: { name: (p.owner_name as string | null)?.trim() || null, initials: initialsOf(p.owner_name || 'FF') },
    event: opts.event ?? null,
    packages: (opts.packages ?? []).map((k) => ({ id: k.id, title: k.title, amount: Number(k.amount), perks: k.perks, slots: k.slots })),
    /** Accepted offers by kind: who is on board already. */
    onBoard: opts.counts ?? {},
    disclaimer: DISCLAIMER,
    ...(mine ? { mine: true, decisionNote: p.decision_note as string | null, missing: p.status === 'draft' || p.status === 'rejected' ? missingForReview(p) : [] } : {}),
  };
}

export const PROJECT = `select p.*, u.name as owner_name from projects p join users u on u.id = p.owner_user_id`;

/** A project with what its page shows around it: packages, accepted offers by kind, its event. */
export async function loadProject(q: Queryable, where: { slug?: string; id?: string }) {
  const p = await one<any>(q, `${PROJECT} where ${where.id ? 'p.id = $1' : 'p.slug = $1'}`, [where.id ?? where.slug]);
  if (!p) return null;
  const [packages, accepted, event] = await Promise.all([
    many<any>(q, 'select * from project_packages where project_id = $1 order by sort, amount desc', [p.id]),
    many<{ kind: string; n: number }>(q, `select kind, count(*)::int as n from project_offers where project_id = $1 and status = 'accepted' group by kind`, [p.id]),
    p.event_id ? one<{ slug: string; title: string }>(q, `select slug, title from events where id = $1 and status in ('live', 'cancelled')`, [p.event_id]) : null,
  ]);
  return { p, packages, counts: Object.fromEntries(accepted.map((r) => [r.kind, r.n])), event };
}

/** The sponsors an event shows: accepted sponsor offers on the project it came from. */
export async function sponsorsOf(q: Queryable, eventId: string): Promise<{ name: string }[]> {
  return many<{ name: string }>(q,
    `select distinct coalesce(nullif(o.org_name, ''), u.name) as name
       from projects p join project_offers o on o.project_id = p.id join users u on u.id = o.user_id
      where p.event_id = $1 and p.status = 'realized' and o.kind = 'sponsor' and o.status = 'accepted'
        and coalesce(nullif(o.org_name, ''), u.name) is not null
      order by 1`, [eventId]);
}
