import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { isStyle } from '../lib/styles.ts';
import { styleItem } from './artists.ts';

/*
 * Charts (migration 064, owner 2026-10-22): the top tracks of a style as a reputable chart ranks
 * them, read from the providers' own APIs, never from a page:
 *
 *   - Beatport: the top 100 of a genre (BEATPORT_CLIENT_ID / BEATPORT_CLIENT_SECRET, OAuth
 *     client credentials; access to the API is granted by Beatport on request).
 *   - Spotify: the tracks of a playlist (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET, client
 *     credentials): a playlist the team keeps, or any public one Spotify lets the API read.
 *   - YouTube Music: the videos of a public playlist (YOUTUBE_API_KEY, YouTube Data API v3,
 *     free quota; owner 2026-10-28): YouTube Music's editorial lists and the labels' own, picked
 *     in migration 066. YouTube's public RSS feed of a playlist is not read: it no longer answers.
 *
 * A source names its style and the chart; `refreshCharts` reads each due source on its interval
 * and replaces its entries. The style's playlist posts and the style hub (GET /styles/:key) show
 * the top ten with a link to the provider; nothing plays here. Without keys no source is read
 * and the Console says so.
 */

export const CHART_PROVIDERS = ['beatport', 'spotify', 'youtube'] as const;
export type ChartProvider = (typeof CHART_PROVIDERS)[number];

export interface ChartTrack { rank: number; artist: string; title: string; label: string | null; releasedOn: string | null; url: string | null; imageUrl: string | null; externalId: string | null }

/** The network the chart providers read through: a token with client credentials, then JSON. Tests hand in a fake. */
export interface ChartFetch {
  token(url: string, body: Record<string, string>, basicAuth?: { id: string; secret: string }): Promise<{ access_token: string }>;
  get(url: string, headers: Record<string, string>): Promise<unknown>;
}

/** The hosts the providers live on: nothing else is ever asked. */
const HOSTS = ['https://api.beatport.com/', 'https://accounts.spotify.com/', 'https://api.spotify.com/', 'https://www.googleapis.com/youtube/v3/'];
const allowed = (url: string) => { if (!HOSTS.some((h) => url.startsWith(h))) throw new Error(`chart fetch refused: ${url}`); };

