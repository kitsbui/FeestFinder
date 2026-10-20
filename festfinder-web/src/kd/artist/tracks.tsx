'use client';
/**
 * The MP3 playlist on the artist's page (festfinder-backend routes/tracks.ts), under their mixes
 * at /studio/artist/mixes: up to ten https links to MP3 files they host, each measured by the API
 * when added (length and waveform), then ordered, renamed or removed here.
 */
import { useState, type FormEvent } from 'react';
import { ArrowDownIcon, ArrowUpIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { useKd } from '../runtime';
import { Button, IconButton } from '../ui/actions';
import { Input } from '../ui/forms';
import { Row, Table } from '../ui/shell';
import { act, Drawer, Empty, Field, Loaded, useLoad } from '../console/kit';
import { length, type Track } from '../web/artist/track';
import { ARTIST } from './copy';
import { Block } from './parts';

interface Data { items: Track[]; max: number }

const COLS = 'minmax(0,4fr) minmax(0,1fr) auto';

export function ArtistTracksStudio({ lang }: { lang: Lang }) {
  const T = pick(ARTIST, lang);
  const load = useLoad<Data>('/me/artist/tracks');
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<Track | null>(null);
  const full = !!load.data && load.data.items.length >= load.data.max;
  return (
    <Block
      title={T.trTitle}
      aside={(
        <span className="flex items-center gap-3">
          {load.data ? <span className="kd-m kd-num">{fill(T.mixCount, { n: load.data.items.length, m: load.data.max })}</span> : null}
          <Button size="sm" disabled={!load.data || full} onClick={() => setAdding(true)}><PlusIcon size={16} aria-hidden="true" />{T.trAdd}</Button>
        </span>
      )}
    >
      <Loaded load={load}>{(data) => <List lang={lang} data={data} onChange={load.reload} onRename={setRenaming} />}</Loaded>
      {adding ? <AddDrawer lang={lang} onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load.reload(); }} /> : null}
      {renaming ? <RenameDrawer lang={lang} track={renaming} onClose={() => setRenaming(null)} onSaved={() => { setRenaming(null); load.reload(); }} /> : null}
    </Block>
  );
}

function List({ lang, data, onChange, onRename }: { lang: Lang; data: Data; onChange: () => void; onRename: (t: Track) => void }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const [busy, setBusy] = useState(false);
  if (!data.items.length) return <Empty title={T.trEmpty} />;
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); const ok = await act(kd, lang, fn); setBusy(false); if (ok) onChange(); };
  const move = (i: number, by: number) => {
    const ids = data.items.map((t) => t.id);
    [ids[i], ids[i + by]] = [ids[i + by], ids[i]];
    void run(() => FF.put('/me/artist/tracks/order', { ids }));
  };
  return (
    <Table cols={COLS} head={T.trCols.split('|')} label={T.trTitle}>
      {data.items.map((t, i) => (
        <Row key={t.id} cols={COLS}>
          <span className="flex min-w-0 items-center gap-3">
            <span className="kd-num w-6 shrink-0 text-center text-fg-3">{i + 1}</span>
            <a className="kd-hit kd-hs kd-ell hover:underline" href={t.url} target="_blank" rel="noopener">{t.title}</a>
          </span>
          <span className="kd-mb kd-num">{length(t.durationS)}</span>
          <span className="flex items-center justify-end gap-1">
            <IconButton size="sm" label={T.trRename} disabled={busy} onClick={() => onRename(t)}><PencilSimpleIcon size={16} aria-hidden="true" /></IconButton>
            <IconButton size="sm" label={T.mixUp} disabled={busy || i === 0} onClick={() => move(i, -1)}><ArrowUpIcon size={16} aria-hidden="true" /></IconButton>
            <IconButton size="sm" label={T.mixDown} disabled={busy || i === data.items.length - 1} onClick={() => move(i, 1)}><ArrowDownIcon size={16} aria-hidden="true" /></IconButton>
            <IconButton size="sm" label={T.mixRemove} disabled={busy} onClick={() => run(() => FF.del(`/me/artist/tracks/${t.id}`))}><TrashIcon size={16} aria-hidden="true" /></IconButton>
          </span>
        </Row>
      ))}
    </Table>
  );
}

function AddDrawer({ lang, onClose, onAdded }: { lang: Lang; onClose: () => void; onAdded: () => void }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // The API reads the file before it answers (its length and waveform), so this can take a moment.
    const out = await act(kd, lang, () => FF.post('/me/artist/tracks', { url: url.trim(), title: title.trim() }));
    setBusy(false);
    if (out) onAdded();
  };
  return (
    <Drawer onClose={onClose} title={T.trAdd} footer={<Button tone="acc" type="submit" form="track-add" disabled={busy || !url.trim() || !title.trim()}>{T.mixSave}</Button>}>
      <form id="track-add" className="flex flex-col gap-4" onSubmit={save}>
        <Field label={T.trLink} hint={T.trLinkHint} htmlFor="track-url">
          <Input id="track-url" type="url" inputMode="url" placeholder="https://" maxLength={1000} value={url} onChange={(e) => setUrl(e.target.value)} />
        </Field>
        <Field label={T.trName} htmlFor="track-title">
          <Input id="track-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      </form>
    </Drawer>
  );
}

function RenameDrawer({ lang, track, onClose, onSaved }: { lang: Lang; track: Track; onClose: () => void; onSaved: () => void }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const [title, setTitle] = useState(track.title);
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const out = await act(kd, lang, () => FF.patch(`/me/artist/tracks/${track.id}`, { title: title.trim() }));
    setBusy(false);
    if (out) onSaved();
  };
  return (
    <Drawer onClose={onClose} title={T.trRename} footer={<Button tone="acc" type="submit" form="track-name" disabled={busy || !title.trim()}>{T.trSaveName}</Button>}>
      <form id="track-name" className="flex flex-col gap-4" onSubmit={save}>
        <Field label={T.trName} htmlFor="track-rename">
          <Input id="track-rename" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      </form>
    </Drawer>
  );
}
