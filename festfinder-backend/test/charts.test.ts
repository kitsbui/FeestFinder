import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setup, type TestEnv } from './helpers.ts';
import { jobs } from '../src/jobs.ts';
import { type ChartFetch, readBeatport, readSpotify, readYoutube, refreshDueCharts } from '../src/services/charts.ts';

/*
 * Charts (migration 064, services/charts.ts) and the style hub (routes/styles.ts): a style's top
 * tracks as Beatport or a Spotify playlist rank them, read from the providers' APIs with keys from
 * the environment and replaced on every read; the hub links a style's nights, artists, guide,
 * playlists, news and charts in one answer.
 */

const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/charts/${name}`, import.meta.url), 'utf8'));

/** The providers as fixtures: a token for any client, the chart's JSON for its address. */
function fakeFetch(): ChartFetch & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async token(url) { calls.push(`token ${url}`); return { access_token: 'tok' }; },
    async get(url, headers) {
      calls.push(`get ${url} ${headers.authorization ?? headers['x-goog-api-key']}`);
      if (url.includes('api.beatport.com/v4/catalog/genres/6/top/100')) return fixture('beatport-top.json');
      if (url.includes('api.spotify.com/v1/playlists/pl1/tracks')) return fixture('spotify-playlist.json');
      if (url.startsWith('https://www.googleapis.com/youtube/v3/playlistItems?') && url.includes('playlistId=PLyt1')) return fixture(url.includes('pageToken=P2') ? 'youtube-page2.json' : 'youtube-page1.json');
      throw new Error('status 404');
    },
  };
}
const KEYS = { beatport: { id: 'bp', secret: 's' }, spotify: { id: 'sp', secret: 's' } };

describe('reading a chart', () => {
  it('reads Beatport’s top 100 of a genre: the artists joined, the mix after the title, the label and date, a track without a name left out', async () => {
    const io = fakeFetch();
    const out = await readBeatport(io, KEYS.beatport, '6');
    assert.equal(out.length, 2);
    assert.deepEqual(out[0], { rank: 1, artist: 'Kaskade, deadmau5', title: 'Deeper Than Time', label: 'mau5trap', releasedOn: '2026-09-12', url: 'https://www.beatport.com/track/deeper-than-time/20011', imageUrl: 'https://geo-media.beatport.com/image/20011.jpg', externalId: '20011' });
    assert.equal(out[1].title, 'Hypnotised (Extended Mix)');
    assert.ok(io.calls[0].startsWith('token https://api.beatport.com/v4/auth/o/token/'));
    assert.ok(io.calls[1].endsWith('Bearer tok'));
  });

  it('reads a Spotify playlist in its order, skipping a track Spotify no longer has', async () => {
    const out = await readSpotify(fakeFetch(), KEYS.spotify, 'pl1');
    assert.deepEqual(out.map((t) => [t.rank, t.artist, t.title, t.releasedOn, t.url, t.imageUrl]), [
      [1, 'Amelie Lens', 'Lose Control', '2026-08-21', 'https://open.spotify.com/track/7abc', 'https://i.scdn.co/image/7abc'],
      [2, 'Sara Landry, Trym', 'Rave Alarm', '2026-10-10', 'https://open.spotify.com/track/8def', null],
    ]);
  });
});

describe('reading a YouTube Music playlist', () => {
  it('reads its videos in order across pages: a Topic upload as the track, a label’s “Artist - Title” split, video tags dropped, a deleted video left out, the key never in the address', async () => {
    const io = fakeFetch();
    const out = await readYoutube(io, { key: 'yt-key' }, 'PLyt1');
    assert.deepEqual(out.map((t) => [t.rank, t.artist, t.title, t.label, t.releasedOn, t.imageUrl]), [
      [1, 'Amelie Lens', 'Lose Control', null, '2026-08-21', 'https://i.ytimg.com/vi/aaaaaaaaaa1/hqdefault.jpg'],
      [2, 'Sara Landry', 'Rave Alarm', 'Drumcode', '2026-10-10', 'https://i.ytimg.com/vi/cccccccccc3/mqdefault.jpg'],
      [3, 'Anyma', 'Hypnotised', null, null, null],
    ]);
    assert.equal(out[0].url, 'https://music.youtube.com/watch?v=aaaaaaaaaa1&list=PLyt1');
    assert.equal(io.calls.length, 2);
    assert.ok(io.calls.every((c) => !c.split(' ')[1].includes('yt-key') && c.endsWith(' yt-key')));
  });
});

describe('charts refreshed on a schedule and the style hub', () => {
  let env: TestEnv;
  let admin: string;
  const io = fakeFetch();
  before(async () => {
    env = await setup({ chartFetch: io });
    admin = await env.admin();
  });
  after(async () => { await env.close(); });
  let sp: string;

  it('lets the team list a chart for a style, and refuses the same chart twice or an unknown style', async () => {
    const r = await env.as(admin).post('/admin/charts/sources', { provider: 'beatport', name: 'Beatport techno top 100', style: 'techno', externalId: '6', url: 'https://www.beatport.com/genre/techno-peak-time-driving/6/top-100' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal((await env.as(admin).post('/admin/charts/sources', { provider: 'beatport', name: 'Again', style: 'techno', externalId: '6', url: 'https://www.beatport.com/x' })).status, 409);
    assert.equal((await env.as(admin).post('/admin/charts/sources', { provider: 'spotify', name: 'Bad', style: 'polka', externalId: 'x', url: 'https://open.spotify.com/x' })).status, 400);
    sp = (await env.as(admin).post('/admin/charts/sources', { provider: 'spotify', name: 'FeestFinder techno picks', style: 'techno', externalId: 'pl1', url: 'https://open.spotify.com/playlist/pl1' })).body.id;
    assert.equal((await env.as().get('/admin/charts')).status, 401);
    const list = (await env.as(admin).get('/admin/charts')).body;
    assert.equal(list.items.length, 2);
    assert.deepEqual(list.providers, { beatport: false, spotify: false, youtube: false }, 'no keys in the test environment');
  });

  it('reads nothing without keys, and with them replaces each chart’s entries on its interval', async () => {
    assert.deepEqual(await refreshDueCharts(env.ctx, { io, keys: {} }), []);
    assert.equal((await env.as().get('/charts?style=techno')).body.items.length, 0);
    const runs = await refreshDueCharts(env.ctx, { io, keys: KEYS });
    assert.deepEqual(runs.map((r) => [r.name, r.count, r.error]), [['Beatport techno top 100', 2, null], ['FeestFinder techno picks', 2, null]]);
    const charts = (await env.as().get('/charts?style=techno')).body.items;
    assert.equal(charts.length, 2);
    assert.deepEqual(charts[0].entries.map((e: { rank: number; artist: string }) => [e.rank, e.artist]), [[1, 'Kaskade, deadmau5'], [2, 'Charlotte de Witte']]);
    assert.equal(charts[0].style.key, 'techno');
    // Not due again until its interval has passed; read again, the entries are replaced, never doubled.
    assert.deepEqual(await refreshDueCharts(env.ctx, { io, keys: KEYS }), []);
    env.clock.advance(25 * 3600_000);
    assert.equal((await refreshDueCharts(env.ctx, { io, keys: KEYS })).length, 2);
    assert.equal((await env.ctx.db.query<{ n: number }>('select count(*)::int as n from chart_entries')).rows[0].n, 4);
    assert.equal((await env.as().get('/charts?style=polka')).status, 400);
    // A chart the provider cannot answer says so and waits its interval.
    const broken = (await env.as(admin).patch(`/admin/charts/sources/${sp}`, { externalId: 'gone' })).body;
    assert.equal(broken.externalId, 'gone');
    const run = (await env.as(admin).post(`/admin/charts/sources/${sp}/run`)).body;
    assert.match(run.run.error, /no spotify keys|404/);
    assert.equal(jobs.refreshCharts.length, 1);
  });

  it('answers the style hub: the nights, the artists, the guide, the playlists, the news and the charts of a style, cached for the CDN', async () => {
    assert.equal((await env.as(admin).patch(`/admin/charts/sources/${sp}`, { enabled: false })).body.enabled, false);
    const r = await env.as().get('/styles/techno');
    assert.equal(r.status, 200);
    assert.ok(String(r.headers['vercel-cdn-cache-control']).includes('max-age=60'));
    const hub = r.body;
    assert.equal(hub.style.key, 'techno');
    assert.ok(hub.nights >= 1, 'the demo data has techno nights');
    assert.equal(typeof hub.artists, 'number');
    assert.deepEqual([hub.guide, hub.playlists, hub.posts, hub.news], [null, [], [], 0], 'no post is published yet');
    assert.equal(hub.charts.length, 1, 'the switched-off chart is not shown');
    assert.deepEqual(hub.links, { nights: '/?style=techno', artists: '/a/style/techno', news: '/blog?category=news', guide: null });
    assert.equal((await env.as().get('/styles/polka')).status, 404);
    assert.equal((await env.as().get(`/admin/charts`)).status, 401);
  });
});
