'use client';
/**
 * /studio/artist/mixes: the sets and tracks on the artist's page (festfinder-backend
 * routes/mixes.ts). A pasted SoundCloud, Mixcloud or Spotify link is previewed from the service
 * before it is added; the artist orders them, pins one first, says which night one was recorded
 * at, and removes them. Up to twelve.
 */
import { useState, type FormEvent } from 'react';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, PushPinIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { count } from '../format';
import { useKd } from '../runtime';
import { Button, IconButton } from '../ui/actions';
import { Input, Select } from '../ui/forms';
import { Art, Status } from '../ui/parts';
import { Row, Table } from '../ui/shell';
import { act, Body, Drawer, Empty, Field, Loaded, PageHead, useLoad } from '../console/kit';
import type { Mix } from '../web/artist/mixes';
import { ARTIST } from './copy';
import { useArtist } from './root';

interface Night { id: string; slug: string; title: string; startsOn: string }
interface Data { items: Mix[]; max: number; nights: Night[] }

const COLS = 'minmax(240px,3fr) minmax(110px,1fr) 70px 90px minmax(150px,auto)';

export function ArtistMixesStudio() {
  const { lang } = useArtist();
  const T = pick(ARTIST, lang);
  const load = useLoad<Data>('/me/artist/mixes');
  const [adding, setAdding] = useState(false);
  const full = !!load.data && load.data.items.length >= load.data.max;
  return (
    <>
      <PageHead
        title={T.mixesTitle}
        sub={load.data ? fill(T.mixCount, { n: load.data.items.length, m: load.data.max }) : undefined}
        actions={<Button tone="acc" disabled={!load.data || full} onClick={() => setAdding(true)}><PlusIcon size={16} aria-hidden="true" />{T.mixAdd}</Button>}
      />
      <Body>
        <Loaded load={load}>{(data) => <List lang={lang} data={data} onChange={load.reload} />}</Loaded>
      </Body>
      {adding && load.data ? <AddDrawer lang={lang} nights={load.data.nights} onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load.reload(); }} /> : null}
    </>
  );
}

function List({ lang, data, onChange }: { lang: Lang; data: Data; onChange: () => void }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const [busy, setBusy] = useState(false);
  if (!data.items.length) return <Empty title={T.mixEmpty} />;
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); const ok = await act(kd, lang, fn); setBusy(false); if (ok) onChange(); };
  const move = (i: number, by: number) => {
    const ids = data.items.map((m) => m.id);
    [ids[i], ids[i + by]] = [ids[i + by], ids[i]];
    void run(() => FF.put('/me/artist/mixes/order', { ids }));
  };
  const head = T.mixCols.split('|');
  return (
    <Table cols={COLS} head={head} label={T.mixesTitle}>
      {data.items.map((m, i) => (
        <Row key={m.id} cols={COLS}>
          <span className="flex min-w-0 items-center gap-3">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-tag"><Art family="edm" cover={m.thumbnailUrl} className="absolute inset-0 rounded-none" /></span>
            <span className="flex min-w-0 flex-col">
              <a className="kd-hs kd-ell hover:underline" href={m.url} target="_blank" rel="noopener">{m.title}</a>
              <span className="kd-s kd-ell">{m.event ? `${T.mixRecordedAt} ${m.event.title}` : m.authorName ?? ''}</span>
            </span>
            {m.pinned ? <Status tone="ok">{T.mixPinned}</Status> : null}
          </span>
          <span className="kd-s">{m.providerLabel}</span>
          <span className="kd-mb kd-num">{count(m.likeCount, lang)}</span>
          <span className="kd-mb kd-num">{count(m.commentCount, lang)}</span>
          <span className="flex items-center justify-end gap-1">
            {!m.pinned ? <IconButton size="sm" label={T.mixPin} disabled={busy} onClick={() => run(() => FF.patch(`/me/artist/mixes/${m.id}`, { pinned: true }))}><PushPinIcon size={16} aria-hidden="true" /></IconButton> : null}
            <IconButton size="sm" label={T.mixUp} disabled={busy || i === 0} onClick={() => move(i, -1)}><ArrowUpIcon size={16} aria-hidden="true" /></IconButton>
            <IconButton size="sm" label={T.mixDown} disabled={busy || i === data.items.length - 1} onClick={() => move(i, 1)}><ArrowDownIcon size={16} aria-hidden="true" /></IconButton>
            <IconButton size="sm" label={T.mixRemove} disabled={busy} onClick={() => run(() => FF.del(`/me/artist/mixes/${m.id}`))}><TrashIcon size={16} aria-hidden="true" /></IconButton>
          </span>
        </Row>
      ))}
    </Table>
  );
}

function AddDrawer({ lang, nights, onClose, onAdded }: { lang: Lang; nights: Night[]; onClose: () => void; onAdded: () => void }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const [url, setUrl] = useState('');
  const [eventId, setEventId] = useState('');
  const [preview, setPreview] = useState<Mix | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const look = async () => {
    if (!url.trim()) return;
    setBusy(true); setErr('');
    try { setPreview(await FF.post('/me/artist/mixes/preview', { url: url.trim() })); } catch (e) { setPreview(null); setErr(FF.errorText(e, lang)); }
    setBusy(false);
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!preview) { void look(); return; }
    setBusy(true);
    const out = await act(kd, lang, () => FF.post('/me/artist/mixes', { url: url.trim(), eventId: eventId || null }));
    setBusy(false);
    if (out) onAdded();
  };
  return (
    <Drawer onClose={onClose} title={T.mixAdd} footer={<Button tone="acc" type="submit" form="mix-add" disabled={busy || !url.trim()}>{preview ? T.mixSave : T.mixPreview}</Button>}>
      <form id="mix-add" className="flex flex-col gap-4" onSubmit={save}>
        <Field label={T.mixLink} htmlFor="mix-url" error={err}>
          <Input id="mix-url" type="url" inputMode="url" placeholder="https://" maxLength={2048} value={url} invalid={!!err}
            onChange={(e) => { setUrl(e.target.value); setPreview(null); }} onBlur={() => { if (url.trim() && !preview) void look(); }} />
        </Field>
        {preview ? (
          <div className="flex flex-col gap-2">
            <span className="kd-hs">{preview.title}</span>
            <iframe title={`${preview.providerLabel}: ${preview.title}`} src={preview.embedSrc} height={preview.height} loading="lazy"
              allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture" className="w-full rounded-card border-0 bg-carbon" />
          </div>
        ) : null}
        {nights.length ? (
          <Field label={T.mixRecordedAt} htmlFor="mix-night">
            <Select id="mix-night" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">{T.mixNoEvent}</option>
              {nights.map((n) => <option key={n.id} value={n.id}>{`${n.title} · ${n.startsOn}`}</option>)}
            </Select>
          </Field>
        ) : null}
      </form>
    </Drawer>
  );
}
