'use client';
/**
 * /console/events: the whole catalogue. Every filter lives in the address (search, status with
 * its counts, when with a date range, genre, district, organiser, entry, traits), then the sort,
 * the page and the CSV with the same filters. A row's title opens the listing; its menu
 * features it, duplicates it as a draft, changes its status or opens its orders.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowSquareOutIcon, CopyIcon, DotsThreeIcon, DownloadSimpleIcon, PencilSimpleIcon, PlusIcon, ReceiptIcon, SealCheckIcon, StackIcon, StarIcon,
} from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { count, money, todayIn, whenShort } from '../../format';
import { KdLink } from '../../link';
import { useKd } from '../../runtime';
import { buttonClass, LinkButton } from '../../ui/actions';
import { Input } from '../../ui/forms';
import { Menu, MenuItem } from '../../ui/menu';
import { Art } from '../../ui/parts';
import { Row, Table } from '../../ui/shell';
import {
  AsyncPick, Body, Choice, Empty, ErrorBox, FilterBar, Loading, MultiChoice, PageHead, Pager, Pill, qs, SearchField, useLoad, useOptions, useQuery, type PickItem,
} from '../kit';
import { useConsole } from '../root';
import { EVENTS } from './copy';
import { statusTone, usePlaces, type EventRow } from './model';
import { errorLine, statusItems, useStatusActions } from './status';

const COLS = '76px minmax(220px,2.2fr) minmax(140px,1fr) 150px 110px 90px 90px 44px';

/** Organisers for the filter and the form: name, kind of organiser and how many listings. */
export async function loadOrganizers(q: string, lang: Lang): Promise<PickItem[]> {
  const T = pick(EVENTS, lang);
  const out = await FF.get('/admin/organizers' + qs({ q }));
  return (out.items as { id: string; name: string; state: string; suspended: boolean; allEvents: number }[]).slice(0, 40).map((o) => ({
    value: o.id, label: o.name,
    sub: [fill(T.orgSub, { n: o.allEvents }), o.state === 'verified' ? T.verifiedOrg : null, o.suspended ? T.suspended : null].filter(Boolean).join(' · '),
  }));
}

