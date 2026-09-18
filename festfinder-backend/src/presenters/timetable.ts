import type { Queryable } from '../db/index.ts';
import { many } from '../db/index.ts';
import { fill, L, type Localized } from '../lib/i18n.ts';
import { atVn, toMinutes } from '../lib/time.ts';

const DOW = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayLabel(date: string): Localized {
  const [y, m, d] = date.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { en: `${DOW.en[wd]} ${d} ${MON[m - 1]}`, vi: `${DOW.vi[wd]} ${d}/${m}` };
}

export interface TimetableSet { id: string; stageId: string; artist: string; startsAt: Date; endsAt: Date; startMin: number; endMin: number }

/**
 * Days → stages → sets. Minutes are counted from local midnight of the festival day,
 * so a 01:30 set on a night that started at 16:00 is 1530.
 */
export async function loadTimetable(q: Queryable, ev: { id: string; start_time: string | null; end_time: string | null }) {
  const [stages, sets] = await Promise.all([
    many<any>(q, 'select id, name from stages where event_id = $1 order by sort, id', [ev.id]),
    many<any>(q, 'select id, stage_id, day, artist, starts_at, ends_at from sets where event_id = $1 order by day, starts_at', [ev.id]),
  ]);
  if (!sets.length) return null;
  const open = ev.start_time ? toMinutes(ev.start_time) : 0;
  let close = ev.end_time ? toMinutes(ev.end_time) : 1440;
  if (close <= open) close += 1440;

  const days = [...new Set(sets.map((s) => s.day as string))];
  return {
    days: days.map((date) => {
      const midnight = atVn(date).getTime();
      const toMin = (t: Date) => Math.round((new Date(t).getTime() - midnight) / 60000);
      const daySets = sets.filter((s) => s.day === date);
      return {
        date,
        label: dayLabel(date),
        window: { startMin: open, endMin: close },
        stages: stages.map((st) => ({
          id: st.id as string,
          name: st.name as Localized,
          sets: daySets.filter((s) => s.stage_id === st.id).map((s): TimetableSet => ({
            id: s.id, stageId: s.stage_id, artist: s.artist, startsAt: s.starts_at, endsAt: s.ends_at,
            startMin: toMin(s.starts_at), endMin: toMin(s.ends_at),
          })),
        })).filter((st) => st.sets.length),
      };
    }),
  };
}

export interface Clash { a: { id: string; artist: string }; b: { id: string; artist: string }; minutes: number; line: Localized }

/** Every pair of picked sets whose times overlap, with the overlap in minutes. */
export function findClashes(picked: { id: string; artist: string; startsAt: Date; endsAt: Date }[]): Clash[] {
  const out: Clash[] = [];
  const sorted = [...picked].sort((x, y) => new Date(x.startsAt).getTime() - new Date(y.startsAt).getTime());
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const p = sorted[i];
      const r = sorted[j];
      const overlap = Math.min(new Date(p.endsAt).getTime(), new Date(r.endsAt).getTime()) - Math.max(new Date(p.startsAt).getTime(), new Date(r.startsAt).getTime());
      if (overlap > 0) {
        const minutes = Math.round(overlap / 60000);
        out.push({
          a: { id: p.id, artist: p.artist }, b: { id: r.id, artist: r.artist }, minutes,
          line: fill(L('{a} and {b} overlap by {m} minutes', '{a} và {b} trùng nhau {m} phút'), { a: p.artist, b: r.artist, m: minutes }),
        });
      }
    }
  }
  return out;
}
