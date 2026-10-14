import { L, type Genre, type Localized } from './i18n.ts';
import { plainText } from './places.ts';

/*
 * Music styles. FeestFinder lists electronic music only, so every style is EDM; an event can
 * have several ("hard techno", "acid techno"), and people filter by them.
 *
 * Classification is deterministic: what the source itself declares (its genre tags) first,
 * then phrases in the title, description and lineup. A phrase is only listed when it is safe
 * to find in free text: "house" alone would match "Opera House", so free text needs
 * "house music" or "afro house", while a source tag of just "House" is enough.
 */

export interface Style { key: string; label: Localized; genre: Genre; tags: string[]; phrases: string[] }

const S = (key: string, en: string, vi: string, tags: string[], phrases: string[]): Style =>
  ({ key, label: L(en, vi), genre: 'EDM', tags, phrases });

export const STYLES: Style[] = [
  S('techno', 'Techno', 'Techno', ['techno'], ['techno']),
  S('hard-techno', 'Hard techno', 'Hard techno', ['hard techno', 'schranz'], ['hard techno', 'hardtechno', 'schranz']),
  S('acid-techno', 'Acid techno', 'Acid techno', ['acid techno', 'acid'], ['acid techno']),
  S('industrial-techno', 'Industrial techno', 'Industrial techno', ['industrial techno', 'industrial'], ['industrial techno']),
  S('house', 'House', 'House', ['house', 'afro house', 'melodic house'], ['house music', 'afro house', 'melodic house', 'organic house']),
  S('tech-house', 'Tech house', 'Tech house', ['tech house'], ['tech house']),
  S('deep-house', 'Deep house', 'Deep house', ['deep house'], ['deep house']),
  S('progressive-house', 'Progressive house', 'Progressive house', ['progressive house', 'progressive'], ['progressive house']),
  S('trance', 'Trance', 'Trance', ['trance'], ['trance']),
  S('psytrance', 'Psytrance', 'Psytrance', ['psytrance', 'psy trance', 'goa'], ['psytrance', 'psy trance', 'goa trance', 'psychedelic trance']),
  S('hardstyle', 'Hardstyle', 'Hardstyle', ['hardstyle'], ['hardstyle']),
  S('rawstyle', 'Rawstyle', 'Rawstyle', ['rawstyle'], ['rawstyle', 'raw hardstyle']),
  S('hardcore', 'Hardcore', 'Hardcore', ['hardcore', 'uptempo', 'frenchcore'], ['hardcore techno', 'uptempo hardcore', 'frenchcore']),
  S('gabber', 'Gabber', 'Gabber', ['gabber', 'gabba'], ['gabber', 'gabba']),
  S('dubstep', 'Dubstep', 'Dubstep', ['dubstep', 'riddim'], ['dubstep', 'riddim']),
  S('drum-and-bass', 'Drum & bass', 'Drum & bass', ['drum and bass', 'drum n bass', 'dnb', 'd b', 'jungle', 'neurofunk', 'liquid'], ['drum and bass', 'drum n bass', 'drum bass', 'dnb', 'neurofunk', 'liquid dnb', 'jungle music']),
  S('breakbeat', 'Breakbeat', 'Breakbeat', ['breakbeat', 'breaks'], ['breakbeat', 'breakbeats']),
  S('bass', 'Bass', 'Bass', ['bass', 'bass music', 'future bass', 'uk garage', 'garage'], ['bass music', 'future bass', 'uk bass', 'uk garage', 'bass house']),
  S('edm', 'EDM', 'EDM', ['edm', 'electronic', 'dance', 'electro house', 'electronica'], ['edm', 'electro house', 'electronic dance music', 'nhac dien tu']),
  S('mainstage', 'Mainstage', 'Mainstage', ['mainstage', 'big room'], ['mainstage', 'big room']),
];

