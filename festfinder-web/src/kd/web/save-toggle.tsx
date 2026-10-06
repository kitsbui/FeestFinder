'use client';
/** The heart on a card: lime and filled when saved; asks for sign-in first when needed. */
import { HeartIcon } from '@phosphor-icons/react/ssr';
import { useSaved } from '../runtime';

export function SaveToggle({ id, label }: { id: string; label: string }) {
  const [on, toggle] = useSaved(id);
  return (
    <button type="button" aria-label={label} aria-pressed={on} onClick={toggle} className="kd-ib kd-ib-sm kd-glass text-paper">
      <HeartIcon size={18} weight={on ? 'fill' : 'regular'} aria-hidden="true" />
    </button>
  );
}
