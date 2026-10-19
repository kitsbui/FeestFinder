'use client';
/**
 * The line-up: the headline artist, then each set (time · name · stage), then the stage
 * timeline folded in "Lịch theo sân khấu". On the timeline a signed-in person picks the sets
 * they want into their plan; overlaps are flagged and reminders can be switched on.
 */
import { KdLink as Link } from '../../link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react/ssr';
import { fill, pick, COMMON, type Lang, tx } from '../../copy';
import { cx } from '../../cx';
import { familyOf, g } from '../../genre';
import { useKd } from '../../runtime';
import { ShowMore } from '../../ui/clamp';
import { Accordion, Avatar, Marker } from '../../ui/parts';
import type { EventDetail, TimetableSet } from '../../types';
import { WEB } from '../copy';
import { useEvent } from './context';

/** Loaded when the accordion opens (design v2 phase 14). */
const Timetable = dynamic(() => import('./timetable').then((m) => m.Timetable), { ssr: false });

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

interface Act { set: TimetableSet | null; name: string; stage: string | null }

function acts(ev: EventDetail, lang: Lang): Act[] {
  const out: Act[] = [];
  if (ev.timetable) {
    for (const d of ev.timetable.days) {
      d.stages.forEach((st) => st.sets.forEach((s) => out.push({ set: s, name: s.artist, stage: tx(st.name, lang) })));
    }
    // Billing order, as the board draws it: the latest set first.
    out.sort((a, b) => new Date(b.set!.startsAt).getTime() - new Date(a.set!.startsAt).getTime());
  }
  const named = new Set(out.map((a) => a.name));
  for (const n of ev.lineup) if (!named.has(n)) out.push({ set: null, name: n, stage: null });
  return out;
}

export function Lineup({ lang }: { lang: Lang }) {
  const [stagesOpen, setStagesOpen] = useState(false);
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
      {headSlug ? <CaretRightIcon size={16} className="text-fg-3" aria-hidden="true" /> : null}
    </>
  ) : null;

  return (
    <section id="lineup" aria-labelledby="lineup-h" className="flex scroll-mt-32 flex-col">
      <div className="flex items-baseline justify-between pb-1.5">
        <h2 id="lineup-h" className="kd-d3">{fill(T.lineup, { n: all.length })}</h2>
        {stages > 1 ? <span className="kd-m kd-num">{fill(T.stages, { n: stages })}</span> : null}
      </div>
      {head ? (
        headSlug ? (
          <Link href={'/a/' + headSlug} className={cx('kd-lrow min-h-[68px] border-t border-line-1', g(fam))}>{headBody}</Link>
        ) : (
          <div className={cx('kd-lrow min-h-[68px] border-t border-line-1', g(fam))}>{headBody}</div>
        )
      ) : null}
      <ShowMore
        items={rest}
        n={5}
        more={(n) => fill(C.moreN, { n })}
        less={C.less}
        render={(a) => {
          const slug = slugOf(a.name);
          // The link carries the ellipsis itself, so nothing clips its 44px hit area.
          const name = slug
            ? <Link href={'/a/' + slug} className="kd-hs kd-ell kd-hit min-w-0 flex-1 hover:underline">{a.name}</Link>
            : <span className="kd-hs kd-ell min-w-0 flex-1">{a.name}</span>;
          return (
            <div key={(a.set?.id ?? '') + a.name} className="kd-lrow min-h-13">
              <span className="kd-mb kd-num w-13">{a.set ? hhmm(a.set.startMin) : ''}</span>
              {name}
              {a.stage ? <span className="kd-s flex items-center gap-1.5"><Marker family={fam} />{a.stage}</span> : null}
            </div>
          );
        }}
      />
      {following.length ? <p className="kd-s pt-3">{fill(T.followingArtists, { n: following.length })}</p> : null}
      {ev.timetable ? (
        <Accordion small summary={T.byStage} className="mt-1" onToggle={setStagesOpen}>
          {stagesOpen ? <Timetable lang={lang} plan={personal?.me?.plan ?? null} onChanged={reload} signedIn={!!kd.user} /> : null}
        </Accordion>
      ) : null}
    </section>
  );
}
