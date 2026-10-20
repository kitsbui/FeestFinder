'use client';
/**
 * An artist's MP3 playlist (festfinder-backend routes/tracks.ts): up to ten tracks played by the
 * page's own player, waveform and all, with wavesurfer.js (github.com/katspaugh/wavesurfer.js,
 * BSD-3-Clause). The waveform is drawn at once from the peaks the API measured; the player's
 * code loads when the playlist comes near the screen, and a file streams only when someone
 * presses play (`preload="none"`), so the page never downloads audio it does not play.
 * The hero's "Phát" (a link to #listen with `data-play-artist`, no JS of its own) plays the first track.
 */
import { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from '@phosphor-icons/react/ssr';
import type WaveSurfer from 'wavesurfer.js';
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { IconButton } from '../../ui/actions';
import { MIXES } from './copy';
import { length, type Track } from './track';


/** The waveform as bars, before the player's code arrives (the same height, so nothing moves). */
function Bars({ peaks }: { peaks: number[] }) {
  const n = 120;
  const bars = Array.from({ length: n }, (_, i) => {
    const from = Math.floor((i * peaks.length) / n), to = Math.max(from + 1, Math.floor(((i + 1) * peaks.length) / n));
    return Math.max(4, Math.max(...peaks.slice(from, to)));
  });
  return (
    <svg viewBox={`0 0 ${n * 4} 100`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {bars.map((v, i) => <rect key={i} x={i * 4} y={50 - v / 2} width="2.5" height={v} rx="1.2" className="fill-line-2" />)}
    </svg>
  );
}

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function Playlist({ lang, tracks, artist }: { lang: Lang; tracks: Track[]; artist: string }) {
  const T = pick(MIXES, lang);
  const box = useRef<HTMLElement>(null);
  const wave = useRef<HTMLDivElement>(null);
  const ws = useRef<WaveSurfer | null>(null);
  const loading = useRef<Promise<WaveSurfer> | null>(null);
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(0);
  const current = tracks[at];

  /** The player, made once: its code is fetched the first time it is needed. */
  const player = (index: number) => {
    loading.current ??= import('wavesurfer.js').then(({ default: WS }) => {
      const media = new Audio();
      media.preload = 'none';
      const t = tracks[index];
      const w = WS.create({
        container: wave.current!, media, height: 72, barWidth: 2, barGap: 2, barRadius: 2, cursorWidth: 0, normalize: true,
        waveColor: token('--color-line-2'), progressColor: token('--color-info'),
        url: t.url, peaks: [t.peaks.map((p) => p / 100)], duration: t.durationS ?? undefined,
      });
      w.on('ready', () => setReady(true));
      w.on('play', () => setPlaying(true));
      w.on('pause', () => setPlaying(false));
      w.on('timeupdate', (s) => setTime(s));
      ws.current = w;
      return w;
    });
    return loading.current;
  };

  const play = async (index: number) => {
    const w = await player(index);
    if (index !== at || !w.getDuration()) {
      const t = tracks[index];
      setAt(index); setTime(0);
      // Without a known length the player waits for the file's, which only comes once it plays.
      const loaded = w.load(t.url, [t.peaks.map((p) => p / 100)], t.durationS ?? undefined);
      if (t.durationS) await loaded;
    }
    void w.play();
    FF.track('mix_play', { kind: 'mp3', surface: 'artist' });
  };
  const toggle = async () => {
    const w = ws.current;
    if (w && playing) { w.pause(); return; }
    await play(at);
  };

  // Near the screen: fetch the player's code so the first press plays at once.
  useEffect(() => {
    const el = box.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { void player(0); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once
  }, []);
  // The hero's "Phát" (a plain link until this player has loaded) and the end of a track.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('[data-play-artist]')) return;
      e.preventDefault();
      void play(0);
      box.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  });
  useEffect(() => {
    const w = ws.current;
    if (!w) return;
    const next = () => { if (at + 1 < tracks.length) void play(at + 1); };
    return w.on('finish', next);
  });
  useEffect(() => () => ws.current?.destroy(), []);

  if (!current) return null;
  return (
    <section ref={box} aria-label={T.playlist} className="kd-card flex scroll-mt-32 flex-col gap-4 p-4 tab:p-6">
      <div className="flex items-center gap-3 tab:gap-4">
        <button type="button" onClick={toggle} className="kd-play" aria-label={playing ? T.pause : T.playTrack}>
          {playing ? <PauseIcon size={26} weight="fill" aria-hidden="true" /> : <PlayIcon size={26} weight="fill" aria-hidden="true" />}
        </button>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="kd-h kd-ell">{current.title}</span>
          <span className="kd-s kd-ell">{artist}</span>
        </span>
        <span className="kd-s kd-num hidden tab:inline">{length(time)} / {length(current.durationS)}</span>
        <IconButton label={T.prev} disabled={at === 0} onClick={() => void play(at - 1)}><SkipBackIcon size={20} weight="fill" aria-hidden="true" /></IconButton>
        <IconButton label={T.next} disabled={at + 1 >= tracks.length} onClick={() => void play(at + 1)}><SkipForwardIcon size={20} weight="fill" aria-hidden="true" /></IconButton>
      </div>
      {/* The bars until the player draws its own, then the player's (it seeks on a tap). */}
      <div className="relative h-18 w-full" aria-hidden="true">
        {!ready ? <Bars peaks={current.peaks} /> : null}
        <div ref={wave} className={cx('absolute inset-0', !ready && 'opacity-0')} />
      </div>
      <ol className="flex flex-col border-t border-line-1">
        {tracks.map((t, i) => (
          <li key={t.id}>
            <button type="button" onClick={() => void play(i)} aria-current={i === at ? 'true' : undefined} className="kd-track">
              <span className="kd-num w-6 shrink-0 text-center text-fg-3">{i === at && playing ? <PauseIcon size={14} weight="fill" className="inline text-info" aria-hidden="true" /> : i + 1}</span>
              <span className="kd-ell min-w-0 flex-1 text-left">{t.title}</span>
              <span className="kd-num shrink-0 text-fg-3">{length(t.durationS)}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
