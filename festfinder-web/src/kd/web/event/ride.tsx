'use client';
/**
 * "Đặt xe" on an event page: Grab and Green SM, the ride apps of the event's country
 * (festfinder-backend lib/rides.ts). On a phone a tap copies the venue's address (for the
 * destination field), counts the press, and opens the app: by its package on Android (the Play
 * Store page when it is missing), by its link on an iPhone (the App Store when nothing opened).
 * On a computer the sheet shows a QR code that opens this sheet on the phone (?ride=1).
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

/**
 * The button, and the sheet it opens. `row` draws it as one of the event's info rows (the app
 * screen). `fromLink` marks the one button of the page that opens itself on ?ride=1.
 */
export function RideButton({ lang, row, fromLink, size = 'sm', tone = 'ghost', className }: {
  lang: Lang; row?: boolean; fromLink?: boolean; size?: 'sm' | 'md'; tone?: 'ghost' | 'default'; className?: string;
}) {
  const T = pick(RIDE, lang);
  const { ev } = useEvent();
  const [open, setOpen] = useState(false);
  const rides = ev.rides ?? [];
  // A QR code from the computer opens the sheet on the phone.
  useEffect(() => {
    if (fromLink && rides.length && new URLSearchParams(location.search).get('ride') === '1') setOpen(true);
  }, [fromLink, rides.length]);
  if (!rides.length) return null;
  return (
    <>
      {row ? (
        <button type="button" className="kd-lrow min-h-13 w-full text-left" onClick={() => setOpen(true)}>
          <CarProfileIcon size={18} className="text-fog" aria-hidden="true" />
          <span className="kd-t flex-1 text-paper">{T.title}</span>
          <CaretRightIcon size={16} className="text-fog" aria-hidden="true" />
        </button>
      ) : (
        <button type="button" className={buttonClass({ tone, size }, className)} onClick={() => setOpen(true)}>
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
  useEffect(() => { setDevice(deviceOf()); setInApp(inAppBrowser()); }, []);

  const go = async (r: RideOption) => {
    try { await navigator.clipboard.writeText(r.copyText); } catch { /* the toast still says where to go */ }
    // Counted for the organiser (one per person every half hour), and in product analytics.
    FF.fire(FF.post('/events/' + ev.id + '/track', { type: 'ride_click' }));
    FF.track('ride_click', { kind: r.key, surface: location.pathname.startsWith('/app') ? 'app_event' : 'web_event' });
    if (!r.prefilled) kd.toast(T.copied);
    if (device === 'android') { location.href = r.android; return; }
    location.href = r.ios.app;
    // Nothing opened (the app is not installed): its App Store page instead.
    setTimeout(() => { if (document.visibilityState === 'visible') location.href = r.ios.store; }, 1400);
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
          <ul className="flex flex-col border-t border-line">
            {rides.map((r) => (
              <li key={r.key}>
                <button type="button" className="kd-lrow min-h-14 w-full text-left" onClick={() => go(r)}>
                  <CarProfileIcon size={20} className="text-paper" aria-hidden="true" />
                  <span className="kd-h flex-1">{r.name}</span>
                  <CaretRightIcon size={16} className="text-fog" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {inApp ? (
          <div className="flex flex-col gap-2 rounded-card p-3 shadow-[inset_0_0_0_1px_var(--color-line)]">
            <span className="kd-s">{T.inApp}</span>
            <Button size="sm" className="self-start" onClick={copyLink}>{T.copyLink}</Button>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
