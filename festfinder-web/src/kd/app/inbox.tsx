'use client';
/**
 * The app's message screens in Kính đêm: /app/notifications (each opens what it is about),
 * /app/alerts (Smart Alerts: cities, music styles, genres, artists and a price ceiling; only
 * events matching all of it reach you) and /app/settings (one row per kind of update, one
 * column per channel; push asks the browser first).
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeftIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { enablePush } from '@/runtime/pwa';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { money } from '../format';
import { useKd } from '../runtime';
import { Button, Chip } from '../ui/actions';
import { Input, Switch } from '../ui/forms';
import { Card as Panel } from '../ui/parts';
import { AppBar } from '../ui/shell';
import { APP } from './copy';
import { ago } from '../web/event/community';
import { SignInCard } from './row';

function Head({ lang, title, back = '/app/profile', aside }: { lang: Lang; title: string; back?: string; aside?: React.ReactNode }) {
  const T = pick(APP, lang);
  return (
    <AppBar className="pr-1.5">
      <a className="kd-ib -ml-2" href={back} aria-label={T.back}><ArrowLeftIcon size={22} aria-hidden="true" /></a>
      <h1 className="kd-h ml-1">{title}</h1>
      {aside ? <span className="ml-auto">{aside}</span> : null}
    </AppBar>
  );
}

function Gate({ lang, note, children }: { lang: Lang; note: string; children: React.ReactNode }) {
  const kd = useKd();
  if (kd.session === undefined) return <div className="kd-skel mx-4 h-40" aria-hidden="true" />;
  return kd.user ? <>{children}</> : <SignInCard lang={lang} note={note} />;
}

// ---- notifications ------------------------------------------------------------------------

interface Note { id: string; kind: string; title: Pair; body: Pair | null; link: { screen?: string; eventId?: string; friendId?: string } | null; unread: boolean; createdAt: string }

/** Where a notification's link leads in the app. */
function hrefOf(n: Note): string {
  const l = n.link ?? {};
  if (l.eventId) {
    if (l.screen === 'live') return '/app/live/' + l.eventId;
    if (l.screen === 'recap') return '/app/recap/' + l.eventId;
    if (l.screen === 'plan') return '/app/plan/' + l.eventId;
    return '/app/e/' + l.eventId;
  }
  if (l.screen === 'tickets') return '/app/tickets';
  if (l.screen === 'chat' && l.friendId) return '/app/chat/' + l.friendId;
  return '/app';
}

