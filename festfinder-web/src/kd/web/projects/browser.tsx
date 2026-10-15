'use client';
/**
 * /p's list: what the projects look for as tabs (with their counts), the city, and 24 at a time.
 * The address keeps the choices (?seeking=&city=); the server renders the first page of all.
 */
import { useEffect, useState } from 'react';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { cx } from '../../cx';
import { Button } from '../../ui/actions';
import { Picker } from '../../ui/menu';
import { Card as Panel } from '../../ui/parts';
import { Tabs } from '../../ui/shell';
import { ProjectCard } from './card';
import { PROJ } from './copy';
import { SEEKING, SEEKING_LABEL, type ProjectList, type Seeking } from './model';

interface Filters { seeking: Seeking | null; city: string }

const query = (f: Filters, offset = 0) => {
  const q = new URLSearchParams({ limit: '24' });
  if (f.seeking) q.set('seeking', f.seeking);
  if (f.city) q.set('city', f.city);
  if (offset) q.set('offset', String(offset));
  return q.toString();
};

export function ProjectsBrowser({ lang, first, cities }: { lang: Lang; first: ProjectList; cities: { slug: string; name: Pair }[] }) {
  const T = pick(PROJ, lang);
  const S = pick(SEEKING_LABEL, lang);
  const [f, setF] = useState<Filters>({ seeking: null, city: '' });
  const [list, setList] = useState<ProjectList>(first);
  const [busy, setBusy] = useState(false);

  const load = async (next: Filters, offset = 0) => {
    setBusy(true);
    const out = (await FF.maybe(FF.get('/projects?' + query(next, offset)), null)) as ProjectList | null;
    setBusy(false);
    if (!out) return;
    setList((cur) => (offset ? { ...out, items: [...cur.items, ...out.items] } : out));
  };
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = q.get('seeking') as Seeking | null;
    const next = { seeking: s && SEEKING.includes(s) ? s : null, city: cities.some((c) => c.slug === q.get('city')) ? q.get('city')! : '' };
    if (next.seeking || next.city) { setF(next); load(next); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    const q = new URLSearchParams();
    if (next.seeking) q.set('seeking', next.seeking);
    if (next.city) q.set('city', next.city);
    if (lang === 'en') q.set('lang', 'en');
    history.replaceState(history.state, '', '/p' + (q.size ? '?' + q : ''));
    load(next);
  };
  const all = Object.values(list.seeking).reduce((a, b) => Math.max(a, b), 0);

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        label={T.seeking}
        current={f.seeking ?? 'all'}
        onSelect={(k) => set({ seeking: k === 'all' ? null : (k as Seeking) })}
        items={[{ key: 'all', label: T.all, count: f.seeking ? null : list.total || all || null }, ...SEEKING.map((k) => ({ key: k, label: S[k], count: list.seeking[k] ?? null }))]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Picker
          label={T.city}
          value={f.city || 'all'}
          onChange={(v) => set({ city: v === 'all' ? '' : v })}
          options={[{ value: 'all', label: T.allCities }, ...cities.map((c) => ({ value: c.slug, label: c.name[lang] }))]}
          display={f.city ? cities.find((c) => c.slug === f.city)?.name[lang] : T.allCities}
        />
        <span className="kd-m kd-num" aria-live="polite">{fill(T.count, { n: list.total })}</span>
      </div>
      {list.items.length ? (
        <div className={cx('kd-cards transition-opacity', busy && 'opacity-60')}>
          {list.items.map((p, i) => <ProjectCard key={p.id} p={p} i={i} lang={lang} />)}
        </div>
      ) : busy ? <div className="kd-skel h-40" aria-hidden="true" /> : (
        <Panel role="status" className="p-7"><span className="kd-h">{T.empty}</span></Panel>
      )}
      {list.nextOffset != null ? <Button className="self-center" disabled={busy} onClick={() => load(f, list.nextOffset!)}>{T.more}</Button> : null}
    </div>
  );
}
