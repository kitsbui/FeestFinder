'use client';
/**
 * A listing's sources and confidence: where FeestFinder saw the event (organiser, community,
 * team, imports, links the team pasted), each with its match, its conflicts and its raw record;
 * a link can be added as a source (kept, never fetched) and an import detached. Beside them the
 * confidence score and the rules behind it.
 */
import { useState } from 'react';
import {
  ArrowSquareOutIcon, BuildingsIcon, CalendarDotsIcon, CodeIcon, FacebookLogoIcon, GlobeIcon, InstagramLogoIcon, LinkBreakIcon, LinkIcon, PlusIcon, SealCheckIcon,
  TicketIcon, UsersThreeIcon,
} from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Pair } from '../../copy';
import { useKd } from '../../runtime';
import { Button, IconButton } from '../../ui/actions';
import { Input } from '../../ui/forms';
import { Card as Panel } from '../../ui/parts';
import { Sheet } from '../../ui/sheet';
import { ago, ErrorBox, Loaded, Loading, Pill, stamp, useLoad } from '../kit';
import { useConsole } from '../root';
import { EVENTS } from './copy';

interface Source {
  id: string; provider: string; providerLabel: Pair; url: string | null; host: string | null; ingestSource: { id: string; name: string } | null;
  rawEventId: string | null; matchScore: number | null; matchReason: string | null; conflicts: { field: string; source: string; event: string }[];
  cancelled: boolean; firstSeenAt: string; lastSeenAt: string;
}
interface Provenance {
  event: { sourceCount: number; lastVerifiedAt: string | null };
  confidence: { score: number; labelText: Pair; breakdown: { rule: string; label: Pair; points: number }[] } | null;
  sources: Source[];
}

const ICON: Record<string, typeof LinkIcon> = {
  organizer: BuildingsIcon, community: UsersThreeIcon, team: SealCheckIcon, website: GlobeIcon, ics: CalendarDotsIcon, ticketmaster: TicketIcon,
  facebook: FacebookLogoIcon, instagram: InstagramLogoIcon,
};
const isLink = (s: string) => /^https?:\/\/\S+\.\S+/.test(s.trim());

