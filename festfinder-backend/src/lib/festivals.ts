import { L, type Localized } from './i18n.ts';
import { plainText } from './places.ts';

/*
 * The festival brands Feest Radar watches for (owner, 2026-10-17). `world` brands are the
 * biggest electronic festivals on earth: an edition anywhere in Asia FeestFinder knows is kept
 * even in a city not launched yet, always highlighted, and first in the review queue. `asia`
 * brands are the region's own big festivals: they weigh in a night's fit but carry no badge.
 * A brand is read from the title only (a description may name a festival a DJ once played).
 */

export type FestivalTier = 'world' | 'asia';
export interface FestivalBrand { key: string; name: string; tier: FestivalTier; pattern: RegExp }

const B = (key: string, name: string, tier: FestivalTier, pattern: RegExp): FestivalBrand => ({ key, name, tier, pattern });

// Patterns run on plainText (lowercase, no accents, punctuation as spaces), padded with spaces.
export const FESTIVAL_BRANDS: FestivalBrand[] = [
  B('tomorrowland', 'Tomorrowland', 'world', / tomorrowland /),
  B('ultra', 'Ultra', 'world', / (ultra (music festival|japan|korea|singapore|bali|thailand|taiwan|china|beijing|shanghai|hong kong|philippines|india|asia|europe|miami|south africa))|road to ultra|umf /),
  B('edc', 'EDC', 'world', / (edc|electric daisy carnival) /),
  B('defqon', 'Defqon.1', 'world', / defqon /),
  B('verknipt', 'Verknipt', 'world', / verknipt /),
  B('creamfields', 'Creamfields', 'world', / creamfields /),
  B('mysteryland', 'Mysteryland', 'world', / mysteryland /),
  B('awakenings', 'Awakenings', 'world', / awakenings (festival|asia|japan|thailand|bali|korea|singapore|presents|x) /),
  B('time-warp', 'Time Warp', 'world', / time warp /),
  B('qlimax', 'Qlimax', 'world', / qlimax /),
  B('sensation', 'Sensation', 'world', / sensation (white|rise|the legacy|innerspace) /),
  B('untold', 'Untold', 'world', / untold (festival|dubai|asia) /),
  B('parookaville', 'Parookaville', 'world', / parookaville /),
  B('dreamstate', 'Dreamstate', 'world', / dreamstate /),
  B('beyond-wonderland', 'Beyond Wonderland', 'world', / beyond wonderland /),
  B('asot', 'A State of Trance', 'world', / (a state of trance|asot) /),
  B('s2o', 'S2O', 'asia', / s2o /),
  B('zoukout', 'ZoukOut', 'asia', / zouk ?out /),
  B('dwp', 'Djakarta Warehouse Project', 'asia', / (djakarta warehouse project|dwp( ?\d{2,4})?) /),
  B('wonderfruit', 'Wonderfruit', 'asia', / wonderfruit /),
  B('sunburn', 'Sunburn', 'asia', / sunburn (festival|goa|arena|reload) /),
  B('808', '808 Festival', 'asia', / 808 festival /),
  B('ravolution', 'Ravolution', 'asia', / ravolution /),
  B('epizode', 'Epizode', 'asia', / epizode /),
  B('spectrum', 'Spectrum Dance Music Festival', 'asia', / spectrum (dance music )?festival /),
  B('storm', 'Storm Festival', 'asia', / storm (electronic music )?festival /),
  B('world-dj-festival', 'World DJ Festival', 'asia', / world dj festival /),
  B('its-the-ship', "It's the Ship", 'asia', / it ?s the ship /),
];

/** The festival a title names, if it is one Feest Radar watches. */
export function festivalOf(title: string | null | undefined): FestivalBrand | null {
  if (!title) return null;
  const t = ` ${plainText(title)} `;
  return FESTIVAL_BRANDS.find((b) => b.pattern.test(t)) ?? null;
}

export const festivalByKey = (key: string | null | undefined): FestivalBrand | null => (key ? FESTIVAL_BRANDS.find((b) => b.key === key) ?? null : null);

/** The highlight a world festival wears on the site. */
export const FLAGSHIP_LABEL: Localized = L('World-class festival', 'Lễ hội lớn thế giới');
