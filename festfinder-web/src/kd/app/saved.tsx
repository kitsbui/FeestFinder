'use client';
/**
 * /app/saved in Kính đêm: the events this person saved (upcoming first, the ones that have
 * passed folded away) and their collections, each with its public link switch.
 */
import { useCallback, useEffect, useState } from 'react';
import { LinkIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../copy';
import { useKd } from '../runtime';
import { Button, Chip, IconButton } from '../ui/actions';
import { Switch } from '../ui/forms';
import { Accordion, Card as Panel } from '../ui/parts';
import { AppBar } from '../ui/shell';
import type { Card } from '../types';
import { APP } from './copy';
import { EventRow, SignInCard } from './row';

interface Collection { id: string; name: string; isPublic: boolean; url: string | null; count: number }

export function Saved({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const kd = useKd();
  return (
    <>
      <AppBar><h1 className="kd-d3">{T.savedTitle}</h1></AppBar>
      {kd.session === undefined ? <div className="kd-skel mx-4 mt-4 h-40" aria-hidden="true" /> : kd.user ? <SavedList lang={lang} /> : <SignInCard lang={lang} note={T.gateSaved} />}
    </>
  );
}

function SavedList({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [saves, setSaves] = useState<Card[] | null>(null);
  const [cols, setCols] = useState<Collection[]>([]);
  const [cur, setCur] = useState<string | null>(null);
  const [items, setItems] = useState<Card[] | null>(null);

  const loadCols = useCallback(async () => {
    const out = await FF.maybe(FF.get('/me/collections'), { items: [] });
    setCols(out.items);
  }, []);
  useEffect(() => {
    FF.maybe(FF.get('/me/saves?limit=100'), { items: [] }).then((out: { items: Card[] }) => setSaves(out.items));
    loadCols();
  }, [loadCols]);
  // A heart taken off elsewhere on the page leaves the list too.
  const shown = (saves ?? []).filter((e) => kd.saved.has(e.id) || !kd.saved.size);

  useEffect(() => {
    if (!cur) { setItems(null); return; }
    setItems(null);
    FF.maybe(FF.get('/me/collections/' + cur), null).then((out: { items: Card[] } | null) => setItems(out?.items ?? []));
  }, [cur]);

  const col = cols.find((c) => c.id === cur) ?? null;
  const setPublic = async (on: boolean) => {
    if (!col) return;
    try {
      const out: Collection = await FF.patch('/me/collections/' + col.id, { isPublic: on });
      setCols((xs) => xs.map((x) => (x.id === out.id ? out : x)));
      kd.toast(on ? T.colPublicOn : T.colPublicOff);
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const copy = async () => {
    if (!col?.url) return;
    try { await navigator.clipboard.writeText(col.url); kd.toast(T.linkCopied); } catch { kd.toast(col.url); }
  };
  const remove = async () => {
    if (!col || !confirm(T.colDelete + '?')) return;
    try {
      await FF.del('/me/collections/' + col.id);
      setCur(null);
      setCols((xs) => xs.filter((x) => x.id !== col.id));
      kd.toast(T.colDeleted);
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };

  const list = cur ? items : shown;
  const upcoming = (list ?? []).filter((e) => !e.past);
  const past = (list ?? []).filter((e) => e.past);

  return (
    <div className="flex flex-col">
      {cols.length ? (
        <div className="kd-hscroll px-4 pt-1" role="group" aria-label={T.collections}>
          <Chip on={!cur} count={saves?.length ?? null} onClick={() => setCur(null)}>{T.savedAll}</Chip>
          {cols.map((c) => <Chip key={c.id} on={cur === c.id} count={c.count} onClick={() => setCur(c.id)}>{c.name}</Chip>)}
        </div>
      ) : null}

      {col ? (
        <div className="mx-4 mt-3 flex items-center gap-3 border-b border-line pb-3">
          <span className="kd-s flex-1">{T.colPublic}</span>
          {col.url ? <IconButton size="sm" label={T.copyLink} onClick={copy}><LinkIcon size={18} aria-hidden="true" /></IconButton> : null}
          <Switch checked={col.isPublic} onChange={setPublic} label={T.colPublic} />
          <IconButton size="sm" label={T.colDelete} onClick={remove}><TrashIcon size={18} aria-hidden="true" /></IconButton>
        </div>
      ) : null}

      {list === null ? (
        <div className="kd-skel mx-4 mt-4 h-40" aria-hidden="true" />
      ) : list.length ? (
        <>
          <ul className="flex flex-col px-4 pt-2">
            {upcoming.map((e) => <li key={e.id}><EventRow e={e} lang={lang} /></li>)}
          </ul>
          {past.length ? (
            <div className="px-4 pt-2">
              <Accordion small summary={T.past} aside={past.length}>
                <ul className="flex flex-col">{past.map((e) => <li key={e.id}><EventRow e={e} lang={lang} dim /></li>)}</ul>
              </Accordion>
            </div>
          ) : null}
        </>
      ) : (
        <Panel role="status" className="m-4 flex flex-col items-start gap-2 px-5 py-7">
          <span className="kd-h">{cur ? T.colEmpty : T.savedEmpty}</span>
          {!cur ? <span className="kd-s">{T.savedEmptyBody}</span> : null}
          {!cur ? <a className="kd-btn kd-btn-sm mt-1" href="/app">{T.tabExplore}</a> : <Button size="sm" onClick={() => setCur(null)}>{T.savedAll}</Button>}
        </Panel>
      )}
    </div>
  );
}
