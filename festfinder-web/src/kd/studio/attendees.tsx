'use client';
/**
 * /studio/attendees: who holds a ticket to the chosen event. The counts (out, in, not in yet,
 * refunded), filter chips with their counts, a search, one row per ticket with resend and (for
 * the account owner) refund, more on demand, and the whole list as CSV.
 */
import { useCallback, useEffect, useState } from 'react';
import { DotsThreeIcon, DownloadSimpleIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Pair } from '../copy';
import { count } from '../format';
import { useKd } from '../runtime';
import { Button, buttonClass, Chip } from '../ui/actions';
import { Input } from '../ui/forms';
import { Menu, MenuItem } from '../ui/menu';
import { BarTrack, Card as Panel, Status } from '../ui/parts';
import { Row, Table } from '../ui/shell';
import { STUDIO } from './copy';
import { StudioHead } from './head';
import { Kpi, Kpis, NeedEvent, Page } from './parts';
import { useStudio } from './root';

type Filter = 'all' | 'in' | 'out' | 'vip' | 'refunded';
interface Attendee { ticketId: string; ticketCode: string; name: string; phone: string | null; orderId: string | null; orderCode: string; bought: Pair; tierName: Pair; state: 'in' | 'out' | 'refunded'; resent: boolean }
interface Out {
  kpis: { sold: number; capacity: number; checkedIn: number; checkedInPct: number; notIn: number; refunded: number; refundedPct: number };
  filters: Record<Filter, number>;
  items: Attendee[];
  nextCursor: string | null;
}

export function Attendees() {
  const { lang, org, event } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [data, setData] = useState<Out | null | undefined>(undefined);
  const [more, setMore] = useState(false);

  const load = useCallback(async (cursor?: string) => {
    if (!event) return;
    const p = new URLSearchParams({ filter, limit: '50' });
    if (q.trim()) p.set('q', q.trim());
    if (cursor) p.set('cursor', cursor);
    const out: Out | null = await FF.maybe(FF.get(`/organizer/events/${event.id}/attendees?${p}`), null);
    setData((d) => (cursor && d && out ? { ...out, items: [...d.items, ...out.items] } : out));
  }, [event, filter, q]);
  useEffect(() => {
    const t = setTimeout(() => load(), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const act = async (run: () => Promise<{ message?: Pair }>) => {
    try { const out = await run(); if (out?.message) kd.toast(FF.text(out.message, lang)); load(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const k = data?.kpis;
  const pct = (n: number) => `${n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}%`;
  const cols = 'minmax(160px,1.6fr) minmax(110px,1fr) minmax(90px,0.8fr) minmax(110px,1fr) 104px 44px';
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: T.fAll }, { key: 'in', label: T.fIn }, { key: 'out', label: T.fOut }, { key: 'vip', label: T.fVip }, { key: 'refunded', label: T.fRefunded },
  ];

  return (
    <Page>
      <StudioHead label={T.attendees} right={event ? <a className={buttonClass({ size: 'sm' })} href={`/organizer/events/${event.id}/attendees.csv`} download><DownloadSimpleIcon size={14} aria-hidden="true" />{T.csv}</a> : null} />
      {!event ? <NeedEvent /> : data === undefined ? <div className="kd-skel h-40" aria-hidden="true" /> : !data ? <NeedEvent /> : (
        <>
          <Kpis>
            <Kpi bone label={T.attSold} value={count(k!.sold, lang)} note={fill(T.attOfCap, { n: count(k!.capacity, lang) })}>
              <BarTrack value={k!.sold} max={Math.max(k!.capacity, 1)} label={T.attSold} />
            </Kpi>
            <Kpi label={T.attIn} value={count(k!.checkedIn, lang)} note={fill(T.attPctSold, { p: pct(k!.checkedInPct) })} />
            <Kpi label={T.attOut} value={count(k!.notIn, lang)} />
            <Kpi label={T.attRefunded} value={count(k!.refunded, lang)} note={pct(k!.refundedPct)} />
          </Kpis>
          <Panel as="section" className="overflow-hidden" aria-label={T.attendees}>
            <div className="flex flex-wrap items-center gap-3 px-4 pb-3 pt-4">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={T.colState}>
                {filters.map((f) => <Chip key={f.key} on={filter === f.key} count={data.filters[f.key]} onClick={() => setFilter(f.key)}>{f.label}</Chip>)}
              </div>
              <Input boxClass="ml-auto w-full max-w-[280px]" icon={<MagnifyingGlassIcon size={16} className="text-fog" aria-hidden="true" />} type="search" value={q} placeholder={T.attSearch} aria-label={T.search} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <Table cols={cols} label={T.attendees} head={[T.colName, T.colPhone, T.colTier, T.colBought, T.colState, '']}>
                  {data.items.map((a) => (
                    <Row key={a.ticketId} cols={cols}>
                      <span role="cell" className="flex min-w-0 flex-col"><span className="kd-hs kd-ell">{a.name}</span><span className="kd-m kd-num">{a.ticketCode}</span></span>
                      <span role="cell" className="kd-s kd-num kd-ell">{a.phone ?? '—'}</span>
                      <span role="cell" className="kd-s kd-ell">{a.tierName[lang]}</span>
                      <span role="cell" className="kd-s kd-num kd-ell">{a.bought[lang]}</span>
                      <span role="cell"><Status tone={a.state === 'in' ? 'ok' : a.state === 'refunded' ? 'bad' : 'none'}>{a.state === 'in' ? T.stIn : a.state === 'refunded' ? T.stRefunded : T.stOut}</Status></span>
                      <span role="cell" className="justify-self-end">
                        {a.state !== 'refunded' ? (
                          <Menu
                            align="end"
                            label={fill(T.actions, { n: a.name })}
                            trigger={(p) => <button type="button" {...p} ref={p.ref} className="kd-ib kd-ib-sm" aria-label={fill(T.actions, { n: a.name })}><DotsThreeIcon size={18} aria-hidden="true" /></button>}
                          >
                            <MenuItem onSelect={() => act(() => FF.post(`/organizer/tickets/${a.ticketId}/resend`))}>{T.resend}</MenuItem>
                            {org.myRole === 'owner' && a.orderId ? (
                              <MenuItem onSelect={() => { if (confirm(fill(T.refundAsk, { c: a.orderCode }))) act(() => FF.post(`/organizer/orders/${a.orderId}/refund`)); }}>{T.refund}</MenuItem>
                            ) : null}
                          </Menu>
                        ) : null}
                      </span>
                    </Row>
                  ))}
                </Table>
              </div>
            </div>
            {!data.items.length ? <p className="kd-s px-4 py-6">{T.noAttendees}</p> : null}
            {data.nextCursor ? (
              <div className="px-4 py-3"><Button tone="ghost" size="sm" disabled={more} onClick={async () => { setMore(true); await load(data.nextCursor!); setMore(false); }}>{T.loadMore}</Button></div>
            ) : null}
          </Panel>
        </>
      )}
    </Page>
  );
}
