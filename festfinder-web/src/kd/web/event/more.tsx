'use client';
/**
 * "Thêm" on an event's page (design v2 phase 12, owner 2026-10-18): what helps some people (going
 * with friends, the guide, the calendar, the questions, the hype) folded under one heading after the
 * venue, so the page first says what a newcomer needs to decide and go. A link to the questions
 * (#discussion, from a notification) opens them.
 */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { CaretRightIcon, CompassIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../../copy';
import { Accordion } from '../../ui/parts';
import { WEB } from '../copy';
import { CalendarRow } from './calendar';

/**
 * Loaded when their rows open (design v2 phase 14), never with the page. While the code comes, the
 * row holds the height of its first line (an "Đặt câu hỏi" or a hype button), so what follows the
 * section does not jump twice on a slow phone.
 */
const Holding = () => <div className="min-h-11" aria-hidden="true" />;
const DiscussionSection = dynamic(() => import('./community').then((m) => m.DiscussionSection), { ssr: false, loading: Holding });
const Hype = dynamic(() => import('./community').then((m) => m.Hype), { ssr: false, loading: Holding });
import { useEvent } from './context';
import { GoTogetherRow } from './friends';

export function EventMore({ lang }: { lang: Lang }) {
  const { ev } = useEvent();
  const T = pick(WEB, lang);
  const [asked, setAsked] = useState(false);
  const [hype, setHype] = useState(false);
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
        <Accordion summary={T.discussion} aside={questions || null} open={asked || undefined} onToggle={setAsked}>
          {asked ? <DiscussionSection lang={lang} bare /> : ev.faq.length ? (
            // Until it opens, the organiser's answers as the server renders them (they are the page's FAQ for search engines too).
            <div className="flex flex-col" aria-label={T.discussion} role="region">
              <h3 className="kd-hs pb-1.5">{T.orgAnswers}</h3>
              <div className="border-t border-line-1">
                {ev.faq.map((f) => (
                  <Accordion key={f.question} small name="faq" summary={f.question}>
                    <p className="kd-t text-fg-3">{f.answer}</p>
                  </Accordion>
                ))}
              </div>
            </div>
          ) : null}
        </Accordion>
        {ev.hype ? (
          <Accordion summary={T.hype} aside={ev.hype.count || null} onToggle={setHype}>
            {hype ? <Hype lang={lang} bare /> : null}
          </Accordion>
        ) : null}
      </div>
    </section>
  );
}
