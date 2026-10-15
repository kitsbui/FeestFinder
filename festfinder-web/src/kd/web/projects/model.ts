/**
 * Projects as GET /projects and /projects/:slug give them (festfinder-backend
 * src/services/projects.ts presentProject): an idea for a night, what it is looking for, and
 * who offered. FeestFinder connects; it never handles the money.
 */
import type { Dict, Pair } from '../../copy';

export interface Keyed { key: string; label: Pair }
export interface Package { id: string; title: string; amount: number; perks: string; slots: number | null }

export interface Project {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  story: string;
  city: { slug: string; label: Pair | null };
  styles: (Keyed & { genre: string | null })[];
  eventType: Keyed | null;
  targetOn: string | null;
  capacity: number | null;
  budget: number | null;
  raiseAmount: number | null;
  currency: string;
  seeking: Keyed[];
  coverUrl: string | null;
  status: 'draft' | 'in_review' | 'open' | 'closed' | 'realized' | 'rejected';
  owner: { name: string | null; initials: string };
  event: { slug: string; title: string } | null;
  packages: Package[];
  /** Accepted offers by kind. */
  onBoard: Record<string, number>;
  disclaimer: Pair;
  /** The owner's (and the team's) own fields. */
  mine?: boolean;
  decisionNote?: string | null;
  missing?: Pair[];
  myOffers?: { id: string; kind: OfferKind; status: 'sent' | 'accepted' }[];
}

export interface ProjectList { items: Project[]; total: number; seeking: Record<Seeking, number>; nextOffset: number | null }

export const SEEKING = ['investment', 'sponsorship', 'artists', 'venue', 'partner'] as const;
export type Seeking = (typeof SEEKING)[number];
export const OFFER_KINDS = ['sponsor', 'invest', 'perform', 'venue', 'partner'] as const;
export type OfferKind = (typeof OFFER_KINDS)[number];
/** Which need each kind of offer answers (the API checks the same). */
export const ANSWERS: Record<OfferKind, Seeking> = { invest: 'investment', sponsor: 'sponsorship', perform: 'artists', venue: 'venue', partner: 'partner' };

export const SEEKING_LABEL = {
  investment: { en: 'Investment', vi: 'Đầu tư' },
  sponsorship: { en: 'Sponsors', vi: 'Tài trợ' },
  artists: { en: 'Artists', vi: 'Nghệ sĩ' },
  venue: { en: 'A venue', vi: 'Địa điểm' },
  partner: { en: 'A partner', vi: 'Đối tác tổ chức' },
} satisfies Dict;
export const OFFER_LABEL = {
  invest: { en: 'Invest', vi: 'Đầu tư' },
  sponsor: { en: 'Sponsor', vi: 'Tài trợ' },
  perform: { en: 'Perform', vi: 'Biểu diễn' },
  venue: { en: 'Host it', vi: 'Cho mượn địa điểm' },
  partner: { en: 'Run it together', vi: 'Cùng tổ chức' },
} satisfies Dict;

export const text = (v: Pair | null | undefined, lang: 'vi' | 'en') => (v ? v[lang] || v.vi || v.en || '' : '');
