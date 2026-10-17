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

export const FAMILY_LABEL: Record<Family, { vi: string; en: string }> = {
  fest: { vi: 'Lễ hội', en: 'Festival' },
  live: { vi: 'Nhạc sống', en: 'Live music' },
  edm: { vi: 'EDM', en: 'EDM' },
  cult: { vi: 'Văn hoá', en: 'Culture' },
  free: { vi: 'Miễn phí', en: 'Free' },
};

/** The CSS class that sets --g for a family. */
export const g = (f: Family) => `kd-g-${f}`;

/*
 * FeestFinder lists electronic music only, so every event is the edm family; people choose
 * between its styles (festfinder-backend/src/lib/styles.ts, the same keys and names).
 */
export const STYLE_LABEL: Record<string, { vi: string; en: string }> = Object.fromEntries(([
  ['techno', 'Techno'], ['hard-techno', 'Hard techno'], ['acid-techno', 'Acid techno'], ['industrial-techno', 'Industrial techno'],
  ['melodic-techno', 'Melodic house & techno'], ['minimal', 'Minimal / deep tech'],
  ['house', 'House'], ['tech-house', 'Tech house'], ['deep-house', 'Deep house'], ['progressive-house', 'Progressive house'],
  ['afro-house', 'Afro house'], ['organic-house', 'Organic house'], ['bass-house', 'Bass house'], ['nu-disco', 'Nu disco'],
  ['indie-dance', 'Indie dance'], ['amapiano', 'Amapiano'],
  ['trance', 'Trance'], ['psytrance', 'Psytrance'], ['hard-dance', 'Hard dance'], ['hardstyle', 'Hardstyle'], ['rawstyle', 'Rawstyle'], ['hardcore', 'Hardcore'],
  ['gabber', 'Gabber'], ['dubstep', 'Dubstep'], ['drum-and-bass', 'Drum & bass'], ['breakbeat', 'Breakbeat'], ['uk-garage', 'UK garage'],
  ['future-bass', 'Trap & future bass'], ['bass', 'Bass'], ['electro', 'Electro'],
  ['edm', 'EDM'], ['mainstage', 'Mainstage'],
] as const).map(([k, l]) => [k, { vi: l, en: l }]));

export const styleLabel = (key: string, lang: 'vi' | 'en') => STYLE_LABEL[key]?.[lang] ?? key;

/** The styles worth a chip: those with events under the other filters, most first. */
export function styleChips(counts: Record<string, number> | null | undefined, max = 8): string[] {
  return Object.entries(counts ?? {}).filter(([k, n]) => n > 0 && STYLE_LABEL[k]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([k]) => k);
}
