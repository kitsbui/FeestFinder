'use client';
/**
 * /console/artists: the artist catalogue and the gear catalogue (?tab=gear). What only the team
 * sets lives here: the verified tick, the other names an artist goes by, and the identity
 * anchors (MusicBrainz, Wikidata, Spotify) that beat a name match when sources are merged. Gear
 * that artists name and the catalogue lacks waits here for approval, and an item can carry an
 * affiliate link. The search and the tab live in the address.
 */
import { useEffect, useRef, useState } from 'react';
import { PencilSimpleIcon, SealCheckIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { freshen } from '../../fresh';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { count } from '../../format';
import { useKd } from '../../runtime';
import { Button, IconButton } from '../../ui/actions';
import { Input, Select, SwitchRow } from '../../ui/forms';
import { Row, Table, Tabs } from '../../ui/shell';
import { Body, Drawer, Empty, Field, FilterBar, Loaded, PageHead, Pill, SearchField, useLoad, useQuery } from '../kit';
import { useConsole } from '../root';
import { ARTISTS } from './copy';

interface Artist {
  id: string; slug: string; name: string; aliases: string[]; verified: boolean;
  musicbrainzId: string | null; wikidataId: string | null; spotifyId: string | null;
  owner: { id: string; email: string | null } | null; events: number;
}
interface Gear {
  id: string; slug: string; name: string; brand: string | null; category: string; categoryLabel: Pair; approved: boolean;
  artists: number; affiliateLinkId: string | null; linkCode: string | null; suggestedBy: string | null;
}

export function Artists() {
  const { lang } = useConsole();
  const T = pick(ARTISTS, lang);
  const [params, setParams] = useQuery();
  const tab = params.get('tab') === 'gear' ? 'gear' : 'artists';
  return (
    <>
      <PageHead title={T.title} />
      <Body>
        <Tabs
          label={T.tabs}
          current={tab}
          onSelect={(k) => setParams({ tab: k === 'gear' ? 'gear' : null, q: null, pending: null })}
          items={[{ key: 'artists', label: T.tabArtists }, { key: 'gear', label: T.tabGear }]}
        />
        {tab === 'gear' ? <GearList lang={lang} /> : <Catalogue lang={lang} />}
      </Body>
    </>
  );
}

// ---- the catalogue ----------------------------------------------------------------------

const COLS = 'minmax(170px,1.4fr) 120px minmax(130px,1fr) minmax(150px,1fr) 170px 70px 44px';
const anchors = (a: Artist) => [a.musicbrainzId && 'MusicBrainz', a.wikidataId && 'Wikidata', a.spotifyId && 'Spotify'].filter(Boolean).join(' · ') || '—';

function Catalogue({ lang }: { lang: Lang }) {
  const T = pick(ARTISTS, lang);
  const [params, setParams] = useQuery();
  const q = params.get('q') ?? '';
  // What is typed shows at once; the address (and the request) follow after a pause.
  const [typed, setTyped] = useState(q);
  const synced = useRef(q);
  useEffect(() => { if (q !== synced.current) { synced.current = q; setTyped(q); } }, [q]);
  useEffect(() => {
    if (typed === synced.current) return;
    const t = setTimeout(() => { synced.current = typed; setParams({ q: typed.trim() || null }); }, 250);
    return () => clearTimeout(t);
  }, [typed, setParams]);
  const load = useLoad<{ items: Artist[] }>('/admin/artists?limit=200' + (q.trim() ? '&q=' + encodeURIComponent(q.trim()) : ''));
  const [open, setOpen] = useState<Artist | null>(null);
  return (
    <>
      <FilterBar onReset={typed ? () => setTyped('') : null}>
        <SearchField value={typed} onChange={setTyped} label={T.searchLabel} placeholder={T.search} />
      </FilterBar>
      <Loaded load={load}>
        {(d) => !d.items.length ? <Empty title={T.noArtists} /> : (
          <Table label={T.title} cols={COLS} head={[T.colArtist, T.colVerified, T.colAliases, T.colOwner, T.colAnchors, <span key="e" className="block text-right">{T.colEvents}</span>, '']}>
            {d.items.map((a) => (
              <Row key={a.id} cols={COLS}>
                <span role="cell" className="kd-ell"><a className="kd-hs hover:underline" href={'/a/' + a.slug} target="_blank" rel="noopener">{a.name}</a></span>
                <span role="cell">{a.verified ? <Pill tone="ok"><SealCheckIcon size={12} aria-hidden="true" />{T.verified}</Pill> : <span className="kd-s">—</span>}</span>
                <span role="cell" className="kd-s kd-ell">{a.aliases.length ? a.aliases.join(', ') : '—'}</span>
                <span role="cell" className="kd-s kd-ell">{a.owner?.email ?? '—'}</span>
                <span role="cell" className="kd-s kd-ell">{anchors(a)}</span>
                <span role="cell" className="kd-num text-right text-sm text-fg-1">{count(a.events, lang)}</span>
                <span role="cell"><IconButton size="sm" label={fill(T.editOne, { n: a.name })} onClick={() => setOpen(a)}><PencilSimpleIcon size={16} aria-hidden="true" /></IconButton></span>
              </Row>
            ))}
          </Table>
        )}
      </Loaded>
      {open ? <ArtistDrawer key={open.id} lang={lang} artist={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); load.reload(); }} /> : null}
    </>
  );
}