export function EventList() {
  const { lang } = useConsole();
  const T = pick(EVENTS, lang);
  const kd = useKd();
  const router = useRouter();
  const o = useOptions();
  const places = usePlaces();
  const [p, setQuery] = useQuery();
  const get = (k: string, d = '') => p.get(k) ?? d;
  const when = get('when', 'upcoming');
  const traits = get('traits') ? get('traits').split(',') : [];
  const offset = Number(get('offset', '0')) || 0;
  const limit = Number(get('limit', '25')) || 25;
  const filters = {
    q: get('q'), status: get('status'), when, from: when === 'range' ? get('from') : '', to: when === 'range' ? get('to') : '',
    genre: get('genre'), area: get('area'), organizerId: get('org'), entry: get('entry'),
    featured: traits.includes('featured') ? 'true' : '', reported: traits.includes('reported') ? 'true' : '', unresolved: traits.includes('unpinned') ? 'true' : '',
    sort: get('sort', 'date'),
  };
  const path = '/admin/events' + qs({ ...filters, offset, limit });
  const load = useLoad<{ items: EventRow[]; total: number; facets: { status: Record<string, number> } }>(path);
  const reset = (patch: Record<string, string | null>) => setQuery({ ...patch, offset: null });
  const { run, dialog } = useStatusActions(() => load.reload());
  const findOrganizers = useCallback((s: string) => loadOrganizers(s, lang), [lang]);

  // The search waits for a pause in typing before it asks.
  const [text, setText] = useState('');
  useEffect(() => { setText(get('q')); }, [p]); // eslint-disable-line react-hooks/exhaustive-deps -- follow the address
  useEffect(() => {
    if (text === get('q')) return;
    const t = setTimeout(() => reset({ q: text.trim() || null }), 300);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps -- only on typing

  const feature = async (e: EventRow) => {
    try { await FF.patch(`/admin/events/${e.id}`, { featured: !e.featured }); kd.toast(e.featured ? T.didUnfeature : T.didFeature); load.reload(); } catch (err) { kd.toast(FF.errorText(err, lang)); }
  };
  const duplicate = async (e: EventRow) => {
    try { const out = await FF.post(`/admin/events/${e.id}/duplicate`); kd.toast(FF.text(out.message, lang)); router.push('/console/events/' + out.id); } catch (err) { kd.toast(errorLine(err, lang)); }
  };

  const today = () => { const c = places?.cities.find((x) => x.slug === places.defaultCity); return c ? todayIn(c.timezone) : ''; };
  const whenOptions = [
    ['upcoming', T.wUpcoming], ['today', T.wToday], ['weekend', T.wWeekend], ['week', T.wWeek], ['month', T.wMonth], ['past', T.wPast], ['undated', T.wUndated], ['range', T.wRange],
  ].map(([value, label]) => ({ value, label }));
  const sorts = [
    ['date', T.sDate], ['date_desc', T.sDateDesc], ['updated', T.sUpdated], ['hype', T.sHype], ['saves', T.sSaves], ['sold', T.sSold], ['quality', T.sQuality], ['title', T.sTitle],
  ].map(([value, label]) => ({ value, label }));
  const split = (k: string, sep = ',') => (get(k) ? get(k).split(sep) : []);
  const active = [filters.q, filters.status, when !== 'upcoming' ? when : '', filters.genre, filters.area, filters.organizerId, filters.entry, get('traits')].some(Boolean);
  const csv = '/admin/events.csv' + qs({ ...filters });
  const org: PickItem | null = get('org') ? { value: get('org'), label: get('orgName') || get('org') } : null;
  const data = load.data;

  return (
    <>
      <PageHead
        title={T.title}
        actions={<>
          <a className={buttonClass({})} href={csv} download title={T.csvTitle}><DownloadSimpleIcon size={16} aria-hidden="true" />{T.csv}</a>
          <LinkButton tone="acc" href="/console/events/new"><PlusIcon size={16} aria-hidden="true" />{T.newListing}</LinkButton>
        </>}
      />
      <Body>
        <FilterBar onReset={active ? () => reset({ q: null, status: null, when: null, from: null, to: null, genre: null, area: null, org: null, orgName: null, entry: null, traits: null }) : null}>
          <SearchField label={T.searchLabel} placeholder={T.search} value={text} onChange={setText} />
          <MultiChoice label={T.fStatus} values={split('status')} onChange={(v) => reset({ status: v.join(',') })}
            options={(o?.statuses ?? []).map((s: { value: string; label: { vi: string; en: string } }) => ({ value: s.value, label: s.label[lang], aside: data?.facets.status[s.value] ?? undefined }))} />
          <Choice label={T.fWhen} value={when === 'all' ? '' : when} options={whenOptions}
            onChange={(v) => reset({ when: v || 'all', ...(v === 'range' ? { from: get('from') || today(), to: get('to') || today() } : { from: null, to: null }) })} />
          {when === 'range' ? (
            <span className="flex items-center gap-2">
              <Input boxClass="h-10 min-h-0 w-[160px]" type="date" className="kd-num" aria-label={T.fFrom} value={get('from')} onChange={(e) => reset({ from: e.target.value })} />
              <span aria-hidden="true">→</span>
              <Input boxClass="h-10 min-h-0 w-[160px]" type="date" className="kd-num" aria-label={T.fTo} min={get('from') || undefined} value={get('to')} onChange={(e) => reset({ to: e.target.value })} />
            </span>
          ) : null}
          {(o?.genres.length ?? 0) > 1 ? (
            <MultiChoice label={T.fGenre} values={split('genre')} onChange={(v) => reset({ genre: v.join(',') })} options={(o?.genres ?? []).map((g) => ({ value: g.value, label: g.label[lang] }))} />
          ) : null}
          <MultiChoice label={T.fArea} values={split('area', '|')} onChange={(v) => reset({ area: v.join('|') })}
            options={(o?.areaGroups ?? []).flatMap((g) => g.areas.map((a) => ({ value: a, label: a, aside: g.label[lang] })))} />
          <div className="w-[260px] max-w-full">
            <AsyncPick label={T.fOrg} placeholder={T.fOrgPh} value={org} load={findOrganizers} onPick={(i) => reset({ org: i?.value ?? null, orgName: i?.label ?? null })} />
          </div>
          <MultiChoice label={T.fEntry} values={split('entry')} onChange={(v) => reset({ entry: v.join(',') })}
            options={(o?.entryModes ?? []).map((m: { value: string; label: { vi: string; en: string } }) => ({ value: m.value, label: m.label[lang] }))} />
          <MultiChoice label={T.fTraits} values={traits} onChange={(v) => reset({ traits: v.join(',') })}
            options={[{ value: 'featured', label: T.tFeatured }, { value: 'reported', label: T.tReported }, { value: 'unpinned', label: T.tUnpinned }]} />
          <Choice label={T.fSort} any={false} value={filters.sort} options={sorts} onChange={(v) => reset({ sort: v === 'date' ? null : v })} />
        </FilterBar>

        {load.error ? <ErrorBox error={load.error} retry={load.reload} /> : null}
        {!data ? (load.error ? null : <Loading />) : !data.items.length ? <Empty title={T.noEvents} /> : (
          <Table label={T.title} cols={COLS} head={[T.cDate, T.cListing, T.cOrg, T.cStatus, T.cPrice, T.cSold, T.cHype, <span key="a" className="sr-only">{T.cActions}</span>]}>
            {data.items.map((e) => (
              <Row key={e.id} cols={COLS} className={['removed', 'cancelled'].includes(e.status) ? 'opacity-60' : undefined}>
                <span role="cell" className="kd-m kd-num">{e.startsOn ? <>{whenShort(e, lang)}<br />{e.startTime ?? ''}</> : '—'}</span>
                <span role="cell" className="flex min-w-0 items-center gap-3 py-2">
                  <Art family="edm" cover={e.coverUrl} className="h-9 w-16 shrink-0 rounded-md" />
                  <span className="flex min-w-0 flex-col">
                    <KdLink href={'/console/events/' + e.id} className="kd-hs kd-ell hover:underline">
                      {e.featured ? <StarIcon size={14} weight="fill" className="mr-1 inline text-acc" aria-label={T.featured} /> : null}{e.title}
                    </KdLink>
                    <span className="kd-s kd-ell">{[e.genre, e.venueName, e.area].filter(Boolean).join(' · ') || '—'}</span>
                  </span>
                </span>
                <span role="cell" className="kd-s kd-ell flex items-center gap-1">
                  {e.organizer.name}{e.organizer.verified ? <SealCheckIcon size={14} weight="fill" className="shrink-0 text-acc" aria-label={T.verifiedOrg} /> : null}
                </span>
                <span role="cell" className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Pill tone={statusTone(e.status)}>{e.statusLabel[lang]}</Pill>
                  {!e.venueResolved && e.venueName ? <span className="kd-m text-warn" title={T.tUnpinned}>{T.noPin}</span> : null}
                  {e.openReports ? <span className="kd-m text-hot">{fill(T.reportsN, { n: e.openReports })}</span> : null}
                  {e.badge ? <span className="kd-m">{e.badge.replace('_', ' ')}</span> : null}
                </span>
                <span role="cell" className="kd-num text-right text-sm">
                  {e.entryMode === 'free' ? T.free : e.entryMode === 'donation' ? T.donation : e.priceFrom ? (e.currency ? money(e.priceFrom, e.currency, lang) : e.priceFrom.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')) : '—'}
                </span>
                <span role="cell" className={`kd-num text-right text-sm ${e.capacity && e.sold / e.capacity > 0.9 ? 'text-warn' : ''}`}>
                  {e.capacity ? `${count(e.sold, lang)} / ${count(e.capacity, lang)}` : e.sold ? count(e.sold, lang) : '—'}
                </span>
                <span role="cell" className="flex flex-col items-end">
                  <span className="kd-num text-sm">{count(e.hype, lang)}</span>
                  <span className="kd-s kd-num text-xs">{fill(T.savesN, { n: count(e.saves, lang) })}</span>
                </span>
                <span role="cell" className="flex justify-end">
                  <RowMenu e={e} lang={lang} onFeature={feature} onDuplicate={duplicate} run={run} />
                </span>
              </Row>
            ))}
          </Table>
        )}
        {data ? <Pager offset={offset} limit={limit} total={data.total} onChange={(off, lim) => setQuery({ offset: off ? String(off) : null, limit: lim === 25 ? null : String(lim) })} /> : null}
      </Body>
      {dialog}
    </>
  );
}

function RowMenu({ e, lang, onFeature, onDuplicate, run }: {
  e: EventRow; lang: Lang; onFeature: (e: EventRow) => void; onDuplicate: (e: EventRow) => void; run: Parameters<typeof statusItems>[1];
}) {
  const T = pick(EVENTS, lang);
  const i = (Icon: typeof StarIcon) => <Icon size={16} aria-hidden="true" />;
  return (
    <Menu align="end" label={fill(T.rowMenu, { t: e.title })} trigger={(p) => (
      <button type="button" {...p} ref={p.ref} className="kd-ib kd-ib-sm" aria-label={fill(T.rowMenu, { t: e.title })}><DotsThreeIcon size={18} weight="bold" aria-hidden="true" /></button>
    )}>
      <MenuItem icon={i(PencilSimpleIcon)} href={'/console/events/' + e.id}>{T.open}</MenuItem>
      <MenuItem icon={i(ArrowSquareOutIcon)} onSelect={() => window.open('/e/' + e.slug, '_blank', 'noopener')}>{T.publicPage}</MenuItem>
      {e.status === 'in_review' ? <MenuItem icon={i(StackIcon)} href={'/console?id=' + e.id}>{T.openQueue}</MenuItem> : null}
      <MenuItem icon={i(StarIcon)} onSelect={() => onFeature(e)}>{e.featured ? T.unfeature : T.feature}</MenuItem>
      <MenuItem icon={i(CopyIcon)} onSelect={() => onDuplicate(e)}>{T.duplicate}</MenuItem>
      <MenuItem icon={i(ReceiptIcon)} href={'/console/orders' + qs({ event: e.id, eventLabel: e.title })}>{T.orders}</MenuItem>
      {statusItems(e, run, lang)}
    </Menu>
  );
}
