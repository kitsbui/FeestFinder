/**
 * Ho Chi Minh City is UTC+7 all year (no DST), so local wall-clock maths is a fixed offset.
 * Calendar dates travel as 'YYYY-MM-DD' strings and times as 'HH:MM'.
 *
 * Events in other cities use their city's IANA timezone through the *In / atZone helpers
 * below. The Vietnam helpers stay for the back office, whose team works in Vietnam.
 */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface Clock { now(): Date }

export const systemClock: Clock = { now: () => new Date() };

export interface ControllableClock extends Clock {
  set(iso: string | Date): void;
  advance(ms: number): void;
}

export function fixedClock(start: string | Date): ControllableClock {
  let t = new Date(start).getTime();
  return {
    now: () => new Date(t),
    set: (iso) => { t = new Date(iso).getTime(); },
    advance: (ms) => { t += ms; },
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

// ---- any timezone -----------------------------------------------------------------------

export const VN_ZONE = 'Asia/Ho_Chi_Minh';

const zoneFormats = new Map<string, Intl.DateTimeFormat>();
function zoneFormat(timezone: string): Intl.DateTimeFormat {
  let f = zoneFormats.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    zoneFormats.set(timezone, f);
  }
  return f;
}

/** How far a timezone's wall clock is ahead of UTC at an instant, in ms. */
export function zoneOffsetMs(timezone: string, at: Date): number {
  if (timezone === VN_ZONE) return VN_OFFSET_MS;
  const p = Object.fromEntries(zoneFormat(timezone).formatToParts(at).map((x) => [x.type, x.value]));
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant a wall-clock date + time in a timezone refers to. */
export function atZone(date: string, time = '00:00', timezone = VN_ZONE): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  // Twice, so a wall clock on the far side of a daylight-saving change still lands right.
  const first = wall - zoneOffsetMs(timezone, new Date(wall));
  return new Date(wall - zoneOffsetMs(timezone, new Date(first)));
}

/** Calendar date in a timezone for an instant. */
export function dateIn(d: Date, timezone = VN_ZONE): string {
  const v = new Date(d.getTime() + zoneOffsetMs(timezone, d));
  return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
}

/** Wall-clock HH:MM in a timezone for an instant. */
export function timeIn(d: Date, timezone = VN_ZONE): string {
  const v = new Date(d.getTime() + zoneOffsetMs(timezone, d));
  return `${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}`;
}

/** An instant written with the timezone's own offset: 2026-10-10T20:00:00+09:00. */
export function isoIn(d: Date, timezone = VN_ZONE): string {
  const off = zoneOffsetMs(timezone, d);
  const v = new Date(d.getTime() + off);
  const sign = off < 0 ? '-' : '+';
  const abs = Math.abs(off) / 60_000;
  return `${v.toISOString().slice(0, 19)}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

// ---- Vietnam --------------------------------------------------------------------------------

/** Calendar date in Vietnam for an instant. */
export function vnDate(d: Date): string {
  const v = new Date(d.getTime() + VN_OFFSET_MS);
  return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
}

/** Wall-clock HH:MM in Vietnam for an instant. */
export function vnTime(d: Date): string {
  const v = new Date(d.getTime() + VN_OFFSET_MS);
  return `${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}`;
}

/** Minutes since local midnight in Vietnam. */
export function vnMinutes(d: Date): number {
  const v = new Date(d.getTime() + VN_OFFSET_MS);
  return v.getUTCHours() * 60 + v.getUTCMinutes();
}

/** The instant a Vietnamese wall-clock date + time refers to. */
export function atVn(date: string, time = '00:00'): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - VN_OFFSET_MS);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * DAY_MS);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function daysBetween(from: string, to: string): number {
  return Math.round((atVn(to).getTime() - atVn(from).getTime()) / DAY_MS);
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** Friday–Sunday of this week; on Saturday or Sunday, the weekend already under way. */
export function weekendRange(today: string): { from: string; to: string } {
  const wd = dayOfWeek(today);
  const toFriday = wd === 0 ? -2 : wd === 6 ? -1 : 5 - wd;
  const from = addDays(today, toFriday);
  return { from, to: addDays(from, 2) };
}

export function monthEnd(today: string): string {
  const [y, m] = today.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${pad(m)}-${pad(last)}`;
}

export type TimeKey = 'tonight' | 'weekend' | '7days' | 'month';
export const TIME_KEYS: TimeKey[] = ['tonight', 'weekend', '7days', 'month'];

/** Date window each Explore time filter covers. An event matches when its dates overlap. */
export function timeWindow(key: TimeKey, today: string): { from: string; to: string } {
  switch (key) {
    case 'tonight': return { from: today, to: today };
    case 'weekend': return weekendRange(today);
    case '7days': return { from: today, to: addDays(today, 7) };
    case 'month': return { from: today, to: monthEnd(today) };
  }
}

/**
 * First door-open and last close of an event. A close at or before the opening
 * time (16:00 – 02:00) runs past midnight into the next day.
 */
export function eventBounds(startsOn: string, endsOn: string, startTime: string, endTime: string, timezone = VN_ZONE) {
  const startsAt = atZone(startsOn, startTime, timezone);
  const overnight = toMinutes(endTime) <= toMinutes(startTime);
  const endsAt = atZone(overnight ? addDays(endsOn, 1) : endsOn, endTime, timezone);
  return { startsAt, endsAt };
}

/** Adds working days (Mon–Fri) — payouts settle "three working days after the event". */
export function addWorkingDays(date: string, n: number): string {
  let d = date;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    const wd = dayOfWeek(d);
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

/** True when a VN wall-clock time falls in 23:00–08:00. */
export function inQuietHours(d: Date): boolean {
  const m = vnMinutes(d);
  return m >= 23 * 60 || m < 8 * 60;
}

/** Next 08:00 in Vietnam at or after `d`. */
export function quietHoursEnd(d: Date): Date {
  const today = vnDate(d);
  const eight = atVn(today, '08:00');
  return d.getTime() < eight.getTime() ? eight : atVn(addDays(today, 1), '08:00');
}
