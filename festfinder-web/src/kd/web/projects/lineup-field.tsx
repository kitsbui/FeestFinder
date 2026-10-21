'use client';
/**
 * A project's lineup field: type a name, pick the artist's profile from the suggestions
 * (GET /artists/suggest), or add the name as it is; saving makes a profile for a new name that
 * waits for its artist to claim it (services/projects.ts syncProjectArtists). The order is the
 * owner's.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { CheckCircleIcon, PlusIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { Chip } from '../../ui/actions';
import { FieldLabel, Input } from '../../ui/forms';
import { Avatar } from '../../ui/parts';
import { PROJ_ALL as PROJ } from './copy-own';
import type { LineupArtist } from './model';

const MAX = 30;
const key = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim();

export function LineupField({ lang, value, onChange, disabled }: { lang: Lang; value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const T = pick(PROJ, lang);
  const id = useId();
  const [text, setText] = useState('');
  const [hits, setHits] = useState<LineupArtist[]>([]);
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const seq = useRef(0);
  const q = text.trim();

  useEffect(() => {
    if (!q) { setHits([]); return; }
    const n = ++seq.current;
    const t = setTimeout(() => {
      FF.maybe(FF.get('/artists/suggest?q=' + encodeURIComponent(q)), { items: [] }).then((r: { items: LineupArtist[] }) => {
        if (n === seq.current) { setHits(r.items); setAt(0); }
      });
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const taken = new Set(value.map(key));
  const shown = hits.filter((h) => !taken.has(key(h.name)));
  // The name as typed, unless a profile already has exactly that name.
  const asTyped = q && !taken.has(key(q)) && !hits.some((h) => key(h.name) === key(q)) ? q : null;
  const options: { name: string; artist: LineupArtist | null }[] = [...shown.map((a) => ({ name: a.name, artist: a })), ...(asTyped ? [{ name: asTyped, artist: null }] : [])];

  const add = (name: string) => {
    const n = name.replace(/\s+/g, ' ').trim().slice(0, 120);
    if (n && !taken.has(key(n)) && value.length < MAX) onChange([...value, n]);
    setText(''); setHits([]); setOpen(false);
  };
  const listId = id + '-list';
  const expanded = open && options.length > 0;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id}>{T.fLineup}</FieldLabel>
      {value.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((n) => (
            <li key={n}>
              <Chip on disabled={disabled} onClick={() => onChange(value.filter((x) => x !== n))} aria-label={fill(T.removeArtist, { n })}>
                {n}<XIcon size={12} aria-hidden="true" />
              </Chip>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative">
        <Input
          id={id}
          value={text}
          disabled={disabled || value.length >= MAX}
          placeholder={T.fLineupPh}
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded ? `${listId}-${at}` : undefined}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && options.length) { e.preventDefault(); setAt((i) => (i + 1) % options.length); }
            else if (e.key === 'ArrowUp' && options.length) { e.preventDefault(); setAt((i) => (i - 1 + options.length) % options.length); }
            else if (e.key === 'Enter') { e.preventDefault(); if (options[at]) add(options[at].name); else if (q) add(q); }
            else if (e.key === 'Escape') setOpen(false);
          }}
        />
        {expanded ? (
          <ul id={listId} role="listbox" aria-label={T.fLineup} className="kd-menu absolute inset-x-0 top-full z-30 mt-1.5 flex flex-col p-1.5">
            {options.map((o, i) => (
              <li key={o.artist ? o.artist.slug : '+' + o.name} id={`${listId}-${i}`} role="option" aria-selected={i === at}>
                <button type="button" tabIndex={-1} className="kd-mi w-full text-left" data-on={i === at || undefined} onMouseDown={(e) => e.preventDefault()} onClick={() => add(o.name)}>
                  {o.artist ? (
                    <>
                      <Avatar name={o.artist.name} src={o.artist.imageUrl} size={28} />
                      <span className="kd-ell min-w-0 flex-1">{o.artist.name}</span>
                      {o.artist.claimed ? <CheckCircleIcon size={16} className="shrink-0 text-info" aria-label={T.claimedProfile} /> : null}
                    </>
                  ) : (
                    <>
                      <PlusIcon size={18} className="shrink-0 text-fg-3" aria-hidden="true" />
                      <span className="kd-ell min-w-0 flex-1">{fill(T.newArtist, { n: o.name })}</span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
