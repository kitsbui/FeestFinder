'use client';
/**
 * /console/claims: organisers asking to take over an event the community sent in (approving
 * moves the event to their account and turns down any other request for it), and people asking
 * to manage an artist or organiser profile that is already listed. Pending, approved or
 * declined; approve and decline are confirmed, a decline can carry a note to the person.
 */
import type { ReactNode } from 'react';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { dayMonth } from '../../format';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Status } from '../../ui/parts';
import { Row, Table, Tabs } from '../../ui/shell';
import { Body, Empty, Loaded, PageHead, act, stamp, useAsk, useLoad, useQuery } from '../kit';
import { useConsole } from '../root';
import { CLAIMS } from './copy';

type What = 'events' | 'profiles';
type State = 'pending' | 'approved' | 'rejected';

interface EventClaim {
  id: string; status: State; note: string; proofUrl: string | null; createdAt: string; decisionNote: string | null;
  event: { id: string; title: string; slug: string; startsOn: string | null; submittedBy: string | null };
  organizer: { id: string; name: string; slug: string; verified: boolean; website: string | null };
  requestedBy: { name: string; email: string | null };
}
interface ProfileClaim {
  id: string; kind: 'artist' | 'organizer'; status: State; note: string; proofUrl: string | null; createdAt: string; decisionNote: string | null;
  user: { id: string; name: string | null; email: string | null };
  target: { id: string; slug: string; name: string; events?: number; owned?: boolean; members?: number };
}

const EVENT_COLS = 'minmax(200px,1.3fr) minmax(190px,1fr) minmax(240px,1.6fr) 130px minmax(190px,auto)';
const PROFILE_COLS = 'minmax(220px,1.2fr) minmax(190px,1fr) minmax(240px,1.6fr) 130px minmax(190px,auto)';

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">{children}<ArrowSquareOutIcon size={12} aria-hidden="true" /></a>;
}