export const realChartFetch: ChartFetch = {
  async token(url, body, basic) {
    allowed(url);
    const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded' };
    if (basic) headers.authorization = `Basic ${Buffer.from(`${basic.id}:${basic.secret}`).toString('base64')}`;
    const res = await fetch(url, { method: 'POST', headers, body: new URLSearchParams(body).toString(), signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`token ${res.status}`);
    return (await res.json()) as { access_token: string };
  },
  async get(url, headers) {
    allowed(url);
    const res = await fetch(url, { headers: { accept: 'application/json', ...headers }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`status ${res.status}${await reasonOf(res)}`);
    return res.json();
  },
};

/** What the provider said went wrong, for the Console (Google's `error.message`, e.g. a key restricted to websites). */
async function reasonOf(res: Response): Promise<string> {
  try {
    const body = await res.json() as { error?: { message?: string } | string; error_description?: string };
    const msg = typeof body.error === 'string' ? body.error_description ?? body.error : body.error?.message;
    return msg ? `: ${String(msg).replace(/<[^>]+>/g, '').slice(0, 200)}` : '';
  } catch { return ''; }
}

export interface ChartKeys { beatport?: { id: string; secret: string }; spotify?: { id: string; secret: string }; youtube?: { key: string } }
export const chartKeysFromEnv = (env = process.env): ChartKeys => ({
  beatport: env.BEATPORT_CLIENT_ID && env.BEATPORT_CLIENT_SECRET ? { id: env.BEATPORT_CLIENT_ID, secret: env.BEATPORT_CLIENT_SECRET } : undefined,
  spotify: env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET ? { id: env.SPOTIFY_CLIENT_ID, secret: env.SPOTIFY_CLIENT_SECRET } : undefined,
  youtube: env.YOUTUBE_API_KEY ? { key: env.YOUTUBE_API_KEY } : undefined,
});

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const CHART_MAX = 100;

/** Beatport's top 100 of a genre (v4 catalog API): the artists joined as the chart prints them, the mix name after the title. */
export async function readBeatport(io: ChartFetch, keys: { id: string; secret: string }, genreId: string): Promise<ChartTrack[]> {
  const { access_token } = await io.token('https://api.beatport.com/v4/auth/o/token/', { grant_type: 'client_credentials', client_id: keys.id, client_secret: keys.secret });
  const data = await io.get(`https://api.beatport.com/v4/catalog/genres/${encodeURIComponent(genreId)}/top/100/`, { authorization: `Bearer ${access_token}` }) as { results?: unknown[] };
  const out: ChartTrack[] = [];
  for (const [i, raw] of (data.results ?? []).slice(0, CHART_MAX).entries()) {
    const t = raw as { id?: number; name?: string; mix_name?: string; artists?: { name?: string }[]; release?: { label?: { name?: string } }; publish_date?: string; image?: { uri?: string }; slug?: string; url?: string };
    const artist = (t.artists ?? []).map((a) => str(a.name)).filter(Boolean).join(', ');
    const name = str(t.name);
    if (!artist || !name) continue;
    const mix = str(t.mix_name);
    out.push({
      rank: i + 1, artist, title: mix && !/original mix/i.test(mix) ? `${name} (${mix})` : name,
      label: str(t.release?.label?.name), releasedOn: str(t.publish_date)?.slice(0, 10) ?? null,
      url: str(t.url) ?? (t.id ? `https://www.beatport.com/track/${t.slug ?? 'track'}/${t.id}` : null),
      imageUrl: str(t.image?.uri), externalId: t.id ? String(t.id) : null,
    });
  }
  return out;
}

/** A Spotify playlist's tracks in their order (Web API, client credentials). */
export async function readSpotify(io: ChartFetch, keys: { id: string; secret: string }, playlistId: string): Promise<ChartTrack[]> {
  const { access_token } = await io.token('https://accounts.spotify.com/api/token', { grant_type: 'client_credentials' }, keys);
  const data = await io.get(`https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks?limit=${CHART_MAX}&fields=items(track(id,name,artists(name),album(name,release_date,images),external_urls))`, { authorization: `Bearer ${access_token}` }) as { items?: { track?: unknown }[] };
  const out: ChartTrack[] = [];
  for (const it of data.items ?? []) {
    const t = it.track as { id?: string; name?: string; artists?: { name?: string }[]; album?: { name?: string; release_date?: string; images?: { url?: string }[] }; external_urls?: { spotify?: string } } | null;
    if (!t) continue;
    const artist = (t.artists ?? []).map((a) => str(a.name)).filter(Boolean).join(', ');
    const name = str(t.name);
    if (!artist || !name) continue;
    out.push({
      rank: out.length + 1, artist, title: name, label: null, releasedOn: str(t.album?.release_date)?.slice(0, 10) ?? null,
      url: str(t.external_urls?.spotify), imageUrl: str(t.album?.images?.[0]?.url), externalId: str(t.id),
    });
    if (out.length >= CHART_MAX) break;
  }
  return out;
}

/** What a video's title adds that a chart does not print: "(Official Video)", "[Official Audio]", "| Lyric Video"… */
const VIDEO_TAGS = /\s*[([](?:official\s*)?(?:music\s*)?(?:video|audio|visuali[sz]er|lyric(?:s)?(?:\s*video)?|clip|hd|4k)[)\]]|\s*\|\s*(?:official|lyric).*$/gi;

/**
 * A YouTube playlist's videos in their order (Data API v3 playlistItems, the key in a header, never
 * the address), up to 100. An upload of a "… - Topic" channel is the track itself (the channel is
 * the artist); a label's upload is titled "Artist - Title" and the channel is its label. A video
 * that went private or was deleted is left out.
 */
export async function readYoutube(io: ChartFetch, keys: { key: string }, playlistId: string): Promise<ChartTrack[]> {
  const out: ChartTrack[] = [];
  let page: string | undefined;
  for (let n = 0; n < 4 && out.length < CHART_MAX; n++) {
    const q = new URLSearchParams({ part: 'snippet,contentDetails', maxResults: '50', playlistId });
    if (page) q.set('pageToken', page);
    const data = await io.get(`https://www.googleapis.com/youtube/v3/playlistItems?${q}`, { 'x-goog-api-key': keys.key }) as { items?: unknown[]; nextPageToken?: string };
    for (const raw of data.items ?? []) {
      const it = raw as { snippet?: { title?: string; videoOwnerChannelTitle?: string; resourceId?: { videoId?: string }; thumbnails?: Record<string, { url?: string }> }; contentDetails?: { videoId?: string; videoPublishedAt?: string } };
      const id = str(it.contentDetails?.videoId) ?? str(it.snippet?.resourceId?.videoId);
      const channel = str(it.snippet?.videoOwnerChannelTitle);
      const full = str(it.snippet?.title)?.replace(VIDEO_TAGS, '').trim();
      if (!id || !channel || !full) continue;
      const topic = channel.match(/^(.*?)\s+-\s+Topic$/);
      const split = topic ? null : full.match(/^(.+?)\s+[-–—]\s+(.+)$/);
      const artist = topic ? topic[1] : split ? split[1] : channel;
      const thumbs = it.snippet?.thumbnails ?? {};
      out.push({
        rank: out.length + 1, artist, title: split ? split[2] : full, label: split && channel !== artist ? channel : null,
        releasedOn: str(it.contentDetails?.videoPublishedAt)?.slice(0, 10) ?? null,
        url: `https://music.youtube.com/watch?v=${id}&list=${encodeURIComponent(playlistId)}`,
        imageUrl: str(thumbs.high?.url) ?? str(thumbs.medium?.url) ?? str(thumbs.default?.url), externalId: id,
      });
      if (out.length >= CHART_MAX) break;
    }
    page = data.nextPageToken;
    if (!page) break;
  }
  return out;
}

export interface ChartSourceRow {
  id: string; provider: ChartProvider; name: string; style: string; external_id: string; url: string; enabled: boolean; interval_minutes: number;
  next_run_at: Date; last_run_at: Date | null; last_error: string | null; last_count: number | null;
}

export const chartsEnabled = (keys: ChartKeys) => ({ beatport: !!keys.beatport, spotify: !!keys.spotify, youtube: !!keys.youtube });

/** One chart read now: its entries replaced, its run recorded; a provider without keys is an error the Console shows. */
export async function refreshChart(ctx: Ctx, sourceId: string, opts: { io?: ChartFetch; keys?: ChartKeys } = {}): Promise<{ sourceId: string; name: string; count: number; error: string | null }> {
  const now = ctx.clock.now();
  const s = await one<ChartSourceRow>(ctx.db, 'select * from chart_sources where id = $1', [sourceId]);
  if (!s) throw new Error(`chart source ${sourceId} not found`);
  const io = opts.io ?? ctx.chartFetch ?? realChartFetch;
  const keys = opts.keys ?? chartKeysFromEnv();
  const next = new Date(now.getTime() + s.interval_minutes * 60_000);
  try {
    if (!keys[s.provider]) throw new Error(`no ${s.provider} keys in the environment`);
    const tracks = s.provider === 'beatport' ? await readBeatport(io, keys.beatport!, s.external_id)
      : s.provider === 'spotify' ? await readSpotify(io, keys.spotify!, s.external_id)
        : await readYoutube(io, keys.youtube!, s.external_id);
    if (!tracks.length) throw new Error('the chart answered with no tracks');
    await ctx.db.tx(async (q) => {
      await q.query('delete from chart_entries where source_id = $1', [s.id]);
      for (const t of tracks) {
        await q.query(
          `insert into chart_entries (source_id, rank, artist, title, label, released_on, url, image_url, external_id, fetched_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [s.id, t.rank, t.artist.slice(0, 200), t.title.slice(0, 200), t.label?.slice(0, 120) ?? null, t.releasedOn, t.url, t.imageUrl, t.externalId, now]);
      }
      await q.query(`update chart_sources set last_run_at = $2, next_run_at = $3, last_error = null, last_count = $4, updated_at = $2 where id = $1`, [s.id, now, next, tracks.length]);
    });
    return { sourceId: s.id, name: s.name, count: tracks.length, error: null };
  } catch (e) {
    const error = (e as Error).message.slice(0, 300);
    await ctx.db.query(`update chart_sources set last_run_at = $2, next_run_at = $3, last_error = $4, updated_at = $2 where id = $1`, [s.id, now, next, error]);
    ctx.log(`chart ${s.name}: ${error}`);
    return { sourceId: s.id, name: s.name, count: 0, error };
  }
}

/**
 * Sources due now, one after another, within a time budget per call (the job runs inside one
 * POST /internal/jobs): what the budget leaves waits for the next run. A provider without keys
 * is skipped, not marked.
 */
export async function refreshDueCharts(ctx: Ctx, opts: { io?: ChartFetch; keys?: ChartKeys; budgetMs?: number } = {}) {
  const started = Date.now();
  const keys = opts.keys ?? chartKeysFromEnv();
  const on = CHART_PROVIDERS.filter((p) => !!keys[p]);
  if (!on.length) return [];
  const due = await many<{ id: string }>(ctx.db, `select id from chart_sources where enabled and next_run_at <= $1 and provider = any($2::text[]) order by next_run_at limit 10`, [ctx.clock.now(), on]);
  const out = [];
  for (const d of due) {
    if (Date.now() - started > (opts.budgetMs ?? 25_000)) break;
    out.push(await refreshChart(ctx, d.id, { ...opts, keys }));
  }
  return out;
}

export interface ChartEntryRow { id: string; source_id: string; rank: number; artist: string; title: string; label: string | null; released_on: string | null; url: string | null; image_url: string | null; fetched_at: Date }

/** The charts of a style, each with its top entries, for the style hub and the playlist posts. */
export async function chartsOf(q: Queryable, style: string, top = 10) {
  if (!isStyle(style)) return [];
  const sources = await many<ChartSourceRow>(q, `select * from chart_sources where enabled and style = $1 and last_count > 0 order by provider, name`, [style]);
  const out = [];
  for (const s of sources) {
    const rows = await many<ChartEntryRow>(q, `select * from chart_entries where source_id = $1 order by rank limit $2`, [s.id, top]);
    if (rows.length) out.push(presentChart(s, rows));
  }
  return out;
}

export const presentChart = (s: ChartSourceRow, rows: ChartEntryRow[]) => ({
  id: s.id, provider: s.provider, name: s.name, url: s.url, style: styleItem(s.style), fetchedAt: rows[0]?.fetched_at ?? s.last_run_at,
  entries: rows.map((r) => ({ rank: r.rank, artist: r.artist, title: r.title, label: r.label, releasedOn: r.released_on, url: r.url, imageUrl: r.image_url })),
});

export const presentChartSource = (s: ChartSourceRow & { entries?: number }) => ({
  id: s.id, provider: s.provider, name: s.name, style: styleItem(s.style), externalId: s.external_id, url: s.url, enabled: s.enabled, intervalMinutes: s.interval_minutes,
  nextRunAt: s.next_run_at, lastRunAt: s.last_run_at, lastError: s.last_error, lastCount: s.last_count, entries: s.entries ?? 0,
});
