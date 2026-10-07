'use client';
/**
 * /saved in Kính đêm (not drawn; Web-Home's list parts): the events this person saved, and their
 * collections. Chips pick "Tất cả" or one collection (/saved?c=<id>, a step Back undoes); "Mới"
 * makes one. An open collection has its bar (rename, public link, share, delete). Every event can
 * be put in or taken out of collections from its folder button; upcoming ones are cards with the
 * heart, the past ones fold away below. Private: signed out, a sign-in card stands in.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CaretDownIcon, FolderSimplePlusIcon, HeartIcon, LockSimpleIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { COMMON, fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { monthShort } from '../../format';
import { familyOf, g } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { useKd } from '../../runtime';
import { Button, Chip, IconButton, LinkButton, buttonClass } from '../../ui/actions';
import { Accordion, Card as Panel, DateBlock, Marker } from '../../ui/parts';
import type { Card } from '../../types';
import { EventCard } from '../card';
import { WebFooter } from '../chrome';
import { CollectionBar } from './bar';
import { SAVED } from './copy';
import { byDate, savedHref, type Collection, type CollectionItems, type SavedCard, type SavesPage } from './model';
import { CollectSheet, NewSheet } from './sheets';

/** Cards shown before "Xem thêm N". */
const FIRST = 12;

/** The collection the address names: /saved?c=<id>. */
const readCol = () => new URLSearchParams(location.search).get('c') || null;

