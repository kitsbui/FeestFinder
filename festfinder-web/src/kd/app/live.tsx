'use client';
/**
 * /app/live/<slug> in Kính đêm (design/App-Live): at the event. What is on now on each stage
 * (with how long is left), what comes next with a reminder 10 minutes before, the site map,
 * friends inside and the organiser's updates. The service worker keeps the last answer, so set
 * times and the map still work with no signal; it asks again every minute.
 */
import { useCallback, useEffect, useState } from 'react';
import { BellIcon, BellRingingIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { familyOf, g, type Family } from '../genre';
import { useKd } from '../runtime';
import { Segmented } from '../ui/forms';
import { Art, Card as Panel, Status } from '../ui/parts';
import { AppBar } from '../ui/shell';
import type { EventDetail } from '../types';
import { APP } from './copy';

interface Set { setId: string; artist: string; startsAt: string; endsAt: string; time: string; state: 'now' | 'next' | 'later' | 'done' | string; inPlan: boolean; reminded: boolean }
interface Stage { id: string; name: Pair; now: { setId: string } | null; next: { setId: string } | null; sets: Set[] }
interface Live {
  event: { id: string; slug: string; title: string };
  day: string; stages: Stage[];
  zones: { id: string; label: string; kind: string; x: number; y: number; w: number }[];
  friendsOnSite: { id: string; name: string; zone?: string | null }[];
  friendsLine: Pair;
  updates: { id: string; kind: string; kindLabel?: Pair; body: string }[];
  offline: { online: Pair; offline: Pair };
}

/** A zone's family shape on the site map: stages in the event's colour, the rest by what they are. */
const ZONE_FAMILY: Record<string, Family> = { food: 'cult', entry: 'free', medical: 'free', toilets: 'free', bar: 'live' };

export function LiveMode({ lang, ev }: { lang: Lang; ev: EventDetail }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [d, setD] = useState<Live | null>(null);
  const [stage, setStage] = useState(0);
  const [offline, setOffline] = useState(false);
  const [reminds, setReminds] = useState<Record<string, boolean>>({});
  const load = useCallback(async () => {
    const out = await FF.maybe(FF.get('/events/' + ev.id + '/live'), null);
    if (out) setD(out);
  }, [ev.id]);
  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    const on = () => setOffline(!navigator.onLine);
    on();
    addEventListener('online', on); addEventListener('offline', on);
    return () => { clearInterval(id); removeEventListener('online', on); removeEventListener('offline', on); };
  }, [load]);

  const fam = familyOf(ev.genre);
  const st = d?.stages[Math.min(stage, (d?.stages.length ?? 1) - 1)] ?? null;
  const now = st?.sets.find((x) => x.state === 'now') ?? null;
  const upcoming = (st?.sets ?? []).filter((x) => x.state === 'next' || x.state === 'later');
  const lead = now ?? upcoming[0] ?? null;
  const t = FF.now().getTime();
  const progress = now ? Math.max(0, Math.min(1, (t - Date.parse(now.startsAt)) / (Date.parse(now.endsAt) - Date.parse(now.startsAt)))) : 0;
  const left = now ? Math.max(0, Math.round((Date.parse(now.endsAt) - t) / 60_000)) : 0;
  const endTime = (iso: string) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: ev.timezone || undefined }).format(new Date(iso));

  const remind = async (s: Set) => {
    if (!kd.requireSignIn()) return;
    const on = !(reminds[s.setId] ?? s.reminded);
    setReminds((r) => ({ ...r, [s.setId]: on }));
    try {
      await (on ? FF.put('/me/plan/sets/' + s.setId, { remind: true }) : FF.del('/me/plan/sets/' + s.setId));
      if (on) kd.toast(fill(T.reminded, { n: s.artist }));
    } catch (e) {
      setReminds((r) => ({ ...r, [s.setId]: !on }));
      kd.toast(FF.errorText(e, lang));
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <AppBar className="gap-3 pr-1.5">
        <Status tone="live">{T.live}</Status>
        <span className="kd-hs kd-ell">{ev.title}</span>
        <a className="kd-ib ml-auto" href="/app/tickets" aria-label={T.exitLive}><XIcon size={22} aria-hidden="true" /></a>
      </AppBar>

      {d && d.stages.length > 1 ? (
        <div className="kd-hscroll px-4">
          <Segmented label={T.stages} value={String(stage)} onChange={(v) => setStage(Number(v))} options={d.stages.map((s, i) => ({ value: String(i), label: s.name[lang] }))} />
        </div>
      ) : null}

      {!d ? <div className="kd-skel mx-4 h-60" aria-hidden="true" /> : (
        <>
          <section className={cx('relative mx-4 h-60', g(fam))} aria-label={now ? fill(T.onNow, { s: st!.name[lang] }) : T.nothingLive}>
            <Art family={fam} cover={ev.coverUrl} className="absolute inset-0" />
            <div className="kd-glass absolute inset-x-2.5 bottom-2.5 flex flex-col gap-2.5 rounded-[10px] p-3.5">
              <div className="flex flex-col gap-1">
                <span className="kd-m text-mist">{lead ? fill(now ? T.onNow : T.upNext, { s: st!.name[lang] }) : T.nothingLive}</span>
                {lead ? <span className="kd-d3">{lead.artist}</span> : null}
              </div>
              {now ? (
                <>
                  <div className="h-1 overflow-hidden rounded bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={fill(T.minLeft, { n: left })}>
                    <div className="h-full rounded bg-paper" style={{ width: `${progress * 100}%` }} />
                  </div>
                  <div className="kd-m kd-num flex justify-between text-mist"><span>{now.time}</span><span>{fill(T.minLeft, { n: left })}</span><span>{endTime(now.endsAt)}</span></div>
                </>
              ) : lead ? <span className="kd-m kd-num text-mist">{fill(T.startsAt, { t: lead.time })}</span> : null}
            </div>
          </section>

          {upcoming.length ? (
            <section className="flex flex-col px-4" aria-labelledby="live-next">
              <h2 id="live-next" className="kd-m pb-1.5">{T.nextList}</h2>
              {upcoming.filter((x) => x !== now).map((s) => {
                const on = reminds[s.setId] ?? s.reminded;
                return (
                  <div key={s.setId} className={cx('grid min-h-15 grid-cols-[56px_minmax(0,1fr)_44px] items-center gap-2.5 border-b border-line', g(fam))}>
                    <span className="kd-mb kd-num text-[15px]">{s.time}</span>
                    <span className="flex min-w-0 flex-col gap-0.5"><span className="kd-hs kd-ell">{s.artist}</span><span className="kd-s flex items-center gap-1.5"><span className="kd-mk" aria-hidden="true" />{st!.name[lang]}</span></span>
                    <button type="button" className={cx('kd-ib', on && 'text-acc')} aria-pressed={on} aria-label={fill(T.remindMe, { n: s.artist })} onClick={() => remind(s)}>
                      {on ? <BellRingingIcon size={20} weight="fill" aria-hidden="true" /> : <BellIcon size={20} aria-hidden="true" />}
                    </button>
                  </div>
                );
              })}
            </section>
          ) : null}

          {d.zones.length ? (
            <section className="kd-card relative mx-4 h-44 overflow-hidden" aria-label={T.siteMap}>
              {d.zones.map((z) => {
                const zf = z.kind === 'stage' ? fam : ZONE_FAMILY[z.kind] ?? 'free';
                return (
                  <span key={z.id} className={cx('absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1', g(zf))} style={{ left: z.x + '%', top: z.y + '%' }}>
                    <span className="kd-mk h-5 w-5" aria-hidden="true" />
                    <span className="kd-m whitespace-nowrap text-mist">{z.label}</span>
                  </span>
                );
              })}
            </section>
          ) : null}

          {d.friendsOnSite.length ? (
            <section className="flex flex-col px-4" aria-labelledby="live-friends">
              <h2 id="live-friends" className="kd-m pb-1.5">{T.friendsInside}</h2>
              <span className="kd-s">{d.friendsLine[lang]}</span>
            </section>
          ) : null}

          {d.updates.length ? (
            <section className="flex flex-col px-4" aria-labelledby="live-upd">
              <h2 id="live-upd" className="kd-m pb-1.5">{T.fromOrg}</h2>
              {d.updates.map((u) => <p key={u.id} className="kd-t border-t border-line py-3 text-paper">{u.body}</p>)}
            </section>
          ) : null}

          <Panel className="mx-4 p-3.5"><span className="kd-s">{offline ? d.offline.offline[lang] : d.offline.online[lang]}</span></Panel>
        </>
      )}
    </div>
  );
}
