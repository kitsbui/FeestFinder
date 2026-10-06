/**
 * Where the app is looking, kept on this device only (a per-viewer convenience, never sent
 * anywhere but as a filter): the chosen city, the last known position, the genres picked at
 * onboarding. Storage can be blocked; every read falls back to nothing.
 */
import type { Family } from '../genre';

const KEY = { city: 'ff_city', at: 'ff_at', likes: 'ff_likes', lang: 'ff_lang' } as const;

function read(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function write(k: string, v: string | null) {
  try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage blocked */ }
}

export const place = {
  city: () => read(KEY.city),
  setCity: (slug: string) => write(KEY.city, slug),
  /** The last position the person shared, at most a day old. */
  at: (): { lat: number; lng: number } | null => {
    try {
      const v = JSON.parse(read(KEY.at) || 'null');
      return v && Date.now() - v.t < 86_400_000 ? { lat: v.lat, lng: v.lng } : null;
    } catch { return null; }
  },
  setAt: (p: { lat: number; lng: number }) => write(KEY.at, JSON.stringify({ lat: +p.lat.toFixed(3), lng: +p.lng.toFixed(3), t: Date.now() })),
  likes: (): Family[] => {
    try { return JSON.parse(read(KEY.likes) || '[]'); } catch { return []; }
  },
  setLikes: (f: Family[]) => write(KEY.likes, JSON.stringify(f)),
  /** Whether this device has been through onboarding (a city or a position). */
  known: () => !!(read(KEY.city) || read(KEY.at)),
  lang: (): 'vi' | 'en' | null => { const v = read(KEY.lang); return v === 'en' || v === 'vi' ? v : null; },
  setLang: (l: 'vi' | 'en') => write(KEY.lang, l),
};

/** Kilometres between two points. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number | null; lng: number | null }): number | null {
  if (b.lat == null || b.lng == null) return null;
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** The nearest listed city to a position, from /meta/discovery's centres. */
export function nearestCity<C extends { slug: string; center: [number, number] | null }>(cities: C[], at: { lat: number; lng: number }): C | null {
  let best: C | null = null, bestD = Infinity;
  for (const c of cities) {
    if (!c.center) continue;
    const d = distanceKm(at, { lng: c.center[0], lat: c.center[1] }) ?? Infinity;
    if (d < bestD) { best = c; bestD = d; }
  }
  return best;
}
