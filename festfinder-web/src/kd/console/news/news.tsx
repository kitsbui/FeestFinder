'use client';
/**
 * /console/news: the news feed (festfinder-backend routes/news.ts): the publications whose feeds
 * FeestFinder reads, each with its last read and a switch, "Đọc ngay" and a form in a drawer; and
 * the headlines read so far, each with "Ẩn" (a hidden headline leaves the blog's news page and
 * can be shown again). "Thêm nguồn gợi ý" lists the suggested publications once.
 */
import { useState } from 'react';
import { ArrowSquareOutIcon, ArrowsClockwiseIcon, PencilSimpleIcon, PlusIcon, SparkleIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { count, dayMonth } from '../../format';
import { useKd } from '../../runtime';
import { Button, IconButton } from '../../ui/actions';
import { Input, Select, Switch, SwitchRow } from '../../ui/forms';
import { Row, Table, Tabs } from '../../ui/shell';
import type { NewsItem } from '../../web/blog/model';
import { act, Body, Drawer, Empty, Field, Loaded, PageHead, Pill, stamp, useLoad, useQuery } from '../kit';
import { useConsole } from '../root';
import { NEWS } from './copy';

type Region = 'global' | 'asia' | 'vietnam';
interface Source {
  id: string; name: string; siteUrl: string; feedUrl: string; lang: string; region: Region; enabled: boolean; intervalMinutes: number;
  nextRunAt: string | null; lastRunAt: string | null; lastError: string | null; lastCount: number | null; items: number; hidden: number;
}
interface Sources { items: Source[]; undigested: number; digests: boolean }
type Item = NewsItem & { hidden: boolean };
interface Items { items: Item[]; total: number; nextOffset: number | null }

const REGIONS: Region[] = ['global', 'asia', 'vietnam'];
const LANGS = ['en', 'vi', 'th', 'ja', 'id'];
const SRC_COLS = 'minmax(220px,2fr) 100px 90px minmax(160px,1fr) 70px 60px 88px';
const ITEM_COLS = 'minmax(260px,3fr) minmax(120px,1fr) 100px 90px 80px';
const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');

export function ConsoleNews() {
  const { lang } = useConsole();
  const T = pick(NEWS, lang);
  const kd = useKd();
  const [params, setParams] = useQuery();
  const tab = params.get('tab') === 'items' ? 'items' : 'sources';
  const sources = useLoad<Sources>('/admin/news');
  const [form, setForm] = useState<{ source?: Source } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const starter = async () => {
    setBusy('starter');
    if (await act(kd, lang, () => FF.post('/admin/news/sources/starter'))) sources.reload();
    setBusy(null);
  };
  const digest = async () => {
    setBusy('digest');
    const out = await act(kd, lang, () => FF.post('/admin/news/digest'));
    if (out) { kd.toast(`${out.written} ✓`); sources.reload(); }
    setBusy(null);
  };
  const run = async (s: Source) => {
    setBusy(s.id);
    const out = await act(kd, lang, () => FF.post(`/admin/news/sources/${s.id}/run`));
    if (out) { kd.toast(out.run.error ?? fill(T.ran, { n: s.name, f: count(out.run.fetched, lang), a: count(out.run.added, lang) })); sources.reload(); }
    setBusy(null);
  };
  const toggle = async (s: Source, on: boolean) => {
    if (await act(kd, lang, () => FF.patch(`/admin/news/sources/${s.id}`, { enabled: on }))) sources.reload();
  };
  const every = (m: number) => (m % 60 === 0 ? fill(T.hours, { n: m / 60 }) : fill(T.minutes, { n: m }));

  return (
    <>
      <PageHead
        title={T.title}
        sub={sources.data ? (sources.data.digests ? (sources.data.undigested ? fill(T.undigested, { n: count(sources.data.undigested, lang) }) : null) : T.digestsOff) : null}
        actions={<>
          {sources.data?.digests && sources.data.undigested ? <Button disabled={busy === 'digest'} onClick={digest}><SparkleIcon size={16} aria-hidden="true" />{T.digestNow}</Button> : null}
          <Button disabled={busy === 'starter'} onClick={starter}>{T.addStarter}</Button>
          <Button tone="acc" onClick={() => setForm({})}><PlusIcon size={16} aria-hidden="true" />{T.add}</Button>
        </>}
      />
      <Body>
        <Tabs label={T.title} current={tab} onSelect={(k) => setParams({ tab: k === 'items' ? 'items' : null })} items={[{ key: 'sources', label: T.sources }, { key: 'items', label: T.items }]} />
        {tab === 'sources' ? (
          <Loaded load={sources}>
            {(d) => !d.items.length ? (
              <Empty title={T.noSources}><Button disabled={busy === 'starter'} onClick={starter}>{T.addStarter}</Button></Empty>
            ) : (
              <Table label={T.sources} cols={SRC_COLS} fold="md" head={[T.colSource, T.colRegion, T.colEvery, T.colLast, <span key="i" className="block text-right">{T.colItems}</span>, T.colOn, '']}>
                {d.items.map((s) => (
                  <Row key={s.id} cols={SRC_COLS} className="py-2">
                    <span role="cell" className="flex min-w-0 flex-col">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="kd-hs kd-ell">{s.name}</span>
                        {s.enabled ? null : <Pill>{T.off}</Pill>}
                      </span>
                      <a href={s.siteUrl} target="_blank" rel="noopener" className="kd-s kd-ell text-xs hover:underline">{host(s.feedUrl)}</a>
                    </span>
                    <span role="cell" className="kd-s kd-ell">{T[s.region]}</span>
                    <span role="cell" className="kd-s kd-num">{every(s.intervalMinutes)}</span>
                    <span role="cell" className="flex min-w-0 flex-wrap items-center gap-2">
                      {s.lastRunAt ? <span className="kd-s kd-num text-xs">{stamp(s.lastRunAt, lang)}{s.lastCount != null ? ' · ' + fill(T.readN, { n: count(s.lastCount, lang) }) : ''}</span> : <span className="kd-s text-xs">{T.notRun}</span>}
                      {s.lastError ? <span title={s.lastError}><Pill tone="bad">{T.error}</Pill></span> : null}
                    </span>
                    <span role="cell" className="kd-num text-right text-sm text-fg-1">{count(s.items, lang)}</span>
                    <span role="cell"><Switch checked={s.enabled} onChange={(v) => void toggle(s, v)} label={fill(T.switchOne, { n: s.name })} /></span>
                    <span role="cell" className="flex gap-1">
                      <IconButton size="sm" label={fill(T.runOne, { n: s.name })} disabled={busy === s.id} onClick={() => void run(s)}><ArrowsClockwiseIcon size={16} aria-hidden="true" /></IconButton>
                      <IconButton size="sm" label={fill(T.editOne, { n: s.name })} onClick={() => setForm({ source: s })}><PencilSimpleIcon size={16} aria-hidden="true" /></IconButton>
                    </span>
                  </Row>
                ))}
              </Table>
            )}
          </Loaded>
        ) : <ItemsTab lang={lang} sources={sources.data?.items ?? []} onChanged={sources.reload} />}
      </Body>
      {form ? <SourceForm key={form.source?.id ?? 'new'} lang={lang} source={form.source} onClose={() => setForm(null)} onSaved={() => { setForm(null); sources.reload(); }} /> : null}
    </>
  );
}

function ItemsTab({ lang, sources, onChanged }: { lang: Lang; sources: Source[]; onChanged: () => void }) {
  const T = pick(NEWS, lang);
  const kd = useKd();
  const [params, setParams] = useQuery();
  const source = params.get('source') ?? '';
  const hidden = params.get('hidden') === '1';
  const q = new URLSearchParams({ limit: '50' });
  if (source) q.set('source', source);
  q.set('hidden', hidden ? '1' : '0');
  const load = useLoad<Items>('/admin/news/items?' + q.toString());
  const flip = async (it: Item) => {
    if (await act(kd, lang, () => FF.post(`/admin/news/items/${it.id}/${it.hidden ? 'show' : 'hide'}`))) { load.reload(); onChanged(); }
  };
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Select aria-label={T.colSource} value={source} onChange={(e) => setParams({ source: e.target.value || null })}>
          <option value="">{T.anySource}</option>
          {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <SwitchRow label={T.showHidden} checked={hidden} onChange={(v) => setParams({ hidden: v ? '1' : null })} />
      </div>
      <Loaded load={load}>
        {(d) => !d.items.length ? <Empty title={T.noItems} /> : (
          <Table label={T.items} cols={ITEM_COLS} fold="md" head={[T.colHeadline, T.colSource, T.colTopic, T.colDate, '']}>
            {d.items.map((it) => (
              <Row key={it.id} cols={ITEM_COLS} className="py-2">
                <span role="cell" className="flex min-w-0 flex-col">
                  <a href={it.url} target="_blank" rel="noopener" className="kd-hit kd-hs kd-ell inline-flex items-center gap-1 hover:underline">{it.title}<ArrowSquareOutIcon size={14} aria-hidden="true" /></a>
                  {it.digest ? <span className="kd-s kd-ell text-xs">{lang === 'vi' ? it.digest.vi : it.digest.en}</span> : it.summary ? <span className="kd-s kd-ell text-xs">{it.summary}</span> : null}
                </span>
                <span role="cell" className="kd-s kd-ell">{it.source.name}</span>
                <span role="cell" className="kd-s kd-ell">{T[it.topic]}</span>
                <span role="cell" className="kd-s kd-num">{dayMonth(it.publishedAt.slice(0, 10), lang)}</span>
                <span role="cell" className="text-right"><Button size="sm" onClick={() => void flip(it)}>{it.hidden ? T.show : T.hide}</Button></span>
              </Row>
            ))}
          </Table>
        )}
      </Loaded>
    </>
  );
}

function SourceForm({ lang, source, onClose, onSaved }: { lang: Lang; source?: Source; onClose: () => void; onSaved: () => void }) {
  const T = pick(NEWS, lang);
  const kd = useKd();
  const editing = !!source;
  const [f, setF] = useState({
    name: source?.name ?? '', siteUrl: source?.siteUrl ?? '', feedUrl: source?.feedUrl ?? '', lang: source?.lang ?? 'en', region: source?.region ?? 'global',
    minutes: String(source?.intervalMinutes ?? 60), enabled: source?.enabled ?? true,
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const minutes = Number(f.minutes);
  const ok = f.name.trim().length >= 2 && /^https?:\/\/\S+\.\S+/.test(f.siteUrl.trim()) && /^https:\/\/\S+\.\S+/.test(f.feedUrl.trim()) && minutes >= 15 && minutes <= 1440;
  const save = async () => {
    setBusy(true);
    const body = { name: f.name.trim(), siteUrl: f.siteUrl.trim(), feedUrl: f.feedUrl.trim(), lang: f.lang, region: f.region, intervalMinutes: Math.round(minutes), enabled: f.enabled };
    const out = await act(kd, lang, () => (editing ? FF.patch(`/admin/news/sources/${source.id}`, body) : FF.post('/admin/news/sources', body)));
    setBusy(false);
    if (out) { kd.toast(editing ? T.savedOne : T.addedOne); onSaved(); }
  };
  return (
    <Drawer
      title={editing ? T.editTitle : T.addTitle}
      onClose={onClose}
      footer={<>
        <Button tone="acc" disabled={!ok || busy} onClick={() => void save()}>{T.save}</Button>
        <Button tone="ghost" onClick={onClose}>{T.cancel}</Button>
      </>}
    >
      <Field label={T.name} htmlFor="news-name"><Input id="news-name" value={f.name} placeholder={T.namePh} onChange={(e) => set('name')(e.target.value)} /></Field>
      <Field label={T.siteUrl} htmlFor="news-site"><Input id="news-site" type="url" value={f.siteUrl} onChange={(e) => set('siteUrl')(e.target.value)} /></Field>
      <Field label={T.feedUrl} htmlFor="news-feed"><Input id="news-feed" type="url" value={f.feedUrl} onChange={(e) => set('feedUrl')(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={T.lang} htmlFor="news-lang">
          <Select id="news-lang" value={f.lang} onChange={(e) => set('lang')(e.target.value)}>{LANGS.map((l) => <option key={l} value={l}>{l}</option>)}</Select>
        </Field>
        <Field label={T.region} htmlFor="news-region">
          <Select id="news-region" value={f.region} onChange={(e) => set('region')(e.target.value as Region)}>{REGIONS.map((r) => <option key={r} value={r}>{T[r]}</option>)}</Select>
        </Field>
      </div>
      <Field label={T.every} hint={T.everyHint} htmlFor="news-every"><Input id="news-every" type="number" min={15} max={1440} value={f.minutes} onChange={(e) => set('minutes')(e.target.value)} /></Field>
      <SwitchRow label={T.enabled} checked={f.enabled} onChange={set('enabled')} />
    </Drawer>
  );
}
