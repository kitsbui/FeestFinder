import { plainText } from './places.ts';

/*
 * Artists whose name on a lineup says what kind of night it is, after Beatport's best-selling
 * artists by genre (2024 charts, read 2026-10-17) and the headliners of the festivals FeestFinder
 * follows. Feest Radar uses them two ways: a lineup of these artists gives a night its style when
 * the source names none (lib/styles.ts), and each one is a reason a night is worth listing
 * (services/ingest/fit.ts). Only whole lineup names match, never free text, and names that are
 * also ordinary words (Trace, Push, Felix, Serum…) are left out on purpose.
 */

type Entry = [name: string, styles: string[]];

const ENTRIES: Entry[] = [
  // Mainstage / big room / EDM
  ['David Guetta', ['mainstage']], ['W&W', ['mainstage']], ['Tiësto', ['mainstage']], ['Dimitri Vegas & Like Mike', ['mainstage']],
  ['Martin Garrix', ['mainstage']], ['Hardwell', ['mainstage']], ['Afrojack', ['mainstage']], ['Alesso', ['mainstage']],
  ['Steve Aoki', ['mainstage']], ['KSHMR', ['mainstage']], ['Nicky Romero', ['mainstage']], ['Don Diablo', ['mainstage']],
  ['Timmy Trumpet', ['mainstage']], ['R3HAB', ['mainstage']], ['Lost Frequencies', ['edm']], ['Alan Walker', ['edm']],
  ['Zedd', ['edm']], ['Calvin Harris', ['edm']], ['Swedish House Mafia', ['mainstage']], ['Axwell', ['mainstage']],
  ['Steve Angello', ['mainstage']], ['Sebastian Ingrosso', ['mainstage']], ['Gabry Ponte', ['mainstage']], ['Showtek', ['mainstage']],
  ['Sharam', ['mainstage']], ['Kygo', ['edm']], ['Marshmello', ['dubstep', 'edm']], ['Armin van Buuren', ['trance']],
  ['Oliver Heldens', ['house']], ['Meduza', ['house']], ['Joel Corry', ['house']], ['Diplo', ['edm']],
  // Techno
  ['Charlotte de Witte', ['techno']], ['Amelie Lens', ['techno']], ['Adam Beyer', ['techno']], ['Carl Cox', ['techno']],
  ['Richie Hawtin', ['techno']], ['Nina Kraviz', ['techno']], ['Boris Brejcha', ['techno']], ['Enrico Sangiuliano', ['techno']],
  ['Layton Giordani', ['techno']], ['Eli Brown', ['techno']], ['Space 92', ['techno']], ['Marie Vaunt', ['techno']],
  ['Joyhauser', ['techno']], ['Reinier Zonneveld', ['techno']], ['I Hate Models', ['hard-techno']], ['Sara Landry', ['hard-techno']],
  ['Indira Paganotto', ['techno']], ['Kobosil', ['techno']], ['Ben Klock', ['techno']], ['Marcel Dettmann', ['techno']],
  ['Paula Temple', ['techno']], ['Dax J', ['hard-techno']], ['999999999', ['hard-techno']], ['Klangkuenstler', ['hard-techno']],
  ['Nico Moreno', ['hard-techno']], ['Holy Priest', ['hard-techno']], ['Ueberrest', ['hard-techno']], ['SveTec', ['hard-techno']],
  ['Alignment', ['hard-techno']], ['Lilly Palmer', ['techno']], ['Anfisa Letyago', ['techno']], ['HI-LO', ['techno']],
  ['Teenage Mutants', ['techno']], ['Metodi Hristov', ['techno']], ['BYØRN', ['hard-techno']], ['Basswell', ['hard-techno']],
  ['CARV', ['hard-techno']], ['KX CHR', ['hard-techno']], ['Maddix', ['hard-techno', 'mainstage']], ['Luca Agnelli', ['techno']],
  // Melodic house & techno, progressive
  ['Anyma', ['melodic-techno']], ['Tale Of Us', ['melodic-techno']], ['ARTBAT', ['melodic-techno']], ['CamelPhat', ['melodic-techno']],
  ['Argy', ['melodic-techno']], ['Massano', ['melodic-techno']], ['Solomun', ['melodic-techno']], ['Âme', ['melodic-techno']],
  ['Mind Against', ['melodic-techno']], ['Innellea', ['melodic-techno']], ['Agents Of Time', ['melodic-techno']], ['Stephan Bodzin', ['melodic-techno']],
  ['Monolink', ['melodic-techno']], ['Colyn', ['melodic-techno']], ['Kevin de Vries', ['melodic-techno']], ['Eric Prydz', ['progressive-house']],
  ['Lane 8', ['progressive-house']], ['Ben Böhmer', ['progressive-house']], ['Yotto', ['progressive-house']], ['Nora En Pure', ['deep-house']],
  // House, tech house, afro house
  ['FISHER', ['tech-house']], ['Chris Lake', ['tech-house']], ['John Summit', ['tech-house']], ['James Hype', ['tech-house']],
  ['Mau P', ['tech-house']], ['Cloonee', ['tech-house']], ['Dom Dolla', ['tech-house']], ['Vintage Culture', ['house']],
  ['Purple Disco Machine', ['nu-disco']], ['Peggy Gou', ['house']], ['Black Coffee', ['afro-house']], ['Keinemusik', ['afro-house']],
  ['&ME', ['afro-house']], ['Rampa', ['afro-house']], ['Adam Port', ['afro-house']], ['HUGEL', ['afro-house']],
  ['MoBlack', ['afro-house']], ['Francis Mercier', ['afro-house']], ['Enoo Napa', ['afro-house']], ['Disclosure', ['house']],
  ['Fred again..', ['house']], ['Honey Dijon', ['house']], ['Jamie Jones', ['tech-house']], ['Marco Carola', ['tech-house']],
  ['Loco Dice', ['tech-house']], ['Patrick Topping', ['tech-house']], ['Michael Bibi', ['tech-house']], ['Chris Stussy', ['house']],
  ['Mochakk', ['house']], ['Gorgon City', ['house']], ['Hot Since 82', ['tech-house']], ['Duke Dumont', ['house']],
  // Trance and psytrance
  ['Ferry Corsten', ['trance']], ['Aly & Fila', ['trance']], ['Above & Beyond', ['trance']], ['Paul van Dyk', ['trance']],
  ['Markus Schulz', ['trance']], ['Andrew Rayel', ['trance']], ['Cosmic Gate', ['trance']], ['Gareth Emery', ['trance']],
  ['Giuseppe Ottaviani', ['trance']], ['Talla 2XLC', ['trance']], ['Allen Watts', ['trance']], ['Simon Patterson', ['trance']],
  ['Ilan Bluestone', ['trance']], ['Vini Vici', ['psytrance']], ['Infected Mushroom', ['psytrance']], ['Astrix', ['psytrance']],
  ['Ace Ventura', ['psytrance']], ['Neelix', ['psytrance']], ['Captain Hook', ['psytrance']], ['Blastoyz', ['psytrance']],
  // Hardstyle, rawstyle, hardcore
  ['Headhunterz', ['hardstyle']], ['Brennan Heart', ['hardstyle']], ['Sub Zero Project', ['hardstyle']], ['D-Block & S-te-Fan', ['hardstyle']],
  ['Da Tweekaz', ['hardstyle']], ['Wildstylez', ['hardstyle']], ['Coone', ['hardstyle']], ['Phuture Noize', ['hardstyle']],
  ['Ran-D', ['hardstyle']], ['Rebelion', ['rawstyle']], ['Warface', ['rawstyle']], ['Sefa', ['hardcore']],
  ['Angerfist', ['hardcore']], ['Miss K8', ['hardcore']], ['Dr. Peacock', ['hardcore']],
  // Dubstep, bass, bass house, future bass
  ['Skrillex', ['dubstep']], ['Excision', ['dubstep']], ['Subtronics', ['dubstep']], ['Svdden Death', ['dubstep']],
  ['Rezz', ['dubstep']], ['Virtual Riot', ['dubstep']], ['Zeds Dead', ['dubstep']], ['Seven Lions', ['dubstep']],
  ['Kayzo', ['dubstep']], ['Knife Party', ['dubstep']], ['Zomboy', ['dubstep']], ['Wooli', ['dubstep']],
  ['NGHTMRE', ['dubstep']], ['Flux Pavilion', ['dubstep']], ['Habstrakt', ['bass-house']], ['Joyryde', ['bass-house']],
  ['Jauz', ['bass-house']], ['Chris Lorenzo', ['bass-house']], ['Malaa', ['bass-house']], ['AC Slater', ['bass-house']],
  ['Illenium', ['future-bass']], ['Flume', ['future-bass']], ['San Holo', ['future-bass']], ['Said The Sky', ['future-bass']],
  ['Slander', ['future-bass']], ['RL Grime', ['future-bass']], ['Yellow Claw', ['future-bass']],
  // Drum & bass, UK garage
  ['Sub Focus', ['drum-and-bass']], ['Chase & Status', ['drum-and-bass']], ['Wilkinson', ['drum-and-bass']], ['Pendulum', ['drum-and-bass']],
  ['Andy C', ['drum-and-bass']], ['Netsky', ['drum-and-bass']], ['Hedex', ['drum-and-bass']], ['Dimension', ['drum-and-bass']],
  ['Camo & Krooked', ['drum-and-bass']], ['Noisia', ['drum-and-bass']], ['Culture Shock', ['drum-and-bass']], ['Delta Heavy', ['drum-and-bass']],
  ['A.M.C', ['drum-and-bass']], ['Mefjus', ['drum-and-bass']], ['Sammy Virji', ['uk-garage']], ['Interplanetary Criminal', ['uk-garage']],
  ['Conducta', ['uk-garage']],
];

const keyOf = (name: string) => plainText(name).replace(/\s+/g, ' ').trim();

const BY_NAME = new Map<string, string[]>(ENTRIES.map(([name, styles]) => [keyOf(name), styles]));

/** The styles a known artist plays, or none. Whole names only ("Sub Focus", not "focus"). */
export const stylesOfArtist = (name: string): string[] => BY_NAME.get(keyOf(name)) ?? [];

/** The known artists on a lineup, as they were written there. */
export const knownOnLineup = (lineup: string[]): string[] => lineup.filter((a) => BY_NAME.has(keyOf(a)));

/** The styles a lineup's known artists play, most named first. */
export function stylesOfLineup(lineup: string[]): string[] {
  const counts = new Map<string, number>();
  for (const a of lineup) for (const s of stylesOfArtist(a)) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts].sort((x, y) => y[1] - x[1]).map(([k]) => k);
}
