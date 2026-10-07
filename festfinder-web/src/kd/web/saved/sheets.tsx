'use client';
/**
 * The two sheets of /saved: a new collection (its name), and one event's collections (which of
 * mine hold it, ticked; a new one made with it in). Collecting an event also saves it (API).
 */
import { useEffect, useState, type FormEvent } from 'react';
import { CheckIcon, GlobeHemisphereWestIcon, LockSimpleIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Input } from '../../ui/forms';
import { Sheet } from '../../ui/sheet';
import type { Card } from '../../types';
import { WEB } from '../copy';
import { SAVED } from './copy';
import type { Collection } from './model';

/** A name, then "Tạo": the new collection opens once made. */
export function NewSheet({ lang, onClose, onCreated }: { lang: Lang; onClose: () => void; onCreated: (c: Collection) => void }) {
  const kd = useKd();
  const T = pick(SAVED, lang);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      const c: Collection = await FF.post('/me/collections', { name: n });
      kd.toast(fill(T.created, { n: c.name }));
      onCreated(c);
    } catch (x) {
      kd.toast(FF.errorText(x, lang));
      setBusy(false);
    }
  };
  return (
    <Sheet title={T.newTitle} closeLabel={pick(WEB, lang).close} onClose={onClose}>
      <form onSubmit={submit} className="flex gap-2 pt-2">
        <Input boxClass="flex-1" autoFocus placeholder={T.namePh} aria-label={T.namePh} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <Button type="submit" tone="acc" disabled={!name.trim() || busy}>{T.create}</Button>
      </form>
    </Sheet>
  );
}

/** One event's collections: tick to add, untick to take it out, or make a new one with it in. */
export function CollectSheet({ lang, event, onClose, onChanged }: {
  lang: Lang; event: Card; onClose: () => void; onChanged: (added: boolean) => void;
}) {
  const kd = useKd();
  const T = pick(SAVED, lang);
  const [items, setItems] = useState<Collection[] | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => FF.maybe(FF.get('/me/collections?event=' + event.id), null).then((r: { items: Collection[] } | null) => setItems(r?.items ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [event.id]);

  const toggle = async (c: Collection) => {
    if (busy) return;
    const on = !c.has;
    setBusy(true);
    setItems((xs) => xs && xs.map((x) => (x.id === c.id ? { ...x, has: on, count: x.count + (on ? 1 : -1) } : x)));
    try {
      await (on ? FF.put : FF.del)('/me/collections/' + c.id + '/events/' + event.id);
      kd.toast(fill(on ? T.added : T.removed, { n: c.name }));
      onChanged(on);
    } catch (e) {
      kd.toast(FF.errorText(e, lang));
      load();
    }
    setBusy(false);
  };
  const create = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      const c: Collection = await FF.post('/me/collections', { name: n, eventId: event.id });
      setName('');
      kd.toast(fill(T.added, { n: c.name }));
      onChanged(true);
      await load();
    } catch (x) { kd.toast(FF.errorText(x, lang)); }
    setBusy(false);
  };

  return (
    <Sheet title={T.pickTitle} closeLabel={pick(WEB, lang).close} onClose={onClose}>
      <div className="flex flex-col gap-3 pt-1">
        <span className="kd-s kd-ell">{event.title}</span>
        {items === null ? (
          <div className="kd-skel h-14" aria-hidden="true" />
        ) : items.length ? (
          <div role="group" aria-label={T.collections} className="flex flex-col">
            {items.map((c) => (
              <button
                key={c.id}
                type="button"
                role="checkbox"
                aria-checked={!!c.has}
                disabled={busy}
                className="kd-lrow w-full cursor-pointer border-x-0 border-t-0 bg-transparent text-left disabled:cursor-default"
                onClick={() => toggle(c)}
              >
                <span className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded-tag shadow-[inset_0_0_0_1px_var(--color-line2)]', c.has && 'bg-acc text-acc-ink shadow-none')}>
                  {c.has ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : null}
                </span>
                <span className="kd-hs kd-ell min-w-0 flex-1">{c.name}</span>
                <span className="kd-m kd-num">{c.count}</span>
                <span className="flex text-fog" title={c.isPublic ? T.isPublic : T.isPrivate}>
                  {c.isPublic ? <GlobeHemisphereWestIcon size={16} aria-hidden="true" /> : <LockSimpleIcon size={16} aria-hidden="true" />}
                  <span className="sr-only">{c.isPublic ? T.isPublic : T.isPrivate}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <form onSubmit={create} className="flex gap-2">
          <Input boxClass="flex-1" placeholder={T.namePh} aria-label={T.namePh} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          <Button type="submit" disabled={!name.trim() || busy}>{T.create}</Button>
        </form>
      </div>
    </Sheet>
  );
}
