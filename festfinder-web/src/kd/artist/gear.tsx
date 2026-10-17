'use client';
/**
 * /studio/artist/gear: the gear and software the artist plays and produces with (PUT
 * /me/artist/gear replaces the list). Picked from the catalogue; a name the catalogue lacks
 * waits for the team before it shows on their page.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PlusIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang, type Pair } from '../copy';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { Input, Select } from '../ui/forms';
import { Status } from '../ui/parts';
import { Row, Table } from '../ui/shell';
import { act, AsyncPick, Body, Empty, Field, Loaded, PageHead, useLoad, type PickItem } from '../console/kit';
import { ARTIST } from './copy';
import { Block } from './parts';
import { useArtist } from './root';

type Use = 'both' | 'studio' | 'live';
interface Gear { id: string; name: string; brand: string | null; category: string; categoryLabel: Pair; approved: boolean; usedFor?: Use }
/** One line of the list: a catalogue item, or a new name for the team. */
interface Item { gearId?: string; name: string; brand?: string; category?: string; approved: boolean; usedFor: Use }

const full = (g: { brand?: string | null; name: string }) => [g.brand, g.name].filter(Boolean).join(' ');
const COLS = 'minmax(220px,2fr) minmax(180px,1fr) minmax(90px,auto)';

export function ArtistGear() {
  const { lang } = useArtist();
  const T = pick(ARTIST, lang);
  const load = useLoad<{ items: Gear[] }>('/me/artist/gear');
  const cats = useLoad<{ categories: { key: string; label: Pair }[] }>('/gear?limit=1');
  return (
    <>
      <PageHead title={T.gearTitle} />
      <Body>
        <Loaded load={load}>
          {(data) => <List lang={lang} served={data.items} categories={cats.data?.categories ?? []} onSaved={load.setData} />}
        </Loaded>
      </Body>
    </>
  );
}

function List({ lang, served, categories, onSaved }: {
  lang: Lang; served: Gear[]; categories: { key: string; label: Pair }[]; onSaved: (d: { items: Gear[] }) => void;
}) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const [items, setItems] = useState<Item[]>([]);
  const [fresh, setFresh] = useState({ name: '', brand: '', category: 'other' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { setItems(served.map((g) => ({ gearId: g.id, name: full(g), approved: g.approved, usedFor: g.usedFor ?? 'both' }))); }, [served]);

  const save = async (next: Item[]) => {
    setBusy(true);
    const out = await act(kd, lang, () => FF.put('/me/artist/gear', {
      items: next.map((x) => (x.gearId ? { gearId: x.gearId, usedFor: x.usedFor } : { name: x.name, brand: x.brand ?? '', category: x.category ?? 'other', usedFor: x.usedFor })),
    }));
    setBusy(false);
    if (out && out.items) onSaved({ items: out.items });
    return !!out;
  };
  const search = useCallback(async (q: string): Promise<PickItem[]> => {
    const out = await FF.get('/gear' + (q ? '?q=' + encodeURIComponent(q) : ''));
    return (out.items as Gear[]).map((g) => ({ value: g.id, label: full(g), sub: g.categoryLabel?.[lang] }));
  }, [lang]);
  const addNew = async (e: FormEvent) => {
    e.preventDefault();
    if (fresh.name.trim().length < 2) return;
    if (await save([...items, { name: fresh.name.trim(), brand: fresh.brand.trim(), category: fresh.category, approved: false, usedFor: 'both' }])) setFresh({ name: '', brand: '', category: 'other' });
  };
  const uses: [Use, string][] = [['both', T.useBoth], ['studio', T.useStudio], ['live', T.useLive]];

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-3">
        <Block title={T.fromCatalogue}>
          <AsyncPick
            label={T.fromCatalogue}
            placeholder={T.searchGear}
            load={search}
            onPick={(p) => { if (p && !items.some((x) => x.gearId === p.value)) void save([...items, { gearId: p.value, name: p.label, approved: true, usedFor: 'both' }]); }}
          />
        </Block>
        <Block title={T.notInCatalogue}>
          <form className="flex flex-col gap-3" onSubmit={addNew}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
              <Field label={T.gearName} htmlFor="gr-name"><Input id="gr-name" required maxLength={80} value={fresh.name} onChange={(e) => setFresh({ ...fresh, name: e.target.value })} /></Field>
              <Field label={<>{T.brand} <span className="font-normal text-fg-3">{T.optional}</span></>} htmlFor="gr-brand"><Input id="gr-brand" maxLength={60} value={fresh.brand} onChange={(e) => setFresh({ ...fresh, brand: e.target.value })} /></Field>
              <Field label={T.category} htmlFor="gr-cat">
                <Select id="gr-cat" value={fresh.category} onChange={(e) => setFresh({ ...fresh, category: e.target.value })}>
                  {categories.length ? categories.map((c) => <option key={c.key} value={c.key}>{c.label[lang]}</option>) : <option value="other">—</option>}
                </Select>
              </Field>
            </div>
            <Button type="submit" className="self-start" disabled={busy || fresh.name.trim().length < 2}><PlusIcon size={16} aria-hidden="true" />{T.add}</Button>
          </form>
        </Block>
      </div>
      {!items.length ? <Empty title={T.noGear} /> : (
        <Table cols={COLS} label={T.gearTitle} head={[T.item, T.usedFor, '']}>
          {items.map((x) => (
            <Row key={x.gearId ?? x.name} cols={COLS} className="py-2">
              <span role="cell" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <span className="kd-hs kd-ell">{x.name}</span>
                {x.approved ? null : <Status tone="warn">{T.waiting}</Status>}
              </span>
              <span role="cell">
                <Select aria-label={`${T.usedFor} · ${x.name}`} value={x.usedFor} disabled={busy} onChange={(e) => save(items.map((y) => (y === x ? { ...y, usedFor: e.target.value as Use } : y)))}>
                  {uses.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </Select>
              </span>
              <span role="cell" className="flex justify-end">
                <Button size="sm" tone="ghost" disabled={busy} aria-label={`${T.remove} · ${x.name}`} onClick={() => save(items.filter((y) => y !== x))}>{T.remove}</Button>
              </span>
            </Row>
          ))}
        </Table>
      )}
    </>
  );
}
