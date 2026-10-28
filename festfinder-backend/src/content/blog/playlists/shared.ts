/**
 * What the playlist posts share (owner, 2026-10-22, from the "Playlist Hub" handoff): a playlist
 * is data (its tracks, each a YouTube video checked through oEmbed, with the artist, the title,
 * the label and year when a source gives them, and a line on why to listen in each language)
 * that `playlistPost` turns into one pack post in Vietnamese and English with the same shape
 * every time: the answer first, the tracklist as numbered sections (the players themselves are
 * the post's tracks, drawn under the words and loading only on play), how the list was chosen,
 * and what to read next. A yearly or monthly list says its period in its facts.
 */
import type { Localized } from '../../../lib/i18n.ts';
import type { PackPost, PackTrack } from '../../../services/blog-content.ts';
import type { Faq, Fact, Source } from '../../../services/blog.ts';
import { type Media } from '../edm-genres/media.ts';
import { coverOf, guide, nights } from '../club-guides/shared.ts';

export { guide, nights, wiki } from '../edm-genres/media.ts';
export { coverOf };

type Lang = 'vi' | 'en';

export const PILLAR = 'playlists/playlist-edm';

export interface PlaylistTrack extends PackTrack {
  /** The label and the year, as a source gives them; left out when unsure. */
  label?: string;
  /** The styles the track sits in, named for the reader ("Peak time techno"). */
  style?: Localized;
  bpm?: number;
}

export interface Playlist {
  key: string;
  slug: string;
  /** evergreen: a style or a mood; yearly: the year's top; monthly: the month's new tracks. */
  kind: 'style' | 'mood' | 'yearly' | 'monthly';
  title: Localized;
  excerpt: Localized;
  cover: Media;
  styles: string[];
  /** The style the site filters by, for the link to its nights; the first of `styles` when left out. */
  style?: string;
  /** The opening paragraph: starts with the bold answer, 40–60 words. */
  lead: Localized;
  tracks: PlaylistTrack[];
  /** How the list was chosen: a few sentences. */
  method: Localized;
  /** What the month or year sounded like (a yearly or monthly list), or what the mood asks for. */
  notes?: Localized;
  related: { slug: string; line: Localized }[];
  facts: Fact[];
  faq: Faq[];
  sources: Source[];
}

const T = {
  tracklist: { vi: 'Tracklist', en: 'Tracklist' },
  style: { vi: 'Dòng nhạc', en: 'Style' },
  bpm: { vi: 'BPM', en: 'BPM' },
  label: { vi: 'Label / năm', en: 'Label / year' },
  why: { vi: 'Vì sao nên nghe', en: 'Why listen' },
  method: { vi: 'Cách chọn bài', en: 'How this list was made' },
  notes: { vi: 'Ghi chú', en: 'Notes' },
  next: { vi: 'Đọc tiếp', en: 'Read next' },
  nightsIn: { vi: 'Lịch đêm nhạc trên FeestFinder', en: 'Coming nights on FeestFinder' },
  nightsLine: { vi: 'Club, rave và festival của dòng nhạc này đang mở bán.', en: 'Club nights, raves and festivals in this style, on sale now.' },
} as const;

function trackSection(t: PlaylistTrack, i: number, lang: Lang): string {
  const facts = [
    t.style ? `- **${T.style[lang]}:** ${t.style[lang]}${t.bpm ? ` · ${t.bpm} BPM` : ''}` : t.bpm ? `- **${T.bpm[lang]}:** ${t.bpm}` : null,
    t.label || t.year ? `- **${T.label[lang]}:** ${[t.label, t.year].filter(Boolean).join(' · ')}` : null,
    `- **${T.why[lang]}:** ${t.note[lang]}`,
  ].filter(Boolean).join('\n');
  return `### ${i + 1}. ${t.artist} — ${t.title}\n\n${facts}`;
}

function body(p: Playlist, lang: Lang): string {
  const style = p.style ?? p.styles[0];
  const next = [
    ...(style ? [`- [${T.nightsIn[lang]}](${nights(style, lang)}) ${T.nightsLine[lang]}`] : []),
    ...p.related.map((r) => `- [${r.line[lang].split(' · ')[0]}](${guide(r.slug, lang)}) ${r.line[lang].split(' · ').slice(1).join(' · ')}`),
  ].join('\n');
  return [
    p.lead[lang],
    `## ${T.tracklist[lang]}\n\n${p.tracks.map((t, i) => trackSection(t, i, lang)).join('\n\n')}`,
    `## ${T.method[lang]}\n\n${p.method[lang]}`,
    ...(p.notes ? [`## ${T.notes[lang]}\n\n${p.notes[lang]}`] : []),
    `## ${T.next[lang]}\n\n${next}`,
  ].join('\n\n');
}

/** A playlist as a pack post, under the pillar. */
export function playlistPost(p: Playlist): PackPost {
  return {
    key: p.key, slug: p.slug, category: 'playlist', lang: 'vi', parent: PILLAR,
    title: p.title, excerpt: p.excerpt, cover: coverOf(p.cover), styles: p.styles,
    facts: p.facts, faq: p.faq, sources: p.sources,
    tracks: p.tracks.map(({ label: _l, style: _s, bpm: _b, ...t }) => t),
    body: { vi: body(p, 'vi'), en: body(p, 'en') },
  };
}
