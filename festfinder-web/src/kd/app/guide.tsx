'use client';
/**
 * /app/guide/<slug> in Kính đêm: around the event, generated once a day by the API (Claude):
 * where to eat before doors, where to go after, what is worth a detour, what to wear and one
 * tip. When the guide is switched off or fails, it says so and offers to try again.
 */
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../copy';
import { Button } from '../ui/actions';
import { Card as Panel } from '../ui/parts';
import { AppBar } from '../ui/shell';
import type { EventDetail } from '../types';
import { APP } from './copy';
import { SignInCard } from './row';
import { useKd } from '../runtime';

interface Spot { name: string; kind: string; walk: string; why: string }
interface Guide { before: Spot[]; after: Spot[]; explore: Spot[]; wear: { headline: string; items: string[]; avoid: string }; tip: string }

export function GuideScreen({ lang, ev }: { lang: Lang; ev: EventDetail }) {
  const T = pick(APP, lang);
  const kd = useKd();
  return (
    <>
      <AppBar>
        <a className="kd-ib -ml-2" href={'/app/e/' + ev.slug} aria-label={T.back}><ArrowLeftIcon size={22} aria-hidden="true" /></a>
        <span className="ml-1 flex min-w-0 flex-col"><h1 className="kd-hs">{T.guideTitle}</h1><span className="kd-m kd-ell">{ev.title}</span></span>
      </AppBar>
      {kd.session === undefined ? <div className="kd-skel mx-4 h-40" aria-hidden="true" /> : kd.user ? <GuideBody lang={lang} ev={ev} /> : <SignInCard lang={lang} note={T.gateMe} />}
    </>
  );
}

function GuideBody({ lang, ev }: { lang: Lang; ev: EventDetail }) {
  const T = pick(APP, lang);
  const [g, setG] = useState<Guide | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    setErr(''); setG(null);
    try { setG(await FF.get('/events/' + ev.id + '/guide?lang=' + lang)); } catch (e) { setErr(FF.errorText(e, lang)); }
  }, [ev.id, lang]);
  useEffect(() => { load(); }, [load]);
  if (err) return <Panel className="m-4 flex flex-col items-start gap-3 p-5"><span className="kd-t">{err}</span><Button size="sm" onClick={load}>{T.guideRetry}</Button></Panel>;
  if (!g) return <p className="kd-s px-4" role="status">{T.guideLoading}</p>;
  const spots = (title: string, xs: Spot[]) => xs.length ? (
    <section className="flex flex-col" aria-label={title}>
      <h2 className="kd-m pb-1.5">{title}</h2>
      {xs.map((s) => (
        <div key={s.name} className="flex flex-col gap-0.5 border-t border-line py-3">
          <span className="flex items-baseline justify-between gap-3"><span className="kd-hs">{s.name}</span><span className="kd-m kd-num shrink-0">{s.walk}</span></span>
          <span className="kd-s">{s.why}</span>
        </div>
      ))}
    </section>
  ) : null;
  return (
    <div className="flex flex-col gap-6 px-4 pb-8">
      {spots(T.guideBefore, g.before)}
      {spots(T.guideAfter, g.after)}
      {spots(T.guideExplore, g.explore)}
      <section className="flex flex-col gap-1.5" aria-label={T.guideWear}>
        <h2 className="kd-m">{T.guideWear}</h2>
        <span className="kd-hs">{g.wear.headline}</span>
        <ul className="kd-s list-disc pl-5">{g.wear.items.map((x) => <li key={x}>{x}</li>)}</ul>
        <span className="kd-s"><span className="text-paper">{T.guideAvoid}:</span> {g.wear.avoid}</span>
      </section>
      <Panel className="p-4"><span className="kd-t">{g.tip}</span></Panel>
      <span className="kd-s">{T.guideAi}</span>
    </div>
  );
}
