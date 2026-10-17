'use client';
/**
 * The parts of a fan's own profile that /profile (web/fan/page.tsx) draws: the raver passport (a
 * stamp per scanned ticket, filtered by family) and Wrapped, and the sheet that edits who you are.
 * The app's own profile screen went with design v2 phase 4: /app/profile leads to /profile.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { dayMonth } from '../format';
import { CHART_ORDER, FAMILY_LABEL, familyOf, g, type Family } from '../genre';
import { inLang } from '../link';
import { useKd } from '../runtime';
import { Button, Chip } from '../ui/actions';
import { FieldError, FieldLabel, Input } from '../ui/forms';
import { Stamp } from '../ui/parts';
import { ImageLinkField } from '../ui/image-link';
import { Sheet } from '../ui/sheet';
import { APP } from './copy';

export interface Me { user: { id: string; name: string | null; email: string | null; phone: string | null; city: string | null; photoUrl: string | null; locale: 'vi' | 'en' } }
export interface Passport { stats: { nights: number; events: number; styles: number; venues: number; cities: number }; stamps: { eventId: string; slug: string; title: string; genre: string | null; date: string; venue: string | null }[] }
export type { Follows } from '../ui/follows';
export interface Order { id: string; status: string; event: { slug: string; title: string; startsOn: string; startTime: string | null; venueName: string | null; area: string | null; genre: string | null; endsAt: string | null }; tickets: unknown[] }

export function PassportSection({ lang, pp, year, onWrapped, flush, appLinks = true }: { lang: Lang; pp: Passport; year: number; onWrapped: () => void; flush?: boolean; appLinks?: boolean }) {
  const T = pick(APP, lang);
  const [only, setOnly] = useState<Family | null>(null);
  const [all, setAll] = useState(false);
  const mix = useMemo(() => {
    const n = new Map<Family, number>();
    for (const s of pp.stamps) { const f = familyOf(s.genre); if (f !== 'free') n.set(f, (n.get(f) ?? 0) + 1); }
    return CHART_ORDER.filter((f) => n.get(f)).map((f) => ({ f, n: n.get(f)! }));
  }, [pp.stamps]);
  const shown = all ? pp.stamps : pp.stamps.slice(0, 8);
  return (
    <>
      <section className={cx('@container flex flex-col gap-3 pt-8', !flush && 'px-4')} aria-labelledby="pf-pass">
        <div className="flex items-baseline justify-between"><h2 id="pf-pass" className="kd-h">{T.passport}</h2><span className="kd-m kd-num">{fill(T.stamps, { n: pp.stamps.length })}</span></div>
        <span className="kd-s">{fill(T.passportLine, { n: pp.stats.nights, g: pp.stats.styles, c: pp.stats.cities })}</span>
        {pp.stamps.length ? (
          <>
            {mix.length > 1 ? <div className="kd-hscroll" role="group" aria-label={T.genres}>
              {mix.map(({ f }) => <Chip key={f} family={f} on={only === f} onClick={() => setOnly(only === f ? null : f)}>{FAMILY_LABEL[f][lang]}</Chip>)}
            </div> : null}
            <ul className="mt-1 grid grid-cols-4 gap-x-2 @2xl:grid-cols-8 gap-y-3.5">
              {shown.map((s) => (
                <li key={s.eventId}>
                  <Stamp family={familyOf(s.genre)} date={dayMonth(s.date, lang)} name={s.title} dim={!!only && familyOf(s.genre) !== only} href={appLinks ? '/e/' + s.slug : inLang('/e/' + s.slug, lang)} />
                </li>
              ))}
            </ul>
            {pp.stamps.length > 8 ? <button type="button" className="kd-more" onClick={() => setAll(!all)} aria-expanded={all}>{all ? T.showLess : fill(T.seeAll, { n: pp.stamps.length - 8 })}</button> : null}
          </>
        ) : <p className="kd-s">{T.noStamps}</p>}
        <Button size="sm" className="self-start" onClick={onWrapped}>{fill(T.wrapped, { y: year })}</Button>
      </section>

      {mix.length ? (
        <section className={cx('flex flex-col gap-3.5 pt-8', !flush && 'px-4')} aria-labelledby="pf-sound">
          <div className="flex items-baseline justify-between"><h2 id="pf-sound" className="kd-h">{T.yourSound}</h2><span className="kd-m">{T.byNights}</span></div>
          <div className="flex h-3 gap-0.5" role="img" aria-label={mix.map((x) => `${FAMILY_LABEL[x.f][lang]} ${x.n}`).join(', ')}>
            {mix.map((x, i) => <i key={x.f} className={cx(g(x.f), 'bg-[var(--g)]', i === 0 && 'rounded-l', i === mix.length - 1 && 'rounded-r')} style={{ flex: `${x.n} 1 0` }} />)}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {mix.map((x) => (
              <span key={x.f} className={cx('kd-s flex items-center gap-2 text-fg-2', g(x.f))}><span className="kd-mk" aria-hidden="true" />{FAMILY_LABEL[x.f][lang]}<span className="kd-mb kd-num ml-auto">{x.n}</span></span>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function EditSheet({ lang, me, onClose, onSaved }: { lang: Lang; me: Me['user']; onClose: () => void; onSaved: (n: { name: string; city: string | null; photoUrl: string | null }) => void }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [name, setName] = useState(me.name ?? '');
  const [city, setCity] = useState(me.city ?? '');
  const [photo, setPhoto] = useState<string | null>(me.photoUrl);
  const [err, setErr] = useState('');
  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await FF.patch('/me', { name: name.trim(), city: city.trim(), ...(photo !== me.photoUrl ? { photoUrl: photo } : {}) });
      kd.toast(T.saved2);
      onSaved({ name: name.trim(), city: city.trim() || null, photoUrl: photo });
      void kd.refresh();
    } catch (x) { setErr(FF.errorText(x, lang)); }
  };
  return (
    <Sheet title={T.editTitle} closeLabel={T.close} onClose={onClose}>
      <form className="flex flex-col gap-3 pt-1" onSubmit={save}>
        <div className="flex flex-col gap-1.5"><FieldLabel htmlFor="pf-name">{T.name}</FieldLabel><Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></div>
        <div className="flex flex-col gap-1.5"><FieldLabel htmlFor="pf-city2">{T.city}</FieldLabel><Input id="pf-city2" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} /></div>
        <ImageLinkField lang={lang} purpose="avatar" label={T.photo} hint={T.photoLinkHint} value={photo} onChange={setPhoto} />
        {err ? <FieldError>{err}</FieldError> : null}
        <Button type="submit" tone="acc" block>{T.save}</Button>
      </form>
    </Sheet>
  );
}

interface Wrapped {
  year: number; empty: boolean; nights: number; events: number; topStyle: { style: string; label: { vi: string; en: string } | null; nights: number } | null; topArtist: { name: string; times: number } | null;
  topVenue: { name: string; times: number } | null; posts: number; helpful: number; brought: number; passedOn: number; cities: { vi: string; en: string }[];
}

export function WrappedSheet({ lang, year, onClose }: { lang: Lang; year: number; onClose: () => void }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [w, setW] = useState<Wrapped | null>(null);
  useEffect(() => { FF.maybe(FF.get('/me/wrapped?year=' + year), null).then(setW); }, [year]);
  const share = async () => {
    if (!w) return;
    const how = await FF.shareStory({
      genre: 'EDM', kicker: fill(T.wrapped, { y: w.year }), title: `${w.nights} ${T.wrNights}`,
      lines: [w.topStyle ? `${T.wrGenre}: ${w.topStyle.label?.[lang] ?? w.topStyle.style}` : '', w.topArtist ? `${T.wrArtist}: ${w.topArtist.name}` : '', w.topVenue ? `${T.wrVenue}: ${w.topVenue.name}` : ''].filter(Boolean),
      url: location.host,
    }, 'wrapped-' + w.year).catch((e: unknown) => { kd.toast(FF.errorText(e, lang)); return null; });
    if (how === 'saved') kd.toast(T.storySaved);
  };
  return (
    <Sheet title={fill(T.wrapped, { y: year })} closeLabel={T.close} onClose={onClose}>
      {!w ? <div className="kd-skel h-40" aria-hidden="true" /> : w.empty ? <p className="kd-t">{fill(T.wrEmpty, { y: year })}</p> : (
        <div className={cx('flex flex-col gap-4 pt-1', g('edm'))}>
          <div className="flex items-baseline gap-2"><span className="kd-d1 kd-num">{w.nights}</span><span className="kd-t">{T.wrNights}</span></div>
          <dl className="flex flex-col">
            {w.topStyle ? <Row k={T.wrGenre} v={w.topStyle.label?.[lang] ?? w.topStyle.style} /> : null}
            {w.topArtist ? <Row k={T.wrArtist} v={`${w.topArtist.name} · ${fill(T.wrTimes, { n: w.topArtist.times })}`} /> : null}
            {w.topVenue ? <Row k={T.wrVenue} v={`${w.topVenue.name} · ${fill(T.wrTimes, { n: w.topVenue.times })}`} /> : null}
          </dl>
          <div className="flex flex-col gap-1">
            <span className="kd-m">{T.wrGave}</span>
            <span className="kd-s">{[`${w.posts} ${T.wrPosts}`, `${w.helpful} ${T.wrHelpful}`, `${w.brought} ${T.wrBrought}`, `${w.passedOn} ${T.wrPassed}`].join(' · ')}</span>
          </div>
          <Button tone="acc" block onClick={share}>{T.wrShare}</Button>
        </div>
      )}
    </Sheet>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="kd-lrow min-h-11"><dt className="kd-s flex-1">{k}</dt><dd className="kd-hs text-right">{v}</dd></div>;
}
