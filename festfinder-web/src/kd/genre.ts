/**
 * Genre families: Kính đêm's taxonomy, one colour and one shape each (README §3.3). The
 * grouping is GENRE_TONE in src/runtime/ff.ts, where `culture` is `cult` here.
 */
export type Family = 'fest' | 'live' | 'edm' | 'cult' | 'free';

const FAMILY: Record<string, Exclude<Family, 'free'>> = {
  Festival: 'fest',
  EDM: 'edm',
  Indie: 'live',
  Rock: 'live',
  'Hip-Hop': 'live',
  Pop: 'live',
  Jazz: 'live',
  Food: 'cult',
  Culture: 'cult',
};

/** The family of an API genre. An event with no known genre wears the free ring (the old brand tone). */
export function familyOf(genre: string | null | undefined): Family {
  return (genre && FAMILY[genre]) || 'free';
}

/** The order charts stack families in: checked for colour-blind separation on the dark ground. */
export const CHART_ORDER: Exclude<Family, 'free'>[] = ['fest', 'live', 'edm', 'cult'];

/** The API genres in each family, for filters that ask the API by genre. */
export const FAMILY_GENRES: Record<Exclude<Family, 'free'>, string[]> = {
  fest: ['Festival'],
  live: ['Indie', 'Rock', 'Hip-Hop', 'Pop', 'Jazz'],
  edm: ['EDM'],
  cult: ['Food', 'Culture'],
};

export const FAMILY_LABEL: Record<Family, { vi: string; en: string }> = {
  fest: { vi: 'Lễ hội', en: 'Festival' },
  live: { vi: 'Nhạc sống', en: 'Live music' },
  edm: { vi: 'EDM', en: 'EDM' },
  cult: { vi: 'Văn hoá', en: 'Culture' },
  free: { vi: 'Miễn phí', en: 'Free' },
};

/** The CSS class that sets --g for a family. */
export const g = (f: Family) => `kd-g-${f}`;
