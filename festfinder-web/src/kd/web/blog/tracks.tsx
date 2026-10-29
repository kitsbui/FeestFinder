'use client';
/**
 * A post's tracks: each a plain row until someone presses play; then, and only then, the
 * service's own player loads in its place, one at a time (CLAUDE.md, Mixes).
 */
import { useState } from 'react';
import { ArrowSquareOutIcon, PlayIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { Art } from '../../ui/parts';
import { BLOG } from './copy';
import { say, type Track } from './model';
import { cx } from '../../cx';
import { square } from '../../img';

export function PostTracks({ lang, tracks }: { lang: Lang; tracks: Track[] }) {
  const T = pick(BLOG, lang);
  const [playing, setPlaying] = useState<string | null>(null);
  if (!tracks.length) return null;
  return (
    <section className="flex max-w-read flex-col gap-3.5" aria-labelledby="tracks-h">
      <h2 id="tracks-h" className="kd-d3">{T.tracks}</h2>
      <ol className="flex flex-col">
        {tracks.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 border-b border-line-1 py-3.5 first:pt-0">
            {playing === m.id ? (
              <iframe
                title={`${m.providerLabel}: ${m.title}`}
                src={m.playSrc}
                height={m.height ?? undefined}
                loading="lazy"
                allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
                allowFullScreen={m.height == null}
                referrerPolicy="strict-origin-when-cross-origin"
                className={cx('w-full rounded-card border-0 bg-surface-1', m.height == null && 'aspect-video')}
              />
            ) : (
              <button
                type="button"
                className="group flex min-w-0 items-center gap-3.5 text-left"
                onClick={() => { setPlaying(m.id); FF.track('mix_play', { kind: m.provider, surface: 'blog' }); }}
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-tag">
                  <Art title={m.title} family="edm" cover={m.thumbnailUrl} fit={square(56)} className="absolute inset-0 rounded-none" />
                  <span className="absolute inset-0 grid place-items-center bg-surface-0/30 text-fg-1 transition-colors duration-(--dur-1) group-hover:bg-surface-0/10" aria-hidden="true"><PlayIcon size={20} weight="fill" /></span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="kd-h kd-ell">{m.title}</span>
                  <span className="kd-s kd-ell kd-num">{[m.year, m.authorName, m.providerLabel].filter(Boolean).join(' · ')}</span>
                  {say(m.note, lang) ? <span className="kd-s text-fg-2">{say(m.note, lang)}</span> : null}
                </span>
                <span className="sr-only">{T.play}</span>
              </button>
            )}
            {playing === m.id && m.url ? (
              <a href={m.url} target="_blank" rel="noopener" className="kd-s kd-hit inline-flex items-center gap-1.5 self-start hover:text-fg-1">
                {fill(T.openOn, { s: m.providerLabel })}<ArrowSquareOutIcon size={14} aria-hidden="true" />
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
