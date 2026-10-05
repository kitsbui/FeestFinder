import { L, type Genre, type Localized } from './i18n.ts';
import { plainText } from './places.ts';

/*
 * Music styles. An event can have several ("hard techno", "acid techno"). Each style belongs
 * to one of the broad genres, which keep deciding an event's colour and the genre filter.
 *
 * Classification is deterministic: what the source itself declares (its genre tags) first,
 * then phrases in the title, description and lineup. A phrase is only listed when it is safe
 * to find in free text: "house" alone would match "Opera House", so free text needs
 * "house music" or "afro house", while a source tag of just "House" is enough.
 */

export interface Style { key: string; label: Localized; genre: Genre; tags: string[]; phrases: string[] }

const S = (key: string, en: string, vi: string, genre: Genre, tags: string[], phrases: string[]): Style =>
  ({ key, label: L(en, vi), genre, tags, phrases });

export const STYLES: Style[] = [
  S('techno', 'Techno', 'Techno', 'EDM', ['techno'], ['techno']),
  S('hard-techno', 'Hard techno', 'Hard techno', 'EDM', ['hard techno', 'schranz'], ['hard techno', 'hardtechno', 'schranz']),
  S('acid-techno', 'Acid techno', 'Acid techno', 'EDM', ['acid techno', 'acid'], ['acid techno']),
  S('industrial-techno', 'Industrial techno', 'Industrial techno', 'EDM', ['industrial techno', 'industrial'], ['industrial techno']),
  S('house', 'House', 'House', 'EDM', ['house', 'afro house', 'melodic house'], ['house music', 'afro house', 'melodic house', 'organic house']),
  S('tech-house', 'Tech house', 'Tech house', 'EDM', ['tech house'], ['tech house']),
  S('deep-house', 'Deep house', 'Deep house', 'EDM', ['deep house'], ['deep house']),
  S('progressive-house', 'Progressive house', 'Progressive house', 'EDM', ['progressive house', 'progressive'], ['progressive house']),
  S('trance', 'Trance', 'Trance', 'EDM', ['trance'], ['trance']),
  S('psytrance', 'Psytrance', 'Psytrance', 'EDM', ['psytrance', 'psy trance', 'goa'], ['psytrance', 'psy trance', 'goa trance', 'psychedelic trance']),
  S('hardstyle', 'Hardstyle', 'Hardstyle', 'EDM', ['hardstyle'], ['hardstyle']),
  S('rawstyle', 'Rawstyle', 'Rawstyle', 'EDM', ['rawstyle'], ['rawstyle', 'raw hardstyle']),
  S('hardcore', 'Hardcore', 'Hardcore', 'EDM', ['hardcore', 'uptempo', 'frenchcore'], ['hardcore techno', 'uptempo hardcore', 'frenchcore']),
  S('gabber', 'Gabber', 'Gabber', 'EDM', ['gabber', 'gabba'], ['gabber', 'gabba']),
  S('dubstep', 'Dubstep', 'Dubstep', 'EDM', ['dubstep', 'riddim'], ['dubstep', 'riddim']),
  S('drum-and-bass', 'Drum & bass', 'Drum & bass', 'EDM', ['drum and bass', 'drum n bass', 'dnb', 'd b', 'jungle', 'neurofunk', 'liquid'],
    ['drum and bass', 'drum n bass', 'drum bass', 'dnb', 'neurofunk', 'liquid dnb', 'jungle music']),
  S('breakbeat', 'Breakbeat', 'Breakbeat', 'EDM', ['breakbeat', 'breaks'], ['breakbeat', 'breakbeats']),
  S('bass', 'Bass', 'Bass', 'EDM', ['bass', 'bass music', 'future bass', 'uk garage', 'garage'], ['bass music', 'future bass', 'uk bass', 'uk garage', 'bass house']),
  S('edm', 'EDM', 'EDM', 'EDM', ['edm', 'electronic', 'dance', 'electro house', 'electronica'], ['edm', 'electro house', 'electronic dance music']),
  S('mainstage', 'Mainstage', 'Mainstage', 'EDM', ['mainstage', 'big room'], ['mainstage', 'big room']),
  S('hip-hop', 'Hip-hop', 'Hip-hop', 'Hip-Hop', ['hip hop', 'hiphop', 'rap', 'trap'], ['hip hop', 'hiphop', 'rap show', 'rapper']),
  S('rnb', 'R&B', 'R&B', 'Hip-Hop', ['r b', 'rnb', 'soul', 'neo soul'], ['r b', 'rnb', 'neo soul']),
  S('pop', 'Pop', 'Pop', 'Pop', ['pop', 'k pop', 'kpop', 'v pop', 'vpop', 'j pop', 'jpop'], ['pop music', 'kpop', 'k pop', 'vpop', 'v pop', 'jpop', 'j pop']),
  S('rock', 'Rock', 'Rock', 'Indie', ['rock', 'metal', 'punk', 'alternative rock'], ['rock band', 'rock show', 'metal', 'punk rock', 'post rock']),
  S('indie', 'Indie', 'Indie', 'Indie', ['indie', 'alternative', 'indie rock', 'indie pop'], ['indie', 'indie rock', 'indie pop']),
  S('jazz', 'Jazz', 'Jazz', 'Jazz', ['jazz', 'blues', 'swing', 'bossa nova'], ['jazz', 'blues', 'bossa nova']),
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

/** The styles an event's source data names, most explicit first, at most five. */
export function classifyStyles(input: StyleInput): string[] {
  const out = new Set<string>();
  // A tag is one name ("Hard Techno"), or several in one string ("Techno / House").
  const tags = (input.tags ?? []).flatMap((t) => t.split(/[,/|;·]+/)).map((t) => ` ${plainText(t)} `).filter((t) => t.trim());
  for (const s of STYLES) if (tags.some((t) => s.tags.some((p) => t.trim() === p || (p.includes(' ') && has(t, p))))) out.add(s.key);
  const text = ` ${plainText([input.title, input.description, ...(input.lineup ?? [])].filter(Boolean).join(' . '))} `;
  for (const s of STYLES) if (s.phrases.some((p) => has(text, p))) out.add(s.key);
  // "Hard techno" says techno too; listing both adds nothing.
  for (const sub of ['hard-techno', 'acid-techno', 'industrial-techno']) if (out.has(sub)) out.delete('techno');
  for (const sub of ['tech-house', 'deep-house', 'progressive-house']) if (out.has(sub)) out.delete('house');
  return [...out].slice(0, 5);
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
