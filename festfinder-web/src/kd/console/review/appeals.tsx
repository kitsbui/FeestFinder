'use client';
/**
 * Appeals, the queue's last filter: organisers answering a send-back, the ones who replied first.
 * Each shows what FeestFinder wrote beside the organiser's reply, the reason, the days left, and
 * uphold (the send-back stands) or overturn (the listing goes live now), each confirmed.
 */
import { fill, pick, type Lang } from '../../copy';
import { familyOf } from '../../genre';
import { useKd } from '../../runtime';
import { Button, LinkButton } from '../../ui/actions';
import { Art, Card as Panel, Status } from '../../ui/parts';
import { FF } from '@/runtime/ff';
import { CONSOLE } from '../copy';
import { act, stamp, useAsk } from '../kit';
import { REVIEW } from './copy';
import type { Appeal } from './types';

export function Appeals({ lang, appeals, onDone }: { lang: Lang; appeals: Appeal[] | null; onDone: () => void }) {
  const T = pick(CONSOLE, lang);
  const R = pick(REVIEW, lang);
  const kd = useKd();
  const ask = useAsk();
  const decide = async (a: Appeal, kind: 'overturn' | 'uphold') => {
    const ok = await ask(kind === 'overturn'
      ? { title: R.overturnAsk, body: fill(R.overturnBody, { t: a.title }), confirm: T.overturn }
      : { title: R.upholdAsk, body: a.title, confirm: T.uphold, danger: true });
    if (!ok) return;
    if (await act(kd, lang, () => FF.post(`/admin/appeals/${a.id}/${kind}`))) onDone();
  };
  if (appeals === null) return <div className="kd-skel h-60" aria-hidden="true" />;
  if (!appeals.length) return <Panel className="p-5"><span className="kd-s">{T.noAppeals}</span></Panel>;
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(460px,100%),1fr))] items-start gap-3">
      {appeals.map((a) => (
        <li key={a.id}>
          <Panel as="article" className="flex flex-col gap-4 p-5" aria-label={a.title}>
            <div className="flex items-start gap-3">
              <Art title={a.title} family={familyOf('EDM')} cover={a.coverUrl} className="size-16 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h2 className="kd-h kd-ell">{a.title}</h2>
                <span className="kd-s">{a.organizer} · {fill(R.sentBackOn, { d: stamp(a.rejectedAt, lang, false) })}</span>
                <span className="flex flex-wrap gap-2">
                  {a.reason ? <Status tone="bad">{a.reason[lang]}</Status> : null}
                  <Status tone={a.state === 'replied' ? 'warn' : 'none'}>{a.stateLabel[lang]}</Status>
                  <Status>{fill(R.daysLeft, { n: a.closesInDays })}</Status>
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
              <div className="flex flex-col gap-1"><span className="kd-m">{R.ffWrote}</span><p className="kd-s whitespace-pre-line border-l-2 border-line-2 pl-3 text-fg-2">{a.message}</p></div>
              <div className="flex flex-col gap-1">
                <span className="kd-m">{R.orgReplied}</span>
                {a.reply ? <p className="kd-s whitespace-pre-line border-l-2 border-info pl-3 text-fg-1">{a.reply}</p> : <p className="kd-s">{R.noReply}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton size="sm" tone="ghost" href={`/console/events/${a.eventId}`}>{R.openListing}</LinkButton>
              <Button size="sm" className="ml-auto" onClick={() => decide(a, 'uphold')}>{T.uphold}</Button>
              <Button size="sm" tone="acc" onClick={() => decide(a, 'overturn')}>{T.overturn}</Button>
            </div>
          </Panel>
        </li>
      ))}
    </ul>
  );
}
