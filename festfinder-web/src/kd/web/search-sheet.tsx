'use client';
/**
 * The "Tìm" sheet of the site's frame (chrome.tsx): the search, the places the tab bar has no room
 * for, then the styles. Loaded the first time it opens (⌘K, the tab bar's "Tìm" or the nav's
 * icon), so the pages do not carry it (design v2 phase 7).
 */
import { useEffect, useState, type FormEvent } from 'react';
import { CaretRightIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../copy';
import { g, styleChips, styleLabel } from '../genre';
import { inLang } from '../link';
import { buttonClass } from '../ui/actions';
import { Input } from '../ui/forms';
import { Sheet } from '../ui/sheet';
import { WEB } from './copy';
import { styleHref, track } from './chrome';

/** "Tìm": the search, then the places the tab bar has no room for, then the styles (filters of the list). */
export default function SearchSheet({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const T = pick(WEB, lang);
  const [q, setQ] = useState('');
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    // Counted over every upcoming event, as the links lead to all of them.
    FF.once('kd:style-counts', () => FF.maybe(FF.get('/events?time=all&upcoming=1&limit=1'), null)).then((r: { facets?: { style?: Record<string, number> } } | null) => {
      if (r?.facets?.style) setCounts(r.facets.style);
    });
  }, []);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    FF.track('search', { screen: 'nav' });
    location.assign(inLang('/?q=' + encodeURIComponent(v), lang));
  };
  const go = ([kind, href, label]: readonly [string, string, string]) => (
    <a key={kind} href={href} onClick={track(kind, 'search')} className="kd-lrow min-h-13">
      <span className="kd-h min-w-0 flex-1">{label}</span>
      <CaretRightIcon size={16} className="text-fg-3" aria-hidden="true" />
    </a>
  );
  return (
    <Sheet title={T.search} closeLabel={T.close} onClose={onClose}>
      <form role="search" onSubmit={submit} className="flex flex-col gap-3 pt-2">
        <Input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={T.searchPh}
          aria-label={T.search}
          icon={<MagnifyingGlassIcon size={18} aria-hidden="true" />}
        />
        <button type="submit" className={buttonClass({ tone: 'acc', block: true })}>{T.searchGo}</button>
      </form>
      <nav aria-label={T.goTo} className="mt-5 flex flex-col">
        {([['projects', inLang('/p', lang), T.projects], ['organisers', '/studio', T.organisers]] as const).map(go)}
      </nav>
      <h3 className="kd-m mb-2.5 mt-5">{T.genres}</h3>
      <div className="flex flex-wrap gap-2">
        {styleChips(counts, 10).map((k) => (
          <a key={k} href={styleHref(k, lang)} className="kd-chip" onClick={track('style', 'search')}>
            <span className={`kd-mk ${g('edm')}`} aria-hidden="true" />{styleLabel(k, lang)}
            {counts?.[k] != null ? <span className="kd-num text-fg-3">{counts[k]}</span> : null}
          </a>
        ))}
      </div>
    </Sheet>
  );
}
