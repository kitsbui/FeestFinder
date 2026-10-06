'use client';
/**
 * The top of a Studio screen (Studio-Dashboard): the screen's name, the event title as an inline
 * dropdown of every event with its date, the date · venue line with its status, and the screen's
 * own controls on the right.
 */
import type { ReactNode } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/ssr';
import { pick } from '../copy';
import { dayMonth, timeRange, whenShort } from '../format';
import { familyOf } from '../genre';
import { Menu, MenuItem } from '../ui/menu';
import { Marker, Status, type StatusTone } from '../ui/parts';
import { STUDIO } from './copy';
import { useStudio, type OrgEvent } from './root';

export const statusTone = (s: OrgEvent['status']): StatusTone => (s === 'live' ? 'ok' : s === 'in_review' ? 'warn' : s === 'rejected' ? 'bad' : 'none');

export function StudioHead({ label, right, only }: { label: string; right?: ReactNode; only?: (e: OrgEvent) => boolean }) {
  const { lang, events, event, setEvent } = useStudio();
  const T = pick(STUDIO, lang);
  const list = only ? events.filter(only) : events;
  return (
    <div className="kd-sec items-end pb-2">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="kd-m">{label}</span>
        {event ? (
          <>
            <h1 className="kd-d2 relative z-[27]">
              <Menu
                inline
                label={T.pickEvent}
                width={340}
                trigger={(p) => (
                  <button type="button" {...p} ref={p.ref} className="kd-dd text-left">
                    {event.title}
                    <CaretDownIcon size={22} className="kd-chev text-fog" aria-hidden="true" />
                  </button>
                )}
              >
                {list.map((e) => (
                  <MenuItem key={e.id} checked={e.id === event.id} icon={<Marker family={familyOf(e.genre)} />} aside={e.startsOn ? dayMonth(e.startsOn, lang) : T.draft} onSelect={() => setEvent(e.id)}>
                    {e.title}
                  </MenuItem>
                ))}
              </Menu>
            </h1>
            <span className="kd-s flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="kd-num">{[whenShort(event, lang), timeRange(event), event.venueName].filter(Boolean).join(' · ')}</span>
              <Status tone={statusTone(event.status)}>{event.statusLabel[lang]}</Status>
            </span>
          </>
        ) : <h1 className="kd-d2">{T.noEvents}</h1>}
      </div>
      {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  );
}

