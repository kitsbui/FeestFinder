import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { mp3Peaks, readTrack } from '../src/services/audio.ts';
import { PageUnavailable } from '../src/services/fetchpage.ts';
import { TRACK_ADDS } from '../src/routes/tracks.ts';

describe('an artist’s MP3 playlist: ten tracks at most, measured once, played by the page', () => {
  let env: TestEnv;
  let dj: string;
  let fan: string;
  let slug: string;
  before(async () => {
    env = await setup();
    dj = await emailUser(env, 'dj.waves@example.com');
    fan = await emailUser(env, 'fan.waves@example.com');
    const made = await env.as(dj).post('/me/roles/artist', { stageName: 'Song Waves', roles: ['dj'], styles: ['techno'] });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    slug = (await env.ctx.db.query<{ slug: string }>(`select slug from artists where name = 'Song Waves'`)).rows[0].slug;
  });
  after(async () => { await env.close(); });

  it('says why a track link is refused: private or wrong, or its server did not answer', async () => {
    const refused = (e: unknown) => readTrack({ ...env.ctx, fetchAudio: async () => { throw e; } }, 'https://cdn.example.com/a.mp3').then(() => null, (err: { text: { en: string } }) => err.text.en);
    assert.equal(await refused(new PageUnavailable('upstream', 'status 404', 404)), 'This link is private or wrong');
    assert.equal(await refused(new PageUnavailable('upstream', 'socket hang up')), 'cdn.example.com did not answer, try again later');
    assert.equal(await refused(new PageUnavailable('upstream', 'status 503', 503)), 'cdn.example.com did not answer, try again later');
    assert.equal(await refused(new PageUnavailable('too_large')), 'This file is over 60 MB');
  });

  it('reads an MP3 into 600 peaks and its length, without holding it whole', async () => {
    const out = await mp3Peaks(await readFile(new URL('./fixtures/audio/tone.mp3', import.meta.url)));
    assert.equal(out.peaks.length, 600);
    assert.equal(out.durationS, 2);
    // The tone swells and fades: loud in the middle, quiet at both ends.
    assert.ok(out.peaks[300] > 40 && out.peaks[5] < 15 && out.peaks[595] < 15, JSON.stringify([out.peaks[5], out.peaks[300], out.peaks[595]]));
  });

  it('adds tracks for the page, refuses what it cannot read, and holds ten', async () => {
    assert.equal((await env.as(fan).post('/me/artist/tracks', { url: 'https://cdn.example.com/a.mp3', title: 'A' })).status, 404);
    assert.equal((await env.as(dj).post('/me/artist/tracks', { url: 'http://cdn.example.com/a.mp3', title: 'A' })).body.error.code, 'invalid_input');
    assert.equal((await env.as(dj).post('/me/artist/tracks', { url: 'https://cdn.example.com/missing.mp3', title: 'Gone' })).body.error.code, 'audio_unavailable');
    const first = await env.as(dj).post('/me/artist/tracks', { url: 'https://cdn.example.com/sunrise.mp3', title: 'Sunrise (Original Mix)' });
    assert.equal(first.status, 201, JSON.stringify(first.body));
    assert.deepEqual([first.body.title, first.body.durationS, first.body.peaks.length], ['Sunrise (Original Mix)', 2, 600]);
    assert.equal((await env.as(dj).post('/me/artist/tracks', { url: 'https://cdn.example.com/sunrise.mp3', title: 'Again' })).body.error.code, 'track_exists');
    for (let i = 2; i <= 10; i++) assert.equal((await env.as(dj).post('/me/artist/tracks', { url: `https://cdn.example.com/t${i}.mp3`, title: `Track ${i}` })).status, 201);
    assert.equal((await env.as(dj).post('/me/artist/tracks', { url: 'https://cdn.example.com/t11.mp3', title: 'Eleven' })).body.error.code, 'tracks_full');
    const page = (await env.as().get(`/artists/${slug}`)).body;
    assert.equal(page.tracks.length, 10);
    assert.deepEqual(Object.keys(page.tracks[0]).sort(), ['durationS', 'id', 'peaks', 'title', 'url']);
    // Search engines and assistants read the playlist as recordings with their audio.
    const seo = (await env.as().get(`/seo/artists/${slug}`)).body;
    const group = seo.jsonLd['@graph'].find((n: { '@type': string }) => n['@type'] === 'MusicGroup');
    const first10 = group.track[0];
    assert.deepEqual([first10['@type'], first10.name, first10.duration, first10.audio.contentUrl], ['MusicRecording', 'Sunrise (Original Mix)', 'PT0M2S', 'https://cdn.example.com/sunrise.mp3']);
  });

  it('lets only the artist rename, reorder and remove them', async () => {
    const mine = (await env.as(dj).get('/me/artist/tracks')).body;
    assert.equal(mine.max, 10);
    const [a, b] = mine.items;
    assert.equal((await env.as(fan).patch(`/me/artist/tracks/${a.id}`, { title: 'Mine' })).status, 404);
    assert.equal((await env.as(dj).patch(`/me/artist/tracks/${a.id}`, { title: 'Sunrise (Edit)' })).body.title, 'Sunrise (Edit)');
    const order = (await env.as(dj).put('/me/artist/tracks/order', { ids: [b.id, a.id] })).body.items;
    assert.deepEqual(order.slice(0, 2).map((t: { id: string }) => t.id), [b.id, a.id]);
    assert.equal((await env.as(dj).delete(`/me/artist/tracks/${a.id}`)).body.ok, true);
    assert.equal((await env.as().get(`/artists/${slug}`)).body.tracks.length, 9);
  });

  it('holds a person to a number of adds a quarter of an hour, since each reads a whole file', async () => {
    // From a visitor's address (the API's own network is never limited); the limit is the person's, whatever address they use.
    const from = (ip: string) => ({ headers: { 'x-forwarded-for': ip } });
    const statuses: number[] = [];
    for (let i = 0; i < TRACK_ADDS + 1; i++) {
      statuses.push((await env.as(dj).post('/me/artist/tracks', { url: `https://cdn.example.com/loop${i}.mp3`, title: `Loop ${i}` }, from(`203.0.113.${i + 1}`))).status);
    }
    assert.ok(statuses.slice(0, TRACK_ADDS).every((s) => s !== 429), JSON.stringify(statuses));
    assert.equal(statuses.at(-1), 429);
    // Someone else, from the same address, is not held by it.
    assert.notEqual((await env.as(fan).post('/me/artist/tracks', { url: 'https://cdn.example.com/x.mp3', title: 'X' }, from('203.0.113.1'))).status, 429);
  });
});
