'use client';
/**
 * Studio › Hồ sơ › "Lịch" (growth plan card 1): the two lines that put the organiser's FeestFinder
 * calendar on their own website. (Connecting an existing calendar left with Radar, 2026-11-04.)
 */
import { useEffect, useState } from 'react';
import { CopyIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../copy';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { Segmented } from '../ui/forms';
import { copyText } from '../console/parts';
import { Block } from './parts';

const COPY = {
  title: { en: 'Calendar', vi: 'Lịch' },
  embed: { en: 'Embed on your website', vi: 'Nhúng vào website' },
  copy: { en: 'Copy', vi: 'Sao chép' },
  dark: { en: 'Dark', vi: 'Tối' },
  light: { en: 'Light', vi: 'Sáng' },
  theme: { en: 'Background', vi: 'Nền' },
  language: { en: 'Language', vi: 'Ngôn ngữ' },
  preview: { en: 'Preview', vi: 'Xem trước' },
};

export function CalendarBlock({ lang, slug }: { lang: Lang; slug: string }) {
  const T = pick(COPY, lang);
  const kd = useKd();
  const [wlang, setWlang] = useState<Lang>(lang);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [preview, setPreview] = useState(false);
  const origin = typeof location === 'undefined' ? 'https://feestfinder.com' : location.origin;
  const snippet = `<div data-ff-org="${slug}" data-ff-lang="${wlang}" data-ff-theme="${theme}" data-ff-limit="6"></div>\n<script src="${origin}/ui/widget/ff-widget.js" async></script>`;
  return (
    <Block title={T.title}>
      <div className="flex flex-col gap-3">
        <h3 className="kd-hs">{T.embed}</h3>
        <div className="flex flex-wrap gap-3">
          <Segmented label={T.language} value={wlang} onChange={setWlang} options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} />
          <Segmented label={T.theme} value={theme} onChange={setTheme} options={[{ value: 'dark' as const, label: T.dark }, { value: 'light' as const, label: T.light }]} />
        </div>
        <pre className="kd-s whitespace-pre-wrap break-all rounded-card bg-white/5 p-3 text-fg-1" aria-label={T.embed}>{snippet}</pre>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => copyText(kd, lang, snippet)}><CopyIcon size={16} aria-hidden="true" />{T.copy}</Button>
          <Button size="sm" tone="ghost" aria-pressed={preview} onClick={() => setPreview(!preview)}>{T.preview}</Button>
        </div>
        {preview ? <WidgetPreview key={wlang + theme} slug={slug} lang={wlang} theme={theme} /> : null}
      </div>
    </Block>
  );
}

/** The widget itself, drawn here as on the organiser's site (its own Shadow DOM keeps the styles apart). */
function WidgetPreview({ slug, lang, theme }: { slug: string; lang: Lang; theme: 'dark' | 'light' }) {
  useEffect(() => {
    const w = window as Window & { FeestFinderWidget?: { run: () => void } };
    if (w.FeestFinderWidget) { w.FeestFinderWidget.run(); return; }
    const s = document.createElement('script');
    s.src = '/ui/widget/ff-widget.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);
  return <div data-ff-org={slug} data-ff-lang={lang} data-ff-theme={theme} data-ff-limit="6" />;
}
