'use client';
/**
 * The line-up: the headline artist, then each set (time · name · stage), then the stage
 * timeline folded in "Lịch theo sân khấu". On the timeline a signed-in person picks the sets
 * they want into their plan; overlaps are flagged and reminders can be switched on.
 */
import { KdLink as Link } from '../../link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CaretRightIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, COMMON, type Lang } from '../../copy';
import { cx } from '../../cx';
import { familyOf, g } from '../../genre';
import { useKd } from '../../runtime';
import { ShowMore } from '../../ui/clamp';
import { Switch } from '../../ui/forms';
import { Accordion, Avatar, Marker } from '../../ui/parts';
import type { Clash, EventDetail, TimetableSet } from '../../types';
import { WEB } from '../copy';
import { useEvent } from './context';

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

interface Act { set: TimetableSet | null; name: string; stage: string | null }

function acts(ev: EventDetail, lang: Lang): Act[] {
  const out: Act[] = [];
  if (ev.timetable) {
    for (const d of ev.timetable.days) {
      d.stages.forEach((st) => st.sets.forEach((s) => out.push({ set: s, name: s.artist, stage: st.name[lang] })));
    }
    // Billing order, as the board draws it: the latest set first.
    out.sort((a, b) => new Date(b.set!.startsAt).getTime() - new Date(a.set!.startsAt).getTime());
  }
  const named = new Set(out.map((a) => a.name));
  for (const n of ev.lineup) if (!named.has(n)) out.push({ set: null, name: n, stage: null });
  return out;
}

export function Lineup({ lang }: { lang: Lang }) {
  const { ev, personal, reload } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const C = pick(COMMON, lang);
  const fam = familyOf(ev.genre);
  const all = useMemo(() => acts(ev, lang), [ev, lang]);
  const headName = ev.lineup[0] ?? all[0]?.name;
  const head = all.find((a) => a.name === headName) ?? null;
  const rest = all.filter((a) => a !== head);
  const slugOf = (name: string) => ev.artistLinks.find((a) => a.name === name)?.slug ?? null;
  const stages = ev.timetable ? Math.max(...ev.timetable.days.map((d) => d.stages.length)) : 0;
  const following = personal?.me?.followingArtists ?? [];
  if (!all.length) return null;

  const headSlug = head ? slugOf(head.name) : null;
  const headBody = head ? (
    <>
      <Avatar name={head.name} size={44} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="kd-hs kd-ell">{head.name}</span>
        {head.set ? <span className="kd-s kd-num">{hhmm(head.set.startMin)}{head.stage ? ' · ' + head.stage : ''}</span> : null}
      </span>
      <span className="kd-tag kd-tag-bone">{T.headline}</span>
      {headSlug ? <CaretRightIcon size={16} className="text-fog" aria-hidden="true" /> : null}
    </>
  ) : null;

  return (
    <section id="lineup" aria-labelledby="lineup-h" className="flex scroll-mt-32 flex-col">
      <div className="flex items-baseline justify-between pb-1.5">
        <h2 id="lineup-h" className="kd-m">{fill(T.lineup, { n: all.length })}</h2>
        {stages > 1 ? <span className="kd-m kd-num">{fill(T.stages, { n: stages })}</span> : null}
      </div>
      {head ? (
        headSlug ? (
          <Link href={'/a/' + headSlug} className={cx('kd-lrow min-h-[68px] border-t border-line', g(fam))}>{headBody}</Link>
        ) : (
          <div className={cx('kd-lrow min-h-[68px] border-t border-line', g(fam))}>{headBody}</div>
        )
      ) : null}
      <ShowMore
        items={rest}
        n={5}
        more={(n) => fill(C.moreN, { n })}
        less={C.less}
        render={(a) => {
          const slug = slugOf(a.name);
          const name = slug ? <Link href={'/a/' + slug} className="hover:underline">{a.name}</Link> : a.name;
          return (
            <div key={(a.set?.id ?? '') + a.name} className="kd-lrow min-h-13">
              <span className="kd-mb kd-num w-13">{a.set ? hhmm(a.set.startMin) : ''}</span>
              <span className="kd-hs min-w-0 flex-1 kd-ell">{name}</span>
              {a.stage ? <span className="kd-s flex items-center gap-1.5"><Marker family={fam} />{a.stage}</span> : null}
            </div>
          );
        }}
      />
      {following.length ? <p className="kd-s pt-3">{fill(T.followingArtists, { n: following.length })}</p> : null}
      {ev.timetable ? (
        <Accordion small summary={T.byStage} className="mt-1">
          <Timetable lang={lang} plan={personal?.me?.plan ?? null} onChanged={reload} signedIn={!!kd.user} />
        </Accordion>
      ) : null}
    </section>
  );
}

function Timetable({ lang, plan, onChanged, signedIn }: {
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
      onChanged();
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };

  return (
    <div className="flex flex-col gap-4">
      {signedIn && picked.size ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="kd-s text-mist">{fill(T.planCount, { n: picked.size })}</span>
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
          <div key={d.date} className="flex flex-col gap-2">
            {ev.timetable!.days.length > 1 ? <span className="kd-m">{d.label[lang]}</span> : null}
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
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
                    <span className="kd-hs flex items-center gap-2"><Marker family={fam} />{st.name[lang]}</span>
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
                              'absolute inset-y-0 flex items-center justify-between gap-2 overflow-hidden whitespace-nowrap rounded-btn px-2.5 text-left text-[13px] transition-[box-shadow,background-color] duration-150 ease-ff',
                              hl ? 'bg-bone font-medium text-ink' : 'bg-obsidian text-mist shadow-[inset_0_0_0_1px_var(--color-line)] hover:shadow-[inset_0_0_0_1px_var(--color-line2)]',
                              on && 'shadow-[inset_0_0_0_1.5px_var(--color-acc)]',
                              on && !hl && 'bg-acc/[0.06] text-paper',
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
