'use client';
/**
 * The installed app's first run (design v2 phase 4): the app opens on the home page
 * (/?source=app, the web manifest's start). A device seen for the first time, nobody signed in, is
 * asked two things in a sheet, then sees the list of its city (and of its style when it liked one):
 * 1. its city: where it is (the position stays on the device) or one from the list;
 * 2. the styles it likes, or none.
 * Kept on the device (app/place.ts), as the app's onboarding did. The site in a browser asks nothing.
 */
import { useState } from 'react';
import { MapPinIcon } from '@phosphor-icons/react/ssr';
import { fill, pick, type Lang } from '../../copy';
import { styleLabel } from '../../genre';
import { useKd } from '../../runtime';
import { Button, Chip } from '../../ui/actions';
import { Sheet } from '../../ui/sheet';
import { nearestCity, place } from '../../app/place';
import { LIST } from './copy';

/** The main EDM styles offered (as the app's onboarding did). */
const LIKE_STYLES = ['techno', 'house', 'trance', 'psytrance', 'drum-and-bass', 'hardstyle', 'dubstep', 'bass'];

interface City { slug: string; name: { vi: string; en: string }; center: [number, number] | null }

/** Whether the list was opened by the installed app: its start address, or a standalone window. */
export function fromApp(): boolean {
  if (new URLSearchParams(location.search).get('source') === 'app') return true;
  try { return matchMedia('(display-mode: standalone)').matches; } catch { return false; }
}

export function FirstRun({ lang, cities, onDone }: { lang: Lang; cities: City[]; onDone: (city: string | null, styles: string[]) => void }) {
  const T = pick(LIST, lang);
  const kd = useKd();
  const [city, setCity] = useState<string | null>(null);
  const [likes, setLikes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const finish = (c: string | null, l: string[]) => {
    if (c) place.setCity(c);
    place.setLikes(l);
    onDone(c, l);
  };
  const locate = () => {
    if (!navigator.geolocation) { kd.toast(T.obNoLocation); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const at = { lat: p.coords.latitude, lng: p.coords.longitude };
        place.setAt(at);
        setBusy(false);
        setCity(nearestCity(cities, at)?.slug ?? null);
      },
      () => { setBusy(false); kd.toast(T.obNoLocation); },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };
  const step = city ? 2 : 1;
  return (
    <Sheet title={step === 1 ? T.obCity : T.obStyles} closeLabel={T.obSkip} onClose={() => finish(city, likes)}>
      <div className="flex flex-col gap-4 pt-1">
        <span className="kd-m">{fill(T.obStep, { n: step })}</span>
        {step === 1 ? (
          <>
            <Button size="lg" block onClick={locate} disabled={busy}><MapPinIcon size={18} aria-hidden="true" />{T.obLocate}</Button>
            <div className="flex flex-wrap gap-2" role="group" aria-label={T.cities}>
              {cities.map((c) => <Chip key={c.slug} on={false} onClick={() => setCity(c.slug)}>{c.name[lang]}</Chip>)}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label={T.obStyles}>
              {LIKE_STYLES.map((k) => (
                <Chip key={k} on={likes.includes(k)} onClick={() => setLikes((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]))}>{styleLabel(k, lang)}</Chip>
              ))}
            </div>
            <Button tone="acc" size="lg" block onClick={() => finish(city, likes)}>{T.done}</Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
