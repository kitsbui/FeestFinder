'use client';
/**
 * /console/venues: the venue registry every event form picks from, and the listings whose venue
 * was typed by hand and has no map pin yet (?tab=unresolved): link a suggested or a saved venue,
 * or create one from the listing. The review queue arrives with
 * ?new=<name>&address=&area=&event=<id>: the drawer opens prefilled and links the event on save.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowSquareOutIcon, LinkIcon, MapPinIcon, PencilSimpleIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { whenShort } from '../../format';
import { useKd } from '../../runtime';
import { Button, IconButton } from '../../ui/actions';
import { Card as Panel } from '../../ui/parts';
import { Row, Table, Tabs } from '../../ui/shell';
import { AsyncPick, Body, Choice, Empty, FilterBar, Loaded, MultiChoice, PageHead, Pill, SearchField, useLoad, useOptions, useQuery, type PickItem } from '../kit';
import { fold } from '../organizers/parts';
import { useConsole } from '../root';
import { VENUES } from './copy';
import { VenueDrawer, type Preset, type Venue } from './drawer';

interface VenueRow extends Venue { events: number; upcoming: number }
interface Unresolved {
  id: string; title: string; status: string; statusLabel: Pair | null; startsOn: string | null; organizer: string;
  venueName: string; address: string | null; area: string | null; suggestions: { id: string; name: string; area: string }[];
}
interface Data { items: VenueRow[]; unresolved: Unresolved[] }
type Flag = 'upcoming' | 'unverified' | 'permit' | 'nopermit';

const COLS = 'minmax(240px,2.2fr) minmax(140px,1fr) 200px 120px 170px 44px';

export function Venues() {
  const { lang, refreshCounts } = useConsole();
  const T = pick(VENUES, lang);
  const kd = useKd();
  const [params, setQuery] = useQuery();
  const load = useLoad<Data>('/admin/venues');
  const [drawer, setDrawer] = useState<{ venue?: VenueRow; preset?: Preset } | null>(null);
  const tab = params.get('tab') === 'unresolved' ? 'unresolved' : 'all';

  // Arriving from the review queue with a hand-typed venue: "Add venue" opens prefilled, once.
  const took = useRef(false);
  useEffect(() => {
    if (took.current || !params.has('new')) return;
    took.current = true;
    const eventId = params.get('event');
    const preset: Preset = { name: params.get('new') ?? '', address: params.get('address') ?? '', area: params.get('area') ?? '', city: params.get('city') ?? undefined, eventId, eventTitle: null };
    setDrawer({ preset });
    setQuery({ new: null, address: null, area: null, event: null, city: null });
    if (eventId) {
      FF.maybe(FF.get('/admin/events/' + encodeURIComponent(eventId)), null).then((ev: { title?: string } | null) => {
        if (ev?.title) setDrawer((d) => (d?.preset?.eventId === eventId ? { preset: { ...d.preset, eventTitle: ev.title } } : d));
      });
    }
  }, [params, setQuery]);

  const link = useCallback(async (ev: { id: string; title: string }, venueId: string, label: string) => {
    try {
      await FF.patch('/admin/events/' + ev.id, { venueId });
      kd.toast(fill(T.linked, { v: label, e: ev.title }));
      refreshCounts();
      load.reload();
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  }, [kd, T.linked, lang, refreshCounts, load]);

  const saved = async (out: Venue) => {
    const p = drawer?.preset;
    setDrawer(null);
    if (p?.eventId && out?.id) await link({ id: p.eventId, title: p.eventTitle || T.theListing }, out.id, out.name);
    else load.reload();
    refreshCounts();
  };

  return (
    <>
      <PageHead title={T.title} actions={<Button tone="acc" onClick={() => setDrawer({})}><PlusIcon size={18} aria-hidden="true" />{T.add}</Button>} />
      <div className="px-[var(--kd-gutter)] pb-4">
        <Tabs
          label={T.tabs}
          current={tab}
          onSelect={(k) => setQuery({ tab: k === 'unresolved' ? 'unresolved' : null })}
          items={[
            { key: 'all', label: T.tabRegistry, count: load.data?.items.length ?? null },
            { key: 'unresolved', label: T.tabUnresolved, count: load.data?.unresolved.length ?? null },
          ]}
        />
      </div>
      <Body>
        <Loaded load={load}>
          {(data) => tab === 'unresolved'
            ? <UnresolvedList lang={lang} items={data.unresolved} onLink={link} onCreate={(e) => setDrawer({ preset: { name: e.venueName, address: e.address ?? '', area: e.area ?? '', eventId: e.id, eventTitle: e.title } })} />
            : <Registry lang={lang} items={data.items} params={params} setQuery={setQuery} onOpen={(v) => setDrawer({ venue: v })} />}
        </Loaded>
      </Body>
      {drawer ? <VenueDrawer key={drawer.venue?.id ?? 'new'} lang={lang} venue={drawer.venue} preset={drawer.preset} onClose={() => setDrawer(null)} onSaved={saved} /> : null}
    </>
  );
}

function Registry({ lang, items, params, setQuery, onOpen }: {
  lang: Lang; items: VenueRow[]; params: URLSearchParams; setQuery: (p: Record<string, string | null>) => void; onOpen: (v: VenueRow) => void;
}) {
  const T = pick(VENUES, lang);
  const opts = useOptions();
  const q = params.get('q') ?? '';
  const area = params.get('area') ?? '';
  const flags = (params.get('flags') ?? '').split(',').filter(Boolean) as Flag[];
  const rows = useMemo(() => {
    const needle = fold(q.trim());
    return items
      .filter((v) => !needle || fold(`${v.name} ${v.address} ${v.area}`).includes(needle))
      .filter((v) => !area || v.area === area)
      .filter((v) => flags.every((k) => (k === 'unverified' ? !v.verified : k === 'nopermit' ? !v.permitOnFile : k === 'permit' ? v.permitOnFile : k === 'upcoming' ? v.upcoming > 0 : true)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, area, params.get('flags')]);
  const inUse = [...new Set(items.map((v) => v.area))].sort((a, b) => a.localeCompare(b, 'vi'));
  const cityName = (slug: string) => opts?.cities.find((c) => c.value === slug)?.label[lang] ?? slug;
  return (
    <>
      <FilterBar onReset={q || area || flags.length ? () => setQuery({ q: null, area: null, flags: null }) : null}>
        <SearchField label={T.searchLabel} placeholder={T.search} value={q} onChange={(v) => setQuery({ q: v })} />
        <Choice label={T.district} value={area} onChange={(v) => setQuery({ area: v })} options={inUse.map((a) => ({ value: a, label: a, aside: String(items.filter((v) => v.area === a).length) }))} />
        <MultiChoice
          label={T.more}
          values={flags}
          onChange={(v) => setQuery({ flags: v.join(',') })}
          options={[{ value: 'upcoming', label: T.fUpcoming }, { value: 'unverified', label: T.fUnverified }, { value: 'permit', label: T.fPermit }, { value: 'nopermit', label: T.fNoPermit }]}
        />
        <span className="kd-m kd-num ml-auto">{fill(T.shown, { n: rows.length, t: items.length })}</span>
      </FilterBar>
      {!rows.length ? <Empty /> : (
        <div>
          <Table label={T.title} cols={COLS} head={[T.colVenue, T.colDistrict, T.colStatus, T.colEvents, T.colPin, '']}>
            {rows.map((v) => (
              // A row holds a link and a button, so it is not itself a button: the name opens the drawer.
              <Row key={v.id} cols={COLS}>
                <span role="cell" className="flex min-w-0 flex-col py-2">
                  <button type="button" className="kd-hs kd-ell text-left hover:underline" onClick={() => onOpen(v)}>{v.name}</button>
                  <span className="kd-s kd-ell">{v.address}</span>
                </span>
                <span role="cell" className="flex min-w-0 flex-col">
                  <span className="kd-ell text-sm text-fg-1">{v.area}</span>
                  <span className="kd-s kd-ell">{cityName(v.city)}</span>
                </span>
                <span role="cell" className="flex flex-wrap gap-1.5">
                  {v.verified ? <Pill tone="ok">{T.verified}</Pill> : <Pill tone="warn">{T.unverified}</Pill>}
                  {v.permitOnFile ? <Pill tone="live">{T.permit}</Pill> : null}
                </span>
                <span role="cell" className="kd-num text-sm"><strong className="text-fg-1">{v.upcoming}</strong> · {v.events}</span>
                <span role="cell">
                  <a className="kd-s inline-flex items-center gap-1 kd-num hover:text-fg-1" href={`https://www.google.com/maps?q=${v.lat},${v.lng}`} target="_blank" rel="noopener noreferrer">
                    {Number(v.lat).toFixed(4)}, {Number(v.lng).toFixed(4)}<span className="sr-only"> · {fill(T.openPinOf, { n: v.name })}</span><ArrowSquareOutIcon size={12} aria-hidden="true" />
                  </a>
                </span>
                <span role="cell" className="flex justify-end">
                  <IconButton size="sm" label={fill(T.edit, { n: v.name })} onClick={() => onOpen(v)}><PencilSimpleIcon size={16} aria-hidden="true" /></IconButton>
                </span>
              </Row>
            ))}
          </Table>
        </div>
      )}
    </>
  );
}

function UnresolvedList({ lang, items, onLink, onCreate }: {
  lang: Lang; items: Unresolved[]; onLink: (e: { id: string; title: string }, venueId: string, label: string) => void; onCreate: (e: Unresolved) => void;
}) {
  const T = pick(VENUES, lang);
  const search = useCallback(async (q: string): Promise<PickItem[]> => {
    const out = await FF.get('/admin/venues' + (q ? '?q=' + encodeURIComponent(q) : ''));
    return (out.items as VenueRow[]).slice(0, 30).map((v) => ({ value: v.id, label: v.name, sub: `${v.address} · ${v.area}` }));
  }, []);
  if (!items.length) return <Empty title={T.allPinned} />;
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(420px,100%),1fr))] items-start gap-3">
      {items.map((e) => (
        <li key={e.id}>
          <Panel as="article" className="flex flex-col gap-4 p-5" aria-label={e.title}>
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <a className="kd-h hover:underline" href={'/console/events/' + e.id}>{e.title}</a>
                <span className="kd-s">{[e.organizer, e.startsOn ? whenShort({ startsOn: e.startsOn }, lang) : null].filter(Boolean).join(' · ')}</span>
              </div>
              <Pill tone={e.status === 'live' ? 'live' : 'warn'}>{FF.text(e.statusLabel, lang) || e.status}</Pill>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPinIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
              <div className="flex min-w-0 flex-col">
                <span className="kd-hs">{e.venueName}</span>
                <span className="kd-s">{[e.address, e.area].filter(Boolean).join(' · ') || T.noAddress}</span>
              </div>
            </div>
            {e.suggestions.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="kd-m">{T.couldBe}</span>
                {e.suggestions.map((s) => (
                  <button key={s.id} type="button" className="kd-chip" aria-label={fill(T.linkTo, { v: s.name })} onClick={() => onLink(e, s.id, s.name)}>
                    <LinkIcon size={14} aria-hidden="true" />{s.name} · {s.area}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-[220px] flex-1">
                <AsyncPick label={T.linkSaved} load={search} onPick={(it) => { if (it) onLink(e, it.value, it.label); }} />
              </div>
              <Button onClick={() => onCreate(e)}><PlusIcon size={16} aria-hidden="true" />{T.createFrom}</Button>
            </div>
          </Panel>
        </li>
      ))}
    </ul>
  );
}
