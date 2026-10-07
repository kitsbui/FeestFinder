/**
 * What the API answers, as the Kính đêm screens read it (festfinder-backend/src/presenters
 * and routes). Only the fields the screens use are typed.
 */
import type { Pair } from './copy';

export interface Card {
  id: string;
  slug: string;
  title: string;
  genre: string | null;
  coverUrl: string | null;
  badge: { key: string; label: Pair } | null;
  featured: boolean;
  soldOut: boolean;
  /** 'live', or 'cancelled' for a listing its organiser called off (still listed, marked). */
  status?: string;
  past: boolean;
  startsOn: string | null;
  endsOn: string | null;
  startTime: string | null;
  endTime: string | null;
  startsAt: string | null;
  endsAt: string | null;
  venue: { id: string | null; name: string | null; area: string | null; address?: string | null; lat: number | null; lng: number | null };
  city: string;
  cityLabel: Pair;
  timezone: string;
  distanceKm: number | null;
  entryMode: 'free' | 'paid' | 'donation';
  priceFrom: number;
  currency: string;
  styles: string[];
  eventType: string | null;
  isFree: boolean;
  hypeCount: number;
  saveCount: number;
  lineup: string[];
  organizer: { id: string; slug: string; name: string; initials?: string; verified: boolean; logoUrl?: string | null };
  confidence?: { label: string; labelText: Pair; sources: number; sourcesLine: Pair | null } | null;
}

export interface Tier {
  id: string;
  key: string;
  name: Pair;
  note: Pair | null;
  price: number;
  state: 'onsale' | 'last' | 'soldout' | 'soon' | 'closed' | string;
  left: number | null;
  priceRise: { on: string; to: number } | null;
}

export interface TimetableSet { id: string; stageId: string; artist: string; startsAt: string; endsAt: string; startMin: number; endMin: number }
export interface Timetable {
  days: { date: string; label: Pair; window: { startMin: number; endMin: number }; stages: { id: string; name: Pair; sets: TimetableSet[] }[] }[];
}

export interface Clash { a: { id: string; artist: string }; b: { id: string; artist: string }; minutes: number }

export interface EventMine {
  followingOrganizer: boolean;
  followingArtists: string[];
  plan: { setIds: string[]; remindSetIds: string[]; clashes: Clash[] };
  reported: boolean;
}

export interface EventDetail extends Omit<Card, 'organizer'> {
  sources: { provider: string; label: Pair; host: string | null; url: string | null }[];
  artistLinks: { name: string; slug: string }[];
  phase: 'before' | 'live' | 'after' | string;
  community: { submittedBy: { name: string | null } | null; claimable: boolean } | null;
  hype: { count: number; last24h: number; goals: { threshold: number; reward: Pair; reached: boolean }[]; next: { threshold: number; left: number; reward: Pair; progress: number } | null } | null;
  discussion: { total: number; faqCount: number } | null;
  faq: { question: string; answer: string }[];
  resale: { enabled: boolean; count: number; fromPrice: number | null; feePct: number } | null;
  ambassadors: { name: string; initials: string; visits: number }[];
  updates: { id: string; kind: string; kindLabel: Pair | null; body: string; createdAt: string }[];
  description: Pair | null;
  age: string | null;
  capacity: number | null;
  links: { event: string; brand: string | null; tickets: string | null; go: string | null };
  ticketNote: Pair;
  tickets: { tiers: Tier[]; urgency: Pair | null; refundPolicy: Pair | null } | null;
  timetable: Timetable | null;
  hasLiveMode: boolean;
  organizer: Card['organizer'] & { followersCount: number; sinceYear: number | null; art?: string | null } | null;
  similar: Card[];
  viewer: { saved: boolean; hyped: boolean; going: boolean } | null;
  me: EventMine | null;
  /** The viewer's side of the community parts (services/eventpage.ts). */
  mine: { refCode: string | null; broughtVisits: number; watchingResale: boolean; validTickets: number; claim: { organiser: boolean; canClaim: boolean; pending: boolean } | null } | null;
  travel?: string | null;
  entryRules?: string | null;
}

export interface Discussion {
  phase: string;
  kind: string;
  kinds: { kind: string; label: Pair; count: number; open: boolean }[];
  items: Post[];
  nextCursor: string | null;
  total: number;
  me: { canWrite: 'ok' | 'signin' | 'verify_phone' | string; isTeam: boolean };
  rules: Pair | null;
}

export interface Post {
  id: string;
  kind: string;
  parentId: string | null;
  body: string;
  removed: boolean;
  hidden: boolean;
  author: { name: string | null; initials: string; photoUrl: string | null; badges: { key: string; label: Pair }[] } | null;
  set: { id: string; artist: string } | null;
  heardAt: string | null;
  photoUrl: string | null;
  pinned: boolean;
  official: boolean;
  helpfulCount: number;
  replyCount: number;
  createdAt: string;
  me: { mine: boolean; helped: boolean } | null;
  canModerate: boolean;
  replies?: Post[];
}

export interface Resale {
  enabled: boolean;
  phase: string;
  count: number;
  fromPrice: number | null;
  watching: boolean;
  feePct: number;
  items: { id: string; price: number; faceValue: number; tier: Pair | null; seller: { name: string; initials: string }; mine: boolean }[];
  rules: Pair | null;
}
