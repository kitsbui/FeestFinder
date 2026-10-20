'use client';
/**
 * Studio › Hồ sơ › "Lịch" (growth plan card 1): the two lines that put the organiser's FeestFinder
 * calendar on their own website, and an existing calendar (ICS, or a page with schema.org events)
 * connected so its nights come into Studio, waiting for review under their name.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { CopyIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { FieldLabel, Input, Segmented } from '../ui/forms';
import { copyText } from '../console/parts';
import { stamp } from '../console/kit';
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
  connect: { en: 'Connect an existing calendar', vi: 'Kết nối lịch có sẵn' },
  address: { en: 'Calendar address', vi: 'Địa chỉ lịch' },
  connectBtn: { en: 'Connect', vi: 'Kết nối' },
  disconnect: { en: 'Disconnect', vi: 'Ngắt' },
  lastRead: { en: 'Last read {t}', vi: 'Đọc lần cuối {t}' },
  inReview: { en: '{n} in review', vi: '{n} chờ duyệt' },
};

interface Calendar { url: string; lastReadAt: string | null; lastError: string | null; inReview: number }

export function CalendarBlock({ lang, slug }: { lang: Lang; slug: string }) {
  const T = pick(COPY, lang);
  const kd = useKd();
  const [wlang, setWlang] = useState<Lang>(lang);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [preview, setPreview] = useState(false);
  const [cal, setCal] = useState<Calendar | null | undefined>(undefined);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { FF.maybe(FF.get('/organizer/calendar'), { calendar: null }).then((r: { calendar: Calendar | null }) => setCal(r.calendar)); }, []);
  const origin = typeof location === 'undefined' ? 'https://feestfinder.com' : location.origin;
  const snippet = `<div data-ff-org="${slug}" data-ff-lang="${wlang}" data-ff-theme="${theme}" data-ff-limit="6"></div>\n<script src="${origin}/ui/widget/ff-widget.js" async></script>`;
  const connect = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await FF.post('/organizer/calendar', { url: url.trim() }) as { calendar: Calendar; message: unknown };
      setCal(r.calendar);
      setUrl('');
      kd.toast(FF.text(r.message, lang));
    } catch (err) { kd.toast(FF.errorText(err, lang)); } finally { setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true);
    try { await FF.del('/organizer/calendar'); setCal(null); } catch (err) { kd.toast(FF.errorText(err, lang)); } finally { setBusy(false); }
  };
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
      <div className="flex flex-col gap-3 border-t border-line-1 pt-4">
        <h3 className="kd-hs">{T.connect}</h3>
        {cal === undefined ? <div className="kd-skel h-12" aria-hidden="true" /> : cal ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex min-w-0 flex-col">
              <span className="kd-s kd-ell text-fg-1">{cal.url}</span>
              <span className="kd-s">{fill(T.lastRead, { t: stamp(cal.lastReadAt, lang) })} · {fill(T.inReview, { n: cal.inReview })}</span>
            </span>
            <Button size="sm" tone="ghost" disabled={busy} onClick={disconnect}>{T.disconnect}</Button>
          </div>
        ) : (
          <form onSubmit={connect} className="flex flex-col gap-2">
            <FieldLabel htmlFor="calUrl" hint="https://…">{T.address}</FieldLabel>
            <div className="flex flex-wrap gap-2">
              <Input id="calUrl" type="url" inputMode="url" className="min-w-0 flex-1" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
              <Button type="submit" tone="acc" disabled={busy || !url.trim()}>{T.connectBtn}</Button>
            </div>
          </form>
        )}
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
