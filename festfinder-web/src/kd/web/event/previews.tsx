'use client';
/**
 * "Nghe trước" on an event page (design v2 phase 9): one mix of each artist on the lineup who has a
 * profile, three at most. Each is a plain row until someone presses play; then, and only then, the
 * service's own player loads in its place, one at a time (CLAUDE.md, Mixes).
 */
import { useState } from 'react';
import { PlayIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { clock } from '../../format';
import { KdLink as Link, inLang } from '../../link';
import { Art } from '../../ui/parts';
import { WEB } from '../copy';
import { useEvent } from './context';

export function ListenFirst({ lang }: { lang: Lang }) {
  const { ev } = useEvent();
  const T = pick(WEB, lang);
  const [playing, setPlaying] = useState<string | null>(null);
  const items = ev.previews ?? [];
  if (!items.length) return null;
  return (
    <section className="flex flex-col gap-3.5" aria-labelledby="listen-h">
      <h2 id="listen-h" className="kd-d3">{T.listenFirst}</h2>
      <ul className="flex flex-col">
        {items.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 border-b border-line-1 py-3.5 first:pt-0">
            {playing === m.id ? (
              <iframe
                title={`${m.providerLabel}: ${m.title}`}
                src={m.playSrc}
                height={m.height}
                loading="lazy"
                allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
                className="w-full rounded-card border-0 bg-surface-1"
              />
            ) : (
              <button
                type="button"
                className="group flex min-w-0 items-center gap-3.5 text-left"
                onClick={() => { setPlaying(m.id); FF.track('mix_play', { kind: m.provider, surface: 'event' }); }}
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-tag">
                  <Art title={m.title} family="edm" cover={m.thumbnailUrl} className="absolute inset-0 rounded-none" />
                  <span className="absolute inset-0 grid place-items-center bg-surface-0/30 text-fg-1 transition-colors duration-(--dur-1) group-hover:bg-surface-0/10" aria-hidden="true"><PlayIcon size={20} weight="fill" /></span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="kd-h kd-ell">{m.title}</span>
                  <span className="kd-s kd-ell">{[m.artist.name, m.providerLabel, m.durationS ? clock(m.durationS) : null].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="sr-only">{T.listenPlay}</span>
              </button>
            )}
            {playing === m.id ? <Link href={inLang('/a/' + m.artist.slug + '#mix', lang)} className="kd-s kd-hit self-start hover:text-fg-1">{fill(T.moreFrom, { a: m.artist.name })}</Link> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
