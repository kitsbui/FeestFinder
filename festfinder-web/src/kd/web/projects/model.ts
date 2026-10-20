/**
 * Projects as GET /projects and /projects/:slug give them (festfinder-backend
 * src/services/projects.ts presentProject): an idea for a night, what it is looking for, and
 * who offered. FeestFinder connects; it never handles the money.
 */
import { type Dict, type Lang, type Pair, tx } from '../../copy';

export interface Keyed { key: string; label: Pair }
export interface LineupArtist { slug: string; name: string; imageUrl: string | null; claimed: boolean }
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
  currency: string;
  /** Real accounts waiting for the night (one per person), the owner's target, and whether the viewer is one. */
  waitlist: { count: number; target: number | null; joined: boolean };
  seeking: Keyed[];
  coverUrl: string | null;
  /** The project's own page: a website or a social page. */
  link: string | null;
  /** The artists it wants, each a profile (run by the artist, or waiting to be claimed). */
  lineup: LineupArtist[];
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

/** The currencies a budget is given in (the API checks the same), and the round amounts offered for each. */
export const CURRENCIES = ['VND', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];
export const asCurrency = (c: string | null | undefined): Currency => (c === 'VND' || c === 'USD' ? c : 'USD');
export const BUDGET_PRESETS: Record<Currency, number[]> = {
  VND: [50_000_000, 100_000_000, 200_000_000, 500_000_000, 1_000_000_000, 2_000_000_000],
  USD: [2_000, 5_000, 10_000, 25_000, 50_000, 100_000],
};
export const WAITLIST_PRESETS = [100, 300, 500, 1000, 2000];

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

export const text = (v: Pair | null | undefined, lang: Lang) => (v ? tx(v, lang) || v.vi || v.en || '' : '');
