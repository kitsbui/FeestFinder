'use client';
/**
 * /console/events/new: a listing created by the team for an organiser, as a draft or published
 * straight away. ?org=<id>&orgName=<name> picks the organiser beforehand (from its page).
 */
import { useRouter } from 'next/navigation';
import { CaretLeftIcon } from '@phosphor-icons/react/ssr';
import { pick } from '../../copy';
import { KdLink } from '../../link';
import { Body, PageHead, useQuery } from '../kit';
import { useConsole } from '../root';
import { EVENTS } from './copy';
import { EventForm } from './form';

export function EventCreate() {
  const { lang, refreshCounts } = useConsole();
  const T = pick(EVENTS, lang);
  const router = useRouter();
  const [p] = useQuery();
  const org = p.get('org');
  return (
    <>
      <PageHead
        eyebrow={<KdLink href="/console/events" className="kd-m inline-flex items-center gap-1 hover:text-paper"><CaretLeftIcon size={12} aria-hidden="true" />{T.back}</KdLink>}
        title={T.createTitle}
      />
      <Body>
        <EventForm
          key={org ?? ''}
          draft={null}
          presetOrganizer={org ? { value: org, label: p.get('orgName') || org } : null}
          onSaved={(out, { created }) => { if (created && out?.id) { refreshCounts(); router.replace('/console/events/' + out.id); } }}
        />
      </Body>
    </>
  );
}