function Note({ note, proofUrl, extra }: { note: string; proofUrl: string | null; extra?: ReactNode }) {
  return (
    <span role="cell" className="flex min-w-0 flex-col gap-1">
      <span className="kd-s whitespace-pre-wrap text-fg-2">{note || '—'}</span>
      {proofUrl ? <span className="kd-s kd-ell"><Ext href={proofUrl}>{proofUrl.replace(/^https?:\/\//, '').slice(0, 48)}</Ext></span> : null}
      {extra}
    </span>
  );
}

function Outcome({ lang, status, note, approvedLabel }: { lang: Lang; status: State; note: string | null; approvedLabel: string }) {
  const C = pick(CLAIMS, lang);
  return (
    <span role="cell" className="flex flex-col gap-1">
      <Status tone={status === 'approved' ? 'ok' : 'bad'}>{status === 'approved' ? approvedLabel : C.rejected}</Status>
      {note ? <span className="kd-s">{note}</span> : null}
    </span>
  );
}

export function Claims() {
  const { lang } = useConsole();
  const C = pick(CLAIMS, lang);
  const [params, set] = useQuery();
  const what: What = params.get('what') === 'profiles' ? 'profiles' : 'events';
  const status: State = (['pending', 'approved', 'rejected'] as State[]).find((s) => s === params.get('status')) ?? 'pending';
  return (
    <>
      <PageHead title={C.title} />
      <Body>
        <Tabs label={C.what} current={what} onSelect={(k) => set({ what: k === 'events' ? null : k })} items={[{ key: 'events', label: C.events }, { key: 'profiles', label: C.profiles }]} />
        <Tabs label={C.status} current={status} onSelect={(k) => set({ status: k === 'pending' ? null : k })} items={[{ key: 'pending', label: C.pending }, { key: 'approved', label: C.approved }, { key: 'rejected', label: C.rejected }]} />
        {what === 'profiles' ? <ProfileClaims key={status} lang={lang} status={status} /> : <EventClaims key={status} lang={lang} status={status} />}
      </Body>
    </>
  );
}

function EventClaims({ lang, status }: { lang: Lang; status: State }) {
  const C = pick(CLAIMS, lang);
  const kd = useKd();
  const ask = useAsk();
  const { refreshCounts } = useConsole();
  const load = useLoad<{ items: EventClaim[] }>(`/admin/claims?status=${status}`);
  const decide = async (c: EventClaim, decision: 'approve' | 'reject') => {
    const ok = decision === 'approve'
      ? await ask({ title: fill(C.moveAsk, { o: c.organizer.name }), body: c.event.title, confirm: C.moveGo })
      : await ask({ title: C.declineAsk, body: c.event.title, confirm: C.decline, danger: true, note: 'optional', noteLabel: C.noteOrg });
    if (!ok) return;
    const out = await act(kd, lang, () => FF.post(`/admin/claims/${c.id}/${decision}`, ok.note ? { note: ok.note } : {}));
    if (out) { load.reload(); refreshCounts(); }
  };
  return (
    <Loaded load={load}>
      {(d) => !d.items.length ? <Empty title={C.none} /> : (
        <Table label={C.events} cols={EVENT_COLS} head={[C.cEvent, C.cOrg, C.cNote, C.cSent, status === 'pending' ? '' : C.cOutcome]}>
          {d.items.map((c) => (
            <Row key={c.id} cols={EVENT_COLS}>
              <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                <a href={`/e/${c.event.slug}`} target="_blank" rel="noopener" className="kd-hit kd-hs hover:underline">{c.event.title}</a>
                <span className="kd-s">{[c.event.startsOn ? dayMonth(c.event.startsOn, lang) : null, c.event.submittedBy ? fill(C.sentBy, { n: c.event.submittedBy }) : null].filter(Boolean).join(' · ')}</span>
              </span>
              <span role="cell" className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2"><span className="kd-hs">{c.organizer.name}</span>{c.organizer.verified ? <Status tone="ok">{C.verified}</Status> : null}</span>
                <span className="kd-s kd-ell">{[c.requestedBy.name, c.requestedBy.email].filter(Boolean).join(' · ')}</span>
              </span>
              <Note note={c.note} proofUrl={c.proofUrl} extra={c.organizer.website ? <span className="kd-s"><Ext href={c.organizer.website}>{C.orgSite}</Ext></span> : null} />
              <span role="cell" className="kd-s kd-num">{stamp(c.createdAt, lang)}</span>
              {status === 'pending' ? (
                <span role="cell" className="flex flex-wrap justify-end gap-2">
                  <Button size="sm" tone="ghost" onClick={() => decide(c, 'reject')}>{C.decline}</Button>
                  <Button size="sm" onClick={() => decide(c, 'approve')}>{C.approve}</Button>
                </span>
              ) : <Outcome lang={lang} status={c.status} note={c.decisionNote} approvedLabel={C.moved} />}
            </Row>
          ))}
        </Table>
      )}
    </Loaded>
  );
}

function ProfileClaims({ lang, status }: { lang: Lang; status: State }) {
  const C = pick(CLAIMS, lang);
  const kd = useKd();
  const ask = useAsk();
  const { refreshCounts } = useConsole();
  const load = useLoad<{ items: ProfileClaim[] }>(`/admin/profile-claims?status=${status}`);
  const decide = async (c: ProfileClaim, approve: boolean) => {
    const who = c.user.name || c.user.email || '—';
    const ok = approve
      ? await ask({ title: fill(C.giveAsk, { p: c.target.name, u: who }), body: c.user.email ?? undefined, confirm: C.approve })
      : await ask({ title: C.declineAsk, body: c.target.name, confirm: C.decline, danger: true, note: 'optional', noteLabel: C.note });
    if (!ok) return;
    const out = await act(kd, lang, () => FF.post(`/admin/profile-claims/${c.kind}/${c.id}/decision`, { approve, note: ok.note }));
    if (out) { load.reload(); refreshCounts(); }
  };
  return (
    <Loaded load={load}>
      {(d) => !d.items.length ? <Empty title={C.none} /> : (
        <Table label={C.profiles} cols={PROFILE_COLS} head={[C.cProfile, C.cFrom, C.cNote, C.cSent, status === 'pending' ? '' : C.cOutcome]}>
          {d.items.map((c) => (
            <Row key={c.kind + c.id} cols={PROFILE_COLS}>
              <span role="cell" className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <Status tone={c.kind === 'artist' ? 'live' : 'none'}>{c.kind === 'artist' ? C.artist : C.organiser}</Status>
                  <a href={c.kind === 'artist' ? `/a/${c.target.slug}` : `/o/${c.target.slug}`} target="_blank" rel="noopener" className="kd-hit kd-hs hover:underline">{c.target.name}</a>
                </span>
                <span className="kd-s">
                  {c.kind === 'artist'
                    ? fill(C.nEvents, { n: c.target.events ?? 0 }) + (c.target.owned ? ' · ' + C.managed : '')
                    : fill(C.nMembers, { n: c.target.members ?? 0 })}
                </span>
              </span>
              <span role="cell" className="flex min-w-0 flex-col gap-0.5"><span className="kd-hs">{c.user.name || '—'}</span><span className="kd-s kd-ell">{c.user.email ?? ''}</span></span>
              <Note note={c.note} proofUrl={c.proofUrl} />
              <span role="cell" className="kd-s kd-num">{stamp(c.createdAt, lang)}</span>
              {status === 'pending' ? (
                <span role="cell" className="flex flex-wrap justify-end gap-2">
                  <Button size="sm" tone="ghost" onClick={() => decide(c, false)}>{C.decline}</Button>
                  <Button size="sm" onClick={() => decide(c, true)}>{C.approve}</Button>
                </span>
              ) : <Outcome lang={lang} status={c.status} note={c.decisionNote} approvedLabel={C.approved} />}
            </Row>
          ))}
        </Table>
      )}
    </Loaded>
  );
}