/*
 * What FeestFinder does not list: other genres, named by a source's tags or by safe phrases in
 * its text, so an import that names one (and no EDM style) is dropped. Same rules as STYLES:
 * a single word only as a whole source tag, free text only as a phrase ("metal" alone would
 * find "Heavy Metal Bar"). "Trap" is not here: EDM trap is common.
 */
export const OTHER_GENRES: { genre: string; tags: string[]; phrases: string[] }[] = [
  { genre: 'Hip-Hop', tags: ['hip hop', 'hiphop', 'rap', 'r b', 'rnb', 'soul', 'neo soul'],
    phrases: ['hip hop', 'hiphop', 'rap show', 'rapper', 'r b', 'rnb', 'neo soul'] },
  { genre: 'Pop', tags: ['pop', 'k pop', 'kpop', 'v pop', 'vpop', 'j pop', 'jpop'],
    phrases: ['pop music', 'kpop', 'k pop', 'vpop', 'v pop', 'jpop', 'j pop'] },
  { genre: 'Rock', tags: ['rock', 'rock n roll', 'rock and roll', 'alternative rock', 'alt rock', 'grunge', 'indie rock', 'pop rock', 'hard rock', 'classic rock', 'post rock', 'postrock', 'punk', 'punk rock', 'hardcore punk', 'pop punk', 'post punk', 'metal', 'heavy metal', 'metalcore', 'death metal', 'black metal', 'nu metal', 'post hardcore', 'emo', 'midwest emo', 'shoegaze', 'dream pop', 'progressive rock', 'prog rock', 'math rock', 'j rock', 'jrock', 'japanese rock', 'visual kei'],
    phrases: ['rock band', 'rock show', 'rock night', 'rock concert', 'rock music', 'alternative rock', 'alt rock', 'grunge', 'indie rock', 'pop rock', 'hard rock', 'classic rock', 'post rock', 'postrock', 'punk rock', 'punk show', 'hardcore punk', 'pop punk', 'post punk', 'metal band', 'metal show', 'metal night', 'metal concert', 'heavy metal band', 'heavy metal show', 'heavy metal concert', 'metalcore', 'death metal', 'black metal', 'nu metal', 'post hardcore', 'emo band', 'emo night', 'midwest emo', 'shoegaze', 'progressive rock', 'prog rock', 'math rock', 'j rock', 'jrock', 'japanese rock', 'visual kei'] },
  { genre: 'Indie', tags: ['indie', 'alternative', 'indie pop', 'indie folk'],
    phrases: ['indie', 'indie pop', 'indie folk'] },
  { genre: 'Jazz', tags: ['jazz', 'blues', 'swing', 'bossa nova'],
    phrases: ['jazz', 'blues', 'bossa nova'] },
  { genre: 'Classical', tags: ['classical', 'opera', 'orchestra', 'symphony', 'chamber music'],
    phrases: ['symphony orchestra', 'philharmonic', 'string quartet', 'piano recital', 'giao huong', 'nhac co dien', 'nhac thinh phong'] },
  { genre: 'Other music', tags: ['country', 'folk', 'world', 'latin', 'reggae', 'religious', 'new age', 'ballad', 'bolero'],
    phrases: ['nhac tru tinh', 'nhac trinh', 'bolero'] },
  { genre: 'Theatre', tags: ['theatre', 'theater', 'musical', 'comedy'],
    phrases: ['musical theatre', 'stand up comedy', 'cai luong', 'kich noi'] },
  { genre: 'Food', tags: ['food', 'night market'],
    phrases: ['night market', 'food festival', 'cho dem', 'le hoi am thuc'] },
  { genre: 'Culture', tags: ['exhibition', 'art', 'book', 'film'],
    phrases: ['book fair', 'trien lam', 'hoi sach'] },
];

export const STYLE_KEYS = STYLES.map((s) => s.key);
const BY_KEY = new Map(STYLES.map((s) => [s.key, s]));
export const styleByKey = (key: string) => BY_KEY.get(key) ?? null;
export const isStyle = (key: string) => BY_KEY.has(key);

