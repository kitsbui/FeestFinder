'use client';
/**
 * /console/audit: every decision, as it happened, newest first: who (admin, organiser or the
 * system), what, on what, and what changed, with the entry's #seq and hash. The chain check
 * sits above the title. Filtered by who and by area, searched by who or what (all three in the
 * address), more on demand by cursor, the last 90 days as CSV. Nothing here can be changed.
 */
import { useCallback, useEffect, useState } from 'react';
import { ArrowRightIcon, DownloadSimpleIcon, GearIcon, ShieldCheckIcon, ShieldWarningIcon, StorefrontIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { count } from '../format';
import { Button, buttonClass, Chip } from '../ui/actions';
import { Card as Panel, Status } from '../ui/parts';
import { CONSOLE } from './copy';
import { Body, Choice, Empty, ErrorBox, FilterBar, Loading, PageHead, qs, SearchField, stamp, useQuery } from './kit';
import { MOD } from './moderation/copy';
import { useConsole } from './root';

export interface AuditItem {
  seq: number; at: string; action: string; label: Pair; actorType: 'admin' | 'organizer' | 'system' | string; actor: Pair;
  target: { type: string; id: string | null; label: string }; diff: { field: string; before: string; after: string }[]; hash: string;
}
type Who = '' | 'admin' | 'organizer' | 'system';
const PAGE = 40;
const AREAS = ['listing', 'organizer', 'venue', 'shelf', 'report', 'appeal', 'order', 'payout', 'user', 'ads', 'impersonation'] as const;
const AREA_KEY: Record<(typeof AREAS)[number], keyof typeof MOD> = {
  listing: 'arListing', organizer: 'arOrganizer', venue: 'arVenue', shelf: 'arShelf', report: 'arReport', appeal: 'arAppeal',
  order: 'arOrder', payout: 'arPayout', user: 'arUser', ads: 'arAds', impersonation: 'arImpersonation',
};

/** Audit rows: who · what · on what, the changes under it; when, and #seq · hash on the right. */
export function AuditRows({ lang, items }: { lang: Lang; items: AuditItem[] }) {
  const icon = (t: string) => {
    const I = t === 'admin' ? ShieldCheckIcon : t === 'organizer' ? StorefrontIcon : GearIcon;
    return <I size={16} className="mt-0.5 text-fg-3" aria-hidden="true" />;
  };
  return (
    <ul className="flex flex-col">
      {items.map((a) => (
        <li key={a.seq} className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line-1 px-4 py-3 sm:grid-cols-[20px_minmax(0,1fr)_230px]">
          {icon(a.actorType)}
          <span className="flex min-w-0 flex-col gap-1">
            <span className="kd-t"><span className="text-fg-1">{a.actor[lang]}</span> · {a.label[lang]} · <span className="text-fg-1">{a.target.label}</span></span>
            {a.diff.map((d, i) => (
              <span key={i} className="kd-s kd-num flex flex-wrap items-center gap-1.5">
                <code className="kd-m">{d.field}</code><span>{d.before}</span><ArrowRightIcon size={12} aria-hidden="true" /><span className="text-fg-1">{d.after}</span>
              </span>
            ))}
          </span>
          <span className="kd-m kd-num col-start-2 flex flex-col sm:col-start-auto sm:text-right">
            <span>{stamp(a.at, lang)}</span>
            <code>#{a.seq} · {a.hash}</code>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Audit() {
  const { lang, q: topQ } = useConsole();
  const T = pick(CONSOLE, lang);
  const M = pick(MOD, lang);
  const [params, setParams] = useQuery();
  const who = (['admin', 'organizer', 'system'].includes(params.get('actor') ?? '') ? params.get('actor') : '') as Who;
  const area = (AREAS as readonly string[]).includes(params.get('area') ?? '') ? params.get('area')! : '';
  const search = params.get('q') ?? '';
  // The top bar's search works here too when the page's own field is empty.
  const q = (search || topQ).trim();
  const [data, setData] = useState<{ items: AuditItem[]; nextCursor: string | null } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [more, setMore] = useState(false);
  const [chain, setChain] = useState<{ ok: boolean; entries: number; brokenAt: number | null } | null>(null);
  const base = useCallback((cursor?: string | null) => '/admin/audit' + qs({ actor: who || 'all', area, q, limit: PAGE, cursor }), [who, area, q]);
  const load = useCallback(async () => {
    setError(null);
    try { setData(await FF.get(base())); } catch (e) { setError(e); }
  }, [base]);
  useEffect(() => { const t = setTimeout(() => void load(), q ? 250 : 0); return () => clearTimeout(t); }, [load, q]);
  useEffect(() => { FF.maybe(FF.get('/admin/audit/verify'), null).then(setChain); }, []);
  const loadMore = async () => {
    if (!data?.nextCursor) return;
    setMore(true);
    try {
      const out = await FF.get(base(data.nextCursor));
      setData((d) => ({ items: [...(d?.items ?? []), ...out.items], nextCursor: out.nextCursor }));
    } catch (e) { setError(e); } finally { setMore(false); }
  };
  const whos: { key: Who; label: string }[] = [{ key: '', label: T.aAll }, { key: 'admin', label: T.aAdmin }, { key: 'organizer', label: T.aOrganizer }, { key: 'system', label: T.aSystem }];

  return (
    <>
      <PageHead
        eyebrow={chain ? (
          <Status tone={chain.ok ? 'ok' : 'bad'}>{chain.ok ? fill(M.chainOk, { n: count(chain.entries, lang) }) : fill(M.chainBroken, { n: chain.brokenAt ?? '?' })}</Status>
        ) : null}
        title={M.auditTitle}
        actions={<a className={buttonClass({ size: 'sm' })} href={'/admin/audit.csv' + qs({ actor: who || 'all', days: 90 })} download><DownloadSimpleIcon size={14} aria-hidden="true" />{M.csv}</a>}
      />
      <Body>
        <FilterBar onReset={who || area ? () => setParams({ actor: null, area: null }) : null}>
          <SearchField label={M.search} value={search} onChange={(v) => setParams({ q: v })} />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={M.actor}>
            {whos.map((w) => <Chip key={w.key || 'all'} on={who === w.key} onClick={() => setParams({ actor: w.key })}>{w.label}</Chip>)}
          </div>
          <Choice label={M.area} value={area} onChange={(v) => setParams({ area: v })} options={AREAS.map((a) => ({ value: a, label: M[AREA_KEY[a]] }))} />
        </FilterBar>
        {error && !data ? <ErrorBox error={error} retry={load} /> : null}
        {data === null ? (error ? null : <Loading className="h-60" />) : !data.items.length ? <Empty title={M.nothing} /> : (
          <Panel as="section" aria-label={T.tabAudit}>
            <AuditRows lang={lang} items={data.items} />
            {data.nextCursor ? <div className="border-t border-line-1 px-4 py-3"><Button tone="ghost" size="sm" disabled={more} onClick={loadMore}>{M.more}</Button></div> : null}
          </Panel>
        )}
        {error && data ? <ErrorBox error={error} retry={load} /> : null}
      </Body>
    </>
  );
}