export function Notifications({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const [items, setItems] = useState<Note[] | null>(null);
  const kd = useKd();
  useEffect(() => {
    if (!kd.user) return;
    FF.maybe(FF.get('/me/notifications?limit=50'), { items: [] }).then((out: { items: Note[] }) => setItems(out.items));
  }, [kd.user]);
  const readAll = () => {
    setItems((xs) => xs && xs.map((n) => ({ ...n, unread: false })));
    FF.fire(FF.post('/me/notifications/read-all'));
  };
  const open = (n: Note) => { if (n.unread) FF.fire(FF.post('/me/notifications/' + n.id + '/read')); };
  return (
    <>
      <Head lang={lang} title={T.notifTitle} back="/app" aside={items?.some((n) => n.unread) ? <Button size="sm" tone="ghost" onClick={readAll}>{T.readAll}</Button> : null} />
      <Gate lang={lang} note={T.gateNotif}>
        {!items ? <div className="kd-skel mx-4 h-40" aria-hidden="true" /> : items.length ? (
          <ul className="flex flex-col px-4">
            {items.map((n) => (
              <li key={n.id}>
                <a className="kd-lrow min-h-17 items-start py-3" href={hrefOf(n)} onClick={() => open(n)}>
                  <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.unread ? 'bg-acc' : 'bg-transparent')} aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cx('kd-hs', !n.unread && 'text-mist')}>{n.title[lang]}</span>
                    {n.body ? <span className="kd-s">{n.body[lang]}</span> : null}
                  </span>
                  <span className="kd-m kd-num shrink-0">{ago(n.createdAt, lang)}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : <Panel className="m-4 p-6"><span className="kd-h">{T.notifEmpty}</span></Panel>}
      </Gate>
    </>
  );
}

// ---- Smart Alerts -------------------------------------------------------------------------

interface Alert { enabled: boolean; genres: string[]; artists: string[]; organizerIds: string[]; areas: string[]; cities: string[]; styles: string[]; priceCap: number | null; matches: number }
interface Discovery { cities: { slug: string; name: Pair }[]; styles: { key: string; label: Pair; genre: string | null }[]; genres: string[] }

const CAPS = [null, 0, 300_000, 500_000, 1_000_000, 2_000_000];

export function Alerts({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  return (
    <>
      <Head lang={lang} title={T.alertTitle} />
      <Gate lang={lang} note={T.gateMe}><AlertForm lang={lang} /></Gate>
    </>
  );
}

function AlertForm({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [a, setA] = useState<Alert | null>(null);
  const [meta, setMeta] = useState<Discovery | null>(null);
  const [artist, setArtist] = useState('');
  useEffect(() => {
    FF.maybe(FF.get('/me/alert'), null).then(setA);
    FF.once('kd:discovery', () => FF.maybe(FF.get('/meta/discovery'), null)).then(setMeta);
  }, []);
  // Every change is saved as it is made.
  const save = async (next: Alert) => {
    setA(next);
    try {
      const out = await FF.put('/me/alert', {
        enabled: next.enabled, genres: next.genres, artists: next.artists, organizerIds: next.organizerIds,
        areas: next.areas, cities: next.cities, styles: next.styles, priceCap: next.priceCap,
      });
      setA((cur) => cur && { ...cur, matches: out.matches ?? cur.matches });
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const toggle = (key: 'cities' | 'styles' | 'genres', v: string) => {
    if (!a) return;
    const xs = a[key];
    save({ ...a, [key]: xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v] });
  };
  const styles = useMemo(() => (meta?.styles ?? []).slice(0, 24), [meta]);
  const addArtist = (e: FormEvent) => {
    e.preventDefault();
    const v = artist.trim();
    if (!a || !v || a.artists.includes(v)) return;
    setArtist('');
    save({ ...a, artists: [...a.artists, v] });
  };
  if (!a || !meta) return <div className="kd-skel mx-4 h-60" aria-hidden="true" />;
  const capLabel = (c: number | null) => (c === null ? T.alertAny : c === 0 ? T.alertFreeOnly : money(c, 'VND', lang));
  return (
    <div className="flex flex-col gap-6 px-4 pb-8">
      <div className="flex items-center gap-4 border-b border-line pb-4">
        <span className="flex flex-1 flex-col gap-0.5"><span className="kd-hs">{T.alertOn}</span><span className="kd-s">{T.alertSub}</span></span>
        <Switch checked={a.enabled} onChange={(on) => save({ ...a, enabled: on })} label={T.alertOn} />
      </div>
      <span className="kd-m kd-num" role="status">{fill(T.alertMatches, { n: a.matches })}</span>
      <Group label={T.alertCities}>
        {meta.cities.map((c) => <Chip key={c.slug} on={a.cities.includes(c.slug)} onClick={() => toggle('cities', c.slug)}>{c.name[lang]}</Chip>)}
      </Group>
      <Group label={T.alertStyles}>
        {styles.map((s) => <Chip key={s.key} on={a.styles.includes(s.key)} onClick={() => toggle('styles', s.key)}>{s.label[lang]}</Chip>)}
      </Group>
      <Group label={T.alertGenres}>
        {meta.genres.map((g) => <Chip key={g} on={a.genres.includes(g)} onClick={() => toggle('genres', g)}>{g}</Chip>)}
      </Group>
      <Group label={T.alertArtists}>
        {a.artists.map((n) => (
          <Chip key={n} on onClick={() => save({ ...a, artists: a.artists.filter((x) => x !== n) })} aria-label={fill(T.removeX, { n })}>{n}<XIcon size={12} aria-hidden="true" /></Chip>
        ))}
        <form onSubmit={addArtist} className="flex w-full gap-2 pt-1">
          <Input aria-label={T.addArtist} placeholder={T.addArtist} value={artist} onChange={(e) => setArtist(e.target.value)} boxClass="flex-1" maxLength={100} />
          <Button type="submit">+</Button>
        </form>
      </Group>
      <Group label={T.alertPrice}>
        {CAPS.map((c) => <Chip key={String(c)} on={a.priceCap === c} onClick={() => save({ ...a, priceCap: c })}>{capLabel(c)}</Chip>)}
      </Group>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5" role="group" aria-label={label}>
      <span className="kd-hs">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// ---- notification settings ----------------------------------------------------------------

type Channel = 'push' | 'zalo' | 'email';
interface Prefs { matrix: Record<string, Record<Channel, boolean>>; quietHours: { rule: Pair } }

export function NotifSettings({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  return (
    <>
      <Head lang={lang} title={T.notifTitle} />
      <Gate lang={lang} note={T.gateMe}><PrefsMatrix lang={lang} /></Gate>
    </>
  );
}

function PrefsMatrix({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [p, setP] = useState<Prefs | null>(null);
  useEffect(() => { FF.maybe(FF.get('/me/notification-preferences'), null).then(setP); }, []);
  const rows: [string, string][] = [['saved', T.nrSaved], ['tickets', T.nrTickets], ['sets', T.nrSets], ['artists', T.nrArtists], ['orgs', T.nrOrgs], ['friends', T.nrFriends], ['weekly', T.nrWeekly]];
  const cols: [Channel, string][] = [['push', T.chPush], ['zalo', T.chZalo], ['email', T.chEmail]];
  const set = async (topic: string, ch: Channel, on: boolean) => {
    if (!p) return;
    // Push needs the browser's permission, asked inside the tap.
    if (ch === 'push' && on) {
      const r = await enablePush();
      if (r === 'denied') kd.toast(T.pushDenied);
      else if (r === 'unsupported') kd.toast(T.pushOff);
    }
    const prev = p;
    setP({ ...p, matrix: { ...p.matrix, [topic]: { ...p.matrix[topic], [ch]: on } } });
    try { await FF.put('/me/notification-preferences', { matrix: { [topic]: { [ch]: on } } }); } catch (e) { setP(prev); kd.toast(FF.errorText(e, lang)); }
  };
  if (!p) return <div className="kd-skel mx-4 h-60" aria-hidden="true" />;
  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <div role="table" aria-label={T.notifTitle} className="flex flex-col">
        <div role="row" className="grid grid-cols-[minmax(0,1fr)_repeat(3,52px)] items-center gap-1 border-b border-line pb-2">
          <span role="columnheader" />
          {cols.map(([c, l]) => <span key={c} role="columnheader" className="kd-m text-center">{l}</span>)}
        </div>
        {rows.map(([topic, label]) => (
          <div key={topic} role="row" className="grid min-h-14 grid-cols-[minmax(0,1fr)_repeat(3,52px)] items-center gap-1 border-b border-line">
            <span role="rowheader" className="kd-s text-paper">{label}</span>
            {cols.map(([c, l]) => (
              <span key={c} role="cell" className="flex justify-center">
                <Switch checked={!!p.matrix[topic]?.[c]} onChange={(on) => set(topic, c, on)} label={`${label} · ${l}`} />
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="kd-s">{p.quietHours.rule[lang]}</p>
    </div>
  );
}
