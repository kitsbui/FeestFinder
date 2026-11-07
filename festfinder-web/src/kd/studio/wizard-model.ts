/** The Studio wizard's form (wizard.tsx): its fields, what is kept on this device, what the API takes, what is missing. */
import type { Pair } from '../copy';
import { STYLE_LABEL } from '../genre';

/** The styles an organiser picks from (lib/styles.ts): at most five, the first is the main one. */
export const STYLES = Object.keys(STYLE_LABEL);
export const STYLE_MAX = 5;
/** The styles most nights are (design v2 phase 9): shown first; the rest come with the search or "Thêm dòng nhạc". */
export const COMMON_STYLES = ['techno', 'hard-techno', 'melodic-techno', 'house', 'tech-house', 'trance', 'psytrance', 'drum-and-bass', 'edm', 'mainstage'];
export const AGES = ['All ages', '16+', '18+'] as const;
export const NAME_MAX = 60;
/** The form filled before signing in, kept on this device until it becomes a draft. */
const LOCAL = 'ff:wizard';
export const STEP_KEYS = ['basics', 'when', 'tickets', 'review'] as const;
export function readLocal(): Partial<Form> | null {
  try { const v = JSON.parse(localStorage.getItem(LOCAL) || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; }
}
export function writeLocal(f: Form | null) {
  try { if (f) localStorage.setItem(LOCAL, JSON.stringify(f)); else localStorage.removeItem(LOCAL); } catch { /* storage blocked */ }
}

export interface City { slug: string; name: Pair; currency: string; timezone?: string }
export interface Venue { id: string; name: string; address: string | null; area: string | null }
export interface Form {
  title: string; styles: string[]; description: string; lineup: string[];
  logoUrl: string | null; coverUrl: string | null; eventUrl: string;
  date: string; start: string; end: string;
  venueId: string | null; venueName: string; city: string; age: (typeof AGES)[number];
  entryMode: 'paid' | 'free'; price: string; ticketUrl: string; register: boolean;
}
export interface Draft {
  id: string; slug: string; status: string; statusLabel: Pair; title: string; genre: string | null; styles?: string[]; description: Pair | null;
  city: string; currency: string; logoUrl: string | null; coverUrl: string | null;
  startsOn: string | null; startTime: string | null; endTime: string | null;
  venue: { id: string | null; name: string | null };
  entryMode: 'free' | 'paid' | 'donation'; priceFrom: number; age: string | null; lineup: string[] | null;
  ticketUrl: string | null; eventUrl: string | null;
  moderation?: { decision: string; reason: Pair | null; message: string | null; appeal: { state: string; closesAt: string } | null } | null;
}

export const url = (s: string) => {
  const v = s.trim();
  if (!/^https?:\/\/\S+\.\S+/.test(v)) return null;
  try { return new URL(v).href === v || new URL(v).href === v + '/' ? v : new URL(v).href; } catch { return null; }
};
export const int = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;

export function fromDraft(d: Draft | null, orgLogo: string | null, city: string): Form {
  return {
    title: d?.title === 'Untitled event' ? '' : d?.title ?? '',
    styles: (d?.styles ?? []).filter((k) => STYLE_LABEL[k]),
    description: d?.description ? d.description.vi || d.description.en : '',
    lineup: d?.lineup ?? [],
    logoUrl: d ? d.logoUrl : orgLogo,
    coverUrl: d?.coverUrl ?? null,
    eventUrl: d?.eventUrl ?? '',
    date: d?.startsOn ?? '', start: d?.startTime ?? '', end: d?.endTime ?? '',
    venueId: d?.venue.id ?? null, venueName: d?.venue.name ?? '', city: d?.city || city,
    age: (AGES as readonly string[]).includes(d?.age ?? '') ? (d!.age as Form['age']) : '18+',
    entryMode: d?.entryMode === 'free' ? 'free' : 'paid',
    price: d?.priceFrom ? String(d.priceFrom) : '',
    ticketUrl: d?.ticketUrl ?? '',
    register: d?.entryMode === 'free' && !!d.ticketUrl,
  };
}

/** The draft fields the API takes, from the form. Unfinished links and dates go as empty. */
export function payload(f: Form) {
  const desc = f.description.trim();
  return {
    title: f.title.trim(),
    genre: 'EDM',
    styles: f.styles,
    description: { vi: desc, en: desc },
    lineup: f.lineup,
    logoUrl: f.logoUrl,
    coverUrl: f.coverUrl,
    eventUrl: url(f.eventUrl),
    startsOn: f.date || null,
    endsOn: f.date || null,
    startTime: f.start || null,
    endTime: f.end || null,
    venueId: f.venueId,
    venueName: f.venueName.trim() || null,
    ...(f.venueId ? {} : { city: f.city }),
    age: f.age,
    entryMode: f.entryMode,
    ...(f.entryMode === 'paid' ? { priceFrom: int(f.price) } : {}),
    ticketUrl: f.entryMode === 'free' && !f.register ? null : url(f.ticketUrl),
  };
}
export type Payload = ReturnType<typeof payload>;

/** Which steps are complete, and what submit still needs (the API's missingForSubmit, read from the form). */
export function check(f: Form) {
  const p = payload(f);
  const priced = f.entryMode === 'free' || (int(f.price) > 0 && !!p.ticketUrl);
  const missing: { key: string; step: number }[] = [];
  if (!p.title) missing.push({ key: 'mTitle', step: 0 });
  if (!f.styles.length) missing.push({ key: 'mGenre', step: 0 });
  if (!f.logoUrl) missing.push({ key: 'mLogo', step: 0 });
  if (!f.coverUrl) missing.push({ key: 'mCover', step: 0 });
  if (!p.eventUrl) missing.push({ key: 'mEventUrl', step: 0 });
  if (!f.date || !f.start || !f.end) missing.push({ key: 'mDates', step: 1 });
  if (!p.venueName) missing.push({ key: 'mVenue', step: 1 });
  if (!priced) missing.push({ key: 'mPrice', step: 2 });
  const done = [0, 1, 2].map((s) => !missing.some((m) => m.step === s));
  return { missing, done };
}
