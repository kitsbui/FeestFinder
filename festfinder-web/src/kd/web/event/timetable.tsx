'use client';
/** The stage timeline of an event's line-up (design v2 phase 14: loaded when "Lịch theo sân khấu" opens). */
import { useEffect, useRef, useState } from 'react';
import { WarningIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, tx } from '../../copy';
import { cx } from '../../cx';
import { familyOf } from '../../genre';
import { useKd } from '../../runtime';
import { Switch } from '../../ui/forms';
import { Marker } from '../../ui/parts';
import type { Clash, TimetableSet } from '../../types';
import { WEB } from '../copy';
import { useEvent } from './context';

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export function Timetable({ lang, plan, onChanged, signedIn }: {
  lang: Lang; plan: { setIds: string[]; remindSetIds: string[]; clashes: Clash[] } | null; onChanged: () => Promise<void>; signedIn: boolean;
}) {
  const { ev } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const fam = familyOf(ev.genre);
  const [picked, setPicked] = useState<Set<string>>(new Set(plan?.setIds ?? []));
  const [clashes, setClashes] = useState<Clash[]>(plan?.clashes ?? []);
  const [remind, setRemind] = useState(!!plan && plan.setIds.length > 0 && plan.remindSetIds.length === plan.setIds.length);
  // The plan the page loaded arrives after the first paint; once someone has picked here,
  // what the API answered to their picks is newer than it.
  const touched = useRef(false);
  useEffect(() => {
    if (touched.current) return;
    setPicked(new Set(plan?.setIds ?? []));
    setClashes(plan?.clashes ?? []);
    setRemind(!!plan && plan.setIds.length > 0 && plan.remindSetIds.length === plan.setIds.length);
  }, [plan]);
  const headName = ev.lineup[0];

  const apply = (out: { setIds: string[]; remindSetIds: string[]; clashes: Clash[] }) => {
    touched.current = true;
    setPicked(new Set(out.setIds));
    setClashes(out.clashes);
    setRemind(out.setIds.length > 0 && out.remindSetIds.length === out.setIds.length);
  };
  const toggle = async (s: TimetableSet) => {
    if (!kd.requireSignIn(undefined, T.gatePlan)) return;
    const on = !picked.has(s.id);
    try {
      apply(await (on ? FF.put('/me/plan/sets/' + s.id, remind ? { remind: true } : {}) : FF.del('/me/plan/sets/' + s.id)));
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const patch = async (body: { clear?: boolean; remindAll?: boolean }) => {
    try {
      const out = await FF.patch('/me/plan/events/' + ev.id, body);
      apply(out);
      if (out.message) kd.toast(FF.text(out.message, lang));
      void onChanged();
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };

  return (
    <div className="flex flex-col gap-4">
      {signedIn && picked.size ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="kd-s text-fg-2">{fill(T.planCount, { n: picked.size })}</span>
          <label className="flex items-center gap-2 kd-s">
            <Switch checked={remind} onChange={(v) => patch({ remindAll: v })} label={T.planRemind} />
            {T.planRemind}
          </label>
          <button type="button" className="kd-more" onClick={() => patch({ clear: true })}>{T.planClear}</button>
        </div>
      ) : null}
      {clashes.length ? (
        <ul className="flex flex-col gap-1">
          {clashes.map((c) => (
            <li key={c.a.id + c.b.id} className="flex items-center gap-2 kd-s text-warn">
              <WarningIcon size={16} aria-hidden="true" />
              {fill(T.clashLine, { a: c.a.artist, b: c.b.artist, m: c.minutes })}
            </li>
          ))}
        </ul>
      ) : null}
      {ev.timetable!.days.map((d) => {
        const span = Math.max(60, d.window.endMin - d.window.startMin);
        const ticks: number[] = [];
        for (let m = Math.ceil(d.window.startMin / 120) * 120; m <= d.window.endMin; m += 120) ticks.push(m);
        return (
          <div key={d.date} className="@container flex flex-col gap-2">
            {ev.timetable!.days.length > 1 ? <span className="kd-m">{tx(d.label, lang)}</span> : null}
            {/* Under 640px a time axis has no room: each stage is a list of its sets instead (nothing scrolls sideways). */}
            <div className="flex flex-col gap-4 @min-[640px]:hidden">
              {d.stages.map((st) => (
                <div key={st.id} className="flex flex-col">
                  <span className="kd-hs flex items-center gap-2 pb-1"><Marker family={fam} />{tx(st.name, lang)}</span>
                  {[...st.sets].sort((a, b) => a.startMin - b.startMin).map((s) => {
                    const on = picked.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        aria-label={fill(on ? T.planDrop : T.planPick, { a: s.artist }) + ' · ' + hhmm(s.startMin) + '–' + hhmm(s.endMin)}
                        onClick={() => toggle(s)}
                        className={cx('kd-lrow min-h-12 w-full text-left', on && 'text-fg-1')}
                      >
                        <span className="kd-m kd-num w-24 shrink-0">{hhmm(s.startMin)}–{hhmm(s.endMin)}</span>
                        <span className={cx('kd-t kd-ell flex-1', s.artist === headName ? 'font-medium text-fg-1' : 'text-fg-2')}>{s.artist}</span>
                        {on ? <span className="kd-st kd-ok shrink-0">{T.planPicked}</span> : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="hidden @min-[640px]:block">
              <div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                  <span />
                  <div className="relative h-4">
                    {ticks.map((m) => (
                      <span key={m} className="kd-m kd-num absolute -translate-x-1/2" style={{ left: `${((m - d.window.startMin) / span) * 100}%` }}>{hhmm(m)}</span>
                    ))}
                  </div>
                </div>
                {d.stages.map((st) => (
                  <div key={st.id} className="mt-2 grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
                    <span className="kd-hs flex items-center gap-2"><Marker family={fam} />{tx(st.name, lang)}</span>
                    <div className="relative h-11">
                      {st.sets.map((s) => {
                        const left = ((s.startMin - d.window.startMin) / span) * 100;
                        const width = ((s.endMin - s.startMin) / span) * 100;
                        const on = picked.has(s.id);
                        const hl = s.artist === headName;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={on}
                            aria-label={fill(on ? T.planDrop : T.planPick, { a: s.artist }) + ' · ' + hhmm(s.startMin) + '–' + hhmm(s.endMin)}
                            onClick={() => toggle(s)}
                            className={cx(
                              'absolute inset-y-0 flex items-center justify-between gap-2 overflow-hidden whitespace-nowrap rounded-btn px-2.5 text-left text-[13px] transition-[box-shadow,background-color] duration-(--dur-1) ease-ff',
                              hl ? 'bg-inverse font-medium text-on-inverse' : 'bg-surface-2 text-fg-2 shadow-[inset_0_0_0_1px_var(--color-line-1)] hover:shadow-[inset_0_0_0_1px_var(--color-line-2)]',
                              on && 'shadow-[inset_0_0_0_1.5px_var(--color-info)]',
                              on && !hl && 'bg-info/[0.06] text-fg-1',
                            )}
                            style={{ left: `${left}%`, width: `calc(${width}% - 3px)` }}
                          >
                            <span className="kd-ell">{s.artist}</span>
                            {hl ? <Marker family={fam} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
