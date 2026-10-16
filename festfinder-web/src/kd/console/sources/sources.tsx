'use client';
/**
 * /console/sources: the sources FeestFinder reads on a schedule (venue and festival sites with
 * schema.org data, ICS calendars, Ticketmaster), what each run found and the raw records each
 * one sent. Imports never publish: new events wait in the review queue like any submission.
 * Above the table, live events their own source now calls cancelled. A source opens in a drawer
 * (?id=) with its runs, its records and their raw payloads, Reprocess and Run now.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CodeIcon, PencilSimpleIcon, PlusIcon, SparkleIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { count } from '../../format';
import { useKd } from '../../runtime';
import { Button, Chip, IconButton } from '../../ui/actions';
import { Input, Segmented, Select, SwitchRow } from '../../ui/forms';
import { Card as Panel } from '../../ui/parts';
import { Sheet } from '../../ui/sheet';
import { Row, Table, Tabs } from '../../ui/shell';
import { Body, Drawer, Empty, ErrorBox, Field, Loaded, Loading, PageHead, Pill, ago, stamp, useLoad, useOptions, useQuery } from '../kit';
import { useConsole } from '../root';
import { SOURCES } from './copy';

type Adapter = 'website' | 'ics' | 'ticketmaster';
type Authority = 'official' | 'ticketing' | 'listing';
interface RunCounts { fetched: number; created: number; merged: number; rejected: number; failed: number }
interface Source {
  id: string; adapter: Adapter; name: string; url: string | null; city: string | null; cityLabel: Pair | null; authority: Authority;
  config: Record<string, unknown>; intervalMinutes: number; enabled: boolean; nextRunAt: string | null; lastRunAt: string | null;
  lastError: string | null; events: number; lastRun: (RunCounts & { id: string; startedAt: string }) | null;
}
interface Run extends RunCounts { id: string; startedAt: string; trigger: 'manual' | 'schedule' | string; errors: string[] | null }
type RawStatus = 'pending' | 'created' | 'merged' | 'rejected' | 'failed';
interface Raw {
  id: string; externalId: string; url: string | null; status: RawStatus; error: string | null; matchScore: number | null; matchReason: string | null;
  fetchedAt: string; event: { id: string; title: string; slug: string; status: string } | null;
}
interface List { items: Source[]; cancelledBySource: { id: string; slug: string; title: string; startsOn: string; host: string | null }[] }

const ADAPTERS: Adapter[] = ['website', 'ics', 'ticketmaster'];
const AUTHORITIES: Authority[] = ['official', 'ticketing', 'listing'];
const RAW: Record<RawStatus, { tone: 'ok' | 'live' | 'warn' | 'bad' | 'none'; key: 'rawCreated' | 'rawMerged' | 'rawRejected' | 'rawFailed' | 'rawPending' }> = {
  created: { tone: 'ok', key: 'rawCreated' },
  merged: { tone: 'live', key: 'rawMerged' },
  rejected: { tone: 'warn', key: 'rawRejected' },
  failed: { tone: 'bad', key: 'rawFailed' },
  pending: { tone: 'none', key: 'rawPending' },
};
const host = (url: string | null) => (url ? url.replace(/^https?:\/\//, '').slice(0, 60) : null);

/** A run's counts: new and merged, then read and skipped (and failed). */
function RunLine({ r, lang }: { r: RunCounts | null; lang: Lang }) {
  const T = pick(SOURCES, lang);
  if (!r) return <span className="kd-s">{T.notRun}</span>;
  return (
    <span className="flex min-w-0 flex-col">
      <span className="kd-num text-sm text-paper">{fill(T.runTop, { c: count(r.created, lang), m: count(r.merged, lang) })}</span>
      <span className="kd-s kd-num text-xs">
        {fill(T.runSub, { f: count(r.fetched, lang), r: count(r.rejected, lang) })}
        {r.failed ? ' · ' + fill(T.runFailed, { n: count(r.failed, lang) }) : ''}
      </span>
    </span>
  );
}

const COLS = 'minmax(220px,2fr) 120px 120px 70px 200px 130px 44px';