export const EVENT_TYPES = ['club', 'festival', 'concert', 'rave', 'party', 'show', 'other'] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const EVENT_TYPE_LABEL: Record<EventType, Localized> = {
  club: L('Club night', 'Club'),
  festival: L('Festival', 'Lễ hội'),
  concert: L('Concert', 'Concert'),
  rave: L('Rave', 'Rave'),
  party: L('Party', 'Tiệc'),
  show: L('Show', 'Show'),
  other: L('Other', 'Khác'),
};

const has = (text: string, phrase: string) => text.includes(` ${phrase} `);

export interface StyleInput { tags?: string[]; title?: string | null; description?: string | null; lineup?: string[] }

const tagsOf = (input: StyleInput) =>
  (input.tags ?? []).flatMap((t) => t.split(/[,/|;·]+/)).map((t) => ` ${plainText(t)} `).filter((t) => t.trim());
const textOf = (input: StyleInput) => ` ${plainText([input.title, input.description, ...(input.lineup ?? [])].filter(Boolean).join(' . '))} `;
const tagMatch = (tags: string[], words: string[]) => tags.some((t) => words.some((p) => t.trim() === p || (p.includes(' ') && has(t, p))));

/** The styles an event's source data names, most explicit first, at most five. */
export function classifyStyles(input: StyleInput): string[] {
  const out = new Set<string>();
  // A tag is one name ("Hard Techno"), or several in one string ("Techno / House").
  const tags = tagsOf(input);
  for (const s of STYLES) if (tagMatch(tags, s.tags)) out.add(s.key);
  const text = textOf(input);
  for (const s of STYLES) if (s.phrases.some((p) => has(text, p))) out.add(s.key);
  // "Hard techno" says techno too; listing both adds nothing.
  for (const sub of ['hard-techno', 'acid-techno', 'industrial-techno']) if (out.has(sub)) out.delete('techno');
  for (const sub of ['tech-house', 'deep-house', 'progressive-house']) if (out.has(sub)) out.delete('house');
  return [...out].slice(0, 5);
}

/** The genre FeestFinder does not list that the source names, if any: tags first, then text. */
export function otherGenreOf(input: StyleInput): string | null {
  const tags = tagsOf(input);
  const byTag = OTHER_GENRES.find((g) => tagMatch(tags, g.tags));
  if (byTag) return byTag.genre;
  const text = textOf(input);
  return OTHER_GENRES.find((g) => g.phrases.some((p) => has(text, p)))?.genre ?? null;
}

/** The broad genre styles point to, for an event that has none yet. */
export function genreFromStyles(styles: string[]): Genre | null {
  return styles.map((k) => BY_KEY.get(k)?.genre).find(Boolean) ?? null;
}

/** What kind of night it is, from the source's own type and the words in its title. */
export function inferEventType(input: { schemaType?: string | null; title?: string | null; description?: string | null; startTime?: string | null; endTime?: string | null }): EventType | null {
  const title = ` ${plainText(input.title ?? '')} `;
  const all = ` ${plainText(`${input.title ?? ''} ${input.description ?? ''}`)} `;
  if (input.schemaType === 'Festival' || /\s(festival|fest)\s/.test(title)) return 'festival';
  if (has(title, 'rave')) return 'rave';
  if (has(title, 'concert') || has(title, 'live in') || has(title, 'tour') || has(title, 'world tour')) return 'concert';
  if (has(all, 'club') || has(title, 'b2b') || has(title, 'all night long')) return 'club';
  if (has(title, 'party') || has(title, 'tiec')) return 'party';
  if (has(title, 'show')) return 'show';
  // Music that starts late and runs past midnight is a club night.
  const late = input.startTime && (input.startTime >= '22:00' || (input.endTime && input.endTime <= input.startTime && input.startTime >= '20:00'));
  if (input.schemaType === 'MusicEvent') return late ? 'club' : 'concert';
  return null;
}
