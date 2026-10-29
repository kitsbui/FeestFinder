'use client';
/**
 * Installing FeestFinder (growth plan card F, decisions D17 and D18): one strip on a phone after
 * the first visit, part of the frame (a solid bar right above the tab bar, never floating over the
 * page), once per device and 30 days after "✕"; an "Cài ứng dụng" row in "Tôi"; and the steps for
 * each browser: Chrome's own prompt where it has one, else ⋮ › "Thêm vào màn hình chính"; Share ›
 * "Thêm vào MH chính" on an iPhone; "Mở trong Safari" inside another app's browser.
 */
import { useEffect, useState } from 'react';
import { CaretRightIcon, CheckIcon, DotsThreeVerticalIcon, ExportIcon, PlusSquareIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { canPromptInstall, promptInstall } from '@/runtime/pwa';
import { pick, type Lang } from '../copy';
import { Button } from './actions';
import { dismissStrip, isInstalled, platformOf, type Platform } from './install-gate';
import { Sheet } from './sheet';

const COPY = {
  title: { en: 'Install FeestFinder', vi: 'Cài FeestFinder' },
  install: { en: 'Install', vi: 'Cài' },
  row: { en: 'Install the app', vi: 'Cài ứng dụng' },
  installed: { en: 'Installed', vi: 'Đã cài' },
  dismiss: { en: 'Not now', vi: 'Để sau' },
  close: { en: 'Close', vi: 'Đóng' },
  iosShare: { en: 'Tap Share in the bar below', vi: 'Bấm Chia sẻ ở thanh dưới' },
  iosAdd: { en: 'Choose “Add to Home Screen”', vi: 'Chọn “Thêm vào MH chính”' },
  add: { en: 'Tap Add', vi: 'Bấm Thêm' },
  androidMenu: { en: 'Tap ⋮ at the top', vi: 'Bấm ⋮ ở góc trên' },
  androidAdd: { en: 'Choose “Add to Home screen”', vi: 'Chọn “Thêm vào màn hình chính”' },
  desktopMenu: { en: 'Open the browser’s menu', vi: 'Mở menu của trình duyệt' },
  desktopAdd: { en: 'Choose “Install FeestFinder”', vi: 'Chọn “Cài đặt FeestFinder”' },
  webview: { en: 'Open in Safari to install', vi: 'Mở trong Safari để cài' },
  pushNote: { en: 'Once installed, notifications work', vi: 'Cài xong, thông báo hoạt động' },
};

/** What the install parts need: whether it is installed, which steps fit, and the tap. */
export function useInstall() {
  const [state, setState] = useState<{ installed: boolean; platform: Platform; native: boolean } | null>(null);
  useEffect(() => {
    const update = () => setState({ installed: isInstalled(), platform: platformOf(navigator.userAgent), native: canPromptInstall() });
    update();
    window.addEventListener('ff:installable', update);
    window.addEventListener('ff:installed', update);
    return () => { window.removeEventListener('ff:installable', update); window.removeEventListener('ff:installed', update); };
  }, []);
  return state;
}

export function InstallSheet({ lang, platform, onClose }: { lang: Lang; platform: Platform; onClose: () => void }) {
  const T = pick(COPY, lang);
  const steps = platform === 'ios'
    ? [[ExportIcon, T.iosShare], [PlusSquareIcon, T.iosAdd], [CheckIcon, T.add]] as const
    : platform === 'android'
      ? [[DotsThreeVerticalIcon, T.androidMenu], [PlusSquareIcon, T.androidAdd], [CheckIcon, T.add]] as const
      : [[DotsThreeVerticalIcon, T.desktopMenu], [PlusSquareIcon, T.desktopAdd], [CheckIcon, T.add]] as const;
  return (
    <Sheet title={T.title} closeLabel={T.close} onClose={onClose}>
      {platform === 'ios-webview' ? (
        <p className="kd-t pb-4">{T.webview}</p>
      ) : (
        <ol className="flex flex-col gap-3 pb-4">
          {steps.map(([Icon, text], i) => (
            <li key={i} className="flex min-h-12 items-center gap-3">
              <span className="kd-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-fg-1">{i + 1}</span>
              <Icon size={22} aria-hidden="true" />
              <span className="kd-t">{text}</span>
            </li>
          ))}
          {platform === 'ios' ? <li className="kd-s">{T.pushNote}</li> : null}
        </ol>
      )}
    </Sheet>
  );
}

/** Tap to install: the browser's prompt when it has one, else the steps. Returns whether a sheet should open. */
async function install(): Promise<boolean> {
  if (await promptInstall()) return false;
  FF.track('install_prompt', { kind: 'steps' });
  return true;
}

/** The phone's strip above the tab bar: the frame renders it only when it shows (install-gate.ts). */
export function InstallBar({ lang }: { lang: Lang }) {
  const T = pick(COPY, lang);
  const st = useInstall();
  const [show, setShow] = useState(true);
  const [sheet, setSheet] = useState(false);
  if (!st || !show || st.installed) return sheet && st ? <InstallSheet lang={lang} platform={st.platform} onClose={() => setSheet(false)} /> : null;
  const close = () => { dismissStrip(); setShow(false); };
  return (
    <>
      <div className="kd-install" role="region" aria-label={T.title}>
        <img src="/ui/assets/ff-appicon.svg" alt="" width={32} height={32} className="size-8 rounded-lg" />
        <span className="kd-hs min-w-0 flex-1 kd-ell">{T.title}</span>
        <Button size="sm" onClick={async () => { if (await install()) setSheet(true); }}>{T.install}</Button>
        <button type="button" className="kd-ib -mr-2" aria-label={T.dismiss} onClick={close}><XIcon size={18} aria-hidden="true" /></button>
      </div>
      {sheet ? <InstallSheet lang={lang} platform={st.platform} onClose={() => setSheet(false)} /> : null}
    </>
  );
}

/** "Cài ứng dụng" in "Tôi": the steps or the prompt; "Đã cài" in the installed app. */
export function InstallRow({ lang, className }: { lang: Lang; className?: string }) {
  const T = pick(COPY, lang);
  const st = useInstall();
  const [sheet, setSheet] = useState(false);
  if (!st) return null;
  if (st.installed) {
    return <div className={className ?? 'kd-lrow min-h-13'}><span className="kd-h min-w-0 flex-1 kd-ell">{T.row}</span><span className="kd-s">{T.installed}</span></div>;
  }
  return (
    <>
      <button type="button" className={className ?? 'kd-lrow min-h-13 w-full text-left'} onClick={async () => { if (await install()) setSheet(true); }}>
        <span className="kd-h min-w-0 flex-1 kd-ell">{T.row}</span>
        <CaretRightIcon size={16} className="shrink-0 text-fg-3" aria-hidden="true" />
      </button>
      {sheet ? <InstallSheet lang={lang} platform={st.platform} onClose={() => setSheet(false)} /> : null}
    </>
  );
}
