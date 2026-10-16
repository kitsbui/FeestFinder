import { badRequest } from './errors.ts';
import { L } from './i18n.ts';

/*
 * The music players an artist's page embeds: their sets and tracks on SoundCloud, Mixcloud and
 * Spotify, played by each service's own player. FeestFinder never hosts audio.
 *
 * A pasted link is read through the service's oEmbed endpoint (services/mixes.ts), but the HTML
 * that comes back is never kept or shown: the player's address is taken out of it, its host is
 * checked against the list below, and the address is built again with FeestFinder's own options.
 * The web's Content-Security-Policy (festfinder-web/next.config.ts frame-src) allows only these hosts.
 */

export const MIX_PROVIDERS = ['soundcloud', 'mixcloud', 'spotify'] as const;
export type MixProvider = (typeof MIX_PROVIDERS)[number];
export const MIX_KINDS = ['track', 'playlist', 'show', 'album', 'artist', 'episode'] as const;
export type MixKind = (typeof MIX_KINDS)[number];

export const PROVIDER_LABEL: Record<MixProvider, string> = { soundcloud: 'SoundCloud', mixcloud: 'Mixcloud', spotify: 'Spotify' };

/** The hosts each service's player is served from. */
export const EMBED_HOSTS: Record<MixProvider, string[]> = {
  soundcloud: ['w.soundcloud.com'],
  mixcloud: ['player-widget.mixcloud.com', 'www.mixcloud.com'],
  spotify: ['open.spotify.com'],
};

/** Where each service answers oEmbed. None needs a key. */
export function oembedEndpoint(provider: MixProvider, url: string): string {
  const u = encodeURIComponent(url);
  if (provider === 'soundcloud') return `https://soundcloud.com/oembed?format=json&maxheight=166&url=${u}`;
  if (provider === 'mixcloud') return `https://app.mixcloud.com/oembed/?format=json&url=${u}`;
  return `https://open.spotify.com/oembed?url=${u}`;
}

export const MIXES_MAX = 12;

const notAMix = () => badRequest('invalid_mix_link', L('Paste a SoundCloud, Mixcloud or Spotify link', 'Hãy dán link SoundCloud, Mixcloud hoặc Spotify'));

const host = (u: URL) => u.hostname.toLowerCase().replace(/^(www|m)\./, '');
const SOUNDCLOUD_RESERVED = new Set(['discover', 'search', 'stream', 'you', 'upload', 'charts', 'pages', 'terms-of-use', 'settings', 'messages', 'notifications', 'stations', 'feed']);

/** Which service a pasted link is on, and the link without tracking (`?si=`, `utm_*`). Short links are resolved by oEmbed. */
export function parseMixUrl(raw: string): { provider: MixProvider; url: string; kind: MixKind | null } {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { throw notAMix(); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw notAMix();
  u.protocol = 'https:';
  u.hash = '';
  const h = host(u);
  const parts = u.pathname.split('/').filter(Boolean);
  if (h === 'on.soundcloud.com') return { provider: 'soundcloud', url: u.toString(), kind: null };
  if (h === 'soundcloud.com') {
    if (!parts.length || SOUNDCLOUD_RESERVED.has(parts[0])) throw notAMix();
    if (parts.length >= 2 && ['likes', 'reposts', 'followers', 'following', 'tracks', 'albums', 'popular-tracks', 'comments'].includes(parts[1])) throw notAMix();
    if (parts[1] === 'sets' && !parts[2]) throw notAMix();
    const kind: MixKind = parts.length === 1 ? 'artist' : parts[1] === 'sets' ? 'playlist' : 'track';
    return { provider: 'soundcloud', url: `https://soundcloud.com/${parts.slice(0, kind === 'playlist' ? 3 : 2).join('/')}`, kind };
  }
  if (h === 'mixcloud.com') {
    // A show is /<user>/<show>/; a profile alone is not a mix.
    if (parts.length !== 2 || ['discover', 'live', 'upload', 'settings', 'select'].includes(parts[0])) throw notAMix();
    return { provider: 'mixcloud', url: `https://www.mixcloud.com/${parts[0]}/${parts[1]}/`, kind: 'show' };
  }
  if (h === 'spotify.link') return { provider: 'spotify', url: u.toString(), kind: null };
  if (h === 'open.spotify.com') {
    const p = parts[0]?.startsWith('intl-') ? parts.slice(1) : parts;
    const kind = p[0] as MixKind;
    if (!['track', 'album', 'playlist', 'artist', 'show', 'episode'].includes(kind) || !/^[A-Za-z0-9]{22}$/.test(p[1] ?? '')) throw notAMix();
    return { provider: 'spotify', url: `https://open.spotify.com/${kind}/${p[1]}`, kind };
  }
  throw notAMix();
}

/** The one https iframe address in an oEmbed answer (`iframe_url`, or the `src` of its HTML), on the service's own player host. */
function playerAddress(provider: MixProvider, oembed: { html?: unknown; iframe_url?: unknown }): URL {
  const raw = typeof oembed.iframe_url === 'string' ? oembed.iframe_url
    : typeof oembed.html === 'string' ? oembed.html.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]?.replaceAll('&amp;', '&') : undefined;
  let u: URL;
  try { u = new URL(String(raw ?? '')); } catch { throw notAMix(); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port || !EMBED_HOSTS[provider].includes(u.hostname.toLowerCase())) throw notAMix();
  return u;
}

