/** What the review queue reads from the API (/admin/queue, /admin/events/:id, /admin/appeals, /admin/reject-reasons). */
import type { Pair } from '../../copy';

export type Sla = 'ok' | 'soon' | 'breach';
export type Band = 'low' | 'medium' | 'high';

/** A row of /admin/queue. */
export interface Item {
  id: string; slug: string; title: string; coverUrl: string | null; genre: string | null; logoUrl: string | null;
  organizer: { id: string; name: string; verified: boolean; newOrganizer: boolean; community: boolean };
  submittedBy: { id: string; name: string | null } | null;
  startsOn: string | null; endsOn: string | null; startTime: string | null; endTime: string | null; venueName: string | null; area: string | null;
  currency: string; age: string | null; entryMode: string; priceFrom: number; venueResolved: boolean; qualityScore: number | null;
  flagged: boolean; flag: { code: string; label: Pair } | null;
  waitingMinutes: number; sla: { state: Sla; label: Pair };
  riskScore: number; riskBand: Band; threadMessages: number;
  signals: { ok: boolean; label: Pair }[];
  /** 'revision': an organiser's change to a live listing, which stays live meanwhile (migration 040). */
  kind?: 'listing' | 'revision';
  changes?: { field: string; before: unknown; after: unknown }[];
  /** Feest Radar's find, or posted here; how well it suits FeestFinder (festfinder-backend services/ingest/fit.ts). */
  origin?: 'posted' | 'radar';
  festival?: { key: string; name: string; flagship: boolean } | null;
  fit?: { score: number; band: FitBand; bandLabel: Pair; reasons: { key: string; points: number; label: Pair }[] } | null;
}

export type FitBand = 'recommend' | 'consider' | 'skip';

/** /admin/reject-reasons. */
export interface Reason { code: string; label: Pair; template: Pair; appealAllowed: boolean }

/** /admin/events/:id, the parts the review panel shows. */
export interface Listing {
  id: string; slug: string; status: string; statusLabel: Pair; title: string; genre: string | null; description: Pair | null;
  currency: string; logoUrl: string | null; coverUrl: string | null;
  startsOn: string | null; endsOn: string | null; startTime: string | null; endTime: string | null;
  venue: { id: string | null; name: string | null; address: string | null; area: string | null; resolved: boolean };
  entryMode: 'free' | 'paid' | 'donation'; priceFrom: number; capacity: number | null; age: string; lineup: string[];
  ticketUrl: string | null; eventUrl: string | null; brandUrl: string | null; ticketLinkStatus: 'ok' | 'broken' | 'unchecked' | null;
  submittedAt: string | null; waitingMinutes: number | null;
  quality: { score: number; checks: { key: string; ok: boolean; points: number; label: Pair }[] };
  flag: { code: string; label: Pair | null } | null;
  risk: { score: number; band: Band; factors: { bad: boolean; weight: number; label: Pair }[]; signals: { ok: boolean; label: Pair }[] };
  organizer: { id: string; slug: string; name: string; verified: boolean; state: string; strikes: number; suspended: boolean; logoUrl: string | null; community: boolean } | null;
  submittedBy: { id: string; name: string | null; phone: string | null; published: number } | null;
  sourceUrl: string | null;
  tiers: { id: string; key: string; name: Pair | string; price: number; capacity: number; sold: number }[];
  decisions: { id: string; decision: string; reason: Pair | null; by: string | null; at: string }[];
  reports: { code: string; label: Pair | null; count: number }[];
  thread: { id: string; messages: number } | null;
  publicUrl: string;
}

export interface Appeal {
  id: string; eventId: string; title: string; coverUrl: string | null; organizer: string; state: 'open' | 'replied'; stateLabel: Pair;
  reasonCode: string; reason: Pair | null; message: string; reply: string | null; rejectedAt: string; closesInDays: number;
}

/** A decision held five seconds before it is sent. */
export type Verb = 'approve' | 'reject' | 'fix';
export interface Held { verb: Verb; ids: string[]; title: string; reason: Reason | null; message?: string; allowAppeal?: boolean; timer: number }

/** Minutes as "45 phút" / "3 giờ 05 phút". */
export const duration = (min: number, lang: 'vi' | 'en') =>
  min < 60 ? `${min} ${lang === 'vi' ? 'phút' : 'min'}` : `${Math.floor(min / 60)}${lang === 'vi' ? ' giờ' : 'h'} ${min % 60}${lang === 'vi' ? ' phút' : 'm'}`;
