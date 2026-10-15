'use client';
/**
 * The open collection, above its events: its name (renamed in place), how many it holds and
 * whether it is public, the "Link công khai" switch, the lime "Chia sẻ" once public, rename,
 * and delete (a second tap confirms).
 */
import { useEffect, useId, useState, type FormEvent } from 'react';
import { GlobeHemisphereWestIcon, LockSimpleIcon, PencilSimpleIcon, ShareNetworkIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Input, Switch } from '../../ui/forms';
import type { Card } from '../../types';
import { SAVED } from './copy';
import type { Collection } from './model';
import { ShareSheet } from './share';

export function CollectionBar({ lang, col, events, onChange, onDeleted }: {
  lang: Lang;
  col: Collection;
  /** What it holds, for the story picture. */
  events: Card[];
  onChange: (c: Collection) => void;
  onDeleted: (id: string) => void;
}) {
  const kd = useKd();
  const T = pick(SAVED, lang);
  const switchId = useId();
  const nameId = useId();
  const [editing, setEditing] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Another collection: nothing half done carries over.
  useEffect(() => { setEditing(null); setArmed(false); setSharing(false); }, [col.id]);
  // The second tap has to come soon.
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  const patch = async (body: { name?: string; isPublic?: boolean }, msg?: string) => {
    if (busy) return null;
    setBusy(true);
    try {
      const out: Collection = await FF.patch('/me/collections/' + col.id, body);
      onChange(out);
      if (msg) kd.toast(msg);
      return out;
    } catch (e) {
      kd.toast(FF.errorText(e, lang));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const rename = async (e: FormEvent) => {
    e.preventDefault();
    const n = editing?.trim();
    if (!n) return;
    if (n === col.name) { setEditing(null); return; }
    if (await patch({ name: n })) setEditing(null);
  };

  const remove = async () => {
    if (!armed) { setArmed(true); setEditing(null); return; }
    setBusy(true);
    try {
      await FF.del('/me/collections/' + col.id);
      kd.toast(T.deleted);
      onDeleted(col.id);
    } catch (e) {
      kd.toast(FF.errorText(e, lang));
      setBusy(false);
      setArmed(false);
    }
  };

  return (
    <section aria-labelledby={nameId} className="flex flex-col gap-4 border-b border-line pb-5">
      {editing !== null ? (
        <form onSubmit={rename} className="flex flex-wrap items-center gap-2">
          <h2 id={nameId} className="sr-only">{col.name}</h2>
          <Input
            boxClass="min-w-0 max-w-[480px] flex-[1_1_240px]"
            autoFocus
            aria-label={T.namePh}
            value={editing}
            maxLength={60}
            onChange={(e) => setEditing(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setEditing(null); } }}
          />
          <Button type="submit" tone="light" disabled={!editing.trim() || busy}>{T.saveName}</Button>
          <Button tone="ghost" onClick={() => setEditing(null)}>{T.cancel}</Button>
        </form>
      ) : (
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 id={nameId} className="kd-d2 [overflow-wrap:anywhere]">{col.name}</h2>
          <span className="kd-m kd-num flex items-center gap-1.5">
            {col.isPublic ? <GlobeHemisphereWestIcon size={14} aria-hidden="true" /> : <LockSimpleIcon size={14} aria-hidden="true" />}
            {fill(T.nEvents, { n: col.count })} · {col.isPublic ? T.isPublic : T.isPrivate}
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        <span className="mr-2 flex items-center gap-3">
          <Switch id={switchId} checked={col.isPublic} label={T.publicLink} disabled={busy} onChange={(on) => patch({ isPublic: on }, on ? T.publicOn : T.publicOff)} />
          <label htmlFor={switchId} className="kd-s cursor-pointer text-mist">{T.publicLink}</label>
        </span>
        {col.isPublic && col.url ? (
          <Button tone="acc" size="sm" onClick={() => setSharing(true)}>
            <ShareNetworkIcon size={16} aria-hidden="true" />{T.share}
          </Button>
        ) : null}
        <Button tone="ghost" size="sm" onClick={() => { setEditing(col.name); setArmed(false); }} disabled={editing !== null}>
          <PencilSimpleIcon size={16} aria-hidden="true" />{T.rename}
        </Button>
        <Button tone="ghost" size="sm" className={cx(armed && 'text-hot hover:text-hot')} onClick={remove} disabled={busy}>
          <TrashIcon size={16} aria-hidden="true" />{armed ? T.delArm : T.del}
        </Button>
      </div>
      {sharing && col.url ? <ShareSheet lang={lang} name={col.name} url={col.url} events={events} onClose={() => setSharing(false)} /> : null}
    </section>
  );
}