export function SavedPage({ lang, initial }: { lang: Lang; initial: string | null }) {
  const kd = useKd();
  const T = pick(SAVED, lang);
  const [cur, setCur] = useState<string | null>(initial);

  // Back and Forward move between collections as the chips did.
  useEffect(() => {
    const onPop = () => setCur(readCol());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /** Open a collection (or all saved), with the address to match. */
  const select = useCallback((id: string | null, how: 'push' | 'replace' = 'push') => {
    setCur(id);
    const to = savedHref(id, lang);
    if (to === location.pathname + location.search) return;
    if (how === 'push') history.pushState(null, '', to);
    else history.replaceState(null, '', to);
  }, [lang]);

  const otherLang = useMemo(
    () => (lang === 'vi' ? { href: savedHref(cur, 'en'), label: 'English' } : { href: savedHref(cur, 'vi'), label: 'Tiếng Việt' }),
    [lang, cur],
  );

  let body;
  if (kd.session === undefined) {
    body = <div className="kd-wrap py-8"><div className="kd-skel h-80" aria-hidden="true" /></div>;
  } else if (!kd.user) {
    body = (
      <main className="kd-wrap flex justify-center py-16" data-ff-gate>
        <Panel className="flex w-full max-w-[420px] flex-col items-start gap-4 p-7">
          <h1 className="kd-d3">{T.title}</h1>
          <p className="kd-s">{T.gate}</p>
          <button type="button" className={buttonClass({ tone: 'acc' })} onClick={() => kd.openSignIn(T.gate)}>{pick(COMMON, lang).signIn}</button>
        </Panel>
      </main>
    );
  } else {
    body = <Mine lang={lang} cur={cur} select={select} />;
  }
  return (
    <>
      {body}
      <div className="mt-auto"><WebFooter lang={lang} otherLang={otherLang} /></div>
    </>
  );
}

function Mine({ lang, cur, select }: { lang: Lang; cur: string | null; select: (id: string | null, how?: 'push' | 'replace') => void }) {
  const kd = useKd();
  const { toast } = kd;
  const T = pick(SAVED, lang);
  const C = pick(COMMON, lang);
  const [saves, setSaves] = useState<SavesPage | null>(null);
  const [moreBusy, setMoreBusy] = useState(false);
  const [cols, setCols] = useState<Collection[] | null>(null);
  const [opened, setOpened] = useState<{ id: string; meta: Collection; items: SavedCard[] } | null>(null);
  const [making, setMaking] = useState(false);
  const [collecting, setCollecting] = useState<SavedCard | null>(null);
  // Hearts changed on this page (false: taken off). A card taken off stays, its heart empty,
  // until the next visit; anything not marked is as the API sent it.
  const [mark, setMark] = useState<ReadonlyMap<string, boolean>>(() => new Map());
  const markAs = useCallback((id: string, on: boolean) => setMark((m) => (m.get(id) === on ? m : new Map(m).set(id, on))), []);
  const isSaved = (e: SavedCard) => mark.get(e.id) ?? e.viewer?.saved ?? true;
  const [allCards, setAllCards] = useState(false);
  useEffect(() => setAllCards(false), [cur]);

  const loadCols = useCallback(async () => {
    const out = await FF.maybe(FF.get('/me/collections'), null);
    if (out) setCols(out.items);
  }, []);
  const loadSaves = useCallback(async () => {
    const out: SavesPage | null = await FF.maybe(FF.get('/me/saves?limit=100'), null);
    setSaves(out ?? { items: [], nextCursor: null });
  }, []);
  useEffect(() => { loadSaves(); loadCols(); }, [loadSaves, loadCols]);

  // The hearts on the cards go through the shared saved set: follow what it drops and takes back.
  const before = useRef(kd.saved);
  useEffect(() => {
    const was = before.current;
    before.current = kd.saved;
    setMark((m) => {
      let n: Map<string, boolean> | null = null;
      for (const id of was) if (!kd.saved.has(id)) (n ??= new Map(m)).set(id, false);
      for (const id of kd.saved) if (!was.has(id) && m.get(id) === false) (n ??= new Map(m)).set(id, true);
      return n ?? m;
    });
  }, [kd.saved]);

  // One collection's events, each time it opens; a collection that is not there leads back to all.
  const token = useRef(0);
  const loadOpened = useCallback(async (id: string) => {
    const mine = ++token.current;
    const out: CollectionItems | null = await FF.maybe(FF.get('/me/collections/' + encodeURIComponent(id)), null);
    if (mine !== token.current) return;
    if (!out) {
      setOpened(null);
      toast(T.missing);
      select(null, 'replace');
      return;
    }
    setOpened({ id, meta: out.collection, items: byDate(out.items) });
    setCols((xs) => xs && xs.map((x) => (x.id === id ? out.collection : x)));
  }, [toast, T.missing, select]);
  useEffect(() => {
    if (!cur) { token.current++; setOpened(null); return; }
    setOpened((o) => (o && o.id === cur ? o : null));
    loadOpened(cur);
  }, [cur, loadOpened]);

  const more = async () => {
    if (!saves?.nextCursor || moreBusy) return;
    setMoreBusy(true);
    const out: SavesPage | null = await FF.maybe(FF.get('/me/saves?limit=100&cursor=' + encodeURIComponent(saves.nextCursor)), null);
    if (out) setSaves((s) => ({ items: [...(s?.items ?? []), ...out.items.filter((e) => !s?.items.some((x) => x.id === e.id))], nextCursor: out.nextCursor }));
    setMoreBusy(false);
  };

  /**
   * A past event's heart. The cards' hearts go through the shared saved set, which may leave
   * past nights out, so these rows keep their own state (from the API's viewer.saved).
   */
  const setPastSaved = async (e: SavedCard, on: boolean) => {
    markAs(e.id, on);
    try {
      await (on ? FF.put : FF.del)('/me/saves/' + e.id);
    } catch (x) {
      markAs(e.id, !on);
      kd.toast(FF.errorText(x, lang));
    }
  };

  /** After the folder sheet changed something: counts, the open collection, and the heart (collecting saves). */
  const changed = (added: boolean) => {
    loadCols();
    if (cur) loadOpened(cur);
    const e = collecting;
    if (!added || !e) return;
    if (e.past) markAs(e.id, true);
    else if (!kd.saved.has(e.id)) kd.toggleSave(e.id);
  };

  const col = cur ? (cols?.find((c) => c.id === cur) ?? (opened?.id === cur ? opened.meta : null)) : null;
  const list = cur ? (opened?.id === cur ? opened.items : null) : saves?.items ?? null;
  const upcoming = (list ?? []).filter((e) => !e.past);
  const past = (list ?? []).filter((e) => e.past);
  const cards = allCards ? upcoming : upcoming.slice(0, FIRST);
  const savedCount = saves && !saves.nextCursor ? saves.items.filter(isSaved).length : null;
  const folderLabel = (e: Card) => fill(T.collectEvent, { t: e.title });

  return (
    <main className="kd-wrap flex flex-col gap-5 pb-8 pt-8">
      <h1 className="kd-d1">{T.title}</h1>

      <div className="kd-hscroll -mx-4 px-4 tab:mx-0 tab:px-0" role="group" aria-label={T.collections}>
        <Chip on={!cur} count={savedCount} onClick={() => select(null)}>{T.all}</Chip>
        {(cols ?? []).map((c) => (
          <Chip key={c.id} on={cur === c.id} count={c.count} onClick={() => select(c.id)}>
            {c.isPublic ? null : <LockSimpleIcon size={14} aria-hidden="true" />}
            {c.name}
            {c.isPublic ? null : <span className="sr-only">{' · ' + T.isPrivate + ' '}</span>}
          </Chip>
        ))}
        <button type="button" className="kd-chip" aria-label={T.newTitle} onClick={() => setMaking(true)}>
          <PlusIcon size={14} aria-hidden="true" />{T.newShort}
        </button>
      </div>

      {col ? (
        <CollectionBar
          lang={lang}
          col={col}
          events={opened?.id === col.id ? opened.items : []}
          onChange={(c) => {
            setCols((xs) => xs && xs.map((x) => (x.id === c.id ? c : x)));
            setOpened((o) => (o && o.id === c.id ? { ...o, meta: c } : o));
          }}
          onDeleted={(id) => {
            setCols((xs) => xs && xs.filter((x) => x.id !== id));
            select(null, 'replace');
          }}
        />
      ) : null}

      {list === null ? (
        <div className="kd-cards" aria-hidden="true">
          {[0, 1, 2].map((i) => <div key={i} className="kd-skel aspect-[4/3]" />)}
        </div>
      ) : list.length ? (
        <>
          {upcoming.length ? (
            <div className="kd-cards">
              {cards.map((e, i) => (
                <div key={e.id} className="relative">
                  <EventCard e={e} i={i} lang={lang} />
                  {/* Beside the card's heart, over its art. */}
                  <span className="absolute right-[52px] top-2.5">
                    <IconButton size="sm" glass className="text-paper" label={folderLabel(e)} onClick={() => setCollecting(e)}>
                      <FolderSimplePlusIcon size={18} aria-hidden="true" />
                    </IconButton>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {upcoming.length > FIRST ? (
            <button type="button" className="kd-more self-center" aria-expanded={allCards} onClick={() => setAllCards((a) => !a)}>
              {allCards ? C.less : fill(C.moreN, { n: upcoming.length - FIRST })}
              <CaretDownIcon size={14} className="kd-chev" aria-hidden="true" />
            </button>
          ) : null}
          {past.length ? (
            <Accordion summary={T.past} aside={past.length} open={!upcoming.length}>
              <ul className="flex flex-col">
                {past.map((e) => (
                  <PastRow
                    key={e.id}
                    e={e}
                    lang={lang}
                    saved={isSaved(e)}
                    onSave={(on) => setPastSaved(e, on)}
                    onCollect={() => setCollecting(e)}
                    folderLabel={folderLabel(e)}
                  />
                ))}
              </ul>
            </Accordion>
          ) : null}
          {!cur && saves?.nextCursor && (allCards || upcoming.length <= FIRST) ? (
            <Button className="self-center" onClick={more} disabled={moreBusy}>{T.more}</Button>
          ) : null}
        </>
      ) : (
        <Panel role="status" className="flex flex-wrap items-center justify-between gap-4 p-7">
          <span className="kd-h">{cur ? T.colEmpty : T.empty}</span>
          {cur
            ? <Button onClick={() => select(null)}>{T.all}</Button>
            : <LinkButton tone="light" href={inLang('/', lang)}>{T.explore}</LinkButton>}
        </Panel>
      )}

      {making ? (
        <NewSheet
          lang={lang}
          onClose={() => setMaking(false)}
          onCreated={(c) => {
            setMaking(false);
            setCols((xs) => [c, ...(xs ?? []).filter((x) => x.id !== c.id)]);
            select(c.id);
          }}
        />
      ) : null}
      {collecting ? <CollectSheet lang={lang} event={collecting} onClose={() => setCollecting(null)} onChanged={changed} /> : null}
    </main>
  );
}

/** A past saved event: its date, title, marker + venue · city, its heart and its folder button. */
function PastRow({ e, lang, saved, onSave, onCollect, folderLabel }: {
  e: Card; lang: Lang; saved: boolean; onSave: (on: boolean) => void; onCollect: () => void; folderLabel: string;
}) {
  const T = pick(SAVED, lang);
  const fam = familyOf(e.genre);
  return (
    <li className={cx('grid min-h-20 grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line', g(fam))}>
      {e.startsOn ? <DateBlock top={monthShort(e.startsOn, lang)} day={Number(e.startsOn.slice(8, 10))} bottom={e.startsOn.slice(0, 4)} /> : <span />}
      <span className="flex min-w-0 flex-col gap-1">
        <Link href={inLang('/e/' + e.slug, lang)} className="kd-hs kd-ell hover:underline">{e.title}</Link>
        <span className="kd-s kd-ell flex items-center gap-1.5">
          <Marker family={fam} />
          {[e.venue.name, e.cityLabel?.[lang]].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className="flex items-center gap-0.5">
        <IconButton size="sm" label={folderLabel} onClick={onCollect}>
          <FolderSimplePlusIcon size={18} aria-hidden="true" />
        </IconButton>
        <IconButton size="sm" pressed={saved} label={fill(T.saveThis, { t: e.title })} onClick={() => onSave(!saved)}>
          <HeartIcon size={18} weight={saved ? 'fill' : 'regular'} aria-hidden="true" />
        </IconButton>
      </span>
    </li>
  );
}