const MB = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WD = /^Q\d{1,12}$/;
const SP = /^[A-Za-z0-9]{22}$/;

function ArtistDrawer({ lang, artist, onClose, onSaved }: { lang: Lang; artist: Artist; onClose: () => void; onSaved: () => void }) {
  const T = pick(ARTISTS, lang);
  const kd = useKd();
  const [f, setF] = useState(() => ({
    verified: artist.verified, aliases: artist.aliases.join(', '),
    musicbrainzId: artist.musicbrainzId ?? '', wikidataId: artist.wikidataId ?? '', spotifyId: artist.spotifyId ?? '',
  }));
  const [busy, setBusy] = useState(false);
  const [taken, setTaken] = useState(false);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setTaken(false); };
  const bad = {
    mb: !!f.musicbrainzId.trim() && !MB.test(f.musicbrainzId.trim()),
    wd: !!f.wikidataId.trim() && !WD.test(f.wikidataId.trim()),
    sp: !!f.spotifyId.trim() && !SP.test(f.spotifyId.trim()),
  };
  const ok = !bad.mb && !bad.wd && !bad.sp;
  const save = async () => {
    setBusy(true);
    try {
      await FF.patch('/admin/artists/' + artist.id, {
        verified: f.verified,
        aliases: f.aliases.split(',').map((s) => s.trim()).filter(Boolean),
        musicbrainzId: f.musicbrainzId.trim().toLowerCase() || null, wikidataId: f.wikidataId.trim() || null, spotifyId: f.spotifyId.trim() || null,
      });
      kd.toast(T.saved);
      void freshen('a', artist.slug);
      onSaved();
    } catch (e) {
      if ((e as { code?: string }).code === 'anchor_taken') setTaken(true);
      kd.toast(FF.errorText(e, lang));
    } finally { setBusy(false); }
  };
  return (
    <Drawer
      title={artist.name}
      sub={artist.owner?.email ?? T.notClaimed}
      onClose={onClose}
      footer={<>
        <Button onClick={onClose}>{T.cancel}</Button>
        <Button tone="acc" className="ml-auto" disabled={busy || !ok} onClick={save}>{T.save}</Button>
      </>}
    >
      <SwitchRow label={T.verified} checked={f.verified} onChange={set('verified')} />
      <Field label={T.aliases} hint={T.aliasesHint} htmlFor="ca-aliases">
        <Input id="ca-aliases" value={f.aliases} onChange={(e) => set('aliases')(e.target.value)} placeholder="DJ Mie, Mie Mie" />
      </Field>
      <Field label="MusicBrainz ID" hint={T.optional} htmlFor="ca-mb" error={bad.mb ? T.mbBad : null}>
        <Input id="ca-mb" className="kd-num" value={f.musicbrainzId} invalid={bad.mb || taken} onChange={(e) => set('musicbrainzId')(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
      </Field>
      <Field label="Wikidata" hint={T.optional} htmlFor="ca-wd" error={bad.wd ? T.wdBad : null}>
        <Input id="ca-wd" className="kd-num" value={f.wikidataId} invalid={bad.wd || taken} onChange={(e) => set('wikidataId')(e.target.value)} placeholder="Q123456" />
      </Field>
      <Field label="Spotify ID" hint={T.optional} htmlFor="ca-sp" error={bad.sp ? T.spBad : taken ? T.anchorTaken : null}>
        <Input id="ca-sp" className="kd-num" value={f.spotifyId} invalid={bad.sp || taken} onChange={(e) => set('spotifyId')(e.target.value)} placeholder={T.spPlaceholder} />
      </Field>
    </Drawer>
  );
}

// ---- gear -------------------------------------------------------------------------------

const GEAR_COLS = 'minmax(200px,1.6fr) 80px minmax(220px,1.2fr) 130px';

function GearList({ lang }: { lang: Lang }) {
  const T = pick(ARTISTS, lang);
  const kd = useKd();
  const [params, setParams] = useQuery();
  const pending = params.get('pending') === '0' ? '0' : '1';
  const load = useLoad<{ items: Gear[] }>('/admin/gear?pending=' + pending);
  const [busy, setBusy] = useState<string | null>(null);
  const change = async (g: Gear, body: Record<string, unknown>) => {
    setBusy(g.id);
    try { await FF.patch('/admin/gear/' + g.id, body); kd.toast(T.saved); load.reload(); } catch (e) { kd.toast(FF.errorText(e, lang)); } finally { setBusy(null); }
  };
  // The affiliate links, read once for every row's picker.
  const links = useLoad<{ items: { id: string; code: string; label: string }[] }>('/admin/affiliate/links');
  return (
    <>
      <Tabs
        label={T.gearState}
        current={pending}
        onSelect={(k) => setParams({ pending: k === '0' ? '0' : null })}
        items={[{ key: '1', label: T.waiting }, { key: '0', label: T.all }]}
      />
      <Loaded load={load}>
        {(d) => !d.items.length ? <Empty title={pending === '1' ? T.nothingWaiting : T.noGear} /> : (
          <Table label={T.tabGear} cols={GEAR_COLS} head={[T.colItem, <span key="a" className="block text-right">{T.colArtists}</span>, T.colLink, '']}>
            {d.items.map((g) => {
              const name = [g.brand, g.name].filter(Boolean).join(' ');
              return (
                <Row key={g.id} cols={GEAR_COLS} className="py-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="kd-hs kd-ell">{name}</span>
                    <span className="kd-s kd-ell">{FF.text(g.categoryLabel, lang)}{g.suggestedBy ? ' · ' + g.suggestedBy : ''}</span>
                  </span>
                  <span className="kd-num text-right text-sm text-fg-1">{count(g.artists, lang)}</span>
                  <Select
                    boxClass="h-10 min-h-0"
                    aria-label={fill(T.linkFor, { n: name })}
                    value={g.affiliateLinkId ?? ''}
                    disabled={busy === g.id}
                    onChange={(e) => change(g, { affiliateLinkId: e.target.value || null })}
                  >
                    <option value="">{T.noLink}</option>
                    {g.affiliateLinkId && !links.data?.items.some((l) => l.id === g.affiliateLinkId) ? <option value={g.affiliateLinkId}>{g.linkCode ?? '—'}</option> : null}
                    {(links.data?.items ?? []).map((l) => <option key={l.id} value={l.id}>{l.code} · {l.label}</option>)}
                  </Select>
                  <span className="flex justify-end">
                    {g.approved ? <Pill tone="ok">{T.approved}</Pill>
                      : <Button size="sm" aria-label={fill(T.approveOne, { n: name })} disabled={busy === g.id} onClick={() => change(g, { approved: true })}>{T.approve}</Button>}
                  </span>
                </Row>
              );
            })}
          </Table>
        )}
      </Loaded>
    </>
  );
}
