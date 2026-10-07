/** What /saved reads from the API (festfinder-backend/src/routes/collections.ts and me.ts). */
import type { Card } from '../../types';

/** One of my collections (present() in routes/collections.ts). `has` only when asked about one event. */
export interface Collection {
  id: string;
  name: string;
  isPublic: boolean;
  /** The public page's address, once the link is on. */
  url: string | null;
  slug: string | null;
  count: number;
  has?: boolean;
}

/** A card as /me/saves and /me/collections/:id send it: with the reader's own flags. */
export type SavedCard = Card & { viewer?: { saved: boolean } | null };

/** GET /me/saves: a page of saved events, upcoming first, then the past ones newest first. */
export interface SavesPage { items: SavedCard[]; nextCursor: string | null }

/** GET /me/collections/:id. */
export interface CollectionItems { collection: Collection; items: SavedCard[] }

const at = (e: Card) => Date.parse(e.startsAt ?? e.startsOn ?? '') || 0;

/** Upcoming soonest first, then the past ones most recent first. */
export function byDate<T extends Card>(items: T[]): T[] {
  const up = items.filter((e) => !e.past).sort((a, b) => at(a) - at(b));
  const past = items.filter((e) => e.past).sort((a, b) => at(b) - at(a));
  return [...up, ...past];
}

/** /saved's address for a collection (or all saved), in the reader's language. */
export function savedHref(id: string | null, lang: 'vi' | 'en'): string {
  const q = [id ? 'c=' + encodeURIComponent(id) : '', lang === 'en' ? 'lang=en' : ''].filter(Boolean).join('&');
  return '/saved' + (q ? '?' + q : '');
}
