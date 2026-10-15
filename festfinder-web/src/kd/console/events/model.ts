'use client';
/**
 * What the events screens share: the shapes /admin/events returns, the listed cities with their
 * timezones (/meta/discovery), and the guard that asks before unsaved changes are left behind.
 */
import { useEffect, useState } from 'react';
import { FF } from '@/runtime/ff';
import type { Pair } from '../../copy';

export type Status = 'draft' | 'in_review' | 'live' | 'rejected' | 'removed' | 'cancelled';

/** A catalogue row (presentRow in routes/admin/ops.ts). */
export interface EventRow {
  id: string; slug: string; title: string; coverUrl: string | null; status: Status; statusLabel: Pair; genre: string | null; area: string | null;
  venueName: string | null; venueResolved: boolean; startsOn: string | null; endsOn: string | null; startTime: string | null; endTime: string | null;
  entryMode: 'free' | 'paid' | 'donation'; priceFrom: number; capacity: number | null;
  organizer: { id: string; name: string; verified: boolean };
  featured: boolean; badge: string | null; hype: number; saves: number; sold: number; openReports: number; currency?: string;
}

export interface Tier {
  id?: string; key: string; name: Pair; note: Pair | null; price: number; capacity: number; sold: number; isLast: boolean;
  salesOpenAt: string | null; priceRiseOn: string | null; priceRiseTo: number | null;
}

/** One listing as the team sees it (eventDetail in routes/admin/ops.ts). */
export interface EventDetail {
  id: string; slug: string; status: Status; statusLabel: Pair; title: string; genre: string | null; description: Pair | null;
  city: string; currency: string; styles: string[]; eventType: string | null; logoUrl: string | null; coverUrl: string | null;
  startsOn: string | null; endsOn: string | null; startTime: string | null; endTime: string | null;
  venue: { id: string | null; name: string | null; address: string | null; area: string | null; resolved: boolean };
  entryMode: 'free' | 'paid' | 'donation'; priceFrom: number; capacity: number | null; age: string | null; lineup: string[] | null;
  ticketUrl: string | null; eventUrl: string | null; brandUrl: string | null;
  featured: boolean; badge: string | null; heldForReports: boolean; createdAt: string; updatedAt: string;
  organizer: { id: string; name: string; verified: boolean; logoUrl: string | null } | null;
  tiers: Tier[];
  decisions: { id: string; decision: string; reason: Pair | null; message: string | null; by: string | null; at: string }[];
  appeal: { state: string; reply: string | null } | null;
  metrics: { views: number; clicks: number; saves: number; hype: number; tickets: number; gross: number; refunded: number };
  history: { seq: number; at: string; actorType: string; actor: string; label: Pair; diff: { field: string; before: string; after: string }[] }[];
  shelves: { id: string; name: Pair }[];
  publicUrl: string;
  message?: Pair;
}

export interface City { slug: string; name: Pair; timezone: string; currency: string }
interface Places { defaultCity: string; cities: City[] }

/** The listed cities and the default one, read once per page. */
export function usePlaces(): Places | null {
  const [p, setP] = useState<Places | null>(null);
  useEffect(() => { FF.once('console:discovery', () => FF.get('/meta/discovery')).then(setP, () => setP({ defaultCity: '', cities: [] })); }, []);
  return p;
}

/**
 * While `dirty`, closing or reloading the tab asks the browser's question, and a click on a link
 * to another page asks ours first.
 */
export function useLeaveGuard(dirty: boolean, message: string) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const to = new URL(a.href, location.href);
      if (to.origin === location.origin && to.pathname === location.pathname) return;
      if (!window.confirm(message)) { e.preventDefault(); e.stopPropagation(); }
    };
    addEventListener('beforeunload', unload);
    document.addEventListener('click', click, true);
    return () => { removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true); };
  }, [dirty, message]);
}

/** The status tone for a pill. */
export const statusTone = (s: Status) => (s === 'live' ? 'ok' : s === 'in_review' ? 'warn' : s === 'draft' ? 'none' : 'bad') as 'ok' | 'warn' | 'none' | 'bad';
