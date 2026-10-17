'use client';
/**
 * "Thêm lịch" (owner, 2026-10-17): straight into the person's own Google Calendar with the night
 * filled in (title, start and end in the event's timezone, the venue, a link back), signed in as
 * the account they use here (authuser). On Android the calendar app itself opens on a new event
 * with the same fields (an INSERT intent; Google Calendar's page if no app answers). Apple
 * Calendar and Outlook take the .ics file from the menu beside it.
 */
import { useEffect, useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../../copy';
import { useKd } from '../../runtime';
import { buttonClass } from '../../ui/actions';
import { Menu, MenuItem } from '../../ui/menu';
import type { EventDetail } from '../../types';
import { useEvent } from './context';

const COPY = {
  add: { en: 'Add to calendar', vi: 'Thêm lịch' },
  more: { en: 'Other calendars', vi: 'Lịch khác' },
  ics: { en: 'Apple Calendar, Outlook (.ics)', vi: 'Lịch Apple, Outlook (.ics)' },
};

/** 20261218T130000Z: an instant as Google Calendar reads it. */
const gcalInstant = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
/** 20261218: a day, for a night with no time yet. */
const gcalDay = (date: string) => date.replace(/-/g, '');
const nextDay = (date: string) => new Date(Date.parse(date + 'T00:00:00Z') + 86_400_000).toISOString().slice(0, 10);

export interface CalendarFields { title: string; startMs: number | null; endMs: number | null; dates: string; location: string; details: string; timezone: string }

/** What every calendar gets: the night's name, when, where, and the way back to it. */
export function calendarFields(ev: EventDetail, lang: Lang, origin: string): CalendarFields {
  const place = [ev.venue.name, ev.venue.address, ev.cityLabel?.[lang]].filter((x, i, all) => x && all.indexOf(x) === i).join(', ');
  const about = (ev.description?.[lang] || ev.description?.vi || ev.description?.en || '').trim();
  const link = `${origin}/e/${encodeURIComponent(ev.slug)}${lang === 'en' ? '?lang=en' : ''}`;
  const details = [about.length > 300 ? about.slice(0, 297) + '…' : about, link].filter(Boolean).join('\n\n');
  const timed = !!(ev.startsAt && ev.startTime);
  const dates = timed
    ? `${gcalInstant(ev.startsAt!)}/${gcalInstant(ev.endsAt ?? ev.startsAt!)}`
    : `${gcalDay(ev.startsOn ?? '')}/${gcalDay(nextDay(ev.endsOn ?? ev.startsOn ?? ''))}`;
  return {
    title: ev.title, dates, location: place, details, timezone: ev.timezone,
    startMs: timed ? Date.parse(ev.startsAt!) : null, endMs: timed ? Date.parse(ev.endsAt ?? ev.startsAt!) : null,
  };
}

/** Google Calendar's new-event page, filled in, in the account signed in here when Google knows it. */
export function googleCalendarUrl(f: CalendarFields, email: string | null | undefined): string {
  const q = new URLSearchParams({ action: 'TEMPLATE', text: f.title, dates: f.dates, details: f.details, location: f.location, ctz: f.timezone });
  if (email) q.set('authuser', email);
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}

/** Android: the calendar app on a new event with the same fields; Google Calendar's page when no app answers. */
export function androidCalendarIntent(f: CalendarFields, fallback: string): string {
  const e = encodeURIComponent;
  const extras = [`S.title=${e(f.title)}`, `S.eventLocation=${e(f.location)}`, `S.description=${e(f.details)}`];
  if (f.startMs !== null && f.endMs !== null) extras.push(`l.beginTime=${f.startMs}`, `l.endTime=${f.endMs}`);
  else extras.push('B.allDay=true');
  return `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.item/event;${extras.join(';')};S.browser_fallback_url=${e(fallback)};end`;
}

export function CalendarButton({ lang, className }: { lang: Lang; className?: string }) {
  const T = pick(COPY, lang);
  const { ev } = useEvent();
  const kd = useKd();
  const [origin, setOrigin] = useState('https://feestfinder.com');
  const [android, setAndroid] = useState(false);
  useEffect(() => { setOrigin(location.origin); setAndroid(/Android/i.test(navigator.userAgent)); }, []);
  if (ev.past) return null;
  const fields = calendarFields(ev, lang, origin);
  const google = googleCalendarUrl(fields, kd.user?.email);
  return (
    // Two buttons side by side (each its own tap area): Google Calendar, and the menu of other calendars.
    <span className={`inline-flex items-center ${className ?? ''}`}>
      <a
        className={buttonClass({ tone: 'ghost', size: 'sm' }, 'pr-2')}
        href={google}
        target="_blank"
        rel="noopener"
        data-calendar="google"
        onClick={(e) => { if (android) { e.preventDefault(); location.href = androidCalendarIntent(fields, google); } }}
      >
        {T.add}
      </a>
      <Menu label={T.more} align="end" trigger={(p) => (
        <button type="button" {...p} ref={p.ref} className={buttonClass({ tone: 'ghost', size: 'sm' }, 'px-2')} aria-label={T.more}>
          <CaretDownIcon size={14} aria-hidden="true" />
        </button>
      )}>
        <MenuItem href={`/events/${ev.id}/calendar.ics`}>{T.ics}</MenuItem>
      </Menu>
    </span>
  );
}
