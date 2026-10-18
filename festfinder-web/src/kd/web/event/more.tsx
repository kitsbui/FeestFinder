'use client';
/**
 * "Thêm" on an event's page (design v2 phase 12, owner 2026-10-18): what helps some people (going
 * with friends, the guide, the calendar, the questions, the hype) folded under one heading after the
 * venue, so the page first says what a newcomer needs to decide and go. A link to the questions
 * (#discussion, from a notification) opens them.
 */
import { useEffect, useState } from 'react';
import { CaretRightIcon, CompassIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../../copy';
import { Accordion } from '../../ui/parts';
import { WEB } from '../copy';
import { CalendarRow } from './calendar';
import { DiscussionSection, Hype } from './community';
import { useEvent } from './context';
import { GoTogetherRow } from './friends';

export function EventMore({ lang }: { lang: Lang }) {
  const { ev } = useEvent();
  const T = pick(WEB, lang);
  const [asked, setAsked] = useState(false);
  useEffect(() => { if (location.hash === '#discussion') setAsked(true); }, []);
  const questions = (ev.discussion?.total ?? 0) + (ev.discussion?.faqCount ?? 0);
  const slug = encodeURIComponent(ev.slug);
  return (
    <section aria-labelledby="more-h" className="flex max-w-read flex-col gap-2">
      <h2 id="more-h" className="kd-d3">{T.extras}</h2>
      <div className="border-t border-line-1">
        {!ev.past ? <GoTogetherRow lang={lang} href={'/app/plan/' + slug} /> : null}
        {/* Only when the guide can answer: a row that opens "đang tạm nghỉ" is a dead end. */}
        {!ev.past && ev.guide ? (
          <a className="kd-lrow min-h-13" href={'/app/guide/' + slug}>
            <CompassIcon size={18} className="text-fg-3" aria-hidden="true" />
            <span className="kd-t flex-1 text-fg-1">{T.guideRow}</span>
            <CaretRightIcon size={16} className="text-fg-3" aria-hidden="true" />
          </a>
        ) : null}
        <CalendarRow lang={lang} />
        <Accordion summary={T.discussion} aside={questions || null} open={asked || undefined}>
          <DiscussionSection lang={lang} bare />
        </Accordion>
        {ev.hype ? (
          <Accordion summary={T.hype} aside={ev.hype.count || null}>
            <Hype lang={lang} bare />
          </Accordion>
        ) : null}
      </div>
    </section>
  );
}