export function ProvenanceTab({ eventId }: { eventId: string }) {
  const { lang } = useConsole();
  const T = pick(EVENTS, lang);
  const kd = useKd();
  const load = useLoad<Provenance>(`/admin/events/${eventId}/provenance`);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [raw, setRaw] = useState<string | null>(null);
  const add = async () => {
    setBusy(true);
    try { await FF.post(`/admin/events/${eventId}/sources`, { url: url.trim() }); setUrl(''); kd.toast(T.pAdded); load.reload(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
    setBusy(false);
  };
  const detach = async (s: Source) => {
    try { await FF.del(`/admin/events/${eventId}/sources/${s.id}`); kd.toast(T.pDetached); load.reload(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  return (
    <Loaded load={load}>
      {(data) => {
        const c = data.confidence;
        return (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Panel as="section" aria-label={T.pSources} className="flex flex-col gap-3 p-5">
              <h2 className="kd-h">{T.pSources}</h2>
              {!data.sources.length ? <p className="kd-s">{T.pNone}</p> : (
                <ul className="flex flex-col">
                  {data.sources.map((s) => {
                    const Icon = ICON[s.provider] ?? LinkIcon;
                    return (
                      <li key={s.id} className="flex items-start gap-3 border-t border-line py-3 first:border-t-0">
                        <span className={`kd-st mt-1 ${s.conflicts.length || s.cancelled ? 'kd-bad' : 'kd-ok'}`} aria-hidden="true" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="flex flex-wrap items-center gap-2 text-sm text-paper">
                            <Icon size={16} aria-hidden="true" />
                            <strong>{s.providerLabel[lang]}</strong>
                            {s.host ? (s.url
                              ? <a className="kd-s inline-flex items-center gap-1 hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.host}<ArrowSquareOutIcon size={12} aria-hidden="true" /></a>
                              : <span className="kd-s">{s.host}</span>) : null}
                            {s.matchReason ? <span className="kd-m" title={T.pMatch}>{s.matchScore} · {s.matchReason}</span> : null}
                            {s.cancelled ? <Pill tone="bad">{T.pCancelled}</Pill> : null}
                          </span>
                          {s.conflicts.map((x, i) => <span key={i} className="kd-s text-hot">{x.field}: {x.source} ≠ {x.event}</span>)}
                          <span className="kd-m">
                            {fill(T.pSeen, { a: stamp(s.firstSeenAt, lang), b: ago(s.lastSeenAt, lang) })}{s.ingestSource ? ` · ${s.ingestSource.name}` : ''}
                          </span>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {s.rawEventId ? <IconButton size="sm" label={T.pRaw} onClick={() => setRaw(s.rawEventId)}><CodeIcon size={16} aria-hidden="true" /></IconButton> : null}
                          {['organizer', 'community', 'team'].includes(s.provider) ? null : (
                            <IconButton size="sm" label={`${T.pDetach} · ${s.host ?? s.providerLabel[lang]}`} onClick={() => detach(s)}><LinkBreakIcon size={16} aria-hidden="true" /></IconButton>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (isLink(url)) void add(); }}>
                <Input boxClass="flex-1" type="url" aria-label={T.pAddLabel} placeholder={T.pAddPh} value={url} icon={<LinkIcon size={16} className="text-fog" aria-hidden="true" />} onChange={(e) => setUrl(e.target.value)} />
                <Button type="submit" disabled={busy || !isLink(url)}><PlusIcon size={16} aria-hidden="true" />{T.pAdd}</Button>
              </form>
            </Panel>
            <Panel as="section" aria-label={T.pConfidence} className="flex flex-col gap-3 p-5">
              <h2 className="kd-h">{T.pConfidence}</h2>
              {c ? (
                <>
                  <div className="flex items-center gap-3">
                    <strong className="kd-d3 kd-num">{c.score}</strong>
                    <Pill tone={c.score >= 70 ? 'ok' : c.score >= 40 ? 'none' : 'warn'}>{c.labelText[lang]}</Pill>
                  </div>
                  <ul className="flex flex-col">
                    {c.breakdown.map((l) => (
                      <li key={l.rule} className={`flex justify-between gap-3 border-t border-line py-2 text-sm ${l.points < 0 ? 'text-hot' : ''}`}>
                        <span>{l.label[lang]}</span><span className="kd-num">{(l.points > 0 ? '+' : '') + l.points}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="kd-m">
                    {[data.event.lastVerifiedAt ? fill(T.pVerified, { a: ago(data.event.lastVerifiedAt, lang) }) : null, fill(T.pIndependent, { n: data.event.sourceCount })].filter(Boolean).join(' · ')}
                  </span>
                </>
              ) : <p className="kd-s">—</p>}
            </Panel>
            {raw ? <RawRecord id={raw} onClose={() => setRaw(null)} /> : null}
          </div>
        );
      }}
    </Loaded>
  );
}

/** The record a source sent, as it came. */
export function RawRecord({ id, onClose }: { id: string; onClose: () => void }) {
  const { lang } = useConsole();
  const T = pick(EVENTS, lang);
  const load = useLoad<{ externalId: string; error: string | null; payload: unknown }>(`/admin/raw/${id}`);
  return (
    <Sheet wide onClose={onClose} title={T.pRaw} closeLabel={T.close}>
      {load.error ? <ErrorBox error={load.error} retry={load.reload} /> : !load.data ? <Loading /> : (
        <div className="flex flex-col gap-2">
          <span className="kd-s break-all">{[load.data.externalId, load.data.error].filter(Boolean).join(' · ')}</span>
          <pre className="kd-num max-h-[60dvh] overflow-auto rounded-lg bg-ink p-3 text-xs text-mist">{JSON.stringify(load.data.payload, null, 2)}</pre>
        </div>
      )}
    </Sheet>
  );
}
