'use client';
/**
 * "Đặt xe" on an event page: Grab, Be and Green SM, the ride apps of the event's country
 * (festfinder-backend lib/rides.ts). On a phone a tap copies the venue's address (for the
 * destination field), counts the press, and opens the app: by its package on Android (the Play
 * Store page when it is missing), by its universal link or its scheme on an iPhone (the App Store
 * when nothing opened). The app chosen is remembered on the phone: the next tap opens it at once,
 * with "Đổi app" in the toast; a city with one ride app opens it at once too. On a computer the
 * sheet shows a QR code that opens this sheet on the phone (?ride=1).
 */
import { useEffect, useState } from 'react';
import { CaretRightIcon, CarProfileIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { useKd } from '../../runtime';
import { Button, buttonClass } from '../../ui/actions';
import { QrCode } from '../../ui/qr';
import { Sheet } from '../../ui/sheet';
import type { RideOption } from '../../types';
import { RIDE } from './copy';
import { useEvent } from './context';

type Device = 'android' | 'ios' | 'desktop';

function deviceOf(): Device {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  // iPadOS asks for the desktop site but still has a touch screen.
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

/** In-app browsers (Zalo, Facebook, Messenger, Instagram, TikTok) often refuse to open another app. */
const inAppBrowser = () => /Zalo|FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|TikTok|musical_ly|BytedanceWebview/i.test(navigator.userAgent);

/** The ride app this phone chose last (kept in the browser only). */
const PREF = 'ff:ride-app';
const readPref = () => { try { return localStorage.getItem(PREF); } catch { return null; } };
const savePref = (key: string) => { try { localStorage.setItem(PREF, key); } catch { /* private mode: asked again next time */ } };

/** Copies the address, counts the press and opens the app. */
async function launch(r: RideOption, eventId: string, device: Device) {
  try { await navigator.clipboard.writeText(r.copyText); } catch { /* the toast still says where to go */ }
  savePref(r.key);
  // Counted for the organiser (one per person every half hour), and in product analytics.
  FF.fire(FF.post('/events/' + eventId + '/track', { type: 'ride_click' }));
  FF.track('ride_click', { kind: r.key, surface: location.pathname.startsWith('/app') ? 'app_event' : 'web_event' });
  if (device === 'android') { location.href = r.android; return; }
  // A universal link opens the app, or its store page, with no error page in between.
  if (r.ios.universal) { location.href = r.ios.universal; return; }
  location.href = r.ios.app;
  // Nothing opened (the app is not installed): its App Store page instead.
  setTimeout(() => { if (document.visibilityState === 'visible') location.href = r.ios.store; }, 1400);
}

/**
 * The button, and the sheet it opens. `row` draws it as one of the event's info rows (the app
 * screen). `fromLink` marks the one button of the page that opens itself on ?ride=1.
 */
export function RideButton({ lang, row, fromLink, size = 'sm', tone = 'ghost', className }: {
  lang: Lang; row?: boolean; fromLink?: boolean; size?: 'sm' | 'md'; tone?: 'ghost' | 'default'; className?: string;
}) {
  const T = pick(RIDE, lang);
  const kd = useKd();
  const { ev } = useEvent();
  const [open, setOpen] = useState(false);
  const rides = ev.rides ?? [];
  // A QR code from the computer opens the sheet on the phone.
  useEffect(() => {
    if (fromLink && rides.length && new URLSearchParams(location.search).get('ride') === '1') setOpen(true);
  }, [fromLink, rides.length]);
  if (!rides.length) return null;
  const tap = () => {
    const device = deviceOf();
    const chosen = rides.find((r) => r.key === readPref()) ?? (rides.length === 1 ? rides[0] : null);
    // The app chosen before (or the only one) opens at once; the toast offers another.
    if (device !== 'desktop' && chosen && !inAppBrowser()) {
      kd.toast(fill(T.opening, { a: chosen.name }), rides.length > 1 ? { label: T.change, run: () => setOpen(true) } : undefined);
      void launch(chosen, ev.id, device);
      return;
    }
    setOpen(true);
  };
  return (
    <>
      {row ? (
        <button type="button" className="kd-lrow min-h-13 w-full text-left" onClick={tap}>
          <CarProfileIcon size={18} className="text-fg-3" aria-hidden="true" />
          <span className="kd-t flex-1 text-fg-1">{T.title}</span>
          <CaretRightIcon size={16} className="text-fg-3" aria-hidden="true" />
        </button>
      ) : (
        <button type="button" className={buttonClass({ tone, size }, className)} onClick={tap}>
          <CarProfileIcon size={16} aria-hidden="true" />{T.button}
        </button>
      )}
      {open ? <RideSheet lang={lang} rides={rides} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function RideSheet({ lang, rides, onClose }: { lang: Lang; rides: RideOption[]; onClose: () => void }) {
  const T = pick(RIDE, lang);
  const kd = useKd();
  const { ev } = useEvent();
  const [device, setDevice] = useState<Device | null>(null);
  const [inApp, setInApp] = useState(false);
  const [pref, setPref] = useState<string | null>(null);
  useEffect(() => { setDevice(deviceOf()); setInApp(inAppBrowser()); setPref(readPref()); }, []);
  // The app chosen last comes first.
  const ordered = [...rides].sort((a, b) => Number(b.key === pref) - Number(a.key === pref));

  const go = (r: RideOption) => {
    if (!r.prefilled) kd.toast(fill(T.opening, { a: r.name }));
    void launch(r, ev.id, device ?? 'ios');
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(location.origin + location.pathname + '?ride=1'); kd.toast(T.linkCopied); } catch { /* nothing to copy into */ }
  };

  return (
    <Sheet onClose={onClose} title={T.title} closeLabel={T.close}>
      <div className="flex flex-col gap-3 pt-1">
        <p className="kd-s">{fill(T.to, { v: rides[0].copyText })}</p>
        {device === 'desktop' ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <QrCode value={`${location.origin}/e/${encodeURIComponent(ev.slug)}?ride=1`} label={T.qr} />
            <span className="kd-s">{T.scan}</span>
          </div>
        ) : device ? (
          <ul className="flex flex-col border-t border-line-1">
            {ordered.map((r) => (
              <li key={r.key}>
                <button type="button" className="kd-lrow min-h-14 w-full text-left" onClick={() => go(r)}>
                  <CarProfileIcon size={20} className="text-fg-1" aria-hidden="true" />
                  <span className="kd-h flex-1">{r.name}</span>
                  {r.key === pref ? <span className="kd-m">{T.last}</span> : null}
                  <CaretRightIcon size={16} className="text-fg-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {inApp ? (
          <div className="flex flex-col gap-2 rounded-card p-3 shadow-[inset_0_0_0_1px_var(--color-line-1)]">
            <span className="kd-s">{T.inApp}</span>
            <Button size="sm" className="self-start" onClick={copyLink}>{T.copyLink}</Button>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
