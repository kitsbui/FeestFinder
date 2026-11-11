import { MPEGDecoder } from 'mpg123-decoder';
import type { Ctx } from '../context.ts';
import { many } from '../db/index.ts';
import type { Row } from '../db/rows.ts';
import { badRequest } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { fetchPublic, hostRefused, PageUnavailable, type PublicResponse } from './fetchpage.ts';

/*
 * An artist's MP3 playlist (migration 061): a track is an https link to an MP3 file the artist
 * hosts. When it is added, the API reads the file once, decodes it piece by piece (mpg123 in
 * WebAssembly, no native tools) and keeps its waveform: 600 peaks and the duration. The page
 * draws that waveform and streams the file itself only when someone presses play, so the browser
 * never has to download or decode it to show it.
 */

export const TRACKS_MAX = 10;
export const PEAKS = 600;
/** A long DJ set fits; anything larger is not a track to stream from a profile. */
const MAX_BYTES = 60_000_000;

/** Reads an audio file someone linked; the tests and the screen tests (FAKE_REMOTE_MEDIA) read a fixture instead. */
export type AudioFetcher = (url: string) => Promise<PublicResponse>;
export const fetchAudio: AudioFetcher = (url) => fetchPublic(url, {
  accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.5', types: /^(audio\/(mpeg|mp3|mpeg3|x-mpeg(-3)?)|application\/octet-stream|binary\/octet-stream)\b/i,
  maxBytes: MAX_BYTES, timeoutMs: 30_000,
});

/**
 * Every MP3 link as the tests and the screen tests see it (FAKE_REMOTE_MEDIA): the
 * repository's two-second tone; a link with "missing" in it is not found.
 */
export const fakeAudio: AudioFetcher = async (url) => {
  if (/missing/.test(url)) throw new PageUnavailable('upstream', 'fake network: not found', 404);
  const { readFile } = await import('node:fs/promises');
  const bytes = await readFile(new URL('../../test/fixtures/audio/tone.mp3', import.meta.url));
  return { status: 200, url, text: '', contentType: 'audio/mpeg', etag: null, lastModified: null, bytes, totalBytes: bytes.length };
};

/** The waveform of an MP3: its loudest sample in each of `points` slices, 0–100, and its length in seconds. */
export async function mp3Peaks(bytes: Uint8Array, points = PEAKS): Promise<{ peaks: number[]; durationS: number }> {
  const decoder = new MPEGDecoder();
  await decoder.ready;
  // The loudest sample of every 1024, kept as the file decodes: a long set never sits in memory whole.
  const BLOCK = 1024;
  const blocks: number[] = [];
  let carry = 0, inBlock = 0, samples = 0, rate = 0;
  try {
    for (let at = 0; at < bytes.length; at += 64 * 1024) {
      const { channelData, samplesDecoded, sampleRate } = decoder.decode(bytes.subarray(at, at + 64 * 1024));
      if (!samplesDecoded) continue;
      rate = sampleRate || rate;
      const left = channelData[0], right = channelData[1] ?? channelData[0];
      for (let i = 0; i < samplesDecoded; i++) {
        const v = Math.max(Math.abs(left[i]), Math.abs(right[i]));
        if (v > carry) carry = v;
        if (++inBlock === BLOCK) { blocks.push(carry); carry = 0; inBlock = 0; }
      }
      samples += samplesDecoded;
    }
  } finally {
    decoder.free();
  }
  if (inBlock) blocks.push(carry);
  if (!samples || !rate) throw badRequest('audio_unreadable', L('This file is not an MP3 we can play', 'File này không phải MP3 đọc được'));
  const peaks: number[] = [];
  for (let p = 0; p < points; p++) {
    const from = Math.floor((p * blocks.length) / points), to = Math.max(from + 1, Math.floor(((p + 1) * blocks.length) / points));
    let m = 0;
    for (let i = from; i < to && i < blocks.length; i++) if (blocks[i] > m) m = blocks[i];
    peaks.push(Math.round(Math.min(1, m) * 100));
  }
  return { peaks, durationS: Math.round(samples / rate) };
}

/** A linked MP3, read and measured: refused when it is not public, too large or not an MP3. */
export async function readTrack(ctx: Ctx, url: string): Promise<{ peaks: number[]; durationS: number; bytes: number }> {
  let res: PublicResponse;
  try {
    res = await ctx.fetchAudio(url);
  } catch (e) {
    if (e instanceof PageUnavailable) {
      if (e.reason === 'too_large') throw badRequest('audio_unavailable', L('This file is over 60 MB', 'File này lớn hơn 60 MB'));
      if (e.reason === 'not_html') throw badRequest('audio_unavailable', L('This link is not an MP3 file', 'Link này không phải file MP3'));
      if (hostRefused(e)) throw badRequest('audio_unavailable', L('This link is private or wrong', 'Link này không công khai hoặc không đúng'));
      // The file's own server did not answer: name it, as the mixes name their service.
      const host = new URL(url).hostname;
      throw badRequest('audio_unavailable', L(`${host} did not answer, try again later`, `${host} chưa phản hồi, thử lại sau`));
    }
    throw e;
  }
  return { ...(await mp3Peaks(res.bytes)), bytes: res.bytes.length };
}

export const presentTrack = (t: Row<'artist_tracks'>) => ({ id: t.id, title: t.title, url: t.url, durationS: t.duration_s, peaks: t.peaks as number[] });
export type TrackView = ReturnType<typeof presentTrack>;

/** An artist's playlist in its order, as the page and its structured data read it. */
export async function tracksOf(q: Parameters<typeof many>[0], artistId: string): Promise<TrackView[]> {
  return (await many<Row<'artist_tracks'>>(q, 'select * from artist_tracks where artist_id = $1 order by sort, created_at', [artistId])).map(presentTrack);
}
