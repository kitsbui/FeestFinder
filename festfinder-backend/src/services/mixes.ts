import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import { many } from '../db/index.ts';
import { badRequest } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { embedFrom, oembedEndpoint, parseMixUrl, playerHeight, PROVIDER_LABEL, type MixKind, type MixProvider } from '../lib/mixes.ts';
import { fetchPublic, PageUnavailable } from './fetchpage.ts';

/*
 * Mixes: an artist's sets and tracks on SoundCloud, Mixcloud and Spotify (lib/mixes.ts has the
 * rules). This reads a pasted link through the service's oEmbed endpoint and presents a mix the
 * way the artist page and the studio show it.
 */

/** Asks a service's oEmbed endpoint about a link; the answer is JSON. */
export type OembedFetcher = (endpoint: string) => Promise<Record<string, unknown>>;

export const fetchOembed: OembedFetcher = async (endpoint) => {
  const res = await fetchPublic(endpoint, { accept: 'application/json', types: /json/i, maxBytes: 200_000, timeoutMs: 8000 });
  return JSON.parse(res.text) as Record<string, unknown>;
};

/**
 * The services as the screen tests and the offline preview see them (FAKE_REMOTE_MEDIA): every
 * public link answers like the real service would, a link with "missing" in it is not found.
 */
export const fakeOembed: OembedFetcher = async (endpoint) => {
  const url = new URL(endpoint).searchParams.get('url') ?? '';
  if (/missing/.test(url)) throw new PageUnavailable('upstream', 'fake network: not found');
  const name = decodeURIComponent(url.split('/').filter(Boolean).pop() ?? 'set').replace(/[-_]+/g, ' ');
  if (endpoint.startsWith('https://soundcloud.com/oembed')) {
    const id = String([...url].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 1_000_000_007, 7));
    const what = /\/sets\//.test(url) ? 'playlists' : url.split('/').filter(Boolean).length <= 3 ? 'users' : 'tracks';
    return {
      title: name, author_name: 'SoundCloud artist', thumbnail_url: 'https://i1.sndcdn.com/artworks-fake-t500x500.jpg',
      html: `<iframe width="100%" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?visual=true&url=https%3A%2F%2Fapi.soundcloud.com%2F${what}%2F${id}&show_artwork=true"></iframe>`,
    };
  }
  if (endpoint.startsWith('https://app.mixcloud.com/oembed')) {
    // As Mixcloud answers (checked 2026-10-15): www.mixcloud.com's widget, the show's full address as the feed.
    return {
      title: name, author_name: 'Mixcloud artist', image: 'https://thumbnailer.mixcloud.com/unsafe/600x600/fake.png',
      html: `<iframe width="100%" height="120" src="https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(url)}&amp;hide_cover=1" frameborder="0"></iframe>`,
    };
  }
  const [, kind, id] = new URL(url).pathname.split('/');
  return {
    title: name, thumbnail_url: 'https://image-cdn-ak.spotifycdn.com/image/fake', iframe_url: `https://open.spotify.com/embed/${kind}/${id}?utm_source=oembed`,
    html: `<iframe src="https://open.spotify.com/embed/${kind}/${id}?utm_source=oembed" width="100%" height="352"></iframe>`,
  };
};

export interface ResolvedMix {
  provider: MixProvider; kind: MixKind; url: string; embedSrc: string; title: string; authorName: string | null; thumbnailUrl: string | null;
}

const httpsOrNull = (v: unknown) => (typeof v === 'string' && /^https:\/\/[^\s"'<>]+$/.test(v) && v.length <= 2048 ? v : null);
const textOrNull = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/** A pasted link as a mix: which service, what it plays, its title and artwork, and the player's address. */
export async function resolveMix(ctx: Ctx, raw: string): Promise<ResolvedMix> {
  const parsed = parseMixUrl(raw);
  let answer: Record<string, unknown>;
  try {
    answer = await ctx.oembed(oembedEndpoint(parsed.provider, parsed.url));
  } catch (e) {
    if (e instanceof PageUnavailable || e instanceof SyntaxError || e instanceof TypeError) {
      throw badRequest('mix_unavailable', L(`${PROVIDER_LABEL[parsed.provider]} does not share this one; check it is public`, `${PROVIDER_LABEL[parsed.provider]} không chia sẻ link này; hãy kiểm tra nó đang công khai`));
    }
    throw e;
  }
  const embed = embedFrom(parsed.provider, answer);
  return {
    provider: parsed.provider,
    kind: embed.kind,
    url: parsed.url,
    embedSrc: embed.src,
    title: textOrNull(answer.title, 200) ?? PROVIDER_LABEL[parsed.provider],
    authorName: textOrNull(answer.author_name, 120),
    thumbnailUrl: httpsOrNull(answer.thumbnail_url) ?? httpsOrNull(answer.image),
  };
}

/** A mix as the pages show it. `playSrc` starts playing on its own: the page loads it when someone presses play. */
export function presentMix(m: any) {
  const provider = m.provider as MixProvider;
  const src = String(m.embed_src);
  return {
    id: m.id as string,
    provider,
    providerLabel: PROVIDER_LABEL[provider],
    kind: m.kind as MixKind,
    url: m.url as string,
    embedSrc: src.replace('{autoplay}', provider === 'mixcloud' ? '0' : 'false'),
    playSrc: src.replace('{autoplay}', provider === 'mixcloud' ? '1' : 'true'),
    height: playerHeight(provider, m.kind as MixKind),
    title: m.title as string,
    authorName: m.author_name as string | null,
    thumbnailUrl: m.thumbnail_url as string | null,
    durationS: m.duration_s as number | null,
    event: m.event_slug ? { slug: m.event_slug as string, title: m.event_title as string } : null,
    pinned: !!m.pinned,
    likeCount: m.like_count as number,
    commentCount: m.comment_count as number,
  };
}
export type MixView = ReturnType<typeof presentMix>;

export const MIX_COLUMNS = `m.*, e.slug as event_slug, e.title as event_title`;
export const MIX_FROM = `from artist_mixes m left join events e on e.id = m.event_id and e.status in ('live', 'cancelled') and e.published_at is not null`;

/** An artist's mixes as everyone sees them: the pinned one first, then the artist's order. */
export async function mixesOf(q: Queryable, artistId: string): Promise<MixView[]> {
  const rows = await many<any>(q,
    `select ${MIX_COLUMNS} ${MIX_FROM} where m.artist_id = $1 and m.removed_at is null order by m.pinned desc, m.sort, m.created_at limit 12`, [artistId]);
  return rows.map(presentMix);
}

/** The likes and comments a mix shows, counted again from the rows after any change. */
export async function recount(q: Queryable, mixId: string) {
  await q.query(
    `update artist_mixes set like_count = (select count(*)::int from artist_mix_likes where mix_id = $1),
       comment_count = (select count(*)::int from artist_mix_comments where mix_id = $1 and status = 'visible') where id = $1`, [mixId]);
}