export function Sources() {
  const { lang, refreshCounts } = useConsole();
  const T = pick(SOURCES, lang);
  const kd = useKd();
  const load = useLoad<List>('/admin/sources');
  const [params, setParams] = useQuery();
  const [form, setForm] = useState<{ source?: Source } | null>(null);
  const [adding, setAdding] = useState(false);
  const addStarter = async () => {
    setAdding(true);
    try { const out = await FF.post('/admin/sources/starter'); kd.toast(FF.text(out.message, lang)); load.reload(); } catch (e) { kd.toast(FF.errorText(e, lang)); } finally { setAdding(false); }
  };
  const items = load.data?.items ?? [];
  const openId = params.get('id');
  const open = items.find((s) => s.id === openId) ?? null;
  const authority = (a: string) => (AUTHORITIES.includes(a as Authority) ? T[a as Authority] : a);

  return (
    <>
      <PageHead
        title={T.title}
        actions={<>
          <Button disabled={adding} onClick={addStarter}><SparkleIcon size={16} aria-hidden="true" />{T.addStarter}</Button>
          <Button tone="acc" onClick={() => setForm({})}><PlusIcon size={16} aria-hidden="true" />{T.add}</Button>
        </>}
      />
      <Body>
        <Loaded load={load}>
          {(d) => (
            <>
              {d.cancelledBySource.length ? (
                <Panel as="section" aria-label={T.cancelled} className="flex flex-col gap-2 p-5">
                  <h2 className="kd-h flex items-center gap-2"><WarningIcon size={18} className="text-hot" aria-hidden="true" />{T.cancelled}</h2>
                  <ul className="flex flex-col">
                    {d.cancelledBySource.map((c) => (
                      <li key={c.id} className="flex flex-col gap-0.5 border-t border-line py-2">
                        <Link className="kd-hs hover:underline" href={`/console/events/${c.id}?tab=sources`}>{c.title}</Link>
                        <span className="kd-s kd-num">{[c.startsOn, c.host].filter(Boolean).join(' · ')}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
              {!d.items.length ? (
                <Empty title={T.noSources}>
                  <Button disabled={adding} onClick={addStarter}><SparkleIcon size={16} aria-hidden="true" />{T.addStarter}</Button>
                </Empty>
              ) : (
                <Table label={T.title} cols={COLS} head={[T.colSource, T.colCity, T.colAuthority, <span key="e" className="block text-right">{T.colEvents}</span>, T.colLast, T.colNext, '']}>
                  {d.items.map((s) => (
                    <Row key={s.id} cols={COLS} className="py-2" current={s.id === openId}>
                      <span className="flex min-w-0 flex-col">
                        <span className="flex min-w-0 items-center gap-2">
                          <button type="button" className="kd-hs kd-ell text-left hover:underline" aria-label={fill(T.open, { n: s.name })} onClick={() => setParams({ id: s.id })}>{s.name}</button>
                          {s.enabled ? null : <Pill>{T.off}</Pill>}
                        </span>
                        <span className="kd-s kd-ell text-xs">{[T[s.adapter] ?? s.adapter, host(s.url)].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className="kd-s kd-ell">{s.cityLabel ? FF.text(s.cityLabel, lang) : '—'}</span>
                      <span className="kd-s kd-ell">{authority(s.authority)}</span>
                      <span className="kd-num text-right text-sm text-paper">{count(s.events, lang)}</span>
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <RunLine r={s.lastRun} lang={lang} />
                        {s.lastError ? <span title={s.lastError}><Pill tone="bad">{T.error}</Pill></span> : null}
                      </span>
                      <span className="kd-s kd-num text-xs">{s.enabled ? stamp(s.nextRunAt, lang) : '—'}</span>
                      <IconButton size="sm" label={fill(T.editOne, { n: s.name })} onClick={() => setForm({ source: s })}><PencilSimpleIcon size={16} aria-hidden="true" /></IconButton>
                    </Row>
                  ))}
                </Table>
              )}
            </>
          )}
        </Loaded>
      </Body>
      {form ? <SourceForm key={form.source?.id ?? 'new'} lang={lang} source={form.source} onClose={() => setForm(null)} onSaved={() => { setForm(null); load.reload(); }} /> : null}
      {open ? (
        <SourceDetail
          key={open.id}
          lang={lang}
          source={open}
          onClose={() => setParams({ id: null })}
          onChanged={() => { load.reload(); refreshCounts(); }}
        />
      ) : null}
    </>
  );
}

// ---- the form -----------------------------------------------------------------------------

/** The config keys this form sets; every other key a source carries (requireStyle, skip, eventType…) is kept as it is. */
const FORM_KEYS = ['follow', 'maxPages', 'countryCode', 'city', 'pages'];

function SourceForm({ lang, source, onClose, onSaved }: { lang: Lang; source?: Source; onClose: () => void; onSaved: (s: Source) => void }) {
  const T = pick(SOURCES, lang);
  const kd = useKd();
  const options = useOptions();
  const editing = !!source;
  const c = source?.config ?? {};
  const [f, setF] = useState(() => ({
    adapter: source?.adapter ?? 'website' as Adapter, name: source?.name ?? '', url: source?.url ?? '', city: source?.city ?? '',
    authority: source?.authority ?? 'official' as Authority, hours: String(Math.round((source?.intervalMinutes ?? 720) / 60)), enabled: source?.enabled ?? true,
    follow: String(c.follow ?? ''), maxPages: String(c.maxPages ?? 20),
    countryCode: String(c.countryCode ?? ''), tmCity: String(c.city ?? ''), pages: String(c.pages ?? 1),
  }));
  const [busy, setBusy] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const needsUrl = f.adapter !== 'ticketmaster';
  const hours = Number(f.hours);
  const ok = f.name.trim().length >= 2 && (!needsUrl || /^https?:\/\/\S+\.\S+/.test(f.url.trim())) && hours >= 1 && hours <= 168;

  const save = async () => {
    setBusy(true);
    setUrlError(null);
    const kept = Object.fromEntries(Object.entries(c).filter(([k]) => !FORM_KEYS.includes(k)));
    const own = f.adapter === 'website' ? (f.follow.trim() ? { follow: f.follow.trim(), maxPages: Number(f.maxPages) || 20 } : {})
      : f.adapter === 'ticketmaster' ? { ...(f.countryCode.trim() ? { countryCode: f.countryCode.trim().toUpperCase() } : {}), ...(f.tmCity.trim() ? { city: f.tmCity.trim() } : {}), pages: Number(f.pages) || 1 }
      : {};
    const body = {
      adapter: f.adapter, name: f.name.trim(), url: needsUrl ? f.url.trim() : null, city: f.city || null, authority: f.authority,
      intervalMinutes: Math.round(hours * 60), enabled: f.enabled, config: { ...kept, ...own },
    };
    try {
      const out: Source = editing ? await FF.patch('/admin/sources/' + source.id, body) : await FF.post('/admin/sources', body);
      kd.toast(editing ? T.savedOne : T.addedOne);
      onSaved(out);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'source_not_allowed' || code === 'url_required') setUrlError(FF.errorText(e, lang));
      kd.toast(FF.errorText(e, lang));
    } finally { setBusy(false); }
  };

  return (
    <Drawer
      title={editing ? source.name : T.addTitle}
      onClose={onClose}
      footer={<>
        <Button onClick={onClose}>{T.cancel}</Button>
        <Button tone="acc" className="ml-auto" disabled={busy || !ok} onClick={save}>{editing ? T.save : T.add}</Button>
      </>}
    >
      {/* The kind is fixed once a source exists: the API does not change it. */}
      <Field label={T.kind}>
        {editing ? <span className="text-sm text-paper">{T[f.adapter]}</span>
          : <Segmented label={T.kind} value={f.adapter} onChange={(v) => { set('adapter')(v); setUrlError(null); }} options={ADAPTERS.map((a) => ({ value: a, label: T[a] }))} />}
      </Field>
      <Field label={T.name} htmlFor="cs-name">
        <Input id="cs-name" value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder={T.namePh} autoFocus={!editing} />
      </Field>
      {needsUrl ? (
        <Field label={f.adapter === 'ics' ? T.icsUrl : T.pageUrl} htmlFor="cs-url" error={urlError}>
          <Input id="cs-url" type="url" value={f.url} invalid={!!urlError} onChange={(e) => { set('url')(e.target.value); setUrlError(null); }} placeholder="https://" />
        </Field>
      ) : null}
      {f.adapter === 'website' ? (
        <>
          <Field label={T.follow} hint={T.followHint} htmlFor="cs-follow">
            <Input id="cs-follow" className="kd-num" value={f.follow} onChange={(e) => set('follow')(e.target.value)} placeholder="/event/" />
          </Field>
          <Field label={T.maxPages} htmlFor="cs-max">
            <Input id="cs-max" inputMode="numeric" value={f.maxPages} onChange={(e) => set('maxPages')(e.target.value)} />
          </Field>
        </>
      ) : null}
      {f.adapter === 'ticketmaster' ? (
        <>
          <Field label={T.country} hint="SG, TH, JP…" htmlFor="cs-cc">
            <Input id="cs-cc" value={f.countryCode} maxLength={2} onChange={(e) => set('countryCode')(e.target.value)} placeholder="SG" />
          </Field>
          <Field label={T.tmCity} hint={T.optional} htmlFor="cs-tmcity">
            <Input id="cs-tmcity" value={f.tmCity} onChange={(e) => set('tmCity')(e.target.value)} />
          </Field>
          <Field label={T.pages} htmlFor="cs-pages">
            <Input id="cs-pages" inputMode="numeric" value={f.pages} onChange={(e) => set('pages')(e.target.value)} />
          </Field>
        </>
      ) : null}
      <Field label={T.city} htmlFor="cs-city">
        <Select id="cs-city" value={f.city} onChange={(e) => set('city')(e.target.value)}>
          <option value="">{T.cityAny}</option>
          {/* A source may name a city that is not listed any more: keep it choosable. */}
          {f.city && options && !options.cities.some((x) => x.value === f.city) ? <option value={f.city}>{source?.cityLabel ? FF.text(source.cityLabel, lang) : f.city}</option> : null}
          {(options?.cities ?? []).map((x) => <option key={x.value} value={x.value}>{FF.text(x.label, lang)}</option>)}
        </Select>
      </Field>
      <Field label={T.authority} htmlFor="cs-auth">
        <Select id="cs-auth" value={f.authority} onChange={(e) => set('authority')(e.target.value as Authority)}>
          {AUTHORITIES.map((a) => <option key={a} value={a}>{T[a]}</option>)}
        </Select>
      </Field>
      <Field label={T.hours} hint={T.hoursHint} htmlFor="cs-hours">
        <Input id="cs-hours" inputMode="numeric" value={f.hours} invalid={!(hours >= 1 && hours <= 168)} onChange={(e) => set('hours')(e.target.value)} />
      </Field>
      <SwitchRow label={T.enabled} checked={f.enabled} onChange={set('enabled')} />
    </Drawer>
  );
}

// ---- the detail ---------------------------------------------------------------------------

const RUN_COLS = '150px minmax(150px,1fr) minmax(160px,1.4fr)';
const RAW_COLS = '110px minmax(220px,1fr) 44px';

function SourceDetail({ lang, source, onClose, onChanged }: { lang: Lang; source: Source; onClose: () => void; onChanged: () => void }) {
  const T = pick(SOURCES, lang);
  const kd = useKd();
  const [tab, setTab] = useState<'runs' | 'raw'>('runs');
  const [status, setStatus] = useState<'' | RawStatus>('');
  const runs = useLoad<{ items: Run[] }>(`/admin/sources/${source.id}/runs`);
  const raw = useLoad<{ items: Raw[] }>(`/admin/sources/${source.id}/raw${status ? '?status=' + status : ''}`);
  const [rawId, setRawId] = useState<string | null>(null);
  const [busy, setBusy] = useState<'' | 'run' | 'reprocess'>('');
  // A new run (here or on schedule) brings new runs and records.
  const { reload: reloadRuns } = runs;
  const { reload: reloadRaw } = raw;
  const seen = useRef(source.lastRunAt);
  useEffect(() => {
    if (seen.current === source.lastRunAt) return;
    seen.current = source.lastRunAt;
    reloadRuns(); reloadRaw();
  }, [source.lastRunAt, reloadRuns, reloadRaw]);

  const act = async (what: 'run' | 'reprocess') => {
    setBusy(what);
    try {
      const out = await FF.post(`/admin/sources/${source.id}/${what}`);
      const s = out.summary as RunCounts;
      kd.toast(fill(T.summary, { c: count(s.created, lang), m: count(s.merged, lang), r: count(s.rejected, lang) }) + (s.failed ? ' · ' + fill(T.runFailed, { n: count(s.failed, lang) }) : ''));
      onChanged();
      reloadRuns(); reloadRaw();
    } catch (e) { kd.toast(FF.errorText(e, lang)); } finally { setBusy(''); }
  };

  const filters: { key: '' | RawStatus; label: string }[] = [{ key: '', label: T.all }, ...(['created', 'merged', 'rejected', 'failed'] as RawStatus[]).map((k) => ({ key: k, label: T[RAW[k].key] }))];
  return (
    <Drawer
      wide
      title={source.name}
      sub={[T[source.adapter] ?? source.adapter, source.cityLabel ? FF.text(source.cityLabel, lang) : null, source.url].filter(Boolean).join(' · ')}
      onClose={onClose}
      footer={<>
        <Button disabled={!!busy} onClick={() => act('reprocess')}>{T.reprocess}</Button>
        <Button tone="acc" className="ml-auto" disabled={!!busy} onClick={() => act('run')}>{busy === 'run' ? T.running : T.runNow}</Button>
      </>}
    >
      {source.lastError ? (
        <div role="alert" className="flex items-start gap-2 rounded-lg p-3 shadow-[inset_0_0_0_1px_var(--color-hot)]">
          <WarningIcon size={18} className="mt-0.5 shrink-0 text-hot" aria-hidden="true" />
          <span className="kd-s min-w-0 break-words text-mist">{source.lastError}</span>
        </div>
      ) : null}
      <Tabs
        label={T.detailTabs}
        current={tab}
        onSelect={(k) => setTab(k as 'runs' | 'raw')}
        items={[{ key: 'runs', label: T.runs, count: runs.data?.items.length ?? null }, { key: 'raw', label: T.records }]}
      />
      {tab === 'runs' ? (
        <Loaded load={runs}>
          {(d) => !d.items.length ? <Empty title={T.noRuns} /> : (
            <Table label={T.runs} cols={RUN_COLS} head={[T.colWhen, T.colResult, T.colErrors]}>
              {d.items.map((r) => (
                <Row key={r.id} cols={RUN_COLS} className="py-2">
                  <span className="flex flex-col">
                    <span className="kd-num text-sm text-paper">{stamp(r.startedAt, lang)}</span>
                    <span className="kd-s text-xs">{r.trigger === 'manual' ? T.manual : T.scheduled}</span>
                  </span>
                  <RunLine r={r} lang={lang} />
                  <span className="kd-s min-w-0 break-words text-xs">{r.errors?.length ? r.errors.slice(0, 2).join(' · ') : '—'}</span>
                </Row>
              ))}
            </Table>
          )}
        </Loaded>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={T.resultFilter}>
            {filters.map((x) => <Chip key={x.key || 'all'} on={status === x.key} onClick={() => setStatus(x.key)}>{x.label}</Chip>)}
          </div>
          {raw.error && !raw.data ? <ErrorBox error={raw.error} retry={raw.reload} /> : !raw.data ? <Loading /> : !raw.data.items.length ? <Empty title={T.noRecords} /> : (
            <Table label={T.records} cols={RAW_COLS} head={[T.colResult, T.colRecord, '']}>
              {raw.data.items.map((r) => {
                const look = RAW[r.status] ?? RAW.pending;
                const name = r.event ? r.event.title : r.externalId.replace(/^https?:\/\//, '').slice(0, 80);
                return (
                  <Row key={r.id} cols={RAW_COLS} className="py-2">
                    <span><Pill tone={look.tone}>{T[look.key]}</Pill></span>
                    <span className="flex min-w-0 flex-col">
                      {r.event ? <Link className="kd-hs kd-ell hover:underline" href={'/console/events/' + r.event.id}>{name}</Link> : <span className="kd-hs kd-ell">{name}</span>}
                      <span className="kd-s kd-ell text-xs">{[r.error, r.matchReason ? `${r.matchScore} · ${r.matchReason}` : null].filter(Boolean).join(' · ') || ago(r.fetchedAt, lang)}</span>
                    </span>
                    <IconButton size="sm" label={fill(T.rawOf, { n: name })} onClick={() => setRawId(r.id)}><CodeIcon size={16} aria-hidden="true" /></IconButton>
                  </Row>
                );
              })}
            </Table>
          )}
        </>
      )}
      {rawId ? <RawSheet key={rawId} lang={lang} id={rawId} onClose={() => setRawId(null)} /> : null}
    </Drawer>
  );
}

/** One raw record as the source sent it, pretty-printed. */
function RawSheet({ lang, id, onClose }: { lang: Lang; id: string; onClose: () => void }) {
  const T = pick(SOURCES, lang);
  const load = useLoad<{ externalId: string; error: string | null; payload: unknown }>('/admin/raw/' + id);
  return (
    <Sheet wide title={T.raw} closeLabel={T.close} onClose={onClose}>
      <Loaded load={load}>
        {(d) => (
          <div className="flex flex-col gap-2">
            <p className="kd-s break-all">{[d.externalId, d.error].filter(Boolean).join(' · ')}</p>
            <pre className="kd-num max-h-[60dvh] overflow-auto rounded-lg bg-black/30 p-3 text-xs leading-relaxed text-mist" aria-label={T.raw} tabIndex={0}>{JSON.stringify(d.payload, null, 2)}</pre>
          </div>
        )}
      </Loaded>
    </Sheet>
  );
}