/**
 * The player's address as FeestFinder embeds it, rebuilt from the service's answer with only
 * what identifies the set and FeestFinder's own options, plus the kind it plays.
 * `{autoplay}` is left in place: the page fills it when someone presses play.
 */
export function embedFrom(provider: MixProvider, oembed: { html?: unknown; iframe_url?: unknown }): { src: string; kind: MixKind } {
  const u = playerAddress(provider, oembed);
  if (provider === 'soundcloud') {
    const api = u.searchParams.get('url') ?? '';
    const m = api.match(/^https:\/\/api\.soundcloud\.com\/(tracks|playlists|users)\/(?:soundcloud:(?:tracks|playlists|users):)?(\d{1,20})$/);
    if (u.pathname !== '/player/' || !m) throw notAMix();
    const kind: MixKind = m[1] === 'tracks' ? 'track' : m[1] === 'playlists' ? 'playlist' : 'artist';
    const q = new URLSearchParams({
      url: `https://api.soundcloud.com/${m[1]}/${m[2]}`, color: '#f2f0ea', auto_play: '{autoplay}', hide_related: 'true', show_comments: 'false',
      show_user: 'true', show_reposts: 'false', show_teaser: 'false', visual: 'false',
    });
    return { src: `https://w.soundcloud.com/player/?${q.toString().replace('%7Bautoplay%7D', '{autoplay}')}`, kind };
  }
  if (provider === 'mixcloud') {
    // The show, as Mixcloud names it: "/user/show/", or (www.mixcloud.com's own widget) its full address.
    const feed = u.searchParams.get('feed') ?? '';
    const path = feed.startsWith('https://www.mixcloud.com/') ? feed.slice('https://www.mixcloud.com'.length) : feed;
    if (!/^\/widget\/iframe\/?$/.test(u.pathname) || !/^\/[^/?#]+\/[^/?#]+\/$/.test(path)) throw notAMix();
    const q = new URLSearchParams({ hide_cover: '1', light: '0', feed });
    return { src: `https://${u.hostname.toLowerCase()}/widget/iframe/?${q}&autoplay={autoplay}`, kind: 'show' };
  }
  const m = u.pathname.match(/^\/embed\/(track|album|playlist|artist|show|episode)\/([A-Za-z0-9]{22})\/?$/);
  if (!m) throw notAMix();
  return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0`, kind: m[1] as MixKind };
}

/** How tall each service's player is for a kind: the compact player for one piece, the list for many. */
export function playerHeight(provider: MixProvider, kind: MixKind): number {
  if (provider === 'mixcloud') return 120;
  if (provider === 'soundcloud') return kind === 'track' ? 166 : 352;
  return kind === 'track' || kind === 'episode' ? 152 : 352;
}

/** "45:30" or "1:02:05" into seconds; null when it is not a time. */
export function parseAt(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = v.trim().match(/^(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d)$/);
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}
