'use client';
/**
 * /console/news?tab=charts: the charts the style hub shows (festfinder-backend routes/styles.ts,
 * services/charts.ts): each a YouTube Music playlist, a Beatport genre's top 100 or a Spotify playlist, for one style, with
 * its last read, a switch, "Đọc ngay" and a form in a drawer. A provider without its keys in the
 * environment reads nothing; the page says which.
 */
import { useState } from 'react';
import { ArrowSquareOutIcon, ArrowsClockwiseIcon, PencilSimpleIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { count } from '../../format';
import { STYLE_LABEL, styleLabel } from '../../genre';
import { useKd } from '../../runtime';
import { Button, IconButton } from '../../ui/actions';
import { Input, Select, Switch, SwitchRow } from '../../ui/forms';
import { Row, Table } from '../../ui/shell';
import { act, Drawer, Empty, Field, Loaded, Pill, stamp, useLoad } from '../kit';
import { NEWS } from './copy';

type Provider = 'beatport' | 'spotify' | 'youtube';
interface Chart {
  id: string; provider: Provider; name: string; style: { key: string }; externalId: string; url: string; enabled: boolean; intervalMinutes: number;
  lastRunAt: string | null; lastError: string | null; lastCount: number | null; entries: number;
}
interface Charts { items: Chart[]; providers: Record<Provider, boolean> }

const PROVIDERS: Provider[] = ['youtube', 'beatport', 'spotify'];
const COLS = 'minmax(220px,2fr) minmax(120px,1fr) 90px minmax(160px,1fr) 70px 60px 88px';
const LABEL: Record<Provider, string> = { beatport: 'Beatport', spotify: 'Spotify', youtube: 'YouTube Music' };

export function ChartsTab({ lang }: { lang: Lang }) {
  const T = pick(NEWS, lang);
  const kd = useKd();
  const load = useLoad<Charts>('/admin/charts');
  const [form, setForm] = useState<{ chart?: Chart } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (c: Chart) => {
    setBusy(c.id);
    const out = await act(kd, lang, () => FF.post(`/admin/charts/sources/${c.id}/run`));
    if (out) { kd.toast(out.run.error ?? fill(T.chartRan, { n: c.name, c: count(out.run.count, lang) })); load.reload(); }
    setBusy(null);
  };
  const toggle = async (c: Chart, on: boolean) => {
    if (await act(kd, lang, () => FF.patch(`/admin/charts/sources/${c.id}`, { enabled: on }))) load.reload();
  };
  const every = (m: number) => (m % 1440 === 0 ? fill(T.days, { n: m / 1440 }) : fill(T.hours, { n: Math.round(m / 60) }));
  return (
    <Loaded load={load}>
      {(d) => (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {PROVIDERS.map((p) => <Pill key={p} tone={d.providers[p] ? 'ok' : 'warn'}>{fill(d.providers[p] ? T.keysOn : T.keysOff, { p: LABEL[p] })}</Pill>)}
            <Button tone="acc" onClick={() => setForm({})}><PlusIcon size={16} aria-hidden="true" />{T.addChart}</Button>
          </div>
          {!d.items.length ? <Empty title={T.noCharts} /> : (
            <Table label={T.charts} cols={COLS} fold="md" head={[T.colChart, T.colStyle, T.colEvery, T.colLast, <span key="n" className="block text-right">{T.colTracks}</span>, T.colOn, '']}>
              {d.items.map((c) => (
                <Row key={c.id} cols={COLS} className="py-2">
                  <span role="cell" className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="kd-hs kd-ell">{c.name}</span>
                      {c.enabled ? null : <Pill>{T.off}</Pill>}
                    </span>
                    <a href={c.url} target="_blank" rel="noopener" className="kd-hit kd-s kd-ell inline-flex items-center gap-1 text-xs hover:underline">{LABEL[c.provider]}<ArrowSquareOutIcon size={12} aria-hidden="true" /></a>
                  </span>
                  <span role="cell" className="kd-s kd-ell">{styleLabel(c.style.key, lang)}</span>
                  <span role="cell" className="kd-s kd-num">{every(c.intervalMinutes)}</span>
                  <span role="cell" className="flex min-w-0 flex-wrap items-center gap-2">
                    {c.lastRunAt ? <span className="kd-s kd-num text-xs">{stamp(c.lastRunAt, lang)}</span> : <span className="kd-s text-xs">{T.notRun}</span>}
                    {c.lastError ? <span title={c.lastError}><Pill tone="bad">{T.error}</Pill></span> : null}
                  </span>
                  <span role="cell" className="kd-num text-right text-sm text-fg-1">{count(c.entries, lang)}</span>
                  <span role="cell"><Switch checked={c.enabled} onChange={(v) => void toggle(c, v)} label={fill(T.switchOne, { n: c.name })} /></span>
                  <span role="cell" className="flex gap-1">
                    <IconButton size="sm" label={fill(T.runOne, { n: c.name })} disabled={busy === c.id} onClick={() => void run(c)}><ArrowsClockwiseIcon size={16} aria-hidden="true" /></IconButton>
                    <IconButton size="sm" label={fill(T.editOne, { n: c.name })} onClick={() => setForm({ chart: c })}><PencilSimpleIcon size={16} aria-hidden="true" /></IconButton>
                  </span>
                </Row>
              ))}
            </Table>
          )}
          {form ? <ChartForm key={form.chart?.id ?? 'new'} lang={lang} chart={form.chart} onClose={() => setForm(null)} onSaved={() => { setForm(null); load.reload(); }} /> : null}
        </>
      )}
    </Loaded>
  );
}

function ChartForm({ lang, chart, onClose, onSaved }: { lang: Lang; chart?: Chart; onClose: () => void; onSaved: () => void }) {
  const T = pick(NEWS, lang);
  const kd = useKd();
  const editing = !!chart;
  const provider: Provider = chart?.provider ?? 'youtube';
  const [f, setF] = useState({
    provider, name: chart?.name ?? '', style: chart?.style.key ?? 'techno', externalId: chart?.externalId ?? '', url: chart?.url ?? '',
    hours: String(Math.round((chart?.intervalMinutes ?? 1440) / 60)), enabled: chart?.enabled ?? true,
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const hours = Number(f.hours);
  const ok = f.name.trim().length >= 2 && f.externalId.trim().length > 0 && /^https:\/\/\S+\.\S+/.test(f.url.trim()) && hours >= 1 && hours <= 168;
  const save = async () => {
    setBusy(true);
    const body = { provider: f.provider, name: f.name.trim(), style: f.style, externalId: f.externalId.trim(), url: f.url.trim(), intervalMinutes: Math.round(hours * 60), enabled: f.enabled };
    const out = await act(kd, lang, () => (editing ? FF.patch(`/admin/charts/sources/${chart.id}`, body) : FF.post('/admin/charts/sources', body)));
    setBusy(false);
    if (out) { kd.toast(editing ? T.savedOne : T.addedOne); onSaved(); }
  };
  const styles = Object.keys(STYLE_LABEL).sort((a, b) => styleLabel(a, lang).localeCompare(styleLabel(b, lang)));
  return (
    <Drawer
      title={editing ? T.editChart : T.addChart}
      onClose={onClose}
      footer={<>
        <Button tone="acc" disabled={!ok || busy} onClick={() => void save()}>{T.save}</Button>
        <Button tone="ghost" onClick={onClose}>{T.cancel}</Button>
      </>}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label={T.provider} htmlFor="chart-provider">
          <Select id="chart-provider" value={f.provider} onChange={(e) => set('provider')(e.target.value as Provider)}>{PROVIDERS.map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}</Select>
        </Field>
        <Field label={T.colStyle} htmlFor="chart-style">
          <Select id="chart-style" value={f.style} onChange={(e) => set('style')(e.target.value)}>{styles.map((k) => <option key={k} value={k}>{styleLabel(k, lang)}</option>)}</Select>
        </Field>
      </div>
      <Field label={T.name} htmlFor="chart-name"><Input id="chart-name" value={f.name} placeholder={T.chartNamePh} onChange={(e) => set('name')(e.target.value)} /></Field>
      <Field label={{ beatport: T.genreId, spotify: T.playlistId, youtube: T.ytPlaylistId }[f.provider]} hint={{ beatport: T.genreIdHint, spotify: T.playlistIdHint, youtube: T.ytPlaylistIdHint }[f.provider]} htmlFor="chart-id"><Input id="chart-id" value={f.externalId} onChange={(e) => set('externalId')(e.target.value)} /></Field>
      <Field label={T.chartUrl} htmlFor="chart-url"><Input id="chart-url" type="url" value={f.url} onChange={(e) => set('url')(e.target.value)} /></Field>
      <Field label={T.everyHours} hint={T.everyHoursHint} htmlFor="chart-every"><Input id="chart-every" type="number" min={1} max={168} value={f.hours} onChange={(e) => set('hours')(e.target.value)} /></Field>
      <SwitchRow label={T.enabled} checked={f.enabled} onChange={set('enabled')} />
    </Drawer>
  );
}
