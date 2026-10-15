'use client';
/**
 * /app/recap/<slug> in Kính đêm: after the night, for someone who went. Their night (when
 * they got in, sets caught, friends there), a star rating and what stood out, up to three
 * photos (uploaded to the file storage), and the organiser's next event. The organiser sees
 * the average, never the name.
 */
import { useEffect, useState, type ChangeEvent } from 'react';
import { ImageIcon, StarIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { dayMonth, weekdayShort } from '../format';
import { familyOf, g } from '../genre';
import { useKd } from '../runtime';
import { Button, Chip } from '../ui/actions';
import { FieldError } from '../ui/forms';
import { Art, Card as Panel, Stat } from '../ui/parts';
import { AppBar } from '../ui/shell';
import type { EventDetail } from '../types';
import { APP } from './copy';
import { SignInCard } from './row';

type Aspect = 'sound' | 'crowd' | 'value' | 'org' | 'queue' | 'food';
interface Recap {
  aspects: Aspect[];
  stats: { checkedInAt: string | null; setsSeen: number; friendsThere: number };
  next: { slug: string; title: string; startsOn: string; label: Pair } | null;
  submitted: { stars: number; aspects: Aspect[]; photoUrls: string[] } | null;
}

export function RecapScreen({ lang, ev }: { lang: Lang; ev: EventDetail }) {
  const T = pick(APP, lang);
  const kd = useKd();
  return (
    <>
      <AppBar>
        <a className="kd-ib -ml-2" href="/app/profile" aria-label={T.back}><XIcon size={22} aria-hidden="true" /></a>
        <span className="kd-hs kd-ell ml-1">{ev.title}</span>
      </AppBar>
      {kd.session === undefined ? <div className="kd-skel mx-4 h-60" aria-hidden="true" /> : kd.user ? <RecapForm lang={lang} ev={ev} /> : <SignInCard lang={lang} note={T.gateMe} />}
    </>
  );
}

function RecapForm({ lang, ev }: { lang: Lang; ev: EventDetail }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [r, setR] = useState<Recap | null>(null);
  const [stars, setStars] = useState(0);
  const [picked, setPicked] = useState<Aspect[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    FF.maybe(FF.get('/events/' + ev.id + '/recap'), null).then((out: Recap | null) => {
      setR(out);
      if (out?.submitted) { setStars(out.submitted.stars); setPicked(out.submitted.aspects); setPhotos(out.submitted.photoUrls); }
    });
  }, [ev.id]);
  const label: Record<Aspect, string> = { sound: T.aspSound, crowd: T.aspCrowd, value: T.aspValue, org: T.aspOrg, queue: T.aspQueue, food: T.aspFood };

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || photos.length >= 3) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const out = await FF.api('POST', '/uploads?purpose=recap', form);
      setPhotos((xs) => [...xs, out.url].slice(0, 3));
    } catch (x) { kd.toast(FF.errorText(x, lang)); }
  };
  const submit = async () => {
    if (!stars) { setErr(T.needStars); return; }
    setBusy(true); setErr('');
    try {
      const out = await FF.post('/events/' + ev.id + '/recaps', { stars, aspects: picked, photoUrls: photos });
      kd.toast(FF.text(out.message, lang));
    } catch (x) { setErr(FF.errorText(x, lang)); }
    setBusy(false);
  };

  if (!r) return <div className="kd-skel mx-4 h-60" aria-hidden="true" />;
  const fam = familyOf(ev.genre);
  const at = r.stats.checkedInAt ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: ev.timezone || undefined }).format(new Date(r.stats.checkedInAt)) : '–';
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 pt-1">
      <div className="flex flex-col gap-2">
        <h1 className="kd-d2">{T.recapTitle}</h1>
        <p className="kd-s">{T.recapSub}</p>
      </div>
      <section aria-label={T.yourNight} className={cx('grid grid-cols-3 border-y border-line py-3.5', g(fam))}>
        <Stat value={at} label={T.checkedInAt} />
        <Stat value={r.stats.setsSeen} label={T.setsSeen} />
        <Stat value={r.stats.friendsThere} label={T.friendsThere} />
      </section>

      <div className="flex flex-col gap-2.5">
        <span className="kd-hs" id="recap-stars">{T.howWasIt}</span>
        <div role="radiogroup" aria-labelledby="recap-stars" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={fill(T.stars, { n })} onClick={() => { setStars(n); setErr(''); }} className={cx('kd-ib', n <= stars ? 'text-acc' : 'text-fog')}>
              <StarIcon size={28} weight={n <= stars ? 'fill' : 'regular'} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5" role="group" aria-label={T.standout}>
        <span className="kd-hs">{T.standout}</span>
        <div className="flex flex-wrap gap-2">
          {r.aspects.map((a) => <Chip key={a} on={picked.includes(a)} onClick={() => setPicked((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]))}>{label[a]}</Chip>)}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="kd-hs">{T.yourPhotos}</span>
        <div className="grid grid-cols-3 gap-1.5 desk:max-w-[720px]">
          {photos.map((u) => (
            <div key={u} className="kd-mtile relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- uploads come from the API's file storage */}
              <img src={u} alt="" />
              <button type="button" className="kd-ib kd-ib-sm kd-glass absolute right-1 top-1 text-paper" aria-label={T.removePhoto} onClick={() => setPhotos((xs) => xs.filter((x) => x !== u))}><XIcon size={14} aria-hidden="true" /></button>
            </div>
          ))}
          {photos.length < 3 ? (
            <label className="kd-mplus cursor-pointer">
              <ImageIcon size={20} aria-hidden="true" /><span className="kd-m">{T.addPhoto}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={upload} />
            </label>
          ) : null}
        </div>
      </div>

      {err ? <FieldError>{err}</FieldError> : null}
      <Button tone="acc" size="lg" block onClick={submit} disabled={busy}>{T.postRating}</Button>

      {r.next ? (
        <a href={'/app/e/' + r.next.slug} className="flex flex-col gap-2">
          <span className="kd-m">{r.next.label[lang]}</span>
          <Panel className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3 p-2">
            <Art family={fam} className="h-14 rounded-lg" />
            <span className="flex min-w-0 flex-col"><span className="kd-hs kd-ell">{r.next.title}</span><span className="kd-s kd-num">{weekdayShort(r.next.startsOn, lang)} {dayMonth(r.next.startsOn, lang)}</span></span>
          </Panel>
        </a>
      ) : null}
    </div>
  );
}
